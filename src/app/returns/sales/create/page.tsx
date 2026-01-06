'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, SearchInput } from '@/components/ui';
import { ArrowLeft, Search, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Transaction {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  transactionDate: Date;
  items: TransactionItem[];
}

interface TransactionItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    isReturnable: boolean;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReturnItem {
  productId: string;
  productName: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  reason: string;
  condition: 'NEW' | 'OPENED' | 'DAMAGED';
}

export default function CreateSalesReturnPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchTransactions = async () => {
    if (!searchQuery) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
        params: { search: searchQuery },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Failed to search transactions:', error);
      alert('Gagal mencari transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // Initialize return items
    const items: ReturnItem[] = transaction.items
      .filter(item => item.product.isReturnable)
      .map(item => ({
        productId: item.productId,
        productName: item.product.name,
        maxQuantity: item.quantity,
        quantity: 0,
        unitPrice: parseFloat(item.unitPrice.toString()),
        reason: '',
        condition: 'OPENED' as const,
      }));
    setReturnItems(items);
    setStep(2);
  };

  const updateReturnItem = (productId: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return returnItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async () => {
    if (!selectedTransaction) return;

    // Validate
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      alert('Pilih minimal 1 produk untuk diretur');
      return;
    }

    if (!reason.trim()) {
      alert('Alasan retur wajib diisi');
      return;
    }

    // Check if all items have reason
    const invalidItems = itemsToReturn.filter(item => !item.reason.trim());
    if (invalidItems.length > 0) {
      alert('Semua produk harus memiliki alasan retur');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        transactionId: selectedTransaction.id,
        items: itemsToReturn.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
          condition: item.condition,
        })),
        reason,
        notes,
        refundMethod,
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/sales-returns`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Retur berhasil dibuat!');
      router.push('/returns');
    } catch (error: any) {
      console.error('Failed to create return:', error);
      alert(error.response?.data?.message || 'Gagal membuat retur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => router.push('/returns')}
            className="mb-4"
          >
            Kembali
          </Button>
          <h1 className="text-3xl font-bold mb-2 gradient-text">Buat Retur Penjualan</h1>
          <p className="text-[var(--foreground-muted)]">
            {step === 1 && 'Cari dan pilih transaksi yang akan diretur'}
            {step === 2 && 'Pilih produk dan jumlah yang akan diretur'}
            {step === 3 && 'Review dan konfirmasi retur'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s === step
                    ? 'bg-[var(--primary)] text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 ${
                    s < step ? 'bg-green-500' : 'bg-[var(--border)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Search Transaction */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Cari Transaksi</h2>
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan nomor invoice..."
                  onKeyPress={(e) => e.key === 'Enter' && searchTransactions()}
                />
              </div>
              <Button
                variant="primary"
                icon={Search}
                onClick={searchTransactions}
                disabled={!searchQuery || isLoading}
              >
                {isLoading ? 'Mencari...' : 'Cari'}
              </Button>
            </div>

            {transactions.length > 0 && (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors cursor-pointer"
                    onClick={() => selectTransaction(transaction)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[var(--primary)]">
                          {transaction.invoiceNumber}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {transaction.customerName || 'Walk-in Customer'}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(transaction.totalAmount)}</p>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {new Date(transaction.transactionDate).toLocaleDateString('id-ID')} • {transaction.items.length} item
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && selectedTransaction && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Pilih Produk yang Diretur</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Transaksi: <span className="font-medium text-[var(--primary)]">{selectedTransaction.invoiceNumber}</span>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {returnItems.map((item) => (
                <div key={item.productId} className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Max: {item.maxQuantity} • {formatCurrency(item.unitPrice)}/pcs
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Jumlah Retur</label>
                      <input
                        type="number"
                        min="0"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => updateReturnItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kondisi</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateReturnItem(item.productId, 'condition', e.target.value)}
                        className="input w-full"
                      >
                        <option value="NEW">Baru (Belum Dibuka)</option>
                        <option value="OPENED">Sudah Dibuka</option>
                        <option value="DAMAGED">Rusak/Cacat</option>
                      </select>
                    </div>
                  </div>

                  {item.quantity > 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Alasan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateReturnItem(item.productId, 'reason', e.target.value)}
                        placeholder="Contoh: Barang rusak, tidak sesuai pesanan"
                        className="input w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Alasan Umum Retur <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan retur secara umum..."
                className="input w-full"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                className="input w-full"
                rows={2}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Metode Refund</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="CASH"
                    checked={refundMethod === 'CASH'}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <span>Cash</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="TRANSFER"
                    checked={refundMethod === 'TRANSFER'}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <span>Transfer</span>
                </label>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Refund:</span>
                <span className="text-[var(--primary)]">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || returnItems.filter(i => i.quantity > 0).length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Memproses...' : 'Buat Retur'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
