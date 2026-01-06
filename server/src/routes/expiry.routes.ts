import { Router } from 'express';
import {
  getExpiredProducts,
  getNearExpiryProducts,
  getExpirySummary,
  disposeExpiredProduct,
} from '../controllers/expiry.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/expired', getExpiredProducts);
router.get('/near-expiry', getNearExpiryProducts);
router.get('/summary', getExpirySummary);
router.post('/dispose', disposeExpiredProduct);

export default router;
