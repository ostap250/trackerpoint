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
  narratorSay('goal_completed');
}

function renderGoals() {
  const wrap = $('goalCards');
  wrap.innerHTML = '';

  goals.forEach((g, i) => {
    if (g) renderGoalCard(wrap, g, i);
  });

  for (let i = goals.length; i < 4; i++) {
    renderEmptySlot(wrap, i);
  }
}

function renderGoalCard(wrap, g, slotIdx) {
  const diff       = g.difficulty || 'normal';
  const badgeColor = DIFF_COLOR[diff];
  const badgeHTML  = `<span class="goal-badge" style="background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}55">${DIFF_LABEL[diff]}</span>`;

  const c = document.createElement('div');
  c.className = 'card' + (g.type === 'check' && g.done ? ' goal-done' : '');

  const delBtn = document.createElement('button');
  delBtn.className = 'goal-slot-del';
  delBtn.textContent = '×';
  delBtn.title = 'Видалити ціль';
  delBtn.onclick = async () => {
    goals.splice(slotIdx, 1);
    await sset('app_goals', goals);
    renderGoals();
  };

  if (g.type === 'check') {
    const topDiv = document.createElement('div');
    topDiv.className = 'goal-top';
    topDiv.innerHTML = `<div class="goal-name">${g.name}</div>`;
    topDiv.appendChild(document.createRange().createContextualFragment(badgeHTML));
    topDiv.appendChild(delBtn);
    c.appendChild(topDiv);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'goal-done-btn';
    doneBtn.textContent = g.done ? '✓ Зроблено' : 'Позначити зробленим';
    doneBtn.onclick = async () => {
      g.done = !g.done;
      c.className = 'card' + (g.done ? ' goal-done' : '');
      doneBtn.textContent = g.done ? '✓ Зроблено' : 'Позначити зробленим';
      await sset('app_goals', goals);
      if (g.done) await checkMilestone(g);
    };
    c.appendChild(doneBtn);
  } else {
    const span = Math.abs(g.target - g.start) || 1;
    const r    = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
    const col  = r >= 1 ? 'var(--good)' : 'var(--cyan)';

    const topDiv = document.createElement('div');
    topDiv.className = 'goal-top';
    topDiv.innerHTML = `<div class="goal-name">${g.name}</div>`;
    topDiv.appendChild(document.createRange().createContextualFragment(badgeHTML));
    topDiv.appendChild(delBtn);
    c.appendChild(topDiv);

    const valDiv = document.createElement('div');
    valDiv.style.cssText = 'display:flex;justify-content:flex-end;margin-top:6px';
    valDiv.innerHTML = `<div class="goal-val"><b class="gv-cur">${fmt(g.current)}</b> / ${fmt(g.target)} ${g.unit}</div>`;
    c.appendChild(valDiv);

    const barDiv = document.createElement('div');
    barDiv.className = 'bar';
    barDiv.style.marginTop = '10px';
    const fillEl = document.createElement('div');
    fillEl.className = 'fill gfill';
    fillEl.style.cssText = `width:0%;background:${col}`;
    barDiv.appendChild(fillEl);
    c.appendChild(barDiv);

    requestAnimationFrame(() => requestAnimationFrame(() => { fillEl.style.width = (r * 100) + '%'; }));

    const stepDiv = document.createElement('div');
    stepDiv.className = 'goal-step';
    stepDiv.innerHTML = `<button data-d="-1">− ${fmt(g.step)}</button><button data-d="1">+ ${fmt(g.step)}</button>`;
    stepDiv.querySelectorAll('button').forEach(btn => {
      btn.onclick = async () => {
        const oldR = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
        g.current  = Math.round((g.current + (+btn.dataset.d) * g.step) * 10) / 10;
        const newR = Math.max(0, Math.min(1, Math.abs(g.current - g.start) / span));
        const newCol = newR >= 1 ? 'var(--good)' : 'var(--cyan)';
        valDiv.querySelector('.gv-cur').textContent = fmt(g.current);
        fillEl.style.background = newCol;
        fillEl.style.width      = (newR * 100) + '%';
        if (newR > oldR) {
          fillEl.classList.remove('glow');
          void fillEl.offsetWidth;
          fillEl.classList.add('glow');
        }
        await sset('app_goals', goals);
        await checkMilestone(g);
      };
    });
    c.appendChild(stepDiv);
  }

  wrap.appendChild(c);
}

function renderEmptySlot(wrap, slotIdx) {
  const c = document.createElement('div');
  c.className = 'card goal-empty-slot';
  c.innerHTML = `<div class="goal-slot-prompt">Яка ваша ціль?</div>
    <div class="goal-slot-sub">Натисни щоб додати</div>`;
  c.onclick = () => expandGoalForm(wrap, c, slotIdx);
  wrap.appendChild(c);
}

function expandGoalForm(wrap, slotCard, slotIdx) {
  slotCard.onclick = null;
  slotCard.className = 'card';

  let formType     = 'progress';
  let selectedDiff = 'normal';

  const container = document.createElement('div');

  const titleDiv = document.createElement('div');
  titleDiv.className = 'label';
  titleDiv.style.marginBottom = '10px';
  titleDiv.textContent = 'Нова ціль';
  container.appendChild(titleDiv);

  /* Name */
  const nameInp = document.createElement('input');
  nameInp.className = 'goal-form-input';
  nameInp.placeholder = 'Назва цілі...';
  container.appendChild(nameInp);

  /* Type toggle */
  const typeRow = document.createElement('div');
  typeRow.className = 'goal-form-type-row';
  const btnProg  = document.createElement('button');
  const btnCheck = document.createElement('button');
  btnProg.className  = 'goal-type-btn active';
  btnCheck.className = 'goal-type-btn';
  btnProg.textContent  = 'Прогрес';
  btnCheck.textContent = 'Одноразово';
  typeRow.appendChild(btnProg);
  typeRow.appendChild(btnCheck);
  container.appendChild(typeRow);

  /* Progress fields */
  const progFields = document.createElement('div');
  progFields.id = 'gf_prog_' + slotIdx;

  const fRow = document.createElement('div');
  fRow.className = 'goal-form-row';

  const mkField = (lbl, ph, type) => {
    const w = document.createElement('div');
    w.style.flex = '1';
    const l = document.createElement('div');
    l.className = 'goal-form-lbl';
    l.textContent = lbl;
    const inp = document.createElement('input');
    inp.className = 'goal-form-input';
    inp.placeholder = ph;
    if (type) inp.type = type;
    if (type === 'number') inp.inputMode = 'decimal';
    w.appendChild(l); w.appendChild(inp);
    return { wrap: w, inp };
  };

  const { wrap: wTarget, inp: inpTarget } = mkField('Ціль', '100', 'number');
  const { wrap: wUnit,   inp: inpUnit   } = mkField('Одиниця', 'кг / $ / км', '');
  const { wrap: wStep,   inp: inpStep   } = mkField('Крок', '1', 'number');
  fRow.appendChild(wTarget);
  fRow.appendChild(wUnit);
  fRow.appendChild(wStep);
  progFields.appendChild(fRow);
  container.appendChild(progFields);

  /* Type toggle handlers */
  btnProg.onclick = () => {
    formType = 'progress';
    btnProg.classList.add('active'); btnCheck.classList.remove('active');
    progFields.style.display = '';
  };
  btnCheck.onclick = () => {
    formType = 'check';
    btnCheck.classList.add('active'); btnProg.classList.remove('active');
    progFields.style.display = 'none';
  };

  /* Difficulty */
  const diffLbl = document.createElement('div');
  diffLbl.className = 'goal-form-lbl';
  diffLbl.style.marginTop = '10px';
  diffLbl.textContent = 'Складність';
  container.appendChild(diffLbl);

  const diffRow = document.createElement('div');
  diffRow.className = 'goal-diff-row';
  [['easy','Легко'], ['normal','Нормально'], ['hard','Важко']].forEach(([d, lbl]) => {
    const btn = document.createElement('button');
    btn.className = 'goal-diff-btn' + (d === 'normal' ? ' active-diff' : '');
    btn.dataset.d = d;
    btn.textContent = lbl;
    btn.style.color       = DIFF_COLOR[d];
    btn.style.borderColor = DIFF_COLOR[d] + '44';
    if (d === 'normal') btn.style.background = DIFF_COLOR[d] + '22';
    btn.onclick = () => {
      selectedDiff = d;
      diffRow.querySelectorAll('.goal-diff-btn').forEach(b => {
        const active = b.dataset.d === d;
        b.classList.toggle('active-diff', active);
        b.style.background = active ? DIFF_COLOR[b.dataset.d] + '22' : 'transparent';
      });
    };
    diffRow.appendChild(btn);
  });
  container.appendChild(diffRow);

  /* Suggestions */
  const suggLbl = document.createElement('div');
  suggLbl.className = 'goal-form-lbl';
  suggLbl.style.marginTop = '10px';
  suggLbl.textContent = 'Пропозиції';
  container.appendChild(suggLbl);

  const suggRow = document.createElement('div');
  suggRow.className = 'goal-suggestions';
  EXAMPLE_GOALS.forEach(eg => {
    const btn = document.createElement('button');
    btn.className = 'goal-sugg-btn';
    btn.textContent = eg.name;
    btn.onclick = () => {
      nameInp.value  = eg.name;
      selectedDiff   = eg.difficulty || 'normal';
      diffRow.querySelectorAll('.goal-diff-btn').forEach(b => {
        const active = b.dataset.d === selectedDiff;
        b.classList.toggle('active-diff', active);
        b.style.background = active ? DIFF_COLOR[b.dataset.d] + '22' : 'transparent';
      });
      if (eg.type === 'progress') {
        btnProg.click();
        inpTarget.value = eg.target;
        inpUnit.value   = eg.unit;
        inpStep.value   = eg.step;
      } else {
        btnCheck.click();
      }
    };
    suggRow.appendChild(btn);
  });
  container.appendChild(suggRow);

  /* Save / Cancel */
  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display:flex;gap:7px;margin-top:12px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'goal-form-save';
  saveBtn.textContent = 'Зберегти';
  saveBtn.onclick = async () => {
    const name = nameInp.value.trim();
    if (!name) { showNotif('Введи назву цілі'); return; }

    let newGoal;
    if (formType === 'progress') {
      const target = parseFloat(inpTarget.value);
      const unit   = inpUnit.value.trim() || 'шт';
      const step   = parseFloat(inpStep.value) || 1;
      if (isNaN(target)) { showNotif('Введи цільове значення'); return; }
      newGoal = { key:'g_' + Date.now(), name, type:'progress', start:0, current:0, target, unit, step, difficulty:selectedDiff };
    } else {
      newGoal = { key:'g_' + Date.now(), name, type:'check', done:false, difficulty:selectedDiff };
    }

    goals.push(newGoal);
    await sset('app_goals', goals);
    renderGoals();
    showNotif(`✓ Ціль "${name}" додано`);
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'goal-form-cancel';
  cancelBtn.textContent = 'Скасувати';
  cancelBtn.onclick = () => renderGoals();

  actionRow.appendChild(saveBtn);
  actionRow.appendChild(cancelBtn);
  container.appendChild(actionRow);

  slotCard.innerHTML = '';
  slotCard.appendChild(container);
}
