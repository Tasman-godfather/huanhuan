import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../lib/errors.js';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkmdgieuy',
  api_key: process.env.CLOUDINARY_API_KEY || '533458349795623',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SsuD_8MtYIlFWZ53TqTqr-aPzRE',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only JPEG, PNG, GIF, WebP images are allowed'), false);
    }
  },
});

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `huanhuan/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

router.post('/', authenticate, upload.array('images', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) throw new ValidationError('No files uploaded');

    const urls = await Promise.all(
      files.map(async (f) => ({
        url: await uploadToCloudinary(f.buffer, 'products'),
        originalName: f.originalname,
        size: f.size,
      }))
    );
    res.json(urls);
  } catch (err) { next(err); }
});

export default router;
