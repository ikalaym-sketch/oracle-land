/* ==========================================================================
 * 神諭之地 重製版 — 29_boss_kyubi.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.4 新增。第三章頭目「白九尾」（第三章頭目地圖 W_R03_07；原設定 W_R03_05 非本作頭目圖），P3 原圖（面向右，四足狐身）。
 *           ‧ 尾巴是獨立圖層：九條 → 血量 <66% 剩六條 → <33% 剩三條（換階不恢復）；分身數＝尾數 ÷3。
 *           ‧ 招式：狐火／九尾鞭／九尾連鞭／天狐光／幻影分身／狐火結界／魅惑／必殺・殺生石／無間・玉藻前九重。
 *           ‧ 分身：只有本體有倒影、分身不顯示血條；打中本體＝分身全散，打錯分身＝0.25 秒後爆炸。
 *           ‧ 原圖修正：奔跑第 3 格、掃尾第 3 格內含兩隻狐（切格錯誤）→ 奔跑刪該格、掃尾改用前一格。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, sc, fx, lane, circle, inLane, inCircle, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'kyubi', U = () => A.get('b_kyubi');
  const mouth = e => [e.x + e.face * HH() * e.size * 0.42 * SC.depth(e.y), e.y - HH() * e.size * 0.6 * SC.depth(e.y)];
  const tails = e => e.enc.v.tails;
  const real = enc => enc.units[0];
  const smoke = (e, x, y) => fx(e, N + '_clone_smoke', x, y, { s: sc(e) * 1.1, nat: 1 });
  const ffire = (e, x, y, vx, vy, o) => e.enc.v.proj.push(Object.assign({ e, x, y, vx, vy, t: 0, life: S(1.6), hit: 0, fake: !!(o && o.fake) }, o || {}));

  /* ---------- 招式 ---------- */
  const MV = {
    /* 狐火：預兆 0.7s（扇形紅線）→ 本體 5 發扇形、分身各 3 發 → 收招 0.6s */
    fire: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'cast'); m.ang = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); m.n = e.clone ? 3 : 5;
        for (let i = 0; i < m.n; i++) { const a = m.ang + (i - (m.n - 1) / 2) * 0.22, L = HH() * 6; lane(e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L / 1.6, HH() * 0.32, S(0.7), '240,170,120'); } },
      step(e, m) { if (m.t < S(0.7)) { e.at = Math.min(e.at, 380); return false; }
        if (m.t === S(0.7)) { e.at = 420; for (let i = 0; i < m.n; i++) { const a = m.ang + (i - (m.n - 1) / 2) * 0.22; ffire(e, e.x, e.y, Math.cos(a) * 5.2, Math.sin(a) * 5.2 / 1.6, { fake: e.clone && e.enc.v.tama }); } }
        return m.t > S(0.7) + S(0.6); } },
    /* 九尾鞭：預兆 0.7s（前方半圓）→ 0.25s 後掃尾（判定一次）→ 收招 0.3s */
    whip: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'whip'); m.tl = m.tl || 0.7; circle(e.x + e.face * HH() * 0.9, e.y, HH() * 1.8, S(m.tl)); },
      step(e, m) { const T = S(m.tl);
        if (m.t < T) { e.at = Math.min(e.at, 130); return false; }
        if (m.t === T) e.at = 140;
        if (m.t === T + S(0.25)) { fx(e, N + '_whip_arc', e.x + e.face * HH() * 0.9, e.y, { s: sc(e) * 1.5, nat: 1 }); if (!e.fakeHit && inCircle(e.x + e.face * HH() * 0.9, e.y, HH() * 1.8)) hit(e, 1.3); }
        return m.t > T + S(0.25) + S(m.rec || 0.3); } },
    /* 九尾連鞭（二階）：鞭 → 快鞭 → 鞭（預兆 0.7／0.5／0.5s，快鞭收招 0.15s） */
    whip3: { go(e, m) { m.i = 0; m.sub = { t: 0, tl: 0.7 }; MV.whip.go(e, m.sub); },
      step(e, m) { m.sub.t++; if (!MV.whip.step(e, m.sub)) return false; if (++m.i >= 3) return true; m.sub = { t: 0, tl: 0.5, rec: m.i === 1 ? 0.15 : 0.3 }; MV.whip.go(e, m.sub); return false; } },
    /* 天狐光：預兆 0.95s（直線）→ 口部光束 0.9s（判定一次）→ 收招 1.0s */
    beam: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'beam'); const [mx] = mouth(e); m.x0 = mx; m.y0 = e.y;
        let dx = H.x - mx, dy = H.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy = Math.max(-0.35, Math.min(0.35, dy / d)); dx = e.face * Math.max(0.5, Math.abs(dx)); const n = Math.hypot(dx, dy); dx /= n; dy /= n;   // 只朝面向那側、上下最多約 20°
        m.L = HH() * (m.len || 8.5); m.x1 = mx + dx * m.L; m.y1 = e.y + dy * m.L; m.tl = m.tl || 0.95;
        lane(m.x0, m.y0, m.x1, m.y1, HH() * 0.55, S(m.tl), m.fake ? '230,60,40' : '230,60,40'); },
      step(e, m) { const T = S(m.tl), Bm = S(m.dur || 0.9);
        if (m.t < T) { e.at = Math.min(e.at, 400); return false; }
        if (m.t < T + Bm) { e.at = 520; if (m.t === T) { const [mx, my] = mouth(e); e.enc.v.beams.push({ e, x: mx, y: my, x1: m.x1, y1: m.y1 - (e.y - my), t: 0, life: Bm, fake: m.fake }); }
          if (!m.fake && !m.hit && m.t > T + 4 && inLane(m.x0, m.y0, m.x1, m.y1, HH() * 0.55)) m.hit = hit(e, 1.6); return false; }
        return m.t > T + Bm + S(m.after || 1.0); } },
    /* 幻影分身：嘯聲 0.6s → 煙霧換位，分身數＝尾數÷3，持續 14s，分身每 1.6s 放狐火 */
    clone: { go(e, m) { play(e, 'cast'); },
      step(e, m) { if (m.t === S(0.6)) spawnClones(e.enc, Math.max(1, tails(e) / 3), S(14)); return m.t > S(0.9); } },
    /* 狐火結界（二階）：預兆 0.8s → 八枚狐火繞身擴張（半徑 0.6→2.9 身，4s） */
    ring: { go(e, m) { play(e, 'cast'); circle(e.x, e.y, HH() * 2.9, S(0.8), '240,170,120'); },
      step(e, m) { if (m.t < S(0.8)) { e.at = Math.min(e.at, 380); return false; }
        if (m.t === S(0.8)) e.enc.v.ring = { e, t: 0, life: S(4), hitT: 0 };
        return m.t > S(0.8) + S(0.6); } },
    /* 魅惑（二階）：長嘯預兆 0.8s（大圈）→ 圈內 2 秒移動減半、粉色花瓣（不反轉方向） → 收招 0.5s */
    charm: { go(e, m) { play(e, 'howl'); circle(e.x, e.y, HH() * 3.2, S(0.8), '240,120,200'); },
      step(e, m) { if (m.t === S(0.8)) { fx(e, N + '_charm_motes', e.x, e.y - HH() * 0.4, { s: sc(e) * 2.2, nat: 1 }); if (inCircle(e.x, e.y, HH() * 3.2)) { e.enc.v.charm = S(2); G.UI.toast('被魅惑了！移動變慢'); } }
        return m.t > S(0.8) + S(0.5); } },
    /* 必殺・殺生石（三階）：長嘯 → 殺生石落地、三根淨化樁亮起 → 毒霧 2s 後覆蓋全場 2.6s；站在樁旁（半徑 0.9 身）才安全 */
    ult: { go(e, m) { play(e, 'howl'); const v = e.enc.v, c = [e.x - e.face * HH() * 1.2, e.y]; v.stone = { x: c[0], y: c[1], t: 0 };
        v.stakes = []; for (let i = 0; i < 3; i++) { const p = SC.randSpot('open', null, v.stakes.map(s => [s.x, s.y]).concat([[H.x, H.y]]), HH() * 2.2) || [H.x + (i - 1) * HH() * 3, H.y]; v.stakes.push({ x: p[0], y: p[1], t: 0 }); }
        G.UI.banner('必殺・殺生石', '毒霧要來了——躲進淨化樁的光圈！'); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(2.0)) { v.mist = { t: 0, life: S(2.6) }; }
        if (m.t === S(2.25)) { const safe = v.stakes.some(s => Math.hypot(H.x - s.x, (H.y - s.y) * 1.6) < HH() * 0.9); if (!safe) hit(e, 2.2); else G.UI.toast('淨化樁擋住了毒霧'); for (const s of v.stakes) fx(e, N + '_ward_glow', s.x, s.y - HH() * 0.3, { s: sc(e), nat: 1 }); }
        if (m.t > S(2.0 + 2.6)) { v.stone = null; v.stakes = []; return m.t > S(5.2); } return false; },
      stop(e) { const v = e.enc.v; v.stone = null; v.stakes = []; v.mist = null; } },
    /* 無間・玉藻前九重（四階）：沒有分身就先叫 2 隻 → 狐火 → 鞭 → 天狐光 → 全部分身＋本體同時光束（只有本體是真的） */
    tamamo: { go(e, m) { m.i = 0; const v = e.enc.v; if (!v.clones.length) spawnClones(e.enc, 2, S(20)); v.tama = 1; m.sub = null; G.UI.banner('玉藻前・九重', '真身只有一隻——看倒影'); },
      step(e, m) { const v = e.enc.v, seq = ['fire', 'whip', 'beam', 'cb'];
        if (!m.sub) { const k = seq[m.i]; if (!k) { v.tama = 0; return true; } m.sub = { t: 0, k };
          if (k === 'cb') { m.sub.tl = 0.8; for (const c of v.clones) if (c.st !== 'dead') { if (c.mv) end(c); begin(c, 'beam', { tl: 0.8, len: 7.8, dur: 0.6, fake: 1, after: 0.2 }); } Object.assign(m.sub, { tl: 0.8, len: 7.8, dur: 0.6, after: 1.4 }); MV.beam.go(e, m.sub); }
          else { if (k === 'beam') Object.assign(m.sub, { tl: 0.7 }); if (k !== 'beam') m.sub.tl = 0.55; MV[k].go(e, m.sub); } return false; }
        m.sub.t++; if ((m.sub.k === 'cb' ? MV.beam : MV[m.sub.k]).step(e, m.sub)) { m.sub = null; m.i++; } return false; },
      stop(e) { e.enc.v.tama = 0; } }
  };

  /* ---------- 分身 ---------- */
  function spawnClones(enc, n, life) { const e = real(enc), v = enc.v; killClones(enc, true);
    const spots = []; for (let i = 0; i <= n; i++) { const a = (i / (n + 1)) * Math.PI * 2 + rnd(0, 1), p = SC.snap(H.x + Math.cos(a) * HH() * 3.2, H.y + Math.sin(a) * HH() * 1.4, 'open', 200) || [e.x, e.y]; spots.push(p); }
    spots.sort(() => Math.random() - 0.5);
    smoke(e, e.x, e.y); [e.x, e.y] = spots[0]; smoke(e, e.x, e.y); e.face = sgn(H.x - e.x);
    for (let i = 1; i <= n; i++) { const c = Object.assign({}, e, { clone: 1, x: spots[i][0], y: spots[i][1], hp: 1, hpMax: 1, mv: null, st: 'walk', nobar: 1, boss: false, fireT: S(rnd(0.6, 1.6)), t: 0, flash: 0, kb: 0, alpha: 1, idx: 10 + i });
      c.face = sgn(H.x - c.x); play(c, 'idle', true); smoke(e, c.x, c.y); v.clones.push(c); G.E.push(c); }
    e.nobar = 1; v.cloneT = life; }
  function killClones(enc, quiet) { const v = enc.v; for (const c of v.clones) { if (!quiet) smoke(real(enc), c.x, c.y); c.alpha = 0; c.st = 'dead'; } v.clones = []; real(enc).nobar = 0; v.cloneT = 0; }

  /* ---------- 指揮 ---------- */
  function director(enc) {
    const e = real(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.charm > 0) { v.charm--; if (v.px !== undefined && !H.act) { H.x = v.px + (H.x - v.px) * 0.5; H.y = v.py + (H.y - v.py) * 0.5; } } v.px = H.x; v.py = H.y;
    stepFx(enc);
    if (v.clones.length && --v.cloneT <= 0) killClones(enc);
    for (const x of v.boom) { x.t++; if (x.t === S(0.25)) { fx(e, N + '_clone_smoke', x.x, x.y, { s: sc(e) * 1.6, nat: 1 }); if (inCircle(x.x, x.y, HH() * 1.4)) hit(e, 1.2); SC.shake = 5; } } v.boom = v.boom.filter(x => x.t <= S(0.25));
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(2); play(e, 'howl'); v.tails = ph >= 3 ? 3 : ph >= 2 ? 6 : 9; if (ph >= 2 && v.prevTails !== v.tails) { G.UI.toast(['', '', '尾巴斷了三條——剩六條', '只剩三條尾巴了', '九重之怨　覺醒'][ph]); v.prevTails = v.tails; }
      killClones(enc); if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.tama = S(2.4); enc.cd = S(2.4); return; }
    if (e.mv || e.st === 'hurt') return;
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    let k;
    if (v.ph >= 4 && !(v.cd.tama > 0)) { k = 'tamamo'; v.cd.tama = S(22); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(26); }
    else { const near = Math.abs(H.x - e.x) < HH() * 2.6 && Math.abs(H.y - e.y) < 40, L = near ? ['whip', 'whip', 'fire', 'beam'] : ['fire', 'beam', 'fire'];
      if (!v.clones.length && !(v.cd.clone > 0)) L.push('clone', 'clone');
      if (v.ph >= 2) { L.push(near ? 'whip3' : 'ring', 'ring'); if (!(v.cd.charm > 0)) L.push('charm'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'clone') v.cd.clone = S(24); if (k === 'charm') v.cd.charm = S(14); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(0.9, 1.4) : rnd(0.6, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 3;   // 保持中距離繞行
    if (Math.abs(d - want) > HH() * 0.8) { if (e.an !== 'run') play(e, 'run', true); const k = d > want ? 1 : -1; walkTo(e, e.x + (H.x - e.x) / d * HH() * k, e.y + (H.y - e.y) / d * HH() * k, 2.6); }
    else if (e.an !== 'idle') { play(e, 'idle', true); } if (e.an === 'idle') e.face = sgn(H.x - e.x); }
  /* 分身待機：每 1.6s 放狐火（玉藻前期間由本體指揮） */
  function idle(e) { if (!e.clone) return false; const v = e.enc.v; if (e.an !== 'idle') play(e, 'idle', true); e.face = sgn(H.x - e.x);
    if (!v.tama && --e.fireT <= 0) { e.fireT = S(1.6); begin(e, 'fire'); } return true; }

  /* ---------- 投射物、光束、結界、毒霧 ---------- */
  function stepFx(enc) { const v = enc.v, e = real(enc);
    for (const p of v.proj) { p.t++; p.x += p.vx; p.y += p.vy;   // 狐火會飛越障礙
      if (!p.fake && !p.hit && Math.abs(H.x - p.x) < HH() * 0.35 && Math.abs(H.y - p.y) < 20) p.hit = hit(e, 0.9) ? 1 : 0; }
    v.proj = v.proj.filter(p => p.t < p.life);
    for (const b of v.beams) b.t++; v.beams = v.beams.filter(b => b.t < b.life);
    const r = v.ring; if (r) { r.t++; r.hitT--; const R = HH() * (0.6 + Math.min(2.3, r.t / 60 * 0.78));
      for (let i = 0; i < 8; i++) { const a = r.t * 0.05 + i * Math.PI / 4, x = r.e.x + Math.cos(a) * R, y = r.e.y + Math.sin(a) * R * 0.45; if (r.hitT <= 0 && Math.abs(H.x - x) < HH() * 0.35 && Math.abs(H.y - y) < 18 && hit(e, 0.7)) r.hitT = 30; }
      if (r.t > r.life) v.ring = null; }
    if (v.mist) { v.mist.t++; if (v.mist.t > v.mist.life) v.mist = null; }
    if (v.stone) v.stone.t++; for (const s of v.stakes) s.t++;
  }

  /* ---------- 繪製 ---------- */
  function underBody(e, fr, s, fl, a) { const u = U(); if (!u) return; const r = u.act[N + '_tail_sway']; if (!r) return;
    const n = tails(e), lx = fr[2] * 0.2, ly = fr[3] * 0.4, bx = e.x + (fl ? -1 : 1) * (lx - fr[4]) * s, by = e.y - (fr[5] - ly) * s;   // 臀部（原圖面右：左側 20%、高 40%）
    for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1), ang = (-75 + t * 85) * Math.PI / 180, f2 = A.frameAt(Object.assign({}, r, { loop: true }), G.t * TK + i * 110 + e.ph);
      ctx.save(); ctx.translate(bx, by); if (fl) ctx.scale(-1, 1); ctx.rotate(ang); ctx.globalAlpha = a; const k = s * 0.62;
      ctx.drawImage(u.imgs[f2[7]], f2[0], f2[1], f2[2], f2[3], -f2[4] * k, -f2[5] * k, f2[2] * k, f2[3] * k); ctx.restore(); }
    if (e.enc.v.clones.length && !e.clone) { ctx.save(); ctx.globalAlpha = 0.22 * a; ctx.translate(e.x, e.y); ctx.scale(fl ? -1 : 1, -0.45);   // 本體倒影
      ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[4] * s, -fr[5] * s, fr[2] * s, fr[3] * s); ctx.restore(); } }
  function drawUnder(enc) { const v = enc.v, u = U(), e = real(enc); if (!u || !e) return;
    if (v.stone) { const r = u.act[N + '_sessho']; A.draw(u, r.f[0], v.stone.x, v.stone.y, sc(e) * 1.1, false, Math.min(1, v.stone.t / 15)); }
    for (const s of v.stakes) { const g = 0.4 + 0.3 * Math.sin(s.t * 0.15); ctx.save(); ctx.fillStyle = `rgba(255,236,170,${g * 0.4})`; ctx.strokeStyle = `rgba(255,236,170,${g})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, HH() * 0.9, HH() * 0.9 * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); A.draw(u, u.act[N + '_stake'].f[0], s.x, s.y, sc(e) * 0.8, false, 1); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = real(enc); if (!u || !e) return;
    const fr0 = u.act[N + '_fox_fire'];
    for (const p of v.proj) { const f = A.frameAt(Object.assign({}, fr0, { loop: true }), 135 + (p.t * TK) % 270), ang = Math.atan2(p.vy * 1.6, p.vx), k = sc(e) * 0.55;
      ctx.save(); ctx.translate(p.x, p.y - HH() * 0.45); ctx.rotate(ang); ctx.globalAlpha = Math.min(1, (p.life - p.t) / 10); ctx.drawImage(u.imgs[f[7]], f[0], f[1], f[2], f[3], -f[2] * k * 0.8, -f[3] * k / 2, f[2] * k, f[3] * k); ctx.restore(); }
    const br = u.act[N + '_celestial_beam'];
    for (const b of v.beams) { const f = A.frameAt(Object.assign({}, br, { loop: true }), 135 + (b.t * TK) % 270), L = Math.hypot(b.x1 - b.x, b.y1 - b.y), h = HH() * 0.9, a = Math.min(1, (b.life - b.t) / 8, b.t / 3);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.y1 - b.y, b.x1 - b.x)); ctx.drawImage(u.imgs[f[7]], f[0], f[1], f[2], f[3], 0, -h / 2, L, h); ctx.restore(); }
    if (v.ring) { const r = v.ring, R = HH() * (0.6 + Math.min(2.3, r.t / 60 * 0.78)), a = Math.min(1, (r.life - r.t) / 15);
      for (let i = 0; i < 8; i++) { const ang = r.t * 0.05 + i * Math.PI / 4, x = r.e.x + Math.cos(ang) * R, y = r.e.y + Math.sin(ang) * R * 0.45, f = A.frameAt(Object.assign({}, fr0, { loop: true }), 135 + (r.t * TK + i * 60) % 270);
        A.draw(u, f, x, y - HH() * 0.3, sc(e) * 0.45, Math.sin(ang) > 0, a); } }
    if (v.mist) { const m = v.mist, a = Math.min(1, m.t / 15, (m.life - m.t) / 20), f = A.frameAt(u.act[N + '_poison_mist'], Math.min(400, m.t * TK)), s = SC.def.w / f[2] * 0.36;
      for (let x = 120; x < SC.def.w; x += f[2] * s * 0.8) for (const y of [SC.y0 + 30, (SC.y0 + SC.y1) / 2, SC.y1]) A.draw(u, f, x, y, s, false, 0.85 * a);
      for (const s of v.stakes) { ctx.save(); ctx.strokeStyle = 'rgba(255,240,190,.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(s.x, s.y, HH() * 0.9, HH() * 0.9 * 0.42, 0, 0, 6.283); ctx.stroke(); ctx.restore(); A.draw(u, u.act[N + '_stake'].f[0], s.x, s.y, sc(e) * 0.8, false, 1); } }   // 淨化樁在毒霧上方仍看得見
    if (v.charm > 0 && G.t % 20 < 10) G.txt('魅惑', H.x, H.y - HH() * 1.2, 11, '#ff9ad5', 'center');
  }

  B.reg('kyubi', { name: '白九尾', sub: '狐路的主人', unit: 'b_kyubi', hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R03_07'],
    actors: [{ id: N, name: '白九尾', size: 1.25, moves: [] }], mv: MV, director, idle, underBody, drawUnder, drawOver,
    init(enc) { enc.v = { ph: 1, tails: 9, cd: { clone: S(6) }, proj: [], beams: [], clones: [], boom: [], stakes: [], stone: null, mist: null, ring: null, charm: 0, t: 0 }; enc.cd = S(1.2); },
    finish(enc) { killClones(enc, true); const v = enc.v; v.proj = []; v.beams = []; v.ring = null; v.mist = null; v.stone = null; v.stakes = []; },
    preDamage(e, big) { const enc = e.enc, v = enc.v;
      if (e.clone) { if (e.st === 'dead') return true; e.st = 'dead'; e.alpha = 0; v.clones = v.clones.filter(c => c !== e); smoke(real(enc), e.x, e.y); v.boom.push({ x: e.x, y: e.y, t: 0 }); circle(e.x, e.y, HH() * 1.4, S(0.25)); G.UI.toast('是分身！'); if (!v.clones.length) real(enc).nobar = 0; return true; }
      if (v.clones.length && !v.tama) { killClones(enc); G.UI.toast('識破真身！'); }
      return false; } });
})();
