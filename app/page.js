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
  CssBaseline,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Article as LogsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#f44336',
    },
  },
});

export default function Home() {
  const [containers, setContainers] = useState([]);
  const [containerStatus, setContainerStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [containerLogs, setContainerLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [logsDialog, setLogsDialog] = useState({ open: false, containerId: null, containerName: null });

  useEffect(() => {
    // Initialize Socket.IO
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

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setContainerStatus(data.containers || []);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  // Load config and status on mount and refresh every 10 seconds
  useEffect(() => {
    loadConfig();
    loadStatus();
    const interval = setInterval(() => {
      loadStatus();
    }, 10000); // Refresh every 10 seconds
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
        throw new Error('Update failed');
      }

      setTimeout(() => {
        setLoading(false);
        loadStatus();
      }, 2000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleControl = async (containerId, action, containerName) => {
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ containerId, action })
      });

      if (!response.ok) {
        throw new Error(`${action} failed`);
      }

      // Refresh status after action
      setTimeout(loadStatus, 1000);
      
      setLogs(prev => [...prev, {
        level: 'success',
        message: `✅ ${containerName}: ${action} successful`,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError(`Failed to ${action} ${containerName}: ${err.message}`);
      setLogs(prev => [...prev, {
        level: 'error',
        message: `❌ ${containerName}: ${action} failed - ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleViewLogs = async (containerId, containerName) => {
    setLogsDialog({ open: true, containerId, containerName });
    setLoadingLogs(prev => ({ ...prev, [containerId]: true }));

    try {
      const response = await fetch(`/api/logs?containerId=${containerId}&lines=200`);
      const data = await response.json();

      if (response.ok) {
        setContainerLogs(prev => ({ ...prev, [containerId]: data.logs }));
      } else {
        setContainerLogs(prev => ({ ...prev, [containerId]: `Error: ${data.error}` }));
      }
    } catch (err) {
      setContainerLogs(prev => ({ ...prev, [containerId]: `Error: ${err.message}` }));
    } finally {
      setLoadingLogs(prev => ({ ...prev, [containerId]: false }));
    }
  };

  const handleRefreshLogs = () => {
    if (logsDialog.containerId) {
      handleViewLogs(logsDialog.containerId, logsDialog.containerName);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'exited': return 'error';
      case 'paused': return 'warning';
      case 'not-found': return 'default';
      default: return 'info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <CheckCircleIcon />;
      case 'exited': return <ErrorIcon />;
      case 'paused': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'success': return <CheckCircleIcon color="success" sx={{ mr: 1 }} />;
      case 'error': return <ErrorIcon color="error" sx={{ mr: 1 }} />;
      case 'warning': return <WarningIcon color="warning" sx={{ mr: 1 }} />;
      default: return <InfoIcon color="info" sx={{ mr: 1 }} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              🐋 Docker Container Manager
            </Typography>
            <IconButton onClick={loadStatus} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Manage your Docker containers with real-time status and logs
          </Typography>

          {containers.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No containers configured. Set DOCKER_IMAGES environment variable.
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Configured containers: <strong>{containers.length}</strong>
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Container Status Cards */}
        {containerStatus.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {containerStatus.map((container) => (
              <Grid item xs={12} md={6} key={container.name}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {container.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {container.image || 'N/A'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(container.status)}
                        label={container.status}
                        color={getStatusColor(container.status)}
                        size="small"
                      />
                    </Box>

                    {container.id && (
                      <>
                        <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                          State: {container.state}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          {container.status !== 'running' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<PlayIcon />}
                              onClick={() => handleControl(container.id, 'start', container.name)}
                            >
                              Start
                            </Button>
                          )}
                          {container.status === 'running' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<StopIcon />}
                                onClick={() => handleControl(container.id, 'stop', container.name)}
                              >
                                Stop
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<RestartIcon />}
                                onClick={() => handleControl(container.id, 'restart', container.name)}
                              >
                                Restart
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LogsIcon />}
                            onClick={() => handleViewLogs(container.id, container.name)}
                          >
                            Logs
                          </Button>
                        </Box>
                      </>
                    )}

                    {!container.id && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Container not found
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Update All Button */}
        {containers.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              fullWidth
              onClick={handleUpdate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {loading ? 'Updating Containers...' : 'Update All Containers'}
            </Button>
          </Paper>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Update Logs */}
        {logs.length > 0 && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Logs
            </Typography>
            <List sx={{ maxHeight: 400, overflow: 'auto', bgcolor: '#f5f5f5', borderRadius: 1, p: 1 }}>
              {logs.map((log, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                    {getLogIcon(log.level)}
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        flexGrow: 1
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

        {/* Logs Dialog */}
        <Dialog
          open={logsDialog.open}
          onClose={() => setLogsDialog({ open: false, containerId: null, containerName: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                📋 Logs: {logsDialog.containerName}
              </Typography>
              <IconButton onClick={handleRefreshLogs} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {loadingLogs[logsDialog.containerId] ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TextField
                multiline
                fullWidth
                value={containerLogs[logsDialog.containerId] || 'No logs available'}
                InputProps={{
                  readOnly: true,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    bgcolor: '#1e1e1e',
                    color: '#d4d4d4'
                  }
                }}
                minRows={20}
                maxRows={30}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogsDialog({ open: false, containerId: null, containerName: null })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
