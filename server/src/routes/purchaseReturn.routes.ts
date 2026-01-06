import { Router } from 'express';
import {
  getAllPurchaseReturns,
  getPurchaseReturnById,
  getReturnsByPurchaseOrder,
  createPurchaseReturn,
  markRefundReceived,
  deletePurchaseReturn,
} from '../controllers/purchaseReturn.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getAllPurchaseReturns);
router.get('/:id', getPurchaseReturnById);
router.get('/purchase-order/:purchaseOrderId', getReturnsByPurchaseOrder);
router.post('/', createPurchaseReturn);
router.post('/:id/refund-received', markRefundReceived);
router.delete('/:id', deletePurchaseReturn);

export default router;
