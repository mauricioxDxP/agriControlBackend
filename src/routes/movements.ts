// ============================================
// Routes: Movements
// Thin layer
// ============================================

import { Router } from 'express';
import { movementController } from '../controllers/MovementController';

const router = Router();

router.get('/', movementController.getAll.bind(movementController));
router.get('/product/:productId', movementController.getByProduct.bind(movementController));
router.get('/lot/:lotId', movementController.getByLot.bind(movementController));
router.get('/stock/:productId', movementController.getStock.bind(movementController));
router.get('/stock/lot/:lotId', movementController.getLotStock.bind(movementController));
router.post('/', movementController.create.bind(movementController));
router.delete('/:id', movementController.delete.bind(movementController));

export default router;
