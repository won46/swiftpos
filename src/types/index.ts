// Types for POS Application

declare global {
  interface Window {
    snap: any;
  }
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';
export type PaymentMethod = 'CASH' | 'CARD' | 'QRIS' | 'DEBT' | 'SPLIT' | 'CASHLESS';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'VOID';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: number;
  category?: Category;
  supplierId?: string;
  supplier?: Supplier;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  size?: string;
  color?: string;
  // Expiry tracking
  expiryDate?: Date;
  manufactureDate?: Date;
  batchNumber?: string;
  expiryAlertDays?: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  userId: string;
  user?: User;
  customerName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  transactionDate: Date;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  discountPercent?: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  product?: Product;
  previousQuantity: number;
  newQuantity: number;
  adjustmentQuantity: number;
  reason: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface DailySalesReport {
  date: string;
  totalTransactions: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchase?: number;
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  applicableProducts?: string[];
  applicableUnit?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

export type ExpiryStatus = 'expired' | 'urgent' | 'warning' | 'normal' | 'no_expiry';

export interface ProductWithExpiry extends Product {
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  receivedAt?: Date;
  notes?: string;
  createdBy: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderItem[];
}

// Returns
export * from './returns';

// Role Permissions
export interface RolePermission {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  menuPath: string;
  menuLabel: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  currentDebt: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate: Date;
}
