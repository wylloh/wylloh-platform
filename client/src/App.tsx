import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { UserProvider } from './contexts/UserContext';
import theme from './theme';
import Layout from './components/layout/Layout';
import AppRoutes from './routes';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <WalletProvider>
            <UserProvider>
              <PlatformProvider>
                <Layout>
                  <AppRoutes />
                </Layout>
              </PlatformProvider>
            </UserProvider>
          </WalletProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;