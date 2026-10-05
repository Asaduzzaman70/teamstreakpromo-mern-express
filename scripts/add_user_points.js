  import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../dist/config/db.js';
import { User } from '../dist/modules/auth/auth.model.js';
import { loginUserService } from '../dist/modules/auth/auth.service.js';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  const email = 'koyow47032@slotbeer.com';
  const password = 'Password123@';

  console.log(`\nVerifying user ${email}...`);
  const user = await User.findOne({ email });

  if (!user) {
    console.error(`User with email ${email} not found!`);
    await mongoose.disconnect();
    return;
  }

  console.log('User found:');
  console.log('- ID:', user._id);
  console.log('- Name:', user.name);
  console.log('- Email:', user.email);
  console.log('- Role:', user.role);
  console.log('- Current totalPoints:', user.totalPoints);
  console.log('- Current walletBalance:', user.walletBalance);

  // Check login credentials
  console.log('\nTesting login with provided credentials...');
  try {
    const loginRes = await loginUserService({ email, password });
    console.log('✓ Login verified successfully!');
    console.log('- Access token preview:', loginRes.accessToken ? `${loginRes.accessToken.slice(0, 20)}...` : 'N/A');
  } catch (err) {
    console.warn('Login verification note:', err.message || err);
  }

  // Add 1000 points
  const pointsToAdd = 1000;
  const oldPoints = user.totalPoints || 0;
  const newPoints = oldPoints + pointsToAdd;

  user.totalPoints = newPoints;
  await user.save();

  console.log('\n=== Points Updated Successfully ===');
  console.log(`- Previous Points: ${oldPoints}`);
  console.log(`- Points Added: +${pointsToAdd}`);
  console.log(`- New Total Points: ${user.totalPoints}`);

  // Fetch fresh from DB to double check persistence
  const freshUser = await User.findById(user._id);
  console.log(`- Verified from DB fresh fetch: ${freshUser.totalPoints} points`);

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

main().catch(console.error);
