//Tests every valid and invalid input combination for the schema that

import { sendMessageSchema } from "../../src/modules/whatsapp/whatsapp.validation";

describe("sendMessageSchema", () => {
  // ── Valid inputs

  describe("valid inputs", () => {
    it("should accept a valid international phone number and message", () => {
      const result = sendMessageSchema.safeParse({
        to: "8801712345678",
        message: "Hello, World!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.to).toBe("8801712345678");
        expect(result.data.message).toBe("Hello, World!");
      }
    });

    it("should trim whitespace from to and message fields", () => {
      const result = sendMessageSchema.safeParse({
        to: "  8801712345678  ",
        message: "  Hello  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.to).toBe("8801712345678");
        expect(result.data.message).toBe("Hello");
      }
    });

    it("should accept minimum length phone number (7 digits)", () => {
      const result = sendMessageSchema.safeParse({
        to: "1234567",
        message: "Hi",
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum length phone number (15 digits)", () => {
      const result = sendMessageSchema.safeParse({
        to: "123456789012345",
        message: "Hi",
      });
      expect(result.success).toBe(true);
    });
  });

  // ── Invalid "to"

  describe("invalid `to` field", () => {
    it("should fail when `to` is missing", () => {
      const result = sendMessageSchema.safeParse({ message: "Hello" });

      expect(result.success).toBe(false);
      if (!result.success) {
        const toError = result.error.errors.find((e) => e.path.includes("to"));
        expect(toError).toBeDefined();
      }
    });

    it("should fail when `to` contains letters", () => {
      const result = sendMessageSchema.safeParse({
        to: "abc123",
        message: "Hello",
      });

      expect(result.success).toBe(false);
    });

    it("should fail when `to` has a leading plus sign (+880...)", () => {
      const result = sendMessageSchema.safeParse({
        to: "+8801712345678",
        message: "Hello",
      });

      expect(result.success).toBe(false);
    });

    it("should fail when `to` is too short (fewer than 7 digits)", () => {
      const result = sendMessageSchema.safeParse({
        to: "123456",
        message: "Hello",
      });

      expect(result.success).toBe(false);
    });

    it("should fail when `to` is too long (more than 15 digits)", () => {
      const result = sendMessageSchema.safeParse({
        to: "1234567890123456",
        message: "Hello",
      });

      expect(result.success).toBe(false);
    });
  });

  // ── Invalid message

  describe("invalid `message` field", () => {
    it("should fail when `message` is missing", () => {
      const result = sendMessageSchema.safeParse({ to: "8801712345678" });

      expect(result.success).toBe(false);
      if (!result.success) {
        const msgError = result.error.errors.find((e) =>
          e.path.includes("message"),
        );
        expect(msgError).toBeDefined();
      }
    });

    it("should fail when `message` is an empty string", () => {
      const result = sendMessageSchema.safeParse({
        to: "8801712345678",
        message: "",
      });

      expect(result.success).toBe(false);
    });

    it("should fail when `message` is only whitespace (trimmed to empty)", () => {
      const result = sendMessageSchema.safeParse({
        to: "8801712345678",
        message: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("should fail when `message` exceeds 4096 characters", () => {
      const result = sendMessageSchema.safeParse({
        to: "8801712345678",
        message: "a".repeat(4097),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const msgError = result.error.errors.find((e) =>
          e.path.includes("message"),
        );
        expect(msgError?.message).toContain("4096");
      }
    });

    it("should accept a message of exactly 4096 characters", () => {
      const result = sendMessageSchema.safeParse({
        to: "8801712345678",
        message: "a".repeat(4096),
      });

      expect(result.success).toBe(true);
    });
  });
});
