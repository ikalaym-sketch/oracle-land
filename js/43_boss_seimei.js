/* ==========================================================================
 * 神諭之地 重製版 — 43_boss_seimei.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。出雲大社副本頭目「安倍晴明」（D_IZUMO_04 大注連繩殿），P3 原圖（面向右），兩階段（壯年→散髮青年）。
 *           ‧ 一階：符咒彈（3 枚慢速追蹤符）／扇風（前方扇形）／紙鶴（2 隻紙鶴飛到主角位置俯衝，各預告 0.9 秒）／
 *             結界（4 秒內本體受傷 −50%，結界不是無敵）／後撤。
 *           ‧ 二階（50% 以下）：一階四招＋
 *             式神召喚：一半機率隨機召一組頭目分身（鬼王／前鬼＋後鬼／白九尾，場上還有就不再召，否則召一般妖怪 2 隻，同時最多 4 隻）／
 *             星陣（只能有 1 個）：場上立一塊靈石，靈石沒被打碎前每 6 秒從兩道門各召 1 隻（同時最多 3 隻）；
 *             靈石打 6 下就碎＝星陣立刻停止（已召出的留在場上），晴明破綻 2.5 秒；星陣不會自己消失，也不會再疊一個。
 * 依賴    : 26_boss（G.BOSS.reg／api）、03_actors（spawnOni、hurtHero）、敵人 shikigami／kuroonmyo。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play: play0, fx, circle, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'seimei', U = () => A.get('b_seimei'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const play = (e, n, l) => play0(e, 'p' + e.enc.v.f + '_' + n, l);
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  const fxs = (e, n, x, y, w) => fx(e, 'fx_' + n, x, y, { s: w / 240 });
  const MINI = ['shikigami', 'kuroonmyo'];
  const GRP = [['oniking'], ['zenki', 'goki'], ['kyubi']];   // 隨機一組；場上還有召喚頭目就不再召
  const MV = {
    talisman: { go(e, m) { toward(e); play(e, 'talisman_cast'); fxs(e, 'talisman_charge', e.x + e.face * HH() * 0.4, e.y - HH() * 0.8, HH() * 1.4); },
      step(e, m) { for (let i = 0; i < 3; i++) if (m.t === S(0.5) + i * 8) e.enc.v.shots.push({ x: e.x + e.face * HH() * 0.5, y: e.y - HH() * 0.8, a: Math.atan2(H.y - e.y, H.x - e.x) + (i - 1) * 0.5, t: 0, life: S(2.2) }); return m.t > S(1.0); } },
    fan: { go(e, m) { toward(e); play(e, 'fan_sweep'); m.a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); e.enc.v.fans.push({ x: e.x, y: e.y, a: m.a, r: HH() * 3.2, half: 0.55, t: 0, life: S(0.6) }); },
      step(e, m) { if (m.t === S(0.6)) { fxs(e, 'fan_wave', e.x + Math.cos(m.a) * HH() * 1.6, e.y + Math.sin(m.a) * HH(), HH() * 3); if (fanHit(e.x, e.y, m.a, HH() * 3.2, 0.55)) { hit(e, 1.0); knock(e); } } return m.t > S(1.1); } },
    crane: { go(e, m) { toward(e); play(e, 'crane_cast'); fxs(e, 'crane_birth', e.x, e.y - HH() * 1.0, HH() * 1.8); m.p = []; },
      step(e, m) { for (let i = 0; i < 2; i++) { const t0 = S(0.5 + i * 0.5); if (m.t === t0) { m.p[i] = [H.x, H.y]; circle(H.x, H.y, HH() * 1.0, S(0.9), '230,230,250'); e.enc.v.cranes.push({ sx: e.x, sy: e.y - HH(), tx: H.x, ty: H.y, t: 0, life: S(0.9) }); }
          if (m.t === t0 + S(0.9)) { const [x, y] = m.p[i]; fxs(e, 'crane_impact', x, y - HH() * 0.3, HH() * 1.8); if (near(x, y, HH() * 1.0)) hit(e, 1.0); } }
        return m.t > S(2.0); } },
    barrier: { go(e, m) { play(e, 'barrier_cast'); }, step(e, m) { if (m.t === S(0.5)) { e.enc.v.bar = S(4); e.shield = 0.5; G.UI.toast('晴明張開結界——受傷減半'); } return m.t > S(0.9); } },
    back: { go(e, m) { play(e, 'backstep'); const s = sgn(e.x - H.x) || 1; m.p = SC.snap(e.x + s * HH() * 2.6, e.y + rnd(-30, 30), 'walk', 140) || [e.x, e.y]; m.x0 = e.x; m.y0 = e.y; fxs(e, 'step_dust', e.x, e.y, HH() * 1.4); },
      step(e, m) { if (m.t <= S(0.4)) { const q = m.t / S(0.4); e.x = m.x0 + (m.p[0] - m.x0) * q; e.y = m.y0 + (m.p[1] - m.y0) * q; } return m.t > S(0.7); } },
    phase: { go(e, m) { play0(e, 'p1_phase_transition'); e.inv = S(1.8); fxs(e, 'phase_wake', e.x, e.y - HH() * 0.6, HH() * 3); G.UI.banner('安倍晴明', '散髮之姿'); },
      step(e, m) { if (m.t === S(1.0)) e.enc.v.f = 2; return m.t > S(1.6); } },
    summon: { go(e, m) { toward(e); play(e, 'summon_cast'); const v = e.enc.v;
        if (!v.helpers.some(h => h.st !== 'dead') && B.MINI && Math.random() < 0.5) { m.grp = GRP[Math.floor(Math.random() * GRP.length)]; Promise.all(m.grp.map(id => A.load(B.MINI.DEF[id].u))).then(() => { m.ready = 1; }, () => { m.grp = null; }); } },
      step(e, m) { const v = e.enc.v;
        if (m.grp) { if (m.t === S(0.58)) fxs(e, 'gate_loop', H.x, H.y - HH() * 0.3, HH() * 3); if (m.ready && !m.done) { m.done = 1; G.UI.banner('晴明召喚', { oniking: '鬼王', zenki: '前鬼・後鬼', kyubi: '白九尾' }[m.grp[0]]);
            const hp = Math.round(e.hpMax * (m.grp.length > 1 ? 0.12 : 0.2)); m.grp.forEach((id, i) => { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 2.4, e.y + (i ? 30 : -30), 'open', 260) || [e.x, e.y]; fxs(e, 'summon_arrival', p[0], p[1], HH() * 2.4);
              const h = B.MINI.helper(e, id, p[0], p[1], hp); if (h) v.helpers.push(h); }); v.helpers.forEach(h => { h.mates = v.helpers; }); }
          if (m.t === S(0.8)) play(e, 'summon_command'); return m.t > S(1.3) && (m.done || m.t > S(4)); }
        if (m.t === S(0.58)) { v.kids = v.kids.filter(k => k.st !== 'dead'); for (let i = 0; i < Math.min(2, 4 - v.kids.length); i++) { const p = SC.snap(H.x + (i ? 1 : -1) * HH() * 2.2, H.y + (i ? 25 : -25), 'open', 200) || [e.x, e.y];
            fxs(e, 'gate_open', p[0], p[1] - HH() * 0.3, HH() * 1.8); const k = G.spawnOni(p[0], p[1], 34, Math.max(1, e.lv - 5), MINI[i % 2]); if (k) v.kids.push(k); } }
        if (m.t === S(0.8)) play(e, 'summon_command'); return m.t > S(1.3); } },
    array: { go(e, m) { play(e, 'array_start'); G.UI.banner('星陣', '打碎靈石才能停止召喚！'); },
      step(e, m) { const v = e.enc.v; if (m.t === S(0.64)) { const p = SC.snap(e.x + sgn(H.x - e.x) * HH() * 1.4, e.y + 40, 'open', 200) || [e.x, e.y + 40];
          v.arr = { x: e.x, y: e.y, sx: p[0], sy: p[1], hp: 6, t: 0, next: S(2), gates: [-1, 1].map(s => SC.snap(e.x + s * HH() * 3, e.y - 20, 'open', 200) || [e.x + s * 100, e.y]), kids: [] }; fxs(e, 'array_birth', e.x, e.y, HH() * 4); }
        if (m.t === S(1.0)) play(e, 'array_sustain', true); return m.t > S(2.0); } },
    react: { go(e, m) { play(e, 'array_break_react'); e.open = S(2.5); }, step(e, m) { if (m.t === S(1.0)) play(e, 'ritual_recover'); return m.t > S(1.2); } }
  };
  function fanHit(x, y, ang, r, half) { const dx = H.x - x, dy = (H.y - y) * 1.6, d = Math.hypot(dx, dy); if (d > r) return false; let a = Math.atan2(dy, dx) - ang; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < half; }
  function knock(e) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * HH() * 0.12; if (SC.walkable(nx, H.y)) H.x = nx; } }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (/^(hurt|idle|run|walk|stagger)$/.test(e.an)) play(e, e.an, e.aloop);
    for (const h of v.helpers) { if (h.inv > 0) h.inv--; if (h.open > 0) h.open--; if (h.st === 'dead' && h.t > 60) h.alpha = Math.max(0, h.alpha - 0.05); }
    v.helpers = v.helpers.filter(h => h.alpha > 0);
    if (v.bar > 0 && --v.bar === 0) e.shield = 0;
    for (const s of v.shots) { s.t++; const want = Math.atan2(H.y - HH() * 0.5 - s.y, H.x - s.x); const da = Math.atan2(Math.sin(want - s.a), Math.cos(want - s.a)); s.a += Math.max(-0.03, Math.min(0.03, da)); s.x += Math.cos(s.a) * 3.4; s.y += Math.sin(s.a) * 3.4 * 0.7;
      if (Math.hypot(H.x - s.x, (H.y - HH() * 0.5 - s.y) * 1.4) < HH() * 0.4) { s.t = s.life; hit(e, 0.7); fxs(e, 'talisman_hit', s.x, s.y, HH() * 1.2); } }
    v.shots = v.shots.filter(s => s.t < s.life);
    for (const f of v.fans) f.t++; v.fans = v.fans.filter(f => f.t < f.life);
    for (const c of v.cranes) c.t++; v.cranes = v.cranes.filter(c => c.t < c.life);
    // 星陣：靈石在就持續召喚（上限 3），打 6 下碎
    const ar = v.arr; if (ar) { ar.t++; ar.kids = ar.kids.filter(k => k.st !== 'dead');
      if (!ar.br) { if (--ar.next <= 0) { ar.next = S(6); for (const g of ar.gates) if (ar.kids.length < 3) { fxs(e, 'minion_gate_open', g[0], g[1], HH() * 1.6); const k = G.spawnOni(g[0], g[1], 30, Math.max(1, e.lv - 5), MINI[ar.kids.length % 2]); if (k) ar.kids.push(k); } }
        if (H.act && H.act !== v.lastAct && /atk|skill|ult/.test(H.act.kind)) { v.lastAct = H.act; if (Math.hypot(H.x + H.face * HH() * 0.4 - ar.sx, (H.y - ar.sy) * 1.6) < HH() * 0.95) { ar.hp--; ar.fl = 8; fxs(e, 'hit_spark', ar.sx, ar.sy - HH() * 0.5, HH() * 1.2);
            if (ar.hp <= 0) { ar.br = 1; ar.t = 0; fxs(e, 'stone_break', ar.sx, ar.sy - HH() * 0.4, HH() * 2); fxs(e, 'array_end', ar.x, ar.y, HH() * 4); fxs(e, 'link_snap', (ar.sx + e.x) / 2, (ar.sy + e.y) / 2 - HH() * 0.5, HH() * 2); G.UI.banner('靈石碎裂', '星陣停止'); if (G.PARTNER) G.PARTNER.gain('reiseki', 1); if (e.mv) end(e); begin(e, 'react'); } } } }
      if (ar.fl > 0) ar.fl--; }
    if (!H.act) v.lastAct = null;
    if (v.f === 1 && e.hp < e.hpMax * 0.5 && !e.mv) { begin(e, 'phase'); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (!/react|recover|idle|stagger/.test(e.an)) play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5); let k;
    if (v.f === 2 && !v.arr && !(v.cd.array > 0)) { k = 'array'; v.cd.array = S(4); }
    else { const L = d < HH() * 1.2 ? ['back', 'fan', 'fan'] : d < HH() * 3 ? ['fan', 'talisman', 'crane'] : ['talisman', 'talisman', 'crane'];
      if (!(v.bar > 0) && !(v.cd.barrier > 0)) L.push('barrier'); if (v.f === 2 && !(v.cd.summon > 0) && v.kids.filter(x => x.st !== 'dead').length < 3) L.push('summon');
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'barrier') v.cd.barrier = S(14); if (k === 'summon') v.cd.summon = S(16); }
    begin(e, k); enc.cd = S(v.f === 1 ? rnd(0.9, 1.4) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 3.0;
    if (d > want * 1.3) { if (!/walk$/.test(e.an)) play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want, H.y, 1.6); } else if (!/idle$/.test(e.an)) play(e, 'idle', true); if (/idle$/.test(e.an)) toward(e); }

  /* ---------- 繪製 ---------- */
  const loopF = (u, n, t) => A.frameAt(Object.assign({}, u.act[n], { loop: true }), t * TK);
  function drawUnder(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const f of v.fans) { const q = f.t / f.life; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 1 / 1.6); ctx.fillStyle = `rgba(200,180,255,${0.15 + 0.25 * q})`; ctx.strokeStyle = 'rgba(210,190,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.r, f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    const ar = v.arr; if (ar) { if (!ar.br) { A.draw(u, loopF(u, 'fx_array_loop', ar.t), ar.x, ar.y, HH() * 4 / 256, false, 0.7); for (const g of ar.gates) A.draw(u, loopF(u, 'fx_minion_gate', ar.t), g[0], g[1], HH() * 1.6 / 240, false, 0.9);
        A.draw(u, ar.hp > 3 ? loopF(u, 'fx_stone_intact', ar.t) : u.act.fx_stone_cracked.f[3], ar.sx, ar.sy - HH() * 0.3, HH() * 1.6 / 243, false, 1); if (ar.fl > 0) { ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ar.sx, ar.sy - HH() * 0.4, HH() * 0.5, HH() * 0.4, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        G.txt('靈石 ' + ar.hp, ar.sx, ar.sy - HH() * 1.1, 11, '#cfe0ff', 'center'); }
      else A.draw(u, u.act.fx_stone_remains.f[3], ar.sx, ar.sy - HH() * 0.2, HH() * 1.4 / 227, false, 0.8); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const tb = u.act.fx_talisman_bolt; for (const s of v.shots) { const fr = A.frameAt(Object.assign({}, tb, { loop: true }), s.t * TK); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); const k = HH() * 0.9 / 247; ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    const cf = u.act.fx_crane_flight; for (const c of v.cranes) { const q = c.t / c.life, x = c.sx + (c.tx - c.sx) * q, y = c.sy + (c.ty - c.sy) * q - Math.sin(q * Math.PI) * HH() * 1.5; A.draw(u, A.frameAt(Object.assign({}, cf, { loop: true }), c.t * TK), x, y - HH() * 0.3, HH() * 1.2 / 233, c.tx < c.sx, 1); }
    if (v.bar > 0 && e.st !== 'dead') A.draw(u, loopF(u, 'fx_barrier_loop', v.t), e.x, e.y - HH() * 0.2, HH() * 2.2 / 253, false, 0.6);
    if (v.arr && !v.arr.br && e.st !== 'dead') { ctx.save(); ctx.strokeStyle = `rgba(160,190,255,${0.5 + 0.3 * Math.sin(v.t * 0.3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(v.arr.sx, v.arr.sy - HH() * 0.5); ctx.lineTo(e.x, e.y - HH() * 0.7); ctx.stroke(); ctx.restore(); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('seimei', { name: '安倍晴明', sub: '大注連繩殿', unit: 'b_seimei', foes: MINI, hpK: 12, atkK: 1.6, nat: 1, dir: 'x', map: ['D_IZUMO_04'],
    actors: [{ id: N, name: '安倍晴明', size: 1.15, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { enc.v = { f: 1, cd: {}, shots: [], fans: [], cranes: [], kids: [], helpers: [], arr: null, bar: 0, t: 0 }; enc.cd = S(1.2); play0(R(enc), 'p1_battle_intro'); },
    finish(enc) { const v = enc.v; const L = v.kids.concat(v.arr ? v.arr.kids : []); for (const k of L) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } for (const h of v.helpers) { h.st = 'dead'; h.alpha = 0; } G.E = G.E.filter(x => !v.helpers.includes(x)); v.helpers = []; v.shots = []; v.fans = []; v.cranes = []; v.arr = null; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
