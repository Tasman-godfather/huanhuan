import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../lib/errors.js';

const router = Router();

const storage = multer.diskStorage({
  destination: path.resolve(import.meta.dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only JPEG, PNG, GIF, WebP images are allowed') as any, false);
    }
  },
});

router.post('/', authenticate, upload.array('images', 10), (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new ValidationError('No files uploaded');

    const urls = files.map((f) => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      size: f.size,
    }));
    res.json(urls);
  } catch (err) { next(err); }
});

export default router;
