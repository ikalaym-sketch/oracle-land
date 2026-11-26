/* ==========================================================================
 * 神諭之地 重製版 — 80_mv_blade.js
 * Version : r3.34.0  (2026-11-17)
 * 變更    : r3.34.0 新增。野太刀、打刀的 12 招（規格 VFX_SPEC v2.1 第四節）。
 *           野太刀：厚重琥珀刀幕、殘影長、落地裂地＋碎石；出手慢、範圍大。
 *           打刀：鋼白淡藍刀幕、快、斬痕清楚；納刀類為「鍔鳴」小光點後延遲斬痕爆開。
 * 依賴    : 76_vfx、77_moves（G.MV2）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H; if (!MV2 || !VX) return;
  const NC = { col: '255,205,130', edge: '255,248,225' }, KC = { col: '190,220,255', edge: '255,255,255' };
  const nd = (c, o) => c.slash(Object.assign({ r: 1.45, w: 0.48, sq: 0.45, sw: 7, life: 18, col: NC.col, edge: NC.edge, a0: -2.3, a1: 1.0, trail: 2.6, shat: 10, ew: 1.4, arc: 2.4 }, o));
  const kt = (c, o) => c.slash(Object.assign({ r: 1.2, w: 0.3, sq: 0.45, sw: 4, life: 13, col: KC.col, edge: KC.edge, a0: -2.2, a1: 0.9, trail: 2.2, shat: 7 }, o));
  const crack = (c, dx, r, col) => { const x = c.x + c.f * dx * c.hh; VX.crack({ x, y: c.y, r: r || 1.2, n: 9, col: col || '255,190,110' }); VX.ring({ x, y: c.y, r1: (r || 1.2) * 1.2, life: 16, col: '255,225,170' }); VX.shard({ x, y: c.y, z: 0.05, n: 9, col: '150,130,110' }); VX.smoke({ x, y: c.y, z: 4, n: 5, r: 0.2, life: 34, a: 0.35, col: '160,145,125' }); G.SC.shake = Math.max(G.SC.shake || 0, 5); };
  const mark = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };
  /* 延遲斬痕：沿直線 n 處依序爆開 */
  function delayLine(c, len, n, gap, m, col) { const x0 = c.x, y0 = c.y, f = c.f, k = c.hh;
    VX.custom((o, ctx) => { const a = 1 - o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(' + col + ',' + 0.7 * a + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y0 - 0.5 * k); ctx.lineTo(x0 + f * len * k, y0 - 0.5 * k); ctx.stroke(); ctx.restore(); }, gap * n + 6, 'o');
    for (let i = 0; i < n; i++) c.later(gap * (i + 1), () => { const x = x0 + f * (i + 0.5) / n * len * k; VX.cut({ x, y: y0, z: 0.5, ang: (i % 2 ? 0.7 : -0.7), len: 0.9, w: 0.08, col: '255,255,255', glowC: col, life: 14 }); VX.spark({ x, y: y0, z: 0.5 * k, n: 5, spd: 4, col: '255,240,220' });
      c.hit({ shape: 'circle', x, y: y0, r: len / n * 0.75, m: m / n, lv: i === n - 1 ? 'mid' : 'light', kind: 'cut', skip: [] }); }); }
  MV2.delayLine = delayLine;
  /* ---------------- 野太刀 ---------------- */
  MV2.reg('nodachi', {
    advancing_weight: { n: '推進重心', cat: '起', T: 34, cx: 26, run(c, t) { if (t <= 12) { c.move(0.12, 0); H.inv = Math.max(H.inv, 1); } if (t % 4 === 0 && t < 12) c.ghost(14); if (t === 10) { nd(c, { m: 1.4, lv: 'mid' }); VX.smoke({ x: c.x, y: c.y, z: 4, n: 4, r: 0.2, life: 26, a: 0.3, col: '170,150,120' }); } } },
    side_path: { n: '側路', cat: '起', T: 32, cx: 24, run(c, t) { if (t <= 10) c.move(0.03, (G.IN.my || 0.6) * 0.08); if (t === 3) c.ghost(14); if (t === 11) nd(c, { m: 1.2, sq: 0.6, rot: 0.25 }); } },
    dawn_draw: { n: '黎明拔刀', cat: '起', T: 34, cx: 26, run(c, t) { if (t === 2) VX.glow({ x: c.x + c.f * 0.2 * c.hh, y: c.y, z: 0.5, r: 0.3, col: '255,230,170', life: 10 });
        if (t === 11) { VX.thrust({ x: c.x, y: c.y, face: c.f, len: 2.9, w: 0.12, cy: 0.5, ext: 2, life: 14, col: '255,215,150', edge: '255,250,230', lines: 4 }); c.hit({ shape: 'line', len: 2.9, w: 0.4, m: 1.4, lv: 'mid', kind: 'cut', cutAng: 0 }); VX.streak({ x: c.x + c.f * 1.2 * c.hh, y: c.y, face: c.f, len: 1.6, n: 4, life: 8, col: '255,240,210' }); } } },
    dragging_line: { n: '拖線', cat: '連', T: 40, cx: 32, run(c, t) { if (t > 4 && t <= 22) { c.move(0.09, 0); if (t % 2 === 0) VX.spark({ x: c.x + c.f * 0.9 * c.hh, y: c.y, z: 2, n: 2, ang: c.f > 0 ? Math.PI * 0.85 : Math.PI * 0.15, spread: 0.3, spd: 4, col: '255,190,110' });
          if (t % 6 === 0) c.hit({ shape: 'circle', x: c.x + c.f * 0.9 * c.hh, y: c.y, r: 0.6, m: 0.4, lv: 'light', kind: 'cut' }); }
        if (t === 5) VX.custom((o, ctx) => { const s = G.SC.depth(o.y), a = 1 - o.t / o.life; ctx.save(); ctx.strokeStyle = 'rgba(40,28,20,' + 0.6 * a + ')'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(o.x0, o.y); ctx.lineTo(H.x + o.f * 0.9 * G.HERO_H * s, o.y); ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,170,90,' + 0.5 * a + ')'; ctx.lineWidth = 1.2 * s; ctx.stroke(); ctx.restore(); }, 50, 'g', { x0: c.x + c.f * 0.9 * c.hh, y: c.y, f: c.f });
        if (t === 24) nd(c, { a0: 1.0, a1: -1.6, sq: 0.9, m: 0.9, lv: 'mid' }); } },
    low_ridge: { n: '低脊', cat: '連', T: 34, cx: 27, run(c, t) { if (t === 9) { nd(c, { a0: -2.6, a1: 1.3, cy: 0.18, sq: 0.35, r: 1.55, m: 1.2, stun: 40, lv: 'mid', arc: 3 }); VX.smoke({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 4, n: 5, r: 0.22, life: 28, a: 0.35, col: '170,150,120' }); } } },
    back_turn: { n: '回身', cat: '連', T: 36, cx: 29, run(c, t) { if (t === 8) nd(c, { a0: Math.PI, a1: -Math.PI * 1.02, shape: 'circle', hr: 1.55, sw: 9, life: 20, trail: 4.2, m: 1.25 }); } },
    retreat_peak: { n: '退峰', cat: '連', T: 34, cx: 27, run(c, t) { if (t > 8 && t <= 18) c.move(-0.09, 0); if (t === 10) c.ghost(14); if (t === 6) nd(c, { a0: 1.1, a1: -2.0, sq: 1, r: 1.35, m: 1.15, launch: 50, lv: 'mid' }); } },
    planted_break: { n: '定地破', cat: '收', T: 40, cx: 34, run(c, t) { if (t === 1) VX.glow({ x: c.x, y: c.y, z: 0.6, r: 0.5, col: '255,210,140', life: 12 }); if (t === 14) { nd(c, { a0: -2.0, a1: 0.9, sq: 1, r: 1.4, m: 1.5, def: 20, lv: 'heavy' }); c.later(4, () => VX.shard({ x: c.x + c.f * 1.1 * c.hh, y: c.y, z: 0.55, n: 10, col: '210,200,190' })); } } },
    falling_ridge: { n: '落脊', cat: '收', T: 44, cx: 38, run(c, t) { if (t === 3) c.ghost(16); if (t > 3 && t <= 14) c.move(0.06, 0); if (t === 16) { nd(c, { a0: -2.2, a1: 0.95, sq: 1, r: 1.35, w: 0.55, m: 1.6, lv: 'heavy', sw: 5 }); c.later(3, () => crack(c, 1.0, 1.3)); } } },
    sinking_charge: { n: '沉蓄', cat: '收', T: 52, cx: 46, run(c, t) { if (t === 1) { VX.glyph({ x: c.x, y: c.y, r: 0.9, life: 26, col: '255,200,120', spin: 0.08 }); VX.custom((o, ctx) => { const s = G.SC.depth(H.y), k = G.HERO_H * s, q = o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 14; i++) { const a = i * 0.45 + o.t * 0.12, r = (1 - q) * k * 1.1; ctx.fillStyle = 'rgba(255,205,130,' + (0.25 + 0.6 * q) + ')'; ctx.beginPath(); ctx.arc(H.x + Math.cos(a) * r, H.y - 0.55 * k + Math.sin(a) * r * 0.5, 2 * s, 0, 6.283); ctx.fill(); } ctx.restore(); }, 24, 'o'); }
        if (t === 25) { nd(c, { a0: -2.9, a1: 1.5, r: 1.85, w: 0.6, sw: 8, life: 22, trail: 3.4, m: 2.0, lv: 'heavy', arc: 3.0, hr: 1.95, shat: 14 }); c.later(5, () => { G.SC.shake = 6; VX.ring({ x: c.x, y: c.y, r1: 2.0, life: 18, col: '255,220,160' }); }); } } },
    long_line: { n: '長線', cat: '收', T: 40, cx: 34, run(c, t) { if (t === 10) { nd(c, { a0: -0.5, a1: 0.25, sq: 0.3, r: 2.9, w: 0.2, sw: 3, life: 14, m: 0 }); delayLine(c, 2.9, 4, 3, 1.6, '255,200,130'); } } },
    opening_brace: { n: '開架', cat: '架', T: 36, cx: 30, run(c, t) { if (t === 2) VX.glow({ x: c.x + c.f * 0.3 * c.hh, y: c.y, z: 0.6, r: 0.45, col: '255,225,170', life: 10 }); if (t === 28) mark(c); },
      counter(c, e) { mark(c); VX.spark({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6 * c.hh, n: 12, spd: 6, col: '255,220,150' }); nd(c, { m: 1.7, lv: 'heavy', kb: 1.4 }); } }
  });
  /* ---------------- 打刀 ---------------- */
  MV2.reg('katana', {
    step_cut: { n: '踏步引刃', cat: '起', T: 26, cx: 18, run(c, t) { if (t <= 8) c.move(0.14, 0); if (t === 2 || t === 6) c.ghost(10); if (t === 7) kt(c, { a0: -2.0, a1: 0.8, sq: 0.7, rot: -0.35, m: 1.0 }); } },
    diagonal_lane: { n: '斜線截路', cat: '起', T: 30, cx: 22, inv: 10, run(c, t) { if (t <= 10) c.move(0.22, (G.IN.my || 0) * 0.05); if (t % 2 === 0 && t <= 10) c.ghost(10);
        if (t === 1) c.a.mvx.x0 = c.x; if (t === 11) { const L = Math.abs(c.x - c.a.mvx.x0) / c.hh; VX.thrust({ x: c.a.mvx.x0, y: c.y, face: c.f, len: L + 0.3, w: 0.06, cy: 0.5, ext: 1, life: 10, col: KC.col, edge: KC.edge, lines: 0 });
          c.later(3, () => { VX.cut({ x: c.a.mvx.x0 + c.f * (L / 2) * c.hh, y: c.y, z: 0.5, ang: 0, len: L, w: 0.06, col: '255,255,255', glowC: '170,210,255', life: 14 }); c.hit({ shape: 'line', x: c.a.mvx.x0, y: c.y, len: L + 0.3, w: 0.4, m: 1.2, lv: 'mid', kind: 'cut', cutAng: 0 }); }); } } },
    low_probe: { n: '低探', cat: '起', T: 24, cx: 17, run(c, t) { if (t === 6) { c.thrust({ len: 1.4, w: 0.12, cy: 0.25, col: KC.col, edge: KC.edge, m: 0.8, slow: 30, kind: 'cut' }); VX.smoke({ x: c.x + c.f * 0.9 * c.hh, y: c.y, z: 3, n: 2, r: 0.12, life: 20, a: 0.25, col: '180,165,140' }); } } },
    rising_disrupt: { n: '挑刃散勢', cat: '連', T: 28, cx: 21, run(c, t) { if (t === 7) { kt(c, { a0: 1.1, a1: -1.9, sq: 1, r: 1.15, m: 1.0, launch: 45, lv: 'mid' }); VX.spark({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 0.9 * c.hh, n: 8, up: 4, spd: 3, col: '210,230,255' }); } } },
    turning_sweep: { n: '回身分月', cat: '連', T: 32, cx: 25, run(c, t) { if (t === 7) { kt(c, { a0: Math.PI, a1: -Math.PI * 1.02, shape: 'circle', hr: 1.35, sw: 7, life: 16, trail: 3.6, m: 1.0 }); c.later(6, () => VX.custom((o, ctx) => { const s = G.SC.depth(o.y), k = G.HERO_H * s, a = 1 - o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(210,230,255,' + 0.7 * a + ')'; ctx.lineWidth = 4 * s * a; ctx.beginPath(); ctx.arc(o.x, o.y - 0.9 * k, 0.6 * k, 0.4, 2.7); ctx.stroke(); ctx.restore(); }, 14, 'o', { x: c.x, y: c.y })); } } },
    arc_step: { n: '弧步', cat: '連', T: 30, cx: 23, run(c, t) { if (t <= 10) { const a = t / 10 * Math.PI; c.move(0.12 * Math.cos(a * 0.5), 0.09 * Math.sin(a)); } if (t % 3 === 0 && t <= 10) c.ghost(10); if (t === 10) kt(c, { a0: -1.8, a1: 1.0, sq: 0.55, rot: 0.3, m: 1.05 }); } },
    return_weave: { n: '返織', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 5) kt(c, { a0: -2.0, a1: 0.9, sq: 0.8, rot: -0.45, m: 0.6 }); if (t === 11) kt(c, { a0: 2.0, a1: -0.9, sq: 0.8, rot: 0.45, m: 0.65, cutAng: 0.6 }); } },
    downward_finish: { n: '落斬收勢', cat: '收', T: 38, cx: 32, run(c, t) { if (t === 3) c.ghost(14); if (t > 3 && t <= 12) c.move(0.06, 0); if (t === 14) { kt(c, { a0: -2.1, a1: 0.95, sq: 1, r: 1.25, w: 0.4, m: 1.5, lv: 'heavy', sw: 4 }); c.later(3, () => { VX.crack({ x: c.x + c.f * 0.9 * c.hh, y: c.y, r: 1.0, n: 7, col: '190,215,255' }); VX.ring({ x: c.x + c.f * 0.9 * c.hh, y: c.y, r1: 1.2, life: 14, col: '210,230,255' }); G.SC.shake = 4; }); } } },
    leaving_cut: { n: '離刃', cat: '收', T: 38, cx: 32, run(c, t) { if (t === 6) { kt(c, { a0: -2.5, a1: 1.2, r: 1.4, w: 0.36, m: 0.8, sw: 5, arc: 2.8 }); c.a.mvx.p = [c.x, c.y]; } if (t > 10 && t <= 20) c.move(-0.12, 0); if (t === 12) c.ghost(12);
        if (t === 20) { const [x, y] = c.a.mvx.p; VX.cut({ x: x + c.f * 0.8 * c.hh, y, z: 0.55, ang: -0.5, len: 1.4, w: 0.09, col: '255,255,255', glowC: '170,210,255', life: 16 }); c.hit({ shape: 'circle', x: x + c.f * 0.8 * c.hh, y, r: 0.9, m: 0.9, lv: 'heavy', kind: 'cut' }); } } },
    sheathed_retreat: { n: '納刀退', cat: '收', T: 40, cx: 34, run(c, t) { if (t <= 10) c.move(-0.08, 0); if (t === 14) { VX.glow({ x: c.x + c.f * 0.15 * c.hh, y: c.y, z: 0.5, r: 0.18, col: '255,255,255', life: 8 }); VX.ring({ x: c.x + c.f * 0.15 * c.hh, y: c.y, z: 0.5, sq: 1, r0: 0.05, r1: 0.35, life: 10, col: '230,240,255', lw: 0.03 }); delayLine(c, 2.2, 3, 3, 1.8, '170,210,255'); } } },
    blade_receive: { n: '交鋒返脈', cat: '架', T: 34, cx: 28, run(c, t) { if (t === 2) VX.glow({ x: c.x + c.f * 0.3 * c.hh, y: c.y, z: 0.6, r: 0.4, col: '210,230,255', life: 10 }); if (t === 26) mark(c); },
      counter(c, e) { mark(c); VX.spark({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6 * c.hh, n: 12, spd: 6, col: '220,235,255' }); kt(c, { m: 1.6, lv: 'heavy', sw: 3 }); } },
    open_guard: { n: '開架', cat: '架', T: 36, cx: 30, run(c, t) { if (t === 1) VX.custom((o, ctx) => { const s = G.SC.depth(H.y), k = G.HERO_H * s, a = Math.sin(o.t / o.life * 3.14); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,225,255,' + a + ')'; ctx.lineWidth = 2.5 * s; const p = (o.t % 12) / 12;
          ctx.beginPath(); ctx.moveTo(H.x + o.f * 0.15 * k, H.y - 0.5 * k); ctx.lineTo(H.x + o.f * (0.15 + p * 0.9) * k, H.y - (0.5 + p * 0.45) * k); ctx.stroke(); ctx.restore(); }, 34, 'o', { f: c.f }); if (t === 28) mark(c); },
      counter(c, e) { mark(c); G.BUFF.add('nextCrit', 100, 240); VX.spark({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6 * c.hh, n: 10, spd: 6, col: '220,235,255' }); kt(c, { m: 1.0, lv: 'mid' }); } }
  });
})();
