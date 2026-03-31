// ============================================
// Routes: Tanks
// Thin layer
// ============================================

import { Router } from 'express';
import { tankController } from '../controllers/TankController';

const router = Router();

router.get('/', tankController.getAll.bind(tankController));
router.get('/:id', tankController.getById.bind(tankController));
router.post('/', tankController.create.bind(tankController));
router.put('/:id', tankController.update.bind(tankController));
router.delete('/:id', tankController.delete.bind(tankController));

export default router;
