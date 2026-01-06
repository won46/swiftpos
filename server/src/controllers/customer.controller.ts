import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all customers with search and pagination support
export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // If page and limit are provided, use pagination
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.customer.count({ where }),
      ]);

      return res.json({
        success: true,
        data: customers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // Default: return list (maybe limited)
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    });
  }
};

// Get single customer details
export const getCustomerDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        transactions: {
          where: {
            status: { not: 'VOID' },
          },
          orderBy: { transactionDate: 'desc' },
          take: 10, // Preview last 10 transactions
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
    });
  }
};

// Create new customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, creditLimit } = req.body;

    // Generate simple code automatically
    const count = await prisma.customer.count();
    const code = `CUST-${String(count + 1).padStart(3, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        phone,
        email,
        address,
        creditLimit: creditLimit ? Number(creditLimit) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
    });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, creditLimit, isActive } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        isActive,
      },
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
    });
  }
};

// Delete customer (soft delete)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer has transactions
    const hasTransactions = await prisma.transaction.findFirst({
      where: { customerId: id },
    });

    if (hasTransactions) {
      // Soft delete
      await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no transactions
      await prisma.customer.delete({
        where: { id },
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
    });
  }
};
