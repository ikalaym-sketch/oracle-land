/* ==========================================================================
 * 神諭之地 重製版 — 34_boss_shuten.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.9 新增。第八章頭目「酒吞童子」（第八章頭目地圖 W_R08_07），P3 原圖（面向右）。
 *           ‧ 場上酒桶 4 個（三階再補 2 個，同時最多 4）：酒吞會走去喝酒（回 2% 血、醉 8 秒出招變快，共 3 次）；
 *             主角在酒桶旁出手可打破酒桶；喝酒時累積受到 3% 血量傷害會嗆到（破綻 2 秒）。
 *           ‧ 二階出現「神便鬼毒酒」壺：主角站旁 1 秒拿起 → 下次酒吞喝酒會喝到毒酒（破綻 4 秒＋5% 傷害），必殺也會被毒酒打斷。
 *           ‧ 招式：金棒連擊（三擊＋砸地）／大盃投擲（酒灘減速 5 秒）／醉拳亂步（蛇行衝撞）／飲酒／酒霧（二階）／
 *                   四天王召喚（二階，兩波，同時最多 2 隻）／必殺・鬼神大醉・業火（三階）／無間・鬼神亂舞（四階：兩輪折返醉步＋震波，踩到酒灘滑倒 2.5 秒）。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, sc, fx, lane, circle, inLane, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'shuten', U = () => A.get('b_shuten'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const imp = (e, x, y, k) => fx(e, N + '_impact', x, y, { s: HH() * (k || 1.2) / 82 });
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  /* 前方半圓揮擊：預兆 tl → 判定 */
  function swing(e, m, at, tl, mul, slam) { const cx = e.x + e.face * HH() * 0.8, r = HH() * (slam ? 1.3 : 1.7);
    if (m.t === at) { e.face = sgn(H.x - e.x); circle(e.x + e.face * HH() * 0.8, e.y, r, S(tl)); }
    if (m.t === at + S(tl)) { if (slam) { imp(e, cx, e.y, 1.6); SC.shake = 7; } else fx(e, N + '_swing', cx, e.y - HH() * 0.6, { s: HH() * 1.6 / 88 }); if (near(cx, e.y, r)) { if (hit(e, mul)) knock(e, HH() * 0.6); } } }
  const MV = {
    /* 金棒連擊：揮（0.5）→ 回揮（0.35）→ 再揮（0.35）→ 砸地（0.6）→ 收招 0.5s */
    combo: { go(e, m) { play(e, 'combo'); m.seq = [[1, 0.5], [S(0.7), 0.35], [S(1.25), 0.35]]; },
      step(e, m) { for (const [a, tl] of m.seq) swing(e, m, a, tl, 1.0);
        if (m.t === S(1.8)) play(e, 'slam'); swing(e, m, S(1.8), 0.6, 1.4, 1);
        if (m.t < S(1.8)) e.at = Math.min(e.at, 1100);
        return m.t > S(1.8) + S(0.6) + S(0.5); } },
    /* 大盃投擲：預兆 0.8s（落點圈）→ 酒盃落下（判定）→ 酒灘 5s（減速 30%） */
    toss: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'toss'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 0.95, S(0.8), '230,160,60'); e.enc.v.cups.push({ sx: e.x + e.face * 20, sy: e.y, tx: m.x, ty: m.y, t: 0, life: S(0.8) }); },
      step(e, m) { if (m.t === S(0.8)) { fx(e, N + '_splash', m.x, m.y, { s: HH() * 1.6 / 91 }); if (near(m.x, m.y, HH() * 0.95)) hit(e, 1.0); e.enc.v.pud.push({ x: m.x, y: m.y, r: HH() * 1.1, t: 0, life: S(5) }); }
        return m.t > S(1.3); } },
    /* 醉拳亂步：預兆 0.7s（直線）→ 蛇行衝撞 1.6s（接觸每 0.5s 判定）→ 收招 0.5s */
    drunk: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'drunk', true); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = Math.max(-0.4, Math.min(0.4, dy / d)); lane(e.x, e.y, e.x + m.dx * HH() * 6, e.y + m.dy * HH() * 6, HH() * 0.9, S(0.7)); m.cd = 0; },
      step(e, m) { if (m.t < S(0.7)) { e.at = Math.min(e.at, 140); return false; }
        if (m.t < S(2.3)) { const w = Math.sin(m.t * 0.25) * 2.2, nx = e.x + m.dx * 3.6 - m.dy * w, ny = e.y + m.dy * 3.6 + m.dx * w * 0.5; if (SC.walkable(nx, ny)) { e.x = nx; e.y = ny; } else m.t = S(2.3);
          if (--m.cd <= 0 && near(e.x, e.y, HH() * 0.9)) { if (hit(e, 1.2)) knock(e, HH() * 0.5); m.cd = 30; }
          if (slip(e)) return true; return false; }
        if (m.t === S(2.3)) play(e, 'idle', true); return m.t > S(2.8); } },
    /* 飲酒：走到最近的完好酒桶 → 喝 1.2s（期間受 3% 血量傷害＝嗆到）→ 回 2%、醉 8s；毒酒＝破綻 4s＋5% 傷害 */
    drink: { go(e, m) { const v = e.enc.v; m.b = v.barrels.filter(b => !b.br).sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y))[0]; m.ph = 0; m.dmg = 0; play(e, 'walk', true); },
      step(e, m) { const v = e.enc.v; if (!m.b || m.b.br) return true;
        if (m.ph === 0) { if (walkTo(e, m.b.x - HH() * 0.9, m.b.y, 2.4) || m.t > S(4)) { m.ph = 1; m.t0 = m.t; e.face = 1; play(e, 'drink'); G.UI.toast('酒吞童子在喝酒——打斷他！'); } return false; }
        if (m.ph === 1) { if (m.dmg > e.hpMax * 0.03) { play(e, 'stagger'); e.open = S(2); G.UI.toast('嗆到了！'); return true; }
          if (m.t - m.t0 >= S(1.2)) { fx(e, N + '_poison', e.x + HH() * 0.2, e.y - HH() * 1.3, { s: HH() * 1.2 / 113 });
            if (v.poisonHeld) { v.poisonHeld = 0; poisoned(e); return true; }
            if (v.heal > 0) { v.heal--; const d = Math.round(e.hpMax * 0.02); e.hp = Math.min(e.hpMax, e.hp + d); G.NUMS.push({ x: e.x, y: e.y - HH() * 1.4, v: '+' + d, gold: true, t: 0 }); }
            v.drunkT = S(8); m.b.br = 1; m.b.t = 0; G.UI.toast('酒吞童子醉了——出招變快'); return true; } return false; }
        return true; } },
    /* 酒霧（二階）：吸氣 0.8s（扇形）→ 噴酒霧 3s：霧中移動亂飄＋每 0.5s 傷害 */
    mist: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'mist'); m.ang = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); e.enc.v.fans.push({ x: e.x, y: e.y, ang: m.ang, r: HH() * 3.2, half: 0.5, t: 0, life: S(0.8) }); },
      step(e, m) { if (m.t === S(0.8)) for (let i = 1; i <= 3; i++) e.enc.v.mists.push({ x: e.x + Math.cos(m.ang) * HH() * i, y: e.y + Math.sin(m.ang) * HH() * i / 1.6, r: HH() * 0.9, t: 0, life: S(3) });
        return m.t > S(1.3); } },
    /* 四天王召喚（二階，兩波）：怒吼 → 叫出 2 隻鬼（同時最多 2） */
    summon: { go(e, m) { play(e, 'roar'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.minions = v.minions.filter(k => k.st !== 'dead'); v.waves++; fx(e, N + '_wave', e.x, e.y, { s: HH() * 3 / 90 });
          for (let i = 0; i < 2 - v.minions.length; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; const k = G.spawnOni(p[0], p[1], 20, Math.max(1, e.lv - 3), ['kurooni', 'shirooni', 'kioni', 'midorioni'][(v.waves * 2 + i) % 4]); if (k) v.minions.push(k); } }
        return m.t > S(1.2); } },
    /* 必殺・鬼神大醉・業火（三階）：大口灌酒 1.0s（持毒酒就會中毒中止）→ 怒吼 → 三道業火扇（各預兆 0.8s，轉向追人）→ 收招 1.0s */
    ult: { go(e, m) { play(e, 'drink'); G.UI.banner('必殺・鬼神大醉・業火', '拿著毒酒就能打斷'); m.i = 0; },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(1.0)) { if (v.poisonHeld) { v.poisonHeld = 0; poisoned(e); return true; } play(e, 'roar'); }
        for (let i = 0; i < 3; i++) { const t0 = S(1.3 + i * 1.0); if (m.t === t0) { e.face = sgn(H.x - e.x); m.ang = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); v.fans.push({ x: e.x, y: e.y, ang: m.ang, r: HH() * 5, half: 0.42, t: 0, life: S(0.8), col: '240,90,40' }); }
          if (m.t === t0 + S(0.8)) { v.flames.push({ x: e.x, y: e.y, ang: m.ang, r: HH() * 5, t: 0, life: 24 }); if (fanHit(e.x, e.y, m.ang, HH() * 5, 0.42)) hit(e, 1.6); } }
        return m.t > S(1.3 + 2.0) + S(0.8) + S(1.0); } },
    /* 無間・鬼神亂舞（四階）：兩輪折返醉步（各 2 趟橫越），每趟終點震波（圈）；路上踩到酒灘＝滑倒 2.5s */
    ranbu: { go(e, m) { m.n = 0; m.leg = null; G.UI.banner('鬼神亂舞', '把他引到酒灘上讓他滑倒'); },
      step(e, m) { if (!m.leg) { if (m.n >= 4) return m.t > (m.endT || 0) + S(0.8); const tx = H.x + sgn(H.x - e.x) * HH() * 2.5, ty = H.y; m.leg = { tx, ty, t: 0 }; play(e, 'drunk', true); lane(e.x, e.y, tx, ty, HH() * 0.9, S(0.6)); return false; }
        const L = m.leg; L.t++; if (L.t < S(0.6)) return false;
        const arrived = walkTo(e, L.tx, L.ty, 5.2); if (near(e.x, e.y, HH() * 0.9) && !L.hit) { L.hit = 1; if (hit(e, 1.3)) knock(e, HH() * 0.6); }
        if (slip(e)) return true;
        if (arrived || L.t > S(2.4)) { fx(e, N + '_wave', e.x, e.y, { s: HH() * 3 / 90 }); SC.shake = 6; if (near(e.x, e.y, HH() * 1.8)) hit(e, 1.0); m.leg = null; m.n++; m.endT = m.t; play(e, 'roar'); }
        return false; } }
  };
  function fanHit(x, y, ang, r, half) { const dx = H.x - x, dy = (H.y - y) * 1.6, d = Math.hypot(dx, dy); if (d > r) return false; let a = Math.atan2(dy, dx) - ang; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < half; }
  function slip(e) { const v = e.enc.v, p = v.pud.find(p => Math.hypot(e.x - p.x, (e.y - p.y) * 1.6) < p.r * 0.8); if (!p) return false;
    p.t = p.life; play(e, 'stagger'); e.open = S(2.5); fx(e, N + '_splash', e.x, e.y, { s: HH() * 1.4 / 91 }); G.UI.toast('踩到酒灘滑倒了！'); return true; }
  function poisoned(e) { play(e, 'stagger'); e.open = S(4); const d = Math.round(e.hpMax * 0.05); e.hp = Math.max(1, e.hp - d); e.flash = 12; G.NUMS.push({ x: e.x, y: e.y - HH() * 1.6, v: d, crit: true, t: 0 }); fx(e, N + '_poison', e.x, e.y - HH() * 1.2, { s: HH() * 2 / 113 }); G.UI.banner('神便鬼毒酒', '酒吞童子中毒了！'); }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (v.drunkT > 0) v.drunkT--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    for (const c of v.cups) c.t++; v.cups = v.cups.filter(c => c.t < c.life);
    for (const f of v.fans) f.t++; v.fans = v.fans.filter(f => f.t < f.life);
    for (const f of v.flames) f.t++; v.flames = v.flames.filter(f => f.t < f.life);
    let slow = 0; for (const p of v.pud) { p.t++; if (near(p.x, p.y, p.r)) slow = 0.7; } v.pud = v.pud.filter(p => p.t < p.life);
    let woozy = 0; for (const z of v.mists) { z.t++; if (near(z.x, z.y, z.r)) { woozy = 1; if (z.t % 30 === 0) hit(e, 0.3); } } v.mists = v.mists.filter(z => z.t < z.life);
    if ((slow || woozy) && v.px !== undefined && !(H.act && H.act.kind === 'dodge')) { const k = woozy ? 0.6 : slow; H.x = v.px + (H.x - v.px) * k; H.y = v.py + (H.y - v.py) * k;
      if (woozy) { const nx = H.x + Math.sin(v.t * 0.21) * 1.4, ny = H.y + Math.cos(v.t * 0.17) * 0.7; if (SC.walkable(nx, ny)) { H.x = nx; H.y = ny; } } }
    v.px = H.x; v.py = H.y;
    // 打破酒桶、拿毒酒
    if (H.act && H.act !== v.lastAct) { v.lastAct = H.act; for (const b of v.barrels) if (!b.br && Math.hypot(H.x + H.face * HH() * 0.4 - b.x, (H.y - b.y) * 1.6) < HH() * 0.9) { b.br = 1; b.t = 0; fx(e, N + '_splash', b.x, b.y, { s: HH() * 1.2 / 91 }); v.pud.push({ x: b.x + 10, y: b.y + 8, r: HH() * 0.9, t: 0, life: S(6) }); G.UI.toast('酒桶打破了'); } }
    if (!H.act) v.lastAct = null;
    for (const b of v.barrels) b.t++;
    if (v.jar && !v.poisonHeld) { if (near(v.jar.x, v.jar.y, HH() * 0.8)) { if (++v.jar.p >= S(1)) { v.poisonHeld = 1; v.jar = null; G.UI.toast('拿到神便鬼毒酒——等他喝酒時就換成毒酒'); } } else v.jar.p = Math.max(0, v.jar.p - 2); }
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(2); play(e, 'roar'); fx(e, N + '_wave', e.x, e.y, { s: HH() * 3 / 90 }); SC.shake = 8; G.UI.toast(['', '', '酒吞童子　酒意上頭', '酒吞童子　鬼神大醉', '鬼神　亂舞'][ph]);
      if (ph === 2 && !v.poisonHeld && !v.jar) { const p = SC.randSpot('open', null, [[e.x, e.y], [H.x, H.y]], HH() * 3); if (p) v.jar = { x: p[0], y: p[1], p: 0 }; }
      if (ph === 3) { for (let i = 0; i < 2 && v.reserve > 0; i++) { const live = v.barrels.filter(b => !b.br); if (live.length >= 4) break; const p = SC.randSpot('open', null, v.barrels.map(b => [b.x, b.y]).concat([[e.x, e.y]]), HH() * 2); if (p) { v.barrels.push({ x: p[0], y: p[1], br: 0, t: 0 }); v.reserve--; } } v.cd.ult = S(2.4); }
      if (ph === 4) v.cd.ranbu = S(2.4); enc.cd = S(2.2); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'stagger' && e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd -= v.drunkT > 0 ? 1.5 : 1; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 2.2); let k;
    if (v.ph >= 4 && !(v.cd.ranbu > 0)) { k = 'ranbu'; v.cd.ranbu = S(20); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = nr ? ['combo', 'combo', 'drunk', 'toss'] : ['toss', 'drunk', 'drunk'];
      if (v.barrels.some(b => !b.br) && !(v.cd.drink > 0) && v.drunkT <= 0) L.push('drink');
      if (v.ph >= 2) { L.push('mist'); if (v.waves < 2 && v.minions.filter(x => x.st !== 'dead').length < 2 && !(v.cd.summon > 0)) L.push('summon'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'drink') v.cd.drink = S(14); if (k === 'summon') v.cd.summon = S(16); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 1.8;
    if (d > want) { if (e.an !== 'walk') play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 1.5); } else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x); }

  /* ---------- 繪製 ---------- */
  const prog = (x, y, q) => { ctx.save(); ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, -1.57, -1.57 + 6.283 * q); ctx.stroke(); ctx.restore(); };
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    for (const f of v.fans) { const q = f.t / f.life; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 1 / 1.6); ctx.fillStyle = `rgba(${f.col || '200,150,200'},${0.2 + 0.25 * q})`; ctx.strokeStyle = `rgba(${f.col || '200,150,200'},.8)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.r, f.ang - f.half, f.ang + f.half); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    for (const p of v.pud) { const fr = u.act[N + '_puddle'].f[2], a = Math.min(1, p.t / 10, (p.life - p.t) / 20); A.draw(u, fr, p.x, p.y + p.r * 0.2, p.r * 2.2 / fr[2], false, 0.85 * a); }
    for (const z of v.mists) { const a = Math.min(1, z.t / 10, (z.life - z.t) / 15); ctx.save(); ctx.fillStyle = `rgba(220,190,230,${0.3 * a})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.45, 0, 0, 6.283); ctx.fill(); ctx.restore();
      const fr = A.frameAt(Object.assign({}, u.act[N + '_mist'], { loop: true }), z.t * TK); A.draw(u, fr, z.x, z.y, z.r * 2 / 69, false, a * 0.9); }
    for (const b of v.barrels) { const fr = u.act[N + (b.br ? '_barrel_broken' : '_barrel')].f[0]; A.draw(u, fr, b.x, b.y, HH() * 0.75 / 256, false, b.br ? 0.8 : 1); }
    if (v.jar) { A.draw(u, u.act[N + '_poison_jar'].f[0], v.jar.x, v.jar.y, HH() * 0.7 / 256, false, 1); const g = 0.4 + 0.3 * Math.sin(v.t * 0.15); ctx.save(); ctx.strokeStyle = `rgba(200,140,230,${g})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(v.jar.x, v.jar.y, HH() * 0.6, HH() * 0.22, 0, 0, 6.283); ctx.stroke(); ctx.restore(); if (v.jar.p > 0) prog(v.jar.x, v.jar.y - HH() * 1.0, v.jar.p / S(1)); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const c of v.cups) { const q = c.t / c.life, x = c.sx + (c.tx - c.sx) * q, y = c.sy + (c.ty - c.sy) * q - Math.sin(q * Math.PI) * HH() * 1.6; ctx.save(); ctx.translate(x, y - HH() * 0.4); ctx.rotate(q * 9); const f = u.act[N + '_cup'].f[0], k = HH() * 0.5 / 256; ctx.drawImage(u.imgs[f[7]], f[0], f[1], f[2], f[3], -f[2] * k / 2, -f[3] * k / 2, f[2] * k, f[3] * k); ctx.restore(); }
    const ir = u.act[N + '_inferno'];
    for (const f of v.flames) { const fr = A.frameAt(ir, Math.min(559, f.t / f.life * 560)); for (const o of [-0.25, 0, 0.25]) { ctx.save(); ctx.translate(f.x, f.y - HH() * 0.5); ctx.rotate(Math.atan2(Math.sin(f.ang + o) / 1.6, Math.cos(f.ang + o))); ctx.globalAlpha = 0.95; ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], 0, -HH() * 0.9, f.r, HH() * 1.8); ctx.restore(); } }
    if (v.poisonHeld) { A.draw(u, u.act[N + '_poison_jar'].f[0], H.x - H.face * 10, H.y - HH() * 1.15, HH() * 0.35 / 256, false, 1); }
    if (v.drunkT > 0 && G.t % 40 < 24) G.txt('醉', e.x + 18, e.y - HH() * e.size * 1.1, 11, '#f3c060', 'center');
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.2, 12, '#ffd76a', 'center'); }

  B.reg('shuten', { name: '酒吞童子', sub: '大江山之主', unit: 'b_shuten', foes: ['kurooni', 'shirooni', 'kioni', 'midorioni'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R08_07'],
    actors: [{ id: N, name: '酒吞童子', size: 1.4, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { const e = R(enc); const v = enc.v = { ph: 1, cd: { drink: S(5) }, barrels: [], cups: [], pud: [], mists: [], fans: [], flames: [], minions: [], jar: null, poisonHeld: 0, heal: 3, reserve: 2, waves: 0, drunkT: 0, t: 0 };
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.6, p = SC.snap(e.x + Math.cos(a) * HH() * 3.4, e.y + Math.sin(a) * HH() * 1.5, 'open', 160); if (p) v.barrels.push({ x: p[0], y: p[1], br: 0, t: 0 }); }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.minions) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.pud = []; v.mists = []; v.fans = []; v.flames = []; v.cups = []; },
    onDamage(e, d) { const m = e.mv; if (m && m.k === 'drink' && m.ph === 1) m.dmg += d;
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
