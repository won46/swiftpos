import escpos from 'escpos';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

class WindowsSharedPrinter {
    private buffer: Buffer = Buffer.alloc(0);
    private printerName: string;

    constructor(printerName = '\\\\127.0.0.1\\POS-80') {
        this.printerName = printerName;
    }

    open(callback?: (error: Error | null) => void) {
        this.buffer = Buffer.alloc(0);
        if (callback) callback(null);
        return this;
    }

    write(data: Buffer, callback?: (error: Error | null) => void) {
        this.buffer = Buffer.concat([this.buffer, data]);
        if (callback) callback(null);
        return this;
    }

    close(callback?: (error: Error | null) => void) {
        const tempFile = path.join(process.cwd(), `temp_receipt_${Date.now()}.bin`);
        try {
            fs.writeFileSync(tempFile, this.buffer);
            // Copy binary to shared printer
            exec(`cmd /c copy /B "${tempFile}" "${this.printerName}"`, (error) => {
                // Cleanup temp file
                try { fs.unlinkSync(tempFile); } catch (e) { }

                if (callback) callback(error);
            });
        } catch (error: any) {
            if (callback) callback(error);
        }
        return this;
    }
}

export const printReceipt = async (data: any) => {
    return new Promise((resolve, reject) => {
        try {
            // Use custom adapter for Windows shared printer
            const device = new WindowsSharedPrinter();
            const printer = new escpos.Printer(device as any);

            device.open((error: any) => {
                if (error) {
                    console.error('Error opening printer:', error);
                    return reject(error);
                }

                printer
                    .font('B')
                    .align('CT')
                    .size(1, 1)
                    .text(data.storeName || 'SWIFTPOS')
                    .text(data.storeAddress || '');

                if (data.storePhone) {
                    printer.text(data.storePhone);
                }

                printer
                    .text('================')
                    .align('LT');

                // Print items if provided
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: any) => {
                        printer.text(`${item.name}`);
                        const qtyPrice = `${item.qty} x ${item.price}`;
                        const total = `${item.total}`;
                        printer.text(qtyPrice.padEnd(20) + total.padStart(12));
                        
                        if (item.discount && item.discount > 0) {
                            printer.text(`   (Potongan: -${item.discount})`);
                        }
                    });
                }

                printer
                    .text('----------------')
                    .align('RT');

                if (data.subtotal) {
                    printer.text(`Subtotal: ${data.subtotal}`);
                }
                
                if (data.discountAmount && data.discountAmount > 0) {
                    printer.text(`Total Diskon: -${data.discountAmount}`);
                }

                printer.text(`Total: ${data.totalAmount || 0}`);

                if (data.amountPaid !== undefined) {
                    printer
                        .text(`Bayar: ${data.amountPaid}`)
                        .text(`Kembali: ${data.change || 0}`);
                }

                printer
                    .align('CT')
                    .text('================')
                    .text('Thank you!')
                    .text(' ')
                    .text(' ')
                    .cut();

                // Close executes the actual print batch to the shared printer
                printer.close((closeErr: any) => {
                    if (closeErr) {
                        return reject(closeErr);
                    }
                    resolve(true);
                });
            });
        } catch (err) {
            console.error('Printer error:', err);
            reject(err);
        }
    });
};
