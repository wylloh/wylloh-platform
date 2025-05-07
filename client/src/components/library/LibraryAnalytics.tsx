import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

interface LibraryAnalyticsProps {
  libraryId: string;
}

interface AnalyticsData {
  totalValue: number;
  valueHistory: Array<{
    value: number;
    timestamp: string;
    change?: number;
    changePercentage?: number;
  }>;
  lendingMetrics: {
    totalLends: number;
    totalRevenue: number;
    averageLendDuration: number;
    activeLends?: number;
  };
  engagementMetrics: {
    totalViews: number;
    uniqueViewers: number;
    averageWatchTime: number;
    shares?: number;
  };
  genreDistribution?: {
    name: string;
    value: number;
  }[];
}

// Sample data for development
const generateSampleData = (): AnalyticsData => {
  const today = new Date();
  const valueHistory = [];
  let currentValue = 1200;
  
  // Generate 90 days of history
  for (let i = 90; i >= 0; i--) {
    const date = subDays(today, i);
    // Random change between -2% and +3%
    const change = currentValue * (Math.random() * 0.05 - 0.02);
    currentValue += change;
    valueHistory.push({
      timestamp: date.toISOString(),
      value: Math.round(currentValue),
      change: Math.round(change),
      changePercentage: Math.round((change / (currentValue - change)) * 1000) / 10,
    });
  }
  
  return {
    totalValue: Math.round(currentValue),
    valueHistory,
    lendingMetrics: {
      totalLends: 24,
      totalRevenue: 320,
      averageLendDuration: 5.2,
      activeLends: 3,
    },
    engagementMetrics: {
      totalViews: 142,
      uniqueViewers: 87,
      averageWatchTime: 45.5,
      shares: 12,
    },
    genreDistribution: [
      { name: 'Drama', value: 35 },
      { name: 'Sci-Fi', value: 20 },
      { name: 'Documentary', value: 15 },
      { name: 'Comedy', value: 10 },
      { name: 'Thriller', value: 10 },
      { name: 'Other', value: 10 },
    ],
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#D2B4DE'];

const LibraryAnalytics: React.FC<LibraryAnalyticsProps> = ({ libraryId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/library-analytics/${libraryId}?period=${period}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Fall back to sample data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using sample data for analytics');
          setAnalytics(generateSampleData());
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // In development, use sample data
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        setAnalytics(generateSampleData());
        setLoading(false);
      }, 1000); // Simulate network delay
    } else {
      fetchAnalytics();
    }
  }, [libraryId, period]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box p={3}>
        <Alert severity="info">No analytics data available for this library.</Alert>
      </Box>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Filter value history based on selected period
  const getFilteredValueHistory = () => {
    const today = new Date();
    let cutoffDate;
    
    switch (period) {
      case '7d':
        cutoffDate = subDays(today, 7);
        break;
      case '30d':
        cutoffDate = subDays(today, 30);
        break;
      case '1y':
        cutoffDate = subMonths(today, 12);
        break;
      default:
        cutoffDate = subDays(today, 30);
    }
    
    return analytics.valueHistory.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    );
  };

  const filteredHistory = getFilteredValueHistory();
  
  // Calculate performance metrics
  const firstValue = filteredHistory[0]?.value || 0;
  const lastValue = filteredHistory[filteredHistory.length - 1]?.value || 0;
  const valueChange = lastValue - firstValue;
  const percentageChange = firstValue > 0 ? (valueChange / firstValue) * 100 : 0;
  
  // Format percentage with + or - sign
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Library Analytics</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="1y">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Value
            </Typography>
            <Typography variant="h4" gutterBottom>
              {formatCurrency(analytics.totalValue)}
            </Typography>
            <Typography 
              variant="body2" 
              color={percentageChange >= 0 ? 'success.main' : 'error.main'}
            >
              {formatPercentage(percentageChange)} ({period})
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Lending Revenue
            </Typography>
            <Typography variant="h4" gutterBottom>
              {formatCurrency(analytics.lendingMetrics.totalRevenue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analytics.lendingMetrics.totalLends} total lends
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Views
            </Typography>
            <Typography variant="h4" gutterBottom>
              {analytics.engagementMetrics.totalViews}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analytics.engagementMetrics.uniqueViewers} unique viewers
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Avg. Watch Time
            </Typography>
            <Typography variant="h4" gutterBottom>
              {formatDuration(analytics.engagementMetrics.averageWatchTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per view
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Value Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Library Value History
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value: string) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label: string) => format(new Date(label), 'MMM d, yyyy')}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2196f3"
                      fill="#2196f3"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Genre Distribution */}
        {analytics.genreDistribution && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Genre Distribution
                </Typography>
                <Box height={300} display="flex" justifyContent="center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.genreDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.genreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Lending Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lending Activity
              </Typography>
              <Box height={300}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Lends
                    </Typography>
                    <Typography variant="h4">
                      {analytics.lendingMetrics.totalLends}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(analytics.lendingMetrics.totalRevenue)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Avg. Duration
                    </Typography>
                    <Typography variant="h4">
                      {analytics.lendingMetrics.averageLendDuration.toFixed(1)} days
                    </Typography>
                  </Grid>
                </Grid>
                
                <ResponsiveContainer width="100%" height="65%">
                  <BarChart
                    data={[
                      { name: 'Revenue', current: analytics.lendingMetrics.totalRevenue, previous: analytics.lendingMetrics.totalRevenue * 0.7 },
                      { name: 'Lends', current: analytics.lendingMetrics.totalLends, previous: analytics.lendingMetrics.totalLends * 0.8 },
                      { name: 'Active', current: analytics.lendingMetrics.activeLends || 0, previous: (analytics.lendingMetrics.activeLends || 0) * 1.2 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Current Period" dataKey="current" fill="#8884d8" />
                    <Bar name="Previous Period" dataKey="previous" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Engagement
              </Typography>
              <Box height={300}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Views
                    </Typography>
                    <Typography variant="h4">
                      {analytics.engagementMetrics.totalViews}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Unique Viewers
                    </Typography>
                    <Typography variant="h4">
                      {analytics.engagementMetrics.uniqueViewers}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Avg. Watch Time
                    </Typography>
                    <Typography variant="h4">
                      {formatDuration(analytics.engagementMetrics.averageWatchTime)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <ResponsiveContainer width="100%" height="65%">
                  <LineChart
                    data={[
                      { name: 'Week 1', views: Math.round(analytics.engagementMetrics.totalViews * 0.2) },
                      { name: 'Week 2', views: Math.round(analytics.engagementMetrics.totalViews * 0.15) },
                      { name: 'Week 3', views: Math.round(analytics.engagementMetrics.totalViews * 0.3) },
                      { name: 'Week 4', views: Math.round(analytics.engagementMetrics.totalViews * 0.35) },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LibraryAnalytics; 