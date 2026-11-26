/* ==========================================================================
 * 神諭之地 重製版 — 82_ult.js
 * Version : r3.88.0  (2026-11-25)　r3.88.0：百連發 Lv5 最後一斉射擊拿掉橫向光束與白閃（保留齊射槍火、震動、直線傷害）
 * 舊版    : r3.37.0  (2026-11-17)　r3.37.0：槍火、光柱、法陣、爆炸改第二代素材；r3.36.0：龍牙改回光龍（84 glowDragon，不填色不描邊、加龍尾／四爪／鱗光），主角只衝 4 身高、龍自己飛；百連發改鐵砲隊幻影輪流齊射；天穹萬矢改素材箭＋光法陣，Lv5 每箭光柱
 * 舊版    : r3.35.0、r3.34.0
 * 變更    : r3.34.0 新增。奧義重做（規格 VFX_SPEC v2.1 第一節品質標準）：槍「龍牙」、鐵砲「百連發」、和弓「天穹萬矢」。
 *           取代原本 ChatGPT 序列圖特效；傷害倍率沿用技能表（W.mult），各段 m 為相對倍率。進化／極意：Lv3 起強化、Lv5 收尾爆發。
 * 依賴    : 76_vfx、77_moves（MV2.U、begin）、81_hiden（MV2.fall／intro／ghostAt）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, W = G.WPN, HH = () => G.HERO_H, S = y => SC.depth(y); if (!MV2 || !VX) return;
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), big = (c, o) => c.hit(Object.assign({ lv: 'hiden' }, o));
  /* ---------- 槍・龍牙：主角突進 4 身高，金色光龍從槍尖竄出、往前飛 6 身高（Lv3 起 7；波浪路徑），龍頭掃過的敵人各中一次，終點炸開後龍往上盤旋消失 ---------- */
  const ryuga = { n: '龍牙', T: 60, run(c, t) { const m = c.a.mvx, k = c.hh, lv = m.lv || 1;
      if (t === 1) { MV2.intro(c, '255,210,120', 60); m.skip = []; const x0 = c.x + c.f * 0.9 * k, y0 = c.y, f = c.f, D = lv >= 3 ? 7 : 6, T0 = 6, T1 = 32;
        m.head = tt => { if (tt <= T0) return [x0 - f * (T0 - tt) * 0.12 * k, y0, (0.3 + (T0 - tt) * 0.02) * k];   // 從槍尖竄出（龍身先藏在主角身後）
          if (tt <= T1) { const u = (tt - T0) / (T1 - T0), e = 1 - (1 - u) * (1 - u); return [x0 + f * D * e * k, y0 + Math.sin(u * 6) * 0.3 * k, (0.95 + Math.sin(u * 8) * 0.7) * k]; }
          const v = tt - T1; return [x0 + f * D * k + f * Math.sin(v * 0.25) * 0.8 * k, y0, (0.75 + v * 0.32) * k]; };   // 終點後往上盤旋
        MV2.dragon(m.head, { life: 54, len: 16, w: 0.5, pal: 'gold', fade: 40, step: (o, tt) => { if (tt < T0 || tt > T1) return; const p = m.head(tt);
            const hs = big(c, { shape: 'circle', x: p[0], y: p[1], r: 1.1, m: 2.2, kind: 'pierce', lv: 'heavy', skip: m.skip, col: '255,210,120' }); for (const e of hs) { m.skip.push(e); VX.spark({ x: e.x, y: e.y, z: 0.5 * k, n: 8, spd: 5, col: '255,220,150' }); } } });
        m.end = [x0 + f * D * k, y0]; }
      if (t >= 6 && t < 18) { c.move(0.34, 0); H.inv = Math.max(H.inv, 16); if (t % 3 === 0) MV2.ghostAt(H.x, H.y, H.face, 12); }
      if (t === 6) c.thrust({ len: 1.6, w: 0.3, cy: 0.55, ext: 3, life: 12, col: '255,215,130', edge: '255,255,255', tip: '255,240,200' });
      if (t === 33) { const [x, y] = m.end; VX.pillar({ x, y, h: 4, w: 1.6, big: 1, life: 24 }); VX.sigil({ x, y, r: 1.8, big: 1, life: 30 }); VX.crack({ x, y, r: 1.5 }); VX.ring({ x, y, r1: 2.4, life: 20, col: '255,225,160', lw: 0.12 });
        big(c, { shape: 'circle', x, y, r: lv >= 3 ? 2.0 : 1.6, m: lv >= 5 ? 3.4 : 2.6, kind: 'blunt', kb: 2 }); VX.flash(2); G.SC.shake = 8; } } };
  /* ---------- 鐵砲・百連發：鐵砲隊幻影排成一列（6 人／Lv3 起 8 人），由前到後輪流齊射（釣瓶撃ち）2 輪（Lv3 起 3 輪），硝煙越疊越濃；Lv5 最後全隊一斉射擊 ---------- */
  const hyaku = { n: '百連發', T: 150, run(c, t) { const m = c.a.mvx, lv = m.lv || 1, k = c.hh, n = lv >= 3 ? 8 : 6, R = lv >= 3 ? 3 : 2, T0 = 26, GAP = 30, END = T0 + R * GAP;
      c.a.T = END + (lv >= 5 ? 26 : 10);
      if (!m.g) { MV2.intro(c, '255,170,80', c.a.T); m.g = []; const per = n / 2; for (let i = 0; i < n; i++) { const rank = i < per ? 0 : 1, j = i % per; m.g.push({ x: c.x - c.f * (0.75 + rank * 0.7 + (j % 2) * 0.12) * k, y: c.y + (j - (per - 1) / 2) * 0.55 * k + rank * 0.25 * k, i }); } }   // 兩列橫隊排在主角身後
      if (t === 8) { m.fr = G.heroFrame && G.heroFrame(); m.u = W.unit && W.unit(); m.g.forEach((g, i) => phantom(c, g, 8 + i * 2, END + 8 - (8 + i * 2), m)); }
      for (let r = 0; r < R; r++) { const t0 = T0 + r * GAP; if (t === t0) { c.muzzle(true, 0); c.shoot('bullet', { m: 0.5, spd: 0.85, range: 9, lv: 'heavy', col: '255,210,120' }); G.SC.shake = 4; }
        m.g.forEach((g, i) => { if (t === t0 + 2 + i * 2) volley(c, g, lv >= 3 ? 0.6 : 0.5); }); }
      if (t % 10 === 0 && t > T0 && t < END) VX.smoke({ x: c.x + c.f * 1.0 * k, y: c.y + rnd(-0.6, 0.6) * k, z: 0.55 * k, n: 2, vx: c.f * 0.3, r: 0.3, life: 80, a: 0.3, col: '150,142,135' });
      if (lv >= 5 && t === END + 8) { c.muzzle(true, 0); m.g.forEach(g => volley(c, g, 0, 1)); G.SC.shake = 9;   // r3.88.0：拿掉最後的橫向光束與白閃
        big(c, { shape: 'line', x: c.x, y: c.y, len: 10, w: 2.6, m: 2.5, kind: 'shot', kb: 2.5 }); } } };
  /* 幻影鐵砲手：主角的瞄準姿勢（半透明＋橘光），到時淡出 */
  function phantom(c, g, t0, life, m) { const f = c.f; VX.glow({ x: g.x, y: g.y, z: 0.6, r: 0.5, col: '255,170,80', life: 10 });
    VX.custom((o, ctx) => { const u = m.u, fr = m.fr; if (!u || !fr) return; const s = S(g.y), a = Math.min(1, o.t / 6) * Math.min(1, (o.life - o.t) / 10), sc = HH() * s / ((u.refH) || 130) * W.actK(c.a.name);
      ctx.save(); const eg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 0.5 * HH() * s); eg.addColorStop(0, 'rgba(255,150,60,' + 0.35 * a + ')'); eg.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(g.x, g.y, 0.5 * HH() * s, 0.16 * HH() * s, 0, 0, TAU); ctx.fill();
      G.ANIM.draw(u, fr, g.x, g.y, sc, f < 0, 0.62 * a); ctx.globalCompositeOperation = 'lighter'; G.ANIM.draw(u, fr, g.x, g.y, sc, f < 0, 0.18 * a); ctx.restore(); }, life, 'o'); }
  function volley(c, g, m, quiet) { const k = HH() * S(g.y), x = g.x + c.f * 0.95 * k;
    VX.spr({ n: 'fx_tier_teppo_master', x: x + c.f * 0.35 * k, y: g.y, z: 0.6, w: 1.1, flip: c.f < 0, life: 14 }); if (!quiet) VX.smoke({ x, y: g.y, z: 0.6 * k, n: 2, vx: c.f * 0.6, r: 0.16, life: 60, a: 0.35 });
    if (m) VX.shot({ k: 'bullet', x, y: g.y, z: 0.6 * k, vx: c.f * 0.85 * k, vy: 0, range: 9 * k, col: '255,200,110', onHit: e => { G.damageOni(e, m * c.mul, true); VX.impact(e, 'heavy', 'shot'); G.WPN.gainProf(1); } }); }
  /* ---------- 和弓・天穹萬矢：射箭上天 → 目標地面展開光法陣 → 4 秒箭雨（素材箭斜落插地）；Lv5：每一箭都是光柱 ---------- */
  const tenkyu = { n: '天穹萬矢', T: 250, run(c, t) { const m = c.a.mvx, lv = m.lv || 1, k = c.hh;
      if (t === 1) { MV2.intro(c, '255,225,150', 250); const e = MV2.near(c, 8); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; }
      if (t === 6) { c.muzzle(); c.shoot('bigarrow', { m: 0, ang: -1.3, spd: 0.9, range: 6, trail: 10, col: '255,230,160' }); }
      if (t === 14) { const [px, py] = m.p; VX.sigil({ x: px, y: py, r: 3.2, big: 1, life: 236, a: 0.38 }); VX.sigil({ x: px, y: py, r: 1.4, kind: 'raiden', life: 236, a: 0.3 });
        VX.custom((o, ctx) => { const a = Math.sin(Math.min(1, o.t / o.life) * 3.14); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height * 0.5); g.addColorStop(0, 'rgba(255,215,140,' + 0.35 * a + ')'); g.addColorStop(1, 'rgba(255,215,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height * 0.5); ctx.restore(); }, 230, 'o'); }
      const n = lv >= 3 ? 36 : 24, T0 = 24, T1 = 240, gap = Math.max(2, Math.floor((T1 - T0) / n));
      if (t >= T0 && t < T1 && (t - T0) % gap === 0) { const [px, py] = m.p, es = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - px, (e.y - py) * 1.6) < 3.2 * k), e = es.length && Math.random() < 0.65 ? es[Math.floor(Math.random() * es.length)] : null;
        const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 3 * k, [x, y] = e ? [e.x + rnd(-0.25, 0.25) * k, e.y] : [px + Math.cos(a) * r, py + Math.sin(a) * r * 0.4];
        if (SC.walkable(x, y)) MV2.fallArrow(c, x, y, { col: '255,230,160', h: rnd(4.5, 6), dx: -c.f * rnd(0.6, 1.1), life: 12, r: 0.75, m: lv >= 5 ? 0.6 : 0.5, pillar: lv >= 5 }); } } };
  MV2.U.yari = { ultimate_ryuga: ryuga }; MV2.U.teppo = { ultimate_hyakuren: hyaku }; MV2.U.yumi = { ultimate_tenkyu: tenkyu };
})();
