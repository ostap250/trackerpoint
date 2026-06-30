function budgetCap(key) {
  return (BUDGETS.find(b => b.key === key)?.total || 0) + (budget.bonus[key] || 0);
}

function colorFor(r, base) {
  if (r <= 0.18) return 'var(--low)';
  if (r <= 0.45) return 'var(--mid)';
  return base;
}

function renderBudget() {
  const next = mondayOf(new Date());
  next.setDate(next.getDate() + 7);
  $('budgetReset').innerHTML = `обнулення <b>${Math.ceil((next - new Date()) / 86400000)} дн</b>`;

  const wrap = $('budgetCards');
  wrap.innerHTML = '';

  BUDGETS.forEach(b => {
    const cap      = budgetCap(b.key);
    const spent    = budget.spent[b.key] || 0;
    const left     = Math.max(0, cap - spent);
    const r        = cap > 0 ? left / cap : 0;
    const empty    = left <= 0;
    const col      = colorFor(r, b.color);
    const bonusAmt = budget.bonus[b.key] || 0;
    const bonusNote = bonusAmt > 0
      ? ` <span style="color:var(--good);font-size:10px">+${fmt(bonusAmt)} бонус</span>`
      : '';

    const c = document.createElement('div');
    c.className = 'card' + (empty ? ' empty' : '');
    c.innerHTML = `<div class="card-head">
        <div class="name"><span class="dot" style="background:${b.color}"></span>${b.name}${bonusNote}</div>
        <div class="readout">
          <span class="big" style="color:${empty ? 'var(--muted)' : col}">${fmt(left)}</span>
          <span class="unit">${b.unit}</span>
          <span class="of">з ${fmt(cap)} ${b.unit} лишилось</span>
        </div>
      </div>
      <div class="bar"><div class="fill" style="width:${r*100}%;background:${col}"></div></div>
      <div class="row">
        <button class="spend" data-k="${b.key}"${empty ? ' disabled' : ''}>
          − ${fmt(b.step)} ${b.unit}${empty ? ' · вичерпано' : ''}
        </button>
        <button class="undo" data-u="${b.key}"${spent <= 0 ? ' disabled' : ''}>↩</button>
      </div>
      ${empty ? '<div class="spent-msg">Стоп на цей тиждень. Без драми — понеділок обнулить.</div>' : ''}`;
    wrap.appendChild(c);
  });

  wrap.querySelectorAll('.spend').forEach(btn => btn.onclick = () => spendB(btn.dataset.k,  1));
  wrap.querySelectorAll('.undo').forEach(btn  => btn.onclick = () => spendB(btn.dataset.u, -1));
}

async function spendB(key, dir) {
  const b   = BUDGETS.find(x => x.key === key);
  const cap = budgetCap(key);
  let s = (budget.spent[key] || 0) + dir * b.step;
  s = Math.max(0, Math.min(cap, s));
  budget.spent[key] = s;
  await sset('app_budget', budget);
  renderBudget();
}

$('newweek').onclick = async () => {
  budget = { weekStart:mondayOf(new Date()).toISOString(), spent:{}, bonus:{} };
  BUDGETS.forEach(b => { budget.spent[b.key] = 0; budget.bonus[b.key] = 0; });
  await sset('app_budget', budget);
  renderBudget();
  renderShop();
};
