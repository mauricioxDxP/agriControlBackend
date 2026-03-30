import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper function to calculate current quantity from movements
async function getContainerCurrentQuantity(containerId: string): Promise<number> {
  const movements = await prisma.containerMovement.findMany({
    where: { containerId },
    orderBy: { createdAt: 'asc' }
  });
  
  return movements.reduce((total, m) => {
    if (m.type === 'CONSUMO') {
      return total - m.quantity;
    }
    return total + m.quantity;
  }, 0);
}

// Helper function to consume from containers with history
async function consumeFromContainers(lotId: string, quantityNeeded: number, tancadaId?: string) {
  // Get all containers for this lot
  const containers = await prisma.container.findMany({
    where: { lotId },
    orderBy: { capacity: 'desc' }
  });

  let remaining = quantityNeeded;

  for (const container of containers) {
    if (remaining <= 0) break;

    // Calculate current quantity from movements
    const currentQuantity = await getContainerCurrentQuantity(container.id);
    
    if (currentQuantity <= 0) continue; // Skip empty containers

    const previousQuantity = currentQuantity;
    const canConsume = Math.min(currentQuantity, remaining);
    const newQuantity = currentQuantity - canConsume;
    
    // Determine new status
    let newStatus: 'DISPONIBLE' | 'EN_USO' | 'VACIO' = 'DISPONIBLE';
    if (newQuantity <= 0) {
      newStatus = 'VACIO';
    } else if (newQuantity < container.capacity) {
      newStatus = 'EN_USO';
    }

    await prisma.container.update({
      where: { id: container.id },
      data: { status: newStatus }
    });

    // Create container movement history
    await prisma.containerMovement.create({
      data: {
        containerId: container.id,
        type: 'CONSUMO',
        quantity: canConsume,
        previousQuantity: previousQuantity,
        notes: tancadaId ? `Consumo por tancada ${tancadaId.slice(0, 8)}` : 'Consumo por aplicación'
      }
    });

    remaining -= canConsume;
  }

  return quantityNeeded - remaining; // Return actual amount consumed
}

// GET /api/tancadas - Obtener todas las tancadas
router.get('/', async (req: Request, res: Response) => {
  try {
    const tancadas = await prisma.tancada.findMany({
      include: { 
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(tancadas);
  } catch (error) {
    console.error('Error fetching tancadas:', error);
    res.status(500).json({ error: 'Error fetching tancadas' });
  }
});

// GET /api/tancadas/:id - Obtener tancada por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tancada = await prisma.tancada.findUnique({
      where: { id },
      include: { 
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      }
    });
    if (!tancada) {
      return res.status(404).json({ error: 'Tancada not found' });
    }
    res.json(tancada);
  } catch (error) {
    console.error('Error fetching tancada:', error);
    res.status(500).json({ error: 'Error fetching tancada' });
  }
});

// POST /api/tancadas - Crear tancada con múltiples productos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, tankCapacity, waterAmount, notes, products, fields } = req.body;
    
    // products: [{ productId, concentration, quantity }]
    // fields: [{ fieldId, hectaresTreated, productUsed (total) }]
    
    // Calcular el producto total usado (suma de todos los productos)
    const totalProductUsed = products.reduce((sum: number, p: any) => sum + Number(p.quantity), 0);

    // Crear la tancada con los productos y campos tratados
    const tancada = await prisma.tancada.create({
      data: {
        date: date ? new Date(date) : new Date(),
        tankCapacity: Number(tankCapacity),
        waterAmount: Number(waterAmount),
        notes,
        tancadaProducts: {
          create: products.map((p: { productId: string; concentration?: number; quantity: number; lots?: any[] }) => ({
            productId: p.productId,
            concentration: p.concentration ? Number(p.concentration) : null,
            quantity: Number(p.quantity),
            lotsUsed: p.lots ? JSON.stringify(p.lots) : null
          }))
        },
        tancadaFields: {
          create: fields.map((f: { fieldId: string; hectaresTreated: number; productUsed: number }) => ({
            fieldId: f.fieldId,
            hectaresTreated: Number(f.hectaresTreated),
            productUsed: Number(f.productUsed)
          }))
        }
      },
      include: { 
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      }
    });

    // Crear movimientos de salida para cada producto usado
    for (const p of products) {
      // If lots are specified, create a movement for each lot
      if (p.lots && p.lots.length > 0) {
        for (const lotUsage of p.lots) {
          await prisma.movement.create({
            data: {
              productId: p.productId,
              lotId: lotUsage.lotId,
              type: 'SALIDA',
              quantity: Number(lotUsage.quantityUsed),
              notes: `Salida por tancada`,
              tancadaId: tancada.id
            }
          });
        }
      } else {
        // No lots specified, create a general movement
        await prisma.movement.create({
          data: {
            productId: p.productId,
            type: 'SALIDA',
            quantity: Number(p.quantity),
            notes: `Salida por tancada`,
            tancadaId: tancada.id
          }
        });
      }
      
      // Consume from containers and create history
      if (p.lots && p.lots.length > 0) {
        for (const lotUsage of p.lots) {
          await consumeFromContainers(lotUsage.lotId, lotUsage.quantityUsed, tancada.id);
        }
      }
    }

    res.status(201).json(tancada);
  } catch (error) {
    console.error('Error creating tancada:', error);
    res.status(500).json({ error: 'Error creating tancada' });
  }
});

// PUT /api/tancadas/:id - Actualizar tancada
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { date, tankCapacity, waterAmount, notes, products, fields } = req.body;
    
    // Obtener tancada existente para saber qué productos tenía
    const existingTancada = await prisma.tancada.findUnique({
      where: { id },
      include: { tancadaProducts: true }
    });

    if (!existingTancada) {
      return res.status(404).json({ error: 'Tancada not found' });
    }

    // Eliminar productos existentes
    await prisma.tancadaProduct.deleteMany({
      where: { tancadaId: id }
    });

    // Actualizar tancada con nuevos productos
    const tancada = await prisma.tancada.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        tankCapacity: tankCapacity ? Number(tankCapacity) : undefined,
        waterAmount: waterAmount ? Number(waterAmount) : undefined,
        notes,
        tancadaProducts: products ? {
          create: products.map((p: { productId: string; concentration?: number; quantity: number; lots?: any[] }) => ({
            productId: p.productId,
            concentration: p.concentration ? Number(p.concentration) : null,
            quantity: Number(p.quantity),
            lotsUsed: p.lots ? JSON.stringify(p.lots) : null
          }))
        } : undefined,
        tancadaFields: fields ? {
          deleteMany: { tancadaId: id },
          create: fields.map((f: { fieldId: string; hectaresTreated: number; productUsed: number }) => ({
            fieldId: f.fieldId,
            hectaresTreated: Number(f.hectaresTreated),
            productUsed: Number(f.productUsed)
          }))
        } : undefined
      },
      include: { 
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      }
    });
    res.json(tancada);
  } catch (error) {
    console.error('Error updating tancada:', error);
    res.status(500).json({ error: 'Error updating tancada' });
  }
});

// DELETE /api/tancadas/:id - Eliminar tancada
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Get existing movements for this tancada to reverse them
    const existingMovements = await prisma.movement.findMany({
      where: { tancadaId: id }
    });
    
    // Reverse each movement (create ENTRADA for each SALIDA)
    for (const movement of existingMovements) {
      if (movement.type === 'SALIDA') {
        await prisma.movement.create({
          data: {
            productId: movement.productId,
            lotId: movement.lotId,
            type: 'ENTRADA',
            quantity: movement.quantity,
            notes: `Reversión por eliminación de tancada`,
            tancadaId: null // Clear reference
          }
        });
      }
    }
    
    // Reverse container consumption - find movements by notes
    const containerMovements = await prisma.containerMovement.findMany({
      where: { notes: { contains: id.slice(0, 8) } }
    });
    
    for (const cm of containerMovements) {
      if (cm.type === 'CONSUMO') {
        // Get container and calculate current quantity
        const container = await prisma.container.findUnique({ where: { id: cm.containerId } });
        if (container) {
          const previousQuantity = await getContainerCurrentQuantity(container.id);
          const restoredQuantity = previousQuantity + cm.quantity;
          let newStatus: 'DISPONIBLE' | 'EN_USO' | 'VACIO' = 'DISPONIBLE';
          if (restoredQuantity >= container.capacity) {
            newStatus = 'DISPONIBLE';
          } else if (restoredQuantity > 0) {
            newStatus = 'EN_USO';
          } else {
            newStatus = 'VACIO';
          }
          
          await prisma.container.update({
            where: { id: container.id },
            data: { status: newStatus }
          });
          
          // Create reversal record
          await prisma.containerMovement.create({
            data: {
              containerId: container.id,
              type: 'AJUSTE',
              quantity: cm.quantity,
              previousQuantity: previousQuantity,
              notes: `Reversión por eliminación de tancada ${id.slice(0, 8)}`
            }
          });
        }
      }
    }
    
    // Delete the movements related to this tancada
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    // Delete related records
    await prisma.tancadaProduct.deleteMany({ where: { tancadaId: id } });
    await prisma.tancadaField.deleteMany({ where: { tancadaId: id } });
    
    // Delete the tancada
    await prisma.tancada.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tancada:', error);
    res.status(500).json({ error: 'Error deleting tancada' });
  }
});

export default router;
