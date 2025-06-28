import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProVerified?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProVerified = false,
  requireAdmin = false
}) => {
  const { isAuthenticated, user, refreshUser, loading } = useAuth();
  const location = useLocation();
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // 🚀 ENTERPRISE: Intelligent Pro status verification
  useEffect(() => {
    const verifyProStatus = async () => {
      // Only verify Pro status if:
      // 1. User is authenticated
      // 2. Pro verification is required for this route
      // 3. User's current status is not verified
      // 4. We haven't already completed verification for this session
      if (isAuthenticated && requireProVerified && user?.proStatus !== 'verified' && !verificationComplete) {
        setVerificationLoading(true);
        
        try {
          // 📊 SCALABLE: Only refresh if Pro status might have changed
          // This prevents unnecessary API calls for already verified users
          const refreshSuccess = await refreshUser();
          
          if (refreshSuccess) {
            console.log('🔄 Pro status verification completed');
          }
        } catch (error) {
          console.error('Pro status verification failed:', error);
        } finally {
          setVerificationLoading(false);
          setVerificationComplete(true);
        }
      }
    };

    verifyProStatus();
  }, [isAuthenticated, user?.proStatus, requireProVerified, refreshUser, verificationComplete]);

  // Show loading state during auth initialization or Pro verification
  if (loading || verificationLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Initializing...' : 'Verifying Pro status...'}
        </Typography>
      </Box>
    );
  }

  // Check if user is authenticated - Web3-first: redirect to home with Connect prompt
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, needsAuth: true }} replace />;
  }

  // Check if Pro verification is required and if user has verified status
  if (requireProVerified && user?.proStatus !== 'verified') {
    return <Navigate to="/profile" state={{ from: location, needsProVerification: true }} replace />;
  }

  // Check if admin role is required and if user has it
  if (requireAdmin && !user?.roles?.includes('admin')) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute; 