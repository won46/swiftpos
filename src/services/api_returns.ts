// Append to existing api.ts

// Sales Returns API
export const salesReturnsAPI = {
  getAll: (params?: any) =>
    api.get('/sales-returns', { params }),
  
  getById: (id: string) =>
    api.get(`/sales-returns/${id}`),
  
  getByTransaction: (transactionId: string) =>
    api.get(`/sales-returns/transaction/${transactionId}`),
  
  create: (data: any) =>
    api.post('/sales-returns', data),
  
  complete: (id: string) =>
    api.post(`/sales-returns/${id}/complete`),
  
  delete: (id: string) =>
    api.delete(`/sales-returns/${id}`),
};

// Purchase Returns API
export const purchaseReturnsAPI = {
  getAll: (params?: any) =>
    api.get('/purchase-returns', { params }),
  
  getById: (id: string) =>
    api.get(`/purchase-returns/${id}`),
  
  getByPurchaseOrder: (purchaseOrderId: number) =>
    api.get(`/purchase-returns/purchase-order/${purchaseOrderId}`),
  
  create: (data: any) =>
    api.post('/purchase-returns', data),
  
  markRefundReceived: (id: string, refundDate?: string) =>
    api.post(`/purchase-returns/${id}/refund-received`, { refundDate }),
  
  delete: (id: string) =>
    api.delete(`/purchase-returns/${id}`),
};
