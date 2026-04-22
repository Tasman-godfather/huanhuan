import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';

const router = Router();

// ========== Buyer endpoints ==========

// List products (search, filter, sort, paginate)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, categoryId, minPrice, maxPrice, sortBy, order, page = '1', pageSize = '20' } = req.query;
    const where: any = { status: 'active' };
    if (q) {
      const keyword = String(q);
      const matchingCats = await prisma.category.findMany({ where: { name: { contains: keyword } }, select: { id: true } });
      const catIds = matchingCats.map(c => c.id);
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        ...(catIds.length > 0 ? [{ categoryId: { in: catIds } }] : []),
      ];
    }
    if (categoryId) where.categoryId = String(categoryId);
    if (minPrice || maxPrice) {
      where.minPrice = {};
      if (minPrice) where.minPrice.gte = Number(minPrice);
      if (maxPrice) where.minPrice.lte = Number(maxPrice);
    }

    const orderBy: any = {};
    if (sortBy === 'sales') orderBy.salesCount = order === 'asc' ? 'asc' : 'desc';
    else if (sortBy === 'price') orderBy.minPrice = order === 'asc' ? 'asc' : 'desc';
    else if (sortBy === 'rating') orderBy.rating = 'desc';
    else orderBy.createdAt = 'desc';

    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip, take: Number(pageSize),
        include: { images: { where: { type: 'main' }, take: 1 }, shop: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
});

// Recommendations: mix of popular + newest to ensure fresh products always appear
router.get('/recommendations', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const include = { images: { where: { type: 'main' as const }, take: 1 }, shop: { select: { id: true, name: true } } };
    const [popular, newest] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, orderBy: { salesCount: 'desc' }, take: 12, include }),
      prisma.product.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' }, take: 12, include }),
    ]);
    const seen = new Set<string>();
    const merged: typeof popular = [];
    for (const p of [...popular, ...newest]) {
      if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
    }
    // Interleave: alternate popular and new so the feed feels diverse
    const popOnly = merged.filter(p => popular.some(pp => pp.id === p.id));
    const newOnly = merged.filter(p => !popular.some(pp => pp.id === p.id));
    const result: typeof popular = [];
    let pi = 0, ni = 0;
    while (pi < popOnly.length || ni < newOnly.length) {
      if (pi < popOnly.length) result.push(popOnly[pi++]);
      if (pi < popOnly.length) result.push(popOnly[pi++]);
      if (ni < newOnly.length) result.push(newOnly[ni++]);
    }
    res.json(result.slice(0, 24));
  } catch (err) { next(err); }
});

// Product detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        skus: { where: { status: 'active' } },
        images: { orderBy: { sortOrder: 'asc' } },
        shop: { select: { id: true, name: true, logo: true, rating: true, followerCount: true, sellerId: true } },
      },
    });
    if (!product) throw new NotFoundError('Product not found');
    res.json(product);
  } catch (err) { next(err); }
});

// ========== Seller endpoints ==========

// Create product
router.post('/', authenticate, authorize('merchant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      shop = await prisma.shop.create({ data: { sellerId: req.user!.userId, name: user?.companyName || user?.nickname || '商家店铺' } });
    }

    const { title, description, categoryId, videoUrl, skus, images, wantItems } = req.body;
    const prices = skus.map((s: any) => s.price);
    const product = await prisma.product.create({
      data: {
        shopId: shop.id, categoryId, title, description, videoUrl, wantItems,
        status: 'active',
        minPrice: Math.min(...prices), maxPrice: Math.max(...prices),
        skus: { create: skus.map((s: any) => ({ specs: s.specs, price: s.price, originalPrice: s.originalPrice, stock: s.stock, image: s.image })) },
        images: { create: (images || []).map((img: any, i: number) => ({ url: img.url, sortOrder: i, type: img.type || 'main' })) },
      },
      include: { skus: true, images: true },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// Update product
router.put('/:id', authenticate, authorize('merchant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || product.shopId !== shop?.id) throw new ForbiddenError('Not your product');

    const { title, description, categoryId, videoUrl, wantItems, images, skus } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
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
            productId: req.params.id, url: img.url, sortOrder: i, type: img.type || 'main',
          })),
        });
      }
      if (skus) {
        await tx.sku.deleteMany({ where: { productId: req.params.id } });
        await tx.sku.createMany({
          data: skus.map((s: any) => ({
            productId: req.params.id, specs: s.specs || {}, price: s.price,
            originalPrice: s.originalPrice || s.price, stock: s.stock,
          })),
        });
      }
      return tx.product.update({
        where: { id: req.params.id }, data: updateData,
        include: { skus: true, images: { orderBy: { sortOrder: 'asc' } } },
      });
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Toggle status
router.patch('/:id/status', authenticate, authorize('merchant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || product.shopId !== shop?.id) throw new ForbiddenError('Not your product');

    const { status } = req.body; // 'active' or 'inactive'
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: { status } });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
