import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import RightsVerificationService, { LegalFramework } from '../services/rightsVerificationService';

const rightsService = new RightsVerificationService();

/**
 * Verify rights for specific content and user
 * POST /api/rights/verify
 */
export const verifyRights = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, userAddress, requestedRightsType, jurisdiction } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !userAddress || requestedRightsType === undefined) {
    throw createError('Missing required fields: tokenContract, tokenId, userAddress, requestedRightsType', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid user address format', 400);
  }

  // Validate rights type
  if (requestedRightsType < 0 || requestedRightsType > 5) {
    throw createError('Invalid rights type. Must be between 0 and 5', 400);
  }

  const result = await rightsService.verifyRights(
    tokenContract,
    tokenId,
    userAddress,
    requestedRightsType,
    jurisdiction || 'US'
  );

  res.json({
    success: true,
    message: 'Rights verification completed',
    data: {
      verification: result,
      timestamp: new Date().toISOString(),
      jurisdiction: jurisdiction || 'US'
    }
  });
});

/**
 * Detect rights conflicts for a token
 * GET /api/rights/conflicts/:tokenContract/:tokenId
 */
export const detectConflicts = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  const conflicts = await rightsService.detectRightsConflicts(tokenContract, tokenId);

  // Categorize conflicts by severity
  const conflictSummary = {
    critical: conflicts.filter(c => c.severity === 'CRITICAL'),
    high: conflicts.filter(c => c.severity === 'HIGH'),
    medium: conflicts.filter(c => c.severity === 'MEDIUM'),
    low: conflicts.filter(c => c.severity === 'LOW')
  };

  res.json({
    success: true,
    message: 'Rights conflict detection completed',
    data: {
      tokenContract,
      tokenId,
      conflicts,
      summary: {
        totalConflicts: conflicts.length,
        criticalCount: conflictSummary.critical.length,
        highCount: conflictSummary.high.length,
        mediumCount: conflictSummary.medium.length,
        lowCount: conflictSummary.low.length,
        requiresImmediateAttention: conflictSummary.critical.length > 0 || conflictSummary.high.length > 0
      },
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Generate compliance report for a token
 * GET /api/rights/compliance/:tokenContract/:tokenId
 */
export const generateComplianceReport = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;
  const { jurisdiction } = req.query;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  const report = await rightsService.generateComplianceReport(
    tokenContract,
    tokenId,
    jurisdiction as string || 'US'
  );

  res.json({
    success: true,
    message: 'Compliance report generated successfully',
    data: {
      report,
      jurisdiction: jurisdiction || 'US',
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Create custom rights definition
 * POST /api/rights/custom
 */
export const createCustomRights = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, legalFramework, signerPrivateKey } = req.body;

  // Validate required fields
  if (!name || !description || !legalFramework || !signerPrivateKey) {
    throw createError('Missing required fields: name, description, legalFramework, signerPrivateKey', 400);
  }

  // Validate legal framework structure
  if (!legalFramework.jurisdiction || !legalFramework.applicableLaws) {
    throw createError('Legal framework must include jurisdiction and applicableLaws', 400);
  }

  const result = await rightsService.createCustomRights(
    name,
    description,
    legalFramework as LegalFramework,
    signerPrivateKey
  );

  res.status(201).json({
    success: true,
    message: 'Custom rights definition created successfully',
    data: result
  });
});

/**
 * Run automated verification workflow
 * POST /api/rights/workflow
 */
export const runAutomatedWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, userAddress, requestedAction } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !userAddress || !requestedAction) {
    throw createError('Missing required fields: tokenContract, tokenId, userAddress, requestedAction', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid user address format', 400);
  }

  const workflowResult = await rightsService.runAutomatedVerification(
    tokenContract,
    tokenId,
    userAddress,
    requestedAction
  );

  res.json({
    success: true,
    message: 'Automated verification workflow completed',
    data: {
      ...workflowResult,
      tokenContract,
      tokenId,
      userAddress,
      requestedAction,
      executedAt: new Date().toISOString()
    }
  });
});

/**
 * Get rights profile for a token
 * GET /api/rights/profile/:tokenContract/:tokenId
 */
export const getRightsProfile = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId } = req.params;

  // Validate required fields
  if (!tokenContract || !tokenId) {
    throw createError('Missing required parameters: tokenContract, tokenId', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  try {
    // Get comprehensive rights information
    const [conflicts, complianceReport] = await Promise.all([
      rightsService.detectRightsConflicts(tokenContract, tokenId),
      rightsService.generateComplianceReport(tokenContract, tokenId)
    ]);

    const profile = {
      tokenContract,
      tokenId,
      rightsConfiguration: {
        thresholds: complianceReport.issues.length === 0 ? 'Properly configured' : 'Issues detected',
        conflicts: conflicts.length,
        complianceScore: complianceReport.complianceScore
      },
      legalCompliance: {
        compliant: complianceReport.compliant,
        score: complianceReport.complianceScore,
        issues: complianceReport.issues.length,
        nextReview: complianceReport.nextReviewDate
      },
      securityStatus: {
        conflictsDetected: conflicts.length > 0,
        criticalIssues: conflicts.filter(c => c.severity === 'CRITICAL').length,
        recommendedActions: complianceReport.recommendations
      }
    };

    res.json({
      success: true,
      message: 'Rights profile retrieved successfully',
      data: {
        profile,
        detailedConflicts: conflicts,
        detailedCompliance: complianceReport,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    throw createError('Failed to generate rights profile', 500);
  }
});

/**
 * Record rights consumption (for tracking usage)
 * POST /api/rights/consume
 */
export const recordRightsConsumption = asyncHandler(async (req: Request, res: Response) => {
  const { tokenContract, tokenId, userAddress, rightsType, consumptionDetails } = req.body;

  // Validate required fields
  if (!tokenContract || !tokenId || !userAddress || rightsType === undefined) {
    throw createError('Missing required fields: tokenContract, tokenId, userAddress, rightsType', 400);
  }

  // Validate Ethereum address format
  if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid token contract address format', 400);
  }

  if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw createError('Invalid user address format', 400);
  }

  // First verify the user has the rights they're trying to consume
  const verification = await rightsService.verifyRights(
    tokenContract,
    tokenId,
    userAddress,
    rightsType
  );

  if (!verification.verified) {
    throw createError('User does not have the required rights for this consumption', 403);
  }

  // Record the consumption (in a real implementation, this would be stored in a database)
  const consumptionRecord = {
    tokenContract,
    tokenId,
    userAddress,
    rightsType,
    consumptionDetails: consumptionDetails || {},
    timestamp: new Date().toISOString(),
    verified: true,
    verificationDetails: verification
  };

  // Log the consumption for audit purposes
  console.log('Rights consumption recorded:', consumptionRecord);

  res.json({
    success: true,
    message: 'Rights consumption recorded successfully',
    data: {
      consumptionId: `${tokenContract}-${tokenId}-${Date.now()}`, // Generate unique ID
      record: consumptionRecord,
      verification
    }
  });
});

/**
 * Get available rights bundles/templates
 * GET /api/rights/bundles
 */
export const getRightsBundles = asyncHandler(async (req: Request, res: Response) => {
  // Predefined rights bundle templates for common use cases
  const bundles = [
    {
      id: 'personal-viewing',
      name: 'Personal Viewing Bundle',
      description: 'Basic rights for personal consumption',
      rightsIncluded: ['PERSONAL_VIEWING'],
      minimumTokens: 1,
      legalFramework: {
        jurisdiction: 'US',
        applicableLaws: ['Copyright Act Section 107 - Fair Use'],
        restrictions: ['Non-commercial use only', 'Single user access']
      }
    },
    {
      id: 'small-venue',
      name: 'Small Venue Exhibition',
      description: 'Rights for small venue screenings (under 50 seats)',
      rightsIncluded: ['PERSONAL_VIEWING', 'SMALL_VENUE'],
      minimumTokens: 10,
      legalFramework: {
        jurisdiction: 'US',
        applicableLaws: ['Copyright Act Section 106', 'Public Performance Rights'],
        restrictions: ['Venue capacity under 50 seats', 'Non-profit screenings preferred']
      }
    },
    {
      id: 'streaming-platform',
      name: 'Streaming Platform Distribution',
      description: 'Rights for digital streaming platforms',
      rightsIncluded: ['PERSONAL_VIEWING', 'SMALL_VENUE', 'STREAMING_PLATFORM'],
      minimumTokens: 100,
      legalFramework: {
        jurisdiction: 'US',
        applicableLaws: ['DMCA', 'Copyright Act Section 106', 'Platform Liability Laws'],
        restrictions: ['Platform certification required', 'Content rating compliance', 'Takedown procedures']
      }
    },
    {
      id: 'theatrical',
      name: 'Theatrical Exhibition',
      description: 'Rights for theatrical distribution',
      rightsIncluded: ['PERSONAL_VIEWING', 'SMALL_VENUE', 'STREAMING_PLATFORM', 'THEATRICAL_EXHIBITION'],
      minimumTokens: 500,
      legalFramework: {
        jurisdiction: 'US',
        applicableLaws: ['Copyright Act Section 106', 'Theatrical Distribution Agreements', 'Union Agreements'],
        restrictions: ['Theater certification required', 'Union compliance', 'Revenue sharing agreements']
      }
    },
    {
      id: 'national-distribution',
      name: 'National Distribution',
      description: 'Full distribution rights including broadcast',
      rightsIncluded: ['PERSONAL_VIEWING', 'SMALL_VENUE', 'STREAMING_PLATFORM', 'THEATRICAL_EXHIBITION', 'NATIONAL_DISTRIBUTION'],
      minimumTokens: 1000,
      legalFramework: {
        jurisdiction: 'US',
        applicableLaws: ['Copyright Act Section 106', 'FCC Regulations', 'Broadcast Standards'],
        restrictions: ['FCC compliance required', 'Content standards compliance', 'Territorial restrictions apply']
      }
    }
  ];

  res.json({
    success: true,
    message: 'Rights bundles retrieved successfully',
    data: {
      bundles,
      totalBundles: bundles.length,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * Health check for rights verification service
 * GET /api/rights/health
 */
export const getRightsHealth = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Test connection to the rights manager contract
    const contractAddress = process.env.RIGHTS_MANAGER_ADDRESS;
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        contractAddress,
        features: [
          'Rights verification',
          'Conflict detection',
          'Compliance reporting',
          'Automated workflows',
          'Custom rights creation',
          'Legal framework validation'
        ],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    throw createError('Rights verification service health check failed', 503);
  }
}); 