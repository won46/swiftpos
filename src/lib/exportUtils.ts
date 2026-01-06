import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Product, StockAdjustment } from '@/types';

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}

// ============================================
// EXCEL EXPORT FUNCTIONS
// ============================================

export function exportTransactionsToExcel(transactions: Transaction[]): void {
  // Prepare data
  const excelData = transactions.map((t) => ({
    'Invoice': t.invoiceNumber,
    'Tanggal': formatDate(t.transactionDate),
    'Waktu': new Date(t.transactionDate).toLocaleTimeString('id-ID'),
    'Customer': t.customerName || 'Walk-in',
    'Items': t.items?.length || 0,
    'Subtotal': t.subtotal,
    'Tax': t.taxAmount,
    'Discount': t.discountAmount,
    'Total': t.totalAmount,
    'Payment': t.paymentMethod,
    'Status': t.status,
    'Kasir': t.user?.fullName || 'N/A',
  }));

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Apply column widths
  const wscols = [
    { wch: 16 }, // Invoice
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Waktu
    { wch: 20 }, // Customer
    { wch: 6 },  // Items
    { wch: 15 }, // Subtotal
    { wch: 12 }, // Tax
    { wch: 12 }, // Discount
    { wch: 15 }, // Total
    { wch: 10 }, // Payment
    { wch: 10 }, // Status
    { wch: 15 }, // Kasir
  ];
  ws['!cols'] = wscols;

  // Download
  XLSX.writeFile(wb, generateFilename('transactions', 'xlsx'));
}

interface SalesReportData {
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    totalItems: number;
    profitMargin: number;
  };
  salesByDate?: Array<{ date: string; revenue: number; transactions: number }>;
  topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
  salesByCategory?: Array<{ category: string; revenue: number; percentage: number }>;
  paymentMethods?: Array<{ method: string; count: number; total: number; percentage: number }>;
  slowProducts?: Array<{ name: string; quantitySold: number; stockQuantity: number; stockValue: number }>;
  dateRange: { startDate: string; endDate: string };
}

export function exportSalesReportToExcel(reportData: SalesReportData): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ['LAPORAN PENJUALAN'],
    [`Periode: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}`],
    [],
    ['Metrik', 'Nilai'],
    ['Total Revenue', formatCurrency(reportData.overview.totalRevenue)],
    ['Total Transaksi', reportData.overview.totalTransactions],
    ['Total Items Terjual', reportData.overview.totalItems],
    ['Profit Margin', `${reportData.overview.profitMargin}%`],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Sheet 2: Daily Sales
  if (reportData.salesByDate && reportData.salesByDate.length > 0) {
    const dailySalesData = reportData.salesByDate.map((d) => ({
      'Tanggal': formatDate(d.date),
      'Revenue': d.revenue,
      'Transaksi': d.transactions,
    }));
    const wsDailySales = XLSX.utils.json_to_sheet(dailySalesData);
    wsDailySales['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsDailySales, 'Penjualan Harian');
  }

  // Sheet 3: Top Products
  if (reportData.topProducts && reportData.topProducts.length > 0) {
    const topProductsData = reportData.topProducts.map((p, idx) => ({
      'Rank': idx + 1,
      'Produk': p.name,
      'Qty Terjual': p.quantity,
      'Revenue': p.revenue,
    }));
    const wsTopProducts = XLSX.utils.json_to_sheet(topProductsData);
    wsTopProducts['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsTopProducts, 'Produk Terlaris');
  }

  // Sheet 4: Category Breakdown
  if (reportData.salesByCategory && reportData.salesByCategory.length > 0) {
    const categoryData = reportData.salesByCategory.map((c) => ({
      'Kategori': c.category,
      'Revenue': c.revenue,
      'Persentase': `${c.percentage.toFixed(1)}%`,
    }));
    const wsCategory = XLSX.utils.json_to_sheet(categoryData);
    wsCategory['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Per Kategori');
  }

  // Sheet 5: Payment Methods
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    const paymentData = reportData.paymentMethods.map((p) => ({
      'Metode': p.method,
      'Jumlah Transaksi': p.count,
      'Total': p.total,
      'Persentase': `${p.percentage.toFixed(1)}%`,
    }));
    const wsPayment = XLSX.utils.json_to_sheet(paymentData);
    wsPayment['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsPayment, 'Metode Pembayaran');
  }

  // Sheet 6: Slow Moving Products
  if (reportData.slowProducts && reportData.slowProducts.length > 0) {
    const slowProductsData = reportData.slowProducts.map((p, idx) => ({
      'Rank': idx + 1,
      'Produk': p.name,
      'Qty Terjual': p.quantitySold,
      'Stok Tersedia': p.stockQuantity,
      'Nilai Stok': p.stockValue,
      'Status': p.quantitySold === 0 ? 'Tidak Terjual' : 'Lambat',
    }));
    const wsSlowProducts = XLSX.utils.json_to_sheet(slowProductsData);
    wsSlowProducts['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSlowProducts, 'Produk Kurang Laku');
  }

  // Download
  XLSX.writeFile(wb, generateFilename('sales-report', 'xlsx'));
}

export function exportStockOpnameToExcel(adjustments: StockAdjustment[]): void {
  // Prepare data
  const excelData = adjustments.map((adj) => ({
    'Produk': adj.product?.name || 'N/A',
    'SKU': adj.product?.sku || 'N/A',
    'Stock Lama': adj.previousQuantity,
    'Stock Baru': adj.newQuantity,
    'Selisih': adj.adjustmentQuantity,
    'Tipe': adj.adjustmentQuantity > 0 ? 'IN' : 'OUT',
    'Alasan': adj.reason || '-',
    'Diubah Oleh': adj.user?.fullName || 'N/A',
    'Tanggal': formatDateTime(adj.createdAt),
  }));

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Opname');

  // Apply column widths
  const wscols = [
    { wch: 25 }, // Produk
    { wch: 12 }, // SKU
    { wch: 12 }, // Stock Lama
    { wch: 12 }, // Stock Baru
    { wch: 10 }, // Selisih
    { wch: 8 },  // Tipe
    { wch: 30 }, // Alasan
    { wch: 18 }, // Diubah Oleh
    { wch: 18 }, // Tanggal
  ];
  ws['!cols'] = wscols;

  // Download
  XLSX.writeFile(wb, generateFilename('stock-opname', 'xlsx'));
}

// ============================================
// PDF EXPORT FUNCTIONS
// ============================================

export function exportReceiptToPDF(transaction: Transaction): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Use A5 for better printing compatibility
  });

  let yPos = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SWIFTPOS', 105, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Modern Point of Sales System', 105, yPos, { align: 'center' });
  
  // Separator line
  yPos += 5;
  doc.line(15, yPos, 195, yPos);
  
  // Invoice details
  yPos += 8;
  doc.setFontSize(9);
  doc.text(`Invoice: ${transaction.invoiceNumber}`, 15, yPos);
  doc.text(`Tanggal: ${formatDateTime(transaction.transactionDate)}`, 15, yPos + 5);
  doc.text(`Kasir: ${transaction.user?.fullName || 'N/A'}`, 15, yPos + 10);
  if (transaction.customerName) {
    doc.text(`Customer: ${transaction.customerName}`, 15, yPos + 15);
    yPos += 5;
  }

  // Items table
  yPos += 18;
  const itemsData = transaction.items.map((item) => [
    item.product?.name || 'Product',
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Qty', 'Harga', 'Subtotal']],
    body: itemsData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 45, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
  yPos = finalY + 8;

  // Totals
  doc.setFontSize(9);
  const rightX = 195;
  const labelX = rightX - 70;

  doc.text('Subtotal:', labelX, yPos, { align: 'left' });
  doc.text(formatCurrency(transaction.subtotal), rightX, yPos, { align: 'right' });

  yPos += 5;
  doc.text(`Tax (11%):`, labelX, yPos, { align: 'left' });
  doc.text(formatCurrency(transaction.taxAmount), rightX, yPos, { align: 'right' });

  if (transaction.discountAmount > 0) {
    yPos += 5;
    doc.text('Discount:', labelX, yPos, { align: 'left' });
    doc.text(`-${formatCurrency(transaction.discountAmount)}`, rightX, yPos, { align: 'right' });
  }

  // Separator
  yPos += 3;
  doc.line(labelX, yPos, rightX, yPos);

  // Grand Total
  yPos += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', labelX, yPos, { align: 'left' });
  doc.text(formatCurrency(transaction.totalAmount), rightX, yPos, { align: 'right' });

  // Payment details
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Metode Pembayaran: ${transaction.paymentMethod}`, labelX, yPos, { align: 'left' });

  // Footer
  yPos += 15;
  doc.setFontSize(8);
  doc.text('Terima kasih atas kunjungan Anda!', 105, yPos, { align: 'center' });
  doc.text('--- STRUK INI ADALAH BUKTI PEMBAYARAN YANG SAH ---', 105, yPos + 4, { align: 'center' });

  // Download
  doc.save(`receipt-${transaction.invoiceNumber}.pdf`);
}

export function exportSalesReportToPDF(reportData: SalesReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN PENJUALAN', 105, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Periode: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}`,
    105,
    yPos,
    { align: 'center' }
  );

  // Overview section
  yPos += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 20, yPos);

  yPos += 8;
  const overviewData = [
    ['Total Revenue', formatCurrency(reportData.overview.totalRevenue)],
    ['Total Transaksi', reportData.overview.totalTransactions.toString()],
    ['Total Items Terjual', reportData.overview.totalItems.toString()],
    ['Profit Margin', `${reportData.overview.profitMargin}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metrik', 'Nilai']],
    body: overviewData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' },
    },
    margin: { left: 20 },
  });

  // Top Products
  if (reportData.topProducts && reportData.topProducts.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 12;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Produk Terlaris', 20, yPos);

    yPos += 8;
    const topProductsData = reportData.topProducts.slice(0, 10).map((p, idx) => [
      (idx + 1).toString(),
      p.name,
      p.quantity.toString(),
      formatCurrency(p.revenue),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produk', 'Qty', 'Revenue']],
      body: topProductsData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 20 },
    });
  }

  // Category Breakdown
  if (reportData.salesByCategory && reportData.salesByCategory.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Penjualan Per Kategori', 20, yPos);

    yPos += 8;
    const categoryData = reportData.salesByCategory.map((c) => [
      c.category,
      formatCurrency(c.revenue),
      `${c.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Kategori', 'Revenue', 'Persentase']],
      body: categoryData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 20 },
    });
  }

  // Slow Moving Products (New Section)
  if (reportData.slowProducts && reportData.slowProducts.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Produk Kurang Laku (Slow Moving)', 20, yPos);

    yPos += 8;
    const slowProductsData = reportData.slowProducts.slice(0, 10).map((p, idx) => [
      (idx + 1).toString(),
      p.name,
      p.quantitySold.toString(),
      p.stockQuantity.toString(),
      formatCurrency(p.stockValue),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Produk', 'Qty Jual', 'Stok', 'Nilai Stok']],
      body: slowProductsData,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12], // Orange-600
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: 20 },
    });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${formatDateTime(new Date())} | Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  // Download
  doc.save(generateFilename('sales-report', 'pdf'));
}
