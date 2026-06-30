# Tracker — project guide for Claude

## What this is
A personal habitpoints tracker. Single static site, deployed on GitHub Pages.
Plain HTML/CSS/JS, NO build step, NO framework, NO npm. Data in localStorage.
Files: index.html + css/styles.css + js/*.js (12 modules).

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
  config.js  — all constants (RANKS, QUOTES, GOALS, BUDGETS, SHOP_*, GYM_DAYS, MUSCLES, …)
  storage.js — sget/sset localStorage + helpers (today, fmt, torontoNow, …)
  state.js   — global mutable state declarations (let points, cals, tasks, …, gymData, activeDay)
  ui.js      — showNotif, clock tick, renderQuote
  points.js  — points balance, rank badge, pending list
  food.js    — calorie logging, meal database, search/portion picker
  tasks.js   — task list, reminders, toast
  budget.js  — weekly indulgence budget
  goals.js   — milestones, difficulty badges, bar animation
  stats.js   — history snapshot, Дні/Поінти/Покупки/Завдання sub-tabs
  shop.js    — shop, spend log, grand reward
  gym.js     — workout program, per-muscle XP/level/rank system
  app.js     — tab navigation (switchTab), async INIT

## Pages / navigation
7 tabs (nav scrolls horizontally): Головна | Зал | Їжа | Бюджет | Цілі | Магазин | Статистика

- Головна: clock, quote, gym nav card, points+pending, today's tasks
- Зал: warmup notes, constraints, muscle panel, Day A/B/C selector, exercise logging
- Їжа: calorie tracker + macro bars + food database (moved from Home)
- Бюджет: weekly indulgence budget (TikTok/Dota/Зриви)
- Цілі: milestone progress bars
- Магазин: spend points on budget boosts / rewards
- Статистика: Дні / Поінти / Покупки / Завдання sub-tabs

## Core concepts
- Points: permanent currency, NEVER expire. Earned via Pending flow (reason required),
  confirmed manually. Shop lets you spend on rewards / budget top-ups.
- Budget: weekly indulgence caps that reset Monday. Bonus slots bought in shop.
- Goals: milestones with difficulty (easy/normal/hard) + colors, award pts once.
- Quotes: 100 cult quotes, rotate by Toronto time windows 09/13/16/21/23, deterministic.

## Gym / XP system (gym.js + app_gym localStorage key)
- 6 muscle groups: Chest, Back, Legs, Shoulders, Arms, Core.
- Each exercise maps to one primary muscle.
- XP per logged set: weight(kg) × reps × sets (weighted);
  bwBase × reps × sets (bodyweight moves, where bwBase is a fixed per-rep value).
- Level curve: xpForLevel(n) = round(MUSCLE_XP_SCALE × n^1.5); MUSCLE_XP_SCALE = 1000.
- Rank tiers by level: Wood(1), Bronze(5), Silver(10), Gold(15), Platinum(20),
  Diamond(25), Champion(30), Titan(40), Olympian(50). Tune in MUSCLE_RANK_TIERS constant.
- app_gym = { muscles:{chest:{level,xp},…}, workoutLog:[{id,date,dayId,exId,…}] }
- Body diagram: TODO for etap 2.

## Workout program (in gym.js as GYM_DAYS constant)
- Day A: Full Body / Strength — Squat, Bench, Barbell Row, Lat Pulldown, Lateral Raise, Triceps
- Day B: Full Body / Hypertrophy — RDL, Incline DB Press, DB Row, Leg Press, Lateral Raise, Biceps
- Day C: Bonus (optional) — Pull-ups, Cable Crossover, Lateral Raise, Lunges, Bi+Tri Superset, Core
- Constraints baked in: NO overhead pressing; daily warmup = 5 min cardio + band ext rotations 2×15 + face pulls 2×15; straps on rows and RDL.

## Workflow
- After changes test on the live GitHub Pages URL (not file://) then commit and push.
- Keep this file short. Update it when a major decision or rule changes.
