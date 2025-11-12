# OxPay Payment System - Complete Documentation

## 📁 File Structure

### Core Service Layer
```
services/
└── payments/
    └── oxpay.ts                    # Main OxPay service with all payment functions
```

### API Routes
```
app/
└── api/
    └── payments/
        └── oxpay/
            ├── intent/
            │   └── route.ts        # POST - Create payment intent
            ├── status/
            │   └── route.ts        # GET & POST - Status webhook handler
            └── return/
                └── route.ts        # GET - Return callback handler
```

### Frontend Pages
```
app/
├── checkout/
│   ├── page.tsx                   # Checkout page (uses Checkout component)
│   └── receipt/
│       └── page.tsx                # Payment receipt/confirmation page
└── Pages/
    └── Checkout.tsx                # Main checkout component with OxPay integration
```

### Documentation & Testing
```
├── OXPAY_TEST_REPORT.md           # Test report and troubleshooting
├── OXPAY_SETUP_GUIDE.md           # Setup instructions
├── OXPAY_MISSING_ITEMS.md         # Missing items checklist
├── OXPAY_COMPLETE_SYSTEM.md       # This file - complete overview
└── scripts/
    └── test-oxpay-payment.ts      # Automated test script
```

### Documentation Source
```
oxpay/
└── docs/
    ├── Step1_Setup.md
    ├── Step2_CreateService.md
    ├── Step3_CreateAPI.md
    ├── Step4_CreateWebhook.md
    ├── Step5_CheckoutIntegration.md
    ├── Step6_Reconciliation.md
    └── Step7_TestAndLaunch.md
```

---

## 🔧 Core Components

### 1. Service Layer (`services/payments/oxpay.ts`)

**Functions:**
- `createRedirectPayment()` - Creates payment URL for hosted checkout
- `queryDetailByRef()` - Queries payment status by reference
- `voidTransaction()` - Voids a pending transaction
- `refundTransaction()` - Refunds a completed payment
- `captureTransaction()` - Captures a pre-authorized payment
- `verifyWebhookSignature()` - Verifies webhook signatures

**Features:**
- HMAC-SHA512 signature generation
- Amount conversion (major to minor units)
- Comprehensive error handling
- Detailed console logging for debugging
- eCom specification compliance (no userId/password)

**Request Parameters (eCom):**
```typescript
{
  mcptid: string,        // Terminal ID (required)
  referenceNo: string,  // Unique reference (required)
  amount: number,       // Amount in minor units (required)
  currency: string,     // Currency code (required)
  statusUrl: string,    // Webhook callback URL (required)
  returnUrl: string,    // Return URL (required)
  signature: string      // HMAC-SHA512 signature (required)
}
```

### 2. API Routes

#### `/api/payments/oxpay/intent` (POST)
**Purpose:** Create payment intent and get redirect URL

**Request:**
```json
{
  "orderId": "order-id-here"
}
```

**Response:**
```json
{
  "paymentUrl": "https://gw2.mcpayment.net/pay/...",
  "referenceNo": "ORD-123-4567890",
  "orderId": "order-id-here"
}
```

**Flow:**
1. Validates user authentication
2. Verifies order belongs to user
3. Checks payment record exists
4. Generates unique reference number
5. Calls OxPay API to create payment
6. Updates payment record with reference
7. Returns payment URL

#### `/api/payments/oxpay/status` (GET & POST)

**GET:** Fetch payment status by reference number
- Requires authentication
- Returns payment details with order information

**POST:** Webhook handler for OxPay callbacks
- Receives payment status updates from OxPay
- Validates webhook signature (if provided)
- Updates payment and order status in database
- Maps OxPay states to internal statuses

**OxPay State Mapping:**
- `"2"` (AUTHORIZED) → `CAPTURED` / `PAID`
- `"3"` (FAILED) → `FAILED` / `CANCELLED`
- `"4"` (CANCELLED) → `FAILED` / `CANCELLED`
- `"5"` (REFUNDED) → `REFUNDED` / `REFUNDED`
- `"6"` (VOIDED) → `FAILED` / `CANCELLED`

#### `/api/payments/oxpay/return` (GET)
**Purpose:** Handle return callback from OxPay

**Flow:**
1. Receives reference number from query params
2. Redirects user to receipt page
3. Does NOT update database (webhook handles that)

---

## 🎨 Frontend Integration

### Checkout Page (`app/Pages/Checkout.tsx`)

**Payment Flow:**
1. User fills shipping information
2. User selects OxPay payment method (only enabled option)
3. User clicks "Place Order"
4. Order is created via `/api/orders`
5. Payment intent is created via `/api/payments/oxpay/intent`
6. User is redirected to OxPay payment gateway
7. User completes payment on OxPay
8. OxPay sends webhook to `/api/payments/oxpay/status`
9. User is redirected back to `/checkout/receipt`

**Key Features:**
- Only OxPay payment method enabled
- Other methods (COD, Bank Transfer) disabled with "Coming Soon"
- Comprehensive error handling
- Detailed console logging
- Loading states and error messages

### Receipt Page (`app/checkout/receipt/page.tsx`)

**Features:**
- Displays payment status
- Shows order details
- Lists order items
- Payment confirmation
- Links to view orders

---

## 🔐 Environment Variables

**Required:**
```env
OXPAY_BASE_URL=https://gw2.mcpayment.net
OXPAY_MCPTID=YOUR_TERMINAL_ID
OXPAY_PASSWORD_KEY=YOUR_PASSWORD_KEY
OXPAY_STATUS_URL=http://localhost:3000/api/payments/oxpay/status
OXPAY_RETURN_URL=http://localhost:3000/api/payments/oxpay/return
```

**Removed (Optional for eCom):**
- `OXPAY_USER_ID` - Optional for eCom
- `OXPAY_PASSWORD` - Optional for eCom

---

## 📊 Database Schema

**Payment Model:**
```prisma
model Payment {
  id             String        @id @default(cuid())
  order          Order         @relation(fields: [orderId], references: [id])
  orderId        String        @unique
  provider       String        @default("oxpay")
  providerRef    String?       // OxPay transaction reference
  status         PaymentStatus @default(INITIATED)
  amount         Decimal       @db.Decimal(10,2)
  currency       String        @default("MYR")
  rawPayload     Json?         // Raw webhook payload
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

**PaymentStatus Enum:**
- `INITIATED` - Payment created, awaiting processing
- `AUTHORIZED` - Payment authorized (not used, goes to CAPTURED)
- `CAPTURED` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

---

## 🔄 Payment Flow Diagram

```
User clicks "Place Order"
    ↓
Order created (status: PENDING)
    ↓
Payment created (status: INITIATED)
    ↓
POST /api/payments/oxpay/intent
    ↓
OxPay API: createRedirectPayment()
    ↓
Payment URL received
    ↓
Browser redirects to OxPay gateway
    ↓
User completes payment on OxPay
    ↓
OxPay sends webhook → POST /api/payments/oxpay/status
    ↓
Payment status updated (CAPTURED/FAILED)
    ↓
Order status updated (PAID/CANCELLED)
    ↓
User redirected to /checkout/receipt
    ↓
Receipt page displays payment confirmation
```

---

## 🧪 Testing

### Automated Test Script
```bash
tsx scripts/test-oxpay-payment.ts
```

**What it tests:**
- Environment variables configuration
- Database connection
- Test order creation
- Payment intent creation
- Payment URL generation

### Manual Testing Steps

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Configure environment variables** in `.env`

3. **For local webhook testing, use ngrok:**
   ```bash
   ngrok http 3000
   # Update OXPAY_STATUS_URL with ngrok URL
   ```

4. **Test checkout flow:**
   - Go to `http://localhost:3000/checkout`
   - Add items to cart
   - Fill shipping information
   - Click "Place Order"
   - Verify redirect to OxPay gateway

5. **Check logs:**
   - Browser console (client-side)
   - Terminal/Server logs (server-side)

---

## 🐛 Debugging

### Console Logs

**Service Layer (`[OxPay]`):**
- Input parameters
- Request parameters
- API response
- Error details

**API Routes (`[API]`):**
- Request received
- User authentication
- Order validation
- Payment URL received
- Response sent

**Frontend (`[Checkout]`):**
- Order creation
- Payment intent request
- Response received
- Redirect attempt
- Error details

### Common Issues

1. **Payment URL not redirecting:**
   - Check browser console for errors
   - Verify `paymentUrl` in API response
   - Check popup blockers

2. **Webhook not receiving callbacks:**
   - Verify webhook URL is publicly accessible
   - Check OxPay dashboard configuration
   - Use ngrok for local testing

3. **Signature verification failing:**
   - Verify `OXPAY_PASSWORD_KEY` is correct
   - Check parameter ordering
   - Ensure signature field excluded from calculation

---

## 📝 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/payments/oxpay/intent` | Create payment intent | Yes (Buyer) |
| GET | `/api/payments/oxpay/status?ref=...` | Get payment status | Yes (Buyer) |
| POST | `/api/payments/oxpay/status` | Webhook handler | No (OxPay) |
| GET | `/api/payments/oxpay/return?referenceNo=...` | Return callback | No |

---

## ✅ Implementation Checklist

- [x] Service layer with all payment functions
- [x] Payment intent API endpoint
- [x] Webhook handler for status updates
- [x] Return callback handler
- [x] Receipt page
- [x] Checkout page integration
- [x] Database schema (Payment model)
- [x] Error handling
- [x] Console logging
- [x] eCom specification compliance
- [x] Test script
- [x] Documentation

---

## 🚀 Quick Start

1. **Add environment variables to `.env`:**
   ```env
   OXPAY_BASE_URL=https://gw2.mcpayment.net
   OXPAY_MCPTID=YOUR_TERMINAL_ID
   OXPAY_PASSWORD_KEY=YOUR_PASSWORD_KEY
   OXPAY_STATUS_URL=http://localhost:3000/api/payments/oxpay/status
   OXPAY_RETURN_URL=http://localhost:3000/api/payments/oxpay/return
   ```

2. **Get OxPay credentials** from OxPay

3. **Run test script:**
   ```bash
   tsx scripts/test-oxpay-payment.ts
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test checkout flow:**
   - Go to `http://localhost:3000/checkout`
   - Complete checkout
   - Verify redirect to OxPay

---

## 📚 Related Documentation

- `OXPAY_TEST_REPORT.md` - Detailed test report
- `OXPAY_SETUP_GUIDE.md` - Setup instructions
- `OXPAY_MISSING_ITEMS.md` - Missing items checklist
- `oxpay/docs/` - Original implementation docs

---

## 🔗 Key Files Reference

| File | Purpose |
|------|---------|
| `services/payments/oxpay.ts` | Core OxPay service layer |
| `app/api/payments/oxpay/intent/route.ts` | Payment intent API |
| `app/api/payments/oxpay/status/route.ts` | Status webhook handler |
| `app/api/payments/oxpay/return/route.ts` | Return callback handler |
| `app/Pages/Checkout.tsx` | Checkout page component |
| `app/checkout/receipt/page.tsx` | Receipt page |
| `scripts/test-oxpay-payment.ts` | Test script |

---

## 📞 Support

For issues or questions:
1. Check console logs (browser + server)
2. Review test report: `OXPAY_TEST_REPORT.md`
3. Run test script: `tsx scripts/test-oxpay-payment.ts`
4. Check OxPay documentation: `oxpay/docs/`

---

**Last Updated:** Based on eCom specification (userId/password removed)




