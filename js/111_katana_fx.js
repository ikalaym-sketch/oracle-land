/* ==========================================================================
 * 神諭之地 重製版 — 111_katana_fx.js
 * Version : r3.227.0  (2026-11-28)　r3.227.0：普攻的刀光、突刺光、命中碎光改走 168_wfx
 * 舊版    : r3.194.0  (2026-11-28)　和弓普攻命中光效縮小（妖怪不再整隻染金）
 * 舊版    : r3.190.0  (2026-11-28)　和弓命中改用射穿表現（KF.pierce 金色）
 * 舊版    : r3.186.0  (2026-11-28)　長槍刺擊命中改用 116 的刺穿表現（KF.pierce）
 * 舊版    : r3.176.0  (2026-11-28)　r3.176.0：特效第三版套用到全部色盤（薙刀、長槍、和弓）
 * 舊版    : r3.175.0  (2026-11-28)　r3.175.0：野太刀也套特效第三版（墨邊、亮芯、筆觸、受擊染色與壓扁、地面刀痕）
 * 舊版    : r3.173.0  (2026-11-28)　r3.173.0：雷光加粗、墨邊、白熱芯（打刀）
 * 舊版    : r3.172.0  (2026-11-28)　r3.172.0：技／秘傳刀光多停留 50%、突刺光加粗、「架」字加墨底圓牌（打刀）
 * 舊版    : r3.170.0  (2026-11-27)　r3.170.0：特效第三版（打刀樣板）：襯底暗影、墨邊、白熱亮芯、筆觸紋理、火花描墨邊、受擊染色與壓扁、地面刀痕；新增櫻色盤
 * 舊版    : r3.79.0  (2026-11-25)
 * 變更    : r3.79.0 槍色盤改白金；槍的突刺改由 116 槍影元件（KF.spear）畫。
 *           r3.78.0 和弓色盤 holy（金白偏暖）；箭命中＝十字星光＋金羽；和弓停頓表；修正：92_lab 每格把震動壓到 1～3（野太刀等的重震失效）→ 改由本模組分級、只做自然衰減。
 *           r3.77.0 槍色盤 lance（銀紫、槍尖金點）；突刺加槍尖金光與殘槍（連刺速度感）；貫穿時碎光從敵人背後噴出；速度線改光點；槍的停頓表（俐落短停頓）；槍的素材特效（大師突刺、震地）改程式元件。
 *           r3.76.0 薙刀色盤 gale（青碧）；新增 leaves 葉片、sweepDust 風壓塵霧；薙刀刀光更厚更慢（沉重）並沿刀弧在地面推開風壓；風切線 wind、煙 smoke 改成葉片＋塵霧；薙刀命中停頓／震動表。
 *           r3.75.0 野太刀打擊感：停頓 4～14 格、震動 2～10、重擊鏡頭往前推、命中噴火星＋碎石＋揚塵；刀光「慢－快－慢」（掃過 2～3 格、殘留拉長、厚 1.35 倍）；測試用 KF.tick／noRT。
 *           r3.74.0 色盤化（moon 殘月藍／ember 野太刀赤金，KF.use 切換）；新增 crack 地裂、rocks 碎石、embers 火星；
 *           打刀／野太刀出招時舊元件（刀幕 ribbon、突刺、衝擊環、斬痕 cut、火花、裂地素材、光柱素材、法陣、全螢幕白閃）一律轉成本模組元件；普攻也換武器色（動作、判定、停頓不變）。
 *           r3.73.0 新增。打刀特效底層（殘月藍），取代 109／110 所有「等寬線、地面圈、硬邊色塊」。
 *           規則（依 LoL VFX 規範、刀光造型、打擊感實務整理）：
 *           ①刀光＝實心漸細月牙（前寬後細），揮出 3～5 格以緩出曲線掃過，之後尾端追上刀頭、碎成光屑；不畫描邊
 *           ②軟邊：光暈／霧／光點全部用預先繪好的漸層貼圖（離屏畫布），邊緣自然淡出，也省每格重畫
 *           ③明暗：本體深藍→中藍，最亮的淺藍只在刀頭與命中瞬間；白色只剩光點中心一點
 *           ④局部光：出刀、命中、落地在地面與角色上打一層藍光（screen 疊加），取代地面圈
 *           ⑤節奏：預備短、峰值在前 1/4、消散減速；命中停頓期間特效以 0.35 倍速繼續走（停格但不卡死）
 *           ⑥分級：輕（光點少、不停頓）＜重（停頓 7 格、震動）＜秘傳（12 格、局部光大）
 *           元件：smear 刀光、stab 突刺光、qi 直線劍氣、burst 命中、light 局部光、motes 光點、puff 地面揚霧、mist 霧、
 *                 charge 聚氣、aura 架勢刀身光、frost 緩速冰霧、bolt 雷、glint 刀鍔閃、moonBlade 飛行月牙。
 *           打刀技／特技／秘傳的命中回饋（VX.impact）改用 burst；普攻（mvx.norm）不動。
 * 依賴    : 76_vfx（VX.custom／VX.impact）、02_scene（SC.depth）、03_actors（G.t／G.hitstop）。
 * ========================================================================== */
'use strict';
(function () {
  const VX = G.VX, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  if (!VX) return;
  const BL = { ink: '20,45,140', deep: '40,95,230', mid: '95,155,255', lite: '170,205,255', ice: '150,210,255' };
  const eo3 = u => 1 - Math.pow(1 - u, 3), eo5 = u => 1 - Math.pow(1 - u, 5), ei2 = u => u * u;
  const mix = (a, b, u) => { const A = a.split(','), B = b.split(','); return A.map((v, i) => Math.round(+v + (B[i] - v) * u)).join(','); };
  const ramp = (C, v) => v < 0.45 ? mix(C.deep, C.mid, v / 0.45) : mix(C.mid, C.lite, (v - 0.45) / 0.55);
  /* ---------- 貼圖（離屏、只畫一次） ---------- */
  const tex = (sz, fn) => { const c = document.createElement('canvas'); c.width = c.height = sz; fn(c.getContext('2d'), sz); return c; };
  const glowT = col => tex(64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(' + col + ',1)'); r.addColorStop(0.25, 'rgba(' + col + ',.55)'); r.addColorStop(0.6, 'rgba(' + col + ',.15)'); r.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  /* 色盤：每把武器一組（深／中／亮／暗底＋霧色），貼圖依色盤各畫一次 */
  const mkT = P => ({ gd: glowT(P.deep), gm: glowT(P.mid), gl: glowT(P.lite), sh: glowT('10,10,22'),   /* r3.170.0：sh＝襯底暗影（亮地面上發光特效才看得見） */
    mote: tex(32, g => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(' + P.hot + ',1)'); r.addColorStop(0.16, 'rgba(' + P.lite + ',.9)'); r.addColorStop(0.42, 'rgba(' + P.mid + ',.35)'); r.addColorStop(1, 'rgba(' + P.deep + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }),
    mist: tex(128, g => { for (let i = 0; i < 16; i++) { const x = 64 + rnd(-20, 20), y = 64 + rnd(-16, 16), rr = rnd(22, 42), r = g.createRadialGradient(x, y, 0, x, y, rr); r.addColorStop(0, 'rgba(' + P.fog + ',.16)'); r.addColorStop(1, 'rgba(' + P.fog + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); } }) });
  const PAL = { moon: Object.assign({ hot: '225,238,255', fog: '130,165,225' }, BL), ember: { ink: '70,22,10', deep: '175,60,22', mid: '240,128,48', lite: '255,200,120', ice: '255,170,90', hot: '255,236,200', fog: '150,122,98' },
    holy: { ink: '90,60,15', deep: '200,140,45', mid: '245,200,100', lite: '255,230,165', ice: '255,220,150', hot: '255,246,220', fog: '220,200,160' },
    lance: { ink: '80,68,40', deep: '150,132,92', mid: '220,205,160', lite: '248,240,214', ice: '235,222,185', hot: '255,250,236', fog: '196,188,165' },   // r3.79.0 白金槍氣（比和弓的暖金更淡、更冷）
    sakura: { ink: '90,20,50', deep: '200,70,120', mid: '245,130,170', lite: '255,200,220', ice: '255,180,205', hot: '255,244,248', fog: '225,170,190' },   // r3.170.0 櫻（千本櫻／櫻花亂舞）
    gale: { ink: '10,60,52', deep: '25,120,100', mid: '80,205,165', lite: '175,245,215', ice: '150,235,205', hot: '232,255,245', fog: '150,180,160' } };
  for (const k in PAL) PAL[k].T = mkT(PAL[k]);
  const T = PAL.moon.T; let cur = PAL.moon;
  /* 用某把武器的色盤畫：KF.use('ember', () => KF.smear(...))；畫面函式在建立時記住色盤 */
  const use = (name, fn) => { const p = cur; cur = PAL[name] || PAL.moon; try { return fn(); } finally { cur = p; } };
  const X3 = () => true;   /* r3.176.0：六種色盤全部套第三版（墨邊、亮芯、筆觸、襯底） */   /* r3.170.0：特效第三版（襯底暗影＋墨邊＋白熱亮芯＋筆觸），先套打刀當樣板 */
  const under = (ctx, C, x, y, w, h, a) => { const g = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'source-over'; spr(ctx, C.T.sh, x, y, w, h, a); ctx.globalCompositeOperation = g; };
  const spr = (ctx, im, x, y, w, h, a) => { if (a <= 0.004 || w < 0.5) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(im, x - w / 2, y - (h || w) / 2, w, h || w); ctx.globalAlpha = 1; };
  /* ---------- 時鐘：命中停頓時 0.35 倍速 ---------- */
  let clk = 0, lt = 0;
  const now = () => { const t = G.t || 0; if (t !== lt) { const d = t - lt; lt = t; if (G.hitstop > 0 && d > 0 && d < 10 && !(G.KF && G.KF.noRT)) clk += 0.35 * d; } return clk; };   // 平常：每個邏輯格 +1（掛在 fxStep）；停頓中：0.35 倍速
  (function hook() { if (!G.fxStep) return setTimeout(hook, 20); const fs0 = G.fxStep; G.fxStep = function () { clk += 1; const s0 = SC.shake || 0, r = fs0.apply(this, arguments); if (G.KF && G.KF.WP && G.KF.WP() && s0 > (SC.shake || 0)) SC.shake = s0 * 0.86; return r; }; })();   // 92_lab 把震動壓到 1～3：武器重做後由本模組的分級決定，這裡只做自然衰減
  function add(life, layer, draw, step) { const b = now(); return VX.custom((o, ctx) => { const u = now() - b; if (u < 0 || u > life) return; ctx.save(); try { draw(ctx, u, u / life); } finally { ctx.restore(); } }, Math.ceil(life) + 1, layer || 'o', step ? { step } : undefined); }
  const K = y => HH() * S(y);
  /* ---------- 光點（解析式運動：阻力＋上飄＋搖擺；大小先長後縮） ---------- */
  function motes(x, y, z, n, o) { const C = cur; o = o || {}; const k = K(y), sp = o.sp || 1, life = o.life || 30, P = [];
    for (let i = 0; i < n; i++) { const a = o.ang !== undefined ? o.ang + rnd(-(o.spread || 0.8), o.spread || 0.8) : rnd(0, TAU), v = rnd(0.35, 1) * sp;
      P.push({ x0: (o.rx ? rnd(-o.rx, o.rx) : 0), z0: z + (o.rz ? rnd(-o.rz, o.rz) : 0), vx: Math.cos(a) * v, vz: -Math.sin(a) * v * 0.7 + rnd(0, 0.25), up: o.up !== undefined ? o.up : rnd(0.1, 0.4), sz: rnd(0.05, 0.11) * (o.sz || 1), l: life * rnd(0.6, 1), ph: rnd(0, TAU), d: o.stag ? rnd(0, o.stag) : 0 }); }
    add(life + (o.stag || 0), o.layer || 'o', (ctx, u) => { ctx.globalCompositeOperation = 'screen';
      for (const p of P) { const t = u - p.d; if (t < 0 || t > p.l) continue; const q = t / p.l, e = (1 - Math.exp(-t * 0.12)) / 0.12, px = x + (p.x0 + p.vx * e * 0.05 + Math.sin(t * 0.15 + p.ph) * 0.04) * k, pz = (p.z0 + p.vz * e * 0.04 + p.up * q) * k,
          s = p.sz * k * (q < 0.2 ? 0.5 + q * 2.5 : 1 - (q - 0.2) * 0.9); spr(ctx, C.T.mote, px, y - pz, s * 2, s * 2, (1 - ei2(q)) * 0.95); } }); }
  /* ---------- 局部光：地面＋（可選）角色高度 ---------- */
  function light(x, y, r, life, a, z) { const C = cur, x3 = X3(); const k = K(y); add(life, 'g', (ctx, u, q) => { const e = Math.min(1, u / 2) * (1 - eo3(q)); if (x3) under(ctx, C, x, y, r * k * 2.6, r * k * 0.9, 0.3 * e); ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gm, x, y, r * k * 2.2, r * k * 0.75, (a || 0.5) * e); });
    if (z !== undefined) add(life * 0.6, 'o', (ctx, u, q) => { ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gd, x, y - z * k, r * k * 1.6, r * k * 1.6, (a || 0.5) * 0.45 * (1 - eo3(q))); }); }
  /* ---------- 刀光：實心漸細月牙 ---------- */
  /* o：x,y 腳底；cy 弧心高（身高倍）；f 面向；r 半徑；sq 透視壓扁；rot 弧面旋轉；a0→a1 掃過；w 厚；dur 掃過格數；life；tier 0 招式／1 技／2 秘傳；follow 跟著主角 */
  function smear(o) { if (G.WFX && G.WFX.norm()) return G.WFX.smear(o);   /* r3.227.0：普攻改走 168_wfx */ const C = cur, x3 = X3(); if (x3) o = Object.assign({}, o, { w: (o.w || 0.3) * 1.3 }, (o.tier || 0) > 0 ? { life: Math.round((o.life || (o.dur || 4) + 9) * 1.5) } : null);   /* r3.172.0：技／秘傳的刀光多停留 50%（原本一閃而過看不清） */ const y = o.y, k = K(y), dur = o.dur || 4, life = o.life || dur + 9, span = o.a1 - o.a0, dir = Math.sign(span) || 1, trailMax = Math.min(Math.abs(span), o.trail || 2.6), sq = o.sq === undefined ? 0.6 : o.sq, rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot), tier = o.tier || 0;
    const P = (a, r, cx, cy) => { const lx = Math.cos(a) * r, ly = Math.sin(a) * r * sq; return [cx + (lx * cs - ly * sn) * o.f, cy + (lx * sn + ly * cs)]; };
    const nM = o.motes !== undefined ? o.motes : 5 + tier * 4, M = []; for (let i = 0; i < nM; i++) M.push({ v: rnd(0.15, 1), dr: rnd(0.1, 0.45), up: rnd(0.05, 0.35), sz: rnd(0.04, 0.08), l: rnd(14, 24) });
    add(life + 26, 'o', (ctx, u) => { const cx = o.follow ? H.x : o.x, cy = y - (o.cy === undefined ? 0.55 : o.cy) * k, R = o.r * k, W = (o.w || 0.3) * k;
      const sw = cl(u / dur, 0, 1), hd = o.a0 + span * eo3(sw), fade = u <= dur ? 1 : cl(1 - (u - dur) / (life - dur), 0, 1);
      let tl = hd - dir * trailMax * Math.min(1, sw * 1.5) * (u <= dur ? 1 : ei2(fade)); if (dir * (tl - o.a0) < 0) tl = o.a0;
      ctx.globalCompositeOperation = 'source-over';
      if (fade > 0 && Math.abs(hd - tl) > 0.02) { const N = 32, out = [], inn = [], rim = [];
        for (let i = 0; i <= N; i++) { const v = i / N, a = tl + (hd - tl) * v, tip = v > 0.94 ? 0.35 + 0.65 * (1 - v) / 0.06 : 1, th = W * Math.pow(v, 0.9) * (0.3 + 0.7 * fade) * tip; out.push(P(a, R, cx, cy)); inn.push(P(a, R - th, cx, cy)); rim.push(P(a, R - th * 0.26, cx, cy)); }
        /* r3.170.0 墨邊襯底：比刀光略寬的深色月牙＋沿弧暗影，亮地面上輪廓才清楚 */
        if (x3) { for (let j = 0; j < 5; j++) { const i = Math.round(N * (0.3 + j * 0.17)), p = inn[Math.min(N, i)], q2 = out[Math.min(N, i)]; under(ctx, C, (p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2, W * 3.4, W * 3.4, 0.2 * fade * (0.5 + j * 0.12)); }
          const A2 = (i, f) => { const o2 = out[i], n2 = inn[i]; return [o2[0] + (n2[0] - o2[0]) * f, o2[1] + (n2[1] - o2[1]) * f]; };
          ctx.fillStyle = 'rgba(' + C.ink + ',' + (0.55 * fade).toFixed(3) + ')'; ctx.beginPath(); let q0 = A2(0, -0.14); ctx.moveTo(q0[0], q0[1]); for (let i = 1; i <= N; i++) { const q = A2(i, -0.14); ctx.lineTo(q[0], q[1]); } for (let i = N; i >= 0; i--) { const q = A2(i, 1.12); ctx.lineTo(q[0], q[1]); } ctx.closePath(); ctx.fill(); }
        /* 底光：沿刀頭 2/3 放柔光貼圖 */
        ctx.globalCompositeOperation = 'screen'; for (let j = 0; j < 5; j++) { const i = Math.round(N * (0.35 + j * 0.16)), p = inn[Math.min(N, i)], q2 = out[Math.min(N, i)]; spr(ctx, C.T.gd, (p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2, W * 3.2, W * 3.2, 0.3 * fade * (0.5 + j * 0.12)); }
        ctx.globalCompositeOperation = 'source-over';
        /* 本體：三層由內往外（內緣半透明 → 外緣實心淺藍），外緣清楚、內緣柔；沿長度分 8 段由尾到頭漸亮 */
        const band = (f0, f1, colF, aF) => { const SEG = 8; for (let j = 0; j < SEG; j++) { const i0 = Math.floor(j * N / SEG), i1 = Math.min(N, Math.floor((j + 1) * N / SEG) + 1), v = (j + 0.5) / SEG, al = aF(v) * fade; if (al < 0.01) continue;
            const A = (i, f) => { const o2 = out[i], n2 = inn[i]; return [o2[0] + (n2[0] - o2[0]) * f, o2[1] + (n2[1] - o2[1]) * f]; };
            ctx.fillStyle = 'rgba(' + colF(v) + ',' + al.toFixed(3) + ')'; ctx.beginPath(); let q0 = A(i0, f0); ctx.moveTo(q0[0], q0[1]); for (let i = i0 + 1; i <= i1; i++) { const q = A(i, f0); ctx.lineTo(q[0], q[1]); } for (let i = i1; i >= i0; i--) { const q = A(i, f1); ctx.lineTo(q[0], q[1]); } ctx.closePath(); ctx.fill(); } };
        band(0.5, 1, v => ramp(C, v * 0.6), v => 0.2 + 0.35 * v);
        band(0.16, 0.55, v => ramp(C, 0.25 + v * 0.7), v => 0.4 + 0.55 * v);
        band(0, 0.18, v => ramp(C, 0.55 + v * 0.45), v => 0.45 + 0.55 * v);
        if (x3) { /* 白熱亮芯（只在刀頭半段）＋筆觸紋理（沿弧的細亮線，長短不一） */
          band(0.02, 0.1, () => C.hot, v => v < 0.35 ? 0 : (v - 0.35) / 0.65 * 0.95);
          const A3 = (i, f) => { const o2 = out[i], n2 = inn[i]; return [o2[0] + (n2[0] - o2[0]) * f, o2[1] + (n2[1] - o2[1]) * f]; };
          ctx.lineCap = 'round'; for (const [f, v0, v1, al] of [[0.3, 0.2, 0.92, 0.5], [0.48, 0.38, 0.97, 0.38], [0.66, 0.12, 0.8, 0.3], [0.82, 0.5, 0.95, 0.22]]) { const i0 = Math.round(N * v0), i1 = Math.round(N * v1); ctx.strokeStyle = 'rgba(' + C.lite + ',' + (al * fade).toFixed(3) + ')'; ctx.lineWidth = Math.max(0.8, W * 0.035);
            ctx.beginPath(); const s0 = A3(i0, f); ctx.moveTo(s0[0], s0[1]); for (let i = i0 + 1; i <= i1; i++) { const q = A3(i, f); ctx.lineTo(q[0], q[1]); } ctx.stroke(); } }
        /* 刀頭光（只在掃過時） */
        if (u < dur + 2) { const p = P(hd, R - W * 0.25, cx, cy), a = 1 - cl((u - dur * 0.5) / (dur * 0.5 + 2), 0, 1); ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gl, p[0], p[1], W * (2.2 + tier * 0.6), W * (2.2 + tier * 0.6), 0.75 * a); spr(ctx, C.T.mote, p[0], p[1], W * 0.9, W * 0.9, 0.8 * a); } }
      /* 碎光：刀身掃過後沿弧線剝落、往外飄 */
      ctx.globalCompositeOperation = 'screen';
      for (const m of M) { const t0 = dur * eo3(m.v) * 0.7 + (life - dur) * 0.35 * m.v, t = u - t0; if (t < 0 || t > m.l) continue; const q = t / m.l, a = o.a0 + span * m.v, p = P(a, R - W * 0.35 + m.dr * k * eo3(q) * 0.6, cx, cy), s = m.sz * k * (1 - q * 0.7);
        spr(ctx, C.T.mote, p[0], p[1] - m.up * k * q, s * 2, s * 2, 0.9 * (1 - ei2(q))); } });
    if (tier > 0 || o.lit) light(o.x, y, (o.r || 1) * 0.9, dur + 12, 0.28 + tier * 0.1, o.cy === undefined ? 0.55 : o.cy); }
  /* ---------- 直線劍氣（雙尖菱形，由中心往兩端長出） ---------- */
  function qi(o) { const C = cur, x3 = X3(); if (x3) o = Object.assign({}, o, { w: (o.w || 0.12) * 1.35 }); const y = o.y, k = K(y), dur = o.dur || 3, life = o.life || 14, L = o.len * k / 2, Wd = (o.w || 0.12) * k, ca = Math.cos(o.ang), sa = Math.sin(o.ang);
    add(life + 20, 'o', (ctx, u) => { const g = eo5(cl(u / dur, 0, 1)), fade = u <= dur ? 1 : cl(1 - (u - dur) / (life - dur), 0, 1), cx = o.x, cy = y - (o.z || 0.55) * k, hl = L * g, w = Wd * (0.25 + 0.75 * fade) * (o.pulse ? 0.85 + 0.15 * Math.sin(u * 0.6) : 1);
      if (fade > 0 && hl > 1) { ctx.translate(cx, cy); ctx.rotate(o.ang); ctx.globalCompositeOperation = 'screen'; for (const t of [-0.6, -0.2, 0.2, 0.6]) spr(ctx, C.T.gd, t * hl, 0, w * 5, w * 5, 0.35 * fade);
        ctx.globalCompositeOperation = 'source-over'; const lens = (hw, col, al) => { ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(-hl, 0); ctx.quadraticCurveTo(0, -hw * 2, hl, 0); ctx.quadraticCurveTo(0, hw * 2, -hl, 0); ctx.closePath(); ctx.fill(); };
        if (x3) lens(w * 1.7, C.ink, 0.5 * fade); lens(w, C.deep, 0.6 * fade); lens(w * 0.6, C.mid, 0.9 * fade); lens(w * 0.22, C.lite, 0.95 * fade); if (x3) lens(w * 0.08, C.hot, fade); }
    }, null);
    if (o.motes !== 0) c_mLine(o.x, y, o.z || 0.55, o.ang, o.len, o.motes || 8, dur + (life - dur) * 0.5); }
  function c_mLine(x, y, z, ang, len, n, delay) { const k = K(y); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; motes(x + Math.cos(ang) * t * len * k, y, z - Math.sin(ang) * t * len, 1, { sp: 0.6, life: 22, stag: delay }); } }
  /* ---------- 突刺光：尖錐由身前射出 ---------- */
  function stab(o) { if (G.WFX && G.WFX.norm()) return G.WFX.stab(o); const C = cur, x3 = X3(); if (x3) o = Object.assign({}, o, { w: (o.w || 0.12) * 1.7, life: Math.round((o.life || 12) * 1.3) });   /* r3.172.0：突刺光加粗（踏步引刃、一息截隙原本只剩一條細線） */ const y = o.y, k = K(y), dur = o.dur || 3, life = o.life || 12;
    add(life + 4, 'o', (ctx, u) => { const ext = eo5(cl(u / dur, 0, 1)), fade = u <= dur ? 1 : cl(1 - (u - dur) / (life - dur), 0, 1), L = o.len * k * (0.25 + 0.75 * ext), b = L * 0.85 * ei2(1 - fade), w = (o.w || 0.12) * k * (0.4 + 0.6 * fade);
      if (fade <= 0) return; ctx.translate(o.x + o.f * 0.25 * k, y - (o.cy || 0.45) * k); ctx.scale(o.f, 1); ctx.rotate(o.ang || 0);
      ctx.globalCompositeOperation = 'screen'; for (const t of [0.35, 0.65, 0.92]) spr(ctx, C.T.gd, L * t, 0, w * 5, w * 4, 0.35 * fade);
      ctx.globalCompositeOperation = 'source-over'; const cone = (hw, col, al) => { ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(b, 0); ctx.quadraticCurveTo(b + (L - b) * 0.3, -hw, L, 0); ctx.quadraticCurveTo(b + (L - b) * 0.3, hw, b, 0); ctx.closePath(); ctx.fill(); };
      if (x3) cone(w * 1.7, C.ink, 0.5 * fade); cone(w, C.deep, 0.65 * fade); cone(w * 0.55, C.mid, 0.9 * fade); cone(w * 0.18, C.lite, fade); if (x3) cone(w * 0.07, C.hot, fade);
      if (u < dur + 2) { ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.mote, L, 0, w * 2.2, w * 2.2, 0.8); if (o.tip) spr(ctx, PAL.ember.T.gl, L, 0, w * 3.2, w * 3.2, 0.7); } });
    if (o.echo) for (let j = 1; j <= o.echo; j++) add(life * 0.6, 'o', (ctx, u) => { const d = u - j * 1.5; if (d < 0) return; const fade = 1 - d / (life * 0.6 - j * 1.5), L = o.len * k * (0.9 - j * 0.12), w = (o.w || 0.12) * k * 0.6; if (fade <= 0) return; ctx.translate(o.x + o.f * 0.25 * k, y - (o.cy || 0.45) * k + (j % 2 ? -1 : 1) * j * 0.05 * k); ctx.scale(o.f, 1); ctx.rotate(o.ang || 0);
      ctx.fillStyle = 'rgba(' + C.mid + ',' + (0.35 * fade).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(L * 0.2, 0); ctx.quadraticCurveTo(L * 0.5, -w, L, 0); ctx.quadraticCurveTo(L * 0.5, w, L * 0.2, 0); ctx.fill(); });   // 殘槍：連刺的速度感
    motes(o.x + o.f * (o.len * 0.85 + 0.25) * k, y, o.cy || 0.45, 5, { ang: o.f > 0 ? 0 : Math.PI, spread: 0.5, sp: 1.3, life: 18 }); }
  /* ---------- 命中：柔光爆＋減速火花（淚滴形）＋殘留光點 ---------- */
  function burst(x, y, z, pw, ang) { const C = cur, x3 = X3(); const k = K(y), n = 3 + Math.round(pw * 3) + (x3 ? 4 : 0), SP = [];
    for (let i = 0; i < n; i++) { const a = ang !== undefined ? ang + rnd(-0.7, 0.7) : rnd(0, TAU), v = rnd(0.6, 1) * (0.8 + pw * 0.35); SP.push({ ca: Math.cos(a), sa: Math.sin(a), v, l: rnd(7, 11) + pw * 2 }); }
    add(16 + pw * 3, 'o', (ctx, u) => { const cy = y - z * k; const fq = cl(u / (5 + pw * 2), 0, 1); if (x3) under(ctx, C, x, cy, k * (0.9 + 0.4 * pw), k * (0.9 + 0.4 * pw), 0.42 * (1 - fq)); ctx.globalCompositeOperation = 'screen';
      spr(ctx, C.T.gm, x, cy, k * (0.45 + 0.25 * pw) * (0.6 + 0.6 * eo3(fq)), k * (0.45 + 0.25 * pw) * (0.6 + 0.6 * eo3(fq)), 0.8 * (1 - fq)); spr(ctx, C.T.mote, x, cy, k * 0.25 * (1 + pw * 0.3), 0, 0.9 * (1 - eo3(fq)));
      for (const p of SP) { const q = u / p.l; if (q > 1) continue; const d = p.v * k * 0.55 * eo3(q), sp = p.v * (1 - q), px = x + p.ca * d, py = cy - p.sa * d, L = k * 0.18 * sp + 2, Wd = k * 0.025 * (1 - q) + 0.8;
        ctx.globalCompositeOperation = 'source-over'; if (x3) { ctx.strokeStyle = 'rgba(' + C.ink + ',' + (0.6 * (1 - q)).toFixed(3) + ')'; ctx.lineWidth = 2; } ctx.fillStyle = 'rgba(' + mix(x3 ? C.hot : C.lite, C.mid, q) + ',' + (1 - q).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(px + p.ca * Wd * 1.5, py - p.sa * Wd * 1.5);
        ctx.quadraticCurveTo(px - p.sa * Wd, py - p.ca * Wd, px - p.ca * L, py + p.sa * L); ctx.quadraticCurveTo(px + p.sa * Wd, py + p.ca * Wd, px + p.ca * Wd * 1.5, py - p.sa * Wd * 1.5); if (x3) ctx.stroke(); ctx.fill(); } });
    motes(x, y, z, 2 + Math.round(pw * 2), { sp: 0.8, life: 24 }); if (pw >= 2) light(x, y, 0.6 + pw * 0.25, 14, 0.35, z); }
  /* ---------- r3.170.0 地面刀痕：命中後留在地上 1.5 秒（深色細痕＋亮芯，慢慢淡掉） ---------- */
  function scar(x, y, f, pw) { const C = cur, k = K(y), L = k * (0.5 + 0.18 * pw), ang = rnd(-0.25, 0.25), ox = rnd(-0.15, 0.15) * k;
    add(90, 'g', (ctx, u, q) => { const g = eo5(cl(u / 3, 0, 1)), a = 1 - ei2(q); ctx.translate(x + ox, y + 0.04 * k); ctx.scale(f, 0.32); ctx.rotate(ang);
      const lens = (hw, col, al) => { ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(-L * g, 0); ctx.quadraticCurveTo(0, -hw * 2, L * g, 0); ctx.quadraticCurveTo(0, hw * 2, -L * g, 0); ctx.fill(); };
      lens(k * 0.05, '12,12,24', 0.55 * a); if (q < 0.35) lens(k * 0.02, C.lite, 0.9 * (1 - q / 0.35)); }); }
  /* ---------- 地面揚霧（取代衝擊圈）：霧團沿地面往外推開 ---------- */
  function puff(x, y, pw, life) { const C = cur; const k = K(y), n = 6 + Math.round(pw * 4), P = []; life = life || 34;
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(-0.2, 0.2); P.push({ ca: Math.cos(a), sa: Math.sin(a), v: rnd(0.7, 1) * (0.5 + pw * 0.4), s: rnd(0.5, 0.8) }); }
    add(life, 'o', (ctx, u, q) => { for (const p of P) { const d = p.v * k * eo3(q); spr(ctx, C.T.mist, x + p.ca * d, y + p.sa * d * 0.3 - k * 0.05, k * p.s * (0.7 + q), k * p.s * 0.5 * (0.7 + q), 0.32 * (1 - q) * Math.min(1, u / 2)); } });
    light(x, y, 0.8 + pw * 0.4, 18, 0.35 + pw * 0.08); motes(x, y, 0.1, 3 + pw * 2, { sp: 1, up: 0.4, life: 30, rx: 0.3 }); }
  function mist(x, y, R, life, a) { const C = cur; const k = K(y), P = []; for (let i = 0; i < 9; i++) P.push({ x: rnd(-1, 1) * R, y: rnd(-0.3, 0.3) * R, ph: rnd(0, TAU), s: rnd(0.9, 1.5) });
    add(life, 'o', (ctx, u) => { const e = Math.min(1, u / 10) * Math.min(1, (life - u) / 14); for (const p of P) spr(ctx, C.T.mist, x + (p.x + Math.sin(u * 0.03 + p.ph) * 0.15) * k, y + p.y * k * 0.4 - 0.2 * k, k * p.s * 1.8, k * p.s * 0.7, 0.2 * (a || 1) * e); }); }
  /* ---------- 聚氣：光點由外往刀上收（越來越快、越來越小） ---------- */
  function charge(x, y, z, life, n) { const C = cur; const k = K(y), P = []; for (let i = 0; i < (n || 12); i++) P.push({ a: rnd(0, TAU), r: rnd(0.7, 1.3), d: rnd(0, life * 0.4), s: rnd(0.05, 0.09) });
    add(life, 'o', (ctx, u, q) => { ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gm, x, y - z * k, k * 0.5 * eo3(q), 0, 0.6 * q);
      for (const p of P) { const t = cl((u - p.d) / (life - p.d), 0, 1); if (t <= 0) continue; const rr = p.r * k * (1 - ei2(t)), px = x + Math.cos(p.a + t * 1.5) * rr, py = y - z * k + Math.sin(p.a + t * 1.5) * rr * 0.5; spr(ctx, C.T.mote, px, py, p.s * k * 2 * (1 - t * 0.5), 0, Math.min(1, t * 3)); } }); }
  /* ---------- 架勢：刀身亮起＋光點緩緩上飄（跟著主角） ---------- */
  function aura(life) { const C = cur, x3 = X3(); add(life, 'o', (ctx, u) => { const k = K(H.y), e = Math.min(1, u / 5) * Math.min(1, (life - u) / 6), p = 0.85 + 0.15 * Math.sin(u * 0.25), bx = H.x + H.face * 0.18 * k, by = H.y - 0.5 * k; ctx.globalCompositeOperation = 'screen';
      spr(ctx, C.T.gd, bx, by, k * 0.9 * p, k * 0.9 * p, 0.55 * e); spr(ctx, C.T.gl, bx, by, k * 0.3 * p, k * 0.3 * p, 0.6 * e);
      for (let i = 0; i < 6; i++) { const ph = ((u * 0.02 + i / 6) % 1), px = bx + Math.sin(i * 2.1 + u * 0.05) * 0.25 * k, py = by - ph * 0.7 * k; spr(ctx, C.T.mote, px, py, k * 0.09 * (1 - ph), 0, e * (1 - ph)); }
      if (x3) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(' + C.ink + ',' + (0.75 * e) + ')'; ctx.beginPath(); ctx.arc(H.x, H.y - 1.3 * k, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(' + C.lite + ',' + (0.8 * e) + ')'; ctx.lineWidth = 1; ctx.stroke(); }   /* r3.172.0：「架」字加墨底圓牌，亮地面上看得見 */
      G.txt && G.txt('架', H.x, H.y - 1.28 * k, 11, 'rgba(' + (x3 ? C.hot : C.lite) + ',' + e + ')', 'center', G.FONT_S, 900); });
    add(life, 'g', (ctx, u) => { const k = K(H.y), e = Math.min(1, u / 5) * Math.min(1, (life - u) / 6); ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gm, H.x, H.y, k * 1.3, k * 0.4, 0.35 * e); }); }
  /* ---------- 緩速：敵人腳下冰霧＋冰晶光點上飄（跟著敵人） ---------- */
  function frost(e, life) { const C = cur; add(life, 'o', (ctx, u) => { if (!e || e.st === 'dead' || !G.E.includes(e)) return; const k = K(e.y), a = Math.min(1, u / 4) * Math.min(1, (life - u) / 10); ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gd, e.x, e.y - 0.1 * k, k * 0.9, k * 0.3, 0.35 * a);
      for (let i = 0; i < 7; i++) { const ph = ((u * 0.025 + i / 7) % 1); spr(ctx, C.T.mote, e.x + Math.sin(i * 2.4) * 0.3 * k, e.y - ph * 0.9 * k, k * 0.07 * (1 - ph), 0, a * (1 - ph)); } }); }
  /* ---------- 雷：鋸齒漸細＋外暈；每 2 格重抖 ---------- */
  function bolt(x0, y0, x1, y1, life, w, br) { const C = cur, x3 = X3(); if (x3) w = (w || 3) * 1.8;   /* r3.173.0：雷光加粗＋墨邊＋白熱芯（原本細到看不見） */ const segs = 9, len = Math.hypot(x1 - x0, y1 - y0); let pts = null, seed = -1;
    add(life, 'o', (ctx, u, q) => { const sd = Math.floor(u / 2); if (sd !== seed || !pts) { seed = sd; pts = []; for (let i = 0; i <= segs; i++) { const t = i / segs, j = (i === 0 || i === segs) ? 0 : rnd(-1, 1) * len * 0.07; pts.push([x0 + (x1 - x0) * t + j, y0 + (y1 - y0) * t + j * 0.3]); } }
      const a = (u < 2 ? 1 : 1 - eo3(q)) * (0.75 + 0.25 * Math.sin(u * 2.3)); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < segs; i += 2) spr(ctx, C.T.gd, pts[i][0], pts[i][1], (w || 3) * 9, 0, 0.35 * a);
      ctx.globalCompositeOperation = 'source-over'; if (x3) { ctx.strokeStyle = 'rgba(' + C.ink + ',' + (0.55 * a).toFixed(3) + ')'; ctx.lineWidth = (w || 3) * 3.2; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= segs; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
      for (let i = 0; i < segs; i++) { const t = i / segs, lw = (w || 3) * (1.6 - t * 1.1); ctx.strokeStyle = 'rgba(' + C.mid + ',' + (0.8 * a).toFixed(3) + ')'; ctx.lineWidth = lw * 1.8; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(' + C.lite + ',' + a.toFixed(3) + ')'; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
        if (x3) { ctx.strokeStyle = 'rgba(' + C.hot + ',' + a.toFixed(3) + ')'; ctx.lineWidth = Math.max(1, lw * 0.22); ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke(); } }
      if (br) for (let b = 1; b <= br; b++) { const i = Math.min(segs - 1, b * 3), p = pts[i], d = rnd(-1, 1) > 0 ? 1 : -1, ex = p[0] + d * len * 0.15, ey = p[1] + len * 0.1; ctx.strokeStyle = 'rgba(' + C.mid + ',' + (0.55 * a).toFixed(3) + ')'; ctx.lineWidth = (w || 3) * 0.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo((p[0] + ex) / 2 + rnd(-4, 4), (p[1] + ey) / 2); ctx.lineTo(ex, ey); ctx.stroke(); } }); }
  /* ---------- 刀鍔閃：拔刀／收刀那一點光 ---------- */
  function glint(x, y, z, sz, life) { const C = cur; const k = K(y); life = life || 10; add(life, 'o', (ctx, u, q) => { ctx.globalCompositeOperation = 'screen'; const e = u < 2 ? u / 2 : 1 - eo3(q), s = (sz || 0.35) * k;
      spr(ctx, C.T.gm, x, y - z * k, s * 2, s * 2, 0.6 * e); ctx.translate(x, y - z * k); ctx.rotate(0.4 + u * 0.05); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(' + C.lite + ',' + (0.95 * e).toFixed(3) + ')';
      for (const [L, W] of [[s, s * 0.09], [s * 0.6, s * 0.07]]) { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -W, L, 0); ctx.quadraticCurveTo(0, W, -L, 0); ctx.fill(); ctx.rotate(Math.PI / 2); } }); }
  /* ---------- 飛行月牙（實心漸細，給斷風等飛行劍氣） ---------- */
  function moonShape(ctx, x, y, R, f, al, k) { const C = cur; ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.globalCompositeOperation = 'screen'; spr(ctx, C.T.gd, -R * 0.2, 0, R * 2.8, R * 2.8, 0.45 * al); ctx.globalCompositeOperation = 'source-over';
    const cres = (r, off, col, a) => { ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(0, 0, r, -1.25, 1.25); ctx.arc(-off, 0, r * 0.95, 1.2, -1.2, true); ctx.closePath(); ctx.fill(); };
    cres(R, R * 0.32, C.deep, 0.7 * al); cres(R * 0.98, R * 0.2, C.mid, 0.9 * al); cres(R * 0.97, R * 0.07, C.lite, al); ctx.restore(); }
  /* ---------- 命中回饋：打刀技／特技／秘傳 ---------- */
  /* ---------- 地裂（野太刀）：焦痕柔影＋3～5 道由中心長出的發光細裂縫（漸細實心，不是線），火光先退、焦痕後退 ---------- */
  const SCORCH = tex(64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(30,18,12,.55)'); r.addColorStop(0.6, 'rgba(30,18,12,.25)'); r.addColorStop(1, 'rgba(30,18,12,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  function crack(x, y, r, life, glow) { const C = cur, k = K(y), nB = 3 + Math.floor(rnd(0, 3)), B = []; life = life || 50;
    for (let i = 0; i < nB; i++) { const a = i / nB * TAU + rnd(-0.4, 0.4), L = r * rnd(0.5, 0.95), pts = [[0, 0]]; for (let j = 1; j <= 6; j++) { const t = j / 6, aa = a + rnd(-0.3, 0.3); pts.push([Math.cos(aa) * L * t, Math.sin(aa) * L * t]); } B.push(pts); }
    add(life, 'g', (ctx, u, q) => { const g = eo5(cl(u / 5, 0, 1)), dk = 1 - cl((q - 0.5) / 0.5, 0, 1), ga = (glow ? 1 : 0.8) * Math.min(1, u / 2) * (1 - eo3(cl(q * 1.3, 0, 1))) + 0.15 * dk;
      spr(ctx, SCORCH, x, y, r * k * 1.5, r * k * 0.5, 0.9 * dk * g);
      const poly = (pts, w0, col, al) => { const n = Math.max(2, Math.ceil(pts.length * g)), P = pts.slice(0, n), Lf = [], Rt = [];
        for (let i = 0; i < P.length; i++) { const p = P[i], q2 = P[Math.min(P.length - 1, i + 1)], p0 = P[Math.max(0, i - 1)], dx = q2[0] - p0[0], dy = q2[1] - p0[1], dl = Math.hypot(dx, dy) || 1, w = w0 * Math.pow(1 - i / P.length, 0.8), nx = -dy / dl * w, ny = dx / dl * w;
          Lf.push([x + (p[0] + nx) * k, y + (p[1] + ny) * k * 0.35]); Rt.push([x + (p[0] - nx) * k, y + (p[1] - ny) * k * 0.35]); }
        ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(Lf[0][0], Lf[0][1]); for (const p of Lf) ctx.lineTo(p[0], p[1]); for (let i = Rt.length - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]); ctx.closePath(); ctx.fill(); };
      ctx.globalCompositeOperation = 'screen'; for (const P of B) for (let i = 1; i < P.length * g; i += 2) spr(ctx, C.T.gd, x + P[i][0] * k, y + P[i][1] * k * 0.35, k * 0.4, k * 0.2, 0.45 * ga);
      ctx.globalCompositeOperation = 'source-over'; for (const P of B) poly(P, 0.03, C.deep, 0.75 * ga); for (const P of B) poly(P, 0.016, C.mid, 0.95 * ga); for (const P of B) poly(P, 0.006, C.lite, ga); }); }
  /* ---------- 碎石：不規則塊狀，拋物線落地後淡出；受光面帶武器色 ---------- */
  function rocks(x, y, n, pw) { const C = cur, k = K(y), R = []; pw = pw || 1;
    for (let i = 0; i < n; i++) { const a = rnd(0.35, 2.8), v = rnd(0.6, 1) * (0.9 + pw * 0.5), sh = []; for (let j = 0; j < 5; j++) sh.push(rnd(0.6, 1)); R.push({ vx: Math.cos(a) * v * 0.04, vz: Math.sin(a) * v * 0.07, s: rnd(0.04, 0.08) * (0.8 + pw * 0.25), r0: rnd(0, TAU), vr: rnd(-0.3, 0.3), sh, ox: rnd(-0.2, 0.2) }); }
    add(40, 'o', (ctx, u, q) => { for (const p of R) { let t = u, z = p.vz * t - 0.0035 * t * t; const tl = p.vz / 0.0035 * 2; if (t > tl) { t = tl; z = 0; } const px = x + (p.ox + p.vx * t) * k, py = y - Math.max(0, z) * k, s = p.s * k, a = 1 - cl((q - 0.65) / 0.35, 0, 1);
        ctx.save(); ctx.translate(px, py); ctx.rotate(p.r0 + p.vr * t); ctx.beginPath(); for (let j = 0; j < 5; j++) { const an = j / 5 * TAU; ctx[j ? 'lineTo' : 'moveTo'](Math.cos(an) * s * p.sh[j], Math.sin(an) * s * p.sh[j] * 0.8); } ctx.closePath();
        ctx.fillStyle = 'rgba(72,58,48,' + a.toFixed(3) + ')'; ctx.fill(); ctx.fillStyle = 'rgba(' + C.mid + ',' + (0.55 * a * (1 - q)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.2); ctx.lineTo(0, -s * 0.75); ctx.lineTo(s * 0.6, -s * 0.3); ctx.closePath(); ctx.fill(); ctx.restore(); } }); }
  /* ---------- 火星：往上飄的光點（野太刀）---------- */
  function embers(x, y, z, n, o) { o = o || {}; motes(x, y, z, n, { sp: o.sp || 0.6, up: o.up || 1.2, life: o.life || 34, rx: o.rx || 0.25, sz: o.sz || 0.8, stag: o.stag }); }
  /* ---------- 葉片（薙刀）：雙色尖葉，翻轉、隨風飄、慢慢落下 ---------- */
  function leaves(x, y, z, n, o) { const C = cur, k = K(y), P = []; o = o || {}; const life = o.life || 40;
    for (let i = 0; i < n; i++) { const a = o.ang !== undefined ? o.ang + rnd(-(o.spread || 1), o.spread || 1) : rnd(0, TAU), v = rnd(0.4, 1) * (o.sp || 1); P.push({ x0: o.rx ? rnd(-o.rx, o.rx) : 0, z0: z + (o.rz ? rnd(-o.rz, o.rz) : 0), vx: Math.cos(a) * v, vz: Math.abs(Math.sin(a)) * v * 0.6 + 0.2, s: rnd(0.05, 0.09), r0: rnd(0, TAU), vr: rnd(-0.3, 0.3), ph: rnd(0, TAU), l: life * rnd(0.6, 1), d: o.stag ? rnd(0, o.stag) : 0, c2: Math.random() < 0.5 }); }
    add(life + (o.stag || 0), 'o', (ctx, u) => { for (const p of P) { const t = u - p.d; if (t < 0 || t > p.l) continue; const q = t / p.l, e = (1 - Math.exp(-t * 0.08)) / 0.08, px = x + (p.x0 + p.vx * e * 0.05 + Math.sin(t * 0.12 + p.ph) * 0.12) * k, pz = Math.max(0, p.z0 + p.vz * e * 0.04 - 0.004 * t) * k, s = p.s * k, fl = Math.cos(t * 0.25 + p.ph);
        ctx.save(); ctx.translate(px, y - pz); ctx.rotate(p.r0 + p.vr * t); ctx.scale(1, 0.35 + 0.65 * Math.abs(fl)); ctx.globalAlpha = 1 - q * q;
        ctx.fillStyle = 'rgba(' + (p.c2 ? C.mid : C.deep) + ',0.95)'; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.55, s, 0); ctx.quadraticCurveTo(0, s * 0.55, -s, 0); ctx.fill();
        ctx.fillStyle = 'rgba(' + C.lite + ',0.8)'; ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.quadraticCurveTo(0, -s * 0.12, s * 0.8, 0); ctx.quadraticCurveTo(0, s * 0.12, -s * 0.8, 0); ctx.fill(); ctx.restore(); } }); }
  /* ---------- 風壓：沿刀弧在地面的投影推開一圈塵霧（取代風切線） ---------- */
  function sweepDust(x, y, f, r, a0, a1, n, pw) { const k = K(y), N = n || 6; for (let i = 0; i < N; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / N, px = x + Math.cos(a) * r * f * k, py = y + Math.sin(a) * r * 0.28 * k; puffAt(px, py, (pw || 1) * 0.35, i * 1.2, Math.cos(a) * f, Math.sin(a)); } }
  function puffAt(x, y, pw, d, dx, dy) { const C = cur, k = K(y); add(30 + d, 'o', (ctx, u) => { const t = u - d; if (t < 0) return; const q = Math.min(1, t / 30), m = eo3(q) * (0.5 + pw) * k; spr(ctx, C.T.mist, x + dx * m, y + dy * m * 0.3 - 0.05 * k, k * (0.6 + pw) * (0.6 + q), k * (0.3 + pw * 0.4) * (0.6 + q), 0.45 * (1 - q) * Math.min(1, t / 2)); }); }
  /* ---------- 命中回饋：打刀／野太刀全部招式（含普攻）用武器色 burst ---------- */
  const HSF = { light: [3, 0, 0.6], mid: [4, 2, 1], heavy: [7, 4, 2], hiden: [12, 7, 3] }, HSN = { light: 0, mid: 1, heavy: 2, hiden: 2 };
  const HNN = { light: [3, 1, 0], mid: [4, 2, 0], heavy: [8, 6, 0.04], hiden: [8, 6, 0.04] }, HNS = { light: [4, 2, 0], mid: [6, 3, 0.02], heavy: [10, 7, 0.05], hiden: [14, 10, 0.08] };   // 野太刀 [停頓格, 震動, 鏡頭推近比例]
  const HGN = { light: [2, 1], mid: [3, 2], heavy: [6, 4], hiden: [6, 4] }, HGS = { light: [3, 2], mid: [5, 3], heavy: [8, 5], hiden: [11, 7] };
  const HYN = { light: [1, 0], mid: [2, 0], heavy: [4, 2], hiden: [4, 2] }, HYS = { light: [2, 0], mid: [3, 1], heavy: [5, 3], hiden: [8, 5] };   // 和弓：精準、輕停頓
  const HLN = { light: [2, 0], mid: [3, 1], heavy: [5, 3], hiden: [5, 3] }, HLS = { light: [2, 1], mid: [4, 2], heavy: [7, 4], hiden: [10, 6] };   // 槍：俐落短停頓
  const WP = () => { const w = G.WPN.curId(); return w === 'katana' ? 'moon' : w === 'nodachi' ? 'ember' : w === 'naginata' ? 'gale' : w === 'yari' ? 'lance' : w === 'yumi' ? 'holy' : null; };
  const isNorm = () => !!(H.act && H.act.mvx && H.act.mvx.norm);
  const im0 = VX.impact; VX.impact = function (e, lv, kind, ang, col) { const A = H.act, sk = A && A.mvx && !A.mvx.norm; if (A && A.mvx) G.KF.skT = G.t;   // 招式結束後才命中的飛行劍氣／延遲爆裂也算（2 秒內）
    const pn = WP(); if (!pn || !(A && A.mvx) && G.t - (G.KF.skT || -1e9) >= 120 || (kind !== 'cut' && kind !== 'pierce' && kind !== 'blunt' && !(pn === 'holy' && kind === 'arrow'))) return im0.apply(this, arguments);
    const k = K(e.y), z = (e.ratio || 1) * 0.5 + (e.lz || 0) / k;
    const norm = !!(A && A.mvx && A.mvx.norm), nod = pn === 'ember';
    if (pn === 'holy') { const F = (norm ? HYN : HYS)[lv] || (norm ? HYN.mid : HYS.mid); G.hitstop = Math.max(G.hitstop || 0, F[0]); SC.shake = Math.max(SC.shake || 0, F[1]); }
    else if (pn === 'lance') { const F = (norm ? HLN : HLS)[lv] || (norm ? HLN.mid : HLS.mid); G.hitstop = Math.max(G.hitstop || 0, F[0]); SC.shake = Math.max(SC.shake || 0, F[1]); }
    else if (pn === 'gale') { const F = (norm ? HGN : HGS)[lv] || (norm ? HGN.mid : HGS.mid); G.hitstop = Math.max(G.hitstop || 0, F[0]); SC.shake = Math.max(SC.shake || 0, F[1]); }   // 薙刀：中等停頓、重而沉的震動
    else if (nod) { const F = (norm ? HNN : HNS)[lv] || (norm ? HNN.mid : HNS.mid); G.hitstop = Math.max(G.hitstop || 0, F[0]); SC.shake = Math.max(SC.shake || 0, F[1]); if (F[2] && G.CAM && G.CAM.vis) G.CAM.vis *= 1 - F[2]; }   // 野太刀：重停頓、重震、鏡頭往前一推
    else if (norm) { G.hitstop = Math.max(G.hitstop || 0, HSN[lv] || 1); if (lv === 'heavy') SC.shake = Math.max(SC.shake || 0, 1); }   // 打刀普攻：沿用原本的輕停頓，只換色
    else { const f = HSF[lv] || HSF.mid; G.hitstop = Math.max(G.hitstop || 0, f[0]); if (f[1]) SC.shake = Math.max(SC.shake || 0, f[1]); }
    const pw = (HSF[lv] || HSF.mid)[2] * (norm ? 0.7 : 1) + (nod ? 0.6 : 0);
    e.flash = (e._vxf && G.playT - e._vxf < 8) ? 1 : 2; e._vxf = G.playT; if (PAL[pn]) { e._hf = norm && G.WFX && G.WFX.WP[G.WPN.curId()] ? { t: G.t, c: '255,250,240', k: 0.16, pw: 0.6, d: H.face } : { t: G.t, c: (pn === 'lance' || pn === 'holy') ? PAL[pn].deep : PAL[pn].mid, k: (pn === 'moon' || pn === 'ember') ? 1 : (pn === 'holy' && norm) ? 0.22 : 0.55, pw: Math.min(3, pw), d: H.face };   /* 淺色色盤（白金、金白）用深色、減半，不然妖怪整隻變白 */ if (!norm && kind === 'cut') use(pn, () => scar(e.x, e.y, H.face, pw)); }   /* r3.170.0：受擊反應（染色閃光＋壓扁回彈）＋地面刀痕 */
    if (norm && G.WFX && G.WFX.WP[G.WPN.curId()] && G.WFX.hit(e, z, pw)) { /* r3.227.0：普攻命中改主題碎光 */ }
    else if (pn === 'holy' && kind === 'arrow' && G.KF.pierce) { const f = H.face, kk = K(e.y); G.KF.pierce(e.x + f * 0.2 * kk * (e.ratio || 1), e.y - z * kk - (e.lz || 0), f, 0, norm ? 0.6 : Math.min(1.4, 0.7 + 0.25 * pw), ['70,44,10', '255,206,120', '255,252,240']); }   /* r3.190.0：和弓命中改成「射穿」的錐形金光與碎光（原本的羽毛扇拿掉） */
    else if (pn === 'lance' && G.KF.pierce) { const f = H.face, kk = K(e.y); G.KF.pierce(e.x + f * 0.28 * kk * (e.ratio || 1), (e.lz > 4 ? e.y - z * kk - e.lz : H.y - 0.55 * K(H.y) + (e.y - H.y) * 0.5), f, kind === 'pierce' ? 0 : -0.55, Math.min(1.5, 0.75 + 0.25 * pw)); }   /* r3.186.0：長槍刺擊改用「刺穿」表現（背後噴出錐形碎光） */
    else use(pn, () => { burst(e.x, e.y, z, pw, kind === 'pierce' ? (H.face > 0 ? 0 : Math.PI) : (H.face > 0 ? -0.4 : Math.PI + 0.4)); if (pn === 'lance' && kind === 'pierce') { const f = H.face; motes(e.x + f * 0.25 * K(e.y), e.y, z, norm ? 3 : 6, { ang: f > 0 ? 0 : Math.PI, spread: 0.35, sp: 1.8, life: 18 }); }   // 貫穿：碎光從敵人背後噴出
    if (pn === 'holy' && !norm) { glint(e.x, e.y, z, 0.42, 12); leaves(e.x, e.y, z, 3, { sp: 0.6, life: 40 }); }   /* r3.194.0：普攻命中不再加十字星與金羽 */   // 神聖：命中處十字星光＋金羽
    if (pn === 'gale') { leaves(e.x, e.y, z, norm ? 2 : 4, { sp: 0.8, life: 34 }); if (lv === 'heavy' || lv === 'hiden') puff(e.x, e.y, 0.5, 24); } if (nod) { embers(e.x, e.y, z * 0.6, norm ? 3 : 6); if (lv === 'heavy' || lv === 'hiden' || kind === 'blunt') { rocks(e.x, e.y, norm ? 3 : 6, 1.2); puff(e.x, e.y, 0.6, 24); } } }); };
  /* ---------- 轉接：打刀／野太刀出招時，舊元件（刀幕、突刺、衝擊環、斬痕、火花、裂地素材…）一律改畫成本模組的元件 ---------- */
  const heroFx = o => !!H.act && (o.x === undefined || Math.abs(o.x - H.x) < 9 * HH());
  function wrapVX(name, conv) { const f0 = VX[name]; if (!f0) return; VX[name] = function (o) { const pn = WP(); if (pn && o && typeof o === 'object' && heroFx(o)) { try { const r = use(pn, () => conv(o, pn)); if (r !== false) return r; } catch (x) { console.warn('kf conv', name, x); } } return f0.apply(this, arguments); }; }
  const Z = (o, d) => o.z !== undefined ? o.z / K(o.y) : d;
  wrapVX('ribbon', (o, pn) => { if (!(o.life > 0)) return {}; const nod = pn === 'ember', norm = isNorm();
    smear({ x: o.x, y: o.y, cy: o.cy === undefined ? 0.55 : o.cy, f: o.face || 1, r: o.r || 1.2, sq: o.sq === undefined ? 0.5 : o.sq, rot: o.rot || 0, a0: o.a0 === undefined ? -2.2 : o.a0, a1: o.a1 === undefined ? 0.9 : o.a1, w: (o.w || 0.32) * (nod ? 1.35 : 1.1), dur: nod ? Math.max(2, Math.round((o.sw || 5) * 0.6)) : Math.max(3, Math.round((o.sw || 5) * 0.9)), life: (o.life || 16) + (nod ? 12 : 3), trail: o.trail, tier: norm ? 0 : 1, motes: norm ? 3 : undefined });
    if (nod && !norm) embers(o.x + (o.face || 1) * (o.r || 1.2) * 0.6 * K(o.y), o.y, 0.4, 4); return {}; });
  /* 薙刀：刀光更厚、更慢（沉重）、殘留久；沿刀弧在地面推開風壓塵霧＋葉片 */
  const rib0 = VX.ribbon; VX.ribbon = function (o) { if (WP() === 'gale' && o && heroFx(o) && o.life > 0) { try { use('gale', () => { const norm = isNorm(), y = o.y, k = K(y), f = o.face || 1, a0 = o.a0 === undefined ? -2.4 : o.a0, a1 = o.a1 === undefined ? 1.1 : o.a1;
        smear({ x: o.x, y, cy: o.cy === undefined ? 0.55 : o.cy, f, r: o.r || 1.5, sq: o.sq === undefined ? 0.42 : o.sq, rot: o.rot || 0, a0, a1, w: (o.w || 0.34) * 1.35, dur: Math.max(4, Math.round((o.sw || 6) * 0.9)), life: (o.life || 16) + 14, trail: Math.max(o.trail || 2.6, 3), tier: norm ? 0 : 1, motes: 0 });
        sweepDust(o.x, y, f, (o.r || 1.5) * 0.95, a0, a1, norm ? 4 : 7, norm ? 0.6 : 1); leaves(o.x + f * (o.r || 1.5) * 0.5 * k, y, 0.5, norm ? 3 : 6, { sp: 1.2, life: 40, rx: 0.5 }); }); return {}; } catch (x) { console.warn('kf gale', x); } } return rib0.apply(this, arguments); };
  wrapVX('thrust', (o, pn) => { if (pn === 'lance' && G.KF.spear) { G.KF.spear(o); return {}; } if (pn === 'lance') { const norm = isNorm(); stab({ x: o.x, y: o.y, f: o.face || 1, len: o.len || 1.8, w: Math.max(0.17, (o.w || 0.2) * 1.25), cy: o.cy || 0.55, dur: Math.max(2, o.ext || 2), life: (o.life || 12) + 6, ang: o.ang, tip: 1, echo: norm ? 1 : 2 }); return {}; } stab({ x: o.x, y: o.y, f: o.face || 1, len: o.len || 1.6, w: Math.max(0.08, (o.w || 0.12) * 0.8), cy: o.cy || 0.5, dur: Math.max(2, o.ext || 3), life: o.life || 12, ang: o.ang }); return {}; });
  wrapVX('ring', (o, pn) => { if (pn === 'ember') puff(o.x, o.y, Math.min(2, (o.r1 || 1.4) * 0.6)); else light(o.x, o.y, o.r1 || 1.2, 16, 0.4); return {}; });
  wrapVX('cut', o => { qi({ x: o.x, y: o.y, z: o.z === undefined ? 0.55 : o.z, ang: o.ang || 0, len: (o.len || 0.7) * 1.15, w: Math.max(0.06, (o.w || 0.07) * 1.1), dur: 2, life: o.life || 12, motes: 2 }); return {}; });
  wrapVX('spark', (o, pn) => { const opt = { sp: (o.spd || 5) / 5, life: o.life || 18 }; if (o.ang !== undefined) { opt.ang = o.ang; opt.spread = o.spread || 0.9; } motes(o.x, o.y, Z(o, 0.5), Math.min(10, o.n || 6), opt); if (pn === 'ember') embers(o.x, o.y, Z(o, 0.5), 2); });
  wrapVX('glow', o => { glint(o.x, o.y, o.z === undefined ? 0.55 : o.z, Math.min(0.6, (o.r || 0.4) * 0.8), o.life || 8); });
  wrapVX('shard', (o, pn) => { if (pn === 'ember') rocks(o.x, o.y, Math.min(8, o.n || 6), 1); else motes(o.x, o.y, o.z || 0.55, o.n || 6, { sp: 1 }); });
  wrapVX('crack', (o, pn) => { if (pn !== 'ember') return false; crack(o.x, o.y, o.r || 1.2, o.life || 50); return {}; });
  wrapVX('debris2', (o, pn) => { rocks(o.x, o.y, Math.min(10, o.n || 6), o.spd || 1); });
  wrapVX('bolt', o => { bolt(o.x0, o.y0, o.x1, o.y1, o.life || 14, o.w || 3, o.br || 1); return {}; });
  wrapVX('beam', o => { light(o.x, o.y, 0.9, o.life || 16, 0.55, 1.2); embers(o.x, o.y, 0.3, 10, { up: 2.4, sp: 0.2, life: 30, rx: 0.15 }); return {}; });
  wrapVX('glyph', o => { light(o.x, o.y, o.r || 1, o.life || 40, 0.35); return {}; });
  wrapVX('streak', (o, pn) => { if (pn === 'lance') motes(o.x, o.y, o.cy || 0.55, Math.min(8, o.n || 5), { ang: o.ang !== undefined ? -o.ang : ((o.face || 1) > 0 ? Math.PI : 0), spread: 0.25, sp: 1.6, life: 14, rx: 0.3 }); return {}; });
  wrapVX('wind', (o, pn) => { if (pn !== 'gale') return false; leaves(o.x, o.y, (o.cy || 0.45), Math.min(8, (o.n || 4) + 2), { sp: 1.3, life: 36, rx: (o.r || 1.2) * 0.6, rz: 0.3 }); sweepDust(o.x, o.y, o.face || 1, (o.r || 1.2) * 0.9, -Math.PI, Math.PI, 6, 0.6); return {}; });
  wrapVX('smoke', (o, pn) => { if (pn !== 'gale' && pn !== 'ember') return false; puff(o.x, o.y, Math.min(1.5, (o.r || 0.2) * 4), 30); return {}; });
  (function f2() { if (!VX.s2) return setTimeout(f2, 50); const s0 = VX.s2; VX.s2 = function (n, o) { const pn = WP(); if (pn && o && heroFx(o) && typeof n === 'string') { try { const r = use(pn, () => {
        if (/^fx_crack/.test(n)) { crack(o.x, o.y, (o.k || 0.9) * 1.15, o.life || 40, /glow/.test(n)); return null; }
        if (n === 'fx_dust') { puff(o.x, o.y, Math.min(2, (o.k || 0.5) * 1.4)); return null; }
        if (n === 'fx_pillar') { light(o.x, o.y, 0.9, o.life || 16, 0.55, 1.2); embers(o.x, o.y, 0.3, 10, { up: 2.4, sp: 0.2, life: 30 }); return null; }
        if (/^fx_sigil/.test(n)) { light(o.x, o.y, (o.k || 0.5) * 1.6, o.life || 20, 0.4); return null; }
        if (n === 'fx_blast' && pn === 'holy') { burst(o.x, o.y, 0.3, 1 + (o.k || 0.5) * 2); light(o.x, o.y, (o.k || 0.5) * 2, 18, 0.5); return null; }
        return false; }); if (r !== false) return r; } catch (x) { console.warn('kf s2', x); } } return s0.apply(this, arguments); }; })();
  (function f3() { if (!VX.spr) return setTimeout(f3, 50); const sp0 = VX.spr; VX.spr = function (o) { const pn = WP(); if (pn === 'lance' && o && heroFx(o)) { try { const k = K(o.y);
        if (o.n === 'fx_tier_yari_master' && G.KF.spear) { G.KF.spear({ x: o.x - (o.flip ? -1 : 1) * 1.6 * k, y: o.y, face: o.flip ? -1 : 1, len: 2.3, big: 1.2, needle: 1.2, shock: 1 }); return null; }
        if (o.n === 'fx_tier_yari_master') { use(pn, () => stab({ x: o.x - (o.flip ? -1 : 1) * 1.6 * k, y: o.y, f: o.flip ? -1 : 1, len: 2.4, w: 0.2, cy: 0.55, dur: 3, life: 16, tip: 1, echo: 2 })); return null; }
        if (o.n === 'heavy_quake') { use(pn, () => { puff(o.x, o.y, 1.4); light(o.x, o.y, 1.4, 20, 0.5); }); return null; } } catch (x) { console.warn('kf spr', x); } } return sp0.apply(this, arguments); }; })();
  const fl0 = VX.flash; VX.flash = function (n) { if (WP() && H.act && !(H.act.mvx && H.act.mvx.hiden)) return; return fl0.apply(this, arguments); };   // 全螢幕白閃只留給秘傳
  G.KF = { scar, X3, tick: v => { clk += v; }, BL, T, PAL, use, crack, rocks, embers, leaves, sweepDust, WP, spr, add, now, smear, qi, stab, burst, light, motes, puff, mist, charge, aura, frost, bolt, glint, moonShape, eo3, eo5, K };
})();
