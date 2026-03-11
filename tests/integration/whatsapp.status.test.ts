import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("GET /api/v1/whatsapp/status", () => {
  it("should return HTTP 200", async () => {
    const res = await request(app).get("/api/v1/whatsapp/status");

    expect(res.status).toBe(200);
  });

  it("should return Content-Type: application/json", async () => {
    const res = await request(app).get("/api/v1/whatsapp/status");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should return { success: true, data: { status, timestamp } }", async () => {
    const res = await request(app).get("/api/v1/whatsapp/status");

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("timestamp");
  });

  it("should return a valid WhatsApp status string", async () => {
    const res = await request(app).get("/api/v1/whatsapp/status");

    const validStatuses = [
      "INITIALIZING",
      "QR_READY",
      "AUTHENTICATED",
      "READY",
      "DISCONNECTED",
      "RECONNECTING",
      "FAILED",
    ];

    expect(validStatuses).toContain(res.body.data.status);
  });

  it("should NOT require an X-API-Key header (public endpoint)", async () => {
    // Status endpoint has no apiKeyAuth middleware
    const res = await request(app).get("/api/v1/whatsapp/status");

    expect(res.status).toBe(200);
  });

  it("should return a valid ISO 8601 timestamp in data", async () => {
    const res = await request(app).get("/api/v1/whatsapp/status");

    const parsed = new Date(res.body.data.timestamp);
    expect(parsed.toString()).not.toBe("Invalid Date");
  });
});
