import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StorePage from './pages/StorePage';
import ContentDetailsPage from './pages/ContentDetailsPage';
import TokenizeTestPage from './pages/TokenizeTestPage';
import StoragePage from './pages/StoragePage';
import ContentMediaPage from './pages/ContentMediaPage';
import SearchPage from './pages/SearchPage';
import NetworkPage from './pages/NetworkPage';
import AdaptiveStreamTestPage from './pages/player/AdaptiveStreamTestPage';
import MetadataTestPage from './pages/metadata/MetadataTestPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';

// Pro pages
import ProDashboardPage from './pages/pro/DashboardPage';
import EnhancedDashboardPage from './pages/pro/EnhancedDashboardPage';
import ProUploadPage from './pages/pro/UploadPage';
import ProTokenizePublishPage from './pages/pro/TokenizePublishPage';
import ProEditContentPage from './pages/pro/EditContentPage';
import ProLibrariesPage from './pages/pro/LibrariesPage';
import TagManagementPage from './pages/pro/TagManagementPage';

// Admin pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminContentPage from './pages/admin/ContentPage';

// Auth components
import { RequireAuth } from './components/auth/RequireAuth';

// Library Pages
import LibraryPage from './pages/library/LibraryPage';

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
        <Route path="content/:contentId" element={<ContentDetailsPage />} />
        <Route path="content/:contentId/media" element={<ContentMediaPage />} />
        <Route path="library/:libraryId" element={<LibraryPage />} />
        <Route path="adaptive-streaming-test" element={<AdaptiveStreamTestPage />} />
        <Route path="metadata-test" element={<MetadataTestPage />} />

        {/* Protected routes for all users */}
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="tokenize-test"
          element={
            <RequireAuth>
              <TokenizeTestPage />
            </RequireAuth>
          }
        />
        <Route
          path="storage"
          element={
            <RequireAuth>
              <StoragePage />
            </RequireAuth>
          }
        />
        <Route
          path="network"
          element={
            <RequireAuth>
              <NetworkPage />
            </RequireAuth>
          }
        />

        {/* Pro routes */}
        <Route
          path="pro"
          element={
            <RequireAuth requireProStatus>
              <Navigate to="/pro/dashboard" replace />
            </RequireAuth>
          }
        />
        <Route
          path="pro/dashboard"
          element={
            <RequireAuth requireProStatus>
              <EnhancedDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/dashboard-legacy"
          element={
            <RequireAuth requireProStatus>
              <ProDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/analytics"
          element={
            <RequireAuth requireProStatus>
              <AnalyticsDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/upload"
          element={
            <RequireAuth requireProStatus>
              <ProUploadPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/tokenize-publish"
          element={
            <RequireAuth requireProStatus>
              <ProTokenizePublishPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/edit/:contentId"
          element={
            <RequireAuth requireProStatus>
              <ProEditContentPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/libraries"
          element={
            <RequireAuth requireProStatus>
              <ProLibrariesPage />
            </RequireAuth>
          }
        />
        <Route
          path="pro/tags"
          element={
            <RequireAuth requireProStatus>
              <TagManagementPage />
            </RequireAuth>
          }
        />

        {/* Admin routes */}
        <Route path="admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <RequireAuth requireAdmin>
                <Navigate to="/admin/dashboard" replace />
              </RequireAuth>
            }
          />
          <Route
            path="dashboard"
            element={
              <RequireAuth requireAdmin>
                <AdminDashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="users"
            element={
              <RequireAuth requireAdmin>
                <AdminUsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="content"
            element={
              <RequireAuth requireAdmin>
                <AdminContentPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 