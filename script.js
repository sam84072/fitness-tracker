const STORAGE_KEY = "pulseforge-workouts-v1";

const workoutForm = document.getElementById("workoutForm");
const tableBody = document.getElementById("workoutTableBody");
const emptyState = document.getElementById("emptyState");

const totalWorkoutsEl = document.getElementById("totalWorkouts");
const weekMinutesEl = document.getElementById("weekMinutes");
const weekCaloriesEl = document.getElementById("weekCalories");
const topTypeEl = document.getElementById("topType");
const clearAllBtn = document.getElementById("clearAll");

const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");
const durationInput = document.getElementById("duration");
const caloriesInput = document.getElementById("calories");

dateInput.valueAsDate = new Date();

let workouts = loadWorkouts();

render();

workoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const workout = {
    id: crypto.randomUUID(),
    date: dateInput.value,
    type: typeInput.value.trim(),
    duration: Number(durationInput.value),
    calories: Number(caloriesInput.value)
  };

  if (!workout.date || !workout.type || workout.duration <= 0 || workout.calories <= 0) {
    return;
  }

  workouts.unshift(workout);
  persist();
  render();
  workoutForm.reset();
  dateInput.valueAsDate = new Date();
  typeInput.focus();
});

tableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains("delete-btn")) {
    return;
  }

  const id = target.dataset.id;
  workouts = workouts.filter((workout) => workout.id !== id);
  persist();
  render();
});

clearAllBtn.addEventListener("click", () => {
  if (workouts.length === 0) {
    return;
  }

  const confirmed = window.confirm("Clear all logged workouts?");
  if (!confirmed) {
    return;
  }

  workouts = [];
  persist();
  render();
});

function render() {
  renderTable();
  renderStats();
}

function renderTable() {
  if (workouts.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  const rows = workouts.map((workout) => {
    return `
      <tr>
        <td>${formatDate(workout.date)}</td>
        <td>${escapeHtml(workout.type)}</td>
        <td>${workout.duration} min</td>
        <td>${workout.calories}</td>
        <td><button class="delete-btn" type="button" data-id="${workout.id}">Delete</button></td>
      </tr>
    `;
  });

  tableBody.innerHTML = rows.join("");
}

function renderStats() {
  totalWorkoutsEl.textContent = String(workouts.length);

  const weekSet = getWeekDateSet();
  let weekMinutes = 0;
  let weekCalories = 0;
  const typeCounts = {};

  for (const workout of workouts) {
    const normalizedType = workout.type.toLowerCase();
    typeCounts[normalizedType] = (typeCounts[normalizedType] || 0) + 1;

    if (weekSet.has(workout.date)) {
      weekMinutes += workout.duration;
      weekCalories += workout.calories;
    }
  }

  weekMinutesEl.textContent = String(weekMinutes);
  weekCaloriesEl.textContent = String(weekCalories);
  topTypeEl.textContent = getTopType(typeCounts);
}

function getWeekDateSet() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const weekDates = new Set();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.add(date.toISOString().split("T")[0]);
  }
  return weekDates;
}

function getTopType(typeCounts) {
  const entries = Object.entries(typeCounts);
  if (entries.length === 0) {
    return "-";
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [topType] = entries[0];
  return topType.charAt(0).toUpperCase() + topType.slice(1);
}

function loadWorkouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => {
      return item &&
        typeof item.id === "string" &&
        typeof item.date === "string" &&
        typeof item.type === "string" &&
        Number.isFinite(item.duration) &&
        Number.isFinite(item.calories);
    });
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHtml(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}
