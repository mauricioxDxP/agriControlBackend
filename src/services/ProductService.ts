// ============================================
// Service: Product
// Capa de lógica de negocio
// ============================================

import { productRepository } from '../repositories/ProductRepository';
import { lotRepository } from '../repositories/LotRepository';
import { CreateProductDto, UpdateProductDto } from '../types';

export class ProductService {
  
  async getAllProducts() {
    return productRepository.findAll();
  }

  async getProductById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error('Producto no encontrado');
    return product;
  }

  async createProduct(data: CreateProductDto) {
    if (!data.name) throw new Error('El nombre es requerido');
    if (!data.typeId) throw new Error('El tipo de producto es requerido');
    if (!data.stateId) throw new Error('El estado del producto es requerido');
    
    console.log('[ProductService] createProduct data:', JSON.stringify(data));
    return productRepository.create(data);
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new Error('Producto no encontrado');
    
    return productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new Error('Producto no encontrado');
    
    // Verificar si hay lotes asociados
    const lots = await lotRepository.findByProduct(id);
    if (lots.length > 0) {
      throw new Error(`No se puede eliminar el producto porque tiene ${lots.length} lote(s) asociado(s). Elimine los lotes primero.`);
    }
    
    await productRepository.delete(id);
  }
}

export const productService = new ProductService();
