/* ==========================================================================
 * 神諭之地 重製版 — 115_yumi.js
 * Version : r3.81.0  (2026-11-25)
 * 變更    : r3.81.0 神聖大範圍清怪：追魂矢 Lv1/3/5 = 1/3/5 支（扇形散開再各追一隻，追蹤箭留轉彎軌跡）；凝神追點剩餘箭數改金羽浮在頭上；
 *                   爆裂矢＝神聖光爆（範圍 1.2H）；天弓箭更密、範圍 2.1H；
 *                   秘傳：破魔矢（天空裂光→巨光矢垂直落下→神社法陣原素材＋放射光紋＋金羽爆散→光羽如櫻花飄落，碰到敵人光球炸裂）、
 *                   流星群（範圍 2.2H、落地光球炸裂、收尾神聖大光爆，不再用火焰）、天羽羽矢（巨光矢貫穿全畫面）、千羽（前方 6H 扇形天降光箭）、月影（分身交叉射擊＋大光爆＋月牙 5 連彈）。
 *           r3.78.0 新增。和弓「帶有神聖感的遠距離攻擊」（金白偏暖 holy 色盤，用 111 元件；機制與傷害不動）。
 *           箭：飛行中拖一道柔和金光與細小光點；命中＝十字星光＋金羽飄散，停頓輕而精準。
 *           天降箭（天穹、流星群、箭雨）：拿掉白色疊加的直線拖尾，改成柔光拖尾；插地處十字星光；Lv5 光柱改成柔光柱＋上升光點。
 *           白色羽毛素材 → 金色羽毛（實心羽片＋羽軸）；神社法陣素材 → 地面柔光圓＋緩緩上升的光點。
 *           天穹的虛線圈 → 地面神聖柔光；標位的紅色準星 → 金色十字星光標記（標記轉移時跟著換人）。
 *           秘傳：天羽羽矢（白色細線斬 → 金色雙尖光斬＋十字星光）、千羽（命中光點 → 金色星光）、月影（風刃素材 → 金色月牙旋斬，再彈向附近敵人）。
 * 依賴    : 111_katana_fx（G.KF）、92_lab（和弓招式、技、秘傳）、84_fxkit（MV2.fallArrow）、86_fx2（VX.draw2）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, W = G.WPN, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const KF = () => G.KF, Hy = fn => G.KF.use('holy', fn), Y = '255,214,140', isY = () => W.curId() === 'yumi';
  const muz = c => { const mz = W.muzzle && W.muzzle(); return mz ? mz : [c.x + c.f * 0.42 * c.hh, c.y - 0.64 * c.hh]; };
  const string = c => { const [x, y] = muz(c); Hy(() => KF().glint(x, c.y, (c.y - y) / c.hh, 0.22, 8)); };
  const arw = (c, o) => c.shoot(o.k || 'arrow', Object.assign({ spd: 0.42, range: 9, lv: 'mid', col: Y, from: c.a.r && !(W.muzzle && W.muzzle()) ? [0.42, 0.64] : undefined }, o));
  /* ---------- 金色羽毛（取代白色羽毛素材） ---------- */
  function feather(ctx, x, y, L, rot, a) { const C = KF().PAL.holy; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, 0, 0, L * 1.6, L * 0.8, 0.35 * a); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(' + C.mid + ',0.92)'; ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.quadraticCurveTo(-L * 0.1, -L * 0.2, L * 0.5, -L * 0.02); ctx.quadraticCurveTo(-L * 0.1, L * 0.16, -L * 0.5, 0); ctx.fill();
    ctx.fillStyle = 'rgba(' + C.lite + ',0.9)'; ctx.beginPath(); ctx.moveTo(-L * 0.55, 0); ctx.quadraticCurveTo(0, -L * 0.03, L * 0.5, -L * 0.02); ctx.quadraticCurveTo(0, L * 0.02, -L * 0.55, 0); ctx.fill(); ctx.restore(); }
  (function hd() { if (!VX.draw2) return setTimeout(hd, 50); const d0 = VX.draw2; VX.draw2 = function (ctx, n, fi, x, y, k, o) { if (!isY() || (o && o.raw)) return d0.apply(this, arguments);
      if (n === 'obj_feather_white') { feather(ctx, x, y, (k || 1) * HH() * S(y) * 0.2, (o && o.rot) || 0, o && o.a !== undefined ? o.a : 1); return true; }
      if (n === 'fx_sigil_shrine') { if (o && o.add) return true; const C = KF().PAL.holy, s = S(y), R = (k || 1) * HH() * s * 0.9, a = o && o.a !== undefined ? o.a : 1; ctx.save(); ctx.globalCompositeOperation = 'screen';   // 神社法陣 → 地面神聖柔光
        KF().spr(ctx, C.T.gm, x, y, R * 2.4, R * 0.9, 0.5 * a); KF().spr(ctx, C.T.gl, x, y, R * 1.2, R * 0.45, 0.4 * a * (0.8 + 0.2 * Math.sin(G.t * 0.1))); ctx.restore();
        if (G.t % 6 === 0) Hy(() => KF().motes(x + rnd(-1, 1) * R, y, 0.05, 1, { up: 1.6, sp: 0.15, life: 40, sz: 0.8 })); return true; }
      return d0.apply(this, arguments); }; })();
  /* ---------- 箭：飛行柔光拖尾 ---------- */
  (function sh() { const s0 = VX.shot; VX.shot = function (o) { const p = s0.apply(this, arguments); if (p && isY() && (o.k === 'arrow' || o.k === 'bigarrow') && !o.enemy && H.act) { if (o.home) homeTrail(p);
        VX.custom((q, ctx) => { if (p.dead) { q.t = q.life; return; } const k = HH() * S(p.y), d = Math.sign(p.vx) || 1, C = KF().PAL.holy; ctx.save(); ctx.globalCompositeOperation = 'screen';
          for (let i = 1; i <= 4; i++) KF().spr(ctx, C.T.gm, p.x - d * i * 0.16 * k, p.y - p.z, k * (0.34 - i * 0.05), k * (0.16 - i * 0.02), 0.45 - i * 0.08); ctx.restore(); }, 240, 'o',
          { step: (q, t) => { if (p.dead) return; if (t % 3 === 0) Hy(() => KF().motes(p.x, p.y, p.z / (HH() * S(p.y)), 1, { sp: 0.15, up: -0.1, life: 18, sz: 0.7 })); } }); }
      return p; }; })();
  /* ---------- 天降箭：柔光拖尾、十字星光、柔光柱 ---------- */
  (function fa() { if (!MV2.fallArrow) return setTimeout(fa, 50); const f0 = MV2.fallArrow;
    MV2.fallArrow = function (c, x, y, o) { if (!isY()) return f0.apply(this, arguments); o = o || {}; const life = o.life || 12, f = o.dx === undefined ? -c.f : Math.sign(o.dx) || -1, h = (o.h || 5), dx = (o.dx === undefined ? 0.8 : Math.abs(o.dx)), col = o.col || Y;
      VX.custom((q, ctx) => { const s = S(y), k = HH() * s, u = Math.min(1, q.t / life), px = x + f * dx * k * (1 - u), pz = h * k * (1 - u); if (u >= 1) return; const C = KF().PAL.holy, ux = -f * dx / Math.hypot(dx, h), uz = h / Math.hypot(dx, h);
        ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 1; i <= 5; i++) KF().spr(ctx, C.T.gm, px - ux * i * 0.22 * k, y - pz - uz * i * 0.22 * k, k * (0.4 - i * 0.05), k * (0.4 - i * 0.05), 0.5 - i * 0.08); ctx.globalCompositeOperation = 'source-over';
        ctx.translate(px, y - pz); ctx.rotate(Math.atan2(h, -f * dx)); VX.arrowShape(0.42 * k, 0.018 * k, col, !!o.big); ctx.restore(); }, life, 'o');
      c.later(life, () => { Hy(() => { KF().glint(x, y, 0.15, 0.4, 14); KF().leaves(x, y, 0.2, 2, { sp: 0.5, life: 34 }); KF().light(x, y, 0.6, 14, 0.4); });
        VX.custom((q, ctx) => { const s = S(y), k = HH() * s; ctx.save(); ctx.translate(x, y - 0.04 * k); ctx.rotate(Math.atan2(h, -f * dx)); ctx.globalAlpha = Math.min(1, (q.life - q.t) / 12); VX.arrowShape(0.3 * k, 0.018 * k, col, false); ctx.restore(); }, 40, 'g');   // 插地
        if (o.pillar) Hy(() => { KF().light(x, y, 0.9, 26, 0.55, 1.2); KF().motes(x, y, 0.2, 10, { up: 2.6, sp: 0.15, rx: 0.15, life: 32 }); });
        c.hit({ shape: 'circle', x, y, r: o.r || 0.75, m: o.m || 0.5, lv: o.pillar ? 'heavy' : 'mid', kind: 'arrow', col: o.col }); if (o.on) o.on(x, y); }); }; })();
  /* ---------- 標記：金色十字星光（跟著被標記的敵人，標記轉移時跟著換人） ---------- */

  (function mk() { if (!G.drawFx) return setTimeout(mk, 50); const df0 = G.drawFx; G.drawFx = function () { const r = df0.apply(this, arguments); if (!isY()) return r; const ctx = G.ctx, C = KF().PAL.holy;
      for (const e of G.E) { if (e.st === 'dead' || !(e.db && e.db.mark && e.db.markT > 0)) continue; const k = HH() * S(e.y), y = e.y - k * (e.ratio || 1) * 1.15; ctx.save(); ctx.translate(e.x, y); ctx.rotate(G.t * 0.03); ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, 0, 0, k * 0.5, k * 0.5, 0.5); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(' + C.mid + ',0.95)'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(k * 0.05, 0); ctx.quadraticCurveTo(k * 0.12, -k * 0.025, k * 0.2, 0); ctx.quadraticCurveTo(k * 0.12, k * 0.025, k * 0.05, 0); ctx.fill(); } ctx.restore(); } return r; }; })();
  /* ---------- 技：天穹的虛線圈、標位的紅準星 → 過濾掉（換成上面的神聖柔光／金色標記） ---------- */
  function filtered(fn) { return function (c, t) { const vc = VX.custom; VX.custom = function (draw, life, l, ex) { const src = draw ? String(draw) : '';
        if (/setLineDash/.test(src)) { const m = c.a.mvx, lv = m.lv || 1; Hy(() => KF().add(life, 'g', (ctx, u) => { const p = m.p; if (!p) return; const k = HH() * S(p[1]), a = Math.min(1, u / 10, (life - u) / 12), C = KF().PAL.holy; ctx.globalCompositeOperation = 'screen';
              KF().spr(ctx, C.T.gm, p[0], p[1], k * 2.9, k * 1.05, 0.45 * a); KF().spr(ctx, C.T.gl, p[0], p[1], k * 1.4, k * 0.5, 0.35 * a * (0.8 + 0.2 * Math.sin(u * 0.12))); }, (o2, tt) => { const p = m.p; if (p && tt % 5 === 0) Hy(() => KF().motes(p[0] + rnd(-1.2, 1.2) * c.hh, p[1], 0.05, 1, { up: 2, sp: 0.1, life: 40, sz: 0.8 })); })); return {}; }
        if (/255,110,90/.test(src)) return {};
        return vc.apply(this, arguments); }; try { return fn.apply(this, arguments); } finally { VX.custom = vc; } }; }
  /* ---------- 秘傳 ---------- */
  const featherFall = (x, y) => { const z0 = rnd(1.4, 2.3), ph = rnd(0, TAU), sp = rnd(0.018, 0.026), big = rnd(1.1, 1.6); let z = z0;
    VX.custom((o, ctx) => { const k = HH() * S(y); z = Math.max(0, z - sp); const sw = Math.sin(o.t * 0.08 + ph), a = Math.min(1, o.t / 8, (o.life - o.t) / 14); feather(ctx, x + sw * 0.25 * k, y - z * k, big * k * 0.2, 0.5 + sw * 0.45, a * 0.95); }, Math.round(z0 / 0.022) + 10, 'o'); };
  const holyCut = e => { const k = HH() * S(e.y), r = e.ratio || 1; Hy(() => { KF().qi({ x: e.x + rnd(-0.1, 0.1) * k, y: e.y, z: r * rnd(0.35, 0.75), ang: rnd(-1.2, 1.2), len: 1.1 * Math.min(1.6, r), w: 0.07, dur: 2, life: 10, motes: 2 }); KF().glint(e.x, e.y, r * 0.55, 0.3, 10); }); };
  function upArrow(c) { const [x0, y0] = muz(c); Hy(() => KF().stab({ x: x0 - c.f * 0.25 * c.hh, y: c.y, f: c.f, cy: (c.y - y0) / c.hh, len: 2.2, w: 0.1, ang: -1.35, dur: 3, life: 12, tip: 1 })); }
  function moonBounce(c, e, n) { const seen = [e]; let cur = e, x = e.x, y = e.y, z = (e.ratio || 1) * 0.55, tx = x, ty = y, mv = 0, hopT = 0, left = n, sp = 0;   // 金色月牙在命中點旋斬，再依序彈向附近敵人
    VX.custom((q, ctx) => { sp += 0.45; const k = HH() * S(y); ctx.save(); ctx.translate(x, y - z * k); ctx.rotate(sp); Hy(() => KF().moonShape(ctx, 0, 0, 0.42 * k, 1, Math.min(1, (q.life - q.t) / 8), k)); ctx.restore(); }, 26 + n * 14, 'o',
      { step: (q, tt) => { if (tt % 2 === 0) Hy(() => KF().motes(x, y, z, 1, { sp: 0.5, life: 16 }));
          if (tt === 2) { G.damageOni(cur, 0.7 * c.mul, false, false); VX.impact(cur, 'mid', 'cut'); c.a.mvx.hit = 1; }
          if (mv > 0) { x += (tx - x) / mv; y += (ty - y) / mv; mv--; if (mv === 0 && cur.st !== 'dead') { G.damageOni(cur, 0.7 * c.mul, false, false); VX.impact(cur, 'mid', 'cut'); } return; }
          if (++hopT >= 12 && left > 0) { hopT = 0; const nx = G.E.filter(q2 => q2.st !== 'dead' && q2.hp > 0 && !seen.includes(q2) && Math.hypot(q2.x - x, (q2.y - y) * 1.6) < 3.2 * HH() * S(y)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
            if (!nx) { left = 0; q.life = Math.min(q.life, q.t + 10); return; } seen.push(nx); cur = nx; tx = nx.x; ty = nx.y; mv = 8; left--; } } }); }
  const near3 = (c, n) => G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.bb && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < 9 * c.hh).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, n);
  const DH = {
    m_amenoha(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === r1) { m.es = near3(c, 3); m.es.forEach(e => { e.db = e.db || {}; e.db.mark = 20; e.db.markT = 300; }); }
      if (t === r2) { string(c); upArrow(c); const es = m.es && m.es.length ? m.es : null, cx = es ? es.reduce((a, e) => a + e.x, 0) / es.length : c.x + c.f * 3 * k, cy = es ? es.reduce((a, e) => a + e.y, 0) / es.length : c.y;
        Hy(() => KF().light(cx, cy, 2, 70, 0.35)); for (let i = 0; i < 26; i++) c.later(6 + i * 2, () => featherFall(cx + rnd(-1.6, 1.6) * k, cy + rnd(-0.5, 0.5) * k)); }
      if (t === r3 && m.es) { string(c); m.es.forEach((e, j) => { for (let i = 0; i < 5; i++) c.later(j * 2 + i * 5, () => { if (e.st === 'dead' || e.hp <= 0) return; holyCut(e); G.damageOni(e, 0.35 * c.mul, i === 4, false); VX.impact(e, i === 4 ? 'heavy' : 'light', 'arrow'); m.hit = 1; }); }); } },
    m_senba(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, hitE = m.he = m.he || new Set(), on = e => hitE.add(e);
      if (t < r1) c.move(0, 0.025);
      if (t === r1) { string(c); arw(c, { m: 0.5, onHit: on }); }
      if (t === r2 || t === r3) { string(c); for (let i = 0; i < 5; i++) featherFall(c.x + c.f * rnd(0.2, 0.8) * c.hh, c.y + rnd(-0.2, 0.2) * c.hh); for (let i = -4; i <= 4; i++) arw(c, { m: 0.28, ang: i * 0.11, range: t === r2 ? 6 : 9, onHit: on }); }
      if (t === r3 + 18) [...hitE].forEach((e, i) => c.later(i * 4, () => { if (e.st === 'dead') return; Hy(() => { KF().glint(e.x, e.y, (e.ratio || 1) * 0.5, 0.45, 14); KF().burst(e.x, e.y, (e.ratio || 1) * 0.5, 1.2); }); G.damageOni(e, 0.6 * c.mul, false, false); m.hit = 1; })); },
    m_tsukikage(c, t, C) { const [, , r3] = C.rel;
      if (t < 14) { c.move(-0.04, 0); if (t === 4 || t === 9) c.ghost(10); }
      if (t === r3) { string(c); arw(c, { m: 1.0, col: '255,225,160', home: MV2.near(c, 9), turn: 0.2, onHit: e => moonBounce(c, e, 3) }); } }
  };
  /* ==================== r3.81.0 和弓：神聖大範圍清怪 ==================== */
  /* 光球炸裂（光羽觸敵、小箭落地） */
  const orbBurst = (x, y, z) => Hy(() => { KF().burst(x, y, z, 1.3); KF().glint(x, y, z, 0.32, 10); KF().light(x, y, 0.6, 12, 0.4, z); });
  /* 神聖光爆：柔光爆＋十字星光＋金羽往外爆散＋上升光點；m 有值才判定 */
  function holyBoom(c, x, y, R, m, lv) { Hy(() => { KF().burst(x, y, 0.4, 1.6 + R); KF().light(x, y, R * 1.3, 22, 0.55, 0.5); KF().glint(x, y, 0.5, 0.45 + R * 0.2, 14); KF().leaves(x, y, 0.4, 4 + Math.round(R * 4), { sp: 1.4 + R * 0.5, life: 42, rx: 0.3 }); KF().motes(x, y, 0.2, 6 + Math.round(R * 3), { up: 1.8, sp: 0.6, life: 32, rx: R * 0.4 }); });
    if (m) c.hit({ shape: 'circle', x, y, r: R, m, lv: lv || 'heavy', kind: 'arrow' }); SC.shake = Math.max(SC.shake || 0, R > 1.8 ? 5 : 3); }
  /* 光羽飄落（千本櫻式：翻轉、搖擺、慢慢落下）；碰到敵人就光球炸裂並造成傷害 */
  function featherStorm(c, px, py, R, frames, every, dmg, per) { const F = [];
    Hy(() => KF().add(frames + 140, 'o', (ctx) => { for (const p of F) { if (p.dead) continue; const k = HH() * S(p.y), sw = Math.sin(p.t * 0.08 + p.ph); feather(ctx, p.x + sw * 0.3 * k, p.y - p.z * k, p.L * k, 0.5 + sw * 0.6 + p.rot, p.a); } },
      (o, tt) => { if (tt < frames && tt % every === 0) for (let i = 0; i < (per || 2); i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R; F.push({ x: px + Math.cos(a) * r * c.hh, y: py + Math.sin(a) * r * 0.4 * c.hh, z: rnd(1.6, 2.7), sp: rnd(0.015, 0.025), ph: rnd(0, TAU), t: 0, L: rnd(0.3, 0.42), rot: rnd(-0.3, 0.3), a: 0 }); }
        for (const p of F) { if (p.dead) continue; p.t++; p.z -= p.sp; p.a = Math.min(1, p.t / 8); const k = HH() * S(p.y), sx = p.x + Math.sin(p.t * 0.08 + p.ph) * 0.3 * k;
          if (p.z <= 0) { p.dead = 1; Hy(() => KF().glint(sx, p.y, 0.05, 0.2, 8)); continue; }
          for (const e of G.E) { if (e.st === 'dead' || e.hp <= 0 || e.bb) continue; const ek = HH() * S(e.y), r = e.ratio || 1; if (Math.abs(e.x - sx) < 0.3 * ek * r && Math.abs(e.y - p.y) < 0.3 * ek && p.z * k < ek * r * 1.05) { p.dead = 1; orbBurst(sx, e.y, p.z * k / ek); G.damageOni(e, dmg * c.mul, false, false); VX.impact(e, 'light', 'arrow'); c.a.mvx && (c.a.mvx.hit = 1); break; } } } })); }
  /* 天降巨光矢（破魔矢）：垂直落下，後拖柔光 */
  function bigFall(x, y, life) { VX.custom((q, ctx) => { const k = HH() * S(y), u = Math.min(1, q.t / life), pz = (1 - u * u) * 6 * k, C = KF().PAL.holy; if (u >= 1) return; ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 1; i <= 7; i++) KF().spr(ctx, C.T.gm, x, y - pz - i * 0.32 * k, k * (0.6 - i * 0.05), k * (0.9 - i * 0.06), 0.6 - i * 0.07); KF().spr(ctx, C.T.gl, x, y - pz, k * 0.9, k * 0.9, 0.7); ctx.globalCompositeOperation = 'source-over';
      ctx.translate(x, y - pz); ctx.rotate(Math.PI / 2); VX.arrowShape(1.5 * k, 0.05 * k, Y, true); ctx.restore(); }, life + 1, 'o'); }
  /* 追蹤箭軌跡：沿實際飛行路線留一道漸細金光（看得出轉彎） */
  function homeTrail(p) { const P = []; Hy(() => KF().add(400, 'o', (ctx) => { const n = P.length; if (n < 2) return; const C = KF().PAL.holy, k = HH() * S(P[n - 1][1]); ctx.lineCap = 'round';
      for (const [w, col, a] of [[0.075, C.mid, 0.5], [0.028, C.lite, 0.9]]) for (let i = 1; i < n; i++) { const v = i / (n - 1); ctx.strokeStyle = 'rgba(' + col + ',' + (a * v).toFixed(3) + ')'; ctx.lineWidth = Math.max(0.5, w * k * v); ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); } },
    (o, tt) => { if (!p.dead) { P.push([p.x, p.y - p.z]); if (P.length > 18) P.shift(); } else { P.shift(); P.shift(); if (!P.length) o.t = o.life; } })); }
  /* 追魂矢：Lv1 1 支／Lv3 3 支／Lv5 5 支，先扇形散開再各自追不同目標 */
  function tsuikon(base) { return function (c, t) { const sh = c.shoot, vc = VX.custom, lv = c.a.mvx.lv || 1;
    c.shoot = function (k, o) { const n = lv >= 5 ? 5 : lv >= 3 ? 3 : 1, T = near3(c, n).reverse(), fire = i => sh.call(c, k, Object.assign({}, o, { col: Y, home: T.length ? T[i % T.length] : o.home, ang: n > 1 ? (i % 2 ? -1 : 1) * (0.5 + 0.12 * i) : 0, turn: 0.09, pierce: 2 }));   // 遠的先射、左右交錯張開，一支一支看得出來
      for (let i = 1; i < n; i++) c.later(i * 3, () => { fire(i); if (i % 2) string(c); }); return fire(0); };
    VX.custom = function (draw) { if (/160,205,255/.test(String(draw))) return {}; return vc.apply(this, arguments); };
    try { return base.call(this, c, t); } finally { c.shoot = sh; VX.custom = vc; } }; }
  /* 天弓：箭更密、範圍更大 */
  function tenkyuMore(base) { return function (c, t) { const r = base.call(this, c, t), m = c.a.mvx; if (m.p && t > 24 && t < c.a.T - 12 && t % 8 === 4) { const a = rnd(0, TAU), rr = Math.sqrt(Math.random()) * 2.1 * c.hh; MV2.fallArrow(c, m.p[0] + Math.cos(a) * rr, m.p[1] + Math.sin(a) * rr * 0.4, { col: Y, h: rnd(4, 5.5), dx: -c.f * rnd(0.3, 0.7), life: 12, r: 0.7, m: 0.5 }); } return r; }; }
  /* 爆裂矢 → 神聖光爆（範圍 1.2H，Lv3 1.55H；Lv5 再分裂三團小光爆） */
  function bakuretsu(c, t) { const lv = c.a.mvx.lv || 1, R = 1.2 * (lv >= 3 ? 1.3 : 1); if (t !== 12) return; string(c);
    arw(c, { m: 0.4, col: Y, onHit: e => { holyBoom(c, e.x, e.y, R, 1.8); if (lv >= 5) for (let i = 0; i < 3; i++) c.later(6 + i * 4, () => holyBoom(c, e.x + rnd(-1, 1) * c.hh, e.y + rnd(-0.4, 0.4) * c.hh, R * 0.55, 0.5)); return false; }, onEnd: q => holyBoom(c, q.x, q.y, R, 1.8) }); }
  const DH2 = {
    /* 破魔矢：朝天一箭 → 天空裂光 → 巨光矢垂直落下 → 神社法陣（原素材）＋放射光紋＋金羽爆散 → 2 秒光羽飄落，碰到敵人光球炸裂 */
    m_hamaya(c, t, C) { const [, , r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === 2) { const e = MV2.near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; }
      if (t > C.st[1] && t < r3 && t % 6 === 0) string(c);
      if (t === r3) { string(c); upArrow(c); const [px, py] = m.p;
        c.later(6, () => Hy(() => { KF().glint(px, py, 5.4, 1.1, 22); KF().light(px, py, 1.3, 24, 0.5, 5.2); KF().motes(px, py, 5.2, 14, { sp: 1.3, life: 26 }); }));
        c.later(12, () => bigFall(px, py, 8));
        c.later(20, () => { SC.shake = Math.max(SC.shake || 0, 7); Hy(() => { KF().crack(px, py, 2.5, 80, true); KF().burst(px, py, 0.3, 3.6); KF().light(px, py, 2.7, 32, 0.6, 0.4); KF().light(px, py, 0.9, 26, 0.6, 1.6); KF().leaves(px, py, 0.3, 18, { sp: 2.6, life: 48, rx: 0.4 }); KF().motes(px, py, 0.2, 18, { up: 3, sp: 0.3, rx: 0.3, life: 40 }); });
          c.hit({ shape: 'circle', x: px, y: py, r: 2.5, m: 2.2, lv: 'hiden', kind: 'arrow', def: 30 });
          VX.custom((o, ctx) => { const a = Math.min(1, o.t / 6, (o.life - o.t) / 16) * (0.85 + 0.15 * Math.sin(o.t * 0.15)); VX.draw2(ctx, 'fx_sigil_shrine', 0, px, py, 2.1, { sy: 0.4, a, raw: 1 }); VX.draw2(ctx, 'fx_sigil_shrine', 0, px, py, 2.1, { sy: 0.4, a: a * 0.35, add: 1, raw: 1 }); }, 150, 'g',
            { step: (o, tt) => { if (tt % 22 === 4) c.hit({ shape: 'circle', x: px, y: py, r: 2.4, m: 0.5, lv: 'mid', kind: 'arrow', def: 30 }); } });
          featherStorm(c, px, py, 2.4, 120, 3, 0.3, 2); }); } },
    /* 流星群：箭雨範圍 2.2H、落地光球炸裂；收尾神聖大光爆 */
    m_ryusei(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === 2) { const e = MV2.near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; }
      if (t === r1 || t === r1 + 5 || t === r2 || t === r3) { string(c); upArrow(c); }
      if (t > r1 + 8 && t < r3 + 8 && t % 3 === 0) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 2.2 * k, x = m.p[0] + Math.cos(a) * r, y = m.p[1] + Math.sin(a) * r * 0.4; MV2.fallArrow(c, x, y, { col: Y, h: rnd(4, 5.5), dx: -c.f * rnd(0.3, 0.6), life: 10, r: 0.7, m: 0.25, on: (x2, y2) => orbBurst(x2, y2, 0.15) }); }
      if (t === r3) c.later(14, () => { const [px, py] = m.p; holyBoom(c, px, py, 2.3, 1.6, 'hiden'); Hy(() => KF().light(px, py, 1.0, 26, 0.55, 1.6)); }); },
    /* 天羽羽矢：鎖 5 隻 → 光羽飄落 → 一支巨光矢貫穿整個畫面，沿線光爆；被鎖定者再受金色光斬 */
    m_amenoha(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === r1) { m.es = near3(c, 5); m.es.forEach(e => { e.db = e.db || {}; e.db.mark = 20; e.db.markT = 300; }); }
      if (t === r2) { string(c); upArrow(c); const es = m.es && m.es.length ? m.es : null, cx = es ? es.reduce((a, e) => a + e.x, 0) / es.length : c.x + c.f * 3 * k, cy = es ? es.reduce((a, e) => a + e.y, 0) / es.length : c.y; featherStorm(c, cx, cy, 2.0, 40, 3, 0.2, 2); }
      if (t === r3) { string(c); const sk = new Set(); arw(c, { k: 'bigarrow', m: 1.6, spd: 0.85, range: 11, pierce: 99, lv: 'hiden', onHit: e => { if (sk.has(e)) return; sk.add(e); holyBoom(c, e.x, e.y, 0.9); } });
        for (let i = 1; i <= 5; i++) c.later(i * 2, () => Hy(() => KF().light(c.x + c.f * i * 1.8 * k, c.y, 1.0, 20, 0.4, 0.6)));
        if (m.es) m.es.forEach((e, j) => { for (let i = 0; i < 3; i++) c.later(10 + j * 2 + i * 5, () => { if (e.st === 'dead' || e.hp <= 0) return; holyCut(e); G.damageOni(e, 0.4 * c.mul, i === 2, false); VX.impact(e, i === 2 ? 'heavy' : 'light', 'arrow'); m.hit = 1; }); }); } },
    /* 千羽：兩波九箭扇射 → 前方 6H 扇形天降光箭，落地光球炸裂 → 中箭者光爆 */
    m_senba(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, hitE = m.he = m.he || new Set(), on = e => hitE.add(e), k = c.hh;
      if (t < r1) c.move(0, 0.025);
      if (t === r1) { string(c); arw(c, { m: 0.5, onHit: on }); }
      if (t === r2 || t === r3) { string(c); for (let i = -4; i <= 4; i++) arw(c, { m: 0.28, ang: i * 0.11, range: t === r2 ? 6 : 9, onHit: on }); }
      if (t === r3) for (let i = 0; i < 28; i++) c.later(6 + i * 2, () => { const d = rnd(1.2, 6), w = d * 0.3, x = c.x + c.f * d * k, y = c.y + rnd(-w, w) * k * 0.5; MV2.fallArrow(c, x, y, { col: Y, h: rnd(4, 5.5), dx: -c.f * rnd(0.3, 0.6), life: 10, r: 0.6, m: 0.3, on: (x2, y2) => orbBurst(x2, y2, 0.15) }); });
      if (t === r3 + 30) [...hitE].forEach((e, i) => c.later(i * 3, () => { if (e.st === 'dead') return; holyBoom(c, e.x, e.y, 0.8); G.damageOni(e, 0.6 * c.mul, false, false); m.hit = 1; })); },
    /* 月影：後滑留下分身 → 本體與分身同時放箭交叉在目標 → 交叉點神聖大光爆＋月牙連彈 5 次 */
    m_tsukikage(c, t, C) { const [, , r3] = C.rel, m = c.a.mvx;
      if (t === 1 || t === 2) { m.x0 = m.x0 || c.x; m.y0 = m.y0 || c.y; }
      if (t < 14) { c.move(-0.04, 0); if (t === 4 || t === 9) c.ghost(10); }
      if (t === 14 && MV2.ghostAt) MV2.ghostAt(m.x0, m.y0, H.face, r3 - 14 + 20);
      if (t === r3) { string(c); const e = MV2.near(c, 9); arw(c, { m: 1.0, col: Y, home: e, turn: 0.2, onHit: q => moonBounce(c, q, 5) });
        if (e) { const x0 = m.x0, y0 = m.y0 - 0.64 * c.hh, tx = e.x, ty = e.y - (e.ratio || 1) * 0.55 * c.hh, L = 10;   // 分身的光箭
          VX.custom((q, ctx) => { const u = Math.min(1, q.t / L), k = HH() * S(e.y), x = x0 + (tx - x0) * u, y = y0 + (ty - y0) * u, C2 = KF().PAL.holy; if (u >= 1) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 1; i <= 4; i++) KF().spr(ctx, C2.T.gm, x - (tx - x0) / L * i * 0.6, y - (ty - y0) / L * i * 0.6, k * (0.3 - i * 0.04), k * (0.3 - i * 0.04), 0.5 - i * 0.1); ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.rotate(Math.atan2(ty - y0, tx - x0)); VX.arrowShape(0.42 * k, 0.018 * k, Y, false); ctx.restore(); }, L + 1, 'o');
          c.later(L + 2, () => { if (e.st === 'dead') return; holyBoom(c, e.x, e.y, 2.0, 1.6, 'hiden'); }); } } }
  };
  Object.assign(DH, DH2);
  /* 凝神追點：弓旁浮出剩餘追蹤箭數的金羽（取代 92 的小藍點） */
  (function hud2() { if (!G.drawHero || !G.BUFF) return setTimeout(hud2, 50); const d0 = G.drawHero; G.drawHero = function () { const g0 = G.BUFF.get; let n = 0, r;
      if (isY() && g0) { n = g0.call(G.BUFF, 'home') || 0; G.BUFF.get = function (k) { return k === 'home' ? 0 : g0.apply(this, arguments); }; }
      try { r = d0.apply(this, arguments); } finally { if (g0) G.BUFF.get = g0; }
      if (n > 0) { const ctx = G.ctx, k = HH() * S(H.y), cx = H.x, cy = H.y - 1.05 * k; for (let i = 0; i < n; i++) { const a = G.t * 0.03 + i * TAU / n, x = cx + Math.cos(a) * 0.34 * k, y = cy + Math.sin(a) * 0.1 * k; feather(ctx, x, y, 0.16 * k, -1.2 + Math.sin(G.t * 0.05 + i) * 0.3, 0.9); } }
      return r; }; })();
  /* ---------- 掛上（每格對照參照，必要時補回） ---------- */
  const WRU = {}, WRP = {};
  function patch() { const U = MV2.U.yumi, L = MV2.HD.yumi;
    if (U) for (const k of ['skill_tenkyu', 'special_marked']) { const d = U[k]; if (d && d.run !== WRU[k]) { WRU[k] = d.run = filtered(k === 'skill_tenkyu' ? tenkyuMore(d.run) : d.run); } }
    if (U && U.skill_tsuikon && U.skill_tsuikon.run !== WRU.ts) WRU.ts = U.skill_tsuikon.run = tsuikon(U.skill_tsuikon.run);
    if (U && U.skill_bakuretsu && U.skill_bakuretsu.run !== bakuretsu) U.skill_bakuretsu.run = bakuretsu;
    if (L) for (const h of L) { const f = DH[h.id]; if (!f || h.run === WRP[h.id]) continue; const base = h.run;
      WRP[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) f(c, t, C); else base.call(this, c, t); }; } }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); patch(); };
})();
