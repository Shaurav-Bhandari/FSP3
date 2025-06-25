import { Router } from 'express';
import type { RequestHandler } from 'express';
import { CMSController } from '../controllers/cms.controller';
import { BookingController } from '../controllers/bookings.controller';
import adminController from '../controllers/admin.controller';
import { authenticateAdmin, requireRole, authenticateToken, requireAdmin } from '../middlewares/auth';
import pool from '../db';
import type { UserParams, UpdateUserRoleBody } from '../types/admin';

const router = Router();
const cmsController = new CMSController(pool);
const bookingController = new BookingController(pool);

// =====================
// ADMIN AUTH
// =====================
router.post('/login', cmsController.login.bind(cmsController) as RequestHandler);

// =====================
// CMS & BOOKING MANAGEMENT ROUTES
// =====================
router.use(authenticateAdmin as RequestHandler);

// ----- Content Management -----
router.get('/content', cmsController.getContent.bind(cmsController) as RequestHandler);
router.post('/content', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.createContent.bind(cmsController) as RequestHandler);
router.put('/content/:id', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.updateContent.bind(cmsController) as RequestHandler);
router.delete('/content/:id', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.deleteContent.bind(cmsController) as RequestHandler);

// ----- Team Management -----
router.get('/team', cmsController.getTeamMembers.bind(cmsController) as RequestHandler);
router.post('/team', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.createTeamMember.bind(cmsController) as RequestHandler);
router.put('/team/:id', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.updateContent.bind(cmsController) as RequestHandler);
router.delete('/team/:id', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.deleteContent.bind(cmsController) as RequestHandler);

// ----- Gallery Management -----
router.get('/gallery', cmsController.getGallery.bind(cmsController) as RequestHandler);
router.post('/gallery', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.createGalleryItem.bind(cmsController) as RequestHandler);
router.put('/gallery/:id', requireRole(['superadmin', 'admin', 'editor']) as RequestHandler, cmsController.updateContent.bind(cmsController) as RequestHandler);
router.delete('/gallery/:id', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.deleteContent.bind(cmsController) as RequestHandler);

// ----- Services Management -----
router.get('/services', cmsController.getServices.bind(cmsController) as RequestHandler);
router.post('/services', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.createService.bind(cmsController) as RequestHandler);
router.put('/services/:id', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.updateContent.bind(cmsController) as RequestHandler);
router.delete('/services/:id', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.deleteContent.bind(cmsController) as RequestHandler);

// ----- Settings Management -----
router.get('/settings', cmsController.getSettings.bind(cmsController) as RequestHandler);
router.put('/settings/:key', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.updateSetting.bind(cmsController) as RequestHandler);

// ----- Bookings -----
router.get('/bookings', bookingController.getAllBookings.bind(bookingController) as RequestHandler);
router.put('/bookings/:id/status', requireRole(['superadmin', 'admin']) as RequestHandler, bookingController.updateBookingStatus.bind(bookingController) as RequestHandler);
router.get('/bookings/stats', bookingController.getBookingStats.bind(bookingController) as RequestHandler);

// ----- Time Slots -----
router.post('/slots', requireRole(['superadmin', 'admin']) as RequestHandler, bookingController.createTimeSlot.bind(bookingController) as RequestHandler);
router.post('/slots/generate', requireRole(['superadmin', 'admin']) as RequestHandler, bookingController.generateTimeSlots.bind(bookingController) as RequestHandler);
router.delete('/slots/:id', requireRole(['superadmin', 'admin']) as RequestHandler, bookingController.deleteTimeSlot.bind(bookingController) as RequestHandler);

// ----- Audit Log -----
router.get('/audit', requireRole(['superadmin', 'admin']) as RequestHandler, cmsController.getAuditLog.bind(cmsController) as RequestHandler);

// =====================
// ADMIN USER MANAGEMENT ROUTES
// =====================
router.use(authenticateToken as RequestHandler);
router.use(requireAdmin as RequestHandler);

router.get('/users', adminController.getAllUsers as RequestHandler);
router.delete('/users/:id', adminController.deleteUser as unknown as RequestHandler<UserParams>);
router.get('/stats', adminController.getSystemStats as RequestHandler);
router.put('/users/:id/role', adminController.updateUserRole as unknown as RequestHandler<UserParams, any, UpdateUserRoleBody>);

export default router;
