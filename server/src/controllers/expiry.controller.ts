import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate expiry status
export enum ExpiryStatus {
  EXPIRED = 'expired',
  URGENT = 'urgent',      // <= 7 days
  WARNING = 'warning',    // <= 30 days
  NORMAL = 'normal',      // > 30 days
  NO_EXPIRY = 'no_expiry'
}

function getExpiryStatus(expiryDate: Date | null, alertDays: number = 30): ExpiryStatus {
  if (!expiryDate) return ExpiryStatus.NO_EXPIRY;
  
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 0) return ExpiryStatus.EXPIRED;
  if (daysUntilExpiry <= 7) return ExpiryStatus.URGENT;
  if (daysUntilExpiry <= alertDays) return ExpiryStatus.WARNING;
  return ExpiryStatus.NORMAL;
}

// Get all expired products
export const getExpiredProducts = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const expiredProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          lt: now,
        },
        isActive: true,
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    // Add expiry status to each product
    const productsWithStatus = expiredProducts.map(product => ({
      ...product,
      expiryStatus: getExpiryStatus(product.expiryDate, product.expiryAlertDays || 30),
      daysUntilExpiry: product.expiryDate 
        ? Math.floor((new Date(product.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    res.json({
      success: true,
      data: productsWithStatus,
      count: productsWithStatus.length,
    });
  } catch (error) {
    console.error('Get expired products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expired products',
    });
  }
};

// Get products near expiry
export const getNearExpiryProducts = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const nearExpiryProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: futureDate,
        },
        isActive: true,
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    // Add expiry status to each product
    const productsWithStatus = nearExpiryProducts.map(product => ({
      ...product,
      expiryStatus: getExpiryStatus(product.expiryDate, product.expiryAlertDays || 30),
      daysUntilExpiry: product.expiryDate 
        ? Math.floor((new Date(product.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    res.json({
      success: true,
      data: productsWithStatus,
      count: productsWithStatus.length,
      filterDays: days,
    });
  } catch (error) {
    console.error('Get near-expiry products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch near-expiry products',
    });
  }
};

// Get expiry summary stats
export const getExpirySummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Count expired products
    const expiredCount = await prisma.product.count({
      where: {
        expiryDate: { lt: now },
        isActive: true,
      },
    });

    // Count products expiring in 7 days
    const urgentCount = await prisma.product.count({
      where: {
        expiryDate: {
          gte: now,
          lte: in7Days,
        },
        isActive: true,
      },
    });

    // Count products expiring in 30 days
    const warningCount = await prisma.product.count({
      where: {
        expiryDate: {
          gte: now,
          lte: in30Days,
        },
        isActive: true,
      },
    });

    // Get value of expired products
    const expiredProducts = await prisma.product.findMany({
      where: {
        expiryDate: { lt: now },
        isActive: true,
      },
      select: {
        costPrice: true,
        stockQuantity: true,
      },
    });

    const expiredValue = expiredProducts.reduce((total, product) => {
      return total + (Number(product.costPrice) * product.stockQuantity);
    }, 0);

    res.json({
      success: true,
      data: {
        expired: expiredCount,
        urgent: urgentCount,      // <= 7 days
        warning: warningCount,     // <= 30 days
        expiredValue,
      },
    });
  } catch (error) {
    console.error('Get expiry summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry summary',
    });
  }
};

// Mark product as disposed (due to expiry)
export const disposeExpiredProduct = async (req: Request, res: Response) => {
  try {
    const { productId, reason, quantity } = req.body;

    if (!productId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and reason are required',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const disposalQuantity = quantity || product.stockQuantity;

    // Create stock adjustment for disposal
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId,
        previousQuantity: product.stockQuantity,
        newQuantity: product.stockQuantity - disposalQuantity,
        adjustmentQuantity: -disposalQuantity,
        reason: `EXPIRED: ${reason}`,
        userId: (req as any).user.id, // From auth middleware
      },
    });

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: product.stockQuantity - disposalQuantity,
      },
    });

    res.json({
      success: true,
      data: adjustment,
      message: 'Product marked as disposed successfully',
    });
  } catch (error) {
    console.error('Dispose product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispose product',
    });
  }
};
