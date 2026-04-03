// ============================================
// Routes: Applications
// Thin layer
// ============================================

import { Router } from 'express';
import { applicationController } from '../controllers/ApplicationController';

const router = Router();

router.get('/', applicationController.getAll.bind(applicationController));
router.get('/:id', applicationController.getById.bind(applicationController));
router.get('/field/:fieldId', applicationController.getByField.bind(applicationController));
router.post('/', applicationController.create.bind(applicationController));
router.put('/:id', applicationController.update.bind(applicationController));
router.delete('/:id', applicationController.delete.bind(applicationController));

export default router;
