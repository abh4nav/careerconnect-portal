import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

async function createAdmin() {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGODB_URI) {
      throw new Error(
        'Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD and MONGODB_URI.'
      );
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error('Admin password must be at least 12 characters.');
    }

    await mongoose.connect(MONGODB_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        'This email already has an account. Choose a different admin email.'
      );
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: ADMIN_NAME.trim(),
      email,
      passwordHash,
      role: 'admin'
    });

    console.log(`Admin account created for ${email}`);
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
