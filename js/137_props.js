/* ==========================================================================
 * 神諭之地 重製版 — 137_props.js
 * Version : r3.109.0  (2026-11-26)
 * 變更    : r3.109.0 新增。未使用物件上場（第 22 項討論結果）。
 *           1. 封印門：章節頭目圖的「封印門」互動點畫成該地區的封印門（pr_<地區>:door_*_seal_locked），解開後換成開門圖（本次進圖有效）。
 *           2. 告示牌：探索區入口在出雲／火山／雪國／天空地區改用該地區告示牌（村莊、神社維持 obj_explore_sign）。
 *           3. 寶箱：事件／探索寶箱在非村莊地區改用該地區寶箱（普通／精緻／傳說），無間精緻寶箱不變。
 *           4. 紙燈籠（第 3 章「燈籠下」）：先熄燈，調查後點亮並存檔（flags.lit），之後回來都是亮的。
 *           5. 雷脈閥（第 4 章 W_R04_05）：一直在地圖中央；任務「三個雷脈閥」完成前是通電版，完成後換關閉版＋符紙飛散。
 *           6. 假鳥居（第 3 章 W_R03_07「找出真的三座」）：任務期間多 2 座假鳥居，調查＝狐火幻術散去（存檔，不再出現）。
 *           7. 試煉石（後山 hub_mountain）：磐座上立隱藏王封印石碑（obj_hidden_boss_seal），地面柔光由 28 畫。
 *           ・裝飾物件統一 n._dec，進圖時清掉重建；每 30 格檢查一次狀態，不逐格讀存檔。
 * 依賴    : 89_obj（G.OBJX／G.OBJGONE、img:／pr: 畫法）、53_quest（QST.isDone／marks）、22_event（事件寶箱 prop）、76_vfx（VX.custom）、130_icons（burst）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, S = y => SC.depth(y), F = () => (G.SAVE.data.flags = G.SAVE.data.flags || {}), rnd = (a, b) => a + Math.random() * (b - a);
  const REG = (d, id) => { d = d || SC.def || {}; id = id || SC.id; if (d.dungeon) return { EZO: 'snow', FUJI: 'volcano', IZUMO: 'izumo', SKY: 'sky' }[d.dungeon] || 'village'; if (id === 'hub_shrine') return 'shrine';
    const c = d.ch || 1; return c === 4 || c === 5 ? 'volcano' : c === 6 || c === 11 ? 'izumo' : c === 3 ? 'shrine' : 'village'; };
  const rg = () => REG(SC.def, SC.id), asked = {};
  const need = pk => { if (G.ANIM.get(pk) || asked[pk]) return; asked[pk] = 1; try { const q = G.ANIM.load(pk); if (q && q.catch) q.catch(() => { asked[pk] = 0; }); } catch (e) { asked[pk] = 0; } };
  /* ---------- 1／2. 物件對應 ---------- */
  G.OBJX = l => { if (l === '封印門') { const r = rg(); return 'pr:pr_' + r + ':door_' + r + '_seal_locked'; }
    if (/^探索・/.test(l)) { const r = rg(); if (r !== 'village' && r !== 'shrine') return 'pr:pr_' + r + ':sign_' + r + '_idle'; } return null; };
  /* ---------- 裝飾物件 ---------- */
  let DEC = [], tk = 0;
  const mk = (objd, x, y, o) => Object.assign({ objd, x, y, name: '', t: 0, _dec: 1 }, o || {});
  const put = n => { DEC.push(n); G.NPC.push(n); return n; };
  const drop = n => { DEC = DEC.filter(q => q !== n); G.NPC = G.NPC.filter(q => q !== n); };
  const clear = () => { G.NPC = G.NPC.filter(n => !n._dec); DEC = []; };
  const ctr = () => { const d = SC.def, n = d.nodes || {}; return n.center || d.start || [d.w / 2, d.h * 0.66]; };
  const VALVE = 'W_R04_05', TORII = 'W_R03_07', vDone = () => !!(G.QST && G.QST.isDone && G.QST.isDone('c4_m3'));
  function build() { clear(); const id = SC.id, d = SC.def; if (!d) return; need('pr_' + rg());
    const L = F().lit || {}; for (const k in L) if (k.indexOf(id + '|') === 0) put(mk(L[k][2], L[k][0], L[k][1]));
    if (id === VALVE) { const c = ctr(); put(mk(vDone() ? 'img:obj_thunder_valve_off' : 'img:obj_thunder_valve_on', c[0], c[1] - 40, { valve: 1 })); }
    if (id === 'hub_mountain') { const p = d.nodes && d.nodes.stone_stand; if (p) put(mk('img:obj_hidden_boss_seal', p[0], p[1] - 4)); }
    if (id === TORII) torii(); }
  /* ---------- 6. 假鳥居 ---------- */
  function torii() { if (DEC.some(n => n.fake !== undefined)) return; const M = ((G.QST && G.QST.marks) || []).filter(m => /^鳥居（[一二三]）$/.test(m.label || '') && m.x > -999).sort((a, b) => a.x - b.x);
    if (M.length < 2) return;
    for (let i = 0; i < 2; i++) { if (F()['fakeTorii' + i]) continue; const a = M[Math.min(i, M.length - 2)], b = M[Math.min(i, M.length - 2) + 1], dy = i ? 80 : -80;
      const p = (SC.snap && SC.snap((a.x + b.x) / 2, (a.y + b.y) / 2 + dy, 'open', 160)) || [(a.x + b.x) / 2, (a.y + b.y) / 2 + dy]; put(mk('img:obj_torii_small_b', p[0], p[1], { fake: i })); } }
  function foxfire(x, y) { if (!G.VX || !G.VX.custom) return; const k = G.HERO_H * S(y);
    for (let i = 0; i < 8; i++) { let fx = x + rnd(-0.4, 0.4) * k, fz = rnd(0.1, 0.8) * k; const vx = rnd(-0.004, 0.004) * k, vz = rnd(0.006, 0.012) * k, sz = rnd(0.13, 0.2) * k, ph = rnd(0, 6.28), dl = Math.floor(rnd(0, 12));
      G.VX.custom((q, c) => { if (q.t < dl) return; const u = (q.t - dl) / (q.life - dl), a = Math.sin(Math.min(1, u) * Math.PI) * 0.9, w = sz * (1 - u * 0.5), sw = Math.sin(G.t * 0.25 + ph) * w * 0.35;
        c.save(); c.translate(fx, y - fz); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(0, 0, 0, 0, -w * 0.4, w * 1.4); g.addColorStop(0, `rgba(235,250,255,${a})`); g.addColorStop(0.35, `rgba(120,200,255,${a * 0.8})`); g.addColorStop(1, 'rgba(60,110,255,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(sw, -w * 2.2); c.bezierCurveTo(w * 0.9, -w * 0.9, w, w * 0.5, 0, w * 0.7); c.bezierCurveTo(-w, w * 0.5, -w * 0.9, -w * 0.9, sw, -w * 2.2); c.fill(); c.restore(); }, 60, 'o',
        { step: () => { fx += vx + Math.sin(G.t * 0.1 + ph) * 0.3; fz += vz; } }); } }
  function dispel(n) { if (n.fade) return; n.fade = 1; F()['fakeTorii' + n.fake] = 1; G.SAVE.markDirty && G.SAVE.markDirty(); foxfire(n.x, n.y); G.AU && G.AU.sfx && G.AU.sfx('magic');
    G.UI.toast('狐火幻術——這座鳥居是假的'); }
  /* ---------- 4／1. 互動點消失時：燈籠點亮、封印門打開 ---------- */
  function ember(x, y) { if (G.ICO && G.ICO.burst) G.ICO.burst({ x, y }, 'fxp_ember_leaf', 4, { z: 0.9, k: 0.6 }); }
  G.OBJGONE = o => { const d = o.objd || '';
    if (/^img:.*lantern.*_off$/.test(d)) { const on = d.replace(/_off$/, '_on'), L = F().lit = F().lit || {}; L[SC.id + '|' + o.m.label] = [o.x, o.y, on]; G.SAVE.markDirty && G.SAVE.markDirty(); put(mk(on, o.x, o.y, { t: 15 })); ember(o.x, o.y); }
    else if (/_seal_locked$/.test(d)) put(mk(d.replace(/locked$/, 'open'), o.x, o.y, { t: 15 })); };
  /* ---------- 逐格：淡出、靠近互動；每 30 格：雷脈閥狀態 ---------- */
  (function hookStep() { if (!G.STORY || !G.STORY.step) return setTimeout(hookStep, 60); const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
      for (const n of DEC) if (n.fade) { n.fade++; n.t = Math.max(0, Math.floor(15 * (1 - n.fade / 30)) - 1); if (n.fade > 30) drop(n); }
      if (++tk % 30 === 0) { const v = DEC.find(n => n.valve); if (v && vDone() && /_on$/.test(v.objd)) { v.objd = 'img:obj_thunder_valve_off'; if (G.ICO && G.ICO.burst) G.ICO.burst({ x: v.x, y: v.y }, 'fxp_talisman', 6, { z: 0.8 }); G.UI.toast('雷脈閥關上了'); }
        if (SC.id === TORII) torii(); }
      if (G.UI.near && !G.UI.near.amb) return; let best = 62, pk = null;
      for (const n of DEC) { if (n.fake === undefined || n.fade) continue; const dd = Math.hypot(H.x - n.x, (H.y - n.y) * 1.6); if (dd < best) { best = dd; pk = n; } }
      if (pk) G.UI.near = { label: '鳥居', kind: 'look', run: () => dispel(pk) }; }; })();
  (function hookEnter() { if (!G.STORY || !G.STORY.onEnter) return setTimeout(hookEnter, 60); const en0 = G.STORY.onEnter.bind(G.STORY);
    G.STORY.onEnter = function (id) { clear(); const r = en0(id); G.STORY.later(15, () => { if (SC.id === id) build(); }); return r; }; })();
  /* ---------- 3. 地區寶箱 ---------- */
  const CK = { normal: 22, rare: 24, legend: 28 };
  function drawChest(U, n, k2, rec) { const c = G.ctx, tier = /legend/.test(k2) ? 'legend' : /rare/.test(k2) ? 'rare' : 'normal', cl = U.act[k2.replace('_open', '_closed')] || rec, fC = cl.f[cl.f.length - 1], f = rec.f[rec.f.length - 1], s = S(n.y), sc = CK[tier] * s / fC[3];
    const sh = U.act[k2.replace(/_(open|closed)$/, '_shadow')]; if (sh) G.ANIM.draw(U, sh.f[sh.f.length - 1], n.x, n.y, sc, false, n.alpha * 0.8);
    else { c.save(); c.fillStyle = `rgba(30,20,10,${0.3 * n.alpha})`; c.beginPath(); c.ellipse(n.x, n.y, f[2] * sc * 0.42, f[2] * sc * 0.12, 0, 0, 6.283); c.fill(); c.restore(); }
    if (n.glow) { const a = 0.3 + 0.2 * Math.sin(G.t * 0.12), R = fC[2] * sc * 0.8; c.save(); c.translate(n.x, n.y); c.scale(1, 0.32); const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, `rgba(255,220,120,${a})`); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 6.283); c.fill(); c.restore(); }
    G.ANIM.draw(U, f, n.x, n.y, sc, false, n.alpha); }
  (function hookDraw() { if (!G.drawNpc) return setTimeout(hookDraw, 60); const d0 = G.drawNpc;
    G.drawNpc = function (n) { if (n && n.prop && !n.mugenChest && /^chest_village_/.test(n.k || '')) { const r = rg(); if (r !== 'village') { const U = G.ANIM.get('pr_' + r), k2 = n.k.replace('village', r), rec = U && U.act[k2];
          if (rec) { const A = G.ANIM.draw, c = G.ctx; G.ANIM.draw = () => {}; c.save(); c.globalAlpha = 0; try { d0.apply(this, arguments); } finally { c.restore(); G.ANIM.draw = A; }
            if (G.NPC.includes(n)) drawChest(U, n, k2, rec); return; }
          need('pr_' + r); } }
      return d0.apply(this, arguments); }; })();
  G.PROPS = { REG, rg, build, dispel, foxfire, list: () => DEC };
})();
