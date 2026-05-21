const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const BOOKING_ITEM_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    RENTING: 'RENTING',
    RETURNED: 'RETURNED',
    DAMAGED: 'DAMAGED',
    CANCELLED: 'CANCELLED',
};

const bookingItemSchema = mongoose.Schema(
    {
        bookingId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking là bắt buộc'],
        },
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Product',
            required: [true, 'Product là bắt buộc'],
        },
        variantId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ProductVariant',
            required: [true, 'Variant là bắt buộc'],
        },
        inventoryItemId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryItem',
            default: null,
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc'],
        },
        rentalDays: {
            type: Number,
            required: true,
            min: 1,
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        depositAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        cleaningFee: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        itemStatus: {
            type: String,
            enum: {
                values: Object.values(BOOKING_ITEM_STATUS),
                message: `Trạng thái item phải là: ${Object.values(BOOKING_ITEM_STATUS).join(', ')}`,
            },
            default: BOOKING_ITEM_STATUS.PENDING,
        },
    },
    {
        timestamps: true,
    }
);

bookingItemSchema.index({ bookingId: 1 });
bookingItemSchema.index({ variantId: 1, itemStatus: 1, startDate: 1, endDate: 1 });
bookingItemSchema.index({ inventoryItemId: 1 });

bookingItemSchema.plugin(toJSON);
bookingItemSchema.plugin(paginate);

const BookingItem = mongoose.model('BookingItem', bookingItemSchema);

module.exports = BookingItem;
module.exports.BOOKING_ITEM_STATUS = BOOKING_ITEM_STATUS;
