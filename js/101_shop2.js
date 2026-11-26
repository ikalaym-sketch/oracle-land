/* ==========================================================================
 * 神諭之地 重製版 — 101_shop2.js
 * Version : r3.61.0  (2026-11-24)
 * 變更    : r3.61.0 新增。茶屋與珍品屋重做。
 *           ・茶屋 12 品：食物 8 種（攻擊／會心率／會心傷害／吸血／經驗／金錢＋寶物／移速／防禦）＋飲品 4 種（冷卻／減傷／攻速／回血）。
 *             食物、飲品各可同時吃一種（同類換新會取代）；效果 10 分鐘，換地圖不消失。
 *             茶屋等級：時間 +20%／級（原有）＋效果 +6%／級；Lv1 6 品、Lv3／5／7 各再開 2 品。
 *           ・珍品屋：貨架 6 格（傳說保底、套裝、帶靈紋、神話機率、名物機率），每 6 小時自動換貨；可花錢或妖玉立即刷新；
 *             另賣特殊道具：靈紋石（合戰靈紋重洗用）、名物鑑定書（店舖 Lv5 起：保證下次刷新出名物）。
 *           ・效能：貨架只在換貨時產生一次並存檔；茶食效果只在購買／進場時寫入 BUFF。
 * 存檔    : rpg.shop[curio_*] = { at, items, n }、rpg.food[kind] = [buffKey, 值, 到期時間]、rpg.uqTicket。
 * 依賴    : 21_shop（S.teaList／S.xrows／stock）、58_forge（shopLv）、07_rpg、100_meibutsu、93_kassen（靈紋石）。
 * ========================================================================== */
'use strict';
(function () {
  const S = G.SHOP, R = G.RPG, H = G.H; if (!S || !R) return;
  const rd = () => R.d(), lv = ty => (G.FORGE ? G.FORGE.shopLv(ty) : 1), P = () => (G.AMB ? G.AMB.P() : 1), BUFT = 36000;
  /* ---------- 1. 茶屋 ---------- */
  const TEA = [
    { k: 'dango', c: 'food', n: '三色糰子', b: 'atk', v: 8, u: '攻擊 +{v}%', ic: 'item_consumable_roadmeal', L: 1 },
    { k: 'onigiri', c: 'food', n: '梅子飯糰', b: 'crit', v: 6, u: '會心率 +{v}%', ic: 'item_consumable_anchorincense', L: 1 },
    { k: 'matcha', c: 'drink', n: '熱抹茶', b: 'cdr', v: 8, u: '冷卻時間 −{v}%', ic: 'item_consumable_lampoil', L: 1 },
    { k: 'mugicha', c: 'drink', n: '冰麥茶', b: 'dr', v: 8, u: '受到傷害 −{v}%', ic: 'item_consumable_lampoil', L: 1 },
    { k: 'taiyaki', c: 'food', n: '鯛魚燒', b: 'critD', v: 20, u: '會心傷害 +{v}%', ic: 'item_consumable_roadmeal', L: 1 },
    { k: 'kashiwa', c: 'food', n: '柏餅', b: 'exp', v: 15, u: '經驗 +{v}%', ic: 'item_consumable_roadmeal', L: 1 },
    { k: 'amazake', c: 'drink', n: '甘酒', b: 'aspd', v: 10, u: '攻速 +{v}%', ic: 'item_consumable_lampoil', L: 3 },
    { k: 'kusamochi', c: 'food', n: '草餅', b: 'ls', v: 3, u: '吸血 +{v}%', ic: 'item_consumable_anchorincense', L: 3 },
    { k: 'kuzuyu', c: 'drink', n: '葛湯', b: 'regen', v: 2, u: '每 5 秒回復生命 {v}%', ic: 'item_consumable_lampoil', L: 5 },
    { k: 'kintsuba', c: 'food', n: '金鍔', b: 'gold', v: 25, u: '金錢 +{v}%、寶物發現 +{h}%', ic: 'item_consumable_roadmeal', L: 5 },
    { k: 'warabi', c: 'food', n: '蕨餅', b: 'mspd', v: 12, u: '移動速度 +{v}%', ic: 'item_consumable_anchorincense', L: 7 },
    { k: 'yokan', c: 'food', n: '栗羊羹', b: 'armorP', v: 10, u: '防禦 +{v}%', ic: 'item_consumable_roadmeal', L: 7 } ];
  const effK = () => 1 + 0.06 * (lv('tea') - 1), val = f => Math.round(f.v * effK() * 10) / 10, txt = f => f.u.replace('{v}', val(f)).replace('{h}', Math.round(val(f) * 0.6));
  const price = f => Math.round((26 + 7 * P()) * (f.L >= 5 ? 1.6 : f.L >= 3 ? 1.3 : 1));
  function eat(f) { const d = rd(); d.food = d.food || {};
    for (const o of TEA) if (o.c === f.c && d.food[o.k]) { G.BUFF.v[o.b] = 0; G.BUFF.t[o.b] = 0; delete d.food[o.k]; }   // 同類（食物／飲品）只留一種
    const v = val(f); G.BUFF.v[f.b] = 0; G.BUFF.add(f.b, v, BUFT); d.food[f.k] = [f.b, v, Date.now() + BUFT * 1000 / 60 * (1 + 0.2 * (lv('tea') - 1))]; G.SAVE.markDirty(); G.UI.toast('吃了' + f.n + '：' + txt(f)); }
  S.teaList = pay => { const L = lv('tea'), d = rd(); const cur = c => { const o = TEA.find(t => t.c === c && d.food && d.food[t.k] && d.food[t.k][2] > Date.now()); return o ? o.n : '無'; };
    return TEA.map(f => { const open = L >= f.L; return { n: (f.c === 'food' ? '［食］' : '［飲］') + f.n, d: open ? txt(f) + '（10 分鐘）　目前：食 ' + cur('food') + '／飲 ' + cur('drink') : '茶食攤 Lv' + f.L + ' 開放', ic: f.ic, p: price(f), sub: open ? txt(f) : '茶食攤 Lv' + f.L + ' 開放',
      buy: () => { if (!open) return G.UI.toast('茶食攤升到 Lv' + f.L + ' 才有'); if (!pay(price(f))) return; eat(f); } }; }); };
  /* 新增效果：經驗、金錢＋寶物、回血、防禦、移速（攻擊／會心／冷卻／減傷／攻速／吸血 由原本系統讀 BUFF） */
  const ge0 = R.gainExp.bind(R); R.gainExp = function (n) { const b = G.BUFF ? G.BUFF.get('exp') : 0; return ge0(b ? Math.round(n * (1 + b / 100)) : n); };
  const ok0 = R.onKill; R.onKill = function (e) { const b = G.BUFF ? G.BUFF.get('gold') : 0, Sx = R.S; if (!b || !Sx) return ok0.apply(this, arguments);
    Sx.gf = (Sx.gf || 0) + b; Sx.mf = (Sx.mf || 0) + b * 0.6; try { return ok0.apply(this, arguments); } finally { Sx.gf -= b; Sx.mf -= b * 0.6; } };
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { const a = G.BUFF ? G.BUFF.get('armorP') : 0; return hh0.call(this, a ? atk / (1 + a / 100) : atk, srcX); };
  if (G.GROW && G.GROW.spdBonus && !G.MEIBUTSU) { const sb0 = G.GROW.spdBonus; G.GROW.spdBonus = function () { return sb0.apply(this, arguments) + (G.BUFF ? G.BUFF.get('mspd') : 0); }; }
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 300 || G.mode !== 'play') return; const r = G.BUFF ? G.BUFF.get('regen') : 0; if (r && H.hp > 0 && H.hp < H.hpMax) { const v = Math.round(H.hpMax * r / 100); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - G.HERO_H - 10, v: '+' + v, heal: true, t: 0 }); } };
  /* ---------- 2. 珍品屋 ---------- */
  const SIX = 6 * 3600 * 1000;
  function roll(q, lvv, o) { o = o || {}; let it = null; const SETK = Object.keys(R.SETS);
    for (let k = 0; k < 400; k++) { it = R.roll(lvv, o.set ? SETK[Math.floor(Math.random() * SETK.length)] : null); if (it.q >= q) break; }
    if (it.q < q) it.q = q; if (it.q > 5) it.q = 5; if (o.set && !it.set) it.set = SETK[Math.floor(Math.random() * SETK.length)]; if (G.RUNE && G.RUNE.ensure) { delete it.rn; G.RUNE.ensure(it); } return it; }
  function genCurio() { const d = rd(), L = lv('curio'), lvv = d.lv + 2, out = [];
    out.push(roll(4, lvv));                                         // 傳說保底
    out.push(roll(3, lvv, { set: 1 }));                             // 套裝
    out.push(roll(Math.random() < 0.5 ? 4 : 3, lvv));               // 稀品～傳說（傳說帶靈紋）
    out.push(roll(Math.random() < 0.08 + 0.03 * L ? 5 : 4, lvv));   // 神話機率
    const uq = d.uqTicket || Math.random() < 0.06 + 0.03 * L; if (d.uqTicket) d.uqTicket = 0;
    out.push(uq && G.MEIBUTSU ? G.MEIBUTSU.make(G.MEIBUTSU.UK[Math.floor(Math.random() * G.MEIBUTSU.UK.length)], lvv) : roll(4, lvv));
    if (L >= 3) out.push(roll(4, lvv, { set: 1 }));
    return out; }
  const st0 = S.stock.bind(S); S.stock = function (id) { if (S.type(id) !== 'curio') return st0(id); const d = rd(); d.shop = d.shop || {}; let s = d.shop[id];
    if (!s || !s.at || Date.now() - s.at > SIX) { s = d.shop[id] = { at: Date.now(), items: genCurio(), n: 0, _up: 1 }; G.SAVE.markDirty(); } return s; };
  function refresh(id, how, pay) { const d = rd(), s = S.stock(id), cost = how === 'yg' ? 5 : 3000 * (1 + (s.n || 0));
    if (!pay(cost, how === 'yg' ? '妖玉' : '錢')) return; d.shop[id] = { at: Date.now(), items: genCurio(), n: (s.n || 0) + 1, _up: 1 }; G.SAVE.markDirty(); G.UI.toast('珍品屋換了一批新貨'); }
  S.xrows = (ty, id, pay) => { if (ty !== 'curio') return []; const d = rd(), s = S.stock(id), left = Math.max(0, SIX - (Date.now() - s.at)), hh = Math.floor(left / 3600000), mm = Math.floor(left % 3600000 / 60000), L = lv('curio'), ks = G.SAVE.data.kz || (G.SAVE.data.kz = { gk: 0, lv: {}, dl: {}, kamon: 0, sel: null, clr: {} });
    const rows = [
      { n: '立即換貨（錢）', d: '重新進一批貨（每次刷新價格會變高）。下次自動換貨：' + hh + ' 小時 ' + mm + ' 分', ic: 'ui_icon_material_bag', p: 3000 * (1 + (s.n || 0)), sub: '自動換貨 ' + hh + ':' + String(mm).padStart(2, '0'), buy: () => refresh(id, 'gold', pay) },
      { n: '立即換貨（妖玉 5）', d: '用妖玉重新進貨（價格固定）', ic: 'ui_icon_material_bag', p: 5, sub: '妖玉 ' + (d.yg || 0), buy: () => refresh(id, 'yg', pay) },
      { n: '靈紋石', d: '在軍奉行的合戰商店用來重洗一條靈紋', ic: 'item_material_radiance', p: 6000, sub: '持有 ' + (ks.stone || 0), buy: () => { if (!pay(6000)) return; ks.stone = (ks.stone || 0) + 1; G.SAVE.markDirty(); G.UI.toast('靈紋石 +1'); } } ];
    if (L >= 5) rows.push({ n: '名物鑑定書', d: '保證下一次換貨出現一件名物', ic: 'item_material_radiance', p: 30, sub: d.uqTicket ? '已持有' : '妖玉', buy: () => { if (d.uqTicket) return G.UI.toast('已經有一張了'); if (!pay(30, '妖玉')) return; d.uqTicket = 1; G.SAVE.markDirty(); G.UI.toast('下次換貨必出名物'); } });
    return rows; };
  G.SHOP2 = { TEA, genCurio, eat };
})();
