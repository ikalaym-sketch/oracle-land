/* ==========================================================================
 * 神諭之地 重製版 — 35_boss_tsuchigumo.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第九章頭目「土蜘蛛」（第九章頭目地圖 W_R09_07），P3 原圖（面向右）。
 *           ‧ 場上三座燭台：主角攻擊點亮的燭台＝燭火爆開（半徑內燒掉蛛網與卵；土蜘蛛在範圍內受 4% 傷害＋破綻 1.5 秒），燭台 10 秒後重燃。
 *           ‧ 招式：前腳刺擊（二階起連刺兩次）／吐絲縛身（直線，中招定身 1.2 秒）／窟頂落下（爬上窟頂→影子追人 1.6 秒→鎖定 0.6 秒→落下，落地破綻 1.2 秒）／
 *                   蛛網投擲（落點留蛛網 8 秒，網上移動減速 50%）／產卵（二階，3 顆，9 秒孵化成子蜘蛛；打兩下或燭火燒掉）／
 *                   毒牙（二階、地獄以上：撲咬＋中毒 4 秒）／必殺・千絲萬縷（三階：吹熄兩座燭台，4.5 秒後蛛絲罩滿全場；
 *                   點燃剩下那座燭台可燒斷蛛絲並讓牠破綻 4 秒）／無間・子蜘蛛大群・護卵（四階：分三批放卵、只用刺擊護卵；7 秒內全清＝失衡 4 秒）。
 *           ‧ 三階起場上多兩張不會消失的蛛網（不蓋住燭台，可被燭火燒掉）。子蜘蛛同時最多 4 隻，滿額時卵先休眠。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、敵人 kogumo（子蜘蛛）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, TK, HH } = B.api;
  const N = 'tsuchigumo', U = () => A.get('b_tsuchigumo'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const d2 = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6);
  const MAXKID = 4;
  /* 正面直線：起點身前，長 L、寬 w */
  function front(e, L) { const ang = Math.atan2((H.y - e.y) * 1.6, H.x - e.x); return { x0: e.x + e.face * HH() * 0.5, y0: e.y, x1: e.x + Math.cos(ang) * L, y1: e.y + Math.sin(ang) * L / 1.6 }; }
  const swish = (e, x, y) => fx(e, N + '_leg_swish', x, y - HH() * 0.4, { s: HH() * 1.5 / 176 });
  const MV = {
    /* 前腳刺擊：預兆 0.6s（直線）→ 刺（二階起再刺一次，重新瞄準）→ 收招 0.6s */
    stab: { go(e, m) { m.n = e.enc.v.ph >= 2 ? 2 : 1; m.i = 0; m.t0 = 0; aim(e, m); },
      step(e, m) { const k = m.t - m.t0;
        if (k === S(0.6) - S(0.39)) play(e, 'stab');
        if (k === S(0.6)) { swish(e, m.L.x1 * 0.6 + m.L.x0 * 0.4, m.L.y1 * 0.6 + m.L.y0 * 0.4); if (inLane(m.L.x0, m.L.y0, m.L.x1, m.L.y1, HH() * 0.6)) hit(e, 1.1); }
        if (k === S(0.6) + S(0.45) && ++m.i < m.n) { m.t0 = m.t; aim(e, m); }
        return m.i >= m.n && k > S(0.6) + S(0.6); } },
    /* 吐絲縛身：預兆 0.7s（直線 5 身）→ 蛛絲射出，中招＝傷害＋定身 1.2s → 收招 0.5s */
    spit: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'spit'); m.L = front(e, HH() * 5); lane(m.L.x0, m.L.y0, m.L.x1, m.L.y1, HH() * 0.9, S(0.7), '235,235,220'); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(0.7)) { v.silks.push(Object.assign({ t: 0, life: 22 }, m.L)); if (inLane(m.L.x0, m.L.y0, m.L.x1, m.L.y1, HH() * 0.5) && hit(e, 0.8)) bind(v, S(1.2)); }
        return m.t > S(1.2); } },
    /* 窟頂落下：爬上窟頂（0.8s，消失、無敵）→ 影子追主角 1.6s → 鎖定 0.6s（落點圈）→ 落下判定 → 落地破綻 1.2s */
    drop: { go(e, m) { play(e, 'climb'); m.ph = 0; },
      step(e, m) { const v = e.enc.v;
        if (m.ph === 0 && m.t >= S(0.78)) { m.ph = 1; m.t0 = m.t; e.hide = 1; e.nobar = 1; v.shadow = { x: e.x, y: e.y, lock: 0 }; return false; }
        if (m.ph === 1) { const s = v.shadow, k = m.t - m.t0;
          if (k < S(1.6)) { const dx = H.x - s.x, dy = H.y - s.y, d = Math.hypot(dx, dy); if (d > 3) { s.x += dx / d * Math.min(d, 4.2); s.y += dy / d * Math.min(d, 4.2) * 0.8; } }
          else if (!s.lock) { s.lock = 1; const p = SC.snap(s.x, s.y, 'walk', 160) || [e.x, e.y]; s.x = p[0]; s.y = p[1]; circle(s.x, s.y, HH() * 1.7, S(0.6), '200,80,60'); }
          if (k >= S(1.6) + S(0.6)) { m.ph = 2; e.x = s.x; e.y = s.y; e.hide = 0; e.nobar = 0; v.shadow = null; e.face = sgn(H.x - e.x) || 1; play(e, 'drop');
            fx(e, N + '_impact', e.x, e.y, { s: HH() * 3 / 256 }); SC.shake = 8; if (near(e.x, e.y, HH() * 1.7)) hit(e, 1.4); e.open = S(1.2); m.t0 = m.t; }
          return false; }
        return m.ph === 2 && m.t - m.t0 > S(1.3); },
      stop(e) { e.hide = 0; e.nobar = 0; e.enc.v.shadow = null; } },
    /* 蛛網投擲：預兆 0.9s（落點圈）→ 網球落地：留蛛網 8s，落點中招＝傷害＋定身 0.8s */
    net: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'spit'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 1.1, S(0.9), '235,235,220'); e.enc.v.balls.push({ sx: e.x + e.face * HH() * 0.6, sy: e.y, tx: m.x, ty: m.y, t: 0, life: S(0.9) }); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(0.9)) { fx(e, N + '_web', m.x, m.y, { s: HH() * 2.2 / 256 }); addWeb(v, m.x, m.y, S(8)); if (near(m.x, m.y, HH() * 1.1) && hit(e, 0.6)) bind(v, S(0.8)); }
        return m.t > S(1.4); } },
    /* 產卵（二階）：0.5s 時放下 3 顆卵（場上已有 3 顆就不放），9s 後孵化 */
    lay: { go(e, m) { play(e, 'lay'); },
      step(e, m) { if (m.t === S(0.5)) layEggs(e, 3, S(9), 0); return m.t > S(1.1); } },
    /* 毒牙（二階、地獄以上）：預兆 0.5s（短直線）→ 撲咬 0.3s（移動 2 身）→ 中招＝傷害＋中毒 4s → 收招 0.6s */
    bite: { go(e, m) { e.face = sgn(H.x - e.x); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.dx = dx / d; m.dy = dy / d;
        m.end = dashEnd(e.x, e.y, m.dx, m.dy * 0.7, Math.max(0, Math.min(d - HH() * e.size * 0.8, HH() * 2.6))); lane(e.x, e.y, m.end[0], m.end[1], HH() * 1.0, S(0.5), '170,90,200'); },
      step(e, m) { if (m.t === S(0.5) - S(0.26)) play(e, 'bite');
        if (m.t > S(0.5) && m.t <= S(0.8)) { const q = (m.t - S(0.5)) / S(0.3); e.x += (m.end[0] - e.x) * Math.min(1, q * 1.5); e.y += (m.end[1] - e.y) * Math.min(1, q * 1.5); }
        if (m.t === S(0.8)) { const hx = e.x + e.face * HH() * e.size * 0.7; fx(e, N + '_venom', hx, e.y - HH() * 0.3, { s: HH() * 1.6 / 256 }); if (near(hx, e.y, HH() * 0.9) && hit(e, 1.2)) { e.enc.v.venom = S(4); G.UI.toast('中毒了！'); } }
        return m.t > S(1.4); } },
    /* 必殺・千絲萬縷（三階）：吹熄燭台只留 1 座 → 蛛絲由本體往外罩滿全場 4.5s → 結繭（全場傷害＋定身 1.5s）；
       期間點燃剩下的燭台＝燒斷蛛絲、破綻 4s＋受 6% 傷害 */
    ult: { go(e, m) { const v = e.enc.v; play(e, 'ultimate'); G.UI.banner('必殺・千絲萬縷', '點燃剩下的燭台！');
        const lit = v.candles.filter(c => c.lit); const keep = lit.sort((p, q) => d2(q, e) - d2(p, e))[0] || v.candles[0];
        for (const c of v.candles) { if (c !== keep) { c.lit = 0; c.re = S(14); } } keep.lit = 1; keep.re = 0; keep.hint = 1;
        v.webs = v.webs.filter(w => d2(w, keep) > HH() * 1.4 + w.r);   // 不讓蛛網封死唯一的燭台
        v.ult = { x: e.x, y: e.y, t: 0, life: S(4.5), c: keep }; },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(0.8)) play(e, 'spit');
        if (!v.ult) { if (!m.burnt) { m.burnt = 1; m.t0 = m.t; } return m.t - m.t0 > S(1.0); }
        if (m.t >= S(4.5)) { const u = v.ult; v.ult = null; fx(e, N + '_cocoon', H.x, H.y, { s: HH() * 1.8 / 256 }); if (hit(e, 2.0)) bind(v, S(1.5), 1); u.c.hint = 0; m.t0 = m.t; m.burnt = 1; return false; }
        return false; },
      stop(e) { const v = e.enc.v; if (v.ult) { v.ult.c.hint = 0; v.ult = null; } } },
    /* 無間・子蜘蛛大群・護卵（四階）：分三批放卵（每 1.2s 一顆，7s 孵化）→ 護卵 8s（只用刺擊）；卵在孵化前全清＝失衡 4s */
    swarm: { go(e, m) { play(e, 'guard'); G.UI.banner('子蜘蛛大群', '趁孵化前把卵全部清掉！'); e.enc.v.swarm = { eggs: [], t: 0 }; },
      step(e, m) { const v = e.enc.v; for (let i = 0; i < 3; i++) if (m.t === S(0.4 + i * 1.2)) { if (i) play(e, 'lay'); v.swarm.eggs.push(...layEggs(e, 1, S(7), 1)); }
        if (m.t === S(3.0)) v.guard = S(8);
        return m.t > S(3.2); } }
  };
  function aim(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'guard'); m.L = front(e, HH() * e.size * 1.9); lane(m.L.x0, m.L.y0, m.L.x1, m.L.y1, HH() * 1.0, S(0.6)); }
  function bind(v, t, cocoon) { v.bind = Math.max(v.bind, t); v.cocoon = cocoon ? t : 0; G.UI.toast(cocoon ? '被蛛絲結成繭了！' : '被蛛絲纏住了！'); }
  function addWeb(v, x, y, life) { const tmp = v.webs.filter(w => w.life < 1e8); if (tmp.length >= 5) v.webs.splice(v.webs.indexOf(tmp[0]), 1); v.webs.push({ x, y, r: HH() * 1.1, t: 0, life }); }
  function layEggs(e, n, hatch, sw) { const v = e.enc.v, out = [];
    for (let i = 0; i < n; i++) { if (v.eggs.filter(g => !g.dead).length >= 3 + (sw ? 3 : 0)) break;
      const a = Math.random() * 6.283, p = SC.snap(e.x + Math.cos(a) * HH() * 2.2, e.y + Math.sin(a) * HH() * 1.0, 'open', 160); if (!p) continue;
      const g = { x: p[0], y: p[1], hp: 2, t: 0, hatch, dead: 0, sw }; v.eggs.push(g); out.push(g); fx(e, N + '_egg_break', g.x, g.y - HH() * 0.2, { s: HH() * 0.9 / 256 }); }
    return out; }
  function killEgg(e, g, why) { g.dead = 1; g.t = 0; fx(e, N + '_egg_break', g.x, g.y - HH() * 0.25, { s: HH() * 1.4 / 256 }); if (why) G.UI.toast(why); }
  /* 燭火爆開：燒卵、燒網、燒土蜘蛛 */
  function ignite(e, c) { const v = e.enc.v, r = HH() * 1.9; c.lit = 0; c.re = S(10); c.hint = 0; v.burst.push({ x: c.x, y: c.y, r, t: 0, life: S(1.0) }); SC.shake = 5;
    let n = 0; for (const g of v.eggs) if (!g.dead && d2(g, c) < r) { killEgg(e, g); n++; }
    const w0 = v.webs.length; v.webs = v.webs.filter(w => d2(w, c) > r * 0.8 + w.r * 0.5);
    if (v.ult && v.ult.c === c) { v.ult = null; G.UI.banner('燒斷蛛絲', '土蜘蛛露出破綻！'); hurtBoss(e, 0.06); e.open = S(4); play(e, 'stagger'); return; }
    if (!e.hide && d2(e, c) < r + HH() * 0.6) { hurtBoss(e, 0.04); e.open = Math.max(e.open || 0, S(1.5)); G.UI.toast('燭火燒到土蜘蛛了！'); }
    else G.UI.toast(n ? '燒掉了 ' + n + ' 顆卵' : w0 > v.webs.length ? '燒掉了蛛網' : '燭火爆開'); }
  function hurtBoss(e, k) { const d = Math.round(e.hpMax * k); e.hp = Math.max(1, e.hp - d); e.flash = 12; G.NUMS.push({ x: e.x, y: e.y - HH() * 1.4, v: d, crit: true, t: 0 }); }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (v.guard > 0) v.guard--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    for (const b of v.balls) b.t++; v.balls = v.balls.filter(b => b.t < b.life);
    for (const s of v.silks) s.t++; v.silks = v.silks.filter(s => s.t < s.life);
    for (const b of v.burst) b.t++; v.burst = v.burst.filter(b => b.t < b.life);
    for (const w of v.webs) w.t++; v.webs = v.webs.filter(w => w.t < w.life);
    if (v.ult) v.ult.t++;
    // 燭台重燃
    for (const c of v.candles) if (!c.lit && c.re > 0 && --c.re <= 0) c.lit = 1;
    // 卵：孵化／休眠
    v.kids = v.kids.filter(k => k.st !== 'dead');
    for (const g of v.eggs) { g.t++; if (g.dead) continue;
      if (g.t >= g.hatch) { if (v.kids.length < MAXKID) { g.dead = 2; g.t = 0; const k = G.spawnOni(g.x, g.y, 6, Math.max(1, e.lv - 4), 'kogumo'); if (k) v.kids.push(k); } else g.t = g.hatch - 1; } }
    v.eggs = v.eggs.filter(g => !g.dead || g.t < 50);
    if (v.swarm) { const L = v.swarm.eggs; if (L.length === 3 && L.every(g => g.dead)) { const ok = L.every(g => g.dead === 1); v.swarm = null; v.guard = 0;
        if (ok) { e.open = S(4); if (e.mv) B.api.end(e); play(e, 'stagger'); G.UI.banner('清卵成功', '土蜘蛛失去平衡！'); } } }
    // 主角：定身／蛛網減速／中毒
    if (v.bind > 0) v.bind--; if (v.cocoon > 0) v.cocoon--;
    if (v.venom > 0 && --v.venom % 30 === 0) hit(e, 0.15);
    const inWeb = v.webs.some(w => near(w.x, w.y, w.r)), dodge = H.act && (H.act.kind === 'dodge' || H.act.kind === 'dash');
    if (v.px !== undefined && (v.bind > 0 || (inWeb && !dodge))) { const k = v.bind > 0 ? 0 : 0.5; H.x = v.px + (H.x - v.px) * k; H.y = v.py + (H.y - v.py) * k; }
    v.px = H.x; v.py = H.y;
    // 主角出手：打卵（兩下）、點燭台
    if (H.act && H.act !== v.lastAct && /atk|skill|ult/.test(H.act.kind)) { v.lastAct = H.act; const hx = H.x + H.face * HH() * 0.4;
      for (const g of v.eggs) if (!g.dead && Math.hypot(hx - g.x, (H.y - g.y) * 1.6) < HH() * 0.95) { g.hp--; g.flash = 8; if (g.hp <= 0) killEgg(e, g); }
      for (const c of v.candles) if (c.lit && Math.hypot(hx - c.x, (H.y - c.y) * 1.6) < HH() * 0.9) ignite(e, c); }
    if (!H.act) v.lastAct = null;
    for (const g of v.eggs) if (g.flash > 0) g.flash--;
    // 階段
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(1.5); play(e, 'guard'); SC.shake = 6; G.UI.toast(['', '', '土蜘蛛　開始產卵', '土蜘蛛　窟中結網', '子蜘蛛　大群'][ph]);
      if (ph === 2) v.cd.lay = S(1.5);
      if (ph === 3) { for (let i = 0; i < 2; i++) { const p = SC.randSpot('open', null, v.candles.map(c => [c.x, c.y]).concat([[e.x, e.y], [H.x, H.y]]), HH() * 2.6); if (p) v.webs.push({ x: p[0], y: p[1], r: HH() * 1.3, t: 0, life: 1e9 }); } v.cd.ult = S(2.4); }
      if (ph === 4) v.cd.swarm = S(2.0); enc.cd = S(2.0); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'stagger' && e.an !== 'idle' && e.an !== 'drop') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 3.2); let k;
    if (v.guard > 0) { if (!nr) { keep(e); return; } k = 'stab'; }
    else if (v.ph >= 4 && !(v.cd.swarm > 0) && !v.swarm) { k = 'swarm'; v.cd.swarm = S(24); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = nr ? ['stab', 'stab', 'spit', 'net'] : ['spit', 'net', 'spit'];
      if (!(v.cd.drop > 0)) L.push('drop');
      if (v.ph >= 2) { if (!(v.cd.lay > 0) && v.eggs.filter(g => !g.dead).length < 3) L.push('lay', 'lay'); if (enc.diff >= 2 && nr) L.push('bite'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'drop') v.cd.drop = S(9); if (k === 'lay') v.cd.lay = S(15); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 2.6;
    if (d > want) { if (e.an !== 'walk') play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 1.6); } else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x) || e.face; }

  /* ---------- 繪製 ---------- */
  function flat(u, fr, x, y, w, a) { const im = u.imgs[fr[7]]; if (!im) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1, 0.45); const k = w / fr[2]; ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    const web = u.act[N + '_web'].f[2];
    for (const w of v.webs) flat(u, web, w.x, w.y, w.r * 2.3, Math.min(0.85, w.t / 10, (w.life - w.t) / 20));
    if (v.ult) { const q = v.ult.t / v.ult.life, r = HH() * 9 * q; ctx.save(); ctx.fillStyle = `rgba(240,238,225,${0.12 + 0.18 * q})`; ctx.strokeStyle = 'rgba(250,250,240,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(v.ult.x, v.ult.y, r, r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (v.shadow) { const s = v.shadow, k = s.lock ? 1 : 0.8; ctx.save(); ctx.fillStyle = `rgba(20,10,10,${s.lock ? 0.55 : 0.38})`; ctx.beginPath(); ctx.ellipse(s.x, s.y, HH() * 1.5 * k, HH() * 0.55 * k, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
    for (const c of v.candles) { A.draw(u, u.act[N + (c.lit ? '_candle_lit' : '_candle')].f[0], c.x, c.y, HH() * 1.4 / 256, false, 1);
      if (c.hint && c.lit) { const g = 0.5 + 0.4 * Math.sin(v.t * 0.25); ctx.save(); ctx.strokeStyle = `rgba(255,200,90,${g})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y, HH() * 0.7, HH() * 0.26, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
      if (!c.lit && c.re > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,200,120,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y - HH() * 1.6, 7, -1.57, -1.57 + 6.283 * (1 - c.re / S(10))); ctx.stroke(); ctx.restore(); } }
    for (const g of v.eggs) { const n = g.dead ? '_egg_open' : g.t > g.hatch - S(3) ? '_egg_cracked' : '_egg', a = g.dead ? Math.max(0, 1 - g.t / 50) : 1;
      if (g.dead === 1) continue; A.draw(u, u.act[N + n].f[0], g.x, g.y, HH() * 0.95 / 256, false, a);
      if (g.flash > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(g.x, g.y - HH() * 0.45, HH() * 0.36, HH() * 0.45, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
      if (!g.dead) { const q = g.t / g.hatch; ctx.save(); ctx.strokeStyle = q > 0.66 ? 'rgba(240,80,60,.9)' : 'rgba(240,220,160,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(g.x, g.y, HH() * 0.55, HH() * 0.2, 0, -1.57, -1.57 + 6.283 * q); ctx.stroke(); ctx.restore(); } } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const ball = u.act[N + '_net_ball'].f[0];
    for (const b of v.balls) { const q = b.t / b.life, x = b.sx + (b.tx - b.sx) * q, y = b.sy + (b.ty - b.sy) * q - Math.sin(q * Math.PI) * HH() * 1.8; A.draw(u, ball, x, y, HH() * (0.35 + 0.25 * q) / 256, false, 1); }
    const sk = u.act[N + '_silk'];
    for (const s of v.silks) { const fr = A.frameAt(sk, s.t / s.life * 520), L = Math.hypot(s.x1 - s.x0, s.y1 - s.y0); ctx.save(); ctx.translate(s.x0, s.y0 - HH() * 0.35); ctx.rotate(Math.atan2(s.y1 - s.y0, s.x1 - s.x0)); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], 0, -HH() * 0.25, L, HH() * 0.5); ctx.restore(); }
    const fl = u.act[N + '_flame'];
    for (const b of v.burst) { const fr = A.frameAt(fl, b.t * TK * 1.6); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, q = Math.min(1, b.t / 12), x = b.x + Math.cos(a) * b.r * 0.7 * q, y = b.y + Math.sin(a) * b.r * 0.3 * q; A.draw(u, fr, x, y, HH() * 0.9 / 256, false, 1 - b.t / b.life); } }
    if (v.bind > 0) { if (v.cocoon > 0) { const fr = u.act[N + '_cocoon'].f[2]; A.draw(u, fr, H.x, H.y + HH() * 0.2, HH() * 1.3 / 256, false, 0.85); }
      else { const fr = u.act[N + '_web'].f[1]; A.draw(u, fr, H.x, H.y - HH() * 0.35, HH() * 1.0 / 256, false, 0.8); } }
    if (v.venom > 0 && G.t % 30 < 18) G.txt('毒', H.x + 14, H.y - HH() * 1.3, 11, '#c890f0', 'center');
    if (e.open > 0 && e.st !== 'dead' && !e.hide) G.txt('破綻！', e.x, e.y - HH() * e.size * 1.25, 12, '#ffd76a', 'center'); }

  B.reg('tsuchigumo', { name: '土蜘蛛', sub: '蛛窟之母', unit: 'b_tsuchigumo', foes: ['kogumo'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R09_07'],
    actors: [{ id: N, name: '土蜘蛛', size: 1.45, moves: [] }], mv: MV, director, drawUnder, drawOver, drawSelf: e => !!e.hide,
    init(enc) { const e = R(enc); const v = enc.v = { ph: 1, cd: { drop: S(4) }, candles: [], webs: [], eggs: [], kids: [], balls: [], silks: [], burst: [], shadow: null, ult: null, swarm: null, guard: 0, bind: 0, cocoon: 0, venom: 0, t: 0 };
      for (let i = 0; i < 3; i++) { const a = i * 2.094 - 1.571, p = SC.snap(e.x - HH() * 1.0 + Math.cos(a) * HH() * 3.6, e.y + Math.sin(a) * HH() * 1.7, 'open', 160); if (p) v.candles.push({ x: p[0], y: p[1], lit: 1, re: 0, hint: 0 }); }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.kids) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.eggs = []; v.webs = []; v.balls = []; v.silks = []; v.ult = null; v.shadow = null; v.bind = 0; v.venom = 0; },
    preDamage(e) { return !!e.hide; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
})();
