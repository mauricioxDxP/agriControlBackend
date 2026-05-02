// ============================================
// Service: Application
// Capa de lógica de negocio
// ============================================

import { applicationRepository } from '../repositories/ApplicationRepository';
import { movementRepository } from '../repositories/MovementRepository';
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
    
    // Crear la aplicación
    const application = await applicationRepository.create(data);
    
    // Registrar movimientos de SALIDA para cada lote usado
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
        if (!lot) continue;
        
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
    
    console.log('[updateApplication] existing movements:', existing.applicationLots);
    
    // Eliminar los movimientos existentes de esta aplicación
    await prisma.movement.deleteMany({ where: { applicationId: id } });
    console.log('[updateApplication] Deleted old movements');
    
    // Registrar los nuevos movimientos de SALIDA
    console.log('[updateApplication] data.lots:', JSON.stringify(data.lots, null, 2));
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
        if (!lot) continue;
        
        await movementRepository.create({
          productId: lot.productId,
          lotId: lotUsage.lotId,
          type: 'SALIDA',
          quantity: lotUsage.quantityUsed,
          notes: `Aplicación: ${id}`,
          applicationId: id
        });
        console.log('[updateApplication] Created new movement for lot:', lotUsage.lotId, 'qty:', lotUsage.quantityUsed);
      }
    } else {
      console.log('[updateApplication] No lots to create movements for');
    }
    
    return applicationRepository.update(id, data);
  }

  async deleteApplication(id: string) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    // Eliminar los movimientos de SALIDA de esta aplicación
    await prisma.movement.deleteMany({ where: { applicationId: id } });
    
    await applicationRepository.delete(id);
  }
}

export const applicationService = new ApplicationService();