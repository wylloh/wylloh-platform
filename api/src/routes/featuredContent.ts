import { Router } from 'express';
import { FeaturedContentController } from '../controllers/featuredContentController';
import { isAdmin } from '../middleware/authMiddleware';

const router: Router = Router();

// Public routes
router.get('/', FeaturedContentController.getActiveFeaturedContent);
router.get('/:id', FeaturedContentController.getFeaturedContentById);

// Admin routes
router.post('/', isAdmin, FeaturedContentController.addFeaturedContent);
router.put('/:id', isAdmin, FeaturedContentController.updateFeaturedContent);
router.delete('/:id', isAdmin, FeaturedContentController.deleteFeaturedContent);

export default router; 