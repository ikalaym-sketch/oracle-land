/* ==========================================================================
 * 神諭之地 重製版 — 110_katana_hiden.js
 * Version : r3.178.0  (2026-11-28)　r3.179.0：月下分身背景近全黑、鏡頭更遠、月亮更高更小；r3.178.0：月下分身重做（五個分身依序衝斬→本尊穿斬→斬月爆開）；燕返・真重做（把敵人來回打三次→巨大月牙刀氣）
 * 舊版    : r3.177.0  (2026-11-28)　r3.177.0：月下分身重做：象牙白大滿月高掛、月暈、夜色加深、最後一斬把月亮斬開
 * 舊版    : r3.173.0  (2026-11-28)　r3.173.0：五招秘傳加演出鏡頭（對準敵人群／挑飛高度）；返脈・雷的天雷連落三道
 * 舊版    : r3.73.0  (2026-11-24)
 * 變更    : r3.73.0 特效全部改用 111_katana_fx：起手聚氣、霧改柔光貼圖、一閃與千鳥的直線改成雙尖劍氣（qi）、雷改漸細鋸齒、光柱改柔邊貼圖；移除所有地面圈與描邊線；命中回饋移到 111。
 *           r3.72.0 新增。打刀秘傳 5 招重做（殘月藍配色，三段演出：起手→主體→收尾），並加上「擊飛」看得到的浮空。
 *           燕返・真：燕返上挑把妖怪擊飛 → 三隻燕形劍氣從身後高處、前方低處、正上方三個方向飛來，追著空中的妖怪打（打中會再托高）→ 第四隻巨燕俯衝把妖怪砸回地面。
 *           一閃・朧：霧起，主角穿過敵人 → 四個朧影從四方輪流斬入 → 收刀，所有斬痕同時爆開、霧散。
 *           月下分身：敵人背後升起滿月 → 三個分身繞敵人旋轉連斬 6 次 → 分身收回，滿月一閃，主角大斬。
 *           返脈・雷：架勢蓄雷 → 雷光沿刀身連鎖打到最多 5 個敵人（暈眩）→ 天雷落在主目標＋地面電環。
 *           千鳥十字：低刺、斜上、斜下兩斬畫出 X → X 字發光、把敵人往中心拉 → 化成光柱，持續 1.6 秒，每 10 格造成傷害。
 *           浮空：被挑起的妖怪真的離地（陰影留在地上），落地揚起碎光；頭目、大型妖不會被挑起。
 * 依賴    : 109_katana（G.KT：arcBlade／dust／BL／stop／tag／stance）、81_hiden（MV2.HD.katana：id／seq／clip）、77_moves（ctx：hit／move／later）、76_vfx（dim／bolt／ring）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX || !G.KT) return;
  const { arcBlade, dust, BL, stop, tag, stance } = G.KT, KF = () => G.KF;
  /* ---------- 浮空 ---------- */
  const GR = 0.55, canLift = e => e && e.st !== 'dead' && !e.boss && !e.bb && (e.ratio || 1) < 2.2;
  function lift(e, h) { if (!canLift(e)) return; const k = HH() * S(e.y), z = h * k; e.lz = e.lz || 0; e.lzv = Math.max(e.lzv || 0, Math.sqrt(2 * GR * Math.max(4, z - e.lz))); e.stun = Math.max(e.stun || 0, 30); }
  function slam(e) { if (e && e.lz > 0) e.lzv = -14; }
  const chest = e => [e.x, e.y - (e.lz || 0) - 0.55 * HH() * S(e.y) * Math.min(1.6, e.ratio || 1)];
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments);
    for (const e of G.E) { if (!(e.lz > 0 || e.lzv)) continue; e.lzv = (e.lzv || 0) - GR; e.lz = (e.lz || 0) + e.lzv; e.stun = Math.max(e.stun || 0, 2);
      if (e.lz <= 0) { const hard = e.lzv < -9; e.lz = 0; e.lzv = 0; dust(e.x, e.y, 0.05, hard ? 10 : 5, hard ? 1.4 : 0.8, 26); if (hard) { KF().puff(e.x, e.y, 0.8); SC.shake = Math.max(SC.shake || 0, 4); } } } };
  const do0 = G.drawOni; G.drawOni = function (e) { if (!(e && e.lz > 0)) return do0.apply(this, arguments); const ctx = G.ctx, s = S(e.y), k = HH() * s;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.12, 0.35 - e.lz / k * 0.1) + ')'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 0.4 * k * (e.ratio || 1), 0.1 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(0, -e.lz); try { return do0.apply(this, arguments); } finally { ctx.restore(); } };
  G.KT.lift = lift;
  /* ---------- 共用演出 ---------- */
  const foes = (x, y, R) => G.E.filter(e => e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - x, (e.y - y) * 1.5) < R);
  const tgt = (c, R) => { let b = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue; const d = Math.hypot(e.x - c.x, (e.y - c.y) * 1.5); if (d < R * c.hh && d < bd) { bd = d; b = e; } } return b; };
  const hitE = (c, e, m, o) => { if (!e || e.st === 'dead') return; G.damageOni(e, m * c.mul, true, !!(o && o.crit)); e.flash = Math.min(e.flash || 0, 3); if (e.lz > 4) { const [x, y] = chest(e); KF().burst(x, e.y, (e.y - y) / (HH() * S(e.y)), 2); } else VX.impact && VX.impact(e, 'heavy', 'cut'); if (o && o.stun) e.stun = Math.max(e.stun || 0, o.stun); };
  function ghostAt(x, y, face, life) { const u = G.WPN.unit && G.WPN.unit(), fr = G.heroFrame && G.heroFrame(); if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x, y, face, s: S(y) * G.WPN.actK(H.act && H.act.name), t: 0, life: life || 16 }); }
  /* r3.173.0：演出鏡頭——秘傳期間鏡頭對準戰場重點（敵人群／被挑飛的高度），不再只跟著主角，演出不會跑到畫面邊緣或上緣外 */
  function focus(c, x, y, up, T) { G.CAMFOCUS = { x, y: y - up * c.hh, until: G.t + T }; }
  function intro(c, T) { VX.dim && VX.dim(T, 0.55); KF().charge(c.x + c.f * 0.15 * c.hh, c.y, 0.5, 14, 18); KF().light(c.x, c.y, 1.0, 20, 0.35); }   // 起手：光點往刀上收
  /* 燕：深藍剪影＋中藍邊＋細白刃芯；ang＝飛行方向 */
  function bird(ctx, x, y, ang, sz, al, flap) { const w = sz, f = 0.55 + 0.45 * Math.sin(flap || 0); ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = al;
    ctx.beginPath(); ctx.moveTo(w, 0); ctx.quadraticCurveTo(w * 0.3, -w * 0.12, -w * 0.1, -w * 0.08); ctx.quadraticCurveTo(-w * 0.2, -w * 0.9 * f, -w * 0.85, -w * 1.05 * f); ctx.quadraticCurveTo(-w * 0.35, -w * 0.25, -w * 0.45, -w * 0.06);
    ctx.lineTo(-w * 1.25, -w * 0.38); ctx.lineTo(-w * 0.7, 0); ctx.lineTo(-w * 1.25, w * 0.38); ctx.lineTo(-w * 0.45, w * 0.06); ctx.quadraticCurveTo(-w * 0.35, w * 0.25, -w * 0.85, w * 1.05 * f); ctx.quadraticCurveTo(-w * 0.2, w * 0.9 * f, -w * 0.1, w * 0.08); ctx.quadraticCurveTo(w * 0.3, w * 0.12, w, 0); ctx.closePath();
    ctx.shadowColor = 'rgba(' + BL.deep + ',0.9)'; ctx.shadowBlur = w * 0.5; const g = ctx.createLinearGradient(w, 0, -w, 0); g.addColorStop(0, 'rgba(' + BL.lite + ',0.95)'); g.addColorStop(0.15, 'rgba(' + BL.mid + ',0.95)'); g.addColorStop(0.6, 'rgba(' + BL.deep + ',0.9)'); g.addColorStop(1, 'rgba(20,45,140,0.8)'); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(' + BL.lite + ',0.8)'; ctx.beginPath(); ctx.moveTo(w, 0); ctx.quadraticCurveTo(w * 0.3, -w * 0.05, -w * 0.35, 0); ctx.quadraticCurveTo(w * 0.3, w * 0.05, w, 0); ctx.fill(); ctx.restore(); }
  /* 燕形劍氣：從 p0 沿弧線追到目標（每格更新目標位置），留羽毛軌跡；到達時呼叫 onArrive */
  function swallow(c, p0, e, life, size, onArrive) { const tr = []; let px = p0[0], py = p0[1], ang = 0;
    VX.custom((o, ctx) => { const s = S(e.y), k = HH() * s; for (let i = 0; i < tr.length; i++) { const q = tr[i], a = (i + 1) / tr.length * 0.45; bird(ctx, q[0], q[1], q[2], size * k * (0.45 + 0.5 * a), a, q[3]); }
        if (o.t < o.life) { ctx.save(); ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, KF().T.gm, px, py, size * k * 3.2, size * k * 2.4, 0.55); ctx.restore(); bird(ctx, px, py, ang, size * k, 1, o.t * 0.9); } }, life + 8, 'o',
      { step: (o, t) => { if (t > life) { tr.shift(); return; } const [tx, ty] = chest(e), u = Math.min(1, t / life), cx = (p0[0] + tx) / 2, cy = Math.min(p0[1], ty) - 0.45 * HH() * S(e.y), ix = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * cx + u * u * tx, iy = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * cy + u * u * ty;
          ang = Math.atan2(iy - py, ix - px) || ang; px = ix; py = iy; tr.push([px, py, ang, t * 0.9]); if (tr.length > 7) tr.shift(); if (t % 2 === 0) dust(px, ty + (py - ty), 0, 1, 0.4, 20);
          if (t === life) onArrive(px, py); } }); }
  /* 光柱（千鳥十字收尾）：持續 life 格，每 10 格傷害；柔邊光柱貼圖（上端淡出）＋地面光＋底霧＋上升光點＋短電弧，不畫圈線 */
  const PT = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), h = g.createLinearGradient(0, 0, 64, 0);
    [[0, BL.deep, 0], [0.22, BL.deep, 0.35], [0.4, BL.mid, 0.7], [0.5, BL.lite, 0.8], [0.6, BL.mid, 0.7], [0.78, BL.deep, 0.35], [1, BL.deep, 0]].forEach(([s, col, a]) => h.addColorStop(s, 'rgba(' + col + ',' + a + ')')); g.fillStyle = h; g.fillRect(0, 0, 64, 256);
    const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.35, 'rgba(0,0,0,1)'); v.addColorStop(0.95, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = v; g.fillRect(0, 0, 64, 256); return c; })();
  function pillar(c, x, y, life, m, R) { KF().light(x, y, R * 1.6, life, 0.55); KF().mist(x, y, 0.6, life, 1.2);
    KF().add(life, 'o', (ctx, u) => { const k = HH() * S(y), a = Math.min(1, u / 6) * Math.min(1, (life - u) / 14), W = (0.95 + 0.12 * Math.sin(u * 0.45)) * k, Hh = 4.4 * k * (0.6 + 0.4 * KF().eo3(Math.min(1, u / 8)));
      ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, PT, x, y - Hh / 2, W * 1.6, Hh, 0.5 * a); ctx.globalCompositeOperation = 'source-over'; KF().spr(ctx, PT, x, y - Hh / 2, W, Hh, 0.85 * a); }, null);
    VX.custom(() => {}, life, 'o', { step: (o, t) => { const k = HH() * S(y); if (t % 2 === 0) KF().motes(x + rnd(-0.3, 0.3) * k, y, rnd(0.1, 0.8), 1, { sp: 0.2, up: 2.2, life: 34, sz: 1.2 });
        if (t % 12 === 0) KF().bolt(x + rnd(-0.3, 0.3) * k, y - rnd(1.8, 3.6) * k, x + rnd(-0.3, 0.3) * k, y - rnd(0.3, 1.2) * k, 6, 1.6);
        if (t % 10 === 5) { const hs = foes(x, y, R * k); for (const e of hs) { G.damageOni(e, m * c.mul, false); KF().burst(e.x, e.y, 0.55 * (e.ratio || 1), 0.6); e.stun = Math.max(e.stun || 0, 12); if (canLift(e) && !(e.lz > 0)) lift(e, 0.4); } } } }); }
  /* r3.178.0：分身（指定動作圖的某一格，預設「一閃」出刀那格）；dashClone＝分身從 A 衝到 B，沿路留殘影 */
  function cloneAt(x, y, face, life, clip, fi) { const u = G.WPN.unit && G.WPN.unit(), r = u && (u.act[clip || 'issen'] || u.act.issen || u.act.normal_3); const fr = r ? r.f[Math.min(r.f.length - 1, fi === undefined ? Math.floor(r.f.length * 0.55) : fi)] : (G.heroFrame && G.heroFrame());
    if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x, y, face, s: S(y) * G.WPN.actK(clip || 'issen'), t: 0, life: life || 12 }); }
  function dashClone(c, x0, y0, x1, y1, n, onMid) { const f = x1 > x0 ? 1 : -1; for (let i = 0; i <= n; i++) c.later(i, () => { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; cloneAt(x, y, f, i === n ? 16 : 7, 'issen'); if (i % 2 === 0) dust(x, y, 0.3, 1, 0.5, 14); if (i === Math.round(n / 2) && onMid) onMid(f); }); }
  /* ---------- 五招秘傳 ---------- */
  const NEW = {
    /* r3.178.0 燕返・真（重做）：一刀把敵人打飛出去 → 瞬移到落點後方再打回來 → 來回三次（越打越快）→ 最後一道巨大月牙刀氣追上去斬穿。頭目、大型妖打不動，就原地被來回斬。 */
    k_tsubame: { T: 84, run(c, t) { const m = c.a.mvx, k = c.hh, TT = 84;
        if (t === 1) { intro(c, TT); m.e = tgt(c, 6); m.dir = c.f; m.kt = 0; }
        const e = m.e && m.e.st !== 'dead' ? m.e : null;
        if (e) { const fx = (H.x + e.x) / 2, F = G.CAMFOCUS; G.CAMFOCUS = { x: F && F.until > G.t ? F.x + (fx - F.x) * 0.2 : fx, y: e.y - 0.5 * k, until: G.t + 10 }; }
        if (e && m.kt > 0) { m.kt--; const nx = e.x + m.kv; if (canLift(e) && SC.walkable(nx, e.y)) e.x = nx; else m.kt = 0; e.stun = Math.max(e.stun || 0, 20); if (m.kt % 2 === 0) dust(e.x, e.y, 0.2, 1, 0.6, 16); }   /* 被打飛：沿地面滑出去，揚塵 */
        const strike = (i, pw) => { if (!e) return; const d = m.dir, x = e.x - d * 0.75 * k; ghostAt(H.x, H.y, H.face, 14); if (SC.walkable(x, e.y)) { H.x = x; H.y = e.y; } H.face = d; c.a.face0 = d; KF().glint(H.x, H.y, 0.6, 0.45, 8);
          arcBlade(H.x, H.y, 0.55, d, 1.35, i % 2 ? 1.3 : -2.0, i % 2 ? -1.9 : 1.0, 16, 0.24, 0); for (const q of foes(e.x, e.y, 1.1 * k)) hitE(c, q, pw); m.hit = 1;
          m.kv = d * (0.34 + i * 0.05) * k; m.kt = 8; KF().burst(e.x, e.y, 0.55 * (e.ratio || 1), 2.2, d > 0 ? 0 : Math.PI); KF().puff(e.x, e.y, 0.8, 20); SC.shake = Math.max(SC.shake || 0, 4 + i); stop(5); m.dir = -d; };
        if (t === 8) { if (e) tag(e, '燕返', '#9fd0ff'); strike(0, 0.9); }
        if (t === 24) strike(1, 0.9);
        if (t === 38) strike(2, 1.0);
        if (t === 50 && e) { const d = m.dir, x = e.x - d * 2.4 * k; ghostAt(H.x, H.y, H.face, 14); if (SC.walkable(x, e.y)) { H.x = x; H.y = e.y; } H.face = d; c.a.face0 = d; KF().charge(H.x + d * 0.15 * k, H.y, 0.5, 8, 14); }
        if (t === 60 && e) { const d = m.dir, x0 = H.x + d * 0.5 * k, y = H.y, L = 5.2 * k, hitS = [];   /* 巨大月牙刀氣飛出去 */
          arcBlade(H.x, H.y, 0.55, d, 1.5, -2.2, 1.1, 18, 0.26, 0);
          KF().add(16, 'o', (ctx, u) => { const q = KF().eo3(Math.min(1, u / 12)), x = x0 + d * L * q, a = u < 12 ? 1 : 1 - (u - 12) / 4; KF().moonShape(ctx, x, y - 0.55 * k, 1.25 * k, d, a, k); });
          VX.custom(() => {}, 14, 'o', { step: (o, tt) => { const x = x0 + d * L * KF().eo3(Math.min(1, tt / 12)); for (const q of foes(x, y, 1.2 * k)) if (!hitS.includes(q)) { hitS.push(q); hitE(c, q, 2.2, { crit: true }); KF().scar && KF().scar(q.x, q.y, d, 3); } if (tt % 2 === 0) dust(x, y, 0.1, 2, 1.2, 24); } });
          SC.shake = Math.max(SC.shake || 0, 8); stop(10); }
        if (!e && t === 20) { arcBlade(H.x, H.y, 0.55, c.f, 1.4, -2.0, 1.0, 18, 0.2); c.hit({ shape: 'sector', r: 1.6, arc: 2.2, m: 2.0, lv: 'hiden', kind: 'cut' }); } } },
    k_issen: { T: 66, run(c, t) { const m = c.a.mvx, k = c.hh;
        if (t === 1) { intro(c, 66); m.e = tgt(c, 6); if (m.e) focus(c, m.e.x, m.e.y, 0.25, 66); m.x0 = c.x; const x = c.x, y = c.y;   // 朧：霧
          KF().mist(c.x + c.f * 1.3 * k, y, 1.5, 66, 1.3); }
        const e = m.e && m.e.st !== 'dead' ? m.e : null, cx = e ? e.x : c.x + c.f * 1.6 * k, cy = e ? e.y : c.y;
        if (t >= 5 && t <= 10) { const x = H.x + c.f * 0.6 * k; if (SC.walkable(x, H.y)) H.x = x; ghostAt(H.x, H.y, H.face, 12); H.inv = 30; }
        const Q = [[-1.1, -0.35], [1.1, 0.35], [-0.9, 0.4], [0.9, -0.4]];
        Q.forEach(([dx, dy], i) => { const tt = 14 + i * 5, x = cx + dx * k, y = cy + dy * k, f = dx < 0 ? 1 : -1;
          if (t === tt) { ghostAt(x, y, f, 22); dust(x, y, 0.6, 5, 0.6, 24); }
          if (t === tt + 3) { arcBlade(x, y, 0.55, f, 0.9, -1.6, 1.0, 14, 0.16, 0); if (e) hitE(c, e, 0.5); for (const q of foes(cx, cy, 0.9 * k)) if (q !== e) hitE(c, q, 0.5); m.hit = 1; } });
        if (t === 38) { KF().glint(H.x + c.f * 0.12 * k, H.y, 0.45, 0.32, 12); dust(H.x + c.f * 0.12 * k, H.y, 0.45, 5, 0.4); }
        if (t === 42) { for (const an of [0.75, -0.75, 0.05]) KF().qi({ x: cx, y: cy, z: 0.55, ang: an, len: 2.8, w: 0.13, dur: 3, life: 18, motes: 6 }); KF().light(cx, cy, 1.6, 24, 0.6, 0.55);
          for (const q of foes(cx, cy, 1.4 * k)) hitE(c, q, 2.3, { crit: true }); dust(cx, cy, 0.5, 22, 2.0, 40); SC.shake = Math.max(SC.shake || 0, 7); stop(12); } } },
    /* r3.178.0 月下分身（重做）：滿月高掛、鏡頭拉遠 → 五個分身依序從左右兩側衝過敵人各斬一刀（一個接一個，越來越快）→ 本尊最後穿過敵人，收刀時斬痕一起爆開、月亮被斬開 */
    k_bunshin: { T: 92, run(c, t) { const m = c.a.mvx, k = c.hh, TB = 92;
        if (t === 1) { intro(c, TB); const e = tgt(c, 6); m.e = e; m.p = e ? [e.x, e.y] : [c.x + c.f * 1.4 * k, c.y]; const [px, py] = m.p; focus(c, px, py, 2.05, TB); m.h0 = [c.x, c.y];
          VX.dim && VX.dim(TB, 0.93); G.CAMZOOM = { k: 1.62, until: G.t + TB };   /* r3.179.0：背景幾乎全黑，只留人物、月亮、特效；鏡頭再拉遠 */   /* r3.177.0：月下分身重做——夜色更深、象牙白大滿月從敵人身後高處升起（半徑 1.5 身高、月心離地 2.9 身高）、月暈＋光芒、最後一斬把月亮斬開 */
          VX.custom((o, ctx) => { const s = S(py), kk = HH() * s, rise = KF().eo3(Math.min(1, o.t / 16)), a = Math.min(1, o.t / 10) * Math.min(1, (o.life - o.t) / 10), R = 1.15 * kk, mx = px - c.f * 0.2 * kk, my = py - (3.3 + 0.9 * rise) * kk, cut = o.t >= 70, fl = o.t > 66 && o.t < 76 ? 1.5 : 1;
              ctx.save(); ctx.globalCompositeOperation = 'screen';
              const h = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 2.6); h.addColorStop(0, 'rgba(150,185,255,' + 0.5 * a * fl + ')'); h.addColorStop(0.4, 'rgba(70,110,220,' + 0.22 * a + ')'); h.addColorStop(1, 'rgba(40,70,180,0)'); ctx.fillStyle = h; ctx.fillRect(mx - R * 2.6, my - R * 2.6, R * 5.2, R * 5.2);
              ctx.globalCompositeOperation = 'source-over';
              const g = ctx.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.05, mx, my, R); g.addColorStop(0, 'rgba(255,253,240,' + a + ')'); g.addColorStop(0.6, 'rgba(238,236,222,' + a + ')'); g.addColorStop(0.92, 'rgba(196,208,236,' + a + ')'); g.addColorStop(1, 'rgba(150,175,235,' + 0.9 * a + ')');
              ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
              ctx.fillStyle = 'rgba(150,160,190,' + 0.22 * a + ')'; for (const [dx, dy, r] of [[-0.35, 0.05, 0.22], [0.2, -0.3, 0.15], [0.12, 0.38, 0.13], [0.48, 0.12, 0.09], [-0.1, -0.5, 0.08]]) { ctx.beginPath(); ctx.arc(mx + dx * R, my + dy * R, r * R, 0, TAU); ctx.fill(); }
              ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(190,215,255,' + 0.1 * a + ')'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const an = i * TAU / 12 + o.t * 0.004; ctx.beginPath(); ctx.moveTo(mx + Math.cos(an) * R * 1.12, my + Math.sin(an) * R * 1.12); ctx.lineTo(mx + Math.cos(an) * R * (1.7 + 0.3 * (i % 3)), my + Math.sin(an) * R * (1.7 + 0.3 * (i % 3))); ctx.stroke(); }
              if (cut) { const q = Math.min(1, (o.t - 70) / 4), L = R * 1.5 * q; ctx.globalCompositeOperation = 'source-over'; ctx.translate(mx, my); ctx.rotate(-0.42 * c.f); ctx.fillStyle = 'rgba(8,10,28,' + 0.9 * a + ')'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -R * 0.07, L, 0); ctx.quadraticCurveTo(0, R * 0.07, -L, 0); ctx.fill();
                ctx.fillStyle = 'rgba(' + BL.lite + ',' + a + ')'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -R * 0.02, L, 0); ctx.quadraticCurveTo(0, R * 0.02, -L, 0); ctx.fill(); }
              ctx.restore(); }, TB, 'g'); }
        const [px, py] = m.p || [c.x, c.y];
        [[14, -1, -0.25], [23, 1, 0.3], [31, -1, 0.35], [38, 1, -0.3], [44, -1, 0]].forEach(([tt, sd, dy], i) => { if (t !== tt) return; const x0 = px + sd * 2.9 * k, x1 = px - sd * 2.9 * k, y0 = py + dy * k, y1 = py - dy * k;
          KF().glint(x0, y0, 0.6, 0.4, 8); dashClone(c, x0, y0, x1, y1, 7, f => { arcBlade(px, py, 0.55, f, 1.15, i % 2 ? 1.2 : -1.8, i % 2 ? -1.8 : 1.0, 16, 0.2, (i - 2) * 0.25); KF().qi({ x: px, y: py, z: 0.55, ang: (i - 2) * 0.22 * f, len: 3.4, w: 0.07, dur: 2, life: 10, motes: 3 });
            for (const q of foes(px, py, 1.3 * k)) hitE(c, q, 0.5); m.hit = 1; SC.shake = Math.max(SC.shake || 0, 2); stop(2); }); });
        if (t === 56) { KF().charge(H.x + c.f * 0.15 * k, H.y, 0.5, 10, 14); }
        if (t === 66) { ghostAt(H.x, H.y, H.face, 18); const x1 = px + c.f * 1.6 * k; for (let i = 1; i <= 5; i++) cloneAt(H.x + (x1 - H.x) * i / 6, H.y + (py - H.y) * i / 6, c.f, 6 + i * 2, 'issen'); if (SC.walkable(x1, py)) { H.x = x1; H.y = py; }
          KF().qi({ x: px, y: py, z: 0.55, ang: 0, len: 7, w: 0.14, dur: 2, life: 16, motes: 10 }); SC.shake = Math.max(SC.shake || 0, 4); }
        if (t === 76) { for (let i = 0; i < 5; i++) arcBlade(px, py, 0.55, i % 2 ? 1 : -1, 1.3 + i * 0.08, -2.2 + i * 0.5, 1.1 - i * 0.4, 22, 0.24, (i - 2) * 0.5); for (const q of foes(px, py, 1.7 * k)) hitE(c, q, 2.2, { crit: true });
          KF().puff(px, py, 2); KF().light(px, py, 2, 24, 0.6, 0.6); for (let i = 0; i < 12; i++) dust(px + rnd(-1.2, 1.2) * k, py, rnd(0.4, 2.6), 1, 0.4, 50); SC.shake = Math.max(SC.shake || 0, 9); stop(14); } } },
    k_raimyaku: { T: 58, run(c, t) { const m = c.a.mvx, k = c.hh;
        if (t === 1) { intro(c, 58); stance(16); const e0 = tgt(c, 4); focus(c, e0 ? (c.x + e0.x) / 2 + c.f * 0.4 * k : c.x + c.f * 1.2 * k, c.y, 0.75, 58); }
        if (t > 1 && t < 14 && t % 3 === 0) KF().bolt(c.x + c.f * 0.15 * k, c.y - 0.5 * k, c.x + c.f * rnd(0.5, 0.9) * k, c.y - rnd(0.8, 1.15) * k, 5, 1.4);
        if (t === 16) { const L = G.E.filter(e => e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - c.x, (e.y - c.y) * 1.5) < 3.6 * k).sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x)).slice(0, 5); m.L = L; let [x0, y0] = [c.x + c.f * 0.5 * k, c.y - 0.6 * k];
          L.forEach((e, i) => c.later(i * 3, () => { if (e.st === 'dead') return; const [x1, y1] = chest(e); KF().bolt(x0, y0, x1, y1, 18, 2.6, 1); x0 = x1; y0 = y1; hitE(c, e, 1.0, { stun: 50 }); tag(e, '雷', '#9fd0ff'); dust(x1, e.y, (e.y - y1) / k, 6, 1.2); m.hit = 1; }));
          arcBlade(c.x, c.y, 0.55, c.f, 1.1, -1.2, 0.9, 14, 0.16); }
        if (t === 34) { const e = (m.L || [])[0] || tgt(c, 4), x = e ? e.x : c.x + c.f * 1.4 * k, y = e ? e.y : c.y;
          KF().bolt(x + rnd(-12, 12), y - 5.5 * k, x, y - 0.3 * k, 26, 4.5, 3); KF().bolt(x + rnd(-24, 24), y - 5 * k, x, y - 0.3 * k, 18, 2, 1); c.later(4, () => KF().bolt(x + rnd(-30, 30), y - 5.2 * k, x + rnd(-0.3, 0.3) * k, y - 0.2 * k, 16, 3, 2)); c.later(9, () => KF().bolt(x + rnd(-30, 30), y - 5.2 * k, x + rnd(-0.4, 0.4) * k, y - 0.2 * k, 14, 2.4, 1)); KF().scar && [-0.5, 0, 0.5].forEach(d => KF().scar(x + d * k, y, c.f, 3));   /* r3.173.0：天雷連落三道＋地面焦痕 */
          arcBlade(H.x, H.y, 0.55, c.f, 1.35, -2.1, 0.95, 18, 0.2, 0); KF().puff(x, y, 2); KF().light(x, y, 1.8, 24, 0.65, 0.6);
          for (const q of foes(x, y, 1.3 * k)) hitE(c, q, 2.0, { crit: true, stun: 40 }); dust(x, y, 0.1, 16, 1.6, 36); SC.shake = Math.max(SC.shake || 0, 8); stop(12); } } },
    k_chidori: { T: 60, run(c, t) { const m = c.a.mvx, k = c.hh;
        if (t === 1) { intro(c, 60); const e = tgt(c, 4); m.p = e ? [e.x, e.y] : [c.x + c.f * 1.2 * k, c.y]; focus(c, m.p[0] - c.f * 0.3 * k, m.p[1], 0.85, 64); }
        const [px, py] = m.p || [c.x, c.y];
        if (t === 7) { arcBlade(H.x, H.y, 0.3, c.f, 1.0, -0.25, 0.2, 10, 0.12, 0); for (const q of foes(px, py, 1.0 * k)) hitE(c, q, 0.6); m.hit = 1; }
        const X = (an, life) => KF().qi({ x: px, y: py, z: 0.6, ang: an, len: 2.6, w: 0.12, dur: 3, life, pulse: 1, motes: 5 });
        if (t === 14) { arcBlade(H.x, H.y, 0.55, c.f, 1.15, 1.2, -1.9, 12, 0.18, 0); X(-0.85 * c.f, 30); for (const q of foes(px, py, 1.1 * k)) { hitE(c, q, 0.8); } stop(3); }
        if (t === 22) { arcBlade(H.x, H.y, 0.55, c.f, 1.15, -1.9, 1.0, 12, 0.18, 0); X(0.85 * c.f, 22); for (const q of foes(px, py, 1.1 * k)) { hitE(c, q, 0.8); } stop(3); }
        if (t > 24 && t < 40) for (const q of foes(px, py, 2.2 * k)) if (!q.boss) { q.x += (px - q.x) * 0.06; q.y += (py - q.y) * 0.06; }   // 十字把敵人吸向中心
        if (t === 40) { KF().puff(px, py, 1.5); for (const q of foes(px, py, 1.2 * k)) hitE(c, q, 1.4, { crit: true }); pillar(c, px, py, 96, 0.3, 1.05); dust(px, py, 0.4, 16, 1.6); SC.shake = Math.max(SC.shake || 0, 6); stop(10); } } }
  };
  function patch() { const L = MV2.HD.katana; if (!L) return; for (const h of L) { const n = NEW[h.id]; if (n && h.run !== n.run) { h.run = n.run; h.T = n.T; } } }
  const ls1 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls1.apply(this, arguments); patch(); };   // 92_lab 換武器會換回舊秘傳 → 每格對照參照，必要時補回
  patch();
  /* 109 的挑刃散勢、燕返也改成真的浮空 */
  (function lift2() { const D = MV2.D.katana, U = MV2.U && MV2.U.katana; if (!D || !U || !U.tsubame) return setTimeout(lift2, 50);
    const wrapHit = (def) => { const r0 = def.run; def.run = function (c, t) { const h0 = c.hit; c.hit = function (o) { const hs = h0.call(this, o) || []; if (o && o.launch) for (const e of hs) lift(e, o.launch >= 40 ? 1.3 : 0.9); return hs; }; try { return r0.call(this, c, t); } finally { c.hit = h0; } }; };
    wrapHit(D.rising_disrupt); wrapHit(U.tsubame); })();
})();
