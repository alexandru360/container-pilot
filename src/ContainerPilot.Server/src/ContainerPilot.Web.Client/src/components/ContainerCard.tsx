import React, { useState } from 'react';
import {
  Card,
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
import type { ContainerInfo } from '../types';

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
    <Card 
      sx={{ 
        mb: 3,
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Accordion 
        expanded={expanded} 
        onChange={handleAccordionChange}
        sx={{
          background: 'transparent',
          '&:before': {
            display: 'none',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            py: 2,
            px: 3,
            '& .MuiAccordionSummary-content': {
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              justifyContent: 'space-between',
              my: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 1,
                borderRadius: 2,
                background: container.state === 'running' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
              }}
            >
              {getStatusIcon(container.state)}
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  mb: 0.5,
                }}
              >
                {container.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {container.image}
              </Typography>
            </Box>
            <Chip
              label={container.state}
              color={getStatusColor(container.state)}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                px: 1,
              }}
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

        <AccordionDetails
          sx={{
            px: 3,
            pb: 3,
            background: 'rgba(15, 23, 42, 0.3)',
          }}
        >
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
              <Typography 
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'text.primary',
                }}
              >
                📋 Container Logs
              </Typography>
              <Tooltip title="Refresh logs">
                <IconButton
                  size="small"
                  onClick={() => onRefreshLogs(container.id)}
                  disabled={loadingLogs}
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      background: 'rgba(96, 165, 250, 0.1)',
                    },
                  }}
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
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 2,
                  color: '#94a3b8',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(96, 165, 250, 0.3)',
                  },
                },
              }}
              sx={{ 
                mt: 2,
                '& .MuiInputBase-root': {
                  padding: 2,
                },
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default ContainerCard;
