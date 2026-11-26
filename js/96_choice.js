/* ==========================================================================
 * 神諭之地 重製版 — 96_choice.js
 * Version : r3.57.0  (2026-11-24)
 * 變更    : r3.57.0 新增。章節抉擇的實際影響補強。
 *           ・「好的選擇＝頭目血變少」改成「助陣」：頭目血量不再打折，改由盟友在戰鬥中分 5 次出手（每 12 秒），
 *             總量＝原本打掉的血量；不會打出最後一擊。壞的選擇（頭目變強）維持原樣。
 *           ・第 1 章：叫村民去竹林岔口 → 鎌鼬戰血量低於 40% 時，阿松送藥湯回 30%（最多 2 次）；
 *             一個人去 → 鎌鼬沒聚齊，頭目血 −10%；餵小鼬 → 小鼬在鎌鼬戰助陣（15%）。
 *           ・第 7 章逛城：茶食攤 → 茶食效果時間 +30%；河邊 → 搭時雨渡船抵達時回滿血；布街 → 小雪好感 +1。
 *           ・第 9 章：放過幼蛛 → 土蜘蛛戰八絃以絲助陣（15%）；全部清除 → 蜘蛛類敵人素材掉落 +50%。
 * 依賴    : 53_quest（Q.choice、Q.bossMod）、26_boss（B.start、enc）、07_rpg（onKill）、52_hub（travel）、58_forge（BUFF.add 茶食）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, B = G.BOSS, SC = G.SC, H = G.H, F = () => G.SAVE.data.flags; if (!Q || !B) return;
  const C = k => Q.choice ? Q.choice(k) : null;
  /* ---------- 1. 助陣：bossMod 的 hp 折扣改成盟友出手 ---------- */
  const AS = {};   // map → { frac, msg }
  const ALLY = { W_R02_06: '河童們', W_R03_05: '狐族', W_R03_07: '狐族', W_R04_07: '天狗們', W_R05_07: '權太', W_R06_07: '八岐的試煉', W_R07_07: '文也', R07_OSAKABE_TRIAL: '文也', W_R08_07: '茨木', W_R10_07: '海神的潮' };
  for (const id in Q.bossMod) { const f = Q.bossMod[id];
    Q.bossMod[id] = () => { const m = f(); if (!m || !m.hp || m.hp >= 1) return m; AS[id] = { frac: 1 - m.hp, msg: m.msg }; const o = Object.assign({}, m); delete o.hp; o.msg = '助陣：' + (m.msg || '盟友趕來了'); return o; }; }
  function assist(enc, a, who) { if (!enc || enc._as) return; enc._as = { frac: a.frac, msg: a.msg, who: who || '盟友', n: 5, t: 420 }; }
  function strike(enc) { const a = enc._as, L = enc.units.filter(u => u.hp > 1 && u.st !== 'dead'); if (!L.length) return; a.n--;
    for (const u of L) { const d = Math.round(u.hpMax * a.frac / 5); u.hp = Math.max(1, u.hp - d); u.flash = 10; G.NUMS.push({ x: u.x, y: u.y - G.HERO_H * 1.2, v: d, t: 0 });
      if (G.VX && G.VX.ring) G.VX.ring({ x: u.x, y: u.y, r1: 1.4, life: 18, col: '150,230,255' }); }
    SC.shake = Math.max(SC.shake || 0, 3); G.UI.toast(a.who + '助陣！（剩 ' + a.n + ' 次）'); }
  /* ---------- 2. 第 1 章：鎌鼬戰 ---------- */
  const bs0 = B.start; B.start = function (id, o) { const enc = bs0.apply(this, arguments);
    if (enc && id === 'kama') {
      if (C('c1_weasel') === 'feed') { assist(enc, { frac: 0.15 }, '小鼬'); G.STORY.later(90, () => G.UI.banner('小鼬認出了你', '牠帶著風，站到了你這一邊')); }
      if (F().alone) { for (const u of enc.units) u.hp = u.hpMax = Math.round(u.hpMax * 0.9); G.UI.toast('你一個人悄悄上山，鎌鼬們還沒聚齊（頭目血量 −10%）'); }
      if (F().gather) enc._heal = 2; }
    if (enc && id === 'tsuchigumo' && C('c9_spider') === 'spare') { assist(enc, { frac: 0.15 }, '八絃'); G.STORY.later(90, () => G.UI.banner('八絃趕來了', '「這一次，換我的絲保護你們。」')); }
    return enc; };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); ++tk;
    if (tk % 120 === 0 && C('c7_date') === 'cloth' && !F().c7cloth) { F().c7cloth = 1; G.SAVE.data.xueLove = (G.SAVE.data.xueLove || 0) + 1; G.SAVE.markDirty(); }
    const enc = B.enc; if (!enc || enc.done || G.DLG.active()) return;
    if (!enc._as && !enc._asChk) { enc._asChk = 1; const f = Q.bossMod[SC.id]; if (f && !F()['boss_' + SC.id]) { f(); const a = AS[SC.id]; if (a) assist(enc, a, ALLY[SC.id] || '盟友'); } }
    const a = enc._as; if (a && a.n > 0 && --a.t <= 0) { a.t = 720; strike(enc); }
    if (enc._heal > 0 && tk % 20 === 0 && H.hp < H.hpMax * 0.4 && H.hp > 0) { enc._heal--; H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.3); G.UI.banner('阿松送來了藥湯', '村民們在竹林岔口等著你回來（剩 ' + enc._heal + ' 次）'); } };
  /* ---------- 3. 第 7 章：逛城 ---------- */
  if (G.BUFF && G.BUFF.add) { const ad0 = G.BUFF.add.bind(G.BUFF); G.BUFF.add = function (k, v, t) { if (C('c7_date') === 'food' && G.MENU && G.MENU.shop && G.SHOP && G.SHOP.type && G.SHOP.type(G.MENU.shop) === 'tea') t = Math.round(t * 1.3); return ad0(k, v, t); }; }
  if (G.HUB && G.HUB.travel) { const tv0 = G.HUB.travel; G.HUB.travel = function () { const r = tv0.apply(this, arguments); if (C('c7_date') === 'river' && SC.id === 'hub_city') G.STORY.later(90, () => { H.hp = H.hpMax; G.UI.toast('時雨的渡船很穩，你在船上歇了一會兒（生命回滿）'); }); return r; }; }
  /* ---------- 4. 第 9 章：清除幼蛛 → 蜘蛛類素材 +50% ---------- */
  const SP = /gumo|kumo|jorogumo/;
  const k0 = G.RPG.onKill.bind(G.RPG); G.RPG.onKill = function (e) { k0(e); if (e && SP.test(e.type || '') && C('c9_spider') === 'purge' && Math.random() < 0.5) { const ks = Object.keys(G.RPG.MATS), m = ks[Math.floor(Math.random() * ks.length)];
      G.LOOT.push({ x: e.x + 10, y: e.y, t: 0, kind: 'mat', id: m, n: 1 }); } };
  G.CHOICE = { AS, assist };
})();
