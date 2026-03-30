import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/fields - Obtener todos los campos
router.get('/', async (req: Request, res: Response) => {
  try {
    const fields = await prisma.field.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching fields' });
  }
});

// GET /api/fields/:id - Obtener campo por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const field = await prisma.field.findUnique({
      where: { id },
      include: { applications: { include: { applicationLots: true } } }
    });
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching field' });
  }
});

// POST /api/fields - Crear campo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, area, location } = req.body;
    const field = await prisma.field.create({
      data: {
        name,
        area: parseFloat(area),
        location
      }
    });
    res.status(201).json(field);
  } catch (error) {
    res.status(500).json({ error: 'Error creating field' });
  }
});

// PUT /api/fields/:id - Actualizar campo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, area, location } = req.body;
    const field = await prisma.field.update({
      where: { id },
      data: {
        name,
        area: parseFloat(area),
        location
      }
    });
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: 'Error updating field' });
  }
});

// DELETE /api/fields/:id - Eliminar campo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.field.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting field' });
  }
});

export default router;
