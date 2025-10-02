import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const LiveLogs: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetch logs from the Container Pilot app itself
      const response = await fetch('/api/logs?container=lottery-tools&lines=500');
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      const logLines = data.logs?.split('\n').filter((line: string) => line.trim()) || [];
      setLogs(logLines);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogs([`Error: Failed to fetch logs - ${err}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `container-pilot-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, autoScroll]);

  const parseLogLine = (line: string): LogEntry => {
    // Parse Serilog format: [2025-10-02T10:17:13.393] [INF] Message
    const match = line.match(/\[([\d\-T:.]+)\]\s+\[(INF|WRN|ERR|DBG)\]\s+(.*)/);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2],
        message: match[3],
      };
    }
    return {
      timestamp: new Date().toISOString(),
      level: 'INF',
      message: line,
    };
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERR': return '#ef4444';
      case 'WRN': return '#f59e0b';
      case 'INF': return '#60a5fa';
      case 'DBG': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🔴 Live Container Pilot Logs
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-scroll"
            />

            <Tooltip title="Refresh logs">
              <IconButton onClick={fetchLogs} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download logs">
              <IconButton onClick={handleDownload} disabled={logs.length === 0} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Clear logs">
              <IconButton onClick={handleClear} disabled={logs.length === 0} color="error">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          ref={logsContainerRef}
          sx={{
            maxHeight: '70vh',
            minHeight: '400px',
            overflow: 'auto',
            p: 2,
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(30, 41, 59, 0.3)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(96, 165, 250, 0.3)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(96, 165, 250, 0.5)',
              },
            },
          }}
        >
          {loading && logs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              No logs available. Logs will appear here in real-time.
            </Typography>
          ) : (
            logs.map((line, index) => {
              const parsed = parseLogLine(line);
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': {
                      background: 'rgba(30, 41, 59, 0.5)',
                    },
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: '#64748b',
                      minWidth: '180px',
                      flexShrink: 0,
                      fontSize: '0.75rem',
                    }}
                  >
                    {parsed.timestamp}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: getLevelColor(parsed.level),
                      minWidth: '40px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {parsed.level}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: '#e2e8f0',
                      wordBreak: 'break-word',
                      flex: 1,
                    }}
                  >
                    {parsed.message}
                  </Typography>
                </Box>
              );
            })
          )}
          <div ref={logsEndRef} />
        </Box>
      </Paper>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {logs.length} log entries • Auto-refresh every 5s • Showing last 500 lines
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveLogs;
