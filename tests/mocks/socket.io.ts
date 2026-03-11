// Provides a fake Socket.IO Server so tests don't open real WebSocket

export const mockEmit = jest.fn();
export const mockOn = jest.fn();
export const mockClose = jest.fn();

export const MockServer = jest.fn().mockImplementation(() => ({
  on: mockOn,
  emit: mockEmit,
  close: mockClose,
  to: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
}));

export default { Server: MockServer };
