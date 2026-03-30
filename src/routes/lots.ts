import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/lots - Obtener todos los lotes
router.get('/', async (req: Request, res: Response) => {
  try {
    const lots = await prisma.lot.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching lots' });
  }
});

// GET /api/lots/:id - Obtener lote por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const lot = await prisma.lot.findUnique({
      where: { id },
      include: { product: true }
    });
    if (!lot) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching lot' });
  }
});

// GET /api/lots/product/:productId - Obtener lotes por producto
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const lots = await prisma.lot.findMany({
      where: { productId },
      include: { product: true },
      orderBy: { entryDate: 'desc' }
    });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching lots for product' });
  }
});

// POST /api/lots - Crear lote
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, entryDate, expiryDate, supplier, initialStock } = req.body;
    const lot = await prisma.lot.create({
      data: {
        productId,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier,
        initialStock: parseFloat(initialStock)
      },
      include: { product: true }
    });
    
    // Crear movimiento de entrada automático
    await prisma.movement.create({
      data: {
        productId,
        lotId: lot.id,
        type: 'ENTRADA',
        quantity: parseFloat(initialStock),
        notes: 'Entrada por creación de lote'
      }
    });
    
    res.status(201).json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Error creating lot' });
  }
});

// PUT /api/lots/:id - Actualizar lote
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { expiryDate, supplier } = req.body;
    const lot = await prisma.lot.update({
      where: { id },
      data: {
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier
      },
      include: { product: true }
    });
    res.json(lot);
  } catch (error) {
    res.status(500).json({ error: 'Error updating lot' });
  }
});

// DELETE /api/lots/:id - Eliminar lote
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Get containers for this lot
    const containers = await prisma.container.findMany({
      where: { lotId: id }
    });
    
    // Delete container movements first
    for (const container of containers) {
      await prisma.containerMovement.deleteMany({
        where: { containerId: container.id }
      });
    }
    
    // Delete containers
    await prisma.container.deleteMany({
      where: { lotId: id }
    });
    
    // Delete movements for this lot
    await prisma.movement.deleteMany({
      where: { lotId: id }
    });
    
    // Delete the lot
    await prisma.lot.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting lot' });
  }
});

export default router;
