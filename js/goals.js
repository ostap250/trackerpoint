async function checkMilestone(g) {
  if (g.rewarded) return;
  let complete = false;
  if (g.type === 'check') {
    complete = g.done;
  } else {
    const span = Math.abs(g.target - g.start) || 1;
    complete = Math.abs(g.current - g.start) >= span;
  }
  if (!complete) return;
  g.rewarded = true;
  await addPending(DIFF_PTS[g.difficulty || 'normal'], `Майлстоун: ${g.name}`);
  await sset('app_goals', goals);
  showNotif(`🏆 ${g.name} — +${DIFF_PTS[g.difficulty || 'normal']} pts у очікування!`);
}

function renderGoals() {
  const wrap = $('goalCards');
  wrap.innerHTML = '';

  goals.forEach(g => {
    const diff      = g.difficulty || 'normal';
    const badgeColor = DIFF_COLOR[diff];
    const badgeHTML = `<span class="goal-badge" style="background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}55">${DIFF_LABEL[diff]}</span>`;

    const c = document.createElement('div');
    c.className = 'card' + (g.type === 'check' && g.done ? ' goal-done' : '');

    if (g.type === 'check') {
      c.innerHTML = `<div class="goal-top"><div class="goal-name">${g.name}</div>${badgeHTML}</div>
        <button class="goal-done-btn">${g.done ? '✓ Зроблено' : 'Позначити зробленим'}</button>`;
      c.querySelector('.goal-done-btn').onclick = async () => {
        g.done = !g.done;
        c.className = 'card' + (g.done ? ' goal-done' : '');
        c.querySelector('.goal-done-btn').textContent = g.done ? '✓ Зроблено' : 'Позначити зробленим';
        await sset('app_goals', goals);
        if (g.done) await checkMilestone(g);
      };
    } else {
      const span = Math.abs(g.target - g.start) || 1;
      const r    = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
      const col  = r >= 1 ? 'var(--good)' : 'var(--cyan)';
      c.innerHTML = `<div class="goal-top"><div class="goal-name">${g.name}</div>${badgeHTML}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:6px">
          <div class="goal-val"><b class="gv-cur">${fmt(g.current)}</b> / ${fmt(g.target)} ${g.unit}</div>
        </div>
        <div class="bar" style="margin-top:10px"><div class="fill gfill" style="width:0%;background:${col}"></div></div>
        <div class="goal-step">
          <button data-d="-1">− ${fmt(g.step)}</button>
          <button data-d="1">+ ${fmt(g.step)}</button>
        </div>`;

      const fillEl = c.querySelector('.gfill');
      requestAnimationFrame(() => requestAnimationFrame(() => { fillEl.style.width = (r * 100) + '%'; }));

      c.querySelectorAll('.goal-step button').forEach(btn => btn.onclick = async () => {
        const oldR = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
        g.current  = Math.round((g.current + (+btn.dataset.d) * g.step) * 10) / 10;
        const newR = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
        const newCol = newR >= 1 ? 'var(--good)' : 'var(--cyan)';
        c.querySelector('.gv-cur').textContent = fmt(g.current);
        fillEl.style.background = newCol;
        fillEl.style.width      = (newR * 100) + '%';
        if (newR > oldR) {
          fillEl.classList.remove('glow');
          void fillEl.offsetWidth;
          fillEl.classList.add('glow');
        }
        await sset('app_goals', goals);
        await checkMilestone(g);
      });
    }

    wrap.appendChild(c);
  });
}
