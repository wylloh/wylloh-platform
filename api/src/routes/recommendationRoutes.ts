import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authMiddleware as auth } from '../middleware/authMiddleware';

const router: Router = Router();

// Personalized recommendations (requires authentication)
router.get('/personalized', auth, RecommendationController.getPersonalizedRecommendations);

// Similar content recommendations (public, but enhances with auth)
router.get('/similar/:contentId', RecommendationController.getSimilarContent);

// Trending content (public)
router.get('/trending', RecommendationController.getTrendingContent);

// New releases (public)
router.get('/new-releases', RecommendationController.getNewReleases);

// Genre-based recommendations (public)
router.get('/genres/:genre', RecommendationController.getGenreRecommendations);

// Record content view for a user (requires authentication)
router.post('/record-view/:contentId', auth, RecommendationController.recordContentView);

export default router; 