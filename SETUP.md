# Backend Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- PayPal Developer account
- Gmail account (for email service)

## Step-by-Step Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://abbas:abbas123@abbas.tdhnt9r.mongodb.net/windows managment system?retryWrites=true&w=majority&appName=abbas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# PayPal Configuration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@windowmanagement.com
ADMIN_PASSWORD=admin123
```

### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASS`

### 4. PayPal Setup

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Create a new app
3. Get Client ID and Client Secret
4. For production, switch `PAYPAL_MODE` to `live`

### 5. Create Admin User

```bash
node scripts/createAdmin.js
```

This will create an admin user with:
- Email: admin@windowmanagement.com (or from ADMIN_EMAIL)
- Password: admin123 (or from ADMIN_PASSWORD)

### 6. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## API Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

## Deployment on Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: window-management-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add all environment variables from `.env` file
7. Deploy!

## Subscription Plans

- **1 Month**: ₹460
- **3 Months**: ₹1,250
- **6 Months**: ₹2,200
- **12 Months**: ₹4,000

## Features

✅ User registration with email verification
✅ OTP-based login (single device)
✅ 14-day free trial
✅ PayPal subscription integration
✅ User settings sync
✅ Window data storage
✅ Admin panel for user management
✅ Device-based session management

