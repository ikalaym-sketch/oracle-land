/* ==========================================================================
 * 神諭之地 重製版 — 113_naginata.js
 * Version : r3.183.0  (2026-11-28)　r3.183.0：五招秘傳演出重做（龍捲風、滿天葉刃、風神降臨、雙月合攏、烏雲落雷）＋運鏡；千鳥加鳥形風刃、旋風薙加旋風、立架拒風牆改實色、翼架加展翼
 * 舊版    : r3.76.0  (2026-11-24)
 * 變更    : r3.76.0 新增。薙刀「沉重感的大範圍」（青碧 gale 色盤，用 111 元件）。
 *           範圍：招式／技的判定與刀光半徑 ×1.15、直線長度 ×1.1（招式資料不改，出招時套用）。
 *           份量：刀光更厚、掃得慢、殘留久；每次揮掃沿刀弧在地面推開風壓塵霧＋葉片；大範圍收招與秘傳落點鏡頭微微拉遠。
 *           落葉、燕形光（79）改用青碧實心燕＋柔光、尖葉翻轉飄落；立架拒的白色風線牆改成葉片與柔光風牆；旋風薙 Lv5 拉回的白線改成葉片氣流。
 *           秘傳 5 招三段演出：
 *             颶燕：後撤放出 3 隻風燕 → 大扇掃 → 反旋化成跟著主角的旋風（葉片柱＋多層環形刀光）持續 1 秒。修正：反旋與扇掃範圍加大，後撤後也打得到（秘傳湊得出來）。
 *             嵐葉舞：三掃各捲起葉片 → 最後貼地大橫掃，40 片葉暴＋緩速。
 *             風神降：滑行 → 上挑擊浮 → 跳起 → 落下砸出風柱與一圈風壓。
 *             雙月：側浪 → 扇掃 → 左右兩道 2 身高大月牙同時掃開。
 *             鳴神：架勢聚風 → 扇掃 → 反旋，再對最近 3 隻依序落雷（青白漸細雷＋落點揚塵）。
 * 依賴    : 111_katana_fx（G.KF）、79_mv_pole（薙刀招式）、92_lab（薙刀技、秘傳組合動作 _comp）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const KF = () => G.KF, Gl = fn => G.KF.use('gale', fn), GC = '150,235,205', WR = 1.15, WL = 1.1;
  const shake = n => { SC.shake = Math.max(SC.shake || 0, n); }, stop = n => { G.hitstop = Math.max(G.hitstop || 0, n); };
  const wide = p => { if (G.CAM && G.CAM.vis) G.CAM.vis *= 1 + 0.04 * p; };   // 大範圍：鏡頭微微拉遠
  const sweep = (c, o) => Gl(() => { const r = (o.r || 1.6) * WR; KF().smear(Object.assign({ x: c.x, y: c.y, f: c.f, cy: 0.5, sq: 0.4, rot: 0, a0: -2.8, a1: 1.4, w: 0.5, dur: 6, life: 26, tier: 2, trail: 3.2 }, o, { r })); KF().sweepDust(c.x, c.y, o.f || c.f, r * 0.95, o.a0 === undefined ? -2.8 : o.a0, o.a1 === undefined ? 1.4 : o.a1, 8, 1.2); KF().leaves(c.x + c.f * r * 0.5 * c.hh, c.y, 0.5, 8, { sp: 1.4, life: 44, rx: 0.8 }); });
  const gh = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 1.6 * WR, arc: 2.8, m: 1.0, lv: 'mid', kind: 'cut', col: GC }, o)) || [];
  const near = (c, n, R) => G.E.filter(e => e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - c.x, (e.y - c.y) * 1.5) < R * c.hh).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, n);
  /* ---------- 79 共用：落葉、燕形光 ---------- */
  MV2.leaves = (c, n) => Gl(() => KF().leaves(c.x + c.f * 0.7 * c.hh, c.y, 0.6, n, { sp: 1.2, life: 44, rx: 0.7, rz: 0.3 }));
  function bird(ctx, x, y, f, s, a) { const C = KF().PAL.gale; ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, -s * 0.2, 0, s * 3.2, s * 2.2, 0.5 * a); ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(s, 0, -s, 0); g.addColorStop(0, 'rgba(' + C.lite + ',' + a + ')'); g.addColorStop(0.3, 'rgba(' + C.mid + ',' + a + ')'); g.addColorStop(1, 'rgba(' + C.deep + ',' + 0.85 * a + ')'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.quadraticCurveTo(-0.2 * s, -0.3 * s, -s, -0.9 * s); ctx.quadraticCurveTo(-0.4 * s, -0.1 * s, -0.6 * s, 0); ctx.quadraticCurveTo(-0.4 * s, 0.1 * s, -s, 0.9 * s); ctx.quadraticCurveTo(-0.2 * s, 0.3 * s, s, 0); ctx.fill(); ctx.restore(); }
  MV2.swallow = (c, n) => { for (let i = 0; i < n; i++) { const x0 = c.x, f = c.f, y0 = c.y, dz = i * 0.25; VX.custom((o, ctx) => { const k = HH() * S(y0), q = o.t / o.life, x = x0 + f * KF().eo3(q) * 2.6 * k, y = y0 - (0.65 + dz + Math.sin(q * 3.14) * 0.3) * k; bird(ctx, x, y, f, 0.32 * k, 1 - q * q); }, 22, 'o',
      { step: (o, t) => { if (t % 3 === 0) Gl(() => KF().leaves(x0 + f * KF().eo3(t / 22) * 2.6 * c.hh, y0, 0.65 + dz, 1, { sp: 0.4, life: 26 })); } }); } };
  /* ---------- 招式：範圍放大（判定＋刀光）＋立架拒風牆 ---------- */
  const scale = o => { if (!o || typeof o !== 'object') return o; o = Object.assign({}, o); if (o.r) o.r *= WR; if (o.hr) o.hr *= WR; if (o.len) o.len *= WL; return o; };
  function wrapRun(def) { if (!def || def.__w) return; const r0 = def.run, c0 = def.counter;
    const W = fn => function (c) { const s0 = c.slash, h0 = c.hit; c.slash = o => s0.call(c, scale(o)); c.hit = o => h0.call(c, scale(o)); try { return fn.apply(this, arguments); } finally { c.slash = s0; c.hit = h0; } };
    def.run = W(r0); if (c0) def.counter = W(c0); def.__w = 1; }
  /* r3.183.0：風牆（實色直立風條，白天地面也看得見）、展翼（左右張開的羽狀風刃） */
  function windWall(f, life) { Gl(() => { const C = KF().PAL.gale; KF().add(life, 'o', (ctx, u) => { const k = HH() * S(H.y), a = Math.min(1, u / 5) * Math.min(1, (life - u) / 8), x0 = H.x + f * 0.65 * k; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const ph = ((u * 0.045 + i * 0.37) % 1), x = x0 + Math.sin(i * 2.1) * 0.16 * k + Math.sin(u * 0.3 + i) * 0.03 * k, y1 = H.y - (ph * 1.9) * k, L = (0.5 + (i % 3) * 0.18) * k, al = a * Math.sin(ph * Math.PI);
        for (const [w, col, q] of [[0.085, C.ink, 0.55], [0.05, C.mid, 0.95], [0.018, C.hot, 1]]) { ctx.strokeStyle = 'rgba(' + col + ',' + (q * al).toFixed(3) + ')'; ctx.lineWidth = Math.max(1, w * k); ctx.beginPath(); ctx.moveTo(x, y1); ctx.quadraticCurveTo(x + f * 0.1 * k, y1 - L * 0.5, x - f * 0.04 * k, y1 - L); ctx.stroke(); } } }); }); }
  function wings(c, life) { const f = c.f; Gl(() => { const C = KF().PAL.gale; KF().add(life, 'o', (ctx, u, q) => { const k = HH() * S(H.y), op = KF().eo3(Math.min(1, u / 8)), a = Math.min(1, u / 3) * Math.min(1, (life - u) / 10), x = H.x - f * 0.1 * k, y = H.y - 0.75 * k; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { const an = (-0.95 + i * 0.42) * op, L = (1.5 - Math.abs(i - 1.5) * 0.2) * k * (0.5 + 0.5 * op), ex = x + sd * Math.cos(an) * L, ey = y + Math.sin(an) * L * 0.75, mx = x + sd * Math.cos(an - 0.5) * L * 0.55, my = y + Math.sin(an - 0.5) * L * 0.5;
        for (const [w, col, al] of [[0.11, C.ink, 0.5], [0.065, C.mid, 0.95], [0.022, C.hot, 1]]) { ctx.strokeStyle = 'rgba(' + col + ',' + (al * a).toFixed(3) + ')'; ctx.lineWidth = Math.max(1, w * k * (1 - i * 0.08)); ctx.beginPath(); ctx.moveTo(x + sd * 0.12 * k, y); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke(); } } });
      KF().leaves(c.x, c.y, 0.7, 12, { sp: 2, life: 30, rx: 1.3 }); }); }
  const UPR = { run(c, t) { if (t === 2) { const f = c.f; windWall(f, 42); Gl(() => { const x = c.x + c.f * 0.6 * c.hh; KF().light(x, c.y, 1.2, 40, 0.5, 0.8); for (let i = 0; i < 3; i++) KF().leaves(x, c.y, 0.3 + i * 0.5, 6, { ang: Math.PI / 2, spread: 0.4, sp: 1.6, life: 40, stag: 20 }); KF().qi({ x, y: c.y, z: 0.9, ang: Math.PI / 2, len: 2.2, w: 0.16, dur: 4, life: 38, motes: 0 }); }); Gl(() => KF().add(42, 'o', (ctx, u) => { const k = HH() * S(H.y), a = Math.min(1, u / 6) * Math.min(1, (42 - u) / 8), x = H.x + f * 0.6 * k; ctx.globalCompositeOperation = 'screen';   // 立架拒：身前一道直立的柔光風牆＋葉片往上捲
          for (let i = 0; i < 5; i++) KF().spr(ctx, KF().PAL.gale.T.gm, x + Math.sin(u * 0.2 + i) * 0.06 * k, H.y - (0.2 + i * 0.28) * k, k * 0.5, k * 0.6, 0.35 * a); })); }
      if (t % 4 === 2 && t < 40) Gl(() => KF().leaves(H.x + c.f * 0.6 * c.hh, H.y, 0.1, 2, { ang: Math.PI / 2, spread: 0.3, sp: 1.6, life: 24 }));
      for (const p of G.PROJ) if (p.enemy && Math.abs(p.x - (H.x + c.f * 0.6 * c.hh)) < 30 && Math.abs(p.y - H.y) < 30) p.left = 0; if (t === 30) { c.a.mvx.hit = 1; MV2.onHit(c.a); } } };
  /* ---------- 技：旋風薙（Lv5 拉回改葉片氣流） ---------- */
  function pull(c, R) { const tx = c.x + c.f * 0.9 * c.hh; for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss || Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) > R * c.hh) continue; const x0 = e.x, y0 = e.y; let n = 0;
      Gl(() => KF().leaves(e.x, e.y, 0.4, 6, { ang: e.x < tx ? 0 : Math.PI, spread: 0.3, sp: 1.6, life: 18 }));
      VX.custom(() => {}, 9, 'o', { step: () => { if (n++ < 9 && e.st !== 'dead') { e.kb = 0; e.x += (tx - x0) / 9; e.y += (c.y - y0) / 9 * 0.5; } } }); } }
  const DU = { skill_senpu: { run(c, t) { const lv = c.a.mvx.lv || 1, r = (lv >= 3 ? 2.0 : 1.54) * WR; if (t === 9) { sweep(c, { a0: -2.9, a1: 1.5, r: r / WR, w: 0.55 }); gh(c, { r: r + 0.15, arc: 3.1, m: 1.4, lv: 'heavy', kb: 1.6 }); wide(1); vortex(c, 26, r, () => {}); Gl(() => KF().leaves(c.x, c.y, 0.5, 20, { sp: 2.4, life: 36, rx: 1.4 })); }
      if (lv >= 5 && t === 22) { Gl(() => KF().sweepDust(c.x, c.y, c.f, 2.2, -Math.PI, Math.PI, 8, 1)); pull(c, 2.6); } } } };
  /* 立架截飛：柔光風牆（期間持續），Lv5 擋下並反射遠程（同 92 版） */
  DU.special_upright = { run(c, t) { const lv = c.a.mvx.lv || 1; c.a.T = lv >= 3 ? 184 : 124; const a0 = c.a;
      if (t === 1) { const f = c.f; Gl(() => KF().add(190, 'o', (ctx, u) => { if (H.act !== a0) return; const k = HH() * S(H.y), a = Math.min(1, u / 6), x = H.x + f * 0.62 * k; ctx.globalCompositeOperation = 'screen';
          for (let i = 0; i < 6; i++) KF().spr(ctx, KF().PAL.gale.T.gm, x + Math.sin(u * 0.2 + i) * 0.07 * k, H.y - (0.15 + i * 0.26) * k, k * 0.5, k * 0.55, 0.32 * a); })); }
      if (t % 5 === 1) Gl(() => KF().leaves(H.x + c.f * 0.62 * c.hh, H.y, 0.1, 2, { ang: Math.PI / 2, spread: 0.3, sp: 1.6, life: 24 }));
      if (t === 30) { c.a.mvx.hit = 1; MV2.onHit(c.a); }
      if (lv < 5) return; const B = G.BOSS; if (!B || !B.proj) return;
      for (const p of B.proj) { if (p.dead || p.mine) continue; const dx = (p.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * c.hh && Math.abs(p.y - H.y) < 0.6 * c.hh) { p.dead = 1; const src = p.e; Gl(() => KF().burst(p.x, H.y, 0.6, 1.5));
          if (src && src.st !== 'dead') c.shoot('arrow', { m: 1.5, home: src, turn: 0.3, spd: 0.6, col: GC, lv: 'heavy' }); c.a.mvx.hit = 1; } } } };
  /* 奧義：大颶風（機制同原版；畫面改成柔光漏斗＋葉片與碎屑上捲＋底部揚塵，不再畫白色螺旋線） */
  DU.ultimate_daikufu = { run(c, t) { const lv = c.a.mvx.lv || 1, m = c.a.mvx, dur = 240, k = c.hh, SC2 = lv >= 3 ? 1.15 : 1;
      if (t === 1) { VX.dim(dur, 0.35); m.p = [c.x + c.f * 1.5 * k, c.y];
        Gl(() => KF().add(dur, 'o', (ctx, u) => { const [px, py] = m.p, kk = HH() * S(py), a = Math.min(1, u / 20) * Math.min(1, (dur - u) / 20), C = KF().PAL.gale; ctx.globalCompositeOperation = 'screen';
          for (let i = 0; i < 40; i++) { const q = i / 39, y = py - q * 4.6 * kk, r = (0.45 + 1.5 * q * q) * kk * SC2, an = u * 0.4 - q * 7 + i * 0.7; KF().spr(ctx, i % 4 ? C.T.gm : C.T.gl, px + Math.cos(an) * r, y + Math.sin(an) * r * 0.3, kk * (0.5 + q * 0.4), kk * 0.3, (0.22 + 0.2 * (1 - q)) * a); }
          KF().spr(ctx, C.T.gd, px, py - 2 * kk, kk * 2.6 * SC2, kk * 4.6, 0.25 * a); })); }
      if (t > 1 && t < dur && m.p) { const tg = MV2.near(c, 8); const tx = lv >= 3 ? H.x + c.f * 1.2 * k : tg ? tg.x : m.p[0], ty = lv >= 3 ? H.y : tg ? tg.y : m.p[1]; m.p[0] += (tx - m.p[0]) * 0.02; m.p[1] += (ty - m.p[1]) * 0.02;
        if (t % 3 === 0) Gl(() => KF().leaves(m.p[0], m.p[1], 0.2, 3, { ang: Math.PI / 2, spread: 0.9, sp: 2.4, rx: 0.9, life: 40 }));
        if (t % 6 === 0) Gl(() => { for (let j = 0; j < 3; j++) KF().smear({ x: m.p[0], y: m.p[1], f: j % 2 ? 1 : -1, cy: 0.3 + j * 1.25, r: (0.6 + j * 0.55) * SC2, sq: 0.3, a0: Math.PI, a1: -Math.PI, w: 0.28 + j * 0.06, dur: 6, life: 14, trail: 5, tier: 1, motes: 0 }); });   // 漏斗：三層旋轉環形風刃 if (t % 8 === 0) Gl(() => KF().puff(m.p[0], m.p[1], 0.8, 26));
        if (t % 15 === 0) { c.hit({ shape: 'circle', x: m.p[0], y: m.p[1], r: 1.8 * SC2, m: 0.45, lv: 'mid', kind: 'cut' }); for (const e of G.E) if (e.st !== 'dead' && !e.bb && !e.boss && Math.hypot(e.x - m.p[0], (e.y - m.p[1]) * 1.6) < 2.6 * k) { e.x += (m.p[0] - e.x) * 0.15; e.y += (m.p[1] - e.y) * 0.15; } }
        if (t % 40 === 20) Gl(() => KF().bolt(m.p[0] + rnd(-1, 1) * k, m.p[1] - 5 * k, m.p[0] + rnd(-0.6, 0.6) * k, m.p[1] - rnd(0.5, 2) * k, 10, 2, 1)); }
      if (lv >= 5 && t === dur && m.p) { Gl(() => { KF().puff(m.p[0], m.p[1], 2.4); KF().sweepDust(m.p[0], m.p[1], 1, 3, -Math.PI, Math.PI, 12, 1.6); KF().leaves(m.p[0], m.p[1], 0.5, 30, { sp: 3, life: 50, rx: 1 }); }); c.hit({ shape: 'circle', x: m.p[0], y: m.p[1], r: 3, m: 2.0, lv: 'hiden', kind: 'cut', kb: 3 }); VX.dim(6, 0.5); wide(2); shake(8); } } };
  /* ---------- 秘傳 ---------- */
  function vortex(c, life, R, tick) { const sk = []; Gl(() => KF().add(life, 'o', (ctx, u) => { const k = HH() * S(H.y), a = Math.min(1, u / 6) * Math.min(1, (life - u) / 10), C = KF().PAL.gale; ctx.globalCompositeOperation = 'screen';   // 旋風：跟著主角的多層柔光環＋葉片柱
      for (let j = 0; j < 4; j++) { const h = 0.2 + j * 0.45, rr = R * k * (0.75 + j * 0.12); for (let i = 0; i < 10; i++) { const an = u * (0.25 - j * 0.03) + i / 10 * TAU + j; KF().spr(ctx, C.T.gm, H.x + Math.cos(an) * rr, H.y - h * k + Math.sin(an) * rr * 0.3, k * 0.45, k * 0.3, 0.22 * a); } } }));
    VX.custom(() => {}, life, 'o', { step: (o, tt) => { if (tt % 4 === 0) Gl(() => KF().leaves(H.x, H.y, 0.2, 3, { sp: 1.8, rx: R * 0.8, rz: 0.2, life: 30 })); if (tt % 6 === 0) Gl(() => { for (let j = 0; j < 2; j++) KF().smear({ x: H.x, y: H.y, f: j ? 1 : -1, cy: 0.3 + j * 0.8, r: R * (0.85 + j * 0.25), sq: 0.32, a0: Math.PI, a1: -Math.PI, w: 0.36, dur: 6, life: 16, trail: 5, tier: 1, motes: 0 }); }); if (tick) tick(tt); } }); }
  const DH = {
    g_kuen(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t < r1) c.move(-0.03, 0); if (t === r1) { MV2.swallow(c, 3); gh(c, { m: 0.6, r: 1.9 }); }
      if (t === r2) { sweep(c, { a0: -2.9, a1: 1.5, r: 1.9, w: 0.55 }); gh(c, { r: 2.1 * WR, arc: 3.1, m: 1.0 }); }
      if (t === r3) { sweep(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.8, sq: 0.36, w: 0.55, dur: 7 }); wide(1.5); shake(5);
        vortex(c, 62, 1.8 * WR, tt => { if (tt % 15 === 0) c.hit({ shape: 'circle', r: 1.9 * WR, m: 0.4, lv: tt >= 45 ? 'hiden' : 'mid', kind: 'cut', col: GC }); }); } },
    g_ranyou(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r1) { sweep(c, { a0: -2.4, a1: 1.1, rot: -0.3 }); gh(c, { m: 0.8 }); }
      if (t === r2) { sweep(c, { a0: 1.2, a1: -1.9, sq: 0.9, r: 1.5 }); gh(c, { m: 0.8, launch: 24 }); }
      if (t === r3) { sweep(c, { a0: -2.9, a1: 1.5, r: 2.0, sq: 0.28, cy: 0.3, w: 0.6, dur: 7 }); Gl(() => KF().leaves(c.x + c.f * c.hh, c.y, 0.3, 40, { sp: 2.2, life: 60, rx: 1.4, rz: 0.4 })); gh(c, { r: 2.0 * WR, arc: 3.1, m: 1.6, lv: 'hiden', slow: 40 }); wide(1.5); VX.dim(5, 0.4); shake(6); } },
    g_fuujin(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t < r1) { c.move(0.09, 0); if (t % 3 === 0) c.ghost(8); if (t % 3 === 0) Gl(() => KF().leaves(c.x, c.y, 0.2, 2, { sp: 0.8, life: 24 })); } if (t === r1) { sweep(c, { r: 1.5 }); gh(c, { m: 0.7 }); }
      if (t === r2) { sweep(c, { a0: 1.2, a1: -1.9, sq: 1, r: 1.4 }); gh(c, { m: 0.8, launch: 40 }); }
      if (t > r2 && t < r3) H.hop = Math.sin((t - r2) / (r3 - r2) * Math.PI) * 0.5 * c.hh;
      if (t === r3) { H.hop = 0; const x = c.x + c.f * 0.9 * c.hh; sweep(c, { a0: -2.0, a1: 0.9, sq: 1, r: 1.7, w: 0.6, dur: 5 });
        Gl(() => { KF().puff(x, c.y, 2); KF().sweepDust(x, c.y, 1, 2.0, -Math.PI, Math.PI, 10, 1.5); for (let i = 0; i < 4; i++) KF().leaves(x, c.y, 0.2 + i * 0.6, 8, { ang: Math.PI / 2, spread: 0.6, sp: 2.2, life: 40, rx: 0.4 }); KF().light(x, c.y, 2, 26, 0.55, 1.2); });
        VX.dim(6, 0.45); wide(2); shake(7); stop(10); c.hit({ shape: 'circle', x, y: c.y, r: 1.6 * WR, m: 2.2, lv: 'hiden', kind: 'cut', kb: 1.4, col: GC }); } },
    g_sougetsu(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t < r1) c.move(0, (G.IN.my || 0.6) * 0.04); if (t === r1) { sweep(c, { rot: 0.2 }); gh(c, { m: 0.7 }); }
      if (t === r2) { sweep(c, { a0: -2.9, a1: 1.5, r: 1.8 }); gh(c, { r: 1.9 * WR, m: 0.9 }); }
      if (t === r3) { sweep(c, { a0: -2.9, a1: 1.5, r: 2.0, w: 0.65, rot: -0.25, dur: 7 }); sweep(c, { a0: -2.9, a1: 1.5, r: 2.0, w: 0.65, rot: 0.25, f: -c.f, dur: 7 });
        VX.dim(5, 0.4); wide(2); shake(6); c.hit({ shape: 'circle', r: 2.1 * WR, m: 2.0, lv: 'hiden', kind: 'cut', col: GC }); } },
    g_narukami(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r1) Gl(() => { KF().aura(Math.max(8, r2 - r1)); KF().leaves(c.x, c.y, 0.4, 8, { sp: 1, rx: 0.8, life: 30 }); });
      if (t === r2) { sweep(c, { a0: -2.9, a1: 1.5, r: 1.8 }); gh(c, { r: 1.9 * WR, m: 0.9 }); }
      if (t === r3) { sweep(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.7, sq: 0.36, dur: 7 }); c.hit({ shape: 'circle', r: 1.8 * WR, m: 0.8, lv: 'mid', kind: 'cut', col: GC });
        near(c, 3, 4).forEach((e, i) => c.later(6 + i * 7, () => { if (e.st === 'dead') return; const k = HH() * S(e.y); Gl(() => { KF().bolt(e.x + rnd(-0.3, 0.3) * k, e.y - 5.5 * k, e.x, e.y - 0.2 * k, 18, 4, 2); KF().puff(e.x, e.y, 1); KF().light(e.x, e.y, 1.2, 18, 0.6, 0.6); });
          G.damageOni(e, 1.4 * c.mul, true, false); VX.impact(e, 'hiden', 'cut'); e.stun = Math.max(e.stun || 0, 20); c.a.mvx.hit = 1; shake(5); })); } }
  };
  /* ====================== r3.183.0 秘傳演出重做（機制、傷害照舊，外加演出層） ======================
   * 薙刀＝風、大範圍、連綿不斷：畫面沉入夜色，鏡頭拉遠，整個畫面被風和葉片捲進去。主色青碧。 */
  const shot = (c, x, y, up, zoom, T) => { G.CAMFOCUS = { x, y: y - up * c.hh, until: G.t + T }; G.CAMZOOM = { k: zoom, until: G.t + T }; };
  const lift = (e, h) => G.KT && G.KT.lift && G.KT.lift(e, h);
  const init = (c, T, dim) => { const m = c.a.mvx; if (m.cin) return false; m.cin = 1; VX.dim(T, dim); Gl(() => KF().light(c.x, c.y, 3.2, T, 0.3)); return true; };
  const foesAt = (x, y, R) => G.E.filter(e => e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - x, (e.y - y) * 1.5) < R);
  /* 龍捲風：貫穿畫面高度的風柱（多層旋轉的漸細風帶＋葉片） */
  function tornado(x, y, Hh, life) { Gl(() => { const C = KF().PAL.gale; KF().add(life, 'o', (ctx, u) => { const k = HH() * S(y), a = Math.min(1, u / 8) * Math.min(1, (life - u) / 12), N = 11; ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < N; i++) { const q = i / (N - 1), yy = y - q * Hh * k, w = k * (0.45 + q * 1.5) * (0.9 + 0.1 * Math.sin(u * 0.2 + i)), ox = Math.sin(u * 0.12 + i * 0.7) * 0.18 * k * q; KF().spr(ctx, C.T.gd, x + ox, yy, w * 2.4, k * 0.9, 0.5 * a);
        ctx.strokeStyle = 'rgba(' + (i % 2 ? C.lite : C.mid) + ',' + (0.75 * a).toFixed(3) + ')'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, k * 0.11 * (1 - q * 0.4)); const a0 = (u * 0.42 + i * 1.3) % TAU; ctx.beginPath(); ctx.ellipse(x + ox, yy, w, w * 0.22, 0, a0, a0 + 2.2); ctx.stroke(); } });
      for (let i = 0; i < 5; i++) KF().leaves(x, y, 0.4 + i * Hh / 5, 8, { sp: 2, life: life, rx: 1.2, stag: life * 0.6 }); }); }
  /* 風神：身後巨大的青色剪影（只有輪廓感的半透明巨像），跟著主角一起劈下 */
  const GOD = new Map();
  function godImg(u, fr, tint) { const key = u.key + ':' + (fr[7] || 0) + ':' + fr[0] + ',' + fr[1]; let cv = GOD.get(key); if (cv) return cv; const w = fr[2], h = fr[3], P = 6; cv = document.createElement('canvas'); cv.width = w + P * 2; cv.height = h + P * 2; const g = cv.getContext('2d'), rim = tint(u, fr, '185,255,225'), body = tint(u, fr, '30,150,125');
    for (let i = 0; i < 8; i++) g.drawImage(rim, P + Math.cos(i * 0.785) * 2.2, P + Math.sin(i * 0.785) * 2.2);   /* 外擴一圈當輪廓 */
    g.globalCompositeOperation = 'destination-out'; g.drawImage(rim, P, P); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.34; g.drawImage(body, P, P); g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height); if (GOD.size > 40) GOD.clear(); GOD.set(key, cv); return cv; }
  function windGod(c, life, sc) { const u = G.WPN.unit && G.WPN.unit(), tint = G.KT && G.KT.tintOf; if (!u || !tint) return; const f = c.f;
    KF().add(life, 'g', (ctx, tu) => { const fr = G.heroFrame && G.heroFrame(); if (!fr) return; let im; try { im = godImg(u, fr, tint); } catch (x) { return; }
      const k = HH() * S(H.y), s = k * G.WPN.actK(H.act && H.act.name) / (u.refH || 130) * sc, a = Math.min(1, tu / 8) * Math.min(1, (life - tu) / 8), x = H.x - f * 0.7 * k, y = H.y + 0.5 * k; ctx.save(); if (f < 0) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
      ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, KF().PAL.gale.T.gm, x, y - 2.4 * k, 7 * k, 6 * k, 0.22 * a);
      ctx.globalAlpha = a; ctx.drawImage(im, x - (fr[4] + 6) * s, y - (fr[5] + 6) * s, im.width * s, im.height * s); ctx.restore(); }); }
  /* 弦月：會旋轉、可移動的青色月牙 */
  function crescent(get, life) { Gl(() => { const C = KF().PAL.gale; KF().add(life, 'o', (ctx, u) => { const [x, y, R, rot, a] = get(u); if (a <= 0) return; ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, x, y, R * 3.4, R * 3.4, 0.4 * a); ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.rotate(rot);
      const moon = (r, off, col, al) => { ctx.fillStyle = 'rgba(' + col + ',' + (al * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true); ctx.ellipse(0, 0, r * off, r, 0, Math.PI / 2, -Math.PI / 2, false); ctx.closePath(); ctx.fill(); };
      moon(R * 1.06, 0.5, C.ink, 0.75); moon(R, 0.58, C.mid, 1); moon(R * 0.96, 0.74, C.lite, 1); moon(R * 0.93, 0.88, C.hot, 0.95); }); }); }
  /* 葉刃：四面八方射向目標 */
  function leafBlades(x, y, n, R, life) { const k = HH() * S(y), P = []; for (let i = 0; i < n; i++) { const an = Math.random() * TAU; P.push({ an, r: R * k * (0.8 + Math.random() * 0.5), d: Math.random() * life * 0.4 }); }
    Gl(() => { const C = KF().PAL.gale; KF().add(life + 6, 'o', (ctx, u) => { for (const p of P) { const q = Math.min(1, Math.max(0, (u - p.d) / (life * 0.6))); if (q <= 0 || q >= 1) continue; const e = q * q, r = p.r * (1 - e), px = x + Math.cos(p.an) * r, py = y - 0.55 * k + Math.sin(p.an) * r * 0.5, L = k * 0.42, w = k * 0.05; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(-Math.sin(p.an) * 0.5, -Math.cos(p.an)));
          for (const [ww, col, al] of [[w * 1.8, C.ink, 0.6], [w, C.mid, 0.95], [w * 0.4, C.hot, 1]]) { ctx.fillStyle = 'rgba(' + col + ',' + al + ')'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -ww * 2, L, 0); ctx.quadraticCurveTo(0, ww * 2, -L, 0); ctx.fill(); } ctx.restore(); } }); }); }
  function leafRain(life, n) { const P = []; for (let i = 0; i < n; i++) P.push([Math.random(), Math.random(), 0.6 + Math.random() * 0.8, Math.random() * TAU]); const C = KF().PAL.gale;
    KF().add(life, 'o', (ctx, u) => { const a = Math.min(1, u / 10) * Math.min(1, (life - u) / 10); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height, L = Hh * 0.022;
      for (const p of P) { const x = ((p[0] + u * 0.004 * p[2]) % 1) * W, y = ((p[1] + u * 0.011 * p[2]) % 1) * Hh, r = p[3] + u * 0.12 * p[2], fl = Math.abs(Math.cos(u * 0.15 + p[3])); ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(1, 0.25 + 0.75 * fl);
        ctx.fillStyle = 'rgba(' + (fl > 0.6 ? C.lite : C.mid) + ',' + (0.85 * a * p[2] / 1.4).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(-L * p[2], 0); ctx.quadraticCurveTo(0, -L * 0.6 * p[2], L * p[2], 0); ctx.quadraticCurveTo(0, L * 0.6 * p[2], -L * p[2], 0); ctx.fill(); ctx.restore(); } }); }
  /* 烏雲：畫面上緣壓下來的雲層 */
  function clouds(life) { KF().add(life, 'g', (ctx, u) => { const a = Math.min(1, u / 14) * Math.min(1, (life - u) / 12); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height, g = ctx.createLinearGradient(0, 0, 0, Hh * 0.55); g.addColorStop(0, 'rgba(60,84,96,' + 0.85 * a + ')'); g.addColorStop(0.6, 'rgba(30,52,60,' + 0.45 * a + ')'); g.addColorStop(1, 'rgba(20,40,48,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh * 0.55);
      ctx.fillStyle = 'rgba(120,160,170,' + 0.16 * a + ')'; for (let i = 0; i < 9; i++) { const x = ((i * 0.137 + u * 0.0016) % 1.2 - 0.1) * W, y = Hh * (0.05 + (i % 4) * 0.055), r = Hh * (0.1 + (i % 3) * 0.04); ctx.beginPath(); ctx.ellipse(x, y, r * 2.2, r * 0.6, 0, 0, TAU); ctx.fill(); } }); }
  const strike = (c, x, y, w) => Gl(() => { const k = c.hh; KF().bolt(x + rnd(-0.4, 0.4) * k, y - 6.5 * k, x, y - 0.2 * k, 18, w || 4, 2); KF().puff(x, y, 1); KF().light(x, y, 1.4, 18, 0.7, 0.6); });
  const DH0 = Object.assign({}, DH);
  DH.g_kuen = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 70, 0.9)) shot(c, c.x + c.f * 1.2 * k, c.y, 0.7, 1.45, r3);
    DH0.g_kuen(c, t, C);
    if (t === r2) for (const e of foesAt(c.x + c.f * 1.4 * k, c.y, 3 * k)) if (!e.boss && !e.bb) { e.x += (c.x + c.f * 1.3 * k - e.x) * 0.6; e.y += (c.y - e.y) * 0.6; }   /* 大扇掃把妖怪掃到一起 */
    if (t === r3) { c.a.T = Math.max(c.a.T, r3 + 68); { const ns = near(c, 4, 4.5); m.tx = ns.length ? ns.reduce((q, e) => q + e.x, 0) / ns.length : c.x + c.f * 1.2 * k; } shot(c, (m.tx + c.x) / 2, c.y, 2.2, 2.5, 74); tornado(m.tx, c.y, 5.6, 70); for (const e of foesAt(m.tx, c.y, 2.4 * k)) lift(e, 2.2);   /* 龍捲風升起，鏡頭拉遠抬高 */
      for (let i = 1; i <= 4; i++) c.later(i * 14, () => { for (const e of foesAt(m.tx, c.y, 2.6 * k)) { if (!e.boss && !e.bb) e.x += (m.tx - e.x) * 0.3; if (i < 4) lift(e, 2.0); G.damageOni(e, 0.35 * c.mul, false); } shake(4); });
      c.later(64, () => { for (const e of foesAt(m.tx, c.y, 3 * k)) { if (e.lz > 0) e.lzv = -14; G.damageOni(e, 1.2 * c.mul, true); } Gl(() => { KF().puff(m.tx, c.y, 3); KF().leaves(m.tx, c.y, 0.6, 30, { sp: 3, life: 50, rx: 1.5 }); }); shake(11); stop(10); }); } };
  DH.g_ranyou = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 30, 0.9)) { const e = near(c, 1, 5)[0]; m.px = e ? e.x : c.x + c.f * 1.4 * k; m.py = e ? e.y : c.y; shot(c, m.px, m.py, 0.9, 1.6, T + 20); Gl(() => leafRain(r3 + 8, 46)); }   /* 滿天落葉 */
    DH0.g_ranyou(c, t, C);
    [r1, r2].forEach((r, i) => { if (t === r) Gl(() => { KF().qi({ x: c.x + c.f * 1.2 * k, y: c.y, z: 0.55, ang: (i ? 0.35 : -0.35) * c.f, len: 4.6, w: 0.1, dur: 2, life: 16, motes: 0 }); KF().leaves(c.x + c.f * 1.2 * k, c.y, 0.5, 14, { sp: 2.4, life: 30, rx: 1.6 }); }); });   /* 每一掃帶一道葉片風帶 */
    if (t === r3) { shot(c, m.px, m.py, 0.7, 1.3, 40); c.later(8, () => leafBlades(m.px, m.py, 46, 4.6, 16)); c.later(22, () => { for (const e of foesAt(m.px, m.py, 2.2 * k)) { G.damageOni(e, 1.2 * c.mul, true); Gl(() => KF().burst(e.x, e.y, 0.55 * (e.ratio || 1), 2.4)); } Gl(() => { for (let i = 0; i < 4; i++) KF().qi({ x: m.px, y: m.py, z: 0.6, ang: i * Math.PI / 4, len: 4.4, w: 0.08, dur: 2, life: 14, motes: 2 }); KF().leaves(m.px, m.py, 0.6, 36, { sp: 3.2, life: 44, rx: 1.4 }); }); shake(9); stop(10); }); } };   /* 所有葉片變成刃，從四面八方射向妖怪 */
  DH.g_fuujin = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, T = c.a.T;
    if (init(c, T + 20, 0.9)) shot(c, c.x + c.f * 1.6 * k, c.y, 0.7, 1.4, r2);
    DH0.g_fuujin(c, t, C);
    if (t === r2) { shot(c, c.x + c.f * 0.6 * k, c.y, 2.3, 1.95, r3 - r2 + 2); windGod(c, r3 - r2 + 22, 4.6); for (const e of foesAt(c.x + c.f * k, c.y, 2 * k)) lift(e, 1.8); }   /* 挑飛＋躍起：身後出現風神 */
    if (t > r2 && t < r3) H.hop = Math.sin((t - r2) / (r3 - r2) * Math.PI * 0.5) * 2.2 * k * (t > r3 - 3 ? (r3 - t) / 3 : 1);
    if (t === r3) { const x = c.x + c.f * 0.9 * k; shot(c, x, c.y, 0.9, 1.5, 40); Gl(() => { KF().qi({ x, y: c.y, z: 2.8, ang: Math.PI / 2, len: 6, w: 0.32, dur: 2, life: 20, motes: 10 }); for (let i = 1; i <= 5; i++) c.later(i * 2, () => Gl(() => { for (const sd of [-1, 1]) { KF().puff(x + sd * i * 0.7 * k, c.y, 1.4); KF().leaves(x + sd * i * 0.7 * k, c.y, 0.3, 5, { sp: 2, life: 34 }); } })); KF().crack && KF().crack(x, c.y, 2.2, 70, true); });
      for (const e of foesAt(x, c.y, 2.4 * k)) if (e.lz > 0) e.lzv = -14; shake(13); } };   /* 與風神同時劈下：從天到地的風壓 */
  DH.g_sougetsu = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 50, 0.9)) { const e = near(c, 1, 5)[0]; m.px = e ? e.x : c.x + c.f * 1.5 * k; m.py = e ? e.y : c.y; shot(c, m.px, m.py, 1.0, 1.7, T + 50); }
    DH0.g_sougetsu(c, t, C);
    if (t === r2) { const px = m.px, py = m.py, L = (T - r2) + 40, M = r3 - r2 + 26;   /* 左右各一輪弦月：停住 → 旋轉合攏 → 合成滿月炸開 */
      for (const sd of [-1, 1]) crescent(u => { const q = Math.min(1, Math.max(0, (u - 10) / (M - 10))), e = q * q, d = (2.9 - 2.5 * e) * k, a = u > M ? 0 : Math.min(1, u / 5); return [px + sd * d, py - 1.1 * k, 1.25 * k, (sd > 0 ? Math.PI : 0) + sd * u * (0.05 + 0.5 * e), a]; }, M + 2);
      for (let i = 1; i <= 3; i++) c.later(10 + i * Math.round((M - 10) / 4), () => { for (const e of foesAt(px, py, 2.8 * k)) { if (!e.boss && !e.bb) e.x += (px - e.x) * 0.35; G.damageOni(e, 0.4 * c.mul, false); Gl(() => KF().burst(e.x, e.y, 0.6, 1.2)); } shake(3); });
      c.later(M, () => { shot(c, px, py, 1.0, 1.25, 30); Gl(() => { KF().add(22, 'o', (ctx, u, q) => { const R = 1.5 * k * (0.7 + 0.5 * KF().eo3(q)), a = 1 - q, g = ctx.createRadialGradient(px, py - 1.1 * k, R * 0.1, px, py - 1.1 * k, R); g.addColorStop(0, 'rgba(240,255,250,' + a + ')'); g.addColorStop(0.6, 'rgba(150,235,205,' + 0.9 * a + ')'); g.addColorStop(1, 'rgba(25,120,100,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py - 1.1 * k, R, 0, TAU); ctx.fill(); });
          for (let i = 0; i < 6; i++) KF().qi({ x: px, y: py, z: 1.1, ang: i * Math.PI / 6, len: 5, w: 0.09, dur: 2, life: 16, motes: 3 }); KF().puff(px, py, 3); KF().leaves(px, py, 1.1, 30, { sp: 3, life: 46 }); });
        for (const e of foesAt(px, py, 2.6 * k)) G.damageOni(e, 1.4 * c.mul, true); shake(12); stop(12); }); } };
  DH.g_narukami = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, T = c.a.T;
    if (init(c, T + 40, 0.9)) { shot(c, c.x + c.f * 0.8 * k, c.y, 1.6, 1.7, T + 40); clouds(T + 44); }   /* 烏雲聚集 */
    DH0.g_narukami(c, t, C);
    if (t > r1 && t < r2 && t % 5 === 0) Gl(() => KF().bolt(c.x + rnd(-3, 3) * k, c.y - 5.6 * k, c.x + rnd(-3, 3) * k, c.y - 4.2 * k, 6, 1.6, 1));   /* 雲裡的悶雷 */
    if (t === r2) for (let i = 0; i < 5; i++) c.later(i * 2, () => { const an = -1.2 + i * 0.6, x = c.x + Math.cos(an) * c.f * 2.1 * k, y = c.y + Math.sin(an) * 0.7 * k; strike(c, x, y, 3); for (const e of foesAt(x, y, 0.9 * k)) G.damageOni(e, 0.35 * c.mul, false); shake(3); });   /* 雷沿著刀光的弧線一路炸開 */
    if (t === r3) c.later(8, () => { shot(c, c.x, c.y, 1.9, 1.95, 40); for (let i = 0; i < 9; i++) { const an = i * TAU / 9, x = c.x + Math.cos(an) * 2.5 * k, y = c.y + Math.sin(an) * 0.85 * k; strike(c, x, y, 5); } for (const e of foesAt(c.x, c.y, 3.2 * k)) { G.damageOni(e, 0.9 * c.mul, true); e.stun = Math.max(e.stun || 0, 30); } shake(14); stop(12); }); };   /* 一圈落雷同時打下 */
  /* 技能補特效：千鳥＝一群鳥形風刃往前飛散；旋風薙＝身周旋風與葉片；立架拒＝風牆加厚 */
  function fxSkills() { const U = MV2.U.naginata, D = MV2.D.naginata; if (!U) return;
    const add = (d, fn) => { if (!d || d.__fx3) return; const r0 = d.run; d.__fx3 = 1; d.run = function (c, t) { const r = r0.apply(this, arguments); try { fn(c, t); } catch (x) {} return r; }; };
    if (D) add(D.wing_brace, (c, t) => { if (t === 2) wings(c, 28); });
    add(U.skill_chidori, (c, t) => { if (t === 2 || t === 12 || t === 22) { MV2.swallow(c, 3); Gl(() => { KF().qi({ x: c.x + c.f * 1.6 * c.hh, y: c.y, z: 0.6, ang: 0, len: 3.4, w: 0.09, dur: 2, life: 12, motes: 4 }); KF().leaves(c.x + c.f * c.hh, c.y, 0.6, 8, { sp: 2.2, life: 26 }); }); } }); }
  /* ---------- 掛上（每格對照參照，必要時補回） ---------- */
  const BASE = {}, WRP = {};
  function patch() { const D = MV2.D.naginata, U = MV2.U.naginata, L = MV2.HD.naginata;
    if (D) { for (const k in D) wrapRun(D[k]); if (D.upright_deny && D.upright_deny.run !== UPR.__r) { const d = D.upright_deny; d.__w = 0; d.run = UPR.run; wrapRun(d); UPR.__r = d.run; } }
    if (U) for (const k in DU) { const d = U[k]; if (d && d.run !== DU[k].run) d.run = DU[k].run; }
    if (L) for (const h of L) { const f = DH[h.id]; if (!f || h.run === WRP[h.id]) continue; const base = h.run; BASE[h.id] = base;
      WRP[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) f(c, t, C); else base.call(this, c, t); }; } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); patch(); try { fxSkills(); } catch (x) {} };
})();
