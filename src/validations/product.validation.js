const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createProduct = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().max(200).messages({
            'string.empty': 'Tên sản phẩm không được để trống',
            'any.required': 'Tên sản phẩm là bắt buộc'
        }),

        description: Joi.string().trim().allow('').default(''),

        categoryId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Danh mục là bắt buộc'
        }),

        images: Joi.array().items(Joi.string().uri()).default([]),

        thumbnailUrl: Joi.string().uri().allow('').default(''),

        color: Joi.array().items(Joi.string().trim()).default([]),

        style: Joi.string().trim().allow('').default(''),

        tags: Joi.array().items(Joi.string().trim()).default([]),

        rentalPricePerDay: Joi.number().required().min(0).messages({
            'number.min': 'Giá thuê không được âm',
            'any.required': 'Giá thuê là bắt buộc'
        }),

        depositAmount: Joi.number().min(0).default(0),

        cleaningFee: Joi.number().min(0).default(0),

        lateFeePerDay: Joi.number().min(0).default(0),

        status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
    })
};

const updateProduct = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        name: Joi.string().trim().max(200),
        description: Joi.string().trim().allow(''),
        categoryId: Joi.string().custom(objectId),
        images: Joi.array().items(Joi.string().uri()),
        thumbnailUrl: Joi.string().uri().allow(''),
        color: Joi.array().items(Joi.string().trim()),
        style: Joi.string().trim().allow(''),
        tags: Joi.array().items(Joi.string().trim()),
        rentalPricePerDay: Joi.number().min(0),
        depositAmount: Joi.number().min(0),
        cleaningFee: Joi.number().min(0),
        lateFeePerDay: Joi.number().min(0),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DELETED')
    }).min(1)
};

const getProduct = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    })
};

const getProductBySlug = {
    params: Joi.object().keys({
        slug: Joi.string().required()
    })
};

const deleteProduct = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    })
};

const queryProducts = {
    query: Joi.object().keys({
        keyword: Joi.string().trim().allow(''),
        categoryId: Joi.string().custom(objectId),
        categorySlug: Joi.string().trim(),
        size: Joi.string().trim().uppercase(),
        color: Joi.string().trim(),
        style: Joi.string().trim(),
        tags: Joi.string().trim(), // comma-separated: "casual,vintage"
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
        sortBy: Joi.string()
            .valid('createdAt:desc', 'createdAt:asc', 'rentalPricePerDay:asc', 'rentalPricePerDay:desc', 'averageRating:desc')
            .default('createdAt:desc'),
        limit: Joi.number().integer().min(1).max(100).default(12),
        page: Joi.number().integer().min(1).default(1)
    })
};

const uploadProductImages = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    })
};

const deleteProductImage = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        imageUrl: Joi.string().uri().required().messages({
            'string.uri': 'URL ảnh không hợp lệ',
            'any.required': 'URL ảnh là bắt buộc'
        })
    })
};

module.exports = {
    createProduct,
    updateProduct,
    getProduct,
    getProductBySlug,
    deleteProduct,
    queryProducts,
    uploadProductImages,
    deleteProductImage,
};
