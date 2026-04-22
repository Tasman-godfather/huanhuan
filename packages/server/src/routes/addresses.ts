import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../lib/errors.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json(addresses);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, province, city, district, detail, isDefault } = req.body;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    }
    const address = await prisma.address.create({
      data: { userId: req.user!.userId, name, phone, province, city, district, detail, isDefault: isDefault || false },
    });
    res.status(201).json(address);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addr = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!addr || addr.userId !== req.user!.userId) throw new NotFoundError('Address not found');
    const { name, phone, province, city, district, detail, isDefault } = req.body;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    }
    const updated = await prisma.address.update({ where: { id: req.params.id }, data: { name, phone, province, city, district, detail, isDefault } });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addr = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!addr || addr.userId !== req.user!.userId) throw new NotFoundError('Address not found');
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
