const Joi = require('joi');
const { objectId } = require('./custom.validation');

const bookingStatuses = ['PENDING', 'PAID', 'CONFIRMED', 'RENTING', 'RETURNED', 'CANCELLED', 'LATE', 'DAMAGED'];
const bookingItemStatuses = ['PENDING', 'CONFIRMED', 'RENTING', 'RETURNED', 'DAMAGED', 'CANCELLED'];

const cartItem = Joi.object().keys({
    productId: Joi.string().custom(objectId),
    variantId: Joi.string().custom(objectId).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
});

const checkAvailability = {
    body: Joi.alternatives().try(
        Joi.array().items(cartItem).min(1).required(),
        Joi.object().keys({
            items: Joi.array().items(cartItem).min(1).required(),
        })
    ),
};

const createBooking = {
    body: Joi.object().keys({
        idempotencyKey: Joi.string().trim().max(200).required(),
        items: Joi.array().items(cartItem).min(1).required(),
        note: Joi.string().trim().allow('').default(''),
    }),
};

const queryBookings = {
    query: Joi.object().keys({
        userId: Joi.string().custom(objectId),
        status: Joi.string().valid(...bookingStatuses),
        sortBy: Joi.string().default('createdAt:desc'),
        limit: Joi.number().integer().min(1).max(100).default(20),
        page: Joi.number().integer().min(1).default(1),
    }),
};

const getBooking = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
    }),
};

const cancelBooking = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        cancelReason: Joi.string().trim().allow('').default(''),
    }),
};

const updateBookingStatus = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        status: Joi.string().valid(...bookingStatuses).required(),
    }),
};

const assignInventoryItem = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
        itemId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        inventoryItemId: Joi.string().custom(objectId).required(),
    }),
};

const updateBookingItemStatus = {
    params: Joi.object().keys({
        bookingId: Joi.string().custom(objectId).required(),
        itemId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        itemStatus: Joi.string().valid(...bookingItemStatuses).required(),
    }),
};

module.exports = {
    checkAvailability,
    createBooking,
    queryBookings,
    getBooking,
    cancelBooking,
    updateBookingStatus,
    assignInventoryItem,
    updateBookingItemStatus,
};
