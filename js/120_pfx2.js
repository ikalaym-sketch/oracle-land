/* ==========================================================================
 * 神諭之地 重製版 — 120_pfx2.js
 * Version : r3.87.0  (2026-11-25)　r3.87.0：VX.ring 全遊戲停用（原本只停用夥伴出招時），主角舊秘傳的薄荷綠圓環、鈍器命中圓環一起拿掉
 * 舊版    : r3.85.0  (2026-11-25)
 * 變更    : r3.85.0 新增。第 3 批：一般夥伴 5 位（白丸／颯／葛葉／茨木童子／汐音）特效改用現成素材（照素材總表的夥伴配對）。
 *           ・拿掉：91_pfx 的疊加特效與投射光球、97 出招腳下色環、99 嘲諷／補血圓環、區域橢圓外框（這 5 位）；所有夥伴的 VX.ring 一律不畫。
 *           ・偏白的原素材換掉：白丸肩撞、護擋十字星、震地煙團；颯命中、標記、風徑；汐音回復主光（白色像素 45%～96%）。
 *           ・白丸：命中＝小地裂＋碎石；護衛＝主角腳邊揚塵＋碎石（拿掉白色十字星、白色煙團）；嘲諷＝弁慶立誓；大招＝千引石柱立起＋石屑；石門崩陣＝巨石落下（每塊配小碎石、揚塵）。
 *           ・颯：放箭弦光；回風牽線＝白虎撲擊風＋風刃；大招＝聚風＋風刃齊發（突刺殘影偏白，不用）；箭命中＝青葉碎風（原白色命中、標記拿掉）；四羽封徑＝風刃齊發＋青羽（千本櫻式飄落，碰到敵人切割；朱雀翼弧是火色，不用）。
 *             風刃：細長月牙刃，翻轉、搖擺地往前飛，後面拖長短不一的速度線。
 *           ・葛葉：符咒命中＝晴明符咒命中；淨化＝晴明封印閃光＋形代淨化；印（區域）＝晴明法陣（陣起→脈動→陣散）；大招＝大法陣＋陣內敵人依序符咒命中（九尾狐火偏白，不用）。
 *           ・茨木童子：炎腕＝茨木爪弧；大招＝斷臂爆發＋地裂碎石＋三道火柱（沿攻擊方向）＋鬼王火堆（衝擊波是白色圓環，不用）。
 *           ・汐音：回復＝河童瀑布水柱；冰（潮環凍步）＝冰潮＋凍結（取代霜環）；大招＝綿津見海嘯＋河童水柱；冰潮鳴奏＝冰潮連發。
 * 依賴    : 49_party（PARTY.list／step／dmg／zones）、50_party_kit（G.PEV.run／drawZones、G.PKIT）、91_pfx（G.PFX2 旗標）、111／117（G.KF.clip、KF 元件）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, PEV = G.PEV, VX = G.VX, H = G.H, SC = G.SC; if (!PY || !PEV || !VX) return;
  const NEW = G.PFX2 = new Set(['shiro', 'hayate', 'kuzuha', 'ibaraki', 'shion']);
  const KF = () => G.KF, HH = () => G.HERO_H, S = y => SC.depth(y), K = y => HH() * S(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const BIG = new Set(['grandCombo', 'A6', 'B6']), alive = e => e && e.st !== 'dead' && e.hp > 0;
  const tgOf = (P, c) => { const e = c && alive(c.tg) ? c.tg : P.tg; return alive(e) ? e : null; };
  const clip = o => G.KF && G.KF.clip ? G.KF.clip(o) : null;
  const PACKS = { shiro: ['b_mb_genbu', 'b_mb_benkei', 'b_chigaeshi', 'b_oni'], hayate: ['b_mb_byakko', 'b_susanoo', 'b_mb_ise'], kuzuha: ['b_seimei', 'b_katashiro'], ibaraki: ['b_ibaraki', 'b_oni', 'b_ezo'], shion: ['b_kappa', 'b_watatsumi'] };
  const preloaded = {}; function preload() { for (const P of PY.list) for (const u of PACKS[P.id] || []) if (!preloaded[u]) { preloaded[u] = 1; try { const q = G.ANIM.load(u); if (q && q.catch) q.catch(() => { preloaded[u] = 0; }); } catch (x) { preloaded[u] = 0; } } }
  const near = (x, y, r, n) => G.E.filter(e => alive(e) && !e.bb && Math.hypot(e.x - x, (e.y - y) * 1.6) < r).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, n || 99);
  const dmg = (P, e, m, big) => { try { PY.dmg(P, e, m, { ch: 'pfx2', big }); } catch (x) {} };
  /* ---------- 拿掉所有夥伴的圓環 ---------- */
  let pctx = 0; const ring0 = VX.ring; VX.ring = function () { return {}; };   // r3.87.0：整圈圓環全遊戲不畫（主角舊秘傳、鈍器命中、名物、世界事件也有）；ring0 保留備查
  const ps0 = PY.step; PY.step = function () { pctx++; try { return ps0.apply(this, arguments); } finally { pctx--; } };
  const pc0 = PY.cast; PY.cast = function () { pctx++; try { return pc0.apply(this, arguments); } finally { pctx--; } };   // 玩家按鈕／自動放招不在 PY.step 內
  const dz0 = PEV.drawZones.bind(PEV); PEV.drawZones = function () { const keep = PY.zones; PY.zones = keep.filter(Z => !(Z.P && NEW.has(Z.P.id))); try { return dz0(); } finally { PY.zones = keep; } };
  /* ---------- 素材換掉：葛葉縛環、汐音霜環 ---------- */
  function remap() { const PK = G.PKIT; if (!PK) return; const walk = (id, f) => { const k = PK[id] || (PK.K && PK.K[id]); if (k) for (const s in k) for (const ev of k[s].ev || []) f(ev); };
    const W0 = { shoulder_contact: '', guard_contact: '', heavy_quake: '', arrow_hit: '', read_mark: '', heavy_arrow: 'light_arrow', heal_main: '', wind_lane: '' };   // 偏白的原素材（白色像素 45%～96%）
    for (const id of NEW) walk(id, ev => { for (const f of ['fx', 'hitFx']) if (ev[f] in W0) ev[f] = W0[ev[f]]; });
    walk('kuzuha', ev => { if (ev.hitFx === 'bind_ring') ev.hitFx = 'seal_hit'; }); walk('shion', ev => { if (ev.fx === 'frost_ring') ev.fx = 'ice_tide'; }); }
  /* ---------- 風刃：細長月牙刃，翻轉、搖擺地往前飛，後拖長短不一的速度線；碰到敵人切割 ---------- */
  function windBlades(P, x0, y0, f, n, dist, spread, m, col) { const B = [], hit = new Set(), C = col || '110,214,192';
    for (let i = 0; i < n; i++) B.push({ d: rnd(-0.3, 0.2), dy: rnd(-spread, spread), z: rnd(0.35, 0.95), sp: rnd(0.16, 0.22), ph: rnd(0, TAU), s: rnd(0.8, 1.25), t: -i * 3 });
    KF().add(80, 'o', (ctx) => { const k = K(y0); for (const b of B) { if (b.t < 0 || b.dead) continue; const q = cl(b.t * b.sp / dist, 0, 1); if (q >= 1) continue; const x = x0 + f * (b.d + b.t * b.sp) * k, y = y0 + b.dy * k, z = (b.z + Math.sin(b.t * 0.25 + b.ph) * 0.08) * k, a = Math.min(1, b.t / 4, (1 - q) * 3), rot = Math.sin(b.t * 0.3 + b.ph) * 0.35, L = 0.62 * k * b.s;
        ctx.save(); ctx.translate(x, y - z); ctx.scale(f, 1);
        for (const [dy, l, w] of [[-0.07, 1.8, 0.9], [0.0, 1.2, 0.75], [0.06, 2.4, 0.5], [0.12, 0.8, 0.6]]) { const g = ctx.createLinearGradient(-L * (0.3 + l), 0, -L * 0.25, 0); g.addColorStop(0, 'rgba(' + C + ',0)'); g.addColorStop(1, 'rgba(' + C + ',' + (0.55 * a * w).toFixed(3) + ')'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L * (0.3 + l), dy * k); ctx.lineTo(-L * 0.25, dy * k - 1.2); ctx.lineTo(-L * 0.25, dy * k + 1.2); ctx.closePath(); ctx.fill(); }   // 速度線
        ctx.rotate(rot); ctx.fillStyle = 'rgba(' + C + ',' + (0.95 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.quadraticCurveTo(0, -L * 0.34, -L * 0.5, -L * 0.06); ctx.quadraticCurveTo(0, -L * 0.14, L * 0.5, 0); ctx.closePath(); ctx.fill();   // 月牙刃
        ctx.fillStyle = 'rgba(40,130,120,' + (0.7 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.quadraticCurveTo(0, -L * 0.14, -L * 0.5, -L * 0.06); ctx.quadraticCurveTo(0, -L * 0.04, L * 0.5, 0); ctx.closePath(); ctx.fill(); ctx.restore(); } },
      (o) => { const k = K(y0); for (const b of B) { b.t++; if (b.t < 0 || b.dead) continue; const x = x0 + f * (b.d + b.t * b.sp) * k, y = y0 + b.dy * k;
          for (const e of G.E) { if (!alive(e) || hit.has(e)) continue; if (Math.abs(e.x - x) < 0.3 * k * (e.ratio || 1) && Math.abs(e.y - y) < 0.35 * k) { hit.add(e); dmg(P, e, m, 0); KF().use('gale', () => KF().leaves(e.x, e.y, (e.ratio || 1) * 0.5, 2, { sp: 0.8, life: 26 })); } } } }); }
  /* ---------- 羽毛：千本櫻式（翻轉、搖擺、飄落），碰到敵人切割 ---------- */
  function featherFall(P, px, py, R, frames, m, col) { const F = [], C = col || '235,215,200';
    KF().add(frames + 140, 'o', (ctx) => { for (const p of F) { if (p.dead) continue; const k = K(p.y), sw = Math.sin(p.t * 0.08 + p.ph), fl = Math.cos(p.t * 0.2 + p.ph), L = p.L * k, x = p.x + sw * 0.3 * k, y = p.y - p.z * k;
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5 + sw * 0.6 + p.rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(fl)); ctx.globalAlpha = p.a;
        ctx.fillStyle = 'rgba(' + C + ',.95)'; ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.quadraticCurveTo(-L * 0.1, -L * 0.22, L * 0.5, -L * 0.02); ctx.quadraticCurveTo(-L * 0.1, L * 0.18, -L * 0.5, 0); ctx.fill();
        ctx.fillStyle = 'rgba(160,60,40,.75)'; ctx.fillRect(-L * 0.55, -0.6, L * 1.0, 1.2); ctx.restore(); } },
      (o, tt) => { if (tt < frames && tt % 3 === 0) for (let i = 0; i < 2; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R; F.push({ x: px + Math.cos(a) * r * HH(), y: py + Math.sin(a) * r * 0.4 * HH(), z: rnd(1.6, 2.6), sp: rnd(0.016, 0.026), ph: rnd(0, TAU), t: 0, L: rnd(0.26, 0.38), rot: rnd(-0.3, 0.3), a: 0 }); }
        for (const p of F) { if (p.dead) continue; p.t++; p.z -= p.sp; p.a = Math.min(1, p.t / 8); const k = K(p.y), sx = p.x + Math.sin(p.t * 0.08 + p.ph) * 0.3 * k; if (p.z <= 0) { p.dead = 1; continue; }
          for (const e of G.E) { if (!alive(e) || e.bb) continue; const ek = K(e.y), r = e.ratio || 1; if (Math.abs(e.x - sx) < 0.3 * ek * r && Math.abs(e.y - p.y) < 0.3 * ek && p.z * k < ek * r * 1.05) { p.dead = 1; if (!(G.t - (e.__fh || -99) < 14)) { e.__fh = G.t; dmg(P, e, m, 0); } KF().use('gale', () => KF().qi({ x: sx, y: e.y, z: p.z * k / ek, ang: rnd(-1, 1), len: 0.6, w: 0.05, dur: 2, life: 8, motes: 1 })); break; } } } }); }
  /* ---------- 落石：巨石從天落下，落地地裂＋小碎石＋揚塵 ---------- */
  function boulders(P, x0, y0, n, R, m) {
    for (let i = 0; i < n; i++) { const x = x0 + rnd(-R, R) * HH(), y = y0 + rnd(-R, R) * 0.35 * HH(), d = i * 6 + (i ? Math.floor(rnd(0, 4)) : 0), T = 14, s = rnd(0.8, 1.1), rot = rnd(-0.4, 0.4);
      VX.custom(() => {}, d + T + 1, 'o', { step: (q, tt) => { if (tt === d) { let t = 0; at('b_oni', 'oniking_falling_boulder', 0, 0, { fx: () => [x, y - (1 - Math.pow(Math.min(1, t / T), 2)) * 3.2 * K(y)], w: s, rot, life: T + 12, step: () => { t++; } }); }
        if (tt !== d + T) return; VX.s2('fx_crack_m', { x, y, k: 0.9, sy: 0.55, l: 'g', life: 50 }); VX.s2('fx_debris', { x, y, k: 0.8, life: 30 }); VX.s2('fx_smoke', { x, y, z: 0.1 * K(y), k: 0.6, life: 36, a: 0.45 });
          KF().use('ember', () => KF().rocks(x, y, 6, 1.3)); SC.shake = Math.max(SC.shake || 0, 5); for (const e of near(x, y, 0.9 * HH())) dmg(P, e, m, 1); } }); } }
  /* ---------- 各夥伴：事件 ---------- */
  const at = (u, n, x, y, o) => clip(Object.assign({ u, n, x, y }, o || {}));
  function onEv(P, ev, c) { const id = P.id, sid = (c && c.sid) || '', e = tgOf(P, c), big = BIG.has(sid), f = P.face || 1, k = K(P.y);
    if (ev.k === 'hit') {
      if (id === 'shiro' && e) { VX.s2('fx_crack_s', { x: e.x, y: e.y, k: 0.7, sy: 0.55, l: 'g', life: 40 }); KF().use('ember', () => KF().rocks(e.x, e.y, 3, 1)); }
      if (id === 'ibaraki' && e && /A2|A3|A4|B3|smallCombo/.test(sid)) at('b_ibaraki', 'ibaraki_claw_arc', e.x, e.y, { z: (e.ratio || 1) * 0.5, w: 1.5, flip: f < 0 });
      if (id === 'kuzuha' && e) at('b_seimei', 'fx_talisman_hit', e.x, e.y, { z: (e.ratio || 1) * 0.5, w: 0.9 }); }
    else if (ev.k === 'guard' && id === 'shiro') { VX.s2('fx_smoke', { x: H.x, y: H.y, z: 0.05 * K(H.y), k: 0.5, life: 30, a: 0.55 }); KF().use('ember', () => KF().rocks(H.x, H.y, 4, 0.8)); }
    else if (ev.k === 'taunt' && id === 'shiro') at('b_mb_benkei', 'benkei_vow_front', P.x, P.y, { z: 0.55, w: 1.6, flip: f < 0, life: 26 });
    else if (ev.k === 'heal' && id === 'shion') { at('b_kappa', 'kappataisho_falls_column', H.x, H.y, { z: 1.0, w: 0.8, life: 30, a: 0.9 }); }
    else if (ev.k === 'cleanse' && id === 'kuzuha') { at('b_seimei', 'fx_seal_flash', H.x, H.y, { z: 0.5, w: 1.4, life: 24 }); at('b_katashiro', 'katashiro_purify_calm', H.x, H.y, { z: 0.6, w: 1.1, life: 30 }); }
    else if (ev.k === 'proj' && id === 'hayate') at('b_mb_ise', 'ise_yoshimori_string_glint', P.x + f * 0.4 * k, P.y, { z: 0.6, w: 0.9, flip: f < 0, life: 12 });
    else if (ev.k === 'zone') { const Z = PY.zones[PY.zones.length - 1]; if (!Z || Z.P !== P) return; const w = Z.r * 2.3 / K(Z.y), life = Z.life;
      if (id === 'kuzuha') { at('b_seimei', 'fx_array_birth', Z.x, Z.y, { w, l: 'g', life: 20 }); VX.custom(() => {}, 20, 'g', { step: (q, tt) => { if (tt === 18) at('b_seimei', 'fx_array_pulse', Z.x, Z.y, { w, l: 'g', loop: 1, life: Math.max(20, life - 40) }); } }); VX.custom(() => {}, life, 'g', { step: (q, tt) => { if (tt === Math.max(30, life - 22)) at('b_seimei', 'fx_array_end', Z.x, Z.y, { w, l: 'g', life: 22 }); } }); }
      else if (id === 'hayate') { at('b_mb_byakko', 'byakko_pounce_wind', Z.x, Z.y, { z: 0.4, w: Math.max(1.6, w * 0.8), flip: f < 0, life: 26 }); windBlades(P, Z.x - f * w * 0.4 * K(Z.y), Z.y, f, 5, w * 0.9, 0.3, 0.25); }
      else if (id === 'shion') { at('p_shion_fx', 'ice_tide', Z.x, Z.y, { z: 0.2, w: Math.max(1.4, w * 0.7), life: 30 }); at('p_shion_fx', 'freeze_snap', Z.x, Z.y, { z: 0.4, w: 1.1, life: 24 }); } }
    if (big && c && !c.__pf2) { c.__pf2 = 1; finale(P, c, e, sid); } }
  function finale(P, c, e, sid) { const id = P.id, f = P.face || 1, x = e ? e.x : P.x + f * HH() * 1.6, y = e ? e.y : P.y; VX.dimA = 0.3; VX.dimT = 22;
    if (id === 'shiro') { if (sid === 'B6') boulders(P, x, y, 5, 1.2, 0.8); else { at('b_mb_benkei', 'benkei_vow_front', P.x, P.y, { z: 0.55, w: 1.8, flip: f < 0, life: 26 }); at('b_chigaeshi', 'chigaeshi_pillar_cracked', x, y, { w: 1.2, life: 60, hold: 0 }); VX.s2('fx_crack_m', { x, y, k: 1.1, sy: 0.55, l: 'g', life: 50 }); KF().use('ember', () => KF().rocks(x, y, 8, 1.5)); VX.s2('fx_smoke', { x, y, z: 0.1 * K(y), k: 1, life: 44, a: 0.6 }); } }
    else if (id === 'hayate') { if (sid === 'B6') { windBlades(P, P.x, P.y, f, 7, 5, 0.6, 0.3); featherFall(P, x, y, 2.0, 90, 0.3, '150,212,188'); }
      else { at('b_susanoo', 'fx_wind_gather', P.x + f * 0.5 * K(P.y), P.y, { z: 0.6, w: 1.2, life: 18 }); VX.custom(() => {}, 20, 'o', { step: (q, tt) => { if (tt === 14) windBlades(P, P.x, P.y, f, 9, 6, 0.5, 0.35); } }); } }
    else if (id === 'kuzuha') { at('b_seimei', 'fx_array_birth', x, y, { w: 4.2, l: 'g', life: 24 }); VX.custom(() => {}, 24, 'g', { step: (q, tt) => { if (tt === 22) at('b_seimei', 'fx_array_pulse', x, y, { w: 4.2, l: 'g', loop: 1, life: 70 }); } });
      near(x, y, 2.2 * HH(), 6).forEach((q, i) => VX.custom(() => {}, 30 + i * 5, 'o', { step: (o, tt) => { if (tt === 24 + i * 5 && alive(q)) at('b_seimei', 'fx_talisman_hit', q.x, q.y, { z: (q.ratio || 1) * 0.5, w: 1.1 }); } })); }
    else if (id === 'ibaraki') { at('b_ibaraki', 'ibaraki_arm_burst', x, y, { z: 0.6, w: 2.6, life: 30 }); VX.s2('fx_crack_l', { x, y, k: 1.2, sy: 0.55, l: 'g', life: 60 }); KF().use('ember', () => { KF().rocks(x, y, 8, 1.4); KF().embers(x, y, 0.4, 14); });
      for (let i = 0; i < 3; i++) { const px = x + f * (i - 1) * 1.1 * HH(), py = y + (i - 1) * 0.12 * HH(); VX.custom(() => {}, i * 5 + 1, 'o', { step: (q, tt) => { if (tt === i * 5) { at('b_ezo', 'fx_fire_pillar', px, py, { w: 1.3, life: 40 }); for (const q2 of near(px, py, 0.8 * HH())) dmg(P, q2, 0.5, 1); } } }); }
      for (let i = 0; i < 4; i++) at('b_oni', 'oniking_fire', x + rnd(-1.2, 1.2) * HH(), y + rnd(-0.4, 0.4) * HH(), { w: rnd(0.45, 0.65), loop: 1, life: 90 }); SC.shake = Math.max(SC.shake || 0, 7); }
    else if (id === 'shion') { if (sid === 'B6') { for (let i = 0; i < 3; i++) VX.custom(() => {}, i * 8 + 1, 'o', { step: (q, tt) => { if (tt === i * 8) at('p_shion_fx', 'ice_tide', x + f * (i - 1) * 1.1 * HH(), y, { z: 0.2, w: 2.0, flip: f < 0, life: 30 }); } }); }
      else { at('b_watatsumi', 'watatsumi_tsunami', x - f * 0.6 * HH(), y, { w: 3.6, flip: f < 0, life: 40 }); at('b_kappa', 'kappataisho_water_jet', P.x + f * 1.4 * K(P.y), P.y, { z: 0.5, w: 2.6, flip: f < 0, life: 26 }); } } }
  /* 颯的箭命中：原本白色命中特效拿掉，改成青葉碎風 */
  const dm0 = PY.dmg; PY.dmg = function (P, e, m, o) { const r = dm0.apply(this, arguments); try { if (P && P.id === 'hayate' && e && !(o && o.ch === 'pfx2') && KF()) KF().use('gale', () => KF().leaves(e.x, e.y, (e.ratio || 1) * 0.55, 3, { sp: 0.9, life: 26 })); } catch (x) {} return r; };
  /* ---------- 掛上 ---------- */
  const run0 = PEV.run.bind(PEV); PEV.run = function (P, ev, c) { pctx++; let r; try { r = run0(P, ev, c); } finally { pctx--; } try { if (P && NEW.has(P.id)) onEv(P, ev, c); } catch (x) { console.warn('pfx2', x); } return r; };
  let rm = 0; const st0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { st0.apply(this, arguments); if (!rm && G.PKIT) { rm = 1; try { remap(); } catch (x) {} } if (G.t % 120 === 0) preload(); };
  G.PFX2F = { windBlades, featherFall, boulders };
})();
