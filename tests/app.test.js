const request = require("supertest");
const app = require("../src/app");

describe("Application", () => {
  it("returns JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Route not found: GET /does-not-exist",
      },
    });
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send('{"title":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.any(String),
        }),
      }),
    );
  });
});
