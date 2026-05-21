const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const BOOKING_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    CONFIRMED: 'CONFIRMED',
    RENTING: 'RENTING',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED',
    LATE: 'LATE',
    DAMAGED: 'DAMAGED',
};

const bookingSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: [true, 'User là bắt buộc'],
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc'],
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
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
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: {
                values: Object.values(BOOKING_STATUS),
                message: `Trạng thái phải là: ${Object.values(BOOKING_STATUS).join(', ')}`,
            },
            default: BOOKING_STATUS.PAID,
        },
        idempotencyKey: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        cancelReason: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
module.exports.BOOKING_STATUS = BOOKING_STATUS;
