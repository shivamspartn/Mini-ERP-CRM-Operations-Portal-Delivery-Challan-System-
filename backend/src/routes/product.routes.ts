import { Router } from 'express';
import { getProducts, createProduct, recordStockMovement } from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProductSchema, stockMovementSchema } from '../schemas/product.schema';

const router = Router();

router.use(authenticateJWT);

// All roles can view inventory
router.get('/', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getProducts);

// Admin and Warehouse can add items or modify stock
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), validateRequest(createProductSchema), createProduct);
router.post('/:id/stock', authorizeRoles('ADMIN', 'WAREHOUSE'), validateRequest(stockMovementSchema), recordStockMovement);

export default router;