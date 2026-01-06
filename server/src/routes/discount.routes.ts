import { Router } from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  getDiscountByCode,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
} from '../controllers/discount.controller';
import {
  getApplicableDiscounts,
  getBestDiscount,
} from '../controllers/productDiscount.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getAllDiscounts);
router.get('/:id', getDiscountById);
router.get('/code/:code', getDiscountByCode);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);
router.post('/validate', validateDiscount);

// Product-specific discount routes
router.get('/product/:productId/applicable', getApplicableDiscounts);
router.get('/product/:productId/best', getBestDiscount);

export default router;
