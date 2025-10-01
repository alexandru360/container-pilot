'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#21CBF3',
    },
  },
});

export default function Home() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Load container configuration
    loadConfig();

    // Connect to Socket.IO
    const newSocket = io({
      path: '/api/socketio',
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('update-log', (data) => {
      setLogs(prev => [...prev, data]);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setContainers(data.containers || []);
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    }
  };

  // Load config on mount and refresh every 30 seconds
  useEffect(() => {
    loadConfig();
    const interval = setInterval(loadConfig, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Update request failed');
      }

      const data = await response.json();
      console.log('Update started:', data);
    } catch (err) {
      setError(err.message);
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-disable loading when logs indicate completion
    const lastLog = logs[logs.length - 1];
    if (lastLog?.message?.includes('completed')) {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [logs]);

  const getLogIcon = (level) => {
    switch (level) {
      case 'success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'progress':
        return null;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'progress':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4
        }}
      >
        <Container maxWidth="md">
          <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                🐋 Docker Updater
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Update your Docker containers with one click
              </Typography>
            </Box>

            {/* Container List */}
            {containers.length > 0 && (
              <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configured Containers ({containers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {containers.map((container, index) => (
                      <Chip
                        key={index}
                        label={container}
                        color="primary"
                        variant="outlined"
                        size="medium"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {containers.length === 0 && !error && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No containers configured. Set DOCKER_IMAGES environment variable.
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Update Button */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                onClick={handleUpdate}
                disabled={loading || containers.length === 0}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #00ACC1 90%)',
                  },
                  '&:disabled': {
                    background: '#cccccc'
                  }
                }}
              >
                {loading ? 'Updating...' : 'Update Dockers'}
              </Button>
            </Box>

            {/* Live Logs */}
            {logs.length > 0 && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: '#1e1e1e',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  borderRadius: 2
                }}
              >
                <List dense>
                  {logs.map((log, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        py: 0.5,
                        px: 1,
                        color: getLogColor(log.level),
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                        {getLogIcon(log.level)}
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            flex: 1
                          }}
                        >
                          {log.message}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Footer Info */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Configured via DOCKER_IMAGES environment variable
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
