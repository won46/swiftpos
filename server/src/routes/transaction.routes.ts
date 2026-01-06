import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getTodayStats,
  repayDebt,
} from '../controllers/transaction.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Create transaction
router.post('/', createTransaction);

// Get all transactions
router.get('/', getTransactions);

// Get today's stats
router.get('/stats/today', getTodayStats);

// Repay Debt
router.post('/:id/repay', repayDebt);

// Get single transaction
router.get('/:id', getTransaction);

export default router;
