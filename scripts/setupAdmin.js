const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument or use default
    const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@windowmanagement.com';
    const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.argv[4] || 'Admin User';

    if (!adminEmail || !adminEmail.includes('@')) {
      console.error('❌ Please provide a valid email address');
      console.log('Usage: node scripts/setupAdmin.js <email> [password] [name]');
      console.log('Example: node scripts/setupAdmin.js your-email@gmail.com admin123 "Admin Name"');
      process.exit(1);
    }

    // Check if admin with this email exists
    let admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (admin) {
      // Update existing user to admin
      console.log(`📧 Found existing user with email: ${adminEmail}`);
      admin.role = 'admin';
      admin.isEmailVerified = true;
      admin.subscriptionTier = '12_months';
      admin.subscriptionStatus = 'active';
      admin.subscriptionStartDate = new Date();
      admin.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      if (adminPassword && adminPassword !== 'admin123') {
        admin.password = adminPassword;
      }
      await admin.save();
      console.log('✅ Existing user updated to admin role');
    } else {
      // Check if there's any existing admin user
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        console.log(`⚠️  Admin user already exists with email: ${existingAdmin.email}`);
        console.log('   Updating that user...');
        existingAdmin.email = adminEmail.toLowerCase();
        existingAdmin.isEmailVerified = true;
        if (adminPassword && adminPassword !== 'admin123') {
          existingAdmin.password = adminPassword;
        }
        await existingAdmin.save();
        admin = existingAdmin;
        console.log('✅ Admin email updated');
      } else {
        // Create new admin user
        admin = await User.create({
          email: adminEmail.toLowerCase(),
          password: adminPassword,
          fullName: adminName,
          role: 'admin',
          isEmailVerified: true,
          subscriptionTier: '12_months',
          subscriptionStatus: 'active',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        });
        console.log('✅ New admin user created');
      }
    }

    console.log('\n📋 Admin User Details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.fullName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Email Verified: ${admin.isEmailVerified ? 'Yes' : 'No'}`);
    console.log(`   Subscription: ${admin.subscriptionStatus} (${admin.subscriptionTier})`);
    console.log('\n🔐 Login Instructions:');
    console.log('   1. Go to http://localhost:5173/login');
    console.log(`   2. Enter email: ${admin.email}`);
    console.log('   3. Click "Request OTP"');
    console.log('   4. Check your email for the OTP');
    console.log('   5. Enter OTP and login');
    console.log('\n✨ You will see "Admin Panel" in the sidebar menu after login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists. Please use a different email or update the existing user.');
    }
    process.exit(1);
  }
}

setupAdmin();

