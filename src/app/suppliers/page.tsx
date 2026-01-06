'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal, Input } from '@/components/ui';
import { suppliersAPI } from '@/services/api';
import { Plus, Edit, Trash2, Building2, Mail, Phone, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveSupplier = async () => {
    try {
      const supplierData = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, supplierData);
      } else {
        await suppliersAPI.create(supplierData);
      }

      fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      alert('Gagal menyimpan supplier');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) return;

    try {
      await suppliersAPI.delete(id);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Failed to delete supplier:', error);
      alert(error.response?.data?.message || 'Gagal menghapus supplier');
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Manajemen Supplier</h1>
            <p className="text-[var(--foreground-muted)]">
              Kelola data supplier dan vendor
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenModal()}
          >
            Tambah Supplier
          </Button>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari supplier berdasarkan nama atau contact person..."
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Supplier</p>
            <p className="text-2xl font-bold">{filteredSuppliers.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Aktif</p>
            <p className="text-2xl font-bold text-[var(--success)]">
              {filteredSuppliers.filter((s) => s.isActive).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Produk</p>
            <p className="text-2xl font-bold gradient-text">
              {filteredSuppliers.reduce((sum, s) => sum + (s._count?.products || 0), 0)}
            </p>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat supplier...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Tidak ada supplier</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier, index) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center">
                      <Building2 size={24} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <span className={`badge badge-sm ${supplier.isActive ? 'badge-success' : 'badge-error'}`}>
                        {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-[var(--foreground-muted)]" />
                    <span className="text-[var(--foreground-muted)]">{supplier.contactPerson}</span>
                  </div>
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-[var(--foreground-muted)]" />
                      <span className="text-[var(--foreground-muted)] truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-[var(--foreground-muted)]" />
                      <span className="text-[var(--foreground-muted)]">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-[var(--foreground-muted)]" />
                      <span className="text-[var(--foreground-muted)] line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {supplier._count?.products || 0} produk
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(supplier)}
                      className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-2 rounded-lg hover:bg-[var(--error-bg)] text-[var(--error)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="md"
      >
        <h2 className="text-xl font-bold mb-6">
          {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Supplier *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="PT. Nama Supplier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact Person *</label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Nama kontak"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@supplier.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telepon</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alamat</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input w-full min-h-[100px]"
              placeholder="Alamat lengkap supplier"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCloseModal}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveSupplier}
          >
            {editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
