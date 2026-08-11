import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response.utils';
import { CustomerStatus, CustomerType } from '@prisma/client';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'Customers fetched successfully', customers);
  } catch (error) {
    console.error('getCustomers error:', error);
    return sendError(res, 'Failed to fetch customers', 500);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      mobileNumber,
      mobile, // Fallback if payload sends 'mobile'
      email,
      businessName,
      companyName, // Fallback if payload sends 'companyName'
      city,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const phone = mobileNumber || mobile || '';
    const company = businessName || companyName || '';

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email ? email.toLowerCase().trim() : undefined },
          { mobileNumber: phone ? phone : undefined },
        ].filter(Boolean),
      },
    });

    if (existingCustomer) {
      return sendError(res, 'Customer with this email or mobile number already exists', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        customerName,
        mobileNumber: phone,
        email: email.toLowerCase().trim(),
        businessName: company,
        city,
        address,
        gstNumber: gstNumber || null,
        notes: notes || null,
        customerType: (customerType as CustomerType) || CustomerType.RETAIL,
        status: (status as CustomerStatus) || CustomerStatus.LEAD,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
    });

    return sendSuccess(res, 'Customer created successfully', customer, 201);
  } catch (error) {
    console.error('createCustomer error:', error);
    return sendError(res, 'Failed to create customer', 500);
  }
};

export const addFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, nextFollowUpDate } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const followUp = await prisma.followUp.create({
      data: {
        customerId: id,
        notes,
        createdBy: userId,
      },
    });

    if (nextFollowUpDate) {
      await prisma.customer.update({
        where: { id },
        data: {
          followUpDate: new Date(nextFollowUpDate),
        },
      });
    }

    return sendSuccess(res, 'Follow-up logged successfully', followUp, 201);
  } catch (error) {
    console.error('addFollowUp error:', error);
    return sendError(res, 'Failed to record follow-up', 500);
  }
};