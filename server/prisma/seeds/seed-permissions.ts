import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRolePermissions() {
  console.log('Seeding role permissions...');

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

  // Fetch all roles first
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  for (const perm of permissions) {
    const roleId = roleMap.get(perm.role);
    
    if (!roleId) {
      console.warn(`Role ${perm.role} not found. Skipping permission for ${perm.menuPath}`);
      continue;
    }

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
}

seedRolePermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
