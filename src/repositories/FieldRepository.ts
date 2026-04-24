// ============================================
// Repository: Field
// Data access layer
// ============================================

import prisma from './prisma';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  if (result.deletedAt) result.deletedAt = result.deletedAt.toISOString();
  return result;
};

export class FieldRepository {
  
  async create(data: { name: string; area: number; terrainId: string }): Promise<any> {
    const field = await prisma.field.create({
      data: {
        name: data.name,
        area: data.area,
        terrainId: data.terrainId
      },
      include: {
        terrain: { select: { id: true, name: true } },
        plantings: { select: { id: true, productId: true, startDate: true, endDate: true } }
      }
    });
    return transformDates(field);
  }

  async findAll(includeDeleted: boolean = false): Promise<any[]> {
    const fields = await prisma.field.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      include: {
        terrain: { select: { id: true, name: true } },
        plantings: { 
          where: { deletedAt: null },
          select: { id: true, productId: true, startDate: true, endDate: true } 
        }
      },
      orderBy: { name: 'asc' }
    });
    return fields.map(transformDates);
  }

  async findByTerrainId(terrainId: string, includeDeleted: boolean = false): Promise<any[]> {
    const fields = await prisma.field.findMany({
      where: { terrainId, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        terrain: { select: { id: true, name: true } },
        plantings: { 
          where: { deletedAt: null },
          select: { id: true, productId: true, startDate: true, endDate: true } 
        }
      },
      orderBy: { name: 'asc' }
    });
    return fields.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const field = await prisma.field.findUnique({
      where: { id },
      include: {
        terrain: { select: { id: true, name: true } },
        plantings: { 
          where: { deletedAt: null },
          select: { id: true, productId: true, startDate: true, endDate: true } 
        }
      }
    });
    return field ? transformDates(field) : null;
  }

  async update(id: string, data: { name?: string; area?: number; terrainId?: string }): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.terrainId !== undefined) updateData.terrainId = data.terrainId;

    const field = await prisma.field.update({
      where: { id },
      data: updateData,
      include: {
        terrain: { select: { id: true, name: true } },
        plantings: { 
          where: { deletedAt: null },
          select: { id: true, productId: true, startDate: true, endDate: true } 
        }
      }
    });
    return transformDates(field);
  }

  /**
   * Delete field with soft/hard delete logic:
   * - If field has applications or tancadas -> soft delete (set deletedAt)
   * - If field has no related records -> hard delete
   */
  async delete(id: string): Promise<{ type: 'soft' | 'hard'; fieldId: string }> {
    // Check for related applications
    const applicationCount = await prisma.application.count({
      where: { fieldId: id }
    });

    // Check for related tancadas
    const tancadaCount = await prisma.tancadaField.count({
      where: { fieldId: id }
    });

    const hasRelatedRecords = applicationCount > 0 || tancadaCount > 0;

    if (hasRelatedRecords) {
      // Soft delete: set deletedAt
      await prisma.field.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return { type: 'soft', fieldId: id };
    }

    // Hard delete: actually remove the record
    await prisma.field.delete({ where: { id } });
    return { type: 'hard', fieldId: id };
  }
}

export const fieldRepository = new FieldRepository();
