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
  onComplete: (paymentMethod: PaymentMethod, paidAmount: number, splitPayments?: any[]) => void;
}

const paymentMethods = [
  { id: 'CASH' as PaymentMethod, label: 'Tunai', icon: Banknote, color: 'var(--success)' },
  { id: 'CARD' as PaymentMethod, label: 'Kartu', icon: CreditCard, color: 'var(--info)' },
  { id: 'QRIS' as PaymentMethod, label: 'QRIS', icon: QrCode, color: 'var(--primary)' },
  { id: 'DEBT' as PaymentMethod, label: 'Kasbon', icon: Clock, color: 'var(--warning)' },
  { id: 'SPLIT' as PaymentMethod, label: 'Pisah Bayar', icon: CheckCircle, color: '#8B5CF6' },
];

const quickAmounts = [50000, 100000, 150000, 200000, 500000, 1000000];

export function PaymentModal({ isOpen, onClose, onComplete }: PaymentModalProps) {
  const { items, getTotal, clearCart, customerName, customerId } = useCartStore();
  const total = getTotal();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Split Bill State
  const [splitPayments, setSplitPayments] = useState<{
      method: PaymentMethod;
      amount: number;
      notes?: string;
      id: string; // Internal ID for UI
      isPaid?: boolean; // For QRIS status
      qrData?: any;
  }[]>([]);
  const [currentSplitMethod, setCurrentSplitMethod] = useState<PaymentMethod>('CASH');
  const [currentSplitAmount, setCurrentSplitAmount] = useState<number>(0);
  
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
  
  // Calculations
  const totalSplitPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingSplit = Math.max(0, total - totalSplitPaid);
  const changeAmount = selectedMethod === 'SPLIT' 
      ? 0 // No change in split mode usually, or calculated from final manual logic
      : paidAmount - total;
  
  // Validation for payment capability
  const canPay = selectedMethod && 
    (selectedMethod === 'SPLIT' ? remainingSplit <= 0 : 
    (selectedMethod !== 'CASH' || paidAmount >= total) &&
    (selectedMethod !== 'DEBT' || customerId !== null));

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const startQrisPolling = (orderId: string, isSplit = false, splitId?: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const response = await paymentsAPI.checkStatus(orderId);
        const status = response.data.data.transactionStatus;

        if (status === 'settlement' || status === 'capture') {
          if (pollInterval.current) clearInterval(pollInterval.current);
          
          if (isSplit && splitId) {
             setSplitPayments(prev => prev.map(p => 
                 p.id === splitId ? { ...p, isPaid: true } : p
             ));
          } else {
             handlePaymentSuccess('QRIS', total);
          }
        } else if (status === 'expire' || status === 'cancel' || status === 'deny') {
          if (pollInterval.current) clearInterval(pollInterval.current);
          if (!isSplit) setQrisError('Pembayaran kadaluarsa atau dibatalkan.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); 
  };

  const handleMethodSelect = async (methodId: PaymentMethod) => {
    setSelectedMethod(methodId);
    setQrisData(null);
    setQrisError(null);
    setSplitPayments([]);
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

        // Create Snap Transaction
        const response = await paymentsAPI.createSnapTransaction({
          amount: total,
          items: transactionItems,
          customerName: customerName || 'Guest',
        });

        const { token, orderId } = response.data.data;
        
        // Start polling immediately in case Snap callback fails or user pays via other means
        startQrisPolling(orderId);

        // Trigger Snap Popup
        if (window.snap) {
          window.snap.pay(token, {
            onSuccess: function(result: any) {
              console.log('Payment success:', result);
              handlePaymentSuccess('QRIS', total);
            },
            onPending: function(result: any) {
              console.log('Payment pending:', result);
              // Usually pending means they closed the popup without finishing, 
              // or chose a method like VA. 
              // We can treat this as "waiting" or let them close.
              setQrisError('Pembayaran pending. Silakan selesaikan pembayaran Anda.');
            },
            onError: function(result: any) {
              console.log('Payment error:', result);
              setQrisError('Pembayaran gagal.');
              if (pollInterval.current) clearInterval(pollInterval.current);
            },
            onClose: function() {
              console.log('Customer closed the popup without finishing the payment');
              setQrisError('Pembayaran dibatalkan.');
              // Note: We don't necessarily clear polling here because user might have paid and just closed popup.
              // But if they closed it, they probably want to cancel or retry.
              // Let's keep polling for a few more seconds or let handleClose clean it up if user clicks X on modal?
              // The user said "automatically", so maybe better to keep polling or stop?
              // Standard Snap: if close, it's pending.
              // If we stop polling, they can't see success if they paid.
              // But if they didn't pay, it loops.
              // Let's NOT clear interval here, let the Modal Close (handleClose) do it.
            }
          });
        } else {
           setQrisError('Midtrans Snap tidak dimuat. Coba refresh halaman.');
        }

      } catch (error: any) {
        console.error('Failed to create Snap transaction:', error);
        const message = error.response?.data?.message || 'Gagal membuat transaksi. Silakan coba lagi.';
        setQrisError(message);
      } finally {
        setIsProcessing(false);
      }
    } else if (methodId === 'SPLIT') {
        setCurrentSplitAmount(total);
        // ... existing split logic
        setPaidAmount(0);
    } else if (methodId !== 'CASH') {
      setPaidAmount(total);
    } else {
      setPaidAmount(0);
    }
  };

  const addSplitPayment = async () => {
     if (currentSplitAmount <= 0) return;
     
     const newPayment = {
         id: Math.random().toString(36).substr(2, 9),
         method: currentSplitMethod,
         amount: currentSplitAmount,
         isPaid: currentSplitMethod !== 'QRIS',
         qrData: null as any
     };

     if (currentSplitMethod === 'QRIS') {
         setIsProcessing(true);
         try {
            const transactionItems = [{
                productId: 'split-payment',
                name: 'Split Payment Part',
                quantity: 1,
                unitPrice: currentSplitAmount
            }];
            // Use legacy QRIS for split parts for now or Snap? 
            // Let's stick to legacy createQris for split parts to avoid popup hell
            const response = await paymentsAPI.createQris({
                amount: currentSplitAmount,
                items: transactionItems,
                customerName: customerName || 'Guest',
            });
            const data = response.data.data;
            newPayment.qrData = data;
            startQrisPolling(data.orderId, true, newPayment.id);
         } catch(e) {
             console.error(e);
             alert("Gagal membuat QRIS untuk bagian ini");
             setIsProcessing(false);
             return;
         }
         setIsProcessing(false);
     }

     setSplitPayments([...splitPayments, newPayment]);
     const newRemaining = Math.max(0, remainingSplit - currentSplitAmount);
     setCurrentSplitAmount(newRemaining);
  };

  const removeSplitPayment = (id: string) => {
      setSplitPayments(splitPayments.filter(p => p.id !== id));
  };

  const handlePaymentSuccess = (method: PaymentMethod, amount: number) => {
    setIsComplete(true);
    setIsProcessing(false);
    
    setTimeout(() => {
      onComplete(method, amount, splitPayments); 
      clearCart();
      handleClose();
    }, 2000);
  };

  const handlePayment = async () => {
    if (!canPay || !selectedMethod) return;
    
    // Validate Split
    if (selectedMethod === 'SPLIT') {
        const hasUnpaidQris = splitPayments.some(p => p.method === 'QRIS' && !p.isPaid);
        if (hasUnpaidQris) {
            if (!confirm("Ada pembayaran QRIS yang belum terverifikasi (status settlement). Lanjutkan tetap?")) {
                return;
            }
        }
    }

    setIsProcessing(true);

    // Simulate payment processing for non-QRIS
    await new Promise((resolve) => setTimeout(resolve, 1500));

    handlePaymentSuccess(selectedMethod, selectedMethod === 'SPLIT' ? total : paidAmount);
  };


  const handleClose = async () => {
    // If QRIS is pending, cancel it
    if (selectedMethod === 'QRIS' && qrisData?.orderId && !isComplete) {
       try { await paymentsAPI.cancelPayment(qrisData.orderId); } catch {}
    }

    if (pollInterval.current) clearInterval(pollInterval.current);
    setSelectedMethod(null);
    setPaidAmount(0);
    setIsProcessing(false);
    setIsComplete(false);
    setQrisData(null);
    setQrisError(null);
    setSplitPayments([]);
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
              <h2 className="text-lg font-semibold">Pembayaran {selectedMethod === 'SPLIT' && '(Pisah Bayar)'}</h2>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--surface)]">
                <X size={20} />
              </button>
            </div>

            {/* Total Amount */}
            <div className="text-center p-6 rounded-xl bg-[var(--background-tertiary)] mb-6">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold gradient-text">{formatPrice(total)}</p>
              {selectedMethod === 'SPLIT' && (
                  <p className="text-sm text-red-500 mt-2 font-medium">Sisa: {formatPrice(remainingSplit)}</p>
              )}
            </div>

            {/* Payment Method Selection */}
            <p className="text-sm font-medium mb-3">Metode Pembayaran</p>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMethodSelect(method.id)}
                  disabled={isProcessing && selectedMethod !== method.id && selectedMethod !== 'SPLIT'}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 h-20 ${
                    selectedMethod === method.id
                      ? 'border-[var(--primary)] bg-[rgba(99,102,241,0.1)]'
                      : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <method.icon
                    size={20}
                    style={{ color: selectedMethod === method.id ? method.color : 'var(--foreground-muted)' }}
                  />
                  <span className="text-xs font-medium text-center leading-tight">{method.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Debt Warning */}
            {selectedMethod === 'DEBT' && !customerId && (
               <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                 <p>Pilih pelanggan terlebih dahulu untuk melakukan Kasbon.</p>
               </div>
            )}
            
            {/* SPLIT BILL UI */}
            {selectedMethod === 'SPLIT' && (
                <div className="bg-gray-50 p-4 rounded-xl border mb-6">
                    <div className="space-y-3 mb-4">
                        {splitPayments.map((p, idx) => (
                             <div key={p.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{p.method}</p>
                                        <p className="text-xs text-gray-500">{formatPrice(p.amount)}</p>
                                    </div>
                                    {p.method === 'QRIS' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {p.isPaid ? 'Lunas' : 'Menunggu Scan'}
                                        </span>
                                    )}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => removeSplitPayment(p.id)} className="text-red-500 h-8 w-8 p-0">
                                    <X size={16} />
                                </Button>
                             </div>
                        ))}
                    </div>

                    {remainingSplit > 0 && (
                        <div className="flex items-end gap-2 p-3 bg-white border rounded-lg">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500">Metode</label>
                                <select 
                                    className="w-full mt-1 p-2 border rounded-md text-sm"
                                    value={currentSplitMethod}
                                    onChange={(e) => setCurrentSplitMethod(e.target.value as PaymentMethod)}
                                >
                                    <option value="CASH">Tunai</option>
                                    <option value="CARD">Kartu</option>
                                    <option value="QRIS">QRIS</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500">Nominal</label>
                                <input
                                   type="number"
                                   className="w-full mt-1 p-2 border rounded-md text-sm"
                                   value={currentSplitAmount}
                                   onChange={(e) => setCurrentSplitAmount(Number(e.target.value))}
                                />
                            </div>
                            <Button size="sm" onClick={addSplitPayment} disabled={currentSplitAmount <= 0}>
                                Tambah
                            </Button>
                        </div>
                    )}
                    
                    {/* Render active QRIS in Split */}
                    {splitPayments.map(p => {
                        if (p.method === 'QRIS' && !p.isPaid && p.qrData) {
                            return (
                                <div key={p.id + 'qr'} className="mt-4 p-4 bg-white border rounded-lg flex flex-col items-center">
                                    <p className="text-sm font-bold mb-2">Scan QRIS ({formatPrice(p.amount)})</p>
                                    {p.qrData.qrCodeUrl ? (
                                        <img src={p.qrData.qrCodeUrl} className="w-32 h-32 object-contain" />
                                    ) : (
                                        <QRCodeSVG value={p.qrData.qrString || ''} size={128} />
                                    )}
                                    <p className="text-xs text-blue-500 animate-pulse mt-2">Menunggu pembayaran...</p>
                                </div>
                            )
                        }
                        return null;
                    })}
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
              
              {/* QRIS Normal Mode */}
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

            {/* Pay Button for NON-QRIS ONLY or SPLIT */}
            {selectedMethod !== 'QRIS' && (
              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6 gradient-primary"
                disabled={!canPay}
                isLoading={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? 'Memproses...' : (selectedMethod === 'DEBT' ? 'Catat Kasbon' : selectedMethod === 'SPLIT' ? 'Selesaikan' : 'Konfirmasi Pembayaran')}
              </Button>
            )}
            
            {/* Additional Manual Check Button for QRIS if needed - REMOVED for Snap */ }

          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
