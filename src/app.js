import { createNote, createTask, filterTasks, getStats, normalizeState } from "./core.js";

const STORAGE_KEY = "daymark.workspace.v2";
const THEME_KEY = "daymark.theme";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { return normalizeState(); }
}

let state = loadState();
let currentView = "today";
let search = "";
let timerSeconds = 25 * 60;
let timerMinutes = 25;
let timerHandle = null;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`)) : "No due date"; }
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("is-visible"); clearTimeout(toast.handle); toast.handle = setTimeout(() => el.classList.remove("is-visible"), 2200); }

function renderTasks() {
  const tasks = filterTasks(state.tasks, currentView, search);
  const stats = getStats(state.tasks);
  $("#task-list").innerHTML = tasks.map((task) => `
    <article class="task ${task.completed ? "is-done" : ""}">
      <input class="task__check" type="checkbox" ${task.completed ? "checked" : ""} data-toggle="${task.id}" aria-label="Complete ${escapeHtml(task.title)}">
      <div><div class="task__title">${escapeHtml(task.title)}</div><div class="task__meta"><span><i class="priority priority--${task.priority}"></i>${task.priority}</span><span>·</span><span>${formatDate(task.dueDate)}</span></div></div>
      <span class="priority-label">${task.completed ? "Done" : task.priority}</span>
      <button class="task__delete" data-delete="${task.id}" aria-label="Delete ${escapeHtml(task.title)}">×</button>
    </article>`).join("");
  $("#task-empty").classList.toggle("is-hidden", tasks.length > 0);
  $("#task-summary").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  $("#today-count").textContent = state.tasks.filter((task) => !task.completed).length;
  $("#open-stat").textContent = stats.open;
  $("#progress-stat").textContent = `${stats.progress}%`;
  $("#completed-stat").textContent = `${stats.completed} tasks completed`;
  $("#progress-ring").style.setProperty("--progress", `${stats.progress * 3.6}deg`);
  $("#side-progress").textContent = `${stats.progress}%`;
  $("#side-progress-bar").style.width = `${stats.progress}%`;
  $("#focus-stat").textContent = `${state.focusMinutes} min`;
}

function renderNotes() {
  const needle = search.toLowerCase();
  const notes = state.notes.filter((note) => !needle || `${note.title} ${note.body}`.toLowerCase().includes(needle));
  $("#notes-grid").innerHTML = notes.map((note) => `<article class="note note--${note.color}"><div class="note__top"><h3>${escapeHtml(note.title)}</h3><button class="note__delete" data-note-delete="${note.id}" aria-label="Delete note">×</button></div><p>${escapeHtml(note.body)}</p><small>Updated ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(note.updatedAt))}</small></article>`).join("");
  $("#notes-empty").classList.toggle("is-hidden", notes.length > 0);
}

function render() { renderTasks(); renderNotes(); }

function setMenuOpen(isOpen) {
  $("#sidebar").classList.toggle("is-open", isOpen);
  $("#sidebar-backdrop").classList.toggle("is-visible", isOpen);
  $("#menu-button").setAttribute("aria-expanded", String(isOpen));
  $("#menu-button").setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
}

function setView(view) {
  currentView = view;
  const isNotes = view === "notes";
  $("#tasks-view").classList.toggle("is-hidden", isNotes);
  $("#notes-view").classList.toggle("is-hidden", !isNotes);
  $$(".nav__item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  const labels = {
    today: ["Make today count.", "A clear list for a focused day.", "Today’s plan"],
    upcoming: ["See what’s ahead.", "Plan early and leave room to breathe.", "Coming up"],
    all: ["Everything, in one place.", "Your complete working list.", "All open tasks"],
    completed: ["Progress you can see.", "A record of the work you’ve finished.", "Completed tasks"],
  };
  if (!isNotes) { const [title, subtitle, list] = labels[view]; $("#view-title").textContent = title; $("#view-subtitle").textContent = subtitle; $("#list-title").textContent = list; }
  setMenuOpen(false); render();
}

function openTaskModal() { $("#task-form").reset(); $("#task-date").value = new Date().toISOString().slice(0, 10); $("#task-modal").showModal(); setTimeout(() => $("#task-title").focus(), 0); }
function openNoteModal() { $("#note-form").reset(); $("#note-modal").showModal(); setTimeout(() => $("#note-title").focus(), 0); }

$("#task-form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  try { state.tasks.unshift(createTask({ title: $("#task-title").value, dueDate: $("#task-date").value, priority: $("#task-priority").value })); save(); render(); $("#task-modal").close(); toast("Task added to your day"); }
  catch (error) { $("#task-title").setCustomValidity(error.message); $("#task-title").reportValidity(); $("#task-title").setCustomValidity(""); }
});

$("#note-form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  try { state.notes.unshift(createNote({ title: $("#note-title").value, body: $("#note-body").value, color: $("input[name='note-color']:checked").value })); save(); render(); $("#note-modal").close(); toast("Note saved"); }
  catch (error) { $("#note-body").setCustomValidity(error.message); $("#note-body").reportValidity(); $("#note-body").setCustomValidity(""); }
});

$("#task-list").addEventListener("change", (event) => { const id = event.target.dataset.toggle; if (!id) return; const task = state.tasks.find((item) => item.id === id); task.completed = event.target.checked; save(); render(); toast(task.completed ? "Nice work — task complete" : "Task reopened"); });
$("#task-list").addEventListener("click", (event) => { const id = event.target.dataset.delete; if (!id) return; state.tasks = state.tasks.filter((task) => task.id !== id); save(); render(); toast("Task removed"); });
$("#notes-grid").addEventListener("click", (event) => { const id = event.target.dataset.noteDelete; if (!id) return; state.notes = state.notes.filter((note) => note.id !== id); save(); render(); toast("Note removed"); });
$("#clear-completed").addEventListener("click", () => { const before = state.tasks.length; state.tasks = state.tasks.filter((task) => !task.completed); save(); render(); toast(before === state.tasks.length ? "Nothing to clear" : "Completed tasks cleared"); });
$("#search-input").addEventListener("input", (event) => { search = event.target.value; render(); });
$$('.nav__item').forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
[$("#open-task-modal"), $("#empty-add")].forEach((button) => button.addEventListener("click", openTaskModal));
[$("#open-note-modal"), $("#empty-note")].forEach((button) => button.addEventListener("click", openNoteModal));
$("#menu-button").addEventListener("click", () => setMenuOpen(!$("#sidebar").classList.contains("is-open")));
$("#sidebar-backdrop").addEventListener("click", () => setMenuOpen(false));
window.addEventListener("keydown", (event) => { if (event.key === "Escape" && $("#sidebar").classList.contains("is-open")) setMenuOpen(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 980) setMenuOpen(false); });

$$('[data-dialog-close]').forEach((button) => button.addEventListener("click", () => button.closest("dialog").close("cancel")));

function setTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme); }
setTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

function updateTimer() { const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0"); const seconds = (timerSeconds % 60).toString().padStart(2, "0"); $("#timer").textContent = `${minutes}:${seconds}`; document.title = timerHandle ? `${minutes}:${seconds} — Daymark` : "Daymark — Plan with clarity"; }
function stopTimer(completed = false) { clearInterval(timerHandle); timerHandle = null; $("#timer-toggle").textContent = "Start focus"; if (completed) { state.focusMinutes += timerMinutes; save(); render(); toast("Focus session complete"); } }
function openFocus() { $("#focus-modal").showModal(); updateTimer(); }
[$("#start-focus"), $("#focus-shortcut")].forEach((button) => button.addEventListener("click", openFocus));
$("#focus-close").addEventListener("click", () => { stopTimer(); $("#focus-modal").close(); });
$$('.timer-options button').forEach((button) => button.addEventListener("click", () => { stopTimer(); timerMinutes = Number(button.dataset.minutes); timerSeconds = timerMinutes * 60; $$('.timer-options button').forEach((item) => item.classList.toggle("is-active", item === button)); updateTimer(); }));
$("#timer-toggle").addEventListener("click", () => { if (timerHandle) { stopTimer(); return; } $("#timer-toggle").textContent = "Pause focus"; timerHandle = setInterval(() => { timerSeconds -= 1; updateTimer(); if (timerSeconds <= 0) { stopTimer(true); timerSeconds = timerMinutes * 60; updateTimer(); } }, 1000); });

$("#date-label").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
render();
