/* ==========================================================================
 * 神諭之地 重製版 — 38_boss_omagatsuhi.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第十二章頭目「大禍津日神」（第十二章頭目地圖 W_R12_06），P3 原圖（面向右），三形態、兩段血量。
 *           ‧ 血量：第一段（面具→八手）＋第二段真身（＝第一段的 55%）。第一段打完不會死，改為褪殼變真身（清掉護盾、小怪與場上攻擊）。
 *           ‧ 面具形態（第一段 100–40%）：日蝕光束（直線）／禍津雨（主角附近 5 處）／八咫鏡（放鏡子，光束經鏡子折射打人；鏡子打兩下會碎）／
 *             袖風（前方圈＋擊退）／影武者召喚（同時最多 2 隻）／常闇（第一段 70% 以下：全場變暗＋本體 80% 減傷護盾，
 *             點亮場上 4 座火盆就解除，並破綻 3 秒；25 秒沒點完也會自然散去）。
 *           ‧ 八手覺醒（第一段 40% 以下）：多重光束（3 道扇形）／八手火雨（主角周圍 8 處）／巨手拍地（前方圈）／鏡片迴旋（4 片飛出再收回）／
 *             咆哮（周身震退）／禍津雨；無間（第一段 15% 以下）：日蝕連環（兩道光束繞本體轉 120°，先畫方向線 1.2 秒）。
 *           ‧ 真身（第二段）：三段斬（無間多一記返刃：殘影預告 0.6 秒後沿原路回砍）／突刺／躍斬（落點圈）／影步（主角背後出現的落點預告）／
 *             黑日彈（慢速，到點爆開）／架勢（金色 1.5 秒：這時打牠會被反擊，等架勢結束再打）／必殺・天岩戶閉（第二段 50% 以下：6 根暗柱依序落下＋最後本體大圈，之後破綻 3 秒）。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、敵人 kagemusha（影武者）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'omagatsuhi', U = () => A.get('b_omagatsuhi'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const PRE = { maga: '', magax: 'magax_', magaz: 'magaz_' };
  const play = (e, n, l) => play0(e, PRE[e.enc.v.form] + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  function ray(e, ang, L) { return [e.x + Math.cos(ang) * HH() * 0.4, e.y, e.x + Math.cos(ang) * L, e.y + Math.sin(ang) * L / 1.6]; }
  const angTo = (x, y) => Math.atan2((H.y - y) * 1.6, H.x - x);
  /* 光束：預兆 tl → 判定＋畫光 */
  function beamAt(e, m, at, tl, L, w, mul) { if (m.t === at + S(tl)) { e.enc.v.beams.push({ L, w, t: 0, life: 20 }); if (inLane(...L, w * 0.6)) hit(e, mul); } }
  const MV = {
    /* —— 面具形態 —— */
    beam: { go(e, m) { toward(e); play(e, 'beam'); m.L = ray(e, angTo(e.x, e.y), HH() * 7); lane(...m.L, HH() * 0.9, S(0.9), '250,200,90'); },
      step(e, m) { beamAt(e, m, 0, 0.9, m.L, HH() * 0.9, 1.2); return m.t > S(1.4); } },
    rain: { go(e, m) { toward(e); play(e, 'rain'); m.p = [[H.x, H.y]]; for (let i = 0; i < 4; i++) { const a = Math.random() * 6.283, r = HH() * rnd(1.2, 2.6); m.p.push([H.x + Math.cos(a) * r, H.y + Math.sin(a) * r * 0.5]); }
        m.p.forEach(([x, y], i) => circle(x, y, HH() * 0.8, S(0.9) + i * 6, '150,120,200')); },
      step(e, m) { m.p.forEach(([x, y], i) => { if (m.t === S(0.9) + i * 6) { fx(e, N + '_rain', x, y - HH() * 1.0, { s: HH() * 1.0 / 99 }); if (near(x, y, HH() * 0.8)) hit(e, 0.9); } }); return m.t > S(1.6); } },
    mirror: { go(e, m) { toward(e); play(e, 'mirror'); const v = e.enc.v;
        if (!v.mir || v.mir.br) { const a = angTo(e.x, e.y) + (Math.random() < 0.5 ? 1 : -1) * 1.1, p = SC.snap(H.x + Math.cos(a + 3.14) * HH() * 2.6, H.y + Math.sin(a + 3.14) * HH() * 1.2, 'open', 160) || [H.x + HH() * 2, H.y]; v.mir = { x: p[0], y: p[1], hp: 2, br: 0, t: 0 }; }
        const M = v.mir; m.L1 = [e.x, e.y - 2, M.x, M.y]; m.L2 = [M.x, M.y, M.x + (H.x - M.x) * 3, M.y + (H.y - M.y) * 3]; lane(...m.L1, HH() * 0.6, S(1.1), '250,200,90'); lane(...m.L2, HH() * 0.9, S(1.1), '250,200,90'); },
      step(e, m) { const M = e.enc.v.mir; if (!M || M.br) return m.t > S(0.6);
        if (m.t === S(1.1)) { fx(e, N + '_mirror_glint', M.x, M.y - HH() * 0.8, { s: HH() * 1.6 / 256 }); e.enc.v.beams.push({ L: m.L1, w: HH() * 0.6, t: 0, life: 20 }, { L: m.L2, w: HH() * 0.9, t: 0, life: 20 }); if (inLane(...m.L2, HH() * 0.55) || inLane(...m.L1, HH() * 0.4)) hit(e, 1.2); }
        return m.t > S(1.6); } },
    sweep: { go(e, m) { toward(e); play(e, 'idle', true); m.cx = e.x + e.face * HH() * 1.0; circle(m.cx, e.y, HH() * 1.6, S(0.6)); },
      step(e, m) { if (m.t === S(0.6) - S(0.28)) play(e, 'sweep');
        if (m.t === S(0.6)) { fx(e, N + '_sleeve', m.cx, e.y - HH() * 0.5, { s: HH() * 2.4 / 201 }); if (near(m.cx, e.y, HH() * 1.6) && hit(e, 1.0)) knock(e, HH() * 0.9); }
        return m.t > S(1.1); } },
    summon: { go(e, m) { play(e, e.enc.v.form === 'magax' ? 'roar' : 'summon'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.kids = v.kids.filter(k => k.st !== 'dead'); v.waves++;
          for (let i = 0; i < 2 - v.kids.length; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; fx(e, N + '_summon', p[0], p[1], { s: HH() * 1.8 / 193 }); const k = G.spawnOni(p[0], p[1], 30, Math.max(1, e.lv - 4), 'kagemusha'); if (k) v.kids.push(k); } }
        return m.t > S(1.0); } },
    /* 常闇：全場變暗＋護盾；點亮 4 座火盆解除 */
    dark: { go(e, m) { play(e, 'dark'); G.UI.banner('常闇', '點亮四座火盆驅散黑暗！'); const v = e.enc.v; for (const b of v.braz) b.lit = 0; v.dark = { t: 0, life: S(25) }; e.shield = 0.8; fx(e, N + '_transform', e.x, e.y - HH() * 0.7, { s: HH() * 2.4 / 202 }); },
      step(e, m) { return m.t > S(0.8); } },
    /* —— 八手覺醒 —— */
    beam3: { go(e, m) { toward(e); play(e, 'beam'); const a = angTo(e.x, e.y); m.L = [-0.38, 0, 0.38].map(o => ray(e, a + o, HH() * 7)); for (const L of m.L) lane(...L, HH() * 0.8, S(1.0), '250,200,90'); },
      step(e, m) { if (m.t === S(1.0)) { let h = 0; for (const L of m.L) { e.enc.v.beams.push({ L, w: HH() * 0.8, t: 0, life: 20 }); if (inLane(...L, HH() * 0.5)) h = 1; } if (h) hit(e, 1.3); } return m.t > S(1.5); } },
    volley: { go(e, m) { toward(e); play(e, 'volley'); m.p = [[H.x, H.y]]; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; m.p.push([H.x + Math.cos(a) * HH() * 1.7, H.y + Math.sin(a) * HH() * 0.8]); }
        m.p.forEach(([x, y], i) => circle(x, y, HH() * 0.7, S(0.9) + i * 5, '240,110,50')); },
      step(e, m) { m.p.forEach(([x, y], i) => { if (m.t === S(0.9) + i * 5) { fx(e, N + '_fire', x, y - HH() * 0.7, { s: HH() * 0.9 / 143 }); if (!m.hit && near(x, y, HH() * 0.7) && hit(e, 1.0)) m.hit = 1; } }); return m.t > S(1.8); } },
    slam: { go(e, m) { toward(e); play(e, 'idle', true); m.cx = e.x + e.face * HH() * 1.1; circle(m.cx, e.y, HH() * 1.8, S(0.8)); },
      step(e, m) { if (m.t === S(0.8) - S(0.3)) play(e, 'slam');
        if (m.t === S(0.8)) { fx(e, N + '_impact', m.cx, e.y, { s: HH() * 3.2 / 208 }); SC.shake = 7; if (near(m.cx, e.y, HH() * 1.8) && hit(e, 1.4)) knock(e, HH() * 0.8); }
        return m.t > S(1.4); } },
    shard: { go(e, m) { toward(e); play(e, 'shard'); circle(e.x, e.y, HH() * 4, S(0.7), '220,220,255'); m.hit = [0, 0, 0, 0]; },
      step(e, m) { const v = e.enc.v; if (m.t < S(0.7)) return false; const q = (m.t - S(0.7)) / S(2.4); if (q >= 1) { v.shards = null; return m.t > S(3.4); }
        const r = HH() * (0.8 + 3.2 * Math.sin(Math.PI * q)); v.shards = [0, 1, 2, 3].map(i => { const a = i * 1.571 + q * 7; return [e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.45]; });
        v.shards.forEach(([x, y], i) => { if (!m.hit[i] && near(x, y, HH() * 0.5)) { m.hit[i] = 1; hit(e, 0.8); } }); return false; },
      stop(e) { e.enc.v.shards = null; } },
    roar: { go(e, m) { play(e, 'roar'); circle(e.x, e.y, HH() * 2.4, S(0.7)); },
      step(e, m) { if (m.t === S(0.7)) { fx(e, N + '_roar', e.x, e.y - HH() * 0.4, { s: HH() * 4 / 232 }); SC.shake = 6; if (near(e.x, e.y, HH() * 2.4) && hit(e, 0.9)) knock(e, HH() * 1.4); } return m.t > S(1.2); } },
    /* 無間・日蝕連環：方向線 1.2s → 兩道光束繞本體轉 120°（3s），在光裡每 0.5s 受傷 → 破綻 3s */
    eclipse: { go(e, m) { play(e, 'beam'); G.UI.banner('日蝕連環', '看方向線，順著光束轉的方向閃'); m.a0 = angTo(e.x, e.y) + 1.2; m.dir = Math.random() < 0.5 ? 1 : -1; m.cd = 0;
        e.enc.v.ecl = { x: e.x, y: e.y, a: m.a0, dir: m.dir, warn: 1, t: 0 }; },
      step(e, m) { const v = e.enc.v, E = v.ecl; if (!E) return true; E.t = m.t;
        if (m.t === S(1.2)) E.warn = 0;
        if (m.t > S(1.2) && m.t <= S(4.2)) { E.a = m.a0 + m.dir * 2.094 * (m.t - S(1.2)) / S(3); if (--m.cd <= 0) for (const o of [0, Math.PI]) { if (inLane(...ray(e, E.a + o, HH() * 7), HH() * 0.5)) { hit(e, 0.8); m.cd = 30; break; } } }
        if (m.t === S(4.2)) { v.ecl = null; play(e, 'idle', true); e.open = S(3); }
        return m.t > S(4.4); },
      stop(e) { e.enc.v.ecl = null; } },
    /* —— 真身 —— */
    combo: { go(e, m) { toward(e); m.i = 0; m.t0 = 0; m.ret = e.enc.diff >= 3; m.arcs = []; arc(e, m); },
      step(e, m) { const k = m.t - m.t0;
        if (m.i < 3 && k === S(0.45) - S(0.28)) play(e, 'slash' + (m.i + 1));
        if (m.i < 3 && k === S(0.45)) { fx(e, N + '_slash', m.cx, e.y - HH() * 0.6, { s: HH() * 2.0 / 210, nat: 1 }); if (near(m.cx, e.y, HH() * 1.35)) hit(e, m.i === 2 ? 1.3 : 0.9); m.arcs.push([m.cx, e.y]); }
        if (m.i < 3 && k === S(0.45) + S(0.15)) { if (++m.i < 3) { m.t0 = m.t; arc(e, m); } else { m.t0 = m.t; m.i = 9; if (m.ret) { e.enc.v.ghost = { x: e.x, y: e.y, face: e.face, t: 0 }; for (const [x, y] of m.arcs) circle(x, y, HH() * 1.35, S(0.6), '250,210,90'); } } }
        if (m.i === 9) { const k = m.t - m.t0; if (m.ret && k === S(0.6)) { e.enc.v.ghost = null; play(e, 'slash3'); let h = 0; for (const [x, y] of m.arcs) { fx(e, N + '_slash', x, y - HH() * 0.6, { s: HH() * 2.0 / 210 }); if (near(x, y, HH() * 1.35)) h = 1; } if (h) hit(e, 1.2); }
          if (k === (m.ret ? S(0.75) : 1)) play(e, 'recover'); return k > (m.ret ? S(1.4) : S(0.7)); }
        return false; },
      stop(e) { e.enc.v.ghost = null; } },
    thrust: { go(e, m) { toward(e); play(e, 'stance'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d; m.x0 = e.x; m.y0 = e.y;
        m.end = dashEnd(e.x, e.y, m.dx, m.dy * 0.7, HH() * 3.2); m.L = [e.x, e.y, e.x + m.dx * HH() * 4, e.y + m.dy * HH() * 4 * 0.7]; lane(...m.L, HH() * 0.9, S(0.6)); },
      step(e, m) { if (m.t === S(0.6) - S(0.14)) play(e, 'thrust');
        if (m.t > S(0.6) && m.t <= S(0.8)) { const q = (m.t - S(0.6)) / S(0.2); e.x = m.x0 + (m.end[0] - m.x0) * q; e.y = m.y0 + (m.end[1] - m.y0) * q; }
        if (m.t === S(0.7)) { fx(e, N + '_slash', e.x + e.face * HH() * 0.8, e.y - HH() * 0.6, { s: HH() * 1.8 / 210 }); if (inLane(...m.L, HH() * 0.55)) hit(e, 1.2); }
        return m.t > S(1.4); } },
    leap: { go(e, m) { toward(e); play(e, 'leap'); m.x0 = e.x; m.y0 = e.y; const p = SC.snap(H.x, H.y, 'walk', 120) || [H.x, H.y]; m.tx = p[0]; m.ty = p[1]; circle(m.tx, m.ty, HH() * 1.3, S(0.8)); },
      step(e, m) { if (m.t <= S(0.8)) { const q = m.t / S(0.8); e.x = m.x0 + (m.tx - m.x0) * q; e.y = m.y0 + (m.ty - m.y0) * q; e.lift = Math.sin(q * Math.PI) * HH() * 1.4; }
        if (m.t === S(0.8)) { e.lift = 0; fx(e, N + '_impact', e.x, e.y, { s: HH() * 2.8 / 208 }); SC.shake = 6; if (near(e.x, e.y, HH() * 1.3)) hit(e, 1.3); play(e, 'recover'); }
        return m.t > S(1.5); },
      stop(e) { e.lift = 0; } },
    blink: { go(e, m) { play(e, 'blink'); const s = sgn(H.x - e.x) || 1, p = SC.snap(H.x + s * HH() * 1.2, H.y, 'walk', 120) || [H.x - s * HH() * 1.2, H.y]; m.tx = p[0]; m.ty = p[1];
        fx(e, N + '_summon', m.tx, m.ty, { s: HH() * 1.6 / 193 }); circle(m.tx - s * HH() * 0.9, m.ty, HH() * 1.2, S(0.75)); m.s = s; },
      step(e, m) { if (m.t === S(0.3)) { e.hide = 1; }
        if (m.t === S(0.55)) { e.hide = 0; e.x = m.tx; e.y = m.ty; e.face = -m.s; play(e, 'slash2'); }
        if (m.t === S(0.75)) { const cx = m.tx - m.s * HH() * 0.9; fx(e, N + '_slash', cx, e.y - HH() * 0.6, { s: HH() * 2.0 / 210 }); if (near(cx, e.y, HH() * 1.2)) hit(e, 1.1); }
        return m.t > S(1.3); },
      stop(e) { e.hide = 0; } },
    orb: { go(e, m) { toward(e); play(e, 'orb'); },
      step(e, m) { if (m.t === S(0.45)) { const tx = H.x, ty = H.y; circle(tx, ty, HH() * 1.4, S(1.4), '120,60,160'); e.enc.v.orbs.push({ x: e.x + e.face * HH() * 0.5, y: e.y - HH() * 0.6, sx: e.x + e.face * HH() * 0.5, sy: e.y - HH() * 0.6, tx, ty, t: 0, life: S(1.4), e }); }
        return m.t > S(1.0); } },
    stance: { go(e, m) { play(e, 'stance'); e.guard = 1; G.UI.toast('架勢——別出手！'); },
      step(e, m) { if (m.cnt && !m.done) { m.done = 1; m.t1 = m.t; e.guard = 0; toward(e); play(e, 'slash3'); circle(e.x, e.y, HH() * 1.8, S(0.25), '250,210,90'); }
        if (m.done && m.t === m.t1 + S(0.25)) { fx(e, N + '_slash', e.x + e.face * HH() * 0.6, e.y - HH() * 0.6, { s: HH() * 2.6 / 210 }); if (near(e.x, e.y, HH() * 1.8)) hit(e, 1.3); }
        if (!m.done && m.t >= S(1.5)) { e.guard = 0; play(e, 'recover'); e.open = S(1.2); return true; }
        return m.done && m.t > m.t1 + S(0.8); },
      stop(e) { e.guard = 0; } },
    ult: { go(e, m) { play(e, 'ultimate'); G.UI.banner('必殺・天岩戶閉', '暗柱接連落下——最後遠離本體'); m.p = [];
        for (let i = 0; i < 6; i++) m.p.push(null); m.i = 0; },
      step(e, m) { for (let i = 0; i < 6; i++) { const t0 = S(0.5 + i * 0.45); if (m.t === t0) { m.p[i] = [H.x, H.y]; circle(H.x, H.y, HH() * 0.9, S(0.75), '110,70,150'); }
          if (m.t === t0 + S(0.75)) { const [x, y] = m.p[i]; fx(e, N + '_pillar', x, y - HH() * 0.8, { s: HH() * 1.4 / 161 }); if (near(x, y, HH() * 0.9)) hit(e, 1.0); } }
        const tb = S(0.5 + 5 * 0.45) + S(0.75); if (m.t === tb) circle(e.x, e.y, HH() * 3, S(1.0), '110,70,150');
        if (m.t === tb + S(1.0)) { fx(e, N + '_transform', e.x, e.y - HH() * 0.5, { s: HH() * 5 / 202 }); SC.shake = 9; if (near(e.x, e.y, HH() * 3)) hit(e, 2.0); play(e, 'recover'); e.open = S(3); }
        return m.t > tb + S(1.3); } }
  };
  function arc(e, m) { toward(e); m.cx = e.x + e.face * HH() * 1.0; circle(m.cx, e.y, HH() * 1.35, S(0.45), m.ret ? '250,210,90' : undefined); }

  /* 形態切換 */
  function morph(e, to) { const enc = e.enc, v = enc.v; if (e.mv) end(e); v.form = to; e.inv = S(2); enc.cd = S(2.2);
    v.dark = null; e.shield = 0; v.shards = null; v.ecl = null; v.orbs = []; v.beams = []; v.ghost = null; B.tg.length = 0;
    if (to === 'magax') { play0(e, 'awaken'); fx(e, N + '_transform', e.x, e.y - HH() * 0.7, { s: HH() * 3 / 202 }); G.UI.banner('八手覺醒', '大禍津日神'); }
    else { for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.mir = null; play0(e, 'magax_shed'); v.frag = { x: e.x, y: e.y, t: 0 }; fx(e, N + '_transform', e.x, e.y - HH() * 0.7, { s: HH() * 3.5 / 202 }); G.UI.banner('大禍津日神・真身', '第二段'); } }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (e.an === 'hurt' && v.form !== 'maga') play(e, 'hurt');
    if (v.frag) { if (++v.frag.t > 90) v.frag = null; }
    for (const b of v.beams) b.t++; v.beams = v.beams.filter(b => b.t < b.life);
    for (const o of v.orbs) { o.t++; const q = Math.min(1, o.t / o.life); o.x = o.sx + (o.tx - o.sx) * q; o.y = o.sy + (o.ty - o.sy) * q;
      if (o.t === o.life) { fx(e, N + '_dark_orb', o.tx, o.ty - HH() * 0.4, { s: HH() * 2.6 / 181 }); if (near(o.tx, o.ty, HH() * 1.4)) hit(e, 1.2); } }
    v.orbs = v.orbs.filter(o => o.t < o.life);
    if (v.mir) v.mir.t++;
    // 主角出手：打鏡子、點火盆
    if (H.act && H.act !== v.lastAct && /atk|skill|ult/.test(H.act.kind)) { v.lastAct = H.act; const hx = H.x + H.face * HH() * 0.4;
      if (v.mir && !v.mir.br && Math.hypot(hx - v.mir.x, (H.y - v.mir.y) * 1.6) < HH() * 0.9 && --v.mir.hp <= 0) { v.mir.br = 1; v.mir.t = 0; G.UI.toast('八咫鏡碎了'); }
      if (v.dark) for (const b of v.braz) if (!b.lit && Math.hypot(hx - b.x, (H.y - b.y) * 1.6) < HH() * 0.9) { b.lit = 1; fx(e, N + '_fire', b.x, b.y - HH() * 1.1, { s: HH() * 0.8 / 143 }); G.UI.toast('火盆 ' + v.braz.filter(x => x.lit).length + '/4'); } }
    if (!H.act) v.lastAct = null;
    if (v.mir && v.mir.br && v.mir.t > 120) v.mir = null;
    if (v.dark) { v.dark.t++; const all = v.braz.every(b => b.lit);
      if (all || v.dark.t > v.dark.life) { v.dark = null; e.shield = 0; if (all) { e.open = S(3); if (e.mv) end(e); play(e, 'hurt'); G.UI.banner('常闇散去', '大禍津日神露出破綻！'); } } }
    // 形態／階段
    const f1 = (e.hp - v.H2) / (e.hpMax - v.H2), f2 = e.hp / v.H2;
    if (v.form !== 'magaz' && e.hp <= v.H2) { e.hp = v.H2; morph(e, 'magaz'); v.ph = 5; return; }
    if (v.form === 'maga' && f1 < 0.4) { morph(e, 'magax'); v.ph = 3; return; }
    const ph = v.form === 'magaz' ? 5 : enc.diff >= 3 && f1 < 0.15 ? 4 : f1 < 0.4 ? 3 : f1 < 0.7 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; if (ph === 2) { v.cd.dark = 0; G.UI.toast('大禍津日神　黑日將臨'); } if (ph === 4) { v.cd.eclipse = S(1.5); G.UI.toast('日蝕連環'); } enc.cd = S(1.2); }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { const id = PRE[v.form] + 'idle'; if (e.an !== id && !/hurt|recover/.test(e.an)) play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 2.4); let k, L;
    if (v.form === 'maga') {
      if (v.ph >= 2 && !v.dark && !(v.cd.dark > 0)) { k = 'dark'; v.cd.dark = S(32); }
      else { L = nr ? ['sweep', 'sweep', 'beam', 'rain', 'mirror'] : ['beam', 'beam', 'rain', 'mirror']; if (!(v.cd.summon > 0) && v.waves < 3 && v.kids.filter(x => x.st !== 'dead').length < 2) L.push('summon'); }
    } else if (v.form === 'magax') {
      if (v.ph >= 4 && !(v.cd.eclipse > 0)) { k = 'eclipse'; v.cd.eclipse = S(20); }
      else L = nr ? ['slam', 'slam', 'roar', 'shard', 'volley', 'beam3'] : ['beam3', 'beam3', 'volley', 'shard', 'rain'];
    } else {
      if (f2 < 0.5 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(24); }
      else { L = nr ? ['combo', 'combo', 'thrust', 'blink', 'stance'] : ['thrust', 'leap', 'leap', 'blink', 'orb']; if (!(v.cd.stance > 0)) {} else L = L.filter(x => x !== 'stance'); }
    }
    if (!k) { k = L[Math.floor(Math.random() * L.length)]; if (k === 'summon') v.cd.summon = S(18); if (k === 'stance') v.cd.stance = S(10); }
    begin(e, k); enc.cd = S(v.form === 'magaz' ? rnd(0.5, 0.9) : v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const v = e.enc.v, d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * (v.form === 'magaz' ? 1.8 : 2.6), mv = v.form === 'magaz' ? 'walk' : 'float', id = PRE[v.form] + 'idle';
    if (d > want) { if (e.an !== PRE[v.form] + mv) play(e, mv, true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, v.form === 'magaz' ? 2.2 : 1.6); }
    else if (e.an !== id) play(e, 'idle', true); if (e.an === id) toward(e); }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    for (const b of v.braz) A.draw(u, u.act[N + (b.lit ? '_brazier_lit' : '_brazier_unlit')].f[0], b.x, b.y, HH() * 1.1 / 252, false, 1);
    if (v.dark) for (const b of v.braz) if (!b.lit) { ctx.save(); ctx.strokeStyle = `rgba(255,190,90,${0.5 + 0.4 * Math.sin(v.t * 0.25)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b.x, b.y, HH() * 0.6, HH() * 0.24, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
    if (v.mir) A.draw(u, u.act[N + (v.mir.br ? '_mirror_broken' : '_mirror')].f[0], v.mir.x, v.mir.y, HH() * 1.3 / 256, false, v.mir.br ? Math.max(0, 1 - v.mir.t / 120) : 1);
    if (v.frag) A.draw(u, u.act[N + '_mask_fragments'].f[0], v.frag.x + 30, v.frag.y, HH() * 0.9 / 256, false, Math.max(0, 1 - v.frag.t / 90));
    const E = v.ecl; if (E) { ctx.save(); const e = R(enc);
      for (const o of [0, Math.PI]) { const L = ray(e, E.a + o, HH() * 7); if (E.warn) { ctx.strokeStyle = 'rgba(250,200,90,.7)'; ctx.setLineDash([12, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(L[2], L[3]); ctx.stroke();
          const a2 = E.a + o + E.dir * 0.5, L2 = ray(e, a2, HH() * 5); ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(L2[2], L2[3]); ctx.stroke(); } }
      ctx.restore(); } }
  function drawBeam(u, L, w, a) { const fr = u.act[N + '_beam'].f[2], len = Math.hypot(L[2] - L[0], L[3] - L[1]); ctx.save(); ctx.globalAlpha = a; ctx.translate(L[0], L[1] - HH() * 0.6); ctx.rotate(Math.atan2(L[3] - L[1], L[2] - L[0])); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], 0, -w * 0.6, len, w * 1.2); ctx.restore(); }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const b of v.beams) drawBeam(u, b.L, b.w, 1 - b.t / b.life);
    if (v.ecl && !v.ecl.warn) for (const o of [0, Math.PI]) drawBeam(u, ray(e, v.ecl.a + o, HH() * 7), HH() * 0.9, 0.9);
    if (v.shards) { const f = u.act[N + '_shard'].f[0]; for (const [x, y] of v.shards) A.draw(u, f, x, y - HH() * 0.4, HH() * 0.6 / 256, false, 1); }
    const of = u.act[N + '_dark_orb']; for (const o of v.orbs) A.draw(u, A.frameAt(Object.assign({}, of, { loop: true }), o.t * TK), o.x, o.y + HH() * 0.3, HH() * 0.9 / 181, false, 1);
    if (v.ghost) { const fr = B.api.frameOf(e, 'magaz_slash3', 400, false); if (fr) A.draw(u, fr, v.ghost.x, v.ghost.y, B.api.sc(e), B.api.flip(v.ghost.face, 1), 0.35); }
    if (e.guard) { ctx.save(); ctx.strokeStyle = `rgba(255,215,100,${0.6 + 0.3 * Math.sin(v.t * 0.5)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 0.8, HH() * 0.3, 0, 0, 6.283); ctx.stroke(); ctx.restore(); G.txt('架勢', e.x, e.y - HH() * e.size * 1.2, 12, '#ffd76a', 'center'); }
    if (v.dark) { const g = ctx.createRadialGradient(H.x, H.y - HH() * 0.5, HH() * 1.6, H.x, H.y - HH() * 0.5, HH() * 4.2); g.addColorStop(0, 'rgba(5,0,10,0)'); g.addColorStop(1, 'rgba(5,0,10,0.82)');
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(H.x - 1600, H.y - 900, 3200, 1800); ctx.restore();
      for (const b of v.braz) { if (b.lit) A.draw(u, u.act[N + '_brazier_lit'].f[0], b.x, b.y, HH() * 1.1 / 252, false, 1); else { ctx.save(); ctx.strokeStyle = 'rgba(255,190,90,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, b.y, HH() * 0.6, HH() * 0.24, 0, 0, 6.283); ctx.stroke(); ctx.restore(); } } }
    if (e.shield > 0 && e.st !== 'dead') G.txt('護盾', e.x, e.y - HH() * e.size * 1.3, 11, '#b090ff', 'center');
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('omagatsuhi', { name: '大禍津日神', sub: '禍津日之神', unit: 'b_omagatsuhi', foes: ['kagemusha'], hpK: 18.6, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R12_06'],
    actors: [{ id: N, name: '大禍津日神', size: 1.4, moves: [] }], mv: MV, director, drawUnder, drawOver, drawSelf: e => !!e.hide,
    init(enc) { const e = R(enc); const v = enc.v = { ph: 1, form: 'maga', H2: e.hpMax * 0.55 / 1.55, cd: { summon: S(6) }, braz: [], beams: [], orbs: [], kids: [], mir: null, dark: null, shards: null, ecl: null, ghost: null, frag: null, waves: 0, t: 0 };
      const cx = e.x - HH() * 1.4, cy = e.y;
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785, p = SC.snap(cx + Math.cos(a) * HH() * 3.8, cy + Math.sin(a) * HH() * 1.8, 'open', 160) || SC.randSpot('open', null, v.braz.map(b => [b.x, b.y]), HH() * 2.4); if (p) v.braz.push({ x: p[0], y: p[1], lit: 1 }); }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.dark = null; v.orbs = []; v.beams = []; v.shards = null; v.ecl = null; v.ghost = null; },
    preDamage(e) { if (e.hide) return true; const v = e.enc.v;
      if (e.guard && e.mv && e.mv.k === 'stance') { e.mv.cnt = 1; e.guard = 0; G.UI.toast('被看穿了——反擊！'); return true; }
      if (v.form !== 'magaz') { e.hp += 1e9; v.buf = 1; } return false; },   // 第一段不會被打死：先墊高，受傷後扣回，由 director 轉真身
    onDamage(e) { const v = e.enc.v; if (v.buf) { v.buf = 0; e.hp -= 1e9; }
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
