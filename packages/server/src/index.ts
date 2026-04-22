import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import searchRoutes from './routes/search.js';
import cartRoutes from './routes/cart.js';
import addressRoutes from './routes/addresses.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import logisticsRoutes from './routes/logistics.js';
import reviewRoutes from './routes/reviews.js';
import chatRoutes from './routes/chat.js';
import promotionRoutes from './routes/promotions.js';
import userRoutes from './routes/user.js';
import sellerRoutes from './routes/seller.js';
import exchangeRoutes from './routes/exchanges.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(import.meta.dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`换换(HuanHuan) server running on port ${PORT}`);
  });
}

export default app;
