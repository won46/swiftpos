import { create } from 'zustand';
import { CartItem, Product, PaymentMethod } from '@/types';

interface CartItemWithUnit extends CartItem {
  unitType?: string;      // pcs, lusin, kodi, dus
  qtyMultiplier?: number; // How many pcs per unit
  discount: number;       // Manual nominal discount amount (calculated from percent or manual)
  discountPercent: number; // Percentage discount
}

interface CartStore {
  items: CartItemWithUnit[];
  customerName: string;
  customerId: string | null; // Added customerId
  discountPercent: number;
  taxPercent: number;
  
  // Actions
  addItem: (product: Product, quantity?: number, unitType?: string, unitPrice?: number, qtyMultiplier?: number) => void;
  removeItem: (productId: string, unitType?: string) => void;
  updateQuantity: (productId: string, quantity: number, unitType?: string) => void;
  setItemDiscount: (productId: string, unitType: string, discount: number) => void;
  setItemDiscountPercent: (productId: string, unitType: string, percent: number) => void;
  setCustomerName: (name: string) => void;
  setCustomer: (id: string | null, name: string) => void; // Added setCustomer
  setDiscount: (percent: number) => void;
  clearCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getTotalPcs: () => number; // Total in pcs for stock
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerName: '',
  customerId: null,
  discountPercent: 0,
  taxPercent: 11, // PPN 11%
  
  addItem: (product, quantity = 1, unitType = 'pcs', unitPrice, qtyMultiplier = 1) => {
    set((state) => {
      // Generate unique key combining productId and unitType
      const itemKey = `${product.id}-${unitType}`;
      const existingItem = state.items.find(
        item => item.productId === product.id && (item.unitType || 'pcs') === unitType
      );
      
      const price = unitPrice ?? Number(product.price);
      
      if (existingItem) {
        return {
          items: state.items.map(item =>
            item.productId === product.id && (item.unitType || 'pcs') === unitType
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  totalPrice: ((item.quantity + quantity) * item.unitPrice) * (1 - (item.discountPercent || 0) / 100),
                  discount: ((item.quantity + quantity) * item.unitPrice) * ((item.discountPercent || 0) / 100)
                }
              : item
          ),
        };
      }
      
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            product,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity,
            unitType,
            qtyMultiplier,
            discount: 0,
            discountPercent: 0,
          },
        ],
      };
    });
  },
  
  removeItem: (productId, unitType = 'pcs') => {
    set((state) => ({
      items: state.items.filter(
        item => !(item.productId === productId && (item.unitType || 'pcs') === unitType)
      ),
    }));
  },
  
  updateQuantity: (productId, quantity, unitType = 'pcs') => {
    if (quantity <= 0) {
      get().removeItem(productId, unitType);
      return;
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.productId === productId && (item.unitType || 'pcs') === unitType
          ? {
              ...item,
              quantity,
              totalPrice: (quantity * item.unitPrice) * (1 - (item.discountPercent || 0) / 100),
              discount: (quantity * item.unitPrice) * ((item.discountPercent || 0) / 100)
            }
          : item
      ),
    }));
  },

  setItemDiscount: (productId, unitType = 'pcs', discount) => {
    set((state) => ({
      items: state.items.map(item =>
        item.productId === productId && (item.unitType || 'pcs') === unitType
          ? {
              ...item,
              discount,
              discountPercent: ((discount / (item.quantity * item.unitPrice)) * 100),
              totalPrice: (item.quantity * item.unitPrice) - discount,
            }
          : item
      ),
    }));
  },

  setItemDiscountPercent: (productId, unitType = 'pcs', percent) => {
    set((state) => ({
      items: state.items.map(item =>
        item.productId === productId && (item.unitType || 'pcs') === unitType
          ? {
              ...item,
              discountPercent: percent,
              discount: (item.quantity * item.unitPrice) * (percent / 100),
              totalPrice: (item.quantity * item.unitPrice) * (1 - percent / 100),
            }
          : item
      ),
    }));
  },
  
  setCustomerName: (name) => set({ customerName: name, customerId: null }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  
  setDiscount: (percent) => set({ discountPercent: Math.min(100, Math.max(0, percent)) }),
  
  clearCart: () => set({ items: [], customerName: '', customerId: null, discountPercent: 0 }),
  
  getSubtotal: () => {
    // Return Gross Subtotal (Sum of Qty * Price)
    return get().items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  },
  
  getTaxAmount: () => {
    const total = get().getTotal();
    return total * (get().taxPercent / 100);
  },
  
  getDiscountAmount: () => {
    // Sum of all item discounts + global discount applied to (Gross Subtotal - Item Discounts)
    const itemDiscounts = get().items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const subtotalAfterItemDiscounts = get().getSubtotal() - itemDiscounts;
    const globalDiscount = subtotalAfterItemDiscounts * (get().discountPercent / 100);
    return itemDiscounts + globalDiscount;
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    return subtotal - discount;
  },
  
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Get total quantity in pcs (for stock calculation)
  getTotalPcs: () => {
    return get().items.reduce((sum, item) => {
      const multiplier = item.qtyMultiplier || 1;
      return sum + (item.quantity * multiplier);
    }, 0);
  },
}));
