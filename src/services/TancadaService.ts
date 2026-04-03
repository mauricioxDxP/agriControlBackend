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
            
            // Consumir de las líneas de lote (ya ordenadas: Partial primero, luego Full)
            for (const line of lotLines) {
              if (remainingToConsume <= 0) break;
              
              const lineVolume = line.type === 'FULL' 
                ? line.capacity 
                : (line.remainingVolume || line.capacity);
              
              if (lineVolume <= 0) continue;
              await lotLineRepository.consume(line.id, remainingToConsume);
              remainingToConsume -= remainingToConsume;
            }
            
            if (remainingToConsume > 0) {
              console.warn(`No hay suficiente stock en lote ${lotUsage.lotId}. Faltan ${remainingToConsume}`);
            }
          }
        }
      }
    }
    
    return tancada;
  }

  async updateTancada(id: string, data: CreateTancadaDto) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    
    return tancadaRepository.update(id, data);
  }

  async deleteTancada(id: string) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    await tancadaRepository.delete(id);
  }
}

export const tancadaService = new TancadaService();
