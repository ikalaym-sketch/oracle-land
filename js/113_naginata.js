/* ==========================================================================
 * 神諭之地 重製版 — 113_naginata.js
 * Version : r3.76.0  (2026-11-24)
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
  const UPR = { run(c, t) { if (t === 2) { const f = c.f; Gl(() => KF().add(42, 'o', (ctx, u) => { const k = HH() * S(H.y), a = Math.min(1, u / 6) * Math.min(1, (42 - u) / 8), x = H.x + f * 0.6 * k; ctx.globalCompositeOperation = 'screen';   // 立架拒：身前一道直立的柔光風牆＋葉片往上捲
          for (let i = 0; i < 5; i++) KF().spr(ctx, KF().PAL.gale.T.gm, x + Math.sin(u * 0.2 + i) * 0.06 * k, H.y - (0.2 + i * 0.28) * k, k * 0.5, k * 0.6, 0.35 * a); })); }
      if (t % 4 === 2 && t < 40) Gl(() => KF().leaves(H.x + c.f * 0.6 * c.hh, H.y, 0.1, 2, { ang: Math.PI / 2, spread: 0.3, sp: 1.6, life: 24 }));
      for (const p of G.PROJ) if (p.enemy && Math.abs(p.x - (H.x + c.f * 0.6 * c.hh)) < 30 && Math.abs(p.y - H.y) < 30) p.left = 0; if (t === 30) { c.a.mvx.hit = 1; MV2.onHit(c.a); } } };
  /* ---------- 技：旋風薙（Lv5 拉回改葉片氣流） ---------- */
  function pull(c, R) { const tx = c.x + c.f * 0.9 * c.hh; for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss || Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) > R * c.hh) continue; const x0 = e.x, y0 = e.y; let n = 0;
      Gl(() => KF().leaves(e.x, e.y, 0.4, 6, { ang: e.x < tx ? 0 : Math.PI, spread: 0.3, sp: 1.6, life: 18 }));
      VX.custom(() => {}, 9, 'o', { step: () => { if (n++ < 9 && e.st !== 'dead') { e.kb = 0; e.x += (tx - x0) / 9; e.y += (c.y - y0) / 9 * 0.5; } } }); } }
  const DU = { skill_senpu: { run(c, t) { const lv = c.a.mvx.lv || 1, r = (lv >= 3 ? 2.0 : 1.54) * WR; if (t === 9) { sweep(c, { a0: -2.9, a1: 1.5, r: r / WR, w: 0.55 }); gh(c, { r: r + 0.15, arc: 3.1, m: 1.4, lv: 'heavy', kb: 1.6 }); wide(1); }
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
  /* ---------- 掛上（每格對照參照，必要時補回） ---------- */
  const BASE = {}, WRP = {};
  function patch() { const D = MV2.D.naginata, U = MV2.U.naginata, L = MV2.HD.naginata;
    if (D) { for (const k in D) wrapRun(D[k]); if (D.upright_deny && D.upright_deny.run !== UPR.__r) { const d = D.upright_deny; d.__w = 0; d.run = UPR.run; wrapRun(d); UPR.__r = d.run; } }
    if (U) for (const k in DU) { const d = U[k]; if (d && d.run !== DU[k].run) d.run = DU[k].run; }
    if (L) for (const h of L) { const f = DH[h.id]; if (!f || h.run === WRP[h.id]) continue; const base = h.run; BASE[h.id] = base;
      WRP[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) f(c, t, C); else base.call(this, c, t); }; } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); patch(); };
})();
