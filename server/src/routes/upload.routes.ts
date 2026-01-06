import { Router } from 'express';
import { upload, uploadProductImage, deleteProductImage } from '../controllers/upload.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

// Upload product image (Manager and Admin)
router.post(
  '/product',
  authorizeRoles('ADMIN', 'MANAGER'),
  upload.single('image'),
  uploadProductImage
);

// Delete product image (Manager and Admin)
router.delete(
  '/product/:filename',
  authorizeRoles('ADMIN', 'MANAGER'),
  deleteProductImage
);

export default router;
