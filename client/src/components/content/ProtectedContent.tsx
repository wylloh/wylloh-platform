import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { blockchainService } from '../../services/blockchain.service';
import { downloadService } from '../../services/download.service';
import { Link } from 'react-router-dom';

interface ProtectedContentProps {
  contentId: string;
  contentCid: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Protects content with strict blockchain verification
 * Only users who own the appropriate tokens can view the protected content
 */
const ProtectedContent: React.FC<ProtectedContentProps> = ({
  contentId,
  contentCid,
  children,
  fallback,
}) => {
  const { account, active, connect } = useWallet();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify access when wallet or content changes
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      setError(null);

      // Step 1: Check if wallet is connected
      if (!active || !account) {
        setError('Please connect your wallet to access this content');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        // Step 2: Check blockchain for token ownership - no fallbacks
        if (blockchainService.isInitialized()) {
          const tokenBalance = await blockchainService.getTokenBalance(account, contentId);
          const hasAccess = tokenBalance > 0;
          
          setAuthorized(hasAccess);
          
          if (!hasAccess) {
            setError('You do not own the required token to access this content');
          }
        } else {
          // Blockchain service not initialized - try downloadService
          const canAccess = await downloadService.canAccessContent(contentCid, account);
          setAuthorized(canAccess);
          
          if (!canAccess) {
            setError('You do not have permission to access this content');
          }
        }
      } catch (err) {
        console.error('Error verifying access:', err);
        setError('Failed to verify content access');
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [active, account, contentId, contentCid]);

  // Default unauthorized view
  const defaultFallback = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Access Restricted
      </Typography>
      <Typography variant="body1" paragraph>
        {error || 'You do not have the required token to access this content'}
      </Typography>
      {!active && (
        <Button variant="contained" color="primary" onClick={connect} sx={{ mt: 2 }}>
          Connect Wallet
        </Button>
      )}
      {active && (
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to={`/marketplace/details/${contentId}`}
          sx={{ mt: 2 }}
        >
          Purchase Access
        </Button>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return authorized ? <>{children}</> : <>{fallback || defaultFallback}</>;
};

export default ProtectedContent; 