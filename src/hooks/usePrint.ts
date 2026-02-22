import { useState } from 'react';
import { Transaction } from '@/types';
import { usePrinterStore } from '@/store/printerStore';
import { printerService } from '@/services/printerService';

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const { isConnected } = usePrinterStore();

  const printReceipt = async (transaction: Transaction) => {
    setIsPrinting(true);

    if (isConnected) {
        try {
            const encoder = new TextEncoder();
            let receipt = '';
            
            // Header
            receipt += printerService.formatText('SwiftPOS Store\n', 'BOLD');
            receipt += printerService.formatText('Jl. Contoh No. 123\n', 'CENTER');
            receipt += printerService.formatText('--------------------------------\n');
            
            // Transaction Info
            receipt += `Date: ${new Date(transaction.transactionDate).toLocaleString()}\n`;
            receipt += `No: ${transaction.invoiceNumber}\n`;
            receipt += '--------------------------------\n';
            
            // Items
            transaction.items.forEach(item => {
                receipt += `${item.product?.name || 'Item'}\n`;
                const qty = item.quantity;
                const price = item.unitPrice.toLocaleString();
                const total = item.totalPrice.toLocaleString();
                receipt += `${qty} x ${price}`.padEnd(20) + total.padStart(12) + '\n';
            });
            
            receipt += '--------------------------------\n';
            
            // Totals
            receipt += 'Total:'.padEnd(20) + transaction.totalAmount.toLocaleString().padStart(12) + '\n';
            if (transaction.paidAmount) {
                receipt += 'Bayar:'.padEnd(20) + transaction.paidAmount.toLocaleString().padStart(12) + '\n';
            }
            if (transaction.changeAmount) {
                receipt += 'Kembali:'.padEnd(20) + transaction.changeAmount.toLocaleString().padStart(12) + '\n';
            }
            
            // Footer
            receipt += '\n';
            receipt += printerService.formatText('Terima Kasih\n', 'CENTER');
            receipt += '\n\n\n'; // Feed
            
            const data = printerService.encodeReceipt(receipt);
            await printerService.printData(data);
            
        } catch (error) {
            console.error('Bluetooth print failed:', error);
            alert('Gagal mencetak ke printer bluetooth. Menggunakan printer biasa.');
            window.print();
        } finally {
            setIsPrinting(false);
        }
    } else {
        try {
          alert("Printer Bluetooth tidak terhubung! Mengalihkan ke printer sistem.");
          // Trigger window.print() to print the receipt
          window.print();
          
          // Reset printing state after a delay
          setTimeout(() => {
            setIsPrinting(false);
          }, 1000);
        } catch (error) {
          console.error('Print error:', error);
          setIsPrinting(false);
        }
    }
  };

  return { printReceipt, isPrinting };
}
