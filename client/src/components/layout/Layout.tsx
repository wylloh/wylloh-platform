import React from 'react';
import { Box } from '@mui/material';
import { usePlatform } from '../../contexts/PlatformContext';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSeedOne, isKioskMode } = usePlatform();
  
  // For SeedOne or kiosk mode, use a fullscreen layout without navbar/footer
  if (isSeedOne || isKioskMode) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121212',
          color: 'white',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    );
  }
  
  // For web, use a standard layout with navbar and footer
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default'
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout; 