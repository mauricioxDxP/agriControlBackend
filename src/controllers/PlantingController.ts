// ============================================
// Controller: Planting
// HTTP presentation layer
// ============================================

import { Request, Response } from 'express';
import { plantingService } from '../services/PlantingService';
import { CreatePlantingDto, UpdatePlantingDto } from '../types';

export class PlantingController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const fieldId = req.query.fieldId as string | undefined;
      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const plantings = await plantingService.getAllPlantings(fieldId, active);
      res.json(plantings);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error fetching plantings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const planting = await plantingService.getPlantingById(id);
      res.json(planting);
    } catch (error) {
      if (error instanceof Error && error.message === 'Planting not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching planting' });
    }
  }

  async getByFieldId(req: Request, res: Response): Promise<void> {
    try {
      const fieldId = req.params.fieldId as string;
      const plantings = await plantingService.getPlantingsByFieldId(fieldId);
      res.json(plantings);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plantings by field' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePlantingDto = req.body;
      const planting = await plantingService.createPlanting(data);
      res.status(201).json(planting);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating planting',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdatePlantingDto = req.body;
      const planting = await plantingService.updatePlanting(id, data);
      res.json(planting);
    } catch (error) {
      if (error instanceof Error && error.message === 'Planting not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating planting' });
    }
  }

  async endPlanting(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : new Date();
      const planting = await plantingService.endPlanting(id, fechaFin);
      res.json(planting);
    } catch (error) {
      if (error instanceof Error && error.message === 'Planting not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message.includes('already ended')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error ending planting' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await plantingService.deletePlanting(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Planting not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting planting' });
    }
  }
}

export const plantingController = new PlantingController();