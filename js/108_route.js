/* ==========================================================================
 * 神諭之地 重製版 — 108_route.js
 * Version : r3.168.0  (2026-11-27)　r3.168.0：小地圖可嵌入右上面板（MMAP.draw）
 * 舊版    : r3.166.0  (2026-11-27)　r3.166.0：行旅繪圖右上加「結局走向」切換
 * 舊版    : r3.153.0  (2026-11-27)　r3.153.0：行旅繪圖（點右上小地圖打開；走過的地圖縮圖、可前往）＋右上小地圖＋時雨的委託解鎖自由前往
 * 舊版    : r3.66.0  (2026-11-24)
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
  /* ======================================================================
   * r3.153.0：行旅繪圖（點右上小地圖打開）＋右上小地圖
   * ・左：據點＋12 章木札；右：和紙面板＝該章走過的地圖縮圖（照路線蛇形排列、虛線相連）＋下方資訊與「前往」。
   * ・前往規則：完成時雨的委託前＝據點、安全區、各章第一張；完成後＝走過的地圖都能去。附近有妖怪、頭目戰、波次中不能用。
   * ・小地圖：進圖時把地圖縮成一張小圖（只做一次），每格只畫幾個點。
   * ====================================================================== */
  const F = () => G.SAVE.data.flags, seen = () => G.SAVE.data.seen || (G.SAVE.data.seen = {});
  const HUBL = ['hub_shrine', 'hub_mountain', 'hub_city', 'W_R01_01', 'T_ashihomura', 'W_R05_05', 'T_akebi', 'T_yokai'];
  const free = () => !!(F() && F().atlas);
  const isHub = id => { const d = G.D.scenes[id] || {}; return HUBL.includes(id) || !!(d.safe || d.town); };
  const listOf = c => (c === 0 ? HUBL : HUB.ids(c)).filter(id => G.D.scenes[id]);
  const canGo = (id, c) => seen()[id] && id !== G.SC.id && (free() || isHub(id) || (c > 0 && HUB.firstOf(c) === id));
  function busy() { const L = G.EV && G.EV.bossLock && G.EV.bossLock(); if (L) return L; if (G.QWAVE && G.QWAVE.on) return '妖怪還沒退散，先把牠們打完吧'; if (G.E.some(e => e.st !== 'dead' && e.hp > 0)) return '附近還有妖怪，打完再走吧'; return ''; }
  function qOf(id) { const Q = G.QST, qs = G.SAVE.data.qs || {}; if (!Q) return null; for (const q of Q.L) { const s = qs[q.id]; if (!s || s.done) continue; const st = q.steps[s.s]; if (st && st.map === id) return q; } return null; }
  RT.atlas = function (c) { RT.tab = ''; const here = G.SC.id, hc = HUB.chOf(here); RT.ac = c !== undefined ? c : (isHub(here) && !hc ? 0 : hc || 0); RT.pick = here; M.route = 2; M.scroll.atlasL = Math.max(0, (RT.ac - 2) * 52); M.show(); };
  function goAtlas(id) { const b = busy(); if (b) return G.UI.toast(b); M.close(); HUB.travel(0, '你們循著行旅繪圖，往「' + nm(id) + '」去……', [], id); }
  function tag(x, y, t, col) { ctx.font = `900 ${9 * G.FS()}px ${G.FONT}`; const w = ctx.measureText(t).width + 10; ctx.fillStyle = col; G.rr(x, y, w, 15, 4); ctx.fill(); G.txt(t, x + w / 2, y + 8, 9, '#fbf4e6', 'center', G.FONT, 900); }
  const drawR = M.draw; M.draw = function () { if (M.route !== 2) return drawR.apply(this, arguments); const { button, hit, scrollArea, clip } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.95)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * G.FS(), SN = seen();
    const tot = Object.keys(SN).filter(k => G.D.scenes[k] && (HUB.chOf(k) || isHub(k))).length;
    if (RT.tab === 'fate') G.txt('結局走向', L + 6, T + SH / 2 + 1, 18, GOLD, 'left', G.FONT_S, 900); else { G.txt('行旅繪圖', L + 6, T + SH / 2 + 1, 18, GOLD, 'left', G.FONT_S, 900); ctx.font = `900 ${18 * G.FS()}px ${G.FONT_S}`; G.txt('已走過 ' + tot + ' 個地方', L + 20 + ctx.measureText('行旅繪圖').width, T + SH / 2 + 2, 11, C.sub, 'left', G.FONT, 600); }
    button(Rt - 84, T, 84, SH, '✕ 離開', () => M.close());
    const top = T + SH + 10, h = B - top, lw = Math.min(230, (Rt - L) * 0.3), RH = 46;
    if (G.FATE) { const fa = RT.tab === 'fate'; button(Rt - 84 - 10 - 112, T, 112, SH, fa ? '行旅繪圖' : '結局走向', () => { RT.tab = fa ? '' : 'fate'; });   // r3.166.0：結局走向也放在這裡
      if (fa) { G.FATE.draw(L, top, Rt - L, h); return; } }
    /* 左：據點＋章節木札 */
    const off = scrollArea('atlasL', L, top, lw, h, 13 * (RH + 6) + 8); clip(L, top, lw, h);
    for (let c = 0; c <= 12; c++) { const y = top + 4 + c * (RH + 6) + off; if (y > top + h || y + RH < top) continue;
      const op = c === 0 || (HUB.open(c) && G.D.scenes[HUB.firstOf(c)]), on = c === RT.ac, ids = op ? listOf(c) : [], got = ids.filter(i => SN[i]).length;
      const g = ctx.createLinearGradient(L, y, L + lw, y + RH); g.addColorStop(0, op ? '#4a3220' : '#241a14'); g.addColorStop(1, op ? '#2e1f14' : '#17110d'); ctx.fillStyle = g; G.rr(L + 2, y, lw - 4, RH, 6); ctx.fill();
      ctx.strokeStyle = on ? GOLD : op ? 'rgba(227,194,122,.28)' : 'rgba(227,194,122,.1)'; ctx.lineWidth = on ? 2 : 1; G.rr(L + 2.5, y + .5, lw - 5, RH - 1, 6); ctx.stroke(); if (on) { ctx.fillStyle = GOLD; ctx.fillRect(L + 2, y + 7, 3, RH - 14); }
      const cx = L + 26, cy = y + RH / 2; ctx.fillStyle = op ? (c === 0 ? '#3d5a3a' : '#5a3e28') : '#1e1612'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 6.283); ctx.fill();
      const ch = c === 0 ? '據' : NUM[c]; G.txt(ch, cx, cy + 1, ch.length > 1 ? 9 : 13, op ? '#fbeee0' : '#5a4a40', 'center', G.FONT_S, 900);
      const nmC = c === 0 ? ['據點'] : (HUB.chName(c) || '').split('　'); G.txt(nmC[1] || nmC[0], L + 48, y + RH * 0.38, 13, op ? C.ink : '#6a5a50', 'left', G.FONT_S, 900);
      G.txt(op ? '走過 ' + got + '／' + ids.length : '尚未開放', L + 48, y + RH * 0.72, 10, op ? C.sub : '#5a4a40', 'left', G.FONT, 600);
      if (op) hit(L + 2, Math.max(y, top), lw - 4, Math.min(RH, top + h - y), () => { RT.ac = c; RT.pick = null; }); }
    ctx.restore();
    /* 右：和紙面板 */
    const c = RT.ac, x = L + lw + 10, w = Rt - x, pad = 12, ids = listOf(c);
    const pg = ctx.createLinearGradient(x, top, x, top + h); pg.addColorStop(0, PAPER); pg.addColorStop(1, PAPER2); ctx.fillStyle = pg; G.rr(x, top, w, h, 8); ctx.fill();
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 3; G.rr(x + 1.5, top + 1.5, w - 3, h - 3, 8); ctx.stroke(); ctx.strokeStyle = 'rgba(107,74,44,.35)'; ctx.lineWidth = 1; G.rr(x + 7.5, top + 7.5, w - 15, h - 15, 5); ctx.stroke();
    const fr = free(); ctx.fillStyle = fr ? 'rgba(90,140,80,.18)' : 'rgba(107,74,44,.12)'; G.rr(x + pad, top + pad, w - pad * 2, 22, 5); ctx.fill();
    G.txt(fr ? '走過的地方都能直接前往' : '目前能前往：據點、安全區、各章起點　｜　完成時雨的委託「行旅繪圖」後，走過的地方都能去', x + pad + 8, top + pad + 11.5, 10, fr ? '#2f5a2c' : INK2, 'left', G.FONT, 700);
    if (!RT.pick || !ids.includes(RT.pick)) RT.pick = ids.find(i => SN[i]) || ids[0];
    const COLS = 5, gap = 8, gy = top + pad + 32, bh = 52, cw = (w - pad * 2 - gap * (COLS - 1)) / COLS, rows = Math.max(1, Math.ceil(ids.length / COLS)), avail = top + h - pad - bh - 8 - gy, chh = Math.min(cw * 0.5, avail / rows - 22);
    const pos = ids.map((id, i) => { const r = Math.floor(i / COLS), k = i % COLS, col = r % 2 && c > 0 ? COLS - 1 - k : k; return [x + pad + col * (cw + gap), gy + r * (chh + 22)]; });
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(138,90,44,.7)'; ctx.lineWidth = 2; ctx.beginPath();
    pos.forEach(([px, py], i) => { const X = px + cw / 2, Y = py + chh / 2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); if (c > 0) ctx.stroke(); ctx.restore();
    ids.forEach((id, i) => { const [px, py] = pos[i], d = G.D.scenes[id] || {}, vis = !!SN[id], here = id === G.SC.id, ok = canGo(id, c), pk = id === RT.pick, q = vis && qOf(id);
      ctx.fillStyle = pk ? SHU : '#5a3e28'; G.rr(px - 2, py - 2, cw + 4, chh + 4, 5); ctx.fill();
      ctx.save(); G.rr(px, py, cw, chh, 4); ctx.clip(); const im = vis ? thumb(id) : null;
      if (im) { const s2 = Math.max(cw / im.width, chh / im.height); ctx.drawImage(im, px + (cw - im.width * s2) / 2, py + (chh - im.height * s2) / 2, im.width * s2, im.height * s2); } else { ctx.fillStyle = vis ? '#b9a988' : '#6a5e52'; ctx.fillRect(px, py, cw, chh); }
      if (vis && !ok && !here) { ctx.fillStyle = 'rgba(232,220,194,.45)'; ctx.fillRect(px, py, cw, chh); } ctx.restore();
      if (here) { ctx.strokeStyle = '#4aa0e0'; ctx.lineWidth = 2.5; G.rr(px - 1, py - 1, cw + 2, chh + 2, 5); ctx.stroke(); }
      if (!vis) G.txt('未踏', px + cw / 2, py + chh / 2 + 1, 14, '#efe6d4', 'center', G.FONT_S, 900);
      else { let tx = px + 4; const T2 = (t, col) => { tag(tx, py + 4, t, col); ctx.font = `900 ${9 * G.FS()}px ${G.FONT}`; tx += ctx.measureText(t).width + 13; };
        if (here) T2('現在', '#3478b8'); if (isHub(id)) T2(id === 'hub_city' ? '城' : '安全區', '#4a7a46'); if (d.boss) T2('頭目', '#a8302a'); if (q) T2(q.main ? '主線' : '任務', '#b8862a'); }
      ctx.font = `900 ${11 * G.FS()}px ${G.FONT_S}`; let n = vis ? nm(id) : '？？？'; while (n.length > 2 && ctx.measureText(n).width > cw - (vis && !here ? 42 : 2)) n = n.slice(0, -1);
      G.txt(n, px + 1, py + chh + 10, 11, vis ? INK : '#9a8a78', 'left', G.FONT_S, 900);
      if (vis && !here) G.txt(ok ? '可前往' : '未解鎖', px + cw, py + chh + 10, 9, ok ? '#3f7a3a' : '#9a8a78', 'right', G.FONT, 700);
      hit(px, py, cw, chh + 18, () => { RT.pick = id; }); });
    /* 下：資訊＋前往 */
    const by = top + h - pad - bh, id = RT.pick, d = G.D.scenes[id] || {}, vis = !!SN[id], q = vis && qOf(id), mt = (G.WORLD.meta || {})[id] || {};
    ctx.strokeStyle = 'rgba(107,74,44,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + pad, by - 4); ctx.lineTo(x + w - pad, by - 4); ctx.stroke();
    const bw = Math.min(200, w * 0.34), bx = x + w - pad - bw;
    G.txt(vis ? nm(id) : '？？？', x + pad + 2, by + 14, 15, INK, 'left', G.FONT_S, 900);
    const info = !vis ? '還沒走到這裡' : isHub(id) ? '安全區・可以休息、補給' : '區域 Lv ' + (mt.lv || d.lv || '?') + (d.boss ? '　有頭目' : '');
    G.txt(info, x + pad + 2, by + 33, 10, INK2, 'left', G.FONT, 600); if (q) G.txt('◆ ' + (q.main ? '主線' : '委託') + '「' + q.title + '」在這裡', x + pad + 2, by + 47, 10, '#9a6a1c', 'left', G.FONT, 700);
    const ok = vis && canGo(id, c), here = id === G.SC.id;
    ctx.fillStyle = ok ? SHU : 'rgba(107,90,70,.45)'; G.rr(bx, by + 6, bw, 38, 6); ctx.fill();
    G.txt(here ? '你在這裡' : ok ? '前往・' + nm(id) : vis ? '完成委託後才能前往' : '還沒走過', bx + bw / 2, by + 26, ok ? 13 : 11, '#fbeee0', 'center', G.FONT_S, 900);
    if (ok) hit(bx, by + 6, bw, 38, () => goAtlas(id));
  };
  /* ---------- 右上小地圖 ---------- */
  const MM = G.MMAP = { box: null, id: null, cv: null };
  function build(id) { const img = G.SC.img, d = G.SC.def; MM.id = id; MM.cv = null; if (!img || !img.width || !d) return;
    const y0 = Math.max(0, G.SC.y0 - 60), y1 = Math.min(d.h, G.SC.y1 + 20), sx = img.width / d.w, W = 300, Hh = Math.round(Math.max(56, Math.min(110, W * (y1 - y0) / d.w)));
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = Hh; c2.getContext('2d').drawImage(img, 0, y0 * sx, img.width, (y1 - y0) * sx, 0, 0, W, Hh); MM.cv = c2; MM.y0 = y0; MM.y1 = y1; }
  const show = () => G.mode === 'play' && !G.MENU.open && !G.DLG.active() && !(G.STORY && G.STORY.cut) && G.SC.def && !G.SC.trans && !HUB.card;
  MM.show = show; MM.draw = (x, y, w, h) => { try { return mini(x, y, w, h); } catch (e) { console.warn('mmap', e); } };   // r3.168.0：給右上面板畫
  const udM = G.UI.draw; G.UI.draw = function () { MM.box = null; if (show() && !G.HUD2) try { mini(); } catch (e) { console.warn('mmap', e); } udM.apply(this, arguments); };
  function mini(rx, ry, rw, rh) { const B = G.UI.B, d = G.SC.def; if (!B || !B.menu) return; if (MM.id !== G.SC.id || !MM.cv) { if (MM.id !== G.SC.id || G.t % 30 === 0) build(G.SC.id); if (!MM.cv) return; }
    const emb = rx !== undefined, w = emb ? rw : 150, h = emb ? Math.min(rh, rw * MM.cv.height / MM.cv.width) : MM.cv.height / 2, x = emb ? rx : B.menu.x + B.menu.w - w, y = emb ? ry + (rh - h) / 2 : B.menu.y + B.menu.h + 22, X = v => x + w * v / d.w, Y = v => y + h * Math.max(0, Math.min(1, (v - MM.y0) / (MM.y1 - MM.y0)));
    if (!emb) { ctx.fillStyle = 'rgba(12,8,10,.78)'; G.rr(x - 4, y - 18, w + 8, h + 22, 7); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.55)'; ctx.lineWidth = 1; G.rr(x - 3.5, y - 17.5, w + 7, h + 21, 7); ctx.stroke();
    G.txt(nm(G.SC.id), x, y - 9, 10, GOLD, 'left', G.FONT_S, 900); } ctx.globalAlpha = 0.9; ctx.drawImage(MM.cv, x, y, w, h); ctx.globalAlpha = 1;
    const v = G.SC.view(), cx = G.SC.cam.x; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1; ctx.strokeRect(Math.max(x, X(cx - v.vw / 2)) + .5, y + .5, Math.min(w, X(cx + v.vw / 2) - Math.max(x, X(cx - v.vw / 2))) - 1, h - 1);
    for (const p of d.portals || []) { const px = p.line ? p.line[0][0] : p.rect ? p.rect[0] : p.x; if (px === undefined) continue; const L2 = px < d.w / 2, ax = L2 ? x + 3 : x + w - 3, ay = p.line ? Y((p.line[0][1] + p.line[1][1]) / 2) : y + h / 2;
      ctx.fillStyle = '#8fd38f'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (L2 ? 6 : -6), ay - 4); ctx.lineTo(ax + (L2 ? 6 : -6), ay + 4); ctx.fill(); }
    for (const e of G.E) { if (e.st === 'dead' || e.hp <= 0 || e.x < 0 || e.x > d.w) continue; const r = e.elite || e.boss ? 3.2 : 2.2; ctx.fillStyle = '#e8584a'; ctx.beginPath(); ctx.arc(X(e.x), Y(e.y), r, 0, 6.283); ctx.fill(); }
    const tg = G.STORY.target && G.STORY.target(); if (tg && tg.x >= 0 && tg.x <= d.w) { const tx = X(tg.x), ty = Y(tg.y); ctx.fillStyle = '#f3d98a'; ctx.beginPath(); ctx.moveTo(tx, ty - 5); ctx.lineTo(tx + 4, ty); ctx.lineTo(tx, ty + 5); ctx.lineTo(tx - 4, ty); ctx.fill(); }
    const hx = X(G.H.x), hy = Y(G.H.y); ctx.fillStyle = '#7ec8ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, 6.283); ctx.fill(); ctx.stroke();
    MM.box = emb ? { x, y, w, h } : { x: x - 4, y: y - 18, w: w + 8, h: h + 22 }; return h; }
  /* ---------- 時雨的委託：完成後解鎖「走過的地方都能去」 ---------- */
  const Q = G.QST, say = (who, text) => ({ who, text });
  if (Q && Q.add) Q.add({ id: 'side_atlas', ch: 2, after: 'c2_after', title: '行旅繪圖', desc: '傳送役時雨想畫一份各地的行旅繪圖。', reward: { exp: 160, gold: 150 },
    giver: { map: 'hub_city', at: 'center', dx: 120, u: 'n_t_human_clerk', name: '傳送役・時雨', lines: [say('時雨', '蒼真大人，各地的路越來越亂，連驛馬都常走錯。'), say('時雨', '我想畫一份行旅繪圖，把走過的路都記下來。'), say('時雨', '能幫我到兩個地方立測量樁嗎？畫好之後，您走過的地方都能直接送您過去。')] },
    steps: [{ t: 'look', map: 'W_R01_04', at: 'center', label: '立測量樁', text: '到竹海舊社立測量樁', lines: [say('蒼真', '（把時雨給的測量樁插進土裡，記下四周的地形。）')] },
      { t: 'look', map: 'W_R02_01', at: 'center', label: '立測量樁', text: '到共岸河堤立測量樁', lines: [say('蒼真', '（河堤的風很大，測量樁插深一點才站得穩。）')] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 120, u: 'n_t_human_clerk', name: '傳送役・時雨', text: '把記錄交給時雨', lines: [say('時雨', '辛苦了！有了這兩根樁，整張繪圖就對得起來了。'), say('時雨', '以後點右上的小地圖，就能打開行旅繪圖。走過的地方，都能直接前往。')] }],
    done() { F().atlas = 1; G.SAVE.markDirty(); G.UI.banner('行旅繪圖', '走過的地方都能直接前往'); } });
})();
