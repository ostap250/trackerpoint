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
let gymProgram = null;// loaded from app_gym_program (custom day exercise lists)
let bodyWeight = 70;  // loaded from app_bw (user's bodyweight in kg)
let profileName  = 'Stanley';  // user display name — loaded from app_profile_name
let activeDay  = 'A'; // currently selected workout day
