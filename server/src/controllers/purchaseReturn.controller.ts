import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate return number
const generateReturnNumber = async (): Promise<string> => {
  const lastReturn = await prisma.purchaseReturn.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { returnNumber: true },
  });

  if (!lastReturn) {
    return 'PRTN-001';
  }

  const lastNumber = parseInt(lastReturn.returnNumber.split('-')[1]);
  const newNumber = lastNumber + 1;
  return `PRTN-${newNumber.toString().padStart(3, '0')}`;
};

// Get all purchase returns
export const getAllPurchaseReturns = async (req: Request, res: Response) => {
  try {
    const { supplierId, startDate, endDate } = req.query;

    const where: any = {};
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (startDate || endDate) {
      where.returnDate = {};
      if (startDate) where.returnDate.gte = new Date(startDate as string);
      if (endDate) where.returnDate.lte = new Date(endDate as string);
    }

    const returns = await prisma.purchaseReturn.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
          },
        },
        supplier: {
          select: {
            name: true,
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
    console.error('Get purchase returns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase returns',
    });
  }
};

// Get purchase return by ID
export const getPurchaseReturnById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        purchaseOrder: true,
        supplier: true,
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

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found',
      });
    }

    res.json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    console.error('Get purchase return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase return',
    });
  }
};

// Get returns by purchase order
export const getReturnsByPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId } = req.params;

    const returns = await prisma.purchaseReturn.findMany({
      where: { purchaseOrderId: parseInt(purchaseOrderId) },
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
    console.error('Get returns by PO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch returns',
    });
  }
};

// Create purchase return
export const createPurchaseReturn = async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId, items, reason, notes } = req.body;
    const userId = (req as any).user.id;

    // Validate purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(purchaseOrderId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    // Validate items
    for (const item of items) {
      const poItem = purchaseOrder.items.find((poi) => poi.productId === item.productId);
      
      if (!poItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found in purchase order`,
        });
      }

      // Check quantity
      if (item.quantity > poItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity for ${poItem.product.name} exceeds ordered quantity`,
        });
      }
    }

    // Calculate return amount
    let returnAmount = 0;
    const returnItems = items.map((item: any) => {
      const poItem = purchaseOrder.items.find((poi) => poi.productId === item.productId);
      const subtotal = parseFloat(poItem!.unitPrice.toString()) * item.quantity;
      returnAmount += subtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: poItem!.unitPrice,
        subtotal,
        reason: item.reason,
        condition: item.condition || 'DAMAGED',
      };
    });

    // Generate return number
    const returnNumber = await generateReturnNumber();

    // Create return and update stock immediately
    const purchaseReturn = await prisma.purchaseReturn.create({
      data: {
        returnNumber,
        purchaseOrderId: parseInt(purchaseOrderId),
        supplierId: purchaseOrder.supplierId,
        reason,
        notes,
        returnAmount,
        refundReceived: false,
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

    // Update stock immediately (reduce quantity)
    for (const item of purchaseReturn.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
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
          previousQuantity: product!.stockQuantity + item.quantity,
          newQuantity: product!.stockQuantity,
          adjustmentQuantity: -item.quantity,
          reason: `Purchase Return: ${returnNumber}`,
          userId,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: purchaseReturn,
      message: 'Purchase return created successfully',
    });
  } catch (error) {
    console.error('Create purchase return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase return',
    });
  }
};

// Mark refund as received
export const markRefundReceived = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { refundDate } = req.body;

    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
    });

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found',
      });
    }

    const updatedReturn = await prisma.purchaseReturn.update({
      where: { id },
      data: {
        refundReceived: true,
        refundDate: refundDate ? new Date(refundDate) : new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedReturn,
      message: 'Refund marked as received',
    });
  } catch (error) {
    console.error('Mark refund received error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update refund status',
    });
  }
};

// Delete purchase return
export const deletePurchaseReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found',
      });
    }

    // Reverse stock
    for (const item of purchaseReturn.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete return
    await prisma.purchaseReturn.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Purchase return deleted successfully',
    });
  } catch (error) {
    console.error('Delete purchase return error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase return',
    });
  }
};
