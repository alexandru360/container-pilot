import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Refresh as RefreshIcon,
  SystemUpdateAlt as UpdateIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ContainerInfo } from '../types';

interface ContainerCardProps {
  container: ContainerInfo;
  onControl: (containerId: string, action: 'start' | 'stop' | 'restart') => void;
  onUpdate: (containerId: string) => void;
  onRefreshLogs: (containerId: string) => void;
  logs: string;
  loadingLogs: boolean;
  controlLoading: boolean;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  onControl,
  onUpdate,
  onRefreshLogs,
  logs,
  loadingLogs,
  controlLoading,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'success';
      case 'exited':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <CheckCircleIcon />;
      case 'exited':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const handleAccordionChange = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && !logs) {
      onRefreshLogs(container.id);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              justifyContent: 'space-between',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {getStatusIcon(container.state)}
            <Typography variant="h6">{container.name}</Typography>
            <Chip
              label={container.state}
              color={getStatusColor(container.state)}
              size="small"
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {container.state === 'running' ? (
              <>
                <Tooltip title="Stop container">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onControl(container.id, 'stop');
                    }}
                    disabled={controlLoading}
                  >
                    {controlLoading ? <CircularProgress size={20} /> : <StopIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Restart container">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onControl(container.id, 'restart');
                    }}
                    disabled={controlLoading}
                  >
                    {controlLoading ? <CircularProgress size={20} /> : <RestartIcon />}
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Start container">
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    onControl(container.id, 'start');
                  }}
                  disabled={controlLoading}
                >
                  {controlLoading ? <CircularProgress size={20} /> : <PlayIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Update container">
              <IconButton
                size="small"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(container.id);
                }}
                disabled={controlLoading}
              >
                {controlLoading ? <CircularProgress size={20} /> : <UpdateIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Image:</strong> {container.image}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Status:</strong> {container.status}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>ID:</strong> {container.id.substring(0, 12)}
            </Typography>
            {container.ports.length > 0 && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Ports:</strong>{' '}
                {container.ports
                  .map((p) => `${p.publicPort}:${p.privatePort}/${p.type}`)
                  .join(', ')}
              </Typography>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">Container Logs</Typography>
              <Tooltip title="Refresh logs">
                <IconButton
                  size="small"
                  onClick={() => onRefreshLogs(container.id)}
                  disabled={loadingLogs}
                >
                  {loadingLogs ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={10}
              value={loadingLogs ? 'Loading logs...' : logs || 'No logs available'}
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default ContainerCard;
