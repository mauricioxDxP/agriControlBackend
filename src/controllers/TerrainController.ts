// ============================================
// Controller: Terrain
// HTTP presentation layer
// ============================================

import { Request, Response } from 'express';
import { terrainService } from '../services/TerrainService';
import { CreateTerrainDto, UpdateTerrainDto } from '../types';

export class TerrainController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const terrains = await terrainService.getAllTerrains();
      res.json(terrains);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error fetching terrains',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const terrain = await terrainService.getTerrainById(id);
      res.json(terrain);
    } catch (error) {
      if (error instanceof Error && error.message === 'Terrain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching terrain' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateTerrainDto = req.body;
      const terrain = await terrainService.createTerrain(data);
      res.status(201).json(terrain);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating terrain',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateTerrainDto = req.body;
      const terrain = await terrainService.updateTerrain(id, data);
      res.json(terrain);
    } catch (error) {
      if (error instanceof Error && error.message === 'Terrain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating terrain' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await terrainService.deleteTerrain(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Terrain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message.includes('associated fields')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting terrain' });
    }
  }

  async getTotalArea(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const totalArea = await terrainService.getTotalArea(id);
      res.json({ totalArea });
    } catch (error) {
      if (error instanceof Error && error.message === 'Terrain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error calculating total area' });
    }
  }
}

export const terrainController = new TerrainController();