import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../index';

// Create adjustment
export const createStockAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, newQuantity, reason } = req.body;
    const userId = req.user!.id;

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousQuantity = product.stockQuantity;
    const adjustmentQuantity = newQuantity - previousQuantity;

    // Create adjustment record
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId,
        previousQuantity,
        newQuantity,
        adjustmentQuantity,
        reason,
        userId,
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
    });

    // Emit real-time update
    io.emit('stock:adjusted', {
      productId,
      newQuantity,
      adjustment,
    });

    res.status(201).json({
      success: true,
      data: adjustment,
      message: 'Stock adjusted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust stock',
    });
  }
};

// Get adjustment history
export const getStockAdjustments = async (req: Request, res: Response) => {
  try {
    const { productId, startDate, endDate } = req.query;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: adjustments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stock adjustments',
    });
  }
};
