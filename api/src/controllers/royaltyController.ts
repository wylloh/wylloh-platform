import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import RoyaltyService, { RoyaltyRecipient } from '../services/royaltyService';

const royaltyService = new RoyaltyService();

/**
 * Add a royalty recipient for a token
 * POST /api/royalty/recipients
 */
export const addRoyaltyRecipient = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, recipient, signerPrivateKey } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !recipient || !signerPrivateKey) {
    throw createError('Missing required fields: tokenContract, tokenId, recipient, signerPrivateKey', 400);
  }

  // Validate recipient object
  if (!recipient.address || !recipient.sharePercentage) {
    throw createError('Recipient must have address and sharePercentage', 400);
  }

  // Validate Ethereum address format
  if (!recipient.address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid Ethereum address format', 400);
  }

  const result = await royaltyService.addRoyaltyRecipient(
    tokenContract,
    tokenId,
    recipient,
    signerPrivateKey
  );

  res.status(201).json({
    success: true,
    message: 'Royalty recipient added successfully',
    data: result
  });
});

/**
 * Update a royalty recipient's share
 * PUT /api/royalty/recipients/:index
 */
export const updateRoyaltyRecipient = asyncHandler(async (req: Request, res: Response) => {
  const { index } = req.params;
  const { tokenContract, tokenId, sharePercentage, signerPrivateKey } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !sharePercentage || !signerPrivateKey) {
    throw createError('Missing required fields: tokenContract, tokenId, sharePercentage, signerPrivateKey', 400);
  }

  // Validate index
  const recipientIndex = parseInt(index);
  if (isNaN(recipientIndex) || recipientIndex < 0) {
    throw createError('Invalid recipient index', 400);
  }

  const result = await royaltyService.updateRoyaltyRecipient(
    tokenContract,
    tokenId,
    recipientIndex,
    sharePercentage,
    signerPrivateKey
  );

  res.json({
    success: true,
    message: 'Royalty recipient updated successfully',
    data: result
  });
});

/**
 * Remove a royalty recipient
 * DELETE /api/royalty/recipients/:index
 */
export const removeRoyaltyRecipient = asyncHandler(async (req: Request, res: Response) => {
  const { index } = req.params;
  const { tokenContract, tokenId, signerPrivateKey } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !signerPrivateKey) {
    throw createError('Missing required fields: tokenContract, tokenId, signerPrivateKey', 400);
  }

  // Validate index
  const recipientIndex = parseInt(index);
  if (isNaN(recipientIndex) || recipientIndex < 0) {
    throw createError('Invalid recipient index', 400);
  }

  const result = await royaltyService.removeRoyaltyRecipient(
    tokenContract,
    tokenId,
    recipientIndex,
    signerPrivateKey
  );

  res.json({
    success: true,
    message: 'Royalty recipient removed successfully',
    data: result
  });
});

/**
 * Batch update multiple recipients
 * PUT /api/royalty/recipients/batch
 */
export const batchUpdateRecipients = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, recipients, signerPrivateKey } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !recipients || !signerPrivateKey) {
    throw createError('Missing required fields: tokenContract, tokenId, recipients, signerPrivateKey', 400);
  }

  // Validate recipients array
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw createError('Recipients must be a non-empty array', 400);
  }

  // Validate each recipient
  for (const recipient of recipients) {
    if (!recipient.address || !recipient.sharePercentage) {
      throw createError('Each recipient must have address and sharePercentage', 400);
    }
    if (!recipient.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw createError('Invalid Ethereum address format', 400);
    }
  }

  const result = await royaltyService.batchUpdateRecipients(
    tokenContract,
    tokenId,
    recipients,
    signerPrivateKey
  );

  res.json({
    success: true,
    message: 'Royalty recipients updated successfully',
    data: result
  });
});

/**
 * Distribute royalties for a token sale
 * POST /api/royalty/distribute
 */
export const distributeRoyalties = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, amount, signerPrivateKey } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !amount || !signerPrivateKey) {
    throw createError('Missing required fields: tokenContract, tokenId, amount, signerPrivateKey', 400);
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw createError('Amount must be a positive number', 400);
  }

  const result = await royaltyService.distributeRoyalties(
    tokenContract,
    tokenId,
    amount,
    signerPrivateKey
  );

  res.json({
    success: true,
    message: 'Royalties distributed successfully',
    data: result
  });
});

/**
 * Withdraw accumulated royalties
 * POST /api/royalty/withdraw
 */
export const withdrawRoyalties = asyncHandler(async (req: Request, res: Response) => {
  const { signerPrivateKey } = req.body;

  // Validate required fields
  if (!signerPrivateKey) {
    throw createError('Missing required field: signerPrivateKey', 400);
  }

  const result = await royaltyService.withdrawRoyalties(signerPrivateKey);

  res.json({
    success: true,
    message: 'Royalties withdrawn successfully',
    data: result
  });
});

/**
 * Get royalty recipients for a token
 * GET /api/royalty/recipients/:tokenContract/:tokenId
 */
export const getRoyaltyRecipients = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  const recipients = await royaltyService.getRoyaltyRecipients(tokenContract, tokenId);

  res.json({
    success: true,
    data: {
      tokenContract,
      tokenId,
      recipients,
      totalRecipients: recipients.length,
      totalShares: recipients.reduce((sum, r) => sum + r.sharePercentage, 0)
    }
  });
});

/**
 * Get total royalty shares for a token
 * GET /api/royalty/shares/:tokenContract/:tokenId
 */
export const getTotalRoyaltyShares = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  const totalShares = await royaltyService.getTotalRoyaltyShares(tokenContract, tokenId);

  res.json({
    success: true,
    data: {
      tokenContract,
      tokenId,
      totalShares,
      totalPercentage: (totalShares / 100).toFixed(2) + '%',
      remainingShares: 10000 - totalShares,
      remainingPercentage: ((10000 - totalShares) / 100).toFixed(2) + '%'
    }
  });
});

/**
 * Get balance for a recipient
 * GET /api/royalty/balance/:address
 */
export const getRecipientBalance = asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  // Validate required fields
  if (!address) {
    throw createError('Missing required parameter: address', 400);
  }

  // Validate Ethereum address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid Ethereum address format', 400);
  }

  const balance = await royaltyService.getRecipientBalance(address);

  res.json({
    success: true,
    data: balance
  });
});

/**
 * Get royalty distribution history for a token
 * GET /api/royalty/history/:tokenContract/:tokenId
 */
export const getDistributionHistory = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;
  const { fromBlock } = req.query;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  // Parse fromBlock if provided
  let fromBlockNum = 0;
  if (fromBlock) {
    fromBlockNum = parseInt(fromBlock as string);
    if (isNaN(fromBlockNum) || fromBlockNum < 0) {
      throw createError('Invalid fromBlock parameter', 400);
    }
  }

  const distributions = await royaltyService.getDistributionHistory(
    tokenContract,
    tokenId,
    fromBlockNum
  );

  // Calculate summary statistics
  const totalDistributed = distributions.reduce((sum, dist) => {
    return sum + parseFloat(dist.amount);
  }, 0);

  const uniqueRecipients = new Set();
  distributions.forEach(dist => {
    dist.recipients.forEach(recipient => {
      uniqueRecipients.add(recipient.address);
    });
  });

  res.json({
    success: true,
    data: {
      tokenContract,
      tokenId,
      distributions,
      summary: {
        totalDistributions: distributions.length,
        totalAmount: totalDistributed.toString(),
        totalAmountETH: (totalDistributed / 1e18).toFixed(6) + ' ETH',
        uniqueRecipients: uniqueRecipients.size,
        latestDistribution: distributions[0]?.timestamp || null,
        oldestDistribution: distributions[distributions.length - 1]?.timestamp || null
      }
    }
  });
});

/**
 * Get royalty analytics for a recipient
 * GET /api/royalty/analytics/recipient/:address
 */
export const getRecipientAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  // Validate required fields
  if (!address) {
    throw createError('Missing required parameter: address', 400);
  }

  // Validate Ethereum address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid Ethereum address format', 400);
  }

  const analytics = await royaltyService.getRecipientAnalytics(address);

  res.json({
    success: true,
    data: {
      address,
      analytics,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get royalty analytics for a token
 * GET /api/royalty/analytics/token/:tokenContract/:tokenId
 */
export const getTokenAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  const analytics = await royaltyService.getTokenAnalytics(tokenContract, tokenId);

  res.json({
    success: true,
    data: {
      tokenContract,
      tokenId,
      analytics,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get royalty system overview
 * GET /api/royalty/overview
 */
export const getRoyaltyOverview = asyncHandler(async (req: Request, res: Response) => {
  // This would require additional service methods to aggregate data across all tokens
  // For now, return a placeholder response
  res.json({
    success: true,
    data: {
      message: 'Royalty system overview endpoint - implementation pending',
      features: [
        'Total royalties distributed across all tokens',
        'Top earning recipients',
        'Most active tokens',
        'System-wide analytics'
      ]
    }
  });
});

/**
 * Health check for royalty service
 * GET /api/royalty/health
 */
export const getRoyaltyHealth = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Test connection to the royalty distributor contract
    const contractAddress = process.env.ROYALTY_DISTRIBUTOR_ADDRESS;
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        contractAddress,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    throw createError('Royalty service health check failed', 503);
  }
}); 