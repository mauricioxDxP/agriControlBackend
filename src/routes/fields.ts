// ============================================
// Routes: Fields
// Thin layer
// ============================================

import { Router } from 'express';
import { fieldController } from '../controllers/FieldController';

const router = Router();

router.get('/', fieldController.getAll.bind(fieldController));
router.get('/:id', fieldController.getById.bind(fieldController));
router.post('/', fieldController.create.bind(fieldController));
router.put('/:id', fieldController.update.bind(fieldController));
router.delete('/:id', fieldController.delete.bind(fieldController));

export default router;
