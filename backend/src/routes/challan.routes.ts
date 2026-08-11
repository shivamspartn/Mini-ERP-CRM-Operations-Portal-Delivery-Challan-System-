import { Router } from 'express';
import { getChallans, createChallan, updateChallanStatus } from '../controllers/challan.controller';
import { generateChallanPDF } from '../controllers/pdf.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createChallanSchema, updateChallanStatusSchema } from '../schemas/challan.schema';

const router = Router();

// Apply JWT Authentication to all challan routes
router.use(authenticateJWT);

// GET /api/challans - Fetch list of challans
router.get(
  '/', 
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), 
  getChallans
);

// POST /api/challans - Create a new draft challan
router.post(
  '/', 
  authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE'), 
  validateRequest(createChallanSchema), 
  createChallan
);

// PATCH /api/challans/:id/status - Confirm or Cancel a challan
router.patch(
  '/:id/status', 
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES'), 
  validateRequest(updateChallanStatusSchema), 
  updateChallanStatus
);

// GET /api/challans/:id/pdf - Stream printable PDF challan download
router.get(
  '/:id/pdf', 
  authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), 
  generateChallanPDF
);

export default router;