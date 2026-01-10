import { Router } from 'express';
import {
  createQrisPayment,
  checkPaymentStatus,
  handleWebhook,
  cancelPayment,
} from '../controllers/payment.controller';

const router = Router();

// Create QRIS payment
// Create QRIS payment
router.post('/qris/create', createQrisPayment);

// Create Snap payment
const { createSnapTransaction } = require('../controllers/payment.controller');
router.post('/snap/create', createSnapTransaction);

// Check payment status
router.get('/qris/:orderId/status', checkPaymentStatus);

// Cancel payment
router.post('/qris/:orderId/cancel', cancelPayment);

// Midtrans webhook (no auth required - called by Midtrans)
router.post('/webhook', handleWebhook);

export default router;
