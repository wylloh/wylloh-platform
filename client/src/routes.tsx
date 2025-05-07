import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ContentDetailsPage from './pages/marketplace/ContentDetailsPage';
import TestContentDetails from './pages/marketplace/TestContentDetails';
import DashboardPage from './pages/creator/DashboardPage';
import UploadPage from './pages/creator/UploadPage';
import TokenizePublishPage from './pages/creator/TokenizePublishPage';
import EditContentPage from './pages/creator/EditContentPage';
import PlayerPage from './pages/player/PlayerPage';
import ProfilePage from './pages/ProfilePage';
import MyCollectionPage from './pages/user/MyCollectionPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import FeaturedContentPage from './pages/admin/FeaturedContentPage';
import UsersPage from './pages/admin/UsersPage';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="marketplace/content/:id" element={<ContentDetailsPage />} />
      <Route path="marketplace/details/:id" element={<ContentDetailsPage />} />
      <Route path="test-content-details" element={<TestContentDetails />} />
      
      {/* Creator routes - protected with Pro status verification */}
      <Route path="creator/dashboard" element={
        <ProtectedRoute requireProVerified>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="creator/upload" element={
        <ProtectedRoute requireProVerified>
          <UploadPage />
        </ProtectedRoute>
      } />
      <Route path="creator/tokenize-publish" element={
        <ProtectedRoute requireProVerified>
          <TokenizePublishPage />
        </ProtectedRoute>
      } />
      <Route path="creator/edit/:id" element={
        <ProtectedRoute requireProVerified>
          <EditContentPage />
        </ProtectedRoute>
      } />
      
      <Route path="player/:id" element={<PlayerPage />} />
      <Route path="profile" element={<ProfilePage />} />
      
      {/* User collection - protected but doesn't require Pro status */}
      <Route path="collection" element={
        <ProtectedRoute>
          <MyCollectionPage />
        </ProtectedRoute>
      } />
      
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      
      {/* Admin routes */}
      <Route path="admin">
        <Route index element={
          <ProtectedRoute requireAdmin>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="featured-content" element={
          <ProtectedRoute requireAdmin>
            <FeaturedContentPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute requireAdmin>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes; 