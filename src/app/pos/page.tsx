'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal } from '@/components/ui';
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
  const [scanStatus, setScanStatus] = useState<'ready' | 'success' | 'error'>('ready');
  const [lastScannedProduct, setLastScannedProduct] = useState<string>('');
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  const handlePaymentComplete = async (paymentMethod: PaymentMethod, paidAmount: number, splitPayments?: any[]) => {
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
        payments: splitPayments, // Pass split payments if any
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
      setNotFoundBarcode(barcode);
    }
  };

  const handleManualSearch = () => {
    if (notFoundBarcode) {
      setSearchQuery(notFoundBarcode);
      setNotFoundBarcode(null);
      // Small delay to ensure modal is closed and input is visible/interactive
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleCloseModal = () => {
    setNotFoundBarcode(null);
    // Return focus to body so scanner can work again
    document.body.focus();
  };

  // Global Barcode Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (search, quantity, or modal inputs)
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && 
        !notFoundBarcode // Allow scanning even if modal is open? No, probably confusing.
      ) {
        return;
      }
      
      // If modal is open, ignore scanner input to prevent infinite loops or confusion
      if (notFoundBarcode) return;

      const currentTime = Date.now();
      
      // If time between keys is too long, reset buffer (it's manual typing, not scanner)
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim()) {
          e.preventDefault();
          handleBarcodeSubmit(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Only append printable characters
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notFoundBarcode]); // depend on notFoundBarcode to pause listener when modal is open

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
              ref={searchInputRef}
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

      {/* Product Not Found Modal */}
      <Modal
        isOpen={!!notFoundBarcode}
        onClose={handleCloseModal}
        title="Produk Tidak Ditemukan"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <Scan size={24} />
            </div>
            <p>
              Barang dengan barcode <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-sm">{notFoundBarcode}</span> tidak ada di stok.
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Apakah Anda ingin mencari produk ini secara manual?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button onClick={handleManualSearch}>
              Cari Manual
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
