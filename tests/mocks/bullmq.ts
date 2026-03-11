// Provides fake Queue and Worker classes so tests can verify job

export const mockAdd = jest
  .fn()
  .mockImplementation((_name: string, data: any, opts?: any) => {
    return Promise.resolve({
      id: opts?.jobId ?? "mock-job-id",
      name: _name,
      data,
    });
  });

export const mockQueueClose = jest.fn().mockResolvedValue(undefined);
export const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

export const MockQueue = jest.fn().mockImplementation(() => ({
  add: mockAdd,
  close: mockQueueClose,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
}));

export const MockWorker = jest.fn().mockImplementation(() => ({
  close: mockWorkerClose,
  on: jest.fn(),
  removeAllListeners: jest.fn(),
}));

export default { Queue: MockQueue, Worker: MockWorker };
