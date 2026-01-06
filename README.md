# SwiftPOS - Modern Point of Sales System

<div align="center">

![SwiftPOS](https://img.shields.io/badge/SwiftPOS-v1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**A modern, full-featured Point of Sales system built with Next.js, Express, and PostgreSQL**

[Features](#-features) • [Demo](#-demo-accounts) • [Installation](#-installation) • [Documentation](#-usage) • [API](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Demo Accounts](#-demo-accounts)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🌟 Overview

SwiftPOS is a complete, production-ready Point of Sales system designed for modern retail businesses. Built with enterprise-grade technologies, it offers a beautiful dark-themed UI, real-time analytics, comprehensive inventory management, and robust authentication.

### Key Highlights

- ✅ **Complete POS System** - Fast checkout with multi-payment support
- ✅ **Inventory Management** - Full product lifecycle management
- ✅ **Business Analytics** - Interactive charts and insights
- ✅ **User Management** - Role-based access control
- ✅ **Stock Auditing** - Bulk adjustments with audit trail
- ✅ **Modern UI** - Dark theme with smooth animations
- ✅ **Enterprise Security** - JWT authentication, password hashing
- ✅ **Real-time Updates** - Socket.IO integration ready

---

## ✨ Features

### 🛒 Point of Sales (Kasir)
- Product browsing with real-time search
- Category filtering
- Shopping cart management
- Multi-payment methods (Cash, Card, QRIS)
- Automatic tax calculation (PPN 11%)
- Discount application
- Change calculation
- Invoice generation
- Auto stock deduction

### 📦 Product Management
- Complete CRUD operations
- Stock level tracking
- Low stock alerts
- Category organization
- Supplier linking
- Price management (sell & cost)
- SKU tracking

### 🏢 Supplier Management
- Vendor information management
- Contact details tracking
- Product count per supplier
- Active/inactive status

### 📊 Stock Taking (Opname)
- Bulk stock adjustments
- Quick adjust buttons (+/-1, +/-10)
- Manual quantity input
- Adjustment history
- Required reason tracking
- User attribution
- Real-time preview

### 📈 Reports & Analytics
- Sales overview dashboard
- Sales trend charts (line graph)
- Category breakdown (pie chart)
- Top products (bar chart)
- Payment method analysis
- Custom date range filtering
- Export functionality (UI ready)

### 👥 User Management
- User CRUD operations
- Role-based permissions (Admin, Manager, Kasir)
- Password management with bcrypt
- Active/inactive status
- Cannot delete users with transactions

### 📝 Transaction Management
- Complete sales history
- Search by invoice/customer/cashier
- Filter by payment method and status
- Transaction details view
- Date range filtering

### 🔐 Authentication
- Secure login page
- JWT token-based auth
- Protected routes
- Auto-refresh tokens
- Logout functionality
- Session management

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Password**: bcrypt
- **Real-time**: Socket.IO

### Development
- **Package Manager**: npm
- **Database Tools**: Prisma Studio
- **API Testing**: Built-in REST endpoints

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Git** (for cloning)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/swiftpos.git
cd swiftpos
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Setup Environment Variables

**Backend** (`server/.env`):

```env
# Server
PORT=5001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pos"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 5. Setup Database

```bash
cd server

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run prisma:seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 6. Run Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Prisma Studio**: http://localhost:5555

---

## ⚙️ Configuration

### Database Schema

The application uses the following tables:
- `users` - User accounts with roles
- `categories` - Product categories
- `suppliers` - Vendor information
- `products` - Inventory items
- `transactions` - Sales records
- `transaction_items` - Line items
- `stock_adjustments` - Inventory changes

### User Roles

- **ADMIN**: Full system access
- **MANAGER**: Products, suppliers, reports, stock
- **KASIR**: POS access only

### Environment Variables

See `server/env.example` for complete configuration options.

---

## 📖 Usage

### First Login

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Use demo accounts (see below) or create new users

### Creating Users

1. Login as admin
2. Navigate to `/users`
3. Click "Tambah User"
4. Fill in details and assign role
5. New user can now login

### Processing Sales

1. Go to `/pos`
2. Search or browse products
3. Add items to cart
4. Enter customer name (optional)
5. Apply discount if needed
6. Click "Bayar Sekarang"
7. Select payment method
8. Complete transaction

### Viewing Analytics

1. Go to `/reports`
2. Select date range
3. View charts and insights
4. Export data (if needed)

### Stock Adjustment

1. Go to `/stock-taking`
2. Use quick buttons or manual input
3. Enter reason for adjustment
4. Review pending changes
5. Save all adjustments

---

## 🔑 Demo Accounts

### Admin Account
- **Email**: admin@swiftpos.com
- **Password**: admin123
- **Access**: Full system access

### Cashier Account
- **Email**: kasir@swiftpos.com
- **Password**: cashier123
- **Access**: POS only

---

## 📚 API Reference

### Base URL
```
http://localhost:5001/api
```

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Products

#### Get All Products
```http
GET /products
Authorization: Bearer {accessToken}

Query Parameters:
- search: string
- category: number
- lowStock: boolean
```

#### Create Product
```http
POST /products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Product Name",
  "sku": "SKU001",
  "price": 10000,
  "costPrice": 8000,
  "stockQuantity": 100,
  "lowStockThreshold": 10,
  "categoryId": 1
}
```

### Transactions

#### Create Transaction
```http
POST /transactions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "customerName": "John Doe",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 10000,
      "totalPrice": 20000
    }
  ],
  "subtotal": 20000,
  "taxAmount": 2200,
  "discountAmount": 0,
  "totalAmount": 22200,
  "paidAmount": 25000,
  "paymentMethod": "CASH"
}
```

#### Get Today's Stats
```http
GET /transactions/stats/today
Authorization: Bearer {accessToken}
```

### More Endpoints

- `GET /categories` - Get categories
- `GET /suppliers` - Get suppliers
- `POST /stock-adjustments` - Create stock adjustment
- `GET /reports/overview` - Sales overview
- `GET /reports/top-products` - Top selling products
- `GET /users` - Get users (Admin only)

---

## 🚢 Deployment

### Production Build

**Frontend:**
```bash
npm run build
npm start
```

**Backend:**
```bash
cd server
npm run build
npm start
```

### Environment Variables (Production)

Update the following for production:

```env
NODE_ENV=production
JWT_SECRET=use-strong-random-secret-minimum-32-characters
JWT_REFRESH_SECRET=use-different-strong-random-secret
DATABASE_URL=your-production-database-url
FRONTEND_URL=https://your-domain.com
```

### Deployment Platforms

#### Vercel (Frontend recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

#### Railway/Render (Backend + Database recommended)
1. Create PostgreSQL database instance
2. Deploy Node.js backend
3. Set environment variables
4. Run migrations: `npx prisma migrate deploy`
5. Seed database: `npm run prisma:seed`

---

## 📁 Project Structure

```
swiftpos/
├── src/                          # Frontend source
│   ├── app/                      # Next.js pages
│   │   ├── dashboard/            # Dashboard page
│   │   ├── pos/                  # POS checkout
│   │   ├── products/             # Product management
│   │   ├── suppliers/            # Supplier management
│   │   ├── stock-taking/         # Stock opname
│   │   ├── transactions/         # Transaction history
│   │   ├── reports/              # Analytics
│   │   ├── users/                # User management
│   │   └── login/                # Login page
│   ├── components/               # Reusable components
│   │   ├── ui/                   # UI components
│   │   ├── layout/               # Layout components
│   │   └── pos/                  # POS-specific
│   ├── services/                 # API services
│   ├── store/                    # State management
│   └── types/                    # TypeScript types
│
├── server/                       # Backend source
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Express middleware
│   │   └── config/               # Configuration
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       └── seed.ts               # Seed data
│
├── public/                       # Static assets
├── .env.local                    # Frontend env
└── server/.env                   # Backend env
```

---

## 🎯 Suitable For

- ✅ Retail stores
- ✅ Minimarkets & convenience stores
- ✅ Specialty shops
- ✅ Boutiques
- ✅ Pharmacies
- ✅ Electronics stores
- ✅ Small to medium businesses

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database with [Prisma](https://www.prisma.io/)
- Charts by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📞 Support

For issues, questions, or suggestions:

- 🐛 Create an issue on GitHub
- 💬 Start a discussion
- 📧 Contact the maintainers

---

<div align="center">

**Made with ❤️ for modern retail businesses**

⭐ Star this repo if you find it helpful!

</div>
