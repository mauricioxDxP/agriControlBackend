// ============================================
// Repository: Tancada
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateTancadaDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.date) result.date = result.date.toISOString();
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class TancadaRepository {
  
  async findAll(): Promise<any[]> {
    const tancadas = await prisma.tancada.findMany({
      include: {
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      },
      orderBy: { date: 'desc' }
    });
    
    // Obtener lots para cada tancadaProduct
    const tancadasWithLots = await Promise.all(tancadas.map(async (t) => {
      const tancadaProducts = await Promise.all(t.tancadaProducts.map(async (tp) => {
        if (tp.lotsUsed) {
          try {
            const lotsUsed = JSON.parse(tp.lotsUsed);
            if (Array.isArray(lotsUsed) && lotsUsed.length > 0) {
              const lotIds = lotsUsed.map((l: any) => l.lotId);
              const lots = await prisma.lot.findMany({
                where: { id: { in: lotIds } },
                include: { containerType: true }
              });
              return { ...tp, lotsData: lots };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        return { ...tp, lotsData: [] };
      }));
      return { ...t, tancadaProducts };
    }));
    
    return tancadasWithLots.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const tancada = await prisma.tancada.findUnique({
      where: { id },
      include: {
        tancadaProducts: { include: { product: true } },
        tancadaFields: { include: { field: true } }
      }
    });
    
    if (!tancada) return null;
    
    // Obtener lots
    const tancadaProducts = await Promise.all(tancada.tancadaProducts.map(async (tp) => {
      if (tp.lotsUsed) {
        try {
          const lotsUsed = JSON.parse(tp.lotsUsed);
          if (Array.isArray(lotsUsed) && lotsUsed.length > 0) {
            const lotIds = lotsUsed.map((l: any) => l.lotId);
            const lots = await prisma.lot.findMany({
              where: { id: { in: lotIds } },
              include: { containerType: true }
            });
            return { ...tp, lotsData: lots };
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      return { ...tp, lotsData: [] };
    }));
    
    return transformDates({ ...tancada, tancadaProducts });
  }

  async create(data: CreateTancadaDto): Promise<any> {
    const tancada = await prisma.tancada.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        tankCapacity: data.tankCapacity,
        waterAmount: data.waterAmount,
        notes: data.notes
      }
    });

    // Crear productos de tancada
    if (data.products) {
      for (const p of data.products) {
        await prisma.tancadaProduct.create({
          data: {
            tancadaId: tancada.id,
            productId: p.productId,
            concentration: p.concentration,
            quantity: p.quantity,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined
          }
        });
      }
    }

    // Crear campos tratados
    if (data.fields) {
      for (const f of data.fields) {
        await prisma.tancadaField.create({
          data: {
            tancadaId: tancada.id,
            fieldId: f.fieldId,
            hectaresTreated: f.hectaresTreated,
            productUsed: f.productUsed
          }
        });
      }
    }

    return this.findById(tancada.id);
  }

  async update(id: string, data: CreateTancadaDto): Promise<any> {
    await prisma.tancadaProduct.deleteMany({ where: { tancadaId: id } });
    await prisma.tancadaField.deleteMany({ where: { tancadaId: id } });
    await prisma.movement.deleteMany({ where: { tancadaId: id } });

    await prisma.tancada.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        tankCapacity: data.tankCapacity,
        waterAmount: data.waterAmount,
        notes: data.notes
      }
    });

    if (data.products) {
      for (const p of data.products) {
        await prisma.tancadaProduct.create({
          data: {
            tancadaId: id,
            productId: p.productId,
            concentration: p.concentration,
            quantity: p.quantity,
            lotsUsed: p.lots ? JSON.stringify(p.lots) : undefined
          }
        });

        // Crear movimiento de SALIDA por cada lote utilizado
        if (p.lots && p.lots.length > 0) {
          for (const lotUsage of p.lots) {
            const lot = await prisma.lot.findUnique({
              where: { id: lotUsage.lotId }
            });
            
            if (lot) {
              await prisma.movement.create({
                data: {
                  productId: lot.productId,
                  lotId: lotUsage.lotId,
                  type: 'SALIDA',
                  quantity: lotUsage.quantityUsed,
                  tancadaId: id,
                  notes: `Salida por tancada - ${p.productId}`
                }
              });
            }
          }
        }
      }
    }

    if (data.fields) {
      for (const f of data.fields) {
        await prisma.tancadaField.create({
          data: {
            tancadaId: id,
            fieldId: f.fieldId,
            hectaresTreated: f.hectaresTreated,
            productUsed: f.productUsed
          }
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    // Eliminar los movimientos de salida
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    await prisma.tancadaProduct.deleteMany({ where: { tancadaId: id } });
    await prisma.tancadaField.deleteMany({ where: { tancadaId: id } });
    await prisma.tancada.delete({ where: { id } });
  }
}

export const tancadaRepository = new TancadaRepository();
