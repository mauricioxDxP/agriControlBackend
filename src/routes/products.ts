import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products - Obtener todos los productos
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// POST /api/products - Crear producto
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, state, baseUnit, dosePerHectareMin, dosePerHectareMax, concentration } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        type,
        state,
        baseUnit,
        dosePerHectareMin,
        dosePerHectareMax,
        concentration
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, type, state, baseUnit, dosePerHectareMin, dosePerHectareMax, concentration } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        type,
        state,
        baseUnit,
        dosePerHectareMin,
        dosePerHectareMax,
        concentration
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

export default router;
