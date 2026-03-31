// ============================================
// Repository: Tank
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateTankDto, UpdateTankDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class TankRepository {
  
  async findAll(): Promise<any[]> {
    const tanks = await prisma.tank.findMany({
      orderBy: { name: 'asc' }
    });
    return tanks.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const tank = await prisma.tank.findUnique({
      where: { id }
    });
    return tank ? transformDates(tank) : null;
  }

  async create(data: CreateTankDto): Promise<any> {
    const tank = await prisma.tank.create({
      data: {
        name: data.name,
        capacity: data.capacity
      }
    });
    return transformDates(tank);
  }

  async update(id: string, data: UpdateTankDto): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;

    const tank = await prisma.tank.update({
      where: { id },
      data: updateData
    });
    return transformDates(tank);
  }

  async delete(id: string): Promise<void> {
    await prisma.tank.delete({ where: { id } });
  }
}

export const tankRepository = new TankRepository();
