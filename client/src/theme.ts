import { createTheme } from '@mui/material/styles';

// Monochromatic, minimalist theme inspired by Cursor.com
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
      dark: '#e5e5e5',
      light: '#ffffff',
      contrastText: '#000000',
    },
    secondary: {
      main: '#666666',
      dark: '#4a4a4a',
      light: '#808080',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      disabled: '#666666',
    },
    divider: '#1a1a1a',
    action: {
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(255, 255, 255, 0.08)',
      disabled: 'rgba(255, 255, 255, 0.26)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.35,
      letterSpacing: '0em',
    },
    h5: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.03em',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@import': 'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap")',
        body: {
          scrollbarColor: "#333333 #0a0a0a",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#0a0a0a",
            width: 6,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 3,
            backgroundColor: "#333333",
            minHeight: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#4a4a4a",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#4a4a4a",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#4a4a4a",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#e5e5e5',
            boxShadow: 'none',
          },
          '&:active': {
            backgroundColor: '#d4d4d4',
          },
        },
        outlined: {
          borderColor: '#333333',
          color: '#ffffff',
          '&:hover': {
            borderColor: '#4a4a4a',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
        text: {
          color: '#b3b3b3',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#ffffff',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 8,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: '#333333',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          border: '1px solid #1a1a1a',
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#0a0a0a',
            '& fieldset': {
              borderColor: '#333333',
            },
            '&:hover fieldset': {
              borderColor: '#4a4a4a',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffffff',
              borderWidth: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b3b3b3',
            '&.Mui-focused': {
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #333333',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: '1px solid',
        },
        standardInfo: {
          backgroundColor: '#0a0a0a',
          borderColor: '#333333',
          color: '#ffffff',
        },
        standardSuccess: {
          backgroundColor: '#0a0a0a',
          borderColor: '#4a4a4a',
          color: '#ffffff',
        },
        standardWarning: {
          backgroundColor: '#0a0a0a',
          borderColor: '#666666',
          color: '#ffffff',
        },
        standardError: {
          backgroundColor: '#0a0a0a',
          borderColor: '#808080',
          color: '#ffffff',
        },
      },
    },
  },
});

export default theme; 