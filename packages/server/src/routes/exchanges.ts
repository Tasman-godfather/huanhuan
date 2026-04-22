import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

const SERVICE_FEE_RATE = 0.05;

// Create exchange request
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetProductId, targetSkuId, targetQuantity = 1, offeredItems, remark } = req.body;

    if (!offeredItems || !Array.isArray(offeredItems) || offeredItems.length === 0) {
      throw new ValidationError('请选择要交换的商品');
    }

    const targetSku = await prisma.sku.findUnique({
      where: { id: targetSkuId },
      include: { product: { include: { shop: true, images: { where: { type: 'main' }, take: 1 } } } },
    });
    if (!targetSku || targetSku.product.id !== targetProductId) throw new NotFoundError('目标商品不存在');
    if (targetSku.stock < targetQuantity) throw new ValidationError('目标商品库存不足');
    if (targetSku.product.shop.sellerId === req.user!.userId) throw new ValidationError('不能与自己的商品交换');

    const targetValue = targetSku.price * targetQuantity;
    const receiverId = targetSku.product.shop.sellerId;

    let offeredValue = 0;
    const enrichedItems: any[] = [];

    for (const item of offeredItems) {
      const sku = await prisma.sku.findUnique({
        where: { id: item.skuId },
        include: { product: { include: { shop: true, images: { where: { type: 'main' }, take: 1 } } } },
      });
      if (!sku || sku.product.id !== item.productId) throw new NotFoundError(`商品 ${item.productId} 不存在`);
      if (sku.product.shop.sellerId !== req.user!.userId) throw new ForbiddenError('只能用自己的商品交换');
      if (sku.stock < item.quantity) throw new ValidationError(`商品 "${sku.product.title}" 库存不足`);

      offeredValue += sku.price * item.quantity;
      enrichedItems.push({
        productId: item.productId,
        skuId: item.skuId,
        quantity: item.quantity,
        title: sku.product.title,
        image: sku.product.images[0]?.url || sku.image,
        price: sku.price,
        specs: sku.specs,
      });
    }

    const initiatorFee = Math.ceil(offeredValue * SERVICE_FEE_RATE);
    const receiverFee = Math.ceil(targetValue * SERVICE_FEE_RATE);

    const exchange = await prisma.exchangeRequest.create({
      data: {
        initiatorId: req.user!.userId,
        receiverId,
        targetProductId,
        targetSkuId,
        targetQuantity,
        targetValue,
        offeredItems: enrichedItems,
        offeredValue,
        status: 'pending',
        serviceFeeRate: SERVICE_FEE_RATE,
        initiatorFee,
        receiverFee,
        remark,
      },
    });

    res.status(201).json(exchange);
  } catch (err) { next(err); }
});

// List exchanges
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role = 'all', status, page = '1', pageSize = '20' } = req.query;
    const userId = req.user!.userId;

    const where: any = {};
    if (role === 'initiator') where.initiatorId = userId;
    else if (role === 'receiver') where.receiverId = userId;
    else where.OR = [{ initiatorId: userId }, { receiverId: userId }];

    if (status) where.status = String(status);

    const [items, total] = await Promise.all([
      prisma.exchangeRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          initiator: { select: { id: true, nickname: true, avatar: true, companyName: true } },
          receiver: { select: { id: true, nickname: true, avatar: true, companyName: true } },
        },
      }),
      prisma.exchangeRequest.count({ where }),
    ]);

    // Enrich with target product info
    const enriched = await Promise.all(items.map(async (ex) => {
      const targetProduct = await prisma.product.findUnique({
        where: { id: ex.targetProductId },
        select: { id: true, title: true, images: { where: { type: 'main' }, take: 1 } },
      });
      const targetSku = await prisma.sku.findUnique({
        where: { id: ex.targetSkuId },
        select: { id: true, price: true, specs: true },
      });
      return { ...ex, targetProduct, targetSku };
    }));

    res.json({ items: enriched, total });
  } catch (err) { next(err); }
});

// Get exchange detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exchange = await prisma.exchangeRequest.findUnique({
      where: { id: req.params.id },
      include: {
        initiator: { select: { id: true, nickname: true, avatar: true, companyName: true, huanbeiBalance: true } },
        receiver: { select: { id: true, nickname: true, avatar: true, companyName: true, huanbeiBalance: true } },
      },
    });
    if (!exchange) throw new NotFoundError('交换请求不存在');
    if (exchange.initiatorId !== req.user!.userId && exchange.receiverId !== req.user!.userId) {
      throw new ForbiddenError();
    }

    const targetProduct = await prisma.product.findUnique({
      where: { id: exchange.targetProductId },
      select: { id: true, title: true, images: { where: { type: 'main' }, take: 1 } },
    });
    const targetSku = await prisma.sku.findUnique({
      where: { id: exchange.targetSkuId },
      select: { id: true, price: true, specs: true, image: true },
    });

    res.json({ ...exchange, targetProduct, targetSku });
  } catch (err) { next(err); }
});

// Receiver accepts exchange
router.patch('/:id/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exchange = await prisma.exchangeRequest.findUnique({ where: { id: req.params.id } });
    if (!exchange) throw new NotFoundError();
    if (exchange.receiverId !== req.user!.userId) throw new ForbiddenError('只有接收方可以接受交换');
    if (!['pending'].includes(exchange.status)) throw new ValidationError('当前状态不可接受');

    const initiatorFee = Math.ceil(exchange.offeredValue * SERVICE_FEE_RATE);
    const receiverFee = Math.ceil(exchange.targetValue * SERVICE_FEE_RATE);

    const [initiator, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: exchange.initiatorId } }),
      prisma.user.findUnique({ where: { id: exchange.receiverId } }),
    ]);

    if (!initiator || initiator.huanbeiBalance < initiatorFee) {
      throw new ValidationError(`发起方换贝余额不足，需要 ${initiatorFee} 换贝手续费`);
    }
    if (!receiver || receiver.huanbeiBalance < receiverFee) {
      throw new ValidationError(`您的换贝余额不足，需要 ${receiverFee} 换贝手续费`);
    }

    // Verify stock for all items
    const offeredItems = exchange.offeredItems as any[];
    for (const item of offeredItems) {
      const sku = await prisma.sku.findUnique({ where: { id: item.skuId } });
      if (!sku || sku.stock < item.quantity) throw new ValidationError(`商品 "${item.title}" 库存不足`);
    }
    const targetSku = await prisma.sku.findUnique({ where: { id: exchange.targetSkuId } });
    if (!targetSku || targetSku.stock < exchange.targetQuantity) throw new ValidationError('目标商品库存不足');

    // Deduct fees from both sides
    await prisma.user.update({ where: { id: exchange.initiatorId }, data: { huanbeiBalance: { decrement: initiatorFee } } });
    await prisma.user.update({ where: { id: exchange.receiverId }, data: { huanbeiBalance: { decrement: receiverFee } } });

    // Record fee deductions
    await prisma.huanbeiRecord.createMany({
      data: [
        { userId: exchange.initiatorId, amount: -initiatorFee, type: 'exchange_fee', remark: `易货手续费(5%) 交换#${exchange.id.slice(0, 8)}` },
        { userId: exchange.receiverId, amount: -receiverFee, type: 'exchange_fee', remark: `易货手续费(5%) 交换#${exchange.id.slice(0, 8)}` },
      ],
    });

    // Update stock: deduct offered items from initiator, target items from receiver
    for (const item of offeredItems) {
      await prisma.sku.update({ where: { id: item.skuId }, data: { stock: { decrement: item.quantity } } });
      await prisma.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
    }
    await prisma.sku.update({ where: { id: exchange.targetSkuId }, data: { stock: { decrement: exchange.targetQuantity } } });
    await prisma.product.update({ where: { id: exchange.targetProductId }, data: { salesCount: { increment: exchange.targetQuantity } } });

    const updated = await prisma.exchangeRequest.update({
      where: { id: req.params.id },
      data: { status: 'completed', initiatorFee, receiverFee },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// Receiver rejects exchange
router.patch('/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exchange = await prisma.exchangeRequest.findUnique({ where: { id: req.params.id } });
    if (!exchange) throw new NotFoundError();
    if (exchange.receiverId !== req.user!.userId) throw new ForbiddenError('只有接收方可以拒绝');
    if (!['pending', 'negotiating'].includes(exchange.status)) throw new ValidationError('当前状态不可拒绝');

    const updated = await prisma.exchangeRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected' },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Receiver sends counter-offer
router.patch('/:id/counter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestedValue, message } = req.body;
    if (!requestedValue || requestedValue <= 0) throw new ValidationError('请输入有效的要求换贝价值');

    const exchange = await prisma.exchangeRequest.findUnique({ where: { id: req.params.id } });
    if (!exchange) throw new NotFoundError();
    if (exchange.receiverId !== req.user!.userId) throw new ForbiddenError('只有接收方可以还价');
    if (!['pending'].includes(exchange.status)) throw new ValidationError('当前状态不可还价');

    const updated = await prisma.exchangeRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'negotiating',
        counterOffer: { requestedValue, message: message || '' },
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Initiator confirms (re-selects items after counter-offer)
router.patch('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offeredItems } = req.body;
    if (!offeredItems || !Array.isArray(offeredItems) || offeredItems.length === 0) {
      throw new ValidationError('请选择要交换的商品');
    }

    const exchange = await prisma.exchangeRequest.findUnique({ where: { id: req.params.id } });
    if (!exchange) throw new NotFoundError();
    if (exchange.initiatorId !== req.user!.userId) throw new ForbiddenError('只有发起方可以确认');
    if (exchange.status !== 'negotiating') throw new ValidationError('当前状态不可确认');

    let offeredValue = 0;
    const enrichedItems: any[] = [];

    for (const item of offeredItems) {
      const sku = await prisma.sku.findUnique({
        where: { id: item.skuId },
        include: { product: { include: { shop: true, images: { where: { type: 'main' }, take: 1 } } } },
      });
      if (!sku || sku.product.id !== item.productId) throw new NotFoundError(`商品不存在`);
      if (sku.product.shop.sellerId !== req.user!.userId) throw new ForbiddenError('只能用自己的商品交换');
      if (sku.stock < item.quantity) throw new ValidationError(`商品 "${sku.product.title}" 库存不足`);

      offeredValue += sku.price * item.quantity;
      enrichedItems.push({
        productId: item.productId,
        skuId: item.skuId,
        quantity: item.quantity,
        title: sku.product.title,
        image: sku.product.images[0]?.url || sku.image,
        price: sku.price,
        specs: sku.specs,
      });
    }

    const initiatorFee = Math.ceil(offeredValue * SERVICE_FEE_RATE);
    const receiverFee = Math.ceil(exchange.targetValue * SERVICE_FEE_RATE);

    const updated = await prisma.exchangeRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'pending',
        offeredItems: enrichedItems,
        offeredValue,
        initiatorFee,
        receiverFee,
        counterOffer: null,
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Initiator cancels
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exchange = await prisma.exchangeRequest.findUnique({ where: { id: req.params.id } });
    if (!exchange) throw new NotFoundError();
    if (exchange.initiatorId !== req.user!.userId) throw new ForbiddenError('只有发起方可以取消');
    if (['completed', 'cancelled', 'rejected'].includes(exchange.status)) {
      throw new ValidationError('当前状态不可取消');
    }

    const updated = await prisma.exchangeRequest.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
