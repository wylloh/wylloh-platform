import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { UserProvider } from './contexts/UserContext';
import { useAuth } from './contexts/AuthContext';
import theme from './theme';
import Layout from './components/layout/Layout';
import AppRoutes from './routes';
import Web3AuthManager from './components/wallet/Web3AuthManager';
import AuthenticationLoader from './components/common/AuthenticationLoader';

// Main app content component that has access to auth context
function AppContent() {
  const { authenticationInProgress } = useAuth();

  return (
    <>
      <Web3AuthManager />
      <AuthenticationLoader 
        show={authenticationInProgress} 
        message="Connecting wallet..." 
      />
      <Layout>
        <AppRoutes />
      </Layout>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <WalletProvider>
            <UserProvider>
              <PlatformProvider>
                <AppContent />
              </PlatformProvider>
            </UserProvider>
          </WalletProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;