// ============================================
// Routes: Lots
// Thin layer - solo conecta requests con controller
// ============================================

import { Router } from 'express';
import { lotController } from '../controllers/LotController';

const router = Router();

// GET /api/lots - Obtener todos los lotes
router.get('/', lotController.getAll.bind(lotController));

// GET /api/lots/:id - Obtener lote por ID
router.get('/:id', lotController.getById.bind(lotController));

// GET /api/lots/product/:productId - Obtener lotes por producto
router.get('/product/:productId', lotController.getByProduct.bind(lotController));

// POST /api/lots - Crear lote
router.post('/', lotController.create.bind(lotController));

// PUT /api/lots/:id - Actualizar lote
router.put('/:id', lotController.update.bind(lotController));

// DELETE /api/lots/:id - Eliminar lote
router.delete('/:id', lotController.delete.bind(lotController));

export default router;
