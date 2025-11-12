# OxPay Payment System Test Report

## ✅ What's Implemented

### 1. **Service Layer** (`services/payments/oxpay.ts`)
- ✅ `createRedirectPayment()` - Creates payment URL
- ✅ `queryDetailByRef()` - Queries payment status
- ✅ `voidTransaction()` - Voids transactions
- ✅ `refundTransaction()` - Refunds payments
- ✅ `captureTransaction()` - Captures payments
- ✅ `verifyWebhookSignature()` - Verifies webhook signatures
- ✅ HMAC-SHA512 signature generation

### 2. **API Routes**
- ✅ `POST /api/payments/oxpay/intent` - Create payment intent
- ✅ `GET /api/payments/oxpay/status` - Get payment status
- ✅ `POST /api/payments/oxpay/status` - Webhook handler
- ✅ `GET /api/payments/oxpay/return` - Return callback

### 3. **Frontend Integration**
- ✅ Checkout page integrated with OxPay
- ✅ Payment method selection (OxPay enabled, others disabled)
- ✅ Receipt page for payment confirmation

### 4. **Database**
- ✅ Payment model in Prisma schema
- ✅ Order-Payment relationship

## ⚠️ What's Missing / Needs Configuration

### 1. **Environment Variables** (CRITICAL)
Add these to your `.env` file:

```env
# OxPay Configuration
OXPAY_BASE_URL=https://gw2.mcpayment.net
OXPAY_MCPTID=YOUR_TERMINAL_ID
OXPAY_USER_ID=YOUR_USER_ID
OXPAY_PASSWORD=YOUR_PASSWORD
OXPAY_PASSWORD_KEY=YOUR_PASSWORD_KEY
OXPAY_STATUS_URL=https://your-domain.com/api/payments/oxpay/status
OXPAY_RETURN_URL=https://your-domain.com/api/payments/oxpay/return
```

**For Local Development:**
```env
OXPAY_STATUS_URL=http://localhost:3000/api/payments/oxpay/status
OXPAY_RETURN_URL=http://localhost:3000/api/payments/oxpay/return
```

**Note:** For local testing, you may need to use a tunneling service (ngrok, localtunnel) to expose your local server to OxPay's webhook.

### 2. **OxPay Account Setup**
- [ ] Obtain OxPay merchant credentials from OxPay
- [ ] Get Terminal ID (MCPTID)
- [ ] Get User ID, Password, and Password Key
- [ ] Configure webhook URL in OxPay dashboard
- [ ] Whitelist your server IP (for webhook)

### 3. **Network Configuration**
- [ ] Ensure `OXPAY_STATUS_URL` is publicly accessible (for webhooks)
- [ ] Use HTTPS in production (OxPay requires HTTPS for webhooks)
- [ ] For local testing, use ngrok or similar:
  ```bash
  ngrok http 3000
  # Use the ngrok URL for OXPAY_STATUS_URL and OXPAY_RETURN_URL
  ```

### 4. **Testing Checklist**

#### Test Payment Flow:
1. [ ] Add items to cart
2. [ ] Go to checkout page (`/checkout`)
3. [ ] Fill in shipping information
4. [ ] Select OxPay as payment method
5. [ ] Click "Place Order"
6. [ ] Verify redirect to OxPay payment gateway
7. [ ] Complete payment on OxPay
8. [ ] Verify redirect back to receipt page
9. [ ] Check payment status in database

#### Test Webhook:
1. [ ] Configure webhook URL in OxPay dashboard
2. [ ] Test webhook with OxPay test tool
3. [ ] Verify payment status updates in database
4. [ ] Verify order status updates correctly

#### Test Error Handling:
1. [ ] Test with invalid credentials
2. [ ] Test with insufficient funds
3. [ ] Test payment cancellation
4. [ ] Test network failures

### 5. **Potential Issues & Solutions**

#### Issue: Payment URL not redirecting
**Solution:**
- Check browser console for errors
- Verify `paymentUrl` is returned from API
- Check if `window.location.href` is being blocked
- Verify CORS settings

#### Issue: Webhook not receiving callbacks
**Solution:**
- Verify webhook URL is publicly accessible
- Check OxPay dashboard for webhook configuration
- Verify IP whitelist settings
- Check server logs for incoming requests
- Test webhook endpoint manually:
  ```bash
  curl -X POST http://localhost:3000/api/payments/oxpay/status \
    -H "Content-Type: application/json" \
    -d '{"referenceNo":"TEST123","state":"2"}'
  ```

#### Issue: Signature verification failing
**Solution:**
- Verify `OXPAY_PASSWORD_KEY` is correct
- Check signature generation logic matches OxPay spec
- Ensure signature field is excluded from signature calculation
- Verify parameter ordering matches OxPay requirements

#### Issue: Payment status not updating
**Solution:**
- Check webhook handler logs
- Verify database connection
- Check if payment record exists with correct `providerRef`
- Verify state mapping (OxPay state → PaymentStatus enum)

### 6. **API Response Format**

The OxPay API should return:
```json
{
  "respCode": "00",
  "respMsg": "Success",
  "paymentUrl": "https://gw2.mcpayment.net/pay/...",
  "referenceNo": "ORD-123-4567890"
}
```

If you get different response codes:
- `respCode: "01"` - Invalid credentials
- `respCode: "02"` - Invalid amount
- `respCode: "03"` - Invalid reference number
- Check OxPay documentation for full error code list

### 7. **Testing Script**

Run the test script:
```bash
tsx scripts/test-oxpay-payment.ts
```

This will:
- Check environment variables
- Test database connection
- Create a test order
- Generate a payment URL
- Verify the flow

## 🔍 How to Test the Redirect

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Ensure environment variables are set** in `.env`

3. **Go to checkout page:**
   ```
   http://localhost:3000/checkout
   ```

4. **Fill in checkout form and click "Place Order"**

5. **Expected behavior:**
   - Order is created
   - Payment intent is created
   - Browser redirects to OxPay payment gateway
   - After payment, user is redirected back to receipt page

6. **If redirect doesn't work:**
   - Check browser console for errors
   - Check network tab for API responses
   - Verify `paymentUrl` is returned from `/api/payments/oxpay/intent`
   - Check if popup blockers are interfering

## 📝 Next Steps

1. **Configure Environment Variables** - Add all OxPay credentials to `.env`
2. **Get OxPay Credentials** - Contact OxPay for sandbox/test credentials
3. **Set Up Webhook URL** - Configure in OxPay dashboard
4. **Test with Sandbox** - Use test credentials first
5. **Monitor Logs** - Check server logs for errors
6. **Test End-to-End** - Complete a full payment flow

## 🐛 Debugging Tips

1. **Enable detailed logging:**
   - Check `console.log` statements in service layer
   - Monitor API route logs
   - Check browser console

2. **Test API endpoints directly:**
   ```bash
   # Test payment intent
   curl -X POST http://localhost:3000/api/payments/oxpay/intent \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -d '{"orderId":"ORDER_ID"}'
   ```

3. **Check database:**
   ```bash
   npm run db:studio
   ```
   Verify payment records are created correctly

4. **Verify network requests:**
   - Use browser DevTools Network tab
   - Check if requests are being made
   - Verify response status codes

## ✅ Success Criteria

The payment system is working correctly when:
- ✅ User can click "Place Order" on checkout
- ✅ Order is created in database
- ✅ Payment intent is created
- ✅ User is redirected to OxPay payment gateway
- ✅ Payment can be completed on OxPay
- ✅ User is redirected back to receipt page
- ✅ Payment status is updated in database
- ✅ Order status is updated to "PAID"

