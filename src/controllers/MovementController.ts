// ============================================
// Controller: Movement
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { movementService } from '../services/MovementService';
import { CreateMovementDto } from '../types';

export class MovementController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const movements = await movementService.getAllMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }

  async getByProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId as string;
      const movements = await movementService.getMovementsByProduct(productId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }

  async getByLot(req: Request, res: Response): Promise<void> {
    try {
      const lotId = req.params.lotId as string;
      const movements = await movementService.getMovementsByLot(lotId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }

  async getByTancada(req: Request, res: Response): Promise<void> {
    try {
      const tancadaId = req.params.tancadaId as string;
      const movements = await movementService.getMovementsByTancada(tancadaId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }

  async getByApplication(req: Request, res: Response): Promise<void> {
    try {
      const applicationId = req.params.applicationId as string;
      const movements = await movementService.getMovementsByApplication(applicationId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateMovementDto = req.body;
      const movement = await movementService.createMovement(data);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating movement',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await movementService.deleteMovement(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting movement';
      const status = message.includes('no encontrado') ? 404 : 
                     message.includes('No se puede eliminar') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  }

  async getStock(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId as string;
      const stock = await movementService.getProductStock(productId);
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching stock' });
    }
  }

  async getLotStock(req: Request, res: Response): Promise<void> {
    try {
      const lotId = req.params.lotId as string;
      const stock = await movementService.getLotStock(lotId);
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching lot stock' });
    }
  }
}

export const movementController = new MovementController();
