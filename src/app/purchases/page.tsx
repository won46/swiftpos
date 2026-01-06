'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { purchasesAPI, suppliersAPI, productsAPI } from '@/services/api';
import { Plus, Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: { id: string; name: string };
  items: Array<{
    id: number;
    product: { id: string; name: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  receivedAt?: string;
  notes?: string;
  createdAt: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
  });
  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>>([{ productId: '', quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, [selectedStatus]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await purchasesAPI.getAll(params);
      setPurchases(response.data.data);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({});
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleOpenModal = () => {
    setFormData({ supplierId: '', notes: '' });
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await purchasesAPI.create({
        supplierId: formData.supplierId,
        items,
        notes: formData.notes,
      });
      
      fetchPurchases();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      alert('Gagal membuat purchase order');
    }
  };

  const handleReceive = async (id: number) => {
    if (!confirm('Terima barang dan update stock?')) return;
    
    try {
      await purchasesAPI.receive(id.toString());
      alert('Barang diterima! Stock telah diupdate.');
      fetchPurchases();
    } catch (error) {
      console.error('Failed to receive purchase:', error);
      alert('Gagal menerima barang');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Batalkan purchase order ini?')) return;
    
    try {
      await purchasesAPI.cancel(id.toString());
      fetchPurchases();
    } catch (error) {
      console.error('Failed to cancel purchase:', error);
      alert('Gagal membatalkan purchase order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning">Pending</span>;
      case 'RECEIVED':
        return <span className="badge badge-success">Received</span>;
      case 'CANCELLED':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Purchase Orders</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Kelola pembelian dari supplier
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenModal}>
            <Plus size={18} />
            Buat PO Baru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--foreground-muted)]">Loading...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
            <p className="text-[var(--foreground-muted)]">Belum ada purchase order</p>
            <Button variant="primary" onClick={handleOpenModal} className="mt-4">
              <Plus size={18} />
              Buat PO Pertama
            </Button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((po) => (
                  <motion.tr
                    key={po.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="font-medium">{po.poNumber}</td>
                    <td>{po.supplier.name}</td>
                    <td>{po.items.length} items</td>
                    <td>Rp {po.totalAmount.toLocaleString()}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>{new Date(po.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className="flex gap-2">
                        {po.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleReceive(po.id)}
                              className="p-2 rounded-lg hover:bg-[var(--success-bg)] text-[var(--success)] transition-colors"
                              title="Terima Barang"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleCancel(po.id)}
                              className="p-2 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--danger)] transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className="text-xl font-bold mb-6">Buat Purchase Order Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Supplier *</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="input"
              required
            >
              <option value="">Pilih Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  className="input col-span-5"
                  required
                >
                  <option value="">Pilih Produk</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  className="input col-span-2"
                  placeholder="Qty"
                  min="1"
                  required
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                  className="input col-span-3"
                  placeholder="Harga"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="col-span-2 px-2 py-2 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--danger)] transition-colors"
                  disabled={items.length === 1}
                >
                  Hapus
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem} className="mt-2">
              + Tambah Item
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total</label>
            <div className="text-2xl font-bold text-[var(--primary)]">
              Rp {calculateTotal().toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Catatan (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Buat Purchase Order
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
