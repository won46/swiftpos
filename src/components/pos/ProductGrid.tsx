'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { getImageUrl } from '@/services/api';

// Unit conversion helper
const UNIT_MULTIPLIERS: Record<string, number> = {
  pcs: 1,
  lusin: 12,
  kodi: 20,
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const productWithUnits = product as Product & {
    saleUnits?: string[];
    pricePerUnit?: Record<string, number>;
    purchaseUnitQty?: number;
  };

  const saleUnits = productWithUnits.saleUnits || ['pcs'];
  const pricePerUnit = productWithUnits.pricePerUnit || {};
  const purchaseUnitQty = productWithUnits.purchaseUnitQty || 1;

  const handleClick = () => {
    if (saleUnits.length > 1) {
      setShowUnitModal(true);
    } else {
      addItem(product);
    }
  };

  const handleSelectUnit = (unit: string) => {
    // Calculate the quantity multiplier for this unit
    let qtyMultiplier = UNIT_MULTIPLIERS[unit] || purchaseUnitQty;
    if (unit === 'dus') {
      qtyMultiplier = purchaseUnitQty;
    }

    // Get price for this unit
    const unitPrice = unit === 'pcs' 
      ? Number(product.price) 
      : (pricePerUnit[unit] || Number(product.price) * qtyMultiplier);

    // Add item with custom unit info
    addItem(product, 1, unit, unitPrice, qtyMultiplier);
    setShowUnitModal(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isLowStock = product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.stockQuantity === 0;
  const imageUrl = getImageUrl(product.imageUrl);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`product-card ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={isOutOfStock ? undefined : handleClick}
      >
        <div className="product-card-image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={32} className="text-[var(--foreground-muted)]" />
          )}
        </div>
        
        <h3 className="product-card-name" title={product.name}>
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1 mb-1.5 overflow-hidden">
           {product.category?.name && (
              <span className="text-[9px] font-medium text-[var(--foreground-muted)] bg-[var(--surface-hover)] px-1.5 py-0.5 rounded-full border border-[var(--border)] max-w-full truncate">
                {product.category.name}
              </span>
           )}
           {product.size && (
              <span className="text-[9px] font-medium text-[var(--foreground)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                {product.size}
              </span>
           )}
           {product.color && (
              <span className="text-[9px] font-medium text-[var(--foreground)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full border border-[var(--border)] shadow-sm" style={{ backgroundColor: product.color }}></span>
                {product.color}
              </span>
           )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="product-card-price">{formatPrice(Number(product.price))}</span>
          {saleUnits.length > 1 && (
            <span className="badge badge-info text-[10px]">{saleUnits.length} satuan</span>
          )}
          {isLowStock && !isOutOfStock && saleUnits.length === 1 && (
            <span className="badge badge-warning text-[10px]">Stok: {product.stockQuantity}</span>
          )}
          {isOutOfStock && (
            <span className="badge badge-danger text-[10px]">Habis</span>
          )}
        </div>
      </motion.div>

      {/* Unit Selection Modal */}
      <AnimatePresence>
        {showUnitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUnitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Pilih Satuan</h3>
                <button 
                  onClick={() => setShowUnitModal(false)}
                  className="p-1 hover:bg-[var(--surface)] rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-[var(--foreground-muted)] mb-4">{product.name}</p>
              
              <div className="space-y-2">
                {saleUnits.map((unit) => {
                  let qtyMultiplier = UNIT_MULTIPLIERS[unit] || purchaseUnitQty;
                  if (unit === 'dus') qtyMultiplier = purchaseUnitQty;
                  
                  const unitPrice = unit === 'pcs' 
                    ? Number(product.price) 
                    : (pricePerUnit[unit] || Number(product.price) * qtyMultiplier);
                  
                  return (
                    <motion.button
                      key={unit}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectUnit(unit)}
                      className="w-full p-4 rounded-xl border-2 border-[var(--border)] hover:border-[var(--primary)] flex justify-between items-center transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-medium capitalize">{unit}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {unit === 'pcs' ? '1 satuan' : `${qtyMultiplier} pcs`}
                        </p>
                      </div>
                      <p className="font-bold text-[var(--primary)]">{formatPrice(unitPrice)}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Product Grid Component
interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="product-card">
            <div className="product-card-image skeleton" />
            <div className="h-4 skeleton rounded mt-2" />
            <div className="h-5 skeleton rounded mt-2 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package size={48} className="text-[var(--foreground-muted)] mb-4" />
        <h3 className="text-lg font-medium mb-2">Tidak ada produk</h3>
        <p className="text-sm text-[var(--foreground-muted)]">
          Produk yang Anda cari tidak ditemukan
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
