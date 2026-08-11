import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createProductSchema = z.object({
  body: z.object({
    productName: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU is required'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.number().positive('Unit price must be greater than 0'),
    currentStock: z.number().int().nonnegative('Initial stock cannot be negative').optional(),
    minimumStock: z.number().int().nonnegative('Minimum stock threshold is required').optional(),
    warehouseLocation: z.string().min(1, 'Warehouse location is required'),
  }),
});

export const stockMovementSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    movementType: z.nativeEnum(MovementType),
    reason: z.string().min(3, 'Reason for movement is required'),
  }),
});