// ============================================
// Routes: Terrains
// Thin layer
// ============================================

import { Router } from 'express';
import { terrainController } from '../controllers/TerrainController';

const router = Router();

router.get('/', terrainController.getAll.bind(terrainController));
router.get('/:id', terrainController.getById.bind(terrainController));
router.get('/:id/total-area', terrainController.getTotalArea.bind(terrainController));
router.post('/', terrainController.create.bind(terrainController));
router.put('/:id', terrainController.update.bind(terrainController));
router.delete('/:id', terrainController.delete.bind(terrainController));

export default router;