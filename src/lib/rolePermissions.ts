// Role-Based Access Control Configuration

/**
 * Menu Access by Role:
 * 
 * ADMIN (Full Access):
 * - Semua menu available
 * - User Management
 * - Pengaturan sistem
 * 
 * MANAGER:
 * - Dashboard
 * - POS (Kasir)
 * - Produk & Kategori
 * - Pemasok & Pembelian
 * - Diskon
 * - Tracking Kadaluarsa
 * - Retur
 * - Stock Management
 * - Transaksi & Laporan
 * - Pengaturan (terbatas)
 * 
 * CASHIER (Limited Access):
 * - Dashboard (view only)
 * - POS (Kasir) - Main function
 * - Transaksi (view/print)
 * 
 * Restrictions Applied:
 * - CASHIER tidak bisa akses: Products, Categories, Suppliers, Purchases, Discounts, Expiry, Returns, Stock, Reports, Users, Settings
 * - MANAGER tidak bisa akses: User Management (hanya ADMIN)
 * - All roles: Harus login untuk akses
 */

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canAccessAll: true,
    canManageUsers: true,
    canManageProducts: true,
    canManagePurchases: true,
    canViewReports: true,
    canManageSettings: true,
  },
  MANAGER: {
    canAccessAll: false,
    canManageUsers: false,
    canManageProducts: true,
    canManagePurchases: true,
    canViewReports: true,
    canManageSettings: true,
  },
  CASHIER: {
    canAccessAll: false,
    canManageUsers: false,
    canManageProducts: false,
    canManagePurchases: false,
    canViewReports: false,
    canManageSettings: false,
  },
};

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';
