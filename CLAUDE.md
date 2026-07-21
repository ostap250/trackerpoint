# Tracker — project guide for Claude

## What this is
A personal habitpoints tracker. Single static site, deployed on GitHub Pages.
Plain HTML/CSS/JS, NO build step, NO framework, NO npm. Data in localStorage.
Files: index.html + css/*.css + js/*.js (15 modules) + sw.js + manifest.webmanifest
+ fonts/ + icons/. Installable PWA, works offline.

## Hard rules (do not break)
- NEVER add a bundler, framework, or build step. Must stay deployable as static
  files on GitHub Pages with no config.
- NEVER change existing localStorage keys app_points, app_cals, app_tasks,
  app_budget, app_goals (extending their structure is OK).
- NEVER break existing functionality during refactors — behavior must stay identical.
- All datetime logic uses the America/Toronto timezone.
- Respect prefers-reduced-motion for animations.

## Architecture
index.html (HTML only) → css/fonts.css (self-hosted Sora + JetBrains Mono woff2 in
fonts/ — NO external requests, keep it that way) → css/styles.css → js modules in
load order:
  config.js  — all constants (RANKS, QUOTES, EXAMPLE_GOALS, BUDGETS, SHOP_*, MUSCLES,
               MUSCLE_RANK_TIERS, MUSCLE_LIFT_CONFIG, GYM_DAYS, EXERCISE_ALTERNATIVES, …)
  storage.js — sget/sset localStorage + helpers (today, fmt, torontoNow, …)
  state.js   — global mutable state declarations (let points, cals, tasks, …,
               gymData, gymProgram, bodyWeight, profileName, activeDay)
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
  backup.js  — export/import ALL app_* localStorage keys as one JSON file (Stats page)
  app.js     — tab navigation (switchTab), async INIT, service-worker registration

## PWA (sw.js + manifest.webmanifest + icons/)
- sw.js: network-first with cache fallback (cache name tracker-v1) — fresh code always
  wins online, full offline otherwise. New js/css/font files MUST be added to ASSETS.
- Registered at end of INIT in app.js; skipped on file://.
- icons/icon-{180,192,512}.png — indigo hex badge, generated via PowerShell
  System.Drawing (.claude/ has no generator script; regenerate manually if needed).

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
- Статистика: Дні / Поінти / Покупки / Завдання sub-tabs + Narrator settings card
  (mode + name change) + Дані card (повний JSON експорт/імпорт localStorage)
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

## Narrator feature (narrator.js)
localStorage keys: app_narrator_last, app_profile_name, app_narrator_chars,
  app_narrator_freq, app_narrator_conflict, app_narrator_conflict_ms,
  app_narrator_voice, app_narrator_labels
- Three-character commentary layer. Narrator always-on (locked 🔒); Rival and Observer toggleable.
- Characters (all lines entirely original — copyright-safe):
    narrator  — dry, theatrical, self-aware; treats habits like an ongoing story
    rival     — cold, calculating, data-driven; points out patterns, not the person
    observer  — detached, amused one-liners; finds humans entertaining, not important
- Conflict mode: 2 or 3-char sequences react back-to-back to same event.
  CONFLICTS object: pairs + triples per trigger. Triples: Observer reacts to the exchange.
  All chars in the sequence must be enabled (p.chars.every(c => _chars[c])).
  app_narrator_conflict bool (default on). Timer: app_narrator_conflict_ms ms (default 3000).
- Pacing: conflict non-last banners auto-advance after _conflictAutoMs; last uses 5500ms.
  Manual dismiss always available. Queue items carry { line, charId, timeoutMs }.
- Frequency (app_narrator_freq): minimal / normal / relentless. Default: normal.
  Relentless queues all enabled chars per event. Minimal gates on _MINIMAL_SET.
- 16 trigger groups, 8–9 lines per narrator/rival, 8–9 lines per observer subset:
    app_open, idle (2–6 days), idle_long (7+ days), log_gym, rank_up, points_gained,
    points_spent, budget_exceeded, goal_completed, task_completed,
    log_food / log_food_morning / log_food_evening / log_food_over,
    points_threshold, spin_button_used.
- Conflict triples on: rank_up, goal_completed, idle_long, points_threshold (2 triples each).
- Observer TTS volume: 0.7 (VOICE_CFG.observer.volume = 0.7). Others default 0.92.
  _speak() reads cfg.volume ?? 0.92. TTS provider swappable via _speak().
- CHAR_LABELS mutable let; loaded from app_narrator_labels; only rival/observer editable.
- Settings (Stats page, renderNarratorSettings()): 🔒 Narrator pill, Rival/Observer toggle
  + name inputs, frequency buttons, conflict toggle + timer input, voice toggle, user name.
- Onboarding modal (#onboardingModal) on first visit; name captured → app_profile_name.
- narratorInit() called last in INIT; hooks in points.js, shop.js, food.js etc.
- No external API, no AI, no build step. Fully scripted static.

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
