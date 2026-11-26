/* ==========================================================================
 * 神諭之地 重製版 — 89_obj.js
 * Version : r3.109.0  (2026-11-26)　r3.109.0：物件對應先問 G.OBJX（137_props：封印門、地區告示牌）；門 1.3／告示牌 0.85 個主角高；紙燈籠先畫熄燈；物件消失時呼叫 G.OBJGONE
 * 舊版    : r3.104.2  (2026-11-26)　r3.104.2：修正調查物件一直重新淡入（看起來一直閃）：標記重建時用 id 配對；拿掉物件上方閃爍亮點
 * 舊版    : r3.104.1  (2026-11-26)　r3.104.1：精英頭上的冠標拿掉；護盾精英的氣焰改藍色由 131 切換 e._pal
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：探索區入口改用 obj_explore_sign（Gemini 第 2 批）
 * 舊版    : r3.92.0  (2026-11-26)　r3.92.0：接上 Gemini 補的 14 張物件（鳥居、斷權鳥居、稻草人、水車、舞台、雷脈閥、斷刀、紙燈籠、祭典燈籠串、宿場門柱、草叢）　r3.91.0：r3.91.0：有物件的互動點標記 m._obj（52 不畫地上黃圈）　r3.90.0：r3.90.0：調查物件補對應 29 種（公告板採集「草藥／妖氣結晶／遺失的貨物」、探索區調查點、各章找線索支線）；可用場景物件包 pr_* 的圖；探索入口立路標；修正人名「鈴緒」被畫成鈴鐺
 * 舊版    : r3.56.0  (2026-11-24)　r3.56.0：調查物件移到路邊（不擋路）
 * 舊版    : r3.40.0  (2026-11-18)
 * 變更    : r3.40.0 新增。
 *           1. 氣紋（G.AURA）：ChatGPT 交付的手繪菁英氣焰（背焰一張＋前流兩縷），6 色（朱紅／金赭／青翠／蒼藍／藤紫／月白）。
 *              開機把底材依亮度上色一次（每色一張快取），之後逐格只 drawImage。原型模組改寫成遊戲內版本（不用 ES module）。
 *           2. 菁英：所有模式的菁英敵人（e.elite：任務菁英、副本／事件精英、無間全精英）畫氣紋＋頭上冠標；章節頭目、小頭目不畫。
 *              顏色依菁英種類：任務／事件金赭、無間藤紫、其他朱紅。
 *           3. 爆氣（88_rune）：主角背後畫氣紋（怒氣爆發朱紅、鬥氣金赭）。
 *           4. 調查物件：任務「調查／收集」點依標籤擺上第二代物件圖（x2_obj，30 種），收集後跟著標記一起消失。
 * 依賴    : 12_anim、86_fx2（VX.draw2／x2）、03_actors（drawOni／drawHero／drawNpc）、53_quest（Q.marks）、52_hub（HUB.marks）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC, H = G.H, HH = () => G.HERO_H, S = y => SC.depth(y), VX = G.VX;
  /* ======================= 1. 氣紋 ======================= */
  const PAL = { crimson: '#c34d42', gold: '#d0a04d', emerald: '#54aa7d', azure: '#5a99c5', violet: '#a478c7', ivory: '#d9d4bf' };
  const AU = G.AURA = { ok: false, back: {}, wisp: {}, mark: {} };
  function tint(img, col) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const p = g.getImageData(0, 0, c.width, c.height), d = p.data, r = parseInt(col.slice(1, 3), 16) / 255, gg = parseInt(col.slice(3, 5), 16) / 255, b = parseInt(col.slice(5, 7), 16) / 255;
    for (let i = 0; i < d.length; i += 4) { const L = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722; d[i] = Math.min(255, L * r * 1.25); d[i + 1] = Math.min(255, L * gg * 1.25); d[i + 2] = Math.min(255, L * b * 1.25); }
    g.putImageData(p, 0, 0); return c; }
  function marker(col) { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); g.lineWidth = 2; g.strokeStyle = '#241c1a'; g.fillStyle = col;
    g.beginPath(); g.moveTo(5, 16); g.lineTo(3, 7); g.lineTo(9, 11); g.lineTo(12, 4); g.lineTo(15, 11); g.lineTo(21, 7); g.lineTo(19, 16); g.closePath(); g.fill(); g.stroke(); return c; }
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  Promise.all([load('a/p/aura_back.webp?v=' + G.VER), load('a/p/aura_wisp.webp?v=' + G.VER)]).then(([bk, ws]) => { for (const k in PAL) { AU.back[k] = tint(bk, PAL[k]); AU.wisp[k] = tint(ws, PAL[k]); AU.mark[k] = marker(PAL[k]); } AU.ok = true; }, e => console.warn('aura', e));
  /* x＝腳底中心、y＝腳底；w／h＝角色身形；a＝透明度；front＝順便畫前流 */
  AU.back1 = (c, x, y, w, h, pal, a) => { if (!AU.ok) return; const t = G.t / 60, cyc = Math.sin(t * 0.9 * 6.283 + x * 0.01), sc = 1 + cyc * 0.025, W = w * 1.42 * sc, Hh = h * 1.17 * sc;
    c.save(); c.globalAlpha *= Math.max(0, Math.min(1, a * 0.58 * (1 + cyc * 0.08))); c.drawImage(AU.back[pal] || AU.back.crimson, x - W / 2, y + h * 0.025 - Hh, W, Hh); c.restore(); };
  AU.front1 = (c, x, y, w, h, pal, a) => { if (!AU.ok) return; const t = G.t / 60, ww = w * 0.2, wh = h * 0.4, img = AU.wisp[pal] || AU.wisp.crimson;
    c.save(); for (let i = 0; i < 2; i++) { const ph = (t * 0.58 + i * 0.49 + x * 0.003) % 1, side = i % 2 ? 1 : -1, px = x + w * side * (0.28 + Math.sin(ph * Math.PI) * 0.06), py = y - h * (0.08 + ph * 0.45) - wh;
      c.globalAlpha = Math.max(0, Math.min(1, a * 0.27 * Math.sin(ph * Math.PI))); c.drawImage(img, px - ww / 2, py, ww, wh); } c.restore(); };
  AU.draw = (c, x, y, w, h, pal, a, front) => { AU.back1(c, x, y, w, h, pal, a); if (front) AU.front1(c, x, y, w, h, pal, a); };
  /* ======================= 2. 菁英 ======================= */
  const palOf = e => e._pal || (e._pal = /無間|精英/.test(e.elite) && G.GDIFF && G.GDIFF.i && G.GDIFF.i() >= 4 ? 'violet' : e.qid || e.ev ? 'gold' : 'crimson');
  const size = e => { const h = HH() * (e.ratio || 1) * S(e.y) * 1.05; return [h * 0.8, h]; };
  const dO = G.drawOni; G.drawOni = function (e) { const el = e && e.elite && !e.bb && !e.boss && e.st !== 'dead'; if (!el || !AU.ok) return dO.apply(this, arguments);
    const [w, h] = size(e), a = Math.min(1, (e.alpha === undefined ? 1 : e.alpha)) * Math.min(1, (e.t || 30) / 18), pal = palOf(e), y = e.y - (e.lift || 0);
    AU.back1(ctx, e.x, y, w, h, pal, a); const r = dO.apply(this, arguments); AU.front1(ctx, e.x, y, w, h, pal, a);
    return r; };   // r3.104.1：頭上冠標拿掉（精英改看下方血條與詞綴）
  /* ======================= 3. 主角爆氣 ======================= */
  const dH = G.drawHero; G.drawHero = function () { const Q = G.QIB; if (Q && Q.on() && AU.ok) { const h = HH() * S(H.y) * 1.1; AU.back1(ctx, H.x, H.y, h * 0.75, h, Q.big ? 'crimson' : 'gold', 1); }
    const r = dH.apply(this, arguments); if (Q && Q.on() && AU.ok) { const h = HH() * S(H.y) * 1.1; AU.front1(ctx, H.x, H.y, h * 0.75, h, Q.big ? 'crimson' : 'gold', 1); } return r; };
  if (G.QIB) G.QIB.draw = () => {};
  /* ======================= 4. 調查物件 ======================= */
  /* r3.90.0：補對應（委託公告板採集、探索區調查點、各章「找線索」支線）；「pr:包:名」＝用場景物件包（pr_*）的圖 */
  /* r3.92.0：Gemini 補圖（a/p/objs/*.webp，主角身高＝256px） */
  const OBJ3 = [[/鳥居（[一二三]）|^鳥居旁$/, 'img:obj_torii_small_a'], [/斷權鳥居/, 'img:obj_torii_broken'], [/稻草人/, 'img:obj_scarecrow'], [/水車旁/, 'img:obj_waterwheel_small'],
    [/舞台下/, 'img:obj_stage_edge'], [/雷脈閥/, 'img:obj_thunder_valve_off'], [/斷掉的刀/, 'img:obj_broken_katana'], [/^燈籠下$/, 'img:obj_lantern_pole_off'], [/^燈籠$/, 'img:obj_festival_lanterns'],
    [/宿場門口/, 'img:obj_post_gate_sign'], [/^草叢$/, 'img:obj_bush'], [/^探索・/, 'img:obj_explore_sign']];
  const OBJ2 = [[/^探索・/, 'pr:pr_ev:sign_village_idle'], [/草藥/, 'obj_herb_pack'], [/妖氣結晶/, 'obj_thunder_stone'], [/遺失的貨物|倒塌的貨箱|遺落的包袱/, 'pr:pr_ev:lost_parcel_static'], [/足跡/, 'obj_footprints'],
    [/燒焦的告示/, 'obj_paper_pile'], [/被翻過的米缸|井邊/, 'obj_bucket'], [/符紙/, 'obj_talisman_black'], [/餘燼/, 'obj_ash_trough'], [/灶房後/, 'obj_ash_trough_b'],
    [/河邊石頭|回音石|溪邊/, 'obj_bluestone'], [/小橋下|吊橋邊|棧道口/, 'obj_rope_post'], [/稻架下|蘆葦叢/, 'obj_lumber_b'], [/田埂|礁石間/, 'obj_stone_shard_b'], [/雷石堆/, 'obj_thunder_stone'],
    [/坑道口/, 'obj_crate_fallen'], [/晾衣竿下/, 'obj_veil'], [/崖邊石碑/, 'obj_stone_shard'], [/倒塌的茶屋/, 'obj_shed_collapsed'], [/蛛網下|粗蛛絲/, 'obj_silk_thread'],
    [/船骸旁/, 'pr:pr_ev:broken_wheel_static'], [/石室角落/, 'obj_relic_box'], [/竹林口/, 'obj_bamboo_dry'], [/倒下的籬笆/, 'pr:pr_nav:break_village_bamboo_fence_broken'],
    [/雨廊布街|染坊後院/, 'pr:pr_deco:goods_cloth_static'], [/河邊晒場/, 'pr:pr_deco:rolled_mat_static'], [/驛站馬廄/, 'pr:pr_deco:feed_bowl_static'],
    [/枯樹下/, 'pr:pr_volcano:break_volcano_dead_wood_intact'], [/冥燈旁/, 'pr:pr_izumo:break_izumo_stone_lantern_intact'], [/杉並木下/, 'obj_lumber']];
  const OBJ = [[/枯竹/, 'obj_bamboo_dry'], [/青石/, 'obj_bluestone'], [/退熱草|安神香/, 'obj_herb_pack'], [/止血藤/, 'obj_herb_pack_b'], [/斷橋/, 'obj_rope_post'], [/黑符/, 'obj_talisman_black'],
    [/古箱/, 'obj_old_chest'], [/田土|稻草堆|水溝/, 'obj_stone_shard_b'], [/茶杯/, 'obj_teacup'], [/喜帕/, 'obj_veil'], [/腳印/, 'obj_footprints'], [/倒塌的棚子/, 'obj_shed_collapsed'], [/木箱/, 'obj_crate_fallen'],
    [/燒焦的門/, 'obj_door_burnt'], [/水桶/, 'obj_bucket'], [/雷紋石/, 'obj_thunder_stone'], [/白羽/, 'obj_feather_white'], [/鐵料/, 'obj_iron_ore'], [/鬼鐵/, 'obj_iron_ore_b'], [/冥火的灰/, 'obj_ash_trough'], [/爐灰/, 'obj_ash_trough_b'],
    [/「天」之架/, 'obj_shelf_sign_ten'], [/「地」之架/, 'obj_shelf_sign_chi'], [/「人」之架/, 'obj_shelf_sign_jin'], [/書庫屋簷/, 'obj_crane_nest'], [/黑紙堆/, 'obj_paper_pile'], [/補給棚/, 'obj_crate_fallen'],
    [/短籤/, 'obj_tanzaku'], [/書頁/, 'obj_book_page'], [/密信/, 'obj_letter_secret'], [/^木材$/, 'obj_lumber'], [/^稻草$/, 'obj_lumber_b'], [/芒草絲|封印絲/, 'obj_silk_thread'],
    [/早潮/, 'obj_tide_pillar_dawn'], [/午潮/, 'obj_tide_pillar_noon'], [/夜潮/, 'obj_tide_pillar_night'], [/水軍的寶箱/, 'obj_sea_chest'], [/封印石/, 'obj_stone_shard'], [/匣子/, 'obj_relic_box'], [/鈴(?!緒)/, 'obj_bell_small']];
  const objOf = l => { const x = G.OBJX && G.OBJX(l || ''); if (x) return x; for (const [re, n] of OBJ3) if (re.test(l || '')) return n; for (const [re, n] of OBJ2) if (re.test(l || '')) return n; for (const [re, n] of OBJ) if (re.test(l || '')) return n; return null; };
  let OL = [], tk = 0;
  /* r3.56.0：調查物件不擋在路中間——往最近的路邊（上或下）移，離邊界 34px；只移一次（m._rs） */
  function roadside(m) { if (m._rs) return; m._rs = 1; const W = (x, y) => SC.walkable(x, y); if (!W(m.x, m.y)) return; let best = null;
    for (const dir of [-1, 1]) { let k = 0; while (k < 200 && W(m.x, m.y + dir * (k + 10))) k += 10; if (k >= 200) continue; if (!best || k < best.k) best = { k, dir }; }
    if (!best || best.k < 50) return; const ny = m.y + best.dir * Math.max(0, best.k - 34); m.y = ny; if (m.n === undefined) {} }
  function sync() { const marks = (G.QST && G.QST.marks || []).concat(G.HUB && G.HUB.marks || []), want = [];
    for (const m of marks) { const tk2 = m.kind === 'talk'; if ((m.kind !== 'look' && !tk2) || !(m.x > -999) || m.hide) continue; const n = objOf(m.label); if (!n || (tk2 && n !== 'img:obj_bush')) continue; m._obj = 1; if (!tk2 && !/:door_/.test(n)) roadside(m);   /* r3.109.0：封印門留在原位 */ if (!want.some(o => o.m === m)) want.push({ m, n }); }
    /* r3.104.2：標記每秒會被重建（98 探索入口等），用 id（沒有 id 用名稱＋位置）配對同一個物件，不重新淡入＝不再一直閃 */
    const key = m => m.id || (m.label + '@' + Math.round(m.x / 20) + ',' + Math.round(m.y / 20)), same = (o, w) => o.m === w.m || (o.k === key(w.m) && o.objd === w.n);
    for (const o of OL) { const w = want.find(q => same(o, q)); if (w) { o.m = w.m; o.gone = 0; } else o.gone = 1; }
    for (const w of want) if (!OL.some(o => same(o, w))) { const o = { objd: w.n, m: w.m, k: key(w.m), x: w.m.x, y: w.m.y + 2, name: '', t: 0 }; OL.push(o); }
    const gone = OL.filter(o => o.gone); OL = OL.filter(o => !o.gone); if (gone.length) { G.NPC = G.NPC.filter(n => !gone.includes(n)); if (G.OBJGONE) for (const o of gone) try { G.OBJGONE(o); } catch (e) {} }
    for (const o of OL) { o.x = o.m.x; o.y = o.m.y + 2; if (!G.NPC.includes(o)) G.NPC.push(o); } }
  /* r3.90.0：場景物件包（pr_*）的圖：高度約 0.42 個主角、底部對齊地面 */
  const PRH = 0.42, prLoad = {}, PRK = { sign_village_idle: 0.8, break_izumo_stone_lantern_intact: 0.7, break_volcano_dead_wood_intact: 0.6, break_village_bamboo_fence_broken: 0.45 };
  function drawPr(n) { const [, pk, nm2] = n.objd.split(':'), U = G.ANIM.get(pk); if (!U) { if (!prLoad[pk]) { prLoad[pk] = 1; try { const q = G.ANIM.load(pk); if (q && q.catch) q.catch(() => { prLoad[pk] = 0; }); } catch (x) { prLoad[pk] = 0; } } return; }
    const r = (U.act && U.act[nm2]) || (U.fx && U.fx[nm2]); if (!r) return; const f = r.f[0], s = S(n.y), sc = HH() * s * (PRK[nm2] || (/^door_/.test(nm2) ? 1.3 : /^sign_/.test(nm2) ? 0.85 : PRH)) / f[3];
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.22)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, f[2] * sc * 0.45, HH() * s * 0.07, 0, 0, 6.283); ctx.fill(); ctx.restore();
    G.ANIM.draw(U, f, n.x, n.y, sc, false, Math.min(1, n.t / 15)); }
  const IMGS = {};
  function drawImg(n) { const k = n.objd.slice(4); let im = IMGS[k]; if (!im) { im = IMGS[k] = new Image(); im.src = 'a/p/objs/' + k + '.webp?v=' + G.VER; } if (!im.complete || !im.naturalWidth) return;
    const sc = HH() * S(n.y) / 256, w = im.naturalWidth * sc, h = im.naturalHeight * sc;
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.22)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, w * 0.42, HH() * S(n.y) * 0.07, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = Math.min(1, n.t / 15); ctx.drawImage(im, n.x - w / 2, n.y - h, w, h); ctx.restore(); }
  const dN = G.drawNpc; G.drawNpc = function (n) { if (!n.objd) return dN.apply(this, arguments); if (/^img:/.test(n.objd)) { n.t++; return drawImg(n); } if (/^pr:/.test(n.objd)) { n.t++; return drawPr(n); } if (!VX.draw2) return; n.t++;
    const R = VX.frames2 && VX.frames2(n.objd) ? 1 : 0; if (!R) return; const u = G.ANIM.get('x2_obj'), f = u && u.fx[n.objd] && u.fx[n.objd].f[0], mx = f ? Math.max(f[2], f[3]) / (u.pph || 160) : 0.3, k = Math.max(1, 0.34 / mx);
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.22)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, HH() * S(n.y) * Math.min(0.6, mx * k * 0.5), HH() * S(n.y) * 0.08, 0, 0, 6.283); ctx.fill(); ctx.restore();
    VX.draw2(ctx, n.objd, 0, n.x, n.y, k, { a: Math.min(1, n.t / 15) });
    };   // r3.104.2：拿掉物件上方一閃一閃的亮點
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); if (++tk % 20 === 0) try { sync(); } catch (e) { console.warn('obj', e); } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { OL = []; const r = en0(id); try { VX.x2 && VX.x2('x2_obj'); sync(); } catch (e) {} return r; };
})();
