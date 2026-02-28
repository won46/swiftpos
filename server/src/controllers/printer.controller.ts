import { Request, Response } from 'express';
import { printReceipt } from '../utils/printer';

export const testPrint = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        // You can customize the data passed from the frontend
        const printData = {
            ...data,
            items: data.items || [
                { name: 'Test Item 1', qty: 1, price: 10000, total: 10000 },
                { name: 'Test Item 2', qty: 2, price: 5000, total: 10000 }
            ],
            totalAmount: data.totalAmount || 20000
        };

        await printReceipt(printData);

        res.status(200).json({
            success: true,
            message: 'Printed successfully to default printer'
        });
    } catch (error: any) {
        console.error('Error printing receipt:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to print receipt',
            error: error.message
        });
    }
};
