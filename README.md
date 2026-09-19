const defaultState = {
  profile: {
    name: "Alex",
    goal: "fat-loss",
    age: 28,
    weight: 72,
    height: 176,
    activity: 1.55,
  },
  meals: [
    {
      name: "Breakfast",
      items: ["Oats with Greek yogurt", "Blueberries", "Almonds", "Protein shake"],
    },
    {
      name: "Lunch",
      items: ["Grilled chicken breast", "Brown rice", "Roasted vegetables", "Avocado"],
    },
    {
      name: "Dinner",
      items: ["Salmon fillet", "Sweet potato", "Green salad", "Olive oil dressing"],
    },
    {
      name: "Snack",
      items: ["Cottage cheese", "Apple", "Peanut butter"],
    },
  ],
  workouts: [
    { day: "Monday", name: "Upper body strength", time: "45 min", focus: "Push + pull" },
    { day: "Wednesday", name: "HIIT cardio", time: "30 min", focus: "Intervals" },
    { day: "Friday", name: "Leg day", time: "50 min", focus: "Compound lifts" },
  ],
  habits: [
    { text: "Drink 2L water", checked: true },
    { text: "Sleep 8 hours", checked: false },
    { text: "Stretch 10 minutes", checked: true },
    { text: "Track meals", checked: false },
  ],
};

const STORAGE_KEY = "fitflowPlannerState";

const state = loadState();
const todayTitle = document.getElementById("todayTitle");
const goalLabel = document.getElementById("goalLabel");
const calorieTarget = document.getElementById("calorieTarget");
const proteinTarget = document.getElementById("proteinTarget");
const waterTarget = document.getElementById("waterTarget");
const workoutTarget = document.getElementById("workoutTarget");
const calorieStatus = document.getElementById("calorieStatus");
const proteinStatus = document.getElementById("proteinStatus");
const waterStatus = document.getElementById("waterStatus");
const workoutStatus = document.getElementById("workoutStatus");
const macroProtein = document.getElementById("macroProtein");
const macroCarbs = document.getElementById("macroCarbs");
const macroFat = document.getElementById("macroFat");
const ringPercent = document.getElementById("ringPercent");
const macroRing = document.getElementById("macroRing");
const mealList = document.getElementById("mealList");
const workoutList = document.getElementById("workoutList");
const habitList = document.getElementById("habitList");

initialize();

function initialize() {
  bindUi();
  populateProfileForm();
  render();
  updateDate();
}

function bindUi() {
  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = {
      name: document.getElementById("userName").value || "Alex",
      goal: document.getElementById("goalSelect").value,
      age: Number(document.getElementById("age").value || 28),
      weight: Number(document.getElementById("weight").value || 72),
      height: Number(document.getElementById("height").value || 176),
      activity: Number(document.getElementById("activityLevel").value || 1.55),
    };
    saveState();
    render();
  });

  document.getElementById("addMealBtn").addEventListener("click", addMeal);
  document.getElementById("addWorkoutBtn").addEventListener("click", addWorkout);
  document.getElementById("quickAddBtn").addEventListener("click", () => {
    const choice = window.confirm("Add a new meal or workout?");
    if (choice) addMeal();
    else addWorkout();
  });

  document.getElementById("resetDataBtn").addEventListener("click", () => {
    if (window.confirm("Reset planner to default data?")) {
      const reset = JSON.parse(JSON.stringify(defaultState));
      state.profile = reset.profile;
      state.meals = reset.meals;
      state.workouts = reset.workouts;
      state.habits = reset.habits;
      saveState();
      populateProfileForm();
      render();
    }
  });

  document.querySelector(".nav-item").classList.add("active");
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function populateProfileForm() {
  document.getElementById("userName").value = state.profile.name;
  document.getElementById("goalSelect").value = state.profile.goal;
  document.getElementById("age").value = state.profile.age;
  document.getElementById("weight").value = state.profile.weight;
  document.getElementById("height").value = state.profile.height;
  document.getElementById("activityLevel").value = String(state.profile.activity);
}

function render() {
  renderSummary();
  renderMeals();
  renderWorkouts();
  renderHabits();
}

function updateDate() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  todayTitle.textContent = formatted;
}

function renderSummary() {
  const { goal, weight, height, age, activity } = state.profile;
  const calories = calculateCalories({ weight, height, age, activity, goal });
  const protein = Math.round(calories * 0.28 / 4);
  const carbs = Math.round(calories * 0.42 / 4);
  const fat = Math.round(calories * 0.3 / 9);
  const water = goal === "muscle-gain" ? 2.8 : 2.2;
  const weeklyWorkout = state.workouts.reduce((sum, work) => sum + extractMinutes(work.time), 0);

  goalLabel.textContent = formatGoal(goal);
  calorieTarget.textContent = `${Math.round(calories)} kcal`;
  proteinTarget.textContent = `${protein} g`;
  waterTarget.textContent = `${water.toFixed(1)} L`;
  workoutTarget.textContent = `${weeklyWorkout} min`;

  if (goal === "fat-loss") {
    calorieStatus.textContent = "Deficit plan";
    proteinStatus.textContent = "Lean muscle support";
    waterStatus.textContent = "Hydration focus";
    workoutStatus.textContent = "Cardio + strength";
  } else if (goal === "muscle-gain") {
    calorieStatus.textContent = "Clean surplus";
    proteinStatus.textContent = "High recovery";
    waterStatus.textContent = "Performance fuel";
    workoutStatus.textContent = "Strength focus";
  } else {
    calorieStatus.textContent = "Balanced";
    proteinStatus.textContent = "Steady energy";
    waterStatus.textContent = "Daily hydration";
    workoutStatus.textContent = "Mobility + strength";
  }

  macroProtein.textContent = `${protein}g`;
  macroCarbs.textContent = `${carbs}g`;
  macroFat.textContent = `${fat}g`;

  const totalMacros = protein + carbs + fat;
  const completionPercent = Math.min(100, Math.round((totalMacros / 360) * 100));
  ringPercent.textContent = `${completionPercent}%`;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference - (completionPercent / 100) * circumference;
  macroRing.style.strokeDasharray = `${circumference}`;
  macroRing.style.strokeDashoffset = `${dashOffset}`;
  macroRing.setAttribute("stroke", "url(#ringGradient)");

  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.setAttribute("id", "ringGradient");
  gradient.setAttribute("x1", "0%")
  gradient.setAttribute("x2", "100%")
  gradient.setAttribute("y1", "0%")
  gradient.setAttribute("y2", "100%")

  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#69e0a5");
  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#8f7cf6");
  gradient.append(stop1, stop2);

  const svg = document.querySelector("svg");
  if (!svg.querySelector("#ringGradient")) {
    svg.prepend(gradient);
  }
}

function renderMeals() {
  mealList.innerHTML = "";

  state.meals.forEach((meal, index) => {
    const template = document.getElementById("mealTemplate");
    const clone = template.content.cloneNode(true);
    const mealItem = clone.querySelector(".meal-item");
    const mealName = clone.querySelector(".meal-name");
    const details = clone.querySelector(".meal-details");
    const deleteBtn = clone.querySelector(".delete-btn");

    mealName.textContent = meal.name;
    meal.items.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      details.appendChild(li);
    });

    deleteBtn.addEventListener("click", () => {
      state.meals.splice(index, 1);
      saveState();
      renderMeals();
      renderSummary();
    });

    mealList.appendChild(clone);
  });
}

function renderWorkouts() {
  workoutList.innerHTML = "";

  state.workouts.forEach((workout, index) => {
    const template = document.getElementById("workoutTemplate");
    const clone = template.content.cloneNode(true);
    const day = clone.querySelector(".workout-day");
    const name = clone.querySelector(".workout-name");
    const time = clone.querySelector(".workout-time");
    const focus = clone.querySelector(".workout-focus");
    const deleteBtn = clone.querySelector(".delete-btn");

    day.textContent = workout.day;
    name.textContent = workout.name;
    time.textContent = workout.time;
    focus.textContent = workout.focus;

    deleteBtn.addEventListener("click", () => {
      state.workouts.splice(index, 1);
      saveState();
      renderWorkouts();
      renderSummary();
    });

    workoutList.appendChild(clone);
  });
}

function renderHabits() {
  habitList.innerHTML = "";

  state.habits.forEach((habit, index) => {
    const template = document.getElementById("habitTemplate");
    const clone = template.content.cloneNode(true);
    const label = clone.querySelector(".habit-item");
    const input = clone.querySelector("input");
    const text = clone.querySelector(".habit-text");

    text.textContent = habit.text;
    input.checked = habit.checked;
    if (habit.checked) label.classList.add("checked");

    input.addEventListener("change", (event) => {
      state.habits[index].checked = event.target.checked;
      saveState();
      renderHabits();
    });

    habitList.appendChild(clone);
  });
}

function addMeal() {
  const mealName = window.prompt("Meal name:", "Lunch");
  if (!mealName) return;

  const rawItems = window.prompt("Add ingredients separated by commas:", "Chicken, rice, vegetables");
  if (!rawItems) return;

  const items = rawItems
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  state.meals.push({ name: mealName, items });
  saveState();
  renderMeals();
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
}

function calculateCalories({ weight, height, age, activity, goal }) {
  let base = 10 * weight + 6.25 * height - 5 * age + 5;
  base *= activity;

  if (goal === "fat-loss") return Math.round(base - 400);
  if (goal === "muscle-gain") return Math.round(base + 250);
  return Math.round(base);
}

function formatGoal(goal) {
  switch (goal) {
    case "fat-loss":
      return "Fat Loss";
    case "maintenance":
      return "Maintenance";
    case "muscle-gain":
      return "Muscle Gain";
    default:
      return "Balanced";
  }
}

function extractMinutes(value) {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(saved);
    return {
      ...JSON.parse(JSON.stringify(defaultState)),
      ...parsed,
      profile: { ...defaultState.profile, ...parsed.profile },
      meals: parsed.meals || defaultState.meals,
      workouts: parsed.workouts || defaultState.workouts,
      habits: parsed.habits || defaultState.habits,
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

window.addEventListener("beforeunload", saveState);
