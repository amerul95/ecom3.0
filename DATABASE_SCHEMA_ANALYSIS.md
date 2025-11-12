# Database Schema Analysis - OxPay Payment System

## ✅ Schema Verification

Your database schema is **correctly configured** for the OxPay payment system!

---

## 📊 Payment Model (Lines 284-301)

```prisma
model Payment {
  id             String        @id @default(cuid())
  order          Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId        String        @unique
  provider       String        @default("oxpay")
  providerRef    String?       // OxPay transaction id
  status         PaymentStatus @default(INITIATED)
  amount         Decimal       @db.Decimal(10,2)
  currency       String        @default("MYR")
  rawPayload     Json?         // Store raw webhook payload for audit
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([orderId])
  @@index([providerRef])
  @@index([status])
}
```

### ✅ Field Verification

| Field | Type | Required | Used in OxPay | Status |
|-------|------|----------|---------------|--------|
| `id` | String | ✅ | Primary key | ✅ Correct |
| `orderId` | String | ✅ | Links to Order | ✅ Correct |
| `provider` | String | ✅ | Default "oxpay" | ✅ Correct |
| `providerRef` | String? | Optional | OxPay reference number | ✅ Correct |
| `status` | PaymentStatus | ✅ | Payment state | ✅ Correct |
| `amount` | Decimal | ✅ | Payment amount | ✅ Correct |
| `currency` | String | ✅ | Default "MYR" | ✅ Correct |
| `rawPayload` | Json? | Optional | Webhook payload | ✅ Correct |
| `createdAt` | DateTime | ✅ | Timestamp | ✅ Correct |
| `updatedAt` | DateTime | ✅ | Auto-update | ✅ Correct |

### ✅ Indexes
- `@@index([orderId])` - ✅ Fast order lookups
- `@@index([providerRef])` - ✅ Fast webhook lookups
- `@@index([status])` - ✅ Fast status queries

---

## 📊 PaymentStatus Enum (Lines 29-35)

```prisma
enum PaymentStatus {
  INITIATED
  AUTHORIZED
  CAPTURED
  FAILED
  REFUNDED
}
```

### ✅ Status Mapping (Used in Code)

| OxPay State | PaymentStatus | OrderStatus | Status |
|-------------|---------------|-------------|--------|
| `"1"` (INITIATED) | `INITIATED` | `PENDING` | ✅ Correct |
| `"2"` (AUTHORIZED) | `CAPTURED` | `PAID` | ✅ Correct |
| `"3"` (FAILED) | `FAILED` | `CANCELLED` | ✅ Correct |
| `"4"` (CANCELLED) | `FAILED` | `CANCELLED` | ✅ Correct |
| `"5"` (REFUNDED) | `REFUNDED` | `REFUNDED` | ✅ Correct |
| `"6"` (VOIDED) | `FAILED` | `CANCELLED` | ✅ Correct |

**Note:** `AUTHORIZED` enum exists but code maps directly to `CAPTURED` - this is correct.

---

## 📊 Order Model (Lines 232-248)

```prisma
model Order {
  id         String        @id @default(cuid())
  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String
  status     OrderStatus   @default(PENDING)
  total      Decimal       @db.Decimal(10,2)
  items      OrderItem[]
  payment    Payment?      // ✅ One-to-one relation
  shipping   ShippingInfo?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### ✅ Payment Relation
- `payment Payment?` - ✅ Optional one-to-one relation
- Correctly linked via `orderId` in Payment model
- Cascade delete configured

---

## 📊 OrderStatus Enum (Lines 19-27)

```prisma
enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

### ✅ All Required Statuses Present
- `PENDING` - ✅ Initial order state
- `PAID` - ✅ Payment successful
- `CANCELLED` - ✅ Payment failed/cancelled
- `REFUNDED` - ✅ Payment refunded
- `PROCESSING` - ✅ Order being processed
- `SHIPPED` - ✅ Order shipped
- `DELIVERED` - ✅ Order delivered

---

## 🔗 Relationships

### ✅ Order ↔ Payment
- **Type:** One-to-one (optional)
- **Link:** `Payment.orderId` → `Order.id`
- **Cascade:** Payment deleted when Order deleted
- **Status:** ✅ Correct

### ✅ Order ↔ User
- **Type:** Many-to-one
- **Link:** `Order.userId` → `User.id`
- **Status:** ✅ Correct

### ✅ Order ↔ ShippingInfo
- **Type:** One-to-one (optional)
- **Status:** ✅ Correct

---

## 📋 Database Operations Used

### 1. Create Payment (Order Creation)
```typescript
// In app/api/orders/route.ts
payment: {
  create: {
    amount: total,
    status: "INITIATED",
    currency: "MYR",
  },
}
```
✅ **Schema supports this**

### 2. Update Payment Reference
```typescript
// In app/api/payments/oxpay/intent/route.ts
await prisma.payment.update({
  where: { orderId },
  data: {
    providerRef: returnedRef,
    status: "INITIATED",
  },
});
```
✅ **Schema supports this**

### 3. Update Payment Status (Webhook)
```typescript
// In app/api/payments/oxpay/status/route.ts
await tx.payment.update({
  where: { id: payment.id },
  data: {
    status: paymentStatus,
    providerRef: providerRef || payment.providerRef,
    rawPayload: body,
  },
});
```
✅ **Schema supports this**

### 4. Query Payment by Reference
```typescript
// In app/api/payments/oxpay/status/route.ts (GET)
const payment = await prisma.payment.findFirst({
  where: { providerRef: ref },
  include: { order: { include: { items: ... } } },
});
```
✅ **Schema supports this** (indexed on `providerRef`)

---

## ✅ Schema Completeness Check

| Requirement | Status | Notes |
|------------|--------|-------|
| Payment model exists | ✅ | Lines 284-301 |
| Payment-Order relation | ✅ | One-to-one, optional |
| PaymentStatus enum | ✅ | All statuses present |
| OrderStatus enum | ✅ | All statuses present |
| providerRef field | ✅ | For OxPay reference |
| rawPayload field | ✅ | For webhook audit |
| Indexes on key fields | ✅ | orderId, providerRef, status |
| Cascade delete | ✅ | Payment deleted with Order |
| Decimal for amount | ✅ | db.Decimal(10,2) |

---

## 🎯 Summary

### ✅ Everything is Correct!

Your database schema is **fully compatible** with the OxPay payment system:

1. ✅ **Payment model** has all required fields
2. ✅ **Relationships** are correctly configured
3. ✅ **Enums** match the code implementation
4. ✅ **Indexes** are optimized for queries
5. ✅ **Data types** are appropriate (Decimal for amounts, Json for payloads)
6. ✅ **Cascade deletes** are properly configured

### 📝 No Changes Needed

The schema is ready to use with the OxPay payment system. All operations in the code will work correctly with this schema.

---

## 🔍 Quick Verification Commands

To verify your database matches the schema:

```bash
# Generate Prisma Client
npm run db:generate

# Check database status
npx prisma db pull

# View database in Prisma Studio
npm run db:studio
```

---

## 📊 Database Structure Overview

```
User
  ├── orders (Order[])
  │   ├── payment (Payment?) ← OxPay payment
  │   ├── shipping (ShippingInfo?)
  │   └── items (OrderItem[])
  ├── cartItems (CartItem[])
  ├── reviews (Review[])
  └── addresses (Address[])
```

**Payment Flow:**
1. Order created → Payment created (status: INITIATED)
2. Payment intent → providerRef updated
3. Webhook received → status updated (CAPTURED/FAILED)
4. Order status updated accordingly

---

**Status:** ✅ **Schema is 100% compatible with OxPay payment system!**


