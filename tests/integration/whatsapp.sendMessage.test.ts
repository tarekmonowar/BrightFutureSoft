import request from "supertest";
import { createApp } from "../../src/app";
import { whatsappService } from "../../src/modules/whatsapp/whatsapp.service";
import { WhatsAppStatus } from "../../src/modules/whatsapp/whatsapp.interface";

const app = createApp();

const VALID_API_KEY = "test-api-key-12345"; // matches setup.ts
const VALID_BODY = { to: "8801712345678", message: "Hello test!" };

describe("POST /api/v1/whatsapp/send-message", () => {
  beforeEach(() => {
    jest
      .spyOn(whatsappService, "getStatus")
      .mockReturnValue(WhatsAppStatus.READY);
  });

  // ── Authentication

  describe("Authentication (X-API-Key)", () => {
    it("should return 401 when X-API-Key header is missing", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .send(VALID_BODY);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/unauthorized|invalid|missing/i);
    });

    it("should return 401 when X-API-Key is wrong", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", "completely-wrong-key")
        .send(VALID_BODY);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when X-API-Key is empty string", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", "")
        .send(VALID_BODY);

      expect(res.status).toBe(401);
    });
  });

  // ── Zod Validation

  describe("Zod Validation", () => {
    it("should return 400 when `to` field is missing", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({ message: "Hello" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty("to");
    });

    it("should return 400 when `message` field is missing", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({ to: "8801712345678" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty("message");
    });

    it("should return 400 when `to` contains letters (invalid phone)", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({ to: "abc123", message: "Hello" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty("to");
    });

    it("should return 400 when `to` has a leading + sign", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({ to: "+8801712345678", message: "Hello" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when `message` is empty string", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({ to: "8801712345678", message: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when both fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("to");
      expect(res.body.errors).toHaveProperty("message");
    });
  });

  // ── WhatsApp Not-Ready Guard

  describe("WhatsApp client state guard", () => {
    it("should return 503 when WhatsApp is not in READY state", async () => {
      // Override the spy to return INITIALIZING
      jest
        .spyOn(whatsappService, "getStatus")
        .mockReturnValue(WhatsAppStatus.INITIALIZING);

      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send(VALID_BODY);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });

    it("should return 503 when WhatsApp is DISCONNECTED", async () => {
      jest
        .spyOn(whatsappService, "getStatus")
        .mockReturnValue(WhatsAppStatus.DISCONNECTED);

      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send(VALID_BODY);

      expect(res.status).toBe(503);
    });
  });

  // ── Successful Request

  describe("Successful message queuing", () => {
    it("should return 202 Accepted with job details when all is valid", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send(VALID_BODY);

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("jobId");
      expect(res.body).toHaveProperty("message");
      expect(typeof res.body.jobId).toBe("string");
    });

    it("should return Content-Type: application/json on success", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/send-message")
        .set("X-API-Key", VALID_API_KEY)
        .send(VALID_BODY);

      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });
  });
});
