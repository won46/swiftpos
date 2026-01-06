import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  getMe: () =>
    api.get('/auth/me'),
};

// Products API
export const productsAPI = {
  getAll: (params?: { 
    search?: string; 
    category?: number; 
    isActive?: boolean;
    barcode?: string;
  }) =>
    api.get('/products', { params }),
  
  getById: (id: string) =>
    api.get(`/products/${id}`),

  getByBarcode: (barcode: string) =>
    api.get(`/products/barcode/${barcode}`),
  
  getLowStock: () =>
    api.get('/products/low-stock'),
  
  create: (data: FormData | any) =>
    api.post('/products', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  
  update: (id: string, data: FormData | any) =>
    api.put(`/products/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  
  delete: (id: string) =>
    api.delete(`/products/${id}`),
    
  adjustStock: (id: string, data: {
    adjustmentQuantity: number;
    reason: string;
  }) =>
    api.post(`/products/${id}/adjust-stock`, data),
};

// Stock Adjustments API
export const stockAPI = {
  getAdjustments: (params?: { productId?: string; startDate?: string; endDate?: string }) =>
    api.get('/stock-adjustments', { params }),
  
  createAdjustment: (data: {
    productId: string;
    newQuantity: number;
    reason: string;
  }) =>
    api.post('/stock-adjustments', data),
};

// Units API
export const unitsAPI = {
  getAll: (includeInactive = false) =>
    api.get('/units', { params: { includeInactive } }),
  
  getById: (id: number) =>
    api.get(`/units/${id}`),
  
  create: (data: { name: string; label: string; qty: number }) =>
    api.post('/units', data),
  
  update: (id: number, data: { name?: string; label?: string; qty?: number; isActive?: boolean }) =>
    api.put(`/units/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/units/${id}`),
  
  seed: () =>
    api.get('/units/seed'),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params?: any) =>
    api.get('/transactions', { params }),
  
  getById: (id: string) =>
    api.get(`/transactions/${id}`),
  
  getTodayStats: () =>
    api.get('/transactions/stats/today'),
  
  create: (data: {
    customerName?: string;
    customerId?: string; // Added customerId
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'DEBT'; // Updated payment methods
  }) =>
    api.post('/transactions', data),

  repayDebt: (id: string, data: {
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'QRIS';
    notes?: string;
  }) =>
    api.post(`/transactions/${id}/repay`, data),
};

// Categories API
export const categoriesAPI = {
  getAll: () =>
    api.get('/categories'),
  
  getById: (id: number) =>
    api.get(`/categories/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    api.post('/categories', data),
  
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: { isActive?: boolean }) =>
    api.get('/suppliers', { params }),
  
  getById: (id: string) =>
    api.get(`/suppliers/${id}`),
  
  create: (data: {
    name: string;
    contactPerson: string;
    email?: string;
    phone?: string;
    address?: string;
  }) =>
    api.post('/suppliers', data),
  
  update: (id: string, data: {
    name: string;
    contactPerson: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
  }) =>
    api.put(`/suppliers/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/suppliers/${id}`),
};

// Purchase Orders API
export const purchasesAPI = {
  getAll: (params?: { status?: string; supplierId?: string }) =>
    api.get('/purchases', { params }),
  
  getById: (id: string) =>
    api.get(`/purchases/${id}`),
  
  create: (data: {
    supplierId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    notes?: string;
  }) =>
    api.post('/purchases', data),
  
  receive: (id: string) =>
    api.put(`/purchases/${id}/receive`),
  
  cancel: (id: string) =>
    api.delete(`/purchases/${id}`),
};


// Reports API
export const reportsAPI = {
  getOverview: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/overview', { params }),
  
  getSalesByDate: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/sales-by-date', { params }),
  
  getTopProducts: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/reports/top-products', { params }),
  
  getSalesByCategory: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/sales-by-category', { params }),
  
  getPaymentMethods: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/payment-methods', { params }),
  
  getSlowProducts: (params?: { days?: number; limit?: number }) =>
    api.get('/reports/slow-products', { params }),
  
  getDailySales: (days = 7) =>
    api.get('/reports/daily-sales', { params: { days } }),
  
  getProductStats: (days = 30) =>
    api.get('/reports/product-stats', { params: { days } }),
};

// Inventory API
export const inventoryAPI = {
  getReport: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/inventory/report', { params }),
};

// Users API
export const usersAPI = {
  getAll: (params?: { role?: string; isActive?: boolean }) =>
    api.get('/users', { params }),
  
  getById: (id: string) =>
    api.get(`/users/${id}`),
  
  create: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'KASIR';
  }) =>
    api.post('/users', data),
  
  update: (id: string, data: {
    email: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'KASIR';
    isActive: boolean;
    password?: string;
  }) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteProductImage: (filename: string) =>
    api.delete(`/upload/product/${filename}`),
};

// Payments API
export const paymentsAPI = {
  createQris: (data: {
    amount: number;
    items?: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      name: string;
    }>;
    customerName?: string;
  }) =>
    api.post('/payments/qris/create', data),
  
  checkStatus: (orderId: string) =>
    api.get(`/payments/qris/${orderId}/status`),
  
  cancelPayment: (orderId: string) =>
    api.post(`/payments/qris/${orderId}/cancel`),
};

// Discounts API
export const discountsAPI = {
  getAll: (params?: { isActive?: boolean }) =>
    api.get('/discounts', { params }),
  
  getById: (id: string) =>
    api.get(`/discounts/${id}`),
  
  getByCode: (code: string) =>
    api.get(`/discounts/code/${code}`),
  
  create: (data: {
    code: string;
    name: string;
    description?: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    minPurchase?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }) =>
    api.post('/discounts', data),
  
  update: (id: string, data: any) =>
    api.put(`/discounts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/discounts/${id}`),
  
  validate: (code: string, amount: number) =>
    api.post('/discounts/validate', { code, amount }),
  
  getApplicableForProduct: (productId: string) =>
    api.get(`/discounts/product/${productId}/applicable`),
  
  getBestForProduct: (productId: string, price: number) =>
    api.get(`/discounts/product/${productId}/best`, { params: { price } }),
};

// Expiry API
export const expiryAPI = {
  getExpired: () =>
    api.get('/expiry/expired'),
  
  getNearExpiry: (days: number = 30) =>
    api.get('/expiry/near-expiry', { params: { days } }),
  
  getSummary: () =>
    api.get('/expiry/summary'),
  
  markDisposed: (productId: string, reason: string, quantity?: number) =>
    api.post('/expiry/dispose', { productId, reason, quantity }),
};

// Role Permissions API
export const rolePermissionsAPI = {
  getAll: () =>
    api.get('/role-permissions'),
  
  getByRole: (role: string) =>
    api.get(`/role-permissions/${role}`),
  
  update: (id: string, data: any) =>
    api.put(`/role-permissions/${id}`, data),
  
  bulkUpdate: (role: string, permissions: any[]) =>
    api.put(`/role-permissions/role/${role}`, { permissions }),
  
  resetToDefaults: (role: string) =>
    api.post(`/role-permissions/reset/${role}`),
};

// Customers API
export const customersAPI = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/customers', { params }),
  
  getById: (id: string) =>
    api.get(`/customers/${id}`),
  
  create: (data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
  }) =>
    api.post('/customers', data),
  
  update: (id: string, data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    isActive?: boolean;
  }) =>
    api.put(`/customers/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/customers/${id}`),
};

// Helper to get full image URL
export const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${imageUrl}`;
};
