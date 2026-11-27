/* ==========================================================================
 * 神諭之地 重製版 — 139_foeai.js
 * Version : r3.198.0  (2026-11-28)　r3.198.0：地面預警減量（普通攻擊改身上起手閃光、招式預警出手前才出現、同色重疊合併、底色變淡）
 * 舊版    : r3.197.0  (2026-11-28)　r3.197.0：敵人招式改播手繪素材（近戰爪痕／揮擊弧光、法球、地爆、重踩震波）
 * 舊版    : r3.154.0  (2026-11-27)　r3.154.0：重擊時一般妖怪後仰約 0.2 秒；妖怪互相推開（被吸住、擊退中先不推，結束後才散開）
 * 舊版    : r3.145.0  (2026-11-27)　r3.145.0：預警調淡（底色約減半、圖示平常 30%，出手前才亮）
 * 舊版    : r3.127.2  (2026-11-27)　r3.127.2：突進（踏步斬）、群撲、盾擊改約主角跑速 1.1 倍，巨體衝撞 1.3 倍（原本 3～5 倍）
 * 舊版    : r3.126.1  (2026-11-27)　r3.126.1：突擊衝刺降速＝主角跑步 1.2 倍（原本約 6.5 倍）、距離上限 2.5 身高、起手 0.73 秒、回身再衝 25%（精英照舊）、同圖最多 2 隻同時衝刺
 * 舊版    : r3.126.0  (2026-11-27)　r3.126.0：一般攻擊預警在敵人被打斷（不在出手狀態）時立刻消失
 * 舊版    : r3.119.0  (2026-11-26)　r3.119.0：敵人等級加上轉生輪次加成（+20／+50／+75／+100），轉生後任何難度敵人都不低於主角
 * 舊版    : r3.112.0  (2026-11-26)　r3.112.0：等級改「取地圖與主角較高者＋5／15／30」；重甲（橫掃／盾擊＋擊退暈 0.5 秒，正面受傷 −30%、輕攻擊不硬直）、巨體（重踩震波／衝撞，撞牆自暈 1 秒，不硬直）
 * 舊版    : r3.111.0  (2026-11-26)
 * 變更    : r3.111.0 新增。敵人等級與招式（企劃：每類至少 2 招，預警沿用頭目素材）。
 *           1. 等級：困難以上 敵人 Lv＝地圖等級＋主角等級＋難度加成（困難 +5／修羅 +15／無間 +30），頭目同。輕鬆／普通維持地圖等級。
 *              呼叫端已帶高等級（≥ 主角＋加成，例如召喚、分裂）就不再加，避免一代一代往上疊。
 *           2. 第 1 章：W_R01_03／04／07 改 Lv3／5／7，鎌鼬頭目 Lv9；敵人清單加入赤鬼、木靈、狒狒（突擊）、山姥（術士）。
 *              各章補齊：第 2 章加山賊弓手、短刀山賊改突擊；第 5 章轆轤首改術士；第 6 章加犬神；第 7 章加影弓；
 *              第 8 章野武士改突擊；第 9 章蜘蛛兵改突擊；第 10 章磯女改術士；第 11 章醜女改突擊；出雲副本加犬神。
 *           3. 預警：一般近戰原本的紅色外框橢圓改成頭目同款（x2_boss 的 fx_warn_target／circle／line＋由內往外填色）。
 *              顏色：物理紅、法術紫、重擊橘；精英預警時間 ×0.8、第 2 招冷卻 ×0.5。
 *           4. 招式（r3.111：群聚／雜兵／突擊／遠程／術士；重甲／巨體 r3.112）
 *              群聚　撲咬（原近戰）｜圍攻：附近同伴一起撲向主角腳下（小圈 0.5 秒）
 *              雜兵　砍擊（原近戰）｜踏步斬：往前短直線（0.6 秒）
 *              突擊　衝刺：直線約 4 個身高（0.6 秒）｜迴身斬：衝過頭折返再衝一次（0.4 秒，精英必接）
 *              遠程　單發：細直線預警（0.4 秒）＋箭｜拋射：主角周圍 3 個小圈（1.0 秒）
 *              術士　法球：紫色細直線（0.8 秒）後慢速追蹤（精英 3 顆）｜地爆：主角腳下紫色中圈（0.9 秒）
 *              術士會保持 2.8～5.5 個身高的距離（不瞬移），貼身時才用原本近戰。
 *           5. 妖怪村入口：完成「鎌鼬的巡山」、聽到搬村消息（flags.yv_c1_b_patrol）後才出現在兩岸城。
 *           ・效能：招式只在出手時建立物件；預警／法球各自一份清單，換圖清空。
 * 依賴    : 03_actors（spawnOni／oniStep／hurtHero／drawOni）、131_foes（FOES.CL／_fc）、26_boss（BOSS.tinted、start）、73_diff（GDIFF.i）、86_fx2（VX.x2）、52_hub。
 * ========================================================================== */
'use strict';
(function () {
  const H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), rnd = (a, b) => a + Math.random() * (b - a), F = () => G.SAVE.data.flags, TK = 1000 / 60;
  const gi = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1), hlv = () => (G.RPG && G.RPG.d() && G.RPG.d().lv) || 1;
  /* ======================= 1. 等級 ======================= */
  const ADD = [0, 0, 5, 15, 30], on = () => gi() >= 2;
  /* 呼叫端帶的等級：接近地圖等級（±10）＝以地圖為基準 → 加主角＋難度；已經 ≥ 主角＋難度−6（召喚、分裂、頭目小兵）＝已換算過 → 不再加 */
  /* r3.119.0：轉生輪次加成 rb（第二輪 +20／三 +50／四 +75／五以後 +100），加在地圖等級上，且敵人不低於主角（輕鬆／普通也適用） */
  function lvOf(lv) { const rb = (G.REBIRTH && G.REBIRTH.bonus()) || 0, m0 = (SC.def && SC.def.lv) || 1, m = m0 + rb, a = ADD[gi()] || 0, h = hlv(); if (G.TRAIN && G.TRAIN.on) return lv || m0;
    if (lv) { if (Math.abs(lv - m0) <= 10) lv += rb; else if (lv >= h + a - 6 + rb) return lv; else lv += rb; }
    const b = lv || m; if (!on()) return rb ? Math.max(b, h) : b; return MODE.max ? Math.max(b, h) + a : b + h + a; }
  const MODE = { max: 1 };   /* r3.112.0：使用者同意改「取地圖與主角較高者＋難度」；max:0＝舊的三者相加 */
  (function hkS() { if (!G.spawnOni || !G.FOES) return setTimeout(hkS, 50); const sp0 = G.spawnOni; G.spawnOni = function (x, y, delay, lv, type, ...rest) { return sp0.call(this, x, y, delay, lvOf(lv), type, ...rest); }; })();
  (function hkB() { const B = G.BOSS; if (!B || !B.start) return setTimeout(hkB, 50); const bs0 = B.start; B.start = function (id, o) { o = Object.assign({}, o || {});
      if (id === 'kama' && !o.lv) o.lv = 9; if (on() || (G.REBIRTH && G.REBIRTH.bonus())) o.lv = lvOf(o.lv || (SC.def.lv || 1) + 2); return bs0.call(this, id, o); }; })();
  /* ======================= 2. 第 1 章等級、各章敵人清單 ======================= */
  const C1 = { W_R01_03: 3, W_R01_04: 5, W_R01_07: 7 }, C1F = ['akaoni', 'kodama', 'hihi', 'yamauba'], c1f = d => { d.foes = d.foes || []; for (const t of C1F) if (!d.foes.includes(t)) d.foes.push(t); };
  const ADDF = { 2: ['bandit_archer'], 6: ['inugami'], 7: ['kageyumi'] }, ADDD = { IZUMO: ['inugami'] };
  const RECL = { bandit_knife: 'assault', rokuro: 'spirit', nobushi: 'assault', kumohei: 'assault', isoonna: 'spirit', shikome: 'assault', hihi: 'assault', yamauba: 'spirit', kodama: 'swarm' };
  function patch() { const D = G.D && G.D.scenes; if (!D || !G.FOES) return false; for (const t in RECL) G.FOES.CL[t] = RECL[t];
    for (const id in C1) if (D[id]) { D[id].lv = C1[id]; c1f(D[id]); }
    const meta = (G.WORLD && G.WORLD.meta) || {};
    for (const id in D) { const d = D[id], m = /^W_R(\d\d)_/.exec(id), dg = /^D_([A-Z]+)_/.exec(id), add = m ? ADDF[+m[1]] : dg ? ADDD[dg[1]] : null; if (!add || !d.foes) continue;
      for (const t of add) if (!d.foes.includes(t)) d.foes.push(t); if (meta[id] && meta[id].foes && meta[id].foes !== d.foes) for (const t of add) if (!meta[id].foes.includes(t)) meta[id].foes.push(t); }
    return true; }
  (function hkP() { if (!G.WORLD || !G.WORLD.ready || !G.D || !G.D.scenes || !G.D.scenes.W_R02_01) return setTimeout(hkP, 200); patch(); })();
  /* 第 1 章地圖不在 world.json，進圖時補載新加的妖怪圖（沒載好前 spawnOni 會退回赤鬼） */
  (function hkE() { if (!G.STORY || !G.STORY.onEnter) return setTimeout(hkE, 60); const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { W.length = 0; ORB.length = 0; const d = G.D.scenes[id];
      if (C1[id] && d) { d.lv = C1[id]; c1f(d); if (G.ASSET && G.ASSET.enemies) Promise.resolve(G.ASSET.enemies(d.foes)).catch(() => 0); }
      return en0(id); }; })();
  /* ======================= 3. 預警（頭目同款） ======================= */
  const W = [], ORB = [], RED = '230,60,40', MAG = '170,90,255', HEV = '255,150,40';
  const lane = (e, x0, y0, x1, y1, w, life, col) => { const t = { k: 'lane', e, x0, y0, x1, y1, w, t: 0, life, col: col || RED }; W.push(t); return t; };
  const circ = (e, x, y, r, life, col) => { const t = { k: 'circle', e, x, y, r, t: 0, life, col: col || RED }; W.push(t); return t; };
  function art(u, n, fi, col, x, y, sx, sy, rot, a) { const T = G.BOSS && G.BOSS.tinted; if (!T) return; const [c, fr] = T(u, n, fi, col), ctx = G.ctx; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(c, -fr[4], -fr[5]); ctx.restore(); }
  function drawWarn(t, u) { const ctx = G.ctx, q = Math.min(1, t.t / t.life), pul = (0.3 + 0.5 * Math.max(0, (q - 0.65) / 0.35)) * (0.85 + 0.15 * Math.sin(t.t * 0.35));   /* r3.145.0：預警調淡，出手前 35% 才變亮 */
    if (t.k === 'lane') { const ang = Math.atan2(t.y1 - t.y0, t.x1 - t.x0), L = Math.hypot(t.x1 - t.x0, t.y1 - t.y0), bh = t.w * 0.6;
      if (u) art(u, 'fx_warn_line', 0, t.col, (t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2, L / 610, bh / 88, ang, pul * (t._vis || 0)); return; }
    if (!u) return; const pv = pul * (t._vis || 0); if (t.r <= HH() * 0.8) { const fi = Math.min(3, Math.floor(q / 0.35 * 4)), k = 2 * t.r / 80; art(u, 'fx_warn_target', fi, t.col, t.x, t.y, k, k * 0.42, 0, pv); }
    else { const k = 2 * t.r / 300; art(u, 'fx_warn_circle', 0, t.col, t.x, t.y, k, k * 0.42, 0, pv); } }
  /* r3.198.0：地面預警減量——
   * A 普通攻擊（近戰、遠程單發）不畫地面，改成怪物身上起手閃光＋紅色氣焰（越接近出手越亮，出手前再閃一次）；
   * B 招式預警在出手前 45% 才出現（原本一起手就畫）；
   * C 同色預警疊在一起時合成一塊，不再越疊越深；
   * D 底色改成很淡，只有出手前一瞬間才填亮，平常以邊框圖為主。 */
  const SHOW = 0.55;
  function halo(t) { const e = t.e; if (!e || e.hp <= 0 || e.st !== 'atk') return; const ctx = G.ctx, q = Math.min(1, t.t / t.life), k = HH() * S(e.y) * Math.min(1.8, e.ratio || 1), x = e.x + e.face * k * 0.12, y = e.y - k * 0.55, R = k * 0.58, a = 0.05 + 0.24 * q * q;   /* 氣焰縮小、調淡：一群怪同時起手時不會連成一片紅霧 */
    const g = ctx.createRadialGradient(x, y, R * 0.15, x, y, R); g.addColorStop(0, `rgba(255,96,56,${a})`); g.addColorStop(0.6, `rgba(230,50,36,${a * 0.55})`); g.addColorStop(1, 'rgba(230,50,36,0)'); ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, R * 0.8, R, 0, 0, 6.283); ctx.fill(); ctx.restore();
    const late = t.life > 18 && t.t >= t.life - 10; if ((!t._g1 || (late && !t._g2)) && G.KF && G.KF.use) { if (late) t._g2 = 1; t._g1 = 1; try { G.KF.use('ember', () => G.KF.glint(e.x + e.face * k * 0.3, e.y, 0.8 * Math.min(1.8, e.ratio || 1), late ? 0.5 : 0.34, late ? 10 : 12)); } catch (x2) {} } }
  function drawAll(u) { const ctx = G.ctx, GP = {};
    for (const t of W) { if (t.basic) { halo(t); continue; } const q = Math.min(1, t.t / t.life); t._vis = 0; if (q < SHOW) continue; const vis = Math.min(1, (t.t - t.life * SHOW + 1) / 4), fin = t.life - t.t <= 5; t._vis = vis;
      const g = GP[t.col] || (GP[t.col] = { p: new Path2D(), a: 0 }); g.a = Math.max(g.a, vis * (fin ? 0.26 : u ? 0.06 : 0.12));
      if (t.k === 'lane') { const dx = t.x1 - t.x0, dy = t.y1 - t.y0, L = Math.hypot(dx, dy) || 1, h = t.w * 0.3, ux = dx / L, uy = dy / L, nx = -uy * h, ny = ux * h; g.p.moveTo(t.x0 - nx, t.y0 - ny); g.p.lineTo(t.x1 - nx, t.y1 - ny); g.p.lineTo(t.x1 + nx, t.y1 + ny); g.p.lineTo(t.x0 + nx, t.y0 + ny); g.p.closePath(); }
      else { g.p.moveTo(t.x + t.r, t.y); g.p.ellipse(t.x, t.y, t.r, t.r * 0.42, 0, 0, 6.283); g.p.closePath(); } }
    for (const c in GP) { ctx.save(); ctx.fillStyle = `rgba(${c},${GP[c].a.toFixed(3)})`; ctx.fill(GP[c].p, 'nonzero'); ctx.restore(); }
    for (const t of W) if (!t.basic && t._vis > 0) drawWarn(t, u); }

  /* ======================= 4. 招式 ======================= */
  const dist = e => Math.hypot(H.x - e.x, (H.y - e.y) * 1.6) / (HH() * S(e.y));
  const el = e => !!e.elite, wk = (e, f) => Math.round(f * (el(e) ? 0.8 : 1)), cd2 = (e, f) => Math.round(f * (el(e) ? 0.5 : 1));
  const inLane = (x0, y0, x1, y1, w) => { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((H.x - x0) * dx + (H.y - y0) * dy) / L2)), px = x0 + dx * u, py = y0 + dy * u; return Math.abs(H.x - px) < w * 0.5 && Math.abs(H.y - py) < Math.max(18, w * 0.35); };
  const inCirc = (x, y, r) => Math.hypot(H.x - x, (H.y - y) / 0.42) < r;
  const hurt = (e, m) => { if (H.hp > 0) G.hurtHero(e.atk * m, e.x); };
  const dust = (x, y) => G.FX.push({ k: 'dust', x, y, t: 0, life: 20 });
  function begin(e, k, Wf, o) { e.mv = Object.assign({ k, t: 0, W: Wf }, o || {}); e.st = 'atk'; e.t = 0; e.atkHit = true; e.atkMs = Math.max(500, Wf * TK / 0.48); if (Math.abs(H.x - e.x) > 4) e.face = Math.sign(H.x - e.x); }
  function finish(e) { const m = e.mv; e.mv = null; for (const t of W) if (t.e === e) t.t = t.life; if (e.st === 'atk') { e.st = 'walk'; e.t = 0; } e.cd = 50 + Math.random() * 40; return m; }
  const walkTo = (e, x, y) => { if (SC.walkable(x, y)) { e.x = x; e.y = y; return true; } return false; };
  /* 招式表：pick(e,d) 回傳是否開始 */
  const NF = (d, y, f) => Math.max(10, Math.round(d / (2.75 * f * S(y))));   /* r3.127.2：位移格數（主角跑速約 2.75×深度 px／格） */
  const MV = {
    /* 群聚：圍攻 */
    /* r3.127.2：位移招式統一速度：距離 ÷（主角跑速 × 倍率）＝格數；突進／跳撲／盾擊 1.1 倍、巨體衝撞 1.3 倍 */
    pack: { ok: (e, d) => d > 1.2 && d < 3.5, start(e) { const k = HH() * S(e.y), mates = G.E.filter(o => o !== e && o._fc === 'swarm' && !o.mv && o.st === 'walk' && !(o.stun > 0) && o.hp > 0 && Math.hypot(o.x - e.x, o.y - e.y) < k * 3).slice(0, 2);
        for (const o of [e].concat(mates)) { const tx = H.x + rnd(-0.3, 0.3) * k, ty = H.y + rnd(-10, 10), Wf = wk(o, 30); begin(o, 'leap', Wf, { tx, ty, sx: o.x, sy: o.y, n: NF(Math.hypot(tx - o.x, ty - o.y), o.y, 1.1) }); o.mv.w = circ(o, tx, ty, k * 0.45, Wf); o._m2 = G.t + cd2(o, 360); } } },
    leap: { step(e, m) { if (m.t < m.W) return; const n = m.n || 12, q = Math.min(1, (m.t - m.W) / n), k = HH() * S(e.y); walkTo(e, m.sx + (m.tx - m.sx) * q, m.sy + (m.ty - m.sy) * q);
        if (q >= 1 && !m.hit) { m.hit = 1; meleeFx(e, 0, m.tx, m.ty); if (inCirc(m.tx, m.ty, k * 0.45)) hurt(e, 1.0); dust(m.tx, m.ty); } return m.t > m.W + n + 20; } },
    /* 雜兵：踏步斬 */
    stepcut: { ok: (e, d) => d > 1.0 && d < 2.3, start(e) { const k = HH() * S(e.y), a = Math.atan2(H.y - e.y, H.x - e.x), L = k * 1.5, x1 = e.x + Math.cos(a) * L, y1 = e.y + Math.sin(a) * L * 0.6, Wf = wk(e, 36);
        begin(e, 'cut', Wf, { sx: e.x, sy: e.y, x1, y1, L, n: NF(L * 0.85, e.y, 1.1) }); lane(e, e.x, e.y, x1, y1, k * 0.55, Wf); e._m2 = G.t + cd2(e, 300); } },
    cut: { step(e, m) { if (m.t < m.W) return; const n = m.n || 10, q = Math.min(1, (m.t - m.W) / n), k = HH() * S(e.y); walkTo(e, m.sx + (m.x1 - m.sx) * q * 0.85, m.sy + (m.y1 - m.sy) * q * 0.85);
        if (!m.fx && q > 0.5) { m.fx = 1; meleeFx(e); } if (!m.hit && q > 0.5 && inLane(m.sx, m.sy, m.x1, m.y1, k * 0.55)) { m.hit = 1; hurt(e, 1.2); } if (q >= 1 && !m.d) { m.d = 1; dust(e.x + e.face * k * 0.4, e.y); } return m.t > m.W + n + 24; } },
    /* 突擊：衝刺＋迴身斬 */
    dash: { ok: (e, d) => d > 1.8 && d < 4.8 && G.E.filter(o => o.mv && o.mv.k === 'run').length < 2, start(e, turn) { const k = HH() * S(e.y), a = Math.atan2(H.y - e.y, H.x - e.x), L = Math.min(k * 2.5, dist(e) * k + k), x1 = e.x + Math.cos(a) * L, y1 = e.y + Math.sin(a) * L * 0.6, Wf = wk(e, turn ? 30 : 44), n = Math.max(12, Math.round(Math.hypot(x1 - e.x, y1 - e.y) / (2.75 * 1.05 * S(e.y))));   /* 實測約主角跑步 ×1.2（含縱向位移） */
        begin(e, 'run', Wf, { sx: e.x, sy: e.y, x1, y1, turn, n }); lane(e, e.x, e.y, x1, y1, k * 0.6, Wf); if (!turn) e._m1 = G.t + 240; } },
    run: { step(e, m) { if (m.t < m.W) return; const n = m.n || 16, q = Math.min(1, (m.t - m.W) / n), k = HH() * S(e.y); if (!walkTo(e, m.sx + (m.x1 - m.sx) * q, m.sy + (m.y1 - m.sy) * q)) m.t = Math.max(m.t, m.W + n);
        if (!m.hit && inLane(m.sx, m.sy, e.x, e.y, k * 0.6) && Math.hypot(H.x - e.x, H.y - e.y) < k * 0.7) { m.hit = 1; meleeFx(e); hurt(e, m.turn ? 1.1 : 1.3); }
        if (m.t === m.W + n) dust(e.x, e.y);
        if (m.t > m.W + n + 6) { if (!m.turn && H.hp > 0 && (el(e) || Math.random() < 0.25) && G.t >= (e._m2 || 0)) { e._m2 = G.t + cd2(e, 420); e.mv = null; MV.dash.start(e, 1); return false; } return true; } return false; } },
    /* 遠程：拋射 */
    lob: { ok: (e, d) => d > 2.5 && d < 6.5, start(e) { const k = HH() * S(H.y), Wf = wk(e, 60), P = [];
        for (let i = 0; i < 3; i++) { const a = i * 2.094 + rnd(0, 1), r = i ? k * 0.55 : 0, x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r * 0.42; P.push([x, y]); circ(e, x, y, k * 0.4, Wf); }
        begin(e, 'rain', Wf, { P }); e._m2 = G.t + cd2(e, 420); } },
    rain: { step(e, m) { const k = HH() * S(H.y); if (m.t === Math.max(1, m.W - 14)) for (const p of m.P) fall(p[0], p[1], 14, k);
        if (m.t === m.W) { let hit = 0; for (const p of m.P) { dust(p[0], p[1]); if (!hit && inCirc(p[0], p[1], k * 0.4)) { hit = 1; hurt(e, 0.7); } } } return m.t > m.W + 20; } },
    /* 術士：法球 */
    orb: { ok: (e, d) => d > 1.6 && d < 7, start(e) { const k = HH() * S(e.y), Wf = wk(e, 48), a = Math.atan2(H.y - e.y, H.x - e.x), L = Math.min(dist(e), 6) * k;
        begin(e, 'cast', Wf, { a }); lane(e, e.x, e.y, e.x + Math.cos(a) * L, e.y + Math.sin(a) * L * 0.6, k * 0.3, Wf, MAG); e._m1 = G.t + 200; } },
    cast: { step(e, m) { if (m.t === m.W) { const n = el(e) ? 3 : 1; for (let i = 0; i < n; i++) orb(e, m.a + (i - (n - 1) / 2) * 0.35); } return m.t > m.W + 24; } },
    /* 術士：地爆 */
    burst: { ok: (e, d) => d > 1.5 && d < 7, start(e) { const k = HH() * S(H.y), Wf = wk(e, 54), x = H.x, y = H.y; begin(e, 'boom', Wf, { x, y, r: k * 0.75 }); circ(e, x, y, k * 0.75, Wf, MAG); e._m2 = G.t + cd2(e, 420); } },
    boom: { step(e, m) { if (m.t === m.W) { boomFx(m.x, m.y, m.r); if (inCirc(m.x, m.y, m.r)) hurt(e, 1.3); } return m.t > m.W + 24; } },
    /* r3.112.0 重甲：橫掃 */
    sweep: { ok: (e, d) => d < 1.8, start(e) { const k = HH() * S(e.y), Wf = wk(e, 48); if (Math.abs(H.x - e.x) > 4) e.face = Math.sign(H.x - e.x); const x = e.x + e.face * k * 0.6, y = e.y;
        begin(e, 'swing', Wf, { x, y, r: k * 0.95 }); circ(e, x, y, k * 0.95, Wf); e._m1 = G.t + 240; } },
    swing: { step(e, m) { if (m.t === m.W) { meleeFx(e, 1, m.x, m.y); dust(m.x, m.y); G.SC.shake = Math.max(G.SC.shake || 0, 4); if (inCirc(m.x, m.y, m.r)) hurt(e, 1.3); } return m.t > m.W + 28; } },
    /* 重甲：盾擊（擊退＋暈 0.5 秒） */
    bash: { ok: (e, d) => d > 0.8 && d < 2.4, start(e) { const k = HH() * S(e.y), a = Math.atan2(H.y - e.y, H.x - e.x), L = k * 1.6, x1 = e.x + Math.cos(a) * L, y1 = e.y + Math.sin(a) * L * 0.6, Wf = wk(e, 36);
        begin(e, 'shove', Wf, { sx: e.x, sy: e.y, x1, y1, a, n: NF(L * 0.8, e.y, 1.1) }); lane(e, e.x, e.y, x1, y1, k * 0.6, Wf); e._m2 = G.t + cd2(e, 420); } },
    shove: { step(e, m) { if (m.t < m.W) return; const n = m.n || 10, q = Math.min(1, (m.t - m.W) / n), k = HH() * S(e.y); walkTo(e, m.sx + (m.x1 - m.sx) * q * 0.8, m.sy + (m.y1 - m.sy) * q * 0.8);
        if (!m.hit && inLane(m.sx, m.sy, m.x1, m.y1, k * 0.6) && Math.hypot(H.x - e.x, H.y - e.y) < k * 0.8) { m.hit = 1; meleeFx(e); const hp0 = H.hp; hurt(e, 1.0);
          if (H.hp < hp0) { for (let i = 0; i < 6; i++) { const nx = H.x + Math.cos(m.a) * k * 0.12; if (SC.walkable(nx, H.y)) H.x = nx; } H._stn = 30; G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 20, v: '暈', t: 0, col: '#ffd08a' }); } }
        return m.t > m.W + n + 20; } },
    /* 巨體：重踩（自身大圈＋震波） */
    stomp: { ok: (e, d) => d < 2.2, start(e) { const k = HH() * S(e.y), Wf = wk(e, 60); begin(e, 'quake', Wf, { x: e.x, y: e.y, r: k * 1.5 }); circ(e, e.x, e.y, k * 1.5, Wf, HEV); e._m1 = G.t + 300; } },
    quake: { step(e, m) { if (m.t === m.W) { shock(m.x, m.y, m.r); if (inCirc(m.x, m.y, m.r)) hurt(e, 1.5); } return m.t > m.W + 30; } },
    /* 巨體：衝撞（撞牆暈 1 秒） */
    ram: { ok: (e, d) => d > 2 && d < 6, start(e) { const k = HH() * S(e.y), a = Math.atan2(H.y - e.y, H.x - e.x), L = Math.min(k * 5, dist(e) * k + k), x1 = e.x + Math.cos(a) * L, y1 = e.y + Math.sin(a) * L * 0.6, Wf = wk(e, 54);
        begin(e, 'charge', Wf, { sx: e.x, sy: e.y, x1, y1, n: NF(Math.hypot(x1 - e.x, y1 - e.y), e.y, 1.3) }); lane(e, e.x, e.y, x1, y1, k * 0.9, Wf, HEV); e._m2 = G.t + cd2(e, 480); } },
    charge: { step(e, m) { if (m.t < m.W) return; const n = m.n || 22, q = Math.min(1, (m.t - m.W) / n), k = HH() * S(e.y);
        if (!m.wall && !walkTo(e, m.sx + (m.x1 - m.sx) * q, m.sy + (m.y1 - m.sy) * q)) { m.wall = 1; shock(e.x, e.y, k * 0.8); e.stun = 60; G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) * (e.ratio || 1) - 18, v: '撞牆・暈', t: 0, col: '#ffd08a' }); return true; }
        if (!m.hit && Math.hypot(H.x - e.x, (H.y - e.y) * 1.6) < k * 0.8) { m.hit = 1; hurt(e, 1.6); }
        if (m.t === m.W + n) dust(e.x, e.y); return m.t > m.W + n + 18; } } };
  /* 每類：[招式 1, 招式 2]；null＝原本近戰 */
  const KIT = { swarm: [null, 'pack'], grunt: [null, 'stepcut'], assault: ['dash', null], ranged: [null, 'lob'], spirit: ['orb', 'burst'], armor: ['sweep', 'bash'], giant: ['stomp', 'ram'] };
  /* r3.112.0：重甲正面受傷 −30%、輕攻擊不硬直；巨體完全不硬直 */
  (function hkDm() { if (!G.damageOni) return setTimeout(hkDm, 50); const d0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (!e || skip(e) || (e._fc !== 'armor' && e._fc !== 'giant')) return d0.apply(this, arguments);
      const st = e.st, t = e.t, src = (opt && opt.party && opt.party.x !== undefined) ? opt.party : H; let m = mult; if (e._fc === 'armor' && Math.sign(src.x - e.x) === e.face) m *= 0.7;
      const r = d0.call(this, e, m, big, fc, opt); if (e.st === 'hurt' && st !== 'hurt' && e.hp > 0 && (e._fc === 'giant' || !big)) { e.st = st; e.t = t; e.kb = (e.kb || 0) * 0.2; } return r; }; })();
  /* r3.197.0：敵人招式改用手繪素材（原本近戰沒有特效、法球／地爆／震波是漸層色塊）。素材第一次用到才下載；沒載好的那一次維持舊畫法 */
  const AX = () => G.AFX, CLAW = /raiju|inugami|hihi|kasha|nue|wani|neko|kumo|okami|gaki|kappa|kodama|karasu|kitsune|itsumade|ningyo|mizuchi|kuma|ushioni/;
  /* 近戰揮擊：獸類＝爪痕；其餘＝橫掃弧光。big＝重甲橫掃 */
  function meleeFx(e, big, x, y) { const A2 = AX(); if (!A2) return; const k = HH() * S(e.y) * Math.min(1.8, e.ratio || 1), px = x === undefined ? e.x + e.face * k * 0.55 : x, py = (y === undefined ? e.y : y) - k * 0.5;
    if (CLAW.test(e.type || '') && !big) A2.play('fx_common', 'weapon_claw_a', { x: px, y: py, size: k * 1.1, flip: e.face < 0, tpf: 3, hold: 1 });
    else A2.play('b_mb_benkei', 'benkei_sweep_arc', { x: px, y: py + k * 0.1, size: k * (big ? 2.5 : 1.7), by: 'w', flip: e.face < 0, tpf: 3, hold: 1 }); }
  function shock(x, y, r) { const VX = G.VX; G.SC.shake = Math.max(G.SC.shake || 0, 7); dust(x - r * 0.4, y); dust(x + r * 0.4, y); if (G.ICO && G.ICO.burst) G.ICO.burst({ x, y }, 'fxp_rock_chip', 6, { z: 0.2 });
    if (AX() && AX().play('b_ibaraki', 'ibaraki_shock_wave', { x, y, size: u => r * (1.9 + u * 0.05), by: 'w', layer: 'g', tpf: 4 })) return;   /* 重踩震波＝茨木的手繪衝擊波 */
    if (VX && VX.custom) VX.custom((q, c) => { const u = q.t / q.life, R = r * (0.3 + u * 0.9), a = (1 - u) * 0.8; c.save(); c.translate(x, y); c.scale(1, 0.42);
      const g = c.createRadialGradient(0, 0, R * 0.55, 0, 0, R); g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(0.7, `rgba(255,170,60,${a * 0.55})`); g.addColorStop(0.88, `rgba(255,220,150,${a})`); g.addColorStop(1, 'rgba(255,150,40,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 6.283); c.fill(); c.restore(); }, 24, 'o'); }
  function tryMove(e) { const kit = KIT[e._fc]; if (!kit || H.hp <= 0) return false; const d = dist(e);
    const k2 = kit[1], k1 = kit[0];
    if (k2 && G.t >= (e._m2 || e._m2i || 0) && MV[k2].ok(e, d)) { MV[k2].start(e); return true; }
    if (k1 && G.t >= (e._m1 || 0) && MV[k1].ok(e, d)) { MV[k1].start(e); return true; }
    return false; }
  /* ---------- 箭雨、法球、爆裂（程式繪製：漸層柔邊，不畫外框線） ---------- */
  function fall(x, y, n, k) { const VX = G.VX; if (!VX || !VX.custom) return; for (let i = 0; i < 3; i++) { const ox = rnd(-0.15, 0.15) * k, dl = i * 2;
      VX.custom((q, c) => { if (q.t < dl) return; const u = Math.min(1, (q.t - dl) / (n - dl)), z = (1 - u) * k * 2.2; c.save(); c.translate(x + ox, y - z); c.rotate(1.5708); if (VX.arrow2) VX.arrow2(c, k * 0.55, '', false); c.restore(); }, n, 'o'); } }
  function orb(e, a) { const k = HH() * S(e.y); ORB.push({ e, x: e.x + e.face * k * 0.3, y: e.y, z: k * 0.6, a, sp: k * 0.04, t: 0, life: 200, atk: e.atk, tr: [] }); }
  function boomFx(x, y, r) { const VX = G.VX; G.SC.shake = Math.max(G.SC.shake || 0, 4); if (G.ICO && G.ICO.burst) G.ICO.burst({ x, y }, 'fxp_talisman', 5, { z: 0.2 });
    if (AX() && AX().play('b_doma', 'domac_devouring_domain_fx', { x, y, size: r * 3, by: 'w', anc: [0.5, 0.8], tpf: 3 })) return;   /* 地爆＝道摩的手繪咒域 */
    if (VX && VX.custom) VX.custom((q, c) => { const u = q.t / q.life, R = r * (0.5 + u * 0.8), a = (1 - u) * 0.85; c.save(); c.translate(x, y); c.scale(1, 0.42); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(235,210,255,${a})`); g.addColorStop(0.45, `rgba(170,90,255,${a * 0.7})`); g.addColorStop(1, 'rgba(90,30,160,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 6.283); c.fill(); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const an = i * 1.2566 + q.t * 0.05, hx = x + Math.cos(an) * r * 0.5 * u, hy = y - u * r * 1.2 - i * 3; const g2 = c.createRadialGradient(hx, hy, 0, hx, hy, r * 0.25); g2.addColorStop(0, `rgba(210,160,255,${a * 0.8})`); g2.addColorStop(1, 'rgba(120,50,200,0)'); c.fillStyle = g2; c.beginPath(); c.arc(hx, hy, r * 0.25, 0, 6.283); c.fill(); } c.restore(); }, 26, 'o'); }
  function orbStep() { for (let i = ORB.length - 1; i >= 0; i--) { const o = ORB[i]; o.t++; const want = Math.atan2(H.y - o.y, H.x - o.x); let da = want - o.a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; o.a += Math.max(-0.035, Math.min(0.035, da));
      o.x += Math.cos(o.a) * o.sp; o.y += Math.sin(o.a) * o.sp * 0.6; o.tr.push([o.x, o.y]); if (o.tr.length > 8) o.tr.shift(); const k = HH() * S(o.y);
      if (Math.abs(H.x - o.x) < k * 0.28 && Math.abs(H.y - o.y) < 20 && H.hp > 0) { G.hurtHero(o.atk, o.x); boomFx(o.x, o.y, k * 0.3); ORB.splice(i, 1); continue; }
      if (o.t > o.life || !SC.walkable(o.x, o.y)) { if (o.t <= o.life) boomFx(o.x, o.y, k * 0.25); ORB.splice(i, 1); } } }
  function orbDraw() { const c = G.ctx; for (const o of ORB) { const k = HH() * S(o.y), R = k * 0.13, a = Math.min(1, (o.life - o.t) / 15);
      if (AX() && AX().fr('b_omagatsuhi', 'omagatsuhi_dark_orb', o.t < 4 ? 0 : 1 + Math.floor(o.t / 5) % 2, o.x, o.y - o.z, { size: k * 0.8, flip: Math.cos(o.a) < 0, a })) { c.save(); c.fillStyle = `rgba(30,10,40,${0.18 * a})`; c.beginPath(); c.ellipse(o.x, o.y, R * 1.2, R * 0.4, 0, 0, 6.283); c.fill(); c.restore(); continue; }   /* 法球＝大禍津日的手繪黑球 */
      c.save(); c.globalCompositeOperation = 'lighter';
      o.tr.forEach((p, i) => { const f = (i + 1) / o.tr.length, rr = R * (0.4 + 0.6 * f); const g = c.createRadialGradient(p[0], p[1] - o.z, 0, p[0], p[1] - o.z, rr); g.addColorStop(0, `rgba(190,120,255,${0.35 * f * a})`); g.addColorStop(1, 'rgba(110,40,200,0)'); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1] - o.z, rr, 0, 6.283); c.fill(); });
      const pu = 1 + 0.15 * Math.sin(o.t * 0.4), g = c.createRadialGradient(o.x, o.y - o.z, 0, o.x, o.y - o.z, R * 1.8 * pu); g.addColorStop(0, `rgba(250,235,255,${a})`); g.addColorStop(0.3, `rgba(190,110,255,${0.9 * a})`); g.addColorStop(1, 'rgba(100,30,190,0)');
      c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y - o.z, R * 1.8 * pu, 0, 6.283); c.fill(); c.restore();
      c.save(); c.fillStyle = `rgba(30,10,40,${0.18 * a})`; c.beginPath(); c.ellipse(o.x, o.y, R * 1.2, R * 0.4, 0, 0, 6.283); c.fill(); c.restore(); } }
  /* ---------- 術士保持距離（不瞬移） ---------- */
  function kite(e) { if (e.st !== 'walk' || e.delay > 0 || e.stun > 0 || H.hp <= 0) return false; const d = dist(e); if (d < 1.3 || d > 8) return false;
    e.t++; if (e.flash > 0) e.flash--; if (e.kb) { const nx = e.x + e.kb; if (SC.walkable(nx, e.y)) e.x = nx; e.kb *= 0.8; if (Math.abs(e.kb) < 0.2) e.kb = 0; } if (G.enemyDebStep) G.enemyDebStep(e);
    const dx = H.x - e.x, dy = H.y - e.y, sp = (e._csp || 1) * (e.db && e.db.slow ? 0.5 : 1); if (Math.abs(dx) > 4) e.face = Math.sign(dx);
    if (d < 2.8) { const nx = e.x - Math.sign(dx || 1) * 0.9 * sp; if (SC.walkable(nx, e.y)) e.x = nx; } else if (d > 5.5) { const nx = e.x + Math.sign(dx) * 0.9 * sp; if (SC.walkable(nx, e.y)) e.x = nx; }
    if (Math.abs(dy) > 10) { const ny = e.y + Math.sign(dy) * 0.45 * sp; if (SC.walkable(e.x, ny)) e.y = ny; } return true; }
  /* ---------- 接上 oniStep ---------- */
  const skip = e => !e || e.bb || e.boss || e.kz || e.train || e.doll;
  (function hkO() { if (!G.oniStep || !G.FOES) return setTimeout(hkO, 50); const os0 = G.oniStep; G.oniStep = function (e) { if (skip(e)) return os0.apply(this, arguments);
      if (!e._fc && G.FOES.initFoe) G.FOES.initFoe(e); if (e._fc === 'assault' && !e._ai) { e._ai = 1; e._dashT = 1e12; } if (!e._ai) { e._ai = 1; e._m2i = G.t + 120 + Math.random() * 180; }
      if (e.mv) { if (e.st !== 'atk' || e.hp <= 0) { finish(e); return os0.apply(this, arguments); }
        e.t++; if (e.flash > 0) e.flash--; const m = e.mv; m.t++; const done = MV[m.k].step(e, m); if (done && e.mv === m) finish(e); return; }
      if (e.st === 'walk' && !(e.delay > 0) && !(e.stun > 0) && tryMove(e)) return;
      if (e._fc === 'spirit' && kite(e)) return;
      const r = os0.apply(this, arguments);
      /* 原本近戰／遠程單發：開始出手時補上頭目同款預警 */
      if (e.st === 'atk' && !e.mv && e.t <= 1 && e._wk !== e.atkMs + '@' + e._fireT) { e._wk = e.atkMs + '@' + e._fireT; const s = S(e.y), k = HH() * s;
        if (e._fc === 'ranged') lane(e, e.x, e.y, H.x, H.y, k * 0.22, 26).basic = 1;
        else { const rr = e.ratio / 1.38, bx = G.bodyX ? G.bodyX(e) : 0, reach = Math.max(54, 104 * Math.min(rr, 1.05)) + bx; circ(e, e.x + e.face * reach * 0.5, e.y, Math.max(k * 0.35, reach * 0.5), Math.max(10, Math.round(e.atkMs * 0.48 / TK))).basic = 1; } }
      if (e.st !== 'atk') e._wk = null;
      return r; }; })();
  /* ---------- 每格：預警計時、法球 ---------- */
  (function hkH() { if (!G.heroStep) return setTimeout(hkH, 50); const hs0 = G.heroStep; G.heroStep = function () {
      for (let i = W.length - 1; i >= 0; i--) { const t = W[i]; t.t++; if (t.t >= t.life || (t.e && (t.e.st === 'dead' || !(t.e.hp > 0) || (t.basic && t.e.st !== 'atk')))) W.splice(i, 1); }
      if (ORB.length) orbStep(); if (H._stn > 0) { H._stn--; return; } return hs0.apply(this, arguments); }; })();   /* r3.112.0：盾擊暈眩＝主角停 0.5 秒 */
  (function hkD() { if (!G.drawLoot) return setTimeout(hkD, 50); const d0 = G.drawLoot; G.drawLoot = function () { if (W.length) { const u2 = G.ANIM.get('x2_boss'); if (!u2 && G.VX && G.VX.x2) G.VX.x2('x2_boss'); drawAll(u2 && u2.fx && u2.fx.fx_warn_circle ? u2 : null); }
      d0.apply(this, arguments); if (ORB.length) orbDraw(); }; })();
  /* ======================= 5. 妖怪村入口 ======================= */
  let tk = 0; (function hkY() { if (!G.STORY || !G.STORY.step) return setTimeout(hkY, 60); const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
      if (++tk % 20 || SC.id !== 'hub_city' || F().yv_c1_b_patrol || !G.HUB || !G.HUB.marks) return; if (G.HUB.marks.some(m => m.id === 'yokai_path')) G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'yokai_path'); }; })();
  G.FOEAI = { MODE, on, lvOf, ADD, KIT, MV, W, ORB, tryMove, patch, meleeFx, shock, boomFx, orb };
  /* r3.197.0：場上有哪類敵人，就先備好那類招式的手繪素材（每秒看一次；已載入的不重讀） */
  setInterval(() => { try { if (G.mode !== 'play' || !G.AFX || !G.E.length) return; const L = {}; for (const e of G.E) { const c = e._fc; if (c === 'spirit') { L.b_omagatsuhi = 1; L.b_doma = 1; } else if (c === 'giant') L.b_ibaraki = 1; if (c && c !== 'spirit' && c !== 'ranged' && !CLAW.test(e.type || '')) L.b_mb_benkei = 1; } G.AFX.pre(Object.keys(L)); } catch (x) {} }, 1000);
  /* ---------- r3.154.0：受擊後仰＋敵人互相推開 ---------- */
  /* 受擊後仰：重擊（big）打中一般妖怪 → 往被打的方向後仰約 0.2 秒（12 格）；頭目、大型單位不仰 */
  (function hkLean() { if (!G.damageOni || !G.drawOni) return setTimeout(hkLean, 50);
    const dm = G.damageOni; G.damageOni = function (e, mult, big) { const r = dm.apply(this, arguments);
      if (big && e && !e.bb && !e.boss && e.st !== 'dead' && e.hp > 0) { e.lean = 12; e.leanD = Math.sign(e.kb || 0) || -(e.face || 1); } return r; };
    const dw = G.drawOni; G.drawOni = function (e) { if (!e || !(e.lean > 0) || e.st === 'dead') return dw.apply(this, arguments);
      const k = e.lean / 12, a = e.leanD * 0.2 * Math.sin(k * Math.PI * 0.5 + 0.35); e.lean--;
      const ctx = G.ctx; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(a); ctx.translate(-e.x, -e.y); try { return dw.apply(this, arguments); } finally { ctx.restore(); } }; })();
  /* 推開：每格一次，兩隻一般妖怪靠太近 → 各往外推一點（最多 0.9px／格）。
     被吸住、被擊退時（位置一格移動超過 3px）先不推，等 40 格（約 0.7 秒）不再被拉才恢復——吸怪招式結束後才會散開 */
  let sepT = -1;
  function separate() { const L = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.bb && !e.boss && !e.wo && !(e.delay > 0)); if (L.length < 2 || L.length > 40) { for (const e of L) e._px = e.x; return; }
    const ak = H.act && H.act.kind, casting = ak && !['atk', 'dash', 'dodge', 'guard', 'hurt'].includes(ak);   /* 主角放招中（含吸怪招）→ 全部先不推，招式結束 0.5 秒後才散開 */
    for (const e of L) { if (casting) e.sepOff = Math.max(e.sepOff || 0, 30); else if (e._px !== undefined && Math.abs(e.x - e._px) > 3) e.sepOff = 40; else if (e.sepOff > 0) e.sepOff--; }
    for (let i = 0; i < L.length; i++) { const a = L[i]; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (a.sepOff > 0 || b.sepOff > 0) continue;
      const dy = b.y - a.y; if (Math.abs(dy) > 22) continue; const s = SC.depth((a.y + b.y) / 2), need = (G.bodyX(a) + G.bodyX(b)) * 0.6 + 46 * s * Math.min(1.3, (a.ratio + b.ratio) / 2 / 1.2), dx = b.x - a.x, ad = Math.abs(dx);
      if (ad >= need) continue; const sg = dx ? Math.sign(dx) : (i % 2 ? 1 : -1), p = Math.min(0.9, (need - ad) * 0.08);
      if (SC.walkable(a.x - sg * p, a.y)) a.x -= sg * p; if (SC.walkable(b.x + sg * p, b.y)) b.x += sg * p;
      if (ad < need * 0.35) { const py = (dy ? Math.sign(dy) : sg) * 0.4; if (SC.walkable(a.x, a.y - py)) a.y -= py; if (SC.walkable(b.x, b.y + py)) b.y += py; } } }
    for (const e of L) e._px = e.x; }
  (function hkSep() { if (!G.oniStep) return setTimeout(hkSep, 50); const os = G.oniStep; G.oniStep = function (e) { if (sepT !== G.t) { sepT = G.t; try { separate(); } catch (x) { console.warn('sep', x); } } return os.apply(this, arguments); }; })();
})();
