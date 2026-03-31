// ============================================
// Service: Field
// Capa de lógica de negocio
// ============================================

import { fieldRepository } from '../repositories/FieldRepository';
import { CreateFieldDto, UpdateFieldDto } from '../types';

export class FieldService {
  
  async getAllFields() {
    return fieldRepository.findAll();
  }

  async getFieldById(id: string) {
    const field = await fieldRepository.findById(id);
    if (!field) throw new Error('Campo no encontrado');
    return field;
  }

  async createField(data: CreateFieldDto) {
    if (!data.name) throw new Error('El nombre es requerido');
    if (!data.area || data.area <= 0) throw new Error('El área debe ser mayor a 0');
    
    return fieldRepository.create(data);
  }

  async updateField(id: string, data: UpdateFieldDto) {
    const existing = await fieldRepository.findById(id);
    if (!existing) throw new Error('Campo no encontrado');
    
    return fieldRepository.update(id, data);
  }

  async deleteField(id: string) {
    const existing = await fieldRepository.findById(id);
    if (!existing) throw new Error('Campo no encontrado');
    
    await fieldRepository.delete(id);
  }
}

export const fieldService = new FieldService();
