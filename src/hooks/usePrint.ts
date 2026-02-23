import { useState } from 'react';
import { Transaction } from '@/types';
import { usePrinterStore } from '@/store/printerStore';
import { printerService } from '@/services/printerService';
import { printerAPI } from '@/services/api';

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const { isConnected } = usePrinterStore();

  const printReceipt = async (transaction: Transaction) => {
    setIsPrinting(true);

    if (isConnected) {
      try {
        const settingsStr = localStorage.getItem('pos_settings');
        const settings = settingsStr ? JSON.parse(settingsStr) : {
          storeName: 'SwiftPOS Store',
          storeAddress: 'Jl. Contoh No. 123',
          storePhone: '021-12345678'
        };

        const encoder = new TextEncoder();
        let receipt = '';

        // Header
        receipt += printerService.formatText(`${settings.storeName}\n`, 'NORMAL');
        receipt += printerService.formatText(`${settings.storeAddress}\n`, 'CENTER');
        if (settings.storePhone) {
          receipt += printerService.formatText(`${settings.storePhone}\n`, 'CENTER');
        }
        receipt += printerService.formatText('--------------------------------\n');

        // Totals (New position and format)
        receipt += printerService.formatText(`TOTAL:        ${transaction.totalAmount.toLocaleString()}\n`, 'BOLD');
        if (transaction.paidAmount !== undefined) {
          receipt += printerService.formatText(`BAYAR:        ${transaction.paidAmount.toLocaleString()}\n`);
          receipt += printerService.formatText(`KEMBALI:      ${(transaction.changeAmount || 0).toLocaleString()}\n`);
        }
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
        // Fallback to backend API printer
        try {
          const settingsStr = localStorage.getItem('pos_settings');
          const settings = settingsStr ? JSON.parse(settingsStr) : null;

          const printData = {
            items: transaction.items.map(item => ({
              name: item.product?.name || 'Item',
              qty: item.quantity,
              price: item.unitPrice,
              total: item.totalPrice
            })),
            totalAmount: transaction.totalAmount,
            storeName: settings?.storeName,
            storeAddress: settings?.storeAddress,
            storePhone: settings?.storePhone,
            amountPaid: transaction.paidAmount,
            change: transaction.changeAmount
          };
          await printerAPI.printReceipt(printData);
          alert('Mencetak ke printer sistem (Backend)');
        } catch (backendError) {
          console.error('Backend print failed:', backendError);
          alert('Gagal mencetak ke printer bluetooth maupun printer sistem.');
        }
      } finally {
        setIsPrinting(false);
      }
    } else {
      try {
        const settingsStr = localStorage.getItem('pos_settings');
        const settings = settingsStr ? JSON.parse(settingsStr) : null;

        // Fallback to backend API printer directly
        const printData = {
          items: transaction.items.map(item => ({
            name: item.product?.name || 'Item',
            qty: item.quantity,
            price: item.unitPrice,
            total: item.totalPrice
          })),
          totalAmount: transaction.totalAmount,
          storeName: settings?.storeName,
          storeAddress: settings?.storeAddress,
          storePhone: settings?.storePhone,
          amountPaid: transaction.paidAmount,
          change: transaction.changeAmount
        };
        await printerAPI.printReceipt(printData);
        alert("Mencetak ke printer default sistem...");

        setIsPrinting(false);
      } catch (error) {
        console.error('Print error:', error);
        alert('Gagal mencetak ke printer default sistem.');
        setIsPrinting(false);
      }
    }
  };

  return { printReceipt, isPrinting };
}
