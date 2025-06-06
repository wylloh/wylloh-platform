import express from 'express';
import type { Router as ExpressRouter } from 'express';
import userRoutes from './userRoutes';
import contentRoutes from './contentRoutes';
import metadataRoutes from './metadataRoutes';
import royaltyRoutes from './royaltyRoutes';
import rightsRoutes from './rightsRoutes';

const router: ExpressRouter = express.Router();

router.use('/api/users', userRoutes);
router.use('/api/content', contentRoutes);
router.use('/api/metadata', metadataRoutes);
router.use('/api/royalty', royaltyRoutes);
router.use('/api/rights', rightsRoutes);

export default router; 