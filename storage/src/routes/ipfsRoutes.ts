import express, { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import multer from 'multer';
import {
  getContentByCid,
  pinContentToIPFS,
  unpinContent,
  getContentStatus,
  storeMetadata,
  getMetadata,
  initChunkedUpload,
  uploadChunkToIPFS,
  completeChunkedUpload,
  getUploadJobStatus
} from '../controllers/ipfsController.js';

// Note: Controllers will be implemented later
// This sets up the structure for routes

const router: Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for individual chunks
  }
});

/**
 * @route   GET /api/ipfs/:cid
 * @desc    Get content from IPFS by CID
 * @access  Private
 */
router.get('/:cid', authMiddleware, getContentByCid);

/**
 * @route   POST /api/ipfs/pin
 * @desc    Pin content to IPFS
 * @access  Private
 */
router.post('/pin', authMiddleware, pinContentToIPFS);

/**
 * @route   DELETE /api/ipfs/pin/:cid
 * @desc    Unpin content from IPFS
 * @access  Private
 */
router.delete('/pin/:cid', authMiddleware, unpinContent);

/**
 * @route   GET /api/ipfs/status/:cid
 * @desc    Check content status on IPFS
 * @access  Private
 */
router.get('/status/:cid', authMiddleware, getContentStatus);

/**
 * @route   POST /api/ipfs/metadata
 * @desc    Store metadata on IPFS
 * @access  Private
 */
router.post('/metadata', authMiddleware, storeMetadata);

/**
 * @route   GET /api/ipfs/metadata/:cid
 * @desc    Get metadata from IPFS
 * @access  Private
 */
router.get('/metadata/:cid', authMiddleware, getMetadata);

/**
 * @route   POST /api/ipfs/uploads/init
 * @desc    Initialize a chunked upload
 * @access  Private
 */
router.post('/uploads/init', authMiddleware, initChunkedUpload);

/**
 * @route   POST /api/ipfs/uploads/:uploadId/chunks/:chunkIndex
 * @desc    Upload a chunk
 * @access  Private
 */
router.post(
  '/uploads/:uploadId/chunks/:chunkIndex',
  authMiddleware,
  upload.single('chunk') as any,
  asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Set the file buffer as the request body for the controller
    req.body = req.file?.buffer;
    next();
  }),
  uploadChunkToIPFS
);

/**
 * @route   POST /api/ipfs/uploads/:uploadId/complete
 * @desc    Complete a chunked upload
 * @access  Private
 */
router.post('/uploads/:uploadId/complete', authMiddleware, completeChunkedUpload);

/**
 * @route   GET /api/ipfs/uploads/:uploadId/status
 * @desc    Get upload status
 * @access  Private
 */
router.get('/uploads/:uploadId/status', authMiddleware, getUploadJobStatus);

export default router;