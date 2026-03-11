// ── Mock ioredis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn(),
    status: "ready",
  }));
});

// ── Mock BullMQ
jest.mock("bullmq", () => {
  const mockAdd = jest
    .fn()
    .mockImplementation((_name: string, data: any, opts?: any) => {
      return Promise.resolve({
        id: opts?.jobId ?? "mock-job-id",
        name: _name,
        data,
      });
    });

  const MockQueue = jest.fn().mockImplementation(() => ({
    add: mockAdd,
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  }));

  const MockWorker = jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  }));

  return {
    Queue: MockQueue,
    Worker: MockWorker,
    __mockAdd: mockAdd,
  };
});

// ── Mock Socket.IO
jest.mock("socket.io", () => {
  const MockServer = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  }));

  return { Server: MockServer };
});

// ── Mock whatsapp-web.js
jest.mock("whatsapp-web.js", () => {
  const EventEmitter = require("events");

  class MockClient extends EventEmitter {
    initialize = jest.fn().mockResolvedValue(undefined);
    sendMessage = jest
      .fn()
      .mockResolvedValue({ id: { _serialized: "mock-msg-id" } });
    destroy = jest.fn().mockResolvedValue(undefined);
    getState = jest.fn().mockResolvedValue("CONNECTED");
  }

  class MockLocalAuth {
    constructor(_opts?: any) {}
  }

  return {
    Client: MockClient,
    LocalAuth: MockLocalAuth,
  };
});

// ── Mock qrcode
jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,mockQR"),
}));

// ── Mock pino (logger)
jest.mock("pino", () => {
  const noopLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: "silent",
  };

  const pinoMock = jest.fn(() => noopLogger);
  (pinoMock as any).stdTimeFunctions = {
    isoTime: () => new Date().toISOString(),
  };
  (pinoMock as any).stdSerializers = {
    err: (e: any) => e,
    req: (r: any) => r,
    res: (r: any) => r,
  };

  return pinoMock;
});

// ── Mock pino-http
jest.mock("pino-http", () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});
