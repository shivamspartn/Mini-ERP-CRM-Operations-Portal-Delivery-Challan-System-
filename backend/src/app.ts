import express, { Application } from 'express';
import cors from 'cors';

// Import Routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import Middlewares
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// 1. CORS Configuration (Must come BEFORE route definitions)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allows local development, deployed Vercel frontend, and tools like Postman
      callback(null, true);
    },
    credentials: true,
  })
);

// 2. Body Parser Middleware
app.use(express.json());

// 3. Application Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/analytics', analyticsRoutes);

// 4. Centralized Error Handling Middleware (Must stay at the bottom)
app.use(errorHandler);

export default app;