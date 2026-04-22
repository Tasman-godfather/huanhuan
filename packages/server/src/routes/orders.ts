import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  return 'HH' + ts + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const SERVICE_FEE_RATE = 0.05;

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { addressId, cartItemIds, remark } = req.body;
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== req.user!.userId) throw new NotFoundError('Address not found');

    const cartItems = await prisma.cartItem.findMany({
      where: { id: { in: cartItemIds }, userId: req.user!.userId },
      include: { sku: { include: { product: { include: { shop: true, images: { where: { type: 'main' }, take: 1 } } } } } },
    });
    if (cartItems.length === 0) throw new ValidationError('No items selected');

    const outOfStock = cartItems.filter((ci) => ci.quantity > ci.sku.stock);
    if (outOfStock.length > 0) {
      throw new AppError('STOCK_INSUFFICIENT', 'Some items are out of stock', 400,
        outOfStock.map((ci) => ({ skuId: ci.skuId, requested: ci.quantity, available: ci.sku.stock })));
    }

    const shopGroups: Record<string, typeof cartItems> = {};
    for (const ci of cartItems) {
      const sid = ci.sku.product.shopId;
      if (!shopGroups[sid]) shopGroups[sid] = [];
      shopGroups[sid].push(ci);
    }

    const orders = [];
    for (const [shopId, items] of Object.entries(shopGroups)) {
      const totalAmount = items.reduce((s, ci) => s + ci.sku.price * ci.quantity, 0);
      const shippingFee = totalAmount >= 99 ? 0 : 10;
      const serviceFee = Math.ceil(totalAmount * SERVICE_FEE_RATE);
      const payableAmount = totalAmount + shippingFee;

      const order = await prisma.order.create({
        data: {
          orderNo: generateOrderNo(), buyerId: req.user!.userId, shopId,
          addressSnapshot: { name: address.name, phone: address.phone, province: address.province, city: address.city, district: address.district, detail: address.detail },
          totalAmount, shippingFee, discountAmount: 0, payableAmount, serviceFee, remark,
          orderItems: {
            create: items.map((ci) => ({
              skuId: ci.skuId, price: ci.sku.price, quantity: ci.quantity,
              productSnapshot: { title: ci.sku.product.title, image: ci.sku.product.images[0]?.url, specs: ci.sku.specs },
            })),
          },
        },
        include: { orderItems: true },
      });

      for (const ci of items) {
        await prisma.sku.update({ where: { id: ci.skuId }, data: { stock: { decrement: ci.quantity } } });
        await prisma.product.update({ where: { id: ci.sku.productId }, data: { salesCount: { increment: ci.quantity } } });
      }
      orders.push(order);
    }

    await prisma.cartItem.deleteMany({ where: { id: { in: cartItemIds } } });
    res.status(201).json(orders);
  } catch (err) { next(err); }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', pageSize = '10' } = req.query;
    const where: any = { buyerId: req.user!.userId };
    if (status) where.status = String(status);

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize),
        include: { orderItems: true, shop: { select: { id: true, name: true } } },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ items, total });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: true, payment: true, logistics: true, shop: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.buyerId !== req.user!.userId) {
      const shop = await prisma.shop.findUnique({ where: { sellerId: req.user!.userId } });
      if (!shop || shop.id !== order.shopId) throw new ForbiddenError();
    }
    res.json(order);
  } catch (err) { next(err); }
});

router.patch('/:id/ship', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { carrier, trackingNo } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.status !== 'pending_shipment') throw new ValidationError('Cannot ship this order');

    const autoConfirmAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'shipped', shippedAt: new Date(), autoConfirmAt },
    });
    await prisma.logistics.create({
      data: { orderId: order.id, carrier, trackingNo, nodes: [{ time: new Date().toISOString(), location: '商家已发货', description: `快递公司: ${carrier}, 单号: ${trackingNo}` }] },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

router.patch('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.buyerId !== req.user!.userId) throw new NotFoundError();
    if (order.status !== 'shipped') throw new ValidationError('Cannot confirm this order');

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'completed', completedAt: new Date() },
    });
    await prisma.payment.updateMany({ where: { orderId: order.id, status: 'paid' }, data: { status: 'paid' } });
    res.json(updated);
  } catch (err) { next(err); }
});

router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.buyerId !== req.user!.userId) throw new NotFoundError();
    if (!['pending_confirm'].includes(order.status)) throw new ValidationError('Cannot cancel this order');

    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    if (order.serviceFee > 0) {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { huanbeiBalance: { increment: order.serviceFee } },
      });
      await prisma.huanbeiRecord.create({
        data: { userId: req.user!.userId, amount: order.serviceFee, type: 'refund', remark: `交换取消退还手续费 订单${order.orderNo}`, orderId: order.id },
      });
    }
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
