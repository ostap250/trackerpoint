const MAC = [
  { k:'p', n:'Білки', c:'#38B89A' },
  { k:'f', n:'Жири',  c:'#E0A646' },
  { k:'c', n:'Вугл',  c:'#4FB8CE' },
];

/* ---- Calories display ---- */
function renderCals() {
  $('kcalNow').textContent  = Math.round(cals.kcal);
  $('kcalGoal').textContent = ` / ${KCAL_GOAL.kcal} ккал`;
  $('kcalReset').textContent = 'рахуй щоб знати';
  $('macros').innerHTML = '';
  MAC.forEach(m => {
    const v    = cals[m.k];
    const goal = KCAL_GOAL[m.k];
    const r    = Math.min(1, v / goal);
    const el   = document.createElement('div');
    el.className = 'macro';
    el.innerHTML = `<div class="mlabel">${m.n}</div>
      <div class="mval">${Math.round(v)}<span style="color:var(--muted);font-size:11px"> / ${goal}г</span></div>
      <div class="mbar"><div class="mfill" style="width:${r*100}%;background:${m.c}"></div></div>`;
    $('macros').appendChild(el);
  });
}

$('addFood').onclick = async () => {
  const k = +$('fKcal').value || 0;
  const p = +$('fP').value    || 0;
  const f = +$('fF').value    || 0;
  const c = +$('fC').value    || 0;
  if (!(k || p || f || c)) return;
  cals.kcal += k; cals.p += p; cals.f += f; cals.c += c;
  ['fKcal','fP','fF','fC'].forEach(id => $(id).value = '');
  await sset('app_cals', cals);
  renderCals();
  narratorSay('log_food');
};

$('kcalReset2').onclick = async () => {
  cals = { date:today(), kcal:0, p:0, f:0, c:0 };
  await sset('app_cals', cals);
  renderCals();
};

/* ---- Meal database ---- */
function renderMeals() {
  $('mealsCount').textContent = meals.length;
  const list = $('mealsList');
  list.innerHTML = '';
  if (!meals.length) {
    list.innerHTML = '<div class="empty-note" style="padding:8px 0">Додай першу страву</div>';
    return;
  }
  meals.forEach(m => {
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `<div class="meal-row-name">${m.name.replace(/</g,'&lt;')}</div>
      <div class="meal-row-meta">${m.kcal} ккал · Б${m.p} Ж${m.f} В${m.c}</div>
      <button class="meal-del" data-id="${m.id}">×</button>`;
    row.querySelector('.meal-del').onclick = async () => {
      meals = meals.filter(x => x.id !== m.id);
      await sset('app_meals', meals);
      renderMeals();
    };
    list.appendChild(row);
  });
}

$('saveMeal').onclick = async () => {
  const name = $('mealName').value.trim();
  if (!name) return;
  const m = {
    id:   newId(),
    name,
    kcal: +$('mealKcal').value  || 0,
    p:    +$('mealPro').value   || 0,
    f:    +$('mealFat').value   || 0,
    c:    +$('mealCarb').value  || 0,
  };
  meals.push(m);
  await sset('app_meals', meals);
  renderMeals();
  ['mealName','mealKcal','mealPro','mealFat','mealCarb'].forEach(id => $(id).value = '');
  showNotif(`${name} збережено`);
};

$('toggleMeals').onclick = () => {
  const c = $('mealsContent');
  const showing = c.style.display === 'block';
  c.style.display = showing ? 'none' : 'block';
  $('toggleMeals').textContent = showing ? 'Показати' : 'Сховати';
};

/* ---- Meal portion picker ---- */
function renderMealSelected() {
  if (!selectedMeal) { $('mealSelected').style.display = 'none'; return; }
  const m = selectedMeal, x = mealMult;
  const sel = $('mealSelected');
  sel.style.display = 'block';
  sel.innerHTML = `<div class="meal-sel-name">${m.name.replace(/</g,'&lt;')}</div>
    <div class="meal-sel-info">${Math.round(m.kcal*x)} ккал · Б${Math.round(m.p*x)} Ж${Math.round(m.f*x)} В${Math.round(m.c*x)}</div>
    <div class="meal-mult-row">
      ${[0.5,1,2,3].map(v => `<button class="meal-mult${v===x?' active':''}" data-v="${v}">×${v}</button>`).join('')}
    </div>
    <button class="meal-add-btn" id="addMealLog">Додати до сьогодні</button>`;
  sel.querySelectorAll('.meal-mult').forEach(b => b.onclick = () => {
    mealMult = +b.dataset.v;
    renderMealSelected();
  });
  sel.querySelector('#addMealLog').onclick = async () => {
    cals.kcal += m.kcal * mealMult;
    cals.p    += m.p    * mealMult;
    cals.f    += m.f    * mealMult;
    cals.c    += m.c    * mealMult;
    await sset('app_cals', cals);
    renderCals();
    $('mealSearch').value = '';
    $('mealResults').innerHTML = '';
    selectedMeal = null;
    mealMult = 1;
    $('mealSelected').style.display = 'none';
    showNotif(`${m.name} ×${mealMult > 1 ? mealMult : 1} додано`);
  };
}

/* ---- Meal search ---- */
$('mealSearch').addEventListener('input', () => {
  const q   = $('mealSearch').value.trim().toLowerCase();
  const res = $('mealResults');
  res.innerHTML = '';
  selectedMeal = null;
  $('mealSelected').style.display = 'none';
  if (!q) return;
  const hits = meals.filter(m => m.name.toLowerCase().includes(q)).slice(0, 5);
  if (!hits.length) {
    res.innerHTML = '<div class="meal-res-item" style="color:var(--muted)">Не знайдено</div>';
    return;
  }
  hits.forEach(m => {
    const el = document.createElement('div');
    el.className = 'meal-res-item';
    el.innerHTML = `${m.name.replace(/</g,'&lt;')}<div class="meal-res-meta">${m.kcal} ккал · Б${m.p} Ж${m.f} В${m.c}</div>`;
    el.onclick = () => {
      selectedMeal = m;
      mealMult = 1;
      res.innerHTML = '';
      $('mealSearch').value = m.name;
      renderMealSelected();
    };
    res.appendChild(el);
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.meal-search-wrap') && !e.target.closest('#mealSelected'))
    $('mealResults').innerHTML = '';
});
