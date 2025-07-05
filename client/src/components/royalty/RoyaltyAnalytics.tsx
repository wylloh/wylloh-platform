import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import RoyaltyService, { RoyaltyAnalytics, RoyaltyDistribution } from '../../services/royalty.service';

interface RoyaltyAnalyticsProps {
  userAddress?: string;
  tokenContract?: string;
  tokenId?: string;
  viewType: 'user' | 'token' | 'overview';
}

interface AnalyticsData {
  analytics: RoyaltyAnalytics;
  distributions: RoyaltyDistribution[];
  generatedAt: string;
}

const RoyaltyAnalyticsDashboard: React.FC<RoyaltyAnalyticsProps> = ({
  userAddress,
  tokenContract,
  tokenId,
  viewType
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const royaltyService = new RoyaltyService();

  useEffect(() => {
    loadAnalytics();
  }, [userAddress, tokenContract, tokenId, viewType, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      let analytics: any;
      let distributions: RoyaltyDistribution[] = [];

      if (viewType === 'user' && userAddress) {
        const result = await royaltyService.getRecipientAnalytics(userAddress);
        analytics = result.analytics;
        setAnalyticsData({
          analytics,
          distributions,
          generatedAt: result.generatedAt
        });
      } else if (viewType === 'token' && tokenContract && tokenId) {
        const result = await royaltyService.getTokenAnalytics(tokenContract, tokenId);
        analytics = result.analytics;
        
        // Also load distribution history for the token
        const historyResult = await royaltyService.getDistributionHistory(tokenContract, tokenId);
        distributions = historyResult.distributions;
        
        setAnalyticsData({
          analytics,
          distributions,
          generatedAt: result.generatedAt
        });
      } else if (viewType === 'overview') {
        const result = await royaltyService.getRoyaltyOverview();
        setAnalyticsData({
          analytics: result,
          distributions: [],
          generatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAlert({ type: 'error', message: 'Failed to load analytics data' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string, currency: string = 'USDC') => {
    const num = parseFloat(amount);
    if (num === 0) return `0 ${currency}`;
    if (num < 0.0001) return `< 0.0001 ${currency}`;
    return `${num.toFixed(4)} ${currency}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTopRecipients = () => {
    if (!analyticsData?.analytics.topRecipients) return [];
    return analyticsData.analytics.topRecipients.slice(0, 5);
  };

  const getRecentDistributions = () => {
    if (!analyticsData?.distributions) return [];
    return analyticsData.distributions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="error">
        No analytics data available
      </Alert>
    );
  }

  const { analytics } = analyticsData;

  return (
    <Box>
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Royalty Analytics
          {viewType === 'user' && ' - Your Earnings'}
          {viewType === 'token' && ' - Token Performance'}
          {viewType === 'overview' && ' - Platform Overview'}
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export functionality would go here
              setAlert({ type: 'info', message: 'Export functionality coming soon!' });
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WalletIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Total Distributed
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(analytics.totalDistributed)}
              </Typography>
              <Typography variant="body2" color="success.main">
                +{formatPercentage(12.5)} vs last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Total Withdrawn
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(analytics.totalWithdrawn)}
              </Typography>
              <Typography variant="body2" color="info.main">
                {formatPercentage((parseFloat(analytics.totalWithdrawn) / parseFloat(analytics.totalDistributed)) * 100)} of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Pending Balance
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(analytics.pendingBalance)}
              </Typography>
              <Typography variant="body2" color="warning.main">
                Available for withdrawal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Avg Distribution
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(analytics.averageDistribution)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analytics.distributionCount} distributions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Distribution Activity */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribution Activity
              </Typography>
              {analytics.distributionCount === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    No distribution activity yet
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="primary">
                          {analytics.distributionCount}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Distributions
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="secondary">
                          {analytics.recipientCount}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Active Recipients
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="success.main">
                          {formatPercentage((parseFloat(analytics.totalWithdrawn) / parseFloat(analytics.totalDistributed)) * 100)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Withdrawal Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Distribution Progress */}
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Distribution vs Withdrawal Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(parseFloat(analytics.totalWithdrawn) / parseFloat(analytics.totalDistributed)) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Recipients
              </Typography>
              {getTopRecipients().length === 0 ? (
                <Typography color="textSecondary">
                  No recipient data available
                </Typography>
              ) : (
                <Box>
                  {getTopRecipients().map((recipient, index) => (
                    <Box key={index} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontFamily="monospace">
                          {`${recipient.address.slice(0, 6)}...${recipient.address.slice(-4)}`}
                        </Typography>
                        <Chip 
                          label={`${formatPercentage(recipient.sharePercentage / 100)}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary">
                          Total Earned
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(recipient.totalEarned)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(parseFloat(recipient.totalEarned) / parseFloat(analytics.totalDistributed)) * 100}
                        sx={{ mt: 1, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Distributions Table */}
      {viewType === 'token' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Distributions
            </Typography>
            {getRecentDistributions().length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No recent distributions
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Recipients</TableCell>
                      <TableCell>Transaction</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getRecentDistributions().map((distribution, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(distribution.timestamp * 1000).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(distribution.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${distribution.recipients.length} recipients`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={distribution.transactionHash}>
                            <Typography variant="body2" fontFamily="monospace">
                              {`${distribution.transactionHash.slice(0, 6)}...${distribution.transactionHash.slice(-4)}`}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label="Completed"
                            size="small"
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data timestamp */}
      <Box mt={2} textAlign="center">
        <Typography variant="caption" color="textSecondary">
          Data generated at: {new Date(analyticsData.generatedAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default RoyaltyAnalyticsDashboard; 