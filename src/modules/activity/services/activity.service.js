const fs = require("node:fs");
const path = require("node:path");
const { readJsonArray, writeJsonArray } = require("../../../utils/jsonStore");

const ACTIVITY_FILE_PATH = path.join(process.cwd(), "data", "activity.json");

function buildActivityRecord(payload) {
  // consistent with Tasks service
  return {
    id: String(Date.now()),
    action: payload.action,
    info: payload.info,
    when: new Date().toISOString(),
  };
}

async function getAllActivity() {
  const arr = readJsonArray(ACTIVITY_FILE_PATH);
  return arr;
}

async function createNewActivity(payload) {
  const activityList = await readJsonArray(ACTIVITY_FILE_PATH);
  const newActivity = buildActivityRecord(payload);

  activityList.push(newActivity);
  await writeJsonArray(ACTIVITY_FILE_PATH, activityList);
  return newActivity;
}

module.exports = {
  getAllActivity,
  createNewActivity,
};
