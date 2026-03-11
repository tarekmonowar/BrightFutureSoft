//provides fake Client and LocalAuth classes so tests don't require

import { EventEmitter } from "events";

export class MockClient extends EventEmitter {
  initialize = jest.fn().mockResolvedValue(undefined);
  sendMessage = jest
    .fn()
    .mockResolvedValue({ id: { _serialized: "mock-msg-id" } });
  destroy = jest.fn().mockResolvedValue(undefined);
  getState = jest.fn().mockResolvedValue("CONNECTED");
}

export class MockLocalAuth {
  constructor(_opts?: any) {}
}

export default { Client: MockClient, LocalAuth: MockLocalAuth };
