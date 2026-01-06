'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { StatCard } from '@/components/ui';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp,
} from 'lucide-react';
import { transactionsAPI, productsAPI } from '@/services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalItems: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch today's stats
      const statsResponse = await transactionsAPI.getTodayStats();
      setStats(statsResponse.data.data);

      // Fetch recent transactions (last 5)
      const transactionsResponse = await transactionsAPI.getAll();
      setRecentTransactions(transactionsResponse.data.data.slice(0, 5));

      // Fetch low stock products
      const lowStockResponse = await productsAPI.getLowStock();
      setLowStockProducts(lowStockResponse.data.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dashboardStats = [
    {
      label: 'Penjualan Hari Ini',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      iconBgColor: 'rgba(34, 197, 94, 0.15)',
      iconColor: 'var(--success)',
      change: 0,
      changeLabel: 'hari ini',
    },
    {
      label: 'Total Transaksi',
      value: stats.totalTransactions.toString(),
      icon: ShoppingBag,
      iconBgColor: 'rgba(99, 102, 241, 0.15)',
      iconColor: 'var(--primary)',
      change: 0,
      changeLabel: 'hari ini',
    },
    {
      label: 'Produk Terjual',
      value: stats.totalItems.toString(),
      icon: Package,
      iconBgColor: 'rgba(245, 158, 11, 0.15)',
      iconColor: 'var(--warning)',
      change: 0,
      changeLabel: 'hari ini',
    },
    {
      label: 'Margin Keuntungan',
      value: '28%',
      icon: TrendingUp,
      iconBgColor: 'rgba(14, 165, 233, 0.15)',
      iconColor: 'var(--info)',
      change: 0,
      changeLabel: 'estimasi',
    },
  ];

  const paymentBadgeColors: Record<string, string> = {
    CASH: 'badge-success',
    QRIS: 'badge-info',
    CARD: 'badge-warning',
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--foreground-muted)]">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Dashboard</h1>
          <p className="text-[var(--foreground-muted)]">
            Selamat datang kembali! Ini adalah ringkasan bisnis Anda hari ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
              <a href="/transactions" className="text-sm text-[var(--primary)] hover:underline">
                Lihat Semua
              </a>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--foreground-muted)]">Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Waktu</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="font-medium text-[var(--primary)]">{transaction.invoiceNumber}</td>
                        <td className="text-[var(--foreground-muted)]">{formatTime(transaction.transactionDate)}</td>
                        <td>{transaction.items.length} items</td>
                        <td className="font-semibold">{formatPrice(transaction.totalAmount)}</td>
                        <td>
                          <span className={`badge ${paymentBadgeColors[transaction.paymentMethod]}`}>
                            {transaction.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Stok Rendah</h2>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Semua produk memiliki stok yang cukup
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="p-3 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning)]">
                    <div className="flex items-start gap-3">
                      <Package size={16} className="text-[var(--warning)] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          SKU: {product.sku}
                        </p>
                        <p className="text-xs text-[var(--warning)] mt-1">
                          Stok: {product.stock_quantity} / Min: {product.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
