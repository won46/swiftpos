'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { AlertTriangle, Clock, Package, Trash2 } from 'lucide-react';
import { ProductWithExpiry} from '@/types';
import { expiryAPI } from '@/services/api';

type TabType = 'expired' | 'urgent' | 'warning';

export default function ExpiryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('expired');
  const [expiredProducts, setExpiredProducts] = useState<ProductWithExpiry[]>([]);
  const [urgentProducts, setUrgentProducts] = useState<ProductWithExpiry[]>([]);
  const [warningProducts, setWarningProducts] = useState<ProductWithExpiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ expired: 0, urgent: 0, warning: 0, expiredValue: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch summary
      const summaryResponse = await expiryAPI.getSummary();
      setSummary(summaryResponse.data.data);

      // Fetch expired products
      const expiredResponse = await expiryAPI.getExpired();
      setExpiredProducts(expiredResponse.data.data);

      // Fetch urgent (7 days)
      const urgentResponse = await expiryAPI.getNearExpiry(7);
      setUrgentProducts(urgentResponse.data.data);

      // Fetch warning (30 days)
      const warningResponse = await expiryAPI.getNearExpiry(30);
      setWarningProducts(warningResponse.data.data);
    } catch (error) {
      console.error('Failed to fetch expiry data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispose = async (productId: string, productName: string) => {
    const reason = prompt(`Alasan disposal untuk "${productName}":`);
    if (!reason) return;

    try {
      await expiryAPI.markDisposed(productId, reason);
      alert('Produk berhasil di-dispose');
      fetchData();
    } catch (error) {
      console.error('Failed to dispose product:', error);
      alert('Gagal dispose produk');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <span className="badge badge-error">Kadaluarsa</span>;
      case 'urgent':
        return <span className="badge badge-warning">Urgent (≤7 hari)</span>;
      case 'warning':
        return <span className="badge badge-info">Warning (≤30 hari)</span>;
      default:
        return <span className="badge">Normal</span>;
    }
  };

  const renderProductTable = (products: ProductWithExpiry[]) => {
    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-[var(--foreground-muted)]">Tidak ada produk</p>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama Produk</th>
              <th>Batch</th>
              <th>Tanggal Kadaluarsa</th>
              <th>Sisa Hari</th>
              <th>Stock</th>
              <th>Nilai (Cost)</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="font-mono text-sm">{product.sku}</td>
                <td>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.category && (
                      <div className="text-xs text-[var(--foreground-muted)]">
                        {product.category.name}
                      </div>
                    )}
                  </div>
                </td>
                <td className="text-sm">{product.batchNumber || '-'}</td>
                <td>{product.expiryDate ? formatDate(product.expiryDate) : '-'}</td>
                <td>
                  {product.daysUntilExpiry !== null ? (
                    <span className={product.daysUntilExpiry < 0 ? 'text-[var(--error)]' : ''}>
                      {product.daysUntilExpiry} hari
                    </span>
                  ) : '-'}
                </td>
                <td className="font-semibold">{product.stockQuantity}</td>
                <td>Rp {(product.costPrice * product.stockQuantity).toLocaleString('id-ID')}</td>
                <td>{getStatusBadge(product.expiryStatus)}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDispose(product.id, product.name)}
                      className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                      title="Dispose"
                    >
                      <Trash2 className="text-[var(--error)]" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Tracking Kadaluarsa</h1>
          <p className="text-[var(--foreground-muted)]">
            Monitoring produk kadaluarsa dan mendekati kadaluarsa
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Kadaluarsa</p>
                <p className="text-2xl font-bold">{summary.expired}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Clock className="text-orange-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Urgent (≤7 hari)</p>
                <p className="text-2xl font-bold">{summary.urgent}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Package className="text-yellow-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Warning (≤30 hari)</p>
                <p className="text-2xl font-bold">{summary.warning}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm text-[var(--foreground-muted)] mb-1">Nilai Expired</p>
              <p className="text-2xl font-bold text-[var(--error)]">
                Rp {summary.expiredValue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex gap-2 border-b border-[var(--border)] mb-6">
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'expired'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Kadaluarsa ({expiredProducts.length})
              {activeTab === 'expired' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('urgent')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'urgent'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Urgent - 7 Hari ({urgentProducts.length})
              {activeTab === 'urgent' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('warning')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'warning'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Warning - 30 Hari ({warningProducts.length})
              {activeTab === 'warning' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'expired' && renderProductTable(expiredProducts)}
              {activeTab === 'urgent' && renderProductTable(urgentProducts)}
              {activeTab === 'warning' && renderProductTable(warningProducts)}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
