'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { reportsAPI } from '@/services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Calendar,
  Package,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductStat {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    category?: { name: string };
  };
  quantitySold: number;
  revenue: number;
  transactions?: number;
  stockQuantity?: number;
}

interface DailySale {
  date: string;
  dayName: string;
  transactions: number;
  revenue: number;
  itemsSold: number;
  averageTransaction: number;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
}

export default function ProductStatsPage() {
  const [productStats, setProductStats] = useState<{
    bestSellers: ProductStat[];
    topRevenue: ProductStat[];
    slowMovers: ProductStat[];
    todaySales: { itemsSold: number; revenue: number };
    period: string;
  } | null>(null);
  
  const [dailySales, setDailySales] = useState<{
    data: DailySale[];
    totals: {
      totalTransactions: number;
      totalRevenue: number;
      totalItemsSold: number;
      averageDaily: number;
    };
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [selectedDays]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, dailyRes] = await Promise.all([
        reportsAPI.getProductStats(selectedDays),
        reportsAPI.getDailySales(7),
      ]);
      setProductStats(statsRes.data.data);
      setDailySales(dailyRes.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
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
            <h1 className="text-3xl font-bold mb-2 gradient-text">Statistik Produk</h1>
            <p className="text-[var(--foreground-muted)]">
              Analisis produk terlaris, kurang laris, dan penjualan harian
            </p>
          </div>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="input"
          >
            <option value={7}>7 hari terakhir</option>
            <option value={14}>14 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Hari Ini Terjual</p>
                <p className="text-2xl font-bold">{productStats?.todaySales.itemsSold || 0} item</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Pendapatan Hari Ini</p>
                <p className="text-2xl font-bold">{formatPrice(productStats?.todaySales.revenue || 0)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--info-bg)] text-[var(--info)] flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Rata-rata Harian</p>
                <p className="text-2xl font-bold">{formatPrice(dailySales?.totals.averageDaily || 0)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total Transaksi (7 hari)</p>
                <p className="text-2xl font-bold">{dailySales?.totals.totalTransactions || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Best Sellers */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">🔥 Produk Terlaris</h2>
                <p className="text-xs text-[var(--foreground-muted)]">Berdasarkan jumlah terjual</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {productStats?.bestSellers.slice(0, 5).map((item, index) => (
                <div 
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {item.product.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{item.quantitySold} pcs</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{formatPrice(item.revenue)}</p>
                  </div>
                </div>
              ))}
              
              {(!productStats?.bestSellers || productStats.bestSellers.length === 0) && (
                <p className="text-center text-[var(--foreground-muted)] py-8">Belum ada data penjualan</p>
              )}
            </div>
          </motion.div>

          {/* Slow Movers */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">📉 Produk Kurang Laris</h2>
                <p className="text-xs text-[var(--foreground-muted)]">Perlu perhatian khusus</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {productStats?.slowMovers.slice(0, 5).map((item, index) => (
                <div 
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <ArrowDown size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Stok: {item.stockQuantity} pcs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.quantitySold} terjual</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{selectedDays} hari</p>
                  </div>
                </div>
              ))}
              
              {(!productStats?.slowMovers || productStats.slowMovers.length === 0) && (
                <p className="text-center text-[var(--foreground-muted)] py-8">Belum ada data produk</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Daily Sales */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">📅 Penjualan Harian</h2>
              <p className="text-xs text-[var(--foreground-muted)]">7 hari terakhir</p>
            </div>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Hari</th>
                  <th>Transaksi</th>
                  <th>Item Terjual</th>
                  <th>Pendapatan</th>
                  <th>Rata-rata/Transaksi</th>
                  <th>Produk Terlaris</th>
                </tr>
              </thead>
              <tbody>
                {dailySales?.data.map((day, index) => (
                  <motion.tr
                    key={day.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="font-mono">{day.date}</td>
                    <td>{day.dayName}</td>
                    <td>
                      <span className="badge badge-info">{day.transactions}</span>
                    </td>
                    <td>{day.itemsSold} pcs</td>
                    <td className="font-semibold text-green-600">{formatPrice(day.revenue)}</td>
                    <td>{formatPrice(day.averageTransaction)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {day.topProducts.slice(0, 2).map((p) => (
                          <span key={p.name} className="badge badge-secondary text-xs">
                            {p.name.substring(0, 15)}... ({p.qty})
                          </span>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                
                {(!dailySales?.data || dailySales.data.length === 0) && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--foreground-muted)]">
                      Belum ada data penjualan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
