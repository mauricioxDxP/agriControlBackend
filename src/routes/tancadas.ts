// ============================================
// Routes: Tancadas
// Thin layer
// ============================================

import { Router } from 'express';
import { tancadaController } from '../controllers/TancadaController';

const router = Router();

router.get('/', tancadaController.getAll.bind(tancadaController));
router.get('/:id', tancadaController.getById.bind(tancadaController));
router.post('/', tancadaController.create.bind(tancadaController));
router.put('/:id', tancadaController.update.bind(tancadaController));
router.delete('/:id', tancadaController.delete.bind(tancadaController));

export default router;
