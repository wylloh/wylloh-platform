import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

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

// This is a temporary placeholder. We'll implement actual player routes later
const PlayerPage = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <h1>Wylloh Player</h1>
    <p>Coming soon!</p>
  </Box>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<PlayerPage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="*" element={<PlayerPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 