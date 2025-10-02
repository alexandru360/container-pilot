import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Container as MuiContainer,
  Button,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { ContainerInfo, LogResponse } from '../types';
import { getContainers, controlContainer, updateContainer, getLogs } from '../services/dockerApi';
import ContainerCard from './ContainerCard';

const ContainerList: React.FC = () => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});
  const [controlLoading, setControlLoading] = useState<Record<string, boolean>>({});

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContainers();
      setContainers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch containers');
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleControl = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setControlLoading((prev) => ({ ...prev, [containerId]: true }));
      await controlContainer(containerId, action);
      await fetchContainers(); // Refresh container list
    } catch (err: any) {
      setError(`Failed to ${action} container: ${err.message}`);
      console.error(`Error ${action} container:`, err);
    } finally {
      setControlLoading((prev) => ({ ...prev, [containerId]: false }));
    }
  };

  const handleUpdate = async (containerId: string) => {
    try {
      setControlLoading((prev) => ({ ...prev, [containerId]: true }));
      await updateContainer(containerId);
      await fetchContainers(); // Refresh container list
    } catch (err: any) {
      setError(`Failed to update container: ${err.message}`);
      console.error('Error updating container:', err);
    } finally {
      setControlLoading((prev) => ({ ...prev, [containerId]: false }));
    }
  };

  const handleRefreshLogs = async (containerId: string) => {
    try {
      setLoadingLogs((prev) => ({ ...prev, [containerId]: true }));
      const response: LogResponse = await getLogs(containerId, 200);
      setLogs((prev) => ({ ...prev, [containerId]: response.logs }));
    } catch (err: any) {
      setError(`Failed to fetch logs: ${err.message}`);
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [containerId]: false }));
    }
  };

  useEffect(() => {
    fetchContainers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchContainers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && containers.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MuiContainer maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Docker Containers
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={fetchContainers}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {containers.length === 0 ? (
        <Alert severity="info">No containers found. Check your configuration.</Alert>
      ) : (
        <Box>
          {containers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onControl={handleControl}
              onUpdate={handleUpdate}
              onRefreshLogs={handleRefreshLogs}
              logs={logs[container.id] || ''}
              loadingLogs={loadingLogs[container.id] || false}
              controlLoading={controlLoading[container.id] || false}
            />
          ))}
        </Box>
      )}
    </MuiContainer>
  );
};

export default ContainerList;
