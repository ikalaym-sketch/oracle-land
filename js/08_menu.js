/* ==========================================================================
 * 神諭之地 重製版 — 08_menu.js
 * Version : r3.99.0  (2026-11-26)　r3.99.0：技能 6～10 級按鈕顯示巔峰點數費用
 * 舊版    : r3.62.0  (2026-11-24)　r3.62.0：角色頁稱號可點選更換、寶珠碎片進度　舊版 r3.57.0  (2026-11-24)  r3.57.0：物品卡說明區可滑動、套裝／靈紋折疊　r3.54.0：巔峰等級　r3.40.0：物品卡加靈紋、套裝 4 件招式、神器招式
 * 舊版    : r3.31.0  （r3.31.0：裝備格圖示依武器道具自己的種類，不再一律顯示目前武器）
 * 舊版    : r3.19.3  （r3.19.3：主角稱號改「流浪劍客」）
 * 舊版    : r3.19.2  （r3.19.2：招式／身法說明更新、鎖定文字改「武器熟練 LvN 學會」、移除開發註記）
 * 舊版    : r3.19.1  （r3.19.1：中欄加寬、右側卡片相對縮小）
 * 舊版    : r3.9.0  (2026-11-13)
 * 變更    : r3.9.0 隱藏夥伴（join_ 旗標）可顯示；沒有頭像時畫名字首字。
 * 變更    : r3.4.0 背包部位篩選移到上方子選項列（17_menu2）；匯出 tile／itemCard 給商店用。
 * 變更    : r3.0.4 技能頁加入招式（12 招，可設招1–3）與身法（可設身法1–2）。
 * 變更    : r3.0.0 武器頁：10 種武器、熟練度、換武器（背景載入）；技能頁：目前武器的技×4／特技×4／奧義（熟練度解鎖、Lv5 質變說明）；
 *           分頁可由其他模組擴充（M.TABS／M.PAGE，例：14_cheat 的「測試」）。
 * 變更    : r2.2.0 角色頁加寶物發現／金錢加成與打造素材數量。
 * 變更    : r2.1.0 夥伴頁分「主線／隱藏」並顯示加入方式；武器頁說明白話化。
 * 說明    : 新版選單（取代舊暫停選單）——左側分頁：角色／裝備／背包／武器／技能／夥伴／設定。
 *           每頁＝左清單＋右「一張資訊卡」，不再把資訊擠在一起。即時模式繪製：每幀重建點擊區 hits，
 *           清單可拖曳捲動；字體大小跟設定連動（G.txt 已套縮放）。
 *           開啟時遊戲暫停；關閉時把變更一次寫入存檔。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, TABS = ['角色', '裝備', '背包', '武器', '技能', '夥伴', '設定'];
  const M = G.MENU = { TABS, open: false, tab: 0, sel: {}, scroll: {}, hits: [], area: null, drag: null, filter: -1,
    show(tab) { this.open = true; if (tab !== undefined) this.tab = tab; G.IN.stick = null; },
    close() { this.open = false; G.SAVE.flush(); }
  };
  const R = () => G.RPG, fs = () => G.FS();
  const hit = (x, y, w, h, f) => M.hits.push({ x, y, w, h, f });
  const C = G.C;
  function box(x, y, w, h, fill, line) { ctx.fillStyle = fill || 'rgba(22,15,19,.94)'; G.rr(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = line || 'rgba(227,194,122,.35)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 8); ctx.stroke(); }
  function button(x, y, w, h, label, f, kind) {
    const on = kind === 'main', off = kind === 'off';
    ctx.fillStyle = on ? 'rgba(150,92,36,.92)' : off ? 'rgba(40,32,36,.7)' : 'rgba(40,28,34,.95)'; G.rr(x, y, w, h, 7); ctx.fill();
    ctx.strokeStyle = off ? 'rgba(227,194,122,.2)' : 'rgba(227,194,122,.7)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 7); ctx.stroke();
    G.txt(label, x + w / 2, y + h / 2 + 1, 13, off ? C.dim : C.ink, 'center', G.FONT, 700); if (!off && f) hit(x, y, w, h, f);
  }
  function tile(x, y, s, it, selected) {   // 裝備小圖示：部位字＋品質色
    const q = it ? R().QUAL[it.q] : null;
    ctx.fillStyle = it ? 'rgba(30,22,26,.95)' : 'rgba(30,22,26,.5)'; G.rr(x, y, s, s, 6); ctx.fill();
    ctx.strokeStyle = selected ? '#fff3cf' : q ? q.c : 'rgba(227,194,122,.2)'; ctx.lineWidth = selected ? 2.2 : 1.2; G.rr(x + 1, y + 1, s - 2, s - 2, 6); ctx.stroke();
    if (it && G.drawIcon && G.drawIcon(R().icon ? R().icon(it) : R().TPL[it.t].slot === 'weapon' ? 'wpn:' + G.WPN.curId() : 'slot_' + R().TPL[it.t].slot, x + 4, y + 4, s - 8)) { if (it.set) { ctx.fillStyle = '#f3d98a'; ctx.beginPath(); ctx.arc(x + s - 7, y + 7, 3, 0, 6.283); ctx.fill(); } }
    else if (it) { G.txt(R().GLYPH[R().TPL[it.t].slot], x + s / 2, y + s / 2 + 1, s * 0.42 / fs(), q.c, 'center', G.FONT_S, 900); if (it.set) { ctx.fillStyle = '#f3d98a'; ctx.beginPath(); ctx.arc(x + s - 7, y + 7, 3, 0, 6.283); ctx.fill(); } }
  }
  /* 可捲動區：回傳 y 偏移；內容高 total */
  function scrollArea(key, x, y, w, h, total) { const max = Math.max(0, total - h); M.scroll[key] = Math.max(0, Math.min(max, M.scroll[key] || 0)); M.area = M.area || []; M.area.push({ key, x, y, w, h, max }); return -M.scroll[key]; }
  function clip(x, y, w, h) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  function statLine(k, v) { const a = R().AFF[k]; return (R().STATN[k] || k) + '　+' + v + (a ? a[2] : ''); }

  M.PAGE = null; M.ui = { box, button, scrollArea, clip, hit, tile, itemCard: (...a) => itemCard(...a) };   // 供 14_cheat 等擴充分頁使用
  /* ---------- 物品資訊卡 ---------- */
  function itemCard(x, y, w, h, it, cmp, actions) {
    box(x, y, w, h); if (!it) { G.txt('（空）', x + w / 2, y + 40, 13, C.dim, 'center'); return; }
    const Rr = R(), t = Rr.TPL[it.t], q = Rr.QUAL[it.q], st = Rr.itemStats(it), L = 18 * fs(); let yy = y + 22;
    tile(x + 14, y + 12, 44 * fs(), it);
    G.txt(Rr.name(it), x + 24 + 44 * fs(), yy, 15, q.c, 'left', G.FONT_S, 900); yy += L;
    G.txt(q.n + '・' + Rr.SLOTN[t.slot] + '・Lv ' + it.lv + '　需求 Lv ' + t.req, x + 24 + 44 * fs(), yy, 11, t.req > Rr.d().lv ? C.red : C.sub, 'left', G.FONT, 500); yy = y + 22 + 44 * fs();
    /* r3.57.0：說明區可上下滑動；套裝、靈紋／招式改成點標題展開（▶／▼），按鈕固定在底部 */
    const top0 = yy - L * 0.6, bh = Math.max(40, y + h - 62 - top0), key = 'card:' + (it.u || 0), off = scrollArea(key, x, top0, w, bh, (M.cardTot && M.cardTot[key]) || 0);
    clip(x, top0, w, bh); yy += off; const y00 = yy, vis = yy2 => yy2 > top0 - 4 && yy2 < top0 + bh + 4, FO = M.fold = M.fold || {};
    const cst = cmp && cmp !== it ? Rr.itemStats(cmp) : null;
    for (const k of Object.keys(st)) { G.txt(statLine(k, st[k]), x + 16, yy, 12, C.ink, 'left', G.FONT, 500);
      if (cst) { const dv = Math.round((st[k] - (cst[k] || 0)) * 10) / 10; if (dv) G.txt((dv > 0 ? '▲' : '▼') + Math.abs(dv), x + w - 16, yy, 12, dv > 0 ? '#8fd38f' : '#e07a6a', 'right', G.FONT, 700); }
      yy += L; }
    if (cst) for (const k of Object.keys(cst)) if (st[k] === undefined) { G.txt((R().STATN[k] || k) + '　▼' + cst[k], x + 16, yy, 12, '#e07a6a', 'left', G.FONT, 500); yy += L; }
    const fold = (id, label, col, body) => { const op = !!FO[id]; yy += 4; G.txt((op ? '▼ ' : '▶ ') + label, x + 16, yy, 12, col, 'left', G.FONT, 700); if (vis(yy)) hit(x + 8, yy - L * 0.6, w - 16, L * 1.2, () => { FO[id] = !op; }); yy += L; if (op) body(); };
    const wr = (t, col) => { for (const l of G.wrap(t, w - 44)) { G.txt(l, x + 22, yy, 11, col, 'left', G.FONT, 500); yy += L * 0.95; } };
    if (it.set) { const S2 = Rr.SETS[it.set], n = (Rr.S.setCount || {})[it.set] || 0;
      fold('set', '套裝【' + S2.n + '】　已穿 ' + n + '／4', '#f3d98a', () => { wr('2 件：' + S2.d2, n >= 2 ? '#f3d98a' : C.dim); wr('4 件：' + S2.d4, n >= 4 ? '#f3d98a' : C.dim); }); }
    if (G.RUNE && G.RUNE.lines) { const RL = G.RUNE.lines(it); if (RL.length) fold('rune', '靈紋・招式（' + RL.length + '）', '#c8a8ff', () => { for (const [t, c] of RL) wr(t, c); }); }
    else if (G.RUNE) yy = G.RUNE.card(it, x, yy, w, L);
    ctx.restore(); (M.cardTot = M.cardTot || {})[key] = yy - y00 + L;
    if ((M.cardTot[key] || 0) > bh) { const sb = bh * bh / M.cardTot[key], sy = top0 + (-off) / (M.cardTot[key] - bh) * (bh - sb); ctx.fillStyle = 'rgba(227,194,122,.35)'; G.rr(x + w - 6, sy, 3, sb, 2); ctx.fill(); }
    G.txt('分解可得　錢 ' + Rr.value(it), x + 16, y + h - 54, 11, C.dim, 'left', G.FONT, 500);
    let bx = x + 14; const bw = (w - 28 - (actions.length - 1) * 8) / Math.max(1, actions.length);
    for (const [label, f, kind] of actions) { button(bx, y + h - 40, bw, 30, label, f, kind); bx += bw + 8; }
  }

  /* ---------- 各分頁 ---------- */
  const PAGE = {
    角色(x, y, w, h) {
      const Rr = R(), d = Rr.d(), S = Rr.S, lw = Math.min(300, w * 0.48);
      box(x, y, lw, h); ctx.save(); G.rr(x + 14, y + 14, 92, 92, 8); ctx.clip(); ctx.fillStyle = '#231a1e'; ctx.fillRect(x + 14, y + 14, 92, 92); ctx.drawImage(G.IMG.face_soma, x + 14, y + 14, 92, 92); ctx.restore();
      G.txt('蒼真', x + 116, y + 30, 18, C.ink, 'left', G.FONT_S, 900); G.txt((G.TITLE ? '「' + G.TITLE.name() + '」 ▸' : '流浪劍客'), x + 116, y + 52, 11, G.TITLE ? '#e3c27a' : C.sub, 'left', G.FONT, 700); if (G.TITLE) hit(x + 112, y + 40, lw - 120, 24, () => G.TITLE.open());   // r3.62.0：稱號（點擊更換）
      G.txt('Lv ' + d.lv + (d.pk ? '　巔峰 ' + d.pk : ''), x + 116, y + 78, 16, C.gold, 'left', G.FONT_S, 900);
      const ey = y + 122, need = Rr.needNow(); G.txt('經驗　' + d.exp + '／' + need, x + 14, ey, 11, C.sub, 'left', G.FONT, 500);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; G.rr(x + 14, ey + 12, lw - 28, 6, 3); ctx.fill(); ctx.fillStyle = C.gold; G.rr(x + 14, ey + 12, (lw - 28) * d.exp / need, 6, 3); ctx.fill();
      G.txt('錢　' + d.gold, x + 14, ey + 40, 13, C.ink, 'left', G.FONT, 700); G.txt('技能點　' + d.sp, x + 14, ey + 62, 13, d.sp ? '#8fd38f' : C.ink, 'left', G.FONT, 700);
      G.txt('「氣」　' + Math.floor(d.qi) + '／100', x + 14, ey + 84, 13, '#f2b8c8', 'left', G.FONT, 700);
      if (G.SHARD && G.SHARD.show()) { const z = G.SHARD.count(); G.txt('寶珠碎片　守 ' + z.safe + '・獻 ' + z.given + '・奪 ' + z.stolen + (z.majin ? '　魔化！' : '　（被奪 ' + G.SHARD.TH + ' 片＝魔化）'), x + 14, ey + 106, 11, z.majin ? '#e0503c' : z.stolen ? '#e8a060' : '#9fd0ff', 'left', G.FONT, 700); }
            const cx = x + lw + 10, cw = w - lw - 10; box(cx, y, cw, h);
      G.txt('屬性', cx + 16, y + 22, 14, C.gold, 'left', G.FONT_S, 900);
      const rows = [['生命', Math.round(S.hp)], ['攻擊', S.atk], ['防禦', S.def], ['會心率', S.crit + '%'], ['會心傷害', S.critD + '%'], ['移動速度', '+' + S.spd + '%'], ['冷卻縮減', S.cdr + '%'], ['吸血', S.ls + '%'], ['寶物發現', '+' + S.mf + '%'], ['金錢加成', '+' + S.gf + '%']];
      const L = 22 * fs(); rows.forEach(([k, v], i) => { const col = i % 2, row = i >> 1, xx = cx + 16 + col * (cw - 32) / 2, yy = y + 50 + row * L;
        G.txt(k, xx, yy, 12, C.sub, 'left', G.FONT, 500); G.txt(String(v), xx + (cw - 32) / 2 - 14, yy, 13, C.ink, 'right', G.FONT, 700); });
      let yy = y + 60 + 5 * L; G.txt('套裝效果', cx + 16, yy, 14, C.gold, 'left', G.FONT_S, 900); yy += 22;
      if (!S.sets.length) G.txt('尚未湊齊任何套裝（稀品以上可能帶套裝）', cx + 16, yy, 11, C.dim, 'left', G.FONT, 500);
      for (const s of S.sets) { G.txt(s, cx + 16, yy, 11, '#f3d98a', 'left', G.FONT, 500); yy += 18 * fs(); }
    },
    裝備(x, y, w, h) {
      const Rr = R(), d = Rr.d(), lw = Math.min(330, w * 0.5), sl = M.sel.slot || 'weapon', ts = 52 * fs();
      box(x, y, lw, h);
      Rr.SLOT.forEach((s, i) => { const tx = x + 12 + (i % 3) * (ts + 22), ty = y + 12 + Math.floor(i / 3) * (ts + 20);
        tile(tx, ty, ts, d.eq[s], s === sl); G.txt(Rr.SLOTN[s], tx + ts / 2, ty + ts + 9, 10, s === sl ? C.gold : C.sub, 'center', G.FONT, 700);
        hit(tx, ty, ts, ts + 14, () => { M.sel.slot = s; M.sel.cand = null; }); });
      const cands = d.bag.map((it, i) => [it, i]).filter(([it]) => Rr.TPL[it.t].slot === sl).sort((a, b) => Rr.power(b[0]) - Rr.power(a[0]));
      const ly = y + 24 + 2 * (ts + 20), lh = h - (ly - y) - 8, RH = 34 * fs();
      G.txt('可替換（' + cands.length + '）', x + 12, ly - 2, 11, C.sub, 'left', G.FONT, 700);
      const off = scrollArea('eq', x, ly + 8, lw, lh - 8, cands.length * RH); clip(x, ly + 8, lw, lh - 8);
      const cur = d.eq[sl] ? Rr.power(d.eq[sl]) : 0;
      cands.forEach(([it, i], k) => { const yy = ly + 8 + k * RH + off; if (yy < ly - RH || yy > y + h) return; const on = M.sel.cand === it.u;
        ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; ctx.fillRect(x + 8, yy + 2, lw - 16, RH - 4);
        G.txt(Rr.name(it), x + 16, yy + RH / 2, 12, Rr.QUAL[it.q].c, 'left', G.FONT, 700); const dp = Rr.power(it) - cur;
        G.txt((dp >= 0 ? '▲' : '▼') + Math.abs(dp), x + lw - 16, yy + RH / 2, 11, dp >= 0 ? '#8fd38f' : '#e07a6a', 'right', G.FONT, 700);
        hit(x + 8, Math.max(yy, ly + 8), lw - 16, RH - 4, () => { M.sel.cand = it.u; }); });
      if (!cands.length) G.txt('背包裡沒有這個部位的裝備', x + lw / 2, ly + 30, 11, C.dim, 'center');
      ctx.restore();
      const ci = d.bag.findIndex(it => it.u === M.sel.cand), cand = ci >= 0 ? d.bag[ci] : null, cx = x + lw + 10, cw = w - lw - 10;
      if (cand) itemCard(cx, y, cw, h, cand, d.eq[sl], [['裝備', () => { if (Rr.equip(ci)) { M.sel.cand = null; G.UI.toast('已裝備'); } }, 'main'], ['分解', () => { const g = Rr.salvage(ci); M.sel.cand = null; G.UI.toast('分解　錢 +' + g); }], ['取消', () => { M.sel.cand = null; }]]);
      else itemCard(cx, y, cw, h, d.eq[sl], null, sl === 'weapon' || !d.eq[sl] ? [] : [['卸下', () => Rr.unequip(sl)]]);
    },
    背包(x, y, w, h) {
      const Rr = R(), d = Rr.d(), lw = Math.min(370, w * 0.56), ts = 44 * fs(), gap = 6, cols = Math.max(3, Math.floor((lw - 20 + gap) / (ts + gap)));
      box(x, y, lw, h);
      const cy0 = y - 22;   // 部位篩選移到上方子選項列（17_menu2 M.OPTS.背包）
      const list = d.bag.map((it, i) => [it, i]).filter(([it]) => M.filter < 0 || Rr.TPL[it.t].slot === Rr.SLOT[M.filter]);
      const gy = cy0 + 32, gh = y + h - gy - 44, rows = Math.ceil(list.length / cols), off = scrollArea('bag', x, gy, lw, gh, rows * (ts + gap));
      clip(x, gy, lw, gh);
      list.forEach(([it, i], k) => { const tx = x + 10 + (k % cols) * (ts + gap), ty = gy + Math.floor(k / cols) * (ts + gap) + off; if (ty > gy + gh || ty + ts < gy) return;
        tile(tx, ty, ts, it, M.sel.bag === it.u); hit(tx, Math.max(ty, gy), ts, ts, () => { M.sel.bag = it.u; }); });
      if (!list.length) G.txt('空空如也。打倒妖怪會掉落裝備。', x + lw / 2, gy + 40, 11, C.dim, 'center');
      ctx.restore();
      G.txt(d.bag.length + '／' + d.bagMax, x + 12, y + h - 22, 11, C.sub, 'left', G.FONT, 700);
      button(x + lw - 150, y + h - 36, 140, 28, '分解凡品・良品', () => { const g = Rr.salvageBelow(1); G.UI.toast(g ? '分解完成　錢 +' + g : '沒有可分解的凡品、良品（套裝不分解）'); });
      const bi = d.bag.findIndex(it => it.u === M.sel.bag), it = bi >= 0 ? d.bag[bi] : null, cx = x + lw + 10, cw = w - lw - 10;
      if (it) itemCard(cx, y, cw, h, it, d.eq[Rr.TPL[it.t].slot], [['裝備', () => { if (Rr.equip(bi)) { M.sel.bag = null; G.UI.toast('已裝備'); } }, 'main'], ['分解', () => { const g = Rr.salvage(bi); M.sel.bag = null; G.UI.toast('分解　錢 +' + g); }]]);
      else { box(cx, y, cw, h); G.txt('點選左側裝備查看', cx + cw / 2, y + h / 2, 12, C.dim, 'center'); }
    },
    武器(x, y, w, h) {
      const W = G.WPN, L = W.LIST, lw = Math.min(300, w * 0.48), RH = 40 * fs(), cur = W.curId();
      if (M.sel.wp === undefined) M.sel.wp = Math.max(0, L.findIndex(q => q.id === cur)); const sel = M.sel.wp; box(x, y, lw, h);
      const off = scrollArea('wp', x, y + 6, lw, h - 12, L.length * RH); clip(x, y + 6, lw, h - 12);
      L.forEach((wp, i) => { const yy = y + 6 + i * RH + off, on = i === sel, p = W.prof(wp.id), use = wp.id === cur;
        ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'transparent'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4);
        G.txt(wp.n, x + 16, yy + RH * 0.38, 14, C.ink, 'left', G.FONT_S, 900); G.txt('熟練 Lv ' + p.lv, x + 16, yy + RH * 0.74, 10, C.sub, 'left', G.FONT, 500);
        if (use) G.txt('使用中', x + lw - 14, yy + RH / 2, 10, C.gold, 'right', G.FONT, 700); else if (W.loading === wp.id) G.txt('載入中', x + lw - 14, yy + RH / 2, 10, C.dim, 'right', G.FONT, 700);
        hit(x + 6, Math.max(yy, y + 6), lw - 12, RH - 4, () => { M.sel.wp = i; }); });
      ctx.restore();
      const wp = L[sel], p = W.prof(wp.id), cx = x + lw + 10, cw = w - lw - 10; box(cx, y, cw, h);
      G.txt(wp.n, cx + 16, y + 26, 20, C.ink, 'left', G.FONT_S, 900); G.txt(wp.style + '　普攻 ' + wp.combo.length + ' 段', cx + 16, y + 52, 12, C.gold, 'left', G.FONT, 700);
      ctx.font = `500 ${12 * fs()}px ${G.FONT}`; let yy = y + 76; G.wrap('特性：' + wp.trait, cw - 32).forEach(l => { G.txt(l, cx + 16, yy, 12, C.ink, 'left', G.FONT, 500); yy += 19 * fs(); });
      yy += 4; const need = W.profNeed(p.lv); G.txt('熟練度 Lv ' + p.lv + '／' + W.PROF_MAX + (p.lv < W.PROF_MAX ? '　' + p.exp + '／' + need : '　已滿'), cx + 16, yy, 12, C.sub, 'left', G.FONT, 700); yy += 12;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; G.rr(cx + 16, yy, cw - 32, 5, 3); ctx.fill(); ctx.fillStyle = C.gold; G.rr(cx + 16, yy, (cw - 32) * (p.lv >= W.PROF_MAX ? 1 : p.exp / need), 5, 3); ctx.fill(); yy += 20;
      for (const s of wp.sk) { if (yy > y + h - 56) break; const ok = p.lv >= s.u; G.txt((ok ? '・' : '－') + s.n + '（' + s.t + '）', cx + 18, yy, 11, ok ? C.ink : C.dim, 'left', G.FONT, 500);
        G.txt(ok ? 'Lv ' + W.lv(s.id, wp.id) : '熟練 ' + s.u, cx + cw - 18, yy, 10, ok ? C.gold : C.dim, 'right', G.FONT, 700); yy += 17 * fs(); }
      const use = wp.id === W.curId();
      button(cx + 14, y + h - 40, cw - 28, 30, use ? '使用中' : W.loading === wp.id ? '載入中…' : '換上' + wp.n, () => W.equip(wp.id), use || W.loading ? 'off' : 'main');
    },
    技能(x, y, w, h) {
      const W = G.WPN, wp = W.cur(), d = R().d(), lw = Math.min(320, w * 0.5), RH = 36 * fs(), sl = W.slots();
      const items = wp.sk.map(s => ({ k: 'sk', o: s })).concat(wp.mv.map(m => ({ k: 'mv', o: m })), wp.body.map(b => ({ k: 'bd', o: b })));
      const key = it => it.k + ':' + it.o.id, cur = items.find(it => key(it) === M.sel.sk2) || items[0];
      box(x, y, lw, h); G.txt(wp.n + '　技能點 ' + d.sp, x + 14, y + 18, 11, d.sp ? '#8fd38f' : C.sub, 'left', G.FONT, 700);
      const off = scrollArea('sk', x, y + 30, lw, h - 34, items.length * RH); clip(x, y + 30, lw, h - 34);
      items.forEach((it, i) => { const yy = y + 30 + i * RH + off, o = it.o, on = it === cur; if (yy < y - RH || yy > y + h) return;
        let lock, sub, tag = '';
        if (it.k === 'sk') { const lv = W.lv(o.id); lock = !W.unlocked(o); sub = o.t + '・' + (lock ? '武器熟練 Lv' + o.u + (o.t === '奧義' ? '＋角色 Lv40' : '') + ' 學會' : lv ? 'Lv ' + lv + '／5' : '可學習'); tag = sl.A === o.id ? '技A' : sl.B === o.id ? '技B' : o.t === '奧義' && lv ? '奧' : ''; }
        else if (it.k === 'mv') { lock = !W.mvOk(o); sub = '招式・' + (lock ? '武器熟練 Lv' + o.u + ' 學會' : 'Lv ' + W.mvLv() + '（跟職業等級）'); const j = sl.C.indexOf(o.id); tag = j >= 0 ? '招' + (j + 1) : ''; }
        else { lock = false; sub = '身法'; const j = sl.M.indexOf(o.id); tag = j >= 0 ? '身' + (j + 1) : ''; }
        ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4);
        G.txt(o.n, x + 16, yy + RH * 0.36, 13, lock ? C.dim : C.ink, 'left', G.FONT_S, 900); G.txt(sub, x + 16, yy + RH * 0.72, 10, lock ? C.dim : C.sub, 'left', G.FONT, 500);
        if (tag) G.txt(tag, x + lw - 16, yy + RH / 2, 11, C.gold, 'right', G.FONT, 900);
        hit(x + 6, Math.max(yy + 2, y + 30), lw - 12, RH - 4, () => { M.sel.sk2 = key(it); }); });
      ctx.restore();
      const o = cur.o, cx = x + lw + 10, cw = w - lw - 10; box(cx, y, cw, h);
      G.txt(o.n, cx + 16, y + 26, 20, C.ink, 'left', G.FONT_S, 900);
      ctx.font = `500 ${12 * fs()}px ${G.FONT}`; let yy = y + 78;
      const para = (t, col) => { G.wrap(t, cw - 32).forEach(l => { G.txt(l, cx + 16, yy, 12, col, 'left', G.FONT, 500); yy += 19 * fs(); }); yy += 4; };
      const by = y + h - 42;
      if (cur.k === 'sk') { const s = o, lv = W.lv(s.id), bw = (cw - 44) / 3, can = W.canLearn(s);
        G.txt(s.t + '　' + (s.t === '奧義' ? '需滿格「氣」' : '冷卻 ' + Math.round(W.cd(s) * 10) / 10 + ' 秒') + '　倍率 ×' + (Math.round(W.mult(s, Math.max(1, lv)) * 100) / 100), cx + 16, y + 52, 12, C.gold, 'left', G.FONT, 700);
        para(s.d, C.ink); para('Lv3–4 進化：' + s.d3, lv >= 3 ? '#8fd38f' : C.sub); para('Lv5 極意：' + s.d5, lv >= 5 ? '#f3d98a' : C.sub); if (lv >= 5) para('Lv6–10（巔峰點數）：每級傷害 +10%；Lv10 極：範圍 +20%、多 1 段、冷卻 −15%', lv >= 10 ? '#f3d98a' : C.sub);
        button(cx + 14, by, bw, 30, lv ? (lv >= 10 ? '已滿' : lv >= 5 ? '升級（巔峰 ' + (W.ppCost ? W.ppCost(lv + 1) : '?') + '）' : '升級') : '學習', () => { if (W.learn(s)) G.UI.toast(s.n + '　Lv ' + W.lv(s.id)); }, can ? 'main' : 'off');
        if (s.t !== '奧義') { button(cx + 22 + bw, by, bw, 30, '設為技A', () => W.setSlot('A', s.id), lv ? '' : 'off'); button(cx + 30 + bw * 2, by, bw, 30, '設為技B', () => W.setSlot('B', s.id), lv ? '' : 'off'); } }
      else if (cur.k === 'mv') { const ok = W.mvOk(o), bw = (cw - 44) / 3;
        G.txt('招式（組合技）　冷卻 ' + Math.round(o.cd / 6) / 10 + ' 秒', cx + 16, y + 52, 12, C.gold, 'left', G.FONT, 700);
        para(o.k === 'guard' ? '架勢型：出招期間被打中會自動格擋並反擊。' : '攻擊型招式，可接在普攻之後。', C.ink);
        para('學會：武器熟練度 ' + o.u + '（同類武器永久共用）', ok ? '#8fd38f' : C.sub); para('招式等級跟著職業等級提升，威力隨等級提高。', C.sub);
        [0, 1, 2].forEach(i => button(cx + 14 + i * (bw + 8), by, bw, 30, '設為招' + (i + 1), () => W.setC(i, o.id), ok ? (sl.C[i] === o.id ? 'main' : '') : 'off')); }
      else { const bw = (cw - 36) / 2;
        G.txt('身法　冷卻 ' + Math.round(o.cd / 6) / 10 + ' 秒', cx + 16, y + 52, 12, C.gold, 'left', G.FONT, 700);
        para({ dodge: '閃身：推搖桿＝往該方向閃身，不推＝後跳。短暫無敵。', backstep: '後跳：往後拉開距離，短暫無敵。', shunpo: '瞬步：高速前衝，穿過敵人時造成傷害。', slide: '滑行：長距離低姿滑步。', utsu: '空蟬：留下替身瞬間離位，長時間無敵。' }[o.id] || '', C.ink);
        para('身法強化請到「角色 › 修練 › 身法」加點。', C.sub);
        [0, 1].forEach(i => button(cx + 14 + i * (bw + 8), by, bw, 30, '設為身法' + (i + 1), () => W.setM(i, o.id), sl.M[i] === o.id ? 'main' : '')); }
    },
    夥伴(x, y, w, h) {
      const Rr = R(), d = Rr.d(), lw = Math.min(300, w * 0.48), RH = 40 * fs(), sel = M.sel.cp || 0, joined = id => id === 'shiro' ? G.SAVE.data.flags.shiroJoin : !!G.SAVE.data.flags['join_' + id] && !!d.comp[id];
      box(x, y, lw, h); const off = scrollArea('cp', x, y + 6, lw, h - 12, Rr.COMP.length * RH); clip(x, y + 6, lw, h - 12);
      Rr.COMP.forEach((c, i) => { const yy = y + 6 + i * RH + off, on = i === sel, j = joined(c.id);
        ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'transparent'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4);
        G.txt(j ? c.n : '？？？', x + 16, yy + RH * 0.38, 14, j ? C.ink : C.dim, 'left', G.FONT_S, 900); G.txt(j ? 'Lv ' + d.comp[c.id].lv : c.hidden ? '隱藏夥伴' : '第' + c.ch + '章加入', x + 16, yy + RH * 0.74, 10, c.hidden ? '#c095f0' : C.sub, 'left', G.FONT, 500);
        hit(x + 6, Math.max(yy, y + 6), lw - 12, RH - 4, () => { M.sel.cp = i; }); });
      ctx.restore();
      const c = Rr.COMP[sel], cx = x + lw + 10, cw = w - lw - 10, j = joined(c.id); box(cx, y, cw, h);
      if (!j) { G.txt('尚未相遇', cx + cw / 2, y + 60, 16, C.dim, 'center', G.FONT_S, 900); G.txt(c.hidden ? '隱藏夥伴' : c.who + '・第' + c.ch + '章加入', cx + cw / 2, y + 88, 12, c.hidden ? '#c095f0' : C.dim, 'center');
        if (c.hidden) { ctx.font = `500 ${12 * fs()}px ${G.FONT}`; G.wrap('加入方式：' + c.hidden, cw - 40).forEach((l, i) => G.txt(l, cx + cw / 2, y + 118 + i * 20 * fs(), 12, C.sub, 'center', G.FONT, 500)); } return; }
      const cd = d.comp[c.id]; ctx.save(); G.rr(cx + 14, y + 14, 80, 80, 8); ctx.clip(); if (G.IMG[c.face]) ctx.drawImage(G.IMG[c.face], cx + 14, y + 14, 80, 80); else { ctx.fillStyle = '#3a2a30'; ctx.fillRect(cx + 14, y + 14, 80, 80); G.txt(c.n[0], cx + 54, y + 56, 34, C.gold, 'center', G.FONT_S, 900); } ctx.restore();
      G.txt(c.n, cx + 106, y + 30, 18, C.ink, 'left', G.FONT_S, 900); G.txt(c.who, cx + 106, y + 52, 11, C.sub, 'left', G.FONT, 500); G.txt('Lv ' + cd.lv, cx + 106, y + 76, 14, C.gold, 'left', G.FONT_S, 900);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; G.rr(cx + 106, y + 86, cw - 122, 5, 3); ctx.fill(); ctx.fillStyle = C.gold; G.rr(cx + 106, y + 86, (cw - 122) * cd.exp / Rr.need(cd.lv), 5, 3); ctx.fill();
      ctx.font = `500 ${12 * fs()}px ${G.FONT}`; let yy = y + 116; G.wrap(c.d, cw - 32).forEach(l => { G.txt(l, cx + 16, yy, 12, C.ink, 'left', G.FONT, 500); yy += 19 * fs(); });
      yy += 6; for (const [n, ds] of c.sk || []) { G.txt(n, cx + 16, yy, 13, C.gold, 'left', G.FONT_S, 900); G.txt(ds, cx + 80, yy, 11, C.sub, 'left', G.FONT, 500); yy += 22 * fs(); }
    },
    設定(x, y, w, h) {
      const S = G.SAVE.data, rows = [
        ['視角', G.ZOOMS[S.zoom].n, () => { S.zoom = (S.zoom + 1) % 3; G.SAVE.markDirty(); }],
        ['對話速度', ['慢', '普通', '快'][S.textSpeed], () => { S.textSpeed = (S.textSpeed + 1) % 3; G.SAVE.markDirty(); }],
        ['字體大小', ['小', '中', '大'][S.font], () => { S.font = (S.font + 1) % 3; G.SAVE.markDirty(); G.UI.layout(); }],
        ['全螢幕', document.fullscreenElement ? '開' : '關', () => G.UI.fullscreen()],
        ['立即存檔', '', () => { S.x = G.H.x; S.y = G.H.y; S.hp = G.H.hp; G.SAVE.markDirty(); G.UI.toast(G.SAVE.flush() ? '已存檔' : '存檔失敗（瀏覽器不允許儲存）'); }],
        ['回到標題', '', () => { M.close(); G.toTitle(); }]];
      const RH = Math.min(44 * fs(), (h - 26) / rows.length - 6), bw = Math.min(420, w);
      rows.forEach(([n, v, f], i) => { const yy = y + i * (RH + 6); box(x, yy, bw, RH); G.txt(n, x + 18, yy + RH / 2 + 1, 14, C.ink, 'left', G.FONT, 700);
        if (v) G.txt(v + '　›', x + bw - 18, yy + RH / 2 + 1, 14, C.gold, 'right', G.FONT, 700); hit(x, yy, bw, RH, f); });
      G.txt('鍵盤：WASD 移動・J 斬・1 2 3 招式・U I 技・K L 身法・O 奧義・E 互動・Esc 選單', x, y + h - 10, 10, C.dim, 'left', G.FONT, 500);
    }
  };

  M.PAGE = PAGE;
  M.draw = function () {
    M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.92)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, tw = 76;
    const n = M.TABS.length, th = Math.min(42 * fs(), (B - T - 6 * (n - 1)) / n);
    M.TABS.forEach((n, i) => { const y = T + i * (th + 6), on = i === M.tab;
      ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(L, y, tw, th, 8); ctx.fill();
      if (on) { ctx.fillStyle = C.gold; ctx.fillRect(L, y + 8, 3, th - 16); }
      G.txt(n, L + tw / 2, y + th / 2 + 1, 14, on ? C.ink : C.sub, 'center', G.FONT_S, 900); hit(L, y, tw, th, () => { M.tab = i; }); });
    const x = L + tw + 12, w = Rt - x;
    if (M.tab >= n) M.tab = 0; G.txt(M.TABS[M.tab], x, T + 12, 18, C.gold, 'left', G.FONT_S, 900);
    button(Rt - 88, T, 88, 28, '✕ 返回', () => M.close());
    PAGE[M.TABS[M.tab]](x, T + 36, w, B - T - 36);
  };
  /* 指標：tap＝放開時位移 < 8；拖曳＝捲動目前區域 */
  M.down = function (p) { const a = (M.area || []).find(a => p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h); M.drag = { x: p.x, y: p.y, moved: 0, a, s0: a ? M.scroll[a.key] || 0 : 0 }; };
  M.move = function (p) { const d = M.drag; if (!d) return; d.moved = Math.max(d.moved, Math.hypot(p.x - d.x, p.y - d.y)); if (d.a) M.scroll[d.a.key] = Math.max(0, Math.min(d.a.max, d.s0 - (p.y - d.y))); };
  M.up = function (p) { const d = M.drag; M.drag = null; if (!d || d.moved > 8) return;
    for (let i = M.hits.length - 1; i >= 0; i--) { const b = M.hits[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.f(); return; } } };
  M.wheel = function (p, dy) { const a = (M.area || []).find(a => p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h); if (a) M.scroll[a.key] = Math.max(0, Math.min(a.max, (M.scroll[a.key] || 0) + dy)); };
})();
