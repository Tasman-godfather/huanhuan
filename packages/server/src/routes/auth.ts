import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { signToken, refreshToken, verifyToken } from '../lib/jwt.js';
import redis from '../lib/redis.js';
import { validate } from '../middleware/validate.js';
import { AppError, UnauthorizedError, ValidationError, ConflictError } from '../lib/errors.js';

const router = Router();

// ========== Schemas ==========

const registerByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(50),
  nickname: z.string().min(1).max(30),
});

const registerByPhoneSchema = z.object({
  phone: z.string().regex(/^\d{11}$/),
  code: z.string().length(6),
  nickname: z.string().min(1).max(30),
});

const loginByEmailSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const loginByPhoneSchema = z.object({
  phone: z.string().regex(/^\d{11}$/),
  code: z.string().length(6),
});

const sendCodeSchema = z.object({
  target: z.string(),
  type: z.enum(['phone', 'email']),
});

const resetPasswordSchema = z.object({
  target: z.string(),
  type: z.enum(['phone', 'email']),
  code: z.string().length(6),
  newPassword: z.string().min(6).max(50),
});

// ========== Register ==========

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, code, password, nickname } = req.body;

    if (email && password) {
      registerByEmailSchema.parse({ email, password, nickname });
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new ConflictError('Email already registered');

      const passwordHash = await bcrypt.hash(password, 10);
      const companyName = req.body.companyName;
      const user = await prisma.user.create({
        data: { email, passwordHash, nickname, role: 'merchant', companyName },
      });
      const token = signToken({ userId: user.id, role: user.role });
      res.status(201).json({ user: { id: user.id, nickname: user.nickname, role: user.role, email: user.email, companyName: user.companyName }, token });
    } else if (phone && code) {
      registerByPhoneSchema.parse({ phone, code, nickname });
      // Verify SMS code from Redis
      const storedCode = await redis.get(`verify:${phone}`);
      if (!storedCode || storedCode !== code) throw new ValidationError('Invalid verification code');

      const exists = await prisma.user.findUnique({ where: { phone } });
      if (exists) throw new ConflictError('Phone already registered');

      const companyName = req.body.companyName;
      const user = await prisma.user.create({
        data: { phone, nickname, role: 'merchant', companyName },
      });
      await redis.del(`verify:${phone}`);
      const token = signToken({ userId: user.id, role: user.role });
      res.status(201).json({ user: { id: user.id, nickname: user.nickname, role: user.role, phone: user.phone, companyName: user.companyName }, token });
    } else {
      throw new ValidationError('Provide email+password or phone+code');
    }
  } catch (err) { next(err); }
});

// ========== Login ==========

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, code, password } = req.body;

    if (email && password) {
      loginByEmailSchema.parse({ email, password });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new UnauthorizedError('Invalid credentials');

      // Check lock
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AppError('ACCOUNT_LOCKED', 'Account is locked. Try again later.', 423);
      }

      const valid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
      if (!valid) {
        const failCount = user.loginFailCount + 1;
        const update: Record<string, unknown> = { loginFailCount: failCount };
        if (failCount >= 5) {
          update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          update.loginFailCount = 0;
        }
        await prisma.user.update({ where: { id: user.id }, data: update });
        throw new UnauthorizedError('Invalid credentials');
      }

      await prisma.user.update({ where: { id: user.id }, data: { loginFailCount: 0, lockedUntil: null } });
      const token = signToken({ userId: user.id, role: user.role });
      res.json({ user: { id: user.id, nickname: user.nickname, role: user.role, email: user.email, avatar: user.avatar, companyName: user.companyName, huanbeiBalance: user.huanbeiBalance }, token });
    } else if (phone && code) {
      loginByPhoneSchema.parse({ phone, code });
      const storedCode = await redis.get(`verify:${phone}`);
      if (!storedCode || storedCode !== code) throw new ValidationError('Invalid verification code');

      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) throw new UnauthorizedError('User not found');

      await redis.del(`verify:${phone}`);
      const token = signToken({ userId: user.id, role: user.role });
      res.json({ user: { id: user.id, nickname: user.nickname, role: user.role, phone: user.phone, avatar: user.avatar, companyName: user.companyName, huanbeiBalance: user.huanbeiBalance }, token });
    } else {
      throw new ValidationError('Provide email+password or phone+code');
    }
  } catch (err) { next(err); }
});

// ========== Send Code ==========

router.post('/send-code', validate(sendCodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target, type } = req.body;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await redis.set(`verify:${target}`, code, 'EX', 300); // 5 min expiry
    // In production, send SMS/email here
    res.json({ message: 'Code sent', ...(process.env.NODE_ENV === 'development' ? { code } : {}) });
  } catch (err) { next(err); }
});

// ========== Reset Password ==========

router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target, type, code: inputCode, newPassword } = req.body;
    const storedCode = await redis.get(`verify:${target}`);
    if (!storedCode || storedCode !== inputCode) throw new ValidationError('Invalid verification code');

    const where = type === 'email' ? { email: target } : { phone: target };
    const user = await prisma.user.findUnique({ where: where as any });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, loginFailCount: 0, lockedUntil: null } });
    await redis.del(`verify:${target}`);
    res.json({ message: 'Password reset successful' });
  } catch (err) { next(err); }
});

// ========== Refresh Token ==========

router.post('/refresh-token', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) throw new ValidationError('Token required');
    const newToken = refreshToken(token);
    res.json({ token: newToken });
  } catch (err) { next(err); }
});

export default router;
