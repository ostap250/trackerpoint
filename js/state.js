/* Mutable app state — initialized in app.js INIT */
let points, cals, tasks, budget, goals, history;
let pending, pointsLog, spendLog, tasksLog, meals;

/* Transient UI state (not persisted) */
let selectedMeal  = null;
let mealMult      = 1;
let pendingAmount  = 0;
let pendingEditId  = null;
let gymData;          // loaded from app_gym
let gymImages = {};   // loaded from app_gym_images (wger URL cache)
let activeDay     = 'A'; // currently selected workout day
