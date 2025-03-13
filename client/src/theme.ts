import { createTheme } from '@mui/material/styles';

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
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#2b2b2b",
            width: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#959595",
          },
        },
      },
    },
  },
});

export default theme; 