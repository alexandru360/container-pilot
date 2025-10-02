import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Box, Tabs, Tab, Container } from '@mui/material';
import { Sailing as DockerIcon, ViewList, Article } from '@mui/icons-material';
import { useState } from 'react';
import ContainerList from './components/ContainerList';
import LiveLogs from './components/LiveLogs';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    secondary: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#8b5cf6',
    },
    background: {
      default: '#0f172a',
      paper: 'rgba(30, 41, 59, 0.8)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(96, 165, 250, 0.3)',
            boxShadow: '0 8px 32px rgba(96, 165, 250, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(96, 165, 250, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
          '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '1400px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <AppBar 
            position="static" 
            elevation={0}
            sx={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            }}
          >
            <Toolbar 
              sx={{ 
                py: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: { xs: 2, sm: 3 },
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <DockerIcon sx={{ 
                  fontSize: 32,
                  filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))',
                  color: '#60a5fa',
                  WebkitTextFillColor: '#60a5fa',
                }} />
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  }}
                >
                  Container Pilot
                </Typography>
              </Box>

              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  minHeight: 48,
                  '& .MuiTab-root': {
                    minHeight: 48,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <Tab 
                  icon={<ViewList />} 
                  label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Containers</Box>} 
                  iconPosition="start"
                  sx={{ minWidth: { xs: 60, sm: 120 } }}
                />
                <Tab 
                  icon={<Article />} 
                  label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Live Logs</Box>} 
                  iconPosition="start"
                  sx={{ minWidth: { xs: 60, sm: 120 } }}
                />
              </Tabs>
            </Toolbar>
          </AppBar>

          <Container
            maxWidth={false}
            sx={{
              flexGrow: 1,
              width: { xs: '100%', sm: '95%', md: '90%', lg: '80%' },
              px: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <TabPanel value={currentTab} index={0}>
              <ContainerList />
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
              <LiveLogs />
            </TabPanel>
          </Container>

          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 'auto',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              textAlign: 'center',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              Container Pilot © {new Date().getFullYear()} • Powered by{' '}
              <Box 
                component="span" 
                sx={{ 
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}
              >
                ASP.NET Core + React
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
