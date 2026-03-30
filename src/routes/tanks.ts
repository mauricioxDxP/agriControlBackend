import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tanks - Obtener todos los tanques
router.get('/', async (req: Request, res: Response) => {
  try {
    const tanks = await prisma.tank.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(tanks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tanks' });
  }
});

// GET /api/tanks/:id - Obtener tanque por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tank = await prisma.tank.findUnique({
      where: { id }
    });
    if (!tank) {
      return res.status(404).json({ error: 'Tank not found' });
    }
    res.json(tank);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tank' });
  }
});

// POST /api/tanks - Crear tanque
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, capacity } = req.body;
    const tank = await prisma.tank.create({
      data: {
        name,
        capacity: Number(capacity)
      }
    });
    res.status(201).json(tank);
  } catch (error) {
    res.status(500).json({ error: 'Error creating tank' });
  }
});

// PUT /api/tanks/:id - Actualizar tanque
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, capacity } = req.body;
    const tank = await prisma.tank.update({
      where: { id },
      data: {
        name,
        capacity: capacity ? Number(capacity) : undefined
      }
    });
    res.json(tank);
  } catch (error) {
    res.status(500).json({ error: 'Error updating tank' });
  }
});

// DELETE /api/tanks/:id - Eliminar tanque
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.tank.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting tank' });
  }
});

export default router;
