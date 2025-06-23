import React from 'react';
import { Chip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Import the Wylloh logo asset
import LogoWhite from '../../assets/logo-white.svg';

const AdminChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '20px',
  '& .MuiChip-icon': {
    width: '14px',
    height: '14px',
    marginLeft: '4px',
  },
  '& .MuiChip-label': {
    paddingLeft: '6px',
    paddingRight: '8px',
  },
}));

const WyllohLogoIcon = () => (
  <Box
    component="img"
    src={LogoWhite}
    alt="Wylloh Logo"
    sx={{
      width: '14px',
      height: '14px',
      filter: 'brightness(0) invert(1)', // Ensure it's white on colored background
    }}
  />
);

interface AdminBadgeProps {
  size?: 'small' | 'medium';
  variant?: 'chip' | 'icon';
}

const AdminBadge: React.FC<AdminBadgeProps> = ({ 
  size = 'small', 
  variant = 'chip' 
}) => {
  if (variant === 'icon') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'small' ? 16 : 20,
          height: size === 'small' ? 16 : 20,
          backgroundColor: 'primary.main',
          borderRadius: '50%',
          ml: 0.5,
          p: 0.25, // Small padding to prevent logo from touching edges
        }}
      >
        <Box
          component="img"
          src={LogoWhite}
          alt="Wylloh Logo"
          sx={{
            width: size === 'small' ? '10px' : '12px',
            height: size === 'small' ? '10px' : '12px',
            filter: 'brightness(0) invert(1)', // Ensure it's white on colored background
          }}
        />
      </Box>
    );
  }

  return (
    <AdminChip
      icon={<WyllohLogoIcon />}
      label="OFFICIAL"
      size="small"
    />
  );
};

export default AdminBadge; 