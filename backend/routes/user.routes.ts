import express, { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth';

const router: Router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/change-password', authenticateToken, userController.changePassword);

export default router;