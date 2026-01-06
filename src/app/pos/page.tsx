'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { ProductGrid, CartPanel, PaymentModal } from '@/components/pos';
import { PaymentMethod, Product, Category } from '@/types';
import { productsAPI, transactionsAPI, categoriesAPI } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { Scan, CheckCircle, XCircle } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'ready' | 'success' | 'error'>('ready');
  const [lastScannedProduct, setLastScannedProduct] = useState<string>('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  // Fetch products & categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchQuery, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await productsAPI.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentMethod: PaymentMethod, paidAmount: number) => {
    try {
      const {
        items,
        customerName,
        customerId,
        getSubtotal,
        getTaxAmount,
        getDiscountAmount,
        getTotal,
      } = useCartStore.getState();

      // Prepare transaction data
      const transactionData = {
        customerName: customerName || undefined,
        customerId: customerId || undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        subtotal: getSubtotal(),
        taxAmount: getTaxAmount(),
        discountAmount: getDiscountAmount(),
        totalAmount: getTotal(),
        paidAmount,
        paymentMethod,
      };

      // Save to database
      const response = await transactionsAPI.create(transactionData);
      
      console.log('Transaction saved successfully:', response.data);
      
      // TODO: Print receipt
      // TODO: Open cash drawer if CASH
      
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Gagal menyimpan transaksi. Silakan coba lagi.');
    }
  };

  // Barcode scanner handler
  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      setScanStatus('ready');
      const response = await productsAPI.getByBarcode(barcode.trim());
      const product = response.data.data;

      if (product) {
        addItem(product);
        setScanStatus('success');
        setLastScannedProduct(product.name);
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setScanStatus('ready');
          setLastScannedProduct('');
        }, 2000);
      }
    } catch (error) {
      console.error('Product not found:', error);
      setScanStatus('error');
      setLastScannedProduct('Produk tidak ditemukan');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setScanStatus('ready');
        setLastScannedProduct('');
      }, 2000);
    } finally {
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }
  };

  // Listen for Enter key (USB scanners send Enter after barcode)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeInput.trim() && document.activeElement === barcodeInputRef.current) {
        e.preventDefault();
        handleBarcodeSubmit(barcodeInput.trim());
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [barcodeInput]);

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-48px)] gap-0">
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col pr-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Kasir (POS)</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Pilih produk untuk menambahkan ke keranjang
            </p>
          </div>

          {/* Search and Barcode Scanner */}
          <div className="mb-6 space-y-4">
            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk berdasarkan nama atau SKU..."
            />
            
            {/* Barcode Scanner Indicator */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Scan className={`${
                  scanStatus === 'success' ? 'text-green-500' :
                  scanStatus === 'error' ? 'text-red-500' :
                  'text-[var(--primary)]'
                }`} size={20} />
                <div>
                  <div className="text-sm font-medium">
                    {scanStatus === 'success' && 'Produk Ditambahkan!'}
                    {scanStatus === 'error' && 'Barcode Tidak Ditemukan'}
                    {scanStatus === 'ready' && 'Scanner Ready'}
                  </div>
                  {lastScannedProduct && (
                    <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {lastScannedProduct}
                    </div>
                  )}
                </div>
              </div>
              
              {scanStatus === 'success' && <CheckCircle className="text-green-500" size={20} />}
              {scanStatus === 'error' && <XCircle className="text-red-500" size={20} />}
            </div>
            
            {/* Hidden barcode input (always focused for USB scanner) */}
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="sr-only" 
              placeholder="Scan barcode..."
              aria-label="Barcode scanner input"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <ProductGrid products={products} isLoading={isLoading} />
          </div>
        </div>

        {/* Right: Cart Panel */}
        <CartPanel onCheckout={handleCheckout} />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
}
