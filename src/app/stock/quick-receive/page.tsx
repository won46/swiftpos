'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { productsAPI } from '@/services/api';
import { Package, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScannedItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  currentStock: number;
}

interface ResultModal {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  details?: string[];
}

export default function QuickReceivePage() {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Result modal state
  const [resultModal, setResultModal] = useState<ResultModal>({
    show: false,
    type: 'success',
    title: '',
    message: '',
    details: [],
  });
  
  // Search dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Ref for quantity inputs
  const quantityInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // New product form for modal
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    stockQuantity: '0',
    categoryId: '',
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle Enter key to trigger Update Stock
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only if Enter is pressed and we have items and not processing
      if (e.key === 'Enter' && scannedItems.length > 0 && !isProcessing) {
        // Don't trigger if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        
        // Trigger update stock
        handleUpdateStock();
      }
    };
    
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [scannedItems, isProcessing]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({});
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };
  
  // Filter products based on search
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelectProduct = (product: any) => {
    // Check if already in list
    const existingIndex = scannedItems.findIndex(item => item.productId === product.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      const newItems = [...scannedItems];
      newItems[existingIndex].quantity += 1;
      setScannedItems(newItems);
      setMessage({ type: 'success', text: `${product.name} quantity increased!` });
      
      // Focus on the existing item's quantity input
      setTimeout(() => {
        quantityInputRefs.current[existingIndex]?.focus();
        quantityInputRefs.current[existingIndex]?.select();
      }, 100);
    } else {
      // Add new item
      const newItems = [
        ...scannedItems,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode || '-',
          quantity: 1,
          currentStock: product.stockQuantity,
        },
      ];
      setScannedItems(newItems);
      setMessage({ type: 'success', text: `${product.name} added to list!` });
      
      // Focus on the new item's quantity input (last item)
      setTimeout(() => {
        const lastIndex = newItems.length - 1;
        quantityInputRefs.current[lastIndex]?.focus();
        quantityInputRefs.current[lastIndex]?.select();
      }, 100);
    }
    
    // Reset search
    setSearchQuery('');
    setShowDropdown(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleScan = async (barcode: string) => {
    setIsProcessing(true);
    setMessage(null);

    try {
      // Search product by barcode
      const response = await productsAPI.getAll({ barcode });
      const foundProducts = response.data.data;

      if (foundProducts && foundProducts.length > 0) {
        const product = foundProducts[0];
        
        // Check if already in list
        const existingIndex = scannedItems.findIndex(item => item.productId === product.id);
        
        if (existingIndex >= 0) {
          // Increment quantity
          const newItems = [...scannedItems];
          newItems[existingIndex].quantity += 1;
          setScannedItems(newItems);
          setMessage({ type: 'success', text: `${product.name} quantity increased!` });
          
          // Focus on the existing item's quantity input
          setTimeout(() => {
            quantityInputRefs.current[existingIndex]?.focus();
            quantityInputRefs.current[existingIndex]?.select();
          }, 100);
        } else {
          // Add new item
          const newItems = [
            ...scannedItems,
            {
              productId: product.id,
              productName: product.name,
              barcode: product.barcode || barcode,
              quantity: 1,
              currentStock: product.stockQuantity,
            },
          ];
          setScannedItems(newItems);
          setMessage({ type: 'success', text: `${product.name} added to list!` });
          
          // Focus on the new item's quantity input (last item)
          setTimeout(() => {
            const lastIndex = newItems.length - 1;
            quantityInputRefs.current[lastIndex]?.focus();
            quantityInputRefs.current[lastIndex]?.select();
          }, 100);
        }
      } else {
        // Product not found - open add product modal
        setScannedBarcode(barcode);
        setNewProductForm({
          ...newProductForm,
          barcode: barcode,
          sku: `SKU-${barcode.substring(0, 6)}`,
        });
        setShowAddProductModal(true);
        setMessage({ type: 'error', text: `Barcode ${barcode} not found. Please add product.` });
      }
    } catch (error) {
      console.error('Error looking up product:', error);
      setMessage({ type: 'error', text: 'Failed to lookup product' });
    } finally {
      setIsProcessing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...scannedItems];
    newItems[index].quantity = quantity;
    setScannedItems(newItems);
  };

  const removeItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (confirm('Clear all scanned items?')) {
      setScannedItems([]);
    }
  };

  const handleUpdateStock = async () => {
    if (scannedItems.length === 0) {
      setResultModal({
        show: true,
        type: 'error',
        title: 'No Items',
        message: 'Tidak ada item untuk di-update',
        details: [],
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Store items for modal before clearing
      const updatedItems = [...scannedItems];
      
      // Update stock for each item
      for (const item of scannedItems) {
        await productsAPI.adjustStock(item.productId, {
          adjustmentQuantity: item.quantity,
          reason: 'Stock receiving via barcode scan',
        });
      }

      // Show success modal with details
      setResultModal({
        show: true,
        type: 'success',
        title: 'Stock Updated!',
        message: `${updatedItems.length} produk berhasil di-update`,
        details: updatedItems.map(item => `${item.productName}: +${item.quantity} unit`),
      });
      
      setScannedItems([]);
      setMessage({ type: 'success', text: 'All stock updated!' });
      
      // Refresh products list to show updated stock
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      setResultModal({
        show: true,
        type: 'error',
        title: 'Update Failed',
        message: 'Gagal update stock. Silakan coba lagi.',
        details: [],
      });
      setMessage({ type: 'error', text: 'Failed to update stock' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await productsAPI.create({
        name: newProductForm.name,
        sku: newProductForm.sku,
        barcode: newProductForm.barcode,
        price: parseFloat(newProductForm.price),
        stockQuantity: parseInt(newProductForm.stockQuantity),
        categoryId: newProductForm.categoryId ? parseInt(newProductForm.categoryId) : undefined,
        lowStockThreshold: 5,
      });

      const newProduct = response.data.data;
      
      // Add to scanned items
      setScannedItems([
        ...scannedItems,
        {
          productId: newProduct.id,
          productName: newProduct.name,
          barcode: newProduct.barcode || scannedBarcode,
          quantity: 1,
          currentStock: newProduct.stockQuantity,
        },
      ]);

      setShowAddProductModal(false);
      setMessage({ type: 'success', text: `${newProduct.name} created and added!` });
      
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    }
  };

  const getTotalItems = () => {
    return scannedItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Terima Barang</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Scan barcode atau pilih produk secara manual
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-[var(--success-bg)] text-[var(--success)]'
              : 'bg-[var(--danger-bg)] text-[var(--danger)]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner - USB Only */}
        <div className="space-y-4">
          <BarcodeScanner onScan={handleScan} mode="usb" />
          
          {/* Manual Product Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Tambah Produk Manual</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Untuk produk tanpa barcode
            </p>
            
            <div className="relative search-dropdown-container">
              <label className="block text-sm font-medium mb-2">Cari Produk</label>
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Ketik nama atau SKU produk..."
              />
              
              {/* Dropdown Results */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] last:border-0"
                    >
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        SKU: {product.sku} | Stock: {product.stockQuantity}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results */}
              {showDropdown && searchQuery && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-4 text-center text-[var(--foreground-muted)]">
                  Tidak ada produk yang cocok
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scanned Items List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Daftar Barang ({scannedItems.length})
            </h3>
            {scannedItems.length > 0 && (
              <Button variant="secondary" size="sm" onClick={clearAll}>
                Hapus Semua
              </Button>
            )}
          </div>

          {scannedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Belum ada barang</p>
              <p className="text-sm text-[var(--foreground-muted)] mt-2">
                Scan barcode atau pilih manual
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {scannedItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Barcode: {item.barcode} | Stok Saat Ini: {item.currentStock}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        tabIndex={-1}
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--background)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        ref={(el) => { quantityInputRefs.current[index] = el; }}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpdateStock();
                          }
                        }}
                        className="w-16 text-center input py-1"
                        min="1"
                        tabIndex={1}
                      />
                      <button
                        tabIndex={-1}
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--background)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        +
                      </button>
                      <button
                        tabIndex={-1}
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--danger)] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total Barang:</span>
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    {getTotalItems()}
                  </span>
                </div>
                <Button
                  variant="primary"
                  onClick={handleUpdateStock}
                  disabled={isProcessing}
                  className="w-full"
                  tabIndex={2}
                >
                  {isProcessing ? 'Memproses...' : 'Update Stok'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={showAddProductModal} onClose={() => setShowAddProductModal(false)}>
        <h2 className="text-xl font-bold mb-6">Tambah Produk Baru</h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Barcode tidak ditemukan: <strong>{scannedBarcode}</strong>
        </p>

        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Produk *</label>
            <Input
              value={newProductForm.name}
              onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
              placeholder="Nama produk"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SKU *</label>
              <Input
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                placeholder="SKU001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Barcode</label>
              <Input
                value={newProductForm.barcode}
                onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                placeholder="Barcode"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Harga *</label>
            <Input
              type="number"
              value={newProductForm.price}
              onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Buat & Tambah ke Daftar
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddProductModal(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Result Modal */}
      <AnimatePresence>
        {resultModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setResultModal({ ...resultModal, show: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--card)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon Header */}
              <div className={`p-6 text-center ${
                resultModal.type === 'success' 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  {resultModal.type === 'success' ? (
                    <CheckCircle size={64} className="mx-auto text-white" />
                  ) : (
                    <XCircle size={64} className="mx-auto text-white" />
                  )}
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-center mb-2">{resultModal.title}</h2>
                <p className="text-[var(--foreground-muted)] text-center mb-4">{resultModal.message}</p>
                
                {/* Details List */}
                {resultModal.details && resultModal.details.length > 0 && (
                  <div className="bg-[var(--surface)] rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Detail update:</p>
                    <ul className="space-y-1">
                      {resultModal.details.map((detail, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={() => setResultModal({ ...resultModal, show: false })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setResultModal({ ...resultModal, show: false });
                    }
                  }}
                  className="w-full"
                  autoFocus
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
