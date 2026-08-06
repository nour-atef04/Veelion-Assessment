const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../src/app");

const tasksPath = path.join(__dirname, "..", "data", "tasks.json");
const activityPath = path.join(__dirname, "..", "data", "activity.json");

describe("Reports API", () => {
  it("returns summary", async () => {
    const res = await request(app).get("/reports/tasks-summary");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        byStatus: expect.objectContaining({
          todo: expect.any(Number),
          "in-progress": expect.any(Number),
          done: expect.any(Number),
        }),
        recentActivityCount: expect.any(Number),
      }),
    );
  });

  it("works with empty files", async () => {
    fs.writeFileSync(tasksPath, "[]");
    fs.writeFileSync(activityPath, "[]");

    const res = await request(app).get("/reports/tasks-summary");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 0,
      byStatus: { todo: 0, "in-progress": 0, done: 0 },
      recentActivityCount: 0,
    });
  });

  it("counts completed tasks correctly", async () => {
    fs.writeFileSync(tasksPath, "[]");

    await request(app).post("/tasks").send({ title: "Todo one" });
    await request(app).post("/tasks").send({ title: "Todo two" });
    await request(app)
      .post("/tasks")
      .send({ title: "Done one", completed: true });

    const res = await request(app).get("/reports/tasks-summary");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.byStatus).toEqual({
      todo: 2,
      "in-progress": 0,
      done: 1,
    });
  });

  it("counts recent activity", async () => {
    fs.writeFileSync(activityPath, "[]");

    const before = await request(app).get("/reports/tasks-summary");
    expect(before.body.recentActivityCount).toBe(0);

    await request(app)
      .post("/activity")
      .send({ action: "test-run", info: "fresh entry" });
    await request(app)
      .post("/activity")
      .send({ action: "test-run", info: "another fresh entry" });

    const after = await request(app).get("/reports/tasks-summary");

    expect(after.body.recentActivityCount).toBe(2);
  });
});
