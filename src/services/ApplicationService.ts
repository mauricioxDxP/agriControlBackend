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
    
    console.log('[ApplicationService] Creating application, lots:', JSON.stringify(data.lots, null, 2));
    
    // Primero crear la aplicación
    const application = await applicationRepository.create(data);
    console.log('[ApplicationService] Application created:', application.id);
    
    // Registrar movimientos de SALIDA para cada lote usado
    if (data.lots && data.lots.length > 0) {
      for (const lotUsage of data.lots) {
        // Obtener el productId del lote
        const lot = await prisma.lot.findUnique({ where: { id: lotUsage.lotId } });
        if (!lot) {
          console.log('[ApplicationService] Lot not found:', lotUsage.lotId);
          continue;
        }
        
        console.log('[ApplicationService] Creating SALIDA movement, lotId:', lotUsage.lotId, 'qty:', lotUsage.quantityUsed, 'productId:', lot.productId);
        
        // Registrar un solo movimiento de SALIDA con la cantidad total
        await movementRepository.create({
          productId: lot.productId,
          lotId: lotUsage.lotId,
          type: 'SALIDA',
          quantity: lotUsage.quantityUsed,
          notes: `Aplicación: ${application.id}`,
          applicationId: application.id
        });
        console.log('[ApplicationService] Movement created successfully');
      }
    }
    
    return application;
  }

  async updateApplication(id: string, data: CreateApplicationDto) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    // Eliminar los movimientos existentes de esta aplicación
    await prisma.movement.deleteMany({ where: { applicationId: id } });
    
    // Registrar los nuevos movimientos de SALIDA
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
      }
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