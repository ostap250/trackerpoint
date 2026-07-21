/* ---- Full data backup / restore (all app_* localStorage keys) ---- */

$('exportData').onclick = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('app_')) data[k] = localStorage.getItem(k);
  }
  if (!Object.keys(data).length) { showNotif('Нема що експортувати'); return; }
  const payload = { app:'tracker', exportedAt:new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tracker-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showNotif('Бекап збережено у файл');
};

$('importData').onclick = () => $('importFile').click();

$('importFile').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    const data = obj && obj.data;
    if (!data || typeof data !== 'object') throw new Error('bad format');
    const keys = Object.keys(data).filter(k => k.startsWith('app_') && typeof data[k] === 'string');
    if (!keys.length) throw new Error('no keys');
    keys.forEach(k => JSON.parse(data[k]));   // validate every value before touching storage
    if (!confirm(`Імпортувати бекап (${keys.length} ключів)? Поточні дані буде перезаписано.`)) return;
    keys.forEach(k => localStorage.setItem(k, data[k]));
    location.reload();
  } catch (err) {
    showNotif('Файл не схожий на бекап Tracker');
  }
};
