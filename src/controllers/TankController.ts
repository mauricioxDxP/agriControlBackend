// ============================================
// Controller: Tank
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { tankService } from '../services/TankService';
import { CreateTankDto, UpdateTankDto } from '../types';

export class TankController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tanks = await tankService.getAllTanks();
      res.json(tanks);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching tanks' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const tank = await tankService.getTankById(id);
      res.json(tank);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tanque no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching tank' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTankDto = req.body;
      const tank = await tankService.createTank(data);
      res.status(201).json(tank);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating tank',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateTankDto = req.body;
      const tank = await tankService.updateTank(id, data);
      res.json(tank);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tanque no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating tank' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await tankService.deleteTank(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Tanque no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting tank' });
    }
  }
}

export const tankController = new TankController();
