import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper
} from '@mui/material';
import { contentService } from '../../services/content.service';
import { blockchainService } from '../../services/blockchain.service';
import { VerifiedUser, AddCircleOutline, ErrorOutline, Info } from '@mui/icons-material';

interface TokenVerifierProps {
  contentId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const TokenVerifier: React.FC<TokenVerifierProps> = ({ contentId, onSuccess, onError }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  // Automatically verify on mount with a small delay to allow blockchain transaction to process
  useEffect(() => {
    const timer = setTimeout(() => {
      handleVerify();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [contentId]);

  // Handle automatic retry (up to 3 times)
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying token verification (attempt ${retryCount + 1}/3)...`);
        handleVerify();
        setRetryCount(prevCount => prevCount + 1);
      }, 5000); // Retry every 5 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setError(null);
      setDetailedError(null);
      
      console.log(`Verifying token for content ID: ${contentId}`);
      
      // Check if MetaMask is connected
      if (!window.ethereum) {
        setError('MetaMask not detected. Please install MetaMask to verify tokens.');
        setVerifying(false);
        if (onError) onError(new Error('MetaMask not detected'));
        return;
      }
      
      // Get the current account from MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setError('No MetaMask account available. Please connect your wallet.');
        setVerifying(false);
        if (onError) onError(new Error('No wallet account available'));
        return;
      }
      
      const creatorAddress = accounts[0];
      console.log(`Using wallet address for verification: ${creatorAddress}`);
      
      // Verify token creation
      const verificationResult = await blockchainService.verifyTokenCreation(contentId, creatorAddress);
      console.log('Token verification result:', verificationResult);
      
      if (verificationResult.success && verificationResult.balance > 0) {
        setVerified(true);
        setTokenInfo({
          balance: verificationResult.balance,
          tokenAddress: verificationResult.tokenAddress
        });
        
        // If verification was successful, also update the content in local storage
        try {
          const content = await contentService.getContentById(contentId);
          if (content) {
            console.log('Content found, recording verified status');
            
            // For demo purposes, we'll use localStorage directly for this status
            // since we don't want to modify the Content type
            localStorage.setItem(`token_verified_${contentId}`, 'true');
            localStorage.setItem(`token_balance_${contentId}`, String(verificationResult.balance));
            
            console.log('Token verification status recorded');
          }
        } catch (contentError) {
          console.error('Error updating content after verification:', contentError);
        }
        
        if (onSuccess) onSuccess();
      } else {
        // Provide detailed error information
        let errorMessage = 'Token verification failed. The token may not have been created successfully.';
        let detailedInfo = '';
        
        if (verificationResult.balance === 0) {
          errorMessage = 'Token was created but your balance is 0. This may indicate an issue with the token creation process.';
          detailedInfo = 'The transaction might have been submitted but failed on the blockchain. Check your MetaMask for transaction status.';
        } else if (!verificationResult.success) {
          errorMessage = 'Could not verify token on the blockchain.';
          detailedInfo = 'Make sure you are using the same wallet that created the token and that you are connected to the correct network.';
        }
        
        setError(errorMessage);
        setDetailedError(detailedInfo);
        
        if (onError) onError(new Error(errorMessage));
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError(error instanceof Error ? error.message : 'Unknown error verifying token');
      setDetailedError('There was an unexpected error while verifying your token. Please try again or check the console for more details.');
      
      if (onError) onError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setVerifying(false);
    }
  };

  const handleImportToMetaMask = async () => {
    try {
      setImportStatus('importing');
      
      if (!tokenInfo || !tokenInfo.tokenAddress) {
        throw new Error('Token information not available for import');
      }
      
      const success = await blockchainService.addTokenToMetaMask(contentId);
      
      if (success) {
        setImportStatus('success');
      } else {
        setImportStatus('error');
        throw new Error('Failed to add token to MetaMask');
      }
    } catch (error) {
      console.error('Error importing token to MetaMask:', error);
      setImportStatus('error');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'aliceblue' }}>
      <Typography variant="h6" gutterBottom>
        Token Verification
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Verify that your token was created successfully and add it to MetaMask.
      </Typography>
      
      {verifying ? (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Verifying token on blockchain...</Typography>
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          icon={<ErrorOutline />}
          sx={{ mb: 2 }}
          action={
            retryCount < 3 ? (
              <Button color="inherit" size="small" onClick={handleVerify}>
                Retry
              </Button>
            ) : undefined
          }
        >
          <Typography variant="subtitle2">
            {error}
          </Typography>
          {detailedError && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {detailedError}
            </Typography>
          )}
          {retryCount >= 3 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Maximum retry attempts reached. You can still proceed with submission, 
                but please note that the content may not be properly tokenized.
              </Typography>
            </Box>
          )}
        </Alert>
      ) : verified ? (
        <Alert 
          severity="success" 
          icon={<VerifiedUser />}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2">
            Token verified successfully!
          </Typography>
          {tokenInfo && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your wallet has {tokenInfo.balance} tokens for this content.
            </Typography>
          )}
        </Alert>
      ) : (
        <Alert 
          severity="info" 
          icon={<Info />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            Checking token status...
          </Typography>
        </Alert>
      )}
      
      {verified && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={handleImportToMetaMask}
          disabled={importStatus === 'importing' || importStatus === 'success'}
          sx={{ mt: 1 }}
          fullWidth
        >
          {importStatus === 'importing' ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Adding to MetaMask...
            </>
          ) : importStatus === 'success' ? (
            'Added to MetaMask'
          ) : importStatus === 'error' ? (
            'Failed to Add - Try Again'
          ) : (
            'VERIFY TOKEN & IMPORT TO METAMASK'
          )}
        </Button>
      )}
    </Paper>
  );
};

export default TokenVerifier; 