/* ==========================================================================
 * 神諭之地 重製版 — 116_yari_fx.js
 * Version : r3.227.0  (2026-11-28)　r3.227.0：普攻突刺、槍擺改走 168_wfx
 * 舊版    : r3.190.0  (2026-11-28)　r3.190.0：KF.pierce 可指定顏色（給和弓用）
 * 舊版    : r3.188.0  (2026-11-28)　r3.188.0：針山兩排時後排錯開半格、略小
 * 舊版    : r3.187.0  (2026-11-28)　r3.187.0：槍頭瘦小、黑邊變細、移動痕跡（光的拖痕、速度線、槍擺弧光）加大；飛行槍頭與巨槍換成同一套鋼色；不再參考角色動作圖
 * 舊版    : r3.186.0  (2026-11-28)　r3.186.0：突刺重做成「從手上的槍延伸出去的光槍」（鋼色、深色收邊、氣環、速度線、停頓再收）＋命中刺穿碎光；槍擺弧光同步改鋼色
 * 舊版    : r3.185.0  (2026-11-28)　r3.185.0：五招秘傳加演出層（暗場、運鏡、速度線、貫穿畫面的巨槍、地面十字、衝天光柱、透體槍尖）；所有槍氣加深色襯底，白天地面也看得清楚
 * 舊版    : r3.80.0  (2026-11-25)
 * 變更    : r3.80.0 長槍全部招式／技／特技／奧義／秘傳改用槍頭槍氣＋槍擺（重新命名）：身法 12 式、技 4、特技 4、奧義天沼矛、秘傳 5（蜻蛉切／日本號／御手杵／十文字／人間無骨）。
 *                   新元件：flyQi 飛行槍氣（可帶槍柄）、heldQi 衝刺跟手槍氣、riseTip 地面竄出槍頭、wings 蜻蛉翅、cross 十字、guardFan 槍陣、pullQi 拉回；swing 加 sq（水平迴旋）且殘光只留一段（不畫整圈橢圓）。
 *           r3.79.3 普攻改：短刺／長刺／上挑（槍擺由下往上）／三連刺（三道槍頭槍氣快速連出）；槍頭槍氣加流線（刃肩往後流出的細氣）。
 *           r3.79.1 突刺改「槍頭槍氣」：素槍菱刃（直線刃、寬長約 1:6、深金細邊）＋漸細氣尾，從手前射到中距離、停住後碎成小菱光；不再畫整根槍。
 *           r3.79.2 槍花改「槍擺」：槍以手為支點上下兩擺，槍尖在 1.75 身高畫窄刀光（厚 0.2），弧頭是沿槍身方向的槍頭槍氣（不再前方轉圈）。
 *           r3.79.0 新增。長槍「槍影」元件與普攻重做（白金槍氣）。
 *           槍影 KF.spear：葉形槍頭（中稜＋亮暗兩面＋墨線輪廓）、金色口金、往後漸淡的槍身；
 *             時序＝回拉預備 → 瞬間刺出（略超出再停住）→ 2～3 個分離殘槍往槍尖收攏 → 槍尖射出針狀槍氣（尾端追上前端消失）→ 收槍淡出。
 *           槍擺 KF.swing：槍以手為支點擺動，槍尖在攻擊距離上畫窄刀光（111 smear），弧頭為槍頭槍氣。
 *           破空碎弧 KF.shock：槍尖前兩片斷開的月牙碎片往前推開（不畫整圈）。
 *           普攻：一點（單刺）／二連（上下錯位兩刺）／槍花（轉兩圈＋收尾一刺）／穿（衝刺長刺＋破空碎弧＋起步揚塵）。
 * 依賴    : 111_katana_fx（G.KF：add／spr／PAL／K／smear／motes／puff／light）、77_moves（c.thrust 會把參數轉給 VX.thrust）、85_normal（MV2.N）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H; if (!MV2 || !VX) return;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, ei2 = t => t * t, eo3 = t => 1 - Math.pow(1 - t, 3), eo5 = t => 1 - Math.pow(1 - t, 5), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  const KF = () => G.KF, P = () => G.KF.PAL.lance, rgba = (c, a) => 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')';
  const WOOD = '74,56,34', WOODL = '150,120,80', BRASS = '178,138,60', BRASSL = '236,206,130', INK = '52,40,22';
  /* ---------- 畫一把槍（本地座標：原點＝手，+x＝槍尖方向） ---------- */
  function drawSpear(ctx, tx, al, HL, HW, SL) { HL *= 0.8; const C = P(), b = tx - HL, sb = b - HL * 0.1;
    /* 槍身：深色木柄＋上緣受光，往後漸淡 */
    const g = ctx.createLinearGradient(sb - SL, 0, sb, 0); g.addColorStop(0, rgba(WOOD, 0)); g.addColorStop(0.45, rgba(WOOD, 0.75 * al)); g.addColorStop(1, rgba(WOOD, 0.95 * al));
    const sw = HW * 0.36; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sb - SL, -sw * 0.8); ctx.lineTo(sb, -sw); ctx.lineTo(sb, sw); ctx.lineTo(sb - SL, sw * 0.8); ctx.closePath(); ctx.fill();
    const g2 = ctx.createLinearGradient(sb - SL * 0.7, 0, sb, 0); g2.addColorStop(0, rgba(WOODL, 0)); g2.addColorStop(1, rgba(WOODL, 0.8 * al)); ctx.fillStyle = g2; ctx.fillRect(sb - SL * 0.7, -sw, SL * 0.7, sw * 0.55);
    /* 口金（金屬接環） */
    ctx.fillStyle = rgba(BRASS, al); ctx.fillRect(sb, -sw * 1.35, HL * 0.16, sw * 2.7); ctx.fillStyle = rgba(BRASSL, al); ctx.fillRect(sb, -sw * 1.35, HL * 0.16, sw * 0.9); }
  /* 針狀槍氣：前端瞬間射出，尾端隨後追上而消失（不留一條死線） */
  function needle(ctx, x0, x1, w, al) { const C = P(), L = x1 - x0; if (L < 2 || al <= 0) return; ctx.globalCompositeOperation = 'screen'; for (const t of [0.25, 0.6, 0.95]) KF().spr(ctx, C.T.gd, x0 + L * t, 0, Math.min(L, w * 14), w * 5, 0.4 * al);
    ctx.globalCompositeOperation = 'source-over'; const lens = (ww, col, a) => { ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(x0 + L * 0.22, -ww, x1, 0); ctx.quadraticCurveTo(x0 + L * 0.22, ww, x0, 0); ctx.closePath(); ctx.fill(); };
    lens(w * 1.6, '44,32,14', 0.45 * al); lens(w, C.deep, 0.7 * al); lens(w * 0.62, C.mid, 0.95 * al); lens(w * 0.22, C.lite, al); }
  function star(ctx, x, s, al, rot) { const C = P(); ctx.save(); ctx.translate(x, 0); ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gl, 0, 0, s * 2.2, s * 2.2, 0.7 * al); ctx.globalCompositeOperation = 'source-over'; ctx.rotate(rot || 0); ctx.fillStyle = rgba(C.lite, al);
    for (const [L, W] of [[s, s * 0.1], [s * 0.55, s * 0.08]]) { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -W, L, 0); ctx.quadraticCurveTo(0, W, -L, 0); ctx.fill(); ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -W, L, 0); ctx.quadraticCurveTo(0, W, -L, 0); ctx.fill(); ctx.rotate(-Math.PI / 2); ctx.rotate(Math.PI / 4); } ctx.restore(); }
  /* ---------- 槍頭槍氣（素槍菱刃：直線刃、刃根內收、尖端銳利；後拖漸細氣尾；深金細邊壓輪廓） ---------- */
  function tipQi(ctx, tx, al, HL, HW, TL) { if (al <= 0.01) return; const W0 = HW; HL *= 0.8; HW *= 0.58; const b = tx - HL;
    if (TL > 2) { spTrail(ctx, b - TL, b + HL * 0.1, W0 * 1.15, al, tx + HL * 0.2);   /* 氣尾 */
      const fl = Math.min(1, TL / HL); ctx.lineCap = 'round'; for (const [oy, l, wd] of [[-2.1, 0.95, 1], [1.8, 0.75, 0.9], [-3.6, 0.5, 0.6], [3.4, 0.4, 0.6]]) { const x1 = b + HL * 0.2, xa = x1 - TL * l; ctx.strokeStyle = rgba(DKI, 0.28 * fl * al); ctx.lineWidth = Math.max(1.2, W0 * 0.42 * wd); ctx.beginPath(); ctx.moveTo(xa, W0 * oy); ctx.lineTo(x1, W0 * oy * 0.8); ctx.stroke(); ctx.strokeStyle = rgba(WHT, 0.85 * fl * al); ctx.lineWidth = Math.max(0.8, W0 * 0.2 * wd); ctx.beginPath(); ctx.moveTo(xa, W0 * oy); ctx.lineTo(x1, W0 * oy * 0.8); ctx.stroke(); } }
    spHead(ctx, tx, al, HL, HW); }
  /* 碎刃：槍氣停住後碎成幾片小菱光往前飄散 */
  function shatter(x, y, z, f, ang, HL, HW, n, d) { const C = P(), S = []; for (let i = 0; i < n; i++) S.push({ x: -HL * (0.2 + 0.7 * i / n), dy: rnd(-1, 1) * HW * 2.5, v: rnd(0.6, 1.2), r: rnd(-0.6, 0.6), s: rnd(0.12, 0.22) });
    KF().add(16 + d, 'o', (ctx, u) => { const t = u - d; if (t < 0) return; const q = cl(t / 14, 0, 1), a = 1 - ei2(q); ctx.translate(x, y - z); ctx.scale(f, 1); ctx.rotate(ang);
      for (const p of S) { const px = p.x + p.v * HL * 0.9 * eo3(q), py = p.dy * (1 + q), L = HL * p.s * (1 - q * 0.5), W = L * 0.28; ctx.save(); ctx.translate(px, py); ctx.rotate(p.r * q); ctx.fillStyle = rgba(q < 0.4 ? C.lite : C.mid, a); ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(0, -W); ctx.lineTo(-L * 0.6, 0); ctx.lineTo(0, W); ctx.closePath(); ctx.fill(); ctx.restore(); } }); }
  /* ---------- 突刺槍氣：o = x,y（腳底）face/f len（槍尖離手，身高倍）cy ang ext/dur hold life big shock shaft ---------- */
  /* ====================== r3.186.0 突刺重做：光槍從手上的槍一路延伸（不再是飛出去的槍頭） ======================
   * 造型：直槍——細長槍身（從手往槍尖漸粗的光）＋細長直刃槍頭（上亮下暗、中稜、深色收邊）＋金色口金。
   * 節奏：2 格刺到底 → 停住微顫 → 慢慢收回。破空：槍身上幾圈被擠開的氣環＋兩側速度線。
   * 命中：槍身穿過妖怪，背後噴出錐形碎光與碎片（刺穿感），重刺另外頓一下。 */
  const DKI = '22,26,58', STL = '168,196,236', STD = '96,120,176', WHT = '255,255,255';
  /* r3.187.0：槍頭瘦小、黑邊變細；槍身的光與移動痕跡加大 */
  function spHead(ctx, tx, al, HL, HW) { const b = tx - HL, C = P();
    const head = (s, e) => { ctx.beginPath(); ctx.moveTo(tx + e, 0); ctx.lineTo(b + HL * 0.3, -HW * s); ctx.lineTo(b - e, -HW * s * 0.45); ctx.lineTo(b - e, HW * s * 0.45); ctx.lineTo(b + HL * 0.3, HW * s); ctx.closePath(); };
    ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, tx - HL * 0.4, 0, HL * 2.2, HW * 9, 0.5 * al); ctx.globalCompositeOperation = 'source-over';
    head(1.22, HL * 0.03); ctx.fillStyle = rgba(DKI, 0.55 * al); ctx.fill();
    ctx.fillStyle = rgba(BRASS, al); ctx.fillRect(b - HL * 0.1, -HW * 0.62, HL * 0.1, HW * 1.24); ctx.fillStyle = rgba(BRASSL, al); ctx.fillRect(b - HL * 0.1, -HW * 0.62, HL * 0.1, HW * 0.45);
    ctx.save(); head(1, 0); ctx.clip(); ctx.fillStyle = rgba(WHT, al); ctx.fillRect(b - 2, -HW * 1.2, HL + 4, HW * 1.2); ctx.fillStyle = rgba(STD, al); ctx.fillRect(b - 2, 0, HL + 4, HW * 1.2); ctx.fillStyle = rgba(STL, al); ctx.fillRect(b - 2, 0, HL + 4, HW * 0.3); ctx.restore();
    ctx.strokeStyle = rgba(DKI, 0.6 * al); ctx.lineWidth = Math.max(0.6, HW * 0.07); head(1, 0); ctx.stroke(); }
  /* 光的拖痕：從 x0 往 x1 漸寬漸實的楔形（深色襯底＋鋼色＋白芯） */
  function spTrail(ctx, x0, x1, w, al, xt) { if (x1 - x0 < 2 || al <= 0.01) return; const wedge = ww => { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.55, -ww * 0.75, x1, -ww); if (xt !== undefined) ctx.lineTo(xt, 0); ctx.lineTo(x1, ww); ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.55, ww * 0.75, x0, 0); ctx.closePath(); };   /* xt：前端收成尖（包住槍頭的光錐） */
    const gr = (col, a) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.55, rgba(col, 0.6 * a * al)); g.addColorStop(1, rgba(col, a * al)); return g; };
    wedge(w * 1.35); ctx.fillStyle = gr(DKI, 0.4); ctx.fill(); wedge(w); ctx.fillStyle = gr(STL, 0.9); ctx.fill(); wedge(w * 0.36); ctx.fillStyle = gr(WHT, 1); ctx.fill(); }
  function lance(ctx, tx, al, HL, HW, x0, tw) { if (al <= 0.01 || tx - x0 < 2) return; spTrail(ctx, x0, tx - HL * 0.9, HW * (tw || 1.5), al, tx + HL * 0.22); spHead(ctx, tx, al, HL, HW); }
  /* 刺穿：背後噴出的錐形碎光＋碎片，正面一圈被擠開的氣 */
  function pierce(x, y, f, ang, big, col) { const DKI = col ? col[0] : '22,26,58', STL = col ? col[1] : '168,196,236', WHT = col ? col[2] : '255,255,255', k = KF().K(y), N = 8, S2 = []; for (let i = 0; i < N; i++) S2.push([rnd(-0.38, 0.38), rnd(0.5, 1.25), rnd(0.6, 1.1)]);
    KF().add(10, 'o', (ctx, u) => { const q = cl(u / 10, 0, 1), e = eo5(q), al = 1 - ei2(q); ctx.translate(x, y); ctx.scale(f, 1); ctx.rotate(ang);
      if (u < 5) { const L = (0.45 + 0.75 * e) * k * big, w = 0.22 * k * big, a = 1 - u / 5; const gr = ctx.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, rgba(WHT, 0.95 * a)); gr.addColorStop(0.45, rgba(STL, 0.65 * a)); gr.addColorStop(1, rgba(STL, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-0.06 * k, 0); ctx.lineTo(L, -w); ctx.lineTo(L, w); ctx.closePath(); ctx.fill(); }
      for (const p of S2) { const d = p[1] * k * big * e, L = 0.2 * k * big * p[2] * (1 - q * 0.6), w = Math.max(0.8, L * 0.1); ctx.save(); ctx.rotate(p[0]); ctx.translate(d, 0);   /* 細長碎光：沿噴出方向 */
        ctx.fillStyle = rgba(DKI, 0.6 * al); ctx.beginPath(); ctx.moveTo(L * 1.15, 0); ctx.lineTo(0, -w * 1.9); ctx.lineTo(-L * 0.5, 0); ctx.lineTo(0, w * 1.9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = rgba(WHT, al); ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(0, -w); ctx.lineTo(-L * 0.4, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
    });
    KF().use(col ? 'holy' : 'lance', () => KF().motes(x, y + 0.02 * k, 0, 4, { ang: f > 0 ? 0 : Math.PI, spread: 0.5, sp: 2.2, life: 14 })); }
  function spear(o) { if (G.WFX && G.WFX.norm()) return G.WFX.spear(o);   /* r3.227.0：普攻改走 168_wfx */ const f = o.face || o.f || 1, y = o.y, k = KF().K(y), big = o.big || 1, dur = Math.max(2, o.ext || o.dur || 2), quick = (o.life || 10) <= 7, hold = o.hold !== undefined ? o.hold + 1 : 3, rel = quick ? 3 : 6, life = dur + hold + rel;
    const reach = (o.len || 1.8) * k * 0.95, HL = 0.4 * k * big, HW = 0.036 * k * big * (o.wd || 1), cy = o.cy || 0.55, ang = o.ang || 0, x0 = 0.08 * reach, hx = o.x + f * 0.1 * k, heavy = big >= 1.1 || !!o.shock, hy = y - cy * k, SW0 = 0.05 * k * big;
    KF().add(life + 1, 'o', (ctx, u) => { let tx, al = 1, xs = x0;
      if (u < dur) tx = reach * (0.35 + 0.65 * eo5((u + 1) / dur));
      else if (u < dur + hold) tx = reach + HL * 0.06 * Math.sin((u - dur) * 2.6) * (1 - (u - dur) / hold);   /* 停住微顫 */
      else { const r = cl((u - dur - hold) / rel, 0, 1); tx = reach - reach * 0.45 * ei2(r); xs = x0 + (tx - x0) * 0.5 * r; al = 1 - ei2(r); }
      ctx.translate(hx, hy); ctx.scale(f, 1); ctx.rotate(ang);
      /* 破空：兩側速度線＋槍身上的氣環 */
      if (u < dur + 5) { const a = 1 - u / (dur + 5); ctx.lineCap = 'round'; for (const [oy, l0, l1, wd] of [[-2.0, 0.1, 0.86, 1.3], [1.7, 0.22, 0.94, 1.1], [-3.6, 0.38, 0.98, 0.8], [3.3, 0.05, 0.7, 0.9], [-5.2, 0.5, 0.9, 0.6], [5.0, 0.3, 0.82, 0.6]]) { ctx.strokeStyle = rgba(DKI, 0.32 * a); ctx.lineWidth = Math.max(1.5, SW0 * 0.46 * wd); ctx.beginPath(); ctx.moveTo(tx * l0, SW0 * oy); ctx.lineTo(tx * l1, SW0 * oy); ctx.stroke(); ctx.strokeStyle = rgba(WHT, 0.9 * a); ctx.lineWidth = Math.max(1, SW0 * 0.22 * wd); ctx.beginPath(); ctx.moveTo(tx * l0, SW0 * oy); ctx.lineTo(tx * l1, SW0 * oy); ctx.stroke(); } }
      if (u >= dur - 1 && u < dur + 4) { const q = (u - dur + 1) / 5, a = 1 - q; for (let i = 0; i < 2; i++) { const px = reach * (0.5 + i * 0.24) + SW0 * 4 * q, ry = SW0 * (1.9 + i * 0.9) * (1 + 0.9 * eo3(q)) * (heavy ? 1.3 : 1), rx = ry * 0.16; ctx.strokeStyle = rgba(DKI, 0.3 * a); ctx.lineWidth = Math.max(1, SW0 * 0.45 * a); ctx.beginPath(); ctx.ellipse(px, 0, rx * 1.2, ry * 1.04, 0, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = rgba(WHT, 0.75 * a); ctx.lineWidth = Math.max(1, HW * 0.25 * a); ctx.beginPath(); ctx.ellipse(px, 0, rx, ry, 0, -1.2, 1.2); ctx.stroke(); } }
      lance(ctx, tx, al, HL, HW, xs, (u < dur + hold ? 2.6 : 1.8));
      if (u >= dur - 1 && u < dur + 3) star(ctx, tx + HW * 0.4, HW * 3.4, 1 - cl((u - dur + 1) / 4, 0, 1), 0.3); });
    if (o.shock) shock(o.x + f * ((o.len || 1.8) * 0.95 + 0.1) * k, y, cy, f, ang, big, dur); }
  /* ---------- 破空碎弧：槍尖前兩片斷開的月牙碎片往前推開 ---------- */
  function shock(x, y, cy, f, ang, big, d) { const k = KF().K(y), C = P(); KF().add(14 + d, 'o', (ctx, u) => { const t = u - d; if (t < 0) return; const q = cl(t / 12, 0, 1), R = (0.14 + 0.4 * eo3(q)) * k * big, al = 1 - ei2(q), th = 0.06 * k * big * (1 - q * 0.7);
      ctx.translate(x - f * R * 0.6, y - cy * k); ctx.scale(f, 1); ctx.rotate(ang);
      for (const s of [-1, 1]) { const a0 = s * 0.35, a1 = s * 1.25, N = 10, out = [], inn = []; for (let i = 0; i <= N; i++) { const v = i / N, a = a0 + (a1 - a0) * v, w = th * Math.sin(Math.PI * Math.min(1, v * 1.15)); out.push([Math.cos(a) * R, Math.sin(a) * R * 1.25]); inn.push([Math.cos(a) * (R - w), Math.sin(a) * (R - w) * 1.25]); }
        for (const [col, aa] of [[C.mid, 0.85], [C.lite, 0.9]]) { ctx.fillStyle = rgba(col, aa * al); ctx.beginPath(); ctx.moveTo(out[0][0], out[0][1]); for (const p of out) ctx.lineTo(p[0], p[1]); for (let i = N; i >= 0; i--) ctx.lineTo(inn[i][0], inn[i][1]); ctx.closePath(); ctx.fill(); } } }); }
  /* ---------- 槍擺（槍花）：槍以手為支點擺動，槍尖在攻擊距離上畫出窄刀光；弧頭是沿槍身方向的槍頭槍氣 ---------- */
  /* o = x,y,f,cy, R（槍尖離手，身高倍）a0→a1（徑度，0＝正前、正值往下）dur w */
  function swing(o) { if (G.WFX && G.WFX.norm()) return G.WFX.swing(o); const f = o.f, y = o.y, k = KF().K(y), cy = o.cy || 0.55, dur = o.dur || 4, R = o.R || 1.7, a0 = o.a0, a1 = o.a1, sq = o.sq || 1, hx = o.x + f * 0.1 * k, big = o.big || 1, HL = 0.4 * k * big, HW = 0.036 * k * big, life = dur + 9;
    const span = Math.min(Math.abs(a1 - a0), o.trail || 2.4), sg = a1 > a0 ? 1 : -1, W0 = (o.w || 0.2) * k * 0.95 * big;
    /* r3.186.0：槍擺——槍身以手為支點掃過去，槍尖拖出一道外緣銳利、往尾端漸細的鋼色弧光（深色襯底，白天也清楚） */
    KF().add(life, 'o', (ctx, u) => { const a = a0 + (a1 - a0) * eo3(cl(u / dur, 0, 1)), al = u <= dur ? 1 : 1 - ei2((u - dur) / 7); if (al <= 0.01) return; ctx.translate(hx, y - cy * k); ctx.scale(f, 1);
      const sp = Math.min(span, Math.abs(a - a0)) * (u <= dur ? 1 : 1 - (u - dur) / 9), N = 16; if (sp > 0.05) { const rib = (w, col, aa, off) => { ctx.beginPath(); for (let i = 0; i <= N; i++) { const v = i / N, an = a - sg * sp * (1 - v), r = R * k + off; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r * sq); } for (let i = N; i >= 0; i--) { const v = i / N, an = a - sg * sp * (1 - v), r = R * k + off - w * v * v; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r * sq); } ctx.closePath(); ctx.fillStyle = rgba(col, aa * al); ctx.fill(); };
        rib(W0 * 1.25, DKI, 0.35, W0 * 0.1); rib(W0, STL, 0.85, 0); rib(W0 * 0.34, WHT, 1, 0); }
      if (u <= dur + 2) { const px = Math.cos(a) * R * k, py = Math.sin(a) * R * k * sq, d = Math.hypot(px, py); ctx.rotate(Math.atan2(py, px)); lance(ctx, d + HL * 0.1, u <= dur ? 1 : 1 - (u - dur) / 3, HL, HW, d * 0.12); } });
    KF().use('lance', () => KF().motes(hx + f * Math.cos(a1) * R * k, y, cy, 3, { sp: 1.4, life: 14 })); }
  /* ---------- 以下 r3.80.0：全部招式用的槍氣元件 ---------- */
  /* 飛行槍氣：槍頭從 (x,y 腳底, z 高度身高倍) 沿 ang 飛 dist（身高倍）；step(px,py) 每格給位置（判定用） */
  function flyQi(o) { const k = KF().K(o.y), f = o.f, big = o.big || 1, HL = 0.62 * k * big, HW = 0.068 * k * big, dur = o.dur || 8, life = dur + (o.hold || 3) + 6, D = o.dist * k, ca = Math.cos(o.ang || 0), sa = Math.sin(o.ang || 0), x0 = o.x, y0 = o.y - (o.z || 0.55) * k;
    KF().add(life, 'o', (ctx, u) => { const q = cl(u / dur, 0, 1), e = o.ease === 'in' ? q * q : eo3(q), d = D * e, al = u <= dur + (o.hold || 3) ? 1 : 1 - (u - dur - (o.hold || 3)) / 6, TL = Math.min(D * 0.55, d * 0.8) * (u <= dur ? 1 : al);
      ctx.translate(x0, y0); ctx.scale(f, 1); ctx.rotate(o.ang || 0); if (o.shaft && al > 0.05) drawSpear(ctx, d + HL * 0.1, al * 0.9, HL, HW, HL * 3.2); tipQi(ctx, d + HL * 0.1, al, HL, HW, TL); },
      o.step ? (vo, tt) => { if (tt > dur + 1) return; const d = D * (o.ease === 'in' ? Math.pow(cl(tt / dur, 0, 1), 2) : eo3(cl(tt / dur, 0, 1))); o.step(x0 + f * ca * d, o.y + sa * d, tt); } : undefined);
    if (o.end !== false) c_end(x0 + f * ca * D, o.y + sa * D, o.z || 0.55, f, o.ang || 0, HL, HW, dur, o.shock); }
  function c_end(x, y, z, f, ang, HL, HW, d, sh) { const k = KF().K(y); shatter(x, y - z * k, 0, f, ang, HL, HW, sh ? 7 : 4, d); if (sh) shock(x, y, z, f, ang, HL / (0.62 * k), d); }
  /* 跟手槍氣：衝刺時槍頭一直在主角前方，氣尾＝衝過的距離 */
  function heldQi(a0, life, o) { const k0 = KF().K(H.y), x0 = H.x, big = o.big || 1;
    KF().add(life, 'o', (ctx, u) => { if (H.act !== a0 && u > 2) return; const k = KF().K(H.y), f = H.face, HL = 0.62 * k * big, HW = 0.068 * k * big, al = Math.min(1, u / 2), trav = Math.abs(H.x - x0);
      ctx.translate(H.x + f * 0.1 * k, H.y - (o.cy || 0.55) * k); ctx.scale(f, 1); tipQi(ctx, (o.len || 1.3) * k, al, HL, HW, Math.min(trav, 3.5 * k) + HL * 0.4); }); }
  /* 地面竄出的槍頭（針山） */
  function riseTip(x, y, d, s) { const k = KF().K(y), HL = 0.75 * k * (s || 1), HW = 0.075 * k * (s || 1);
    KF().add(26 + d, 'o', (ctx, u) => { const t = u - d; if (t < 0) return; const g = eo5(cl(t / 3, 0, 1)), al = t < 14 ? 1 : 1 - (t - 14) / 12; if (al <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - HL, y - HL * 2, HL * 2, HL * 2 + 0.02 * k); ctx.clip(); ctx.translate(x, y + 0.02 * k); ctx.rotate(-Math.PI / 2); tipQi(ctx, HL * 1.05 * g, al, HL, HW, t < 5 ? HL * 0.6 * (1 - t / 5) : 0); ctx.restore(); });
    KF().use('lance', () => { KF().motes(x, y, 0.1, 3, { up: 0.9, sp: 0.6, life: 20, stag: d }); KF().light(x, y, 0.5, 14 + d, 0.35); }); }
  /* 蜻蛉翅：命中點展開四片細長槍氣（兩前兩後）後收 */
  function wings(x, y, z, s, d) { const k = KF().K(y), HL = 0.7 * k * s, HW = 0.06 * k * s;
    KF().add(18 + (d || 0), 'o', (ctx, u) => { const t = u - (d || 0); if (t < 0) return; const g = eo5(cl(t / 3, 0, 1)), al = t < 8 ? 1 : 1 - (t - 8) / 10; if (al <= 0) return;
      for (const a of [-0.45, 0.45, Math.PI - 0.55, Math.PI + 0.55]) { ctx.save(); ctx.translate(x, y - z * k); ctx.rotate(a); tipQi(ctx, HL * g, al * (Math.abs(a) < 1 ? 1 : 0.75), HL, HW, 0); ctx.restore(); } }); }
  /* 十字：橫、豎兩道槍氣交叉 */
  function cross(x, y, z, s, d) { const k = KF().K(y), HL = 0.9 * k * s, HW = 0.07 * k * s;
    KF().add(20 + (d || 0), 'o', (ctx, u) => { const t = u - (d || 0); if (t < 0) return; const g = eo5(cl(t / 3, 0, 1)), al = t < 10 ? 1 : 1 - (t - 10) / 10; if (al <= 0) return;
      for (const a of [0, Math.PI, -Math.PI / 2, Math.PI / 2]) { ctx.save(); ctx.translate(x, y - z * k); ctx.rotate(a); tipQi(ctx, HL * 0.55 * g, al, HL * 0.55, HW, 0); ctx.restore(); } });
    KF().use('lance', () => KF().light(x, y, 1.0, 18 + (d || 0), 0.45, z)); }
  /* 槍陣（架）：手前方 n 把槍頭呈扇形朝前，隨主角、隨招式結束消失 */
  function guardFan(a0, life, o) { const n = o.n || 3, spread = o.spread || 0.32;
    KF().add(life, 'o', (ctx, u) => { if (H.act !== a0) return; const k = KF().K(H.y), f = H.face, al = Math.min(1, u / 5), HL = 0.55 * k * (o.big || 1), HW = 0.06 * k * (o.big || 1), br = 1 + 0.04 * Math.sin(u * 0.3);
      for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * spread, R = (o.R || 1.35) * k * br * (i === (n - 1) / 2 ? 1.08 : 1); ctx.save(); ctx.translate(H.x + f * 0.1 * k, H.y - (o.cy || 0.55) * k); ctx.scale(f, 1); ctx.rotate(a); tipQi(ctx, R, al * (0.85 + 0.15 * Math.sin(u * 0.25 + i)), HL, HW, HL * 0.35); ctx.restore(); } }); }
  /* 拉回槍氣：刺出後連同敵人一起往回拖 */
  function pullQi(o) { const k = KF().K(o.y), f = o.f, HL = 0.62 * k, HW = 0.068 * k, reach = o.len * k, hx = o.x + f * 0.1 * k, hy = o.y - 0.55 * k, dur = 2, hold = 3, back = 8;
    KF().add(dur + hold + back + 4, 'o', (ctx, u) => { let tx, TL, al = 1; if (u < dur) { tx = reach * (0.3 + 0.7 * eo5(u / dur)); TL = tx * 0.6; } else if (u < dur + hold) { tx = reach; TL = HL * 0.3; } else { const r = cl((u - dur - hold) / back, 0, 1); tx = reach - (reach - 0.5 * k) * eo3(r); TL = 0; al = 1 - cl((u - dur - hold - back) / 4, 0, 1); }
      ctx.translate(hx, hy); ctx.scale(f, 1); if (u >= dur + hold) { ctx.save(); ctx.scale(-1, 1); ctx.translate(-tx * 2 + HL * 0.2, 0); tipQi(ctx, tx, al * 0.35, HL * 0.8, HW * 0.7, (reach - tx) * 0.8); ctx.restore(); } tipQi(ctx, tx, al, HL, HW, TL); }); }
  KF().spear = spear; KF().pierce = pierce; KF().swing = swing; KF().shock = shock; KF().flyQi = flyQi;
  /* ---------- 普攻 ---------- */
  const at = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? e.at : 8; }, dm = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e && e.damage ? e.damage / 16 : 1; };
  const thr = (c, o) => c.thrust(Object.assign({ len: 1.8, w: 0.2, cy: 0.55, ext: 2, life: 12, hf: 1 }, o));
  const NY = [
    { run(c, t) { const f = at(c); if (t > f - 4 && t < f) c.move(0.05, 0); if (t === f - 1) thr(c, { len: 1.45, m: dm(c), lv: 'mid', ang: 0.02, big: 0.9 }); } },   // 短刺
    { run(c, t) { const f = at(c); if (t > f - 5 && t < f) c.move(0.08, 0); if (t === f - 1) thr(c, { len: 2.3, m: dm(c), lv: 'mid', ang: -0.02, hold: 3, big: 1.1 }); } },   // 長刺
    { run(c, t) { const f = at(c); if (t === f - 3) swing({ x: c.x, y: c.y, f: c.f, cy: 0.5, R: 1.7, a0: 0.75, a1: -0.85, dur: 4, w: 0.22 });   // 上挑：槍尖由下往上擺過攻擊距離
        if (t === f) c.hit({ shape: 'sector', r: 2.0, arc: 1.3, m: dm(c), lv: 'heavy', kind: 'cut', launch: 22 }); } },
    { run(c, t) { const f = at(c); if (t > f - 9 && t < f) c.move(0.05, 0);   // 三連刺：三道槍頭槍氣快速連出，最後一刺最大＋破空碎弧
        [[-8, -0.07, 0.62], [-4, 0.06, 0.48], [0, 0, 0.55]].forEach(([d, ang, cy], i) => { if (t === f + d) { const last = i === 2; thr(c, { len: last ? 2.3 : 1.9, ext: 2, hold: last ? 3 : 1, life: last ? 12 : 7, ang, cy, m: dm(c) * (last ? 0.5 : 0.3), lv: last ? 'heavy' : 'light', kb: last ? 1.2 : 0, big: last ? 1.2 : 0.95, shock: last ? 1 : 0 }); if (last) G.SC.shake = Math.max(G.SC.shake || 0, 3); } }); } }
  ];
  /* ==================== r3.80.0 招式／技／特技／奧義／秘傳 全部重做 ==================== */
  const LV = c => c.a.mvx.lv || 1, mk = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };
  const T = (c, o) => c.thrust(Object.assign({ len: 1.9, w: 0.22, cy: 0.55, ext: 2, life: 10, hf: 1 }, o));
  const SW = (c, o) => swing(Object.assign({ x: c.x, y: c.y, f: c.f, cy: 0.55, R: 1.75, dur: 4 }, o));
  const SH = (c, o) => c.hit(Object.assign({ shape: 'sector', r: 2.0, arc: 1.3, lv: 'mid', kind: 'cut' }, o));
  const dust = (c, d, p) => KF().use('lance', () => KF().puff(c.x - c.f * (d || 0.2) * c.hh, c.y, p || 0.35, 22));
  const charge = (c, x, life) => KF().use('lance', () => KF().charge(x, c.y, 0.55, life, 14));
  const front = (c, L, W) => G.E.filter(e => e.st !== 'dead' && !e.bb && (e.x - c.x) * c.f > -0.2 * c.hh && (e.x - c.x) * c.f < L * c.hh && Math.abs(e.y - c.y) < (W || 0.5) * c.hh);
  function drag(c, es, to, n) { for (const e of es) { if (e.boss) continue; const x1 = c.x + c.f * to * c.hh, y1 = c.y; for (let i = 1; i <= n; i++) c.later(i, () => { if (e.st === 'dead') return; e.x += (x1 - e.x) * 0.35; e.y += (y1 - e.y) * 0.25; }); } }
  /* ---- 身法招式 12 式 ---- */
  const DM2 = {
    long_pierce: { n: '長驅', run(c, t) { if (t <= 9) c.move(0.2, 0); if (t === 2) { dust(c); heldQi(c.a, 10, { len: 1.1 }); } if (t % 3 === 0 && t < 10) c.ghost(10); if (t === 9) T(c, { len: 2.3, m: 1.3, lv: 'mid', hold: 3, big: 1.1 }); } },
    tip_probe: { n: '點星', run(c, t) { if (t === 5) T(c, { len: 1.6, m: 0.6, ang: -0.05, big: 0.85, hold: 1, life: 7 }); if (t === 11) T(c, { len: 1.75, m: 0.7, ang: 0.04, big: 0.9 }); } },
    intercept_thrust: { n: '截擊', run(c, t) { if (t === 3) charge(c, c.x + c.f * 0.8 * c.hh, 8); if (t === 10) T(c, { len: 1.8, m: 1.0, kb: 1.2, lv: 'mid', ang: 0.16, cy: 0.62, shock: 1 }); } },
    double_thrust: { n: '雙穗', run(c, t) { if (t === 6) T(c, { len: 1.9, m: 0.7, ang: -0.08, cy: 0.64, hold: 1, life: 8 }); if (t === 12) T(c, { len: 2.0, m: 0.8, ang: 0.06, cy: 0.47 }); if (t < 14) c.move(0.03, 0); } },
    side_gap: { n: '側突', run(c, t) { if (t <= 9) c.move(0.02, (G.IN.my || 0.6) * 0.08); if (t === 3 || t === 7) c.ghost(10); if (t === 10) T(c, { len: 1.9, m: 1.1, lv: 'mid', big: 1.05 }); } },
    rising_point: { n: '昇穗', run(c, t) { if (t === 6) SW(c, { a0: 0.7, a1: -1.0, R: 1.6, cy: 0.5, w: 0.22 }); if (t === 8) { SH(c, { r: 1.85, m: 1.1, launch: 50, lv: 'mid' }); KF().use('lance', () => KF().motes(c.x + c.f * 1.2 * c.hh, c.y, 1.3, 6, { up: 1, sp: 0.8, life: 22 })); } } },
    ground_sweep: { n: '薙地', run(c, t) { if (t === 5) { SW(c, { a0: -0.4, a1: Math.PI * 1.25, R: 1.55, sq: 0.38, cy: 0.22, w: 0.2, dur: 6 }); KF().use('lance', () => KF().sweepDust(c.x, c.y, c.f, 1.4, -0.4, Math.PI * 1.25, 6, 0.8)); }
        if (t === 8) c.hit({ shape: 'circle', r: 1.65, m: 0.9, lv: 'mid', kind: 'cut', slow: 30 }); } },
    shaft_break: { n: '石突', run(c, t) { if (t === 1) charge(c, c.x + c.f * 0.5 * c.hh, 10); if (t > 4 && t <= 11) { c.move(0.13, 0); if (t % 3 === 0) c.ghost(10); } if (t === 5) dust(c, 0.1, 0.45);
        if (t === 12) { T(c, { len: 1.9, w: 0.32, m: 1.4, def: 20, lv: 'heavy', big: 1.3, hold: 3, shock: 1 }); KF().use('lance', () => KF().rocks(c.x + c.f * 1.6 * c.hh, c.y, 5, 1)); } if (t >= 12 && t < 16) c.move(0.06, 0); } },
    focused_point: { n: '一點突', run(c, t) { if (t === 1) charge(c, c.x + c.f * 1.0 * c.hh, 20);
        if (t === 21) { T(c, { len: 2.7, w: 0.3, m: 2.2, lv: 'heavy', ext: 2, hold: 4, life: 14, big: 1.45, shock: 1, crit: Math.random() < 0.4 }); KF().use('lance', () => KF().light(c.x + c.f * 2.4 * c.hh, c.y, 1.0, 16, 0.45, 0.55)); G.SC.shake = Math.max(G.SC.shake || 0, 4); } } },
    pulling_retreat: { n: '鉤引', run(c, t) { if (t === 6) { const hs = c.hit({ shape: 'line', len: 2.0, w: 0.35, m: 1.0, lv: 'mid', kind: 'pierce' }); pullQi({ x: c.x, y: c.y, f: c.f, len: 1.95 }); drag(c, hs, 0.7, 10); }
        if (t > 8 && t <= 18) c.move(-0.1, 0); if (t === 10) c.ghost(10); } },
    fixed_line: { n: '槍衾', run(c, t) { if (t === 2) guardFan(c.a, 40, { n: 3, spread: 0.3 }); if (t === 30) mk(c); },
      counter(c, e) { mk(c); T(c, { len: 2.1, m: 1.4, lv: 'heavy', kb: 1.5, big: 1.25, shock: 1 }); } },
    shaft_gate: { n: '柄受', run(c, t) { if (t === 2) { guardFan(c.a, 34, { n: 2, spread: 1.4, R: 0.9, big: 0.8 }); KF().use('lance', () => KF().glint(c.x + c.f * 0.4 * c.hh, c.y, 0.6, 0.4, 10)); } if (t === 26) mk(c); },
      counter(c, e) { mk(c); SW(c, { a0: -0.6, a1: Math.PI * 1.6, R: 1.5, sq: 0.42, cy: 0.5, w: 0.22, dur: 6 }); c.hit({ shape: 'circle', r: 1.6, m: 1.3, lv: 'heavy', kind: 'cut', kb: 1.2 }); } }
  };
  /* ---- 技・特技 ---- */
  const DU2 = {
    skill_ryusei: { n: '一番槍', run(c, t) { const lv = LV(c), D = lv >= 3 ? 6 : 4, m = c.a.mvx;   // 突進 4H（Lv3 6H），槍頭一路在前；終點一記重刺（Lv5 槍氣再往前飛）
        if (t === 2) { m.sk = []; dust(c, 0.2, 0.5); heldQi(c.a, 18, { len: 1.25, big: 1.1 }); c.ghost(12); }
        if (t > 3 && t <= 15) { c.move(D / 12, 0); c.inv(4); if (t % 2) c.ghost(8); c.hit({ shape: 'line', len: 1.4, w: 0.45, m: 0.5, lv: 'light', kind: 'pierce', skip: m.sk }).forEach(e => m.sk.push(e)); }
        if (t === 16) { T(c, { len: 2.4, m: 2.0, lv: 'heavy', kb: 1.2, big: 1.4, hold: 4, life: 14, shock: 1 }); G.SC.shake = Math.max(G.SC.shake || 0, 5); }
        if (lv >= 5 && t === 20) { const sk = []; flyQi({ x: c.x + c.f * 1.6 * c.hh, y: c.y, f: c.f, dist: 4, dur: 8, big: 1.2, shock: 1, step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 0.6, m: 1.2, lv: 'heavy', kind: 'pierce', skip: sk }).forEach(e => sk.push(e)) }); } } },
    skill_senso: { n: '槍花繚亂', run(c, t) { const lv = LV(c), n = 6 + (lv >= 3 ? 4 : 0);   // 槍擺三下，接扇形快速連刺；Lv5 最後一刺穿透 4H
        if (t === 2) SW(c, { a0: -0.6, a1: 0.45, dur: 3 }); if (t === 5) SW(c, { a0: 0.5, a1: -0.55, dur: 3 }); if (t === 8) SW(c, { a0: -0.6, a1: 0.5, dur: 3 });
        if (t === 3 || t === 6 || t === 9) SH(c, { m: 0.35, lv: 'light' });
        for (let i = 0; i < n; i++) if (t === 12 + i * 3) { const last = i === n - 1, far = last && lv >= 5; T(c, { len: far ? 3.6 : 1.9, ang: last ? 0 : Math.sin(i * 1.9) * 0.16, cy: last ? 0.55 : 0.55 + Math.cos(i * 1.9) * 0.08, hold: last ? 4 : 0, life: last ? 12 : 6, m: last ? 1.0 : 0.3, lv: last ? 'heavy' : 'light', big: last ? 1.3 : 0.9, shock: last ? 1 : 0 }); }
        c.a.T = 16 + n * 3; } },
    skill_shoryu: { n: '挑月', run(c, t) { const lv = LV(c);   // 由下往上大擺挑飛（弧＝月）；Lv3 追加下斜一刺；Lv5 再追加前刺擊退
        if (t === 4) charge(c, c.x + c.f * 0.6 * c.hh, 6);
        if (t === 6) { SW(c, { a0: 0.95, a1: -1.35, R: 1.85, cy: 0.45, w: 0.28, dur: 5, big: 1.15, tier: 1 }); dust(c, -0.6, 0.6); }
        if (t === 8) { SH(c, { r: 2.1, arc: 1.6, m: 1.8, launch: 60, stun: 50, lv: 'heavy' }); KF().use('lance', () => KF().motes(c.x + c.f * 1.3 * c.hh, c.y, 1.4, 10, { up: 1.2, sp: 1, life: 26 })); }
        if (lv >= 3 && t === 20) T(c, { len: 2.0, ang: -0.5, m: 0.9, lv: 'heavy', big: 1.1 });
        if (lv >= 5 && t === 28) T(c, { len: 2.2, ang: 0.1, m: 1.0, lv: 'heavy', kb: 1.5, big: 1.2, shock: 1 }); } },
    skill_sorin: { n: '針山', run(c, t) { const lv = LV(c), rows = lv >= 3 ? [-0.35, 0.35] : [0]; if (t !== 8) return; const x0 = c.x, y0 = c.y, f = c.f, k = c.hh, sk = [];
        for (const dy of rows) for (let i = 0; i < 8; i++) { const back = rows.length > 1 && dy < 0, x = x0 + f * (0.6 + i * 0.45 + (back ? 0.225 : 0)) * k, y = y0 + dy * k; riseTip(x, y, i * 2 + (back ? 1 : 0), (i === 7 ? 1.35 : 1) * (back ? 0.86 : 1));   /* r3.188.0：後排錯開半格、略小，前後排不再上下相接 */
          c.later(i * 2, () => { c.hit({ shape: 'circle', x, y, r: 0.45, m: 1.2 / rows.length * 0.7, lv: i === 7 ? 'heavy' : 'mid', kind: 'pierce', launch: 30, skip: sk }).forEach(e => sk.push(e)); if (lv >= 5 && i % 3 === 0) { const s2 = []; for (let j = 1; j <= 6; j++) c.later(j * 20, () => c.hit({ shape: 'circle', x, y, r: 0.5, m: 0.15, lv: 'light', kind: 'pierce', skip: s2 })); } }); } } },
    special_backpierce: { n: '回身刺', run(c, t) { const lv = LV(c); if (t <= 8) { c.move(-0.08, 0); if (t % 3 === 0) c.ghost(10); } if (t === 9) { H.face = -H.face; c.a.face0 = H.face; dust(c, -0.2, 0.4); }
        if (t === 12) T(c, { len: 2.1, w: 0.24, m: 1.6 * (lv >= 3 ? 1.3 : 1), lv: 'heavy', crit: lv >= 5, big: 1.2, hold: 3, shock: 1 }); } },
    special_deny: { n: '不動構', run(c, t) { const lv = LV(c); if (t === 1) { c.a.T = lv >= 3 ? 184 : 124; guardFan(c.a, 190, { n: 3, spread: 0.42, R: 1.45, big: 1.15 }); }   // 三把交錯槍頭擋在身前，靠近的敵人被頂回
        for (const e of G.E) { if (e.st === 'dead' || e.bb || e.boss) continue; const dx = (e.x - H.x) * c.f; if (dx > 0 && dx < 1.6 * c.hh && Math.abs(e.y - H.y) < 0.45 * c.hh) { e.x += (H.x + c.f * 1.6 * c.hh - e.x) * 0.35; if (t % 20 === 0) KF().use('lance', () => KF().burst(H.x + c.f * 1.5 * c.hh, e.y, 0.5, 0.8, c.f > 0 ? Math.PI : 0)); } }
        if (t === 30) c.a.mvx.hit = 1; },
      counter(c, e) { mk(c); T(c, { len: 2.1, w: 0.26, m: 1.5 * (LV(c) >= 5 ? 1.5 : 1), lv: 'heavy', kb: 1.5, big: 1.3, shock: 1 }); } },
    special_lane: { n: '一文字', run(c, t) { const lv = LV(c), D = 4 * (lv >= 3 ? 1.5 : 1), m = c.a.mvx;   // 一直線衝刺貫穿，槍頭在前、氣尾拉滿整條路
        if (t === 2) { m.sk = []; dust(c, 0.2, 0.5); heldQi(c.a, 16, { len: 1.15, big: 1.05 }); }
        if (t > 2 && t <= 14) { c.move(D / 12, 0); c.inv(6); if (t % 2 === 0) c.ghost(10); c.hit({ shape: 'circle', r: 0.8, m: 1.2, lv: 'mid', kind: 'pierce', skip: m.sk, slow: lv >= 5 ? 40 : 0 }).forEach(e => m.sk.push(e)); }
        if (t === 15) { KF().use('lance', () => KF().motes(c.x - c.f * D * 0.5 * c.hh, c.y, 0.55, 10, { rx: D * 0.45, sp: 0.3, life: 24 })); c_end(c.x + c.f * 1.2 * c.hh, c.y, 0.55, c.f, 0, 0.62 * c.hh, 0.068 * c.hh, 0, 0); } } },
    special_return: { n: '車返', run(c, t) { const lv = LV(c), r = 1.45 * (lv >= 3 ? 1.25 : 1);   // 收槍迴旋一圈：槍頭在攻擊距離掃一圈（窄刀光），回氣
        if (t === 5) { SW(c, { a0: -0.3, a1: -0.3 + Math.PI * 2.05, R: r, sq: 0.4, cy: 0.5, w: 0.2, dur: 7, trail: 2.3 }); KF().use('lance', () => KF().sweepDust(c.x, c.y, c.f, r * 0.9, 0, Math.PI * 2, 8, 0.6)); }
        if (t === 9) { c.hit({ shape: 'circle', r: r + 0.15, m: 1.2, lv: 'mid', kind: 'cut' }); const d = G.RPG.d(); if (d) d.qi = Math.min(100, (d.qi || 0) + 10); } } }
  };
  /* ---- 奧義：天沼矛 ---- */
  const ord2 = [5, 2, 8, 0, 6, 3, 9, 1, 7, 4];
  DU2.ultimate_ryuga = { n: '天沼矛', run(c, t) { const m = c.a.mvx, k = c.hh, lv = m.lv || 1, N = lv >= 3 ? 10 : 8;   // 身後展開槍陣 → 依序射穿全場 → 巨矛（帶槍柄）橫貫畫面
      if (t === 1) { MV2.intro && MV2.intro(c, '240,225,180', 60); m.sk = []; m.P = []; m.f = c.f; m.O = ord2.filter(i => i < N); const ord = [3, 6, 1, 8, 4, 0, 9, 5, 2, 7]; for (let i = 0; i < N; i++) { const u = i / (N - 1), th = 1.75 + u * 2.6 + rnd(-0.06, 0.06), R = 1.05 + (i % 2) * 0.3 + rnd(-0.05, 0.05), dx = Math.cos(th) * R, z = 0.75 - Math.sin(th) * R * 0.95, j = ord[i % 10] / 9;   // 槍陣：身後一圈光暈狀散開，槍頭全部對準前方 4H 的一點
          m.P.push({ dx, z: Math.max(0.1, z), s: 0.8 + j * 0.45, a: Math.atan2(Math.max(0.1, z) - 0.55, 4.2 - dx) * 0.9, d: ord[i % 10] * 1.1 }); }
        const a0 = c.a, P = m.P, f = c.f, x0 = c.x, y0 = c.y; KF().add(16 + N * 2, 'o', (ctx, u) => { const kk = KF().K(y0); for (let i = 0; i < P.length; i++) { const p = P[i], tt = u - p.d; if (tt < 0 || p.gone) continue; const g = eo5(cl(tt / 4, 0, 1)), HL = 0.62 * kk * p.s, HW = 0.068 * kk * p.s, bob = Math.sin(u * 0.2 + i) * 0.03 * kk;
            ctx.save(); ctx.translate(x0 + f * (p.dx * kk), y0 - p.z * kk + bob); ctx.scale(f, 1); ctx.rotate(p.a); tipQi(ctx, HL * (0.3 + 0.7 * g), g, HL, HW, HL * (0.25 + 0.5 * (1 - g))); ctx.restore(); } }); }
      if (t >= 14 && t < 14 + N * 2 && (t - 14) % 2 === 0) { const i = m.O[(t - 14) / 2], p = m.P[i]; if (p) { p.gone = 1; const kk = c.hh, sx = c.x + m.f * p.dx * kk;
          flyQi({ x: sx, y: c.y, z: p.z, f: m.f, ang: p.a, dist: 8, dur: 5, hold: 1, big: p.s * 1.15, ease: 'in', step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 0.7, m: 0.7, lv: 'mid', kind: 'pierce', skip: m.sk[i] || (m.sk[i] = []) }) }); } }
      if (t === 14 + N * 2 + 4) { charge(c, c.x - c.f * 0.4 * k, 12); dust(c, 0.3, 0.8); }
      if (t === 14 + N * 2 + 14) { const sk = []; flyQi({ x: c.x - c.f * 1.0 * k, y: c.y, z: 0.6, f: c.f, dist: 10, dur: 9, hold: 4, big: 2.4, shaft: 1, shock: 1, step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 1.2, m: lv >= 5 ? 3.0 : 2.4, lv: 'hiden', kind: 'pierce', kb: 2, skip: sk }) });
        G.SC.shake = 8; KF().use('lance', () => KF().light(c.x + c.f * 3 * k, c.y, 3, 24, 0.5, 0.6)); }
      c.a.T = 14 + N * 2 + 34; } };
  /* ---- 秘傳（92 組合動作：第 1 格交給 92 設 _comp，之後用 C.rel 的三段時間） ---- */
  const HY3 = {
    y_hyakusen: { n: '蜻蛉切', f(c, t, C) { const [r1, r2, r3] = C.rel;   // 百連刺 → 最後一刺展開蜻蛉翅
      if (t === r1) T(c, { len: 1.8, m: 0.6, big: 0.95 }); if (t === r2 || t === r2 + 3) T(c, { len: 1.9, ang: t === r2 ? -0.07 : 0.07, m: 0.6, hold: 1, life: 7 });
      if (t > r2 + 5 && t < r3 - 2 && (t - r2) % 2 === 0) T(c, { len: rnd(1.7, 2.2), ang: rnd(-0.16, 0.16), cy: 0.55 + rnd(-0.1, 0.1), m: 0.2, lv: 'light', hold: 0, life: 5, big: 0.85 });
      if (t === r3) { T(c, { len: 2.8, w: 0.3, m: 2.2, lv: 'hiden', kb: 1.2, big: 1.6, hold: 5, life: 16, shock: 1 }); wings(c.x + c.f * 2.4 * c.hh, c.y, 0.55, 1.3, 2); G.SC.shake = Math.max(G.SC.shake || 0, 6); } } },
    y_shoryu: { n: '日本號', f(c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh;   // 挑起 → 空中雙刺 → 地面衝天槍氣
      if (t === r1) { SW(c, { a0: 0.9, a1: -1.3, R: 1.8, cy: 0.45, w: 0.26, dur: 5, big: 1.1 }); SH(c, { r: 2.0, arc: 1.6, m: 0.8, launch: 40 }); }
      if (t === r2 || t === r2 + 4) { T(c, { len: 2.0, ang: t === r2 ? -0.55 : -0.4, m: 0.6, big: 1.05 }); }
      if (t === r3) { const x = c.x + c.f * 1.2 * k, sk = []; T(c, { len: 1.9, ang: -1.0, m: 0.6, big: 1.2 });
        for (let i = 0; i < 5; i++) c.later(i * 2, () => flyQi({ x: x + c.f * (i - 2) * 0.28 * k, y: c.y, z: 0, f: 1, ang: -Math.PI / 2 + (i - 2) * 0.06, dist: 3.2, dur: 6, big: 1.1 + (i === 2 ? 0.5 : 0), end: false }));
        c.later(2, () => c.hit({ shape: 'circle', x, y: c.y, r: 1.2, m: 2.2, lv: 'hiden', kind: 'pierce', launch: 60, skip: sk })); KF().use('lance', () => { KF().puff(x, c.y, 1.0); KF().light(x, c.y, 1.4, 20, 0.5, 1.2); }); G.SC.shake = Math.max(G.SC.shake || 0, 6); } } },
    y_ryusei: { n: '御手杵', f(c, t, C) { const [r1, r2, r3] = C.rel;   // 長驅 → 側刺 → 超長距離巨穿（帶槍柄）
      if (t < r1) { c.move(0.1, 0); if (t % 3 === 0) c.ghost(8); } if (t === r1) T(c, { len: 2.3, m: 0.8, big: 1.1 });
      if (t === r2) T(c, { len: 2.0, m: 0.7, ang: 0.05 }); if (t === r2 + 2) charge(c, c.x + c.f * 0.8 * c.hh, Math.max(6, r3 - r2 - 2));
      if (t === r3) { const sk = []; dust(c, 0.3, 0.9); flyQi({ x: c.x - c.f * 0.4 * c.hh, y: c.y, z: 0.55, f: c.f, dist: 6.5, dur: 6, hold: 5, big: 2.0, shaft: 1, shock: 1, step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 0.9, m: 2.4, lv: 'hiden', kind: 'pierce', kb: 1.2, skip: sk }) }); G.SC.shake = Math.max(G.SC.shake || 0, 8); } } },
    y_kaiten: { n: '十文字', f(c, t, C) { const [r1, r2, r3] = C.rel;   // 薙地一圈 → 十字槍氣定身 → 大迴旋
      const spin = (R, lv, m) => { SW(c, { a0: -0.3, a1: -0.3 + Math.PI * 2.05, R, sq: 0.4, cy: 0.35, w: 0.24, dur: 7, trail: 2.4, big: 1.1 }); KF().use('lance', () => KF().sweepDust(c.x, c.y, c.f, R * 0.9, 0, Math.PI * 2, 8, 0.8)); c.later(3, () => c.hit({ shape: 'circle', r: R + 0.15, m, lv, kind: 'cut', kb: 1.0 })); };
      if (t === r1) spin(1.6, 'mid', 0.8);
      if (t === r2) { cross(c.x + c.f * 1.1 * c.hh, c.y, 0.6, 1.1); for (const e of G.E) if (e.st !== 'dead' && !e.boss && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < 1.7 * c.hh) e.stun = Math.max(e.stun || 0, 30); }
      if (t === r3) { spin(2.0, 'hiden', 2.0); cross(c.x + c.f * 1.4 * c.hh, c.y, 0.6, 1.5, 4); G.SC.shake = Math.max(G.SC.shake || 0, 6); } } },
    y_bakuryu: { n: '人間無骨', f(c, t, C) { const [r1, r2, r3] = C.rel;   // 攔刺 → 刺入拖回 → 串刺爆裂
      if (t === r1) T(c, { len: 1.9, m: 0.7, ang: 0.12, shock: 1 });
      if (t === r2) { pullQi({ x: c.x, y: c.y, f: c.f, len: 2.4 }); drag(c, front(c, 2.6, 0.55), 0.8, 10); c.move(-0.05, 0); }
      if (t === r3) { const x = c.x + c.f * 1.0 * c.hh; T(c, { len: 2.2, m: 0.4, big: 1.5, hold: 4, life: 14, shock: 1 }); shatter(x, c.y - 0.55 * c.hh, 0, c.f, 0, 0.9 * c.hh, 0.1 * c.hh, 10, 2); KF().use('lance', () => KF().puff(x, c.y, 0.7)); G.SC.shake = Math.max(G.SC.shake || 0, 6);
        c.hit({ shape: 'circle', x, y: c.y, r: 1.3, m: 2.4, lv: 'hiden', kind: 'pierce', kb: 2.0, stun: 40 }); } } }
  };
  /* ====================== r3.185.0 秘傳演出層（判定照舊，外加暗場、運鏡、主視覺） ======================
   * 長槍＝直線、穿透、速度：畫面沉入夜色，一條貫穿畫面的槍線當主視覺；鏡頭先貼近、出手瞬間橫向拉開。 */
  const SCN = G.SC, HHk = () => G.HERO_H;
  const shot = (c, x, y, up, zoom, Tn) => { G.CAMFOCUS = { x, y: y - up * c.hh, until: G.t + Tn }; G.CAMZOOM = { k: zoom, until: G.t + Tn }; };
  const cinit = (c, Tn, dim) => { const m = c.a.mvx; if (m.cin) return false; m.cin = 1; VX.dim(Tn, dim); KF().use('lance', () => KF().light(c.x, c.y, 3, Tn, 0.25)); return true; };
  const liftE = (e, h) => G.KT && G.KT.lift && G.KT.lift(e, h);
  const foesAt = (x, y, R) => G.E.filter(e => e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - x, (e.y - y) * 1.5) < R);
  const shk = n => { SCN.shake = Math.max(SCN.shake || 0, n); }, hstop = n => { G.hitstop = Math.max(G.hitstop || 0, n); };
  /* 速度線：整個畫面的橫向流線（畫面空間） */
  function speedLines(life, f, n) { const L = []; for (let i = 0; i < (n || 26); i++) L.push([Math.random(), Math.random(), 0.5 + Math.random()]); const C = P();
    KF().add(life, 'g', (ctx, u) => { const a = Math.min(1, u / 4) * Math.min(1, (life - u) / 6); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height; ctx.lineCap = 'round';
      for (const l of L) { const x = (((l[0] - f * u * 0.07 * l[2]) % 1) + 1) % 1 * W, y = (0.12 + l[1] * 0.76) * Hh, len = W * 0.16 * l[2]; ctx.strokeStyle = rgba(l[2] > 1.1 ? C.lite : C.mid, 0.5 * a * l[2] / 1.5); ctx.lineWidth = Math.max(1, Hh * 0.004 * l[2]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); } }); }
  /* 地面十字：以主角為中心，橫貫戰場的十字光（縱向依透視壓扁） */
  function groundCross(x, y, R, life) { const C = P(); KF().add(life, 'g', (ctx, u) => { const k = KF().K(y), g = eo5(cl(u / 8, 0, 1)), a = Math.min(1, (life - u) / 10), pu = 1 + 0.12 * Math.sin(u * 0.35); ctx.translate(x, y);
      const bar = (L, w) => { for (const [ww, col, al] of [[w * 3.2, C.deep, 0.35], [w * 1.5, C.mid, 0.8], [w * 0.5, C.hot, 1]]) { const gr = ctx.createLinearGradient(-L, 0, L, 0); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, al * a)); gr.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, L, ww * pu, 0, 0, TAU); ctx.fill(); } };
      bar(R * k * g, 0.07 * k); ctx.save(); ctx.rotate(Math.PI / 2); ctx.scale(1, 1); bar(R * k * g * 0.42, 0.11 * k); ctx.restore(); });
    KF().use('lance', () => KF().light(x, y, 2.4, life, 0.5)); }
  /* 光柱：衝天的槍光 */
  function skyBeam(x, y, w, life) { const C = P(); KF().add(life, 'o', (ctx, u) => { const k = KF().K(y), g = eo5(cl(u / 4, 0, 1)), a = Math.min(1, (life - u) / 10), Hh = 7 * k; ctx.globalCompositeOperation = 'screen';
      for (const [ww, col, al] of [[w * 2.6, C.deep, 0.35], [w * 1.3, C.mid, 0.6], [w * 0.5, C.hot, 0.95]]) { const gr = ctx.createLinearGradient(x - ww * k, 0, x + ww * k, 0); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, al * a)); gr.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gr; ctx.fillRect(x - ww * k, y - Hh * g, ww * k * 2, Hh * g); } }); }
  const HY0 = {}; for (const id in HY3) HY0[id] = HY3[id].f;
  /* 蜻蛉切：貼近連刺（速度線）→ 一瞬停頓 → 鏡頭橫向拉開，一槍貫穿整個畫面，盡頭展開巨大蜻蛉翅 */
  HY3.y_hyakusen.f = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, f = c.f, Tn = c.a.T;
    if (cinit(c, Tn + 34, 0.9)) shot(c, c.x + f * 1.3 * k, c.y, 0.55, 1.18, r3);
    if (t === r2) speedLines(r3 - r2 + 4, f, 30);
    if (t === r3 - 9) { shot(c, c.x + f * 3.4 * k, c.y, 0.7, 2.1, 60); charge(c, c.x + f * 0.9 * k, 9); }   /* 出手前鏡頭先橫向拉開 */
    if (t > r2 + 5 && t < r3 - 2 && (t - r2) % 2 === 1) T(c, { len: rnd(1.9, 2.5), ang: rnd(-0.22, 0.22), cy: 0.55 + rnd(-0.18, 0.18), m: 0.1, lv: 'light', hold: 0, life: 5, big: 0.9 });   /* 連刺加密 */
    HY0.y_hyakusen(c, t, C);
    if (t === r3) { c.a.T = Math.max(c.a.T, r3 + 26); const sk = []; speedLines(20, f, 40);
      flyQi({ x: c.x - f * 0.6 * k, y: c.y, z: 0.55, f, dist: 10, dur: 7, hold: 6, big: 2.9, shaft: 1, shock: 1, step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 1.0, m: 0.9, lv: 'hiden', kind: 'pierce', kb: 2.2, skip: sk }) });
      c.later(6, () => { wings(c.x + f * 6.2 * k, c.y, 0.55, 3.4, 0); KF().use('lance', () => KF().light(c.x + f * 6 * k, c.y, 3, 22, 0.6, 0.6)); shk(10); }); } };
  /* 日本號：挑飛（鏡頭上抬）→ 空中雙刺 → 地面竄出一整片巨槍與衝天光柱，把妖怪頂上天 */
  HY3.y_shoryu.f = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, f = c.f, Tn = c.a.T;
    if (cinit(c, Tn + 44, 0.9)) shot(c, c.x + f * 1.2 * k, c.y, 0.7, 1.35, r1);
    HY0.y_shoryu(c, t, C);
    if (t === r1) { shot(c, c.x + f * 1.2 * k, c.y, 1.7, 1.6, r3 - r1); for (const e of foesAt(c.x + f * 1.2 * k, c.y, 2.2 * k)) liftE(e, 2.0); }
    if (t === r3) { c.a.T = Math.max(c.a.T, r3 + 34); const x = c.x + f * 1.2 * k, y = c.y; shot(c, x, y, 2.5, 2.1, 44); skyBeam(x, y, 0.5, 34); hstop(4);
      for (let i = 0; i < 9; i++) { const dx = (i - 4) * 0.42 * k, s = 3.4 - Math.abs(i - 4) * 0.5; riseTip(x + dx, y + ((i % 2) - 0.5) * 0.16 * k, Math.abs(i - 4) * 2, s); }
      for (const e of foesAt(x, y, 2.4 * k)) liftE(e, 3.2);
      c.later(8, () => { for (const e of foesAt(x, y, 2.6 * k)) G.damageOni(e, 0.9 * c.mul, true); shk(12); KF().use('lance', () => { KF().puff(x, y, 2.4); KF().rocks && KF().rocks(x, y, 12, 2.2); }); }); } };
  /* 御手杵：長驅（速度線）→ 蓄力，鏡頭橫向拉到最遠 → 投出巨槍，把一路上的妖怪串起來帶到盡頭炸開 */
  HY3.y_ryusei.f = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, f = c.f, Tn = c.a.T;
    if (cinit(c, Tn + 40, 0.9)) { shot(c, c.x + f * 2.2 * k, c.y, 0.6, 1.4, r2); speedLines(r1 + 4, f, 26); }
    if (t === r2 + 2) shot(c, c.x + f * 4.4 * k, c.y, 0.7, 2.3, r3 - r2 + 50);
    if (t !== r3) { HY0.y_ryusei(c, t, C); return; }
    c.a.T = Math.max(c.a.T, r3 + 30); const sk = [], got = [], x0 = c.x - f * 0.6 * k, D = 7.6, dur = 10; dust(c, 0.3, 1.2); speedLines(24, f, 40); shk(9);
    flyQi({ x: x0, y: c.y, z: 0.55, f, dist: D, dur, hold: 6, big: 3.3, shaft: 1, shock: 1, step: (px, py) => { const hs = c.hit({ shape: 'circle', x: px, y: py, r: 1.0, m: 2.4, lv: 'hiden', kind: 'pierce', skip: sk }) || []; for (const e of hs) if (!e.boss && !e.bb && got.indexOf(e) < 0) got.push(e);
        for (const e of got) { if (e.st === 'dead') continue; const nx = px + f * 0.3 * k; if ((nx - e.x) * f > 0 && SCN.walkable(nx, e.y)) e.x = nx; e.stun = Math.max(e.stun || 0, 20); e.kb = 0; } } });   /* 串在槍上一路帶走 */
    c.later(dur + 3, () => { const ex = x0 + f * D * k; for (const e of got) if (e.st !== 'dead') { G.damageOni(e, 0.9 * c.mul, true); liftE(e, 1.2); } shatter(ex, c.y - 0.55 * k, 0, f, 0, 1.6 * k, 0.16 * k, 14, 0); KF().use('lance', () => { KF().puff(ex, c.y, 2.2); KF().light(ex, c.y, 3, 24, 0.7, 0.6); KF().burst(ex, c.y, 0.55, 3); }); shk(13); hstop(8); }); };
  /* 十文字：薙地 → 腳下展開橫貫戰場的十字光，定住妖怪 → 大迴旋，四道槍氣沿十字四個方向射出 */
  HY3.y_kaiten.f = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, f = c.f, Tn = c.a.T;
    if (cinit(c, Tn + 36, 0.9)) shot(c, c.x, c.y, 0.9, 1.4, r2);
    HY0.y_kaiten(c, t, C);
    if (t === r2) { shot(c, c.x, c.y, 1.2, 1.85, r3 - r2 + 40); groundCross(c.x, c.y, 5.2, r3 - r2 + 26); for (const e of foesAt(c.x, c.y, 3.4 * k)) if (!e.boss) e.stun = Math.max(e.stun || 0, r3 - r2 + 20); shk(5); }
    if (t === r3) { c.a.T = Math.max(c.a.T, r3 + 24); hstop(4); c.later(5, () => { const sk = []; for (const [ff, ang, dist] of [[1, 0, 5.4], [-1, 0, 5.4], [1, -Math.PI / 2, 2.6], [1, Math.PI / 2, 2.0]])
          flyQi({ x: c.x, y: c.y, z: ang ? 0.1 : 0.5, f: ff, ang, dist, dur: 7, hold: 4, big: ang ? 1.5 : 2.3, shaft: ang ? 0 : 1, shock: 1, step: (px, py) => c.hit({ shape: 'circle', x: px, y: py, r: 1.0, m: 0.8, lv: 'hiden', kind: 'pierce', kb: 1.6, kbDir: ang ? f : ff, skip: sk }) });
        KF().use('lance', () => { KF().puff(c.x, c.y, 2.6); KF().light(c.x, c.y, 3.4, 22, 0.7); }); shk(12); }); } };
  /* 人間無骨：攔刺 → 把大範圍的妖怪鉤成一串拖到面前（鏡頭貼近）→ 一槍刺穿，槍尖從每隻妖怪身上向四面透出 */
  HY3.y_bakuryu.f = function (c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh, f = c.f, Tn = c.a.T;
    if (cinit(c, Tn + 36, 0.9)) shot(c, c.x + f * 1.6 * k, c.y, 0.6, 1.5, r2);
    HY0.y_bakuryu(c, t, C);
    if (t === r2) { pullQi({ x: c.x, y: c.y, f, len: 4.4 }); const es = front(c, 4.8, 1.3); es.forEach((e, i) => { if (e.boss) return; const to = 1.0 + i * 0.5; for (let j = 1; j <= 10; j++) c.later(j, () => { if (e.st === 'dead') return; e.x += (c.x + f * to * k - e.x) * 0.35; e.y += (c.y - e.y) * 0.3; }); e.stun = Math.max(e.stun || 0, r3 - r2 + 24); });
      shot(c, c.x + f * 1.1 * k, c.y, 0.55, 1.12, r3 - r2 - 4); speedLines(12, -f, 18); }
    if (t === r3 - 4) shot(c, c.x + f * 1.6 * k, c.y, 0.9, 1.9, 50);
    if (t === r3) { c.a.T = Math.max(c.a.T, r3 + 26); const es = front(c, 4.4, 1.3);
      flyQi({ x: c.x - f * 0.4 * k, y: c.y, z: 0.55, f, dist: 5.4, dur: 5, hold: 12, big: 2.0, shaft: 1, end: false });
      es.forEach((e, i) => { const z = 0.55 * (e.ratio || 1); for (let j = 0; j < 8; j++) c.later(5 + i * 2 + (j % 3), () => flyQi({ x: e.x, y: e.y, z, f: 1, ang: j * TAU / 8 + 0.2, dist: 1.5 + (j % 2) * 0.5, dur: 5, hold: 3, big: 0.85, end: false })); });
      c.later(13, () => { for (const e of es) if (e.st !== 'dead') { G.damageOni(e, 0.9 * c.mul, true); KF().use('lance', () => KF().burst(e.x, e.y, 0.55 * (e.ratio || 1), 2.2)); } shk(12); hstop(8); }); } };
  /* ---- 名稱與說明 ---- */
  const SKN = { skill_ryusei: ['一番槍', '突進 4H，槍頭在前一路貫穿，終點重刺', '突進距離 +50%', '終點槍氣再往前飛 4H'], skill_senso: ['槍花繚亂', '槍擺三下接扇形快速連刺', '連刺 +4', '最後一刺穿透 3.6H'],
    skill_shoryu: ['挑月', '由下往上大擺，挑飛前方敵人', '追加斜刺', '再追加前刺擊退'], skill_sorin: ['針山', '前方地面依序竄出槍頭', '變兩排', '槍頭殘留 2 秒持續傷害'],
    special_backpierce: ['回身刺', '後撤後回身一刺', '傷害 +30%', '回身刺必暴擊'], special_deny: ['不動構', '三槍交錯架在身前，擋住衝來的敵人', '架勢時間延長', '擋下時反刺 150%'],
    special_lane: ['一文字', '直線衝刺貫穿', '衝刺距離 +50%', '路徑上敵人緩速'], special_return: ['車返', '收槍迴旋一圈', '迴旋範圍 +25%', '迴旋回 10 氣力'], ultimate_ryuga: ['天沼矛', '身後展開槍陣依序射穿全場，最後巨矛橫貫', '槍陣 +2 把', '巨矛傷害 +25%'] };
  let named = 0;
  function rename() { const L = G.WPN.LIST && G.WPN.LIST.find(w => w.id === 'yari'); if (!L) return; for (const s of L.sk) { const v = SKN[s.id]; if (v) { s.n = v[0]; s.d = v[1]; s.d3 = v[2]; s.d5 = v[3]; } }
    const D = MV2.D.yari, U = MV2.U.yari, HD = MV2.HD && MV2.HD.yari; if (D) for (const k in DM2) if (D[k]) D[k].n = DM2[k].n; if (U) for (const k in DU2) if (U[k]) U[k].n = DU2[k].n; if (HD) for (const h of HD) if (HY3[h.id]) h.n = HY3[h.id].n;
    if (L.MV) for (const k in L.MV) if (DM2[k]) L.MV[k].n = DM2[k].n; named = 1; }
  /* ---- 掛上：92／114 會改寫定義，每格對照，必要時補回 ---- */
  G.YARI2 = 1; const WRH = {};
  function patch() { const D = MV2.D.yari, U = MV2.U.yari, HD = MV2.HD && MV2.HD.yari; if (!D || !U) return;
    for (const k in DM2) { const d = D[k], s = DM2[k]; if (!d) continue; if (d.run !== s.run) d.run = s.run; if (s.counter && d.counter !== s.counter) d.counter = s.counter; if (d.n !== s.n) d.n = s.n; }
    for (const k in DU2) { const d = U[k], s = DU2[k]; if (!d) continue; if (d.run !== s.run) d.run = s.run; if (s.counter && d.counter !== s.counter) d.counter = s.counter; if (d.n !== s.n) d.n = s.n; }
    if (HD) for (const h of HD) { const s = HY3[h.id]; if (!s) continue; if (h.n !== s.n) h.n = s.n; if (h.run === WRH[h.id]) continue; const base = h.run;
      WRH[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) s.f(c, t, C); else base.call(this, c, t); }; }
    if (!named) rename(); }
  const regN = () => { if (MV2.N && MV2.N.yari !== NY) MV2.N.yari = NY; };
  regN(); const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); regN(); try { patch(); } catch (x) { console.warn('kf yari2', x); } };
})();
