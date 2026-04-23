// ============================================
// Routes: Fields
// Thin layer
// ============================================

import { Router } from 'express';
import { fieldController } from '../controllers/FieldController';

/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: Obtener todos los campos/lotes
 *     tags: [Fields]
 *     responses:
 *       200:
 *         description: Lista de campos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Field'
 *   post:
 *     summary: Crear un nuevo campo
 *     tags: [Fields]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFieldDto'
 *     responses:
 *       201:
 *         description: Campo creado
 * 
 * /api/fields/{id}:
 *   get:
 *     summary: Obtener campo por ID
 *     tags: [Fields]
 *   put:
 *     summary: Actualizar campo
 *     tags: [Fields]
 *   delete:
 *     summary: Eliminar campo
 *     tags: [Fields]
 */

const router = Router();

router.get('/', fieldController.getAll.bind(fieldController));
router.get('/:id', fieldController.getById.bind(fieldController));
router.post('/', fieldController.create.bind(fieldController));
router.put('/:id', fieldController.update.bind(fieldController));
router.delete('/:id', fieldController.delete.bind(fieldController));

export default router;
