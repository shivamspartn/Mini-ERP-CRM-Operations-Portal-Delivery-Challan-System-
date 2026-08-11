import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Name must be at least 2 characters'),
    companyName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
    address: z.string().optional(),
    city: z.string().optional(),
    customerType: z.nativeEnum(CustomerType).optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const addFollowUpSchema = z.object({
  body: z.object({
    notes: z.string().min(3, 'Follow-up note is required'),
    nextFollowUpDate: z.string().optional(),
  }),
});