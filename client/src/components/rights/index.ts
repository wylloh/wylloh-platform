// Rights Verification Components
export { default as RightsVerificationDashboard } from './RightsVerificationDashboard';

// Re-export types from the service for convenience
export type {
  RightsType,
  RightsVerificationResult,
  RightsConflict,
  ComplianceReport,
  RightsProfile,
  RightsBundle,
  LegalFramework,
  AutomatedWorkflowResult
} from '../../services/rightsVerification.service';

export { default as RightsVerificationService } from '../../services/rightsVerification.service'; 