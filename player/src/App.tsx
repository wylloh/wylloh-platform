import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import PlayerPage from './pages/PlayerPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// Home page component
const HomePage = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
    <h1>Wylloh Player</h1>
    <p>Select a media item to play:</p>
    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
      <Box 
        component="a" 
        href="/player/1" 
        sx={{ 
          display: 'block',
          textDecoration: 'none',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          '&:hover': { bgcolor: 'background.default' }
        }}
      >
        <h3>The Digital Frontier</h3>
        <p>A journey into blockchain (Preview)</p>
      </Box>
      <Box 
        component="a" 
        href="/player/2" 
        sx={{ 
          display: 'block',
          textDecoration: 'none',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          '&:hover': { bgcolor: 'background.default' }
        }}
      >
        <h3>Web3 Revolution</h3>
        <p>How Web3 is changing everything</p>
      </Box>
    </Box>
  </Box>
);

// Not found page
const NotFoundPage = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
    <h1>404 - Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <Box 
      component="a" 
      href="/" 
      sx={{ 
        mt: 2,
        p: 1,
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: 1,
        textDecoration: 'none',
        '&:hover': { bgcolor: 'primary.dark' }
      }}
    >
      Back to Home
    </Box>
  </Box>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 