export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: PortMapping[];
}

export interface PortMapping {
  privatePort: number;
  publicPort: number;
  type: string;
}

export interface LogRequest {
  containerId: string;
  lines: number;
}

export interface LogResponse {
  containerId: string;
  logs: string;
  timestamp: string;
}

export interface ControlRequest {
  containerId: string;
  action: 'start' | 'stop' | 'restart';
}

export interface UpdateRequest {
  containerId: string;
}
