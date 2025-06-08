import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const StorePage = React.lazy(() => import('./pages/StorePage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const DiscoverPage = React.lazy(() => import('./pages/DiscoverPage'));
// const NetworkPage = React.lazy(() => import('./pages/NetworkPage')); // Temporarily disabled due to Node.js dependencies
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const TransactionHistoryPage = React.lazy(() => import('./pages/TransactionHistoryPage'));
const AnalyticsDashboardPage = React.lazy(() => import('./pages/AnalyticsDashboardPage'));

// Store pages
const ContentDetailsPage = React.lazy(() => import('./pages/store/ContentDetailsPage'));

// Pro pages
const EnhancedDashboardPage = React.lazy(() => import('./pages/pro/EnhancedDashboardPage'));
const TagManagementPage = React.lazy(() => import('./pages/pro/TagManagementPage'));

// Library pages
const LibraryPage = React.lazy(() => import('./pages/library/LibraryPage'));

// Player pages
const PlayerPage = React.lazy(() => import('./pages/player/PlayerPage'));

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));

// Essential pages
const CommunityPage = React.lazy(() => import('./pages/CommunityPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContributePage = React.lazy(() => import('./pages/ContributePage'));
const PressPage = React.lazy(() => import('./pages/PressPage'));
const ProVerificationPage = React.lazy(() => import('./pages/ProVerificationPage'));
const PartnershipsPage = React.lazy(() => import('./pages/PartnershipsPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const AITransparencyPage = React.lazy(() => import('./pages/AITransparencyPage'));
const LicensesPage = React.lazy(() => import('./pages/LicensesPage'));
const CompliancePage = React.lazy(() => import('./pages/CompliancePage'));
const CopyrightPage = React.lazy(() => import('./pages/CopyrightPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const DocsPage = React.lazy(() => import('./pages/DocsPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));

// Loading component
const LoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="50vh"
  >
    <CircularProgress />
  </Box>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        {/* <Route path="/network" element={<NetworkPage />} /> Temporarily disabled due to Node.js dependencies */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
        
        {/* Store routes */}
        <Route path="/store/content/:id" element={<ContentDetailsPage />} />
        <Route path="/marketplace" element={<Navigate to="/store" replace />} />
        <Route path="/marketplace/content/:id" element={<Navigate to="/store/content/:id" replace />} />
        
        {/* Player routes */}
        <Route path="/player/:id" element={<PlayerPage />} />
        
        {/* Library routes */}
        <Route path="/library/:libraryId" element={<LibraryPage />} />
        
        {/* Pro routes */}
        <Route path="/pro/dashboard" element={<EnhancedDashboardPage />} />
        <Route path="/pro/analytics" element={<AnalyticsDashboardPage />} />
        <Route path="/pro/tags" element={<TagManagementPage />} />
        <Route path="/pro" element={<Navigate to="/pro/dashboard" replace />} />
        
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Essential pages */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/partnerships" element={<PartnershipsPage />} />
        <Route path="/pro-verification" element={<ProVerificationPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/ai-transparency" element={<AITransparencyPage />} />
        <Route path="/licenses" element={<LicensesPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/copyright" element={<CopyrightPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/blog" element={<BlogPage />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 