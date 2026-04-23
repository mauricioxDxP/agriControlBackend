// ============================================
// Routes: Tanks
// Thin layer
// ============================================

import { Router } from 'express';
import { tankController } from '../controllers/TankController';

/**
 * @swagger
 * /api/tanks:
 *   get:
 *     summary: Obtener todos los tanques
 *     tags: [Tanks]
 *     responses:
 *       200:
 *         description: Lista de tanques
 *   post:
 *     summary: Crear nuevo tanque
 *     tags: [Tanks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTankDto'
 *     responses:
 *       201:
 *         description: Tanque creado
 * 
 * /api/tanks/{id}:
 *   get:
 *     summary: Obtener tanque por ID
 *     tags: [Tanks]
 *   put:
 *     summary: Actualizar tanque
 *     tags: [Tanks]
 *   delete:
 *     summary: Eliminar tanque
 *     tags: [Tanks]
 */

const router = Router();

router.get('/', tankController.getAll.bind(tankController));
router.get('/:id', tankController.getById.bind(tankController));
router.post('/', tankController.create.bind(tankController));
router.put('/:id', tankController.update.bind(tankController));
router.delete('/:id', tankController.delete.bind(tankController));

export default router;
