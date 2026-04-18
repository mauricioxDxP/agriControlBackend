// ============================================
// Repository: Lot
// Capa de acceso a datos - Responsable solo de CRUD
// ============================================

import prisma from './prisma';
import { CreateLotDto, UpdateLotDto } from '../types';

// Helper para transformar fechas a string
const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.entryDate) result.entryDate = result.entryDate.toISOString();
  if (result.expiryDate) result.expiryDate = result.expiryDate.toISOString();
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

const transformLot = (lot: any) => transformDates(lot);
const transformLots = (lots: any[]) => lots.map(transformLot);

export class LotRepository {
  
  async findAll(): Promise<any[]> {
    const lots = await prisma.lot.findMany({
      include: {
        product: {
          include: {
            type: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } }
          }
        },
        containerType: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return transformLots(lots);
  }

  async findById(id: string): Promise<any | null> {
    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            type: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } }
          }
        },
        containerType: { select: { id: true, name: true } }
      }
    });
    return lot ? transformLot(lot) : null;
  }

  async findByProduct(productId: string): Promise<any[]> {
    const lots = await prisma.lot.findMany({
      where: { productId },
      include: {
        product: {
          include: {
            type: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } }
          }
        },
        containerType: { select: { id: true, name: true } }
      },
      orderBy: { entryDate: 'desc' }
    });
    return transformLots(lots);
  }

  async create(data: CreateLotDto): Promise<any> {
    // Buscar o crear el tipo de contenedor si se proporciona
    let containerTypeId: string | undefined;
    
    if (data.containerType) {
      let containerTypeModel = await prisma.containerTypeModel.findUnique({
        where: { name: data.containerType }
      });
      
      if (!containerTypeModel) {
        containerTypeModel = await prisma.containerTypeModel.create({
          data: { name: data.containerType, defaultUnit: 'L' }
        });
      }
      containerTypeId = containerTypeModel.id;
    }

    const lot = await prisma.lot.create({
      data: {
        productId: data.productId,
        entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        supplier: data.supplier,
        initialStock: data.initialStock,
        lotCode: data.lotCode ?? undefined,
        containerTypeId,
        containerCapacity: data.containerCapacity ?? undefined
      },
      include: {
        product: {
          include: {
            type: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } }
          }
        },
        containerType: { select: { id: true, name: true } }
      }
    });

    return transformLot(lot);
  }

  async update(id: string, data: UpdateLotDto): Promise<any> {
    const updateData: any = {};
    
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    }
    if (data.supplier !== undefined) {
      updateData.supplier = data.supplier;
    }
    if (data.initialStock !== undefined) {
      updateData.initialStock = data.initialStock;
    }
    if (data.lotCode !== undefined) {
      updateData.lotCode = data.lotCode || null;
    }

    const lot = await prisma.lot.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          include: {
            type: { select: { id: true, name: true } },
            state: { select: { id: true, name: true } }
          }
        },
        containerType: { select: { id: true, name: true } }
      }
    });

    return transformLot(lot);
  }

  async delete(id: string): Promise<void> {
    // Eliminar ApplicationLots asociadas al lote
    await prisma.applicationLot.deleteMany({ where: { lotId: id } });
    
    // Eliminar movimientos del lote
    await prisma.movement.deleteMany({ where: { lotId: id } });

    // Eliminar el lote
    await prisma.lot.delete({ where: { id } });
  }

  async createMovement(data: {
    productId: string;
    lotId: string;
    type: 'ENTRADA' | 'SALIDA';
    quantity: number;
    notes?: string;
  }) {
    return prisma.movement.create({ data });
  }
}

export const lotRepository = new LotRepository();
