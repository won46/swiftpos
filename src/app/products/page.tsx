'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal, Input } from '@/components/ui';
import { productsAPI, categoriesAPI, uploadAPI, getImageUrl, unitsAPI } from '@/services/api';
import { Product } from '@/types';
import { Plus, Edit, Trash2, Package, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: '',
    categoryId: '',
    description: '',
    imageUrl: '',

    size: '',
    color: '',
    // Unit conversion fields
    purchaseUnit: 'pcs',
    purchaseUnitQty: '1',
    saleUnits: ['pcs'] as string[],
    pricePerUnit: {} as Record<string, string>,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
  }, [selectedCategory]);

  const fetchUnits = async () => {
    try {
      const response = await unitsAPI.getAll();
      setUnits(response.data.data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const pricePerUnit = (product as any).pricePerUnit || {};
      const saleUnits = (product as any).saleUnits || ['pcs'];
      setFormData({
        name: product.name,
        sku: product.sku || '',
        barcode: product.barcode || '',
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() || '',
        stockQuantity: product.stockQuantity.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
        categoryId: product.categoryId?.toString() || '',
        description: product.description || '',
        imageUrl: product.imageUrl || '',

        size: product.size || '',
        color: product.color || '',
        purchaseUnit: (product as any).purchaseUnit || 'pcs',
        purchaseUnitQty: ((product as any).purchaseUnitQty || 1).toString(),
        saleUnits: saleUnits,
        pricePerUnit: Object.keys(pricePerUnit).reduce((acc, key) => {
          acc[key] = pricePerUnit[key]?.toString() || '';
          return acc;
        }, {} as Record<string, string>),
      });
      setImagePreview(getImageUrl(product.imageUrl) || '');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        price: '',
        costPrice: '',
        stockQuantity: '0',
        lowStockThreshold: '5',
        categoryId: '',
        description: '',
        imageUrl: '',

        size: '',
        color: '',
        purchaseUnit: 'pcs',
        purchaseUnitQty: '1',
        saleUnits: ['pcs'],
        pricePerUnit: {},
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSaveProduct = async () => {
    try {
      setIsUploading(true);
      
      let imageUrl = formData.imageUrl;
      
      // Upload image if new file selected
      if (imageFile) {
        const uploadResponse = await uploadAPI.uploadProductImage(imageFile);
        imageUrl = uploadResponse.data.data.imageUrl;
      }

      const productData: any = {
        name: formData.name,
        sku: formData.sku,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        categoryId: Number(formData.categoryId),
        description: formData.description || null,
        imageUrl: imageUrl || null,

        size: formData.size || null,
        color: formData.color || null,
        // Unit conversion fields
        purchaseUnit: formData.purchaseUnit,
        purchaseUnitQty: Number(formData.purchaseUnitQty),
        saleUnits: formData.saleUnits,
        pricePerUnit: Object.keys(formData.pricePerUnit).reduce((acc, key) => {
          if (formData.pricePerUnit[key]) {
            acc[key] = Number(formData.pricePerUnit[key]);
          }
          return acc;
        }, {} as Record<string, number>),
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
      } else {
        await productsAPI.create(productData);
      }

      fetchProducts();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const message = error.response?.data?.message || 'Gagal menyimpan produk';
      setErrorMessage(message);
      setIsErrorModalOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const message = error.response?.data?.message || 'Gagal menghapus produk';
      setErrorMessage(message);
      setIsErrorModalOpen(true);
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Manajemen Produk</h1>
            <p className="text-[var(--foreground-muted)]">
              Kelola produk, stok, dan harga
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenModal()}
          >
            Tambah Produk
          </Button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk berdasarkan nama atau SKU..."
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Produk</p>
            <p className="text-2xl font-bold">{filteredProducts.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Stok Rendah</p>
            <p className="text-2xl font-bold text-[var(--warning)]">
              {filteredProducts.filter((p) => p.stockQuantity <= p.lowStockThreshold).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total Nilai Stok</p>
            <p className="text-2xl font-bold gradient-text">
              {formatPrice(
                filteredProducts.reduce((sum, p) => sum + Number(p.price) * p.stockQuantity, 0)
              )}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Aktif</p>
            <p className="text-2xl font-bold text-[var(--success)]">
              {filteredProducts.filter((p) => p.isActive).length}
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Tidak ada produk</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>SKU</th>
                    <th>Ukuran</th>
                    <th>Warna</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Harga Beli</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-medium">{product.name}</td>
                      <td className="text-[var(--foreground-muted)]">{product.sku}</td>
                      <td>{product.size || '-'}</td>
                      <td>{product.color || '-'}</td>
                      <td>{product.category?.name || '-'}</td>
                      <td className="font-semibold">{formatPrice(product.price)}</td>
                      <td className="text-[var(--foreground-muted)]">
                        {product.costPrice ? formatPrice(product.costPrice) : '-'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            product.stockQuantity <= product.lowStockThreshold
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-error'}`}>
                          {product.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
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

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        <h2 className="text-xl font-bold mb-6">
          {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Produk *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama produk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SKU *</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU001"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Ukuran</label>
            <Input
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="Contoh: S, M, L, XL, XXL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Warna</label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Contoh: Merah, Biru, Hijau"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Warna</label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Contoh: Merah, Biru, Hijau"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Barcode</label>
            <Input
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Scan barcode atau masukkan manual"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Harga Jual *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Harga Beli</label>
              <Input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stok Awal *</label>
              <Input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Batas Stok Rendah *</label>
              <Input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kategori *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input w-full"
            >
              <option value="">Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Conversion Section */}
          <div className="border-t border-[var(--border)] pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-4 text-[var(--primary)]">⚙️ Konversi Satuan</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Satuan Beli</label>
                <select
                  value={formData.purchaseUnit}
                  onChange={(e) => {
                    const selectedUnit = units.find(u => u.name === e.target.value);
                    setFormData({ 
                      ...formData, 
                      purchaseUnit: e.target.value,
                      purchaseUnitQty: selectedUnit?.qty?.toString() || '1'
                    });
                  }}
                  className="input w-full"
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.name}>
                      {unit.label} ({unit.qty} pcs)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Isi per {formData.purchaseUnit}</label>
                <Input
                  type="number"
                  value={formData.purchaseUnitQty}
                  onChange={(e) => setFormData({ ...formData, purchaseUnitQty: e.target.value })}
                  placeholder="1"
                  disabled={formData.purchaseUnit === 'pcs'}
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {formData.purchaseUnit === 'lusin' && '1 lusin = 12 pcs'}
                  {formData.purchaseUnit === 'kodi' && '1 kodi = 20 pcs'}
                  {formData.purchaseUnit === 'dus' && 'Masukkan jumlah pcs per dus'}
                  {formData.purchaseUnit === 'pcs' && '1 pcs = 1 satuan'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Satuan Jual</label>
              <div className="flex flex-wrap gap-3">
                {units.map((unit) => (
                  <label key={unit.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.saleUnits.includes(unit.name)}
                      onChange={(e) => {
                        const newUnits = e.target.checked
                          ? [...formData.saleUnits, unit.name]
                          : formData.saleUnits.filter(u => u !== unit.name);
                        setFormData({ ...formData, saleUnits: newUnits });
                      }}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
                    />
                    <span className="text-sm">{unit.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.saleUnits.length > 1 && (
              <div className="bg-[var(--surface)] rounded-lg p-4">
                <label className="block text-sm font-medium mb-3">Harga per Satuan Jual</label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.saleUnits.filter(u => u !== 'pcs').map((unit) => (
                    <div key={unit}>
                      <label className="block text-xs text-[var(--foreground-muted)] mb-1 capitalize">
                        Harga per {unit}
                      </label>
                      <Input
                        type="number"
                        value={formData.pricePerUnit[unit] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricePerUnit: { ...formData.pricePerUnit, [unit]: e.target.value }
                        })}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-2">
                  * Harga satuan (pcs) menggunakan Harga Jual di atas
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full min-h-[100px]"
              placeholder="Deskripsi produk (opsional)"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Foto Produk</label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 rounded-full bg-[var(--error)] text-white hover:bg-opacity-80"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--surface)] transition-colors">
                <Upload size={32} className="text-[var(--foreground-muted)] mb-2" />
                <span className="text-sm text-[var(--foreground-muted)]">Click to upload image</span>
                <span className="text-xs text-[var(--foreground-muted)] mt-1">PNG, JPG, GIF up to 5MB</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
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
            onClick={handleSaveProduct}
            disabled={isUploading}
          >
            {isUploading ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Tambah Produk')}
          </Button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <X size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Button
             variant="primary"
             className="w-full bg-red-600 hover:bg-red-700"
             onClick={() => setIsErrorModalOpen(false)}
          >
             Tutup
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
