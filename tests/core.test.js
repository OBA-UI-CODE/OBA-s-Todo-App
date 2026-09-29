import test from "node:test";
import assert from "node:assert/strict";
import { createNote, createTask, filterTasks, getStats, normalizeState } from "../src/core.js";

test("creates a normalized task", () => {
  const task = createTask({ title: "  Ship redesign  ", priority: "high", dueDate: "2026-10-02" });
  assert.equal(task.title, "Ship redesign");
  assert.equal(task.priority, "high");
  assert.equal(task.completed, false);
});

test("rejects an empty task", () => {
  assert.throws(() => createTask({ title: "   " }), /required/);
});

test("creates a note with a safe fallback title", () => {
  assert.equal(createNote({ body: "Remember the small things" }).title, "Untitled note");
});

test("normalizes malformed persisted state", () => {
  assert.deepEqual(normalizeState({ tasks: "bad", notes: null, focusMinutes: -4 }), {
    tasks: [], notes: [], focusMinutes: 0,
  });
});

test("filters today's tasks and searches case-insensitively", () => {
  const tasks = [
    { id: "1", title: "Write brief", completed: false, dueDate: "2026-09-29" },
    { id: "2", title: "Book flight", completed: false, dueDate: "2026-10-02" },
  ];
  const result = filterTasks(tasks, "today", "BRIEF", new Date("2026-09-29T09:00:00Z"));
  assert.deepEqual(result.map((task) => task.id), ["1"]);
});

test("calculates completion stats", () => {
  assert.deepEqual(getStats([{ completed: true }, { completed: false }]), {
    total: 2, completed: 1, open: 1, progress: 50,
  });
});

