import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/movements - Obtener todos los movimientos
router.get('/', async (req: Request, res: Response) => {
  try {
    const movements = await prisma.movement.findMany({
      include: { 
        product: true,
        lot: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movements' });
  }
});

// GET /api/movements/product/:productId - Obtener movimientos por producto
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const movements = await prisma.movement.findMany({
      where: { productId },
      include: { 
        product: true,
        lot: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movements for product' });
  }
});

// GET /api/movements/lot/:lotId - Obtener movimientos por lote
router.get('/lot/:lotId', async (req: Request, res: Response) => {
  try {
    const lotId = req.params.lotId as string;
    const movements = await prisma.movement.findMany({
      where: { lotId },
      include: { 
        product: true,
        lot: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movements for lot' });
  }
});

// GET /api/movements/stock/:productId - Calcular stock actual de un producto
router.get('/stock/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    
    const movements = await prisma.movement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });

    let stock = 0;
    for (const movement of movements) {
      if (movement.type === 'ENTRADA') {
        stock += movement.quantity;
      } else {
        stock -= movement.quantity;
      }
    }

    res.json({ productId, stock });
  } catch (error) {
    res.status(500).json({ error: 'Error calculating stock' });
  }
});

// GET /api/movements/stock/lot/:lotId - Calcular stock actual de un lote
router.get('/stock/lot/:lotId', async (req: Request, res: Response) => {
  try {
    const lotId = req.params.lotId as string;
    
    // Get the lot to know initial stock
    const lot = await prisma.lot.findUnique({
      where: { id: lotId }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    // Get movements for this lot
    const movements = await prisma.movement.findMany({
      where: { lotId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stock: entradas - salidas (initialStock is already recorded in ENTRADA movement)
    let stock = 0;
    for (const movement of movements) {
      if (movement.type === 'ENTRADA') {
        stock += movement.quantity;
      } else {
        stock -= movement.quantity;
      }
    }

    res.json({ lotId, stock });
  } catch (error) {
    console.error('Error calculating lot stock:', error);
    res.status(500).json({ error: 'Error calculating lot stock' });
  }
});

// POST /api/movements - Crear movimiento
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, lotId, type, quantity, notes } = req.body;
    const movement = await prisma.movement.create({
      data: {
        productId,
        lotId: lotId || null,
        type,
        quantity: parseFloat(quantity),
        notes
      },
      include: { 
        product: true,
        lot: true 
      }
    });
    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ error: 'Error creating movement' });
  }
});

// DELETE /api/movements/:id - Eliminar movimiento
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.movement.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting movement' });
  }
});

export default router;
