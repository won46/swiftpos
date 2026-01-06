import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  adjustStock,
} from '../controllers/product.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public routes (for testing, in production should be protected)
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/by-barcode/:barcode', getProductByBarcode); // Must be before /:id route
router.get('/:id', getProduct);

// Protected routes (Admin/Manager only)
router.post('/', protect, authorizeRoles('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', protect, authorizeRoles('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', protect, authorizeRoles('ADMIN', 'MANAGER'), deleteProduct);

// Stock adjustment
router.post('/:id/adjust-stock', protect, authorizeRoles('ADMIN', 'MANAGER'), adjustStock);

export default router;
