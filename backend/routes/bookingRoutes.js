import express from 'express';
import {
  listBookings,
  rescheduleBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, listBookings);
router.patch('/:id/status', auth, updateBookingStatus);
router.patch('/:id/reschedule', auth, rescheduleBooking);

export default router;
