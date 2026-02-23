'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Banknote,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { customersAPI, transactionsAPI } from '@/services/api';
import { Customer, Transaction, PaymentMethod } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'debt'>('debt');
  
  // Repayment Modal State
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('CASH');
  const [repayNotes, setRepayNotes] = useState('');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const response = await customersAPI.getById(id);
      // Backend returns { customer: ..., transactions: ... } or just customer object with transactions?
      // Based on controller: res.json({ status: true, data: { ...customer, transactions } })
      setCustomer(response.data.data);
      setTransactions(response.data.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
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

  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: idLocale });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Lunas</span>;
      case 'UNPAID':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Belum Lunas</span>;
      case 'PARTIAL':
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Cicilan</span>;
      case 'VOID':
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">Batal</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{status}</span>;
    }
  };

  const handleRepayClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // Suggest full remaining amount
    const remaining = (transaction as any).remainingAmount || 0; // Assuming backend sends this or we calculate
    // If backend doesn't send remainingAmount in getById wrapper, we might need to rely on what is available.
    // Based on transaction.controller create: existing transaction has remainingAmount.
    setRepayAmount(remaining);
    setIsRepayModalOpen(true);
  };

  const handleRepaySubmit = async () => {
    if (!selectedTransaction) return;

    try {
      setIsSubmittingRepay(true);
      await transactionsAPI.repayDebt(selectedTransaction.id, {
        amount: repayAmount,
        paymentMethod: repayMethod as any, // Cast because 'DEBT' isn't allowed for repayment
        notes: repayNotes
      });
      
      setIsRepayModalOpen(false);
      fetchCustomerDetails(); // Refresh data
      alert('Pembayaran hutang berhasil!');
    } catch (error) {
      console.error('Failed to repay debt:', error);
      alert('Gagal memproses pembayaran.');
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  if (isLoading) {
     return (
        <DashboardLayout>
           <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        </DashboardLayout>
     );
  }

  if (!customer) {
    return (
        <DashboardLayout>
           <div className="text-center py-10">
              <h2 className="text-xl font-bold">Pelanggan tidak ditemukan</h2>
              <Button variant="secondary" onClick={() => router.back()} className="mt-4">
                 Kembali
              </Button>
           </div>
        </DashboardLayout>
    );
  }

  const debts = transactions.filter(t => t.paymentMethod === 'DEBT' && t.status !== 'VOID' && (t as any).paymentStatus !== 'PAID');

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
           </button>
           <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">Kode: {customer.code}</p>
           </div>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={20} />
                 </div>
                 <div>
                    <h3 className="font-medium text-gray-900">Kontak</h3>
                 </div>
              </div>
              <div className="space-y-2 text-sm">
                 <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} /> <span>{customer.phone || '-'}</span>
                 </div>
                 <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} /> <span>{customer.email || '-'}</span>
                 </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={14} className="mt-0.5" /> <span className="flex-1">{customer.address || '-'}</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <CreditCard size={20} />
                 </div>
                 <div>
                    <h3 className="font-medium text-gray-900">Limit Kredit</h3>
                 </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatPrice(customer.creditLimit || 0)}</p>
              <p className="text-xs text-gray-500">Batas maksimal hutang</p>
           </div>

           <div className={`p-6 rounded-xl border shadow-sm ${customer.currentDebt > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4 mb-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${customer.currentDebt > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                    <TrendingDown size={20} />
                 </div>
                 <div>
                    <h3 className={`font-medium ${customer.currentDebt > 0 ? 'text-red-900' : 'text-gray-900'}`}>Total Hutang</h3>
                 </div>
              </div>
              <p className={`text-2xl font-bold mb-1 ${customer.currentDebt > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {formatPrice(customer.currentDebt)}
              </p>
              <p className={`text-xs ${customer.currentDebt > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                 Belum dibayar
              </p>
           </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
           <div className="flex gap-6">
              <button
                 onClick={() => setActiveTab('debt')}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'debt' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
              >
                 <AlertCircle size={16} />
                 Tagihan Aktif ({debts.length})
              </button>
              <button
                 onClick={() => setActiveTab('history')}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'history' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
              >
                 <Clock size={16} />
                 Riwayat Transaksi
              </button>
           </div>
        </div>

        {/* Content */}
        {activeTab === 'debt' && (
           <div className="space-y-4">
              {debts.length === 0 ? (
                 <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">Tidak Ada Tagihan</h3>
                    <p className="text-gray-500">Pelanggan ini tidak memiliki tunggakan hutang.</p>
                 </div>
              ) : (
                 debts.map((transaction: any) => (
                    <div key={transaction.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <span className="font-bold text-gray-900 text-lg">#{transaction.invoiceNumber}</span>
                             <span className="text-sm text-gray-500">{formatDate(transaction.transactionDate)}</span>
                             {getStatusBadge(transaction.paymentStatus)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                             <div>
                                Total: <span className="font-medium">{formatPrice(transaction.totalAmount)}</span>
                             </div>
                             <div>
                                Sudah Bayar: <span className="font-medium text-green-600">{formatPrice(transaction.paidAmount)}</span>
                             </div>
                             <div>
                                Sisa: <span className="font-bold text-red-600">{formatPrice(transaction.remainingAmount)}</span>
                             </div>
                          </div>
                          {transaction.dueDate && (
                             <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <Clock size={12} /> Jatuh Tempo: {formatDate(transaction.dueDate)}
                             </div>
                          )}
                       </div>
                       
                       <Button 
                          onClick={() => handleRepayClick(transaction)}
                          className="shrink-0"
                          variant="primary"
                       >
                          Bayar Hutang
                       </Button>
                    </div>
                 ))
              )}
           </div>
        )}

        {activeTab === 'history' && (
           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                       <th className="px-6 py-3 font-medium">Invoice</th>
                       <th className="px-6 py-3 font-medium">Tanggal</th>
                       <th className="px-6 py-3 font-medium">Metode</th>
                       <th className="px-6 py-3 font-medium">Total</th>
                       <th className="px-6 py-3 font-medium text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                             Belum ada transaksi
                          </td>
                       </tr>
                    ) : (
                       transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                             <td className="px-6 py-3 font-medium">{t.invoiceNumber}</td>
                             <td className="px-6 py-3 text-gray-500">{formatDate(t.transactionDate)}</td>
                             <td className="px-6 py-3">
                                <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium border border-gray-200">
                                   {t.paymentMethod}
                                </span>
                             </td>
                             <td className="px-6 py-3">{formatPrice(t.totalAmount)}</td>
                             <td className="px-6 py-3 text-center">
                                {getStatusBadge((t as any).paymentStatus || 'PAID')} 
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        )}
      </div>

      {/* Repay Modal */}
      <Modal 
         isOpen={isRepayModalOpen} 
         onClose={() => setIsRepayModalOpen(false)}
         title="Pembayaran Hutang"
      >
         {selectedTransaction && (
            <div className="p-4 space-y-4">
               <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
                  <p>Invoice: <span className="font-bold text-gray-900">#{selectedTransaction.invoiceNumber}</span></p>
                  <p>Sisa Hutang: <span className="font-bold text-red-600">{formatPrice((selectedTransaction as any).remainingAmount)}</span></p>
               </div>

               <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Pembayaran</label>
                  <input 
                     type="number"
                     value={repayAmount}
                     onChange={(e) => setRepayAmount(Number(e.target.value))}
                     className="input w-full"
                     max={(selectedTransaction as any).remainingAmount}
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                  <select 
                     value={repayMethod}
                     onChange={(e) => setRepayMethod(e.target.value as PaymentMethod)}
                     className="input w-full"
                  >
                     <option value="CASHLESS">Non Tunai</option>
                     <option value="TRANSFER">Transfer</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                  <textarea 
                     value={repayNotes}
                     onChange={(e) => setRepayNotes(e.target.value)}
                     className="input w-full"
                     rows={2}
                  />
               </div>

               <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" onClick={() => setIsRepayModalOpen(false)}>Batal</Button>
                  <Button 
                     variant="primary" 
                     onClick={handleRepaySubmit}
                     isLoading={isSubmittingRepay}
                     disabled={repayAmount <= 0 || repayAmount > (selectedTransaction as any).remainingAmount}
                  >
                     Bayar Sekarang
                  </Button>
               </div>
            </div>
         )}
      </Modal>
    </DashboardLayout>
  );
}
