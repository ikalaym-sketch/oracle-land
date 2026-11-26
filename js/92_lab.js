/* ==========================================================================
 * 神諭之地 重製版 — 92_lab.js
 * Version : r3.49.0  (2026-11-18)　r3.49.0：六把武器新版招式正式開放（不再需要測試開關，試做面板移除）
 * 舊版    : r3.48.0  (2026-11-18)　r3.48.0：第五、六組薙刀＋槍（沿用原本刀光／突刺，只換命中色；燕舞 Lv5 回氣、立架截飛 Lv5 反射、旋風薙 Lv5 先擊退後拉回、架勢拒進改平順頂住；秘傳 10 招重做）
 * 舊版    : r3.47.1  (2026-11-18)　r3.47.1：打刀／野太刀刀光改回原本程式刀幕（素材刀弧比例不對），其餘修正保留
 * 舊版    : r3.47.0  (2026-11-18)　r3.47.0：第四組野太刀（素材刀弧、赤金刀痕、地裂／揚塵／碎石素材、斬鐵 Lv5 對頭目＋50%、破守 Lv5 持續加倍、秘傳 5 招）
 * 舊版    : r3.46.0  (2026-11-18)　r3.46.0：第三組打刀（素材刀弧、銀藍刀痕、擊刀格出招、一閃 2H、燕返 Lv5 再一次燕返、翻潮 Lv5 拉回修正、反擊技只在被打時出手、秘傳 5 招）
 * 舊版    : r3.45.2  (2026-11-18)　r3.45.1：鉛雨改曳光鉛彈雨；雷筒改天降連鎖落雷；天羽羽矢改飄落羽毛＋細白光多段斬
 * 舊版    : r3.45.0  (2026-11-18)　r3.45.0：第二組鐵砲（擊發格開槍、短曳光、橙色火星、素材槍口煙／爆炸／燃燒／準星、補 Lv 效果、秘傳 5 招重做）
 * 舊版    : r3.44.3  (2026-11-18)　r3.44.3：追蹤箭不放慢、命中停頓縮短；秘傳：流星群落地小爆炸＋收尾火焰爆炸、天羽羽矢羽刃攻擊、破魔矢天降一箭＋傷害法陣、月影旋轉月牙彈射
 * 舊版    : r3.44.2  (2026-11-18)　r3.44.2：和弓秘傳改用素材重做（光弧箭雨、準星、光柱、羽毛、神社法陣、月牙）、收尾不再多一支箭；修正秘傳人物縮小；低退改貼地平射
 * 舊版    : r3.44.1  (2026-11-18)　r3.44.1：和弓修正——放箭對齊人物放弦格、弓弦光縮小、追魂矢改細鬼火、後跳／側移位移縮小、秘傳重做（三段動畫串接，一段一重點）
 * 舊版    : r3.44.0  (2026-11-18)
 * 變更    : r3.44.0 新增。招式試做室（依 MOVE_AUDIT v1.1 比例原則，一組一組先試做，確認後才正式改進遊戲）。
 *           ・選單→測試→開關→「招式試做」打開；畫面右側出現試做面板，可切「新版／舊版」對照、技能等級 1／3／5、放靶、逐招播放。
 *           ・關閉時完全不影響遊戲（所有改動只在試做開啟且裝備該武器時生效）。
 *           ・第一組：和弓。
 *             共通：箭改用素材並放大、飛行變慢（看得到箭飛過去）、拖尾只留短殘影；命中改金色穿刺光（不再白光）；
 *                   插在敵人身上的箭改用素材箭；拿掉普攻放箭時疊在弓上的氣焰；震屏上限：一般 1、秘傳／奧義 3；
 *                   畫面變暗與全畫面閃白只留給秘傳／奧義。
 *             招式／技能：速射兩箭間隔 0.15 秒；三連矢每箭 0.2 秒；壓弦拒進被擊退的敵人腳下拖塵；
 *                   追魂矢拿掉大團光球，改藍色鬼火拖尾；天弓改真的朝天射一箭＋落點預示圈；
 *                   移步回射改後跳（騰空）射擊；標位貫矢 Lv5 標記轉移（實作）；凝神追點弓上顯示剩餘追蹤箭數；
 *                   秘傳拿掉共用金色地面環，改弓弦金光起手。
 * 依賴    : 76_vfx、77_moves、78_mv_ranged、81_hiden、83_skills、85_normal、86_fx2、14_cheat（G.CHEAT.on.lab）。
 * ========================================================================== */
'use strict';
(function () {
  const VX = G.VX, MV2 = G.MV2, W = G.WPN, H = G.H, SC = G.SC; if (!VX || !MV2 || !W) return;
  const HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  const LAB = G.LAB = { neu: true, lv: 5, last: null };
  const labOn = () => true;   /* r3.49.0：正式開放 */
  const on = wid => labOn() && LAB.neu && W.curId() === (wid || W.curId()) && DONE.includes(W.curId());
  const DONE = ['yumi', 'teppo', 'katana', 'nodachi', 'naginata', 'yari'];
  const big = () => { const a = H.act; return !!(a && a.mvx && (a.mvx.hiden || (a.mvx.def && a.mvx.def.kind === 'ult'))); };
  const PAL = { yumi: { c: '255,214,140', c2: '255,244,214' }, teppo: { c: '255,160,70', c2: '255,226,170' }, katana: { c: '170,210,255', c2: '230,242,255' }, nodachi: { c: '255,185,100', c2: '255,232,185' }, naginata: { c: '150,235,205', c2: '225,255,245' }, yari: { c: '190,215,255', c2: '240,246,255' } };

  /* ---------- 素材上色（白色素材 × 武器色） ---------- */
  const TC = {}, REFY = 600;
  function tint(n, fi, col) { const key = n + '|' + fi + '|' + col; if (TC[key]) return TC[key];
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const k0 = HH() * S(REFY);
    if (!VX.draw2(g, n, fi, 256, 256, 1, { sy0: REFY })) return null;
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(' + col + ')'; g.fillRect(0, 0, 512, 512);
    g.globalCompositeOperation = 'destination-in'; VX.draw2(g, n, fi, 256, 256, 1, { sy0: REFY });
    return (TC[key] = { c, k0 }); }
  function tspr(n, o) { const nf = VX.frames2(n); if (!nf) return; const life = o.life || 10;
    VX.custom((q, ctx) => { const fi = Math.min(nf - 1, Math.floor(q.t / life * nf)), T = tint(n, fi, o.col); if (!T) return; const s = S(o.y), sc = HH() * s * (o.k || 1) / T.k0, a = Math.min(1, (q.life - q.t) / 4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (o.a || 1); ctx.translate(o.x, o.y - (o.z || 0) * HH() * s); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
      ctx.drawImage(T.c, -256 * sc, -256 * sc, 512 * sc, 512 * sc); ctx.restore(); }, life, 'o'); }

  /* ---------- 命中：武器色、輕停頓、少震屏 ---------- */
  const imp0 = VX.impact;
  VX.impact = function (e, lv, kind, ang, col) { const wid = W.curId(); if (!on() || !PAL[wid]) return imp0.apply(this, arguments);
    const P = PAL[wid], s = S(e.y), z = (e.ratio || 1) * 0.5, hv = lv === 'heavy' || lv === 'hiden';
    G.hitstop = Math.max(G.hitstop, lv === 'light' ? 0 : hv ? 2 : 1); e.flash = 2; e._vxf = G.playT;
    if (hv) SC.shake = Math.max(SC.shake || 0, lv === 'hiden' ? 2 : 1);
    const c = col && kind !== 'arrow' ? col : (col || P.c), f = H.face;
    if ((kind === 'cut' || kind === 'pierce' || kind === 'blunt') && /^(katana|nodachi|naginata|yari)$/.test(wid)) return imp0.call(this, e, lv, kind, ang, P.c);   /* 近戰：原本命中效果，只換武器色 */
    if (kind === 'cut') { tspr('fx_hit_cut', { x: e.x, y: e.y, z, k: lv === 'light' ? 0.55 : lv === 'hiden' ? 0.95 : hv ? 0.8 : 0.65, col: c, rot: rnd(-0.4, 0.4), flip: f < 0, life: 10 }); }
    else if (kind === 'blunt') { tspr('fx_hit_blunt', { x: e.x, y: e.y, z, k: hv ? 0.9 : 0.7, col: c, life: 12 }); }
    else tspr('fx_hit_pierce', { x: e.x, y: e.y, z, k: lv === 'light' ? 0.5 : lv === 'hiden' ? 0.9 : hv ? 0.7 : 0.6, col: c, flip: f < 0, life: 10 });
    VX.spark({ x: e.x, y: e.y, z: z * HH() * s, n: hv ? 4 : 2, ang: f > 0 ? 0 : Math.PI, spread: 0.6, spd: 4, col: P.c2 }); };

  /* ---------- 箭：素材、放大、變慢、短拖尾 ---------- */
  const shot0 = VX.shot;
  VX.shot = function (o) { if (on('yumi') && (o.k === 'arrow' || o.k === 'bigarrow') && !o.grav) { const f = o.home ? 0.8 : o.k === 'bigarrow' ? 0.55 : 0.45; /* 追蹤箭不放慢，免得繞圈像定格 */ o.vx *= f; o.vy *= f; o.trail = Math.min(o.trail || 3, 3); if (!o.col) o.col = PAL.yumi.c; } return shot0.apply(this, arguments); };
  const ar0 = VX.arrow2;
  VX.arrow2 = function (ctx, L, col, bg) { if (!on('yumi')) return ar0.call(this, ctx, L, col, bg);   // 素材箭 67×4 太細：拉長＋加粗＋淡金光暈，遠景也看得到
    const L2 = L * (bg ? 1.3 : 1.6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(-L2, 0, 0, 0); g.addColorStop(0, 'rgba(' + (col || Y) + ',0)'); g.addColorStop(1, 'rgba(' + (col || Y) + ',.35)');
    ctx.fillStyle = g; ctx.fillRect(-L2, -L2 * 0.05, L2, L2 * 0.1); ctx.restore(); ctx.save(); ctx.scale(1, 1.8); const r = ar0.call(this, ctx, L2, col, bg); ctx.restore(); return r; };
  /* 插在敵人身上的箭：素材箭（箭尖沒入身體），停 0.6 秒後淡出 */
  function stuckDraw(o, ctx) { const e = o.e; if (!e || e.st === 'dead' || e.alpha <= 0) { o.t = o.life; return; } const s = S(e.y), L = HH() * s * (o.big ? 0.6 : 0.42) * 1.3;
    ctx.save(); ctx.globalAlpha = Math.min(1, (o.life - o.t) / 10); ctx.translate(e.x + o.ox, e.y - o.oz); ctx.rotate(o.ang + Math.sin(o.t * 0.6) * 0.04 * Math.max(0, 1 - o.t / 10)); ctx.translate(L * 0.3, 0);
    ctx.beginPath(); ctx.rect(-L * 1.2, -L, L * 0.9, L * 2); ctx.clip(); ctx.scale(1, 1.8); ar0.call(VX, ctx, L * 1.2, o.col || '', o.big); ctx.restore(); }
  /* ---------- 震屏／變暗／閃白上限 ---------- */
  const dim0 = VX.dim, fl0 = VX.flash;
  VX.dim = function () { if (on() && !big()) return; return dim0.apply(this, arguments); };
  VX.flash = function () { if (on() && !big()) return; return fl0.apply(this, arguments); };
  const fs0 = G.fxStep; G.fxStep = function () { fs0.apply(this, arguments); if (!on()) return;
    SC.shake = Math.min(SC.shake || 0, big() ? 3 : 1);
    for (const o of VX.L) if (o.k === 'stuck') { if (o.big) { o.t = o.life; continue; } const e = o.e, lim = HH() * S(e.y) * 0.12 * (e.ratio || 1); o.ox = Math.max(-lim, Math.min(lim, o.ox)); o.k = 'fn'; o.draw = stuckDraw; o.life = 36; o.l = 'o'; } };   // 重箭貫穿不插身；插身位置限制在身體範圍
  /* 後跳：主角畫高 */
  const dh0 = G.drawHero; G.drawHero = function () { if (!LAB.jz) return dh0.apply(this, arguments); const c = G.ctx; c.save(); c.translate(0, -LAB.jz); try { return dh0.apply(this, arguments); } finally { c.restore(); } };

  /* ================= 和弓 ================= */
  const Y = PAL.yumi.c, Y2 = PAL.yumi.c2, TK = 1000 / 60, AN = G.ANIM;
  /* 放箭時機：對齊人物動畫「放弦」那一格（動畫第 4 格；整段動畫會依招式長度 T 等比縮放） */
  const cum = (r, n) => { let s = 0; for (let i = 0; i < Math.min(n, r.f.length); i++) s += r.f[i][6]; return s; };
  const REL = c => { const a = c.a, r = a.r; if (!r || !r.f || r.f.length < 4) return Math.round(a.T * 0.55); if (a._comp) return a._comp.rel[0]; return Math.max(2, Math.round(a.T * cum(r, 3) / AN.dur(r))); };
  /* 弓弦微光：小、短，不再是一團光 */
  const string = (c, life) => { const mz = W.muzzle && W.muzzle(); const x = mz ? mz[0] : c.x + c.f * 0.42 * c.hh, y = mz ? mz[1] : c.y - 0.64 * c.hh, n = life || 6;
    VX.custom((o, ctx) => { const s = S(c.y), a = 1 - o.t / o.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, 5 * s); g.addColorStop(0, 'rgba(' + Y2 + ',' + 0.7 * a + ')'); g.addColorStop(1, 'rgba(' + Y + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5 * s, 0, TAU); ctx.fill(); ctx.restore(); }, n, 'o'); };
  const arw = (c, o) => c.shoot(o.k || 'arrow', Object.assign({ spd: 0.42, range: 9, lv: 'mid', col: Y, from: c.a.r && !(W.muzzle && W.muzzle()) ? [0.42, 0.64] : undefined }, o));
  const dust = e => { let n = 0; VX.custom(() => { if (++n % 3 === 0 && e.st !== 'dead') VX.smoke({ x: e.x, y: e.y, z: 2, n: 1, r: 0.1, life: 20, a: 0.3, col: '170,155,135' }); }, 14, 'o'); };
  const near = (c, r) => MV2.near(c, r);
  /* --- 普攻（放箭時機沿用原本動畫事件） --- */
  const at = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? e.at : 8; }, dm = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? (e.m || 1) : 1; };
  const NY = [
    { run(c, t) { if (t === at(c)) { string(c); arw(c, { m: dm(c), spd: 0.45, range: 9 }); } } },
    { run(c, t) { if (t === at(c)) { string(c); arw(c, { m: dm(c), spd: 0.45, range: 9, ang: -0.03 }); } } },
    { run(c, t) { if (t === at(c)) { string(c, 8); arw(c, { k: 'bigarrow', m: dm(c), spd: 0.6, range: 11, pierce: 3, lv: 'heavy', kb: 0.8 }); c.move(-0.04, 0); } } }];
  /* --- 招式（12）：全部在放弦格出箭；位移量縮小 --- */
  const MY = {
    moving_shot: { run(c, t) { const R = REL(c); if (t <= R) c.move(0, (G.IN.my || 0.6) * 0.04); if (t === 3) c.ghost(8); if (t === R) { string(c); arw(c, { m: 1.0 }); } } },
    quick_shot: { run(c, t) { const R = REL(c); if (t === R || t === R + 6) { string(c); arw(c, { m: 0.7, ang: t === R ? -0.02 : 0.02 }); } } },
    covered_step: { run(c, t) { if (t === 1) c.a.mvx.hit = 1; if (t <= 12) c.move(-0.06, 0); if (t === 4 || t === 9) c.ghost(8); } },
    follow_shot: { run(c, t) { if (t === REL(c)) { string(c); arw(c, { m: 1.25, col: '150,200,255', home: near(c, 9), turn: 0.12, trail: 3 }); } } },
    fan_release: { run(c, t) { if (t === REL(c)) { string(c); for (let i = -1; i <= 1; i++) arw(c, { m: 0.75, ang: i * 0.2 }); } } },
    spread_shot: { run(c, t) { if (t === REL(c)) { string(c); for (let i = -2; i <= 2; i++) arw(c, { m: 0.5, ang: i * 0.18, range: 4, spd: 0.5 }); } } },
    piercing_shot: { run(c, t) { if (t === REL(c)) { string(c, 8); arw(c, { k: 'bigarrow', m: 1.6, pierce: 6, range: 11, spd: 0.55, def: 15, lv: 'mid' }); } } },
    full_aim: { run(c, t) { const R = REL(c); if (t > 2 && t < R && t % 5 === 0) string(c, 6); if (t === R) { arw(c, { k: 'bigarrow', m: 2.4, pierce: 3, range: 12, spd: 0.7, lv: 'heavy' }); c.move(-0.1, 0); } } },
    denial_shot: { run(c, t) { if (t === REL(c)) { string(c); arw(c, { m: 1.0, kb: 2.4, lv: 'mid', onHit: e => dust(e) }); } } },
    lower_retreat: { run(c, t) { const R = REL(c); if (t === 1) c.a.mvx.hit = 1; if (t <= 12) c.move(-0.05, 0);   // 低退：蹲低後撤，貼地平射敵人腳下（中箭緩速）
        if (t === R) { string(c); arw(c, { m: 1.0, from: [0.45, 0.28], onHit: e => { e.db = e.db || {}; e.db.slow = 40; e.db.slowT = 120; dust(e); } }); } } } };
  /* --- 技能 --- */
  const LVc = c => c.a.mvx.lv || 1;
  const UY = {
    skill_sanrenya: { T: 40, run(c, t) { const lv = LVc(c), n = 3 + (lv >= 3 ? 2 : 0), R = REL(c), g = n > 3 ? 3 : 5;
        for (let i = 0; i < n; i++) if (t === R + i * g) { const last = lv >= 5 && i === n - 1; string(c, 4); arw(c, { m: 0.8, ang: (i - (n - 1) / 2) * 0.015, pierce: last ? 9 : 1, k: last ? 'bigarrow' : 'arrow', lv: last ? 'heavy' : 'mid' }); } } },
    skill_tenkyu: { T: 140, run(c, t) { const lv = LVc(c), m = c.a.mvx, dur = lv >= 3 ? 180 : 120; if (t === 1) c.a.T = 24 + dur; const R = Math.min(REL(c), 14);
        if (t === R) { string(c); const e = near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * c.hh, c.y]; const mz = W.muzzle && W.muzzle(), x0 = mz ? mz[0] : c.x + c.f * 0.4 * c.hh, y0 = mz ? mz[1] : c.y - 0.64 * c.hh, f = c.f;
          VX.custom((o, ctx) => { const k = HH() * S(c.y); ctx.save(); ctx.translate(x0 + f * o.t * 0.02 * k, y0 - o.t * 0.5 * k); ctx.rotate(-Math.PI / 2 + f * 0.12); ctx.globalAlpha = Math.min(1, (o.life - o.t) / 4); ctx.scale(1, 1.8); ar0.call(VX, ctx, k * 0.6, Y, false); ctx.restore(); }, 12, 'o'); }
        if (t === R + 10) { const P = m.p; VX.custom((o, ctx) => { const p = lv >= 5 ? m.p : P, s = S(p[1]), k = HH() * s, a = Math.min(1, o.t / 10, (o.life - o.t) / 12); ctx.save(); ctx.strokeStyle = 'rgba(' + Y + ',' + 0.45 * a + ')'; ctx.lineWidth = 1.5 * s; ctx.setLineDash([5 * s, 4 * s]); ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.35 * k, 0.5 * k, 0, 0, TAU); ctx.stroke(); ctx.restore(); }, dur + 6, 'g'); }
        if (t >= R + 14 && t < R + 14 + dur && (t - R) % 15 === 0) { if (lv >= 5) { const e = near(c, 9); if (e) m.p = [e.x, e.y]; } const [px, py] = m.p, a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 1.3 * c.hh, x = px + Math.cos(a) * r, y = py + Math.sin(a) * r * 0.4; MV2.fallArrow(c, x, y, { col: Y, h: rnd(4, 5.5), dx: -c.f * rnd(0.3, 0.7), life: 12, r: 0.7, m: 0.6 }); } } },
    skill_tsuikon: { T: 32, run(c, t) { const lv = LVc(c); if (t === REL(c)) { string(c); const e = near(c, 10), p = arw(c, { m: 1.6, col: '150,195,255', home: e, turn: 0.16, trail: 2, lv: 'mid', onHit: q => { if (lv >= 5) { q.db = q.db || {}; q.db.mark = 20; q.db.markT = 300; } } });
          VX.custom((o, ctx) => { if (p.dead) { o.t = o.life; return; } const s = S(p.y), d = Math.sign(p.vx) || 1; ctx.save(); ctx.globalCompositeOperation = 'lighter';   // 細藍鬼火：箭尾 2 顆小火點
            for (let i = 0; i < 2; i++) { const x = p.x - d * (i * 6 + 10) * s, y = p.y - p.z + Math.sin(o.t * 0.7 + i * 2) * 2 * s; ctx.fillStyle = 'rgba(160,205,255,' + (0.5 - i * 0.2) + ')'; ctx.beginPath(); ctx.arc(x, y, (2.2 - i * 0.7) * s, 0, TAU); ctx.fill(); } ctx.restore(); }, 80, 'o'); } } },
    special_backshot: { T: 36, run(c, t) { const lv = LVc(c), D = lv >= 3 ? 1.1 : 0.8, R = REL(c);   // 後跳：0.8H（Lv3 1.1H），跳高 0.3H
        if (t <= 16) { c.move(-D / 16, 0); H.hop = Math.sin(t / 16 * Math.PI) * 0.3 * HH() * S(H.y); } if (t === 17) H.hop = 0; if (lv >= 5 && t < 16) c.inv(4); if (lv >= 5 && (t === 5 || t === 11)) c.ghost(8);
        if (t === R || t === R + 6) { string(c); arw(c, { m: 1.0, ang: t === R ? 0.02 : -0.02 }); } } },
    special_fan: { T: 32, run(c, t) { const lv = LVc(c), n = 5 + (lv >= 3 ? 2 : 0); if (t === REL(c)) { string(c, 8); for (let i = 0; i < n; i++) arw(c, { m: 0.7, ang: (i - (n - 1) / 2) * (0.9 / (n - 1)), kb: lv >= 5 ? 0.8 : 0, onHit: lv >= 5 ? dust : undefined }); } } },
    special_marked: { T: 32, run(c, t) { const lv = LVc(c); if (t === 4) { let e = near(c, 10); if (!e) return; c.a.mvx.e = e; const pct = lv >= 3 ? 25 : 15; c.a.mvx.hit = 1;
          const put = q => { q.db = q.db || {}; q.db.mark = pct; q.db.markT = 300; }; put(e); let left = 300;
          VX.custom((o, ctx) => { left--; if (e.st === 'dead' || e.hp <= 0) { const n2 = lv >= 5 && G.E.filter(q => q.st !== 'dead' && q.hp > 0 && q !== e).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0]; if (n2) { put(n2); n2.db.markT = left; e = n2; } else { o.t = o.life; return; } }
            const s = S(e.y), k = HH() * s, y = e.y - k * (e.ratio || 1) * 1.15, a = Math.min(1, o.t / 6); ctx.save(); ctx.translate(e.x, y); ctx.rotate(o.t * 0.04); ctx.strokeStyle = 'rgba(255,110,90,' + 0.85 * a + ')'; ctx.lineWidth = 1.6 * s;
            ctx.beginPath(); ctx.arc(0, 0, k * 0.12, 0, TAU); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.rotate(1.5708); ctx.beginPath(); ctx.moveTo(k * 0.08, 0); ctx.lineTo(k * 0.18, 0); ctx.stroke(); } ctx.restore(); }, 300, 'o'); }
        if (t === REL(c) && c.a.mvx.e) { string(c); arw(c, { m: 1.0, home: c.a.mvx.e, turn: 0.2 }); } } },
    special_tracking: { T: 30, run(c, t) { const lv = LVc(c); if (t === 2) { c.a.mvx.hit = 1; G.BUFF.add('home', lv >= 3 ? 5 : 3, 600); string(c, 12); } } } };
  /* 凝神追點：弓旁顯示剩餘追蹤箭（小藍點） */
  (function hud() { const draw0 = G.drawHero; G.drawHero = function () { const r = draw0.apply(this, arguments); if (!on('yumi')) return r; const n = G.BUFF.get ? G.BUFF.get('home') : 0; if (n > 0) { const c = G.ctx, s = S(H.y), k = HH() * s, x = H.x + H.face * 0.3 * k, y = H.y - 0.9 * k;
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const a = G.t * 0.05 + i * TAU / n; c.fillStyle = 'rgba(150,200,255,.75)'; c.beginPath(); c.arc(x + Math.cos(a) * 0.14 * k, y + Math.sin(a) * 0.06 * k, 1.6 * s, 0, TAU); c.fill(); } c.restore(); } return r; }; })();

  /* --- 秘傳：照口訣把三段招式的人物動畫串成一段，每段在自己的放弦格出箭；一段一個重點，不堆特效 --- */
  function comp(seq) { const u = W.unit(), A = u && u.act; if (!A) return null; const MAP = { quick_shot: 'moving_shot', fan_release: 'special_fan', spread_shot: 'special_fan', follow_shot: 'piercing_shot', mark_aim: 'special_marked', full_aim: 'piercing_shot', steady_focus: 'special_tracking', lower_retreat: 'covered_step', back_turn: 'side_path', falling_ridge: 'planted_break' };
    const f = [], rel = [], st = [], nm = [], seg = [], SP = 0.8; let ms = 0;   // 串接後整體加速 20%，不拖沓
    for (const n of seq) { const k = A[n] ? n : A[MAP[n]] ? MAP[n] : 'normal_1', r = A[k]; nm.push(k); seg.push(r); st.push(Math.round(ms * SP / TK)); rel.push(Math.round((ms + cum(r, 3)) * SP / TK)); for (const q of r.f) f.push(q); ms += AN.dur(r); }
    const T = Math.round(ms * SP / TK) + 8, q = T * TK / ms / SP; return { r: { f, loop: false }, rel: rel.map(v => Math.round(v * q)), st: st.map(v => Math.round(v * q)), nm, seg, T }; }
  /* 串接動畫時：人物比例、弓手錨點都依「目前這一段」原本的動作計算（修正放秘傳時人物縮小） */
  const segOf = (a, t) => { const C = a._comp; let i = 0; while (i < C.st.length - 1 && t >= C.st[i + 1]) i++; return i; };
  const mz0 = W.muzzle; W.muzzle = function () { const a = H.act; if (!a || !a._comp) return mz0.apply(this, arguments); const C = a._comp, i = segOf(a, H.t), r0 = a.r, n0 = a.name; a.r = C.seg[i]; a.name = C.nm[i];
    const fr = G.heroFrame(), j = C.r.f.indexOf(fr); let off = 0; for (let k = 0; k < i; k++) off += C.seg[k].f.length; const keep = G.heroFrame; G.heroFrame = () => C.seg[i].f[Math.max(0, Math.min(C.seg[i].f.length - 1, j - off))];
    try { return mz0.apply(this, arguments); } finally { G.heroFrame = keep; a.r = r0; a.name = n0; } };
  const ak0 = W.actK; W.actK = function (n) { const a = H.act; if (a && a._comp && n === a.name) return ak0.call(this, a._comp.nm[segOf(a, H.t)]); return ak0.apply(this, arguments); };
  /* 素材小工具 */
  const feathers = (x, y, n, sp) => { for (let i = 0; i < n; i++) { let px = x + rnd(-0.3, 0.3) * HH() * S(y), pz = rnd(0.5, 1.0), vx = rnd(-0.6, 0.6) * (sp || 1), rot = rnd(0, TAU), vr = rnd(-0.06, 0.06);
      VX.custom((o, ctx) => { const s = S(y), k = HH() * s; px += vx * s; pz = Math.max(0.05, pz - 0.012); rot += vr; VX.draw2(ctx, 'obj_feather_white', 0, px, y - pz * k + Math.sin(o.t * 0.12 + i) * 3 * s, 1.1, { rot, a: Math.min(1, (o.life - o.t) / 12) }); }, rnd(36, 52), 'o'); } };
  const upArrow = c => { const mz = W.muzzle && W.muzzle(), x0 = mz ? mz[0] : c.x + c.f * 0.4 * c.hh, y0 = mz ? mz[1] : c.y - 0.64 * c.hh, f = c.f;
    VX.custom((o, ctx) => { const k = HH() * S(c.y); ctx.save(); ctx.translate(x0 + f * o.t * 0.03 * k, y0 - o.t * 0.55 * k); ctx.rotate(-Math.PI / 2 + f * 0.15); ctx.globalAlpha = Math.min(1, (o.life - o.t) / 4); ctx.scale(1, 1.8); ar0.call(VX, ctx, k * 0.6, Y, false); ctx.restore(); }, 12, 'o'); };
  const lockOn = (e, life) => VX.s2('fx_mark', { fx: () => [e.x, e.y], z: (e.ratio || 1) * 0.55, k: 0.42 * Math.min(1.6, e.ratio || 1), life: 8, hold: life, add: 1, a: 0.9 });
  const near3 = (c, n) => G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.bb && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < 9 * c.hh).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, n);
  /* fx_common 素材（月牙）旋轉繪製 */
  const drawFC = (ctx, n, fi, x, y, w, rot, a, flip) => { const u = AN.get('fx_common'); if (!u || !u.fx || !u.fx[n]) return; const r = u.fx[n], fr = r.f[Math.min(r.f.length - 1, fi)], k = HH() * S(y), sc = w * k / fr[2];
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(rot); AN.draw(u, fr, 0, 0, sc, !!flip, a); ctx.restore(); };
  /* 羽毛飛刃（素材羽毛當投射物）：沿弧線飛向目標，命中造成傷害 */
  function featherShot(c, e, o) { const s0 = S(c.y), k0 = HH() * s0, mz = W.muzzle && W.muzzle(); let x = mz ? mz[0] : c.x + c.f * 0.4 * k0, y = c.y, z = mz ? c.y - mz[1] : 0.64 * k0;
    const a0 = o.ang || 0, sp = (o.spd || 0.32) * k0; let vx = Math.cos(a0) * sp * c.f, vy = Math.sin(a0) * sp * 0.6, vz = o.vz || 0, done = false, hitList = [];
    VX.custom((q, ctx) => { if (done) { q.t = q.life; return; } const s = S(y), ang = Math.atan2(vy * 0.6 - vz, vx); VX.draw2(ctx, 'obj_feather_white', 0, x, y - z, 1.6, { rot: ang + Math.PI * 0.75 + Math.sin(q.t * 0.4) * 0.15 });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - z, 0, x, y - z, 7 * s); g.addColorStop(0, 'rgba(' + Y2 + ',.5)'); g.addColorStop(1, 'rgba(' + Y + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - z, 7 * s, 0, TAU); ctx.fill(); ctx.restore(); }, o.life || 70, 'o',
      { step: (q, tt) => { if (done) return; const tg = e && e.st !== 'dead' && e.hp > 0 ? e : null; if (tg && tt > (o.delay || 4)) { const dx = tg.x - x, dy = tg.y - y, d = Math.hypot(dx, dy) || 1, s2 = Math.hypot(vx, vy) * 1.02 + 0.06; vx += (dx / d * s2 - vx) * 0.22; vy += (dy / d * s2 - vy) * 0.22; }
          const tz = tg ? (tg.ratio || 1) * 0.5 * HH() * S(tg.y) : z; vz += (z - tz) * -0.02; z = Math.max(4, z + vz * 0.5); vz *= 0.9; x += vx; y += vy;
          for (const q2 of G.E) { if (q2.st === 'dead' || q2.hp <= 0 || hitList.includes(q2)) continue; if (Math.abs(q2.x - x) < 16 * (q2.ratio || 1) && Math.abs(q2.y - y) < 20 * S(q2.y) * (q2.ratio || 1)) { hitList.push(q2); G.damageOni(q2, (o.m || 0.3) * c.mul, false, false); VX.impact(q2, 'light', 'arrow'); c.a.mvx.hit = 1; if (o.on) o.on(q2); done = true; break; } } } }); }
  /* 旋轉月牙：在命中點旋轉，再依序彈向附近敵人 */
  function crescent(c, e, n) { const seen = [e]; let cur = e, x = e.x, y = e.y, z = (e.ratio || 1) * 0.55, tx = x, ty = y, mv = 0, hopT = 0, left = n, sp = 0;
    VX.custom((q, ctx) => { sp += 0.45; drawFC(ctx, 'skill_wind_blade_a', Math.floor(q.t / 3) % 4, x, y - z * HH() * S(y), 0.9, sp, Math.min(1, (q.life - q.t) / 8) * 0.95, c.f < 0); }, 26 + n * 14, 'o',
      { step: (q, tt) => { if (tt === 2) { G.damageOni(cur, 0.7 * c.mul, false, false); VX.impact(cur, 'mid', 'cut', undefined, '200,220,255'); c.a.mvx.hit = 1; }
          if (mv > 0) { x += (tx - x) / mv; y += (ty - y) / mv; mv--; if (mv === 0 && cur.st !== 'dead') { G.damageOni(cur, 0.7 * c.mul, false, false); VX.impact(cur, 'mid', 'cut', undefined, '200,220,255'); } return; }
          if (++hopT >= 12 && left > 0) { hopT = 0; const nx = G.E.filter(q2 => q2.st !== 'dead' && q2.hp > 0 && !seen.includes(q2) && Math.hypot(q2.x - x, (q2.y - y) * 1.6) < 3.2 * HH() * S(y)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
            if (!nx) { left = 0; q.life = Math.min(q.life, q.t + 10); return; } seen.push(nx); cur = nx; tx = nx.x; ty = nx.y; mv = 8; left--; } } }); }
  /* 飄落羽毛（素材）：從上方左右擺盪落下 */
  const featherFall = (x, y) => { const z0 = rnd(1.4, 2.3), ph = rnd(0, TAU), sp = rnd(0.018, 0.026), big = rnd(1.1, 1.6); let z = z0;
    VX.custom((o, ctx) => { const s = S(y), k = HH() * s; z = Math.max(0, z - sp); const sw = Math.sin(o.t * 0.08 + ph), a = Math.min(1, o.t / 8, (o.life - o.t) / 14);
      VX.draw2(ctx, 'obj_feather_white', 0, x + sw * 0.25 * k, y - z * k, big, { rot: 0.5 + sw * 0.45, a: a * 0.95 }); }, Math.round(z0 / 0.022) + 10, 'o'); };
  /* 細白光斬擊：細線穿過敵人身上，快閃 */
  const whiteCut = e => { const an = rnd(-1.2, 1.2), s0 = S(e.y), L = HH() * s0 * 1.1 * Math.min(1.6, e.ratio || 1), cx = e.x + rnd(-0.1, 0.1) * HH() * s0, cy = e.y - (e.ratio || 1) * rnd(0.35, 0.75) * HH() * s0;
    VX.custom((o, ctx) => { const a = 1 - o.t / o.life, s = S(e.y), w = 1.6 * s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.rotate(an);
      const g = ctx.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'rgba(255,250,235,0)'); g.addColorStop(0.5, 'rgba(255,252,245,' + a + ')'); g.addColorStop(1, 'rgba(255,250,235,0)'); ctx.fillStyle = g; ctx.fillRect(-L / 2, -w / 2, L, w); ctx.restore(); }, 8, 'o'); };
  const HY = {
    /* 流星群：朝天連射 → 箭雨落下，每支落地小爆炸 → 收尾一記火焰爆炸，地面燃燒 */
    m_ryusei: ['quick_shot', 'fan_release', 'full_aim', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === 2) { const e = near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; }
      if (t === r1 || t === r1 + 5 || t === r2 || t === r3) { string(c); upArrow(c); }
      if (t > r1 + 10 && t < r3 + 6 && t % 4 === 0) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 1.4 * k, x = m.p[0] + Math.cos(a) * r, y = m.p[1] + Math.sin(a) * r * 0.4;
        MV2.fallArrow(c, x, y, { col: '255,170,90', h: rnd(4, 5.5), dx: -c.f * rnd(0.3, 0.6), life: 10, r: 0.6, m: 0.25, on: (x2, y2) => VX.s2('fx_blast', { x: x2, y: y2, k: 0.4, life: 18 }) }); }
      if (t === r3) c.later(14, () => { const [px, py] = m.p; VX.s2('fx_blast', { x: px, y: py, k: 1.1, life: 26 }); VX.burn2({ x: px, y: py, r: 1.1, life: 90 }); SC.shake = Math.max(SC.shake || 0, 2);
        c.hit({ shape: 'circle', x: px, y: py, r: 1.6, m: 1.4, lv: 'hiden', kind: 'blunt', col: '255,170,90' });
        VX.custom(() => {}, 90, 'g', { step: (q, tt) => { if (tt % 20 === 10) c.hit({ shape: 'circle', x: px, y: py, r: 1.2, m: 0.2, lv: 'light', kind: 'blunt', col: '255,150,80' }); } }); }); }],
    /* 天羽羽矢：準星鎖 3 隻 → 朝天一箭，敵群上空飄落大量羽毛 → 細白光多段斬擊被鎖定者 */
    m_amenoha: ['mark_aim', 'follow_shot', 'piercing_shot', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === r1) { m.es = near3(c, 3); m.es.forEach(e => { e.db = e.db || {}; e.db.mark = 20; e.db.markT = 300; lockOn(e, r3 + 40 - r1); }); }
      if (t === r2) { string(c); upArrow(c); const es = m.es && m.es.length ? m.es : null, cx = es ? es.reduce((a, e) => a + e.x, 0) / es.length : c.x + c.f * 3 * k, cy = es ? es.reduce((a, e) => a + e.y, 0) / es.length : c.y;
        for (let i = 0; i < 26; i++) c.later(6 + i * 2, () => featherFall(cx + rnd(-1.6, 1.6) * k, cy + rnd(-0.5, 0.5) * k)); }
      if (t === r3 && m.es) { string(c, 8); m.es.forEach((e, j) => { for (let i = 0; i < 5; i++) c.later(j * 2 + i * 5, () => { if (e.st === 'dead' || e.hp <= 0) return; whiteCut(e); G.damageOni(e, 0.35 * c.mul, i === 4, false); VX.impact(e, i === 4 ? 'heavy' : 'light', 'arrow', undefined, '255,250,240'); m.hit = 1; }); }); } }],
    /* 千羽：側步一箭 → 兩波九箭扇射、羽毛飄落 → 中箭者身上依序亮起光點追加傷害 */
    m_senba: ['moving_shot', 'spread_shot', 'fan_release', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx, hitE = m.he = m.he || new Set(), on = e => hitE.add(e);
      if (t < r1) c.move(0, 0.025);
      if (t === r1) { string(c); arw(c, { m: 0.5, onHit: on }); }
      if (t === r2 || t === r3) { string(c); feathers(c.x + c.f * 0.4 * c.hh, c.y, 5, 0.8); for (let i = -4; i <= 4; i++) arw(c, { m: 0.28, ang: i * 0.11, range: t === r2 ? 6 : 9, onHit: on }); }
      if (t === r3 + 18) [...hitE].forEach((e, i) => c.later(i * 4, () => { if (e.st === 'dead') return; tspr('fx_hit_pierce', { x: e.x, y: e.y, z: (e.ratio || 1) * 0.5, k: 0.7, col: Y2, life: 12 }); G.damageOni(e, 0.6 * c.mul, false, false); m.hit = 1; })); }],
    /* 破魔矢：拉滿朝天射一箭 → 箭從天落在敵群 → 地面展開神社法陣，持續淨化傷害 */
    m_hamaya: ['steady_focus', 'full_aim', 'piercing_shot', (c, t, C) => { const [, , r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === 2) { const e = near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; }
      if (t > C.st[1] && t < r3 && t % 6 === 0) string(c, 6);
      if (t === r3) { string(c, 8); upArrow(c); c.later(12, () => { const [px, py] = m.p; VX.custom((o, ctx) => { const s = S(py), kk = HH() * s, u = o.t / o.life, pz = (1 - u) * 6 * kk; ctx.save(); ctx.translate(px, py - pz); ctx.rotate(Math.PI / 2); ctx.scale(1, 1.8); ar0.call(VX, ctx, kk * 0.75, '255,250,240', true); ctx.restore(); }, 8, 'o'); });
        c.later(20, () => { const [px, py] = m.p; VX.s2('fx_pillar', { x: px, y: py, k: 0.8, life: 12, add: 1, a: 0.9 }); SC.shake = Math.max(SC.shake || 0, 2);
        VX.custom((o, ctx) => { const a = Math.min(1, o.t / 6, (o.life - o.t) / 14) * (0.85 + 0.15 * Math.sin(o.t * 0.15)); VX.draw2(ctx, 'fx_sigil_shrine', 0, px, py, 1.15, { sy: 0.4, a }); VX.draw2(ctx, 'fx_sigil_shrine', 0, px, py, 1.15, { sy: 0.4, a: a * 0.35, add: 1 }); }, 130, 'g',
          { step: (o, tt) => { if (tt % 22 === 4) c.hit({ shape: 'circle', x: px, y: py, r: 1.5, m: 0.6, lv: 'mid', kind: 'arrow', def: 30, col: '255,250,236' }); } }); }); } }],
    /* 月影：後滑留殘影 → 射出一箭 → 中箭處出現旋轉月牙，接著彈向附近敵人（最多 3 次） */
    m_tsukikage: ['covered_step', 'lower_retreat', 'follow_shot', (c, t, C) => { const [, , r3] = C.rel;
      if (t < 14) { c.move(-0.04, 0); if (t === 4 || t === 9) c.ghost(10); }
      if (t === r3) { string(c); arw(c, { m: 1.0, col: '190,215,255', home: near(c, 9), turn: 0.2, onHit: e => crescent(c, e, 3) }); } }] };
  const HD0 = {};
  function hiden(want, wid, HM) { for (const h of MV2.HD[wid] || []) { const d = HM[h.id]; if (!d) continue; if (!HD0[h.id]) HD0[h.id] = { run: h.run, T: h.T };
      if (!want) { h.run = HD0[h.id].run; h.T = HD0[h.id].T; continue; }
      const C = comp(d.slice(0, 3)); if (!C) continue; h.T = C.T;
      h.run = function (c, t) { if (t === 1) { c.a.r = C.r; c.a.T = C.T; c.a._comp = C; H.inv = Math.max(H.inv, C.T + 6); VX.dim(C.T, 0.2); } d[3](c, t, C); }; } }

  /* ================= 鐵砲 ================= */
  const TO = PAL.teppo.c, TO2 = PAL.teppo.c2;
  const FT = (c, i) => { const r = c.a.r; if (!r || !r.f || r.f.length <= i) return Math.round(c.a.T * 0.5); return Math.max(2, Math.round(c.a.T * cum(r, i) / AN.dur(r))); };
  /* 子彈：拿掉白色光球，改一閃而過的短曳光（子彈不放慢） */
  const tshot0 = VX.shot;
  VX.shot = function (o) { if (on('teppo') && (o.k === 'bullet' || o.k === 'pellet')) { const pel = o.k === 'pellet', p = tshot0.call(this, Object.assign({}, o, { k: pel ? 'tp' : 'tb' }));
      VX.custom((q, ctx) => { if (p.dead) { q.t = q.life; return; } const s = S(p.y), k = HH() * s, d = Math.atan2(p.vy * 0.6, p.vx), L = (pel ? 0.35 : 0.8) * k, x = p.x, y = p.y - p.z; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(d);
        const g = ctx.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, 'rgba(' + TO + ',0)'); g.addColorStop(0.75, 'rgba(' + TO + ',.7)'); g.addColorStop(1, 'rgba(' + TO2 + ',1)'); ctx.fillStyle = g; ctx.fillRect(-L, -1.2 * s, L, 2.4 * s); ctx.restore(); }, 120, 'o');
      return p; } return tshot0.apply(this, arguments); };
  const smoke = (c, big) => { const mz = W.muzzle && W.muzzle(), x = mz ? mz[0] : c.x + c.f * 0.95 * c.hh, z = mz ? (c.y - mz[1]) / c.hh : 0.62; VX.s2('fx_smoke', { x: x + c.f * 0.15 * c.hh, y: c.y, z, k: big ? 0.55 : 0.38, life: 36, a: 0.45, flip: c.f < 0 }); };
  const casing = c => VX.shard({ x: c.x + c.f * 0.35 * c.hh, y: c.y, z: 0.62, n: 1, col: '230,190,90', life: 26 });
  const fire = (c, o, big) => { c.muzzle(!!big, o.ang); smoke(c, big); casing(c); if (big) SC.shake = Math.max(SC.shake || 0, 1); const L = H.loaded > 0 && !o.noLoad; if (L) { H.loaded--; o.m = (o.m || 1) * 1.4; } return c.shoot(o.k || 'bullet', Object.assign({ spd: 0.6, range: 8, lv: 'mid' }, o)); };
  const pellets = (c, n, sp, o) => { c.muzzle(true, 0); smoke(c, true); casing(c); for (let i = 0; i < n; i++) c.shoot('pellet', Object.assign({ ang: (i - (n - 1) / 2) * (sp / Math.max(1, n - 1)), spd: 0.5, range: 3.5, kb: 0.6 }, o)); };
  const recoil = (c, t, t0, d) => { if (t > t0 && t <= t0 + 4) c.move(-(d || 0.03), 0); };
  /* 燃燒地面一列（取代手畫火線） */
  const fireRow = (c, len, life, m) => { const x0 = c.x + c.f * 0.5 * c.hh, y0 = c.y, f = c.f; for (let i = 0; i < 4; i++) c.later(i * 3, () => VX.burn2({ x: x0 + f * (i + 0.5) / 4 * len * c.hh, y: y0, r: 0.45, life }));
    VX.custom(() => {}, life, 'g', { step: (o, tt) => { if (tt % 20 === 10) c.hit({ shape: 'line', x: x0, y: y0, len, w: 0.3, m, lv: 'light', kind: 'shot', col: TO }); } }); };
  /* --- 普攻 --- */
  const NT = [
    { run(c, t) { const f = at(c); if (t === f) fire(c, { m: dm(c), spd: 0.75, range: 8, kb: 0.3 }); recoil(c, t, f, 0.02); } },
    { run(c, t) { const f = at(c); if (t === f) { pellets(c, 5, 0.8, { m: dm(c) * 0.32, spd: 0.55, range: 3.4, kb: 0.6, lv: 'heavy' }); SC.shake = Math.max(SC.shake || 0, 1); } recoil(c, t, f, 0.05); } }];
  /* --- 招式（12）：全部在擊發格開槍、位移縮小 --- */
  const MT = {
    retreat_shot: { run(c, t) { const R = REL(c); if (t <= 10) c.move(-0.08, 0); if (t === 3) c.ghost(8); if (t === R) fire(c, { m: 1.1 }); } },
    point_shot: { run(c, t) { if (t === REL(c)) fire(c, { m: 1.0, spd: 0.7 }); } },
    aim_shift: { run(c, t) { const R = REL(c); if (t === 1) G.BUFF.add('nextCrit', 100, 300); if (t <= R) c.move(0, (G.IN.my || 0.6) * 0.03); if (t === R) fire(c, { m: 0.6 }); } },
    pressure_shot: { run(c, t) { const R = REL(c); if (t === R - 6 || t === R || t === R + 6) fire(c, { m: 0.62, ang: rnd(-0.03, 0.03) }); } },
    focused_shot: { run(c, t) { const R = REL(c); if (t === R) fire(c, { m: 1.45, spd: 0.8, crit: Math.random() < 0.5 }, true); recoil(c, t, R); } },
    close_scatter: { run(c, t) { const R = REL(c); if (t === R) { pellets(c, 7, 1.0, { m: 0.42, spd: 0.5, range: 3, kb: 0.8 }); SC.shake = Math.max(SC.shake || 0, 1); } recoil(c, t, R, 0.05); } },
    ramrod_load: { run(c, t) { const R = REL(c); if (t === 2) c.a.mvx.hit = 1; if (t === R) { H.loaded = 2; const mz = W.muzzle && W.muzzle(), x = mz ? mz[0] : c.x + c.f * 0.7 * c.hh, z = mz ? (c.y - mz[1]) / c.hh : 0.6; VX.spark({ x, y: c.y, z: z * c.hh, n: 5, up: 2, spd: 2, col: TO2 }); VX.s2('fx_smoke', { x, y: c.y, z, k: 0.3, life: 24, a: 0.35 }); } } },
    denial_fire: { run(c, t) { const R = REL(c); if (t === R) { c.muzzle(true, -0.4); smoke(c, true); fireRow(c, 3, 110, 0.3); c.hit({ shape: 'line', len: 3.2, w: 0.35, m: 0.8, lv: 'mid', kind: 'shot', col: TO }); } } },
    steady_rifle: { run(c, t) { const R = REL(c); if (t > 2 && t < R && t % 6 === 0) { const mz = W.muzzle && W.muzzle(); if (mz) VX.glow({ x: mz[0], y: c.y, z: (c.y - mz[1]) / c.hh, r: 0.08 + t / 300, col: TO2, life: 6 }); }
        if (t === R) fire(c, { m: 2.2, spd: 0.95, range: 9, pierce: 3, lv: 'heavy' }, true); recoil(c, t, R, 0.05); } },
    rifle_retreat: { run(c, t) { const R = REL(c); if (t <= 12) c.move(-0.07, 0); if (t === 2) c.ghost(10); if (t === R) pellets(c, 5, 0.65, { m: 0.55, range: 3.5, kb: 1 }); } },
    stock_deflect: { run(c, t) { const R = REL(c); if (t <= 6) c.move(0.04, 0);
        if (t === R) { const x = c.x + c.f * 0.7 * c.hh; c.hit({ shape: 'sector', r: 1.0, arc: 2, m: 1.0, lv: 'mid', kind: 'blunt', kb: 1.6, col: TO }); VX.s2('fx_dust', { x, y: c.y, k: 0.5, sy: 0.6, life: 18, a: 0.6 }); VX.debris2 && VX.debris2({ x, y: c.y, n: 3, spd: 0.6 }); } } } };
  /* --- 技能 --- */
  const markOn = (e, life, k0, k1) => VX.custom((o, ctx) => { if (!e || e.st === 'dead') { o.t = o.life; return; } const q = Math.min(1, o.t / Math.max(1, o.life - 6)), s = S(e.y), k = (k0 + (k1 - k0) * q) * Math.min(1.6, e.ratio || 1);
      VX.draw2(ctx, 'fx_mark', 0, e.x, e.y - (e.ratio || 1) * 0.55 * HH() * s, k, { add: 1, a: Math.min(1, o.t / 5) * 0.9 }); }, life, 'o');
  const UT = {
    skill_sogeki: { T: 56, run(c, t) { const lv = LVc(c), m = c.a.mvx, F = FT(c, 4);
        if (t === 2) { m.e = near(c, 12); if (m.e) markOn(m.e, F - 2, 0.9, 0.38); }
        if (t > 4 && t < F && t % 6 === 0) { const mz = W.muzzle && W.muzzle(); if (mz) VX.glow({ x: mz[0], y: c.y, z: (c.y - mz[1]) / c.hh, r: 0.06 + t / 400, col: TO2, life: 6 }); }
        if (t === F) { fire(c, { m: 3.4, spd: 1.3, range: 12, pierce: lv >= 5 ? 5 : 1, lv: 'heavy', crit: lv >= 5, noLoad: 0, onHit: e => { G.damageOni(e, 3.4 * c.mul, true, lv >= 5, lv >= 3 ? { ign: 50 } : undefined); e.kb = c.f * 0.6 * HH() * S(e.y) / 6 / (e.ratio || 1); VX.impact(e, 'heavy', 'shot');
            VX.spark({ x: e.x, y: e.y, z: (e.ratio || 1) * 0.5 * HH() * S(e.y), n: 8, ang: c.f > 0 ? 0 : Math.PI, spread: 0.35, spd: 7, col: TO2 }); c.a.mvx.hit = 1; return false; } }, true); SC.shake = Math.max(SC.shake || 0, 1); }
        recoil(c, t, F, 0.06); } },
    skill_rensha: { T: 40, run(c, t) { const lv = LVc(c), n = 3 + (lv >= 3 ? 2 : 0), a = FT(c, 2), b = FT(c, 5), g = Math.max(4, Math.round((b - a) / (n - 1)));
        for (let i = 0; i < n; i++) if (t === a + i * g) { const last = i === n - 1 && lv >= 5; fire(c, { m: 0.9, ang: rnd(-0.03, 0.03), kb: last ? 2.2 : 0.2, stun: last ? 60 : 0, lv: last ? 'heavy' : 'mid' }, last); }
        for (let i = 0; i < n; i++) recoil(c, t, a + i * g, 0.015); } },
    skill_sandan: { T: 46, run(c, t) { const lv = LVc(c), a = FT(c, 1), b = FT(c, 5), g = Math.round((b - a) / (lv >= 3 ? 3 : 2.4));
        for (let r = 0; r < 3; r++) if (t === a + r * g) { const last = r === 2 && lv >= 5; pellets(c, last ? 9 : 5, last ? 1.2 : 0.85, { m: 2.2 / (last ? 9 : 5), range: 4, kb: last ? 1.5 : 0.4 }); }
        for (let r = 0; r < 3; r++) recoil(c, t, a + r * g, 0.03); } },
    skill_horoku: { T: 36, run(c, t) { const lv = LVc(c), F = FT(c, 3); if (t === F) { const n = lv >= 3 ? 2 : 1; for (let i = 0; i < n; i++) { const d = 2.4 + i * 0.6;
          VX.shot({ k: 'bomb', x: c.x + c.f * 0.5 * c.hh, y: c.y + (i ? 0.3 : 0) * c.hh, z: 0.9 * c.hh, vx: c.f * d * c.hh / 26, vy: 0, grav: 0.55 * S(c.y), vz: -7 * S(c.y), range: 99 * c.hh,
            onLand: p => c.later(3, () => { VX.s2('fx_blast', { x: p.x, y: p.y, k: 0.85, life: 22 }); c.hit({ shape: 'circle', x: p.x, y: p.y, r: 1.0, m: 2.0, lv: 'heavy', kind: 'blunt', kb: 1.2, col: TO }); SC.shake = Math.max(SC.shake || 0, 1); if (lv >= 5) { VX.burn2({ x: p.x, y: p.y, r: 0.9, life: 180 }); VX.custom(() => {}, 180, 'g', { step: (o, tt) => { if (tt % 30 === 15) c.hit({ shape: 'circle', x: p.x, y: p.y, r: 0.9, m: 0.3, lv: 'light', kind: 'blunt', col: TO }); } }); } }) }); } } } },
    special_guardshot: { T: 52, run(c, t) { if (t === 1) { const mz = W.muzzle && W.muzzle(); if (mz) VX.glow({ x: mz[0], y: c.y, z: (c.y - mz[1]) / c.hh, r: 0.12, col: '230,225,210', life: 30 }); } if (t === 40) c.a.mvx.hit = 1; },
      counter(c, e) { c.a.mvx.hit = 1; VX.spark({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6 * c.hh, n: 10, spd: 6, col: TO2 }); fire(c, { m: 1.5 * (LVc(c) >= 5 ? 1.33 : 1), spd: 0.85, lv: 'heavy', kb: LVc(c) >= 5 ? 2 : 0.8 }, true); if (LVc(c) >= 3) { const d = G.RPG.d(); d.qi = Math.min(100, d.qi + 10); } } },
    special_precision: { T: 30, run(c, t) { const lv = LVc(c); if (t === 2) { c.a.mvx.hit = 1; G.BUFF.add('nextCrit', lv >= 3 ? 80 : 50, 600); if (lv >= 5) LAB.critD = 1; }
        if (t > 2 && t < 24 && t % 5 === 0) { const mz = W.muzzle && W.muzzle(); if (mz) VX.glow({ x: mz[0], y: c.y, z: (c.y - mz[1]) / c.hh, r: 0.1 + t / 200, col: '255,215,120', life: 6 }); } } },
    special_reloadshot: { T: 34, run(c, t) { const lv = LVc(c), R = REL(c); if (t === 1 && lv >= 3) c.a.T = Math.round(34 * 0.7);
        if (t === R - 5 || t === R + 3) fire(c, { m: 0.8, pierce: lv >= 5 ? 3 : 1 }); if (t === R + 8) { H.loaded = lv >= 5 ? 3 : 2; casing(c); } } },
    special_scatterback: { T: 32, run(c, t) { const lv = LVc(c), R = REL(c); if (t <= 10) c.move(-0.08, 0); if (t === 2) c.ghost(10); if (lv >= 5 && t < 10) c.inv(4); if (t === R) pellets(c, lv >= 3 ? 7 : 5, 1.0, { m: 0.6, range: 3.5, kb: 1 }); } } };
  /* 穩膛貫擊 Lv5：下一發暴擊傷害 +50% */
  const dmg0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (LAB.critD && on('teppo') && G.BUFF.get('nextCrit') > 0 && !(opt && opt.party)) { LAB.critD = 0; mult *= 1.5; } return dmg0.call(this, e, mult, big, fc, opt); };
  /* 強化彈（裝填）：槍旁顯示剩幾發 */
  (function hud2() { const d0 = G.drawHero; G.drawHero = function () { const r = d0.apply(this, arguments); if (!on('teppo') || !(H.loaded > 0)) return r; const c = G.ctx, s = S(H.y), k = HH() * s;
      c.save(); for (let i = 0; i < H.loaded; i++) { const x = H.x - H.face * (0.25 + i * 0.09) * k, y = H.y - 1.05 * k; c.fillStyle = 'rgba(255,200,110,.9)'; c.fillRect(x - 1.5 * s, y - 4 * s, 3 * s, 8 * s); c.fillStyle = 'rgba(120,80,40,.9)'; c.fillRect(x - 1.5 * s, y + 2 * s, 3 * s, 2 * s); } c.restore(); return r; }; })();
  /* --- 秘傳 --- */
  const HT = {
    /* 火龍：連射壓制 → 近距散彈 → 一發火龍彈，飛過的路線留下一串火焰，盡頭爆炸 */
    t_karyu: ['pressure_shot', 'close_scatter', 'steady_rifle', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1 - 6 || t === r1 || t === r1 + 6) fire(c, { m: 0.4, ang: rnd(-0.03, 0.03) });
      if (t === r2) pellets(c, 7, 1.0, { m: 0.3, range: 3, kb: 0.6 });
      if (t === r3) { const boom = q => { VX.s2('fx_blast', { x: q.x, y: q.y, k: 1.0, life: 24 }); c.hit({ shape: 'circle', x: q.x, y: q.y, r: 1.4, m: 1.6, lv: 'hiden', kind: 'blunt', col: TO }); SC.shake = 3; }; const p = fire(c, { m: 2.2, spd: 0.6, range: 7, lv: 'hiden', onHit: (e, q) => { G.damageOni(e, 2.2 * c.mul, true, false); q.dead = 1; boom(q); return false; }, onEnd: q => { VX.s2('fx_blast', { x: q.x, y: q.y, k: 1.0, life: 24 }); c.hit({ shape: 'circle', x: q.x, y: q.y, r: 1.4, m: 1.6, lv: 'hiden', kind: 'blunt', col: TO }); SC.shake = 3; } }, true);
        let last = 0; VX.custom(() => { if (p.dead) return; if (p.dist - last > HH() * S(p.y) * 0.6) { last = p.dist; VX.burn2({ x: p.x, y: p.y, r: 0.65, life: 70 }); } }, 60, 'o'); } }],
    /* 三段撃・極：三槍節奏分明，準星一槍比一槍收緊，第三槍貫穿 */
    t_sandan: ['point_shot', 'focused_shot', 'steady_rifle', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx;
      if (t === 2) { m.e = near(c, 12); if (m.e) { markOn(m.e, r1 - 2, 1.0, 0.75); c.later(r1, () => markOn(m.e, r2 - r1, 0.75, 0.55)); c.later(r2, () => markOn(m.e, r3 - r2, 0.55, 0.35)); } }
      if (t === r1) fire(c, { m: 0.8, spd: 0.9 }); if (t === r2) fire(c, { m: 1.0, spd: 0.95 });
      if (t === r3) fire(c, { m: 2.6, spd: 1.2, range: 12, pierce: 99, lv: 'hiden' }, true); recoil(c, t, r3, 0.06); }],
    /* 鉛雨：裝填 → 散彈 → 朝天開槍，一片鉛彈帶著曳光落下，落點土花＋火星 */
    t_namari: ['ramrod_load', 'close_scatter', 'rifle_retreat', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === r1) { const e = near(c, 9); m.p = e ? [e.x, e.y] : [c.x + c.f * 3 * k, c.y]; VX.spark({ x: c.x + c.f * 0.7 * k, y: c.y, z: 0.6 * k, n: 5, up: 2, spd: 2, col: TO2 }); }
      if (t === r2) pellets(c, 7, 1.0, { m: 0.3, range: 3, kb: 0.6 });
      if (t === r3) { c.muzzle(true, -1.2); smoke(c, true); SC.shake = Math.max(SC.shake || 0, 1);
        for (let i = 0; i < 30; i++) c.later(10 + Math.floor(i * 1.5), () => { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 1.5 * k, x = m.p[0] + Math.cos(a) * r, y = m.p[1] + Math.sin(a) * r * 0.4;
          VX.custom((o, ctx) => { const s = S(y), kk = HH() * s, u = o.t / 6, z = (1 - u) * 4.5 * kk, L = 1.3 * kk; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, y - z - L, x, y - z); g.addColorStop(0, 'rgba(' + TO + ',0)'); g.addColorStop(1, 'rgba(' + TO2 + ',1)'); ctx.fillStyle = g; ctx.fillRect(x - 2 * s, y - z - L, 4 * s, L); ctx.restore(); }, 6, 'o');
          c.later(6, () => { VX.s2('fx_dust', { x, y, k: 0.7, sy: 0.7, life: 20, a: 0.9 }); tspr('fx_hit_blunt', { x, y, z: 0.05, k: 0.35, col: TO, life: 10 }); VX.spark({ x, y, z: 2, n: 4, up: 3, spd: 3, col: TO2 }); c.hit({ shape: 'circle', x, y, r: 0.55, m: 0.22, lv: 'light', kind: 'shot', col: TO }); }); }); } }],
    /* 雷筒：一發雷彈命中 → 天降落雷打在目標，再連鎖落到附近敵人（最多 4 隻），落點閃雷紋法陣 */
    t_raitou: ['aim_shift', 'ramrod_load', 'steady_rifle', (c, t, C) => { const [, , r3] = C.rel;
      if (t === r3) { const strike = (e, n, seen) => { if (!e || e.st === 'dead') return; const s = S(e.y), k = HH() * s;
          VX.bolt({ x0: e.x + rnd(-0.3, 0.3) * k, y0: e.y - 6 * k, x1: e.x, y1: e.y - 0.1 * k, life: 12, w: 3, br: 2, col: '200,220,255' });
          VX.s2('fx_sigil_raiden', { x: e.x, y: e.y, k: 0.5 * Math.min(1.6, e.ratio || 1), sy: 0.4, life: 20, l: 'g', add: 1, a: 0.9 }); VX.glow({ x: e.x, y: e.y, z: 0.1, r: 0.5, col: '200,220,255', life: 8 });
          G.damageOni(e, 1.3 * c.mul, true, false); VX.impact(e, 'hiden', 'shot', undefined, '200,220,255'); e.stun = Math.max(e.stun || 0, 20); c.a.mvx.hit = 1; SC.shake = Math.max(SC.shake || 0, 2);
          if (n <= 0) return; const nx = G.E.filter(q => q.st !== 'dead' && q.hp > 0 && !seen.includes(q) && Math.hypot(q.x - e.x, (q.y - e.y) * 1.6) < 4 * k).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
          if (nx) { seen.push(nx); c.later(9, () => strike(nx, n - 1, seen)); } };
        fire(c, { m: 0.2, spd: 1.1, range: 10, col: '200,220,255', lv: 'light', onHit: e => { strike(e, 3, [e]); return false; } }, true); } }],
    /* 焙烙連爆：托擊 → 散彈 → 拋出 3 顆炸彈，依序爆炸並留下燃燒地面 */
    t_horoku: ['stock_deflect', 'close_scatter', 'denial_fire', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { c.hit({ shape: 'sector', r: 1.0, arc: 2, m: 0.8, lv: 'mid', kind: 'blunt', kb: 1.4, col: TO }); VX.s2('fx_dust', { x: c.x + c.f * 0.7 * c.hh, y: c.y, k: 0.5, sy: 0.6, life: 18, a: 0.6 }); }
      if (t === r2) pellets(c, 7, 1.0, { m: 0.3, range: 3, kb: 0.6 });
      if (t === r3) { const e0 = near(c, 9), D = e0 ? Math.abs(e0.x - c.x) / c.hh - 0.5 : 2.5; for (let i = 0; i < 3; i++) { const d = Math.max(1.2, D - 0.6 + i * 0.6); VX.shot({ k: 'bomb', x: c.x + c.f * 0.5 * c.hh, y: c.y + (i - 1) * 0.3 * c.hh, z: 0.9 * c.hh, vx: c.f * d * c.hh / 24, vy: 0, grav: 0.55 * S(c.y), vz: -6.6 * S(c.y), range: 99 * c.hh,
          onLand: p => c.later(4 + i * 6, () => { VX.s2('fx_blast', { x: p.x, y: p.y, k: 0.9, life: 22 }); VX.burn2({ x: p.x, y: p.y, r: 0.7, life: 120 }); c.hit({ shape: 'circle', x: p.x, y: p.y, r: 1.0, m: 1.2, lv: 'hiden', kind: 'blunt', kb: 1, col: TO }); SC.shake = Math.max(SC.shake || 0, 2); }) }); } } }] };

  /* ---------- 新舊切換：只在試做開啟且新版時套用 ---------- */
  /* ================= 打刀（普攻不動，只改命中色） ================= */
  const KB = PAL.katana.c, KB2 = PAL.katana.c2;
  /* 素材刀弧：basic（起手）／evolved（連段）／master（收招）；rot 以面向為準 */
  /* 刀光：改回原本的程式刀幕（比例正確），依角度選弧形；只改顏色與時機 */
  const ribShape = rot => rot <= -0.9 ? { a0: 1.1, a1: -1.9, sq: 1 } : rot >= 1.3 ? { a0: -0.5, a1: 0.25, sq: 0.3 } : rot >= 0.7 ? { a0: -2.1, a1: 0.95, sq: 1 } : { a0: -2.2, a1: 0.9, sq: 0.45, rot: rot * 0.5 };
  const arc = (c, lvl, o) => { o = o || {}; const f = o.f || c.f, L = lvl === 'master' ? 1.12 : lvl === 'evolved' ? 1.05 : 1; VX.ribbon(Object.assign({ x: o.x !== undefined ? o.x : c.x, y: o.y !== undefined ? o.y : c.y, face: f, r: 1.2 * L * (o.w ? o.w / 1.3 : 1), w: 0.3 * L, sw: 4, life: 13, col: '190,220,255', edge: '255,255,255', trail: 2.2, shat: 7 }, ribShape(o.rot || 0), o.rot >= 1.3 ? { r: 2.0 } : {})); };
  const cutMark = (x, y, z, rot, k, col) => VX.cut({ x, y, z, ang: rot, len: 1.0 * (k || 0.7) / 0.7, w: 0.07, col: '255,255,255', glowC: col || '150,200,255', life: 14 });   /* 原本程式刀痕 */
  const thinLine = (x0, x1, y, z, life) => VX.custom((o, ctx) => { const s = S(y), k = HH() * s, a = 1 - o.t / o.life, yy = y - z * k; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x0, yy, x1, yy); g.addColorStop(0, 'rgba(' + KB + ',0)'); g.addColorStop(0.5, 'rgba(255,255,255,' + a + ')'); g.addColorStop(1, 'rgba(' + KB + ',0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), yy - 0.8 * s, Math.abs(x1 - x0), 1.6 * s); ctx.restore(); }, life || 12, 'o');
  const parry = c => { VX.spark({ x: c.x + c.f * 0.35 * c.hh, y: c.y, z: 0.65 * c.hh, n: 10, spd: 6, col: '255,235,190' }); tspr('fx_hit_pierce', { x: c.x + c.f * 0.35 * c.hh, y: c.y, z: 0.65, k: 0.45, col: '255,245,220', life: 8 }); };
  const bladeGlow = (c, life) => VX.custom((o, ctx) => { const s = S(H.y), k = HH() * s, a = Math.min(1, o.t / 5, (o.life - o.t) / 8) * (0.5 + 0.2 * Math.sin(o.t * 0.3)), x = H.x + H.face * 0.3 * k, y = H.y - 0.75 * k; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, 0.3 * k); g.addColorStop(0, 'rgba(' + KB2 + ',' + 0.5 * a + ')'); g.addColorStop(1, 'rgba(' + KB + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 0.3 * k, 0, TAU); ctx.fill(); ctx.restore(); }, life, 'o');
  const kh = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 1.3, arc: 2.2, m: 1.0, lv: 'mid', kind: 'cut', col: KB }, o));
  /* 拉回（翻潮 Lv5）：2.2H 內、非頭目，0.15 秒拉到身前 0.9H */
  const pullIn = c => { const tx = c.x + c.f * 0.9 * c.hh; for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss || Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) > 2.2 * c.hh) continue; const x0 = e.x, y0 = e.y; let n = 0;
      VX.custom((o, ctx) => { const s = S(e.y); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(150,210,255,' + (1 - o.t / o.life) * 0.6 + ')'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(e.x, e.y - 0.3 * HH() * s); ctx.lineTo(tx, c.y - 0.3 * HH() * s); ctx.stroke(); ctx.restore(); }, 9, 'o', { step: () => { if (n++ < 9 && e.st !== 'dead') { e.x += (tx - x0) / 9; e.y += (c.y - y0) / 9 * 0.5; } } }); } };
  /* --- 招式（12） --- */
  const MK = {
    step_cut: { run(c, t) { const R = REL(c); if (t < R) c.move(0.1, 0); if (t === 2) VX.s2('fx_dust', { x: c.x, y: c.y, k: 0.35, sy: 0.6, life: 16, a: 0.6 }); if (t === R) { arc(c, 'basic', { rot: -0.3 }); kh(c, { m: 1.0 }); } } },
    diagonal_lane: { run(c, t) { const R = REL(c), m = c.a.mvx; if (t === 1) m.x0 = c.x; if (t < R) { c.move(0.16, (G.IN.my || 0) * 0.04); c.inv(6); if (t % 3 === 0) c.ghost(8); }
        if (t === R) { thinLine(m.x0, c.x, c.y, 0.55, 14); const x0 = m.x0, L = Math.abs(c.x - x0) / c.hh; c.later(10, () => { const hs = c.hit({ shape: 'line', x: x0, y: c.y, len: L + 0.3, w: 0.45, m: 1.2, lv: 'mid', kind: 'cut', col: KB }); }); } } },
    low_probe: { run(c, t) { if (t === REL(c)) { VX.thrust({ x: c.x, y: c.y, face: c.f, len: 1.5, w: 0.16, cy: 0.28, ext: 2, life: 10, col: '190,220,255', edge: '255,255,255', tip: '255,255,255', lines: 1 }); const hs = c.hit({ shape: 'line', len: 1.5, w: 0.35, m: 0.8, lv: 'light', kind: 'cut', slow: 30, col: KB }); hs.forEach(e => VX.ring({ x: e.x, y: e.y, r1: 0.6, life: 20, col: '150,200,255', lw: 0.05 })); } } },
    rising_disrupt: { run(c, t) { if (t === REL(c)) { arc(c, 'master', { rot: -1.4, z: 0.75 }); kh(c, { m: 1.0, launch: 45, r: 1.2 }); } } },
    turning_sweep: { run(c, t) { const R = REL(c); if (t === R) { arc(c, 'evolved', { rot: 0.2 }); arc(c, 'evolved', { dx: -0.55, rot: Math.PI + 0.2 }); c.hit({ shape: 'circle', r: 1.35, m: 1.0, lv: 'mid', kind: 'cut', col: KB }); } } },
    arc_step: { run(c, t) { const R = REL(c); if (t < R) { const a = t / R * Math.PI; c.move(0.1 * Math.cos(a * 0.5), 0.07 * Math.sin(a)); if (t % 3 === 0) c.ghost(8); } if (t === R) { arc(c, 'basic', { rot: 0.3 }); kh(c, { m: 1.05 }); } } },
    return_weave: { run(c, t) { const R = REL(c); if (t === R - 4) { arc(c, 'evolved', { rot: -0.6 }); kh(c, { m: 0.6 }); } if (t === R + 3) { arc(c, 'evolved', { rot: 0.7 }); kh(c, { m: 0.65 }); } } },
    downward_finish: { run(c, t) { const R = REL(c); if (t < R && t > 3) c.move(0.05, 0); if (t === R) { arc(c, 'master', { rot: 0.9, z: 0.7 }); const x = c.x + c.f * 0.9 * c.hh; c.later(2, () => { VX.s2('fx_crack_s', { x, y: c.y, k: 0.8, sy: 0.5, l: 'g', life: 30, a: 0.9 }); SC.shake = Math.max(SC.shake || 0, 1); }); kh(c, { m: 1.5, lv: 'heavy' }); } } },
    leaving_cut: { run(c, t) { const R = REL(c), m = c.a.mvx; if (t === R) { arc(c, 'evolved', { rot: -0.4 }); kh(c, { m: 0.8 }); m.p = [c.x + c.f * 0.8 * c.hh, c.y]; } if (t > R && t <= R + 10) c.move(-0.08, 0);
        if (t === R + 24 && m.p) { cutMark(m.p[0], m.p[1], 0.55, -0.5, 0.9); c.hit({ shape: 'circle', x: m.p[0], y: m.p[1], r: 0.9, m: 0.9, lv: 'heavy', kind: 'cut', col: KB }); } } },
    sheathed_retreat: { run(c, t) { const R = REL(c); if (t <= 10) c.move(-0.06, 0); if (t === R) { tspr('fx_hit_pierce', { x: c.x + c.f * 0.1 * c.hh, y: c.y, z: 0.5, k: 0.3, col: '255,255,255', life: 8 }); const x0 = c.x, y = c.y, f = c.f, k = c.hh;
          c.later(8, () => { for (let i = 0; i < 3; i++) cutMark(x0 + f * (0.8 + i * 0.6) * k, y, 0.5, i % 2 ? 0.6 : -0.6, 0.6); c.hit({ shape: 'line', x: x0, y, len: 2.2, w: 0.45, m: 1.0, lv: 'mid', kind: 'cut', col: KB }); }); } } },
    blade_receive: { run(c, t) { if (t === 2) bladeGlow(c, 26); if (t === 26) c.a.mvx.hit = 1; }, counter(c) { c.a.mvx.hit = 1; parry(c); arc(c, 'evolved', { rot: -0.4 }); kh(c, { m: 1.4, lv: 'heavy' }); } },
    open_guard: { run(c, t) { if (t === 2) bladeGlow(c, 40); if (t === 40) c.a.mvx.hit = 1; }, counter(c) { c.a.mvx.hit = 1; parry(c); arc(c, 'master', { rot: 0.2 }); kh(c, { m: 1.6, lv: 'heavy', kb: 1.2 }); } } };
  /* --- 技能（千本櫻、櫻花亂舞保留） --- */
  const UK = {
    iai: { T: 40, run(c, t) { const lv = LVc(c), m = c.a.mvx, D = lv >= 3 ? 4.5 : 3, F = FT(c, 3);
        if (t === 1) { m.x0 = c.x; tspr('fx_hit_pierce', { x: c.x + c.f * 0.1 * c.hh, y: c.y, z: 0.5, k: 0.3, col: '255,255,255', life: 8 }); }
        if (t > F - 5 && t <= F) { c.move(D / 5, 0); c.ghost(8); c.inv(8); }
        if (t === F) { const x0 = m.x0, x1 = c.x, y = c.y, L = Math.abs(x1 - x0) / c.hh; VX.thrust({ x: x0, y, face: c.f, len: L + 0.4, w: 0.05, cy: 0.5, ext: 1, life: 12, col: '190,220,255', edge: '255,255,255', lines: 0 }); c.later(3, () => VX.cut({ x: (x0 + x1) / 2, y, z: 0.5, ang: 0, len: L + 0.4, w: 0.07, col: '255,255,255', glowC: '150,200,255', life: 18 }));
          c.later(5, () => { const hs = c.hit({ shape: 'line', x: x0, y, len: L + 0.4, w: 0.5, m: 2.0, lv: 'heavy', kind: 'cut', col: KB, pierce: lv >= 3 ? 9 : 1 }); });
          if (lv >= 5) c.later(60, () => { VX.cut({ x: (x0 + x1) / 2, y, z: 0.55, ang: -0.15, len: L + 0.4, w: 0.08, col: '255,255,255', glowC: '255,120,120', life: 18 }); c.hit({ shape: 'line', x: x0, y, len: L + 0.4, w: 0.6, m: 1.2, lv: 'heavy', kind: 'cut', col: '255,120,120' }); }); } } },
    issen: { T: 52, run(c, t) { const lv = LVc(c), m = c.a.mvx, F = FT(c, 4), D = 2.0;   // 距離固定 2 個身高
        if (t > 2 && t < F - 3 && t % 6 === 0) tspr('fx_hit_pierce', { x: c.x + c.f * 0.1 * c.hh, y: c.y, z: 0.5, k: 0.22, col: '255,255,255', life: 6 });
        if (t === F - 3) m.x0 = c.x; if (t > F - 3 && t <= F) { c.move(D / 3, 0); c.ghost(10); c.inv(10); }
        if (t === F) { const x0 = m.x0, x1 = c.x, y = c.y; thinLine(x0 - c.f * 0.2 * c.hh, x1 + c.f * 0.4 * c.hh, y, 0.55, 14);
          c.later(10, () => { const hs = c.hit({ shape: 'line', x: x0, y, len: D + 0.6, w: 0.55, m: 2.4, lv: 'heavy', kind: 'cut', crit: lv >= 5, col: KB }); hs.forEach(e => cutMark(e.x, e.y, (e.ratio || 1) * 0.55, rnd(-0.3, 0.3), 1.0));
            if (lv >= 3 && hs.length && H.cd) for (const kk in H.cd) if (/^m:/.test(kk)) H.cd[kk] = 0; }); } } },
    tsubame: { T: 40, run(c, t) { const lv = LVc(c); if (t === 1 && lv >= 5) c.a.T = 60; const T = c.a.T, P = lv >= 5 ? [0.18, 0.3, 0.42, 0.62, 0.74] : lv >= 3 ? [0.3, 0.48, 0.66] : [0.36, 0.58];   // Lv5＝再一次燕返（不放飛行道具）
        P.forEach((p, i) => { if (t === Math.round(T * p)) { const up = i % 2 === 1; arc(c, i === P.length - 1 ? 'master' : 'evolved', { rot: up ? -1.0 : 0.6, z: up ? 0.75 : 0.6 }); kh(c, { m: 1.0, r: 1.25, lv: i === P.length - 1 ? 'heavy' : 'mid' }); } }); } },
    special_breath: { T: 34, run(c, t) { const lv = LVc(c); if (t === 2) { c.a.mvx.hit = 1; for (let i = 0; i < 8; i++) { const a0 = i * TAU / 8; VX.custom((o, ctx) => { const s = S(H.y), k = HH() * s, q = o.t / o.life, r = (1 - q) * 0.8 * k, x = H.x + Math.cos(a0 + q * 2) * r, y = H.y - 0.6 * k + Math.sin(a0 + q * 2) * r * 0.5; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(' + KB + ',' + 0.7 * (1 - q * 0.5) + ')'; ctx.beginPath(); ctx.arc(x, y, 1.8 * s, 0, TAU); ctx.fill(); ctx.restore(); }, 20, 'o'); } }
        if (t === 16) { const d = G.RPG.d(), v = Math.round(30 * (lv >= 3 ? 1.5 : 1)); d.qi = Math.min(100, d.qi + v); if (lv >= 5) G.BUFF.add('aspd', 15, 300); G.UI.toast('氣 +' + v); } } },
    special_home: { T: 52, run(c, t) { const lv = LVc(c); if (t === 1) { c.a.T = lv >= 3 ? 70 : 52; bladeGlow(c, c.a.T - 4); } if (t === c.a.T - 6) c.a.mvx.hit = 1; },
      counter(c) { c.a.mvx.hit = 1; parry(c); arc(c, 'master', { rot: 0.4 }); kh(c, { m: 1.8, lv: 'heavy', crit: LVc(c) >= 5 }); } },
    special_return: { T: 36, run(c, t) { const lv = LVc(c), D = lv >= 3 ? 1.5 : 1.0, R = REL(c), m = c.a.mvx; if (t === R) { arc(c, 'evolved', { rot: -0.4 }); kh(c, { m: 1.4 }); m.p = [c.x + c.f * 0.8 * c.hh, c.y]; } if (t > R && t <= R + 10) c.move(-0.09 * D, 0);
        if (lv >= 5 && t === R + 60 && m.p) { cutMark(m.p[0], m.p[1], 0.5, 0.1, 1.0); c.hit({ shape: 'circle', x: m.p[0], y: m.p[1], r: 1.0, m: 0.7, lv: 'mid', kind: 'cut', col: KB }); } } },
    special_tide: { T: 46, run(c, t) { const lv = LVc(c), T = c.a.T; [0.22, 0.44, 0.66].forEach((p, i) => { const f = Math.round(T * p); if (t > f - 5 && t <= f) c.move(0.05, 0);
          if (t === f) { const x = c.x + c.f * 1.0 * c.hh; VX.thrust({ x: c.x, y: c.y, face: c.f, len: 1.5, w: 0.16, cy: 0.55, ext: 2, life: 10, col: '190,220,255', edge: '255,255,255', tip: '255,255,255', lines: 1 }); VX.wind({ x, y: c.y, r: 0.8 + i * 0.15, n: 3, life: 14, col: '150,210,255', face: c.f, spin: 0.3 });
            const last = i === 2; if (last && lv >= 5) { pullIn(c); c.later(9, () => kh(c, { shape: 'line', len: 1.6, w: 0.4, m: 0.9, lv: 'heavy' })); } else c.hit({ shape: 'line', len: 1.4 + i * 0.15, w: 0.4, m: 0.8, lv: last ? 'heavy' : 'mid', kind: 'pierce', kb: lv >= 3 ? 1.2 : 0.5, col: KB }); } }); } } };
  /* --- 秘傳 --- */
  const HK = {
    k_tsubame: ['rising_disrupt', 'return_weave', 'downward_finish', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { arc(c, 'master', { rot: -1.4, z: 0.8 }); kh(c, { m: 0.8, launch: 50, r: 1.4 }); }
      if (t === r2 || t === r2 + 5) { arc(c, 'evolved', { rot: t === r2 ? -0.6 : 0.7, z: 1.1, w: 1.5 }); kh(c, { m: 0.6, r: 1.4 }); }
      if (t === r3) { arc(c, 'master', { rot: 1.0, z: 0.8, w: 1.6 }); const x = c.x + c.f * 0.9 * c.hh; c.later(2, () => { VX.s2('fx_crack_m', { x, y: c.y, k: 0.9, sy: 0.5, l: 'g', life: 34, a: 0.9 }); SC.shake = Math.max(SC.shake || 0, 2); }); kh(c, { m: 1.8, lv: 'hiden', r: 1.5 }); } }],
    k_issen: ['step_cut', 'diagonal_lane', 'sheathed_retreat', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx;
      if (t === r1) { VX.s2('fx_dust', { x: c.x, y: c.y, k: 0.4, sy: 0.6, life: 16, a: 0.6 }); m.x0 = c.x; }
      if (t > r1 && t <= r2) { c.move(2.6 / Math.max(1, r2 - r1), 0); c.inv(8); if (t % 2 === 0) c.ghost(10); }
      if (t === r2) { thinLine(m.x0, c.x + c.f * 0.3 * c.hh, c.y, 0.55, r3 - r2 + 6); m.L = Math.abs(c.x - m.x0) / c.hh; m.x1 = c.x; }
      if (t === r3) { tspr('fx_hit_pierce', { x: c.x + c.f * 0.1 * c.hh, y: c.y, z: 0.5, k: 0.35, col: '255,255,255', life: 8 }); const hs = c.hit({ shape: 'line', x: m.x0, y: c.y, len: m.L + 0.5, w: 0.6, m: 3.0, lv: 'hiden', kind: 'cut', col: KB }); hs.forEach(e => cutMark(e.x, e.y, (e.ratio || 1) * 0.55, rnd(-0.4, 0.4), 1.2)); } }],
    k_bunshin: ['arc_step', 'turning_sweep', 'leaving_cut', (c, t, C) => { const [r1, r2, r3] = C.rel, k = c.hh;
      if (t < r1) { const a = t / r1 * Math.PI; c.move(0.08 * Math.cos(a * 0.5), 0.05 * Math.sin(a)); if (t % 3 === 0) c.ghost(8); }
      if (t === r2) { const e = near(c, 5), ex = e ? e.x : c.x + c.f * 1.5 * k, ey = e ? e.y : c.y; [-1, 1].forEach(sd => { MV2.ghostAt(ex + sd * 0.9 * k, ey + sd * 0.2 * k, -sd, 22); arc(c, 'evolved', { x: ex + sd * 0.9 * k, y: ey + sd * 0.2 * k, f: -sd, rot: 0.2 }); });
        arc(c, 'evolved', { rot: 0.2 }); c.hit({ shape: 'circle', x: ex, y: ey, r: 1.2, m: 1.4, lv: 'heavy', kind: 'cut', col: KB }); }
      if (t === r3) { arc(c, 'master', { rot: -0.3 }); const hs = kh(c, { m: 1.2, lv: 'hiden', r: 1.5 }); hs.forEach(e => cutMark(e.x, e.y, (e.ratio || 1) * 0.55, rnd(-0.4, 0.4), 1.0)); } }],
    k_raimyaku: ['open_guard', 'blade_receive', 'downward_finish', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === 2) bladeGlow(c, r2);
      if (t === r2) parry(c);
      if (t === r3) { arc(c, 'master', { rot: 0.9, z: 0.7, w: 1.5 }); kh(c, { m: 1.2, lv: 'heavy' }); near3(c, 2).forEach((e, i) => c.later(4 + i * 7, () => { const s = S(e.y), k = HH() * s; VX.bolt({ x0: e.x + rnd(-0.3, 0.3) * k, y0: e.y - 6 * k, x1: e.x, y1: e.y - 0.1 * k, life: 12, w: 3, br: 2, col: '200,220,255' });
          VX.s2('fx_sigil_raiden', { x: e.x, y: e.y, k: 0.5 * Math.min(1.6, e.ratio || 1), sy: 0.4, life: 20, l: 'g', add: 1, a: 0.9 }); G.damageOni(e, 1.6 * c.mul, true, false); VX.impact(e, 'hiden', 'cut', undefined, '200,220,255'); e.stun = Math.max(e.stun || 0, 20); c.a.mvx.hit = 1; })); } }],
    k_chidori: ['low_probe', 'rising_disrupt', 'downward_finish', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx;
      if (t === r1) { VX.thrust({ x: c.x, y: c.y, face: c.f, len: 1.5, w: 0.16, cy: 0.28, ext: 2, life: 10, col: '190,220,255', edge: '255,255,255', tip: '255,255,255', lines: 1 }); m.hs = c.hit({ shape: 'line', len: 1.6, w: 0.45, m: 0.7, lv: 'mid', kind: 'cut', col: KB }); }
      if (t === r2) { arc(c, 'master', { rot: -1.4, z: 0.8 }); kh(c, { m: 0.8, launch: 30 }); }
      if (t === r3) { arc(c, 'master', { rot: 1.0, z: 0.75 }); const hs = kh(c, { m: 1.4, lv: 'hiden' }); hs.forEach(e => { const z = (e.ratio || 1) * 0.55; cutMark(e.x, e.y, z, 0.8, 1.1); cutMark(e.x, e.y, z, -0.8, 1.1); }); } }] };
  /* ================= 野太刀（赤金、厚重） ================= */
  const NC = PAL.nodachi.c, NC2 = PAL.nodachi.c2;
  /* 上色的單位素材（fx_common／武器包）：白色刀弧 × 武器色，一般疊色不發光 */
  const UTC = {};
  function utint(u, fr, col) { const key = u.key + fr.join(',') + col; if (UTC[key]) return UTC[key]; const im = u.imgs[fr[7] || 0]; if (!im) return null; const c = document.createElement('canvas'); c.width = fr[2]; c.height = fr[3]; const g = c.getContext('2d');
    g.drawImage(im, fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(' + col + ')'; g.fillRect(0, 0, fr[2], fr[3]); g.globalCompositeOperation = 'destination-in'; g.drawImage(im, fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]); return (UTC[key] = c); }
  const uspr = o => { const life = o.life || 14; VX.custom((q, ctx) => { const u = AN.get(o.u); if (!u || !u.fx || !u.fx[o.n]) return; const r = u.fx[o.n], fr = r.f[Math.min(r.f.length - 1, Math.floor(q.t / life * r.f.length))], mw = Math.max(...r.f.map(f => f[2])), s = S(o.y), sc = o.w * HH() * s / mw, im = utint(u, fr, o.col); if (!im) return;
      ctx.save(); if (o.add) ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = o.a * Math.min(1, (q.life - q.t) / Math.max(1, life * 0.3)); ctx.translate(o.x, o.y - o.z * HH() * s); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1); ctx.drawImage(im, -fr[4] * sc, -fr[5] * sc, fr[2] * sc, fr[3] * sc); ctx.restore(); }, life, 'o'); };
  const narc = (c, lvl, o) => { o = o || {}; const f = o.f || c.f, L = lvl === 'master' ? 1.12 : lvl === 'evolved' ? 1.05 : 1; VX.ribbon(Object.assign({ x: o.x !== undefined ? o.x : c.x, y: o.y !== undefined ? o.y : c.y, face: f, r: 1.45 * L * (o.w ? o.w / 1.7 : 1), w: 0.48 * L, sw: 7, life: 18, col: '255,205,130', edge: '255,248,225', trail: 2.6, shat: 10, ew: 1.4 }, ribShape(o.rot || 0), o.rot >= 1.3 ? { r: 2.4 } : {})); };   /* 改回原本刀幕 */
  const nh = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 1.5, arc: 2.4, m: 1.0, lv: 'mid', kind: 'cut', col: NC }, o));
  const crackAt = (x, y, sz, life) => VX.s2('fx_crack_' + (sz || 'm'), { x, y, k: 0.9, sy: 0.5, l: 'g', life: life || 34, a: 0.9 });
  const dustAt = (x, y, k) => VX.s2('fx_dust', { x, y, k: k || 0.5, sy: 0.6, life: 18, a: 0.7 });
  const stars = (e, life) => VX.custom((o, ctx) => { if (e.st === 'dead') { o.t = o.life; return; } const s = S(e.y), k = HH() * s, y = e.y - (e.ratio || 1) * 1.15 * k; ctx.save(); ctx.fillStyle = 'rgba(255,230,120,.9)'; for (let i = 0; i < 3; i++) { const a = o.t * 0.12 + i * TAU / 3; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 0.18 * k, y + Math.sin(a) * 0.06 * k, 2.2 * s, 0, TAU); ctx.fill(); } ctx.restore(); }, life, 'o');
  /* --- 普攻（動作不動，換素材刀弧；第 3 段地裂素材） --- */
  const NN = [
    { run(c, t) { const f = at(c); if (t === f - 3) narc(c, 'basic', { rot: -0.3 }); if (t === f) nh(c, { m: dm(c) }); if (t > f - 4 && t < f) c.move(0.03, 0); } },
    { run(c, t) { const f = at(c); if (t === f - 3) narc(c, 'evolved', { rot: 0.6 }); if (t === f) nh(c, { m: dm(c) }); if (t > f - 4 && t < f) c.move(0.03, 0); } },
    { run(c, t) { const f = at(c); if (t === f - 3) narc(c, 'master', { rot: 1.0, z: 0.7 }); if (t === f) { const x = c.x + c.f * 1.05 * c.hh; crackAt(x, c.y, 'm'); dustAt(x, c.y, 0.6); SC.shake = Math.max(SC.shake || 0, 1); c.hit({ shape: 'circle', x, y: c.y, r: 1.0, m: dm(c), lv: 'heavy', kind: 'blunt', kb: 1.2, col: NC }); } } }];
  /* --- 招式（12） --- */
  const MN = {
    advancing_weight: { run(c, t) { const R = REL(c); if (t < R) { c.move(0.06, 0); if (t % 3 === 0) VX.spark({ x: c.x + c.f * 0.9 * c.hh, y: c.y, z: 2, n: 2, up: 1, spd: 2, col: NC2 }); } if (t === R) { narc(c, 'basic', { rot: -0.2 }); nh(c, { m: 1.0 }); } } },
    side_path: { run(c, t) { const R = REL(c); if (t < R) c.move(0, (G.IN.my || 0.6) * 0.05); if (t === 4) c.ghost(10); if (t === R) { narc(c, 'basic', { rot: 0.1, a: 0.8 }); nh(c, { m: 0.8, r: 1.3 }); } } },
    dawn_draw: { run(c, t) { if (t === REL(c)) { narc(c, 'evolved', { rot: 1.45, w: 1.9 }); c.hit({ shape: 'line', len: 2.2, w: 0.5, m: 1.2, lv: 'mid', kind: 'cut', col: NC }); } } },
    dragging_line: { run(c, t) { const R = REL(c), m = c.a.mvx; if (t < R) { c.move(0.05, 0); if (t % 5 === 0) { (m.pts = m.pts || []).push([c.x + c.f * 0.8 * c.hh, c.y]); crackAt(c.x + c.f * 0.8 * c.hh, c.y, 's', 60); } }
        if (t === R) { narc(c, 'evolved', { rot: 0.3 }); nh(c, { m: 1.0 }); const P = (m.pts || []).slice(); VX.custom(() => {}, 60, 'g', { step: (o, tt) => { if (tt % 20 === 5) P.forEach(([x, y]) => c.hit({ shape: 'circle', x, y, r: 0.45, m: 0.2, lv: 'light', kind: 'cut', col: NC })); } }); } } },
    low_ridge: { run(c, t) { if (t === REL(c)) { narc(c, 'evolved', { rot: -0.1, z: 0.3 }); dustAt(c.x + c.f * 1.0 * c.hh, c.y, 0.7); nh(c, { m: 1.0, r: 1.6, slow: 30 }); } } },
    back_turn: { run(c, t) { const R = REL(c); if (t === 3) { H.face = -H.face; c.a.face0 = H.face; } if (t === R) { narc(c, 'master', { rot: 0.2, w: 1.9 }); nh(c, { m: 1.3, lv: 'heavy' }); } } },
    retreat_peak: { run(c, t) { const R = REL(c); if (t < R - 4) { c.move(-0.8 / Math.max(1, R - 4), 0); H.hop = Math.sin(t / (R - 4) * Math.PI) * 0.35 * c.hh; } if (t === R - 4) H.hop = 0; if (t === R) { narc(c, 'master', { rot: 1.0, z: 0.75 }); nh(c, { m: 1.3, lv: 'heavy' }); } } },
    planted_break: { run(c, t) { if (t === REL(c)) { const x = c.x + c.f * 0.6 * c.hh; crackAt(x, c.y, 'l'); dustAt(x, c.y, 0.8); SC.shake = Math.max(SC.shake || 0, 1); c.hit({ shape: 'circle', x, y: c.y, r: 1.2, m: 1.4, lv: 'heavy', kind: 'blunt', kb: 1.0, col: NC }); } } },
    falling_ridge: { run(c, t) { const R = REL(c); if (t === R) { narc(c, 'master', { rot: 1.1, z: 0.8, w: 1.9 }); const x = c.x + c.f * 1.2 * c.hh; c.later(2, () => { crackAt(x, c.y, 'l'); VX.debris2 && VX.debris2({ x, y: c.y, n: 4, spd: 0.8 }); SC.shake = Math.max(SC.shake || 0, 1); }); c.hit({ shape: 'line', len: 2.2, w: 0.5, m: 1.6, lv: 'heavy', kind: 'cut', col: NC }); } } },
    sinking_charge: { run(c, t) { const R = REL(c); if (t > 2 && t < R && t % 5 === 0) dustAt(c.x, c.y, 0.3 + t / R * 0.3); if (t === R) { narc(c, 'master', { rot: 0.3, w: 2.0 }); nh(c, { m: 2.0, lv: 'heavy', r: 1.7 }); } } },
    long_line: { run(c, t) { const R = REL(c); if (t === R) { narc(c, 'evolved', { rot: 1.5, w: 1.6 }); const x0 = c.x, y = c.y, f = c.f, k = c.hh; c.later(18, () => { for (let i = 0; i < 4; i++) c.later(i * 2, () => cutMark(x0 + f * (0.8 + i * 0.6) * k, y, 0.3, rnd(-0.3, 0.3), 0.7, '255,200,120')); c.hit({ shape: 'line', x: x0, y, len: 3.2, w: 0.4, m: 1.6, lv: 'heavy', kind: 'cut', col: NC }); }); } } },
    opening_brace: { run(c, t) { if (t === 2) bladeGlow(c, 28); if (t === 28) c.a.mvx.hit = 1; }, counter(c) { c.a.mvx.hit = 1; parry(c); narc(c, 'master', { rot: 0.3 }); nh(c, { m: 1.7, lv: 'heavy', kb: 1.4 }); } } };
  /* 月牙劍氣（月輪） */
  function moonBlade(c, dy, ret, m) { const x0 = c.x, y = c.y + dy * c.hh, f = c.f, R = 7 * c.hh, sk = []; let d = 0, back = false;
    VX.custom((o, ctx) => { const x = x0 + f * d; drawFC(ctx, 'skill_wind_blade_a', Math.floor(o.t / 3) % 4, x, y - 0.6 * HH() * S(y), 1.3, 0, Math.min(1, (o.life - o.t) / 6), f < 0); }, ret ? 44 : 22, 'o',
      { step: () => { d += (back ? -1 : 1) * R / 22; if (ret && !back && d >= R) { back = true; sk.length = 0; } const x = x0 + f * d; c.hit({ shape: 'circle', x, y, r: 0.6, m: m || 1.0, lv: 'mid', kind: 'cut', col: NC, skip: sk }).forEach(e => sk.push(e)); } }); }
  /* --- 技能 --- */
  const UN = {
    skill_daisharin: { T: 64, run(c, t) { const lv = LVc(c), n = lv >= 3 ? 6 : 4, T = c.a.T, g = Math.round(T * 0.8 / n);
        for (let i = 0; i < n; i++) if (t === 4 + i * g) { narc(c, 'evolved', { rot: 0.2, w: 1.6 }); if (i % 2) narc(c, 'evolved', { dx: -0.6, rot: 0.2, f: -c.f, w: 1.4, a: 0.6 }); dustAt(c.x, c.y, 0.5); c.hit({ shape: 'circle', r: 1.5, m: 0.9, lv: i === n - 1 ? 'heavy' : 'mid', kind: 'cut', col: NC }); c.move(0.04, 0); }
        if (lv >= 5 && t === 6 + n * g) { VX.s2('fx_dust', { x: c.x, y: c.y, k: 1.4, sy: 0.6, life: 24, a: 0.8 }); c.hit({ shape: 'circle', r: 2.4, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 2, col: NC }); SC.shake = Math.max(SC.shake || 0, 1); } } },
    skill_haousan: { T: 64, run(c, t) { const lv = LVc(c), F = FT(c, 4); if (t === 1 && lv >= 3) c.inv(F + 4);
        if (t === 8) crackAt(c.x, c.y, 's', F); if (t === Math.round(F * 0.6)) crackAt(c.x, c.y, 'm', F - Math.round(F * 0.6) + 4);
        if (t > F - 6 && t < F) c.move(0.08, 0);
        if (t === F) { narc(c, 'master', { rot: 1.1, z: 0.8, w: 2.0 }); const x = c.x + c.f * 1.0 * c.hh; c.later(2, () => { crackAt(x, c.y, 'l', 50); VX.debris2 && VX.debris2({ x, y: c.y, n: 6, spd: 1 }); dustAt(x, c.y, 0.9); SC.shake = Math.max(SC.shake || 0, 1); });
          c.hit({ shape: 'circle', x, y: c.y, r: 1.4, m: 2.6, lv: 'heavy', kind: 'blunt', kb: 1.2, col: NC });
          if (lv >= 5) { VX.s2('fx_crack_glow_m', { x, y: c.y, k: 0.9, sy: 0.5, l: 'g', life: 120, a: 0.9 }); VX.custom(() => {}, 120, 'g', { step: (o, tt) => { if (tt % 30 === 15) c.hit({ shape: 'circle', x, y: c.y, r: 1.1, m: 0.3, lv: 'light', kind: 'blunt', col: NC }); } }); } } } },
    skill_zantetsu: { T: 40, run(c, t) { const lv = LVc(c), F = FT(c, 3);
        if (t === F) { narc(c, 'master', { rot: 0.15, w: 2.0 }); const x = c.x + c.f * 0.9 * c.hh; VX.shard({ x, y: c.y, z: 0.55, n: 8, col: '230,230,240' }); VX.spark({ x, y: c.y, z: 0.55 * c.hh, n: 10, spd: 6, col: NC2 });
          const hs = c.hit({ shape: 'sector', r: 1.6, arc: 2, m: 2.6, lv: 'heavy', kind: 'cut', ign: lv >= 3 ? 80 : 50, col: NC }); if (lv >= 5) hs.forEach(e => { if (e.boss || e.bb) G.damageOni(e, 1.3 * c.mul, true, false, { ign: 80 }); }); } } },
    special_backline: { T: 34, run(c, t) { const lv = LVc(c), F = FT(c, 3); if (t === 4) { H.face = -H.face; c.a.face0 = H.face; c.ghost(10); }
        if (t === F) { narc(c, 'master', { rot: 0.2 }); const hs = nh(c, { m: 1.6, stun: lv >= 5 ? 60 : 0, lv: 'heavy' }); if (lv >= 5) hs.forEach(e => stars(e, 60)); if (lv >= 3) G.BUFF.add('dr', 20, 120); } } },
    special_break: { T: 42, run(c, t) { const lv = LVc(c), F = FT(c, 3); if (t === F) { narc(c, 'master', { rot: 0.9, z: 0.7 }); const T2 = lv >= 5 ? 360 : 180, hs = nh(c, { m: 1.8, def: lv >= 3 ? 30 : 20, lv: 'heavy' });
          hs.forEach(e => { e.db = e.db || {}; e.db.defT = T2; VX.shard({ x: e.x, y: e.y, z: (e.ratio || 1) * 0.5, n: 8, col: '200,205,220' });
            VX.custom((o, ctx) => { if (e.st === 'dead' || !(e.db && e.db.defT > 0)) { o.t = o.life; return; } const s = S(e.y), y = e.y - (e.ratio || 1) * 1.2 * HH() * s; VX.draw2(ctx, 'fx_ico_guard', 0, e.x, y, 0.35, { a: 0.9 }); ctx.save(); ctx.strokeStyle = 'rgba(255,80,60,.9)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(e.x - 6 * s, y - 14 * s); ctx.lineTo(e.x + 6 * s, y - 2 * s); ctx.stroke(); ctx.restore(); }, T2, 'o'); }); } } },
    special_drawline: { T: 40, run(c, t) { const lv = LVc(c), D = lv >= 3 ? 4.5 : 3, F = FT(c, 3);
        if (t === F) { narc(c, 'evolved', { rot: 1.5 }); const x0 = c.x, y0 = c.y, f = c.f, k = c.hh;
          VX.custom((o, ctx) => { const s = S(y0), a = Math.min(1, o.t / 6) * 0.45; ctx.save(); ctx.strokeStyle = 'rgba(' + NC + ',' + a + ')'; ctx.lineWidth = 1.5 * s; ctx.setLineDash([6 * s, 5 * s]); ctx.beginPath(); ctx.moveTo(x0 + f * 0.4 * k, y0); ctx.lineTo(x0 + f * (D + 0.4) * k, y0); ctx.stroke(); ctx.restore(); }, lv >= 5 ? 78 : 62, 'g');
          const go = () => { for (let i = 0; i < 5; i++) c.later(i * 2, () => cutMark(x0 + f * (0.6 + i * D / 5) * k, y0, 0.3, rnd(-0.4, 0.4), 0.75, '255,200,120')); c.hit({ shape: 'line', x: x0, y: y0, len: D + 0.4, w: 0.45, m: 1.6, lv: 'heavy', kind: 'cut', col: NC }); };
          c.later(60, go); if (lv >= 5) c.later(76, go); } } },
    special_leave: { T: 38, run(c, t) { const lv = LVc(c), D = lv >= 3 ? 1.4 : 1.0, F = FT(c, 2), m = c.a.mvx;
        if (t === F) { narc(c, 'evolved', { rot: -0.3 }); nh(c, { m: 1.4 }); m.p = [c.x, c.y]; }
        if (t > F && t <= F + 12) { c.move(-D / 12, 0); H.hop = Math.sin((t - F) / 12 * Math.PI) * 0.3 * c.hh; } if (t === F + 13) { H.hop = 0; dustAt(c.x, c.y, 0.5);
          if (lv >= 5) { dustAt(c.x, c.y, 1.0); c.hit({ shape: 'circle', r: 1.2, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 1.5, col: NC }); } } } } };
  /* --- 秘傳 --- */
  const HN = {
    n_tendan: ['dawn_draw', 'retreat_peak', 'falling_ridge', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { narc(c, 'evolved', { rot: 1.45, w: 1.9 }); c.hit({ shape: 'line', len: 2.2, w: 0.5, m: 0.8, lv: 'mid', kind: 'cut', col: NC }); }
      if (t > r1 && t < r3) { const u = (t - r1) / (r3 - r1); if (t < r2) c.move(-0.03, 0); H.hop = Math.sin(u * Math.PI) * 0.7 * c.hh; }
      if (t === r3) { H.hop = 0; narc(c, 'master', { rot: 1.2, z: 1.0, w: 2.4 }); const x = c.x + c.f * 1.2 * c.hh; c.later(2, () => { crackAt(x, c.y, 'l', 60); VX.s2('fx_pillar', { x, y: c.y, k: 0.9, life: 14, add: 1, a: 0.85 }); VX.debris2 && VX.debris2({ x, y: c.y, n: 6, spd: 1 }); SC.shake = Math.max(SC.shake || 0, 3); });
        c.hit({ shape: 'circle', x, y: c.y, r: 1.6, m: 3.0, lv: 'hiden', kind: 'cut', col: NC }); } }],
    n_guruma: ['advancing_weight', 'back_turn', 'sinking_charge', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t < r1) c.move(0.05, 0); if (t === r1) { narc(c, 'basic', { rot: -0.2 }); nh(c, { m: 0.8 }); }
      if (t === r2) { narc(c, 'master', { rot: 0.2 }); narc(c, 'master', { dx: -0.6, f: -c.f, rot: 0.2 }); c.hit({ shape: 'circle', r: 1.5, m: 1.0, lv: 'mid', kind: 'cut', col: NC }); }
      for (let i = 0; i < 3; i++) if (t === r3 + i * 6) { narc(c, 'evolved', { rot: 0.2, w: 1.9 }); narc(c, 'evolved', { dx: -0.6, f: -c.f, rot: 0.2, w: 1.9 }); dustAt(c.x, c.y, 0.7); c.hit({ shape: 'circle', r: 1.7, m: 0.9, lv: i === 2 ? 'hiden' : 'heavy', kind: 'cut', col: NC }); } }],
    n_dangaku: ['planted_break', 'dragging_line', 'falling_ridge', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx;
      if (t === r1) { crackAt(c.x + c.f * 0.6 * c.hh, c.y, 'm', r3 - r1 + 20); dustAt(c.x + c.f * 0.6 * c.hh, c.y, 0.6); c.hit({ shape: 'circle', x: c.x + c.f * 0.6 * c.hh, y: c.y, r: 1.0, m: 0.8, lv: 'mid', kind: 'blunt', col: NC }); }
      if (t > r1 && t < r3) { c.move(0.04, 0); if (t % 5 === 0) { (m.pts = m.pts || []).push([c.x + c.f * 0.7 * c.hh, c.y]); crackAt(c.x + c.f * 0.7 * c.hh, c.y, 's', r3 - t + 20); } }
      if (t === r3) { narc(c, 'master', { rot: 1.1, z: 0.8, w: 2.0 }); (m.pts || []).forEach(([x, y], i) => c.later(i * 2, () => { VX.s2('fx_crack_glow_s', { x, y, k: 0.9, sy: 0.5, l: 'g', life: 20, a: 0.95 }); VX.debris2 && VX.debris2({ x, y, n: 2, spd: 0.6 }); c.hit({ shape: 'circle', x, y, r: 0.7, m: 0.7, lv: 'heavy', kind: 'blunt', col: NC }); })); SC.shake = Math.max(SC.shake || 0, 2); } }],
    n_haou: ['low_ridge', 'advancing_weight', 'sinking_charge', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { narc(c, 'evolved', { rot: -0.1, z: 0.3 }); dustAt(c.x + c.f * c.hh, c.y, 0.7); nh(c, { m: 0.8, r: 1.6 }); }
      if (t > r1 && t < r2) c.move(0.05, 0); if (t === r2) { narc(c, 'basic', { rot: -0.2 }); nh(c, { m: 0.8 }); }
      if (t > r2 && t < r3 && t % 5 === 0) dustAt(c.x, c.y, 0.4 + (t - r2) / (r3 - r2) * 0.4);
      if (t === r3) { narc(c, 'master', { rot: 0.9, z: 0.8, w: 2.4 }); const x = c.x + c.f * 1.3 * c.hh; c.later(2, () => { crackAt(x, c.y, 'l', 60); VX.debris2 && VX.debris2({ x, y: c.y, n: 9, spd: 1.2, up: 1.4 }); dustAt(x, c.y, 1.2); SC.shake = Math.max(SC.shake || 0, 3); });
        c.hit({ shape: 'circle', x, y: c.y, r: 1.8, m: 3.0, lv: 'hiden', kind: 'blunt', kb: 2, col: NC }); } }],
    n_yuuhi: ['side_path', 'long_line', 'dawn_draw', (c, t, C) => { const [r1, r2, r3] = C.rel, m = c.a.mvx, SU = '255,140,70';
      if (t < r1) c.move(0, (G.IN.my || 0.6) * 0.04); if (t === r1) narc(c, 'basic', { rot: 0.1, a: 0.8 });
      if (t === r2) { m.x0 = c.x; m.y0 = c.y; m.f = c.f; const x0 = c.x, y0 = c.y, f = c.f, k = c.hh, L = 5;
        VX.custom((o, ctx) => { const s = S(y0), a = Math.min(1, o.t / 6) * 0.7; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x0, y0, x0 + f * L * k, y0); g.addColorStop(0, 'rgba(' + SU + ',' + a + ')'); g.addColorStop(1, 'rgba(' + NC + ',0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x0 + f * L * k), y0 - 0.55 * k - 1 * s, L * k, 2 * s); ctx.restore(); }, r3 - r2 + 4, 'o'); }
      if (t === r3 && m.x0 !== undefined) { narc(c, 'evolved', { rot: 1.45, w: 2.0 }); const { x0, y0, f } = m, k = c.hh; for (let i = 0; i < 8; i++) c.later(i * 2, () => cutMark(x0 + f * (0.6 + i * 0.6) * k, y0, 0.55, rnd(-0.2, 0.2), 0.9, i % 2 ? SU : '255,200,120'));
        c.hit({ shape: 'line', x: x0, y: y0, len: 5.2, w: 0.55, m: 3.0, lv: 'hiden', kind: 'cut', col: SU }); } }] };
  /* ================= 薙刀（青綠、風）＆ 槍（冷白藍、直線） ================= */
  const GC = '150,235,205', GE = '235,255,248', YC = '190,215,255', YE = '255,255,255';
  const grib = (c, o) => { o = o || {}; VX.ribbon(Object.assign({ x: c.x, y: c.y, face: c.f, r: 1.5, w: 0.34, sq: 0.45, sw: 6, life: 16, a0: -2.4, a1: 1.1, col: GC, edge: GE, trail: 2.4, shat: 6 }, o)); };
  const gwind = (c, r, n) => VX.wind({ x: c.x, y: c.y, r: r || 1.4, n: n || 4, life: 16, col: '200,255,235', face: c.f, spin: 0.35 });
  const gh = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 1.6, arc: 2.6, m: 1.0, lv: 'mid', kind: 'cut', col: GC }, o));
  const ythr = (c, o) => { o = o || {}; VX.thrust(Object.assign({ x: c.x, y: c.y, face: c.f, len: 1.8, w: 0.2, cy: 0.55, ext: 2, life: 10, col: YC, edge: YE, tip: '255,230,160', lines: 1 }, o)); };
  const yh = (c, o) => c.hit(Object.assign({ shape: 'line', len: 1.9, w: 0.4, m: 1.0, lv: 'mid', kind: 'pierce', col: YC }, o));
  const strike = (c, e, m, col) => { const s = S(e.y), k = HH() * s; VX.bolt({ x0: e.x + rnd(-0.3, 0.3) * k, y0: e.y - 6 * k, x1: e.x, y1: e.y - 0.1 * k, life: 12, w: 3, br: 2, col: col || '200,220,255' });
    VX.s2('fx_sigil_raiden', { x: e.x, y: e.y, k: 0.5 * Math.min(1.6, e.ratio || 1), sy: 0.4, life: 20, l: 'g', add: 1, a: 0.9 }); G.damageOni(e, m * c.mul, true, false); VX.impact(e, 'hiden', 'cut', undefined, col || '200,220,255'); e.stun = Math.max(e.stun || 0, 20); c.a.mvx.hit = 1; };
  /* 拉回（通用，限 2.2～2.6H、非頭目、0.15 秒到身前 0.9H） */
  const pullTo = (c, R, col) => { const tx = c.x + c.f * 0.9 * c.hh; for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss || Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) > R * c.hh) continue; const x0 = e.x, y0 = e.y; let n = 0;
      VX.custom((o, ctx) => { const s = S(e.y); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(' + col + ',' + (1 - o.t / o.life) * 0.6 + ')'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(e.x, e.y - 0.3 * HH() * s); ctx.lineTo(tx, c.y - 0.3 * HH() * s); ctx.stroke(); ctx.restore(); }, 9, 'o', { step: () => { if (n++ < 9 && e.st !== 'dead') { e.kb = 0; e.x += (tx - x0) / 9; e.y += (c.y - y0) / 9 * 0.5; } } }); } };
  const U0 = { g: Object.assign({}, MV2.U.naginata || {}), y: Object.assign({}, MV2.U.yari || {}) };
  /* --- 薙刀技能（修正 Lv5 說明效果） --- */
  const UG = {
    skill_enbu: { run(c, t) { U0.g.skill_enbu.run.call(this, c, t); const lv = LVc(c), n = 5 + (lv >= 3 ? 2 : 0); if (lv >= 5) for (let i = 0; i < n; i++) if (t === 4 + i * 6) { const d = G.RPG.d(); d.qi = Math.min(100, d.qi + 1); } } },
    skill_senpu: { T: 40, run(c, t) { const lv = LVc(c), r = lv >= 3 ? 2.0 : 1.54; if (t === 9) { grib(c, { a0: -2.9, a1: 1.5, r, w: 0.42, sw: 7 }); gwind(c, r, 6); gh(c, { r: r + 0.15, arc: 3.1, m: 1.4, lv: 'heavy', kb: 1.6 }); }
        if (lv >= 5 && t === 22) { gwind(c, 2.2, 6); pullTo(c, 2.6, '200,255,235'); } } },
    special_upright: { run(c, t) { U0.g.special_upright.run.call(this, c, t); if (LVc(c) < 5) return; const B = G.BOSS; if (!B || !B.proj) return;   // Lv5：擋下並反射遠程
        for (const p of B.proj) { if (p.dead || p.mine) continue; const dx = (p.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * c.hh && Math.abs(p.y - H.y) < 0.6 * c.hh) { p.dead = 1; const src = p.e; VX.spark({ x: p.x, y: p.y, z: 0.6 * c.hh, n: 10, spd: 6, col: GE });
            if (src && src.st !== 'dead') c.shoot('arrow', { m: 1.5, home: src, turn: 0.3, spd: 0.6, col: GC, lv: 'heavy' }); c.a.mvx.hit = 1; } } } } };
  /* --- 槍技能 --- */
  const UY2 = {
    special_deny: { T: 124, run(c, t) { const lv = LVc(c); if (t === 1) c.a.T = lv >= 3 ? 184 : 124;   // 架槍頂住：靠近的敵人被平順擋在 1.6H 外（不再瞬移跳動）
        if (t === 1) VX.custom((o, ctx) => { const s = S(H.y), k = HH() * s, a = Math.min(1, o.t / 8, (o.life - o.t) / 10) * 0.45, x = H.x + o.f * 1.5 * k; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, H.y - 1.1 * k, x, H.y); g.addColorStop(0, 'rgba(' + YC + ',0)'); g.addColorStop(0.5, 'rgba(' + YC + ',' + a + ')'); g.addColorStop(1, 'rgba(' + YC + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - 1.5 * s, H.y - 1.1 * k, 3 * s, 1.1 * k); ctx.restore(); }, c.a.T, 'o', { f: c.f });
        for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss) continue; const dx = (e.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * c.hh && Math.abs(e.y - H.y) < 0.45 * c.hh) { e.x += (H.x + c.f * 1.6 * c.hh - e.x) * 0.35; if (t % 20 === 0) VX.spark({ x: H.x + c.f * 1.5 * c.hh, y: e.y, z: 0.5 * c.hh, n: 3, spd: 3, col: YE }); } }
        if (t === 30) c.a.mvx.hit = 1; } } };
  /* --- 秘傳（薙刀 5、槍 5）：一段一重點，沿用原本程式特效 --- */
  const HG = {
    g_kuen: ['retreat_swallow', 'fan_sweep', 'reverse_whirl', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t < r1) c.move(-0.04, 0); if (t === r1) { MV2.swallow && MV2.swallow(c, 2); gh(c, { m: 0.6 }); }
      if (t === r2) { grib(c, { a0: -2.9, a1: 1.5, r: 1.8, w: 0.4, sw: 7 }); gwind(c, 1.8, 5); gh(c, { r: 1.9, arc: 3.1, m: 1.0 }); }
      if (t === r3) { grib(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.7, w: 0.4, sw: 8, life: 18 }); VX.custom(() => {}, 60, 'o', { step: (o, tt) => { if (tt % 8 === 0) gwind(c, 1.8, 5); if (tt % 15 === 0) c.hit({ shape: 'circle', r: 1.8, m: 0.4, lv: tt >= 45 ? 'hiden' : 'mid', kind: 'cut', col: GC }); } }); } }],
    g_ranyou: ['around_diagonal', 'reverse_leaf', 'low_leaf', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { grib(c, { a0: -2.4, a1: 1.1, rot: -0.3 }); MV2.leaves && MV2.leaves(c, 4); gh(c, { m: 0.8 }); }
      if (t === r2) { grib(c, { a0: 1.2, a1: -1.9, sq: 0.9 }); MV2.leaves && MV2.leaves(c, 4); gh(c, { m: 0.8, launch: 24 }); }
      if (t === r3) { grib(c, { a0: -2.9, a1: 1.5, r: 1.9, sq: 0.3, cy: 0.3, w: 0.42 }); MV2.leaves && MV2.leaves(c, 10); gh(c, { r: 2.0, arc: 3.1, m: 1.6, lv: 'hiden', slow: 40 }); } }],
    g_fuujin: ['gliding_wing', 'reverse_leaf', 'sinking_leaf', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t < r1) { c.move(0.09, 0); if (t % 3 === 0) c.ghost(8); } if (t === r1) { grib(c); gh(c, { m: 0.7 }); }
      if (t === r2) { grib(c, { a0: 1.2, a1: -1.9, sq: 1 }); gh(c, { m: 0.8, launch: 40 }); }
      if (t > r2 && t < r3) H.hop = Math.sin((t - r2) / (r3 - r2) * Math.PI) * 0.5 * c.hh;
      if (t === r3) { H.hop = 0; grib(c, { a0: -2.0, a1: 0.9, sq: 1, r: 1.7, w: 0.44 }); const x = c.x + c.f * 0.9 * c.hh; VX.s2('fx_dust', { x, y: c.y, k: 0.9, sy: 0.6, life: 20, a: 0.8 }); gwind(c, 2.0, 7); SC.shake = Math.max(SC.shake || 0, 2); c.hit({ shape: 'circle', x, y: c.y, r: 1.6, m: 2.2, lv: 'hiden', kind: 'cut', kb: 1.4, col: GC }); } }],
    g_sougetsu: ['side_wave', 'fan_sweep', 'wide_leaf', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t < r1) c.move(0, (G.IN.my || 0.6) * 0.04); if (t === r1) { grib(c, { rot: 0.2 }); gh(c, { m: 0.7 }); }
      if (t === r2) { grib(c, { a0: -2.9, a1: 1.5, r: 1.8 }); gh(c, { r: 1.9, m: 0.9 }); }
      if (t === r3) { grib(c, { a0: -2.9, a1: 1.5, r: 2.0, w: 0.4, rot: -0.25 }); grib(c, { a0: -2.9, a1: 1.5, r: 2.0, w: 0.4, rot: 0.25, face: -c.f }); gwind(c, 2.0, 6); c.hit({ shape: 'circle', r: 2.1, m: 2.0, lv: 'hiden', kind: 'cut', col: GC }); } }],
    g_narukami: ['wing_brace', 'fan_sweep', 'reverse_whirl', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) gwind(c, 1.2, 5); if (t === r2) { grib(c, { a0: -2.9, a1: 1.5, r: 1.8 }); gh(c, { r: 1.9, m: 0.9 }); }
      if (t === r3) { grib(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.7, sw: 8 }); c.hit({ shape: 'circle', r: 1.8, m: 0.8, lv: 'mid', kind: 'cut', col: GC }); near3(c, 3).forEach((e, i) => c.later(6 + i * 7, () => { if (e.st !== 'dead') strike(c, e, 1.4); })); } }] };
  const HY2 = {
    y_hyakusen: ['tip_probe', 'double_thrust', 'focused_point', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { ythr(c, { len: 1.6 }); yh(c, { m: 0.6 }); }
      if (t === r2 || t === r2 + 4) { ythr(c, { ang: t === r2 ? -0.06 : 0.06 }); yh(c, { m: 0.6 }); }
      if (t > r2 + 6 && t < r3 && (t - r2) % 3 === 0) { ythr(c, { len: 1.8, w: 0.14, life: 6, ang: rnd(-0.12, 0.12), cy: 0.55 + rnd(-0.08, 0.08), lines: 0 }); yh(c, { m: 0.2, lv: 'light' }); }
      if (t === r3) { ythr(c, { len: 2.6, w: 0.3, life: 14, ext: 3 }); const hs = yh(c, { len: 2.7, m: 2.2, lv: 'hiden', kb: 1.2 }); hs.forEach(e => VX.ring({ x: e.x, y: e.y, z: (e.ratio || 1) * 0.55, sq: 1, r0: 0.1, r1: 0.6, life: 12, col: YC, lw: 0.05 })); } }],
    y_shoryu: ['rising_point', 'double_thrust', 'focused_point', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { ythr(c, { ang: -0.9, len: 1.5 }); yh(c, { ang: -0.9, m: 0.8, launch: 40, hw: 0.6 }); }
      if (t === r2 || t === r2 + 4) { ythr(c, { ang: -0.5 }); yh(c, { m: 0.6 }); }
      if (t === r3) { ythr(c, { ang: -1.0, len: 1.6, w: 0.28 }); yh(c, { ang: -1.0, m: 2.2, lv: 'hiden', launch: 60, hw: 0.7 }); const x0 = c.x + c.f * 0.9 * c.hh, y0 = c.y, f = c.f, k = c.hh;
        MV2.dragon && MV2.dragon(tt => tt <= 0 ? [x0, y0, 0] : [x0 + f * Math.sin(tt * 0.22) * 0.35 * k, y0, Math.min(tt, 30) * 0.2 * k + Math.max(0, tt - 30) * 0.08 * k], { life: 44, len: 15, w: 0.42, pal: 'azure', fade: 32 }); } }],
    y_ryusei: ['long_pierce', 'side_gap', 'focused_point', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t < r1) { c.move(0.1, 0); if (t % 3 === 0) c.ghost(8); } if (t === r1) { ythr(c, { len: 2.2 }); yh(c, { len: 2.3, m: 0.8 }); }
      if (t === r2) { ythr(c); yh(c, { m: 0.7 }); }
      if (t > r2 && t < r3) H.hop = Math.sin((t - r2) / (r3 - r2) * Math.PI) * 0.6 * c.hh;
      if (t === r3) { H.hop = 0; const x = c.x + c.f * 0.6 * c.hh; ythr(c, { ang: 1.2, len: 1.2, w: 0.3 }); VX.s2('fx_crack_m', { x, y: c.y, k: 0.8, sy: 0.5, l: 'g', life: 40, a: 0.9 }); VX.s2('fx_dust', { x, y: c.y, k: 0.9, sy: 0.6, life: 20, a: 0.8 }); SC.shake = Math.max(SC.shake || 0, 2);
        c.hit({ shape: 'circle', x, y: c.y, r: 1.4, m: 2.4, lv: 'hiden', kind: 'pierce', kb: 1, col: YC }); } }],
    y_kaiten: ['ground_sweep', 'shaft_gate', 'ground_sweep', (c, t, C) => { const [r1, r2, r3] = C.rel;
      const sweep = (lv, m) => { grib(c, { a0: Math.PI, a1: -Math.PI * 1.03, r: 1.6, w: 0.3, sw: 8, col: YC, edge: YE, cy: 0.3 }); VX.s2('fx_dust', { x: c.x, y: c.y, k: 0.9, sy: 0.6, life: 18, a: 0.7 }); c.hit({ shape: 'circle', r: 1.7, m, lv, kind: 'blunt', kb: 1.0, col: YC }); };
      if (t === r1) sweep('mid', 0.8);
      if (t === r2) { VX.spark({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.6 * c.hh, n: 8, spd: 5, col: YE }); for (const e of G.E) if (e.st !== 'dead' && !e.boss && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < 1.6 * c.hh) e.stun = Math.max(e.stun || 0, 30); }
      if (t === r3) sweep('hiden', 2.0); }],
    y_bakuryu: ['intercept_thrust', 'pulling_retreat', 'shaft_break', (c, t, C) => { const [r1, r2, r3] = C.rel;
      if (t === r1) { ythr(c); yh(c, { m: 0.7 }); }
      if (t === r2) { pullTo(c, 2.4, YC); c.move(-0.05, 0); }
      if (t === r3) { ythr(c, { len: 1.4, w: 0.34, life: 12 }); const x = c.x + c.f * 0.8 * c.hh; VX.spark({ x, y: c.y, z: 0.6 * c.hh, n: 12, spd: 6, col: YE }); VX.s2('fx_dust', { x, y: c.y, k: 0.7, sy: 0.6, life: 18, a: 0.7 }); SC.shake = Math.max(SC.shake || 0, 2);
        c.hit({ shape: 'circle', x, y: c.y, r: 1.3, m: 2.4, lv: 'hiden', kind: 'blunt', kb: 2.0, stun: 40, col: YC }); } }] };
  const SET = { yumi: { N: NY, M: MY, U: UY, H: HY }, teppo: { N: NT, M: MT, U: UT, H: HT }, katana: { N: null, M: MK, U: UK, H: HK }, nodachi: { N: NN, M: MN, U: UN, H: HN }, naginata: { N: null, M: {}, U: UG, H: HG }, yari: { N: null, M: {}, U: UY2, H: HY2 } }, ORIG = {};
  function apply() { for (const wid in SET) { const S0 = SET[wid], O = ORIG[wid] = ORIG[wid] || { N: MV2.N[wid], D: {}, U: {} }, want = on(wid);
      for (const k in S0.M) if (!(k in O.D)) O.D[k] = MV2.D[wid][k]; for (const k in S0.U) if (!(k in O.U)) O.U[k] = MV2.U[wid] && MV2.U[wid][k];
      if (S0.N) MV2.N[wid] = want ? S0.N : O.N;
      for (const k in S0.M) if (S0.M[k] && O.D[k]) MV2.D[wid][k] = want ? Object.assign({}, O.D[k], S0.M[k]) : O.D[k];
      for (const k in S0.U) if (S0.U[k] && MV2.U[wid] && O.U[k]) MV2.U[wid][k] = want ? Object.assign({}, O.U[k], S0.U[k]) : O.U[k];
      if (W.curId() === wid) hiden(want, wid, S0.H); } }
  let lastKey = '';
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); const key = labOn() + '|' + LAB.neu + '|' + W.curId(); if (key !== lastKey) { lastKey = key; try { apply(); } catch (x) { console.warn('lab', x); } } panel(); if (!H.act) { LAB.jz = 0; if (on()) H.hop = 0; } };

  /* ---------- 試做面板（DOM） ---------- */
  let P = null;
  function play(k, id) { const d = G.RPG.d(); d.qi = 100; d.wsk = d.wsk || {}; G.H.cd = {}; G.H.act = null; G.H.st = 'idle'; G.H.hidenRdy = null; LAB.last = [k, id];
    if (k === 'n') { G.IN.atk = true; let i = 0; const nx = () => { if (++i < 3) G.STORY.later(26, () => { G.IN.atk = true; nx(); }); }; nx(); return; }
    if (k === 'sk') { const s = W.cur().SK[id]; d.wsk[W.key(id)] = LAB.lv; if (s.t === '奧義') G.IN.ult = true; else { W.slots().A = id; G.IN.skA = true; } }
    if (k === 'mv') { W.setChain(0, 0, id); W.setChain(0, 1, null); W.setChain(0, 2, null); G.H.chainSt = null; G.IN.c1 = true; }
    if (k === 'hd') MV2.play(id); }
  function dummies() { for (const e of G.E) { e.hp = 0; e.st = 'dead'; e.alpha = 0; } G.E = []; const x = G.H.x + G.H.face * 220;
    for (let i = 0; i < 3; i++) { const p = SC.snap ? SC.snap(x + G.H.face * i * 70, G.H.y + (i - 1) * 24, 'walk', 200) : null; const e = G.spawnOni(p ? p[0] : x, p ? p[1] : G.H.y, 0, 5, 'akaoni'); e.hp = e.hpMax = 99999; e.atk = 0; e.delay = 0; e.spd = 0; } }
  function panel() { const show = false && G.mode === 'play' && !(G.MENU && G.MENU.open);
    if (!P) { if (!show) return; P = document.createElement('div'); P.id = 'lab';
      P.style.cssText = 'position:fixed;right:calc(var(--sar) + 6px);top:calc(var(--sat) + 52px);width:200px;max-height:calc(100% - 120px);overflow:auto;background:rgba(14,10,12,.86);color:#f3e8d2;font:600 12px "Noto Sans TC",sans-serif;border:1px solid rgba(227,194,122,.5);border-radius:8px;padding:6px;z-index:4;touch-action:pan-y;';
      ['pointerdown', 'pointerup', 'touchstart', 'wheel'].forEach(ev => P.addEventListener(ev, e => e.stopPropagation(), { passive: true })); document.body.appendChild(P); P._k = ''; }
    P.style.display = show ? 'block' : 'none'; if (!show) return;
    const wp = W.cur(), key = wp.id + LAB.neu + LAB.lv; if (P._k === key) return; P._k = key; const ok = DONE.includes(wp.id);
    const b = (t, f, hi) => { const x = document.createElement('button'); x.textContent = t; x.style.cssText = 'display:block;width:100%;margin:2px 0;padding:6px 4px;border:1px solid rgba(227,194,122,.35);border-radius:5px;background:' + (hi ? 'rgba(227,194,122,.35)' : 'rgba(255,255,255,.06)') + ';color:#f3e8d2;font:inherit;text-align:left;'; x.onclick = f; return x; };
    const row = L => { const r = document.createElement('div'); r.style.cssText = 'display:flex;gap:3px;'; L.forEach(x => { x.style.flex = '1'; x.style.textAlign = 'center'; r.appendChild(x); }); return r; };
    const h = t => { const x = document.createElement('div'); x.textContent = t; x.style.cssText = 'color:#e3c27a;margin:6px 0 2px;'; return x; };
    P.innerHTML = ''; P.appendChild(h('招式試做・' + wp.n + (ok ? '' : '（此武器尚未試做）')));
    P.appendChild(row([b('新版', () => { LAB.neu = true; }, LAB.neu), b('舊版', () => { LAB.neu = false; }, !LAB.neu)]));
    P.appendChild(row([1, 3, 5].map(v => b('Lv' + v, () => { LAB.lv = v; }, LAB.lv === v))));
    P.appendChild(row([b('放靶', dummies), b('重播', () => LAB.last && play(...LAB.last))]));
    P.appendChild(h('普攻')); P.appendChild(b('普攻三段', () => play('n', 'N')));
    P.appendChild(h('招式')); for (const id in wp.MV) P.appendChild(b(wp.MV[id].n, () => play('mv', id)));
    P.appendChild(h('技能・特技・奧義')); for (const id in wp.SK) P.appendChild(b(wp.SK[id].n + '（' + wp.SK[id].t + '）', () => play('sk', id)));
    P.appendChild(h('秘傳')); for (const hd of MV2.HD[wp.id] || []) P.appendChild(b(hd.n, () => play('hd', hd.id))); }
})();
