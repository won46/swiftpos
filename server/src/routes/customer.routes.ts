import express from 'express';
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerDetails,
} from '../controllers/customer.controller';

const router = express.Router();

router.get('/', getAllCustomers);
router.get('/:id', getCustomerDetails);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
