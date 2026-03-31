// ============================================
// Controller: Lot
// Capa de presentación HTTP - Maneja requests/responses
// ============================================

import { Request, Response } from 'express';
import { lotService } from '../services/LotService';
import { CreateLotDto, UpdateLotDto } from '../types';

export class LotController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const lots = await lotService.getAllLots();
      res.json(lots);
    } catch (error) {
      console.error('Error fetching lots:', error);
      res.status(500).json({ 
        error: 'Error fetching lots',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const lot = await lotService.getLotById(id);
      
      if (!lot) {
        res.status(404).json({ error: 'Lot not found' });
        return;
      }

      res.json(lot);
    } catch (error) {
      console.error('Error fetching lot:', error);
      res.status(500).json({ 
        error: 'Error fetching lot',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getByProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId as string;
      const lots = await lotService.getLotsByProduct(productId);
      res.json(lots);
    } catch (error) {
      console.error('Error fetching lots by product:', error);
      res.status(500).json({ 
        error: 'Error fetching lots for product',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateLotDto = req.body;
      
      // Validaciones básicas
      if (!data.productId) {
        res.status(400).json({ error: 'productId es requerido' });
        return;
      }

      if (!data.initialStock || data.initialStock <= 0) {
        res.status(400).json({ error: 'initialStock debe ser mayor a 0' });
        return;
      }

      const lot = await lotService.createLot(data);
      res.status(201).json(lot);
    } catch (error) {
      console.error('Error creating lot:', error);
      res.status(500).json({ 
        error: 'Error creating lot',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateLotDto = req.body;

      const lot = await lotService.updateLot(id, data);
      res.json(lot);
    } catch (error) {
      console.error('Error updating lot:', error);
      
      if (error instanceof Error && error.message === 'Lote no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Error updating lot',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await lotService.deleteLot(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting lot:', error);
      
      if (error instanceof Error && error.message === 'Lote no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Error deleting lot',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const lotController = new LotController();
