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
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre: string[];
  rating: number;
  duration: string;
  year: number;
  director: string;
  type: 'movie' | 'series' | 'documentary';
  price?: number;
  isOwned?: boolean;
}

interface RecommendationsListProps {
  recommendations: RecommendationItem[];
  title?: string;
  maxItems?: number;
  onItemClick?: (item: RecommendationItem) => void;
  onPlayClick?: (item: RecommendationItem) => void;
  showActions?: boolean;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  title = "Recommendations",
  maxItems = 6,
  onItemClick,
  onPlayClick,
  showActions = true,
}) => {
  const displayItems = recommendations.slice(0, maxItems);

  const handleItemClick = (item: RecommendationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handlePlayClick = (e: React.MouseEvent, item: RecommendationItem) => {
    e.stopPropagation();
    if (onPlayClick) {
      onPlayClick(item);
    }
  };

  if (displayItems.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.primary" gutterBottom>
          Content Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
          Professional filmmakers are uploading new content to the platform. 
          Check back soon to discover amazing films and documentaries.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {displayItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
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
                  height="200"
                  image={item.thumbnail}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                
                {/* Overlay with play button */}
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
                </Box>

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

              <CardContent sx={{ pb: 1 }}>
                <Typography
                  variant="subtitle1"
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

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={item.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {item.rating.toFixed(1)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {item.genre.slice(0, 2).map((g) => (
                    <Chip key={g} label={g} size="small" variant="outlined" />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {item.year} • {item.duration} • {item.director}
                </Typography>

                {showActions && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Box>
                      <Tooltip title="Add to Favorites">
                        <IconButton size="small">
                          <FavoriteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton size="small">
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Tooltip title="More Info">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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