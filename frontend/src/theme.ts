import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B4A6B',
      dark: '#6B3452',
      light: '#A96C8A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C4922A',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#6B8F71',
    },
    error: {
      main: '#C0392B',
    },
    background: {
      default: '#FAF6F0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6B6B6B',
    },
    divider: '#E8DDD4',
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '56px',
      fontWeight: 600,
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '44px',
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '36px',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '28px',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h5: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '22px',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h6: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    body1: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    button: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '12px',
      fontWeight: 400,
    },
    overline: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.1em',
    },
    subtitle1: {
      fontFamily: '"DM Sans", sans-serif',
    },
    subtitle2: {
      fontFamily: '"DM Sans", sans-serif',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#8B4A6B',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B4A6B',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: 'inherit',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
