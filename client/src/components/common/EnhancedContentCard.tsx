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
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={180}
          image={getThumbnailUrl()}
          alt={content.title}
        />
        
        {/* Favorite button overlay */}
        {onFavorite && (
          <IconButton
            onClick={() => onFavorite(content.id)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
            }}
          >
            {isFavorite ? (
              <FavoriteIcon color="error" />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
        )}
        
        {/* Play button overlay */}
        {onPlay && (
          <IconButton
            onClick={() => onPlay(content.id)}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
            }}
          >
            <PlayArrowIcon fontSize="large" />
          </IconButton>
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {content.title}
          </Typography>
          
          {!hideStatus && (
            <ContentStatusBadge
              status={context === 'pro' ? content.status : 'active'}
              visibility={context === 'pro' ? content.visibility : undefined}
              tokenized={content.tokenized}
              showLabel={false}
              size="small"
              context={context}
            />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          by {content.creator}
        </Typography>
        
        {content.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {content.description}
          </Typography>
        )}
        
        {/* Content type chip */}
        <Chip 
          icon={getContentTypeIcon()} 
          label={content.contentType} 
          size="small"
          sx={{ mb: 1 }}
        />
        
        {/* Show price if available and requested */}
        {showPrice && content.price !== undefined && (
          <Typography variant="h6" color="primary.main" sx={{ mt: 1, fontWeight: 'bold' }}>
            {formatCurrency(content.price)}
            {content.available !== undefined && content.totalSupply !== undefined && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({content.available}/{content.totalSupply} available)
              </Typography>
            )}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
        <Button
          size="small"
          startIcon={<InfoIcon />}
          component={Link}
          to={`/content/${content.id}`}
        >
          Details
        </Button>
        
        <Box>
          {onPlay && (
            <Button
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={() => onPlay(content.id)}
              sx={{ mr: 1 }}
            >
              Play
            </Button>
          )}
          
          {onBuy && (
            <Button
              size="small"
              color="primary"
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={() => onBuy(content.id)}
            >
              Buy
            </Button>
          )}
          
          {onRent && !onBuy && (
            <Button
              size="small"
              color="secondary"
              variant="outlined"
              onClick={() => onRent(content.id)}
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