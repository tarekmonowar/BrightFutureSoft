export interface QREventPayload {
  /** Base-64 PNG data URL */
  qr: string;
}

export interface DisconnectedEventPayload {
  reason: string;
}

export interface LoadingEventPayload {
  percent: number;
  message: string;
}

export interface AuthFailureEventPayload {
  message: string;
}
