import { Router } from 'express';
import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  seedUnits,
} from '../controllers/unit.controller';

const router = Router();

router.get('/', getUnits);
router.get('/seed', seedUnits);
router.get('/:id', getUnit);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;
