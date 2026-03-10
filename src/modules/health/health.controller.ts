import type { Request, Response } from "express";
import { HealthResponse } from "./health.interface";

export function healthCheck(_req: Request, res: Response): void {
  const body: HealthResponse = {
    status: "ok",
    uptime: Math.floor(process.uptime()), // Server koto khon dhore cholche
    timestamp: new Date().toISOString(), // Current time
    version: process.env["npm_package_version"] ?? "1.0.0", // package.json theke app version
  };

  res.status(200).json(body);
}
