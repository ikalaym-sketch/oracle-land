/* ==========================================================================
 * 神諭之地 重製版 — 170_wskill.js
 * Version : r3.230.0  (2026-11-28)　r3.230.0：新增。打刀（水）、野太刀（火）、薙刀（風／葉）的技與特技重新設計
 * 內容    : 三把武器共 23 招（千本櫻、櫻花亂舞與各奧義不動）：
 *           ・每招分「起手 → 主攻 → 停頓 → 收招」，時間單位 1/60 秒；Lv1／3／5／7／10 各有畫面看得到的加強。
 *           ・揮砍的弧線沿用普攻定案的畫法（168_wfx 的 arc，o.free）。
 *           ・主體是武器的斬擊（大刀光、多段數、照武器的距離打）；素材只當點綴，每招最多一種。
 *           ・現成素材：水＝p_shion_fx（water_wave、glide_water）；
 *             地面＝x2_core（fx_crack_s／m／l＋glow 地裂、fx_blast 地面爆炸、fx_dust 塵圈）、b_ezo（fx_slam_dust 揚塵）、
 *             b_osakabe（osakabe_fire_field 地面火帶）＋b_oni（oniking_fire 火堆）＝燃燒帶；
 *             風＝b_susanoo（fx_tornado_birth／loop／end 龍捲、fx_wind_gather、fx_wind_path、fx_wind_ribbons）。
 *             再加程式畫的葉片、水珠、火星（大小、速度、壽命各不同）。
 *           ・立架截飛改成放龍捲（不再是架勢，沒有擋遠程與反擊）。
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
    tornado(x, y, k, life, sc, d0, o) { sc = sc || 1; d0 = d0 || 0; o = o || {}; const hgt = k * 4.2 * sc, dy = 0.06 * k, pos = () => o.follow ? [H.x, H.y + dy] : o.p ? [o.p[0], o.p[1] + dy] : [x, y + dy], base = { by: 'h', at: pos }, AB = [0.5, 0.9], AL = [0.5, 0.79], AE = [0.5, 0.89];   /* 圖的底部有留白：三段各自對齊實際的底 */
      AF().play('b_susanoo', 'fx_tornado_birth', Object.assign({ size: hgt * 0.76, tpf: 4, delay: d0, fade: 0, anc: AB }, base)); AF().play('b_susanoo', 'fx_tornado_loop', Object.assign({ size: hgt, anc: AL, tpf: 4, loop: Math.max(1, Math.round((life - 16) / 16)), delay: d0 + 16, fade: 0 }, base)); AF().play('b_susanoo', 'fx_tornado_end', Object.assign({ size: hgt * 0.79, anc: AE, tpf: 4, delay: d0 + 16 + Math.max(1, Math.round((life - 16) / 16)) * 16 }, base));
      for (let i = 0; i * 22 < life; i++) G.STORY.later(d0 + i * 22, () => { const p = pos(); pts('leaf', p[0], p[1] - 0.2 * k, k, Math.round(5 * sc + 2), { orb: 0.75 * sc, up: 2.6, life: 44, spin: 1.8, ry: 0.1 }); }); } };
  /* ---------- 共用：斬擊＝弧線＋判定；找最近的敵人；瞬移到敵人另一側；敵人身上的斬痕 ---------- */
  const cut = (c, a, h) => { arc(c, a); return h ? c.hit(Object.assign({ shape: 'sector', kind: 'cut', lv: 'mid', arc: 2.3 }, h)) : []; };
  const near = (c, R, any) => { const k = K(H.y); let b = null, bd = 1e9; for (const e of G.E) { if (!alive(e)) continue; const d = Math.hypot(e.x - H.x, (e.y - H.y) * 2); if (d > R * k || (!any && (e.x - H.x) * c.f < -0.3 * k)) continue; if (d < bd) { bd = d; b = e; } } return b; };
  const blink = (c, e, kk) => { const dir = Math.sign(e.x - H.x) || c.f, nx = e.x + dir * 0.95 * kk; c.ghost(12); if (G.SC.walkable(nx, e.y)) { H.x = nx; H.y = e.y; } H.face = -dir; c.a.face0 = H.face; c.inv(10); };
  const marks = (e, kk, n, col) => { const L = []; for (let i = 0; i < n; i++) L.push({ a: rnd(-1.2, 1.2), l: rnd(0.5, 0.9), oy: rnd(-0.25, 0.25), d: i * 2 }); add(n * 2 + 14, 'o', (ctx, u) => { if (!alive(e)) return; const x = e.x, y = e.y - 0.55 * kk * (e.ratio || 1); for (const m of L) { const v = u - m.d; if (v < 0 || v > 12) continue; const g = Math.min(1, v / 2), a = v < 5 ? 1 : 1 - (v - 5) / 7, dx = Math.cos(m.a) * m.l * kk * g, dy = Math.sin(m.a) * m.l * kk * g; ctx.strokeStyle = 'rgba(' + (col || '236,248,255') + ',' + a + ')'; ctx.lineWidth = Math.max(1, kk * 0.035 * (1 - v / 14)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - dx, y + m.oy * kk - dy); ctx.lineTo(x + dx, y + m.oy * kk + dy); ctx.stroke(); } }); };
  /* ---------- 地面：地裂、地面爆炸、揚塵、燃燒帶（都是現成素材） ---------- */
  const GR = {
    crack(x, y, k, sc, life) { sc = sc || 1; const cl = sc >= 1.4 ? 'l' : sc >= 0.9 ? 'm' : 's', fl = Math.random() < 0.5, o = { by: 'w', layer: 'g', flip: fl }; sp('x2_core', 'fx_crack_' + cl, x, y, k * 2.6 * sc, Object.assign({ tpf: life || 100, fade: 26 }, o)); sp('x2_core', 'fx_crack_glow_' + cl, x, y, k * 2.6 * sc, Object.assign({ tpf: 30, fade: 22, add: 1 }, o)); },
    boom(x, y, k, sc, d0) { sc = sc || 1; d0 = d0 || 0; sp('x2_core', 'fx_blast', x, y + 0.08 * k, k * 2.4 * sc * rnd(0.9, 1.15), { by: 'h', anc: 'b', tpf: 3, delay: d0, flip: Math.random() < 0.5 }); sp('x2_core', 'fx_dust', x, y, k * 2.8 * sc, { by: 'w', tpf: 4, delay: d0, layer: 'g' }); G.STORY.later(d0, () => { pts('ember', x, y - 0.3 * k, k, Math.round(6 * sc + 3), { sp: 4 * sc, up: 1.2, life: 32 }); shake(4 * sc); }); },
    dust(x, y, k, sc, d0) { sc = sc || 1; sp('b_ezo', 'fx_slam_dust', x, y + 0.05 * k, k * 3.0 * sc, { by: 'w', anc: [0.5, 0.72], tpf: 5, delay: d0 || 0 }); sp('x2_core', 'fx_dust', x, y, k * 2.6 * sc, { by: 'w', tpf: 4, delay: d0 || 0, layer: 'g' }); },
    /* 燃燒帶：地面火帶＋幾堆大小不一的火；每半秒判定一次 */
    burn(c, x, y, k, R, life, m, d0) { d0 = d0 || 0; sp('b_osakabe', 'osakabe_fire_field', x, y + 0.05 * k, k * R * 2.3, { by: 'w', anc: [0.5, 0.66], a: 0.8, tpf: 5, loop: Math.max(1, Math.round(life / 20)), fin: 8, fade: 14, delay: d0 });
      for (let i = 0, n = Math.round(R * 2.2) + 1; i < n; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R * 0.8 * k, dl = d0 + Math.floor(rnd(0, 10)); sp('b_oni', 'oniking_fire', x + Math.cos(a) * r, y + Math.sin(a) * r * 0.4 + 0.1 * k, k * (Math.random() < 0.3 ? rnd(0.95, 1.3) : rnd(0.5, 0.85)), { by: 'h', anc: 'b', tpf: 4, loop: Math.max(1, Math.round((life - 10) / 24)), fin: 6, fade: 12, delay: dl, flip: Math.random() < 0.5 }); }
      for (let q = 1; q * 30 <= life; q++) c.later(d0 + q * 30, () => { if (m) c.hit({ shape: 'circle', x, y, r: R, m, lv: 'light', kind: 'cut' }); pts('ember', x, y - 0.1 * k, k, 3, { sp: 0.8, up: 1.6, life: 30, rx: R * 0.6 }); }); } };
  /* =====================================================================
   * 打刀（水）：主體是斬擊；水只留在刀光本身，手繪的浪每招最多一道
   * ===================================================================== */
  const KAT = {
    /* 居合斬：收刀 → 拔斬，由左往右一記大橫劈。升級：先打普攻連段 → 後跳 → 往前衝出大橫劈 */
    iai(c, t) { const lv = LV(c), kk = K(c.y), n = lv >= 10 ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 0, t0 = n ? 6 + n * 8 + 22 : 14, R = lv >= 7 ? 3.2 : 2.6;
      if (t === 1) { c.a.T = t0 + 26 + (lv >= 10 ? 16 : 0); pts('drop', c.x, c.y - 0.5 * kk, kk, 5, { orb: 0.7, inward: 1, up: 0.4, life: 14, stag: 6 }); }
      for (let i = 0; i < n; i++) if (t === 6 + i * 8) { c.move(0.12, 0); cut(c, { a0: i % 2 ? 0.95 : -1.9, a1: i % 2 ? -1.55 : 0.75, r: 1.5, sq: 0.8, rot: i % 2 ? 0.1 : -0.15, dur: 4 }, { r: 1.6, m: 0.5 }); }
      if (n && t > 6 + n * 8 && t <= 6 + n * 8 + 8) { c.move(-1.3 / 8, 0); H.hop = Math.sin((t - 6 - n * 8) / 8 * Math.PI) * 0.3 * kk; if (t === 6 + n * 8 + 8) H.hop = 0; if (t % 3 === 0) c.ghost(8); }
      if (n && t > t0 - 6 && t <= t0) { c.move(1.9 / 6, 0); c.inv(6); if (t % 2) c.ghost(8); }
      if (t === t0) { cut(c, { a0: -2.75, a1: 0.7, r: R, sq: 0.3, dur: 5 }, { r: R + 0.1, arc: 2.6, m: 2.4 * (lv >= 7 ? 1.2 : 1), lv: 'heavy', crit: Math.random() < 0.3 + (lv >= 5 ? 0.3 : 0), kb: 0.6 }); stop(8); shake(6); pts('drop', c.x + c.f * 1.6 * kk, c.y - 0.55 * kk, kk, 8, { dir: c.f > 0 ? 0 : Math.PI, spread: 0.7, sp: 4, life: 26 }); }
      if (lv >= 10 && t === t0 + 14) { cut(c, { a0: 0.7, a1: -2.75, r: R, sq: 0.3, dur: 5 }, { r: R + 0.1, arc: 2.6, m: 1.2, lv: 'heavy', kb: 1.2 }); shake(5); W.wave(c, { x: c.x + c.f * 0.6 * kk, y: c.y, f: c.f, dist: 3.5, dur: 18, sc: 1.1, m: 0.5, kb: 1 }); } },
    /* 一閃：蓄力 → 瞬移穿過 → 收刀停一拍 → 被穿過的敵人身上斬痕同時爆開。升級：穿過去再穿回來 */
    issen(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx, pass = lv >= 10 ? 3 : lv >= 7 ? 2 : 1, tb = 22 + pass * 12 + 12;
      if (t === 1) { c.a.T = tb + 22; pts('drop', c.x, c.y - 0.5 * kk, kk, 8, { orb: 0.9, inward: 1, up: 0.5, life: 22, stag: 14 }); m.sk = []; m.n = new Map(); }
      for (let p = 0; p < pass; p++) { const t0 = 22 + p * 12; if (t === t0) { if (p) { H.face = -H.face; c.a.face0 = H.face; } const x0 = c.x, y0 = c.y, f = c.f; add(tb - t0 + 8, 'o', (ctx, u) => { const a = u < tb - t0 ? 1 : 1 - (u - tb + t0) / 8; ctx.strokeStyle = 'rgba(232,246,255,' + a + ')'; ctx.lineWidth = Math.max(1, kk * 0.02); ctx.beginPath(); ctx.moveTo(x0, y0 - (0.5 + p * 0.08) * kk); ctx.lineTo(x0 + f * Math.min(3.2 * kk, u * 0.7 * kk), y0 - (0.5 + p * 0.08) * kk); ctx.stroke(); }); }
        if (t > t0 && t <= t0 + 5) { c.move(3.2 / 5, 0); c.ghost(12); c.inv(12); for (const e of G.E) if (alive(e) && Math.abs(e.x - H.x) < 0.6 * kk && Math.abs(e.y - H.y) < 0.5 * kk && (m.n.get(e) || 0) <= p) { m.n.set(e, p + 1); if (!m.sk.includes(e)) m.sk.push(e); e.stun = Math.max(e.stun || 0, 60); } } }
      if (t === tb) { stop(10); shake(6); for (const e of m.sk) { if (!alive(e)) continue; const k2 = m.n.get(e) || 1; marks(e, kk, 3 + k2 * 2); G.damageOni(e, 2.6 * c.mul, true, lv >= 5); for (let j = 1; j < k2; j++) c.later(j * 5, () => { if (alive(e)) G.damageOni(e, 1.0 * c.mul, true, false); }); pts('drop', e.x, e.y - 0.5 * kk, kk, 6 + k2 * 2, { sp: 3.4, up: 1.2, life: 28 }); c.a.mvx.hit = 1; }
        if (lv >= 3 && H.cd) for (const q in H.cd) if (/^m:/.test(q)) H.cd[q] = 0; } },
    /* 燕返：上斬 → 下斬。升級：打完瞬移到目標身後再打一輪 */
    tsubame(c, t) { const lv = LV(c), kk = K(c.y), rounds = lv >= 7 ? 3 : lv >= 5 ? 2 : 1, ex = lv >= 3, per = ex ? 34 : 24, m = c.a.mvx;
      if (t === 1) c.a.T = 6 + rounds * per + 12 + (lv >= 10 ? 14 : 0);
      for (let r = 0; r < rounds; r++) { const t0 = 6 + r * per; if (r && t === t0 - 4) { const e = near(c, 4, 1); if (e) blink(c, e, kk); }
        if (t === t0) cut(c, { a0: 1.2, a1: -1.4, r: 1.6, sq: 1, dur: 4 }, { r: 1.7, arc: 2.0, m: 1.1, launch: 30 });
        if (t === t0 + 10) { cut(c, { a0: -2.1, a1: 0.95, r: 1.7, sq: 1, dur: 4 }, { r: 1.8, arc: 2.0, m: 1.2, lv: 'heavy', stun: 40, kb: 0.3 }); stop(4); shake(4); }
        if (ex && t === t0 + 20) cut(c, { a0: -2.4, a1: 1.1, r: 1.8, sq: 0.42, dur: 4 }, { r: 1.9, arc: 2.4, m: 1.1 }); }
      if (lv >= 10 && t === 6 + rounds * per + 4) { cut(c, { a0: -2.75, a1: 0.7, r: 2.4, sq: 0.32, dur: 5 }, { r: 2.5, arc: 2.6, m: 1.2, lv: 'heavy' }); shake(5); W.wave(c, { x: c.x + c.f * 0.6 * kk, y: c.y, f: c.f, dist: 5, dur: 22, sc: 1.1, m: 0.8, lv: 'heavy' }); } },
    /* 一息截隙：一記快斬；打在敵人出手的瞬間＝截隙，必爆擊並大量回氣。升級：截隙成功追加三連斬 */
    special_breath(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx;
      if (t === 1) c.a.T = 34 + (lv >= 7 ? 14 : 0);
      if (t === 7) { const busy = G.E.filter(e => e.st === 'atk' && !e.atkHit), hs = cut(c, { a0: -0.7, a1: 0.6, r: 1.7, sq: 0.35, dur: 3 }, { r: 1.8, arc: 1.8, m: 1.0, stun: 40 }), ok = hs.filter(e => busy.includes(e)), d = G.RPG.d(), q = (ok.length ? 30 : 15) * (lv >= 3 ? 1.5 : 1) + (lv >= 10 && ok.length ? 10 : 0);
        d.qi = Math.min(100, (d.qi || 0) + q); G.NUMS.push({ x: H.x, y: H.y - kk - 10, v: '氣 +' + Math.round(q), t: 0, col: '#ffc0d6' }); if (lv >= 5) G.BUFF.add('aspd', 15, 300); m.ok = ok.length;
        if (ok.length) { stop(14); shake(4); G.UI.toast('截隙成功　氣大量回復'); say('截', kk); for (const e of ok) { G.damageOni(e, 0.6 * c.mul, true, true); marks(e, kk, 4, '255,226,150'); pts('drop', e.x, e.y - 0.5 * kk, kk, 8, { sp: 3.4, up: 1.2, life: 26 }); if (lv >= 10) e.stun = Math.max(e.stun || 0, 90); } } }
      if (lv >= 7 && m.ok) for (let i = 0; i < 3; i++) if (t === 16 + i * 6) cut(c, { a0: i % 2 ? 0.95 : -1.9, a1: i % 2 ? -1.55 : 0.75, r: 1.6, sq: 0.7, dur: 3 }, { r: 1.7, m: 0.3, lv: i === 2 ? 'heavy' : 'light' }); },
    /* 半月歸鞘：收刀架勢，腳下一圈水環；被打自動反擊。沒被打到，架勢結束時補一刀 */
    special_home(c, t) { const lv = LV(c), kk = K(c.y), T = 52 + (lv >= 3 ? 30 : 0);
      if (t === 1) { c.a.T = T; const a0 = c.a; add(T, 'g', (ctx, u) => { if (H.act !== a0) return; const a = Math.min(1, u / 6); AF().fr('p_shion_fx', 'glide_water', 2 + Math.floor(u / 5) % 3, H.x, H.y, { size: kk * (2.4 + 0.15 * Math.sin(u * 0.2)), by: 'w', a: a * 0.9 });
          ctx.save(); ctx.translate(H.x, H.y); ctx.scale(1, 0.4); for (let j = 0; j < 3; j++) { const q = ((u + j * 12) % 36) / 36; ctx.strokeStyle = 'rgba(' + (j % 2 ? '150,205,240' : '225,244,255') + ',' + 0.75 * a * (1 - q) + ')'; ctx.lineWidth = Math.max(1, kk * (0.055 - 0.035 * q)); ctx.beginPath(); ctx.arc(0, 0, kk * (0.35 + 0.95 * q), 0, TAU); ctx.stroke(); } ctx.restore(); }); }
      if (t === T - 6 && !c.a.mvx.ctr) cut(c, { a0: -0.6, a1: 0.5, r: 1.8, sq: 0.3, dur: 3 }, { r: 1.9, arc: 1.6, m: 0.8 }); },
    /* 返脈斷風：一斬 → 後撤 → 放出一道水月牙 */
    special_return(c, t) { const lv = LV(c), kk = K(c.y), R = lv >= 5 ? 6 : 4, pre = lv >= 7 ? 8 : 0;
      if (t === 1) c.a.T = 44 + pre;
      if (t === 6) cut(c, { a0: -2.3, a1: 1.1, r: 1.5, dur: 4 }, { r: 1.6, arc: 2.2, m: 1.0 });
      if (pre && t === 14) cut(c, { a0: 1.1, a1: -2.0, r: 1.6, sq: 0.8, dur: 4 }, { r: 1.7, arc: 2.2, m: 0.8 });
      if (t > 6 + pre && t <= 16 + pre) c.move(-0.11 * (lv >= 3 ? 1.4 : 1), 0); if (t === 8 + pre) c.ghost(12);
      if (t === 20 + pre) { arc(c, { a0: -1.2, a1: 0.9, r: 1.6, sq: 0.6, dur: 4 }); for (const dy of lv >= 10 ? [-0.9, 0.9] : [0]) W.wave(c, { x: c.x + c.f * 0.6 * kk, y: c.y, f: c.f, dist: R, dy, dur: 22, sc: 1, m: 1.2, lv: 'heavy' }); } },
    /* 翻潮織刃：連續進斬，最後一斬把敵人拉回身前 */
    special_tide(c, t) { const lv = LV(c), kk = K(c.y), n = lv >= 7 ? 5 : 3, gap = 11;
      if (t === 1) c.a.T = 8 + n * gap + 10 + (lv >= 10 ? 18 : 0);
      for (let i = 0; i < n; i++) { const fr = 10 + i * gap, last = i === n - 1; if (t > fr - 5 && t <= fr) c.move(0.09, 0);
        if (t === fr) { cut(c, { a0: i % 2 ? 2.0 : -2.0, a1: i % 2 ? -0.9 : 0.9, sq: 0.7, r: 1.5 + i * 0.08, dur: 4 }, { r: 1.6 + i * 0.08, arc: 2.2, m: 0.8, lv: last ? 'heavy' : 'mid', kb: last ? 0 : 0.3 * (lv >= 3 ? 1.5 : 1) });
          if (last && lv >= 5) { const px = c.x + c.f * 1.0 * kk; c.later(3, () => { for (const e of foes(px, c.y, 3 * kk)) if ((e.x - H.x) * c.f > 0) drag(e, px, e.y, 0.7); }); } } }
      if (lv >= 10 && t === 10 + n * gap + 4) { cut(c, { a0: -2.75, a1: 0.7, r: 2.4, sq: 0.32, dur: 6 }, { r: 2.5, arc: 2.6, m: 1.2, lv: 'heavy', kb: 2 }); shake(6); W.wave(c, { x: c.x + c.f * 0.4 * kk, y: c.y, f: c.f, dist: 4, dur: 22, sc: 1.4, m: 0.6, lv: 'heavy', kb: 2 }); } } };
  const KAT_CT = { special_home(c, e) { const lv = LV(c), kk = K(c.y); c.a.mvx.ctr = 1; c.a.T = Math.max(c.a.T, H.t + 30); cut(c, { a0: Math.PI, a1: -Math.PI * 1.02, r: 1.7, sq: 0.4, dur: 6 }, { shape: 'circle', r: 1.8, m: 2.2, lv: 'heavy', crit: lv >= 5, kb: lv >= 7 ? 1.4 : 0 }); stop(8); shake(5); W.ring(c.x, c.y, kk, 1.5);
      if (lv >= 7) c.later(10, () => cut(c, { a0: -2.3, a1: 1.0, r: 1.8, dur: 4 }, { r: 1.9, m: 0.6 }));
      if (lv >= 10) c.later(20, () => { cut(c, { a0: -Math.PI, a1: Math.PI * 1.02, r: 2.1, sq: 0.4, dur: 6 }, { shape: 'circle', r: 2.2, m: 0.8, lv: 'heavy', launch: 40 }); shake(5); }); } };
  /* =====================================================================
   * 野太刀（火）：主體是多段重斬；火只留在刀光本身，地面用地裂、地面爆炸、燃燒帶
   * ===================================================================== */
  /* 火月牙：程式畫的月牙刀氣往前飛 */
  function moon(c, o) { const k = K(o.y), dur = o.dur || 20, tot = o.back ? dur * 2 : dur, sc = o.sc || 1, f = o.f; add((o.d0 || 0) + tot + 2, 'o', (ctx, u) => { const v = u - (o.d0 || 0); if (v < 0 || v > tot) return; const p = flyPos(o, v), R = 0.95 * k * sc, a = v > tot - 4 ? (tot - v) / 4 : 1, dir = o.back && v > dur ? -f : f; ctx.translate(p[0], p[1] - 0.55 * k); ctx.scale(dir, 1); ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(-R * 0.3, 0, R, 0); g.addColorStop(0, 'rgba(196,70,30,0.15)'); g.addColorStop(0.55, 'rgba(250,150,60,0.9)'); g.addColorStop(1, 'rgba(255,240,190,1)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, -1.15, 1.15); ctx.arc(-R * 0.55, 0, R * 1.02, 0.95, -0.95, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,250,226,0.9)'; ctx.lineWidth = Math.max(1, k * 0.02); ctx.beginPath(); ctx.arc(0, 0, R, -1.05, 1.05); ctx.stroke(); });
    return fly(c, Object.assign({ r: 0.85 * sc, vis: (px, py, i) => { if (i % 2 === 0) pts('ember', px - f * 0.3 * k, py - 0.55 * k, k, 2, { sp: 1, up: 0.6, life: 20, stag: 1, ry: 0.4 }); } }, o)); }
  const NOD = {
    /* 大車輪：一圈一圈旋轉斬，轉過的地面燒起來 */
    skill_daisharin(c, t) { const lv = LV(c), kk = K(c.y), n = 4 + (lv >= 3 ? 2 : 0), gap = 10, te = 8 + n * gap + 6;
      if (t === 1) { c.a.T = te + (lv >= 10 ? 26 : lv >= 5 ? 14 : 8); pts('ember', c.x, c.y - 0.2 * kk, kk, 6, { orb: 0.8, inward: 1, up: 1.2, life: 12, stag: 6 }); }
      if (t === 8) GR.burn(c, c.x + c.f * 0.3 * kk, c.y, kk, lv >= 7 ? 2.4 : 1.9, n * gap + (lv >= 7 ? 90 : 40), 0.15);
      for (let i = 0; i < n; i++) if (t === 8 + i * gap) { c.move(0.05, 0); cut(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.95, sq: 0.38, dur: 8, follow: 1 }, { shape: 'circle', r: 2.05, m: 0.9, lv: i === n - 1 ? 'heavy' : 'mid' }); }
      if (lv >= 5 && t === te) { GR.dust(c.x, c.y, kk, 1.6); shake(5); c.hit({ shape: 'circle', r: 2.4, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 2 }); }
      if (lv >= 10 && t === te + 12) { cut(c, { a0: -2.3, a1: 1.0, r: 2.1, sq: 1, dur: 5 }); GR.crack(c.x + c.f * 0.8 * kk, c.y, kk, 1.5); GR.boom(c.x + c.f * 0.8 * kk, c.y, kk, 1.5, 2); stop(6); c.hit({ shape: 'circle', r: 2.6, m: 1.0, lv: 'heavy', kind: 'cut', launch: 50 }); } },
    /* 月輪：兩刀起手 → 第三刀放出火月牙往前飛 */
    skill_getsurin(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) c.a.T = 50;
      if (t === 6) cut(c, { a0: -2.25, a1: 0.95, r: 1.85, sq: 0.95, dur: 5 }, { r: 1.95, m: 0.6 });
      if (t === 16) cut(c, { a0: 1.05, a1: -2.0, r: 1.85, sq: 0.9, dur: 5 }, { r: 1.95, m: 0.6 });
      if (t === 28) { arc(c, { a0: -2.0, a1: 0.9, r: 1.9, sq: 0.8, rot: -0.3, dur: 5 }); shake(3); const f = c.f, mk = (dy, d0) => moon(c, { x: c.x + f * 0.8 * kk, y: c.y, f, dist: 5, dy, dur: 22, sc: 1.2, d0, m: 1.4, lv: 'heavy', back: lv >= 5 && !dy, end: lv >= 7 ? (px, py) => { if (lv >= 10) { GR.boom(px, py, kk, 1.4); c.hit({ shape: 'circle', x: px, y: py, r: 1.5, m: 1.0, lv: 'heavy', kind: 'cut', launch: 40 }); } GR.burn(c, px, py, kk, 1.5, 90, 0.15); } : null });
        mk(0, 0); if (lv >= 3) mk(1.3, 6); } },
    /* 霸王斬：蓄力 → 兩記重斬逼近 → 劈地，地面裂開爆炸 */
    skill_haousan(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 86 + (lv >= 7 ? 24 : 0); if (lv >= 3) c.inv(40); }
      if (t > 1 && t < 22 && t % 4 === 0) pts('ember', c.x, c.y - 0.1 * kk, kk, 3, { orb: 1.0, inward: 1, up: 1.8, life: 20, stag: 2 });
      if (t > 22 && t <= 28) c.move(0.1, 0); if (t === 28) cut(c, { a0: -2.25, a1: 0.95, r: 1.9, sq: 0.95, dur: 5 }, { r: 2.0, m: 0.6 });
      if (t > 38 && t <= 44) c.move(0.1, 0); if (t === 44) cut(c, { a0: 1.05, a1: -2.0, r: 1.9, sq: 0.9, dur: 5 }, { r: 2.0, m: 0.6 });
      if (t === 58) arc(c, { a0: -2.5, a1: 1.15, r: 2.1, sq: 1, dur: 5 });
      if (t === 62) { const x = c.x + c.f * 1.2 * kk, y = c.y, f = c.f; GR.crack(x, y, kk, 1.6, 140); GR.boom(x, y, kk, 1.4, 1); stop(8); shake(8); c.hit({ shape: 'circle', x, y, r: 1.4, m: 2.4, lv: 'heavy', kind: 'blunt', kb: 1.5 });
        if (lv >= 5) GR.burn(c, x, y, kk, 1.4, 120, 0.3, 8);
        if (lv >= 7) { const nn = lv >= 10 ? 5 : 3; for (let i = 0; i < nn; i++) { const xx = x + f * (1.1 + i * 1.0) * kk, big = lv >= 10 && i === nn - 1; c.later(10 + i * 8, () => { GR.crack(xx, y, kk, big ? 1.5 : 0.9); GR.boom(xx, y, kk, big ? 1.8 : 0.9 + i * 0.1); c.hit({ shape: 'circle', x: xx, y, r: big ? 1.8 : 0.95, m: big ? 1.2 : 0.5, lv: 'heavy', kind: 'cut', launch: big ? 60 : 30 }); }); } } } },
    /* 斬鐵：畫面一暗 → 無視防禦的一刀；敵人身上的斬痕稍後才裂開 */
    skill_zantetsu(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx;
      if (t === 1) { c.a.T = 50 + (lv >= 7 ? 16 : 0) + (lv >= 10 ? 14 : 0); if (G.VX && G.VX.dim) G.VX.dim(26, 0.35); }
      if (t === 12) c.ghost(10);
      if (t === 18) { const x = c.x + c.f * 1.1 * kk, y = c.y, f = c.f; arc(c, { a0: -2.3, a1: 1.0, r: 2.1, sq: 0.9, dur: 3 }); add(18, 'o', (ctx, u) => { const a = u < 8 ? 1 : 1 - (u - 8) / 10; ctx.strokeStyle = 'rgba(255,250,236,' + a + ')'; ctx.lineWidth = Math.max(1.2, kk * 0.03 * (1 - u / 18)); ctx.beginPath(); ctx.moveTo(x - f * 1.1 * kk, y - 1.5 * kk); ctx.lineTo(x + f * 0.9 * kk, y + 0.1 * kk); ctx.stroke(); });
        stop(10); shake(7); m.hs = c.hit({ shape: 'sector', r: 2.1, arc: 2, m: 2.6, lv: 'heavy', kind: 'cut', ign: lv >= 3 ? 80 : 50 }); if (lv >= 5) for (const e of m.hs) if (e.boss && alive(e)) G.damageOni(e, 1.3 * c.mul, true, false, { ign: 80 }); GR.crack(x, y, kk, 0.9, 80); }
      if (lv >= 7 && m.hs) for (let i = 0; i < 3; i++) if (t === 34 + i * 6) for (const e of m.hs) if (alive(e)) { marks(e, kk, 3, '255,206,130'); G.damageOni(e, 0.3 * c.mul, i === 2, false, { ign: 80 }); pts('ember', e.x, e.y - 0.5 * kk, kk, 4, { sp: 2.6, up: 1, life: 22 }); }
      if (lv >= 10 && t === 56) { cut(c, { a0: 1.05, a1: -2.2, r: 2.2, sq: 0.9, dur: 4 }, { r: 2.3, m: 1.0, lv: 'heavy', ign: 80, launch: 40 }); shake(6); stop(6); } },
    /* 轉背截路：轉身 → 反斬兩刀 */
    special_backline(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) c.a.T = 46 + (lv >= 7 ? 16 : 0);
      if (t === 6) { H.face = -H.face; c.a.face0 = H.face; say('返', kk); }
      if (t === 14) { cut(c, { a0: -2.4, a1: 1.1, r: 1.95, dur: 5 }, { r: 2.05, arc: 2.4, m: 1.0, lv: 'heavy', stun: lv >= 5 ? 60 : 0 }); stop(5); shake(4); if (lv >= 3) G.BUFF.add('dr', 20, 120); }
      if (t === 26) cut(c, { a0: 1.05, a1: -2.0, r: 1.95, sq: 0.9, dur: 5 }, { r: 2.05, arc: 2.4, m: 0.6, lv: 'heavy' });
      if (lv >= 7 && t === 40) { const x = c.x + c.f * 1.2 * kk; arc(c, { a0: -2.5, a1: 1.15, r: 2.1, sq: 1, dur: 5 }); GR.crack(x, c.y, kk, 1.2); if (lv >= 10) GR.boom(x, c.y, kk, 1.4, 1); else GR.dust(x, c.y, kk, 1.2); shake(6); c.hit({ shape: 'circle', x, y: c.y, r: 1.5, m: lv >= 10 ? 1.2 : 0.6, lv: 'heavy', kind: 'blunt', kb: 1.5, launch: lv >= 10 ? 40 : 0 }); } },
    /* 蓄勢破守：蓄 → 重斬再補一記下劈；被砍中的敵人防禦下降，身上持續冒火星 */
    special_break(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx;
      if (t === 1) c.a.T = 58;
      if (t > 1 && t < 16 && t % 4 === 0) pts('ember', c.x, c.y - 0.1 * kk, kk, 3, { orb: 0.9, inward: 1, up: 1.6, life: 18, stag: 2 });
      if (t === 20) { stop(6); shake(5); const T2 = lv >= 5 ? 360 : 180; m.hs = cut(c, { a0: -2.1, a1: 0.95, r: 2.0, sq: 1, rot: 0.15, dur: 5 }, { r: 2.1, arc: 2.2, m: 1.2, def: lv >= 3 ? 30 : 20, lv: 'heavy' });
        for (const e of m.hs) { e.db = e.db || {}; e.db.defT = T2; marks(e, kk, 3, '255,206,130'); for (let i = 0; i * 30 < T2; i++) c.later(i * 30, () => { if (!alive(e) || !(e.db && e.db.defT > 0)) return; pts('ember', e.x, e.y - 0.6 * kk * (e.ratio || 1), kk, 3, { sp: 1, up: 1.2, life: 26, rx: 0.3 }); if (lv >= 7 && i % 2 === 0 && i < 10) G.damageOni(e, 0.15 * c.mul, false, false); }); } if (m.hs.length) say('破守', kk); }
      if (t === 34) { const x = c.x + c.f * 1.2 * kk; cut(c, { a0: -2.5, a1: 1.15, r: 2.1, sq: 1, dur: 5 }, { r: 2.2, m: 0.6, lv: 'heavy' }); GR.crack(x, c.y, kk, 1.0, 80); shake(4); if (lv >= 10) { GR.boom(x, c.y, kk, 1.6, 2); c.later(2, () => c.hit({ shape: 'circle', x, y: c.y, r: 1.7, m: 0.8, lv: 'heavy', kind: 'cut', launch: 40 })); } } },
    /* 拔刀貫線：刀尖在地上劃出一道裂痕 → 一秒後整條引爆 */
    special_drawline(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 4.5 : 3;
      if (t === 1) c.a.T = 44; if (t !== 10) return; arc(c, { a0: -0.5, a1: 0.4, r: 1.9, sq: 0.3, dur: 4 }); const x0 = c.x, y0 = c.y, f = c.f, n = Math.round(D / 1.5) + 1, times = lv >= 10 ? 3 : lv >= 5 ? 2 : 1, life = 60 + (times - 1) * 22;
      for (let i = 0; i < n; i++) c.later(i * 3, () => GR.crack(x0 + f * (0.9 + i * (D - 0.6) / Math.max(1, n - 1)) * kk, y0, kk, 0.95, life + 30));
      add(life, 'g', (ctx, u) => { const g = ease(u / 14), a = Math.min(1, (life - u) / 10) * (0.6 + 0.4 * Math.sin(u * 0.5)); ctx.save(); ctx.translate(0, y0); ctx.scale(1, 0.4); ctx.strokeStyle = 'rgba(255,170,70,' + 0.85 * a + ')'; ctx.lineWidth = Math.max(1.5, kk * 0.04); ctx.beginPath(); ctx.moveTo(x0 + f * 0.5 * kk, 0); ctx.lineTo(x0 + f * (0.5 + D * g) * kk, 0); ctx.stroke(); ctx.restore(); });
      for (let j = 0; j < times; j++) c.later(60 + j * 22, () => { shake(6); for (let i = 0; i < n; i++) GR.boom(x0 + f * (0.9 + i * (D - 0.6) / Math.max(1, n - 1)) * kk, y0, kk, (0.9 + 0.25 * Math.random()) * (1 + j * 0.15), i * 3); c.hit({ shape: 'line', x: x0, y: y0, len: D + 0.4, w: 0.55 + j * 0.1, m: j === 2 ? 1.0 : 1.6, lv: 'heavy', kind: 'cut', launch: 30, face: f });
        if (lv >= 7 && j === times - 1) GR.burn(c, x0 + f * (0.5 + D / 2) * kk, y0, kk, D * 0.5, 100, 0.2, 10); }); },
    /* 長刃離陣：兩刀 → 往後跳開 → 落地 */
    special_leave(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 1.4 : 1.0, m = c.a.mvx;
      if (t === 1) c.a.T = 54 + (lv >= 10 ? 18 : 0);
      if (t === 6) cut(c, { a0: 1.05, a1: -2.0, r: 1.9, sq: 0.9, dur: 5 }, { r: 2.0, m: 0.6 });
      if (t === 16) { cut(c, { a0: -2.3, a1: 1.1, r: 1.95, sq: 0.7, rot: -0.3, dur: 5 }, { r: 2.05, arc: 2.2, m: 1.0, lv: 'heavy' }); shake(3); m.px = c.x + c.f * 0.9 * kk; m.py = c.y; if (lv >= 7) { GR.crack(m.px, m.py, kk, 1.0, 60); c.later(28, () => { GR.boom(m.px, m.py, kk, 1.4); c.hit({ shape: 'circle', x: m.px, y: m.py, r: 1.5, m: 0.8, lv: 'heavy', kind: 'cut' }); }); } }
      if (t > 16 && t <= 30) { c.move(-D * 1.6 / 14, 0); H.hop = Math.sin((t - 16) / 14 * Math.PI) * 0.45 * kk; }
      if (t === 31) { H.hop = 0; GR.dust(c.x, c.y, kk, lv >= 5 ? 1.5 : 0.9); if (lv >= 5) { shake(5); c.hit({ shape: 'circle', r: 1.8, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 1.2 }); } }
      if (lv >= 10 && t > 40 && t <= 46) { c.move(2.2 / 6, 0); c.inv(6); if (t % 2) c.ghost(8); }
      if (lv >= 10 && t === 47) { cut(c, { a0: -2.5, a1: 1.15, r: 2.2, sq: 0.5, dur: 5 }, { r: 2.3, arc: 2.6, m: 1.2, lv: 'heavy', kb: 1.5 }); shake(6); stop(6); } } };
  /* =====================================================================
   * 薙刀（風／葉）：主體是大範圍橫掃多段；葉片當點綴，龍捲只留在嵐、千鳥收尾與立架截飛
   * ===================================================================== */
  const NAG = {
    /* 嵐：原地連續旋轉掃擊，葉片繞身；可以邊轉邊走 */
    skill_arashi(c, t) { const lv = LV(c), kk = K(H.y), dur = lv >= 3 ? 180 : 120;
      if (t === 1) { c.a.T = dur + 12; pts('leaf', 0, 0, kk, 26, { follow: 1, fy: -0.4 * kk, orb: 1.7, up: 0.3, life: dur, stag: dur * 0.8, spin: 1.5, ry: 0.4 }); }
      if (t > dur) return;
      if (t % 12 === 6) { arc(c, { x: H.x, y: H.y, a0: Math.PI, a1: -Math.PI * 1.03, r: 2.05, sq: 0.36, dur: 9, follow: 1, cy: 0.35 + 0.3 * ((t / 12) % 2) }); c.hit({ shape: 'circle', x: H.x, y: H.y, r: 2.1, m: 0.45, lv: 'light', kind: 'cut' }); }
      if (lv >= 7 && t % 6 === 0) for (const e of foes(H.x, H.y, 3.4 * kk)) drag(e, H.x, H.y, 0.035);
      if (lv >= 5 && t === dur) { const big = lv >= 10, x = H.x + c.f * 0.6 * kk, y = H.y, L = big ? 150 : 120, sc = big ? 1.5 : 1; N.tornado(x, y, kk, L, sc); for (let i = 1; i * 20 < L; i++) c.later(i * 20, () => { c.hit({ shape: 'circle', x, y, r: 1.3 * sc, m: 0.3, lv: 'light', kind: 'cut' }); for (const e of foes(x, y, 2.6 * sc * kk)) drag(e, x, y, 0.12); });
        if (big) c.later(L, () => { shake(7); pts('leaf', x, y - 0.6 * kk, kk, 30, { sp: 6, up: 1, life: 40 }); c.hit({ shape: 'circle', x, y, r: 2.6, m: 1.2, lv: 'heavy', kind: 'cut', kb: 3, launch: 40 }); }); } },
    /* 千鳥：疾風突進穿過敵人，停下時回身一掃 */
    skill_chidori(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx, n = lv >= 10 ? 3 : lv >= 3 ? 2 : 1, per = 26;
      if (t === 1) { c.a.T = 12 + n * per + 10; pts('leaf', c.x, c.y - 0.4 * kk, kk, 6, { orb: 0.9, inward: 1, up: 0.4, life: 12, stag: 6 }); }
      for (let i = 0; i < n; i++) { const t0 = 10 + i * per; if (t === t0) { if (i) { H.face = -H.face; c.a.face0 = H.face; } m.sk = []; m.x0 = c.x; N.gust(c, { x: c.x, y: c.y, f: c.f, dist: 3.5, dur: 9, sc: 1.2 }); }
        if (t > t0 && t <= t0 + 8) { c.move(3.5 / 8, 0); c.inv(6); if (t % 2) c.ghost(8); c.hit({ shape: 'circle', r: 1.0, m: 1.2, lv: 'mid', kind: 'cut', skip: m.sk }).forEach(e => m.sk.push(e)); if (t % 2 === 0) pts('leaf', c.x, c.y - 0.5 * kk, kk, 3, { dir: c.f > 0 ? Math.PI : 0, spread: 0.8, sp: 1.6, life: 26, stag: 1 }); }
        if (t === t0 + 10) { H.face = -H.face; c.a.face0 = H.face; cut(c, { a0: -2.6, a1: 0.6, r: 2.05, sq: 0.42, dur: 5 }, { r: 2.15, arc: 2.6, m: 0.6 }); H.face = -H.face; c.a.face0 = H.face; const xa = m.x0, xb = c.x, y = c.y, f = c.f;
          if (lv >= 5) for (let q = 0; q < 3; q++) c.later(14 + q * 30, () => { pts('leaf', (xa + xb) / 2, y - 0.4 * kk, kk, 8, { dir: f > 0 ? 0 : Math.PI, spread: 0.3, sp: 3, life: 30, rx: Math.abs(xb - xa) / kk * 0.5 }); c.hit({ shape: 'line', x: xa, y, len: Math.abs(xb - xa) / kk, w: 0.6, m: 0.3, lv: 'light', kind: 'cut', face: f }); });
          if (lv >= 7 && i === n - 1) { const big = lv >= 10, L = big ? 110 : 70, sc = big ? 1.5 : 1, tx = xb + f * 0.8 * kk; N.tornado(tx, y, kk, L, sc, 4); for (let q = 1; q * 20 < L; q++) c.later(4 + q * 20, () => { c.hit({ shape: 'circle', x: tx, y, r: 1.3 * sc, m: 0.35, lv: 'mid', kind: 'cut', launch: 20 }); for (const e of foes(tx, y, 2.6 * sc * kk)) drag(e, tx, y, 0.12); }); } } } },
    /* 燕舞：一段一段的舞斬，邊斬邊往前 */
    skill_enbu(c, t) { const lv = LV(c), kk = K(c.y), n = 5 + (lv >= 3 ? 2 : 0) + (lv >= 7 ? 2 : 0), gap = 8, te = 6 + n * gap + 6;
      if (t === 1) c.a.T = te + (lv >= 10 ? 20 : 8);
      for (let i = 0; i < n; i++) if (t === 6 + i * gap) { c.move(0.06, 0); const hs = cut(c, { a0: i % 2 ? 1.1 : -2.4, a1: i % 2 ? -2.4 : 1.1, sq: 0.5 + (i % 3) * 0.15, rot: i % 2 ? 0.2 : -0.2, r: 2.0, dur: 5 }, { r: 2.1, arc: 2.4, m: 0.6 }); if (lv >= 5 && hs.length) { const d = G.RPG.d(); d.qi = Math.min(100, (d.qi || 0) + 1); } if (i % 3 === 0) pts('leaf', c.x + c.f * kk, c.y - 0.5 * kk, kk, 4, { sp: 2.4, life: 26 }); }
      if (lv >= 10 && t === te) { cut(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 2.4, sq: 0.38, dur: 8 }, { shape: 'circle', r: 2.5, m: 1.0, lv: 'heavy', launch: 50 }); pts('leaf', c.x, c.y - 0.5 * kk, kk, 18, { sp: 5, up: 1, life: 36 }); shake(5); stop(5); } },
    /* 旋風薙：聚風 → 大橫掃把敵人吹開。升級：反向再掃、最後迴旋一圈 */
    skill_senpu(c, t) { const lv = LV(c), kk = K(c.y), r = lv >= 3 ? 2.6 : 2.05;
      if (t === 1) { c.a.T = 44 + (lv >= 7 ? 16 : 0) + (lv >= 10 ? 18 : 0); N.gather(c.x, c.y, kk, 12, 1.1); }
      if (t === 14) { cut(c, { a0: -2.9, a1: 1.5, r, sq: 0.4, dur: 7 }, { r: r + 0.15, arc: 3.1, m: 1.4, lv: 'heavy', kb: 1.6 }); N.ribbons(c.x + c.f * 1.2 * kk, c.y - 0.5 * kk, c.f, kk, 1.4, 1); pts('leaf', c.x + c.f * kk, c.y - 0.5 * kk, kk, 14, { dir: c.f > 0 ? 0 : Math.PI, spread: 1.1, sp: 4, life: 36 }); stop(5); shake(5); }
      if (lv >= 5 && t === 28) for (const e of foes(c.x, c.y, 3.4 * kk)) drag(e, c.x + c.f * 1.2 * kk, c.y, 0.6);
      if (lv >= 7 && t === 36) { cut(c, { a0: 1.5, a1: -2.9, r, sq: 0.4, dur: 7 }, { r: r + 0.15, arc: 3.1, m: 0.8, lv: 'heavy', kb: 1.0 }); shake(4); }
      if (lv >= 10 && t === 54) { cut(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: r + 0.2, sq: 0.38, dur: 8 }, { shape: 'circle', r: r + 0.35, m: 1.0, lv: 'heavy', launch: 50 }); pts('leaf', c.x, c.y - 0.5 * kk, kk, 20, { sp: 5.5, up: 1, life: 38 }); shake(6); stop(6); } },
    /* 環流回刃：往旁邊滑開 → 迴旋一斬 */
    special_current(c, t) { const lv = LV(c), kk = K(c.y), D = lv >= 3 ? 1.5 : 1, m = c.a.mvx;
      if (t === 1) { c.a.T = 42 + (lv >= 10 ? 14 : 0); m.dir = (G.IN.my || 0.6); m.px = c.x; m.py = c.y; pts('leaf', c.x, c.y - 0.4 * kk, kk, 6, { sp: 2, life: 24 }); }
      if (t <= 10) { c.move(0, m.dir * 0.1 * D); if (lv >= 5) c.inv(4); if (t % 3 === 0) c.ghost(10); }
      if (lv >= 7 && t === 12) { const o = { x: m.px, y: m.py, f: c.f, a0: Math.PI, a1: -Math.PI * 1.03, r: 2.0, sq: 0.38, dur: 8, free: 1 }; G.WFX.arc(o, 2.0); c.hit({ shape: 'circle', x: m.px, y: m.py, r: 2.05, m: 0.6, lv: 'mid', kind: 'cut' }); }
      if (t === 14) { cut(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 2.05, sq: 0.38, dur: 8 }, { shape: 'circle', r: 2.1, m: 1.2 }); pts('leaf', c.x, c.y - 0.4 * kk, kk, 10, { sp: 3.4, life: 30 }); shake(3); }
      if (lv >= 10 && t === 28) { cut(c, { a0: -Math.PI, a1: Math.PI * 1.03, r: 2.3, sq: 0.38, dur: 8, cy: 0.3 }, { shape: 'circle', r: 2.4, m: 0.8, lv: 'heavy', launch: 50 }); pts('leaf', c.x, c.y - 0.4 * kk, kk, 16, { sp: 4.5, up: 1.2, life: 34 }); shake(5); } },
    /* 雙向斷陣：前後同時各一斬 */
    special_double(c, t) { const lv = LV(c), kk = K(c.y), both = (a, h) => { for (const f of [c.f, -c.f]) { arc(c, Object.assign({ f }, a)); c.hit(Object.assign({ shape: 'sector', face: f, kind: 'cut', lv: 'mid', arc: 2.2 }, h)); } };
      if (t === 1) c.a.T = 34 + (lv >= 3 ? 12 : 0) + (lv >= 5 ? 12 : 0) + (lv >= 7 ? 12 : 0) + (lv >= 10 ? 14 : 0);
      let q = 10; if (t === q) { both({ a0: -2.0, a1: 0.9, sq: 0.8, rot: -0.4, r: 2.0, dur: 5 }, { r: 2.1, m: 1.0 }); shake(3); }
      if (lv >= 3 && t === (q += 12)) both({ a0: 2.0, a1: -0.9, sq: 0.8, rot: 0.4, r: 2.0, dur: 5 }, { r: 2.1, m: 0.5 });
      if (lv >= 7 && t === (q += 12)) both({ a0: -2.6, a1: 0.6, sq: 0.42, r: 2.2, dur: 5 }, { r: 2.3, m: 0.5 });
      if (lv >= 5 && t === (q += 12)) { pts('leaf', c.x, c.y - 0.5 * kk, kk, 18, { sp: 4.5, up: 0.8, life: 34 }); shake(5); cut(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.9, sq: 0.38, dur: 7 }, { shape: 'circle', r: 2.0, m: 1.0, lv: 'heavy' }); }
      if (lv >= 10 && t === (q += 14)) { cut(c, { a0: -Math.PI, a1: Math.PI * 1.03, r: 2.4, sq: 0.38, dur: 8, cy: 0.3 }, { shape: 'circle', r: 2.5, m: 0.8, lv: 'heavy', launch: 50 }); shake(6); stop(5); } },
    /* 引群開路：一掃把前方敵人吹開，一道風往前吹出去 */
    special_openpath(c, t) { const lv = LV(c), kk = K(c.y), kb = lv >= 3 ? 4 : 2.7;
      if (t === 1) c.a.T = 40 + (lv >= 7 ? 16 : 0) + (lv >= 10 ? 16 : 0);
      if (t === 12) { cut(c, { a0: -2.6, a1: 1.3, r: 2.05, sq: 0.45, dur: 6 }, { r: 2.15, arc: 2.6, m: 1.1, kb }); shake(4); N.gust(c, { x: c.x + c.f * 0.4 * kk, y: c.y, f: c.f, dist: 4.5, dur: 14, sc: 1.4 }); pts('leaf', c.x + c.f * kk, c.y - 0.5 * kk, kk, 12, { dir: c.f > 0 ? 0 : Math.PI, spread: 0.5, sp: 6, life: 34 }); if (lv >= 5) G.BUFF.add('spd', 30, 180); }
      if (lv >= 7 && t > 22 && t <= 28) c.move(0.2, 0);
      if (lv >= 7 && t === 28) cut(c, { a0: 1.3, a1: -2.6, r: 2.05, sq: 0.45, dur: 6 }, { r: 2.15, arc: 2.6, m: 0.6, kb: kb * 0.6 });
      if (lv >= 10 && t > 38 && t <= 44) c.move(0.2, 0);
      if (lv >= 10 && t === 44) { cut(c, { a0: -2.9, a1: 1.5, r: 2.5, sq: 0.4, dur: 7 }, { r: 2.6, arc: 3.0, m: 1.0, lv: 'heavy', kb: 5 }); pts('leaf', c.x + c.f * kk, c.y - 0.5 * kk, kk, 16, { dir: c.f > 0 ? 0 : Math.PI, spread: 0.6, sp: 7, life: 36 }); shake(6); stop(5); } },
    /* 立架截飛：放出龍捲，繞著敵人轉並持續攻擊 → 把敵人捲上去 → 摔落昏迷 */
    special_upright(c, t) { const lv = LV(c), kk = K(c.y);
      if (t === 1) { c.a.T = 40; N.gather(c.x + c.f * 0.5 * kk, c.y, kk, 12, 1); }
      if (t !== 14) return; arc(c, { a0: 0.9, a1: -1.6, r: 2.0, sq: 1, dur: 5 }); const tg = near(c, 5, 0), cx0 = tg ? tg.x : c.x + c.f * 2.2 * kk, cy0 = tg ? tg.y : c.y, nT = lv >= 10 ? 3 : lv >= 7 ? 2 : 1, ORB = 90 + (lv >= 3 ? 30 : 0), stunT = lv >= 10 ? 180 : lv >= 5 ? 120 : 60, R0 = 1.25 * kk, LIFE = ORB + 44, P = [], ctr = [cx0, cy0];
      for (let j = 0; j < nT; j++) { const p = [c.x + c.f * 0.8 * kk, c.y]; P.push(p); N.tornado(0, 0, kk, LIFE, 0.9, 0, { p }); }
      for (let i = 0; i <= LIFE; i++) c.later(i, () => { if (tg && alive(tg) && i < ORB) { ctr[0] += (tg.x - ctr[0]) * 0.1; ctr[1] += (tg.y - ctr[1]) * 0.1; }
        P.forEach((p, j) => { const an = i * 0.085 + j / nT * TAU, rr = i < ORB ? R0 : R0 * Math.max(0, 1 - (i - ORB) / 12), tx = ctr[0] + Math.cos(an) * rr, ty = ctr[1] + Math.sin(an) * rr * 0.45, s = i < 14 ? 0.18 : 0.5; p[0] += (tx - p[0]) * s; p[1] += (ty - p[1]) * s; });
        if (i > 12 && i < ORB && i % 15 === 0) for (const p of P) c.hit({ shape: 'circle', x: p[0], y: p[1], r: 1.0, m: 0.3, lv: 'light', kind: 'cut' });
        if (i < ORB && i % 4 === 0) for (const e of foes(ctr[0], ctr[1], 2.2 * kk)) drag(e, ctr[0], ctr[1], 0.06);
        if (i === ORB + 10) { shake(5); pts('leaf', ctr[0], ctr[1] - 0.5 * kk, kk, 16, { orb: 0.8, up: 3, life: 36, spin: 2 }); c.hit({ shape: 'circle', x: ctr[0], y: ctr[1], r: 1.7, m: 0.5, lv: 'mid', kind: 'cut', launch: 34 }); }
        if (i === LIFE) { GR.dust(ctr[0], ctr[1], kk, 1.3 + 0.2 * nT); shake(7); stop(6); for (const e of c.hit({ shape: 'circle', x: ctr[0], y: ctr[1], r: 1.9, m: 1.0 + 0.3 * (nT - 1), lv: 'heavy', kind: 'blunt', stun: stunT })) say('昏', kk); } }); } };
  const NAG_CT = {};
  /* ---------- 說明文字與冷卻：[說明, Lv3, Lv5, Lv7, Lv10] ---------- */
  const TXT = { katana: {
      iai: ['收刀後拔斬，由左往右一記大橫劈', '先打兩下普攻連段，後跳，再衝上前打出大橫劈', '連段變三下', '大橫劈範圍更大、傷害 +20%', '連段變四下，大橫劈後再反手補一記並推出一道浪'],
      issen: ['蓄力後瞬移穿過敵人，收刀一拍後敵人身上斬痕同時爆開', '命中後重置招式冷卻', '必定暴擊', '穿過去再穿回來，多斬一次', '來回穿三次'],
      tsubame: ['上斬把敵人挑起，再返刀下斬', '每輪追加第三段橫斬', '打完瞬移到目標身後，再打一輪', '再瞬移一次，打第三輪', '最後補一記大橫劈並放出水刃'],
      special_breath: ['一記快斬並回 15 氣力；打在敵人出手瞬間則必暴擊、回 30', '回氣 +50%', '之後 5 秒攻速 +15%', '截隙成功時追加三連斬', '截隙成功時敵人暈得更久，多回 10 氣力'],
      special_home: ['收刀架勢，腳下一圈水環；被打中自動迴旋反擊', '架勢時間 +0.5 秒', '反擊必暴擊', '反擊把四周敵人推開，並追加一斬', '再追加一圈迴旋斬把敵人挑起'],
      special_return: ['一斬後往後撤，再放出水月牙飛行 4H', '後撤距離 +40%', '水月牙飛 6H', '後撤前多斬一刀', '水月牙變成兩道'],
      special_tide: ['三連進斬', '擊退距離 +50%', '最後一斬把敵人拉回身前', '變成五連斬', '最後補一記大橫劈並推出巨浪'] },
    nodachi: {
      skill_daisharin: ['連續四圈旋轉斬，轉過的地面燒起來', '多轉兩圈', '結束時震起一圈塵浪擊退', '燃燒範圍更大、燒更久', '收尾劈地，地面裂開爆炸'],
      skill_getsurin: ['兩刀起手，第三刀放出火月牙往前飛 5H', '火月牙變兩道', '火月牙飛到底會折返', '火月牙的終點留下燃燒帶', '火月牙在終點爆炸'],
      skill_haousan: ['蓄力後兩記重斬逼近，再劈地，地面裂開爆炸', '蓄力時霸體', '裂開的地面燃燒 2 秒', '裂痕往前延伸，接連炸三次', '接連炸五次，最後一次特別大'],
      skill_zantetsu: ['無視 50% 防禦的一刀', '無視防禦 80%', '對頭目傷害 +50%', '敵人身上的斬痕稍後裂開三次', '再補一刀把敵人斬飛'],
      special_backline: ['轉身後反斬兩刀', '之後 2 秒受傷 −20%', '第一刀命中暈眩 1 秒', '追加第三刀劈地', '劈地變成地面爆炸'],
      special_break: ['蓄力重斬再補一記下劈，降低敵人防禦 20%', '降防 30%', '持續時間加倍', '被破守的敵人持續燃燒', '下劈引起地面爆炸'],
      special_drawline: ['在地上劃出一道裂痕，一秒後整條引爆', '裂痕長度 +50%', '引爆兩次', '引爆後留下燃燒帶', '引爆三次'],
      special_leave: ['兩刀後往後跳開', '後跳距離 +40%', '落地時塵浪擊退', '原本站的位置延遲爆炸', '落地後再衝上前補一刀'] },
    naginata: {
      skill_arashi: ['原地連續旋轉掃擊，葉片繞身（可以邊轉邊走）', '持續 +1 秒', '結束時捲起一道龍捲 2 秒', '旋轉時把周圍敵人往內吸', '龍捲變大，消散時炸開'],
      skill_chidori: ['疾風突進穿過敵人，停下時回身一掃', '折返再突進一次', '路上留下風道持續傷害', '終點捲起龍捲', '突進三次，終點的龍捲變大'],
      skill_enbu: ['五段舞斬，邊斬邊往前', '段數 +2', '每段命中回 1 氣力', '段數再 +2', '收尾迴旋一圈把敵人挑起'],
      skill_senpu: ['聚風後一記大橫掃把敵人吹開', '範圍 +30%', '吹開後再吸回身前', '反向再掃一次', '最後迴旋一圈把敵人挑起'],
      special_current: ['往旁邊滑開，再迴旋一斬', '移動距離 +50%', '滑開時無敵', '起點也留下一圈迴旋斬', '再迴旋一圈把敵人挑起'],
      special_double: ['前後同時各一斬', '追加交叉的第二段', '追加迴旋爆發', '前後再各掃一次', '收尾再迴旋一圈把敵人挑起'],
      special_openpath: ['一掃把前方敵人吹開', '吹開距離 +50%', '之後 3 秒移速 +30%', '踏前再掃一次', '踏前第三掃，把敵人吹得更遠'],
      special_upright: ['放出龍捲繞著敵人轉並持續攻擊，最後把敵人捲起摔落、昏迷 1 秒', '龍捲多繞半秒', '昏迷 2 秒', '龍捲變兩道', '龍捲變三道，昏迷 3 秒'] } };
  const RUNS = { katana: KAT, nodachi: NOD, naginata: NAG }, CTS = { katana: KAT_CT, nodachi: {}, naginata: NAG_CT };
  const ART = { katana: ['p_shion_fx', 'b_kappa'], nodachi: ['b_osakabe', 'b_oni', 'b_ezo'], naginata: ['b_susanoo', 'b_ezo'] }, NOGUARD = { naginata: { special_upright: 1 } }; let loading = 0;
  function texts(w) { const L = G.WPN.LIST && G.WPN.LIST.find(x => x.id === w), T = TXT[w]; if (!L || !T) return; for (const s of L.sk) { const v = T[s.id]; if (!v) continue; if (s.d !== v[0] || s.d7 !== v[3]) { s.d = v[0]; s.d3 = v[1]; s.d5 = v[2]; s.d7 = v[3]; s.d10 = v[4]; } const cd = s.t === '特技' ? 9 : 5; if (s.cd !== cd) s.cd = cd; } }
  function patch() { const M = G.MV2; if (!M || !M.U) return; for (const w in RUNS) { const U = M.U[w]; if (!U) continue; for (const k in RUNS[w]) { const d = U[k]; if (!d) continue; if (d.run !== RUNS[w][k]) d.run = RUNS[w][k]; const ct = CTS[w][k]; if (ct && d.counter !== ct) d.counter = ct; if (NOGUARD[w] && NOGUARD[w][k]) { if (d.counter) d.counter = null; if (d.kind !== 'skill') d.kind = 'skill'; if (d.cat === '架') d.cat = ''; } } } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); try { patch(); } catch (x) { console.warn('wskill', x); } };
  setInterval(() => { try { if (G.mode !== 'play' || !G.WPN || !G.WPN.curId || !G.ANIM) return; const w = G.WPN.curId(), L = ART[w]; for (const q in TXT) texts(q); if (!L) return; for (const k of L) { const u = G.ANIM.get(k); if (u) u.lu = performance.now(); }
      if (loading || L.every(k => G.ANIM.get(k))) return; loading = 1; (async () => { for (const k of L) if (!G.ANIM.get(k)) { try { await G.ANIM.load(k); } catch (e) { } } loading = 0; })(); } catch (e) { } }, 2000);
  return { RUNS, W, F, N, pts, ready: w => (ART[w] || []).every(k => G.ANIM && G.ANIM.get(k)) };
})();
