/* ---- Task logging ---- */
async function logTaskDone(t) {
  tasksLog.unshift({ id:newId(), text:t.text, date:torontoNow().date });
  if (tasksLog.length > 300) tasksLog = tasksLog.slice(0, 300);
  await sset('app_tasks_log', tasksLog);
}

/* ---- Task row builder ---- */
function makeTaskRow(t, onToggle, onDelete) {
  const todayStr  = torontoNow().date;
  const isOverdue = t.dueDate && t.dueDate < todayStr;
  const row       = document.createElement('div');
  row.className   = 'task' + (t.done ? ' done' : '');
  const dueLabel  = t.dueDate
    ? `<span class="task-due${isOverdue ? ' task-overdue' : ''}">${fmtDate(t.dueDate)}${t.dueTime ? ' · ' + t.dueTime : ''}</span>`
    : '';
  row.innerHTML = `<div class="checkbox">${t.done ? '✓' : ''}</div>
    <div class="ttext">${t.text.replace(/</g,'&lt;')}${dueLabel}</div>
    <button class="tdel">×</button>`;
  row.querySelector('.checkbox').onclick = onToggle;
  row.querySelector('.tdel').onclick     = onDelete;
  return row;
}

/* ---- Render tasks ---- */
function renderTasks() {
  const todayStr = torontoNow().date;
  const active   = tasks.items.filter(t => !t.dueDate || t.dueDate <= todayStr);
  const future   = tasks.items
    .filter(t => t.dueDate && t.dueDate > todayStr)
    .sort((a, b) => a.dueDate !== b.dueDate
      ? (a.dueDate < b.dueDate ? -1 : 1)
      : ((a.dueTime || '') > (b.dueTime || '') ? 1 : -1));

  const L = $('taskList');
  L.innerHTML = '';
  if (!active.length) {
    L.innerHTML = '<div class="empty-note">Порожньо.</div>';
  } else {
    active.forEach(t => {
      const row = makeTaskRow(t,
        async () => {
          const wasDone = t.done;
          t.done = !t.done;
          if (t.done && !wasDone) await logTaskDone(t);
          await sset('app_tasks', tasks);
          renderTasks();
        },
        async () => {
          tasks.items.splice(tasks.items.indexOf(t), 1);
          await sset('app_tasks', tasks);
          renderTasks();
        }
      );
      L.appendChild(row);
    });
  }

  const F = $('taskFuture');
  F.innerHTML = '';
  if (future.length) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<span class="label">Заплановано</span>';
    future.forEach(t => {
      const row = makeTaskRow(t,
        async () => {
          const wasDone = t.done;
          t.done = !t.done;
          if (t.done && !wasDone) await logTaskDone(t);
          await sset('app_tasks', tasks);
          renderTasks();
        },
        async () => {
          tasks.items.splice(tasks.items.indexOf(t), 1);
          await sset('app_tasks', tasks);
          renderTasks();
        }
      );
      card.appendChild(row);
    });
    F.appendChild(card);
  }
}

async function addTask() {
  const v = $('taskInput').value.trim();
  if (!v) return;
  const dd = $('taskDate').value || undefined;
  const dt = $('taskTime').value || undefined;
  tasks.items.push({ id:newId(), text:v, done:false, dueDate:dd, dueTime:dt });
  $('taskInput').value = '';
  $('taskDate').value  = '';
  $('taskTime').value  = '';
  await sset('app_tasks', tasks);
  renderTasks();
}

$('taskAdd').onclick = addTask;
$('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

/* ---- Reminders ---- */
let reminderQueue = [];
const sessionReminded = new Set();

function buildReminderQueue() {
  const { date:todayStr, hhmm:nowHHMM } = torontoNow();
  reminderQueue = tasks.items.filter(t =>
    t.dueDate === todayStr && t.dueTime && !t.done &&
    t.remindedAt !== todayStr && t.dueTime <= nowHHMM &&
    !sessionReminded.has(t.id)
  );
  showNextReminder();
}

function showNextReminder() {
  if (!reminderQueue.length) { $('toastWrap').style.display = 'none'; return; }
  const t = reminderQueue[0];
  sessionReminded.add(t.id);
  $('toastText').textContent = t.text;
  $('toastTime').textContent = `${fmtDate(t.dueDate)} · ${t.dueTime}`;
  $('toastWrap').style.display = 'block';
}

async function dismissReminder(markDone) {
  if (!reminderQueue.length) return;
  const t = reminderQueue.shift();
  const { date:todayStr } = torontoNow();
  const item = tasks.items.find(x => x.id === t.id);
  if (item) {
    item.remindedAt = todayStr;
    if (markDone) { const wasDone = item.done; item.done = true; if (!wasDone) await logTaskDone(item); }
    await sset('app_tasks', tasks);
    renderTasks();
  }
  showNextReminder();
}

$('toastDone').onclick  = () => dismissReminder(true);
$('toastClose').onclick = () => dismissReminder(false);
