// ============================================
// Service: Container
// Capa de lógica de negocio
// ============================================

import { containerRepository } from '../repositories/ContainerRepository';
import { CreateContainerDto, UpdateContainerDto, ConsumeContainerDto } from '../types';

export class ContainerService {
  
  async getAllContainers() {
    return containerRepository.findAll();
  }

  async getContainerById(id: string) {
    const container = await containerRepository.findById(id);
    if (!container) throw new Error('Contenedor no encontrado');
    return container;
  }

  async getContainersByLot(lotId: string) {
    return containerRepository.findByLot(lotId);
  }

  async createContainer(data: CreateContainerDto) {
    if (!data.lotId) throw new Error('El lote es requerido');
    if (!data.typeId) throw new Error('El tipo de contenedor es requerido');
    if (!data.capacity || data.capacity <= 0) throw new Error('La capacidad debe ser mayor a 0');
    
    return containerRepository.create(data);
  }

  async updateContainer(id: string, data: UpdateContainerDto) {
    const existing = await containerRepository.findById(id);
    if (!existing) throw new Error('Contenedor no encontrado');
    
    return containerRepository.update(id, data);
  }

  async consumeContainer(id: string, data: ConsumeContainerDto) {
    const existing = await containerRepository.findById(id);
    if (!existing) throw new Error('Contenedor no encontrado');
    if (data.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
    
    return containerRepository.consume(id, data.quantity);
  }

  async deleteContainer(id: string) {
    const existing = await containerRepository.findById(id);
    if (!existing) throw new Error('Contenedor no encontrado');
    
    await containerRepository.delete(id);
  }

  async getContainerMovements(containerId: string) {
    return containerRepository.getMovements(containerId);
  }
}

export const containerService = new ContainerService();
