/* ==========================================================================
 * 神諭之地 重製版 — 64_fix.js
 * Version : r3.27.1  (2026-11-14)　r3.27.1：颯在救出工人後加入
 * 變更    : r3.27.0 新增。
 *           ・封印門：本章主線全部完成、人又在頭目圖時，自動開門開打（不用再點一次門；頭目不會「出現兩次」），並套用抉擇加成（bossMod）。
 *           ・第二章頭目依抉擇：封印石交給河童（c2_stone=kappa）→ 改打「暴走的蛟幼體」（蛟 mizuchi 放大成頭目），河童們在旁助陣；
 *             交給東村 → 照舊打被黑符控制的河童大將。
 *           ・舊存檔修復：第二章後日談已過但汐音沒加入（r3.26 匯入對話時漏掉加入指令）→ 讀檔時補上加入。
 * 依賴    : 18_world（G.WORLD.onEnter）、53_quest（Q.gate、Q.gateNeed、Q.bossMod、Q.join）、26_boss（mapStart）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, SC = G.SC, WD = G.WORLD, F = () => G.SAVE.data.flags; if (!Q || !WD) return;
  const C = k => (Q.choice ? Q.choice(k) : null);
  /* ---------- 封印門自動開啟 ---------- */
  let tk = 0; const ls0 = G.NPCLIFE.step;
  G.NPCLIFE.step = function () { ls0(); if (++tk % 30) return; const g = Q.gate; if (!g || g.id !== SC.id || G.DLG.list || SC.trans) return;
    if (Q.gateNeed(g.c).left.length) return; Q.gate = null; if (G.HUB && G.HUB.marks) G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'gate'); delete SC.lock.east;
    G.UI.banner('封印門開了', '裡面的東西出來了'); WD.onEnter(SC.id); };
  /* ---------- 第二章：交給河童 → 蛟幼體 ---------- */
  const MZ = 'W_R02_06';
  const en0 = WD.onEnter.bind(WD);
  WD.onEnter = function (id) { if (id === MZ && C('c2_stone') === 'kappa' && !F()['boss_' + MZ] && Q.load) Q.load(['mizuchi']); return en0(id); };
  const ms0 = G.BOSS && G.BOSS.mapStart; if (ms0) G.BOSS.mapStart = function (id, d, o) {
    if (id === MZ && C('c2_stone') === 'kappa' && !(o && o.re)) { const b0 = d.boss; d.boss = 'mizuchi'; setTimeout(() => { d.boss = b0; }, 0);
      setTimeout(() => { const e = G.E.find(x => x.boss && x.st !== 'dead'); if (!e) return; e.ratio *= 1.35; e.elite = '暴走的蛟幼體'; e.name = '暴走的蛟幼體';
        G.UI.banner('暴走的蛟幼體', '河童們纏住了牠的尾巴'); if (G.AMB) for (const dx of [-90, 90]) G.AMB.add('n_t_kappa_mentor', e.x + dx, e.y + 30, { name: '河童', hold: true }); }, 60);
      return false; }
    return ms0.call(this, id, d, o); };
  /* ---------- r3.27.1：颯改在救出工人（c4_m1 完成）後就加入（對話擴寫依此撰寫） ---------- */
  { const q = Q.by.c4_m1; if (q) { const d0 = q.done; q.done = function () { if (d0) d0.apply(this, arguments); Q.join('hayate'); }; } }
  /* ---------- 舊存檔：汐音補加入 ---------- */
  const boot0 = G.ASSET.boot.bind(G.ASSET);
  G.ASSET.boot = () => boot0().then(r => { setTimeout(() => { try { const s = (G.SAVE.data.qs || {}).c2_after; if (s && (s.done || s.s >= 2) && !F().join_shion) Q.join('shion'); const h = (G.SAVE.data.qs || {}).c4_m1; if (h && h.done && !F().join_hayate) Q.join('hayate'); } catch (e) {} }, 1500); return r; });
})();
