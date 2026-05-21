const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const BookingItem = require('../models/bookingItem.model');
const Product = require('../models/product.model');
const ProductVariant = require('../models/productVariant.model');
const InventoryItem = require('../models/inventoryItem.model');
const ApiError = require('../utils/ApiError');

const { BOOKING_STATUS } = Booking;
const { BOOKING_ITEM_STATUS } = BookingItem;
const { ITEM_STATUS } = InventoryItem;

const ACTIVE_ITEM_STATUSES = [
    BOOKING_ITEM_STATUS.CONFIRMED,
    BOOKING_ITEM_STATUS.RENTING,
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeDate = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const calculateRentalDays = (startDate, endDate) => {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    return Math.max(1, Math.ceil((end - start) / MS_PER_DAY) + 1);
};

const getOverlapQuery = (startDate, endDate) => ({
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
});

const buildCartItems = async (items, session) => {
    const results = [];

    for (const item of items) {
        const variant = await ProductVariant.findOne({ _id: item.variantId, status: 'ACTIVE' }).session(session);
        if (!variant) {
            throw new ApiError(404, `Variant ${item.variantId} không tồn tại hoặc không active`);
        }

        const productId = item.productId || variant.productId;
        const product = await Product.findOne({ _id: productId, status: 'ACTIVE' }).session(session);
        if (!product) {
            throw new ApiError(404, `Sản phẩm ${productId} không tồn tại hoặc không active`);
        }

        if (String(variant.productId) !== String(product._id)) {
            throw new ApiError(400, `Variant ${item.variantId} không thuộc sản phẩm ${product._id}`);
        }

        const startDate = normalizeDate(item.startDate);
        const endDate = normalizeDate(item.endDate);
        const rentalDays = calculateRentalDays(startDate, endDate);
        const pricePerDay = product.rentalPricePerDay + (variant.extraPricePerDay || 0);
        const depositAmount = product.depositAmount + (variant.extraDeposit || 0);
        const cleaningFee = product.cleaningFee || 0;

        results.push({
            productId: product._id,
            variantId: variant._id,
            startDate,
            endDate,
            rentalDays,
            pricePerDay,
            subtotal: pricePerDay * rentalDays,
            depositAmount,
            cleaningFee,
            variantQuantity: variant.totalQuantity,
            productName: product.name,
            sku: variant.sku,
        });
    }

    return results;
};

const getAvailabilityForItems = async (items, session) => {
    const cartItems = await buildCartItems(items, session);
    const availability = [];

    for (const item of cartItems) {
        const bookedCount = await BookingItem.countDocuments({
            variantId: item.variantId,
            itemStatus: { $in: ACTIVE_ITEM_STATUSES },
            ...getOverlapQuery(item.startDate, item.endDate),
        }).session(session);

        const requestedCount = cartItems.filter((cartItem) =>
            String(cartItem.variantId) === String(item.variantId)
            && cartItem.startDate <= item.endDate
            && cartItem.endDate >= item.startDate
        ).length;

        const availableQuantity = item.variantQuantity - bookedCount;
        availability.push({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            startDate: item.startDate,
            endDate: item.endDate,
            totalQuantity: item.variantQuantity,
            bookedCount,
            requestedCount,
            availableQuantity,
            available: availableQuantity >= requestedCount,
        });
    }

    return availability;
};

const checkAvailability = async (items) => {
    const results = await getAvailabilityForItems(items);
    return {
        available: results.every((item) => item.available),
        items: results,
    };
};

const createBooking = async (userId, body) => {
    const existingBooking = await Booking.findOne({ idempotencyKey: body.idempotencyKey });
    if (existingBooking) {
        if (String(existingBooking.userId) !== String(userId)) {
            throw new ApiError(409, 'Idempotency key đã được sử dụng');
        }

        const items = await BookingItem.find({ bookingId: existingBooking._id });
        return { booking: existingBooking, items, duplicated: true };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const availability = await getAvailabilityForItems(body.items, session);
        const unavailableItem = availability.find((item) => !item.available);
        if (unavailableItem) {
            throw new ApiError(409, `Variant ${unavailableItem.sku} không đủ lịch trống`);
        }

        const cartItems = await buildCartItems(body.items, session);
        const startDate = new Date(Math.min(...cartItems.map((item) => item.startDate.getTime())));
        const endDate = new Date(Math.max(...cartItems.map((item) => item.endDate.getTime())));
        const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
        const depositAmount = cartItems.reduce((sum, item) => sum + item.depositAmount, 0);
        const cleaningFee = cartItems.reduce((sum, item) => sum + item.cleaningFee, 0);

        const [booking] = await Booking.create([{
            userId,
            startDate,
            endDate,
            subtotal,
            depositAmount,
            cleaningFee,
            totalAmount: subtotal + depositAmount + cleaningFee,
            status: BOOKING_STATUS.PAID,
            idempotencyKey: body.idempotencyKey,
            note: body.note || '',
        }], { session });

        const bookingItems = await BookingItem.create(
            cartItems.map((item) => ({
                bookingId: booking._id,
                productId: item.productId,
                variantId: item.variantId,
                startDate: item.startDate,
                endDate: item.endDate,
                rentalDays: item.rentalDays,
                pricePerDay: item.pricePerDay,
                subtotal: item.subtotal,
                depositAmount: item.depositAmount,
                cleaningFee: item.cleaningFee,
                itemStatus: BOOKING_ITEM_STATUS.PENDING,
            })),
            { session }
        );

        await session.commitTransaction();
        return { booking, items: bookingItems, duplicated: false };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const getBookingById = async (bookingId, user) => {
    const query = { _id: bookingId };
    if (user.role !== 'admin') query.userId = user.id;

    const booking = await Booking.findOne(query).populate('userId', 'firstName lastName email phone');
    if (!booking) throw new ApiError(404, 'Booking không tồn tại');

    return booking;
};

const getBookingItems = async (bookingId, user) => {
    await getBookingById(bookingId, user);

    return BookingItem.find({ bookingId })
        .populate('productId', 'name thumbnailUrl')
        .populate('variantId', 'sku size color')
        .populate('inventoryItemId', 'itemCode status condition');
};

const getMyBookings = async (userId, options) => {
    const { status, page = 1, limit = 20, sortBy = 'createdAt:desc' } = options;
    const filter = { userId };
    if (status) filter.status = status;

    return Booking.paginate(filter, { page, limit, sortBy });
};

const getAllBookings = async (options) => {
    const { userId, status, page = 1, limit = 20, sortBy = 'createdAt:desc' } = options;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    return Booking.paginate(filter, {
        page,
        limit,
        sortBy,
        populate: { path: 'userId', select: 'firstName lastName email phone' },
    });
};

const syncBookingStatus = async (bookingId, session) => {
    const items = await BookingItem.find({ bookingId }).session(session);
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking || booking.status === BOOKING_STATUS.CANCELLED) return booking;

    if (items.some((item) => item.itemStatus === BOOKING_ITEM_STATUS.DAMAGED)) {
        booking.status = BOOKING_STATUS.DAMAGED;
    } else if (items.every((item) => item.itemStatus === BOOKING_ITEM_STATUS.RETURNED)) {
        booking.status = BOOKING_STATUS.RETURNED;
    } else if (items.some((item) => item.itemStatus === BOOKING_ITEM_STATUS.RENTING)) {
        booking.status = BOOKING_STATUS.RENTING;
    } else if (items.every((item) => item.itemStatus === BOOKING_ITEM_STATUS.CONFIRMED)) {
        booking.status = BOOKING_STATUS.CONFIRMED;
    } else if (items.some((item) => item.itemStatus === BOOKING_ITEM_STATUS.CONFIRMED)) {
        booking.status = BOOKING_STATUS.PAID;
    }

    await booking.save({ session });
    return booking;
};

const cancelBooking = async (bookingId, user, cancelReason = '') => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await getBookingById(bookingId, user);
        if ([BOOKING_STATUS.RETURNED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
            throw new ApiError(400, 'Không thể hủy booking ở trạng thái hiện tại');
        }

        const items = await BookingItem.find({ bookingId: booking._id }).session(session);
        const assignedItemIds = items.map((item) => item.inventoryItemId).filter(Boolean);

        await BookingItem.updateMany(
            { bookingId: booking._id, itemStatus: { $nin: [BOOKING_ITEM_STATUS.RETURNED, BOOKING_ITEM_STATUS.DAMAGED] } },
            { itemStatus: BOOKING_ITEM_STATUS.CANCELLED },
            { session }
        );

        if (assignedItemIds.length) {
            await InventoryItem.updateMany(
                { _id: { $in: assignedItemIds } },
                { status: ITEM_STATUS.AVAILABLE, currentBookingId: null },
                { session }
            );
        }

        booking.status = BOOKING_STATUS.CANCELLED;
        booking.cancelReason = cancelReason;
        await booking.save({ session });

        await session.commitTransaction();
        return booking;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updateBookingStatus = async (bookingId, status) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, 'Booking không tồn tại');

    booking.status = status;
    await booking.save();
    return booking;
};

const assignInventoryItem = async (bookingId, bookingItemId, inventoryItemId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bookingItem = await BookingItem.findOne({ _id: bookingItemId, bookingId }).session(session);
        if (!bookingItem) throw new ApiError(404, 'Booking item không tồn tại');
        if (bookingItem.itemStatus === BOOKING_ITEM_STATUS.CANCELLED) {
            throw new ApiError(400, 'Không thể gán item cho booking item đã hủy');
        }

        const inventoryItem = await InventoryItem.findOne({
            _id: inventoryItemId,
            productId: bookingItem.productId,
            variantId: bookingItem.variantId,
        }).session(session);

        if (!inventoryItem) throw new ApiError(404, 'Inventory item không tồn tại hoặc không khớp variant');
        if (inventoryItem.status !== ITEM_STATUS.AVAILABLE) {
            throw new ApiError(400, 'Inventory item không khả dụng');
        }

        if (bookingItem.inventoryItemId && String(bookingItem.inventoryItemId) !== String(inventoryItemId)) {
            await InventoryItem.updateOne(
                { _id: bookingItem.inventoryItemId },
                { status: ITEM_STATUS.AVAILABLE, currentBookingId: null },
                { session }
            );
        }

        bookingItem.inventoryItemId = inventoryItem._id;
        bookingItem.itemStatus = BOOKING_ITEM_STATUS.CONFIRMED;
        await bookingItem.save({ session });

        inventoryItem.status = ITEM_STATUS.RESERVED;
        inventoryItem.currentBookingId = bookingId;
        await inventoryItem.save({ session });

        const booking = await syncBookingStatus(bookingId, session);
        await session.commitTransaction();

        return { booking, item: bookingItem };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updateBookingItemStatus = async (bookingId, bookingItemId, itemStatus) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bookingItem = await BookingItem.findOne({ _id: bookingItemId, bookingId }).session(session);
        if (!bookingItem) throw new ApiError(404, 'Booking item không tồn tại');

        bookingItem.itemStatus = itemStatus;
        await bookingItem.save({ session });

        if (bookingItem.inventoryItemId) {
            const inventoryUpdates = {
                [BOOKING_ITEM_STATUS.CONFIRMED]: ITEM_STATUS.RESERVED,
                [BOOKING_ITEM_STATUS.RENTING]: ITEM_STATUS.RENTING,
                [BOOKING_ITEM_STATUS.RETURNED]: ITEM_STATUS.CLEANING,
                [BOOKING_ITEM_STATUS.DAMAGED]: ITEM_STATUS.DAMAGED,
                [BOOKING_ITEM_STATUS.CANCELLED]: ITEM_STATUS.AVAILABLE,
            };

            const update = { status: inventoryUpdates[itemStatus] };
            if ([BOOKING_ITEM_STATUS.RETURNED, BOOKING_ITEM_STATUS.CANCELLED].includes(itemStatus)) {
                update.currentBookingId = null;
            } else {
                update.currentBookingId = bookingId;
            }

            await InventoryItem.updateOne({ _id: bookingItem.inventoryItemId }, update, { session });
        }

        const booking = await syncBookingStatus(bookingId, session);
        await session.commitTransaction();

        return { booking, item: bookingItem };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    checkAvailability,
    createBooking,
    getBookingById,
    getBookingItems,
    getMyBookings,
    getAllBookings,
    cancelBooking,
    updateBookingStatus,
    assignInventoryItem,
    updateBookingItemStatus,
};
