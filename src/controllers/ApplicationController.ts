// ============================================
// Controller: Application
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { applicationService } from '../services/ApplicationService';
import { CreateApplicationDto } from '../types';

export class ApplicationController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const applications = await applicationService.getAllApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching applications' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const application = await applicationService.getApplicationById(id);
      res.json(application);
    } catch (error) {
      if (error instanceof Error && error.message === 'Aplicación no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error fetching application' });
    }
  }

  async getByField(req: Request, res: Response): Promise<void> {
    try {
      const fieldId = req.params.fieldId as string;
      const applications = await applicationService.getApplicationsByField(fieldId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching applications' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateApplicationDto = req.body;
      const application = await applicationService.createApplication(data);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating application',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: CreateApplicationDto = req.body;
      const application = await applicationService.updateApplication(id, data);
      res.json(application);
    } catch (error) {
      if (error instanceof Error && error.message === 'Aplicación no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ 
        error: 'Error updating application',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await applicationService.deleteApplication(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Aplicación no encontrada') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Error deleting application' });
    }
  }
}

export const applicationController = new ApplicationController();
