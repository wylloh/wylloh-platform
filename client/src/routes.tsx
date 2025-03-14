import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ContentDetailsPage from './pages/marketplace/ContentDetailsPage';
import TestContentDetails from './pages/marketplace/TestContentDetails';
import DashboardPage from './pages/creator/DashboardPage';
import UploadPage from './pages/creator/UploadPage';
import EditContentPage from './pages/creator/EditContentPage';
import PlayerPage from './pages/player/PlayerPage';
import ProfilePage from './pages/user/ProfilePage';
import MyCollectionPage from './pages/user/MyCollectionPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PlatformTestPage from './pages/PlatformTestPage';
import PlayerTestPage from './pages/test/PlayerTestPage';
import KioskSimulatorPage from './pages/test/KioskSimulatorPage';
import TestHubPage from './pages/test/TestHubPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="marketplace/:id" element={<ContentDetailsPage />} />
      <Route path="test-content-details" element={<TestContentDetails />} />
      <Route path="creator/dashboard" element={<DashboardPage />} />
      <Route path="creator/upload" element={<UploadPage />} />
      <Route path="creator/edit/:id" element={<EditContentPage />} />
      <Route path="player/:id" element={<PlayerPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="collection" element={<MyCollectionPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="platform-test" element={<PlatformTestPage />} />
      <Route path="player-test" element={<PlayerTestPage />} />
      <Route path="kiosk-simulator" element={<KioskSimulatorPage />} />
      <Route path="test" element={<TestHubPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes; 