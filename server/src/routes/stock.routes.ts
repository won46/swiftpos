import { Router } from 'express';
import {
  createStockAdjustment,
  getStockAdjustments,
} from '../controllers/stock.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Create adjustment (Admin/Manager only)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createStockAdjustment);

// View history
router.get('/', getStockAdjustments);

export default router;
