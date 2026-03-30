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
async function consumeFromContainers(lotId: string, quantityNeeded: number, applicationId?: string) {
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
        notes: applicationId ? `Consumo por aplicación ${applicationId.slice(0, 8)}` : 'Consumo por aplicación'
      }
    });

    remaining -= canConsume;
  }

  return quantityNeeded - remaining; // Return actual amount consumed
}

// GET /api/applications - Obtener todas las aplicaciones
router.get('/', async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      include: { 
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Error fetching applications' });
  }
});

// GET /api/applications/:id - Obtener aplicación por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { 
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      }
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Error fetching application' });
  }
});

// GET /api/applications/field/:fieldId - Obtener aplicaciones por campo
router.get('/field/:fieldId', async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.fieldId as string;
    const applications = await prisma.application.findMany({
      where: { fieldId },
      include: { 
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications for field:', error);
    res.status(500).json({ error: 'Error fetching applications for field' });
  }
});

// POST /api/applications - Crear aplicación con múltiples productos
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fieldId, type, date, waterAmount, notes, products, lots } = req.body;
    
    // products: [{ productId, dosePerHectare, concentration, quantityUsed }]
    // lots: [{ lotId, quantityUsed }] (para tracking de inventario)
    
    const application = await prisma.application.create({
      data: {
        fieldId,
        type,
        date: date ? new Date(date) : new Date(),
        waterAmount: waterAmount ? Number(waterAmount) : null,
        notes,
        applicationProducts: products ? {
          create: products.map((p: { productId: string; dosePerHectare?: number; concentration?: number; quantityUsed: number; lots?: any[] }) => ({
            productId: p.productId,
            dosePerHectare: p.dosePerHectare ? Number(p.dosePerHectare) : null,
            concentration: p.concentration ? Number(p.concentration) : null,
            quantityUsed: Number(p.quantityUsed),
            lotsUsed: p.lots ? JSON.stringify(p.lots) : null
          }))
        } : undefined,
        applicationLots: lots ? {
          create: lots.map((lot: { lotId: string; quantityUsed: number | string }) => ({
            lotId: lot.lotId,
            quantityUsed: Number(lot.quantityUsed)
          }))
        } : undefined
      },
      include: { 
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      }
    });

    // Crear movimientos de salida para cada producto usado
    if (products) {
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
                notes: `Salida por aplicación ${type}`,
                applicationId: application.id
              }
            });
          }
        } else {
          // No lots specified, create a general movement
          await prisma.movement.create({
            data: {
              productId: p.productId,
              type: 'SALIDA',
              quantity: Number(p.quantityUsed),
              notes: `Salida por aplicación ${type}`,
              applicationId: application.id
            }
          });
        }
        
        // Consume from containers and create history
        if (p.lots && p.lots.length > 0) {
          for (const lotUsage of p.lots) {
            await consumeFromContainers(lotUsage.lotId, lotUsage.quantityUsed, application.id);
          }
        }
      }
    }
    
    // También crear movimientos por lotes si se especifican (legacy support)
    if (lots) {
      for (const lot of lots) {
        const lotData = await prisma.lot.findUnique({ where: { id: lot.lotId } });
        if (lotData) {
          await prisma.movement.create({
            data: {
              productId: lotData.productId,
              lotId: lot.lotId,
              type: 'SALIDA',
              quantity: Number(lot.quantityUsed),
              notes: `Salida por aplicación (lote) ${type}`,
              applicationId: application.id
            }
          });
          
          // Consume from containers and create history
          await consumeFromContainers(lot.lotId, lot.quantityUsed, application.id);
        }
      }
    }
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Error creating application' });
  }
});

// PUT /api/applications/:id - Actualizar aplicación
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fieldId, type, date, waterAmount, notes, products, lots } = req.body;
    
    // Obtener aplicación existente
    const existingApp = await prisma.application.findUnique({
      where: { id },
      include: { applicationProducts: true }
    });

    if (!existingApp) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Eliminar productos existentes
    await prisma.applicationProduct.deleteMany({
      where: { applicationId: id }
    });

    const application = await prisma.application.update({
      where: { id },
      data: {
        fieldId,
        type,
        date: date ? new Date(date) : undefined,
        waterAmount: waterAmount ? Number(waterAmount) : undefined,
        notes,
        applicationProducts: products ? {
          create: products.map((p: { productId: string; dosePerHectare?: number; concentration?: number; quantityUsed: number; lots?: any[] }) => ({
            productId: p.productId,
            dosePerHectare: p.dosePerHectare ? Number(p.dosePerHectare) : null,
            concentration: p.concentration ? Number(p.concentration) : null,
            quantityUsed: Number(p.quantityUsed),
            lotsUsed: p.lots ? JSON.stringify(p.lots) : null
          }))
        } : undefined,
        applicationLots: lots ? {
          deleteMany: { applicationId: id },
          create: lots.map((lot: { lotId: string; quantityUsed: number | string }) => ({
            lotId: lot.lotId,
            quantityUsed: Number(lot.quantityUsed)
          }))
        } : undefined
      },
      include: { 
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      }
    });
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Error updating application' });
  }
});

// DELETE /api/applications/:id - Eliminar aplicación
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Get existing movements for this application to reverse them
    const existingMovements = await prisma.movement.findMany({
      where: { applicationId: id }
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
            notes: `Reversión por eliminación de aplicación`,
            applicationId: null // Clear reference
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
        // Get container and calculate current quantity from movements
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
              notes: `Reversión por eliminación de aplicación ${id.slice(0, 8)}`
            }
          });
        }
      }
    }
    
    // Delete the movements related to this application
    await prisma.movement.deleteMany({ where: { applicationId: id } });
    
    // Prisma maneja la eliminación en cascada de applicationProducts y applicationLots
    // gracias a onDelete: Cascade en el schema
    await prisma.application.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Error deleting application' });
  }
});

export default router;
