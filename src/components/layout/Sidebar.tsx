'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Truck,
  ClipboardList,
  Shield,
  FolderOpen,
  ShoppingBag,
  ScanBarcode,
  Tag,
  AlertTriangle,
  RotateCcw,
  Database,
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { icon: ShoppingCart, label: 'Kasir (POS)', href: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { icon: Package, label: 'Produk', href: '/products', roles: ['ADMIN', 'MANAGER'] },
  { icon: FolderOpen, label: 'Kategori', href: '/categories', roles: ['ADMIN', 'MANAGER'] },
  { icon: Truck, label: 'Pemasok', href: '/suppliers', roles: ['ADMIN', 'MANAGER'] },
  { icon: ShoppingBag, label: 'Pembelian', href: '/purchases', roles: ['ADMIN', 'MANAGER'] },
  { icon: Tag, label: 'Diskon', href: '/discounts', roles: ['ADMIN', 'MANAGER'] },
  { icon: AlertTriangle, label: 'Tracking Kadaluarsa', href: '/expiry', roles: ['ADMIN', 'MANAGER'] },
  { icon: RotateCcw, label: 'Retur', href: '/returns', roles: ['ADMIN', 'MANAGER'] },
  { icon: ScanBarcode, label: 'Terima Barang', href: '/stock/quick-receive', roles: ['ADMIN', 'MANAGER'] },
  { icon: ClipboardList, label: 'Stock Opname', href: '/stock-taking', roles: ['ADMIN', 'MANAGER'] },
  { icon: Users, label: 'Pelanggan', href: '/customers', roles: ['ADMIN', 'MANAGER'] },
  { icon: FileText, label: 'Transaksi', href: '/transactions', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { icon: BarChart3, label: 'Laporan Penjualan', href: '/reports', roles: ['ADMIN', 'MANAGER'] },
  { icon: Package, label: 'Laporan Inventory', href: '/reports/inventory', roles: ['ADMIN', 'MANAGER'] },
  { icon: Users, label: 'Pengguna', href: '/users', roles: ['ADMIN'] },
  { icon: Shield, label: 'Role Permissions', href: '/settings/permissions', roles: ['ADMIN'] },
  { icon: Database, label: 'Manajemen Data', href: '/settings/data', roles: ['ADMIN'] },
  { icon: Settings, label: 'Pengaturan', href: '/settings', roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [allowedMenuItems, setAllowedMenuItems] = useState<typeof menuItems>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setAllowedMenuItems([]);
          setIsLoadingPermissions(false);
          return;
        }

        const user = JSON.parse(userStr);
        const role = user.role || 'CASHIER';

        // ADMIN gets all menus automatically
        if (role === 'ADMIN') {
          setAllowedMenuItems(menuItems);
          setIsLoadingPermissions(false);
          return;
        }

        // For other roles, fetch permissions from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/role-permissions/${role}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const permissions = data.data || [];

          // Filter menu items based on permissions
          const allowed = menuItems.filter(item =>
            permissions.find((p: any) => p.menuPath === item.href && p.canRead)
          );

          setAllowedMenuItems(allowed);
        } else {
          // Fallback to hardcoded if API fails
          const hardcodedAllowed = menuItems.filter(item =>
            item.roles.includes(role)
          );
          setAllowedMenuItems(hardcodedAllowed);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        // Fallback
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role || 'CASHIER';
          
          // ADMIN still gets all menus even on error
          if (role === 'ADMIN') {
            setAllowedMenuItems(menuItems);
          } else {
            const hardcodedAllowed = menuItems.filter(item =>
              item.roles.includes(role)
            );
            setAllowedMenuItems(hardcodedAllowed);
          }
        }
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleLogout = () => {
    try {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Force redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: try router push
      router.push('/login');
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo & Theme Toggle */}
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">SwiftPOS</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Point of Sales</p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Menu */}
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Menu Utama
          </span>
        </div>
        {allowedMenuItems.slice(0, 15).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`sidebar-item relative ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-[3px] h-6 bg-[var(--primary)] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        <div className="px-4 mt-6 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Pengaturan
          </span>
        </div>
        {allowedMenuItems.slice(15).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`sidebar-item relative ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center text-white font-semibold">
            {typeof window !== 'undefined' && localStorage.getItem('user') 
              ? JSON.parse(localStorage.getItem('user') || '{}').fullName?.[0]?.toUpperCase() || 'A'
              : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {typeof window !== 'undefined' && localStorage.getItem('user')
                ? JSON.parse(localStorage.getItem('user') || '{}').fullName || 'User'
                : 'User'}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] truncate">
              {typeof window !== 'undefined' && localStorage.getItem('user')
                ? JSON.parse(localStorage.getItem('user') || '{}').email || ''
                : ''}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground-muted)]"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
