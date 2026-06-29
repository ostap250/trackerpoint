# Tracker

A personal tracker web app — single HTML file, no build step, data in `localStorage`.

## Tabs

**Home**
- Points system: earn points for gym, job applications, English study, staying on budget. Progress bar toward a 500-point goal.
- Daily calorie + macro logging (kcal / protein / fat / carbs) with per-macro progress bars.
- Today's tasks: add, check off, delete.

**Budget**
- Weekly "indulgence budget" that depletes as you spend it:
  - TikTok — 7 hrs/week
  - Dota — 6 hrs/week
  - Food cheats — 3 per week
- Resets automatically each Monday. Manual reset button available.

**Goals**
- Milestones with progress bars and increment/decrement controls:
  - Bench press 90 kg (starting at 72.5 kg, +2.5 kg steps)
  - Lose 3 kg (starting at 115.7 kg)
  - Earn $2 400/month
  - Nice photos for social media (checkbox)

## Tech

Plain HTML + CSS + JS. No dependencies, no build step. Works offline once loaded. Add to home screen on iOS/Android for a native-app feel.
