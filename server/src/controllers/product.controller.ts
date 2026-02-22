import { Request, Response } from 'express';
import prisma from '../config/database';
import { io } from '../index';
import { generateBarcode } from '../utils/barcode';

// Get all products with filtering
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = parseInt(category as string);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      name, sku, price, stockQuantity, categoryId, purchaseUnit, size, color, barcode
    } = req.body;

    // Validate required fields
    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan Kategori wajib diisi',
      });
    }

    // Generate SKU if not provided
    const finalSku = sku || `SKU-${Date.now()}`;

    // Check if SKU exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: finalSku },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists',
      });
    }

    if (Number(categoryId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category ID',
      });
    }


    // Generate Barcode if not provided
    let finalBarcode = barcode;
    if (!finalBarcode) {
      finalBarcode = await generateBarcode();
    } else {
        // Check if provided barcode exists
        const existingBarcode = await prisma.product.findUnique({
            where: { barcode: finalBarcode },
        });
        if (existingBarcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode already exists',
            });
        }
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        sku: finalSku,
        barcode: finalBarcode,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Emit real-time update
    io.emit('product:created', product);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle Prisma Unique Constraint Violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'Field';
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Handle Prisma Foreign Key Violation (e.g., invalid categoryId)
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Supplier ID',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Emit real-time update
    io.emit('product:updated', product);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Emit real-time update
    io.emit('product:deleted', { id });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT * FROM products 
      WHERE stock_quantity <= low_stock_threshold 
      AND is_active = true
      ORDER BY stock_quantity ASC
    `;

    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch low stock products',
    });
  }
};

// Get product by barcode
export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    const product = await prisma.product.findFirst({
      where: { 
        barcode: barcode,
        isActive: true, // Only return active products
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product by barcode',
    });
  }
};

// Adjust product stock (add or subtract)
export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustmentQuantity, reason } = req.body;

    if (adjustmentQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment quantity is required',
      });
    }

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Calculate new stock
    const newStock = currentProduct.stockQuantity + adjustmentQuantity;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative',
      });
    }

    // Update product stock
    const product = await prisma.product.update({
      where: { id },
      data: { stockQuantity: newStock },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Emit real-time update
    io.emit('product:stockUpdated', {
      id: product.id,
      name: product.name,
      oldStock: currentProduct.stockQuantity,
      newStock: product.stockQuantity,
      adjustment: adjustmentQuantity,
      reason: reason || 'Stock adjustment',
    });

    res.json({
      success: true,
      data: product,
      message: `Stock updated: ${currentProduct.stockQuantity} → ${product.stockQuantity}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust stock',
    });
  }
};
