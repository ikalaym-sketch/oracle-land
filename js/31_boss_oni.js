/* ==========================================================================
 * 神諭之地 重製版 — 31_boss_oni.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.9 宣告 foes（召喚小怪圖集隨頭目預載，避免叫不出來）。
 * 變更    : r3.8.6 新增。第五章頭目「鬼王」（第五章頭目地圖 W_R05_07），P3 原圖（面向右）。
 *           ‧ 招式：金棒橫掃（斷棒＝鬼拳）／震地＋鐘乳石／鐵鍊拉扯／落石雨／小鬼召喚／金棒三連／火盆投擲／必殺・鬼王怒號／無間・百鬼召來。
 *           ‧ 金棒可破壞：受傷的 35% 打在金棒上（金棒血量＝最大血量 12%）→ 換斷棒圖，橫掃改短距鬼拳。
 *           ‧ 落石與震地留下殘骸（掩體，最多 5 個）；鬼王怒號：躲在殘骸後方（殘骸在你與鬼王之間）才安全，場上沒掩體會先砸一塊。
 *           ‧ 原圖修正：橫掃原圖只有站姿 0.69 倍 → 放大 1.45；行走 0.92 → 放大 1.08。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, sc, fx, lane, circle, inLane, inCircle, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'oniking', U = () => A.get('b_oni'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const imp = (e, x, y, k) => fx(e, N + '_ground_impact', x, y, { s: sc(e) * (k || 1.2) });
  /* 落物：預兆圈 tl 秒 → 落下（判定）→ 留殘骸 */
  function drop(e, x, y, tl, kind) { const v = e.enc.v; circle(x, y, HH() * 0.75, S(tl), '200,120,60'); v.falls.push({ e, x, y, t: -S(tl), kind: kind || (Math.random() < 0.5 ? 'stalactite_long' : 'falling_boulder') }); }
  function addDebris(v, x, y) { if (!SC.walkable(x, y)) return; v.debris.push({ x, y, tall: Math.random() < 0.4, t: 0 }); if (v.debris.length > 5) v.debris.shift(); }
  const covered = (e, v) => v.debris.some(d => { const dh = Math.hypot(H.x - d.x, (H.y - d.y) * 1.6), db = Math.hypot(e.x - d.x, e.y - d.y), hb = Math.hypot(e.x - H.x, e.y - H.y); return dh < HH() * 1.1 && db < hb; });

  /* 橫掃／鬼拳：預兆 → 出手 0.14s → 收招 */
  function swing(e, m, rev) {
    const br = e.broken, T = S(br ? 0.5 : (m.tl || 0.6)), rec = S(br ? 0.3 : 0.42);
    if (m.t === 1) { e.face = sgn(H.x - e.x) * (rev ? 1 : 1); play(e, br ? 'punch' : 'sweep'); if (rev) e.at = 0;
      if (br) lane(e.x, e.y, e.x + e.face * HH() * 1.95, e.y, HH() * 0.6, T); else circle(e.x + e.face * HH() * 0.9, e.y, HH() * 2.6, T); }
    if (m.t < T) { e.at = Math.min(e.at, br ? 260 : 270); return false; }
    if (m.t === T) e.at = br ? 420 : 290;
    if (m.t === T + S(0.14)) { if (br) { fx(e, N + '_ground_impact', e.x + e.face * HH() * 1.5, e.y - HH() * 0.6, { s: sc(e) * 0.8 }); if (inLane(e.x, e.y, e.x + e.face * HH() * 1.95, e.y, HH() * 0.6)) hit(e, 1.2); }
      else { fx(e, N + '_sweep_wake', e.x + e.face * HH() * 0.9, e.y - HH() * 0.5, { s: sc(e) * 1.6 }); if (near(e.x + e.face * HH() * 0.9, e.y, HH() * 2.6)) { if (hit(e, 1.4)) knock(e, HH() * 0.9); } } }
    return m.t > T + S(0.14) + rec;
  }
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + e.face * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  function slam(e, m, o) { const T = S((o && o.tl) || 0.7), fx0 = e.x + e.face * HH() * 1.2;
    if (m.t === 1) { e.face = sgn(H.x - e.x); play(e, 'slam'); circle(e.x + e.face * HH() * 1.2, e.y, HH() * 1.5, T); }
    if (m.t < T) { e.at = Math.min(e.at, 400); return false; }
    if (m.t === T) e.at = 420;
    if (m.t === T + 6) { imp(e, fx0, e.y, 1.8); SC.shake = 8; if (near(fx0, e.y, HH() * 1.5)) hit(e, 1.5); if (!o || !o.noRock) drop(e, H.x + rnd(-20, 20), H.y + rnd(-8, 8), 1.0, 'stalactite_long'); }
    return m.t > T + 6 + S(0.5) + S(0.4); }

  const MV = {
    sweep: { go() {}, step: (e, m) => swing(e, m) },
    slam: { go() {}, step: (e, m) => slam(e, m) },
    /* 鐵鍊拉扯：預兆 0.65s（直線）→ 甩鉤 0.28s → 拉中：拉到面前＋傷害；落空：收鏈 0.45s → 收招 0.35s */
    chain: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'chain'); m.L = HH() * 5.5; m.ty = H.y; lane(e.x, e.y, e.x + e.face * m.L, m.ty, HH() * 0.5, S(0.65), '200,200,210'); },
      step(e, m) { const T = S(0.65), c = S(0.28);
        if (m.t < T) { e.at = Math.min(e.at, 260); return false; }
        if (m.t <= T + c) { const k = (m.t - T) / c; m.hx = e.x + e.face * m.L * k; m.hy = e.y + (m.ty - e.y) * k; e.enc.v.hook = { e, x: m.hx, y: m.hy };
          if (!m.caught && Math.abs(H.x - m.hx) < HH() * 0.5 && Math.abs(H.y - m.hy) < 22) { m.caught = 1; m.ct = m.t; if (hit(e, 0.8)) G.UI.toast('被鐵鍊拉過去了！'); } return false; }
        const hold = S(m.caught ? 0.5 : 0.45), k = Math.min(1, (m.t - T - c) / hold);
        m.hx += (e.x + e.face * HH() * 0.6 - m.hx) * 0.2; m.hy += (e.y - m.hy) * 0.2; e.enc.v.hook = k < 1 ? { e, x: m.hx, y: m.hy } : null;
        if (m.caught && k < 1) { const tx = e.x + e.face * HH() * 1.1; if (SC.walkable(H.x + (tx - H.x) * 0.2, H.y + (e.y - H.y) * 0.2)) { H.x += (tx - H.x) * 0.2; H.y += (e.y - H.y) * 0.2; } }
        if (k >= 1 && !m.endT) m.endT = m.t;
        return m.endT && m.t > m.endT + S(0.35); },
      stop(e) { e.enc.v.hook = null; } },
    /* 落石雨（二階）：震地 → 5 處落石（各預兆 1.0s，間隔 0.12s）→ 殘骸成掩體 */
    rocks: { go() {}, step(e, m) { if (m.t === S(0.7) + 6) for (let i = 0; i < 5; i++) { const p = i === 0 ? [H.x, H.y] : SC.snap(H.x + rnd(-3, 3) * HH(), H.y + rnd(-1.2, 1.2) * HH(), 'walk', 120) || [H.x, H.y]; drop(e, p[0], p[1], 1.0 + i * 0.12); }
        return slam(e, m, { noRock: 1 }) && m.t > S(0.7) + S(1.6); } },
    /* 小鬼召喚：預備 0.4s → 怒號 1.0s 叫出黃鬼／綠鬼各 1（場上最多 4） */
    summon: { go(e, m) { play(e, 'roar'); },
      step(e, m) { if (m.t === S(0.4)) { const v = e.enc.v; v.minions = v.minions.filter(k => k.st !== 'dead'); const n = Math.min(2, 4 - v.minions.length);
          for (let i = 0; i < n; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; fx(e, N + '_summon_wisps', p[0], p[1], { s: sc(e) * 1.2 }); const k = G.spawnOni(p[0], p[1], 24, Math.max(1, e.lv - 4), i ? 'midorioni' : 'kioni'); if (k) v.minions.push(k); } }
        return m.t > S(1.4); } },
    /* 金棒三連（二階）：橫掃 → 回掃 → 震地（斷棒：鬼拳 ×2 → 拳震地） */
    triple: { go(e, m) { m.i = 0; m.sub = { t: 0, tl: 0.6 }; },
      step(e, m) { const s = m.sub; s.t++; const done = m.i < 2 ? swing(e, s, m.i === 1) : slam(e, s, { tl: 0.6 });
        if (!done) return false; if (++m.i >= 3) return true; m.sub = { t: 0, tl: 0.45 }; return false; } },
    /* 火盆投擲（三階）：預備 0.25s → 三個火盆（0／0.28／0.56s）飛向主角附近 → 火區 4s → 收招 0.5s */
    pots: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'chain'); },
      step(e, m) { [0, 0.28, 0.56].forEach((o, i) => { if (m.t === S(0.25 + o)) { const tx = H.x + (i - 1) * HH() * 1.4 + rnd(-12, 12), ty = H.y + rnd(-14, 14); circle(tx, ty, HH() * 0.95, S(0.6), '240,120,40'); e.enc.v.pots.push({ e, sx: e.x + e.face * 20, sy: e.y, tx, ty, t: 0, life: S(0.6) }); } });
        return m.t > S(0.25 + 0.56) + S(0.5); } },
    /* 必殺・鬼王怒號（三階）：全場警告 1.6s（沒有掩體就先砸一塊）→ 全場震波：殘骸後方安全 → 收招 1.0s */
    ult: { go(e, m) { const v = e.enc.v; play(e, 'roar'); if (!v.debris.length) { const p = SC.snap(H.x + (e.x - H.x) * 0.5, H.y, 'open', 200) || [H.x, H.y]; drop(e, p[0], p[1], 0.8, 'falling_boulder'); }
        v.warn = S(1.6); G.UI.banner('必殺・鬼王怒號', '躲到殘骸後面！'); },
      step(e, m) { const v = e.enc.v; if (m.t < S(1.6)) { e.at = Math.min(e.at, 380); return false; }
        if (m.t === S(1.6)) { e.at = 420; v.warn = 0; fx(e, N + '_roar_wave', e.x, e.y, { s: sc(e) * 4 }); SC.shake = 12; if (covered(e, v)) G.UI.toast('殘骸擋住了怒號'); else hit(e, 2.4); }
        return m.t > S(1.6) + S(1.0); },
      stop(e) { e.enc.v.warn = 0; } },
    /* 無間・百鬼召來（四階）：三波：紫色號令環 0.8s → 叫 1 隻鬼（上限 4，最後一波黑鬼）→ 0.35s → 重擊（預兆 0.9s）→ 間隔 1.4s；直接打斷（短時間累積 0.6% 血）會讓他硬直 1.5s */
    hyakki: { go(e, m) { m.w = 0; m.t0 = 0; e.enc.v.hy = { dmg: 0 }; G.UI.banner('百鬼召來・巢主號令', '號令時打他可以打斷'); },
      step(e, m) { const v = e.enc.v, k = m.t - m.t0;
        if (k === 1) { play(e, 'roar'); circle(e.x, e.y, HH() * 2.2, S(0.8), '170,90,220'); v.hy.dmg = 0; }
        if (k < S(0.8) && v.hy.dmg > e.hpMax * 0.006) { G.UI.toast('號令被打斷了！'); play(e, 'hurt'); e.open = S(1.5); return true; }
        if (k === S(0.8)) { fx(e, N + '_roar_wave', e.x, e.y, { s: sc(e) * 2 }); v.minions = v.minions.filter(x => x.st !== 'dead'); if (v.minions.length < 4) { const p = SC.snap(e.x - e.face * HH() * 1.6, e.y + rnd(-30, 30), 'open', 200) || [e.x, e.y]; fx(e, N + '_summon_wisps', p[0], p[1], { s: sc(e) * 1.2 }); const kk = G.spawnOni(p[0], p[1], 24, Math.max(1, e.lv - 3), m.w === 2 ? 'kurooni' : ['kioni', 'midorioni'][m.w]); if (kk) v.minions.push(kk); } }
        if (k > S(0.8) + S(0.35)) { m.sub = m.sub || { t: 0, tl: 0.9 }; m.sub.t++; if (swing(e, m.sub)) { m.sub = null; if (++m.w >= 3) { e.open = S(1); return true; } m.t0 = m.t + S(1.4) - S(0.8) - S(0.35); } }
        return false; },
      stop(e) { e.enc.v.hy = null; } }
  };

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (v.warn > 0) v.warn--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    for (const f of v.falls) { f.t++; if (f.t === 0) { imp(e, f.x, f.y, 1.3); SC.shake = 4; if (near(f.x, f.y, HH() * 0.75)) hit(e, 1.1); addDebris(v, f.x, f.y); } }
    v.falls = v.falls.filter(f => f.t < 12);
    for (const p of v.pots) { p.t++; if (p.t === p.life) { imp(e, p.tx, p.ty, 1); v.fires.push({ e, x: p.tx, y: p.ty, t: 0, life: S(4) }); if (near(p.tx, p.ty, HH() * 0.95)) hit(e, 0.9); } }
    v.pots = v.pots.filter(p => p.t < p.life + 1);
    for (const f of v.fires) { f.t++; if (f.t % 30 === 0 && near(f.x, f.y, HH() * 0.95)) hit(e, 0.25); } v.fires = v.fires.filter(f => f.t < f.life);
    for (const d of v.debris) d.t++;
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(2); play(e, 'roar'); fx(e, N + '_roar_wave', e.x, e.y, { s: sc(e) * 2 }); SC.shake = 8; G.UI.toast(['', '', '鬼王　暴怒', '鬼王　怒號震天', '百鬼之主　覺醒'][ph]);
      if (ph === 2) for (let i = 0; i < 3; i++) { const p = SC.randSpot('open', null, [[e.x, e.y], [H.x, H.y]], HH() * 2); if (p) drop(e, p[0], p[1], 0.9 + i * 0.2, 'falling_boulder'); }   // 二階：先砸 3 塊安全岩
      if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.hy = S(2.4); enc.cd = S(2.4); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    const nr = near(e.x, e.y, HH() * 2.6); let k;
    if (v.ph >= 4 && !(v.cd.hy > 0)) { k = 'hyakki'; v.cd.hy = S(24); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(24); }
    else { const L = nr ? ['sweep', 'sweep', 'slam', 'chain'] : ['chain', 'chain', 'slam'];
      if (v.ph >= 2) { L.push(nr ? 'triple' : 'rocks', 'rocks'); if (v.minions.filter(x => x.st !== 'dead').length < 2 && !(v.cd.summon > 0)) L.push('summon'); }
      if (v.ph >= 3) L.push('pots', 'pots');
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'summon') v.cd.summon = S(18); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.2));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 2;   // 鬼王是近戰：慢慢逼近
    if (d > want) { if (e.an !== 'walk') play(e, 'walk', true); walkTo(e, H.x - sgn(H.x - e.x) * want * 0.9, H.y, 1.4); } else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x); }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    if (v.warn > 0) { const a = 0.16 + 0.1 * Math.sin(v.t * 0.5); ctx.save(); ctx.fillStyle = `rgba(230,70,50,${a})`; ctx.fillRect(0, SC.y0 - 40, SC.def.w, SC.y1 - SC.y0 + 80); ctx.restore();
      for (const d of v.debris) { const bx = d.x - e.x, by = d.y - e.y, L = Math.hypot(bx, by) || 1; ctx.save(); ctx.fillStyle = 'rgba(120,230,140,.35)'; ctx.beginPath(); ctx.ellipse(d.x + bx / L * HH() * 0.6, d.y + by / L * HH() * 0.3, HH() * 0.7, HH() * 0.3, 0, 0, 6.283); ctx.fill(); ctx.restore(); } }   // 安全區（殘骸後方）
    for (const f of v.fires) { const fr = A.frameAt(Object.assign({}, u.act[N + '_fire'], { loop: true }), f.t * TK), a = Math.min(1, (f.life - f.t) / 20);
      ctx.save(); ctx.fillStyle = `rgba(240,110,40,${0.22 * a})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, HH() * 0.95, HH() * 0.4, 0, 0, 6.283); ctx.fill(); ctx.restore(); A.draw(u, fr, f.x, f.y, sc(e) * 0.7, false, a); }
    for (const d of v.debris) A.draw(u, u.act[N + (d.tall ? '_debris_tall' : '_debris_low')].f[0], d.x, d.y, sc(e) * 0.75, false, Math.min(1, d.t / 8)); }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    for (const f of v.falls) if (f.t < 0) { const fr = u.act[N + '_' + f.kind].f[0], k = Math.max(0, -f.t) / 30, s = sc(e) * 0.8; A.draw(u, fr, f.x, f.y - HH() * 4 * Math.min(1, k) + (f.kind === 'falling_boulder' ? 0 : fr[3] * s), s, false, k > 1.4 ? 0 : 1); }
    for (const p of v.pots) { const q = p.t / p.life, x = p.sx + (p.tx - p.sx) * q, y = p.sy + (p.ty - p.sy) * q - Math.sin(q * Math.PI) * HH() * 1.4; A.draw(u, u.act[N + '_fire_pot'].f[0], x, y - HH() * 0.3, sc(e) * 0.45, false, 1); }
    if (v.hook) { const h = v.hook, e2 = h.e, hx0 = e2.x + e2.face * HH() * 0.45, hy0 = e2.y - HH() * 0.75, seg = u.act[N + '_chain_segment'].f[0], L = Math.hypot(h.x - hx0, h.y - HH() * 0.5 - hy0);
      ctx.save(); ctx.translate(hx0, hy0); ctx.rotate(Math.atan2(h.y - HH() * 0.5 - hy0, h.x - hx0)); const sh = seg[3] * sc(e) * 0.4; ctx.drawImage(u.imgs[seg[7]], seg[0], seg[1], seg[2], seg[3], 0, -sh / 2, L, sh); ctx.restore();
      A.draw(u, u.act[N + '_hook'].f[0], h.x, h.y - HH() * 0.3, sc(e) * 0.45, e2.face < 0, 1); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('oni', { name: '鬼王', sub: '鬼巢之主', unit: 'b_oni', foes: ['kioni', 'midorioni', 'kurooni'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', brk: 'club_broken', map: ['W_R05_07'],
    actors: [{ id: N, name: '鬼王', size: 1.5, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { const e = R(enc); e.clubHp = e.hpMax * 0.12; enc.v = { ph: 1, cd: {}, falls: [], debris: [], pots: [], fires: [], minions: [], hook: null, warn: 0, hy: null, t: 0 }; enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.minions) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.falls = []; v.pots = []; v.fires = []; v.hook = null; v.warn = 0; },
    onDamage(e, d) { const v = e.enc.v; if (v.hy) v.hy.dmg += d;
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; }
      if (!e.broken) { e.clubHp -= d * 0.35; if (e.clubHp <= 0) { e.broken = 1; fx(e, N + '_club_break', e.x + e.face * HH() * 0.5, e.y - HH() * 1.1, { s: sc(e) * 1.4 }); v.debris.push({ x: e.x + e.face * HH() * 0.9, y: e.y + 6, tall: false, t: 0, club: 1 }); SC.shake = 8; G.UI.toast('金棒斷了！'); } }
      return false; } });
})();
