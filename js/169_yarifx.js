/* ==========================================================================
 * 神諭之地 重製版 — 169_yarifx.js
 * Version : r3.228.0  (2026-11-28)　r3.228.0：新增。長槍四個技、四個特技重新設計（試作頁第三版定案＋不動構改成引雷）
 * 內容    : 長槍的技／特技／招式特效與八招的打法：
 *           ・電光（tb）：根粗尖細，折點間距不等；每道長度、粗細、分岔數都不同，分岔上可再分岔。
 *           ・落雷（strike）：地上先亮預兆圈，再用現成的手繪落雷（b_izanami/izanami_thunder）劈下，
 *             每道高度、寬度、左右向不同；落點用 b_susanoo/fx_lightning_hit＋貼地爬行的電光。素材還沒載好時改用程式畫的電光，不會看不到。
 *           ・炸開（spark）：b_raiju/raijuo_electric_burst＋長短粗細不一的電光。素材一律染紫（205,170,255）。
 *           ・八招（RUN）：每招分「聚電 → 主攻 → 停頓 → 收招」，時間單位 1/60 秒；Lv1／3／5／7／10 各有加強。
 *             一番槍＝突進帶著撞到的敵人一起推、電住 → 連刺 → 四周落雷；槍花繚亂；挑月；針山＝扇形雷痕＋連續落雷；
 *             回身刺＝迴旋斬 → 轉身 → 長刺擊飛；不動構＝前方引一道落雷把敵人吸過去，兩秒後雷暴；一文字；車返。
 *           ・圖集載入：b_izanami → b_raiju → b_susanoo 依序載入（同時載三包時第一包會載不進來），拿長槍時才載，並持續標記使用中避免被回收。
 * 依賴    : 111_katana_fx（G.KF.K／add）、88_rune（G.AFX）、12_anim（G.ANIM）、77_moves（招式腳本的 c）。由 116_yari_fx 的入口與 patch() 轉進來。
 * ========================================================================== */
'use strict';
G.YFX = (function () {
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), K = y => G.KF.K(y), add = function () { return G.KF.add.apply(G.KF, arguments); };
  const C = '198,182,236', HI = '246,238,255', AC = '150,112,236', TINT = '205,170,255';
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2.4), hs = (s, i) => { const t = Math.sin(s * 12.9898 + i * 78.233) * 43758.5453; return t - Math.floor(t); };
  const AF = () => G.AFX, alive = e => e && e.st !== 'dead', shake = v => { G.SC.shake = Math.max(G.SC.shake || 0, v); };
  /* 電光：根部粗、尖端細；折點間距不等；分岔的長度與粗細各自不同，分岔上還可能再分岔 */
  function tb(ctx, x0, y0, x1, y1, seed, a, w, amp, br, dep) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, n = Math.max(3, Math.round(L / (10 + hs(seed, 1) * 10))), P = []; if (amp === undefined) amp = L * 0.12;
    for (let i = 0; i <= n; i++) { const q = Math.min(1, i / n + (i > 0 && i < n ? (hs(seed, i + 50) - 0.5) * 0.55 / n : 0)), o = i === 0 ? 0 : (hs(seed, i) - 0.5) * 2 * amp * (i === n ? 0.4 : 1); P.push([x0 + dx * q + nx * o, y0 + dy * q + ny * o, q]); }
    const wd = q => w * (1 - 0.88 * Math.pow(q, 0.75));
    for (const [m, col] of [[2.9, 'rgba(126,86,236,' + a * 0.2 + ')'], [1.5, 'rgba(' + AC + ',' + a * 0.9 + ')'], [0.55, 'rgba(' + HI + ',' + a + ')']]) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= n; i++) { const p = P[i], h = Math.max(0.3, wd(p[2]) * m * 0.5); i ? ctx.lineTo(p[0] + nx * h, p[1] + ny * h) : ctx.moveTo(p[0] + nx * h, p[1] + ny * h); } for (let i = n; i >= 0; i--) { const p = P[i], h = Math.max(0.3, wd(p[2]) * m * 0.5); ctx.lineTo(p[0] - nx * h, p[1] - ny * h); } ctx.closePath(); ctx.fill(); }
    if (dep > 0) for (let b = 0; b < br; b++) { const j = 1 + Math.floor(hs(seed, 70 + b) * (n - 1)), p = P[j], q = p[2], sg = hs(seed, 75 + b) < 0.5 ? 1 : -1, ang = Math.atan2(uy, ux) + sg * (0.35 + hs(seed, 80 + b) * 0.85), bl = L * (0.14 + 0.5 * hs(seed, 90 + b)) * (1 - q * 0.55), bw = wd(q) * (0.3 + 0.45 * hs(seed, 95 + b));
        tb(ctx, p[0], p[1], p[0] + Math.cos(ang) * bl, p[1] + Math.sin(ang) * bl, seed + b * 17.3 + 1, a * 0.9, bw, bl * 0.18, hs(seed, 99 + b) < 0.45 ? 1 : 0, dep - 1); } }
  /* 炸開：手繪電爆＋幾道長短粗細都不同的電光 */
  function spark(x, y, k, sc, d0, o) { sc = sc || 1; d0 = d0 || 0; o = o || {}; const U = k / 90, n = o.n || 5 + Math.floor(Math.random() * 4), B = [], D = [];
    for (let i = 0; i < n; i++) B.push({ dir: i / n * TAU + rnd(-0.4, 0.4), len: k * sc * (Math.random() < 0.3 ? rnd(0.95, 1.4) : rnd(0.3, 0.8)), w: U * rnd(1.6, 6.5) * Math.sqrt(sc), life: rnd(7, 14), t0: rnd(0, 4), br: Math.floor(rnd(0, 3.4)), sd: Math.random() * 1e3 });
    for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), sp = rnd(1.2, 3.4); D.push({ vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 0.6, s: rnd(1.2, 2.6) * U, c: Math.random() < 0.5 ? HI : AC }); }
    if (!o.noArt) AF().play('b_raiju', 'raijuo_electric_burst', { x, y, size: k * 1.7 * sc, tpf: 3, delay: d0, tint: TINT });
    add(d0 + 20, 'o', (ctx, u) => { const v = u - d0; if (v < 0) return; if (v < 1 && sc >= 0.8) shake(3 * sc);
      if (v < 10) { const q = v / 10, g = ctx.createRadialGradient(x, y, 0, x, y, k * 0.8 * sc); g.addColorStop(0, 'rgba(252,246,255,' + 0.7 * (1 - q) + ')'); g.addColorStop(0.5, 'rgba(170,130,245,' + 0.3 * (1 - q) + ')'); g.addColorStop(1, 'rgba(120,84,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, k * 0.8 * sc, 0, TAU); ctx.fill(); }
      for (const b of B) { const w = v - b.t0; if (w < 0 || w > b.life) continue; const gl = b.len * (0.45 + 0.55 * Math.min(1, w / 3)); tb(ctx, x, y, x + Math.cos(b.dir) * gl, y + Math.sin(b.dir) * gl * 0.8, b.sd + Math.floor(w / 3) * 5.7, 1 - Math.pow(w / b.life, 2), b.w, gl * 0.14, b.br, 2); }
      if (v < 16) for (const d of D) { ctx.fillStyle = 'rgba(' + d.c + ',' + (1 - v / 16) + ')'; ctx.fillRect(x + d.vx * v * 1.3, y + d.vy * v + 0.05 * v * v, d.s * 2, d.s); } }); }
  /* 落雷：地上先亮預兆圈，再用手繪落雷劈下；每道高度、粗細、左右向都不同；落點有電爆和貼地爬行的電光 */
  function strike(x, y, k, o) { o = o || {}; const sc = o.sc || 1, d0 = o.d0 || 0, warn = o.warn === undefined ? 10 : o.warn, U = k / 90, hgt = k * rnd(3.3, 5.4) * sc, wide = rnd(0.8, 1.35), flip = Math.random() < 0.5, sd = Math.random() * 1e3, tH = d0 + warn, G0 = [];
    for (let i = 0, n = 3 + Math.floor(Math.random() * 4); i < n; i++) G0.push({ dir: rnd(0, TAU), len: k * sc * rnd(0.35, 1.25), w: U * rnd(1.4, 5) * sc, br: Math.floor(rnd(0, 3)), sd: Math.random() * 1e3, life: rnd(10, 20) });
    if (warn > 0) AF().play('b_susanoo', 'fx_lightning_warning', { x, y, size: k * 1.5 * sc, by: 'w', tpf: Math.max(2, Math.round(warn / 4)), delay: d0, tint: TINT, layer: 'u' });
    const art = AF().ok('b_izanami', 'izanami_thunder'); if (!art) add(tH + 16, 'o', (ctx, u) => { const v = u - tH; if (v < 0) return; tb(ctx, x + (flip ? -0.5 : 0.5) * k, y - hgt, x, y, sd + (v < 5 ? 0 : 9.1), v < 3 ? 1 : v < 5 ? 0.5 : Math.max(0, 1 - (v - 5) / 11), U * 13 * sc * wide, k * 0.34, 4, 2); });
    if (art) add(tH + 4, 'o', (ctx, u) => { const v = u - tH; if (v < 0) return; ctx.save(); ctx.translate(x, y + k * 0.08); ctx.scale(wide, 1); AF().fr('b_izanami', 'izanami_thunder', Math.min(3, Math.floor(v / 4)), 0, 0, { size: hgt, by: 'h', anc: 'b', flip }); ctx.restore(); });
    AF().play('b_izanami', 'izanami_thunder', { x, y: y + k * 0.08, size: hgt, by: 'h', anc: 'b', tpf: 4, delay: tH, flip, fr: [1, 3] });
    if (sc >= 1.5) AF().play('b_raiju', 'raijuo_bolt', { x: x + rnd(-0.3, 0.3) * k, y: y + k * 0.05, size: hgt * 1.1, by: 'h', anc: 'b', tpf: 3, delay: tH + 2, flip: !flip, tint: TINT });
    AF().play('b_susanoo', 'fx_lightning_hit', { x, y: y + k * 0.12, size: k * 1.9 * sc, by: 'w', anc: 'b', tpf: 4, delay: tH + 3, tint: TINT });
    add(tH + 26, 'o', (ctx, u) => { const v = u - tH - 3; if (v < 0) return; if (v < 1) shake(4 * sc); ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4);
      for (const b of G0) { if (v > b.life) continue; const gl = b.len * (0.4 + 0.6 * Math.min(1, v / 4)); tb(ctx, 0, 0, Math.cos(b.dir) * gl, Math.sin(b.dir) * gl, b.sd + Math.floor(v / 3) * 4.3, 1 - Math.pow(v / b.life, 2), b.w * 2, gl * 0.16, b.br, 2); } ctx.restore(); });
    return tH + 4; }
  const cloud = (x, y, k, life, d0) => AF().play('b_raiju', 'raijuo_storm_cloud', { x, y: y - 4.4 * k, size: k * 4.2, by: 'w', tpf: 6, loop: Math.max(1, Math.round(life / 36)), fin: 12, fade: 16, delay: d0 || 0, tint: '185,165,235' });
  /* 起手：電光從四周往槍上聚 */
  function gather(x, y, k, life, sc) { sc = sc || 1; const U = k / 90, B = []; for (let i = 0; i < Math.round(life * 0.7); i++) B.push({ t0: rnd(0, life - 5), dir: rnd(0, TAU), r: k * sc * rnd(0.5, 1.2), w: U * rnd(1.2, 4), sd: Math.random() * 1e3, br: Math.floor(rnd(0, 2.3)) });
    add(life + 4, 'o', (ctx, u) => { const q = Math.min(1, u / life), g = ctx.createRadialGradient(x, y, 0, x, y, k * (0.25 + 0.3 * q) * sc); g.addColorStop(0, 'rgba(240,230,255,' + 0.55 * q * (u > life ? 1 - (u - life) / 4 : 1) + ')'); g.addColorStop(1, 'rgba(130,90,235,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, k * 0.55 * sc, 0, TAU); ctx.fill();
      for (const b of B) { const v = u - b.t0; if (v < 0 || v > 6) continue; tb(ctx, x, y, x + Math.cos(b.dir) * b.r, y + Math.sin(b.dir) * b.r * 0.75, b.sd + Math.floor(v / 3) * 3.1, 1 - v / 6, b.w, b.r * 0.16, b.br, 1); } }); }
  const scorch = (x0, y, x1, k, life, seed) => add(life, 'u', (ctx, u) => { const a = Math.min(1, (life - u) / 12) * 0.55; ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.4); tb(ctx, x0, 0, x1, 0, seed, a, k / 90 * 7, k * 0.14, 3, 2); ctx.restore(); });
  const glint = (ctx, x, y, s) => { ctx.fillStyle = 'rgb(' + HI + ')'; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x, y, x, y - s * 0.5); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s * 0.5); ctx.quadraticCurveTo(x, y, x - s, y); ctx.fill(); };
  /* 突刺：細光＋寒光；槍尖的電光每道大小不同；重刺沿槍身多一道粗電光，槍尖炸開，地上留電痕 */
  function thrust(o) { const f = o.face || o.f || 1, y = o.y, k = K(y), U = k / 90, big = o.big || 1, reach = (o.len || 1.8) * k * 0.95, hx = o.x + f * 0.1 * k, hy = y - (o.cy || 0.55) * k, ang = o.ang || 0, heavy = big >= 1.1 || !!o.shock, ca = Math.cos(ang), sa = Math.sin(ang), SB = Math.random() * 1e3, life = heavy ? 24 : 14;
    const BL = []; for (let i = 0, n = heavy ? 6 : 2 + Math.floor(Math.random() * 3); i < n; i++) BL.push({ t0: 1 + rnd(0, 3), len: k * big * (Math.random() < 0.3 ? rnd(0.5, 0.8) : rnd(0.18, 0.42)), w: U * rnd(1.2, 4.5), sd: Math.random() * 1e3, life: rnd(5, 10), dir: rnd(0, TAU), br: Math.floor(rnd(0, 2.5)) });
    if (heavy) { spark(hx + f * reach * ca, hy + reach * sa, k, 0.8 * big, 2); scorch(hx + f * reach * 0.3, y, hx + f * reach * 1.05, k, 50, SB); }
    add(life, 'o', (ctx, u) => { const ex = ease(u / 2), tx = hx + f * reach * ex * ca, ty = hy + reach * ex * sa, a = u < 5 ? 1 : Math.max(0, 1 - (u - 5) / (heavy ? 12 : 7)), w = 0.05 * k * big;
      if (a > 0) { const L = 1.3 * k * big, bx = tx - f * L * ca, by = ty - L * sa, g = ctx.createLinearGradient(bx, by, tx, ty); g.addColorStop(0, 'rgba(' + AC + ',0)'); g.addColorStop(0.6, 'rgba(' + C + ',' + 0.7 * a + ')'); g.addColorStop(1, 'rgba(' + HI + ',' + 0.95 * a + ')'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx - f * 0.2 * k * ca + sa * w, ty - 0.2 * k * sa - ca * w * f); ctx.lineTo(tx, ty); ctx.lineTo(tx - f * 0.2 * k * ca - sa * w, ty - 0.2 * k * sa + ca * w * f); ctx.closePath(); ctx.fill();
        if (u >= 1 && u < 7) glint(ctx, tx, ty, k * 0.26 * big * (1 - Math.abs(u - 3.5) / 4)); }
      if (heavy && u >= 1 && u < 10) tb(ctx, hx + f * reach * 0.05 * ca, hy + reach * 0.05 * sa, hx + f * reach * ca, hy + reach * sa, SB + Math.floor(u / 3) * 3.1, 1 - (u - 1) / 9, U * 7 * big, k * 0.11, 3, 2);
      for (const b of BL) { const v = u - b.t0; if (v < 0 || v > b.life) continue; tb(ctx, tx, ty, tx + Math.cos(b.dir) * b.len, ty + Math.sin(b.dir) * b.len * 0.8, b.sd + Math.floor(v / 3) * 7.3, 1 - v / b.life, b.w, b.len * 0.18, b.br, 1); } }); }
  /* 槍擺：槍尖那一段的細弧，弧上甩出長短不一的電光 */
  function swing(o) { const f = o.f || 1, y = o.y, k = K(y), U = k / 90, dur = Math.max(3, o.dur || 4), R = (o.R || 1.7) * k, sq = o.sq || 1, a0 = o.a0, a1 = o.a1, span = a1 - a0, tl = Math.min(Math.abs(span), 2.3) * Math.sign(span), big = o.big || 1, sd = Math.random() * 1e3, n = Math.abs(span) > 4 ? 11 : 6, BL = [];
    for (let i = 0; i < n; i++) BL.push({ q: (i + rnd(0.1, 0.9)) / n, len: Math.random() < 0.3 ? rnd(0.5, 0.85) : rnd(0.16, 0.4), w: U * rnd(1.3, 5) * big, br: Math.floor(rnd(0, 2.6)), sd: Math.random() * 1e3, lean: rnd(0.1, 0.5) });
    add(dur + 18, 'o', (ctx, u) => { const cx = o.x + f * 0.1 * k, cy = y - (o.cy || 0.55) * k, P = (a, r) => [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * sq];
      const hq = ease(u / dur), h = a0 + span * hq, fade = u > dur ? Math.max(0, 1 - (u - dur) / 11) : 1, tt = u > dur ? h - tl * fade : h - tl * Math.min(1, hq * 1.5), t = span > 0 ? Math.max(a0, tt) : Math.min(a0, tt), N = 20; if (fade <= 0 || Math.abs(h - t) < 0.03) return;
      for (let i = 0; i < N; i++) { const q0 = i / N, q1 = (i + 1) / N, b0 = t + (h - t) * q0, b1 = t + (h - t) * q1, o0 = P(b0, R), o1 = P(b1, R), i0 = P(b0, R * 0.84), i1 = P(b1, R * 0.84), gi = P((b0 + b1) / 2, R * 0.84), go = P((b0 + b1) / 2, R), al = 0.85 * fade * (0.06 + 0.94 * Math.pow(q1, 1.5));
        const g = ctx.createLinearGradient(gi[0], gi[1], go[0], go[1]); g.addColorStop(0, 'rgba(' + C + ',0)'); g.addColorStop(1, 'rgba(' + C + ',' + al + ')'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.lineTo(i1[0], i1[1]); ctx.lineTo(i0[0], i0[1]); ctx.closePath(); ctx.fill(); }
      for (const b of BL) { const ba = a0 + span * b.q; if ((span > 0 ? ba > h : ba < h)) continue; const p = P(ba, R * 0.95), p2 = P(ba + b.lean * Math.sign(span), R * (0.95 + b.len)); tb(ctx, p[0], p[1], p2[0], p2[1], b.sd + Math.floor(u / 3) * 5, fade * 0.95, b.w, k * b.len * 0.2, b.br, 1); }
      const hp = P(h, R); if (u <= dur + 2) glint(ctx, hp[0], hp[1], k * 0.16 * big); }); }
  /* 突進：身後一條前粗後細的紫電＋地上電痕 */
  function held(a0, life, o) { const k = K(G.H.y), U = k / 90, path = [], sd = Math.random() * 1e3, y0 = G.H.y; let end = 0;
    add(life + 50, 'o', (ctx, u) => { const on = G.H.act === a0 && u <= life; if (on) path.push([G.H.x, G.H.y - 0.55 * k]); else if (!end) end = u; if (path.length < 2) return; const a = on ? 1 : Math.max(0, 1 - (u - end) / 14);
      if (a > 0) { const p0 = path[Math.max(0, path.length - 16)], p1 = path[path.length - 1]; tb(ctx, p1[0] + G.H.face * 1.2 * k * (on ? 1 : 0), p1[1], p0[0], p0[1], sd + Math.floor(u / 3) * 3.3, a, U * 8, k * 0.12, 4, 2); if (on) glint(ctx, p1[0] + G.H.face * 1.25 * k, p1[1], k * 0.22); } });
    add(life + 60, 'u', (ctx, u) => { if (path.length < 2) return; const a = Math.min(1, (life + 60 - u) / 14) * 0.5; ctx.save(); ctx.translate(0, y0); ctx.scale(1, 0.4); tb(ctx, path[path.length - 1][0], 0, path[0][0], 0, sd + 7, a, U * 8, k * 0.16, 4, 2); ctx.restore(); }); }
  function rise(x, y, d, s) { strike(x, y, K(y), { d0: d, sc: 0.6 * (s || 1), warn: 4 }); }
  /* 不動構：身前一道紫電守線，立在線上的電光高矮粗細不同 */
  function guard(a0, life, o) { const k = K(G.H.y), U = k / 90, sd = Math.random() * 1e3;
    add(life, 'o', (ctx, u) => { if (G.H.act !== a0) return; const f = G.H.face, x = G.H.x + f * 1.5 * k, y = G.H.y, fl = Math.floor(u / 4);
      ctx.save(); ctx.translate(x, y); ctx.scale(0.5, 1); tb(ctx, 0, -0.5 * k, 0, 0.42 * k, sd + fl * 2.1, 0.6, U * 5, k * 0.08, 2, 1); ctx.restore();
      for (let i = 0; i < 4; i++) { const yy = y + (i - 1.5) * 0.24 * k, xx = x + (i - 1.5) * 0.07 * k * f; if (hs(sd + fl, i) < 0.8) tb(ctx, xx, yy, xx + (hs(sd + fl, i + 4) - 0.5) * 0.3 * k, yy - (0.45 + 1.0 * hs(sd + fl, i + 8)) * k, sd + fl * 3.7 + i * 11, 0.9, U * (1.5 + 5 * hs(sd + fl, i + 12)), k * 0.08, Math.floor(hs(sd + fl, i + 16) * 3), 2); } }); }
  const pierce = (x, y, f, ang, big) => spark(x, y, K(y), 0.45 * (big || 1), 0, { noArt: 1, n: 4 });
  const say = (t, kk) => G.NUMS.push({ x: G.H.x, y: G.H.y - 1.25 * kk, v: t, t: 0, pop: G.t, txt: 1 });
  /* ---------- 八招。時間單位＝1/60 秒；每招分 起手 → 主攻 → 停頓 → 收招 ---------- */
  const LV = c => c.a.mvx.lv || 1;
  const RUN = {
    /* 一番槍：聚電 → 電光突進撞停 → 連刺 → 四周落雷。Lv3 多一刺一雷；Lv5 五刺六雷；Lv7 外圈再三雷；Lv10 雷雲＋中央巨雷 */
    skill_ryusei(c, t) { const lv = LV(c), kk = K(c.y), m = c.a.mvx, n = 3 + (lv >= 3) + (lv >= 5), cnt = lv >= 5 ? 6 : lv >= 3 ? 4 : 3, t1 = 30, ts = t1 + n * 7 + 10, tot = cnt + (lv >= 7 ? 3 : 0);
      if (t === 1) { c.a.T = ts + tot * 5 + 34 + (lv >= 10 ? 30 : 0); m.sk = []; gather(c.x + c.f * 0.3 * kk, c.y - 0.55 * kk, kk, 12, 1); }
      if (t === 13) held(c.a, 9, {});
      if (t >= 13 && t <= 20) { const hx0 = G.H.x; c.move((lv >= 3 ? 3.0 : 2.4) / 8, 0); const mv = G.H.x - hx0; for (const e of m.sk) if (alive(e) && !e.boss && !e.bb && G.SC.walkable(e.x + mv, e.y)) e.x += mv;   /* 撞到的敵人被槍頂著一起往前推 */ c.inv(4); if (t % 2) c.ghost(8); c.hit({ shape: 'circle', r: 0.8, m: 0.6, lv: 'mid', kind: 'pierce', stun: 70, skip: m.sk }).forEach(e => { m.sk.push(e); spark(e.x, e.y - 0.5 * kk, kk, 0.9, 0); }); }
      if (t > 20 && t < t1 && t % 4 === 0) for (const e of m.sk) if (alive(e)) spark(e.x + rnd(-0.2, 0.2) * kk, e.y - rnd(0.2, 0.8) * kk, kk, 0.35, 0, { noArt: 1, n: 3 });
      for (let i = 0; i < n; i++) if (t === t1 + i * 7) { const last = i === n - 1; c.thrust({ len: 2.0, w: 0.22, cy: 0.55 + Math.cos(i * 1.9) * 0.1, ang: Math.sin(i * 1.9) * 0.14, ext: 2, life: 8, hf: 1, m: 0.5, lv: last ? 'heavy' : 'light', big: last ? 1.3 : 1.0, shock: last ? 1 : 0 }); }
      if (t === ts) { const x0 = G.H.x, y0 = G.H.y; if (lv >= 10) cloud(x0, y0, kk, tot * 5 + 50);
        for (let i = 0; i < tot; i++) { const out = i >= cnt, a = (out ? (i - cnt) / 3 : i / cnt) * TAU + (out ? 0.9 : 0.3), R = (out ? 2.9 : 1.7) * kk, x = x0 + Math.cos(a) * R, y = y0 + Math.sin(a) * R * 0.45, th = strike(x, y, kk, { d0: i * 5, sc: out ? 1.2 : rnd(0.85, 1.15) }); c.later(th, () => c.hit({ shape: 'circle', x, y, r: 0.9, m: 0.35, lv: 'heavy', kind: 'pierce', launch: 30 })); }
        if (lv >= 10) { const x = x0 + c.f * 1.3 * kk, th = strike(x, y0, kk, { d0: tot * 5 + 8, sc: 1.9, warn: 14 }); c.later(th, () => { shake(9); c.hit({ shape: 'circle', x, y: y0, r: 1.8, m: 1.2, lv: 'heavy', kind: 'pierce', launch: 70 }); }); } } },
    /* 槍花繚亂：三下槍擺 → 停 → 連刺 → 停 → 收尾炸開。Lv3 連刺 6→10；Lv5 最後一刺穿透；Lv7 連刺途中落小雷；Lv10 收尾改成巨雷 */
    skill_senso(c, t) { const lv = LV(c), kk = K(c.y), n = 6 + (lv >= 3 ? 4 : 0), t1 = 28, te = t1 + n * 4 + 8;
      if (t === 1) { c.a.T = te + 22; gather(c.x + c.f * 0.4 * kk, c.y - 0.55 * kk, kk, 5, 0.7); }
      [[5, -0.6, 0.45], [12, 0.5, -0.55], [19, -0.6, 0.5]].forEach(([tt, a0, a1]) => { if (t === tt) swing({ x: c.x, y: c.y, f: c.f, a0, a1, dur: 5, R: 1.7, cy: 0.55 }); if (t === tt + 2) c.hit({ shape: 'sector', r: 2.0, arc: 1.3, m: 0.35, lv: 'light', kind: 'cut' }); });
      for (let i = 0; i < n; i++) if (t === t1 + i * 4) { const last = i === n - 1, far = last && lv >= 5; c.thrust({ len: far ? 3.6 : 1.9, w: 0.22, ang: last ? 0 : Math.sin(i * 1.9) * 0.16, cy: last ? 0.55 : 0.55 + Math.cos(i * 1.9) * 0.08, hold: last ? 4 : 0, life: last ? 12 : 6, hf: 1, m: last ? 1.0 : 0.3, lv: last ? 'heavy' : 'light', big: last ? 1.3 : 0.9, shock: last ? 1 : 0 });
          if (lv >= 7 && i % 3 === 1) { const x = c.x + c.f * rnd(1.3, 2.2) * kk, y = c.y + rnd(-0.3, 0.3) * kk, th = strike(x, y, kk, { sc: 0.7, warn: 4 }); c.later(th, () => c.hit({ shape: 'circle', x, y, r: 0.7, m: 0.2, lv: 'light', kind: 'pierce' })); } }
      if (t === te) { const x = c.x + c.f * 2.0 * kk; if (lv >= 10) { const th = strike(x, c.y, kk, { sc: 1.7, warn: 8 }); c.later(th, () => c.hit({ shape: 'circle', x, y: c.y, r: 1.5, m: 1.0, lv: 'heavy', kind: 'pierce', launch: 50 })); } else spark(x, c.y - 0.55 * kk, kk, 1.2, 0); } },
    /* 挑月：聚電 → 上挑把敵人挑起 → 停 → 落雷劈在被挑起的敵人身上炸開。Lv3 追一記下刺；Lv5 再追前刺擊退；Lv7 兩側各多一雷；Lv10 落地處再劈巨雷 */
    skill_shoryu(c, t) { const lv = LV(c), kk = K(c.y), x = c.x + c.f * 1.5 * kk;
      if (t === 1) { c.a.T = 50 + (lv >= 3 ? 14 : 0) + (lv >= 5 ? 12 : 0) + (lv >= 10 ? 24 : 0); gather(c.x + c.f * 0.6 * kk, c.y - 0.2 * kk, kk, 11, 0.9); }
      if (t === 12) swing({ x: c.x, y: c.y, f: c.f, a0: 0.95, a1: -1.35, R: 1.85, cy: 0.45, dur: 6, big: 1.4 });
      if (t === 15) { c.hit({ shape: 'sector', r: 2.1, arc: 1.6, m: 1.2, launch: 60, stun: 60, lv: 'heavy', kind: 'cut' }); spark(x, c.y - 0.6 * kk, kk, 0.8, 0); }
      if (t === 20) { const th = strike(x, c.y, kk, { sc: lv >= 7 ? 1.5 : 1.2, warn: 8 }); c.later(th, () => { c.hit({ shape: 'circle', x, y: c.y, r: 1.3, m: 0.8, lv: 'heavy', kind: 'pierce', launch: 40 }); spark(x, c.y - 1.5 * kk, kk, 1.3, 0); });
        if (lv >= 7) for (const s of [-1, 1]) { const y = c.y + s * 0.55 * kk, xx = x + 0.5 * kk * c.f, t2 = strike(xx, y, kk, { d0: 6 + (s > 0 ? 4 : 0), sc: 0.85, warn: 8 }); c.later(t2, () => c.hit({ shape: 'circle', x: xx, y, r: 0.9, m: 0.3, lv: 'mid', kind: 'pierce' })); } }
      if (lv >= 3 && t === 46) c.thrust({ len: 2.0, ang: -0.5, m: 0.9, lv: 'heavy', big: 1.1, hf: 1, life: 10 });
      if (lv >= 5 && t === 58) c.thrust({ len: 2.2, ang: 0.1, m: 1.0, lv: 'heavy', kb: 1.5, big: 1.25, shock: 1, hf: 1, life: 12 });
      if (lv >= 10 && t === 66) { const xx = c.x + c.f * 2.4 * kk; cloud(xx, c.y, kk, 40); const th = strike(xx, c.y, kk, { sc: 1.9, warn: 12 }); c.later(th, () => { shake(9); c.hit({ shape: 'circle', x: xx, y: c.y, r: 1.7, m: 1.2, lv: 'heavy', kind: 'pierce', launch: 60 }); }); } },
    /* 針山：槍插地 → 扇形雷光痕往前蔓延 → 落雷一道一道接著劈。Lv3 扇形變寬、6 道；Lv5 8 道；Lv7 雷痕留更久並緩速；Lv10 11 道＋扇心巨雷 */
    skill_sorin(c, t) { const lv = LV(c), kk = K(c.y), U = kk / 90; if (t === 1) { c.a.T = 40; gather(c.x + c.f * 0.7 * kk, c.y - 0.1 * kk, kk, 9, 0.8); } if (t === 10) c.thrust({ len: 1.2, ang: 0.75, m: 0.3, lv: 'mid', big: 1.2, shock: 1, hf: 1, life: 10 }); if (t !== 12) return;
      const x0 = c.x + c.f * 0.6 * kk, y0 = c.y, f = c.f, R = 3.4 * kk, half = lv >= 3 ? 0.8 : 0.6, N = lv >= 10 ? 11 : lv >= 5 ? 8 : lv >= 3 ? 6 : 5, gap = 8, life = 16 + N * gap + (lv >= 7 ? 60 : 24), sd = Math.random() * 1e3, V = [];
      for (let i = 0, nv = lv >= 3 ? 7 : 5; i < nv; i++) V.push({ an: -half * 0.92 + half * 1.84 * i / (nv - 1) + rnd(-0.06, 0.06), len: rnd(0.55, 1.0), w: U * rnd(4, 12), br: 1 + Math.floor(rnd(0, 3.5)), sd: Math.random() * 1e3, ph: Math.floor(rnd(0, 3)) });
      add(life, 'u', (ctx, u) => { const gr = ease(u / 14), a = Math.min(1, (life - u) / 16), fl = Math.floor(u / 4); ctx.save(); ctx.translate(x0, y0); ctx.scale(1, 0.4);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * gr); g.addColorStop(0, 'rgba(160,120,240,' + 0.3 * a + ')'); g.addColorStop(0.8, 'rgba(120,84,230,' + 0.14 * a + ')'); g.addColorStop(1, 'rgba(120,84,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 0; i <= 12; i++) { const an = -half + 2 * half * i / 12; ctx.lineTo(Math.cos(an) * R * gr * f, Math.sin(an) * R * gr); } ctx.closePath(); ctx.fill();
        for (const v of V) tb(ctx, 0, 0, Math.cos(v.an) * R * v.len * gr * f, Math.sin(v.an) * R * v.len * gr, v.sd + ((fl + v.ph) % 3 === 0 ? fl : 0) * 1.7, a * ((fl + v.ph) % 3 === 0 ? 1 : 0.6), v.w, kk * 0.3, v.br, 2); ctx.restore(); });
      if (lv >= 7) G.E.forEach(e => { if (alive(e) && (e.x - x0) * f > 0 && Math.hypot(e.x - x0, (e.y - y0) * 2) < R) { e.db = e.db || {}; e.db.slow = 40; e.slowT = life; } });
      for (let n = 0; n < N; n++) c.later(16 + n * gap, () => { const L = G.E.filter(e => alive(e) && (e.x - x0) * f > 0 && Math.hypot(e.x - x0, (e.y - y0) * 2) < R * 1.05); const e = L.length && Math.random() < 0.75 ? L[Math.floor(Math.random() * L.length)] : null, an = rnd(-half, half) * 0.8, r = rnd(0.9, 3.1) * kk, x = e ? e.x + rnd(-0.2, 0.2) * kk : x0 + f * Math.cos(an) * r, y = e ? e.y : y0 + Math.sin(an) * r * 0.45;
        const th = strike(x, y, kk, { sc: rnd(0.75, 1.25), warn: 6 }); c.later(th, () => c.hit({ shape: 'circle', x, y, r: 0.75, m: 0.24, lv: n % 3 === 2 ? 'heavy' : 'mid', kind: 'pierce', launch: 20 })); });
      if (lv >= 10) c.later(16 + N * gap + 6, () => { const x = x0 + f * 1.9 * kk; cloud(x, y0, kk, 40); const th = strike(x, y0, kk, { sc: 2.0, warn: 14 }); c.later(th, () => { shake(10); c.hit({ shape: 'circle', x, y: y0, r: 2.0, m: 1.0, lv: 'heavy', kind: 'pierce', launch: 70 }); }); }); },
    /* 回身刺：迴旋一斬 → 停、轉身、聚電 → 帶電長刺擊飛。Lv3 沿路炸開；Lv5 更遠、必爆擊；Lv7 迴旋時四周放電；Lv10 沿路再劈三道雷 */
    special_backpierce(c, t) { const lv = LV(c), kk = K(c.y), len = lv >= 5 ? 3.4 : 2.8; if (t === 1) c.a.T = 62 + (lv >= 10 ? 26 : 0);
      if (t === 3) { swing({ x: c.x, y: c.y, f: c.f, a0: -0.3, a1: -0.3 + TAU * 1.02, R: 1.55, sq: 0.4, cy: 0.5, dur: 9, big: 1.1 }); c.ghost(10); }
      if (t === 8) { c.hit({ shape: 'circle', r: 1.7, m: 0.6, lv: 'mid', kind: 'cut', stun: lv >= 7 ? 40 : 0 }); if (lv >= 7) for (let i = 0; i < 4; i++) spark(c.x + Math.cos(i * 1.57 + 0.5) * 1.5 * kk, c.y - 0.5 * kk + Math.sin(i * 1.57 + 0.5) * 0.6 * kk, kk, 0.6, i * 2); }
      if (t === 20) { G.H.face = -G.H.face; c.a.face0 = G.H.face; say('返', kk); gather(c.x + G.H.face * 0.4 * kk, c.y - 0.55 * kk, kk, 12, 1); }
      if (t === 34) { const f = G.H.face, x0 = G.H.x, y0 = G.H.y; c.thrust({ len, w: 0.3, cy: 0.55, ext: 2, life: 16, hf: 1, hold: 4, m: 1.9 * (lv >= 3 ? 1.3 : 1), lv: 'heavy', kb: 2.6, launch: 70, crit: lv >= 5, big: 1.5, shock: 1 }); shake(6);
        if (lv >= 3) for (let i = 0; i < 4; i++) spark(x0 + f * (0.9 + i * len / 4.6) * kk, y0 - 0.55 * kk, kk, rnd(0.45, 0.8), 2 + i * 3);
        if (lv >= 10) for (let i = 0; i < 3; i++) { const x = x0 + f * (1.2 + i * 1.1) * kk, th = strike(x, y0, kk, { d0: 14 + i * 7, sc: 1.0 + i * 0.25, warn: 8 }); c.later(th, () => c.hit({ shape: 'circle', x, y: y0, r: 1.0, m: 0.5, lv: 'heavy', kind: 'pierce', launch: 40 })); } } },
    /* 不動構：聚電 → 前方不遠處引下一道落雷，雷柱留在原地把四周敵人吸過去 → 兩秒後雷暴。Lv3／5／7／10 吸引距離與落雷數量遞增；Lv10 雷雲＋中央巨雷 */
    special_deny(c, t) { const lv = LV(c), kk = K(c.y), U = kk / 90; if (t === 1) { c.a.T = 46; gather(c.x + c.f * 0.3 * kk, c.y - 0.55 * kk, kk, 9, 0.8); } if (t !== 10) return;
      const f = c.f, px = c.x + f * 2.2 * kk, py = c.y, R = (lv >= 10 ? 6.5 : lv >= 7 ? 5.4 : lv >= 5 ? 4.6 : lv >= 3 ? 3.8 : 3.0) * kk, N = lv >= 10 ? 11 : lv >= 7 ? 8 : lv >= 5 ? 6 : lv >= 3 ? 4 : 3, HOLD = 120, sd = Math.random() * 1e3;
      const th = strike(px, py, kk, { sc: 1.25, warn: 6 }); c.later(th, () => c.hit({ shape: 'circle', x: px, y: py, r: 1.0, m: 0.5, lv: 'mid', kind: 'pierce', stun: 30 }));
      add(th + HOLD + 8, 'u', (ctx, u) => { const v = u - th; if (v < 0) return; const a = v > HOLD ? Math.max(0, 1 - (v - HOLD) / 8) : Math.min(1, v / 8); AF().fr('b_susanoo', 'fx_lightning_warning', 1 + Math.floor(v / 6) % 2, px, py, { size: kk * (1.9 + 0.15 * Math.sin(v * 0.3)), by: 'w', tint: TINT, a });
        ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.4); for (let j = 0; j < 3; j++) { const q = ((v + j * 13) % 40) / 40; ctx.strokeStyle = 'rgba(170,130,245,' + 0.4 * a * q + ')'; ctx.lineWidth = 1.5 + 2 * q; ctx.beginPath(); ctx.arc(0, 0, R * (1 - q * 0.85), 0, TAU); ctx.stroke(); }   /* 往中心收的圈＝吸引範圍 */
        const fl = Math.floor(v / 4); for (let j = 0; j < 5; j++) { const s2 = sd + fl * 7.1 + j * 3.3, an = hs(s2, 1) * TAU, r0 = R * (0.35 + 0.6 * hs(s2, 2)); tb(ctx, Math.cos(an) * r0, Math.sin(an) * r0, Math.cos(an) * r0 * 0.12, Math.sin(an) * r0 * 0.12, s2, a * 0.85, U * (2 + 7 * hs(s2, 3)), r0 * 0.14, Math.floor(hs(s2, 4) * 3), 2); } ctx.restore(); });
      add(th + HOLD + 8, 'o', (ctx, u) => { const v = u - th - 10; if (v < 0) return; const a = (v > HOLD - 10 ? Math.max(0, 1 - (v - HOLD + 10) / 8) : 1) * (0.55 + 0.3 * hs(sd, Math.floor(v / 3))), fl = Math.floor(v / 5);   /* 留在原地的雷柱 */
        if (!AF().fr('b_izanami', 'izanami_thunder', 1 + fl % 2, px, py + kk * 0.08, { size: kk * (3.0 + 0.5 * hs(sd, fl)), by: 'h', anc: 'b', flip: fl % 2 === 1, a })) tb(ctx, px + (hs(sd, fl) - 0.5) * kk, py - 3.2 * kk, px, py, sd + fl * 2.3, a, U * 8, kk * 0.25, 3, 2); });
      for (let i = 0; i < HOLD; i++) c.later(th + i, () => { for (const e of G.E) { if (!alive(e) || e.boss || e.bb) continue; const d = Math.hypot(e.x - px, (e.y - py) * 2); if (d < R && d > 0.3 * kk) { const nx = e.x + (px - e.x) * 0.05, ny = e.y + (py - e.y) * 0.05; if (G.SC.walkable(nx, ny)) { e.x = nx; e.y = ny; } } }
        if (i % 24 === 12) { c.hit({ shape: 'circle', x: px, y: py, r: 1.3, m: 0.12, lv: 'light', kind: 'pierce' }); spark(px + rnd(-0.5, 0.5) * kk, py - rnd(0.2, 0.9) * kk, kk, 0.4, 0, { noArt: 1, n: 3 }); } });
      c.later(th + HOLD, () => { if (lv >= 10) cloud(px, py, kk, N * 5 + 50); shake(6);
        for (let i = 0; i < N; i++) { const an = rnd(0, TAU), r = (i ? rnd(0.3, 1.6) : 0) * kk, x = px + Math.cos(an) * r, y = py + Math.sin(an) * r * 0.45, t2 = strike(x, y, kk, { d0: i * 5, sc: rnd(0.85, 1.35), warn: 5 }); c.later(t2, () => c.hit({ shape: 'circle', x, y, r: 1.0, m: 0.4, lv: 'heavy', kind: 'pierce', launch: 30 })); }
        if (lv >= 10) { const t3 = strike(px, py, kk, { d0: N * 5 + 8, sc: 2.0, warn: 12 }); c.later(t3, () => { shake(10); c.hit({ shape: 'circle', x: px, y: py, r: 2.0, m: 1.2, lv: 'heavy', kind: 'pierce', launch: 70 }); }); } }); },
    /* 一文字：瞄準線 → 一路貫穿 → 收槍停頓 → 沿路依序炸開。Lv3 距離 ×1.5；Lv5 緩速；Lv7 炸開也有傷害；Lv10 炸開改成一排落雷 */
    special_lane(c, t) { const lv = LV(c), kk = K(c.y), D = 4 * (lv >= 3 ? 1.5 : 1), m = c.a.mvx;
      if (t === 1) { c.a.T = 66 + (lv >= 10 ? 20 : 0); m.sk = []; m.x0 = c.x; const x0 = c.x, y = c.y - 0.55 * kk, f = c.f; gather(x0 + f * 0.3 * kk, y, kk, 12, 0.8); add(14, 'o', (ctx, u) => { const g = Math.min(1, u / 9); ctx.strokeStyle = 'rgba(' + HI + ',' + (u > 10 ? 1 - (u - 10) / 4 : 0.9) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + f * (D + 1.2) * kk * g, y); ctx.stroke(); }); }
      if (t === 14) held(c.a, 13, {});
      if (t >= 14 && t <= 25) { c.move(D / 12, 0); c.inv(6); if (t % 2 === 0) c.ghost(10); c.hit({ shape: 'circle', r: 0.8, m: 1.2, lv: 'mid', kind: 'pierce', skip: m.sk, slow: lv >= 5 ? 40 : 0, stun: 30 }).forEach(e => m.sk.push(e)); }
      if (t === 40) { const x1 = G.H.x, y0 = G.H.y, n = lv >= 3 ? 7 : 5; for (let i = 0; i < n; i++) { const x = m.x0 + (x1 - m.x0) * (i + 0.6) / n, d = i * 4; if (lv >= 10) { const th = strike(x, y0, kk, { d0: d, sc: rnd(0.8, 1.3), warn: 5 }); c.later(th, () => c.hit({ shape: 'circle', x, y: y0, r: 0.9, m: 0.4, lv: 'heavy', kind: 'pierce', launch: 30 })); } else { spark(x, y0 - 0.5 * kk, kk, rnd(0.6, 1.0), d); if (lv >= 7) c.later(d, () => c.hit({ shape: 'circle', x, y: y0, r: 0.8, m: 0.3, lv: 'mid', kind: 'pierce' })); } } } },
    /* 車返：聚電 → 迴旋一圈 → 八方依序放電。Lv3 範圍 ×1.25；Lv7 放電更長並使敵人麻痺；Lv10 外圍再落四道雷 */
    special_return(c, t) { const lv = LV(c), kk = K(c.y), U = kk / 90, r = 1.45 * (lv >= 3 ? 1.25 : 1);
      if (t === 1) { c.a.T = 46 + (lv >= 10 ? 26 : 0); gather(c.x, c.y - 0.5 * kk, kk, 8, 0.8); }
      if (t === 9) swing({ x: c.x, y: c.y, f: c.f, a0: -0.3, a1: -0.3 + Math.PI * 2.05, R: r, sq: 0.4, cy: 0.5, dur: 10, big: 1.2 });
      if (t === 15) { c.hit({ shape: 'circle', r: r + 0.15, m: 1.2, lv: 'mid', kind: 'cut', stun: lv >= 7 ? 50 : 0 }); const d = G.RPG.d(); if (d) d.qi = Math.min(100, (d.qi || 0) + (lv >= 5 ? 20 : 10)); }
      if (t === 20) for (let i = 0; i < 8; i++) { const a = -0.3 + i / 8 * TAU, x = c.x + Math.cos(a) * r * kk * c.f, y = c.y - 0.5 * kk + Math.sin(a) * r * kk * 0.4, sd = Math.random() * 1e3, d = i * 2, len = kk * (lv >= 7 ? 1.5 : 1) * (Math.random() < 0.35 ? rnd(0.9, 1.3) : rnd(0.4, 0.75)), w = U * rnd(2.5, 8), br = 1 + Math.floor(rnd(0, 3)), dx = Math.cos(a) * c.f, dy = Math.sin(a) * 0.4;
          add(d + 14, 'o', (ctx, u) => { const v = u - d; if (v < 0) return; const gl = len * Math.min(1, 0.4 + v / 5); tb(ctx, x, y, x + dx * gl, y + dy * gl, sd + Math.floor(v / 3) * 3, 1 - Math.pow(v / 14, 2), w, len * 0.15, br, 2); }); }
      if (lv >= 10 && t === 30) for (let i = 0; i < 4; i++) { const a = 0.6 + i * 1.57, x = c.x + Math.cos(a) * 2.5 * kk, y = c.y + Math.sin(a) * 2.5 * kk * 0.45, th = strike(x, y, kk, { d0: i * 6, sc: rnd(0.9, 1.3), warn: 8 }); c.later(th, () => c.hit({ shape: 'circle', x, y, r: 1.0, m: 0.4, lv: 'heavy', kind: 'pierce', launch: 30 })); } } };
  /* 圖集：拿長槍時依序載入，之後每兩秒標記使用中 */
  const ART = ['b_izanami', 'b_raiju', 'b_susanoo']; let loading = 0;
  setInterval(() => { try { if (G.mode !== 'play' || !G.WPN || !G.WPN.curId || G.WPN.curId() !== 'yari' || !G.ANIM) return; for (const k of ART) { const u = G.ANIM.get(k); if (u) u.lu = performance.now(); }
      if (loading || ART.every(k => G.ANIM.get(k))) return; loading = 1; (async () => { for (const k of ART) if (!G.ANIM.get(k)) { try { await G.ANIM.load(k); } catch (e) { } } loading = 0; })(); } catch (e) { } }, 2000);
  return { thrust, swing, held, rise, guard, pierce, strike, spark, tb, RUN, ready: () => ART.every(k => G.ANIM && G.ANIM.get(k)) };
})();
