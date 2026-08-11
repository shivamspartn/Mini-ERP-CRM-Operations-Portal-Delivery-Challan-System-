import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response.utils';
import { MovementType } from '@prisma/client';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { productName: 'asc' },
    });
    return sendSuccess(res, 'Products fetched successfully', products);
  } catch (error) {
    console.error('getProducts error:', error);
    return sendError(res, 'Failed to fetch products', 500);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      productName,
      sku,
      category,
      unitPrice,
      currentStock,
      minimumStock,
      warehouseLocation,
    } = req.body;

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return sendError(res, 'A product with this SKU already exists', 400);
    }

    const product = await prisma.product.create({
      data: {
        productName,
        sku: sku.toUpperCase().trim(),
        category,
        unitPrice,
        currentStock: currentStock || 0,
        minimumStock: minimumStock ?? 5,
        warehouseLocation,
      },
    });

    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    console.error('createProduct error:', error);
    return sendError(res, 'Failed to create product', 500);
  }
};

export const recordStockMovement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, movementType, reason } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    let updatedStock = product.currentStock;
    if (movementType === MovementType.IN) {
      updatedStock += quantity;
    } else if (movementType === MovementType.OUT) {
      if (product.currentStock < quantity) {
        return sendError(res, 'Insufficient stock available for this reduction', 400);
      }
      updatedStock -= quantity;
    }

    // Atomic transaction: Log movement + update stock
    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: id,
          quantity,
          movementType: movementType as MovementType,
          reason,
          createdBy: userId,
        },
      }),
      prisma.product.update({
        where: { id },
        data: { currentStock: updatedStock },
      }),
    ]);

    return sendSuccess(res, 'Stock movement recorded', { movement, product: updatedProduct });
  } catch (error) {
    console.error('recordStockMovement error:', error);
    return sendError(res, 'Failed to update stock', 500);
  }
};