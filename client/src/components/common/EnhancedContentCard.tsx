import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Divider,
  Tooltip,
  Button,
  IconButton,
  Checkbox,
} from '@mui/material';
import {
  Movie as MovieIcon,
  Audiotrack as AudioIcon,
  Book as BookIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  DateRange as DateIcon,
  Timer as DurationIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Content } from '../../services/content.service';
import ContentStatusBadge from './ContentStatusBadge';

interface EnhancedContentCardProps {
  content: Content;
  loading?: boolean;
  context?: 'store' | 'search' | 'pro' | 'consumer';
  onFavorite?: (contentId: string) => void;
  isFavorite?: boolean;
  onView?: (contentId: string) => void;
  onBuy?: (contentId: string) => void;
  onRent?: (contentId: string) => void;
  onPlay?: (contentId: string) => void;
  elevation?: number;
  variant?: 'compact' | 'standard' | 'detailed';
  hideStatus?: boolean;
  showPrice?: boolean;
  // Selection props for batch operations
  isSelected?: boolean;
  onSelect?: (contentId: string, selected: boolean) => void;
}

/**
 * A versatile content card component that can be used across the platform for consistency
 */
const EnhancedContentCard: React.FC<EnhancedContentCardProps> = ({
  content,
  loading = false,
  context = 'store',
  onFavorite,
  isFavorite = false,
  onView,
  onBuy,
  onRent,
  onPlay,
  elevation = 1,
  variant = 'standard',
  hideStatus = false,
  showPrice = true,
  isSelected = false,
  onSelect,
}) => {
  // Helper function to get content type icon
  const getContentTypeIcon = () => {
    switch (content.contentType?.toLowerCase()) {
      case 'movie':
      case 'short film':
      case 'documentary':
      case 'animation':
        return <MovieIcon />;
      case 'music':
      case 'audio':
      case 'podcast':
        return <AudioIcon />;
      case 'ebook':
      case 'book':
        return <BookIcon />;
      case 'art':
      case 'image':
      case 'photo':
        return <ImageIcon />;
      default:
        return <FileIcon />;
    }
  };

  // Get content thumbnail URL or fallback
  const getThumbnailUrl = () => {
    if (content.thumbnailCid) {
      // In a real app, this would use IPFS gateway or CDN
      return `https://ipfs.io/ipfs/${content.thumbnailCid}`;
    } else if (content.image) {
      return content.image;
    }
    return 'https://via.placeholder.com/400x225?text=No+Thumbnail';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '';
    return `${value.toFixed(3)} ETH`;
  };

  // Render content metadata tags
  const renderMetadataTags = () => {
    const tags = [];
    
    // Add genres if available
    if (content.metadata?.genres && Array.isArray(content.metadata.genres)) {
      tags.push(
        <Box key="genres" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CategoryIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {content.metadata.genres.slice(0, 3).map((genre: string) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5 }}
              />
            ))}
            {content.metadata.genres.length > 3 && (
              <Tooltip title={content.metadata.genres.slice(3).join(', ')}>
                <Chip
                  label={`+${content.metadata.genres.length - 3}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      );
    }
    
    // Add tags if available
    if (content.metadata?.tags && Array.isArray(content.metadata.tags)) {
      tags.push(
        <Box key="tags" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TagIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {content.metadata.tags.slice(0, 3).map((tag: string) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5 }}
              />
            ))}
            {content.metadata.tags.length > 3 && (
              <Tooltip title={content.metadata.tags.slice(3).join(', ')}>
                <Chip
                  label={`+${content.metadata.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      );
    }
    
    // Add release year if available
    if (content.metadata?.releaseYear) {
      tags.push(
        <Box key="releaseYear" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DateIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {content.metadata.releaseYear}
          </Typography>
        </Box>
      );
    }
    
    // Add duration if available
    if (content.metadata?.duration) {
      tags.push(
        <Box key="duration" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DurationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {content.metadata.duration}
          </Typography>
        </Box>
      );
    }
    
    return tags;
  };

  // Render standard variant (default)
  return (
    <Card 
      elevation={elevation} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        border: isSelected ? 2 : 0,
        borderColor: 'primary.main',
      }}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Checkbox 
            checked={isSelected}
            onChange={(e) => onSelect(content.id, e.target.checked)}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } 
            }}
          />
        </Box>
      )}
      
      {/* Status badge */}
      {!hideStatus && (
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          <ContentStatusBadge status={content.status} context={context} />
        </Box>
      )}
      
      {/* Content thumbnail */}
      <CardMedia
        component="img"
        sx={{ height: variant === 'compact' ? 120 : 200 }}
        image={getThumbnailUrl()}
        alt={content.title}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        {/* Content title */}
        <Typography 
          gutterBottom 
          variant={variant === 'compact' ? 'subtitle1' : 'h6'} 
          component="div"
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: variant === 'compact' ? '2.5em' : '3em'
          }}
        >
          {content.title}
        </Typography>
        
        {/* Creator */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          gutterBottom
        >
          {content.creator}
        </Typography>
        
        {/* Price/availability */}
        {showPrice && context !== 'pro' && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {content.price !== undefined && content.price > 0 ? (
              <Typography variant="body2" fontWeight="bold" color="primary">
                {formatCurrency(content.price)}
              </Typography>
            ) : (
              <Typography variant="body2" color="success.main" fontWeight="bold">
                Free
              </Typography>
            )}
            
            {content.available !== undefined && content.totalSupply !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {content.available} of {content.totalSupply} available
              </Typography>
            )}
          </Box>
        )}
      
        {/* Metadata */}
        {variant !== 'compact' && renderMetadataTags()}
        
        {/* Description */}
        {variant === 'detailed' && content.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {content.description}
          </Typography>
        )}
      </CardContent>
      
      {/* Actions */}
      <CardActions sx={{ padding: '8px 16px', justifyContent: 'space-between' }}>
        <Box>
          {onFavorite && (
            <IconButton 
              size="small" 
              onClick={() => onFavorite(content.id)}
              color={isFavorite ? "primary" : "default"}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          )}
          
          {onView && (
            <IconButton size="small" onClick={() => onView(content.id)}>
              <InfoIcon />
            </IconButton>
          )}
        </Box>
        
        <Box>
          {onPlay && (
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<PlayArrowIcon />}
              onClick={() => onPlay(content.id)}
            >
              Play
            </Button>
          )}
          
          {onBuy && context === 'store' && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ShoppingCartIcon />}
              onClick={() => onBuy(content.id)}
              sx={{ ml: 1 }}
            >
              {content.price !== undefined && content.price > 0 ? 'Buy' : 'Claim'}
            </Button>
          )}
          
          {onRent && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => onRent(content.id)}
              sx={{ ml: 1 }}
            >
              Rent
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default EnhancedContentCard; 