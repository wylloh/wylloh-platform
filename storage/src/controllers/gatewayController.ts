import { Request, Response } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler.js';
import { 
  getGatewayStats, 
  getActiveGateways, 
  checkGateway, 
  addCustomGateway, 
  probeAllGateways
} from '../ipfs/gatewayService.js';

/**
 * Get stats for all IPFS gateways
 * @route GET /api/gateways/stats
 */
export const getGatewayStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = getGatewayStats();
    
    // Convert Map to array for JSON response
    const gatewayStats = Array.from(stats.entries()).map(([url, gatewayStats]) => ({
      url,
      latency: gatewayStats.latency,
      lastCheck: gatewayStats.lastCheck,
      successRate: gatewayStats.successRate,
      available: gatewayStats.available,
      consecutiveFailures: gatewayStats.consecutiveFailures
    }));
    
    res.status(200).json({
      message: 'Gateway statistics retrieved successfully',
      gatewayCount: gatewayStats.length,
      activeCount: gatewayStats.filter(g => g.available).length,
      gateways: gatewayStats
    });
  } catch (error: any) {
    throw createError(`Failed to get gateway stats: ${error.message}`, 500);
  }
});

/**
 * Get list of active gateways
 * @route GET /api/gateways/active
 */
export const getActiveGatewayList = asyncHandler(async (req: Request, res: Response) => {
  try {
    const activeGateways = getActiveGateways();
    
    res.status(200).json({
      message: 'Active gateways retrieved successfully',
      count: activeGateways.length,
      gateways: activeGateways
    });
  } catch (error: any) {
    throw createError(`Failed to get active gateways: ${error.message}`, 500);
  }
});

/**
 * Check a specific gateway
 * @route GET /api/gateways/check/:gatewayUrl
 */
export const checkGatewayStatus = asyncHandler(async (req: Request, res: Response) => {
  const { gatewayUrl } = req.params;
  
  if (!gatewayUrl) {
    throw createError('Gateway URL is required', 400);
  }
  
  try {
    // URL decode the gateway URL
    const decodedUrl = decodeURIComponent(gatewayUrl);
    
    const stats = await checkGateway(decodedUrl);
    
    if (!stats) {
      throw createError('Gateway not found', 404);
    }
    
    res.status(200).json({
      message: 'Gateway checked successfully',
      gateway: decodedUrl,
      stats
    });
  } catch (error: any) {
    throw createError(`Failed to check gateway: ${error.message}`, 500);
  }
});

/**
 * Add a custom gateway
 * @route POST /api/gateways/add
 */
export const addNewGateway = asyncHandler(async (req: Request, res: Response) => {
  const { gatewayUrl } = req.body;
  
  if (!gatewayUrl) {
    throw createError('Gateway URL is required', 400);
  }
  
  try {
    // Validate URL format (must end with /ipfs/)
    if (!gatewayUrl.endsWith('/ipfs/')) {
      throw createError('Gateway URL must end with /ipfs/', 400);
    }
    
    const added = await addCustomGateway(gatewayUrl);
    
    if (!added) {
      throw createError('Gateway already exists or is not available', 400);
    }
    
    res.status(201).json({
      message: 'Gateway added successfully',
      gateway: gatewayUrl
    });
  } catch (error: any) {
    throw createError(`Failed to add gateway: ${error.message}`, 500);
  }
});

/**
 * Refresh all gateway statistics
 * @route POST /api/gateways/refresh
 */
export const refreshGatewayStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    await probeAllGateways();
    
    const stats = getGatewayStats();
    
    // Convert Map to array for JSON response
    const gatewayStats = Array.from(stats.entries()).map(([url, gatewayStats]) => ({
      url,
      latency: gatewayStats.latency,
      lastCheck: gatewayStats.lastCheck,
      successRate: gatewayStats.successRate,
      available: gatewayStats.available,
      consecutiveFailures: gatewayStats.consecutiveFailures
    }));
    
    res.status(200).json({
      message: 'Gateway statistics refreshed successfully',
      gatewayCount: gatewayStats.length,
      activeCount: gatewayStats.filter(g => g.available).length,
      gateways: gatewayStats
    });
  } catch (error: any) {
    throw createError(`Failed to refresh gateway stats: ${error.message}`, 500);
  }
}); 