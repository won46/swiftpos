'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { categoriesAPI } from '@/services/api';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id.toString(), formData);
      } else {
        await categoriesAPI.create(formData);
      }
      
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Gagal menyimpan kategori');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
    
    try {
      await categoriesAPI.delete(id.toString());
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Gagal menghapus kategori. Mungkin masih ada produk yang menggunakan kategori ini.');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Kategori Produk</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Kelola kategori untuk produk Anda
            </p>
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--primary-bg)]">
              <FolderOpen className="text-[var(--primary)]" size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">Total Kategori</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--foreground-muted)]">Loading...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
            <p className="text-[var(--foreground-muted)]">Belum ada kategori</p>
            <Button variant="primary" onClick={() => handleOpenModal()} className="mt-4">
              <Plus size={18} />
              Tambah Kategori Pertama
            </Button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th>Jumlah Produk</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <FolderOpen size={18} className="text-[var(--primary)]" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[var(--foreground-muted)]">
                        {category.description || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {category._count?.products || 0} produk
                      </span>
                    </td>
                    <td>
                      {new Date(category.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 rounded-lg hover:bg-[var(--error-bg)] text-[var(--error)] transition-colors"
                          disabled={category._count?.products! > 0}
                          title={category._count?.products! > 0 ? 'Tidak bisa hapus, masih ada produk' : 'Hapus'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className="text-xl font-bold mb-6">
          {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Kategori *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Elektronik"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat kategori..."
              className="input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingCategory ? 'Update' : 'Simpan'}
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
