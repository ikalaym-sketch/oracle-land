/* ==========================================================================
 * 神諭之地 重製版 — 70_ending.js
 * Version : r3.32.0  (2026-11-17)　r3.32.0：等 09_main 載入完成才掛勾（修正偶發錯誤）
 * 舊版    : r3.31.0  (2026-11-17)
 * 變更    : r3.31.0 新增。結局畫面。
 *           ・第 12 章結局台詞播完 → 依結局（真／暴雨／無名）播放結局圖（a/end/*.webp：真 3 張、暴雨 2 張、無名 2 張），每張約 6 秒淡入淡出；
 *             接著捲動名單。點畫面＝下一張／加速名單。
 *           ・名單播完回神社，可以繼續玩（章末回神社的結局後日談會照常播放）。不再跳出舊的「第一章結束」畫面。
 *           ・存檔：flags.endSeen_<結局>、flags.gameClear。
 * 注意    : 09_main 在本檔之後載入，掛勾延到 setTimeout(0)。
 * 依賴    : 09_main（G.MAIN.end、G.step、G.render）、54_story_c（flags.ending）、01_assets（G.ASSET.img）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, F = () => G.SAVE.data.flags;
  const SET = { true: ['true_01', 'true_02', 'true_03'], storm: ['storm_01', 'storm_02'], nameless: ['nameless_01', 'nameless_02'] };
  const TITLE = { true: '真結局・第三條路', storm: '結局・暴雨歸來', nameless: '結局・無名的守護者' };
  const CRED = ['神諭之地', '', '— 劇情 —', '蒼真・小雪・白丸', '颯・葛葉・茨木童子・汐音', '源賴光・建御雷・役小角', '', '— 守護這片土地的妖怪們 —', '鎌鼬・河童・九尾・雷獸', '須佐之男・長壁姬・酒吞童子・綿津見', '', '— 以及所有記得名字的人 —', '', '感謝遊玩'];
  const SL = 360, FD = 60;   // 每張 6 秒、淡入淡出各 1 秒
  const E = G.ENDING = { on: false, k: null, i: 0, t: 0, ph: 'img', cy: 0 };
  const key = n => 'end_' + n;
  function play(k) { k = SET[k] ? k : 'nameless'; Object.assign(E, { on: true, k, i: 0, t: 0, ph: 'img', cy: 0 }); G.mode = 'ending'; G.DLG.list = null; G.MENU.open = false;
    for (const n of SET[k]) if (!G.IMG[key(n)]) G.ASSET.img(key(n), 'a/end/' + n + '.webp?v=' + G.VER); }
  function finish() { const k = E.k; E.on = false; F()['endSeen_' + k] = 1; F().gameClear = 1; G.SAVE.markDirty(); G.SAVE.flush();
    G.mode = 'play'; G.playT = 0; G.SC.trans = { t: 0, to: 'hub_shrine' }; G.UI.banner('旅途仍在繼續', '可以回到各地，或挑戰後山的試煉'); }
  function next() { if (!E.on) return; if (E.ph === 'img') { if (E.t < FD) { E.t = FD; return; } E.i++; E.t = 0; if (E.i >= SET[E.k].length) { E.ph = 'cred'; E.t = 0; } } else E.t += 240; }
  E.play = play; E.next = next;
  /* 原本的結束畫面只留給沒有結局的情況 */
  function install() {   // 09_main 最後才載入，所以等全部腳本載完再掛
  const end0 = G.MAIN.end.bind(G.MAIN); G.MAIN.end = function () { const k = F().ending; if (k && SET[k]) return play(k); return end0(); };
  const st0 = G.step; G.step = function () { if (G.mode !== 'ending') return st0(); G.UI.step(); E.t++;
    if (E.ph === 'img' && E.t >= SL) { E.i++; E.t = 0; if (E.i >= SET[E.k].length) { E.ph = 'cred'; E.t = 0; } }
    else if (E.ph === 'cred' && E.t > CRED.length * 46 + G.LH + 120) finish(); };
  const rd0 = G.render; G.render = function () { if (G.mode !== 'ending') return rd0(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, G.LW, G.LH);
    if (E.ph === 'img') { const n = SET[E.k][E.i], im = G.IMG[key(n)], a = Math.min(1, E.t / FD, (SL - E.t) / FD);
      if (im && im.width) { const s = Math.max(G.LW / im.width, G.LH / im.height) * (1 + E.t / SL * 0.04), w = im.width * s, h = im.height * s;   // 緩慢推近
        ctx.globalAlpha = Math.max(0, a); ctx.drawImage(im, (G.LW - w) / 2, (G.LH - h) / 2, w, h); ctx.globalAlpha = 1; }
      if (E.i === 0) { const ta = Math.max(0, Math.min(1, (E.t - 40) / 40, (SL - E.t) / FD)); ctx.globalAlpha = ta; const g = ctx.createLinearGradient(0, G.LH * 0.7, 0, G.LH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = g; ctx.fillRect(0, G.LH * 0.7, G.LW, G.LH * 0.3);
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 12; G.txt(TITLE[E.k], G.LW / 2, G.LH - 46 - G.SAFE.b, 24, '#f3e7c8', 'center', G.FONT_S, 900); ctx.restore(); ctx.globalAlpha = 1; } }
    else { const y0 = G.LH + 30 - E.t * 0.9; CRED.forEach((l, i) => { const y = y0 + i * 46; if (y < -40 || y > G.LH + 40) return; const big = i === 0 || i === CRED.length - 1;
        G.txt(l, G.LW / 2, y, big ? 30 : 16, /^—/.test(l) ? G.C.gold : '#f3e7c8', 'center', G.FONT_S, big ? 900 : 700); }); }
    G.txt('點一下：下一張', G.LW - 14 - G.SAFE.r, G.LH - 14 - G.SAFE.b, 10, 'rgba(243,231,200,.45)', 'right', G.FONT, 600); };
  }
  (function wait() { if (G.MAIN && G.step && G.render) install(); else setTimeout(wait, 20); })();   /* r3.32.0：09_main 可能還沒下載完，等它載入再掛（原本 setTimeout(0) 偶爾太早） */
  window.addEventListener('pointerdown', () => { if (G.mode === 'ending') next(); });
  window.addEventListener('keydown', e => { if (G.mode === 'ending' && (e.key === ' ' || e.key === 'Enter')) next(); });
})();
