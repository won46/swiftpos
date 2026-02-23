'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { transactionsAPI } from '@/services/api';
import { exportTransactionsToExcel, exportReceiptToPDF } from '@/lib/exportUtils';
import { Transaction } from '@/types';
import { Calendar, Filter, Eye, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrint } from '@/hooks/usePrint';

type TransactionStatus = 'COMPLETED' | 'PENDING' | 'VOID';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransactionForReceipt, setSelectedTransactionForReceipt] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, statusFilter, selectedPayment]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      
      if (selectedPayment) params.paymentMethod = selectedPayment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      
      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk di-export');
      return;
    }
    exportTransactionsToExcel(filteredTransactions);
  };

  const { printReceipt } = usePrint();

  const handlePrintReceipt = async (transaction: Transaction) => {
    setSelectedTransactionForReceipt(transaction);
    await printReceipt(transaction);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentBadgeColors: Record<string, string> = {
    CASH: 'badge-success',
    QRIS: 'badge-info',
    CARD: 'badge-warning',
  };

  const statusBadgeColors: Record<string, string> = {
    COMPLETED: 'badge-success',
    PENDING: 'badge-warning',
    VOID: 'badge-error',
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.user?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Riwayat Transaksi</h1>
          <p className="text-[var(--foreground-muted)]">
            Lihat dan kelola semua transaksi penjualan
          </p>
        </div>


        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Cari Transaksi</label>
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice, customer, atau kasir..."
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua Metode Pembayaran</option>
                <option value="CASH">Tunai</option>
                <option value="CASHLESS">Non Tunai</option>
                <option value="DEBT">Kasbon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input w-full"
              >
                <option value="ALL">Semua Status</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Pending</option>
                <option value="VOID">Batal</option>
              </select>
            </div>
          </div>

          {/* Reset Filter */}
          {(startDate || endDate || statusFilter !== 'ALL' || selectedPayment) && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('ALL');
                  setSelectedPayment('');
                }}
                className="px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--surface-hover)] rounded-lg"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Penjualan</p>
            <p className="text-2xl font-bold gradient-text">
              {formatPrice(
                filteredTransactions.reduce((sum, t) => sum + Number(t.totalAmount), 0)
              )}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Tunai</p>
            <p className="text-2xl font-bold text-[var(--success)]">
              {filteredTransactions.filter((t) => t.paymentMethod === 'CASH').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">QRIS/Kartu</p>
            <p className="text-2xl font-bold text-[var(--info)]">
              {filteredTransactions.filter((t) => t.paymentMethod !== 'CASH').length}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Semua Transaksi</h2>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              disabled={filteredTransactions.length === 0}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat transaksi...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--foreground-muted)]">Tidak ada transaksi</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Tanggal</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Pembayaran</th>
                    <th>Status</th>
                    <th>Kasir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-medium text-[var(--primary)]">
                        {transaction.invoiceNumber}
                      </td>
                      <td className="text-[var(--foreground-muted)] text-sm">
                        {formatDate(transaction.transactionDate.toString())}
                      </td>
                      <td>{transaction.customerName || 'Walk-in'}</td>
                      <td className="text-center">{transaction.items.length}</td>
                      <td className="font-semibold">{formatPrice(transaction.totalAmount)}</td>
                      <td>
                        <span className={`badge ${paymentBadgeColors[transaction.paymentMethod]}`}>
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeColors[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--foreground-muted)]">
                        {transaction.user?.fullName}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--primary)]"
                            onClick={() => handlePrintReceipt(transaction)}
                            title="Print Receipt"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}
