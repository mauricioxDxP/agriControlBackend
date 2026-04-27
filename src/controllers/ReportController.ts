// ============================================
// Controller: Reports
// PDF generation for stock verification
// ============================================

import { Request, Response } from 'express';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { prisma } from '../repositories/prisma';

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
          // Calculate total stock from movements only
          let totalStock = 0;
          for (const lot of product.lots) {
            const lotStock = lot.movements.reduce((mSum: number, m: any) => mSum + m.quantity, 0);
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
            const lotStock = lot.movements.reduce((mSum: number, m: any) => mSum + m.quantity, 0);
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
      res.setHeader('Content-Disposition', 'inline; filename=Verificacion_Stock.pdf');
      const pdfData = doc.output('arraybuffer');
      res.send(Buffer.from(pdfData));
    } catch (error) {
      console.error('Error generating stock report:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating report' });
      }
    }
  }
}

export const reportController = new ReportController();