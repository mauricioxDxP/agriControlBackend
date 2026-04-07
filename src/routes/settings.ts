import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/settings/product-types - Obtener todos los tipos de producto
router.get('/product-types', async (req: Request, res: Response) => {
  try {
    const types = await prisma.productType.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product types' });
  }
});

// POST /api/settings/product-types - Crear tipo de producto
router.post('/product-types', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const type = await prisma.productType.create({
      data: { name: name.toUpperCase() }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product type' });
  }
});

// DELETE /api/settings/product-types/:id - Eliminar tipo de producto
router.delete('/product-types/:id', async (req: Request, res: Response) => {
  try {
    await prisma.productType.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product type' });
  }
});

// GET /api/settings/product-states - Obtener todos los estados de producto
router.get('/product-states', async (req: Request, res: Response) => {
  try {
    const states = await prisma.productState.findMany({ orderBy: { name: 'asc' } });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product states' });
  }
});

// POST /api/settings/product-states - Crear estado de producto
router.post('/product-states', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const state = await prisma.productState.create({
      data: { name: name.toUpperCase() }
    });
    res.status(201).json(state);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product state' });
  }
});

// DELETE /api/settings/product-states/:id - Eliminar estado de producto
router.delete('/product-states/:id', async (req: Request, res: Response) => {
  try {
    await prisma.productState.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product state' });
  }
});

// GET /api/settings/container-types - Obtener todos los tipos de contenedor
router.get('/container-types', async (req: Request, res: Response) => {
  try {
    const types = await prisma.containerTypeModel.findMany({ orderBy: { name: 'asc' } });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching container types' });
  }
});

// POST /api/settings/container-types - Crear tipo de contenedor
router.post('/container-types', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const type = await prisma.containerTypeModel.create({
      data: { name: name.toUpperCase() }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: 'Error creating container type' });
  }
});

// DELETE /api/settings/container-types/:id - Eliminar tipo de contenedor
router.delete('/container-types/:id', async (req: Request, res: Response) => {
  try {
    await prisma.containerTypeModel.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting container type' });
  }
});

// ===== Planted Product Types (configuración global de tipos plantados) =====

// GET /api/settings/field-product-types - Obtener tipos plantados
router.get('/field-product-types', async (req: Request, res: Response) => {
  try {
    const planted = await prisma.plantedProductType.findMany({
      include: { productType: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(planted);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching planted product types' });
  }
});

// POST /api/settings/field-product-types - Agregar tipo plantado
router.post('/field-product-types', async (req: Request, res: Response) => {
  try {
    const { productTypeId } = req.body;
    if (!productTypeId) {
      return res.status(400).json({ error: 'productTypeId is required' });
    }
    const planted = await prisma.plantedProductType.create({
      data: { productTypeId },
      include: { productType: true }
    });
    res.status(201).json(planted);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este tipo ya está en la lista de plantados' });
    }
    res.status(500).json({ error: 'Error adding planted product type' });
  }
});

// DELETE /api/settings/field-product-types/:id - Eliminar tipo plantado
router.delete('/field-product-types/:id', async (req: Request, res: Response) => {
  try {
    await prisma.plantedProductType.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting planted product type' });
  }
});

export default router;
