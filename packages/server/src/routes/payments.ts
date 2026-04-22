import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

const SERVICE_FEE_RATE = 0.05;

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== req.user!.userId) throw new NotFoundError();
    if (order.status !== 'pending_confirm') throw new ValidationError('Order not payable');

    const serviceFee = Math.ceil(order.totalAmount * SERVICE_FEE_RATE);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || user.huanbeiBalance < serviceFee) {
      throw new ValidationError(`换贝余额不足，需要 ${serviceFee} 换贝手续费，当前余额 ${user?.huanbeiBalance || 0}`);
    }

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { huanbeiBalance: { decrement: serviceFee } },
    });

    await prisma.huanbeiRecord.create({
      data: {
        userId: req.user!.userId,
        amount: -serviceFee,
        type: 'service_fee',
        remark: `交换手续费(5%) 订单${order.orderNo}`,
        orderId: order.id,
      },
    });

    const payment = await prisma.payment.create({
      data: { orderId, method: 'huanbei', amount: serviceFee, status: 'paid', paidAt: new Date(), transactionId: `HB${Date.now()}` },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'pending_shipment', paidAt: new Date(), serviceFee },
    });

    res.status(201).json(payment);
  } catch (err) { next(err); }
});

router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new NotFoundError();
    res.json({ status: payment.status });
  } catch (err) { next(err); }
});

router.post('/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!payment) throw new NotFoundError();

    await prisma.user.update({
      where: { id: payment.order.buyerId },
      data: { huanbeiBalance: { increment: payment.amount } },
    });

    await prisma.huanbeiRecord.create({
      data: {
        userId: payment.order.buyerId,
        amount: payment.amount,
        type: 'refund',
        remark: `交换取消退还手续费 订单${payment.order.orderNo}`,
        orderId: payment.orderId,
      },
    });

    await prisma.payment.update({ where: { id: req.params.id }, data: { status: 'refunded', refundedAt: new Date() } });
    await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'cancelled' } });
    res.json({ message: 'Refunded' });
  } catch (err) { next(err); }
});

export default router;
