// ============================================
// Service: Application
// Capa de lógica de negocio
// ============================================

import { applicationRepository } from '../repositories/ApplicationRepository';
import { lotLineRepository } from '../repositories/LotLineRepository';
import { CreateApplicationDto } from '../types';
import prisma from '../repositories/prisma';
import { movementRepository } from '../repositories/MovementRepository';

export class ApplicationService {
  
  async getAllApplications() {
    return applicationRepository.findAll();
  }

  async getApplicationById(id: string) {
    const application = await applicationRepository.findById(id);
    if (!application) throw new Error('Aplicación no encontrada');
    return application;
  }

  async getApplicationsByField(fieldId: string) {
    return applicationRepository.findByField(fieldId);
  }

  async createApplication(data: CreateApplicationDto) {
    if (!data.fieldId) throw new Error('El campo es requerido');
    if (!data.type) throw new Error('El tipo de aplicación es requerido');
    
    // Primero crear la aplicación
    const application = await applicationRepository.create(data);
    
    // Consumir productos de las líneas de lote
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        // Obtener el productId del lote
        const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
        if (!lot) continue;
        
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
          
          if (line.type == 'PARTIAL') {
            consumedVolume = Math.min(remainingToConsume, lineVolume);
          } else {
            consumedVolume = remainingToConsume;
          }
          
          await lotLineRepository.consume(line.id, consumedVolume);
          remainingToConsume -= consumedVolume;
        }
        
        // Registrar un solo movimiento de SALIDA con la cantidad total
        await movementRepository.create({
          productId: lot.productId,
          lotId: lotUsage.lotId,
          type: 'SALIDA',
          quantity: lotUsage.quantityUsed,
          notes: `Aplicación: ${application.id}`,
          applicationId: application.id
        });
      }
    }
    
    return application;
  }

  async updateApplication(id: string, data: CreateApplicationDto) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    // Obtener los lotes actuales de la aplicación para revertir el consumo
    const existingLots = existing.applicationLots || [];
    
    // Revertir el consumo de los lotes anteriores
    for (const lotUsage of existingLots) {
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
            const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
            await prisma.lotLine.create({
              data: { lotId: lotUsage.lotId, productId: lot!.productId, type: 'FULL', units: unitsToFull, capacity, unit }
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
            const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
            await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: lot!.productId, type: 'FULL', units: 1, capacity, unit } });
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
              const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
              await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: lot!.productId, type: 'FULL', units: 1, capacity, unit } });
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
            const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
            await prisma.lotLine.create({ data: { lotId: lotUsage.lotId, productId: lot!.productId, type: 'FULL', units: extraUnits, capacity, unit } });
          }
        }
      }
    }
    
    // Eliminar los movimientos existentes de esta aplicación
    await prisma.movement.deleteMany({ where: { applicationId: id } });
    
    // Aplicar el nuevo consumo
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
        if (!lot) continue;
        
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
          productId: lot.productId,
          lotId: lotUsage.lotId,
          type: 'SALIDA',
          quantity: lotUsage.quantityUsed,
          notes: `Aplicación: ${id}`,
          applicationId: id
        });
      }
    }
    
    // Actualizar la aplicación
    return applicationRepository.update(id, data);
  }

  async deleteApplication(id: string) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    // Obtener los lotes usados en la aplicación
    const applicationLots = await prisma.applicationLot.findMany({
      where: { applicationId: id }
    });
    
    // Revertir el consumo de cada lote
    for (const lotUsage of applicationLots) {
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
                productId: firstLine.productId,
                type: 'FULL',
                units: unitsToFull,
                capacity: capacity,
                unit: unit
              }
            });
          }
          remainingToRestore -= unitsToFull * capacity;
          
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
                productId: firstLine.productId,
                type: 'FULL',
                units: 1,
                capacity: capacity,
                unit: unit
              }
            });
          }
          await prisma.lotLine.delete({ where: { id: partialLine.id } });
          remainingToRestore -= neededToFull;
        } else {
          const newRemaining = currentRemaining + remainingToRestore;
          if (newRemaining >= capacity) {
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
                  productId: firstLine.productId,
                  type: 'FULL',
                  units: 1,
                  capacity: capacity,
                  unit: unit
                }
              });
            }
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
      
      // 3. Aumentar unidades de líneas FULL
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
      
      // 4. Crear nuevas líneas FULL si falta
      if (remainingToRestore > 0) {
        const unitsToCreate = Math.ceil(remainingToRestore / capacity);
        await prisma.lotLine.create({
          data: {
            lotId: lotUsage.lotId,
            productId: firstLine.productId,
            type: 'FULL',
            units: unitsToCreate,
            capacity: capacity,
            unit: unit
          }
        });
      }
      
      // Eliminar el movimiento de SALIDA creado por esta aplicación
      const movementToDelete = await prisma.movement.findFirst({
        where: {
          lotId: lotUsage.lotId,
          type: 'SALIDA',
          applicationId: id
        }
      });
      
      if (movementToDelete) {
        await movementRepository.delete(movementToDelete.id);
      }
    }
    
    await applicationRepository.delete(id);
  }
}

export const applicationService = new ApplicationService();
