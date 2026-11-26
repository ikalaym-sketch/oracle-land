/* ==========================================================================
 * 神諭之地 重製版 — 25_walk.js
 * Version : r3.19.3  （r3.19.3：公開 WK.dist）
 * 舊版    : r3.8.3  (2026-11-13)
 * 變更    : r3.8.3 妖怪生成點一律校正到寬敞可走處（離邊 ≥2 格；否則找最近寬敞點），不再生在牆邊、水面或孤立小塊；
 *           遮罩已移除與出入口不相連的孤島（離主區 ≤3 格的大塊改接回）。
 * 變更    : r3.7.0 新增。可走範圍改用遮罩（a/walk.json：每張圖 1/4 解析度格子，RLE 壓縮）：
 *           ・有遮罩的地圖：SC.walkable 查格子（取代外框＋方塊障礙）；沒有遮罩的沿用舊判定。
 *           ・SC.room(x,y)＝離不可走邊界的格數（距離場）；SC.snap(x,y,種類,半徑) 找最近的「寬敞／邊緣／可走」點。
 *           ・出口線與抵達點依遮罩修正（walk.json portals）。
 *           ・測試頁「顯示可走範圍」：綠＝可走、紅＝不可走、黃＝寬敞區（NPC 生成用）。
 * 依賴    : 18_world（boot 之後）、02_scene、14_cheat（開關）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC;
  const WK = G.WALK = { M: {} };
  function decode(e) { const n = e.w * e.h, m = new Uint8Array(n); let i = 0, v = 0; for (const r of e.m.split(',')) { const L = parseInt(r, 36); if (v) m.fill(1, i, i + L); i += L; v ^= 1; } return m; }
  function dist(m, w, h) { const d = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) d[i] = m[i] ? 255 : 0;   // 兩趟城市距離
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); else v = 1; if (y > 0) v = Math.min(v, d[i - w] + 1); else v = 1; d[i] = v; }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; if (x < w - 1) v = Math.min(v, d[i + 1] + 1); else v = 1; if (y < h - 1) v = Math.min(v, d[i + w] + 1); else v = 1; d[i] = v; }
    return d; }
  WK.apply = function (id) { const e = WK.M[id], d = G.D.scenes[id]; if (!e || !d) return; d.mask = e;
    for (const p of d.portals || []) { const o = e.portals && e.portals[p.id]; if (!o) continue; if (o.line && p.line) p.line = o.line; if (o.arrival) p.arrival = o.arrival; }
    for (const k in G.D.scenes) for (const q of G.D.scenes[k].portals || []) if (q.to === id && q.id) { /* 對面進來的抵達點＝本圖對應出口 */ } };
  WK.load = () => Promise.all([fetch('a/place.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).then(j => { G.PLACE = j; }).catch(() => { G.PLACE = {}; }), fetch('a/walk.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).then(j => { for (const id in j) { const e = j[id]; e.m = decode(e); e.d = dist(e.m, e.w, e.h); WK.M[id] = e; WK.apply(id); } })]).catch(e => console.warn('walk', e));
  WK.dist = dist;   // r3.19.3：給 58_forge 修正遮罩後重算
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = function () { return boot0().then(r => WK.load().then(() => r)); };
  const cell = (k, x, y) => { const cx = (x / k.s) | 0, cy = (y / k.s) | 0; return cx < 0 || cy < 0 || cx >= k.w || cy >= k.h ? -1 : cy * k.w + cx; };
  const walk0 = SC.walkable;
  SC.walkable = function (x, y) { const k = this.def && this.def.mask; if (!k) return walk0.call(this, x, y); const i = cell(k, x, y); return i >= 0 && k.m[i] === 1; };
  SC.room = function (x, y) { const k = this.def && this.def.mask; if (!k) return this.walkable(x, y) ? 3 : 0; const i = cell(k, x, y); return i < 0 ? 0 : k.d[i]; };
  /* 最近的符合點：kind＝'open'（離邊 ≥3 格）／'edge'（可走且離邊 ≤2 格）／'walk' */
  SC.snap = function (x, y, kind, R) { R = R || 200; const ok = (xx, yy) => { const r = this.room(xx, yy); return kind === 'open' ? r >= 3 : kind === 'edge' ? r >= 1 && r <= 2 : r >= 1; };
    if (ok(x, y)) return [x, y]; for (let r = 6; r <= R; r += 6) for (let a = 0; a < 6.283; a += 6 / r) { const xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r * 0.7; if (ok(xx, yy)) return [xx, yy]; } return null; };
  /* 隨機寬敞點（NPC／物件生成用） */
  SC.randSpot = function (kind, rnd, avoid, gap) { rnd = rnd || Math.random; const d = this.def; for (let t = 0; t < 300; t++) { const x = 40 + rnd() * (d.w - 80), y = 20 + rnd() * (d.h - 40);
      const r = this.room(x, y); if (kind === 'open' ? r < 3 : kind === 'edge' ? !(r >= 1 && r <= 2) : r < 1) continue; if (avoid && avoid.some(o => Math.hypot(o[0] - x, (o[1] - y) * 1.4) < (gap || 60))) continue; return [x, y]; } return null; };
  /* 顯示可走範圍（測試） */
  let ovC = null, ovId = null;
  function overlay() { const k = SC.def && SC.def.mask; if (!k) return null; if (ovId === SC.id) return ovC; const c = document.createElement('canvas'); c.width = k.w; c.height = k.h; const g = c.getContext('2d'), im = g.createImageData(k.w, k.h);
    for (let i = 0; i < k.w * k.h; i++) { const o = i * 4; if (k.m[i]) { const big = k.d[i] >= 3; im.data[o] = big ? 200 : 40; im.data[o + 1] = 230; im.data[o + 2] = big ? 60 : 80; im.data[o + 3] = 90; } else { im.data[o] = 230; im.data[o + 1] = 40; im.data[o + 2] = 40; im.data[o + 3] = 70; } }
    g.putImageData(im, 0, 0); ovC = c; ovId = SC.id; return c; }
  /* 妖怪生成：所有呼叫（自動重生、事件、劇情、頭目召喚）都先校正位置 */
  const sp0 = G.spawnOni;
  G.spawnOni = function (x, y, ...a) { if (SC.def && SC.def.mask && SC.room(x, y) < 2) { const p = SC.snap(x, y, 'open', 420) || SC.snap(x, y, 'walk', 700); if (p) { x = p[0]; y = p[1]; } } return sp0(x, y, ...a); };
  const de0 = SC.drawExits.bind(SC);
  SC.drawExits = function () { if (G.CHEAT && G.CHEAT.on.walk) { const c = overlay(); if (c) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, c.width * SC.def.mask.s, c.height * SC.def.mask.s); ctx.restore(); }
      else G.txt('（此地圖尚未製作可走遮罩）', G.H.x, G.H.y - 90, 12, '#ffd0c8', 'center'); } return de0(); };
})();
