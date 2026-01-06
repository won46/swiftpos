import { Router } from 'express';
import {
  getSalesOverview,
  getSalesByDate,
  getTopProducts,
  getSalesByCategory,
  getPaymentMethodBreakdown,
  getSlowProducts,
  getDailySales,
  getProductStats,
} from '../controllers/report.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes - Admin and Manager only
router.use(protect);
router.use(authorizeRoles('ADMIN', 'MANAGER'));

router.get('/overview', getSalesOverview);
router.get('/sales-by-date', getSalesByDate);
router.get('/top-products', getTopProducts);
router.get('/slow-products', getSlowProducts);
router.get('/daily-sales', getDailySales);
router.get('/product-stats', getProductStats);
router.get('/sales-by-category', getSalesByCategory);
router.get('/payment-methods', getPaymentMethodBreakdown);

export default router;
