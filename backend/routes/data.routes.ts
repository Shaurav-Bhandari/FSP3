import { Router } from 'express';
import type { RequestHandler } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { DataController } from '../controllers/data.controller';
import pool from '../db';

const router = Router();
const dataController = new DataController(pool);

router.use(authenticateToken as RequestHandler);

router.get('/data', dataController.getData.bind(dataController) as RequestHandler);
router.post('/data', dataController.createData.bind(dataController) as RequestHandler);
router.put('/data/:id', dataController.updateData.bind(dataController) as RequestHandler);
router.delete('/data/:id', dataController.deleteData.bind(dataController) as RequestHandler);

export default router;
