// ============================================
// Service: Field
// Business logic layer
// ============================================

import { fieldRepository } from '../repositories/FieldRepository';
import { CreateFieldDto, UpdateFieldDto } from '../types';

export class FieldService {
  
  async getAllFields(terrainId?: string) {
    if (terrainId) {
      return fieldRepository.findByTerrainId(terrainId);
    }
    return fieldRepository.findAll();
  }

  async getFieldById(id: string) {
    const field = await fieldRepository.findById(id);
    if (!field) throw new Error('Field not found');
    return field;
  }

  async createField(data: CreateFieldDto) {
    if (!data.name) throw new Error('Name is required');
    if (!data.area || data.area <= 0) throw new Error('Area must be greater than 0');
    if (!data.terrainId) throw new Error('Terrain is required');
    
    return fieldRepository.create(data);
  }

  async updateField(id: string, data: UpdateFieldDto) {
    const existing = await fieldRepository.findById(id);
    if (!existing) throw new Error('Field not found');
    
    return fieldRepository.update(id, data);
  }

  async deleteField(id: string) {
    const existing = await fieldRepository.findById(id);
    if (!existing) throw new Error('Field not found');
    
    return fieldRepository.delete(id);
  }

  async getFieldsByTerrainId(terrainId: string) {
    return fieldRepository.findByTerrainId(terrainId);
  }
}

export const fieldService = new FieldService();