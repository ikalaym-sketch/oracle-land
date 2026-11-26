/* ==========================================================================
 * 神諭之地 重製版 — 86_fx2.js
 * Version : r3.37.0  (2026-11-17)
 * 變更    : r3.37.0 新增。第二代手繪特效素材（ChatGPT 交付 1～87 號，tools/build_fx2.py 轉成圖集）接入。
 *           ・圖集：x2_core（武器打擊類，開機載入）、x2_boss（預警、大蛇吐息）、x2_ling（靈紋、式神）、x2_ui（圖示、家紋）、x2_obj（調查點物件）、x2_war（合戰）。
 *             圖集內 1H＝pph 像素（160），錨點已依素材索引對好（地面物件＝腳底、箭＝箭尖、槍口火焰＝槍口、法陣＝圓心）。
 *           ・VX.s2(名稱, o)：畫第二代素材；o＝{x,y,z(H),k(倍率),rot,flip,add,life,a,l,sy,loop,hold,fx(跟隨)}。
 *           ・本批取代：地裂（含發光層）、碎石（會拋出彈跳）、塵環、箭、槍口火焰、硝煙、爆炸、命中閃光、法陣、光柱、焙烙玉、燃燒地面、標記準星。
 *             舊的臨時素材（白丸塵環／地裂、金棒土塊、鐵砲槍火、茨木火爆）呼叫一律轉到新圖。
 * 依賴    : 12_anim（G.ANIM）、76_vfx（VX.custom 等）、77_moves、84_fxkit（VX.spr，本檔包一層對照表）。
 * ========================================================================== */
'use strict';
(function () {
  const VX = G.VX, A = G.ANIM, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), TK = 1000 / 60, TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a); if (!VX) return;
  const asked = {}, need = k => { const u = A.get(k); if (!u && !asked[k]) { asked[k] = 1; A.load(k).catch(() => { asked[k] = 0; }); } return u; };
  (function w() { if (!A.IDX) return setTimeout(w, 100); need('x2_core'); })();
  VX.x2 = need;
  const rec = (k, n) => { const u = need(k); return u && u.fx && u.fx[n] ? [u, u.fx[n]] : null; };
  const which = n => /^(boss_|fx_warn|fx_ally)/.test(n) ? 'x2_boss' : /^(fx_magatama|fx_yomi|fx_hikagami|shiki_|fx_ice_shell)/.test(n) ? 'x2_ling' : /^(fx_ico_|ico_|kamon)/.test(n) ? 'x2_ui' : /^obj_/.test(n) ? 'x2_obj' : /^war_/.test(n) ? 'x2_war' : 'x2_core';
  /* 畫一格：sc＝(畫面 1H 像素 × k) ÷ pph */
  VX.draw2 = (ctx, n, fi, x, y, k, o) => { const r = rec(o && o.u || which(n), n); if (!r) return false; const [u, R] = r, fr = R.f[Math.min(R.f.length - 1, fi)], sc = HH() * S(o && o.sy0 !== undefined ? o.sy0 : y) * (k || 1) / (u.pph || 160);
    ctx.save(); if (o && o.add) ctx.globalCompositeOperation = 'lighter'; if (o && o.a !== undefined) ctx.globalAlpha *= o.a; ctx.translate(x, y); if (o && o.rot) ctx.rotate(o.rot); if (o && o.flip) ctx.scale(-1, 1); if (o && o.sy) ctx.scale(1, o.sy);
    ctx.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], -fr[4] * sc, -fr[5] * sc, fr[2] * sc, fr[3] * sc); ctx.restore(); return true; };
  VX.frames2 = n => { const r = rec(which(n), n); return r ? r[1].f.length : 0; };
  VX.s2 = (n, o) => { o = o || {}; const nf = VX.frames2(n); if (!nf) return null; const life = o.life || Math.max(8, nf * 4), fi0 = o.fi;
    return VX.custom((q, ctx) => { const p = o.fx ? o.fx() : [o.x, o.y], s = S(p[1]), k = HH() * s, fi = fi0 !== undefined ? fi0 : o.loop ? Math.floor(q.t / (o.loop)) % nf : Math.min(nf - 1, Math.floor(q.t / life * nf)),
        fade = o.hold ? Math.min(1, (q.life - q.t) / 12) : (o.loop ? Math.min(1, q.t / 6, (q.life - q.t) / 10) : 1);
      VX.draw2(ctx, n, fi, p[0], p[1] - (o.z || 0) * k, o.k, { add: o.add, a: (o.a === undefined ? 1 : o.a) * fade, rot: o.rot, flip: o.flip, sy: o.sy, sy0: p[1] }); }, life + (o.hold || 0), o.l || 'o', o.step ? { step: o.step } : undefined); };
  /* ---------- 碎石：拋出、旋轉、落地彈一下 ---------- */
  VX.debris2 = o => { const n = o.n || 6, s0 = S(o.y);
    for (let i = 0; i < n; i++) { const fi = Math.floor(Math.random() * 6), vx = rnd(-1, 1) * (o.spd || 1) * HH() * s0 * 0.05, vy = rnd(-0.3, 0.3) * HH() * s0 * 0.02, vz0 = rnd(0.06, 0.12) * HH() * s0 * (o.up || 1), rs = rnd(-0.3, 0.3), k = rnd(0.7, 1.3) * (o.k || 1);
      let x = o.x, y = o.y, z = (o.z || 0.05) * HH() * s0, vz = vz0, rot = rnd(0, TAU), b = 0;
      VX.custom((q, ctx) => { VX.draw2(ctx, 'fx_debris', fi, x, y - z, k, { rot, a: Math.min(1, (q.life - q.t) / 12) }); }, 56, 'o',
        { step: () => { x += vx * (b ? 0.4 : 1); y += vy; z += vz; vz -= HH() * s0 * 0.008; rot += rs * (b ? 0.3 : 1); if (z < 0) { z = 0; if (b < 1 && vz < -1) { vz = -vz * 0.3; b++; } else vz = 0; } } }); } };
  /* ---------- 地裂（取代 84 的白丸塵環＋地裂） ---------- */
  const fiery = col => !!col && /^255,(1[0-9]{2}|2[0-2][0-9]|[0-9]{1,2}),/.test(col);
  VX.crack = o => { const r = o.r || 1.2, x = o.x, y = o.y, v = r < 0.9 ? 's' : r < 1.4 ? 'm' : 'l', base = { s: 1.2, m: 2, l: 3 }[v], k = r * 2.2 / base, ang = o.dir || 0;
    if (!VX.frames2('fx_crack_' + v)) return VX.crack0 && VX.crack0(o);
    VX.s2('fx_crack_' + v, { x, y, k, l: 'g', life: 50, hold: 30, flip: Math.random() < 0.5 });
    if (o.glow || fiery(o.col)) VX.s2('fx_crack_glow_' + v, { x, y, k, l: 'g', add: 1, life: 40, a: 0.9 });
    VX.s2('fx_dust', { x, y, k: r * 0.75, l: 'g', life: 26, a: 0.8 });
    VX.debris2({ x, y, n: Math.round(3 + r * 3), spd: r, k: Math.min(1.6, 0.7 + r * 0.4) }); };
  /* ---------- 法陣、光柱、準星、燃燒地面 ---------- */
  VX.sigil = o => VX.s2(o.kind === 'onmyo' ? 'fx_sigil_onmyo' : o.kind === 'raiden' ? 'fx_sigil_raiden' : 'fx_sigil_shrine', { x: o.x, y: o.y, k: (o.r || 1), sy: o.sy || 0.42, add: 1, l: 'g', life: o.life || 40, a: o.a === undefined ? 0.6 : o.a, fi: 0 });
  VX.pillar = o => VX.s2('fx_pillar', { x: o.x, y: o.y, k: (o.h || 2) / 4 * (o.wk || 1.2), add: 1, life: o.life || 24 });
  VX.burn2 = o => VX.s2('fx_burn', { x: o.x, y: o.y, k: (o.r || 1) / 1, l: 'g', add: 1, loop: 5, life: o.life || 120, a: 0.95 });
  VX.mark2 = o => VX.s2('fx_mark', { fx: o.fx, x: o.x, y: o.y, z: o.z || 0, k: o.k || 0.5, add: 1, life: o.life || 60, fi: 0, step: o.step });
  /* ---------- 爆炸：火球＋碎石＋塵環＋小地裂 ---------- */
  VX.blast = o => { const r = o.r || 1, x = o.x, y = o.y; VX.s2('fx_blast', { x, y, k: r * 0.9, life: 30 }); VX.glow({ x, y, z: 0.4, r: r * 0.9, col: '255,170,80', life: 10 });
    VX.s2('fx_dust', { x, y, k: r * 0.6, l: 'g', life: 26, a: 0.7 }); VX.debris2({ x, y, n: Math.round(3 + r * 3), spd: r * 1.2, up: 1.3 }); if (r >= 1) VX.s2('fx_crack_glow_s', { x, y, k: r * 0.9, l: 'g', add: 1, life: 36, a: 0.8 }); SC.shake = Math.max(SC.shake || 0, 3 + r * 3); };
  /* ---------- 命中閃光（疊在 76 的命中回饋上） ---------- */
  const imp0 = VX.impact; VX.impact = function (e, lv, kind, ang, col) { imp0.apply(this, arguments); const s = S(e.y), z = (e.ratio || 1) * 0.5, n = kind === 'cut' ? 'fx_hit_cut' : kind === 'blunt' || kind === 'shot' ? 'fx_hit_blunt' : 'fx_hit_pierce', k = lv === 'light' ? 0.6 : lv === 'mid' ? 0.8 : lv === 'heavy' ? 1.05 : 1.4;
    VX.s2(n, { x: e.x, y: e.y, z, k, add: 1, life: lv === 'hiden' ? 14 : 10, flip: G.H.face < 0, rot: kind === 'cut' ? rnd(-0.3, 0.3) : 0 }); };
  /* ---------- 箭（76 的 arrowShape 會先問這裡）：L＝畫面長度，箭尖在原點 ---------- */
  VX.arrow2 = (ctx, L, col, big) => { const n = big ? 'fx_arrow_h' : /^(1[0-9]{2}|[0-9]{1,2}),(1[0-9]{2}|2[0-9]{2}),255/.test(col || '') ? 'fx_arrow_s' : /^255,(1[0-6][0-9]|[0-9]{1,2}),/.test(col || '') ? 'fx_arrow_f' : 'fx_arrow_n', r = rec('x2_core', n); if (!r) return false;
    const [u, R] = r, fr = R.f[0], sc = L / fr[2]; ctx.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], -fr[4] * sc, -fr[5] * sc, fr[2] * sc, fr[3] * sc); return true; };
  /* ---------- 焙烙玉本體（76 的 bomb 會先問這裡） ---------- */
  VX.bomb2 = (ctx, x, y, s, t) => { const r = rec('x2_core', 'fx_bomb'); if (!r) return false; const [u, R] = r, fr = R.f[0], sc = HH() * s / (u.pph || 160);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.25); ctx.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], -fr[4] * sc, -fr[5] * sc, fr[2] * sc, fr[3] * sc); ctx.restore(); return true; };
  /* ---------- 槍口：火焰＋硝煙（77 c.muzzle 鐵砲分支呼叫） ---------- */
  VX.muzzle2 = (x, y, zH, f, big, ang) => { if (!VX.frames2('fx_muzzle')) return false; VX.s2(big ? 'fx_muzzle_big' : 'fx_muzzle', { x, y, z: zH, k: 1, flip: f < 0, rot: (ang || 0) * f, add: 1, life: big ? 12 : 9 });
    VX.s2('fx_smoke', { x: x + f * 0.05 * HH() * S(y), y, z: zH, k: big ? 1.1 : 0.8, flip: f < 0, life: big ? 48 : 36, a: 0.55 }); return true; };
  /* ---------- 舊臨時素材 → 新圖（84 VX.spr 包一層） ---------- */
  const spr0 = VX.spr; VX.spr = o => { const n = o.n, f = o.flip ? -1 : 1;
    if (n === 'fx_tier_teppo_master' || n === 'fx_tier_teppo_evolved') { const k = HH() * S(o.y); return VX.muzzle2(o.x - f * 0.35 * k, o.y, o.z || 0.6, f, n === 'fx_tier_teppo_master') ? 1 : spr0(o); }
    if (n === 'fx_tier_kanabo_master' || n === 'fx_tier_kanabo_evolved') { VX.debris2({ x: o.x, y: o.y, n: n.endsWith('master') ? 7 : 4, spd: (o.w || 1.3) * 0.8 }); return 1; }
    if (n === 'flame_drop') { VX.blast({ x: o.x, y: o.y, r: (o.w || 2) / 2 }); return 1; }
    if (n === 'heavy_quake' && o.u === 'p_shiro_fx') { if (VX.frames2('fx_dust')) return VX.s2('fx_dust', { x: o.x, y: o.y, k: (o.w || 2) / 3.2, l: 'g', life: o.life || 26, a: 0.8 }); }
    return spr0(o); };
})();
