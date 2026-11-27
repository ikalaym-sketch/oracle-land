/* ==========================================================================
 * 神諭之地 重製版 — 162_fx3.js
 * Version : r3.189.0  (2026-11-28)　r3.189.0：秘傳招名提示改成演出的一部分（左下大字滑入＋上方黑邊中央），不再被黑邊蓋住
 * 舊版    : r3.184.0  (2026-11-28)　上下黑邊只在秘傳、奧義演出時出現，一般技能與特技不出現
 * 舊版    : r3.177.0  (2026-11-28)　r3.177.0：秘傳演出時上下黑邊
 * 舊版    : r3.176.0  (2026-11-28)　r3.176.0：鐵砲命中也有受擊染色
 * 舊版    : r3.170.0  (2026-11-27)
 * 變更    : r3.170.0 新增。特效第三版的受擊反應（先套打刀當樣板；111_katana_fx 命中時寫入 e._hf）。
 *           ・染色外光：被打的瞬間，妖怪身後多一圈武器色的輪廓光（放大 6% 的剪影），0.15 秒淡掉。
 *           ・染色閃光：身上疊一層武器色（取代純白閃）。
 *           ・壓扁回彈：被打瞬間橫向拉寬、縱向壓扁，往刀的方向位移幾個像素後彈回（頭目不壓扁）。
 *           ・效能：剪影染色只在受擊的 9 格內做，共用一張離屏畫布。
 * 依賴    : 03_actors（G.drawOni、e._fx3）、12_anim（ANIM.white）、111_katana_fx（e._hf）。
 * ========================================================================== */
'use strict';
(function () {
  const A = G.ANIM, ctx = G.ctx; if (!A || !A.white || !G.drawOni) return;
  const cv = document.createElement('canvas'), cx = cv.getContext('2d'), LIFE = 9;
  function tint(u, fr, col) { const w = A.white(u, fr); if (!w) return null; cv.width = fr[2]; cv.height = fr[3]; cx.globalCompositeOperation = 'source-over'; cx.drawImage(w, 0, 0, fr[2], fr[3]); cx.globalCompositeOperation = 'source-in'; cx.fillStyle = 'rgb(' + col + ')'; cx.fillRect(0, 0, fr[2], fr[3]); return cv; }
  function sil(e, im, k, al, op) { const [u, fr, sc] = e._fx3, w = fr[2] * sc * k, h = fr[3] * sc * k, ox = fr[4] * sc, oy = fr[5] * sc, mx = e.x - ox + fr[2] * sc / 2, my = e.y - oy + fr[3] * sc / 2;
    ctx.save(); ctx.globalAlpha = al; ctx.globalCompositeOperation = op; if (e.face < 0) { ctx.translate(e.x * 2, 0); ctx.scale(-1, 1); } ctx.drawImage(im, mx - w / 2, my - h / 2, w, h); ctx.restore(); }
  /* r3.176.0：鐵砲（沒有走 111 的命中轉接）也有受擊染色——主角出招中命中時補上火藥色 */
  (function hk() { const VX = G.VX; if (!VX || !VX.impact) return setTimeout(hk, 60); const im = VX.impact; VX.impact = function (e) { const r = im.apply(this, arguments);
      try { if (e && G.H.act && G.WPN.curId() === 'teppo' && !(e._hf && e._hf.t === G.t)) e._hf = { t: G.t, c: '240,128,48', pw: 1.2, d: G.H.face }; } catch (x) {} return r; }; })();
  /* r3.177.0：秘傳演出時上下出現黑邊（電影寬螢幕感），演完收回 */
  let bar = 0; const ud0 = G.UI.draw; G.UI.draw = function () { const r = ud0.apply(this, arguments); const on = G.mode === 'play' && G.H.act && G.H.act.mvx && (G.H.act.mvx.hd || G.H.act.mvx.hiden && G.CAMZOOM && G.t < G.CAMZOOM.until) ? 1 : 0; bar += (on - bar) * 0.18;
    if (bar > 0.02) { const h = 30 * bar; ctx.fillStyle = '#050406'; ctx.fillRect(0, 0, G.LW, h); ctx.fillRect(0, G.LH - h, G.LW, h); }
    /* r3.189.0：秘傳招名——原本的橫幅被上方黑邊蓋住，改成演出的一部分：發動時左下大字滑入，之後留在上方黑邊中央 */
    { const a = G.H.act, hd = G.mode === 'play' && a && a.mvx && a.mvx.hd ? a : null, B = G.UI.ban;
      if (hd && ttl.a !== hd) { ttl.a = hd; ttl.t0 = G.t; ttl.n = hd.mvx.def.n || ''; ttl.sub = ''; }
      if (B && typeof B.text === 'string' && B.text.indexOf('秘傳・') === 0 && hd) { ttl.sub = B.sub || ''; G.UI.ban = null; }
      if (hd && ttl.n) { const u = G.t - ttl.t0, LW = G.LW, LH = G.LH;
        if (bar > 0.4) { ctx.globalAlpha = Math.min(1, (bar - 0.4) * 3); G.txt('秘傳・' + ttl.n, LW / 2, 16, 12, '#e8c878', 'center', G.FONT_S, 900); ctx.globalAlpha = 1; }
        if (u < 64) { const k = Math.min(1, u / 8), e = 1 - Math.pow(1 - k, 3), al = u < 46 ? e : Math.max(0, 1 - (u - 46) / 18), x = 28 - (1 - e) * 60, y = LH - 30 - 40; ctx.save(); ctx.globalAlpha = al;
          const g = ctx.createLinearGradient(0, 0, LW * 0.5, 0); g.addColorStop(0, 'rgba(5,4,6,0.78)'); g.addColorStop(1, 'rgba(5,4,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, y - 30, LW * 0.5, 62);
          ctx.fillStyle = '#e8c878'; ctx.fillRect(x, y + 17, (LW * 0.3) * e, 1.5); ctx.fillRect(x, y - 22, 3, 36);
          G.txt('秘　傳', x + 12, y - 15, 11, '#e8c878', 'left', G.FONT_S, 900); G.txt(ttl.n, x + 12, y + 5, 26, '#fff6e2', 'left', G.FONT_S, 900);
          if (ttl.sub) G.txt(ttl.sub, x + 12, y + 28, 10, '#e8c878', 'left', G.FONT, 700); ctx.restore(); } }
      else if (!hd) ttl.a = null; }
    return r; };
  const ttl = { a: null, t0: 0, n: '', sub: '' };
  const d0 = G.drawOni; G.drawOni = function (e) { const h = e && e._hf, age = h ? G.t - h.t : 99;
    if (!h || age < 0 || age >= LIFE || !e._fx3 || e.bb || e.st === 'dead') return d0.apply(this, arguments);
    const q = age / LIFE, a = (1 - q) * (1 - q) * (h.k || 1), pw = h.pw || 1; let im = null; try { im = tint(e._fx3[0], e._fx3[1], h.c); } catch (x) {}
    if (im) sil(e, im, 1.06 + 0.02 * pw, 0.75 * a * (e.alpha === undefined ? 1 : e.alpha), 'source-over');
    const big = e.boss || (e.ratio || 1) > 1.6, sq = big ? 0 : 0.07 * pw * a * Math.cos(age * 0.9), dx = big ? 0 : h.d * 2.2 * pw * a;
    ctx.save(); ctx.translate(e.x + dx, e.y); ctx.scale(1 + sq, 1 - sq); ctx.translate(-e.x, -e.y);
    let r; try { r = d0.apply(this, arguments); } finally { ctx.restore(); }
    if (im && e._fx3) { try { im = tint(e._fx3[0], e._fx3[1], h.c); sil(e, im, 1, 0.55 * a, 'lighter'); } catch (x) {} }
    return r; };
})();
