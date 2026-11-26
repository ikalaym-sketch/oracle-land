/* ==========================================================================
 * 神諭之地 重製版 — 32_boss_orochi.js
 * Version : r3.94.0  (2026-11-26)　r3.94.0：八頭預兆改用 tk0 × 難度預兆係數
 * 舊版    : r3.38.0  (2026-11-17)　r3.38.0：火／水頭吐息「嘴→地面」段改用第二代向下吐息素材（火焰／冰霜），水頭落點留冰霜；預兆 ×1.35（修羅以上 ×1.15）
 * 舊版    : r3.33.1  (2026-11-17)　r3.33.1：脖子改連續貼圖＋漸細＋順接頸根；吐息從嘴噴到地面預兆區、粗細固定、由嘴延伸、吐息時低頭
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.8.7 新增。第六章頭目「八岐大蛇」（第六章頭目地圖 W_R06_07），P3 原圖。
 *           ‧ 本體盤在場中央不移動、不受傷；八個蛇頭各自是目標（每頭血量＝總血量 1/8），砍斷全部或總血量歸零即擊敗。
 *           ‧ 一階只醒 4 頭（0／2／4／6），二階 8 頭全醒（醒來長嘯 1.6s）。
 *           ‧ 招式：咬擊（所有頭）／火息（火頭，扇形）／水砲（水頭，直線，每 0.2s）／毒息（毒頭，扇形＋殘霧 2s）／
 *                   八頭亂舞（二階，逐頭 0.32s）／必殺・八岐連咬（三階，逐頭 0.48s，白色不可格擋）／
 *                   盤身絞殺（地獄以上、二階）／無間・天叢雲劍氣（四階）。
 *           ‧ 酒甕 8 個：站在滿甕旁 2 秒打開 → 最近的醒頭過來喝 → 醉倒 6 秒（不攻擊、受傷 ×1.5）；空甕 40 秒後補滿。
 *           ‧ 斷頭再生：困難以上、二階起，斷頭 30 秒後以 40% 血量再生，每頭一次。
 *           ‧ 頸部：由本體根部到蛇頭以曲線＋原圖鱗片材質繪製；蛇頭依表情格（待機／蓄力／張口／吐息／受傷／醉／倒）切換。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾 drawSelf／idle／preDamage／onDamage）、03_actors（hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { fx, lane, circle, inLane, hit, S, rnd, sgn, TK, HH } = B.api;
  const N = 'orochi', U = () => A.get('b_orochi'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const K = () => HH() / 80;                                   // 原始座標 → 遊戲（原作主角約 80）
  const EL = ['fire', 'water', 'poison', 'water', 'gold', 'poison', 'water', 'fire'];
  const ROOT = [[-145, -70], [-105, -130], [-65, -25], [-25, -150], [25, -150], [65, -25], [105, -130], [145, -70]];
  const HX = [-290, -210, -125, -80, 80, 125, 210, 290], HY = [42, -30, 76, -40, -40, 76, -30, 42], HZ = [240, 310, 220, 350, 340, 230, 300, 250];
  const EX = { idle0: 0, idle1: 1, windup: 2, open: 3, breath: 4, hurt: 5, drunk: 6, down: 7 };
  const NAME = { fire: '火', water: '水', poison: '毒', gold: '金' };
  const ready = h => h.st !== 'dead' && h.s === 'idle' && h.awake;

  /* ---------- 蛇頭狀態 ---------- */
  function home(h) { const b = h.body; return [b.x + HX[h.i] * K(), b.y + HY[h.i] * K() * 0.6]; }
  function setAct(h, s, o) { h.s = s; h.ht = 0; Object.assign(h, o || {}); }
  function stepHead(h) {
    const v = h.enc.v, [hx, hy] = home(h); h.ht++;
    const lift0 = HZ[h.i] * K() * 0.55, sway = Math.sin((v.t + h.i * 37) * 0.03) * 10;
    if (h.s === 'sleep') { h.tx = hx; h.ty = hy; h.tl = HH() * 0.9; h.ex = 'down'; }
    else if (h.s === 'cut') { h.tx = hx; h.ty = hy + 10; h.tl = HH() * 0.25; h.ex = 'down';
      if (h.regenOk && h.ht === S(30)) { h.hp2 = h.hpMax2 * 0.4; h.regenOk = 0; setAct(h, 'idle'); fx(h.body, N + '_regen_mist', hx, hy, { s: HH() * 2 / 250, nat: -1 }); G.UI.toast(NAME[h.el] + '頭再生了！'); } }
    else if (h.s === 'wake') { h.tx = hx; h.ty = hy; h.tl = lift0 * Math.min(1, h.ht / 60); h.ex = h.ht % 20 < 10 ? 'open' : 'windup'; if (h.ht > S(1.6)) setAct(h, 'idle'); }
    else if (h.s === 'drunk') { h.tx = hx; h.ty = hy + 6; h.tl = HH() * 0.7; h.ex = 'drunk'; if (h.ht > S(6)) setAct(h, 'idle'); }
    else if (h.s === 'drink') { const j = h.jar; h.tx = j.x - 20; h.ty = j.y; h.tl = HH() * 0.8; h.ex = 'open'; if (h.ht > S(1)) { setAct(h, 'drunk'); G.UI.toast(NAME[h.el] + '頭喝醉了！'); } }
    else if (h.s === 'idle') { h.tx = hx + sway; h.ty = hy; h.tl = lift0 + sway * 0.6; h.ex = (h.ht >> 5) % 3 === 2 ? 'idle1' : 'idle0'; }
    else if (h.s === 'bite') {   // 預兆 tl → 撲咬 10 格 → 收回 0.5s
      const T = h.tel;
      if (h.ht < T) { h.tx = hx + (h.gx - hx) * 0.2; h.ty = hy; h.tl = lift0 * 1.15; h.ex = 'windup'; }
      else if (h.ht < T + 10) { const q = (h.ht - T) / 10; h.tx = hx + (h.gx - hx) * q; h.ty = hy + (h.gy - hy) * q; h.tl = lift0 + (HH() * 0.55 - lift0) * q; h.ex = 'open';
        if (h.ht === T + 9) { fx(h.body, N + '_bite_impact', h.gx, h.gy, { s: HH() * 1.4 / 250, nat: -1 }); if (near(h.gx, h.gy, HH() * 0.7)) hit(h.body, h.m || 1.2); } }
      else { h.ex = 'idle0'; h.tx += (hx - h.tx) * 0.12; h.ty += (hy - h.ty) * 0.12; h.tl += (lift0 - h.tl) * 0.12; if (h.ht > T + 10 + S(0.5)) setAct(h, 'idle'); } }
    else if (h.s === 'breath') {   // 火／毒／水：預兆 0.8s → 吐息 → 收招
      const T = S(0.8 / TKF(h)), act = h.el === 'water' ? S(0.7) : S(0.6);
      h.tx = hx; h.ty = hy; h.tl = lift0 * 0.8; h.ex = h.ht < T ? 'windup' : h.ht < T + act ? 'breath' : 'idle0';
      if (h.ht === T) { const o = { e: h.body, h, t: 0, life: act, el: h.el }; v.breaths.push(o);
        if (h.el !== 'water' && fanHit(h.x, h.y, h.ang, h.R, h.half)) hit(h.body, h.el === 'fire' ? 1.3 : 0.9);
        if (h.el === 'poison') v.res.push({ x: h.px, y: h.py, t: 0, life: S(2) }); }
      if (h.el === 'water' && h.ht >= T && h.ht < T + act && (h.ht - T) % 12 === 0 && inLane(h.x, h.y, h.x + Math.cos(h.ang) * h.R, h.y + Math.sin(h.ang) * h.R / 1.6, HH() * 0.45)) hit(h.body, 0.45);
      if (h.ht > T + act + S(0.5)) setAct(h, 'idle'); }
    h.x += (h.tx - h.x) * 0.25; h.y += (h.ty - h.y) * 0.25; h.lift = h.tl;
    if (h.st === 'hurt') h.ex = 'hurt';
  }
  function fanHit(x, y, ang, r, half) { const dx = H.x - x, dy = (H.y - y) * 1.6, d = Math.hypot(dx, dy); if (d > r) return false; let a = Math.atan2(dy, dx) - ang; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a) < half; }
  const TKF = h => ((h.enc && h.enc.tk0) || 1) / (G.BT ? G.BT.dk() : 1);   // r3.94.0：舊手感基準 tk0 × 難度預兆係數（123_btempo）
  function bite(h, x, y, tel, m, col) { tel /= TKF(h); setAct(h, 'bite', { gx: x, gy: y, tel: S(tel), m }); circle(x, y, HH() * 0.7, S(tel), col || (h.el === 'gold' ? '240,200,80' : '230,60,40')); }
  function breath(h) { const v = h.enc.v; h.ang = Math.atan2((H.y - h.y) * 1.6, H.x - h.x); h.px = H.x; h.py = H.y;
    const R0 = (h.el === 'water' ? 520 : h.el === 'fire' ? 320 : 280) * K() * (h.el === 'water' ? 1 : 0.9); h.bx = h.x + Math.cos(h.ang) * R0; h.by = h.y + Math.sin(h.ang) * R0 / 1.6;   // r3.33.1：吐息落點（地面）
    if (h.el === 'water') { h.R = 520 * K(); h.half = 0; lane(h.x, h.y, h.x + Math.cos(h.ang) * h.R, h.y + Math.sin(h.ang) * h.R / 1.6, HH() * 0.55, S(0.8 / TKF(h)), '90,160,230'); }
    else { h.R = (h.el === 'fire' ? 320 : 280) * K(); h.half = h.el === 'fire' ? 0.42 : 0.48; v.fans.push({ x: h.x, y: h.y, ang: h.ang, r: h.R, half: h.half, t: 0, life: S(0.8 / TKF(h)), col: h.el === 'fire' ? '240,120,40' : '170,90,200' }); }
    setAct(h, 'breath'); }

  /* ---------- 指揮 ---------- */
  function director(enc) {
    const b = R(enc), v = enc.v; if (!b || b.st === 'dead') return;
    v.t++; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    for (const h of v.heads) stepHead(h);
    for (const f of v.fans) f.t++; v.fans = v.fans.filter(f => f.t < f.life);
    for (const o of v.breaths) o.t++; v.breaths = v.breaths.filter(o => o.t < o.life);
    for (const r of v.res) { r.t++; if (r.t % 30 === 0 && near(r.x, r.y, 64 * K())) hit(b, 0.25); } v.res = v.res.filter(r => r.t < r.life);
    for (const q of v.queue) { q.t--; if (q.t === 0 && ready(q.h)) bite(q.h, H.x, H.y, q.tel, q.m, q.col); } v.queue = v.queue.filter(q => q.t > 0);
    // 酒甕
    for (const j of v.jars) { if (!j.full) { if (++j.rt >= S(40)) { j.full = 1; j.rt = 0; } continue; }
      if (near(j.x, j.y, HH() * 0.8)) { if (++j.st2 >= S(2)) { j.full = 0; j.st2 = 0; j.rt = 0; const hs = v.heads.filter(h => ready(h) && Math.hypot(h.x - j.x, h.y - j.y) < HH() * 6).sort((p, q) => Math.hypot(p.x - j.x, p.y - j.y) - Math.hypot(q.x - j.x, q.y - j.y));
          if (hs[0]) { setAct(hs[0], 'drink', { jar: j }); G.UI.toast('打開了酒甕——蛇頭被酒香引過來了'); } } } else j.st2 = Math.max(0, j.st2 - 2); }
    // 階段（依總血量）
    const hp = b.hp / b.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph) { v.ph = ph; b.an = 'roar'; b.at = 0; b.aloop = false; SC.shake = 8;
      if (ph >= 2) for (const h of v.heads) if (!h.awake) { h.awake = 1; setAct(h, 'wake'); }
      G.UI.toast(['', '', '八頭全醒了！', '八岐大蛇　狂暴', '天叢雲　出鞘'][ph]); if (ph === 3) v.cd.ult = S(2); if (ph === 4) v.cd.sword = S(2); enc.cd = S(2); return; }
    if (b.an === 'roar' && b.at > 480) { b.an = 'idle'; b.aloop = true; }
    if (b.mv) return;
    if (enc.cd > 0) { enc.cd--; return; }
    const busy = v.heads.filter(h => h.s === 'bite' || h.s === 'breath').length, R0 = v.heads.filter(ready);
    if (!R0.length || busy >= (v.ph >= 2 ? 2 : 1)) return;
    if (v.ph >= 4 && !(v.cd.sword > 0)) { v.cd.sword = S(16); B.api.begin(b, 'sword'); enc.cd = S(2.4); return; }
    if (v.ph >= 3 && !(v.cd.ult > 0) && !busy) { v.cd.ult = S(20); R0.sort((p, q) => Math.hypot(p.x - H.x, p.y - H.y) - Math.hypot(q.x - H.x, q.y - H.y)).forEach((h, i) => v.queue.push({ h, t: 1 + S(0.48 * i), tel: 0.6, m: 1.5, col: '245,245,245' }));
      G.UI.banner('必殺・八岐連咬', '白色預兆不能格擋'); enc.cd = S(0.48 * R0.length + 1.2); return; }
    if (v.ph >= 2 && enc.diff >= 2 && !(v.cd.coil > 0) && near(b.x, b.y, HH() * 2.8)) { v.cd.coil = S(12); B.api.begin(b, 'coil'); enc.cd = S(1.6); return; }
    if (v.ph >= 2 && !(v.cd.sweep > 0) && R0.length >= 4 && !busy) { v.cd.sweep = S(14); R0.sort((p, q) => p.x - q.x).forEach((h, i) => v.queue.push({ h, t: 1 + S(0.32 * i), tel: 0.7, m: 1.1 })); G.UI.toast('八頭亂舞！'); enc.cd = S(0.32 * R0.length + 1.0); return; }
    const h = R0[Math.floor(Math.random() * R0.length)], d = Math.hypot(H.x - h.x, (H.y - h.y) * 1.6);
    if (h.el !== 'gold' && (d > HH() * 2 || Math.random() < 0.45)) breath(h); else bite(h, H.x, H.y, 0.7, 1.2);
    enc.cd = S(v.ph === 1 ? rnd(0.9, 1.4) : rnd(0.5, 0.9));
  }
  /* 本體招式（框架 begin） */
  const MV = {
    /* 盤身絞殺：長嘯 → 本體周圍環形預兆 0.9s → 盤絞（判定一次＋擊退）→ 收招 0.6s */
    coil: { go(e, m) { e.an = 'roar'; e.at = 0; e.aloop = false; circle(e.x, e.y, HH() * 2.8, S(0.9), '120,200,140'); },
      step(e, m) { if (m.t === S(0.9)) { fx(e, N + '_coil_ring', e.x, e.y, { s: HH() * 6 / 255, nat: -1 }); SC.shake = 6; if (near(e.x, e.y, HH() * 2.8)) { if (hit(e, 1.4)) { const dx = H.x - e.x; for (let i = 0; i < 6; i++) { const nx = H.x + sgn(dx) * HH() * 0.2; if (SC.walkable(nx, H.y)) H.x = nx; } } } }
        return m.t > S(0.9) + S(0.6); } },
    /* 無間・天叢雲劍氣：三道劍氣直線（扇開 ±0.35）預兆 0.9s → 劍氣（判定一次）→ 收招 0.8s */
    sword: { go(e, m) { e.an = 'roar'; e.at = 0; e.aloop = false; const a0 = Math.atan2(H.y - e.y, H.x - e.x); m.L = [-0.35, 0, 0.35].map(o => { const a = a0 + o, L = HH() * 9; return [e.x, e.y - 10, e.x + Math.cos(a) * L, e.y - 10 + Math.sin(a) * L * 0.6]; });
        for (const l of m.L) lane(l[0], l[1], l[2], l[3], HH() * 0.5, S(0.9), '240,230,160'); },
      step(e, m) { if (m.t === S(0.9)) { e.enc.v.qi = { L: m.L, t: 0 }; if (m.L.some(l => inLane(l[0], l[1], l[2], l[3], HH() * 0.5))) hit(e, 1.8); }
        if (m.t === S(0.9) + 30) e.enc.v.qi = null; return m.t > S(0.9) + S(0.8); } }
  };

  /* ---------- 繪製 ---------- */
  /* r3.33.1：脖子＝三次曲線（身體根部往上外伸 → 從頭的頸根後方順接），脖子圖沿曲線切片連續貼一次（不再每段重複整張圖），寬度由根部往頭漸細，先描深色外框 */
  function neck(h, a) { const u = U(), b = h.body, r = ROOT[h.i], k = K(), x0 = b.x + r[0] * k * 0.8, y0 = b.y + r[1] * k * 0.55, x3 = h.x, y3 = h.y - h.lift, d = h.dir || 1, pt = h.pt || 0,
      cut = h.s === 'cut', W0 = HH() * (cut ? 0.4 : 0.52), W1 = HH() * (cut ? 0.3 : 0.38),
      x1 = x0 + sgn(r[0]) * HH() * 0.3, y1 = y0 - HH() * 0.9, bx = -d * HH() * 0.7, by = HH() * 0.25, x2 = x3 + bx * Math.cos(pt) - by * Math.sin(pt) * d, y2 = y3 + by * Math.cos(pt) + bx * Math.sin(pt) * d,
      tex = u.act[N + '_neck_' + (h.el === 'gold' ? 'scale' : h.el)].f[0], img = u.imgs[tex[7]], NS = 16, u0 = 0.1, u1 = 0.9;
    const P = []; for (let i = 0; i <= NS; i++) { const t = i / NS, m = 1 - t; P.push([m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3, m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3]); }
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(22,16,12,.22)';
    for (let i = 1; i <= NS; i++) { ctx.lineWidth = W0 + (W1 - W0) * i / NS + 2; ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); }
    const sw = tex[2] * (u1 - u0) / NS;
    for (let i = 1; i <= NS; i++) { const [px, py] = P[i - 1], [qx, qy] = P[i], L = Math.hypot(qx - px, qy - py), w = W0 + (W1 - W0) * (i - 0.5) / NS;
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(qy - py, qx - px)); ctx.drawImage(img, tex[0] + tex[2] * u0 + sw * (i - 1), tex[1] + 1, sw, tex[3] - 2, -1, -w / 2, L + 2, w); ctx.restore(); }
    ctx.restore(); }
  function drawSelf(e) { const u = U(); if (!u) return true;
    if (!e.head) { const fr = A.frameAt(u.act[N + (e.st === 'dead' ? '_down_right3q' : e.an === 'roar' ? '_roar_right3q' : '_idle_right3q')], e.st === 'dead' ? Math.min(899, e.t * TK) : e.an === 'roar' ? e.at : G.t * TK, 0), s = HH() * 4.4 / 255;
      ctx.fillStyle = 'rgba(20,20,10,.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * 2.3, HH() * 0.5, 0, 0, 6.283); ctx.fill();
      for (const h of e.enc.v.heads) if (HY[h.i] < 0) drawHead(h, u);   // 後排頭在本體之後
      A.draw(u, fr, e.x, e.y, s, false, e.alpha); return true; }
    if (HY[e.i] >= 0) drawHead(e, u); return true; }
  function drawHead(h, u) { const a = h.st === 'dead' ? 0 : h.s === 'cut' ? 0.85 : 1; if (!a) return;
    ctx.fillStyle = 'rgba(20,20,10,.28)'; ctx.beginPath(); ctx.ellipse(h.x, h.y, HH() * 0.45, HH() * 0.14, 0, 0, 6.283); ctx.fill();
    const r = u.act[N + '_head_' + h.el + '_right3q'], fr = r.f[EX[h.ex] || 0], s = HH() * 2.0 / 245, fl = H.x < h.x, d = h.dir = fl ? -1 : 1;
    /* 低頭：吐息／撲咬預兆時朝目標點俯角（最多 0.5 rad） */
    const aim = h.s === 'breath' && h.bx !== undefined ? [h.bx, h.by] : h.s === 'bite' && h.ht < (h.tel || 0) ? [h.gx, h.gy] : null;
    const want = aim ? Math.max(-0.15, Math.min(0.35, Math.atan2(aim[1] - (h.y - h.lift), Math.abs(aim[0] - h.x) + 1))) : 0; h.pt = (h.pt || 0) + (want - (h.pt || 0)) * 0.15;
    neck(h, a); const hx = h.x, hy = h.y - h.lift, mx = (fr[2] * 0.95 - fr[4]) * s, my = (fr[3] * 0.69 - fr[5]) * s, c = Math.cos(h.pt), sn = Math.sin(h.pt);
    h.mx = hx + d * (mx * c - my * sn); h.my = hy + mx * sn + my * c;   // 嘴的位置（給吐息用）
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(h.pt * d); A.draw(u, fr, 0, 0, s, fl, a); ctx.restore();
    if (h.flash > 0) { ctx.save(); ctx.globalAlpha = h.flash / 12; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h.x, h.y - h.lift - HH() * 0.3, HH() * 0.4, 0, 6.283); ctx.fill(); ctx.restore(); }
    if (h.s !== 'cut' && h.s !== 'sleep') { const w = 36, y = h.y - h.lift - HH() * 0.95; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(h.x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = h.s === 'drunk' ? '#e0a640' : G.C.red; ctx.fillRect(h.x - w / 2, y, w * Math.max(0, h.hp2) / h.hpMax2, 3); }
    if (h.s === 'drunk' && G.t % 30 < 18) G.txt('醉', h.x + 16, h.y - h.lift - HH() * 1.1, 11, '#f3c060', 'center'); }
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    const u2 = A.get('x2_boss'), cone = u2 && u2.fx && u2.fx.fx_warn_cone && B.tinted;   // r3.38.0：扇形預警用第二代素材（頂點＝蛇頭，張角依判定）
    for (const f of v.fans) { const q = f.t / f.life; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 1 / 1.6); ctx.fillStyle = `rgba(${f.col},${(cone ? 0.1 : 0.2) + 0.25 * q})`; ctx.strokeStyle = `rgba(${f.col},.8)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.r * (cone ? q : 1), f.ang - f.half, f.ang + f.half); ctx.closePath(); ctx.fill(); if (!cone) ctx.stroke();
      if (cone) { const [c, fr] = B.tinted(u2, 'fx_warn_cone', 0, f.col), sy = f.r / fr[3], sx = sy * Math.tan(f.half) / Math.tan(0.79);
        ctx.rotate(f.ang + Math.PI / 2); ctx.scale(sx, sy); ctx.globalAlpha = 0.75 + 0.25 * Math.sin(f.t * 0.35); ctx.drawImage(c, -fr[2] / 2, -fr[3]); }
      ctx.restore(); }
    for (const r of v.res) { const fr = A.frameAt(Object.assign({}, u.act[N + '_poison_residue'], { loop: true }), r.t * TK); A.draw(u, fr, r.x, r.y, 64 * K() * 2.2 / 181, false, Math.min(1, (r.life - r.t) / 15) * 0.9); }
    for (const j of v.jars) { const fr = u.act[N + (j.full ? '_jar_full' : '_jar_empty')].f[0]; A.draw(u, fr, j.x, j.y, HH() * 0.7 / 256, false, 1);
      if (j.full && j.st2 > 0) { ctx.save(); ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(j.x, j.y - HH() * 0.95, 9, -1.57, -1.57 + 6.283 * j.st2 / S(2)); ctx.stroke(); ctx.restore(); } } }
  /* r3.38.0：向下吐息（x2_boss）。錨點＝嘴；圖往下延伸，旋轉對準地面落點；前 30% 播起手格，之後在 3～5 格循環 */
  function down(o, mx, my, gx, gy, q, al) { if (o.el === 'poison') return false; const u = A.get('x2_boss'), n = 'boss_orochi_breath_down_' + (o.el === 'fire' ? 'fire' : 'ice'), R = u && u.fx && u.fx[n]; if (!R) return false;
    const fi = q < 0.3 ? Math.floor(q / 0.3 * 3) : 3 + Math.floor(o.t / 4) % 3, fr = R.f[Math.min(R.f.length - 1, fi)], L = Math.hypot(gx - mx, gy - my), sc = L / 830;
    ctx.save(); ctx.globalAlpha = al; ctx.globalCompositeOperation = 'lighter'; ctx.translate(mx, my); ctx.rotate(Math.atan2(gy - my, gx - mx) - Math.PI / 2); ctx.scale(sc * 1.5, sc);
    ctx.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], -fr[4], -fr[5], fr[2], fr[3]); ctx.restore();
    if (o.el === 'water' && o.t === 1 && G.VX && G.VX.s2) G.VX.s2('boss_orochi_breath_down_ice_frost', { x: gx, y: gy, k: 0.7, sy: 0.6, life: 6, hold: Math.round(o.life * 1.6), l: 'g', a: 0.9, fi: 0 });
    return true; }
  function drawOver(enc) { const v = enc.v, u = U(); if (!u) return;
    /* r3.33.1：吐息＝①嘴到地面的短噴流 ②貼地沿預兆方向鋪開（地面透視 1/1.6，與判定範圍一致）；粗細固定；前 30% 往前延伸、最後 25% 淡出 */
    for (const o of v.breaths) { const h = o.h, r = u.act[N + '_' + (o.el === 'water' ? 'water_beam' : o.el === 'fire' ? 'fire_breath' : 'poison_breath')], fr = A.frameAt(r, Math.min(539, o.t / o.life * 540)), img = u.imgs[fr[7]];
      const q = o.t / o.life, grow = Math.min(1, q / 0.3), al = 0.95 * (q > 0.75 ? (1 - q) / 0.25 : 1), T = HH() * (o.el === 'water' ? 0.8 : o.el === 'fire' ? 1.1 : 1.2), R = h.R || 300;
      const seg = (x, y, ang, L, th, sy, a) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, sy); ctx.rotate(ang); if (Math.cos(ang) < 0) ctx.scale(1, -1); ctx.globalAlpha = a;
        ctx.beginPath(); ctx.rect(-4, -th, L * grow + 8, th * 2); ctx.clip(); ctx.scale(-1, 1); ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], -L * 1.05, -th / 2, L * 1.1, th); ctx.restore(); };
      const gx = h.x + Math.cos(h.ang) * R * 0.18, gy = h.y + Math.sin(h.ang) * R * 0.18 / 1.6, mx = h.mx !== undefined ? h.mx : h.x, my = h.my !== undefined ? h.my : h.y - h.lift;
      if (!down(o, mx, my, gx, gy, q, al)) seg(mx, my, Math.atan2(gy - my, gx - mx), Math.hypot(gx - mx, gy - my), T * 0.55, 1, al);   // ① 嘴 → 地面
      seg(gx, gy, h.ang, R * 0.82, T * 1.5, 1 / 1.6, al); }   // ② 貼地鋪開
    if (v.qi) { v.qi.t++; const fr = A.frameAt(u.act[N + '_sword_qi'], Math.min(539, v.qi.t * 18)); for (const l of v.qi.L) { const L = Math.hypot(l[2] - l[0], l[3] - l[1]); ctx.save(); ctx.translate(l[0], l[1]); ctx.rotate(Math.atan2(l[3] - l[1], l[2] - l[0])); ctx.scale(-1, 1); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -L, -HH() * 0.5, L, HH()); ctx.restore(); } } }

  B.OROCHI = { bite, breath, setAct };   // 測試用
  B.reg('orochi', { name: '八岐大蛇', sub: '八頭八尾之主', unit: 'b_orochi', hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R06_07'],
    actors: [{ id: N, name: '八岐大蛇', size: 2.4, moves: [] }], mv: MV, director, drawSelf, drawUnder, drawOver,
    idle: e => { if (e.head && e.st === 'hurt' && e.t > 12) e.st = 'walk'; return true; },
    init(enc) { const b = R(enc); const p = SC.snap(SC.def.w / 2, (SC.y0 + SC.y1) / 2 + 20, 'open', 500) || [b.x, b.y]; b.x = p[0]; b.y = p[1]; b.nobar = 1; b.face = 1;
      const v = enc.v = { ph: 1, cd: { sweep: S(6) }, heads: [], fans: [], breaths: [], res: [], queue: [], jars: [], qi: null, t: 0 };
      for (let i = 0; i < 8; i++) { const h = Object.assign({}, b, { head: 1, i, el: EL[i], body: b, mv: null, st: 'walk', boss: false, nobar: 1, hp: 1e9, hpMax: 1e9, hpMax2: b.hpMax / 8, hp2: b.hpMax / 8, awake: [0, 2, 4, 6].includes(i), regenOk: enc.diff >= 1, idx: 20 + i, flash: 0, kb: 0 });
        h.s = h.awake ? 'idle' : 'sleep'; h.ht = 0; [h.x, h.y] = home(h); h.y += HY[i] < 0 ? 0 : 0; h.lift = HH() * 2; h.ex = 'idle0'; v.heads.push(h); G.E.push(h); }
      const av = [[b.x, b.y], [H.x, H.y]].concat(v.heads.map(h => [h.x, h.y]));
      for (let i = 0, n = 0; i < 40 && v.jars.length < 8; i++) { const a = (v.jars.length / 8) * Math.PI * 2 + rnd(-0.2, 0.2), r = HH() * rnd(3.6, 5.2), q = SC.snap(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.45, 'open', 60);   // 酒甕繞本體一圈（蛇頭搆得到）
        if (q && !av.some(o => Math.hypot(o[0] - q[0], o[1] - q[1]) < HH() * 1.2)) { av.push(q); v.jars.push({ x: q[0], y: q[1], full: 1, st2: 0, rt: 0 }); } }
      enc.cd = S(1.4); },
    finish(enc) { for (const h of enc.v.heads) { h.st = 'dead'; h.alpha = 0; } G.E = G.E.filter(x => !enc.v.heads.includes(x)); enc.v.fans = []; enc.v.breaths = []; enc.v.queue = []; enc.v.res = []; },
    preDamage(e) { if (!e.head) { if (e.fin) return false; if (G.t % 20 === 0) G.UI.toast('本體太硬了——攻擊蛇頭！'); return true; }
      return e.s === 'cut' || e.s === 'sleep' || e.s === 'wake' || e.st === 'dead'; },
    onDamage(e, d) { if (!e.head) return false; const b = e.body, enc = b.enc, m = e.s === 'drunk' ? 1.5 : 1, dd = Math.round(d * m);
      if (m > 1) G.NUMS.push({ x: e.x, y: e.y - HH() * 1.4, v: '×1.5', gold: true, t: 0 });
      e.hp2 -= dd; b.hp -= dd; e.hp = 1e9; e.flash = 10;
      if (e.hp2 <= 0) { e.hp2 = 0; setAct(e, 'cut'); fx(b, N + '_bite_impact', e.x, e.y, { s: HH() * 1.4 / 250, nat: -1 }); G.UI.toast(NAME[e.el] + '頭被砍斷了！'); }
      if (b.hp <= 0 || enc.v.heads.every(h => h.s === 'cut' && !h.regenOk)) { b.hp = 1; b.fin = 1; G.damageOni(b, 99, true); }
      if (e.s === 'bite' || e.s === 'breath') e.st = 'walk';   // 出招中不硬直
      return true; } });
})();
