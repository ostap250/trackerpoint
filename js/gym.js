/* =====================================================================
   GYM MODULE — workout program, per-muscle rank system (lift-based)
   Persisted in: app_gym          { muscles:{…}, workoutLog:[…] }
                 app_gym_images   wger exercise image URL cache
                 app_gym_program  custom day exercise lists (new key)
   ===================================================================== */

/* ---- Rank / lift helpers ---- */

function bestLiftValue(muscleKey) {
  const cfg = MUSCLE_LIFT_CONFIG[muscleKey];
  if (!cfg || !gymData) return 0;
  let best = 0;
  gymData.workoutLog.forEach(entry => {
    if (!cfg.exIds.includes(entry.exId)) return;
    const val = cfg.mode === 'reps' ? (entry.reps || 0) : (entry.weight || 0);
    if (val > best) best = val;
  });
  return best;
}

function getMuscleRankInfo(muscleKey) {
  const cfg = MUSCLE_LIFT_CONFIG[muscleKey];
  if (!cfg) return { rank: MUSCLE_RANK_TIERS[0], pct: 0, best: 0, val: 0, display: '—', nextRank: null, nextThreshold: null, nextThresholdDisplay: '' };

  const bw  = bodyWeight > 0 ? bodyWeight : 70;
  const raw = bestLiftValue(muscleKey);
  const val = cfg.mode === 'bw' ? raw / bw : raw;

  let tierIdx = 0;
  for (let i = MUSCLE_RANK_TIERS.length - 1; i >= 0; i--) {
    if (val >= cfg.tiers[i]) { tierIdx = i; break; }
  }

  const rank       = MUSCLE_RANK_TIERS[tierIdx];
  const nextTierIdx = tierIdx + 1;

  let display;
  if (raw === 0) {
    display = 'ще не записано';
  } else if (cfg.mode === 'bw') {
    display = `${raw} кг (${val.toFixed(2)}×БВ)`;
  } else if (cfg.mode === 'reps') {
    display = `${raw} с`;
  } else {
    display = `${raw} кг`;
  }

  if (nextTierIdx >= MUSCLE_RANK_TIERS.length) {
    return { rank, pct: 100, best: raw, val, display, nextRank: null, nextThreshold: null, nextThresholdDisplay: '' };
  }

  const currT = cfg.tiers[tierIdx];
  const nextT = cfg.tiers[nextTierIdx];
  const range = nextT - currT;
  const pct   = range > 0 ? Math.min(100, Math.max(0, Math.round(((val - currT) / range) * 100))) : 0;

  function fmtThreshold(t) {
    if (cfg.mode === 'bw')   return `${t}×БВ (≈${Math.round(t * bw)} кг)`;
    if (cfg.mode === 'reps') return `${t} с`;
    return `${t} кг`;
  }

  return {
    rank,
    pct,
    best: raw,
    val,
    display,
    nextRank:             MUSCLE_RANK_TIERS[nextTierIdx],
    nextThreshold:        nextT,
    nextThresholdDisplay: fmtThreshold(nextT),
    fmtThreshold,
    cfg,
  };
}

/* ---- Program helpers ---- */

function getExercisesForDay(dayId) {
  if (gymProgram && gymProgram[dayId]) return gymProgram[dayId];
  return GYM_DAYS.find(d => d.id === dayId)?.exercises || [];
}

async function saveProgram(dayId, exercises) {
  if (!gymProgram) gymProgram = {};
  gymProgram[dayId] = exercises;
  await sset('app_gym_program', gymProgram);
}

function getExerciseBank() {
  const seen = new Set();
  const bank = [];
  GYM_DAYS.forEach(day => {
    day.exercises.forEach(ex => {
      if (!seen.has(ex.id)) { seen.add(ex.id); bank.push(ex); }
    });
  });
  Object.values(EXERCISE_ALTERNATIVES).forEach(ex => {
    if (!seen.has(ex.id)) { seen.add(ex.id); bank.push(ex); }
  });
  return bank;
}

async function swapExercise(dayId, exId) {
  const alt  = EXERCISE_ALTERNATIVES[exId];
  if (!alt) return;
  const exes = getExercisesForDay(dayId);
  const idx  = exes.findIndex(e => e.id === exId);
  if (idx === -1) return;
  const newExes = [...exes];
  newExes[idx]  = alt;
  await saveProgram(dayId, newExes);
  renderGym();
}

async function removeExercise(dayId, exId) {
  const exes = getExercisesForDay(dayId);
  if (exes.length <= 1) { showNotif('Має бути хоча б одна вправа'); return; }
  await saveProgram(dayId, exes.filter(e => e.id !== exId));
  renderGym();
}

async function addExercise(dayId, exId) {
  const ex   = getExerciseBank().find(e => e.id === exId);
  if (!ex) return;
  const exes = getExercisesForDay(dayId);
  if (exes.find(e => e.id === exId)) return;
  await saveProgram(dayId, [...exes, ex]);
  renderGym();
}

/* ---- initGymData ---- */

function initGymData() {
  const muscles = {};
  MUSCLES.forEach(m => { muscles[m.key] = {}; });
  return { muscles, workoutLog: [] };
}

/* ---- Exercise image loading (wger.de REST API, CC BY SA 4.0) ---- */

function setExerciseVisual(slot, ex, imageUrl) {
  if (imageUrl) {
    const safeUrl  = String(imageUrl).replace(/"/g, '');
    const safeName = String(ex.nameEn || '').replace(/</g, '&lt;');
    slot.className = 'gym-img-slot';
    slot.innerHTML = `<div class="gym-img-wrap" onclick="this.closest('.gym-img-slot').classList.toggle('gym-img-expanded')">
      <img class="gym-ex-thumb" src="${safeUrl}" loading="lazy" alt="${safeName}" />
      <div class="gym-img-meta">
        <span class="gym-img-exname">${safeName}</span>
        <a class="gym-img-attr" href="https://wger.de" target="_blank" rel="noopener">© wger.de · CC BY SA 4.0</a>
      </div>
    </div>`;
  } else {
    const nameEn = ex.nameEn || '';
    const ytUrl  = 'https://www.youtube.com/results?search_query='
                 + encodeURIComponent(nameEn + ' proper form');
    slot.className = 'gym-img-slot gym-img-yt';
    slot.innerHTML = `<a class="gym-yt-link" href="${ytUrl}" target="_blank" rel="noopener">▶ Як робити: ${nameEn.replace(/</g, '&lt;')}</a>`;
  }
}

async function fetchAndSetExerciseImage(ex) {
  let imageUrl = null;
  try {
    const resp = await fetch(
      'https://wger.de/api/v2/exercise/search/?term=' +
      encodeURIComponent(ex.nameEn) + '&language=english&format=json'
    );
    if (!resp.ok) throw new Error();
    const data  = await resp.json();
    const first = (data.suggestions || [])[0];
    if (first) {
      const direct = first.data?.image;
      if (direct) {
        imageUrl = direct.startsWith('http') ? direct : 'https://wger.de' + direct;
      } else {
        const baseId = first.data?.base_id;
        if (baseId) {
          const ir  = await fetch('https://wger.de/api/v2/exerciseimage/?format=json&exercise=' + baseId);
          if (ir.ok) {
            const id  = await ir.json();
            const img = (id.results || []).find(i => i.is_main) || (id.results || [])[0];
            if (img?.image) {
              imageUrl = img.image.startsWith('http') ? img.image : 'https://wger.de' + img.image;
            }
          }
        }
      }
    }
  } catch(e) { /* network / parse error → YouTube fallback */ }

  gymImages[ex.nameEn] = imageUrl;
  await sset('app_gym_images', gymImages);
  const slot = $('gym_img_' + ex.id);
  if (slot) setExerciseVisual(slot, ex, imageUrl);
}

/* ---- lastEntry / defaultRepsNum ---- */

function lastEntry(exId) {
  return gymData.workoutLog.find(e => e.exId === exId);
}

function defaultRepsNum(repsStr) {
  const n = parseInt(repsStr, 10);
  return isNaN(n) ? '' : n;
}

/* ---- Log an exercise set ---- */

async function logExercise(exId) {
  const exes = getExercisesForDay(activeDay);
  const ex   = exes.find(e => e.id === exId);
  if (!ex) return;

  const wEl = $('gw_' + exId);
  const rEl = $('gr_' + exId);
  const sEl = $('gs_' + exId);

  const weight = wEl ? (+wEl.value || 0) : 0;
  const reps   = +rEl?.value || 0;
  const sets   = +sEl?.value || ex.sets;

  if (!ex.bw && weight <= 0) { showNotif('Введи вагу (кг)'); return; }
  if (reps <= 0)              { showNotif('Введи кількість повторень'); return; }

  const prevRankName = getMuscleRankInfo(ex.muscle).rank.name;

  const entry = {
    id:     newId(),
    date:   torontoNow().date,
    dayId:  activeDay,
    exId,
    exName: ex.name,
    weight: ex.bw ? 0 : weight,
    reps, sets,
    muscle: ex.muscle,
  };
  gymData.workoutLog.unshift(entry);
  if (gymData.workoutLog.length > 500) gymData.workoutLog = gymData.workoutLog.slice(0, 500);
  await sset('app_gym', gymData);

  const newRankInfo = getMuscleRankInfo(ex.muscle);
  const mInfo       = MUSCLES.find(m => m.key === ex.muscle);

  if (newRankInfo.rank.name !== prevRankName) {
    showNotif(`⬆ ${mInfo.name} → ${newRankInfo.rank.name}!`);
  } else {
    const weightStr = ex.bw ? '' : `${weight} кг × `;
    showNotif(`✓ ${ex.name} — ${weightStr}${reps} × ${sets} підх`);
  }

  renderGym();
  renderRanks();
}

/* ---- Зал page render ---- */

function renderGym() {
  const wrap = $('gymContent');
  wrap.innerHTML = '';

  /* Warmup card */
  const wu = document.createElement('div');
  wu.className = 'card';
  wu.innerHTML = `<div class="label">Розминка (щоразу перед тренуванням)</div>
    <ul class="gym-notes">
      <li>5 хв кардіо</li>
      <li>Band external rotations 2\xD715</li>
      <li>Face pulls 2\xD715</li>
    </ul>
    <div class="gym-constraint">⚠ NO overhead pressing (плечо). Лямки на тязі та RDL (зап'ясток).</div>
    <div class="gym-progress-rule">Прогресія: додавай вагу коли досягаєш верху діапазону повторень у всіх підходах з чистою технікою.</div>`;
  wrap.appendChild(wu);

  /* Muscle panel */
  const mp = document.createElement('div');
  mp.className = 'card';
  mp.innerHTML = '<div class="label" style="margin-bottom:10px">Прогрес м\'язів</div>';

  /* Bodyweight input */
  const bwRow = document.createElement('div');
  bwRow.className = 'gym-bw-row';
  bwRow.innerHTML = `<label class="gym-bw-label">Моя вага</label>
    <input class="gym-bw-input" id="gymBwInput" type="number" inputmode="decimal" min="30" max="350" value="${bodyWeight || 70}" />
    <span class="gym-bw-unit">кг</span>`;
  mp.appendChild(bwRow);

  const grid = document.createElement('div');
  grid.className = 'muscles-grid';
  MUSCLES.forEach(m => {
    const info = getMuscleRankInfo(m.key);
    const rank = info.rank;
    const cell = document.createElement('div');
    cell.className = 'muscle-cell';
    cell.innerHTML = `
      <div class="muscle-cell-row">
        <div class="muscle-rank-hex" style="--rcolor:${rank.color}">
          <span class="muscle-rank-lbl">${rank.lbl}</span>
        </div>
        <div class="muscle-info">
          <div class="muscle-name" style="color:${m.color}">${m.name}</div>
          <div class="muscle-level">${rank.name}</div>
          <div class="rank-bar" style="margin-top:5px">
            <div class="rank-fill" style="width:${info.pct}%;background:${rank.color}"></div>
          </div>
          <div class="muscle-rank-pct">${info.pct}% ${info.nextRank ? '→ ' + info.nextRank.name : '★ MAX'}</div>
        </div>
      </div>`;
    grid.appendChild(cell);
  });
  mp.appendChild(grid);

  /* BW input handler — debounce on blur/enter */
  const bwInput = mp.querySelector('#gymBwInput');
  const saveBw = async () => {
    const bw = parseFloat(bwInput.value);
    if (bw > 0 && bw < 500 && bw !== bodyWeight) {
      bodyWeight = bw;
      await sset('app_bw', bw);
      renderGym();
      renderRanks();
    }
  };
  bwInput.onblur  = saveBw;
  bwInput.onkeydown = e => { if (e.key === 'Enter') { bwInput.blur(); } };

  const ranksBtn = document.createElement('button');
  ranksBtn.className = 'ranks-link-btn';
  ranksBtn.textContent = 'Таблиця рангів →';
  ranksBtn.onclick = () => switchTab('ranks');
  mp.appendChild(ranksBtn);
  wrap.appendChild(mp);

  /* Day selector */
  const ds = document.createElement('div');
  ds.className = 'day-selector';
  GYM_DAYS.forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'day-btn' + (activeDay === day.id ? ' active' : '') + (day.optional ? ' day-optional-btn' : '');
    btn.innerHTML = `<span class="day-btn-name">${day.name}</span><span class="day-btn-sub">${day.subtitle}</span>`;
    btn.onclick = () => { activeDay = day.id; renderGym(); };
    ds.appendChild(btn);
  });
  wrap.appendChild(ds);

  /* Exercise card */
  const day  = GYM_DAYS.find(d => d.id === activeDay);
  const exes = getExercisesForDay(activeDay);
  const exCard = document.createElement('div');
  exCard.className = 'card' + (day.optional ? ' day-c-card' : '');

  const dayHeader = document.createElement('div');
  dayHeader.className = 'gym-day-header';
  dayHeader.innerHTML = `<span class="label">${day.name} — ${day.subtitle}</span>
    ${day.optional ? '<span class="day-optional-badge">Опціонально</span>' : ''}`;
  exCard.appendChild(dayHeader);

  if (day.optional) {
    const optNote = document.createElement('div');
    optNote.className = 'gym-optional-note';
    optNote.textContent = 'Тільки коли є час і настрій — не обов\'язково.';
    exCard.appendChild(optNote);
  }

  exes.forEach(ex => {
    const last  = lastEntry(ex.id);
    const mInfo = MUSCLES.find(m => m.key === ex.muscle);
    const defW  = last && !ex.bw ? last.weight : '';
    const defR  = last ? last.reps : defaultRepsNum(ex.reps);
    const defS  = last ? last.sets : ex.sets;

    const exEl = document.createElement('div');
    exEl.className = 'gym-ex';

    /* Header row */
    const topDiv = document.createElement('div');
    topDiv.className = 'gym-ex-top';
    topDiv.innerHTML = `
      <div class="gym-ex-names">
        <span class="gym-ex-name">${ex.name}</span>
        ${ex.nameEn ? `<span class="gym-ex-name-en">${ex.nameEn}</span>` : ''}
      </div>
      <span class="gym-ex-target">${ex.sets}\xD7${ex.reps}</span>
      <span class="gym-ex-muscle" style="color:${mInfo?.color || '#888'}">${mInfo?.name || ''}</span>`;
    exEl.appendChild(topDiv);

    if (ex.note) {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'gym-ex-note';
      noteDiv.textContent = '📌 ' + ex.note;
      exEl.appendChild(noteDiv);
    }
    if (ex.bw) {
      const bwNote = document.createElement('div');
      bwNote.className = 'gym-ex-note';
      bwNote.textContent = 'Власна вага — введи повторення';
      exEl.appendChild(bwNote);
    }

    const imgSlot = document.createElement('div');
    imgSlot.className = 'gym-img-slot';
    imgSlot.id = 'gym_img_' + ex.id;
    exEl.appendChild(imgSlot);

    /* Log row */
    const logRow = document.createElement('div');
    logRow.className = 'gym-log-row';
    if (!ex.bw) {
      const wInp = document.createElement('input');
      wInp.className = 'gym-inp'; wInp.id = 'gw_' + ex.id;
      wInp.type = 'number'; wInp.inputMode = 'decimal';
      wInp.placeholder = 'кг'; wInp.value = defW;
      logRow.appendChild(wInp);
    }
    const rInp = document.createElement('input');
    rInp.className = 'gym-inp'; rInp.id = 'gr_' + ex.id;
    rInp.type = 'number'; rInp.inputMode = 'numeric';
    rInp.placeholder = ex.reps === '—' ? 'сек/повт' : 'повт'; rInp.value = defR;
    logRow.appendChild(rInp);
    const sInp = document.createElement('input');
    sInp.className = 'gym-inp'; sInp.id = 'gs_' + ex.id;
    sInp.type = 'number'; sInp.inputMode = 'numeric';
    sInp.placeholder = 'підх'; sInp.value = defS;
    logRow.appendChild(sInp);
    const logBtn = document.createElement('button');
    logBtn.className = 'gym-log-btn';
    logBtn.textContent = 'Записати';
    logBtn.onclick = () => logExercise(ex.id);
    logRow.appendChild(logBtn);
    exEl.appendChild(logRow);

    /* Footer: last session + controls */
    const footer = document.createElement('div');
    footer.className = 'gym-ex-footer';
    if (last) {
      const d = new Date(last.date + 'T00:00:00').toLocaleDateString('uk-UA', { day:'numeric', month:'short' });
      footer.innerHTML = `<span class="gym-ex-last">↩ ${last.weight ? last.weight + ' кг × ' : ''}${last.reps} × ${last.sets} підх · ${d}</span>`;
    } else {
      footer.innerHTML = '<span class="gym-ex-last" style="opacity:.45">ще не записано</span>';
    }
    footer.innerHTML += '<span class="gym-prog-rule">Додавай вагу на верху діапазону ↑</span>';
    exEl.appendChild(footer);

    /* Edit controls (swap / remove) */
    const ctrlRow = document.createElement('div');
    ctrlRow.className = 'gym-ex-controls';
    const alt = EXERCISE_ALTERNATIVES[ex.id];
    if (alt) {
      const swapBtn = document.createElement('button');
      swapBtn.className = 'gym-swap-btn';
      swapBtn.textContent = '⇄ ' + alt.name;
      swapBtn.onclick = () => swapExercise(activeDay, ex.id);
      ctrlRow.appendChild(swapBtn);
    }
    const delBtn = document.createElement('button');
    delBtn.className = 'gym-del-btn';
    delBtn.textContent = '× Видалити';
    delBtn.onclick = () => removeExercise(activeDay, ex.id);
    ctrlRow.appendChild(delBtn);
    exEl.appendChild(ctrlRow);

    exCard.appendChild(exEl);
  });

  /* Add-exercise section */
  const addSection = document.createElement('div');
  addSection.className = 'gym-add-section';

  const addBtn = document.createElement('button');
  addBtn.className = 'gym-add-ex-btn';
  addBtn.textContent = '＋ Додати вправу';
  addSection.appendChild(addBtn);

  const addList = document.createElement('div');
  addList.className = 'gym-add-list';
  addList.style.display = 'none';

  const currentExIds = new Set(exes.map(e => e.id));
  const bank = getExerciseBank().filter(e => !currentExIds.has(e.id));
  bank.forEach(e => {
    const mI  = MUSCLES.find(m => m.key === e.muscle);
    const item = document.createElement('div');
    item.className = 'gym-add-item';
    item.innerHTML = `<div class="gym-add-item-names">
        <span>${e.name}</span>
        ${e.nameEn ? `<span class="gym-ex-name-en">${e.nameEn}</span>` : ''}
      </div>
      <span class="gym-add-muscle" style="color:${mI?.color || '#888'}">${mI?.name || ''}</span>`;
    item.onclick = () => addExercise(activeDay, e.id);
    addList.appendChild(item);
  });
  addBtn.onclick = () => {
    const open = addList.style.display !== 'none';
    addList.style.display = open ? 'none' : 'block';
    addBtn.textContent = open ? '＋ Додати вправу' : '× Закрити список';
  };
  addSection.appendChild(addList);

  /* Reset-to-defaults button (only if day is customised) */
  if (gymProgram && gymProgram[activeDay]) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'gym-reset-prog-btn';
    resetBtn.textContent = '↺ Відновити початкову програму';
    resetBtn.onclick = async () => {
      delete gymProgram[activeDay];
      if (Object.keys(gymProgram).length === 0) gymProgram = null;
      await sset('app_gym_program', gymProgram);
      renderGym();
    };
    addSection.appendChild(resetBtn);
  }

  exCard.appendChild(addSection);
  wrap.appendChild(exCard);

  /* Populate image slots */
  exes.forEach(ex => {
    if (!ex.nameEn) return;
    const slot = $('gym_img_' + ex.id);
    if (!slot) return;
    if (ex.nameEn in gymImages) {
      setExerciseVisual(slot, ex, gymImages[ex.nameEn]);
    } else {
      fetchAndSetExerciseImage(ex);
    }
  });

  /* Bonus points card */
  const ptsCard = document.createElement('div');
  ptsCard.className = 'card gym-card';
  ptsCard.innerHTML = `
    <div>
      <div class="gym-label">Завершив тренування?</div>
      <div class="gym-sub">Додай бонусні поінти в очікування</div>
    </div>
    <button class="gym-btn" id="gymAddPtsBtn">+20 pts</button>`;
  wrap.appendChild(ptsCard);
  $('gymAddPtsBtn').onclick = async () => {
    await addPending(20, 'Зал');
    showNotif('Записано → +20 pts у очікуванні');
  };

  /* Body diagram placeholder (etap 2) */
  const bodyCard = document.createElement('div');
  bodyCard.className = 'card';
  bodyCard.style.cssText = 'text-align:center;opacity:.45;';
  bodyCard.innerHTML = `<div class="label">Схема тіла</div>
    <div style="padding:24px 0;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)">🚧 Etap 2 — в розробці</div>`;
  wrap.appendChild(bodyCard);
}

/* ---- Ранги page render ---- */

function renderRanks() {
  const wrap = $('ranksContent');
  if (!wrap) return;
  wrap.innerHTML = '';

  const hdr = document.createElement('h2');
  hdr.className = 'page';
  hdr.style.marginTop = '4px';
  hdr.textContent = 'Прогрес м\'язів';
  wrap.appendChild(hdr);

  /* Bodyweight note */
  const bwNote = document.createElement('div');
  bwNote.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--muted);margin:4px 2px 8px;';
  bwNote.textContent = `Моя вага: ${bodyWeight || 70} кг (змінити в Зал → Прогрес м'язів)`;
  wrap.appendChild(bwNote);

  MUSCLES.forEach(m => {
    const info      = getMuscleRankInfo(m.key);
    const rank      = info.rank;
    const cfg       = MUSCLE_LIFT_CONFIG[m.key];

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '10px';

    /* Rank row */
    let nextHtml = '';
    if (info.nextRank) {
      nextHtml = `<div class="rank-next-info">
        ${info.pct}% — залишилось ${100 - info.pct}% до
        <strong style="color:${info.nextRank.color}">${info.nextRank.name}</strong>
        (${info.nextThresholdDisplay})
      </div>`;
    } else {
      nextHtml = `<div class="rank-next-info rank-max">★ MAX RANK — Olympian досягнуто!</div>`;
    }

    card.innerHTML = `
      <div class="rank-muscle-row">
        <div class="muscle-rank-hex muscle-rank-hex--lg" style="--rcolor:${rank.color}">
          <span class="muscle-rank-lbl">${rank.lbl}</span>
        </div>
        <div class="rank-muscle-info">
          <div class="rank-muscle-name" style="color:${m.color}">${m.name}</div>
          <div class="rank-muscle-meta">${rank.name} · ${cfg.liftName}</div>
          <div class="rank-muscle-meta" style="margin-top:2px;color:var(--txt)">${info.display}</div>
        </div>
      </div>
      <div class="rank-bar" style="margin-top:10px">
        <div class="rank-fill" style="width:${info.pct}%;background:${rank.color}"></div>
      </div>
      ${nextHtml}`;

    /* Mini rank ladder for this muscle */
    const ladder = document.createElement('div');
    ladder.className = 'rank-ladder rank-ladder--compact';
    ladder.style.marginTop = '12px';
    MUSCLE_RANK_TIERS.forEach((tier, i) => {
      const achieved = info.val >= cfg.tiers[i];
      const isCurrent = i === MUSCLE_RANK_TIERS.indexOf(rank);
      const row = document.createElement('div');
      row.className = 'rank-ladder-row' + (isCurrent ? ' rank-ladder-current' : '');
      row.style.opacity = achieved ? '1' : '0.45';
      let thresholdStr;
      if (cfg.mode === 'bw')        thresholdStr = `${cfg.tiers[i]}×БВ`;
      else if (cfg.mode === 'reps') thresholdStr = `${cfg.tiers[i]} с`;
      else                          thresholdStr = `${cfg.tiers[i]} кг`;
      row.innerHTML = `
        <div class="muscle-rank-hex" style="--rcolor:${tier.color}">
          <span class="muscle-rank-lbl">${tier.lbl}</span>
        </div>
        <span class="rank-ladder-name" style="color:${tier.color}">${tier.name}</span>
        <span class="rank-ladder-levels">${thresholdStr}</span>
        ${isCurrent ? '<span class="rank-ladder-curr-badge">← зараз</span>' : ''}`;
      ladder.appendChild(row);
    });
    card.appendChild(ladder);
    wrap.appendChild(card);
  });
}
