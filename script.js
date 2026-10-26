// RepLab stores workout progress in this browser using localStorage.
const STORAGE_KEY = "replab-progress-v1";
const EXERCISE_IDS = [
  "home-squats", "home-pushups", "home-bridges",
  "strength-press", "strength-row", "strength-deadlift",
  "cardio-walk", "cardio-march", "cardio-stretch"
];

// Load saved progress safely; start with an empty plan for a new visitor.
function loadProgress() {
  try {
    const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (savedProgress && typeof savedProgress === "object") {
      return {
        completedExercises: savedProgress.completedExercises || {},
        workoutDays: savedProgress.workoutDays || {}
      };
    }
  } catch (error) {
    console.info("Saved RepLab progress could not be read.");
  }
  return { completedExercises: {}, workoutDays: {} };
}

let progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.info("RepLab could not save progress in this browser.");
  }
}

function getStartOfWeek(date) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderWeeklyChart() {
  const chart = document.querySelector("#weekly-chart");
  const today = new Date();
  const monday = getStartOfWeek(today);
  const todayKey = getDayKey(today);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let weeklyTotal = 0;

  chart.innerHTML = "";
  dayNames.forEach((dayName, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const count = progress.workoutDays[getDayKey(day)] || 0;
    weeklyTotal += count;

    const dayColumn = document.createElement("div");
    dayColumn.className = `chart-day${getDayKey(day) === todayKey ? " today" : ""}`;
    dayColumn.innerHTML = `<div class="chart-track" aria-label="${count} exercises completed on ${dayName}"><div class="chart-bar" style="height:${Math.min(count / 3, 1) * 100}%"></div></div><span class="chart-day-label">${dayName}</span>`;
    chart.append(dayColumn);
  });

  document.querySelector("#weekly-total").textContent = `${weeklyTotal} ${weeklyTotal === 1 ? "exercise" : "exercises"} this week`;
  document.querySelector("#week-label").textContent = `WEEK OF ${monday.toLocaleDateString("en", { month: "short", day: "numeric" }).toUpperCase()}`;
}

// Restore checkboxes and mark a workout day when the first exercise is checked.
document.querySelectorAll(".exercise-check").forEach((checkbox) => {
  checkbox.checked = Boolean(progress.completedExercises[checkbox.dataset.exercise]);
  checkbox.addEventListener("change", () => {
    const exerciseId = checkbox.dataset.exercise;
    const wasCompleted = Boolean(progress.completedExercises[exerciseId]);
    progress.completedExercises[exerciseId] = checkbox.checked;

    const dayKey = getDayKey(new Date());
    const dailyCount = progress.workoutDays[dayKey] || 0;
    progress.workoutDays[dayKey] = Math.max(0, dailyCount + (checkbox.checked ? 1 : -1));
    if (progress.workoutDays[dayKey] === 0) delete progress.workoutDays[dayKey];

    // Ignore a duplicate change event so totals always match checked exercises.
    if (wasCompleted === checkbox.checked) return;
    saveProgress();
    renderWeeklyChart();
  });
});

document.querySelector("#bmi-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const height = Number(document.querySelector("#height").value);
  const weight = Number(document.querySelector("#weight").value);
  const result = document.querySelector("#bmi-result");

  if (!Number.isFinite(height) || !Number.isFinite(weight) || height < 80 || height > 272 || weight < 20 || weight > 635) {
    result.textContent = "Enter a height from 80–272 cm and weight from 20–635 kg.";
    result.classList.add("error");
    return;
  }

  const bmi = weight / ((height / 100) ** 2);
  let category = "above the typical adult range";
  if (bmi < 18.5) category = "below the typical adult range";
  if (bmi >= 18.5 && bmi < 25) category = "within the typical adult range";
  result.textContent = `Your BMI is ${bmi.toFixed(1)} — ${category}.`;
  result.classList.remove("error");
});

document.querySelector("#reset-progress").addEventListener("click", () => {
  progress = { completedExercises: {}, workoutDays: {} };
  document.querySelectorAll(".exercise-check").forEach((checkbox) => { checkbox.checked = false; });
  saveProgress();
  renderWeeklyChart();
});

const menuToggle = document.querySelector("#menu-toggle");
const navLinks = document.querySelector("#nav-links");
menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("open", !isExpanded);
});

// Close the mobile menu after choosing a destination.
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    navLinks.classList.remove("open");
  });
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderWeeklyChart();
