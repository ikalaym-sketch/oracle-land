/* ==========================================================================
 * 神諭之地 重製版 — 168_wfx.js
 * Version : r3.230.0  (2026-11-28)　r3.230.0：弧線可給技／特技用（o.free），匯出 arc
 * 舊版    : r3.227.0  (2026-11-28)　r3.227.0：新增。四把近戰武器的普攻新畫法（試作頁第五版定案）
 * 內容    : 打刀／野太刀／薙刀／長槍的普攻特效：
 *           ・軌跡＝每段普攻各自設計的弧線，寬度等於刀身（外緣實、往握柄漸淡），不描邊、沒有白芯。
 *           ・距離依武器：打刀 1.3、野太刀 1.85、薙刀 2.05、長槍 2.0 個身高（判定距離同步調整，見 55_wpn_v2）。
 *           ・主題粒子：打刀＝水（水片＋水珠）、野太刀＝火（寬窄高矮不一、會擺動的火舌＋火星）、
 *             薙刀＝風與葉（葉片、桿影、柄尾軌跡）、長槍＝紫電（槍尖細光、速度線、流線、短電光、人影殘像、往前滑一步）。
 *           ・命中：各主題的小碎光；敵人整隻染色調淡。
 *           只接管「普攻」；招式、技、特技、秘傳仍走 111／116 原本的畫法。
 * 依賴    : 111_katana_fx（G.KF.K／add）、116_yari_fx、03_actors、13_weapons。由 111 的 smear／stab、116 的 spear／swing 入口轉進來。
 * ========================================================================== */
'use strict';
G.WFX = (function () {
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), K = y => G.KF.K(y), add = function () { return G.KF.add.apply(G.KF, arguments); }, wid = () => G.WPN.curId();
  /* 每把武器：色、刀身佔半徑的比例（in＝內緣）、攻擊距離 R（身高倍數）、普攻各段的弧（a0→a1、壓扁 sq、傾斜 rot） */
  const WP = {
    katana: { c: '186,214,240', hi: '240,250,255', in: 0.5, R: 1.3, A: 0.85, dur: 4, seq: [[-1.9, 0.75, 0.8, -0.15], [0.95, -1.55, 0.8, 0.1], [-2.3, 0.9, 0.9, -0.1], [-2.7, 0.55, 0.36, 0]] },
    nodachi: { c: '196,104,62', hi: '250,206,130', in: 0.38, R: 1.85, A: 0.72, dur: 5, seq: [[-2.25, 0.95, 0.95, -0.1], [-2.85, 0.5, 0.4, 0], [1.05, -2.0, 0.9, 0.1], [-2.5, 1.15, 1, -0.05]] },
    naginata: { c: '168,202,186', hi: '232,246,234', in: 0.7, R: 2.05, A: 0.85, dur: 5, pole: 1, seq: [[-2.6, 0.6, 0.42, 0], [0.85, -2.45, 0.42, 0], [-2.05, 0.95, 0.9, -0.1], [-3.7, 2.2, 0.4, 0]] },
    yari: { c: '198,182,236', hi: '240,232,255', ac: '146,108,232', in: 0.82, R: 2.0, A: 0.85, dur: 4, seq: [] } };
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2.4);
  const stepOf = () => { const n = (G.H.act && G.H.act.name) || ''; const m = /(\d)\D*$/.exec(n); return /finisher_2/.test(n) && wid() === 'naginata' ? 2 : /finish|fin/.test(n) ? 3 : m ? Math.min(2, Math.max(0, +m[1] - 1)) : -1; };
  function band(ctx, P, h, t, Rin, Rout, col, hi, A) { const N = 20, sp = h - t; if (Math.abs(sp) < 0.03) return;
    for (let i = 0; i < N; i++) { const q0 = i / N, q1 = (i + 1) / N, a0 = t + sp * q0, a1 = t + sp * q1, nar = q => q > 0.86 ? (q - 0.86) / 0.14 : 0, ri0 = Rin + (Rout - Rin) * nar(q0) * 0.9, ri1 = Rin + (Rout - Rin) * nar(q1) * 0.9;
      const o0 = P(a0, Rout), o1 = P(a1, Rout), i0 = P(a0, ri0), i1 = P(a1, ri1), am = (a0 + a1) / 2, gi = P(am, Rin), go = P(am, Rout), al = A * (0.06 + 0.94 * Math.pow(q1, 1.5));
      const g = ctx.createLinearGradient(gi[0], gi[1], go[0], go[1]); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.6, 'rgba(' + col + ',' + al * 0.32 + ')'); g.addColorStop(1, 'rgba(' + col + ',' + al + ')');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.lineTo(i1[0], i1[1]); ctx.lineTo(i0[0], i0[1]); ctx.closePath(); ctx.fill();
      if (q0 > 0.5) { ctx.strokeStyle = 'rgba(' + hi + ',' + al * (q1 - 0.5) * 1.8 + ')'; ctx.lineWidth = Math.max(0.7, (Rout - Rin) * 0.05); ctx.beginPath(); ctx.moveTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.stroke(); } } }
  function leaf(ctx, x, y, r, s, col, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.55, s, 0); ctx.quadraticCurveTo(0, s * 0.55, -s, 0); ctx.fill(); ctx.restore(); }
  function part(ctx, l, x, y, v, a, k, f) { const s = l.s * k; ctx.save();
    if (l.k === 'flame') { const lifeQ = 1 - a, grow = Math.min(1, v / 4), H0 = s * l.ht * grow * (1 - lifeQ * 0.35), W0 = s * l.wd * (1 - lifeQ * 0.5), N = 9, Lp = [], Rp = [], lean = l.lean * (1 - lifeQ * 0.6);
      ctx.translate(x, y); for (let i = 0; i <= N; i++) { const q = i / N, wave = Math.sin(q * l.wl - v * l.fq * 1.4 + l.ph) * s * l.sw * q * q, cx2 = -l.tv[0] * H0 * lean * q * q + wave, cy2 = -H0 * q - l.tv[1] * H0 * lean * 0.4 * q * q, wq = W0 * 0.5 * (q < 0.22 ? 0.55 + q / 0.22 * 0.45 : Math.pow(1 - (q - 0.22) / 0.78, 1.25)) * (1 + 0.18 * Math.sin(q * 7 + v * l.fq * 2 + l.ph));
        Lp.push([cx2 - wq, cy2]); Rp.push([cx2 + wq, cy2]); }
      const tip = [(Lp[N][0] + Rp[N][0]) / 2, Lp[N][1]], g = ctx.createLinearGradient(0, 0, tip[0], tip[1]); g.addColorStop(0, 'rgba(255,226,146,' + a * 0.95 + ')'); g.addColorStop(0.45, 'rgba(250,142,54,' + a * 0.9 + ')'); g.addColorStop(0.85, 'rgba(196,60,26,' + a * 0.55 + ')'); g.addColorStop(1, 'rgba(150,40,20,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i <= N; i++) ctx.lineTo(Lp[i][0], Lp[i][1]); for (let i = N; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,246,206,' + a * 0.65 + ')'; ctx.beginPath(); ctx.moveTo(Lp[0][0] * 0.5, 0); for (let i = 1; i <= 5; i++) ctx.lineTo((Lp[i][0] * 0.45 + Rp[i][0] * 0.55 + Lp[i][0]) / 2, Lp[i][1]); for (let i = 5; i >= 0; i--) ctx.lineTo((Rp[i][0] + Lp[i][0] * 0.55 + Rp[i][0] * 0.45) / 2, Rp[i][1]); ctx.closePath(); ctx.fill(); }
    else if (l.k === 'dot') { ctx.globalAlpha = a; ctx.fillStyle = l.c; ctx.fillRect(x, y, s * 2.2, s); }
    else if (l.k === 'drop') { const vx = l.tv[0] * l.vx * 1.5 + l.ov[0] * l.out, vy = l.tv[1] * l.vx * 1.5 + l.ov[1] * l.out + 0.08 * v, ang = Math.atan2(vy, vx), st = 1 + Math.min(1.6, Math.hypot(vx, vy) * 0.5); ctx.translate(x, y); ctx.rotate(ang);
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = 'rgb(120,176,226)'; ctx.beginPath(); ctx.moveTo(s * 0.6, 0); ctx.quadraticCurveTo(0, -s * 0.5, -s * 1.2 * st, 0); ctx.quadraticCurveTo(0, s * 0.5, s * 0.6, 0); ctx.fill();
      ctx.globalAlpha = a * 0.9; ctx.fillStyle = 'rgb(190,224,248)'; ctx.beginPath(); ctx.moveTo(s * 0.55, 0); ctx.quadraticCurveTo(0, -s * 0.36, -s * 0.8 * st, 0); ctx.quadraticCurveTo(0, s * 0.28, s * 0.55, 0); ctx.fill();
      ctx.globalAlpha = a; ctx.fillStyle = 'rgb(246,252,255)'; ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.1, s * 0.2, s * 0.09, 0, 0, TAU); ctx.fill(); }
    else if (l.k === 'spike') { const grow = Math.min(1, v / 3), h = s * grow, w = s * 0.2, oa = Math.atan2(l.ov[1], l.ov[0]) + l.tilt, sh = a < 0.35 ? (0.35 - a) / 0.35 : 0; ctx.translate(x + l.ov[0] * sh * s * 0.6, y + l.ov[1] * sh * s * 0.6 + sh * sh * s); ctx.rotate(oa); const al = Math.min(1, a * 2.2);
      ctx.globalAlpha = al * 0.92; ctx.fillStyle = 'rgb(214,236,250)'; ctx.beginPath(); ctx.moveTo(-h * 0.25, -w); ctx.lineTo(h, 0); ctx.lineTo(-h * 0.25, w); ctx.lineTo(-h * 0.4, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgb(128,180,228)'; ctx.beginPath(); ctx.moveTo(-h * 0.25, w); ctx.lineTo(h, 0); ctx.lineTo(-h * 0.4, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(250,254,255,' + al + ')'; ctx.lineWidth = Math.max(0.7, s * 0.03); ctx.beginPath(); ctx.moveTo(-h * 0.4, 0); ctx.lineTo(h, 0); ctx.stroke(); }
    else if (l.k === 'ice') { ctx.translate(x, y); ctx.rotate(l.r0 + l.sp * v); ctx.globalAlpha = a * 0.9; ctx.fillStyle = 'rgb(206,232,250)'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.38, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.38, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(130,180,226,' + a * 0.8 + ')'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.38, 0); ctx.lineTo(0, s); ctx.closePath(); ctx.fill(); }
    else if (l.k === 'bolt') bolt(ctx, x, y, s, l.seed + Math.floor(v / 2) * 7.3, a);
    else leaf(ctx, x, y, (l.r0 || 0) + (l.sp || 0) * v, s, l.c, a * 0.9);
    ctx.restore(); }
  /* 小電光：折線，紫邊淡芯 */
  function bolt(ctx, x, y, s, seed, a, dir) { const r = i => { const t = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return t - Math.floor(t); }, ang = dir === undefined ? r(0) * TAU : dir + (r(0) - 0.5) * 0.5, n = 6, pts = [[x, y]]; let px = x, py = y;
    for (let i = 1; i <= n; i++) { const d = s / n, aa = ang + (r(i) - 0.5) * 2.1; px += Math.cos(aa) * d; py += Math.sin(aa) * d * 0.85; pts.push([px, py]); }
    const br = [pts[3]]; { let bx = pts[3][0], by = pts[3][1]; const ba = ang + (r(9) < 0.5 ? 1 : -1) * rnd(0.6, 1.1); for (let i = 1; i <= 3; i++) { const aa = ba + (r(10 + i) - 0.5) * 1.6; bx += Math.cos(aa) * s / 8; by += Math.sin(aa) * s / 8; br.push([bx, by]); } }
    const line = (P2, lw, col) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.beginPath(); P2.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
    line(pts, Math.min(3.6, Math.max(2, s * 0.09)), 'rgba(96,60,200,' + a * 0.5 + ')'); line(pts, Math.min(2.2, Math.max(1.2, s * 0.05)), 'rgba(168,130,246,' + a * 0.95 + ')'); line(pts, Math.min(1.1, Math.max(0.6, s * 0.022)), 'rgba(250,246,255,' + a + ')');
    line(br, Math.max(1.4, s * 0.05), 'rgba(168,130,246,' + a * 0.85 + ')'); line(br, Math.max(0.6, s * 0.02), 'rgba(250,246,255,' + a * 0.9 + ')'); }
  /* 風線：短的、兩頭尖的流線，沿槍桿往前流，各自弧度不同 */
  function streak(ctx, x0, y0, len, bend, w, col, a, f) { const N = 12; for (let i = 0; i < N; i++) { const q0 = i / N, q1 = (i + 1) / N, yb = q => bend * Math.sin(q * Math.PI) + bend * 0.35 * Math.sin(q * TAU), lw = w * Math.sin(Math.PI * (q0 + q1) / 2); if (lw < 0.3) continue;
      ctx.strokeStyle = 'rgba(' + col + ',' + a * (0.35 + 0.65 * q1) + ')'; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + f * len * q0, y0 + yb(q0)); ctx.lineTo(x0 + f * len * q1, y0 + yb(q1)); ctx.stroke(); } }
  function arc(o, Rk0) { const w = WP[wid()] || WP.katana, st = o.free ? -1 : stepOf(), pre = st >= 0 && w.seq[st] ? w.seq[st] : null,   /* r3.230.0：o.free＝技／特技用，不套普攻的弧，可自訂 dur */ y = o.y, k = K(y), f = o.f || o.face || 1;
    const a0 = pre ? pre[0] : o.a0, a1 = pre ? pre[1] : o.a1, sq = pre ? pre[2] : (o.sq === undefined ? 0.6 : o.sq), rot = pre ? pre[3] : (o.rot || 0), Rk = pre ? w.R * (st === 3 ? 1.08 : 1) : Math.max(Rk0, w.R * 0.8), dur = o.free && o.dur ? o.dur : w.dur + (st === 3 ? 1 : 0), cs = Math.cos(rot), sn = Math.sin(rot);
    const span = a1 - a0, tl = Math.min(Math.abs(span), 2.3) * Math.sign(span), L = [], wk = wid();
    if (wk === 'naginata') for (let i = 0; i < 7; i++) L.push({ q: rnd(0.2, 1), vx: rnd(0.4, 1.4), vy: rnd(-0.9, -0.2), sp: rnd(-0.3, 0.3), r0: rnd(0, TAU), s: rnd(0.05, 0.08), c: Math.random() < 0.3 ? '#e3d38c' : '#a9cf9e' });
    if (wk === 'nodachi') { for (let i = 0; i < 8; i++) { const big = Math.random(); L.push({ q: 0.18 + i / 8 * 0.8 + rnd(-0.04, 0.04), rr: rnd(0.5, 1), vx: rnd(0.0, 0.25), vy: rnd(-0.5, -0.15), s: 0.14 + 0.24 * big, wd: rnd(0.5, 1.25), ht: rnd(0.75, 1.7), ph: rnd(0, TAU), sw: rnd(0.25, 0.75), fq: rnd(0.45, 1.2), wl: rnd(1.6, 3.4), lean: rnd(0.5, 1.4), k: 'flame', life: rnd(14, 26) }); }
      for (let i = 0; i < 4; i++) L.push({ q: rnd(0.5, 1), rr: rnd(0.7, 1), vx: rnd(0.8, 2.0), vy: rnd(-1.2, 0.2), s: rnd(0.016, 0.03), c: Math.random() < 0.5 ? '#ffd28a' : '#ff9a4a', k: 'dot', life: 16 }); }
    if (wk === 'katana') { const ice = false; for (let i = 0; i < (ice ? 5 : 10); i++) { const big = Math.random(); L.push({ q: rnd(0.25, 1), rr: rnd(0.8, 1.02), vx: rnd(0.6, 2.4), vy: rnd(-1.3, 0.2), s: 0.045 + 0.13 * big * big, k: 'drop', life: rnd(14, 24), out: rnd(0.3, 1.4) }); }
      if (ice) { for (let i = 0; i < 9; i++) L.push({ q: 0.12 + i / 9 * 0.86 + rnd(-0.03, 0.03), rr: 1, vx: 0, vy: 0, s: rnd(0.16, 0.34), tilt: rnd(-0.35, 0.35), k: 'spike', life: rnd(18, 26), stay: 1 }); for (let i = 0; i < 6; i++) L.push({ q: rnd(0.3, 1), rr: rnd(0.85, 1), vx: rnd(0.3, 1.2), vy: rnd(-0.9, -0.1), s: rnd(0.05, 0.085), r0: rnd(0, TAU), sp: rnd(-0.35, 0.35), k: 'ice', life: rnd(18, 26), late: 8 }); } }
    if (wk === 'yari') for (let i = 0; i < 3; i++) L.push({ q: rnd(0.4, 1), rr: rnd(0.8, 1.05), vx: 0, vy: 0, s: rnd(0.16, 0.3), seed: Math.random() * 1e3, k: 'bolt', life: rnd(5, 8) });
    add(dur + 40, 'o', (ctx, u) => { const cx = o.follow ? G.H.x : o.x, cy = y - (o.cy === undefined ? 0.55 : o.cy) * k, R = Rk * k;
      const P = (a, r) => { const lx = Math.cos(a) * r, ly = Math.sin(a) * r * sq; return [cx + (lx * cs - ly * sn) * f, cy + (lx * sn + ly * cs)]; };
      const hq = ease(u / dur), h = a0 + span * hq, fade = u > dur ? Math.max(0, 1 - (u - dur) / 9) : 1, tt = u > dur ? h - tl * fade : h - tl * Math.min(1, hq * 1.5), t = span > 0 ? Math.max(a0, tt) : Math.min(a0, tt);
      if (fade > 0) { const iceK = false; band(ctx, P, h, t, R * w.in, R, iceK ? '208,236,252' : w.c, w.hi, w.A * (0.3 + 0.7 * fade));
        if (wk === 'katana' && !iceK) { const N = 26, sp2 = h - t; ctx.fillStyle = 'rgba(150,200,240,' + 0.55 * fade + ')'; ctx.beginPath(); for (let i2 = 0; i2 <= N; i2++) { const q = i2 / N, aa = t + sp2 * q, wv = 1 + (0.035 + 0.05 * q) * Math.sin(q * 17 + u * 0.9) + 0.03 * Math.sin(q * 41 - u * 1.3), p2 = P(aa, R * (1.0 + 0.07 * q) * wv); i2 ? ctx.lineTo(p2[0], p2[1]) : ctx.moveTo(p2[0], p2[1]); } for (let i2 = N; i2 >= 0; i2--) { const q = i2 / N, p2 = P(t + sp2 * q, R * 0.97); ctx.lineTo(p2[0], p2[1]); } ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(244,252,255,' + 0.8 * fade + ')'; ctx.lineWidth = Math.max(0.8, k * 0.014); ctx.beginPath(); for (let i2 = Math.floor(N * 0.45); i2 <= N; i2++) { const q = i2 / N, aa = t + sp2 * q, wv = 1 + (0.035 + 0.05 * q) * Math.sin(q * 17 + u * 0.9) + 0.03 * Math.sin(q * 41 - u * 1.3), p2 = P(aa, R * (1.0 + 0.07 * q) * wv); i2 > Math.floor(N * 0.45) ? ctx.lineTo(p2[0], p2[1]) : ctx.moveTo(p2[0], p2[1]); } ctx.stroke(); }
        if (w.pole) { const P2 = (a, r) => P(a + Math.PI, r * 0.38); band(ctx, P2, h, span > 0 ? Math.max(a0, h - tl * 0.5) : Math.min(a0, h - tl * 0.5), R * 0.86, R, w.c, w.hi, w.A * 0.3 * fade);
          const hp = P(h, R * 0.7), hb = P(h + Math.PI, R * 0.38); ctx.strokeStyle = 'rgba(' + w.c + ',' + 0.25 * fade + ')'; ctx.lineWidth = Math.max(0.8, k * 0.012); ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(hb[0], hb[1]); ctx.stroke(); } }
      for (const l of L) { const born = dur * l.q * 0.8 + (l.late || 0); if (u < born) continue; const v = u - born, a = Math.max(0, 1 - v / (l.life || 26)); if (a <= 0) continue; const ang = a0 + span * l.q, b = P(ang, R * (l.rr || 1));
        if (!l.tv) { const b2 = P(ang + 0.06 * Math.sign(span), R * (l.rr || 1)), c0 = P(ang, 0), tl2 = Math.hypot(b2[0] - b[0], b2[1] - b[1]) || 1, ol = Math.hypot(b[0] - c0[0], b[1] - c0[1]) || 1; l.tv = [(b2[0] - b[0]) / tl2, (b2[1] - b[1]) / tl2]; l.ov = [(b[0] - c0[0]) / ol, (b[1] - c0[1]) / ol]; }
        if (l.k === 'drop') part(ctx, l, b[0] + (l.tv[0] * l.vx * 1.5 + l.ov[0] * l.out) * v, b[1] + (l.tv[1] * l.vx * 1.5 + l.ov[1] * l.out) * v + 0.04 * v * v, v, a, k, f);
        else if (l.stay) part(ctx, l, b[0], b[1], v, a, k, f);
        else part(ctx, l, b[0] + f * l.vx * v * 1.4, b[1] + l.vy * v + (l.k === 'flame' ? 0 : 0.03 * v * v), v, a, k, f); } }); }
  /* ---------- 長槍四種 ---------- */
  const ghost = () => { try { const u = G.WPN.unit(), fr = G.heroFrame(); if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x: G.H.x, y: G.H.y, face: G.H.face, s: G.SC.depth(G.H.y) * G.WPN.actK(G.H.act && G.H.act.name), t: 0, life: 9 }); } catch (e) { } };
  const slide = (f, k, n, d) => { let sl = n; const go = () => { if (sl-- > 0) { const nx = G.H.x + f * d * k; if (G.SC.walkable(nx, G.H.y)) G.H.x = nx; G.STORY.later(1, go); } }; go(); };
  const head = (ctx, x, y, f, L, Wd, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = 'rgb(' + col + ')'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - f * L * 0.35, y - Wd); ctx.lineTo(x - f * L, y); ctx.lineTo(x - f * L * 0.35, y + Wd); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
  function thrust(o) { const w = WP.yari, f = o.face || o.f || 1, y = o.y, k = K(y), reach = Math.max(o.len || 1.8, w.R) * k, hx = o.x + f * 0.1 * k, hy = y - (o.cy || 0.55) * k;
    ghost(); slide(f, k, 3, 0.08);
    const SL = []; for (let i = 0; i < 4; i++) SL.push({ dy: rnd(-0.6, 0.3) * k, x0: rnd(-0.3, 0.5) * k, len: rnd(0.4, 0.9) * k, sp: rnd(0.18, 0.3) * k, t0: i * 0.8 });
    const WL = [], nW = 3 + (Math.random() < 0.5 ? 1 : 0); for (let i = 0; i < nW; i++) WL.push({ t0: i * 1.1, p0: rnd(0.02, 0.28), len: rnd(0.55, 0.95) * k, sp: rnd(0.2, 0.32) * k, dy: rnd(-0.16, 0.16) * k, bend: rnd(0.05, 0.13) * k * (Math.random() < 0.5 ? -1 : 1), w: rnd(0.022, 0.034) * k, life: rnd(8, 11) });
    const BL = []; for (let i = 0; i < 4; i++) BL.push({ t0: 1 + i * 0.8, p: rnd(0.75, 1.04), dy: rnd(-0.1, 0.1) * k, s: rnd(0.16, 0.3) * k, seed: Math.random() * 1e3, life: rnd(6, 10) }); const SB = Math.random() * 1e3;
    const D = []; for (let i = 0; i < 4; i++) D.push({ vx: rnd(0.5, 1.6), vy: rnd(-0.8, -0.2), s: rnd(0.03, 0.05) });
    add(20, 'o', (ctx, u) => { const ex = ease(u / 2), tx = hx + f * reach * ex, a = u < 4 ? 1 : Math.max(0, 1 - (u - 4) / 6);
      for (const d of D) { const al = Math.max(0, 1 - u / 16) * 0.4; ctx.fillStyle = 'rgba(190,172,150,' + al + ')'; ctx.beginPath(); ctx.arc(o.x - f * d.vx * u * 1.2, y + d.vy * u * 0.6, d.s * k * (1 + u / 10), 0, TAU); ctx.fill(); }
      for (const s2 of SL) { const v = u - s2.t0; if (v < 0 || v > 6) continue; const al = (1 - v / 6) * 0.6, x1 = hx - f * (s2.x0 + s2.sp * v), x2 = x1 - f * s2.len, g = ctx.createLinearGradient(x1, 0, x2, 0); g.addColorStop(0, 'rgba(' + w.c + ',' + al + ')'); g.addColorStop(1, 'rgba(' + w.c + ',0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x1, x2), hy + s2.dy, Math.abs(x2 - x1), Math.max(1.2, k * 0.02)); }
      for (const l of WL) { const v = u - l.t0; if (v < 0 || v > l.life) continue; const al = Math.sin(Math.PI * Math.min(1, v / l.life)) * 0.8; streak(ctx, hx + f * (reach * l.p0 + l.sp * v), hy + l.dy, l.len, l.bend * (1 - v / l.life * 0.4), l.w, w.c, al, f); }
      if (a > 0) { const g = ctx.createLinearGradient(tx - f * 1.3 * k, 0, tx, 0); g.addColorStop(0, 'rgba(' + w.ac + ',0)'); g.addColorStop(0.6, 'rgba(' + w.c + ',' + 0.7 * a + ')'); g.addColorStop(1, 'rgba(' + w.hi + ',' + 0.95 * a + ')'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx - f * 1.3 * k, hy); ctx.lineTo(tx - f * 0.2 * k, hy - 0.045 * k); ctx.lineTo(tx, hy); ctx.lineTo(tx - f * 0.2 * k, hy + 0.045 * k); ctx.closePath(); ctx.fill();
        if (u >= 1 && u < 6) { const s3 = k * 0.26 * (1 - Math.abs(u - 3) / 3.2); ctx.fillStyle = 'rgb(' + w.hi + ')'; ctx.beginPath(); ctx.moveTo(tx - s3, hy); ctx.quadraticCurveTo(tx, hy, tx, hy - s3 * 0.5); ctx.quadraticCurveTo(tx, hy, tx + s3, hy); ctx.quadraticCurveTo(tx, hy, tx, hy + s3 * 0.5); ctx.quadraticCurveTo(tx, hy, tx - s3, hy); ctx.fill(); } }
      if (u >= 1 && u < 4) bolt(ctx, hx + f * reach * 0.55, hy, reach * 0.42, SB + Math.floor(u / 2) * 3.1, (1 - (u - 1) / 3) * 0.8, f > 0 ? 0 : Math.PI);
      for (const b of BL) { const v = u - b.t0; if (v < 0 || v > b.life) continue; bolt(ctx, hx + f * reach * b.p, hy + b.dy, b.s, b.seed + Math.floor(v / 2) * 7.3, 1 - v / b.life); } }); }
  /* 命中：各武器主題的小碎光（取代原本整片的冰晶狀爆開） */
  function hit(e, z, pw) { const wk = wid(), w = WP[wk]; if (!w || !e) return false; const k = K(e.y), x = e.x, y = e.y - z * k - (e.lz || 0), f = G.H.face, n = Math.min(7, 3 + Math.round(pw * 1.5)), L = [];
    for (let i = 0; i < n; i++) { const a = (f > 0 ? 0 : Math.PI) + rnd(-1.1, 1.1), sp = rnd(1.2, 3.2);
      if (wk === 'nodachi') L.push(i < 2 ? { k: 'flame', s: rnd(0.12, 0.26), wd: rnd(0.5, 1.2), ht: rnd(0.7, 1.4), ph: rnd(0, TAU), sw: rnd(0.2, 0.6), fq: rnd(0.5, 1.2), wl: rnd(1.6, 3.2), lean: rnd(0.4, 1), vx: rnd(-0.3, 0.3), vy: rnd(-0.5, -0.1), life: rnd(12, 20), tv: [-f, 0], ov: [f, 0] } : { k: 'dot', s: rnd(0.016, 0.03), c: Math.random() < 0.5 ? '#ffd28a' : '#ff9a4a', vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, life: 16 });
      else if (wk === 'katana') L.push({ k: 'drop', s: rnd(0.04, 0.1), vx: 1, out: 0, tv: [Math.cos(a) * sp * 0.66, Math.sin(a) * sp * 0.66 - 0.5], ov: [0, 0], life: rnd(12, 18) });
      else if (wk === 'yari') L.push(i < 3 ? { k: 'bolt', s: rnd(0.16, 0.3), seed: Math.random() * 1e3, vx: 0, vy: 0, life: rnd(5, 8), dx: rnd(-0.15, 0.25) * k * f, dy: rnd(-0.2, 0.2) * k } : { k: 'dot', s: rnd(0.014, 0.024), c: Math.random() < 0.5 ? '#e8dcff' : '#a886f6', vx: Math.cos(a) * sp * 1.3, vy: Math.sin(a) * sp, life: 12 });
      else L.push({ s: rnd(0.045, 0.075), c: Math.random() < 0.3 ? '#e3d38c' : '#a9cf9e', r0: rnd(0, TAU), sp: rnd(-0.3, 0.3), vx: Math.cos(a) * sp * 0.8, vy: Math.sin(a) * sp * 0.6 - 0.5, life: rnd(18, 28) }); }
    add(30, 'o', (ctx, u) => { for (const l of L) { const a = Math.max(0, 1 - u / l.life); if (a <= 0) continue;
        if (l.k === 'drop') part(ctx, l, x + l.tv[0] * 1.5 * u, y + l.tv[1] * 1.5 * u + 0.04 * u * u, u, a, k, f);
        else if (l.k === 'bolt') part(ctx, l, x + l.dx, y + l.dy, u, a, k, f);
        else part(ctx, l, x + (l.k === 'flame' ? l.vx * u : l.vx * u * 1.2), y + l.vy * u + (l.k === 'flame' ? 0 : 0.04 * u * u), u, a, k, f); } }); return true; }
  const norm = () => { const A = G.H.act; return !!(A && A.mvx && A.mvx.norm && WP[wid()]); };
  return { norm, hit, WP, arc, smear: o => arc(o, o.r || 1.2), swing: o => arc(Object.assign({}, o, { sq: o.sq || 1 }), o.R || 1.7), spear: thrust, stab: o => thrust(Object.assign({ len: (o.len || o.r || 1.3) }, o)) };
})();
