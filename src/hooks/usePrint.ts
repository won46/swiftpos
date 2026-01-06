import { useState } from 'react';
import { Transaction } from '@/types';

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printReceipt = (transaction: Transaction) => {
    setIsPrinting(true);

    try {
      // Trigger window.print() to print the receipt
      // The receipt component should be rendered somewhere on the page
      window.print();
      
      // Reset printing state after a delay
      setTimeout(() => {
        setIsPrinting(false);
      }, 1000);
    } catch (error) {
      console.error('Print error:', error);
      setIsPrinting(false);
    }
  };

  return { printReceipt, isPrinting };
}
