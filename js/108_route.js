/* ==========================================================================
 * 神諭之地 重製版 — 108_route.js
 * Version : r3.66.0  (2026-11-24)
 * 變更    : r3.66.0 新增。兩岸城城南告示牌改成「街道路程圖」畫面（原本是對話選項＋◆／✓ 符號、每頁 5 個）：
 *           ・左：12 章直式木札（可捲動），左側圓印寫章數，右側蓋章表示狀態——朱印「進行中」、墨印「平定」、未開放＝暗木札「未踏」。
 *           ・右：和紙面板——該章地圖縮圖、敵人等級、主線／支線進度、目前任務地點、兩個探索區（可直接出發）。
 *           ・下：主按鈕「出發・地圖名」（右上「離開」）。走進城南範圍時照舊自動開啟。
 *           ・效能：縮圖第一次選到該章時才載入，縮成 320×150 小圖後丟掉原圖（不常駐整張地圖）；清單只在畫面開著時畫。
 * 依賴    : 65_maps（城南觸發→對話開頭「（告示牌上畫著城南街道…」改由本畫面接手）、52_hub（open／done／cur／firstOf／travel／chName）、
 *           98_explore（EXPLORE.EX）、53_quest（Q.L）、08_menu（M.ui）。
 * ========================================================================== */
'use strict';
(function () {
  const M = G.MENU, HUB = G.HUB, ctx = G.ctx, C = G.C; if (!M || !HUB) return;
  const NUM = ['', '壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾', '拾壱', '拾弐'];
  const PAPER = '#e8dcc2', PAPER2 = '#d6c7a6', INK = '#2a1d16', INK2 = '#5b4636', SHU = '#b8322a', GOLD = C.gold;
  const nm = id => ((G.D.scenes[id] || {}).name || '').replace(/^探索・/, '');
  const RT = G.ROUTE = { sel: 1, th: {}, open() { RT.sel = HUB.cur ? Math.min(12, HUB.cur()) : 1; if (!HUB.open(RT.sel)) RT.sel = 1; M.route = 1; M.scroll.route = Math.max(0, (RT.sel - 2) * 64); M.show(); } };
  /* 對話開頭是城南告示牌 → 改開本畫面 */
  const ds0 = G.DLG.start.bind(G.DLG); G.DLG.start = function (list, done) { const L = list && list[0];
    if (L && typeof L.text === 'string' && L.text.indexOf('（告示牌上畫著城南街道') === 0) { RT.open(); return; } return ds0(list, done); };
  const close0 = M.close.bind(M); M.close = function () { M.route = 0; close0(); };
  /* 縮圖：載入一次、縮小後保存 */
  function thumb(id) { const T = RT.th; if (T[id] !== undefined) return T[id]; T[id] = null;
    const mk = img => { const c = document.createElement('canvas'); c.width = 320; c.height = 150; const g = c.getContext('2d'), s = Math.max(320 / img.width, 150 / img.height);
      g.drawImage(img, (320 - img.width * s) / 2, (150 - img.height * s) * 0.4, img.width * s, img.height * s); T[id] = c; };
    if (G.IMG[id]) { mk(G.IMG[id]); return T[id]; }
    const base = (G.EXPLORE && G.EXPLORE.EX[id] && G.EXPLORE.EX[id].b) || id, tryL = ['a/m/' + base + '.webp', 'a/' + base + '.webp'];
    const go = k => { if (k >= tryL.length) { T[id] = false; return; } const i = new Image(); i.onload = () => mk(i); i.onerror = () => go(k + 1); (G.PACK ? G.PACK.src(tryL[k]) : Promise.resolve(tryL[k])).then(s => { i.src = s; }, () => go(k + 1)); };
    go(0); return null; }
  const exOf = c => { const EX = (G.EXPLORE && G.EXPLORE.EX) || {}; return Object.keys(EX).filter(k => EX[k].c === c && G.D.scenes[k]).sort(); };
  function stat(c) { const Q = G.QST, qs = G.SAVE.data.qs || {}, L = Q ? Q.L.filter(q => q.ch === c) : [], mn = L.filter(q => q.main), sd = L.filter(q => !q.main), dn = q => !!(qs[q.id] && qs[q.id].done);
    const spots = []; for (const q of L) { const s = qs[q.id]; if (!s || s.done) continue; const st = q.steps[s.s]; if (st && st.map && G.D.scenes[st.map]) { const n = nm(st.map); if (n && !spots.includes(n)) spots.push(n); } }
    return { m: mn.filter(dn).length, mt: mn.length, s: sd.filter(dn).length, st: sd.length, spots }; }
  function seal(x, y, r, txt, col, fill) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); ctx.globalAlpha = 0.92;
    if (fill) { ctx.fillStyle = col; G.rr(-r, -r * 0.62, r * 2, r * 1.24, 4); ctx.fill(); }
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; G.rr(-r + 2, -r * 0.62 + 2, r * 2 - 4, r * 1.24 - 4, 3); ctx.stroke(); ctx.globalAlpha = 1; ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); G.txt(txt, 0, 1, 11, fill ? '#fbeee0' : col, 'center', G.FONT_S, 900); ctx.restore(); }
  function go(to, c, text) { const L = G.EV && G.EV.bossLock && G.EV.bossLock(); if (L) return G.UI.toast(L); M.close(); HUB.travel(c, text, [], to); }
  const draw0 = M.draw; M.draw = function () { if (!M.route) return draw0.apply(this, arguments); const { box, button, hit, scrollArea, clip } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.95)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * G.FS(), cur = HUB.cur ? HUB.cur() : 1;
    G.txt('城南街道・各地路程', L + 6, T + SH / 2 + 1, 18, GOLD, 'left', G.FONT_S, 900); ctx.font = `900 ${18 * G.FS()}px ${G.FONT_S}`; G.txt('選一個地方出發', L + 20 + ctx.measureText('城南街道・各地路程').width, T + SH / 2 + 2, 11, C.sub, 'left', G.FONT, 600);
    button(Rt - 84, T, 84, SH, '✕ 離開', () => M.close());
    const top = T + SH + 10, h = B - top, lw = Math.min(310, (Rt - L) * 0.42), RH = 58, tot = 12 * (RH + 6) + 8;
    /* 左：木札 */
    const off = scrollArea('route', L, top, lw, h, tot); clip(L, top, lw, h);
    for (let c = 1; c <= 12; c++) { const y = top + 4 + (c - 1) * (RH + 6) + off; if (y > top + h || y + RH < top) continue;
      const op = HUB.open(c) && G.D.scenes[HUB.firstOf(c)], dn = op && HUB.done(c), now = op && c === cur && !dn, on = c === RT.sel;
      const g = ctx.createLinearGradient(L, y, L + lw, y + RH); g.addColorStop(0, op ? '#4a3220' : '#241a14'); g.addColorStop(1, op ? '#2e1f14' : '#17110d');
      ctx.fillStyle = g; G.rr(L + 2, y, lw - 4, RH, 6); ctx.fill();
      ctx.strokeStyle = on ? GOLD : op ? 'rgba(227,194,122,.28)' : 'rgba(227,194,122,.1)'; ctx.lineWidth = on ? 2 : 1; G.rr(L + 2.5, y + .5, lw - 5, RH - 1, 6); ctx.stroke();
      if (on) { ctx.fillStyle = GOLD; ctx.fillRect(L + 2, y + 8, 3, RH - 16); }
      const cx = L + 32, cy = y + RH / 2; ctx.fillStyle = op ? (now ? SHU : dn ? '#3a2a22' : '#5a3e28') : '#1e1612'; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, 6.283); ctx.fill();
      ctx.strokeStyle = op ? 'rgba(243,217,138,.7)' : 'rgba(243,217,138,.15)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 6.283); ctx.stroke();
      G.txt(NUM[c], cx, cy + 1, NUM[c].length > 1 ? 11 : 15, op ? '#fbeee0' : '#5a4a40', 'center', G.FONT_S, 900);
      const nmC = (HUB.chName(c) || '').split('　'); G.txt(nmC[1] || nmC[0], L + 60, y + RH * 0.36, 14, op ? C.ink : '#6a5a50', 'left', G.FONT_S, 900);
      G.txt(op ? nm(HUB.firstOf(c)) : '尚未開放', L + 60, y + RH * 0.7, 10, op ? C.sub : '#5a4a40', 'left', G.FONT, 600);
      if (now) seal(L + lw - 40, cy, 24, '進行中', SHU, true); else if (dn) seal(L + lw - 40, cy, 22, '平定', '#d8c9a8', false); else if (!op) seal(L + lw - 40, cy, 22, '未踏', '#4a3c34', false);
      if (op) hit(L + 2, Math.max(y, top), lw - 4, Math.min(RH, top + h - y), () => { RT.sel = c; }); }
    ctx.restore();
    /* 右：和紙面板 */
    const c = RT.sel, x = L + lw + 10, w = Rt - x, f = HUB.firstOf(c), sd = G.D.scenes[f] || {}, S = stat(c);
    const pg = ctx.createLinearGradient(x, top, x, top + h); pg.addColorStop(0, PAPER); pg.addColorStop(1, PAPER2); ctx.fillStyle = pg; G.rr(x, top, w, h, 8); ctx.fill();
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 3; G.rr(x + 1.5, top + 1.5, w - 3, h - 3, 8); ctx.stroke(); ctx.strokeStyle = 'rgba(107,74,44,.35)'; ctx.lineWidth = 1; G.rr(x + 7.5, top + 7.5, w - 15, h - 15, 5); ctx.stroke();
    const pad = 16, ih = Math.min(118, h * 0.36), iw = w - pad * 2, im = thumb(f);
    ctx.save(); G.rr(x + pad, top + pad, iw, ih, 5); ctx.clip(); if (im) ctx.drawImage(im, x + pad, top + pad, iw, ih); else { ctx.fillStyle = '#b9a988'; ctx.fillRect(x + pad, top + pad, iw, ih); }
    const vg = ctx.createLinearGradient(0, top + pad + ih * 0.45, 0, top + pad + ih); vg.addColorStop(0, 'rgba(20,12,8,0)'); vg.addColorStop(1, 'rgba(20,12,8,.78)'); ctx.fillStyle = vg; ctx.fillRect(x + pad, top + pad, iw, ih); ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,24,.6)'; ctx.lineWidth = 1; G.rr(x + pad + .5, top + pad + .5, iw - 1, ih - 1, 5); ctx.stroke();
    G.txt(HUB.chName(c), x + pad + 12, top + pad + ih - 34, 17, '#fbeee0', 'left', G.FONT_S, 900); G.txt('起點　' + nm(f) + '　｜　敵 Lv ' + (sd.lv || '?'), x + pad + 12, top + pad + ih - 13, 11, '#f0e2c4', 'left', G.FONT, 700);
    let yy = top + pad + ih + 22; const col2 = x + pad + iw / 2;
    G.txt('主線', x + pad, yy, 11, INK2, 'left', G.FONT, 700); G.txt(S.m + '／' + S.mt, x + pad + 36, yy, 13, INK, 'left', G.FONT_S, 900);
    G.txt('支線・委託', col2, yy, 11, INK2, 'left', G.FONT, 700); G.txt(S.s + '／' + S.st, col2 + 70, yy, 13, INK, 'left', G.FONT_S, 900);
    const bar = (bx, by, bw, v) => { ctx.fillStyle = 'rgba(60,40,24,.18)'; G.rr(bx, by, bw, 4, 2); ctx.fill(); ctx.fillStyle = '#8a5a2c'; G.rr(bx, by, Math.max(0.01, bw * v), 4, 2); ctx.fill(); };
    bar(x + pad, yy + 10, iw / 2 - 16, S.mt ? S.m / S.mt : 0); bar(col2, yy + 10, iw / 2, S.st ? S.s / S.st : 0); yy += 30;
    ctx.strokeStyle = 'rgba(107,74,44,.3)'; ctx.beginPath(); ctx.moveTo(x + pad, yy - 6); ctx.lineTo(x + w - pad, yy - 6); ctx.stroke();
    let sp = S.spots.join('、'); ctx.font = `600 ${11 * G.FS()}px ${G.FONT}`; while (sp.length > 4 && ctx.measureText(sp).width > iw - 70) sp = sp.slice(0, -2) + '…';
    G.txt('任務地點', x + pad, yy + 6, 11, INK2, 'left', G.FONT, 700); G.txt(sp || '目前沒有', x + pad + 64, yy + 6, 11, sp ? INK : '#8a7a68', 'left', G.FONT, 600); yy += 26;
    const EXL = exOf(c); G.txt('探索區', x + pad, yy + 12, 11, INK2, 'left', G.FONT, 700);
    const ew = Math.min(170, (iw - 70 - 8) / 2); EXL.slice(0, 2).forEach((id, i) => { const bx = x + pad + 64 + i * (ew + 8), by = yy;
      ctx.fillStyle = 'rgba(255,250,238,.55)'; G.rr(bx, by, ew, 26, 13); ctx.fill(); ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 1; G.rr(bx + .5, by + .5, ew - 1, 25, 13); ctx.stroke();
      G.txt('▸ ' + nm(id), bx + ew / 2, by + 14, 11, INK, 'center', G.FONT_S, 900); hit(bx, by, ew, 26, () => go(id, 0, '你們出了城南，往探索區「' + nm(id) + '」去……')); });
    if (!EXL.length) G.txt('—', x + pad + 64, yy + 12, 11, '#8a7a68', 'left');
    /* 下：出發 */
    const bw = Math.min(340, iw), by = top + h - pad - 40;
    ctx.fillStyle = SHU; G.rr(x + pad, by, bw, 40, 6); ctx.fill(); ctx.strokeStyle = '#6e1a14'; ctx.lineWidth = 1.5; G.rr(x + pad + .5, by + .5, bw - 1, 39, 6); ctx.stroke();
    G.txt('出發・' + nm(f), x + pad + bw / 2, by + 21, 15, '#fbeee0', 'center', G.FONT_S, 900); hit(x + pad, by, bw, 40, () => go(undefined, c, '你們出了城南，沿著街道往「' + nm(f) + '」去……'));
  };
})();
