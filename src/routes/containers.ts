import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/containers - Obtener todos los contenedores
router.get('/', async (req: Request, res: Response) => {
  try {
    const containers = await prisma.container.findMany({
      include: { lot: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate current quantity for each container
    const containersWithQuantity = await Promise.all(
      containers.map(async (container) => {
        const currentQuantity = await getContainerCurrentQuantity(container.id);
        return { ...container, currentQuantity };
      })
    );
    
    res.json(containersWithQuantity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching containers' });
  }
});

// GET /api/containers/:id - Obtener contenedor por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const container = await prisma.container.findUnique({
      where: { id },
      include: { lot: { include: { product: true } } }
    });
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    // Calculate current quantity from movements
    const currentQuantity = await getContainerCurrentQuantity(id);
    res.json({ ...container, currentQuantity });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching container' });
  }
});

// GET /api/containers/lot/:lotId - Obtener contenedores por lote
router.get('/lot/:lotId', async (req: Request, res: Response) => {
  try {
    const lotId = req.params.lotId as string;
    const containers = await prisma.container.findMany({
      where: { lotId },
      include: { lot: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching containers for lot' });
  }
});

// POST /api/containers - Crear contenedor
router.post('/', async (req: Request, res: Response) => {
  try {
    const { lotId, typeId, capacity, unit, status, name, notes } = req.body;
    const container = await prisma.container.create({
      data: {
        lotId,
        typeId,
        capacity: Number(capacity),
        unit,
        status: status || 'DISPONIBLE',
        name,
        notes
      },
      include: { lot: { include: { product: true } }, type: true }
    });
    
    // Create initial movement to track the full capacity
    await prisma.containerMovement.create({
      data: {
        containerId: container.id,
        type: 'INICIAL',
        quantity: Number(capacity),
        previousQuantity: 0,
        notes: 'Contenedor creado con carga completa'
      }
    });
    
    res.status(201).json(container);
  } catch (error) {
    res.status(500).json({ error: 'Error creating container' });
  }
});

// PUT /api/containers/:id - Actualizar contenedor
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { typeId, capacity, unit, status, name, notes } = req.body;
    const container = await prisma.container.update({
      where: { id },
      data: {
        typeId,
        capacity: capacity ? Number(capacity) : undefined,
        unit,
        status,
        name,
        notes
      },
      include: { lot: { include: { product: true } }, type: true }
    });
    res.json(container);
  } catch (error) {
    res.status(500).json({ error: 'Error updating container' });
  }
});

// Helper function to calculate current quantity from movements
async function getContainerCurrentQuantity(containerId: string): Promise<number> {
  const movements = await prisma.containerMovement.findMany({
    where: { containerId },
    orderBy: { createdAt: 'asc' }
  });
  
  // INICIAL and RECARGA are positive, CONSUMO is stored as negative
  return movements.reduce((total, m) => {
    if (m.type === 'CONSUMO') {
      return total - m.quantity;
    }
    return total + m.quantity;
  }, 0);
}

// PUT /api/containers/:id/consume - Consumir parte del contenedor
router.put('/:id/consume', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { quantity } = req.body;
    
    const container = await prisma.container.findUnique({ where: { id } });
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const previousQuantity = await getContainerCurrentQuantity(id);
    const newQuantity = previousQuantity - Number(quantity);
    const newStatus = newQuantity <= 0 ? 'VACIO' : newQuantity < container.capacity ? 'EN_USO' : 'DISPONIBLE';

    // Create consumption movement
    await prisma.containerMovement.create({
      data: {
        containerId: id,
        type: 'CONSUMO',
        quantity: Number(quantity),
        previousQuantity: previousQuantity,
        notes: 'Consumo manual'
      }
    });

    const updated = await prisma.container.update({
      where: { id },
      data: { status: newStatus },
      include: { lot: { include: { product: true } } }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error consuming from container' });
  }
});

// DELETE /api/containers/:id - Eliminar contenedor
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.container.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting container' });
  }
});

// GET /api/containers/:id/movements - Obtener movimientos de un contenedor
router.get('/:id/movements', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const movements = await prisma.containerMovement.findMany({
      where: { containerId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching container movements' });
  }
});

// GET /api/containers/movements/all - Obtener todos los movimientos de contenedores
router.get('/movements/all', async (req: Request, res: Response) => {
  try {
    const movements = await prisma.containerMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        container: {
          include: {
            lot: {
              include: { product: true }
            }
          }
        }
      }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching all container movements' });
  }
});

export default router;
