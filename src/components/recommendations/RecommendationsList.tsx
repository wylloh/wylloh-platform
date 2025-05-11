import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Skeleton,
  Button,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import useRecommendations from '../../hooks/useRecommendations';
import {
  RecommendationType,
  RecommendationOptions,
  SimilarContentOptions,
  RecommendationResult
} from '../../services/recommendation.service';

interface RecommendationsListProps {
  title: string;
  type: RecommendationType;
  options?: RecommendationOptions | SimilarContentOptions;
  showReason?: boolean;
  maxItems?: number;
  onItemClick?: (item: RecommendationResult) => void;
  emptyMessage?: string;
  showViewAllLink?: boolean;
  viewAllUrl?: string;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({
  title,
  type,
  options = {},
  showReason = false,
  maxItems = 6,
  onItemClick,
  emptyMessage = 'No recommendations available',
  showViewAllLink = false,
  viewAllUrl
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Set up options with limit
  const recommendationOptions = {
    ...options,
    limit: Math.max(maxItems, 10) // Fetch a few extra for better UX
  };
  
  // Use recommendations hook
  const {
    recommendations,
    loading,
    error,
    getPersonalizedRecommendations,
    getSimilarContent,
    getTrendingContent,
    getNewReleases,
    getGenreRecommendations,
    recordContentView
  } = useRecommendations();
  
  // Load recommendations based on type
  useEffect(() => {
    const loadRecommendations = async () => {
      switch (type) {
        case RecommendationType.PERSONALIZED:
          await getPersonalizedRecommendations(recommendationOptions);
          break;
        case RecommendationType.SIMILAR:
          if ('sourceContentId' in recommendationOptions) {
            await getSimilarContent(recommendationOptions as SimilarContentOptions);
          }
          break;
        case RecommendationType.TRENDING:
          await getTrendingContent(recommendationOptions);
          break;
        case RecommendationType.NEW_RELEASES:
          await getNewReleases(recommendationOptions);
          break;
        case RecommendationType.GENRE_BASED:
          if ('genres' in recommendationOptions) {
            await getGenreRecommendations(
              (recommendationOptions as any).genres,
              recommendationOptions
            );
          }
          break;
      }
    };
    
    loadRecommendations();
  }, [
    type,
    recommendationOptions,
    getPersonalizedRecommendations,
    getSimilarContent,
    getTrendingContent,
    getNewReleases,
    getGenreRecommendations
  ]);
  
  // Handle item click
  const handleItemClick = (item: RecommendationResult) => {
    // Record the view for improving recommendations
    recordContentView(item.contentId);
    
    // Call the provided click handler if any
    if (onItemClick) {
      onItemClick(item);
    }
  };
  
  // If there's an error, don't show anything
  if (error) {
    return null;
  }
  
  // Function to render a recommendation item
  const renderItem = (item: RecommendationResult, index: number) => {
    const metadata = item.metadata;
    
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={item.contentId || index}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: 3,
            }
          }}
        >
          <CardActionArea
            component={Link}
            to={`/content/${item.contentId}`}
            onClick={() => handleItemClick(item)}
            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
          >
            <CardMedia
              component="img"
              image={metadata.imageUrl || `https://source.unsplash.com/random/300x200?film&sig=${item.contentId}`}
              alt={metadata.title}
              height={160}
              sx={{ objectFit: 'cover' }}
            />
            
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" component="div" gutterBottom noWrap>
                {metadata.title}
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                {metadata.releaseYear && (
                  <Typography variant="body2" color="text.secondary" component="span">
                    {metadata.releaseYear}
                  </Typography>
                )}
                {metadata.duration && (
                  <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    {Math.floor(metadata.duration / 60)}m
                  </Typography>
                )}
              </Box>
              
              {metadata.genre && metadata.genre.length > 0 && (
                <Box sx={{ mt: 'auto', mb: 1 }}>
                  {metadata.genre.slice(0, 2).map((genre, idx) => (
                    <Chip
                      key={idx}
                      label={genre}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                  {metadata.genre.length > 2 && (
                    <Chip
                      label={`+${metadata.genre.length - 2}`}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  )}
                </Box>
              )}
              
              {showReason && item.reason && (
                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.reason}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  };
  
  // Render loading skeleton
  const renderSkeleton = () => {
    return Array(maxItems).fill(0).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={`skeleton-${index}`}>
        <Card>
          <Skeleton variant="rectangular" height={160} />
          <CardContent>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="rectangular" width={60} height={24} sx={{ mr: 1, display: 'inline-block' }} />
              <Skeleton variant="rectangular" width={60} height={24} sx={{ display: 'inline-block' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ));
  };
  
  // Display nothing if no recommendations and not loading
  if (!loading && recommendations.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        
        {showViewAllLink && viewAllUrl && (
          <Button
            component={Link}
            to={viewAllUrl}
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            View All
          </Button>
        )}
      </Box>
      
      <Grid container spacing={2}>
        {loading 
          ? renderSkeleton() 
          : recommendations
              .slice(0, maxItems)
              .map((item, index) => renderItem(item, index))
        }
      </Grid>
      
      {!loading && recommendations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecommendationsList; 