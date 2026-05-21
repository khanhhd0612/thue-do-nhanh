const Joi = require('joi');
const { objectId } = require('./custom.validation');

const mongoId = Joi.string().custom(objectId).required();
const mongoIdOptional = Joi.string().custom(objectId);

const createCategory = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().max(100).messages({
            'string.empty': 'Tên danh mục không được để trống',
            'string.max': 'Tên danh mục không quá 100 ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),

        description: Joi.string().trim().max(500).allow('').default('').messages({
            'string.max': 'Mô tả không quá 500 ký tự'
        }),

        image: Joi.string().uri().allow('').messages({
            'string.uri': 'URL ảnh không hợp lệ'
        }),

        isActive: Joi.boolean().default(true),

        sortOrder: Joi.number().integer().min(0).default(0)
    })
};

const updateCategory = {
    params: Joi.object().keys({
        categoryId: mongoId
    }),

    body: Joi.object().keys({
        name: Joi.string().trim().max(100).messages({
            'string.max': 'Tên danh mục không quá 100 ký tự'
        }),
        description: Joi.string().trim().max(500).allow(''),
        image: Joi.string().uri().allow(''),
        isActive: Joi.boolean(),
        sortOrder: Joi.number().integer().min(0)
    }).min(1).messages({
        'object.min': 'Cần ít nhất 1 trường để cập nhật'
    })
};

const getCategoryBySlug = {
    params: Joi.object().keys({
        slug: Joi.string().required()
    }),
};

const getCategoryById = {
    params: Joi.object().keys({
        categoryId: mongoId
    })
};

module.exports = {
    createCategory,
    updateCategory,
    getCategoryById,
    getCategoryBySlug,
};