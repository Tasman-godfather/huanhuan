import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Search suggestions (autocomplete)
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) { res.json([]); return; }
    const products = await prisma.product.findMany({
      where: { status: 'active', title: { contains: String(q) } },
      select: { title: true },
      take: 10,
    });
    const suggestions = [...new Set(products.map((p) => p.title))];
    res.json(suggestions);
  } catch (err) { next(err); }
});

// Search history
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await prisma.searchHistory.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(history);
  } catch (err) { next(err); }
});

// Clear search history
router.delete('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.query;
    if (id) {
      await prisma.searchHistory.deleteMany({ where: { id: String(id), userId: req.user!.userId } });
    } else {
      await prisma.searchHistory.deleteMany({ where: { userId: req.user!.userId } });
    }
    res.json({ message: 'Cleared' });
  } catch (err) { next(err); }
});

// Record search (called internally when products are searched)
router.post('/record', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = req.body;
    if (keyword) {
      await prisma.searchHistory.create({ data: { userId: req.user!.userId, keyword } });
    }
    res.json({ message: 'Recorded' });
  } catch (err) { next(err); }
});

export default router;
