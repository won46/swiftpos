import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);

// Admin/Manager only
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createSupplier);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateSupplier);
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteSupplier);

export default router;
