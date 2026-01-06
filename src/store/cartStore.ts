import { create } from 'zustand';
import { CartItem, Product, PaymentMethod } from '@/types';

interface CartItemWithUnit extends CartItem {
  unitType?: string;      // pcs, lusin, kodi, dus
  qtyMultiplier?: number; // How many pcs per unit
  discount?: number;      // Manual discount amount
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
                  totalPrice: ((item.quantity + quantity) * item.unitPrice) - (item.discount || 0),
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
              totalPrice: (quantity * item.unitPrice) - (item.discount || 0),
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
              totalPrice: (item.quantity * item.unitPrice) - discount,
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
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },
  
  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return (subtotal - discountAmount) * (get().taxPercent / 100);
  },
  
  getDiscountAmount: () => {
    // Global discount applied to subtotal (which already has item discounts deducted)
    return get().getSubtotal() * (get().discountPercent / 100);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount(); // This returns 0 if we removed tax logic in components, but logic remains in store
    
    // Based on user request, tax is ignored in display, so we should ensure it returns 0 here or is ignored
    // But for safety let's return it as is, component controls display
    return subtotal - discount; // + tax; // Removing tax from total calc as per previous context
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
