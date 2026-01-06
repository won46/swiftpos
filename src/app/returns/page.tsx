'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, SearchInput } from '@/components/ui';
import { Plus, Eye, Check, Trash2, PackageX, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReturnsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API calls when frontend API is ready
      // For now, show empty state
      setSalesReturns([]);
      setPurchaseReturns([]);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      APPROVED: { label: 'Disetujui', class: 'badge-success' },
      COMPLETED: { label: 'Selesai', class: 'badge-info' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Kelola Retur</h1>
              <p className="text-[var(--foreground-muted)]">
                Kelola retur penjualan dan pembelian barang
              </p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'sales' ? (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push('/returns/sales/create')}
                >
                  Buat Retur Penjualan
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push('/returns/purchase/create')}
                >
                  Buat Retur Pembelian
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'sales'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <PackageX size={18} />
                <span>Retur Penjualan</span>
              </div>
              {activeTab === 'sales' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('purchase')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'purchase'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <RotateCcw size={18} />
                <span>Retur Pembelian</span>
              </div>
              {activeTab === 'purchase' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari ${activeTab === 'sales' ? 'nomor retur atau transaksi' : 'nomor retur atau PO'}...`}
          />
        </div>

        {/* Content */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'sales' ? (
            // Sales Returns Table
            salesReturns.length === 0 ? (
              <div className="text-center py-12">
                <PackageX className="mx-auto mb-4 text-[var(--foreground-muted)]" size={48} />
                <p className="text-[var(--foreground-muted)] mb-4">
                  {searchQuery ? 'Tidak ada retur ditemukan' : 'Belum ada retur penjualan'}
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push('/returns/sales/create')}
                >
                  Buat Retur Penjualan
                </Button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No. Retur</th>
                      <th>No. Transaksi</th>
                      <th>Customer</th>
                      <th>Tanggal</th>
                      <th>Jumlah Refund</th>
                      <th>Metode Refund</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReturns.map((salesReturn) => (
                      <tr key={salesReturn.id}>
                        <td className="font-medium text-[var(--primary)]">
                          {salesReturn.returnNumber}
                        </td>
                        <td>{salesReturn.transaction?.invoiceNumber}</td>
                        <td>{salesReturn.transaction?.customerName || '-'}</td>
                        <td>{formatDate(salesReturn.returnDate)}</td>
                        <td className="font-semibold">{formatCurrency(salesReturn.refundAmount)}</td>
                        <td>
                          <span className="badge badge-secondary">
                            {salesReturn.refundMethod}
                          </span>
                        </td>
                        <td>{getStatusBadge(salesReturn.status)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => alert(`View return ${salesReturn.id}`)}
                              className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="text-[var(--primary)]" size={20} />
                            </button>
                            {salesReturn.status === 'APPROVED' && (
                              <button
                                onClick={() => alert(`Complete return ${salesReturn.id}`)}
                                className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                                title="Selesaikan"
                              >
                                <Check className="text-green-500" size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Purchase Returns Table
            purchaseReturns.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="mx-auto mb-4 text-[var(--foreground-muted)]" size={48} />
                <p className="text-[var(--foreground-muted)] mb-4">
                  {searchQuery ? 'Tidak ada retur ditemukan' : 'Belum ada retur pembelian'}
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push('/returns/purchase/create')}
                >
                  Buat Retur Pembelian
                </Button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No. Retur</th>
                      <th>No. PO</th>
                      <th>Supplier</th>
                      <th>Tanggal</th>
                      <th>Jumlah</th>
                      <th>Refund Diterima</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseReturns.map((purchaseReturn) => (
                      <tr key={purchaseReturn.id}>
                        <td className="font-medium text-[var(--primary)]">
                          {purchaseReturn.returnNumber}
                        </td>
                        <td>{purchaseReturn.purchaseOrder?.poNumber}</td>
                        <td>{purchaseReturn.supplier?.name}</td>
                        <td>{formatDate(purchaseReturn.returnDate)}</td>
                        <td className="font-semibold">{formatCurrency(purchaseReturn.returnAmount)}</td>
                        <td>
                          {purchaseReturn.refundReceived ? (
                            <span className="badge badge-success">
                              Diterima {purchaseReturn.refundDate && `(${formatDate(purchaseReturn.refundDate)})`}
                            </span>
                          ) : (
                            <span className="badge badge-warning">Belum Diterima</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => alert(`View return ${purchaseReturn.id}`)}
                              className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="text-[var(--primary)]" size={20} />
                            </button>
                            {!purchaseReturn.refundReceived && (
                              <button
                                onClick={() => alert(`Mark refund received ${purchaseReturn.id}`)}
                                className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                                title="Tandai Refund Diterima"
                              >
                                <Check className="text-green-500" size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
