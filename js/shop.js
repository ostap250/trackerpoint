async function appendSpendLog(name, cost) {
  spendLog.unshift({ id:newId(), name, cost, date:torontoNow().date });
  if (spendLog.length > 300) spendLog = spendLog.slice(0, 300);
  await sset('app_spend_log', spendLog);
}

function renderShop() {
  $('shopPtsDisplay').innerHTML = `<b>${points.total}</b> pts`;

  /* Budget items */
  const bWrap = $('shopBudgetItems');
  bWrap.innerHTML = '<div class="shop-section">Бюджет втіх</div>';
  SHOP_BUDGET.forEach(item => {
    const canBuy = points.total >= item.pts;
    const row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = `<div class="shop-info">
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <button class="shop-buy"${canBuy ? '' : ' disabled'}>${item.pts} pts</button>`;
    row.querySelector('.shop-buy').onclick = async () => {
      if (points.total < item.pts) return;
      points.total -= item.pts;
      points.last   = 0;
      budget.bonus[item.key] = (budget.bonus[item.key] || 0) + item.bonus;
      await sset('app_points',  points);
      await sset('app_budget',  budget);
      await appendSpendLog(item.name, item.pts);
      renderPoints();
      renderBudget();
      renderShop();
      showNotif(`✓ ${item.name} додано до бюджету`);
      narratorSay('points_spent');
    };
    bWrap.appendChild(row);
  });

  /* Reward items */
  const rWrap = $('shopRewardItems');
  rWrap.innerHTML = '<div class="shop-section" style="margin-top:16px">Нагороди</div>';
  SHOP_REWARDS.forEach(item => {
    const canBuy = points.total >= item.pts;
    const row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = `<div class="shop-info">
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <button class="shop-buy"${canBuy ? '' : ' disabled'}>${item.pts} pts</button>`;
    row.querySelector('.shop-buy').onclick = async () => {
      if (points.total < item.pts) return;
      points.total -= item.pts;
      points.last   = 0;
      await sset('app_points', points);
      await appendSpendLog(item.name, item.pts);
      renderPoints();
      renderShop();
      showNotif(`🎉 ${item.name} — насолоджуйся!`);
      narratorSay('points_spent');
    };
    rWrap.appendChild(row);
  });

  /* Grand reward */
  const ratio    = Math.min(1, points.total / GRAND_REWARD_PTS);
  const canGrand = points.total >= GRAND_REWARD_PTS;
  const gWrap    = $('shopGrandWrap');
  gWrap.innerHTML = '';
  const grand = document.createElement('div');
  grand.className = 'grand-card';
  grand.innerHTML = `<div class="grand-title">Велика нагорода</div>
    <div class="grand-desc">(впиши свою мрію — девайс / поїздка / вільний день без лімітів)</div>
    <div class="grand-progress-row">
      <span class="grand-pts-label">прогрес</span>
      <span class="grand-pts-val">${points.total} / ${GRAND_REWARD_PTS} pts</span>
    </div>
    <div class="grand-bar"><div class="grand-fill" style="width:0%"></div></div>
    <button class="grand-buy"${canGrand ? '' : ' disabled'}>
      ${canGrand ? '🎁 Отримати нагороду' : 'потрібно ' + GRAND_REWARD_PTS + ' pts'}
    </button>`;
  grand.querySelector('.grand-buy').onclick = async () => {
    if (points.total < GRAND_REWARD_PTS) return;
    points.total -= GRAND_REWARD_PTS;
    points.last   = 0;
    await sset('app_points', points);
    await appendSpendLog('Велика нагорода', GRAND_REWARD_PTS);
    renderPoints();
    renderShop();
    showNotif('🎊 Велика нагорода отримана! Ти заслужив це!');
    narratorSay('points_spent');
  };
  gWrap.appendChild(grand);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const f = grand.querySelector('.grand-fill');
    if (f) f.style.width = (ratio * 100) + '%';
  }));
}
