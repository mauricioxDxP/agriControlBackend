// ============================================
// Routes: Containers
// Thin layer
// ============================================

import { Router } from 'express';
import { containerController } from '../controllers/ContainerController';

const router = Router();

router.get('/', containerController.getAll.bind(containerController));
router.get('/lot/:lotId', containerController.getByLot.bind(containerController));
router.get('/:id', containerController.getById.bind(containerController));
router.get('/:id/movements', containerController.getMovements.bind(containerController));
router.post('/', containerController.create.bind(containerController));
router.put('/:id', containerController.update.bind(containerController));
router.put('/:id/consume', containerController.consume.bind(containerController));
router.delete('/:id', containerController.delete.bind(containerController));

export default router;
