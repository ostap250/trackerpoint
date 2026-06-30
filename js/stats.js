/* ---- Snapshot (called on day rollover) ---- */
async function saveSnapshot(prevCals, prevTasks) {
  if (!prevCals.date || prevCals.date === today()) return;
  const snap = {
    date:       prevCals.date,
    kcal:       Math.round(prevCals.kcal),
    p:          Math.round(prevCals.p),
    f:          Math.round(prevCals.f),
    c:          Math.round(prevCals.c),
    tasksDone:  prevTasks.items.filter(x => x.done).length,
    tasksTotal: prevTasks.items.length,
  };
  history = history.filter(h => h.date !== snap.date);
  history.unshift(snap);
  if (history.length > 14) history = history.slice(0, 14);
  await sset('app_history', history);
}

/* ---- Sub-pane renderers ---- */
function renderStatsDays() {
  const wrap = $('statsContent');
  wrap.innerHTML = '';
  if (!history.length) {
    wrap.innerHTML = '<div class="empty-note">Статистика з\'явиться після першого повного дня.</div>';
    return;
  }
  history.forEach(h => {
    const d         = new Date(h.date + 'T00:00:00');
    const label     = d.toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
    const kcalRatio = Math.min(1, (h.kcal || 0) / KCAL_GOAL.kcal);
    const kcalCol   = kcalRatio >= 0.9 ? 'var(--good)' : kcalRatio >= 0.6 ? 'var(--indigo)' : 'var(--muted)';
    const taskTxt   = h.tasksTotal > 0 ? `${h.tasksDone}/${h.tasksTotal}` : '—';
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML =
      `<span class="stat-date">${label}</span>` +
      `<span class="stat-kcal" style="color:${kcalCol}">${h.kcal || 0}</span>` +
      `<div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${kcalRatio*100}%;background:${kcalCol}"></div></div>` +
      `<span class="stat-tasks">${taskTxt}</span>`;
    wrap.appendChild(row);
  });
}

function renderPtsLog() {
  const wrap = $('ptsLogContent');
  wrap.innerHTML = '';
  if (!pointsLog.length) {
    wrap.innerHTML = '<div class="empty-note">Немає підтверджених поінтів.</div>';
    return;
  }
  pointsLog.forEach(e => {
    const d = new Date(e.date + 'T00:00:00').toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<div class="log-main">
      <span class="log-val" style="color:var(--good)">+${e.amount}</span>
      <span class="log-name">${(e.reason || '—').replace(/</g,'&lt;')}</span>
      <span class="log-date">${d}</span></div>`;
    wrap.appendChild(row);
  });
}

function renderShopLog() {
  const wrap = $('shopLogContent');
  wrap.innerHTML = '';
  if (!spendLog.length) {
    wrap.innerHTML = '<div class="empty-note">Ще нічого не куплено.</div>';
    return;
  }
  spendLog.forEach(e => {
    const d = new Date(e.date + 'T00:00:00').toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<div class="log-main">
      <span class="log-val" style="color:var(--low)">-${e.cost}</span>
      <span class="log-name">${e.name.replace(/</g,'&lt;')}</span>
      <span class="log-date">${d}</span></div>`;
    wrap.appendChild(row);
  });
}

function renderTasksLog() {
  const wrap = $('tasksLogContent');
  wrap.innerHTML = '';
  if (!tasksLog.length) {
    wrap.innerHTML = '<div class="empty-note">Ще жодного завдання не виконано.</div>';
    return;
  }
  tasksLog.forEach(e => {
    const d = new Date(e.date + 'T00:00:00').toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<div class="log-main">
      <span class="log-val" style="color:var(--good)">✓</span>
      <span class="log-name">${e.text.replace(/</g,'&lt;')}</span>
      <span class="log-date">${d}</span></div>`;
    wrap.appendChild(row);
  });
}

function renderStats() { renderStatsDays(); }

/* ---- Sub-tab switching ---- */
const STAT_PANES   = ['days', 'pts', 'shop', 'tasks'];
const STAT_RENDERS = { days:renderStatsDays, pts:renderPtsLog, shop:renderShopLog, tasks:renderTasksLog };

document.querySelectorAll('.stab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.stab').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  STAT_PANES.forEach(t => {
    const el = $('statsPane_' + t);
    if (el) el.style.display = t === b.dataset.stab ? 'block' : 'none';
  });
  if (STAT_RENDERS[b.dataset.stab]) STAT_RENDERS[b.dataset.stab]();
});
