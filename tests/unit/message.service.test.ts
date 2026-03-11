//Verifies that enqueueMessage() correctly calls BullMQ Queue.add()

import { enqueueMessage } from "../../src/modules/message/message.service";
import { closeMessageQueue } from "../../src/modules/message/message.queue";

const bullmq: any = require("bullmq");
const mockAdd: jest.Mock = bullmq.__mockAdd;

describe("enqueueMessage()", () => {
  beforeEach(async () => {
    // Queue instance is created for each test, then clear mocks.
    await closeMessageQueue();
    jest.clearAllMocks();
    mockAdd.mockClear();
  });

  it("should call queue.add() with 'send-message' job name", async () => {
    await enqueueMessage("8801712345678", "Hello");

    expect(mockAdd).toHaveBeenCalledWith(
      "send-message",
      expect.objectContaining({
        to: "8801712345678",
        message: "Hello",
        requestId: expect.any(String),
      }),
      expect.objectContaining({ jobId: expect.any(String) }),
    );
  });

  it("should return { success: true, jobId, message } shape", async () => {
    const result = await enqueueMessage("8801712345678", "Test message");

    expect(result.success).toBe(true);
    expect(typeof result.jobId).toBe("string");
    expect(result.jobId.length).toBeGreaterThan(0);
    expect(typeof result.message).toBe("string");
    expect(result.message).toContain("queued");
  });

  it("should generate a unique UUID as requestId for each call", async () => {
    const r1 = await enqueueMessage("8801712345678", "First");
    const r2 = await enqueueMessage("8801712345678", "Second");

    expect(r1.jobId).not.toBe(r2.jobId);
  });

  it("should pass the correct `to` and `message` values in job data", async () => {
    const TO = "441234567890";
    const MSG = "Integration test message";

    await enqueueMessage(TO, MSG);

    const callArgs = mockAdd.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ to: TO, message: MSG });
  });
});
