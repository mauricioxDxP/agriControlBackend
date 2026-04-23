// ============================================
// Routes: Applications
// Thin layer
// ============================================

import { Router } from 'express';
import { applicationController } from '../controllers/ApplicationController';

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Obtener todas las aplicaciones
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Lista de aplicaciones
 *   post:
 *     summary: Crear nueva aplicación
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApplicationDto'
 *     responses:
 *       201:
 *         description: Aplicación creada
 * 
 * /api/applications/{id}:
 *   get:
 *     summary: Obtener aplicación por ID
 *     tags: [Applications]
 *   put:
 *     summary: Actualizar aplicación
 *     tags: [Applications]
 *   delete:
 *     summary: Eliminar aplicación
 *     tags: [Applications]
 * 
 * /api/applications/field/{fieldId}:
 *   get:
 *     summary: Obtener aplicaciones por campo
 *     tags: [Applications]
 */

const router = Router();

router.get('/', applicationController.getAll.bind(applicationController));
router.get('/:id', applicationController.getById.bind(applicationController));
router.get('/field/:fieldId', applicationController.getByField.bind(applicationController));
router.post('/', applicationController.create.bind(applicationController));
router.put('/:id', applicationController.update.bind(applicationController));
router.delete('/:id', applicationController.delete.bind(applicationController));

export default router;
