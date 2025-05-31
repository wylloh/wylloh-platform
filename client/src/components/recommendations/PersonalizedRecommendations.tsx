import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import RecommendationsList from './RecommendationsList';
import { 
  BaseRecommendationComponentProps,
  RecommendationItem 
} from '../../types/component-interfaces';

interface PersonalizedRecommendationsProps extends Omit<BaseRecommendationComponentProps, 'items'> {
  userId?: string;
  // Override items to be optional since we generate mock data
  items?: RecommendationItem[];
}

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
      id={`recommendation-tabpanel-${index}`}
      aria-labelledby={`recommendation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userId,
  maxItems = 8,
  loading = false,
  error = null,
  onItemClick,
  onPlayClick,
  onFavoriteClick,
  onShareClick,
  onInfoClick,
  showActions = true,
  variant = 'standard',
  elevation = 0,
  className,
  sx,
  onRetry,
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Mock data for different recommendation categories - Production ready empty state
  const mockRecommendations: Record<string, RecommendationItem[]> = {
    forYou: [],
    trending: [],
    newReleases: [],
    watchAgain: [],
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCurrentRecommendations = (): RecommendationItem[] => {
    const categories = ['forYou', 'trending', 'newReleases', 'watchAgain'];
    const currentCategory = categories[tabValue];
    return mockRecommendations[currentCategory] || [];
  };

  const getEmptyStateMessage = (): { title: string; description: string } => {
    const messages = [
      {
        title: "Discover Your Perfect Films",
        description: "As you explore and collect films, we'll create personalized recommendations just for you."
      },
      {
        title: "Trending Content Coming Soon",
        description: "Professional filmmakers are uploading new content daily. Check back soon for trending films."
      },
      {
        title: "New Releases on the Way",
        description: "Fresh content from independent filmmakers and studios will appear here as it's published."
      },
      {
        title: "Your Collection Awaits",
        description: "Films you've collected will appear here for easy re-watching and sharing."
      }
    ];
    return messages[tabValue] || messages[0];
  };

  // Handle loading and error states at the top level
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, ...sx }} className={className}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2, ...sx }} className={className}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  const currentEmptyState = getEmptyStateMessage();

  return (
    <Box sx={sx} className={className}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Personalized for You
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="personalized recommendations tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="For You" />
          <Tab label="Trending" />
          <Tab label="New Releases" />
          <Tab label="Watch Again" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <RecommendationsList
          items={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          onFavoriteClick={onFavoriteClick}
          onShareClick={onShareClick}
          onInfoClick={onInfoClick}
          showActions={showActions}
          showHeader={false}
          variant={variant}
          elevation={elevation}
          emptyStateTitle={currentEmptyState.title}
          emptyStateMessage={currentEmptyState.description}
          onRetry={onRetry}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <RecommendationsList
          items={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          onFavoriteClick={onFavoriteClick}
          onShareClick={onShareClick}
          onInfoClick={onInfoClick}
          showActions={showActions}
          showHeader={false}
          variant={variant}
          elevation={elevation}
          emptyStateTitle={currentEmptyState.title}
          emptyStateMessage={currentEmptyState.description}
          onRetry={onRetry}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <RecommendationsList
          items={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          onFavoriteClick={onFavoriteClick}
          onShareClick={onShareClick}
          onInfoClick={onInfoClick}
          showActions={showActions}
          showHeader={false}
          variant={variant}
          elevation={elevation}
          emptyStateTitle={currentEmptyState.title}
          emptyStateMessage={currentEmptyState.description}
          onRetry={onRetry}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <RecommendationsList
          items={getCurrentRecommendations()}
          maxItems={maxItems}
          onItemClick={onItemClick}
          onPlayClick={onPlayClick}
          onFavoriteClick={onFavoriteClick}
          onShareClick={onShareClick}
          onInfoClick={onInfoClick}
          showActions={showActions}
          showHeader={false}
          variant={variant}
          elevation={elevation}
          emptyStateTitle={currentEmptyState.title}
          emptyStateMessage={currentEmptyState.description}
          onRetry={onRetry}
        />
      </TabPanel>
    </Box>
  );
};

export default PersonalizedRecommendations; 