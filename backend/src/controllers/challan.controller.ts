import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response.utils';

// ==========================================
// 1. Download PDF Delivery Challan
// ==========================================
export const downloadChallanPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch Challan with related Customer and Items
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Delivery Challan not found' });
      return;
    }

    // Set Response Headers for PDF Download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Challan-${challan.challanNumber}.pdf`
    );

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // --- PDF Header ---
    doc
      .fontSize(20)
      .fillColor('#1E3A8A')
      .text('DELIVERY CHALLAN', { align: 'right' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(`Challan No: ${challan.challanNumber}`, { align: 'right' })
      .text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' })
      .text(`Status: ${challan.status}`, { align: 'right' })
      .moveDown(1.5);

    // --- Customer Details ---
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Consignee / Deliver To:', { underline: true })
      .moveDown(0.25);

    doc
      .fontSize(10)
      .fillColor('#4B5563')
      .text(`Customer Name: ${challan.customer.customerName}`)
      .text(`Business Name: ${challan.customer.businessName || 'N/A'}`)
      .moveDown(1.5);

    // --- Table Header ---
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('Item Description', 50, tableTop, { width: 220 })
      .text('SKU', 270, tableTop, { width: 100 })
      .text('Unit Price', 370, tableTop, { width: 80, align: 'right' })
      .text('Qty', 450, tableTop, { width: 50, align: 'right' });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor('#E5E7EB')
      .stroke();

    // --- Table Rows ---
    let currentY = tableTop + 25;

    challan.items.forEach((item) => {
      doc
        .fontSize(9)
        .fillColor('#374151')
        .text(item.productNameSnapshot, 50, currentY, { width: 220 })
        .text(item.skuSnapshot || '-', 270, currentY, { width: 100 })
        .text(`₹${Number(item.unitPriceSnapshot).toFixed(2)}`, 370, currentY, { width: 80, align: 'right' })
        .text(item.quantity.toString(), 450, currentY, { width: 50, align: 'right' });

      currentY += 20;
    });

    // Divider
    doc
      .moveTo(50, currentY + 5)
      .lineTo(550, currentY + 5)
      .strokeColor('#E5E7EB')
      .stroke();

    // --- Footer Summary ---
    currentY += 15;
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text(`Total Dispatched Quantity: ${challan.totalQuantity} units`, 50, currentY, {
        align: 'right',
      });

    // --- Signatures ---
    currentY += 80;
    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('Authorized Signatory', 50, currentY)
      .text('Receiver\'s Signature', 400, currentY);

    // Finalize Document
    doc.end();
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
  }
};

// ==========================================
// 2. Fetch All Delivery Challans
// ==========================================
export const getChallans = async (req: Request, res: Response) => {
  try {
    const challans = await prisma.challan.findMany({
      include: {
        customer: true,
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Challans fetched successfully', challans);
  } catch (error) {
    console.error('getChallans error:', error);
    return sendError(res, 'Failed to fetch challans', 500);
  }
};

// ==========================================
// 3. Create a New Delivery Challan (DRAFT)
// ==========================================
export const createChallan = async (req: Request, res: Response) => {
  try {
    const { customerId, items } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Fetch product details for snapshot pricing
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== items.length) {
      return sendError(res, 'One or more products were not found', 400);
    }

    // Generate Unique Challan Number
    const count = await prisma.challan.count();
    const challanNumber = `DC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalQuantity = 0;
    const challanItemsData = items.map((item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)!;
      totalQuantity += item.quantity;
      const subtotal = Number(product.unitPrice) * item.quantity;

      return {
        productId: product.id,
        productNameSnapshot: product.productName,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        createdBy: userId,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return sendSuccess(res, 'Delivery challan created in DRAFT status', challan, 201);
  } catch (error) {
    console.error('createChallan error:', error);
    return sendError(res, 'Failed to create challan', 500);
  }
};

// ==========================================
// 4. Update Status with Atomic Stock Deduct / Restore
// ==========================================
export const updateChallanStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: ChallanStatus };
    const userId = (req as any).user?.userId || (req as any).user?.id;

    // 1. Fetch current Challan with items
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return sendError(res, 'Delivery Challan not found', 404);
    }

    if (challan.status === status) {
      return sendError(res, `Challan is already marked as ${status}`, 400);
    }

    // Prevent modification if already cancelled
    if (challan.status === ChallanStatus.CANCELLED) {
      return sendError(res, 'Cannot modify a cancelled delivery challan', 400);
    }

    // 2. Perform Stock Updates in an Atomic Transaction
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // --- CASE A: Confirming & Dispatching Stock (DRAFT -> CONFIRMED) ---
      if (status === ChallanStatus.CONFIRMED && challan.status === ChallanStatus.DRAFT) {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productNameSnapshot}`);
          }

          if (product.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.productNameSnapshot}". Available: ${product.currentStock}, Requested: ${item.quantity}`
            );
          }

          // Decrement current stock
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          // Record stock movement (OUT)
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.OUT,
              reason: `Dispatched via Challan ${challan.challanNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // --- CASE B: Reverting / Cancelling Dispatched Stock (CONFIRMED -> CANCELLED) ---
      if (status === ChallanStatus.CANCELLED && challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.items) {
          // Restore deducted stock
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          // Record stock movement restoration (IN)
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.IN,
              reason: `Restocked due to Cancellation of Challan ${challan.challanNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // 3. Update Challan status record
      return await tx.challan.update({
        where: { id },
        data: { status },
        include: { customer: true, items: true },
      });
    });

    return sendSuccess(
      res,
      `Delivery Challan status successfully updated to ${status}`,
      updatedChallan
    );
  } catch (error: any) {
    console.error('updateChallanStatus error:', error);
    return sendError(res, error.message || 'Failed to update challan status', 400);
  }
};