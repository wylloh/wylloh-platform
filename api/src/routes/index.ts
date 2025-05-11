import express from 'express';
import userRoutes from './userRoutes';
import contentRoutes from './contentRoutes';
import authRoutes from './authRoutes';
import storageRoutes from './storageRoutes';
import libraryRoutes from './libraryRoutes';
import searchRoutes from './searchRoutes';
import blockchainRoutes from './blockchainRoutes';
import metadataRoutes from './metadataRoutes';

const router = express.Router();

router.use('/api/users', userRoutes);
router.use('/api/content', contentRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/storage', storageRoutes);
router.use('/api/libraries', libraryRoutes);
router.use('/api/search', searchRoutes);
router.use('/api/blockchain', blockchainRoutes);
router.use('/api/metadata', metadataRoutes);

export default router; 