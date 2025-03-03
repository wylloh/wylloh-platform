import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TokenOutlined as TokenIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Define content item interface
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  contentType: string;
  status: string;
  visibility: string;
  createdAt: string;
  views: number;
  tokenized: boolean;
  tokenId: string | null;
  sales: number;
}

// Define content card props
interface ContentCardProps {
  content: ContentItem;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, contentId: string) => void;
}

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Show content status chip
const renderStatusChip = (status: string) => {
  switch (status) {
    case 'active':
      return <Chip label="Active" size="small" color="success" />;
    case 'draft':
      return <Chip label="Draft" size="small" color="default" />;
    case 'pending':
      return <Chip label="Pending" size="small" color="warning" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

// Show visibility chip
const renderVisibilityChip = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return <Chip icon={<VisibilityIcon />} label="Public" size="small" color="primary" />;
    case 'private':
      return <Chip icon={<VisibilityOffIcon />} label="Private" size="small" />;
    case 'unlisted':
      return <Chip icon={<VisibilityOffIcon />} label="Unlisted" size="small" color="info" />;
    default:
      return <Chip label={visibility} size="small" />;
  }
};

// Content Card Component
const ContentCard: React.FC<ContentCardProps> = ({ content, onMenuOpen }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="140"
        image={content.thumbnailUrl}
        alt={content.title}
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" noWrap>
          {content.title}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2
          }}
        >
          {content.description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {renderStatusChip(content.status)}
          {renderVisibilityChip(content.visibility)}
          <Chip label={content.contentType} size="small" />
          {content.tokenized && (
            <Chip icon={<TokenIcon />} label="Tokenized" size="small" color="secondary" />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(content.createdAt)}
          </Typography>
          <Typography variant="body2">
            Views: {content.views}
          </Typography>
        </Box>
        
        {content.tokenized && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              TokenID: {content.tokenId?.substring(0, 6)}...
            </Typography>
            <Typography variant="body2">
              Sales: {content.sales}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<PlayArrowIcon />}
          component={Link}
          to={`/player/${content.id}`}
        >
          Play
        </Button>
        
        <Button 
          size="small" 
          startIcon={<EditIcon />}
          component={Link}
          to={`/creator/edit/${content.id}`}
        >
          Edit
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton 
          aria-label="more" 
          onClick={(e) => onMenuOpen(e, content.id)}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default ContentCard;