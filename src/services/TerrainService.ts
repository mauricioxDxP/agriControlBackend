// ============================================
// Service: Terrain
// Business logic layer
// ============================================

import { terrainRepository } from '../repositories/TerrainRepository';
import { CreateTerrainDto, UpdateTerrainDto } from '../types';

export class TerrainService {
  
  async getAllTerrains() {
    return terrainRepository.findAll();
  }

  async getTerrainById(id: string) {
    const terrain = await terrainRepository.findById(id);
    if (!terrain) throw new Error('Terrain not found');
    return terrain;
  }

  async createTerrain(data: CreateTerrainDto) {
    if (!data.name) throw new Error('Name is required');
    
    return terrainRepository.create(data);
  }

  async updateTerrain(id: string, data: UpdateTerrainDto) {
    const existing = await terrainRepository.findById(id);
    if (!existing) throw new Error('Terrain not found');
    
    return terrainRepository.update(id, data);
  }

  async deleteTerrain(id: string) {
    const existing = await terrainRepository.findById(id);
    if (!existing) throw new Error('Terrain not found');
    
    try {
      await terrainRepository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('associated fields')) {
        throw new Error('Cannot delete terrain because it has associated fields');
      }
      throw error;
    }
  }

  async getTotalArea(id: string) {
    const terrain = await terrainRepository.findById(id);
    if (!terrain) throw new Error('Terrain not found');
    
    return terrainRepository.getTotalArea(id);
  }
}

export const terrainService = new TerrainService();