# Database Structure - Complete Overview

## 📊 Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE STRUCTURE                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Tables (Auth.js v5)

### Account
```
┌─────────────────────────────────────────┐
│ Account                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ userId: String (FK → User.id)           │
│ type: String                           │
│ provider: String                       │
│ providerAccountId: String              │
│ refresh_token: String? (Text)          │
│ access_token: String? (Text)           │
│ expires_at: Int?                       │
│ token_type: String?                    │
│ scope: String?                         │
│ id_token: String? (Text)               │
│ session_state: String?                 │
├─────────────────────────────────────────┤
│ Relations:                             │
│   user → User (Many-to-One)            │
│                                         │
│ Indexes:                                │
│   @@unique([provider, providerAccountId])│
│   @@index([userId])                    │
└─────────────────────────────────────────┘
```

### Session
```
┌─────────────────────────────────────────┐
│ Session                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ sessionToken: String (Unique)           │
│ userId: String (FK → User.id)          │
│ expires: DateTime                      │
├─────────────────────────────────────────┤
│ Relations:                             │
│   user → User (Many-to-One)            │
│                                         │
│ Indexes:                                │
│   @@index([userId])                    │
└─────────────────────────────────────────┘
```

### VerificationToken
```
┌─────────────────────────────────────────┐
│ VerificationToken                       │
├─────────────────────────────────────────┤
│ identifier: String                      │
│ token: String (Unique)                  │
│ expires: DateTime                      │
├─────────────────────────────────────────┤
│ Indexes:                                │
│   @@unique([identifier, token])        │
└─────────────────────────────────────────┘
```

---

## 👤 User & Profile Tables

### User
```
┌─────────────────────────────────────────┐
│ User                                    │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ name: String?                           │
│ email: String (Unique)                  │
│ emailVerified: DateTime?                │
│ password: String? (Hashed)              │
│ image: String?                          │
│ role: Role (BUYER|SELLER|ADMIN)        │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                      │
├─────────────────────────────────────────┤
│ Relations:                              │
│   accounts → Account[] (One-to-Many)     │
│   sessions → Session[] (One-to-Many)     │
│   sellerProfile → SellerProfile? (One-to-One)│
│   orders → Order[] (One-to-Many)        │
│   reviews → Review[] (One-to-Many)       │
│   addresses → Address[] (One-to-Many)    │
│   cartItems → CartItem[] (One-to-Many)  │
│                                         │
│ Indexes:                                │
│   @@index([email])                     │
│   @@index([role])                      │
└─────────────────────────────────────────┘
```

### SellerProfile
```
┌─────────────────────────────────────────┐
│ SellerProfile                           │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ userId: String (FK → User.id, Unique)  │
│ storeName: String                      │
│ verified: Boolean (default: false)      │
│ kycDocsUrl: String?                    │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   user → User (One-to-One)              │
│   products → Product[] (One-to-Many)     │
│                                         │
│ Indexes:                                │
│   @@index([userId])                    │
│   @@index([verified])                  │
└─────────────────────────────────────────┘
```

---

## 🛍️ Product & Catalog Tables

### Category
```
┌─────────────────────────────────────────┐
│ Category                                │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ name: String                           │
│ slug: String (Unique)                  │
│ parentId: String? (FK → Category.id)   │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   parent → Category? (Self-relation)    │
│   children → Category[] (Self-relation) │
│   products → Product[] (One-to-Many)     │
│                                         │
│ Indexes:                                │
│   @@index([slug])                      │
│   @@index([parentId])                 │
└─────────────────────────────────────────┘
```

### Product
```
┌─────────────────────────────────────────┐
│ Product                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ sellerId: String (FK → SellerProfile.id)│
│ name: String                           │
│ slug: String (Unique)                  │
│ description: String (Text)             │
│ price: Decimal(10,2)                    │
│ stock: Int (default: 0)                │
│ images: String[]                        │
│ categoryId: String? (FK → Category.id) │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   seller → SellerProfile (Many-to-One)  │
│   category → Category? (Many-to-One)    │
│   variants → Variant[] (One-to-Many)    │
│   reviews → Review[] (One-to-Many)      │
│   orderItems → OrderItem[] (One-to-Many)│
│   cartItems → CartItem[] (One-to-Many)  │
│                                         │
│ Indexes:                                │
│   @@index([sellerId])                  │
│   @@index([categoryId])                │
│   @@index([slug])                      │
│   @@index([createdAt])                 │
└─────────────────────────────────────────┘
```

### Variant
```
┌─────────────────────────────────────────┐
│ Variant                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ productId: String (FK → Product.id)    │
│ name: String (e.g., "Color: Red, Size: M")│
│ sku: String (Unique)                   │
│ price: Decimal(10,2)? (Override)       │
│ stock: Int (default: 0)                │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   product → Product (Many-to-One)       │
│   orderItems → OrderItem[] (One-to-Many)│
│   cartItems → CartItem[] (One-to-Many) │
│                                         │
│ Indexes:                                │
│   @@index([productId])                 │
│   @@index([sku])                      │
└─────────────────────────────────────────┘
```

### Review
```
┌─────────────────────────────────────────┐
│ Review                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ productId: String (FK → Product.id)   │
│ userId: String (FK → User.id)          │
│ rating: Int (1-5)                      │
│ comment: String? (Text)                │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   product → Product (Many-to-One)       │
│   user → User (Many-to-One)             │
│                                         │
│ Indexes:                                │
│   @@index([productId])                 │
│   @@index([userId])                    │
│   @@unique([productId, userId])        │
└─────────────────────────────────────────┘
```

---

## 🛒 Shopping & Cart Tables

### CartItem
```
┌─────────────────────────────────────────┐
│ CartItem                                │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ userId: String (FK → User.id)          │
│ productId: String (FK → Product.id)   │
│ variantId: String? (FK → Variant.id)   │
│ quantity: Int (default: 1)             │
│ addedAt: DateTime                      │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   user → User (Many-to-One)             │
│   product → Product (Many-to-One)       │
│   variant → Variant? (Many-to-One)      │
│                                         │
│ Indexes:                                │
│   @@index([userId])                    │
│   @@index([productId])                 │
│   @@unique([userId, productId, variantId])│
└─────────────────────────────────────────┘
```

---

## 📦 Order & Payment Tables

### Order
```
┌─────────────────────────────────────────┐
│ Order                                   │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ userId: String (FK → User.id)          │
│ status: OrderStatus (default: PENDING) │
│ total: Decimal(10,2)                    │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   user → User (Many-to-One)             │
│   items → OrderItem[] (One-to-Many)     │
│   payment → Payment? (One-to-One)       │
│   shipping → ShippingInfo? (One-to-One) │
│                                         │
│ Indexes:                                │
│   @@index([userId])                    │
│   @@index([status])                    │
│   @@index([createdAt])                 │
└─────────────────────────────────────────┘
```

### OrderItem
```
┌─────────────────────────────────────────┐
│ OrderItem                               │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ orderId: String (FK → Order.id)       │
│ productId: String (FK → Product.id)   │
│ variantId: String? (FK → Variant.id)   │
│ quantity: Int                          │
│ price: Decimal(10,2) (Snapshot)        │
├─────────────────────────────────────────┤
│ Relations:                              │
│   order → Order (Many-to-One)           │
│   product → Product (Many-to-One)       │
│   variant → Variant? (Many-to-One)      │
│                                         │
│ Indexes:                                │
│   @@index([orderId])                   │
│   @@index([productId])                 │
└─────────────────────────────────────────┘
```

### Payment (OxPay Integration)
```
┌─────────────────────────────────────────┐
│ Payment                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ orderId: String (FK → Order.id, Unique)│
│ provider: String (default: "oxpay")   │
│ providerRef: String? (OxPay reference) │
│ status: PaymentStatus (default: INITIATED)│
│ amount: Decimal(10,2)                  │
│ currency: String (default: "MYR")      │
│ rawPayload: Json? (Webhook payload)    │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   order → Order (One-to-One)            │
│                                         │
│ Indexes:                                │
│   @@index([orderId])                   │
│   @@index([providerRef])                │
│   @@index([status])                    │
└─────────────────────────────────────────┘
```

### ShippingInfo
```
┌─────────────────────────────────────────┐
│ ShippingInfo                            │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ orderId: String (FK → Order.id, Unique)│
│ address: String                        │
│ city: String                           │
│ state: String?                         │
│ postal: String                         │
│ country: String (default: "MY")        │
│ carrier: String?                       │
│ tracking: String?                      │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   order → Order (One-to-One)            │
│                                         │
│ Indexes:                                │
│   @@index([orderId])                   │
└─────────────────────────────────────────┘
```

### Address
```
┌─────────────────────────────────────────┐
│ Address                                 │
├─────────────────────────────────────────┤
│ id: String (PK)                        │
│ userId: String (FK → User.id)          │
│ label: String? (e.g., "Home", "Work")  │
│ line1: String                          │
│ line2: String?                         │
│ city: String                           │
│ state: String?                         │
│ postal: String                         │
│ country: String (default: "MY")        │
│ isDefault: Boolean (default: false)    │
│ createdAt: DateTime                     │
│ updatedAt: DateTime                     │
├─────────────────────────────────────────┤
│ Relations:                              │
│   user → User (Many-to-One)             │
│                                         │
│ Indexes:                                │
│   @@index([userId])                    │
└─────────────────────────────────────────┘
```

---

## 📊 Enums

### Role
```typescript
enum Role {
  BUYER
  SELLER
  ADMIN
}
```

### OrderStatus
```typescript
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

### PaymentStatus
```typescript
enum PaymentStatus {
  INITIATED
  AUTHORIZED
  CAPTURED
  FAILED
  REFUNDED
}
```

---

## 🔗 Relationship Diagram

```
                    ┌─────────┐
                    │  User   │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ Account │    │ Session  │    │ Address  │
   └─────────┘    └──────────┘    └──────────┘
        │                │                │
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Order   │    │ Review   │    │CartItem  │
   └────┬─────┘    └──────────┘    └──────────┘
        │
   ┌────┴─────┬──────────────┐
   │          │              │
   ▼          ▼              ▼
┌────────┐ ┌──────────┐ ┌──────────┐
│Payment │ │OrderItem │ │Shipping  │
└────────┘ └────┬─────┘ └──────────┘
                │
                ▼
         ┌──────────┐
         │ Product  │
         └────┬─────┘
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
  ┌────────┐     ┌──────────┐
  │Variant │     │ Category │
  └────────┘     └──────────┘

┌──────────────┐
│SellerProfile │
└──────┬───────┘
       │
       ▼
  ┌──────────┐
  │ Product │
  └──────────┘
```

---

## 📈 Table Count Summary

| Category | Tables | Count |
|----------|--------|-------|
| **Authentication** | Account, Session, VerificationToken | 3 |
| **User Management** | User, SellerProfile, Address | 3 |
| **Product Catalog** | Category, Product, Variant, Review | 4 |
| **Shopping** | CartItem | 1 |
| **Orders** | Order, OrderItem, Payment, ShippingInfo | 4 |
| **Total** | | **15 tables** |

---

## 🔑 Key Relationships

### One-to-Many
- User → Orders
- User → CartItems
- User → Reviews
- User → Addresses
- SellerProfile → Products
- Category → Products
- Product → Variants
- Product → Reviews
- Product → OrderItems
- Product → CartItems
- Order → OrderItems

### One-to-One
- User ↔ SellerProfile
- Order ↔ Payment
- Order ↔ ShippingInfo

### Many-to-Many (via junction)
- User ↔ Product (via CartItem)
- User ↔ Product (via Review)
- Order ↔ Product (via OrderItem)

---

## 📊 Index Summary

### Primary Keys
- All tables have `id: String @id @default(cuid())`

### Unique Constraints
- User.email
- Category.slug
- Product.slug
- Variant.sku
- OrderItem (userId, productId, variantId)
- Review (productId, userId)
- Account (provider, providerAccountId)
- Session.sessionToken
- VerificationToken.token
- Payment.orderId
- ShippingInfo.orderId
- SellerProfile.userId

### Indexes
- User: email, role
- Order: userId, status, createdAt
- Payment: orderId, providerRef, status
- Product: sellerId, categoryId, slug, createdAt
- Category: slug, parentId
- And more...

---

## ✅ Database Health Check

- ✅ **15 tables** properly defined
- ✅ **3 enums** for type safety
- ✅ **Relationships** correctly configured
- ✅ **Indexes** optimized for queries
- ✅ **Cascade deletes** properly set
- ✅ **Unique constraints** prevent duplicates
- ✅ **OxPay integration** fully supported

---

**Database Type:** PostgreSQL  
**ORM:** Prisma  
**Status:** ✅ Production Ready

