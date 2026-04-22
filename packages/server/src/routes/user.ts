import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

// Get profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, nickname: true, avatar: true, gender: true, birthday: true, phone: true, email: true, role: true, companyName: true, huanbeiBalance: true, depositAmount: true },
    });
    if (!user) throw new NotFoundError();
    res.json(user);
  } catch (err) { next(err); }
});

// Update profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nickname, avatar, gender, birthday, companyName } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { nickname, avatar, gender, birthday: birthday ? new Date(birthday) : undefined, companyName },
      select: { id: true, nickname: true, avatar: true, gender: true, birthday: true, phone: true, email: true, role: true, companyName: true, huanbeiBalance: true, depositAmount: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// Favorites
router.get('/favorites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const where: any = { userId: req.user!.userId };
    if (type) where.type = String(type);
    const favorites = await prisma.favorite.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(favorites);
  } catch (err) { next(err); }
});

router.post('/favorites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, targetId } = req.body;
    const fav = await prisma.favorite.create({ data: { userId: req.user!.userId, type, targetId } });
    res.status(201).json(fav);
  } catch (err) { next(err); }
});

router.delete('/favorites/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.favorite.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// Huanbei records
router.get('/huanbei/records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const where = { userId: req.user!.userId };
    const [items, total] = await Promise.all([
      prisma.huanbeiRecord.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
      }),
      prisma.huanbeiRecord.count({ where }),
    ]);
    res.json({ items, total });
  } catch (err) { next(err); }
});

// Huanbei recharge
router.post('/huanbei/recharge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) throw new ValidationError('充值金额必须大于0');
    if (amount < 100) throw new ValidationError('最低充值100换贝');

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { huanbeiBalance: { increment: amount } },
    });

    await prisma.huanbeiRecord.create({
      data: {
        userId: req.user!.userId,
        amount,
        type: 'recharge',
        remark: `充值 ${amount} 换贝`,
      },
    });

    res.json({ balance: user.huanbeiBalance, message: `成功充值 ${amount} 换贝` });
  } catch (err) { next(err); }
});

// Browsing history (record via middleware in product detail)
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Return recent browsing - using search history as proxy for now
    const history = await prisma.searchHistory.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(history);
  } catch (err) { next(err); }
});

export default router;
