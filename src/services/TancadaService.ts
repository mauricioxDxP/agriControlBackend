// ============================================
// Service: Tancada
// Capa de lógica de negocio
// ============================================

import { tancadaRepository } from '../repositories/TancadaRepository';
import { lotLineRepository } from '../repositories/LotLineRepository';
import { CreateTancadaDto } from '../types';
import prisma from '../repositories/prisma';
import { movementRepository } from '../repositories/MovementRepository';

export class TancadaService {
  
  async getAllTancadas() {
    return tancadaRepository.findAll();
  }

  async getTancadaById(id: string) {
    const tancada = await tancadaRepository.findById(id);
    if (!tancada) throw new Error('Tancada no encontrada');
    return tancada;
  }

  async createTancada(data: CreateTancadaDto) {
    if (!data.tankCapacity || data.tankCapacity <= 0) throw new Error('La capacidad del tanque es requerida');
    if (!data.waterAmount || data.waterAmount <= 0) throw new Error('La cantidad de agua es requerida');
    if (!data.products || data.products.length === 0) throw new Error('Debe agregar al menos un producto');
    if (!data.fields || data.fields.length === 0) throw new Error('Debe agregar al menos un campo');
    
    // Crear la tancada
    const tancada = await tancadaRepository.create(data);
    
    // Consumir productos de las líneas de lote
    if (data.products) {
      for (const productData of data.products) {
        if (productData.lots && productData.lots.length > 0) {
          for (const lotUsage of productData.lots) {
            const allLotLines = await prisma.lotLine.findMany({
              where: { lotId: lotUsage.lotId }
            });
            
            // Ordenar: primero PARTIAL, luego FULL (EMPTY no tiene volumen)
            const lotLines = allLotLines
              .filter(l => l.type !== 'EMPTY')
              .sort((a, b) => {
                if (a.type === 'PARTIAL' && b.type === 'FULL') return -1;
                if (a.type === 'FULL' && b.type === 'PARTIAL') return 1;
                return 0;
              });
            
            if (lotLines.length === 0) {
              console.warn(`No hay líneas de lote para ${lotUsage.lotId}`);
              continue;
            }
            
            let remainingToConsume = lotUsage.quantityUsed;
            let consumedVolume = 0;
            // Consumir de las líneas de lote (ya ordenadas: Partial primero, luego Full)
            for (const line of lotLines) {
              if (remainingToConsume <= 0) break;
              
              const lineVolume = line.type === 'FULL' 
                ? line.capacity 
                : (line.remainingVolume || line.capacity);
              
              if (lineVolume <= 0) continue;
              if(line.type == 'PARTIAL')
              {
                consumedVolume = Math.min(remainingToConsume, lineVolume);
              }
              else{
                consumedVolume = remainingToConsume;
              }
              await lotLineRepository.consume(line.id, consumedVolume);
              remainingToConsume -= consumedVolume;
            }
            
            // Registrar un solo movimiento de SALIDA con la cantidad total
            await movementRepository.create({
              productId: productData.productId,
              lotId: lotUsage.lotId,
              type: 'SALIDA',
              quantity: lotUsage.quantityUsed,
              notes: `Tancada: ${tancada.id}`,
              tancadaId: tancada.id
            });
            
          }
        }
      }
    }
    
    return tancada;
  }

  async updateTancada(id: string, data: CreateTancadaDto) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    
    // Obtener los productos actuales de la tancada para revertir el consumo
    const existingProducts = existing.tancadaProducts || [];
    
    // Revertir el consumo de los productos anteriores (como deleteTancada)
    for (const tp of existingProducts) {
      if (tp.lotsUsed) {
        const lotsUsed = typeof tp.lotsUsed === 'string' 
          ? JSON.parse(tp.lotsUsed) 
          : tp.lotsUsed;
        
        for (const lotUsage of lotsUsed) {
          // Obtener líneas actuales del lote
          let allLotLines = await prisma.lotLine.findMany({
            where: { lotId: lotUsage.lotId }
          });
          
          if (allLotLines.length === 0) continue;
          
          let remainingToRestore = lotUsage.quantityUsed;
          const firstLine = allLotLines[0];
          const capacity = firstLine.capacity;
          const unit = firstLine.unit;
          
          // 1. Convertir EMPTY a FULL
          const emptyLines = allLotLines.filter(l => l.type === 'EMPTY');
          for (const emptyLine of emptyLines) {
            if (remainingToRestore <= 0) break;
            const unitsToFull = Math.min(emptyLine.units, Math.floor(remainingToRestore / capacity));
            if (unitsToFull > 0) {
              // Obtener líneas actualizadas para buscar FULL
              let currentLines = await prisma.lotLine.findMany({ where: { lotId: lotUsage.lotId } });
              let fullLine = currentLines.find(l => l.type === 'FULL');
              if (fullLine) {
                await prisma.lotLine.update({
                  where: { id: fullLine.id },
                  data: { units: fullLine.units + unitsToFull }
                });
              } else {
                await prisma.lotLine.create({
                  data: { lotId: lotUsage.lotId, productId: tp.productId, type: 'FULL', units: unitsToFull, capacity, unit }
                });
              }
              remainingToRestore -= unitsToFull * capacity;
              
              if (emptyLine.units === unitsToFull) {
                await prisma.lotLine.delete({ where: { id: emptyLine.id } });
              } else {
                await prisma.lotLine.update({ where: { id: emptyLine.id }, data: { units: emptyLine.units - unitsToFull } });
              }
            }
          }
          
          // Obtener líneas actualizadas después de procesar EMPTY
          allLotLines = await prisma.lotLine.findMany({ where: { lotId: lotUsage.lotId } });
          
          // 2. Completar líneas PARTIAL existentes
          const partialLines = allLotLines.filter(l => l.type === 'PARTIAL');
          for (const partialLine of partialLines) {
            if (remainingToRestore <= 0) break;
            
            const currentRemaining = partialLine.remainingVolume || 0;
            const neededToFull = capacity - currentRemaining;
            
            if (neededToFull <= remainingToRestore) {
              // Completar y convertir a FULL
              let currentLines = await prisma.lotLine.findMany({ where: { lotId: lotUsage.lotId } });
              let fullLine = currentLines.find(l => l.type === 'FULL');
              if (fullLine) {
                await prisma.lotLine.update({ where: { id: fullLine.id }, data: { units: fullLine.units + 1 } });
              } else {
                await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: tp.productId, type: 'FULL', units: 1, capacity, unit } });
              }
              // Eliminar la línea PARTIAL
              await prisma.lotLine.delete({ where: { id: partialLine.id } });
              remainingToRestore -= neededToFull;
            } else {
              // Solo aumentar el remainingVolume
              const newRemaining = currentRemaining + remainingToRestore;
              if (newRemaining >= capacity) {
                // Quedó completo, convertir a FULL
                let currentLines = await prisma.lotLine.findMany({ where: { lotId: lotUsage.lotId } });
                let fullLine = currentLines.find(l => l.type === 'FULL');
                if (fullLine) {
                  await prisma.lotLine.update({ where: { id: fullLine.id }, data: { units: fullLine.units + 1 } });
                } else {
                  await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: tp.productId, type: 'FULL', units: 1, capacity, unit } });
                }
                await prisma.lotLine.delete({ where: { id: partialLine.id } });
              } else {
                await prisma.lotLine.update({ where: { id: partialLine.id }, data: { remainingVolume: newRemaining } });
              }
              remainingToRestore = 0;
            }
          }
          
          // 3. Aumentar FULL con lo que sobre
          if (remainingToRestore > 0) {
            const extraUnits = Math.floor(remainingToRestore / capacity);
            if (extraUnits > 0) {
              let currentLines = await prisma.lotLine.findMany({ where: { lotId: lotUsage.lotId } });
              let fullLine = currentLines.find(l => l.type === 'FULL');
              if (fullLine) {
                await prisma.lotLine.update({ where: { id: fullLine.id }, data: { units: fullLine.units + extraUnits } });
              } else {
                await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: tp.productId, type: 'FULL', units: extraUnits, capacity, unit } });
              }
            }
          }
        }
      }
    }
    
    // Eliminar los movimientos existentes
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    // Aplicar el nuevo consumo (como createTancada)
    if (data.products) {
      for (const productData of data.products) {
        if (productData.lots && productData.lots.length > 0) {
          for (const lotUsage of productData.lots) {
            const allLotLines = await prisma.lotLine.findMany({
              where: { lotId: lotUsage.lotId }
            });
            
            const lotLines = allLotLines
              .filter(l => l.type !== 'EMPTY')
              .sort((a, b) => {
                if (a.type === 'PARTIAL' && b.type === 'FULL') return -1;
                if (a.type === 'FULL' && b.type === 'PARTIAL') return 1;
                return 0;
              });
            
            if (lotLines.length === 0) continue;
            
            let remainingToConsume = lotUsage.quantityUsed;
            let consumedVolume = 0;
            
            for (const line of lotLines) {
              if (remainingToConsume <= 0) break;
              const lineVolume = line.type === 'FULL' ? line.capacity : (line.remainingVolume || line.capacity);
              if (lineVolume <= 0) continue;
              consumedVolume = line.type === 'PARTIAL' ? Math.min(remainingToConsume, lineVolume) : remainingToConsume;
              await lotLineRepository.consume(line.id, consumedVolume);
              remainingToConsume -= consumedVolume;
            }
            
            // Crear nuevo movimiento
            await movementRepository.create({
              productId: productData.productId,
              lotId: lotUsage.lotId,
              type: 'SALIDA',
              quantity: lotUsage.quantityUsed,
              notes: `Tancada: ${id}`,
              tancadaId: id
            });
          }
        }
      }
    }
    
    // Actualizar la tancada
    return tancadaRepository.update(id, data);
  }

  async deleteTancada(id: string) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    
    // Obtener los productos de la tancada para revertir el consumo
    const tancadaProducts = await prisma.tancadaProduct.findMany({
      where: { tancadaId: id }
    });
    
    // Revertir el consumo de cada producto
    for (const tp of tancadaProducts) {
      if (tp.lotsUsed) {
        const lotsUsed = JSON.parse(tp.lotsUsed) as Array<{ lotId: string; quantityUsed: number }>;
        
        for (const lotUsage of lotsUsed) {
          // Obtener todas las líneas de lote del lote
          let allLotLines = await prisma.lotLine.findMany({
            where: { lotId: lotUsage.lotId }
          });
          
          if (allLotLines.length === 0) continue;
          
          let remainingToRestore = lotUsage.quantityUsed;
          
          // Obtener referencia de capacidad y unidad
          const firstLine = allLotLines[0];
          const capacity = firstLine.capacity;
          const unit = firstLine.unit;
          
          // 1. Primero convertir líneas EMPTY a FULL
          const emptyLines = allLotLines.filter(l => l.type === 'EMPTY');
          for (const emptyLine of emptyLines) {
            if (remainingToRestore <= 0) break;
            
            const unitsToFull = Math.min(emptyLine.units, Math.floor(remainingToRestore / capacity));
            if (unitsToFull > 0) {
              // Convertir unidades a FULL
              // Buscar o crear línea FULL
              let fullLine = allLotLines.find(l => l.type === 'FULL');
              if (fullLine) {
                await prisma.lotLine.update({
                  where: { id: fullLine.id },
                  data: { units: fullLine.units + unitsToFull }
                });
              } else {
                await prisma.lotLine.create({
                  data: {
                    lotId: lotUsage.lotId,
                    productId: tp.productId,
                    type: 'FULL',
                    units: unitsToFull,
                    capacity: capacity,
                    unit: unit
                  }
                });
              }
              remainingToRestore -= unitsToFull * capacity;
              
              // Actualizar o eliminar la línea EMPTY
              if (emptyLine.units === unitsToFull) {
                await prisma.lotLine.delete({ where: { id: emptyLine.id } });
              } else {
                await prisma.lotLine.update({
                  where: { id: emptyLine.id },
                  data: { units: emptyLine.units - unitsToFull }
                });
              }
            }
          }
          
          // Obtener líneas actualizadas
          allLotLines = await prisma.lotLine.findMany({
            where: { lotId: lotUsage.lotId }
          });
          
          // 2. Completar líneas PARTIAL existentes
          const partialLines = allLotLines.filter(l => l.type === 'PARTIAL');
          for (const partialLine of partialLines) {
            if (remainingToRestore <= 0) break;
            
            const currentRemaining = partialLine.remainingVolume || 0;
            const neededToFull = capacity - currentRemaining;
            
            if (neededToFull <= remainingToRestore) {
              // Completar y convertir a FULL
              // Buscar o crear línea FULL
              let fullLine = allLotLines.find(l => l.type === 'FULL');
              if (fullLine) {
                await prisma.lotLine.update({
                  where: { id: fullLine.id },
                  data: { units: fullLine.units + 1 }
                });
              } else {
                await prisma.lotLine.create({
                  data: {
                    lotId: lotUsage.lotId,
                    productId: tp.productId,
                    type: 'FULL',
                    units: 1,
                    capacity: capacity,
                    unit: unit
                  }
                });
              }
              // Eliminar la línea PARTIAL
              await prisma.lotLine.delete({ where: { id: partialLine.id } });
              remainingToRestore -= neededToFull;
            } else {
              // Solo aumentar el remainingVolume
              const newRemaining = currentRemaining + remainingToRestore;
              if (newRemaining >= capacity) {
                // Quedó completo, convertir a FULL
                let fullLine = allLotLines.find(l => l.type === 'FULL');
                if (fullLine) {
                  await prisma.lotLine.update({
                    where: { id: fullLine.id },
                    data: { units: fullLine.units + 1 }
                  });
                } else {
                  await prisma.lotLine.create({
                    data: {
                      lotId: lotUsage.lotId,
                      productId: tp.productId,
                      type: 'FULL',
                      units: 1,
                      capacity: capacity,
                      unit: unit
                    }
                  });
                }
                // Eliminar la línea PARTIAL
                await prisma.lotLine.delete({ where: { id: partialLine.id } });
              } else {
                await prisma.lotLine.update({
                  where: { id: partialLine.id },
                  data: { remainingVolume: newRemaining }
                });
              }
              remainingToRestore = 0;
            }
          }
          
          // Obtener líneas actualizadas
          allLotLines = await prisma.lotLine.findMany({
            where: { lotId: lotUsage.lotId }
          });
          
          // 3. Luego aumentar unidades de líneas FULL existentes
          if (remainingToRestore > 0) {
            const fullLines = allLotLines.filter(l => l.type === 'FULL');
            
            for (const fullLine of fullLines) {
              if (remainingToRestore <= 0) break;
              
              const unitsToAdd = Math.min(fullLine.units, Math.floor(remainingToRestore / capacity));
              if (unitsToAdd > 0) {
                await prisma.lotLine.update({
                  where: { id: fullLine.id },
                  data: { units: fullLine.units + unitsToAdd }
                });
                remainingToRestore -= unitsToAdd * capacity;
              }
            }
          }
          
          // 4. Si aún queda algo por restaurar, crear nuevas líneas FULL
          if (remainingToRestore > 0) {
            const unitsToCreate = Math.ceil(remainingToRestore / capacity);
            await prisma.lotLine.create({
              data: {
                lotId: lotUsage.lotId,
                productId: tp.productId,
                type: 'FULL',
                units: unitsToCreate,
                capacity: capacity,
                unit: unit
              }
            });
          }
          
          // Eliminar el movimiento de SALIDA creado por esta tancada
          const movementToDelete = await prisma.movement.findFirst({
            where: {
              productId: tp.productId,
              lotId: lotUsage.lotId,
              type: 'SALIDA',
              tancadaId: id
            }
          });
          
          if (movementToDelete) {
            await movementRepository.delete(movementToDelete.id);
          }
        }
      }
    }
    
    await tancadaRepository.delete(id);
  }
}

export const tancadaService = new TancadaService();
