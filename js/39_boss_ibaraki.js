/* ==========================================================================
 * 神諭之地 重製版 — 39_boss_ibaraki.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第五章章中頭目「茨木童子」（雙井水橋 W_R05_03，鬼王戰前一張），P3 原圖（面向右）。
 *           ‧ 原圖尺寸不一：攻擊類片段（爪／投擲／跳／拍）已在圖集放大 1.82 倍、倒地 1.35、斷臂受傷／拍地 1.25；斷臂 0.5、老婦 0.72。
 *           ‧ 斷臂（二階進場一次）：右臂被斬下變成獨立的「鬼腕」敵人（本體血量 5%），鬼腕活著時本體受傷減半；鬼腕會爬向主角揮拳。
 *           ‧ 場上 4 根柱子：投出的鬼腕撞到柱子會停下（躲在柱子後面就安全）。
 *           ‧ 招式：鬼爪二連（完好）／單手掃（斷臂）／鬼腕投擲（直線飛出再收回，撞柱即停）／門上落擊（跳上門頂→落點圈）／
 *                   震門擊（周身震波）／腕連打（二階、鬼腕活著：鬼腕連揮 3 拳）／羅城門之雨（二階：12 秒大雨＋視野變暗）／
 *                   必殺・老婦之計（三階：變成 3 個老婦，6 秒內打中有「鬼角影子」的本尊＝破綻 3 秒；打錯＝煙霧反噬；時間到＝本尊現身大爪）／
 *                   無間・鬼腕歸來・奪臂（四階：1.2 秒預告線，鬼腕飛回本體 0.8 秒；路上打中鬼腕＝攔截、本體硬直 1.5 秒；否則接回 8 秒後再斷；鬼腕已死只剩殘影傷害）。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾 drawSelf／idle／preDamage／onDamage）、03_actors（hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, fx, lane, circle, inLane, hit, walkTo, S, rnd, sgn, begin, end, sc, flip, TK, HH } = B.api;
  const N = 'ibaraki', U = () => A.get('b_ibaraki'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  /* 前方弧 */
  function claw(e, m, at, tl, mul) { if (m.t === at) { toward(e); m.cx = e.x + e.face * HH() * 0.9; circle(m.cx, e.y, HH() * 1.15, S(tl)); }
    if (m.t === at + S(tl)) { fx(e, N + '_claw_arc', m.cx, e.y - HH() * 0.6, { s: HH() * 1.8 / 54 }); if (near(m.cx, e.y, HH() * 1.15)) hit(e, mul); } }
  /* 投擲線段：撞柱停 */
  function throwEnd(v, x0, y0, dx, dy, L) { let ex = x0, ey = y0; for (let i = 1; i <= 30; i++) { const px = x0 + dx * L * i / 30, py = y0 + dy * L * i / 30;
      if (v.pillars.some(p => Math.hypot(px - p.x, (py - p.y) * 1.6) < HH() * 0.45) || !SC.walkable(px, py)) { return [ex, ey, 1]; } ex = px; ey = py; } return [ex, ey, 0]; }
  const MV = {
    /* 鬼爪二連（完好）／單手掃（斷臂）：預兆 0.5s → 爪；完好再接第二爪 */
    claw: { go(e, m) { play(e, e.broken ? 'sweep' : 'claw'); },
      step(e, m) { claw(e, m, 1, 0.5, 1.0); if (!e.broken) { if (m.t === S(0.75)) play(e, 'claw'); claw(e, m, S(0.75), 0.4, 1.1); } return m.t > (e.broken ? S(1.0) : S(1.6)); } },
    /* 鬼腕投擲（完好）：預兆 0.7s（直線 6 身，撞柱即止）→ 飛出 0.4s → 停 0.3s → 收回 0.4s；途中都會打人 */
    throw: { go(e, m) { toward(e); play(e, 'throw'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d * 0.7;
        m.end = throwEnd(e.enc.v, e.x, e.y - 2, m.dx, m.dy, HH() * 6); lane(e.x, e.y, m.end[0], m.end[1], HH() * 0.8, S(0.7)); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(0.7)) { e.broken = 1; v.fly = { x: e.x, y: e.y, t: 0 }; play(e, 'idle', true); }
        if (v.fly && m.t > S(0.7)) { const k = m.t - S(0.7), q = k < S(0.4) ? k / S(0.4) : k < S(0.7) ? 1 : Math.max(0, 1 - (k - S(0.7)) / S(0.4));
          v.fly.x = e.x + (m.end[0] - e.x) * q; v.fly.y = e.y + (m.end[1] - e.y) * q; v.fly.t++;
          if (!m.hit && near(v.fly.x, v.fly.y, HH() * 0.55) && hit(e, 1.1)) m.hit = 1;
          if (k === S(0.4) && m.end[2]) { fx(e, N + '_arm_burst', m.end[0], m.end[1] - HH() * 0.4, { s: HH() * 1.4 / 9 }); G.UI.toast('鬼腕撞上柱子'); }
          if (k >= S(1.1)) { v.fly = null; e.broken = v.severed ? 1 : 0; } }
        return m.t > S(2.0); },
      stop(e) { const v = e.enc.v; v.fly = null; e.broken = v.severed ? 1 : 0; } },
    /* 門上落擊：跳上門頂（0.6s 消失）→ 落點圈 0.8s → 落下＋震波 */
    jump: { go(e, m) { play(e, 'jump'); m.ph = 0; },
      step(e, m) { const v = e.enc.v;
        if (m.ph === 0 && m.t === S(0.45)) { m.ph = 1; e.hide = 1; m.t0 = m.t; }
        if (m.ph === 1 && m.t - m.t0 === S(0.4)) { const p = SC.snap(H.x, H.y, 'walk', 120) || [H.x, H.y]; m.x = p[0]; m.y = p[1]; circle(m.x, m.y, HH() * 1.4, S(0.8), '230,90,60'); v.drop = { x: m.x, y: m.y }; }
        if (m.ph === 1 && m.t - m.t0 === S(1.2)) { m.ph = 2; e.hide = 0; v.drop = null; e.x = m.x; e.y = m.y; toward(e); play(e, 'slam'); fx(e, N + '_impact', e.x, e.y, { s: HH() * 2 / 45 }); fx(e, N + '_shock_wave', e.x, e.y, { s: HH() * 3 / 95 }); SC.shake = 6;
          if (near(e.x, e.y, HH() * 1.4)) hit(e, 1.3); m.t0 = m.t; }
        return m.ph === 2 && m.t - m.t0 > S(0.8); },
      stop(e) { e.hide = 0; e.enc.v.drop = null; } },
    /* 震門擊：預兆 0.7s（周身圈）→ 拍地震波（擊退） */
    slam: { go(e, m) { play(e, 'idle', true); circle(e.x, e.y, HH() * 2.0, S(0.7)); },
      step(e, m) { if (m.t === S(0.7) - S(0.28)) play(e, 'slam');
        if (m.t === S(0.7)) { fx(e, N + '_shock_wave', e.x, e.y, { s: HH() * 4 / 95 }); SC.shake = 5; if (near(e.x, e.y, HH() * 2.0) && hit(e, 1.0)) knock(e, HH() * 1.0); }
        return m.t > S(1.3); } },
    /* 腕連打（二階、鬼腕活著）：鬼腕連揮 3 拳（各預兆 0.5s） */
    rush: { go(e, m) { play(e, 'idle', true); const a = e.enc.v.arm; if (a) a.q = 3; G.UI.toast('鬼腕連打！'); }, step(e, m) { return m.t > S(0.6); } },
    /* 羅城門之雨（二階）：12s 大雨＋視野變暗 */
    rain: { go(e, m) { play(e, 'idle', true); e.enc.v.rain = { t: 0, life: S(12) }; G.UI.banner('羅城門之雨', '視野變暗了'); }, step(e, m) { return m.t > S(0.8); } },
    /* 必殺・老婦之計（三階） */
    ult: { go(e, m) { const v = e.enc.v; G.UI.banner('必殺・老婦之計', '找出有鬼角影子的本尊！'); fx(e, N + '_disguise_smoke', e.x, e.y - HH() * 0.5, { s: HH() * 2.4 / 95 });
        v.dis = { t: 0, life: S(6) }; e.nobar = 1; v.fakes = [];
        for (let i = 0; i < 2; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 2.6, e.y + (i ? 25 : -25), 'open', 200) || [e.x + (i ? 60 : -60), e.y];
          const f = Object.assign({}, e, { fake: 1, mv: null, st: 'walk', boss: false, nobar: 1, hp: 1e9, hpMax: 1e9, x: p[0], y: p[1], idx: 30 + i, flash: 0, kb: 0, inv: 0, wt: rnd(0, 6) });
          fx(e, N + '_disguise_smoke', f.x, f.y - HH() * 0.5, { s: HH() * 2.4 / 95 }); v.fakes.push(f); G.E.push(f); }
        // 三人互換位置（本尊不一定在中間）
        const all = [e].concat(v.fakes), ps = all.map(o => [o.x, o.y]).sort(() => Math.random() - 0.5); all.forEach((o, i) => { o.x = ps[i][0]; o.y = ps[i][1]; }); },
      step(e, m) { const v = e.enc.v;
        if (v.dis && m.t % 40 === 0) for (const o of [e].concat(v.fakes)) { o.tx = o.x + rnd(-1, 1) * HH() * 1.2; o.ty = o.y + rnd(-1, 1) * 30; }
        if (v.dis) { for (const o of [e].concat(v.fakes)) if (o.tx !== undefined) { const p = SC.snap(o.tx, o.ty, 'walk', 60); if (p) walkTo(o, p[0], p[1], 0.9); } if (m.t >= S(6)) { reveal(e, 0); m.t0 = m.t; const q = SC.snap(H.x - (sgn(H.x - e.x) || 1) * HH() * 1.1, H.y, 'walk', 120); if (q) { e.x = q[0]; e.y = q[1]; } toward(e); m.cx = e.x + e.face * HH() * 1.0; circle(m.cx, e.y, HH() * 1.6, S(0.6)); play(e, 'idle', true); } return false; }
        if (m.t0 !== undefined) { const k = m.t - m.t0; if (k === S(0.6) - S(0.3)) play(e, e.broken ? 'sweep' : 'claw');
          if (k === S(0.6)) { fx(e, N + '_claw_arc', m.cx, e.y - HH() * 0.6, { s: HH() * 2.6 / 54 }); if (near(m.cx, e.y, HH() * 1.6)) hit(e, 1.5); }
          return k > S(1.1); }
        return m.t > (m.won || 0) + S(0.3); },
      stop(e) { const v = e.enc.v; if (v.dis) reveal(e, 0, 1); } },
    /* 無間・鬼腕歸來・奪臂 */
    armback: { go(e, m) { const v = e.enc.v, a = v.arm; play(e, 'idle', true); G.UI.banner('鬼腕歸來', '在鬼腕飛回途中打中它！');
        m.sx = a && a.st !== 'dead' ? a.x : (v.armX || e.x + HH() * 3); m.sy = a && a.st !== 'dead' ? a.y : (v.armY || e.y); m.live = !!(a && a.st !== 'dead');
        lane(m.sx, m.sy, e.x, e.y, HH() * 0.9, S(1.2), m.live ? '230,90,60' : '160,160,180'); if (m.live) a.hold = 1; },
      step(e, m) { const v = e.enc.v, a = v.arm;
        if (m.t > S(1.2) && m.t <= S(2.0)) { const q = (m.t - S(1.2)) / S(0.8); v.fly = { x: m.sx + (e.x - m.sx) * q, y: m.sy + (e.y - m.sy) * q, t: m.t, echo: !m.live };
          if (m.live && a) { a.x = v.fly.x; a.y = v.fly.y; a.flying = 1; if (a.cut) { v.fly = null; a.flying = 0; a.hold = 0; e.open = S(1.5); play(e, 'hurt'); G.UI.toast('攔下鬼腕了！'); return true; } }
          if (!m.hit && near(v.fly.x, v.fly.y, HH() * 0.55) && hit(e, 1.0)) m.hit = 1; }
        if (m.t === S(2.0)) { v.fly = null; if (m.live && a) { a.flying = 0; a.hold = 0; a.home = 1; e.broken = 0; e.shield = 0; v.attach = S(8); G.UI.toast('鬼腕接回去了'); } }
        return m.t > S(2.4); },
      stop(e) { const v = e.enc.v; v.fly = null; if (v.arm) { v.arm.flying = 0; v.arm.hold = 0; } } }
  };
  function reveal(e, ok, quiet) { const v = e.enc.v; v.dis = null; e.nobar = 0; for (const f of v.fakes) { f.st = 'dead'; f.alpha = 0; fx(e, N + '_disguise_smoke', f.x, f.y - HH() * 0.5, { s: HH() * 2.4 / 95 }); }
    G.E = G.E.filter(x => !v.fakes.includes(x)); v.fakes = []; fx(e, N + '_reveal_glow', e.x, e.y - HH() * 0.2, { s: HH() * 2.6 / 95 });
    if (ok) { e.open = S(3); play(e, 'hurt'); if (!quiet) G.UI.banner('識破了！', '茨木童子露出破綻'); } }
  /* 斷臂 */
  function sever(e) { const v = e.enc.v; v.severed = 1; e.broken = 1; e.shield = 0.5; play(e, 'hurt'); G.UI.banner('斷臂', '鬼腕活著時本體受傷減半');
    const p = SC.snap(e.x + e.face * HH() * 1.2, e.y + 10, 'walk', 120) || [e.x, e.y]; fx(e, N + '_arm_burst', p[0], p[1] - HH() * 0.3, { s: HH() * 1.6 / 9 });
    const a = Object.assign({}, e, { arm: 1, body: e, mv: null, st: 'walk', boss: false, nobar: 0, hp: 1e9, hpMax: 1e9, hp2: Math.round(e.hpMax * 0.05), hpMax2: Math.round(e.hpMax * 0.05), x: p[0], y: p[1], idx: 40, flash: 0, kb: 0, cd: S(1.5), q: 0, pt: 0, broken: 0, shield: 0, open: 0, inv: 0 });
    v.arm = a; G.E.push(a); }
  function armStep(a) { const e = a.body, v = e.enc.v; a.t++; if (a.flash > 0) a.flash--; a.kb = 0;
    if (a.cut) { a.alpha = Math.max(0, (a.alpha || 1) - 0.03); return; }
    if (a.home) { a.x = e.x; a.y = e.y; if (v.attach > 0 && --v.attach === 0) { a.home = 0; sever0(e, a); } return; }
    if (a.hold || a.flying) return;
    if (a.pt > 0) { a.pt++; if (a.pt === S(0.5)) { fx(e, N + '_impact', a.cx, a.y, { s: HH() * 1.4 / 45 }); if (near(a.cx, a.y, HH() * 0.9)) hit(e, 0.6); a.an2 = 'punch'; a.at2 = 0; } if (a.pt > S(0.9)) { a.pt = 0; a.cd = a.q > 0 ? S(0.2) : S(2.0); } return; }
    const d = Math.hypot(H.x - a.x, (H.y - a.y) * 1.5);
    if (--a.cd <= 0 && d < HH() * 1.7) { if (a.q > 0) a.q--; a.face = sgn(H.x - a.x) || 1; a.cx = a.x + a.face * HH() * 0.6; a.pt = 1; circle(a.cx, a.y, HH() * 0.9, S(0.5)); return; }
    if (d > HH() * 0.9) { a.an2 = 'crawl'; walkTo(a, H.x - sgn(H.x - a.x) * HH() * 0.8, H.y, a.q > 0 ? 2.6 : 1.5); } else a.an2 = 'idle'; }
  function sever0(e, a) { const v = e.enc.v; e.broken = 1; e.shield = 0.5; a.x = e.x + e.face * HH() * 1.2; a.y = e.y + 10; a.cd = S(1.5); fx(e, N + '_arm_burst', a.x, a.y - HH() * 0.3, { s: HH() * 1.6 / 9 }); G.UI.toast('鬼腕又斷開了'); }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.rain) { v.rain.t++; if (v.rain.t > v.rain.life) v.rain = null; }
    if (v.dis) v.dis.t++;
    const a = v.arm; if (a) { armStep(a); if (a.cut && !a.alpha) { G.E = G.E.filter(x => x !== a); v.armX = a.x; v.armY = a.y; v.arm = null; e.shield = 0; } }
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv && !v.dis) { v.ph = ph; e.inv = S(1.2); enc.cd = S(1.6); G.UI.toast(['', '', '茨木童子　怒髮衝冠', '茨木童子　詭計', '鬼腕　歸來'][ph]);
      if (ph >= 2 && !v.severed) sever(e); if (ph === 2) v.cd.rain = S(4); if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.armback = S(2); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'hurt' && e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 2.0); let k;
    if (v.ph >= 4 && !(v.cd.armback > 0) && v.severed && !(v.attach > 0)) { k = 'armback'; v.cd.armback = S(20); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = nr ? ['claw', 'claw', 'slam', 'jump'] : ['jump', 'claw'];
      if (!e.broken) L.push('throw', 'throw');
      if (v.ph >= 2) { if (!v.rain && !(v.cd.rain > 0)) L.push('rain'); if (v.arm && !v.arm.cut && !v.arm.home && !(v.cd.rush > 0)) L.push('rush'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'rain') v.cd.rain = S(24); if (k === 'rush') v.cd.rush = S(10); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(0.9, 1.4) : rnd(0.6, 1.0));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 1.6;
    if (d > want) { if (e.an !== 'walk') play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 2.0); } else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') toward(e); }

  /* ---------- 繪製 ---------- */
  function babaDraw(o, u) { const r = u.act[N + (o.moving ? '_baba_walk_right3q' : '_baba_idle_right3q')], fr = A.frameAt(Object.assign({}, r, { loop: true }), G.t * TK + (o.wt || 0) * 100); A.draw(u, fr, o.x, o.y, sc(o), flip(o.face, 1), 1); }
  function drawSelf(e) { const u = U(); if (!u) return true; const v = e.enc.v;
    if (e.arm) { if (e.home) return true; const n = e.flying ? 'arm_fly' : e.an2 === 'punch' && e.pt === 0 ? 'arm_punch' : e.pt > 0 ? 'arm_idle' : e.an2 === 'crawl' ? 'arm_crawl' : 'arm_idle', r = u.act[N + '_' + n + '_right3q'];
      const fr = A.frameAt(Object.assign({}, r, { loop: n !== 'arm_punch' }), (G.t + e.idx) * TK), s = sc(e);
      ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 0.45, HH() * 0.12, 0, 0, 6.283); ctx.fill();
      A.draw(u, fr, e.x, e.y - (e.flying ? HH() * 0.4 : 0), s, flip(e.face, 1), e.alpha); if (e.flash > 0) { ctx.save(); ctx.globalAlpha = e.flash / 12; A.draw(u, fr, e.x, e.y, s, flip(e.face, 1), 0.5); ctx.restore(); }
      if (!e.cut) { const w = 40, y = e.y - HH() * 0.9; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp2) / e.hpMax2, 3); }
      return true; }
    if (e.fake || (!e.arm && v.dis)) { e.moving = e.tx !== undefined && Math.hypot(e.tx - e.x, e.ty - e.y) > 4;
      if (!e.fake) { const hs = u.act[N + (e.broken ? '_horn_shadow_arm_missing' : '_horn_shadow')].f[0]; A.draw(u, hs, e.x, e.y + 4, HH() * 1.3 / 232, flip(e.face, 1), 0.55); }
      else { ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 0.4, HH() * 0.12, 0, 0, 6.283); ctx.fill(); }
      babaDraw(e, u); return true; }
    return !!e.hide; }
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    for (const p of v.pillars) A.draw(u, u.act[N + '_pillar'].f[0], p.x, p.y, HH() * 2.2 / 256, false, 1);
    if (v.drop) { ctx.save(); ctx.fillStyle = 'rgba(20,10,10,.45)'; ctx.beginPath(); ctx.ellipse(v.drop.x, v.drop.y, HH() * 0.8, HH() * 0.3, 0, 0, 6.283); ctx.fill(); ctx.restore(); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    if (v.fly && !(v.arm && v.arm.flying)) { const r = u.act[N + '_arm_fly_right3q'], fr = A.frameAt(r, v.fly.t * TK), dir = sgn((v.fly.echo ? e.x - v.fly.x : v.fly.x - e.x)) || 1; A.draw(u, fr, v.fly.x, v.fly.y - HH() * 0.5, sc(e), flip(dir, 1), v.fly.echo ? 0.45 : 1); }
    if (v.rain && !v.dis) { const q = Math.min(1, v.rain.t / 30, (v.rain.life - v.rain.t) / 30), g = ctx.createRadialGradient(H.x, H.y - HH() * 0.5, HH() * 2, H.x, H.y - HH() * 0.5, HH() * 5);
      g.addColorStop(0, 'rgba(10,10,20,0)'); g.addColorStop(1, `rgba(10,10,20,${0.75 * q})`); ctx.save(); ctx.fillStyle = g; ctx.fillRect(H.x - 1600, H.y - 900, 3200, 1800);
      const rf = A.frameAt(Object.assign({}, u.act[N + '_rain_screen'], { loop: true }), v.rain.t * TK); ctx.globalAlpha = 0.5 * q; for (let i = -2; i <= 2; i++) ctx.drawImage(u.imgs[rf[7]], rf[0], rf[1], rf[2], rf[3], H.x + i * HH() * 4 - HH() * 2, H.y - HH() * 4, HH() * 4, HH() * 5); ctx.restore(); }
    if (v.dis) { const q = 1 - v.dis.t / v.dis.life; G.txt('老婦之計 ' + Math.ceil(q * 6), H.x, H.y - HH() * 1.5, 12, '#ffd76a', 'center'); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.2, 12, '#ffd76a', 'center'); }

  B.reg('ibaraki', { name: '茨木童子', sub: '羅城門之鬼', unit: 'b_ibaraki', hpK: 9, atkK: 1.4, nat: 1, dir: 'right3q', brk: 'arm_missing', map: ['W_R05_03'],
    actors: [{ id: N, name: '茨木童子', size: 1.15, moves: [] }], mv: MV, director, drawSelf, drawUnder, drawOver,
    idle: e => { if (e.arm || e.fake) { if (e.st === 'hurt') e.st = 'walk'; return true; } return false; },
    init(enc) { const e = R(enc);
      if (SC.room(e.x, e.y) < 5) { const p = SC.snap(SC.def.w * 0.8, e.y, 'open', 500); if (p) { e.x = p[0]; e.y = p[1]; } }   // 雙井水橋中央是水：移到右側空地開打
      const v = enc.v = { ph: 1, cd: {}, pillars: [], fakes: [], arm: null, fly: null, drop: null, rain: null, dis: null, severed: 0, attach: 0, t: 0 };
      for (const k of [-4, -2.2, 2.2, 4]) { const p = SC.snap(e.x - HH() * 1.5 + k * HH(), e.y + (k > 0 ? 18 : -18), 'open', 120); if (p && !v.pillars.some(q => Math.abs(q.x - p[0]) < HH())) v.pillars.push({ x: p[0], y: p[1] }); }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; const L = v.fakes.concat(v.arm ? [v.arm] : []); for (const x of L) { x.st = 'dead'; x.alpha = 0; } G.E = G.E.filter(x => !L.includes(x)); v.fakes = []; v.arm = null; v.fly = null; v.rain = null; v.dis = null; },
    preDamage(e) { const v = e.enc.v; if (e.hide) return true;
      if (e.fake) { if (v.dis && !e.poof) { e.poof = 1; fx(e, N + '_disguise_smoke', e.x, e.y - HH() * 0.5, { s: HH() * 2.4 / 95 }); G.UI.toast('是假的！'); hit(e.enc.units[0], 0.6); e.alpha = 0; e.st = 'dead'; v.fakes = v.fakes.filter(f => f !== e); G.E = G.E.filter(x => x !== e); } return true; }
      if (e.arm) return !!(e.cut || e.home);
      if (v.dis) { reveal(e, 1); if (e.mv) { e.mv.won = e.mv.t; } return true; }
      return false; },
    onDamage(e, d) { if (e.arm) { e.hp = 1e9; e.hp2 -= d; e.flash = 10; if (e.flying) e.cut = 1; if (e.hp2 <= 0) { e.cut = 1; e.alpha = 1; G.UI.toast('鬼腕被打倒了——本體不再減傷'); e.body.shield = 0; } e.st = 'walk'; return true; }
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
