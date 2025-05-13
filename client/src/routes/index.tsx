import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';

// Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import StorePage from '../pages/StorePage';
import ContentDetailsPage from '../pages/ContentDetailsPage';
import TokenizeTestPage from '../pages/TokenizeTestPage';
import StoragePage from '../pages/StoragePage';
import ContentMediaPage from '../pages/ContentMediaPage';
import SearchPage from '../pages/SearchPage';
import NetworkPage from '../pages/NetworkPage';
import AdaptiveStreamTestPage from '../pages/player/AdaptiveStreamTestPage';
import MetadataTestPage from '../pages/metadata/MetadataTestPage';
import DiscoverPage from '../pages/DiscoverPage';
import LibraryPage from '../pages/library/LibraryPage';

// Import pages that we know exist
import PlayerPage from '../pages/player/PlayerPage';
import ContentStreamPage from '../pages/player/ContentStreamPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import MyCollectionPage from '../pages/user/MyCollectionPage';

// Simple loading component for content stream page
const ContentStreamPlaceholder = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    Loading stream...
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="content/:contentId" element={<ContentDetailsPage />} />
        <Route path="content/:contentId/media" element={<ContentMediaPage />} />
        <Route path="library/:libraryId" element={<LibraryPage />} />
        <Route path="adaptive-streaming-test" element={<AdaptiveStreamTestPage />} />
        <Route path="metadata-test" element={<MetadataTestPage />} />

        {/* Store routes */}
        <Route path="marketplace" element={<Navigate to="/store" replace />} /> {/* Legacy redirect */}
        <Route path="marketplace/details/:id" element={<Navigate to="/store/details/:id" replace />} /> {/* Legacy redirect */}
        <Route path="marketplace/content/:id" element={<Navigate to="/store/content/:id" replace />} /> {/* Legacy redirect */}
        <Route path="store/details/:id" element={<ContentDetailsPage />} />
        <Route path="store/content/:id" element={<ContentDetailsPage />} />

        {/* Player routes */}
        <Route path="player/:id" element={<PlayerPage />} />

        {/* Profile routes */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Collection routes */}
        <Route path="collection" element={<MyCollectionPage />} />

        {/* Fixed route for content streaming */}
        <Route path="stream/:contentId/:walletAddress" element={<ContentStreamPage />} />

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 