import express, { Application } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes'; // 👈 Added
import challanRoutes from './routes/challan.routes'; // 👈 Added
import analyticsRoutes from './routes/analytics.routes';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes); // 👈 Added
app.use('/api/challans', challanRoutes);
app.use('/api/analytics', analyticsRoutes);


// Centralized Error Middleware
app.use(errorHandler);
// Allow all origins during setup, or specify your frontend domain once deployed
app.use(cors({
  origin: true, 
  credentials: true
}));

export default app;