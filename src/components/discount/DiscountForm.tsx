'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { Discount, DiscountType, Category, Product } from '@/types';
import { categoriesAPI, productsAPI } from '@/services/api';

interface DiscountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DiscountFormData) => Promise<void>;
  discount?: Discount | null;
}

export interface DiscountFormData {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchase?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  applicableProducts?: string[];
  applicableUnit?: string;
  isActive: boolean;
}

export function DiscountForm({ isOpen, onClose, onSave, discount }: DiscountFormProps) {
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    minPurchase: undefined,
    startDate: '',
    endDate: '',
    categoryId: undefined,
    applicableProducts: [],
    applicableUnit: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applicabilityType, setApplicabilityType] = useState<'universal' | 'category' | 'products'>('universal');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch categories and products for the form
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll(),
        ]);
        setCategories(categoriesRes.data.data || []);
        setProducts(productsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (discount) {
      // Determine applicability type
      let type: 'universal' | 'category' | 'products' = 'universal';
      if (discount.applicableProducts && discount.applicableProducts.length > 0) {
        type = 'products';
      } else if (discount.categoryId) {
        type = 'category';
      }
      setApplicabilityType(type);

      // Set selected products if applicable
      if (discount.applicableProducts) {
        const selected = products.filter(p => discount.applicableProducts?.includes(p.id));
        setSelectedProducts(selected);
      }

      setFormData({
        code: discount.code,
        name: discount.name,
        description: discount.description || '',
        type: discount.type,
        value: discount.value,
        minPurchase: discount.minPurchase,
        startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
        endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
        categoryId: discount.categoryId,
        applicableProducts: discount.applicableProducts || [],
        applicableUnit: discount.applicableUnit || '',
        isActive: discount.isActive,
      });
    } else {
      setApplicabilityType('universal');
      setSelectedProducts([]);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'PERCENTAGE',
        value: 0,
        minPurchase: undefined,
        startDate: '',
        endDate: '',
        categoryId: undefined,
        applicableProducts: [],
        isActive: true,
      });
    }
    setErrors({});
  }, [discount, isOpen, products]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Kode diskon wajib diisi';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nama diskon wajib diisi';
    }
    if (formData.value <= 0) {
      newErrors.value = 'Nilai diskon harus lebih dari 0';
    }
    if (formData.type === 'PERCENTAGE' && formData.value > 100) {
      newErrors.value = 'Nilai persentase tidak boleh lebih dari 100';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Tanggal berakhir harus setelah tanggal mulai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save discount:', error);
      alert('Gagal menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {discount ? 'Edit Diskon' : 'Buat Diskon Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Kode Diskon <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input w-full"
              placeholder="e.g., DISC10, HEMAT50K"
              disabled={!!discount}
            />
            {errors.code && <p className="text-sm text-[var(--error)] mt-1">{errors.code}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nama Diskon <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="e.g., Diskon 10%, Hemat Rp 50,000"
            />
            {errors.name && <p className="text-sm text-[var(--error)] mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Deskripsi diskon (opsional)"
            />
          </div>

          {/* Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipe Diskon <span className="text-[var(--error)]">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                className="input w-full"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nilai <span className="text-[var(--error)]">*</span>
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className="input w-full"
                placeholder={formData.type === 'PERCENTAGE' ? '0-100' : '0'}
                min="0"
                max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                step={formData.type === 'PERCENTAGE' ? '0.01' : '1'}
              />
              {errors.value && <p className="text-sm text-[var(--error)] mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Min Purchase */}
          <div>
            <label className="block text-sm font-medium mb-2">Minimal Pembelian (Rp)</label>
            <input
              type="number"
              value={formData.minPurchase || ''}
              onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || undefined })}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Applicable Unit */}
          <div>
            <label className="block text-sm font-medium mb-2">Unit/Satuan (Opsional)</label>
            <input
              type="text"
              value={formData.applicableUnit ?? ''}
              onChange={(e) => setFormData({ ...formData, applicableUnit: e.target.value })}
              className="input w-full"
              placeholder="e.g. pcs, lusin, karton (Kosongkan jika berlaku semua unit)"
            />
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Jika diisi, diskon hanya akan berlaku jika produk dibeli dengan satuan ini.
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Mulai (Opsional)</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Berakhir (Opsional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input w-full"
              />
              {errors.endDate && <p className="text-sm text-[var(--error)] mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Applicability */}
          <div>
            <label className="block text-sm font-medium mb-2">Berlaku Untuk</label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="universal"
                  checked={applicabilityType === 'universal'}
                  onChange={(e) => {
                    setApplicabilityType('universal');
                    setFormData({ ...formData, categoryId: undefined, applicableProducts: [] });
                  }}
                  className="w-4 h-4"
                />
                <span>Semua Produk</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="category"
                  checked={applicabilityType === 'category'}
                  onChange={(e) => {
                    setApplicabilityType('category');
                    setFormData({ ...formData, applicableProducts: [] });
                  }}
                  className="w-4 h-4"
                />
                <span>Kategori Tertentu</span>
              </label>
              
              {applicabilityType === 'category' && (
                <div className="ml-6">
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="input w-full"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="products"
                  checked={applicabilityType === 'products'}
                  onChange={(e) => {
                    setApplicabilityType('products');
                    setFormData({ ...formData, categoryId: undefined });
                  }}
                  className="w-4 h-4"
                />
                <span>Produk Tertentu</span>
              </label>
              
              {applicabilityType === 'products' && (
                <div className="ml-6 space-y-2">
                  <select
                    onChange={(e) => {
                      const productId = e.target.value;
                      if (!productId) return;
                      
                      const product = products.find(p => p.id === productId);
                      if (!product || selectedProducts.find(p => p.id === productId)) return;
                      
                      const newSelected = [...selectedProducts, product];
                      setSelectedProducts(newSelected);
                      setFormData({ ...formData, applicableProducts: newSelected.map(p => p.id) });
                      e.target.value = '';
                    }}
                    className="input w-full"
                  >
                    <option value="">+ Pilih Produk</option>
                    {products
                      .filter(p => !selectedProducts.find(sp => sp.id === p.id))
                      .map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                  </select>
                  
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="badge badge-info flex items-center gap-2">
                          <span>{product.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newSelected = selectedProducts.filter(p => p.id !== product.id);
                              setSelectedProducts(newSelected);
                              setFormData({ ...formData, applicableProducts: newSelected.map(p => p.id) });
                            }}
                            className="hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Aktifkan diskon
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : discount ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
