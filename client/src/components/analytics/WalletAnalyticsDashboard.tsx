import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  AccountBalanceWallet,
  SwapHoriz,
  Token,
  Speed,
  CheckCircle,
  Error,
  Pending,
  Search,
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import walletAnalyticsService, {
  WalletTransactionAnalytics,
  WalletTokenAnalytics,
  TimeRange,
} from '../../services/walletAnalytics.service';
import MetricCard from './MetricCard';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      style={{ paddingTop: '24px' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const WalletAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const { account, active } = useWallet();
  
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customWallet, setCustomWallet] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [transactionAnalytics, setTransactionAnalytics] = useState<WalletTransactionAnalytics | null>(null);
  const [tokenAnalytics, setTokenAnalytics] = useState<WalletTokenAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default wallet when connected
  useEffect(() => {
    if (active && account && !selectedWallet) {
      setSelectedWallet(account);
    }
  }, [active, account, selectedWallet]);

  // Fetch analytics data when wallet or time range changes
  useEffect(() => {
    if (selectedWallet) {
      fetchAnalyticsData();
    }
  }, [selectedWallet, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    setError(null);

    try {
      const [transactionData, tokenData] = await Promise.all([
        walletAnalyticsService.getWalletTransactionAnalytics(selectedWallet, { timeRange }),
        walletAnalyticsService.getWalletTokenAnalytics(selectedWallet, { timeRange }),
      ]);

      setTransactionAnalytics(transactionData);
      setTokenAnalytics(tokenData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<TimeRange>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  const handleWalletSearch = () => {
    if (customWallet.trim()) {
      setSelectedWallet(customWallet.trim());
    }
  };

  const handleUseConnectedWallet = () => {
    if (account) {
      setSelectedWallet(account);
      setCustomWallet('');
    }
  };

  // Chart colors
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  // Render transaction overview metrics
  const renderTransactionMetrics = () => {
    if (!transactionAnalytics) return null;

    const { summary } = transactionAnalytics;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Transactions"
            value={summary.totalTransactions.toLocaleString()}
            icon={<SwapHoriz />}
            iconColor={chartColors.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Success Rate"
            value={`${summary.successRate.toFixed(1)}%`}
            icon={<CheckCircle />}
            iconColor={chartColors.success}
            tooltip={`${summary.successfulTransactions} successful transactions`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Gas Used"
            value={summary.totalGasUsed.toLocaleString()}
            icon={<Speed />}
            iconColor={chartColors.info}
            tooltip={`Average: ${Math.round(summary.averageGasUsed).toLocaleString()}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Failed Transactions"
            value={summary.failedTransactions.toLocaleString()}
            icon={<Error />}
            iconColor={chartColors.error}
            tooltip={`${summary.pendingTransactions} pending transactions`}
          />
        </Grid>
      </Grid>
    );
  };

  // Render transaction timeline chart
  const renderTransactionTimeline = () => {
    if (!transactionAnalytics?.breakdown.byDay) return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction Timeline
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={transactionAnalytics.breakdown.byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="successful"
                stackId="1"
                stroke={chartColors.success}
                fill={chartColors.success}
                fillOpacity={0.6}
                name="Successful"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stackId="1"
                stroke={chartColors.error}
                fill={chartColors.error}
                fillOpacity={0.6}
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render chain distribution chart
  const renderChainDistribution = () => {
    if (!transactionAnalytics?.breakdown.byChain) return null;

    const chainData = Object.entries(transactionAnalytics.breakdown.byChain).map(([chain, count]) => ({
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      value: count,
    }));

    const COLORS = [chartColors.primary, chartColors.secondary, chartColors.info, chartColors.warning];

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transactions by Chain
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chainData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chainData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render token analytics metrics
  const renderTokenMetrics = () => {
    if (!tokenAnalytics) return null;

    const { summary } = tokenAnalytics;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Unique Tokens"
            value={summary.uniqueTokens.toLocaleString()}
            icon={<Token />}
            iconColor={chartColors.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Activities"
            value={summary.totalTokenActivities.toLocaleString()}
            icon={<TrendingUp />}
            iconColor={chartColors.secondary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Most Active Token"
            value={summary.mostActiveToken?.totalTransfers.toString() || '0'}
            icon={<Token />}
            iconColor={chartColors.info}
            tooltip={summary.mostActiveToken ? `Token #${summary.mostActiveToken.tokenId}` : 'No active tokens'}
          />
        </Grid>
      </Grid>
    );
  };

  // Render token activity timeline
  const renderTokenTimeline = () => {
    if (!tokenAnalytics?.timeline) return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Token Activity Timeline
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenAnalytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill={chartColors.primary} name="Total Activities" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Render wallet selector
  const renderWalletSelector = () => (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Wallet Analytics
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Wallet Address"
            value={customWallet}
            onChange={(e) => setCustomWallet(e.target.value)}
            placeholder="Enter wallet address to analyze"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleWalletSearch}
                    startIcon={<Search />}
                  >
                    Analyze
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          {active && account && (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleUseConnectedWallet}
              startIcon={<AccountBalanceWallet />}
            >
              Use Connected Wallet
            </Button>
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="day">Last Day</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {selectedWallet && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Analyzing wallet: 
          </Typography>
          <Chip 
            label={`${selectedWallet.slice(0, 6)}...${selectedWallet.slice(-4)}`}
            color="primary"
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
      )}
    </Paper>
  );

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {renderWalletSelector()}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {renderWalletSelector()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {selectedWallet && !loading && (
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Transaction Analytics" />
            <Tab label="Token Analytics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {renderTransactionMetrics()}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                {renderTransactionTimeline()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderChainDistribution()}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderTokenMetrics()}
            {renderTokenTimeline()}
          </TabPanel>
        </Paper>
      )}

      {!selectedWallet && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Select a Wallet to Analyze
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter a wallet address or connect your wallet to view detailed analytics.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default WalletAnalyticsDashboard; 