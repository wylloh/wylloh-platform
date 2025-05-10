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
  Tooltip,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  AttachMoney as AttachMoneyIcon,
  Send as SendIcon,
  Verified as VerifiedIcon,
  ErrorOutline as ErrorOutlineIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { LibraryItem } from '../../services/library.service';
import TokenOriginBadge from '../tokens/TokenOriginBadge';
import { TokenData } from '../../utils/tokenFilters';

interface LibraryContentCardProps {
  item: LibraryItem & {
    title: string;
    thumbnailUrl: string;
    genre?: string;
    director?: string;
    year?: number;
  };
  onLend: (item: LibraryItem) => void;
  onSell: (item: LibraryItem) => void;
  onInfo: (item: LibraryItem) => void;
  onVerifyOwnership?: (item: LibraryItem) => void;
}

const LibraryContentCard: React.FC<LibraryContentCardProps> = ({
  item,
  onLend,
  onSell,
  onInfo,
  onVerifyOwnership,
}) => {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Get license type label
  const getLicenseTypeLabel = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal Use';
      case 'commercial':
        return 'Commercial Use';
      case 'perpetual':
        return 'Perpetual License';
      case 'limited':
        return 'Limited License';
      default:
        return type;
    }
  };

  // Get license type color
  const getLicenseTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (type) {
      case 'personal':
        return 'info';
      case 'commercial':
        return 'secondary';
      case 'perpetual':
        return 'success';
      case 'limited':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get ownership verification status indicator
  const getOwnershipStatus = () => {
    if (!item.tokenData) {
      return null;
    }

    if (item.tokenData.ownershipVerified) {
      return (
        <Tooltip title="Ownership verified on blockchain">
          <IconButton size="small" color="success">
            <VerifiedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    } else if (item.tokenData.ownershipLastChecked) {
      return (
        <Tooltip title={`Last verified: ${formatDate(item.tokenData.ownershipLastChecked)}. Click to verify now.`}>
          <IconButton size="small" color="warning" onClick={() => onVerifyOwnership && onVerifyOwnership(item)}>
            <AccessTimeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Ownership not verified. Click to verify on blockchain.">
          <IconButton size="small" color="error" onClick={() => onVerifyOwnership && onVerifyOwnership(item)}>
            <ErrorOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
  };

  // Create token data object for TokenOriginBadge if it exists
  const getTokenData = (): TokenData | null => {
    if (!item.tokenData) return null;

    return {
      tokenId: item.tokenData.tokenId,
      contractAddress: item.tokenData.contractAddress,
      standard: item.tokenData.standard,
      chain: item.tokenData.chain,
      metadata: item.tokenData.metadata
    };
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="160"
        image={item.thumbnailUrl}
        alt={item.title}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography variant="h6" component="div" noWrap>
            {item.title}
          </Typography>
          {getOwnershipStatus()}
        </Stack>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={getLicenseTypeLabel(item.licenseType)} 
            color={getLicenseTypeColor(item.licenseType)} 
            size="small" 
          />
          {item.genre && <Chip label={item.genre} size="small" />}
          {item.year && <Chip label={item.year.toString()} size="small" />}
          {item.isLent && <Chip label="Currently Lent" color="warning" size="small" />}
          
          {/* Display token origin badge if token data exists */}
          {item.tokenData && getTokenData() && (
            <TokenOriginBadge token={getTokenData()!} size="small" />
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Purchased:</strong> {formatDate(item.purchaseDate)}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">
              <strong>Purchase Price:</strong> {formatCurrency(item.purchasePrice)}
            </Typography>
            <Typography variant="body2" color={item.currentValue > item.purchasePrice ? 'success.main' : 'error.main'}>
              <strong>Current Value:</strong> {formatCurrency(item.currentValue)}
            </Typography>
          </Box>
          
          {item.director && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Director:</strong> {item.director}
            </Typography>
          )}
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          size="small" 
          startIcon={<InfoIcon />}
          onClick={() => onInfo(item)}
        >
          Details
        </Button>
        
        <Button 
          size="small" 
          startIcon={<SendIcon />}
          onClick={() => onLend(item)}
          disabled={item.isLent}
        >
          Lend
        </Button>
        
        <Button 
          size="small" 
          startIcon={<AttachMoneyIcon />}
          onClick={() => onSell(item)}
        >
          Sell
        </Button>
      </CardActions>
    </Card>
  );
};

export default LibraryContentCard; 