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

      // Prepare data rows - only necessary rows (no empty rows)
      const rows = products.map(product => {
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

      // Generate table with compact spacing
      autoTable(doc, {
        head: [['Cod.', 'Nombre', 'Cant.', 'OK', 'Observaciones']],
        body: rows,
        startY: 30,
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 80 }
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
        }
      });

      // Add signature section
      const finalY = (doc as any).lastAutoTable.finalY || 200;

      doc.setFontSize(10);
      doc.text('Firma del responsable:', 20, finalY + 20);
      doc.line(20, finalY + 25, 90, finalY + 25);

      doc.text('Firma del verificante:', 120, finalY + 20);
      doc.line(120, finalY + 25, 190, finalY + 25);

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