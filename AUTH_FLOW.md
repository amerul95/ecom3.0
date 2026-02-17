# Authentication & Authorization Flow

## Overview
Your application uses **NextAuth.js v5** with **JWT-based sessions** and **role-based access control (RBAC)**.

## How It Works

### 1. **Login Process** (Same for all user types)

```
User Login → Credentials Check → JWT Token Created → Session Stored
```

**Flow:**
1. User submits email/password at `/login`
2. `lib/auth.ts` validates credentials against database
3. User's **role** (BUYER/SELLER/ADMIN) is included in the JWT token
4. Token is stored in HTTP-only cookie
5. Session contains: `{ id, email, name, role }`

**Key Code** (`lib/auth.ts:58-66`):
```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,  // ← Role stored in token
  image: user.image,
}
```

### 2. **Token/Session Checking**

Every request checks for valid session:

```typescript
// lib/auth-helpers.ts
const session = await auth(); // Checks JWT token from cookie
if (!session?.user) return null; // No token = not authenticated
```

**Token contains:**
- User ID
- Email
- **Role** (BUYER/SELLER/ADMIN)
- Expiration time

### 3. **Role-Based Access Control**

#### **Frontend (Pages/Dashboards)**

**Seller Dashboard Protection** (`app/seller/dashboard/items/new/page.tsx:42-46`):
```typescript
if (status === 'unauthenticated') {
  router.push('/seller/login'); // No token = redirect to login
}
if (session?.user?.role !== 'SELLER') {
  router.push('/seller/login?error=unauthorized'); // Wrong role = unauthorized
}
```

**Flow:**
1. Page loads → Check `useSession()` hook
2. If no token → Redirect to login
3. If token exists but role ≠ SELLER → Redirect with error
4. If role = SELLER → Allow access

#### **Backend (API Routes)**

**Seller API Protection** (`app/api/seller/products/route.ts:20`):
```typescript
const user = await requireSeller(); // Throws error if not SELLER
```

**Helper Functions** (`lib/auth-helpers.ts`):
- `requireAuth()` - Any authenticated user
- `requireSeller()` - Only SELLER role
- `requireBuyer()` - Only BUYER role  
- `requireAdmin()` - Only ADMIN role

**Flow:**
1. API request → `requireSeller()` checks token
2. If no token → Returns 401 Unauthorized
3. If token exists but role ≠ SELLER → Returns 403 Forbidden
4. If role = SELLER → Returns user data, continues to handler

### 4. **API Data Filtering**

**Seller APIs return only seller's data:**

```typescript
// app/api/seller/products/route.ts:27-48
const sellerProfile = await prisma.sellerProfile.findUnique({
  where: { userId: user.id }, // ← Uses authenticated user's ID
});

const products = await prisma.product.findMany({
  where: { sellerId: sellerProfile.id }, // ← Only this seller's products
});
```

**Key Points:**
- ✅ Seller can only see/edit their own products
- ✅ Buyer APIs only return buyer's orders
- ✅ Admin can access everything (if implemented)

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                                │
│  Email: test@test.com | Password: Senario@123               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION CHECK                           │
│  1. Check credentials in database                          │
│  2. Verify password hash                                    │
│  3. Get user role from database                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              JWT TOKEN CREATED                              │
│  Token contains: { id, email, role: "SELLER" }             │
│  Stored in: HTTP-only cookie                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         ACCESSING SELLER DASHBOARD                          │
│  GET /seller/dashboard                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  FRONTEND CHECK  │        │  BACKEND CHECK   │
│  useSession()    │        │  requireSeller() │
└────────┬─────────┘        └────────┬─────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│ Token exists?    │        │ Token exists?    │
│ Role = SELLER?   │        │ Role = SELLER?   │
└────────┬─────────┘        └────────┬─────────┘
         │                            │
    ┌────┴────┐                  ┌────┴────┐
    │         │                  │         │
   YES       NO                 YES       NO
    │         │                  │         │
    ▼         ▼                  ▼         ▼
┌──────┐ ┌──────────┐      ┌──────┐ ┌──────────┐
│Allow │ │Redirect  │      │Allow │ │Return    │
│Access│ │to Login  │      │Access│ │401/403   │
└──────┘ └──────────┘      └──────┘ └──────────┘
```

## Example Scenarios

### Scenario 1: Seller Accessing Dashboard
1. ✅ Seller logs in → Token created with role="SELLER"
2. ✅ Navigates to `/seller/dashboard`
3. ✅ Frontend checks: `session?.user?.role === 'SELLER'` → ✅ Allow
4. ✅ API call to `/api/seller/products`
5. ✅ Backend checks: `requireSeller()` → ✅ Allow
6. ✅ Returns only seller's products

### Scenario 2: Buyer Trying to Access Seller Dashboard
1. ✅ Buyer logs in → Token created with role="BUYER"
2. ❌ Navigates to `/seller/dashboard`
3. ❌ Frontend checks: `session?.user?.role === 'SELLER'` → ❌ FALSE
4. ❌ Redirects to `/seller/login?error=unauthorized`

### Scenario 3: Unauthenticated User
1. ❌ No token exists
2. ❌ Navigates to `/seller/dashboard`
3. ❌ Frontend checks: `status === 'unauthenticated'` → ❌ TRUE
4. ❌ Redirects to `/seller/login`

### Scenario 4: Seller API Access
1. ✅ Seller has valid token with role="SELLER"
2. ✅ Calls `/api/seller/products`
3. ✅ Backend: `requireSeller()` → ✅ Passes
4. ✅ Query: `where: { sellerId: sellerProfile.id }`
5. ✅ Returns only seller's products

## Security Features

1. **JWT Tokens**: Signed with `AUTH_SECRET`, tamper-proof
2. **HTTP-only Cookies**: Prevents XSS attacks
3. **Role in Token**: Role checked on every request
4. **Database Filtering**: APIs filter by user ID, not just role
5. **Double Protection**: Both frontend and backend checks

## Summary

✅ **Yes, your understanding is correct!**

- Login creates JWT token with role
- Token checked on every request
- Role checked before accessing dashboards/APIs
- APIs return only user's own data
- Seller APIs only return seller's products
- Buyer APIs only return buyer's orders

The system uses **defense in depth** - multiple layers of security checks!
