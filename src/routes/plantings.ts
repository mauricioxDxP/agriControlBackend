// ============================================
// Routes: Plantings
// Thin layer
// ============================================

import { Router } from 'express';
import { plantingController } from '../controllers/PlantingController';

const router = Router();

router.get('/', plantingController.getAll.bind(plantingController));
router.get('/:id', plantingController.getById.bind(plantingController));
router.get('/field/:fieldId', plantingController.getByFieldId.bind(plantingController));
router.post('/', plantingController.create.bind(plantingController));
router.put('/:id', plantingController.update.bind(plantingController));
router.delete('/:id', plantingController.delete.bind(plantingController));
router.patch('/:id/end', plantingController.endPlanting.bind(plantingController));

export default router;