# REVIEW

## Overview

This code is an Express.js backend for a **task management system**. It has a good seperation between routes, controllers, services and middlewares. It is also organized into two main modules:

- Tasks API
- Activity API

Overall, the **Tasks module** follows a cleaner architecture, while the **Activity module** is less consistent and requires more refactoring.

Below are the findings that are worth reviewing.

---

# Bugs

## 1. Activity endpoints do not contain validation for request payloads

**Location**

- `src\modules\activity\controllers\activity.controller.js`

### What is wrong:

The POST endpoint accepts whatever object is provided in the request body without validating required fields or data types.

For example:

- missing `action` or missing `info`
- incorrect data types
- unexpected properties

are all accepted with no problems.

### Why it is a problem:

Invalid data can be permanently written into `activity.json`, so inconsistent data can exist and that can make future processing much more difficult.

### How to improve it:

Create request validation like the one in the Tasks module before calling the service layer.

---

# Performance

## 1. Synchronous file operations block the event loop

**Location**

- `src\modules\activity\services\activity.service.js`

### What is wrong:

The Activity service uses `readFileSync`, `writeFileSync`, and `existsSync` inside the request handlers.

### Why it is a problem:

Node.js uses a single-threaded event loop. Synchronous filesystem operations block all incoming requests until they complete, so that reduces scalability under load.

### How to improve it:

Use asynchronous filesystem operations, preferably through the shared JSON storage utilities already used in the application.

---

## 2. Activity module contains duplicated file logic

**Location**

- `src\modules\activity\services\activity.service.js`

### What is wrong:

The code contains two identical functions: `loadDataA` and `loadDataB`, which's redundant as they perform the exact same thing.

### Why it is a problem:

Redundancy might increase code maintenance costs, because if the loading logic ever changes, we'll have to update both functions, which might increase the risk of inconsistency.

### How to improve it:

- Replace the two functions with a single reusable loader

OR

- Reuse the shared JSON storage utility used already by the Tasks module.

---

## 3. Repeated implementation of JSON persistence

**Location**

- `src\modules\activity\services\activity.service.js`
- `src\utils\jsonStore.js`

### What is wrong:

The project already contains reusable helpers for reading and writing JSON arrays, but the Activity module implements its own persistence.

### Why it is a problem:

Maintaining two implementations increases maintenance costs, leading to to inconsistent behavior.

### How to improve it:

Reuse the shared JSON storage utility across both modules.

---

# Maintainability

## 1. Validation logic is duplicated in the Tasks module

**Location**

- `src\modules\tasks\controllers\tasks.controller.js`
- `src\modules\tasks\services\tasks.service.js`
- `src\modules\tasks\utils\taskValidator.js`

### What is wrong:

Validation is performed in multiple layers: controller, validator and service, and some validation rules are redundant. The controller does its own `typeof`/trim/empty checks manually and the service repeated similar checks (including a title-length rule the validator didn't even know about at all).

### Why it is a problem:

Duplicated validation increases maintainability costs, and a rule added or changed in one layer can stop applying in another. For example: for the "title-length" rule, `updateTask` enforces a 2-character minimum, but `createTask` doesn't, so a task could be created with a 1-character title but never edited to one using PATCH.

### How to improve it:

Centralize request validation inside the validator utility and let the service focus on business logic and persistence, trusting the caller with the validation of the input. Also, add the title-length rule in the validator utility.

**Note**: After improving, error messages will be more specific Previously a missing request body and a missing `title` field produced the same message, since the controller coerced `undefined` to `{}` before checking for a title. The validator now distinguishes "no body sent" from "body sent but incomplete".

---

## 2. Inconsistent naming conventions

**Location**

Activity module

### What is wrong:

Several identifiers use inconsistent naming conventions, including:

- `get_activity`
- `addActivity`
- `aSvc`
- `made`

These are inconsistent and also differ from the naming style used in the Tasks module.

### Why it is a problem:

Consistent naming improves readability.

### How to improve it:

Consistently use camelCase names throughout the project.

---

## 3. Activity module architecture differs from the Tasks module

### What is wrong:

Both modules expose similar REST APIs, but only the Tasks module consistently uses:

- async service methods
- shared utilities
- centralized validation
- reusable error handling

The Activity module uses a different implementation style, even its response shape. Tasks wraps every response in `{data: ...}`, while Activity returns raw arrays/objects directly.

### Why it is a problem:

Similar modules should follow similar architecture patterns to make code easier to develop and maintain. It also makes it easier for consumers of the API to not need to remember whichshape each endpoint returns, so for example, future modules like Reports can have one consistent convention to follow rather than two to choose from.

### How to improve it:

Refactor the Activity module to align with the architectural style followed by the Tasks module:

- Use `jsonStore` utility for the async service methods
- Centralize validation using `activityValidator.js`
- Use consistent camelCase naming
- Wrap responses in `{data: ...}` to match the Tasks API's contract

---

## 4. Inconsistent strategy for ID generation

**Location**

- `src/modules/activity/services/activity.service.js`
- `src/utils/id.js`

### What is wrong:

The Activity module generates IDs using:

```js
id: String(Date.now());
```

But the Tasks module uses the shared `createId()` utility, which generates UUIDs.

### Why it is a problem:

Using two different ID generation strategies can make the code inconsistent. Also, `Date.now()` can cause the possibility of generating duplicate IDs if mulitple activity records are created within the same exact millisecond, but `createId()` is designed to avoid collisions.

### How to improve it:

Reuse the shared `createId()` utility in the Activity module so both modules follow the same ID generation strategy.

**Note**: I intentionally will not change this during the refactor because it changes the format of activity IDs that will be generated in the future (timestamp strings → UUIDs). It is a visible behavioral change and it's better to be introduced as a design decision rather than during refactoring.

---

# Security

## 1. Activity API accepts any request bodies with no validation

### What is wrong:

Unexpected fields sent by clients are written directly into persisted objects without validation.

### Why it is a problem:

Accepting any input can result in malformed or inconsistent persisted data.

### How to improve it:

Validate the request bodies to accept supported fields and reject unsupported ones.

---

## 2. No payload size or content restrictions

### What is wrong:

Both the Tasks API and Activity API don't validate the size or complexity of incoming request bodies.

### Why it is a problem:

Extremely large payloads could negatively affect performance and resource usage.

### How to improve it:

Before processing, configure appropriate request size limits and validate incoming payloads.

---

# Code Quality

## Missing automated tests

### What is wrong:

The project currently does not include automated tests.

### Why it is a problem:

Without automated tests, future refactoring becomes riskier and regressions are harder to detect.

### How to improve it:

Add integration tests for the API using Jest and Supertest to cover successful requests, validation failures, and error handling.

---

---

# New Module: Reports API

## `GET /reports/tasks-summary`

A new module will be added under `src/modules/reports/...`, with the same route -> controller -> service structure as the Tasks module. It will also be reading from `data/tasks.json` and `data/activity.json` using the shared `jsonStore` utility.

Two design decisions were required:

### Task status mapping

The task data model only contains `completed: boolean`, rather than a multi-state `status` field, but the response example in README.md expects `byStatus: { todo, in-progress, done }`.

Instead of adding a `status` field to the Tasks schema, `byStatus` will be derived from `completed`:

- `completed: false` will be counted as `"todo"`
- `completed: true` will be counted as `"done"`
- `"in-progress"` will always be `0`, since the current model has no way to represent that state.

This was chosen instead of creating a second field to represent state (`completed` and `status`) so we don't risk maintainability costs and because that will require changing the Tasks API's data contract just to support a new read-only Reports endpoint.

### "Recent" activity window

Nothing in the README.md defined what "recent" meant for `recentActivityCount`. A 24-hour window from the request time was chosen and will be implemented as a constant (`RECENT_ACTIVITY_WINDOW_MS` in `reports.service.js`).

### Response shape

`GET /reports/tasks-summary` returns an unwrapped object (`{ total, byStatus, recentActivityCount }`), rather than the `{ data: ... }` wrapper used by Tasks and Activity. This was decided because matching the response shape given in the README.md was higher in priority over matching the other two modules' internal convention.

### Other notes

- Activity entries with a malformed or unparseable `when` timestamp will be excluded from `recentActivityCount` rather than causing an error, since a single corrupted record shouldn't cause an error for the whole summary.
- Task and activity files are read concurrently (`Promise.all`) since the two reads are independent.
