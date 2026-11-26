/* ==========================================================================
 * 神諭之地 重製版 — 30_boss_raiju.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.9 宣告 foes（召喚小怪圖集隨頭目預載，避免叫不出來）。
 * 變更    : r3.8.5 新增。第四章頭目「雷獸王」（第四章頭目地圖 W_R04_07），P3 原圖（面向右，四足獸）。
 *           ‧ 場上：3 根避雷針（落雷打在附近就充電）、8 個水窪（連鎖閃電導電點）。
 *           ‧ 招式：雷爪／雷光突進／落雷／追雷雲／雷獸召喚／連鎖閃電／雷鳴咆哮（麻痺 70 格）／必殺・萬雷／無間・雷神降臨。
 *           ‧ 必殺・萬雷：要有已充電的避雷針才會放；站進針旁光圈＝安全，撐過後雷獸王反受 6% 傷害並露出破綻。
 *           ‧ 電尾可破壞（受傷的 32% 打在尾上，尾血量＝最大血量 10%）：落雷 6→3 處、連鎖 3→2 處，追雷雲不變。
 *           ‧ 原圖修正：奔跑、突進的水平錨點含位移（身體左右跳）→ 改為軀幹中心原地播放。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、25_walk（randSpot／snap）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, sc, fx, lane, circle, inLane, inCircle, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'raijuo', U = () => A.get('b_raiju'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const safe = v => v.rods.some(r => r.ch && !r.br && near(r.x, r.y, HH() * 1.2));
  /* 落雷：預兆 tl 秒的圈 → 雷擊＋電爆；打到主角（不在安全圈）＋讓附近避雷針充電 */
  function bolt(e, x, y, tl, o) { const v = e.enc.v; circle(x, y, HH() * 0.8, S(tl), (o && o.col) || '120,170,255'); v.bolts.push(Object.assign({ e, x, y, t: -S(tl), life: 36 }, o || {})); }
  /* 雷柱：錨點在頂端 → 依原圖高度縮放到約 3.6 個主角高、底端落在地面 */
  function boltFx(e, x, y) { const u = U(), h = u ? Math.max(...u.act[N + '_bolt'].f.map(f => f[3])) : 180, k = HH() * 3.6 / h; fx(e, N + '_bolt', x, y - h * k, { s: k }); }
  const MV = {
    /* 雷爪：預兆 0.6s → 0.25s 後三道電爪（判定一次）→ 收招 0.3s */
    claw: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'claw'); circle(e.x + e.face * HH() * 1.1, e.y, HH() * 1.5, S(0.6)); },
      step(e, m) { if (m.t < S(0.6)) { e.at = Math.min(e.at, 280); return false; }
        if (m.t === S(0.6) + S(0.25)) { fx(e, N + '_claw_slash', e.x + e.face * HH() * 1.2, e.y - HH() * 0.5, { s: sc(e) * 1.3 }); if (near(e.x + e.face * HH() * 1.1, e.y, HH() * 1.5)) hit(e, 1.3); }
        return m.t > S(0.6) + S(0.25) + S(0.3) + 10; } },
    /* 雷光突進：預兆 0.75s（直線約 7 身）→ 疾衝（殘影，判定一次）→ 收招 0.35s */
    dash: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'dash'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = Math.max(-0.35, Math.min(0.35, dy / d));
        [m.ex, m.ey] = B.api.dashEnd(e.x, e.y, m.dx, m.dy, HH() * 7); lane(e.x, e.y, m.ex, m.ey, HH() * 0.8, S(0.75), '240,210,90'); m.trail = []; },
      step(e, m) { const T = S(0.75);
        if (m.t < T) { e.at = Math.min(e.at, 300); return false; }
        if (m.t === T) { e.at = 420; fx(e, N + '_ground_impact', e.x, e.y, { s: sc(e) * 1.2 }); }
        if (!m.done) { m.trail.push([e.x, e.y]); if (m.trail.length > 5) m.trail.shift(); e.trail = m.trail; e.at = 520;
          const arrived = walkTo(e, m.ex, m.ey, 14); if (!m.hit && near(e.x, e.y, HH() * 0.9)) m.hit = hit(e, 1.5);
          if (arrived || Math.hypot(m.ex - e.x, m.ey - e.y) < 14) { m.done = m.t; e.trail = null; fx(e, N + '_ground_impact', e.x, e.y, { s: sc(e) * 1.4 }); SC.shake = 5; play(e, 'idle', true); } return false; }
        return m.t > m.done + S(0.35); },
      stop(e) { e.trail = null; } },
    /* 落雷：長嘯 0.4s → 主角周圍 6 處（斷尾 3 處）依序預兆 0.9s+0.14s×i → 落雷 → 收招 0.9s */
    rain: { go(e, m) { play(e, 'roar'); m.n = e.broken ? 3 : 6; },
      step(e, m) { if (m.t === S(0.4)) for (let i = 0; i < m.n; i++) { const p = i === 0 ? [H.x, H.y] : SC.snap(H.x + rnd(-2.6, 2.6) * HH(), H.y + rnd(-1, 1) * HH(), 'walk', 120) || [H.x, H.y]; bolt(e, p[0], p[1], 0.9 + i * 0.14); }
        return m.t > S(0.4) + S(0.9 + m.n * 0.14) + S(0.9); } },
    /* 追雷雲：長嘯 0.35s → 雷雲跟著主角（每格最多 1.5）→ 0.6s／2.0s／3.4s 各落一雷（預兆 0.5s）→ 收招 0.7s */
    cloud: { go(e, m) { play(e, 'roar'); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(0.35)) v.cloud = { x: H.x, y: H.y, t: 0, n: 0 };
        const c = v.cloud; if (c) { c.t++; const d = Math.hypot(H.x - c.x, H.y - c.y); if (d > 1) { const k = Math.min(1.5, d) / d; c.x += (H.x - c.x) * k; c.y += (H.y - c.y) * k; }
          for (const at of [0.6, 2.0, 3.4]) if (c.t === S(at - 0.5)) bolt(e, c.x, c.y, 0.5, { follow: c });
          if (c.t > S(3.4) + 30) v.cloud = null; }
        return m.t > S(0.35) + S(3.4) + S(0.7); },
      stop(e) { e.enc.v.cloud = null; } },
    /* 雷獸召喚（二階）：長嘯 → 叫出 2 隻小雷獸（困難以上 +1，場上最多 4）→ 收招 0.8s */
    summon: { go(e, m) { play(e, 'roar'); },
      step(e, m) { if (m.t === S(0.35)) { const v = e.enc.v; v.minions = v.minions.filter(k => k.st !== 'dead'); const want = Math.min(4 - v.minions.length, 2 + ((G.SAVE.data.diff && G.SAVE.data.diff.i >= 1) ? 1 : 0));
          for (let i = 0; i < want; i++) { const p = SC.snap(e.x + (i - 1) * HH() * 1.8, e.y + (i % 2 ? 30 : -30), 'open', 200) || [e.x, e.y]; boltFx(e, p[0], p[1]); fx(e, N + '_electric_burst', p[0], p[1], { s: sc(e) }); const k = G.spawnOni(p[0], p[1], 20, Math.max(1, e.lv - 4), 'enemy_raiju'); if (k) v.minions.push(k); } }
        return m.t > S(0.35) + S(0.8); } },
    /* 連鎖閃電（二階）：離主角最近的水窪＋其 4.4 身內的鄰窪（最多 3，斷尾 2）依序預兆 0.75s+0.3s×i → 導電爆裂 → 收招 0.6s */
    chain: { go(e, m) { play(e, 'roar'); const v = e.enc.v, P = v.pools.slice().sort((a, b) => Math.hypot(a.x - H.x, a.y - H.y) - Math.hypot(b.x - H.x, b.y - H.y)), f = P[0];
        m.list = [f].concat(P.slice(1).filter(p => Math.hypot(p.x - f.x, p.y - f.y) < HH() * 4.4)).slice(0, e.broken ? 2 : 3); },
      step(e, m) { if (m.t === S(0.35)) m.list.forEach((p, i) => { circle(p.x, p.y, HH() * 1.1, S(0.75 + i * 0.3), '120,200,255'); e.enc.v.bolts.push({ e, x: p.x, y: p.y, t: -S(0.75 + i * 0.3), life: 36, r: 1.1, pool: p }); });
        return m.t > S(0.35) + S(0.75 + m.list.length * 0.3) + S(0.6); } },
    /* 雷鳴咆哮（二階）：紫圈預兆 0.85s → 震波，圈內麻痺 70 格 → 收招 0.6s */
    roar: { go(e, m) { play(e, 'roar'); circle(e.x, e.y, HH() * 2.6, S(0.85), '170,110,240'); },
      step(e, m) { if (m.t < S(0.85)) { e.at = Math.min(e.at, 380); return false; }
        if (m.t === S(0.85)) { e.at = 420; fx(e, N + '_shock_wave', e.x, e.y, { s: sc(e) * 2.4 }); SC.shake = 6; if (near(e.x, e.y, HH() * 2.6) && H.inv <= 0) { e.enc.v.stun = 70; e.enc.v.sx = H.x; e.enc.v.sy = H.y; G.UI.toast('麻痺了！'); } }
        return m.t > S(0.85) + S(0.6); } },
    /* 必殺・萬雷（三階，需有已充電的避雷針）：全場警告＋針旁安全光圈 1.2s → 26 道落雷（每 2 格一道）→ 撐過：反受 6% 傷害＋破綻 1.5s */
    ult: { go(e, m) { play(e, 'roar'); e.enc.v.ultWarn = S(1.2); e.enc.v.ultHurt = 0; G.UI.banner('必殺・萬雷', '躲進充好電的避雷針光圈！'); },
      step(e, m) { const v = e.enc.v;
        if (m.t >= S(1.2) && m.t < S(1.2) + 52 && (m.t - S(1.2)) % 2 === 0) { const i = (m.t - S(1.2)) / 2, p = i % 5 === 0 ? [H.x, H.y] : [rnd(80, SC.def.w - 80), rnd(SC.y0, SC.y1)]; v.bolts.push({ e, x: p[0], y: p[1], t: -1, life: 30, ult: 1 }); }
        if (m.t === S(1.2) + 60) { v.ultWarn = 0; if (!v.ultHurt && H.hp > 0) { const d = Math.round(e.hpMax * 0.06); e.hp = Math.max(1, e.hp - d); e.flash = 10; G.NUMS.push({ x: e.x, y: e.y - HH() * 1.6, v: d, crit: true, t: 0 }); G.UI.toast('避雷針把雷導回去了！'); e.open = S(1.5); play(e, 'hurt'); }
          for (const r of v.rods) r.ch = 0; }
        return m.t > S(1.2) + 60 + S(1.4); },
      stop(e) { e.enc.v.ultWarn = 0; } },
    /* 無間・雷神降臨（四階）：先斷一根針 → 三波（斷尾兩波）雷暴：每波 1.2s 預告、12 道亂雷＋2 道追擊；
       斷針旁連砍 3 下可修好（0.9s 後充電）；針旁光圈安全 → 結束破綻 1s */
    raijin: { go(e, m) { play(e, 'roar'); const v = e.enc.v, ok = v.rods.filter(r => !r.br); if (ok.length) { const r = ok[Math.floor(Math.random() * ok.length)]; r.br = 1; r.ch = 0; r.rep = 0; }
        for (const r of v.rods) if (!r.br) r.ch = 1; m.w = 0; m.n = e.broken ? 2 : 3; m.t0 = 0; v.ultWarn = S(1.2); G.UI.banner('雷神降臨', '修好斷掉的避雷針（靠近連砍 3 下）'); },
      step(e, m) { const v = e.enc.v, k = m.t - m.t0;
        if (k >= S(1.2) && k < S(1.2) + 28 && (k - S(1.2)) % 2 === 0) { const i = (k - S(1.2)) / 2, p = i < 2 ? [H.x + rnd(-10, 10), H.y] : [rnd(80, SC.def.w - 80), rnd(SC.y0, SC.y1)]; v.bolts.push({ e, x: p[0], y: p[1], t: -1, life: 30, ult: 1 }); }
        if (k === S(1.2) + 28) v.ultWarn = 0;
        if (k > S(1.2) + 28 + S(0.65)) { if (++m.w >= m.n) { e.open = S(1); play(e, 'hurt'); return true; } m.t0 = m.t; v.ultWarn = S(1.2); play(e, 'roar'); }
        return false; },
      stop(e) { e.enc.v.ultWarn = 0; } }
  };

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.stun > 0) { v.stun--; H.x = v.sx; H.y = v.sy; }
    if (v.ultWarn > 0) v.ultWarn--;
    // 落雷結算
    for (const b of v.bolts) { b.t++; if (b.follow && b.t < 0) { b.x = b.follow.x; b.y = b.follow.y; }
      if (b.t === 0) { boltFx(e, b.x, b.y); fx(e, N + '_electric_burst', b.x, b.y, { s: sc(e) * (b.r ? 1.3 : 1) });
        const rr = HH() * (b.r || 0.8); if (near(b.x, b.y, rr) && !(b.ult && safe(v))) { if (hit(e, 1.2) && b.ult) v.ultHurt = 1; }
        for (const r of v.rods) if (!r.br && Math.hypot(r.x - b.x, (r.y - b.y) * 1.6) < HH() * 1.4 && !r.ch) { r.ch = 1; G.UI.toast('避雷針充電了'); } } }
    v.bolts = v.bolts.filter(b => b.t < b.life);
    // 修針：斷針旁出手 3 次
    if (H.act && H.act !== v.lastAct) { v.lastAct = H.act; for (const r of v.rods) if (r.br && Math.hypot(H.x - r.x, (H.y - r.y) * 1.6) < HH() * 1.1) { r.rep = (r.rep || 0) + 1; fx(e, N + '_electric_burst', r.x, r.y - HH() * 0.8, { s: sc(e) * 0.6 }); if (r.rep >= 3) { r.br = 0; r.fixT = S(0.9); G.UI.toast('避雷針修好了！'); } } }
    if (!H.act) v.lastAct = null;
    for (const r of v.rods) if (r.fixT > 0 && --r.fixT === 0) r.ch = 1;
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(2); play(e, 'roar'); fx(e, N + '_shock_wave', e.x, e.y, { s: sc(e) * 2 }); SC.shake = 8; G.UI.toast(['', '', '雷獸王　怒吼', '雷獸王　雷光全開', '雷神　降臨'][ph]);
      if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.raijin = S(2.4); enc.cd = S(2.4); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'idle' && e.an !== 'hurt') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nearH = near(e.x, e.y, HH() * 2.4); let k;
    if (v.ph >= 4 && !(v.cd.raijin > 0)) { k = 'raijin'; v.cd.raijin = S(26); }
    else if (v.ph >= 3 && !(v.cd.ult > 0) && v.rods.some(r => r.ch && !r.br)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = nearH ? ['claw', 'claw', 'dash', 'rain'] : ['dash', 'rain', 'cloud'];
      if (v.ph >= 2) { L.push('chain', nearH ? 'roar' : 'chain'); if (v.minions.filter(x => x.st !== 'dead').length < 2 && !(v.cd.summon > 0)) L.push('summon'); }
      if (v.ph >= 3 && !v.rods.some(r => r.ch)) L.push('rain', 'cloud');   // 先讓針充電，才放得出萬雷
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'summon') v.cd.summon = S(18); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(0.9, 1.4) : rnd(0.6, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 2.6;
    if (Math.abs(d - want) > HH() * 0.8) { if (e.an !== 'run') play(e, 'run', true); const k = d > want ? 1 : -1; walkTo(e, e.x + (H.x - e.x) / d * HH() * k, e.y + (H.y - e.y) / d * HH() * k, 2.8); }
    else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x); }

  /* ---------- 繪製 ---------- */
  function underBody(e, fr, s, fl, a) { const u = U(); if (!u) return;
    const tr = u.act[N + (e.broken ? '_electric_tail_broken' : '_electric_tail_intact')], f2 = A.frameAt(tr, G.t * TK + e.ph), k = s * 0.55;
    const bx = e.x + (fl ? -1 : 1) * (fr[2] * 0.14 - fr[4]) * s, by = e.y - (fr[5] - fr[3] * 0.38) * s;   // 尾根：原圖面右，左側 14%、高 38%
    ctx.save(); ctx.translate(bx, by); if (fl) ctx.scale(-1, 1); ctx.globalAlpha = a * 0.95; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(u.imgs[f2[7]], f2[0], f2[1], f2[2], f2[3], -f2[4] * k, -f2[5] * k, f2[2] * k, f2[3] * k); ctx.restore();
    const dr = u.act[N + '_drum_ring'].f[0], dk = s * 0.5, cx = e.x + (fl ? -1 : 1) * (fr[2] * 0.42 - fr[4]) * s, cy = e.y - (fr[5] - fr[3] * 0.35) * s + dr[3] * dk * 0.45;   // 背上鼓環
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(u.imgs[dr[7]], dr[0], dr[1], dr[2], dr[3], cx - dr[4] * dk, cy - dr[5] * dk, dr[2] * dk, dr[3] * dk); ctx.restore();
    if (e.trail) e.trail.forEach((p, i) => { ctx.save(); ctx.globalAlpha = 0.12 + i * 0.05; if (fl) { ctx.translate(p[0] * 2, 0); ctx.scale(-1, 1); } ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], p[0] - fr[4] * s, p[1] - fr[5] * s, fr[2] * s, fr[3] * s); ctx.restore(); }); }
  function drawUnder(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const p of v.pools) { ctx.save(); ctx.fillStyle = 'rgba(70,120,170,.45)'; ctx.strokeStyle = 'rgba(190,225,255,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p.x, p.y, HH() * 0.75, HH() * 0.26, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (v.ultWarn > 0) { const a = 0.18 + 0.1 * Math.sin(v.t * 0.5); ctx.save(); ctx.fillStyle = `rgba(230,70,50,${a})`; ctx.fillRect(0, SC.y0 - 40, SC.def.w, SC.y1 - SC.y0 + 80); ctx.restore(); }
    for (const r of v.rods) { if (r.ch && !r.br) { const g = 0.45 + 0.3 * Math.sin(v.t * 0.2); ctx.save(); ctx.fillStyle = `rgba(255,230,120,${g * (v.ultWarn > 0 ? 0.8 : 0.3)})`; ctx.strokeStyle = `rgba(255,236,150,${g})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y, HH() * 1.2, HH() * 1.2 * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); }
      const f = u.act[N + (r.br ? '_rod_broken' : '_rod')].f[0]; A.draw(u, f, r.x, r.y, sc(e) * 0.8, false, 1);
      if (r.br && r.rep) G.txt('修理 ' + r.rep + '／3', r.x, r.y - HH() * 1.8, 10, '#ffd76a', 'center'); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    if (v.cloud) { const f = A.frameAt(Object.assign({}, u.act[N + '_storm_cloud'], { loop: true }), v.cloud.t * TK); A.draw(u, f, v.cloud.x, v.cloud.y - HH() * 3.2, sc(e) * 1.2, false, Math.min(1, v.cloud.t / 15)); }
    if (v.stun > 0 && G.t % 16 < 9) G.txt('麻痺', H.x, H.y - HH() * 1.25, 11, '#c9a8ff', 'center');
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.2, 12, '#ffd76a', 'center'); }

  B.reg('raiju', { name: '雷獸王', sub: '雷原的主人', unit: 'b_raiju', foes: ['enemy_raiju'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R04_07'],
    actors: [{ id: N, name: '雷獸王', size: 1.35, moves: [] }], mv: MV, director, underBody, drawUnder, drawOver,
    init(enc) { const e = R(enc); e.tailHp = e.hpMax * 0.1; const v = enc.v = { ph: 1, cd: {}, bolts: [], minions: [], rods: [], pools: [], cloud: null, stun: 0, ultWarn: 0, t: 0 };
      const av = [[e.x, e.y], [H.x, H.y]];
      for (let i = 0; i < 3; i++) { const p = SC.randSpot('open', null, av, HH() * 3) || [e.x + (i - 1) * HH() * 3, e.y]; av.push(p); v.rods.push({ x: p[0], y: p[1], ch: 0, br: 0 }); }
      for (let i = 0; i < 8; i++) { const p = SC.randSpot('open', null, av, HH() * 1.6); if (p) { av.push(p); v.pools.push({ x: p[0], y: p[1] }); } }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.minions) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.bolts = []; v.cloud = null; v.ultWarn = 0; v.rods = []; v.pools = []; },
    onDamage(e, d) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; }
      if (!e.broken) { e.tailHp -= d * 0.32; if (e.tailHp <= 0) { e.broken = 1; fx(e, N + '_electric_burst', e.x - e.face * HH() * 0.8, e.y - HH() * 0.8, { s: sc(e) * 1.2 }); SC.shake = 6; G.UI.toast('電尾斷了！落雷變少'); } }
      return false; } });
})();
