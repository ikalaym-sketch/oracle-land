/* ==========================================================================
 * 神諭之地 重製版 — 79_mv_pole.js
 * Version : r3.34.0  (2026-11-17)
 * 變更    : r3.34.0 新增。槍、薙刀的 12 招（規格 VFX_SPEC v2.1 第四節）。
 *           槍：直線突刺（錐形光＋槍尖金點＋速度線），刺擊命中＝光點＋貫穿速度線；橫掃用細刀幕。
 *           薙刀：長弧刀幕（青碧）＋風切線，迴旋＝環形刀幕；長柄攻擊範圍大、弧度大。
 * 依賴    : 76_vfx、77_moves（G.MV2）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H; if (!MV2 || !VX) return;
  const YC = { col: '190,215,255', edge: '255,255,255', tip: '255,225,140' }, NC = { col: '150,235,205', edge: '235,255,248' };
  const th = (c, o) => c.thrust(Object.assign({ len: 1.8, w: 0.22, cy: 0.55, ext: 3, life: 12, col: YC.col, edge: YC.edge, tip: YC.tip, lv: 'light' }, o));
  const ys = (c, o) => c.slash(Object.assign({ r: 1.4, w: 0.18, sq: 0.42, sw: 5, life: 14, col: YC.col, edge: YC.edge, a0: -2.2, a1: 1.0 }, o));
  const ns = (c, o) => { c.slash(Object.assign({ r: 1.5, w: 0.34, sq: 0.42, sw: 6, life: 16, col: NC.col, edge: NC.edge, a0: -2.4, a1: 1.1, arc: 2.6 }, o)); if (o.wind !== false) VX.wind({ x: c.x, y: c.y, r: (o.r || 1.5) * 0.9, n: 4, life: 18, col: '200,255,235', face: c.f, spin: 0.3 }); };
  const ring = (c, o) => c.slash(Object.assign({ a0: -Math.PI, a1: Math.PI * 1.05, sq: 0.4, sw: 8, life: 18, trail: 4, shape: 'circle', hr: (o.r || 1.3) + 0.15 }, o));
  const mark = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };
  /* ---------------- 槍 ---------------- */
  MV2.reg('yari', {
    long_pierce: { n: '長穿', cat: '起', T: 30, cx: 22, run(c, t) { if (t <= 10) c.move(0.2, 0); if (t % 3 === 0 && t < 10) c.ghost(10); if (t === 9) { th(c, { len: 1.9, m: 1.3, lv: 'mid' }); VX.streak({ x: c.x, y: c.y, face: c.f, len: 1.4, n: 5, life: 8 }); } } },
    tip_probe: { n: '探尖', cat: '起', T: 26, cx: 19, run(c, t) { if (t === 5) th(c, { len: 1.6, w: 0.16, m: 0.6, ang: -0.04 }); if (t === 11) th(c, { len: 1.7, w: 0.16, m: 0.7, ang: 0.04 }); } },
    intercept_thrust: { n: '攔刺', cat: '起', T: 30, cx: 23, run(c, t) { if (t === 3) VX.glow({ x: c.x + c.f * 0.5 * c.hh, y: c.y, z: 0.55, r: 0.35, col: '220,230,255', life: 8 }); if (t === 10) th(c, { len: 1.6, m: 1.0, kb: 1.2, lv: 'mid' }); } },
    double_thrust: { n: '雙刺', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 6) th(c, { len: 1.8, m: 0.7, ang: -0.08, cy: 0.62 }); if (t === 12) th(c, { len: 1.9, m: 0.8, ang: 0.06, cy: 0.48 }); if (t < 14) c.move(0.03, 0); } },
    side_gap: { n: '側隙', cat: '連', T: 30, cx: 23, run(c, t) { if (t <= 9) c.move(0.02, (G.IN.my || 0.6) * 0.08); if (t === 3) c.ghost(10); if (t === 10) th(c, { len: 1.5, m: 1.1 }); } },
    rising_point: { n: '昇點', cat: '連', T: 32, cx: 25, run(c, t) { if (t === 8) { th(c, { len: 1.3, ang: -0.9, m: 1.1, launch: 50, lv: 'mid', hw: 0.6 }); ys(c, { a0: 1.0, a1: -1.9, sq: 1, r: 1.2, w: 0.14, m: 0 }); VX.spark({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 0.9 * c.hh, n: 8, up: 4, spd: 3, col: '220,235,255' }); } } },
    ground_sweep: { n: '地掃', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 6) { ring(c, { r: 1.3, w: 0.16, cy: 0.18, col: YC.col, edge: YC.edge, m: 0.9, slow: 30 }); VX.smoke({ x: c.x, y: c.y, z: 4, n: 4, r: 0.18, life: 26, a: 0.3, col: '180,165,140' }); } } },
    shaft_break: { n: '破柄', cat: '收', T: 36, cx: 30, run(c, t) { if (t === 1) VX.glow({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.55, r: 0.3, col: '255,225,140', life: 10 }); if (t > 4 && t <= 11) { c.move(0.13, 0); if (t % 3 === 0) c.ghost(10); } if (t === 12) { th(c, { len: 1.6, w: 0.32, m: 1.4, def: 20, lv: 'heavy', ext: 2 }); c.later(2, () => VX.shard({ x: c.x + c.f * 1.2 * c.hh, y: c.y, z: 0.55, n: 8, col: '200,215,240' })); } if (t >= 12 && t < 16) c.move(0.06, 0); } },
    focused_point: { n: '凝點', cat: '收', T: 44, cx: 38, run(c, t) { if (t === 1) VX.custom((o, ctx) => { const s = G.SC.depth(H.y), k = G.HERO_H * s, q = o.t / o.life, x = H.x + o.f * 1.1 * k, y = H.y - 0.55 * k; ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 12; i++) { const a = i * 0.52 + o.t * 0.2, r = (1 - q) * k * 0.7; ctx.fillStyle = 'rgba(255,225,150,' + (0.3 + 0.6 * q) + ')'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 1.8 * s, 0, 6.283); ctx.fill(); } ctx.restore(); }, 20, 'o', { f: c.f });
        if (t === 21) { th(c, { len: 2.5, w: 0.3, m: 2.2, lv: 'heavy', ext: 2, life: 16, crit: Math.random() < 0.4 }); VX.ring({ x: c.x + c.f * 2.3 * c.hh, y: c.y, z: 0.55, sq: 1, r0: 0.1, r1: 0.6, life: 12, col: '255,230,160', lw: 0.05 }); G.SC.shake = 4; } } },
    pulling_retreat: { n: '拉退', cat: '收', T: 34, cx: 28, run(c, t) { if (t === 6) { const hs = c.hit({ shape: 'line', len: 1.9, w: 0.35, m: 1.0, lv: 'mid', kind: 'pierce' }); th(c, { len: 1.8, m: 0 }); for (const e of hs) e.x += (H.x + c.f * 0.6 * c.hh - e.x) * 0.5; }
        if (t > 8 && t <= 18) c.move(-0.1, 0); if (t === 10) c.ghost(10); } },
    fixed_line: { n: '定線', cat: '架', T: 40, cx: 34, run(c, t) { if (t === 2) VX.custom((o, ctx) => { const s = G.SC.depth(H.y), k = G.HERO_H * s, a = 1 - o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,220,255,' + 0.8 * a + ')'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(H.x + o.f * 0.2 * k, H.y - 0.5 * k); ctx.lineTo(H.x + o.f * 1.6 * k, H.y - 0.5 * k); ctx.stroke(); ctx.restore(); }, 36, 'o', { f: c.f }); if (t === 30) mark(c); },
      counter(c, e) { mark(c); th(c, { len: 1.8, m: 1.4, lv: 'heavy', kb: 1.5 }); } },
    shaft_gate: { n: '柄門', cat: '架', T: 34, cx: 28, run(c, t) { if (t === 2) VX.glow({ x: c.x + c.f * 0.3 * c.hh, y: c.y, z: 0.55, r: 0.4, col: '210,225,255', life: 10 }); if (t === 26) mark(c); },
      counter(c, e) { mark(c); ring(c, { r: 1.25, w: 0.16, col: YC.col, edge: YC.edge, m: 1.3, lv: 'heavy', kb: 1.2 }); } }
  });
  /* ---------------- 薙刀 ---------------- */
  MV2.reg('naginata', {
    gliding_wing: { n: '滑翼', cat: '起', T: 30, cx: 22, run(c, t) { if (t <= 12) c.move(0.15, 0); if (t % 3 === 0 && t < 12) c.ghost(10); if (t === 9) ns(c, { a0: -1.6, a1: 0.9, m: 1.2, r: 1.3 }); } },
    side_wave: { n: '側浪', cat: '起', T: 30, cx: 22, run(c, t) { if (t <= 9) c.move(0, (G.IN.my || 0.6) * 0.07); if (t === 9) { ns(c, { m: 1.0, r: 1.4, sq: 0.55, rot: 0.15 }); c.later(3, () => ns(c, { m: 0, r: 1.25, sq: 0.35, rot: -0.1, wind: false, w: 0.2 })); } } },
    retreat_swallow: { n: '退燕', cat: '起', T: 30, cx: 22, inv: 8, run(c, t) { if (t > 6 && t <= 16) c.move(-0.1, 0); if (t === 5) { ns(c, { a0: -1.8, a1: 0.8, sq: 0.7, rot: -0.3, m: 1.0, r: 1.35 }); swallow(c, 1); } } },
    wide_leaf: { n: '寬葉', cat: '連', T: 32, cx: 25, run(c, t) { if (t === 8) { ns(c, { a0: -2.8, a1: 1.4, m: 1.15, r: 1.5, arc: 3.1, sw: 7 }); leaves(c, 8); } } },
    fan_sweep: { n: '扇掃', cat: '連', T: 34, cx: 27, run(c, t) { if (t === 6) ns(c, { m: 0.65, r: 1.45 }); if (t === 14) ns(c, { a0: 1.1, a1: -2.4, m: 0.7, r: 1.55, sq: 0.38 }); } },
    around_diagonal: { n: '環斜', cat: '連', T: 32, cx: 25, run(c, t) { if (t === 7) { ring(c, { r: 1.35, w: 0.3, sq: 0.62, rot: -0.3, col: NC.col, edge: NC.edge, m: 1.0 }); VX.wind({ x: c.x, y: c.y, r: 1.3, n: 5, life: 20, col: '200,255,235', face: c.f, spin: 0.35 }); } } },
    reverse_leaf: { n: '反葉', cat: '連', T: 32, cx: 25, run(c, t) { if (t === 8) { ns(c, { a0: 1.0, a1: -2.1, sq: 1, r: 1.3, m: 1.05, launch: 45, lv: 'mid', wind: false }); VX.wind({ x: c.x + c.f * 0.6 * c.hh, y: c.y, r: 0.7, n: 4, life: 20, cy: 0.8, sq: 1, col: '200,255,235', face: c.f, spin: 0.4 }); } } },
    low_leaf: { n: '低葉', cat: '收', T: 36, cx: 30, run(c, t) { if (t === 9) { ns(c, { a0: -2.6, a1: 1.3, cy: 0.18, sq: 0.35, r: 1.6, w: 0.4, m: 1.3, slow: 40, lv: 'mid', arc: 3 }); leaves(c, 10); VX.smoke({ x: c.x + c.f * 0.8 * c.hh, y: c.y, z: 4, n: 4, r: 0.2, life: 28, a: 0.3, col: '170,160,130' }); } } },
    reverse_whirl: { n: '反旋', cat: '收', T: 42, cx: 36, run(c, t) { if (t === 6) ring(c, { r: 1.4, w: 0.3, col: NC.col, edge: NC.edge, m: 0.7, a0: Math.PI, a1: -Math.PI * 1.05 });
        if (t === 16) { ring(c, { r: 1.5, w: 0.38, col: NC.col, edge: NC.edge, m: 1.0, lv: 'heavy', kb: 1.2, a0: Math.PI, a1: -Math.PI * 1.05 }); VX.wind({ x: c.x, y: c.y, r: 1.6, n: 6, life: 26, col: '200,255,235', face: -c.f, spin: 0.4 }); VX.ring({ x: c.x, y: c.y, r1: 1.7, life: 16, col: '190,255,230' }); } } },
    sinking_leaf: { n: '沉葉', cat: '收', T: 40, cx: 34, run(c, t) { if (t === 4) c.ghost(14); if (t === 16) { ns(c, { a0: -2.0, a1: 1.0, sq: 1, r: 1.3, w: 0.4, m: 1.5, lv: 'heavy', wind: false }); c.later(3, () => { VX.ring({ x: c.x + c.f * 0.4 * c.hh, y: c.y, r1: 1.5, life: 16, col: '190,255,230' }); VX.wind({ x: c.x + c.f * 0.4 * c.hh, y: c.y, r: 1.4, n: 6, life: 22, cy: 0.1, col: '200,255,235', face: c.f, spin: 0.45 }); leaves(c, 10); G.SC.shake = 4; }); } } },
    upright_deny: { n: '立架拒', cat: '架', T: 44, cx: 38, run(c, t) { if (t === 2) VX.custom((o, ctx) => { const s = G.SC.depth(H.y), k = G.HERO_H * s, a = Math.min(1, o.t / 6) * (1 - o.t / o.life); ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 5; i++) { const x = H.x + o.f * (0.55 + i * 0.03) * k, ph = o.t * 0.3 + i; ctx.strokeStyle = 'rgba(190,255,230,' + a * (0.3 + 0.12 * i) + ')'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + Math.sin(ph) * 4 * s, H.y - 1.4 * k); ctx.quadraticCurveTo(x - Math.sin(ph) * 8 * s, H.y - 0.7 * k, x + Math.sin(ph + 1) * 4 * s, H.y); ctx.stroke(); } ctx.restore(); }, 40, 'o', { f: c.f });
        for (const p of G.PROJ) if (p.enemy && Math.abs(p.x - (H.x + c.f * 0.6 * c.hh)) < 30 && Math.abs(p.y - H.y) < 30) p.left = 0; if (t === 30) mark(c); },
      counter(c, e) { mark(c); ns(c, { m: 1.2, lv: 'heavy', kb: 1.4 }); } },
    wing_brace: { n: '翼架', cat: '架', T: 34, cx: 28, run(c, t) { if (t === 2) VX.glow({ x: c.x, y: c.y, z: 0.55, r: 0.5, col: '190,255,230', life: 10 }); if (t === 26) mark(c); },
      counter(c, e) { mark(c); ring(c, { r: 1.3, w: 0.32, col: NC.col, edge: NC.edge, m: 1.3, lv: 'heavy', kb: 1.4 }); VX.wind({ x: c.x, y: c.y, r: 1.3, n: 5, life: 20, col: '200,255,235', face: c.f }); } }
  });
  /* 落葉、燕形光 */
  function leaves(c, n) { const s = G.SC.depth(H.y), k = G.HERO_H * s; for (let i = 0; i < n; i++) { const x0 = c.x + c.f * (Math.random() * 1.4) * k, z0 = (0.3 + Math.random() * 0.9) * k, vx = c.f * (0.5 + Math.random() * 1.5) * s, ph = Math.random() * 6;
      VX.custom((o, ctx) => { const q = o.t / o.life, x = x0 + vx * o.t, z = z0 - o.t * 0.6 * s + Math.sin(o.t * 0.2 + ph) * 4 * s; ctx.save(); ctx.translate(x, c.y - Math.max(0, z)); ctx.rotate(o.t * 0.15 + ph); ctx.globalAlpha = 1 - q; ctx.fillStyle = i % 2 ? '#8fd9a8' : '#c9e88a';
        ctx.beginPath(); ctx.ellipse(0, 0, 4 * s, 1.8 * s, 0, 0, 6.283); ctx.fill(); ctx.restore(); }, 30 + (i % 3) * 6, 'o'); } }
  function swallow(c, n) { const s = G.SC.depth(H.y), k = G.HERO_H * s; for (let i = 0; i < n; i++) { const x0 = c.x, f = c.f;
      VX.custom((o, ctx) => { const q = o.t / o.life, x = x0 + f * q * 2.2 * k, y = c.y - (0.7 + Math.sin(q * 3.14) * 0.3) * k; ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,255,245,' + (1 - q) + ')';
        ctx.beginPath(); ctx.moveTo(10 * s, 0); ctx.quadraticCurveTo(-2 * s, -3 * s, -10 * s, -9 * s); ctx.quadraticCurveTo(-4 * s, -1 * s, -6 * s, 0); ctx.quadraticCurveTo(-4 * s, 1 * s, -10 * s, 9 * s); ctx.quadraticCurveTo(-2 * s, 3 * s, 10 * s, 0); ctx.fill(); ctx.restore(); }, 16, 'o'); } }
  MV2.leaves = leaves; MV2.swallow = swallow;
})();
