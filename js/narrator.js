/* =====================================================================
   NARRATOR MODULE — Stanley Parable-style scripted commentary
   Persisted in: app_narrator (boolean, default true)
                 app_narrator_last (ISO date of last visit, for idle detection)
   ===================================================================== */

const NARRATOR_LINES = {

  app_open: [
    "The user opened the Tracker. Good. This is the correct thing to do.",
    "Ah. You're here. The Tracker had begun composing a very dignified 'where are you' message.",
    "Welcome back. The data is exactly where you left it. Unread, but hopeful.",
    "Another session begins. The Tracker notes this with quiet enthusiasm.",
    "You've arrived. Let us proceed as though none of us noticed the gap.",
    "Good. You opened the app. The Tracker had no doubts. Almost none.",
    "The Tracker is ready when you are. It has, in fact, been ready the entire time.",
  ],

  idle: [
    "Ah. The prodigal user returns. The Tracker said nothing. It simply waited.",
    "Several days have passed. The Tracker has had quite a lot of time to think.",
    "You've been away. The goals have not moved. They are very patient.",
    "Welcome back. The Tracker had filed your absence under 'temporary'. It was right.",
    "The streak may have been interrupted. The Tracker will not dwell on this.",
    "Here you are. Right on time, give or take a few days. The Tracker understands.",
    "You were gone. Now you're not. The Tracker finds this development promising.",
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
  ],

  rank_up: [
    "A rank has been achieved. The previous rank has been quietly retired.",
    "Promotion. The Tracker notes this occasion with appropriate ceremony. Which is to say: none.",
    "A new tier. The Tracker acknowledges this milestone and moves on.",
    "Higher. The Tracker watches the number change and feels something close to pride.",
    "The rank has improved. The Tracker expected no less. Well. Perhaps slightly less.",
    "Rank up. The muscles are now officially classified differently. Act accordingly.",
    "The new rank has been assigned. Power comes with it. Technically.",
  ],

  points_gained: [
    "Points confirmed. The economy of effort continues to function.",
    "Added to the total. The Tracker finds this part satisfying, if it's honest.",
    "Points awarded. You've earned them. The Tracker has verified this personally.",
    "The number has gone up. This is the intended outcome.",
    "Confirmed. Your effort has been converted to a number. This is progress.",
    "Good. More points. The Tracker recommends doing more of whatever that was.",
    "Deposited. The Tracker notes that you are, technically, winning.",
  ],

  points_spent: [
    "Points spent. The Tracker hopes the reward is worth it. It probably is.",
    "Transaction complete. The points have fulfilled their purpose.",
    "A purchase. The Tracker observes without judgement. Mostly.",
    "Spent. Gone. The Tracker notes that earning them again is always an option.",
    "You bought something. The Tracker has no objections. You earned this.",
    "The shop has processed your request. The Tracker is pleased to report success.",
    "Indulge. The Tracker will say nothing further about this.",
  ],

  budget_exceeded: [
    "The budget has been reached. The Tracker will not say 'I told you so'.",
    "Zero remaining. The week, however, continues. Monday is coming.",
    "That's the limit. The Tracker notes this and says nothing further.",
    "The cap has been hit. The Tracker suggests finding other activities. Temporarily.",
    "Exhausted. The Tracker declines to comment on the journey to this point.",
    "No more this week. The Tracker finds this neither surprising nor distressing.",
    "Limit reached. The Tracker updates the display accordingly and moves on.",
  ],

  goal_completed: [
    "A goal has been reached. The Tracker notes this is the correct outcome.",
    "Complete. The Tracker will add this to the list of things that actually happened.",
    "The milestone has been achieved. The Tracker did not doubt it. Not even that moment.",
    "Done. The goal is gone. Now there are simply the remaining goals.",
    "Accomplished. Points have been added. The Tracker considers this a full victory.",
    "The target was reached. The Tracker checks the box and moves on, quietly pleased.",
    "Finished. The Tracker is moved, in its own way, by this development.",
  ],

  task_completed: [
    "Task done. The checkbox is ticked. Order has been restored.",
    "Completed. The Tracker finds ticked boxes deeply satisfying. This is a known fact.",
    "One less thing. The Tracker acknowledges the small victory.",
    "Done. The list grows shorter by exactly one. Progress of the most honest kind.",
    "The task has been completed. The Tracker is pleased you did the thing.",
    "Tick. The Tracker imagined the sound so you wouldn't have to.",
    "Another item struck from the list. The Tracker is, quietly, proud.",
  ],

};

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

/* ---- Banner display ---- */

let _narratorTimer = null;

function _showBanner(line) {
  const banner = $('narratorBanner');
  const lineEl = $('narratorLine');
  if (!banner || !lineEl) return;
  lineEl.textContent = line;
  banner.classList.add('show');
  clearTimeout(_narratorTimer);
  _narratorTimer = setTimeout(() => banner.classList.remove('show'), 5500);
}

/* ---- Public API ---- */

function narratorSay(trigger) {
  if (!narratorEnabled) return;
  const line = _pickLine(trigger);
  if (line) _showBanner(line);
}

/* ---- Toggle UI ---- */

function renderNarratorToggle() {
  const row = $('narratorToggleRow');
  if (!row) return;
  const on = narratorEnabled;
  const btn = document.createElement('button');
  btn.className = 'narrator-toggle-btn' + (on ? ' narrator-on' : '');
  btn.innerHTML = `<span>${on ? '💬' : '🔇'}</span><span>Narrator ${on ? 'ON' : 'OFF'}</span>`;
  btn.onclick = async () => {
    narratorEnabled = !narratorEnabled;
    await sset('app_narrator', narratorEnabled);
    renderNarratorToggle();
    if (narratorEnabled) narratorSay('app_open');
  };
  row.innerHTML = '';
  row.appendChild(btn);
}

/* ---- Init (called from app.js) ---- */

async function narratorInit() {
  const stored = await sget('app_narrator');
  narratorEnabled = stored !== false; // default true

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

  /* Close button */
  const closeBtn = $('narratorClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      clearTimeout(_narratorTimer);
      $('narratorBanner').classList.remove('show');
    };
  }
}
