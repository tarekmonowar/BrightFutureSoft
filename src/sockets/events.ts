export const SOCKET_EVENTS = {
  QR: "whatsapp:qr",
  READY: "whatsapp:ready",
  AUTHENTICATED: "whatsapp:authenticated",
  DISCONNECTED: "whatsapp:disconnected",
  LOADING: "whatsapp:loading",
  AUTH_FAILURE: "whatsapp:auth_failure",
  STATUS: "whatsapp:status",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
