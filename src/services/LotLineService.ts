// ============================================
// Service: LotLine
// Capa de lógica de negocio
// ============================================

import { lotLineRepository } from '../repositories/LotLineRepository';
import { CreateLotLineDto, UpdateLotLineDto } from '../types';

export class LotLineService {
  
  async getAllLotLines() {
    return lotLineRepository.findAll();
  }

  async getLotLineById(id: string) {
    const lotLine = await lotLineRepository.findById(id);
    if (!lotLine) throw new Error('Línea de lote no encontrada');
    return lotLine;
  }

  async getLotLinesByLot(lotId: string) {
    return lotLineRepository.findByLot(lotId);
  }

  async createLotLine(data: CreateLotLineDto) {
    if (!data.lotId) throw new Error('El lote es requerido');
    if (!data.productId) throw new Error('El producto es requerido');
    if (!data.type) throw new Error('El tipo es requerido (FULL, PARTIAL, EMPTY)');
    if (!data.units || data.units <= 0) throw new Error('Las unidades deben ser mayores a 0');
    if (!data.capacity || data.capacity <= 0) throw new Error('La capacidad debe ser mayor a 0');
    
    return lotLineRepository.create(data);
  }

  async updateLotLine(id: string, data: UpdateLotLineDto) {
    const existing = await lotLineRepository.findById(id);
    if (!existing) throw new Error('Línea de lote no encontrada');
    
    return lotLineRepository.update(id, data);
  }

  async consumeLotLine(id: string, quantity: number) {
    const existing = await lotLineRepository.findById(id);
    if (!existing) throw new Error('Línea de lote no encontrada');
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
    
    // Verificar que hay stock disponible
    const availableStock = existing.units * existing.capacity + (existing.remainingVolume || 0);
    if (quantity > availableStock) {
      throw new Error('No hay suficiente stock disponible');
    }
    
    return lotLineRepository.consume(id, quantity);
  }

  async rechargeLotLine(id: string, quantity?: number) {
    const existing = await lotLineRepository.findById(id);
    if (!existing) throw new Error('Línea de lote no encontrada');
    
    return lotLineRepository.recharge(id, quantity);
  }

  async deleteLotLine(id: string) {
    const existing = await lotLineRepository.findById(id);
    if (!existing) throw new Error('Línea de lote no encontrada');
    
    await lotLineRepository.delete(id);
  }

  async getLotLineMovements(id: string) {
    return lotLineRepository.getMovements(id);
  }
}

export const lotLineService = new LotLineService();
