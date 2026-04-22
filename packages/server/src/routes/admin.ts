import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError } from '../lib/errors.js';

const router = Router();

router.use(authenticate, authorize('admin'));

// List all products (with search, pagination)
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page = '1', pageSize = '20' } = req.query;
    const where: any = {};
    if (q) where.title = { contains: String(q) };

    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: Number(pageSize),
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          skus: true,
          shop: { select: { id: true, name: true, seller: { select: { id: true, nickname: true, companyName: true } } } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
});

// Get single product detail
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        skus: true,
        shop: { select: { id: true, name: true, seller: { select: { id: true, nickname: true, companyName: true } } } },
        category: { select: { id: true, name: true } },
      },
    });
    if (!product) throw new NotFoundError('Product not found');
    res.json(product);
  } catch (err) { next(err); }
});

// Update any product (admin override)
router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new NotFoundError('Product not found');

    const { title, description, categoryId, status, wantItems, images, skus } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (status !== undefined) updateData.status = status;
    if (wantItems !== undefined) updateData.wantItems = wantItems;

    if (skus && skus.length > 0) {
      const prices = skus.map((s: any) => s.price);
      updateData.minPrice = Math.min(...prices);
      updateData.maxPrice = Math.max(...prices);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: req.params.id } });
        await tx.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: req.params.id,
            url: img.url,
            sortOrder: i,
            type: img.type || 'main',
          })),
        });
      }

      if (skus) {
        await tx.sku.deleteMany({ where: { productId: req.params.id } });
        await tx.sku.createMany({
          data: skus.map((s: any) => ({
            productId: req.params.id,
            specs: s.specs || {},
            price: s.price,
            originalPrice: s.originalPrice || s.price,
            stock: s.stock,
          })),
        });
      }

      return tx.product.update({
        where: { id: req.params.id },
        data: updateData,
        include: { images: { orderBy: { sortOrder: 'asc' } }, skus: true, shop: { select: { name: true } } },
      });
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// List all merchants
router.get('/merchants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchants = await prisma.user.findMany({
      where: { role: 'merchant' },
      select: { id: true, nickname: true, email: true, phone: true, companyName: true, huanbeiBalance: true, depositAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(merchants);
  } catch (err) { next(err); }
});

export default router;
