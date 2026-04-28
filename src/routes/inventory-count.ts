// ============================================
// Routes: InventoryCount
// Thin layer - solo conecta requests con controller
// ============================================

import { Router } from 'express';
import { inventoryCountController } from '../controllers/InventoryCountController';

const router = Router();

// GET /api/inventory-count - Listar todos los conteos
router.get('/', inventoryCountController.getAll.bind(inventoryCountController));

// GET /api/inventory-count/pending - Listar ajustes pendientes
router.get('/pending', inventoryCountController.getPendingAdjustments.bind(inventoryCountController));

// GET /api/inventory-count/:id - Obtener un conteo con líneas
router.get('/:id', inventoryCountController.getById.bind(inventoryCountController));

// POST /api/inventory-count - Crear conteo
router.post('/', inventoryCountController.create.bind(inventoryCountController));

// DELETE /api/inventory-count/:id - Eliminar conteo
router.delete('/:id', inventoryCountController.delete.bind(inventoryCountController));

// POST /api/inventory-count/:id/lines - Agregar línea a conteo existente
router.post('/:id/lines', inventoryCountController.addLine.bind(inventoryCountController));

// PUT /api/inventory-count/:id/lines/:lineId - Actualizar stockManual
router.put('/:id/lines/:lineId', inventoryCountController.updateLine.bind(inventoryCountController));

// POST /api/inventory-count/request-adjust - Solicitar ajuste (PENDING)
router.post('/request-adjust', inventoryCountController.requestAdjustment.bind(inventoryCountController));

// POST /api/inventory-count/authorize/:adjustmentId - Autorizar ajuste
router.post('/authorize/:adjustmentId', inventoryCountController.authorizeAdjustment.bind(inventoryCountController));

// POST /api/inventory-count/reject/:adjustmentId - Rechazar ajuste
router.post('/reject/:adjustmentId', inventoryCountController.rejectAdjustment.bind(inventoryCountController));

export default router;
