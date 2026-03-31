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
    
    // Obtener lots con containerType para cada tancadaProduct
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
    
    // Obtener lots con containerType
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
    // Debug: log products data
    console.log('Creating Tancada with products:', JSON.stringify(data.products, null, 2));
    
    const tancada = await prisma.tancada.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        tankCapacity: data.tankCapacity,
        waterAmount: data.waterAmount,
        notes: data.notes
      }
    });

    // Crear productos de tancada y movimientos de salida
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

        // Crear movimiento de SALIDA por cada lote utilizado
        if (p.lots && p.lots.length > 0) {
          for (const lotUsage of p.lots) {
            // Buscar el lote para obtener el productId
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
                  tancadaId: tancada.id,
                  notes: `Salida por tancada - ${p.productId}`
                }
              });

              // Actualizar contenedores del lote
              await this.updateContainersFromTancada(lotUsage.lotId, lotUsage.quantityUsed, tancada.id);
            }
          }
        }
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

              // Actualizar contenedores del lote
              await this.updateContainersFromTancada(lotUsage.lotId, lotUsage.quantityUsed, id);
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

  // Función auxiliar para actualizar contenedores de un lote
  private async updateContainersFromTancada(lotId: string, quantityUsed: number, tancadaId: string): Promise<void> {
    // Obtener todos los contenedores del lote ordenados por fecha de creación
    const containers = await prisma.container.findMany({
      where: { lotId },
      orderBy: { createdAt: 'asc' }
    });

    let remainingToConsume = quantityUsed;

    for (const container of containers) {
      if (remainingToConsume <= 0) break;
      if (container.status === 'VACIO') continue;

      // Obtener la cantidad actual del contenedor (calculada desde containerMovements)
      const movements = await prisma.containerMovement.findMany({
        where: { containerId: container.id },
        orderBy: { createdAt: 'asc' }
      });

      let currentQuantity = 0;
      for (const m of movements) {
        if (m.type === 'INICIAL' || m.type === 'RECARGA') {
          currentQuantity += m.quantity;
        } else if (m.type === 'CONSUMO' || m.type === 'AJUSTE') {
          currentQuantity -= m.quantity;
        }
      }

      if (currentQuantity <= 0) continue;

      // Calcular cuánto consumir de este contenedor
      const quantityToConsume = Math.min(currentQuantity, remainingToConsume);
      
      // Crear movimiento de consumo
      await prisma.containerMovement.create({
        data: {
          containerId: container.id,
          type: 'CONSUMO',
          quantity: quantityToConsume,
          previousQuantity: currentQuantity,
          notes: `Consumo por tancada ${tancadaId}`
        }
      });

      // Actualizar estado del contenedor
      const newQuantity = currentQuantity - quantityToConsume;
      let newStatus: 'DISPONIBLE' | 'EN_USO' | 'VACIO' = 'EN_USO';
      if (newQuantity <= 0) {
        newStatus = 'VACIO';
      } else if (newQuantity < container.capacity) {
        newStatus = 'EN_USO';
      } else {
        newStatus = 'DISPONIBLE';
      }

      await prisma.container.update({
        where: { id: container.id },
        data: { status: newStatus }
      });

      remainingToConsume -= quantityToConsume;
    }
  }

  async delete(id: string): Promise<void> {
    // Primero obtener los movimientos de salida asociados a esta tancada para revertir contenedores
    const movements = await prisma.movement.findMany({
      where: { tancadaId: id }
    });

    // Por cada movimiento, revertir los contenedores
    for (const movement of movements) {
      if (movement.lotId) {
        await this.revertContainersFromTancada(movement.lotId, movement.quantity, id);
      }
    }

    // Eliminar los movimientos de salida
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    await prisma.tancadaProduct.deleteMany({ where: { tancadaId: id } });
    await prisma.tancadaField.deleteMany({ where: { tancadaId: id } });
    await prisma.tancada.delete({ where: { id } });
  }

  // Función auxiliar para revertir contenedores al eliminar tancada
  private async revertContainersFromTancada(lotId: string, quantityToRevert: number, tancadaId: string): Promise<void> {
    // Obtener los movimientos de consumo de esta tancada específicos del lote
    const consumptionMovements = await prisma.containerMovement.findMany({
      where: {
        notes: { contains: `tancada ${tancadaId}` }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Por cada movimiento de consumo, revertirlo
    for (const cm of consumptionMovements) {
      if (quantityToRevert <= 0) break;

      const container = await prisma.container.findUnique({
        where: { id: cm.containerId }
      });

      if (!container) continue;

      // Revertir el consumo creando una recarga
      await prisma.containerMovement.create({
        data: {
          containerId: cm.containerId,
          type: 'RECARGA',
          quantity: cm.quantity,
          previousQuantity: cm.previousQuantity + cm.quantity,
          notes: `Reversión por eliminación de tancada ${tancadaId}`
        }
      });

      // Actualizar estado del contenedor
      const newQuantity = cm.previousQuantity + cm.quantity;
      let newStatus: 'DISPONIBLE' | 'EN_USO' | 'VACIO' = 'EN_USO';
      if (newQuantity >= container.capacity) {
        newStatus = 'DISPONIBLE';
      } else if (newQuantity <= 0) {
        newStatus = 'VACIO';
      }

      await prisma.container.update({
        where: { id: container.id },
        data: { status: newStatus }
      });

      quantityToRevert -= cm.quantity;
    }
  }
}

export const tancadaRepository = new TancadaRepository();
