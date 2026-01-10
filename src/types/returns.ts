import type { Product, User, Transaction, PurchaseOrder, Supplier } from './index';

// Append to existing types
export type RefundMethod = 'CASH' | 'TRANSFER';
export type ReturnStatus = 'APPROVED' | 'COMPLETED';
export type ItemCondition = 'NEW' | 'OPENED' | 'DAMAGED';

export interface SalesReturnItem {
  id: string;
  salesReturnId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason?: string;
  condition: ItemCondition;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  transactionId: string;
  transaction?: Transaction;
  returnDate: Date;
  reason: string;
  notes?: string;
  refundAmount: number;
  refundMethod: RefundMethod;
  status: ReturnStatus;
  userId: string;
  user?: User;
  items: SalesReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseReturnItem {
  id: string;
  purchaseReturnId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason?: string;
  condition: ItemCondition;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseOrderId: number;
  purchaseOrder?: PurchaseOrder;
  supplierId: string;
  supplier?: Supplier;
  returnDate: Date;
  reason: string;
  notes?: string;
  returnAmount: number;
  refundReceived: boolean;
  refundDate?: Date;
  userId: string;
  user?: User;
  items: PurchaseReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}
