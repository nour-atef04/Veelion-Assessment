const request = require("supertest");
const app = require("../src/app");

describe("Activity API", () => {
  it("lists activity", async () => {
    const res = await request(app).get("/activity");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        action: expect.any(String),
        info: expect.any(String),
        when: expect.any(String),
      }),
    );
  });

  it("creates activity", async () => {
    const res = await request(app)
      .post("/activity")
      .send({ action: "test-run", info: "created via supertest" });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        action: "test-run",
        info: "created via supertest",
        when: expect.any(String),
      }),
    );
  });

  // after adding validation
  it("rejects invalid body", async () => {
    const res = await request(app).post("/activity").send([1, 2, 3]);

    expect(res.status).toBe(400);
  });

  it("rejects missing action", async () => {
    const res = await request(app)
      .post("/activity")
      .send({ info: "no action provided" });

    expect(res.status).toBe(400);
  });

  it("rejects unsupported fields", async () => {
    const res = await request(app)
      .post("/activity")
      .send({ action: "test-run", info: "valid", extra: "nope" });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({
      unsupportedFields: ["extra"],
    });
  });
});
