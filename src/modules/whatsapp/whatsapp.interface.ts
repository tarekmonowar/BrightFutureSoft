// ─── WhatsApp Client Status

export enum WhatsAppStatus {
  INITIALIZING = "INITIALIZING",
  QR_READY = "QR_READY",
  AUTHENTICATED = "AUTHENTICATED",
  READY = "READY",
  DISCONNECTED = "DISCONNECTED",
  RECONNECTING = "RECONNECTING",
  FAILED = "FAILED",
}

// ─── API Request / Response shapes

export interface SendMessageRequest {
  to: string;
  message: string;
}

export interface SendMessageResponse {
  success: true;
  jobId: string;
  message: string;
}

export interface StatusResponse {
  status: WhatsAppStatus;
  qr?: string;
  timestamp: string;
}
