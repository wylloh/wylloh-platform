import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Link as LinkIcon,
  TokenOutlined as TokenIcon,
  CancelOutlined as CancelIcon,
  PlaylistAdd as DraftIcon,
} from '@mui/icons-material';

/**
 * Content status badge configuration interface
 */
export interface ContentStatusConfig {
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactElement;
  tooltip: string;
}

export interface ContentStatusBadgeProps {
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'processing';
  visibility?: 'public' | 'private' | 'unlisted';
  tokenized?: boolean;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  variant?: 'outlined' | 'filled';
  context?: 'pro' | 'consumer' | 'store' | 'search';
  customStatus?: ContentStatusConfig;
  customStatuses?: ContentStatusConfig[];
  orientation?: 'horizontal' | 'vertical';
  gap?: number;
}

/**
 * A platform-wide component for displaying content status with clear visual indicators.
 * This component can be used in both Pro and consumer interfaces with appropriate styling.
 */
const ContentStatusBadge: React.FC<ContentStatusBadgeProps> = ({
  status,
  visibility = 'private',
  tokenized = false,
  size = 'medium',
  showLabel = true,
  variant = 'outlined',
  context = 'pro',
  customStatus,
  customStatuses = [],
  orientation = 'horizontal',
  gap = 0.5,
}) => {
  // Define status configurations
  const statusConfig: Record<string, ContentStatusConfig> = {
    draft: {
      label: 'Draft',
      color: 'default',
      icon: <DraftIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is in draft stage and not yet published',
    },
    pending: {
      label: 'Pending',
      color: 'warning',
      icon: <PendingIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is pending approval or processing',
    },
    processing: {
      label: 'Processing',
      color: 'info',
      icon: <PendingIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is being processed',
    },
    active: {
      label: 'Active',
      color: 'success',
      icon: <CheckCircleIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is active and published',
    },
    rejected: {
      label: 'Rejected',
      color: 'error',
      icon: <CancelIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content has been rejected',
    },
  };

  // Define visibility configurations
  const visibilityConfig: Record<string, ContentStatusConfig> = {
    public: {
      label: 'Public',
      color: 'success',
      icon: <PublicIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is visible to everyone',
    },
    private: {
      label: 'Private',
      color: 'default',
      icon: <LockIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is only visible to you',
    },
    unlisted: {
      label: 'Unlisted',
      color: 'info',
      icon: <LinkIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
      tooltip: 'This content is only accessible via direct link',
    },
  };

  // Define tokenization configuration
  const tokenizedConfig: ContentStatusConfig = {
    label: 'Tokenized',
    color: 'secondary',
    icon: <TokenIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
    tooltip: 'This content has been tokenized on the blockchain',
  };

  // Get the current status configuration
  const currentStatus = customStatus || (status && statusConfig[status]);
  const currentVisibility = visibility ? visibilityConfig[visibility] : null;

  // Apply context-specific styling
  const getContextStyles = () => {
    switch (context) {
      case 'consumer':
        return {
          chipSize: size === 'small' ? 20 : 24,
          spacing: gap * 0.75,
          opacity: 0.9,
        };
      case 'store':
        return {
          chipSize: size === 'small' ? 24 : 28,
          spacing: gap,
          opacity: 1,
        };
      case 'search':
        return {
          chipSize: size === 'small' ? 20 : 24,
          spacing: gap * 0.75, 
          opacity: 0.85,
        };
      case 'pro':
      default:
        return {
          chipSize: size === 'small' ? 24 : 32,
          spacing: gap,
          opacity: 1,
        };
    }
  };

  const contextStyles = getContextStyles();

  // Render individual chip
  const renderChip = (config: ContentStatusConfig, key: string) => (
    <Tooltip title={config.tooltip} key={key}>
      <Chip
        icon={config.icon}
        label={showLabel ? config.label : undefined}
        color={config.color}
        size={size}
        variant={variant}
        sx={{
          m: contextStyles.spacing,
          height: contextStyles.chipSize,
          opacity: contextStyles.opacity,
          '& .MuiChip-icon': {
            ml: showLabel ? undefined : '0px',
            mr: showLabel ? undefined : '0px',
          },
        }}
      />
    </Tooltip>
  );

  // Prepare statuses to render
  const statusesToRender: ContentStatusConfig[] = [];
  
  // Add custom statuses first if provided
  if (customStatuses.length > 0) {
    statusesToRender.push(...customStatuses);
  } else {
    // Otherwise add the standard statuses
    if (currentStatus) statusesToRender.push(currentStatus);
    if (currentVisibility) statusesToRender.push(currentVisibility);
    if (tokenized) statusesToRender.push(tokenizedConfig);
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        flexWrap: orientation === 'vertical' ? 'nowrap' : 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: contextStyles.spacing,
      }}
    >
      {statusesToRender.map((config, index) => renderChip(config, `status-${index}`))}
    </Box>
  );
};

export default ContentStatusBadge; 