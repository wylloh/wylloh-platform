import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Rights types enum matching the backend
export enum RightsType {
  PERSONAL_VIEWING = 0,
  SMALL_VENUE = 1,
  STREAMING_PLATFORM = 2,
  THEATRICAL_EXHIBITION = 3,
  NATIONAL_DISTRIBUTION = 4,
  CUSTOM = 5
}

export interface RightsVerificationResult {
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

export interface RightsConflict {
  conflictType: 'OVERLAPPING_RIGHTS' | 'INSUFFICIENT_TOKENS' | 'EXPIRED_RIGHTS' | 'TERRITORIAL_RESTRICTION' | 'USAGE_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedTokens: string[];
  resolution: string;
  legalImplications: string;
}

export interface ComplianceReport {
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

export interface LegalFramework {
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

export interface RightsProfile {
  tokenContract: string;
  tokenId: string;
  rightsConfiguration: {
    thresholds: string;
    conflicts: number;
    complianceScore: number;
  };
  legalCompliance: {
    compliant: boolean;
    score: number;
    issues: number;
    nextReview: Date;
  };
  securityStatus: {
    conflictsDetected: boolean;
    criticalIssues: number;
    recommendedActions: string[];
  };
}

export interface RightsBundle {
  id: string;
  name: string;
  description: string;
  rightsIncluded: string[];
  minimumTokens: number;
  legalFramework: {
    jurisdiction: string;
    applicableLaws: string[];
    restrictions: string[];
  };
}

export interface AutomatedWorkflowResult {
  approved: boolean;
  workflow: string[];
  verificationSteps: {
    step: string;
    result: any;
    passed: boolean;
  }[];
  finalDecision: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class RightsVerificationService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/rights`;
  }

  /**
   * Verify rights for specific content and user
   */
  async verifyRights(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    requestedRightsType: RightsType,
    jurisdiction: string = 'US'
  ): Promise<{
    verification: RightsVerificationResult;
    timestamp: string;
    jurisdiction: string;
  }> {
    const response = await axios.post<ApiResponse<{
      verification: RightsVerificationResult;
      timestamp: string;
      jurisdiction: string;
    }>>(
      `${this.baseURL}/verify`,
      {
        tokenContract,
        tokenId,
        userAddress,
        requestedRightsType,
        jurisdiction
      }
    );
    return response.data.data;
  }

  /**
   * Detect rights conflicts for a token
   */
  async detectConflicts(
    tokenContract: string,
    tokenId: string
  ): Promise<{
    tokenContract: string;
    tokenId: string;
    conflicts: RightsConflict[];
    summary: {
      totalConflicts: number;
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      requiresImmediateAttention: boolean;
    };
    generatedAt: string;
  }> {
    const response = await axios.get<ApiResponse<{
      tokenContract: string;
      tokenId: string;
      conflicts: RightsConflict[];
      summary: {
        totalConflicts: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        requiresImmediateAttention: boolean;
      };
      generatedAt: string;
    }>>(
      `${this.baseURL}/conflicts/${tokenContract}/${tokenId}`
    );
    return response.data.data;
  }

  /**
   * Generate compliance report for a token
   */
  async generateComplianceReport(
    tokenContract: string,
    tokenId: string,
    jurisdiction: string = 'US'
  ): Promise<{
    report: ComplianceReport;
    jurisdiction: string;
    generatedAt: string;
  }> {
    const response = await axios.get<ApiResponse<{
      report: ComplianceReport;
      jurisdiction: string;
      generatedAt: string;
    }>>(
      `${this.baseURL}/compliance/${tokenContract}/${tokenId}`,
      { params: { jurisdiction } }
    );
    return response.data.data;
  }

  /**
   * Create custom rights definition
   */
  async createCustomRights(
    name: string,
    description: string,
    legalFramework: LegalFramework,
    signerPrivateKey: string
  ): Promise<{
    rightsId: number;
    transactionHash: string;
    legalValidation: any;
  }> {
    const response = await axios.post<ApiResponse<{
      rightsId: number;
      transactionHash: string;
      legalValidation: any;
    }>>(
      `${this.baseURL}/custom`,
      {
        name,
        description,
        legalFramework,
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Run automated verification workflow
   */
  async runAutomatedWorkflow(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    requestedAction: string
  ): Promise<AutomatedWorkflowResult & {
    tokenContract: string;
    tokenId: string;
    userAddress: string;
    requestedAction: string;
    executedAt: string;
  }> {
    const response = await axios.post<ApiResponse<AutomatedWorkflowResult & {
      tokenContract: string;
      tokenId: string;
      userAddress: string;
      requestedAction: string;
      executedAt: string;
    }>>(
      `${this.baseURL}/workflow`,
      {
        tokenContract,
        tokenId,
        userAddress,
        requestedAction
      }
    );
    return response.data.data;
  }

  /**
   * Get rights profile for a token
   */
  async getRightsProfile(
    tokenContract: string,
    tokenId: string
  ): Promise<{
    profile: RightsProfile;
    detailedConflicts: RightsConflict[];
    detailedCompliance: ComplianceReport;
    generatedAt: string;
  }> {
    const response = await axios.get<ApiResponse<{
      profile: RightsProfile;
      detailedConflicts: RightsConflict[];
      detailedCompliance: ComplianceReport;
      generatedAt: string;
    }>>(
      `${this.baseURL}/profile/${tokenContract}/${tokenId}`
    );
    return response.data.data;
  }

  /**
   * Record rights consumption
   */
  async recordRightsConsumption(
    tokenContract: string,
    tokenId: string,
    userAddress: string,
    rightsType: RightsType,
    consumptionDetails?: any
  ): Promise<{
    consumptionId: string;
    record: any;
    verification: RightsVerificationResult;
  }> {
    const response = await axios.post<ApiResponse<{
      consumptionId: string;
      record: any;
      verification: RightsVerificationResult;
    }>>(
      `${this.baseURL}/consume`,
      {
        tokenContract,
        tokenId,
        userAddress,
        rightsType,
        consumptionDetails
      }
    );
    return response.data.data;
  }

  /**
   * Get available rights bundles
   */
  async getRightsBundles(): Promise<{
    bundles: RightsBundle[];
    totalBundles: number;
    generatedAt: string;
  }> {
    const response = await axios.get<ApiResponse<{
      bundles: RightsBundle[];
      totalBundles: number;
      generatedAt: string;
    }>>(
      `${this.baseURL}/bundles`
    );
    return response.data.data;
  }

  /**
   * Health check for rights verification service
   */
  async getHealth(): Promise<{
    status: string;
    contractAddress: string;
    features: string[];
    timestamp: string;
    version: string;
  }> {
    const response = await axios.get<ApiResponse<{
      status: string;
      contractAddress: string;
      features: string[];
      timestamp: string;
      version: string;
    }>>(
      `${this.baseURL}/health`
    );
    return response.data.data;
  }

  // Utility methods

  /**
   * Get rights type name as string
   */
  static getRightsTypeName(rightsType: RightsType): string {
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

  /**
   * Get rights type description
   */
  static getRightsTypeDescription(rightsType: RightsType): string {
    switch (rightsType) {
      case RightsType.PERSONAL_VIEWING:
        return 'Basic rights for personal consumption and viewing';
      case RightsType.SMALL_VENUE:
        return 'Rights for small venue screenings (under 50 seats)';
      case RightsType.STREAMING_PLATFORM:
        return 'Rights for digital streaming platform distribution';
      case RightsType.THEATRICAL_EXHIBITION:
        return 'Rights for theatrical exhibition and cinema distribution';
      case RightsType.NATIONAL_DISTRIBUTION:
        return 'Full national distribution rights including broadcast';
      case RightsType.CUSTOM:
        return 'Custom rights definition with specific terms';
      default:
        return 'Unknown rights type';
    }
  }

  /**
   * Get severity color for UI display
   */
  static getSeverityColor(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
    switch (severity) {
      case 'LOW':
        return '#4caf50'; // Green
      case 'MEDIUM':
        return '#ff9800'; // Orange
      case 'HIGH':
        return '#f44336'; // Red
      case 'CRITICAL':
        return '#9c27b0'; // Purple
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Format compliance score for display
   */
  static formatComplianceScore(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Critical';
  }

  /**
   * Check if action requires specific rights type
   */
  static getRequiredRightsForAction(action: string): RightsType {
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

  /**
   * Validate Ethereum address format
   */
  static isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default RightsVerificationService; 