/* ==========================================================================
 * 神諭之地 重製版 — 81_hiden.js
 * Version : r3.36.0  (2026-11-17)  r3.36.0：昇龍天穿、火龍改用光龍（84）
 * 變更    : r3.34.0 新增。秘傳連技 30 招（每把武器 5 招；規格 VFX_SPEC v2.1 第三、四節）。
 *           共通演出：背景壓暗、主角光暈 → 主體（瞬移／分身／巨型刀幕／箭雨…）→ 命中定格（hitstop 10～18）＋震動 → 餘韻（碎光、煙、裂地）。
 *           每招：id、n 名稱、seq 三招順序、hint 提示文字、clip 動作圖、T 總格數、run(c, t)。命中強度一律 'hiden'。
 * 依賴    : 76_vfx、77_moves（G.MV2.hiden、執行環境 c）、78–80（共用小工具 MV2.near／delayLine／leaves／swallow）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y); if (!MV2 || !VX) return;
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  /* ---------- 共用 ---------- */
  const tgt = (c, r) => MV2.near(c, r || 10) || null;
  const ptAhead = (c, d) => [c.x + c.f * d * c.hh, c.y];
  const tp = (x, y) => { if (SC.walkable(x, y)) { H.x = x; H.y = y; } else { const p = SC.snap && SC.snap(x, y, 'walk', 120); if (p) { H.x = p[0]; H.y = p[1]; } } };
  function intro(c, col, T) { VX.dim(T || 60, 0.5); VX.glow({ x: c.x, y: c.y, z: 0.6, r: 1.0, col, life: 14 }); VX.ring({ x: c.x, y: c.y, r1: 1.4, life: 16, col }); G.SC.shake = 3; }
  const big = (c, o) => c.hit(Object.assign({ lv: 'hiden' }, o));
  const ghostAt = (x, y, face, life, alpha) => { const u = G.WPN.unit && G.WPN.unit(), fr = G.heroFrame && G.heroFrame(); if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x, y, face, s: S(y) * G.WPN.actK(H.act && H.act.name), t: 0, life: life || 16 }); };
  /* 巨型垂直刀幕＋光柱＋裂地 */
  function giantChop(c, x, y, col, r) { VX.ribbon({ x, y, face: c.f, a0: -2.0, a1: 0.9, sq: 1, r: r || 2.2, w: 0.75, cy: (r || 2.2) * 0.6, sw: 4, life: 22, col, edge: '255,255,255', trail: 2.6, shat: 16, ew: 2 });
    c.later(3, () => { VX.beam({ x: x + c.f * 0.6 * c.hh, y, w: 0.35, h: 4, life: 18, col }); VX.crack({ x: x + c.f * 0.6 * c.hh, y, r: 1.8, n: 12, col }); VX.ring({ x: x + c.f * 0.6 * c.hh, y, r1: 2.2, life: 20, col: '255,240,220' }); VX.shard({ x: x + c.f * 0.6 * c.hh, y, z: 0.05, n: 14, col: '150,130,110' }); VX.flash(2); G.SC.shake = 8; }); }
  /* 天上落下的東西（流星箭、流星槍）：從 (x+dx, 高 h) 斜落到 (x, y) */
  function fall(c, x, y, o) { const life = o.life || 14, dx = (o.dx || -1.2) * c.hh, h = (o.h || 5) * c.hh, s = S(y);
    VX.custom((q, ctx) => { const u = Math.min(1, q.t / life), px = x + dx * (1 - u), pz = h * (1 - u), ang = Math.atan2(h, -dx); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const L = (o.len || 1.4) * c.hh, g = ctx.createLinearGradient(px, y - pz, px - Math.cos(ang) * L * Math.sign(-dx || 1), y - pz - Math.sin(ang) * L); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(' + o.col + ',.8)'); g.addColorStop(1, 'rgba(' + o.col + ',0)');
      ctx.strokeStyle = g; ctx.lineWidth = (o.w || 3) * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, y - pz); ctx.lineTo(px - (dx / Math.hypot(dx, h)) * L, y - pz - (h / Math.hypot(dx, h)) * L); ctx.stroke();
      if (o.arrow) { ctx.globalCompositeOperation = 'source-over'; ctx.translate(px, y - pz); ctx.rotate(Math.atan2(h, -dx)); VX.arrowShape(c.hh * (o.big ? 1.2 : 0.55), c.hh * (o.big ? 0.04 : 0.018), o.col, !!o.big); }
      ctx.restore(); }, life, 'o');
    c.later(life, () => { VX.glow({ x, y, z: 0.1, r: o.big ? 1.2 : 0.6, col: o.col, life: 10 }); VX.ring({ x, y, r1: o.big ? 2.0 : 0.8, life: 14, col: o.col }); VX.smoke({ x, y, n: o.big ? 4 : 2, r: 0.15, life: 26, a: 0.3, col: '170,160,150' }); if (o.big) VX.crack({ x, y, r: 1.4, n: 10, col: o.col });
      big(c, { shape: 'circle', x, y, r: o.r || 0.8, m: o.m || 0.5, kind: o.arrow ? 'arrow' : 'blunt', col: o.col }); if (o.on) o.on(x, y); }); }
  /* 分身（停在定點的主角殘影，帶顏色光暈） */
  function clone(c, x, y, face, life, col) { ghostAt(x, y, face, life); VX.glow({ x, y, z: 0.6, r: 0.7, col, life: Math.min(life, 18) }); }
  const D = {};
  /* ---------------- 打刀 ---------------- */
  D.katana = [
    { id: 'k_tsubame', n: '燕返・真', seq: ['rising_disrupt', 'return_weave', 'downward_finish'], hint: '先挑起，再往返，最後落下', clip: 'tsubame_master', T: 54,
      run(c, t) { if (t === 1) { intro(c, '255,110,90', 54); c.a.mvx.e = tgt(c, 6); }
        const e = c.a.mvx.e; if (t === 6) { ghostAt(H.x, H.y, H.face, 14); if (e) tp(e.x - c.f * 0.6 * c.hh, e.y); VX.glow({ x: H.x, y: H.y, z: 0.6, r: 0.8, col: '255,120,100', life: 10 }); }
        if (t === 10) { VX.ribbon({ x: H.x, y: H.y, face: c.f, a0: -2.2, a1: 1.0, sq: 1, r: 1.7, w: 0.55, cy: 0.9, sw: 3, life: 20, col: '255,110,90', edge: '255,255,255', trail: 2.4, shat: 12, ew: 2 }); c.later(2, () => big(c, { shape: 'circle', x: H.x + c.f * 0.7 * c.hh, y: H.y, r: 1.2, m: 1.5, kind: 'cut', hang: -1.0 })); }
        if (t === 20) { VX.ribbon({ x: H.x, y: H.y, face: c.f, a0: 1.0, a1: -2.2, sq: 1, r: 1.7, w: 0.55, cy: 0.9, sw: 3, life: 20, col: '255,110,90', edge: '255,255,255', trail: 2.4, shat: 12, ew: 2 }); c.later(2, () => { const hs = big(c, { shape: 'circle', x: H.x + c.f * 0.7 * c.hh, y: H.y, r: 1.2, m: 1.5, kind: 'cut', hang: 1.0 });
            for (const q of hs) for (const a of [-0.8, 0.8]) VX.cut({ x: q.x, y: q.y, z: 0.55, ang: a, len: 1.6, w: 0.09, col: '255,255,255', glowC: '255,110,90', life: 30 }); VX.flash(2); }); } } },
    { id: 'k_issen', n: '一閃・朧', seq: ['step_cut', 'diagonal_lane', 'sheathed_retreat'], hint: '踏入，穿過，收刀', clip: 'issen_master', T: 60,
      run(c, t) { if (t === 1) { intro(c, '220,235,255', 60); c.a.mvx.x0 = c.x; VX.thrust({ x: c.x, y: c.y, face: c.f, len: 6, w: 0.03, cy: 0.5, ext: 2, life: 14, col: '230,240,255', edge: '255,255,255', lines: 0 }); }
        if (t >= 6 && t <= 12) { c.move(0.7, 0); ghostAt(H.x, H.y, H.face, 14); H.inv = 20; }
        if (t === 26) { VX.glow({ x: H.x + c.f * 0.15 * c.hh, y: H.y, z: 0.5, r: 0.25, col: '255,255,255', life: 8 }); VX.ring({ x: H.x + c.f * 0.15 * c.hh, y: H.y, z: 0.5, sq: 1, r0: 0.05, r1: 0.4, life: 10, col: '230,240,255', lw: 0.03 }); }
        if (t === 30) { const x0 = c.a.mvx.x0, x1 = H.x, y = H.y; for (let i = 0; i < 5; i++) c.later(i * 3, () => { const x = x0 + (x1 - x0) * (i + 0.5) / 5; VX.cut({ x, y, z: 0.5, ang: i % 2 ? 0.6 : -0.6, len: 1.3, w: 0.09, col: '255,255,255', glowC: '170,210,255', life: 20 }); VX.spark({ x, y, z: 0.5 * c.hh, n: 6, spd: 5, col: '230,240,255' }); big(c, { shape: 'circle', x, y, r: Math.abs(x1 - x0) / c.hh / 6 + 0.8, m: 0.6, kind: 'cut', lv: i === 4 ? 'hiden' : 'heavy' }); });
          c.later(16, () => { for (let i = 0; i < 16; i++) VX.shard({ x: x0 + (x1 - x0) * Math.random(), y, z: 1.2, n: 1, col: '245,245,250', life: 40 }); }); } } },
    { id: 'k_bunshin', n: '月下分身', seq: ['arc_step', 'turning_sweep', 'leaving_cut'], hint: '繞行，回身，離去', clip: 'special_return', T: 50,
      run(c, t) { if (t === 1) { intro(c, '170,200,255', 50); const e = tgt(c, 6); c.a.mvx.p = e ? [e.x, e.y] : ptAhead(c, 1.4); }
        const [px, py] = c.a.mvx.p || [c.x, c.y], k = c.hh, P = [[px - 1.3 * k, py], [px + 1.3 * k, py + 0.2 * k], [px, py - 0.5 * k]];
        if (t === 6) P.forEach(([x, y], i) => clone(c, x, y, x < px ? 1 : -1, 30, '170,200,255'));
        if (t === 14) { P.forEach(([x, y]) => VX.ribbon({ x, y, face: x < px ? 1 : -1, a0: -2.0, a1: 0.9, sq: 0.6, rot: -0.3, r: 1.3, w: 0.4, sw: 4, life: 18, col: '170,200,255', edge: '255,255,255', shat: 8 })); c.later(3, () => { big(c, { shape: 'circle', x: px, y: py, r: 1.2, m: 2.4, kind: 'cut' }); VX.ring({ x: px, y: py, r1: 1.8, life: 18, col: '200,220,255' }); VX.flash(1); }); } } },
    { id: 'k_raimyaku', n: '返脈・雷', seq: ['open_guard', 'blade_receive', 'downward_finish'], hint: '架起，接住，劈下', clip: 'iai_master', T: 46,
      run(c, t) { if (t === 1) intro(c, '190,210,255', 46); if (t > 1 && t < 14 && t % 3 === 0) VX.bolt({ x0: c.x + c.f * 0.2 * c.hh, y0: c.y - 0.6 * c.hh, x1: c.x + c.f * 1.0 * c.hh, y1: c.y - 1.1 * c.hh, life: 4, w: 2 });
        if (t === 16) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: -2.1, a1: 0.95, sq: 1, r: 1.5, w: 0.5, cy: 0.7, sw: 4, life: 18, col: '190,210,255', edge: '255,255,255', shat: 10, ew: 1.8 });
          c.later(3, () => { for (let i = 0; i < 3; i++) { const x = c.x + c.f * (0.8 + i * 0.6) * c.hh, y = c.y + (i - 1) * 0.15 * c.hh; VX.bolt({ x0: x + rnd(-10, 10), y0: y - 5 * c.hh, x1: x, y1: y, life: 14, w: 3, br: 3 }); VX.custom((o, ctx) => { ctx.save(); ctx.fillStyle = 'rgba(30,25,35,' + 0.5 * (1 - o.t / o.life) + ')'; ctx.beginPath(); ctx.ellipse(x, y, 0.4 * c.hh, 0.14 * c.hh, 0, 0, TAU); ctx.fill(); ctx.restore(); }, 60, 'g'); }
            big(c, { shape: 'line', len: 2.4, w: 0.6, m: 3.0, kind: 'cut', col: '190,210,255' }); VX.flash(2); G.SC.shake = 7; }); } } },
    { id: 'k_chidori', n: '千鳥十字', seq: ['low_probe', 'rising_disrupt', 'downward_finish'], hint: '探低，挑高，斬下', clip: 'tsubame_evolved', T: 56,
      run(c, t) { if (t === 1) intro(c, '200,225,255', 56); const [px, py] = ptAhead(c, 1.0);
        if (t === 6) { for (const a of [0.15, -0.15]) VX.cut({ x: px, y: py, z: 0.05, ang: a + (a > 0 ? 0.5 : -0.5), len: 1.6, w: 0.07, col: '255,255,255', glowC: '170,210,255', life: 50 }); big(c, { shape: 'circle', x: px, y: py, r: 1.0, m: 0.8, kind: 'cut', lv: 'heavy', launch: 60 }); }
        if (t === 12) VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: 1.1, a1: -2.0, sq: 1, r: 1.3, w: 0.4, sw: 4, life: 14, col: '190,220,255', edge: '255,255,255' });
        if (t === 18 || t === 23 || t === 28) { VX.ribbon({ x: px, y: py, face: t === 23 ? -c.f : c.f, a0: -2.0, a1: 1.0, sq: 0.7, rot: (t - 23) * 0.06, r: 1.1, w: 0.35, cy: 1.1, sw: 3, life: 12, col: '190,220,255', edge: '255,255,255' }); big(c, { shape: 'circle', x: px, y: py, r: 1.0, m: 0.5, kind: 'cut', lv: 'heavy' }); }
        if (t === 36) { VX.ribbon({ x: px, y: py, face: c.f, a0: -2.0, a1: 0.9, sq: 1, r: 1.4, w: 0.5, cy: 1.0, sw: 3, life: 16, col: '255,255,255', edge: '255,255,255' }); c.later(3, () => { VX.ring({ x: px, y: py, r1: 1.8, life: 18, col: '210,230,255' }); VX.crack({ x: px, y: py, r: 1.2, n: 8, col: '190,215,255' }); big(c, { shape: 'circle', x: px, y: py, r: 1.2, m: 1.0, kind: 'cut' }); VX.flash(1); }); } } }
  ];
  /* ---------------- 野太刀 ---------------- */
  const NA = '255,190,110';
  D.nodachi = [
    { id: 'n_tendan', n: '天斷', seq: ['dawn_draw', 'retreat_peak', 'falling_ridge'], hint: '拔刀，退上峰頂，從天落下', clip: 'ultimate_tenchi_basic', T: 60,
      run(c, t) { if (t === 1) { intro(c, NA, 60); VX.beam({ x: c.x + c.f * 1.2 * c.hh, y: c.y, w: 0.06, h: 7, life: 22, col: '255,230,170' }); } if (t === 8) { ghostAt(H.x, H.y, H.face, 18); VX.streak({ x: c.x, y: c.y, ang: -1.57, face: 1, len: 2, n: 6, life: 10, cy: 1 }); }
        if (t === 22) { giantChop(c, c.x, c.y, NA, 2.6); c.later(4, () => { for (let i = 1; i <= 3; i++) VX.crack({ x: c.x + c.f * (0.8 + i * 0.9) * c.hh, y: c.y, r: 1.0, n: 7, col: NA, dir: c.f > 0 ? 0 : Math.PI }); big(c, { shape: 'line', len: 3.8, w: 0.7, m: 3.3, kind: 'cut', col: NA, hang: -1.4 }); }); } } },
    { id: 'n_guruma', n: '鬼斬車', seq: ['advancing_weight', 'back_turn', 'sinking_charge'], hint: '推進，回身，沉蓄', clip: 'skill_daisharin_master', T: 60,
      run(c, t) { if (t === 1) intro(c, NA, 60); [[6, 1.4], [16, 1.7], [26, 2.05]].forEach(([f, r], i) => { if (t === f) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: Math.PI, a1: -Math.PI * 1.02, sq: 0.42, r, w: 0.5 + i * 0.1, sw: 7, life: 16, col: NA, edge: '255,248,225', trail: 4.5, shat: 10, ew: 1.5 }); VX.wind({ x: c.x, y: c.y, r, n: 5, life: 16, col: '255,220,170', face: c.f, spin: 0.4 }); c.later(4, () => big(c, { shape: 'circle', r: r + 0.1, m: 0.8, kind: 'cut', lv: i < 2 ? 'heavy' : 'hiden' })); } });
        if (t === 36) { VX.ring({ x: c.x, y: c.y, r1: 3.0, life: 22, col: '255,220,160', lw: 0.12 }); VX.ring({ x: c.x, y: c.y, r1: 2.4, life: 18, col: '255,250,230' }); big(c, { shape: 'circle', r: 2.8, m: 0.9, kind: 'blunt', kb: 2.5 }); VX.flash(1); } } },
    { id: 'n_dangaku', n: '斷岳', seq: ['planted_break', 'dragging_line', 'falling_ridge'], hint: '定地，拖行，落脊', clip: 'skill_haousan_master', T: 58,
      run(c, t) { if (t === 1) intro(c, NA, 58); if (t === 10) { VX.glow({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 0.1, r: 0.8, col: NA, life: 14 }); G.SC.shake = 4; }
        if (t > 12 && t <= 32 && t % 4 === 0) { const i = (t - 12) / 4, x = c.x + c.f * (0.6 + i * 0.75) * c.hh; VX.crack({ x, y: c.y, r: 0.9, n: 6, col: NA, dir: c.f > 0 ? 0 : Math.PI }); VX.glow({ x, y: c.y, z: 0.1, r: 0.5, col: NA, life: 10 }); VX.shard({ x, y: c.y, z: 0.05, n: 4, col: '150,130,110' }); big(c, { shape: 'circle', x, y: c.y, r: 1.05, m: 0.6, kind: 'blunt', lv: 'heavy' }); }
        if (t === 36) { const x = c.x + c.f * 4.3 * c.hh; for (let i = 0; i < 5; i++) VX.beam({ x: x + rnd(-0.5, 0.5) * c.hh, y: c.y + rnd(-0.2, 0.2) * c.hh, w: 0.18, h: rnd(1.2, 2.2), life: 22, col: NA }); VX.ring({ x, y: c.y, r1: 2.0, life: 18, col: '255,220,160' }); big(c, { shape: 'circle', x, y: c.y, r: 1.5, m: 1.5, kind: 'blunt', launch: 50 }); VX.flash(2); G.SC.shake = 8; } } },
    { id: 'n_haou', n: '霸王・崩', seq: ['low_ridge', 'advancing_weight', 'sinking_charge'], hint: '掃低，推進，蓄滿', clip: 'skill_haousan_master', T: 56,
      run(c, t) { if (t === 1) intro(c, NA, 56); if (t === 5) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: -2.6, a1: 1.3, cy: 0.18, sq: 0.35, r: 1.6, w: 0.45, sw: 5, life: 14, col: NA, edge: '255,248,225' }); big(c, { shape: 'sector', r: 1.7, arc: 3, m: 0.8, kind: 'cut', lv: 'heavy', launch: 60 }); VX.shard({ x: c.x + c.f * 0.8 * c.hh, y: c.y, z: 0.05, n: 10, col: '150,130,110' }); }
        if (t > 10 && t <= 20) { c.move(0.12, 0); ghostAt(H.x, H.y, H.face, 12); }
        if (t === 22) VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: -2.0, a1: 0.9, sq: 1, r: 1.6, w: 0.55, cy: 1.0, sw: 4, life: 16, col: NA, edge: '255,248,225', ew: 1.8 });
        if (t === 26) { big(c, { shape: 'circle', x: c.x + c.f * 0.8 * c.hh, y: c.y, r: 1.3, m: 1.4, kind: 'cut' }); [0, 5, 10].forEach((d, i) => c.later(d, () => { VX.ring({ x: c.x + c.f * 0.8 * c.hh, y: c.y, r1: 1.4 + i * 0.6, life: 16, col: '255,220,160', lw: 0.1 }); if (i === 2) { big(c, { shape: 'circle', x: c.x + c.f * 0.8 * c.hh, y: c.y, r: 2.4, m: 0.8, kind: 'blunt', kb: 2 }); } })); VX.crack({ x: c.x + c.f * 0.8 * c.hh, y: c.y, r: 1.6, n: 11, col: NA }); VX.flash(2); G.SC.shake = 8; } } },
    { id: 'n_yuuhi', n: '夕陽一文字', seq: ['side_path', 'long_line', 'dawn_draw'], hint: '側行，拉長，拔刀', clip: 'skill_zantetsu_master', T: 56,
      run(c, t) { if (t === 1) { intro(c, '255,150,80', 56); VX.custom((o, ctx) => { const a = Math.sin(Math.min(1, o.t / o.life) * 3.14) * 0.35; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height); g.addColorStop(0, 'rgba(255,120,40,' + a + ')'); g.addColorStop(1, 'rgba(120,30,40,' + a * 0.8 + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }, 56, 'g'); }
        if (t === 18) { VX.thrust({ x: c.x - c.f * 1.5 * c.hh, y: c.y, face: c.f, len: 10, w: 0.08, cy: 0.5, ext: 3, life: 26, col: '255,170,90', edge: '255,250,235', lines: 0 }); c.later(4, () => { for (let i = 0; i < 6; i++) c.later(i * 2, () => { const x = c.x + c.f * (0.6 + i * 1.3) * c.hh; VX.cut({ x, y: c.y, z: 0.5, ang: 0, len: 1.4, w: 0.1, col: '255,255,255', glowC: '255,150,80', life: 22 }); VX.spark({ x, y: c.y, z: 0.5 * c.hh, n: 6, spd: 5, col: '255,200,140' }); });
            big(c, { shape: 'line', back: 1.5, len: 8, w: 0.6, m: 3.0, kind: 'cut', col: '255,150,80', hang: 0 }); VX.flash(1); }); } } }
  ];
  /* ---------------- 薙刀 ---------------- */
  const NG = '150,235,205';
  D.naginata = [
    { id: 'g_kuen', n: '颶燕', seq: ['retreat_swallow', 'fan_sweep', 'reverse_whirl'], hint: '退燕，扇開，反旋', clip: 'ultimate_daikufu_basic', T: 62,
      run(c, t) { if (t === 1) { intro(c, NG, 62); c.a.mvx.b = []; for (let i = 0; i < 8; i++) c.a.mvx.b.push({ a: i * TAU / 8 }); }
        const B = c.a.mvx.b, k = c.hh;
        if (t === 2) VX.custom((o, ctx) => { const s = S(H.y); for (const b of B) { if (b.done || b.px === undefined) continue; const ang = b.go ? Math.atan2(b.ty - b.y0, b.tx - b.x0) : b.a + 1.57;
            ctx.save(); ctx.translate(b.px, b.py); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,255,245,.95)';
            ctx.beginPath(); ctx.moveTo(10 * s, 0); ctx.quadraticCurveTo(-2 * s, -3 * s, -10 * s, -9 * s); ctx.quadraticCurveTo(-4 * s, -1 * s, -6 * s, 0); ctx.quadraticCurveTo(-4 * s, 1 * s, -10 * s, 9 * s); ctx.quadraticCurveTo(-2 * s, 3 * s, 10 * s, 0); ctx.fill(); ctx.restore(); } }, 56, 'o', { step: () => {
            for (const b of B) { if (b.done) continue; if (!b.go) { b.a += 0.18; b.px = H.x + Math.cos(b.a) * 1.0 * k; b.py = H.y - 0.8 * k + Math.sin(b.a) * 0.4 * k; continue; }
              b.u = Math.min(1, (b.u || 0) + 0.12); if (b.u < 0) continue; b.px = b.x0 + (b.tx - b.x0) * b.u; b.py = b.y0 + (b.ty - b.y0) * b.u;
              if (b.u >= 1) { b.done = 1; VX.cut({ x: b.tx, y: b.ty + 0.5 * k, z: 0.5, ang: rnd(-1, 1), len: 1.0, w: 0.07, col: '255,255,255', glowC: NG, life: 16 }); big(c, { shape: 'circle', x: b.tx, y: b.ty + 0.5 * k, r: 0.7, m: 0.35, kind: 'cut', lv: 'heavy' }); } } } });
        if (t === 28) { const es = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - H.x, (e.y - H.y) * 1.6) < 6 * k); B.forEach((b, i) => { const e = es[i % Math.max(1, es.length)]; b.go = 1; b.x0 = b.px; b.y0 = b.py; b.tx = e ? e.x : H.x + c.f * (1 + i * 0.3) * k; b.ty = (e ? e.y : H.y) - 0.5 * k; b.u = -i * 0.08; }); }
        if (t === 44) { VX.ring({ x: c.x, y: c.y, r1: 2.4, life: 18, col: '200,255,235', lw: 0.1 }); VX.wind({ x: c.x, y: c.y, r: 2.0, n: 7, life: 22, col: '200,255,235', face: c.f, spin: 0.45 }); big(c, { shape: 'circle', r: 2.2, m: 0.8, kind: 'cut' }); VX.flash(1); } } },
    { id: 'g_ranyou', n: '嵐葉舞', seq: ['around_diagonal', 'reverse_leaf', 'low_leaf'], hint: '斜環，反葉，低掃', clip: 'skill_arashi_master', T: 110,
      run(c, t) { if (t === 1) intro(c, NG, 110); if (t % 6 === 0 && t < 96) { VX.wind({ x: H.x, y: H.y, r: 1.9, n: 6, life: 14, col: '200,255,235', face: c.f, spin: 0.5 }); MV2.leaves(c, 3); }
        if (t % 12 === 6 && t < 96) { const a = rnd(0, TAU); VX.ribbon({ x: H.x, y: H.y, face: Math.random() < 0.5 ? 1 : -1, a0: a, a1: a + rnd(2.4, 3.4), sq: rnd(0.35, 0.8), rot: rnd(-0.4, 0.4), r: rnd(1.3, 1.8), w: 0.32, sw: 4, life: 12, col: NG, edge: '235,255,248', shat: 4 }); big(c, { shape: 'circle', r: 1.9, m: 0.32, kind: 'cut', lv: 'heavy' }); }
        if (t === 98) { VX.ring({ x: H.x, y: H.y, r1: 2.8, life: 20, col: '200,255,235', lw: 0.12 }); MV2.leaves(c, 20); big(c, { shape: 'circle', r: 2.6, m: 1.0, kind: 'cut', kb: 2 }); VX.flash(2); G.SC.shake = 6; } } },
    { id: 'g_fuujin', n: '風神降', seq: ['gliding_wing', 'reverse_leaf', 'sinking_leaf'], hint: '滑行，反挑，沉落', clip: 'skill_senpu_master', T: 56,
      run(c, t) { if (t === 1) intro(c, NG, 56); const [px, py] = ptAhead(c, 1.2);
        if (t === 5) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: 1.0, a1: -2.1, sq: 1, r: 1.4, w: 0.4, sw: 4, life: 14, col: NG, edge: '235,255,248' }); big(c, { shape: 'circle', x: px, y: py, r: 1.1, m: 0.6, kind: 'cut', lv: 'heavy', launch: 70 }); }
        if (t === 10) { ghostAt(H.x, H.y, H.face, 20); VX.streak({ x: c.x, y: c.y, ang: -1.57, face: 1, len: 2.2, n: 6, life: 10, cy: 1.2, col: '220,255,245' }); }
        if (t === 24) VX.custom((o, ctx) => { const s = S(py), k = HH() * s, q = o.t / o.life, a = q < 0.8 ? 1 : (1 - q) / 0.2; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
            for (let i = 0; i < 26; i++) { const u = i / 25, y = py - u * 4.5 * k, r = (0.35 + 0.5 * (1 - u)) * k, an = o.t * 0.5 + u * 10; ctx.strokeStyle = 'rgba(200,255,235,' + a * (0.25 + 0.5 * (1 - u)) + ')'; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.ellipse(px, y, r, r * 0.35, 0, an, an + 1.6); ctx.stroke(); } ctx.restore(); }, 28, 'o');
        if (t === 30) { [0, 4, 8].forEach((d, i) => c.later(d, () => VX.ring({ x: px, y: py, r1: 1.4 + i * 0.6, life: 16, col: '200,255,235', lw: 0.1 }))); big(c, { shape: 'circle', x: px, y: py, r: 1.8, m: 2.4, kind: 'blunt', kb: 2 }); MV2.leaves(c, 14); VX.flash(2); G.SC.shake = 7; } } },
    { id: 'g_sougetsu', n: '雙月', seq: ['side_wave', 'fan_sweep', 'wide_leaf'], hint: '側浪，扇掃，寬葉', clip: 'skill_enbu_master', T: 44,
      run(c, t) { if (t === 1) intro(c, NG, 44); if (t === 10) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: -2.9, a1: 1.5, sq: 0.55, rot: 0.35, r: 2.2, w: 0.6, sw: 5, life: 22, col: NG, edge: '255,255,255', trail: 4, shat: 12, ew: 2 }); VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: 2.9, a1: -1.5, sq: 0.55, rot: -0.35, r: 2.2, w: 0.6, sw: 5, life: 22, col: '200,240,255', edge: '255,255,255', trail: 4, shat: 12, ew: 2 });
          c.later(4, () => { VX.glow({ x: c.x + c.f * 2.0 * c.hh, y: c.y, z: 0.55, r: 0.9, col: '255,255,255', life: 10 }); big(c, { shape: 'sector', r: 2.4, arc: 3.2, m: 3.0, kind: 'cut' }); VX.flash(1); G.SC.shake = 6; }); } } },
    { id: 'g_narukami', n: '鳴神薙', seq: ['wing_brace', 'fan_sweep', 'reverse_whirl'], hint: '展翼，扇掃，反旋', clip: 'skill_chidori_master', T: 52,
      run(c, t) { if (t === 1) intro(c, '190,210,255', 52); if (t > 1 && t < 20 && t % 2 === 0) { const a = t * 0.7; VX.bolt({ x0: c.x + Math.cos(a) * 0.4 * c.hh, y0: c.y - 0.6 * c.hh, x1: c.x + Math.cos(a + 1) * 1.1 * c.hh, y1: c.y - (0.6 + Math.sin(a) * 0.3) * c.hh, life: 4, w: 2, br: 0 }); }
        if (t === 22) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: Math.PI, a1: -Math.PI * 1.05, sq: 0.42, r: 1.7, w: 0.45, sw: 7, life: 16, col: '190,210,255', edge: '255,255,255', trail: 4.5 }); for (let i = 0; i < 8; i++) { const a = i * TAU / 8, x = c.x + Math.cos(a) * 1.9 * c.hh, y = c.y + Math.sin(a) * 0.7 * c.hh; c.later(4 + i, () => VX.bolt({ x0: x + rnd(-10, 10), y0: y - 4 * c.hh, x1: x, y1: y, life: 12, w: 3, br: 2 })); }
          c.later(6, () => { VX.ring({ x: c.x, y: c.y, r1: 2.4, life: 18, col: '200,220,255', lw: 0.1 }); big(c, { shape: 'circle', r: 2.2, m: 2.8, kind: 'cut', stun: 60, col: '190,210,255' }); VX.flash(2); G.SC.shake = 7; }); } } }
  ];
  /* ---------------- 槍 ---------------- */
  const YG = '190,215,255';
  D.yari = [
    { id: 'y_hyakusen', n: '百穿', seq: ['tip_probe', 'double_thrust', 'focused_point'], hint: '探，雙刺，凝於一點', clip: 'skill_senso_master', T: 50,
      run(c, t) { if (t === 1) intro(c, YG, 50); if (t >= 6 && t < 26) { for (let i = 0; i < 3; i++) VX.thrust({ x: c.x, y: c.y, face: c.f, len: rnd(1.6, 2.3), w: 0.1, cy: rnd(0.35, 0.8), ang: rnd(-0.42, 0.42), ext: 1, life: 6, col: YG, edge: '255,255,255', tip: '255,225,140', lines: 1 }); if (t % 2 === 0) big(c, { shape: 'sector', r: 2.3, arc: 0.9, m: 0.32, kind: 'pierce', lv: 'heavy' }); }
        if (t === 30) { VX.thrust({ x: c.x, y: c.y, face: c.f, len: 3.2, w: 0.4, cy: 0.55, ext: 2, life: 18, col: YG, edge: '255,255,255', tip: '255,225,140', lines: 5 }); VX.ring({ x: c.x + c.f * 2.6 * c.hh, y: c.y, z: 0.55, sq: 1, r0: 0.1, r1: 0.9, life: 14, col: '255,230,160', lw: 0.06 }); big(c, { shape: 'line', len: 3.3, w: 0.5, m: 1.2, kind: 'pierce' }); VX.flash(1); G.SC.shake = 6; } } },
    { id: 'y_shoryu', n: '昇龍天穿', seq: ['rising_point', 'double_thrust', 'focused_point'], hint: '挑起，雙刺，凝點', clip: 'skill_shoryu_master', T: 58,
      run(c, t) { if (t === 1) intro(c, '255,215,130', 58); const [px, py] = ptAhead(c, 1.0);
        if (t === 4) { big(c, { shape: 'circle', x: px, y: py, r: 1.0, m: 0.6, kind: 'pierce', lv: 'heavy', launch: 80 }); const k = c.hh, f = c.f;   // r3.36.0：光龍從地面往上衝天
          MV2.dragon(tt => tt <= 0 ? [px, py, 0] : [px + f * Math.sin(tt * 0.2) * 0.45 * k, py, Math.min(tt, 30) * 0.26 * k + Math.max(0, tt - 30) * 0.1 * k], { life: 44, len: 16, w: 0.46, pal: 'gold', fade: 32 }); VX.crack({ x: px, y: py, r: 1.1 }); }
        if (t === 14 || t === 19) { VX.thrust({ x: px - c.f * 0.6 * c.hh, y: py, face: c.f, len: 1.4, w: 0.18, cy: 1.6, ang: -0.6, ext: 1, life: 8, col: YG, edge: '255,255,255' }); big(c, { shape: 'circle', x: px, y: py, r: 1.0, m: 0.5, kind: 'pierce', lv: 'heavy' }); }
        if (t === 32) { fall(c, px, py, { col: '255,225,150', h: 4, dx: 0.001, life: 6, len: 2.2, w: 5, big: 1, r: 1.4, m: 2.0 }); c.later(6, () => { VX.beam({ x: px, y: py, w: 0.4, h: 4, life: 18, col: '255,225,150' }); VX.flash(2); G.SC.shake = 8; }); } } },
    { id: 'y_ryusei', n: '流星槍', seq: ['long_pierce', 'side_gap', 'focused_point'], hint: '長驅，側入，凝點', clip: 'skill_ryusei_master', T: 64,
      run(c, t) { if (t === 1) { intro(c, YG, 64); const e = tgt(c, 7); c.a.mvx.p = e ? [e.x, e.y] : ptAhead(c, 1.5); } const [px, py] = c.a.mvx.p, k = c.hh;
        [[4, -1.4, 0.3], [9, 1.4, -0.3], [14, -1.2, -0.4], [19, 1.2, 0.4]].forEach(([f, dx, dy], i) => { if (t === f) { ghostAt(H.x, H.y, H.face, 12); tp(px + dx * k, py + dy * k); H.face = dx < 0 ? 1 : -1; VX.thrust({ x: H.x, y: H.y, face: H.face, len: 2.6, w: 0.16, cy: 0.55, ang: -dy * 0.2, ext: 1, life: 8, col: YG, edge: '255,255,255', tip: '255,225,140' }); big(c, { shape: 'circle', x: px, y: py, r: 1.0, m: 0.4, kind: 'pierce', lv: 'heavy', face: H.face }); } });
        if (t === 26) { tp(px - c.f * 2.2 * k, py); H.face = c.f; VX.glow({ x: px - 1.0 * k, y: py, z: 5, r: 0.5, col: '255,235,180', life: 16 }); }
        if (t === 32) fall(c, px, py, { col: '255,225,150', h: 5.5, dx: -1.6, life: 12, len: 2.6, w: 6, big: 1, r: 1.6, m: 1.8, on: () => { VX.flash(2); G.SC.shake = 8; VX.shard({ x: px, y: py, z: 0.05, n: 14, col: '150,130,110' }); } }); } },
    { id: 'y_kaiten', n: '迴天', seq: ['ground_sweep', 'shaft_gate', 'ground_sweep'], hint: '掃地，立門，再掃', clip: 'special_return', T: 50,
      run(c, t) { if (t === 1) intro(c, YG, 50); [[5, 1.3], [12, 1.6], [19, 1.9]].forEach(([f, r], i) => { if (t === f) { VX.ribbon({ x: c.x, y: c.y, face: c.f, a0: Math.PI, a1: -Math.PI * 1.03, sq: 0.42, r, w: 0.18 + i * 0.06, cy: 0.3 + i * 0.1, sw: 6, life: 14, col: YG, edge: '255,255,255', trail: 5, ew: 1.4 }); big(c, { shape: 'circle', r: r + 0.1, m: 0.6, kind: 'cut', lv: 'heavy' }); } });
        if (t === 28) { VX.ring({ x: c.x, y: c.y, r1: 3.0, life: 20, col: '210,230,255', lw: 0.12 }); VX.wind({ x: c.x, y: c.y, r: 2.2, n: 6, life: 18, col: '220,235,255', face: c.f, spin: 0.5 }); big(c, { shape: 'circle', r: 2.8, m: 1.2, kind: 'blunt', kb: 3 }); VX.flash(1); G.SC.shake = 6; } } },
    { id: 'y_bakuryu', n: '縛龍', seq: ['intercept_thrust', 'pulling_retreat', 'shaft_break'], hint: '攔，拉，破', clip: 'special_lane', T: 50,
      run(c, t) { if (t === 1) { intro(c, '255,215,130', 50); c.a.mvx.e = tgt(c, 7); } const e = c.a.mvx.e, k = c.hh;
        if (t === 4 && e) VX.custom((o, ctx) => { if (e.st === 'dead') return; const s = S(e.y), x0 = H.x + c.f * 0.6 * k, y0 = H.y - 0.55 * k, x1 = e.x, y1 = e.y - 0.55 * HH() * s * (e.ratio || 1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,215,130,.9)'; ctx.lineWidth = 2.5 * s;
            ctx.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * 18 + o.t * 0.6) * 4 * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); }, 24, 'o');
        if (t === 10 && e) big(c, { shape: 'circle', x: e.x, y: e.y, r: 0.6, m: 0.5, kind: 'pierce', lv: 'heavy', stun: 60 });
        if (t > 12 && t <= 22 && e && e.st !== 'dead' && !e.bb && !e.boss) { e.x += (H.x + c.f * 0.8 * k - e.x) * 0.25; e.y += (H.y - e.y) * 0.25; }
        if (t === 26) { VX.thrust({ x: c.x, y: c.y, face: c.f, len: 2.2, w: 0.42, cy: 0.55, ext: 2, life: 16, col: YG, edge: '255,255,255', tip: '255,225,140', lines: 5 }); c.later(2, () => { VX.shard({ x: c.x + c.f * 1.2 * k, y: c.y, z: 0.55, n: 14, col: '210,220,240' }); big(c, { shape: 'line', len: 2.3, w: 0.6, m: 2.6, kind: 'pierce', def: 30 }); VX.flash(2); G.SC.shake = 7; }); } } }
  ];
  /* ---------------- 和弓 ---------------- */
  const YM = '255,230,160';
  D.yumi = [
    { id: 'm_ryusei', n: '流星群', seq: ['quick_shot', 'fan_release', 'full_aim'], hint: '速射，扇放，滿弦', clip: 'ultimate_tenkyu_basic', T: 90,
      run(c, t) { if (t === 1) intro(c, YM, 90); if (t === 6) { c.muzzle(); VX.thrust({ x: c.x, y: c.y, face: c.f, len: 5, w: 0.06, cy: 0.7, ang: -1.3, ext: 3, life: 12, col: YM, edge: '255,255,255', lines: 0 }); }
        if (t === 14) VX.custom((o, ctx) => { const a = Math.sin(Math.min(1, o.t / o.life) * 3.14); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; const W = ctx.canvas.width; const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height * 0.4); g.addColorStop(0, 'rgba(255,220,150,' + 0.35 * a + ')'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, ctx.canvas.height * 0.4);
            ctx.strokeStyle = 'rgba(255,245,220,' + a + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.2, 10); for (let i = 1; i < 8; i++) ctx.lineTo(W * (0.2 + i * 0.08), 10 + (i % 2 ? 22 : 6)); ctx.stroke(); ctx.restore(); }, 70, 'o');
        if (t >= 20 && t < 70 && t % 3 === 0) { const es = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - H.x, (e.y - H.y) * 1.6) < 7 * c.hh), e = es.length && Math.random() < 0.7 ? es[Math.floor(Math.random() * es.length)] : null, [x, y] = e ? [e.x + rnd(-0.3, 0.3) * c.hh, e.y] : [c.x + c.f * rnd(1, 5) * c.hh, c.y + rnd(-0.8, 0.8) * c.hh];
          fall(c, x, y, { col: YM, h: rnd(4, 6), dx: -c.f * rnd(0.6, 1.4), life: 12, len: rnd(1.4, 2.2), w: 2.5, arrow: 1, r: 0.7, m: 0.22 }); }
        if (t === 76) { const [x, y] = ptAhead(c, 2.5); VX.beam({ x, y, w: 0.6, h: 5, life: 22, col: YM }); VX.ring({ x, y, r1: 2.6, life: 20, col: '255,240,200', lw: 0.12 }); big(c, { shape: 'circle', x, y, r: 2.4, m: 1.2, kind: 'arrow' }); VX.flash(2); G.SC.shake = 6; } } },
    { id: 'm_amenoha', n: '天羽羽矢', seq: ['mark_aim', 'follow_shot', 'piercing_shot'], hint: '標記，追射，穿點', clip: 'skill_tenkyu_master', T: 56,
      run(c, t) { if (t === 1) { intro(c, YM, 56); const e = G.E.find(q => q.st !== 'dead' && q.db && q.db.markT > 0) || tgt(c, 9); c.a.mvx.p = e ? [e.x, e.y] : ptAhead(c, 3); } const [px, py] = c.a.mvx.p;
        if (t === 4) VX.glyph({ x: px, y: py, r: 1.4, life: 40, col: '255,90,70', spin: 0.08 });
        if (t === 24) fall(c, px, py, { col: '255,235,180', h: 7, dx: 0.001, life: 10, len: 3, w: 8, arrow: 1, big: 1, r: 1.5, m: 3.2, on: () => { VX.beam({ x: px, y: py, w: 0.55, h: 6, life: 22, col: '255,235,180' }); VX.glyph({ x: px, y: py, r: 1.8, life: 30, col: '255,235,180', spin: -0.06 }); VX.flash(2); G.SC.shake = 8; } }); } },
    { id: 'm_senba', n: '千羽', seq: ['moving_shot', 'spread_shot', 'fan_release'], hint: '移步，散射，扇放', clip: 'special_fan', T: 50,
      run(c, t) { if (t === 1) intro(c, YM, 50); const k = c.hh, P = [[-0.6, -0.5], [-0.6, 0.5], [-1.1, -0.2], [-1.1, 0.3]];
        if (t === 6) P.forEach(([dx, dy]) => clone(c, c.x + c.f * dx * k, c.y + dy * k, c.f, 36, YM));
        if (t >= 14 && t <= 30 && t % 4 === 2) P.concat([[0, 0]]).forEach(([dx, dy]) => { for (let i = -2; i <= 2; i++) VX.shot({ k: 'arrow', x: c.x + c.f * (dx + 0.45) * k, y: c.y + dy * k, z: 0.7 * k, vx: c.f * 0.45 * k * Math.cos(i * 0.12), vy: Math.sin(i * 0.12) * 0.45 * k * 0.6, range: 8 * k, col: YM, trail: 3,
          onHit: e => { G.damageOni(e, 0.11 * c.mul, false); VX.impact(e, 'light', 'arrow'); c.a.mvx.hit = 1; } }); }); } },
    { id: 'm_hamaya', n: '破魔矢', seq: ['steady_focus', 'full_aim', 'piercing_shot'], hint: '穩神，滿弦，穿點', clip: 'skill_tsuikon_master', T: 56,
      run(c, t) { if (t === 1) { intro(c, '255,255,255', 56); VX.glyph({ x: c.x, y: c.y, r: 1.2, life: 40, col: '255,250,230' }); }
        if (t === 22) { const p = c.shoot('orb', { spd: 0.6, range: 12, pierce: 99, r: 0.22, col: '255,250,230', m: 0.6, lv: 'heavy' }); VX.custom((o, ctx) => { if (p.dead) { o.t = o.life; return; } const s = S(p.y), k = HH() * s; ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(o.t * 0.2); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,245,210,.8)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.arc(0, 0, 0.35 * k, 0, TAU); ctx.stroke(); for (let i = 0; i < 6; i++) { ctx.rotate(1.047); ctx.beginPath(); ctx.moveTo(0.25 * k, 0); ctx.lineTo(0.42 * k, 0); ctx.stroke(); } ctx.restore();
            if (o.t % 3 === 0) VX.glow({ x: p.x, y: p.y, z: p.z / k, r: 0.5, col: '255,245,210', life: 10 }); }, 40, 'o'); }
        if (t === 34) { for (let i = 0; i < 6; i++) c.later(i * 2, () => { const [x, y] = ptAhead(c, 1 + i * 1.7); VX.glow({ x, y, z: 0.6, r: 0.6, col: '255,250,230', life: 10 }); }); big(c, { shape: 'line', len: 11, w: 0.5, m: 2.0, kind: 'arrow', def: 30 }); VX.flash(2); G.SC.shake = 5; } } },
    { id: 'm_tsukikage', n: '月影', seq: ['covered_step', 'lower_retreat', 'follow_shot'], hint: '藏步，低退，追射', clip: 'special_backshot', T: 54,
      run(c, t) { if (t === 1) { intro(c, '150,190,255', 54); VX.dim(54, 0.6); } if (t <= 10) { c.move(-0.12, 0); if (t % 3 === 0) ghostAt(H.x, H.y, H.face, 14); }
        if (t === 16 || t === 21 || t === 26) { const es = G.E.filter(e => e.st !== 'dead' && e.hp > 0).sort((a, b) => Math.hypot(a.x - H.x, a.y - H.y) - Math.hypot(b.x - H.x, b.y - H.y)), e = es[(t - 16) / 5 % Math.max(1, es.length)];
          c.shoot('arrow', { home: e, turn: 0.18, spd: 0.4, range: 10, col: '170,200,255', trail: 10, m: 0.9, lv: 'heavy', ang: (t - 21) * 0.08 - 0.3, onHit: q => { VX.ring({ x: q.x, y: q.y, r1: 1.2, life: 16, col: '170,200,255', lw: 0.08 }); VX.glow({ x: q.x, y: q.y, z: 0.5, r: 0.8, col: '170,200,255', life: 12 }); } }); } } }
  ];
  /* ---------------- 鐵砲 ---------------- */
  const TF = '255,160,70';
  D.teppo = [
    { id: 't_karyu', n: '火龍', seq: ['pressure_shot', 'close_scatter', 'steady_rifle'], hint: '壓制，散擊，穩膛', clip: 'ultimate_hyakuren_basic', T: 70,
      run(c, t) { if (t === 1) intro(c, TF, 70); if (t >= 6 && t <= 20 && t % 3 === 0) { c.muzzle(true, (Math.random() - 0.5) * 0.3); }
        if (t === 22) { const x0 = c.x + c.f * 0.95 * c.hh, y0 = c.y, f = c.f, k = c.hh, hd = tt => tt <= 0 ? [x0, y0, 0.62 * k] : [x0 + f * Math.min(1, tt / 30) * 5 * k, y0, (0.7 + Math.sin(tt * 0.3) * 0.35) * k];   // r3.36.0：火龍改光龍（龍身跟龍頭路徑）
          VX.spr({ n: 'fx_tier_teppo_master', x: x0 + f * 0.4 * k, y: y0, z: 0.62, w: 1.6, flip: f < 0, life: 18 });
          MV2.dragon(hd, { life: 50, len: 14, w: 0.42, pal: 'fire', fade: 36, step: (o, t) => { const hx = hd(t)[0]; if (t % 4 === 0 && t < 32) { VX.spark({ x: hx, y: y0, z: 0.6 * k, n: 4, spd: 3, col: '255,180,90' }); big(c, { shape: 'circle', x: hx, y: y0, r: 1.0, m: 0.8, kind: 'shot', lv: 'heavy', col: TF, skip: o.hit = o.hit || [] }).forEach(e => o.hit.push(e)); }
            if (t === 31) { VX.spr({ u: 'p_ibaraki_fx', n: 'flame_drop', x: hx, y: y0, w: 2.6, life: 24 }); VX.glow({ x: hx, y: y0, z: 0.6, r: 1.6, col: TF, life: 14 }); VX.ring({ x: hx, y: y0, r1: 2.2, life: 18, col: '255,200,120', lw: 0.12 }); VX.smoke({ x: hx, y: y0, n: 8, r: 0.25, life: 50, a: 0.45, col: '90,80,75' }); big(c, { shape: 'circle', x: hx, y: y0, r: 2.6, m: 1.6, kind: 'shot', kb: 2 }); VX.flash(2); G.SC.shake = 8; } } }); } } },
    { id: 't_sandan', n: '三段撃・極', seq: ['point_shot', 'focused_shot', 'steady_rifle'], hint: '點，凝，穩', clip: 'skill_rensha_master', T: 60,
      run(c, t) { if (t === 1) intro(c, TF, 60); const k = c.hh, P = [[-0.4, -0.45], [-0.4, 0.45], [0, 0]]; if (t === 4) P.slice(0, 2).forEach(([dx, dy]) => clone(c, c.x + c.f * dx * k, c.y + dy * k, c.f, 46, TF));
        [10, 24, 38].forEach(f0 => P.forEach(([dx, dy], i) => { if (t === f0 + i * 3) { const x = c.x + c.f * (dx + 0.95) * k, y = c.y + dy * k; VX.glow({ x, y, z: 0.62, r: 0.45, col: '255,190,90', life: 6 }); VX.smoke({ x, y, z: 0.62 * k, n: 3, vx: c.f * 0.8, r: 0.14, life: 50, a: 0.45 });
            VX.shot({ k: 'bullet', x, y, z: 0.62 * k, vx: c.f * 0.8 * k, vy: 0, range: 9 * k, col: '255,200,110', onHit: e => { G.damageOni(e, 0.4 * c.mul, true); VX.impact(e, 'heavy', 'shot'); } }); } }));
        if (t === 48) { VX.flash(1); G.SC.shake = 5; } } },
    { id: 't_namari', n: '鉛雨', seq: ['ramrod_load', 'close_scatter', 'rifle_retreat'], hint: '裝填，散擊，退膛', clip: 'special_scatterback', T: 64,
      run(c, t) { if (t === 1) intro(c, TF, 64); if (t === 8) { c.muzzle(true, 1.2); for (let i = 0; i < 6; i++) VX.thrust({ x: c.x, y: c.y, face: c.f, len: 5, w: 0.05, cy: 0.7, ang: -1.35 + i * 0.05, ext: 2, life: 10, col: '255,200,110', edge: '255,250,230', lines: 0 }); }
        if (t >= 20 && t < 56 && t % 2 === 0) { const es = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - H.x, (e.y - H.y) * 1.6) < 5 * c.hh), e = es.length && Math.random() < 0.6 ? es[Math.floor(Math.random() * es.length)] : null, [x, y] = e ? [e.x + rnd(-0.3, 0.3) * c.hh, e.y] : [c.x + c.f * rnd(0.8, 4.5) * c.hh, c.y + rnd(-0.9, 0.9) * c.hh]; fall(c, x, y, { col: '255,200,110', h: 4, dx: -c.f * 0.4, life: 8, len: 1.0, w: 2, r: 0.6, m: 0.3 }); if (t % 6 === 0) VX.spark({ x, y, z: 2, n: 4, up: 2, spd: 3, col: '255,210,140' }); } } },
    { id: 't_raitou', n: '雷筒', seq: ['aim_shift', 'ramrod_load', 'steady_rifle'], hint: '瞄移，裝填，穩膛', clip: 'skill_sogeki_master', T: 54,
      run(c, t) { if (t === 1) intro(c, '190,210,255', 54); if (t > 2 && t < 22 && t % 2 === 0) VX.bolt({ x0: c.x, y0: c.y - 0.6 * c.hh, x1: c.x + c.f * 0.95 * c.hh, y1: c.y - (0.6 + rnd(-0.1, 0.1)) * c.hh, life: 4, w: 2, br: 0 });
        if (t === 24) { const x0 = c.x + c.f * 0.95 * c.hh, x1 = c.x + c.f * 9 * c.hh, y = c.y - 0.62 * c.hh; VX.bolt({ x0, y0: y, x1, y1: y, life: 16, w: 6, br: 4 }); VX.glow({ x: x0, y: c.y, z: 0.62, r: 0.8, col: '200,220,255', life: 10 });
          const hs = big(c, { shape: 'line', len: 9, w: 0.45, m: 2.0, kind: 'shot', stun: 60, col: '190,210,255' }); let prev = hs[0]; for (let j = 0; j < 3 && prev; j++) { const nx = G.E.find(e => e.st !== 'dead' && e.hp > 0 && !hs.includes(e) && Math.hypot(e.x - prev.x, e.y - prev.y) < 3 * c.hh); if (!nx) break; hs.push(nx); const p0 = prev; c.later(4 + j * 4, () => { VX.bolt({ x0: p0.x, y0: p0.y - 0.5 * c.hh, x1: nx.x, y1: nx.y - 0.5 * c.hh, life: 10, w: 3 }); G.damageOni(nx, 0.6 * c.mul, true); VX.impact(nx, 'heavy', 'shot', undefined, '190,210,255'); }); prev = nx; }
          VX.flash(2); G.SC.shake = 7; } } },
    { id: 't_horoku', n: '焙烙連爆', seq: ['stock_deflect', 'close_scatter', 'denial_fire'], hint: '托擊，散擊，斷進', clip: 'skill_horoku_master', T: 70,
      run(c, t) { if (t === 1) intro(c, TF, 70); [8, 14, 20].forEach((f, i) => { if (t === f) { const d = 1.5 + i * 1.1; VX.shot({ k: 'bomb', x: c.x + c.f * 0.5 * c.hh, y: c.y + (i - 1) * 0.3 * c.hh, z: 0.8 * c.hh, vx: c.f * d * c.hh / 26, vy: 0, grav: 0.55 * S(c.y), vz: -7 * S(c.y), range: 99 * c.hh,
              onLand: p => c.later(4 + (2 - i) * 4, () => { VX.glow({ x: p.x, y: p.y, z: 0.4, r: 1.3, col: TF, life: 12 }); VX.ring({ x: p.x, y: p.y, r1: 1.8, life: 18, col: '255,200,120', lw: 0.1 }); VX.spark({ x: p.x, y: p.y, z: 6, n: 14, up: 3, spd: 6, col: '255,190,100' }); VX.smoke({ x: p.x, y: p.y, n: 6, r: 0.22, life: 50, a: 0.5, col: '90,80,75' }); VX.crack({ x: p.x, y: p.y, r: 0.9, n: 7, col: TF });
                VX.custom((o, ctx) => { const s = S(p.y), k = HH() * s, a = 1 - o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 8; j++) { const an = j * 0.785 + o.t * 0.05, x = p.x + Math.cos(an) * 0.9 * k, y = p.y + Math.sin(an) * 0.35 * k, h = (0.2 + 0.1 * Math.sin(o.t * 0.4 + j)) * k; const g = ctx.createLinearGradient(x, y, x, y - h); g.addColorStop(0, 'rgba(255,200,110,' + 0.8 * a + ')'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - h / 2, 0.08 * k, h / 2, 0, 0, TAU); ctx.fill(); } ctx.restore(); }, 90, 'g');
                big(c, { shape: 'circle', x: p.x, y: p.y, r: 1.5, m: 0.9, kind: 'blunt', kb: 1.5, lv: i === 2 ? 'hiden' : 'heavy' }); if (i === 2) VX.flash(2); G.SC.shake = 6; }) }); } }); } }
  ];
  for (const w in D) MV2.hiden(w, D[w]);
  MV2.fall = fall; MV2.intro = intro; MV2.ghostAt = ghostAt; MV2.tp = tp;
})();
