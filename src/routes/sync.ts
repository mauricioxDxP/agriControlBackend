import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/sync - Sincronizar datos desde el cliente offline
router.post('/', async (req: Request, res: Response) => {
  try {
    const { products, lots, fields, applications, movements, applicationLots, lotLines, lastSync, terrains, plantings, inventoryCounts, inventoryCountLines, inventoryCountAdjustments, inventoryCountAdjustmentLots } = req.body;
    const results: any = {
      products: [],
      lots: [],
      fields: [],
      applications: [],
      movements: [],
      applicationLots: [],
      lotLines: [],
      terrains: [],
      plantings: [],
      inventoryCounts: [],
      inventoryCountLines: [],
      inventoryCountAdjustments: [],
      inventoryCountAdjustmentLots: []
    };

    // Sincronizar productos
    if (products && Array.isArray(products)) {
      for (const product of products) {
        const existing = await prisma.product.findUnique({ where: { id: product.id } });
        if (existing) {
          // Actualizar si hay cambios (last write wins)
          if (new Date(product.updatedAt) > new Date(existing.updatedAt)) {
            results.products.push(await prisma.product.update({
              where: { id: product.id },
              data: { ...product, synced: true }
            }));
          }
        } else {
          // Crear nuevo
          results.products.push(await prisma.product.create({
            data: { ...product, synced: true }
          }));
        }
      }
    }

    // Sincronizar lotes
    if (lots && Array.isArray(lots)) {
      for (const lot of lots) {
        const existing = await prisma.lot.findUnique({ where: { id: lot.id } });
        if (existing) {
          if (new Date(lot.updatedAt) > new Date(existing.updatedAt)) {
            results.lots.push(await prisma.lot.update({
              where: { id: lot.id },
              data: { ...lot, synced: true }
            }));
          }
        } else {
          results.lots.push(await prisma.lot.create({
            data: { ...lot, synced: true }
          }));
        }
      }
    }

    // Sincronizar terrains (nuevo)
    if (terrains && Array.isArray(terrains)) {
      for (const terrain of terrains) {
        const existing = await prisma.terrain.findUnique({ where: { id: terrain.id } });
        if (existing) {
          if (new Date(terrain.updatedAt) > new Date(existing.updatedAt)) {
            results.terrains.push(await prisma.terrain.update({
              where: { id: terrain.id },
              data: { ...terrain, synced: true }
            }));
          }
        } else {
          results.terrains.push(await prisma.terrain.create({
            data: { ...terrain, synced: true }
          }));
        }
      }
    }

    // Sincronizar fields
    if (fields && Array.isArray(fields)) {
      for (const field of fields) {
        const existing = await prisma.field.findUnique({ where: { id: field.id } });
        if (existing) {
          if (new Date(field.updatedAt) > new Date(existing.updatedAt)) {
            results.fields.push(await prisma.field.update({
              where: { id: field.id },
              data: { ...field, synced: true }
            }));
          }
        } else {
          results.fields.push(await prisma.field.create({
            data: { ...field, synced: true }
          }));
        }
      }
    }

    // Sincronizar plantings (nuevo)
    if (plantings && Array.isArray(plantings)) {
      for (const planting of plantings) {
        const existing = await prisma.planting.findUnique({ where: { id: planting.id } });
        if (existing) {
          if (new Date(planting.updatedAt) > new Date(existing.updatedAt)) {
            results.plantings.push(await prisma.planting.update({
              where: { id: planting.id },
              data: { ...planting, synced: true }
            }));
          }
        } else {
          results.plantings.push(await prisma.planting.create({
            data: { ...planting, synced: true }
          }));
        }
      }
    }

    // Sincronizar aplicaciones
    if (applications && Array.isArray(applications)) {
      for (const app of applications) {
        const existing = await prisma.application.findUnique({ where: { id: app.id } });
        if (existing) {
          if (new Date(app.updatedAt) > new Date(existing.updatedAt)) {
            results.applications.push(await prisma.application.update({
              where: { id: app.id },
              data: { ...app, synced: true }
            }));
          }
        } else {
          results.applications.push(await prisma.application.create({
            data: { ...app, synced: true }
          }));
        }
      }
    }

    // Sincronizar movimientos
    if (movements && Array.isArray(movements)) {
      for (const movement of movements) {
        const existing = await prisma.movement.findUnique({ where: { id: movement.id } });
        if (existing) {
          if (new Date(movement.updatedAt) > new Date(existing.updatedAt)) {
            results.movements.push(await prisma.movement.update({
              where: { id: movement.id },
              data: { ...movement, synced: true }
            }));
          }
        } else {
          results.movements.push(await prisma.movement.create({
            data: { ...movement, synced: true }
          }));
        }
      }
    }

    // Sincronizar applicationLots
    if (applicationLots && Array.isArray(applicationLots)) {
      for (const al of applicationLots) {
        const existing = await prisma.applicationLot.findUnique({
          where: { applicationId_lotId: { applicationId: al.applicationId, lotId: al.lotId } }
        });
        if (existing) {
          results.applicationLots.push(await prisma.applicationLot.update({
            where: { applicationId_lotId: { applicationId: al.applicationId, lotId: al.lotId } },
            data: { ...al, synced: true }
          }));
        } else {
          results.applicationLots.push(await prisma.applicationLot.create({
            data: { ...al, synced: true }
          }));
        }
      }
    }

    // Sincronizar inventoryCounts
    if (inventoryCounts && Array.isArray(inventoryCounts)) {
      for (const ic of inventoryCounts) {
        const existing = await prisma.inventoryCount.findUnique({ where: { id: ic.id } });
        if (existing) {
          if (new Date(ic.updatedAt) > new Date(existing.updatedAt)) {
            results.inventoryCounts.push(await prisma.inventoryCount.update({
              where: { id: ic.id },
              data: { ...ic, synced: true }
            }));
          }
        } else {
          results.inventoryCounts.push(await prisma.inventoryCount.create({
            data: { ...ic, synced: true }
          }));
        }
      }
    }

    // Sincronizar inventoryCountLines
    if (inventoryCountLines && Array.isArray(inventoryCountLines)) {
      for (const ic of inventoryCountLines) {
        const existing = await prisma.inventoryCountLine.findUnique({ where: { id: ic.id } });
        if (existing) {
          results.inventoryCountLines.push(await prisma.inventoryCountLine.update({
            where: { id: ic.id },
            data: { ...ic }
          }));
        } else {
          results.inventoryCountLines.push(await prisma.inventoryCountLine.create({
            data: { ...ic }
          }));
        }
      }
    }

    // Sincronizar inventoryCountAdjustments
    if (inventoryCountAdjustments && Array.isArray(inventoryCountAdjustments)) {
      for (const ica of inventoryCountAdjustments) {
        const existing = await prisma.inventoryCountAdjustment.findUnique({ where: { id: ica.id } });
        if (existing) {
          results.inventoryCountAdjustments.push(await prisma.inventoryCountAdjustment.update({
            where: { id: ica.id },
            data: { ...ica }
          }));
        } else {
          results.inventoryCountAdjustments.push(await prisma.inventoryCountAdjustment.create({
            data: { ...ica }
          }));
        }
      }
    }

    // Sincronizar inventoryCountAdjustmentLots
    if (inventoryCountAdjustmentLots && Array.isArray(inventoryCountAdjustmentLots)) {
      for (const ical of inventoryCountAdjustmentLots) {
        const existing = await prisma.inventoryCountAdjustmentLot.findUnique({ where: { id: ical.id } });
        if (existing) {
          results.inventoryCountAdjustmentLots.push(await prisma.inventoryCountAdjustmentLot.update({
            where: { id: ical.id },
            data: { ...ical }
          }));
        } else {
          results.inventoryCountAdjustmentLots.push(await prisma.inventoryCountAdjustmentLot.create({
            data: { ...ical }
          }));
        }
      }
    }

    // Obtener datos actualizados del servidor
    const serverData = {
      products: await prisma.product.findMany({ where: { synced: false } }),
      lots: await prisma.lot.findMany({ where: { synced: false } }),
      fields: await prisma.field.findMany({ where: { synced: false } }),
      applications: await prisma.application.findMany({ where: { synced: false } }),
      movements: await prisma.movement.findMany({ where: { synced: false } }),
      applicationLots: await prisma.applicationLot.findMany({ where: { synced: false } }),
      tanques: await prisma.tank.findMany({ where: { synced: false } }),
      tancadas: await prisma.tancada.findMany({ where: { synced: false } }),
      terrains: await prisma.terrain.findMany({ where: { synced: false } }),
      plantings: await prisma.planting.findMany({ where: { synced: false } }),
      inventoryCounts: await prisma.inventoryCount.findMany({ where: { synced: false } }),
      inventoryCountLines: await prisma.inventoryCountLine.findMany(),
      inventoryCountAdjustments: await prisma.inventoryCountAdjustment.findMany(),
      inventoryCountAdjustmentLots: await prisma.inventoryCountAdjustmentLot.findMany(),
    };

    // Marcar como sincronizados los datos recibidos
    await prisma.product.updateMany({ where: { id: { in: products?.map((p: any) => p.id) || [] } }, data: { synced: true } });
    await prisma.lot.updateMany({ where: { id: { in: lots?.map((l: any) => l.id) || [] } }, data: { synced: true } });
    await prisma.terrain.updateMany({ where: { id: { in: terrains?.map((t: any) => t.id) || [] } }, data: { synced: true } });
    await prisma.field.updateMany({ where: { id: { in: fields?.map((f: any) => f.id) || [] } }, data: { synced: true } });
    await prisma.planting.updateMany({ where: { id: { in: plantings?.map((s: any) => s.id) || [] } }, data: { synced: true } });
    await prisma.application.updateMany({ where: { id: { in: applications?.map((a: any) => a.id) || [] } }, data: { synced: true } });
    await prisma.movement.updateMany({ where: { id: { in: movements?.map((m: any) => m.id) || [] } }, data: { synced: true } });
    await prisma.applicationLot.updateMany({ 
      where: { 
        OR: applicationLots?.map((al: any) => ({ 
          applicationId: al.applicationId, 
          lotId: al.lotId 
        })) || [] 
      }, 
      data: { synced: true } 
    });
    await prisma.inventoryCount.updateMany({ where: { id: { in: inventoryCounts?.map((ic: any) => ic.id) || [] } }, data: { synced: true } });

    res.json({
      success: true,
      synced: results,
      serverData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Error during sync' });
  }
});

// GET /api/sync - Obtener datos no sincronizados del servidor
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = {
      products: await prisma.product.findMany({ where: { synced: false } }),
      lots: await prisma.lot.findMany({ where: { synced: false } }),
      fields: await prisma.field.findMany({ where: { synced: false } }),
      applications: await prisma.application.findMany({ where: { synced: false } }),
      movements: await prisma.movement.findMany({ where: { synced: false } }),
      applicationLots: await prisma.applicationLot.findMany({ where: { synced: false } }),
      tanques: await prisma.tank.findMany({ where: { synced: false } }),
      tancadas: await prisma.tancada.findMany({ where: { synced: false } }),
      terrains: await prisma.terrain.findMany({ where: { synced: false } }),
      plantings: await prisma.planting.findMany({ where: { synced: false } }),
      inventoryCounts: await prisma.inventoryCount.findMany({ where: { synced: false } }),
      inventoryCountLines: await prisma.inventoryCountLine.findMany(),
      inventoryCountAdjustments: await prisma.inventoryCountAdjustment.findMany(),
      inventoryCountAdjustmentLots: await prisma.inventoryCountAdjustmentLot.findMany(),
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sync data' });
  }
});

export default router;
