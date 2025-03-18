import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import pages that we know exist
import HomePage from '../pages/HomePage';
import MarketplacePage from '../pages/marketplace/MarketplacePage';
import ContentDetailsPage from '../pages/marketplace/ContentDetailsPage';
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

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/marketplace/details/:id" element={<ContentDetailsPage />} />
      <Route path="/marketplace/content/:id" element={<ContentDetailsPage />} />
      <Route path="/player/:id" element={<PlayerPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/collection" element={<MyCollectionPage />} />
      
      {/* Fixed route for content streaming */}
      <Route path="/stream/:contentId/:walletAddress" element={<ContentStreamPage />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes; 