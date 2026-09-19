const defaults = {
  profile: {
    name: "Alex",
    goal: "fat-loss",
    age: 28,
    weight: 72,
    height: 176,
    activity: 1.55,
  },
  meals: [
    { name: "Breakfast", items: ["Oats with Greek yogurt", "Blueberries", "Almonds", "Protein shake"], calories: 430, protein: 34, carbs: 42, fat: 13 },
    { name: "Lunch", items: ["Grilled chicken breast", "Brown rice", "Roasted vegetables", "Avocado"], calories: 560, protein: 42, carbs: 46, fat: 19 },
    { name: "Dinner", items: ["Salmon fillet", "Sweet potato", "Green salad", "Olive oil dressing"], calories: 610, protein: 38, carbs: 41, fat: 27 },
    { name: "Snack", items: ["Cottage cheese", "Apple", "Peanut butter"], calories: 280, protein: 22, carbs: 25, fat: 9 },
  ],
  workouts: [
    { day: "Mon", name: "Upper body strength", time: "45 min", focus: "Push + pull" },
    { day: "Wed", name: "HIIT cardio", time: "30 min", focus: "Intervals" },
    { day: "Fri", name: "Leg day", time: "50 min", focus: "Compound lifts" },
  ],
  habits: [
    { text: "Drink 2L water", checked: true },
    { text: "Sleep 8 hours", checked: false },
    { text: "Stretch 10 minutes", checked: true },
    { text: "Track meals", checked: false },
  ],
  weightLog: [72, 71.8, 72.1, 71.7, 71.5, 71.4, 71.2],
  theme: "dark",
};

const STORAGE_KEY = "fitflowProState";
const clone = (value) => JSON.parse(JSON.stringify(value));
const $ = (id) => document.getElementById(id);

let state = loadState();

const toast = (message) => {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return clone(defaults);
    return {
      ...clone(defaults),
      ...saved,
      profile: { ...defaults.profile, ...saved.profile },
      meals: saved.meals || clone(defaults.meals),
      workouts: saved.workouts || clone(defaults.workouts),
      habits: saved.habits || clone(defaults.habits),
      weightLog: saved.weightLog || clone(defaults.weightLog),
    };
  } catch {
    return clone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  $("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = {
      name: $("userName").value || "Alex",
      goal: $("goalSelect").value,
      age: Number($("age").value || 28),
      weight: Number($("weight").value || 72),
      height: Number($("height").value || 176),
      activity: Number($("activityLevel").value || 1.55),
    };
    saveState();
    render();
    toast("Profile updated ✦");
  });

  $("addMealBtn").onclick = addMeal;
  $("addWorkoutBtn").onclick = addWorkout;
  $("quickAddBtn").onclick = () => {
    const addMealMode = window.confirm("Add a meal? Choose Cancel to add a workout.");
    if (addMealMode) addMeal();
    else addWorkout();
  };

  $("addHabitBtn").onclick = () => {
    const text = window.prompt("What habit would you like to track?", "Read for 10 minutes");
    if (!text) return;
    state.habits.push({ text, checked: false });
    saveState();
    renderHabits();
    toast("Habit added");
  };

  $("themeBtn").onclick = () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    document.body.classList.toggle("light", state.theme === "light");
    saveState();
  };

  $("resetDataBtn").onclick = () => {
    if (window.confirm("Reset all planner data?")) {
      state = clone(defaults);
      saveState();
      fillProfile();
      render();
      toast("Planner reset");
    }
  };

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const target = $(button.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function fillProfile() {
  const profile = state.profile;
  $("userName").value = profile.name;
  $("goalSelect").value = profile.goal;
  $("age").value = profile.age;
  $("weight").value = profile.weight;
  $("height").value = profile.height;
  $("activityLevel").value = String(profile.activity);
}

function render() {
  renderSummary();
  renderMeals();
  renderWorkouts();
  renderHabits();
  renderChart();
  renderInsights();
}

function updateDate() {
  const now = new Date();
  $("todayTitle").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

function goalName(goal) {
  return {
    "fat-loss": "Fat Loss",
    maintenance: "Maintenance",
    "muscle-gain": "Muscle Gain",
  }[goal] || "Balanced";
}

function caloriesForGoal() {
  const { weight, height, age, activity, goal } = state.profile;
  let base = (10 * weight + 6.25 * height - 5 * age + 5) * activity;
  if (goal === "fat-loss") return Math.round(base - 400);
  if (goal === "muscle-gain") return Math.round(base + 250);
  return Math.round(base);
}

function minutes(value) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function renderSummary() {
  const c = caloriesForGoal();
  const p = Math.round((c * 0.28) / 4);
  const carbs = Math.round((c * 0.42) / 4);
  const fat = Math.round((c * 0.3) / 9);
  const weeklyWorkout = state.workouts.reduce((sum, workout) => sum + minutes(workout.time), 0);

  $("greetingName").textContent = state.profile.name;
  $("goalLabel").textContent = goalName(state.profile.goal);
  $("calorieTarget").textContent = `${c} kcal`;
  $("proteinTarget").textContent = `${p} g`;
  $("waterTarget").textContent = `${state.profile.goal === "muscle-gain" ? "2.8" : "2.2"} L`;
  $("workoutTarget").textContent = `${weeklyWorkout} min`;

  const labels = state.profile.goal === "fat-loss"
    ? ["Deficit plan", "Lean muscle support", "Hydration focus", "Cardio + strength"]
    : state.profile.goal === "muscle-gain"
      ? ["Clean surplus", "High recovery", "Performance fuel", "Strength focus"]
      : ["Balanced", "Steady energy", "Daily hydration", "Mobility + strength"];

  $("calorieStatus").textContent = labels[0];
  $("proteinStatus").textContent = labels[1];
  $("waterStatus").textContent = labels[2];
  $("workoutStatus").textContent = labels[3];

  $("macroProtein").textContent = `${p}g`;
  $("macroCarbs").textContent = `${carbs}g`;
  $("macroFat").textContent = `${fat}g`;

  const percent = Math.min(100, Math.round(((p + carbs + fat) / 360) * 100));
  $("ringPercent").textContent = `${percent}%`;
  const circumference = 2 * Math.PI * 38;
  $("macroRing").style.strokeDasharray = String(circumference);
  $("macroRing").style.strokeDashoffset = String(circumference - (percent / 100) * circumference);
}

function renderMeals() {
  const list = $("mealList");
  list.innerHTML = "";

  state.meals.forEach((meal, index) => {
    const template = $("mealTemplate").content.cloneNode(true);
    template.querySelector(".meal-name").textContent = meal.name;

    const details = template.querySelector(".meal-details");
    meal.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      details.appendChild(li);
    });

    template.querySelector(".delete-btn").addEventListener("click", () => {
      state.meals.splice(index, 1);
      saveState();
      renderMeals();
      renderInsights();
      toast("Meal removed");
    });

    list.appendChild(template);
  });
}

function renderWorkouts() {
  const list = $("workoutList");
  list.innerHTML = "";

  state.workouts.forEach((workout, index) => {
    const template = $("workoutTemplate").content.cloneNode(true);
    template.querySelector(".workout-day").textContent = workout.day;
    template.querySelector(".workout-name").textContent = workout.name;
    template.querySelector(".workout-time").textContent = workout.time;
    template.querySelector(".workout-focus").textContent = workout.focus;

    template.querySelector(".delete-btn").addEventListener("click", () => {
      state.workouts.splice(index, 1);
      saveState();
      renderWorkouts();
      renderSummary();
      renderInsights();
      toast("Workout removed");
    });

    list.appendChild(template);
  });
}

function renderHabits() {
  const list = $("habitList");
  list.innerHTML = "";
  let complete = 0;

  state.habits.forEach((habit, index) => {
    const template = $("habitTemplate").content.cloneNode(true);
    const label = template.querySelector(".habit-item");
    const input = template.querySelector("input");
    const text = template.querySelector(".habit-text");

    text.textContent = habit.text;
    input.checked = habit.checked;
    if (habit.checked) {
      label.classList.add("checked");
      complete += 1;
    }

    input.addEventListener("change", (event) => {
      state.habits[index].checked = event.target.checked;
      saveState();
      renderHabits();
      renderChart();
      renderInsights();
    });

    list.appendChild(template);
  });

  $("habitCompletion").textContent = `${complete}/${state.habits.length}`;
  $("streakValue").textContent = String(Math.max(1, complete + 2));
}

function renderChart() {
  const completed = state.habits.filter((habit) => habit.checked).length;
  const data = [58, 74, 45, 88, 68, 94, Math.min(100, 55 + completed * 10)];
  const chart = $("progressChart");
  chart.innerHTML = data
    .map((height, index) => `<div class="bar ${index === 6 ? "today" : ""}" style="--height:${height}%"></div>`)
    .join("");
}

function renderInsights() {
  const completedHabits = state.habits.filter((habit) => habit.checked).length;
  const recovery = 75 + completedHabits * 5;
  const hydration = Math.min(100, 70 + Math.round((completedHabits / state.habits.length) * 30));
  const sleep = 72 + (state.profile.goal === "maintenance" ? 12 : 8);
  const consistency = Math.min(100, 60 + completedHabits * 8);

  $("recoveryScore").textContent = `${recovery}%`;
  $("hydrationScore").textContent = `${hydration}%`;
  $("sleepScore").textContent = `${sleep}%`;
  $("consistencyScore").textContent = `${consistency}%`;

  const chart = $("weightChart");
  const max = Math.max(...state.weightLog, ...[state.profile.weight]);
  const min = Math.min(...state.weightLog, ...[state.profile.weight]);
  chart.innerHTML = state.weightLog
    .slice(-7)
    .map((value) => {
      const height = Math.max(18, ((value - min) / (max - min || 1)) * 100 + 20);
      return `<div class="weight-bar" style="height:${height}%"></div>`;
    })
    .join("");

  const weekGrid = $("weekGrid");
  const totalCalories = state.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = state.meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

  const weekData = [
    { label: "Calories", value: `${totalCalories} kcal` },
    { label: "Protein", value: `${totalProtein} g` },
    { label: "Workouts", value: `${state.workouts.length} / 3` },
    { label: "Hydrate", value: `${state.habits[0].checked ? "Done" : "Pending"}` },
    { label: "Sleep", value: `${state.habits[1].checked ? "Good" : "Low"}` },
    { label: "Streak", value: `${Math.max(1, completedHabits + 2)}d` },
  ];

  weekGrid.innerHTML = weekData
    .map((item) => `<div class="week-cell"><span>${item.label}</span><strong>${item.value}</strong></div>`)
    .join("");
}

function addMeal() {
  const name = window.prompt("Meal name:", "Lunch");
  if (!name) return;

  const rawItems = window.prompt("Ingredients separated by commas:", "Chicken, rice, vegetables");
  if (!rawItems) return;

  const calories = Number(window.prompt("Calories:", "520") || 0);
  const protein = Number(window.prompt("Protein (g):", "35") || 0);
  const carbs = Number(window.prompt("Carbs (g):", "40") || 0);
  const fat = Number(window.prompt("Fat (g):", "18") || 0);

  state.meals.push({
    name,
    items: rawItems.split(",").map((item) => item.trim()).filter(Boolean),
    calories,
    protein,
    carbs,
    fat,
  });

  saveState();
  renderMeals();
  renderInsights();
  toast("Meal added ✦");
}

function addWorkout() {
  const day = window.prompt("Workout day:", "Tuesday");
  if (!day) return;

  const name = window.prompt("Workout name:", "Full body circuit");
  if (!name) return;

  const time = window.prompt("Duration:", "35 min");
  if (!time) return;

  const focus = window.prompt("Focus:", "Strength + conditioning");
  if (!focus) return;

  state.workouts.push({ day, name, time, focus });
  saveState();
  renderWorkouts();
  renderSummary();
  renderInsights();
  toast("Workout added ✦");
}

window.addEventListener("beforeunload", saveState);

bindEvents();
fillProfile();
render();
updateDate();
document.body.classList.toggle("light", state.theme === "light");
