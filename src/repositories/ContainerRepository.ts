// ============================================
// Repository: Container
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateContainerDto, UpdateContainerDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class ContainerRepository {
  
  // Función auxiliar para calcular la cantidad actual de un contenedor
  private async calculateCurrentQuantity(containerId: string): Promise<number> {
    const movements = await prisma.containerMovement.findMany({
      where: { containerId },
      orderBy: { createdAt: 'asc' }
    });

    // Si no hay movimientos, retornar la capacidad como valor por defecto
    if (movements.length === 0) {
      const container = await prisma.container.findUnique({ where: { id: containerId } });
      return container ? container.capacity : 0;
    }

    let currentQuantity = 0;
    for (const m of movements) {
      if (m.type === 'INICIAL' || m.type === 'RECARGA') {
        currentQuantity += m.quantity;
      } else if (m.type === 'CONSUMO' || m.type === 'AJUSTE') {
        currentQuantity -= m.quantity;
      }
    }
    
    return Math.max(0, currentQuantity);
  }

  async findAll(): Promise<any[]> {
    const containers = await prisma.container.findMany({
      include: {
        lot: { include: { product: true } },
        type: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular currentQuantity para cada contenedor
    const containersWithQuantity = await Promise.all(containers.map(async (c) => {
      const currentQuantity = await this.calculateCurrentQuantity(c.id);
      const transformed = transformDates(c);
      return { ...transformed, currentQuantity };
    }));

    return containersWithQuantity;
  }

  async findById(id: string): Promise<any | null> {
    const container = await prisma.container.findUnique({
      where: { id },
      include: {
        lot: { include: { product: true } },
        type: true
      }
    });
    
    if (!container) return null;
    
    const currentQuantity = await this.calculateCurrentQuantity(container.id);
    return { ...transformDates(container), currentQuantity };
  }

  async findByLot(lotId: string): Promise<any[]> {
    const containers = await prisma.container.findMany({
      where: { lotId },
      include: { type: true },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular currentQuantity para cada contenedor
    const containersWithQuantity = await Promise.all(containers.map(async (c) => {
      const currentQuantity = await this.calculateCurrentQuantity(c.id);
      const transformed = transformDates(c);
      return { ...transformed, currentQuantity };
    }));

    return containersWithQuantity;
  }

  async create(data: CreateContainerDto): Promise<any> {
    const container = await prisma.container.create({
      data: {
        lotId: data.lotId,
        typeId: data.typeId,
        capacity: data.capacity,
        unit: data.unit,
        status: data.status || 'DISPONIBLE',
        name: data.name,
        notes: data.notes
      },
      include: {
        lot: { include: { product: true } },
        type: true
      }
    });

    // Crear movimiento inicial
    await prisma.containerMovement.create({
      data: {
        containerId: container.id,
        type: 'INICIAL',
        quantity: data.capacity,
        previousQuantity: 0,
        notes: 'Contenedor creado con carga inicial'
      }
    });

    // Devolver con currentQuantity
    return { ...transformDates(container), currentQuantity: data.capacity };
  }

  async update(id: string, data: UpdateContainerDto): Promise<any> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const container = await prisma.container.update({
      where: { id },
      data: updateData,
      include: {
        lot: { include: { product: true } },
        type: true
      }
    });
    
    const currentQuantity = await this.calculateCurrentQuantity(container.id);
    return { ...transformDates(container), currentQuantity };
  }

  async consume(id: string, quantity: number): Promise<any> {
    const container = await prisma.container.findUnique({ where: { id } });
    if (!container) throw new Error('Contenedor no encontrado');

    // Calcular la cantidad actual antes del consumo
    const previousQuantity = await this.calculateCurrentQuantity(id);
    const newQuantity = Math.max(0, previousQuantity - quantity);
    
    // Determinar el nuevo estado
    let newStatus: 'DISPONIBLE' | 'EN_USO' | 'VACIO' = 'EN_USO';
    if (newQuantity <= 0) {
      newStatus = 'VACIO';
    } else if (newQuantity >= container.capacity) {
      newStatus = 'DISPONIBLE';
    }

    const updated = await prisma.container.update({
      where: { id },
      data: { status: newStatus },
      include: {
        lot: { include: { product: true } },
        type: true
      }
    });

    // Registrar movimiento de consumo
    await prisma.containerMovement.create({
      data: {
        containerId: id,
        type: 'CONSUMO',
        quantity,
        previousQuantity,
        notes: 'Consumo de producto'
      }
    });

    // Devolver con la cantidad actualizada
    return { ...transformDates(updated), currentQuantity: newQuantity };
  }

  async delete(id: string): Promise<void> {
    await prisma.containerMovement.deleteMany({ where: { containerId: id } });
    await prisma.container.delete({ where: { id } });
  }

  async getMovements(containerId: string): Promise<any[]> {
    const movements = await prisma.containerMovement.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }
}

export const containerRepository = new ContainerRepository();
