// ============================================
// Repository: Product
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateProductDto, UpdateProductDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class ProductRepository {
  
  async findAll(): Promise<any[]> {
    const products = await prisma.product.findMany({
      include: {
        type: true,
        state: true
      },
      orderBy: { name: 'asc' }
    });
    return products.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        type: true,
        state: true
      }
    });
    return product ? transformDates(product) : null;
  }

  async create(data: CreateProductDto): Promise<any> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        genericName: data.genericName, // Nombre genérico (opcional)
        typeId: data.typeId,
        stateId: data.stateId,
        baseUnit: data.baseUnit,
        doseType: data.doseType,
        doseUnit: data.doseUnit,
        dosePerHectareMin: data.dosePerHectareMin,
        dosePerHectareMax: data.dosePerHectareMax,
        concentrationPerLiter: data.concentrationPerLiter,
        concentration: data.concentration
      },
      include: {
        type: true,
        state: true
      }
    });
    return transformDates(product);
  }

  async update(id: string, data: UpdateProductDto): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.genericName !== undefined) updateData.genericName = data.genericName;
    if (data.typeId !== undefined) updateData.typeId = data.typeId;
    if (data.stateId !== undefined) updateData.stateId = data.stateId;
    if (data.baseUnit !== undefined) updateData.baseUnit = data.baseUnit;
    if (data.doseType !== undefined) updateData.doseType = data.doseType;
    if (data.doseUnit !== undefined) updateData.doseUnit = data.doseUnit;
    // Manejar valores numéricos incluyendo null para borrar
    if (data.dosePerHectareMin !== undefined) updateData.dosePerHectareMin = data.dosePerHectareMin;
    if (data.dosePerHectareMax !== undefined) updateData.dosePerHectareMax = data.dosePerHectareMax;
    if (data.concentrationPerLiter !== undefined) updateData.concentrationPerLiter = data.concentrationPerLiter;
    if (data.concentration !== undefined) updateData.concentration = data.concentration;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        type: true,
        state: true
      }
    });
    return transformDates(product);
  }

  async delete(id: string): Promise<void> {
    // First delete related lots
    // await prisma.lot.deleteMany({ where: { productId: id } });
    // Then delete the product
    await prisma.product.delete({ where: { id } });
  }
}

export const productRepository = new ProductRepository();
