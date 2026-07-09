import mongoose from 'mongoose';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import { config } from '../config/env.js';

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🏁 Starting Automated Authentication Module Tests...');

  // 1. Connect to MongoDB to prepare database state
  await mongoose.connect(config.mongoUri);
  console.log('🔌 Connected to database for prep-work.');

  // Clean up previous test accounts
  const email = 'customer_test@cravego.com';
  await User.deleteOne({ email });
  await OTP.deleteMany({ email });
  console.log('🧹 Cleaned up old test database records.');

  // 2. Test User Registration
  console.log('\nStep 1: Registering User...');
  const regPayload = {
    name: 'Test Customer',
    email,
    phone: '8888888888',
    password: 'password123',
    role: 'customer'
  };

  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  const regData = await regRes.json();
  console.log('Registration Response Status:', regRes.status);
  console.log('Registration Response Body:', JSON.stringify(regData, null, 2));

  if (!regData.success) {
    throw new Error('Registration failed!');
  }

  // 3. Query Database for generated OTP (bypass SMS/Email dispatch constraints)
  console.log('\nStep 2: Retrieving OTP from Database...');
  const otpRecord = await OTP.findOne({ email, purpose: 'email_verification' });
  if (!otpRecord) {
    throw new Error('OTP was not generated in database!');
  }
  console.log(`Found OTP code: [${otpRecord.otp}] expiring at ${otpRecord.expiresAt}`);

  // 4. Verify OTP & Retrieve Tokens
  console.log('\nStep 3: Verifying OTP...');
  const verifyPayload = {
    email,
    otp: otpRecord.otp,
    purpose: 'email_verification'
  };

  const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload)
  });
  const verifyData = await verifyRes.json();
  console.log('Verification Response Status:', verifyRes.status);
  console.log('Verification Response Body:', JSON.stringify(verifyData, null, 2));

  if (!verifyData.success) {
    throw new Error('OTP verification failed!');
  }

  const accessToken = verifyData.data.accessToken;
  const cookieHeaders = verifyRes.headers.get('set-cookie');
  console.log('Received AccessToken:', accessToken.substring(0, 20) + '...');
  console.log('Received Cookies (Refresh Token):', cookieHeaders);

  // 5. Query /me profile using Access Token
  console.log('\nStep 4: Fetching Profile details...');
  const profileRes = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  const profileData = await profileRes.json();
  console.log('Profile Response Status:', profileRes.status);
  console.log('Profile Response Body:', JSON.stringify(profileData, null, 2));

  if (!profileData.success) {
    throw new Error('Profile fetch failed!');
  }

  // 6. Test Refresh Token rotation (simulated by passing cookie header)
  console.log('\nStep 5: Testing Session Refresh Rotation...');
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Cookie': cookieHeaders || '',
      'Content-Type': 'application/json'
    }
  });
  const refreshData = await refreshRes.json();
  console.log('Refresh Response Status:', refreshRes.status);
  console.log('Refresh Response Body:', JSON.stringify(refreshData, null, 2));

  if (!refreshData.success) {
    throw new Error('Token refresh failed!');
  }

  // 7. Clean up and close connection
  console.log('\nStep 6: Invalidation (Logout)...');
  const logoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Cookie': cookieHeaders || ''
    }
  });
  const logoutData = await logoutRes.json();
  console.log('Logout Response Status:', logoutRes.status);
  console.log('Logout Response Body:', JSON.stringify(logoutData, null, 2));

  await mongoose.connection.close();
  console.log('\n✅ All Authentication Integration tests passed successfully!');
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed with error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
