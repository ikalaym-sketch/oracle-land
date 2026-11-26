/* ==========================================================================
 * 神諭之地 重製版 — 36_boss_watatsumi.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第十章頭目「綿津見大神」（第十章頭目地圖 W_R10_07），P3 原圖（面向右）。
 *           ‧ 場上三座高台：漲潮、大海嘯時站在高台上就安全；渦潮進不了高台。
 *           ‧ 招式：三叉戟突刺（直線突進）／龍尾橫掃（周身圈）／水柱（追主角落 3 根）／渦潮（緩慢追人、吸人；二階困難以上 2 個）／
 *                   漲潮（二階：2 秒預警後淹水 4 秒，不在高台＝減速＋持續傷害）／海蛇召喚（二階，同時最多 2 隻）／
 *                   水龍彈（二階、地獄以上：3 發追蹤彈）／必殺・大海嘯（三階：3 秒預警，海嘯橫掃全場，只有高台安全；之後破綻 2.5 秒）／
 *                   無間・海神之怒・三潮換位（四階：三波，每波標記一座高台 2 秒後水柱轟下，同時漲潮；要換到另外兩座之一。三波全躲＝破綻 5 秒，否則 3 秒）。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、敵人 mizuchi（海蛇）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, TK, HH } = B.api;
  const N = 'watatsumi', U = () => A.get('b_watatsumi'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const onPlat = v => v.plats.find(p => near(p.x, p.y, p.r));
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  const MV = {
    /* 三叉戟突刺：預兆 0.7s（直線 4 身）→ 突進 0.2s（判定）→ 收招 0.6s */
    thrust: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'idle', true); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d;
        m.end = dashEnd(e.x, e.y, m.dx, m.dy * 0.7, HH() * 2.6); m.x0 = e.x; m.y0 = e.y; m.L = [e.x, e.y, e.x + m.dx * HH() * 4, e.y + m.dy * HH() * 4 * 0.7]; lane(...m.L, HH() * 1.0, S(0.7)); },
      step(e, m) { if (m.t === S(0.7) - S(0.39)) play(e, 'thrust');
        if (m.t > S(0.7) && m.t <= S(0.9)) { const q = (m.t - S(0.7)) / S(0.2); e.x = m.x0 + (m.end[0] - m.x0) * q; e.y = m.y0 + (m.end[1] - m.y0) * q; }
        if (m.t === S(0.8)) { fx(e, N + '_thrust_wake', e.x + e.face * HH() * 0.8, e.y - HH() * 0.5, { s: HH() * 2.2 / 207 }); if (inLane(...m.L, HH() * 0.6)) hit(e, 1.2); }
        return m.t > S(0.9) + S(0.6); } },
    /* 龍尾橫掃：預兆 0.6s（周身圈）→ 掃（判定＋擊退）→ 收招 0.6s */
    sweep: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'idle', true); circle(e.x, e.y, HH() * 2.3, S(0.6)); },
      step(e, m) { if (m.t === S(0.6) - S(0.39)) play(e, 'sweep');
        if (m.t === S(0.6)) { fx(e, N + '_tail_wave', e.x + e.face * HH() * 0.6, e.y, { s: HH() * 2.6 / 256 }); if (near(e.x, e.y, HH() * 2.3) && hit(e, 1.1)) knock(e, HH() * 0.7); }
        return m.t > S(1.2); } },
    /* 水柱：每 0.5s 在主角位置標一根（預兆 0.9s）→ 共 3 根 */
    pillars: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'tide'); m.p = []; },
      step(e, m) { for (let i = 0; i < 3; i++) { if (m.t === S(0.2 + i * 0.5)) { m.p[i] = [H.x, H.y]; circle(H.x, H.y, HH() * 0.9, S(0.9), '80,160,230'); }
          if (m.t === S(1.1 + i * 0.5)) { const [x, y] = m.p[i]; fx(e, N + '_pillar', x, y, { s: HH() * 1.6 / 256 }); if (near(x, y, HH() * 0.9)) hit(e, 1.1); } }
        return m.t > S(2.4); } },
    /* 渦潮：放出渦潮（二階困難以上 2 個）→ 5s 緩慢追人、吸人、每 0.5s 傷害；進不了高台 */
    whirl: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'whirl'); },
      step(e, m) { if (m.t === S(0.45)) { const v = e.enc.v, n = v.ph >= 2 && e.enc.diff >= 1 ? 2 : 1;
          for (let i = 0; i < n; i++) { const x = (e.x + H.x) / 2 + (i ? 1 : n > 1 ? -1 : 0) * HH() * 1.4, y = (e.y + H.y) / 2 + (i ? 30 : n > 1 ? -30 : 0); v.whirls.push({ x, y, r: HH() * 1.1, t: 0, life: S(5) }); } }
        return m.t > S(1.0); } },
    /* 漲潮（二階）：2s 預警（水位上升）→ 淹水 4s */
    flood: { go(e, m) { play(e, 'tide'); G.UI.toast('漲潮了——站上高台！'); e.enc.v.tide = { t: 0, warn: S(2), life: S(6) }; },
      step(e, m) { return m.t > S(1.0); } },
    /* 海蛇召喚（二階，最多 3 波，同時最多 2 隻） */
    summon: { go(e, m) { play(e, 'summon'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.kids = v.kids.filter(k => k.st !== 'dead'); v.waves++; fx(e, N + '_summon_ring', e.x, e.y, { s: HH() * 3 / 256 });
          for (let i = 0; i < 2 - v.kids.length; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; const k = G.spawnOni(p[0], p[1], 20, Math.max(1, e.lv - 4), 'mizuchi'); if (k) v.kids.push(k); } }
        return m.t > S(1.0); } },
    /* 水龍彈（二階、地獄以上）：0.5／0.9／1.3s 各放 1 發追蹤彈，追 1.6s */
    dragon: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'dragon'); },
      step(e, m) { for (let i = 0; i < 3; i++) if (m.t === S(0.5 + i * 0.4)) { const a = Math.atan2(H.y - e.y, H.x - e.x) + (i - 1) * 0.6; e.enc.v.bolts.push({ x: e.x + e.face * HH() * 0.6, y: e.y - HH() * 0.6, a, t: 0, life: S(1.6), e }); }
        return m.t > S(1.8); } },
    /* 必殺・大海嘯（三階）：3s 預警（全場橫線）→ 海嘯 1.2s 由一側橫掃全場，不在高台＝重擊＋擊退 → 回氣破綻 2.5s */
    ult: { go(e, m) { play(e, 'ultimate'); G.UI.banner('必殺・大海嘯', '站上高台！'); const v = e.enc.v; m.side = H.x > e.x ? -1 : 1; m.cx = e.x; m.cy = e.y;
        v.wave = { t: 0, warn: S(3), life: S(4.2), side: m.side, x0: e.x + m.side * HH() * 8, x1: e.x - m.side * HH() * 8, y: e.y }; },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(3)) play(e, 'tide');
        if (m.t > S(3) && v.wave && !m.hit) { const q = (m.t - S(3)) / S(1.2), wx = v.wave.x0 + (v.wave.x1 - v.wave.x0) * q;
          if (Math.abs(H.x - wx) < HH() * 1.0) { m.hit = 1; if (!onPlat(v) && hit(e, 2.2)) knock(e, HH() * 1.2); } }
        if (m.t === S(4.2)) { play(e, 'recover'); e.open = S(2.5); }
        return m.t > S(4.4); },
      stop(e) { e.enc.v.wave = null; } },
    /* 無間・海神之怒・三潮換位（四階）：三波，每波標記主角最近的高台 2s → 水柱轟下＋淹水；站另外兩座＝成功 */
    wrath: { go(e, m) { play(e, 'tide'); G.UI.banner('海神之怒', '被標記的高台會被水柱擊中——換台！'); m.i = 0; m.ok = 0; m.t0 = 0; mark(e, m); },
      step(e, m) { const v = e.enc.v, k = m.t - m.t0;
        if (k === S(2.0)) { const p = v.doom; fx(e, N + '_pillar', p.x, p.y, { s: HH() * 2.4 / 256 }); SC.shake = 5; const st = onPlat(v);
          if (st && st !== p) m.ok++; else hit(e, 1.4); v.doom = null; }
        if (k === S(2.6)) { if (++m.i < 3) { m.t0 = m.t; mark(e, m); } else { play(e, 'recover'); e.open = S(m.ok >= 3 ? 5 : 3); G.UI.toast(m.ok >= 3 ? '三潮全躲過——海神露出長破綻！' : '海神收戟'); m.end = m.t; } }
        return m.end && m.t - m.end > S(0.6); },
      stop(e) { e.enc.v.doom = null; } }
  };
  function mark(e, m) { const v = e.enc.v; const p = v.plats.slice().sort((a, b) => Math.hypot(H.x - a.x, H.y - a.y) - Math.hypot(H.x - b.x, H.y - b.y))[0];
    v.doom = p; p.dt = 0; v.tide = { t: 0, warn: S(1.6), life: S(2.6) }; if (m.i) play(e, 'tide'); }   // 標記後 1.6s 才淹水：留換台時間

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.doom) v.doom.dt++;
    if (v.wave) { v.wave.t++; if (v.wave.t > v.wave.life) v.wave = null; }
    // 渦潮：追人、吸人、傷害；不進高台
    for (const w of v.whirls) { w.t++; const dx = H.x - w.x, dy = H.y - w.y, d = Math.hypot(dx, dy) || 1, nx = w.x + dx / d * 0.9, ny = w.y + dy / d * 0.6;
      if (!v.plats.some(p => Math.hypot(nx - p.x, (ny - p.y) * 1.6) < p.r + w.r * 0.6) && SC.walkable(nx, ny)) { w.x = nx; w.y = ny; }
      if (near(w.x, w.y, w.r * 1.5) && !(H.act && H.act.kind === 'dodge')) { const px = H.x - dx / d * 0.7, py = H.y - dy / d * 0.45; if (SC.walkable(px, py)) { H.x = px; H.y = py; } }
      if (w.t % 30 === 0 && near(w.x, w.y, w.r)) hit(e, 0.3); }
    v.whirls = v.whirls.filter(w => w.t < w.life);
    // 水龍彈
    for (const b of v.bolts) { b.t++; const want = Math.atan2(H.y - HH() * 0.4 - b.y, H.x - b.x); let da = Math.atan2(Math.sin(want - b.a), Math.cos(want - b.a)); b.a += Math.max(-0.045, Math.min(0.045, da));
      b.x += Math.cos(b.a) * 4.6; b.y += Math.sin(b.a) * 4.6 * 0.7; if (Math.hypot(H.x - b.x, (H.y - HH() * 0.4 - b.y) * 1.4) < HH() * 0.5) { b.t = b.life; if (hit(e, 1.0)) fx(e, N + '_dragon_trail', b.x, b.y, { s: HH() * 1.4 / 256 }); } }
    v.bolts = v.bolts.filter(b => b.t < b.life);
    // 漲潮
    if (v.tide) { const T = v.tide; T.t++; if (T.t >= T.life) v.tide = null;
      else if (T.t >= T.warn && !onPlat(v)) { if (v.px !== undefined && !(H.act && H.act.kind === 'dodge')) { H.x = v.px + (H.x - v.px) * 0.6; H.y = v.py + (H.y - v.py) * 0.6; } if (T.t % 30 === 0) hit(e, 0.35); } }
    v.px = H.x; v.py = H.y;
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(1.5); play(e, 'summon'); fx(e, N + '_summon_ring', e.x, e.y, { s: HH() * 3 / 256 }); SC.shake = 6; G.UI.toast(['', '', '海神　潮汐湧動', '海神　怒濤將至', '海神之怒'][ph]);
      if (ph === 2) v.cd.flood = S(2); if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.wrath = S(2.0); enc.cd = S(2.0); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'recover' && e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 2.6); let k;
    if (v.ph >= 4 && !(v.cd.wrath > 0)) { k = 'wrath'; v.cd.wrath = S(24); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = nr ? ['thrust', 'sweep', 'sweep', 'pillars', 'whirl'] : ['thrust', 'thrust', 'pillars', 'whirl'];
      if (v.whirls.length) L.splice(L.indexOf('whirl'), 1);
      if (v.ph >= 2) { if (!(v.cd.flood > 0) && !v.tide) L.push('flood', 'flood'); if (v.waves < 3 && v.kids.filter(x => x.st !== 'dead').length < 2 && !(v.cd.summon > 0)) L.push('summon'); if (enc.diff >= 2) L.push('dragon'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'flood') v.cd.flood = S(16); if (k === 'summon') v.cd.summon = S(18); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 2.2;
    if (d > want) { if (e.an !== 'glide') play(e, 'glide', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 1.7); } else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x) || e.face; }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    const T = v.tide; if (T) { const q = Math.min(1, T.t / T.warn), a = (T.t >= T.warn ? 0.32 : 0.1 + 0.12 * q) * Math.min(1, (T.life - T.t) / 20); ctx.save(); ctx.fillStyle = `rgba(40,110,170,${a})`; ctx.fillRect(H.x - 1600, H.y - 900, 3200, 1800); ctx.restore();
      if (T.t >= T.warn) { const fr = A.frameAt(Object.assign({}, u.act[N + '_flood'], { loop: true }), T.t * TK); for (let i = 0; i < 5; i++) A.draw(u, fr, H.x + (i - 2) * HH() * 3 + ((T.t * 0.6) % (HH() * 3)), H.y + ((i % 2) ? 40 : -50), HH() * 2.6 / 256, false, 0.55); } }
    const pf = u.act[N + '_platform'].f[0];
    for (const p of v.plats) { A.draw(u, pf, p.x, p.y, p.r * 2.5 / 256, false, 1);
      if (v.doom === p) { const q = Math.min(1, p.dt / S(2)); ctx.save(); ctx.strokeStyle = `rgba(240,70,50,${0.6 + 0.4 * Math.sin(v.t * 0.4)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.2, p.r * 0.5, 0, 0, 6.283); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y - HH() * 0.9, 9, -1.57, -1.57 + 6.283 * q); ctx.stroke(); ctx.restore(); }
      else if ((T && T.t < T.warn) || (v.wave && v.wave.t < v.wave.warn)) { ctx.save(); ctx.strokeStyle = `rgba(150,230,255,${0.5 + 0.3 * Math.sin(v.t * 0.3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.15, p.r * 0.48, 0, 0, 6.283); ctx.stroke(); ctx.restore(); } }
    const wp = u.act[N + '_whirlpool'];
    for (const w of v.whirls) { const fr = A.frameAt(Object.assign({}, wp, { loop: true }), w.t * TK), a = Math.min(1, w.t / 10, (w.life - w.t) / 15); A.draw(u, fr, w.x, w.y, w.r * 2.4 / 256, false, a * 0.9); }
    if (v.wave && v.wave.t < v.wave.warn) { const W = v.wave, q = W.t / W.warn; ctx.save(); ctx.strokeStyle = `rgba(120,200,255,${0.4 + 0.3 * q})`; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(W.x0, W.y + i * 40); ctx.lineTo(W.x0 - W.side * HH() * 2 * (0.4 + q), W.y + i * 40); ctx.stroke(); } ctx.restore(); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const bf = u.act[N + '_dragon_bolt'].f[0];
    for (const b of v.bolts) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.globalAlpha = Math.min(1, (b.life - b.t) / 8); const k = HH() * 1.0 / 256; ctx.drawImage(u.imgs[bf[7]], bf[0], bf[1], bf[2], bf[3], -bf[2] * k * 0.7, -bf[3] * k / 2, bf[2] * k, bf[3] * k); ctx.restore(); }
    if (v.wave && v.wave.t >= v.wave.warn) { const W = v.wave, q = (W.t - W.warn) / (W.life - W.warn), wx = W.x0 + (W.x1 - W.x0) * q, ts = u.act[N + '_tsunami'], fr = A.frameAt(Object.assign({}, ts, { loop: true }), W.t * TK);
      for (let i = -2; i <= 2; i++) A.draw(u, fr, wx, W.y + i * 45 + 40, HH() * 3.2 / 256, W.side > 0, 0.95); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('watatsumi', { name: '綿津見大神', sub: '夕潮之海神', unit: 'b_watatsumi', foes: ['mizuchi'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R10_07'],
    actors: [{ id: N, name: '綿津見大神', size: 1.6, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { const e = R(enc); const v = enc.v = { ph: 1, cd: {}, plats: [], whirls: [], bolts: [], kids: [], tide: null, wave: null, doom: null, waves: 0, t: 0 };
      const cx = e.x - HH() * 1.4, cy = e.y;
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, p = SC.snap(cx + Math.cos(a) * HH() * 3.4, cy + Math.sin(a) * HH() * 1.6, 'open', 160); if (p && !v.plats.some(q => Math.hypot(q.x - p[0], q.y - p[1]) < HH() * 2)) v.plats.push({ x: p[0], y: p[1], r: HH() * 0.95, dt: 0 }); }
      for (let i = 0; v.plats.length < 3 && i < 20; i++) { const p = SC.randSpot('open', null, v.plats.map(q => [q.x, q.y]).concat([[e.x, e.y]]), HH() * 2.4); if (p) v.plats.push({ x: p[0], y: p[1], r: HH() * 0.95, dt: 0 }); }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.whirls = []; v.bolts = []; v.tide = null; v.wave = null; v.doom = null; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
