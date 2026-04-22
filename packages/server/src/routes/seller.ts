import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError } from '../lib/errors.js';

const router = Router();
router.use(authenticate, authorize('merchant'));

router.get('/shop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      shop = await prisma.shop.create({ data: { sellerId: req.user!.userId, name: `${user?.companyName || user?.nickname}` } });
    }
    res.json(shop);
  } catch (err) { next(err); }
});

router.put('/shop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, logo, description, layoutConfig } = req.body;
    const shop = await prisma.shop.update({
      where: { sellerId: req.user!.userId },
      data: { name, logo, description, layoutConfig },
    });
    res.json(shop);
  } catch (err) { next(err); }
});

router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop) { res.json({ items: [], total: 0 }); return; }
    const { status, page = '1', pageSize = '100' } = req.query;
    const where: any = { shopId: shop.id };
    if (status) where.status = String(status);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
        include: { images: { where: { type: 'main' }, take: 1 }, skus: true },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total });
  } catch (err) { next(err); }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop) throw new NotFoundError();

    const [totalOrders, totalProducts, completedOrders] = await Promise.all([
      prisma.order.count({ where: { shopId: shop.id } }),
      prisma.product.count({ where: { shopId: shop.id } }),
      prisma.order.count({ where: { shopId: shop.id, status: 'completed' } }),
    ]);

    const orders = await prisma.order.findMany({
      where: { shopId: shop.id, status: 'completed' },
      select: { payableAmount: true },
    });
    const totalRevenue = orders.reduce((s, o) => s + o.payableAmount, 0);

    res.json({
      totalOrders, totalProducts, completedOrders, totalRevenue,
      conversionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
    });
  } catch (err) { next(err); }
});

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop) throw new NotFoundError();
    const { status, page = '1', pageSize = '10' } = req.query;
    const where: any = { shopId: shop.id };
    if (status) where.status = String(status);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
        include: { orderItems: true, buyer: { select: { id: true, nickname: true, companyName: true } } },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ items, total });
  } catch (err) { next(err); }
});

export default router;
