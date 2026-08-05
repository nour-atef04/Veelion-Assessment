// since the app writes directly into JSON files, we should restore them after every test
const fs = require("fs");
const path = require("path");

const tasksPath = path.join(__dirname, "..", "data", "tasks.json");
const activityPath = path.join(__dirname, "..", "data", "activity.json");

let originalTasks;
let originalActivity;

beforeAll(() => {
  originalTasks = fs.readFileSync(tasksPath, "utf8");
  originalActivity = fs.readFileSync(activityPath, "utf8");
});

afterEach(() => {
  fs.writeFileSync(tasksPath, originalTasks);
  fs.writeFileSync(activityPath, originalActivity);
});