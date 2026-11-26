/* ==========================================================================
 * 神諭之地 重製版 — 91_pfx.js
 * Version : r3.104.2  (2026-11-26)　r3.104.2：石獅結界光罩改用 132 護罩（拿掉開場白色外框線、菱形小點、上升圓點）
 * 舊版    : r3.85.0  (2026-11-25)　r3.85.0：白丸／颯／葛葉／茨木／汐音（G.PFX2）不再疊本檔特效與投射光球，改由 120_pfx2
 * 舊版    : r3.50.0  (2026-11-18)　r3.50.0：結界光罩拿掉上緣實心亮段；同時只留一個光罩（重複觸發只延長）
 * 舊版    : r3.43.1  (2026-11-18)　r3.43.1：護擋特效改成石獅結界光罩（拿掉細線橢圓、金色 UI 圓環）
 * 舊版    : r3.42.0  (2026-11-18)
 * 變更    : r3.42.0 新增。8 位夥伴招式特效重做（原本素材包特效太小、太淡，幾乎看不到）。
 *           ・不改招式數值與判定，只在每個事件結算時（G.PEV.run）疊一層看得清楚的特效；原素材特效保留在底下。
 *           ・每位夥伴一套色系與手法：
 *             白丸＝石色土黃（地裂、塵環、碎石）　颯＝青白風（風箭拖尾、風環）　葛葉＝狐火藍＋紙符（陰陽法陣、狐火）
 *             茨木＝鬼火赤（火爆、燃燒地面、重擊地裂）　汐音＝潮青（水波、水珠回復、霜環）　源賴光＝鋼白藍（刀幕弧光）
 *             建御雷＝雷金白（落雷、雷紋法陣）　役小角＝靈紫綠（役靈光球、法陣）
 *           ・事件對應：近擊＝命中閃光＋（刀系）刀幕；範圍／地面＝地裂＋塵環；投射＝依夥伴畫箭／水珠／紙符／靈光（含拖尾）；
 *             護擋＝主角腳下守護環＋盾光；嘲諷＝紅色脈衝環；標記＝準星；自身強化＝氣環；回復＝綠光柱＋上升水珠；淨化＝神社法陣；
 *             區域（守印／縛印／霜環／風路／加速）＝對應法陣持續到區域結束。
 *           ・大連攜（grandCombo／A6／B6）：畫面短暫壓暗＋夥伴專屬終結演出（白丸大地裂、颯光柱箭雨、葛葉六芒狐火陣、茨木炎柱、
 *             汐音大潮環、賴光十字斬光、建御雷天雷、役小角役靈陣）。
 * 依賴    : 50_party_kit（G.PEV.run／G.PKIT／G.PARTY.proj、zones）、76_vfx／84_fxkit／86_fx2（VX.*）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, PEV = G.PEV, VX = G.VX, SC = G.SC, H = G.H, HH = () => G.HERO_H, S = y => SC.depth(y), ctx = G.ctx, TAU = 6.2832;
  if (!PY || !PEV || !VX) return;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const PAL = {
    shiro: { c: '235,200,140', c2: '255,240,200', kind: 'blunt', ground: 1 },
    hayate: { c: '170,240,255', c2: '240,255,255', kind: 'pierce', wind: 1 },
    kuzuha: { c: '120,170,255', c2: '220,235,255', kind: 'pierce', sigil: 'onmyo' },
    ibaraki: { c: '255,110,60', c2: '255,220,150', kind: 'blunt', fire: 1 },
    shion: { c: '110,220,240', c2: '220,255,255', kind: 'blunt', water: 1 },
    yorimitsu: { c: '190,215,255', c2: '255,255,255', kind: 'cut', blade: 1 },
    takemikazuchi: { c: '255,230,140', c2: '255,255,230', kind: 'cut', blade: 1, thunder: 1 },
    enno: { c: '190,140,255', c2: '230,255,220', kind: 'blunt', sigil: 'onmyo' }
  };
  const BIG = new Set(['grandCombo', 'A6', 'B6']);
  const sidOf = c => (c && c.sid) || '';
  const tgOf = (P, c) => { const e = c && c.tg && c.tg.st !== 'dead' ? c.tg : P.tg; return e && e.st !== 'dead' ? e : null; };
  const chest = e => e.y - HH() * (e.ratio || 1) * S(e.y) * 0.5;

  /* ---------- 事件特效 ---------- */
  function onHit(P, ev, c) { const K = PAL[P.id]; if (!K) return; const e = tgOf(P, c), big = ev.big || BIG.has(sidOf(c));
    const x = ev.ranged && e ? e.x : e && Math.abs(e.x - P.x) < HH() * 2.5 ? e.x : P.x + P.face * HH() * 0.9, y = ev.ranged && e ? e.y : e ? e.y : P.y;
    if (K.blade) VX.ribbon && VX.ribbon({ x: P.x, y: P.y, face: P.face, r: big ? 1.6 : 1.15, w: big ? 0.5 : 0.32, sq: 0.55, rot: rnd(-0.25, 0.25), a0: -2.2, a1: 1.0, sw: 5, life: 14, col: K.c, edge: K.c2, trail: 2.4, shat: big ? 10 : 5 });
    if (e) VX.impact && VX.impact(e, big ? 'heavy' : 'mid', K.kind, 0, K.c);
    if (ev.r || ev.ground || ev.lane) { const r = Math.max(0.8, (ev.r || 100) / HH()) * 0.75;
      if (ev.lane) VX.streak && VX.streak({ x: P.x, y: P.y, face: P.face, len: (ev.r || 200) / HH(), n: 8, life: 12, col: K.c, cy: 0.5 });
      else { VX.ring && VX.ring({ x, y, r1: r * 1.3, life: 18, col: K.c, lw: 0.1 }); if (K.ground || K.fire || big) VX.crack && VX.crack({ x, y, r: Math.min(1.4, r) });
        if (K.fire) VX.burn2 && VX.burn2({ x, y, r: r * 0.8, life: 60 }); if (K.wind) VX.wind && VX.wind({ x, y, r, n: 5, life: 18, col: K.c, face: P.face, spin: 0.4 });
        if (K.thunder) { VX.bolt && VX.bolt({ x0: x, y0: y - HH() * 5, x1: x, y1: y, col: K.c, life: 14, w: 3.5 }); VX.sigil && VX.sigil({ x, y, kind: 'raiden', r: r, life: 26 }); }
        if (K.sigil && big) VX.sigil && VX.sigil({ x, y, kind: K.sigil, r: r * 1.1, life: 30 });
        if (K.water) VX.wind && VX.wind({ x, y, r, n: 4, life: 20, col: K.c, face: P.face, spin: 0.25 }); } }
    else if (K.thunder && ev.ranged && e) VX.bolt && VX.bolt({ x0: e.x, y0: e.y - HH() * 4.5, x1: e.x, y1: e.y, col: K.c, life: 12, w: 2.6 });
    else if (K.fire && e) VX.glow && VX.glow({ x: e.x, y: e.y, z: 0.6, r: 0.5, col: K.c, life: 10 });
    if (ev.dash) VX.streak && VX.streak({ x: P.x, y: P.y, face: P.face, len: 1.2, n: 5, life: 8, col: K.c, cy: 0.55 });
    if (big) G.SC.shake = Math.max(G.SC.shake || 0, 5); }
  /* r3.43.0：護擋改成「石獅結界」——半透明光罩（漸層、上緣高光、上升光點）＋腳下柔光，取代細線橢圓與 UI 圓環 */
  /* r3.49.0：同時只留一個光罩（重複觸發只延長時間，不疊加變成實心亮塊）；拿掉上緣實線高光 */
  function shield(K, dur) { const T = Math.max(30, dur | 0), L = (VX.L || []).filter(o => o.shd && o.t < o.life); if (L.length) { for (const o of L) o.life = Math.max(o.life, o.t + T); return; }
    VX.custom((o, c) => { const s = S(H.y), h = HH() * s, a = Math.min(1, o.t / 8, (o.life - o.t) / 16), rx = h * 0.8, ry = rx * 0.3; c.save(); c.globalCompositeOperation = 'lighter';
      c.translate(H.x, H.y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(' + K.c + ',' + 0.32 * a + ')'); g.addColorStop(0.7, 'rgba(' + K.c + ',' + 0.14 * a + ')'); g.addColorStop(1, 'rgba(' + K.c + ',0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();   // r3.104.2：拿掉繞圈的菱形小點
      c.restore(); }, T, 'g', { shd: 1 });
    VX.custom((o, c) => { const s = S(H.y), h = HH() * s, k = Math.min(1, 0.6 + o.t / 20), a = Math.min(1, o.t / 8, (o.life - o.t) / 16), rx = h * 0.6 * k, ry = h * 0.78 * k, cy = H.y - h * 0.52;
      if (G.SHFX) { G.SHFX.dome(c, H.x, cy, rx, ry, K.c, K.c2, o.t, a, null); return; }   // r3.104.2：改用 132 護罩（柔邊、氣流、無外框線）
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(H.x, cy); c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx); g.addColorStop(0, 'rgba(' + K.c + ',0)'); g.addColorStop(0.85, 'rgba(' + K.c + ',' + 0.16 * a + ')'); g.addColorStop(1, 'rgba(' + K.c + ',0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
      const sw = ((o.t * 1.6) % (rx * 2.6)) - rx * 1.3, b = c.createLinearGradient(0, sw - rx * 0.25, 0, sw + rx * 0.25); b.addColorStop(0, 'rgba(' + K.c2 + ',0)'); b.addColorStop(0.5, 'rgba(' + K.c2 + ',' + 0.12 * a + ')'); b.addColorStop(1, 'rgba(' + K.c2 + ',0)');
      c.fillStyle = b; c.beginPath(); c.arc(0, 0, rx * 0.97, 0, TAU); c.fill();
      if (o.t < 10) { c.strokeStyle = 'rgba(255,255,255,' + 0.5 * (1 - o.t / 10) + ')'; c.lineWidth = 2 * s; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.stroke(); }
      c.restore(); c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const q = ((o.t + i * 23) % 70) / 70, x = H.x + Math.sin(i * 2.3 + o.t * 0.03) * rx * 0.6, y = H.y - h * 0.05 - q * h * 1.2; c.fillStyle = 'rgba(' + K.c2 + ',' + 0.6 * a * Math.sin(q * Math.PI) + ')'; c.beginPath(); c.arc(x, y, 1.8 * s, 0, TAU); c.fill(); }
      c.restore(); }, T, 'o', { shd: 1 }); }
  G.PFX_SHIELD = shield;
  function onGuard(P, ev) { shield(PAL[P.id] || PAL.shiro, Math.round((ev.dur || 3) * 60)); }
  function onTaunt(P, ev) { for (let i = 0; i < 2; i++) VX.ring && VX.ring({ x: P.x, y: P.y, r1: (ev.r || 200) / HH(), life: 22, d: i * 8, col: '255,90,70', lw: 0.08 }); }
  function onMark(P, ev, c) { const e = tgOf(P, c); if (e) VX.s2 && VX.s2('fx_mark', { fx: () => [e.x, e.y], z: (e.ratio || 1) * 0.6, k: 0.8, life: 20, hold: Math.round((ev.dur || 6) * 60) - 20, add: 1 }); }
  function onSelf(P, ev) { const K = PAL[P.id]; VX.ring && VX.ring({ x: P.x, y: P.y, r1: 1.0, life: 16, col: K ? K.c : '255,255,255', lw: 0.09 }); VX.glow && VX.glow({ x: P.x, y: P.y, z: 0.6, r: 0.7, col: K ? K.c : '255,255,255', life: 14 }); }
  function onHeal(P, ev) { const s = S(H.y); VX.pillar && VX.pillar({ x: H.x, y: H.y, h: 2.2, wk: 0.5 });
    for (let i = 0; i < 8; i++) { const ox = rnd(-0.4, 0.4), d = i * 3; VX.custom((o, c) => { const q = o.t / o.life, h = HH() * s; c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(150,255,200,' + (1 - q) + ')'; c.beginPath(); c.arc(H.x + ox * h, H.y - h * (0.2 + q * 1.2), 2.5 + 2 * (1 - q), 0, TAU); c.fill(); c.restore(); }, 40, 'o', { d }); }
    VX.glow && VX.glow({ x: H.x, y: H.y, z: 0.6, r: 0.7, col: '150,255,200', life: 24 }); }   // r3.43.0：拿掉 UI 圓環
  function onCleanse() { VX.sigil && VX.sigil({ x: H.x, y: H.y, kind: 'shrine', r: 0.9, life: 40 }); VX.glow && VX.glow({ x: H.x, y: H.y, z: 0.6, r: 0.6, col: '255,250,220', life: 16 }); }
  function onZone(P, ev, c) { const Z = PY.zones[PY.zones.length - 1]; if (!Z || Z.P !== P) return; const K = PAL[P.id] || PAL.kuzuha, r = (Z.r || 90) / HH(), life = Z.life;
    const kind = Z.z === 'ward' ? 'shrine' : Z.z === 'bind' ? 'onmyo' : Z.z === 'frost' ? null : Z.z === 'haste' ? 'shrine' : null;
    if (kind) VX.sigil && VX.sigil({ x: Z.x, y: Z.y, kind, r: r * 1.15, life, a: 0.55 });
    if (Z.z === 'frost') { VX.ring && VX.ring({ x: Z.x, y: Z.y, r1: r * 1.3, life: 30, col: '170,230,255', lw: 0.12 }); VX.custom((o, cx) => { const s = S(Z.y), a = Math.min(1, o.t / 10, (o.life - o.t) / 20); cx.save(); cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgba(170,230,255,' + 0.18 * a + ')'; cx.beginPath(); cx.ellipse(Z.x, Z.y, Z.r * s, Z.r * s * 0.42, 0, 0, TAU); cx.fill(); cx.restore(); }, life, 'g'); }
    if (Z.z === 'lane' || Z.z === 'tether') VX.wind && VX.wind({ x: Z.x, y: Z.y, r: r, n: 6, life: Math.min(life, 60), col: K.c, face: P.face, spin: 0.5 });
    if (ev.m) G.SC.shake = Math.max(G.SC.shake || 0, 4); }
  /* ---------- 大連攜：夥伴專屬終結演出 ---------- */
  function finale(P, c) { const K = PAL[P.id]; if (!K) return; const e = tgOf(P, c), x = e ? e.x : P.x + P.face * HH() * 1.5, y = e ? e.y : P.y; VX.dimA = 0.35; VX.dimT = 24;
    if (P.id === 'shiro') { VX.crack && VX.crack({ x, y, r: 1.6 }); VX.debris2 && VX.debris2({ x, y, n: 10 }); VX.ring && VX.ring({ x, y, r1: 2.4, life: 24, col: K.c, lw: 0.14 }); }
    else if (P.id === 'hayate') { for (let i = 0; i < 5; i++) G.STORY.later(i * 6, () => VX.pillar && VX.pillar({ x: x + rnd(-60, 60), y: y + rnd(-20, 20), h: 4, wk: 0.6 })); VX.wind && VX.wind({ x, y, r: 2, n: 8, life: 30, col: K.c, face: 1, spin: 0.6 }); }
    else if (P.id === 'kuzuha') { VX.sigil && VX.sigil({ x, y, kind: 'onmyo', r: 2.2, life: 60 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; VX.glow && VX.glow({ x: x + Math.cos(a) * HH() * 1.6, y: y + Math.sin(a) * HH() * 0.6, z: 0.5, r: 0.4, col: '120,170,255', life: 40 }); } }
    else if (P.id === 'ibaraki') { VX.blast && VX.blast({ x, y, r: 1.6 }); VX.burn2 && VX.burn2({ x, y, r: 1.4, life: 90 }); VX.pillar && VX.pillar({ x, y, h: 4, wk: 1.2 }); }
    else if (P.id === 'shion') { for (let i = 0; i < 3; i++) VX.ring && VX.ring({ x: H.x, y: H.y, r1: 1.6 + i * 0.6, life: 26, d: i * 6, col: K.c, lw: 0.12 }); VX.wind && VX.wind({ x: H.x, y: H.y, r: 2, n: 8, life: 30, col: K.c, face: 1, spin: 0.3 }); }
    else if (P.id === 'yorimitsu') { [-0.8, 0.8].forEach((rot, i) => VX.ribbon && VX.ribbon({ x, y, face: P.face, r: 2.0, w: 0.6, sq: 0.9, rot, a0: -2.4, a1: 1.2, sw: 4, life: 18, d: i * 5, col: K.c, edge: K.c2, trail: 2.8, shat: 12 })); VX.blast && VX.blast({ x, y, r: 1.0 }); }
    else if (P.id === 'takemikazuchi') { VX.sigil && VX.sigil({ x, y, kind: 'raiden', r: 2.0, life: 50 }); for (let i = 0; i < 4; i++) G.STORY.later(i * 5, () => VX.bolt && VX.bolt({ x0: x + rnd(-40, 40), y0: y - HH() * 6, x1: x + rnd(-30, 30), y1: y, col: K.c, life: 16, w: 4 })); VX.pillar && VX.pillar({ x, y, h: 5, wk: 1 }); }
    else if (P.id === 'enno') { VX.sigil && VX.sigil({ x, y, kind: 'onmyo', r: 2.0, life: 60 }); for (let i = 0; i < 4; i++) VX.glow && VX.glow({ x: x + rnd(-60, 60), y: y + rnd(-20, 20), z: 0.6, r: 0.5, col: i % 2 ? '190,140,255' : '150,255,200', life: 30, d: i * 5 }); }
    G.SC.shake = Math.max(G.SC.shake || 0, 7); }
  /* ---------- 掛勾：事件結算 ---------- */
  const run0 = PEV.run.bind(PEV); const done = new WeakSet();
  PEV.run = function (P, ev, c) { const r = run0(P, ev, c); if (P && G.PFX2 && G.PFX2.has(P.id)) return r;   // r3.85.0：第 3 批 5 位改由 120_pfx2
    try { if (ev.k === 'hit') onHit(P, ev, c); else if (ev.k === 'guard') onGuard(P, ev); else if (ev.k === 'taunt') onTaunt(P, ev); else if (ev.k === 'mark') onMark(P, ev, c); else if (ev.k === 'self') onSelf(P, ev);
      else if (ev.k === 'heal') onHeal(P, ev); else if (ev.k === 'cleanse') onCleanse(); else if (ev.k === 'zone') onZone(P, ev, c); else if (ev.k === 'armor') onSelf(P, ev);
      if (BIG.has(sidOf(c)) && c && !done.has(c)) { done.add(c); finale(P, c); } } catch (x) { console.warn('pfx', x); }
    return r; };
  /* ---------- 投射物：依夥伴畫箭／水珠／紙符／靈光（拖尾） ---------- */
  function drawProj() { for (const p of PY.proj) { const K = PAL[p.P.id]; if (!K || (G.PFX2 && G.PFX2.has(p.P.id))) continue; const s = S(p.gy), f = p.face || 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (p.P.id === 'hayate') { const big = p.m >= 1.5, L = HH() * s * (big ? 0.75 : 0.5); ctx.strokeStyle = 'rgba(' + K.c2 + ',.95)'; ctx.lineWidth = big ? 2.6 : 1.8; ctx.beginPath(); ctx.moveTo(p.x - f * L, p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.fillStyle = 'rgba(' + K.c2 + ',.95)'; ctx.beginPath(); ctx.moveTo(p.x + f * 6, p.y); ctx.lineTo(p.x - f * 3, p.y - 3.5); ctx.lineTo(p.x - f * 3, p.y + 3.5); ctx.fill();
        const g = ctx.createLinearGradient(p.x - f * L * 2.2, 0, p.x, 0); g.addColorStop(0, 'rgba(' + K.c + ',0)'); g.addColorStop(1, 'rgba(' + K.c + ',.6)'); ctx.strokeStyle = g; ctx.lineWidth = big ? 4 : 2.5; ctx.beginPath(); ctx.moveTo(p.x - f * L * 2.2, p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
      else { const r = HH() * s * (p.m >= 1.5 ? 0.22 : 0.15), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2); g.addColorStop(0, 'rgba(' + K.c2 + ',.95)'); g.addColorStop(0.35, 'rgba(' + K.c + ',.7)'); g.addColorStop(1, 'rgba(' + K.c + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(' + K.c + ',.45)'; ctx.lineWidth = r * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - f * r * 4, p.y + Math.sin(G.t * 0.4) * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (p.P.id === 'kuzuha') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(250,245,230,.95)'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(G.t * 0.3); ctx.fillRect(-r * 0.45, -r * 0.8, r * 0.9, r * 1.6); ctx.fillStyle = 'rgba(200,40,40,.9)'; ctx.fillRect(-r * 0.15, -r * 0.5, r * 0.3, r); ctx.restore(); } }
      ctx.restore(); } }
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); try { drawProj(); } catch (x) {} return r; };
})();
