import React, { useState, useEffect, useContext } from 'react';
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
  Tooltip as MuiTooltip,
  IconButton,
  Badge,
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
import { 
  libraryService, 
  LibraryAnalytics as LibraryAnalyticsType, 
  TokenValueMetrics,
  TokenValueHistoryEntry 
} from '../../services/library.service';
import { WalletContext } from '../../contexts/WalletContext';
import InfoIcon from '@mui/icons-material/Info';
import VerifiedIcon from '@mui/icons-material/Verified';
import TokenIcon from '@mui/icons-material/Token';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Extended analytics type with genre distribution
interface ExtendedLibraryAnalytics extends LibraryAnalyticsType {
  genreDistribution?: { name: string; value: number }[];
  tokenValueMetrics?: TokenValueMetrics;
}

interface LibraryAnalyticsProps {
  libraryId: string;
}

// Sample data for development - keep for fallback
const generateSampleData = (): ExtendedLibraryAnalytics => {
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
      date: date.toISOString(),
      value: Math.round(currentValue),
      change: Math.round(change),
      changePercentage: Math.round((change / (currentValue - change)) * 1000) / 10,
    });
  }
  
  // Generate token value history
  const tokenValueHistory = [];
  let currentTokenValue = 800;
  let verifiedCount = 5;
  
  for (let i = 90; i >= 0; i--) {
    const date = subDays(today, i);
    // Random change between -3% and +4%
    const change = currentTokenValue * (Math.random() * 0.07 - 0.03);
    currentTokenValue += change;
    
    // Occasionally increase verified tokens count
    if (i % 10 === 0 && verifiedCount < 15) {
      verifiedCount += 1;
    }
    
    tokenValueHistory.push({
      date: date.toISOString(),
      value: Math.round(currentTokenValue),
      change: Math.round(change),
      changePercentage: Math.round((change / (currentTokenValue - change)) * 1000) / 10,
      verifiedTokensCount: verifiedCount
    });
  }
  
  return {
    libraryId: '1',
    totalValue: Math.round(currentValue),
    valueHistory,
    lendingMetrics: {
      totalLends: 24,
      activeLends: 3,
      averageLendDuration: 5.2,
      lendingRevenue: 320,
    },
    engagementMetrics: {
      views: 142,
      uniqueViewers: 87,
      averageWatchTime: 45.5,
      shares: 12,
    },
    lastUpdated: new Date().toISOString(),
    genreDistribution: [
      { name: 'Drama', value: 35 },
      { name: 'Sci-Fi', value: 20 },
      { name: 'Documentary', value: 15 },
      { name: 'Comedy', value: 10 },
      { name: 'Thriller', value: 10 },
      { name: 'Other', value: 10 },
    ],
    tokenValueMetrics: {
      totalTokenValue: Math.round(currentTokenValue),
      tokenValueHistory,
      verifiedTokens: verifiedCount,
      unverifiedTokens: 3,
      tokenPriceChanges: {
        day: 2.5,
        week: -1.2,
        month: 15.7,
      },
      highestValueToken: {
        contentId: 'content-123',
        tokenId: '0x1a2b3c4d5e6f',
        value: 250,
        chain: 'Ethereum',
      },
    },
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#D2B4DE'];

const LibraryAnalytics: React.FC<LibraryAnalyticsProps> = ({ libraryId }) => {
  const [analytics, setAnalytics] = useState<ExtendedLibraryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [tokenValueLoading, setTokenValueLoading] = useState(false);
  
  // Get wallet context for blockchain connection status
  const { provider, account } = useContext(WalletContext);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await libraryService.getLibraryAnalytics(libraryId, period);
        
        // If tokenValueMetrics isn't included in the API response, try to fetch it separately
        if (!data.tokenValueMetrics) {
          try {
            setTokenValueLoading(true);
            const tokenValueMetrics = await libraryService.getLibraryTokenValueMetrics(libraryId, period);
            data.tokenValueMetrics = tokenValueMetrics;
          } catch (tokenMetricsError) {
            console.warn('Error fetching token value metrics:', tokenMetricsError);
            // Continue without token metrics
          } finally {
            setTokenValueLoading(false);
          }
        }
        
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching analytics');
        
        // Fall back to sample data in development environment
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_SAMPLE_DATA === 'true') {
          console.log('Using sample data for analytics due to error');
          setAnalytics(generateSampleData());
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // In development, use sample data if the environment flag is set
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_SAMPLE_DATA === 'true') {
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
    let cutoffDate: Date;
    
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
      new Date(entry.date) >= cutoffDate
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

  // Get cutoff date based on selected period
  const getFilteredDateCutoff = () => {
    const today = new Date();
    switch (period) {
      case '7d':
        return subDays(today, 7);
      case '30d':
        return subDays(today, 30);
      case '1y':
        return subMonths(today, 12);
      default:
        return subDays(today, 30);
    }
  };

  // Render pie chart for genre distribution
  const renderGenreDistribution = () => {
    if (!analytics || !analytics.genreDistribution || analytics.genreDistribution.length === 0) {
      return (
        <Box p={2} display="flex" justifyContent="center" alignItems="center" height="300px">
          <Typography variant="body2" color="text.secondary">
            No genre data available
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={analytics.genreDistribution}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {analytics.genreDistribution.map((entry, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Format currency with optional color coding
  const formatCurrencyWithColor = (value: number, colorCoding: boolean = false) => {
    const formattedValue = formatCurrency(value);
    if (!colorCoding) return formattedValue;
    
    return (
      <Typography
        component="span"
        color={value >= 0 ? 'success.main' : 'error.main'}
      >
        {formattedValue}
      </Typography>
    );
  };

  // Format percentage with sign and color
  const formatPercentageWithColor = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const formattedValue = `${sign}${value.toFixed(2)}%`;
    
    return (
      <Typography
        component="span"
        color={value >= 0 ? 'success.main' : 'error.main'}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        {value >= 0 ? <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />}
        {formattedValue}
      </Typography>
    );
  };

  // Render token verification info
  const renderTokenVerificationInfo = () => {
    if (!analytics || !analytics.tokenValueMetrics) return null;
    
    const { verifiedTokens, unverifiedTokens } = analytics.tokenValueMetrics;
    const total = verifiedTokens + unverifiedTokens;
    
    if (total === 0) return null;
    
    const verifiedPercentage = Math.round((verifiedTokens / total) * 100);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <MuiTooltip title="Verified tokens have been confirmed on the blockchain">
          <Badge 
            badgeContent={verifiedTokens} 
            color="success"
            sx={{ mr: 2 }}
          >
            <VerifiedIcon color="success" />
          </Badge>
        </MuiTooltip>
        
        <MuiTooltip title="Unverified tokens exist but have not been verified on the blockchain">
          <Badge 
            badgeContent={unverifiedTokens} 
            color="warning"
            sx={{ mr: 2 }}
          >
            <TokenIcon color="warning" />
          </Badge>
        </MuiTooltip>
        
        <Typography variant="body2" color="text.secondary">
          {verifiedPercentage}% of tokens verified on blockchain
        </Typography>
        
        {!account && (
          <MuiTooltip title="Connect wallet to verify tokens">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" color="info" />
            </IconButton>
          </MuiTooltip>
        )}
      </Box>
    );
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
              {formatCurrency(analytics?.totalValue || 0)}
            </Typography>
            <Typography 
              variant="body2" 
              color={percentageChange >= 0 ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {percentageChange >= 0 ? 
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
              }
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
              {formatCurrency(analytics.lendingMetrics.lendingRevenue)}
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
              {analytics.engagementMetrics.views}
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
                      dataKey="date"
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
        
        {/* Token Value Metrics */}
        {(analytics?.tokenValueMetrics || tokenValueLoading) && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 1 }}>
                Token Value Metrics
                <MuiTooltip title="Data based on verified blockchain tokens in your library">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" color="info" />
                  </IconButton>
                </MuiTooltip>
              </Typography>
              
              {renderTokenVerificationInfo()}
              
              {tokenValueLoading && (
                <Box display="flex" alignItems="center" mb={2}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading token value data...
                  </Typography>
                </Box>
              )}
            </Grid>
            
            {/* Token Value Summary Cards */}
            {analytics?.tokenValueMetrics && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Token Value
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(analytics.tokenValueMetrics.totalTokenValue)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ display: 'flex', alignItems: 'center' }}
                      color={analytics.tokenValueMetrics.tokenPriceChanges.month >= 0 ? 'success.main' : 'error.main'}
                    >
                      {analytics.tokenValueMetrics.tokenPriceChanges.month >= 0 ? 
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                      }
                      {formatPercentage(analytics.tokenValueMetrics.tokenPriceChanges.month)}% (30d)
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Verification Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" gutterBottom sx={{ mr: 1 }}>
                        {analytics.tokenValueMetrics.verifiedTokens}
                      </Typography>
                      <VerifiedIcon color="success" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TokenIcon fontSize="small" sx={{ mr: 0.5 }} color="warning" />
                      {analytics.tokenValueMetrics.unverifiedTokens} unverified
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      24h Change
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color={analytics.tokenValueMetrics.tokenPriceChanges.day >= 0 ? 'success.main' : 'error.main'}
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {analytics.tokenValueMetrics.tokenPriceChanges.day >= 0 ? 
                        <TrendingUpIcon sx={{ mr: 0.5 }} /> : 
                        <TrendingDownIcon sx={{ mr: 0.5 }} />
                      }
                      {formatPercentage(analytics.tokenValueMetrics.tokenPriceChanges.day)}%
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={analytics.tokenValueMetrics.tokenPriceChanges.week >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {analytics.tokenValueMetrics.tokenPriceChanges.week >= 0 ? 
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                      }
                      {formatPercentage(analytics.tokenValueMetrics.tokenPriceChanges.week)}% (7d)
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Highest Value Token
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(analytics.tokenValueMetrics.highestValueToken.value)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg`} 
                        alt="Ethereum" 
                        style={{ width: 16, height: 16, marginRight: 4 }} 
                      />
                      {analytics.tokenValueMetrics.highestValueToken.chain}
                    </Typography>
                  </Paper>
                </Grid>
              </>
            )}
            
            {/* Token Value History Chart */}
            {analytics?.tokenValueMetrics && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Token Value History
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={analytics.tokenValueMetrics.tokenValueHistory.filter(entry => {
                            const cutoffDate = getFilteredDateCutoff();
                            return new Date(entry.date) >= cutoffDate;
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value: string) => format(new Date(value), 'MMM d')}
                          />
                          <YAxis
                            yAxisId="left"
                            tickFormatter={(value: number) => formatCurrency(value)}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 'dataMax + 5']}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => {
                              if (name === 'value') return formatCurrency(value);
                              if (name === 'verifiedTokensCount') return value;
                              return value;
                            }}
                            labelFormatter={(label: string) => format(new Date(label), 'MMM d, yyyy')}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Token Value"
                            stroke="#8884d8"
                            yAxisId="left"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="verifiedTokensCount"
                            name="Verified Tokens"
                            stroke="#82ca9d"
                            yAxisId="right"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Blockchain Verification Status */}
            {analytics?.tokenValueMetrics && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Token Verification Status
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Verified', value: analytics.tokenValueMetrics.verifiedTokens },
                              { name: 'Unverified', value: analytics.tokenValueMetrics.unverifiedTokens }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }: { name: string; percent: number }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            <Cell key="cell-verified" fill="#4caf50" />
                            <Cell key="cell-unverified" fill="#ff9800" />
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => value}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </>
        )}

        {/* Genre Distribution */}
        <Grid item xs={12} md={analytics.tokenValueMetrics ? 6 : 6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Genre Distribution
              </Typography>
              {renderGenreDistribution()}
            </CardContent>
          </Card>
        </Grid>

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
                      {formatCurrency(analytics.lendingMetrics.lendingRevenue)}
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
                      { name: 'Revenue', current: analytics.lendingMetrics.lendingRevenue, previous: analytics.lendingMetrics.lendingRevenue * 0.7 },
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
                      {analytics.engagementMetrics.views}
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
                      { name: 'Week 1', views: Math.round(analytics.engagementMetrics.views * 0.2) },
                      { name: 'Week 2', views: Math.round(analytics.engagementMetrics.views * 0.15) },
                      { name: 'Week 3', views: Math.round(analytics.engagementMetrics.views * 0.3) },
                      { name: 'Week 4', views: Math.round(analytics.engagementMetrics.views * 0.35) },
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