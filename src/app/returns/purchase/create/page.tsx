'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, SearchInput } from '@/components/ui';
import { ArrowLeft, Search, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { purchasesAPI, purchaseReturnsAPI } from '@/services/api';

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  id: number;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
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

export default function CreatePurchaseReturnPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async (query = '') => {
    try {
      setIsLoading(true);
      const params: any = { status: 'RECEIVED' };
      if (query) params.search = query;

      const response = await purchasesAPI.getAll(params);
      setPurchaseOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      alert('Gagal mengambil data purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPurchaseOrder = (po: PurchaseOrder) => {
    setSelectedPO(po);
    // Initialize return items
    const items: ReturnItem[] = po.items.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      maxQuantity: item.quantity,
      quantity: 0,
      unitPrice: parseFloat(item.unitPrice.toString()),
      reason: '',
      condition: 'DAMAGED' as const,
    }));
    setReturnItems(items);
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
    if (!selectedPO) return;

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

      const payload = {
        purchaseOrderId: selectedPO.id,
        items: itemsToReturn.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
          condition: item.condition,
        })),
        reason,
        notes,
        refundMethod: 'CASH' as const,
      };

      await purchaseReturnsAPI.create(payload);

      alert('Retur pembelian berhasil dibuat! Stock sudah dikurangi.');
      router.push('/returns');
    } catch (error: any) {
      console.error('Failed to create purchase return:', error);
      alert(error.response?.data?.message || 'Gagal membuat retur pembelian');
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
          <h1 className="text-3xl font-bold mb-2 gradient-text">Buat Retur Pembelian</h1>
          <p className="text-[var(--foreground-muted)]">
            {!selectedPO ? 'Cari dan pilih Purchase Order yang akan diretur' : 'Pilih produk dan jumlah yang akan diretur ke supplier'}
          </p>
        </div>

        {!selectedPO ? (
          // Select Purchase Order
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Cari Purchase Order</h2>

            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan nomor PO atau nama supplier..."
                  onKeyPress={(e) => e.key === 'Enter' && fetchPurchaseOrders(searchQuery)}
                />
              </div>
              <Button
                variant="primary"
                icon={Search}
                onClick={() => fetchPurchaseOrders(searchQuery)}
                disabled={isLoading}
              >
                {isLoading ? 'Mencari...' : 'Cari'}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto mb-4 text-[var(--foreground-muted)]" size={48} />
                <p className="text-[var(--foreground-muted)]">
                  Tidak ada purchase order yang ditemukan (Status: RECEIVED)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors cursor-pointer"
                    onClick={() => selectPurchaseOrder(po)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[var(--primary)]">
                          {po.poNumber}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          Supplier: {po.supplier.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(po.totalAmount)}</p>
                        <span className="badge badge-success text-xs">{po.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {formatDate(po.createdAt)} • {po.items.length} item
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Select Items to Return
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Pilih Produk yang Diretur</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    PO: <span className="font-medium text-[var(--primary)]">{selectedPO.poNumber}</span>
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Supplier: <span className="font-medium">{selectedPO.supplier.name}</span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPO(null);
                    setReturnItems([]);
                  }}
                >
                  Ganti PO
                </Button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {returnItems.map((item) => (
                <div key={item.productId} className="p-4 border border-[var(--border)] rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Max: {item.maxQuantity} • {formatCurrency(item.unitPrice)}/unit
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
                        <option value="DAMAGED">Rusak/Cacat</option>
                        <option value="OPENED">Sudah Dibuka</option>
                        <option value="NEW">Baru (Belum Dibuka)</option>
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
                        placeholder="Contoh: Barang rusak saat pengiriman, tidak sesuai spec"
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
                placeholder="Jelaskan alasan retur ke supplier secara umum..."
                className="input w-full"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk supplier..."
                className="input w-full"
                rows={2}
              />
            </div>

            <div className="border-t border-[var(--border)] pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-semibold mb-2">
                <span>Total Nilai Retur:</span>
                <span className="text-[var(--primary)]">{formatCurrency(calculateTotal())}</span>
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                ⚠️ Stock akan dikurangi otomatis saat retur dibuat
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedPO(null);
                  setReturnItems([]);
                }}
                className="flex-1"
              >
                Batal
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
