/* ==========================================================================
 * 神諭之地 重製版 — 76_vfx.js
 * Version : r3.190.0  (2026-11-28)　追蹤飛行物：轉彎維持原速、越飛轉越急、目標死亡改追最近的（修正追蹤箭停在半空）
 * 舊版    : r3.49.0  (2026-11-18)  r3.49.0：範圍判定加大型妖怪身體寬度
 * 舊版    : r3.37.0  (2026-11-17)  r3.37.0：箭與焙烙玉改用第二代素材（86_fx2）；r3.36.0：箭改用素材箭、尺寸縮小（0.62→0.42、重箭 0.95→0.6 身高）
 * 變更    : r3.34.0 新增。程式繪製特效元件（規格 VFX_SPEC v2.1 第一節），全部以世界座標＋景深縮放繪製。
 *           元件：ribbon 刀幕／thrust 突刺／ring 衝擊環／crack 裂地／spark 火花／smoke 煙／glow 光暈／wind 風切／
 *                 bolt 雷／glyph 符陣／cut 斬痕（貼在敵人身上）／shard 碎片／beam 光柱／streak 速度線／dim 背景壓暗／ghost 殘影。
 *           飛行物：VX.shot（子彈、箭、焙烙玉…）自帶飛行、命中判定、命中回饋；箭命中後插在目標上。
 *           命中回饋 VX.impact(e, 強度, 種類, 方向)：命中停頓、震動、閃白、斬痕／刺痕／火星。
 *           繪製層：g＝地面（角色之前）、o＝上層（角色之後）；hitstop 期間不更新（停格）。上限 360 個，超過丟最舊的顆粒。
 * 依賴    : 03_actors（G.drawFx／G.drawLoot／G.fxStep／G.damageOni／G.FX ghost）、02_scene（SC.depth、SC.shake）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC, H = G.H, HH = () => G.HERO_H, TAU = 6.2832;
  const VX = G.VX = { L: [], dimA: 0, dimT: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = y => SC.depth(y), push = o => { o.t = 0; o.d = o.d || 0; VX.L.push(o); if (VX.L.length > 360) { const i = VX.L.findIndex(q => q.p); VX.L.splice(i >= 0 ? i : 0, 1); } return o; };
  const rgba = (c, a) => 'rgba(' + c + ',' + clamp(a, 0, 1).toFixed(3) + ')';
  /* ---------- 元件 ---------- */
  /* 刀幕：繞 (x, y−cy) 的弧，a0→a1 掃過 sw 格；r 半徑、w 厚（HH 倍）；sq 透視壓扁（0.45＝水平斬，1＝垂直面）；rot 旋轉弧面；
     col 主色、edge 前緣色；trail 尾長（弧度）；life 總長；shat 結束碎裂片數 */
  VX.ribbon = o => push(Object.assign({ k: 'ribbon', l: 'o', r: 1.2, w: 0.32, sq: 0.5, rot: 0, cy: 0.55, sw: 5, life: 16, col: '220,235,255', edge: '255,255,255', trail: 2.2, shat: 8, face: 1 }, o));
  VX.thrust = o => push(Object.assign({ k: 'thrust', l: 'o', len: 1.6, w: 0.22, cy: 0.55, ang: 0, ext: 3, life: 12, col: '200,225,255', edge: '255,255,255', lines: 3, face: 1 }, o));
  VX.ring = o => push(Object.assign({ k: 'ring', l: 'g', r0: 0.2, r1: 1.4, lw: 0.08, life: 18, col: '255,240,210' }, o));
  VX.crack = o => push(Object.assign({ k: 'crack', l: 'g', r: 1.2, n: 9, life: 50, col: '255,200,120', seed: Math.random() * 1000 }, o));
  VX.spark = o => { const n = o.n || 8, s = S(o.y); for (let i = 0; i < n; i++) { const a = (o.ang !== undefined ? o.ang + rnd(-(o.spread || 0.9), o.spread || 0.9) : rnd(0, TAU)), v = rnd(0.5, 1) * (o.spd || 5) * s;
      push({ k: 'spark', l: 'o', p: 1, x: o.x, y: o.y, z: o.z || HH() * 0.5 * s, vx: Math.cos(a) * v, vz: -Math.sin(a) * v + (o.up || 0) * s, g: (o.g === undefined ? 0.25 : o.g) * s, life: o.life || rnd(10, 18), col: o.col || '255,220,150', len: o.len || 3 }); } };
  VX.smoke = o => { const n = o.n || 4, s = S(o.y); for (let i = 0; i < n; i++) push({ k: 'smoke', l: 'o', p: 1, x: o.x + rnd(-6, 6) * s, y: o.y, z: (o.z || HH() * 0.5 * s) + rnd(-4, 4) * s, vx: (o.vx || 0) * s + rnd(-0.4, 0.4) * s, vz: -rnd(0.2, 0.6) * s * (o.rise || 1), r0: (o.r || 0.12) * HH() * s, life: o.life || rnd(30, 50), col: o.col || '150,145,140', a: o.a || 0.5, d: i * 2 }); };
  VX.glow = o => push(Object.assign({ k: 'glow', l: 'o', r: 0.4, life: 8, col: '255,240,200', z: 0.55, a: 1 }, o));
  VX.wind = o => push(Object.assign({ k: 'wind', l: 'o', r: 1.2, n: 4, life: 20, col: '210,255,240', cy: 0.45, spin: 0.35, face: 1, sq: 0.45 }, o));
  VX.bolt = o => push(Object.assign({ k: 'bolt', l: 'o', life: 14, col: '200,220,255', w: 3, br: 2 }, o));
  VX.glyph = o => push(Object.assign({ k: 'glyph', l: 'g', r: 0.9, life: 40, col: '255,215,120', spin: 0.04 }, o));
  VX.cut = o => push(Object.assign({ k: 'cut', l: 'o', len: 0.7, w: 0.07, ang: -0.6, life: 14, col: '255,255,255', glowC: '255,120,120', z: 0.55 }, o));
  VX.shard = o => { const n = o.n || 6, s = S(o.y); for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(1.5, 4) * s;
      push({ k: 'shard', l: 'o', p: 1, x: o.x, y: o.y, z: (o.z || 0.55) * HH() * s, vx: Math.cos(a) * v, vz: -Math.abs(Math.sin(a)) * v - 1.5 * s, g: 0.22 * s, rot: rnd(0, TAU), vr: rnd(-0.4, 0.4), sz: rnd(0.04, 0.09) * HH() * s, life: o.life || rnd(16, 26), col: o.col || '230,235,255' }); } };
  VX.beam = o => push(Object.assign({ k: 'beam', l: 'o', w: 0.5, h: 4, life: 20, col: '255,230,160', edge: '255,255,255' }, o));
  VX.streak = o => push(Object.assign({ k: 'streak', l: 'o', n: 5, len: 1.2, life: 8, col: '255,255,255', ang: 0, face: 1, cy: 0.55, spread: 0.35 }, o));
  VX.dim = (t, a) => { VX.dimT = Math.max(VX.dimT, t); VX.dimA = Math.max(VX.dimA, a || 0.45); };
  VX.ghost = (life, tint) => { const u = G.WPN.unit && G.WPN.unit(), fr = G.heroFrame && G.heroFrame(); if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x: H.x, y: H.y, face: H.face, s: S(H.y) * G.WPN.actK(H.act && H.act.name), t: 0, life: life || 14, tint }); };
  VX.flash = n => { VX.wf = Math.max(VX.wf || 0, Math.min(3, n || 2)); };   // 全螢幕白閃（≤3 格）
  /* ---------- 命中回饋 ---------- */
  const HF = { light: { hs: 3, sh: 0 }, mid: { hs: 4, sh: 2 }, heavy: { hs: 6, sh: 3 }, hiden: { hs: 12, sh: 7 } };
  VX.impact = function (e, lv, kind, ang, col) { const f = HF[lv] || HF.light, s = S(e.y), z = (e.ratio || 1) * 0.5, ex = e.x, ey = e.y;
    G.hitstop = Math.max(G.hitstop, f.hs); if (f.sh) SC.shake = Math.max(SC.shake || 0, f.sh); e.flash = (e._vxf && G.playT - e._vxf < 8) ? 2 : (lv === 'light' ? 3 : 5); e._vxf = G.playT;   // 蓋掉 damageOni 的 8 格閃白：連續命中只閃一下，避免整隻變白
    const a = ang === undefined ? (H.face > 0 ? -0.5 : Math.PI + 0.5) : ang;
    if (kind === 'cut') { VX.cut({ x: ex, y: ey, ang: a + rnd(-0.25, 0.25), len: lv === 'light' ? 0.7 : lv === 'hiden' ? 1.4 : 1.0, w: lv === 'light' ? 0.05 : 0.08, z, col: '255,255,255', glowC: col || '255,170,150', life: lv === 'hiden' ? 22 : 12 }); VX.spark({ x: ex, y: ey, z: z * HH() * s, n: lv === 'light' ? 5 : 9, ang: a, spread: 0.6, spd: 6, col: col || '255,230,190' }); }
    else if (kind === 'pierce') { VX.glow({ x: ex, y: ey, z, r: lv === 'light' ? 0.25 : 0.4, col: col || '220,235,255', life: 7 }); VX.streak({ x: ex - H.face * HH() * 0.2 * s, y: ey, cy: z, ang: 0, face: H.face, len: 0.8, n: 4, life: 7, col: col || '230,240,255' }); VX.spark({ x: ex, y: ey, z: z * HH() * s, n: 6, ang: H.face > 0 ? 0 : Math.PI, spread: 0.5, spd: 6, col: '255,240,210' }); }
    else if (kind === 'blunt') { VX.ring({ x: ex, y: ey, r0: 0.2, r1: lv === 'light' ? 0.7 : 1.1, life: 12, col: col || '255,230,190' }); VX.spark({ x: ex, y: ey, z: z * HH() * s, n: 7, spd: 5, col: '255,220,170' }); VX.smoke({ x: ex, y: ey, z: 6 * s, n: 2, r: 0.15, life: 24, a: 0.35, col: '170,160,150' }); }
    else if (kind === 'shot') { VX.glow({ x: ex, y: ey, z, r: 0.3, col: '255,210,140', life: 6 }); VX.spark({ x: ex, y: ey, z: z * HH() * s, n: 7, ang: H.face > 0 ? Math.PI : 0, spread: 0.9, spd: 5, col: '255,200,120' }); VX.smoke({ x: ex, y: ey, z: z * HH() * s, n: 1, r: 0.1, life: 18, a: 0.3 }); }
    else if (kind === 'arrow') { VX.glow({ x: ex, y: ey, z, r: 0.25, col: col || '255,245,210', life: 6 }); VX.spark({ x: ex, y: ey, z: z * HH() * s, n: 4, ang: H.face > 0 ? Math.PI : 0, spread: 0.7, spd: 4, col: '255,240,200' }); }
    if (lv === 'heavy' || lv === 'hiden') VX.ring({ x: ex, y: ey, r0: 0.15, r1: lv === 'hiden' ? 1.6 : 1.0, life: 14, col: col || '255,240,220', lw: 0.06 }); };
  /* 範圍判定（招式與秘傳共用）：shape＝sector／line／circle／ring；回傳打到的敵人 */
  VX.area = function (o) { const out = [], f = o.face || H.face, ox = o.x === undefined ? H.x : o.x, oy = o.y === undefined ? H.y : o.y, s = S(oy), R = (o.r || 1.2) * HH() * s;
    if (VX.showHit) push({ k: 'hbox', l: 'o', life: 12, o: Object.assign({}, o, { f, ox, oy, R }) });   // 測試頁「判定框」
    for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || e.hp <= 0 || (o.skip && o.skip.includes(e))) continue; const dx = (e.x - ox) * f, dy = (e.y - oy) * 1.6, d = Math.hypot(dx, dy), pad = 14 * (e.ratio || 1) + (G.bodyX ? G.bodyX(e) : 0);
      let ok = false;
      if (o.shape === 'circle') ok = d < R + pad;
      else if (o.shape === 'ring') ok = d < R + pad && d > (o.r0 || 0) * HH() * s - pad;
      else if (o.shape === 'line') { const L = (o.len || 2) * HH() * s, W = (o.w || 0.5) * HH() * s, a = o.ang || 0, px = dx * Math.cos(a) + dy * Math.sin(a), py = -dx * Math.sin(a) + dy * Math.cos(a); ok = px > -pad - (o.back || 0) * HH() * s && px < L + pad && Math.abs(py) < W + pad; }
      else { if (d < R + pad && d > 0.0001) { let a = Math.atan2(dy, dx) - (o.ang || 0); a = Math.atan2(Math.sin(a), Math.cos(a)); ok = Math.abs(a) < (o.arc || 2) / 2 + 0.25 || d < pad * 1.5; } else ok = d < pad * 1.5; }
      if (ok) out.push(e); }
    return out; };
  /* ---------- 飛行物 ---------- */
  /* kind：bullet 子彈（曳光）／pellet 散彈／arrow 箭／bigarrow 重箭／bomb 焙烙玉（拋物線）／bolt 雷彈；
     o：x y z（高度）vx vy（地面座標速度）range、pierce、onHit(e,p)、col、home（追蹤目標）、grav、life */
  VX.P = [];
  VX.shot = o => { const p = Object.assign({ k: 'bullet', z: HH() * 0.6 * S(o.y), vz: 0, pierce: 1, hits: [], t: 0, dist: 0, range: HH() * 8, col: '255,200,110' }, o); VX.P.push(p); return p; };
  function projStep() { for (const p of VX.P) { if (p.dead) continue; p.t++;
      if (p.home && (p.home.st === 'dead' || !(p.home.hp > 0))) { let best = null, bd = HH() * 6; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || e.hp <= 0 || p.hits.includes(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } } if (best) p.home = best; }   /* r3.190.0：目標死了就改追最近的 */
      if (p.home && p.home.st !== 'dead' && p.home.hp > 0) { const sp = p.sp0 || (p.sp0 = Math.hypot(p.vx, p.vy)) || 1, dx = p.home.x - p.x, dy = (p.home.y - p.y), d = Math.hypot(dx, dy) || 1, k = Math.min(0.6, (p.turn || 0.12) + p.t * 0.008); p.vx += (dx / d * sp - p.vx) * k; p.vy += (dy / d * sp - p.vy) * k;
        const v = Math.hypot(p.vx, p.vy); if (v > 0.001) { p.vx *= sp / v; p.vy *= sp / v; } else { p.vx = dx / d * sp; p.vy = dy / d * sp; } }   /* r3.190.0：轉彎時維持原速（原本轉大彎會越轉越慢、停在半空），越飛轉得越急（不再繞圈） */
      p.x += p.vx; p.y += p.vy; p.dist += Math.hypot(p.vx, p.vy);
      if (p.grav) { p.vz += p.grav; p.z -= p.vz; if (p.z <= 0) { p.z = 0; p.dead = 1; if (p.onLand) p.onLand(p); continue; } }
      if (p.trail) { p.tr = p.tr || []; p.tr.push([p.x, p.y, p.z]); if (p.tr.length > p.trail) p.tr.shift(); }
      if (!p.grav) for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || e.hp <= 0 || p.hits.includes(e)) continue; const s = S(e.y);
        if (Math.abs(e.x - p.x) < (18 + Math.abs(p.vx) * 0.5) * (e.ratio || 1) && Math.abs(e.y - p.y) < 22 * s * (e.ratio || 1)) { p.hits.push(e); if (p.onHit) p.onHit(e, p);
          if ((p.k === 'arrow' || p.k === 'bigarrow') && e.st !== 'dead') push({ k: 'stuck', l: 'o', e, ox: (p.x - e.x) * 0.5, oz: p.z, ang: Math.atan2(p.vy * 0.6, p.vx), life: 24, big: p.k === 'bigarrow' });
          if (p.hits.length >= p.pierce) { p.dead = 1; break; } } }
      if (p.dist > p.range || !SC.walkable(p.x, p.y) && p.dist > HH()) { p.dead = 1; if (p.onEnd) p.onEnd(p); } }
    VX.P = VX.P.filter(p => !p.dead); }
  function drawProj(p) { const s = S(p.y), x = p.x, y = p.y - p.z, d = Math.sign(p.vx) || 1, ang = Math.atan2(p.vy * 0.6 - (p.grav ? p.vz : 0) * 0, p.vx); ctx.save();
    if (p.k === 'bullet' || p.k === 'pellet') { const L = HH() * s * (p.k === 'bullet' ? 1.0 : 0.5), w = HH() * s * (p.k === 'bullet' ? 0.05 : 0.035);
      ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, rgba(p.col, 0)); g.addColorStop(0.7, rgba(p.col, 0.55)); g.addColorStop(1, 'rgba(255,250,225,1)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -w); ctx.lineTo(w * 1.5, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 4); rg.addColorStop(0, 'rgba(255,245,210,.9)'); rg.addColorStop(1, rgba(p.col, 0)); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, w * 4, 0, TAU); ctx.fill(); }
    else if (p.k === 'arrow' || p.k === 'bigarrow') { const big = p.k === 'bigarrow', L = HH() * s * (big ? 0.6 : 0.42), w = HH() * s * (big ? 0.03 : 0.018);
      if (p.tr) { ctx.globalCompositeOperation = 'lighter'; for (let i = 1; i < p.tr.length; i++) { const a = p.tr[i - 1], b = p.tr[i]; ctx.strokeStyle = rgba(p.col, 0.5 * i / p.tr.length); ctx.lineWidth = w * (big ? 3 : 2) * i / p.tr.length; ctx.beginPath(); ctx.moveTo(a[0], a[1] - a[2]); ctx.lineTo(b[0], b[1] - b[2]); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; }
      ctx.translate(x, y); ctx.rotate(ang); arrowShape(L, w, p.col, big); }
    else if (p.k === 'bomb' && VX.bomb2 && VX.bomb2(ctx, x, y, s, p.t || 0)) { ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter'; const r = HH() * s * 0.09, f = r * (0.6 + Math.random() * 0.5), g = ctx.createRadialGradient(r * 0.2, -r * 1.3, 0, r * 0.2, -r * 1.3, f * 1.6); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r * 0.2, -r * 1.3, f * 1.6, 0, TAU); ctx.fill(); }   // r3.37.0：焙烙玉素材＋引信火花
    else if (p.k === 'bomb') { const r = HH() * s * 0.09; ctx.translate(x, y); ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; const f = r * (0.6 + Math.random() * 0.5); const g = ctx.createRadialGradient(r * 0.7, -r * 0.9, 0, r * 0.7, -r * 0.9, f * 2); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r * 0.7, -r * 0.9, f * 2, 0, TAU); ctx.fill(); }
    else if (p.k === 'orb') { const r = HH() * s * (p.r || 0.15); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, rgba(p.col, 0.9)); g.addColorStop(1, rgba(p.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2, 0, TAU); ctx.fill(); }
    ctx.restore(); if (p.k === 'bullet' && p.t % 2 === 0 && Math.random() < 0.3) VX.spark({ x: p.x, y: p.y, z: p.z, n: 1, spd: 1, g: 0.1, life: 8, col: p.col }); }
  /* r3.36.0：箭改用素材箭（projectile_arrow_a／b），長度＝L、箭尖在原點；素材未就緒才用向量箭 */
  function arrowShape(L, w, col, big) { if (VX.arrow2 && VX.arrow2(ctx, L, col, big)) return;   // r3.37.0：第二代素材箭
    const u = G.ANIM.get('fx_common'), r = u && u.fx[big ? 'projectile_arrow_b' : 'projectile_arrow_a'];
    if (r) { const fr = r._big || (r._big = r.f.reduce((m, f) => f[2] > m[2] ? f : m)), sc = L / fr[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.18); g.addColorStop(0, rgba(col, big ? 0.6 : 0.35)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, L * 0.18, 0, TAU); ctx.fill(); ctx.restore();
      G.ANIM.draw(u, fr, -fr[2] * sc + fr[4] * sc, 0 - fr[3] * sc / 2 + fr[5] * sc, sc, false); return; }
    arrowShape0(L, w, col, big); }
  function arrowShape0(L, w, col, big) { ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-L, -w / 2, L, w);   // 箭身
    ctx.fillStyle = '#d9dde6'; ctx.beginPath(); ctx.moveTo(w * 5, 0); ctx.lineTo(0, -w * 2); ctx.lineTo(0, w * 2); ctx.closePath(); ctx.fill();   // 箭頭
    ctx.fillStyle = big ? '#f0d58a' : '#ece6da'; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L + w * 7, 0); ctx.lineTo(-L + w * 4, sg * w * 3); ctx.lineTo(-L - w, sg * w * 3); ctx.closePath(); ctx.fill(); }   // 箭羽
    ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(w * 2, 0, 0, w * 2, 0, w * (big ? 7 : 4)); g.addColorStop(0, rgba(col, 0.8)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * 2, 0, w * (big ? 7 : 4), 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  VX.arrowShape = arrowShape;
  /* ---------- 繪製 ---------- */
  function pt(o, a, r, sq) { const s = S(o.y), R = r * HH() * s, lx = Math.cos(a) * R, ly = Math.sin(a) * R * sq, c = Math.cos(o.rot), sn = Math.sin(o.rot), rx = lx * c - ly * sn, ry = lx * sn + ly * c;
    return [o.x + rx * o.face, o.y - o.cy * HH() * s + ry]; }
  const DR = {
    ribbon(o, q) { const s = S(o.y), dir = Math.sign(o.a1 - o.a0) || 1, swq = clamp(o.t / Math.max(1, o.sw), 0, 1), head = o.a0 + (o.a1 - o.a0) * swq, tailA = Math.max(0, Math.abs(head - o.a0) - o.trail),
        fade = o.t > o.sw ? clamp(1 - (o.t - o.sw) / Math.max(1, o.life - o.sw), 0, 1) : 1, tail = o.a0 + dir * (tailA + (o.t > o.sw ? (Math.abs(o.a1 - o.a0) - tailA) * (1 - fade) : 0)), N = 18, W = o.w;
      if (Math.abs(head - tail) < 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, a0 = tail + (head - tail) * u0, a1 = tail + (head - tail) * u1, th0 = W * Math.sin(Math.PI * clamp(u0 * 0.85 + 0.15, 0, 1)) * (0.35 + 0.65 * u0), th1 = W * Math.sin(Math.PI * clamp(u1 * 0.85 + 0.15, 0, 1)) * (0.35 + 0.65 * u1);
        const A = pt(o, a0, o.r, o.sq), B = pt(o, a1, o.r, o.sq), C = pt(o, a1, o.r - th1, o.sq), D = pt(o, a0, o.r - th0, o.sq);
        ctx.fillStyle = rgba(o.col, (0.08 + 0.55 * u1 * u1) * fade); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fill(); }
      ctx.lineCap = 'round'; for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; if (u1 < 0.45) continue; const A = pt(o, tail + (head - tail) * u0, o.r, o.sq), B = pt(o, tail + (head - tail) * u1, o.r, o.sq);
        ctx.strokeStyle = rgba(o.edge, (u1 - 0.45) / 0.55 * fade); ctx.lineWidth = (1 + 2.6 * u1) * s * (o.ew || 1); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }   // 前緣亮線
      if (swq < 1) { const P = pt(o, head, o.r - W * 0.3, o.sq), rg = ctx.createRadialGradient(P[0], P[1], 0, P[0], P[1], W * HH() * s * 0.9); rg.addColorStop(0, rgba(o.edge, 0.85)); rg.addColorStop(1, rgba(o.col, 0)); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(P[0], P[1], W * HH() * s * 0.9, 0, TAU); ctx.fill(); }
      ctx.restore();
      if (o.t === o.life - 4 && o.shat) for (let i = 0; i < o.shat; i++) { const a = o.a0 + (o.a1 - o.a0) * Math.random(), P = pt(o, a, o.r - W * 0.4, o.sq);
        push({ k: 'shard', l: 'o', p: 1, x: P[0], y: o.y, z: o.y - P[1], vx: rnd(-1, 1) * s, vz: -rnd(0.2, 1.2) * s, g: 0.08 * s, rot: rnd(0, TAU), vr: rnd(-0.3, 0.3), sz: rnd(0.025, 0.05) * HH() * s, life: rnd(10, 18), col: o.col, glow: 1 }); } },
    thrust(o) { const s = S(o.y), q = o.t / o.life, ext = clamp(o.t / o.ext, 0, 1), L = o.len * HH() * s * (0.3 + 0.7 * ext), w = o.w * HH() * s * (1 - q * 0.6), a = 1 - clamp((o.t - o.ext) / (o.life - o.ext), 0, 1);
      ctx.save(); ctx.translate(o.x, o.y - o.cy * HH() * s); ctx.scale(o.face, 1); ctx.rotate(o.ang); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, rgba(o.col, 0)); g.addColorStop(0.6, rgba(o.col, 0.55 * a)); g.addColorStop(1, rgba(o.edge, a));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w * 0.3); ctx.quadraticCurveTo(L * 0.6, -w, L, 0); ctx.quadraticCurveTo(L * 0.6, w, 0, w * 0.3); ctx.closePath(); ctx.fill();
      const rg = ctx.createRadialGradient(L, 0, 0, L, 0, w * 2.2); rg.addColorStop(0, rgba(o.tip || o.edge, a)); rg.addColorStop(1, rgba(o.col, 0)); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(L, 0, w * 2.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(o.edge, 0.7 * a); ctx.lineWidth = 1.2 * s; for (let i = 0; i < o.lines; i++) { const yy = (i - (o.lines - 1) / 2) * w * 1.3, x0 = L * (0.15 + 0.2 * ((i * 37) % 3) / 3) + q * L * 0.3; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + L * 0.35, yy); ctx.stroke(); }
      ctx.restore(); },
    ring(o) { const s = S(o.y), q = o.t / o.life, e = 1 - Math.pow(1 - q, 2.2), r = (o.r0 + (o.r1 - o.r0) * e) * HH() * s; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(o.col, (1 - q) * 0.9); ctx.lineWidth = Math.max(1, o.lw * HH() * s * (1 - q * 0.7)); ctx.beginPath(); ctx.ellipse(o.x, o.y - (o.z || 0) * HH() * s, r, r * (o.sq || 0.38), 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(o.col, (1 - q) * 0.25); ctx.lineWidth = Math.max(1, o.lw * HH() * s * 3 * (1 - q)); ctx.stroke(); ctx.restore(); },
    crack(o) { const s = S(o.y), q = o.t / o.life, grow = clamp(o.t / 6, 0, 1), a = q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4; let sd = o.seed; const R = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < o.n; i++) { let ang = (i / o.n) * TAU + R() * 0.5, x = o.x, y = o.y; const L = o.r * HH() * s * (0.5 + R() * 0.5) * grow, segs = 4;
        if (o.dir !== undefined) ang = o.dir + (R() - 0.5) * 0.5;
        ctx.beginPath(); ctx.moveTo(x, y); for (let k = 1; k <= segs; k++) { ang += (R() - 0.5) * 0.7; x += Math.cos(ang) * L / segs; y += Math.sin(ang) * L / segs * 0.4; ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(30,22,18,' + (0.75 * a) + ')'; ctx.lineWidth = 3 * s; ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(o.col, 0.7 * a * (1 - q)); ctx.lineWidth = 1.4 * s; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore(); },
    spark(o) { const q = o.t / o.life; o.x += o.vx; o.z -= o.vz; o.vz -= o.g; if (o.z < 0) { o.z = 0; o.vz *= -0.3; o.vx *= 0.6; } ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(o.col, 1 - q); ctx.lineWidth = 1.6 * S(o.y);
      ctx.beginPath(); ctx.moveTo(o.x, o.y - o.z); ctx.lineTo(o.x - o.vx * o.len * 0.6, o.y - o.z + o.vz * o.len * 0.6); ctx.stroke(); ctx.restore(); },
    smoke(o) { const q = o.t / o.life; o.x += o.vx; o.z -= o.vz; o.vx *= 0.97; const r = o.r0 * (1 + q * 1.8); ctx.save(); const g = ctx.createRadialGradient(o.x, o.y - o.z, 0, o.x, o.y - o.z, r); g.addColorStop(0, rgba(o.col, o.a * (1 - q))); g.addColorStop(1, rgba(o.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y - o.z, r, 0, TAU); ctx.fill(); ctx.restore(); },
    glow(o) { const s = S(o.y), q = o.t / o.life, r = o.r * HH() * s * (0.7 + 0.5 * q), x = o.x, y = o.y - o.z * HH() * s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba('255,255,255', o.a * (1 - q))); g.addColorStop(0.35, rgba(o.col, 0.8 * o.a * (1 - q))); g.addColorStop(1, rgba(o.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); },
    wind(o) { const s = S(o.y), q = o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < o.n; i++) { const r = o.r * HH() * s * (0.55 + 0.45 * i / Math.max(1, o.n - 1)) * (0.8 + 0.3 * q), a0 = i * 1.7 + o.t * o.spin * (o.face || 1), len = 1.2 + 0.4 * (i % 2);
        ctx.strokeStyle = rgba(o.col, (1 - q) * (0.35 + 0.4 * (i % 2))); ctx.lineWidth = (1.2 + 1.5 * (1 - q)) * s; ctx.beginPath(); ctx.ellipse(o.x, o.y - o.cy * HH() * s, r, r * o.sq, 0, a0, a0 + len); ctx.stroke(); }
      ctx.restore(); },
    bolt(o) { const q = o.t / o.life; if (!o.pts || o.t % 2 === 0) { o.pts = []; const n = 8; for (let i = 0; i <= n; i++) { const u = i / n, j = i === 0 || i === n ? 0 : rnd(-1, 1) * 14 * S(o.y1 || o.y0); o.pts.push([o.x0 + (o.x1 - o.x0) * u + j, o.y0 + (o.y1 - o.y0) * u + j * 0.3]); } }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; for (const [lw, al] of [[o.w * 4, 0.25], [o.w, 1]]) { ctx.strokeStyle = rgba(al === 1 ? '255,255,255' : o.col, al * (1 - q)); ctx.lineWidth = lw; ctx.beginPath(); o.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
      for (let b = 0; b < o.br; b++) { const P = o.pts[2 + b * 2] || o.pts[2]; ctx.strokeStyle = rgba(o.col, 0.7 * (1 - q)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0] + rnd(-25, 25), P[1] + rnd(5, 30)); ctx.stroke(); }
      ctx.restore(); },
    glyph(o) { const s = S(o.y), q = o.t / o.life, a = q < 0.15 ? q / 0.15 : q > 0.8 ? (1 - q) / 0.2 : 1, R = o.r * HH() * s * (0.85 + 0.15 * Math.min(1, q * 4)), z = (o.z || 0) * HH() * s;
      ctx.save(); ctx.translate(o.x, o.y - z); ctx.scale(1, o.flat === false ? 1 : 0.38); ctx.rotate(o.t * o.spin); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(o.col, 0.8 * a); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, TAU); ctx.stroke();
      for (let i = 0; i < 12; i++) { const an = i * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(an) * R * 0.8, Math.sin(an) * R * 0.8); ctx.lineTo(Math.cos(an) * R * 0.97, Math.sin(an) * R * 0.97); ctx.stroke(); }
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = i * TAU / 6 * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R * 0.7, Math.sin(an) * R * 0.7); } ctx.closePath(); ctx.stroke(); ctx.restore(); },
    cut(o) { const e = o.e, s = S(o.y), q = o.t / o.life, L = o.len * HH() * s * (o.t < 3 ? o.t / 3 : 1), x = o.x, y = o.y - o.z * HH() * s; ctx.save(); ctx.translate(x, y); ctx.rotate(o.ang); ctx.globalCompositeOperation = 'lighter';
      const w = o.w * HH() * s * (1 - q * 0.5); ctx.fillStyle = rgba(o.glowC, 0.6 * (1 - q)); ctx.beginPath(); ctx.ellipse(0, 0, L / 2 * 1.1, w * 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(o.col, 1 - q); ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -w, L / 2, 0); ctx.quadraticCurveTo(0, w, -L / 2, 0); ctx.fill(); ctx.restore(); },
    shard(o) { const q = o.t / o.life; o.x += o.vx; o.z -= o.vz; o.vz -= o.g; o.rot += o.vr; if (o.z < 0) { o.z = 0; o.vz *= -0.25; o.vx *= 0.5; }
      ctx.save(); ctx.translate(o.x, o.y - o.z); ctx.rotate(o.rot); if (o.glow) ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(o.col, (1 - q) * (o.glow ? 0.9 : 1)); ctx.beginPath(); ctx.moveTo(-o.sz, -o.sz * 0.3); ctx.lineTo(o.sz * 0.2, -o.sz * 0.6); ctx.lineTo(o.sz, o.sz * 0.2); ctx.lineTo(-o.sz * 0.3, o.sz * 0.5); ctx.closePath(); ctx.fill(); ctx.restore(); },
    beam(o) { const s = S(o.y), q = o.t / o.life, grow = clamp(o.t / 4, 0, 1), a = q < 0.7 ? 1 : (1 - q) / 0.3, w = o.w * HH() * s * (q < 0.2 ? 1 + (0.2 - q) * 2 : 1), h = o.h * HH() * s * grow;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(o.x - w, 0, o.x + w, 0); g.addColorStop(0, rgba(o.col, 0)); g.addColorStop(0.35, rgba(o.col, 0.6 * a)); g.addColorStop(0.5, rgba(o.edge, a)); g.addColorStop(0.65, rgba(o.col, 0.6 * a)); g.addColorStop(1, rgba(o.col, 0));
      ctx.fillStyle = g; ctx.fillRect(o.x - w, o.y - h, w * 2, h); const rg = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, w * 2.5); rg.addColorStop(0, rgba(o.edge, 0.8 * a)); rg.addColorStop(1, rgba(o.col, 0)); ctx.fillStyle = rg; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, 0.38); ctx.beginPath(); ctx.arc(0, 0, w * 2.5, 0, TAU); ctx.fill(); ctx.restore(); ctx.restore(); },
    streak(o) { const s = S(o.y), q = o.t / o.life; ctx.save(); ctx.translate(o.x, o.y - o.cy * HH() * s); ctx.scale(o.face, 1); ctx.rotate(o.ang); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < o.n; i++) { const yy = (i / Math.max(1, o.n - 1) - 0.5) * o.spread * HH() * s, x0 = -o.len * HH() * s * (0.4 + ((i * 53) % 7) / 10) + q * o.len * HH() * s * 0.5, L = o.len * HH() * s * (0.5 + ((i * 31) % 5) / 10);
        ctx.strokeStyle = rgba(o.col, 0.7 * (1 - q)); ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + L, yy); ctx.stroke(); } ctx.restore(); },
    stuck(o) { const e = o.e; if (!e || e.st === 'dead' || e.alpha <= 0) { o.t = o.life; return; } const s = S(e.y), L = HH() * s * (o.big ? 0.6 : 0.42) * 0.65, w = HH() * s * (o.big ? 0.03 : 0.018);
      ctx.save(); ctx.globalAlpha = Math.min(1, (o.life - o.t) / 6); ctx.translate(e.x + o.ox, e.y - o.oz); ctx.rotate(o.ang + Math.sin(o.t * 0.5) * 0.05 * (1 - o.t / o.life)); ctx.translate(w * 3, 0);
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-L, -w / 2, L, w); ctx.fillStyle = o.big ? '#f0d58a' : '#ece6da'; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L + w * 7, 0); ctx.lineTo(-L + w * 4, sg * w * 3); ctx.lineTo(-L - w, sg * w * 3); ctx.closePath(); ctx.fill(); } ctx.restore(); },
    hbox(q) { const o = q.o, s = S(o.oy), a = 1 - q.t / q.life; ctx.save(); ctx.strokeStyle = 'rgba(80,255,120,' + a + ')'; ctx.lineWidth = 1.5; ctx.translate(o.ox, o.oy); ctx.scale(o.f, 1 / 1.6);
      if (o.shape === 'circle' || o.shape === 'ring') { ctx.beginPath(); ctx.arc(0, 0, o.R, 0, TAU); ctx.stroke(); }
      else if (o.shape === 'line') { const L = (o.len || 2) * HH() * s, W = (o.w || 0.5) * HH() * s * 1.6; ctx.rotate(o.ang || 0); ctx.strokeRect(-(o.back || 0) * HH() * s, -W, L + (o.back || 0) * HH() * s, W * 2); }
      else { const h = (o.arc || 2) / 2 + 0.25; ctx.rotate(o.ang || 0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, o.R, -h, h); ctx.closePath(); ctx.stroke(); } ctx.restore(); },
    fn(o) { if (o.draw) o.draw(o, ctx); }   // 自訂繪製（秘傳用）；判定一律放在 extra.step（每格一次，hitstop 時暫停），不可放在 draw
  };
  VX.custom = (draw, life, l, extra) => push(Object.assign({ k: 'fn', l: l || 'o', draw, life }, extra || {}));
  function drawLayer(l) { for (const o of VX.L) if (o.l === l && o.t >= o.d && DR[o.k]) { const tt = o.t; o.t = tt - o.d; try { DR[o.k](o); } catch (x) { o.t = o.life + o.d; console.warn('vx', o.k, x); } o.t = tt; } }
  /* 掛勾：地面層在戰利品前、上層在特效後；更新在 fxStep（hitstop 時停格） */
  (function wait() { if (!(G.drawFx && G.drawLoot && G.fxStep)) return setTimeout(wait, 20);
    const dl0 = G.drawLoot; G.drawLoot = function (Z) { if (VX.dimT > 0) { /* 背景壓暗畫在地面層之下的整個畫面 */ } drawLayer('g'); return dl0.apply(this, arguments); };
    const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); for (const p of VX.P) drawProj(p); drawLayer('o'); return r; };
    const fs0 = G.fxStep; G.fxStep = function () { fs0.apply(this, arguments); projStep(); for (const o of VX.L) { if (o.step && o.t >= o.d) { try { o.step(o, o.t - o.d); } catch (x) { console.warn('vx step', x); o.step = null; } } o.t++; } VX.L = VX.L.filter(o => o.t < o.life + o.d); if (VX.dimT > 0) VX.dimT--; else VX.dimA = 0; if (VX.wf > 0) VX.wf--; };
    const dw0 = G.drawWorld; G.drawWorld = function () { const r = dw0.apply(this, arguments); if (VX.wf > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (VX.wf / 4) + ')'; ctx.fillRect(0, 0, G.LW, G.LH); } return r; };
    const sc0 = G.SC.enter ? G.SC.enter.bind(G.SC) : null; if (sc0) G.SC.enter = function () { VX.L = []; VX.P = []; VX.dimT = 0; return sc0.apply(this, arguments); }; })();
  /* 背景壓暗：在角色與特效之前蓋一層（秘傳用）—— 掛在 drawLoot 前面 */
  (function wait2() { if (!G.drawLoot) return setTimeout(wait2, 20); const dl = G.drawLoot; G.drawLoot = function (Z) { if (VX.dimT > 0 && VX.dimA > 0) { const cam = SC.cam || { x: 0, y: 0 }; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(8,6,12,' + (VX.dimA * Math.min(1, VX.dimT / 10)) + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); } return dl.apply(this, arguments); }; })();
})();
