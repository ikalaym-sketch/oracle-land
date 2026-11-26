/* ==========================================================================
 * 神諭之地 重製版 — 42_boss_susanoo.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。天空浮島副本頭目「素戔嗚尊」（D_SKY_04 天空神殿），P3 原圖（面向右），兩階段（同一把神劍，二階神力覺醒）。
 *           ‧ 一階：橫斬／上挑／突刺（直線）／劈落（前方圈＋地裂）／閃避後撤。
 *           ‧ 二階（50% 以下，覺醒）：一階四招全部加快＋
 *             劍氣波（蓄力 0.9 秒→扇形劍氣往前推進）／龍捲（落點線 0.8 秒→龍捲沿直線移動 2.3 秒）／
 *             落雷（主角位置連落 3 道，各預警 0.7 秒）；連續大招後「風暴收勢」破綻 2 秒。
 * 依賴    : 26_boss（G.BOSS.reg／api）、03_actors（hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, TK, HH } = B.api;
  const N = 'susanoo', U = () => A.get('b_susanoo'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const play = (e, n, l) => play0(e, 'p' + e.enc.v.f + '_' + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  const sp = e => e.enc.v.f === 2 ? 0.8 : 1;   // 二階加快
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  const fxs = (e, n, x, y, w) => fx(e, 'fx_' + n, x, y, { s: w / 240 });
  /* 前方弧通用：clip 片段、判定時間、範圍、倍率、特效 */
  function swing(clip, at, r, mul, f) { return { go(e, m) { toward(e); m.at = Math.round(S(at) * sp(e)); play(e, 'guard'); m.cx = e.x + e.face * HH() * 0.9; circle(m.cx, e.y, HH() * r, m.at); },
      step(e, m) { if (m.t === m.at - S(0.3)) play(e, clip);
        if (m.t === m.at) { fxs(e, 'blade_glow', e.x + e.face * HH() * 0.4, e.y - HH() * 0.8, HH() * 1.6); fxs(e, f, m.cx, e.y - HH() * 0.6, HH() * 2.4); if (near(m.cx, e.y, HH() * r) && hit(e, mul)) { fxs(e, 'sword_hit', H.x, H.y - HH() * 0.6, HH() * 1.4); if (clip === 'overhead') knock(e, HH() * 0.6); } if (clip === 'overhead') { fxs(e, 'ground_cut', m.cx, e.y, HH() * 2.4); SC.shake = 5; } }
        return m.t > m.at + S(0.5); } }; }
  const MV = {
    slash1: swing('slash1', 0.55, 1.3, 1.0, 'slash_horizontal'),
    slash2: swing('slash2', 0.5, 1.2, 1.0, 'slash_rising'),
    overhead: swing('overhead', 0.8, 1.5, 1.4, 'overhead_arc'),
    thrust: { go(e, m) { toward(e); play(e, 'guard'); m.at = Math.round(S(0.65) * sp(e)); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d; m.x0 = e.x; m.y0 = e.y;
        m.end = dashEnd(e.x, e.y, m.dx, m.dy * 0.7, HH() * 2.6); m.L = [e.x, e.y, e.x + m.dx * HH() * 4, e.y + m.dy * HH() * 4 * 0.7]; lane(...m.L, HH() * 0.9, m.at); },
      step(e, m) { if (m.t === m.at - S(0.3)) play(e, 'thrust');
        if (m.t > m.at && m.t <= m.at + S(0.15)) { const q = (m.t - m.at) / S(0.15); e.x = m.x0 + (m.end[0] - m.x0) * q; e.y = m.y0 + (m.end[1] - m.y0) * q; }
        if (m.t === m.at + 4) { fxs(e, 'thrust_streak', e.x + e.face * HH() * 0.8, e.y - HH() * 0.6, HH() * 2.4); if (inLane(...m.L, HH() * 0.55)) hit(e, 1.2); }
        return m.t > m.at + S(0.7); } },
    evade: { go(e, m) { play(e, 'evade'); const s = sgn(e.x - H.x) || 1; m.p = SC.snap(e.x + s * HH() * 2.2, e.y, 'walk', 120) || [e.x, e.y]; m.x0 = e.x; m.y0 = e.y; fxs(e, 'step_dust', e.x, e.y, HH() * 1.4); },
      step(e, m) { if (m.t <= S(0.35)) { const q = m.t / S(0.35); e.x = m.x0 + (m.p[0] - m.x0) * q; e.y = m.y0 + (m.p[1] - m.y0) * q; } return m.t > S(0.7); } },
    awaken: { go(e, m) { play0(e, 'p1_phase_transition'); e.inv = S(2.2); fxs(e, 'phase_wake', e.x, e.y - HH() * 0.6, HH() * 3); G.UI.banner('素戔嗚尊', '神劍覺醒'); },
      step(e, m) { if (m.t === S(1.0)) { e.enc.v.f = 2; play(e, 'sword_awaken'); SC.shake = 6; } return m.t > S(2.0); } },
    /* —— 二階 —— */
    wave: { go(e, m) { toward(e); play(e, 'wave_charge'); fxs(e, 'sword_charge', e.x, e.y - HH() * 0.8, HH() * 2); m.a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); e.enc.v.fans.push({ x: e.x, y: e.y, a: m.a, r: HH() * 6, half: 0.38, t: 0, life: S(0.9) }); },
      step(e, m) { if (m.t === S(0.9) - S(0.3)) play(e, 'wave_release');
        if (m.t === S(0.9)) e.enc.v.waves.push({ x: e.x, y: e.y, a: m.a, r: HH() * 0.8, t: 0, life: S(0.9), hit: 0 });
        return m.t > S(1.5); } },
    tornado: { go(e, m) { toward(e); play(e, 'tornado_cast'); fxs(e, 'wind_gather', e.x, e.y - HH() * 0.6, HH() * 2); const a = Math.atan2(H.y - e.y, H.x - e.x); m.L = [e.x + Math.cos(a) * HH(), e.y + Math.sin(a) * HH() * 0.6, H.x + Math.cos(a) * HH() * 2.5, H.y + Math.sin(a) * HH() * 1.2]; lane(...m.L, HH() * 1.3, S(0.8), '150,220,200'); },
      step(e, m) { if (m.t === S(0.8)) e.enc.v.torn.push({ L: m.L, t: 0, life: S(2.3), cd: 0 }); return m.t > S(1.3); } },
    bolt: { go(e, m) { toward(e); play(e, 'lightning_cast'); m.p = []; },
      step(e, m) { for (let i = 0; i < 3; i++) { const t0 = S(0.3 + i * 0.5); if (m.t === t0) { m.p[i] = [H.x, H.y]; circle(H.x, H.y, HH() * 0.9, S(0.7), '200,200,255'); fxs(e, 'lightning_warning', H.x, H.y - HH() * 0.3, HH() * 1.8); }
          if (m.t === t0 + S(0.7)) { const [x, y] = m.p[i]; fxs(e, 'lightning_bolt', x, y - HH() * 0.9, HH() * 2.4); fxs(e, 'lightning_hit', x, y, HH() * 1.6); if (near(x, y, HH() * 0.9)) hit(e, 1.0); } }
        return m.t > S(0.3 + 1.0) + S(0.9); } },
    storm: { go(e, m) { play(e, 'storm_recover'); e.open = S(2); G.UI.toast('素戔嗚尊收勢——破綻！'); }, step(e, m) { return m.t > S(1.0); } }
  };

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (/^(hurt|idle|run|walk|stagger)$/.test(e.an)) play(e, e.an, e.aloop);
    for (const f of v.fans) f.t++; v.fans = v.fans.filter(f => f.t < f.life);
    for (const w of v.waves) { w.t++; w.x += Math.cos(w.a) * 7; w.y += Math.sin(w.a) * 7 / 1.6; w.r = HH() * (0.8 + w.t / w.life * 1.4); if (!w.hit && near(w.x, w.y, w.r)) { w.hit = 1; hit(e, 1.3); } } v.waves = v.waves.filter(w => w.t < w.life);
    for (const t of v.torn) { t.t++; const q = t.t / t.life; t.x = t.L[0] + (t.L[2] - t.L[0]) * q; t.y = t.L[1] + (t.L[3] - t.L[1]) * q; if (--t.cd <= 0 && near(t.x, t.y, HH() * 0.9)) { hit(e, 0.7); t.cd = 30; knock({ x: t.x }, HH() * 0.3); } } v.torn = v.torn.filter(t => t.t < t.life);
    if (v.f === 1 && e.hp < e.hpMax * 0.5 && !e.mv) { begin(e, 'awaken'); v.big = 0; enc.cd = S(0.8); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (!/storm|idle|stagger/.test(e.an)) play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), nr = d < HH() * 2.0; let k;
    if (v.f === 2 && v.big >= 3) { k = 'storm'; v.big = 0; }
    else { const L = d < HH() * 0.9 ? ['evade', 'slash1', 'slash2'] : nr ? ['slash1', 'slash2', 'overhead', 'thrust'] : ['thrust', 'thrust'];
      if (v.f === 2) { if (!(v.cd.wave > 0)) L.push('wave'); if (!(v.cd.tornado > 0)) L.push('tornado'); if (!(v.cd.bolt > 0)) L.push('bolt'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'wave') v.cd.wave = S(7); if (k === 'tornado') v.cd.tornado = S(9); if (k === 'bolt') v.cd.bolt = S(8); if (/wave|tornado|bolt/.test(k)) v.big++; }
    begin(e, k); enc.cd = S(v.f === 1 ? rnd(0.8, 1.3) : rnd(0.5, 0.9));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 1.7;
    if (d > want) { if (!/run$/.test(e.an)) play(e, 'run', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, e.enc.v.f === 2 ? 3.0 : 2.4); } else if (!/idle$/.test(e.an)) play(e, 'idle', true); if (/idle$/.test(e.an)) toward(e); }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v;
    for (const f of v.fans) { const q = f.t / f.life; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 1 / 1.6); ctx.fillStyle = `rgba(150,210,255,${0.15 + 0.25 * q})`; ctx.strokeStyle = 'rgba(170,220,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.r, f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const wf = u.act.fx_wave_fan; for (const w of v.waves) { const fr = A.frameAt(Object.assign({}, wf, { loop: true }), w.t * TK); ctx.save(); ctx.translate(w.x, w.y - HH() * 0.4); ctx.rotate(Math.atan2(Math.sin(w.a) / 1.6, Math.cos(w.a))); const k = w.r * 2 / fr[2]; ctx.globalAlpha = Math.min(1, (w.life - w.t) / 10); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    for (const t of v.torn) { const n = t.t < 30 ? 'fx_tornado_birth' : t.life - t.t < 30 ? 'fx_tornado_end' : 'fx_tornado_loop', r = u.act[n]; A.draw(u, A.frameAt(Object.assign({}, r, { loop: true }), t.t * TK), t.x, t.y - HH() * 0.2, HH() * 2.4 / 246, false, 1); }
    if (v.f === 2 && e.st !== 'dead') { const r = u.act.fx_wind_ribbons; A.draw(u, A.frameAt(Object.assign({}, r, { loop: true }), v.t * TK), e.x, e.y - HH() * 0.5, HH() * 1.8 / 237, false, 0.35); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('susanoo', { name: '素戔嗚尊', sub: '天空神殿', unit: 'b_susanoo', hpK: 12, atkK: 1.6, nat: 1, dir: 'x', map: ['D_SKY_04'],
    actors: [{ id: N, name: '素戔嗚尊', size: 1.25, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { enc.v = { f: 1, cd: { wave: S(2), tornado: S(4), bolt: S(3) }, fans: [], waves: [], torn: [], big: 0, t: 0 }; enc.cd = S(1.2); play0(R(enc), 'p1_battle_intro'); },
    finish(enc) { const v = enc.v; v.fans = []; v.waves = []; v.torn = []; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
