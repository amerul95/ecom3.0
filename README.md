# E-Commerce Platform

A modern full-stack e-commerce application built with Next.js, featuring product catalog, shopping cart, checkout, and payment integration (OxPay, ToyyibPay).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS, Radix UI
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (credentials + Google OAuth)
- **Payments:** OxPay HPP, ToyyibPay
- **Storage:** AWS S3 / Supabase Storage for product images

## Architecture Overview

This application follows a modular full-stack architecture using Next.js App Router.

- Frontend: Server Components + Client Components separation
- Backend: API routes within `app/api`
- Authentication: NextAuth with session-based strategy
- Database: Prisma ORM with PostgreSQL
- Payment Flow: External PSP redirect (OxPay / ToyyibPay) + webhook verification
- Storage: Product images stored in S3 / Supabase with secure upload handling

## Data Modeling

The database schema is designed using Prisma with relational modeling:

- Users
- Products
- Categories
- Orders
- OrderItems
- Payments
- Vouchers

Foreign key relationships ensure referential integrity.
Indexes applied for product search and order lookups.

## Features

- **Storefront:** Browse products by category, search, product detail pages
- **Cart & Checkout:** Add to cart, shipping info, voucher support
- **Payments:** OxPay and ToyyibPay integration with webhooks
- **Admin:** Dashboard, product management, order management, user management
- **Auth:** Register, login, Google sign-in, password reset

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd ecom3.0
npm install
```

### 2. Environment variables

Create a `.env` file in the project root and add your configuration. Required variables include:

Key variables:

- `DATABASE_URL` – PostgreSQL connection string
- `DIRECT_URL` – Direct PostgreSQL URL (for migrations)
- `NEXTAUTH_SECRET` – Secret for NextAuth.js
- `NEXTAUTH_URL` – App URL (e.g. `http://localhost:3000`)
- Payment credentials (OxPay, ToyyibPay)
- Storage (S3 or Supabase) for image uploads

### 3. Database setup

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |

## Project Structure

```
├── app/                 # Next.js App Router pages & API routes
│   ├── [category]/      # Category pages
│   ├── admin/           # Admin dashboard & product management
│   ├── api/             # API routes (cart, orders, payments, etc.)
│   ├── checkout/        # Checkout flow
│   └── ...
├── components/          # Reusable UI components
├── lib/                 # Utilities, auth config, storage
├── prisma/              # Schema and migrations
├── server/              # DAL, auth policies
├── shopContext/         # Cart and shop state
└── views/               # Page-level view components
```

## Deploy on Vercel

1. Push your code to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add environment variables.
4. Deploy.

Ensure `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and payment/storage vars are set in the Vercel project settings.

## License

Private / MIT – as per your project setup.
