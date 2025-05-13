import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  Grid,
  Collapse,
  Button,
  Divider,
  Badge,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Sell as SellIcon,
  Send as SendIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
  Group as GroupIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import { TokenCollection } from './ContentSelectionToolbar';
import EnhancedContentCard from '../common/EnhancedContentCard';
import { libraryItemToContent } from '../../pages/library/LibraryPage';

interface CollectionCardProps {
  collection: TokenCollection;
  onLend?: (contentId: string) => void;
  onSell?: (contentId: string) => void;
  onInfo?: (contentId: string) => void;
  onPlay?: (contentId: string) => void;
  onSelect?: (contentId: string, selected: boolean) => void;
  selected?: boolean;
  userIsPro?: boolean;
  context?: 'pro' | 'consumer';
}

/**
 * A card component for displaying a collection of tokens for the same content,
 * with the ability to expand and see individual tokens.
 */
const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onLend,
  onSell,
  onInfo,
  onPlay,
  onSelect,
  selected = false,
  userIsPro = false,
  context = 'consumer',
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Extract collection details
  const { title, totalTokens, items, value } = collection;
  
  // Get a representative item from the collection
  const representativeItem = items[0];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `${value.toFixed(3)} ETH`;
  };
  
  // Handle expand toggle
  const handleExpandToggle = () => {
    setExpanded(!expanded);
  };
  
  // Handle selection
  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(collection.contentId, event.target.checked);
    }
  };
  
  // Get thumbnail from first item
  const getThumbnail = () => {
    const item = representativeItem as any;
    return item.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail';
  };
  
  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
      }}
    >
      {/* Select checkbox */}
      {onSelect && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Checkbox 
            checked={selected}
            onChange={handleSelect}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' } 
            }}
          />
        </Box>
      )}
      
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={180}
          image={getThumbnail()}
          alt={title}
        />
        
        {/* Collection badge */}
        <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
          <Chip
            icon={<GroupIcon />}
            label={`${totalTokens} Tokens`}
            color="primary"
            sx={{ bgcolor: 'rgba(0, 0, 0, 0.6)', color: 'white' }}
          />
        </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Total Value
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatCurrency(value)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Token Count
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {totalTokens}
            </Typography>
          </Grid>
          
          {representativeItem.licenseType && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                License Type
              </Typography>
              <Box>
                <Chip 
                  label={representativeItem.licenseType.charAt(0).toUpperCase() + representativeItem.licenseType.slice(1)} 
                  size="small" 
                  color={
                    representativeItem.licenseType === 'perpetual' ? 'success' :
                    representativeItem.licenseType === 'commercial' ? 'primary' :
                    'default'
                  }
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {onInfo && (
            <Tooltip title="Collection Info">
              <IconButton onClick={() => onInfo(collection.contentId)} size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {onPlay && (
            <Tooltip title="Play Content">
              <IconButton onClick={() => onPlay(representativeItem.contentId)} size="small">
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box>
          {onSell && (
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<SellIcon />}
              onClick={() => onSell(collection.contentId)}
            >
              Sell
            </Button>
          )}
          
          {onLend && (
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<SendIcon />}
              onClick={() => onLend(collection.contentId)}
              sx={{ ml: 1 }}
            >
              Lend
            </Button>
          )}
        </Box>
      </CardActions>
      
      <Divider />
      
      {/* Expand button */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: 1,
          bgcolor: expanded ? 'action.selected' : 'transparent',
          transition: 'background-color 0.2s'
        }}
        onClick={handleExpandToggle}
      >
        <Button 
          size="small" 
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? "Collapse" : "View Individual Tokens"}
        </Button>
      </Box>
      
      {/* Expandable content showing individual tokens */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" gutterBottom>
            Individual Tokens
          </Typography>
          
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} md={6} key={item.contentId}>
                <EnhancedContentCard
                  content={libraryItemToContent(item)}
                  context={context}
                  variant="compact"
                  onPlay={onPlay ? () => onPlay(item.contentId) : undefined}
                  onView={onInfo ? () => onInfo(item.contentId) : undefined}
                  elevation={1}
                  showPrice={true}
                />
                
                <Box mt={1} display="flex" justifyContent="space-between">
                  {item.tokenData && (
                    <>
                      {onSell && (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small"
                          startIcon={<SellIcon />}
                          onClick={() => onSell(item.contentId)}
                        >
                          Sell
                        </Button>
                      )}
                      
                      {onLend && (
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() => onLend(item.contentId)}
                          disabled={item.isLent}
                        >
                          {item.isLent ? 'Lent Out' : 'Lend'}
                        </Button>
                      )}
                    </>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Card>
  );
};

export default CollectionCard; 