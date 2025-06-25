import { Router } from 'express';
import { CMSController } from '../controllers/cms.controller';
import { BookingController } from '../controllers/bookings.controller';
import pool from '../db/index.ts';

const router = Router();
const cmsController = new CMSController(pool);
const bookingController = new BookingController(pool);

// Public content
router.get('/content', cmsController.getContent.bind(cmsController));
router.get('/team', cmsController.getTeamMembers.bind(cmsController));
router.get('/gallery', cmsController.getGallery.bind(cmsController));
router.get('/services', cmsController.getServices.bind(cmsController));
router.get('/settings', cmsController.getSettings.bind(cmsController));

// Public bookings
router.get('/slots', bookingController.getAvailableSlots.bind(bookingController));
router.post('/bookings', bookingController.createBooking.bind(bookingController));
router.get('/bookings', bookingController.getUserBookings.bind(bookingController));
router.get('/bookings/:confirmation_code', bookingController.getBookingByConfirmation.bind(bookingController));
router.put('/bookings/:confirmation_code/cancel', bookingController.cancelBooking.bind(bookingController));

export default router;
