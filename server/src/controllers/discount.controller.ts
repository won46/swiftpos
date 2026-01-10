import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all discounts
export const getAllDiscounts = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const discounts = await prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discounts',
    });
  }
};

// Get discount by ID
export const getDiscountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discount',
    });
  }
};

// Get discount by code
export const getDiscountByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    if (!discount.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not active',
      });
    }

    // Check if discount is expired
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Discount has not started yet',
      });
    }

    if (discount.endDate && now > discount.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Discount has expired',
      });
    }

    res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    console.error('Get discount by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discount',
    });
  }
};

// Create discount
export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { 
      code, name, description, type, value, minPurchase, startDate, endDate, isActive,
      categoryId, applicableProducts, applicableUnit 
    } = req.body;

    // Validate required fields
    if (!code || !name || !type || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, type, and value are required',
      });
    }

    // Validate type
    if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be PERCENTAGE or FIXED_AMOUNT',
      });
    }

    // Validate percentage value
    if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage value must be between 0 and 100',
      });
    }

    // Check if code already exists
    const existingDiscount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists',
      });
    }

    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        minPurchase: minPurchase ? Number(minPurchase) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        applicableProducts: applicableProducts || [],
        isActive: isActive !== undefined ? isActive : true,
        applicableUnit,
      },
    });

    res.status(201).json({
      success: true,
      data: discount,
      message: 'Discount created successfully',
    });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discount',
    });
  }
};

// Update discount
export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      code, name, description, type, value, minPurchase, startDate, endDate, isActive,
      categoryId, applicableProducts, applicableUnit 
    } = req.body;

    // Check if discount exists
    const existingDiscount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    // If code is being changed, check if new code already exists
    if (code && code.toUpperCase() !== existingDiscount.code) {
      const codeExists = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Discount code already exists',
        });
      }
    }

    // Validate type if provided
    if (type && !['PERCENTAGE', 'FIXED_AMOUNT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be PERCENTAGE or FIXED_AMOUNT',
      });
    }

    // Validate percentage value if type is PERCENTAGE
    if ((type === 'PERCENTAGE' || (!type && existingDiscount.type === 'PERCENTAGE')) && value !== undefined) {
      if (value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage value must be between 0 and 100',
        });
      }
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase ? Number(minPurchase) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? Number(categoryId) : null;
    if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts;
    if (applicableUnit !== undefined) updateData.applicableUnit = applicableUnit;

    const discount = await prisma.discount.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: discount,
      message: 'Discount updated successfully',
    });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update discount',
    });
  }
};

// Delete discount (soft delete)
export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found',
      });
    }

    // Soft delete by setting isActive to false
    await prisma.discount.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete discount',
    });
  }
};

// Validate discount
export const validateDiscount = async (req: Request, res: Response) => {
  try {
    const { code, amount } = req.body;

    if (!code || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Code and amount are required',
      });
    }

    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code',
      });
    }

    if (!discount.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not active',
      });
    }

    // Check date validity
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Discount has not started yet',
      });
    }

    if (discount.endDate && now > discount.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Discount has expired',
      });
    }

    // Check minimum purchase
    if (discount.minPurchase && amount < parseFloat(discount.minPurchase.toString())) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of Rp ${Number(discount.minPurchase).toLocaleString('id-ID')} is required`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (amount * parseFloat(discount.value.toString())) / 100;
    } else {
      discountAmount = parseFloat(discount.value.toString());
    }

    res.json({
      success: true,
      data: {
        discount,
        discountAmount,
        finalAmount: amount - discountAmount,
      },
      message: 'Discount is valid',
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate discount',
    });
  }
};
