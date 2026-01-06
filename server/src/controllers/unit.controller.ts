import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all units
export const getUnits = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const units = await prisma.unit.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      orderBy: { qty: 'asc' },
    });

    res.json({ success: true, data: units });
  } catch (error: any) {
    console.error('Error fetching units:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single unit
export const getUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    res.json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create unit
export const createUnit = async (req: Request, res: Response) => {
  try {
    const { name, label, qty } = req.body;

    if (!name || !label || !qty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, label, and qty are required' 
      });
    }

    // Check if name already exists
    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unit with this name already exists' 
      });
    }

    const unit = await prisma.unit.create({
      data: {
        name: name.toLowerCase(),
        label,
        qty: parseInt(qty),
      },
    });

    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update unit
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, label, qty, isActive } = req.body;

    const unit = await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.toLowerCase() }),
        ...(label && { label }),
        ...(qty && { qty: parseInt(qty) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error updating unit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete unit
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Unit deactivated' });
  } catch (error: any) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed default units
export const seedUnits = async (req: Request, res: Response) => {
  try {
    const defaultUnits = [
      { name: 'pcs', label: 'Satuan (pcs)', qty: 1 },
      { name: 'lusin', label: 'Lusin', qty: 12 },
      { name: 'kodi', label: 'Kodi', qty: 20 },
      { name: 'dus', label: 'Dus', qty: 1 }, // qty=1 means custom per product
      { name: 'pack', label: 'Pack', qty: 6 },
      { name: 'karton', label: 'Karton', qty: 24 },
    ];

    for (const unit of defaultUnits) {
      await prisma.unit.upsert({
        where: { name: unit.name },
        update: {},
        create: unit,
      });
    }

    const units = await prisma.unit.findMany({ orderBy: { qty: 'asc' } });
    res.json({ success: true, message: 'Default units seeded', data: units });
  } catch (error: any) {
    console.error('Error seeding units:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
