const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const VARIANT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
};

const productVariantSchema = mongoose.Schema(
    {
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Product',
            required: [true, 'Product là bắt buộc']
        },

        sku: {
            type: String,
            required: [true, 'SKU là bắt buộc'],
            trim: true,
            uppercase: true,
            unique: true,
            maxlength: [50, 'SKU không quá 50 ký tự']
        },

        size: {
            type: String,
            required: [true, 'Size là bắt buộc'],
            trim: true,
            uppercase: true
        },

        color: {
            type: String,
            trim: true,
            default: ''
        },

        variantName: {
            type: String,
            trim: true,
            default: ''
            // Ví dụ: "Váy trắng - Size M"
        },

        // Phụ phí so với sản phẩm gốc 
        extraPricePerDay: {
            type: Number,
            default: 0
        },

        extraDeposit: {
            type: Number,
            default: 0
        },

        // Tổng số lượng item thật của variant này
        totalQuantity: {
            type: Number,
            required: [true, 'Số lượng là bắt buộc'],
            min: [0, 'Số lượng không được âm'],
            default: 1
        },

        status: {
            type: String,
            enum: {
                values: Object.values(VARIANT_STATUS),
                message: `Trạng thái phải là: ${Object.values(VARIANT_STATUS).join(', ')}`
            },
            default: VARIANT_STATUS.ACTIVE
        }
    },
    {
        timestamps: true
    }
);

productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ productId: 1, size: 1 });
productVariantSchema.index({ status: 1 });

productVariantSchema.plugin(toJSON);
productVariantSchema.plugin(paginate);

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = ProductVariant;
module.exports.VARIANT_STATUS = VARIANT_STATUS;