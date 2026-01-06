import { Router } from 'express';
import { getInventoryReport } from '../controllers/inventory.controller';

const router = Router();

// Get inventory report
router.get('/report', getInventoryReport);

export default router;
