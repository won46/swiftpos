
import { Router } from 'express';
import { resetDatabase, importFromExcel, generateBarcodesForExisting } from '../controllers/dataManagement.controller';
import { protect } from '../middleware/auth.middleware'; // Assuming we want this protected
// import { authorize } from '../middleware/auth.middleware'; // And maybe admin only

const router = Router();

// Protect these routes. In a real app, ensure only ADMIN can do this.
// For now, using authenticate is a good baseline.
router.post('/reset', protect, resetDatabase);
router.post('/import-excel', protect, importFromExcel);
router.post('/generate-barcodes', protect, generateBarcodesForExisting);

export default router;
