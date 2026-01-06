'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal, Input } from '@/components/ui';
import { productsAPI, stockAPI } from '@/services/api';
import { exportStockOpnameToExcel } from '@/lib/exportUtils';
import { Product } from '@/types';
import { Package, Plus, Minus, History, Save, RefreshCw, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface StockAdjustment {
  productId: string;
  productName: string;
  currentStock: number;
  newStock: number;
  adjustment: number;
  type: 'IN' | 'OUT';
}

export default function StockTakingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    try {
      const response = await stockAPI.getAdjustments();
      setStockHistory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
    }
  };

  const handleStockChange = (product: Product, newStock: number) => {
    const adjustment = newStock - product.stockQuantity;
    
    if (adjustment === 0) {
      // Remove from adjustments if no change
      setAdjustments(prev => prev.filter(a => a.productId !== product.id));
      return;
    }

    const adjustmentData: StockAdjustment = {
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      newStock,
      adjustment: Math.abs(adjustment),
      type: adjustment > 0 ? 'IN' : 'OUT',
    };

    setAdjustments(prev => {
      const existing = prev.findIndex(a => a.productId === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = adjustmentData;
        return updated;
      }
      return [...prev, adjustmentData];
    });
  };

  const handleQuickAdjust = (product: Product, amount: number) => {
    const newStock = Math.max(0, product.stockQuantity + amount);
    handleStockChange(product, newStock);
  };

  const handleSaveAdjustments = async () => {
    if (adjustments.length === 0) {
      alert('Tidak ada perubahan stock');
      return;
    }

    if (!reason.trim()) {
      alert('Alasan harus diisi');
      return;
    }

    try {
      setIsSaving(true);

      // Save each adjustment
      for (const adj of adjustments) {
        await stockAPI.createAdjustment({
          productId: adj.productId,
          type: adj.type,
          quantity: adj.adjustment,
          reason: reason,
        });
      }

      alert(`Berhasil menyimpan ${adjustments.length} perubahan stok`);
      setAdjustments([]);
      setReason('');
      fetchProducts(); // Refresh products
    } catch (error) {
      console.error('Failed to save adjustments:', error);
      alert('Gagal menyimpan perubahan stok');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewHistory = () => {
    fetchStockHistory();
    setIsHistoryOpen(true);
  };

  const handleExportHistory = () => {
    if (stockHistory.length === 0) {
      alert('Tidak ada riwayat untuk di-export');
      return;
    }
    exportStockOpnameToExcel(stockHistory);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalAdjustments = adjustments.length;
  const totalIn = adjustments.filter(a => a.type === 'IN').reduce((sum, a) => sum + a.adjustment, 0);
  const totalOut = adjustments.filter(a => a.type === 'OUT').reduce((sum, a) => sum + a.adjustment, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Stock Opname</h1>
            <p className="text-[var(--foreground-muted)]">
              Penyesuaian stok dan inventarisasi
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon={History} onClick={handleViewHistory}>
              Riwayat
            </Button>
            {adjustments.length > 0 && (
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSaveAdjustments}
                disabled={isSaving}
              >
                {isSaving ? 'Menyimpan...' : `Simpan (${adjustments.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Pending Adjustments</p>
            <p className="text-2xl font-bold">{totalAdjustments}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Masuk</p>
            <p className="text-2xl font-bold text-[var(--success)]">+{totalIn}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Keluar</p>
            <p className="text-2xl font-bold text-[var(--error)]">-{totalOut}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Net Change</p>
            <p className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {totalIn - totalOut >= 0 ? '+' : ''}{totalIn - totalOut}
            </p>
          </div>
        </div>

        {/* Reason Input */}
        {adjustments.length > 0 && (
          <div className="card mb-6">
            <label className="block text-sm font-medium mb-2">Alasan Penyesuaian *</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stock opname bulanan, Kerusakan, Penerimaan barang, dll"
            />
          </div>
        )}

        {/* Search */}
        <div className="card mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk berdasarkan nama atau SKU..."
          />
        </div>

        {/* Products Table */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Tidak ada produk</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>SKU</th>
                    <th>Stok Saat Ini</th>
                    <th>Quick Adjust</th>
                    <th>Stok Baru</th>
                    <th>Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const adjustment = adjustments.find(a => a.productId === product.id);
                    const newStock = adjustment?.newStock ?? product.stockQuantity;

                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={adjustment ? 'bg-[var(--primary-bg)]' : ''}
                      >
                        <td className="font-medium">{product.name}</td>
                        <td className="text-[var(--foreground-muted)]">{product.sku}</td>
                        <td>
                          <span className="badge badge-secondary">{product.stockQuantity}</span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleQuickAdjust(product, -10)}
                              className="p-1 rounded hover:bg-[var(--error-bg)] text-[var(--error)]"
                              title="Kurangi 10"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(product, -1)}
                              className="p-1 rounded hover:bg-[var(--error-bg)] text-[var(--error)]"
                              title="Kurangi 1"
                            >
                              <Minus size={16} />
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(product, 1)}
                              className="p-1 rounded hover:bg-[var(--success-bg)] text-[var(--success)]"
                              title="Tambah 1"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(product, 10)}
                              className="p-1 rounded hover:bg-[var(--success-bg)] text-[var(--success)]"
                              title="Tambah 10"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={newStock}
                            onChange={(e) => handleStockChange(product, parseInt(e.target.value) || 0)}
                            className="input w-24"
                          />
                        </td>
                        <td>
                          {adjustment && (
                            <span className={`badge ${adjustment.type === 'IN' ? 'badge-success' : 'badge-error'}`}>
                              {adjustment.type === 'IN' ? '+' : '-'}{adjustment.adjustment}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        size="lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Riwayat Penyesuaian Stok</h2>
          {stockHistory.length > 0 && (
            <button
              onClick={handleExportHistory}
              className="btn btn-sm btn-secondary"
            >
              <Download size={16} />
              Export Excel
            </button>
          )}
        </div>

        {stockHistory.length === 0 ? (
          <div className="text-center py-8">
            <History size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
            <p className="text-[var(--foreground-muted)]">Belum ada riwayat</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {stockHistory.map((history, index) => (
              <div key={index} className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{history.product?.name}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      SKU: {history.product?.sku}
                    </p>
                  </div>
                  <span className={`badge ${history.type === 'IN' ? 'badge-success' : 'badge-error'}`}>
                    {history.type === 'IN' ? '+' : '-'}{history.quantity}
                  </span>
                </div>
                <p className="text-sm mb-2">{history.reason}</p>
                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                  <span>Oleh: {history.user?.fullName}</span>
                  <span>{formatDate(history.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setIsHistoryOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
