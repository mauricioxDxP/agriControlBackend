// ============================================
// Controller: Reports
// PDF generation for stock verification
// ============================================

import { Request, Response } from 'express';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { prisma } from '../repositories/prisma';

// Unit abbreviations mapping
const BASE_UNIT_ABBR: Record<string, string> = {
  L: 'Lts',
  ML: 'ml',
  KG: 'Kgs',
  G: 'grs',
  CC: 'cc'
};

const getBaseUnitAbbr = (unit: string): string => BASE_UNIT_ABBR[unit] || unit;

export class ReportController {
  
async stockVerificationReport(req: Request, res: Response): Promise<void> {
    try {
      // Get all products with their lots and movements
      const products = await prisma.product.findMany({
        include: {
          type: true,
          lots: {
            include: {
              movements: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Create PDF document - portrait A4
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Verificacion de Stock', 105, 15, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

      // Group products by type
      const groupedProducts: Record<string, typeof products> = {};
      for (const product of products) {
        const typeName = product.type?.name || 'SIN TIPO';
        if (!groupedProducts[typeName]) {
          groupedProducts[typeName] = [];
        }
        groupedProducts[typeName].push(product);
      }

      // Prepare all tables data
      const allTables: { head: any[]; body: any[]; typeName: string }[] = [];

      for (const [typeName, typeProducts] of Object.entries(groupedProducts)) {
        const rows = typeProducts.map(product => {
          // Calculate total stock: ENTRADA adds, SALIDA subtracts
          let totalStock = 0;
          for (const lot of product.lots) {
            const lotStock = lot.movements.reduce((mSum: number, m: any) => {
              return mSum + (m.type === 'ENTRADA' ? m.quantity : -m.quantity);
            }, 0);
            totalStock += lotStock;
          }
          return [
            product.productCode || '-',
            product.name,
            totalStock.toFixed(1),
            ''
          ];
        });

        // Add subtotal row
        let typeTotal = 0;
        for (const product of typeProducts) {
          for (const lot of product.lots) {
            const lotStock = lot.movements.reduce((mSum: number, m: any) => {
              return mSum + (m.type === 'ENTRADA' ? m.quantity : -m.quantity);
            }, 0);
            typeTotal += lotStock;
          }
        }
        rows.push(['', `Subtotal ${typeName}:`, typeTotal.toFixed(1), '']);

        allTables.push({
          typeName,
          head: [['Cod.', 'Nombre', 'Cant.', 'OK']],
          body: rows
        });
      }

      // Generate all tables
      let currentY = 30;

      for (let i = 0; i < allTables.length; i++) {
        const table = allTables[i];

        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Type header
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(table.typeName, 15, currentY);
        currentY += 5;

        // Generate table
        autoTable(doc, {
          head: table.head,
          body: table.body,
          startY: currentY,
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 80 },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 12, halign: 'center' }
          },
          headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 1
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 1
          },
          styles: {
            lineColor: [150, 150, 150],
            lineWidth: 0.1
          },
          didParseCell: (data) => {
            // Make subtotal row bold
            const rowIndex = data.row.index;
            if (rowIndex === data.table.body.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          },
          willDrawCell: (data) => {
            // nothing special needed here
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add signature section
      doc.setFontSize(10);
      doc.text('Firma del responsable:', 20, currentY + 10);
      doc.line(20, currentY + 15, 90, currentY + 15);

      doc.text('Firma del verificante:', 120, currentY + 10);
      doc.line(120, currentY + 15, 190, currentY + 15);

      // Send response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Verificacion_Stock_${Date.now()}.pdf`);
      const pdfData = doc.output('arraybuffer');
      res.send(Buffer.from(pdfData));
    } catch (error) {
      console.error('Error generating stock report:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating report' });
      }
    }
  }

  async tancadaResumenReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      
      const tancada: any = await prisma.tancada.findUnique({
        where: { id },
        include: {
          tancadaProducts: {
            include: { product: true }
          },
          tancadaFields: {
            include: { field: true }
          }
        }
      });

      if (!tancada) {
        res.status(404).json({ error: 'Tancada no encontrada' });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen de Tancada', pageWidth / 2, 15, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date(tancada.date).toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      // Info general
      let y = 32;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Informacion General', 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const totalHectareas = tancada.tancadaFields?.reduce((sum: number, f: any) => sum + f.hectaresTreated, 0) || 0;
      doc.text(`Hectareas: ${totalHectareas.toFixed(2)} ha`, 15, y);
      y += 5;
      doc.text(`Agua: ${tancada.waterAmount.toFixed(0)} ${getBaseUnitAbbr('L')}`, 15, y);
      y += 10;

      // Productos
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Productos', 15, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Table for products
      const productRows = (tancada.tancadaProducts || []).map((tp: any) => {
        const productCode = tp.product?.productCode || '';
        const productName = tp.product?.name || 'Sin nombre';
        const unidad = tp.product?.baseUnit || 'L';
        
        let totalCantidad = tp.quantity;
        if (tp.lotsUsed) {
          try {
            const lotsUsed = typeof tp.lotsUsed === 'string' ? JSON.parse(tp.lotsUsed) : tp.lotsUsed;
            if (Array.isArray(lotsUsed)) {
              totalCantidad = lotsUsed.reduce((sum: number, lu: any) => sum + (lu.quantityUsed || 0), 0);
            }
          } catch (e) {}
        }
        
        return [
          productCode,
          productName,
          `${totalCantidad.toFixed(2)} ${getBaseUnitAbbr(unidad)}`
        ];
      });

      autoTable(doc, {
        head: [['Codigo', 'Producto', 'Total']],
        body: productRows,
        startY: y,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Campos
      if (tancada.tancadaFields && tancada.tancadaFields.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Campos Tratados', 15, y);
        y += 6;

        const fieldRows = tancada.tancadaFields.map((tf: any) => [
          tf.field?.name || 'Sin nombre',
          `${tf.hectaresTreated.toFixed(2)} ha`
        ]);

        autoTable(doc, {
          head: [['Campo', 'Hectareas']],
          body: fieldRows,
          startY: y,
          margin: { left: 15, right: 15 },
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 9
          }
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Signature section
      doc.setFontSize(10);
      doc.text('Firma del responsable:', 20, y + 10);
      doc.line(20, y + 15, 90, y + 15);
      doc.text('Firma del verificante:', 120, y + 10);
      doc.line(120, y + 15, 190, y + 15);

      // Send response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Resumen_Tancada_${id}_${Date.now()}.pdf`);
      const pdfData = doc.output('arraybuffer');
      res.send(Buffer.from(pdfData));
    } catch (error) {
      console.error('Error generating tancada report:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating report' });
      }
    }
  }

  async applicationResumenReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      
      const application: any = await prisma.application.findUnique({
        where: { id },
        include: {
          field: true,
          applicationProducts: {
            include: { product: true }
          },
          applicationLots: {
            include: { lot: true }
          }
        }
      });

      if (!application) {
        res.status(404).json({ error: 'Aplicación no encontrada' });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen de Aplicación', pageWidth / 2, 15, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date(application.date).toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      // Info general
      let y = 32;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Informacion General', 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${application.type}`, 15, y);
      y += 5;
      doc.text(`Campo: ${application.field?.name || 'Sin nombre'}`, 15, y);
      y += 5;
      
      if (application.waterAmount) {
        doc.text(`Agua: ${application.waterAmount.toFixed(0)} ${getBaseUnitAbbr('L')}`, 15, y);
        y += 5;
      }
      
      if (application.notes) {
        doc.text(`Notas: ${application.notes}`, 15, y);
        y += 5;
      }
      y += 5;

      // Productos
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Productos', 15, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Table for products
      const productRows = (application.applicationProducts || []).map((ap: any) => {
        const productCode = ap.product?.productCode || '';
        const productName = ap.product?.name || 'Sin nombre';
        const unidad = ap.product?.baseUnit || 'L';
        
        return [
          productCode,
          productName,
          `${ap.quantityUsed.toFixed(2)} ${getBaseUnitAbbr(unidad)}`
        ];
      });

      autoTable(doc, {
        head: [['Codigo', 'Producto', 'Cantidad']],
        body: productRows,
        startY: y,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Signature section
      doc.setFontSize(10);
      doc.text('Firma del responsable:', 20, y + 10);
      doc.line(20, y + 15, 90, y + 15);
      doc.text('Firma del verificante:', 120, y + 10);
      doc.line(120, y + 15, 190, y + 15);

      // Send response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Resumen_Aplicacion_${id}_${Date.now()}.pdf`);
      const pdfData = doc.output('arraybuffer');
      res.send(Buffer.from(pdfData));
    } catch (error) {
      console.error('Error generating application report:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating report' });
      }
    }
  }
}

export const reportController = new ReportController();