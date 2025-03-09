import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Contexts
import { WalletProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ContentDetailsPage from './pages/marketplace/ContentDetailsPage';
import DashboardPage from './pages/creator/DashboardPage';
import UploadPage from './pages/creator/UploadPage';
import EditContentPage from './pages/creator/EditContentPage';
import PlayerPage from './pages/player/PlayerPage';
import ProfilePage from './pages/user/ProfilePage';
import MyCollectionPage from './pages/user/MyCollectionPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D4AF37',
    },
    secondary: {
      main: '#9B111E',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    },
    h4: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    },
    h5: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    },
    h6: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 500
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="marketplace/:id" element={<ContentDetailsPage />} />
              <Route path="creator/dashboard" element={<DashboardPage />} />
              <Route path="creator/upload" element={<UploadPage />} />
              <Route path="creator/edit/:id" element={<EditContentPage />} />
              <Route path="player/:id" element={<PlayerPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="collection" element={<MyCollectionPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;