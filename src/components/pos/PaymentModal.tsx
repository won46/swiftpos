'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Banknote, QrCode, CheckCircle, Printer, X, Clock, AlertCircle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { PaymentMethod } from '@/types';
import { paymentsAPI } from '@/services/api';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (paymentMethod: PaymentMethod, paidAmount: number) => void;
}

const paymentMethods = [
  { id: 'CASH' as PaymentMethod, label: 'Tunai', icon: Banknote, color: 'var(--success)' },
  { id: 'CARD' as PaymentMethod, label: 'Kartu', icon: CreditCard, color: 'var(--info)' },
  { id: 'QRIS' as PaymentMethod, label: 'QRIS', icon: QrCode, color: 'var(--primary)' },
  { id: 'DEBT' as PaymentMethod, label: 'Kasbon', icon: Clock, color: 'var(--warning)' },
];

const quickAmounts = [50000, 100000, 150000, 200000, 500000, 1000000];

export function PaymentModal({ isOpen, onClose, onComplete }: PaymentModalProps) {
  const { items, getTotal, clearCart, customerName, customerId } = useCartStore();
  const total = getTotal();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // QRIS State
  const [qrisData, setQrisData] = useState<{
    orderId: string;
    qrCodeUrl: string | null;
    qrString: string | null;
    expiryTime: string;
  } | null>(null);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const changeAmount = paidAmount - total;
  
  // Validation for payment capability
  const canPay = selectedMethod && 
    (selectedMethod !== 'CASH' || paidAmount >= total) &&
    (selectedMethod !== 'DEBT' || customerId !== null);

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const startQrisPolling = (orderId: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const response = await paymentsAPI.checkStatus(orderId);
        const status = response.data.data.transactionStatus;

        if (status === 'settlement' || status === 'capture') {
          // Payment successful
          if (pollInterval.current) clearInterval(pollInterval.current);
          handlePaymentSuccess('QRIS', total);
        } else if (status === 'expire' || status === 'cancel' || status === 'deny') {
          // Payment failed
          if (pollInterval.current) clearInterval(pollInterval.current);
          setQrisError('Pembayaran kadaluarsa atau dibatalkan.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  const handleMethodSelect = async (methodId: PaymentMethod) => {
    setSelectedMethod(methodId);
    setQrisData(null);
    setQrisError(null);
    if (pollInterval.current) clearInterval(pollInterval.current);

    if (methodId === 'QRIS') {
      try {
        setIsProcessing(true);
        // Transform cart items for API
        const transactionItems = items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        const response = await paymentsAPI.createQris({
          amount: total,
          items: transactionItems,
          customerName: customerName || 'Guest',
        });

        const data = response.data.data;
        setQrisData(data);
        startQrisPolling(data.orderId);
        setPaidAmount(total); // Auto set amount
      } catch (error: any) {
        console.error('Failed to create QRIS:', error);
        const message = error.response?.data?.message || 'Gagal membuat QRIS. Silakan coba lagi.';
        setQrisError(message);
      } finally {
        setIsProcessing(false);
      }
    } else if (methodId !== 'CASH') {
      setPaidAmount(total);
    } else {
      setPaidAmount(0);
    }
  };

  const handlePaymentSuccess = (method: PaymentMethod, amount: number) => {
    setIsComplete(true);
    setIsProcessing(false);
    
    setTimeout(() => {
      onComplete(method, amount);
      clearCart();
      handleClose();
    }, 2000);
  };

  const handlePayment = async () => {
    if (!canPay || !selectedMethod) return;

    setIsProcessing(true);

    // Simulate payment processing for non-QRIS
    await new Promise((resolve) => setTimeout(resolve, 1500));

    handlePaymentSuccess(selectedMethod, paidAmount);
  };
  
  // For manual check/confirmation of QRIS if polling fails or user wants to force check
  const handleManualQrisCheck = async () => {
    if (!qrisData?.orderId) return;
    
    setIsProcessing(true);
    try {
      const response = await paymentsAPI.checkStatus(qrisData.orderId);
      const status = response.data.data.transactionStatus;
      
      if (status === 'settlement' || status === 'capture') {
        handlePaymentSuccess('QRIS', total);
      } else {
        setQrisError(`Status pembayaran: ${status} (Belum berhasil)`);
        setTimeout(() => setQrisError(null), 3000);
      }
    } catch (error) {
      setQrisError('Gagal mencek status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = async () => {
    // If QRIS is pending, cancel it to be safe
    if (selectedMethod === 'QRIS' && qrisData?.orderId && !isComplete) {
       try {
         await paymentsAPI.cancelPayment(qrisData.orderId);
       } catch (e) {
         console.warn('Failed to cancel QRIS on close', e);
       }
    }

    if (pollInterval.current) clearInterval(pollInterval.current);
    setSelectedMethod(null);
    setPaidAmount(0);
    setIsProcessing(false);
    setIsComplete(false);
    setQrisData(null);
    setQrisError(null);
    onClose();
  };

  const handleQuickAmount = (amount: number) => {
    setPaidAmount(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={40} className="text-[var(--success)]" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Pembayaran Berhasil!</h2>
            <p className="text-[var(--foreground-muted)] mb-4">{formatPrice(total)}</p>
            {selectedMethod === 'CASH' && changeAmount > 0 && (
              <div className="p-4 rounded-xl bg-[var(--success-bg)] inline-block">
                <p className="text-sm text-[var(--foreground-muted)]">Kembalian</p>
                <p className="text-2xl font-bold text-[var(--success)]">{formatPrice(changeAmount)}</p>
              </div>
            )}
            {selectedMethod === 'DEBT' && (
              <div className="p-4 rounded-xl bg-[var(--warning-bg)] inline-block">
                <p className="text-sm text-[var(--warning)] font-medium">Dicatat sebagai Kasbon/Hutang</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{customerName}</p>
              </div>
            )}
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="secondary" icon={Printer}>
                Cetak Struk
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Pembayaran</h2>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--surface)]">
                <X size={20} />
              </button>
            </div>

            {/* Total Amount */}
            <div className="text-center p-6 rounded-xl bg-[var(--background-tertiary)] mb-6">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold gradient-text">{formatPrice(total)}</p>
            </div>

            {/* Payment Method Selection */}
            <p className="text-sm font-medium mb-3">Metode Pembayaran</p>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMethodSelect(method.id)}
                  disabled={isProcessing && selectedMethod !== method.id}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-24 ${
                    selectedMethod === method.id
                      ? 'border-[var(--primary)] bg-[rgba(99,102,241,0.1)]'
                      : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                  } ${isProcessing && selectedMethod !== method.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <method.icon
                    size={24}
                    style={{ color: selectedMethod === method.id ? method.color : 'var(--foreground-muted)' }}
                  />
                  <span className="text-sm font-medium">{method.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Debt Warning */}
            {selectedMethod === 'DEBT' && !customerId && (
               <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                 <X size={16} className="mt-0.5 flex-shrink-0" />
                 <p>Pilih pelanggan terlebih dahulu untuk melakukan Kasbon.</p>
               </div>
            )}
            
            {selectedMethod === 'DEBT' && customerId && (
               <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
                 <Clock size={16} className="mt-0.5 flex-shrink-0" />
                 <div>
                    <p className="font-medium">Konfirmasi Kasbon</p>
                    <p>Transaksi ini akan dicatat sebagai hutang atas nama <b>{customerName}</b>.</p>
                 </div>
               </div>
            )}

            {/* Cash Input */}
            <AnimatePresence mode="wait">
              {selectedMethod === 'CASH' && (
                <motion.div
                  key="cash"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                   <p className="text-sm font-medium mb-3">Uang Diterima</p>
                  <input
                    type="text"
                    value={paidAmount ? paidAmount.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      setPaidAmount(Number(numericValue));
                    }}
                    className="input text-center text-xl font-bold mb-3"
                    placeholder="0"
                  />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickAmount(amount)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          paidAmount === amount
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                  </div>
                  {paidAmount >= total && (
                    <div className="p-3 rounded-lg bg-[var(--success-bg)] flex justify-between items-center">
                      <span className="text-sm">Kembalian</span>
                      <span className="font-bold text-[var(--success)]">{formatPrice(changeAmount)}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {selectedMethod === 'QRIS' && (
                <motion.div
                   key="qris"
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden"
                >
                   {qrisError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                         <AlertCircle size={16} />
                         <p>{qrisError}</p>
                      </div>
                   )}

                   <div className="p-6 rounded-xl bg-white flex flex-col items-center border border-[var(--border)]">
                    {isProcessing && !qrisData ? (
                        <div className="h-48 flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm text-gray-500">Membuat QR Code...</p>
                        </div>
                    ) : (
                      <>
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-3">
                          {qrisData?.qrCodeUrl ? (
                             <img 
                               src={qrisData.qrCodeUrl}
                               alt="QRIS QR Code"
                               className="w-full h-full object-contain"
                             />
                          ) : qrisData?.qrString ? (
                             <QRCodeSVG value={qrisData.qrString} size={192} />
                          ) : (
                             <div className="flex flex-col items-center text-gray-400">
                               <QrCode size={48} />
                               <p className="text-xs mt-2">QR gagal dimuat</p>
                             </div>
                          )}
                        </div>
                        
                        <p className="text-lg font-bold text-gray-800 mb-1">
                          {formatPrice(total)}
                        </p>
                        <p className="text-sm text-gray-600 text-center mb-4">
                          Scan QR Code dengan GoPay / OVO / Dana / BCA
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-current" />
                          Menunggu pembayaran otomatis...
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pay Button for NON-QRIS ONLY */}
            {selectedMethod !== 'QRIS' && (
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6 gradient-primary"
                disabled={!canPay}
                isLoading={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? 'Memproses...' : (selectedMethod === 'DEBT' ? 'Catat Kasbon' : 'Konfirmasi Pembayaran')}
              </Button>
            )}
            
            {/* Additional Manual Check Button for QRIS if needed */}
            {selectedMethod === 'QRIS' && qrisData && (
               <Button
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                onClick={handleManualQrisCheck}
                disabled={isProcessing}
              >
                Cek Status Manual
              </Button>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
