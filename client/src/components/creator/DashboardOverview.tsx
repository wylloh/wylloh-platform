import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Stack,
  Tooltip,
  LinearProgress,
  Button,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Equalizer as EqualizerIcon,
  Movie as MovieIcon,
  Token as TokenIcon,
  Visibility as ViewsIcon,
  ShoppingCart as SalesIcon,
  People as UsersIcon,
  List as ListIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Content } from '../../services/content.service';

interface DashboardOverviewProps {
  content: Content[];
  loading?: boolean;
  period?: 'day' | 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year') => void;
}

/**
 * Dashboard overview component displaying key metrics and analytics
 */
const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  content,
  loading = false,
  period = 'week',
  onPeriodChange,
}) => {
  const theme = useTheme();

  // Calculate metrics
  const totalContent = content.length;
  const totalTokenized = content.filter(item => item.tokenized).length;
  const totalViews = content.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalSales = content.reduce((sum, item) => sum + (item.sales || 0), 0);
  const totalActive = content.filter(item => item.status === 'active').length;
  const totalDrafts = content.filter(item => item.status === 'draft').length;
  const tokenizationRate = totalContent > 0 ? Math.round((totalTokenized / totalContent) * 100) : 0;
  
  // Sample data for trending - in a real app this would come from the API
  const viewsChangePercent = 12.5;
  const salesChangePercent = 8.3;
  const contentChangePercent = 5.0;
  const tokenizedChangePercent = 15.2;
  
  // Helper function to render trend indicators
  const renderTrend = (percent: number) => {
    if (percent > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" component="span">
            {percent.toFixed(1)}%
          </Typography>
        </Box>
      );
    } else if (percent < 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" component="span">
            {Math.abs(percent).toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return (
      <Typography variant="body2" component="span" color="text.secondary">
        No change
      </Typography>
    );
  };

  // Render metric card
  const renderMetricCard = (
    title: string, 
    value: number | string, 
    icon: React.ReactNode, 
    changePercent?: number, 
    color?: string,
    subtitle?: string
  ) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: `${color || 'primary.main'}15`,
              color: color || 'primary.main',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        {changePercent !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              vs previous {period}
            </Typography>
            {renderTrend(changePercent)}
          </Box>
        )}
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Render period selector
  const renderPeriodSelector = () => (
    <Box sx={{ display: 'flex', mb: 3 }}>
      <Button 
        variant={period === 'day' ? 'contained' : 'outlined'} 
        size="small"
        onClick={() => onPeriodChange && onPeriodChange('day')}
        sx={{ mr: 1 }}
      >
        Day
      </Button>
      <Button 
        variant={period === 'week' ? 'contained' : 'outlined'} 
        size="small"
        onClick={() => onPeriodChange && onPeriodChange('week')}
        sx={{ mr: 1 }}
      >
        Week
      </Button>
      <Button 
        variant={period === 'month' ? 'contained' : 'outlined'} 
        size="small"
        onClick={() => onPeriodChange && onPeriodChange('month')}
        sx={{ mr: 1 }}
      >
        Month
      </Button>
      <Button 
        variant={period === 'year' ? 'contained' : 'outlined'} 
        size="small"
        onClick={() => onPeriodChange && onPeriodChange('year')}
      >
        Year
      </Button>
    </Box>
  );

  return (
    <Box>
      {/* Time period selector */}
      {onPeriodChange && renderPeriodSelector()}
      
      {/* Main metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Content', 
            totalContent, 
            <MovieIcon />, 
            contentChangePercent,
            theme.palette.primary.main,
            `${totalActive} active, ${totalDrafts} drafts`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Tokenized Content', 
            totalTokenized, 
            <TokenIcon />, 
            tokenizedChangePercent,
            theme.palette.secondary.main,
            `${tokenizationRate}% tokenization rate`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Views', 
            totalViews, 
            <ViewsIcon />, 
            viewsChangePercent,
            theme.palette.info.main,
            totalContent > 0 ? `${Math.round(totalViews / totalContent)} avg. per content` : ''
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Sales', 
            totalSales, 
            <SalesIcon />, 
            salesChangePercent,
            theme.palette.success.main,
            totalTokenized > 0 ? `${Math.round(totalSales / totalTokenized)} avg. per tokenized content` : ''
          )}
        </Grid>
      </Grid>
      
      {/* Content status */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Content Status
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  Tokenization Progress
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {totalTokenized}/{totalContent} ({tokenizationRate}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={tokenizationRate} 
                color="secondary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  Active Content
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {totalActive}/{totalContent} ({totalContent > 0 ? Math.round((totalActive / totalContent) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={totalContent > 0 ? (totalActive / totalContent) * 100 : 0} 
                color="success"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`${totalContent} Total`} 
                icon={<MovieIcon />} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`${totalActive} Active`} 
                icon={<CheckCircleIcon />} 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label={`${totalDrafts} Drafts`} 
                icon={<EditIcon />} 
                color="default" 
                variant="outlined"
              />
              <Chip 
                label={`${content.filter(item => item.status === 'pending').length} Pending`} 
                icon={<PendingIcon />} 
                color="warning" 
                variant="outlined"
              />
              <Chip 
                label={`${totalTokenized} Tokenized`} 
                icon={<TokenIcon />} 
                color="secondary" 
                variant="outlined"
              />
              <Chip 
                label={`${totalSales} Sales`} 
                icon={<SalesIcon />} 
                color="success" 
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Quick actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<AddIcon />}
              component={Link}
              to="/pro/upload"
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Upload
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<TokenIcon />}
              component={Link}
              to="/pro/tokenize-publish"
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Tokenize
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<ListIcon />}
              component={Link}
              to="/pro/libraries"
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Libraries
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<StarIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Featured
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<EqualizerIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Analytics
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<TimelineIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Pending as PendingIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default DashboardOverview; 