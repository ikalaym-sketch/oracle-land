/* ==========================================================================
 * 神諭之地 重製版 — 117_teppo.js
 * Version : r3.82.0  (2026-11-25)
 * 變更    : r3.82.0 改用現成素材：大筒＝合戰大筒 war_cannon、爆炸＝fx_blast＋fx_crack_glow＋fx_smoke＋fx_debris、焙烙＝fx_bomb、燃燒地帶＝刑部姬地面火帶＋鬼王火堆、
 *                   火龍放射＝酒吞童子烈焰、火車＝酒吞童子酒桶、槍口火光＝fx_muzzle_big；新增 clip（播頭目素材包片段）；燃燒狀態拿掉身上火苗，只留火星（G.FLAMES）。
 *           r3.81.0 新增。鐵砲「殺傷力強大的遠距離＋大範圍清怪」（普攻、奧義百連發不動）。
 *           元件（火藥色 ember）：爆炸 boom（火球＋柔光爆＋火星＋碎石＋揚塵＋焦痕＋黑煙）、彈道 tracer、燃燒地帶 burnZone、
 *             大筒 cannon（召喚砲台：木架＋鐵砲身＋銅箍，開砲後座）、砲彈拋物線 shell、火焰噴流 flame、雷鏈 chain、鉛雨 leadRain、火藥桶 barrel。
 *           技：焙烙火矢（扇形 3/5 顆落地連爆，Lv5 燃燒）、早合連射（5/7 發貫穿彈）、霰彈（120° 扇形 12 顆，Lv3 兩波，Lv5 第三波燃燒）、大筒（召喚大砲連轟 3/4 發，Lv5 最後巨爆）。
 *           特技：托擊（擋下後近距霰彈＋爆炸）、火蓋切（立即打出炸裂彈＋下一發必暴）、早合（裝填＋炸裂彈、3 發免裝填）、退き口（後跳＋扇形散擊＋前方燃燒火藥線）。
 *           秘傳：火龍放射、國崩、鉛雨、雷神筒、火車。身法 12 式：子彈命中小爆炸、散彈多 2 顆。
 * 依賴    : 111_katana_fx（G.KF）、77_moves（c.shoot／muzzle／hit）、78_mv_ranged（鐵砲招式）、83_skills／92_lab（鐵砲技、秘傳 _comp）、81_hiden（MV2.ghostAt）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, W = G.WPN, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const KF = () => G.KF, E = fn => G.KF.use('ember', fn), K = y => HH() * S(y), cl = (v, a, b) => v < a ? a : v > b ? b : v, eo3 = t => 1 - Math.pow(1 - t, 3), isT = () => W.curId() === 'teppo';
  const P = () => G.KF.PAL.ember, rgba = (c, a) => 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')';
  let skT = -1e9, pre = 0; const hitT = (c, o) => { skT = G.t; return c.hit(o); }; const LV = c => c.a.mvx.lv || 1, mk = c => { c.a.mvx.hit = 1; MV2.onHit(c.a); };
  const near = (c, r, n) => G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.bb && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < r * c.hh).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, n || 99);
  const ahead = (c, d) => { const e = near(c, d + 1, 1)[0]; return e && (e.x - c.x) * c.f > 0 ? [e.x, e.y] : [c.x + c.f * d * c.hh, c.y]; };
  /* ---------- 素材片段播放（頭目素材包的 act／fx 都能用；loop 循環；開機不載，用到才載） ---------- */
  const A = G.ANIM, TK = 1000 / 60, asked = {};
  const pk = k => { const u = A.get(k); if (!u && !asked[k]) { asked[k] = 1; try { const q = A.load(k); if (q && q.catch) q.catch(() => { asked[k] = 0; }); } catch (x) { asked[k] = 0; } } return u; };
  const mw = r => r._mw || (r._mw = Math.max(...r.f.map(f => f[2])));
  /* o：u 素材包、n 片段、x y 地面、z 高度（H）、w 寬（H）、flip、rot、sy、add、a、l 圖層、life 格、loop、spd、fx() 跟隨位置 */
  function clip(o) { const u0 = pk(o.u); if (!u0) return null; const r = (u0.act && u0.act[o.n]) || (u0.fx && u0.fx[o.n]); if (!r) return null; const D = A.dur(r), life = o.life || Math.max(6, Math.round(D / TK));
    return VX.custom((q, ctx) => { const u = A.get(o.u); if (!u) return; const p = o.fx ? o.fx() : [o.x, o.y], k = K(p[1]), fr = o.loop ? A.frameAt(r, (q.t * TK * (o.spd || 1)) % D, D) : A.frameAt(r, Math.min(q.t, life - 1) * TK, life * TK), sc = (o.w || 1) * k / mw(r);
      const a = (o.a === undefined ? 1 : o.a) * Math.min(1, q.t / 3 + 0.34, (q.life - q.t) / Math.max(1, q.life * 0.25)); ctx.save(); if (o.add) ctx.globalCompositeOperation = 'lighter';
      ctx.translate(p[0], p[1] - (o.z || 0) * k); if (o.rot) ctx.rotate(o.rot); if (o.sy) ctx.scale(1, o.sy); A.draw(u, fr, 0, 0, sc, !!o.flip, a); ctx.restore(); }, life + (o.hold || 0), o.l || 'o', o.step ? { step: o.step } : undefined); }
  const smoke = (x, y, n, r, a) => VX.smoke({ x, y, z: 0.25 * K(y), n, r: r || 0.2, life: 50, a: a || 0.4, col: '70,62,58' });
  /* ---------- 爆炸：素材火球 fx_blast＋地裂 fx_crack_glow＋煙 fx_smoke＋碎石 fx_debris；柔光與火星補色；m 有值才判定 ---------- */
  function boom(c, x, y, R, m, lv, o) { o = o || {};
    VX.s2('fx_blast', { x, y, k: Math.min(1.7, R * 0.75), life: 30 }); if (R >= 1.1) VX.s2(R >= 2 ? 'fx_crack_glow_l' : 'fx_crack_glow_m', { x, y, k: R * 0.8, sy: 0.55, l: 'g', life: 60 });
    VX.s2('fx_smoke', { x: x + rnd(-0.2, 0.2) * K(y), y, z: 0.2 * K(y), k: R * 0.75, life: 54, a: 0.8 }); if (R >= 1) VX.s2('fx_debris', { x, y, k: 0.5 + R * 0.2, life: 30 });
    E(() => { KF().light(x, y, R * 1.3, 20, 0.5, 0.5); KF().embers(x, y, 0.3, 3 + Math.round(R * 3), { sp: 0.9 + R * 0.3 }); });
    SC.shake = Math.max(SC.shake || 0, Math.min(12, 2 + R * 3));
    if (m) return hitT(c, { shape: 'circle', x, y, r: R, m, lv: lv || 'heavy', kind: 'blunt', kb: o.kb !== undefined ? o.kb : 1, ign: o.ign }); return []; }
  /* ---------- 燃燒地帶：地面火帶（刑部姬 fire_field）＋散落火堆（鬼王 fire），每 15 格判定 ---------- */
  function burnZone(c, x, y, R, frames, m) { const k = K(y), n = 1 + Math.round(R * 1.5);
    clip({ u: 'b_osakabe', n: 'osakabe_fire_field', x, y: y + 0.02 * k, w: R * 2.1, sy: 0.75, loop: 1, l: 'g', life: frames, a: 0.95 });
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R * 0.75; clip({ u: 'b_oni', n: 'oniking_fire', x: x + Math.cos(a) * r * k, y: y + Math.sin(a) * r * 0.4 * k, w: rnd(0.38, 0.55), loop: 1, spd: rnd(0.8, 1.2), life: frames - rnd(0, 20) | 0, a: 0.95 }); }
    VX.custom(() => {}, frames, 'g', { step: (o, tt) => { if (tt % 15 === 8) hitT(c, { shape: 'circle', x, y, r: R, m, lv: 'light', kind: 'blunt', kb: 0 }); if (tt % 14 === 0) smoke(x + rnd(-R, R) * K(y) * 0.8, y, 1, 0.12, 0.25); } }); }
  /* ---------- 彈道：子彈後方一道短而亮的光（跟著彈頭） ---------- */
  function tracer(p, w) { E(() => KF().add(200, 'o', (ctx) => { if (p.dead) return; const k = K(p.y), d = Math.sign(p.vx) || 1, a = Math.atan2(p.vy || 0, Math.abs(p.vx) || 1) * d, L = k * 0.9, C = P(); ctx.translate(p.x, p.y - p.z); ctx.scale(d, 1); ctx.rotate(d > 0 ? a : -a);
      ctx.globalCompositeOperation = 'screen'; KF().spr(ctx, C.T.gm, -L * 0.4, 0, L * 1.2, k * 0.14 * (w || 1), 0.55); ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, rgba(C.mid, 0)); g.addColorStop(1, rgba(C.lite, 0.95)); ctx.fillStyle = g; const hw = k * 0.022 * (w || 1); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -hw); ctx.quadraticCurveTo(hw * 2, 0, 0, hw); ctx.closePath(); ctx.fill(); },
      (o) => { if (p.dead) o.t = o.life; })); }
  (function sh() { const s0 = VX.shot; VX.shot = function (o) { const p = s0.apply(this, arguments); if (p && isT() && o && !o.enemy && H.act && (o.k === 'bullet' || o.k === 'pellet')) tracer(p, o.k === 'bullet' ? (o.big ? 1.6 : 1) : 0.6); return p; }; })();
  /* ---------- 子彈／散彈 ---------- */
  const bullet = (c, o) => { c.muzzle(!!o.big); return c.shoot('bullet', Object.assign({ spd: 0.85, range: 9, lv: 'mid' }, o)); };
  const pellets = (c, n, spread, o) => { c.muzzle(true); for (let i = 0; i < n; i++) c.shoot('pellet', Object.assign({ m: 0.35, ang: (i - (n - 1) / 2) * (spread / Math.max(1, n - 1)) + rnd(-0.04, 0.04), spd: 0.55, range: 3.6, kb: 0.8, lv: 'mid' }, o)); SC.shake = Math.max(SC.shake || 0, 3); };
  const pierceShot = (c, o) => { const sk = new Set(); return bullet(c, Object.assign({ pierce: 99, onHit: e => { if (sk.has(e)) return; sk.add(e); E(() => KF().burst(e.x, e.y, (e.ratio || 1) * 0.5, 1.4, c.f > 0 ? 0 : Math.PI)); if (o.onEach) o.onEach(e); } }, o)); };
  /* ---------- 大筒：召喚砲台（木架、雙輪、鐵砲身、銅箍），開砲後座 ---------- */
  function drawCannon(ctx, x, y, k, f, rec, a, s) { s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 0.55 * k, 0.1 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3d26'; ctx.beginPath(); ctx.moveTo(-0.5 * k, -0.12 * k); ctx.lineTo(0.3 * k, -0.12 * k); ctx.lineTo(0.18 * k, -0.34 * k); ctx.lineTo(-0.38 * k, -0.3 * k); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2e1f14'; ctx.lineWidth = 1.2; ctx.stroke();
    for (const wx of [-0.3, 0.12]) { ctx.fillStyle = '#4a3220'; ctx.beginPath(); ctx.arc(wx * k, -0.14 * k, 0.15 * k, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.strokeStyle = '#2e1f14'; for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(wx * k - Math.cos(an) * 0.14 * k, -0.14 * k - Math.sin(an) * 0.14 * k); ctx.lineTo(wx * k + Math.cos(an) * 0.14 * k, -0.14 * k + Math.sin(an) * 0.14 * k); ctx.stroke(); } }
    ctx.translate(-rec * k, -0.38 * k); ctx.rotate(-0.14); const g = ctx.createLinearGradient(0, -0.1 * k, 0, 0.1 * k); g.addColorStop(0, '#5c5852'); g.addColorStop(0.45, '#2f2c29'); g.addColorStop(1, '#151311'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-0.5 * k, -0.11 * k); ctx.lineTo(0.62 * k, -0.075 * k); ctx.lineTo(0.62 * k, 0.075 * k); ctx.lineTo(-0.5 * k, 0.11 * k); ctx.quadraticCurveTo(-0.62 * k, 0, -0.5 * k, -0.11 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b08a3e'; for (const bx of [-0.36, 0.05, 0.5]) ctx.fillRect(bx * k, -0.1 * k, 0.05 * k, 0.2 * k); ctx.fillStyle = '#d8b466'; ctx.fillRect(0.6 * k, -0.09 * k, 0.04 * k, 0.18 * k); ctx.restore(); }
  /* o = x,y,f,shots:[{d,tx,ty,R,m,lv}],gap,first,life,s；回傳 shots 開火時間 */
  function cannon(c, o) { const s = o.s || 1, st = { rec: 0 }, x = o.x, y = o.y, f = o.f, life = o.first + o.shots.length * o.gap + 26;
    VX.s2('fx_smoke', { x, y, z: 0.1 * K(y), k: 0.9 * s, life: 40, a: 0.7 });
    VX.custom((q, ctx) => { const k = K(y), a = Math.min(1, q.t / 5, (q.life - q.t) / 10); st.rec *= 0.82; if (!VX.draw2(ctx, 'war_cannon', 0, x - f * st.rec * s * k, y, 1.05 * s, { a, flip: f < 0 })) drawCannon(ctx, x, y, k, f, st.rec * s, a, s); }, life, 'o');   // 合戰大筒素材
    o.shots.forEach((sh, i) => c.later(o.first + i * o.gap, () => { const k = K(y), mx = x + f * 0.66 * s * k, my = y - 0.4 * s * k; st.rec = 0.16;
      if (!VX.muzzle2 || VX.muzzle2(mx, y, 0.4 * s, f, true, -0.12) === false) E(() => KF().glint(mx, y, (y - my) / k, 0.5 * s, 10)); VX.s2('fx_smoke', { x: mx + f * 0.3 * k, y, z: 0.35 * s * k, k: 0.8 * s, life: 44, a: 0.8 }); SC.shake = Math.max(SC.shake || 0, 4 * s);
      shell(c, mx, my, sh.tx, sh.ty, 12 + Math.round(Math.abs(sh.tx - mx) / k), () => boom(c, sh.tx, sh.ty, sh.R, sh.m, sh.lv || 'heavy', { kb: 1.2 })); })); }
  /* 砲彈：拋物線飛向落點，後拖火光 */
  function shell(c, x0, y0, tx, ty, T, on) { VX.custom((q, ctx) => { const u = Math.min(1, q.t / T), k = K(ty), x = x0 + (tx - x0) * u, yl = y0 + (ty - y0) * u - Math.sin(u * Math.PI) * 1.3 * k, C = P(); if (u >= 1) return; ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 1; i <= 5; i++) { const v = Math.max(0, u - i * 0.03), px = x0 + (tx - x0) * v, py = y0 + (ty - y0) * v - Math.sin(v * Math.PI) * 1.3 * k; KF().spr(ctx, C.T.gm, px, py, k * (0.28 - i * 0.04), k * (0.28 - i * 0.04), 0.55 - i * 0.09); }
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#1e1b18'; ctx.beginPath(); ctx.arc(x, yl, 0.075 * k, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,.6)'; ctx.beginPath(); ctx.arc(x - 0.02 * k, yl - 0.02 * k, 0.025 * k, 0, TAU); ctx.fill(); ctx.restore(); }, T + 1, 'o');
    c.later(T, on); }
  /* ---------- 焙烙：拋物線丟出、落地爆炸 ---------- */
  function lob(c, tx, ty, T, R, m, burn) { const mz = W.muzzle && W.muzzle(), x0 = mz ? mz[0] : c.x + c.f * 0.5 * c.hh, y0 = mz ? mz[1] : c.y - 0.6 * c.hh;
    VX.custom((q, ctx) => { const u = Math.min(1, q.t / T), k = K(ty), x = x0 + (tx - x0) * u, y = y0 + (ty - y0) * u - Math.sin(u * Math.PI) * 1.4 * k; if (u >= 1) return; if (!VX.draw2(ctx, 'fx_bomb', Math.floor(q.t / 3) % 3, x, y + 0.1 * k, 0.55, { rot: u * 6 })) { ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(x, y, 0.08 * k, 0, TAU); ctx.fill(); } }, T + 1, 'o');   // 焙烙玉素材
    c.later(T, () => { boom(c, tx, ty, R, m, 'heavy'); if (burn) burnZone(c, tx, ty, R * 0.8, 180, 0.15); }); }
  /* ---------- 火焰噴流：從槍口往前的火焰，越遠越大、越暗 ---------- */
  function flame(c, frames, L, spread, m) { const a0 = c.a, mzp = () => { const mz = W.muzzle && W.muzzle(), k = K(H.y); return mz ? [mz[0], H.y, (H.y - mz[1]) / k] : [H.x + H.face * 0.9 * k, H.y, 0.6]; };   // 酒吞童子烈焰素材，每 6 格接一段，跟著槍口
    VX.custom(() => {}, frames, 'o', { step: (o, tt) => { if (H.act !== a0) { o.t = o.life; return; } const f = H.face, k = K(H.y);
        if (tt % 6 === 0) clip({ u: 'b_shuten', n: 'shuten_inferno', fx: () => { const p = mzp(); return [p[0] + f * L * 0.45 * k, p[1]]; }, z: mzp()[2] - 0.05, w: L * 0.95, flip: f < 0, life: 14, a: 0.95 });
        if (tt % 6 === 0) { hitT(c, { shape: 'sector', r: L, arc: spread * 2.4, m, lv: 'light', kind: 'blunt', kb: 0.2 }); if (tt % 12 === 0) smoke(H.x + f * L * 0.8 * k, H.y, 1, 0.2, 0.3); } } }); }
  /* ---------- 雷鏈：雷光由命中者跳到附近敵人 ---------- */
  function chain(c, e0, n, m, depth) { const seen = new Set([e0]); let front = [e0];
    for (let d = 0; d < depth; d++) c.later(4 + d * 6, () => { const nx = []; for (const a of front) { const ns = G.E.filter(q => q.st !== 'dead' && q.hp > 0 && !seen.has(q) && Math.hypot(q.x - a.x, (q.y - a.y) * 1.6) < 2.6 * c.hh).slice(0, n);
        for (const b of ns) { seen.add(b); nx.push(b); const ka = K(a.y), kb = K(b.y); KF().use('moon', () => { KF().bolt(a.x, a.y - (a.ratio || 1) * 0.55 * ka, b.x, b.y - (b.ratio || 1) * 0.55 * kb, 12, 3, 1); KF().glint(b.x, b.y, (b.ratio || 1) * 0.55, 0.35, 10); }); G.damageOni(b, m * c.mul, false, false); VX.impact(b, 'mid', 'shot'); c.a.mvx && (c.a.mvx.hit = 1); } } front = nx; }); }
  /* ---------- 鉛雨：落點範圍內子彈從天落下，地面揚塵；每 10 格判定 ---------- */
  function leadRain(c, px, py, R, frames, m) { const D = [];
    E(() => KF().add(frames + 20, 'o', (ctx) => { const C = P(); for (const d of D) { if (d.z <= 0) continue; const k = K(d.y), L = 0.5 * k, g = ctx.createLinearGradient(d.x, d.y - d.z * k - L, d.x, d.y - d.z * k); g.addColorStop(0, rgba(C.mid, 0)); g.addColorStop(1, rgba(C.lite, 0.95)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(d.x - 0.012 * k, d.y - d.z * k - L); ctx.lineTo(d.x + 0.012 * k, d.y - d.z * k - L); ctx.lineTo(d.x, d.y - d.z * k + 0.03 * k); ctx.closePath(); ctx.fill(); } },
      (o, tt) => { if (tt < frames) for (let i = 0; i < 3; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * R; D.push({ x: px + Math.cos(a) * r * c.hh, y: py + Math.sin(a) * r * 0.4 * c.hh, z: rnd(3.5, 4.5) }); }
        for (const d of D) { if (d.z <= 0) continue; d.z -= 0.45; if (d.z <= 0 && Math.random() < 0.5) E(() => { KF().motes(d.x, d.y, 0.05, 1, { sp: 0.7, life: 12, up: 0.2 }); if (Math.random() < 0.3) KF().embers(d.x, d.y, 0.05, 1, { sp: 0.5, life: 14 }); }); }
        while (D.length && D[0].z <= 0) D.shift(); if (tt < frames && tt % 10 === 5) hitT(c, { shape: 'circle', x: px, y: py, r: R, m, lv: 'light', kind: 'shot', kb: 0 }); })); }
  /* ---------- 火車：點燃的火藥桶滾出，沿路小爆、盡頭大爆 ---------- */
  function barrel(c, ang, dist, T, R, m) { pk('b_shuten'); const x0 = c.x + c.f * 0.5 * c.hh, y0 = c.y, f = c.f, sk = [];
    VX.custom((q, ctx) => { const u = Math.min(1, q.t / T), k = K(y0), d = dist * k * u, x = x0 + f * Math.cos(ang) * d, y = y0 + Math.sin(ang) * d * 0.5, roll = d / (0.16 * k); if (u >= 1) return; const bu = A.get('b_shuten'), br = bu && bu.act && bu.act.shuten_barrel; if (br) { const fr = br.f[0]; ctx.save(); ctx.translate(x, y - 0.2 * k); ctx.rotate(roll * 0.35 * f); ctx.translate(0, fr[5] * 0.45 * k / mw(br) * 0); A.draw(bu, fr, 0, 0.2 * k, 0.45 * k / mw(br), f < 0, 1); ctx.restore(); E(() => KF().spr(ctx, P().T.gl, x, y - 0.42 * k, k * 0.16, k * 0.16, 0.7 + 0.3 * Math.random())); return; }   // 酒吞童子酒桶素材
      ctx.save(); ctx.translate(x, y - 0.16 * k);
      const bw = 0.22 * k, bh = 0.15 * k; ctx.beginPath(); ctx.moveTo(-bw, -bh * 0.8); ctx.quadraticCurveTo(0, -bh * 1.15, bw, -bh * 0.8); ctx.lineTo(bw, bh * 0.8); ctx.quadraticCurveTo(0, bh * 1.15, -bw, bh * 0.8); ctx.closePath();   // 橫躺的木桶：側面＋滾動時橫箍往下捲
      const g = ctx.createLinearGradient(0, -bh, 0, bh); g.addColorStop(0, '#8a6440'); g.addColorStop(0.5, '#6a4a2c'); g.addColorStop(1, '#3e2a18'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#2e1f14'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.save(); ctx.clip(); ctx.fillStyle = '#3a3632';
      for (let i = 0; i < 3; i++) { const v = ((roll * 0.25 + i / 3) % 1), yy = -bh + v * bh * 2; ctx.fillRect(-bw, yy - bh * 0.09, bw * 2, bh * 0.18); } ctx.restore();
      ctx.restore(); E(() => KF().spr(ctx, P().T.gl, x, y - 0.36 * k, k * 0.16, k * 0.16, 0.7 + 0.3 * Math.random())); }, T + 1, 'o',
      { step: (q, tt) => { if (tt > T) return; const k = K(y0), d = dist * k * Math.min(1, tt / T), x = x0 + f * Math.cos(ang) * d, y = y0 + Math.sin(ang) * d * 0.5; if (tt % 3 === 0) { E(() => KF().embers(x, y, 0.3, 1, { sp: 0.4 })); smoke(x, y, 1, 0.1, 0.25); }
          if (tt % 5 === 0) hitT(c, { shape: 'circle', x, y, r: 0.55, m: m * 0.2, lv: 'light', kind: 'blunt', kb: 0.4, skip: sk }).forEach(e => sk.push(e)); } });
    c.later(T, () => { const k = K(y0), x = x0 + f * Math.cos(ang) * dist * k, y = y0 + Math.sin(ang) * dist * k * 0.5; boom(c, x, y, R, m, 'hiden'); burnZone(c, x, y, R * 0.7, 120, 0.12); }); }
  /* 前方燃燒火藥線 */
  function powderLine(c, len, frames, m) { const x0 = c.x + c.f * 0.5 * c.hh, y0 = c.y, f = c.f;   // 火藥線：地面火帶一段段往前點燃
    for (let i = 0; i < 3; i++) c.later(i * 4, () => clip({ u: 'b_osakabe', n: 'osakabe_fire_field', x: x0 + f * (i + 0.5) * len / 3 * c.hh, y: y0, w: len / 3 * 1.25, sy: 0.7, loop: 1, l: 'g', life: frames - i * 4, flip: i % 2 === 1 }));
    VX.custom(() => {}, frames, 'g', { step: (o, tt) => { if (tt % 15 === 8) hitT(c, { shape: 'line', x: x0, y: y0, len, w: 0.35, m: m / 2, lv: 'light', kind: 'blunt', kb: 0 }); } }); }
  /* ==================== 技・特技 ==================== */
  const RL = c => Math.max(6, Math.round(c.a.T * 0.35));
  const DU = {
    skill_horoku: { n: '焙烙火矢', run(c, t) { const lv = LV(c), n = lv >= 3 ? 5 : 3; if (t !== RL(c)) return; const [px, py] = ahead(c, 3.2);
        for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2), tx = px + c.f * Math.abs(off) * -0.25 * c.hh + rnd(-0.1, 0.1) * c.hh, ty = py + off * 0.45 * c.hh; c.later(i * 2, () => lob(c, tx, ty, 14, 1.25, 1.4, lv >= 5)); } } },
    skill_rensha: { n: '早合連射', run(c, t) { const lv = LV(c), n = lv >= 3 ? 7 : 5, a = RL(c); c.a.T = Math.max(c.a.T, a + n * 4 + 10);
        for (let i = 0; i < n; i++) if (t === a + i * 4) { const last = i === n - 1; pierceShot(c, { m: 0.7, ang: rnd(-0.025, 0.025), spd: 1.1, range: 10, lv: last ? 'heavy' : 'mid', big: last, kb: last && lv >= 5 ? 1.5 : 0.2 }); if (i % 2 === 0) smoke(c.x + c.f * 0.9 * c.hh, c.y, 1, 0.12, 0.3); } } },
    skill_sandan: { n: '霰彈', run(c, t) { const lv = LV(c), a = RL(c), waves = lv >= 5 ? 3 : lv >= 3 ? 2 : 1; c.a.T = Math.max(c.a.T, a + waves * 10 + 10);
        const bs = c.a.mvx.bs = c.a.mvx.bs || new Set(); for (let w = 0; w < waves; w++) if (t === a + w * 10) { pellets(c, 12, 2.1, { m: 0.38, range: 4, kb: 1, onHit: w === 2 ? (e => { if (bs.has(e) || bs.size >= 4) return; bs.add(e); burnZone(c, e.x, e.y, 0.6, 90, 0.08); }) : undefined }); c.move(-0.12, 0); E(() => KF().burst(c.x + c.f * 1.0 * c.hh, c.y, 0.6, 2.2, c.f > 0 ? 0 : Math.PI)); } } },
    skill_sogeki: { n: '大筒', run(c, t) { const lv = LV(c), n = lv >= 3 ? 4 : 3; c.a.T = Math.max(c.a.T, 26 + n * 14);   // 身後召喚大砲，朝敵群連轟
        if (t === 4) { const es = near(c, 9, n), shots = []; for (let i = 0; i < n; i++) { const e = es[i % Math.max(1, es.length)], last = lv >= 5 && i === n - 1; const [tx, ty] = e ? [e.x + rnd(-0.2, 0.2) * c.hh, e.y] : [c.x + c.f * (3 + i * 0.8) * c.hh, c.y + rnd(-0.4, 0.4) * c.hh]; shots.push({ tx, ty, R: last ? 2.4 : 1.5, m: last ? 3.0 : 1.6, lv: last ? 'hiden' : 'heavy' }); }
          cannon(c, { x: c.x - c.f * 0.9 * c.hh, y: c.y + 0.15 * c.hh, f: c.f, shots, gap: 14, first: 10 }); } } },
    special_guardshot: { n: '托擊', counter(c, e) { mk(c); pellets(c, 10, 1.6, { m: 0.5, range: 3.4, kb: 1.4 }); c.later(4, () => { const [x, y] = [c.x + c.f * 1.2 * c.hh, c.y]; boom(c, x, y, 1.1, 1.2); }); } },
    special_precision: { n: '火蓋切', run(c, t) { const lv = LV(c); if (t === 2) { G.BUFF.add('nextCrit', lv >= 3 ? 80 : 50, 300); E(() => KF().charge(c.x + c.f * 0.9 * c.hh, c.y, 0.6, 10, 12)); }
        if (t === 12) { mk(c); bullet(c, { m: 1.4, spd: 1.0, range: 9, lv: 'heavy', big: 1, onHit: e => { boom(c, e.x, e.y, 1.5, 1.4); return false; }, onEnd: q => boom(c, q.x, q.y, 1.5, 1.4) }); } } },
    special_reloadshot: { n: '早合', run(c, t) { if (t === 3) E(() => KF().embers(c.x + c.f * 0.5 * c.hh, c.y, 0.6, 4, { sp: 0.5 }));
        if (t === 10) { H.loaded = 3; mk(c); bullet(c, { m: 1.0, spd: 1.0, range: 8, lv: 'mid', onHit: e => { boom(c, e.x, e.y, 1.2, 1.0); return false; }, onEnd: q => boom(c, q.x, q.y, 1.2, 1.0) }); } } },
    special_scatterback: { n: '退き口', run(c, t) { const lv = LV(c); if (t <= 10) { c.move(-0.13, 0); H.hop = Math.sin(t / 10 * Math.PI) * 0.25 * c.hh; if (lv >= 5) c.inv(4); } if (t === 11) H.hop = 0;
        if (t === 6) { pellets(c, 7 + (lv >= 3 ? 2 : 0), 1.5, { m: 0.45, range: 3.6, kb: 1.2 }); powderLine(c, 3, 150, 0.4); } } }
  };
  /* ==================== 秘傳（92 組合動作 _comp 的三段時間） ==================== */
  const HT = {
    t_karyu: { n: '火龍放射', f(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r1) pierceShot(c, { m: 0.5 }); if (t === r2) pellets(c, 9, 1.4, { m: 0.3, range: 3.2 });
      if (t === r3) { flame(c, 60, 4.2, 0.36, 0.35); c.a.T = Math.max(c.a.T, r3 + 66); } } },
    t_sandan: { n: '國崩', f(c, t, C) { const [r1, r2, r3] = C.rel, k = c.hh;
      if (t === r1 || t === r2) pierceShot(c, { m: 0.6 });
      if (t === r3) { const [tx, ty] = ahead(c, 5); cannon(c, { x: c.x - c.f * 1.1 * k, y: c.y + 0.2 * k, f: c.f, s: 1.6, first: 12, gap: 0, shots: [{ tx, ty, R: 3.0, m: 3.0, lv: 'hiden' }] });
        c.later(12 + 14 + Math.round(Math.abs(tx - c.x) / k), () => { burnZone(c, tx, ty, 2.0, 180, 0.2); E(() => KF().sweepDust(tx, ty, 1, 2.6, 0, TAU, 10, 1.4)); }); c.a.T = Math.max(c.a.T, r3 + 50); } } },
    t_namari: { n: '鉛雨', f(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r1) E(() => KF().embers(c.x + c.f * 0.5 * c.hh, c.y, 0.6, 4)); if (t === r2) pellets(c, 9, 1.4, { m: 0.3, range: 3.2 });
      if (t === r3) { c.muzzle(true, -1.2); for (let i = 0; i < 5; i++) c.later(i, () => E(() => KF().qi({ x: c.x + c.f * (0.7 + i * 0.08) * c.hh, y: c.y, z: 1.6 + i * 0.2, ang: -1.45 + rnd(-0.08, 0.08), len: 1.4, w: 0.05, dur: 2, life: 8, motes: 1 }))); smoke(c.x, c.y, 4, 0.25, 0.5); const [px, py] = ahead(c, 3.5); c.later(10, () => leadRain(c, px, py, 2.6, 90, 0.3)); c.a.T = Math.max(c.a.T, r3 + 30); } } },
    t_raitou: { n: '雷神筒', f(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r1) E(() => KF().charge(c.x + c.f * 0.9 * c.hh, c.y, 0.6, Math.max(6, r3 - r1), 16));
      if (t === r3) { const x0 = c.x + c.f * 0.9 * c.hh, z = 0.6 * c.hh; KF().use('moon', () => KF().bolt(x0, c.y - z, c.x + c.f * 8 * c.hh, c.y - z, 14, 5, 3)); SC.shake = Math.max(SC.shake || 0, 6);
        const hs = hitT(c, { shape: 'line', len: 8, w: 0.55, m: 2.0, lv: 'hiden', kind: 'shot' }); hs.forEach(e => chain(c, e, 3, 0.8, 2)); } } },
    t_horoku: { n: '火車', f(c, t, C) { const [r1, r2, r3] = C.rel;
      if (t === r2) pellets(c, 9, 1.4, { m: 0.3, range: 3.2 });
      if (t === r3) { [-0.38, 0, 0.38].forEach((a, i) => c.later(i * 3, () => barrel(c, a, 4.5, 28, 1.6, 1.8))); c.a.T = Math.max(c.a.T, r3 + 40); } } }
  };
  /* ==================== 身法：子彈命中小爆、散彈多 2 顆 ==================== */
  function mvWrap(base) { const f = function (c, t) { const sh = c.shoot; c.shoot = function (k, o) { o = Object.assign({}, o);
      if (k === 'bullet' && o.m) { const h0 = o.onHit, sk = new Set(); o.onHit = e => { const r = h0 ? h0(e) : undefined; if (!sk.has(e)) { sk.add(e); boom(c, e.x, e.y, 0.8, 0.35, 'mid', { kb: 0.3 }); } return r; }; }
      if (k === 'pellet' && !o.__x && Math.abs(o.ang || 0) > 0.3) { const s = Math.sign(o.ang); sh.call(c, k, Object.assign({}, o, { ang: o.ang + s * 0.17, __x: 1 })); }
      return sh.call(c, k, o); }; try { return base.apply(this, arguments); } finally { c.shoot = sh; } }; f.__tp = 1; return f; }
  /* ---------- 名稱 ---------- */
  const SKN = { skill_horoku: ['焙烙火矢', '扇形拋出焙烙，落地連爆', '3 → 5 顆', '爆炸後燃燒 3 秒'], skill_rensha: ['早合連射', '快速連發貫穿彈，每發打穿一列', '5 → 7 發', '最後一發擊退'],
    skill_sandan: ['霰彈', '前方 120° 扇形 12 顆鉛彈', '兩波', '第三波燃燒'], skill_sogeki: ['大筒', '身後召喚大砲朝敵群連轟', '3 → 4 發', '最後一發巨爆'],
    special_guardshot: ['托擊', '以槍托擋下，近距霰彈反擊', '擋下時回 10 氣力', '反擊附帶爆炸'], special_precision: ['火蓋切', '立即打出炸裂彈，下一發暴擊率上升', '+50% → +80%', '暴擊傷害 +50%'],
    special_reloadshot: ['早合', '裝填時打出炸裂彈，之後 3 發免裝填', '裝填時間 −30%', '炸裂範圍加大'], special_scatterback: ['退き口', '後跳扇形散擊，前方留下燃燒火藥線', '散彈 +2', '後撤無敵'] };
  let named = 0;
  function rename() { const L = W.LIST && W.LIST.find(w => w.id === 'teppo'); if (!L) return; for (const s of L.sk) { const v = SKN[s.id]; if (v) { s.n = v[0]; s.d = v[1]; s.d3 = v[2]; s.d5 = v[3]; } } named = 1; }
  /* ---------- 掛上（92 會重建定義：每格對照，必要時補回） ---------- */
  const WRH = {};
  function patch() { const D = MV2.D.teppo, U = MV2.U.teppo, HD = MV2.HD && MV2.HD.teppo; if (!U) return;
    for (const k in DU) { const d = U[k], s = DU[k]; if (!d) continue; if (s.run && d.run !== s.run) d.run = s.run; if (s.counter && d.counter !== s.counter) d.counter = s.counter; if (d.n !== s.n) d.n = s.n; }
    if (D) for (const k in D) { const d = D[k]; if (d && d.run && !d.run.__tp) d.run = mvWrap(d.run); if (d && d.counter && !d.counter.__tp) d.counter = mvWrap(d.counter); }
    if (HD) for (const h of HD) { const s = HT[h.id]; if (!s) continue; if (h.n !== s.n) h.n = s.n; if (h.run === WRH[h.id]) continue; const base = h.run;
      WRH[h.id] = h.run = function (c, t) { if (t === 1) { base.call(this, c, 1); return; } const C = c.a._comp; if (C && C.rel) s.f(c, t, C); else base.call(this, c, t); }; }
    if (!named) rename(); }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); if (H.act && H.act.mvx && isT()) skT = G.t; if (isT() && !pre) { pre = 1; ['b_oni', 'b_osakabe', 'b_shuten'].forEach(pk); VX.x2 && VX.x2('x2_war'); } try { patch(); } catch (x) { console.warn('kf teppo', x); } };
  /* 命中：鐵砲改火藥色小火光＋火星（取代舊的星形命中圖） */
  const HT2 = { light: [1, 0], mid: [2, 1], heavy: [4, 3], hiden: [6, 5] };
  const im0 = VX.impact; VX.impact = function (e, lv, kind) { const A = H.act; if (A && A.mvx) skT = G.t; if (!isT() || !e || (!(A && A.mvx) && G.t - skT > 240) || (kind !== 'blunt' && kind !== 'shot' && kind !== 'pierce' && kind !== 'cut')) return im0.apply(this, arguments);
    const F = HT2[lv] || HT2.mid, k = K(e.y), z = (e.ratio || 1) * 0.5; G.hitstop = Math.max(G.hitstop || 0, F[0]); SC.shake = Math.max(SC.shake || 0, F[1]); e.flash = (e._vxf && G.playT - e._vxf < 8) ? 1 : 2; e._vxf = G.playT;
    E(() => { const C = P(); KF().add(10, 'o', (ctx, u, q) => { ctx.globalCompositeOperation = 'screen'; const r = k * (0.18 + (lv === 'heavy' || lv === 'hiden' ? 0.14 : 0)) * (0.7 + 0.6 * q); KF().spr(ctx, C.T.gm, e.x, e.y - z * k, r * 2.2, r * 2, 0.8 * (1 - q)); KF().spr(ctx, C.T.gl, e.x, e.y - z * k, r, r, 1 - q); }); KF().embers(e.x, e.y, z, lv === 'light' ? 1 : 3, { sp: 0.8, life: 20 }); }); };
  G.KF && (G.KF.boom = boom, G.KF.clip = clip);
  /* 燃燒狀態：拿掉身上火苗與橘色橢圓，只留少量上飄火星（88_rune 與茨木灼燒共用 G.FLAMES） */
  G.FLAMES = (e) => { if ((G.t + (e._fsd || (e._fsd = Math.random() * 12 | 0))) % 12 === 0) E(() => KF().embers(e.x, e.y, (e.ratio || 1) * 0.45, 1, { sp: 0.35, life: 24, rx: 0.15 * (e.ratio || 1) })); };
})();
