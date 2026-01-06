import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get all discounts applicable to a product
export const getApplicableDiscounts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Get product with category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const now = new Date();

    // Get all applicable discounts
    const discounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          // Universal discounts (no category, no specific products)
          {
            AND: [
              { categoryId: null },
              { applicableProducts: { isEmpty: true } },
            ],
          },
          // Category-specific
          {
            categoryId: product.categoryId,
          },
          // Product-specific
          {
            applicableProducts: { has: productId },
          },
        ],
        // Date filter
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sort by priority and value
    const sorted = discounts.sort((a, b) => {
      // Product-specific first (highest priority)
      const aIsProductSpecific = a.applicableProducts.includes(productId);
      const bIsProductSpecific = b.applicableProducts.includes(productId);
      
      if (aIsProductSpecific && !bIsProductSpecific) return -1;
      if (!aIsProductSpecific && bIsProductSpecific) return 1;
      
      // Then category-specific
      const aIsCategorySpecific = a.categoryId !== null;
      const bIsCategorySpecific = b.categoryId !== null;
      
      if (aIsCategorySpecific && !bIsCategorySpecific) return -1;
      if (!aIsCategorySpecific && bIsCategorySpecific) return 1;
      
      // Then by value (higher discount first)
      const aValue = parseFloat(a.value.toString());
      const bValue = parseFloat(b.value.toString());
      
      // For percentage, compare directly
      if (a.type === 'PERCENTAGE' && b.type === 'PERCENTAGE') {
        return bValue - aValue;
      }
      
      // For fixed amount, compare directly
      if (a.type === 'FIXED_AMOUNT' && b.type === 'FIXED_AMOUNT') {
        return bValue - aValue;
      }
      
      // Mixed types, percentage usually better for high-value items
      // This is simplified, in reality you'd calculate based on product price
      return 0;
    });

    res.json({
      success: true,
      data: sorted,
      count: sorted.length,
    });
  } catch (error) {
    console.error('Get applicable discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applicable discounts',
    });
  }
};

// Calculate best discount for a product
export const getBestDiscount = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { price } = req.query;

    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Price is required',
      });
    }

    const productPrice = parseFloat(price as string);

    // Use the getApplicableDiscounts logic
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const now = new Date();

    const discounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { categoryId: null },
              { applicableProducts: { isEmpty: true } },
            ],
          },
          { categoryId: product.categoryId },
          { applicableProducts: { has: productId } },
        ],
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
    });

    // Calculate discount amounts and find best
    let bestDiscount = null;
    let bestDiscountAmount = 0;

    for (const discount of discounts) {
      let discountAmount = 0;
      
      if (discount.type === 'PERCENTAGE') {
        discountAmount = (productPrice * parseFloat(discount.value.toString())) / 100;
      } else {
        discountAmount = parseFloat(discount.value.toString());
      }

      // Check minimum purchase
      if (discount.minPurchase && productPrice < parseFloat(discount.minPurchase.toString())) {
        continue;
      }

      if (discountAmount > bestDiscountAmount) {
        bestDiscountAmount = discountAmount;
        bestDiscount = discount;
      }
    }

    if (!bestDiscount) {
      return res.json({
        success: true,
        data: null,
        message: 'No applicable discount found',
      });
    }

    res.json({
      success: true,
      data: {
        discount: bestDiscount,
        discountAmount: bestDiscountAmount,
        originalPrice: productPrice,
        finalPrice: productPrice - bestDiscountAmount,
      },
    });
  } catch (error) {
    console.error('Get best discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate best discount',
    });
  }
};
