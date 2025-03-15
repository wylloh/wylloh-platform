import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if Pro verification is required and if user has verified status
  if (requireProVerified && user?.proStatus !== 'verified') {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  // Check if admin role is required and if user has it
  if (requireAdmin && !user?.roles.includes('admin')) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute; 