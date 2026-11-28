/* ==========================================================================
 * 神諭之地 重製版 — 170_wskill.js
 * Version : r3.230.0  (2026-11-28)　r3.230.0：新增。打刀（水）、野太刀（火）、薙刀（風／葉）的技與特技重新設計
 * 內容    : 三把武器共 23 招（千本櫻、櫻花亂舞與各奧義不動）：
 *           ・每招分「起手 → 主攻 → 停頓 → 收招」，時間單位 1/60 秒；Lv1／3／5／7／10 各有畫面看得到的加強。
 *           ・揮砍的弧線沿用普攻定案的畫法（168_wfx 的 arc，o.free）。
 *           ・主題特效一律先用現成手繪素材：
 *             水＝p_shion_fx（water_wave／water_hit／glide_water）、b_kappa（tide_wave／water_jet／water_splash）
 *             火＝b_ezo（fx_fire_pillar／fx_firebolt／fx_firebolt_hit／fx_ember_burst／fx_heat_embers）、p_ibaraki_fx（flame_rise／flame_contact）、b_osakabe（osakabe_fire_field）
 *             風＝b_susanoo（fx_tornado_birth／loop／end、fx_wind_gather／path／ribbons）
 *             再加程式畫的葉片、水珠、火星（大小、速度、壽命各不同）。
 *           ・圖集：拿到該武器時依序載入，持續標記使用中。
 *           ・說明文字（含 Lv7、Lv10）與冷卻（技 5 秒、特技 9 秒）由這裡寫回武器資料。
 * 依賴    : 168_wfx（G.WFX.arc）、111_katana_fx（G.KF）、88_rune（G.AFX）、12_anim、77_moves（腳本的 c）、G.BUFF。
 *           掛在 NPCLIFE.step 最後面，把 MV2.U[武器][招] 的 run／counter 換成這裡的。
 * ========================================================================== */
'use strict';
G.WSK = (function () {
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), K = y => G.KF.K(y), add = function () { return G.KF.add.apply(G.KF, arguments); };
  const AF = () => G.AFX, H = G.H, alive = e => e && e.st !== 'dead', shake = v => { G.SC.shake = Math.max(G.SC.shake || 0, v); }, stop = n => { G.hitstop = Math.max(G.hitstop || 0, n); };
  const LV = c => c.a.mvx.lv || 1, ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2.4), pick = (lv, a) => a[lv >= 10 ? 4 : lv >= 7 ? 3 : lv >= 5 ? 2 : lv >= 3 ? 1 : 0];
  const sp = (u, cl, x, y, size, o) => AF().play(u, cl, Object.assign({ x, y, size }, o || {}));
  const arc = (c, o) => G.WFX.arc(Object.assign({ x: c.x, y: c.y, f: c.f, free: 1 }, o), o.r || 1.4);
  const say = (t, kk) => G.NUMS.push({ x: H.x, y: H.y - 1.25 * kk, v: t, t: 0, pop: G.t, txt: 1 });
  const foes = (x, y, R) => G.E.filter(e => alive(e) && Math.hypot(e.x - x, (e.y - y) * 2) < R);
  const drag = (e, x, y, s) => { if (e.boss || e.bb) return; const nx = e.x + (x - e.x) * s, ny = e.y + (y - e.y) * s; if (G.SC.walkable(nx, ny)) { e.x = nx; e.y = ny; } };
  /* 粒子：leaf 葉片／drop 水珠／ember 火星。每顆大小、速度、壽命、起始時間都不同 */
  const COL = { leaf: ['#a9cf9e', '#c9dfa6', '#e3d38c', '#8fbf8c'], ember: ['#ffe2a0', '#ffb45a', '#ff8a3a'] };
  function pts(kind, x, y, k, n, o) { o = o || {}; const P = [], life = o.life || 28, stag = o.stag === undefined ? 5 : o.stag;
    for (let i = 0; i < n; i++) { const a = o.dir === undefined ? rnd(0, TAU) : o.dir + rnd(-1, 1) * (o.spread === undefined ? 0.5 : o.spread), v = rnd(0.45, 1.15) * (o.sp || 2) * k / 60;
      P.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - (o.up || 0) * k / 60, s: Math.random() < 0.25 ? rnd(1.3, 1.9) : rnd(0.55, 1.1), r0: rnd(0, TAU), w: rnd(-0.3, 0.3), t0: rnd(0, stag), life: rnd(0.55, 1) * life, ox: rnd(-1, 1) * (o.rx || 0) * k, oy: rnd(-1, 1) * (o.ry || 0) * k, ci: Math.floor(Math.random() * 4), orb: o.orb ? rnd(0.6, 1) * o.orb * k : 0, oa: rnd(0, TAU), os: rnd(0.12, 0.22) * (o.spin || 1) }); }
    const g = kind === 'drop' ? 0.05 : kind === 'ember' ? -0.012 : 0.006;
    add(life + stag + 2, o.layer || 'o', (ctx, u) => { const cx = o.follow ? H.x + (o.fx || 0) : x, cy = o.follow ? H.y + (o.fy || 0) : y;
      for (const p of P) { const v = u - p.t0; if (v < 0 || v > p.life) continue; const a = 1 - Math.pow(v / p.life, 2); let px, py, vx = p.vx, vy = p.vy + g * v;
        if (p.orb) { const an = p.oa + p.os * v, r = p.orb * (o.inward ? 1 - 0.8 * v / p.life : 0.5 + 0.5 * v / p.life); px = cx + Math.cos(an) * r; py = cy + p.oy + Math.sin(an) * r * 0.36 - (o.up || 0) * k / 60 * v; vx = -Math.sin(an); vy = Math.cos(an) * 0.36; }
        else { px = cx + p.ox + p.vx * v; py = cy + p.oy + p.vy * v + g * v * v * 0.5; }
        ctx.save(); ctx.translate(px, py);
        if (kind === 'leaf') { const s = k * 0.075 * p.s; ctx.rotate(p.r0 + p.w * v); ctx.globalAlpha = a * 0.92; ctx.fillStyle = COL.leaf[p.ci]; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.55, s, 0); ctx.quadraticCurveTo(0, s * 0.55, -s, 0); ctx.fill(); ctx.strokeStyle = 'rgba(70,110,70,' + a * 0.5 + ')'; ctx.lineWidth = Math.max(0.5, s * 0.08); ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(s * 0.8, 0); ctx.stroke(); }
        else if (kind === 'drop') { const s = k * 0.06 * p.s, st = 1 + Math.min(1.6, Math.hypot(vx, vy) * 0.5); ctx.rotate(Math.atan2(vy, vx)); ctx.globalAlpha = a * 0.6; ctx.fillStyle = 'rgb(120,176,226)'; ctx.beginPath(); ctx.moveTo(s * 0.6, 0); ctx.quadraticCurveTo(0, -s * 0.5, -s * 1.2 * st, 0); ctx.quadraticCurveTo(0, s * 0.5, s * 0.6, 0); ctx.fill();
          ctx.globalAlpha = a * 0.95; ctx.fillStyle = 'rgb(200,230,250)'; ctx.beginPath(); ctx.moveTo(s * 0.55, 0); ctx.quadraticCurveTo(0, -s * 0.34, -s * 0.8 * st, 0); ctx.quadraticCurveTo(0, s * 0.26, s * 0.55, 0); ctx.fill(); ctx.fillStyle = 'rgb(248,253,255)'; ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.1, s * 0.2, s * 0.09, 0, 0, TAU); ctx.fill(); }
        else { const s = k * 0.03 * p.s; ctx.rotate(p.r0); ctx.globalAlpha = a; ctx.fillStyle = COL.ember[p.ci % 3]; ctx.beginPath(); ctx.moveTo(0, -s * 1.5); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0); ctx.closePath(); ctx.fill(); }
        ctx.restore(); } }); }
  /* 飛行物：沿直線飛，每格判定一次；o={x,y,f,dist,dur,r,m,lv,kind,kb,launch,slow,d0,vis(px,py,i),end(px,py),back}。c.later 排程，招式結束後照常跑 */
  function fly(c, o) { const k = K(o.y), sk = [], dur = o.dur || 16, d0 = o.d0 || 0, tot = o.back ? dur * 2 : dur;
    for (let i = 0; i <= tot; i++) c.later(d0 + i, () => { const q = i <= dur ? i / dur : 2 - i / dur; if (i === dur && o.back) sk.length = 0; const px = o.x + o.f * o.dist * k * q, py = o.y + (o.dy || 0) * k * q; if (o.vis) o.vis(px, py, i);
      if (o.m) c.hit({ shape: 'circle', x: px, y: py, r: o.r || 0.7, m: o.m, lv: o.lv || 'mid', kind: o.kind || 'cut', kb: o.kb, launch: o.launch, slow: o.slow, skip: sk }).forEach(e => sk.push(e)); if (i === tot && o.end) o.end(px, py); });
    return [o.x + o.f * o.dist * k, o.y + (o.dy || 0) * k]; }
  const flyPos = (o, u) => { const k = K(o.y), dur = o.dur || 16, v = u, q = v <= dur ? v / dur : o.back ? 2 - v / dur : 1; return [o.x + o.f * o.dist * k * q, o.y + (o.dy || 0) * k * q]; };
  /* ---------- 水 ---------- */
  const W = {
    gather(x, y, k, life, sc) { sp('p_shion_fx', 'glide_water', x, y, k * 2.0 * (sc || 1), { by: 'w', tpf: Math.max(2, Math.round(life / 8)), layer: 'g' }); pts('drop', x, y - 0.5 * k, k, 8, { orb: 0.9 * (sc || 1), inward: 1, up: 0.6, life: life + 4, stag: life * 0.6 }); },
    /* 水環：手繪漣漪＋兩圈往外擴的水紋（漣漪本身很細，在淺色地面上要補強） */
    ring(x, y, k, sc, d0) { sc = sc || 1; d0 = d0 || 0; sp('p_shion_fx', 'glide_water', x, y, k * 2.6 * sc, { by: 'w', tpf: 3, layer: 'g', delay: d0 }); add(d0 + 26, 'g', (ctx, u) => { const v = u - d0; if (v < 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4); for (let j = 0; j < 2; j++) { const q = Math.min(1, (v - j * 6) / 20); if (q <= 0) continue; ctx.strokeStyle = 'rgba(' + (j ? '150,205,240' : '225,244,255') + ',' + 0.8 * (1 - q) + ')'; ctx.lineWidth = Math.max(1, k * (0.06 - 0.04 * q)); ctx.beginPath(); ctx.arc(0, 0, k * (0.4 + 1.0 * q) * sc, 0, TAU); ctx.stroke(); } ctx.restore(); }); },
    splash(x, y, k, sc, d0) { sc = sc || 1; sp('p_shion_fx', 'water_hit', x, y - 0.45 * k * sc, k * 2.2 * sc * rnd(0.9, 1.15), { tpf: 3, delay: d0 || 0, flip: Math.random() < 0.5 }); G.STORY.later(d0 || 0, () => pts('drop', x, y - 0.5 * k, k, Math.round(7 * sc + 3), { sp: 3.2 * sc, up: 1.6, life: 30 })); },
    column(x, y, k, sc, d0) { sc = sc || 1; sp('b_kappa', 'kappataisho_water_splash', x, y - 0.75 * k * sc, k * 1.9 * sc * rnd(0.85, 1.2), { by: 'h', tpf: 4, delay: d0 || 0, flip: Math.random() < 0.5 }); sp('p_shion_fx', 'glide_water', x, y, k * 2.2 * sc, { by: 'w', tpf: 3, layer: 'g', delay: d0 || 0 }); G.STORY.later((d0 || 0) + 2, () => pts('drop', x, y - 0.3 * k, k, Math.round(8 * sc), { dir: -Math.PI / 2, spread: 0.7, sp: 4 * sc, life: 34 })); },
    /* 浪：手繪浪頭往前推；回傳終點 */
    wave(c, o) { const k = K(o.y), dur = o.dur || 18, sc = o.sc || 1, f = o.f; sp('p_shion_fx', 'water_wave', o.x, o.y, k * 1.8 * sc, { by: 'h', tpf: Math.max(2, Math.round((o.back ? dur * 2 : dur) / 8)), delay: o.d0 || 0, flip: f < 0, at: u => { const p = flyPos(o, u); return [p[0], p[1] - 0.6 * k * sc]; } });
      return fly(c, Object.assign({ r: 0.8 * sc, kind: 'cut', vis: (px, py, i) => { if (i % 3 === 0) pts('drop', px - f * 0.3 * k, py - 0.5 * k, k, 2, { dir: f > 0 ? Math.PI * 1.2 : -0.2 * Math.PI, sp: 2, up: 0.8, life: 22, stag: 1 }); } }, o)); },
    tide(x, y, f, k, sc, d0, dist) { const o = { x, y, f, dist: dist || 1.4, dur: 14 }; sp('b_kappa', 'kappataisho_tide_wave', x, y, k * 2.4 * (sc || 1), { by: 'w', anc: 'b', tpf: 3, delay: d0 || 0, flip: f < 0, at: u => { const p = flyPos(o, u); return [p[0], p[1] + 0.08 * k]; } }); } };
  /* ---------- 火 ---------- */
  const F = {
    gather(x, y, k, life, sc) { sp('b_ezo', 'fx_heat_embers', x, y + 0.1 * k, k * 2.2 * (sc || 1), { by: 'w', anc: 'b', tpf: Math.max(2, Math.round(life / 4)) }); pts('ember', x, y - 0.2 * k, k, 10, { orb: 0.8 * (sc || 1), inward: 1, up: 1.4, life: life + 6, stag: life * 0.7 }); },
    pillar(x, y, k, sc, d0) { sc = sc || 1; const h = k * rnd(2.6, 3.6) * sc; sp('b_ezo', 'fx_fire_pillar', x, y + 0.1 * k, h, { by: 'h', anc: 'b', tpf: 5, delay: d0 || 0, flip: Math.random() < 0.5 }); sp('b_ezo', 'fx_heat_embers', x, y + 0.12 * k, k * 1.9 * sc, { by: 'w', anc: 'b', tpf: 5, delay: (d0 || 0) + 2 });
      G.STORY.later((d0 || 0) + 3, () => { pts('ember', x, y - 0.3 * k, k, Math.round(6 * sc + 3), { dir: -Math.PI / 2, spread: 0.6, sp: 3.4 * sc, life: 36 }); if (sc >= 1) shake(3 * sc); }); },
    blast(x, y, k, sc, d0) { sc = sc || 1; sp('b_ezo', 'fx_firebolt_hit', x, y, k * 2.4 * sc * rnd(0.9, 1.15), { tpf: 4, delay: d0 || 0, flip: Math.random() < 0.5 }); sp('p_ibaraki_fx', 'flame_contact', x, y, k * 2.0 * sc, { tpf: 3, delay: (d0 || 0) + 1, ang: rnd(0, TAU) });
      G.STORY.later(d0 || 0, () => { pts('ember', x, y, k, Math.round(8 * sc + 4), { sp: 4 * sc, up: 0.8, life: 34 }); shake(4 * sc); }); },
    swoosh(x, y, f, k, sc, d0, ang) { sp('b_ezo', 'fx_ember_burst', x, y, k * 2.2 * (sc || 1) * rnd(0.85, 1.2), { tpf: 4, delay: d0 || 0, flip: f < 0, ang: ang || 0 }); },
    rise(x, y, f, k, sc, d0) { sp('p_ibaraki_fx', 'flame_rise', x, y, k * 2.6 * (sc || 1), { tpf: 3, delay: d0 || 0, flip: f < 0 }); },
    field(x, y, k, life, sc, d0) { sp('b_osakabe', 'osakabe_fire_field', x, y + 0.12 * k, k * 2.4 * (sc || 1), { by: 'w', anc: 'b', tpf: 5, loop: Math.max(1, Math.round(life / 20)), fin: 8, fade: 14, delay: d0 || 0 }); },
    /* 火月牙／火彈：手繪火彈往前飛 */
    bolt(c, o) { const k = K(o.y), f = o.f, sc = o.sc || 1, dur = o.dur || 16; sp('b_ezo', 'fx_firebolt', o.x, o.y, k * 2.0 * sc, { by: 'w', tpf: 3, loop: Math.ceil((o.back ? dur * 2 : dur) / 12) + 1, fade: 4, delay: o.d0 || 0, flip: f < 0, at: u => { if (u > (o.back ? dur * 2 : dur)) return null; const p = flyPos(o, u); return [p[0], p[1] - 0.55 * k]; } });
      return fly(c, Object.assign({ r: 0.75 * sc, vis: (px, py, i) => { if (i % 2 === 0) pts('ember', px - f * 0.4 * k, py - 0.55 * k, k, 2, { sp: 1, up: 0.6, life: 20, stag: 1 }); if (o.trail && i % 5 === 2) F.field(px, py, k, 80, 0.7); } }, o)); } };
  /* ---------- 風 ---------- */
  const N = {
    gather(x, y, k, life, sc) { sp('b_susanoo', 'fx_wind_gather', x, y - 0.5 * k, k * 2.0 * (sc || 1), { tpf: Math.max(2, Math.round(life / 4)) }); pts('leaf', x, y - 0.4 * k, k, 9, { orb: 1.1 * (sc || 1), inward: 1, up: 0.5, life: life + 6, stag: life * 0.6, spin: 1.4 }); },
    ribbons(x, y, f, k, sc, d0, ang) { sp('b_susanoo', 'fx_wind_ribbons', x, y, k * 2.6 * (sc || 1) * rnd(0.85, 1.2), { by: 'w', tpf: 4, delay: d0 || 0, flip: f < 0, ang: ang || 0 }); },
    /* 風刃／陣風：手繪風路往前飛，帶葉片 */
    gust(c, o) { const k = K(o.y), f = o.f, sc = o.sc || 1, dur = o.dur || 14; sp('b_susanoo', 'fx_wind_path', o.x, o.y, k * 2.4 * sc * rnd(0.9, 1.15), { by: 'w', tpf: Math.max(2, Math.round(dur / 4)), delay: o.d0 || 0, flip: f < 0, ang: (o.dy || 0) ? Math.atan2((o.dy || 0) * 0.6, o.dist) * (f < 0 ? -1 : 1) : 0, at: u => { const p = flyPos(o, u); return [p[0], p[1] - (o.z === undefined ? 0.5 : o.z) * k]; } });
      if (!o.m) { G.STORY.later(o.d0 || 0, () => pts('leaf', o.x, o.y - 0.5 * k, k, 4, { dir: f > 0 ? 0 : Math.PI, spread: 0.35, sp: o.dist * 60 / dur * 0.8, life: dur + 10 })); return; }
      return fly(c, Object.assign({ r: 0.7 * sc, vis: (px, py, i) => { if (i % 3 === 0) pts('leaf', px, py - 0.5 * k, k, 2, { dir: f > 0 ? Math.PI : 0, spread: 0.9, sp: 1.2, life: 22, stag: 1 }); } }, o)); },
    /* 龍捲：生成 → 持續 → 消散，葉片繞著往上捲。follow＝跟著主角 */
    tornado(x, y, k, life, sc, d0, o) { sc = sc || 1; d0 = d0 || 0; o = o || {}; const hgt = k * 3.0 * sc, dy = 0.1 * k + hgt * 0.27, pos = () => o.follow ? [H.x, H.y + dy] : [x, y + dy],   /* 圖的底部有留白，往下補 */ base = { by: 'h', anc: 'b', at: pos };
      AF().play('b_susanoo', 'fx_tornado_birth', Object.assign({ size: hgt, tpf: 4, delay: d0, fade: 0 }, base)); AF().play('b_susanoo', 'fx_tornado_loop', Object.assign({ size: hgt, tpf: 4, loop: Math.max(1, Math.round((life - 16) / 16)), delay: d0 + 16, fade: 0 }, base)); AF().play('b_susanoo', 'fx_tornado_end', Object.assign({ size: hgt, tpf: 4, delay: d0 + 16 + Math.max(1, Math.round((life - 16) / 16)) * 16 }, base));
      for (let i = 0; i * 22 < life; i++) G.STORY.later(d0 + i * 22, () => { const p = pos(); pts('leaf', p[0], p[1] - 0.2 * k, k, Math.round(5 * sc + 2), { orb: 0.75 * sc, up: 2.6, life: 44, spin: 1.8, ry: 0.1 }); }); } };
  /* =====================================================================
   * 打刀（水）
   * ===================================================================== */
  const KAT = {
    /* 居合斬：收刀聚水 → 瞬斬穿過 → 停 → 一道浪沿斬過的路推出去 */
    iai(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx, D = lv >= 3 ? 4.5 : 3;
      if (t === 1) { c.a.T = 60; W.gather(c.x, c.y, kk, 12, 1); m.x0 = c.x; m.y0 = c.y; }
      if (t >= 14 && t <= 18) { c.move(D / 5, 0); c.inv(8); c.ghost(10); }
      if (t === 18) { arc(c, { a0: -1.7, a1: 1.15, r: 1.7, sq: 0.34, rot: -0.08, dur: 4 }); stop(6); shake(5); const f = c.f, x0 = m.x0, y0 = m.y0;
        c.hit({ shape: 'line', x: x0, y: y0, len: D + 1.2, w: 0.6, m: 2.4, lv: 'heavy', kind: 'cut', crit: Math.random() < 0.3 + (lv >= 5 ? 0.3 : 0), slow: lv >= 7 ? 40 : 0 });
        W.wave(c, { x: x0, y: y0, f, dist: D + 1.5, dur: 20, sc: 1.1, d0: 8, m: 0.5, lv: 'mid', kb: 0.6 }); for (let i = 0; i < 4; i++) W.splash(x0 + f * (0.8 + i * D / 4) * kk, y0, kk, rnd(0.6, 1), 8 + i * 4);
        if (lv >= 7) for (let i = 0; i < 3; i++) W.ring(x0 + f * (1 + i * D / 3) * kk, y0, kk, 1, 14 + i * 5);
        if (lv >= 5) c.later(60, () => { const x = x0 + f * D * 0.5 * kk; W.column(x, y0, kk, 1.5); W.ring(x, y0, kk, 1.6); shake(5); c.hit({ shape: 'circle', x, y: y0, r: D * 0.5 + 0.6, m: 1.2, lv: 'heavy', kind: 'cut', launch: 30 }); });
        if (lv >= 10) for (let i = 0; i < 3; i++) { const x = x0 + f * (D + 0.4 + i * 0.9) * kk; W.column(x, y0, kk, 1.2 + i * 0.25, 30 + i * 7); c.later(32 + i * 7, () => c.hit({ shape: 'circle', x, y: y0, r: 1.0, m: 0.5, lv: 'heavy', kind: 'cut', launch: 40 })); } } },
    /* 一閃：蓄力 → 瞬移穿過 → 收刀停一拍 → 被穿過的敵人身上水花同時爆開 */
    issen(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx;
      if (t === 1) { c.a.T = 70; W.gather(c.x, c.y, kk, 20, 1.2); m.sk = []; }
      if (t === 21) { m.p0 = [c.x, c.y]; }
      if (t > 21 && t <= 26) { c.move(3.2 / 5, 0); c.ghost(12); c.inv(12); for (const e of G.E) if (alive(e) && !m.sk.includes(e) && Math.abs(e.x - H.x) < 0.6 * kk && Math.abs(e.y - H.y) < 0.5 * kk) { m.sk.push(e); e.stun = Math.max(e.stun || 0, 40); } }
      if (t === 27) { const [x0, y0] = m.p0, f = c.f, L = Math.abs(H.x - x0); add(26, 'o', (ctx, u) => { const a = u < 18 ? 1 : 1 - (u - 18) / 8; ctx.strokeStyle = 'rgba(230,246,255,' + a + ')'; ctx.lineWidth = Math.max(1, kk * 0.02); ctx.beginPath(); ctx.moveTo(x0, y0 - 0.55 * kk); ctx.lineTo(x0 + f * L, y0 - 0.55 * kk); ctx.stroke(); }); }
      if (t === 45) { stop(10); shake(6); const f = c.f; for (const e of m.sk) { if (!alive(e)) continue; G.damageOni(e, 2.6 * c.mul, true, lv >= 5); W.splash(e.x, e.y, kk, 1.3 * (e.ratio || 1)); W.ring(e.x, e.y, kk, 1); c.a.mvx.hit = 1; if (lv >= 7) e.kb = f * 2.2 * kk / 6 / (e.ratio || 1); }
        if (lv >= 3 && H.cd) for (const q in H.cd) if (/^m:/.test(q)) H.cd[q] = 0;
        if (lv >= 7 && m.p0) W.wave(c, { x: m.p0[0], y: m.p0[1], f, dist: 4.2, dur: 18, sc: 1.2, m: 0.5, kb: 1.2 });
        if (lv >= 10) c.later(22, () => { shake(6); for (const e of m.sk) if (alive(e)) { G.damageOni(e, 1.2 * c.mul, true, false); W.column(e.x, e.y, kk, 1.4 * (e.ratio || 1)); e.air = Math.max(e.air || 0, 40); e.stun = Math.max(e.stun || 0, 40); } }); } },
    /* 燕返：上挑帶起水弧 → 停 → 返刀下斬 */
    tsubame(c, t) { const lv = LV(c), kk = K(c.y), ex = lv >= 7 ? 0.25 : 0;
      if (t === 1) { c.a.T = 44 + (lv >= 3 ? 12 : 0) + (lv >= 5 ? 14 : 0); W.gather(c.x + c.f * 0.4 * kk, c.y, kk, 6, 0.7); }
      if (t === 8) { arc(c, { a0: 1.2, a1: -1.4, r: 1.5, sq: 1, dur: 5 }); c.hit({ shape: 'sector', r: 1.6, arc: 2.0, m: 1.1 + ex, lv: 'mid', kind: 'cut', launch: 40 }); sp('b_kappa', 'kappataisho_water_splash', c.x + c.f * 0.9 * kk, c.y - 0.8 * kk, kk * 2.0, { by: 'h', tpf: 4, flip: c.f < 0 }); pts('drop', c.x + c.f * kk, c.y - 0.6 * kk, kk, 8, { dir: -Math.PI / 2, spread: 0.6, sp: 3.4, life: 30 }); }
      if (t === 24) { arc(c, { a0: -2.1, a1: 0.95, r: 1.6, sq: 1, dur: 5 }); c.hit({ shape: 'sector', r: 1.7, arc: 2.0, m: 1.2 + ex, lv: 'heavy', kind: 'cut', stun: 40, kb: 0.4 }); W.splash(c.x + c.f * 1.1 * kk, c.y, kk, 1.2); W.ring(c.x + c.f * 1.1 * kk, c.y, kk, 1.1); stop(4); shake(4); }
      if (lv >= 3 && t === 38) { arc(c, { a0: -2.4, a1: 1.1, r: 1.7, sq: 0.42, dur: 5 }); c.hit({ shape: 'sector', r: 1.8, arc: 2.4, m: 1.1 + ex, lv: 'mid', kind: 'cut' }); W.tide(c.x + c.f * 0.6 * kk, c.y, c.f, kk, 1, 0, 1.2); }
      if (lv >= 5 && t === 50) { arc(c, { a0: -1.2, a1: 0.9, r: 1.6, sq: 0.6, dur: 4 }); for (const dy of lv >= 10 ? [0, -1.4, 1.4] : [0]) W.wave(c, { x: c.x + c.f * 0.6 * kk, y: c.y, f: c.f, dist: 6, dy, dur: 26, sc: dy ? 0.85 : 1.1, m: dy ? 0.7 : 1.2, lv: 'heavy' }); } },
    /* 一息截隙：一記快斬；打在敵人出手的瞬間＝截隙，必爆擊並大量回氣 */
    special_breath(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 34; W.gather(c.x, c.y, kk, 5, 0.7); }
      if (t !== 7) return; const busy = G.E.filter(e => e.st === 'atk' && !e.atkHit); arc(c, { a0: -0.7, a1: 0.6, r: 1.6, sq: 0.35, dur: 3 });
      const hs = c.hit({ shape: 'sector', r: 1.7, arc: 1.8, m: 1.0, lv: 'mid', kind: 'cut', stun: 40 }), cut = hs.filter(e => busy.includes(e)), d = G.RPG.d(), q = (cut.length ? 30 : 15) * (lv >= 3 ? 1.5 : 1) + (lv >= 10 && cut.length ? 10 : 0);
      d.qi = Math.min(100, (d.qi || 0) + q); G.NUMS.push({ x: H.x, y: H.y - kk - 10, v: '氣 +' + Math.round(q), t: 0, col: '#ffc0d6' }); W.tide(c.x + c.f * 0.5 * kk, c.y, c.f, kk, 0.9, 0, 1.0); if (lv >= 5) G.BUFF.add('aspd', 15, 300);
      if (cut.length) { stop(14); shake(4); G.UI.toast('截隙成功　氣大量回復'); for (const e of cut) { G.damageOni(e, 0.6 * c.mul, true, true); say('截', kk); W.splash(e.x, e.y, kk, 1.3); W.ring(e.x, e.y, kk, 1.2); if (lv >= 10) e.stun = Math.max(e.stun || 0, 90);
          if (lv >= 7) { W.column(e.x, e.y, kk, 1.2, 4); c.later(6, () => c.hit({ shape: 'circle', x: e.x, y: e.y, r: 1.6, m: 0.6, lv: 'mid', kind: 'cut' })); } } } },
    /* 半月歸鞘：收刀架勢，腳下水環；被打自動反擊。沒被打到，架勢結束時補一刀 */
    special_home(c, t) { const lv = LV(c), kk = K(c.y), T = 52 + (lv >= 3 ? 30 : 0);
      if (t === 1) { c.a.T = T; const a0 = c.a; add(T, 'g', (ctx, u) => { if (H.act !== a0) return; const a = Math.min(1, u / 6); AF().fr('p_shion_fx', 'glide_water', 2 + Math.floor(u / 5) % 3, H.x, H.y, { size: kk * (2.4 + 0.15 * Math.sin(u * 0.2)), by: 'w', a: a * 0.9 });
          ctx.save(); ctx.translate(H.x, H.y); ctx.scale(1, 0.4); for (let j = 0; j < 3; j++) { const q = ((u + j * 12) % 36) / 36; ctx.strokeStyle = 'rgba(' + (j % 2 ? '150,205,240' : '225,244,255') + ',' + 0.75 * a * (1 - q) + ')'; ctx.lineWidth = Math.max(1, kk * (0.055 - 0.035 * q)); ctx.beginPath(); ctx.arc(0, 0, kk * (0.35 + 0.95 * q), 0, TAU); ctx.stroke(); } ctx.restore(); }); }
      if (t % 12 === 3 && t < T - 8) pts('drop', H.x, H.y - 0.2 * kk, kk, 2, { orb: 0.8, up: 1, life: 26, stag: 2 });
      if (t === T - 6 && !c.a.mvx.ctr) { arc(c, { a0: -0.6, a1: 0.5, r: 1.8, sq: 0.3, dur: 3 }); c.hit({ shape: 'sector', r: 1.9, arc: 1.6, m: 0.8, lv: 'mid', kind: 'cut' }); W.tide(c.x + c.f * 0.6 * kk, c.y, c.f, kk, 1, 0, 1.2); } },
    /* 返脈斷風：一斬 → 後撤 → 水月牙飛出去 */
    special_return(c, t) { const lv = LV(c), kk = K(c.y), R = lv >= 5 ? 6 : 4;
      if (t === 1) c.a.T = 44;
      if (t === 6) { arc(c, { a0: -2.3, a1: 1.1, r: 1.5, dur: 4 }); c.hit({ shape: 'sector', r: 1.6, arc: 2.2, m: 1.0, lv: 'mid', kind: 'cut' }); pts('drop', c.x + c.f * kk, c.y - 0.5 * kk, kk, 5, { dir: c.f > 0 ? -0.4 : Math.PI + 0.4, sp: 3, life: 24 }); c.a.mvx.px = c.x; c.a.mvx.py = c.y; }
      if (t > 6 && t <= 16) c.move(-0.11 * (lv >= 3 ? 1.4 : 1), 0); if (t === 8) c.ghost(12);
      if (t === 20) { arc(c, { a0: -1.2, a1: 0.9, r: 1.5, sq: 0.6, dur: 4 }); const f = c.f; W.wave(c, { x: c.x + f * 0.6 * kk, y: c.y, f, dist: R, dur: 22, sc: 1, m: 1.2, lv: 'heavy', end: lv >= 7 ? (px, py) => { W.splash(px, py, kk, 1.5); W.ring(px, py, kk, 1.3); c.hit({ shape: 'circle', x: px, y: py, r: 1.4, m: 0.8, lv: 'heavy', kind: 'cut' }); } : null });
        if (lv >= 10) { const x = c.a.mvx.px + f * 0.8 * kk, y = c.a.mvx.py; W.ring(x, y, kk, 1.2); c.later(60, () => { W.column(x, y, kk, 1.7); shake(5); c.hit({ shape: 'circle', x, y, r: 1.5, m: 1.0, lv: 'heavy', kind: 'cut', launch: 50 }); }); } } },
    /* 翻潮織刃：三連進斬，每一斬推出一道潮；第三斬把敵人拉回身前 */
    special_tide(c, t) { const lv = LV(c), kk = K(c.y), FR = [10, 24, 38];
      if (t === 1) { c.a.T = 54 + (lv >= 10 ? 22 : 0); W.gather(c.x, c.y, kk, 7, 0.8); }
      FR.forEach((fr, i) => { if (t > fr - 5 && t <= fr) c.move(0.09, 0);
        if (t === fr) { arc(c, { a0: i % 2 ? 2.0 : -2.0, a1: i % 2 ? -0.9 : 0.9, sq: 0.7, r: 1.4 + i * 0.12, dur: 4 }); c.hit({ shape: 'sector', r: 1.5 + i * 0.12, arc: 2.2, m: 0.8, lv: i === 2 ? 'heavy' : 'mid', kind: 'cut', kb: i === 2 ? 0 : 0.3 * (lv >= 3 ? 1.5 : 1) }); W.tide(c.x + c.f * 0.6 * kk, c.y, c.f, kk, 0.9 + i * 0.2, 0, 1.2 + i * 0.3);
          if (i === 2) { if (lv >= 7) { W.wave(c, { x: c.x + c.f * 0.4 * kk, y: c.y, f: c.f, dist: 2.6, dur: 14, sc: 1.3, m: 0.6, lv: 'heavy' }); shake(4); } if (lv >= 5) { const px = c.x + c.f * 1.0 * kk; c.later(lv >= 7 ? 16 : 2, () => { for (const e of foes(px, c.y, 3 * kk)) if ((e.x - H.x) * c.f > 0) drag(e, px, e.y, 0.7); W.ring(px, c.y, kk, 1.2); }); } } } });
      if (lv >= 10 && t === 58) { arc(c, { a0: -2.5, a1: 1.2, r: 1.9, sq: 0.5, dur: 6 }); shake(6); W.wave(c, { x: c.x + c.f * 0.4 * kk, y: c.y, f: c.f, dist: 4.5, dur: 24, sc: 1.7, m: 1.2, lv: 'heavy', kb: 3 }); } } };
  const KAT_CT = { special_home(c, e) { const lv = LV(c), kk = K(c.y); c.a.mvx.ctr = 1; arc(c, { a0: Math.PI, a1: -Math.PI * 1.02, r: 1.6, sq: 0.4, dur: 6 }); c.hit({ shape: 'circle', r: 1.7, m: 2.2, lv: 'heavy', kind: 'cut', crit: lv >= 5, kb: lv >= 7 ? 1.6 : 0 }); stop(8); shake(5);
      for (const f of [1, -1]) W.wave(c, { x: c.x + f * 0.4 * kk, y: c.y, f, dist: 2.4, dur: 14, sc: 1, m: lv >= 7 ? 0.4 : 0, kb: 0.8 }); W.ring(c.x, c.y, kk, 1.6);
      if (lv >= 10) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = c.x + Math.cos(a) * 1.9 * kk, y = c.y + Math.sin(a) * 1.9 * kk * 0.45; W.column(x, y, kk, rnd(0.9, 1.3), 10 + i * 3); c.later(12 + i * 3, () => c.hit({ shape: 'circle', x, y, r: 0.9, m: 0.4, lv: 'mid', kind: 'cut', launch: 30 })); } } };
  /* =====================================================================
   * 野太刀（火）
   * ===================================================================== */
  const NOD = {
    /* 大車輪：聚火 → 一圈一圈旋轉斬 → 停 → 收尾 */
    skill_daisharin(c, t) { const lv = LV(c), kk = K(c.y), n = 4 + (lv >= 3 ? 2 : 0), gap = 10, te = 12 + n * gap + 8;
      if (t === 1) { c.a.T = te + 24; F.gather(c.x, c.y, kk, 10, 1); }
      for (let i = 0; i < n; i++) if (t === 12 + i * gap) { arc(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.9, sq: 0.38, dur: 8, follow: 1 }); c.move(0.05, 0); c.hit({ shape: 'circle', r: 2.0, m: 0.9, lv: i === n - 1 ? 'heavy' : 'mid', kind: 'cut' }); const a = rnd(0, TAU); F.swoosh(c.x + Math.cos(a) * 1.4 * kk, c.y - 0.5 * kk + Math.sin(a) * 0.5 * kk, Math.cos(a) > 0 ? 1 : -1, kk, 0.9, 2);
          if (lv >= 7) for (let j = 0; j < 2; j++) { const b = rnd(0, TAU), x = c.x + Math.cos(b) * 2.1 * kk, y = c.y + Math.sin(b) * 2.1 * kk * 0.45; F.pillar(x, y, kk, 0.7, 3 + j * 3); c.later(6 + j * 3, () => c.hit({ shape: 'circle', x, y, r: 0.8, m: 0.2, lv: 'light', kind: 'cut' })); } }
      if (lv >= 5 && t === te) { sp('b_ezo', 'fx_heat_embers', c.x, c.y + 0.12 * kk, kk * 5, { by: 'w', anc: 'b', tpf: 5 }); pts('ember', c.x, c.y - 0.2 * kk, kk, 16, { sp: 5, up: 0.6, life: 36 }); shake(5); c.hit({ shape: 'circle', r: 2.4, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 2 }); }
      if (lv >= 10 && t === te + 8) { F.blast(c.x, c.y - 0.4 * kk, kk, 2); for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5, x = c.x + Math.cos(a) * 2.2 * kk, y = c.y + Math.sin(a) * 2.2 * kk * 0.45; F.pillar(x, y, kk, 1.2, 3 + i * 3); } c.hit({ shape: 'circle', r: 2.8, m: 1.0, lv: 'heavy', kind: 'cut', launch: 50 }); } },
    /* 月輪：聚火 → 一斬放出火月牙往前飛 */
    skill_getsurin(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 44; F.gather(c.x + c.f * 0.3 * kk, c.y, kk, 9, 0.9); }
      if (t === 12) { arc(c, { a0: -2.0, a1: 0.9, r: 1.8, sq: 0.8, rot: -0.3, dur: 5 }); shake(3); const f = c.f, mk = (dy, d0) => F.bolt(c, { x: c.x + f * 0.8 * kk, y: c.y, f, dist: 5, dy, dur: 22, sc: 1.2, d0, m: 1.4, lv: 'heavy', back: lv >= 5 && !dy, trail: lv >= 7, end: lv >= 10 ? (px, py) => { F.blast(px, py - 0.5 * kk, kk, 1.6); c.hit({ shape: 'circle', x: px, y: py, r: 1.6, m: 1.0, lv: 'heavy', kind: 'cut', launch: 40 }); } : null });
        mk(0, 0); if (lv >= 3) mk(1.3, 6); if (lv >= 7) c.later(4, () => { for (let i = 0; i < 4; i++) c.later(i * 20, () => c.hit({ shape: 'line', x: c.x + f * 0.8 * kk, y: c.y, len: 5, w: 0.6, m: 0.15, lv: 'light', kind: 'cut' })); }); } },
    /* 霸王斬：長蓄力 → 踏進劈地 → 火柱沖天 */
    skill_haousan(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 78 + (lv >= 7 ? 20 : 0); F.gather(c.x, c.y, kk, 30, 1.3); if (lv >= 3) c.inv(34); }
      if (t > 1 && t < 30 && t % 5 === 0) pts('ember', c.x, c.y - 0.1 * kk, kk, 3, { orb: 1.0, inward: 1, up: 1.8, life: 22, stag: 2 });
      if (t > 30 && t <= 40) { c.move(0.15, 0); c.ghost(14); }
      if (t === 40) arc(c, { a0: -2.2, a1: 0.95, r: 2.0, sq: 1, dur: 5 });
      if (t === 44) { const x = c.x + c.f * 1.1 * kk, y = c.y, f = c.f; F.pillar(x, y, kk, 1.6); F.blast(x, y - 0.3 * kk, kk, 1.3, 2); stop(8); shake(8); c.hit({ shape: 'circle', x, y, r: 1.3, m: 2.4, lv: 'heavy', kind: 'blunt', kb: 1.5 });
        if (lv >= 5) { F.field(x, y, kk, 120, 1.2, 10); for (let i = 1; i <= 4; i++) c.later(10 + i * 30, () => c.hit({ shape: 'circle', x, y, r: 1.2, m: 0.3, lv: 'light', kind: 'cut' })); }
        if (lv >= 7) { const nn = lv >= 10 ? 5 : 3; for (let i = 0; i < nn; i++) { const xx = x + f * (1.0 + i * 0.95) * kk; F.pillar(xx, y, kk, 0.9 + i * 0.12, 14 + i * 7); c.later(17 + i * 7, () => c.hit({ shape: 'circle', x: xx, y, r: 0.9, m: 0.5, lv: 'heavy', kind: 'cut', launch: 30 })); }
          if (lv >= 10) { const xx = x + f * (1.0 + nn * 0.95) * kk; F.blast(xx, y - 0.4 * kk, kk, 2.2, 14 + nn * 7 + 6); c.later(20 + nn * 7, () => { shake(9); c.hit({ shape: 'circle', x: xx, y, r: 1.9, m: 1.2, lv: 'heavy', kind: 'cut', launch: 60 }); }); } } } },
    /* 斬鐵：畫面一暗 → 一刀 → 斬線燒起來 */
    skill_zantetsu(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 52 + (lv >= 7 ? 16 : 0); if (G.VX && G.VX.dim) G.VX.dim(26, 0.35); F.gather(c.x, c.y, kk, 12, 0.8); }
      if (t === 14) c.ghost(10);
      if (t === 20) { const x = c.x + c.f * 1.1 * kk, y = c.y, f = c.f; arc(c, { a0: -2.3, a1: 1.0, r: 2.0, sq: 0.9, dur: 3 }); add(18, 'o', (ctx, u) => { const a = u < 8 ? 1 : 1 - (u - 8) / 10; ctx.strokeStyle = 'rgba(255,250,236,' + a + ')'; ctx.lineWidth = Math.max(1.2, kk * 0.03 * (1 - u / 18)); ctx.beginPath(); ctx.moveTo(x - f * 1.1 * kk, y - 1.5 * kk); ctx.lineTo(x + f * 0.9 * kk, y + 0.1 * kk); ctx.stroke(); });
        stop(10); shake(7); const hs = c.hit({ shape: 'sector', r: 2.0, arc: 2, m: 2.6, lv: 'heavy', kind: 'cut', ign: lv >= 3 ? 80 : 50 }); if (lv >= 5) for (const e of hs) if (e.boss && alive(e)) G.damageOni(e, 1.3 * c.mul, true, false, { ign: 80 });
        F.rise(x, y - 0.6 * kk, f, kk, 1.1, 6); F.swoosh(x, y - 0.7 * kk, f, kk, 1.1, 8, -0.5);
        if (lv >= 7) for (let j = 0; j < (lv >= 10 ? 2 : 1); j++) { F.blast(x, y - 0.5 * kk, kk, 1.4 + j * 0.5, 30 + j * 12); c.later(32 + j * 12, () => c.hit({ shape: 'circle', x, y, r: 1.5 + j * 0.5, m: 0.8, lv: 'heavy', kind: 'cut', launch: j ? 40 : 0 })); } } },
    /* 轉背截路：轉身 → 反斬 */
    special_backline(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) c.a.T = 44 + (lv >= 7 ? 10 : 0);
      if (t === 6) { H.face = -H.face; c.a.face0 = H.face; say('返', kk); pts('ember', c.x, c.y - 0.5 * kk, kk, 6, { sp: 2, up: 1, life: 22 }); }
      if (t === 14) { const f = c.f; arc(c, { a0: -2.4, a1: 1.1, r: 1.9, dur: 5 }); c.hit({ shape: 'sector', r: 2.0, arc: 2.4, m: 1.6, lv: 'heavy', kind: 'cut', stun: lv >= 5 ? 60 : 0 }); F.swoosh(c.x + f * 1.2 * kk, c.y - 0.6 * kk, f, kk, 1.2, 3); stop(5); shake(4); if (lv >= 3) G.BUFF.add('dr', 20, 120);
        if (lv >= 7) { for (let i = 0; i < 3; i++) F.swoosh(c.x + f * (1.6 + i * 0.8) * kk, c.y - 0.45 * kk, f, kk, 1.0 + i * 0.15, 8 + i * 4); c.later(12, () => c.hit({ shape: 'line', len: 3.6, w: 0.7, m: 0.6, lv: 'mid', kind: 'cut', kb: 1.5 })); }
        if (lv >= 10) { const x = c.x - f * 1.2 * kk; F.blast(x, c.y - 0.4 * kk, kk, 1.5, 14); F.pillar(x, c.y, kk, 1.1, 16); c.later(16, () => c.hit({ shape: 'circle', r: 1.9, m: 0.6, lv: 'heavy', kind: 'cut' })); } } },
    /* 蓄勢破守：蓄 → 重斬，被砍中的敵人防禦下降，身上持續冒火星 */
    special_break(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 52; F.gather(c.x, c.y, kk, 16, 1); }
      if (t !== 20) return; arc(c, { a0: -2.1, a1: 0.95, r: 2.0, sq: 1, rot: 0.15, dur: 5 }); stop(6); shake(5); const T2 = lv >= 5 ? 360 : 180, hs = c.hit({ shape: 'sector', r: 2.0, arc: 2.2, m: 1.8, def: lv >= 3 ? 30 : 20, lv: 'heavy', kind: 'cut' });
      for (const e of hs) { e.db = e.db || {}; e.db.defT = T2; F.blast(e.x, e.y - 0.5 * kk, kk, 0.9, 2); say('破守', kk);
        for (let i = 0; i * 30 < T2; i++) c.later(i * 30, () => { if (!alive(e) || !(e.db && e.db.defT > 0)) return; pts('ember', e.x, e.y - 0.6 * kk * (e.ratio || 1), kk, 3, { sp: 1, up: 1.2, life: 26, rx: 0.3 }); if (lv >= 7 && i % 2 === 0 && i < 10) G.damageOni(e, 0.15 * c.mul, false, false); });
        if (lv >= 10) { F.blast(e.x, e.y - 0.5 * kk, kk, 1.7, 14); F.pillar(e.x, e.y, kk, 1.2, 16); c.later(16, () => c.hit({ shape: 'circle', x: e.x, y: e.y, r: 1.6, m: 0.8, lv: 'heavy', kind: 'cut' })); } } },
    /* 拔刀貫線：刀尖在地上拉出一條火線 → 一秒後整條引爆 */
    special_drawline(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 4.5 : 3;
      if (t === 1) c.a.T = 44; if (t !== 10) return; arc(c, { a0: -0.5, a1: 0.4, r: 1.9, sq: 0.3, dur: 4 }); const x0 = c.x, y0 = c.y, f = c.f, n = Math.round(D / 0.75), times = lv >= 10 ? 3 : lv >= 5 ? 2 : 1, life = 60 + (times - 1) * 20;
      add(life + 10, 'g', (ctx, u) => { const g = ease(u / 14), a = Math.min(1, (life + 10 - u) / 10), fl = Math.floor(u / 3); ctx.save(); ctx.translate(0, y0); ctx.scale(1, 0.4); ctx.strokeStyle = 'rgba(255,150,60,' + 0.8 * a + ')'; ctx.lineWidth = Math.max(1.5, kk * 0.05); ctx.beginPath(); for (let i = 0; i <= 20; i++) { const q = i / 20 * g, xx = x0 + f * (0.5 + D * q) * kk, yy = Math.sin(i * 1.7 + fl) * kk * 0.05; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.strokeStyle = 'rgba(255,236,170,' + a + ')'; ctx.lineWidth = Math.max(0.8, kk * 0.018); ctx.stroke(); ctx.restore(); });
      for (let i = 0; i < n; i++) c.later(2 + i * 2, () => pts('ember', x0 + f * (0.6 + i * D / n) * kk, y0, kk, 2, { sp: 0.8, up: 1.2, life: 50, stag: 30 }));
      for (let j = 0; j < times; j++) c.later(60 + j * 20, () => { shake(6); for (let i = 0; i < n; i++) F.pillar(x0 + f * (0.6 + i * D / n) * kk, y0, kk, (0.8 + 0.3 * Math.random()) * (1 + j * 0.2), i * 2); c.hit({ shape: 'line', x: x0, y: y0, len: D + 0.4, w: 0.5 + j * 0.1, m: j === 2 ? 1.0 : 1.6, lv: 'heavy', kind: 'cut', launch: 30 });
        if (lv >= 7 && j === 0) { for (let i = 0; i < n; i += 2) F.field(x0 + f * (0.9 + i * D / n) * kk, y0, kk, 100, 0.9, 12); for (let q = 1; q <= 3; q++) c.later(12 + q * 28, () => c.hit({ shape: 'line', x: x0, y: y0, len: D + 0.4, w: 0.5, m: 0.2, lv: 'light', kind: 'cut' })); } }); },
    /* 長刃離陣：一斬 → 往後跳開 → 落地 */
    special_leave(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 1.4 : 1.0, m = c.a.mvx;
      if (t === 1) c.a.T = 46 + (lv >= 10 ? 12 : 0);
      if (t === 8) { arc(c, { a0: -2.3, a1: 1.1, r: 1.9, sq: 0.7, rot: -0.3, dur: 5 }); c.hit({ shape: 'sector', r: 2.0, arc: 2.2, m: 1.4, lv: 'mid', kind: 'cut' }); F.swoosh(c.x + c.f * 1.1 * kk, c.y - 0.6 * kk, c.f, kk, 1, 2); shake(3); m.px = c.x + c.f * 0.9 * kk; m.py = c.y;
        if (lv >= 7) { F.blast(m.px, m.py - 0.4 * kk, kk, 1.4, 26); F.pillar(m.px, m.py, kk, 1.1, 28); c.later(28, () => c.hit({ shape: 'circle', x: m.px, y: m.py, r: 1.5, m: 0.8, lv: 'heavy', kind: 'cut' })); } }
      if (t > 8 && t <= 22) { c.move(-D * 1.6 / 14, 0); H.hop = Math.sin((t - 8) / 14 * Math.PI) * 0.45 * kk; if (t % 3 === 0) pts('ember', c.x + c.f * 0.6 * kk, c.y - 0.4 * kk, kk, 2, { sp: 0.6, up: 0.8, life: 18, stag: 1 }); }
      if (t === 23) { H.hop = 0; if (lv >= 5) { sp('b_ezo', 'fx_heat_embers', c.x, c.y + 0.12 * kk, kk * 3.8, { by: 'w', anc: 'b', tpf: 5 }); pts('ember', c.x, c.y - 0.1 * kk, kk, 12, { sp: 4, up: 0.5, life: 30 }); shake(5); c.hit({ shape: 'circle', r: 1.8, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 1.2 }); } }
      if (lv >= 10 && t === 34) { arc(c, { a0: -1.8, a1: 0.9, r: 1.8, sq: 0.7, dur: 4 }); F.bolt(c, { x: c.x + c.f * 0.8 * kk, y: c.y, f: c.f, dist: 4.5, dur: 20, sc: 1.2, m: 1.0, lv: 'heavy' }); } } };
  /* =====================================================================
   * 薙刀（風／葉）
   * ===================================================================== */
  const reflect = (c, kk) => { const B = G.BOSS; if (!B || !B.proj) return; for (const p of B.proj) { if (p.dead || p.mine) continue; const dx = (p.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * kk && Math.abs(p.y - H.y) < 0.6 * kk) { p.dead = 1; const src = p.e; pts('leaf', p.x, H.y - 0.5 * kk, kk, 6, { sp: 2.4, life: 24 }); if (alive(src)) c.shoot('arrow', { m: 1.5, home: src, turn: 0.3, spd: 0.6, lv: 'heavy' }); c.a.mvx.hit = 1; } } };
  const NAG = {
    /* 嵐：原地連續旋轉掃擊，葉片繞身；可以邊轉邊走 */
    skill_arashi(c, t) { const lv = LV(c), kk = K(H.y), dur = lv >= 3 ? 180 : 120;
      if (t === 1) { c.a.T = dur + 12; N.gather(H.x, H.y, kk, 8, 1); pts('leaf', 0, 0, kk, 26, { follow: 1, fy: -0.4 * kk, orb: 1.7, up: 0.3, life: dur, stag: dur * 0.8, spin: 1.5, ry: 0.4 }); }
      if (t > dur) return;
      if (t % 12 === 6) { arc(c, { x: H.x, y: H.y, a0: Math.PI, a1: -Math.PI * 1.03, r: 2.05, sq: 0.36, dur: 9, follow: 1, cy: 0.35 + 0.3 * ((t / 12) % 2) }); c.hit({ shape: 'circle', x: H.x, y: H.y, r: 2.1, m: 0.45, lv: 'light', kind: 'cut' }); }
      if (t % 30 === 10) N.ribbons(H.x, H.y - 0.6 * kk, Math.random() < 0.5 ? 1 : -1, kk, 1.2, 0, rnd(-0.3, 0.3));
      if (lv >= 7 && t % 6 === 0) for (const e of foes(H.x, H.y, 3.4 * kk)) drag(e, H.x, H.y, 0.035);
      if (lv >= 5 && t === dur) { const big = lv >= 10, x = H.x + c.f * 0.6 * kk, y = H.y, L = big ? 150 : 120, sc = big ? 1.5 : 1; N.tornado(x, y, kk, L, sc); for (let i = 1; i * 20 < L; i++) c.later(i * 20, () => { c.hit({ shape: 'circle', x, y, r: 1.3 * sc, m: 0.3, lv: 'light', kind: 'cut' }); for (const e of foes(x, y, 2.6 * sc * kk)) drag(e, x, y, 0.12); });
        if (big) c.later(L, () => { shake(7); pts('leaf', x, y - 0.6 * kk, kk, 30, { sp: 6, up: 1, life: 40 }); N.ribbons(x, y - 0.6 * kk, 1, kk, 2.2); c.hit({ shape: 'circle', x, y, r: 2.6, m: 1.2, lv: 'heavy', kind: 'cut', kb: 3, launch: 40 }); }); } },
    /* 千鳥：聚風 → 疾風突進穿過敵人 */
    skill_chidori(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx, n = lv >= 10 ? 3 : lv >= 3 ? 2 : 1, per = 26;
      if (t === 1) { c.a.T = 16 + n * per + 10; N.gather(c.x, c.y, kk, 10, 0.9); m.path = []; }
      for (let i = 0; i < n; i++) { const t0 = 12 + i * per; if (t === t0) { if (i) { H.face = -H.face; c.a.face0 = H.face; } m.sk = []; m.x0 = c.x; const f = c.f; for (let j = 0; j < 3; j++) N.gust(c, { x: c.x + f * j * 0.5 * kk, y: c.y, f, dist: 3.5, dur: 9, d0: j * 2, sc: 1 + j * 0.15, z: 0.3 + j * 0.25 }); }
        if (t > t0 && t <= t0 + 8) { c.move(3.5 / 8, 0); c.inv(6); if (t % 2) c.ghost(8); c.hit({ shape: 'circle', r: 1.0, m: 1.6, lv: 'mid', kind: 'cut', skip: m.sk }).forEach(e => m.sk.push(e)); if (t % 2 === 0) pts('leaf', c.x, c.y - 0.5 * kk, kk, 3, { dir: c.f > 0 ? Math.PI : 0, spread: 0.8, sp: 1.6, life: 26, stag: 1 }); }
        if (t === t0 + 9) { arc(c, { a0: -2.4, a1: 0.8, r: 2.0, sq: 0.45, dur: 5 }); const xa = m.x0, xb = c.x, y = c.y, f = c.f;
          if (lv >= 5) for (let q = 0; q < 4; q++) c.later(10 + q * 30, () => { N.gust(c, { x: xa, y, f, dist: Math.abs(xb - xa) / kk, dur: 12, sc: 1.1 }); c.hit({ shape: 'line', x: xa, y, len: Math.abs(xb - xa) / kk, w: 0.6, m: 0.3, lv: 'light', kind: 'cut', face: f }); });
          if (lv >= 7 && i === n - 1) { const big = lv >= 10, L = big ? 110 : 70, sc = big ? 1.5 : 1; N.tornado(xb + f * 0.8 * kk, y, kk, L, sc, 4); for (let q = 1; q * 20 < L; q++) c.later(4 + q * 20, () => { c.hit({ shape: 'circle', x: xb + f * 0.8 * kk, y, r: 1.3 * sc, m: 0.35, lv: 'mid', kind: 'cut', launch: 20 }); for (const e of foes(xb + f * 0.8 * kk, y, 2.6 * sc * kk)) drag(e, xb + f * 0.8 * kk, y, 0.12); }); } } } },
    /* 燕舞：一段一段的舞斬，邊斬邊往前 */
    skill_enbu(c, t) { const lv = LV(c), kk = K(c.y), n = 5 + (lv >= 3 ? 2 : 0), gap = 8, te = 6 + n * gap + 6;
      if (t === 1) { c.a.T = te + (lv >= 10 ? 30 : 8); N.gather(c.x, c.y, kk, 5, 0.7); }
      for (let i = 0; i < n; i++) if (t === 6 + i * gap) { arc(c, { a0: i % 2 ? 1.1 : -2.4, a1: i % 2 ? -2.4 : 1.1, sq: 0.5 + (i % 3) * 0.15, rot: i % 2 ? 0.2 : -0.2, r: 1.95, dur: 5 }); c.move(0.06, 0); const hs = c.hit({ shape: 'sector', r: 2.05, arc: 2.4, m: 0.6, lv: 'mid', kind: 'cut' }); if (lv >= 5 && hs.length) { const d = G.RPG.d(); d.qi = Math.min(100, (d.qi || 0) + 1); }
          if (i % 2 === 0) N.ribbons(c.x + c.f * 1.0 * kk, c.y - 0.6 * kk, c.f, kk, 0.9, 1, rnd(-0.3, 0.3)); if (lv >= 7) N.gust(c, { x: c.x + c.f * 1.2 * kk, y: c.y, f: c.f, dist: 2.5, dy: (i % 3 - 1) * 0.7, dur: 12, d0: 3, sc: 0.85, m: 0.25, lv: 'light' }); }
      if (lv >= 10 && t === te) { arc(c, { a0: -2.9, a1: 1.5, r: 2.3, sq: 0.36, dur: 7 }); shake(5); const x = c.x + c.f * 1.5 * kk, y = c.y; c.hit({ shape: 'sector', r: 2.4, arc: 3.0, m: 1.0, lv: 'heavy', kind: 'cut', launch: 50 }); N.tornado(x, y, kk, 60, 1.2, 2); for (let q = 1; q <= 2; q++) c.later(q * 20, () => c.hit({ shape: 'circle', x, y, r: 1.4, m: 0.3, lv: 'mid', kind: 'cut', launch: 20 })); } },
    /* 旋風薙：聚風 → 一記大橫掃把敵人吹開 */
    skill_senpu(c, t) { const lv = LV(c), kk = K(c.y), r = lv >= 3 ? 2.6 : 2.05;
      if (t === 1) { c.a.T = 50 + (lv >= 7 ? 20 : 0) + (lv >= 10 ? 10 : 0); N.gather(c.x, c.y, kk, 12, 1.1); }
      if (t === 14) { arc(c, { a0: -2.9, a1: 1.5, r, sq: 0.4, dur: 7 }); for (let i = 0; i < 3; i++) N.ribbons(c.x + c.f * (0.6 + i * 0.6) * kk, c.y - (0.3 + i * 0.3) * kk, c.f, kk, 1.1 + i * 0.2, i * 2, rnd(-0.3, 0.3)); pts('leaf', c.x + c.f * kk, c.y - 0.5 * kk, kk, 18, { dir: c.f > 0 ? 0 : Math.PI, spread: 1.1, sp: 4, life: 36 }); stop(5); shake(5); c.hit({ shape: 'sector', r: r + 0.15, arc: 3.1, m: 1.4, lv: 'heavy', kind: 'cut', kb: 1.6 }); }
      if (lv >= 5 && t === 30) { for (const e of foes(c.x, c.y, 3.4 * kk)) drag(e, c.x + c.f * 1.2 * kk, c.y, 0.6); N.gather(c.x + c.f * 1.2 * kk, c.y, kk, 8, 1.3); }
      if (lv >= 7 && t === 36) { N.tornado(0, 0, kk, 80, 1.0, 0, { follow: 1 }); for (let q = 1; q <= 3; q++) c.later(q * 22, () => c.hit({ shape: 'circle', x: H.x, y: H.y, r: 1.8, m: 0.3, lv: 'mid', kind: 'cut' })); }
      if (lv >= 10 && t === 60) { arc(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 2.2, sq: 0.38, dur: 7 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; N.gust(c, { x: c.x, y: c.y, f: Math.cos(a) > 0 ? 1 : -1, dist: Math.abs(Math.cos(a)) * 3.4 + 0.4, dy: Math.sin(a) * 1.6, dur: 14, d0: i, sc: 1, m: 0.4, lv: 'mid', kb: 1.5 }); } } },
    /* 環流回刃：往旁邊滑開 → 迴旋一斬 */
    special_current(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 1.5 : 1, m = c.a.mvx;
      if (t === 1) { c.a.T = 42 + (lv >= 10 ? 14 : 0); m.dir = (G.IN.my || 0.6); m.px = c.x; m.py = c.y; pts('leaf', c.x, c.y - 0.4 * kk, kk, 6, { sp: 2, life: 24 }); }
      if (t <= 10) { c.move(0, m.dir * 0.1 * D); if (lv >= 5) c.inv(4); if (t % 3 === 0) c.ghost(10); }
      if (t === 3 && lv >= 7) { N.tornado(m.px, m.py, kk, 64, 0.8); for (let q = 1; q <= 3; q++) c.later(q * 18, () => c.hit({ shape: 'circle', x: m.px, y: m.py, r: 1.1, m: 0.3, lv: 'light', kind: 'cut' })); }
      if (t === 14) { arc(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 2.05, sq: 0.38, dur: 8 }); N.ribbons(c.x, c.y - 0.5 * kk, c.f, kk, 1.4); c.hit({ shape: 'circle', r: 2.1, m: 1.2, lv: 'mid', kind: 'cut' }); shake(3); }
      if (lv >= 10 && t === 28) { arc(c, { a0: -Math.PI, a1: Math.PI * 1.03, r: 2.3, sq: 0.38, dur: 8, cy: 0.3 }); pts('leaf', c.x, c.y - 0.4 * kk, kk, 16, { sp: 4.5, up: 1.2, life: 34 }); c.hit({ shape: 'circle', r: 2.4, m: 0.8, lv: 'heavy', kind: 'cut', launch: 50 }); shake(5); } },
    /* 雙向斷陣：前後同時各一斬 */
    special_double(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 40 + (lv >= 3 ? 10 : 0) + (lv >= 5 ? 10 : 0); N.gather(c.x, c.y, kk, 7, 0.8); }
      if (t === 10) { for (const f of [c.f, -c.f]) { arc(c, { f, a0: -2.0, a1: 0.9, sq: 0.8, rot: -0.4, r: 1.95, dur: 5 }); c.hit({ shape: 'sector', face: f, r: 2.05, arc: 2.2, m: 1.0, lv: 'mid', kind: 'cut' }); N.ribbons(c.x + f * 1.1 * kk, c.y - 0.6 * kk, f, kk, 1, 2); if (lv >= 7) N.gust(c, { x: c.x + f * 1.0 * kk, y: c.y, f, dist: 3, dur: 14, d0: 4, m: 0.5, lv: 'mid', kb: 1.2 }); } shake(3); }
      if (lv >= 3 && t === 22) { for (const f of [c.f, -c.f]) arc(c, { f, a0: 2.0, a1: -0.9, sq: 0.8, rot: 0.4, r: 1.95, dur: 5 }); c.hit({ shape: 'circle', r: 2.05, m: 1.0, lv: 'mid', kind: 'cut' }); }
      if (lv >= 5 && t === 34) { const x = c.x, y = c.y; pts('leaf', x, y - 0.5 * kk, kk, 20, { sp: 4.5, up: 0.8, life: 34 }); N.ribbons(x, y - 0.6 * kk, c.f, kk, 1.8); shake(5); c.hit({ shape: 'circle', r: 1.8, m: 1.0, lv: 'heavy', kind: 'cut', launch: lv >= 10 ? 50 : 0 });
        if (lv >= 10) { N.tornado(0, 0, kk, 64, 1.2, 0, { follow: 1 }); for (let q = 1; q <= 3; q++) c.later(q * 18, () => c.hit({ shape: 'circle', x: H.x, y: H.y, r: 1.6, m: 0.3, lv: 'mid', kind: 'cut', launch: 20 })); } } },
    /* 引群開路：一掃把前方敵人吹開，清出一條路 */
    special_openpath(c, t) { const lv = LV(c), kk = K(c.y), kb = lv >= 3 ? 4 : 2.7;
      if (t === 1) { c.a.T = 44; N.gather(c.x, c.y, kk, 10, 1); }
      if (t !== 12) return; const f = c.f, x0 = c.x, y0 = c.y; arc(c, { a0: -2.6, a1: 1.3, r: 2.05, sq: 0.45, dur: 6 }); c.hit({ shape: 'sector', r: 2.15, arc: 2.6, m: 1.1, kb, lv: 'mid', kind: 'cut' }); shake(4);
      for (let i = 0; i < 3; i++) N.gust(c, { x: x0 + f * 0.4 * kk, y: y0, f, dist: 4.5, dy: (i - 1) * 0.5, dur: 14, d0: i * 3, sc: 1.1 + 0.2 * (i === 1), z: 0.3 + i * 0.2 }); pts('leaf', x0 + f * kk, y0 - 0.5 * kk, kk, 14, { dir: f > 0 ? 0 : Math.PI, spread: 0.5, sp: 6, life: 34 }); if (lv >= 5) G.BUFF.add('spd', 30, 180);
      if (lv >= 7) for (let q = 1; q <= 3; q++) c.later(q * 18, () => { N.gust(c, { x: x0 + f * 0.4 * kk, y: y0, f, dist: 4.5, dur: 14, sc: 1.2 }); c.hit({ shape: 'line', x: x0, y: y0, len: 4.6, w: 0.9, m: 0.2, lv: 'light', kind: 'cut', kb: 1.5, face: f }); });
      if (lv >= 10) { const x = x0 + f * 4.6 * kk; N.tornado(x, y0, kk, 80, 1.4, 20); for (let q = 1; q <= 3; q++) c.later(20 + q * 20, () => { c.hit({ shape: 'circle', x, y: y0, r: 1.6, m: q === 3 ? 0.8 : 0.3, lv: q === 3 ? 'heavy' : 'mid', kind: 'cut', launch: 30 }); for (const e of foes(x, y0, 3 * kk)) drag(e, x, y0, 0.15); }); } },
    /* 立架截飛：立起薙刀，身前一道風牆；擋下遠程，被近身打到會反擊 */
    special_upright(c, t) { const lv = LV(c), kk = K(c.y), T = lv >= 3 ? 184 : 124;
      if (t === 1) { c.a.T = T; const a0 = c.a, f = c.f; add(T, 'o', (ctx, u) => { if (H.act !== a0) return; const x = H.x + f * 0.75 * kk, a = Math.min(1, u / 8) * 0.85; ctx.save(); ctx.translate(x, H.y + 0.75 * kk); ctx.scale(0.55, 1); AF().fr('b_susanoo', 'fx_tornado_loop', Math.floor(u / 4) % 4, 0, 0, { size: kk * 2.4, by: 'h', anc: 'b', a, flip: f < 0 }); ctx.restore(); }); }
      if (t % 10 === 3 && t < T - 10) pts('leaf', H.x + c.f * 0.75 * kk, H.y - 0.2 * kk, kk, 3, { orb: 0.35, up: 2.4, life: 34, stag: 3, spin: 2 });
      if (t === 30) { c.a.mvx.hit = 1; if (G.MV2 && G.MV2.onHit) G.MV2.onHit(c.a); }
      if (lv >= 7 && t % 6 === 0) for (const e of foes(H.x + c.f * 1.0 * kk, H.y, 1.5 * kk)) if (!e.boss && !e.bb && (e.x - H.x) * c.f > 0) { const nx = e.x + c.f * 0.12 * kk; if (G.SC.walkable(nx, e.y)) e.x = nx; }
      if (lv >= 5) reflect(c, kk); } };
  const NAG_CT = { special_upright(c, e) { const lv = LV(c), kk = K(c.y); c.a.mvx.hit = 1; if (G.MV2 && G.MV2.onHit) G.MV2.onHit(c.a); arc(c, { a0: -2.6, a1: 1.3, r: 2.05, sq: 0.45, dur: 5 }); c.hit({ shape: 'sector', r: 2.15, arc: 2.6, m: 1.3, lv: 'heavy', kind: 'cut', kb: 1.4 }); N.gust(c, { x: c.x + c.f * 0.4 * kk, y: c.y, f: c.f, dist: 3, dur: 12, sc: 1.2 }); shake(4);
      if (lv >= 10 && alive(e)) { const x = e.x, y = e.y; N.tornado(x, y, kk, 70, 1.2, 4); for (let q = 1; q <= 3; q++) c.later(4 + q * 18, () => c.hit({ shape: 'circle', x, y, r: 1.4, m: 0.4, lv: 'mid', kind: 'cut', launch: 30 })); } } };
  /* ---------- 說明文字與冷卻：[說明, Lv3, Lv5, Lv7, Lv10] ---------- */
  const TXT = { katana: {
      iai: ['收刀聚水後瞬斬穿過敵人，斬過的路上推出一道浪', '距離 +50%', '一秒後路上再噴起水柱（二段）', '路上留下水痕，敵人變慢', '終點再升起三道水柱'],
      issen: ['蓄力後瞬移穿過敵人，收刀一拍後水花同時爆開', '命中後重置招式冷卻', '必定暴擊', '爆開時追加一道橫浪把敵人推開', '水花爆開兩次，把敵人沖上半空'],
      tsubame: ['上挑帶起水弧把敵人挑起，再返刀下斬', '追加第三段橫斬', '第四段放出水刃飛行 6H', '每一段傷害提高', '水刃變成三道'],
      special_breath: ['一記快斬並回 15 氣力；打在敵人出手瞬間則必暴擊、回 30', '回氣 +50%', '之後 5 秒攻速 +15%', '截隙成功時水柱波及周圍', '截隙成功時敵人暈得更久，多回 10 氣力'],
      special_home: ['收刀架勢，腳下一圈水環；被打中自動迴旋反擊', '架勢時間 +0.5 秒', '反擊必暴擊', '反擊的浪把四周敵人推開', '反擊後身邊再升起一圈水柱'],
      special_return: ['一斬後往後撤，再放出水月牙飛行 4H', '後撤距離 +40%', '水月牙飛 6H', '水月牙在終點炸開', '原地留下水痕，一秒後噴起水柱'],
      special_tide: ['三連進斬，每一斬推出一道潮', '擊退距離 +50%', '第三斬把敵人拉回身前', '第三斬追加一道大浪', '追加第四斬：巨浪推出 4.5H'] },
    nodachi: {
      skill_daisharin: ['聚火後連續四圈旋轉斬', '多轉兩圈', '結束時放出環形熱浪擊退', '每一圈在四周竄起小火柱', '收尾腳下爆炎，四方火柱'],
      skill_getsurin: ['一斬放出火月牙往前飛 5H', '火月牙變兩道', '火月牙飛到底會折返', '飛過的路上留下火', '火月牙在終點爆炸'],
      skill_haousan: ['長蓄力後踏進劈地，火柱沖天', '蓄力時霸體', '地面留下火場 2 秒', '前方再竄起三道火柱', '火柱變五道，最後一記大爆炎'],
      skill_zantetsu: ['無視 50% 防禦的一刀，斬線燒起來', '無視防禦 80%', '對頭目傷害 +50%', '斬線半秒後爆燃', '爆燃兩次，把敵人炸飛'],
      special_backline: ['轉身反斬', '之後 2 秒受傷 −20%', '反斬命中暈眩 1 秒', '反斬帶出一道火浪往前推', '身後同時爆起火柱'],
      special_break: ['蓄力重斬，降低敵人防禦 20%', '降防 30%', '持續時間加倍', '被破守的敵人持續燃燒', '破守時引爆，波及周圍'],
      special_drawline: ['在地上拉出一條火線，一秒後整條引爆', '火線長度 +50%', '引爆兩次', '引爆後留下火場', '引爆三次'],
      special_leave: ['一斬後往後跳開', '後跳距離 +40%', '落地時熱浪擊退', '原本站的位置延遲爆炎', '落地後再丟出一道火月牙'] },
    naginata: {
      skill_arashi: ['原地連續旋轉掃擊，葉片繞身（可以邊轉邊走）', '持續 +1 秒', '結束時捲起一道龍捲 2 秒', '旋轉時把周圍敵人往內吸', '龍捲變大，消散時炸開'],
      skill_chidori: ['聚風後疾風突進，穿過敵人', '折返再突進一次', '路上留下風道持續傷害', '終點捲起龍捲', '突進三次，終點的龍捲變大'],
      skill_enbu: ['五段舞斬，邊斬邊往前', '段數 +2', '每段命中回 1 氣力', '每段放出一道風刃', '收尾大橫掃，捲起龍捲'],
      skill_senpu: ['聚風後一記大橫掃把敵人吹開', '範圍 +30%', '吹開後再吸回身前', '之後身邊旋風持續 1.5 秒', '最後往六個方向放出風刃'],
      special_current: ['往旁邊滑開，再迴旋一斬', '移動距離 +50%', '滑開時無敵', '起點留下一道小龍捲', '再迴旋一圈把敵人捲上半空'],
      special_double: ['前後同時各一斬', '追加交叉的第二段', '交叉點爆發', '前後各飛出一道風刃', '爆發後身邊捲起龍捲'],
      special_openpath: ['一掃把前方敵人吹開', '吹開距離 +50%', '之後 3 秒移速 +30%', '風路持續一秒，繼續把敵人往外推', '風路盡頭捲起龍捲'],
      special_upright: ['立起薙刀，身前一道風牆；被近身打到會反擊', '持續 +1 秒', '擋下並反射遠程攻擊', '風牆把靠近的敵人往外推', '反擊時在敵人身上捲起龍捲'] } };
  const RUNS = { katana: KAT, nodachi: NOD, naginata: NAG }, CTS = { katana: KAT_CT, nodachi: {}, naginata: NAG_CT };
  const ART = { katana: ['p_shion_fx', 'b_kappa'], nodachi: ['b_ezo', 'p_ibaraki_fx', 'b_osakabe'], naginata: ['b_susanoo'] }; let loading = 0;
  function texts(w) { const L = G.WPN.LIST && G.WPN.LIST.find(x => x.id === w), T = TXT[w]; if (!L || !T) return; for (const s of L.sk) { const v = T[s.id]; if (!v) continue; if (s.d !== v[0] || s.d7 !== v[3]) { s.d = v[0]; s.d3 = v[1]; s.d5 = v[2]; s.d7 = v[3]; s.d10 = v[4]; } const cd = s.t === '特技' ? 9 : 5; if (s.cd !== cd) s.cd = cd; } }
  function patch() { const M = G.MV2; if (!M || !M.U) return; for (const w in RUNS) { const U = M.U[w]; if (!U) continue; for (const k in RUNS[w]) { const d = U[k]; if (!d) continue; if (d.run !== RUNS[w][k]) d.run = RUNS[w][k]; const ct = CTS[w][k]; if (ct && d.counter !== ct) d.counter = ct; } } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); try { patch(); } catch (x) { console.warn('wskill', x); } };
  setInterval(() => { try { if (G.mode !== 'play' || !G.WPN || !G.WPN.curId || !G.ANIM) return; const w = G.WPN.curId(), L = ART[w]; for (const q in TXT) texts(q); if (!L) return; for (const k of L) { const u = G.ANIM.get(k); if (u) u.lu = performance.now(); }
      if (loading || L.every(k => G.ANIM.get(k))) return; loading = 1; (async () => { for (const k of L) if (!G.ANIM.get(k)) { try { await G.ANIM.load(k); } catch (e) { } } loading = 0; })(); } catch (e) { } }, 2000);
  return { RUNS, W, F, N, pts, ready: w => (ART[w] || []).every(k => G.ANIM && G.ANIM.get(k)) };
})();
