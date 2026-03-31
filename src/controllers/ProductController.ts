// ============================================
// Controller: Product
// Capa de presentación HTTP
// ============================================

import { Request, Response } from 'express';
import { productService } from '../services/ProductService';
import { CreateProductDto, UpdateProductDto } from '../types';

export class ProductController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ 
        error: 'Error fetching products',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ 
        error: 'Error fetching product',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateProductDto = req.body;
      const product = await productService.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error creating product',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateProductDto = req.body;
      const product = await productService.updateProduct(id, data);
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ 
        error: 'Error updating product',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await productService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ 
        error: 'Error deleting product',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const productController = new ProductController();
