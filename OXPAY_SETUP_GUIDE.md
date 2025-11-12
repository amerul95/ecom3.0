# OxPay Payment System Setup Guide

## Quick Start

### 1. Environment Variables Setup

Create or update your `.env` file with the following:

```env
# OxPay Payment Gateway Configuration
OXPAY_BASE_URL=https://gw2.mcpayment.net
OXPAY_MCPTID=YOUR_TERMINAL_ID_HERE
OXPAY_USER_ID=YOUR_USER_ID_HERE
OXPAY_PASSWORD=YOUR_PASSWORD_HERE
OXPAY_PASSWORD_KEY=YOUR_PASSWORD_KEY_HERE

# Webhook URLs (for local development, use ngrok)
OXPAY_STATUS_URL=http://localhost:3000/api/payments/oxpay/status
OXPAY_RETURN_URL=http://localhost:3000/api/payments/oxpay/return

# For production, use your actual domain:
# OXPAY_STATUS_URL=https://yourdomain.com/api/payments/oxpay/status
# OXPAY_RETURN_URL=https://yourdomain.com/api/payments/oxpay/return
```

### 2. Get OxPay Credentials

Contact OxPay to obtain:
- **Terminal ID (MCPTID)**: Your merchant terminal identifier
- **User ID**: Your OxPay user identifier
- **Password**: Your OxPay password
- **Password Key**: Your HMAC signature key

### 3. Test the Payment Flow

#### Option A: Run Test Script
```bash
tsx scripts/test-oxpay-payment.ts
```

#### Option B: Manual Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **For local webhook testing, use ngrok:**
   ```bash
   # Install ngrok: https://ngrok.com/
   ngrok http 3000
   ```
   
   Update your `.env` with the ngrok URL:
   ```env
   OXPAY_STATUS_URL=https://your-ngrok-url.ngrok.io/api/payments/oxpay/status
   OXPAY_RETURN_URL=https://your-ngrok-url.ngrok.io/api/payments/oxpay/return
   ```

3. **Test the checkout flow:**
   - Go to `http://localhost:3000/checkout`
   - Add items to cart first
   - Fill in shipping information
   - Select OxPay payment method
   - Click "Place Order"
   - You should be redirected to OxPay payment gateway

### 4. Configure OxPay Webhook

In your OxPay merchant dashboard:
1. Go to Webhook Settings
2. Set Webhook URL to: `https://your-domain.com/api/payments/oxpay/status`
3. Whitelist your server IP address
4. Enable webhook notifications

### 5. Verify Redirect Works

The payment flow should work as follows:

```
User clicks "Place Order"
    ↓
Order created in database
    ↓
Payment intent created with OxPay
    ↓
Browser redirects to: https://gw2.mcpayment.net/pay/...
    ↓
User completes payment on OxPay
    ↓
OxPay sends webhook to: /api/payments/oxpay/status
    ↓
Payment status updated in database
    ↓
User redirected to: /checkout/receipt?ref=REFERENCE_NO
    ↓
Receipt page shows payment confirmation
```

## Troubleshooting

### Issue: Not redirecting to OxPay

**Check:**
1. Browser console for JavaScript errors
2. Network tab for API response
3. Verify `paymentUrl` is returned from `/api/payments/oxpay/intent`
4. Check if popup blockers are enabled

**Solution:**
- The redirect uses `window.location.href = paymentUrl`
- If blocked, check browser security settings
- Verify the payment URL is a valid HTTPS URL

### Issue: Webhook not receiving callbacks

**Check:**
1. Webhook URL is publicly accessible
2. OxPay dashboard webhook configuration
3. Server logs for incoming POST requests
4. IP whitelist settings

**Solution:**
- Use ngrok for local testing
- Ensure HTTPS in production
- Check firewall settings
- Verify webhook URL in OxPay dashboard

### Issue: Payment status not updating

**Check:**
1. Webhook handler logs
2. Database for payment records
3. `providerRef` matches webhook `referenceNo`
4. State mapping is correct

**Solution:**
- Check server logs
- Verify webhook payload structure
- Test webhook endpoint manually
- Check database connection

## Testing Checklist

- [ ] Environment variables configured
- [ ] OxPay credentials obtained
- [ ] Test script runs successfully
- [ ] Checkout page loads correctly
- [ ] "Place Order" button works
- [ ] Redirects to OxPay gateway
- [ ] Payment can be completed
- [ ] Webhook receives callbacks
- [ ] Payment status updates in database
- [ ] Receipt page displays correctly

## Files Created

1. `services/payments/oxpay.ts` - OxPay service layer
2. `app/api/payments/oxpay/intent/route.ts` - Payment intent API
3. `app/api/payments/oxpay/status/route.ts` - Status webhook handler
4. `app/api/payments/oxpay/return/route.ts` - Return callback handler
5. `app/checkout/receipt/page.tsx` - Receipt page
6. `scripts/test-oxpay-payment.ts` - Test script

## Support

If you encounter issues:
1. Check the test report: `OXPAY_TEST_REPORT.md`
2. Run the test script: `tsx scripts/test-oxpay-payment.ts`
3. Check server logs for errors
4. Verify all environment variables are set
5. Contact OxPay support for API issues

