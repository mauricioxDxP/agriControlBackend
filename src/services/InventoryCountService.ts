// ============================================
// Service: InventoryCount
// Capa de lógica de negocio
// ============================================

import { inventoryCountRepository } from '../repositories/InventoryCountRepository';
import { movementRepository } from '../repositories/MovementRepository';
import { lotRepository } from '../repositories/LotRepository';
import { CreateInventoryCountDto, CreateInventoryCountLineDto, UpdateInventoryCountLineDto, RequestAdjustmentDto } from '../types';

export class InventoryCountService {

  async getAllCounts() {
    return inventoryCountRepository.findAll();
  }

  async getCountById(id: string) {
    const count = await inventoryCountRepository.findById(id);
    if (!count) {
      throw new Error('Conteo no encontrado');
    }
    return count;
  }

  async createCount(data: CreateInventoryCountDto) {
    if (!data.date) {
      throw new Error('La fecha es requerida');
    }

    // Obtener info de productos para productCode y productName
    const products = await import('../repositories/ProductRepository').then(m => m.productRepository.findAll());
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Crear el conteo con las líneas (stockManual = 0, stockActual se calcula después)
    const linesWithInfo = (data.lines || []).map(line => {
      const product = productMap.get(line.productId);
      return {
        productId: line.productId,
        stockManual: line.stockManual || 0,
        stockActual: 0, // Se actualiza después
        productCode: product?.productCode || '',
        productName: product?.name || ''
      };
    });

    const count = await inventoryCountRepository.create({
      date: data.date,
      notes: data.notes,
      lines: linesWithInfo
    });

    // Actualizar cada línea con stockActual calculado
    for (let i = 0; i < count.lines.length; i++) {
      const line = count.lines[i];
      const stockActual = await movementRepository.getStock(line.productId);
      await inventoryCountRepository.updateLineStockActual(line.id, stockActual);
    }

    return this.getCountById(count.id);
  }

  async deleteCount(id: string) {
    const count = await inventoryCountRepository.findById(id);
    if (!count) {
      throw new Error('Conteo no encontrado');
    }
    await inventoryCountRepository.delete(id);
  }

  async addLine(inventoryCountId: string, data: CreateInventoryCountLineDto) {
    const count = await inventoryCountRepository.findById(inventoryCountId);
    if (!count) {
      throw new Error('Conteo no encontrado');
    }

    // Calcular stockActual actual
    const stockActual = await movementRepository.getStock(data.productId);

    // Obtener info del producto
    const product = await import('../repositories/ProductRepository').then(m => m.productRepository.findById(data.productId));
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return inventoryCountRepository.addLine(
      inventoryCountId,
      data,
      product.productCode || '',
      product.name,
      stockActual
    );
  }

  async updateLineStockManual(countId: string, lineId: string, stockManual: number) {
    const count = await inventoryCountRepository.findById(countId);
    if (!count) {
      throw new Error('Conteo no encontrado');
    }

    const line = count.lines.find((l: any) => l.id === lineId);
    if (!line) {
      throw new Error('Línea no encontrada');
    }

    if (line.adjustmentPending) {
      throw new Error('No se puede editar mientras hay un ajuste pendiente');
    }

    return inventoryCountRepository.updateLine(lineId, { stockManual });
  }

  async requestAdjustment(data: RequestAdjustmentDto) {
    // Validar que la línea existe
    const line = await inventoryCountRepository.findLineById(data.lineId);
    if (!line) {
      throw new Error('Línea no encontrada');
    }

    if (line.adjustmentPending) {
      throw new Error('Ya existe un ajuste pendiente para esta línea');
    }

    // Validar que las cantidades de los lotes son positivas
    for (const lot of data.lots) {
      if (lot.quantity <= 0) {
        throw new Error('Las cantidades deben ser mayores a 0');
      }
    }

    // Calcular diferencia
    const diferencia = data.type === 'INCREASE'
      ? line.stockManual - line.stockActual
      : line.stockActual - line.stockManual;

    const totalLotes = data.lots.reduce((sum, l) => sum + l.quantity, 0);

    if (totalLotes !== diferencia) {
      throw new Error(`La suma de las cantidades de lotes (${totalLotes}) debe ser igual a la diferencia (${diferencia})`);
    }

    // Validar que los lotes pertenecen al producto
    for (const lot of data.lots) {
      const lotData = await lotRepository.findById(lot.lotId);
      if (!lotData) {
        throw new Error(`Lote ${lot.lotId} no encontrado`);
      }
      if (lotData.productId !== line.productId) {
        throw new Error(`El lote ${lot.lotId} no pertenece al producto de la línea`);
      }
    }

    return inventoryCountRepository.createAdjustment(data);
  }

  async authorizeAdjustment(adjustmentId: string) {
    const adjustment = await inventoryCountRepository.findAdjustmentById(adjustmentId);
    if (!adjustment) {
      throw new Error('Ajuste no encontrado');
    }

    if (adjustment.status !== 'PENDING') {
      throw new Error('Este ajuste ya no está pendiente');
    }

    // Crear movimientos según el tipo de ajuste
    const movementType = adjustment.type === 'INCREASE' ? 'ENTRADA' : 'SALIDA';
    const movements = [];

    for (const adjLot of adjustment.lots) {
      const movement = await movementRepository.create({
        productId: adjustment.line.productId,
        lotId: adjLot.lotId,
        type: movementType,
        quantity: adjLot.quantity,
        notes: `Ajuste de inventario autorizado - Conteo ${adjustment.line.inventoryCount.id}`
      });
      movements.push(movement);
    }

    // Marcar como autorizado
    const updatedAdjustment = await inventoryCountRepository.authorizeAdjustment(adjustmentId);

    return {
      adjustment: updatedAdjustment,
      movements
    };
  }

  async rejectAdjustment(adjustmentId: string) {
    const adjustment = await inventoryCountRepository.findAdjustmentById(adjustmentId);
    if (!adjustment) {
      throw new Error('Ajuste no encontrado');
    }

    if (adjustment.status !== 'PENDING') {
      throw new Error('Este ajuste ya no está pendiente');
    }

    return inventoryCountRepository.rejectAdjustment(adjustmentId);
  }

  async getPendingAdjustments() {
    return inventoryCountRepository.findPendingAdjustments();
  }
}

export const inventoryCountService = new InventoryCountService();
