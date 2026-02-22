
import { Request, Response } from 'express';
import prisma from '../config/database';
import { parseStockExcel } from '../utils/excelImport';
import { io } from '../index';
import { generateBarcode } from '../utils/barcode';

export const resetDatabase = async (req: Request, res: Response) => {
  try {
    console.log('⚠️ Starting Database Reset...');
    
    // Delete in order to respect foreign keys
    await prisma.transactionItem.deleteMany({});
    // await prisma.transactionPayment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.salesReturnItem.deleteMany({});
    await prisma.salesReturn.deleteMany({});
    await prisma.transaction.deleteMany({});
    
    await prisma.stockAdjustment.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseReturnItem.deleteMany({});
    await prisma.purchaseReturn.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    
    // Delete Products and Categories
    await prisma.product.deleteMany({});
    // We might want to keep some default categories, but user asked for "reset"
    // To be safe, let's delete categories too, they will be re-imported
    await prisma.category.deleteMany({});
    
    // We keep Users, Roles, Suppliers, Units, Customers for now unless specified otherwise
    
    console.log('✅ Database Reset Complete');
    
    res.json({
      success: true,
      message: 'Database has been reset successfully. Products, categories, and transactions are cleared.',
    });
  } catch (error: any) {
    console.error('Reset Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset database',
    });
  }
};

export const importFromExcel = async (req: Request, res: Response) => {
  try {
    console.log('📥 Starting Excel Import...');
    
    const parsedData = parseStockExcel();
    console.log(`Found ${parsedData.length} items to import.`);
    
    if (parsedData.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No data found in Excel file',
        });
    }

    const stats = {
        categoriesCreated: 0,
        productsCreated: 0,
        errors: 0
    };
    
    // 1. Process Categories first to minimize DB calls
    // Get unique category names
    const uniqueCategories = Array.from(new Set(parsedData.map(d => d.categoryName)));
    
    const categoryMap: Record<string, number> = {};
    
    for (const catName of uniqueCategories) {
        const slug = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const category = await prisma.category.upsert({
            where: { slug },
            update: {},
            create: {
                name: catName,
                slug,
            }
        });
        categoryMap[catName] = category.id;
        stats.categoriesCreated++;
    }
    
    console.log(`Processed ${uniqueCategories.length} categories.`);
    
    // 2. Process Products
    for (const item of parsedData) {
        try {
            // Generate SKU: NAME-SIZE-COLOR (e.g., ASRI-014-PEACH-S)
            // Remove spaces from name for SKU
            const cleanName = item.productName.replace(/\s+/g, '-').toUpperCase();
            const cleanColor = item.color ? item.color.replace(/\s+/g, '-').toUpperCase() : '';
            const sku = cleanColor 
                ? `${cleanName}-${cleanColor}-${item.size}`.toUpperCase() 
                : `${cleanName}-${item.size}`.toUpperCase();
            
            // Check if product exists to decide on barcode
            const existing = await prisma.product.findUnique({ where: { sku } });
            let barcode = existing?.barcode;

            if (!barcode) {
                barcode = await generateBarcode();
            }

            await prisma.product.upsert({
                where: { sku },
                update: {
                     price: item.price,
                     stockQuantity: item.stock,
                     categoryId: categoryMap[item.categoryName],
                     size: item.size,
                     color: item.color
                },
                create: {
                    name: item.productName,
                    sku: sku,
                    size: item.size,
                    color: item.color,
                    price: item.price,
                    costPrice: item.price * 0.8, // Estimate cost
                    stockQuantity: item.stock,
                    lowStockThreshold: 5,
                    categoryId: categoryMap[item.categoryName],
                    isActive: true,
                    barcode: barcode
                }
            });
            stats.productsCreated++;
        } catch (err) {
            console.error(`Failed to import product ${item.productName}:`, err);
            stats.errors++;
        }
    }
    
    // Emit event so frontend can refresh if needed
    io.emit('data:imported', stats);

    res.json({
      success: true,
      message: `Import complete. Created/Updated ${stats.productsCreated} products in ${stats.categoriesCreated} categories.`,
      data: stats
    });
    
  } catch (error: any) {
    console.error('Import Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import from Excel',
    });
  }
};

export const generateBarcodesForExisting = async (req: Request, res: Response) => {
    try {
        const productsWithoutBarcode = await prisma.product.findMany({
            where: {
                OR: [
                    { barcode: null },
                    { barcode: '' }
                ]
            }
        });

        let updatedCount = 0;

        for (const product of productsWithoutBarcode) {
            const newBarcode = await generateBarcode();
            await prisma.product.update({
                where: { id: product.id },
                data: { barcode: newBarcode }
            });
            updatedCount++;
        }

        res.json({
            success: true,
            message: `Successfully generated barcodes for ${updatedCount} products.`,
            data: { updatedCount }
        });

    } catch (error: any) {
        console.error('Generate Barcodes Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate barcodes',
        });
    }
};
