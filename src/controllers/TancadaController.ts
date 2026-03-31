// ============================================
// Controller: Tancada
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { tancadaService } from '../services/TancadaService';
import { CreateTancadaDto } from '../types';

export class TancadaController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tancadas = await tancadaService.getAllTancadas();
      res.json(tancadas);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching tancadas' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const tancada = await tancadaService.getTancadaById(id);
      res.json(tancada);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tancada no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching tancada' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTancadaDto = req.body;
      const tancada = await tancadaService.createTancada(data);
      res.status(201).json(tancada);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating tancada',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: CreateTancadaDto = req.body;
      const tancada = await tancadaService.updateTancada(id, data);
      res.json(tancada);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tancada no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating tancada' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await tancadaService.deleteTancada(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Tancada no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting tancada' });
    }
  }
}

export const tancadaController = new TancadaController();
