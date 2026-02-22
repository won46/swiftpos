import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clothing data...');

  const categories = [
    { name: 'ATASAN', slug: 'atasan' },
    { name: 'GAMIS DEWASA', slug: 'gamis-dewasa' },
    { name: 'KOKO BAPAK', slug: 'koko-bapak' },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categories) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = createdCat.id;
    console.log(`   - Category ${cat.name} seeded`);
  }

  const products = [
    // ATASAN
    { name: 'ASRI 014 PEACH', size: 'S', price: 325000, stock: 1, category: 'ATASAN' },
    { name: 'ASRI 014 PEACH', size: 'XXL', price: 335000, stock: 1, category: 'ATASAN' },
    { name: 'ALLITA OAT', size: 'S', price: 155000, stock: 1, category: 'ATASAN' },
    { name: 'ASRI 016 COKLAT SUSU', size: 'S', price: 325000, stock: 1, category: 'ATASAN' },
    { name: 'ASRI 016 MERAH', size: 'XL', price: 325000, stock: 1, category: 'ATASAN' },
    { name: 'IMD 006 WHITE', size: 'XS', price: 192000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 015 DUSTY BLUE', size: 'XS', price: 142000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 033 LILAC', size: 'L/XL', price: 142000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 033 LILAC', size: 'S/M', price: 142000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 033 PEACH', size: 'L/XL', price: 142000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 033 PEACH', size: 'XS', price: 142000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 079 LILAC', size: 'L/XL', price: 152000, stock: 1, category: 'ATASAN' },
    { name: 'ITU 084 GREY', size: 'L/XL', price: 172000, stock: 1, category: 'ATASAN' },
    { name: 'NA 032 DUSTY BLUE', size: 'S', price: 158000, stock: 1, category: 'ATASAN' },
    { name: 'NA 044 BLUE', size: 'S', price: 138000, stock: 1, category: 'ATASAN' },
    { name: 'NAOMI PAPERCORN', size: 'M', price: 155000, stock: 1, category: 'ATASAN' },
    { name: 'NENA FLINTSTONE', size: 'XXL', price: 185000, stock: 1, category: 'ATASAN' },
    { name: 'NOLA WOODROSE', size: 'M', price: 155000, stock: 1, category: 'ATASAN' },
    { name: 'ZENITHA TITANI PINK', size: 'S', price: 139000, stock: 1, category: 'ATASAN' },

    // GAMIS DEWASA
    { name: 'ALESHA BLUE', size: 'L', price: 248000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ARETA MAROON', size: 'S', price: 268000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ARETA MAROON', size: 'L', price: 268000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ARETA PASTEL GREEN', size: 'S', price: 268000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ARETA PASTEL GREEN', size: 'L', price: 268000, stock: 2, category: 'GAMIS DEWASA' },
    { name: 'ARETA PASTEL GREEN', size: 'M', price: 268000, stock: 2, category: 'GAMIS DEWASA' },
    { name: 'ASHAKU DUSTY MAUVE', size: 'M', price: 398000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ASHAKU DUSTY MAUVE', size: 'L', price: 398000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ASHAKU DUSTY MAUVE', size: 'S', price: 398000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ASHAKU GREY LILAC', size: 'S', price: 398000, stock: 1, category: 'GAMIS DEWASA' },
    { name: 'ASHAKU GREY LILAC', size: 'M', price: 398000, stock: 1, category: 'GAMIS DEWASA' },

    // KOKO BAPAK
    { name: 'ALINE RED', size: 'S', price: 218000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ARETA MAROON', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ARETA MAROON', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ARETA NAVY', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ARETA PASTEL GREEN', size: 'S', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ASHAKU KOKO PENDEK LILAC', size: 'M', price: 238000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ASHAKU KOKO PENDEK MAUVE', size: 'M', price: 238000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'AYUDIA COPPER', size: 'M', price: 198000, stock: 0, category: 'KOKO BAPAK' },
    { name: 'AYUDIA COPPER', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'AYUDIA TARO', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'AYUDIA TARO', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'BELLA BURGUNDY', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'BELLA BURGUNDY', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'BELLA ROYAL NAVY', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'BELLYN VIOLET', size: 'S', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'BHINARKU VANILLA', size: 'L', price: 248000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'CELLINE WHITE', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'CELLINE WHITE', size: 'XL', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'CLARA ALMOND', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'CLARA DRY ROSE', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'DAISY DUSTY OLIVE', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'DIANTHA PLUM', size: 'M', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'DIANTHA PLUM', size: '5XL', price: 240000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ELDIA LAVENDER MIST', size: 'M', price: 198000, stock: 0, category: 'KOKO BAPAK' },
    { name: 'ELDIA LAVENDER MIST', size: 'L', price: 198000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ELYS BROWN', size: 'L', price: 208000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ELYS OLIVE', size: 'M', price: 208000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ESTELA MAROON', size: 'L', price: 208000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ESTELA MAROON', size: 'M', price: 208000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'ESTELA NAVY', size: 'M', price: 208000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'FARDIA DUSTY LAVENDER', size: 'M', price: 218000, stock: 1, category: 'KOKO BAPAK' },
    { name: 'FARDIA DUSTY LAVENDER', size: 'L', price: 218000, stock: 1, category: 'KOKO BAPAK' },
  ];

  for (const prod of products) {
    const sku = `${prod.name.replace(/\s+/g, '-')}-${prod.size}`.toUpperCase();
    await prisma.product.upsert({
      where: { sku: sku },
      update: {
        price: prod.price,
        stockQuantity: prod.stock,
        size: prod.size,
      },
      create: {
        name: prod.name,
        sku: sku,
        price: prod.price,
        costPrice: prod.price * 0.8, // Estimate cost price
        stockQuantity: prod.stock,
        lowStockThreshold: 5,
        categoryId: categoryMap[prod.category],
        size: prod.size,
      },
    });
    console.log(`   - Product ${prod.name} (${prod.size}) seeded`);
  }

  console.log('✅ Clothing data seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
