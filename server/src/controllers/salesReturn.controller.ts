import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate return number
const generateReturnNumber = async (): Promise<string> => {
  const lastReturn = await prisma.salesReturn.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { returnNumber: true },
  });

  if (!lastReturn) {
    return 'RTN-001';
  }

  const lastNumber = parseInt(lastReturn.returnNumber.split('-')[1]);
  const newNumber = lastNumber + 1;
  return `RTN-${newNumber.toString().padStart(3, '0')}`;
};

// Get all sales returns
export const getAllSalesReturns = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.returnDate = {};
      if (startDate) where.returnDate.gte = new Date(startDate as string);
      if (endDate) where.returnDate.lte = new Date(endDate as string);
    }

    const returns = await prisma.salesReturn.findMany({
      where,
      include: {
        transaction: {
          select: {
            invoiceNumber: true,
            customerName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error('Get sales returns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales returns',
    });
  }
};

// Get sales return by ID
export const getSalesReturnById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id },
      include: {
        transaction: true,
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: 'Sales return not found',
      });
    }

    res.json({
      success: true,
      data: salesReturn,
    });
  } catch (error) {
    console.error('Get sales return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales return',
    });
  }
};

// Get returns by transaction
export const getReturnsByTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const returns = await prisma.salesReturn.findMany({
      where: { transactionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error('Get returns by transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch returns',
    });
  }
};

// Create sales return
export const createSalesReturn = async (req: Request, res: Response) => {
  try {
    const { transactionId, items, reason, notes, refundMethod } = req.body;
    const userId = (req as any).user.id;

    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Validate items
    for (const item of items) {
      const transactionItem = transaction.items.find((ti) => ti.productId === item.productId);
      
      if (!transactionItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found in transaction`,
        });
      }

      // Check if product is returnable
      if (!transactionItem.product.isReturnable) {
        return res.status(400).json({
          success: false,
          message: `Product ${transactionItem.product.name} is not returnable`,
        });
      }

      // Check quantity
      if (item.quantity > transactionItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity for ${transactionItem.product.name} exceeds purchased quantity`,
        });
      }
    }

    // Calculate refund amount
    let refundAmount = 0;
    const returnItems = items.map((item: any) => {
      const transactionItem = transaction.items.find((ti) => ti.productId === item.productId);
      const subtotal = parseFloat(transactionItem!.price.toString()) * item.quantity;
      refundAmount += subtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: transactionItem!.price,
        subtotal,
        reason: item.reason,
        condition: item.condition || 'OPENED',
      };
    });

    // Generate return number
    const returnNumber = await generateReturnNumber();

    // Create return (automatically approved, no approval needed)
    const salesReturn = await prisma.salesReturn.create({
      data: {
        returnNumber,
        transactionId,
        reason,
        notes,
        refundAmount,
        refundMethod: refundMethod || 'CASH',
        status: 'APPROVED',
        userId,
        items: {
          create: returnItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update stock immediately (since no approval needed)
    for (const item of salesReturn.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });

      // Create stock adjustment
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      await prisma.stockAdjustment.create({
        data: {
          productId: item.productId,
          previousQuantity: product!.stockQuantity - item.quantity,
          newQuantity: product!.stockQuantity,
          adjustmentQuantity: item.quantity,
          reason: `Sales Return: ${returnNumber}`,
          userId,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: salesReturn,
      message: 'Sales return created successfully',
    });
  } catch (error) {
    console.error('Create sales return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales return',
    });
  }
};

// Complete sales return (process refund)
export const completeSalesReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id },
    });

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: 'Sales return not found',
      });
    }

    if (salesReturn.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Return already completed',
      });
    }

    // Update status to completed
    const updatedReturn = await prisma.salesReturn.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedReturn,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Complete sales return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete sales return',
    });
  }
};

// Delete sales return
export const deleteSalesReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: 'Sales return not found',
      });
    }

    // Reverse stock if needed
    if (salesReturn.status === 'APPROVED' || salesReturn.status === 'COMPLETED') {
      for (const item of salesReturn.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Delete return (cascade will delete items)
    await prisma.salesReturn.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Sales return deleted successfully',
    });
  } catch (error) {
    console.error('Delete sales return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales return',
    });
  }
};
