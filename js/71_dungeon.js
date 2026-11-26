/* ==========================================================================
 * 神諭之地 重製版 — 71_dungeon.js
 * Version : r3.33.0  (2026-11-17)　r3.33.0：副本地圖可走範圍改沿圖上道路（a/walk.json），出生點／抵達點跟著出入口
 * 舊版    : r3.31.0  (2026-11-17)
 * 變更    : r3.31.0 新增。副本頭目：每次進圖都會重生，頭目出現前先擊退精英波次。
 *           ・副本（D_）有頭目的圖：第 2 張 3 波、第 3 張 4 波、第 4 張 5 波；每波 3 隻一般＋1 隻精英（生命 ×3、攻擊 ×1.3）。
 *           ・波次清完 → 照原流程出頭目（已擊敗過也會重生，不再等 1 小時）。中途離開，下次從第 1 波重來。
 *           ・波次中東側出口封住；畫面上方任務列顯示「精英波次 n／N」。
 *           ・合戰（傳送役的合戰模式）不套用。
 * 依賴    : 18_world（G.WORLD.onEnter、bossT）、03_actors（spawnOni）、22_event（EV.mul 難度倍率，生成時自動套用）。
 * ========================================================================== */
'use strict';
(function () {
  const WD = G.WORLD, SC = G.SC, H = G.H; if (!WD) return;
  const NW = { '02': 3, '03': 4, '04': 5 };
  const DW = G.DWAVE = { on: null };
  /* r3.33.0：副本的出生點＝西側抵達點、節點跟著新的出入口（遮罩改沿道路後，舊的 150,555 可能落在樹林裡） */
  const CEN = {"D_EZO_01":[756,575],"D_EZO_02":[756,517],"D_EZO_03":[756,564],"D_EZO_04":[756,585],"D_FUJI_01":[756,546],"D_FUJI_02":[756,574],"D_FUJI_03":[756,536],"D_FUJI_04":[756,602],"D_IZUMO_01":[756,590],"D_IZUMO_02":[756,595],"D_IZUMO_03":[756,610],"D_IZUMO_04":[756,573],"D_SKY_01":[668,681],"D_SKY_02":[756,497],"D_SKY_03":[756,556],"D_SKY_04":[756,596]};   // 頭目出現點（中心往右 160 也可走）
  const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { const S = G.D.scenes, WM = (G.WALK && G.WALK.M) || {};
    for (const id in S) { if (!/^D_[A-Z]+_0\d$/.test(id)) continue; const d = S[id], wp = (WM[id] && WM[id].portals) || {}, wa = wp.west && wp.west.arrival, ea = wp.east && wp.east.arrival;
      if (wa) { d.start = wa.slice(); d.nodes = Object.assign({}, d.nodes, { west_arrival: wa.slice() }); }
      if (ea) d.nodes = Object.assign({}, d.nodes, { east_arrival: ea.slice() });
      if (CEN[id]) d.nodes = Object.assign({}, d.nodes, { center: CEN[id].slice() });   }
    return r; });
  const alive = e => e && e.st !== 'dead' && e.hp > 0;
  function wave() { const w = DW.on; if (!w || SC.id !== w.id) return; const d = G.D.scenes[w.id], foes = (WD.meta[w.id] || {}).foes || ['akaoni'], lv = (d.lv || (WD.meta[w.id] || {}).lv || 1) + 1;
    Promise.resolve(G.ASSET.enemies(foes)).then(() => { if (DW.on !== w || SC.id !== w.id) return;
      for (let i = 0; i < 4; i++) { let e = null; for (let t = 0; t < 20 && !e; t++) { const a = Math.random() * 6.283, r = 260 + Math.random() * 180, x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r * 0.5; if (SC.walkable(x, y)) e = G.spawnOni(x, y, 20 + i * 14, lv, foes[(w.i + i) % foes.length]); }
        if (!e) continue; e.dw = 1; if (i === 0) { e.elite = '精英'; e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio = (e.ratio || 1) * 1.15; } }
      w.spawned = 1; G.UI.toast('精英波次 ' + (w.i + 1) + '／' + w.n); }, () => { w.spawned = 1; }); }
  function begin(id, d, b) { const n = NW[id.slice(-2)] || 3; DW.on = { id, n, i: 0, spawned: 0, cd: 0, boss: b }; SC.lock.east = '先擊退精英波次';
    G.UI.banner('副本・' + (d.name || id), '擊退 ' + n + ' 波精英，頭目才會現身'); G.STORY.later(70, wave); }
  function done() { const w = DW.on; DW.on = null; const d = G.D.scenes[w.id]; d.boss = w.boss; delete SC.lock.east; G.UI.banner('精英退散了', '頭目要來了');
    const bt = G.SAVE.data.bossT; if (bt) delete bt[w.id]; G.STORY.later(40, () => { if (SC.id === w.id) { DW.pass = w.id; WD.onEnter(w.id); } }); }
  const en0 = WD.onEnter.bind(WD);
  WD.onEnter = function (id) { const d = G.D.scenes[id], war = G.SAVE.data.war && G.SAVE.data.war.map === id;
    if (DW.on && DW.on.id !== id) { const o = G.D.scenes[DW.on.id]; if (o && !o.boss) o.boss = DW.on.boss; DW.on = null; }   // 中途離開：還原
    if (DW.pass === id) { DW.pass = null; return en0(id); }   // 波次清完後的這一次：直接出頭目
    if (d && d.dungeon && d.boss && !war && !DW.on) { const bt = G.SAVE.data.bossT; if (bt) delete bt[id]; const b = d.boss; d.boss = null; const r = en0(id); begin(id, d, b); return r; }
    return en0(id); };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 20) return; const w = DW.on; if (!w) return; if (SC.id !== w.id) { const o = G.D.scenes[w.id]; if (o && !o.boss) o.boss = w.boss; DW.on = null; return; }
    if (!w.spawned || G.DLG.active()) return; if (G.E.some(e => e.dw && alive(e))) return; if (++w.i >= w.n) done(); else { w.spawned = 0; G.STORY.later(60, wave); } };
  const ob0 = G.STORY.objective.bind(G.STORY); G.STORY.objective = function () { const w = DW.on; if (w && SC.id === w.id) return '副本・擊退精英波次　' + Math.min(w.n, w.i + 1) + '／' + w.n; return ob0(); };
})();
