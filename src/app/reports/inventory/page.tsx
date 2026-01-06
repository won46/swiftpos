'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Download,
  Calendar,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { inventoryAPI } from '@/services/api';
import { motion } from 'framer-motion';

interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  beginningStock: number;
  stockIn: number;
  stockInDetails: {
    fromAdjustments: number;
    fromPO: number;
  };
  stockOut: number;
  stockOutDetails: {
    fromSales: number;
    fromAdjustments: number;
  };
  endingStock: number;
}

interface InventoryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalProducts: number;
    totalStockIn: number;
    totalStockOut: number;
    totalEndingStock: number;
  };
  items: InventoryItem[];
}

export default function InventoryReportPage() {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    // Use Jakarta timezone
    const jakartaDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
    const date = new Date(jakartaDate);
    date.setDate(date.getDate() - 30);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    // Use Jakarta timezone
    const jakartaDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
    return jakartaDate;
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryAPI.getReport({
        startDate,
        endDate,
      });
      setReport(response.data.data);
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Produk', 'SKU', 'Kategori', 'Stok Awal', 'Masuk', 'Keluar', 'Stok Akhir'];
    const rows = report.items.map(item => [
      item.productName,
      item.sku,
      item.category,
      item.beginningStock,
      item.stockIn,
      item.stockOut,
      item.endingStock,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-inventory-${startDate}-${endDate}.csv`;
    link.click();
  };

  const handleExportExcel = () => {
    if (!report) return;

    // Create simple HTML table for Excel
    let html = `
      <html>
      <head><meta charset="UTF-8"></head>
      <body>
      <h2>Laporan Inventory</h2>
      <p>Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}</p>
      <table border="1">
        <thead>
          <tr>
            <th>No</th>
            <th>Produk</th>
            <th>SKU</th>
            <th>Kategori</th>
            <th>Stok Awal</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Stok Akhir</th>
          </tr>
        </thead>
        <tbody>
    `;

    report.items.forEach((item, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName}</td>
          <td>${item.sku}</td>
          <td>${item.category}</td>
          <td>${item.beginningStock}</td>
          <td>${item.stockIn}</td>
          <td>${item.stockOut}</td>
          <td>${item.endingStock}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4"><strong>TOTAL</strong></td>
            <td><strong>-</strong></td>
            <td><strong>${report.summary.totalStockIn}</strong></td>
            <td><strong>${report.summary.totalStockOut}</strong></td>
            <td><strong>${report.summary.totalEndingStock}</strong></td>
          </tr>
        </tfoot>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-inventory-${startDate}-${endDate}.xls`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Laporan Inventory</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Barang masuk, barang keluar, dan stok akhir
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dari Tanggal</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sampai Tanggal</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={fetchReport} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Memuat...' : 'Tampilkan'}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={handleExportCSV} disabled={!report}>
              <Download size={16} />
              CSV
            </Button>
            <Button variant="secondary" onClick={handleExportExcel} disabled={!report}>
              <FileSpreadsheet size={16} />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="text-blue-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total Produk</p>
                <p className="text-2xl font-bold">{report.summary.totalProducts}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowDownToLine className="text-green-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total Masuk</p>
                <p className="text-2xl font-bold text-green-500">+{report.summary.totalStockIn}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowUpFromLine className="text-red-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total Keluar</p>
                <p className="text-2xl font-bold text-red-500">-{report.summary.totalStockOut}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="text-purple-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Stok Akhir</p>
                <p className="text-2xl font-bold">{report.summary.totalEndingStock}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 font-medium text-sm">No</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Produk</th>
                <th className="text-left py-3 px-4 font-medium text-sm">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Kategori</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Stok Awal</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-green-500">Masuk</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-red-500">Keluar</th>
                <th className="text-right py-3 px-4 font-medium text-sm">Stok Akhir</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-[var(--foreground-muted)]" />
                    <p className="text-[var(--foreground-muted)]">Memuat data...</p>
                  </td>
                </tr>
              ) : report?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
                    <p className="text-[var(--foreground-muted)]">Tidak ada data untuk periode ini</p>
                  </td>
                </tr>
              ) : (
                report?.items.map((item, index) => (
                  <motion.tr
                    key={item.productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.productName}</p>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{item.sku}</td>
                    <td className="py-3 px-4 text-sm">{item.category}</td>
                    <td className="py-3 px-4 text-sm text-right">{item.beginningStock}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      {item.stockIn > 0 && (
                        <span className="text-green-500 font-medium">+{item.stockIn}</span>
                      )}
                      {item.stockIn === 0 && '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {item.stockOut > 0 && (
                        <span className="text-red-500 font-medium">-{item.stockOut}</span>
                      )}
                      {item.stockOut === 0 && '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold">{item.endingStock}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
            {report && report.items.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--surface)] font-bold">
                  <td colSpan={4} className="py-3 px-4">TOTAL</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right text-green-500">+{report.summary.totalStockIn}</td>
                  <td className="py-3 px-4 text-right text-red-500">-{report.summary.totalStockOut}</td>
                  <td className="py-3 px-4 text-right">{report.summary.totalEndingStock}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
