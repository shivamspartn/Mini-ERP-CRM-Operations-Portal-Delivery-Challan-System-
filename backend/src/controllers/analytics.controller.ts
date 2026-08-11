import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response.utils';
import { CustomerStatus, ChallanStatus } from '@prisma/client';

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // 1. Customer Metrics
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } });
    const leadsCount = await prisma.customer.count({ where: { status: CustomerStatus.LEAD } });

    // 2. Inventory Metrics
    const products = await prisma.product.findMany();
    const totalProducts = products.length;
    
    let lowStockCount = 0;
    let totalStockValue = 0;

    products.forEach((product) => {
      if (product.currentStock <= product.minimumStock) {
        lowStockCount += 1;
      }
      totalStockValue += product.currentStock * Number(product.unitPrice);
    });

    // 3. Challan Metrics
    const totalChallans = await prisma.challan.count();
    const confirmedChallans = await prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } });
    const draftChallans = await prisma.challan.count({ where: { status: ChallanStatus.DRAFT } });

    // 4. Recent Stock Movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { productName: true, sku: true } },
        user: { select: { name: true } },
      },
    });

    return sendSuccess(res, 'Metrics fetched successfully', {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        leads: leadsCount,
      },
      inventory: {
        totalProducts,
        lowStockCount,
        totalStockValue,
      },
      challans: {
        total: totalChallans,
        confirmed: confirmedChallans,
        draft: draftChallans,
      },
      recentMovements,
    });
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    return sendError(res, 'Failed to fetch dashboard metrics', 500);
  }
};