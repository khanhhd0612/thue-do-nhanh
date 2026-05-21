const mongoose = require('mongoose');
const slugify = require('slugify');
const { toJSON, paginate } = require('./plugins');

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên danh mục là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên danh mục không quá 100 ký tự'],
            unique: true
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
            maxlength: [500, 'Mô tả không quá 500 ký tự'],
            default: ''
        },

        image: {
            type: String,
            default: ''
        },

        isActive: {
            type: Boolean,
            default: true
        },

        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

categorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi'
        });
    }

    next();
});

categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;