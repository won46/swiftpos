import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Roles
  console.log('👥 Seeding roles...');
  const roles = [
    { name: 'ADMIN', displayName: 'Administrator', description: 'Full access to all features', isSystem: true },
    { name: 'MANAGER', displayName: 'Manager', description: 'Manage products and View reports', isSystem: true },
    { name: 'CASHIER', displayName: 'Cashier', description: 'Point of Sales only', isSystem: true },
  ];

  const roleMap: Record<string, string> = {};

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
    roleMap[role.name] = createdRole.id;
    console.log(`   - Role ${role.name} seeded`);
  }

  // Seed Role Permissions
  console.log('📋 Seeding role permissions...');

  const permissions = [
    // ADMIN: Full access  
    { role: 'ADMIN', menuPath: '/dashboard', menuLabel: 'Dashboard', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/pos', menuLabel: 'Kasir (POS)', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/products', menuLabel: 'Produk', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/categories', menuLabel: 'Kategori', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/suppliers', menuLabel: 'Pemasok', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/purchases', menuLabel: 'Pembelian', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/discounts', menuLabel: 'Diskon', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/expiry', menuLabel: 'Tracking Kadaluarsa', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/returns', menuLabel: 'Retur', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/stock/quick-receive', menuLabel: 'Terima Barang', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/stock-taking', menuLabel: 'Stock Opname', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/transactions', menuLabel: 'Transaksi', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/reports', menuLabel: 'Laporan Penjualan', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/reports/inventory', menuLabel: 'Laporan Inventory', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/users', menuLabel: 'Pengguna', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'ADMIN', menuPath: '/settings', menuLabel: 'Pengaturan', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // MANAGER: All except user management
    { role: 'MANAGER', menuPath: '/dashboard', menuLabel: 'Dashboard', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/pos', menuLabel: 'Kasir (POS)', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/products', menuLabel: 'Produk', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/categories', menuLabel: 'Kategori', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/suppliers', menuLabel: 'Pemasok', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/purchases', menuLabel: 'Pembelian', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/discounts', menuLabel: 'Diskon', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/expiry', menuLabel: 'Tracking Kadaluarsa', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/returns', menuLabel: 'Retur', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/stock/quick-receive', menuLabel: 'Terima Barang', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/stock-taking', menuLabel: 'Stock Opname', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/transactions', menuLabel: 'Transaksi', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/reports', menuLabel: 'Laporan Penjualan', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/reports/inventory', menuLabel: 'Laporan Inventory', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { role: 'MANAGER', menuPath: '/settings', menuLabel: 'Pengaturan', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    
    // CASHIER: Limited
    { role: 'CASHIER', menuPath: '/dashboard', menuLabel: 'Dashboard', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    { role: 'CASHIER', menuPath: '/pos', menuLabel: 'Kasir (POS)', canRead: true, canCreate: true, canUpdate: false, canDelete: false },
    { role: 'CASHIER', menuPath: '/transactions', menuLabel: 'Transaksi', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  ];

  for (const perm of permissions) {
    const roleId = roleMap[perm.role];
    if (!roleId) continue;
    
    // Remove role string from object for creating Permission
    const { role, ...permData } = perm;

    await prisma.rolePermission.upsert({
      where: {
        roleId_menuPath: {
          roleId: roleId,
          menuPath: perm.menuPath,
        },
      },
      create: {
        ...permData,
        roleId: roleId,
      },
      update: permData,
    });
  }

  console.log('✅ Role permissions seeded successfully');
  console.log(`   - ADMIN: 16 menus (full access)`);
  console.log(`   - MANAGER: 13 menus (no user management)`);
  console.log(`   - CASHIER: 3 menus (POS, dashboard, transactions)`);

  // Seed Default Admin User
  console.log('👤 Seeding default admin user...');
  
  // Hash password
  // Note: In a real app we would import bcrypt, but for simplicity in seeding 
  // we can mock it or use a known hash if bcrypt isn't available in top scope.
  // However, since we are in a ts file processed by tsx, we can try dynamic import or assume bcrypt is available.
  // Let's rely on the fact bcrypt is in package.json
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

  if (adminRole) {
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@swiftpos.com' },
      update: {
        fullName: 'System Administrator',
        roleId: adminRole.id,
        passwordHash: passwordHash, // Reset password to ensures we know it
        isActive: true,
      },
      create: {
        email: 'admin@swiftpos.com',
        fullName: 'System Administrator',
        passwordHash: passwordHash,
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log(`✅ Default admin created: ${adminUser.email} (Password: admin123)`);
  } else {
    console.error('❌ Could not find ADMIN role to create user');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
