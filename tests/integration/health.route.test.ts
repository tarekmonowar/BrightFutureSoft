import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("GET /health", () => {
  it("should return HTTP 200", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("should return Content-Type: application/json", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should return the correct response shape", async () => {
    const res = await request(app).get("/health");

    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("version");
  });

  it("should return uptime as a non-negative number", async () => {
    const res = await request(app).get("/health");

    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return a valid ISO 8601 timestamp", async () => {
    const res = await request(app).get("/health");

    const parsed = new Date(res.body.timestamp);
    expect(parsed.toString()).not.toBe("Invalid Date");
  });

  it("should NOT require an X-API-Key header (public endpoint)", async () => {
    // No X-API-Key header — should still succeed
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });
});
