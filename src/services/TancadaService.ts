// ============================================
// Service: Tancada
// Capa de lógica de negocio
// ============================================

import { tancadaRepository } from '../repositories/TancadaRepository';
import { CreateTancadaDto } from '../types';

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
    
    return tancadaRepository.create(data);
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
