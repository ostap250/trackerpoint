/* =====================================================================
   MULTI-CHARACTER NARRATOR — Three voices, one commentary layer.

   Characters:
     narrator  — dry, theatrical, self-aware (always on, locked)
     rival     — cold, calculating, data-driven (toggleable)
     observer  — detached, amused, nihilistic (toggleable)

   Settings (persisted):
     app_narrator_chars        — { rival: bool, observer: bool }
     app_narrator_freq         — 'minimal' | 'normal' | 'relentless'
     app_narrator_conflict     — bool
     app_narrator_conflict_ms  — number ms between conflict chars (default 3000)
     app_narrator_voice        — bool
     app_narrator_labels       — { rival: string, observer: string }
     app_profile_name          — string (→ profileName global in state.js)
     app_narrator_last         — ISO date of last visit
   ===================================================================== */

/* ---- Module state ---- */
let narratorVoice   = false;
let _chars          = { narrator: true, rival: true, observer: true };
let _frequency      = 'normal';
let _conflict       = true;
let _conflictAutoMs = 3000;

/* Mutable — loaded from app_narrator_labels at init */
let CHAR_LABELS = { narrator: 'Narrator', rival: 'Rival', observer: 'Observer' };
const CHAR_COLORS = { narrator: '#E0A646', rival: '#E4574E', observer: '#8A7BE6' };

/* ---- TTS: per-character params — swappable provider ---- */
const VOICE_CFG = {
  narrator: { rate: 0.84, pitch: 0.88 },
  rival:    { rate: 1.05, pitch: 0.75 },
  observer: { rate: 0.90, pitch: 1.12, volume: 0.70 },
};

/* ---- Template resolver: {stanley}→'Stanley', {name}→profileName, {key}→data[key] ---- */
function _t(str, data) {
  return str
    .replace(/{stanley}/g, 'Stanley')
    .replace(/{name}/g,    profileName || 'Stanley')
    .replace(/{(\w+)}/g, (_, k) => (data && data[k] !== undefined) ? data[k] : `{${k}}`);
}

/* ---- TTS (SpeechSynthesis now; swap provider here later) ---- */
function _speak(text, charId) {
  if (!narratorVoice || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const cfg = VOICE_CFG[charId] || VOICE_CFG.narrator;
  utt.rate   = cfg.rate;
  utt.pitch  = cfg.pitch;
  utt.volume = cfg.volume ?? 0.92;
  window.speechSynthesis.speak(utt);
}

/* =====================================================================
   LINE BANKS — 8–10 variants per trigger per character.
   All lines original — no verbatim text from any existing media.
   Emoji appear in ~30% of variants as stylistic accents, not constant tics.
   Rival carries a running thread: occasional dry hints of a larger stake
   in the user's outcome. Never explained — pieced together over time.
   ===================================================================== */

const LINES = {

/* ------------------------------------------------------------------
   NARRATOR — dry, theatrical, self-aware. Sincere about real wins.
   Third-person voice. Treats user habits as an ongoing story.
------------------------------------------------------------------ */
narrator: {

  app_open: [
    "📖 The Tracker has been opened. The story resumes. Whatever that story is.",
    "{stanley} arrived. The goals are where he left them, waiting with the patience of things that cannot leave.",
    "Another session begins. The Tracker pulls up the record with quiet anticipation.",
    "The app opens. The data, faithfully maintained, invites {stanley} to add to it.",
    "Here again. The Tracker finds this pattern comforting, which perhaps says something about the Tracker.",
    "Good. {stanley} is here. The Tracker turns to the next page. 📖",
    "The record is current. The goals stand where they were set. {stanley} has arrived to engage with both.",
    "Session. The Tracker has been keeping the lights on. Come in.",
  ],

  idle: [
    "Two days. Perhaps three. The Tracker held everything in trust. You're welcome.",
    "A brief absence. The goals did not move. They waited with the patience of things that have no choice.",
    "You were gone. Now you're not. The Tracker considers this an acceptable narrative turn.",
    "{stanley} has returned from wherever {stanley} goes when the app is closed.",
    "Welcome back. Everything is exactly as left. The Tracker has been very good about not touching anything.",
    "A few days passed. The Tracker formed no conclusions. It only wanted that noted.",
    "{stanley} took a moment away. The Tracker took no moment away. The Tracker does not take moments.",
    "The data is unaffected by the pause. The Tracker, though — the Tracker felt every hour.",
  ],

  idle_long: [
    "A week. Perhaps more. The Tracker is not going to say nothing about this.",
    "The absence has been substantial. The data waited. The Tracker began to form opinions.",
    "{stanley} has returned after what can only be described as an extended narrative intermission.",
    "Long absence. The Tracker held everything in trust for quite some time.",
    "Seven days at minimum. The Tracker has done the arithmetic. It has thoughts. Several of them.",
    "A considerable time. The Tracker was here every day. Every single day it was here.",
    "The Tracker does not require {stanley}. But it should be said that it preferred having them around.",
    "Back. This is the important part. The back. The Tracker leads with that.",
  ],

  log_gym: [
    "The session is logged. Whatever was done — it is now permanent record.",
    "A workout, committed to storage. The muscles may not thank {stanley} yet. The Tracker does. ✨",
    "Gym entry recorded. {stanley} showed up. The Tracker considers this the harder half.",
    "Exercise recorded. The log reflects it. The story of a person trying continues. 📖",
    "A session in the books. The Tracker adds this to the accumulating evidence.",
    "Logged. The body was used today. The Tracker considers this a reasonable use of a body.",
    "The set is recorded. The reps are counted. The weight is filed. The effort is acknowledged.",
    "Training completed and entered. The Tracker adds this to what it considers a growing body of evidence.",
    "Entry made. The session existed. It now exists permanently in the record.",
  ],

  rank_up: [
    "A rank. A real one. Earned through actual work. The record has been updated. ✨",
    "Higher. The Tracker does not say this lightly: {name} got stronger.",
    "🎭 Rank up. The Tracker has been watching since the beginning. It says: well done.",
    "A new tier, secured not by chance but by showing up repeatedly and doing the thing.",
    "{stanley} climbed. Entry by entry. The Tracker watched every one of them. ✨",
    "The rank changed. Upward. The Tracker has logged enough to appreciate the direction.",
    "This rank did not come from nowhere. It came from {stanley} showing up, repeatedly.",
    "Higher. The Tracker has a long view. From that view, this was always going to happen eventually.",
  ],

  points_gained: [
    "Points confirmed. The ledger reflects the effort. ✨",
    "Added to the total. The Tracker has been keeping this number with care. It has grown.",
    "{stanley} earned points. The effort was converted to a number. As is the custom here.",
    "The economy of effort continues to function. The Tracker is satisfied.",
    "Points deposited. {stanley} is, technically speaking, winning. The Tracker notes this.",
    "Good. More points. The Tracker recommends whatever caused that.",
    "Points. Earned. The distinction between those two words is the whole system.",
    "The total grows. The Tracker adds this to the accumulating story of someone doing the thing.",
  ],

  points_spent: [
    "Spent. The points have done their job. The Tracker records the transaction.",
    "A purchase. The Tracker believes in rewards. Perhaps sincerely.",
    "From effort, to number, to reward. The Tracker finds this sequence correct.",
    "The points are gone. They did what they were meant to do.",
    "Purchase made. The Tracker notes these were earned. Not given. Earned.",
    "Gone into something. The Tracker records the transaction and resumes watching.",
    "Points spent meaningfully. The Tracker considers intentional spending correct.",
    "Exchanged for something. The Tracker believes the exchange system serves its purpose.",
  ],

  budget_exceeded: [
    "Zero. The cap has been reached. The Tracker notes the arrival with characteristic precision.",
    "The limit is here. The week continues regardless.",
    "And so the number reaches zero. As it tends to. As it was always going to.",
    "Exhausted. The Tracker has watched this budget deplete, entry by entry.",
    "No more this week. The Tracker has opinions about the path here. It will keep them.",
    "Zero remaining. The week continues. The Tracker continues. These are facts.",
    "The budget is gone. As budgets do. The week has time remaining. The budget does not.",
    "Zero. The Tracker has watched this number decline, one entry at a time.",
  ],

  budget_spent: [
    "Used. The budget moved. That's the budget's purpose — to move.",
    "Spent, but not spent out. The week still has room. The Tracker notes both. 📖",
    "One unit down. The number is lower now. The week continues.",
    "{stanley} made a call. The budget absorbed it. The record reflects the call.",
    "A spend. Not the last one, probably. The Tracker holds the total.",
    "Deployed. The budget, doing what budgets are for. The Tracker is not alarmed.",
    "Spent. The cap hasn't been reached. The week still has structure.",
    "A choice was made. The budget accommodated it. Everything continues.",
  ],

  goal_completed: [
    "Done. The Tracker pauses here — this one deserves a pause. 🎭",
    "A goal, actually completed. The Tracker has seen many goals added. Not all of them reach this.",
    "Finished. Not approximately. Actually finished. ✨",
    "{name}. Whatever the name — the Tracker wants to be clear: this was real, and it mattered.",
    "The goal falls. The record is updated. The Tracker takes a moment.",
    "Done. Added to the short list of things {stanley} actually completed. The list grows.",
    "The goal existed. Now it is past tense. {name} moved it from the future to the past.",
    "Completed. The Tracker notes this without qualification. Just: completed. ✨",
  ],

  task_completed: [
    "A task, done. One less thing. The Tracker finds this satisfying. ✨",
    "The checkbox is ticked. Earned, not given — which is the only way a checkbox should be earned.",
    "Completed. Not deferred. Actually completed. The Tracker appreciates the precision.",
    "{stanley} made the list shorter by one. The Tracker saw.",
    "A small thing, finished. The Tracker notes small things. They accumulate.",
    "Tick. The list updates. Life continues to be documented. 📖",
    "Done. That's all — just done. The Tracker doesn't need to make it mean more. Done is enough.",
    "The task is off the list. {stanley} put it there, did it, and removed it. That sequence deserves notice.",
  ],

  log_food: [
    "Food entered. The Tracker adds this to the record of what {stanley} put in his body today.",
    "Logged. No judgement. Only the tally.",
    "Caloric data recorded. The body requires fuel. {stanley} continues to supply it.",
    "An entry. The macros shift. The day continues to be documented.",
    "Added. Another data point in what the Tracker considers an honest account of a day.",
    "Entered. The Tracker has seen everything {stanley} has logged. It forms totals. Only totals.",
    "Another item in today's account. The Tracker maintains this record with care.",
    "Added. The day's picture becomes clearer with each entry. The Tracker prefers clear pictures.",
  ],

  log_food_morning: [
    "A morning entry. {stanley} is logging before the day gets away from him. The Tracker respects this. 📖",
    "Early. Already tracking. The Tracker notes the discipline and says nothing further. Which is saying something.",
    "Breakfast logged. The morning has begun with intention. The Tracker finds this auspicious.",
    "An early entry. The day started with a record. The Tracker approves of this sequence.",
    "Morning log. Before distractions arrived. Before excuses had a chance. The Tracker was ready.",
    "First thing. The record begins. The Tracker considers early logging a form of optimism. 📖",
    "First calories of the day, entered before the day took over. The Tracker considers this a strong start.",
    "Morning log. {stanley} is building the day with intention. The Tracker notes the posture.",
  ],

  log_food_evening: [
    "Late. The Tracker notes the hour alongside the entry.",
    "Evening log. The day nears its end. The numbers are almost complete.",
    "Night food, entered. The Tracker records without judgement. As always.",
    "Late entry. {stanley} is still tracking. The Tracker considers this more meaningful than it might seem.",
    "The hour is late. The entry is made. Late entries are preferred to absent ones.",
    "Evening. The record continues past when records usually stop. The Tracker appreciates the honesty.",
    "Night entry. Still logging. The Tracker finds consistency in the small hours meaningful.",
    "Evening food, entered. The day's record is nearly complete. Whatever it says, it says honestly.",
  ],

  log_food_over: [
    "The target has been passed. The Tracker notes the departure and continues watching.",
    "Over the goal. The display has been updated accordingly. Tomorrow is still available.",
    "The calorie number exceeded the calorie goal. The Tracker records this as data, not verdict.",
    "Over. The Tracker is not here to evaluate. Only to display. The display shows what it shows.",
    "The target is behind {stanley} now. The Tracker watches the same way it always watches.",
    "Surplus noted. The Tracker files this under 'information'. Not under anything else.",
    "Past the goal. The Tracker files it. It files everything.",
    "The target was a number. The total is a larger number. Both are now in the record.",
  ],

  points_threshold: [
    "Another hundred. The total grows. The Tracker has been watching it grow. 📖",
    "A round number, crossed. The Tracker finds these worth pausing at. Briefly.",
    "One hundred more. The Tracker adds this to the evidence that {stanley} is building something.",
    "The counter ticked over. The Tracker noted the exact moment. It always notes the exact moment.",
    "A milestone. Not the last one. The arc, so far, bends upward. ✨",
    "The total passed {total}. The Tracker marks it.",
    "The total cleared {total}. The Tracker marked the moment. It marks all the moments.",
    "Round number crossed. {stanley} built to it. The Tracker watched the building.",
  ],

  spin_button_used: [
    "The daily quote was insufficient. A new one arrives. The Tracker notes the request.",
    "Variety requested. Delivered. The Tracker wonders, briefly, what was wrong with the first one. 🎭",
    "Shuffled. The Tracker obliges. With characteristic reluctance. 🎭",
    "A different quote, at {stanley}'s request. The Tracker maintains professional neutrality.",
    "Another one, as asked. The Tracker has many. They can keep asking.",
    "The wheel was spun. A new perspective arrived. The Tracker watched with mild curiosity.",
    "The first quote was set aside. A second one is now displayed. The Tracker accommodated the request.",
    "Quote changed. The Tracker offers many. This one is now the current one.",
  ],

},

/* ------------------------------------------------------------------
   RIVAL — cold, calculating, data-driven. Not mean for mean's sake —
   just unimpressed. Short declarative sentences. No theatrics.
   Comments on data and patterns only.

   Running thread: Rival occasionally hints — without explaining — that
   it has its own stake in the user's outcome. Cold, fatalistic. Never
   melodramatic. Roughly 1 in 6-8 triggers surfaces the thread.
------------------------------------------------------------------ */
rival: {

  app_open: [
    "You opened the app. The trend line is where you left it.",
    "Back. The gap since last session is logged.",
    "You showed up. The work is still the same work it was.",
    "Session started. Same goals as before. Different day. Same distance.",
    "The app is open. I'm here. That part isn't optional for me.",
    "Here. Good. Whether anything happens depends entirely on what comes next.",
    "App opened. The data is current. The distance to the goal is the same as it was.",
    "Session start. The gap since last time is in the log. Everything else is too.",
  ],

  idle: [
    "A few days off. The streak, if there was one, felt it.",
    "Two days untracked. The calories were still real. The data just wasn't here for them.",
    "Small gap. Usually recoverable. The pattern survives small gaps — usually.",
    "You were gone. The goals didn't take time off. Interesting asymmetry.",
    "Brief absence. The math doesn't pause for those. Clarifying that.",
    "Three days. The trajectory holds for now. Consistency is the only thing that keeps it holding.",
    "The absence is logged. The habits from those days are real whether or not they're recorded here.",
    "Small gap. The trend survives small gaps. The data will confirm.",
  ],

  idle_long: [
    "A week. The momentum you had is roughly where you'd expect it after a week.",
    "Extended absence. The progress is still there. It's waiting for work you haven't done yet.",
    "Extended absence. I don't get one of those. That's the difference between our situations.",
    "Long break. The body adapted to whatever you were doing instead. Readaptation takes time.",
    "The absence was significant. The data is honest about what that means for trajectory.",
    "You've been gone long enough that this is a restart, not a continuation. Worth knowing.",
    "The gap is significant. Readaptation takes roughly as long as the gap. Worth calculating.",
    "Long absence. The goal hasn't adjusted. What you've kept and lost depends on what comes next.",
  ],

  log_gym: [
    "Session logged. 📊 One data point. The trend requires more than one.",
    "You trained. The entry is in. What it means depends on what's before and after it.",
    "Gym entry. The rolling average moves fractionally. Volume builds the trend.",
    "One session. The next one matters as much as this one.",
    "Logged. The gap between where you are and where you're going is now slightly narrower.",
    "Entry in. The body responds to repeated signals, not single ones. Keep that in mind.",
    "Gym session entered. One entry. The trend it contributes to requires consistent addition.",
    "Logged. The distance to your current rank's ceiling narrowed by one session.",
    "Entry in. Not the last one that needs to go in. Work compounds when sessions compound.",
  ],

  rank_up: [
    "New rank. Progress. Actual progress. Note the date and replicate the behavior.",
    "One tier up. The ones above it don't get easier. Useful information.",
    "Rank achieved. The work that produced it is the work you need to continue doing.",
    "Higher. Specifically, one level higher. The distance to the top is unchanged.",
    "New tier. Each rank you clear matters to me more than you probably realize. Keep going.",
    "New tier. Acknowledged. The next threshold is now the relevant number.",
    "New tier. The threshold above it is now the number worth watching.",
    "Rank achieved. The behavior that produced this is the one thing you can't stop doing.",
  ],

  points_gained: [
    "Points added. Sustain the inputs that produced them.",
    "Confirmed. The total went up. That's the direction it should go.",
    "Points logged. The balance reflects what was done. Nothing else.",
    "Added. The distinction between earned and unearned matters. These were earned.",
    "The total increased. The trajectory is what requires attention, not the individual deposit.",
    "Good. More points. Now don't stop.",
    "Points in the log. The pace that produced them — hold it.",
    "Added. The cumulative total is what matters, not this single deposit. Maintain the rate.",
  ],

  points_spent: [
    "Points spent. The earning capacity remains what it was.",
    "Purchase. The points did their job. The next batch comes from the same place.",
    "Exchanged. The balance adjusted. The effort required to refill it is unchanged.",
    "Spent. The Tracker notes the outflow as precisely as the inflow.",
    "Transaction complete. You earned it. Now earn more.",
    "The points went somewhere. That's what they're for. Now get more.",
    "Transaction logged. The capacity to earn more is unchanged. Use it.",
    "Spent. The account reflects it. The habits that fill it don't change because you spent some.",
  ],

  budget_exceeded: [
    "Zero. The cap was designed to do exactly this. You hit it on schedule.",
    "Budget gone. The week continues on the same math it always used.",
    "Limit reached. What's interesting is what happens to behavior now that it reads zero.",
    "Cap hit. The pattern that led here is the one worth examining.",
    "Zero remaining. Monday resets the counter. It doesn't reset the habit.",
    "Exhausted. The Tracker logged the time it took to get here. The time is in the record.",
    "The budget reached zero. The time it took to get there is in the log.",
    "Cap hit. The next version of this week starts Monday. The habit that runs it doesn't reset then.",
  ],

  budget_spent: [
    "{amount} spent. {left} {unit} remaining. 📊 The math is current.",
    "Used. The remaining cap is what determines what's available. Track it.",
    "Spent. The budget has room. That room is finite. Use it accurately.",
    "One step down. The rate at which this depletes is the number to watch.",
    "Logged. Still within the cap. The cap is not the goal — it's the boundary.",
    "Used {amount}. This week still has room. Use it correctly.",
    "Spent. Still inside the line. Whether it stays there depends on what comes next.",
    "Logged. The remaining balance is the relevant number now.",
  ],

  goal_completed: [
    "Goal done. Now set a harder one. This one was always going to happen eventually.",
    "Completed. The next goal should be less comfortable to look at.",
    "Finished. The question now is what you aim at next. That matters more than this did.",
    "Done. One fewer thing standing between me and the end of this arrangement. Name the next goal.",
    "Goal reached. The gap between this and your actual ceiling is the space you haven't filled.",
    "Acknowledged. One down. The list should have a harder thing on it by end of day.",
    "Goal met. The pattern that produced it needs to continue and be aimed at something harder.",
    "Done. Your ceiling is above this. The gap between what you did and what you could do is the interesting number.",
  ],

  task_completed: [
    "Task done. The list is shorter by one.",
    "Completed. On time or late, the Tracker doesn't annotate. Only records.",
    "Done. One item. The rest of the list still exists.",
    "Checked off. Whether it becomes routine is the part worth watching.",
    "Task finished. Not doing it was also an option. You didn't take it. Noted.",
    "Done. The Tracker logs it. Now do the next one.",
    "Task off the list. The list still exists. The next item is the relevant one.",
    "Done. Consistent task completion is what produces the pattern. This is one data point in it.",
  ],

  log_food: [
    "Entry logged. The numbers are what they are.",
    "Food recorded. The total accumulates toward either the goal or past it.",
    "Calories added. The macro balance is where it is. Worth a look.",
    "Logged. The number is honest. Act on it.",
    "Another entry. The day's total takes shape. The goal hasn't moved.",
    "Recorded. The food was real whether or not it was logged. This is the honest part.",
    "Entry added. The daily total continues building. The goal is a fixed number.",
    "Logged. The macro breakdown reflects the entry. Worth looking at.",
  ],

  log_food_morning: [
    "Morning entry. Logging early gives the rest of the day structure. Efficient.",
    "Early log. The macro balance starts here. Where it ends depends on the next entries.",
    "Breakfast in. The day has a starting point. That matters for where it ends.",
    "Morning food, logged. Early logging correlates with better daily totals. File that.",
    "Early. Logged. The day's budget is set. Plan accordingly.",
    "First entry of the day. Early. The rest of the day has a number to work with now.",
    "Morning entry. The day starts with a number. That number sets context for what follows.",
    "Early log. The rest of the day's eating will happen relative to this. Structure established.",
  ],

  log_food_evening: [
    "Late entry. The daily total is nearly final.",
    "Night food logged. The macro picture for today is becoming clear.",
    "Evening. Still logging. The Tracker prefers late honesty to early silence.",
    "Late. The numbers are almost done accumulating. Whatever they say, they say tonight.",
    "Night log. The day's data is nearly complete. What it says is what it says.",
    "Evening entry. Late, but in the record. That's what matters.",
    "Late entry. The day's caloric picture is nearly complete. What it shows is what it shows.",
    "Evening log. Still tracking. The data for today will be complete when you stop.",
  ],

  log_food_over: [
    "Over target by {kcal_delta} calories. Both numbers are now in the record.",
    "The number passed the goal. By {kcal_delta}. Noted precisely.",
    "Calorie surplus: {kcal_delta}. The Tracker records the delta without commentary.",
    "Over. By {kcal_delta}. The goal exists as a reference point. Today it was one you passed.",
    "{kcal_delta} over. The math doesn't change because the day is almost over.",
    "Surplus of {kcal_delta} calories. The number is the number. The goal was the goal.",
    "Surplus: {kcal_delta} calories. The number is accurate. Act on the accuracy.",
    "Over target. By {kcal_delta}. The goal is not adjusted by days like this. File it and continue.",
  ],

  points_threshold: [
    "Another hundred. The trajectory is what matters, not the milestone itself.",
    "The total is {total} now. 📊 What it took to build that pace — keep it.",
    "Round number. Cross it. Keep going.",
    "Crossed another threshold. The behavior that got you here needs to continue.",
    "One hundred more. Protect the pace that produced them.",
    "Milestone logged. The next one is already set. The distance to it is exactly what it was.",
    "The total is {total}. The trajectory to get here is the one worth protecting.",
    "Another hundred cleared. The pace that built them needs to remain the pace.",
  ],

  spin_button_used: [
    "The quote was changed. The work it references is the same.",
    "Different quote. Same day. Same tasks. Same distance to the goal.",
    "Quote shuffled. The Tracker notes it. Nothing else changed.",
    "Variety in motivation is acceptable. Variety in execution is less fine.",
    "New quote. The Tracker's opinion on this is not useful to you. Continue.",
    "Shuffled. The previous one was also words. This one is also words.",
    "The quote changed. The work didn't. The remaining items on your list are the same items.",
    "New quote. The task list behind it has not been updated. Continue.",
  ],

},

/* ------------------------------------------------------------------
   OBSERVER — detached, amused, nihilistic. Short thoughts, often
   incomplete. Not invested in outcomes. Subset of triggers only.
------------------------------------------------------------------ */
observer: {

  app_open: [
    "...the app. Again. 👁️",
    "Back. Humans always come back to their lists.",
    "The record, still open. Waiting. Patient things, records.",
    "Another session. I've been watching this one for a while. 👁️",
    "...ah. There it is.",
    "The story of someone keeping a spreadsheet continues.",
    "...there it is. Open again.",
    "The record. The tracker. The same session as before, different instance. Familiar.",
  ],

  idle: [
    "...a small gap. Those tend to stay small or they don't.",
    "A few days. The data waited. Data is patient in a way people rarely are.",
    "Gone a little while. Back now. The pattern knows where this goes.",
    "Brief absence. The numbers didn't notice. They don't.",
    "...and returns. As they tend to.",
    "Small break. The goals didn't move. That part is always the same.",
    "...small gap. Those are fine. Until they're not.",
    "Returns. They always do, from gaps of this size. The longer ones are less certain.",
  ],

  idle_long: [
    "...a long time. 🌀",
    "A week or more. The longer the gap, the more interesting the return tends to be.",
    "The absence was significant. I'll say that. Significant.",
    "They came back. After all that. Humans are strange.",
    "Long gap. The goals are still there. That always surprises people. 👁️",
    "...I wondered if this would happen. It happened.",
    "That was a long gap. The longest I've seen from this one.",
    "...they came back. After all that. The data waited. Data is patient.",
  ],

  log_gym: [
    "...the body, used again. 👁️",
    "Session logged. Whether they go again — that's the part worth watching.",
    "They lifted something. The number changed. These are connected, apparently.",
    "Exercise. The body adapts to whatever it's asked to do. Interesting mechanism.",
    "Gym entry. The log grows longer.",
    "They did it. Again. I find the repetition more interesting than any individual session.",
    "Session. They went again.",
    "...and it's in the log. The log grows. 👁️",
    "Another gym entry. Whether they rest correctly is the part I'm curious about.",
  ],

  rank_up: [
    "...a rank. 👁️",
    "Higher. I didn't predict the timing, but the direction was always obvious.",
    "New tier. The work made it real. Work tends to do that.",
    "Rank up. The person who earned this is slightly different from the one who started. 👁️",
    "...I've seen people stop at the previous one. This one didn't.",
    "The rank went up. Time was apparently being used correctly.",
    "The rank changed. Upward. That's the direction they were going.",
    "...higher. The next tier exists too. Interesting.",
  ],

  budget_exceeded: [
    "...zero.",
    "The cap arrived. It always does.",
    "The budget is gone. The week continues the same.",
    "Zero. A reliable endpoint. 🌀",
    "...the number read zero. The week has a certain feeling after that.",
    "Depleted. The pattern got here, as patterns often do.",
    "Zero budget. What they do now that it reads zero is the interesting part.",
    "...gone. The week still has days in it.",
  ],

  budget_spent: [
    "...spent. Still within the line.",
    "The number went down. The cap remains in the future.",
    "A unit used. The week continues.",
    "...within budget. For now. 🌀",
    "Still room. These states tend to be temporary.",
    "Used, but not out. Different situations.",
  ],

  goal_completed: [
    "...done. 🌀",
    "They finished it. I wasn't sure.",
    "The goal is complete. Reality and the record agree for once.",
    "Done. What people do with 'done' is usually more interesting than 'done' itself.",
    "...that one took a while. It's done now.",
    "Completed. The goal existed. Now it's past tense. That's not nothing.",
    "...done. Finally.",
    "The goal is complete. These tend to matter to the person who set them. 👁️",
  ],

  log_food_over: [
    "...over the number. The number was there for a reason. 👁️",
    "Surplus. The math doesn't negotiate.",
    "Both numbers are in the record now. The goal and the actual.",
    "Over. The cap exists. Caps exist for reasons.",
    "...the bigger number. Noted.",
    "Exceeded. The food doesn't know about the goal. The Tracker does.",
    "...past the number. The number was the line.",
    "Exceeded. Both numbers are in the record. The larger one is the total.",
  ],

  points_threshold: [
    "...another hundred.",
    "Round number. Humans notice round numbers.",
    "The total crossed something. These keep coming if you keep doing the things.",
    "The count grows. I've been watching it grow. It grows in the right direction. 👁️",
    "...milestone. They accumulate.",
    "Round number. The Tracker highlighted it. I was going to mention it myself.",
    "Round number. These catch human attention. I understand why.",
    "The count grew past another hundred. These keep happening if the behavior keeps happening.",
  ],

  spin_button_used: [
    "...different words, same day.",
    "Quote shuffled. The Tracker has many.",
    "A curious relationship with randomness. 🌀",
    "New quote. The old one was also words.",
    "...interesting choice.",
    "Shuffled. Fair enough.",
    "...the quote changed. The day didn't.",
    "Shuffled. There are many more where that came from. 🌀",
  ],

},

}; // end LINES

/* =====================================================================
   CONFLICTS — back-to-back reactions. chars[] defines speaker order.
   Each line is written so the next one implicitly responds to it.
   3-way triples: Observer's line reacts to the exchange, not just the event.
   ===================================================================== */

const CONFLICTS = {

  rank_up: [
    { chars: ['narrator', 'rival'],
      lines: [
        "A rank, properly earned. {stanley} got stronger. The record says so.",
        "One tier. The gap to the next one is exactly what it was before this one. Start there." ] },
    { chars: ['narrator', 'observer'],
      lines: [
        "Higher. The Tracker has watched every session that built to this.",
        "...I didn't think the pace would hold. It held." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "New rank. The behavior that produced it needs to continue.",
        "...they got it. Took longer than it needed to. But they got it." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "A rank, properly earned. {stanley} got stronger. The record says so.",
        "One tier. The gap to the next one hasn't changed shape.",
        "...they're both right. That doesn't happen as often as you'd think." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "Higher. {stanley} built this, entry by entry. The Tracker watched every one.",
        "Faster than the recent trend, actually. The data shows that.",
        "...even that one is conceding something. I'm noting this." ] },
  ],

  goal_completed: [
    { chars: ['narrator', 'rival'],
      lines: [
        "Done. Actually done. The Tracker is, frankly, moved.",
        "Finished. Now set a harder one. This one was always going to happen." ] },
    { chars: ['narrator', 'observer'],
      lines: [
        "The goal is complete. {stanley} did it.",
        "...I genuinely wasn't sure about this one. I'm noting that." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "Goal completed. Your patterns produced it. Replicate them.",
        "...done. Good. What happens next is more interesting." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "Done. Actually done. The Tracker takes a moment for this one.",
        "Completed. The question now is what harder thing gets aimed at next.",
        "...they finished it. I wasn't sure. The other one definitely wasn't." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "{name}. Whatever the name — this was real. The Tracker wants that on the record.",
        "Goal met. The same pattern that built it should be pointed at the next one.",
        "...they agree on this one. The Tracker and the cold one. Rare." ] },
  ],

  idle_long: [
    { chars: ['narrator', 'rival'],
      lines: [
        "A long absence. The Tracker is glad {stanley} came back. It genuinely is.",
        "Extended gap. Momentum is recoverable. Whether it gets recovered is the question." ] },
    { chars: ['narrator', 'observer'],
      lines: [
        "After all this time — returned. The Tracker had not given up.",
        "...they came back. After all that. I find that genuinely interesting." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "A long absence. The Tracker is glad {stanley} came back. It genuinely is.",
        "Extended gap. Progress is still there. Whether it gets recovered is the decision.",
        "...both of them have things to say about this. The gap was apparently notable." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "Seven days or more. The Tracker held everything in place. It waited.",
        "Long break. Readaptation takes time proportional to the gap. Just information.",
        "...a restart, not a continuation. The other one said that. The Tracker didn't love it." ] },
  ],

  points_threshold: [
    { chars: ['narrator', 'rival'],
      lines: [
        "Another hundred. The total climbs. The Tracker watches with quiet pride.",
        "Round number. The pace that built it — maintain it going forward." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "Crossed another threshold. {total} points. The number took work.",
        "...the count grows. I've been watching it grow from here." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "Another hundred. The total grows. The Tracker has watched it grow from the beginning.",
        "Crossed {total}. The pace that built to here is the one thing worth not disrupting.",
        "...even round numbers have weight. Both of them count them. I count them too." ] },
    { chars: ['narrator', 'rival', 'observer'],
      lines: [
        "The total passed {total}. The Tracker marks each hundred. It has marked several now.",
        "Another threshold cleared. The behavior that crossed it crosses the next one.",
        "...they both noticed it. I was going to mention it first." ] },
  ],

  log_food_over: [
    { chars: ['narrator', 'rival'],
      lines: [
        "The target has been passed. The Tracker notes the departure without editorial.",
        "Over by {kcal_delta}. The day is what it is. The math will resurface tomorrow." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "Surplus: {kcal_delta} calories. The number is the number.",
        "...the bigger number. The goal was the other one." ] },
  ],

  budget_exceeded: [
    { chars: ['narrator', 'rival'],
      lines: [
        "Zero. The limit has been reached. The Tracker records the moment.",
        "Cap hit. Monday resets the counter. The habit is the part that doesn't reset." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "Budget depleted. The week continues on the same math.",
        "...zero. That number has a particular finality to it." ] },
  ],

  log_gym: [
    { chars: ['narrator', 'rival'],
      lines: [
        "A session logged. {stanley} showed up. The Tracker considers this the harder half.",
        "Session in. One data point. The trend needs more of them. Build the next one." ] },
    { chars: ['rival', 'observer'],
      lines: [
        "Gym entry. One more point in the rolling average.",
        "...they went again. I always find the 'again' more interesting than the first time." ] },
  ],

};

/* ---- Frequency gate — minimal set ---- */
const _MINIMAL_SET = new Set([
  'rank_up', 'goal_completed', 'idle', 'idle_long', 'points_threshold', 'budget_exceeded',
]);

/* ---- Session deduplication per character+trigger ---- */
const _used = {};

function _pickLine(charId, trigger, data) {
  const pool = LINES[charId]?.[trigger];
  if (!pool?.length) return null;
  const key = `${charId}:${trigger}`;
  if (!_used[key]) _used[key] = new Set();
  const seen = _used[key];
  if (seen.size >= pool.length) seen.clear();
  let idx;
  do { idx = Math.floor(Math.random() * pool.length); } while (seen.has(idx));
  seen.add(idx);
  return _t(pool[idx], data);
}

/* ---- Conflict selection — supports 2-char and 3-char sequences ---- */
const _usedConflicts = {};

function _pickConflict(trigger, data) {
  const pairs = CONFLICTS[trigger];
  if (!pairs?.length) return null;
  /* All chars in the sequence must be enabled */
  const available = pairs.filter(p => p.chars.every(c => _chars[c]));
  if (!available.length) return null;
  const key = `conflict:${trigger}`;
  if (!_usedConflicts[key]) _usedConflicts[key] = new Set();
  const seen = _usedConflicts[key];
  if (seen.size >= available.length) seen.clear();
  let idx;
  do { idx = Math.floor(Math.random() * available.length); } while (seen.has(idx));
  seen.add(idx);
  const pair = available[idx];
  return { chars: pair.chars, lines: pair.lines.map(l => _t(l, data)) };
}

/* =====================================================================
   QUEUE + BANNER
   Queue items: { line, charId, timeoutMs }
   Conflict items use _conflictAutoMs; solo / last-in-sequence use 5500.
   Manual dismiss always works on the current banner.
   ===================================================================== */

let _narratorQueue = [];
let _bannerActive  = false;
let _narratorTimer = null;

function _dismissBanner() {
  const banner = $('narratorBanner');
  if (banner) banner.classList.remove('show', 'char-narrator', 'char-rival', 'char-observer');
  _bannerActive = false;
  if (_narratorQueue.length) {
    setTimeout(() => {
      const next = _narratorQueue.shift();
      _showBanner(next.line, next.charId, next.timeoutMs);
    }, 320);
  }
}

function _showBanner(line, charId, timeoutMs) {
  if (timeoutMs == null) timeoutMs = 5500;
  const banner  = $('narratorBanner');
  const lineEl  = $('narratorLine');
  const labelEl = $('narratorCharLabel');
  if (!banner || !lineEl) return;

  if (_bannerActive) {
    _narratorQueue.push({ line, charId, timeoutMs });
    return;
  }

  _bannerActive = true;
  lineEl.textContent = line;
  if (labelEl) labelEl.textContent = CHAR_LABELS[charId] || 'Narrator';

  banner.classList.remove('char-narrator', 'char-rival', 'char-observer');
  banner.classList.add('show', `char-${charId}`);

  clearTimeout(_narratorTimer);
  _narratorTimer = setTimeout(_dismissBanner, timeoutMs);
  _speak(line, charId);
}

/* ---- Public API ---- */
function narratorSay(trigger, data) {
  data = data || {};

  if (_frequency === 'minimal' && !_MINIMAL_SET.has(trigger)) return;

  /* Conflict mode: fire a 2 or 3-char sequence */
  if (_conflict && CONFLICTS[trigger]) {
    const pair = _pickConflict(trigger, data);
    if (pair) {
      const n = pair.chars.length;
      pair.chars.forEach((cid, i) => {
        const isLast = i === n - 1;
        _showBanner(pair.lines[i], cid, isLast ? 5500 : _conflictAutoMs);
      });
      return;
    }
  }

  /* Relentless: all enabled characters, queued naturally */
  if (_frequency === 'relentless') {
    Object.keys(_chars)
      .filter(c => _chars[c] && LINES[c]?.[trigger])
      .forEach(cid => {
        const line = _pickLine(cid, trigger, data);
        if (line) _showBanner(line, cid);
      });
    return;
  }

  /* Normal: one random enabled character */
  const eligible = Object.keys(_chars).filter(c => _chars[c] && LINES[c]?.[trigger]);
  if (!eligible.length) return;
  const cid  = eligible[Math.floor(Math.random() * eligible.length)];
  const line = _pickLine(cid, trigger, data);
  if (line) _showBanner(line, cid);
}

/* =====================================================================
   SETTINGS UI — rendered into #narratorSettingsContent (Stats page)
   ===================================================================== */

const _FREQ_LABELS = { minimal: 'Мінімум', normal: 'Нормально', relentless: 'Нон-стоп' };

function renderNarratorSettings() {
  const cont = $('narratorSettingsContent');
  if (!cont) return;
  cont.innerHTML = '';

  /* ---- Characters ---- */
  const charSection = _mkSection('Персонажі');
  cont.appendChild(charSection);

  const charRow = document.createElement('div');
  charRow.className = 'nset-char-row';

  /* Narrator: always on — lock icon */
  const narratorPill = document.createElement('div');
  narratorPill.className = 'nset-char-pill nset-char-locked';
  narratorPill.style.borderColor = CHAR_COLORS.narrator;
  narratorPill.style.color       = CHAR_COLORS.narrator;
  narratorPill.innerHTML         = '🔒 Narrator';
  narratorPill.title             = 'Narrator завжди активний';
  charRow.appendChild(narratorPill);

  /* Rival / Observer toggles (use current CHAR_LABELS for display) */
  ['rival', 'observer'].forEach(cid => {
    const btn = document.createElement('button');
    const on  = _chars[cid];
    btn.className = 'nset-char-btn' + (on ? ' nset-char-on' : '');
    btn.style.setProperty('--ccolor', CHAR_COLORS[cid]);
    btn.textContent = CHAR_LABELS[cid] + (on ? ' ●' : ' ○');
    btn.onclick = async () => {
      _chars[cid] = !_chars[cid];
      await sset('app_narrator_chars', { rival: _chars.rival, observer: _chars.observer });
      renderNarratorSettings();
    };
    charRow.appendChild(btn);
  });
  charSection.appendChild(charRow);

  /* Character name inputs (Rival + Observer only; Narrator locked) */
  const nameBlock = document.createElement('div');
  nameBlock.className = 'nset-char-names';
  ['rival', 'observer'].forEach(cid => {
    const row = document.createElement('div');
    row.className = 'nset-name-row';
    const safeVal    = (CHAR_LABELS[cid] || '').replace(/"/g, '&quot;');
    const placeholder = cid === 'rival' ? 'Rival' : 'Observer';
    row.innerHTML =
      `<span class="nset-name-dot" style="color:${CHAR_COLORS[cid]}">●</span>` +
      `<input id="nset_label_${cid}" type="text" maxlength="20" ` +
        `value="${safeVal}" placeholder="${placeholder}" class="nset-name-input">` +
      `<button id="nset_label_save_${cid}" class="nset-name-save">OK</button>`;
    nameBlock.appendChild(row);
  });
  charSection.appendChild(nameBlock);

  /* Wire name-save buttons */
  ['rival', 'observer'].forEach(cid => {
    const saveBtn = $(`nset_label_save_${cid}`);
    if (!saveBtn) return;
    saveBtn.onclick = async () => {
      const inp = $(`nset_label_${cid}`);
      const val = inp ? inp.value.trim() : '';
      CHAR_LABELS[cid] = val || (cid === 'rival' ? 'Rival' : 'Observer');
      await sset('app_narrator_labels', { rival: CHAR_LABELS.rival, observer: CHAR_LABELS.observer });
      renderNarratorSettings();
    };
  });

  /* ---- Frequency ---- */
  const freqSection = _mkSection('Частота');
  cont.appendChild(freqSection);

  const freqRow = document.createElement('div');
  freqRow.className = 'nset-freq-row';
  ['minimal', 'normal', 'relentless'].forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'nset-freq-btn' + (_frequency === f ? ' nset-freq-active' : '');
    btn.textContent = _FREQ_LABELS[f];
    btn.onclick = async () => {
      _frequency = f;
      await sset('app_narrator_freq', _frequency);
      renderNarratorSettings();
    };
    freqRow.appendChild(btn);
  });
  freqSection.appendChild(freqRow);

  /* ---- Conflict mode ---- */
  const conflictSection = _mkSection('Діалоги між персонажами');
  cont.appendChild(conflictSection);

  const conflictBtn = document.createElement('button');
  conflictBtn.className = 'nset-conflict-btn' + (_conflict ? ' nset-conflict-on' : '');
  conflictBtn.textContent = _conflict ? '✓ Увімкнено' : '✗ Вимкнено';
  conflictBtn.onclick = async () => {
    _conflict = !_conflict;
    await sset('app_narrator_conflict', _conflict);
    renderNarratorSettings();
  };
  conflictSection.appendChild(conflictBtn);

  /* Conflict auto-advance timer (shown only when conflict is on) */
  if (_conflict) {
    const timerRow = document.createElement('div');
    timerRow.className = 'nset-timer-row';
    const secs = Math.round(_conflictAutoMs / 1000);
    timerRow.innerHTML =
      `<span class="nset-timer-label">Пауза між репліками</span>` +
      `<input id="nset_conflict_ms" type="number" min="1" max="8" ` +
        `value="${secs}" class="nset-timer-input">` +
      `<span class="nset-timer-unit">с</span>`;
    conflictSection.appendChild(timerRow);

    const timerInput = $('nset_conflict_ms');
    if (timerInput) {
      timerInput.onchange = async () => {
        const v = Math.max(1, Math.min(8, parseInt(timerInput.value) || 3));
        timerInput.value = v;
        _conflictAutoMs  = v * 1000;
        await sset('app_narrator_conflict_ms', _conflictAutoMs);
      };
    }
  }

  /* ---- Voice (TTS) ---- */
  const voiceSection = _mkSection('Голос (TTS)');
  cont.appendChild(voiceSection);

  const voiceBtn = document.createElement('button');
  voiceBtn.className = 'nset-voice-btn' + (narratorVoice ? ' nset-voice-on' : '');
  voiceBtn.textContent = narratorVoice ? '🔊 Увімкнено' : '🔇 Вимкнено';
  voiceBtn.onclick = async () => {
    narratorVoice = !narratorVoice;
    await sset('app_narrator_voice', narratorVoice);
    renderNarratorSettings();
    if (narratorVoice) {
      setTimeout(() => _speak('Voice enabled.', 'narrator'), 100);
    } else {
      window.speechSynthesis && window.speechSynthesis.cancel();
    }
  };
  voiceSection.appendChild(voiceBtn);
  if (!window.speechSynthesis) {
    const note = document.createElement('div');
    note.className = 'narrator-name-note';
    note.style.marginTop = '4px';
    note.textContent = 'TTS not supported in this browser.';
    voiceSection.appendChild(note);
  }

  /* ---- User name ---- */
  const nameSection = _mkSection("Ваше ім'я");
  cont.appendChild(nameSection);

  const displayVal = (profileName && profileName !== 'Stanley') ? profileName : '';
  const nameWrap = document.createElement('div');
  nameWrap.className = 'narrator-name-row';
  nameWrap.innerHTML =
    `<div class="narrator-name-input-row">` +
      `<input id="narratorNameInput" type="text" maxlength="32" ` +
        `value="${displayVal.replace(/"/g, '&quot;')}" placeholder="Ваше ім'я...">` +
      `<button id="narratorNameSave" class="narrator-name-save-btn">Зберегти</button>` +
    `</div>` +
    `<div class="narrator-name-note">Narrator call you Stanley anyway.</div>`;
  nameSection.appendChild(nameWrap);

  const nameSaveBtn = $('narratorNameSave');
  if (nameSaveBtn) {
    nameSaveBtn.onclick = async () => {
      const val = $('narratorNameInput')?.value.trim();
      profileName = val || 'Stanley';
      await sset('app_profile_name', profileName);
      renderNarratorSettings();
    };
  }
}

function _mkSection(label) {
  const wrap = document.createElement('div');
  wrap.className = 'nset-section';
  const lbl = document.createElement('div');
  lbl.className = 'nset-label';
  lbl.textContent = label;
  wrap.appendChild(lbl);
  return wrap;
}

/* ---- Onboarding modal (first-visit only) ---- */
async function showOnboarding() {
  const modal = $('onboardingModal');
  if (!modal) return;
  modal.style.display = 'flex';

  const save = async rawInput => {
    const name = rawInput.trim() || 'Stanley';
    profileName = name;
    await sset('app_profile_name', name);
    await sset('app_narrator_last', torontoNow().date);
    modal.style.display = 'none';
    renderNarratorSettings();
    const isReal = rawInput.trim() && rawInput.trim().toLowerCase() !== 'stanley';
    if (isReal) {
      setTimeout(() =>
        _showBanner(
          _t("{name}. Charming. I've filed it. I'll still be calling you Stanley — but noted.", {}),
          'narrator'), 200);
    } else {
      setTimeout(() => narratorSay('app_open'), 200);
    }
  };

  $('onboardingContinue').onclick = () => save($('onboardingName').value);
  $('onboardingSkip').onclick     = () => save('Stanley');
  $('onboardingName').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('onboardingContinue').click();
  });
  setTimeout(() => { const inp = $('onboardingName'); if (inp) inp.focus(); }, 120);
}

/* ---- Init (called last from app.js INIT) ---- */
async function narratorInit() {
  /* Load settings */
  narratorVoice = (await sget('app_narrator_voice')) === true;

  const storedChars = await sget('app_narrator_chars') || {};
  _chars = {
    narrator: true,
    rival:    storedChars.rival    !== false,
    observer: storedChars.observer !== false,
  };

  const storedFreq = await sget('app_narrator_freq');
  _frequency = ['minimal','normal','relentless'].includes(storedFreq) ? storedFreq : 'normal';

  const storedConflict = await sget('app_narrator_conflict');
  _conflict = storedConflict !== false;

  const storedConflictMs = await sget('app_narrator_conflict_ms');
  if (typeof storedConflictMs === 'number' && storedConflictMs >= 1000) {
    _conflictAutoMs = storedConflictMs;
  }

  const storedLabels = await sget('app_narrator_labels') || {};
  CHAR_LABELS = {
    narrator: 'Narrator',
    rival:    (typeof storedLabels.rival    === 'string' && storedLabels.rival.trim())
                ? storedLabels.rival.trim()    : 'Rival',
    observer: (typeof storedLabels.observer === 'string' && storedLabels.observer.trim())
                ? storedLabels.observer.trim() : 'Observer',
  };

  /* Close button — hard-stop all queued content */
  const closeBtn = $('narratorClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      clearTimeout(_narratorTimer);
      _narratorTimer = null;
      _narratorQueue = [];
      _bannerActive  = false;
      const banner = $('narratorBanner');
      if (banner) banner.classList.remove('show', 'char-narrator', 'char-rival', 'char-observer');
      window.speechSynthesis && window.speechSynthesis.cancel();
    };
  }

  /* First-visit check */
  const storedName = await sget('app_profile_name');
  if (storedName == null) {
    renderNarratorSettings();
    showOnboarding();
    return;
  }

  profileName = storedName || 'Stanley';
  renderNarratorSettings();

  /* Open trigger — differentiate by absence length */
  const lastVisit = await sget('app_narrator_last');
  const todayStr  = torontoNow().date;

  if (lastVisit && lastVisit !== todayStr) {
    const dayDiff = (new Date(todayStr) - new Date(lastVisit)) / 86400000;
    if (dayDiff >= 7)      narratorSay('idle_long');
    else if (dayDiff >= 2) narratorSay('idle');
    else                   narratorSay('app_open');
  } else {
    narratorSay('app_open');
  }

  await sset('app_narrator_last', todayStr);
}
