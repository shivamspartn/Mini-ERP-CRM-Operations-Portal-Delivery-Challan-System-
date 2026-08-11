import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';
import { sendError } from '../utils/response.utils';

export const generateChallanPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Fetch Challan with related customer, items, and issuer user data
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!challan) {
      sendError(res, 'Delivery Challan not found', 404);
      return;
    }

    // 2. Set HTTP Headers for PDF streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Challan-${challan.challanNumber}.pdf`
    );

    // 3. Initialize PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // --- Header Section ---
    doc
      .fontSize(22)
      .fillColor('#1E3A8A')
      .text('DELIVERY CHALLAN', { align: 'right' })
      .moveDown(0.2);

    doc
      .fontSize(10)
      .fillColor('#4B5563')
      .text(`Challan No: ${challan.challanNumber}`, { align: 'right' })
      .text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' })
      .text(`Status: ${challan.status}`, { align: 'right' })
      .moveDown(1.5);

    // --- Customer / Consignee Details ---
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Deliver To (Consignee):', { underline: true })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(`Customer Name: ${challan.customer.customerName}`);

    if (challan.customer.businessName) {
      doc.text(`Business Name: ${challan.customer.businessName}`);
    }
    if (challan.customer.mobileNumber) {
      doc.text(`Contact: ${challan.customer.mobileNumber}`);
    }
    if (challan.customer.address) {
      doc.text(`Address: ${challan.customer.address}`);
    }

    doc.moveDown(1.5);

    // --- Table Headers ---
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('SKU', 50, tableTop, { width: 80 })
      .text('Item Description', 130, tableTop, { width: 180 })
      .text('Qty', 310, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 370, tableTop, { width: 80, align: 'right' })
      .text('Subtotal', 460, tableTop, { width: 80, align: 'right' });

    // Header Border Line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(540, tableTop + 15)
      .strokeColor('#D1D5DB')
      .stroke();

    // --- Table Rows ---
    let currentY = tableTop + 25;
    let grandTotal = 0;

    challan.items.forEach((item) => {
      const subtotal = Number(item.subtotal ?? Number(item.unitPriceSnapshot) * item.quantity);
      grandTotal += subtotal;

      doc
        .fontSize(9)
        .fillColor('#4B5563')
        .text(item.skuSnapshot || '-', 50, currentY, { width: 80 })
        .text(item.productNameSnapshot, 130, currentY, { width: 180 })
        .text(item.quantity.toString(), 310, currentY, { width: 50, align: 'right' })
        .text(`₹${Number(item.unitPriceSnapshot).toFixed(2)}`, 370, currentY, { width: 80, align: 'right' })
        .text(`₹${subtotal.toFixed(2)}`, 460, currentY, { width: 80, align: 'right' });

      currentY += 20;
    });

    // Table Bottom Divider Line
    doc
      .moveTo(50, currentY + 5)
      .lineTo(540, currentY + 5)
      .strokeColor('#D1D5DB')
      .stroke();

    // --- Summary Section ---
    currentY += 15;
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text(`Total Quantity: ${challan.totalQuantity} pcs`, 50, currentY)
      .text(`Grand Total: ₹${grandTotal.toFixed(2)}`, 360, currentY, { width: 180, align: 'right' });

    // --- Signatures & Footer Section ---
    currentY += 60;
    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text(`Issued By: ${challan.user?.name || 'N/A'}`, 50, currentY)
      .text('Receiver Signature & Stamp: __________________', 280, currentY);

    currentY += 45;
    doc
      .text('_______________________', 50, currentY)
      .text('Authorized Signatory', 50, currentY + 15);

    // 4. Stream PDF to response
    doc.end();
  } catch (error) {
    console.error('generateChallanPDF error:', error);
    if (!res.headersSent) {
      sendError(res, 'Failed to generate PDF', 500);
    }
  }
};