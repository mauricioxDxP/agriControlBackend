// ============================================
// Controller: Field
// HTTP presentation layer
// ============================================

import { Request, Response } from 'express';
import { fieldService } from '../services/FieldService';
import { CreateFieldDto, UpdateFieldDto } from '../types';

export class FieldController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const terrainId = req.query.terrainId as string | undefined;
      const fields = await fieldService.getAllFields(terrainId);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error fetching fields',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const field = await fieldService.getFieldById(id);
      res.json(field);
    } catch (error) {
      if (error instanceof Error && error.message === 'Field not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching field' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateFieldDto = req.body;
      const field = await fieldService.createField(data);
      res.status(201).json(field);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating field',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateFieldDto = req.body;
      const field = await fieldService.updateField(id, data);
      res.json(field);
    } catch (error) {
      if (error instanceof Error && error.message === 'Field not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating field' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await fieldService.deleteField(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Field not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting field' });
    }
  }
}

export const fieldController = new FieldController();