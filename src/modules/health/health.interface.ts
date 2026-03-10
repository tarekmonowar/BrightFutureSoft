export interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
  version: string;
}
