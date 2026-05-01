// ============================================
// Routes: Movements
// Thin layer
// ============================================

import { Router } from 'express';
import { movementController } from '../controllers/MovementController';

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Obtener todos los movimientos
 *     tags: [Movements]
 *     responses:
 *       200:
 *         description: Lista de movimientos
 *   post:
 *     summary: Crear nuevo movimiento
 *     tags: [Movements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovementDto'
 *     responses:
 *       201:
 *         description: Movimiento creado
 * 
 * /api/movements/product/{productId}:
 *   get:
 *     summary: Obtener movimientos por producto
 *     tags: [Movements]
 * 
 * /api/movements/stock/{productId}:
 *   get:
 *     summary: Obtener stock actual de un producto
 *     tags: [Movements]
 * 
 * /api/movements/{id}:
 *   delete:
 *     summary: Eliminar movimiento
 *     tags: [Movements]
 */

const router = Router();

router.get('/', movementController.getAll.bind(movementController));
router.get('/product/:productId', movementController.getByProduct.bind(movementController));
router.get('/lot/:lotId', movementController.getByLot.bind(movementController));
router.get('/tancada/:tancadaId', movementController.getByTancada.bind(movementController));
router.get('/stock/:productId', movementController.getStock.bind(movementController));
router.get('/stock/lot/:lotId', movementController.getLotStock.bind(movementController));
router.post('/', movementController.create.bind(movementController));
router.delete('/:id', movementController.delete.bind(movementController));

export default router;
