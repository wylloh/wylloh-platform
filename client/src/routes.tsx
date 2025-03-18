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
import PlatformTestPage from './pages/PlatformTestPage';
import PlayerTestPage from './pages/test/PlayerTestPage';
import KioskSimulatorPage from './pages/test/KioskSimulatorPage';
import TestHubPage from './pages/test/TestHubPage';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Admin components
import ProVerificationPanel from './components/admin/ProVerificationPanel';

// Admin page layout
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="admin-layout">
    <h1>Admin Dashboard</h1>
    {children}
  </div>
);

// Admin page wrapper component
const AdminPage = ({ component: Component }: { component: React.ComponentType }) => (
  <AdminLayout>
    <Component />
  </AdminLayout>
);

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
        <Route path="pro-verification" element={
          <ProtectedRoute requireAdmin>
            <AdminPage component={ProVerificationPanel} />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Test routes */}
      <Route path="platform-test" element={<PlatformTestPage />} />
      <Route path="player-test" element={<PlayerTestPage />} />
      <Route path="kiosk-simulator" element={<KioskSimulatorPage />} />
      <Route path="test" element={<TestHubPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes; 