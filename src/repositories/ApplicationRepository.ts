// ============================================
// Repository: Application
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateApplicationDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.date) result.date = result.date.toISOString();
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class ApplicationRepository {
  
  async findAll(): Promise<any[]> {
    const applications = await prisma.application.findMany({
      include: {
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      },
      orderBy: { date: 'desc' }
    });
    return applications.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      }
    });
    return application ? transformDates(application) : null;
  }

  async findByField(fieldId: string): Promise<any[]> {
    const applications = await prisma.application.findMany({
      where: { fieldId },
      include: {
        field: true,
        applicationProducts: { include: { product: true } },
        applicationLots: { include: { lot: { include: { product: true } } } }
      },
      orderBy: { date: 'desc' }
    });
    return applications.map(transformDates);
  }

  async create(data: CreateApplicationDto): Promise<any> {
    // Parse date in UTC to avoid timezone shifts
    let dateValue: Date;
    if (data.date) {
      const [year, month, day] = data.date.split('-').map(Number);
      dateValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      dateValue = new Date();
    }
    
    const application = await prisma.application.create({
      data: {
        fieldId: data.fieldId,
        type: data.type,
        date: dateValue,
        waterAmount: data.waterAmount,
        notes: data.notes
      },
      include: {
        field: true
      }
    });

    // Crear productos de aplicación
    if (data.products) {
      for (const p of data.products) {
        await prisma.applicationProduct.create({
          data: {
            applicationId: application.id,
            productId: p.productId,
            dosePerHectare: p.dosePerHectare,
            concentration: p.concentration,
            concentrationPerLiter: p.concentrationPerLiter,
            quantityUsed: p.quantityUsed,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined
          }
        });
      }
    }

    // Crear lotes de aplicación
    if (data.lots) {
      for (const l of data.lots) {
        await prisma.applicationLot.create({
          data: {
            applicationId: application.id,
            lotId: l.lotId,
            quantityUsed: l.quantityUsed
          }
        });
      }
    }

    // Retornar con relaciones
    return this.findById(application.id);
  }

  async delete(id: string): Promise<void> {
    await prisma.applicationProduct.deleteMany({ where: { applicationId: id } });
    await prisma.applicationLot.deleteMany({ where: { applicationId: id } });
    await prisma.application.delete({ where: { id } });
  }

  async update(id: string, data: CreateApplicationDto): Promise<any> {
    // Parse date in UTC to avoid timezone shifts
    let dateValue: Date;
    if (data.date) {
      const [year, month, day] = data.date.split('-').map(Number);
      dateValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      dateValue = new Date();
    }
    
    // Actualizar la aplicación
    await prisma.application.update({
      where: { id },
      data: {
        fieldId: data.fieldId,
        type: data.type,
        date: dateValue,
        waterAmount: data.waterAmount,
        notes: data.notes
      }
    });

    // Eliminar productos y lotes existentes
    await prisma.applicationProduct.deleteMany({ where: { applicationId: id } });
    await prisma.applicationLot.deleteMany({ where: { applicationId: id } });

    // Crear nuevos productos
    if (data.products) {
      for (const p of data.products) {
        await prisma.applicationProduct.create({
          data: {
            applicationId: id,
            productId: p.productId,
            dosePerHectare: p.dosePerHectare,
            concentration: p.concentration,
            concentrationPerLiter: p.concentrationPerLiter,
            quantityUsed: p.quantityUsed,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined
          }
        });
      }
    }

    // Crear nuevos lotes
    if (data.lots) {
      for (const l of data.lots) {
        await prisma.applicationLot.create({
          data: {
            applicationId: id,
            lotId: l.lotId,
            quantityUsed: l.quantityUsed
          }
        });
      }
    }

    return this.findById(id);
  }
}

export const applicationRepository = new ApplicationRepository();
