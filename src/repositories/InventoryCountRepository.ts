// ============================================
// Repository: InventoryCount
// Capa de acceso a datos
// ============================================

import prisma from './prisma';
import { CreateInventoryCountDto, CreateInventoryCountLineDto, UpdateInventoryCountLineDto, RequestAdjustmentDto } from '../types';

const transformDates = (obj: any) => {
  if (!obj) return obj;
  const result: any = { ...obj };
  if (result.date) result.date = result.date.toISOString();
  if (result.createdAt) result.createdAt = result.createdAt.toISOString();
  if (result.updatedAt) result.updatedAt = result.updatedAt.toISOString();
  if (result.authorizedAt) result.authorizedAt = result.authorizedAt.toISOString();
  if (result.rejectedAt) result.rejectedAt = result.rejectedAt.toISOString();
  return result;
};

const transformLines = (lines: any[]) => lines.map(transformDates);

export class InventoryCountRepository {

  async findAll(): Promise<any[]> {
    const counts = await prisma.inventoryCount.findMany({
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, productCode: true, baseUnit: true, type: true } },
            adjustments: {
              include: {
                lots: {
                  include: {
                    lot: { select: { id: true, lotCode: true, initialStock: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    return counts.map(transformDates);
  }

  async findById(id: string): Promise<any | null> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, productCode: true, baseUnit: true, type: true } },
            adjustments: {
              include: {
                lots: {
                  include: {
                    lot: { select: { id: true, lotCode: true, initialStock: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    return count ? transformDates(count) : null;
  }

  async create(data: CreateInventoryCountDto): Promise<any> {
    // Las líneas ya vienen con productCode y productName desde el service
    const linesData = (data.lines || []).map(line => ({
      productId: line.productId,
      stockManual: line.stockManual || 0,
      stockActual: 0,
      productCode: (line as any).productCode || '',
      productName: (line as any).productName || ''
    }));

    const count = await prisma.inventoryCount.create({
      data: {
        date: new Date(data.date),
        notes: data.notes,
        lines: linesData.length > 0 ? { create: linesData } : undefined
      },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, productCode: true, baseUnit: true, type: true } }
          }
        }
      }
    });
    return transformDates(count);
  }

  async delete(id: string): Promise<void> {
    await prisma.inventoryCount.delete({
      where: { id }
    });
  }

  async addLine(inventoryCountId: string, data: CreateInventoryCountLineDto, productCode: string, productName: string, stockActual: number): Promise<any> {
    const line = await prisma.inventoryCountLine.create({
      data: {
        inventoryCountId,
        productId: data.productId,
        stockManual: data.stockManual,
        stockActual,
        productCode,
        productName
      },
      include: {
        product: { select: { id: true, name: true, productCode: true, baseUnit: true } }
      }
    });
    return transformDates(line);
  }

  async updateLine(lineId: string, data: UpdateInventoryCountLineDto): Promise<any> {
    const line = await prisma.inventoryCountLine.update({
      where: { id: lineId },
      data: {
        stockManual: data.stockManual
      },
      include: {
        product: { select: { id: true, name: true, productCode: true, baseUnit: true } },
        adjustments: true
      }
    });
    return transformDates(line);
  }

  async findLineById(lineId: string): Promise<any | null> {
    const line = await prisma.inventoryCountLine.findUnique({
      where: { id: lineId },
      include: {
        product: { select: { id: true, name: true, productCode: true, baseUnit: true } },
        inventoryCount: true,
        adjustments: {
          include: {
            lots: {
              include: {
                lot: true
              }
            }
          }
        }
      }
    });
    return line ? transformDates(line) : null;
  }

  async createAdjustment(data: RequestAdjustmentDto): Promise<any> {
    const adjustment = await prisma.inventoryCountAdjustment.create({
      data: {
        inventoryCountLineId: data.lineId,
        type: data.type,
        totalQuantity: data.lots.reduce((sum, l) => sum + l.quantity, 0),
        status: 'PENDING',
        notes: data.notes,
        lots: {
          create: data.lots.map(lot => ({
            lotId: lot.lotId,
            quantity: lot.quantity
          }))
        }
      },
      include: {
        lots: {
          include: {
            lot: true
          }
        },
        line: {
          include: {
            product: true
          }
        }
      }
    });

    // Marcar adjustmentPending = true en la línea
    await prisma.inventoryCountLine.update({
      where: { id: data.lineId },
      data: { adjustmentPending: true }
    });

    return transformDates(adjustment);
  }

  async findAdjustmentById(id: string): Promise<any | null> {
    const adjustment = await prisma.inventoryCountAdjustment.findUnique({
      where: { id },
      include: {
        lots: {
          include: {
            lot: true
          }
        },
        line: {
          include: {
            product: true,
            inventoryCount: true
          }
        }
      }
    });
    return adjustment ? transformDates(adjustment) : null;
  }

  async findPendingAdjustments(): Promise<any[]> {
    const adjustments = await prisma.inventoryCountAdjustment.findMany({
      where: { status: 'PENDING' },
      include: {
        lots: {
          include: {
            lot: true
          }
        },
        line: {
          include: {
            product: { select: { id: true, name: true, productCode: true, baseUnit: true } },
            inventoryCount: { select: { id: true, date: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return adjustments.map(transformDates);
  }

  async authorizeAdjustment(adjustmentId: string): Promise<any> {
    const adjustment = await prisma.inventoryCountAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'AUTHORIZED',
        authorizedAt: new Date()
      },
      include: {
        lots: {
          include: {
            lot: true
          }
        },
        line: {
          include: {
            product: true,
            inventoryCount: true
          }
        }
      }
    });

    // Marcar adjustmentPending = false en la línea
    await prisma.inventoryCountLine.update({
      where: { id: adjustment.inventoryCountLineId },
      data: { adjustmentPending: false }
    });

    return transformDates(adjustment);
  }

  async rejectAdjustment(adjustmentId: string): Promise<any> {
    const adjustment = await prisma.inventoryCountAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date()
      },
      include: {
        lots: true,
        line: {
          include: {
            product: true
          }
        }
      }
    });

    // Marcar adjustmentPending = false en la línea
    await prisma.inventoryCountLine.update({
      where: { id: adjustment.inventoryCountLineId },
      data: { adjustmentPending: false }
    });

    return transformDates(adjustment);
  }

  async updateLineStockActual(lineId: string, stockActual: number): Promise<void> {
    await prisma.inventoryCountLine.update({
      where: { id: lineId },
      data: { stockActual }
    });
  }
}

export const inventoryCountRepository = new InventoryCountRepository();
