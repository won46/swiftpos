'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, SearchInput } from '@/components/ui';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Discount } from '@/types';
import { discountsAPI } from '@/services/api';
import { DiscountForm, DiscountFormData } from '@/components/discount/DiscountForm';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  useEffect(() => {
    fetchDiscounts();
  }, [filterActive]);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const params = filterActive !== 'all' ? { isActive: filterActive } : undefined;
      const response = await discountsAPI.getAll(params);
      setDiscounts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDiscount(null);
    setIsFormOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsFormOpen(true);
  };

  const handleSave = async (data: DiscountFormData) => {
    try {
      if (editingDiscount) {
        await discountsAPI.update(editingDiscount.id, data);
      } else {
        await discountsAPI.create(data);
      }
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to save discount:', error);
      throw error;
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await discountsAPI.update(id, { isActive: !currentStatus });
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to toggle discount:', error);
      alert('Gagal mengubah status diskon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus diskon ini?')) return;

    try {
      await discountsAPI.delete(id);
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to delete discount:', error);
      alert('Gagal menghapus diskon');
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === 'PERCENTAGE') {
      return `${discount.value}%`;
    }
    return `Rp ${discount.value.toLocaleString('id-ID')}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID');
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discount.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 gradient-text">Kelola Diskon</h1>
              <p className="text-[var(--foreground-muted)]">
                Buat dan kelola diskon untuk transaksi
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreate}
            >
              Buat Diskon Baru
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama diskon..."
              />
            </div>
            <select
              value={filterActive.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setFilterActive(val === 'all' ? 'all' : val === 'true');
              }}
              className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm">
              <option value="all">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Non-aktif</option>
            </select>
          </div>
        </div>

        {/* Discounts Table */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--foreground-muted)]">
                {searchQuery ? 'Tidak ada diskon ditemukan' : 'Belum ada diskon'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Tipe</th>
                    <th>Nilai</th>
                    <th>Min. Pembelian</th>
                    <th>Satuan</th>
                    <th>Periode</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.map((discount) => (
                    <tr key={discount.id}>
                      <td className="font-medium text-[var(--primary)]">{discount.code}</td>
                      <td>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          {discount.description && (
                            <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                              {discount.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${discount.type === 'PERCENTAGE' ? 'badge-info' : 'badge-warning'}`}>
                          {discount.type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                        </span>
                      </td>
                      <td className="font-semibold">{formatValue(discount)}</td>
                      <td>
                        {discount.minPurchase ? `Rp ${discount.minPurchase.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td>
                        {discount.applicableUnit ? (
                          <span className="badge badge-sm bg-purple-100 text-purple-800">
                            {discount.applicableUnit}
                          </span>
                        ) : (
                          <span className="text-[var(--foreground-muted)] text-sm">-</span>
                        )}
                      </td>
                      <td className="text-sm">
                        <div>{formatDate(discount.startDate)}</div>
                        <div className="text-[var(--foreground-muted)]">s/d {formatDate(discount.endDate)}</div>
                      </td>
                      <td>
                        <span className={`badge ${discount.isActive ? 'badge-success' : 'badge-error'}`}>
                          {discount.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(discount.id, discount.isActive)}
                            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                            title={discount.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {discount.isActive ? (
                              <ToggleRight className="text-green-500" size={20} />
                            ) : (
                              <ToggleLeft className="text-gray-400" size={20} />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(discount)}
                            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="text-[var(--primary)]" size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="text-[var(--error)]" size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Discount Form Modal */}
      <DiscountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        discount={editingDiscount}
      />
    </DashboardLayout>
  );
}
