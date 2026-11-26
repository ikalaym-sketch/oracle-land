/* ==========================================================================
 * 神諭之地 重製版 — 78_mv_ranged.js
 * Version : r3.34.0  (2026-11-17)
 * 變更    : r3.34.0 新增。鐵砲、和弓的 12 招（規格 VFX_SPEC v2.1 第四節）。
 *           鐵砲：槍口火光＋火花＋煙、曳光子彈、彈殼、命中火星；連發時煙越疊越多。
 *           和弓：程式畫的箭（箭身、箭頭、箭羽）＋殘影、弦光、命中插箭；追蹤箭為藍色彎曲尾。
 *           def：n 名稱、cat 起／連／收／架、T 總格數、cx 可接下一段的格、run(c, t) 時間軸、counter(c, e) 架勢反擊、noHit 不需命中也算數。
 * 依賴    : 76_vfx（G.VX）、77_moves（G.MV2.reg、執行環境 c）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, HH = () => G.HERO_H, S = y => G.SC.depth(y); if (!MV2 || !VX) return;
  const mark = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };   // 不需命中的招式（裝填、穩神…）也算數
  const casing = c => { const k = c.hh; VX.shard({ x: c.x + c.f * 0.35 * k, y: c.y, z: 0.62, n: 1, col: '230,190,90', life: 26 }); };
  const loaded = (o) => { if (H.loaded > 0) { H.loaded--; o.m *= 1.4; o.col = '255,230,150'; VX.glow({ x: H.x, y: H.y, z: 0.62, r: 0.3, col: '255,210,120', life: 6 }); } return o; };
  const focus = o => { if (H.focus > 0) { H.focus--; o.crit = 1; o.col = '150,210,255'; } return o; };
  const bullet = (c, o) => { c.muzzle(o.big, o.ang); casing(c); return c.shoot(o.k || 'bullet', loaded(Object.assign({ spd: 0.55, range: 8 }, o))); };
  const arrow = (c, o) => { c.muzzle(false, o.ang); return c.shoot(o.k || 'arrow', focus(Object.assign({ spd: 0.42, range: 9 }, o))); };
  const aimLine = (c, len, life, col) => VX.custom((o, ctx) => { const s = S(H.y), k = HH() * s, q = o.t / o.life, x0 = H.x + o.f * 0.95 * k, y0 = H.y - 0.62 * k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(' + col + ',' + (0.25 + 0.6 * q) + ')'; ctx.lineWidth = (0.6 + 2.4 * q) * s; ctx.setLineDash([6 * s, 4 * s]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + o.f * len * k, y0); ctx.stroke(); ctx.restore(); }, life, 'o', { f: c.f });
  const gather = (c, z, col, life) => VX.custom((o, ctx) => { const s = S(H.y), k = HH() * s, q = o.t / o.life, x = H.x + o.f * o.dx * k, y = H.y - z * k; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) { const a = i * 0.628 + o.t * 0.15, r = (1 - q) * k * 0.8; ctx.fillStyle = 'rgba(' + col + ',' + (0.3 + 0.6 * q) + ')'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 1.8 * s, 0, 6.283); ctx.fill(); }
      const g = ctx.createRadialGradient(x, y, 0, x, y, k * 0.25 * q + 2); g.addColorStop(0, 'rgba(255,255,255,' + q + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, k * 0.25 * q + 2, 0, 6.283); ctx.fill(); ctx.restore(); }, life, 'o', { f: c.f, dx: G.WPN.curId() === 'teppo' ? 0.95 : 0.45 });
  /* 地面火線（火花斷進） */
  function fireLine(c, len, life, m) { const x0 = c.x + c.f * 0.4 * c.hh, y0 = c.y, f = c.f, L = len * c.hh;
    VX.custom((o, ctx) => { const s = S(y0), q = o.t / o.life, a = q < 0.85 ? 1 : (1 - q) / 0.15, grow = Math.min(1, o.t / 10); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) { const u = i / 15; if (u > grow) break; const x = x0 + f * u * L, h = (0.25 + 0.2 * Math.sin(o.t * 0.4 + i * 1.7)) * HH() * s, w = 0.09 * HH() * s;
        const g = ctx.createLinearGradient(x, y0, x, y0 - h); g.addColorStop(0, 'rgba(255,220,120,' + 0.9 * a + ')'); g.addColorStop(0.5, 'rgba(255,120,40,' + 0.6 * a + ')'); g.addColorStop(1, 'rgba(200,40,10,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, y0); ctx.quadraticCurveTo(x - w * 0.3, y0 - h * 0.6, x + Math.sin(o.t * 0.3 + i) * w, y0 - h); ctx.quadraticCurveTo(x + w * 0.3, y0 - h * 0.6, x + w, y0); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }, life, 'g', { step: (o, t) => { if (t % 20 === 10) c.hit({ shape: 'line', x: x0, y: y0, len, w: 0.3, m, lv: 'light', kind: 'shot', col: '255,150,80' }); if (t % 9 === 0) VX.smoke({ x: x0 + f * Math.random() * L, y: y0, z: 0.3 * HH() * S(y0), n: 1, r: 0.1, life: 30, a: 0.3, col: '90,80,75' }); } }); }
  /* ---------------- 鐵砲 ---------------- */
  MV2.reg('teppo', {
    retreat_shot: { n: '退步側射', cat: '起', T: 30, cx: 22, run(c, t) { if (t <= 10) c.move(-0.11, 0); if (t === 3) c.ghost(10); if (t === 9) bullet(c, { m: 1.1 }); } },
    point_shot: { n: '點射', cat: '起', T: 22, cx: 15, run(c, t) { if (t === 5) bullet(c, { m: 1.0, spd: 0.65 }); } },
    aim_shift: { n: '瞄移', cat: '起', T: 30, cx: 22, run(c, t) { if (t === 1) { aimLine(c, 6, 14, '255,70,60'); G.BUFF.add('nextCrit', 100, 300); }
        if (t <= 10) c.move(0, (G.IN.my || 0.6) * 0.06); if (t === 14) bullet(c, { m: 0.6 }); } },
    pressure_shot: { n: '壓制射', cat: '連', T: 34, cx: 26, run(c, t) { if (t === 6 || t === 12 || t === 18) bullet(c, { m: 0.62, ang: (Math.random() - 0.5) * 0.06 }); } },
    focused_shot: { n: '凝射', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 1) aimLine(c, 8, 10, '255,240,200'); if (t === 11) bullet(c, { m: 1.45, spd: 0.8, col: '255,250,230', crit: Math.random() < 0.5, lv: 'mid' }); } },
    close_scatter: { n: '近膛散擊', cat: '連', T: 32, cx: 24, run(c, t) { if (t === 8) { c.muzzle(true); for (let i = 0; i < 7; i++) c.shoot('pellet', loaded({ m: 0.42, ang: (i - 3) * 0.17 + (Math.random() - 0.5) * 0.06, spd: 0.5, range: 3, kb: 0.8 })); casing(c); G.SC.shake = 3; c.move(-0.15, 0); } } },
    ramrod_load: { n: '裝填', cat: '連', T: 30, cx: 22, noHit: 1, run(c, t) { if (t === 2) mark(c); if (t === 8 || t === 14) casing(c); if (t === 18) { H.loaded = 2; VX.glow({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 0.6, r: 0.45, col: '255,215,120', life: 14 }); VX.spark({ x: c.x + c.f * 0.6 * c.hh, y: c.y, z: 0.6 * c.hh, n: 6, up: 2, spd: 2, col: '255,225,140' }); } } },
    denial_fire: { n: '火花斷進', cat: '收', T: 34, cx: 28, run(c, t) { if (t === 8) { c.muzzle(true, -0.4); fireLine(c, 3, 120, 0.3); c.hit({ shape: 'line', len: 3.2, w: 0.35, m: 0.8, lv: 'mid', kind: 'shot', col: '255,150,80' }); } } },
    steady_rifle: { n: '穩膛', cat: '收', T: 46, cx: 40, run(c, t) { if (t === 1) { gather(c, 0.62, '255,200,120', 22); aimLine(c, 9, 22, '255,80,60'); }
        if (t === 23) { const p = bullet(c, { m: 2.2, spd: 0.95, range: 9, pierce: 3, lv: 'heavy', big: 1, col: '255,240,200', onHit: (e) => { VX.ring({ x: e.x, y: e.y, r1: 1.1, life: 14, col: '255,200,120' }); VX.smoke({ x: e.x, y: e.y, n: 3, r: 0.18, life: 30 }); } }); G.SC.shake = 5; }
        if (t >= 23 && t <= 28) c.move(-0.04, 0); } },
    rifle_retreat: { n: '退膛', cat: '收', T: 36, cx: 30, inv: 10, run(c, t) { if (t <= 12) c.move(-0.12, 0); if (t === 2) c.ghost(12); if (t === 10) { c.muzzle(true); for (let i = 0; i < 5; i++) c.shoot('pellet', loaded({ m: 0.55, ang: (i - 2) * 0.16, spd: 0.5, range: 3.5, kb: 1 })); casing(c); } } },
    shoulder_guard: { n: '肩架護膛', cat: '架', T: 34, cx: 30, run(c, t) { if (t === 1) VX.glow({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6, r: 0.35, col: '220,220,255', life: 10 }); if (t === 20) mark(c); },
      counter(c, e) { mark(c); bullet(c, { m: 1.5, spd: 0.8, big: 1, lv: 'heavy', pierce: 2 }); } },
    stock_deflect: { n: '托擊', cat: '架', T: 28, cx: 22, run(c, t) { if (t <= 6) c.move(0.05, 0);
        if (t === 6) c.slash({ a0: -1.6, a1: 0.9, r: 0.9, w: 0.28, sq: 0.8, rot: 0.2, sw: 4, life: 12, col: '255,215,150', edge: '255,245,220', shat: 4, m: 1.0, lv: 'mid', kind: 'blunt', kb: 1.6, hr: 1.0, arc: 2 }); } }
  });
  /* ---------------- 和弓 ---------------- */
  MV2.reg('yumi', {
    moving_shot: { n: '移步側射', cat: '起', T: 28, cx: 20, run(c, t) { if (t <= 10) c.move(0, (G.IN.my || 0.6) * 0.07); if (t === 3) c.ghost(10); if (t === 10) arrow(c, { m: 1.0 }); } },
    quick_shot: { n: '速射', cat: '起', T: 26, cx: 19, run(c, t) { if (t === 5 || t === 11) arrow(c, { m: 0.7, ang: (t === 5 ? -0.03 : 0.03) }); } },
    covered_step: { n: '換步藏弓', cat: '起', T: 26, cx: 18, inv: 18, noHit: 1, run(c, t) { if (t === 1) mark(c); if (t <= 12) c.move(-0.12, 0); if (t % 3 === 0 && t < 12) c.ghost(10); } },
    follow_shot: { n: '追射', cat: '連', T: 28, cx: 21, run(c, t) { if (t === 9) { const tg = near(c, 9); arrow(c, { m: 1.25, col: '140,200,255', home: tg, turn: 0.14, trail: 9, pierce: 1 }); } } },
    fan_release: { n: '扇放', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 10) for (let i = -1; i <= 1; i++) arrow(c, { m: 0.75, ang: i * 0.22 }); } },
    spread_shot: { n: '散射', cat: '連', T: 30, cx: 23, run(c, t) { if (t === 8) { for (let i = -2; i <= 2; i++) arrow(c, { m: 0.5, ang: i * 0.2, range: 4, spd: 0.5 }); VX.glow({ x: c.x + c.f * 0.45 * c.hh, y: c.y, z: 0.7, r: 0.5, col: '255,240,200', life: 8 }); } } },
    mark_aim: { n: '標瞄', cat: '連', T: 26, cx: 18, run(c, t) { if (t === 8) { const e = near(c, 9); if (!e) return; mark(c); e.db = e.db || {}; e.db.mark = 20; e.db.markT = 360;
          VX.custom((o, ctx) => { if (e.st === 'dead' || !(e.db && e.db.markT > 0)) { o.t = o.life; return; } const s = S(e.y), k = HH() * s, y = e.y - k * (e.ratio || 1) * 1.15; ctx.save(); ctx.translate(e.x, y); ctx.rotate(o.t * 0.05); ctx.strokeStyle = 'rgba(255,80,70,.9)'; ctx.lineWidth = 2 * s;
            ctx.beginPath(); ctx.arc(0, 0, k * 0.16, 0, 6.283); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.rotate(1.5708); ctx.beginPath(); ctx.moveTo(k * 0.1, 0); ctx.lineTo(k * 0.24, 0); ctx.stroke(); } ctx.restore(); }, 360, 'o'); } } },
    piercing_shot: { n: '穿點離弦', cat: '收', T: 34, cx: 28, run(c, t) { if (t === 12) { arrow(c, { k: 'bigarrow', m: 1.6, pierce: 6, range: 11, spd: 0.55, def: 15, lv: 'mid', col: '255,225,150', onHit: e => VX.ring({ x: e.x, y: e.y, z: 0.5, r1: 0.6, sq: 1, life: 10, col: '255,230,170' }) }); G.SC.shake = 2; } } },
    full_aim: { n: '滿弦', cat: '收', T: 44, cx: 38, run(c, t) { if (t === 1) gather(c, 0.7, '255,230,160', 24); if (t === 25) { arrow(c, { k: 'bigarrow', m: 2.4, pierce: 3, range: 12, spd: 0.7, lv: 'heavy', col: '255,240,190',
          onHit: e => { VX.glow({ x: e.x, y: e.y, z: 0.5, r: 0.8, col: '255,230,160', life: 10 }); VX.ring({ x: e.x, y: e.y, r1: 1.2, life: 14, col: '255,230,170' }); } }); G.SC.shake = 4; c.move(-0.2, 0); } } },
    denial_shot: { n: '壓弦拒進', cat: '收', T: 30, cx: 24, run(c, t) { if (t === 10) arrow(c, { m: 1.0, kb: 2.4, lv: 'mid', onHit: e => VX.ring({ x: e.x, y: e.y, r1: 0.9, life: 12, col: '255,240,210' }) }); } },
    steady_focus: { n: '穩神', cat: '架', T: 30, cx: 22, noHit: 1, run(c, t) { if (t === 2) { mark(c); VX.glyph({ x: c.x, y: c.y, r: 0.8, life: 40, col: '150,210,255' }); } if (t === 16) { H.focus = 2; VX.glow({ x: c.x + c.f * 0.45 * c.hh, y: c.y, z: 0.7, r: 0.4, col: '150,210,255', life: 14 }); } } },
    lower_retreat: { n: '低退', cat: '架', T: 30, cx: 24, inv: 12, noHit: 1, run(c, t) { if (t === 2) { mark(c); const x = c.x, y = c.y; VX.shot({ k: 'arrow', x: H.x, y: H.y, z: HH() * S(y) * 0.9, vx: c.f * 1.5, vy: 0, grav: 0.9, vz: -3, col: '255,240,200', trail: 3,
            onLand: p => { VX.custom((o, ctx) => { const s = S(p.y), k = HH() * s; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-1.2 * Math.sign(c.f)); VX.arrowShape(k * 0.4, k * 0.018, '255,230,160', false); ctx.restore(); }, 26, 'o');
              c.later(20, () => { VX.glow({ x: p.x, y: p.y, z: 0.1, r: 0.8, col: '255,230,160', life: 10 }); VX.ring({ x: p.x, y: p.y, r1: 1.0, life: 14, col: '255,230,170' }); c.hit({ shape: 'circle', x: p.x, y: p.y, r: 0.85, m: 1.0, lv: 'mid', kind: 'arrow' }); }); } }); }
        if (t <= 12) c.move(-0.12, 0); } }
  });
  function near(c, rng) { let b = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.hp <= 0 || e.delay > 0) continue; const dx = (e.x - H.x) * c.f; if (dx < -20) continue; const d = Math.hypot(e.x - H.x, (e.y - H.y) * 1.6); if (d < rng * HH() * S(H.y) && d < bd) { bd = d; b = e; } } return b; }
  MV2.near = near; MV2.mark = mark;
})();
