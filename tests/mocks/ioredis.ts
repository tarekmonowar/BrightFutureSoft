//Provides a fake Redis client that resolves all operations immediately.

export const mockRedisInstance = {
  on: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue("OK"),
  disconnect: jest.fn(),
  status: "ready",
};

const MockRedis = jest.fn(() => mockRedisInstance);

export default MockRedis;
