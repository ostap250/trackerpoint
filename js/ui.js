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

/* Daily quote */
function renderQuote() {
  const idx = (torontoDayOfYear() * 5 + quoteWindow()) % QUOTES.length;
  const q = QUOTES[idx];
  $('quoteBlock').innerHTML =
    `<div class="quote-text">"${q.q}"</div><div class="quote-src">— ${q.src}</div>`;
}
