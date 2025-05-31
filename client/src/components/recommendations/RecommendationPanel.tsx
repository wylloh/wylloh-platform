import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Favorite as FavoriteIcon,
  NewReleases as NewReleasesIcon,
  Theaters as GenreIcon
} from '@mui/icons-material';
import RecommendationsList from './RecommendationsList';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import { 
  BasePanelComponentProps,
  RecommendationItem 
} from '../../types/component-interfaces';

interface RecommendationPanelProps extends BasePanelComponentProps {
  // Data props for when used as a controlled component
  items?: RecommendationItem[];
  // Callback props
  onItemClick?: (item: RecommendationItem) => void;
  onPlayClick?: (event: React.MouseEvent, item: RecommendationItem) => void;
  onFavoriteClick?: (event: React.MouseEvent, item: RecommendationItem) => void;
  onShareClick?: (event: React.MouseEvent, item: RecommendationItem) => void;
  onInfoClick?: (event: React.MouseEvent, item: RecommendationItem) => void;
  // Display props
  maxItems?: number;
  showActions?: boolean;
  context?: 'store' | 'search' | 'dashboard' | 'profile';
}

/**
 * A dashboard-style panel that displays various recommendation types in tabs
 */
const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  title = 'Recommendations',
  subtitle,
  elevation = 1,
  maxItems = 4,
  showTabs = true,
  showHeader = true,
  loading = false,
  error = null,
  onRetry,
  items = [],
  onItemClick,
  onPlayClick,
  onFavoriteClick,
  onShareClick,
  onInfoClick,
  showActions = true,
  context = 'dashboard',
  variant = 'standard',
  className,
  sx,
  defaultTab = 0,
  onTabChange,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(defaultTab);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }
  };
  
  // Custom tab styling
  const tabSx = {
    minWidth: 'auto',
    fontSize: '0.875rem',
    px: 2
  };
  
  return (
    <Card elevation={elevation} sx={{ height: '100%', ...sx }} className={className}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {showHeader && (
          <Box sx={{ p: 2, pb: showTabs ? 0 : 2 }}>
            <Typography variant="h6" gutterBottom={!!subtitle}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        {showTabs && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab icon={<FavoriteIcon fontSize="small" />} label="For You" sx={tabSx} />
              <Tab icon={<TrendingIcon fontSize="small" />} label="Trending" sx={tabSx} />
              <Tab icon={<NewReleasesIcon fontSize="small" />} label="New" sx={tabSx} />
              <Tab icon={<GenreIcon fontSize="small" />} label="Comedy" sx={tabSx} />
            </Tabs>
          </Box>
        )}
        
        <Box sx={{ p: 2 }}>
          {showTabs ? (
            <React.Fragment>
              <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
                <PersonalizedRecommendations
                  maxItems={maxItems}
                  loading={loading}
                  error={error}
                  onRetry={onRetry}
                  onItemClick={onItemClick}
                  onPlayClick={onPlayClick}
                  onFavoriteClick={onFavoriteClick}
                  onShareClick={onShareClick}
                  onInfoClick={onInfoClick}
                  showActions={showActions}
                  variant={variant}
                  elevation={0}
                />
              </Box>
              <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
                <RecommendationsList
                  items={items}
                  title=""
                  maxItems={maxItems}
                  loading={loading}
                  error={error}
                  onRetry={onRetry}
                  onItemClick={onItemClick}
                  onPlayClick={onPlayClick}
                  onFavoriteClick={onFavoriteClick}
                  onShareClick={onShareClick}
                  onInfoClick={onInfoClick}
                  showActions={showActions}
                  showHeader={false}
                  variant={variant}
                  elevation={0}
                  emptyStateTitle="Trending Content Coming Soon"
                  emptyStateMessage="Professional filmmakers are uploading trending content daily. Check back soon for the latest films."
                />
              </Box>
              <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
                <RecommendationsList
                  items={items}
                  title=""
                  maxItems={maxItems}
                  loading={loading}
                  error={error}
                  onRetry={onRetry}
                  onItemClick={onItemClick}
                  onPlayClick={onPlayClick}
                  onFavoriteClick={onFavoriteClick}
                  onShareClick={onShareClick}
                  onInfoClick={onInfoClick}
                  showActions={showActions}
                  showHeader={false}
                  variant={variant}
                  elevation={0}
                  emptyStateTitle="New Releases on the Way"
                  emptyStateMessage="Fresh content from independent filmmakers and studios will appear here as it's published."
                />
              </Box>
              <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}>
                <RecommendationsList
                  items={items}
                  title=""
                  maxItems={maxItems}
                  loading={loading}
                  error={error}
                  onRetry={onRetry}
                  onItemClick={onItemClick}
                  onPlayClick={onPlayClick}
                  onFavoriteClick={onFavoriteClick}
                  onShareClick={onShareClick}
                  onInfoClick={onInfoClick}
                  showActions={showActions}
                  showHeader={false}
                  variant={variant}
                  elevation={0}
                  emptyStateTitle="Comedy Films Coming Soon"
                  emptyStateMessage="Discover hilarious films and comedic content from talented filmmakers around the world."
                />
              </Box>
            </React.Fragment>
          ) : (
            <PersonalizedRecommendations
              maxItems={maxItems}
              loading={loading}
              error={error}
              onRetry={onRetry}
              onItemClick={onItemClick}
              onPlayClick={onPlayClick}
              onFavoriteClick={onFavoriteClick}
              onShareClick={onShareClick}
              onInfoClick={onInfoClick}
              showActions={showActions}
              variant={variant}
              elevation={0}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecommendationPanel; 