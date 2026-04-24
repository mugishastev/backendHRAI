import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middleware/auth.middleware';

// Extend the Request type to include fileValidationError from Multer's fileFilter
declare module 'express' {
    interface Request {
        fileValidationError?: string;
    }
}

// Rate limiting middleware for upload endpoint
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 upload requests per windowMs
    message:
        'Too many upload requests from this IP, please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const router = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            // Set a custom error message on the request object
            (req as Request).fileValidationError = 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.';
            cb(null, false); // Reject file
        }
    },
});

// Configure Cloudinary
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
} else {
    console.warn('⚠️ Cloudinary is not configured. Uploads will fail.');
}

/**
 * POST /api/upload/resume
 * Handles resume uploads from the frontend
 */
router.post('/resume', verifyToken, uploadLimiter, upload.single('resume'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!isCloudinaryConfigured) {
            return res.status(503).json({ error: 'Cloudinary storage is not configured on the server.' });
        }

        // Check for file type validation error from Multer's fileFilter
        if (req.fileValidationError) {
            return res.status(400).json({ error: req.fileValidationError });
        }

        // Stream the buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'hrai_resumes',
                    resource_type: 'raw', // Preserves file integrity for PDF/DOCX parsing
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file?.buffer);
        });

        return res.status(200).json({ url: (result as any).secure_url });
    } catch (error: any) {
        // Log the full error for debugging
        console.error('Cloudinary Upload Error:', error.message, error.stack);
        // Handle Multer-specific errors
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
            }
        }
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

export default router;