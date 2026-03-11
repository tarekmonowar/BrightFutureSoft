import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("404 Not Found Handler", () => {
  it("should return 404 for GET request to unknown route", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("GET");
    expect(res.body.error).toContain("/nonexistent");
  });

  it("should return 404 for POST request to unknown route", async () => {
    const res = await request(app).post("/random").send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("POST");
    expect(res.body.error).toContain("/random");
  });

  it("should return 404 for deeply nested unknown path", async () => {
    const res = await request(app).get("/api/v1/nonexistent/deep/path");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return Content-Type: application/json for 404 responses", async () => {
    const res = await request(app).get("/totally-unknown");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("should return 404 for DELETE on unknown route", async () => {
    const res = await request(app).delete("/unknown");

    expect(res.status).toBe(404);
  });
});
