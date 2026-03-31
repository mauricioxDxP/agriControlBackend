// ============================================
// Service: Lot
// Capa de lógica de negocio - Coordina operaciones complejas
// ============================================

import { lotRepository, LotRepository } from '../repositories/LotRepository';
import { CreateLotDto, UpdateLotDto, LotDto } from '../types';

export class LotService {
  constructor(private repository: LotRepository) {}

  async getAllLots(): Promise<LotDto[]> {
    return this.repository.findAll();
  }

  async getLotById(id: string): Promise<LotDto | null> {
    const lot = await this.repository.findById(id);
    
    if (!lot) {
      return null;
    }

    // Obtener contenedores del lote
    const containers = await this.repository.findContainersByLot(id);
    
    return {
      ...lot,
      containers
    } as any;
  }

  async getLotsByProduct(productId: string): Promise<LotDto[]> {
    return this.repository.findByProduct(productId);
  }

  async createLot(data: CreateLotDto): Promise<LotDto> {
    // Validaciones de negocio
    if (!data.productId) {
      throw new Error('El productId es requerido');
    }

    if (data.initialStock <= 0) {
      throw new Error('El stock inicial debe ser mayor a 0');
    }

    // Crear el lote
    const lot = await this.repository.create(data);

    // Crear movimiento de entrada automático
    await this.repository.createMovement({
      productId: data.productId,
      lotId: lot.id,
      type: 'ENTRADA',
      quantity: data.initialStock,
      notes: 'Entrada por creación de lote'
    });

    // Crear contenedores automáticamente si se especifica tipo y capacidad
    if (data.containerType && data.containerCapacity && data.initialStock > 0) {
      // Buscar el tipo de contenedor creado
      const containerTypeModel = await this.repository.findById(lot.id);
      // Re-obtenemos el lote para obtener el containerTypeId
      const lotWithType = await this.repository.findById(lot.id);
      
      if (lotWithType?.containerTypeId) {
        const containerTypeModel = await this.repository.findById(lot.id);
        
        // Obtener la unidad del tipo de contenedor
        const prisma = (await import('../repositories/prisma')).default;
        const containerType = await prisma.containerTypeModel.findUnique({
          where: { id: lotWithType.containerTypeId }
        });
        
        const unit = containerType?.defaultUnit || 'L';
        
        await this.repository.createContainers(
          lot.id,
          lotWithType.containerTypeId,
          data.containerCapacity,
          unit,
          data.containerType,
          data.initialStock
        );
      }
    }

    // Obtener los contenedores creados
    const containers = await this.repository.findContainersByLot(lot.id);

    return {
      ...lot,
      containers
    } as any;
  }

  async updateLot(id: string, data: UpdateLotDto): Promise<LotDto> {
    // Verificar que el lote existe
    const existingLot = await this.repository.findById(id);
    
    if (!existingLot) {
      throw new Error('Lote no encontrado');
    }

    // Validaciones de negocio
    if (data.initialStock !== undefined && data.initialStock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    // Actualizar el lote
    return this.repository.update(id, data);
  }

  async deleteLot(id: string): Promise<void> {
    // Verificar que el lote existe
    const existingLot = await this.repository.findById(id);
    
    if (!existingLot) {
      throw new Error('Lote no encontrado');
    }

    // Eliminar el lote (el repository se encarga de cascade)
    await this.repository.delete(id);
  }
}

export const lotService = new LotService(lotRepository);
