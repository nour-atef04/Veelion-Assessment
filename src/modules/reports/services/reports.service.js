const path = require("node:path");

const { readJsonArray } = require("../../../utils/jsonStore");

const TASKS_FILE_PATH = path.join(process.cwd(), "data", "tasks.json");
const ACTIVITY_FILE_PATH = path.join(process.cwd(), "data", "activity.json");

// task data model only has 'completed', not a 'status' field, so 'in-progress' has no way to be represented and will always be 0, unless this design change was decided by the team
function buildByStatus(tasks) {
  const byStatus = {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };

  for (const task of tasks) {
    if (task.completed) {
      byStatus.done++;
    } else {
      byStatus.todo++;
    }
  }
  return byStatus;
}

// chose "recent" to mean a 24-hour window from the request time
const RECENT_ACIVITY_WINDOW = 24 * 60 * 60 * 1000; // in ms

function countRecentActivity(activities, now) {
  const minimumTime = now - RECENT_ACIVITY_WINDOW;

  return activities.filter((activity) => {
    const activityTime = new Date(activity.when).getTime();
    return !Number.isNaN(activityTime) && activityTime >= minimumTime;
  }).length;
}

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    readJsonArray(TASKS_FILE_PATH),
    readJsonArray(ACTIVITY_FILE_PATH),
  ]);

  const timeNow = Date.now();

  return {
    total: tasks.length,
    byStatus: buildByStatus(tasks),
    recentActivityCount: countRecentActivity(activities, timeNow),
  };
}

module.exports = {
  getTasksSummary,
};
