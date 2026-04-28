// ============================================
// Controller: InventoryCount
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { inventoryCountService } from '../services/InventoryCountService';
import { CreateInventoryCountDto, CreateInventoryCountLineDto, UpdateInventoryCountLineDto, RequestAdjustmentDto } from '../types';

export class InventoryCountController {

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const counts = await inventoryCountService.getAllCounts();
      res.json(counts);
    } catch (error) {
      console.error('Error fetching inventory counts:', error);
      res.status(500).json({
        error: 'Error fetching inventory counts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const count = await inventoryCountService.getCountById(id);
      res.json(count);
    } catch (error) {
      console.error('Error fetching inventory count:', error);
      if (error instanceof Error && error.message === 'Conteo no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error fetching inventory count',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateInventoryCountDto = req.body;

      if (!data.date) {
        res.status(400).json({ error: 'La fecha es requerida' });
        return;
      }

      const count = await inventoryCountService.createCount(data);
      res.status(201).json(count);
    } catch (error) {
      console.error('Error creating inventory count:', error);
      res.status(500).json({
        error: 'Error creating inventory count',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await inventoryCountService.deleteCount(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting inventory count:', error);
      if (error instanceof Error && error.message === 'Conteo no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error deleting inventory count',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addLine(req: Request, res: Response): Promise<void> {
    try {
      const countId = req.params.id as string;
      const data: CreateInventoryCountLineDto = req.body;

      if (!data.productId) {
        res.status(400).json({ error: 'El productId es requerido' });
        return;
      }

      const line = await inventoryCountService.addLine(countId, data);
      res.status(201).json(line);
    } catch (error) {
      console.error('Error adding line:', error);
      if (error instanceof Error && error.message === 'Conteo no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error adding line',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateLine(req: Request, res: Response): Promise<void> {
    try {
      const countId = req.params.id as string;
      const lineId = req.params.lineId as string;
      const data: UpdateInventoryCountLineDto = req.body;

      if (data.stockManual === undefined) {
        res.status(400).json({ error: 'El stockManual es requerido' });
        return;
      }

      const line = await inventoryCountService.updateLineStockManual(countId, lineId, data.stockManual);
      res.json(line);
    } catch (error) {
      console.error('Error updating line:', error);
      if (error instanceof Error && error.message === 'Conteo no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Línea no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'No se puede editar mientras hay un ajuste pendiente') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error updating line',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async requestAdjustment(req: Request, res: Response): Promise<void> {
    try {
      const data: RequestAdjustmentDto = req.body;

      if (!data.lineId) {
        res.status(400).json({ error: 'El lineId es requerido' });
        return;
      }

      if (!data.type || !['INCREASE', 'DECREASE'].includes(data.type)) {
        res.status(400).json({ error: 'El type debe ser INCREASE o DECREASE' });
        return;
      }

      if (!data.lots || data.lots.length === 0) {
        res.status(400).json({ error: 'Debe seleccionar al menos un lote' });
        return;
      }

      const adjustment = await inventoryCountService.requestAdjustment(data);
      res.status(201).json(adjustment);
    } catch (error) {
      console.error('Error requesting adjustment:', error);
      res.status(500).json({
        error: 'Error requesting adjustment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async authorizeAdjustment(req: Request, res: Response): Promise<void> {
    try {
      const adjustmentId = req.params.adjustmentId as string;
      const result = await inventoryCountService.authorizeAdjustment(adjustmentId);
      res.json(result);
    } catch (error) {
      console.error('Error authorizing adjustment:', error);
      if (error instanceof Error && error.message === 'Ajuste no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Este ajuste ya no está pendiente') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error authorizing adjustment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async rejectAdjustment(req: Request, res: Response): Promise<void> {
    try {
      const adjustmentId = req.params.adjustmentId as string;
      const result = await inventoryCountService.rejectAdjustment(adjustmentId);
      res.json(result);
    } catch (error) {
      console.error('Error rejecting adjustment:', error);
      if (error instanceof Error && error.message === 'Ajuste no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Este ajuste ya no está pendiente') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: 'Error rejecting adjustment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPendingAdjustments(req: Request, res: Response): Promise<void> {
    try {
      const adjustments = await inventoryCountService.getPendingAdjustments();
      res.json(adjustments);
    } catch (error) {
      console.error('Error fetching pending adjustments:', error);
      res.status(500).json({
        error: 'Error fetching pending adjustments',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const inventoryCountController = new InventoryCountController();
