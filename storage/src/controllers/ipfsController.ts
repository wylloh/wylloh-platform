import { Request, Response } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { 
  uploadToIPFS, 
  retrieveFromIPFS, 
  uploadMetadata, 
  pinContent, 
  checkContentExists,
  getGatewayUrl,
  createUploadJob,
  uploadChunk,
  completeUpload,
  getUploadStatus,
  getPinningInfo
} from '../ipfs/ipfsService';

/**
 * Get content from IPFS by CID
 * @route GET /api/ipfs/:cid
 */
export const getContentByCid = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;
  const { decrypt, encryptionKey } = req.query;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  try {
    // Check if content exists
    const exists = await checkContentExists(cid);
    if (!exists) {
      throw createError('Content not found on IPFS', 404);
    }

    // Get content from IPFS
    // For large files, we would stream the response rather than loading into memory
    const content = await retrieveFromIPFS(
      cid, 
      decrypt === 'true' ? encryptionKey as string : undefined
    );

    // For API usage, we return a gateway URL or small content
    // For actual content delivery, we would stream directly from IPFS
    const gatewayUrl = getGatewayUrl(cid);

    res.status(200).json({
      message: 'Content retrieved successfully',
      cid,
      size: content.length,
      gatewayUrl,
      // For demonstration, we'd normally use content-type based responses
      // and not include content directly in JSON for large files
      sampleContent: content.slice(0, 100).toString('base64')
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});

/**
 * Pin content to IPFS
 * @route POST /api/ipfs/pin
 */
export const pinContentToIPFS = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.body;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  try {
    // Check if content exists
    const exists = await checkContentExists(cid);
    if (!exists) {
      throw createError('Content not found on IPFS', 404);
    }

    // Pin content
    await pinContent(cid);

    // Get pinning info including external services
    const pinningInfo = await getPinningInfo(cid);

    res.status(200).json({
      message: 'Content pinned successfully',
      cid,
      pinningInfo
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});

/**
 * Unpin content from IPFS
 * @route DELETE /api/ipfs/pin/:cid
 */
export const unpinContent = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  try {
    // In a real implementation, we would call ipfs.pin.rm(cid)
    // For this placeholder, we'll just return success
    
    res.status(200).json({
      message: 'Content unpinned successfully',
      cid
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});

/**
 * Check content status on IPFS
 * @route GET /api/ipfs/status/:cid
 */
export const getContentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  try {
    // Check if content exists
    const exists = await checkContentExists(cid);
    if (!exists) {
      throw createError('Content not found on IPFS', 404);
    }

    // Get pinning information
    const pinningInfo = await getPinningInfo(cid);

    res.status(200).json({
      message: 'Content status retrieved successfully',
      cid,
      exists,
      pinningInfo,
      createdAt: pinningInfo.timestamp ? new Date(pinningInfo.timestamp).toISOString() : new Date().toISOString()
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});

/**
 * Store metadata on IPFS
 * @route POST /api/ipfs/metadata
 */
export const storeMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { metadata } = req.body;

  // Validate metadata
  if (!metadata || typeof metadata !== 'object') {
    throw createError('Valid metadata object is required', 400);
  }

  try {
    // Upload metadata to IPFS
    const cid = await uploadMetadata(metadata);

    res.status(200).json({
      message: 'Metadata stored successfully',
      cid,
      gatewayUrl: getGatewayUrl(cid)
    });
  } catch (error) {
    throw error;
  }
});

/**
 * Get metadata from IPFS
 * @route GET /api/ipfs/metadata/:cid
 */
export const getMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  try {
    // Check if content exists
    const exists = await checkContentExists(cid);
    if (!exists) {
      throw createError('Content not found on IPFS', 404);
    }

    // Get metadata from IPFS
    const content = await retrieveFromIPFS(cid);
    
    // Parse JSON metadata
    let metadata;
    try {
      metadata = JSON.parse(content.toString());
    } catch (err) {
      throw createError('Invalid metadata format', 400);
    }

    res.status(200).json({
      message: 'Metadata retrieved successfully',
      cid,
      metadata
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});

/**
 * Initialize a chunked upload
 * @route POST /api/ipfs/uploads/init
 */
export const initChunkedUpload = asyncHandler(async (req: Request, res: Response) => {
  const { filename, mimeType, totalChunks, totalSize } = req.body;

  // Validate request
  if (!filename) {
    throw createError('Filename is required', 400);
  }
  
  if (!mimeType) {
    throw createError('MIME type is required', 400);
  }
  
  if (!totalChunks || !Number.isInteger(totalChunks) || totalChunks <= 0) {
    throw createError('Valid total chunks count is required', 400);
  }
  
  if (!totalSize || !Number.isInteger(totalSize) || totalSize <= 0) {
    throw createError('Valid total size is required', 400);
  }

  try {
    // Create upload job
    const uploadId = createUploadJob(filename, mimeType, totalChunks, totalSize);

    res.status(201).json({
      message: 'Upload initialized successfully',
      uploadId,
      filename,
      totalChunks,
      totalSize
    });
  } catch (error: any) {
    throw createError(`Failed to initialize upload: ${error.message}`, 500);
  }
});

/**
 * Upload a chunk
 * @route POST /api/ipfs/uploads/:uploadId/chunks/:chunkIndex
 */
export const uploadChunkToIPFS = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId, chunkIndex } = req.params;
  const chunkData = req.body;

  // Validate upload ID
  if (!uploadId) {
    throw createError('Upload ID is required', 400);
  }

  // Validate chunk index
  const parsedChunkIndex = parseInt(chunkIndex, 10);
  if (isNaN(parsedChunkIndex) || parsedChunkIndex < 0) {
    throw createError('Valid chunk index is required', 400);
  }

  // Validate chunk data
  if (!chunkData || !Buffer.isBuffer(chunkData)) {
    throw createError('Valid chunk data is required', 400);
  }

  try {
    // Process chunk
    const result = await uploadChunk(uploadId, parsedChunkIndex, chunkData);

    // Get updated upload status
    const status = getUploadStatus(uploadId);

    res.status(200).json({
      message: 'Chunk uploaded successfully',
      uploadId,
      chunkIndex: parsedChunkIndex,
      receivedChunks: status.receivedChunks,
      totalChunks: status.totalChunks,
      progress: status.progress
    });
  } catch (error: any) {
    throw createError(`Failed to upload chunk: ${error.message}`, 500);
  }
});

/**
 * Complete chunked upload
 * @route POST /api/ipfs/uploads/:uploadId/complete
 */
export const completeChunkedUpload = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.params;
  const { encrypt, encryptionKey } = req.body;

  // Validate upload ID
  if (!uploadId) {
    throw createError('Upload ID is required', 400);
  }

  // Validate encryption key if encryption is requested
  if (encrypt && !encryptionKey) {
    throw createError('Encryption key is required when encryption is enabled', 400);
  }

  try {
    // Complete upload and get CID
    const result = await completeUpload(uploadId, encrypt ? encryptionKey : undefined);

    res.status(200).json({
      message: 'Upload completed successfully',
      uploadId,
      cid: result.cid,
      size: result.size,
      path: result.path,
      gatewayUrl: getGatewayUrl(result.cid),
      encrypted: !!encrypt
    });
  } catch (error: any) {
    throw createError(`Failed to complete upload: ${error.message}`, 500);
  }
});

/**
 * Get upload status
 * @route GET /api/ipfs/uploads/:uploadId/status
 */
export const getUploadJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  // Validate upload ID
  if (!uploadId) {
    throw createError('Upload ID is required', 400);
  }

  try {
    // Get upload status
    const status = getUploadStatus(uploadId);

    res.status(200).json({
      message: 'Upload status retrieved successfully',
      ...status
    });
  } catch (error: any) {
    throw createError(`Failed to get upload status: ${error.message}`, 500);
  }
});