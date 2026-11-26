/* ==========================================================================
 * 神諭之地 重製版 — 114_yari.js
 * Version : r3.80.0  (2026-11-25)
 * 變更    : r3.80.0 G.YARI2（116 接手長槍全部招式）時不再套用本檔的覆寫。
 *           r3.77.0 新增。長槍「中距離直線突刺＋靈活變化的範圍攻擊」（銀紫 lance 色盤、槍尖金點，用 111 元件）。
 *           距離：突刺長度 ×1.15（中距離），掃擊半徑 ×1.1；突刺帶殘槍（連刺速度感）、貫穿時碎光從敵人背後噴出、停頓短而俐落。
 *           範圍變化：旋槍＝槍尖連刺呈扇形散開＋槍尖旋光；槍林＝地面依序竄出銀紫光槍（兩排）；流星突＝從天斜落的光槍砸地；
 *                     架勢拒進＝身前一道銀紫光障，靠近的敵人被平順推回；凝點＝光點往槍尖收束後一擊貫穿；定線＝架槍光。
 *           光龍（昇龍、昇龍秘傳、奧義龍牙）改成銀紫實心龍身（漸細身體＋鱗光＋龍頭亮點），不再用白色疊加描邊。
 * 依賴    : 111_katana_fx（G.KF）、79_mv_pole（槍招式）、83_skills（槍技）、84_fxkit（MV2.dragon）、92_lab（槍技、秘傳）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const KF = () => G.KF, Ln = fn => G.KF.use('lance', fn), YC = '190,215,255', RL = 1.15, RR = 1.1;
  const isY = () => G.WPN.curId() === 'yari';
  const mark = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };
  const stab = (c, o) => Ln(() => KF().stab(Object.assign({ x: c.x, y: c.y, f: c.f, len: 1.9, w: 0.2, cy: 0.55, dur: 2, life: 16, tip: 1, echo: 2 }, o)));
  /* ---------- 範圍：突刺加長、掃擊加寬（出招時套用，不改招式資料） ---------- */
  const scale = o => { if (!o || typeof o !== 'object') return o; o = Object.assign({}, o); if (o.len) o.len *= RL; if (o.r) o.r *= RR; if (o.hr) o.hr *= RR; return o; };
  function wrapRun(def) { if (!def || def.__w) return; const r0 = def.run, c0 = def.counter;
    const W = fn => function (c) { const s0 = c.slash, h0 = c.hit, t0 = c.thrust; c.slash = o => s0.call(c, scale(o)); c.hit = o => h0.call(c, scale(o)); c.thrust = o => t0.call(c, scale(o)); try { return fn.apply(this, arguments); } finally { c.slash = s0; c.hit = h0; c.thrust = t0; } };
    def.run = W(r0); if (c0) def.counter = W(c0); def.__w = 1; }
  /* ---------- 招式：凝點、定線 ---------- */
  const DM = {
    focused_point: { run(c, t) { if (t === 1) Ln(() => KF().charge(c.x + c.f * 1.1 * c.hh, c.y, 0.55, 20, 16));
        if (t === 21) { c.thrust({ len: 2.5, w: 0.3, m: 2.2, lv: 'heavy', ext: 2, life: 16, crit: Math.random() < 0.4 }); Ln(() => { KF().light(c.x + c.f * 2.3 * c.hh, c.y, 1.0, 16, 0.5, 0.55); KF().motes(c.x + c.f * 2.4 * c.hh, c.y, 0.55, 8, { ang: c.f > 0 ? 0 : Math.PI, spread: 0.3, sp: 2, life: 18 }); }); SC.shake = Math.max(SC.shake || 0, 4); } } },
    fixed_line: { run(c, t) { if (t === 2) Ln(() => KF().aura(36)); if (t === 30) mark(c); } }
  };
  /* ---------- 技・特技 ---------- */
  function spike(x, y, k, d) { Ln(() => { const C = KF().PAL.lance; KF().add(30 + d, 'o', (ctx, u) => { const t = u - d; if (t < 0) return; const g = KF().eo5(Math.min(1, t / 4)), a = t > 20 ? Math.max(0, 1 - (t - 20) / 10) : 1, h = 0.95 * k * g, w = 0.11 * k;   // 地面竄出的光槍：實心漸細、槍尖金光
      ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gd, x, y - h * 0.5, w * 4, h * 1.3, 0.4 * a); ctx.globalCompositeOperation = 'source-over';
      for (const [ww, col, al] of [[1, C.deep, 0.85], [0.6, C.mid, 0.95], [0.22, C.lite, 1]]) { ctx.fillStyle = 'rgba(' + col + ',' + (al * a).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(x - w * ww, y); ctx.quadraticCurveTo(x - w * ww * 0.4, y - h * 0.6, x, y - h); ctx.quadraticCurveTo(x + w * ww * 0.4, y - h * 0.6, x + w * ww, y); ctx.closePath(); ctx.fill(); }
      ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, KF().PAL.ember.T.gl, x, y - h, w * 2.6, w * 2.6, 0.7 * a * (t < 8 ? 1 : 0.5)); }); KF().puff(x, y, 0.3, 22); }); }
  const DU = {
    skill_ryusei: { run(c, t) { const lv = c.a.mvx.lv || 1, m = c.a.mvx; if (t === 2) { c.ghost(14); m.x0 = c.x; Ln(() => KF().motes(c.x, c.y, 0.6, 8, { ang: Math.PI / 2, spread: 0.3, sp: 1.8, life: 16 })); }
        if (t > 4 && t <= 18) c.move(2.5 / 14, 0);
        if (t === 12) Ln(() => { const k = c.hh; KF().qi({ x: c.x + c.f * 0.6 * k, y: c.y, z: 1.4, ang: c.f > 0 ? -1.2 : 1.2 + Math.PI, len: 2.6, w: 0.12, dur: 6, life: 14, motes: 4 }); });   // 從天斜落的光槍
        if (t === 20) { const x = c.x + c.f * 0.4 * c.hh, r = lv >= 3 ? 1.3 : 1.0; Ln(() => { KF().crack(x, c.y, r * 1.3, 40, true); KF().puff(x, c.y, 1.2); KF().light(x, c.y, 1.4, 20, 0.6, 0.6); KF().motes(x, c.y, 0.2, 12, { ang: Math.PI / 2, spread: 0.8, sp: 2.2, life: 26 }); }); SC.shake = Math.max(SC.shake || 0, 5);
          c.hit({ shape: 'circle', x, y: c.y, r, m: 2.0, lv: 'heavy', kind: 'pierce', kb: 1 }); if (lv >= 5) { const sk = []; VX.custom(() => {}, 180, 'g', { step: (o, tt) => { if (tt % 20 === 10) { c.hit({ shape: 'circle', x, y: c.y, r, m: 0.3, lv: 'light', kind: 'pierce' }); Ln(() => KF().motes(x, c.y, 0.1, 3, { up: 0.8, sp: 0.3, rx: r * 0.7, life: 20 })); } } }); Ln(() => KF().light(x, c.y, r * 1.2, 180, 0.3)); } } } },
    skill_senso: { run(c, t) { const lv = c.a.mvx.lv || 1, n = 8 + (lv >= 3 ? 4 : 0); for (let i = 0; i < n; i++) if (t === 4 + i * 3) { const last = lv >= 5 && i === n - 1, ang = Math.sin(i * 1.9) * 0.16;   // 旋槍：槍尖連刺呈扇形散開
          c.thrust({ len: last ? 4 : 1.43, w: 0.16, ang, cy: 0.55 + Math.cos(i * 1.9) * 0.08, ext: 1, life: 7, m: 0.35, lv: i === n - 1 ? 'heavy' : 'light', lines: 1 });
          if (i % 2 === 0) Ln(() => KF().smear({ x: c.x + c.f * 0.95 * c.hh, y: c.y, f: c.f, cy: 0.55, r: 0.28, sq: 1, a0: i * 0.8, a1: i * 0.8 + 5, w: 0.1, dur: 4, life: 8, tier: 0, motes: 0, trail: 3 })); }   // 槍尖旋光
        c.a.T = 10 + n * 3; } },
    skill_sorin: { run(c, t) { const lv = c.a.mvx.lv || 1, rows = lv >= 3 ? [-0.35, 0.35] : [0]; if (t !== 8) return; const x0 = c.x, y0 = c.y, f = c.f, k = c.hh, sk = [];
        for (const dy of rows) for (let i = 0; i < 8; i++) { const x = x0 + f * (0.6 + i * 0.45) * k, y = y0 + dy * k; spike(x, y, k, i * 2); c.later(i * 2, () => { c.hit({ shape: 'circle', x, y, r: 0.45, m: 1.2 / rows.length * 0.7, lv: i === 7 ? 'heavy' : 'mid', kind: 'pierce', launch: 30, skip: sk }).forEach(e => sk.push(e)); }); } } },
    special_deny: { run(c, t) { const lv = c.a.mvx.lv || 1; if (t === 1) { c.a.T = lv >= 3 ? 184 : 124; const a0 = c.a, f = c.f; Ln(() => KF().add(190, 'o', (ctx, u) => { if (H.act !== a0) return; const k = HH() * S(H.y), a = Math.min(1, u / 8), x = H.x + f * 1.5 * k, C = KF().PAL.lance; ctx.globalCompositeOperation = 'screen';   // 銀紫光障
          for (let i = 0; i < 5; i++) KF().spr(ctx, C.T.gm, x + Math.sin(u * 0.15 + i) * 0.05 * k, H.y - (0.15 + i * 0.22) * k, k * 0.45, k * 0.5, 0.3 * a * (0.8 + 0.2 * Math.sin(u * 0.3 + i))); KF().spr(ctx, KF().PAL.ember.T.gl, x, H.y - 0.55 * k, k * 0.25, k * 0.25, 0.6 * a); })); }
        for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss) continue; const dx = (e.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * c.hh && Math.abs(e.y - H.y) < 0.45 * c.hh) { e.x += (H.x + c.f * 1.6 * c.hh - e.x) * 0.35; if (t % 20 === 0) Ln(() => KF().burst(H.x + c.f * 1.5 * c.hh, e.y, 0.5, 0.8, c.f > 0 ? Math.PI : 0)); } }
        if (t === 30) c.a.mvx.hit = 1; } }
  };
  /* ---------- 光龍：銀紫實心龍身 ---------- */
  function lanceDragon(ctx, P, k, t, a, o) { const N = P.length; if (N < 8 || a <= 0) return; const C = KF().PAL.lance, W = (o.w || 0.42) * k * 0.8, wid = u => u < 0.08 ? 0.7 + u * 3.5 : u < 0.5 ? 1 : Math.max(0.08, 1 - (u - 0.5) / 0.5 * 0.92);
    const Lf = [], Rt = []; for (let i = 0; i < N; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(N - 1, i + 1)], dx = p0[0] - p1[0], dy = p0[1] - p1[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = wid(i / (N - 1)) * W; Lf.push([P[i][0] + nx * w, P[i][1] + ny * w]); Rt.push([P[i][0] - nx * w, P[i][1] - ny * w]); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < N; i += 3) KF().spr(ctx, C.T.gd, P[i][0], P[i][1], W * 4, W * 4, 0.35 * a);
    ctx.globalCompositeOperation = 'source-over'; const body = (f, col, al) => { ctx.fillStyle = 'rgba(' + col + ',' + (al * a).toFixed(3) + ')'; ctx.beginPath(); for (let i = 0; i < N; i++) { const l = Lf[i], r = Rt[i], m = P[i]; ctx.lineTo(m[0] + (l[0] - m[0]) * f, m[1] + (l[1] - m[1]) * f); } for (let i = N - 1; i >= 0; i--) { const r = Rt[i], m = P[i]; ctx.lineTo(m[0] + (r[0] - m[0]) * f, m[1] + (r[1] - m[1]) * f); } ctx.closePath(); ctx.fill(); };
    body(1, C.deep, 0.85); body(0.65, C.mid, 0.9); body(0.22, C.lite, 0.9);
    ctx.globalCompositeOperation = 'screen'; for (let i = 2; i < N * 0.7; i += 4) KF().spr(ctx, C.T.mote, P[i][0], P[i][1], W * 0.9, W * 0.9, 0.6 * a * (0.6 + 0.4 * Math.sin(t * 0.4 + i)));   // 鱗光
    KF().spr(ctx, C.T.gl, P[0][0], P[0][1], W * 3.4, W * 3.4, 0.8 * a); KF().spr(ctx, KF().PAL.ember.T.gl, P[0][0], P[0][1], W * 1.4, W * 1.4, 0.8 * a); ctx.restore(); }   // 龍頭：亮點＋金眼
  (function hook() { if (!MV2.dragon || !MV2.dragonPath) return setTimeout(hook, 50); const dr0 = MV2.dragon;
    MV2.dragon = (head, o) => { if (!isY()) return dr0(head, o); return VX.custom((q, ctx) => { const s = S(head(q.t)[1]), k = HH() * s, a = q.t < 4 ? q.t / 4 : q.t > (o.fade || q.life - 10) ? (q.life - q.t) / (q.life - (o.fade || q.life - 10)) : 1;
        lanceDragon(ctx, MV2.dragonPath(head, q.t, o.len || 18, 44), k, q.t, a, o); if (q.t % 2 === 0 && a > 0.3) { const p = head(q.t - Math.random() * (o.len || 18)); Ln(() => KF().motes(p[0], p[1], p[2] / k, 1, { sp: 0.4, life: 20 })); } }, o.life || 50, 'o', o.step ? { step: o.step } : undefined); }; })();
  /* ---------- 掛上（每格對照參照，必要時補回） ---------- */
  function patch() { if (G.YARI2) return; const D = MV2.D.yari, U = MV2.U.yari;   // r3.80.0：長槍全面改由 116 接手
    if (D) { for (const k in DM) { const d = D[k]; if (d && d.__dm !== DM[k].run) { d.run = DM[k].run; d.__w = 0; d.__dm = DM[k].run; } } for (const k in D) wrapRun(D[k]); }
    if (U) for (const k in DU) { const d = U[k]; if (d && d.run !== DU[k].run && d.run !== DU[k].__wr) { d.run = DU[k].run; } } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); patch(); };
})();
