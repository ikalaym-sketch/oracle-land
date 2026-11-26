/* ==========================================================================
 * 神諭之地 重製版 — 17_menu2.js
 * Version : r3.34.0  （r3.34.0：公開 M.GROUPS；武器分組加「秘傳書」）
 * 舊版    : r3.32.0  （r3.32.0：地圖分組加「結局走向」頁）
 * 舊版    : r3.19.2  （r3.19.2：按鍵頁「斬」右下移；選單左欄滿版貼齊）
 * 舊版    : r3.19.1  （r3.19.1：左欄加寬；子選項改統一方框＋底線樣式）
 * 舊版    : r3.11.0  (2026-11-14)
 * 變更    : r3.11.0 「地圖」群組加入「任務」分頁（53_quest）。
 * 變更    : r3.4.0 子分頁右側加「子選項」列（M.OPTS[頁]：背包部位篩選、修練類別），顏色區分；主分頁寬度隨字體放大。
 * 變更    : r3.1.1 新增。選單改為 6 個主分頁＋上方子分頁（取代左側 11 格）；新增「按鍵」配置頁。
 * 說明    : 主分頁：角色（狀態・職業・修練）／裝備（穿戴・背包）／武器（熟練度・技能・按鍵）／夥伴／地圖／系統（設定・測試）。
 *           其他模組新加的頁（M.TABS 裡沒有被歸類的）自動放進「系統」。
 *           每個主分頁、子分頁、清單列都留圖示格（ICON[key] 之後填圖檔即可，未填＝淡框）。
 *           按鍵頁：左＝與戰鬥畫面相同配置的 9 顆鍵縮圖，點選一顆；右＝該鍵可放的內容。
 *             招式鍵 1–3：每鍵 3 段，連按依序出招（自由搭配、可重複）；第 3 段 ×1.2；冷卻＝鏈中最長的招式，第 1 段出手時開始算。
 * 依賴    : 08_menu（M.PAGE／M.ui）、13_weapons（chain／setChain／setSlot／setM）。只在選單開啟時繪製，不寫存檔（指定時才 markDirty）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU, fs = () => G.FS();
  const GROUPS = [['角色', [['狀態', '角色'], ['職業', '職業'], ['修練', '修練']]], ['裝備', [['穿戴', '裝備'], ['背包', '背包'], ['素材', '素材']]],
    ['武器', [['熟練度', '武器'], ['技能', '技能'], ['按鍵', '按鍵']]], ['夥伴', [['夥伴', '夥伴']]], ['地圖', [['地圖', '地圖'], ['任務', '任務'], ['結局走向', '結局走向']]], ['系統', [['設定', '設定']]]];
  M.GROUPS = GROUPS;   // r3.34.0：給其他模組加子分頁（77 秘傳書）
  const ICON = G.ICON = {};   // 之後：ICON['角色'] = Image；沒有就畫淡框
  function iconBox(key, x, y, s, on) { if (G.drawIcon && G.drawIcon(key, x, y, s, on ? 1 : 0.8)) return;
    ctx.strokeStyle = on ? 'rgba(243,217,138,.55)' : 'rgba(227,194,122,.22)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, s - 1, s - 1, 5); ctx.stroke(); }
  M.iconBox = iconBox;
  const groups = () => { const used = new Set(); GROUPS.forEach(g => g[1].forEach(s => used.add(s[1])));
    const sys = GROUPS[5][1].slice(); for (const t of M.TABS) if (!used.has(t) && M.PAGE[t]) sys.push([t, t]);
    return GROUPS.slice(0, 5).concat([['系統', sys]]); };
  M.grp = 0; M.sub = {}; M.OPTS = M.OPTS || {};
  const show0 = M.show; M.show = function (tab) { show0.call(this); if (typeof tab === 'number') { const n = M.TABS[tab]; groups().forEach((g, i) => g[1].forEach((s, j) => { if (s[1] === n) { M.grp = i; M.sub[i] = j; } })); } };
  M.goto = function (page) { groups().forEach((g, i) => g[1].forEach((s, j) => { if (s[1] === page) { M.grp = i; M.sub[i] = j; } })); };

  M.draw = function () {
    const { button, hit } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.92)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 10 + Math.min(G.SAFE.l, 6), T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, tw = Math.round(116 * Math.max(1, fs() * 0.92)), GS = groups();
    if (M.grp >= GS.length) M.grp = 0;
    const th = Math.min(48 * fs(), (B - T - 8 * (GS.length - 1)) / GS.length);
    GS.forEach(([n], i) => { const y = T + i * (th + 8), on = i === M.grp;
      ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(L, y, tw, th, 9); ctx.fill(); if (on) { ctx.fillStyle = C.gold; ctx.fillRect(L, y + 9, 3, th - 18); }
      const is = Math.min(26, th - 14); iconBox(n, L + 10, y + (th - is) / 2, is, on);
      G.txt(n, L + 16 + is + (tw - 22 - is) / 2, y + th / 2 + 1, 14, on ? C.ink : C.sub, 'center', G.FONT_S, 900); hit(L, y, tw, th, () => { M.grp = i; }); });
    const x = L + tw + 14, w = Rt - x, [gn, subs] = GS[M.grp], si = Math.min(M.sub[M.grp] || 0, subs.length - 1), SH = 34 * fs();
    button(Rt - 84, T, 84, SH, '✕ 返回', () => M.close());
    if (subs.length > 1) { let sx = x; subs.forEach(([lab], j) => { const on = j === si, sw = Math.max(92, 34 + lab.length * 15 * fs());   // 子分頁：上方一排
        ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(sx, T, sw, SH, SH / 2); ctx.fill(); ctx.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; G.rr(sx + .5, T + .5, sw - 1, SH - 1, SH / 2); ctx.stroke();
        iconBox(gn + '/' + lab, sx + 9, T + (SH - 18) / 2, 18, on); G.txt(lab, sx + 34 + (sw - 44) / 2, T + SH / 2 + 1, 13, on ? C.ink : C.sub, 'center', G.FONT_S, 900);
        hit(sx, T, sw, SH, () => { M.sub[M.grp] = j; }); sx += sw + 8; }); }
    else G.txt(gn, x, T + SH / 2, 18, C.gold, 'left', G.FONT_S, 900);
    const page = subs[si][1], OP = M.OPTS[page];
    if (OP) { let ox = subs.length > 1 ? x : x + 70; if (subs.length > 1) subs.forEach(([lab]) => { ox += Math.max(92, 34 + lab.length * 15 * fs()) + 8; });
      ctx.fillStyle = 'rgba(227,194,122,.35)'; ctx.fillRect(ox + 2, T + 6, 1, SH - 12); ox += 12;   // 分隔線
      const L2 = OP.list(), cur = OP.get(), room = Rt - 96 - ox, oh = SH - 4; ctx.font = `900 ${12 * fs()}px ${G.FONT}`;
      let ws = L2.map(([lab]) => ctx.measureText(lab).width + 22); const gap = (L2.length - 1) * 6, tot = ws.reduce((a, b) => a + b, 0) + gap; if (tot > room) { const k = (room - gap) / (tot - gap); ws = ws.map(v => v * k); }
      L2.forEach(([lab, col], j) => { const on = j === cur, ow = ws[j], oy = T + 2;   // 子選項：選中＝實心色塊，未選＝色框
        ctx.fillStyle = on ? 'rgba(120,80,30,.55)' : 'rgba(30,22,26,.92)'; G.rr(ox, oy, ow, oh, 4); ctx.fill(); ctx.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; ctx.lineWidth = on ? 1.6 : 1; G.rr(ox + .5, oy + .5, ow - 1, oh - 1, 4); ctx.stroke();   // r3.19.1：子選項統一方框樣式（不再用不同顏色）
        if (on) { ctx.fillStyle = C.gold; ctx.fillRect(ox + 6, oy + oh - 4, ow - 12, 2); }
        G.txt(lab, ox + ow / 2, oy + oh / 2 + 1, 12, on ? C.ink : C.sub, 'center', G.FONT, 900); hit(ox, oy, ow, oh, () => OP.set(j)); ox += ow + 6; }); }
    const top = T + SH + 12; M.PAGE[page](x, top, w, B - top);
  };

  /* ---------- 按鍵配置 ---------- */
  const KEYDEF = { atk: ['斬', '普攻'], c1: ['招1', '招式鍵 1'], c2: ['招2', '招式鍵 2'], c3: ['招3', '招式鍵 3'], m1: ['身1', '身法 1'], m2: ['身2', '身法 2'], skA: ['技A', '技能 A'], skB: ['技B', '技能 B'], ult: ['奧', '奧義'] };
  const POS = { atk: [0, 0, 40], c1: [180, 76, 22], c2: [135, 76, 22], c3: [90, 76, 22], m1: [196, 146, 23], m2: [168, 150, 23], skA: [132, 150, 24], skB: [104, 146, 24], ult: [72, 140, 24] };
  const short = t => t ? (t.length > 4 ? t.slice(0, 4) : t) : '未設';
  function keyName(k) { const W = G.WPN, wp = W.cur(), sl = W.slots();
    if (k[0] === 'c') { const ch = W.chain(+k[1] - 1), mv = wp.MV[ch[0]]; return mv ? mv.n : null; }
    if (k === 'skA' || k === 'skB') { const s = wp.SK[sl[k === 'skA' ? 'A' : 'B']]; return s ? s.n : null; }
    if (k === 'm1' || k === 'm2') { const b = wp.BD[sl.M[k === 'm1' ? 0 : 1]]; return b ? b.n : null; }
    if (k === 'ult') { const u = W.ult(); return u ? u.n : null; } return '普攻連段'; }
  M.PAGE['按鍵'] = function (x, y, w, h) {
    const { box, button, scrollArea, clip, hit } = M.ui, W = G.WPN, wp = W.cur(), sl = W.slots(), sel = M.sel.key || 'c1';
    const lw = Math.min(330, w * 0.44); box(x, y, lw, h);
    G.txt(wp.n + '　按鍵配置', x + 14, y + 18, 13, C.gold, 'left', G.FONT_S, 900); G.txt('點一顆鍵，右邊選要放的招', x + 14, y + 38, 10, C.dim, 'left', G.FONT, 500);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const k in POS) { const [an, d, r] = POS[k], px = Math.cos(an * Math.PI / 180) * d, py = -Math.sin(an * Math.PI / 180) * d; x0 = Math.min(x0, px - r * 1.15); x1 = Math.max(x1, px + r * 1.15); y0 = Math.min(y0, py - r * 1.15); y1 = Math.max(y1, py + r * 1.15 + 8 + (k === 'atk' ? 16 : 0)); x1 = Math.max(x1, px + r * 1.15 + (k === 'atk' ? 16 : 0)); }
    const aw = lw - 24, ah = h - 62, sc = Math.min(aw / (x1 - x0), ah / (y1 - y0)), cx = x + 12 + (aw - (x1 - x0) * sc) / 2 - x0 * sc, cy = y + 52 + (ah - (y1 - y0) * sc) / 2 - y0 * sc;   // 與戰鬥畫面同配置，縮放到框內
    for (const k in POS) { const [an, d, r] = POS[k], bx = cx + Math.cos(an * Math.PI / 180) * d * sc + (k === 'atk' ? 16 * sc : 0), by = cy - Math.sin(an * Math.PI / 180) * d * sc + (k === 'atk' ? 16 * sc : 0),   /* r3.19.2：斬往右下，不壓到招式點點 */ rr = r * sc * 1.15, on = k === sel, nm = keyName(k);
      ctx.fillStyle = on ? 'rgba(150,92,36,.95)' : 'rgba(30,22,26,.95)'; ctx.beginPath(); ctx.arc(bx, by, rr, 0, 6.283); ctx.fill();
      ctx.strokeStyle = on ? '#fff3cf' : nm ? 'rgba(227,194,122,.7)' : 'rgba(227,194,122,.25)'; ctx.lineWidth = on ? 2.2 : 1; ctx.beginPath(); ctx.arc(bx, by, rr, 0, 6.283); ctx.stroke();
      G.txt(KEYDEF[k][0], bx, by - (k === 'atk' ? 0 : 5 * sc), k === 'atk' ? 16 : 11, on ? C.ink : C.gold, 'center', G.FONT_S, 900);
      if (k !== 'atk') G.txt(short(nm), bx, by + 8 * sc, 9, nm ? C.ink : C.dim, 'center', G.FONT, 700);
      if (k[0] === 'c') { const ch = W.chain(+k[1] - 1); for (let j = 0; j < 3; j++) { ctx.fillStyle = ch[j] ? '#f3d98a' : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(bx - 7 + j * 7, by + rr + 6, 2.3, 0, 6.283); ctx.fill(); } }
      hit(bx - rr, by - rr, rr * 2, rr * 2, () => { M.sel.key = k; M.sel.seg = 0; }); }
    /* 右側 */
    const rx = x + lw + 10, rw = w - lw - 10; box(rx, y, rw, h);
    G.txt(KEYDEF[sel][1], rx + 14, y + 20, 16, C.gold, 'left', G.FONT_S, 900);
    const RH = 44 * fs(), list = (items, isOn, pick, top, empty) => {   // 清單：圖示格＋名稱＋說明
      const off = scrollArea('kl:' + sel, rx, top, rw, y + h - top - 6, Math.max(1, items.length) * RH); clip(rx, top, rw, y + h - top - 6);
      if (!items.length) G.txt(empty, rx + 14, top + 20, 11, C.dim, 'left', G.FONT, 500);
      items.forEach((it, i) => { const yy = top + i * RH + off, on = isOn(it); ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; G.rr(rx + 8, yy + 3, rw - 16, RH - 6, 6); ctx.fill();
        iconBox('mv:' + it.id, rx + 14, yy + 8, RH - 16, on); G.txt(it.n, rx + 22 + RH - 16, yy + RH * 0.36, 13, it.lock ? C.dim : C.ink, 'left', G.FONT_S, 900);
        G.txt(it.sub, rx + 22 + RH - 16, yy + RH * 0.7, 10, it.lock ? C.dim : C.sub, 'left', G.FONT, 500);
        if (!it.lock) hit(rx + 8, Math.max(top, yy + 3), rw - 16, RH - 6, () => pick(it)); });
      ctx.restore(); };
    if (sel[0] === 'c') { const ci = +sel[1] - 1, ch = W.chain(ci), seg = M.sel.seg || 0;
      G.txt('連按依序出 3 段；起手→連接 ×1.1、連接→收尾 ×1.3；照秘傳順序打中，再按一下出秘傳', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      const sw = (rw - 28 - 16) / 3; for (let j = 0; j < 3; j++) { const mv = wp.MV[ch[j]], on = j === seg, sx = rx + 14 + j * (sw + 8), sy = y + 54, sh = 46 * fs();
        ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.95)'; G.rr(sx, sy, sw, sh, 8); ctx.fill(); ctx.strokeStyle = on ? '#fff3cf' : 'rgba(227,194,122,.4)'; G.rr(sx + .5, sy + .5, sw - 1, sh - 1, 8); ctx.stroke();
        G.txt('第 ' + (j + 1) + ' 段', sx + sw / 2, sy + sh * 0.32, 10, on ? C.ink : C.gold, 'center', G.FONT, 700); G.txt(mv ? mv.n : '（空）', sx + sw / 2, sy + sh * 0.7, 12, mv ? C.ink : C.dim, 'center', G.FONT_S, 900);
        hit(sx, sy, sw, sh, () => { M.sel.seg = j; }); }
      const ty = y + 54 + 46 * fs() + 10; button(rx + rw - 96, ty, 82, 28, '清除此段', ch[seg] ? () => W.setChain(ci, seg, null) : null, ch[seg] ? '' : 'off');
      G.txt('選擇第 ' + (seg + 1) + ' 段的招式', rx + 14, ty + 14, 11, C.gold, 'left', G.FONT, 700);
      const items = wp.mv.map(m => ({ id: m.id, n: m.n, lock: !W.mvOk(m), sub: W.mvOk(m) ? ((G.MV2 && G.MV2.CATN[m.cat]) || (m.k === 'guard' ? '架勢' : '攻擊')) + '・冷卻 ' + Math.round(m.cd / 6) / 10 + ' 秒' : '武器熟練 Lv' + m.u + ' 學會' }));
      list(items, it => ch[seg] === it.id, it => { W.setChain(ci, seg, it.id); if (seg < 2 && !ch[seg + 1]) M.sel.seg = seg + 1; }, ty + 36, ''); }
    else if (sel === 'skA' || sel === 'skB') { const slot = sel === 'skA' ? 'A' : 'B';
      G.txt('已學會的「技」「特技」；奧義固定在奧鍵', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      const items = wp.sk.filter(s => s.t !== '奧義').map(s => ({ id: s.id, n: s.n, lock: !W.lv(s.id), sub: W.lv(s.id) ? s.t + '・Lv ' + W.lv(s.id) + (sl.A === s.id ? '・在技A' : sl.B === s.id ? '・在技B' : '') : '未學會（武器 › 技能）' }));
      list(items, it => sl[slot] === it.id, it => W.setSlot(slot, it.id), y + 56, ''); }
    else if (sel === 'm1' || sel === 'm2') { const i = sel === 'm1' ? 0 : 1;
      G.txt('閃身：推搖桿＝往該方向，不推＝後跳', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      const items = wp.body.map(b => ({ id: b.id, n: b.n, lock: false, sub: '冷卻 ' + Math.round(b.cd / 6) / 10 + ' 秒' + (sl.M[0] === b.id ? '・在身1' : sl.M[1] === b.id ? '・在身2' : '') }));
      list(items, it => sl.M[i] === it.id, it => W.setM(i, it.id), y + 56, ''); }
    else if (sel === 'ult') { const u = W.ult(); G.txt(u ? u.n + (W.lv(u.id) ? '　Lv ' + W.lv(u.id) : '　未學會') : '此武器尚無奧義', rx + 14, y + 52, 14, C.ink, 'left', G.FONT_S, 900);
      G.txt('奧義固定，「氣」集滿 100 時可用（熟練度 12＋角色 Lv40 學習）', rx + 14, y + 76, 10, C.sub, 'left', G.FONT, 500); }
    else { G.txt('普攻：連按依序出 ' + wp.combo.length + ' 段，最後一段為終結技', rx + 14, y + 52, 12, C.ink, 'left', G.FONT, 700);
      G.txt('動作隨武器固定，不能更換', rx + 14, y + 76, 10, C.sub, 'left', G.FONT, 500); }
  };
  if (!M.TABS.includes('按鍵')) M.TABS.push('按鍵');
})();
