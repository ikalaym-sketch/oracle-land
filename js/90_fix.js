/* ==========================================================================
 * 神諭之地 重製版 — 90_fix.js
 * Version : r3.41.0  (2026-11-18)
 * 變更    : r3.41.0 新增。
 *           1. 進圖生怪延後：進圖後 2 秒內若開始劇情對話（任務過場、事件對話），等對話全部結束再過 30 秒才生怪；沒有對話就照常 1.5 秒後生。
 *           2. 妖怪尺寸校正（每種妖怪第一次畫時算一次）：
 *              ・人形妖怪的圖集比例偏小（走路圖腳底到頭頂 < 118 像素：僧兵、山賊、醜女、一目、黃泉兵、產女、鬼兵、山童、餓鬼）→ 以走路圖身高為基準，和主角同高；
 *              ・同一隻的攻擊／受傷／倒地動作身高和走路差太多（>25%）→ 該動作縮放到和走路一致（倒地只縮大的，不放大）。
 * 依賴    : 02_scene（autoSpawn／enter）、03_actors（drawOni、enemyUnit）、05_dialog。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, A = G.ANIM;
  /* ---------- 1. 生怪延後 ---------- */
  const P = G.SPAWNQ = { on: false, t: 0, dlg: false };
  const as0 = SC.autoSpawn.bind(SC); let entering = false;
  const en0 = SC.enter; SC.enter = function () { entering = true; P.on = false; try { return en0.apply(this, arguments); } finally { entering = false; } };
  SC.autoSpawn = function () { if (entering) { P.on = true; P.t = 0; P.dlg = false; P.sid = SC.id; this.auto = true; return; } return as0(); };
  const busy = () => G.DLG.active() || (G.STORY && G.STORY.cut);
  const ss0 = SC.step.bind(SC); SC.step = function () { const r = ss0.apply(this, arguments);
    if (P.on) { if (SC.id !== P.sid) P.on = false;
      else if (SC.trans) { }
      else if (busy()) { if (P.t < 120 || P.dlg) { P.dlg = true; P.t = 0; } }
      else if (++P.t >= (P.dlg ? 1800 : 90)) { P.on = false; if (!G.E.some(e => e.st !== 'dead')) as0(); } }
    return r; };
  /* ---------- 2. 妖怪尺寸校正 ---------- */
  const HUMAN = new Set(['sohei', 'sanzoku', 'shikome', 'hitotsume', 'yomigun', 'ubume', 'onihei', 'yamawaro', 'gaki']);
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1] || 0; };
  function norm(t, u) { if (u._nm) return; u._nm = 1; const w = u.act.walk || u.act[Object.keys(u.act)[0]]; if (!w || !w.f || !w.f.length) return; const wa = med(w.f.map(f => f[5]));
    if (HUMAN.has(t) && wa > 30 && wa < 118) u.vm = wa;
    for (const k in u.act) { const r = u.act[k]; if (r === w || r.k || !r.f || !r.f.length || !r.f[0]) continue; const ca = med(r.f.map(f => f[5])); if (!ca) continue; const q = ca / wa;   // 已有人工校正（k）的動作不動
      const lying = /death|fall|down/.test(k); if (lying ? q > 1.25 : (q > 1.25 || q < 0.8)) r.k = Math.max(0.4, Math.min(2.5, wa / ca)); } }
  const dO = G.drawOni; G.drawOni = function (e) { if (e && !e.bb) { const u = G.enemyUnit(e.type); if (u && !u._nm) try { norm(e.type, u); } catch (x) {} } return dO.apply(this, arguments); };
})();
