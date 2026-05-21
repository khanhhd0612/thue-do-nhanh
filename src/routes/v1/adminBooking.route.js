const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const bookingValidation = require('../../validations/booking.validation');
const bookingController = require('../../controllers/booking.controller');

const router = express.Router();

router.get(
    '/',
    auth('getAllBookings'),
    validate(bookingValidation.queryBookings),
    bookingController.getAllBookings
);

router.patch(
    '/:bookingId/status',
    auth('manageAllBookings'),
    validate(bookingValidation.updateBookingStatus),
    bookingController.updateBookingStatus
);

router.patch(
    '/:bookingId/items/:itemId/assign',
    auth('manageAllBookings'),
    validate(bookingValidation.assignInventoryItem),
    bookingController.assignInventoryItem
);

router.patch(
    '/:bookingId/items/:itemId/status',
    auth('manageAllBookings'),
    validate(bookingValidation.updateBookingItemStatus),
    bookingController.updateBookingItemStatus
);

module.exports = router;
