// Gas Notification Component - Explains USDC-only experience to users
import React, { useState, useEffect } from 'react';
import { Box, Alert, AlertTitle, Collapse, IconButton, Typography } from '@mui/material';
import { Close, Info, CheckCircle, Warning } from '@mui/icons-material';

interface GasNotificationProps {
  show?: boolean;
  onClose?: () => void;
}

const GasNotification: React.FC<GasNotificationProps> = ({ show = true, onClose }) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <Collapse in={isVisible}>
      <Alert
        severity="info"
        sx={{
          mb: 2,
          bgcolor: '#e3f2fd',
          border: '1px solid #1976d2',
          borderRadius: 2,
          '& .MuiAlert-icon': {
            color: '#1976d2'
          }
        }}
        icon={<CheckCircle />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            <Typography variant="h6" component="span">
              🔥 Gas Fees Covered by Wylloh Beta!
            </Typography>
          </Box>
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>You only need USDC to purchase content!</strong>
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            ✅ <strong>No MATIC needed:</strong> We cover blockchain transaction fees<br/>
            ✅ <strong>Simple payments:</strong> Pay $4.99 USDC per film token<br/>
            ✅ <strong>Beta experiment:</strong> Help us test Web3 entertainment<br/>
            ✅ <strong>Transparent pricing:</strong> No hidden fees or surprises
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <Info sx={{ fontSize: 14, mr: 0.5 }} />
            Gas costs are typically $0.003-0.015 per transaction on Polygon - 
            we absorb these costs during our beta phase to keep things simple.
          </Typography>
        </Box>
      </Alert>
    </Collapse>
  );
};

export default GasNotification; 