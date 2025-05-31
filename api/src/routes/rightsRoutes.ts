import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  verifyRights,
  detectConflicts,
  generateComplianceReport,
  createCustomRights,
  runAutomatedWorkflow,
  getRightsProfile,
  recordRightsConsumption,
  getRightsBundles,
  getRightsHealth
} from '../controllers/rightsController';

const router: ExpressRouter = Router();

// Health check
router.get('/health', getRightsHealth);

// Rights verification
router.post('/verify', verifyRights);

// Rights profile and information
router.get('/profile/:tokenContract/:tokenId', getRightsProfile);
router.get('/bundles', getRightsBundles);

// Conflict detection and compliance
router.get('/conflicts/:tokenContract/:tokenId', detectConflicts);
router.get('/compliance/:tokenContract/:tokenId', generateComplianceReport);

// Custom rights management
router.post('/custom', createCustomRights);

// Automated workflows
router.post('/workflow', runAutomatedWorkflow);

// Rights consumption tracking
router.post('/consume', recordRightsConsumption);

export default router; 