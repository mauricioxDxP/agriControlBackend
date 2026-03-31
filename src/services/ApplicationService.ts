// ============================================
// Service: Application
// Capa de lógica de negocio
// ============================================

import { applicationRepository } from '../repositories/ApplicationRepository';
import { CreateApplicationDto } from '../types';

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
    
    return applicationRepository.create(data);
  }

  async deleteApplication(id: string) {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new Error('Aplicación no encontrada');
    
    await applicationRepository.delete(id);
  }
}

export const applicationService = new ApplicationService();
