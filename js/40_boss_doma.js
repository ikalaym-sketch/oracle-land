/* ==========================================================================
 * 神諭之地 重製版 — 40_boss_doma.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第十二章章中頭目「道摩 → 魔化道摩」（立約殿 W_R12_04），一場兩形態，P3 原圖（面向右）。
 *           ‧ 道摩（血量 100–50%）：敕札裁路（三道札鋒直線）／量罪踏印（落印圈，之後 2 秒印場）／紙身換位（被貼身時後撤）／
 *             近身拒斥（前方短掌）／敕令招陣（每批 2 兵、最多 2 批、同場最多 4 隻）／
 *             縛名引線（75% 以下：主角兩側立 2 枚錨札，2.2 秒內打掉任一枚就整組取消，否則中招＋定身 1.2 秒）／
 *             逆儀回流（75% 以下：場上 3 枚札 1.2 秒後回流到道摩身上，路線上的人受傷）。
 *           ‧ 魔化（50% 以下，一次）：跪地 → 魔化 → 魔化道摩（清掉兵與場上術式）。
 *           ‧ 魔化道摩：禍爪裂（前方大弧）／災輪（直線滾輪）／紙返（消失後在主角身旁出現爆開）／
 *             必殺・敕令過載（25% 以下：主角周圍 6 道敕令依序落下＋最後全身爆，之後破綻 3 秒）／
 *             無間・吞噬領域（15% 以下：以本體為中心的領域 1.9 秒擴大到 4 身，身在領域內被往中心拉＋持續傷害，之後破綻 4 秒）。
 *           ‧ 擊敗＝淨化（不致死）：魔化道摩跪地＋淨化特效。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、敵人 doma_spear_soldier／doma_archer／doma_shield_soldier／doma_ritualist。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, lane, circle, inLane, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'doma', U = () => A.get('b_doma'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const play = (e, n, l) => play0(e, (e.enc.v.cor ? 'c_' : '') + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  const SOL = ['doma_spear_soldier', 'doma_shield_soldier', 'doma_archer', 'doma_ritualist'];
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  const sfx = (e, n, x, y, w) => fx(e, n, x, y, { s: w / 256 });
  const MV = {
    /* —— 道摩 —— */
    edict: { go(e, m) { toward(e); play(e, 'edict_volley'); const a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); m.L = [-0.22, 0, 0.22].map(o => [e.x, e.y, e.x + Math.cos(a + o) * HH() * 6, e.y + Math.sin(a + o) * HH() * 6 / 1.6]);
        m.L.forEach((L, i) => lane(...L, HH() * 0.6, S(0.75) + i * 4, '230,200,120')); },
      step(e, m) { m.L.forEach((L, i) => { const t0 = S(0.75) + i * 4; if (m.t === t0) e.enc.v.blades.push({ L, t: 0, life: 18 });
          if (m.t === t0 + 9 && !m.hit && inLane(...L, HH() * 0.4)) { m.hit = 1; hit(e, 1.0); } }); return m.t > S(1.3); } },
    stamp: { go(e, m) { toward(e); play(e, 'seal_stamp'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 1.3, S(0.83), '220,80,60'); },
      step(e, m) { if (m.t === S(0.83)) { sfx(e, 'shared_seal_field', m.x, m.y - HH() * 0.3, HH() * 2.8); e.enc.v.fields.push({ x: m.x, y: m.y, r: HH() * 1.3, t: 0, life: S(2), done: 0 }); } return m.t > S(1.2); } },
    step: { go(e, m) { play(e, 'paper_step'); sfx(e, 'shared_paper_decoy', e.x, e.y - HH() * 0.6, HH() * 1.8); const s = sgn(e.x - H.x) || 1; m.p = SC.snap(e.x + s * HH() * 2.6, e.y + rnd(-30, 30), 'walk', 160) || [e.x, e.y]; m.x0 = e.x; m.y0 = e.y; },
      step(e, m) { if (m.t > S(0.3) && m.t <= S(0.6)) { const q = (m.t - S(0.3)) / S(0.3); e.x = m.x0 + (m.p[0] - m.x0) * q; e.y = m.y0 + (m.p[1] - m.y0) * q; } return m.t > S(0.9); } },
    refuse: { go(e, m) { toward(e); play(e, 'close_refusal'); m.cx = e.x + e.face * HH() * 0.8; circle(m.cx, e.y, HH() * 1.1, S(0.67)); },
      step(e, m) { if (m.t === S(0.67)) { if (near(m.cx, e.y, HH() * 1.1) && hit(e, 1.0)) knock(e, HH() * 1.1); } return m.t > S(1.1); } },
    summon: { go(e, m) { play(e, 'summon_order'); },
      step(e, m) { if (m.t === S(0.83)) { const v = e.enc.v; v.kids = v.kids.filter(k => k.st !== 'dead'); v.waves++;
          for (let i = 0; i < Math.min(2, 4 - v.kids.length); i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 2, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; sfx(e, 'shared_summon_order', p[0], p[1] - HH() * 0.7, HH() * 1.4);
            const k = G.spawnOni(p[0], p[1], 30, Math.max(1, e.lv - 4), SOL[(v.waves * 2 + i) % 4]); if (k) v.kids.push(k); } }
        return m.t > S(1.2); } },
    bind: { go(e, m) { toward(e); play(e, 'binding_lines'); const v = e.enc.v; v.anchors = [-1, 1].map(s => { const p = SC.snap(H.x + s * HH() * 1.9, H.y + s * 20, 'walk', 100) || [H.x + s * HH() * 1.9, H.y]; return { x: p[0], y: p[1], ok: 1 }; }); v.anT = 0; G.UI.toast('縛名引線——打掉任一枚錨札！'); },
      step(e, m) { const v = e.enc.v; if (!v.anchors) return m.t > S(0.6);
        if (m.t === S(2.2)) { sfx(e, 'shared_binding_threads', H.x, H.y - HH() * 0.5, HH() * 2.4); v.anchors = null; if (hit(e, 0.8)) { v.bind = S(1.2); G.UI.toast('被引線縛住了！'); } }
        return m.t > S(2.6); },
      stop(e) { e.enc.v.anchors = null; } },
    ritual: { go(e, m) { play(e, 'reverse_ritual'); m.p = []; for (let i = 0; i < 3; i++) { const a = i * 2.094 + rnd(0, 1), p = SC.snap(e.x + Math.cos(a) * HH() * 4, e.y + Math.sin(a) * HH() * 1.8, 'walk', 160); if (p) m.p.push(p); }
        for (const p of m.p) lane(p[0], p[1], e.x, e.y, HH() * 0.8, S(1.2), '170,120,230'); e.enc.v.tals = m.p.map(p => ({ x: p[0], y: p[1] })); },
      step(e, m) { if (m.t === S(1.2)) { sfx(e, 'shared_reverse_ritual', e.x, e.y - HH() * 0.6, HH() * 3); let h = 0; for (const p of m.p) if (inLane(p[0], p[1], e.x, e.y, HH() * 0.5)) h = 1; if (h) hit(e, 1.1); e.enc.v.tals = null; } return m.t > S(1.8); },
      stop(e) { e.enc.v.tals = null; } },
    /* 魔化 */
    corrupt: { go(e, m) { const v = e.enc.v; play(e, 'kneel'); e.inv = S(3); G.UI.banner('道摩', '……印，交不出去了'); for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.anchors = null; v.tals = null; v.fields = []; B.tg.length = 0; },
      step(e, m) { const v = e.enc.v; if (m.t === S(1.0)) { v.cor = 1; play(e, 'transform'); sfx(e, 'domac_corruption_form_fx', e.x, e.y - HH() * 0.9, HH() * 2.6); SC.shake = 8; }
        if (m.t === S(1.9)) { G.UI.banner('魔化道摩', '敕令失控'); play(e, 'idle', true); } return m.t > S(2.2); } },
    /* —— 魔化道摩 —— */
    claw: { go(e, m) { toward(e); play(e, 'claw_cleave'); m.cx = e.x + e.face * HH() * 1.1; circle(m.cx, e.y, HH() * 1.6, S(0.46)); },
      step(e, m) { if (m.t === S(0.46)) { fx(e, 'domac_claw_cleave_fx', m.cx, e.y - HH() * 0.8, { s: HH() * 2.6 / 256 }); if (near(m.cx, e.y, HH() * 1.6) && hit(e, 1.3)) knock(e, HH() * 0.7); } return m.t > S(1.3); } },
    wheel: { go(e, m) { toward(e); play(e, 'calamity_wheel'); const a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); m.L = [e.x, e.y, e.x + Math.cos(a) * HH() * 7, e.y + Math.sin(a) * HH() * 7 / 1.6]; lane(...m.L, HH() * 1.2, S(0.65), '170,90,220'); },
      step(e, m) { if (m.t >= S(0.65) && m.t < S(1.45)) { const q = (m.t - S(0.65)) / S(0.8); e.enc.v.wheel = { x: m.L[0] + (m.L[2] - m.L[0]) * q, y: m.L[1] + (m.L[3] - m.L[1]) * q, t: m.t };
          if (!m.hit && near(e.enc.v.wheel.x, e.enc.v.wheel.y, HH() * 0.8) && hit(e, 1.2)) m.hit = 1; } else e.enc.v.wheel = null;
        return m.t > S(1.75); },
      stop(e) { e.enc.v.wheel = null; } },
    ret: { go(e, m) { play(e, 'paper_return'); const s = Math.random() < 0.5 ? 1 : -1, p = SC.snap(H.x + s * HH() * 1.4, H.y, 'walk', 120) || [H.x, H.y]; m.p = p; },
      step(e, m) { if (m.t === S(0.3)) e.hide = 1; if (m.t === S(0.45)) circle(m.p[0], m.p[1], HH() * 1.7, S(0.5), '170,90,220');
        if (m.t === S(0.95)) { e.hide = 0; e.x = m.p[0]; e.y = m.p[1]; toward(e); fx(e, 'domac_paper_return_fx', e.x, e.y - HH() * 0.8, { s: HH() * 2.6 / 256 }); if (near(e.x, e.y, HH() * 1.7)) hit(e, 1.1); }
        return m.t > S(1.5); },
      stop(e) { e.hide = 0; } },
    ult: { go(e, m) { play(e, 'edict_overload'); G.UI.banner('必殺・敕令過載', '敕令連續落下——最後遠離本體'); m.p = []; },
      step(e, m) { for (let i = 0; i < 6; i++) { const t0 = S(0.3 + i * 0.32); if (m.t === t0) { m.p[i] = [H.x, H.y]; circle(H.x, H.y, HH() * 0.9, S(0.7), '230,200,120'); }
          if (m.t === t0 + S(0.7)) { const [x, y] = m.p[i]; sfx(e, 'shared_seal_field', x, y - HH() * 0.3, HH() * 2); if (near(x, y, HH() * 0.9)) hit(e, 0.9); } }
        const tb = S(0.3 + 5 * 0.32) + S(0.7); if (m.t === tb) circle(e.x, e.y, HH() * 3, S(0.8), '200,90,230');
        if (m.t === tb + S(0.8)) { fx(e, 'domac_edict_overload_fx', e.x, e.y - HH() * 0.8, { s: HH() * 5 / 256 }); SC.shake = 8; if (near(e.x, e.y, HH() * 3)) hit(e, 1.8); play(e, 'overload_recovery'); e.open = S(3); }
        return m.t > tb + S(1.1); } },
    domain: { go(e, m) { play(e, 'devouring_domain'); G.UI.banner('吞噬領域', '別被拉進中心！'); e.enc.v.dom = { x: e.x, y: e.y, r: 0, t: 0 }; },
      step(e, m) { const v = e.enc.v, D = v.dom; if (!D) return true; D.t = m.t; D.r = HH() * 4 * Math.min(1, m.t / S(1.9));
        if (m.t > S(0.3) && m.t < S(4.0) && near(D.x, D.y, D.r)) { if (!(H.act && H.act.kind === 'dodge')) { const dx = D.x - H.x, dy = D.y - H.y, d = Math.hypot(dx, dy) || 1, nx = H.x + dx / d * 0.9, ny = H.y + dy / d * 0.5; if (SC.walkable(nx, ny)) { H.x = nx; H.y = ny; } } if (m.t % 30 === 0) hit(e, 0.5); }
        if (m.t === S(4.0)) { v.dom = null; play(e, 'overload_recovery'); e.open = S(4); } return m.t > S(4.2); },
      stop(e) { e.enc.v.dom = null; } }
  };

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.cor && e.an === 'hurt') play0(e, 'c_hit');
    for (const b of v.blades) b.t++; v.blades = v.blades.filter(b => b.t < b.life);
    for (const f of v.fields) { f.t++; if (!f.done && f.t % 6 === 0 && near(f.x, f.y, f.r)) { f.done = 1; hit(e, 0.9); } } v.fields = v.fields.filter(f => f.t < f.life);
    if (v.bind > 0) { v.bind--; if (v.px !== undefined) { H.x = v.px; H.y = v.py; } }
    v.px = H.x; v.py = H.y;
    if (H.act && H.act !== v.lastAct && /atk|skill|ult/.test(H.act.kind)) { v.lastAct = H.act; const hx = H.x + H.face * HH() * 0.4;
      if (v.anchors && v.anchors.some(a => Math.hypot(hx - a.x, (H.y - a.y) * 1.6) < HH() * 0.9)) { v.anchors = null; G.UI.toast('錨札打斷——引線解除'); } }
    if (!H.act) v.lastAct = null;
    const hp = e.hp / e.hpMax;
    if (!v.cor && !v.corT && hp < 0.5) { v.corT = 1; if (e.mv) end(e); begin(e, 'corrupt'); v.ph = 3; enc.cd = S(1.0); return; }
    const ph = !v.cor ? (hp < 0.75 ? 2 : 1) : enc.diff >= 3 && hp < 0.15 ? 5 : hp < 0.25 ? 4 : 3;
    if (ph > v.ph && !e.mv) { v.ph = ph; if (ph === 2) G.UI.toast('道摩　縛名之術'); if (ph === 4) v.cd.ult = S(1.5); if (ph === 5) v.cd.domain = S(1.5); enc.cd = S(1.2); }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (!/kneel|recovery|hit|idle/.test(e.an)) play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 1.8); let k, L;
    if (!v.cor) { L = nr ? ['refuse', 'refuse', 'step', 'stamp'] : ['edict', 'edict', 'stamp'];
      if (v.waves < 2 && v.kids.filter(x => x.st !== 'dead').length < 3 && !(v.cd.summon > 0)) L.push('summon');
      if (v.ph >= 2) { if (!(v.cd.bind > 0)) L.push('bind'); if (!(v.cd.ritual > 0)) L.push('ritual'); } }
    else { if (v.ph >= 5 && !(v.cd.domain > 0)) { k = 'domain'; v.cd.domain = S(22); } else if (v.ph >= 4 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(20); }
      else L = nr ? ['claw', 'claw', 'ret', 'wheel'] : ['wheel', 'wheel', 'ret', 'claw']; }
    if (!k) { k = L[Math.floor(Math.random() * L.length)]; if (k === 'summon') v.cd.summon = S(16); if (k === 'bind') v.cd.bind = S(12); if (k === 'ritual') v.cd.ritual = S(12); }
    begin(e, k); enc.cd = S(v.cor ? rnd(0.6, 1.0) : v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.8, 1.2));
  }
  function keep(e) { const v = e.enc.v, d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * (v.cor ? 1.8 : 3.0);
    if (d > want * 1.2) { if (e.an !== (v.cor ? 'c_walk' : 'walk')) play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want, H.y, v.cor ? 2.0 : 1.5); }
    else if (e.an !== (v.cor ? 'c_idle' : 'idle')) play(e, 'idle', true); if (/idle/.test(e.an)) toward(e); }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    for (const f of v.fields) { const a = Math.min(1, (f.life - f.t) / 15); ctx.save(); ctx.fillStyle = `rgba(220,80,60,${0.22 * a})`; ctx.strokeStyle = `rgba(240,120,80,${0.7 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (v.dom) { const D = v.dom; ctx.save(); ctx.fillStyle = `rgba(90,30,130,${0.25 + 0.1 * Math.sin(v.t * 0.3)})`; ctx.strokeStyle = 'rgba(190,110,240,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(D.x, D.y, D.r, D.r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore();
      const r = u.act.domac_devouring_domain_fx, fr = A.frameAt(Object.assign({}, r, { loop: true }), D.t * TK); A.draw(u, fr, D.x, D.y, D.r * 2.2 / 256, false, 0.7); }
    const tal = u.act.shared_summon_order.f[3];
    if (v.anchors) for (const a of v.anchors) { A.draw(u, tal, a.x, a.y, HH() * 1.2 / 250, false, 1); ctx.save(); ctx.strokeStyle = `rgba(240,210,120,${0.6 + 0.3 * Math.sin(v.t * 0.4)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y - HH() * 0.5); ctx.lineTo(H.x, H.y - HH() * 0.5); ctx.stroke(); ctx.restore(); }
    if (v.tals) for (const a of v.tals) A.draw(u, tal, a.x, a.y, HH() * 1.0 / 250, false, 0.9); }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const bl = u.act.shared_paper_decoy.f[3];
    for (const b of v.blades) { const q = b.t / b.life, L = b.L, x = L[0] + (L[2] - L[0]) * q, y = L[1] + (L[3] - L[1]) * q; ctx.save(); ctx.translate(x, y - HH() * 0.5); ctx.rotate(Math.atan2(L[3] - L[1], L[2] - L[0])); const k = HH() * 0.8 / 256; ctx.drawImage(u.imgs[bl[7]], bl[0], bl[1], bl[2], bl[3], -bl[2] * k / 2, -bl[3] * k / 4, bl[2] * k, bl[3] * k / 2); ctx.restore(); }
    if (v.wheel) { const r = u.act.domac_calamity_wheel_fx, fr = A.frameAt(Object.assign({}, r, { loop: true }), v.wheel.t * TK); A.draw(u, fr, v.wheel.x, v.wheel.y - HH() * 0.2, HH() * 1.6 / 256, false, 1); }
    if (v.cor && e.st !== 'dead' && !e.hide) { const r = u.act.domac_idle_aura_fx, fr = A.frameAt(r, v.t * TK); A.draw(u, fr, e.x, e.y - HH() * 0.6, HH() * 1.3 / 196, false, 0.55); }
    if (v.bind > 0) G.txt('縛', H.x, H.y - HH() * 1.45, 13, '#f0d070', 'center');
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('doma', { name: '道摩', sub: '斷印御座', unit: 'b_doma', foes: SOL, hpK: 10, atkK: 1.5, nat: 1, dir: 'x', map: ['W_R12_04'],
    actors: [{ id: N, name: '道摩', size: 1.15, moves: [] }], mv: MV, director, drawUnder, drawOver, drawSelf: e => !!e.hide,
    init(enc) { enc.v = { ph: 1, cor: 0, corT: 0, cd: { summon: S(5) }, kids: [], blades: [], fields: [], anchors: null, tals: null, wheel: null, dom: null, bind: 0, waves: 0, t: 0 }; enc.cd = S(1.2); },
    finish(enc) { const v = enc.v, e = R(enc); for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.blades = []; v.fields = []; v.anchors = null; v.tals = null; v.wheel = null; v.dom = null; v.bind = 0;
      if (e) { fx(e, 'domac_purification_fx', e.x, e.y - HH() * 0.8, { s: HH() * 2.4 / 202 }); G.UI.toast('魔化淨化了'); } },
    preDamage(e) { if (e.hide) return true; const v = e.enc.v; if (!v.cor) { e.hp += 1e9; v.buf = 1; } return false; },   // 魔化前不會被打死
    onDamage(e) { const v = e.enc.v; if (v.buf) { v.buf = 0; e.hp -= 1e9; if (!v.cor && e.hp < e.hpMax * 0.45) e.hp = Math.round(e.hpMax * 0.45); }
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
