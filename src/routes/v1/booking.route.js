const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const bookingValidation = require('../../validations/booking.validation');
const bookingController = require('../../controllers/booking.controller');

const router = express.Router();

router.post(
    '/check-availability',
    auth('getBookings'),
    validate(bookingValidation.checkAvailability),
    bookingController.checkAvailability
);

router.post(
    '/',
    auth('manageBookings'),
    validate(bookingValidation.createBooking),
    bookingController.createBooking
);

router.get(
    '/my',
    auth('getBookings'),
    validate(bookingValidation.queryBookings),
    bookingController.getMyBookings
);

router.get(
    '/:bookingId',
    auth('getBookings'),
    validate(bookingValidation.getBooking),
    bookingController.getBookingById
);

router.get(
    '/:bookingId/items',
    auth('getBookings'),
    validate(bookingValidation.getBooking),
    bookingController.getBookingItems
);

router.patch(
    '/:bookingId/cancel',
    auth('manageBookings'),
    validate(bookingValidation.cancelBooking),
    bookingController.cancelBooking
);

module.exports = router;
