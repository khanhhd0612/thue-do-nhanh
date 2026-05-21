const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createInventoryItem = {
    body: Joi.object().keys({
        productId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Product là bắt buộc'
        }),

        variantId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Variant là bắt buộc'
        }),

        itemCode: Joi.string().required().trim().uppercase().messages({
            'any.required': 'Mã item là bắt buộc',
            'string.empty': 'Mã item không được để trống'
        }),

        condition: Joi.string().valid('NEW', 'GOOD', 'WORN', 'DAMAGED').default('NEW'),

        note: Joi.string().trim().allow('').default('')
    })
};

const updateInventoryItem = {
    params: Joi.object().keys({
        itemId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        condition: Joi.string().valid('NEW', 'GOOD', 'WORN', 'DAMAGED'),
        note: Joi.string().trim().allow('')
    }).min(1)
};

const updateInventoryItemStatus = {
    params: Joi.object().keys({
        itemId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        status: Joi.string()
            .valid('AVAILABLE', 'RESERVED', 'RENTING', 'CLEANING', 'MAINTENANCE', 'LOST', 'DAMAGED')
            .required()
            .messages({
                'any.required': 'Trạng thái là bắt buộc',
                'any.only': 'Trạng thái không hợp lệ'
            }),
        note: Joi.string().trim().allow('')
    })
};

const deleteInventoryItem = {
    params: Joi.object().keys({
        itemId: Joi.string().custom(objectId).required()
    })
};

const queryInventory = {
    query: Joi.object().keys({
        productId: Joi.string().custom(objectId),
        variantId: Joi.string().custom(objectId),
        status: Joi.string().valid('AVAILABLE', 'RESERVED', 'RENTING', 'CLEANING', 'MAINTENANCE', 'LOST', 'DAMAGED'),
        condition: Joi.string().valid('NEW', 'GOOD', 'WORN', 'DAMAGED'),
        limit: Joi.number().integer().min(1).max(100).default(20),
        page: Joi.number().integer().min(1).default(1)
    })
};

module.exports = {
    createInventoryItem,
    updateInventoryItem,
    updateInventoryItemStatus,
    deleteInventoryItem,
    queryInventory
};