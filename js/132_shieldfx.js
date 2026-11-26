/* ==========================================================================
 * 神諭之地 重製版 — 132_shieldfx.js
 * Version : r3.104.2  (2026-11-26)
 * 變更    : r3.104.2 新增。護罩特效（程式繪製，照美術規範：沒有外框實線、沒有單一橢圓圈）。
 *           ・G.SHFX.dome(ctx, x, cy, rx, ry, 色, 亮色, t, 透明度, 受擊)：
 *             1. 罩體：中心透明 → 外緣半透明藍 → 邊緣淡出（柔邊，不描線）。
 *             2. 氣流：4 條沿罩面流動的柔光帶（整條填色、頭尾漸細漸淡、帶波動），前半面較亮；整體「呼吸」縮放。
 *             3. 掃光：一道柔和亮帶由下往上掃過罩面。
 *             4. 受擊：打中的那一側出現擴散的柔光漣漪，罩體短暫變亮、微縮。
 *           ・G.SHFX.shatter(x, cy, rx, ry, 色)：碎裂——罩面切成 16 片不規則多邊形碎片，往外飛散、旋轉、受重力下墜後淡出；
 *             同時一圈快速擴散淡出的閃光（漸層，不描線）＋碎冰片素材（130_icons）。
 *           ・效能：每個護罩每格約 30 次路徑繪製；碎片 40 格後清除；不建立任何畫布。
 * 依賴    : 76_vfx（VX.custom）、130_icons（ICO.burst）。
 * ========================================================================== */
'use strict';
(function () {
  const TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  const rgba = (c, a) => 'rgba(' + c + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  function dome(c, x, cy, rx, ry, col, col2, t, a, hit) { if (!(a > 0.01)) return; const br = 1 + 0.025 * Math.sin(t * 0.09), hk = hit ? Math.max(0, 1 - hit.age / 16) : 0;
    const RX = rx * br * (1 - 0.04 * hk), RY = ry * br * (1 - 0.04 * hk); c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, cy);
    /* 1. 罩體（柔邊） */
    c.save(); c.scale(1, RY / RX); const g = c.createRadialGradient(0, -RX * 0.15, RX * 0.2, 0, 0, RX);
    g.addColorStop(0, rgba(col, 0.03 * a)); g.addColorStop(0.55, rgba(col, (0.07 + 0.08 * hk) * a)); g.addColorStop(0.8, rgba(col, (0.15 + 0.15 * hk) * a)); g.addColorStop(0.93, rgba(col, 0.06 * a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, RX, 0, TAU); c.fill();
    /* 3. 掃光 */
    const sw = RX - ((t * 1.4) % (RX * 3)), b = c.createLinearGradient(0, sw - RX * 0.3, 0, sw + RX * 0.3); b.addColorStop(0, rgba(col2, 0)); b.addColorStop(0.5, rgba(col2, 0.1 * a)); b.addColorStop(1, rgba(col2, 0));
    c.fillStyle = b; c.beginPath(); c.arc(0, 0, RX * 0.95, 0, TAU); c.fill(); c.restore();
    /* 2. 氣流：沿罩面流動的柔光帶（整條一次填色，頭尾漸細漸淡，沒有接縫亮點） */
    for (let i = 0; i < 4; i++) { const sp = [0.03, -0.024, 0.038, -0.033][i], th0 = t * sp + i * 1.57, L = 1.25, N = 14, out = [], inn = [];
      for (let k = 0; k <= N; k++) { const u = k / N, th = th0 + u * L, wob = 0.86 + 0.05 * Math.sin(th * 3 + t * 0.05 + i), px = Math.cos(th) * RX * wob, py = Math.sin(th) * RY * wob, nx = Math.cos(th), ny = Math.sin(th) * RX / RY, nl = Math.hypot(nx, ny) || 1, w = RX * 0.11 * Math.sin(u * Math.PI);
        out.push([px + nx / nl * w / 2, py + ny / nl * w / 2]); inn.push([px - nx / nl * w / 2, py - ny / nl * w / 2]); }
      const front = 0.45 + 0.55 * Math.max(0, Math.sin(th0 + L / 2)), p0 = out[0], p1 = out[N], lg = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(0.55, rgba(col2, 0.26 * a * front)); lg.addColorStop(0.8, rgba(col, 0.16 * a * front)); lg.addColorStop(1, rgba(col, 0));
      c.fillStyle = lg; c.beginPath(); c.moveTo(out[0][0], out[0][1]); for (let k = 1; k <= N; k++) c.lineTo(out[k][0], out[k][1]); for (let k = N; k >= 0; k--) c.lineTo(inn[k][0], inn[k][1]); c.closePath(); c.fill(); }
    /* 4. 受擊漣漪 */
    if (hk > 0) { const hx = hit.side * RX * 0.8, hy = -RY * 0.15, rr = RX * (0.2 + 0.7 * (1 - hk)), q = c.createRadialGradient(hx, hy, 0, hx, hy, rr);
      q.addColorStop(0, rgba(col2, 0.5 * hk * a)); q.addColorStop(0.6, rgba(col, 0.22 * hk * a)); q.addColorStop(1, rgba(col, 0)); c.fillStyle = q; c.beginPath(); c.arc(hx, hy, rr, 0, TAU); c.fill(); }
    c.restore(); }
  /* 碎裂 */
  function shatter(x, cy, rx, ry, col) { const VX = G.VX; if (!VX || !VX.custom) return; const P = [];
    for (let i = 0; i < 16; i++) { const th = (i / 16) * TAU + rnd(-0.15, 0.15), r = rnd(0.55, 0.95), px = Math.cos(th) * rx * r, py = Math.sin(th) * ry * r, n = 3 + (Math.random() < 0.5 ? 1 : 0), sz = rx * rnd(0.12, 0.22), pts = [];
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rnd(-0.4, 0.4); pts.push([Math.cos(a) * sz * rnd(0.5, 1.1), Math.sin(a) * sz * rnd(0.5, 1.1)]); }
      P.push({ x: px, y: py, vx: Math.cos(th) * rx * rnd(0.04, 0.08), vy: Math.sin(th) * ry * rnd(0.03, 0.06) - rx * 0.03, r: rnd(0, TAU), vr: rnd(-0.25, 0.25), pts }); }
    VX.custom((o, c) => { const q = o.t / o.life, a = 1 - q; c.save(); c.translate(x, cy); c.globalCompositeOperation = 'lighter';
      if (o.t < 12) { const k = o.t / 12, R = rx * (1 + 0.5 * k), g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.8, rgba(col, 0.35 * (1 - k))); g.addColorStop(1, rgba(col, 0));
        c.save(); c.scale(1, ry / rx); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.restore(); }
      for (const p of P) { c.save(); c.translate(p.x, p.y); c.rotate(p.r); const lg = c.createLinearGradient(-rx * 0.1, -rx * 0.1, rx * 0.1, rx * 0.1); lg.addColorStop(0, rgba('225,242,255', 0.55 * a)); lg.addColorStop(1, rgba(col, 0.25 * a));
        c.fillStyle = lg; c.beginPath(); c.moveTo(p.pts[0][0], p.pts[0][1]); for (let k = 1; k < p.pts.length; k++) c.lineTo(p.pts[k][0], p.pts[k][1]); c.closePath(); c.fill(); c.restore(); }
      c.restore(); }, 40, 'o', { step: () => { for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += rx * 0.006; p.vx *= 0.97; p.r += p.vr; } } });
    if (G.ICO) G.ICO.burst({ x, y: cy + ry }, 'fxp_ice_shard', 5, { z: 0.5 }); }
  G.SHFX = { dome, shatter };
})();
