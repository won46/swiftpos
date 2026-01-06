import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes - Admin only
router.use(protect);
router.use(authorizeRoles('ADMIN'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
