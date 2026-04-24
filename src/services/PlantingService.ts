// ============================================
// Service: Planting
// Business logic layer
// ============================================

import { plantingRepository } from '../repositories/PlantingRepository';
import { CreatePlantingDto, UpdatePlantingDto } from '../types';

export class PlantingService {
  
  async getAllPlantings(fieldId?: string, active?: boolean) {
    return plantingRepository.findAll(fieldId, active);
  }

  async getPlantingById(id: string) {
    const planting = await plantingRepository.findById(id);
    if (!planting) throw new Error('Planting not found');
    return planting;
  }

  async getPlantingsByFieldId(fieldId: string) {
    return plantingRepository.findByFieldId(fieldId);
  }

  async getCurrentPlantingByFieldId(fieldId: string) {
    return plantingRepository.findCurrentByFieldId(fieldId);
  }

  async createPlanting(data: CreatePlantingDto) {
    if (!data.fieldId) throw new Error('Field is required');
    if (!data.productId) throw new Error('Product is required');
    if (!data.startDate) throw new Error('Start date is required');
    
    return plantingRepository.create({
      ...data,
      startDate: new Date(data.startDate)
    });
  }

  async updatePlanting(id: string, data: UpdatePlantingDto) {
    const existing = await plantingRepository.findById(id);
    if (!existing) throw new Error('Planting not found');
    
    return plantingRepository.update(id, {
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes
    });
  }

  async endPlanting(id: string, fechaFin: Date) {
    const existing = await plantingRepository.findById(id);
    if (!existing) throw new Error('Planting not found');
    
    if (existing.endDate) {
      throw new Error('This planting is already ended');
    }
    
    return plantingRepository.endPlanting(id, fechaFin);
  }

  async deletePlanting(id: string) {
    const existing = await plantingRepository.findById(id);
    if (!existing) throw new Error('Planting not found');
    
    await plantingRepository.delete(id);
  }
}

export const plantingService = new PlantingService();