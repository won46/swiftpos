import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Create purchase order
export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, notes } = req.body;
    const userId = req.user!.id;

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(lastPO ? parseInt(lastPO.poNumber.split('-')[1]) + 1 : 1).padStart(4, '0')}`;

    // Calculate total
    let totalAmount = 0;
    const purchaseItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      };
    });

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        totalAmount,
        notes,
        createdBy: userId,
        items: {
          create: purchaseItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
    });
  }
};

// Get all purchase orders
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, supplierId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: purchaseOrders,
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
    });
  }
};

// Get purchase order by ID
export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
            email: true,
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

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
    });
  }
};

// Receive goods (update stock)
export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poId = parseInt(id);

    // Get purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    if (purchaseOrder.status === 'RECEIVED') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order already received',
      });
    }

    // Update stock for all items
    for (const item of purchaseOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update PO status
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPO,
      message: 'Goods received successfully. Stock updated.',
    });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order',
    });
  }
};

// Cancel purchase order
export const cancelPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    if (purchaseOrder.status === 'RECEIVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel received purchase order',
      });
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPO,
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
    });
  }
};
