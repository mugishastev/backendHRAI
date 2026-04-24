import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import appRoutes from './routes';
import { logActivity } from './middleware/logger.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set trust proxy for Vercel/rate limiting
app.set('trust proxy', 1);

// Pre-flight manual override for Vercel Serverless
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
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
    docs: '/api/docs (if available)'
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server Logic (Modified for Vercel)
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI not found. Database connection skipped.');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
};

// Only run app.listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 Local Server running on http://localhost:${PORT}`);
        });
    });
} else {
    // In Vercel, we just connect (Vercel will handle the "listen" part)
    connectDB();
}

export default app;
