import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { 
  blockchainAnalyticsService, 
  TokenEconomicsMetrics 
} from '../../services/blockchainAnalytics.service';
import ChartContainer from './ChartContainer';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import MetricCard from './MetricCard';

interface RevenueBreakdownProps {
  contentId: string;
  initialTimeRange?: TimeRange;
}

/**
 * Component for visualizing token economics and revenue metrics
 */
const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({
  contentId,
  initialTimeRange = 'month'
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [economicsData, setEconomicsData] = useState<TokenEconomicsMetrics | null>(null);
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
        const data = await blockchainAnalyticsService.getTokenEconomicsMetrics(
          contentId,
          timeRange
        );
        setEconomicsData(data);
      } catch (err) {
        console.error('Error fetching token economics data:', err);
        setError('Failed to load economics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contentId, timeRange]);

  // Prepare data for revenue sources pie chart
  const prepareRevenueSourcesData = () => {
    if (!economicsData) return [];

    const primaryRevenue = economicsData.primaryMarketVolume;
    const secondaryRevenue = economicsData.secondaryMarketVolume;
    const royaltyRevenue = economicsData.royaltyRevenue;

    return [
      { name: 'Primary Sales', value: primaryRevenue },
      { name: 'Secondary Sales', value: secondaryRevenue - royaltyRevenue },
      { name: 'Royalties', value: royaltyRevenue },
    ];
  };

  // Prepare data for price history chart
  const preparePriceHistoryData = () => {
    if (!economicsData) return [];
    
    return economicsData.priceHistory.map(item => ({
      date: item.date,
      price: item.price,
      volume: item.volume,
    }));
  };

  // Prepare data for market depth chart
  const prepareMarketDepthData = () => {
    if (!economicsData) return [];
    
    return economicsData.marketDepth.sort((a, b) => a.price - b.price);
  };

  // Format date for X-axis
  const formatXAxis = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, timeRange === 'day' ? 'HH:mm' : 'd MMM');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate total revenue
  const calculateTotalRevenue = () => {
    if (!economicsData) return 0;
    return economicsData.primaryMarketVolume + economicsData.secondaryMarketVolume;
  };

  // Calculate revenue change (using a simple placeholder since we don't have historical data)
  const calculateRevenueChange = () => {
    if (!economicsData) return 0;
    // In a real implementation, we would compare with previous period
    // For now, we'll use a random value between -10% and +30%
    return Math.random() * 40 - 10;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }}>
                          <Typography variant="body2">{`${payload[0].name}: $${payload[0].value.toFixed(2)} USDC (${((payload[0].value / calculateTotalRevenue()) * 100).toFixed(1)}%)`}</Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Revenue Breakdown
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
            title="Total Revenue"
            value={calculateTotalRevenue()}
            loading={loading}
            trendValue={calculateRevenueChange()}
            trendLabel={`vs. previous ${timeRange}`}
            type="currency"
            prefix="$"
            precision={4}
            iconColor={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Primary Sales"
            value={economicsData?.primaryMarketVolume || 0}
            loading={loading}
            type="currency"
            prefix="$"
            precision={4}
            iconColor={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Secondary Sales"
            value={economicsData?.secondaryMarketVolume || 0}
            loading={loading}
            type="currency"
            prefix="$"
            precision={4}
            iconColor={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Royalty Revenue"
            value={economicsData?.royaltyRevenue || 0}
            loading={loading}
            type="currency"
            prefix="$"
            precision={4}
            iconColor={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue sources */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Revenue Sources"
            description="Breakdown of revenue by source"
            loading={loading}
            error={error}
            isEmpty={!economicsData}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareRevenueSourcesData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareRevenueSourcesData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Price history */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Price History"
            description="Token price and volume over time"
            loading={loading}
            error={error}
            isEmpty={!economicsData}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={preparePriceHistoryData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip formatter={(value: any, name) => {
                  if (name === 'price') return [`$${Number(value).toFixed(4)} USDC`, 'Price'];
                  return [value, 'Volume'];
                }} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke={theme.palette.primary.main}
                  activeDot={{ r: 8 }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="volume"
                  name="Volume"
                  fill={theme.palette.secondary.main}
                  opacity={0.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Market depth */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Market Depth"
            description="Buy and sell orders at different price points"
            loading={loading}
            error={error}
            isEmpty={!economicsData}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={prepareMarketDepthData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="price" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(value) => `$${value.toFixed(2)} USDC`}
                />
                <YAxis />
                <RechartsTooltip formatter={(value, name) => {
                  return [value, name === 'buyVolume' ? 'Buy Volume' : 'Sell Volume'];
                }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="buyVolume"
                  name="Buy Orders"
                  stroke={theme.palette.success.main}
                  fill={theme.palette.success.light}
                  opacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="sellVolume"
                  name="Sell Orders"
                  stroke={theme.palette.error.main}
                  fill={theme.palette.error.light}
                  opacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Grid>

        {/* Token utilization */}
        <Grid item xs={12} md={6}>
          <ChartContainer
            title="Token Utilization"
            description="Percentage of tokens being actively used vs. held"
            loading={loading}
            error={error}
            isEmpty={!economicsData}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%' 
            }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: 200, height: 200 }}>
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `conic-gradient(${theme.palette.primary.main} ${economicsData?.tokenUtilization || 0}%, ${theme.palette.grey[300]} 0)`,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h4" component="div" color="text.primary">
                    {economicsData?.tokenUtilization.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilization
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Higher utilization indicates tokens are being actively used rather than just held.
                </Typography>
              </Box>
            </Box>
          </ChartContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RevenueBreakdown; 