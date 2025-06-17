import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

interface AuthenticationLoaderProps {
  show: boolean;
  message?: string;
}

/**
 * AuthenticationLoader - Shows a subtle loading indicator during authentication
 * 
 * This component appears when authentication is in progress to provide
 * visual feedback to users without being too intrusive.
 */
const AuthenticationLoader: React.FC<AuthenticationLoaderProps> = ({ 
  show, 
  message = 'Authenticating...' 
}) => {
  if (!show) return null;

  return (
    <Fade in={show}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          backdropFilter: 'blur(1px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: 2,
          height: '100vh',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: 3,
            pointerEvents: 'auto',
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default AuthenticationLoader; 