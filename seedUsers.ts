import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const usersToSeed = [
  {
    email: 'admin_real@umurava.ai',
    passwordHash: 'admin123',
    role: 'admin'
  },
  {
    email: 'recruiter1@umurava.ai',
    passwordHash: 'password123',
    role: 'recruiter'
  },
  {
    email: 'recruiter2@umurava.ai',
    passwordHash: 'password123',
    role: 'recruiter'
  }
];

async function seedUsers() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set!");

    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB!');

    for (const data of usersToSeed) {
      // Check if user already exists
      const existing = await User.findOne({ email: data.email });
      if (!existing) {
        await User.create(data);
        console.log(`Created user: ${data.email}`);
      } else {
        console.log(`User already exists: ${data.email}`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedUsers();
