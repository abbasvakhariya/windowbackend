const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@windowmanagement.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      fullName: 'Admin User',
      role: 'admin',
      isEmailVerified: true,
      subscriptionTier: '12_months',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

