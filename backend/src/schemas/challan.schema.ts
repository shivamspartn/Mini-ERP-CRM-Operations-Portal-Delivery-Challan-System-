import { z } from 'zod';

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string({
      required_error: 'Customer ID is required',
    }).min(1, 'Customer ID cannot be empty'),
    
    items: z
      .array(
        z.object({
          productId: z.string({
            required_error: 'Product ID is required',
          }).min(1, 'Product ID cannot be empty'),
          
          quantity: z
            .number({
              required_error: 'Quantity is required',
            })
            .int('Quantity must be an integer')
            .positive('Quantity must be greater than 0'),
        })
      )
      .min(1, 'At least one item is required to create a delivery challan'),
  }),
});

export const updateChallanStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED'], {
      errorMap: () => ({ message: 'Status must be DRAFT, CONFIRMED, or CANCELLED' }),
    }),
  }),
});