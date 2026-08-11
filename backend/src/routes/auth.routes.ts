import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

// Public: Login
router.post('/login', validateRequest(loginSchema), login);

// Protected: Get current user profile
router.get('/me', authenticateJWT, getCurrentUser);

export default router;