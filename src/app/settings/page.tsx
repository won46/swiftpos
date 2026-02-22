'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { 
  Store, 
  Receipt, 
  Percent, 
  Printer, 
  Bell, 
  Moon, 
  Save,
  CheckCircle,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrinterSetup } from '@/components/settings/PrinterSetup';

interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  receiptFooter: string;
  enableNotifications: boolean;
  darkMode: boolean;
  autoPrintReceipt: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    storeName: 'SwiftPOS Store',
    storeAddress: 'Jl. Contoh No. 123, Jakarta',
    storePhone: '021-12345678',
    taxRate: 11,
    receiptFooter: 'Terima kasih telah berbelanja!',
    enableNotifications: true,
    darkMode: true,
    autoPrintReceipt: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save to localStorage
    localStorage.setItem('pos_settings', JSON.stringify(settings));
    
    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const ToggleSwitch = ({ 
    checked, 
    onChange 
  }: { 
    checked: boolean; 
    onChange: (val: boolean) => void 
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 24 : 2 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );

  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || 'CASHIER');
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Pengaturan</h1>
          <p className="text-[var(--foreground-muted)]">
            Konfigurasi sistem dan preferensi aplikasi
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-500 font-medium">Pengaturan berhasil disimpan!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6">
          {/* Role Permissions - Admin Only */}
          {userRole === 'ADMIN' && (
            <a href="/settings/permissions" className="card hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Shield className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--primary)] transition-colors">
                    Role Permissions
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Kelola hak akses menu untuk setiap role secara dinamis
                  </p>
                </div>
              </div>
            </a>
          )}

          {/* Printer Setup */}
          <PrinterSetup />

          {/* Store Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Store className="text-[var(--primary)]" size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Informasi Toko</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Detail toko Anda</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Toko</label>
                <Input
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  placeholder="Nama toko Anda"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alamat</label>
                <Input
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                  placeholder="Alamat toko"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telepon</label>
                <Input
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>
            </div>
          </div>

          {/* Tax & Receipt */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Receipt className="text-[var(--primary)]" size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Pajak & Struk</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Pengaturan pajak dan struk</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tarif Pajak (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                    className="w-24"
                    min="0"
                    max="100"
                  />
                  <Percent size={16} className="text-[var(--foreground-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Footer Struk</label>
                <Input
                  value={settings.receiptFooter}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  placeholder="Pesan di bagian bawah struk"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Bell className="text-[var(--primary)]" size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Preferensi</h2>
                <p className="text-sm text-[var(--foreground-muted)]">Sesuaikan pengalaman Anda</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[var(--foreground-muted)]" />
                  <div>
                    <p className="font-medium">Notifikasi</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Terima pemberitahuan stok rendah</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.enableNotifications}
                  onChange={(val) => setSettings({ ...settings, enableNotifications: val })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-[var(--foreground-muted)]" />
                  <div>
                    <p className="font-medium">Mode Gelap</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Gunakan tema gelap</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.darkMode}
                  onChange={(val) => setSettings({ ...settings, darkMode: val })}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Printer size={18} className="text-[var(--foreground-muted)]" />
                  <div>
                    <p className="font-medium">Cetak Struk Otomatis</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Cetak struk setelah transaksi</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.autoPrintReceipt}
                  onChange={(val) => setSettings({ ...settings, autoPrintReceipt: val })}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              'Menyimpan...'
            ) : (
              <>
                <Save size={20} />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
