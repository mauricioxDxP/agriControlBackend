// ============================================
// Controller: Container
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { containerService } from '../services/ContainerService';
import { CreateContainerDto, UpdateContainerDto, ConsumeContainerDto } from '../types';

export class ContainerController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const containers = await containerService.getAllContainers();
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching containers' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const container = await containerService.getContainerById(id);
      res.json(container);
    } catch (error) {
      if (error instanceof Error && error.message === 'Contenedor no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching container' });
    }
  }

  async getByLot(req: Request, res: Response): Promise<void> {
    try {
      const lotId = req.params.lotId as string;
      const containers = await containerService.getContainersByLot(lotId);
      res.json(containers);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching containers' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateContainerDto = req.body;
      const container = await containerService.createContainer(data);
      res.status(201).json(container);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating container',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateContainerDto = req.body;
      const container = await containerService.updateContainer(id, data);
      res.json(container);
    } catch (error) {
      if (error instanceof Error && error.message === 'Contenedor no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error updating container' });
    }
  }

  async consume(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: ConsumeContainerDto = req.body;
      const container = await containerService.consumeContainer(id, data);
      res.json(container);
    } catch (error) {
      if (error instanceof Error && error.message === 'Contenedor no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: 'Error consuming container' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await containerService.deleteContainer(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Contenedor no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting container' });
    }
  }

  async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const containerId = req.params.id as string;
      const movements = await containerService.getContainerMovements(containerId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching movements' });
    }
  }
}

export const containerController = new ContainerController();
