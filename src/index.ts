import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import appRoutes from './routes';
import { logActivity } from './middleware/logger.middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Set trust proxy for Vercel/rate limiting
app.set('trust proxy', 1);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI not found. Database connection skipped.');
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't throw, let the app try to handle it or return 500 later
  }
};

// Middleware to ensure DB is connected before any request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(logActivity);

// Main API Routes
app.use('/api', appRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.send('Umurava AI Hackathon API run successfully.');
});

// Root Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to HRAI Unified Talent Platform API',
    status: 'online',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// Only run app.listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Local Server running on http://localhost:${PORT}`);
    });
}

export default app;
