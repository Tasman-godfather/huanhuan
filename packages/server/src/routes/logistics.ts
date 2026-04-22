import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

router.get('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logistics = await prisma.logistics.findUnique({ where: { orderId: req.params.orderId } });
    if (!logistics) throw new NotFoundError('No logistics info');
    res.json(logistics);
  } catch (err) { next(err); }
});

export default router;
