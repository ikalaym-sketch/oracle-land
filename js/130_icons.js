/* ==========================================================================
 * 神諭之地 重製版 — 130_icons.js
 * Version : r3.107.0  (2026-11-26)　r3.107.0：觸發特效同時最多 24 組
 * 舊版    : r3.103.0  (2026-11-26)
 * 變更    : r3.103.0 新增。Gemini 第 1～4 批圖示接入（tools/build_x3.py 產生 a/p/x3_ic.webp＋x3_ic.json，91 格，每格 128px）。
 *           ・G.ICO.draw(名, x, y, 寬, 高, 透明度)／drawC(名, 中心x, 中心y, 邊長, 透明度)：圖還沒載好回傳 false，呼叫端照舊用程式畫。
 *           ・圖集第一次被要求時才下載（約 540KB），之後常駐；沒有每格重複讀取。
 *           ・G.ICO.gem(種類)：勾玉種類 → 圖名（基礎 gem_<k>、元素 gem_el_<k>、秘法 gem_hi_<k>）；G.ICO.item(道具鍵) → 圖名。
 *           ・G.ICO.burst(位置, 零件, 數量)：特效零件（fxp_*）拋出、旋轉、落下淡出；場上同時最多 40 片。
 *           ・無間難度的探索寶箱改用 obj_chest_mugen（98_explore 設 n.mugenChest）。
 * 依賴    : 76_vfx（VX.custom）、129_magatama（MAGA.K）、02_scene（depth）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), rnd = (a, b) => a + Math.random() * (b - a);
  let IDX = null, IMG = null, asked = 0;
  function need() { if (IDX && IMG) return true; if (asked) return false; asked = 1;
    fetch('a/p/x3_ic.json?v=' + G.VER).then(r => { if (!r.ok) throw new Error('x3_ic.json ' + r.status); return r.json(); }).then(j => {
      const im = new Image(); im.decoding = 'async'; im.onload = () => { IDX = j; IMG = im; }; im.onerror = () => { asked = 0; }; im.src = 'a/p/x3_ic.webp?v=' + G.VER; }).catch(() => { asked = 0; });
    return false; }
  const has = n => need() && IDX.n[n] !== undefined;
  function draw(n, x, y, w, h, a, c) { if (!has(n)) return false; c = c || G.ctx; const i = IDX.n[n], C = IDX.cell, sx = (i % IDX.cols) * C, sy = Math.floor(i / IDX.cols) * C, s = Math.min(w, h);
    if (a !== undefined && a < 1) { c.save(); c.globalAlpha *= a; }
    c.drawImage(IMG, sx, sy, C, C, x + (w - s) / 2, y + (h - s) / 2, s, s); if (a !== undefined && a < 1) c.restore(); return true; }
  const drawC = (n, cx, cy, s, a, c) => draw(n, cx - s / 2, cy - s / 2, s, s, a, c);
  const gem = k => { const K = G.MAGA && G.MAGA.K, t = K && K[k] && K[k][0]; return t === 'e' ? 'gem_el_' + k : t === 'h' ? 'gem_hi_' + k : 'gem_' + k; };
  const ITEM = { whet: 'item_gem_whetstone', marrow: 'item_gem_marrow', fuse: 'item_gem_fuse_charm', wash: 'item_gem_wash', guard: 'item_gem_guard_charm', incense: 'item_gem_purify_incense', seal: 'item_gem_transfer_seal', awl: 'item_awl_gem' };
  /* ---------- 特效零件 ---------- */
  let live = 0, grp = [];   // r3.107.0：觸發特效（一次噴發＝1 組）同時最多 24 組
  function burst(p, part, n, o) { o = o || {}; if (!G.VX || !G.VX.custom || !has(part + '_1')) return; grp = grp.filter(t => t > G.t); if (grp.length >= 24) return; grp.push(G.t + 40); n = Math.min(n || 4, 60 - live); const s0 = S(p.y), k = HH() * s0;
    for (let i = 0; i < n; i++) { live++; const v = 1 + Math.floor(Math.random() * 3), sz = k * rnd(0.12, 0.2) * (o.k || 1), up = o.fall ? 0 : rnd(0.04, 0.09) * k;
      let x = p.x + rnd(-0.2, 0.2) * k, y = p.y, z = (o.z === undefined ? 0.6 : o.z) * k, vx = rnd(-1, 1) * 0.035 * k, vz = up, rot = rnd(0, 6.28), vr = rnd(-0.25, 0.25);
      G.VX.custom((q, c) => { const a = Math.min(1, (q.life - q.t) / 14); c.save(); c.translate(x, y - z); c.rotate(rot); drawC(part + '_' + v, 0, 0, sz, a, c); c.restore(); }, 40, 'o',
        { step: q => { x += vx; z += vz; vz -= k * (o.fall ? 0.0016 : 0.006); rot += vr; vx *= 0.97; if (z < 0) { z = 0; vz = 0; vx *= 0.6; vr *= 0.5; } if (q && q.t >= q.life - 1) live = Math.max(0, live - 1); } }); } }
  /* 保險：零件計數每 3 秒校正（避免特效層被清掉時計數卡住） */
  setInterval(() => { live = 0; }, 3000);
  /* ---------- 無間寶箱 ---------- */
  const IM2 = {}; const objImg = k => { let im = IM2[k]; if (!im) { im = IM2[k] = new Image(); im.src = 'a/p/objs/' + k + '.webp?v=' + G.VER; } return im.complete && im.naturalWidth ? im : null; };
  (function hk() { if (!G.drawNpc) return setTimeout(hk, 50); const dN = G.drawNpc; G.drawNpc = function (n) { if (!n || !n.mugenChest) return dN.apply(this, arguments); const im = objImg('obj_chest_mugen'); if (!im) return dN.apply(this, arguments);
    const c = G.ctx, sc = HH() * S(n.y) / 256, w = im.naturalWidth * sc, h = im.naturalHeight * sc; c.save(); c.fillStyle = 'rgba(20,14,8,.25)'; c.beginPath(); c.ellipse(n.x, n.y, w * 0.45, HH() * S(n.y) * 0.06, 0, 0, 6.283); c.fill();
    c.globalAlpha = n.opened ? 0.55 : 1; c.drawImage(im, n.x - w / 2, n.y - h, w, h); c.restore();
    if (!n.opened && G.t % 20 === 0) burst({ x: n.x, y: n.y }, 'fxp_petal_spider', 1, { z: 0.5, fall: 1, k: 0.7 }); }; })();
  G.ICO = { need, has, draw, drawC, gem, item: k => ITEM[k], burst };
})();
