import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Grid,
  Rating,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { 
  BaseRecommendationComponentProps,
  RecommendationItem 
} from '../../types/component-interfaces';

// Export the RecommendationItem type for backward compatibility
export type { RecommendationItem };

interface RecommendationsListProps extends BaseRecommendationComponentProps {
  // Backward compatibility - support both 'recommendations' and 'items'
  recommendations?: RecommendationItem[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations = [],
  items = [],
  title = "Recommendations",
  maxItems = 6,
  loading = false,
  error = null,
  emptyStateMessage = "Professional filmmakers are uploading new content to the platform. Check back soon to discover amazing films and documentaries.",
  emptyStateTitle = "Content Coming Soon",
  onItemClick,
  onPlayClick,
  onFavoriteClick,
  onShareClick,
  onInfoClick,
  showActions = true,
  showHeader = true,
  variant = 'standard',
  elevation = 0,
  className,
  sx,
  onRetry,
}) => {
  // Use recommendations prop if provided, otherwise use items for consistency
  const displayData = recommendations.length > 0 ? recommendations : items;
  const displayItems = displayData.slice(0, maxItems);

  const handleItemClick = (item: RecommendationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handlePlayClick = (e: React.MouseEvent, item: RecommendationItem) => {
    e.stopPropagation();
    if (onPlayClick) {
      onPlayClick(e, item);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, item: RecommendationItem) => {
    e.stopPropagation();
    if (onFavoriteClick) {
      onFavoriteClick(e, item);
    }
  };

  const handleShareClick = (e: React.MouseEvent, item: RecommendationItem) => {
    e.stopPropagation();
    if (onShareClick) {
      onShareClick(e, item);
    }
  };

  const handleInfoClick = (e: React.MouseEvent, item: RecommendationItem) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick(e, item);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, ...sx }} className={className}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: 2, ...sx }} className={className}>
        <Alert 
          severity="error" 
          action={onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (displayItems.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', ...sx }} className={className}>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {emptyStateTitle}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
          {emptyStateMessage}
        </Typography>
      </Box>
    );
  }

  // Get grid spacing based on variant
  const getGridSpacing = () => {
    switch (variant) {
      case 'compact': return 1;
      case 'detailed': return 3;
      default: return 2;
    }
  };

  // Get card height based on variant
  const getCardHeight = () => {
    switch (variant) {
      case 'compact': return 160;
      case 'detailed': return 240;
      default: return 200;
    }
  };

  return (
    <Box sx={sx} className={className}>
      {showHeader && title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      
      <Grid container spacing={getGridSpacing()}>
        {displayItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card
              elevation={elevation}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleItemClick(item)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height={getCardHeight()}
                  image={item.thumbnail}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                
                {/* Overlay with action buttons */}
                {showActions && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease-in-out',
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Play">
                        <IconButton
                          size="large"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            '&:hover': {
                              backgroundColor: 'white',
                            },
                          }}
                          onClick={(e) => handlePlayClick(e, item)}
                        >
                          <PlayIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Tooltip>
                      
                      {variant === 'detailed' && (
                        <>
                          <Tooltip title="Add to Favorites">
                            <IconButton
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                '&:hover': {
                                  backgroundColor: 'white',
                                },
                              }}
                              onClick={(e) => handleFavoriteClick(e, item)}
                            >
                              <FavoriteIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Share">
                            <IconButton
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                '&:hover': {
                                  backgroundColor: 'white',
                                },
                              }}
                              onClick={(e) => handleShareClick(e, item)}
                            >
                              <ShareIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="More Info">
                            <IconButton
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                '&:hover': {
                                  backgroundColor: 'white',
                                },
                              }}
                              onClick={(e) => handleInfoClick(e, item)}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Price/Owned indicator */}
                {item.isOwned ? (
                  <Chip
                    label="Owned"
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                ) : item.price && (
                  <Chip
                    label={`$${item.price}`}
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant={variant === 'compact' ? 'body2' : 'subtitle1'}
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </Typography>

                {variant !== 'compact' && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: variant === 'detailed' ? 3 : 2,
                      WebkitBoxOrient: 'vertical',
                      flexGrow: 1,
                    }}
                  >
                    {item.description}
                  </Typography>
                )}

                {/* Genre chips */}
                {variant === 'detailed' && item.genre.length > 0 && (
                  <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {item.genre.slice(0, 2).map((genre) => (
                      <Chip
                        key={genre}
                        label={genre}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                )}

                {/* Rating and metadata */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating
                      value={item.rating}
                      readOnly
                      size="small"
                      precision={0.5}
                      sx={{ mr: 1 }}
                    />
                    {variant !== 'compact' && (
                      <Typography variant="caption" color="text.secondary">
                        ({item.rating})
                      </Typography>
                    )}
                  </Box>
                  
                  {variant !== 'compact' && (
                    <Typography variant="caption" color="text.secondary">
                      {item.duration}
                    </Typography>
                  )}
                </Box>

                {variant === 'detailed' && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.director} • {item.year}
                    </Typography>
                    <Chip
                      label={item.type}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RecommendationsList; 