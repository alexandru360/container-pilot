import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import { Docker as DockerIcon } from '@mui/icons-material';
import ContainerList from './components/ContainerList';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <DockerIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Container Pilot - Docker Management
            </Typography>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth={false}
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: { xs: '100%', sm: '95%', md: '90%', lg: '80%' },
            mx: 'auto',
            px: { xs: 2, sm: 3 }
          }}
        >
          <ContainerList />
        </Container>

        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) => theme.palette.background.paper,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Container Pilot © {new Date().getFullYear()} - Powered by ASP.NET Core + React
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
