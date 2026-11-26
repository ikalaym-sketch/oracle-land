/* ==========================================================================
 * 神諭之地 重製版 — 69_items.js
 * Version : r3.83.0  (2026-11-25)　r3.83.0：套裝依章節（不再一律風切）　r3.31.0  (2026-11-17)
 * 變更    : r3.31.0 新增。武器只留 6 種＋武器道具分種類＋套裝／三神器掉落。
 *           ・武器：打刀、野太刀、薙刀、槍、和弓、鐵砲。金棒、斧、鎖鎌、錫杖移除；舊存檔用到的換成打刀（熟練度取較高者）。
 *           ・武器道具加 wk（種類）：名稱、圖示依種類；裝備哪一把就換成那種武器。選單「換上某武器」＝裝上背包裡最強的那一類。
 *             舊存檔的武器道具一律當打刀；每個存檔送一把凡品的其他 5 種（只送一次），可以馬上換著用。
 *           ・掉落／商店：武器種類 6 選 1（目前用的那種 40%）。
 *           ・套裝：新地圖沒有地區欄位，原本只會掉「風切」→ 改依章節（副本依副本）決定套裝。章節頭目必掉一件精品以上、帶該章套裝。
 *           ・三神器：後山試煉三守門（金狛犬→八咫鏡、金般若→八尺瓊勾玉、赤大蛇→草薙劍）第一次必掉，之後 10%。神話品質，數值高一階。
 * 存檔    : rpg.itemV（轉換版本，只轉一次）、rpg.wkGift、flags.jingi_<代號>。
 * 依賴    : 07_rpg（G.RPG）、13_weapons（G.WPN）、26_boss（onEnd）、08_menu（裝備格圖示）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, W = G.WPN, SC = G.SC, F = () => G.SAVE.data.flags; if (!R || !W) return;
  const KEEP = ['katana', 'nodachi', 'naginata', 'yari', 'yumi', 'teppo'], GONE = ['kanabo', 'ono', 'kusarigama', 'staff'];
  for (let i = W.LIST.length - 1; i >= 0; i--) if (GONE.includes(W.LIST[i].id)) W.LIST.splice(i, 1);
  const KN = k => (W.BY[k] || W.BY.katana).n;
  /* ---------- 三神器（TPL 96～98） ---------- */
  const T = R.TPL, J0 = T.length;
  T.push({ id: J0, slot: 'weapon', n: '草薙劍', tier: 8, req: 40, ic: 'item_weapon_kusanagi', jingi: 'akaorochi' },
    { id: J0 + 1, slot: 'charm', n: '八咫鏡', tier: 8, req: 30, ic: 'item_accessory_yata', jingi: 'komakin' },
    { id: J0 + 2, slot: 'charm', n: '八尺瓊勾玉', tier: 8, req: 36, ic: 'item_accessory_yasakani', jingi: 'kinhannya' });
  const JG = { t_komakin: J0 + 1, t_kinhannya: J0 + 2, t_akaorochi: J0 };
  /* ---------- 名稱與圖示 ---------- */
  const isW = it => it && T[it.t] && T[it.t].slot === 'weapon';
  const nm0 = R.name.bind(R); R.name = function (it) { const t = T[it.t]; if (!isW(it) || t.jingi || !it.wk || it.wk === 'katana') return nm0(it);
    const base = t.n, k = KN(it.wk), i = t.id % 16, n = i < 2 ? base.replace('打刀', k) : base + '・' + k; return (it.set ? R.SETS[it.set].n + '・' : '') + n; };
  R.icon = it => { const t = it && T[it.t]; if (!t) return null; return t.ic || (t.slot === 'weapon' ? 'wpn:' + (it.wk || 'katana') : 'slot_' + t.slot); };
  /* ---------- 產生：種類、套裝 ---------- */
  const CHSET = { 1: 'wind', 2: 'mirror', 3: 'foxfire', 4: 'thunder', 5: 'onibi', 6: 'onibi', 7: 'tide', 8: 'onibi', 9: 'yomi', 10: 'tide', 11: 'yomi', 12: 'tenmon' };
  const DSET = { FUJI: 'onibi', EZO: 'yomi', IZUMO: 'thunder', SKY: 'tenmon' };
  R.setHere = () => { const d = SC.def || {}; if (d.dungeon && DSET[d.dungeon]) return DSET[d.dungeon]; const c = (G.HUB && G.HUB.chOf(SC.id)) || d.explore || (!d.hub && !d.quest && !d.safe && d.ch) || (G.HUB && G.HUB.cur ? Math.min(12, G.HUB.cur()) : 1); return CHSET[c] || d.region || 'wind'; };   // r3.83.0（D4）：支線小地圖依章節、其他地圖（任務、合戰、試煉、隱藏、神社、後山、修練場）依目前進度章節
  const pickWk = () => Math.random() < 0.4 ? W.curId() : KEEP[Math.floor(Math.random() * KEEP.length)];
  const mk0 = R.make.bind(R); R.make = function (tid, q, lv, aff, set) { const it = mk0(tid, q, lv, aff, set); if (isW(it) && !it.wk) it.wk = 'katana'; return it; };
  const rl0 = R.roll.bind(R); R.roll = function (lv, region) { if (region && region === ((SC.def && SC.def.region) || 'wind')) region = R.setHere();
    const it = rl0(lv, region); if (isW(it)) it.wk = KEEP.includes(W.curId()) ? pickWk() : KEEP[Math.floor(Math.random() * KEEP.length)]; return it; };
  /* ---------- 裝備＝換武器種類 ---------- */
  let inner = 0;
  const eq0 = R.equip.bind(R); R.equip = function (i) { const it = R.d().bag[i], r = eq0(i); if (r && isW(it)) { const k = it.wk || 'katana'; if (k !== W.curId()) { inner++; try { W.equip(k); } finally { inner--; } } } return r; };
  const we0 = W.equip.bind(W); W.equip = function (id) { if (inner || !KEEP.includes(id)) return KEEP.includes(id) || inner ? we0(id) : undefined;
    const d = R.d(), cur = d && d.eq && d.eq.weapon; if (cur && (cur.wk || 'katana') !== id) { let bi = -1, bp = -1; d.bag.forEach((it, i) => { if (isW(it) && (it.wk || 'katana') === id && T[it.t].req <= d.lv) { const p = R.power(it); if (p > bp) { bp = p; bi = i; } } });
      if (bi < 0) { G.UI.toast('背包裡沒有可用的' + KN(id)); return; } inner++; try { eq0(bi); } finally { inner--; } }
    return we0(id); };
  /* ---------- 存檔轉換（只做一次） ---------- */
  function migrate(d) { if (!d || d.itemV >= 1) return; d.itemV = 1; let sw = false;
    if (GONE.includes(d.weapon)) { const o = d.wp && d.wp[d.weapon], k = d.wp && (d.wp.katana || (d.wp.katana = { lv: 1, exp: 0 })); if (o && k && o.lv > k.lv) { k.lv = o.lv; k.exp = o.exp; } d.weapon = 'katana'; sw = true; }
    if (d.wsk) for (const key in d.wsk) { const [w, s] = key.split(':'); if (GONE.includes(w)) { const kk = 'katana:' + s; if (W.BY.katana.SK[s]) d.wsk[kk] = Math.max(d.wsk[kk] || 0, d.wsk[key]); delete d.wsk[key]; } }
    if (d.wslot) for (const w of GONE) delete d.wslot[w];
    for (const it of [d.eq && d.eq.weapon].concat(d.bag || [])) if (isW(it) && !it.wk) it.wk = 'katana';
    if (!d.wkGift) { d.wkGift = 1; for (const k of KEEP) { if (k === 'katana') continue; const it = mk0(0, 0, 1, [], null); it.wk = k; d.bag.push(it); } }
    G.SAVE.markDirty(); if (sw && G.mode === 'play') setTimeout(() => we0('katana'), 0); }
  const d0 = R.d.bind(R); R.d = function () { const d = d0(); if (d && !(d.itemV >= 1)) try { migrate(d); } catch (e) { console.warn('items', e); } return d; };
  /* ---------- 頭目掉落：章節頭目保底、三神器 ---------- */
  const oe0 = G.BOSS && G.BOSS.onEnd; if (G.BOSS) G.BOSS.onEnd = function (enc) { oe0 && oe0(enc); try { const d = R.d(), lv = Math.max(1, d.lv), id = enc && enc.id;
    const jt = JG[id];
    if (jt !== undefined) { const k = T[jt].jingi, first = !F()['jingi_' + k]; if (first || Math.random() < 0.1) { F()['jingi_' + k] = 1;
        const keys = Object.keys(R.AFF), aff = []; for (let i = 0; i < 5; i++) { const a = keys[Math.floor(Math.random() * keys.length)]; aff.push([a, Math.round(R.AFF[a][1] * 1.2 * (1 + lv * 0.18) * 10) / 10]); }
        const it = mk0(jt, 5, Math.max(lv, T[jt].req), aff, null); if (T[jt].slot === 'weapon') it.wk = 'katana'; R.addItem(it); G.UI.banner('三神器　' + T[jt].n, first ? '第一次擊敗必定取得' : '再次取得'); } return; }
    const chapterBoss = G.BOSS.MAP && G.BOSS.MAP[SC.id] === id && G.HUB && G.HUB.chOf(SC.id);
    if (chapterBoss) { let it = null; for (let k = 0; k < 120; k++) { it = R.roll(lv + 1, R.setHere()); if (it.q >= 2) break; } if (it.q < 2) it.q = 2; if (!it.set) it.set = R.setHere();
      if (R.addItem(it)) G.UI.toast('頭目掉落【' + R.QUAL[it.q].n + '】' + R.name(it)); } } catch (e) { console.warn('items', e); } };
  G.ITEMS = { KEEP, GONE, JG, migrate };
})();
