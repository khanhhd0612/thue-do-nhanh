const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createVariant = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        sku: Joi.string().required().trim().uppercase().max(50).messages({
            'any.required': 'SKU là bắt buộc',
            'string.empty': 'SKU không được để trống'
        }),

        size: Joi.string().required().trim().uppercase().messages({
            'any.required': 'Size là bắt buộc'
        }),

        color: Joi.string().trim().allow('').default(''),

        variantName: Joi.string().trim().allow('').default(''),

        extraPricePerDay: Joi.number().default(0),

        extraDeposit: Joi.number().default(0),

        totalQuantity: Joi.number().integer().min(0).required().messages({
            'any.required': 'Số lượng là bắt buộc',
            'number.min': 'Số lượng không được âm'
        }),

        status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
    })
};

const updateVariant = {
    params: Joi.object().keys({
        variantId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        sku: Joi.string().trim().uppercase().max(50),
        size: Joi.string().trim().uppercase(),
        color: Joi.string().trim().allow(''),
        variantName: Joi.string().trim().allow(''),
        extraPricePerDay: Joi.number(),
        extraDeposit: Joi.number(),
        totalQuantity: Joi.number().integer().min(0),
        status: Joi.string().valid('ACTIVE', 'INACTIVE')
    }).min(1)
};

const deleteVariant = {
    params: Joi.object().keys({
        variantId: Joi.string().custom(objectId).required()
    })
};

const getVariantsByProduct = {
    params: Joi.object().keys({
        productId: Joi.string().custom(objectId).required()
    })
};

module.exports = {
    // Variant
    createVariant,
    updateVariant,
    deleteVariant,
    getVariantsByProduct,
};