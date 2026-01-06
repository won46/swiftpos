import { Router } from 'express';
import {
  getAllRolePermissions,
  getPermissionsByRole,
  updatePermission,
  bulkUpdatePermissions,
  resetToDefaults,
} from '../controllers/rolePermission.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getAllRolePermissions);
router.get('/:role', getPermissionsByRole);
router.put('/:id', updatePermission);
router.put('/role/:role', bulkUpdatePermissions);
router.post('/reset/:role', resetToDefaults);

export default router;
