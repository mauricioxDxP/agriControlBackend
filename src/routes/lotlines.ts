// ============================================
// Routes: LotLine
// Rutas API para líneas de lote
// ============================================

import { Router } from 'express';
import { lotLineService } from '../services/LotLineService';

const router = Router();

// GET /api/lotlines - Obtener todas las líneas de lote
router.get('/', async (req, res) => {
  try {
    const lotLines = await lotLineService.getAllLotLines();
    res.json({ data: lotLines });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lotlines/lot/:lotId - Obtener líneas de lote por lote
router.get('/lot/:lotId', async (req, res) => {
  try {
    const lotLines = await lotLineService.getLotLinesByLot(req.params.lotId);
    res.json({ data: lotLines });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lotlines - Crear una nueva línea de lote
router.post('/', async (req, res) => {
  try {
    const lotLine = await lotLineService.createLotLine(req.body);
    res.status(201).json({ data: lotLine });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/lotlines/:id - Actualizar una línea de lote
router.put('/:id', async (req, res) => {
  try {
    const lotLine = await lotLineService.updateLotLine(req.params.id, req.body);
    res.json({ data: lotLine });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/lotlines/:id/consume - Consumir de una línea de lote
router.post('/:id/consume', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ error: 'La cantidad es requerida' });
    }
    const lotLine = await lotLineService.consumeLotLine(req.params.id, quantity);
    res.json({ data: lotLine });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/lotlines/:id/recharge - Recargar una línea de lote
router.post('/:id/recharge', async (req, res) => {
  try {
    const { quantity } = req.body;
    const lotLine = await lotLineService.rechargeLotLine(req.params.id, quantity);
    res.json({ data: lotLine });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/lotlines/:id - Eliminar una línea de lote
router.delete('/:id', async (req, res) => {
  try {
    await lotLineService.deleteLotLine(req.params.id);
    res.json({ message: 'Línea de lote eliminada correctamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/lotlines/:id/movements - Obtener movimientos de una línea de lote
router.get('/:id/movements', async (req, res) => {
  try {
    const movements = await lotLineService.getLotLineMovements(req.params.id);
    res.json({ data: movements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
