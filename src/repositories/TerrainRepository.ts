// ============================================
// Repository: Terrain
// Data access layer
// ============================================

import prisma from './prisma';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class TerrainRepository {
  
  async create(data: { name: string; location?: string; latitude?: number | null; longitude?: number | null }): Promise<any> {
    const terrain = await prisma.terrain.create({
      data: {
        name: data.name,
        location: data.location,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null
      },
      include: {
        fields: true
      }
    });
    return transformDates(terrain);
  }

  async findAll(): Promise<any[]> {
    const terrains = await prisma.terrain.findMany({
      include: {
        fields: {
          select: { id: true, name: true, area: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return terrains.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const terrain = await prisma.terrain.findUnique({
      where: { id },
      include: {
        fields: {
          select: { id: true, name: true, area: true }
        }
      }
    });
    return terrain ? transformDates(terrain) : null;
  }

  async update(id: string, data: { name?: string; location?: string; latitude?: number | null; longitude?: number | null }): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude ?? null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ?? null;

    const terrain = await prisma.terrain.update({
      where: { id },
      data: updateData,
      include: {
        fields: {
          select: { id: true, name: true, area: true }
        }
      }
    });
    return transformDates(terrain);
  }

  async delete(id: string): Promise<void> {
    // Check if has fields
    const fields = await prisma.field.findMany({
      where: { terrainId: id }
    });
    if (fields.length > 0) {
      throw new Error('Cannot delete terrain because it has associated fields');
    }
    await prisma.terrain.delete({ where: { id } });
  }

  async getTotalArea(id: string): Promise<number> {
    const fields = await prisma.field.findMany({
      where: { terrainId: id },
      select: { area: true }
    });
    return fields.reduce((sum, field) => sum + field.area, 0);
  }
}

export const terrainRepository = new TerrainRepository();