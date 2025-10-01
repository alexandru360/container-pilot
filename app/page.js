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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
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
  ExpandMore as ExpandMoreIcon,
  SystemUpdateAlt as UpdateCheckIcon,
  CloudDownload as UpdateIcon
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
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [containerLogs, setContainerLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [checkingUpdate, setCheckingUpdate] = useState({});
  const [updateStatus, setUpdateStatus] = useState({});
  const [updatingContainer, setUpdatingContainer] = useState({});

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

    newSocket.on('update-complete', (data) => {
      console.log('Update complete:', data);
      setUpdatingContainer(prev => ({ ...prev, [data.containerId]: false }));
      
      if (data.success) {
        setLogs(prev => [...prev, {
          level: 'success',
          message: `✅ ${data.containerName} updated successfully!`,
          timestamp: data.timestamp
        }]);
        // Refresh status after update
        setTimeout(() => loadStatus(), 2000);
      } else {
        setLogs(prev => [...prev, {
          level: 'error',
          message: `❌ Update failed: ${data.error}`,
          timestamp: data.timestamp
        }]);
      }
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
      console.log('[CLIENT] Config loaded:', data);
      console.log('[CLIENT] Containers:', data.containers);
      setContainers(data.containers || []);
    } catch (err) {
      setError('Failed to load configuration');
      console.error('[CLIENT] Failed to load config:', err);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      console.log('[CLIENT] Status loaded:', data);
      console.log('[CLIENT] Container status:', data.containers);
      setContainerStatus(data.containers || []);
    } catch (err) {
      console.error('[CLIENT] Failed to load status:', err);
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

  const handleControl = async (containerId, action, containerName, event) => {
    // Stop event propagation to prevent accordion toggle
    if (event) {
      event.stopPropagation();
    }

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

  const handleCheckUpdate = async (containerId, containerName, event) => {
    // Stop event propagation to prevent accordion toggle
    if (event) {
      event.stopPropagation();
    }

    setCheckingUpdate(prev => ({ ...prev, [containerId]: true }));

    try {
      const response = await fetch('/api/check-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ containerId })
      });

      const data = await response.json();

      if (response.ok) {
        setUpdateStatus(prev => ({ ...prev, [containerId]: data }));
        setLogs(prev => [...prev, {
          level: data.hasUpdate ? 'warning' : 'success',
          message: `${data.message} (${containerName})`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.error || 'Check failed');
      }
    } catch (err) {
      setError(`Failed to check updates for ${containerName}: ${err.message}`);
      setLogs(prev => [...prev, {
        level: 'error',
        message: `❌ ${containerName}: Update check failed - ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setCheckingUpdate(prev => ({ ...prev, [containerId]: false }));
    }
  };

  const handleUpdateContainer = async (containerId, containerName) => {
    if (!containerId) {
      setError('Container ID is required');
      return;
    }

    // Confirm with user
    if (!window.confirm(`Are you sure you want to update ${containerName}?\n\nThis will:\n1. Pull the latest image\n2. Stop the current container\n3. Remove the old container\n4. Create and start a new container\n\nThe process may take a few minutes.`)) {
      return;
    }

    setUpdatingContainer(prev => ({ ...prev, [containerId]: true }));
    setLogs(prev => [...prev, {
      level: 'info',
      message: `🔄 Starting update for ${containerName}...`,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch('/api/update-container', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ containerId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setLogs(prev => [...prev, {
        level: 'info',
        message: `📡 Update request sent. Watch logs for progress...`,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      setError(`Failed to update ${containerName}: ${err.message}`);
      setLogs(prev => [...prev, {
        level: 'error',
        message: `❌ ${containerName}: Update failed - ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
      setUpdatingContainer(prev => ({ ...prev, [containerId]: false }));
    }
  };

  const handleAccordionChange = (containerId) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? containerId : null);
    
    // Load logs when accordion expands
    if (isExpanded && !containerLogs[containerId]) {
      loadContainerLogs(containerId);
    }
  };

  const loadContainerLogs = async (containerId) => {
    setLoadingLogs(prev => ({ ...prev, [containerId]: true }));

    try {
      const response = await fetch(`/api/logs?containerId=${containerId}&lines=200`);
      
      // Check content type to ensure we got JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Check server logs.');
      }

      const data = await response.json();

      if (response.ok) {
        setContainerLogs(prev => ({ ...prev, [containerId]: data.logs }));
      } else {
        setContainerLogs(prev => ({ ...prev, [containerId]: `Error: ${data.error}` }));
      }
    } catch (err) {
      console.error('[CLIENT] Failed to load logs:', err);
      setContainerLogs(prev => ({ ...prev, [containerId]: `Error: ${err.message}` }));
    } finally {
      setLoadingLogs(prev => ({ ...prev, [containerId]: false }));
    }
  };

  const handleRefreshLogs = (containerId, event) => {
    // Stop event propagation to prevent accordion toggle
    if (event) {
      event.stopPropagation();
    }
    loadContainerLogs(containerId);
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

        {/* Container Status with Accordion */}
        {containerStatus.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {containerStatus.map((container) => (
              <Accordion
                key={container.name}
                expanded={expandedAccordion === container.id}
                onChange={handleAccordionChange(container.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: { xs: 1, md: 2 }
                    }
                  }}
                >
                  {/* Container Info - Always on top */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    flexGrow: 1,
                    width: { xs: '100%', md: 'auto' }
                  }}>
                    <Typography variant="h6" component="div">
                      🐋 {container.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {container.image || 'N/A'}
                    </Typography>
                  </Box>

                  {/* Status Chip and Buttons Container */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-end', md: 'flex-start' },
                    gap: 2,
                    width: { xs: '100%', md: 'auto' }
                  }}>
                    <Chip
                      icon={getStatusIcon(container.status)}
                      label={container.status}
                      color={getStatusColor(container.status)}
                      size="small"
                    />

                    {/* Action Buttons - Stop propagation to prevent accordion toggle */}
                    <Box 
                      sx={{ display: 'flex', gap: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                    {container.id && (
                      <>
                        {/* Check Update Button */}
                        <Tooltip title="Check for updates">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => handleCheckUpdate(container.id, container.name, e)}
                            disabled={checkingUpdate[container.id]}
                          >
                            {checkingUpdate[container.id] ? (
                              <CircularProgress size={20} />
                            ) : (
                              <UpdateCheckIcon />
                            )}
                          </IconButton>
                        </Tooltip>

                        {/* Update Container Button - show if update is available or recommended */}
                        {updateStatus[container.id]?.hasUpdate && (
                          <Tooltip title="Update container to latest image">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateContainer(container.id, container.name);
                              }}
                              disabled={updatingContainer[container.id]}
                            >
                              {updatingContainer[container.id] ? (
                                <CircularProgress size={20} />
                              ) : (
                                <UpdateIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Start/Stop Button */}
                        {container.status !== 'running' ? (
                          <Tooltip title="Start container">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => handleControl(container.id, 'start', container.name, e)}
                            >
                              <PlayIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Stop container">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => handleControl(container.id, 'stop', container.name, e)}
                            >
                              <StopIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Restart Button - only show when running */}
                        {container.status === 'running' && (
                          <Tooltip title="Restart container">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => handleControl(container.id, 'restart', container.name, e)}
                            >
                              <RestartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  {!container.id ? (
                    <Alert severity="warning">
                      Container not found
                    </Alert>
                  ) : (
                    <Box>
                      {/* Container Info */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          <strong>ID:</strong> {container.id.substring(0, 12)}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          <strong>State:</strong> {container.state}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          <strong>Created:</strong> {new Date(container.created * 1000).toLocaleString()}
                        </Typography>
                        {container.ports && container.ports.length > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            <strong>Ports:</strong> {container.ports.map(p => 
                              `${p.PublicPort || ''}:${p.PrivatePort}/${p.Type}`
                            ).join(', ')}
                          </Typography>
                        )}
                      </Box>

                      {/* Update Status */}
                      {updateStatus[container.id] && (
                        <Alert 
                          severity={
                            updateStatus[container.id].hasUpdate ? 'warning' : 
                            updateStatus[container.id].updateAvailable === 'up-to-date' ? 'success' : 
                            'info'
                          }
                          sx={{ mb: 2 }}
                        >
                          <Typography variant="body2">
                            {updateStatus[container.id].message}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Current Image ID: {updateStatus[container.id].currentImageId}
                          </Typography>
                        </Alert>
                      )}

                      {/* Container Logs */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          📋 Container Logs
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleRefreshLogs(container.id, e)}
                          disabled={loadingLogs[container.id]}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Box>

                      {loadingLogs[container.id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <TextField
                          multiline
                          fullWidth
                          value={containerLogs[container.id] || 'No logs available. Click refresh to load.'}
                          InputProps={{
                            readOnly: true,
                            sx: {
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              bgcolor: '#1e1e1e',
                              color: '#d4d4d4'
                            }
                          }}
                          minRows={10}
                          maxRows={20}
                        />
                      )}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
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
      </Container>
    </ThemeProvider>
  );
}
