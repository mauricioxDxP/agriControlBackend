// ============================================
// Service: Tank
// Capa de lógica de negocio
// ============================================

import { tankRepository } from '../repositories/TankRepository';
import { CreateTankDto, UpdateTankDto } from '../types';

export class TankService {
  
  async getAllTanks() {
    return tankRepository.findAll();
  }

  async getTankById(id: string) {
    const tank = await tankRepository.findById(id);
    if (!tank) throw new Error('Tanque no encontrado');
    return tank;
  }

  async createTank(data: CreateTankDto) {
    if (!data.name) throw new Error('El nombre es requerido');
    if (!data.capacity || data.capacity <= 0) throw new Error('La capacidad debe ser mayor a 0');
    
    return tankRepository.create(data);
  }

  async updateTank(id: string, data: UpdateTankDto) {
    const existing = await tankRepository.findById(id);
    if (!existing) throw new Error('Tanque no encontrado');
    
    return tankRepository.update(id, data);
  }

  async deleteTank(id: string) {
    const existing = await tankRepository.findById(id);
    if (!existing) throw new Error('Tanque no encontrado');
    
    await tankRepository.delete(id);
  }
}

export const tankService = new TankService();
