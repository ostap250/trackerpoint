/* ---- Tab navigation ---- */
const ALL_TABS = ['main', 'gym', 'food', 'budget', 'goals', 'shop', 'stats', 'ranks'];

function switchTab(tabId) {
  /* ranks is a sub-page of gym — keep gym tab highlighted */
  const navTabId = tabId === 'ranks' ? 'gym' : tabId;
  document.querySelectorAll('.bnav-item').forEach(x => x.classList.remove('active'));
  const btn = document.querySelector(`.bnav-item[data-tab="${navTabId}"]`);
  if (btn) btn.classList.add('active');
  ALL_TABS.forEach(t => $(t).style.display = t === tabId ? 'block' : 'none');
  if (tabId === 'ranks') renderRanks();
}

document.querySelectorAll('.bnav-item').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

/* Home → navigate to Зал */
$('gymHomeBtn').onclick = () => switchTab('gym');

/* ---- App initialisation ---- */
(async function init() {
  /* Load persisted state */
  points    = await sget('app_points')     || { total:0, last:0 };
  history   = await sget('app_history')    || [];
  pending   = await sget('app_pending')    || [];
  pointsLog = await sget('app_points_log') || [];
  spendLog  = await sget('app_spend_log')  || [];
  tasksLog  = await sget('app_tasks_log')  || [];
  meals     = await sget('app_meals')      || [];
  gymData   = await sget('app_gym')        || initGymData();
  gymImages = await sget('app_gym_images') || {};
  gymProgram = await sget('app_gym_program') || null;
  bodyWeight = (await sget('app_bw')) || 70;

  /* Migrate: ensure all muscle keys present */
  MUSCLES.forEach(m => {
    if (!gymData.muscles[m.key]) gymData.muscles[m.key] = {};
  });
  if (!gymData.workoutLog) gymData.workoutLog = [];

  /* Calories — reset on new day, save snapshot of previous day */
  const storedCals  = await sget('app_cals')  || { date:today(), kcal:0, p:0, f:0, c:0 };
  const storedTasks = await sget('app_tasks') || { date:today(), items:[] };
  storedTasks.items = storedTasks.items.map(t => t.id ? t : { ...t, id:newId() });
  if (storedCals.date !== today()) await saveSnapshot(storedCals, storedTasks);
  cals  = storedCals.date === today() ? storedCals : { date:today(), kcal:0, p:0, f:0, c:0 };
  if (storedCals.date !== today()) await sset('app_cals', cals);
  tasks = storedTasks;
  await sset('app_tasks', tasks);

  /* Budget — reset on new week */
  budget = await sget('app_budget') || { weekStart:null, spent:{}, bonus:{} };
  if (!budget.bonus) budget.bonus = {};
  const wk = mondayOf(new Date()).toISOString();
  if (budget.weekStart !== wk) {
    budget = { weekStart:wk, spent:{}, bonus:{} };
    BUDGETS.forEach(b => { budget.spent[b.key] = 0; budget.bonus[b.key] = 0; });
    await sset('app_budget', budget);
  }
  BUDGETS.forEach(b => {
    if (budget.spent[b.key] == null) budget.spent[b.key] = 0;
    if (budget.bonus[b.key] == null) budget.bonus[b.key] = 0;
  });

  /* Goals — user-defined; start empty for new users */
  goals = await sget('app_goals') || [];
  goals = goals.filter(g => g != null); // compact any nulls from old data
  goals.forEach(g => { if (!g.difficulty) g.difficulty = 'normal'; });

  /* Initial render */
  renderQuote();
  renderPoints();
  renderPending();
  renderCals();
  renderMeals();
  renderTasks();
  renderBudget();
  renderGoals();
  renderStats();
  renderShop();
  renderGym();
  buildReminderQueue();
})();
