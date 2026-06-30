/* DOM helper */
const $ = id => document.getElementById(id);

/* Formatting */
const fmt = n => Number.isInteger(n) ? n : n.toFixed(1);
const today = () => new Date().toLocaleDateString('en-CA');
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function mondayOf(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function fmtDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

/* localStorage with in-memory fallback */
const _mem = {};
async function sget(k) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
  catch(e) { return _mem[k] ? JSON.parse(_mem[k]) : null; }
}
async function sset(k, v) {
  const s = JSON.stringify(v);
  try { localStorage.setItem(k, s); } catch(e) { _mem[k] = s; }
}

/* Toronto time */
function torontoNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'America/Toronto', hourCycle:'h23',
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t)?.value ?? '00';
  return {
    date:   `${g('year')}-${g('month')}-${g('day')}`,
    hour:   parseInt(g('hour'), 10),
    hhmm:   `${g('hour')}:${g('minute')}`,
    hhmmss: `${g('hour')}:${g('minute')}:${g('second')}`,
  };
}
function torontoDayOfYear() {
  const { date } = torontoNow();
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor((new Date(y, m-1, d) - new Date(y, 0, 1)) / 86400000) + 1;
}
function quoteWindow() {
  const h = torontoNow().hour;
  if (h >= 23 || h < 9) return 0;
  if (h < 13) return 1;
  if (h < 16) return 2;
  if (h < 21) return 3;
  return 4;
}
