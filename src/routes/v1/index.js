const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const categoryRoute = require('./category.route');
const productRoute = require('./product.route');
const inventoryRoute = require('./inventory.route');
const bookingRoute = require('./booking.route');
const adminBookingRoute = require('./adminBooking.route');

const router = express.Router();

const defaultRoutes = [
    { path: '/auth', route: authRoute },
    { path: '/users', route: userRoute },
    { path: '/categories', route: categoryRoute },
    { path: '/products', route: productRoute },
    { path: '/inventory', route: inventoryRoute },
    { path: '/bookings', route: bookingRoute },
    { path: '/admin/bookings', route: adminBookingRoute },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
