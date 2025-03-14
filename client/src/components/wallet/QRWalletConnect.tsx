import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../../contexts/WalletContext';

interface QRWalletConnectProps {
  onConnected?: () => void;
}

const QRWalletConnect: React.FC<QRWalletConnectProps> = ({ onConnected }) => {
  // Mock wallet context functionality for demo purposes
  // In a real implementation, these would come from the actual WalletContext
  const { active, account } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [qrValue, setQrValue] = useState('');
  
  // Mock activate function
  const mockActivate = async (): Promise<void> => {
    // In a real implementation, this would be the actual activate function from WalletContext
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  };
  
  // In a real implementation, this would generate a session-specific connection URL
  // For now, we'll use a mock URL for demonstration
  useEffect(() => {
    // Generate a connection URL for the QR code
    // In a real app, this would create a session on your server
    // and return a unique connection URL
    const mockSessionId = Math.random().toString(36).substring(2, 10);
    const mockUrl = `https://wylloh.com/connect?session=${mockSessionId}`;
    setQrValue(mockUrl);
    
    // Simulate connection checking
    let checkInterval: NodeJS.Timeout;
    
    if (!active && connecting) {
      checkInterval = setInterval(() => {
        // In a real app, this would check if the session has been connected
        // For demo purposes, we'll simulate connection after 5 seconds
        const randomSuccess = Math.random() > 0.3; // 70% chance of success
        
        if (randomSuccess) {
          // Simulate successful connection
          mockActivate()
            .then(() => {
              setConnecting(false);
              if (onConnected) onConnected();
            })
            .catch((error: Error) => {
              setError('Failed to connect wallet: ' + error.message);
              setConnecting(false);
            });
          clearInterval(checkInterval);
        }
      }, 5000);
    }
    
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [active, connecting, onConnected]);
  
  // Start connection process
  const handleConnect = () => {
    setConnecting(true);
    setError('');
  };
  
  if (active && account) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          textAlign: 'center',
          maxWidth: 400,
          mx: 'auto',
          bgcolor: 'success.light',
          color: 'white'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Wallet Connected
        </Typography>
        <Typography variant="body1">
          {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        textAlign: 'center',
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Typography variant="h5" gutterBottom>
        Connect Your Wallet
      </Typography>
      
      {!connecting ? (
        <>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Scan this QR code with your mobile wallet app to connect to Wylloh
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 3 }}
            onClick={handleConnect}
          >
            Start Connection
          </Button>
        </>
      ) : (
        <>
          <Box sx={{ mb: 3, mt: 2 }}>
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Waiting for wallet connection...
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Open your wallet app and scan this code
          </Typography>
          
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setConnecting(false)}
          >
            Cancel
          </Button>
        </>
      )}
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
};

export default QRWalletConnect; 