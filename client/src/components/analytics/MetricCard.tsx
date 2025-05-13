import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tooltip, 
  Skeleton, 
  useTheme,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Token as TokenIcon,
  Visibility as ViewsIcon,
  ShoppingCart as SalesIcon,
  People as UsersIcon,
  AccountBalance as WalletIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';

type MetricType = 'currency' | 'percentage' | 'number' | 'token';
type TrendDirection = 'up' | 'down' | 'flat';

interface MetricCardProps {
  title: string;
  value: number | string;
  type?: MetricType;
  icon?: React.ReactNode;
  iconColor?: string;
  trendValue?: number;
  trendLabel?: string;
  loading?: boolean;
  tooltip?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * A card component for displaying individual metrics with trend indicators
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  type = 'number',
  icon,
  iconColor,
  trendValue = 0,
  trendLabel = 'vs previous period',
  loading = false,
  tooltip,
  precision = 2,
  prefix = '',
  suffix = ''
}) => {
  const theme = useTheme();

  // Determine trend direction
  const trendDirection: TrendDirection = 
    trendValue > 0 ? 'up' : 
    trendValue < 0 ? 'down' : 'flat';

  // Format value based on type
  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    switch (type) {
      case 'currency':
        return `${prefix}${value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}${suffix}`;
      case 'percentage':
        return `${prefix}${value.toFixed(precision)}%${suffix}`;
      case 'token':
        return `${prefix}${value.toLocaleString()}${suffix}`;
      default:
        return `${prefix}${value.toLocaleString(undefined, { maximumFractionDigits: precision })}${suffix}`;
    }
  };

  // Get trend icon and color
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />;
      case 'down':
        return <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />;
      default:
        return <TrendingFlatIcon fontSize="small" sx={{ mr: 0.5 }} />;
    }
  };

  const getTrendColor = () => {
    // For percentage metrics, up might be good or bad depending on context
    // For simplicity, we'll assume up is good for all metrics
    switch (trendDirection) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get default icon if none provided
  const getDefaultIcon = () => {
    switch (type) {
      case 'currency':
        return <SalesIcon />;
      case 'percentage':
        return <ChartIcon />;
      case 'token':
        return <TokenIcon />;
      default:
        return <WalletIcon />;
    }
  };

  // Format trend value
  const formatTrendValue = () => {
    const absValue = Math.abs(trendValue);
    return type === 'percentage' ? `${absValue.toFixed(1)}%` : absValue.toFixed(1);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {loading ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            </Box>
            <Skeleton variant="text" width="100%" height={24} />
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: `${iconColor || theme.palette.primary.main}15`,
                  color: iconColor || theme.palette.primary.main,
                  mr: 2
                }}
              >
                {icon || getDefaultIcon()}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div">
                  {formatValue()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {title}
                  </Typography>
                  {tooltip && (
                    <Tooltip title={tooltip} arrow placement="top">
                      <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
            
            {trendValue !== 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {trendLabel}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: getTrendColor() }}>
                  {getTrendIcon()}
                  <Typography variant="body2" component="span">
                    {formatTrendValue()}
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 