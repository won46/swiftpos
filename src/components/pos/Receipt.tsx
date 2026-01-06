'use client';

import { Transaction } from '@/types';

interface ReceiptProps {
  transaction: Transaction;
}

export function Receipt({ transaction }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(typeof date === 'string' ? new Date(date) : date);
  };

  return (
    <div className="receipt-container">
      {/* Header */}
      <div className="receipt-header">
        <h1>SWIFTPOS</h1>
        <p>Modern Point of Sales System</p>
        <p>Jl. Raya Bisnis No. 123, Jakarta</p>
        <p>Telp: (021) 1234-5678</p>
      </div>

      <div className="receipt-divider">================================</div>

      {/* Transaction Info */}
      <div className="receipt-info">
        <p><strong>Invoice:</strong> {transaction.invoiceNumber}</p>
        <p><strong>Tanggal:</strong> {formatDateTime(transaction.transactionDate)}</p>
        <p><strong>Kasir:</strong> {transaction.user?.fullName || 'N/A'}</p>
        {transaction.customerName && (
          <p><strong>Customer:</strong> {transaction.customerName}</p>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Items */}
      <table className="receipt-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items?.map((item, idx) => (
            <tr key={idx}>
              <td>{item.product?.name || 'Product'}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.unitPrice)}</td>
              <td>{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider">================================</div>

      {/* Totals */}
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        <div className="total-row">
          <span>PPN (11%):</span>
          <span>{formatCurrency(transaction.taxAmount)}</span>
        </div>
        {transaction.discountAmount > 0 && (
          <div className="total-row">
            <span>Diskon:</span>
            <span>-{formatCurrency(transaction.discountAmount)}</span>
          </div>
        )}
        <div className="receipt-divider">--------------------------------</div>
        <div className="total-row grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
      </div>

      <div className="receipt-divider">================================</div>

      {/* Payment */}
      <div className="receipt-payment">
        <div className="total-row">
          <span>Pembayaran:</span>
          <span>{transaction.paymentMethod}</span>
        </div>
        {transaction.paidAmount && (
          <>
            <div className="total-row">
              <span>Bayar:</span>
              <span>{formatCurrency(transaction.paidAmount)}</span>
            </div>
            {transaction.changeAmount !== undefined && transaction.changeAmount > 0 && (
              <div className="total-row">
                <span>Kembali:</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Footer */}
      <div className="receipt-footer">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
        <p>--- STRUK INI SAH ---</p>
      </div>
    </div>
  );
}
