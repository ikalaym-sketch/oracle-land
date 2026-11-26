/* ==========================================================================
 * 神諭之地 重製版 — 33_boss_osakabe.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.8 新增。第七章頭目「長壁姬」（第七章頭目地圖 W_R07_07），P3 原圖（面向右）。
 *           ‧ 招式：扇舞（三波扇形光球）／詛咒圈（減速＋持續傷害）／式神紙人（最多 5 隻）／紙門夾擊（左右紙門射針）／
 *                   影繪（二階：燭火熄滅、全場黑暗，點亮 3 根蠟燭可破）／紙人分身（二階・困難以上）／傀儡（二階・地獄以上，被絲線拉近）／
 *                   必殺・城之命數（三階：9×5 榻榻米，只有 6 格家紋安全，其餘塌落）／無間・天守炎上（四階：燭台起火延燒，站燭台旁 1 秒熄火）。
 *           ‧ 扇子可破壞：受傷的 30% 打在扇上（扇血量＝最大血量 10%），架勢擋下光球也削扇 3%；破扇後每波光球 5→3。
 *           ‧ 原圖修正：扇舞兩段原圖是站姿 1.24 倍 → 縮 0.81。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, sc, fx, lane, circle, inLane, hit, walkTo, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const N = 'osakabe', U = () => A.get('b_osakabe'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const burst = (e, x, y, k) => fx(e, N + '_paper_burst', x, y, { s: HH() * (k || 1.2) / 250 });
  function orbs(e, x, y, n, sp, m, o) { const v = e.enc.v, a0 = Math.atan2((H.y - y) * 1.6, H.x - x);
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.24; v.orbs.push(Object.assign({ e, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp / 1.6, t: 0, life: S(2), m }, o || {})); } }
  function fanTel(e, x, y, n, tl) { const a0 = Math.atan2((H.y - y) * 1.6, H.x - x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.24, L = HH() * 6; lane(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L / 1.6, HH() * 0.3, S(tl), '235,200,120'); } }

  /* 主角周圍 3 個點（120° 間隔，校正到寬敞可走處），燭台用 */
  function ring3(r) { const a0 = rnd(0, 6.28), out = []; for (let i = 0; i < 3; i++) { const a = a0 + i * 2.094, p = SC.snap(H.x + Math.cos(a) * r, H.y + Math.sin(a) * r * 0.45, 'open', 160) || SC.snap(H.x + Math.cos(a) * r * 0.5, H.y, 'walk', 300) || [H.x, H.y]; out.push(p); } return out; }
  const MV = {
    /* 扇舞：三波；每波預兆 0.55s → 5 顆光球（破扇 3 顆）→ 間隔 0.35s；收招 0.5s */
    fan: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'fan'); m.w = 0; m.t0 = 0; },
      step(e, m) { const k = m.t - m.t0, n = e.broken ? 3 : 5;
        if (k === 1) fanTel(e, e.x, e.y, n, 0.55);
        if (k === S(0.55)) { orbs(e, e.x + e.face * 20, e.y, n, 4.6, 0.8, { fan: 1 }); if (++m.w < 3) m.t0 = m.t + S(0.35); }
        return m.w >= 3 && k > S(0.55) + S(0.5); } },
    /* 詛咒圈：抬手 → 主角位置紫圈預兆 0.8s → 詛咒霧 3s（圈內移動減半，每 0.5s 傷害） */
    curse: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'curse'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 1.2, S(0.8), '160,90,200'); },
      step(e, m) { if (m.t === S(0.8)) e.enc.v.zones.push({ k: 'curse', x: m.x, y: m.y, r: HH() * 1.2, t: 0, life: S(3) }); return m.t > S(1.06); } },
    /* 式神紙人：撒紙 → 身邊冒出 3 隻紙人（場上最多 5） */
    shiki: { go(e, m) { play(e, 'shiki'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.dolls = v.dolls.filter(d => d.st !== 'dead'); const n = Math.min(3, 5 - v.dolls.length);
          for (let i = 0; i < n; i++) { const p = SC.snap(e.x + (i - 1) * HH() * 1.4, e.y + (i % 2 ? 26 : -26), 'open', 200) || [e.x, e.y]; burst(e, p[0], p[1]); doll(e, p[0], p[1]); } }
        return m.t > S(1.06); } },
    /* 紙門夾擊：主角左右各立一扇紙門（預兆 0.85s 橫線）→ 兩側同時射針（判定一次）→ 收招 0.4s */
    needle: { go(e, m) { play(e, 'needle'); const v = e.enc.v; m.y = H.y; m.xs = [H.x - HH() * 3, H.x + HH() * 3]; for (const x of m.xs) v.panels.push({ x, y: m.y, t: 0, life: S(1.5) });
        lane(m.xs[0], m.y, m.xs[1], m.y, HH() * 0.45, S(0.85), '230,60,40'); },
      step(e, m) { if (m.t === S(0.85)) { const v = e.enc.v; v.needles.push({ x0: m.xs[0], x1: m.xs[1], y: m.y, t: 0, life: 18 }); if (inLane(m.xs[0], m.y, m.xs[1], m.y, HH() * 0.45)) hit(e, 1.0); }
        return m.t > S(0.85) + S(0.4); } },
    /* 影繪（二階）：燭火熄滅 → 黑暗 9s，場上 3 座燭台；站在燭台旁 1s 點亮；全亮＝破除＋長壁姬破綻 2s；黑暗中每 1.5s 從影子射針（預兆 0.7s） */
    shadow: { go(e, m) { play(e, 'shadow'); const v = e.enc.v; v.dark = { t: 0, life: S(9) }; v.candles = [];
        for (const p of ring3(HH() * 3.4)) v.candles.push({ x: p[0], y: p[1], lit: 0, p: 0 });
        G.UI.banner('影繪', '點亮三座燭台！'); },
      step(e, m) { const v = e.enc.v; if (!v.dark) return m.t > 30;
        if (m.t % S(1.5) === 0 && m.t > 0) { const a = rnd(0, 6.28), L = HH() * 3, x0 = H.x + Math.cos(a) * L, y0 = H.y + Math.sin(a) * L * 0.45, x1 = H.x - Math.cos(a) * L, y1 = H.y - Math.sin(a) * L * 0.45;
          lane(x0, y0, x1, y1, HH() * 0.35, S(0.7), '200,200,255'); v.delayed.push({ t: S(0.7), f: () => { v.needles.push({ x0, x1, y: y0, y1, t: 0, life: 18 }); if (inLane(x0, y0, x1, y1, HH() * 0.35)) hit(e, 0.8); } }); }
        return false; },
      stop(e) { const v = e.enc.v; v.dark = null; } },
    /* 紙人分身（二階・困難以上）：煙紙 0.6s → 兩側各一具紙分身（10s，一擊即散），每 2.2s 放 3 顆光球 */
    clone: { go(e, m) { play(e, 'clone'); },
      step(e, m) { if (m.t === S(0.6)) { const v = e.enc.v; for (const s of [-1, 1]) { const p = SC.snap(H.x + s * HH() * 3.2, H.y + rnd(-20, 20), 'open', 200) || [e.x, e.y]; burst(e, p[0], p[1], 1.6); v.clones.push({ x: p[0], y: p[1], t: 0, life: S(10), cd: S(1.2) }); } }
        return m.t > S(1.06); } },
    /* 傀儡（二階・地獄以上）：絲線預兆 0.8s（圈）→ 命中：1.5s 內被拉向長壁姬（翻滾可掙脫） */
    puppet: { go(e, m) { play(e, 'puppet'); m.x = H.x; m.y = H.y; circle(m.x, m.y, HH() * 1.0, S(0.8), '200,120,220'); },
      step(e, m) { const v = e.enc.v; if (m.t === S(0.8) && near(m.x, m.y, HH() * 1.0) && hit(e, 0.4)) { v.pull = S(1.5); G.UI.toast('被傀儡絲纏住了！翻滾掙脫'); } return m.t > S(1.06); } },
    /* 必殺・城之命數（三階）：9×5 榻榻米鋪滿 → 6 格家紋發光（安全）2.2s → 其餘塌落（傷害）→ 1.2s 後復原 */
    ult: { go(e, m) { play(e, 'ult'); const v = e.enc.v, W = HH() * 1.25, Hh = HH() * 0.62, x0 = H.x - W * 4.5, y0 = H.y - Hh * 2.5, safe = new Set();
        const hc = Math.max(0, Math.min(8, Math.round((H.x - x0) / W - 0.5))); while (safe.size < 6) safe.add(Math.floor(Math.random() * 45)); if (![...safe].some(i => Math.abs(i % 9 - hc) <= 3)) { safe.delete([...safe][0]); safe.add(2 * 9 + Math.min(8, hc + 2)); }
        v.grid = { x0, y0, W, Hh, safe, t: 0 }; G.UI.banner('必殺・城之命數', '站上發光的家紋！'); },
      step(e, m) { const v = e.enc.v, g = v.grid; if (!g) return true; g.t = m.t;
        if (m.t === S(2.2)) { const cx = Math.floor((H.x - g.x0) / g.W), cy = Math.floor((H.y - g.y0) / g.Hh), inG = cx >= 0 && cx < 9 && cy >= 0 && cy < 5;
          if (inG && !g.safe.has(cy * 9 + cx)) hit(e, 2.2); else if (inG) G.UI.toast('家紋守住了腳下'); SC.shake = 10; }
        if (m.t > S(2.2) + S(1.2)) { v.grid = null; return true; } return false; },
      stop(e) { e.enc.v.grid = null; } },
    /* 無間・天守炎上（四階）：三座燭台起火，火海由燭台向外延燒 8s（每 0.5s 傷害）；站燭台旁 1s 可熄滅該處 */
    fire: { go(e, m) { play(e, 'fire'); const v = e.enc.v; v.fires = [];
        for (const p of ring3(HH() * 3.6)) v.fires.push({ x: p[0], y: p[1], r: HH() * 0.6, t: 0, p: 0, out: 0 });
        G.UI.banner('天守炎上', '站在燭台旁可以滅火'); },
      step(e, m) { const v = e.enc.v; if (m.t > S(8) || v.fires.every(f => f.out)) { v.fires = []; e.open = S(1.5); return true; } return false; },
      stop(e) { e.enc.v.fires = []; } }
  };

  /* ---------- 紙人 ---------- */
  function doll(e, x, y) { const v = e.enc.v, d = Object.assign({}, e, { doll: 1, x, y, hp: Math.max(30, Math.round(e.hpMax * 0.006)), hpMax: Math.max(30, Math.round(e.hpMax * 0.006)), mv: null, st: 'walk', boss: false, nobar: 0, t: 0, ds: 'run', dt: 0, flash: 0, kb: 0, alpha: 1, idx: 30 + v.dolls.length, atk: Math.round(e.atk * 0.5) });
    v.dolls.push(d); G.E.push(d); }
  function dollStep(d) { if (d.st === 'dead') return; d.dt++;
    if (d.ds === 'run') { const dx = H.x - d.x, dy = H.y - d.y; if (Math.hypot(dx, dy * 1.4) < HH() * 0.9) { d.ds = 'atk'; d.dt = 0; d.face = sgn(dx); } else { walkTo(d, H.x - sgn(dx) * HH() * 0.6, H.y, 2.2); d.face = sgn(dx); } }
    else if (d.ds === 'atk') { if (d.dt === 30 && near(d.x + d.face * HH() * 0.5, d.y, HH() * 0.7)) hit(d, 0.5); if (d.dt > S(0.9)) { d.ds = 'run'; d.dt = 0; } } }

  /* ---------- 指揮 ---------- */
  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    for (const d of v.dolls) dollStep(d); v.dolls = v.dolls.filter(d => !(d.st === 'dead' && d.t > 60)); G.E = G.E.filter(x => !(x.doll && x.st === 'dead' && x.t > 60));
    for (const q of v.delayed) if (--q.t === 0) q.f(); v.delayed = v.delayed.filter(q => q.t > 0);
    // 光球
    for (const o of v.orbs) { o.t++; o.x += o.vx; o.y += o.vy;
      if (!o.hit && Math.abs(H.x - o.x) < HH() * 0.35 && Math.abs(H.y - o.y) < 18) { o.hit = 1; o.t = o.life;
        if (o.fan && H.guard && !e.broken) { e.fanHp -= e.hpMax * 0.03; G.UI.toast('擋下扇風，扇子受損'); breakFan(e); }
        hit(o.e, o.m); } }
    v.orbs = v.orbs.filter(o => o.t < o.life);
    for (const n of v.needles) n.t++; v.needles = v.needles.filter(n => n.t < n.life);
    for (const p of v.panels) p.t++; v.panels = v.panels.filter(p => p.t < p.life);
    // 詛咒霧（減速＋傷害）
    let slow = 0; for (const z of v.zones) { z.t++; if (near(z.x, z.y, z.r)) { slow = 1; if (z.t % 30 === 0) hit(e, 0.3); } } v.zones = v.zones.filter(z => z.t < z.life);
    if ((slow || v.pull > 0) && v.px !== undefined && !(H.act && H.act.kind === 'dodge')) { H.x = v.px + (H.x - v.px) * (slow ? 0.5 : 1); H.y = v.py + (H.y - v.py) * (slow ? 0.5 : 1); }
    if (v.pull > 0) { v.pull--; if (H.act && H.act.kind === 'dodge') v.pull = 0; else { const nx = H.x + (e.x - H.x) * 0.035, ny = H.y + (e.y - H.y) * 0.035; if (SC.walkable(nx, ny)) { H.x = nx; H.y = ny; } } }
    v.px = H.x; v.py = H.y;
    // 影繪：點燭台
    if (v.dark) { v.dark.t++; for (const c of v.candles) if (!c.lit) { if (near(c.x, c.y, HH() * 0.8)) { if (++c.p >= S(1)) { c.lit = 1; G.UI.toast('燭台點亮了'); } } else c.p = Math.max(0, c.p - 2); }
      if (v.candles.every(c => c.lit)) { v.dark = null; e.open = S(2); if (e.mv) end(e); play(e, 'hurt'); G.UI.banner('影繪破除', '長壁姬露出破綻'); }
      else if (v.dark.t > v.dark.life) { v.dark = null; if (e.mv && e.mv.k === 'shadow') end(e); } }
    // 分身
    for (const c of v.clones) { c.t++; if (--c.cd <= 0) { c.cd = S(2.2); fanTel(e, c.x, c.y, 3, 0.5); v.delayed.push({ t: S(0.5), f: () => orbs(e, c.x, c.y, 3, 4.2, 0.5) }); }
      if (H.act && Math.hypot(H.x + H.face * HH() * 0.6 - c.x, (H.y - c.y) * 1.6) < HH() * 0.8) { c.t = c.life; burst(e, c.x, c.y, 1.4); } }
    v.clones = v.clones.filter(c => c.t < c.life);
    // 天守炎上：延燒＋熄火
    for (const f of v.fires) { f.t++; if (f.out) continue; f.r = Math.min(HH() * 2.6, f.r + 0.45); if (f.t % 30 === 0 && near(f.x, f.y, f.r)) hit(e, 0.35);
      if (near(f.x, f.y, HH() * 0.6)) { if (++f.p >= S(1)) { f.out = 1; G.UI.toast('燭台的火熄了'); } } else f.p = Math.max(0, f.p - 2); }
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !v.grid) { v.ph = ph; e.inv = S(2); if (e.mv) end(e); play(e, 'idle', true); fx(e, N + '_phase_shift', e.x, e.y - HH() * 0.6, { s: HH() * 1.6 / 256 }); v.zones = []; v.orbs = [];
      G.UI.toast(['', '', '燭火……熄滅吧。', '此城的命數，由我決定。', '天守，燃燒吧！'][ph]); if (ph === 2) v.cd.shadow = S(2.4); if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.fire = S(2.4); enc.cd = S(2.2); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    let k;
    if (v.ph >= 4 && !(v.cd.fire > 0)) { k = 'fire'; v.cd.fire = S(22); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(20); }
    else if (v.ph >= 2 && !(v.cd.shadow > 0)) { k = 'shadow'; v.cd.shadow = S(26); }
    else { const L = ['fan', 'fan', 'curse', 'needle'];
      if (v.dolls.filter(d => d.st !== 'dead').length < 3 && !(v.cd.shiki > 0)) L.push('shiki');
      if (v.ph >= 2 && enc.diff >= 1 && !v.clones.length && !(v.cd.clone > 0)) L.push('clone');
      if (v.ph >= 2 && enc.diff >= 2 && !(v.cd.puppet > 0)) L.push('puppet');
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'shiki') v.cd.shiki = S(14); if (k === 'clone') v.cd.clone = S(18); if (k === 'puppet') v.cd.puppet = S(12); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 3.2;   // 遠程：保持距離滑行
    if (Math.abs(d - want) > HH() * 0.9) { if (e.an !== 'glide') play(e, 'glide', true); const k = d > want ? 1 : -1; walkTo(e, e.x + (H.x - e.x) / d * HH() * k, e.y + (H.y - e.y) / d * HH() * k, 2.2); }
    else if (e.an !== 'idle') play(e, 'idle', true); e.face = sgn(H.x - e.x); }
  function breakFan(e) { if (!e.broken && e.fanHp <= 0) { e.broken = 1; burst(e, e.x + e.face * HH() * 0.3, e.y - HH() * 0.9, 1.2); SC.shake = 6; G.UI.toast('扇子破了！扇舞變弱'); } }

  /* ---------- 繪製 ---------- */
  function drawSelf(e) { if (!e.doll) return false; const u = U(); if (!u) return true;
    const n = e.st === 'dead' ? 'hurt' : e.st === 'hurt' ? 'hurt' : e.ds === 'atk' ? 'atk' : 'run', r = u.act[N + '_shiki_' + n + '_right3q'], fr = A.frameAt(n === 'run' ? Object.assign({}, r, { loop: true }) : r, n === 'atk' ? e.dt * TK : n === 'hurt' ? Math.min(599, e.t * TK) : G.t * TK + e.idx * 50), s = HH() * 0.75 / 200, a = e.st === 'dead' ? Math.max(0, 1 - e.t / 40) : 1;
    ctx.fillStyle = 'rgba(30,20,10,.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 0.25, HH() * 0.08, 0, 0, 6.283); ctx.fill();
    A.draw(u, fr, e.x, e.y, s, e.face < 0, a);
    if (e.st !== 'dead') { const w = 24, y = e.y - HH() * 0.95; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2, y, w, 3); ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 3); }
    return true; }
  function drawUnder(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    if (v.grid) { const g = v.grid, k = g.t / S(2.2), tt = u.act[N + '_tatami_tile'].f[0], ct = u.act[N + '_crest_tile'].f[0], ft = u.act[N + '_fallen_tile'].f[0];
      for (let i = 0; i < 45; i++) { const cx = i % 9, cy = (i / 9) | 0, x = g.x0 + cx * g.W, y = g.y0 + cy * g.Hh, safe = g.safe.has(i), f = k >= 1 && !safe ? ft : safe ? ct : tt;
        ctx.save(); ctx.globalAlpha = k >= 1 && !safe ? 0.5 : safe ? 0.9 : 0.62; ctx.drawImage(u.imgs[f[7]], f[0], f[1], f[2], f[3], x, y, g.W - 2, g.Hh - 2);
        if (safe) { const gl = u.act[N + '_crest_glow'], gf = A.frameAt(Object.assign({}, gl, { loop: true }), g.t * TK); ctx.globalAlpha = 0.85; ctx.drawImage(u.imgs[gf[7]], gf[0], gf[1], gf[2], gf[3], x + g.W * 0.2, y - g.Hh * 0.1, g.W * 0.6, g.Hh * 1.1); }
        else if (k < 1 && k > 0.4 && (g.t >> 3) % 2) { ctx.fillStyle = 'rgba(230,60,40,.25)'; ctx.fillRect(x, y, g.W - 2, g.Hh - 2); }
        ctx.restore(); } }
    for (const z of v.zones) { const fr = A.frameAt(Object.assign({}, u.act[N + '_curse_mist'], { loop: true }), z.t * TK), a = Math.min(1, z.t / 10, (z.life - z.t) / 15);
      ctx.save(); ctx.fillStyle = `rgba(150,80,190,${0.25 * a})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.restore(); A.draw(u, fr, z.x, z.y + HH() * 0.2, z.r * 1.6 / 256, false, a * 0.9); }
    for (const f of v.fires) { if (!f.out) { ctx.save(); ctx.fillStyle = 'rgba(240,110,40,.22)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.restore();
        const fr = A.frameAt(Object.assign({}, u.act[N + '_fire_field'], { loop: true }), f.t * TK); for (let i = 0; i < 6; i++) { const a = i * 1.047 + f.t * 0.01; A.draw(u, fr, f.x + Math.cos(a) * f.r * 0.7, f.y + Math.sin(a) * f.r * 0.3, f.r * 0.9 / 256, false, 0.9); } }
      A.draw(u, u.act[N + '_candle_base'].f[0], f.x, f.y, HH() * 1.4 / 256, false, 1); if (!f.out) A.draw(u, A.frameAt(Object.assign({}, u.act[N + '_candle_flame'], { loop: true }), f.t * TK), f.x, f.y - HH() * 1.32, HH() * 0.45 / 240, false, 1);
      if (f.p > 0 && !f.out) prog(f.x, f.y - HH() * 1.4, f.p / S(1)); }
    for (const p of v.panels) A.draw(u, u.act[N + '_paper_panel'].f[0], p.x, p.y, HH() * 1.0 / 103, false, Math.min(1, p.t / 8, (p.life - p.t) / 8)); }
  const prog = (x, y, q) => { ctx.save(); ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 9, -1.57, -1.57 + 6.283 * q); ctx.stroke(); ctx.restore(); };
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const ob = u.act[N + '_fan_orb'];
    for (const o of v.orbs) { const fr = A.frameAt(Object.assign({}, ob, { loop: true }), o.t * TK), k = HH() * 0.9 / 247; ctx.save(); ctx.translate(o.x, o.y - HH() * 0.4); ctx.rotate(Math.atan2(o.vy * 1.6, o.vx)); ctx.globalAlpha = Math.min(1, (o.life - o.t) / 10);
      ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k * 0.7, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    const nd = u.act[N + '_needle'];
    for (const n of v.needles) { const fr = A.frameAt(Object.assign({}, nd, { loop: true }), n.t * TK), y1 = n.y1 === undefined ? n.y : n.y1, L = Math.hypot(n.x1 - n.x0, y1 - n.y), q = n.t / n.life;
      for (const dir of [1, -1]) { const sx = dir > 0 ? n.x0 : n.x1, sy = dir > 0 ? n.y : y1, ang = Math.atan2((dir > 0 ? y1 - n.y : n.y - y1), (dir > 0 ? n.x1 - n.x0 : n.x0 - n.x1)), d = L * 0.5 * q;
        ctx.save(); ctx.translate(sx + Math.cos(ang) * d, sy + Math.sin(ang) * d - HH() * 0.45); ctx.rotate(ang); const k = HH() * 0.9 / 256; ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); } }
    for (const c of v.clones) { const fr = A.frameAt(Object.assign({}, u.act[N + '_clone_right3q'], { loop: true }), c.t * TK); A.draw(u, fr, c.x, c.y, sc(e), H.x < c.x, 0.75 * Math.min(1, (c.life - c.t) / 15)); }
    if (v.pull > 0) { ctx.save(); ctx.strokeStyle = 'rgba(230,200,255,.8)'; ctx.lineWidth = 1.2; for (const o of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(e.x + e.face * 14, e.y - HH() * 0.9); ctx.lineTo(H.x + o, H.y - HH() * 0.7); ctx.stroke(); } ctx.restore(); }
    if (v.dark) { const a = Math.min(0.82, v.dark.t / 30 * 0.82); ctx.save(); ctx.fillStyle = `rgba(8,4,14,${a})`; ctx.fillRect(-4000, -4000, 12000, 12000); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const c of v.candles.concat([{ x: H.x, y: H.y, lit: 1, me: 1 }])) if (c.lit) { const g = ctx.createRadialGradient(c.x, c.y - HH() * 0.5, 4, c.x, c.y - HH() * 0.5, HH() * (c.me ? 1.1 : 2.2)); g.addColorStop(0, 'rgba(255,220,150,.35)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(c.x - HH() * 2.5, c.y - HH() * 3, HH() * 5, HH() * 5); } ctx.restore();
      for (const c of v.candles) { A.draw(u, u.act[N + '_candle_base'].f[0], c.x, c.y, HH() * 1.4 / 256, false, 1); if (c.lit) A.draw(u, A.frameAt(Object.assign({}, u.act[N + '_candle_flame'], { loop: true }), v.t * TK), c.x, c.y - HH() * 1.32, HH() * 0.45 / 240, false, 1); else if (c.p > 0) prog(c.x, c.y - HH() * 1.4, c.p / S(1)); }
      const sd = u.act[N + '_shadow_darkness'], f2 = A.frameAt(Object.assign({}, sd, { loop: true }), v.t * TK); A.draw(u, f2, e.x, e.y, HH() * 2 / 254, false, 0.7); }
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.OSA = { doll };   // 測試用
  B.reg('osakabe', { name: '長壁姬', sub: '天守的主人', unit: 'b_osakabe', hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', brk: 'fan_broken', map: ['W_R07_07'],
    actors: [{ id: N, name: '長壁姬', size: 1.15, moves: [] }], mv: MV, director, drawSelf, drawUnder, drawOver,
    idle: e => { if (e.doll) { if (e.st === 'hurt' && e.t > 12) e.st = 'walk'; return true; } return false; },
    init(enc) { const e = R(enc); e.fanHp = e.hpMax * 0.1; enc.v = { ph: 1, cd: {}, orbs: [], zones: [], needles: [], panels: [], dolls: [], clones: [], candles: [], fires: [], delayed: [], dark: null, grid: null, pull: 0, t: 0 }; enc.cd = S(1.2);
      G.UI.toast('來到天守的人類……真是好久不見了。'); },
    finish(enc) { const v = enc.v; for (const d of v.dolls) { d.st = 'dead'; d.t = 0; } v.orbs = []; v.zones = []; v.clones = []; v.dark = null; v.grid = null; v.fires = []; v.pull = 0; },
    onDamage(e, d) { if (e.doll) return false; if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; }
      if (!e.broken) { e.fanHp -= d * 0.3; breakFan(e); } return false; } });
})();
