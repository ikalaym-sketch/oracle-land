/* ==========================================================================
 * 神諭之地 重製版 — 58_forge.js
 * Version : r3.224.0  (2026-11-28)　r3.224.0：訓練場經驗下修；等級超過本章上限後經驗 25%
 * 舊版    : r3.202.0  (2026-11-28)　r3.202.0：里歐外型時誘敵分身用里歐的圖
 * 舊版    : r3.106.0  (2026-11-26)　r3.106.0：強化按鈕顯示並檢查難度素材（134_econ）
 * 舊版    : r3.102.0  (2026-11-26)　r3.102.0：勾玉改由 129_magatama（舊掉落停用、鍛冶舖勾玉分頁移除、鑲嵌改新清單）
 * 舊版    : r3.101.0  (2026-11-26)　r3.101.0：強化上限改依通關難度；孔數 +30 再一孔、上限 6
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：武器熟練、神社改攻擊% 相加；踏跳、同伴強化改增傷區
 * 舊版    : r3.88.0  （r3.88.0：妖玉交換（狐族長者）從兩岸城搬到妖怪村）
 * 舊版    : r3.83.0  （r3.83.0：妖怪村改說東邊出口　r3.63.0：強化改由 105_forge2（倍率成長、里程碑、保護／幸運符）、匯出 F.ui、強化預覽列）　r3.61.0：（r3.61.0：茶食攤／珍品升級說明（效果、品項、名物機率）　r3.57.0：（r3.57.0：強化頁物品卡可滑動　r3.53.0：店舖上限 Lv10、神社上限 Lv20（後期要素材）、神社里程碑、強化上限 +25　r3.39.0：鎌鼬次兄、三弟也搬進妖怪村　r3.33.0：訓練場難度選單不顯示倍率　r3.28.0：移除舊地圖遮罩修正（紅葉狐徑、炭里）　r3.24.0：勾玉表格＋一鍵合成；行商可升級；雜貨舖升級改賣價加成；背包上限 200）
 * 舊版    : r3.21.1  （r3.21.1：櫃守炭里東出口改到下方主道路）
 * 舊版    : r3.20.3  (2026-11-14)
 * 變更    : r3.20.3 妖怪村訓練場（難度選擇、經驗倍率、持續隨機生怪）。
 * 變更    : r3.20.2 妖怪村只收善良頭目（移除鬼王、土蜘蛛）；頭目會走動、頭上泡泡說話。
 * 變更    : r3.20.1 頭目委託完成後搬到妖怪村（夥伴告知）；妖怪村房屋障礙加大。
 * 變更    : r3.20.0 新地圖：妖怪村 T_yokai（兩岸城前往）、古都晝／夜任務地圖 Q_kyoto_day／Q_kyoto_night。
 * 變更    : r3.19.4 職業技能「未生效」實裝（見切／天照／倶利伽羅／氣獲得）；藥舖／茶食／珍品可升級（藥效／茶食時間／貨架品質）。
 * 變更    : r3.19.3 地圖可走範圍修正（W_R03_01 岔路、葦穗村東出口改到木橋）。
 * 變更    : r3.19.2 修練效果實裝（誘敵分身／身輕／踏跳／自動服藥／同伴強化／復甦）。
 * 變更    : r3.19.0 鍛冶舖介面重做：部位篩選、自繪裝備卡（點詞綴鎖定、勾玉孔圖示）、雙行動作格、勾玉選擇彈窗、移轉雙格；
 *           打造：套裝卡片（未解鎖章節灰階）、部位／保底品質／指定詞綴晶片、區域素材、預覽、需求對照；賣出改品質晶片＋確認。
 * 變更    : r3.18.4 神社後山與封印禁林合併為同一張地圖（底圖／可走範圍用封印禁林）。
 * 變更    : r3.18.2 神社奉納改由小雪對話（shrineCh）；店舖升級頁只顯示本店等級。
 * 變更    : r3.18.0 新增。成長與鍛冶：
 *           ・招式等級改跟職業等級（修正 55 寫死 Lv1）；招式倍率 1.0／1.25／1.5／1.8／2.2，職業 30 級 2.6。
 *           ・攻擊成長：角色每級 +4（原 +3）；武器熟練每級 攻擊 +2 且 +3%；神社每級 攻擊 +1.5%。
 *           ・強化 +1～+15（固定值，依物品等級）：武器攻擊 +(2＋Lv×0.3)／級；防具防禦 +(1.5＋Lv×0.25)、生命 +(6＋Lv×1.2)／級。
 *             +5／+10／+15 里程碑：詞綴 +10%；+10 多 1 孔。+11 起有失敗率（不會壞，每失敗 +10%）。上限看鍛冶舖等級。
 *           ・詞綴數值乘品質倍率（凡 1.0／良 1.1／精 1.25／稀 1.45／傳 1.7／神 2.0）。
 *           ・勾玉：精品 1 孔、稀品 2、傳說以上 3（+10 再 +1）；打怪掉落；3 顆合成高一階；鍛冶舖打洞／鑲嵌。
 *           ・銘刻：鎖 1 條詞綴、其餘重抽；移轉：犧牲另一件，把它的第 1 條詞綴換掉目標最弱的一條（妖玉 3）。
 *           ・打造：選部位＋套裝，用素材＋妖玉打出套裝（精品～傳說）。
 *           ・店舖等級（鍛冶／雜貨 Lv1–5）在店內「升級」分頁；神社 Lv1–10 在神社祈願石奉納。
 *           ・單次受傷上限：最大生命 40%（最高難度也不會一招斃命）。
 *           ・賣出頁：依品質一鍵賣出（套裝、鎖定不賣）；裝備可鎖定。
 * 依賴    : 07_rpg、13_weapons、16_growth、21_shop（G.SHOP.xtabs／xpage）、24_nav（stoneCh）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, W = G.WPN, GR = G.GROW, rd = () => R.d(), dirty = () => G.SAVE.markDirty();
  const QM = [1, 1.1, 1.25, 1.45, 1.7, 2.0], GEMS = { atk: ['攻', 6], def: ['守', 5], hp: ['命', 40], crit: ['會心', 1.5], critD: ['會傷', 6], ls: ['吸血', 0.6] };
  const holes = it => Math.min(6, (it.q >= 4 ? 3 : it.q >= 3 ? 2 : it.q >= 2 ? 1 : 0) + ((it.en || 0) >= 10 ? 1 : 0) + ((it.en || 0) >= 30 ? 1 : 0) + (it.awl || 0));   // r3.101.0：+30 再一孔、穿玉錐（it.awl）、上限 6
  const shopLv = ty => ((rd().shopLv || {})[ty]) || 1, shrineLv = () => rd().shrine || 1;
  const enCap = () => { const c = G.GDIFF && G.GDIFF.cleared; return c && c(4) ? 50 : c && c(3) ? 40 : c && c(2) ? 30 : 20; };   // r3.101.0：強化上限依通關難度（普通 20／困難 30／修羅 40／無間 50）
  /* r3.53.0：升級費用。店舖 Lv5 起、神社 Lv10 起另需五種素材 */
  const MK5 = ['iron', 'bone', 'cloth', 'jade', 'ember'], mats5 = k => MK5.reduce((o, m) => (o[m] = k, o), {});
  const shopCost = n => n < 5 ? { g: 800 * n * n, m: {} } : { g: 3000 * n * n, m: mats5(12 * (n - 4)) };
  const shrCost = n => n < 10 ? { g: 500 * n * (n + 1), m: {} } : { g: 800 * n * (n + 1), m: mats5(15 * (n - 9)) };
  const costTxt = c => '錢 ' + c.g + (Object.keys(c.m).length ? '・五種素材各 ' + c.m.iron : '');
  const canPay = c => rd().gold >= c.g && Object.keys(c.m).every(k => (rd().mats[k] || 0) >= c.m[k]);
  /* ---------- 招式等級與倍率 ---------- */
  W.mvLv = () => W._mvLv || GR.mvLv();
  GR.mvMul = () => { const L = W._mvLv ? 0 : GR.jlv(GR.jd().cur); return L >= 30 ? 2.6 : [1, 1.25, 1.5, 1.8, 2.2][W.mvLv() - 1] * (1 + 0.015 * (shrineLv() - 1)); };
  /* ---------- 單件裝備：強化／詞綴品質／勾玉 ---------- */
  const is0 = R.itemStats;
  R.itemStats = function (it) { const o = is0(it), en = it.en || 0, L = it.lv, sl = R.TPL[it.t].slot, k = QM[it.q] * (1 + 0.1 * Math.floor(en / 5)) - 1;
    for (const [a, v] of it.aff) o[a] = (o[a] || 0) + v * k;
    if (en) { if (sl === 'weapon') o.atk = (o.atk || 0) + en * (2 + L * 0.3); else { o.def = (o.def || 0) + en * (1.5 + L * 0.25); o.hp = (o.hp || 0) + en * (6 + L * 1.2); } }
    for (const g of it.sock || []) if (g) { const [ty, t] = g.split(':'); o[ty] = (o[ty] || 0) + GEMS[ty][1] * +t; }
    for (const a in o) o[a] = Math.round(o[a] * 10) / 10; return o; };
  const nm0 = R.name; R.name = it => nm0(it) + (it.en ? ' +' + it.en : '');
  /* ---------- 角色攻擊成長（在職業加成前） ---------- */
  const ap0 = GR.apply.bind(GR);
  GR.apply = function (s) { const d = rd(), p = W.prof(); s.atk += (d.lv - 1) + 2 * p.lv; s._atkP = (s._atkP || 0) + 3 * p.lv + 1.5 * (shrineLv() - 1); const sk = 1 + 0.015 * (shrineLv() - 1); s.hp *= sk; s.def *= sk;   // r3.53.0：神社每級也加生命、防禦
    const n = shrineLv(); if (n >= 10) { s.mf += 20; s.gf += 20; } if (n >= 20) s.cdr += 8; s.gf += 6 * Math.max(0, shopLv('goods') - 5); return ap0(s); };
  /* ---------- 受傷上限 ---------- */
  const tk0 = GR.taken.bind(GR); GR.taken = (d, o) => Math.min(tk0(d, o), Math.ceil(G.H.hpMax * 0.4));
  /* ---------- 勾玉掉落 ---------- */
  const k0 = R.onKill; R.onKill = function (e) { k0(e); const ch = e.boss ? 0.6 : 0.035; if (!G.MAGA && Math.random() < ch) { const T = Object.keys(GEMS), ty = T[Math.floor(Math.random() * T.length)], t = Math.min(5, 1 + Math.floor((e.lv || 1) / 15));
      const gm = rd().gems = rd().gems || {}; gm[ty + ':' + t] = (gm[ty + ':' + t] || 0) + 1; G.UI.toast('獲得 ' + GEMS[ty][0] + '之勾玉（' + t + ' 階）'); dirty(); } };
  /* ---------- 共用 ---------- */
  const pay = (g, y, m) => { const d = rd(); if (d.gold < g) return G.UI.toast('錢不夠（需要 ' + g + '）'), false; if ((d.yg || 0) < (y || 0)) return G.UI.toast('妖玉不夠（需要 ' + y + '）'), false;
    for (const k in m || {}) if ((d.mats[k] || 0) < m[k]) return G.UI.toast(R.MATS[k].n + '不夠（需要 ' + m[k] + '）'), false;
    d.gold -= g; d.yg = (d.yg || 0) - (y || 0); for (const k in m || {}) d.mats[k] -= m[k]; dirty(); return true; };
  const MK = Object.keys(R.MATS), matOf = it => MK[(R.SLOT.indexOf(R.TPL[it.t].slot) + it.lv) % MK.length];
  const enCost = it => G.FORGE2 ? G.FORGE2.cost(it) : enCost0(it), enRate = it => G.FORGE2 ? G.FORGE2.rate(it) : enRate0(it);   // r3.63.0：強化改由 105_forge2
  const enCost0 = it => { const n = (it.en || 0) + 1; return { g: Math.round(40 * n * (1 + it.lv / 10)), m: { [matOf(it)]: 2 * n } }; };
  const enRate0 = it => { const n = (it.en || 0) + 1; return n <= 10 ? 1 : Math.min(1, (n <= 15 ? [0.6, 0.5, 0.4, 0.3, 0.2][n - 11] : Math.max(0.1, 0.2 - 0.01 * (n - 15))) + 0.1 * (it.fail || 0) + 0.02 * Math.max(0, shopLv('smith') - 5)); };   // r3.53.0：+16～+25；鍛冶 Lv6 起成功率 +2%／級
  const F = G.FORGE = { QM, GEMS, holes, shopLv, shrineLv, enCap, shopCost, shrCost, SHOPMAX: 10, SHRMAX: 20, sel: null, src: null, cs: 0, cset: 0,
    enhance(it) { if (G.FORGE2) return G.FORGE2.enhance(it); if ((it.en || 0) >= enCap()) return G.UI.toast('已達鍛冶舖強化上限 +' + enCap()); const c = enCost(it); if (!pay(c.g, 0, c.m)) return;
      if (Math.random() < enRate(it)) { it.en = (it.en || 0) + 1; it.fail = 0; G.UI.toast('強化成功　' + R.name(it)); } else { it.fail = (it.fail || 0) + 1; G.UI.toast('強化失敗（下次成功率提高）'); }
      R.recalc(); dirty(); },
    drill(it) { it.sock = it.sock || []; if (it.sock.length >= holes(it)) return G.UI.toast('這件裝備不能再打洞'); if (!pay(200 * (it.sock.length + 1), 1)) return; it.sock.push(null); G.UI.toast('打洞完成'); dirty(); },
    setGem(it, key) { const gm = rd().gems || {}, i = (it.sock || []).indexOf(null); if (i < 0) return G.UI.toast('沒有空孔'); if (!gm[key]) return; gm[key]--; it.sock[i] = key; R.recalc(); dirty(); G.UI.toast('鑲嵌完成'); },
    unGem(it) { const i = (it.sock || []).findIndex(Boolean); if (i < 0) return; if (!pay(100)) return; const gm = rd().gems = rd().gems || {}; gm[it.sock[i]] = (gm[it.sock[i]] || 0) + 1; it.sock[i] = null; R.recalc(); dirty(); },
    mergePlan() { const gm = Object.assign({}, rd().gems || {}); let n = 0, cost = 0; for (const t of Object.keys(GEMS)) for (let k = 1; k < 5; k++) { const a = t + ':' + k, b = t + ':' + (k + 1); while ((gm[a] || 0) >= 3) { gm[a] -= 3; gm[b] = (gm[b] || 0) + 1; n++; cost += 150 * k; } } return { n, cost }; },
    mergeAll() { const p = F.mergePlan(), d = rd(); if (!p.n || d.gold < p.cost) return; const gm = d.gems; for (const t of Object.keys(GEMS)) for (let k = 1; k < 5; k++) { const a = t + ':' + k, b = t + ':' + (k + 1); while ((gm[a] || 0) >= 3) { gm[a] -= 3; gm[b] = (gm[b] || 0) + 1; } } d.gold -= p.cost; G.SAVE.markDirty(); G.UI.toast('合成 ' + p.n + ' 次　錢 −' + p.cost); },
    merge(key) { const gm = rd().gems || {}, [ty, t] = key.split(':'); if (+t >= 5 || (gm[key] || 0) < 3) return; if (!pay(150 * t)) return; gm[key] -= 3; const k2 = ty + ':' + (+t + 1); gm[k2] = (gm[k2] || 0) + 1; G.UI.toast(GEMS[ty][0] + '之勾玉 ' + (+t + 1) + ' 階 ×1'); },
    reroll(it) { if (!it.aff.length) return G.UI.toast('沒有詞綴'); if (!pay(Math.round(120 * (1 + it.lv / 10)), 1)) return;
      const nu = R.roll(it.lv, null); let j = 0; it.aff = it.aff.map((a, i) => i === it.lock ? a : (nu.aff[j++] || a)); R.recalc(); G.UI.toast('銘刻完成'); dirty(); },
    transfer(it, src) { if (!src || src === it || !src.aff.length || !it.aff.length) return; if (!pay(0, 3)) return; const d = rd();
      let w = 0; it.aff.forEach((a, i) => { if (a[1] / R.AFF[a[0]][1] < it.aff[w][1] / R.AFF[it.aff[w][0]][1]) w = i; }); it.aff[w] = src.aff[0].slice();
      const bi = d.bag.indexOf(src); if (bi >= 0) d.bag.splice(bi, 1); F.src = null; R.recalc(); G.UI.toast('詞綴移轉完成'); dirty(); },
    craft() { const d = rd(), sl = R.SLOT[F.cs], SK = Object.keys(R.SETS), set = SK[F.cset % SK.length], lv = d.lv, g = Math.round(300 * (1 + lv / 10));
      if (d.bag.length >= d.bagMax) return G.UI.toast('背包已滿'); const m = {}; MK.slice(0, 3).forEach(k => m[k] = 10); if (!pay(g, 2, m)) return;
      let it; for (let i = 0; i < 400; i++) { it = R.roll(lv, set); if (R.TPL[it.t].slot === sl) break; }
      const r = Math.random(), sb = 0.03 * (shopLv('smith') - 1); it.q = r < 0.08 + sb ? 4 : r < 0.4 + sb ? 3 : 2; it.set = set;
      const nu = R.roll(lv, set); while (it.aff.length < R.QUAL[it.q].aff && nu.aff.length) it.aff.push(nu.aff.pop()); it.aff = it.aff.slice(0, R.QUAL[it.q].aff);
      R.addItem(it); G.UI.toast('打造完成：' + R.name(it) + '（' + R.QUAL[it.q].n + '）'); dirty(); },
    upShop(ty) { const d = rd(), n = shopLv(ty), c = shopCost(n); if (n >= 10) return; if (!pay(c.g, 0, c.m)) return; (d.shopLv = d.shopLv || {})[ty] = n + 1; G.UI.toast('店舖升到 Lv ' + (n + 1)); },
    upShrine() { const d = rd(), n = shrineLv(), c = shrCost(n); if (n >= 20) return; if (!pay(c.g, 0, c.m)) return; d.shrine = n + 1; R.recalc(); const ms = F.SHRMS[n + 1]; G.UI.banner('神社　Lv ' + (n + 1), ms ? '解鎖：' + ms : '攻擊、生命、防禦、招式威力 +' + (1.5 * n).toFixed(1) + '%'); },
    SHRMS: { 5: '經驗 +10%', 10: '寶物發現 +20、金錢 +20', 15: '受到傷害 -8%', 20: '夥伴傷害 +20%、冷卻 -8%' },
    stoneCh() { return []; },   // r3.18.2：神社升級改找小雪（06_story_ch1）
    shrineCh() { const n = shrineLv();
      const nx = Object.keys(F.SHRMS).map(Number).find(k => k > n);
      return [{ label: n >= 20 ? '神社已滿級（Lv 20）' : '奉納升級神社（Lv ' + n + '→' + (n + 1) + '，' + costTxt(shrCost(n)) + '）' + (nx ? '　Lv' + nx + '：' + F.SHRMS[nx] : ''), then: [{ do: () => F.upShrine() }] }]; },
    sellQ(q) { const d = rd(); let g = 0, n = 0; d.bag = d.bag.filter(it => { if (it.q <= q && !it.set && !it.lk) { g += R.value(it); n++; return false; } return true; }); d.gold += g; dirty(); G.UI.toast(n ? '賣出 ' + n + ' 件　錢 +' + g : '沒有可賣的'); }
  };
  /* ---------- 商店分頁（r3.19.0 介面重做） ---------- */
  const S = G.SHOP, M = G.MENU, ctx = G.ctx, GOLD = '#e3c27a', INK = '#efe4cc', DIM = '#a39783', BAD = '#e07a6a', OK = '#8fd38f';
  const QC = q => R.QUAL[q].c, T = (s, x, y, sz, c, al, f) => G.txt(s, x, y, sz || 12, c || INK, al || 'left', f || G.FONT, 700);
  S.xtabs = ty => ty === 'smith' ? (G.MAGA ? ['強化', '打造', '升級'] : ['強化', '勾玉', '打造', '升級']) : ['goods', 'med', 'tea', 'curio', 'peddler'].includes(ty) ? ['升級'] : [];   // r3.24.0：行商也可升級
  const panel = (x, y, w, h, on, col) => { ctx.fillStyle = on ? 'rgba(120,80,30,.42)' : 'rgba(255,255,255,.045)'; G.rr(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = col || (on ? GOLD : 'rgba(227,194,122,.28)'); ctx.lineWidth = on ? 1.6 : 1; G.rr(x + .5, y + .5, w - 1, h - 1, 8); ctx.stroke(); };
  /* 雙行動作格：標題＋費用 */
  function act(x, y, w, h, title, cost, f, ok, main) { panel(x, y, w, h, main, main ? GOLD : null); if (ok === false) { ctx.fillStyle = 'rgba(8,5,8,.45)'; G.rr(x, y, w, h, 8); ctx.fill(); }
    T(title, x + w / 2, y + h * 0.38, 14, ok === false ? DIM : main ? '#f7e3b0' : INK, 'center', G.FONT_S); if (cost) T(cost, x + w / 2, y + h * 0.74, 10, ok === false ? BAD : DIM, 'center');
    M.ui.hit(x, y, w, h, () => { if (ok !== false) f(); }); }
  function chips(x, y, w, list, cur, pick, hh) { hh = hh || 28; const cw = Math.min(64, (w - (list.length - 1) * 4) / list.length); list.forEach(([k, n, col], i) => { const xx = x + i * (cw + 4), on = cur(k); panel(xx, y, cw, hh, on, col && on ? col : null); T(n, xx + cw / 2, y + hh / 2 + 1, 12, on ? (col || GOLD) : DIM, 'center', G.FONT_S); M.ui.hit(xx, y, cw, hh, () => pick(k)); }); return y + hh + 6; }
  F.ui = { panel, act, chips, T, QC, GOLD, INK, DIM, BAD, OK };   // r3.63.0：給 105_forge2 共用
  const SL = [['all', '全部']].concat(R.SLOT.map(k => [k, R.GLYPH[k]])).concat([['eq', '身上']]);
  F.slot = 'all';
  const allItems = () => { const d = rd(); return R.SLOT.map(k => d.eq[k]).filter(Boolean).concat(d.bag); };
  function itemsOf() { const d = rd(), eq = R.SLOT.map(k => d.eq[k]).filter(Boolean), all = eq.concat(d.bag);
    return F.slot === 'all' ? all : F.slot === 'eq' ? eq : all.filter(it => R.TPL[it.t].slot === F.slot); }
  function gridL(L, top, lw, h, list, onPick, isOn) { const { box, hit, scrollArea, clip, tile } = M.ui, ts = 44 * (G.FS ? G.FS() : 1), gap = 6, cols = Math.max(3, Math.floor((lw - 20 + gap) / (ts + gap)));
    box(L, top, lw, h); const cy = chips(L + 10, top + 8, lw - 20, SL, k => F.slot === k, k => { F.slot = k; M.scroll.forgeS = 0; });
    const gy = cy, gh = top + h - gy - 8, off = scrollArea('forgeS', L, gy, lw, gh, Math.ceil(list.length / cols) * (ts + gap)); clip(L, gy, lw, gh);
    list.forEach((it, k) => { const tx = L + 10 + (k % cols) * (ts + gap), ty = gy + Math.floor(k / cols) * (ts + gap) + off; if (ty > gy + gh || ty + ts < gy) return; tile(tx, ty, ts, it, isOn(it));
      if (it.en) T('+' + it.en, tx + ts - 3, ty + ts - 7, 9, GOLD, 'right'); hit(tx, Math.max(ty, gy), ts, ts, () => onPick(it)); });
    if (!list.length) T('沒有裝備', L + lw / 2, gy + 30, 12, DIM, 'center'); ctx.restore(); }
  /* 裝備卡（自繪）：名稱／強化／基礎屬性／詞綴（點一下鎖定）／勾玉孔 */
  function card(x, y, w, h, it) { M.ui.box(x, y, w, h); const st = R.itemStats(it), sl = R.TPL[it.t].slot; M.ui.tile(x + 12, y + 12, 46, it, false);
    T(R.name(it), x + 68, y + 26, 16, QC(it.q), 'left', G.FONT_S); T(R.QUAL[it.q].n + '・' + R.SLOTN[sl] + '・Lv ' + it.lv + (it.set ? '・' + R.SETS[it.set].n + '套裝' : ''), x + 68, y + 48, 11, DIM);
    /* r3.57.0：卡片內容超過高度時可上下滑動（不再壓到下方按鈕） */
    const top0 = y + 62, bh = Math.max(30, h - 66), key = 'fcard:' + (it.u || 0), off = M.ui.scrollArea(key, x, top0, w, bh, (F.cTot && F.cTot[key]) || 0), vis = q => q > top0 - 6 && q < top0 + bh + 6;
    M.ui.clip(x, top0, w, bh); let yy = y + 76 + off; const y00 = yy; const base = ['atk', 'def', 'hp'].filter(k => st[k]).concat(Object.keys(st).filter(k => !['atk', 'def', 'hp'].includes(k) && !it.aff.some(a => a[0] === k))).slice(0, 3); /* r3.63.0：主屬性一定顯示（含強化倍率） */ T(base.map(k => R.STATN[k] + ' ' + st[k]).join('　'), x + 14, yy, 12, INK); yy += 22;
    it.aff.forEach((a, i) => { const on = it.lock === i, ww = w - 28; panel(x + 14, yy - 11, ww, 22, on, on ? GOLD : null); T((on ? '鎖 ' : '　 ') + R.AFF[a[0]][0] + ' +' + (Math.round(a[1] * QM[it.q] * (G.FORGE2 ? G.FORGE2.pct(it.en) : 1) * 10) / 10) + R.AFF[a[0]][2], x + 22, yy + 1, 12, on ? GOLD : INK);
      if (vis(yy)) M.ui.hit(x + 14, yy - 11, ww, 22, () => { it.lock = it.lock === i ? undefined : i; }); yy += 26; });
    const n = holes(it), sk = it.sock || []; if (n) { T('勾玉孔', x + 14, yy + 4, 11, DIM); for (let i = 0; i < n; i++) { const cx = x + 72 + i * 30, g = sk[i];
      ctx.beginPath(); ctx.arc(cx, yy + 3, 10, 0, 6.283); ctx.fillStyle = g ? '#3f8f6a' : i < sk.length ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.3)'; ctx.fill(); ctx.strokeStyle = i < sk.length ? GOLD : 'rgba(227,194,122,.25)'; ctx.stroke();
      if (g) T(typeof g === 'string' ? GEMS[g.split(':')[0]][0][0] : G.MAGA ? G.MAGA.glyph(g) : '玉', cx, yy + 4, 10, '#eaffef', 'center'); } yy += 24; }
    ctx.restore(); (F.cTot = F.cTot || {})[key] = yy - y00 + 20; }
  /* 勾玉選擇彈窗 */
  function gemPick(it) { const gm = rd().gems || {}, ks = Object.keys(gm).filter(k => gm[k] > 0).sort(), W2 = Math.min(520, G.LW - 80), H2 = 74 + Math.ceil(Math.max(1, ks.length) / 4) * 52, x = (G.LW - W2) / 2, y = (G.LH - H2) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, G.LW, G.LH); M.hits.length = 0; M.ui.hit(0, 0, G.LW, G.LH, () => { F.pick = 0; }); M.ui.box(x, y, W2, H2); T('選擇要鑲嵌的勾玉', x + 16, y + 24, 14, GOLD, 'left', G.FONT_S);
    if (!ks.length) T('沒有勾玉（打怪掉落，頭目機率高）', x + 16, y + 56, 12, DIM);
    ks.forEach((k, i) => { const [t, n] = k.split(':'), bx = x + 16 + (i % 4) * ((W2 - 32) / 4), by = y + 44 + Math.floor(i / 4) * 52, bw = (W2 - 32) / 4 - 6;
      act(bx, by, bw, 44, GEMS[t][0] + n + '階 ×' + gm[k], '+' + GEMS[t][1] * n + ' ' + R.STATN[t], () => { F.setGem(it, k); F.pick = 0; }); }); }
  S.xpage = function (ty, tab, L, top, lw, h, cx, cw) { const { box } = M.ui, d = rd(), name = S.xtabs(ty)[tab - 2];
    if (name === '升級') { box(L, top, cx + cw - L, h); const n = shopLv(ty), c = shopCost(n), up = l => Math.max(0, l - 5),   // r3.53.0：Lv10＋後期效果
        eff = l => ty === 'smith' ? '打造高品質 +' + 3 * (l - 1) + '%' + (up(l) ? '、強化成功率 +' + 2 * up(l) + '%' : '')
          : ty === 'goods' ? '武器裝備賣價 +' + 8 * (l - 1) + '%' + (up(l) ? '、打怪金錢 +' + 6 * up(l) + '%' : '') : ty === 'med' ? '藥效 +' + 10 * (l - 1) + '%' + (l >= 10 ? '、喝藥後 3 秒無敵' : '')
          : ty === 'tea' ? '茶食時間 +' + 20 * (l - 1) + '%・效果 +' + 6 * (l - 1) + '%・品項 ' + (l >= 7 ? 12 : l >= 5 ? 10 : l >= 3 ? 8 : 6) : ty === 'curio' ? '神話機率 ' + (8 + 3 * l) + '%・名物機率 ' + (6 + 3 * l) + '%' + (l >= 3 ? '・6 格' : '・5 格') + (l >= 5 ? '・名物鑑定書' : '') : '貨架品質提升機率 ' + Math.min(100, 11 * (l - 1)) + '%';   // r3.61.0
      T(({ smith: '鍛冶舖', goods: '雜貨舖', med: '藥舖', tea: '茶食攤', curio: '珍品', peddler: '行商' }[ty] || '店舖') + '　Lv ' + n + '／10', L + 20, top + 32, 18, GOLD, 'left', G.FONT_S); T('目前：' + eff(n), L + 20, top + 64, 13);
      if (n < 10) { T('下一級：' + eff(n + 1), L + 20, top + 90, 13, OK); act(L + 20, top + 112, 300, 52, '升級店舖', costTxt(c), () => F.upShop(ty), canPay(c), true); } else T('已達最高等級', L + 20, top + 90, 13, OK); return; }
    if (name === '勾玉') { const gm = d.gems || (d.gems = {}), TY = Object.keys(GEMS), rh = Math.min(52, (h - 46) / TY.length), cw5 = (lw - 108) / 5;   /* r3.24.0：勾玉改成表格（一列一種、1～5 階） */
      box(L, top, lw, h); T('種類', L + 14, top + 22, 12, DIM); for (let n = 1; n <= 5; n++) T(n + ' 階', L + 96 + (n - 0.5) * cw5, top + 22, 12, DIM, 'center');
      TY.forEach((t, r) => { const y = top + 34 + r * rh; T(GEMS[t][0], L + 14, y + rh / 2, 14, INK, 'left', G.FONT_S); T(R.STATN[t] || t, L + 14, y + rh / 2 + 15, 9, DIM);
        for (let n = 1; n <= 5; n++) { const k = t + ':' + n, c = gm[k] || 0, bx = L + 96 + (n - 1) * cw5, on = F.gsel === k; panel(bx + 2, y + 3, cw5 - 4, rh - 6, on);
          T(c ? '×' + c : '—', bx + cw5 / 2, y + rh / 2 + 1, 13, c ? (c >= 3 && n < 5 ? OK : GOLD) : DIM, 'center', G.FONT, 800); M.ui.hit(bx, y, cw5, rh, () => { F.gsel = k; }); } });
      box(cx, top, cw, h); const k = F.gsel || (TY.map(t => t + ':1').find(x => gm[x] > 0) || 'atk:1'), [t, n] = k.split(':'), c = gm[k] || 0;
      T(GEMS[t][0] + '之勾玉　' + n + ' 階', cx + 18, top + 32, 18, GOLD, 'left', G.FONT_S); T('鑲嵌效果：' + R.STATN[t] + ' +' + Math.round(GEMS[t][1] * n * 10) / 10, cx + 18, top + 60, 13); T('持有 ' + c + ' 顆　（綠色數字＝可合成）', cx + 18, top + 82, 12, DIM);
      if (+n < 5) act(cx + 18, top + 100, 220, 48, '合成 → ' + (+n + 1) + ' 階', '3 顆＋錢 ' + 150 * n, () => F.merge(k), c >= 3 && d.gold >= 150 * n, true);
      const pl = F.mergePlan(); act(cx + 18, top + 160, 220, 48, '一鍵合成全部', pl.n ? '合成 ' + pl.n + ' 次＋錢 ' + pl.cost : '沒有可合成的', () => F.mergeAll(), pl.n > 0 && d.gold >= pl.cost, false);
      T('由低階往高階，同種 3 顆合 1 顆，直到不能再合。', cx + 18, top + 224, 11, DIM); return; }
    if (name === '打造') return craftPage(L, top, lw, h, cx, cw);
    /* 強化 */
    const list = itemsOf(); if (F.sel && !list.includes(F.sel) && !allItems().includes(F.sel)) F.sel = null;
    if (F.mode === 'xfer') gridL(L, top, lw, h, list.filter(x => x !== F.sel && d.bag.includes(x) && x.aff.length), x => { F.src = x; }, x => x === F.src);
    else gridL(L, top, lw, h, list, x => { F.sel = x; F.src = null; }, x => x === F.sel);
    const it = F.sel; if (!it) { box(cx, top, cw, h); T('從左邊選一件裝備', cx + cw / 2, top + h / 2 - 10, 14, DIM, 'center'); T('強化上限 +' + enCap() + '（依通關難度：普通 20／困難 30／修羅 40／無間 50）', cx + cw / 2, top + h / 2 + 14, 11, DIM, 'center'); return; }
    const AH = 54, rows = 2, IR = G.FORGE2 && F.mode !== 'xfer' ? 42 : 0, ch = h - rows * (AH + 6) - 4 - IR; card(cx, top, cw, ch, it); const aw = (cw - 12) / 3, ay = top + ch + 6 + IR; if (IR) G.FORGE2.info(it, cx, top + ch + 4, cw, IR - 4);   // r3.63.0：強化預覽列
    if (F.mode === 'xfer') { const s = F.src; panel(cx, ay, cw * 0.62, AH * 2 + 6, true); T('移轉：從左邊選「素材」裝備（會消耗）', cx + 12, ay + 20, 12, GOLD);
      T(s && s.aff.length ? '素材：' + R.name(s) + '　→　' + R.AFF[s.aff[0][0]][0] + ' +' + s.aff[0][1] : '素材：未選', cx + 12, ay + 46, 12, s ? INK : DIM); T('取代目標最弱的一條詞綴', cx + 12, ay + 70, 11, DIM);
      act(cx + cw * 0.62 + 6, ay, cw * 0.38 - 6, AH, '確認移轉', '妖玉 3', () => { F.transfer(it, s); F.mode = 0; }, !!(s && s.aff.length) && (d.yg || 0) >= 3, true);
      act(cx + cw * 0.62 + 6, ay + AH + 6, cw * 0.38 - 6, AH, '取消', '', () => { F.mode = 0; F.src = null; }); return; }
    const c = enCost(it), mk = matOf(it), cap = (it.en || 0) >= enCap(), r = enRate(it), emp = (it.sock || []).indexOf(null) >= 0;
    const A2 = [['強化 +' + ((it.en || 0) + 1), cap ? '已達上限 +' + enCap() : c.g + ' 錢・' + R.MATS[mk].n + ' ' + c.m[mk] + (c.dm && G.ECON ? '・' + Object.keys(c.dm).map(k => G.ECON.name(k) + ' ' + c.dm[k]).join('・') : '') + (r < 1 ? '・' + Math.round(r * 100) + '%' : ''), () => F.enhance(it), !cap && d.gold >= c.g && (d.mats[mk] || 0) >= c.m[mk] && (!c.dm || !G.ECON || G.ECON.dmOk(c.dm)), true],   // r3.106.0：難度素材
      ['打洞', (it.sock || []).length >= holes(it) ? '孔已滿' : 200 * ((it.sock || []).length + 1) + ' 錢・妖玉 1', () => F.drill(it), (it.sock || []).length < holes(it)],
      ['鑲嵌勾玉', emp ? '選擇勾玉' : '沒有空孔', () => { F.pick = 1; }, emp],
      ['銘刻', it.aff.length ? '重抽未鎖詞綴・' + Math.round(120 * (1 + it.lv / 10)) + ' 錢' : '沒有詞綴', () => F.reroll(it), !!it.aff.length],
      ['詞綴移轉', '妖玉 3', () => { F.mode = 'xfer'; F.src = null; F.slot = 'all'; }, !!it.aff.length],
      [it.lk ? '解除鎖定' : '鎖定裝備', it.lk ? '可被一鍵賣出' : '不會被一鍵賣出', () => { it.lk = !it.lk; dirty(); }]];
    A2.forEach(([t, cs, f, ok, mn], i) => act(cx + (i % 3) * (aw + 6), ay + Math.floor(i / 3) * (AH + 6), aw, AH, t, cs, f, ok, mn));
    if (F.pick) { if (G.MAGA && G.MAGA.pickPop) G.MAGA.pickPop(it, () => { F.pick = 0; }); else gemPick(it); } };
  /* ---------- 打造頁 ---------- */
  const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
  const setCh = s => { const m = /第([一二三四五六七八九十]+)/.exec(s.region || ''); return m ? CN[m[1]] || 1 : 1; };
  const setOpen = k => { const c = setCh(R.SETS[k]); return c <= 1 || (G.HUB && G.HUB.open(c)) || (G.CHEAT && G.CHEAT.on.unlock); };
  const setMats = k => { const i = Object.keys(R.SETS).indexOf(k); return [MK[i % MK.length], MK[(i + 2) % MK.length]]; };
  const QG = [[2, '精品', 1], [3, '稀品', 2.5], [4, '傳說', 6]];
  F.cq = 2; F.cs = 0; F.cset = Object.keys(R.SETS)[0]; F.caff = null;
  F.craftCost = () => { const qm = QG.find(q => q[0] === F.cq)[2], lv = rd().lv, [m1, m2] = setMats(F.cset), n = Math.round(8 * qm);
    return { g: Math.round(300 * (1 + lv / 10) * qm), y: Math.round(2 * qm) + (F.caff ? 3 : 0), m: { [m1]: n, [m2]: n } }; };
  F.craft = function () { const d = rd(), sl = R.SLOT[F.cs], set = F.cset, lv = d.lv; if (!setOpen(set)) return G.UI.toast('還沒解鎖這個套裝的區域');
    if (d.bag.length >= d.bagMax) return G.UI.toast('背包已滿'); const c = F.craftCost(); if (!pay(c.g, c.y, c.m)) return;
    let it; for (let i = 0; i < 400; i++) { it = R.roll(lv, set); if (R.TPL[it.t].slot === sl) break; }
    const up = Math.random() < 0.15 + 0.03 * (shopLv('smith') - 1) ? 1 : 0; it.q = Math.min(4, F.cq + up); it.set = set;
    const AK = Object.keys(R.AFF); it.aff = it.aff.slice(0, R.QUAL[it.q].aff); while (it.aff.length < R.QUAL[it.q].aff) { const k = AK[Math.floor(Math.random() * AK.length)]; if (it.aff.some(a => a[0] === k)) continue; it.aff.push([k, Math.round(R.AFF[k][1] * (0.8 + Math.random() * 0.4) * (1 + lv * 0.18) * 10) / 10]); }
    if (F.caff && it.aff.length) { const base = R.AFF[F.caff][1]; it.aff[0] = [F.caff, Math.round(base * (1 + lv * 0.18) * 1.1 * 10) / 10]; }
    R.addItem(it); G.UI.banner('打造完成', R.name(it) + '（' + R.QUAL[it.q].n + (up ? '・品質提升！' : '') + '）'); dirty(); };
  function craftPage(L, top, lw, h, cx, cw) { const { box, scrollArea, clip, hit } = M.ui, d = rd(), SK = Object.keys(R.SETS);
    box(L, top, lw, h); T('套裝', L + 14, top + 22, 13, GOLD, 'left', G.FONT_S); const gy = top + 34, gh = h - 42, RH = 58, off = scrollArea('craftS', L, gy, lw, gh, SK.length * (RH + 6)); clip(L, gy, lw, gh);
    SK.forEach((k, i) => { const s = R.SETS[k], y = gy + i * (RH + 6) + off, op = setOpen(k); if (y > gy + gh || y + RH < gy) return; panel(L + 8, y, lw - 16, RH, F.cset === k);
      T(s.n + (op ? '' : '　（未解鎖）'), L + 18, y + 18, 13, op ? INK : DIM, 'left', G.FONT_S); T('2 件：' + s.d2, L + 18, y + 36, 10, op ? DIM : 'rgba(163,151,131,.5)'); T('4 件：' + s.d4, L + 18, y + 50, 10, op ? DIM : 'rgba(163,151,131,.5)');
      hit(L + 8, Math.max(y, gy), lw - 16, RH, () => { F.cset = k; }); }); ctx.restore();
    box(cx, top, cw, h); let y = top + 12; y = chips(cx + 12, y, cw - 24, R.SLOT.map((k, i) => [i, R.GLYPH[k]]), i => F.cs === i, i => { F.cs = i; }, 30);
    T('保底品質', cx + 14, y + 12, 11, DIM); y = chips(cx + 80, y, Math.min(240, cw - 92), QG.map(q => [q[0], q[1], QC(q[0])]), q => F.cq === q, q => { F.cq = q; });
    const AK = ['atk', 'def', 'hp', 'crit', 'critD', 'cdr', 'ls'].filter(k => R.AFF[k]); T('指定詞綴', cx + 14, y + 12, 11, DIM);
    y = chips(cx + 80, y, cw - 92, [[null, '不指定']].concat(AK.map(k => [k, R.AFF[k][0].slice(0, 2)])), k => F.caff === k, k => { F.caff = k; });
    const c = F.craftCost(), s = R.SETS[F.cset], have = Object.values(d.eq).filter(it => it && it.set === F.cset).length; y += 6;
    T('預覽：' + s.n + '・' + R.SLOTN[R.SLOT[F.cs]] + '　' + R.QUAL[F.cq].n + ' 以上・詞綴 ' + R.QUAL[F.cq].aff + ' 條' + (F.caff ? '（含 ' + R.AFF[F.caff][0] + '）' : ''), cx + 14, y + 8, 12, QC(F.cq)); y += 22;
    T('目前身上 ' + s.n + ' ' + have + ' 件', cx + 14, y + 8, 11, DIM); y += 24;
    const need = [['錢', c.g, d.gold], ['妖玉', c.y, d.yg || 0]].concat(Object.keys(c.m).map(k => [R.MATS[k].n, c.m[k], d.mats[k] || 0]));
    need.forEach(([n, v, hv], i) => { const bx = cx + 14 + (i % 2) * ((cw - 28) / 2); T(n + '　' + hv + '／' + v, bx, y + 8 + Math.floor(i / 2) * 20, 12, hv >= v ? OK : BAD); });
    const ok = need.every(([, v, hv]) => hv >= v) && setOpen(F.cset); act(cx + cw - 214, top + h - 62, 200, 52, '打造', setOpen(F.cset) ? '' : '套裝未解鎖', () => F.craft(), ok, true); }
  /* ---------- 賣出：品質晶片＋確認 ---------- */
  F.sq = { 0: 1, 1: 1 };
  F.sellBar = function (L, y, w) { const d = rd(), L2 = d.bag.filter(it => F.sq[it.q] && !it.set && !it.lk), g = L2.reduce((a, it) => a + R.value(it), 0);
    chips(L + 10, y, w * 0.56, [0, 1, 2, 3].map(q => [q, R.QUAL[q].n, QC(q)]), q => !!F.sq[q], q => { F.sq[q] = !F.sq[q]; }, 32);
    act(L + 16 + w * 0.56, y, w * 0.44 - 26, 32, '賣出 ' + L2.length + ' 件', '', () => { const n0 = d.bag.length; d.bag = d.bag.filter(it => !L2.includes(it)); d.gold += g; dirty(); G.UI.toast('賣出 ' + (n0 - d.bag.length) + ' 件　錢 +' + g); }, L2.length > 0, true);
    T('套裝與鎖定裝備不會賣出　合計 +' + g + ' 錢', L + 12, y - 8, 10, DIM); };
  /* ---------- 選單「裝備→素材」分頁：素材／妖玉／勾玉數量 ---------- */
  M.PAGE['素材'] = function (x, y, w, h) { const d = rd(), gm = d.gems || {}; M.ui.box(x, y, w, h); T('打造素材', x + 16, y + 26, 15, GOLD, 'left', G.FONT_S);
    const cw = Math.min(200, (w - 40) / 3); MK.forEach((k, i) => { const bx = x + 16 + (i % 3) * (cw + 8), by = y + 40 + Math.floor(i / 3) * 52; panel(bx, by, cw, 44); T(R.MATS[k].n, bx + 12, by + 16, 12, R.MATS[k].c, 'left', G.FONT_S); T('× ' + (d.mats[k] || 0), bx + 12, by + 33, 13, INK); });
    let yy = y + 40 + Math.ceil(MK.length / 3) * 52 + 18; T('妖玉　' + (d.yg || 0), x + 16, yy, 13, '#9fe0ef'); yy += 30; T('勾玉', x + 16, yy, 15, GOLD, 'left', G.FONT_S); yy += 14;
    const ks = Object.keys(gm).filter(k => gm[k] > 0).sort(); if (!ks.length) T('還沒有勾玉', x + 16, yy + 18, 12, DIM);
    ks.forEach((k, i) => { const [t, n] = k.split(':'), bx = x + 16 + (i % 3) * (cw + 8), by = yy + Math.floor(i / 3) * 40; panel(bx, by, cw, 34); T(GEMS[t][0] + '之勾玉 ' + n + '階　×' + gm[k], bx + 12, by + 18, 12, INK); }); };
  /* ---------- 雜貨舖背包上限 ---------- */
  F.bagCap = () => 200;   // r3.24.0：背包擴充一律最多 200 格；雜貨舖升級改為賣價加成
  { const R0 = G.RPG, sv = it => Math.round(R0.value(it) * (1 + 0.08 * (shopLv('goods') - 1))); R0.sellValue = sv;
    const s0 = R0.salvage.bind(R0); R0.salvage = function (i) { const it = R0.d().bag[i]; if (!it) return 0; const b = sv(it) - R0.value(it), g = s0(i); if (g) { R0.d().gold += b; G.SAVE.markDirty(); } return g + b; };
    const sb0 = R0.salvageBelow.bind(R0); R0.salvageBelow = function (q) { const L = R0.d().bag.filter(it => it.q <= q && !it.set), b = L.reduce((a, it) => a + sv(it) - R0.value(it), 0), g = sb0(q); if (g) { R0.d().gold += b; G.SAVE.markDirty(); } return g + b; }; }
})();
/* ---------- r3.18.4：神社後山＝封印禁林（同一張地圖） ----------
 * 後山（hub_mountain）改用封印禁林的底圖、可走範圍與節點；任務中所有 Q_field_seal_forest 改指向 hub_mountain；
 * 進入 Q_field_seal_forest（舊存檔／舊流程）一律轉到 hub_mountain。 */
(function () {
  const A = 'hub_mountain', B = 'Q_field_seal_forest';
  const img0 = G.ASSET.img.bind(G.ASSET); G.ASSET.img = (k, src) => img0(k, k === A ? 'a/m/' + B + '.webp' : src);
  function merge() { const S = G.D.scenes, a = S[A], b = S[B], M = G.WALK && G.WALK.M; if (!a || !b || a._merged) return; a._merged = 1;
    Object.assign(a, { name: '神社後山・封印禁林', outer: b.outer, obstacles: b.obstacles || [], start: [460, 880], nodes: Object.assign({}, b.nodes, { south_arrival: [460, 880], stone_stand: [1150, 430] }) });
    if (a.portals && a.portals[0]) a.portals[0].arrival = [460, 870];
    if (M && M[B]) { M[A] = Object.assign({}, M[B], { portals: (M[A] || {}).portals }); G.WALK.apply(A); }
    const fix = o => { if (o && o.map === B) o.map = A; };
    for (const q of (G.QST && G.QST.L) || []) { fix(q.giver); fix(q.after2); (q.steps || []).forEach(fix); }
    if (G.QST && G.QST.trip && G.QST.trip[B]) { G.QST.trip[A] = G.QST.trip[B]; delete G.QST.trip[B]; } }
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { merge(); return r; });
  const en0 = G.SC.enter; G.SC.enter = function (id, at) { if (id === B) { id = A; at = undefined; } return en0.call(this, id, at); };
})();
/* ---------- r3.19.2：修練身法／輔助效果實裝 ----------
 * 誘敵分身（decoy）：閃避時原地留下分身 1.5 秒＋0.3 秒×等級，附近敵人改打分身，被打一下消失；Lv5 消失時爆炸 80% 範圍傷害。
 * 身輕（dodgeCd 由 16_growth 套用）：Lv5 閃避後 0.5 秒移速 +30%。踏跳：後跳距離 +10%×等級；Lv5 後跳落地 1 秒內下一擊 +30%。
 * 自動服藥：生命低於（10＋2×等級）% 自動用藥；Lv5 無敵 1 秒。同伴強化：同伴傷害 +6%×等級；Lv5 同伴受傷 −20%。
 * 復甦：生命低於 25% 時每秒回復 1%×等級；Lv5 倒下站起時 3 秒無敵並震退周圍敵人。 */
(function () {
  const GR = G.GROW, H = G.H, PY = G.PARTY, A = () => GR.A || {}, Fl = () => GR.F || {}, lv = id => ((G.RPG.d().train || {})[id] || 0);
  let decoy = null; G.DECOY = () => decoy;
  const boom = d => { if (!Fl().decoyBoom) return; const s = G.SC.depth(d.y); for (const e of G.E) if (e.st !== 'dead' && Math.hypot(e.x - d.x, (e.y - d.y) * 1.4) < G.HERO_H * s * 2.2) G.damageOni(e, 0.8, true);
    G.spawnFx && G.spawnFx('feedback_guard_a', 0, d.x, d.y - G.HERO_H * s * 0.5, 1, s * 2); G.SC.shake = Math.max(G.SC.shake, 5); };
  const kill = () => { if (!decoy) return; boom(decoy); decoy = null; };
  const od0 = GR.onDodge.bind(GR); GR.onDodge = function () { od0(); const n = lv('decoy');
    if (n) { kill(); const u = G.WPN.unit(); decoy = { x: H.x, y: H.y, st: 'decoy', life: 90 + 18 * n, t: 0, face: H.face, u: u && u.key, fr: G.heroFrame(), lv: (G.LEON && G.LEON.ghost && G.LEON.ghost({ y: H.y, face: H.face })) || null }; }   /* r3.202.0：里歐外型時，誘敵分身也用里歐的圖 */
    if (Fl().lightRun && G.BUFF) G.BUFF.add('spd', 30, 30);
    if (H.lastBody === 'backstep' && Fl().leapHit) GR.st.leapT = G.t + 60 + 20; };
  /* 敵人選目標：分身在附近時改打分身 */
  if (PY) { const tg0 = PY.targetOf.bind(PY); PY.targetOf = e => decoy && Math.hypot(e.x - decoy.x, e.y - decoy.y) < 300 ? decoy : tg0(e);
    const hu0 = PY.hurt.bind(PY); PY.hurt = function (P, atk, ...r) { if (P && P === decoy) { kill(); return true; } if (P && Fl().allyGuard) atk *= 0.8; return hu0(P, atk, ...r); }; }
  /* 傷害：同伴強化、踏跳 Lv5 */
  const dm0 = GR.dmgMul.bind(GR); GR.dmgMul = function (e) { let m = dm0(e); if (GR.st.leapT > G.t) { m += 0.3; GR.st.leapT = 0; } return m; };
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (opt && opt.party && A().allyDmg) G.DZ.add(A().allyDmg / 100); return do0(e, mult, big, fc, opt); };
  /* 每格：分身計時、自動服藥、低血回復、倒下站起 */
  let regenT = 0, lastHp = H.hp;
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
    if (decoy && ++decoy.t >= decoy.life) kill();
    const P = A().autoPot; if (P && H.hp > 0 && H.hp < H.hpMax * (0.1 + 0.02 * P) && G.SHOP && !(G.SHOP.qcd > 0)) { const c = G.SHOP.cons(); if ((c.herb || 0) + (c.herb2 || 0) > 0) { G.SHOP.quick(); if (Fl().potInv) H.inv = Math.max(H.inv, 60); } }
    const R = A().regenLow; if (R && H.hp > 0 && H.hp < H.hpMax * 0.25 && ++regenT >= 60) { regenT = 0; H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.01 * R); }
    if (Fl().reviveGuard && lastHp < H.hpMax * 0.05 && H.hp >= H.hpMax * 0.99 && G.SAVE.data.flags.downs) { H.inv = Math.max(H.inv, 180); for (const e of G.E) if (e.st !== 'dead' && Math.hypot(e.x - H.x, e.y - H.y) < 200) e.kb = Math.sign(e.x - H.x || 1) * 12; }
    lastHp = H.hp; };
  /* 分身繪製（半透明主角影） */
  const fx0 = G.drawFx; G.drawFx = function (Z) { fx0(Z); if (decoy && decoy.lv) { G.ANIM.draw(decoy.lv.u, decoy.lv.fr, decoy.x, decoy.y, decoy.lv.k, decoy.lv.flip, 0.45 + 0.15 * Math.sin(decoy.t * 0.3)); return; } if (!decoy || !decoy.u) return; const u = G.ANIM.get(decoy.u); if (!u || !decoy.fr) return; const s = G.SC.depth(decoy.y);
    G.ANIM.draw(u, decoy.fr, decoy.x, decoy.y, G.HERO_H * s / (u.refH || 130) * G.WPN.actK('idle'), decoy.face < 0, 0.45 + 0.15 * Math.sin(decoy.t * 0.3)); };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { decoy = null; en0(id); };
})();
/* ---------- r3.19.3：地圖可走範圍修正 ----------
 * W_R03_01：往右上的岔路與下方主路斷開 → 補上連接段。
 * T_ashihomura：東出口原本在右上（漁網小屋旁）→ 改到木橋過去的右側；木橋整段可走。 */
(function () {
  const fill = (k, pts, v) => { const inP = (x, y) => G.inPoly(x, y, pts); for (let cy = 0; cy < k.h; cy++) for (let cx = 0; cx < k.w; cx++) { const x = (cx + 0.5) * k.s, y = (cy + 0.5) * k.s; if (inP(x, y)) k.m[cy * k.w + cx] = v === 0 ? 0 : 1; } };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const FIX = {
    T_ashihomura: { fill: [rect(1120, 520, 1560, 612), rect(1540, 530, 1672, 640)], east: { line: [[1648, 530], [1648, 640]], arrival: [1528, 580] } },
    /* r3.28.0：炭里不再使用；第 3～12 章換新地圖，舊的遮罩修正移除 */
  };
  function apply() { const M = G.WALK && G.WALK.M; if (!M) return;
    for (const id in FIX) { const k = M[id], d = G.D.scenes[id], f = FIX[id]; if (!k || !d || k._fix) continue; k._fix = 1;
      for (const P of f.fill || []) fill(k, P); for (const P of f.block || []) fill(k, P, 0);
      if (f.east) { const p = (d.portals || []).find(q => q.id === 'east'), e = f.east; if (p) { if (e.rect) { p.rect = e.rect; delete p.line; } else p.line = e.line; p.arrival = e.arrival; p._pt = null; } if (k.portals && k.portals.east) { Object.assign(k.portals.east, e); if (e.rect) delete k.portals.east.line; } }
      if (k.d && G.WALK.dist) k.d = G.WALK.dist(k.m, k.w, k.h); } }
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { apply(); return r; });
})();
/* ---------- r3.19.4：職業技能「未生效」實裝 ----------
 * 見切：閃避後 1 秒內下一擊必定暴擊。天照大御神：生命 <30% 自動發動，10 秒全隊無敵＋周圍每秒 300%（冷卻 180 秒）。
 * 倶利伽羅：施放奧義時發動，8 秒火焰巨劍（每秒周圍 600%）、吸血 +10%（冷卻 180 秒）。職業總等級 80：「氣」獲得 +15%。 */
(function () {
  const GR = G.GROW, H = G.H, st = () => GR.st, Fl = () => GR.F || {}, CD = 180 * 60;
  const od0 = GR.onDodge.bind(GR); GR.onDodge = function () { od0(); if (Fl().mikiri) st().mikiT = G.t + 60; };
  const os0 = GR.onSkill.bind(GR); GR.onSkill = function (a, s, key) { const r = os0(a, s, key);
    if (s && s.t === '奧義' && Fl().ultB && !(st().kuriCd > G.t)) { st().kuriT = G.t + 480; st().kuriCd = G.t + CD; G.BUFF && G.BUFF.add('ls', 10, 480); G.UI.banner('倶利伽羅', '火焰巨劍 8 秒'); } return r; };
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const hero = !(opt && opt.party), rd = G.RPG.d(), q0 = rd.qi;
    if (hero && st().mikiT > G.t) { fc = true; st().mikiT = 0; }
    const r = dm0(e, mult, big, fc, opt); const qp = (GR.A || {}).qiP; if (qp && hero && rd.qi > q0) rd.qi = Math.min(100, rd.qi + (rd.qi - q0) * qp / 100); return r; };
  const area = (m, R) => { const s = G.SC.depth(H.y); for (const e of G.E) if (e.st !== 'dead' && !(e.delay > 0) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.4) < G.HERO_H * s * R) G.damageOni(e, m, true); };
  const s0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { s0(); const S = st();
    if (Fl().ultA && H.hp > 0 && H.hp < H.hpMax * 0.3 && !(S.amaCd > G.t)) { S.amaT = G.t + 600; S.amaCd = G.t + CD; G.UI.banner('天照大御神', '10 秒全隊無敵'); }
    if (S.amaT > G.t) { H.inv = Math.max(H.inv, 2); if (G.PARTY) for (const P of G.PARTY.list) P.inv = Math.max(P.inv || 0, 2); if ((S.amaT - G.t) % 60 === 0) area(3, 3); }
    if (S.kuriT > G.t && (S.kuriT - G.t) % 60 === 0) { area(6, 2.4); G.SC.shake = Math.max(G.SC.shake, 3); } };
})();
/* ---------- r3.19.4：藥舖／茶食／珍品等級效果 ---------- */
(function () {
  const S = G.SHOP, H = G.H, lv = ty => G.FORGE.shopLv(ty);
  const q0 = S.quick; S.quick = function () { const h0 = H.hp; q0.apply(S, arguments); const k = 0.10 * (lv('med') - 1); if (k > 0 && H.hp > h0) H.hp = Math.min(H.hpMax, H.hp + (H.hp - h0) * k); if (lv('med') >= 10 && H.hp > h0) H.inv = Math.max(H.inv, 180); };   // r3.53.0：每級 10%、Lv10 喝藥 3 秒無敵
  const ad0 = G.BUFF.add.bind(G.BUFF); G.BUFF.add = function (k, v, t) { if (G.MENU.shop && S.type(G.MENU.shop) === 'tea') t = Math.round(t * (1 + 0.2 * (lv('tea') - 1))); return ad0(k, v, t); };
  const sk0 = S.stock.bind(S); S.stock = function (id) { const s = sk0(id); if (s && /^(curio|peddler)$/.test(S.type(id)) && !s._up) { s._up = 1; const k = Math.min(1, 0.11 * (lv(S.type(id)) - 1)); for (const it of s.items) if (it && it.q < 5 && Math.random() < k) it.q++; } return s; };
})();
/* ---------- r3.20.0：新地圖——妖怪村（T_yokai，由兩岸城前往）＋古都晝／夜任務地圖（Q_kyoto_day／Q_kyoto_night） ----------
 * 可走範圍用外框多邊形＋障礙（房屋、河）；妖怪村西出口回兩岸城；兩岸城加「往妖怪村」互動點。古都兩張為任務地圖（無出口，任務結束返回）。 */
(function () {
  const SCN = {
    T_yokai: { name: '妖怪村・木靈谷', w: 1672, h: 941,
      outer: [[0, 560], [130, 540], [140, 330], [200, 270], [320, 250], [450, 270], [600, 330], [780, 345], [980, 315], [1250, 315], [1300, 345], [1150, 415], [1010, 455], [1080, 525], [1110, 600], [1150, 670], [1500, 690], [1672, 690], [1672, 745], [1450, 748], [1440, 772], [1110, 772], [1100, 748], [960, 760], [900, 830], [300, 830], [180, 720], [0, 700]],
      obstacles: [[[140, 300], [530, 300], [545, 512], [150, 518]], [[460, 640], [870, 640], [870, 830], [460, 830]], [[0, 700], [200, 700], [300, 830], [0, 830]]],
      nodes: { west_arrival: [90, 610], center: [760, 560], east_arrival: [1580, 718], plaza: [700, 470] }, start: [90, 610],
      portals: [{ id: 'west', to: 'hub_city', line: [[24, 565], [24, 695]], arrival: [90, 610] }],
      meta: { ch: 7, region: 'wind', town: true, safe: true } },
    Q_kyoto_day: { name: '古都・晝之町', w: 1672, h: 941, outer: [[0, 605], [1672, 605], [1672, 760], [1410, 768], [1400, 880], [330, 880], [320, 790], [0, 790]], obstacles: [],
      nodes: { west_arrival: [80, 700], center: [836, 720], east_arrival: [1590, 680] }, start: [80, 700], portals: [], meta: { ch: 9, region: 'wind', quest: 1, safe: true } },
    Q_kyoto_night: { name: '古都・夜之町', w: 1672, h: 941, outer: [[0, 605], [1672, 605], [1672, 760], [1410, 768], [1400, 880], [330, 880], [320, 790], [0, 790]], obstacles: [],
      nodes: { west_arrival: [80, 700], center: [836, 720], east_arrival: [1590, 680] }, start: [80, 700], portals: [], meta: { ch: 9, region: 'yomi', quest: 1, lv: 30, safe: true } } };
  function reg() { const S = G.D.scenes, WD = G.WORLD; for (const id in SCN) { if (S[id]) continue; const d = Object.assign({}, SCN[id]); const m = d.meta; delete d.meta; S[id] = Object.assign(d, m); if (WD && WD.meta) WD.meta[id] = m; }
    if (G.NPCD && G.NPCD.CAST && !G.NPCD.CAST.T_yokai) G.NPCD.CAST.T_yokai = { h: ['n_t_tengu_elder', 'n_t_kappa_mentor', 'n_kozueha'], s: [['n_sagitsune', 'curio_yokai'], ['n_hoan', 'med_yokai'], ['n_t_fox_elder', 'yg_yokai']], a: ['n_a_fox', 'n_a_tanuki', 'n_a_crow'] }; }
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { reg(); return r; });
})();
/* ---------- r3.20.2：善良頭目搬到妖怪村（會走動、頭上泡泡說話） ----------
 * 只收善良頭目（企劃 v3.2）：鎌鼬、河童、九尾、雷獸、須佐之男、長壁姬（封印紙閣才有委託）、酒吞童子（和談才有委託）、綿津見。
 * 鬼王（溫羅）、土蜘蛛、八岐不進村。委託完成後由夥伴（或主角）告知，之後出現在妖怪村，在家附近慢慢走動，不時說話。 */
(function () {
  const VIL = [
    ['c1_b_patrol', '鎌鼬長兄', 'b_kama', 'kama1_idle_left3q', null, -1, 1.1, [560, 385], ['巡山的時候，順便看看你們人類的村子。', '弟弟們又跑去偷柿子了……', '赤鬼最近少了，多虧你。']],
    ['c1_b_patrol', '鎌鼬次兄', 'b_kama', 'kama2_idle_left3q', null, -1, 1.0, [640, 410], ['大哥巡山，我守家。', '風玉還沒找到……可是這裡的風很乾淨。', '小太說要來玩，什麼時候來？']],   // r3.39.0：三兄弟一起搬來
    ['c1_b_patrol', '鎌鼬三弟', 'b_kama', 'kama3_idle_left3q', null, -1, 0.95, [500, 420], ['藥我調好了，受傷就來找我。', '飯糰……好吃。', '哥哥們都很兇，可是很溫柔。']],
    ['c2_b_mud', '河童大將', 'b_kappa', 'kappataisho_idle_right3q', 'kappataisho_walk_right3q', 1, 1.1, [1000, 560], ['這條河的水很乾淨，我喜歡。', '要不要來比一場相撲？', '黃瓜……有人帶黃瓜來嗎？']],
    ['c3_b_gift', '九尾', 'b_kyubi', 'kyubi_idle_right3q', null, 1, 1.1, [330, 610], ['狐火今晚會很美。', '那孩子（葛葉）還好嗎？', '人與妖住在同一片天下，也不錯。']],
    ['c4_b_guard', '雷獸', 'b_raiju', 'raijuo_idle_right3q', null, 1, 1.0, [820, 420], ['……（尾巴劈啪作響）', '雷脈安靜了，我也睡得著。', '別摸我，會麻。']],
    ['c6_b_sword', '須佐之男', 'b_susanoo', 'susanoo_p1_idle', 'susanoo_p1_walk', 1, 1.15, [1250, 712], ['八岐的事，是我欠這片土地的。', '劍要常試，人也一樣。', '這裡的河，讓我想起出雲。']],
    ['c7_b_pages', '長壁姬', 'b_osakabe', 'osakabe_idle_right3q', null, 1, 1.05, [620, 525], ['紙閣的書，我會好好守著。', '這裡沒有人會把紙人當成官員。', '要借書嗎？記得要還。']],
    ['c8_b_sake', '酒吞童子', 'b_shuten', 'shuten_idle_right3q', 'shuten_walk_right3q', 1, 1.15, [980, 385], ['好酒！……這是妖怪村的酒嗎？', '跟人類喝酒，比打架有意思。', '茨木那傢伙，跟著你還習慣吧？']],
    ['c10_b_fest', '綿津見', 'b_watatsumi', 'watatsumi_idle_right3q', null, 1, 1.15, [1420, 716], ['河會流進海，海會記得一切。', '潮汐祭的時候，記得來。', '那位小巫女（汐音），長大了。']]];
  const F = () => G.SAVE.data.flags, LIVE = [];
  let chk = 0; const s0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { s0();
    if (G.SC.id === 'T_yokai') for (const o of LIVE) { if (!o.u) continue; o.t++;
      if (o.say && --o.sayT <= 0) o.say = null; if (!o.say && Math.random() < 0.002) { o.say = o.lines[Math.floor(Math.random() * o.lines.length)]; o.sayT = 200; }
      if (!o.tx || Math.hypot(o.tx - o.x, o.ty - o.y) < 3) { o.walking = false; o.clip = o.ci; if (Math.random() < 0.006) { for (let k = 0; k < 8; k++) { const a = Math.random() * 6.283, r = 30 + Math.random() * 70, x = o.hx + Math.cos(a) * r, y = o.hy + Math.sin(a) * r * 0.5; if (G.SC.walkable(x, y)) { o.tx = x; o.ty = y; break; } } } }
      else { const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy); o.x += dx / d * 0.7; o.y += dy / d * 0.7; o.face = Math.sign(dx) || o.face; o.walking = true; o.clip = o.cw || o.ci; } }
    if (++chk % 60 || G.DLG.active() || (G.EV && G.EV.bossLock && G.EV.bossLock())) return;
    for (const [q, n] of VIL) if (G.QST.isDone && G.QST.isDone(q) && !F()['yv_' + q]) { F()['yv_' + q] = 1; G.SAVE.markDirty();
      const P = G.PARTY && G.PARTY.list[0], t = n + '說要搬到兩岸城東邊出口外的妖怪村住。之後可以去那裡看看。';
      if (P && G.BANTER) G.BANTER.say(P.id, t, true); else G.DLG.start([{ who: '蒼真', text: '（' + t + '）' }]); break; } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); LIVE.length = 0; if (id !== 'T_yokai') return;
    for (const [q, n, key, ci, cw, nat, hk, p, lines] of VIL) { if (!F()['yv_' + q]) continue; const o = { anim: key, hk, nat, name: n, x: p[0], y: p[1], hx: p[0], hy: p[1], face: p[0] > 836 ? -1 : 1, t: 0, lines }; G.NPC.push(o); LIVE.push(o);
      Promise.resolve(G.ANIM.load(key)).then(u => { if (!u || G.SC.id !== 'T_yokai') return; o.u = u; o.ci = u.act[ci] || u.act[Object.keys(u.act).find(k => /idle/.test(k))]; o.cw = cw && u.act[cw]; o.clip = o.ci; }, () => 0); } };
  /* 頭上泡泡（螢幕座標，固定字級） */
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0(); if (G.SC.id !== 'T_yokai') return; const ctx = G.ctx;
    for (const o of LIVE) { if (!o.say || !o.u) continue; const s = G.SC.depth(o.y), p = G.SC.toScreen(o.x, o.y - G.HERO_H * s * o.hk * 1.35); if (p.x < 0 || p.x > G.LW || p.y < 0) continue;
      ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`; const w = Math.min(G.LW * 0.4, ctx.measureText(o.say).width + 18), h = 22 * G.FS(), x = Math.max(6, Math.min(G.LW - w - 6, p.x - w / 2)), y = p.y - h - 6;
      ctx.globalAlpha = Math.min(1, o.sayT / 20); ctx.fillStyle = 'rgba(250,244,230,.94)'; G.rr(x, y, w, h, 9); ctx.fill(); ctx.beginPath(); ctx.moveTo(p.x - 5, y + h - 1); ctx.lineTo(p.x + 5, y + h - 1); ctx.lineTo(p.x, y + h + 6); ctx.fill();
      G.txt(o.say, x + w / 2, y + h / 2 + 1, 11, '#3a2a1c', 'center', G.FONT, 700); ctx.globalAlpha = 1; } };
  /* 走動時上下踏步 */
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n.anim && n.walking && n.u) { const b = Math.abs(Math.sin(G.t * 0.25)) * 2; n.y -= b; dn0(n); n.y += b; return; } return dn0(n); };
})();
/* ---------- r3.20.3：妖怪村訓練場（D_TRAIN，用「谷底回音盆地」的圖與可走範圍） ----------
 * 妖怪村木橋右側出口 → 訓練場；進場先選難度：普通／困難／地獄／無間（敵人等級＝主角等級＋0／5／12／20，經驗 ×1／1.5／2.2／3.2）。
 * 場上持續維持 6～8 隻，種類從全部章節的妖怪中隨機抽；西側出口回妖怪村。 */
(function () {
  const SRC = 'Q_mountain_valley', TD = [['普通', 0, 0.5, '#86cf8f'], ['困難', 5, 0.6, '#6fb0f0'], ['地獄', 12, 0.7, '#c095f0'], ['無間', 20, 0.8, '#f0624f']];   /* r3.224.0：訓練場經驗倍率 1／1.5／2.2／3.2 → 0.5／0.6／0.7／0.8（原本無間約 9 隻升一級） */
  const TR = G.TRAIN = { on: false, d: 0, pool: [], tag: () => '敵 Lv ' + (G.RPG.d().lv + TD[TR.d][1]) + '・' + TD[TR.d][0] };
  const img0 = G.ASSET.img.bind(G.ASSET); G.ASSET.img = (k, src) => img0(k, k === 'D_TRAIN' ? 'a/m/' + SRC + '.webp' : src);
  function reg() { const S = G.D.scenes, b = S[SRC], M = G.WALK && G.WALK.M; if (!b || S.D_TRAIN) return;
    S.D_TRAIN = Object.assign({}, b, { name: '妖怪村・訓練場', portals: [{ id: 'west', to: 'T_yokai', line: [[24, Math.max(0, b.start[1] - 60)], [24, b.start[1] + 60]], arrival: b.start }], nodes: Object.assign({}, b.nodes), safe: false, town: false, quest: 0 });
    if (G.WORLD) G.WORLD.meta.D_TRAIN = { ch: 1, region: 'wind', safe: true };   // safe：不走一般生怪，由訓練場自己生
    if (M && M[SRC]) { M.D_TRAIN = Object.assign({}, M[SRC], { portals: {} }); G.WALK.apply('D_TRAIN'); }
    const Y = S.T_yokai; if (Y && !Y.portals.some(p => p.to === 'D_TRAIN')) Y.portals.push({ id: 'east', to: 'D_TRAIN', line: [[1648, 692], [1648, 744]], arrival: [1580, 718] });
    const set = new Set(); for (const k in (G.WORLD ? G.WORLD.meta : {})) for (const f of G.WORLD.meta[k].foes || []) set.add(f); TR.pool = [...set]; }
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { reg(); return r; });
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); TR.on = false; if (id !== 'D_TRAIN') return;
    G.DLG.start([{ who: '天狗長老', text: '訓練場的妖怪不會停。選個難度吧——這裡是練手感的地方，經驗比外面少。' }, { choice: TD.map(([n, off, x], i) => ({ label: n + '（' + ['和你差不多強', '強一截，經驗稍多', '很強，經驗較多', '極限，經驗最多'][i] + '）', then: [{ do: () => { TR.d = i; TR.on = true; TR.cd = 30; G.UI.banner('訓練開始・' + n, '從左邊出口離開'); } }] })) }]); };
  const s0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { s0(); if (!TR.on || G.SC.id !== 'D_TRAIN' || G.DLG.active()) return;
    if (--TR.cd > 0) return; TR.cd = 45; const alive = G.E.filter(e => e.st !== 'dead').length; if (alive >= 6 + (TR.d >= 2 ? 2 : 0)) return;
    const t = TR.pool[Math.floor(Math.random() * TR.pool.length)], lv = G.RPG.d().lv + TD[TR.d][1], H = G.H;
    Promise.resolve(G.ASSET.enemies([t])).then(() => { if (G.SC.id !== 'D_TRAIN') return; for (let k = 0; k < 20; k++) { const a = Math.random() * 6.283, r = 260 + Math.random() * 260, x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r * 0.5;
      if (G.SC.walkable(x, y)) { const e = G.spawnOni(x, y, 20, lv, t); e.train = 1; break; } } }, () => 0); };
  /* r3.224.0：訓練場的經驗一律用主角等級算、乘上難度倍率（先扣掉一般擊殺已經給的那一份） */
  const k0 = G.RPG.onKill; G.RPG.onKill = function (e) { if (e && e.train && TR.on) { const d = G.RPG.d(), lv0 = d.lv, ex0 = d.exp, want = Math.round((10 + lv0 * 6) * TD[TR.d][2]); k0(e); if (d.lv === lv0) { d.exp = ex0; G.RPG.gainExp(want); } return; } k0(e); };
  /* r3.224.0：等級超過「目前這一章最高的地圖等級＋2」之後，經驗只剩 25%（推進主線就解除） */
  { const R = G.RPG, g0 = R.gainExp.bind(R); let told = 0;
    R.expCap = () => { try { const c = Math.min(12, G.HUB.cur()), ids = (G.WORLD.chapters[c] || []); let m = 0; for (const id of ids) m = Math.max(m, (G.D.scenes[id] || {}).lv || 0); return m ? m + 2 : 999; } catch (x) { return 999; } };
    R.gainExp = function (n) { const d = R.d(); if (d.lv < 100 && d.lv >= R.expCap() && !(G.SAVE.data.flags || {}).gameClear) { n = Math.max(1, Math.round(n * 0.25)); if (!told && G.t > 600) { told = 1; G.UI.toast('等級已經高過這一章的妖怪，經驗變少了。推進主線就會恢復'); } } return g0(n); }; }
  const ui0 = G.UI.draw; G.UI.draw = function () { ui0(); if (TR.on && G.SC.id === 'D_TRAIN') { const [n, , x, c] = TD[TR.d]; G.txt('訓練場・' + n, G.LW / 2, 64 + G.SAFE.t, 12, c, 'center', G.FONT_S, 900); } };
})();
/* ---------- r3.53.0：神社里程碑（Lv5 經驗、Lv15 減傷、Lv20 夥伴傷害；Lv10／20 的屬性在 GR.apply） ---------- */
(function () {
  const lv = () => G.FORGE.shrineLv(), R = G.RPG;
  const ge0 = R.gainExp.bind(R); R.gainExp = function (n) { return ge0(lv() >= 5 ? Math.round(n * 1.1) : n); };
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { return hh0.call(this, lv() >= 15 ? atk * 0.92 : atk, srcX); };
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (opt && opt.party && lv() >= 20) G.DZ.add(0.2); return dm0.call(this, e, mult, big, fc, opt); };
})();
