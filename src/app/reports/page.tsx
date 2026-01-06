'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { StatCard, Button } from '@/components/ui';
import { reportsAPI } from '@/services/api';
import { exportSalesReportToExcel, exportSalesReportToPDF } from '@/lib/exportUtils';
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data states
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalItems: 0,
    totalProfit: 0,
  });
  const [salesByDate, setSalesByDate] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [slowProducts, setSlowProducts] = useState<any[]>([]);

  useEffect(() => {
    // Set default dates (last 30 days) using Jakarta timezone
    const jakartaDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
    const end = new Date(jakartaDate);
    const start = new Date(jakartaDate);
    start.setDate(start.getDate() - 30);
    
    // Format as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params = { startDate, endDate };

      const [overviewRes, salesRes, productsRes, categoryRes, paymentRes, slowRes] = await Promise.all([
        reportsAPI.getOverview(params),
        reportsAPI.getSalesByDate(params),
        reportsAPI.getTopProducts({ ...params, limit: 10 }),
        reportsAPI.getSalesByCategory(params),
        reportsAPI.getPaymentMethods(params),
        reportsAPI.getSlowProducts({ ...params, limit: 10 }),
      ]);

      setOverview(overviewRes.data.data);
      setSalesByDate(salesRes.data.data);
      setTopProducts(productsRes.data.data);
      setSalesByCategory(categoryRes.data.data);
      setPaymentMethods(paymentRes.data.data);
      setSlowProducts(slowRes.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const totalRevenue = overview.totalRevenue || 1; // Avoid division by zero

      const reportData = {
        overview: {
          totalRevenue: overview.totalRevenue,
          totalTransactions: overview.totalTransactions,
          totalItems: overview.totalItems,
          profitMargin: (overview.totalProfit / overview.totalRevenue * 100) || 0,
        },
        salesByDate,
        topProducts: topProducts.map(p => ({
          name: p.product?.name || 'Unknown',
          quantity: p.quantity || 0,
          revenue: p.revenue || 0,
        })),
        salesByCategory: salesByCategory.map(c => ({
          category: c.category || 'Unknown',
          revenue: c.revenue || 0,
          percentage: (c.revenue / totalRevenue) * 100,
        })),
        paymentMethods: paymentMethods.map(m => ({
          method: m.method || 'Unknown',
          count: m.count || 0,
          total: m.revenue || 0,
          percentage: (m.revenue / totalRevenue) * 100,
        })),
        slowProducts: slowProducts.map(p => ({
          name: p.product?.name || 'Unknown',
          quantitySold: p.quantitySold || 0,
          stockQuantity: p.stockQuantity || 0,
          stockValue: p.stockValue || 0,
        })),
        dateRange: { startDate, endDate },
      };
      exportSalesReportToExcel(reportData);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal export ke Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const totalRevenue = overview.totalRevenue || 1; // Avoid division by zero

      const reportData = {
        overview: {
          totalRevenue: overview.totalRevenue,
          totalTransactions: overview.totalTransactions,
          totalItems: overview.totalItems,
          profitMargin: (overview.totalProfit / overview.totalRevenue * 100) || 0,
        },
        topProducts: topProducts.map(p => ({
          name: p.product?.name || 'Unknown',
          quantity: p.quantity || 0,
          revenue: p.revenue || 0,
        })),
        salesByCategory: salesByCategory.map(c => ({
          category: c.category || 'Unknown',
          revenue: c.revenue || 0,
          percentage: (c.revenue / totalRevenue) * 100,
        })),
        slowProducts: slowProducts.map(p => ({
          name: p.product?.name || 'Unknown',
          quantitySold: p.quantitySold || 0,
          stockQuantity: p.stockQuantity || 0,
          stockValue: p.stockValue || 0,
        })),
        dateRange: { startDate, endDate },
      };
      exportSalesReportToPDF(reportData);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal export ke PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const statsData = [
    {
      label: 'Total Penjualan',
      value: formatPrice(overview.totalRevenue),
      icon: DollarSign,
      iconBgColor: 'rgba(34, 197, 94, 0.15)',
      iconColor: 'var(--success)',
      change: 0,
      changeLabel: `${startDate} - ${endDate}`,
    },
    {
      label: 'Total Transaksi',
      value: overview.totalTransactions.toString(),
      icon: ShoppingBag,
      iconBgColor: 'rgba(99, 102, 241, 0.15)',
      iconColor: 'var(--primary)',
      change: 0,
      changeLabel: `${startDate} - ${endDate}`,
    },
    {
      label: 'Produk Terjual',
      value: overview.totalItems.toString(),
      icon: Package,
      iconBgColor: 'rgba(245, 158, 11, 0.15)',
      iconColor: 'var(--warning)',
      change: 0,
      changeLabel: `${startDate} - ${endDate}`,
    },
    {
      label: 'Profit (Estimasi)',
      value: formatPrice(overview.totalProfit),
      icon: TrendingUp,
      iconBgColor: 'rgba(14, 165, 233, 0.15)',
      iconColor: 'var(--info)',
      change: 0,
      changeLabel: 'dari PPN',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--foreground-muted)]">Memuat laporan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Laporan & Analisis</h1>
            <p className="text-[var(--foreground-muted)]">
              Analisis penjualan dan performa bisnis
            </p>
          </div>
          
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Laporan'}
              <ChevronDown size={16} className="ml-2" />
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-10">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--surface)] flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet size={18} className="text-green-500" />
                  <div>
                    <div className="font-medium">Export ke Excel</div>
                    <div className="text-xs text-[var(--foreground-muted)]">File .xlsx dengan semua data</div>
                  </div>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--surface)] flex items-center gap-3 transition-colors border-t border-[var(--border)]"
                >
                  <FileText size={18} className="text-red-500" />
                  <div>
                    <div className="font-medium">Export ke PDF</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Laporan siap cetak</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-[var(--foreground-muted)]" />
            <div className="flex items-center gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex-1"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Tren Penjualan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="var(--foreground-muted)"
                />
                <YAxis stroke="var(--foreground-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => formatPrice(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                  name="Pendapatan"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Penjualan per Kategori</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => entry.category}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Produk Terlaris</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--foreground-muted)" />
                <YAxis
                  type="category"
                  dataKey="product.name"
                  width={150}
                  stroke="var(--foreground-muted)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => formatPrice(value)}
                />
                <Bar dataKey="revenue" fill="#6366f1" name="Pendapatan" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Metode Pembayaran</h2>
            <div className="space-y-4 mb-6">
              {paymentMethods.map((method, index) => {
                const total = paymentMethods.reduce((sum, m) => sum + m.revenue, 0);
                const percentage = ((method.revenue / total) * 100).toFixed(1);
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{method.method}</span>
                      <span className="text-[var(--foreground-muted)]">{percentage}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--primary)] to-purple-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold min-w-[120px] text-right">
                        {formatPrice(method.revenue)}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)] mt-1">
                      {method.count} transaksi
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slow Moving Products Section */}
        <div className="card mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingDown size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Produk Kurang Laku</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Produk dengan penjualan terendah dalam periode ini</p>
            </div>
          </div>
          {slowProducts.length === 0 ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
              <p>Tidak ada data produk</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-medium">Produk</th>
                    <th className="text-right py-3 px-4 font-medium">Terjual</th>
                    <th className="text-right py-3 px-4 font-medium">Stok</th>
                    <th className="text-right py-3 px-4 font-medium">Nilai Stok</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slowProducts.map((item: any) => {
                    const status = item.quantitySold === 0 
                      ? { label: 'Tidak Terjual', color: 'bg-red-500/20 text-red-400' }
                      : item.quantitySold < 5
                      ? { label: 'Sangat Lambat', color: 'bg-orange-500/20 text-orange-400' }
                      : { label: 'Lambat', color: 'bg-yellow-500/20 text-yellow-400' };
                    
                    return (
                      <tr key={item.product.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-[var(--foreground-muted)]">
                            {item.product.category?.name || 'Tanpa Kategori'}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-mono">
                          {item.quantitySold} pcs
                        </td>
                        <td className="text-right py-3 px-4 font-mono">
                          {item.stockQuantity} pcs
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatPrice(item.stockValue || 0)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
