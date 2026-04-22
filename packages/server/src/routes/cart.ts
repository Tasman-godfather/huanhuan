import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

// Get cart (grouped by shop)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        sku: {
          include: {
            product: {
              include: {
                shop: { select: { id: true, name: true } },
                images: { where: { type: 'main' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by shop
    const grouped: Record<string, any> = {};
    for (const item of items) {
      const shopId = item.sku.product.shop.id;
      if (!grouped[shopId]) {
        grouped[shopId] = { shop: item.sku.product.shop, items: [] };
      }
      grouped[shopId].items.push({
        id: item.id, skuId: item.skuId, quantity: item.quantity, selected: item.selected,
        sku: { id: item.sku.id, specs: item.sku.specs, price: item.sku.price, originalPrice: item.sku.originalPrice, stock: item.sku.stock, image: item.sku.image },
        product: { id: item.sku.product.id, title: item.sku.product.title, image: item.sku.product.images[0]?.url },
      });
    }
    res.json(Object.values(grouped));
  } catch (err) { next(err); }
});

// Add item
router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skuId, quantity = 1 } = req.body;
    const sku = await prisma.sku.findUnique({ where: { id: skuId } });
    if (!sku) throw new NotFoundError('SKU not found');
    if (quantity > sku.stock) throw new ValidationError('Insufficient stock');

    const existing = await prisma.cartItem.findUnique({ where: { userId_skuId: { userId: req.user!.userId, skuId } } });
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, sku.stock);
      const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
      res.json(updated);
    } else {
      const item = await prisma.cartItem.create({ data: { userId: req.user!.userId, skuId, quantity } });
      res.status(201).json(item);
    }
  } catch (err) { next(err); }
});

// Update quantity
router.put('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, selected } = req.body;
    const item = await prisma.cartItem.findUnique({ where: { id: req.params.id }, include: { sku: true } });
    if (!item || item.userId !== req.user!.userId) throw new NotFoundError('Cart item not found');

    const data: any = {};
    if (quantity !== undefined) {
      if (quantity < 1 || quantity > item.sku.stock) throw new ValidationError(`Quantity must be 1-${item.sku.stock}`);
      data.quantity = quantity;
    }
    if (selected !== undefined) data.selected = selected;

    const updated = await prisma.cartItem.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete item
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.userId !== req.user!.userId) throw new NotFoundError('Cart item not found');
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// Select all / deselect all
router.patch('/select-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { selected } = req.body;
    await prisma.cartItem.updateMany({ where: { userId: req.user!.userId }, data: { selected } });
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
});

export default router;
