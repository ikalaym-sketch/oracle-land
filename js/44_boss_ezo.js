/* ==========================================================================
 * 神諭之地 重製版 — 44_boss_ezo.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。北海蝦夷副本頭目：熊靈＋爐火女神（雙體主王，D_EZO_04 暖爐小屋）；爐火女神・爐火試影（D_EZO_02，單體、只有一階）、熊靈・守域試影（D_EZO_03，單體、只有一階）。
 *           P3 原圖（面向右），兩隻各自兩階段（各自血量 50% 以下進二階）；兩隻錯開出手，同一時間只有一隻出大招。
 *           ‧ 熊靈：熊爪橫掃（前方弧）／撲咬（短撲）／肩撞（短衝撞＋擊退）／咆哮（周身震退）／後撤；
 *             二階＋神力衝鋒（0.74 秒鎖定方向→直線衝鋒，撞牆即煞停）／大地震擊（裂地波沿直線推進）。
 *           ‧ 爐火女神：火球（直線）／爐火橫掃（前方扇）／火柱（主角位置，預警 0.9 秒）／餘燼爆（周身圈）／後撤；
 *             二階＋火蛇（4 條：2 條直行、2 條轉向追人）／火靈護身（6 秒：3 團火靈環身，身邊半徑內每 0.5 秒灼傷一次，不疊加）。
 *           ‧ 其中一隻倒下後，另一隻出手間隔縮短 20%。兩隻都倒下才結束。
 * 依賴    : 26_boss（G.BOSS.reg／api，多 actor）、03_actors（hurtHero）。圖集 b_ezo（bear_*／hearth_*）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, alive, TK, HH } = B.api;
  const U = () => A.get('b_ezo');
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const play = (e, n, l) => play0(e, 'p' + (e.f || 1) + '_' + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  const fxs = (e, n, x, y, w) => fx(e, 'fx_' + n, x, y, { s: w / 255 });
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  function fanHit(x, y, ang, r, half) { const dx = H.x - x, dy = (H.y - y) * 1.6, d = Math.hypot(dx, dy); if (d > r) return false; let a = Math.atan2(dy, dx) - ang; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < half; }
  function arcMove(clip, at, r, mul, f, kb) { return { go(e, m) { toward(e); play(e, 'guard'); m.cx = e.x + e.face * HH() * e.size * 0.6; circle(m.cx, e.y, HH() * r, S(at)); },
      step(e, m) { if (m.t === S(at) - S(0.3)) play(e, clip); if (m.t === S(at)) { fxs(e, f, m.cx, e.y - HH() * 0.5, HH() * r * 1.8); if (near(m.cx, e.y, HH() * r) && hit(e, mul) && kb) knock(e, HH() * kb); } return m.t > S(at + 0.5); } }; }
  function step(e, m, dist) { const s = sgn(e.x - H.x) || 1; m.p = SC.snap(e.x + s * HH() * dist, e.y + rnd(-25, 25), 'walk', 140) || [e.x, e.y]; m.x0 = e.x; m.y0 = e.y; }
  const slide = (e, m, t0, dur) => { if (m.t > t0 && m.t <= t0 + dur) { const q = (m.t - t0) / dur; e.x = m.x0 + (m.p[0] - m.x0) * q; e.y = m.y0 + (m.p[1] - m.y0) * q; } };
  const MV = {
    /* —— 熊靈 —— */
    claw: arcMove('claw_sweep', 0.6, 1.5, 1.1, 'claw_arc', 0.5),
    roar: { go(e, m) { play(e, 'roar'); circle(e.x, e.y, HH() * 2.4, S(0.7)); }, step(e, m) { if (m.t === S(0.7)) { fxs(e, 'roar_ring', e.x, e.y - HH() * 0.3, HH() * 4.4); if (near(e.x, e.y, HH() * 2.4) && hit(e, 0.8)) knock(e, HH() * 1.3); } return m.t > S(1.2); } },
    bite: { go(e, m) { toward(e); play(e, 'guard'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.x0 = e.x; m.y0 = e.y; m.p = dashEnd(e.x, e.y, dx / d, dy / d * 0.7, Math.max(0, Math.min(d - HH() * e.size * 0.7, HH() * 2.2))); lane(e.x, e.y, m.p[0], m.p[1], HH() * 1.1, S(0.5)); },
      step(e, m) { if (m.t === S(0.5) - S(0.25)) play(e, 'bite'); slide(e, m, S(0.5), S(0.2));
        if (m.t === S(0.7)) { const hx = e.x + e.face * HH() * e.size * 0.6; fxs(e, 'bite_snap', hx, e.y - HH() * 0.4, HH() * 1.6); if (near(hx, e.y, HH() * 1.0)) hit(e, 1.2); } return m.t > S(1.2); } },
    shove: { go(e, m) { toward(e); play(e, 'guard'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.x0 = e.x; m.y0 = e.y; m.p = dashEnd(e.x, e.y, dx / d, dy / d * 0.7, HH() * 2.4); m.L = [e.x, e.y, m.p[0], m.p[1]]; lane(...m.L, HH() * 1.3, S(0.6)); },
      step(e, m) { if (m.t === S(0.6) - S(0.2)) play(e, 'shoulder_shove'); slide(e, m, S(0.6), S(0.25));
        if (m.t === S(0.75)) { fxs(e, 'shoulder_impact', e.x + e.face * HH(), e.y - HH() * 0.4, HH() * 2); if (inLane(...m.L, HH() * 0.8) && hit(e, 1.1)) knock(e, HH() * 1.2); } return m.t > S(1.3); } },
    bback: { go(e, m) { play(e, 'backstep'); step(e, m, 2.0); }, step(e, m) { slide(e, m, 0, S(0.4)); return m.t > S(0.7); } },
    charge: { go(e, m) { play(e, 'charge_start'); fxs(e, 'charge_direction', e.x, e.y - HH() * 0.3, HH() * 2.4); },
      step(e, m) { if (m.t === S(0.74)) { toward(e); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d * 0.7; m.x0 = e.x; m.y0 = e.y; m.p = dashEnd(e.x, e.y, m.dx, m.dy, HH() * 7); lane(e.x, e.y, m.p[0], m.p[1], HH() * 1.4, S(0.4), '240,170,80'); }
        if (m.t === S(1.14)) play(e, 'charge_loop', true);
        if (m.t > S(1.14) && !m.done) { const nx = e.x + m.dx * 9, ny = e.y + m.dy * 9; if (Math.hypot(m.p[0] - e.x, m.p[1] - e.y) < 10 || !SC.walkable(nx, ny)) { m.done = m.t; play(e, 'charge_brake'); fxs(e, 'brake_debris', e.x, e.y, HH() * 2.2); SC.shake = 4; } else { e.x = nx; e.y = ny; }
          if (!m.hit && near(e.x, e.y, HH() * e.size * 0.7)) { m.hit = 1; if (hit(e, 1.5)) knock(e, HH() * 1.5); } }
        return m.done && m.t - m.done > S(0.8); } },
    slam: { go(e, m) { toward(e); play(e, 'earth_slam'); fxs(e, 'slam_warning', e.x + e.face * HH(), e.y, HH() * 2.4); const a = Math.atan2(H.y - e.y, H.x - e.x); m.L = [e.x, e.y, e.x + Math.cos(a) * HH() * 7, e.y + Math.sin(a) * HH() * 7 * 0.6]; lane(...m.L, HH() * 1.2, S(0.58), '220,180,90'); },
      step(e, m) { if (m.t === S(0.58)) { fxs(e, 'palm_flash', e.x + e.face * HH() * 0.8, e.y, HH() * 1.6); fxs(e, 'slam_dust', e.x + e.face * HH() * 0.8, e.y, HH() * 2); SC.shake = 6; e.enc.v.rifts.push({ L: m.L, t: 0, life: S(0.8), hit: 0 }); } return m.t > S(1.3); } },
    /* —— 爐火女神 —— */
    bolt: { go(e, m) { toward(e); play(e, 'firebolt'); fxs(e, 'palm_charge', e.x + e.face * HH() * 0.4, e.y - HH() * 0.7, HH() * 1.2); },
      step(e, m) { if (m.t === S(0.55)) { fxs(e, 'cast_flash', e.x + e.face * HH() * 0.5, e.y - HH() * 0.7, HH() * 1.2); e.enc.v.bolts.push({ x: e.x + e.face * HH() * 0.5, y: e.y, a: Math.atan2(H.y - e.y, H.x - e.x), t: 0, life: S(1.6), e }); } return m.t > S(1.0); } },
    sweep: { go(e, m) { toward(e); play(e, 'hearth_sweep'); m.a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); e.enc.v.fans.push({ x: e.x, y: e.y, a: m.a, r: HH() * 2.8, half: 0.6, t: 0, life: S(0.6) }); },
      step(e, m) { if (m.t === S(0.6)) { fxs(e, 'hearth_sweep', e.x + Math.cos(m.a) * HH() * 1.3, e.y + Math.sin(m.a) * HH() * 0.8 - HH() * 0.3, HH() * 2.8); if (fanHit(e.x, e.y, m.a, HH() * 2.8, 0.6)) hit(e, 1.0); } return m.t > S(1.1); } },
    pillar: { go(e, m) { toward(e); play(e, 'fire_pillar'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 1.0, S(0.9), '250,120,50'); fxs(e, 'pillar_warning', m.x, m.y, HH() * 1.8); },
      step(e, m) { if (m.t === S(0.9)) { fxs(e, 'fire_pillar', m.x, m.y - HH() * 0.8, HH() * 2.2); if (near(m.x, m.y, HH() * 1.0)) hit(e, 1.2); } return m.t > S(1.3); } },
    ember: { go(e, m) { play(e, 'ember_burst'); circle(e.x, e.y, HH() * 1.9, S(0.6), '250,140,60'); },
      step(e, m) { if (m.t === S(0.6)) { fxs(e, 'ember_burst', e.x, e.y - HH() * 0.4, HH() * 3.6); if (near(e.x, e.y, HH() * 1.9) && hit(e, 1.0)) knock(e, HH() * 0.8); } return m.t > S(1.1); } },
    hback: { go(e, m) { play(e, 'backstep'); step(e, m, 2.6); }, step(e, m) { slide(e, m, 0, S(0.4)); return m.t > S(0.7); } },
    serpent: { go(e, m) { toward(e); play(e, 'serpent_cast'); fxs(e, 'palm_charge', e.x, e.y - HH() * 0.8, HH() * 1.6); },
      step(e, m) { if (m.t === S(0.8)) play(e, 'serpent_release');
        if (m.t === S(0.95)) for (let i = 0; i < 4; i++) { const a = Math.atan2(H.y - e.y, H.x - e.x) + [-0.5, -0.17, 0.17, 0.5][i]; e.enc.v.snakes.push({ x: e.x, y: e.y - HH() * 0.3, a, turn: i === 0 || i === 3, t: -i * 4, life: S(2.0), e, hit: 0 }); fxs(e, 'serpent_birth', e.x, e.y - HH() * 0.4, HH() * 1.6); }
        return m.t > S(1.5); } },
    aura: { go(e, m) { play(e, 'aura_start'); fxs(e, 'spirit_birth', e.x, e.y - HH() * 0.6, HH() * 2); },
      step(e, m) { if (m.t === S(0.58)) { e.aura = S(6); G.UI.toast('火靈護身——離女神遠一點'); play(e, 'aura_sustain', true); } return m.t > S(1.0); } },
    /* 轉階 */
    wake: { go(e, m) { play0(e, 'p1_phase_transition'); e.inv = S(1.6); fxs(e, e.actor === 'bear' ? 'divine_wake' : 'phase_wake', e.x, e.y - HH() * 0.6, HH() * 3); G.UI.toast(e.name + '　覺醒'); },
      step(e, m) { if (m.t === S(1.0)) { e.f = 2; play(e, e.actor === 'bear' ? 'divine_roar' : 'idle', e.actor !== 'bear'); } return m.t > S(1.6); } }
  };
  const SET = { bear: { near: ['claw', 'claw', 'bite', 'shove', 'roar'], far: ['shove', 'bite'], p2: ['charge', 'slam'], back: 'bback', want: 1.8 },
    hearth: { near: ['ember', 'sweep', 'hback'], far: ['bolt', 'bolt', 'pillar', 'sweep'], p2: ['serpent', 'aura'], back: 'hback', want: 3.2 } };

  function director(enc) { const v = enc.v; v.t++;
    for (const b of v.bolts) { b.t++; b.x += Math.cos(b.a) * 6; b.y += Math.sin(b.a) * 6 * 0.7; if (Math.hypot(H.x - b.x, (H.y - b.y) * 1.4) < HH() * 0.5) { b.t = b.life; hit(b.e, 0.9); fxs(b.e, 'firebolt_hit', b.x, b.y - HH() * 0.5, HH() * 1.4); } } v.bolts = v.bolts.filter(b => b.t < b.life);
    for (const s of v.snakes) { s.t++; if (s.t < 0) continue; if (s.turn && s.t > 20 && s.t < 70) { const w = Math.atan2(H.y - s.y, H.x - s.x), da = Math.atan2(Math.sin(w - s.a), Math.cos(w - s.a)); s.a += Math.max(-0.035, Math.min(0.035, da)); }
      s.x += Math.cos(s.a) * 5; s.y += Math.sin(s.a) * 5 * 0.7; if (!s.hit && Math.hypot(H.x - s.x, (H.y - s.y) * 1.4) < HH() * 0.55) { s.hit = 1; s.t = s.life; hit(s.e, 0.9); fxs(s.e, 'serpent_impact', s.x, s.y - HH() * 0.4, HH() * 1.6); } } v.snakes = v.snakes.filter(s => s.t < s.life);
    for (const f of v.fans) f.t++; v.fans = v.fans.filter(f => f.t < f.life);
    for (const r of v.rifts) { r.t++; const q = r.t / r.life, x = r.L[0] + (r.L[2] - r.L[0]) * q, y = r.L[1] + (r.L[3] - r.L[1]) * q; r.x = x; r.y = y; if (!r.hit && near(x, y, HH() * 0.9)) { r.hit = 1; hit(enc.units[0], 1.2); } } v.rifts = v.rifts.filter(r => r.t < r.life);
    const L = alive(enc); if (!L.length) return;
    for (const e of L) { if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (e.cdm > 0) e.cdm--; if (e.aura > 0) { if (--e.aura === 0) { play(e, 'aura_end'); fxs(e, 'aura_fade', e.x, e.y - HH() * 0.5, HH() * 2); } else if (e.aura % 30 === 0 && near(e.x, e.y, HH() * 1.9)) hit(e, 0.35); }
      if (/^(hurt|idle|run|walk|stagger|down)$/.test(e.an)) play(e, e.an, e.aloop); }
    const busy = L.some(e => e.mv && e.mv.big);
    for (const e of L) {
      if (!e.f) e.f = 1; if (e.f === 1 && !v.solo && e.hp < e.hpMax * 0.5 && !e.mv) { begin(e, 'wake'); continue; }
      if (e.mv || e.st === 'hurt') continue;
      if (e.open > 0) { if (!/idle|stagger|recover/.test(e.an)) play(e, 'idle', true); continue; }
      if (e.cdm > 0) { keep(e); continue; }
      const S0 = SET[e.actor], d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5); let list = d < HH() * 2.2 ? S0.near.slice() : S0.far.slice();
      if (d < HH() * 0.8 && e.actor === 'hearth') list = [S0.back, 'ember'];
      if ((e.f === 2 || (v.solo && e.actor === 'bear')) && !busy && !(e.bigCd > 0)) list.push(...(v.solo ? ['slam'] : S0.p2));
      if (e.aura > 0) list = list.filter(k => k !== 'aura');
      const k = list[Math.floor(Math.random() * list.length)]; begin(e, k); if (/charge|slam|serpent|aura/.test(k)) { e.mv.big = 1; e.bigCd = S(7); }
      e.cdm = S(rnd(1.3, 2.0) * (L.length === 1 ? 0.8 : 1) * (v.solo ? 0.8 : 1)); }
    for (const e of L) if (e.bigCd > 0) e.bigCd--;
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * SET[e.actor].want, side = e.actor === 'bear' ? 0 : 40;
    if (Math.abs(d - want) > HH() * 0.5) { if (!/walk$/.test(e.an)) play(e, 'walk', true); const s = d > want ? 1 : -1; walkTo(e, H.x - sgn(H.x - e.x) * want, H.y + side, e.actor === 'bear' ? 1.9 : 1.6); }
    else if (!/idle$|sustain$/.test(e.an)) play(e, 'idle', true); if (/idle$/.test(e.an)) toward(e); }

  /* ---------- 繪製 ---------- */
  const loopF = (u, n, t) => A.frameAt(Object.assign({}, u.act[n], { loop: true }), t * TK);
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    for (const f of v.fans) { const q = f.t / f.life; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 1 / 1.6); ctx.fillStyle = `rgba(250,140,60,${0.15 + 0.25 * q})`; ctx.strokeStyle = 'rgba(255,160,80,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.r, f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    for (const e of enc.units) if (e.aura > 0 && e.st !== 'dead') { A.draw(u, loopF(u, 'fx_dot_boundary', v.t), e.x, e.y, HH() * 4.2 / 255, false, 0.8); if (e.aura % 30 < 12) A.draw(u, loopF(u, 'fx_dot_pulse', v.t), e.x, e.y, HH() * 3.8 / 255, false, 0.5); }
    for (const r of v.rifts) if (r.x !== undefined) { A.draw(u, loopF(u, 'fx_rift_wave', r.t), r.x, r.y, HH() * 2.4 / 255, r.L[2] < r.L[0], 1); A.draw(u, u.act.fx_ground_cracks.f[2], (r.L[0] + r.x) / 2, (r.L[1] + r.y) / 2, HH() * 2.4 / 255, false, 0.6); } }
  function drawOver(enc) { const v = enc.v, u = U(); if (!u) return;
    const fb = u.act.fx_firebolt; for (const b of v.bolts) { const fr = A.frameAt(Object.assign({}, fb, { loop: true }), b.t * TK); ctx.save(); ctx.translate(b.x, b.y - HH() * 0.6); ctx.rotate(b.a); const k = HH() * 1.2 / 256; ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    for (const s of v.snakes) if (s.t >= 0) { const fr = loopF(u, s.turn ? 'fx_serpent_turn' : 'fx_serpent_straight', s.t); ctx.save(); ctx.translate(s.x, s.y - HH() * 0.3); ctx.rotate(s.a); const k = HH() * 1.6 / 255; ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    for (const e of enc.units) { if (e.st === 'dead') continue;
      if (e.aura > 0) for (let i = 0; i < 3; i++) { const a = v.t * 0.06 + i * 2.094; A.draw(u, loopF(u, 'fx_fire_spirit', v.t + i * 9), e.x + Math.cos(a) * HH() * 1.0, e.y - HH() * 0.5 + Math.sin(a) * HH() * 0.35, HH() * 0.8 / 255, false, 0.95); }
      if (e.actor === 'bear' && e.f === 2) A.draw(u, loopF(u, 'fx_rage_aura', v.t), e.x, e.y - HH() * 0.6, HH() * 2.4 / 255, false, 0.4);
      if (e.open > 0) G.txt('破綻！', e.x, e.y - HH() * e.size * 1.1, 12, '#ffd76a', 'center'); } }
  function drawSelf(e) { if (!e.enc.v.solo) return false;   // 試影：半透明藍調
    const u = U(); if (!u) return true; const fr = B.api.frameOf(e, e.an, e.at, e.aloop) || B.api.frameOf(e, 'p1_idle', G.t * TK, true); if (!fr) return true;
    ctx.save(); ctx.globalAlpha = 0.75; ctx.filter = 'hue-rotate(170deg) saturate(0.6) brightness(1.15)'; A.draw(u, fr, e.x, e.y, B.api.sc(e), B.api.flip(e.face, 1), 1); ctx.restore();
    if (e.st !== 'dead') { const w = 46, y = e.y - fr[5] * B.api.sc(e) - 6; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 3); }
    return true; }
  const common = { unit: 'b_ezo', atkK: 1.6, nat: 1, dir: 'x', mv: MV, director, drawUnder, drawOver, drawSelf, finish(enc) { const v = enc.v; v.bolts = []; v.snakes = []; v.fans = []; v.rifts = []; for (const e of enc.units) e.aura = 0; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } };
  B.reg('ezo', Object.assign({ name: '熊靈・爐火女神', sub: '暖爐小屋', hpK: 8, map: ['D_EZO_04'], actors: [{ id: 'bear', name: '熊靈', size: 1.5, moves: [] }, { id: 'hearth', name: '爐火女神', size: 1.15, moves: [] }],
    init(enc) { enc.v = { bolts: [], snakes: [], fans: [], rifts: [], t: 0 }; enc.units.forEach((e, i) => { e.f = 1; e.cdm = S(1.2 + i * 1.0); }); } }, common));
  B.reg('ezo_shadow', Object.assign({ name: '熊靈・守域試影', sub: '副本小頭目', hpK: 6, map: ['D_EZO_03'], actors: [{ id: 'bear', name: '熊靈試影', size: 1.5, moves: [] }],
    init(enc) { enc.v = { solo: 1, bolts: [], snakes: [], fans: [], rifts: [], t: 0 }; enc.units[0].f = 1; enc.units[0].cdm = S(1.2); } }, common));
  B.reg('ezo_shadow2', Object.assign({ name: '爐火女神・爐火試影', sub: '副本小頭目', hpK: 6, map: ['D_EZO_02'], actors: [{ id: 'hearth', name: '爐火試影', size: 1.15, moves: [] }],
    init(enc) { enc.v = { solo: 1, bolts: [], snakes: [], fans: [], rifts: [], t: 0 }; enc.units[0].f = 1; enc.units[0].cdm = S(1.2); } }, common));
})();
