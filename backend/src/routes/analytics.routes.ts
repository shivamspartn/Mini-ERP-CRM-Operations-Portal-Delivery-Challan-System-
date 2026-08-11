import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/metrics', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getDashboardMetrics);

export default router;