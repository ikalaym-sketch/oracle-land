/* ==========================================================================
 * 神諭之地 重製版 — 121_pfx3.js
 * Version : r3.86.0  (2026-11-25)
 * 變更    : r3.86.0 新增。第 4 批：隱藏夥伴（役小角／建御雷／源賴光）專屬招式特效與大絕，全部用現成素材。
 *           ・共通：加進 G.PFX2（91_pfx 疊加特效、圓環、區域外框不再畫）；招式數值不動，大絕另外追加範圍傷害。
 *           ・役小角：
 *             青式神（鳥）放出時＝多重風刃（4 道，翻轉搖擺＋速度線，碰到敵人切割）。
 *             赤式神（猴）出擊＝火焰彈（ezo 火彈）飛到目標炸裂（火彈命中＋火星爆＋餘燼），周圍敵人吃濺射。
 *             大絕：神通・役靈同行／兩界渡＝前鬼現身（立誓法陣）揮斧劈地（赤色爪弧＋地裂碎石＋衝刺塵，前方 5 身長直線）
 *                   ＋後鬼現身傾倒（傾倒弧）放出 7 身長水線（一段段往前湧，碰到就中）。
 *                   山行護陣＝前鬼劈斧。行法・回風路＝風道。
 *           ・建御雷：遠距命中＝雷獸落雷；近距命中＝雷擊火花；天雷直貫＝沿直線 5 道落雷＋落地雷擊；雷鼓定界＝目標周圍電爆。
 *             大絕：神降・建御雷＝頭頂雷雲＋4 身長範圍內 8 道落雷；雷神・一劍天斷＝7 身長直線連鎖落雷；
 *                   鳴雷天網＝三波，每波 3 身長內所有敵人電爆＋落雷。
 *           ・源賴光：一般刀擊＝連斬殘影；見切返刃／童子切・拔斷＝大居合斬（收刀閃光是白色十字星，不用）；
 *             大絕：童子切・百鬼斷／破邪＝刀氣纏身後瞬斬 4 身長內最多 6 隻（每隻大居合＋連斬）；鎮惡門＝反擊時架開火花＋前方 3 身長大居合。
 * 依賴    : 49_party（PARTY.dmg／list）、50_party_kit（G.PEV.run、G.PKIT）、91_pfx、99_partner6（式神／神影動作）、117_teppo（G.KF.clip）、120_pfx2（G.PFX2、G.PFX2F）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, PEV = G.PEV, VX = G.VX, H = G.H, SC = G.SC; if (!PY || !PEV || !VX || !G.PFX2) return;
  const IDS = ['enno', 'takemikazuchi', 'yorimitsu']; IDS.forEach(id => G.PFX2.add(id));
  const KF = () => G.KF, F2 = () => G.PFX2F || {}, HH = () => G.HERO_H, S = y => SC.depth(y), K = y => HH() * S(y), TK = 1000 / 60;
  const rnd = (a, b) => a + Math.random() * (b - a), alive = e => e && e.st !== 'dead' && e.hp > 0;
  const clip = o => G.KF && G.KF.clip ? G.KF.clip(o) : null, at = (u, n, x, y, o) => clip(Object.assign({ u, n, x, y }, o || {}));
  const later = (d, fn) => { if (d <= 0) return fn(); VX.custom(() => {}, d + 1, 'o', { step: (q, tt) => { if (tt === d) { try { fn(); } catch (x) { console.warn('pfx3', x); } } } }); };
  const dmg = (P, e, m, big) => { try { PY.dmg(P, e, m, { ch: 'pfx2', big }); } catch (x) {} };
  const near = (x, y, r, n) => G.E.filter(e => alive(e) && !e.bb && Math.hypot(e.x - x, (e.y - y) * 1.6) < r).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, n || 99);
  const inLane = (x0, y0, f, len, w) => G.E.filter(e => alive(e) && !e.bb && (e.x - x0) * f > -0.2 * HH() && (e.x - x0) * f < len && Math.abs(e.y - y0) < w);
  const tgOf = (P, c) => { const e = c && alive(c.tg) ? c.tg : P.tg; return alive(e) ? e : null; };
  const durF = (u, n) => { const U = G.ANIM.get(u), r = U && ((U.act && U.act[n]) || (U.fx && U.fx[n])); return r ? Math.round(G.ANIM.dur(r) / TK) : 30; };
  const PACKS = { enno: ['b_ezo', 'b_ibaraki', 'b_mb_zenki', 'b_mb_goki', 'b_susanoo'], takemikazuchi: ['b_raiju', 'b_susanoo'], yorimitsu: ['b_yoshitsune', 'b_susanoo'] };
  const asked = {}; function preload() { for (const P of PY.list) for (const u of PACKS[P.id] || []) if (!asked[u] && !G.ANIM.get(u)) { asked[u] = 1; try { const q = G.ANIM.load(u); if (q && q.catch) q.catch(() => { asked[u] = 0; }); } catch (x) { asked[u] = 0; } } }
  const BIG = new Set(['grandCombo', 'A6', 'B6']);

  /* ======================= 役小角 ======================= */
  function fireBomb(P, e, m) { const x0 = P.x, y0 = P.y, z0 = 0.9, T = 12; let t = 0, ex = e.x, ey = e.y;
    at('b_ezo', 'fx_firebolt', 0, 0, { fx: () => { if (alive(e)) { ex = e.x; ey = e.y; } const u = Math.min(1, t / T); return [x0 + (ex - x0) * u, y0 + (ey - y0) * u - Math.sin(u * Math.PI) * 0.9 * K(y0)]; }, z: z0 * 0.6, w: 0.7, flip: ex < x0, life: T, step: () => { t++; } });
    later(T, () => { at('b_ezo', 'fx_firebolt_hit', ex, ey, { z: 0.45, w: 1.1 }); at('b_ezo', 'fx_ember_burst', ex, ey, { z: 0.35, w: 1.3 }); KF().use('ember', () => KF().embers(ex, ey, 0.4, 10));
      for (const q of near(ex, ey, 0.9 * HH())) if (q !== e) dmg(P, q, m, 0); }); }
  function zenki(P, f, big) { const k = K(P.y), x = P.x + f * 0.9 * k, y = P.y, T = durF('b_mb_zenki', 'zenki_cleave_right3q'), hitT = Math.round(T * 0.55), L = (big ? 5 : 4) * HH();
    at('b_mb_zenki', 'zenki_vow_sigil', x, y, { w: 2.2, l: 'g', life: T + 10, a: 0.85 });
    at('b_mb_zenki', 'zenki_cleave_right3q', x, y, { w: big ? 2.6 : 2.2, flip: f < 0, life: T + 6 });
    later(hitT, () => { const cx = x + f * L * 0.45; at('b_ibaraki', 'ibaraki_claw_arc', cx, y, { z: 0.5, w: L / HH() * 0.75, flip: f < 0, life: 22 });   // 前鬼劈斬原圖偏白（39%），改用赤色爪弧
      for (let i = 1; i <= 4; i++) { const px = x + f * L * i / 4.4; later(i * 2, () => { VX.s2('fx_crack_m', { x: px, y, k: 1.0, sy: 0.55, l: 'g', life: 60 }); KF().use('ember', () => KF().rocks(px, y, 5, 1.3)); }); }
      at('b_mb_zenki', 'zenki_rush_dust', x + f * L * 0.3, y, { w: 2.4, flip: f < 0, life: 26, a: 0.8 }); SC.shake = Math.max(SC.shake || 0, 9);
      for (const e of inLane(x, y, f, L, 0.9 * k)) dmg(P, e, big ? 1.6 : 1.2, 1); }); return T; }
  function goki(P, f, d) { later(d, () => { const k = K(P.y), x = P.x - f * 0.2 * k, y = P.y + 0.15 * k, T = durF('b_mb_goki', 'goki_pour_right3q'), L = 7 * HH(), hit = new Set();
    at('b_mb_goki', 'goki_pour_right3q', x, y, { w: 2.2, flip: f < 0, life: T + 6 }); at('b_mb_goki', 'goki_vessel_cue', x + f * 0.5 * k, y, { z: 1.0, w: 1.0, life: 20 });
    later(Math.round(T * 0.45), () => { at('b_mb_goki', 'goki_pour_arc', x + f * 1.0 * k, y, { z: 0.6, w: 2.2, flip: f < 0, life: 24 });
      for (let i = 0; i < 6; i++) later(i * 4, () => { const px = x + f * (1.4 + i * 1.05) * HH(); at('b_mb_goki', 'goki_water_line', px, y, { w: 1.7, flip: f < 0, life: 30, l: 'g' });
        for (const e of G.E) if (alive(e) && !e.bb && !hit.has(e) && Math.abs(e.x - px) < 0.7 * HH() && Math.abs(e.y - y) < 0.9 * k) { hit.add(e); dmg(P, e, 1.2, 1); } }); }); }); }
  function enno(P, ev, c, e, sid, f) {
    if (ev.k === 'proj') { const pw = F2().windBlades; if (pw) pw(P, P.x, P.y, f, 4, 6, 0.4, 0.25); return; }
    if (ev.k === 'hit' && e && !BIG.has(sid) && (ev.fx || sid !== 'ordinary')) fireBomb(P, e, 0.35);
    if (ev.k === 'zone') { const Z = PY.zones[PY.zones.length - 1]; if (Z && Z.P === P) at('b_susanoo', 'fx_wind_path', Z.x, Z.y, { w: Z.r * 2.4 / K(Z.y), l: 'g', life: Math.min(Z.life, 90), a: 0.85 }); } }
  function ennoBig(P, c, sid, f) { if (sid === 'B6') { zenki(P, f, 0); return; } const T = zenki(P, f, sid === 'grandCombo'); goki(P, f, Math.round(T * 0.5)); }

  /* ======================= 建御雷 ======================= */
  /* 錨點在上緣的素材（落雷）：往上抬一整個圖高，讓雷尖落在目標腳下 */
  const hz = (u, n, w) => { const U = G.ANIM.get(u), r = U && ((U.act && U.act[n]) || (U.fx && U.fx[n])); if (!r) return 0; return w * Math.max(...r.f.map(f => f[3])) / Math.max(...r.f.map(f => f[2])); };
  const bolt = (x, y, w) => { w = w || 1.0; at('b_raiju', 'raijuo_bolt', x, y, { z: hz('b_raiju', 'raijuo_bolt', w) * 0.97, w, life: 18 }); at('b_susanoo', 'fx_lightning_hit', x, y, { z: 0.3, w: 0.8, life: 14 }); };
  function boltRain(P, x, y, R, n, gap, m) { for (let i = 0; i < n; i++) later(i * gap, () => { const q = near(x, y, R * HH()), t = q.length && Math.random() < 0.7 ? q[Math.floor(Math.random() * q.length)] : null;
      const bx = t ? t.x : x + rnd(-R, R) * HH(), by = t ? t.y : y + rnd(-R, R) * 0.35 * HH(); bolt(bx, by, 0.9); for (const e of near(bx, by, 0.7 * HH())) dmg(P, e, m, 1); SC.shake = Math.max(SC.shake || 0, 4); }); }
  function boltLine(P, f, n, gap, step, m) { const x0 = P.x, y0 = P.y, hit = new Set();
    for (let i = 0; i < n; i++) later(i * gap, () => { const x = x0 + f * (0.8 + i * step) * HH(); bolt(x, y0, 0.9); at('b_raiju', 'raijuo_ground_impact', x, y0, { w: 1.3, l: 'g', life: 24 });
      for (const e of G.E) if (alive(e) && !e.bb && !hit.has(e) && Math.abs(e.x - x) < step * 0.6 * HH() && Math.abs(e.y - y0) < 0.9 * K(y0)) { hit.add(e); dmg(P, e, m, 1); } SC.shake = Math.max(SC.shake || 0, 5); }); }
  function take(P, ev, c, e, sid, f) { if (ev.k !== 'hit') return;
    if (sid === 'command') { boltLine(P, f, 5, 3, 0.9, 0.3); return; }
    if (sid === 'B3') { for (const q of near(e ? e.x : P.x, e ? e.y : P.y, 1.6 * HH(), 4)) at('b_raiju', 'raijuo_electric_burst', q.x, q.y, { z: 0.4, w: 1.0, life: 20 }); return; }
    if (sid === 'B6') { const x = e ? e.x : P.x + f * 2 * HH(), y = e ? e.y : P.y; for (const q of near(x, y, 3 * HH(), 8)) { at('b_raiju', 'raijuo_electric_burst', q.x, q.y, { z: 0.4, w: 1.2, life: 22 }); later(4, () => alive(q) && bolt(q.x, q.y, 0.9)); } SC.shake = Math.max(SC.shake || 0, 5); return; }
    if (BIG.has(sid) || !e) return;
    if (ev.ranged) bolt(e.x, e.y, 0.9); else at('b_susanoo', 'fx_lightning_hit', e.x, e.y, { z: (e.ratio || 1) * 0.5, w: 0.8, life: 14 }); }
  function takeBig(P, c, sid, f, e) { const x = e ? e.x : P.x + f * 2 * HH(), y = e ? e.y : P.y;
    if (sid === 'grandCombo') { at('b_raiju', 'raijuo_storm_cloud', x, y, { z: 2.3, w: 5.5, loop: 1, life: 130, a: 0.9 }); boltRain(P, x, y, 4, 8, 11, 0.6); later(90, () => at('b_raiju', 'raijuo_ground_impact', x, y, { w: 2.6, l: 'g', life: 30 })); }
    else if (sid === 'A6') boltLine(P, f, 8, 2, 0.9, 0.9); }

  /* ======================= 源賴光 ======================= */
  let flipT = 0;
  function iai(P, x, y, f, w) { at('b_yoshitsune', 'fx_yoshitsune_iai_slash', x, y, { z: 0.5, w, flip: f < 0, life: 18 }); }
  function yori(P, ev, c, e, sid, f) { if (ev.k !== 'hit') return;
    if (sid === 'B6') { if (ev.t >= 1500) { at('b_susanoo', 'fx_parry_spark', P.x + f * 0.4 * K(P.y), P.y, { z: 0.6, w: 1.1, life: 16 }); const L = 3 * HH();
        later(4, () => { iai(P, P.x + f * L * 0.5, P.y, f, 3.4); at('b_yoshitsune', 'fx_yoshitsune_combo_streaks', P.x + f * L * 0.5, P.y, { z: 0.5, w: 3.0, flip: f < 0, life: 20 }); for (const q of inLane(P.x, P.y, f, L, 0.9 * K(P.y))) dmg(P, q, 1.0, 1); SC.shake = Math.max(SC.shake || 0, 6); }); }
      else if (e) iai(P, e.x, e.y, f, 1.8); return; }
    if (BIG.has(sid) || !e) return;
    if (ev.big || ev.useMikiri) { iai(P, e.x, e.y, f, 2.4); return; }
    if (ev.fx) at('b_yoshitsune', 'fx_yoshitsune_combo_streaks', e.x, e.y, { z: (e.ratio || 1) * 0.5, w: 1.1, flip: (flipT++ % 2) ? f > 0 : f < 0, rot: rnd(-0.3, 0.3), life: 14 }); }
  function yoriBig(P, c, sid, f) { if (sid === 'B6') return; at('b_yoshitsune', 'fx_yoshitsune_sword_aura', 0, 0, { fx: () => [P.x, P.y], z: 0.5, w: 1.6, life: 30, a: 0.9 });
    const L = near(P.x + f * 2 * HH(), P.y, 4 * HH(), 6); L.forEach((q, i) => later(14 + i * 5, () => { if (!alive(q)) return; const ff = Math.sign(q.x - P.x) || f;
      iai(P, q.x, q.y, ff, 2.8); at('b_yoshitsune', 'fx_yoshitsune_combo_streaks', q.x, q.y, { z: (q.ratio || 1) * 0.5, w: 2.2, flip: ff < 0, rot: rnd(-0.4, 0.4), life: 16 }); dmg(P, q, sid === 'grandCombo' ? 1.0 : 0.8, 1); SC.shake = Math.max(SC.shake || 0, 4); })); }

  /* ======================= 掛上 ======================= */
  const run0 = PEV.run.bind(PEV); PEV.run = function (P, ev, c) { const r = run0(P, ev, c);
    try { if (P && IDS.includes(P.id)) { const sid = (c && c.sid) || '', e = tgOf(P, c), f = P.face || 1;
        if (P.id === 'enno') enno(P, ev, c, e, sid, f); else if (P.id === 'takemikazuchi') take(P, ev, c, e, sid, f); else yori(P, ev, c, e, sid, f);
        if (BIG.has(sid) && c && !c.__pf3) { c.__pf3 = 1; VX.dimA = 0.32; VX.dimT = 26; if (P.id === 'enno') ennoBig(P, c, sid, f); else if (P.id === 'takemikazuchi') takeBig(P, c, sid, f, e); else yoriBig(P, c, sid, f); } } }
    catch (x) { console.warn('pfx3', x); } return r; };
  const st0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { st0.apply(this, arguments); if (G.t % 120 === 7) preload(); };
})();
