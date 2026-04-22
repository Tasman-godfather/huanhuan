import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get category tree
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    });
    const tree = categories.filter((c) => !c.parentId);
    res.json(tree);
  } catch (err) { next(err); }
});

// Create category (admin)
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, icon, parentId, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: { name, icon, parentId, sortOrder: sortOrder || 0 },
    });
    res.status(201).json(category);
  } catch (err) { next(err); }
});

export default router;
