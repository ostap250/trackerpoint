/* Notification snack */
let _notifTimer = null;
function showNotif(text) {
  const el = $('notifSnack');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* Toronto clock */
function tickClock() {
  const t = torontoNow();
  $('clockTime').textContent = t.hhmmss;
  const d = new Date(t.date + 'T00:00:00');
  $('clockDate').textContent = d.toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'short', year:'numeric'
  });
}
tickClock();
setInterval(tickClock, 1000);

/* ---- Daily quote + spin ---- */

let _spinQuote     = null;  // temporary spun quote (null = show daily)
let _spinCoolEnd   = 0;     // epoch ms when cooldown expires
let _spinTickTimer = null;  // interval for countdown

function _dailyIdx() {
  return (torontoDayOfYear() * 5 + quoteWindow()) % QUOTES.length;
}

function renderQuote() {
  const q = _spinQuote || QUOTES[_dailyIdx()];
  const rem = _spinCoolEnd - Date.now();
  let btnLabel;
  if (rem > 0) {
    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    btnLabel = `⏳ ${m}:${s.toString().padStart(2, '0')}`;
  } else {
    btnLabel = '🎲 Крутнути';
  }
  $('quoteBlock').innerHTML =
    `<div class="quote-text">"${q.q}"</div>
     <div class="quote-src">— ${q.src}</div>
     <div class="spin-row">
       <button class="spin-btn" id="spinBtn"${rem > 0 ? ' disabled' : ''}>${btnLabel}</button>
     </div>`;
  if (rem <= 0) $('spinBtn').onclick = _doSpin;
}

function _tickSpin() {
  const rem = _spinCoolEnd - Date.now();
  const btn = $('spinBtn');
  if (!btn) return;
  if (rem <= 0) {
    clearInterval(_spinTickTimer);
    btn.textContent = '🎲 Крутнути';
    btn.disabled = false;
    btn.onclick = _doSpin;
  } else {
    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    btn.textContent = `⏳ ${m}:${s.toString().padStart(2, '0')}`;
  }
}

async function _doSpin() {
  const dailyIdx = _dailyIdx();
  const pool = QUOTES.filter((_, i) => i !== dailyIdx);
  _spinQuote  = pool[Math.floor(Math.random() * pool.length)];
  _spinCoolEnd = Date.now() + 3600000; // 1 hour
  await sset('app_quote_spin', _spinCoolEnd);
  renderQuote();
  if (typeof narratorSay === 'function') narratorSay('spin_button_used');
  clearInterval(_spinTickTimer);
  _spinTickTimer = setInterval(_tickSpin, 1000);
}

async function initSpin() {
  const stored = await sget('app_quote_spin');
  if (stored && stored > Date.now()) {
    _spinCoolEnd = stored;
    clearInterval(_spinTickTimer);
    _spinTickTimer = setInterval(_tickSpin, 1000);
  }
}
