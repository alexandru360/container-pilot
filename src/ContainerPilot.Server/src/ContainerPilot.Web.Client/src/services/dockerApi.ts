import axios from 'axios';
import type { ContainerInfo, LogResponse, ControlRequest, UpdateRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Get all containers status
export const getContainers = async (): Promise<ContainerInfo[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/containers/status`);
  return response.data.containers;
};

// Get container logs
export const getLogs = async (containerId: string, lines: number = 200): Promise<LogResponse> => {
  const response = await axios.get(`${API_BASE_URL}/api/logs`, {
    params: { containerId, lines }
  });
  return response.data;
};

// Control container (start/stop/restart)
export const controlContainer = async (containerId: string, action: 'start' | 'stop' | 'restart'): Promise<void> => {
  const request: ControlRequest = { containerId, action };
  await axios.post(`${API_BASE_URL}/api/containers/control`, request);
};

// Update container (pull new image and recreate)
export const updateContainer = async (containerId: string): Promise<void> => {
  const request: UpdateRequest = { containerId };
  await axios.post(`${API_BASE_URL}/api/containers/update`, request);
};

// Health check
export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await axios.get(`${API_BASE_URL}/api/health`);
  return response.data;
};
