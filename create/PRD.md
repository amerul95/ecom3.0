# PRD.md — E-Commerce Web App

## 1. Product Overview
**Product Name:** (Your app name here)  
**Type:** Fullstack E-Commerce Web Application (Next.js + PostgreSQL)  
**Goal:** Create a scalable marketplace platform that connects **buyers** and **sellers**, enabling product listing, browsing, purchasing, and management with secure payments through OxPay and smooth user experience.

---

## 2. Objectives
- Provide buyers a seamless, modern eCommerce experience from discovery to checkout.  
- Empower sellers with tools to manage products, inventory, and sales efficiently.  
- Support secure transactions using **OxPay payment gateway**.  
- Ensure scalability, responsiveness, and data integrity with a **Next.js + PostgreSQL** stack.  

---

## 3. Key User Roles
| Role | Description | Access Level |
|------|--------------|--------------|
| **Buyer** | End user who browses and purchases products. | Basic |
| **Seller** | Vendor who lists, manages, and fulfills products. | Elevated |
| **Admin** | Platform operator overseeing all activity and system data. | Full |

---

## 4. Core Features

### 🛒 Buyer Features
- **Authentication & Profile**
  - Register/login with email & password, OAuth (Google, Facebook optional)
  - Manage profile, delivery addresses, and wishlist
  - View order history and invoices  
- **Product Discovery**
  - Browse categories, search by keyword
  - Advanced filters (category, price, rating)
  - Product detail page with reviews, gallery, related products  
- **Cart & Checkout**
  - Add/remove products from cart  
  - Apply discount codes  
  - **Secure checkout via OxPay API** (credit/debit card, wallet)  
  - Order confirmation and email receipt (via SMTP)
- **Order Management**
  - Track order status (Pending, Shipped, Delivered)
  - Request return/refund  
  - Submit product reviews  

### 🏪 Seller Features
- **Authentication & Verification**
  - Seller signup and profile setup  
  - KYC/verification (manual or admin-approval flow)  
- **Product Management**
  - Add/edit/delete product listings  
  - Bulk upload (CSV or XLSX)  
  - Manage stock, variants, pricing, and images  
- **Order & Inventory Management**
  - View and process orders  
  - Update shipping/tracking info  
  - Manage stock levels with alerts  
- **Earnings & Analytics**
  - View sales and earnings reports  
  - Request payouts (manual or automatic)  
  - Track top-selling products, revenue trends  

### 🧑‍💼 Admin Features
- **Dashboard Overview**
  - Platform KPIs (sales, active users, products)  
  - Real-time metrics and analytics  
- **User Management**
  - Approve/reject new sellers  
  - Suspend or delete accounts  
  - Manage roles and permissions  
- **Product & Category Management**
  - Approve new listings  
  - Create/edit/delete categories  
  - Monitor flagged or reported items  
- **Order & Payment Oversight**
  - View all transactions  
  - Handle refund/dispute processes  
  - View OxPay payment logs  
- **Reports**
  - Revenue and commission reports  
  - User growth and retention stats  

---

## 5. Technical Architecture

| Layer | Technology / Notes |
|--------|---------------------|
| **Frontend** | **Next.js (App Router)** — React-based SSR/ISR for SEO & speed |
| **Backend** | **Next.js API Routes** (Node.js + Express-like logic) |
| **Database** | **PostgreSQL** via Prisma ORM |
| **Authentication** | **NextAuth.js** with JWT & OAuth providers |
| **Payment Integration** | **OxPay** (REST API) for secure transactions |
| **Email Service** | Custom **SMTP** integration (Nodemailer) |
| **Storage** | AWS S3 / Cloudinary for product images |
| **Deployment** | Vercel / AWS / Render (depending on scale) |
| **Caching & Optimization** | Redis (optional) for sessions & page caching |
| **Security** | HTTPS, CSRF, bcrypt password hashing, input validation |
| **API Documentation** | Swagger / Postman collection |

---

## 6. Non-Functional Requirements
- **Performance:** <2s load time, server-side rendering via Next.js  
- **Scalability:** Horizontal scaling via serverless deployments  
- **Security:** PCI-DSS-compliant OxPay integration  
- **Reliability:** 99.9% uptime target  
- **Usability:** Responsive, mobile-first design (from existing UI/UX)  
- **Compliance:** GDPR-ready user data handling  

---

## 7. Data Models (PostgreSQL via Prisma ORM)

| Entity | Key Fields |
|--------|-------------|
| **User** | id, name, email, password, role, created_at |
| **SellerProfile** | id, user_id, store_name, verified, kyc_docs |
| **Product** | id, seller_id, name, description, price, stock, category_id, images |
| **Category** | id, name, parent_id |
| **Order** | id, buyer_id, total_price, status, payment_id, created_at |
| **OrderItem** | id, order_id, product_id, quantity, price |
| **Review** | id, product_id, buyer_id, rating, comment |
| **Payment** | id, order_id, oxpay_transaction_id, amount, status |
| **Notification** | id, user_id, type, message, read |

---

## 8. Integrations

| Service | Purpose |
|----------|----------|
| **OxPay API** | Payment processing (capture, refund, verify) |
| **SMTP Service** | Transactional emails (order confirmation, reset password) |
| **Cloudinary / AWS S3** | Image uploads |
| **NextAuth.js** | Authentication and session management |

---

## 9. Future Enhancements
- Buyer–Seller chat with real-time messaging  
- Loyalty points and referral programs  
- AI-based product recommendations  
- Multi-currency and language support  
- Delivery tracking API integration (e.g. EasyParcel, NinjaVan)

---

## 10. Success Metrics
- Buyer conversion rate (>2.5%)  
- Average order value (AOV) growth  
- Seller onboarding success rate  
- Cart abandonment rate (<40%)  
- Payment success rate (via OxPay)  
- User satisfaction (NPS > 70)

---

**Author:** [Your Name / Team]  
**Version:** 1.0  
**Date:** 2025-11-05
