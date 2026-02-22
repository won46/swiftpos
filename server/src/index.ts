import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import supplierRoutes from './routes/supplier.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import purchaseRoutes from './routes/purchase.routes';
import inventoryRoutes from './routes/inventory.routes';
import paymentRoutes from './routes/payment.routes';
import unitRoutes from './routes/unit.routes';
import discountRoutes from './routes/discount.routes';
import expiryRoutes from './routes/expiry.routes';
import salesReturnRoutes from './routes/salesReturn.routes';
import purchaseReturnRoutes from './routes/purchaseReturn.routes';
import rolePermissionRoutes from './routes/rolePermission.routes';

import customerRoutes from './routes/customer.routes';
import dataManagementRoutes from './routes/dataManagement.routes';

const app: Application = express();
const httpServer = createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS API Server is running' });
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-adjustments', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/sales-returns', salesReturnRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/data', dataManagementRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time updates`);
});

export { io };
