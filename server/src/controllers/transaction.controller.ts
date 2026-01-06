import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../index';

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV${year}${month}${day}${random}`;
}

// Create transaction
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount,
      paymentMethod,
      dueDate,
    } = req.body;

    const userId = req.user!.id;
    const invoiceNumber = generateInvoiceNumber();
    
    // Default values for Debt
    let paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
    let remainingAmount = 0;
    
    // Handle Debt Logic
    if (paymentMethod === 'DEBT') {
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer is required for debt transaction (Kasbon)',
        });
      }

      // Calculate remaining amount
      const paid = Number(paidAmount) || 0;
      remainingAmount = Number(totalAmount) - paid;
      
      if (remainingAmount <= 0) {
        paymentStatus = 'PAID';
      } else if (paid > 0) {
        paymentStatus = 'PARTIAL';
      } else {
        paymentStatus = 'UNPAID';
      }
    }

    const changeAmount = (paymentMethod !== 'DEBT') 
      ? (paidAmount ? Number(paidAmount) - Number(totalAmount) : 0) 
      : 0;

    // Start transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          userId,
          customerId: customerId || null,
          customerName: customerName || null,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          paidAmount: paidAmount || 0,
          remainingAmount,
          changeAmount: changeAmount > 0 ? changeAmount : 0,
          paymentMethod,
          paymentStatus,
          status: 'COMPLETED',
          transactionDate: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      // 2. Create transaction items
      for (const item of items) {
        await tx.transactionItem.create({
          data: {
            transactionId: newTransaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
      
      // 3. Update Customer Current Debt if this is a Debt transaction
      if (paymentMethod === 'DEBT' && customerId && remainingAmount > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            currentDebt: {
              increment: remainingAmount,
            },
          },
        });
      }

      return newTransaction;
    });

    // Fetch complete transaction with items
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
          },
        },
      },
    });

    // Emit real-time update
    io.emit('transaction:created', completeTransaction);

    res.status(201).json({
      success: true,
      data: completeTransaction,
      message: 'Transaction created successfully',
    });
  } catch (error: any) {
    console.error('Transaction creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction',
    });
  }
};

// Repay Debt Endpoint
export const repayDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Transaction ID
    const { amount, paymentMethod, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const repayAmount = Number(amount);

    // 1. Check Transaction existence and status
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (Number(transaction.remainingAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Transaction is already fully paid' });
    }

    if (repayAmount > Number(transaction.remainingAmount)) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds remaining debt' });
    }

    // Start DB Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2. Create DebtPayment Record
      await tx.debtPayment.create({
        data: {
          transactionId: id,
          amount: repayAmount,
          paymentMethod: paymentMethod || 'CASH',
          notes,
          paymentDate: new Date(),
        }
      });

      // 3. Update Transaction (Remaining Amount & Status)
      const newRemaining = Number(transaction.remainingAmount) - repayAmount;
      const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          remainingAmount: newRemaining,
          paymentStatus: newStatus,
          // Update paidAmount logic: previous paid + new repay
          paidAmount: {
             increment: repayAmount
          }
        }
      });

      // 4. Update Customer Total Debt
      if (transaction.customerId) {
        await tx.customer.update({
          where: { id: transaction.customerId },
          data: {
            currentDebt: {
              decrement: repayAmount
            }
          }
        });
      }
      
      return updatedTransaction;
    });

    res.json({
      success: true,
      data: result,
      message: 'Debt payment successful'
    });

  } catch (error: any) {
    console.error('Repay debt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process debt repayment',
    });
  }
};

// Get all transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions',
    });
  }
};

// Get single transaction
export const getTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
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

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction',
    });
  }
};

// Get today's statistics
export const getTodayStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      include: {
        items: true,
      },
    });

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + Number(t.totalAmount),
      0
    );

    const totalTransactions = transactions.length;

    const totalItems = transactions.reduce(
      (sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        totalItems,
        date: today.toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch today stats',
    });
  }
};
