import express from 'express';
import { testPrint } from '../controllers/printer.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Route to trigger print
router.post('/receipt', protect, testPrint);

export default router;
