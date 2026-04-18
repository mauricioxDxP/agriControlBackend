// ============================================
// Service: Tancada
// Capa de lógica de negocio
// ============================================

import { tancadaRepository } from '../repositories/TancadaRepository';
import { movementRepository } from '../repositories/MovementRepository';
import { CreateTancadaDto } from '../types';
import prisma from '../repositories/prisma';

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
    
    console.log('[TancadaService] Creating tancada, products:', JSON.stringify(data.products, null, 2));
    
    // Crear la tancada
    const tancada = await tancadaRepository.create(data);
    console.log('[TancadaService] Tancada created:', tancada.id);
    
    // Registrar movimientos de SALIDA para cada lote usado
    if (data.products) {
      for (const productData of data.products) {
        console.log('[TancadaService] Processing product:', productData.productId, 'lots:', productData.lots);
        if (productData.lots && productData.lots.length > 0) {
          try {
            for (const lotUsage of productData.lots) {
              console.log('[TancadaService] Creating SALIDA movement, lotId:', lotUsage.lotId, 'qty:', lotUsage.quantityUsed);
              await movementRepository.create({
                productId: productData.productId,
                lotId: lotUsage.lotId,
                type: 'SALIDA',
                quantity: lotUsage.quantityUsed,
                notes: `Tancada: ${tancada.id}`,
                tancadaId: tancada.id
              });
              console.log('[TancadaService] Movement created successfully');
            }
          } catch (err) {
            console.error('[TancadaService] Error creating movement:', err);
          }
        }
      }
    }
    
    return tancada;
  }

  async updateTancada(id: string, data: CreateTancadaDto) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    
    // Eliminar los movimientos existentes de esta tancada
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    // Registrar los nuevos movimientos de SALIDA
    if (data.products) {
      for (const productData of data.products) {
        if (productData.lots && productData.lots.length > 0) {
          for (const lotUsage of productData.lots) {
            await movementRepository.create({
              productId: productData.productId,
              lotId: lotUsage.lotId,
              type: 'SALIDA',
              quantity: lotUsage.quantityUsed,
              notes: `Tancada: ${id}`,
              tancadaId: id
            });
          }
        }
      }
    }
    
    // Actualizar la tancada
    return tancadaRepository.update(id, data);
  }

  async deleteTancada(id: string) {
    const existing = await tancadaRepository.findById(id);
    if (!existing) throw new Error('Tancada no encontrada');
    
    // Eliminar los movimientos de SALIDA de esta tancada
    await prisma.movement.deleteMany({ where: { tancadaId: id } });
    
    await tancadaRepository.delete(id);
  }
}

export const tancadaService = new TancadaService();