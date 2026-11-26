/* ==========================================================================
 * 神諭之地 重製版 — 97_partner5.js
 * Version : r3.58.0  (2026-11-24)
 * 變更    : r3.58.0 新增。夥伴強化：
 *           ・能力值隨主角成長：依定位取主角攻擊／生命／防禦的比例（坦 .45／遠 .75／控 .6／破 .85／癒 .4／近 .8），
 *             夥伴等級低於主角時打折（最低 55%）；與原公式取高者。結果快取 200ms（PY.stats 每次出傷都會呼叫）。
 *           ・64 個分支招式的「滿級」效果全部接上：事件帶 l5（滿級改寫）／l5k（滿級倍率）／l5only（滿級才有的追加段，排在動作後不拖動作）。
 *           ・修正：投射護擋（白丸 A2／A4）原本永遠不觸發（hurtHero 沒傳投射旗標）→ 來源距離 >120 視為遠程。
 *           ・修正：颯 B3／汐音 B4 標「2 隻」實際只打 1 隻 → 改穿透 1。
 *           ・出招回饋：非普攻出招時腳下出現定位色環（自主白／指令藍／小連攜綠／大連攜金），名字字級加大（49_party）。
 * 依賴    : 49_party、50_party_kit（G.PKIT、G.PEV）、51_party_grow（nodeLv）、60_pkit2、91_pfx、76_vfx。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, K = G.PKIT, H = G.H; if (!PY || !K || !G.PEV) return;
  const lv5 = (P, sid) => !!(sid && PY.nodeLv && PY.nodeLv(P.id, sid) >= 5);
  const alive = e => e && e.st !== 'dead' && e.hp > 0;
  /* ---------- 1. 滿級效果表：[夥伴, 節點, 事件序, 改寫] ---------- */
  const ev = (id, n, i) => K[id] && K[id][n] && K[id][n].ev[i];
  const L5 = (id, n, i, o) => { const e = ev(id, n, i); if (e) Object.assign(e, o); };
  const ADD = (id, n, o) => { const s = K[id] && K[id][n]; if (s) s.ev.push(Object.assign({ l5only: 1, after: 1 }, o)); };
  // 白丸
  L5('shiro', 'A2', 0, { l5: { ctr: 1 } });
  L5('shiro', 'A4', 1, { l5: { n: 2 } });
  L5('shiro', 'B2', 0, { l5: { kb: 28 } });
  L5('shiro', 'B3', 0, { l5: { r: 195 } });
  L5('shiro', 'B4', 0, { l5: { stun: 30 } });
  // 颯
  L5('hayate', 'A2', 0, { lv5x: 1 });
  L5('hayate', 'A3', 0, { l5: { pierce: 3 } });
  L5('hayate', 'A4', 1, { l5: { fc: 1 } });
  L5('hayate', 'B2', 0, { l5: { slowT: 3 } });
  L5('hayate', 'B3', 0, { pierce: 1, l5: { pierce: 2 } });
  L5('hayate', 'B4', 0, { l5: { kb: 24 } }); L5('hayate', 'B4', 1, { l5: { kb: 24 } });
  L5('hayate', 'B6', 4, { l5: { dur: 6 } });
  // 葛葉
  L5('kuzuha', 'A3', 0, { l5: { dr: 0.3 } });
  ADD('kuzuha', 'A4', { k: 'zone', t: 450, z: 'ward', fx: 'guard_ward', dur: 3, dr: 0.15, r: 70, once: 1 });
  L5('kuzuha', 'A6', 2, { l5: { dur: 6 } });
  L5('kuzuha', 'B2', 0, { l5: { pierce: 1 } });
  L5('kuzuha', 'B3', 0, { l5: { dur: 6 } });
  L5('kuzuha', 'B4', 0, { l5: { root: 60 } });
  L5('kuzuha', 'B6', 0, { l5: { r: 156 } });
  // 茨木童子
  L5('ibaraki', 'A2', 0, { l5: { burn: 5 } });
  L5('ibaraki', 'A3', 0, { l5: { ign: 35 } });
  L5('ibaraki', 'A4', 0, { l5: { burn: 4 } });
  L5('ibaraki', 'A6', 2, { l5: { r: 143 } });
  L5('ibaraki', 'B2', 0, { l5: { stun: 28 } });
  L5('ibaraki', 'B3', 0, { l5: { dr: 0.7 } });
  L5('ibaraki', 'B4', 0, { l5: { n: 2, r: 100 } });
  L5('ibaraki', 'B6', 0, { l5: { dr: 0.35 } });
  // 汐音（補血量由 60_pkit2 設定，滿級乘倍率）
  L5('shion', 'A2', 0, { l5k: { pct: 1.33 } }); L5('shion', 'A2', 1, { l5k: { pct: 1.33 } });
  L5('shion', 'A3', 0, { l5k: { pct: 1.3 } }); L5('shion', 'A3', 1, { l5k: { pct: 1.3 } });
  L5('shion', 'A4', 1, { l5k: { pct: 1.67 } }); L5('shion', 'A4', 2, { l5k: { pct: 1.67 } });
  ADD('shion', 'A6', { k: 'heal', t: 3000, pct: 4, fx: 'heal_echo', all: 1, echo: 1 });
  L5('shion', 'B2', 0, { l5: { slowT: 3 } });
  L5('shion', 'B3', 0, { l5: { max: 3 } });
  L5('shion', 'B4', 0, { pierce: 1, l5: { kb: 28 } });
  L5('shion', 'B6', 0, { l5: { r: 169 } });
  // 源賴光
  L5('yorimitsu', 'A2', 0, { l5: { stun: 24 } });
  L5('yorimitsu', 'A3', 0, { l5: { mkK: 1.8 } });
  L5('yorimitsu', 'A4', 1, { l5: { fc: 1 } });
  L5('yorimitsu', 'A6', 2, { l5: { r: 156 } });
  L5('yorimitsu', 'B2', 0, { l5: { n: 2, r: 100 } });
  L5('yorimitsu', 'B3', 0, { l5: { dr: 0.7 } });
  L5('yorimitsu', 'B4', 0, { l5: { n: 2, r: 100 } });
  ADD('yorimitsu', 'B6', { k: 'hit', t: 2700, m: 0.8, fx: 1 });
  // 建御雷
  L5('takemikazuchi', 'A2', 0, { l5: { stun: 30 } });
  L5('takemikazuchi', 'A3', 1, { l5: { chK: 1.9 } });
  ADD('takemikazuchi', 'A4', { k: 'hit', t: 1350, m: 0.6, fx: 1, ranged: 1 });
  L5('takemikazuchi', 'A6', 0, { l5: { r: 195 } });
  L5('takemikazuchi', 'B2', 0, { l5: { stun: 30 } });
  L5('takemikazuchi', 'B4', 0, { l5: { stun: 24 } });
  ADD('takemikazuchi', 'B3', { k: 'hit', t: 1700, m: 0.6, ranged: 1, r: 90, n: 3 });
  ADD('takemikazuchi', 'B6', { k: 'hit', t: 3100, m: 1.1, ranged: 1, r: 140, n: 4 });
  // 役小角
  L5('enno', 'A2', 0, { lv5x: 1 });
  L5('enno', 'A3', 1, { l5: { m: 1.6 } });
  ADD('enno', 'A4', { k: 'proj', t: 1100, m: 0.9, spr: 'ao_glide', hitFx: 'aka_strike' });
  ADD('enno', 'A6', { k: 'hit', t: 2100, m: 2.0, ranged: 1, r: 140, n: 4 });
  L5('enno', 'B2', 1, { l5: { n: 2, r: 110 } });
  L5('enno', 'B3', 0, { l5: { spd: 20 } });
  L5('enno', 'B4', 1, { l5: { dur: 3 } });
  L5('enno', 'B6', 1, { l5: { dur: 5 } });
  /* ---------- 2. 事件結算外層：套滿級 ---------- */
  const run1 = G.PEV.run.bind(G.PEV);
  G.PEV.run = function (P, e, c) { c = c || {}; const on = lv5(P, c.sid);
    if (e.l5only && !on) return;
    if (on && (e.l5 || e.l5k)) { const o = Object.assign({}, e, e.l5 || {}); if (e.l5k) for (const k in e.l5k) o[k] = (e[k] || 0) * e.l5k[k]; e = o; }
    if (G.P5 && G.P5.log) G.P5.log.push({ id: P.id, sid: c.sid, on, e });
    const r = run1(P, e, c); if (e.k === 'guard' && e.ctr && PY.hg) PY.hg.ctr = 1; return r; };
  /* ---------- 3. 護擋：投射判定＋白丸 A2 滿級反撞 ---------- */
  let hsx = null; const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { hsx = srcX; try { return hh0.apply(this, arguments); } finally { hsx = null; } };
  const ht0 = PY.heroTaken; PY.heroTaken = G.PEV.heroTaken = function (d, src, isProj) { const g = PY.hg, n0 = g ? g.n : 0;
    if (!isProj && hsx != null && Math.abs(hsx - H.x) > 120) isProj = true;
    const r = ht0.call(this, d, src, isProj);
    if (g && g.ctr && g.n < n0) { const P = g.P; let best = null, bd = 1e9; for (const e of G.E) { if (!alive(e)) continue; const q = Math.hypot(e.x - P.x, (e.y - P.y) * 1.6); if (q < bd && q < 260) { bd = q; best = e; } }
      if (best) { PY.dmg(P, best, 1.2, { ch: 'autonomous', big: 1 }); if (!best.boss && !best.bb) best.kb = (best.kb || 0) + Math.sign(best.x - P.x || 1) * 6; if (G.VX && G.VX.ring) G.VX.ring({ x: best.x, y: best.y, r1: 1.0, life: 14, col: '230,200,140' }); } }
    return r; };
  /* ---------- 4. 冷卻：葛葉 A2 滿級 −30% ---------- */
  const CDK = { kuzuha: { A2: 0.7 } };
  const cd0 = PY.cdOf; PY.cdOf = (P, ch) => { const v = cd0(P, ch), sid = PY.variant ? PY.variant(P.id, ch) : ch, k = CDK[P.id] && CDK[P.id][sid]; return k && lv5(P, sid) ? Math.round(v * k) : v; };
  /* ---------- 5. 能力值：隨主角成長 ---------- */
  const RK = { 坦: [0.45, 1.1, 1.2], 遠: [0.75, 0.6, 0.6], 控: [0.6, 0.65, 0.7], 破: [0.85, 0.85, 0.9], 癒: [0.4, 0.6, 0.7], 近: [0.8, 0.8, 0.85] };
  const st0 = PY.stats, SC_ = {}; PY.stats = id => { const now = performance.now(), c = SC_[id]; if (c && now - c.t < 200) return c.s;
    const s = st0(id), k = RK[PY.DEF[id].role], S = G.RPG && G.RPG.S;
    if (k && S) { const lp = (PY.data(id) || {}).lv || 1, lh = (G.RPG.d() || {}).lv || 1, f = Math.min(1, 0.55 + 0.45 * lp / Math.max(1, lh));
      s.atk = Math.max(s.atk, (S.atk || 0) * k[0] * f); s.hp = Math.max(s.hp, (H.hpMax || 0) * k[1] * f); s.def = Math.max(s.def, (S.def || 0) * k[2] * f); }
    SC_[id] = { t: now, s }; return s; };
  PY.statsFlush = () => { for (const k in SC_) delete SC_[k]; };
  /* ---------- 6. 出招回饋：腳下定位色環 ---------- */
  const COL = { autonomous: '235,235,235', command: '120,210,255', smallCombo: '140,255,170', grandCombo: '255,210,70' };
  const cast0 = PY.cast; PY.cast = function (P, ch, why) { const ok = cast0.apply(this, arguments);
    if (ok && ch !== 'ordinary' && G.VX && G.VX.ring) { const g = ch === 'grandCombo';
      G.VX.ring({ x: P.x, y: P.y, r1: g ? 2.2 : 1.3, life: g ? 30 : 20, col: COL[ch] || COL.autonomous, lw: g ? 0.14 : 0.1 });
      if (g) G.VX.ring({ x: P.x, y: P.y, r1: 1.4, life: 24, d: 6, col: COL.grandCombo, lw: 0.1 });
      if (P.say) P.say.ch = ch; }
    return ok; };
  G.P5 = { lv5, CDK, RK };
})();
