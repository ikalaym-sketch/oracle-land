/* ==========================================================================
 * 神諭之地 重製版 — 112_nodachi.js
 * Version : r3.194.0  (2026-11-28)　r3.194.0：長線加長斬線與刀痕；開架補寒光與火星
 * 舊版    : r3.184.0  (2026-11-28)　鬼斬車最後一圈真的把妖怪甩飛（原本擊退量太小又被拉回）
 * 舊版    : r3.182.0  (2026-11-28)　r3.182.0：長刃離陣補特效（拖刀火星、焦痕、反手月牙刀氣）；出刀起點亮光與拖光
 * 舊版    : r3.181.0  (2026-11-28)　r3.181.0：五招秘傳演出重做（落日、躍空急降、地裂線、岩柱、全黑蓄力、一文字瞬斬）＋運鏡；奧義天地一刀蓄力演出
 * 舊版    : r3.77.0  (2026-11-24)
 * 變更    : r3.77.0 擊退放大只套收招／技／秘傳／普攻，起手與連接招不放大（修正秘傳「天斷」第 2 段打不到、湊不出來）。
 *           r3.76.0 天地一刀的天裂降到 4.6 身高以內（原本在畫面外）。
 *           r3.75.0 暴力感：刀光掃過 3 格、殘留 26 格、更厚；秘傳／奧義落點加「衝擊格」（背景瞬間壓暗＋鏡頭推近＋重停頓）；擊退 ×1.5 並在地上拖出揚塵碎石；
 *                    打倒敵人時爆碎（火星＋碎石＋揚塵）；奧義天地一刀重做（天裂改發光裂口、巨刃劈落、地面一路裂開），去掉白閃與白色描邊。
 *           r3.74.0 新增。野太刀特效重做（赤金 ember 色盤，用 111_katana_fx 的元件），機制與傷害數值不動。
 *           招式／技：92_lab 原本的刀幕、裂地素材、碎石、衝擊環由 111 統一轉成實心刀光、發光地裂、碎石、火星、揚塵。
 *           另外重做：月輪（白色疊加新月 → 赤金實心月牙，帶火星尾）、蓄勢破守（拿掉紅色斜線，改碎甲＋火星持續掉落）、
 *                     拔刀貫線（拿掉虛線，改地面一排悶燒火星，0.9 秒後整條斬開）、長線（加沿線長劍氣）、開架（刀身光改赤金、格擋火花）。
 *           秘傳 5 招三段演出：
 *             天斷：拔刀上挑 → 跳到最高點時目標上方先亮一道光 → 4 身高的垂直巨刃劈下，地裂＋碎石噴發＋火星柱。
 *             鬼斬車：推進 → 原地 3 圈越轉越快、越轉越大的環形刀光，火星繞身 → 最後一圈往外揚塵炸開。
 *             斷岳：刀插地 → 往前犁出一路地裂（火光沿裂縫推進）→ 劈下，整條裂縫依序爆開、碎石噴起。
 *             霸王・崩：低掃把敵人擊浮 → 推進 → 蓄力（火星往刀上收）→ 巨刃劈落，三圈揚塵震波＋大地裂。
 *             夕陽一文字：側步 → 背景轉夕陽色、地上一排悶燒火星標出斬線 → 一刀橫斷 5 身高，沿線依序爆開。
 * 依賴    : 111_katana_fx（G.KF）、92_lab（野太刀定義、秘傳組合動作 _comp）、109_katana（G.KT.ST 出手格）、110（G.KT.lift 浮空）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const KF = () => G.KF, E = fn => G.KF.use('ember', fn), NC = '255,185,100';
  const ST = c => (G.KT && G.KT.ST ? G.KT.ST(c) : Math.round(c.a.T * 0.5)), LV = c => c.a.mvx.lv || 1, stop = n => { G.hitstop = Math.max(G.hitstop || 0, n); }, shake = n => { SC.shake = Math.max(SC.shake || 0, n); };
  /* r3.182.0：出刀前半拍，刀的起點先亮一下並留一小段拖光（重量感） */
  const pre = (c, o) => E(() => { const k = c.hh, a = o.a0 === undefined ? -2.2 : o.a0, r = (o.r || 1.45) * k, x = (o.x === undefined ? c.x : o.x) + Math.cos(a) * r * c.f, z = (o.cy === undefined ? 0.55 : o.cy) - Math.sin(a) * (o.r || 1.45) * (o.sq === undefined ? 0.6 : o.sq); KF().glint(x, c.y, Math.max(0.1, z), 0.3, 6); KF().embers(x, c.y, Math.max(0.1, z), 2, { up: 0.3, sp: 0.3, life: 12 }); });
  const sm = (c, o) => { pre(c, o || {}); return sm0(c, o); };
  const sm0 = (c, o) => E(() => KF().smear(Object.assign({ x: c.x, y: c.y, f: c.f, cy: 0.55, r: 1.45, sq: 0.6, rot: 0, a0: -2.2, a1: 0.95, w: 0.65, dur: 3, life: 26, tier: 1 }, o)));   // 慢－快－慢：掃過 3 格、殘留久
  const smash = (x, y, pw) => { VX.dim(5, 0.55); if (G.CAM && G.CAM.vis) G.CAM.vis *= 1 - 0.03 * pw; shake(6 + pw * 2); stop(6 + pw * 3); };   // 衝擊格：背景瞬間壓暗、鏡頭推近、重停頓
  const hit = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 1.5, arc: 2.4, m: 1.0, lv: 'mid', kind: 'cut', col: NC }, o)) || [];
  const lift = (e, h) => G.KT && G.KT.lift && G.KT.lift(e, h);
  const alive = e => e && e.st !== 'dead' && G.E.includes(e);
  /* 地面一排悶燒火星（標出即將斬開的線）：x0 起往 f 方向 L 身高 */
  function fuse(x0, y, f, L, life) { const k = HH() * S(y); E(() => { for (let i = 0; i < Math.round(L * 2.5); i++) KF().embers(x0 + f * (0.4 + i * 0.4) * k, y, 0.05, 1, { up: 0.5, sp: 0.15, life: 26, stag: i * 1.5 }); KF().add(life, 'g', (ctx, u) => { const a = Math.min(1, u / 8) * Math.min(1, (life - u) / 6);
      ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < L * 3; i++) KF().spr(ctx, KF().PAL.ember.T.gd, x0 + f * (0.4 + i / 3) * k, y, k * 0.45, k * 0.14, 0.35 * a * (0.7 + 0.3 * Math.sin(u * 0.3 + i))); }); }); }
  /* ---------- 招式補強 ---------- */
  const DM = {
    long_line: { run(c, t) { const R = ST(c); if (t !== R) return; sm(c, { a0: -1.2, a1: 0.75, sq: 0.2, cy: 0.5, r: 2.6, w: 0.32, dur: 4, trail: 1.8 }); E(() => { KF().qi({ x: c.x + c.f * 2.2 * c.hh, y: c.y, z: 0.5, ang: 0, len: 4.6, w: 0.08, dur: 3, life: 18, motes: 6 }); KF().scar && KF().scar(c.x + c.f * 2.2 * c.hh, c.y, c.f, 2); }); shake(5);   /* r3.194.0：收招的份量——一道 4.6 身高長的焰色斬線＋地面刀痕 */ const x0 = c.x, y = c.y, f = c.f, k = c.hh;   // 遠距直斬：壓得很扁的長月牙
        c.later(18, () => { for (let i = 0; i < 4; i++) c.later(i * 2, () => E(() => { const x = x0 + f * (0.8 + i * 0.6) * k; KF().qi({ x, y, z: 0.35, ang: rnd(-0.4, 0.4), len: 0.9, w: 0.07, dur: 2, life: 12, motes: 2 }); KF().embers(x, y, 0.2, 3); }));
          c.hit({ shape: 'line', x: x0, y, len: 3.2, w: 0.4, m: 1.6, lv: 'heavy', kind: 'cut', col: NC }); }); } },
    opening_brace: { run(c, t) { if (t === 2) E(() => { KF().aura(28); KF().glint(c.x + c.f * 0.5 * c.hh, c.y, 0.9, 0.5, 14); KF().embers(c.x, c.y, 0.3, 6, { sp: 0.5, up: 1.2, life: 30 }); KF().light(c.x, c.y, 1.1, 28, 0.4, 0.5); });   /* r3.194.0：開架補刀身寒光與升起的火星 */ if (t === 28) c.a.mvx.hit = 1; },
      counter(c) { c.a.mvx.hit = 1; E(() => { KF().burst(c.x + c.f * 0.35 * c.hh, c.y, 0.65, 1.5, c.f > 0 ? 0.3 : Math.PI - 0.3); KF().embers(c.x + c.f * 0.35 * c.hh, c.y, 0.6, 6); }); sm(c, { a0: -2.0, a1: 0.9, r: 1.5, w: 0.6 }); hit(c, { m: 1.7, lv: 'heavy', kb: 1.4 }); } }
  };
  /* ---------- 技・特技 ---------- */
  function flyMoon(c, dy, ret, m) { const x0 = c.x, y0 = c.y + dy * c.hh, f = c.f, k = c.hh, sk = [], R = 7 * k, L = ret ? 44 : 22; let back = false;
    VX.custom((o, ctx) => { const kk = HH() * S(y0), u = o.t / 22, d = ret ? (u <= 1 ? u : 2 - u) : u, px = x0 + f * Math.max(0.3, d) * R, a = Math.min(1, (o.life - o.t) / 6) * Math.min(1, (o.t + 1) / 3);
        E(() => KF().moonShape(ctx, px, y0 - 0.6 * kk, 0.62 * kk, back ? -f : f, a, kk)); }, L, 'o',
      { step: (o, tt) => { const u = tt / 22, d = ret ? (u <= 1 ? u : 2 - u) : u, px = x0 + f * Math.max(0.3, d) * R; if (ret && u > 1 && !back) { back = true; sk.length = 0; }
          c.hit({ shape: 'circle', x: px, y: y0, r: 0.75, m: m || 1.6, lv: 'mid', kind: 'cut', skip: sk, col: NC }).forEach(e => sk.push(e)); if (tt % 2 === 0) E(() => KF().embers(px - f * 0.3 * k, y0, 0.6, 1, { up: 0.6, sp: 0.3, life: 20 })); } }); }
  const DU = {
    skill_getsurin: { run(c, t) { const lv = LV(c); if (t === 8) { flyMoon(c, 0, lv >= 5); if (lv >= 3) c.later(6, () => flyMoon(c, 0.35, false)); sm(c, { a0: -2.0, a1: 0.9, sq: 0.8, rot: -0.3, r: 1.4, w: 0.5 }); } } },
    special_break: { run(c, t) { const lv = LV(c), F = ST(c); if (t !== F) return; sm(c, { a0: -2.1, a1: 0.95, sq: 1, rot: 0.15, r: 1.5, w: 0.6, tier: 2 }); const T2 = lv >= 5 ? 360 : 180, hs = hit(c, { m: 1.8, def: lv >= 3 ? 30 : 20, lv: 'heavy' });
        hs.forEach(e => { e.db = e.db || {}; e.db.defT = T2; E(() => { KF().rocks(e.x, e.y, 7, 1); KF().embers(e.x, e.y, (e.ratio || 1) * 0.6, 6); });
          VX.custom((o, ctx) => { if (!alive(e) || !(e.db && e.db.defT > 0)) { o.t = o.life; return; } const s = S(e.y), y = e.y - (e.ratio || 1) * 1.2 * HH() * s; VX.draw2 && VX.draw2(ctx, 'fx_ico_guard', 0, e.x, y, 0.35, { a: 0.9 }); }, T2, 'o',
            { step: (o, tt) => { if (tt % 24 === 0 && alive(e)) E(() => KF().embers(e.x, e.y, (e.ratio || 1) * 0.7, 2, { up: -0.3, sp: 0.4, life: 22 })); } }); }); } },   // 碎甲：火星從身上剝落往下掉
    special_drawline: { run(c, t) { const lv = LV(c), D = lv >= 3 ? 4.5 : 3, F = ST(c); if (t !== F) return; sm(c, { a0: -0.5, a1: 0.4, sq: 0.3, r: 1.6, w: 0.42, dur: 3 }); const x0 = c.x, y0 = c.y, f = c.f, k = c.hh;
        fuse(x0, y0, f, D, lv >= 5 ? 78 : 62);
        const go = () => { E(() => { KF().qi({ x: x0 + f * (D / 2 + 0.4) * k, y: y0, z: 0.4, ang: 0, len: D + 0.6, w: 0.1, dur: 3, life: 18, motes: 6 }); KF().light(x0 + f * (D / 2 + 0.4) * k, y0, D * 0.6, 20, 0.5); });
          for (let i = 0; i < 5; i++) c.later(i * 2, () => E(() => { const x = x0 + f * (0.6 + i * D / 5) * k; KF().burst(x, y0, 0.35, 1.2, rnd(0, TAU)); KF().embers(x, y0, 0.1, 3); }));
          c.hit({ shape: 'line', x: x0, y: y0, len: D + 0.4, w: 0.45, m: 1.6, lv: 'heavy', kind: 'cut', col: NC }); };
        c.later(60, go); if (lv >= 5) c.later(76, go); } }
  };
  /* r3.182.0 長刃離陣：原本幾乎沒有特效 → 大斬後拖刀後撤（刀尖在地上拉出火星與焦痕），落地時反手甩出一道月牙刀氣（Lv5 落地震波照舊） */
  DU.special_leave = { run(c, t) { const lv = LV(c), D = lv >= 3 ? 1.4 : 1.0, F = Math.max(4, Math.round(c.a.T * 0.2)), k = c.hh;
      if (t === F) { sm(c, { a0: -2.3, a1: 1.1, sq: 0.7, rot: -0.3, r: 1.6, w: 0.6, tier: 1 }); hit(c, { m: 1.4 }); shake(3); }
      if (t > F && t <= F + 12) { c.move(-D / 12, 0); H.hop = Math.sin((t - F) / 12 * Math.PI) * 0.3 * k; E(() => { KF().embers(c.x + c.f * 0.9 * k, c.y, 0.02, 2, { up: 0.9, sp: 0.5, life: 18 }); if (t % 3 === 0) KF().scar && KF().scar(c.x + c.f * 0.9 * k, c.y, c.f, 1); }); }
      if (t === F + 13) { H.hop = 0; E(() => KF().puff(c.x, c.y, 0.8)); sm(c, { a0: 1.0, a1: -1.6, sq: 0.5, r: 1.4, w: 0.45 }); flyMoon(c, 0, false, 1.0);
        if (lv >= 5) { E(() => { KF().puff(c.x, c.y, 1.6); KF().rocks(c.x, c.y, 6, 1.4); }); c.hit({ shape: 'circle', r: 1.2, m: 0.8, lv: 'heavy', kind: 'blunt', kb: 1.5, col: NC }); shake(5); } } } };
  /* ---------- 秘傳（三段演出；機制、傷害同原版） ---------- */
  const DH = {
    n_tendan(c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, m = c.a.mvx;
      if (t === 2) E(() => KF().charge(c.x + c.f * 0.2 * k, c.y, 0.6, Math.max(6, r1 - 2), 14));
      if (t === r1) { sm(c, { a0: 1.2, a1: -1.35, sq: 0.9, r: 1.45, w: 0.5 }); c.hit({ shape: 'line', len: 2.2, w: 0.5, m: 0.8, lv: 'mid', kind: 'cut', col: NC }); }
      if (t > r1 && t < r3) { const u = (t - r1) / (r3 - r1); if (t < r2) c.move(-0.03, 0); H.hop = Math.sin(u * Math.PI) * 0.7 * k; }
      if (t === Math.round((r1 + r3) / 2)) { m.tx = c.x + c.f * 1.2 * k; E(() => { KF().glint(m.tx, c.y, 3.2, 0.5, 18); KF().qi({ x: m.tx, y: c.y, z: 2.2, ang: Math.PI / 2, len: 2.4, w: 0.04, dur: 4, life: 14, motes: 0 }); }); }   // 預兆：目標上方先亮一道細光
      if (t === r3) { H.hop = 0; const x = c.x + c.f * 1.2 * k; sm(c, { a0: -2.1, a1: 0.9, sq: 1, rot: 0.1, r: 2.3, w: 0.8, dur: 5, life: 24, tier: 2, cy: 0.9 });
        smash(x, c.y, 2); c.later(2, () => E(() => { KF().crack(x, c.y, 2.2, 80, true); KF().rocks(x, c.y, 16, 2.4); KF().puff(x, c.y, 2); KF().embers(x, c.y, 0.2, 16, { up: 2.6, sp: 0.3, life: 40 }); KF().light(x, c.y, 2.2, 30, 0.7, 0.6); shake(8); }));
        c.hit({ shape: 'circle', x, y: c.y, r: 1.6, m: 3.0, lv: 'hiden', kind: 'cut', col: NC }); } },
    n_guruma(c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh;
      if (t < r1) c.move(0.05, 0); if (t === r1) { sm(c, { a0: -2.0, a1: 0.9, sq: 0.45, r: 1.4, w: 0.5 }); hit(c, { m: 0.8 }); }
      const ring = (R, w, dur) => sm(c, { a0: Math.PI, a1: -Math.PI * 1.04, sq: 0.36, r: R, w, dur, life: dur + 12, cy: 0.45, trail: 5.6, tier: 2 });
      if (t === r2) { ring(1.5, 0.45, 7); c.hit({ shape: 'circle', r: 1.5, m: 1.0, lv: 'mid', kind: 'cut', col: NC }); }
      if (t > r2 && t < r3 + 14 && t % 3 === 0) E(() => KF().embers(c.x, c.y, 0.4, 2, { rx: 1.2, up: 0.8, sp: 0.6, life: 24 }));
      for (let i = 0; i < 3; i++) if (t === r3 + i * 6) { ring(1.6 + i * 0.22, 0.5 + i * 0.06, 6 - i * 1.5); c.hit({ shape: 'circle', r: 1.7, m: 0.9, lv: i === 2 ? 'hiden' : 'heavy', kind: 'cut', col: NC });
        if (i === 2) { smash(c.x, c.y, 2); } if (i === 2) E(() => { KF().puff(c.x, c.y, 2.2); KF().light(c.x, c.y, 2.2, 26, 0.6, 0.5); KF().rocks(c.x, c.y, 8, 1.5); shake(7); }); } },
    n_dangaku(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t === r1) { const x = c.x + c.f * 0.6 * k; E(() => { KF().crack(x, c.y, 0.9, r3 - r1 + 30); KF().puff(x, c.y, 0.8); }); c.hit({ shape: 'circle', x, y: c.y, r: 1.0, m: 0.8, lv: 'mid', kind: 'blunt', col: NC }); }
      if (t > r1 && t < r3) { c.move(0.04, 0); if (t % 5 === 0) { const x = c.x + c.f * 0.7 * k; (m.pts = m.pts || []).push([x, c.y]); E(() => { KF().crack(x, c.y, 0.55, r3 - t + 34); KF().embers(x, c.y, 0.05, 2, { up: 0.6 }); }); } }
      if (t === r3) { sm(c, { a0: -2.1, a1: 0.9, sq: 1, rot: 0.15, r: 1.7, w: 0.65, tier: 2 }); (m.pts || []).forEach(([x, y], i) => c.later(i * 2, () => { E(() => { KF().crack(x, y, 0.8, 40, true); KF().rocks(x, y, 3, 1.2); KF().embers(x, y, 0.1, 4, { up: 1.8 }); KF().light(x, y, 0.9, 16, 0.5); });
          c.hit({ shape: 'circle', x, y, r: 0.7, m: 0.7, lv: 'heavy', kind: 'blunt', col: NC }); })); smash(c.x, c.y, 1.5); } },
    n_haou(c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh;
      if (t === r1) { sm(c, { a0: -2.6, a1: 0.9, sq: 0.28, cy: 0.3, r: 1.6, w: 0.45 }); E(() => KF().puff(c.x + c.f * k, c.y, 0.8)); hit(c, { m: 0.8, r: 1.6 }).forEach(e => lift(e, 0.8)); }   // 擊浮
      if (t > r1 && t < r2) c.move(0.05, 0); if (t === r2) { sm(c, { a0: -2.0, a1: 0.9, sq: 0.6, r: 1.45, w: 0.5 }); hit(c, { m: 0.8 }); }
      if (t === r2 + 1) E(() => KF().charge(c.x + c.f * 0.2 * k, c.y, 0.9, Math.max(6, r3 - r2 - 1), 20));
      if (t === r3) { const x = c.x + c.f * 1.3 * k; sm(c, { a0: -2.1, a1: 0.85, sq: 1, rot: 0.2, r: 2.2, w: 0.8, dur: 5, life: 24, tier: 2, cy: 0.85 });
        smash(x, c.y, 2.5); c.later(2, () => E(() => { KF().crack(x, c.y, 2.4, 80, true); KF().rocks(x, c.y, 16, 2.4); for (let i = 0; i < 3; i++) c.later(i * 6, () => E(() => KF().puff(x, c.y, 1 + i * 0.6))); KF().light(x, c.y, 2.4, 30, 0.7, 0.5); shake(8); }));
        c.hit({ shape: 'circle', x, y: c.y, r: 1.8, m: 3.0, lv: 'hiden', kind: 'blunt', kb: 2, col: NC }); } },
    n_yuuhi(c, t, C) { const [r1, r2, r3] = C.rel, m = c.a.mvx, k = c.hh;
      if (t < r1) c.move(0, (G.IN.my || 0.6) * 0.04); if (t === r1) sm(c, { a0: -2.0, a1: 0.9, sq: 0.5, r: 1.4, w: 0.45 });
      if (t === r2) { m.x0 = c.x; m.y0 = c.y; m.f = c.f; const life = r3 - r2 + 40;
        KF().add(life, 'g', (ctx, u) => { const a = Math.min(1, u / 10) * Math.min(1, (life - u) / 16); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height, g = ctx.createLinearGradient(0, 0, 0, Hh);   // 背景轉夕陽色（只染地面層，角色不染）
          g.addColorStop(0, 'rgba(255,120,50,' + (0.28 * a).toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(200,80,40,' + (0.16 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(90,30,20,' + (0.12 * a).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh); });
        fuse(c.x, c.y, c.f, 5, r3 - r2 + 6); }
      if (t === r3 && m.x0 !== undefined) { const { x0, y0, f } = m; sm(c, { a0: -0.5, a1: 0.4, sq: 0.3, r: 1.8, w: 0.45, dur: 3 });
        E(() => { KF().qi({ x: x0 + f * 2.8 * k, y: y0, z: 0.55, ang: 0, len: 5.8, w: 0.3, dur: 4, life: 30, motes: 12 }); KF().light(x0 + f * 2.7 * k, y0, 3, 26, 0.6, 0.55); });   // 一刀橫斷：5.8 身高雙尖劍氣（中間厚 0.6 身高）
        for (let i = 0; i < 8; i++) c.later(i * 2, () => E(() => { const x = x0 + f * (0.6 + i * 0.6) * k; KF().burst(x, y0, 0.55, 1.5, rnd(0, TAU)); KF().embers(x, y0, 0.5, 3); }));
        c.hit({ shape: 'line', x: x0, y: y0, len: 5.2, w: 0.55, m: 3.0, lv: 'hiden', kind: 'cut', col: NC }); smash(x0, y0, 2); } }
  };
  /* ====================== r3.181.0 秘傳演出重做（機制、傷害照舊，外加演出層） ======================
   * 野太刀＝慢、重、一刀定生死：蓄力時畫面沉入黑暗、鏡頭推近；出刀瞬間拉遠＋強震，看到整片地面被劈開。主色赤金配黑。 */
  const shot = (c, x, y, up, zoom, T) => { G.CAMFOCUS = { x, y: y - up * c.hh, until: G.t + T }; G.CAMZOOM = { k: zoom, until: G.t + T }; };
  const near1 = (c, R) => { let b = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue; const d = Math.hypot(e.x - c.x, (e.y - c.y) * 1.5); if (d < R * c.hh && d < bd) { bd = d; b = e; } } return b; };
  /* 落日：赤紅大圓盤＋橫向雲帶（畫在人物後面） */
  function sun(x, y, R, life) { KF().add(life, 'g', (ctx, u) => { const a = Math.min(1, u / 12) * Math.min(1, (life - u) / 10); ctx.globalCompositeOperation = 'screen'; const h = ctx.createRadialGradient(x, y, R * 0.7, x, y, R * 2.4); h.addColorStop(0, 'rgba(255,120,40,' + 0.5 * a + ')'); h.addColorStop(1, 'rgba(200,40,10,0)'); ctx.fillStyle = h; ctx.fillRect(x - R * 2.4, y - R * 2.4, R * 4.8, R * 4.8);
      ctx.globalCompositeOperation = 'source-over'; const g = ctx.createLinearGradient(0, y - R, 0, y + R); g.addColorStop(0, 'rgba(255,214,130,' + a + ')'); g.addColorStop(0.55, 'rgba(250,120,50,' + a + ')'); g.addColorStop(1, 'rgba(190,40,25,' + a + ')'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(14,8,10,' + 0.85 * a + ')'; for (const [dy, hh, w] of [[0.28, 0.05, 1.5], [0.5, 0.07, 1.25], [0.72, 0.09, 1.0]]) ctx.fillRect(x - R * w, y + R * dy, R * w * 2, R * hh); }); }
  /* 岩柱：從地面竄出的尖岩（深色玄武岩＋赤金亮邊），之後碎掉 */
  function spike(x, y, h, life, lean) { const k = HH() * S(y), W = 0.42 * k * (0.8 + Math.random() * 0.4); lean = (lean || 0) * k;
    KF().add(life, 'o', (ctx, u) => { const g = KF().eo5(Math.min(1, u / 5)), a = Math.min(1, (life - u) / 8), Hh = h * k * g; if (Hh < 2) return; ctx.globalAlpha = a; const gr = ctx.createLinearGradient(x - W, 0, x + W, 0); gr.addColorStop(0, '#5a3a26'); gr.addColorStop(0.45, '#2a1a12'); gr.addColorStop(1, '#120b08'); ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x - W, y); ctx.lineTo(x - W * 0.55, y - Hh * 0.55); ctx.lineTo(x + lean, y - Hh); ctx.lineTo(x + W * 0.7, y - Hh * 0.4); ctx.lineTo(x + W, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,80,' + 0.9 * a + ')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - W, y); ctx.lineTo(x - W * 0.55, y - Hh * 0.55); ctx.lineTo(x + lean, y - Hh); ctx.stroke(); ctx.globalAlpha = 1; }); }
  /* 地裂線：從 x0 往 f 方向 L 身高，一路裂開噴火 */
  function rift(c, x0, y, f, L, m) { const k = c.hh, n = Math.round(L / 0.7); for (let i = 0; i < n; i++) c.later(i, () => E(() => { const x = x0 + f * i * 0.7 * k; KF().crack(x, y, 0.9, 70, true); KF().embers(x, y, 0.1, 4, { up: 2.6, sp: 0.3, life: 34 }); if (i % 2 === 0) KF().rocks(x, y, 3, 1.6); KF().light(x, y, 1, 18, 0.5);
      if (m) for (const e of G.E) if (e.st !== 'dead' && !e._rf && Math.hypot(e.x - x, (e.y - y) * 1.5) < 0.8 * k) { e._rf = 1; G.damageOni(e, m * c.mul, false); setTimeout(() => { e._rf = 0; }, 600); } })); }
  const DH0 = Object.assign({}, DH);
  const init = (c, T, dim) => { const m = c.a.mvx; if (m.cin) return false; m.cin = 1; VX.dim(T, dim); E(() => KF().light(c.x, c.y, 3, T, 0.3)); return true; };
  DH.n_tendan = function (c, t, C) { const [r1, , r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 20, 0.92)) { shot(c, c.x + c.f * 0.8 * k, c.y, 0.8, 1.35, r1 + 4); }
    DH0.n_tendan(c, t, C);
    if (t === r1 + 1) { shot(c, c.x + c.f * 0.6 * k, c.y, 2.6, 1.9, r3 - r1 - 2); sun(c.x + c.f * 0.9 * k, c.y - 3.6 * k, 1.35 * k, r3 - r1 + 26); }   /* 躍上高空：鏡頭抬高拉遠，背後一輪落日 */
    if (t > r1 && t < r3) { const u = (t - r1) / (r3 - r1); H.hop = Math.sin(Math.min(1, u * 1.25) * Math.PI / 2) * 2.7 * k * (u > 0.86 ? (1 - u) / 0.14 : 1); if (u > 0.5 && u < 0.86 && t % 2 === 0) G.hitstop = Math.max(G.hitstop || 0, 2); }   /* 空中定格半拍，再急降 */
    if (t === r3 - 3) shot(c, c.x + c.f * 2.4 * k, c.y, 0.5, 1.5, 44);
    if (t === r3) { rift(c, c.x + c.f * 1.2 * k, c.y, c.f, 6.5, 0.8); shake(12); } };
  DH.n_guruma = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, T = c.a.T;
    if (init(c, T + 34, 0.9)) shot(c, c.x + c.f * 1.2 * k, c.y, 0.6, 1.45, T);
    if (t < r1 && t % 2 === 0) E(() => KF().embers(c.x - c.f * 0.9 * k, c.y, 0.02, 2, { up: 0.8, sp: 0.5, life: 16 }));   /* 拖刀火星 */
    DH0.n_guruma(c, t, C);
    if (t >= r2 && t < r3 + 12) { c.move(0.035, 0); G.CAMFOCUS = { x: c.x + c.f * 0.8 * k, y: c.y - 0.6 * k, until: G.t + 20 }; for (const e of G.E) if (e.st !== 'dead' && !e.boss && !e.bb) { const d = Math.hypot(e.x - c.x, (e.y - c.y) * 1.5); if (d < 2.6 * k && d > 0.8 * k) { e.x += (c.x - e.x) * 0.07; e.y += (c.y - e.y) * 0.07; } } }   /* 一路往前推，把妖怪捲進來 */
    if (t === r2 + 8) { E(() => KF().smear({ x: c.x, y: c.y, f: -c.f, cy: 0.5, r: 1.75, sq: 0.36, a0: Math.PI, a1: -Math.PI * 1.04, w: 0.5, dur: 6, life: 20, trail: 5.6, tier: 2 })); c.hit({ shape: 'circle', r: 1.7, m: 0.6, lv: 'heavy', kind: 'cut', col: NC }); shake(4); }
    if (t === r3 + 12) { shot(c, c.x, c.y, 0.5, 1.15, 30); for (const e of G.E) if (e.st !== 'dead' && !e.boss && Math.hypot(e.x - c.x, (e.y - c.y) * 1.5) < 2.2 * k) { const sd = e.x >= c.x ? 1 : -1; e.kb = sd * 0.62 * k / (e.ratio || 1); lift(e, 1.5); G.damageOni(e, 0.5 * c.mul, true); e.kb = sd * 0.62 * k / (e.ratio || 1); } E(() => { KF().puff(c.x, c.y, 3); KF().rocks(c.x, c.y, 14, 2.4); }); shake(11); } };   /* 最後一圈：全部甩飛 */
  DH.n_dangaku = function (c, t, C) { const [r1, , r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 30, 0.9)) shot(c, c.x + c.f * 1.6 * k, c.y, 0.7, 1.4, r3);
    DH0.n_dangaku(c, t, C);
    if (t === r3) { shot(c, c.x + c.f * 2 * k, c.y, 1.5, 1.8, 46); const x0 = c.x + c.f * 0.9 * k, y = c.y, f = c.f;   /* 一排岩柱依序竄出，把妖怪頂上半空 */
      for (let i = 0; i < 7; i++) c.later(i * 2, () => { const x = x0 + f * i * 0.75 * k, yy = y + (i % 2 ? 0.12 : -0.1) * k; spike(x, yy, 1.5 + (i % 3) * 0.5, 40 - i * 2, f * 0.15); E(() => { KF().rocks(x, yy, 4, 1.8); KF().embers(x, yy, 0.1, 3, { up: 2.2 }); }); shake(3);
        for (const e of G.E) if (e.st !== 'dead' && Math.hypot(e.x - x, (e.y - yy) * 1.5) < 0.8 * k) { lift(e, 1.5); KF().burst(e.x, e.y, 0.5, 1.5); } });
      c.later(24, () => { shot(c, x0 + f * 2.4 * k, y, 0.9, 1.25, 30); E(() => KF().qi({ x: x0 + f * 2.4 * k, y, z: 1.0, ang: 0, len: 7.5, w: 0.28, dur: 2, life: 22, motes: 14 })); sm(c, { a0: -0.6, a1: 0.5, sq: 0.25, r: 2.2, w: 0.5, dur: 3, tier: 2 });   /* 橫斬：岩柱連妖怪一起斬斷 */
        for (const e of G.E) if (e.st !== 'dead' && Math.abs(e.y - y) < 0.9 * k && (e.x - x0) * f > -0.5 * k && (e.x - x0) * f < 6 * k) { G.damageOni(e, 2.0 * c.mul, true); if (e.lz > 0) e.lzv = -14; } E(() => { for (let i = 0; i < 7; i++) KF().rocks(x0 + f * i * 0.75 * k, y, 5, 2.4); KF().puff(x0 + f * 2.4 * k, y, 3); }); shake(12); stop(14); }); } };
  DH.n_haou = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, T = c.a.T;
    if (init(c, T + 20, 0.88)) shot(c, c.x + c.f * 1.2 * k, c.y, 0.6, 1.35, r1 + 2);
    DH0.n_haou(c, t, C);
    if (t === r1) { shot(c, c.x + c.f * 1.2 * k, c.y, 0.6, 1.22, r2 - r1); shake(5); }   /* 三記越來越重：每一記鏡頭推近一點 */
    if (t === r2) { shot(c, c.x + c.f * 1.2 * k, c.y, 0.55, 1.08, r3 - r2 - 1); VX.dim(r3 - r2 + 6, 0.97); shake(7); }   /* 第三記蓄力：畫面全黑只剩刀身發亮 */
    if (t > r2 && t < r3 && t % 2 === 0) E(() => KF().embers(c.x + c.f * 0.3 * k, c.y, 0.9, 2, { up: 1.4, sp: 0.2, life: 20 }));
    if (t === r3) { shot(c, c.x + c.f * 1.3 * k, c.y, 0.9, 1.85, 46); const x = c.x + c.f * 1.3 * k, y = c.y;   /* 劈下：鏡頭猛然拉遠，衝擊波把整個畫面的塵土掀起 */
      for (let i = 1; i <= 6; i++) c.later(i * 2, () => E(() => { for (const sd of [-1, 1]) { const px = x + sd * i * 0.75 * k; KF().puff(px, y, 1.6); KF().rocks(px, y, 3, 2); KF().embers(px, y, 0.2, 3, { up: 2.4 }); if (i % 2) KF().crack(px, y, 0.9, 60, true); } }));
      for (const e of G.E) if (e.st !== 'dead' && !e.boss && Math.hypot(e.x - x, (e.y - y) * 1.5) < 3.6 * k) lift(e, 0.9); shake(14); } };
  DH.n_yuuhi = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, m = c.a.mvx, T = c.a.T;
    if (init(c, T + 30, 0.86)) shot(c, c.x + c.f * 2 * k, c.y, 0.8, 1.4, r2);
    DH0.n_yuuhi(c, t, C);
    if (t === r2) { shot(c, c.x + c.f * 2.6 * k, c.y, 1.3, 1.75, r3 - r2 + 50); sun(c.x + c.f * 2.6 * k, c.y - 2.2 * k, 1.9 * k, r3 - r2 + 50); }   /* 夕陽沉在地平線上 */
    if (t > r2 && t < r3 && t % 3 === 0) G.hitstop = Math.max(G.hitstop || 0, 1);   /* 收刀靜止（慢動作） */
    if (t === r3 && m.x0 !== undefined) { const { x0, y0, f } = m, x1 = x0 + f * 5.6 * k;   /* 一瞬間出現在另一端，中間一條貫穿畫面的赤金線 */
      for (let i = 0; i <= 6; i++) MV2.ghostAt && MV2.ghostAt(x0 + (x1 - x0) * i / 6, y0, f, 8 + i * 3); if (SC.walkable(x1, y0)) { H.x = x1; H.y = y0; }
      E(() => KF().qi({ x: x0 + f * 2.8 * k, y: y0, z: 0.55, ang: 0, len: 11, w: 0.1, dur: 1, life: 40, motes: 0 })); stop(16); shake(12);
      c.later(22, () => { for (const e of G.E) if (e.st !== 'dead' && Math.abs(e.y - y0) < 0.9 * k && (e.x - x0) * f > 0 && (e.x - x0) * f < 6 * k) { E(() => KF().burst(e.x, e.y, 0.55 * (e.ratio || 1), 3, rnd(0, TAU))); G.damageOni(e, 0.8 * c.mul, true); } shake(8); }); } };   /* 停半拍，線上的妖怪才被斬開 */
  /* ---------- 奧義：天地一刀（傷害、範圍、Lv 效果同原版） ---------- */
  function skyRift(X, y, life) { const k = HH() * S(y), P = []; for (let i = 0; i <= 9; i++) P.push([X + (i % 2 ? 0.22 : -0.22) * k * (1 - i / 12) + rnd(-0.06, 0.06) * k, y - (4.6 - i * 0.4) * k]);   // 天裂：天上由上往下撕開的發光裂口（漸細實心）
    E(() => KF().add(life, 'o', (ctx, u, q) => { const g = KF().eo5(Math.min(1, u / 8)), a = Math.min(1, u / 3) * (1 - KF().eo3(Math.max(0, (q - 0.5) / 0.5))), n = Math.max(2, Math.ceil(P.length * g)), C = KF().PAL.ember;
      ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < n; i++) KF().spr(ctx, C.T.gm, P[i][0], P[i][1], k * 0.9, k * 0.9, 0.5 * a);
      ctx.globalCompositeOperation = 'source-over'; for (const [w, col, al] of [[0.09, C.deep, 0.8], [0.05, C.mid, 0.95], [0.018, C.lite, 1]]) { ctx.fillStyle = 'rgba(' + col + ',' + (al * a).toFixed(3) + ')'; ctx.beginPath();
        for (let i = 0; i < n; i++) ctx.lineTo(P[i][0] - w * k * (1 - i / n), P[i][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(P[i][0] + w * k * (1 - i / n), P[i][1]); ctx.closePath(); ctx.fill(); } })); }
  DU.ultimate_tenchi = { run(c, t) { const lv = LV(c), k = c.hh, m = c.a.mvx;
      if (t === 1) { VX.dim(90, 0.9); m.x = c.x + c.f * 1.6 * k; shot(c, c.x + c.f * 1.2 * k, c.y, 1.9, 1.75, 34); sun(c.x + c.f * 1.6 * k, c.y - 4.2 * k, 1.1 * k, 60);   /* r3.181.0：蓄力時鏡頭抬高、天上一輪赤日，天裂從日輪劈下 */ E(() => { KF().charge(c.x + c.f * 0.2 * k, c.y, 0.7, 14, 22); KF().light(c.x, c.y, 1.2, 24, 0.4); }); }
      const X = m.x; if (X === undefined) return;
      if (t === 6) { MV2.ghostAt && MV2.ghostAt(H.x, H.y, H.face, 20); E(() => KF().embers(c.x, c.y, 0.2, 10, { up: 3, sp: 0.2, life: 30 })); }
      if (t === 14) skyRift(X, c.y, 30);
      if (t === 30) sm(c, { x: X - c.f * 0.6 * k, a0: -1.8, a1: 0.7, sq: 1, r: 3.2, w: 1.0, cy: 2.6, dur: 3, life: 30, tier: 2 });
      if (t === 32) shot(c, X, c.y, 0.6, 1.5, 50);
      if (t === 34) { smash(X, c.y, 3); E(() => { KF().crack(X, c.y, 2.6, 90, true); KF().rocks(X, c.y, 18, 2.6); KF().puff(X, c.y, 2.4); KF().embers(X, c.y, 0.3, 18, { up: 3.2, sp: 0.3, life: 44 }); KF().light(X, c.y, 2.6, 34, 0.75, 0.8); });
        c.hit({ shape: 'circle', x: X, y: c.y, r: lv >= 3 ? 2.2 : 1.8, m: 1.6, lv: 'hiden', kind: 'cut', cutAng: -1.4 }); }
      if (t === 46) { E(() => { KF().qi({ x: X, y: c.y, z: 0.3, ang: 0, len: 6.2, w: 0.26, dur: 4, life: 26, motes: 12 }); for (let i = 0; i < 6; i++) c.later(i * 2, () => E(() => { const x = X + (i - 2.5) * 0.9 * k; KF().crack(x, c.y, 0.8, 50, true); KF().rocks(x, c.y, 3, 1.4); KF().embers(x, c.y, 0.1, 3, { up: 1.6 }); })); });
        c.hit({ shape: 'line', x: X - c.f * 3 * k, y: c.y, len: 6, w: 0.6, m: 1.4, lv: 'hiden', kind: 'cut', cutAng: 0 }); smash(X, c.y, 2); if (lv >= 5) G.BUFF.add('crit', 30, 300); } } };
  /* ---------- 打擊感：擊退加大＋地面拖出揚塵；打倒時爆碎（野太刀限定） ---------- */
  const isNod = () => G.WPN.curId() === 'nodachi';
  const dm0 = G.damageOni; G.damageOni = function (e) { const was = e && e.st !== 'dead' && e.hp > 0, r = dm0.apply(this, arguments);
    if (was && isNod() && H.act && (e.hp <= 0 || e.st === 'dead')) E(() => { const k = HH() * S(e.y), z = (e.ratio || 1) * 0.5; KF().burst(e.x, e.y, z, 3, H.face > 0 ? -0.3 : Math.PI + 0.3); KF().rocks(e.x, e.y, 8, 2); KF().embers(e.x, e.y, z, 10, { up: 1.6, sp: 1 }); KF().puff(e.x, e.y, 1); });
    return r; };
  function feel() { if (!isNod()) return; for (const e of G.E) { if (e.st === 'dead') continue; const kb = e.kb || 0, p = e.__kbp || 0;
      const A = H.act, cat = A && A.mvx && A.mvx.def && A.mvx.def.cat, chain = cat === '起' || cat === '連';   // 起手、連接招不放大（避免把敵人打出下一招範圍、秘傳接不上）
      if (!chain && Math.abs(kb) > Math.abs(p) * 1.05 + 0.05 && !e.boss) e.kb = kb * 1.5;   // 收招／技／秘傳／普攻：擊退放大 1.5 倍
      e.__kbp = e.kb || 0; if (Math.abs(e.kb || 0) > 1.2 && (G.t % 3 === 0)) E(() => { KF().puff(e.x - Math.sign(e.kb) * 6, e.y, 0.25, 18); if (G.t % 6 === 0) KF().rocks(e.x, e.y, 1, 0.6); }); } }
  /* ---------- 掛上：92_lab 換武器時會重建定義 → 每格對照參照，必要時補回（只比對參照，不重建） ---------- */
  const BASE = {}, WR = {};
  function patch() {
    const D = MV2.D.nodachi, U = MV2.U.nodachi, L = MV2.HD.nodachi;
    if (D) for (const k in DM) { const d = D[k]; if (!d) continue; if (d.run !== DM[k].run) d.run = DM[k].run; if (DM[k].counter && d.counter !== DM[k].counter) d.counter = DM[k].counter; }
    if (U) for (const k in DU) { const d = U[k]; if (d && d.run !== DU[k].run) d.run = DU[k].run; }
    if (L) for (const h of L) { const f = DH[h.id]; if (!f || h.run === WR[h.id]) continue; const base = h.run; BASE[h.id] = base;
      WR[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) f(c, t, C); else base.call(this, c, t); }; } }   // 第 1 格交給 92 設好組合動作（_comp）
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); patch(); feel(); };
})();
