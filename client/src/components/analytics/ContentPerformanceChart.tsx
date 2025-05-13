import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import { format, parseISO } from 'date-fns';
import { 
  blockchainAnalyticsService, 
  TokenPerformanceHistory 
} from '../../services/blockchainAnalytics.service';
import ChartContainer from './ChartContainer';
import TimeRangeSelector, { TimeRange } from './TimeRangeSelector';
import MetricCard from './MetricCard';

interface ContentPerformanceChartProps {
  contentId: string;
  initialTimeRange?: TimeRange;
}

type ChartType = 'line' | 'area' | 'bar';
type MetricType = 'sales' | 'holders' | 'transfers';

/**
 * Component for visualizing content performance metrics
 */
const ContentPerformanceChart: React.FC<ContentPerformanceChartProps> = ({
  contentId,
  initialTimeRange = 'month'
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metricType, setMetricType] = useState<MetricType>('sales');
  const [performanceData, setPerformanceData] = useState<TokenPerformanceHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await blockchainAnalyticsService.getTokenPerformanceHistory(
          contentId,
          timeRange
        );
        setPerformanceData(data);
      } catch (err) {
        console.error('Error fetching token performance history:', err);
        setError('Failed to load performance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contentId, timeRange]);

  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType | null
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Handle metric type change
  const handleMetricTypeChange = (event: SelectChangeEvent) => {
    setMetricType(event.target.value as MetricType);
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

  // Get chart data based on selected metric type
  const getChartData = () => {
    switch (metricType) {
      case 'sales':
        return performanceData.map(item => ({
          date: item.date,
          primary: item.primarySales,
          secondary: item.secondarySales,
          total: item.primarySales + item.secondarySales,
          price: item.averagePrice
        }));
      case 'holders':
        return performanceData.map(item => ({
          date: item.date,
          small: item.smallHolders,
          medium: item.mediumHolders,
          large: item.largeHolders,
          total: item.uniqueHolders
        }));
      case 'transfers':
        return performanceData.map(item => ({
          date: item.date,
          transfers: item.transferCount
        }));
      default:
        return performanceData;
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (performanceData.length === 0) return null;

    const latest = performanceData[performanceData.length - 1];
    const earliest = performanceData[0];

    const totalSales = latest.primarySales + latest.secondarySales;
    const previousTotalSales = earliest.primarySales + earliest.secondarySales;
    const salesChange = totalSales - previousTotalSales;
    const salesChangePercentage = previousTotalSales > 0 
      ? (salesChange / previousTotalSales) * 100 
      : 0;

    const holdersChange = latest.uniqueHolders - earliest.uniqueHolders;
    const holdersChangePercentage = earliest.uniqueHolders > 0 
      ? (holdersChange / earliest.uniqueHolders) * 100 
      : 0;

    // Calculate average transfers per day
    const totalTransfers = performanceData.reduce((sum, item) => sum + item.transferCount, 0);
    const avgTransfersPerDay = totalTransfers / performanceData.length;

    return {
      totalSales,
      salesChange,
      salesChangePercentage,
      totalHolders: latest.uniqueHolders,
      holdersChange,
      holdersChangePercentage,
      avgTransfersPerDay
    };
  };

  // Render appropriate chart based on selected chart type and metric type
  const renderChart = () => {
    const data = getChartData();
    
    switch (chartType) {
      case 'line':
        return renderLineChart(data);
      case 'area':
        return renderAreaChart(data);
      case 'bar':
        return renderBarChart(data);
      default:
        return renderLineChart(data);
    }
  };

  // Render line chart
  const renderLineChart = (data: any[]) => {
    switch (metricType) {
      case 'sales':
        return (
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value: any, name) => {
              if (name === 'price') return [`${Number(value).toFixed(4)} ETH`, 'Avg Price'];
              return [value, name === 'primary' ? 'Primary Sales' : 
                           name === 'secondary' ? 'Secondary Sales' : 
                           'Total Sales'];
            }} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="primary"
              name="Primary Sales"
              stroke={theme.palette.primary.main}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="secondary"
              name="Secondary Sales"
              stroke={theme.palette.secondary.main}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              name="Avg Price"
              stroke={theme.palette.error.main}
            />
          </LineChart>
        );
      case 'holders':
        return (
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip formatter={(value, name) => {
              return [value, name === 'small' ? 'Small Holders (1-5)' : 
                           name === 'medium' ? 'Medium Holders (6-50)' : 
                           name === 'large' ? 'Large Holders (51+)' : 
                           'Total Holders'];
            }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="small"
              name="Small Holders"
              stroke={theme.palette.primary.main}
            />
            <Line
              type="monotone"
              dataKey="medium"
              name="Medium Holders"
              stroke={theme.palette.secondary.main}
            />
            <Line
              type="monotone"
              dataKey="large"
              name="Large Holders"
              stroke={theme.palette.error.main}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Holders"
              stroke={theme.palette.success.main}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
      case 'transfers':
        return (
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="transfers"
              name="Token Transfers"
              stroke={theme.palette.primary.main}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
      default:
        return null;
    }
  };

  // Render area chart
  const renderAreaChart = (data: any[]) => {
    switch (metricType) {
      case 'sales':
        return (
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip formatter={(value, name) => {
              return [value, name === 'primary' ? 'Primary Sales' : 'Secondary Sales'];
            }} />
            <Legend />
            <Area
              type="monotone"
              dataKey="primary"
              name="Primary Sales"
              stackId="1"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.light}
            />
            <Area
              type="monotone"
              dataKey="secondary"
              name="Secondary Sales"
              stackId="1"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.light}
            />
          </AreaChart>
        );
      case 'holders':
        return (
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip formatter={(value, name) => {
              return [value, name === 'small' ? 'Small Holders (1-5)' : 
                           name === 'medium' ? 'Medium Holders (6-50)' : 
                           'Large Holders (51+)'];
            }} />
            <Legend />
            <Area
              type="monotone"
              dataKey="small"
              name="Small Holders"
              stackId="1"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.light}
            />
            <Area
              type="monotone"
              dataKey="medium"
              name="Medium Holders"
              stackId="1"
              stroke={theme.palette.secondary.main}
              fill={theme.palette.secondary.light}
            />
            <Area
              type="monotone"
              dataKey="large"
              name="Large Holders"
              stackId="1"
              stroke={theme.palette.error.main}
              fill={theme.palette.error.light}
            />
          </AreaChart>
        );
      case 'transfers':
        return (
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="transfers"
              name="Token Transfers"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.light}
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  // Render bar chart
  const renderBarChart = (data: any[]) => {
    switch (metricType) {
      case 'sales':
        return (
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip formatter={(value, name) => {
              return [value, name === 'primary' ? 'Primary Sales' : 'Secondary Sales'];
            }} />
            <Legend />
            <Bar dataKey="primary" name="Primary Sales" fill={theme.palette.primary.main} />
            <Bar dataKey="secondary" name="Secondary Sales" fill={theme.palette.secondary.main} />
          </BarChart>
        );
      case 'holders':
        return (
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip formatter={(value, name) => {
              return [value, name === 'small' ? 'Small Holders (1-5)' : 
                           name === 'medium' ? 'Medium Holders (6-50)' : 
                           'Large Holders (51+)'];
            }} />
            <Legend />
            <Bar dataKey="small" name="Small Holders" fill={theme.palette.primary.main} stackId="a" />
            <Bar dataKey="medium" name="Medium Holders" fill={theme.palette.secondary.main} stackId="a" />
            <Bar dataKey="large" name="Large Holders" fill={theme.palette.error.main} stackId="a" />
          </BarChart>
        );
      case 'transfers':
        return (
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transfers" name="Token Transfers" fill={theme.palette.primary.main} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  const summaryMetrics = calculateSummaryMetrics();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Token Performance Metrics
        </Typography>
        <TimeRangeSelector 
          value={timeRange} 
          onChange={setTimeRange}
          availableRanges={['day', 'week', 'month', 'quarter', 'year']}
        />
      </Box>

      {/* Summary metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Sales"
            value={summaryMetrics?.totalSales || 0}
            loading={loading}
            trendValue={summaryMetrics?.salesChangePercentage || 0}
            trendLabel={`vs. previous ${timeRange}`}
            type="number"
            iconColor={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Holders"
            value={summaryMetrics?.totalHolders || 0}
            loading={loading}
            trendValue={summaryMetrics?.holdersChangePercentage || 0}
            trendLabel={`vs. previous ${timeRange}`}
            type="number"
            iconColor={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Avg. Daily Transfers"
            value={summaryMetrics?.avgTransfersPerDay.toFixed(1) || 0}
            loading={loading}
            type="number"
            iconColor={theme.palette.info.main}
            tooltip="Average number of token transfers per day"
          />
        </Grid>
      </Grid>

      {/* Chart controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="metric-type-label">Metric</InputLabel>
          <Select
            labelId="metric-type-label"
            id="metric-type-select"
            value={metricType}
            label="Metric"
            onChange={handleMetricTypeChange}
          >
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="holders">Holders</MenuItem>
            <MenuItem value="transfers">Transfers</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
          size="small"
        >
          <ToggleButton value="line" aria-label="line chart">
            <TimelineIcon />
          </ToggleButton>
          <ToggleButton value="area" aria-label="area chart">
            <StackedBarChartIcon />
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            <BarChartIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main chart */}
      <ChartContainer
        title={`${metricType === 'sales' ? 'Sales' : 
                metricType === 'holders' ? 'Holder' : 
                'Transfer'} Performance`}
        description={`${metricType === 'sales' ? 'Primary and secondary sales over time' : 
                    metricType === 'holders' ? 'Token holder distribution over time' : 
                    'Token transfer activity over time'}`}
        loading={loading}
        error={error}
        isEmpty={performanceData.length === 0}
        height={400}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div>No chart data available</div>}
        </ResponsiveContainer>
      </ChartContainer>
    </Box>
  );
};

export default ContentPerformanceChart; 