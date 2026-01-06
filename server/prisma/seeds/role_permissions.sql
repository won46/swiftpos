-- Seed default role permissions for all roles

-- ADMIN: Full access to all menus
INSERT INTO role_permissions (id, role, menu_path, menu_label, can_read, can_create, can_update, can_delete, is_active) VALUES
(gen_random_uuid(), 'ADMIN', '/dashboard', 'Dashboard', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/pos', 'Kasir (POS)', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/products', 'Produk', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/categories', 'Kategori', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/suppliers', 'Pemasok', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/purchases', 'Pembelian', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/discounts', 'Diskon', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/expiry', 'Tracking Kadaluarsa', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/returns', 'Retur', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/stock/quick-receive', 'Terima Barang', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/stock-taking', 'Stock Opname', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/transactions', 'Transaksi', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/reports', 'Laporan Penjualan', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/reports/inventory', 'Laporan Inventory', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/users', 'Pengguna', true, true, true, true, true),
(gen_random_uuid(), 'ADMIN', '/settings', 'Pengaturan', true, true, true, true, true);

-- MANAGER: All except user management
INSERT INTO role_permissions (id, role, menu_path, menu_label, can_read, can_create, can_update, can_delete, is_active) VALUES
(gen_random_uuid(), 'MANAGER', '/dashboard', 'Dashboard', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/pos', 'Kasir (POS)', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/products', 'Produk', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/categories', 'Kategori', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/suppliers', 'Pemasok', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/purchases', 'Pembelian', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/discounts', 'Diskon', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/expiry', 'Tracking Kadaluarsa', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/returns', 'Retur', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/stock/quick-receive', 'Terima Barang', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/stock-taking', 'Stock Opname', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/transactions', 'Transaksi', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/reports', 'Laporan Penjualan', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/reports/inventory', 'Laporan Inventory', true, true, true, true, true),
(gen_random_uuid(), 'MANAGER', '/settings', 'Pengaturan', true, false, false, false, true);

-- CASHIER: Limited access (POS, Dashboard, Transactions - view only)
INSERT INTO role_permissions (id, role, menu_path, menu_label, can_read, can_create, can_update, can_delete, is_active) VALUES
(gen_random_uuid(), 'CASHIER', '/dashboard', 'Dashboard', true, false, false, false, true),
(gen_random_uuid(), 'CASHIER', '/pos', 'Kasir (POS)', true, true, false, false, true),
(gen_random_uuid(), 'CASHIER', '/transactions', 'Transaksi', true, false, false, false, true);
