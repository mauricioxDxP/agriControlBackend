// ============================================
// Service: Movement
// Capa de lógica de negocio
// ============================================

import { movementRepository } from '../repositories/MovementRepository';
import { CreateMovementDto } from '../types';

export class MovementService {
  
  async getAllMovements() {
    return movementRepository.findAll();
  }

  async getMovementsByProduct(productId: string) {
    return movementRepository.findByProduct(productId);
  }

  async getMovementsByLot(lotId: string) {
    return movementRepository.findByLot(lotId);
  }

  async getMovementsByTancada(tancadaId: string) {
    return movementRepository.findByTancada(tancadaId);
  }

  async getMovementsByApplication(applicationId: string) {
    return movementRepository.findByApplication(applicationId);
  }

  async createMovement(data: CreateMovementDto) {
    if (!data.productId) throw new Error('El producto es requerido');
    if (!data.quantity || data.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
    
    return movementRepository.create(data);
  }

  async deleteMovement(id: string) {
    // Verificar que el movimiento no esté asociado a una tanda o aplicación
    const movement = await movementRepository.findById(id);
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    if (movement.tancadaId) {
      throw new Error('No se puede eliminar un movimiento asociado a una tanda');
    }
    if (movement.applicationId) {
      throw new Error('No se puede eliminar un movimiento asociado a una aplicación');
    }
    await movementRepository.delete(id);
  }

  async getProductStock(productId: string) {
    const stock = await movementRepository.getStock(productId);
    return { productId, stock };
  }

  async getLotStock(lotId: string) {
    const stock = await movementRepository.getLotStock(lotId);
    return { lotId, stock };
  }
}

export const movementService = new MovementService();
