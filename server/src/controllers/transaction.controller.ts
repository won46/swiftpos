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
      payments, // Array of { method: string, amount: number, notes?: string }
    } = req.body;

    const userId = req.user!.id;
    console.log(`[CreateTransaction] Processing for User ID: ${userId}`);
    console.log(`[CreateTransaction] Payload:`, { paymentMethod, totalAmount, payments });
    const invoiceNumber = generateInvoiceNumber();
    
    // Default values
    let paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
    let remainingAmount = 0;
    
    // Calculate total paid and remaining based on method
    let totalPaid = 0;

    if (paymentMethod === 'SPLIT') {
      // For SPLIT, sum up all payments
      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Payments array is required for SPLIT payment method',
        });
      }
      totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    } else {
      // For Single Payment (CASH, CARD, QRIS, DEBT)
      totalPaid = Number(paidAmount) || 0;
    }

    // Logic for remaining amount
    if (paymentMethod === 'DEBT') {
        // Full debt or partial debt (logic handled by frontend usually sending paidAmount < total)
        remainingAmount = Number(totalAmount) - totalPaid;
    } else if (paymentMethod === 'SPLIT') {
        remainingAmount = Number(totalAmount) - totalPaid;
    } else {
        // Standard payment (CASH, QRIS, CARD) - usually full payment
        // But if paidAmount < total (and not DEBT), technically it's partial, but standard POS usually treats standard methods as full or 'change returned'
        remainingAmount = Math.max(0, Number(totalAmount) - totalPaid);
    }

    // Determine status
    if (remainingAmount <= 0) {
      paymentStatus = 'PAID';
      remainingAmount = 0; // Ensure no negative remaining
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }
    
    // For DEBT validation
    if (remainingAmount > 0 && !customerId) {
       return res.status(400).json({
          success: false,
          message: 'Customer is required for transactions with remaining debt',
        });
    }

    const changeAmount = (remainingAmount === 0 && totalPaid > Number(totalAmount)) 
      ? totalPaid - Number(totalAmount) 
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
          paidAmount: totalPaid,
          remainingAmount,
          changeAmount,
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

      // 3. Record Payments
      if (paymentMethod === 'SPLIT') {
          for (const p of payments) {
             await tx.transactionPayment.create({
                data: {
                    transactionId: newTransaction.id,
                    amount: Number(p.amount),
                    paymentMethod: p.method,
                    notes: p.notes || 'Split Bill',
                    paymentDate: new Date()
                }
             });
          }
      } else if (totalPaid > 0) {
          // Record single payment (CASH, QRIS, etc)
          // For DEBT, we only record what was PAID.
           await tx.transactionPayment.create({
              data: {
                  transactionId: newTransaction.id,
                  amount: Number(totalPaid), // Only record the paid portion
                  paymentMethod: paymentMethod === 'DEBT' ? 'CASH' : paymentMethod, // If DEBT but has paidAmount, assume DP is CASH unless specified? Actually standard DEBT usually implies 0 DP or DP via Cash. Let's assume 'CASH' or rely on frontend? 
                  // Simplification: If DEBT, the initial payment is considered CASH/Down Payment. 
                  // If standard payment, it matches the method.
                  notes: 'Initial Payment',
                  paymentDate: new Date()
              }
           });
      }
      
      // 4. Update Customer Current Debt
      if (remainingAmount > 0 && customerId) {
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

// Repay Debt (Add Payment) Endpoint
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
      // 2. Create TransactionPayment Record (renamed from DebtPayment)
      await tx.transactionPayment.create({
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
      message: 'Payment added successfully'
    });

  } catch (error: any) {
    console.error('Repay debt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment',
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
