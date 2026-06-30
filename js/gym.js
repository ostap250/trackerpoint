/* =====================================================================
   GYM MODULE — workout program, per-muscle XP / level / rank system
   Persisted in: app_gym  (new key, existing keys untouched)
   ===================================================================== */

/* ---- Tunable constants ---- */

/* XP needed to level up from level n to n+1.
   Curve: 1000 × n^1.5  →  Lv1→2 = 1000 XP,  Lv5→6 = 5590,  Lv10→11 = 31623
   Typical session (bench 80kg×5×3 = 1200 XP) → ~1 session per early level-up. */
const MUSCLE_XP_SCALE = 1000;
function xpForLevel(n) { return Math.round(MUSCLE_XP_SCALE * Math.pow(n, 1.5)); }

/* Rank tier boundaries (by level).  Tune freely — just a display label. */
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

/* ---- Muscle groups ---- */
const MUSCLES = [
  { key:'chest',     name:'Груди',  color:'#E4574E' },
  { key:'back',      name:'Спина',  color:'#4FB8CE' },
  { key:'legs',      name:'Ноги',   color:'#38B89A' },
  { key:'shoulders', name:'Плечі',  color:'#8A7BE6' },
  { key:'arms',      name:'Руки',   color:'#E879B9' },
  { key:'core',      name:'Корпус', color:'#E0A646' },
];

/* ---- Workout program ---- */
const GYM_DAYS = [
  {
    id: 'A',
    name: 'День A',
    subtitle: 'Full Body · Сила',
    optional: false,
    exercises: [
      { id:'squat',   name:'Присідання',                 muscle:'legs',      sets:3, reps:'5',    bw:false },
      { id:'bench',   name:'Жим лежачи',                 muscle:'chest',     sets:3, reps:'5',    bw:false, note:'+2.5 кг коли всі підходи виконано з чистою технікою' },
      { id:'b_row',   name:'Тяга штанги в нахилі',      muscle:'back',      sets:4, reps:'6',    bw:false, note:'Лямки.' },
      { id:'lat_pd',  name:'Тяга верхнього блоку',      muscle:'back',      sets:3, reps:'10',   bw:false },
      { id:'lat_rA',  name:'Розведення гантелей',        muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'tri_pd',  name:'Трицепс на блоці',           muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'B',
    name: 'День B',
    subtitle: 'Full Body · Гіпертрофія',
    optional: false,
    exercises: [
      { id:'rdl',     name:'Румунська тяга',             muscle:'legs',      sets:3, reps:'8',    bw:false, note:'Лямки.' },
      { id:'inc_db',  name:'Жим гантелей похилий',      muscle:'chest',     sets:4, reps:'8-10', bw:false },
      { id:'db_row',  name:'Тяга гантелі (одна рука)',  muscle:'back',      sets:3, reps:'10',   bw:false, note:'На сторону. Лямки.' },
      { id:'leg_pr',  name:'Жим ногами',                 muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'lat_rB',  name:'Розведення гантелей',        muscle:'shoulders', sets:3, reps:'15',   bw:false },
      { id:'bi_curl', name:'Згинання біцепс',            muscle:'arms',      sets:3, reps:'12',   bw:false },
    ],
  },
  {
    id: 'C',
    name: 'День C',
    subtitle: 'Бонус — опціонально',
    optional: true,
    exercises: [
      { id:'pullup',  name:'Підтягування / з допомогою', muscle:'back',      sets:3, reps:'max',  bw:true,  bwBase:15 },
      { id:'cable_x', name:'Зведення на блоці',          muscle:'chest',     sets:3, reps:'15',   bw:false },
      { id:'lat_rC',  name:'Розведення гантелей',        muscle:'shoulders', sets:3, reps:'20',   bw:false },
      { id:'lunges',  name:'Випади ходьбою',             muscle:'legs',      sets:3, reps:'12',   bw:false },
      { id:'bi_tri',  name:'Суперсет біцепс + трицепс', muscle:'arms',      sets:3, reps:'15',   bw:false },
      { id:'core_ex', name:'Планка + підйом ніг',        muscle:'core',      sets:3, reps:'—',    bw:true,  bwBase:25 },
    ],
  },
];

/* ---- Helpers ---- */
function getMuscleRank(level) {
  for (let i = MUSCLE_RANK_TIERS.length - 1; i >= 0; i--) {
    if (level >= MUSCLE_RANK_TIERS[i].minLevel) return MUSCLE_RANK_TIERS[i];
  }
  return MUSCLE_RANK_TIERS[0];
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

/* ---- Init default gym data ---- */
function initGymData() {
  const muscles = {};
  MUSCLES.forEach(m => { muscles[m.key] = { level:1, xp:0 }; });
  return { muscles, workoutLog:[] };
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
  if (reps <= 0) { showNotif('Введи кількість повторень'); return; }

  const xp = ex.bw
    ? Math.round((ex.bwBase || 10) * reps * sets)
    : Math.round(weight * reps * sets);

  const entry = {
    id:       newId(),
    date:     torontoNow().date,
    dayId:    activeDay,
    exId,
    exName:   ex.name,
    weight:   ex.bw ? 0 : weight,
    reps,
    sets,
    xp,
    muscle:   ex.muscle,
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
}

/* ---- Main render function ---- */
function renderGym() {
  const wrap = $('gymContent');
  wrap.innerHTML = '';

  /* --- Warmup card --- */
  const wu = document.createElement('div');
  wu.className = 'card';
  wu.innerHTML = `<div class="label">Розминка (щоразу перед тренуванням)</div>
    <ul class="gym-notes">
      <li>5 хв кардіо</li>
      <li>Band external rotations 2×15</li>
      <li>Face pulls 2×15</li>
    </ul>
    <div class="gym-constraint">⚠ NO overhead pressing (плечо). Лямки на тязі та RDL (зап'ясток).</div>
    <div class="gym-progress-rule">Прогресія: додавай вагу коли досягаєш верху діапазону повторень у всіх підходах з чистою технікою.</div>`;
  wrap.appendChild(wu);

  /* --- Muscle panel --- */
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

  /* --- Day selector --- */
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

  /* --- Exercise cards for selected day --- */
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
    const last    = lastEntry(ex.id);
    const mInfo   = MUSCLES.find(m => m.key === ex.muscle);
    const defW    = last && !ex.bw ? last.weight : '';
    const defR    = last ? last.reps : defaultRepsNum(ex.reps);
    const defS    = last ? last.sets : ex.sets;

    const exEl = document.createElement('div');
    exEl.className = 'gym-ex';
    exEl.innerHTML = `
      <div class="gym-ex-top">
        <span class="gym-ex-name">${ex.name}</span>
        <span class="gym-ex-target">${ex.sets}×${ex.reps}</span>
        <span class="gym-ex-muscle" style="color:${mInfo?.color || '#888'}">${mInfo?.name || ''}</span>
      </div>
      ${ex.note ? `<div class="gym-ex-note">📌 ${ex.note}</div>` : ''}
      ${ex.bw    ? `<div class="gym-ex-note">Власна вага — введи повторення</div>` : ''}
      <div class="gym-log-row">
        ${ex.bw ? '' : `<input class="gym-inp" id="gw_${ex.id}" type="number" inputmode="decimal" placeholder="кг" value="${defW}" />`}
        <input class="gym-inp" id="gr_${ex.id}" type="number" inputmode="numeric" placeholder="${ex.reps === '—' ? 'сек/повт' : 'повт'}" value="${defR}" />
        <input class="gym-inp" id="gs_${ex.id}" type="number" inputmode="numeric" placeholder="підх" value="${defS}" />
        <button class="gym-log-btn" onclick="logExercise('${ex.id}')">Записати</button>
      </div>
      <div class="gym-ex-footer">
        ${last
          ? `<span class="gym-ex-last">↩ ${last.weight ? last.weight + ' кг × ' : ''}${last.reps} × ${last.sets} підх · +${last.xp} XP · ${new Date(last.date + 'T00:00:00').toLocaleDateString('uk-UA',{day:'numeric',month:'short'})}</span>`
          : '<span class="gym-ex-last" style="opacity:.45">ще не записано</span>'}
        <span class="gym-prog-rule">Додавай вагу на верху діапазону ↑</span>
      </div>`;
    exCard.appendChild(exEl);
  });
  wrap.appendChild(exCard);

  /* --- Quick pending pts card --- */
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

  /* --- Body diagram placeholder (etap 2) --- */
  const bodyCard = document.createElement('div');
  bodyCard.className = 'card';
  bodyCard.style.cssText = 'text-align:center;opacity:.45;';
  bodyCard.innerHTML = `<div class="label">Схема тіла</div>
    <div style="padding:24px 0;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)">🚧 Etap 2 — в розробці</div>`;
  wrap.appendChild(bodyCard);
}
