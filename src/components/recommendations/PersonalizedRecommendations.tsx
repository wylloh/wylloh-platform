import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import RecommendationsList from './RecommendationsList';
import { RecommendationType } from '../../services/recommendation.service';
import { ContentType } from '../../services/metadata.service';
import { useAuth } from '../../contexts/AuthContext';

interface PersonalizedRecommendationsProps {
  contentType?: ContentType;
  title?: string;
  maxItems?: number;
  showReasons?: boolean;
  fallbackToTrending?: boolean;
}

/**
 * Component for displaying personalized recommendations
 * Uses user's watch history, preferences, and behavior for recommendations
 * Falls back to trending if user is not logged in or has insufficient history
 */
const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  contentType,
  title = 'Recommended For You',
  maxItems = 6,
  showReasons = true,
  fallbackToTrending = true
}) => {
  const { user, isAuthenticated } = useAuth();
  
  // Set up options for personalized recommendations
  const options = {
    contentType,
    limit: maxItems
  };
  
  // Source options for personalization
  const sourceOptions = {
    includeWatchHistory: true,
    includeFavorites: true,
    includeGenrePreferences: true,
    weightRecentActivity: true
  };
  
  // If user is not authenticated and fallback is enabled, show trending instead
  const recommendationType = (!isAuthenticated && fallbackToTrending)
    ? RecommendationType.TRENDING
    : RecommendationType.PERSONALIZED;
  
  // Adjust title for non-authenticated users
  const displayTitle = (!isAuthenticated && fallbackToTrending)
    ? 'Trending Now'
    : title;
  
  return (
    <Box sx={{ my: 4 }}>
      <RecommendationsList
        title={displayTitle}
        type={recommendationType}
        options={options}
        maxItems={maxItems}
        showReason={showReasons}
        emptyMessage="No personalized recommendations available"
        showViewAllLink={true}
        viewAllUrl="/discover"
      />
    </Box>
  );
};

export default PersonalizedRecommendations; 