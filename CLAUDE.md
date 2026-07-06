# Tracker — project guide for Claude

## What this is
A personal habitpoints tracker. Single static site, deployed on GitHub Pages.
Plain HTML/CSS/JS, NO build step, NO framework, NO npm. Data in localStorage.
Files: index.html + css/styles.css + js/*.js (14 modules).

## Hard rules (do not break)
- NEVER add a bundler, framework, or build step. Must stay deployable as static
  files on GitHub Pages with no config.
- NEVER change existing localStorage keys app_points, app_cals, app_tasks,
  app_budget, app_goals (extending their structure is OK).
- NEVER break existing functionality during refactors — behavior must stay identical.
- All datetime logic uses the America/Toronto timezone.
- Respect prefers-reduced-motion for animations.

## Architecture
index.html (HTML only) → css/styles.css → js modules in load order:
  config.js  — all constants (RANKS, QUOTES, EXAMPLE_GOALS, BUDGETS, SHOP_*, MUSCLES,
               MUSCLE_RANK_TIERS, MUSCLE_LIFT_CONFIG, GYM_DAYS, EXERCISE_ALTERNATIVES, …)
  storage.js — sget/sset localStorage + helpers (today, fmt, torontoNow, …)
  state.js   — global mutable state declarations (let points, cals, tasks, …,
               gymData, gymProgram, bodyWeight, narratorMode, profileName, activeDay)
  ui.js      — showNotif, clock tick, renderQuote
  points.js  — points balance, rank badge, pending list
  food.js    — calorie logging, meal database, search/portion picker
  tasks.js   — task list, reminders, toast
  budget.js  — weekly indulgence budget
  goals.js   — user-defined milestones (up to 4), difficulty badges, bar animation
  stats.js   — history snapshot, Дні/Поінти/Покупки/Завдання sub-tabs
  shop.js    — shop, spend log, grand reward
  gym.js     — workout program, per-muscle lift-based rank system, editable program
  narrator.js — scripted Stanley Parable-style commentary; narratorSay(trigger), narratorInit()
  app.js     — tab navigation (switchTab), async INIT

## Pages / navigation
Bottom fixed nav bar (Instagram-style, safe-area aware) with 7 items + inline SVG icons:
  Дім | Зал | Їжа | Бюджет | Цілі | Магазин | Стат
Ранги is an 8th section (#ranks) reachable via "Таблиця рангів →" button in the Зал muscle
panel; no bottom-nav slot. switchTab('ranks') highlights the Зал nav item.

- Головна: clock, quote (+ spin button), gym nav card, points+pending, today's tasks
- Зал: warmup notes, constraints, muscle panel (with bodyweight input) + Ранги link,
  Day A/B/C selector, exercise logging with swap/remove/add controls
- Їжа: calorie tracker + macro bars + food database
- Бюджет: weekly indulgence caps — Соцмережі / Ігри / Порушення плану
- Цілі: user-defined goal slots (up to 4), empty slots prompt "Яка ваша ціль?"
- Магазин: spend points on budget boosts / rewards
- Статистика: Дні / Поінти / Покупки / Завдання sub-tabs + Narrator settings card (mode + name change)
- Ранги (sub-page): per-muscle best-lift rank + % to next rank + per-muscle rank ladder

## Core concepts
- Points: permanent currency, NEVER expire. Earned via Pending flow (reason required),
  confirmed manually. Shop lets you spend on rewards / budget top-ups.
- Budget: weekly indulgence caps (Соцмережі/Ігри/Порушення плану) that reset Monday.
  Bonus slots bought in shop. Keys stay: tiktok / dota / cheats.
- Goals: up to 4 user-defined milestones. Empty slots show add-form with EXAMPLE_GOALS
  suggestions. Each goal awards pts once on completion (easy=100/normal=200/hard=300).
- Quotes: ~100 curated quotes (Machiavelli, stoics, films, TV, anime), rotate by Toronto
  time windows 09/13/16/21/23, deterministic. Spin button gives random quote with 1h cooldown.

## Gym / rank system (gym.js + config.js + app_gym, app_gym_program, app_bw)
- 6 muscle groups: Chest, Back, Legs, Shoulders, Arms, Core.
- Ranks (Wood→Olympian) are tied to actual best logged weight, not abstract XP.
  See MUSCLE_LIFT_CONFIG in config.js for thresholds per lift.
  BW-ratio muscles (bench/row/squat): threshold = fraction of bodyWeight (stored in app_bw).
  Absolute muscles (lateral raise / bicep curl): threshold in kg.
  Core: threshold in reps/seconds.
- Progress shown as "68% — залишилось 32% до Silver".
- app_gym = { muscles:{chest:{},…}, workoutLog:[{id,date,dayId,exId,weight,reps,sets,muscle}] }
- app_bw = number (user's bodyweight in kg, default 70)
- Editable program: users can add/remove/swap exercises per day.
  Customisations saved in app_gym_program = { A:[…], B:[…], C:[…] }.
  EXERCISE_ALTERNATIVES in config.js defines one swap option per exercise.
  "↺ Відновити початкову програму" resets a day to GYM_DAYS defaults.
- Body diagram: TODO for etap 2.

## Workout program defaults (GYM_DAYS in config.js)
- Day A: Full Body / Strength — Squat, Bench, Barbell Row, Lat Pulldown, Lateral Raise, Triceps
- Day B: Full Body / Hypertrophy — RDL, Incline DB Press, DB Row, Leg Press, Lateral Raise, Biceps
- Day C: Bonus (optional) — Pull-ups, Cable Crossover, Lateral Raise, Lunges, Bi+Tri, Core
- Constraints: NO overhead pressing; warmup = 5 min cardio + band ext rotations 2×15 + face pulls 2×15.

## Narrator feature (narrator.js + app_narrator, app_narrator_last, app_profile_name)
- Scripted commentary in The Stanley Parable style: dry, theatrical, condescending for routine
  actions; sincerely proud for real achievements (rank_up, goal_completed, points_threshold).
- Onboarding modal (#onboardingModal) shown on first visit (when app_profile_name is null).
  User enters name → saved to app_profile_name. Narrator always calls them 'Stanley' anyway,
  occasionally referencing the real name sarcastically. profileName global in state.js.
- 3 modes in app_narrator: 'intensive' (all events), 'moderate' (notable only), 'off'.
  Default: 'moderate'. Old boolean values migrate gracefully.
- Moderate fires only: idle, rank_up, goal_completed, budget_exceeded, points_threshold.
- 12 trigger groups, ~10-12 lines each: app_open, idle (≥2 days away), log_gym, rank_up,
  points_gained, points_spent, budget_exceeded, goal_completed, task_completed,
  log_food, points_threshold (every 100 pts crossed), spin_button_used.
- Lines use {stanley} and {name} placeholders resolved by _n() at display time.
- narratorSay(trigger) picks random non-repeated line per session; resets when exhausted.
- Display: #narratorBanner — fixed above bottom nav, amber left-border, 5.5 s auto-dismiss,
  manual close. Lines queue (never overlap).
- Mode selector + name change UI rendered in Stats page (#narratorSettingsContent) by
  renderNarratorSettings() — NOT on Home page.
- app_narrator_last tracks last visit; ≥2 day gap fires 'idle' instead of 'app_open'.
- narratorInit() called last in app.js INIT; hooks in points.js, shop.js, budget.js,
  goals.js, tasks.js, gym.js, food.js each call narratorSay() on matching events.
- No API calls, no AI, no build step. Fully scripted static.

## Quote spin button (ui.js + app_quote_spin)
- Daily quote logic unchanged (deterministic per Toronto time window).
- Small "🎲 Крутнути" button in the quote block; picks a random quote ≠ current daily.
- 1-hour cooldown persisted in app_quote_spin (epoch ms of expiry); live countdown shown.
- Spun quote is visual/temporary only — not persisted, resets on next page load.
- Tap fires narrator 'spin_button_used' trigger if narrator is active.
- initSpin() called from app.js INIT before renderQuote().

## Workflow
- After changes test on the live GitHub Pages URL (not file://) then commit and push.
- Keep this file short. Update it when a major decision or rule changes.
