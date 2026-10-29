const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/hold', authenticateToken, bookingController.holdSeats);
router.post('/release', authenticateToken, bookingController.releaseSeatHold);
router.get('/my-bookings', authenticateToken, bookingController.getMyBookings);
router.get('/:id', authenticateToken, bookingController.getBookingById);

module.exports = router;
