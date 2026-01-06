import { Router } from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from '../controllers/purchase.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Create purchase order (ADMIN, MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createPurchaseOrder);

// Get all purchase orders
router.get('/', getPurchaseOrders);

// Get purchase order by ID
router.get('/:id', getPurchaseOrderById);

// Receive goods (ADMIN, MANAGER)
router.put('/:id/receive', authorizeRoles('ADMIN', 'MANAGER'), receivePurchaseOrder);

// Cancel purchase order (ADMIN, MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), cancelPurchaseOrder);

export default router;
