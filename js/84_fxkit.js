/* ==========================================================================
 * 神諭之地 重製版 — 84_fxkit.js
 * Version : r3.36.0  (2026-11-17)
 * 變更    : r3.36.0 新增。手繪特效素材接入＋光龍。
 *           ・VX.spr：把素材包裡的手繪特效（共用包 fx_common、白丸／疾風／茨木的特效包）放進程式特效系統，可旋轉、壓扁、加亮、跟隨。
 *           ・地面碎裂改用素材：VX.crack 改畫「白丸震地塵環＋地裂」，大範圍再加「金棒土塊飛濺」；原本的向量裂紋不再使用。
 *           ・VX.sigil：發光法陣（skill_light_glyph）貼地；VX.pillar：光柱（skill_light_pillar）。
 *           ・MV2.glowDragon：光龍（不填色、不描邊，全部是發光筆觸）：頭（角、鬃、顎、鬚、眼）、鱗光、背焰、四爪、漸細龍尾＋尾焰。
 *             龍身＝龍頭走過的路徑（MV2.dragonPath），龍身自然跟著龍頭擺動。
 *           ・MV2.fallArrow：天降箭（素材箭＋光痕，落地插地；光柱版每箭帶光柱）。
 * 依賴    : 12_anim（G.ANIM）、76_vfx（VX.custom）、77_moves（MV2）。
 * ========================================================================== */
'use strict';
(function () {
  const VX = G.VX, MV2 = G.MV2, A = G.ANIM, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TK = 1000 / 60, TAU = 6.2832; if (!VX || !MV2) return;
  /* ---------- 素材包：用到時才下載（共用包開機就有） ---------- */
  const PK = ['p_shiro_fx', 'p_hayate_fx', 'p_ibaraki_fx'], asked = {};
  const unit = k => { const u = A.get(k); if (!u && !asked[k]) { asked[k] = 1; try { const p = A.load(k); if (p && p.catch) p.catch(() => {}); } catch (x) {} setTimeout(() => { asked[k] = 0; }, 3000); } return u; };
  VX.preload = () => PK.forEach(unit);
  (function w() { if (!A.IDX) return setTimeout(w, 200); setTimeout(VX.preload, 1500); })();
  const mw = r => r._mw || (r._mw = Math.max(...r.f.map(f => f[2])));
  /* o：u 素材包、n 名稱、x y（地面）、z（高度，HH）、w（寬，HH）、rot、flip、add（加亮）、sy（垂直壓扁）、life（格；整段動畫縮放到此長度）、a、l（'g' 地面層｜'o' 上層）、hold（停在最後一格） */
  VX.spr = o => { const u0 = unit(o.u || 'fx_common'); if (!u0 || !u0.fx || !u0.fx[o.n]) return null; const r = u0.fx[o.n], life = o.life || Math.max(6, Math.round(A.dur(r) / TK));
    return VX.custom((q, ctx) => { const u = A.get(o.u || 'fx_common'); if (!u) return; const x = o.fx ? o.fx() : [o.x, o.y], s = S(x[1]), k = HH() * s, fr = A.frameAt(r, Math.min(q.t, life - 1) * TK, life * TK), sc = (o.w || 1) * k / mw(r);
      const a = (o.a === undefined ? 1 : o.a) * Math.min(1, (q.life - q.t) / Math.max(1, q.life * 0.25)); ctx.save(); if (o.add) ctx.globalCompositeOperation = 'lighter';
      ctx.translate(x[0], x[1] - (o.z || 0) * k); if (o.rot) ctx.rotate(o.rot); if (o.sy) ctx.scale(1, o.sy); A.draw(u, fr, 0, 0, sc, !!o.flip, a); ctx.restore(); }, life + (o.hold || 0), o.l || 'o'); };
  /* ---------- 地面碎裂（取代向量裂紋）：塵環＋地裂＋（大）土塊 ---------- */
  VX.crack0 = VX.crack;
  VX.crack = o => { const r = o.r || 1.2, x = o.x, y = o.y, big = r >= 1.3; if (!unit('p_shiro_fx')) return VX.crack0(o);   // 素材未就緒 → 舊版
    VX.spr({ u: 'p_shiro_fx', n: 'heavy_quake', x, y, w: r * 3.2, sy: 0.85, l: 'g', life: 30 });
    VX.spr({ u: 'p_shiro_fx', n: 'claw_rift', x, y, w: r * 2.6, rot: o.dir || 0, flip: Math.random() < 0.5, l: 'g', life: 40, hold: 20 });
    if (big) VX.spr({ n: 'fx_tier_kanabo_master', x, y, z: 0.15, w: r * 1.5, life: 22 });
    else VX.spr({ n: 'fx_tier_kanabo_evolved', x, y, z: 0.1, w: r * 1.3, life: 18 }); };
  VX.sigil = o => VX.spr({ n: o.big ? 'skill_light_glyph_b' : 'skill_light_glyph_a', x: o.x, y: o.y, w: o.r * 2, sy: o.sy || 0.9, add: 1, l: 'g', life: o.life || 40, hold: o.hold || 0, a: o.a });
  VX.pillar = o => { const w = o.w || 0.8, h = o.h || 2; return VX.spr({ n: o.big ? 'skill_light_pillar_b' : 'skill_light_pillar_a', x: o.x, y: o.y, z: h * 0.5, w, sy: h / (w * (o.big ? 1.08 : 1.9)), add: 1, life: o.life || 22 }); };   // 依高度拉長
  /* ---------- 光龍 ---------- */
  const PAL = { gold: ['255,170,60', '255,215,130', '255,250,230', '255,120,40'], azure: ['80,150,255', '170,210,255', '240,250,255', '120,190,255'], fire: ['255,80,20', '255,150,60', '255,240,200', '255,60,10'] };
  function glowDragon(ctx, P, k, t, a, o) { o = o || {}; const N = P.length; if (N < 8 || a <= 0) return; const [C1, C2, C3, CF] = PAL[o.pal || 'gold'], W = (o.w || 0.42) * k, rg = (c, al) => 'rgba(' + c + ',' + Math.max(0, al) * a + ')';
    const wid = u => u < 0.08 ? 0.7 + u * 3.5 : u < 0.5 ? 1 : Math.max(0.1, 1 - (u - 0.5) / 0.5 * 0.92);
    const D = []; for (let i = 0; i < N; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(N - 1, i + 1)], dx = p0[0] - p1[0], dy = p0[1] - p1[1], L = Math.hypot(dx, dy) || 1; D.push([dx / L, dy / L]); }   // 朝頭的方向
    const nrm = i => { const d = D[i], up = -d[0] * (d[0] >= 0 ? 1 : -1) < 0 ? 1 : 1; let nx = -d[1], ny = d[0]; if (ny > 0) { nx = -nx; ny = -ny; } return [nx, ny]; };   // 背＝朝上
    const edge = (i, sg, f) => { const n = nrm(i), w = wid(i / (N - 1)) * W * (f || 1); return [P[i][0] + n[0] * w * sg, P[i][1] + n[1] * w * sg]; };
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const seg = (i, lw, col) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke(); };
    /* 四爪（身後先畫）：上臂→前臂→三爪，全部發光筆觸 */
    const claw = (u, sg, ph) => { const i = Math.round(u * (N - 1)), n = nrm(i), d = D[i], base = edge(i, -1, 0.6), sw = Math.sin(t * 0.35 + ph) * 0.35, L1 = W * 1.0, L2 = W * 0.8;
      const e1 = [base[0] - n[0] * L1 * 0.7 - d[0] * L1 * (0.6 + sw), base[1] - n[1] * L1 * 0.7 - d[1] * L1 * (0.6 + sw) + sg * W * 0.15], e2 = [e1[0] + d[0] * L2 * (0.9 - sw) - n[0] * L2 * 0.4, e1[1] + d[1] * L2 * (0.9 - sw) - n[1] * L2 * 0.4];
      ctx.globalCompositeOperation = 'lighter'; for (const [lw, c, al] of [[W * 0.62, C1, 0.12], [W * 0.4, C1, 0.2], [W * 0.24, C2, 0.3], [W * 0.09, C3, 0.4]]) { ctx.strokeStyle = rg(c, al * (sg > 0 ? 1 : 0.55)); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); }
      for (let j = 0; j < 3; j++) { const L4 = W * (0.5 + 0.15 * Math.sin(t * 0.6 + j + ph)); ctx.strokeStyle = rg(CF, 0.35); ctx.lineWidth = W * 0.08; ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.quadraticCurveTo(e1[0] - d[0] * L4 * 0.6 + n[0] * (j - 1) * W * 0.2, e1[1] - d[1] * L4 * 0.6 + n[1] * (j - 1) * W * 0.2, e1[0] - d[0] * L4 - n[0] * L4 * 0.3, e1[1] - d[1] * L4 - n[1] * L4 * 0.3); ctx.stroke(); }   // 肘毛
      for (let j = -1; j <= 1; j++) { const an = Math.atan2(d[1], d[0]) + j * 0.45 + 0.4, L3 = W * 0.36; ctx.strokeStyle = rg(C2, 0.75 * (sg > 0 ? 1 : 0.55)); ctx.lineWidth = W * 0.08; ctx.beginPath(); ctx.moveTo(e2[0], e2[1]); ctx.quadraticCurveTo(e2[0] + Math.cos(an) * L3, e2[1] + Math.sin(an) * L3, e2[0] + Math.cos(an + 0.7) * L3 * 1.1, e2[1] + Math.sin(an + 0.7) * L3 * 1.1); ctx.stroke(); } };
    claw(0.2, -1, 1.5); claw(0.52, -1, 3.1);
    /* 龍身：外形輪廓（兩側邊線）分三層半透明發光疊上去（外暈／身／芯），不描邊、不塗實 */
    const body = (f) => { ctx.beginPath(); for (let i = 0; i < N; i++) { const p = edge(i, 1, f); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } for (let i = N - 1; i >= 0; i--) { const p = edge(i, -1, f); ctx.lineTo(p[0], p[1]); } ctx.closePath(); };
    ctx.globalCompositeOperation = 'lighter'; for (const [f, c, al] of [[1.45, C1, 0.13], [1.0, C1, 0.2], [0.68, C2, 0.28], [0.32, C3, 0.42]]) { body(f); ctx.fillStyle = rg(c, al); ctx.fill(); }
    /* 鱗光：每節三排月牙弧（背、身、腹），由頭往尾一波波閃過 */
    for (let i = 3; i < N * 0.88; i += 1.5) { const ii = Math.round(i), u = ii / (N - 1), n = nrm(ii), d = D[ii], w = wid(u) * W, an = Math.atan2(d[1], d[0]), sh = 0.5 + 0.5 * Math.sin(t * 0.35 - ii * 0.5);
      for (const [sg, al] of [[0.55, 0.5], [0.05, 0.75], [-0.5, 0.35]]) { const off = (Math.round(i * 2) % 2) * 0.12, cx = P[ii][0] + n[0] * w * (sg + off), cy = P[ii][1] + n[1] * w * (sg + off); ctx.strokeStyle = rg(C3, al * (0.25 + 0.75 * sh)); ctx.lineWidth = Math.max(0.8, w * 0.07); ctx.beginPath(); ctx.arc(cx, cy, w * 0.26, an + 1.1, an + 2.5); ctx.stroke(); } }
    /* 腹甲：腹側一條細光帶 */
    ctx.strokeStyle = rg(C3, 0.35); ctx.lineWidth = Math.max(1, W * 0.06); ctx.beginPath(); for (let i = 2; i < N * 0.85; i++) { const p = edge(i, -1, 0.7); i > 2 ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
    /* 背焰：沿背脊往尾巴方向飄 */
    for (let i = 4; i < N * 0.8; i += 4) { const u = i / (N - 1), b = edge(i, 1, 0.95), n = nrm(i), d = D[i], L = wid(u) * W * (0.7 + 0.25 * Math.sin(t * 0.5 + i)), fl = Math.sin(t * 0.6 + i * 0.8) * 0.3;
      const tip = [b[0] + n[0] * L - d[0] * L * (0.9 + fl), b[1] + n[1] * L - d[1] * L * (0.9 + fl)]; for (const [lw, c, al] of [[W * 0.2, CF, 0.25], [W * 0.06, C2, 0.7]]) { ctx.strokeStyle = rg(c, al); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(b[0] + n[0] * L * 0.8, b[1] + n[1] * L * 0.8, tip[0], tip[1]); ctx.stroke(); } }
    claw(0.22, 1, 0); claw(0.55, 1, 2.0);
    /* 龍尾：尾鰭兩小片＋尾焰一束 */
    const it = Math.round((N - 1) * 0.9); for (const sg of [-1, 1]) { const b = P[it], n = nrm(it), d = D[it], L = W * 0.7; ctx.strokeStyle = rg(C2, 0.55); ctx.lineWidth = W * 0.08; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(b[0] + n[0] * sg * L * 0.6 - d[0] * L * 0.3, b[1] + n[1] * sg * L * 0.6 - d[1] * L * 0.3, b[0] + n[0] * sg * L * 0.4 - d[0] * L, b[1] + n[1] * sg * L * 0.4 - d[1] * L); ctx.stroke(); }
    { const e = P[N - 1], d = D[N - 1], n = nrm(N - 1); for (let j = 0; j < 7; j++) { const sp = (j - 3) / 3, L = W * (2.2 - Math.abs(sp) * 0.8) * (0.85 + 0.25 * Math.sin(t * 0.7 + j * 1.7)), wav = Math.sin(t * 0.5 + j) * W * 0.4;
        const tx = e[0] - d[0] * L + n[0] * (sp * W * 1.1 + wav), ty = e[1] - d[1] * L + n[1] * (sp * W * 1.1 + wav); for (const [lw, c, al] of [[W * 0.3, CF, 0.25], [W * 0.1, C2, 0.75], [W * 0.035, C3, 0.9]]) { ctx.strokeStyle = rg(c, al * (1 - Math.abs(sp) * 0.4)); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.quadraticCurveTo(e[0] - d[0] * L * 0.5 + n[0] * sp * W * 0.3, e[1] - d[1] * L * 0.5 + n[1] * sp * W * 0.3, tx, ty); ctx.stroke(); } } }
    /* 頭：頭形輪廓（額、吻、張開的上下顎）三層發光；牙、角、鬃、鬚、眼 */
    { const h = P[0], d = D[0], n = nrm(0), Wh = W * 1.45, gap = 0.22 + 0.12 * Math.sin(t * 0.25), L = (f, u) => [h[0] + d[0] * f * Wh + n[0] * u * Wh, h[1] + d[1] * f * Wh + n[1] * u * Wh];
      const up = [[-0.9, 0.85], [-0.1, 0.95], [0.5, 0.7], [1.3, 0.5], [1.95, 0.25], [2.0, 0.02], [1.6, -0.08], [0.6, -0.1]], lo = [[0.6, -0.12], [1.5, -0.32 - gap * 1.6], [1.6, -0.5 - gap * 1.6], [0.7, -0.7], [-0.6, -0.85]];
      const shape = (pts, sc) => { ctx.beginPath(); pts.forEach(([f, u], i) => { const p = L(f * sc + (1 - sc) * 0.4, u * sc); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); };
      for (const [sc, c, al] of [[1.25, C1, 0.14], [1.0, C1, 0.22], [0.75, C2, 0.32], [0.45, C3, 0.42]]) { ctx.fillStyle = rg(c, al); shape(up.concat(lo.slice(3)), sc); ctx.fill(); shape(lo, sc); ctx.fill(); }
      ctx.strokeStyle = rg(C3, 0.9); ctx.lineWidth = Math.max(1, Wh * 0.05); for (let j = 0; j < 3; j++) { const f = 1.0 + j * 0.3, a0 = L(f, -0.06), b0 = L(f, -0.06 - 0.11), a1 = L(f + 0.05, -0.3 - gap * 1.6 * (f / 1.6)), b1 = L(f + 0.05, -0.2 - gap * 1.6 * (f / 1.6)); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(b0[0], b0[1]); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke(); }   // 牙
      for (const [f0, L0, sp] of [[0.1, 1.7, 0.45], [-0.2, 1.4, 0.2]]) { const b = L(f0, 0.85), c1 = L(f0 - L0 * 0.35, 0.85 + L0 * 0.55), e = L(f0 - L0, 0.85 + L0 * sp); for (const [lw, c, al] of [[Wh * 0.22, C1, 0.3], [Wh * 0.09, C3, 0.9]]) { ctx.strokeStyle = rg(c, al); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]); ctx.stroke(); } }   // 角
      for (let j = 0; j < 7; j++) { const sp = (j - 3) / 3, b = L(-0.6, 0.3 + sp * 0.5), Lm = 1.5 + 0.4 * Math.sin(t * 0.5 + j), fl = Math.sin(t * 0.55 + j * 1.3) * 0.3, m1 = L(-0.6 - Lm * 0.5, 0.4 + sp * 0.9 + fl), e = L(-0.6 - Lm, 0.3 + sp * 1.3 - fl);
        ctx.strokeStyle = rg(j % 2 ? CF : C2, 0.45); ctx.lineWidth = Wh * 0.12; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(m1[0], m1[1], e[0], e[1]); ctx.stroke(); }   // 鬃
      for (const sg of [1, -1]) { const b = L(1.8, sg > 0 ? 0.15 : -0.05); ctx.strokeStyle = rg(C3, 0.7); ctx.lineWidth = Math.max(1, Wh * 0.045); ctx.beginPath(); ctx.moveTo(b[0], b[1]);
        for (let j = 1; j <= 10; j++) { const u = j / 10, p = L(1.8 - u * 4.2, (sg > 0 ? 0.15 : -0.05) + sg * 0.2 + Math.sin(t * 0.4 + u * 6) * 0.5 * u - u * 0.4); ctx.lineTo(p[0], p[1]); } ctx.stroke(); }   // 鬚
      const ep = L(0.65, 0.45), eg = ctx.createRadialGradient(ep[0], ep[1], 0, ep[0], ep[1], Wh * 0.3); eg.addColorStop(0, 'rgba(255,255,255,' + a + ')'); eg.addColorStop(0.4, rg(CF, 0.8)); eg.addColorStop(1, rg(CF, 0)); ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ep[0], ep[1], Wh * 0.3, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  MV2.glowDragon = glowDragon;
  /* 龍身取樣：head(tt) 回傳 [x, y(地面), z(高度 px)]；取 tt…tt−len 的路徑當龍身（頭在前） */
  MV2.dragonPath = (head, tt, len, n) => { const P = []; for (let i = 0; i < n; i++) { const q = head(tt - i * len / n); P.push([q[0], q[1] - q[2]]); } return P; };
  /* 光龍特效：head(tt) 決定龍頭路徑；o：life、len（龍身長，格）、pal、w、fade（開始淡出的格） */
  MV2.dragon = (head, o) => VX.custom((q, ctx) => { const s = S(head(q.t)[1]), k = HH() * s, a = q.t < 4 ? q.t / 4 : q.t > (o.fade || q.life - 10) ? (q.life - q.t) / (q.life - (o.fade || q.life - 10)) : 1;
    glowDragon(ctx, MV2.dragonPath(head, q.t, o.len || 18, 44), k, q.t, a, o); if (q.t % 2 === 0 && a > 0.3) { const p = head(q.t - Math.random() * (o.len || 18)); VX.spark({ x: p[0], y: p[1], z: p[2], n: 1, spd: 1.5, g: -0.02, life: 18, col: PAL[o.pal || 'gold'][1] }); } }, o.life || 50, 'o', o.step ? { step: o.step } : undefined);
  /* ---------- 天降箭：素材箭從天斜落，插地＋命中花；pillar＝每箭帶光柱 ---------- */
  MV2.fallArrow = function (c, x, y, o) { o = o || {}; const life = o.life || 12, f = o.dx === undefined ? -c.f : Math.sign(o.dx) || -1, h = (o.h || 5), dx = (o.dx === undefined ? 0.8 : Math.abs(o.dx)), ang = Math.atan2(h, dx) * (f < 0 ? -1 : 1);
    VX.custom((q, ctx) => { const s = S(y), k = HH() * s, u = Math.min(1, q.t / life), px = x + f * dx * k * (1 - u), pz = h * k * (1 - u); if (u >= 1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const L = 1.4 * k, ux = -f * dx / Math.hypot(dx, h), uz = h / Math.hypot(dx, h), g = ctx.createLinearGradient(px, y - pz, px - ux * L, y - pz - uz * L); g.addColorStop(0, 'rgba(255,255,240,.9)'); g.addColorStop(1, 'rgba(' + (o.col || '255,225,150') + ',0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(px, y - pz); ctx.lineTo(px - ux * L, y - pz - uz * L); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
      ctx.translate(px, y - pz); ctx.rotate(Math.atan2(h, -f * dx)); VX.arrowShape(0.42 * k, 0.018 * k, o.col || '255,225,150', !!o.big); ctx.restore(); }, life, 'o');
    c.later(life, () => { VX.spr({ u: 'p_hayate_fx', n: 'arrow_hit', x, y, z: 0.15, w: 1.1, life: 14 });
      VX.custom((q, ctx) => { const s = S(y), k = HH() * s; ctx.save(); ctx.translate(x, y - 0.04 * k); ctx.rotate(Math.atan2(h, -f * dx)); ctx.globalAlpha = Math.min(1, (q.life - q.t) / 12); VX.arrowShape(0.3 * k, 0.018 * k, o.col || '255,225,150', false); ctx.restore(); }, 40, 'g');   // 插地
      VX.smoke({ x, y, n: 1, r: 0.12, life: 22, a: 0.25, col: '170,160,150' });
      if (o.pillar) { VX.pillar({ x, y, h: 3.4, w: 1.1, big: 1, life: 24 }); VX.sigil({ x, y, r: 0.7, life: 26 }); }
      c.hit({ shape: 'circle', x, y, r: o.r || 0.75, m: o.m || 0.5, lv: o.pillar ? 'heavy' : 'mid', kind: 'arrow', col: o.col }); if (o.on) o.on(x, y); }); };
})();
