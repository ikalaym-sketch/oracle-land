/* ==========================================================================
 * 神諭之地 重製版 — 07_rpg.js
 * Version : r3.105.0  (2026-11-26)　r3.105.0：裝備基礎屬性 100 級以後每級 +1.2%（原本 +4%）
 * 舊版    : r3.101.0  (2026-11-26)　r3.101.0：屬性初始值加新詞條（減傷、招式減傷、增傷、對頭目、對精英）
 * 舊版    : r3.99.0  (2026-11-26)　r3.99.0：巔峰升級改給巔峰點數 d.pp
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：攻擊% 改同區相加（s._atkP，R.addAtkP 給後掛模組用）
 * 舊版    : r3.83.0  (2026-11-25)　r3.83.0：套裝說明的章節對齊實際掉落　r3.54.0  (2026-11-23)　r3.54.0：巔峰等級（Lv100 後 d.pk，每級 +1 技能點、攻 +2／防 +1／命 +12）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 名冊移除小青／鎌鼬三兄弟／霹靂（特殊招募取消）。
 * 變更    : r3.0.0 武器與技能移到 13_weapons（10 武器×9 招、熟練度）；舊打刀技能存檔自動轉換；升級技能點 +2；擊殺得熟練度。
 * 變更    : r2.2.0 掉落改為「錢＋打造素材為主、裝備少量」：裝備基礎機率 6%，可被「寶物發現」詞綴提高並提升品質；
 *           新增詞綴 寶物發現(mf)／金錢加成(gf)；新增素材庫 mats 與專屬道具 keys（舊存檔自動補欄位）。
 * 變更    : r2.1.0 夥伴名冊改為「主線 5 位＋隱藏 3 位」：白丸／颯／葛葉／茨木童子／汐音；小青／鎌鼬三兄弟／霹靂收集道具後挑戰副本頭目加入。
 * 說明    : 成長與裝備——等級／經驗／技能點、6 部位裝備、96 件模板（6 部位×16）、6 品質、8 套裝、隨機詞綴、
 *           掉落（經驗・錢・裝備）、背包、10 種武器資料、打刀四招、夥伴名冊。
 *           屬性只在「裝備／升級／學技」時重算一次並快取（G.RPG.S），戰鬥中不重算。
 *           存檔：S.rpg；只 markDirty，由換場景／對話結束／關選單時統一寫入。
 * ========================================================================== */
'use strict';
(function () {
  const QUAL = [
    { n: '凡品', c: '#cfc8bb', m: 1.00, aff: 0, w: 55 }, { n: '良品', c: '#86cf8f', m: 1.22, aff: 1, w: 28 },
    { n: '精品', c: '#6fb0f0', m: 1.50, aff: 2, w: 12 }, { n: '稀品', c: '#c095f0', m: 1.85, aff: 3, w: 4 },
    { n: '傳說', c: '#f0ad52', m: 2.30, aff: 4, w: 0.9 }, { n: '神話', c: '#f0624f', m: 2.90, aff: 5, w: 0.1 }];
  const SLOT = ['weapon', 'head', 'body', 'hands', 'feet', 'charm'];
  const SLOTN = { weapon: '武器', head: '頭', body: '胴', hands: '手', feet: '足', charm: '御守' };
  const GLYPH = { weapon: '刀', head: '兜', body: '胴', hands: '手', feet: '足', charm: '守' };
  const NAMES = {
    weapon: ['野鍛打刀', '竹節打刀', '杉影', '風見丸', '水鏡', '朧月', '狐火丸', '雷切', '鬼包丁', '紅蓮', '潮鳴', '黃泉路', '天門', '八雲', '村雨', '天叢雲'],
    head: ['草笠', '編笠', '鉢金', '陣笠', '風切兜', '水鏡面', '狐面', '雷紋兜', '鬼角兜', '炎兜', '潮騷冠', '冥府頭巾', '天門冠', '鳳凰兜', '龍頭兜', '神樂冠'],
    body: ['麻衣', '刺子衣', '皮胴', '鎖帷子', '風切胴', '水干', '狐火羽織', '雷紋具足', '鬼鎧', '紅蓮具足', '潮鳴羽衣', '黃泉白衣', '天門鎧', '鳳凰羽織', '龍鱗鎧', '神衣'],
    hands: ['布手甲', '革籠手', '鐵籠手', '鎖籠手', '風切籠手', '水鏡籠手', '狐爪', '雷紋籠手', '鬼腕', '炎籠手', '潮籠手', '冥籠手', '天門籠手', '鳳籠手', '龍爪', '神籠手'],
    feet: ['草鞋', '足袋', '脛巾', '革足袋', '風切草履', '水渡足袋', '狐步履', '雷紋脛當', '鬼足', '炎脛當', '潮踏', '黃泉草履', '天門履', '鳳履', '龍脛當', '神履'],
    charm: ['平安御守', '交通御守', '開運御守', '風之御守', '水之御守', '狐之鈴', '雷之勾玉', '鬼之角', '炎之勾玉', '潮之珠', '黃泉之鈴', '天門鏡片', '八咫之羽', '九尾之毛', '龍之鱗', '神之勾玉'] };
  /* 部位基礎屬性（每階 tier 0..7 線性成長） */
  const BASE = { weapon: t => ({ atk: 8 + t * 9 }), head: t => ({ def: 2 + t * 2.2, hp: 8 + t * 10 }), body: t => ({ def: 4 + t * 3.4, hp: 16 + t * 16 }),
    hands: t => ({ atk: 2 + t * 2.4, crit: 1 + t * 0.4 }), feet: t => ({ def: 1.5 + t * 1.6, spd: 2 + t * 0.6 }), charm: t => ({ hp: 10 + t * 12, crit: 1 + t * 0.5, cdr: 1 + t * 0.6 }) };
  const TPL = [];   // 96 件：id = 部位序*16 + i；tier = i>>1；需求等級 = 1 + tier*5
  SLOT.forEach((s, si) => NAMES[s].forEach((n, i) => TPL.push({ id: si * 16 + i, slot: s, n, tier: i >> 1, req: 1 + (i >> 1) * 5 })));
  const AFF = { atk: ['攻擊', 1.6, ''], def: ['防禦', 1.4, ''], hp: ['生命', 9, ''], crit: ['會心率', 0.45, '%'], critD: ['會心傷害', 2.2, '%'], spd: ['移動速度', 0.5, '%'], cdr: ['冷卻縮減', 0.5, '%'], ls: ['吸血', 0.18, '%'], mf: ['寶物發現', 2.5, '%'], gf: ['金錢加成', 3, '%'] };
  const STATN = { atk: '攻擊', def: '防禦', hp: '生命', crit: '會心率', critD: '會心傷害', spd: '移動速度', cdr: '冷卻縮減', ls: '吸血', mf: '寶物發現', gf: '金錢加成' };
  /* 打造素材（城鎮鐵匠用，第四批開放打造） */
  const MATS = { iron: { n: '鐵砂', c: '#a9bccb' }, bone: { n: '妖骨', c: '#eadfc4' }, cloth: { n: '靈布', c: '#9fd8b4' }, jade: { n: '勾玉原石', c: '#7fd6e6' }, ember: { n: '鬼火炭', c: '#f09a66' } };
  const SETS = {
    wind: { n: '風切', region: '第一章', b2: { spd: 8 }, b4: { atk: 12, cdr: 10 }, d2: '移動速度 +8%', d4: '攻擊 +12、冷卻縮減 +10%' },
    mirror: { n: '水鏡', region: '第二章', b2: { def: 10 }, b4: { hp: 120, ls: 2 }, d2: '防禦 +10', d4: '生命 +120、吸血 +2%' },
    foxfire: { n: '狐火', region: '第三章', b2: { crit: 6 }, b4: { critD: 30 }, d2: '會心率 +6%', d4: '會心傷害 +30%' },
    thunder: { n: '雷鳴', region: '第四章・出雲', b2: { atk: 15 }, b4: { cdr: 18 }, d2: '攻擊 +15', d4: '冷卻縮減 +18%' },
    onibi: { n: '鬼火', region: '第五、六、八章・富士', b2: { hp: 150 }, b4: { atk: 30, ls: 3 }, d2: '生命 +150', d4: '攻擊 +30、吸血 +3%' },
    tide: { n: '潮鳴', region: '第七、十章', b2: { def: 25 }, b4: { hp: 300, def: 20 }, d2: '防禦 +25', d4: '生命 +300、防禦 +20' },
    yomi: { n: '黃泉', region: '第九、十一章・蝦夷', b2: { critD: 25 }, b4: { crit: 12, atk: 25 }, d2: '會心傷害 +25%', d4: '會心率 +12%、攻擊 +25' },
    tenmon: { n: '天門', region: '第十二章・天空', b2: { atk: 40 }, b4: { atk: 40, def: 40, hp: 400 }, d2: '攻擊 +40', d4: '攻擊・防禦 +40、生命 +400' } };
  const COMP = [
    { id: 'shiro', n: '白丸', who: '石狛犬・神社守門者', ch: 1, face: 'face_shiro', d: '守門的石狛犬，鼻子比誰都靈。會自動撲咬附近的敵人。', sk: [['石牙', '每 4 秒撲咬附近敵人'], ['守門吠', '（Lv5）低吼吸引敵人注意'], ['嗅跡', '找出藏起來的線索']] },
    { id: 'hayate', n: '颯', who: '天狗弓手', ch: 2 }, { id: 'kuzuha', n: '葛葉', who: '狐巫女', ch: 3 },
    { id: 'ibaraki', n: '茨木童子', who: '背著債的鬼', ch: 6 }, { id: 'shion', n: '汐音', who: '人魚', ch: 10 },
  ];   // r3.10.0 河童／鎌鼬／雷獸的特殊招募已取消

  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1));
  const need = lv => Math.round(40 * Math.pow(lv, 1.6));
  let uid = 1;
  const needP = pk => Math.round(need(100) * (1 + 0.03 * pk));   // r3.54.0 巔峰等級：Lv100 後每級所需經驗
  const R = G.RPG = { MATS, QUAL, SLOT, SLOTN, GLYPH, TPL, AFF, STATN, SETS, COMP, need, needP, needNow: () => { const d = R.d(); return d.lv >= 100 ? needP(d.pk || 0) : need(d.lv); }, S: null,
    fresh() { return { lv: 1, exp: 0, gold: 0, sp: 2, qi: 0, weapon: 'katana', wp: { katana: { lv: 1, exp: 0 } }, wsk: {}, wslot: {}, eq: { weapon: R.make(0, 0, 1, [], null) }, bag: [], bagMax: 60, mats: {}, keys: {}, comp: { shiro: { lv: 1, exp: 0 } }, uid: 2 }; },
    d() { return G.SAVE.data.rpg; },
    make(tid, q, lv, aff, set) { const t = TPL[tid]; return { u: uid++, t: tid, q, lv, aff, set }; },
    tpl(it) { return TPL[it.t]; },
    name(it) { return (it.set ? SETS[it.set].n + '・' : '') + TPL[it.t].n; },
    /* 單件裝備屬性＝部位基礎×品質倍率×(1+等級成長)＋詞綴 */
    itemStats(it) { const t = TPL[it.t], q = QUAL[it.q], o = {}, b = BASE[t.slot](t.tier), g = 1 + (Math.min(100, it.lv) - 1) * 0.04 + Math.max(0, it.lv - 100) * 0.012;   // r3.105.0：100 級以後每級 +1.2%
      for (const k in b) o[k] = b[k] * q.m * g;
      for (const [k, v] of it.aff) o[k] = (o[k] || 0) + v;
      for (const k in o) o[k] = Math.round(o[k] * 10) / 10; return o; },
    power(it) { const s = R.itemStats(it); return Math.round((s.atk || 0) * 2 + (s.def || 0) * 1.6 + (s.hp || 0) * 0.2 + (s.crit || 0) * 3 + (s.critD || 0) + (s.spd || 0) * 2 + (s.cdr || 0) * 2 + (s.ls || 0) * 4 + (s.mf || 0) + (s.gf || 0) * 0.5); },
    /* 重算屬性：只在變更時呼叫 */
    addAtkP(p) { const S = R.S; if (!S || !p) return; S._atkP = (S._atkP || 0) + p; S.atk = Math.round((S._atk0 || S.atk) * (1 + S._atkP / 100) * 10) / 10; },
    recalc() {
      const d = R.d(), lv = d.lv, pk = d.pk || 0, s = { atk: 14 + 3 * (lv - 1) + 2 * pk, def: 4 + 1.5 * (lv - 1) + pk, hp: 120 + 18 * (lv - 1) + 12 * pk, crit: 5, critD: 150, spd: 0, cdr: 0, ls: 0, mf: 0, gf: 0, gdr: 0, gsdr: 0, gdmg: 0, gboss: 0, gelite: 0 }, sets = {};   // r3.101.0：新詞條（127_forge3）
      for (const k of SLOT) { const it = d.eq[k]; if (!it) continue; const st = R.itemStats(it); for (const a in st) s[a] += st[a]; if (it.set) sets[it.set] = (sets[it.set] || 0) + 1; }
      const act = [];
      for (const k in sets) { const S2 = SETS[k]; if (sets[k] >= 2) { for (const a in S2.b2) s[a] += S2.b2[a]; act.push(S2.n + '（2）' + S2.d2); } if (sets[k] >= 4) { for (const a in S2.b4) s[a] += S2.b4[a]; act.push(S2.n + '（4）' + S2.d4); } }
      if (G.GROW) G.GROW.apply(s);   // 16_growth：職業／修練加成
      s._atk0 = s.atk; if (s._atkP) s.atk *= 1 + s._atkP / 100;   // r3.94.0：攻擊%（修練、職業、武器熟練、神社、稱號、名物）同區相加
      s.crit = Math.min(75, s.crit); s.cdr = Math.min(40, s.cdr); s.spd = Math.min(40, s.spd); s.ls = Math.min(15, s.ls); s.mf = Math.min(300, s.mf); s.gf = Math.min(300, s.gf);
      for (const a in s) if (typeof s[a] === 'number') s[a] = Math.round(s[a] * 10) / 10;
      s.sets = act; s.setCount = sets; R.S = s;
      const H = G.H, old = H.hpMax; H.hpMax = Math.round(s.hp); H.hp = Math.min(H.hpMax, H.hp + Math.max(0, H.hpMax - old));
      return s;
    },
    init() { const S = G.SAVE.data; if (!S.rpg) S.rpg = R.fresh(); const d = S.rpg; d.mats = d.mats || {}; d.keys = d.keys || {}; uid = d.uid || 2;
      d.weapon = d.weapon || 'katana'; d.wp = d.wp || { katana: { lv: 1, exp: 0 } }; d.wsk = d.wsk || {}; d.wslot = d.wslot || {};
      if (d.skills) { const MAP = { iai: 'iai', issen: 'issen', tsubame: 'tsubame', sakura: 'sakuramai' };   // 舊版打刀四招 → 新資料
        for (const k in d.skills) if (MAP[k]) d.wsk['katana:' + MAP[k]] = d.skills[k];
        d.wslot.katana = { A: MAP[d.slotA] || null, B: MAP[d.slotB] || null }; d.wp.katana.lv = Math.max(d.wp.katana.lv, 8); delete d.skills; delete d.slotA; delete d.slotB; }
      R.recalc(); },
    gainExp(n) { const d = R.d(); d.exp += n; let up = false;
      while (d.exp >= need(d.lv) && d.lv < 100) { d.exp -= need(d.lv); d.lv++; d.sp += 2; up = true; }
      let pu = 0; while (d.lv >= 100 && d.exp >= needP(d.pk || 0)) { d.exp -= needP(d.pk || 0); d.pk = (d.pk || 0) + 1; d.pp = (d.pp || 0) + 1; pu = 1; }   // r3.99.0：巔峰等級改給巔峰點數 +1（126_peak）
      if (pu && !up) { R.recalc(); G.H.hp = G.H.hpMax; G.UI.banner('巔峰等級　' + d.pk, '巔峰點數 +1（選單 › 角色 › 天命）'); G.FX.push({ k: 'lvup', x: G.H.x, y: G.H.y, t: 0, life: 60 }); }
      if (up) { R.recalc(); G.H.hp = G.H.hpMax; G.UI.banner('等級提升　Lv ' + d.lv, '技能點 +2（選單 › 技能）'); G.FX.push({ k: 'lvup', x: G.H.x, y: G.H.y, t: 0, life: 60 }); G.BANTER && G.BANTER.trigger('lvup', true); }
      G.SAVE.markDirty(); },
    /* 掉落：品質依權重；稀品以上可帶本區套裝 */
    roll(lv, region) {
      let tot = 0; const mf = (R.S && R.S.mf || 0) / 100, w = QUAL.map((q, i) => (tot += q.w * (i >= 3 ? 1 + lv * 0.04 : 1) * (i >= 2 ? 1 + mf : 1), tot)); let r = Math.random() * tot, q = 0; while (r > w[q]) q++;
      const tier = Math.max(0, Math.min(7, Math.floor((lv - 1) / 5) - (Math.random() < 0.35 ? 1 : 0))), slot = ri(0, 5), tid = slot * 16 + tier * 2 + ri(0, 1);
      const keys = Object.keys(AFF), aff = [];
      for (let i = 0; i < QUAL[q].aff; i++) { const k = keys[ri(0, keys.length - 1)], base = AFF[k][1]; aff.push([k, Math.round(base * rnd(0.6, 1.2) * (1 + lv * 0.18) * 10) / 10]); }
      const set = q >= 3 && region && Math.random() < 0.6 ? region : null;
      return R.make(tid, q, Math.max(1, lv + ri(-1, 1)), aff, set);
    },
    addItem(it) { const d = R.d(); if (d.bag.length >= d.bagMax) { const g = R.value(it); d.gold += g; G.UI.toast('背包已滿，自動分解　錢 +' + g); return false; }
      d.bag.push(it); d.uid = uid; G.SAVE.markDirty(); return true; },
    value(it) { return Math.round((4 + it.lv * 2) * (1 + it.q * it.q * 0.8)); },
    equip(i) { const d = R.d(), it = d.bag[i]; if (!it) return; const t = TPL[it.t];
      if (t.req > d.lv) { G.UI.toast('需要等級 ' + t.req); return false; }
      d.bag.splice(i, 1); if (d.eq[t.slot]) d.bag.push(d.eq[t.slot]); d.eq[t.slot] = it; R.recalc(); G.SAVE.markDirty(); return true; },
    unequip(slot) { const d = R.d(); if (!d.eq[slot] || slot === 'weapon') return; if (d.bag.length >= d.bagMax) { G.UI.toast('背包已滿'); return; } d.bag.push(d.eq[slot]); d.eq[slot] = null; R.recalc(); G.SAVE.markDirty(); },
    salvage(i) { const d = R.d(), it = d.bag[i]; if (!it) return 0; const g = R.value(it); d.bag.splice(i, 1); d.gold += g; G.SAVE.markDirty(); return g; },
    salvageBelow(q) { const d = R.d(); let g = 0; d.bag = d.bag.filter(it => { if (it.q <= q && !it.set) { g += R.value(it); return false; } return true; }); d.gold += g; G.SAVE.markDirty(); return g; },
    /* 敵人死亡結算 */
    onKill(e) { const lv = e.lv || 1, d = R.d();
      R.gainExp(Math.round(10 + lv * 6)); G.WPN.gainProf(5 + lv);
      const S = R.S, sp = () => ({ x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 14, t: 0 });
      G.LOOT.push(Object.assign(sp(), { kind: 'gold', v: Math.round((ri(3, 6) + lv * 2) * (1 + S.gf / 100)) }));          // 錢：必掉
      if (Math.random() < 0.5) { const keys = Object.keys(MATS), ml = G.SC.def.mats && G.SC.def.mats.length ? G.SC.def.mats : keys, m = ml[ri(0, ml.length - 1)];
        G.LOOT.push(Object.assign(sp(), { kind: 'mat', id: m, n: ri(1, 2) })); }                                            // 素材：50%
      if (Math.random() < 0.06 * (1 + S.mf / 100)) G.LOOT.push(Object.assign(sp(), { kind: 'item', it: R.roll(lv, G.SC.def.region || 'wind') }));   // 裝備：6%×寶物發現
      const c = d.comp.shiro; if (c && G.SAVE.data.flags.shiroJoin) { c.exp += 6 + lv * 3; while (c.exp >= need(c.lv)) { c.exp -= need(c.lv); c.lv++; } } }
  };
  G.LOOT = [];
})();
