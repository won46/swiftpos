'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal, Input } from '@/components/ui';
import { unitsAPI } from '@/services/api';
import { Plus, Edit, Trash2, Scale, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Unit {
  id: number;
  name: string;
  label: string;
  qty: number;
  isActive: boolean;
  createdAt: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    qty: '1',
  });

  useEffect(() => {
    fetchUnits();
  }, [showInactive]);

  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const response = await unitsAPI.getAll(showInactive);
      setUnits(response.data.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedUnits = async () => {
    try {
      await unitsAPI.seed();
      fetchUnits();
    } catch (error) {
      console.error('Failed to seed units:', error);
    }
  };

  const handleOpenModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        label: unit.label,
        qty: unit.qty.toString(),
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        label: '',
        qty: '1',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
  };

  const handleSaveUnit = async () => {
    try {
      if (editingUnit) {
        await unitsAPI.update(editingUnit.id, {
          name: formData.name,
          label: formData.label,
          qty: parseInt(formData.qty),
        });
      } else {
        await unitsAPI.create({
          name: formData.name,
          label: formData.label,
          qty: parseInt(formData.qty),
        });
      }
      fetchUnits();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save unit:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan satuan');
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan satuan ini?')) return;

    try {
      await unitsAPI.delete(id);
      fetchUnits();
    } catch (error) {
      console.error('Failed to delete unit:', error);
      alert('Gagal menghapus satuan');
    }
  };

  const handleToggleActive = async (unit: Unit) => {
    try {
      await unitsAPI.update(unit.id, { isActive: !unit.isActive });
      fetchUnits();
    } catch (error) {
      console.error('Failed to toggle unit:', error);
    }
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Manajemen Satuan</h1>
            <p className="text-[var(--foreground-muted)]">
              Kelola satuan produk: pcs, lusin, kodi, dus, dll
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={handleSeedUnits}
            >
              Seed Default
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              Tambah Satuan
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari satuan..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Tampilkan nonaktif
            </label>
          </div>
        </div>

        {/* Units Table */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat satuan...</p>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <Scale size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Tidak ada satuan</p>
              <Button variant="secondary" className="mt-4" onClick={handleSeedUnits}>
                Tambah Satuan Default
              </Button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Label</th>
                    <th>Jumlah (pcs)</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit, index) => (
                    <motion.tr
                      key={unit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-mono font-bold">{unit.name}</td>
                      <td>{unit.label}</td>
                      <td>
                        <span className="badge badge-info">
                          {unit.qty === 1 ? '1 pcs (base)' : `${unit.qty} pcs`}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(unit)}
                          className={`badge cursor-pointer ${
                            unit.isActive ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {unit.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(unit)}
                            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="p-2 rounded-lg hover:bg-[var(--error-bg)] text-[var(--error)] transition-colors"
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
      </div>

      {/* Add/Edit Unit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="sm">
        <h2 className="text-xl font-bold mb-6">
          {editingUnit ? 'Edit Satuan' : 'Tambah Satuan Baru'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Satuan *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
              placeholder="contoh: karton, pack, box"
            />
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Huruf kecil tanpa spasi
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Label Display *</label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="contoh: Karton, Pack, Box"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Jumlah per Satuan (pcs) *</label>
            <Input
              type="number"
              value={formData.qty}
              onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
              placeholder="1"
              min="1"
            />
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Contoh: Lusin = 12, Kodi = 20, Karton = 24
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={handleCloseModal}>
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveUnit}
            disabled={!formData.name || !formData.label || !formData.qty}
          >
            {editingUnit ? 'Simpan Perubahan' : 'Tambah Satuan'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
