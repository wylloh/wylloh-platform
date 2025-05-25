import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

// Import logo assets
import LogoWhite from '../../assets/logo-white.svg';
import LogoBlack from '../../assets/logo-black.svg';
import LogoHorizontal from '../../assets/logo-horizontal.svg';

export type LogoVariant = 'white' | 'black' | 'horizontal';
export type LogoSize = 'small' | 'medium' | 'large' | 'xlarge';

interface WyllohLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  sx?: SxProps<Theme>;
  onClick?: () => void;
  alt?: string;
}

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 32, height: 32 },
  medium: { width: 48, height: 48 },
  large: { width: 64, height: 64 },
  xlarge: { width: 96, height: 96 },
};

const horizontalSizeMap: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 120, height: 40 },
  medium: { width: 180, height: 60 },
  large: { width: 240, height: 80 },
  xlarge: { width: 300, height: 100 },
};

const WyllohLogo: React.FC<WyllohLogoProps> = ({
  variant = 'white',
  size = 'medium',
  sx,
  onClick,
  alt = 'Wylloh Logo',
}) => {
  const getLogoSrc = (): string => {
    switch (variant) {
      case 'black':
        return LogoBlack;
      case 'horizontal':
        return LogoHorizontal;
      case 'white':
      default:
        return LogoWhite;
    }
  };

  const getDimensions = () => {
    return variant === 'horizontal' ? horizontalSizeMap[size] : sizeMap[size];
  };

  const { width, height } = getDimensions();

  return (
    <Box
      component="img"
      src={getLogoSrc()}
      alt={alt}
      sx={{
        width,
        height,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          opacity: 0.8,
        } : {},
        ...sx,
      }}
      onClick={onClick}
    />
  );
};

export default WyllohLogo; 