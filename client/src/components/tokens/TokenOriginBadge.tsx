import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { TokenData } from '../../utils/tokenFilters';

interface TokenOriginBadgeProps {
  token: TokenData;
  size?: 'small' | 'medium';
  showTooltip?: boolean;
  onClick?: () => void;
}

/**
 * Component to display the origin of a token (Wylloh or external platform)
 */
const TokenOriginBadge: React.FC<TokenOriginBadgeProps> = ({
  token,
  size = 'small',
  showTooltip = true,
  onClick
}) => {
  // Determine if token is a native Wylloh token or from an external platform
  const isNativeWylloh = token.metadata?.origin === 'wylloh' || 
                        !token.metadata?.origin || 
                        token.metadata?.wyllohContentSignature?.startsWith('wylloh:verified:');
  
  const isExternalProtocol = !isNativeWylloh && token.metadata?.protocol === 'wylloh';
  
  // Get external platform name if applicable
  const externalPlatform = token.metadata?.origin || 'External Platform';
  
  // Set label and color based on origin
  let label = 'Wylloh Verified';
  let color: 'primary' | 'success' | 'default' = 'primary';
  let icon = <VerifiedIcon fontSize={size} />;
  
  if (isExternalProtocol) {
    label = externalPlatform;
    color = 'success';
    icon = <InfoOutlinedIcon fontSize={size} />;
  }
  
  // Tooltip content based on origin
  const tooltipContent = isNativeWylloh
    ? 'This content was originally tokenized on Wylloh and meets our quality standards.'
    : `This content was originally tokenized on ${externalPlatform} and supports the Wylloh protocol.`;
  
  // If tooltip is disabled, just render the chip
  if (!showTooltip) {
    return (
      <Chip
        label={label}
        color={color}
        size={size}
        icon={icon}
        onClick={onClick}
        clickable={!!onClick}
      />
    );
  }
  
  // Render with tooltip
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">{tooltipContent}</Typography>
          {isExternalProtocol && (
            <Box display="flex" alignItems="center" mt={1}>
              <OpenInNewIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption">
                View on {externalPlatform}
              </Typography>
            </Box>
          )}
        </Box>
      }
      arrow
    >
      <Chip
        label={label}
        color={color}
        size={size}
        icon={icon}
        onClick={onClick}
        clickable={!!onClick}
      />
    </Tooltip>
  );
};

export default TokenOriginBadge; 