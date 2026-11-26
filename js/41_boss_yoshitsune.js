/* ==========================================================================
 * 神諭之地 重製版 — 41_boss_yoshitsune.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。富士山副本頭目「源義經」（D_FUJI_04 山頂鳥居），P3 原圖（面向右），兩階段（著甲／卸盔散髮）。
 *           ‧ 一階：居合斬（直線突進）／斜斬連段（兩記前方弧）／低躍斬（落點圈）／反手收刀（周身圈）／後撤（被貼身時）。
 *           ‧ 二階（50% 以下）：卸盔破甲 → 召喚四天王（全場只一次：弁慶、伊勢義盛、龜井重清、常陸坊海尊）→ 持劍祈禱回血。
 *             祈禱時本體受的傷害改打「護體氣」（本體血量 10%）；打破護體氣＝祈禱中斷、四天王立刻消散、義經破勢 2.5 秒。
 *             首次祈禱約 180 秒補滿（以起手缺血量計算），之後每次約 60 秒；再次祈禱有新護體氣，但不再召回四天王。
 *             若先補滿血：強化四天王（出手更快、傷害 ×1.3，只疊一層），義經起身一起進攻；護體氣仍可打破。
 *           ‧ 四天王：不用另外打死；各自一招（弁慶橫掃／義盛射箭／重清迴斬／海尊落印），錯開出手。
 * 依賴    : 26_boss（G.BOSS.reg、extra 圖集）、03_actors（hurtHero）；四天王圖集 b_mb_benkei／b_mb_ise／b_mb_kamei／b_mb_kaison。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, end, sc, flip, TK, HH } = B.api;
  const N = 'yoshitsune', U = () => A.get('b_yoshitsune'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const play = (e, n, l) => play0(e, 'p' + e.enc.v.f + '_' + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  const F = n => 'fx_yoshitsune_' + n;
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  const MV = {
    iai: { go(e, m) { toward(e); play(e, 'guard'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d; m.x0 = e.x; m.y0 = e.y;
        m.end = dashEnd(e.x, e.y, m.dx, m.dy * 0.7, HH() * 3.4); m.L = [e.x, e.y, e.x + m.dx * HH() * 4, e.y + m.dy * HH() * 4 * 0.7]; lane(...m.L, HH() * 0.9, S(0.6)); },
      step(e, m) { if (m.t === S(0.6) - S(0.28)) play(e, 'iai');
        if (m.t > S(0.6) && m.t <= S(0.75)) { const q = (m.t - S(0.6)) / S(0.15); e.x = m.x0 + (m.end[0] - m.x0) * q; e.y = m.y0 + (m.end[1] - m.y0) * q; }
        if (m.t === S(0.7)) { fx(e, F('iai_slash'), (m.x0 + e.x) / 2, e.y - HH() * 0.6, { s: HH() * 3 / 256 }); if (inLane(...m.L, HH() * 0.55)) hit(e, 1.3); }
        return m.t > S(1.3); } },
    combo: { go(e, m) { toward(e); play(e, 'idle', true); m.i = 0; m.t0 = 0; arc(e, m); },
      step(e, m) { const k = m.t - m.t0; if (k === S(0.45) - S(0.25)) play(e, 'diagonal_combo');
        if (k === S(0.45)) { fx(e, F('combo_streaks'), m.cx, e.y - HH() * 0.6, { s: HH() * 2.2 / 256 }); if (near(m.cx, e.y, HH() * 1.2)) hit(e, 0.9); }
        if (k === S(0.45) + S(0.2) && ++m.i < 2) { m.t0 = m.t; arc(e, m); return false; }
        return m.i >= 2 && k > S(0.45) + S(0.5); } },
    leap: { go(e, m) { toward(e); play(e, 'low_leap'); m.x0 = e.x; m.y0 = e.y; const p = SC.snap(H.x, H.y, 'walk', 120) || [H.x, H.y]; m.tx = p[0] - sgn(H.x - e.x) * HH() * 0.3; m.ty = p[1]; circle(m.tx, m.ty, HH() * 1.2, S(0.7)); },
      step(e, m) { if (m.t <= S(0.7)) { const q = m.t / S(0.7); e.x = m.x0 + (m.tx - m.x0) * q; e.y = m.y0 + (m.ty - m.y0) * q; e.lift = Math.sin(q * Math.PI) * HH() * 0.9; }
        if (m.t === S(0.7)) { e.lift = 0; fx(e, F('leap_trail'), e.x, e.y - HH() * 0.4, { s: HH() * 2.4 / 256 }); fx(e, F('step_dust'), e.x, e.y, { s: HH() * 1.6 / 256 }); if (near(e.x, e.y, HH() * 1.2)) hit(e, 1.2); play(e, 'recover'); }
        return m.t > S(1.3); },
      stop(e) { e.lift = 0; } },
    sheath: { go(e, m) { play(e, 'reverse_sheath'); circle(e.x, e.y, HH() * 1.7, S(0.6)); },
      step(e, m) { if (m.t === S(0.6)) { fx(e, F('sheath_flash'), e.x, e.y - HH() * 0.6, { s: HH() * 3 / 256 }); if (near(e.x, e.y, HH() * 1.7) && hit(e, 1.1)) knock(e, HH() * 0.8); } return m.t > S(1.1); } },
    back: { go(e, m) { play(e, 'backstep'); const s = sgn(e.x - H.x) || 1; m.p = SC.snap(e.x + s * HH() * 2.2, e.y, 'walk', 120) || [e.x, e.y]; m.x0 = e.x; m.y0 = e.y; fx(e, F('step_dust'), e.x, e.y, { s: HH() * 1.4 / 256 }); },
      step(e, m) { if (m.t <= S(0.35)) { const q = m.t / S(0.35); e.x = m.x0 + (m.p[0] - m.x0) * q; e.y = m.y0 + (m.p[1] - m.y0) * q; } return m.t > S(0.65); } },
    /* 二階進場：卸盔 → 召喚四天王（一次）→ 祈禱 */
    phase: { go(e, m) { play0(e, 'p1_phase_transition'); e.inv = S(1.4); fx(e, F('phase_burst'), e.x, e.y - HH() * 0.6, { s: HH() * 3.4 / 256 }); G.UI.banner('源義經', '卸盔散髮'); },
      step(e, m) { const v = e.enc.v; if (m.t === S(1.3)) { v.f = 2; play(e, 'summon'); }
        if (m.t === S(1.8) && !v.summoned) { v.summoned = 1; summon(e); }
        return m.t >= S(2.6); },
      stop(e) { const v = e.enc.v; v.f = 2; if (!v.summoned) { v.summoned = 1; summon(e); } v.wantPray = S(180); } },
    /* 祈禱中（mv＝pray_loop）：補血；破氣或補滿結束 */
    praying: { go(e, m) { play(e, 'prayer_enter'); },
      step(e, m) { const v = e.enc.v; if (m.t === S(1.1)) play(e, 'prayer_loop', true);
        if (m.t > S(1.1)) { e.hp = Math.min(e.hpMax, e.hp + v.rate); if (m.t % 30 === 0) G.NUMS.push({ x: e.x, y: e.y - HH() * 1.4, v: '+' + Math.round(v.rate * 30), gold: true, t: 0 }); }
        if (e.hp >= e.hpMax) { empower(e); return true; }   // 護體氣保留：共戰時仍可打破
        return false; },
      stop(e) { } },
    breakq: { go(e, m) { play(e, 'prayer_break'); e.open = S(2.5); }, step(e, m) { if (m.t === S(0.75)) play(e, 'stagger'); return m.t > S(0.8); } }
  };
  function arc(e, m) { toward(e); m.cx = e.x + e.face * HH() * 0.9; circle(m.cx, e.y, HH() * 1.2, S(0.45)); }
  function prayer(e, T) { const v = e.enc.v; v.rate = Math.max(0.5, (e.hpMax - e.hp) / T); v.qi = v.qiMax = Math.round(e.hpMax * 0.10); v.qiOn = 1; v.prayers++;
    fx(e, F('qi_shell_form'), e.x, e.y - HH() * 0.6, { s: HH() * 2.6 / 256 }); G.UI.toast('義經在祈禱回血——打破護體氣！'); begin(e, 'praying'); }
  function summon(e) { const v = e.enc.v; G.UI.banner('四天王', '前來助陣'); v.rets = [];
    [['benkei', 'b_mb_benkei', 'benkei'], ['ise', 'b_mb_ise', 'ise_yoshimori'], ['kamei', 'b_mb_kamei', 'kamei_shigekiyo'], ['kaison', 'b_mb_kaison', 'hitachibo_kaison']].forEach(([k, u, a], i) => {
      const ang = i * 1.571 + 0.785, p = SC.snap(e.x + Math.cos(ang) * HH() * 2.4, e.y + Math.sin(ang) * HH() * 1.1, 'walk', 160) || [e.x + (i - 1.5) * 50, e.y];
      const r = Object.assign({}, e, { ret: k, ru: u, ra: a, mv: null, st: 'walk', boss: false, nobar: 1, hp: 1e9, hpMax: 1e9, x: p[0], y: p[1], idx: 50 + i, flash: 0, kb: 0, inv: 0, cd: S(1.5 + i * 0.9), act: null, an2: 'idle', at2: 0, size: k === 'benkei' ? 1.4 : 1.1 });
      fx(e, F('summon_gate'), r.x, r.y - HH() * 0.6, { s: HH() * 2 / 256 }); v.rets.push(r); G.E.push(r); }); }
  function dismiss(e) { const v = e.enc.v; for (const r of v.rets) { fx(e, F('retainer_dismiss'), r.x, r.y - HH() * 0.6, { s: HH() * 2 / 256 }); r.st = 'dead'; r.alpha = 0; } G.E = G.E.filter(x => !v.rets.includes(x)); v.rets = []; v.emp = 0; v.acts = []; }
  function empower(e) { const v = e.enc.v; play(e, 'empower_start'); if (!v.rets.length || v.emp) return; v.emp = 1; G.UI.banner('強化四天王', '義經與四天王一起進攻');
    fx(e, F('empower_gather'), e.x, e.y - HH() * 0.8, { s: HH() * 2.4 / 256 }); for (const r of v.rets) fx(e, F('retainer_receive'), r.x, r.y - HH() * 0.6, { s: HH() * 2 / 256 }); }
  /* 四天王出手 */
  function retStep(r, e) { const v = e.enc.v; r.at2 += TK; const emp = v.emp ? 1.3 : 1;
    if (r.act) { const a = r.act; a.t++;
      if (a.t === a.hitAt) { if (a.k === 'arrow') { v.arrows.push({ L: a.L, t: 0, life: 14 }); if (inLane(...a.L, HH() * 0.45)) hit(e, 0.9 * emp); }
        else { const fxn = { benkei: 'benkei_sweep_arc', kamei: 'kamei_shigekiyo_turn_arc', kaison: 'hitachibo_kaison_dream_release' }[r.ret]; const u = A.get(r.ru); if (u && u.act[fxn]) v.rfx.push({ u: r.ru, n: fxn, x: a.x, y: a.y - HH() * 0.4, t: 0, s: HH() * 2.2 / u.act[fxn].f[1][2] });
          if (near(a.x, a.y, a.r) && hit(e, (r.ret === 'benkei' ? 1.1 : 0.9) * emp) && r.ret !== 'kaison') knock(e, HH() * 0.5); } }
      if (a.t > a.hitAt + S(0.5)) { r.act = null; r.an2 = 'idle'; r.cd = S(v.emp ? rnd(2.0, 2.6) : rnd(3.2, 4.2)); } return; }
    const d = Math.hypot(H.x - r.x, (H.y - r.y) * 1.5), want = r.ret === 'ise' ? HH() * 4 : r.ret === 'kaison' ? HH() * 3 : HH() * 1.4;
    if (--r.cd <= 0 && d < want * 1.5) { r.face = sgn(H.x - r.x) || 1; const tl = S(0.75);
      if (r.ret === 'ise') { const a = Math.atan2((H.y - r.y) * 1.6, H.x - r.x), L = [r.x, r.y, r.x + Math.cos(a) * HH() * 7, r.y + Math.sin(a) * HH() * 7 / 1.6]; lane(...L, HH() * 0.7, tl, '230,220,140'); r.act = { k: 'arrow', L, t: 0, hitAt: tl }; r.an2 = 'aim'; }
      else if (r.ret === 'kaison') { circle(H.x, H.y, HH() * 1.1, S(0.9), '160,120,220'); r.act = { k: 'seal', x: H.x, y: H.y, r: HH() * 1.1, t: 0, hitAt: S(0.9) }; r.an2 = 'seal'; }
      else { const cx = r.ret === 'benkei' ? r.x + r.face * HH() * 0.9 : r.x, rr = r.ret === 'benkei' ? HH() * 1.4 : HH() * 1.5; circle(cx, r.y, rr, tl); r.act = { k: 'melee', x: cx, y: r.y, r: rr, t: 0, hitAt: tl }; r.an2 = r.ret === 'benkei' ? 'sweep' : 'turncut'; }
      r.at2 = 0; return; }
    if (Math.abs(d - want) > HH() * 0.4) { r.an2 = 'walk'; const s = sgn(r.x - H.x) || 1; walkTo(r, H.x + s * want, H.y + (r.idx % 2 ? 26 : -26), 1.6); } else { r.an2 = 'idle'; r.face = sgn(H.x - r.x) || 1; } }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (/^(hurt|idle|run|walk|down)$/.test(e.an)) play(e, e.an, e.aloop);
    for (const r of v.rets) retStep(r, e);
    for (const a of v.arrows) a.t++; v.arrows = v.arrows.filter(a => a.t < a.life);
    for (const f of v.rfx) f.t++; v.rfx = v.rfx.filter(f => f.t < 30);
    if (v.f === 1 && e.hp < e.hpMax * 0.5 && !e.mv) { begin(e, 'phase'); return; }
    if (v.wantPray && !e.mv) { prayer(e, v.wantPray); v.wantPray = 0; return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (!/stagger|idle|break/.test(e.an)) play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    if (v.f === 2 && !v.qiOn && e.hp < e.hpMax * 0.85 && !(v.cd.pray > 0)) { v.cd.pray = S(30); prayer(e, S(60)); return; }
    const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), nr = d < HH() * 2.0;
    const L = d < HH() * 0.9 ? ['back', 'sheath', 'combo'] : nr ? ['combo', 'combo', 'sheath', 'iai'] : ['iai', 'iai', 'leap'];
    const k = L[Math.floor(Math.random() * L.length)]; begin(e, k); enc.cd = S(v.f === 1 ? rnd(0.8, 1.3) : v.rets.length ? rnd(1.2, 1.8) : rnd(0.6, 1.0));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 1.8;
    if (d > want) { if (!/run$/.test(e.an)) play(e, 'run', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 2.6); } else if (!/idle$/.test(e.an)) play(e, 'idle', true); if (/idle$/.test(e.an)) toward(e); }

  /* ---------- 繪製 ---------- */
  function drawSelf(e) { if (!e.ret) return false; const u = A.get(e.ru); if (!u) return true;
    const r = u.act[e.ra + '_' + e.an2 + '_right3q'] || u.act[e.ra + '_idle_right3q'], fr = A.frameAt(Object.assign({}, r, { loop: /idle|walk/.test(e.an2) }), e.at2), s = sc(e);
    ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 0.45, HH() * 0.12, 0, 0, 6.283); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.92; A.draw(u, fr, e.x, e.y, s, flip(e.face, 1), 1); ctx.restore();
    const v = e.enc.v; if (v.emp) { const g = A.get('b_yoshitsune'), n = { benkei: 'benkei_weapon_glow', ise: 'ise_arrow_glow', kamei: 'kamei_oath_glow', kaison: 'kaison_ring_glow' }[e.ret], rr = g && g.act[F(n)];
      if (rr) A.draw(g, A.frameAt(Object.assign({}, rr, { loop: true }), G.t * TK), e.x, e.y - HH() * 0.4, HH() * 1.6 / 256, false, 0.8); }
    return true; }
  function drawUnder(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    if (v.qiOn) { const r = u.act[F('heal_wisps')]; A.draw(u, A.frameAt(Object.assign({}, r, { loop: true }), v.t * TK), e.x, e.y - HH() * 0.5, HH() * 2.2 / 256, false, 0.8); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const f of v.rfx) { const g = A.get(f.u); if (g) A.draw(g, A.frameAt(g.act[f.n], f.t * TK), f.x, f.y, f.s, false, 1 - f.t / 30); }
    const ar = A.get('b_mb_ise'); for (const a of v.arrows) { const q = a.t / a.life, L = a.L, x = L[0] + (L[2] - L[0]) * q, y = L[1] + (L[3] - L[1]) * q; const f = ar && ar.act.ise_yoshimori_arrow; if (!f) continue; const fr = f.f[0], k = HH() * 0.9 / 256;
      ctx.save(); ctx.translate(x, y - HH() * 0.7); ctx.rotate(Math.atan2(L[3] - L[1], L[2] - L[0])); ctx.drawImage(ar.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    if (v.qiOn && e.st !== 'dead') { const r = u.act[F('qi_shell_form')]; A.draw(u, r.f[r.f.length - 1], e.x, e.y - HH() * 0.6, HH() * 2.4 / 256, false, 0.45);
      const w = 60, y = e.y - HH() * e.size * 1.25; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 6); ctx.fillStyle = '#8fd6ff'; ctx.fillRect(e.x - w / 2, y, w * v.qi / v.qiMax, 4); G.txt('護體氣', e.x, y - 6, 10, '#bfe8ff', 'center'); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('yoshitsune', { name: '源義經', sub: '山頂鳥居', unit: 'b_yoshitsune', extra: ['b_mb_benkei', 'b_mb_ise', 'b_mb_kamei', 'b_mb_kaison'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['D_FUJI_04'],
    actors: [{ id: N, name: '源義經', size: 1.15, moves: [] }], mv: MV, director, drawSelf, drawUnder, drawOver,
    idle: e => { if (e.ret) { if (e.st === 'hurt') e.st = 'walk'; return true; } return false; },
    init(enc) { enc.v = { f: 1, cd: {}, rets: [], arrows: [], rfx: [], acts: [], qi: 0, qiMax: 1, qiOn: 0, emp: 0, summoned: 0, prayers: 0, rate: 0, t: 0 }; enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; dismissAll(v); v.qiOn = 0; v.arrows = []; },
    preDamage(e) { if (e.ret) { if (G.t % 30 === 0) G.UI.toast('打破義經的護體氣才能驅散四天王'); return true; } return false; },
    onDamage(e, d) { const v = e.enc.v;
      if (v.qiOn) { e.hp = Math.min(e.hpMax, e.hp + d); v.qi -= d; fx(e, F('qi_cracks'), e.x, e.y - HH() * 0.6, { s: HH() * 2 / 256 });
        if (v.qi <= 0) { v.qiOn = 0; fx(e, F('qi_break'), e.x, e.y - HH() * 0.6, { s: HH() * 2.8 / 256 }); dismiss(e); G.UI.banner('護體氣破碎', '四天王消散了'); if (e.mv) end(e); begin(e, 'breakq'); }
        e.st = e.mv ? 'atk' : 'walk'; return true; }
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
  function dismissAll(v) { for (const r of v.rets) { r.st = 'dead'; r.alpha = 0; } G.E = G.E.filter(x => !v.rets.includes(x)); v.rets = []; }
})();
