# Session Token & Role System Explanation

## Key Concept: **One User = One Role = One Token**

### Database Schema

Looking at your `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  role          Role      @default(BUYER)  // ← SINGLE role field
  // ...
}

enum Role {
  BUYER
  SELLER
  ADMIN
}
```

**Important:** Each user has **ONE role** at a time, not multiple roles.

## How Session Tokens Work

### 1. **Token Creation (Login)**

When a user logs in:

```
User Login → Token Created → Token contains: { id, email, role: "SELLER" }
```

**Example:**
- User: `seller@example.com` with role `SELLER`
- Login → Token created: `{ id: "abc123", email: "seller@example.com", role: "SELLER" }`
- Token stored in HTTP-only cookie

### 2. **Token Persistence**

✅ **The SAME token works across ALL pages/dashboards** (if user has correct role)

**Flow:**
```
Login → Token Created → Cookie Set
  ↓
Navigate to /seller/dashboard → Token checked → ✅ Allow (role = SELLER)
  ↓
Navigate to /seller/products → Token checked → ✅ Allow (role = SELLER)
  ↓
Navigate to /seller/settings → Token checked → ✅ Allow (role = SELLER)
  ↓
API call to /api/seller/products → Token checked → ✅ Allow (role = SELLER)
```

**No re-login needed!** The token persists until:
- User logs out
- Token expires (default: 30 days)
- User clears cookies

### 3. **Role-Based Access**

**Scenario 1: Seller User**
```
User: seller@example.com
Role: SELLER
Token: { role: "SELLER" }

✅ Can access: /seller/dashboard, /seller/products, /api/seller/*
❌ Cannot access: /buyer/dashboard (if exists), /admin/dashboard
```

**Scenario 2: Buyer User**
```
User: buyer@example.com
Role: BUYER
Token: { role: "BUYER" }

✅ Can access: /products, /cart, /orders, /api/orders/*
❌ Cannot access: /seller/dashboard, /api/seller/*
```

**Scenario 3: Admin User**
```
User: admin@example.com
Role: ADMIN
Token: { role: "ADMIN" }

✅ Can access: /admin/* (if implemented)
❌ Cannot access: /seller/dashboard (unless admin override implemented)
```

## Important Points

### ❌ **NOT Supported:**
- One user with multiple roles simultaneously
- Switching roles without re-login
- One token for multiple roles

### ✅ **What IS Supported:**
- One user = one role = one token
- Token works across all pages (for that role)
- No re-login needed when navigating between pages
- Token persists until logout/expiration

## Example Flow

### Seller User Journey:

```
1. Login as seller@example.com
   → Token: { role: "SELLER" }
   → Cookie set

2. Navigate to /seller/dashboard
   → Frontend checks: session?.user?.role === 'SELLER' ✅
   → Page loads

3. Navigate to /seller/products
   → Frontend checks: session?.user?.role === 'SELLER' ✅
   → Page loads (SAME token, no re-login)

4. API call to /api/seller/products
   → Backend checks: requireSeller() ✅
   → Returns data (SAME token)

5. Navigate to /seller/settings
   → Frontend checks: session?.user?.role === 'SELLER' ✅
   → Page loads (SAME token, no re-login)
```

**All using the SAME token!** ✅

## If User Needs Multiple Roles

If someone needs both BUYER and SELLER access, they need:

**Option 1: Separate Accounts** (Current System)
```
Account 1: buyer@example.com (role: BUYER)
Account 2: seller@example.com (role: SELLER)
```

**Option 2: Role Switching** (Would require code changes)
- Add role switching feature
- User selects role when logging in
- Token created with selected role
- User can switch roles (requires re-authentication)

**Option 3: Multi-Role Support** (Would require schema changes)
- Change `role` from single field to array
- Update all role checks to support arrays
- More complex authorization logic

## Current Implementation Summary

✅ **One session token per user**
✅ **Token contains single role**
✅ **Token persists across all pages**
✅ **No re-login needed for same role**
✅ **Role checked on every page/API call**

The token is like a **"passport"** - once you have it, you can access all areas your role allows, without needing to "re-enter" each time!
