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
    narratorSay('rank_up');
  } else {
    const weightStr = ex.bw ? '' : `${weight} кг × `;
    showNotif(`✓ ${ex.name} — ${weightStr}${reps} × ${sets} підх`);
    narratorSay('log_gym');
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
    </ul>`;
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

  /* Forecast subsection */
  wrap.appendChild(renderGymForecast());

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

  /* Body diagram (etap 2) — regions colored by current muscle rank */
  wrap.appendChild(renderBodyDiagram());
}

/* ---- Progress forecast (підсекція в Залі) ---- */

/* least-squares slope of best lift per week; null when data is too sparse */
function muscleTrendPerWeek(muscleKey) {
  const cfg = MUSCLE_LIFT_CONFIG[muscleKey];
  const byDate = {};
  gymData.workoutLog.forEach(e => {
    if (!cfg.exIds.includes(e.exId)) return;
    const v = cfg.mode === 'reps' ? (e.reps || 0) : (e.weight || 0);
    if (v > (byDate[e.date] || 0)) byDate[e.date] = v;
  });
  const pts = Object.keys(byDate).sort()
    .map(d => ({ t: new Date(d + 'T00:00:00').getTime() / 86400000, v: byDate[d] }));
  if (pts.length < 2 || pts[pts.length - 1].t - pts[0].t < 5) return null;
  const n  = pts.length;
  const mt = pts.reduce((s, p) => s + p.t, 0) / n;
  const mv = pts.reduce((s, p) => s + p.v, 0) / n;
  let num = 0, den = 0;
  pts.forEach(p => { num += (p.t - mt) * (p.v - mv); den += (p.t - mt) * (p.t - mt); });
  return den ? (num / den) * 7 : null;
}

function renderGymForecast() {
  const card = document.createElement('div');
  card.className = 'card';
  const bw = bodyWeight > 0 ? bodyWeight : 70;
  const warns = [];
  let mRows = '', nRows = '';

  /* -- per-muscle ETA to next rank -- */
  MUSCLES.forEach(m => {
    const info = getMuscleRankInfo(m.key);
    if (info.best === 0) return;
    const slope = muscleTrendPerWeek(m.key);
    const unit  = MUSCLE_LIFT_CONFIG[m.key].mode === 'reps' ? 'с' : 'кг';
    let txt, cls = '';
    if (!info.nextRank) {
      txt = '★ MAX — тримай рівень'; cls = 'fc-ok';
    } else if (slope == null) {
      txt = 'мало даних — потрібно ще кілька записів у різні дні';
    } else if (slope <= 0.01) {
      txt = 'плато — вага не росте; перевір білок, сон і додавай навантаження';
      cls = 'fc-warn';
    } else {
      const rawNext = info.cfg.mode === 'bw' ? info.nextThreshold * bw : info.nextThreshold;
      const weeks   = Math.max(1, Math.ceil((rawNext - info.best) / slope));
      if (weeks > 26) {
        txt = `темп +${slope.toFixed(1)} ${unit}/тиж — до ${info.nextRank.name} понад пів року`;
        cls = 'fc-warn';
      } else {
        txt = `≈${weeks} тиж до ${info.nextRank.name} (темп +${slope.toFixed(1)} ${unit}/тиж)`;
        cls = 'fc-ok';
      }
    }
    mRows += `<div class="fc-row ${cls}"><span class="fc-name" style="color:${m.color}">${m.name}</span><span>${txt}</span></div>`;
  });
  if (!mRows) mRows = '<div class="fc-row">Запиши перші підходи — прогноз з\'явиться тут.</div>';

  /* -- nutrition (last logged days from history) -- */
  const fed = history.filter(h => h.kcal > 0).slice(0, 7);
  if (fed.length >= 3) {
    const avgP    = Math.round(fed.reduce((s, h) => s + (h.p || 0), 0) / fed.length);
    const avgKcal = Math.round(fed.reduce((s, h) => s + h.kcal, 0) / fed.length);
    const perKg   = avgP / bw;
    const pGoal   = Math.round(1.6 * bw);
    if (perKg < 1.4) {
      nRows += `<div class="fc-row fc-warn"><span>⚠ Білок ~${avgP} г/день (${perKg.toFixed(1)} г/кг). ` +
        `Для росту м'язів ціль ≥1.6 г/кг (≈${pGoal} г) — з поточною нормою м'язи прогресуватимуть повільніше.</span></div>`;
      warns.push('⚠ Білок нижче норми — м\'язи ростуть повільніше');
    } else {
      nRows += `<div class="fc-row fc-ok"><span>✓ Білок ~${avgP} г/день (${perKg.toFixed(1)} г/кг) — достатньо для росту.</span></div>`;
    }
    const kgWeek = ((avgKcal - KCAL_GOAL.kcal) * 7 / 7700);
    if (avgKcal < KCAL_GOAL.kcal * 0.85) {
      nRows += `<div class="fc-row fc-warn"><span>⚠ Калорії ~${avgKcal}/день — великий дефіцит: сила ростиме повільно, ` +
        `вага знижуватиметься ≈${Math.abs(kgWeek).toFixed(1)} кг/тиж.</span></div>`;
      warns.push('⚠ Великий дефіцит калорій — сила ростиме повільно');
    } else if (avgKcal > KCAL_GOAL.kcal * 1.1) {
      nRows += `<div class="fc-row"><span>Калорії ~${avgKcal}/день — профіцит: вага ростиме ≈${kgWeek.toFixed(1)} кг/тиж.</span></div>`;
    } else {
      nRows += `<div class="fc-row fc-ok"><span>✓ Калорії ~${avgKcal}/день — біля цілі ${KCAL_GOAL.kcal}.</span></div>`;
    }
  } else {
    nRows += '<div class="fc-row"><span>Логуй їжу щодня (мінімум 3 дні) — прогноз по білку і калоріях стане точнішим.</span></div>';
  }

  /* -- training frequency, last 14 days -- */
  const cutoff = Date.now() - 14 * 86400000;
  const trainDays = new Set(gymData.workoutLog
    .filter(e => new Date(e.date + 'T00:00:00').getTime() >= cutoff)
    .map(e => e.date));
  const perWeek = trainDays.size / 2;
  if (trainDays.size === 0) {
    nRows += '<div class="fc-row"><span>Тренувань за 2 тижні не записано.</span></div>';
  } else if (perWeek < 2) {
    nRows += `<div class="fc-row fc-warn"><span>⚠ ~${perWeek.toFixed(1)} трен/тиж — для стабільного прогресу треба 2–3.</span></div>`;
    warns.push('⚠ Менше 2 тренувань на тиждень — ранги ростимуть повільно');
  } else {
    nRows += `<div class="fc-row fc-ok"><span>✓ ~${perWeek.toFixed(1)} трен/тиж — хороший ритм.</span></div>`;
  }

  card.innerHTML = `<div class="label">Прогноз прогресу</div>
    <div class="fc-sub">М'язи — при поточному темпі</div>${mRows}
    <div class="fc-sub">Живлення і режим</div>${nRows}`;

  /* one notification per day for the top warning */
  if (warns.length) {
    sget('app_forecast_notif').then(async last => {
      if (last !== today()) {
        showNotif(warns[0]);
        await sset('app_forecast_notif', today());
      }
    });
  }
  return card;
}

/* ---- Body diagram: anatomical front/back figures, fill = rank color ---- */

function renderBodyDiagram() {
  const rank = {};
  MUSCLES.forEach(m => { rank[m.key] = getMuscleRankInfo(m.key); });
  const c = k => rank[k].rank.color;

  const card = document.createElement('div');
  card.className = 'card';

  /* symmetric muscle: emit shape + its mirror across vertical axis */
  const mir = (axis, inner) =>
    inner + `<g transform="translate(${axis * 2} 0) scale(-1 1)">${inner}</g>`;

  card.innerHTML = `
    <div class="label">Схема тіла</div>
    <div class="bd-wrap">
      <svg class="bd-svg" viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <g id="bdBase">
            <ellipse class="bd-base" cx="60" cy="18" rx="10.5" ry="12.5"/>
            <path class="bd-base" d="M54,29 L66,29 L65,40 L55,40 Z"/>
            <path class="bd-base" d="M60,39 C49,40 38,43 34,49 C30,56 29,68 30,82 C31,98 33,111 37,120 C41,130 49,136 60,136 C71,136 79,130 83,120 C87,111 89,98 90,82 C91,68 90,56 86,49 C82,43 71,40 60,39 Z"/>
            <path class="bd-base" d="M37,118 C36,130 40,140 46,144 L58,148 L60,142 L62,148 L74,144 C80,140 84,130 83,118 C70,126 50,126 37,118 Z"/>
            ${mir(60, `
              <path class="bd-base" d="M34,49 C28,53 25,60 24,69 L23,96 C23,100 25,103 28,103 C31,103 33,100 33,96 L35,68 C36,59 36,52 34,49 Z"/>
              <path class="bd-base" d="M28,103 C26,110 24,120 23,130 C22,137 23,143 26,148 C28,151 31,150 32,146 C33,138 33,126 33,112 C33,108 31,104 28,103 Z"/>
              <path class="bd-base" d="M43,136 C38,144 36,158 37,176 C38,190 41,200 46,202 C52,203 56,197 57,187 L58,150 C57,142 51,136 43,136 Z"/>
              <path class="bd-base" d="M42,206 C40,214 39,226 40,240 C41,252 44,261 47,263 C51,264 54,258 55,248 L55,220 C54,211 49,205 42,206 Z"/>
              <ellipse class="bd-base" cx="47" cy="271" rx="8" ry="4.5"/>`)}
          </g>
        </defs>

        <!-- FRONT -->
        <use href="#bdBase"/>
        ${mir(60, `
          <path class="bd-m" data-m="shoulders" fill="${c('shoulders')}" d="M35,47 C29,49 26,55 26,62 C30,66 36,65 39,60 C40,54 38,49 36,47 Z"/>
          <path class="bd-m" data-m="chest" fill="${c('chest')}" d="M60.8,45 C51,45 43,48 40,53 C38,58 40,64 45,67 C51,70 58,70 60.8,68 Z"/>
          <ellipse class="bd-m" data-m="arms" fill="${c('arms')}" cx="29.5" cy="79" rx="5.5" ry="12" transform="rotate(6 29.5 79)"/>
          <path class="bd-m" data-m="core" fill="${c('core')}" opacity=".8" d="M47,76 C44,80 43,88 43,98 C43,106 45,112 48,115 L48,76 Z"/>
          <path class="bd-m" data-m="legs" fill="${c('legs')}" d="M44,140 C39,147 37,159 38,175 C39,187 42,196 47,198 C52,196 55,188 55,177 L55,153 C54,145 50,139 44,140 Z"/>`)}
        <g class="bd-m" data-m="core">
          <path fill="${c('core')}" d="M52,72 C50,74 49,78 49,84 L49,109 C49,115 53,119 60,119 C67,119 71,115 71,109 L71,84 C71,78 70,74 68,72 C64,71 56,71 52,72 Z"/>
          <g stroke="#0E1117" stroke-opacity=".45" stroke-width="1.3">
            <line x1="60" y1="72" x2="60" y2="119"/>
            <line x1="50" y1="85" x2="70" y2="85"/>
            <line x1="50" y1="97" x2="70" y2="97"/>
            <line x1="51" y1="108" x2="69" y2="108"/>
          </g>
        </g>
        <text class="bd-fig-lbl" x="60" y="293">СПЕРЕДУ</text>

        <!-- BACK -->
        <use href="#bdBase" x="120"/>
        <path class="bd-m" data-m="back" fill="${c('back')}" d="M180,33 C171,35 162,39 158,45 C165,49 171,57 175,68 C177,73 183,73 185,68 C189,57 195,49 202,45 C198,39 189,35 180,33 Z"/>
        ${mir(180, `
          <ellipse class="bd-m" data-m="shoulders" fill="${c('shoulders')}" cx="151" cy="55" rx="6.5" ry="9" transform="rotate(-14 151 55)"/>
          <path class="bd-m" data-m="back" fill="${c('back')}" opacity=".85" d="M161,57 C157,61 155,67 156,73 C160,76 166,73 168,68 C167,62 165,58 161,57 Z"/>
          <path class="bd-m" data-m="back" fill="${c('back')}" d="M162,64 C157,70 155,80 157,90 C161,100 169,108 177,111 L177,77 C173,70 168,66 162,64 Z"/>
          <rect class="bd-m" data-m="core" fill="${c('core')}" opacity=".8" x="174.5" y="93" width="5" height="30" rx="2.5"/>
          <ellipse class="bd-m" data-m="arms" fill="${c('arms')}" cx="149" cy="80" rx="5.5" ry="12" transform="rotate(-6 149 80)"/>
          <ellipse class="bd-m" data-m="legs" fill="${c('legs')}" cx="170" cy="137" rx="10" ry="9"/>
          <path class="bd-m" data-m="legs" fill="${c('legs')}" d="M164,150 C159,157 157,169 158,182 C159,192 162,199 166,201 C171,200 174,192 174,182 L174,161 C173,154 169,149 164,150 Z"/>
          <ellipse class="bd-m" data-m="legs" fill="${c('legs')}" cx="165.5" cy="231" rx="6.5" ry="16"/>
          <ellipse class="bd-m" data-m="legs" fill="${c('legs')}" cx="172" cy="227" rx="4" ry="11"/>`)}
        <text class="bd-fig-lbl" x="180" y="293">ЗЗАДУ</text>
      </svg>
    </div>
    <div class="bd-caption" id="bdCaption">Тапни на м'яз — побачиш ранг</div>
    <div class="bd-legend">
      ${MUSCLES.map(m => `<span class="bd-legend-item">
        <span class="bd-legend-dot" style="background:${c(m.key)}"></span>${m.name}
      </span>`).join('')}
    </div>`;

  /* tap a region → highlight all its shapes + show rank caption */
  card.querySelector('.bd-svg').addEventListener('click', e => {
    const shape = e.target.closest('.bd-m');
    if (!shape) return;
    const key   = shape.dataset.m;
    const m     = MUSCLES.find(x => x.key === key);
    const info  = rank[key];
    card.querySelectorAll('.bd-m').forEach(s =>
      s.classList.toggle('bd-sel', s.dataset.m === key));
    const cap = card.querySelector('#bdCaption');
    cap.textContent = `${m.name} — ${info.rank.name}` +
      (info.nextRank ? ` · ${info.pct}% → ${info.nextRank.name}` : ' · ★ MAX');
    cap.style.color = info.rank.color;
  });

  return card;
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
