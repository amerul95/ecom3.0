# OxPay v2 - Hosted Payment Page Integration

## Overview

This is a new OxPay payment integration based on the official `oxpay-payments-api-reference.yaml` specification, focusing on the **Hosted Payment Page (HPP)** flow.

## Architecture

### Service Layer
- **File**: `services/payments/oxpay-v2.ts`
- **Main Function**: `createHostedPaymentPage()` - Creates HPP URL
- **Signature**: HMAC-SHA256 with `OXPAY_SIGN_KEY`
- **Authentication**: Bearer Token with `OXPAY_API_KEY`

### API Routes
- **POST** `/api/payments/oxpay-v2/intent` - Create payment intent and get HPP URL
- **GET** `/api/payments/oxpay-v2/return` - Return callback after payment (redirects to receipt)
- **POST** `/api/payments/oxpay-v2/webhook` - Webhook handler for payment status updates
- **GET** `/api/payments/oxpay-v2/status` - Query payment status by reference

## Environment Variables

Add these to your `.env.local`:

```env
# OxPay v2 Configuration
OXPAY_BASE_URL=https://api.oxpayfinancial.com  # Production URL (default). Use https://api.uat.oxpayfinancial.com for testing
OXPAY_API_KEY=ak-your-api-key-here
OXPAY_SIGN_KEY=your-sign-key-here
OXPAY_MERCHANT_ID=your-merchant-id
OXPAY_TERMINAL_ID=your-terminal-id

# Base URL for redirects (required for webhooks and return URLs)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL
```

## Payment Flow

1. **User clicks "Place Order"** on checkout page
2. **Order created** in database with `PENDING` status
3. **Payment intent created** via `/api/payments/oxpay-v2/intent`
   - Calls OxPay `/payment-page` endpoint
   - Receives `oxpay_hpp_url` (Hosted Payment Page URL)
4. **User redirected** to OxPay Hosted Payment Page
5. **User completes payment** on OxPay's page
6. **OxPay redirects** user to `/api/payments/oxpay-v2/return?status=success&merchant_reference_id=...`
7. **User redirected** to `/checkout/receipt?ref=...`
8. **Webhook received** at `/api/payments/oxpay-v2/webhook` (async)
   - Verifies signature
   - Updates payment and order status in database

## API Endpoints

### POST /api/payments/oxpay-v2/intent

**Request:**
```json
{
  "orderId": "clx1234567890"
}
```

**Response:**
```json
{
  "paymentUrl": "https://hostedPage/?session_id=123123123123",
  "sessionId": "123123123123",
  "orderId": "clx1234567890"
}
```

### POST /api/payments/oxpay-v2/webhook

**Headers:**
- `Signature`: HMAC-SHA256 signature of the request body

**Body:**
```json
{
  "headers": {
    "status_code": 0,
    "status_message": "SUCCESS",
    "gateway_response_datetime": "20240103101433"
  },
  "body": {
    "merchant_reference_id": "clx1234567890",
    "oxpay_txn_id": "10001387",
    "transaction_state": "success",
    "transaction_amount": 20000,
    "transaction_currency": "SGD",
    "payment_brand": "grabpay"
  }
}
```

**Response:**
```json
{
  "headers": {
    "status_code": 0,
    "status_message": "SUCCESS",
    "gateway_response_datetime": "20240103101433"
  }
}
```

### GET /api/payments/oxpay-v2/status?ref={orderId}

**Response:**
```json
{
  "payment": {
    "id": "clx...",
    "status": "CAPTURED",
    "providerRef": "10001387",
    "amount": "200.00",
    "currency": "SGD"
  },
  "order": {
    "id": "clx...",
    "status": "PAID",
    "total": "200.00",
    "items": [...]
  }
}
```

## Status Mapping

### Transaction State → Payment Status
- `success` / `authorized` / `captured` → `CAPTURED`
- `failed` / `cancelled` / `voided` → `FAILED`
- `refunded` → `REFUNDED`
- Others → `INITIATED`

### Transaction State → Order Status
- `success` / `authorized` / `captured` → `PAID`
- `failed` / `cancelled` / `voided` → `CANCELLED`
- `refunded` → `REFUNDED`
- Others → `PENDING`

## Signature Generation

The signature is generated using **HMAC-SHA256**:

```typescript
const signature = crypto
  .createHmac("sha256", OXPAY_SIGN_KEY)
  .update(JSON.stringify(requestBody))
  .digest("hex");
```

The signature is sent in the `Signature` header.

## Debugging

All endpoints include comprehensive console logging with emoji prefixes:
- 🔵 Function/API called
- 📋 Input parameters
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 🔄 Processing
- 💾 Database operation
- 🔐 Security/signature
- 🌐 HTTP request
- 📡 HTTP response

Check your server console/terminal for detailed logs.

## Testing

1. **Set up environment variables** in `.env.local`
2. **Create a test order** via checkout
3. **Check server logs** for detailed flow information
4. **Verify webhook** is receiving callbacks from OxPay
5. **Test return flow** by completing a payment

## Migration from v1

The old OxPay implementation (`services/payments/oxpay.ts`) is still available. The new v2 implementation:
- Uses different API endpoints (`/payment-page` instead of `/api/v6/payment`)
- Uses different authentication (Bearer Token + Signature instead of mcptid)
- Uses different environment variables
- Follows the official YAML specification

To switch to v2, update the checkout page to use `/api/payments/oxpay-v2/intent` (already done).

## Notes

- The Hosted Payment Page handles all payment method selection and processing
- No need to handle individual payment methods (GrabPay, Alipay, etc.) - OxPay handles it
- Webhook signature verification is recommended for production
- The return URL is for UX only - actual status updates come via webhook

