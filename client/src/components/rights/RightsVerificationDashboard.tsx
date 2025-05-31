import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Theaters as TheatersIcon,
  Tv as TvIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import RightsVerificationService, {
  RightsType,
  RightsVerificationResult,
  RightsConflict,
  ComplianceReport,
  RightsProfile,
  RightsBundle
} from '../../services/rightsVerification.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rights-tabpanel-${index}`}
      aria-labelledby={`rights-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RightsVerificationDashboard: React.FC = () => {
  const theme = useTheme();
  const rightsService = new RightsVerificationService();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verification state
  const [tokenContract, setTokenContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [selectedRightsType, setSelectedRightsType] = useState<RightsType>(RightsType.PERSONAL_VIEWING);
  const [jurisdiction, setJurisdiction] = useState('US');
  
  // Results state
  const [verificationResult, setVerificationResult] = useState<RightsVerificationResult | null>(null);
  const [conflicts, setConflicts] = useState<RightsConflict[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [rightsProfile, setRightsProfile] = useState<RightsProfile | null>(null);
  const [rightsBundles, setRightsBundles] = useState<RightsBundle[]>([]);
  
  // Dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRightsBundles();
  }, []);

  const loadRightsBundles = async () => {
    try {
      const response = await rightsService.getRightsBundles();
      setRightsBundles(response.bundles);
    } catch (error) {
      console.error('Failed to load rights bundles:', error);
    }
  };

  const handleVerifyRights = async () => {
    if (!tokenContract || !tokenId || !userAddress) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rightsService.verifyRights(
        tokenContract,
        tokenId,
        userAddress,
        selectedRightsType,
        jurisdiction
      );
      setVerificationResult(result.verification);
      setVerifyDialogOpen(false);
    } catch (error) {
      setError('Failed to verify rights. Please check your inputs and try again.');
      console.error('Rights verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectConflicts = async () => {
    if (!tokenContract || !tokenId) {
      setError('Please provide token contract and token ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rightsService.detectConflicts(tokenContract, tokenId);
      setConflicts(result.conflicts);
    } catch (error) {
      setError('Failed to detect conflicts');
      console.error('Conflict detection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComplianceReport = async () => {
    if (!tokenContract || !tokenId) {
      setError('Please provide token contract and token ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rightsService.generateComplianceReport(
        tokenContract,
        tokenId,
        jurisdiction
      );
      setComplianceReport(result.report);
      setComplianceDialogOpen(true);
    } catch (error) {
      setError('Failed to generate compliance report');
      console.error('Compliance report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRightsProfile = async () => {
    if (!tokenContract || !tokenId) {
      setError('Please provide token contract and token ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await rightsService.getRightsProfile(tokenContract, tokenId);
      setRightsProfile(result.profile);
      setConflicts(result.detailedConflicts);
      setComplianceReport(result.detailedCompliance);
    } catch (error) {
      setError('Failed to load rights profile');
      console.error('Rights profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRightsTypeIcon = (rightsType: RightsType) => {
    switch (rightsType) {
      case RightsType.PERSONAL_VIEWING:
        return <PersonIcon />;
      case RightsType.SMALL_VENUE:
        return <BusinessIcon />;
      case RightsType.STREAMING_PLATFORM:
        return <TvIcon />;
      case RightsType.THEATRICAL_EXHIBITION:
        return <TheatersIcon />;
      case RightsType.NATIONAL_DISTRIBUTION:
        return <PublicIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return theme.palette.error.main;
      case 'HIGH':
        return theme.palette.warning.main;
      case 'MEDIUM':
        return theme.palette.info.main;
      case 'LOW':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 80) return theme.palette.info.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Advanced Rights Verification System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive legal compliance and rights management for Hollywood content
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SecurityIcon />} label="Rights Verification" />
          <Tab icon={<WarningIcon />} label="Conflict Detection" />
          <Tab icon={<GavelIcon />} label="Compliance Reports" />
          <Tab icon={<AssessmentIcon />} label="Rights Profile" />
          <Tab icon={<InfoIcon />} label="Rights Bundles" />
        </Tabs>

        {/* Tab 1: Rights Verification */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Input Form */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verify Content Rights
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Token Contract Address"
                        value={tokenContract}
                        onChange={(e) => setTokenContract(e.target.value)}
                        placeholder="0x..."
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Token ID"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        placeholder="1"
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="User Address"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="0x..."
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Rights Type</InputLabel>
                        <Select
                          value={selectedRightsType}
                          onChange={(e) => setSelectedRightsType(e.target.value as RightsType)}
                          label="Rights Type"
                        >
                          {Object.values(RightsType).filter(v => typeof v === 'number').map((type) => (
                            <MenuItem key={type} value={type}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getRightsTypeIcon(type as RightsType)}
                                {RightsVerificationService.getRightsTypeName(type as RightsType)}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Jurisdiction</InputLabel>
                        <Select
                          value={jurisdiction}
                          onChange={(e) => setJurisdiction(e.target.value)}
                          label="Jurisdiction"
                        >
                          <MenuItem value="US">United States</MenuItem>
                          <MenuItem value="EU">European Union</MenuItem>
                          <MenuItem value="UK">United Kingdom</MenuItem>
                          <MenuItem value="CA">Canada</MenuItem>
                          <MenuItem value="AU">Australia</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleVerifyRights}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                        sx={{ mt: 2 }}
                      >
                        {loading ? 'Verifying...' : 'Verify Rights'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Verification Results */}
            <Grid item xs={12} md={6}>
              {verificationResult && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {verificationResult.verified ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                      <Typography variant="h6">
                        Verification Result
                      </Typography>
                    </Box>
                    
                    <Alert 
                      severity={verificationResult.verified ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {verificationResult.verified 
                        ? 'Rights verified successfully' 
                        : 'Rights verification failed'
                      }
                    </Alert>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Rights Type
                        </Typography>
                        <Typography variant="body1">
                          {RightsVerificationService.getRightsTypeName(verificationResult.rightsType)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Token Balance
                        </Typography>
                        <Typography variant="body1">
                          {verificationResult.tokenBalance} / {verificationResult.requiredQuantity}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {verificationResult.description}
                        </Typography>
                      </Grid>
                      
                      {verificationResult.restrictions && verificationResult.restrictions.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Restrictions
                          </Typography>
                          {verificationResult.restrictions.map((restriction, index) => (
                            <Chip
                              key={index}
                              label={restriction}
                              size="small"
                              color="warning"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Legal Compliance
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {verificationResult.legalCompliance.compliant ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <WarningIcon color="warning" fontSize="small" />
                          )}
                          <Typography variant="body1">
                            {verificationResult.legalCompliance.compliant ? 'Compliant' : 'Issues Detected'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Conflict Detection */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Rights Conflict Detection
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleDetectConflicts}
                      disabled={loading || !tokenContract || !tokenId}
                      startIcon={loading ? <CircularProgress size={20} /> : <WarningIcon />}
                    >
                      {loading ? 'Detecting...' : 'Detect Conflicts'}
                    </Button>
                  </Box>
                  
                  {conflicts.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Found {conflicts.length} conflict(s)
                      </Typography>
                      
                      {conflicts.map((conflict, index) => (
                        <Accordion key={index} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <Chip
                                label={conflict.severity}
                                size="small"
                                sx={{ 
                                  backgroundColor: getSeverityColor(conflict.severity),
                                  color: 'white'
                                }}
                              />
                              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                {conflict.conflictType.replace(/_/g, ' ')}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  Description
                                </Typography>
                                <Typography variant="body1">
                                  {conflict.description}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Resolution
                                </Typography>
                                <Typography variant="body1">
                                  {conflict.resolution}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Legal Implications
                                </Typography>
                                <Typography variant="body1">
                                  {conflict.legalImplications}
                                </Typography>
                              </Grid>
                              
                              {conflict.affectedTokens.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Affected Tokens
                                  </Typography>
                                  {conflict.affectedTokens.map((token, tokenIndex) => (
                                    <Chip
                                      key={tokenIndex}
                                      label={token}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 1, mb: 1 }}
                                    />
                                  ))}
                                </Grid>
                              )}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                  
                  {conflicts.length === 0 && tokenContract && tokenId && (
                    <Alert severity="success">
                      No rights conflicts detected for this content.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Compliance Reports */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Legal Compliance Report
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleGenerateComplianceReport}
                      disabled={loading || !tokenContract || !tokenId}
                      startIcon={loading ? <CircularProgress size={20} /> : <GavelIcon />}
                    >
                      {loading ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </Box>
                  
                  {complianceReport && (
                    <Box>
                      {/* Compliance Score */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">
                            Compliance Score
                          </Typography>
                          <Typography 
                            variant="h6" 
                            sx={{ color: getComplianceScoreColor(complianceReport.complianceScore) }}
                          >
                            {complianceReport.complianceScore}/100
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={complianceReport.complianceScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getComplianceScoreColor(complianceReport.complianceScore)
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {RightsVerificationService.formatComplianceScore(complianceReport.complianceScore)} compliance level
                        </Typography>
                      </Box>
                      
                      {/* Compliance Status */}
                      <Alert 
                        severity={complianceReport.compliant ? 'success' : 'warning'}
                        sx={{ mb: 3 }}
                      >
                        {complianceReport.compliant 
                          ? 'Content is fully compliant with legal requirements'
                          : `${complianceReport.issues.length} compliance issue(s) detected`
                        }
                      </Alert>
                      
                      {/* Issues */}
                      {complianceReport.issues.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Compliance Issues
                          </Typography>
                          {complianceReport.issues.map((issue, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Chip
                                    label={issue.severity}
                                    size="small"
                                    sx={{ 
                                      backgroundColor: getSeverityColor(issue.severity),
                                      color: 'white'
                                    }}
                                  />
                                  <Typography variant="subtitle2">
                                    {issue.type}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {issue.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Recommendation:</strong> {issue.recommendation}
                                </Typography>
                                {issue.legalReference && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    <strong>Legal Reference:</strong> {issue.legalReference}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                      
                      {/* Recommendations */}
                      {complianceReport.recommendations.length > 0 && (
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            Recommendations
                          </Typography>
                          <List>
                            {complianceReport.recommendations.map((recommendation, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <InfoIcon color="info" />
                                </ListItemIcon>
                                <ListItemText primary={recommendation} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Rights Profile */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Comprehensive Rights Profile
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleLoadRightsProfile}
                      disabled={loading || !tokenContract || !tokenId}
                      startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                    >
                      {loading ? 'Loading...' : 'Load Profile'}
                    </Button>
                  </Box>
                  
                  {rightsProfile && (
                    <Grid container spacing={3}>
                      {/* Rights Configuration */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Rights Configuration
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Thresholds
                              </Typography>
                              <Typography variant="body1">
                                {rightsProfile.rightsConfiguration.thresholds}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Conflicts
                              </Typography>
                              <Badge badgeContent={rightsProfile.rightsConfiguration.conflicts} color="error">
                                <Typography variant="body1">
                                  {rightsProfile.rightsConfiguration.conflicts === 0 ? 'No conflicts' : 'Conflicts detected'}
                                </Typography>
                              </Badge>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Compliance Score
                              </Typography>
                              <Typography 
                                variant="h6" 
                                sx={{ color: getComplianceScoreColor(rightsProfile.rightsConfiguration.complianceScore) }}
                              >
                                {rightsProfile.rightsConfiguration.complianceScore}/100
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Legal Compliance */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Legal Compliance
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Status
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {rightsProfile.legalCompliance.compliant ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <WarningIcon color="warning" fontSize="small" />
                                )}
                                <Typography variant="body1">
                                  {rightsProfile.legalCompliance.compliant ? 'Compliant' : 'Non-compliant'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Issues
                              </Typography>
                              <Typography variant="body1">
                                {rightsProfile.legalCompliance.issues} issue(s)
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Next Review
                              </Typography>
                              <Typography variant="body1">
                                {new Date(rightsProfile.legalCompliance.nextReview).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {/* Security Status */}
                      <Grid item xs={12} md={4}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Security Status
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Conflicts Detected
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {rightsProfile.securityStatus.conflictsDetected ? (
                                  <WarningIcon color="warning" fontSize="small" />
                                ) : (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                )}
                                <Typography variant="body1">
                                  {rightsProfile.securityStatus.conflictsDetected ? 'Yes' : 'No'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Critical Issues
                              </Typography>
                              <Typography variant="body1" color={rightsProfile.securityStatus.criticalIssues > 0 ? 'error' : 'success'}>
                                {rightsProfile.securityStatus.criticalIssues}
                              </Typography>
                            </Box>
                            {rightsProfile.securityStatus.recommendedActions.length > 0 && (
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Recommended Actions
                                </Typography>
                                {rightsProfile.securityStatus.recommendedActions.slice(0, 2).map((action, index) => (
                                  <Chip
                                    key={index}
                                    label={action}
                                    size="small"
                                    color="info"
                                    sx={{ mr: 1, mb: 1 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 5: Rights Bundles */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Available Rights Bundles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pre-configured rights packages for common use cases in the entertainment industry
              </Typography>
            </Grid>
            
            {rightsBundles.map((bundle, index) => (
              <Grid item xs={12} md={6} lg={4} key={bundle.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {bundle.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {bundle.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Minimum Tokens Required
                      </Typography>
                      <Chip label={`${bundle.minimumTokens} tokens`} color="primary" size="small" />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Rights Included
                      </Typography>
                      {bundle.rightsIncluded.map((right, rightIndex) => (
                        <Chip
                          key={rightIndex}
                          label={right.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Jurisdiction
                      </Typography>
                      <Typography variant="body2">
                        {bundle.legalFramework.jurisdiction}
                      </Typography>
                    </Box>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">
                          Legal Framework Details
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Applicable Laws
                          </Typography>
                          {bundle.legalFramework.applicableLaws.map((law, lawIndex) => (
                            <Typography key={lawIndex} variant="body2" sx={{ mb: 0.5 }}>
                              • {law}
                            </Typography>
                          ))}
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Restrictions
                          </Typography>
                          {bundle.legalFramework.restrictions.map((restriction, restrictionIndex) => (
                            <Typography key={restrictionIndex} variant="body2" sx={{ mb: 0.5 }}>
                              • {restriction}
                            </Typography>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh Data
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={!complianceReport}
                  onClick={() => {
                    if (complianceReport) {
                      const dataStr = JSON.stringify(complianceReport, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `compliance-report-${tokenContract}-${tokenId}.json`;
                      link.click();
                    }
                  }}
                >
                  Export Report
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  onClick={() => setActiveTab(3)}
                >
                  View Profile
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  onClick={() => setActiveTab(4)}
                >
                  Browse Bundles
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default RightsVerificationDashboard; 