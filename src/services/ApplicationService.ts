// ============================================
// Service: Application
// Capa de lógica de negocio
// ============================================

import { applicationRepository } from '../repositories/ApplicationRepository';
import { lotLineRepository } from '../repositories/LotLineRepository';
import { CreateApplicationDto } from '../types';
import prisma from '../repositories/prisma';

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
    
    console.log('Creating application with lots:', data.lots);
    
    // Primero crear la aplicación
    const application = await applicationRepository.create(data);
    
    // Consumir productos de las líneas de lote
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        console.log('Processing lot:', lotUsage.lotId, 'quantity:', lotUsage.quantityUsed);
        
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
        
        console.log('Found lot lines (ordered):', lotLines.map(l => `${l.id}:${l.type}`));
        
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
          
          console.log(`Processing line ${line.id}, type: ${line.type}, volume: ${lineVolume}`);
          
          if (lineVolume <= 0) continue;
          
          const consumeAmount = Math.min(remainingToConsume, lineVolume);
          console.log(`Consuming ${consumeAmount} from line ${line.id}`);
          
          // Consumir de la línea
          await lotLineRepository.consume(line.id, consumeAmount);
          
          remainingToConsume -= consumeAmount;
        }
        
        if (remainingToConsume > 0) {
          console.warn(`No hay suficiente stock en lote ${lotUsage.lotId}. Faltan ${remainingToConsume}`);
        }
      }
    }
    
    return application;
  }

  async deleteApplication(id: string) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    await applicationRepository.delete(id);
  }
}

export const applicationService = new ApplicationService();
