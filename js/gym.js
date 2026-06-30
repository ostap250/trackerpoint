/* =====================================================================
   GYM MODULE — workout program, per-muscle XP / level / rank system
   Persisted in: app_gym  (new key, existing keys untouched)
                 app_gym_images (wger exercise image URL cache)
   ===================================================================== */

/* ---- Tunable constants ---- */

const MUSCLE_XP_SCALE = 1000;
function xpForLevel(n) { return Math.round(MUSCLE_XP_SCALE * Math.pow(n, 1.5)); }

const MUSCLE_RANK_TIERS = [
  { name:'Wood',     lbl:'W', minLevel:1,  color:'#C49A6C' },
  { name:'Bronze',   lbl:'B', minLevel:5,  color:'#CD7F32' },
  { name:'Silver',   lbl:'S', minLevel:10, color:'#9EA8BC' },
  { name:'Gold',     lbl:'G', minLevel:15, color:'#E0A646' },
  { name:'Platinum', lbl:'P', minLevel:20, color:'#4FB8CE' },
  { name:'Diamond',  lbl:'D', minLevel:25, color:'#8A7BE6' },
  { name:'Champion', lbl:'C', minLevel:30, color:'#E879B9' },
  { name:'Titan',    lbl:'T', minLevel:40, color:'#E4574E' },
  { name:'Olympian', lbl:'O', minLevel:50, color:'#F5C518' },
];

const MUSCLES = [
  { key:'chest',     name:'Груди',  color:'#E4574E' },
  { key:'back',      name:'Спина',  color:'#4FB8CE' },
  { key:'legs',      name:'Ноги',   color:'#38B89A' },
  { key:'shoulders', name:'Плечі',  color:'#8A7BE6' },
  { key:'arms',      name:'Руки',   color:'#E879B9' },
  { key:'core',      name:'Корпус', color:'#E0A646' },
];

const GYM_DAYS = [
  {
    id: 'A', name: 'День A', subtitle: 'Full Body · Сила', optional: false,
    exercises: [
      { id:'squat',   name:'Присідання',               nameEn:'Squat',                  muscle:'legs',      sets:3, reps:'5',    bw:false },
      { id:'bench',   name:'Жим лежачи',               nameEn:'Bench press',            muscle:'chest',     sets:3, reps:'5',    bw:false, note:'+2.5 кг коли всі підходи виконано з чистою технікою' },
      { id:'b_row',   name:'Тяга штанги в нахилі',    nameEn:'Barbell row',            muscle:'back',      sets:4, reps:'6',    bw:false, note:'Лямки.' },
      { id:'lat_pd',  name:'Тяга верхнього блоку',    nameEn:'Lat pulldown',           muscle:'back',      sets:3, reps:'10',   bw:false },
      { id:'lat_rA',  name:'Розведення гантелей',      nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'tri_pd',  name:'Трицепс на блоці',         nameEn:'Triceps pushdown',       muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'B', name: 'День B', subtitle: 'Full Body · Гіпертрофія', optional: false,
    exercises: [
      { id:'rdl',     name:'Румунська тяга',           nameEn:'Romanian deadlift',      muscle:'legs',      sets:3, reps:'8',    bw:false, note:'Лямки.' },
      { id:'inc_db',  name:'Жим гантелей похилий',    nameEn:'Incline dumbbell press', muscle:'chest',     sets:4, reps:'8-10', bw:false },
      { id:'db_row',  name:'Тяга гантелі (одна рука)',nameEn:'One-arm dumbbell row',   muscle:'back',      sets:3, reps:'10',   bw:false, note:'На сторону. Лямки.' },
      { id:'leg_pr',  name:'Жим ногами',               nameEn:'Leg press',              muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'lat_rB',  name:'Розведення гантелей',      nameEn:'Lateral raise',          muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'bi_curl', name:'Згинання біцепс',          nameEn:'Biceps curl',            muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'C', name: 'День C', subtitle: 'Бонус — опціонально', optional: true,
    exercises: [
      { id:'pullup',  name:'Підтягування / з допомогою', nameEn:'Pull-ups',             muscle:'back',      sets:3, reps:'max',  bw:true,  bwBase:15 },
      { id:'cable_x', name:'Зведення на блоці',          nameEn:'Cable crossover',      muscle:'chest',     sets:3, reps:'15',   bw:false },
      { id:'lat_rC',  name:'Розведення гантелей',        nameEn:'Lateral raise',        muscle:'shoulders', sets:3, reps:'20',   bw:false },
      { id:'lunges',  name:'Випади ходьбою',             nameEn:'Walking lunges',       muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'bi_tri',  name:'Суперсет біцепс + трицепс', nameEn:'Biceps curl',          muscle:'arms',      sets:3, reps:'15',   bw:false },
      { id:'core_ex', name:'Планка + підйом ніг',        nameEn:'Plank',                muscle:'core',      sets:3, reps:'—',    bw:true,  bwBase:25 },
    ],
  },
];

/* ---- Rank / XP helpers ---- */

function getMuscleRank(level) {
  for (let i = MUSCLE_RANK_TIERS.length - 1; i >= 0; i--) {
    if (level >= MUSCLE_RANK_TIERS[i].minLevel) return MUSCLE_RANK_TIERS[i];
  }
  return MUSCLE_RANK_TIERS[0];
}

function fmtXp(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'k';
  return String(n);
}

/* Total XP to go from (fromLevel, fromXp already earned in that level) to the start of toLevel */
function xpToReachLevel(fromLevel, fromXp, toLevel) {
  if (toLevel <= fromLevel) return 0;
  let total = xpForLevel(fromLevel) - fromXp;
  for (let l = fromLevel + 1; l < toLevel; l++) total += xpForLevel(l);
  return Math.max(0, total);
}

function addMuscleXP(muscleKey, xpGained) {
  const m = gymData.muscles[muscleKey];
  m.xp += xpGained;
  let levelsGained = 0;
  while (m.xp >= xpForLevel(m.level)) {
    m.xp -= xpForLevel(m.level);
    m.level++;
    levelsGained++;
  }
  return levelsGained;
}

function lastEntry(exId) {
  return gymData.workoutLog.find(e => e.exId === exId);
}

function defaultRepsNum(repsStr) {
  const n = parseInt(repsStr, 10);
  return isNaN(n) ? '' : n;
}

function initGymData() {
  const muscles = {};
  MUSCLES.forEach(m => { muscles[m.key] = { level:1, xp:0 }; });
  return { muscles, workoutLog:[] };
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
          const ir = await fetch('https://wger.de/api/v2/exerciseimage/?format=json&exercise=' + baseId);
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

/* ---- Log an exercise set (called from inline onclick) ---- */
async function logExercise(exId) {
  const day = GYM_DAYS.find(d => d.id === activeDay);
  if (!day) return;
  const ex = day.exercises.find(e => e.id === exId);
  if (!ex) return;

  const wEl = $('gw_' + exId);
  const rEl = $('gr_' + exId);
  const sEl = $('gs_' + exId);

  const weight = wEl ? (+wEl.value || 0) : 0;
  const reps   = +rEl?.value || 0;
  const sets   = +sEl?.value || ex.sets;

  if (!ex.bw && weight <= 0) { showNotif('Введи вагу (кг)'); return; }
  if (reps <= 0)              { showNotif('Введи кількість повторень'); return; }

  const xp = ex.bw
    ? Math.round((ex.bwBase || 10) * reps * sets)
    : Math.round(weight * reps * sets);

  const entry = {
    id:     newId(),
    date:   torontoNow().date,
    dayId:  activeDay,
    exId,
    exName: ex.name,
    weight: ex.bw ? 0 : weight,
    reps, sets, xp,
    muscle: ex.muscle,
  };
  gymData.workoutLog.unshift(entry);
  if (gymData.workoutLog.length > 500) gymData.workoutLog = gymData.workoutLog.slice(0, 500);

  const levelsGained = addMuscleXP(ex.muscle, xp);
  await sset('app_gym', gymData);

  const mInfo = MUSCLES.find(m => m.key === ex.muscle);
  if (levelsGained > 0) {
    const rank = getMuscleRank(gymData.muscles[ex.muscle].level);
    showNotif(`⬆ ${mInfo.name} → Lv ${gymData.muscles[ex.muscle].level} · ${rank.name}!`);
  } else {
    showNotif(`✓ ${ex.name} — +${xp} XP · ${mInfo.name}`);
  }

  renderGym();
  renderRanks();
}

/* ---- Зал page render ---- */
function renderGym() {
  const wrap = $('gymContent');
  wrap.innerHTML = '';

  /* Warmup */
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
  mp.innerHTML = '<div class="label" style="margin-bottom:12px">Прогрес м\'язів</div>';
  const grid = document.createElement('div');
  grid.className = 'muscles-grid';
  MUSCLES.forEach(m => {
    const md     = gymData.muscles[m.key];
    const rank   = getMuscleRank(md.level);
    const xpNeed = xpForLevel(md.level);
    const pct    = Math.min(100, (md.xp / xpNeed) * 100);
    const cell   = document.createElement('div');
    cell.className = 'muscle-cell';
    cell.innerHTML = `
      <div class="muscle-cell-row">
        <div class="muscle-rank-hex" style="--rcolor:${rank.color}">
          <span class="muscle-rank-lbl">${rank.lbl}</span>
        </div>
        <div class="muscle-info">
          <div class="muscle-name" style="color:${m.color}">${m.name}</div>
          <div class="muscle-level">Lv ${md.level} · ${rank.name}</div>
          <div class="rank-bar" style="margin-top:5px">
            <div class="rank-fill" style="width:${pct}%;background:${rank.color}"></div>
          </div>
          <div class="muscle-xp-txt">${md.xp} / ${xpNeed} XP</div>
        </div>
      </div>`;
    grid.appendChild(cell);
  });
  mp.appendChild(grid);
  wrap.appendChild(mp);

  /* Day selector */
  const ds = document.createElement('div');
  ds.className = 'day-selector';
  GYM_DAYS.forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'day-btn' + (activeDay === day.id ? ' active' : '');
    if (day.optional) btn.className += ' day-optional-btn';
    btn.innerHTML = `<span class="day-btn-name">${day.name}</span><span class="day-btn-sub">${day.subtitle}</span>`;
    btn.onclick = () => { activeDay = day.id; renderGym(); };
    ds.appendChild(btn);
  });
  wrap.appendChild(ds);

  /* Exercise cards */
  const day = GYM_DAYS.find(d => d.id === activeDay);
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

  day.exercises.forEach(ex => {
    const last  = lastEntry(ex.id);
    const mInfo = MUSCLES.find(m => m.key === ex.muscle);
    const defW  = last && !ex.bw ? last.weight : '';
    const defR  = last ? last.reps : defaultRepsNum(ex.reps);
    const defS  = last ? last.sets : ex.sets;

    const exEl = document.createElement('div');
    exEl.className = 'gym-ex';
    exEl.innerHTML = `
      <div class="gym-ex-top">
        <div class="gym-ex-names">
          <span class="gym-ex-name">${ex.name}</span>
          ${ex.nameEn ? `<span class="gym-ex-name-en">${ex.nameEn}</span>` : ''}
        </div>
        <span class="gym-ex-target">${ex.sets}\xD7${ex.reps}</span>
        <span class="gym-ex-muscle" style="color:${mInfo?.color || '#888'}">${mInfo?.name || ''}</span>
      </div>
      ${ex.note ? `<div class="gym-ex-note">📌 ${ex.note}</div>` : ''}
      ${ex.bw ? `<div class="gym-ex-note">Власна вага — введи повторення</div>` : ''}
      <div class="gym-img-slot" id="gym_img_${ex.id}"></div>
      <div class="gym-log-row">
        ${ex.bw ? '' : `<input class="gym-inp" id="gw_${ex.id}" type="number" inputmode="decimal" placeholder="кг" value="${defW}" />`}
        <input class="gym-inp" id="gr_${ex.id}" type="number" inputmode="numeric" placeholder="${ex.reps === '—' ? 'сек/повт' : 'повт'}" value="${defR}" />
        <input class="gym-inp" id="gs_${ex.id}" type="number" inputmode="numeric" placeholder="підх" value="${defS}" />
        <button class="gym-log-btn" onclick="logExercise('${ex.id}')">Записати</button>
      </div>
      <div class="gym-ex-footer">
        ${last
          ? `<span class="gym-ex-last">↩ ${last.weight ? last.weight + ' кг \xD7 ' : ''}${last.reps} \xD7 ${last.sets} підх · +${last.xp} XP · ${new Date(last.date + 'T00:00:00').toLocaleDateString('uk-UA',{day:'numeric',month:'short'})}</span>`
          : '<span class="gym-ex-last" style="opacity:.45">ще не записано</span>'}
        <span class="gym-prog-rule">Додавай вагу на верху діапазону ↑</span>
      </div>`;
    exCard.appendChild(exEl);
  });

  wrap.appendChild(exCard);

  /* Populate image slots (sync from cache; async fetch for unknowns) */
  day.exercises.forEach(ex => {
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

  /* Per-muscle detailed progress */
  const hdr = document.createElement('h2');
  hdr.className = 'page';
  hdr.style.marginTop = '4px';
  hdr.textContent = 'Прогрес м\'язів';
  wrap.appendChild(hdr);

  MUSCLES.forEach(m => {
    const md       = gymData.muscles[m.key];
    const rank     = getMuscleRank(md.level);
    const xpForLev = xpForLevel(md.level);
    const pct      = Math.min(100, Math.round((md.xp / xpForLev) * 100));
    const rankIdx  = MUSCLE_RANK_TIERS.indexOf(rank);
    const nextRank = MUSCLE_RANK_TIERS[rankIdx + 1] || null;

    let nextHtml = '';
    if (nextRank) {
      const xpNeeded = xpToReachLevel(md.level, md.xp, nextRank.minLevel);
      nextHtml = `<div class="rank-next-info">
        → до <strong style="color:${nextRank.color}">${nextRank.name}</strong>
        (Lv ${nextRank.minLevel}): ще <strong>${fmtXp(xpNeeded)} XP</strong>
      </div>`;
    } else {
      nextHtml = `<div class="rank-next-info rank-max">🏆 MAX RANK — Olympian досягнуто!</div>`;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '10px';
    card.innerHTML = `
      <div class="rank-muscle-row">
        <div class="muscle-rank-hex muscle-rank-hex--lg" style="--rcolor:${rank.color}">
          <span class="muscle-rank-lbl">${rank.lbl}</span>
        </div>
        <div class="rank-muscle-info">
          <div class="rank-muscle-name" style="color:${m.color}">${m.name}</div>
          <div class="rank-muscle-meta">Lv ${md.level} · ${rank.name}</div>
        </div>
      </div>
      <div class="rank-bar" style="margin-top:10px">
        <div class="rank-fill" style="width:${pct}%;background:${rank.color}"></div>
      </div>
      <div class="rank-muscle-xp">${md.xp.toLocaleString()} / ${xpForLev.toLocaleString()} XP (поточний рівень)</div>
      ${nextHtml}`;
    wrap.appendChild(card);
  });

  /* Full rank ladder */
  const ladderCard = document.createElement('div');
  ladderCard.className = 'card';
  ladderCard.style.marginTop = '18px';
  ladderCard.innerHTML = '<div class="label" style="margin-bottom:12px">Таблиця рангів</div>';
  const table = document.createElement('div');
  table.className = 'rank-ladder';
  MUSCLE_RANK_TIERS.forEach((tier, i) => {
    const nextTier   = MUSCLE_RANK_TIERS[i + 1];
    const levelRange = nextTier
      ? `Lv ${tier.minLevel}–${nextTier.minLevel - 1}`
      : `Lv ${tier.minLevel}+`;
    const row = document.createElement('div');
    row.className = 'rank-ladder-row';
    row.innerHTML = `
      <div class="muscle-rank-hex" style="--rcolor:${tier.color}">
        <span class="muscle-rank-lbl">${tier.lbl}</span>
      </div>
      <span class="rank-ladder-name" style="color:${tier.color}">${tier.name}</span>
      <span class="rank-ladder-levels">${levelRange}</span>`;
    table.appendChild(row);
  });
  ladderCard.appendChild(table);
  wrap.appendChild(ladderCard);
}
