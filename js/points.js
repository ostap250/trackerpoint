/* ---- Rank ---- */
function getRank(pts) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].min) return i;
  }
  return 0;
}

function renderRank() {
  const ri = getRank(points.total);
  const r  = RANKS[ri];
  $('rankHex').style.setProperty('--rcolor', r.color);
  $('rankLbl').textContent  = r.lbl;
  $('rankName').style.color = r.color;
  $('rankName').textContent = r.name;
  if (r.next) {
    const span = r.next - r.min;
    const prog = Math.max(0, points.total - r.min);
    const pct  = Math.min(1, prog / span);
    $('rankSub').textContent       = `${points.total} pts · ще ${r.next - points.total} до ${RANKS[ri+1].name}`;
    $('rankFill').style.width      = (pct * 100) + '%';
    $('rankFill').style.background = r.color;
  } else {
    $('rankSub').textContent       = `${points.total} pts · MAX RANK`;
    $('rankFill').style.width      = '100%';
    $('rankFill').style.background = r.color;
  }
}

/* ---- Points display ---- */
function renderPoints() {
  $('ptsTotal').textContent = points.total;
  $('ptsTargetLbl').innerHTML = `ціль <b>${PTS_TARGET}</b>`;
  const ratio = Math.min(1, points.total / PTS_TARGET);
  $('ptsFill').style.width      = (ratio * 100) + '%';
  $('ptsFill').style.background = ratio >= 1 ? 'var(--good)' : 'var(--indigo)';
  const left = Math.max(0, PTS_TARGET - points.total);
  $('ptsToGoal').textContent = left > 0 ? `ще ${left} до цілі` : 'ціль досягнута 🔓';
  $('ptsUndo').disabled = points.last <= 0;

  const chips = $('ptsChips');
  chips.innerHTML = '';
  PTS_STEPS.forEach(v => {
    const b = document.createElement('button');
    b.className = 'pts-block' + (pendingAmount === v ? ' selected' : '');
    b.textContent = `+${v}`;
    b.onclick = () => { pendingAmount = v; renderPoints(); $('ptsReason').focus(); };
    chips.appendChild(b);
  });

  renderRank();
}

/* ---- Pending list ---- */
async function addPending(amount, reason) {
  if (!amount || amount < 1) return;
  pending.push({ id:newId(), amount, reason:reason||'', date:torontoNow().date });
  await sset('app_pending', pending);
  renderPending();
}

async function confirmPending(id) {
  const idx = pending.findIndex(x => x.id === id);
  if (idx < 0) return;
  const item = pending[idx];
  pending.splice(idx, 1);
  const prevHundred = Math.floor(points.total / 100);
  points.total += item.amount;
  points.last   = item.amount;
  if (Math.floor(points.total / 100) > prevHundred) narratorSay('points_threshold', { total: points.total });
  pointsLog.unshift({ id:newId(), amount:item.amount, reason:item.reason, date:torontoNow().date });
  if (pointsLog.length > 300) pointsLog = pointsLog.slice(0, 300);
  await sset('app_pending',    pending);
  await sset('app_points',     points);
  await sset('app_points_log', pointsLog);
  renderPoints();
  renderPending();
  renderShop();
  showNotif(`+${item.amount} pts підтверджено!`);
  narratorSay('points_gained');
}

async function rejectPending(id) {
  pending = pending.filter(x => x.id !== id);
  await sset('app_pending', pending);
  renderPending();
}

async function savePendingEdit(id) {
  const amt = parseInt($('peAmt_' + id)?.value, 10) || 0;
  const rsn = ($('peRsn_' + id)?.value || '').trim();
  if (!amt || amt < 1) return;
  const item = pending.find(x => x.id === id);
  if (!item) return;
  item.amount = amt;
  item.reason = rsn;
  pendingEditId = null;
  await sset('app_pending', pending);
  renderPending();
}

function renderPending() {
  const wrap = $('pendingList');
  wrap.innerHTML = '';
  $('pendingCount').textContent = pending.length ? `(${pending.length})` : '';

  if (!pending.length) {
    wrap.innerHTML = '<div class="empty-note" style="padding:10px 0 4px">Немає очікуваних поінтів</div>';
    return;
  }

  pending.forEach(item => {
    if (item.id === pendingEditId) {
      const row = document.createElement('div');
      row.className = 'pend-edit-row';
      row.innerHTML = `<input id="peAmt_${item.id}" type="number" value="${item.amount}" style="max-width:62px">
        <input id="peRsn_${item.id}" type="text" value="${item.reason}" placeholder="причина">
        <button class="esave">✓</button><button class="ecancel">✕</button>`;
      row.querySelector('.esave').onclick  = () => savePendingEdit(item.id);
      row.querySelector('.ecancel').onclick = () => { pendingEditId = null; renderPending(); };
      wrap.appendChild(row);
    } else {
      const row = document.createElement('div');
      row.className = 'pending-item';
      const d  = new Date(item.date + 'T00:00:00');
      const dl = d.toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
      row.innerHTML = `<span class="pend-amt">+${item.amount}</span>
        <span class="pend-rsn">${(item.reason || 'без причини').replace(/</g,'&lt;')}</span>
        <span class="pend-date">${dl}</span>
        <div class="pend-btns">
          <button class="pend-ok" title="Підтвердити">✓</button>
          <button class="pend-edit" title="Редагувати">✎</button>
          <button class="pend-del" title="Відхилити">✕</button>
        </div>`;
      row.querySelector('.pend-ok').onclick   = () => confirmPending(item.id);
      row.querySelector('.pend-edit').onclick  = () => { pendingEditId = item.id; renderPending(); };
      row.querySelector('.pend-del').onclick   = () => rejectPending(item.id);
      wrap.appendChild(row);
    }
  });
}

async function exportPending() {
  if (!pending.length) { showNotif('Немає очікуваних поінтів'); return; }
  const date = new Date().toLocaleDateString('uk-UA');
  let text = `Очікувані поінти (${date}):\n`;
  pending.forEach(item => {
    const d = new Date(item.date + 'T00:00:00').toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
    text += `• +${item.amount} pts — ${item.reason || 'без причини'} (${d})\n`;
  });
  text += `\nСума: ${pending.reduce((s, i) => s + i.amount, 0)} pts`;
  try {
    await navigator.clipboard.writeText(text);
    showNotif('Скопійовано до буферу');
  } catch {
    showNotif('Помилка: немає дозволу на буфер');
  }
}

/* ---- Event wiring ---- */
$('exportPendingBtn').onclick = exportPending;

$('ptsAddBtn').onclick = async () => {
  const r = $('ptsReason').value.trim();
  if (!pendingAmount) { showNotif('Вибери суму поінтів'); return; }
  await addPending(pendingAmount, r);
  $('ptsReason').value = '';
  pendingAmount = 0;
  renderPoints();
};

$('ptsReason').addEventListener('keydown', e => { if (e.key === 'Enter') $('ptsAddBtn').click(); });

$('ptsUndo').onclick = async () => {
  if (points.last > 0) {
    points.total = Math.max(0, points.total - points.last);
    points.last  = 0;
    await sset('app_points', points);
    renderPoints();
    renderShop();
  }
};

/* gymHomeBtn navigation is wired in app.js */
