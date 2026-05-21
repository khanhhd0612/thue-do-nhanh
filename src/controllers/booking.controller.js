const catchAsync = require('../utils/catchAsync');
const bookingService = require('../services/booking.service');

const normalizeAvailabilityBody = (body) => (Array.isArray(body) ? body : body.items);

const checkAvailability = catchAsync(async (req, res) => {
    const result = await bookingService.checkAvailability(normalizeAvailabilityBody(req.body));

    return res.status(200).json({
        status: 'success',
        message: 'Kiểm tra lịch trống thành công',
        data: result,
    });
});

const createBooking = catchAsync(async (req, res) => {
    const result = await bookingService.createBooking(req.user.id, req.body);

    return res.status(result.duplicated ? 200 : 201).json({
        status: 'success',
        message: result.duplicated ? 'Booking đã tồn tại theo idempotency key' : 'Tạo booking thành công',
        data: result,
    });
});

const getMyBookings = catchAsync(async (req, res) => {
    const result = await bookingService.getMyBookings(req.user.id, req.query);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách booking thành công',
        data: result,
    });
});

const getAllBookings = catchAsync(async (req, res) => {
    const result = await bookingService.getAllBookings(req.query);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách booking thành công',
        data: result,
    });
});

const getBookingById = catchAsync(async (req, res) => {
    const booking = await bookingService.getBookingById(req.params.bookingId, req.user);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy booking thành công',
        data: { booking },
    });
});

const getBookingItems = catchAsync(async (req, res) => {
    const items = await bookingService.getBookingItems(req.params.bookingId, req.user);

    return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách booking item thành công',
        data: { items },
    });
});

const cancelBooking = catchAsync(async (req, res) => {
    const booking = await bookingService.cancelBooking(req.params.bookingId, req.user, req.body.cancelReason);

    return res.status(200).json({
        status: 'success',
        message: 'Hủy booking thành công',
        data: { booking },
    });
});

const updateBookingStatus = catchAsync(async (req, res) => {
    const booking = await bookingService.updateBookingStatus(req.params.bookingId, req.body.status);

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật trạng thái booking thành công',
        data: { booking },
    });
});

const assignInventoryItem = catchAsync(async (req, res) => {
    const result = await bookingService.assignInventoryItem(
        req.params.bookingId,
        req.params.itemId,
        req.body.inventoryItemId
    );

    return res.status(200).json({
        status: 'success',
        message: 'Gán inventory item thành công',
        data: result,
    });
});

const updateBookingItemStatus = catchAsync(async (req, res) => {
    const result = await bookingService.updateBookingItemStatus(
        req.params.bookingId,
        req.params.itemId,
        req.body.itemStatus
    );

    return res.status(200).json({
        status: 'success',
        message: 'Cập nhật trạng thái booking item thành công',
        data: result,
    });
});

module.exports = {
    checkAvailability,
    createBooking,
    getMyBookings,
    getAllBookings,
    getBookingById,
    getBookingItems,
    cancelBooking,
    updateBookingStatus,
    assignInventoryItem,
    updateBookingItemStatus,
};
