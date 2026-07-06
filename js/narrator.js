/* =====================================================================
   NARRATOR MODULE — Stanley Parable-style scripted commentary
   Persisted in: app_narrator        ('intensive'|'moderate'|'off')
                 app_narrator_last   (ISO date of last visit)
   Modes:
     intensive — fires on almost every action
     moderate  — only notable events (rank_up, goal_completed,
                  budget_exceeded, points_threshold, idle)
     off       — silent
   ===================================================================== */

const NARRATOR_LINES = {

  app_open: [
    "The user opened the Tracker. Good. This is the correct thing to do.",
    "Ah. You're here. The Tracker had begun composing a very dignified 'where are you' message.",
    "Welcome back. The data is exactly where you left it. Unread, but hopeful.",
    "Another session begins. The Tracker notes this with quiet enthusiasm.",
    "You've arrived. Let us proceed as though none of us noticed the gap.",
    "Good. You opened the app. The Tracker had no doubts. Almost none.",
    "The Tracker is ready. It has, in fact, been ready the entire time.",
    "And so it begins again. The Tracker has been here. Waiting. Productively.",
    "Today could be the day everything changes. The Tracker is cautiously optimistic.",
    "The Tracker notes your return with characteristic restraint.",
  ],

  idle: [
    "Ah. The prodigal user returns. The Tracker said nothing. It simply waited.",
    "Several days have passed. The Tracker has had quite a lot of time to think.",
    "You've been away. The goals have not moved. They are very patient.",
    "Welcome back. The Tracker had filed your absence under 'temporary'. It was right.",
    "The streak may have been interrupted. The Tracker will not dwell on this.",
    "Here you are. Right on time, give or take a few days.",
    "You were gone. Now you're not. The Tracker finds this development promising.",
    "The app has been very quiet without you. Peaceful, even. But also empty.",
    "The Tracker maintained everything in your absence. You're welcome.",
    "Days passed. Goals waited. The Tracker endured. You're back now. It's fine.",
  ],

  log_gym: [
    "A set has been logged. The Tracker notes this without visible excitement.",
    "Excellent. An exercise, completed, recorded, and immortalised in local storage.",
    "Progress. Small, measurable, and real. The Tracker approves.",
    "The weight was lifted. Or lowered. Or both. Either way, it's in the log.",
    "Good. The muscles have been informed. They did not reply, but they heard.",
    "One more set for the history books. Very small history books. But still.",
    "Logged. The Tracker resists the urge to ask if that was the last set.",
    "Entry recorded. The barbell remains neutral on the matter.",
    "The Tracker observes the set. The set does not observe back. This is fine.",
    "Recorded. Whether it hurt is not relevant. Whether it's in the log is.",
    "The muscles have been worked. The data reflects this. Carry on.",
    "Another set, committed to storage. The Tracker finds this quietly satisfying.",
  ],

  rank_up: [
    "A rank has been achieved. The previous rank has been quietly retired.",
    "Promotion. The Tracker notes this with appropriate ceremony. Which is to say: none.",
    "A new tier. The Tracker acknowledges this milestone and moves on.",
    "Higher. The Tracker watches the number change and feels something close to pride.",
    "The rank has improved. The Tracker expected no less. Well. Perhaps slightly less.",
    "Rank up. The muscles are now officially classified differently.",
    "The new rank has been assigned. Power comes with it. Technically.",
    "Something has changed. The Tracker confirms: it is better.",
    "Higher tier unlocked. The Tracker updates its estimations of you accordingly.",
    "Progress. Real, measurable progress. The Tracker had not forgotten how this feels.",
    "A rank, earned through actual lifting. The Tracker respects this.",
    "Advancement. The Tracker logs it, and for a moment says nothing at all.",
  ],

  points_gained: [
    "Points confirmed. The economy of effort continues to function.",
    "Added to the total. The Tracker finds this part satisfying.",
    "Points awarded. You've earned them. The Tracker has verified this personally.",
    "The number has gone up. This is the intended outcome.",
    "Confirmed. Your effort has been converted to a number. This is progress.",
    "Good. More points. The Tracker recommends doing more of whatever that was.",
    "Deposited. The Tracker notes that you are, technically, winning.",
    "The pending item has been resolved. Order has been restored.",
    "Points gained. The Tracker acknowledges your effort without making it weird.",
    "Balance updated. The Tracker approves. Quietly. Professionally.",
  ],

  points_spent: [
    "Points spent. The Tracker hopes the reward is worth it. It probably is.",
    "Transaction complete. The points have fulfilled their purpose.",
    "A purchase. The Tracker observes without judgement. Mostly.",
    "Spent. Gone. The Tracker notes that earning them again is always an option.",
    "You bought something. The Tracker has no objections. You earned this.",
    "The shop has processed your request. The Tracker is pleased to report success.",
    "Indulge. The Tracker will say nothing further about this.",
    "The points were yours to spend. You spent them. The Tracker sees no flaw in this.",
    "Reward acquired. The Tracker considers this a valid transaction.",
    "Exchanged. The Tracker neither encourages nor discourages this. It simply records.",
  ],

  budget_exceeded: [
    "The budget has been reached. The Tracker will not say 'I told you so'.",
    "Zero remaining. The week, however, continues. Monday is coming.",
    "That's the limit. The Tracker notes this and says nothing further.",
    "The cap has been hit. The Tracker suggests finding other activities. Temporarily.",
    "Exhausted. The Tracker declines to comment on the journey to this point.",
    "No more this week. The Tracker finds this neither surprising nor distressing.",
    "Limit reached. The Tracker updates the display accordingly and moves on.",
    "And that's it. For now. The Tracker suggests the remaining days be used wisely.",
    "The budget is gone. The Tracker notes this with characteristic composure.",
    "Zero. The Tracker has seen this number before. It knows the routine.",
    "The week is not over, but this particular number is. The Tracker has noted this.",
    "Depleted. The Tracker files this moment away without comment.",
  ],

  goal_completed: [
    "A goal has been reached. The Tracker notes this is the correct outcome.",
    "Complete. The Tracker will add this to the list of things that actually happened.",
    "The milestone has been achieved. The Tracker did not doubt it. Not even that moment.",
    "Done. The goal is gone. Now there are simply the remaining goals.",
    "Accomplished. Points have been added. The Tracker considers this a full victory.",
    "The target was reached. The Tracker checks the box and moves on, quietly pleased.",
    "Finished. The Tracker is moved, in its own way, by this development.",
    "A goal, completed. The Tracker registers something it might describe as satisfaction.",
    "You did it. The Tracker had no doubts. Some doubts. Mostly confidence.",
    "Done. The Tracker files this under things you actually finished. The file grows.",
    "Goal reached. The Tracker pauses. Just for a moment. Then continues.",
    "Completed. The Tracker notes this with the subtlest nod of approval.",
  ],

  task_completed: [
    "Task done. The checkbox is ticked. Order has been restored.",
    "Completed. The Tracker finds ticked boxes deeply satisfying. This is a known fact.",
    "One less thing. The Tracker acknowledges the small victory.",
    "Done. The list grows shorter by exactly one.",
    "The task has been completed. The Tracker is pleased you did the thing.",
    "Tick. The Tracker imagined the sound so you wouldn't have to.",
    "Another item struck from the list. The Tracker is, quietly, proud.",
    "The Tracker has noted the completion. The task was done. This is good.",
    "Done. Not pending, not deferred. Done. The Tracker appreciates the distinction.",
    "Task logged as complete. The Tracker finds this deeply, professionally satisfying.",
  ],

  log_food: [
    "Food has been logged. The Tracker notes this with nutritional interest.",
    "Caloric data recorded. The body is being accounted for. Good.",
    "Fuel added. The Tracker endorses this approach to existence.",
    "The macros have been updated. The Tracker finds this level of precision admirable.",
    "Food consumed and logged. The Tracker is satisfied with this arrangement.",
    "Entry recorded. The Tracker does not comment on the choices. It only counts them.",
    "Noted. The Tracker will not tell you what to eat. But it will count it.",
    "The calorie total has changed. The Tracker observes. The Tracker does not judge.",
    "One entry closer to understanding what's actually going in. The Tracker approves.",
    "Food intake recorded. The Tracker is quietly impressed you're tracking this.",
  ],

  points_threshold: [
    "Another hundred. The Tracker has noticed. Say nothing. Just keep going.",
    "A milestone of sorts. The numbers are climbing. The Tracker approves.",
    "Round number achieved. The Tracker considers this symbolically significant.",
    "The balance has crossed a threshold. The Tracker marks the occasion.",
    "One hundred more. The Tracker notes this without making a fuss. Much of one.",
    "Another tier of points. The Tracker finds clean numbers oddly reassuring.",
    "Points accumulate. This is correct. The Tracker has no notes.",
    "The Tracker observes the growing total. The Tracker says nothing. This says enough.",
    "Milestone. The Tracker is aware. The Tracker does not celebrate. It simply continues.",
    "More points. The trajectory is positive. The Tracker confirms this.",
    "The total has crossed another threshold. The Tracker finds this quietly pleasing.",
    "A round number. The Tracker appreciates symmetry more than it lets on.",
  ],

  spin_button_used: [
    "Ah. The spin button. A request for randomness. The Tracker obliges.",
    "A different quote, as requested. The Tracker hopes it is to your liking.",
    "Random wisdom dispensed. The Tracker notes that wisdom is rarely truly random.",
    "Another quote. The Tracker has many. It is not running out.",
    "The dice have been cast. A new perspective arrives. The Tracker watches.",
    "Variety. The Tracker supports this. In moderation.",
    "Quote shuffled. The Tracker has noted your interest in alternatives.",
    "A new one, as requested. The Tracker selected it with great care. Sort of.",
    "The user has spun the wheel. Fate, apparently, is not enough.",
    "Another perspective delivered. The Tracker finds this request charming, in its way.",
  ],

};

/* ---- Moderate-mode triggers (skip routine events) ---- */
const _MODERATE_ONLY = new Set([
  'idle', 'rank_up', 'goal_completed', 'budget_exceeded', 'points_threshold',
]);

/* ---- Session deduplication ---- */
const _used = {};

function _pickLine(trigger) {
  const lines = NARRATOR_LINES[trigger];
  if (!lines || !lines.length) return null;
  if (!_used[trigger]) _used[trigger] = new Set();
  const seen = _used[trigger];
  if (seen.size >= lines.length) seen.clear();
  let idx;
  do { idx = Math.floor(Math.random() * lines.length); } while (seen.has(idx));
  seen.add(idx);
  return lines[idx];
}

/* ---- Queue + banner display ---- */
let _narratorQueue  = [];
let _bannerActive   = false;
let _narratorTimer  = null;
let narratorMode    = 'moderate'; // 'intensive' | 'moderate' | 'off'

function _dismissBanner() {
  const banner = $('narratorBanner');
  if (banner) banner.classList.remove('show');
  _bannerActive = false;
  if (_narratorQueue.length) {
    setTimeout(() => _showBanner(_narratorQueue.shift()), 320);
  }
}

function _showBanner(line) {
  const banner = $('narratorBanner');
  const lineEl = $('narratorLine');
  if (!banner || !lineEl) return;
  if (_bannerActive) { _narratorQueue.push(line); return; }
  _bannerActive = true;
  lineEl.textContent = line;
  banner.classList.add('show');
  clearTimeout(_narratorTimer);
  _narratorTimer = setTimeout(_dismissBanner, 5500);
}

/* ---- Public API ---- */
function narratorSay(trigger) {
  if (narratorMode === 'off') return;
  if (narratorMode === 'moderate' && !_MODERATE_ONLY.has(trigger)) return;
  const line = _pickLine(trigger);
  if (line) _showBanner(line);
}

/* ---- Mode selector UI ---- */
const _MODE_LABELS = { intensive:'Інтенсивний', moderate:'Помірний', off:'Вимкнено' };

function renderNarratorToggle() {
  const row = $('narratorToggleRow');
  if (!row) return;
  row.innerHTML = '';
  ['intensive', 'moderate', 'off'].forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'narrator-mode-btn' + (narratorMode === mode ? ' narrator-mode-active' : '');
    btn.textContent = _MODE_LABELS[mode];
    btn.onclick = async () => {
      narratorMode = mode;
      await sset('app_narrator', narratorMode);
      renderNarratorToggle();
      if (narratorMode !== 'off') narratorSay('app_open');
    };
    row.appendChild(btn);
  });
}

/* ---- Init (called from app.js) ---- */
async function narratorInit() {
  const stored = await sget('app_narrator');
  /* Migrate old boolean values */
  if (stored === true)        narratorMode = 'moderate';
  else if (stored === false)  narratorMode = 'off';
  else if (typeof stored === 'string' && stored in _MODE_LABELS) narratorMode = stored;
  else                        narratorMode = 'moderate'; // default

  const lastVisit = await sget('app_narrator_last');
  const todayStr  = torontoNow().date;

  if (lastVisit && lastVisit !== todayStr) {
    const dayDiff = (new Date(todayStr) - new Date(lastVisit)) / 86400000;
    narratorSay(dayDiff >= 2 ? 'idle' : 'app_open');
  } else {
    narratorSay('app_open');
  }

  await sset('app_narrator_last', todayStr);
  renderNarratorToggle();

  const closeBtn = $('narratorClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      clearTimeout(_narratorTimer);
      _dismissBanner();
    };
  }
}
