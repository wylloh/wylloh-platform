import { Request, Response } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { 
  uploadToIPFS, 
  retrieveFromIPFS, 
  uploadMetadata, 
  pinContent, 
  checkContentExists,
  getGatewayUrl
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
  } catch (error) {
    if (error.message.includes('not found')) {
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

    res.status(200).json({
      message: 'Content pinned successfully',
      cid
    });
  } catch (error) {
    if (error.message.includes('not found')) {
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
  } catch (error) {
    if (error.message.includes('not found')) {
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

    // In a real implementation, we would get detailed status info
    // For this placeholder, we'll return basic info

    res.status(200).json({
      message: 'Content status retrieved successfully',
      cid,
      exists,
      pinned: true, // Placeholder
      size: 1024, // Placeholder
      createdAt: new Date().toISOString() // Placeholder
    });
  } catch (error) {
    if (error.message.includes('not found')) {
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
      throw createError('Metadata not found on IPFS', 404);
    }

    // Get metadata from IPFS
    const contentBuffer = await retrieveFromIPFS(cid);
    const metadata = JSON.parse(contentBuffer.toString());

    res.status(200).json({
      message: 'Metadata retrieved successfully',
      cid,
      metadata
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw createError('Metadata not found on IPFS', 404);
    } else if (error instanceof SyntaxError) {
      throw createError('Invalid metadata format', 400);
    }
    throw error;
  }
});

/**
 * Request additional replication of content
 * @route POST /api/ipfs/replicate/:cid
 */
export const replicateContent = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;
  const { replicationFactor } = req.body;

  // Validate CID
  if (!cid) {
    throw createError('CID is required', 400);
  }

  // Validate replication factor
  const factor = replicationFactor ? parseInt(replicationFactor as string) : 3;
  if (isNaN(factor) || factor < 1 || factor > 10) {
    throw createError('Replication factor must be between 1 and 10', 400);
  }

  try {
    // Check if content exists
    const exists = await checkContentExists(cid);
    if (!exists) {
      throw createError('Content not found on IPFS', 404);
    }

    // In a real implementation, we would request additional replication
    // For this placeholder, we'll just return success

    res.status(200).json({
      message: 'Replication requested successfully',
      cid,
      replicationFactor: factor,
      status: 'processing'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      throw createError('Content not found on IPFS', 404);
    }
    throw error;
  }
});