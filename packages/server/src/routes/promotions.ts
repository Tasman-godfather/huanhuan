import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { ConflictError } from '../lib/errors.js';

const router = Router();

// Flash sales
router.get('/flash-sales', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: { type: 'flash_sale', status: 'active', startAt: { lte: now }, endAt: { gte: now } },
      include: {
        flashSaleItems: {
          include: { product: { include: { images: { where: { type: 'main' }, take: 1 } } } },
        },
      },
    });
    res.json(promotions);
  } catch (err) { next(err); }
});

// Check-in
router.post('/check-in', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: req.user!.userId, date: today } },
    });
    if (existing) throw new ConflictError('Already checked in today');

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const yesterdayCheckIn = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: req.user!.userId, date: yesterday } },
    });
    const consecutiveDays = yesterdayCheckIn ? yesterdayCheckIn.consecutiveDays + 1 : 1;
    const reward = { points: consecutiveDays * 10 };

    const checkIn = await prisma.checkIn.create({
      data: { userId: req.user!.userId, date: today, consecutiveDays, reward },
    });
    res.status(201).json(checkIn);
  } catch (err) { next(err); }
});

// User coupons
router.get('/coupons', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = { userId: req.user!.userId };
    if (status) where.status = String(status);
    const coupons = await prisma.userCoupon.findMany({
      where, include: { coupon: true }, orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err) { next(err); }
});

export default router;
