import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
} from 'recharts';
import InfoIcon from '@mui/icons-material/Info';
import { 
  blockchainAnalyticsService, 
  TokenPerformanceMetrics,
  TokenHolderCategory,
  ContentHolderDistribution,
  WalletProfile
} from '../../services/blockchainAnalytics.service';
import ChartContainer from './ChartContainer';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import MetricCard from './MetricCard';

interface TokenHolderAnalyticsProps {
  contentId: string;
  initialTimeRange?: TimeRange;
}

/**
 * Component for analyzing token holder distribution and behavior
 */
const TokenHolderAnalytics: React.FC<TokenHolderAnalyticsProps> = ({
  contentId,
  initialTimeRange = 'month'
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [metrics, setMetrics] = useState<TokenPerformanceMetrics | null>(null);
  const [holderDistribution, setHolderDistribution] = useState<ContentHolderDistribution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch token performance metrics
        const metricsData = await blockchainAnalyticsService.getTokenPerformanceMetrics(
          contentId,
          timeRange
        );
        setMetrics(metricsData);

        // Fetch holder distribution
        const distributionData = await blockchainAnalyticsService.getContentHolderDistribution(
          contentId
        );
        setHolderDistribution(distributionData);
      } catch (err) {
        console.error('Error fetching token holder analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contentId, timeRange]);

  // Prepare data for holder category pie chart
  const prepareHolderCategoryData = () => {
    if (!metrics) return [];

    return [
      { name: 'Personal Viewers', value: metrics.holderCategories.personalViewers },
      { name: 'Small Exhibitors', value: metrics.holderCategories.smallExhibitors },
      { name: 'Large Exhibitors', value: metrics.holderCategories.largeExhibitors },
      { name: 'Speculators', value: metrics.holderCategories.speculators },
    ];
  };

  // Prepare data for holder size distribution chart
  const prepareHolderSizeData = () => {
    if (!metrics) return [];

    return [
      { name: 'Small Holders (1-5)', value: metrics.distribution.smallHolders },
      { name: 'Medium Holders (6-50)', value: metrics.distribution.mediumHolders },
      { name: 'Large Holders (51+)', value: metrics.distribution.largeHolders },
    ];
  };

  // Prepare data for holding period chart
  const prepareHoldingPeriodData = () => {
    if (!holderDistribution) return [];

    // Group holders by holding period
    const now = new Date();
    const periods = {
      '0-30 days': 0,
      '31-90 days': 0,
      '91-180 days': 0,
      '180+ days': 0,
    };

    holderDistribution.holderDistribution.forEach(holder => {
      const acquisitionDate = new Date(holder.acquisitionDate);
      const daysDiff = Math.floor((now.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30) {
        periods['0-30 days'] += holder.tokenCount;
      } else if (daysDiff <= 90) {
        periods['31-90 days'] += holder.tokenCount;
      } else if (daysDiff <= 180) {
        periods['91-180 days'] += holder.tokenCount;
      } else {
        periods['180+ days'] += holder.tokenCount;
      }
    });

    return Object.entries(periods).map(([name, value]) => ({ name, value }));
  };

  // Prepare data for token concentration chart
  const prepareTokenConcentrationData = () => {
    if (!holderDistribution) return [];

    // Sort holders by token count (descending)
    const sortedHolders = [...holderDistribution.holderDistribution]
      .sort((a, b) => b.tokenCount - a.tokenCount);

    // Calculate cumulative percentage
    let totalTokens = sortedHolders.reduce((sum, holder) => sum + holder.tokenCount, 0);
    let cumulativeTokens = 0;
    
    const concentrationData = sortedHolders.slice(0, 10).map((holder, index) => {
      cumulativeTokens += holder.tokenCount;
      return {
        rank: `Top ${index + 1}`,
        tokens: holder.tokenCount,
        percentage: (holder.tokenCount / totalTokens) * 100,
        cumulative: (cumulativeTokens / totalTokens) * 100,
        category: holder.category
      };
    });

    return concentrationData;
  };

  // Custom tooltip for pie charts
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }}>
          <Typography variant="body2">{`${payload[0].name}: ${payload[0].value}%`}</Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Token Holder Analytics
        </Typography>
        <TimeRangeSelector 
          value={timeRange} 
          onChange={setTimeRange}
          availableRanges={['week', 'month', 'quarter', 'year', 'all']}
        />
      </Box>

      {/* Key metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Token Holders"
            value={metrics?.distribution.totalHolders || 0}
            loading={loading}
            icon={<InfoIcon />}
            iconColor={theme.palette.primary.main}
            tooltip="Unique wallet addresses holding tokens"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Token Health Score"
            value={metrics?.distribution.healthScore || 0}
            type="percentage"
            loading={loading}
            icon={<InfoIcon />}
            iconColor={theme.palette.success.main}
            tooltip="Score based on distribution balance and velocity (higher is better)"
            suffix="/100"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Holding Period"
            value={metrics?.velocity.averageHoldingPeriod || 0}
            loading={loading}
            icon={<InfoIcon />}
            iconColor={theme.palette.info.main}
            tooltip="Average number of days tokens are held before transfer"
            suffix=" days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Daily Active Holders"
            value={metrics?.velocity.dailyActiveHolders || 0}
            loading={loading}
            icon={<InfoIcon />}
            iconColor={theme.palette.warning.main}
            tooltip="Number of holders active in the last 24 hours"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Holder category distribution */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Holder Category Distribution"
            description="Distribution of token holders by category"
            loading={loading}
            error={error}
            isEmpty={!metrics}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareHolderCategoryData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareHolderCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Holder size distribution */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Holder Size Distribution"
            description="Distribution of token holders by token quantity"
            loading={loading}
            error={error}
            isEmpty={!metrics}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareHolderSizeData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Token holding period */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Token Holding Period"
            description="Distribution of tokens by holding period"
            loading={loading}
            error={error}
            isEmpty={!holderDistribution}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareHoldingPeriodData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Token concentration */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Token Concentration"
            description="Percentage of tokens held by top holders"
            loading={loading}
            error={error}
            isEmpty={!holderDistribution}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={prepareTokenConcentrationData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rank" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="% of Total Supply"
                  stroke={theme.palette.primary.main}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative %"
                  stroke={theme.palette.error.main}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TokenHolderAnalytics; 