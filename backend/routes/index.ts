import { Router } from 'express';
import publicRoutes from './public.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/api/public', publicRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/users', userRoutes);
router.use('/api', healthRoutes);

export default router;
