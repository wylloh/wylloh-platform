import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';

// Import existing contracts
const RIGHTS_MANAGER_ABI = [
  // Rights verification functions
  "function hasRights(address tokenContract, uint256 tokenId, address account, uint8 rightsType) external view returns (bool)",
  "function getHighestRights(address tokenContract, uint256 tokenId, address account) external view returns (uint8 rightsType, string memory description)",
  "function getRightsThresholds(address tokenContract, uint256 tokenId) external view returns (tuple(uint256 quantity, uint8 rightsType, bool enabled, string description, string additionalMetadata)[])",
  "function createCustomRightsDefinition(string memory name, string memory description, string memory additionalMetadata) external returns (uint256)",
  
  // Events
  "event RightsVerified(address indexed tokenContract, uint256 indexed tokenId, address indexed account, uint8 rightsType, bool verified)",
  "event RightsConflictDetected(address indexed tokenContract, uint256 indexed tokenId, string conflictType, string description)",
  "event ComplianceCheckCompleted(address indexed tokenContract, uint256 indexed tokenId, bool compliant, string[] issues)"
];

// Rights types enum matching the smart contract
enum RightsType {
  PERSONAL_VIEWING = 0,
  SMALL_VENUE = 1,
  STREAMING_PLATFORM = 2,
  THEATRICAL_EXHIBITION = 3,
  NATIONAL_DISTRIBUTION = 4,
  CUSTOM = 5
}

interface RightsThreshold {
  quantity: number;
  rightsType: RightsType;
  enabled: boolean;
  description: string;
  additionalMetadata: string;
}

interface RightsVerificationResult {
  verified: boolean;
  rightsType: RightsType;
  description: string;
  tokenBalance: number;
  requiredQuantity: number;
  expirationDate?: Date;
  restrictions?: string[];
  legalCompliance: {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  };
}

interface RightsConflict {
  conflictType: 'OVERLAPPING_RIGHTS' | 'INSUFFICIENT_TOKENS' | 'EXPIRED_RIGHTS' | 'TERRITORIAL_RESTRICTION' | 'USAGE_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedTokens: string[];
  resolution: string;
  legalImplications: string;
}

interface ComplianceReport {
  tokenContract: string;
  tokenId: string;
  compliant: boolean;
  complianceScore: number; // 0-100
  issues: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation: string;
    legalReference?: string;
  }[];
  recommendations: string[];
  lastChecked: Date;
  nextReviewDate: Date;
}

interface LegalFramework {
  jurisdiction: string;
  applicableLaws: string[];
  requirements: {
    type: string;
    description: string;
    mandatory: boolean;
    penalty?: string;
  }[];
  certifications: {
    name: string;
    required: boolean;
    validUntil?: Date;
    issuer: string;
  }[];
}

class RightsVerificationService {
  private provider: ethers.providers.JsonRpcProvider;
  private rightsManagerContract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'
    );
    
    this.contractAddress = process.env.RIGHTS_MANAGER_ADDRESS || '';
    if (!this.contractAddress) {
      throw new Error('RIGHTS_MANAGER_ADDRESS environment variable is required');
    }

    this.rightsManagerContract = new ethers.Contract(
      this.contractAddress,
      RIGHTS_MANAGER_ABI,
      this.provider
    );
  }

  /**
   * Comprehensive rights verification with legal compliance checking
   */
  async verifyRights(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    requestedRightsType: RightsType,
    jurisdiction: string = 'US'
  ): Promise<RightsVerificationResult> {
    try {
      // Get user's token balance
      const tokenContractInstance = new ethers.Contract(
        tokenContract,
        ['function balanceOf(address account, uint256 id) external view returns (uint256)'],
        this.provider
      );
      const balance = await tokenContractInstance.balanceOf(userAddress, tokenId);

      // Check if user has the requested rights
      const hasRights = await this.rightsManagerContract.hasRights(
        tokenContract,
        tokenId,
        userAddress,
        requestedRightsType
      );

      // Get the highest rights the user has
      const [highestRightsType, description] = await this.rightsManagerContract.getHighestRights(
        tokenContract,
        tokenId,
        userAddress
      );

      // Get rights thresholds to determine required quantity
      const thresholds = await this.rightsManagerContract.getRightsThresholds(tokenContract, tokenId);
      const requiredThreshold = thresholds.find((t: any) => t.rightsType === requestedRightsType);
      const requiredQuantity = requiredThreshold ? requiredThreshold.quantity.toNumber() : 0;

      // Perform legal compliance check
      const complianceCheck = await this.performComplianceCheck(
        tokenContract,
        tokenId,
        requestedRightsType,
        jurisdiction
      );

      // Check for restrictions and conflicts
      const restrictions = await this.checkRestrictions(
        tokenContract,
        tokenId,
        userAddress,
        requestedRightsType
      );

      const result: RightsVerificationResult = {
        verified: hasRights && complianceCheck.compliant,
        rightsType: hasRights ? requestedRightsType : highestRightsType,
        description: hasRights ? this.getRightsTypeName(requestedRightsType) : description,
        tokenBalance: balance.toNumber(),
        requiredQuantity,
        restrictions,
        legalCompliance: complianceCheck
      };

      // Emit verification event
      // Note: In a real implementation, this would be done through a transaction
      console.log(`Rights verification completed for ${userAddress}: ${hasRights ? 'VERIFIED' : 'DENIED'}`);

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Rights verification failed: ${error.message}`, 500);
      }
      throw createError('Rights verification failed: Unknown error', 500);
    }
  }

  /**
   * Detect and analyze rights conflicts
   */
  async detectRightsConflicts(
    tokenContract: string,
    tokenId: string
  ): Promise<RightsConflict[]> {
    try {
      const conflicts: RightsConflict[] = [];
      
      // Get all rights thresholds
      const thresholds = await this.rightsManagerContract.getRightsThresholds(tokenContract, tokenId);
      
      // Check for overlapping rights thresholds
      for (let i = 0; i < thresholds.length; i++) {
        for (let j = i + 1; j < thresholds.length; j++) {
          const threshold1 = thresholds[i];
          const threshold2 = thresholds[j];
          
          if (threshold1.quantity.eq(threshold2.quantity) && threshold1.rightsType !== threshold2.rightsType) {
            conflicts.push({
              conflictType: 'OVERLAPPING_RIGHTS',
              severity: 'HIGH',
              description: `Same token quantity (${threshold1.quantity}) grants different rights types`,
              affectedTokens: [tokenId],
              resolution: 'Adjust token quantities to create clear rights hierarchy',
              legalImplications: 'May cause confusion in rights enforcement and licensing disputes'
            });
          }
        }
      }

      // Check for insufficient token supply vs rights allocation
      const tokenContractInstance = new ethers.Contract(
        tokenContract,
        ['function totalSupply(uint256 id) external view returns (uint256)'],
        this.provider
      );
      
      try {
        const totalSupply = await tokenContractInstance.totalSupply(tokenId);
        const highestThreshold = thresholds.reduce((max: any, current: any) => 
          current.quantity.gt(max.quantity) ? current : max, thresholds[0]);
        
        if (highestThreshold && totalSupply.lt(highestThreshold.quantity)) {
          conflicts.push({
            conflictType: 'INSUFFICIENT_TOKENS',
            severity: 'CRITICAL',
            description: `Highest rights threshold (${highestThreshold.quantity}) exceeds total supply (${totalSupply})`,
            affectedTokens: [tokenId],
            resolution: 'Increase token supply or reduce rights threshold requirements',
            legalImplications: 'Rights cannot be exercised, potentially violating licensing agreements'
          });
        }
      } catch (error) {
        // Token might not support totalSupply, skip this check
      }

      return conflicts;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Conflict detection failed: ${error.message}`, 500);
      }
      throw createError('Conflict detection failed: Unknown error', 500);
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    tokenContract: string,
    tokenId: string,
    jurisdiction: string = 'US'
  ): Promise<ComplianceReport> {
    try {
      const issues: ComplianceReport['issues'] = [];
      const recommendations: string[] = [];
      let complianceScore = 100;

      // Check rights configuration compliance
      const thresholds = await this.rightsManagerContract.getRightsThresholds(tokenContract, tokenId);
      
      if (thresholds.length === 0) {
        issues.push({
          type: 'MISSING_RIGHTS_CONFIGURATION',
          severity: 'HIGH',
          description: 'No rights thresholds configured for this token',
          recommendation: 'Configure appropriate rights thresholds for different usage scenarios',
          legalReference: 'Copyright Act Section 106 - Exclusive Rights'
        });
        complianceScore -= 30;
      }

      // Check for proper rights hierarchy
      const sortedThresholds = thresholds.sort((a: any, b: any) => a.quantity.sub(b.quantity));
      for (let i = 0; i < sortedThresholds.length - 1; i++) {
        if (sortedThresholds[i].rightsType >= sortedThresholds[i + 1].rightsType) {
          issues.push({
            type: 'INVALID_RIGHTS_HIERARCHY',
            severity: 'MEDIUM',
            description: 'Rights hierarchy does not follow logical progression',
            recommendation: 'Ensure higher token quantities grant more extensive rights',
            legalReference: 'Industry best practices for rights management'
          });
          complianceScore -= 15;
          break;
        }
      }

      // Check for territorial restrictions compliance
      const territorialCompliance = await this.checkTerritorialCompliance(tokenContract, tokenId, jurisdiction);
      if (!territorialCompliance.compliant) {
        issues.push(...territorialCompliance.issues.map(issue => ({
          type: 'TERRITORIAL_COMPLIANCE',
          severity: 'HIGH' as const,
          description: issue,
          recommendation: 'Implement proper territorial restrictions',
          legalReference: 'International copyright treaties and local regulations'
        })));
        complianceScore -= 25;
      }

      // Check for required certifications
      const certificationCompliance = await this.checkCertificationCompliance(tokenContract, tokenId);
      if (!certificationCompliance.compliant) {
        issues.push({
          type: 'MISSING_CERTIFICATIONS',
          severity: 'MEDIUM',
          description: 'Required industry certifications not verified',
          recommendation: 'Obtain and verify required certifications for content distribution',
          legalReference: 'Industry certification requirements'
        });
        complianceScore -= 10;
      }

      // Generate recommendations
      if (issues.length === 0) {
        recommendations.push('Rights configuration is compliant with current regulations');
      } else {
        recommendations.push('Review and address identified compliance issues');
        recommendations.push('Consider legal review for high-severity issues');
        recommendations.push('Implement automated compliance monitoring');
      }

      const report: ComplianceReport = {
        tokenContract,
        tokenId,
        compliant: issues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length === 0,
        complianceScore: Math.max(0, complianceScore),
        issues,
        recommendations,
        lastChecked: new Date(),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      return report;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Compliance report generation failed: ${error.message}`, 500);
      }
      throw createError('Compliance report generation failed: Unknown error', 500);
    }
  }

  /**
   * Create custom rights definition with legal validation
   */
  async createCustomRights(
    name: string,
    description: string,
    legalFramework: LegalFramework,
    signerPrivateKey: string
  ): Promise<{ rightsId: number; transactionHash: string; legalValidation: any }> {
    try {
      // Validate legal framework
      const legalValidation = await this.validateLegalFramework(legalFramework);
      
      if (!legalValidation.valid) {
        throw createError(`Legal framework validation failed: ${legalValidation.errors.join(', ')}`, 400);
      }

      // Prepare metadata with legal information
      const metadata = JSON.stringify({
        legalFramework,
        createdAt: new Date().toISOString(),
        validatedBy: 'RightsVerificationService',
        complianceVersion: '1.0'
      });

      // Create custom rights definition
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.rightsManagerContract.connect(wallet);

      const tx = await contract.createCustomRightsDefinition(name, description, metadata);
      const receipt = await tx.wait();

      // Extract rights ID from event logs
      const event = receipt.events?.find((e: any) => e.event === 'CustomRightsDefinitionCreated');
      const rightsId = event?.args?.id?.toNumber() || 0;

      return {
        rightsId,
        transactionHash: tx.hash,
        legalValidation
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Custom rights creation failed: ${error.message}`, 500);
      }
      throw createError('Custom rights creation failed: Unknown error', 500);
    }
  }

  /**
   * Automated verification workflow
   */
  async runAutomatedVerification(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    requestedAction: string
  ): Promise<{
    approved: boolean;
    workflow: string[];
    verificationSteps: any[];
    finalDecision: string;
  }> {
    const workflow: string[] = [];
    const verificationSteps: any[] = [];
    let approved = false;

    try {
      workflow.push('Starting automated verification workflow');

      // Step 1: Basic rights verification
      workflow.push('Checking basic token ownership and rights');
      const rightsType = this.mapActionToRightsType(requestedAction);
      const rightsResult = await this.verifyRights(tokenContract, tokenId, userAddress, rightsType);
      
      verificationSteps.push({
        step: 'rights_verification',
        result: rightsResult,
        passed: rightsResult.verified
      });

      if (!rightsResult.verified) {
        workflow.push('Basic rights verification failed - workflow terminated');
        return {
          approved: false,
          workflow,
          verificationSteps,
          finalDecision: 'Insufficient rights for requested action'
        };
      }

      // Step 2: Conflict detection
      workflow.push('Checking for rights conflicts');
      const conflicts = await this.detectRightsConflicts(tokenContract, tokenId);
      const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH');
      
      verificationSteps.push({
        step: 'conflict_detection',
        result: { conflicts, criticalConflicts },
        passed: criticalConflicts.length === 0
      });

      if (criticalConflicts.length > 0) {
        workflow.push('Critical rights conflicts detected - workflow terminated');
        return {
          approved: false,
          workflow,
          verificationSteps,
          finalDecision: 'Critical rights conflicts must be resolved before proceeding'
        };
      }

      // Step 3: Compliance check
      workflow.push('Performing compliance verification');
      const complianceReport = await this.generateComplianceReport(tokenContract, tokenId);
      
      verificationSteps.push({
        step: 'compliance_check',
        result: complianceReport,
        passed: complianceReport.compliant
      });

      if (!complianceReport.compliant) {
        workflow.push('Compliance check failed - workflow terminated');
        return {
          approved: false,
          workflow,
          verificationSteps,
          finalDecision: 'Compliance issues must be resolved before proceeding'
        };
      }

      // Step 4: Final approval
      workflow.push('All verification steps passed - action approved');
      approved = true;

      return {
        approved,
        workflow,
        verificationSteps,
        finalDecision: 'Action approved - all verification requirements met'
      };
    } catch (error: unknown) {
      workflow.push(`Verification workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        approved: false,
        workflow,
        verificationSteps,
        finalDecision: 'Verification workflow encountered an error'
      };
    }
  }

  // Helper methods

  private async performComplianceCheck(
    tokenContract: string,
    tokenId: string,
    rightsType: RightsType,
    jurisdiction: string
  ): Promise<{ compliant: boolean; issues: string[]; recommendations: string[] }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check jurisdiction-specific requirements
    if (jurisdiction === 'US') {
      // US-specific compliance checks
      if (rightsType >= RightsType.STREAMING_PLATFORM) {
        // Check for DMCA compliance
        issues.push('DMCA compliance verification required for streaming rights');
        recommendations.push('Implement DMCA takedown procedures');
      }
    } else if (jurisdiction === 'EU') {
      // EU-specific compliance checks (GDPR, Copyright Directive)
      issues.push('GDPR compliance verification required');
      recommendations.push('Ensure GDPR compliance for user data handling');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  private async checkRestrictions(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    rightsType: RightsType
  ): Promise<string[]> {
    const restrictions: string[] = [];

    // Check for time-based restrictions
    // This would typically check against a database of restrictions
    
    // Check for territorial restrictions
    // This would check user's location against allowed territories
    
    // Check for usage limitations
    if (rightsType === RightsType.SMALL_VENUE) {
      restrictions.push('Limited to venues with capacity under 50 seats');
    } else if (rightsType === RightsType.STREAMING_PLATFORM) {
      restrictions.push('Requires platform certification and content rating compliance');
    }

    return restrictions;
  }

  private async checkTerritorialCompliance(
    tokenContract: string,
    tokenId: string,
    jurisdiction: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    // This would check against a database of territorial restrictions
    return {
      compliant: true,
      issues: []
    };
  }

  private async checkCertificationCompliance(
    tokenContract: string,
    tokenId: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    // This would check against required industry certifications
    return {
      compliant: true,
      issues: []
    };
  }

  private async validateLegalFramework(framework: LegalFramework): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!framework.jurisdiction) {
      errors.push('Jurisdiction is required');
    }

    if (!framework.applicableLaws || framework.applicableLaws.length === 0) {
      errors.push('At least one applicable law must be specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private mapActionToRightsType(action: string): RightsType {
    switch (action.toLowerCase()) {
      case 'view':
      case 'watch':
      case 'personal_viewing':
        return RightsType.PERSONAL_VIEWING;
      case 'small_venue':
      case 'screening':
        return RightsType.SMALL_VENUE;
      case 'streaming':
      case 'stream':
        return RightsType.STREAMING_PLATFORM;
      case 'theatrical':
      case 'cinema':
        return RightsType.THEATRICAL_EXHIBITION;
      case 'distribution':
      case 'broadcast':
        return RightsType.NATIONAL_DISTRIBUTION;
      default:
        return RightsType.PERSONAL_VIEWING;
    }
  }

  private getRightsTypeName(rightsType: RightsType): string {
    switch (rightsType) {
      case RightsType.PERSONAL_VIEWING:
        return 'Personal Viewing';
      case RightsType.SMALL_VENUE:
        return 'Small Venue Exhibition';
      case RightsType.STREAMING_PLATFORM:
        return 'Streaming Platform Distribution';
      case RightsType.THEATRICAL_EXHIBITION:
        return 'Theatrical Exhibition';
      case RightsType.NATIONAL_DISTRIBUTION:
        return 'National Distribution';
      case RightsType.CUSTOM:
        return 'Custom Rights';
      default:
        return 'Unknown Rights';
    }
  }
}

export default RightsVerificationService;
export type { 
  RightsVerificationResult, 
  RightsConflict, 
  ComplianceReport, 
  LegalFramework,
  RightsThreshold
}; 