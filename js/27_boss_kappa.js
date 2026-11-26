/* ==========================================================================
 * 神諭之地 重製版 — 27_boss_kappa.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.9 宣告 foes（召喚小怪圖集隨頭目預載，避免叫不出來）。
 * 變更    : r3.8.1 新增。第二章頭目「河童大將」（河灣小徑 W_R02_06），P3 原圖（原圖面向右）。
 *           ‧ 招式：張手推擠／河童連推／水砲／甲殼翻滾／漲潮／河童兵召喚／瀑布水壓／必殺・河童大相撲／無間・淵主之皿。
 *           ‧ 階段：血量 <66% 二階、<33% 三階（進場即大相撲）；無間難度且 <15% 四階。換階 2 秒無敵＋四股踏地。
 *           ‧ 頭頂之皿：受到傷害的 32% 打在皿上（皿血量＝最大血量 10%），破皿後換破皿圖、移動 ×0.7、水砲變短、不能再蓄皿。
 *           ‧ 大相撲：最多五推，推出瞬間「架勢或閃身」＝完美；三完美給 3 秒破綻、五完美 5 秒；被推中一次即中斷。
 * 依賴    : 26_boss（G.BOSS.reg／api）、03_actors（spawnOni、hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { clip, play, sc, fx, lane, circle, inLane, inCircle, hit, walkTo, S, rnd, sgn, begin, end, alive, flip, TK, HH } = B.api;
  const N = 'kappataisho';
  const mouth = e => [e.x + e.face * HH() * e.size * 0.36 * SC.depth(e.y), e.y - HH() * e.size * 0.62 * SC.depth(e.y)];
  const head = e => [e.x + e.face * HH() * e.size * 0.12, e.y - HH() * e.size * 0.95 * SC.depth(e.y)];
  const spd = e => (e.broken ? 0.7 : 1) * (e.enc.v.water && H.y > 0 && e.y < e.enc.v.midY ? 1.3 : 1);
  const splash = (e, x, y, k) => fx(e, N + '_water_splash', x, y - HH() * 0.3 * (k || 1), { s: sc(e) * (k || 1) });
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + e.face * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }

  /* 推擠共用：預兆 tl 秒 → 推出（判定一次）；回傳 0 進行中、1 命中、2 被完美格擋、3 落空 */
  function pushStep(e, m, tl, opt) {
    const t0 = S(tl);
    if (m.t === 1) { e.face = sgn(H.x - e.x); play(e, 'push'); m.pz = lane(e.x, e.y, e.x + e.face * HH() * 1.9, e.y, HH() * 0.7, t0, opt && opt.gold ? '240,200,80' : '230,60,40'); }
    if (m.t < t0) { e.at = Math.min(e.at, 130); if (opt && opt.chase) { walkTo(e, H.x - e.face * HH() * 1.5, H.y, 1.4 * spd(e)); e.face = sgn(H.x - e.x); m.pz.x0 = e.x; m.pz.y0 = m.pz.y1 = e.y; m.pz.x1 = e.x + e.face * HH() * 1.9; } return 0; }
    if (m.t === t0) e.at = 280;
    if (m.t === t0 + 6) { const rx = (H.x - e.x) * e.face, inR = rx > -10 && rx < HH() * 2.0 && Math.abs(H.y - e.y) < 30;
      fx(e, N + '_push_impact', e.x + e.face * HH() * 1.3, e.y - HH() * 0.5, { s: sc(e) * 1.2 });
      if (!inR) return 3;
      if (opt && opt.parry && (H.inv > 0 || (H.guard && sgn(e.x - H.x) === H.face))) { G.spawnFx('feedback_guard_a', 0, H.x + H.face * 12, H.y - HH() * 0.55, H.face, 1.6); G.hitstop = 5; SC.shake = 5; return 2; }
      if (hit(e, (opt && opt.m) || 1.3)) { knock(e, HH() * 0.9); return 1; } return 3; }
    return 0;
  }

  const MV = {
    /* 張手推擠：預兆 0.6s → 掌推（四個手勢只算一次）→ 收招 0.28s */
    push: { go(e, m) {}, step(e, m) { const r = m.r || pushStep(e, m, 0.6, { chase: 1 }); if (r && !m.r) { m.r = r; m.te = m.t; } return m.r && m.t > m.te + 44 + S(0.28); } },
    /* 河童連推：一般推 → 短推（預兆 0.3s、收招 0.12s） */
    push2: { go(e, m) { m.n = 0; }, step(e, m) {
        if (!m.r) { const r = pushStep(e, m, m.n ? 0.3 : 0.6, { chase: 1 }); if (r) { m.r = r; m.te = m.t; } return false; }
        if (m.n === 0 && m.t > m.te + 16) { m.n = 1; m.r = 0; m.t = 0; return false; }
        return m.n === 1 && m.t > m.te + 30 + S(0.12); } },
    /* 水砲：張嘴預兆 0.75s（直線危險區）→ 水柱 0.85s（判定一次）→ 收招 0.25s；破皿射程縮短 */
    spit: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'spit'); const [mx, my] = mouth(e); m.L = HH() * (e.broken ? 4.6 : 6.6); m.x0 = mx; m.y0 = e.y; lane(mx, e.y, mx + e.face * m.L, e.y, HH() * 0.55, S(0.75), '90,160,230'); },
      step(e, m) { const T = S(0.75), Bm = S(0.85);
        if (m.t < T) { e.at = Math.min(e.at, 400); return false; }
        if (m.t < T + Bm) { e.at = 560; if (m.t === T) { const [mx, my] = mouth(e); e.enc.v.jets.push({ e, x: mx, y: my, gy: e.y, L: m.L, face: e.face, t: 0, life: Bm }); }
          if (!m.hit && m.t > T + 6 && inLane(m.x0, m.y0, m.x0 + e.face * m.L, m.y0, HH() * 0.55)) m.hit = hit(e, 1.4);
          if (m.t === T + 10) splash(e, m.x0 + e.face * m.L, e.y); return false; }
        if (m.t === T + Bm) e.at = 700; return m.t > T + Bm + S(0.25); } },
    /* 甲殼翻滾：四股預兆 0.9s → 縮殼直線翻滾（約 8 身，破皿 ×0.75 速）→ 濺水收招 0.4s */
    roll: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'shiko'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1;
        m.dx = dx / d; m.dy = Math.max(-0.35, Math.min(0.35, dy / d)); const L = HH() * (m.len || 8); m.sp = 10.8 * (e.broken ? 0.75 : 1);
        [m.ex, m.ey] = B.api.dashEnd(e.x, e.y, m.dx, m.dy, L); lane(e.x, e.y, m.ex, m.ey, HH() * 0.8, S(0.9)); },
      step(e, m) { const T = S(0.9);
        if (m.t < T) return false;
        if (m.t === T) play(e, 'roll', true);
        if (!m.done) { const ok = !walkTo(e, m.ex, m.ey, m.sp) && Math.hypot(m.ex - e.x, m.ey - e.y) > m.sp; if (Math.abs(m.dx) > 0.1) e.face = sgn(m.dx);
          if (!m.hit && inCircle(e.x, e.y, HH() * 0.85)) { m.hit = hit(e, 1.5); if (m.hit) knock(e, HH() * 0.6); }
          if (!ok) { m.done = m.t; splash(e, e.x + e.face * 20, e.y, 1.2); SC.shake = 5; play(e, 'idle', true); } return false; }
        return m.t > m.done + S(0.4); } },
    /* 漲潮：四股踏地 4 下（0.5／0.45／0.45／0.5s）→ 上半場淹水 14s（升降各 2s）；主角在水裡移動變慢、河童變快 */
    tide: { go(e, m) { m.i = 0; m.nx = 0; },
      step(e, m) { const T = [0.5, 0.45, 0.45, 0.5];
        if (m.i < 4) { if (m.t === m.nx + 1) { play(e, 'shiko'); e.adur = T[m.i] * 1000; }
          if (m.t === m.nx + S(T[m.i] * 0.6)) { splash(e, e.x - e.face * 18, e.y, 0.9); SC.shake = 3 + m.i; }
          if (m.t >= m.nx + S(T[m.i])) { m.nx = m.t; m.i++; if (m.i === 4) { e.adur = 0; const v = e.enc.v; v.water = { t: 0, life: S(14) }; G.UI.toast('河水漲上來了！上半場移動變慢'); } } return false; }
        return m.t > m.nx + S(0.3); } },
    /* 河童兵召喚：四股 0.5s → 兩側濺水各叫出一隻（同時最多 2 隻）→ 收招 0.7s */
    summon: { go(e, m) { play(e, 'shiko'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.minions = v.minions.filter(x => x.st !== 'dead');
          const need = 2 - v.minions.length; for (let i = 0; i < need; i++) { const x = e.x + (i ? 1 : -1) * HH() * 2.2, y = e.y + (i ? 30 : -30), p = SC.walkable(x, y) ? [x, y] : SC.snap(x, y, 'open');
            splash(e, p[0], p[1]); const k = G.spawnOni(p[0], p[1], 12, Math.max(1, e.lv - 4), i ? 'akakappa' : 'aokappa'); if (k) v.minions.push(k); } }
        return m.t > S(0.5) + S(0.7); } },
    /* 瀑布水壓：蓄力 0.3s → 主角位置依序 3 道瀑布（間隔 0.25s，各預兆 0.9s）→ 收招 1.2s */
    falls: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'spit'); m.c = []; },
      step(e, m) {
        if (m.t < S(0.3)) { e.at = Math.min(e.at, 140); return false; }
        [0, 0.25, 0.5].forEach((o, i) => { if (m.t === S(0.3 + o)) { const x = H.x + rnd(-14, 14), y = H.y + rnd(-8, 8); m.c.push({ x, y, at: m.t + S(0.9) }); circle(x, y, HH() * 0.8, S(0.9), '90,160,230'); } });
        for (const c of m.c) if (m.t === c.at) { e.enc.v.cols.push({ e, x: c.x, y: c.y, t: 0, life: 36 }); if (inCircle(c.x, c.y, HH() * 0.8)) hit(e, 1.2); }
        for (const c of m.c) if (m.t === c.at + 8) { splash(e, c.x, c.y, 1.1); SC.shake = 3; }
        return m.t > S(0.3 + 0.5 + 0.9) + S(1.2); } },
    /* 必殺・河童大相撲：土俵登場 → 鞠躬 → 最多五推（預兆首 1.2s、之後 0.9s 起）→ 結果 */
    ult: { go(e, m) { const v = e.enc.v; v.ring = { x: (e.x + H.x) / 2, y: (e.y + H.y) / 2, t: 0 }; m.ph = 0; m.n = 0; m.perfect = 0; G.UI.banner('必殺・河童大相撲', '推出瞬間「架勢」或「閃身」＝完美格擋'); play(e, 'walk', true); },
      step(e, m) { const v = e.enc.v, T = [0.75, 0.62, 0.55, 0.5, 0.46];
        if (m.ph === 0) { walkTo(e, H.x + sgn(e.x - H.x) * HH() * 1.8, H.y, 1.6 * spd(e)); if (m.t > S(0.75)) { m.ph = 1; m.t0 = m.t; e.face = sgn(H.x - e.x); play(e, 'bow'); } return false; }
        if (m.ph === 1) { if (m.t > m.t0 + 50) { m.ph = 2; m.sub = { t: 0 }; } return false; }
        if (m.ph === 2) { const s = m.sub; s.t++; const tl = Math.max(m.n ? 0.9 : 1.2, T[m.n]); const r = s.r || pushStep(e, s, tl, { parry: 1, chase: 1, gold: 1, m: 2.0 });
          if (r && !s.r) { s.r = r; s.te = s.t; if (r === 2) { m.perfect++; G.NUMS.push({ x: H.x, y: H.y - HH() * 1.2, v: '完美 ' + m.perfect, gold: true, t: 0 }); } if (r === 1) { m.ph = 4; m.t0 = m.t; play(e, 'shiko'); G.UI.toast('被推出去了…'); return false; } }
          if (s.r && s.t > s.te + (s.r === 2 ? S(0.32) : 20)) { m.n++; if (m.n >= 5) { m.ph = 3; m.t0 = m.t; } else m.sub = { t: 0 }; } return false; }
        if (m.ph === 3) {   // 五推結束：完美數決定破綻
          if (m.t === m.t0 + 1) { const op = m.perfect >= 5 ? 5 : m.perfect >= 3 ? 3 : 1; m.open = S(op); play(e, 'bow'); if (m.perfect >= 3) G.UI.banner('相撲勝利', '完美 ' + m.perfect + '／5・破綻 ' + op + ' 秒');
            if (!e.broken && m.perfect >= 3) { splash(e, ...head(e), 0.9); e.spill = S(1.1); } e.open = m.open; }
          return m.t > m.t0 + m.open; }
        if (m.ph === 4) return m.t > m.t0 + 50;
        return true; },
      stop(e, m) { e.enc.v.ring = null; } },
    /* 無間・淵主之皿 逆流相撲：蓄皿 1.2s → 滿皿（減傷 80%，最多 8s）→ 金色推擠：完美格擋＝洩水＋2s 破綻；否則縮殼翻滾 → 到期洩水 1s 破綻 */
    abyss: { go(e, m) { play(e, 'shiko'); m.ph = 0; e.enc.v.aura = { t: 0 }; G.UI.toast('頭頂的皿滿水了——要找機會格擋！'); },
      step(e, m) { const v = e.enc.v;
        if (e.broken) { v.aura = null; e.shield = 0; return true; }
        if (m.ph === 0) { if (m.t > S(0.4) + S(1.2)) { m.ph = 1; m.t0 = m.t; e.shield = 0.8; m.sub = { t: 0 }; } return false; }
        if (m.ph === 1) { const s = m.sub; s.t++; const r = s.r || pushStep(e, s, 0.8, { parry: 1, chase: 1, gold: 1, m: 1.8 });
          if (r && !s.r) { s.r = r; if (r === 2) { m.ph = 3; m.t0 = m.t; m.open = S(2); } else { m.roll = { t: 0, len: 5.5 }; MV.roll.go(e, m.roll); m.ph = 2; } }
          if (m.t > m.t0 + S(8)) { m.ph = 3; m.t0 = m.t; m.open = S(1); } return false; }
        if (m.ph === 2) { m.roll.t++; if (MV.roll.step(e, m.roll)) { m.ph = 1; m.sub = { t: 0 }; play(e, 'idle', true); } if (m.t > m.t0 + S(8)) { m.ph = 3; m.t0 = m.t; m.open = S(1); } return false; }
        if (m.ph === 3) { if (m.t === m.t0 + 1) { e.shield = 0; v.aura = null; splash(e, ...head(e), 1); play(e, 'bow'); e.open = m.open; G.UI.toast('皿裡的水洩掉了！'); } return m.t > m.t0 + m.open; }
        return true; },
      stop(e) { e.shield = 0; e.enc.v.aura = null; } }
  };

  function director(enc) {
    const e = enc.units[0], v = enc.v; if (!e || e.st === 'dead') return;
    if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (e.spill > 0) e.spill--;
    v.t++; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    // 淹水：主角在水裡移動打 6 折
    if (v.water) { v.water.t++; if (v.water.t > v.water.life) v.water = null; }
    const wl = waterLevel(v); if (wl > 0.5 && H.y < v.midY && v.px !== undefined && !H.act) { H.x = v.px + (H.x - v.px) * 0.6; H.y = v.py + (H.y - v.py) * 0.6; }
    v.px = H.x; v.py = H.y;
    for (const j of v.jets) j.t++; v.jets = v.jets.filter(j => j.t < j.life);
    for (const c of v.cols) c.t++; v.cols = v.cols.filter(c => c.t < c.life);
    if (v.aura) v.aura.t++;
    if (v.ring) v.ring.t++;
    // 換階：2 秒無敵＋四股踏地
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(2); play(e, 'shiko'); splash(e, e.x, e.y, 1.3); SC.shake = 8; G.UI.toast(['', '', '河童大將　發怒了', '河童大將　背水一戰', '淵主之皿　覺醒'][ph]);
      if (ph === 3) v.cd.ult = S(2.2); if (ph === 4) v.cd.abyss = S(2.2); enc.cd = S(2.2); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'idle') play(e, 'idle', true); return; }   // 破綻中站著挨打
    if (enc.cd > 0) { enc.cd--; const d = Math.abs(H.x - e.x); if (d > HH() * 2.4 || Math.abs(H.y - e.y) > 30) { if (e.an !== 'walk') play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * HH() * 2, H.y, 1.2 * spd(e)); } else if (e.an !== 'idle') { play(e, 'idle', true); e.face = sgn(H.x - e.x); } return; }
    const near = Math.abs(H.x - e.x) < HH() * 2.6 && Math.abs(H.y - e.y) < 34;
    let k;
    if (v.ph >= 4 && !e.broken && !(v.cd.abyss > 0)) { k = 'abyss'; v.cd.abyss = S(20); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(30); }
    else { const L = near ? ['push', 'push', 'roll', 'spit'] : ['spit', 'roll', 'spit'];
      if (!v.water && !(v.cd.tide > 0)) L.push('tide', 'tide');
      if (v.ph >= 2) { L.push(near ? 'push2' : 'falls', 'falls'); if (v.minions.filter(x => x.st !== 'dead').length < 2 && !(v.cd.summon > 0)) L.push('summon'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'tide') v.cd.tide = S(40); if (k === 'summon') v.cd.summon = S(18); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.6) : v.ph === 2 ? rnd(0.8, 1.3) : rnd(0.6, 1.0));
  }
  function waterLevel(v) { const w = v.water; if (!w) return 0; const r = S(2); return Math.min(1, w.t / r, (w.life - w.t) / r); }

  /* 繪製：淹水與土俵在角色下；水柱、瀑布、皿光在上 */
  function drawUnder(enc) { const v = enc.v, e = enc.units[0], u = A.get('b_kappa'); if (!u) return;
    const wl = waterLevel(v);
    if (wl > 0) { const top = v.midY - HH() * 2.6, y1 = v.midY; ctx.save(); const g = ctx.createLinearGradient(0, top, 0, y1);
      g.addColorStop(0, `rgba(60,120,170,${0.35 * wl})`); g.addColorStop(1, `rgba(90,160,210,${0.45 * wl})`); ctx.fillStyle = g; ctx.fillRect(0, top, SC.def.w, y1 - top);
      ctx.strokeStyle = `rgba(230,245,255,${0.7 * wl})`; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= SC.def.w; x += 16) ctx.lineTo(x, y1 + Math.sin(x * 0.04 + v.t * 0.08) * 3); ctx.stroke(); ctx.restore();
      const r = u.act[N + '_tide_wave']; if (r) for (let x = 60; x < SC.def.w; x += 220) { const fr = A.frameAt(Object.assign({}, r, { loop: true }), v.t * TK + x * 7); A.draw(u, fr, x, y1 + 4, sc(e) * 1.1, false, wl * 0.9); } }
    if (v.ring) { const r = u.act[N + '_dohyo']; if (r) { const fr = r.f[0], s = HH() * 5 / fr[2]; A.draw(u, fr, v.ring.x, v.ring.y + fr[3] * s * 0.35, s, false, Math.min(1, v.ring.t / 20) * 0.95); } }
  }
  function drawOver(enc) { const v = enc.v, e = enc.units[0], u = A.get('b_kappa'); if (!u || !e) return;
    const jr = u.act[N + '_water_jet'];
    for (const j of v.jets) { const fr = A.frameAt(Object.assign({}, jr, { loop: true }), 240 + (j.t * TK) % 300), h = fr[3] * sc(e) * 1.2, a = Math.min(1, (j.life - j.t) / 8, j.t / 4);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(j.x, j.y); if (j.face < 0) ctx.scale(-1, 1); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], 0, -h / 2, j.L, h); ctx.restore(); }
    const cr = u.act[N + '_falls_column'];
    for (const c of v.cols) { const fr = A.frameAt(cr, c.t * TK), s = HH() * 2.6 / fr[3]; A.draw(u, fr, c.x, c.y - fr[3] * s + fr[5] * s, s, false, Math.min(1, (c.life - c.t) / 8)); }
    if (v.aura) { const r = u.act[N + '_dish_aura'], fr = A.frameAt(Object.assign({}, r, { loop: true }), v.aura.t * TK), [hx, hy] = head(e), k = Math.min(1, v.aura.t / S(1.2));
      A.draw(u, fr, hx, hy, sc(e) * (0.6 + 0.6 * k), false, 0.5 + 0.5 * k); if (e.shield) { ctx.save(); ctx.strokeStyle = 'rgba(140,210,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - HH() * e.size * 0.5, HH() * e.size * 0.6, HH() * e.size * 0.62, 0, 0, 6.283); ctx.stroke(); ctx.restore(); } }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center');
  }

  B.reg('kappa', { name: '河童大將', sub: '河灣小徑之主', unit: 'b_kappa', foes: ['aokappa', 'akakappa'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', brk: 'dish_broken', map: ['W_R02_06'],
    actors: [{ id: N, name: '河童大將', size: 1.6, moves: [] }], mv: MV, director, drawUnder, drawOver,
    finish(enc) { for (const k of enc.v.minions) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } enc.v.water = null; enc.v.ring = null; },
    init(enc) { const e = enc.units[0]; e.dish = e.hpMax * 0.1; enc.v = { ph: 1, cd: {}, jets: [], cols: [], minions: [], water: null, aura: null, ring: null, t: 0, midY: e.y }; enc.cd = S(1.2); },
    onDamage(e, d, big) {
      if (e.open > 0) { if (!e.mv) e.st = 'walk'; else e.st = 'atk'; return true; }                // 破綻中（傷害 +50% 在框架計算）不硬直
      if (!e.broken) { e.dish -= d * 0.32; if (e.dish <= 0) { e.broken = 1; const [hx, hy] = head(e); fx(e, N + '_water_splash', hx, hy, { s: sc(e) }); SC.shake = 6; G.UI.toast('頭頂的皿碎了！動作變慢'); } }
      return false; } });
})();
