/* ==========================================================================
 * 神諭之地 重製版 — 134_econ.js
 * Version : r3.106.0  (2026-11-26)
 * 變更    : r3.106.0 新增。平衡第 10 步（經濟）＋掉落物改圖。
 *           ・收入：打怪錢不依等級差遞減（使用者決議）；頭目擊敗另掉「30 隻同級怪」的錢（分 6 堆）；巔峰每 1 級，打怪與頭目的錢 +0.5%。
 *           ・難度素材（rpg.dm）：
 *             靈砂（普通以上：精英 15%、頭目 2～3）、妖晶（困難以上：精英 10%、頭目 1～2）、
 *             修羅之魂（修羅以上：精英 3%、頭目 1）、無間之核（無間：頭目 1，隱藏頭目 2）。
 *             用途：強化 +21～30 每級靈砂 2、+31～40 妖晶 2、+41～50 修羅之魂 2，升到 +50 另需無間之核 1；
 *                   勾玉淬鍊 Lv4 靈砂 2、Lv5 妖晶 2；升品到傳說／神話 妖晶 2；7～8 階勾玉的淬鍊／升品／合成 修羅之魂 2、9 階 無間之核 1；
 *                   新配方「穿玉錐」：無間之核 2＋玉屑 60＋錢 5000。
 *           ・掉落物：錢＝銅錢圖示（翻轉）；其他全部畫成寶箱（凡～精品＝一般箱、稀品＝精緻箱、傳說以上與難度素材＝豪華箱），
 *             箱子後面是品質色的柔邊光暈，稀品以上加一道柔光；撿起時箱子打開、往上淡出。
 *           ・選單 › 裝備 › 素材：改列打造素材、妖玉、精煉石、難度素材（附圖示）。
 * 存檔    : rpg.dm { reisa, yosho, shura, mugen }。
 * 依賴    : 03_actors（G.LOOTDRAW 掛點、lootStep）、07_rpg、26_boss（onEnd）、73_diff（GDIFF.i）、105_forge2（FORGE2.cost／enhance）、
 *           58_forge（強化按鈕顯示、素材頁）、129_magatama（OPS／RECIPE 的 dm: 費用）、130_icons、19_ui8（ui_icon_coin）、pr_village（寶箱圖）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), ctx = G.ctx; if (!R) return;
  const gi = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1), rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1));
  const DM = { reisa: ['靈砂', 'mat_reisa', '#9fd8ff'], yosho: ['妖晶', 'mat_yoshou', '#c095f0'], shura: ['修羅之魂', 'mat_shura_soul', '#f0624f'], mugen: ['無間之核', 'mat_mugen_core', '#b98cff'] };
  const dm = () => { const d = R.d(); return d.dm || (d.dm = { reisa: 0, yosho: 0, shura: 0, mugen: 0 }); };
  const key = k => String(k).replace(/^dm:/, ''), have = k => dm()[key(k)] || 0, name = k => DM[key(k)][0];
  const dmOk = c => !c || Object.keys(c).every(k => have(k) >= c[k]), dmPay = c => { if (!dmOk(c)) return false; for (const k in c || {}) dm()[key(k)] -= c[k]; G.SAVE.markDirty(); return true; };
  const dmTxt = c => Object.keys(c || {}).map(k => name(k) + ' ' + c[k] + '（有 ' + have(k) + '）').join('・');
  /* ---------- 用途 ---------- */
  function enDM(it) { const n = (it.en || 0) + 1, c = {}; if (n >= 21 && n <= 30) c.reisa = 2; else if (n >= 31 && n <= 40) c.yosho = 2; else if (n >= 41) c.shura = 2; if (n === 50) c.mugen = 1; return Object.keys(c).length ? c : null; }
  function gemDM(g, op) { const c = {}; if (op === 'temper') { const L = (g.lv || 0) + 1; if (L === 4) c['dm:reisa'] = 2; if (L === 5) c['dm:yosho'] = 2; }
    if (op === 'rank' && g.q + 1 >= 4) c['dm:yosho'] = 2;
    if (op === 'temper' || op === 'rank' || op === 'fuse') { if (g.t >= 9) c['dm:mugen'] = 1; else if (g.t >= 7) c['dm:shura'] = 2; }
    return c; }
  /* 強化（105_forge2） */
  (function hookForge() { const F2 = G.FORGE2; if (!F2) return setTimeout(hookForge, 60); if (F2._dm) return; F2._dm = 1;
    const c0 = F2.cost.bind(F2); F2.cost = function (it) { const c = c0(it), x = enDM(it); if (x) c.dm = x; return c; };
    const e0 = F2.enhance.bind(F2); F2.enhance = function (it) { const c = F2.cost(it); if (c.dm && !dmOk(c.dm)) return G.UI.toast(dmTxt(c.dm).replace(/（有/g, '（只有') + '：難度素材不夠');
      const g0 = R.d().gold, r = e0(it); if (c.dm && R.d().gold < g0) dmPay(c.dm); return r; }; })();
  /* ---------- 掉落 ---------- */
  const pk = () => (R.d() && R.d().pk) || 0;
  function dropDM(x, y, k, n) { if (n > 0) G.LOOT.push({ x: x + rnd(-24, 24), y: y + rnd(-8, 8), t: 0, kind: 'dm', id: k, n }); }
  const k0 = R.onKill; R.onKill = function (e) { const n0 = G.LOOT.length, r = k0.apply(this, arguments);
    try { const b = 1 + 0.005 * pk(); if (b > 1) for (let i = n0; i < G.LOOT.length; i++) { const L = G.LOOT[i]; if (L && L.kind === 'gold') L.v = Math.round(L.v * b); }
      if (e && e.elite && !e.bb && !e.boss && !e._summ) { const g = gi(); if (g >= 1 && Math.random() < 0.15) dropDM(e.x, e.y, 'reisa', 1); if (g >= 2 && Math.random() < 0.10) dropDM(e.x, e.y, 'yosho', 1); if (g >= 3 && Math.random() < 0.03) dropDM(e.x, e.y, 'shura', 1); } } catch (x) { console.warn('econ kill', x); }
    return r; };
  (function hookBoss() { const B = G.BOSS; if (!B) return setTimeout(hookBoss, 60); if (B._econ) return; B._econ = 1; const oe0 = B.onEnd; B.onEnd = function (enc) { const r = oe0 && oe0.apply(this, arguments);
      try { const u = (enc.units || []).slice(-1)[0] || H, lv = (u && u.lv) || R.d().lv, x = u.x, y = u.y, g = gi(), hid = enc.tier === 3 || /^(h_|t_)/.test(enc.id || '');
        const each = Math.round(30 * (4.5 + lv * 2) * (1 + (R.S ? R.S.gf : 0) / 100) * (1 + 0.005 * pk()) * ((G.GDIFF && G.GDIFF.cur && G.GDIFF.cur().gold) || 1) / 6);
        for (let i = 0; i < 6; i++) G.LOOT.push({ x: x + rnd(-50, 50), y: y + rnd(-14, 14), t: -i * 3, kind: 'gold', v: each });
        if (g >= 1) dropDM(x, y, 'reisa', ri(2, 3)); if (g >= 2) dropDM(x, y, 'yosho', ri(1, 2)); if (g >= 3) dropDM(x, y, 'shura', 1); if (g >= 4) dropDM(x, y, 'mugen', hid ? 2 : 1); } catch (x) { console.warn('econ boss', x); }
      return r; }; })();
  /* ---------- 撿取：難度素材＋開箱演出 ---------- */
  const OPEN = [];
  (function hookLoot() { if (!G.lootStep) return setTimeout(hookLoot, 50); const ls0 = G.lootStep; G.lootStep = function () { if (!G.LOOT.length) return ls0.apply(this, arguments);
      for (const l of G.LOOT) if (l.kind === 'dm' && !l.got && l.t >= 24 && Math.hypot(l.x - H.x, (l.y - H.y) * 1.6) <= 30) { l.got = 1; dm()[l.id] = (dm()[l.id] || 0) + l.n; G.UI.toast('獲得 ' + DM[l.id][0] + ' ×' + l.n); G.SAVE.markDirty(); }
      const before = G.LOOT.slice(), r = ls0.apply(this, arguments);
      for (const l of before) if (l.got && l.kind !== 'gold' && OPEN.length < 12) OPEN.push({ x: l.x, y: l.y, t: 0, tier: tierOf(l), col: colOf(l) });
      return r; }; })();
  /* ---------- 畫掉落物：錢＝銅錢、其他＝寶箱 ---------- */
  let BU = null; const need = () => { if (!BU && G.ANIM) { const u = G.ANIM.get('pr_village'); if (u) BU = u; else if (!need.t) { need.t = 1; G.ANIM.load('pr_village').then(v => { BU = v; }, () => { need.t = 0; }); } } return BU; };
  const tierOf = l => l.kind === 'dm' ? (l.id === 'reisa' ? 'rare' : 'legend') : l.kind === 'key' ? 'rare' : l.kind === 'item' ? (l.it.q >= 4 ? 'legend' : l.it.q >= 3 ? 'rare' : 'normal') : 'normal';
  const colOf = l => l.kind === 'dm' ? DM[l.id][2] : l.kind === 'mat' ? '#d8c8a8' : l.kind === 'key' ? '#c08cff' : ((l.it && R.QUAL[l.it.q]) || { c: '#ccc' }).c;
  const HK = { normal: 0.26, rare: 0.3, legend: 0.36 };
  function rgb(c) { const n = parseInt(c.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  function glow(x, y, r, col, a, beam) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const c = rgb(col);
    ctx.translate(x, y); ctx.scale(1, 0.55); let g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(' + c + ',' + 0.7 * a + ')'); g.addColorStop(0.5, 'rgba(' + c + ',' + 0.28 * a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.restore();
    if (beam) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y - r * 1.6); ctx.scale(0.22, 2.4); g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(' + c + ',' + 0.45 * a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.restore(); } }
  function chest(U, tier, st, x, y, a) { const r = U.act['chest_village_' + tier + '_' + st], sh = U.act['chest_village_' + tier + '_shadow']; if (!r) return 0; const f = r.f[0], hk = HK[tier], sc = HH() * S(y) * hk / f[3];
    if (sh && st === 'closed') G.ANIM.draw(U, sh.f[0], x, y, sc, false, 0.8 * a); G.ANIM.draw(U, f, x, y, sc, false, a); return f[2] * sc; }
  G.LOOTDRAW = function (l, Z) { const s = S(l.y), b = Math.max(0, 1 - l.t / 20), bob = Math.abs(Math.sin(l.t * 0.08 + l.x)) * 2, y = l.y - b * 26 - (l.t > 20 ? bob : 0), a = 0.55 + 0.45 * Math.sin(G.t * 0.12 + l.x);
    if (l.kind === 'gold') { if (!G.UI8 || !G.UI8.ready) return false; const sz = HH() * s * 0.3; ctx.save(); const sg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, sz * 0.5); sg.addColorStop(0, 'rgba(30,20,10,.3)'); sg.addColorStop(1, 'rgba(30,20,10,0)');
      ctx.translate(l.x, l.y); ctx.scale(1, 0.3); ctx.translate(-l.x, -l.y); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(l.x, l.y, sz * 0.5, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(l.x, y - sz * 0.15); ctx.scale(Math.max(0.12, Math.abs(Math.cos(G.t * 0.09 + l.x))), 1); const ok = G.drawIcon('ui_icon_coin', -sz / 2, -sz, sz); ctx.restore(); return ok; }
    const U = need(); if (!U) return false; const tier = tierOf(l), col = colOf(l), hk = HK[tier], r0 = HH() * s * hk;
    glow(l.x, y - r0 * 0.35, r0 * 1.05, col, 0.55 + 0.45 * a, tier !== 'normal');
    const w = chest(U, tier, 'closed', l.x, y, 1); if (!w) return false;
    if (l.kind === 'item' || l.kind === 'key' || l.kind === 'dm') { const lab = l.kind === 'item' ? R.name(l.it) : l.kind === 'dm' ? DM[l.id][0] + ' ×' + l.n : l.name; ctx.save(); ctx.translate(l.x, y - r0 * 1.15 - 8); ctx.scale(1 / Z, 1 / Z);
      ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`; const tw = ctx.measureText(lab).width + 12; ctx.fillStyle = 'rgba(12,8,10,.75)'; G.rr(-tw / 2, -10, tw, 20, 10); ctx.fill();
      ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1); ctx.restore(); }
    return true; };
  /* 開箱：打開的箱子往上淡出（畫在地面層之上） */
  (function hookDraw() { if (!G.drawLoot) return setTimeout(hookDraw, 50); const dl0 = G.drawLoot; G.drawLoot = function (Z) { const r = dl0.apply(this, arguments); const U = need();
      for (let i = OPEN.length - 1; i >= 0; i--) { const o = OPEN[i]; o.t++; if (o.t > 22 || !U) { OPEN.splice(i, 1); continue; } const q = o.t / 22;
        glow(o.x, o.y - 10 - q * 14, HH() * S(o.y) * 0.4 * (1 + q * 0.5), o.col, 1 - q, false); chest(U, o.tier, 'open', o.x, o.y - q * 14, 1 - q); }
      return r; }; })();
  /* ---------- 選單 › 裝備 › 素材 ---------- */
  (function hookMenu() { const M = G.MENU; if (!M || !M.PAGE || !M.PAGE['素材']) return setTimeout(hookMenu, 80); const T = G.txt, C = G.C;
    M.PAGE['素材'] = function (x, y, w, h) { const d = R.d(), U = M.ui; U.box(x, y, w, h); let cols = w >= 520 ? 3 : 2, cw = (w - 32 - 8 * (cols - 1)) / cols; const RH = 46;
      const cell = (i, y0, ic, nm, n, col) => { const bx = x + 16 + (i % cols) * (cw + 8), by = y0 + Math.floor(i / cols) * (RH + 6); ctx.fillStyle = 'rgba(255,255,255,.045)'; G.rr(bx, by, cw, RH, 8); ctx.fill();
        const iw = ic && ((ic.startsWith('mat_') && G.ICO && G.ICO.drawC(ic, bx + 22, by + RH / 2, 34)) || (!ic.startsWith('mat_') && G.drawIcon(ic, bx + 6, by + 6, 34))) ? 40 : 6;
        T(nm, bx + 8 + iw, by + 16, 12, col || C.ink, 'left', G.FONT_S, 900); T('× ' + n, bx + 8 + iw, by + 33, 13, C.ink, 'left', G.FONT, 700); };
      T('打造素材', x + 16, y + 22, 14, C.gold, 'left', G.FONT_S, 900); const MI = { iron: 'item_material_tamahagane', bone: 'item_material_ceramic', cloth: 'item_material_fiber', jade: 'item_key_jade_light', ember: 'item_material_ember' };
      const L1 = Object.keys(R.MATS).map(k => [MI[k], R.MATS[k].n, d.mats[k] || 0, R.MATS[k].c]).concat([['item_key_jade_water', '妖玉', d.yg || 0, '#9fe0ef'], ['item_material_radiance', '精煉石', (d.fm && d.fm.stone) || 0, '#cfd8e0']]);
      L1.forEach((q, i) => cell(i, y + 34, q[0], q[1], q[2], q[3])); let yy = y + 34 + Math.ceil(L1.length / cols) * (RH + 6) + 10;
      T('難度素材（強化 +21 以上、高階勾玉用）', x + 16, yy + 8, 14, C.gold, 'left', G.FONT_S, 900); yy += 20;
      cols = w >= 520 ? 4 : 2; cw = (w - 32 - 8 * (cols - 1)) / cols; Object.keys(DM).forEach((k, i) => cell(i, yy, DM[k][1], DM[k][0], dm()[k] || 0, DM[k][2]));
      yy += Math.ceil(4 / cols) * (RH + 6) + 6; if (yy + 6 < y + h - 4) T('靈砂：普通以上　妖晶：困難以上　修羅之魂：修羅以上　無間之核：無間頭目', x + 16, yy + 6, 10, C.dim, 'left', G.FONT, 500); }; })();
  G.ECON = { DM, dm, have, name, dmOk, dmPay, dmTxt, enDM, gemDM };
})();
