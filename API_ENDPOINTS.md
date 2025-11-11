# API Endpoints Reference

## Base URL
**Production**: `https://windowmanagementsystem.onrender.com`

**API Base**: `https://windowmanagementsystem.onrender.com/api`

---

## Root Endpoint

### GET /
Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Window Management System API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "users": "/api/users",
    "subscription": "/api/subscription",
    "settings": "/api/settings",
    "windows": "/api/windows",
    "admin": "/api/admin"
  }
}
```

---

## Health Check

### GET /api/health
Check if the server is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "User Name"
}
```

### POST /api/auth/verify-email
Verify email with OTP.

**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /api/auth/request-login-otp
Request login OTP.

**Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/login
Login with OTP.

**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "deviceId": "device_123"
}
```

### POST /api/auth/logout
Logout user (requires authentication).

### GET /api/auth/me
Get current user (requires authentication).

---

## User Endpoints

### GET /api/users/profile
Get user profile (requires authentication).

### PUT /api/users/profile
Update user profile (requires authentication).

---

## Subscription Endpoints

### GET /api/subscription/plans
Get available subscription plans.

### GET /api/subscription/current
Get current subscription (requires authentication).

### POST /api/subscription/create-payment
Create PayPal payment (requires authentication).

### POST /api/subscription/execute-payment
Execute PayPal payment (requires authentication).

### POST /api/subscription/cancel
Cancel subscription (requires authentication).

---

## Settings Endpoints

### GET /api/settings
Get user settings (requires authentication).

### PUT /api/settings
Update user settings (requires authentication).

---

## Windows Endpoints

### GET /api/windows
Get all windows (requires authentication).

### POST /api/windows
Create window (requires authentication).

### PUT /api/windows/:id
Update window (requires authentication).

### DELETE /api/windows/:id
Delete window (requires authentication).

---

## Admin Endpoints (Admin Only)

### GET /api/admin/users
Get all users.

### GET /api/admin/users/:id
Get user details.

### POST /api/admin/users/create
Create new user.

### PUT /api/admin/users/:id
Update user.

### DELETE /api/admin/users/:id
Delete user.

### GET /api/admin/stats
Get dashboard statistics.

### GET /api/admin/plans
Get subscription plans.

### PUT /api/admin/plans
Update subscription plans.

### POST /api/admin/notifications/send
Send notification to users.

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Also include the device ID header:

```
x-device-id: YOUR_DEVICE_ID
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Testing

### Test Health Endpoint:
```bash
curl https://windowmanagementsystem.onrender.com/api/health
```

### Test Root Endpoint:
```bash
curl https://windowmanagementsystem.onrender.com/api
```

Or visit in browser:
- https://windowmanagementsystem.onrender.com
- https://windowmanagementsystem.onrender.com/api/health

