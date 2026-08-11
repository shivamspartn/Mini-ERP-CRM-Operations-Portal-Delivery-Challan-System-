import { Router } from 'express';
import { getCustomers, createCustomer, addFollowUp } from '../controllers/customer.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createCustomerSchema, addFollowUpSchema } from '../schemas/customer.schema';

const router = Router();

router.use(authenticateJWT);

// Accessible by ADMIN and SALES roles
router.get('/', authorizeRoles('ADMIN', 'SALES'), getCustomers);
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateRequest(createCustomerSchema), createCustomer);
router.post('/:id/follow-up', authorizeRoles('ADMIN', 'SALES'), validateRequest(addFollowUpSchema), addFollowUp);

export default router;