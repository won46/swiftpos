import { Request, Response } from 'express';
import prisma from '../config/database';

// Get sales overview
export const getSalesOverview = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
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

    const totalProfit = transactions.reduce(
      (sum, t) => sum + Number(t.totalAmount) - Number(t.subtotal),
      0
    );

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        totalItems,
        totalProfit,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales overview',
    });
  }
};

// Get sales by date (for charts)
export const getSalesByDate = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
    });

    // Group by date
    const salesByDate: Record<string, { date: string; revenue: number; transactions: number }> = {};

    transactions.forEach((t) => {
      const date = t.transactionDate.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, transactions: 0 };
      }
      salesByDate[date].revenue += Number(t.totalAmount);
      salesByDate[date].transactions += 1;
    });

    const data = Object.values(salesByDate);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales by date',
    });
  }
};

// Get top products
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const where: any = {
      transaction: {
        status: 'COMPLETED',
      },
    };

    if (startDate || endDate) {
      where.transaction.transactionDate = {};
      if (startDate) where.transaction.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transaction.transactionDate.lte = new Date(endDate as string);
    }

    const items = await prisma.transactionItem.findMany({
      where,
      include: {
        product: true,
      },
    });

    // Aggregate by product
    const productStats: Record<string, any> = {};

    items.forEach((item) => {
      const productId = item.productId;
      if (!productStats[productId]) {
        productStats[productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0,
          transactions: 0,
        };
      }
      productStats[productId].quantity += item.quantity;
      productStats[productId].revenue += Number(item.totalPrice);
      productStats[productId].transactions += 1;
    });

    const data = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, Number(limit));

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top products',
    });
  }
};

// Get sales by category
export const getSalesByCategory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      transaction: {
        status: 'COMPLETED',
      },
    };

    if (startDate || endDate) {
      where.transaction.transactionDate = {};
      if (startDate) where.transaction.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transaction.transactionDate.lte = new Date(endDate as string);
    }

    const items = await prisma.transactionItem.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Aggregate by category
    const categoryStats: Record<string, any> = {};

    items.forEach((item) => {
      const categoryId = item.product.categoryId;
      const categoryName = item.product.category?.name || 'Uncategorized';
      
      if (!categoryStats[categoryId || 'uncategorized']) {
        categoryStats[categoryId || 'uncategorized'] = {
          category: categoryName,
          quantity: 0,
          revenue: 0,
        };
      }
      categoryStats[categoryId || 'uncategorized'].quantity += item.quantity;
      categoryStats[categoryId || 'uncategorized'].revenue += Number(item.totalPrice);
    });

    const data = Object.values(categoryStats);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sales by category',
    });
  }
};

// Get payment method breakdown
export const getPaymentMethodBreakdown = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate as string);
      if (endDate) where.transactionDate.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
    });

    // Group by payment method
    const paymentStats: Record<string, { method: string; count: number; revenue: number }> = {};

    transactions.forEach((t) => {
      if (!paymentStats[t.paymentMethod]) {
        paymentStats[t.paymentMethod] = {
          method: t.paymentMethod,
          count: 0,
          revenue: 0,
        };
      }
      paymentStats[t.paymentMethod].count += 1;
      paymentStats[t.paymentMethod].revenue += Number(t.totalAmount);
    });

    const data = Object.values(paymentStats);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment method breakdown',
    });
  }
};

// Get slow moving products (least sold)
export const getSlowProducts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 10, days = 30 } = req.query;

    // Get date range (default last 30 days)
    const endDateFilter = endDate ? new Date(endDate as string) : new Date();
    const startDateFilter = startDate 
      ? new Date(startDate as string) 
      : new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Get all active products
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    // Get sold items in date range
    const soldItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: 'COMPLETED',
          transactionDate: {
            gte: startDateFilter,
            lte: endDateFilter,
          },
        },
      },
    });

    // Aggregate sold quantities
    const soldQty: Record<string, number> = {};
    soldItems.forEach((item) => {
      soldQty[item.productId] = (soldQty[item.productId] || 0) + item.quantity;
    });

    // Find slow moving products (least sold or never sold)
    const productStats = allProducts.map((product) => ({
      product,
      quantitySold: soldQty[product.id] || 0,
      stockQuantity: product.stockQuantity,
      stockValue: product.stockQuantity * Number(product.price),
    }));

    // Sort by quantity sold (ascending - least sold first)
    const data = productStats
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, Number(limit));

    res.json({
      success: true,
      data,
      meta: {
        startDate: startDateFilter.toISOString(),
        endDate: endDateFilter.toISOString(),
        totalProducts: allProducts.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch slow products',
    });
  }
};

// Get daily sales breakdown
export const getDailySales = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        transactionDate: { gte: startDate },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Group by date
    const dailyStats: Record<string, {
      date: string;
      dayName: string;
      transactions: number;
      revenue: number;
      itemsSold: number;
      averageTransaction: number;
      topProducts: Array<{ name: string; qty: number; revenue: number }>;
    }> = {};

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    transactions.forEach((t) => {
      const dateKey = t.transactionDate.toISOString().split('T')[0];
      const dayOfWeek = new Date(t.transactionDate).getDay();

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          dayName: dayNames[dayOfWeek],
          transactions: 0,
          revenue: 0,
          itemsSold: 0,
          averageTransaction: 0,
          topProducts: [],
        };
      }

      dailyStats[dateKey].transactions += 1;
      dailyStats[dateKey].revenue += Number(t.totalAmount);
      dailyStats[dateKey].itemsSold += t.items.reduce((sum, item) => sum + item.quantity, 0);

      // Track products for this day
      t.items.forEach((item) => {
        const existing = dailyStats[dateKey].topProducts.find(
          (p) => p.name === item.product.name
        );
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += Number(item.totalPrice);
        } else {
          dailyStats[dateKey].topProducts.push({
            name: item.product.name,
            qty: item.quantity,
            revenue: Number(item.totalPrice),
          });
        }
      });
    });

    // Calculate averages and sort top products
    Object.values(dailyStats).forEach((day) => {
      day.averageTransaction = day.transactions > 0 ? day.revenue / day.transactions : 0;
      day.topProducts = day.topProducts
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
    });

    // Sort by date descending
    const data = Object.values(dailyStats).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate totals
    const totals = {
      totalTransactions: data.reduce((sum, d) => sum + d.transactions, 0),
      totalRevenue: data.reduce((sum, d) => sum + d.revenue, 0),
      totalItemsSold: data.reduce((sum, d) => sum + d.itemsSold, 0),
      averageDaily: data.length > 0 ? data.reduce((sum, d) => sum + d.revenue, 0) / data.length : 0,
    };

    res.json({
      success: true,
      data,
      totals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch daily sales',
    });
  }
};

// Get product statistics dashboard
export const getProductStats = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get transaction items
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: 'COMPLETED',
          transactionDate: { gte: startDate },
        },
      },
      include: {
        product: { include: { category: true } },
      },
    });

    // Aggregate by product
    const productStats: Record<string, any> = {};

    items.forEach((item) => {
      const productId = item.productId;
      if (!productStats[productId]) {
        productStats[productId] = {
          product: item.product,
          quantitySold: 0,
          revenue: 0,
          transactions: 0,
        };
      }
      productStats[productId].quantitySold += item.quantity;
      productStats[productId].revenue += Number(item.totalPrice);
      productStats[productId].transactions += 1;
    });

    const allStats = Object.values(productStats);

    // Top 10 best sellers
    const bestSellers = [...allStats]
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Top 10 by revenue
    const topRevenue = [...allStats]
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get all products for slow movers
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    const soldQty: Record<string, number> = {};
    allStats.forEach((stat: any) => {
      soldQty[stat.product.id] = stat.quantitySold;
    });

    const slowMovers = allProducts
      .map((product) => ({
        product,
        quantitySold: soldQty[product.id] || 0,
        stockQuantity: product.stockQuantity,
      }))
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayItems = items.filter(
      (item) => new Date((item as any).transaction?.transactionDate) >= today
    );

    const todaySales = {
      itemsSold: todayItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue: todayItems.reduce((sum, item) => sum + Number(item.totalPrice), 0),
    };

    res.json({
      success: true,
      data: {
        bestSellers,
        topRevenue,
        slowMovers,
        todaySales,
        period: `${days} hari terakhir`,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product stats',
    });
  }
};
