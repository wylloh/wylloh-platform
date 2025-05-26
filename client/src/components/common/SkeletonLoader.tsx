import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent, useTheme } from '@mui/material';

interface SkeletonLoaderProps {
  variant: 'content-card' | 'content-grid' | 'analytics-chart' | 'video-player' | 'dashboard-overview' | 'search-results' | 'library-content';
  count?: number;
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

/**
 * SkeletonLoader - Provides consistent skeleton loading states across the platform
 * Improves perceived performance with realistic content placeholders
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  count = 1,
  height,
  width = '100%',
  animation = 'wave'
}) => {
  const theme = useTheme();

  const skeletonProps = {
    animation,
    sx: {
      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300',
      borderRadius: 1,
    }
  };

  const renderContentCard = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton 
        variant="rectangular" 
        height={200} 
        {...skeletonProps}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" height={32} width="80%" {...skeletonProps} />
        <Skeleton variant="text" height={20} width="60%" {...skeletonProps} sx={{ mt: 1 }} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rectangular" height={24} width={60} {...skeletonProps} />
          <Skeleton variant="rectangular" height={24} width={80} {...skeletonProps} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Skeleton variant="text" height={24} width={100} {...skeletonProps} />
          <Skeleton variant="rectangular" height={36} width={80} {...skeletonProps} />
        </Box>
      </CardContent>
    </Card>
  );

  const renderContentGrid = () => (
    <Grid container spacing={3}>
      {Array(count).fill(0).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
          {renderContentCard()}
        </Grid>
      ))}
    </Grid>
  );

  const renderAnalyticsChart = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" height={32} width={200} {...skeletonProps} />
        <Skeleton variant="rectangular" height={32} width={120} {...skeletonProps} />
      </Box>
      <Skeleton 
        variant="rectangular" 
        height={height || 300} 
        width={width}
        {...skeletonProps}
      />
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Skeleton variant="rectangular" height={20} width={80} {...skeletonProps} />
        <Skeleton variant="rectangular" height={20} width={100} {...skeletonProps} />
        <Skeleton variant="rectangular" height={20} width={90} {...skeletonProps} />
      </Box>
    </Box>
  );

  const renderVideoPlayer = () => (
    <Box sx={{ position: 'relative', width, height: height || '60vh', bgcolor: 'black', borderRadius: 1 }}>
      <Skeleton 
        variant="rectangular" 
        width="100%" 
        height="100%" 
        animation={animation}
        sx={{ 
          bgcolor: 'grey.900',
          borderRadius: 1,
        }}
      />
      {/* Play button skeleton */}
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      }}>
        <Skeleton variant="circular" width={80} height={80} {...skeletonProps} />
      </Box>
      {/* Controls skeleton */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 16, 
        left: 16, 
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Skeleton variant="rectangular" height={4} {...skeletonProps} sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" height={32} width={80} {...skeletonProps} />
      </Box>
    </Box>
  );

  const renderDashboardOverview = () => (
    <Box>
      {/* Metrics row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array(4).fill(0).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={`metric-${index}`}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={48} height={48} {...skeletonProps} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" height={24} width="60%" {...skeletonProps} />
                  <Skeleton variant="text" height={32} width="80%" {...skeletonProps} />
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Chart area */}
      <Card sx={{ p: 3 }}>
        <Skeleton variant="text" height={32} width={200} {...skeletonProps} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} width="100%" {...skeletonProps} />
      </Card>
    </Box>
  );

  const renderSearchResults = () => (
    <Box>
      {/* Search header */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" height={24} width={150} {...skeletonProps} />
      </Box>
      {/* Results */}
      <Grid container spacing={2}>
        {Array(count).fill(0).map((_, index) => (
          <Grid item xs={12} key={`search-${index}`}>
            <Card sx={{ display: 'flex', p: 2 }}>
              <Skeleton variant="rectangular" width={120} height={80} {...skeletonProps} />
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Skeleton variant="text" height={24} width="70%" {...skeletonProps} />
                <Skeleton variant="text" height={20} width="50%" {...skeletonProps} sx={{ mt: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="rectangular" height={20} width={60} {...skeletonProps} />
                  <Skeleton variant="rectangular" height={20} width={80} {...skeletonProps} />
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderLibraryContent = () => (
    <Box>
      {/* Library header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" height={32} width={200} {...skeletonProps} />
        <Skeleton variant="rectangular" height={36} width={120} {...skeletonProps} />
      </Box>
      {/* Content grid */}
      {renderContentGrid()}
    </Box>
  );

  switch (variant) {
    case 'content-card':
      return renderContentCard();
    case 'content-grid':
      return renderContentGrid();
    case 'analytics-chart':
      return renderAnalyticsChart();
    case 'video-player':
      return renderVideoPlayer();
    case 'dashboard-overview':
      return renderDashboardOverview();
    case 'search-results':
      return renderSearchResults();
    case 'library-content':
      return renderLibraryContent();
    default:
      return (
        <Skeleton 
          variant="rectangular" 
          height={height || 200} 
          width={width}
          {...skeletonProps}
        />
      );
  }
};

export default SkeletonLoader; 