const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ITEM_STATUS = {
    AVAILABLE: 'AVAILABLE',
    RESERVED: 'RESERVED',
    RENTING: 'RENTING',
    CLEANING: 'CLEANING',
    MAINTENANCE: 'MAINTENANCE',
    LOST: 'LOST',
    DAMAGED: 'DAMAGED'
};

const ITEM_CONDITION = {
    NEW: 'NEW',
    GOOD: 'GOOD',
    WORN: 'WORN',
    DAMAGED: 'DAMAGED'
};

const inventoryItemSchema = mongoose.Schema(
    {
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Product',
            required: [true, 'Product là bắt buộc']
        },

        variantId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ProductVariant',
            required: [true, 'Variant là bắt buộc']
        },

        itemCode: {
            type: String,
            required: [true, 'Mã item là bắt buộc'],
            trim: true,
            uppercase: true,
            unique: true
        },

        qrCodeUrl: {
            type: String,
            default: ''
        },

        condition: {
            type: String,
            enum: {
                values: Object.values(ITEM_CONDITION),
                message: `Tình trạng phải là: ${Object.values(ITEM_CONDITION).join(', ')}`
            },
            default: ITEM_CONDITION.NEW
        },

        status: {
            type: String,
            enum: {
                values: Object.values(ITEM_STATUS),
                message: `Trạng thái phải là: ${Object.values(ITEM_STATUS).join(', ')}`
            },
            default: ITEM_STATUS.AVAILABLE
        },

        currentBookingId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Booking',
            default: null
        },

        note: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

inventoryItemSchema.index({ productId: 1 });
inventoryItemSchema.index({ variantId: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ variantId: 1, status: 1 });

inventoryItemSchema.plugin(toJSON);
inventoryItemSchema.plugin(paginate);

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;
module.exports.ITEM_STATUS = ITEM_STATUS;
module.exports.ITEM_CONDITION = ITEM_CONDITION;