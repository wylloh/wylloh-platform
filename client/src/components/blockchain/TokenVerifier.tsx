import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import { contentService } from '../../services/content.service';

interface TokenVerifierProps {
  contentId: string;
  onVerificationComplete?: (result: any) => void;
}

const TokenVerifier: React.FC<TokenVerifierProps> = ({ contentId, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  const handleVerifyToken = async () => {
    if (!contentId) {
      setError('Content ID not available for verification');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage('Verifying token creation and attempting to import to MetaMask...');
    
    try {
      const result = await contentService.verifyAndImportToken(contentId);
      setVerificationResult(result);
      
      if (result.verified) {
        setMessage(`Verification successful! Found ${result.balance} tokens for creator ${result.creatorAddress?.substring(0,8)}...${result.imported ? ' Token imported to MetaMask successfully!' : ''}`);
      } else {
        setError('Token verification failed. The token may not have been created successfully.');
      }
      
      // Notify parent component if callback is provided
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      setError(`Error verifying token: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box sx={{ mt: 4, mb: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Token Verification
      </Typography>
      <Typography variant="body2" paragraph>
        Verify that your token was created successfully and add it to MetaMask.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {message && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleVerifyToken}
        disabled={isLoading}
        sx={{ mt: 1 }}
      >
        {isLoading ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
            Verifying...
          </>
        ) : (
          'Verify Token & Import to MetaMask'
        )}
      </Button>
      
      {verificationResult && verificationResult.verified && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <AlertTitle>Token Verified Successfully!</AlertTitle>
          <Typography variant="body2">
            Found {verificationResult.balance} tokens owned by {verificationResult.creatorAddress?.substring(0,6)}...{verificationResult.creatorAddress?.substring(36)}
          </Typography>
          {verificationResult.imported ? (
            <Typography variant="body2">Token was imported to MetaMask successfully.</Typography>
          ) : (
            <Typography variant="body2">
              Token could not be automatically imported to MetaMask. You can import it manually in MetaMask by:
              <ol>
                <li>Opening MetaMask</li>
                <li>Going to the NFTs tab</li>
                <li>Clicking "Import NFTs"</li>
                <li>Entering the contract address and token ID</li>
              </ol>
            </Typography>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default TokenVerifier; 