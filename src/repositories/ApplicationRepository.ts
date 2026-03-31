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
    const application = await prisma.application.create({
      data: {
        fieldId: data.fieldId,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
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
}

export const applicationRepository = new ApplicationRepository();
