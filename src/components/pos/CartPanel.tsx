'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, X, Percent, User, Search } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui';
import { useState, useRef, useEffect } from 'react';
import { CustomerSelector } from './CustomerSelector';

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const {
    items,
    customerName,
    customerId,
    discountPercent,
    setCustomer,
    setCustomerName, // Keep if you still want manual entry fallback? Or remove?
    setDiscount,
    updateQuantity,
    removeItem,
    setItemDiscount,
    setItemDiscountPercent,
    clearCart,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  
  // Refs for quantity inputs
  const quantityInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  
  // Auto-focus on last added item's quantity input
  useEffect(() => {
    if (lastAddedItemId && quantityInputRefs.current[lastAddedItemId]) {
      quantityInputRefs.current[lastAddedItemId]?.focus();
      quantityInputRefs.current[lastAddedItemId]?.select();
      setLastAddedItemId(null);
    }
  }, [lastAddedItemId, items]);
  
  // Track when new item is added
  const prevItemCountRef = useRef(items.length);
  useEffect(() => {
    if (items.length > prevItemCountRef.current && items.length > 0) {
      // New item added, focus on its quantity
      const lastItem = items[items.length - 1];
      setLastAddedItemId(lastItem.productId);
    }
    prevItemCountRef.current = items.length;
  }, [items.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="cart-panel">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[var(--primary)]" />
            <h2 className="font-semibold">Keranjang</h2>
            {getItemCount() > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center">
                {getItemCount()}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[var(--danger)] hover:underline"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="relative">
             <div 
              onClick={() => setIsCustomerSelectorOpen(true)}
              className="flex items-center w-full min-h-[38px] px-3 py-2 text-sm border rounded-lg cursor-pointer hover:border-[var(--primary)] transition-colors bg-white relative"
             >
               <User size={16} className="text-[var(--foreground-muted)] mr-2" />
               <span className={customerName ? 'text-gray-900' : 'text-gray-400'}>
                 {customerName || 'Pilih Pelanggan...'}
               </span>
               {customerName && (
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomer(null, '');
                  }}
                  className="absolute right-2 p-1 hover:bg-gray-100 rounded-full"
                 >
                   <X size={14} className="text-gray-500" />
                 </button>
               )}
             </div>
        </div>
        
        <CustomerSelector 
          isOpen={isCustomerSelectorOpen}
          onClose={() => setIsCustomerSelectorOpen(false)}
          onSelect={(customer) => setCustomer(customer.id, customer.name)}
          selectedCustomerId={customerId}
        />
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full py-12 text-center"
            >
              <ShoppingCart size={48} className="text-[var(--foreground-muted)] mb-4 opacity-50" />
              <p className="text-sm text-[var(--foreground-muted)]">Keranjang kosong</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Klik produk untuk menambahkan</p>
            </motion.div>
          ) : (
            items.map((item) => {
              const unitType = (item as any).unitType || 'pcs';
              return (
              <motion.div
                key={`${item.productId}-${unitType}`}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="cart-item flex-col !items-stretch"
              >
                {/* Row 1: Image + Name + Delete */}
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-sm">📦</span>
                    )}
                  </div>
                  <p 
                    className="flex-1 text-sm font-medium leading-tight"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.product.name}
                  </p>
                  {(item.product.size || item.product.color) && (
                    <div className="flex gap-1.5 mt-0.5">
                      {item.product.size && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--foreground-muted)] border border-[var(--border)]">
                          {item.product.size}
                        </span>
                      )}
                      {item.product.color && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.product.color }}></span>
                          {item.product.color}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(item.productId, unitType)}
                    className="text-[var(--danger)] hover:bg-[var(--danger-bg)] p-1 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {/* Row 2: Price x Qty = Total */}
                <div className="flex items-center justify-between pl-12 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--foreground-muted)]">{formatPrice(item.unitPrice)}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">×</span>
                    <div className="flex items-center gap-1">
                      <button
                        tabIndex={-1}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, unitType)}
                        className="w-5 h-5 rounded bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)]"
                      >
                        <Minus size={10} />
                      </button>
                      <input
                        type="number"
                        ref={(el) => { quantityInputRefs.current[item.productId] = el; }}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1, unitType)}
                        className="w-10 text-center text-xs font-semibold input py-0.5"
                        min="1"
                      />
                      <button
                        tabIndex={-1}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, unitType)}
                        className="w-5 h-5 rounded bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)]"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)]">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>

                {/* Row 3: Discount Input (Below) */}
                <div className="pl-12 mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Diskon:</span>
                    <div className="flex items-center gap-0.5 border border-[var(--border)] rounded px-2 bg-white focus-within:border-[var(--primary)] transition-colors">
                      <input
                        type="number"
                        value={(item as any).discountPercent || 0}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          setItemDiscountPercent(item.productId, unitType, val);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-10 text-center text-xs font-bold bg-transparent focus:outline-none py-1"
                        min="0"
                        max="100"
                      />
                      <span className="text-[10px] font-bold text-[var(--foreground-muted)]">%</span>
                    </div>
                  </div>
                  
                  {(item as any).discount > 0 && (
                    <span className="text-[10px] text-[var(--success)] font-bold bg-[var(--success-bg)] px-2 py-0.5 rounded">
                      Potongan -{formatPrice((item as any).discount)}
                    </span>
                  )}
                </div>
              </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Summary & Checkout */}
      {items.length > 0 && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background-tertiary)]">
          {/* Discount Toggle (Global) */}
          <button
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-3 transition-colors"
          >
            <Percent size={14} />
            <span>Tambah Diskon</span>
          </button>

          <AnimatePresence>
            {showDiscountInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="input py-2 text-sm w-20"
                    placeholder="0"
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Price Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">Subtotal Gross</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            {getDiscountAmount() > 0 && (
              <div className="flex justify-between text-sm text-[var(--success)]">
                <span>Total Diskon</span>
                <span>-{formatPrice(getDiscountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
              <span>Total</span>
              <span className="text-[var(--primary)]">{formatPrice(getTotal())}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full gradient-primary animate-pulse-glow"
            onClick={onCheckout}
          >
            <ShoppingCart size={20} />
            Bayar Sekarang
          </Button>
        </div>
      )}
    </div>
  );
}
