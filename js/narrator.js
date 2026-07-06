/* =====================================================================
   NARRATOR MODULE — Stanley Parable-style scripted commentary
   Persisted in: app_narrator        ('intensive'|'moderate'|'off')
                 app_narrator_last   (ISO date of last visit)
                 app_profile_name    (string — user's name, default 'Stanley')
   Voice: dry, theatrical, condescending about routine actions;
          sincerely proud when the user achieves something real.
   narratorMode and profileName are declared in state.js.
   ===================================================================== */

const NARRATOR_LINES = {

  /* ---- MOCKING — routine actions ---- */

  app_open: [
    "And so, {stanley} opened the Tracker. As he had done before. As he would, no doubt, do again.",
    "Oh. You're back. The Tracker waited faithfully. As it always does. As it always must.",
    "{stanley} returned to the Tracker. What drove him, no one could say. Habit, perhaps. Or guilt.",
    "Ah. {name}. I mean — {stanley}. Let us not make this strange.",
    "{stanley} opened the app. A bold move. Truly. The beginning of something, surely.",
    "Here we are again. The Tracker. The user. This little dance we do.",
    "You arrived. The Tracker notes this without fanfare, which is, in fact, the fanfare.",
    "Good. The app is open. The story, such as it is, can begin.",
    "{stanley} is here. The Tracker had no doubts. Well. Almost none.",
    "The Tracker had begun to wonder. Not in the way a person wonders, of course. But close.",
  ],

  idle: [
    "Several days passed. {stanley} was... elsewhere. The Tracker does not judge. Loudly.",
    "The absence was noted. Filed under 'temporary'. The file grows larger every time.",
    "Ah. You've returned. The Tracker prepared no speech. And yet here it is.",
    "Days went by. Goals stayed exactly where you left them. Patient little things.",
    "{stanley} came back. This is the part where the Tracker pretends it wasn't worried.",
    "Two days. Three. The Tracker counted without counting. Welcome back, {name}.",
    "The Tracker maintained everything in perfect order during your absence. You're welcome.",
    "There you are. The Tracker had begun to suspect the story might end differently.",
    "You returned. Quietly. Unexpectedly. As {stanley} tends to do.",
    "The app was very quiet without you. Peaceful. But — incomplete.",
  ],

  log_gym: [
    "{stanley} lifted something. The record has been updated. The muscles remain unconvinced.",
    "A set, logged. The Tracker immortalises this moment in local storage, where all great moments live.",
    "And so the weight was moved. From here, to there, and back. The Tracker watched.",
    "Another entry. Another bold step in the ongoing saga of {stanley} versus the barbell.",
    "The exercise is recorded. The Tracker makes no promises about results. Only records.",
    "{stanley} trained. The data agrees. Whether the body agrees remains to be seen.",
    "Logged. The Tracker commends the effort without having felt it.",
    "A set, completed. The Tracker notes this with the gravity it deserves. Which is to say: some.",
    "The muscles were addressed. They did not respond. But they were addressed.",
    "Entry noted. The barbell has been informed of {stanley}'s commitment. It remains neutral.",
    "{stanley} pushed. The log reflects this. The narrative continues.",
    "Recorded. The Tracker is nothing if not thorough about other people's effort.",
  ],

  points_gained: [
    "Points confirmed. The great machinery of self-improvement grinds onward.",
    "{stanley} earned points. The Tracker converted effort into a number. As is tradition.",
    "Added to the total. The Tracker finds the whole points system very dignified, really.",
    "The pending item resolved. {stanley} can rest easy. Or go earn more. The Tracker does not mind.",
    "Points deposited. The Tracker notes {stanley} is, technically, succeeding. In a fashion.",
    "Good. More points. The Tracker recommends whatever caused that.",
    "Confirmed. {stanley}'s effort has been officially quantified. Congratulations on the number.",
    "The balance has increased. The Tracker is pleased to report the economy is functioning.",
    "Another batch entered into the ledger. {stanley} is, the Tracker supposes, winning.",
    "Points gained. The Tracker acknowledges this without making it weird.",
  ],

  points_spent: [
    "{stanley} spent the points. Gone. Just like that. Into the void of purchases.",
    "A transaction. The Tracker watches, impassive. The points have served their purpose.",
    "And so the points — carefully earned, dutifully recorded — were exchanged. The Tracker finds this poetic.",
    "Spent. The Tracker does not begrudge {stanley} this. The shop exists for a reason.",
    "Purchase made. The Tracker notes the points fulfilled their destiny. Few things do.",
    "You bought something. The Tracker has nothing to add. You earned it.",
    "Transaction complete. The Tracker's ledgers are updated. Life continues.",
    "The points are gone. Whether the reward is worth it is between {stanley} and his choices.",
    "Indulge. The Tracker will say nothing more on the matter. This time.",
    "A purchase. The Tracker observes with professional detachment and mild approval.",
  ],

  task_completed: [
    "A task, done. The checkbox is ticked. Order returns to the universe. Briefly.",
    "{stanley} did the thing. The Tracker has noted the thing was done.",
    "One less item on the list. The Tracker finds this mildly satisfying.",
    "Done. Not deferred. Not 'sort of done'. Actually done. The Tracker appreciates the distinction.",
    "Tick. The Tracker imagined the sound for you. You're welcome.",
    "Another task, completed. The great list grows slightly shorter. Progress.",
    "The checkbox is ticked. The Tracker is, professionally speaking, pleased.",
    "Completed. The Tracker makes no promises about tomorrow's list. But today's? Handled.",
    "Task done. The Tracker has witnessed many such moments. This one counts.",
    "And so the task was completed. As tasks are, when {stanley} bothers to complete them.",
  ],

  log_food: [
    "Food has been logged. {stanley} ate, and told someone about it.",
    "Caloric intake, recorded. The Tracker finds this level of self-awareness admirable.",
    "The macros have been updated. The Tracker notes this and tries to care as much as it should.",
    "{stanley} logged his meal. The data thanks him. The body has no comment.",
    "Entry recorded. The Tracker does not comment on the choices. It only counts them.",
    "Fuel consumed. Noted. The Tracker supports this approach to biology.",
    "Another entry in the great food log. The Tracker finds this... thorough.",
    "Calories counted. The Tracker wonders, briefly, if this is what it imagined for itself. Then continues.",
    "Logged. The Tracker has seen worse. The Tracker has also seen better. It says nothing.",
    "Food tracked. {stanley} is, apparently, taking this seriously. The Tracker approves. Somewhat.",
  ],

  spin_button_used: [
    "Ah. The spin button. {stanley} found the daily wisdom insufficient.",
    "A different quote requested. The Tracker obliges, silently judging.",
    "You spun the wheel. The universe provided. The Tracker watched, neutral.",
    "Another one, as requested. The Tracker selected it carefully. Sort of.",
    "{stanley} wanted variety. This is, the Tracker supposes, a reasonable thing to want.",
    "Random wisdom dispensed. The Tracker notes that wisdom is rarely truly random.",
    "The daily quote wasn't enough. The Tracker has opinions about this. It keeps them.",
    "A new quote. The Tracker hopes it is more to your taste, {name}. Or — Stanley. Apologies.",
    "Shuffled. The Tracker is nothing if not accommodating. Reluctantly.",
    "Another perspective, by request. The Tracker notes the request and continues.",
  ],

  budget_exceeded: [
    "The budget has been reached. The Tracker is not surprised. Are you?",
    "Zero. And just like that, the week became considerably more interesting.",
    "That's the cap, {stanley}. The Tracker knew it would come. It always does.",
    "Exhausted. The Tracker would say 'I told you so', but it didn't, technically. So.",
    "{stanley} hit the limit. The Tracker notes this without judgement. Which is, itself, a kind of judgement.",
    "No more this week. The Tracker suggests finding other hobbies. Temporarily.",
    "The budget has been spent. Monday will reset it. {stanley} will do this again. The Tracker is certain.",
    "Zero remaining. The week, however, is not done. The Tracker finds this fascinating.",
    "And so the number reached zero. As it always does. As it always will.",
    "Limit reached. The Tracker files this under 'predictable outcomes'. A large file.",
    "The cap, achieved. The Tracker neither celebrates nor mourns. It simply documents.",
    "Gone. The Tracker wishes {stanley} luck with the remaining days. Creativity will be required.",
  ],

  /* ---- SINCERE — real achievements ---- */

  rank_up: [
    "Oh. A rank. A real one. The Tracker... is not often surprised. But here we are.",
    "{stanley} achieved a new tier. The Tracker pauses. This is not nothing. This is something.",
    "Higher. The Tracker does not say this often — you've earned this one, {name}.",
    "A rank, secured through actual work. The previous one retired honourably. Well done.",
    "The Tracker notes the new rank and, for a brief, genuine moment — is proud.",
    "This was not luck. This was consistency. The Tracker sees the difference. It matters.",
    "Rank up. The Tracker will not make a joke about this. Not now. This one counts.",
    "{name}. You got stronger. The Tracker has been watching. It noticed.",
    "A new tier. Quietly, without ceremony, the Tracker thinks: he really did it.",
    "The rank has changed. The Tracker changes its assessment of you along with it — upward.",
    "Progress. Real progress. The Tracker says this plainly, without irony: well done.",
    "Higher tier unlocked. The Tracker does not offer compliments lightly. Consider this one given.",
  ],

  goal_completed: [
    "A goal. Completed. The Tracker did not always think this day would come. It is glad.",
    "{stanley} finished what he started. The Tracker adds this to the short list of things that actually happened.",
    "Done. Really done. The Tracker has been watching this one for a while. Well done, {name}.",
    "The milestone is reached. The Tracker drops the irony, just for a moment: this is good.",
    "Complete. The Tracker is moved. It will deny this if asked.",
    "You set a goal, and you reached it. Most people don't. {stanley} is not most people.",
    "Finished. The Tracker considers goals the truest measure of things. This one was real.",
    "The goal falls. {stanley} stands. The Tracker is, quietly, proud of you.",
    "Done. The Tracker adds this to the list of things {name} actually finished. The list grows.",
    "A goal completed. The Tracker says this without irony: that was worth doing.",
    "{stanley} finished it. The Tracker takes a moment. Then another. Then continues.",
    "Complete. The Tracker finds it has nothing sardonic to add. A first.",
  ],

  points_threshold: [
    "Another hundred. The Tracker notices. It does not celebrate. But it notices.",
    "A round number has been crossed. The Tracker finds clean milestones quietly pleasing.",
    "The balance grows. The Tracker checks the number and thinks — {stanley} is building something.",
    "One hundred more. The Tracker logs this with appropriate gravity.",
    "A threshold, crossed. The Tracker pauses. The trajectory is upward. This is good.",
    "The points accumulate. Slowly, surely. Well done, {name}.",
    "Another milestone. The Tracker updates its estimates of {stanley}'s persistence. Upward.",
    "A round number. The Tracker considers this symbolically significant. And so it is.",
    "The counter clicks over. The Tracker finds, to its mild surprise, that it is pleased.",
    "More points. The Tracker does not say 'I knew you could'. But it thought it.",
    "A milestone reached. Quietly, as {stanley} tends to do his best work.",
    "The total has climbed again. The Tracker watches and thinks — he kept going.",
  ],

};

/* ---- Moderate-mode triggers (skip routine events) ---- */
const _MODERATE_ONLY = new Set([
  'idle', 'rank_up', 'goal_completed', 'budget_exceeded', 'points_threshold',
]);

/* ---- Placeholder resolver: {stanley}→'Stanley', {name}→profileName ---- */
function _n(str) {
  return str
    .replace(/{stanley}/g, 'Stanley')
    .replace(/{name}/g, profileName || 'Stanley');
}

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
  return _n(lines[idx]);
}

/* ---- Queue + banner display ---- */
let _narratorQueue = [];
let _bannerActive  = false;
let _narratorTimer = null;

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

/* ---- Mode selector + name settings UI (rendered in Stats page) ---- */
const _MODE_LABELS = { intensive:'Інтенсивний', moderate:'Помірний', off:'Вимкнено' };

function renderNarratorSettings() {
  const cont = $('narratorSettingsContent');
  if (!cont) return;
  cont.innerHTML = '';

  /* Mode selector */
  const modeRow = document.createElement('div');
  modeRow.className = 'narrator-toggle-row';
  modeRow.style.marginBottom = '14px';
  ['intensive', 'moderate', 'off'].forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'narrator-mode-btn' + (narratorMode === mode ? ' narrator-mode-active' : '');
    btn.textContent = _MODE_LABELS[mode];
    btn.onclick = async () => {
      narratorMode = mode;
      await sset('app_narrator', narratorMode);
      renderNarratorSettings();
      if (narratorMode !== 'off') narratorSay('app_open');
    };
    modeRow.appendChild(btn);
  });
  cont.appendChild(modeRow);

  /* Name change */
  const nameWrap = document.createElement('div');
  nameWrap.className = 'narrator-name-row';
  const displayVal = (profileName && profileName !== 'Stanley') ? profileName : '';
  nameWrap.innerHTML =
    `<div class="narrator-name-lbl">Ваше ім'я (для нарратора)</div>
     <div class="narrator-name-input-row">
       <input id="narratorNameInput" type="text" maxlength="32"
              value="${displayVal.replace(/"/g,'&quot;')}"
              placeholder="Ваше ім'я...">
       <button id="narratorNameSave" class="narrator-name-save-btn">Зберегти</button>
     </div>
     <div class="narrator-name-note">Нарратор все одно назве тебе Стенлі.</div>`;
  cont.appendChild(nameWrap);

  $('narratorNameSave').onclick = async () => {
    const val = $('narratorNameInput').value.trim();
    profileName = val || 'Stanley';
    await sset('app_profile_name', profileName);
    renderNarratorSettings();
  };
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
        _showBanner(_n('{name}. Charming. I\'ve noted it somewhere. I\'ll be calling you Stanley, but — noted.')),
        200);
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

/* ---- Init (called from app.js) ---- */
async function narratorInit() {
  /* Load mode (with migration from old boolean) */
  const stored = await sget('app_narrator');
  if      (stored === true)                                     narratorMode = 'moderate';
  else if (stored === false)                                    narratorMode = 'off';
  else if (typeof stored === 'string' && stored in _MODE_LABELS) narratorMode = stored;
  else                                                          narratorMode = 'moderate';

  /* Wire close button */
  const closeBtn = $('narratorClose');
  if (closeBtn) {
    closeBtn.onclick = () => { clearTimeout(_narratorTimer); _dismissBanner(); };
  }

  /* Check first-visit */
  const storedName = await sget('app_profile_name');
  if (storedName == null) {
    /* First visit — show onboarding (it handles last-visit save internally) */
    renderNarratorSettings();
    showOnboarding();
    return;
  }

  profileName = storedName || 'Stanley';
  renderNarratorSettings();

  /* Normal open logic */
  const lastVisit = await sget('app_narrator_last');
  const todayStr  = torontoNow().date;

  if (lastVisit && lastVisit !== todayStr) {
    const dayDiff = (new Date(todayStr) - new Date(lastVisit)) / 86400000;
    narratorSay(dayDiff >= 2 ? 'idle' : 'app_open');
  } else {
    narratorSay('app_open');
  }

  await sset('app_narrator_last', todayStr);
}
