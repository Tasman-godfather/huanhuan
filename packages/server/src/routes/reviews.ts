import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../lib/errors.js';

const router = Router();

// Get reviews for product
router.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filter, page = '1', pageSize = '10' } = req.query;
    const where: any = { productId: req.params.productId };
    if (filter === 'good') where.rating = { gte: 4 };
    else if (filter === 'medium') where.rating = 3;
    else if (filter === 'bad') where.rating = { lte: 2 };
    else if (filter === 'image') where.images = { isEmpty: false };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
        include: { user: { select: { id: true, nickname: true, avatar: true } }, append: true, reply: true },
      }),
      prisma.review.count({ where }),
    ]);

    // Stats
    const allReviews = await prisma.review.findMany({ where: { productId: req.params.productId }, select: { rating: true } });
    const avg = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
    const distribution = [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: allReviews.filter((rv) => rv.rating === r).length }));

    res.json({ items, total, averageRating: Math.round(avg * 10) / 10, distribution });
  } catch (err) { next(err); }
});

// Submit review
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderItemId, productId, rating, content, images = [] } = req.body;
    if (rating < 1 || rating > 5) throw new ValidationError('Rating must be 1-5');
    if (content && content.length > 500) throw new ValidationError('Content max 500 chars');
    if (images.length > 9) throw new ValidationError('Max 9 images');

    // Check order is completed
    const orderItem = await prisma.orderItem.findUnique({ where: { id: orderItemId }, include: { order: true } });
    if (!orderItem || orderItem.order.buyerId !== req.user!.userId) throw new ForbiddenError();
    if (orderItem.order.status !== 'completed') throw new ValidationError('Order not completed');
    if (orderItem.reviewId) throw new ConflictError('Already reviewed');

    const tags = generateTags(content, rating);
    const review = await prisma.review.create({
      data: { userId: req.user!.userId, productId, orderItemId, rating, content, images, tags },
    });
    await prisma.orderItem.update({ where: { id: orderItemId }, data: { reviewId: review.id } });

    // Update product rating
    const reviews = await prisma.review.findMany({ where: { productId }, select: { rating: true } });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await prisma.product.update({ where: { id: productId }, data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length } });

    res.status(201).json(review);
  } catch (err) { next(err); }
});

// Append review
router.post('/:id/append', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { append: true } });
    if (!review || review.userId !== req.user!.userId) throw new ForbiddenError();
    if (review.append) throw new ConflictError('Already appended');
    const daysSince = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 15) throw new ValidationError('Append window expired (15 days)');

    const { content, images = [] } = req.body;
    const append = await prisma.reviewAppend.create({ data: { reviewId: review.id, content, images } });
    res.status(201).json(append);
  } catch (err) { next(err); }
});

// Seller reply
router.post('/:id/reply', authenticate, authorize('merchant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { reply: true, product: true } });
    if (!review) throw new NotFoundError();
    if (review.reply) throw new ConflictError('Already replied');
    const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
    if (!shop || shop.id !== review.product.shopId) throw new ForbiddenError();

    const { content } = req.body;
    const reply = await prisma.reviewReply.create({ data: { reviewId: review.id, sellerId: req.user!.userId, content } });
    res.status(201).json(reply);
  } catch (err) { next(err); }
});

function generateTags(content: string, rating: number): string[] {
  const tags: string[] = [];
  if (rating >= 4) tags.push('好评');
  if (content?.includes('质量')) tags.push('质量好');
  if (content?.includes('物流') || content?.includes('快递')) tags.push('物流快');
  if (content?.includes('性价比') || content?.includes('便宜') || content?.includes('划算')) tags.push('性价比高');
  if (content?.includes('包装')) tags.push('包装好');
  return tags;
}

export default router;
