import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

// List conversations
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        buyer: { select: { id: true, nickname: true, avatar: true } },
        seller: { select: { id: true, nickname: true, avatar: true } },
        shop: { select: { id: true, name: true } },
      },
    });
    res.json(conversations);
  } catch (err) { next(err); }
});

// Get messages
router.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', pageSize = '50' } = req.query;
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
      include: { sender: { select: { id: true, nickname: true, avatar: true } } },
    });
    res.json(messages);
  } catch (err) { next(err); }
});

// Send message (REST fallback)
router.post('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'text', content, fileName, fileSize } = req.body;
    if (type === 'file' || type === 'image') {
      if (fileSize && fileSize > 10 * 1024 * 1024) throw new ValidationError('File size exceeds 10MB');
    }
    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) throw new NotFoundError();

    const msg = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.user!.userId, type, content, fileName, fileSize },
    });
    // Update conversation
    const isbuyer = conv.buyerId === req.user!.userId;
    await prisma.conversation.update({
      where: { id: req.params.id },
      data: {
        lastMessageAt: new Date(),
        ...(isbuyer ? { unreadCountSeller: { increment: 1 } } : { unreadCountBuyer: { increment: 1 } }),
      },
    });
    res.status(201).json(msg);
  } catch (err) { next(err); }
});

// Create or get conversation
router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.body;
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundError('Shop not found');

    let conv = await prisma.conversation.findUnique({
      where: { buyerId_sellerId_shopId: { buyerId: req.user!.userId, sellerId: shop.sellerId, shopId } },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { buyerId: req.user!.userId, sellerId: shop.sellerId, shopId },
      });
    }
    res.json(conv);
  } catch (err) { next(err); }
});

export default router;
