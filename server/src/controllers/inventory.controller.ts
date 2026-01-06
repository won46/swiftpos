import { Request, Response } from 'express';
import prisma from '../config/database';

// Get inventory report with stock in/out movements
export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    // Get all products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    // Get stock adjustments (stock in from quick receive)
    const stockAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get completed transactions (stock out from sales)
    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: 'COMPLETED',
          transactionDate: {
            gte: start,
            lte: end,
          },
        },
      },
    });

    // Get received purchase order items (stock in from PO)
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          status: 'RECEIVED',
          receivedAt: {
            gte: start,
            lte: end,
          },
        },
      },
    });

    // Build report data
    const reportData = products.map(product => {
      // Calculate stock in from adjustments (positive values)
      const stockInFromAdjustments = stockAdjustments
        .filter(adj => adj.productId === product.id && adj.adjustmentQuantity > 0)
        .reduce((sum, adj) => sum + adj.adjustmentQuantity, 0);

      // Calculate stock in from PO
      const stockInFromPO = poItems
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      // Calculate stock out from sales
      const stockOut = transactionItems
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      // Calculate stock out from negative adjustments
      const stockOutFromAdjustments = stockAdjustments
        .filter(adj => adj.productId === product.id && adj.adjustmentQuantity < 0)
        .reduce((sum, adj) => sum + Math.abs(adj.adjustmentQuantity), 0);

      const totalStockIn = stockInFromAdjustments + stockInFromPO;
      const totalStockOut = stockOut + stockOutFromAdjustments;

      // Beginning stock = current stock - in + out
      const beginningStock = product.stockQuantity - totalStockIn + totalStockOut;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category?.name || '-',
        beginningStock,
        stockIn: totalStockIn,
        stockInDetails: {
          fromAdjustments: stockInFromAdjustments,
          fromPO: stockInFromPO,
        },
        stockOut: totalStockOut,
        stockOutDetails: {
          fromSales: stockOut,
          fromAdjustments: stockOutFromAdjustments,
        },
        endingStock: product.stockQuantity,
      };
    });

    // Filter out products with no movement if needed
    const reportWithMovement = reportData.filter(
      item => item.stockIn > 0 || item.stockOut > 0 || item.endingStock > 0
    );

    // Calculate summary totals
    const summary = {
      totalProducts: reportWithMovement.length,
      totalStockIn: reportWithMovement.reduce((sum, item) => sum + item.stockIn, 0),
      totalStockOut: reportWithMovement.reduce((sum, item) => sum + item.stockOut, 0),
      totalEndingStock: reportWithMovement.reduce((sum, item) => sum + item.endingStock, 0),
    };

    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        summary,
        items: reportWithMovement,
      },
    });
  } catch (error: any) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate inventory report',
    });
  }
};
