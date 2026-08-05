const request = require("supertest");
const app = require("../src/app");

describe("Tasks API", () => {
  describe("GET /tasks", () => {
    it("returns all tasks", async () => {
      const res = await request(app).get("/tasks");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          completed: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });
  });

  describe("GET /tasks/:id", () => {
    it("returns a task by id", async () => {
      // derive an existing id instead of harcoding so it doesn't couple the test to the contents of the seed file
      const listRes = await request(app).get("/tasks");
      const existingId = listRes.body.data[0].id;

      const res = await request(app).get(`/tasks/${existingId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(existingId);
    });

    it("returns 404 when task does not exist", async () => {
      const res = await request(app).get("/tasks/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { message: "Task not found." } });
    });
  });

  describe("POST /tasks", () => {
    it("creates a task", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({ title: "Write POST tests" });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: "Write POST tests",
          completed: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });

    it("defaults completed to false", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({ title: "No completed field" });

      expect(res.status).toBe(201);
      expect(res.body.data.completed).toBe(false);
    });

    it("rejects empty title", async () => {
      const res = await request(app).post("/tasks").send({ title: "   " });

      expect(res.status).toBe(400);
    });

    it("rejects missing title", async () => {
      const res = await request(app).post("/tasks").send({});

      expect(res.status).toBe(400);
    });

    it("rejects non-string title", async () => {
      const res = await request(app).post("/tasks").send({ title: 123 });

      expect(res.status).toBe(400);
    });

    it("rejects invalid completed type", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({ title: "Valid title", completed: "yes" });

      expect(res.status).toBe(400);
    });

    it("rejects unsupported fields", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({ title: "Valid title", extra: "not allowed" });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual({
        unsupportedFields: ["extra"],
      });
    });

    it("rejects non-object body", async () => {
      const res = await request(app).post("/tasks").send([1, 2, 3]);

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /tasks/:id", () => {
    it("updates title", async () => {
      // POST a new task so we don't risk failure when mutating or destroying from the actual seed data
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Original title" });
      const { id, createdAt } = created.body.data;

      const res = await request(app)
        .patch(`/tasks/${id}`)
        .send({ title: "Updated title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated title");
      expect(res.body.data.createdAt).toBe(createdAt);
      expect(res.body.data.updatedAt).not.toBe(createdAt);
    });

    it("updates completed", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Toggle me" });
      const { id } = created.body.data;

      const res = await request(app)
        .patch(`/tasks/${id}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.title).toBe("Toggle me");
    });

    it("updates both fields", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Before" });
      const { id } = created.body.data;

      const res = await request(app)
        .patch(`/tasks/${id}`)
        .send({ title: "After", completed: true });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("After");
      expect(res.body.data.completed).toBe(true);
    });

    it("returns 404 for missing task", async () => {
      const res = await request(app)
        .patch("/tasks/does-not-exist")
        .send({ title: "Doesn't matter" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { message: "Task not found." } });
    });

    it("rejects invalid completed", async () => {
      const created = await request(app).post("/tasks").send({ title: "Task" });
      const { id } = created.body.data;

      const res = await request(app)
        .patch(`/tasks/${id}`)
        .send({ completed: "yes" });

      expect(res.status).toBe(400);
    });

    it("rejects invalid title", async () => {
      const created = await request(app).post("/tasks").send({ title: "Task" });
      const { id } = created.body.data;

      const res = await request(app).patch(`/tasks/${id}`).send({ title: 123 });

      expect(res.status).toBe(400);
    });

    it("rejects empty body", async () => {
      const created = await request(app).post("/tasks").send({ title: "Task" });
      const { id } = created.body.data;

      const res = await request(app).patch(`/tasks/${id}`).send({});

      expect(res.status).toBe(400);
    });

    it("rejects unsupported fields", async () => {
      const created = await request(app).post("/tasks").send({ title: "Task" });
      const { id } = created.body.data;

      const res = await request(app)
        .patch(`/tasks/${id}`)
        .send({ title: "Task", extra: "nope" });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual({
        unsupportedFields: ["extra"],
      });
    });

    it("rejects title shorter than minimum", async () => {
      const created = await request(app).post("/tasks").send({ title: "Task" });
      const { id } = created.body.data;

      const res = await request(app).patch(`/tasks/${id}`).send({ title: "a" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("deletes task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Delete me" });
      const { id } = created.body.data;

      const deleteRes = await request(app).delete(`/tasks/${id}`);
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app).get(`/tasks/${id}`);
      expect(getRes.status).toBe(404);
    });

    it("returns 404 for missing task", async () => {
      const res = await request(app).delete("/tasks/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { message: "Task not found." } });
    });
  });
});
