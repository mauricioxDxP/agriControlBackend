// ============================================
// Repository: Planting
// Data access layer
// ============================================

import prisma from './prisma';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.startDate) result.startDate = result.startDate.toISOString();
  if (result.endDate) result.endDate = result.endDate.toISOString();
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class PlantingRepository {
  
  async create(data: { fieldId: string; productId: string; startDate: Date; notes?: string }): Promise<any> {
    const planting = await prisma.planting.create({
      data: {
        fieldId: data.fieldId,
        productId: data.productId,
        startDate: data.startDate,
        notes: data.notes
      },
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      }
    });
    return transformDates(planting);
  }

  async findByFieldId(fieldId: string): Promise<any[]> {
    const plantings = await prisma.planting.findMany({
      where: { fieldId },
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return plantings.map(transformDates);
  }

  async findCurrentByFieldId(fieldId: string): Promise<any[]> {
    const plantings = await prisma.planting.findMany({
      where: {
        fieldId,
        endDate: null
      },
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return plantings.map(transformDates);
  }

  async findAll(fieldId?: string, active?: boolean): Promise<any[]> {
    const where: any = {};
    if (fieldId) where.fieldId = fieldId;
    if (active === true) where.endDate = null;
    if (active === false) where.endDate = { not: null };

    const plantings = await prisma.planting.findMany({
      where,
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return plantings.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const planting = await prisma.planting.findUnique({
      where: { id },
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      }
    });
    return planting ? transformDates(planting) : null;
  }

  async update(id: string, data: { endDate?: Date; notes?: string }): Promise<any> {
    const updateData: any = {};
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const planting = await prisma.planting.update({
      where: { id },
      data: updateData,
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      }
    });
    return transformDates(planting);
  }

  async endPlanting(id: string, endDate: Date): Promise<any> {
    const planting = await prisma.planting.update({
      where: { id },
      data: { endDate },
      include: {
        field: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, typeId: true } }
      }
    });
    return transformDates(planting);
  }

  async delete(id: string): Promise<void> {
    await prisma.planting.delete({ where: { id } });
  }
}

export const plantingRepository = new PlantingRepository();