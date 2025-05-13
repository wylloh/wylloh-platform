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
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Movie as MovieIcon,
  Audiotrack as AudioIcon,
  Book as BookIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  PeopleAlt as CastIcon,
  DateRange as DateIcon,
  Timer as DurationIcon,
} from '@mui/icons-material';
import { Content } from '../../services/content.service';
import ContentStatusBadge from './ContentStatusBadge';
import ContentQuickActions from './ContentQuickActions';

interface EnhancedContentCardProps {
  content: Content;
  loading?: boolean;
  onDelete?: (contentId: string) => void;
  onTokenize?: (contentId: string) => void;
  onSetVisibility?: (contentId: string, visibility: 'public' | 'private' | 'unlisted') => void;
  onSetStatus?: (contentId: string, status: 'draft' | 'pending' | 'active') => void;
  onShare?: (contentId: string) => void;
  onDuplicate?: (contentId: string) => void;
  onView?: (contentId: string) => void;
  elevation?: number;
  variant?: 'compact' | 'standard' | 'detailed';
}

/**
 * An enhanced content card with improved status visualization and quick actions
 */
const EnhancedContentCard: React.FC<EnhancedContentCardProps> = ({
  content,
  loading = false,
  onDelete,
  onTokenize,
  onSetVisibility,
  onSetStatus,
  onShare,
  onDuplicate,
  onView,
  elevation = 1,
  variant = 'standard',
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

  // Render content stats
  const renderContentStats = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Tooltip title="Views">
          <Chip
            label={`${content.views || 0} views`}
            size="small"
            variant="outlined"
          />
        </Tooltip>
        
        {content.tokenized && (
          <Tooltip title="Sales">
            <Chip
              label={`${content.sales || 0} sales`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Tooltip>
        )}
        
        {content.tokenized && (
          <Tooltip title="Available tokens">
            <Chip
              label={`${content.available || 0}/${content.totalSupply || 0}`}
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Tooltip>
        )}
      </Box>
    );
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Card elevation={elevation} sx={{ display: 'flex', height: '100%' }}>
        {loading ? (
          <Skeleton variant="rectangular" width={120} height="100%" />
        ) : (
          <CardMedia
            component="img"
            sx={{ width: 120 }}
            image={getThumbnailUrl()}
            alt={content.title}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
            {loading ? (
              <>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </>
            ) : (
              <>
                <Typography variant="subtitle1" component="div" noWrap>
                  {content.title}
                </Typography>
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                  <ContentStatusBadge
                    status={content.status}
                    visibility={content.visibility}
                    tokenized={content.tokenized}
                    size="small"
                    showLabel={false}
                  />
                </Box>
              </>
            )}
          </CardContent>
          <CardActions sx={{ pt: 0 }}>
            {!loading && (
              <ContentQuickActions
                content={content}
                onDelete={onDelete}
                onTokenize={onTokenize}
                onSetVisibility={onSetVisibility}
                onSetStatus={onSetStatus}
                onShare={onShare}
                onDuplicate={onDuplicate}
                onView={onView}
                showLabels={false}
              />
            )}
          </CardActions>
        </Box>
      </Card>
    );
  }

  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <Paper elevation={elevation} sx={{ overflow: 'hidden' }}>
        <Grid container spacing={0}>
          <Grid item xs={12} sm={3}>
            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={200} />
            ) : (
              <CardMedia
                component="img"
                height={200}
                image={getThumbnailUrl()}
                alt={content.title}
                sx={{ objectFit: 'cover' }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ p: 2 }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width="70%" height={40} />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="90%" />
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {content.title}
                    </Typography>
                    <ContentQuickActions
                      content={content}
                      onDelete={onDelete}
                      onTokenize={onTokenize}
                      onSetVisibility={onSetVisibility}
                      onSetStatus={onSetStatus}
                      onShare={onShare}
                      onDuplicate={onDuplicate}
                      onView={onView}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {content.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Status Information
                        </Typography>
                        <ContentStatusBadge
                          status={content.status}
                          visibility={content.visibility}
                          tokenized={content.tokenized}
                          showLabel={true}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Content Type
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getContentTypeIcon()}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {content.contentType || 'Unspecified'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Creation Date
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(content.createdAt)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Metadata
                      </Typography>
                      {renderMetadataTags()}
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  {renderContentStats()}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  // Render standard variant (default)
  return (
    <Card elevation={elevation} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={180} />
      ) : (
        <CardMedia
          component="img"
          height={180}
          image={getThumbnailUrl()}
          alt={content.title}
        />
      )}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="60%" />
          </>
        ) : (
          <>
            <Typography variant="h6" component="div" noWrap>
              {content.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1
            }}>
              {content.description}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, gap: 0.5 }}>
              <ContentStatusBadge
                status={content.status}
                visibility={content.visibility}
                tokenized={content.tokenized}
                size="small"
                showLabel={false}
              />
            </Box>
          </>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        {!loading && (
          <ContentQuickActions
            content={content}
            onDelete={onDelete}
            onTokenize={onTokenize}
            onSetVisibility={onSetVisibility}
            onSetStatus={onSetStatus}
            onShare={onShare}
            onDuplicate={onDuplicate}
            onView={onView}
          />
        )}
      </CardActions>
    </Card>
  );
};

export default EnhancedContentCard; 