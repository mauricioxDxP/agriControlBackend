// ============================================
// Repository: LotLine
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateLotLineDto, UpdateLotLineDto } from '../types';
import { LotLine } from '@prisma/client';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  return result;
};

export class LotLineRepository {
  
  async findAll(): Promise<any[]> {
    const lotLines = await prisma.lotLine.findMany({
      include: {
        lot: { include: { product: true } },
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return lotLines.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const lotLine = await prisma.lotLine.findUnique({
      where: { id },
      include: {
        lot: { include: { product: true } },
        product: true
      }
    });
    
    if (!lotLine) return null;
    return transformDates(lotLine);
  }

  async findByLot(lotId: string): Promise<any[]> {
    const lotLines = await prisma.lotLine.findMany({
      where: { lotId },
      include: {
        lot: { include: { product: true } },
        product: true
      },
      orderBy: { type: 'asc' }
    });

    return lotLines.map(transformDates);
  }
  async addToState(lotLine:LotLine,units:number,state:string='EMPTY')
  {
          const existingEmpty = await prisma.lotLine.findFirst({
          where: {
            lotId: lotLine.lotId,
            productId: lotLine.productId,
            type: state,
            capacity: lotLine.capacity,
            unit: lotLine.unit
          }
        });
        if (existingEmpty) {
          // Aumentar unidades de la línea EMPTY existente
          await prisma.lotLine.update({
            where: { id: existingEmpty.id },
            data: { units: existingEmpty.units + units }
          });
        } else {
          // Crear nueva línea EMPTY
          await prisma.lotLine.create({
            data: {
              lotId: lotLine.lotId,
              productId: lotLine.productId,
              type: 'EMPTY',
              units: units,
              capacity: lotLine.capacity,
              unit: lotLine.unit
            }
          });
        }
  }
  async create(data: CreateLotLineDto): Promise<any> {
    // Verificar si ya existe una línea para este lote con el mismo tipo
    const existing = await prisma.lotLine.findFirst({
      where: {
        lotId: data.lotId,
        type: data.type,
        capacity: data.capacity,
        unit: data.unit
      }
    });

    if (existing) {
      // Actualizar unidades existentes
      const updated = await prisma.lotLine.update({
        where: { id: existing.id },
        data: {
          units: existing.units + data.units,
          remainingVolume: data.remainingVolume || (data.type === 'FULL' ? data.capacity : data.remainingVolume)
        },
        include: {
          lot: { include: { product: true } },
          product: true
        }
      });
      return transformDates(updated);
    }

    // Crear nueva línea
    const lotLine = await prisma.lotLine.create({
      data: {
        lotId: data.lotId,
        productId: data.productId,
        type: data.type,
        units: data.units,
        remainingVolume: data.remainingVolume || (data.type === 'FULL' ? data.capacity : data.remainingVolume),
        capacity: data.capacity,
        unit: data.unit
      },
      include: {
        lot: { include: { product: true } },
        product: true
      }
    });

    return transformDates(lotLine);
  }

  async update(id: string, data: UpdateLotLineDto): Promise<any> {
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.units !== undefined) updateData.units = data.units;
    if (data.remainingVolume !== undefined) updateData.remainingVolume = data.remainingVolume;

    const lotLine = await prisma.lotLine.update({
      where: { id },
      data: updateData,
      include: {
        lot: { include: { product: true } },
        product: true
      }
    });
    
    return transformDates(lotLine);
  }

  // Consumir de una línea de lote 
  // - Si FULL: reduce units y crea una línea PARTIAL con el volumen restante (si hay más de 1 unidad)
  // - Si PARTIAL: cuando se empty, crea línea EMPTY con los contenedores vacíos
  async consume(id: string, quantity: number): Promise<any> {
    const lotLine = await prisma.lotLine.findUnique({ where: { id } });
    if (!lotLine) throw new Error('Línea de lote no encontrada');

    const previousVolume = lotLine.type === 'FULL' 
      ? lotLine.capacity 
      : (lotLine.remainingVolume || lotLine.capacity);

    if (lotLine.type === 'FULL') {

      const unitsToConsume = Math.floor(quantity/lotLine.capacity)
      const remainingToConsume = quantity%lotLine.capacity;
      // FULL: separar - mantener las unidades restantes como FULL, convertir 1 a PARTIAL
      const remainingUnits = lotLine.units - unitsToConsume;
      const newRemainingVolumen = remainingToConsume;
      await prisma.lotLine.update({
        where : {id},
        data: { 
          units:remainingUnits
        }
      })
      if (newRemainingVolumen>0)
      {
        await prisma.lotLine.create({
          data: {
            lotId: lotLine.lotId,
            productId: lotLine.productId,
            type: 'PARTIAL',
            units: 1,
            capacity: lotLine.capacity,
            unit: lotLine.unit,
            remainingVolume: lotLine.capacity - newRemainingVolumen
          }
        });
        this.addToState(lotLine,-1,'FULL');
      }
       this.addToState(lotLine,unitsToConsume);
    } else if (lotLine.type === 'PARTIAL') {
      let newRemaining = (lotLine.remainingVolume || lotLine.capacity) - quantity;
      
      if (newRemaining <= 0) {
        // Se terminó este contenedor: crear línea EMPTY
        this.addToState(lotLine,1);
      } else {
        // Actualizar el remainingVolume
        await prisma.lotLine.update({
          where: { id },
          data: { remainingVolume: newRemaining }
        });
      }
    }

    // Obtener la línea actualizada (o null si se eliminó)
    const updated = await prisma.lotLine.findUnique({ 
      where: { id },
      include: {
        lot: { include: { product: true } },
        product: true
      }
    });

    // Registrar movimiento
    await prisma.lotLineMovement.create({
      data: {
        lotLineId: id,
        type: 'CONSUMO',
        quantity,
        previousVolume,
        notes: 'Consumo por aplicación'
      }
    });

    return transformDates(updated);
  }

  // Recargar una línea de lote
  // - Si EMPTY: rellena todos los contenedores completos y actualiza o crea línea con type FULL
  // - Si PARTIAL: completa el contenedor actual
  async recharge(id: string, quantity?: number): Promise<any> {
    const lotLine = await prisma.lotLine.findUnique({ where: { id } });
    if (!lotLine) throw new Error('Línea de lote no encontrada');

    const rechargeAmount = quantity || lotLine.capacity;
    const previousVolume = lotLine.type === 'EMPTY' ? 0 : (lotLine.remainingVolume || lotLine.capacity);

    if (lotLine.type === 'EMPTY') {
      // Obtener todas las líneas EMPTY del mismo lote con misma capacidad y unidad
      const emptyLines = await prisma.lotLine.findMany({
        where: {
          lotId: lotLine.lotId,
          productId: lotLine.productId,
          type: 'EMPTY',
          capacity: lotLine.capacity,
          unit: lotLine.unit
        }
      });

      if (emptyLines.length === 0) {
        throw new Error('No hay líneas EMPTY para recargar');
      }

      // Calcular cuántos contenedores podemos llenar completamente
      const totalEmptyUnits = emptyLines.reduce((sum, line) => sum + line.units, 0);
      const unitsToFill = Math.min(totalEmptyUnits, Math.floor(rechargeAmount / lotLine.capacity));
      const remainingAfterFull = rechargeAmount - (unitsToFill * lotLine.capacity);

      // 1. Convertir X contenedores a FULL
      let unitsRemainingToFill = unitsToFill;
      
      for (const emptyLine of emptyLines) {
        if (unitsRemainingToFill <= 0) break;
        
        const unitsToTake = Math.min(emptyLine.units, unitsRemainingToFill);
        
        // Buscar o crear línea FULL
        const existingFull = await prisma.lotLine.findFirst({
          where: {
            lotId: lotLine.lotId,
            productId: lotLine.productId,
            type: 'FULL',
            capacity: lotLine.capacity,
            unit: lotLine.unit
          }
        });

        if (existingFull) {
          await prisma.lotLine.update({
            where: { id: existingFull.id },
            data: { units: existingFull.units + unitsToTake }
          });
        } else {
          await prisma.lotLine.create({
            data: {
              lotId: lotLine.lotId,
              productId: lotLine.productId,
              type: 'FULL',
              units: unitsToTake,
              capacity: lotLine.capacity,
              unit: lotLine.unit
            }
          });
        }

        // Reducir las unidades EMPTY
        if (emptyLine.units === unitsToTake) {
          await prisma.lotLine.delete({ where: { id: emptyLine.id } });
        } else {
          await prisma.lotLine.update({
            where: { id: emptyLine.id },
            data: { units: emptyLine.units - unitsToTake }
          });
        }

        unitsRemainingToFill -= unitsToTake;
      }

      // 2. Si queda volumen restante (menor a un contenedor completo), crear línea PARTIAL
      if (remainingAfterFull > 0) {
        // Buscar línea PARTIAL existente
        const existingPartial = await prisma.lotLine.findFirst({
          where: {
            lotId: lotLine.lotId,
            productId: lotLine.productId,
            type: 'PARTIAL',
            capacity: lotLine.capacity,
            unit: lotLine.unit
          }
        });

        if (existingPartial) {
          // Sumar al partial existente
          const newRemaining = existingPartial.remainingVolume! + remainingAfterFull;
          if (newRemaining >= lotLine.capacity) {
            // Se llena, convertir a FULL
            const existingFull = await prisma.lotLine.findFirst({
              where: {
                lotId: lotLine.lotId,
                productId: lotLine.productId,
                type: 'FULL',
                capacity: lotLine.capacity,
                unit: lotLine.unit
              }
            });

            if (existingFull) {
              await prisma.lotLine.update({
                where: { id: existingFull.id },
                data: { units: existingFull.units + 1 }
              });
            } else {
              await prisma.lotLine.create({
                data: {
                  lotId: lotLine.lotId,
                  productId: lotLine.productId,
                  type: 'FULL',
                  units: 1,
                  capacity: lotLine.capacity,
                  unit: lotLine.unit
                }
              });
            }

            // Eliminar el PARTIAL y crear nuevo con lo que sobre
            const leftover = newRemaining - lotLine.capacity;
            if (leftover > 0) {
              await prisma.lotLine.update({
                where: { id: existingPartial.id },
                data: { remainingVolume: leftover }
              });
            } else {
              await prisma.lotLine.delete({ where: { id: existingPartial.id } });
            }
          } else {
            await prisma.lotLine.update({
              where: { id: existingPartial.id },
              data: { remainingVolume: newRemaining }
            });
          }
        } else {
          // Crear nuevo PARTIAL con el volumen restante (el contenedor tiene lo que se consumió)
          await prisma.lotLine.create({
            data: {
              lotId: lotLine.lotId,
              productId: lotLine.productId,
              type: 'PARTIAL',
              units: 1,
              capacity: lotLine.capacity,
              unit: lotLine.unit,
              remainingVolume: lotLine.capacity - remainingAfterFull
            }
          });
        }
      }

      // Registrar movimiento
      await prisma.lotLineMovement.create({
        data: {
          lotLineId: id,
          type: 'RECARGA',
          quantity: rechargeAmount,
          previousVolume,
          notes: 'Recarga de contenedor (EMPTY a FULL)'
        }
      });

      // Retornar la línea actualizada
      const updated = await prisma.lotLine.findUnique({
        where: { id },
        include: {
          lot: { include: { product: true } },
          product: true
        }
      });
      return transformDates(updated);

    } else if (lotLine.type === 'PARTIAL') {
      // Completar el contenedor actual
      let newRemaining = (lotLine.remainingVolume || 0) + (quantity || lotLine.capacity);
      
      if (newRemaining >= lotLine.capacity) {
        // Contenedor lleno - convertir a FULL
        const remainingAfterFull = newRemaining - lotLine.capacity;
        
        // Buscar línea FULL existente
        const existingFull = await prisma.lotLine.findFirst({
          where: {
            lotId: lotLine.lotId,
            productId: lotLine.productId,
            type: 'FULL',
            capacity: lotLine.capacity,
            unit: lotLine.unit
          }
        });

        if (existingFull) {
          await prisma.lotLine.update({
            where: { id: existingFull.id },
            data: { units: existingFull.units + 1 }
          });
        } else {
          await prisma.lotLine.create({
            data: {
              lotId: lotLine.lotId,
              productId: lotLine.productId,
              type: 'FULL',
              units: 1,
              capacity: lotLine.capacity,
              unit: lotLine.unit
            }
          });
        }

        // Eliminar la línea PARTIAL
        await prisma.lotLine.delete({ where: { id } });

        // Si quedó algo restante, crear nueva línea PARTIAL
        if (remainingAfterFull > 0) {
          await prisma.lotLine.create({
            data: {
              lotId: lotLine.lotId,
              productId: lotLine.productId,
              type: 'PARTIAL',
              units: 1,
              capacity: lotLine.capacity,
              unit: lotLine.unit,
              remainingVolume: remainingAfterFull
            }
          });
        }
      } else {
        // Solo actualizar el remainingVolume
        await prisma.lotLine.update({
          where: { id },
          data: { remainingVolume: newRemaining }
        });
      }

      // Registrar movimiento
      await prisma.lotLineMovement.create({
        data: {
          lotLineId: id,
          type: 'RECARGA',
          quantity: quantity || lotLine.capacity,
          previousVolume,
          notes: 'Recarga de contenedor (PARTIAL)'
        }
      });

      const updated = await prisma.lotLine.findUnique({
        where: { id },
        include: {
          lot: { include: { product: true } },
          product: true
        }
      });
      return transformDates(updated);
    }

    // Si ya es FULL, no hacer nada
    throw new Error('La línea ya está completa (FULL)');
  }

  async delete(id: string): Promise<void> {
    await prisma.lotLineMovement.deleteMany({ where: { lotLineId: id } });
    await prisma.lotLine.delete({ where: { id } });
  }

  // Obtener movimientos de una línea de lote
  async getMovements(lotLineId: string): Promise<any[]> {
    const movements = await prisma.lotLineMovement.findMany({
      where: { lotLineId },
      orderBy: { createdAt: 'desc' }
    });
    return movements.map(transformDates);
  }
}

export const lotLineRepository = new LotLineRepository();
