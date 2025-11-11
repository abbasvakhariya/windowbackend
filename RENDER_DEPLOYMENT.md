# Render Deployment Guide

## Step-by-Step Instructions to Deploy Backend on Render

### Prerequisites
- GitHub account with repository: https://github.com/abbasvakhariya/windowbackend
- Render account (sign up at https://render.com if you don't have one)
- MongoDB Atlas connection string
- Email credentials (Gmail app password)
- PayPal credentials (if using payments)

---

## Step 1: Sign Up / Sign In to Render

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"** or **"Sign In"**
3. Sign in with your GitHub account (recommended for easy repository access)

---

## Step 2: Create New Web Service

1. Once logged in, click **"New +"** button in the top right
2. Select **"Web Service"**
3. You'll see options to connect your repository

---

## Step 3: Connect Your GitHub Repository

1. Click **"Connect account"** if you haven't connected GitHub yet
2. Authorize Render to access your GitHub repositories
3. Search for or select: **`abbasvakhariya/windowbackend`**
4. Click **"Connect"**

---

## Step 4: Configure Your Service

### Basic Settings:
- **Name**: `window-management-api` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., `Singapore` for India)
- **Branch**: `main`
- **Root Directory**: Leave empty (backend is at root)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables:
Click **"Advanced"** and add these environment variables:

#### Required Variables:

1. **NODE_ENV**
   - Value: `production`

2. **PORT**
   - Value: `5000` (Render will override this, but set it anyway)

3. **MONGODB_URI**
   - Value: `mongodb+srv://abbas:abbas123@abbas.tdhnt9r.mongodb.net/windows-management-system?retryWrites=true&w=majority&appName=abbas`
   - ⚠️ **Important**: Make sure database name has no spaces (use hyphens)

4. **JWT_SECRET**
   - Value: Generate a strong random string (min 32 characters)
   - Example: `your-super-secret-jwt-key-change-this-in-production-min-32-chars-random-string-here`

5. **JWT_EXPIRE**
   - Value: `7d`

6. **EMAIL_HOST**
   - Value: `smtp.gmail.com`

7. **EMAIL_PORT**
   - Value: `587`

8. **EMAIL_USER**
   - Value: `abbasvakhariya00@gmail.com`

9. **EMAIL_PASS**
   - Value: `tqrnsfavstlaubdt` (your Gmail app password)

10. **FRONTEND_URL**
    - Value: `https://rajwindow.vercel.app`

11. **PAYPAL_MODE**
    - Value: `sandbox` (for testing) or `live` (for production)

12. **PAYPAL_CLIENT_ID**
    - Value: Your PayPal Client ID

13. **PAYPAL_CLIENT_SECRET**
    - Value: Your PayPal Client Secret

---

## Step 5: Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building your application
3. You'll see build logs in real-time
4. Wait for deployment to complete (usually 2-5 minutes)

---

## Step 6: Verify Deployment

1. Once deployed, you'll get a URL like: `https://window-management-api.onrender.com`
2. Test the health endpoint: `https://your-app-name.onrender.com/api/health`
3. You should see: `{"status":"OK","message":"Server is running"}`

---

## Step 7: Update Frontend API URL

Update your frontend to use the new backend URL:

1. In your frontend `.env` or environment variables:
   ```
   VITE_API_URL=https://your-app-name.onrender.com/api
   ```

2. Or update `my-react-app/src/utils/api.js`:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'https://your-app-name.onrender.com/api';
   ```

---

## Step 8: Create Admin User (After Deployment)

Once deployed, you can create an admin user by:

1. Using Render's **Shell** feature:
   - Go to your service → **Shell** tab
   - Run: `node scripts/setupAdmin.js abbasvakhariya00@gmail.com admin123 "Admin User"`

2. Or use the API endpoint (if you add one):
   - POST to `/api/admin/users/create`

---

## Important Notes

### Free Tier Limitations:
- Render free tier services **spin down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds (cold start)
- Consider upgrading to paid plan for always-on service

### Database Connection:
- Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Render's IP addresses to MongoDB whitelist

### CORS Configuration:
- Your backend already allows `https://rajwindow.vercel.app`
- Make sure to add your Render URL to CORS if needed

### Environment Variables Security:
- Never commit `.env` file to Git
- All sensitive data should be in Render's Environment Variables section
- Mark sensitive variables as "Secret" in Render

---

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Ensure `package.json` has correct dependencies
- Verify Node version compatibility

### Service Won't Start:
- Check start command: should be `npm start`
- Verify `server.js` exists and is correct
- Check environment variables are set

### Database Connection Error:
- Verify MongoDB URI is correct
- Check MongoDB Atlas network access settings
- Ensure database name doesn't have spaces

### Email Not Working:
- Verify Gmail app password is correct
- Check if "Less secure app access" is enabled (if needed)
- Test email sending from Render logs

---

## Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, Memory, and Response times
- **Alerts**: Set up alerts for service downtime

---

## Updating Your Deployment

Whenever you push to GitHub:
1. Render automatically detects changes
2. Triggers a new deployment
3. Builds and deploys the latest code
4. Zero-downtime deployment (if configured)

---

## Support

- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

---

## Quick Checklist

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service created
- [ ] All environment variables set
- [ ] Service deployed successfully
- [ ] Health endpoint working
- [ ] Frontend updated with new API URL
- [ ] Admin user created
- [ ] Tested API endpoints

---

**Your Backend URL will be**: `https://your-service-name.onrender.com`

**API Base URL**: `https://your-service-name.onrender.com/api`

Good luck with your deployment! 🚀

