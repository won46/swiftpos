
'use client';

import { useState } from 'react';
// import { Card } from '@/components/ui/card'; // Does not exist
import { Button } from '@/components/ui'; // Exists
import { AlertCircle, FileSpreadsheet, Trash2, CheckCircle, Database, Search } from 'lucide-react';
import { dataManagementAPI } from '@/services/api';
// import { toast } from 'react-hot-toast'; // Not installed

export default function DataSettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);
  const [generateStats, setGenerateStats] = useState<any>(null);

  const handleReset = async () => {
    if (!confirm('PERINGATAN: Tindakan ini akan MENGHAPUS SEMUA transaksi, produk, dan kategori. Apakah Anda yakin ingin melanjutkan?')) {
      return;
    }
    
    // Double confirm
    const confirmation = prompt('Ketik "RESET" untuk konfirmasi penghapusan data.');
    if (confirmation !== 'RESET') return;

    setIsResetting(true);
    try {
      await dataManagementAPI.resetDatabase();
      alert('Database berhasil di-reset. Semua data produk dan transaksi telah dihapus.');
      setImportStats(null);
    } catch (error: any) {
      console.error('Reset failed:', error);
      alert('Gagal me-reset database: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsResetting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportStats(null);
    try {
      const response = await dataManagementAPI.importExcel();
      setImportStats(response.data.data);
      alert('Import data berhasil!');
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Gagal mengimport data: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateBarcodes = async () => {
    setIsGenerating(true);
    setGenerateStats(null);
    try {
      const response = await dataManagementAPI.generateBarcodes();
      setGenerateStats(response.data.data);
      alert('Pembaruan barcode berhasil!');
    } catch (error: any) {
      console.error('Generate Barcodes failed:', error);
      alert('Gagal membuat barcode: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Database className="w-6 h-6" />
        Manajemen Data
      </h1>

      <div className="grid gap-6">
        {/* Reset Data Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Reset Database</h2>
              <p className="text-gray-600 mb-4">
                Tindakan ini akan menghapus semua data <strong>Produk</strong>, <strong>Kategori</strong>, <strong>Stok</strong>, dan <strong>Transaksi</strong>. 
                Data Pengguna (User) dan pengaturan lainnya tidak akan dihapus. Pergunakan fitur ini dengan hati-hati.
              </p>
              <Button
                onClick={handleReset}
                disabled={isResetting || isImporting}
                variant="destructive" // Assuming variant support or default style
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? 'Sedang Mereset...' : 'Hapus Semua Data'}
              </Button>
            </div>
          </div>
        </div>

        {/* Import Data Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Import dari stock.xlsx</h2>
              <p className="text-gray-600 mb-4">
                Import data produk dan kategori dari file <code>stock.xlsx</code> yang berada di root folder server.
                Pastikan file Excel sudah diperbarui sebelum menjalankan import.
              </p>
              <div className="flex items-center gap-4">
                <Button
                    onClick={handleImport}
                    disabled={isResetting || isImporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isImporting ? 'Sedang Mengimport...' : 'Import Data Excel'}
                </Button>
              </div>

              {importStats && (
                <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Import Selesai
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Kategori Dibuat</span>
                      <span className="font-medium text-lg">{importStats.categoriesCreated}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Produk Dibuat</span>
                      <span className="font-medium text-lg">{importStats.productsCreated}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Error</span>
                      <span className="font-medium text-lg text-red-500">{importStats.errors}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generate Barcodes Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Search className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Generate Barcode Otomatis</h2>
              <p className="text-gray-600 mb-4">
                Buat barcode acak (6 karakter) untuk semua produk yang belum memiliki barcode.
                Fitur ini berguna untuk data produk lama atau hasil import yang belum memiliki data barcode.
              </p>
              <div className="flex items-center gap-4">
                <Button
                    onClick={handleGenerateBarcodes}
                    disabled={isResetting || isImporting || isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isGenerating ? 'Sedang Memproses...' : 'Generate Barcode (Produk Tanpa Barcode)'}
                </Button>
              </div>

              {generateStats && (
                <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Selesai
                  </h3>
                  <p className="text-sm text-gray-700">
                    Berhasil update <span className="font-bold">{generateStats.updatedCount}</span> produk dengan barcode baru.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
