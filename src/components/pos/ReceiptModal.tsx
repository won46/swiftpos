'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Transaction } from '@/types';
import { Receipt } from './Receipt';
import { Button } from '@/components/ui';
import { exportReceiptToPDF } from '@/lib/exportUtils';
import { useRef } from 'react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handleDownloadPDF = () => {
    exportReceiptToPDF(transaction);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-[var(--background)] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
            <h3 className="font-semibold text-lg text-[var(--foreground)]">Struk Transaksi</h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Receipt View (Scrollable) */}
          <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
            <div className="bg-white p-4 shadow-sm border border-gray-100 mx-auto max-w-[300px]">
              <div ref={receiptRef}>
                <Receipt transaction={transaction} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3 shrink-0">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Tutup
            </Button>
            <Button variant="primary" onClick={handleDownloadPDF} icon={Download} className="flex-1 gradient-primary">
              Download PDF
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
