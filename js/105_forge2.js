/* ==========================================================================
 * 神諭之地 重製版 — 105_forge2.js
 * Version : r3.147.0  (2026-11-27)　r3.147.0：批次賣出／分解視窗加 ✕，點視窗外也會關閉
 * 舊版    : r3.101.0  (2026-11-26)　r3.101.0：強化改制：+1～20 每級 +4%、+21～50 每級 +2%（只加攻防血，詞條不成長）；里程碑 +10／+30 孔、+20 極壹、+40 極貳、+50 神鍛；+21 起失敗掉級
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：極 +10% 改增傷區（G.DZ）
 * 舊版    : r3.63.0  (2026-11-24)
 * 變更    : r3.63.0 新增。強化／賣出分解／商店補強。
 *           1. 強化改成倍率成長：攻擊、防禦、生命 ×1.0665^等級（+10≈1.9 倍、+25≈5 倍）；百分比詞條每級 +2%。
 *              里程碑：+5 詞條 +10%／+10 多一孔（原有）／+15 多一條詞條／+20 靈紋 +1 級（最高 3）／+25「極」覺醒（武器傷害 +10%、無視 30% 防禦；防具每件受傷 −3%）。
 *              +11 起要精煉石；+16 起失敗會掉 1 級（用保護符就不掉）；幸運符成功率 +20%。強化頁顯示強化前後數值與下一個里程碑。
 *           2. 批次賣出／分解：品質 6 種、等級（全部／低 5／低 10／低 20）、部位、只選比身上弱、含套裝、含強化過；賣錢或分解（分解給精煉石）。
 *              含傳說／神話時要再按一次確認；鎖定的裝備永遠不會被選到。可開「背包滿時自動賣普通／良品」。
 *           3. 商店：鍛冶舖賣精煉石、保護符、幸運符；行商可殺價一次（7 折或漲 1 成）。
 *           ・效能：批次清單只在面板開啟、條件改變時重算；強化數值在 itemStats 內算（沿用原本呼叫時機）。
 * 存檔    : 物品 it.en（等級）、it.affX（+15 追加詞條）；rpg.fm { stone, guard, luck }、rpg.autoSell；rpg.shop[peddler_*].disc。
 * 依賴    : 58_forge（F.ui、enhance 委派、itemStats）、21_shop（sellPage→F.sellBar、S.xrows、S.disc）、88_rune（+20 靈紋）、07_rpg。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, F = G.FORGE, S = G.SHOP, M = G.MENU, ctx = G.ctx; if (!R || !F || !F.ui) return;
  const U = F.ui, rd = () => R.d(), dirty = () => G.SAVE.markDirty(), fm = () => rd().fm || (rd().fm = { stone: 0, guard: 0, luck: 0 });
  const MAIN = { atk: 1, def: 1, hp: 1 }, mulOf = en => { en = en || 0; return 1 + 0.04 * Math.min(en, 20) + 0.02 * Math.max(0, en - 20); }, pctOf = () => 1;   // r3.101.0：+1～20 每級 +4%、+21～50 每級 +2%；只加攻防血，詞條不隨強化成長
  /* ---------- 1. 數值 ---------- */
  const is58 = R.itemStats; R.itemStats = function (it) { const en = it.en || 0; if (!en && !it.affX) return is58(it);
    const b = is58(Object.assign({}, it, { en: 0, sock: [], aff: it.affX ? it.aff.concat([it.affX]) : it.aff })), b0 = is58(Object.assign({}, it, { en: 0, sock: [], aff: [] })), m = mulOf(en), o = {};
    for (const k in b) o[k] = b[k] + (MAIN[k] ? (b0[k] || 0) * (m - 1) : 0);   // r3.101.0：只有裝備基礎的攻防血吃強化倍率，詞條不成長
    for (const g of it.sock || []) if (g) { const [ty, t] = g.split(':'); o[ty] = (o[ty] || 0) + F.GEMS[ty][1] * +t; }
    for (const k in o) o[k] = Math.round(o[k] * 10) / 10; return o; };
  const tierOf = en => (en || 0) >= 50 ? 3 : (en || 0) >= 40 ? 2 : (en || 0) >= 20 ? 1 : 0, TN = ['', '極・', '極貳・', '神鍛・'];
  const nm0 = R.name; R.name = it => (it ? TN[tierOf(it.en)] : '') + nm0(it);
  /* +25 極：武器傷害 +10%、無視 30% 防禦；防具每件受傷 −3% */
  const kyoku = () => { const d = rd(); let w = 0, a = 0; for (const s in d.eq || {}) { const it = d.eq[s]; if (it) { const t = tierOf(it.en); if (s === 'weapon') w = t; else a += t; } } return { w, a }; };
  let KY = { w: 0, a: 0 }; const rc0 = R.recalc.bind(R); R.recalc = function () { const r = rc0.apply(this, arguments); KY = kyoku(); return r; };
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (KY.w && e && !(opt && (opt.party || opt.rune)) && !e.kz) { G.DZ.add(0.05 * KY.w); if (KY.w >= 3) { opt = Object.assign({}, opt || {}); opt.ign = Math.max(opt.ign || 0, 30); } } return do0.call(this, e, mult, big, fc, opt); };
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { if (KY.a) atk *= 1 - 0.01 * KY.a; return hh0.call(this, atk, srcX); };
  /* ---------- 2. 強化 ---------- */
  const MK = Object.keys(R.MATS), matOf = it => MK[(R.SLOT.indexOf(R.TPL[it.t].slot) + it.lv) % MK.length];
  const F2 = G.FORGE2 = { useG: false, useL: false, mul: mulOf, pct: pctOf,
    cost(it) { const n = (it.en || 0) + 1; return { g: Math.round(60 * n * (1 + it.lv / 10) * (n > 20 ? 1.6 : 1) * (n > 40 ? 1.6 : 1)), m: { [matOf(it)]: 2 * n }, st: n > 10 ? Math.ceil((n - 10) / 2) : 0 }; },
    rate(it) { const n = (it.en || 0) + 1; let r = n <= 10 ? 1 : n <= 20 ? 0.9 - 0.04 * (n - 11) : n <= 30 ? 0.5 - 0.02 * (n - 21) : n <= 40 ? 0.3 - 0.01 * (n - 31) : 0.2 - 0.008 * (n - 41);
      r += 0.1 * (it.fail || 0) + 0.02 * Math.max(0, F.shopLv('smith') - 5) + (F2.useL && fm().luck > 0 ? 0.2 : 0); return Math.min(1, r); },
    enhance(it) { if ((it.en || 0) >= F.enCap()) return G.UI.toast('已達鍛冶舖強化上限 +' + F.enCap()); const c = F2.cost(it), d = rd(), f = fm();
      if (d.gold < c.g) return G.UI.toast('錢不夠（需要 ' + c.g + '）'); for (const k in c.m) if ((d.mats[k] || 0) < c.m[k]) return G.UI.toast(R.MATS[k].n + '不夠（需要 ' + c.m[k] + '）');
      if (f.stone < c.st) return G.UI.toast('精煉石不夠（需要 ' + c.st + '，分解裝備或在鍛冶舖購買）');
      const r = F2.rate(it); d.gold -= c.g; for (const k in c.m) d.mats[k] -= c.m[k]; f.stone -= c.st; if (F2.useL && f.luck > 0) f.luck--;
      if (Math.random() < r) { it.en = (it.en || 0) + 1; it.fail = 0; milestone(it); G.UI.toast('強化成功　' + R.name(it)); }
      else { it.fail = (it.fail || 0) + 1; const n = (it.en || 0) + 1;
        if (n > 20) { if (F2.useG && f.guard > 0) { f.guard--; G.UI.toast('強化失敗——保護符碎了，裝備沒有掉級'); } else { it.en--; G.UI.toast('強化失敗，掉到 +' + it.en + '（下次成功率提高）'); } }
        else G.UI.toast('強化失敗（下次成功率提高）'); }
      R.recalc(); dirty(); },
    info(it, x, y, w, h) { const en = it.en || 0, n = en + 1, cap = en >= F.enCap(), sl = R.TPL[it.t].slot, k = sl === 'weapon' ? 'atk' : 'def', b = R.itemStats(it)[k] || 0;
      const nx = R.itemStats(Object.assign({}, it, { en: Math.min(n, 50) }))[k] || 0, f = fm(), MS = { 10: '多一個孔', 20: '極壹（靈紋 +1）', 30: '多一個孔', 40: '極貳', 50: '神鍛' };
      const nextM = [10, 20, 30, 40, 50].find(q => q > en);
      const bw = 84, tw = w - bw * 2 - 30; U.panel(x, y, w, h, false); ctx.save(); ctx.beginPath(); ctx.rect(x, y, tw + 10, h); ctx.clip();
      U.T(cap ? '已達強化上限 +' + F.enCap() : R.STATN[k] + ' ' + Math.round(b) + ' → ' + Math.round(nx) + '　×' + mulOf(n).toFixed(2), x + 10, y + 12, 12, U.GOLD);
      U.T((nextM ? '+' + nextM + '：' + MS[nextM] : '已全部覺醒') + (n > 10 ? '・精煉石 ' + f.stone : ''), x + 10, y + h - 10, 10, U.DIM);
      if (n > 20 && !cap) U.T('失敗掉 1 級', x + tw + 4, y + h - 10, 10, U.BAD, 'right'); ctx.restore();
      const bx = x + w - bw * 2 - 12; [['G', '保護符', f.guard], ['L', '幸運符', f.luck]].forEach(([q, t, c], i) => { const on = q === 'G' ? F2.useG : F2.useL, xx = bx + i * (bw + 6);
        U.panel(xx, y + 3, bw, h - 6, on && c > 0); U.T((on && c > 0 ? '☑ ' : '☐ ') + t + ' ' + c, xx + bw / 2, y + h / 2, 11, c ? (on ? U.GOLD : U.INK) : U.DIM, 'center');
        M.ui.hit(xx, y + 3, bw, h - 6, () => { if (!c) return G.UI.toast(t + '：鍛冶舖有賣'); if (q === 'G') F2.useG = !F2.useG; else F2.useL = !F2.useL; }); }); } };
  function milestone(it) { const en = it.en, wp = R.TPL[it.t].slot === 'weapon';   // r3.101.0：新里程碑
    if (en === 10 || en === 30) G.UI.banner('強化 +' + en, '可以多打一個孔');
    if (en === 20) G.UI.banner('「極壹」', (wp ? '武器傷害 +5%' : '受到的傷害 −1%') + '・靈紋 +1 級');
    if (en === 40) G.UI.banner('「極貳」', wp ? '武器傷害 +10%' : '受到的傷害 −2%');
    if (en === 50) G.UI.banner('「神鍛」', wp ? '武器傷害 +15%、無視 30% 防禦' : '受到的傷害 −3%'); }
  /* +15 追加詞條也顯示在物品卡 */
  (function hl() { if (!G.RUNE || !G.RUNE.lines) return setTimeout(hl, 50); const l0 = G.RUNE.lines; G.RUNE.lines = function (it) { const L = l0.apply(this, arguments) || [];
      if (it && it.affX) L.unshift(['◆ +15 追加詞條：' + R.AFF[it.affX[0]][0] + ' +' + it.affX[1], '#ffd27a']); if (it && (it.en || 0) >= 20 && it.rn) L.unshift(['◆ +20：靈紋各 +1 級', '#c8a8ff']); return L; }; })();
  /* ---------- 3. 分解給精煉石 ---------- */
  const STQ = [0, 0, 1, 2, 4, 8], stOf = it => STQ[it.q] + Math.floor((it.en || 0) / 5);
  const sv0 = R.salvage.bind(R); R.salvage = function (i) { const it = rd().bag[i]; const g = sv0(i); if (g && it && F2.salvNow) { const n = stOf(it); fm().stone += n; } return g; };
  /* ---------- 4. 批次面板 ---------- */
  const B = F2.batch = { on: false, q: { 0: 1, 1: 1, 2: 1 }, lv: 0, sl: {}, weak: false, set: false, en: false, mode: 'sell', arm: 0 };
  const power = it => { if (!it) return 0; const s = R.itemStats(it); return (s.atk || 0) * 3 + (s.def || 0) * 2 + (s.hp || 0) * 0.3 + (s.crit || 0) * 8 + (s.critD || 0) * 2; };
  function pick() { const d = rd(), lvH = d.lv, LV = [0, 5, 10, 20][B.lv], anySl = !Object.values(B.sl).some(Boolean);
    return d.bag.filter(it => !it.lk && B.q[it.q] && (B.set || !it.set) && (B.en || !it.en) && !it.uq && (!LV || it.lv <= lvH - LV) && (anySl || B.sl[R.TPL[it.t].slot]) && (!B.weak || power(it) < power(d.eq[R.TPL[it.t].slot]))); }
  function doBatch() { const d = rd(), L = pick(); if (!L.length) return; if (L.some(it => it.q >= 4) && !B.arm) { B.arm = 1; return G.UI.toast('裡面有傳說／神話裝備，再按一次確認'); }
    let g = 0, st = 0; F2.salvNow = B.mode === 'salv'; for (const it of L) { const i = d.bag.indexOf(it); if (i < 0) continue; if (F2.salvNow) st += stOf(it); g += R.salvage(i); }
    F2.salvNow = false; B.arm = 0; dirty(); G.UI.toast((B.mode === 'salv' ? '分解 ' : '賣出 ') + L.length + ' 件　錢 +' + g + (B.mode === 'salv' ? '　精煉石 +' + st : '')); }
  F.sellBar = function (L, y, w) { const d = rd(), n = d.bag.filter(it => it.lk).length;
    U.act(L + 10, y - 4, w - 20, 40, '批次賣出／分解…', '依品質、等級、部位篩選' + (n ? '・鎖定 ' + n + ' 件不會被選到' : ''), () => { B.on = true; B.arm = 0; }, true, true); };
  function drawBatch() { const { box } = M.ui, d = rd(), w = Math.min(620, G.LW - 40), h = Math.min(330, G.LH - 30), x = (G.LW - w) / 2, y = (G.LH - h) / 2, L = pick();
    ctx.fillStyle = 'rgba(5,3,6,.7)'; ctx.fillRect(0, 0, G.LW, G.LH); M.hits = [{ x: 0, y: 0, w: G.LW, h: G.LH, f: () => { B.on = false; } }]; box(x, y, w, h); M.hits.push({ x, y, w, h, f: () => {} });   /* r3.147.0：點視窗外關閉 */
    M.ui.button(x + w - 44, y + 8, 34, 28, '✕', () => { B.on = false; });
    U.T('批次' + (B.mode === 'salv' ? '分解' : '賣出'), x + 16, y + 22, 16, U.GOLD, 'left', G.FONT_S);
    U.chips(x + w - 190, y + 8, 136, [['sell', '賣錢'], ['salv', '分解']], k => B.mode === k, k => { B.mode = k; B.arm = 0; }, 28);
    const lab = (t, yy) => U.T(t, x + 16, yy + 14, 11, U.DIM); let yy = y + 44;
    lab('品質', yy); U.chips(x + 64, yy, w - 80, [0, 1, 2, 3, 4, 5].map(q => [q, R.QUAL[q].n, U.QC(q)]), q => !!B.q[q], q => { B.q[q] = !B.q[q]; B.arm = 0; }, 28); yy += 36;
    lab('等級', yy); U.chips(x + 64, yy, Math.min(300, w - 80), [[0, '全部'], [1, '低 5 級'], [2, '低 10 級'], [3, '低 20 級']], k => B.lv === k, k => { B.lv = k; B.arm = 0; }, 28); yy += 36;
    lab('部位', yy); U.chips(x + 64, yy, w - 80, [['all', '全部']].concat(R.SLOT.map(k => [k, R.SLOTN[k] || R.GLYPH[k]])), k => k === 'all' ? !Object.values(B.sl).some(Boolean) : !!B.sl[k], k => { if (k === 'all') B.sl = {}; else B.sl[k] = !B.sl[k]; B.arm = 0; }, 28); yy += 36;
    lab('條件', yy); let cx2 = x + 64; [['weak', '只選比身上弱', 104], ['set', '含套裝', 64], ['en', '含強化過', 76], ['auto', '背包滿自動賣普通／良品', 168]].forEach(([k, t, cw]) => { const on = k === 'auto' ? !!d.autoSell : !!B[k];
      U.panel(cx2, yy, cw, 28, on); U.T((on ? '☑ ' : '☐ ') + t, cx2 + cw / 2, yy + 15, 11, on ? U.GOLD : U.DIM, 'center'); M.ui.hit(cx2, yy, cw, 28, () => { if (k === 'auto') { d.autoSell = !d.autoSell; dirty(); } else B[k] = !B[k]; B.arm = 0; }); cx2 += cw + 4; }); yy += 40;
    const g = L.reduce((a, it) => a + (R.sellValue ? R.sellValue(it) : R.value(it)), 0), st = L.reduce((a, it) => a + stOf(it), 0), hi = L.filter(it => it.q >= 4).length;
    U.T('符合 ' + L.length + ' 件　錢 +' + g + (B.mode === 'salv' ? '　精煉石 +' + st : '') + (hi ? '　（含傳說／神話 ' + hi + ' 件）' : ''), x + 16, yy + 6, 12, hi ? U.BAD : U.INK); yy += 18;
    U.T('鎖定的裝備、名物不會被選到。分解＝賣錢＋精煉石（精品 1、稀品 2、傳說 4、神話 8，強化每 5 級 +1）。', x + 16, yy + 6, 10, U.DIM);
    const bw = (w - 44) / 2; U.act(x + 16, y + h - 50, bw, 38, '取消', '', () => { B.on = false; }, true, false);
    U.act(x + 28 + bw, y + h - 50, bw, 38, B.arm ? '再按一次確認' : (B.mode === 'salv' ? '分解 ' : '賣出 ') + L.length + ' 件', '', doBatch, L.length > 0, true); }
  const md0 = M.draw; M.draw = function () { const r = md0.apply(this, arguments); if (B.on) { if (!M.shop) B.on = false; else drawBatch(); } return r; };
  /* 背包滿自動賣普通／良品 */
  const ai0 = R.addItem.bind(R); R.addItem = function (it) { const d = rd(); if (d.autoSell && d.bag.length >= d.bagMax) { const i = d.bag.findIndex(x => x.q <= 1 && !x.lk && !x.set && !x.en); if (i >= 0) R.salvage(i); } return ai0(it); };
  /* ---------- 5. 商店 ---------- */
  const P = () => (G.AMB ? G.AMB.P() : 1);
  const xr0 = S.xrows; S.xrows = (ty, id, pay) => { const L = xr0 ? xr0(ty, id, pay) : [], f = fm();
    if (ty === 'smith') L.push({ n: '精煉石 ×5', d: '強化 +11 以上需要（分解精品以上的裝備也會得到）', ic: 'item_material_tamahagane', p: 500 + 120 * P(), sub: '持有 ' + f.stone, buy: () => { if (!pay(500 + 120 * P())) return; f.stone += 5; dirty(); G.UI.toast('精煉石 +5'); } },
      { n: '保護符', d: '+16 以上強化失敗時不掉級（勾選後使用，失敗才消耗）', ic: 'item_consumable_anchorincense', p: 3000 + 400 * P(), sub: '持有 ' + f.guard, buy: () => { if (!pay(3000 + 400 * P())) return; f.guard++; dirty(); G.UI.toast('保護符 +1'); } },
      { n: '幸運符', d: '強化成功率 +20%（勾選後使用，每次強化消耗 1 張）', ic: 'item_consumable_anchorincense', p: 1500 + 200 * P(), sub: '持有 ' + f.luck, buy: () => { if (!pay(1500 + 200 * P())) return; f.luck++; dirty(); G.UI.toast('幸運符 +1'); } });
    if (ty === 'peddler') { const s = S.stock(id); if (s && !s.disc) L.push({ n: '殺價', d: '跟行商討價還價：一半機率全部 7 折，一半機率他生氣漲 1 成（每批貨一次）', ic: 'ui_icon_material_bag', p: 0, sub: '試試看', buy: () => { s.disc = Math.random() < 0.5 ? 0.7 : 1.1; dirty(); G.UI.toast(s.disc < 1 ? '行商嘆了口氣：「好吧，7 折。」' : '行商哼了一聲：「那就貴一成。」'); } }); }
    return L; };
  S.disc = ty => { if (ty !== 'peddler' || !M.shop) return 1; const s = rd().shop && rd().shop[M.shop]; return (s && s.disc) || 1; };
})();
