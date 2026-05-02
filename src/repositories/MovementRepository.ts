// ============================================
// Repository: Movement
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateMovementDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class MovementRepository {
  
  async findAll(): Promise<any[]> {
    const movements = await prisma.movement.findMany({
      include: {
        product: true,
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }

  async findByProduct(productId: string): Promise<any[]> {
    const movements = await prisma.movement.findMany({
      where: { productId },
      include: {
        product: true,
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }

  async findByLot(lotId: string): Promise<any[]> {
    const movements = await prisma.movement.findMany({
      where: { lotId },
      include: {
        product: true,
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }

  async findByTancada(tancadaId: string): Promise<any[]> {
    const movements = await prisma.movement.findMany({
      where: { tancadaId },
      include: {
        product: true,
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }

  async findByApplication(applicationId: string): Promise<any[]> {
    const movements = await prisma.movement.findMany({
      where: { applicationId },
      include: {
        product: true,
        lot: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }

  async create(data: CreateMovementDto): Promise<any> {
    const movement = await prisma.movement.create({
      data: {
        productId: data.productId,
        lotId: data.lotId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
        tancadaId: data.tancadaId,
        applicationId: data.applicationId
      },
      include: {
        product: true,
        lot: true
      }
    });
    return transformDates(movement);
  }

  async findById(id: string): Promise<any | null> {
    const movement = await prisma.movement.findUnique({
      where: { id },
      include: {
        product: true,
        lot: true
      }
    });
    return movement ? transformDates(movement) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.movement.delete({ where: { id } });
  }

  async getStock(productId: string): Promise<number> {
    const movements = await prisma.movement.findMany({
      where: { productId }
    });
    
    return movements.reduce((total, m) => {
      return m.type === 'ENTRADA' 
        ? total + m.quantity 
        : total - m.quantity;
    }, 0);
  }

  async getLotStock(lotId: string): Promise<number> {
    const movements = await prisma.movement.findMany({
      where: { lotId }
    });
    
    return movements.reduce((total, m) => {
      return m.type === 'ENTRADA' 
        ? total + m.quantity 
        : total - m.quantity;
    }, 0);
  }
}

export const movementRepository = new MovementRepository();
