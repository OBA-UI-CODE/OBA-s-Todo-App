export const PRIORITIES = ["low", "medium", "high"];

export function createTask(input, now = new Date()) {
  const title = String(input.title || "").trim();
  if (!title) throw new Error("Task title is required");
  const priority = PRIORITIES.includes(input.priority) ? input.priority : "medium";
  return {
    id: crypto.randomUUID(),
    title,
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate || "") ? input.dueDate : "",
    priority,
    completed: false,
    createdAt: now.toISOString(),
  };
}

export function createNote(input, now = new Date()) {
  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();
  if (!title && !body) throw new Error("A note needs a title or some text");
  return {
    id: crypto.randomUUID(),
    title: title || "Untitled note",
    body,
    color: ["sand", "lilac", "mint", "sky"].includes(input.color) ? input.color : "sand",
    updatedAt: now.toISOString(),
  };
}

export function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    tasks: Array.isArray(source.tasks)
      ? source.tasks.filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
      : [],
    notes: Array.isArray(source.notes)
      ? source.notes.filter((note) => note && typeof note.id === "string" && typeof note.title === "string")
      : [],
    focusMinutes: Number.isFinite(source.focusMinutes) ? Math.max(0, source.focusMinutes) : 0,
  };
}

export function filterTasks(tasks, filter, query = "", today = new Date()) {
  const needle = query.trim().toLowerCase();
  const isoToday = today.toISOString().slice(0, 10);
  return tasks.filter((task) => {
    const matchesSearch = !needle || task.title.toLowerCase().includes(needle);
    const matchesFilter =
      filter === "completed" ? task.completed :
      filter === "upcoming" ? !task.completed && task.dueDate > isoToday :
      filter === "today" ? !task.completed && (!task.dueDate || task.dueDate <= isoToday) :
      !task.completed;
    return matchesSearch && matchesFilter;
  });
}

export function getStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total: tasks.length,
    completed,
    open: tasks.length - completed,
    progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

