// ============================================
// Repository: Field
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateFieldDto, UpdateFieldDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class FieldRepository {
  
  async findAll(): Promise<any[]> {
    const fields = await prisma.field.findMany({
      orderBy: { name: 'asc' }
    });
    return fields.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const field = await prisma.field.findUnique({
      where: { id }
    });
    return field ? transformDates(field) : null;
  }

  async create(data: CreateFieldDto): Promise<any> {
    const field = await prisma.field.create({
      data: {
        name: data.name,
        area: data.area,
        location: data.location
      }
    });
    return transformDates(field);
  }

  async update(id: string, data: UpdateFieldDto): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.location !== undefined) updateData.location = data.location;

    const field = await prisma.field.update({
      where: { id },
      data: updateData
    });
    return transformDates(field);
  }

  async delete(id: string): Promise<void> {
    await prisma.field.delete({ where: { id } });
  }
}

export const fieldRepository = new FieldRepository();
