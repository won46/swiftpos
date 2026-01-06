import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all suppliers
export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch suppliers',
    });
  }
};

// Get single supplier
export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stockQuantity: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch supplier',
    });
  }
};

// Create supplier
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create supplier',
    });
  }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactPerson,
        email: email || null,
        phone: phone || null,
        address: address || null,
        isActive,
      },
    });

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update supplier',
    });
  }
};

// Delete supplier
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier has products
    const productsCount = await prisma.product.count({
      where: { supplierId: id },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${productsCount} associated products`,
      });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete supplier',
    });
  }
};
