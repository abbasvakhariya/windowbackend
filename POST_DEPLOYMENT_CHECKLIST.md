# Post-Deployment Checklist

## ✅ Deployment Complete!

Your backend is now live on Render. Follow these steps to verify everything is working.

---

## Step 1: Verify Deployment

### Test Health Endpoint
Visit your Render URL + `/api/health`:
```
https://your-app-name.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Test API Base URL
Your API base URL is:
```
https://your-app-name.onrender.com/api
```

---

## Step 2: Update Frontend Configuration

### Option A: Update Environment Variable (Recommended)

1. In your frontend project (`my-react-app`), create or update `.env`:
```env
VITE_API_URL=https://your-app-name.onrender.com/api
```

2. Or if deploying on Vercel, add environment variable:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-app-name.onrender.com/api`

### Option B: Update API File Directly

Update `my-react-app/src/utils/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-app-name.onrender.com/api';
```

Replace `your-app-name` with your actual Render service name.

---

## Step 3: Test Authentication Endpoints

### Test Registration
```bash
POST https://your-app-name.onrender.com/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

### Test Login OTP Request
```bash
POST https://your-app-name.onrender.com/api/auth/request-login-otp
Content-Type: application/json

{
  "email": "abbasvakhariya00@gmail.com"
}
```

---

## Step 4: Create Admin User

### Method 1: Using Render Shell (Recommended)

1. Go to Render Dashboard → Your Service
2. Click on **"Shell"** tab
3. Run:
```bash
node scripts/setupAdmin.js abbasvakhariya00@gmail.com admin123 "Admin User"
```

### Method 2: Using API (if endpoint exists)

```bash
POST https://your-app-name.onrender.com/api/admin/users/create
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "email": "abbasvakhariya00@gmail.com",
  "password": "your-password",
  "fullName": "Admin User",
  "subscriptionTier": "12_months",
  "subscriptionStatus": "active"
}
```

---

## Step 5: Verify CORS Configuration

Make sure your backend allows requests from your frontend:

1. Check `backend/server.js` - CORS should allow:
   - `https://rajwindow.vercel.app`
   - Your Render URL (if needed)

2. Test from browser console:
```javascript
fetch('https://your-app-name.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Step 6: Test Admin Panel Access

1. Login with admin email: `abbasvakhariya00@gmail.com`
2. Request OTP from login page
3. Enter OTP and login
4. Verify "Admin Panel" appears in sidebar
5. Test admin features:
   - Add User
   - Edit User
   - Delete User
   - Manage Subscription Plans
   - Send Notifications

---

## Step 7: Test Key Features

### ✅ User Management
- [ ] Add new user
- [ ] Edit user details
- [ ] Delete user
- [ ] View user details
- [ ] Bulk operations

### ✅ Subscription Management
- [ ] View all plans
- [ ] Edit plan prices
- [ ] Add new plan
- [ ] Delete plan

### ✅ Notifications
- [ ] Send notification to users
- [ ] Verify email delivery
- [ ] Check in-app notifications

### ✅ Authentication
- [ ] User registration
- [ ] Email verification
- [ ] Login with OTP
- [ ] Single device login

---

## Step 8: Monitor Your Service

### Render Dashboard
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, Memory, Response times
- **Events**: See deployment history

### Important Metrics to Watch:
- Response time (should be < 500ms)
- Error rate (should be 0%)
- Uptime (should be 100%)

---

## Step 9: Update Documentation

Update any documentation with your new API URL:
- README.md
- API documentation
- Frontend configuration files

---

## Troubleshooting

### Service Not Responding
1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Check MongoDB connection
4. Verify PORT is set (Render uses PORT env var automatically)

### CORS Errors
1. Add your frontend URL to CORS allowed origins
2. Check browser console for specific error
3. Verify `credentials: true` is set in CORS config

### Database Connection Issues
1. Verify MongoDB URI is correct
2. Check MongoDB Atlas network access (allow 0.0.0.0/0)
3. Verify database name has no spaces

### Email Not Sending
1. Check EMAIL_USER and EMAIL_PASS are correct
2. Verify Gmail app password is valid
3. Check Render logs for email errors

### Admin Panel Not Accessible
1. Verify you're logged in with: `abbasvakhariya00@gmail.com`
2. Check user role in database
3. Verify middleware is checking email correctly

---

## Performance Tips

### Free Tier Limitations:
- ⚠️ Services spin down after 15 min inactivity
- First request after spin-down: 30-60 seconds
- Consider upgrading for always-on service

### Optimization:
- Enable caching where possible
- Optimize database queries
- Use connection pooling
- Monitor slow queries

---

## Security Checklist

- [ ] All environment variables are set (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB credentials are secure
- [ ] Email credentials are protected
- [ ] PayPal credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Admin access is restricted to your email only

---

## Next Steps

1. ✅ Backend deployed
2. ⬜ Update frontend API URL
3. ⬜ Test all endpoints
4. ⬜ Create admin user
5. ⬜ Test admin panel
6. ⬜ Deploy frontend (if not already)
7. ⬜ End-to-end testing
8. ⬜ Monitor and optimize

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Render Community**: https://community.render.com
- **Your Backend Logs**: Render Dashboard → Your Service → Logs

---

## Your Deployment Info

**Backend URL**: `https://your-app-name.onrender.com`  
**API Base URL**: `https://your-app-name.onrender.com/api`  
**Health Check**: `https://your-app-name.onrender.com/api/health`  
**Frontend URL**: `https://rajwindow.vercel.app`

---

🎉 **Congratulations! Your backend is live!**

Now update your frontend to use the new API URL and test everything end-to-end.

