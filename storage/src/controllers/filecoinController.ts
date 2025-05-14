import { Request, Response } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { filecoinService } from '../services/filecoin.service';
import { checkContentExists } from '../ipfs/ipfsService';

/**
 * Archive content to Filecoin for long-term storage
 * @route POST /api/filecoin/archive
 */
export const archiveContent = asyncHandler(async (req: Request, res: Response) => {
  const { contentId, cid, size } = req.body;

  // Validate request
  if (!contentId || !cid) {
    throw createError('Content ID and CID are required', 400);
  }

  // Validate that content exists on IPFS
  const exists = await checkContentExists(cid);
  if (!exists) {
    throw createError('Content not found on IPFS', 404);
  }

  // Archive to Filecoin
  const result = await filecoinService.archiveContent(contentId, cid, size);

  res.status(200).json({
    message: 'Content archived to Filecoin successfully',
    result
  });
});

/**
 * Get all Filecoin deals
 * @route GET /api/filecoin/deals
 */
export const getAllDeals = asyncHandler(async (req: Request, res: Response) => {
  const deals = filecoinService.getAllDeals();

  res.status(200).json({
    message: 'Filecoin deals retrieved successfully',
    deals
  });
});

/**
 * Get a Filecoin deal by CID
 * @route GET /api/filecoin/deals/:cid
 */
export const getDealByCid = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;

  if (!cid) {
    throw createError('CID is required', 400);
  }

  const deal = filecoinService.getDealByCid(cid);
  if (!deal) {
    throw createError('Deal not found', 404);
  }

  res.status(200).json({
    message: 'Filecoin deal retrieved successfully',
    deal
  });
});

/**
 * Check if content is stored on Filecoin
 * @route GET /api/filecoin/check/:cid
 */
export const checkContentOnFilecoin = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.params;

  if (!cid) {
    throw createError('CID is required', 400);
  }

  const isStored = filecoinService.isStoredOnFilecoin(cid);

  res.status(200).json({
    message: 'Content status checked successfully',
    isStored
  });
});

/**
 * Trigger processing of scheduled deals
 * @route POST /api/filecoin/process-deals
 */
export const processScheduledDeals = asyncHandler(async (req: Request, res: Response) => {
  await filecoinService.processScheduledDeals();

  res.status(200).json({
    message: 'Scheduled deals processed successfully'
  });
});

/**
 * Retrieve content from Filecoin
 * @route POST /api/filecoin/retrieve
 */
export const retrieveContent = asyncHandler(async (req: Request, res: Response) => {
  const { cid } = req.body;

  if (!cid) {
    throw createError('CID is required', 400);
  }

  const result = await filecoinService.retrieveContent(cid);

  res.status(200).json({
    message: 'Content retrieval initiated successfully',
    result
  });
}); 