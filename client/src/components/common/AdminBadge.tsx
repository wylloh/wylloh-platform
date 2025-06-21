import React from 'react';
import { Chip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

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
    component="svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    sx={{ 
      fill: 'currentColor',
      filter: 'brightness(0) invert(1)', // Make it white
    }}
  >
    {/* Simplified Wylloh logo - tree/mountain shape */}
    <path d="M12 2L2 20h20L12 2zm0 3.5L18.5 18h-13L12 5.5z" />
    <circle cx="12" cy="12" r="2" />
  </Box>
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
        }}
      >
        <WyllohLogoIcon />
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