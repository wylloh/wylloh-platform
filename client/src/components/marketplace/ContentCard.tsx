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
} from '@mui/material';
import { POSTER_STYLES, POSTER_DIMENSIONS } from '../../config/ui.constants';
import {
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Define content item interface
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  contentType: string;
  creator: string;
  price: number;
}

// Define content card props
interface ContentCardProps {
  content: ContentItem;
}

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const ContentCard: React.FC<ContentCardProps> = ({ content }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height={POSTER_DIMENSIONS.MARKETPLACE_CARD}
        image={content.image}
        alt={content.title}
        sx={POSTER_STYLES.MOVIE_POSTER}
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
          <Chip label={content.contentType.toUpperCase()} size="small" />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            By {content.creator}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<InfoIcon />}
          component={Link}
          to={`/marketplace/${content.id}`}
        >
          Details
        </Button>
        
        <Button 
          size="small" 
          startIcon={<PlayArrowIcon />}
          component={Link}
          to={`/player/${content.id}`}
        >
          Preview
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Typography variant="button" color="primary">
          {content.price} MATIC
        </Typography>
      </CardActions>
    </Card>
  );
};

export default ContentCard;