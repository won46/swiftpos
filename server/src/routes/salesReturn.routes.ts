import { Router } from 'express';
import {
  getAllSalesReturns,
  getSalesReturnById,
  getReturnsByTransaction,
  createSalesReturn,
  completeSalesReturn,
  deleteSalesReturn,
} from '../controllers/salesReturn.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getAllSalesReturns);
router.get('/:id', getSalesReturnById);
router.get('/transaction/:transactionId', getReturnsByTransaction);
router.post('/', createSalesReturn);
router.post('/:id/complete', completeSalesReturn);
router.delete('/:id', deleteSalesReturn);

export default router;
