const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { default: slugify } = require('slugify');

const PRODUCT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    DELETED: 'DELETED'
};

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên sản phẩm là bắt buộc'],
            trim: true,
            maxlength: [200, 'Tên sản phẩm không quá 200 ký tự']
        },

        slug: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true
        },

        description: {
            type: String,
            trim: true,
            default: ''
        },

        categoryId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Category',
            required: [true, 'Danh mục là bắt buộc']
        },

        // Ảnh
        images: {
            type: [String],
            default: []
        },

        thumbnailUrl: {
            type: String,
            default: ''
        },

        // Thuộc tính phong cách
        color: {
            type: [String],
            default: []
        },

        style: {
            type: String,
            trim: true,
            default: ''
        },

        tags: {
            type: [String],
            default: []
        },

        // Giá cho thuê
        rentalPricePerDay: {
            type: Number,
            required: [true, 'Giá thuê mỗi ngày là bắt buộc'],
            min: [0, 'Giá thuê không được âm']
        },

        depositAmount: {
            type: Number,
            required: [true, 'Tiền cọc là bắt buộc'],
            min: [0, 'Tiền cọc không được âm'],
            default: 0
        },

        cleaningFee: {
            type: Number,
            min: [0, 'Phí giặt ủi không được âm'],
            default: 0
        },

        lateFeePerDay: {
            type: Number,
            min: [0, 'Phí trả trễ không được âm'],
            default: 0
        },

        // Rating aggregate (cập nhật sau mỗi review)
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        reviewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Vector embedding cho Visual Search (FashionCLIP 512-dim)
        imageEmbedding: {
            type: [Number],
            default: [],
            select: false // Không trả về mặc định, chỉ dùng nội bộ
        },

        status: {
            type: String,
            enum: {
                values: Object.values(PRODUCT_STATUS),
                message: `Trạng thái phải là: ${Object.values(PRODUCT_STATUS).join(', ')}`
            },
            default: PRODUCT_STATUS.ACTIVE
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ rentalPricePerDay: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ color: 1 });
productSchema.index({ style: 1 });

productSchema.index(
    { name: 'text', description: 'text', tags: 'text' },
    { weights: { name: 10, tags: 5, description: 1 } }
);

productSchema.pre('save', async function (next) {
    if (!this.isModified('name')) return next();

    try {
        const baseSlug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi'
        });

        let slug = baseSlug;
        let counter = 1;

        while (
            await mongoose.models.Product.exists({
                slug,
                _id: { $ne: this._id }
            })
        ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        this.slug = slug;

        next();
    } catch (error) {
        next(error);
    }
});

productSchema.plugin(toJSON);
productSchema.plugin(paginate);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;