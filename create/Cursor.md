# Cursor.md — E‑Commerce Full‑Stack Project Guide (Next.js + PostgreSQL)

This document guides Cursor sessions (Chat/Composer/Agent) to implement and iterate on an e‑commerce web app with **Buyer** and **Seller** flows, plus **Admin**. It is derived from the PRD you approved.

> **Tech stack**
> - **Framework:** Next.js (App Router)
> - **DB:** PostgreSQL via Prisma ORM
> - **Auth:** NextAuth.js (Credentials + optional Google OAuth)
> - **Payments:** **OxPay API** (placeholder endpoints until docs provided)
> - **Email:** Custom SMTP via Nodemailer
> - **Storage:** Cloudinary or S3 (choose one via env flag)
> - **Cache/Queues (optional):** Redis
> - **Deploy:** Vercel / AWS
>
> **Key Roles:** Buyer, Seller, Admin

---

## 0) Repository Layout (target)

```
apps/
  web/                       # Next.js (App Router)
    app/
      (public)/              # marketing pages
      (buyer)/               # buyer routes
      (seller)/dashboard/    # seller dashboard routes (protected)
      (admin)/dashboard/     # admin routes (protected)
      api/                   # Next.js API routes
        auth/
        products/
        orders/
        payments/
        webhooks/
    components/
    lib/
      auth/
      db/
      validators/
      services/              # payment, email, storage adapters
      utils/
    prisma/
      schema.prisma
      seed.ts
    public/
    styles/
    tests/
      e2e/
      unit/
  infra/                     # Docker, Terraform (optional)
  scripts/                   # data loads, codegen
README.md
Cursor.md
```

---

## 1) Project Setup (Cursor “Run” checklist)

1. **Create app**
   - `npx create-next-app@latest web --ts --eslint --tailwind --app`
2. **Install deps**
   ```bash
   cd web
   npm i @prisma/client prisma next-auth zod bcrypt jsonwebtoken
   npm i nodemailer
   npm i axios
   npm i uploadthing @uploadthing/react # or aws-sdk/cloudinary if preferred
   npm i class-variance-authority clsx date-fns
   npm i -D @types/node @types/bcrypt @types/jsonwebtoken vitest @testing-library/react @testing-library/jest-dom playwright @types/nodemailer tsx
   ```
3. **Prisma init**
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
4. **Set environment (see `.env` below).**
5. **Scaffold folders** as per layout.
6. **Generate client & migrate**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
7. **Start dev**
   ```bash
   npm run dev
   ```

---

## 2) Environment Variables (`.env.example`)

```dotenv
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public

# Auth
NEXTAUTH_SECRET=replace_me
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Shop <no-reply@yourdomain.com>"

# Storage
UPLOAD_PROVIDER=cloudinary # or s3
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# or AWS creds if using S3

# Payments (OxPay) — placeholders; fill from vendor docs
OXPAY_BASE_URL=
OXPAY_MERCHANT_ID=
OXPAY_API_KEY=
OXPAY_SECRET=
OXPAY_WEBHOOK_SECRET=

# Redis (optional)
REDIS_URL=
```

---

## 3) Data Model (Prisma — minimum viable)

> Adjust fields as needed; keep enums consistent with API/UI.

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { BUYER SELLER ADMIN }
enum OrderStatus { PENDING PAID PROCESSING SHIPPED DELIVERED CANCELLED REFUNDED }
enum PaymentStatus { INITIATED AUTHORIZED CAPTURED FAILED REFUNDED }

model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  passwordHash  String
  role          Role     @default(BUYER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sellerProfile SellerProfile?
  orders        Order[]
  reviews       Review[]
  addresses     Address[]
}

model SellerProfile {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String   @unique
  storeName  String
  verified   Boolean  @default(false)
  kycDocsUrl String?
  products   Product[]
}

model Category {
  id        String     @id @default(cuid())
  name      String
  parentId  String?
  parent    Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryToCategory")
  products  Product[]
}

model Product {
  id          String    @id @default(cuid())
  seller      SellerProfile @relation(fields: [sellerId], references: [id])
  sellerId    String
  name        String
  slug        String    @unique
  description String
  price       Decimal   @db.Decimal(10,2)
  stock       Int
  images      String[]
  category    Category? @relation(fields: [categoryId], references: [id])
  categoryId  String?
  variants    Variant[]
  reviews     Review[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Variant {
  id        String   @id @default(cuid())
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  name      String   // e.g., "Color: Red, Size: M"
  sku       String   @unique
  price     Decimal? @db.Decimal(10,2)
  stock     Int?
}

model Review {
  id        String   @id @default(cuid())
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
}

model Address {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  label     String?
  line1     String
  line2     String?
  city      String
  state     String?
  postal    String
  country   String
  isDefault Boolean  @default(false)
}

model CartItem {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  variant   Variant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int      @default(1)
  addedAt   DateTime @default(now())
}

model Order {
  id         String        @id @default(cuid())
  user       User          @relation(fields: [userId], references: [id])
  userId     String
  status     OrderStatus   @default(PENDING)
  total      Decimal       @db.Decimal(10,2)
  items      OrderItem[]
  payment    Payment?
  shipping   ShippingInfo?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model OrderItem {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  variant   Variant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int
  price     Decimal  @db.Decimal(10,2)
}

model ShippingInfo {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String   @unique
  address   String
  city      String
  state     String?
  postal    String
  country   String
  carrier   String?
  tracking  String?
}

model Payment {
  id             String        @id @default(cuid())
  order          Order         @relation(fields: [orderId], references: [id])
  orderId        String        @unique
  provider       String        @default("oxpay")
  providerRef    String?       // OxPay transaction id
  status         PaymentStatus @default(INITIATED)
  amount         Decimal       @db.Decimal(10,2)
  currency       String        @default("MYR")
  rawPayload     Json?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

**Seed**: create demo users (buyer/seller/admin), categories, and products for local development.

---

## 4) Route Map (App Router)

- `/` — storefront home (collections, featured)
- `/auth/*` — sign-in, sign-up, reset
- `/categories/[slug]`
- `/product/[slug]`
- `/cart`
- `/checkout` → creates Order + Payment intent
- `/orders` (buyer list) and `/orders/[id]`
- `/seller/dashboard` (guarded)
  - `/seller/products`
  - `/seller/orders`
  - `/seller/analytics`
- `/admin/dashboard` (guarded)
  - `/admin/users`
  - `/admin/sellers`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/reports`

**API** (Next.js API routes under `/app/api`):
- `POST /api/auth/*` — handled by NextAuth
- `GET /api/products` `POST /api/products` `PATCH /api/products/[id]` `DELETE ...`
- `GET /api/categories`
- `POST /api/cart` `PATCH /api/cart/[id]` `DELETE ...`
- `POST /api/orders` `GET /api/orders` `GET /api/orders/[id]`
- `POST /api/payments/oxpay/intent`
- `POST /api/webhooks/oxpay` (verify signature, update Payment/Order)
- `POST /api/email/send` (server action that calls Nodemailer)

---

## 5) Feature Slices & Definition of Done

### Buyer
- Browse/search/filter products (server-side data fetching).
- Cart stored server-side (by user id) with optimistic UI.
- Checkout: create Order + Payment record; redirect/confirm per OxPay flow.
- Order tracking + email notifications.
**DoD:** accessibility AA, empty/error states, e2e tests (add to cart → checkout).

### Seller
- Product CRUD with image uploads; variant support; bulk CSV upload.
- Inventory adjustments upon order capture.
- Orders list with status updates & tracking.
**DoD:** role guards, audit logs, unit tests for stock math.

### Admin
- Approve sellers; moderate products; view transactions & refunds.
**DoD:** activity log, metrics panel, basic RBAC tests.

---

## 6) OxPay Integration (stubs)

- `services/payments/oxpay.ts`
  - `createIntent(orderId, amount, currency) -> { redirectUrl | clientSecret }`
  - `capture(transactionId)`
  - `refund(transactionId, amount)`
  - `verifyWebhook(signature, payload)`
- Webhook handler: update `Payment.status` and `Order.status` atomically (transaction).  
- Store raw vendor payloads for audit.  
- **TODO:** Fill endpoint paths, auth headers, signature algorithm, test keys once docs are provided.

---

## 7) Email (SMTP)

- `services/email/mailer.ts`
  - `sendOrderConfirmation(orderId)`
  - `sendPasswordReset(email, token)`
  - `sendSellerApproval(userId)`
- Use Nodemailer with pooled transport; retry + dead-letter (optional via Redis).

---

## 8) Security & Compliance Guardrails

- Hash passwords with bcrypt (12+ rounds).  
- Use **CSRF protection** for sensitive POST if not same-site.
- Validate input with **Zod**; fail fast on server.  
- RBAC: route middleware checks `User.role` + session.  
- Secrets via env only; never commit.  
- Webhook verification required; reject on signature mismatch.  
- Log PII minimally; never log card data.  
- Adopt rate limiting on auth & payment APIs.

---

## 9) Testing Strategy

- **Unit (Vitest):** services, utils, guards, Zod validators.
- **E2E (Playwright):** buyer checkout, seller product CRUD, admin approval.
- **API tests:** run against local Postgres test DB.
- **CI:** on PR → lint, typecheck, unit, e2e (headless).

**Scripts**
```jsonc
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

---

## 10) Cursor Session Prompts (copy/paste)

### A) Implement a Feature
**Prompt:**
> You are my pair programmer. Implement the **[feature name]** for the **[role]**.
> Constraints: Next.js App Router, Prisma, NextAuth, Zod, Nodemailer, OxPay stubs.
> Tasks:
> 1) Create DB changes if needed (Prisma + migration).
> 2) Server actions/API route with input validation.
> 3) UI components with loading/empty/error states and a11y.
> 4) Unit tests + e2e where applicable.
> 5) Update docs and .env.example if needed.
> Output: the full diff with files created/modified and any run commands.

### B) Write a Secure API Route
**Prompt:**
> Create `POST /api/payments/oxpay/intent`.
> Input: orderId (string). Server verifies order, amount, currency (MYR).
> Call `services/payments/oxpay.createIntent`. Return client data.
> Errors: 400 invalid input, 403 unauthorized, 500 provider error.
> Include Zod validation, RBAC (buyer), and unit tests.

### C) Build Seller Product CRUD
**Prompt:**
> Build Seller product CRUD pages and API. Features: variants, image upload (Cloudinary), price/stock validation, slug uniqueness.
> Ensure only seller’s products are visible to that seller.
> Include server actions, optimistic updates, and unit tests for stock math.

### D) Add Webhook
**Prompt:**
> Implement `/api/webhooks/oxpay`. Verify signature from `OXPAY_WEBHOOK_SECRET`.
> Update Payment + Order in a single Prisma transaction. Idempotent handling by `providerRef` unique index.
> Return 200 OK only on verified + successful processing. Include unit tests.

### E) Fix/Refactor
**Prompt:**
> Identify performance/security/code-smell issues in `services/*` and propose refactors with diffs, preserving behavior and tests.

---

## 11) Definition of Ready (DoR) & Definition of Done (DoD)

**DoR**
- User story, acceptance criteria, designs ready.
- Data model impact known.
- Env vars defined.
- Test plan noted.

**DoD**
- Code + tests + migrations merged.
- Lint + types + CI all green.
- e2e happy path passes.
- Observability in place (basic logs/metrics).
- Docs updated (README/Cursor.md/changelog).

---

## 12) Milestones

1) **Foundation**: Auth, DB, basic schemas, seed, layout, design tokens.  
2) **Buyer MVP**: browse/search/product page/cart/checkout (OxPay intent stub).  
3) **Seller MVP**: product CRUD, orders, inventory updates.  
4) **Admin MVP**: approvals, moderation, reports lite.  
5) **Payments & Webhooks**: full OxPay flow + refunds.  
6) **Email & Notifications**: SMTP flows.  
7) **Polish & Scale**: a11y, perf, analytics, CI/CD, observability.

---

## 13) Code Quality Rules

- Type-first (strict TS). No `any` unless justified.
- Zod schemas at API boundaries.
- `lib/db.ts` exports a singleton Prisma client.
- Server Actions where appropriate; otherwise API routes.
- Split UI into small, testable components.
- Prefer file-based colocation (component + styles + tests).
- Write meaningful error messages; never expose secrets.

---

## 14) Open TODOs / Placeholders

- Fill **OxPay** endpoint paths, signing method, and redirect/return URLs.
- Decide on **Cloudinary vs S3** and wire the chosen provider.
- Add **rate limiting** middleware (e.g., upstash/redis-ratelimit) if Redis used.
- Add **analytics** (PostHog) and **logging** (pino) if desired.
- Add **RBAC** middleware and reusable `requireRole()` helper.
- Import UI library if needed (e.g., shadcn/ui).

---

**Happy building!** Use the prompts above to drive focused Cursor sessions, commit early, and keep migrations small.
