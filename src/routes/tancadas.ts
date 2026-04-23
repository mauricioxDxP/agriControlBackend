// ============================================
// Routes: Tancadas
// Thin layer
// ============================================

import { Router } from 'express';
import { tancadaController } from '../controllers/TancadaController';

/**
 * @swagger
 * /api/tancadas:
 *   get:
 *     summary: Obtener todas las tancadas
 *     tags: [Tancadas]
 *     responses:
 *       200:
 *         description: Lista de tancadas
 *   post:
 *     summary: Crear nueva tancada
 *     tags: [Tancadas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTancadaDto'
 *     responses:
 *       201:
 *         description: Tancada creada
 * 
 * /api/tancadas/{id}:
 *   get:
 *     summary: Obtener tancada por ID
 *     tags: [Tancadas]
 *   put:
 *     summary: Actualizar tancada
 *     tags: [Tancadas]
 *   delete:
 *     summary: Eliminar tancada
 *     tags: [Tancadas]
 */

const router = Router();

router.get('/', tancadaController.getAll.bind(tancadaController));
router.get('/:id', tancadaController.getById.bind(tancadaController));
router.post('/', tancadaController.create.bind(tancadaController));
router.put('/:id', tancadaController.update.bind(tancadaController));
router.delete('/:id', tancadaController.delete.bind(tancadaController));

export default router;
