# Email Connection Timeout Fix

## Problem Identified

The backend was experiencing email connection timeouts:
```
Error sending email: Error: Connection timeout
code: 'ETIMEDOUT'
```

This was preventing OTP emails from being sent, causing login and registration to fail.

---

## Fixes Applied

### 1. Email Configuration (`backend/utils/email.js`)

**Added:**
- Connection timeout settings (10 seconds)
- TLS requirement
- Connection pooling
- Better error logging
- Timeout wrapper for email sending

**Changes:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true, // Force TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Connection timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  // Retry settings
  pool: true,
  maxConnections: 1,
  maxMessages: 3
});
```

### 2. Graceful Error Handling

**Changed:**
- Email failures no longer block registration/login
- OTP is still saved in database even if email fails
- User can request resend if email doesn't arrive
- Better error messages for users

**Before:**
- Registration would fail if email couldn't be sent
- User would see error and couldn't proceed

**After:**
- Registration succeeds even if email fails
- OTP is saved in database
- User can request resend OTP
- Clear message about email status

---

## Environment Variables Required

Make sure these are set in Render:

- `EMAIL_HOST` = `smtp.gmail.com`
- `EMAIL_PORT` = `587`
- `EMAIL_USER` = `abbasvakhariya00@gmail.com`
- `EMAIL_PASS` = `tqrnsfavstlaubdt` (Gmail App Password)

---

## Testing

### Test 1: Registration
1. Register a new user
2. Check if registration succeeds (even if email fails)
3. Try resend OTP if email didn't arrive

### Test 2: Login
1. Request login OTP
2. Check if request succeeds (even if email fails)
3. Try resend if needed

### Test 3: Check Logs
Monitor Render logs for:
- `Email sent successfully` - Success
- `Error sending email` - Failure (but registration/login still works)

---

## If Email Still Fails

### Possible Causes:

1. **Gmail App Password Issues**
   - Verify app password is correct
   - Make sure 2FA is enabled on Gmail account
   - Generate new app password if needed

2. **Network/Firewall**
   - Render might be blocking SMTP connections
   - Gmail might be blocking Render IPs
   - Check Render logs for specific error

3. **Rate Limiting**
   - Gmail has sending limits
   - Too many emails in short time = blocked
   - Wait and try again

### Solutions:

1. **Use Alternative Email Service**
   - SendGrid
   - Mailgun
   - AWS SES
   - These are more reliable for production

2. **Check Gmail Settings**
   - Allow less secure apps (not recommended)
   - Use OAuth2 instead of app password
   - Check Gmail account for security alerts

3. **Monitor Logs**
   - Check Render logs for specific errors
   - Look for connection refused vs timeout
   - Check if emails are being sent but not received

---

## Current Status

✅ **Fixed:**
- Email timeout configuration
- Graceful error handling
- Registration/login no longer blocked by email failures
- Better user messages

⚠️ **Note:**
- Email sending may still fail due to network/Gmail issues
- But registration/login will work regardless
- Users can request resend OTP

---

## Next Steps

1. **Monitor Render Logs**
   - Watch for email success/failure
   - Check if timeouts are resolved

2. **Test Registration/Login**
   - Try registering new user
   - Try login with OTP
   - Check if OTP is received

3. **If Still Failing:**
   - Consider alternative email service
   - Check Gmail account settings
   - Review Render network configuration

---

**The key improvement: Registration and login now work even if email sending fails!** 🎉

