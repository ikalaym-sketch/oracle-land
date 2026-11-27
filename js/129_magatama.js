/* ==========================================================================
 * 神諭之地 重製版 — 129_magatama.js
 * Version : r3.147.0  (2026-11-27)　r3.147.0：提示文字改成玩家用語
 * 舊版    : r3.106.0  (2026-11-26)　r3.106.0：難度素材接入：淬鍊 Lv4／5、升品傳說以上、7～9 階勾玉操作；新配方穿玉錐（無間之核 2）
 * 舊版    : r3.104.0  (2026-11-26)　r3.104.0：元素勾玉屬性傷害依妖怪屬性相剋（131_foes elK：對立 ×1.5、同屬 ×0.5）
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：勾玉、道具、未淨化勾玉改用 Gemini 圖（130_icons；圖沒載好時照舊程式畫）；燃燒／冰凍／落雷／映鏡／鬼哭冥殺觸發加特效零件
 * 舊版    : r3.102.0  (2026-11-26)
 * 變更    : r3.102.0 新增。勾玉重做（平衡第 8 步，含夥伴孔）。
 *           ・勾玉 28 種：基礎 10（剛堅命銳烈疾迅玄吸福）、元素 6（火雷冰風聖冥，附全抗）、秘法 12（每件裝備限 1 顆，同名只取最高）。
 *           ・每顆：品階 1～9（7～9 只在修羅／無間掉落）、品質凡～神、品相 80～120%、詞綴 0～4（預算 160／125+35／100+30×2／85+26×3／70+25×4）、
 *             特殊詞綴（增傷／對頭目／對精英／減傷，普通 5% 起）、玉銘（頭目掉落：輕鬆 3／普通 5／困難 8／修羅 12／無間 18%，隱藏頭目 ×1.5）。
 *           ・共鳴：身上同種 2／4／6 顆三段實際效果（燃燒、落雷、冰凍、護盾、回血…）；天命「共鳴專精」選一種 +3%／級，10 級計數 +1。
 *           ・夥伴孔：2 孔，Lv30、Lv60 各 +1（最多 4）；只能鑲剛堅命銳烈與元素；夥伴自己 3 顆同種有小共鳴，不算主角共鳴。
 *           ・神社小雪：第一輪第 8 章完成後解封（第二輪直接開放）；之前掉的是「未淨化勾玉」。舊存檔有舊勾玉的直接開放並轉換。
 *           ・玉屑（分解）＋素材製作七種道具：玉砥石（淬鍊）、玉髓（升品）、合玉符（合成）、洗玉水（洗詞綴）、護玉符（防掉級）、純化香（品相）、轉銘印（轉玉銘）。
 *             穿玉錐：隱藏頭目 2～12%，15 次保底；直接替裝備多開 1 孔（上限 6）。
 *           ・介面：選單 › 裝備 › 勾玉，分頁「玉匣／精煉／製作／共鳴／玉銘／夥伴」；所有清單都可上下捲動（右側捲動條）。
 *             角色 › 狀態另加「共鳴」「玉銘」分頁；鍛冶舖「鑲嵌勾玉」改用新清單。
 *           ・效能：數值只在 recalc 時彙整一次（AG），戰鬥掛點只讀彙整好的旗標；觸發都有內部冷卻（G.PROC）。
 * 存檔    : rpg.mg { on, inv[], un[], it{}, dust, pity, uid, spec }；裝備 it.sock[i]＝勾玉物件；夥伴 comp[id].gem[]。
 * 依賴    : 07_rpg、08/17_menu（PAGE／GROUPS／ui）、16_growth（apply／A）、58_forge（holes／drill／shrineCh）、49_party（stats／data）、
 *           26_boss（onEnd）、73_diff（GDIFF）、03_actors（damageOni／hurtHero／heroStep／PROC／DZ）、124_statui（CTABX）、126_peak（天命 resonance）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, M = G.MENU, C = G.C, ctx = G.ctx, GR = G.GROW, PY = G.PARTY, H = G.H, F = G.FORGE; if (!R || !M || !M.PAGE || !GR || !F) return;
  const U = M.ui, rd = () => R.d(), dirty = () => G.SAVE.markDirty(), fs = () => G.FS(), rnd = (a, b) => a + Math.random() * (b - a), pick = L => L[Math.floor(Math.random() * L.length)];
  const di = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1), HH = () => G.HERO_H, SC = G.SC;
  const TN = ['', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'], GREEN = '#7fd36b', RED = '#e07a6a', GOLD = '#e3c27a', CAP = 300;
  const fmt = v => { const a = Math.abs(v); return a >= 10 ? String(Math.round(v * 10) / 10) : a >= 1 ? (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') : (Math.round(v * 100) / 100).toString(); };

  /* ---------- 種類 ---------- */
  /* [系, 名, 色, 主屬性, 每階基準] */
  const K = {
    gou: ['b', '剛', '#c8463c', 'atkP', 0.25], ken: ['b', '堅', '#a8977c', 'defP', 0.3], mei: ['b', '命', '#3fae6a', 'hpP', 0.3], ei: ['b', '銳', '#bfe3f0', 'crit', 0.12], retsu: ['b', '烈', '#f08a3a', 'critD', 0.5],
    shitsu: ['b', '疾', '#6fd0d8', 'aspd', 0.12], jin: ['b', '迅', '#9fe08a', 'spd', 0.15], gen: ['b', '玄', '#5a6ad0', 'cdr', 0.1], kyu: ['b', '吸', '#b03a72', 'ls', 0.05], fuku: ['b', '福', '#e8c050', 'mf', 0.8],
    fire: ['e', '火', '#f0603a', 'el', 0.25], thunder: ['e', '雷', '#9a7af0', 'el', 0.25], ice: ['e', '冰', '#8fd8f8', 'el', 0.25], wind: ['e', '風', '#5fd0a0', 'el', 0.25], holy: ['e', '聖', '#f3e08a', 'el', 0.25], dark: ['e', '冥', '#8a5ab0', 'el', 0.25],
    kikoku: ['h', '鬼哭', '#4a3038'], raimei: ['h', '雷鳴', '#8a6ae0'], fukutsu: ['h', '不屈', '#efe6d0'], haji: ['h', '破陣', '#4aa0a0'], zanyo: ['h', '斬妖', '#d0403a'], ryumyaku: ['h', '龍脈', '#3a9a6a'],
    kitsunebi: ['h', '狐火', '#f0a040'], kaishun: ['h', '回春', '#f0a0c0'], jouka: ['h', '淨化', '#f0e0a0'], kenrei: ['h', '堅靈', '#8aa0b0'], kagami: ['h', '映鏡', '#d0d8e0'], yoroi: ['h', '護身', '#d05a4a'] };
  const KS = Object.keys(K), SER = { b: '基礎', e: '元素', h: '秘法' }, ofS = s => KS.filter(k => K[k][0] === s);
  const PALLOW = ['gou', 'ken', 'mei', 'ei', 'retsu'].concat(ofS('e'));   // 夥伴可鑲
  /* 秘法：[基準, 每階, 說明] */
  const HI = {
    kikoku: [1.5, 0.4, v => '擊殺後 5 秒增傷 +' + v + '%（最多 5 層）'], raimei: [50, 8, v => '出手 10% 機率落雷，' + v + '% 傷害（1 秒冷卻）'],
    fukutsu: [8, 1.5, v => '生命低於 35% 時受到的傷害 −' + v + '%'], haji: [4, 1.2, v => '對精英 +' + v + '%'], zanyo: [3, 1, v => '對頭目 +' + v + '%'],
    ryumyaku: [0.6, 0.15, v => '戰鬥中每 5 秒回復 ' + v + '% 生命'], kitsunebi: [30, 5, v => '出手 8% 機率狐火追擊 ' + v + '% 傷害'],
    kaishun: [0.5, 0.12, v => '擊殺回復 ' + v + '% 生命'], jouka: [4, 1.2, v => '全抗 +' + v + '%（控制時間縮短）'], kenrei: [3, 0.8, v => '頭目招式減傷 +' + v + '%'],
    kagami: [60, 10, v => '受擊 20% 機率反射 ' + v + '% 傷害給附近敵人'], yoroi: [4, 0.8, v => '每 20 秒護盾，吸收 ' + v + '% 最大生命'] };
  /* 屬性名（套用到角色的） */
  const SN = { atkP: '攻擊%', defP: '防禦%', hpP: '生命%', crit: '會心率', critD: '會心傷害', aspd: '出手速度', spd: '移動速度', cdr: '冷卻縮減', ls: '吸血', mf: '寶物發現', gf: '金錢加成',
    res: '全抗', el: '屬性傷害', gdmg: '增傷', gboss: '對頭目', gelite: '對精英', gdr: '減傷', gsdr: '招式減傷', dmgP: '增傷', allyDmg: '夥伴傷害' };
  /* 觸發效果說明 */
  const PN = { vuln: '攻擊附帶易傷 +{v}%', regen: '戰鬥中每 5 秒回復 {v}% 生命', save: '致命傷留 1 血（120 秒一次）', killHeal: '擊殺回復 {v}% 生命', gemDrop: '勾玉掉落 +{v}%',
    burn: '命中 {v}% 機率燃燒 3 秒', thun: '命中 12% 機率落雷打附近敵人（{v}% 傷害）', thun2: '落雷改打 2 個敵人', frz: '命中 {v}% 機率冰凍 0.6 秒', frzV: '冰凍中的敵人受傷 +{v}%',
    holy: '命中回復 {v}% 生命（1 秒一次）', dk: '擊殺後 3 秒增傷 +{v}%' };
  /* 共鳴：同種 2／4／6 顆 */
  const RS = {
    gou: [{ atkP: 3 }, { dmgP: 5 }, { vuln: 8 }], ken: [{ defP: 6 }, { gsdr: 5 }, { gdr: 5 }], mei: [{ hpP: 6 }, { regen: 1 }, { save: 1 }],
    ei: [{ crit: 3 }, { critD: 15 }, { crit: 5 }], retsu: [{ critD: 12 }, { critD: 20 }, { dmgP: 8 }], shitsu: [{ aspd: 4 }, { cdr: 4 }, { aspd: 8 }],
    jin: [{ spd: 4 }, { spd: 6 }, { gdr: 4 }], gen: [{ cdr: 3 }, { cdr: 4 }, { cdr: 3, dmgP: 4 }], kyu: [{ ls: 0.5 }, { killHeal: 2 }, { ls: 1, dmgP: 4 }],
    fuku: [{ mf: 15 }, { gf: 20 }, { gemDrop: 30 }], fire: [{ el: 4 }, { burn: 20 }, { el: 8 }], thunder: [{ el: 4 }, { thun: 50 }, { thun2: 1, el: 4 }],
    ice: [{ el: 4 }, { frz: 8 }, { frzV: 15 }], wind: [{ el: 4 }, { aspd: 6 }, { spd: 6, aspd: 6 }], holy: [{ el: 4 }, { holy: 0.4 }, { gdr: 5 }], dark: [{ el: 4 }, { vuln: 5 }, { dk: 10 }] };
  /* 玉銘：[頭目 id, 頭目名, 銘名, 屬性, 基準, 每階] */
  const INS = [['kappa', '河童大將', '水流', 'hpP', 1, 0.5], ['kyubi', '白九尾', '妖狐', 'crit', 0.5, 0.25], ['raiju', '雷獸王', '迅雷', 'aspd', 0.6, 0.3], ['oni', '鬼王', '剛力', 'atkP', 0.6, 0.3],
    ['orochi', '八岐大蛇', '毒牙', 'gboss', 1, 0.4], ['osakabe', '長壁姬', '幻城', 'cdr', 0.5, 0.25], ['shuten', '酒吞童子', '醉宴', 'ls', 0.1, 0.05], ['tsuchigumo', '土蜘蛛', '縛絲', 'gelite', 1, 0.4],
    ['watatsumi', '綿津見大神', '潮守', 'defP', 1, 0.5], ['izanami', '伊邪那美', '黃泉', 'gdr', 0.4, 0.15], ['omagatsuhi', '大禍津日神', '禍津', 'critD', 2, 1], ['ibaraki', '茨木童子', '斷臂', 'gdmg', 0.8, 0.3],
    ['doma', '道摩', '咒縛', 'res', 1, 0.5], ['yoshitsune', '源義經', '八艘', 'spd', 0.6, 0.3], ['susanoo', '素戔嗚尊', '天叢雲', 'gsdr', 0.6, 0.25], ['seimei', '安倍晴明', '式神', 'allyDmg', 1, 0.5],
    ['ezo', '熊靈', '爐火', 'mf', 3, 1.5], ['gojo_benkei', '武藏坊弁慶', '立往生', 'gf', 3, 1.5]];
  const INSB = {}; INS.forEach(q => INSB[q[0]] = q);
  const INSRATE = [0.03, 0.05, 0.08, 0.12, 0.18], AWLRATE = [0.02, 0.03, 0.05, 0.08, 0.12];
  /* 數值 */
  const BUD = [[160, 0], [125, 35], [100, 30], [85, 26], [70, 25]], QK = [1, 1.1, 1.22, 1.38, 1.56, 1.8];
  const AB = { atkP: 0.25, defP: 0.3, hpP: 0.3, crit: 0.12, critD: 0.5, aspd: 0.12, spd: 0.15, cdr: 0.1, ls: 0.05, mf: 0.8, gdmg: 0.25, gboss: 0.35, gelite: 0.35, gdr: 0.1 };
  const BASEA = ['atkP', 'defP', 'hpP', 'crit', 'critD', 'aspd', 'spd', 'cdr', 'ls', 'mf'], SPK = ['gdmg', 'gboss', 'gelite', 'gdr'];
  const mOf = g => QK[g.q] * g.f / 100 * (1 + 0.06 * (g.lv || 0)), nA = g => Math.min(4, (g.a || []).length);
  const mainV = g => { const k = K[g.k]; if (k[0] === 'h') { const h = HI[g.k]; return (h[0] + h[1] * g.t) * mOf(g) * BUD[nA(g)][0] / 160; } return k[4] * g.t * mOf(g) * BUD[nA(g)][0] / 100; };
  const affV = (g, a) => AB[a[0]] * g.t * mOf(g) * a[1] * BUD[nA(g)][1] / 100;
  const resV = g => K[g.k][0] === 'e' ? 0.25 * g.t * mOf(g) : 0;
  const insV = g => { const q = INSB[g.m]; return q ? q[4] + q[5] * g.t : 0; };
  function gStats(g) { const o = {}, k = K[g.k]; if (k[0] !== 'h') o[k[3]] = mainV(g); if (k[0] === 'e') o.res = resV(g);
    for (const a of g.a || []) o[a[0]] = (o[a[0]] || 0) + affV(g, a); return o; }
  const gName = g => K[g.k][0] === 'h' ? '秘玉・' + K[g.k][1] : K[g.k][1] + '之勾玉';
  const gMain = g => { const k = K[g.k]; if (k[0] === 'h') return HI[g.k][2](fmt(mainV(g))); return (k[0] === 'e' ? k[1] : '') + SN[k[3]] + ' +' + fmt(mainV(g)) + (k[3] === 'mf' ? '' : '%') + (k[0] === 'e' ? '・全抗 +' + fmt(resV(g)) + '%' : ''); };
  const unit = s => s === 'mf' || s === 'gf' ? '' : '%';
  const insTxt = (q, L) => '玉銘・' + q[2] + '：' + SN[q[3]] + ' +' + fmt(q[4] + q[5] * L) + unit(q[3]);
  const dustOf = g => Math.max(1, Math.round(g.t * (g.q + 1) * 2 * (K[g.k][0] === 'h' ? 1.5 : 1)));

  /* ---------- 存檔 ---------- */
  const OLD = { atk: 'gou', def: 'ken', hp: 'mei', crit: 'ei', critD: 'retsu', ls: 'kyu' };
  function data() { const d = rd(); let m = d.mg; if (m) return m;
    m = d.mg = { v: 1, on: 0, inv: [], un: [], it: {}, dust: 0, pity: 0, uid: 1, spec: null }; let old = 0;
    const conv = s => { const [ty, t] = String(s).split(':'); old++; return { u: m.uid++, k: OLD[ty] || 'gou', t: Math.max(1, Math.min(9, +t || 1)), q: 1, f: 100, a: [], lv: 0 }; };
    for (const k in d.gems || {}) for (let i = 0; i < (d.gems[k] || 0) && m.inv.length < CAP; i++) m.inv.push(conv(k));
    const fix = it => { if (it && it.sock) it.sock = it.sock.map(g => typeof g === 'string' ? conv(g) : g); };
    R.SLOT.forEach(s => fix(d.eq[s])); (d.bag || []).forEach(fix); for (const id in d.comp || {}) for (const s in (d.comp[id].eq || {})) fix(d.comp[id].eq[s]);
    if (old) { m.on = 1; d.gems = {}; }   // 舊存檔已經在用勾玉：直接開放
    return m; }
  const newG = o => Object.assign({ u: data().uid++, lv: 0, a: [] }, o);

  /* ---------- 掉落 ---------- */
  const fateL = id => ((rd().fate || {})[id]) || 0;
  function tierCap() { const i = di(); return i >= 4 ? 9 : i >= 3 ? 8 : 6; }
  function mergeCap() { const c = G.GDIFF && G.GDIFF.cleared; return c && c(4) ? 9 : c && c(3) ? 8 : c && c(2) ? 7 : 6; }
  function rollGem(lv, o) { o = o || {}; const i = di(), cap = tierCap();
    const t = Math.max(1, Math.min(cap, 1 + Math.floor((lv || 1) / 14) + (Math.random() < 0.35 ? 1 : 0) + (o.boss ? 1 : 0)));
    const r = Math.random(), s = r < (o.boss ? 0.22 : 0.07) ? 'h' : r < 0.32 ? 'e' : 'b', k = pick(ofS(s));
    const W = [40, 30, 17, 9, 3.5, 0.5].map((w, q) => q >= 2 ? w * (1 + 0.15 * Math.max(0, i - 1)) * (1 + 0.12 * fateL('treasure')) * (o.boss ? 2 : o.elite ? 1.4 : 1) : w);
    let x = Math.random() * W.reduce((a, b) => a + b), q = 0; while (q < 5 && (x -= W[q]) > 0) q++;
    if (o.boss) q = Math.max(1, q);
    const n = Math.min(s === 'h' ? 2 : 4, [0, Math.random() < 0.5 ? 0 : 1, 1, 1 + (Math.random() < 0.5 ? 1 : 0), 2 + (Math.random() < 0.5 ? 1 : 0), 3 + (Math.random() < 0.5 ? 1 : 0)][q]);
    const g = newG({ k, t, q, f: Math.round(rnd(80, 120)) }); g.a = rollAff(g, n); return g; }
  function rollAff(g, n) { const main = K[g.k][3], A = [], sp = [0.03, 0.05, 0.08, 0.12, 0.18][di()];
    for (let j = 0; j < n; j++) { const pool = (Math.random() < sp ? SPK : BASEA).filter(k => k !== main && !A.some(a => a[0] === k)); if (!pool.length) break; A.push([pick(pool), Math.round(rnd(0.8, 1.2) * 100) / 100]); }
    return A; }
  function give(g, quiet) { const m = data();
    if (!m.on) { if (m.un.length < CAP) m.un.push(g); if (!quiet) G.UI.toast('獲得未淨化勾玉，可到神社請小雪淨化'); }
    else if (m.inv.length >= CAP) { const n = dustOf(g); m.dust += n; G.UI.toast('玉匣已滿，' + gName(g) + ' 自動分解：玉屑 +' + n); }
    else { m.inv.push(g); if (!quiet) G.UI.toast('獲得 ' + gName(g) + '（' + TN[g.t] + '階・' + R.QUAL[g.q].n + '）' + (g.m ? '・玉銘 ' + INSB[g.m][2] : '')); }
    dirty(); }

  /* ---------- 位置與鑲嵌 ---------- */
  const heroItems = () => R.SLOT.map(s => rd().eq[s]).filter(Boolean);
  const pSlots = id => { const c = PY && PY.data(id); if (!c) return 0; return 2 + (c.lv >= 30 ? 1 : 0) + (c.lv >= 60 ? 1 : 0); };
  const pGems = id => { const c = PY.data(id); c.gem = c.gem || []; while (c.gem.length < 4) c.gem.push(null); return c.gem; };
  const pIds = () => PY && PY.DEF ? Object.keys(PY.DEF).filter(id => PY.joined(id)) : [];
  function locate(g) { if (!g) return null; const m = data(); if (m.inv.includes(g)) return { w: 'inv' };
    for (const it of heroItems().concat(rd().bag || [])) { const i = (it.sock || []).indexOf(g); if (i >= 0) return { w: 'eq', it, i, on: heroItems().includes(it) }; }
    for (const id of pIds()) { const i = pGems(id).indexOf(g); if (i >= 0) return { w: 'pt', id, i }; } return null; }
  const take = g => { const m = data(), i = m.inv.indexOf(g); if (i >= 0) m.inv.splice(i, 1); };
  const putBack = g => { const m = data(); if (m.inv.length < CAP) m.inv.push(g); else m.dust += dustOf(g); };
  const unCost = g => 30 * g.t;
  function canItem(it, i, g) { if (K[g.k][0] === 'h' && (it.sock || []).some((x, j) => x && j !== i && K[x.k][0] === 'h')) return '每件裝備只能鑲 1 顆秘法勾玉'; return ''; }
  function sockIn(it, i, g) { if (!it.sock || i >= it.sock.length) return G.UI.toast('這個孔還沒打開'); const why = canItem(it, i, g); if (why) return G.UI.toast(why);
    const old = it.sock[i]; if (old) { if (rd().gold < unCost(old)) return G.UI.toast('替換需要 ' + unCost(old) + ' 錢'); rd().gold -= unCost(old); putBack(old); }
    take(g); it.sock[i] = g; R.recalc(); dirty(); G.UI.toast('鑲嵌：' + gName(g)); return true; }
  function sockOut(loc) { const g = loc.w === 'eq' ? loc.it.sock[loc.i] : pGems(loc.id)[loc.i]; if (!g) return; if (data().inv.length >= CAP) return G.UI.toast('玉匣已滿');
    if (rd().gold < unCost(g)) return G.UI.toast('拆下需要 ' + unCost(g) + ' 錢'); rd().gold -= unCost(g);
    if (loc.w === 'eq') loc.it.sock[loc.i] = null; else pGems(loc.id)[loc.i] = null; putBack(g); R.recalc(); dirty(); G.UI.toast('已拆下 ' + gName(g)); }
  function pIn(id, i, g) { if (i >= pSlots(id)) return G.UI.toast('夥伴 Lv' + (i === 2 ? 30 : 60) + ' 開放'); if (!PALLOW.includes(g.k)) return G.UI.toast('夥伴只能鑲：剛、堅、命、銳、烈與元素勾玉');
    const L = pGems(id), old = L[i]; if (old) { if (rd().gold < unCost(old)) return G.UI.toast('替換需要 ' + unCost(old) + ' 錢'); rd().gold -= unCost(old); putBack(old); }
    take(g); L[i] = g; dirty(); G.UI.toast(PY.DEF[id].name + '：鑲嵌 ' + gName(g)); return true; }
  function useAwl(it) { const m = data(); if (!(m.it.awl > 0)) return; if (F.holes(it) >= 6) return G.UI.toast('孔數已達上限 6'); m.it.awl--; it.awl = (it.awl || 0) + 1; it.sock = it.sock || []; it.sock.push(null); dirty(); G.UI.toast('穿玉錐：' + R.name(it) + ' 多開 1 孔'); }

  /* ---------- 彙整（只在 recalc 時算） ---------- */
  let AG = { st: {}, cnt: {}, hi: {}, ins: {}, E: {} }; const PE = {};
  const APPLY = new Set(Object.keys(SN));
  function compute() { const m = data(), st = {}, cnt = {}, hi = {}, ins = {}, E = {}, add = (k, v) => { if (APPLY.has(k)) st[k] = (st[k] || 0) + v; else E[k] = (E[k] || 0) + v; };
    for (const it of heroItems()) for (const g of it.sock || []) { if (!g || typeof g !== 'object' || !K[g.k]) continue; const o = gStats(g); for (const k in o) add(k, o[k]);
      if (K[g.k][0] === 'h') { const v = mainV(g); if (!(hi[g.k] >= v)) hi[g.k] = v; } else cnt[g.k] = (cnt[g.k] || 0) + 1;
      if (g.m && INSB[g.m] && !(ins[g.m] >= g.t)) ins[g.m] = g.t; }
    const fk = m.spec, fL = fateL('resonance'); if (fk && fL >= 10 && cnt[fk]) cnt[fk]++;
    for (const k in cnt) { const mul = k === fk ? 1 + 0.03 * fL : 1; RS[k].forEach((o, i) => { if (cnt[k] >= (i + 1) * 2) for (const q in o) add(q, o[q] * (q === 'save' || q === 'thun2' ? 1 : mul)); }); }
    const HM = { kikoku: 'kik', raimei: 'rai', fukutsu: 'fuk', haji: 'gelite', zanyo: 'gboss', ryumyaku: 'regen', kitsunebi: 'kit', kaishun: 'killHeal', jouka: 'res', kenrei: 'gsdr', kagami: 'kag', yoroi: 'yor' };
    for (const k in hi) add(HM[k], hi[k]);
    for (const k in ins) { const q = INSB[k]; add(q[3], q[4] + q[5] * ins[k]); }
    E.el = st.el || 0; AG = { st, cnt, hi, ins, E }; return AG; }
  const ap0 = GR.apply.bind(GR); GR.apply = function (s) { const r = ap0(s); try { compute(); const t = AG.st, A = GR.A || (GR.A = {});
      s._atkP = (s._atkP || 0) + (t.atkP || 0); s.def *= 1 + (t.defP || 0) / 100; s.hp *= 1 + (t.hpP || 0) / 100;
      for (const k of ['crit', 'critD', 'aspd', 'spd', 'cdr', 'ls', 'mf', 'gf', 'res', 'gdmg', 'gboss', 'gelite', 'gsdr']) if (t[k]) s[k] = (s[k] || 0) + t[k];
      if (t.gdr) { const g0 = s.gdr || 0; s.gdr = g0 + t.gdr; s.dr = Math.min(50, (s.dr || 0) + Math.min(25, s.gdr) - Math.min(25, g0)); }
      A.dmgP = (A.dmgP || 0) + (t.dmgP || 0); A.allyDmg = (A.allyDmg || 0) + (t.allyDmg || 0); } catch (x) { console.warn('maga', x); } return r; };
  /* 夥伴 */
  function pStats(id) { const st = {}, cnt = {}; for (const g of pGems(id).slice(0, pSlots(id))) { if (!g) continue; const o = gStats(g); for (const k in o) st[k] = (st[k] || 0) + o[k]; cnt[g.k] = (cnt[g.k] || 0) + 1; }
    for (const k in cnt) if (cnt[k] >= 3) { const o = RS[k][0]; for (const q in o) st[q] = (st[q] || 0) + o[q]; }
    PE[id] = st.el || 0; return { st, cnt }; }
  if (PY && PY.stats) { const ps0 = PY.stats; PY.stats = function (id) { const s = ps0.apply(this, arguments); try { const t = pStats(id).st;
      s.atk *= 1 + (t.atkP || 0) / 100; s.def *= 1 + (t.defP || 0) / 100; s.hp *= 1 + (t.hpP || 0) / 100; s.crit += t.crit || 0; s.critD += t.critD || 0; } catch (x) {} return s; }; }
  /* 裝備自己的數值不含勾玉（勾玉改由上面彙整） */
  const is0 = R.itemStats; R.itemStats = function (it) { const s = it && it.sock; if (!s || !s.length) return is0.apply(this, arguments); it.sock = null; try { return is0.apply(this, arguments); } finally { it.sock = s; } };

  /* ---------- 戰鬥掛點 ---------- */
  const near = (e, R2, n) => { const L = []; for (const o of G.E) if (o !== e && o.st !== 'dead' && o.hp > 0) { const d = Math.hypot(o.x - e.x, (o.y - e.y) * 1.4); if (d < R2) L.push([d, o]); } return L.sort((a, b) => a[0] - b[0]).slice(0, n).map(q => q[1]); };
  const FXP = { '燃': 'fxp_ember_leaf', '凍': 'fxp_ice_shard', '雷': 'fxp_rock_chip', '雷鳴': 'fxp_rock_chip', '映': 'fxp_talisman' };
  const pop = (e, v, col) => { G.NUMS.push({ x: e.x, y: e.y - HH() * SC.depth(e.y) * (e.ratio || 1) - 14, v, t: 0, col }); if (FXP[v] && G.ICO) G.ICO.burst(e, FXP[v], 4); };
  const heal = p => { if (H.hp <= 0) return; const v = Math.round(H.hpMax * p / 100); if (v > 0) H.hp = Math.min(H.hpMax, H.hp + v); };
  let kikS = 0, kikT = 0, dkT = 0, shield = 0, shT = 0, saveT = 0, tick = 0;
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) {
    if (!e || e.st === 'dead' || (opt && opt.mg)) return dm0.apply(this, arguments);
    if (opt && opt.party) { const v = opt.party.id && PE[opt.party.id]; if (v) G.DZ.add(v / 100); return dm0.apply(this, arguments); }
    const E = AG.E; if (E.el) G.DZ.add(E.el / 100 * (G.FOES ? G.FOES.elK(e, AG.cnt) : 1)); if (E.kik && kikS && G.t < kikT) G.DZ.add(E.kik * kikS / 100); if (E.dk && G.t < dkT) G.DZ.add(E.dk / 100);
    if (E.vuln) G.DZ.vuln(E.vuln / 100); if (E.frzV && e.stun > 0) G.DZ.vuln(E.frzV / 100);
    const r = dm0.apply(this, arguments); if (opt && (opt.rune || opt.dot)) return r;
    try { if (E.burn && Math.random() < E.burn / 100 && G.PROC('mgBurn', 180, e)) { e.bleed = Math.max(e.bleed || 0, 180); pop(e, '燃', '#ff8a50'); }
      if (E.frz && e.hp > 0 && Math.random() < E.frz / 100 && G.PROC('mgFrz', 240, e)) { e.stun = Math.max(e.stun || 0, 36); pop(e, '凍', '#9fe0ff'); }
      if (E.thun && Math.random() < 0.12 && G.PROC('mgThun', 90)) for (const o of near(e, HH() * 3, E.thun2 ? 2 : 1)) { G.damageOni(o, E.thun / 100, false, false, { mg: 1 }); pop(o, '雷', '#c8b0ff'); }
      if (E.holy && G.PROC('mgHoly', 60)) heal(E.holy);
      if (E.rai && Math.random() < 0.1 && G.PROC('mgRai', 60)) { G.damageOni(e, E.rai / 100, false, false, { mg: 1 }); pop(e, '雷鳴', '#c8b0ff'); SC.shake = Math.max(SC.shake || 0, 3); }
      if (E.kit && Math.random() < 0.08 && G.PROC('mgKit', 36)) { G.damageOni(e, E.kit / 100, false, false, { mg: 1 }); pop(e, '狐火', '#7ff0d0'); } } catch (x) {}
    return r; };
  const k0 = R.onKill; R.onKill = function (e) { const r = k0.apply(this, arguments); try { const E = AG.E;
      if (E.kik) { kikS = G.t < kikT ? Math.min(5, kikS + 1) : 1; kikT = G.t + 300; } if ((E.kik || E.dk) && e && G.ICO) G.ICO.burst(e, 'fxp_petal_spider', 5); if (E.dk) dkT = G.t + 180; if (E.killHeal) heal(E.killHeal);
      if (e && !e.boss && !e.bb && !(G.KASSEN && G.KASSEN.on)) { const ch = (e.elite ? 0.10 : 0.025) * (1 + (E.gemDrop || 0) / 100); if (Math.random() < ch) give(rollGem(e.lv || rd().lv, { elite: !!e.elite })); } } catch (x) { console.warn('maga kill', x); } return r; };
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { const E = AG.E, hp0 = H.hp; if (E.fuk && H.hp < H.hpMax * 0.35) atk *= 1 - Math.min(60, E.fuk) / 100;
    const r = hh0.call(this, atk, srcX); if (!r || H.hp >= hp0) return r;
    if (shield > 0) { const a = Math.min(shield, hp0 - H.hp); H.hp += a; shield -= a; }
    if (H.hp <= 0 && E.save && G.t > saveT) { H.hp = 1; saveT = G.t + 7200; G.UI.toast('命之共鳴：撐住了！'); }
    if (E.kag && Math.random() < 0.2) { const o = near({ x: H.x, y: H.y }, HH() * 2.5, 1)[0]; if (o) { G.damageOni(o, E.kag / 100, false, false, { mg: 1 }); pop(o, '映', '#e8f0ff'); } }
    return r; };
  const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments); const E = AG.E;
    if (++tick % 60 === 0 && (E.regen || E.yor)) { const fight = G.E.some(e => e.st !== 'dead' && e.hp > 0);
      if (E.regen && fight && tick % 300 === 0) heal(E.regen);
      if (E.yor && (shT += 60) >= 1200) { shT = 0; shield = Math.round(H.hpMax * E.yor / 100); } }
    return r; };

  /* ---------- 頭目掉落、穿玉錐 ---------- */
  if (G.BOSS) { const oe0 = G.BOSS.onEnd; G.BOSS.onEnd = function (enc) { const r = oe0 && oe0.apply(this, arguments); try { bossDrop(enc); } catch (x) { console.warn('maga boss', x); } return r; }; }
  function bossDrop(enc) { if (!enc || (G.KASSEN && (G.KASSEN.c || G.KASSEN.on))) return; const id = enc.id || '', hid = /^h_/.test(id), i = di(), m = data();
    const g = rollGem(Math.max(rd().lv, enc.lv || 1), { boss: 1 }), q = INS.find(x => id.indexOf(x[0]) === 0);
    if ((q || hid) && Math.random() < INSRATE[i] * (hid ? 1.5 : 1)) g.m = q ? q[0] : pick(INS)[0];
    give(g);
    if (hid) { m.pity = (m.pity || 0) + 1; if (m.pity >= 15 || Math.random() < AWLRATE[i]) { m.pity = 0; m.it.awl = (m.it.awl || 0) + 1; G.UI.banner('穿玉錐', '裝備可多開 1 孔（選單 › 裝備 › 勾玉）'); } dirty(); } }

  /* ---------- 精煉與製作 ---------- */
  const ITEMS = { whet: ['玉砥石', '淬鍊用'], marrow: ['玉髓', '升品用'], fuse: ['合玉符', '4 階以上合成用'], wash: ['洗玉水', '重洗詞綴'], guard: ['護玉符', '淬鍊失敗不掉級'], incense: ['純化香', '重抽品相（只升不降）'], seal: ['轉銘印', '轉移玉銘'], awl: ['穿玉錐', '裝備多開 1 孔'] };
  const RECIPE = { awl: { dust: 60, dm: { mugen: 2 }, g: 5000 }, whet: { dust: 6, m: { iron: 2 }, g: 100 }, marrow: { dust: 25, m: { jade: 4 }, g: 400 }, fuse: { dust: 10, m: { bone: 3 }, g: 200 }, wash: { dust: 12, m: { cloth: 3 }, g: 200 },
    guard: { dust: 18, y: 1, g: 0 }, incense: { dust: 14, m: { ember: 3 }, g: 300 }, seal: { dust: 40, y: 3, g: 800 } };
  const have = k => data().it[k] || 0, use = (k, n) => { data().it[k] -= n; };
  const EC = () => G.ECON, dmN = (r, n) => { const o = {}; for (const k in r.dm || {}) o[k] = r.dm[k] * n; return o; };   // r3.106.0：難度素材（134_econ）
  const rcTxt = r => ['玉屑 ' + r.dust].concat(Object.keys(r.m || {}).map(k => R.MATS[k].n + ' ' + r.m[k])).concat(Object.keys(r.dm || {}).map(k => (EC() ? EC().name(k) : k) + ' ' + r.dm[k])).concat(r.y ? ['妖玉 ' + r.y] : []).concat(r.g ? ['錢 ' + r.g] : []).join('・');
  const rcOk = (r, n) => { const d = rd(), m = data(); return m.dust >= r.dust * n && Object.keys(r.m || {}).every(k => (d.mats[k] || 0) >= r.m[k] * n) && (!r.dm || (EC() && EC().dmOk(dmN(r, n)))) && (d.yg || 0) >= (r.y || 0) * n && d.gold >= (r.g || 0) * n; };
  function make(k, n) { const r = RECIPE[k]; if (!rcOk(r, n)) return G.UI.toast('材料不夠'); const d = rd(), m = data(); m.dust -= r.dust * n; if (r.dm) EC().dmPay(dmN(r, n)); for (const q in r.m || {}) d.mats[q] -= r.m[q] * n; d.yg = (d.yg || 0) - (r.y || 0) * n; d.gold -= (r.g || 0) * n;
    m.it[k] = (m.it[k] || 0) + n; dirty(); G.UI.toast('製作 ' + ITEMS[k][0] + ' ×' + n); }
  const TR = [1, 1, 0.85, 0.65, 0.45];   // 淬鍊成功率（升到 1～5 級）
  const OPS = {
    temper: { n: '淬鍊', d: g => '全部數值 +6%（目前 +' + (g.lv || 0) + '／5）', c: g => Object.assign({ whet: (g.lv || 0) + 1, g: 100 * g.t * ((g.lv || 0) + 1) }, EC() ? EC().gemDM(g, 'temper') : {}), ok: g => (g.lv || 0) < 5, rate: g => TR[g.lv || 0],
      run(g) { const L = g.lv || 0; if (Math.random() < TR[L]) { g.lv = L + 1; return '淬鍊成功 +' + g.lv; } if (L >= 3) { if (have('guard') > 0) { use('guard', 1); return '淬鍊失敗（護玉符保住等級）'; } g.lv = L - 1; return '淬鍊失敗，掉到 +' + g.lv; } return '淬鍊失敗'; } },
    rank: { n: '升品', d: g => g.q < 5 ? R.QUAL[g.q].n + ' → ' + R.QUAL[g.q + 1].n + '（全部數值 ×' + (QK[g.q + 1] / QK[g.q]).toFixed(2) + '）' : '已是神話', c: g => Object.assign({ marrow: g.q + 1, g: 300 * (g.q + 1) * g.t }, EC() ? EC().gemDM(g, 'rank') : {}), ok: g => g.q < 5,
      run(g) { g.q++; return '升品：' + R.QUAL[g.q].n; } },
    wash: { n: '洗詞綴', d: g => '詞綴種類與數值重抽（' + nA(g) + ' 條）', c: () => ({ wash: 1, g: 150 }), ok: g => nA(g) > 0, run(g) { g.a = rollAff(g, nA(g)); return '詞綴已重洗'; } },
    pure: { n: '純化品相', d: g => '品相 ' + g.f + '% → 重抽 80～120%，只升不降', c: () => ({ incense: 1, g: 100 }), ok: g => g.f < 120, run(g) { const f = g.f; g.f = Math.max(g.f, Math.round(rnd(80, 120))); return g.f > f ? '品相提升到 ' + g.f + '%' : '品相沒有變化'; } },
    fuse: { n: '合成', d: g => { const n = mates(g).length; return '再用 2 顆同種同階（玉匣有 ' + n + ' 顆）→ ' + TN[Math.min(9, g.t + 1)] + '階' + (g.t >= mergeCap() ? '（上限 ' + mergeCap() + ' 階，通關更高難度開放）' : ''); },
      c: g => Object.assign(g.t >= 4 ? { fuse: 1, g: 200 * g.t } : { g: 200 * g.t }, EC() ? EC().gemDM(g, 'fuse') : {}), ok: g => mates(g).length >= 2 && g.t < mergeCap(),
      run(g) { const L = mates(g).sort((a, b) => a.q - b.q || a.f - b.f).slice(0, 2); for (const x of L) { take(x); if (x.q > g.q) g.q = x.q; if (x.f > g.f) g.f = x.f; if (!g.m && x.m) g.m = x.m; } g.t++; return '合成成功：' + TN[g.t] + '階'; } },
    seal: { n: '轉銘', d: g => { const s = S().src; return s ? '把「' + INSB[s.m][2] + '」從 ' + gName(s) + ' 轉到這顆' + (g.m ? '（覆蓋原本的 ' + INSB[g.m][2] + '）' : '') : (g.m ? '這顆已有玉銘；' : '') + '玉匣沒有可轉的玉銘'; },
      c: () => ({ seal: 1, g: 500 }), ok: g => !!S().src && S().src !== g, run(g) { const s = S().src; g.m = s.m; s.m = null; S().src = null; return '玉銘已轉移'; } } };
  const mates = g => data().inv.filter(x => x !== g && x.k === g.k && x.t === g.t && !x.lk);
  const isDM = k => k.startsWith('dm:'), hv = k => isDM(k) ? EC().have(k) : have(k);
  const opCost = c => Object.keys(c).map(k => k === 'g' ? '錢 ' + c.g : (isDM(k) ? EC().name(k) : ITEMS[k][0]) + ' ' + c[k] + '（有 ' + hv(k) + '）').join('・');
  const opPay = c => { for (const k in c) if (k === 'g' ? rd().gold < c.g : hv(k) < c[k]) return false; for (const k in c) if (k === 'g') rd().gold -= c.g; else if (isDM(k)) EC().dmPay({ [k]: c[k] }); else use(k, c[k]); return true; };
  function runOp(id, g) { const o = OPS[id]; if (!o.ok(g)) return; if (!opPay(o.c(g))) return G.UI.toast('道具或錢不夠'); G.UI.toast(o.run(g)); R.recalc(); dirty(); }
  function smash(g) { if (g.lk) return G.UI.toast('已鎖定'); const n = dustOf(g); take(g); data().dust += n; dirty(); G.UI.toast('分解 ' + gName(g) + '：玉屑 +' + n); }
  function smashQ(q) { const m = data(); let n = 0, c = 0; m.inv = m.inv.filter(g => { if (g.q <= q && !g.lk && !g.m && K[g.k][0] !== 'h') { n += dustOf(g); c++; return false; } return true; }); m.dust += n; dirty(); G.UI.toast(c ? '分解 ' + c + ' 顆：玉屑 +' + n : '沒有可分解的'); }

  /* ---------- 小雪（神社） ---------- */
  const canOpen = () => { const f = G.SAVE.data.flags || {}; return !!(f.gameClear || (G.HUB && G.HUB.done && G.HUB.done(8)) || (G.CHEAT && G.CHEAT.on && G.CHEAT.on.unlock)); };
  function purify() { const m = data(); let n = 0; while (m.un.length && m.inv.length < CAP) { m.inv.push(m.un.shift()); n++; } dirty(); return n; }
  const openPage = () => G.STORY.later(2, () => { M.show(); M.goto('勾玉'); });
  const sc0 = F.shrineCh.bind(F); F.shrineCh = function () { const L = sc0.apply(this, arguments) || [], m = data();
    if (!m.on) { if (canOpen()) L.push({ label: '解開勾玉的封印（未淨化 ' + m.un.length + ' 顆）', then: [{ do: () => { m.on = 1; const n = purify(); R.recalc(); G.UI.banner('勾玉解封', n ? '小雪淨化了 ' + n + ' 顆勾玉' : '之後掉落的勾玉可以直接使用'); openPage(); } }] });
      else if (m.un.length) L.push({ label: '未淨化勾玉（' + m.un.length + ' 顆）', then: [{ do: () => G.UI.toast('小雪：「封印還很重……等第八章的事了結再來吧。」') }] }); }
    else { if (m.un.length) L.push({ label: '淨化勾玉（' + m.un.length + ' 顆）', then: [{ do: () => G.UI.toast('淨化了 ' + purify() + ' 顆勾玉') }] }); L.push({ label: '打開玉匣（勾玉）', then: [{ do: openPage }] }); }
    return L; };

  /* ==================== 介面 ==================== */
  const T = (t, x, y, s, c, a, f, w) => G.txt(t, x, y, s, c || C.ink, a || 'left', f || G.FONT, w || 600);
  function fit(t, w, s, wt, f) { ctx.font = `${wt || 600} ${s * fs()}px ${f || G.FONT}`; if (ctx.measureText(t).width <= w) return t; while (t.length > 1 && ctx.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
  const TF = (t, x, y, w, s, c, a, wt, f) => T(fit(t, w, s, wt, f), x, y, s, c, a, f, wt);
  /* 可捲動區＋右側捲動條 */
  function SA(key, x, y, w, h, tot) { const off = U.scrollArea(key, x, y, w, h, tot);
    if (tot > h + 2) { const bh = Math.max(22, h * h / tot), by = y + (-off) / (tot - h) * (h - bh); ctx.fillStyle = 'rgba(227,194,122,.10)'; G.rr(x + w - 7, y + 2, 4, h - 4, 2); ctx.fill(); ctx.fillStyle = 'rgba(227,194,122,.62)'; G.rr(x + w - 7, by, 4, bh, 2); ctx.fill();
      if (-off < tot - h - 4) { ctx.fillStyle = 'rgba(227,194,122,.7)'; ctx.beginPath(); ctx.moveTo(x + w - 18, y + h - 9); ctx.lineTo(x + w - 12, y + h - 3); ctx.lineTo(x + w - 6 - 0, y + h - 9); ctx.fill(); } }
    return off; }
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.round(v * (k || 0.42)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  function mag(cx, cy, r, col, hi, dim) { const hx = cx - 0.12 * r, hy = cy - 0.24 * r, hr = 0.58 * r; ctx.save(); if (dim) ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 0.7, true); ctx.quadraticCurveTo(hx - 0.25 * r, hy + 1.3 * r, hx + 0.85 * r, hy + 1.08 * r); ctx.quadraticCurveTo(hx + 0.5 * r, hy + 0.6 * r, hx + hr, hy); ctx.closePath();
    const gr = ctx.createRadialGradient(hx - hr * 0.35, hy - hr * 0.45, hr * 0.08, hx, hy + r * 0.25, r * 1.25); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.2, col); gr.addColorStop(1, shade(col)); ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = hi ? 1.6 : 1; ctx.strokeStyle = hi ? '#f3c44a' : 'rgba(0,0,0,.5)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + hr * 0.08, hy - hr * 0.02, hr * 0.27, 0, 6.283); ctx.fillStyle = 'rgba(12,8,10,.6)'; ctx.fill(); ctx.restore(); }
  function icon(x, y, s, g, on, glow) { ctx.fillStyle = on ? 'rgba(120,80,30,.6)' : 'rgba(255,255,255,.05)'; G.rr(x, y, s, s, 8); ctx.fill();
    ctx.strokeStyle = glow ? '#ffd65a' : g ? R.QUAL[g.q].c : 'rgba(227,194,122,.25)'; ctx.lineWidth = on || glow ? 2.2 : 1.3; G.rr(x + .5, y + .5, s - 1, s - 1, 8); ctx.stroke();
    if (!g) return; if (!(G.ICO && G.ICO.drawC(G.ICO.gem(g.k), x + s / 2, y + s / 2, s * 0.86))) mag(x + s / 2, y + s / 2, s * 0.36, K[g.k][2], K[g.k][0] === 'h');
    T(TN[g.t], x + s - 4, y + s - 8, 9, '#f6ecd6', 'right', G.FONT_S, 900);
    if (g.m) { ctx.fillStyle = '#f3c44a'; ctx.beginPath(); ctx.arc(x + 7, y + 7, 3.6, 0, 6.283); ctx.fill(); }
    if (g.lv) T('+' + g.lv, x + s - 4, y + 9, 8, '#f3d98a', 'right', G.FONT_S, 900); if (g.lk) T('鎖', x + 4, y + s - 8, 8, '#cbbfa8', 'left', G.FONT, 700); }
  const S = () => M.sel.mg || (M.sel.mg = { tab: 0, f: 0, so: 0, sel: null, sk: null, pt: null, ps: null, src: null, inc: 1 });
  const FL = ['全部', '基礎', '元素', '秘法', '有銘'], SO = ['品階', '品質', '種類'];
  function filt(L, f) { return f === 1 ? L.filter(g => K[g.k][0] === 'b') : f === 2 ? L.filter(g => K[g.k][0] === 'e') : f === 3 ? L.filter(g => K[g.k][0] === 'h') : f === 4 ? L.filter(g => g.m) : L; }
  function sorted(L, so) { const ki = g => KS.indexOf(g.k); return L.slice().sort(so === 0 ? (a, b) => b.t - a.t || b.q - a.q || ki(a) - ki(b) : so === 1 ? (a, b) => b.q - a.q || b.t - a.t || ki(a) - ki(b) : (a, b) => ki(a) - ki(b) || b.t - a.t || b.q - a.q); }
  /* 勾玉格：回傳實際高度 */
  function grid(key, x, y, w, h, list, isOn, onPick, glow) { const ts = Math.round(48 * fs()), gap = 6, cols = Math.max(2, Math.floor((w - 22 + gap) / (ts + gap))), rows = Math.ceil(list.length / cols);
    const off = SA(key, x, y, w, h, rows * (ts + gap) + 6); U.clip(x, y, w - 8, h);
    list.forEach((g, i) => { const tx = x + 10 + (i % cols) * (ts + gap), ty = y + 4 + Math.floor(i / cols) * (ts + gap) + off; if (ty > y + h || ty + ts < y) return;
      icon(tx, ty, ts, g, isOn(g), glow && glow(g)); U.hit(tx, Math.max(ty, y), ts, Math.min(ts, y + h - Math.max(ty, y)), () => onPick(g)); });
    ctx.restore(); }
  /* 費用／按鈕列 */
  function btns(x, y, w, L) { const n = L.length, bw = (w - 6 * (n - 1)) / n; L.forEach(([t, f, k], i) => U.button(x + i * (bw + 6), y, bw, 30, fit(t, bw - 10, 12, 700), f, k || '')); }
  const locTxt = l => !l ? '' : l.w === 'inv' ? '在玉匣' : l.w === 'eq' ? (l.on ? '鑲在 ' + R.SLOTN[R.TPL[l.it.t].slot] + '：' : '鑲在背包裝備：') + R.name(l.it) : '夥伴 ' + PY.DEF[l.id].name + ' 第 ' + (l.i + 1) + ' 孔';

  /* 詳情（共用）：回傳內容高度 */
  function detailBody(x, y, w, g, cmp) { const L = []; let yy = y; const line = (t, c, s, wt) => { L.push([t, c, s, wt]); };
    if (cmp) { const a = gStats(g), b = gStats(cmp), ks = Array.from(new Set(Object.keys(a).concat(Object.keys(b)))); line('換上後（相對 ' + gName(cmp) + ' ' + TN[cmp.t] + '階）', GOLD, 11, 800);
      for (const k of ks) { const dv = (a[k] || 0) - (b[k] || 0); if (Math.abs(dv) >= 0.005) line((dv > 0 ? '▲ ' : '▼ ') + SN[k] + ' ' + (dv > 0 ? '+' : '') + fmt(dv) + unit(k), dv > 0 ? GREEN : RED, 12, 800); }
      if (K[g.k][0] === 'h' || K[cmp.k][0] === 'h') line('秘法：' + (K[g.k][0] === 'h' ? K[g.k][1] : '無') + '（原：' + (K[cmp.k][0] === 'h' ? K[cmp.k][1] : '無') + '）', C.sub, 11, 600);
      if (g.m !== cmp.m) line('玉銘：' + (g.m ? INSB[g.m][2] : '無') + '（原：' + (cmp.m ? INSB[cmp.m][2] : '無') + '）', C.sub, 11, 600);
      if (g.k !== cmp.k) line('共鳴：' + K[cmp.k][1] + ' −1、' + K[g.k][1] + ' +1', C.sub, 11, 600); }
    if (K[g.k][0] === 'h') line(gMain(g), C.ink, 12, 800);
    if ((g.a || []).length) { line('詞綴（' + nA(g) + ' 條・預算 ' + BUD[nA(g)][0] + '%＋' + BUD[nA(g)][1] + '%×' + nA(g) + '）', GOLD, 11, 800);
      for (const a of g.a) line((SPK.includes(a[0]) ? '◆ ' : '・') + SN[a[0]] + ' +' + fmt(affV(g, a)) + unit(a[0]), SPK.includes(a[0]) ? '#f3d98a' : C.ink, 12, 700); }
    else line('無詞綴（主效果 160%）', C.dim, 11, 500);
    if (g.m) line(insTxt(INSB[g.m], g.t) + '（' + INSB[g.m][1] + '）', '#f3c44a', 12, 800);
    if (K[g.k][0] !== 'h') { const n = AG.cnt[g.k] || 0; line('共鳴：身上同種 ' + n + ' 顆' + (n >= 2 ? '（' + (n >= 6 ? 3 : n >= 4 ? 2 : 1) + ' 段生效）' : '') + '　2／4／6 顆生效', C.sub, 11, 500); }
    else line('秘法：每件裝備限 1 顆；同名只取最高', C.sub, 11, 500);
    const LH = 19 * fs(); for (const [t, c, s, wt] of L) { if (yy > -1e4) TF(t, x, yy, w, s, c, 'left', wt); yy += (s >= 13 ? 23 : LH); }
    return yy - y; }
  const HDH = () => 56 * fs();
  function header(x, y, w, g, nw) { icon(x, y + 2, 46 * fs(), g, false); const tx = x + 46 * fs() + 10, tw = w - 46 * fs() - 14;
    TF(gName(g), tx, y + 10 * fs(), nw || tw, 14, R.QUAL[g.q].c, 'left', 900, G.FONT_S);
    TF(TN[g.t] + '階・' + R.QUAL[g.q].n + '・' + SER[K[g.k][0]] + '・品相 ' + g.f + '%' + (g.lv ? '・淬鍊 +' + g.lv : ''), tx, y + 28 * fs(), tw, 10, C.sub, 'left', 600);
    TF(K[g.k][0] === 'h' ? '秘法：' + HI[g.k][2](fmt(mainV(g))) : gMain(g), tx, y + 45 * fs(), tw, 12, '#f6ecd6', 'left', 800); }
  function detail(x, y, w, h) { const s = S(); U.box(x, y, w, h); const g = s.sel, l = locate(g); if (!g || !l) { s.sel = null;
      T('勾玉詳情', x + 14, y + 20, 14, GOLD, 'left', G.FONT_S, 900);
      ['① 點左邊的勾玉看詳情', '② 下方發光的孔＝可以鑲，點一下就鑲進去', '③ 點已鑲的勾玉可以拆下或比較', '④ 同種 2／4／6 顆有共鳴；秘法每件限 1 顆'].forEach((t, i) => TF(t, x + 16, y + 48 + i * 22 * fs(), w - 30, 12, C.sub, 'left', 500));
      return; }
    header(x + 12, y + 8, w - 24, g, w * 0.5); const t0 = y + 8 + HDH(), bh = 36, ch = h - (t0 - y) - bh - 6, key = 'mgD';
    const cmp = s.sk && l.w === 'inv' ? (s.sk.w === 'eq' ? s.sk.it.sock[s.sk.i] : pGems(s.sk.id)[s.sk.i]) : null;
    const tot = (s._dh || 0) + 8, off = SA(key, x, t0, w, ch, tot); U.clip(x, t0, w - 8, ch); s._dh = detailBody(x + 16, t0 + 8 + off, w - 34, g, cmp); ctx.restore();
    TF(locTxt(l), x + w - 14, y + 18, w * 0.45, 10, l.w === 'inv' ? C.dim : GREEN, 'right', 600);
    const by = y + h - bh + 2, bw = w - 24;
    if (l.w === 'inv') { const L = [];
      if (cmp && s.sk) L.push(['替換 ' + unCost(cmp) + '錢', () => { if (s.sk.w === 'eq' ? sockIn(s.sk.it, s.sk.i, g) : pIn(s.sk.id, s.sk.i, g)) s.sk = null; }, 'main']);
      L.push([g.lk ? '解除鎖定' : '鎖定', () => { g.lk = !g.lk; dirty(); }]); L.push(['分解 +' + dustOf(g) + '屑', () => { smash(g); s.sel = null; }, g.lk ? 'off' : '']); L.push(['精煉 ›', () => { s.tab = 1; }]);
      btns(x + 12, by, bw, L); }
    else btns(x + 12, by, bw, [['拆下（錢 ' + unCost(g) + '）', () => { sockOut(l); }, 'main'], ['精煉 ›', () => { s.tab = 1; }]]); }

  /* 身上裝備的孔 */
  function board(x, y, w, h) { const s = S(), m = data(), cs = Math.round(26 * fs()), two = w - 6 * (cs + 6) - 100 < 110, RH = Math.round(two ? 18 * fs() + cs + 14 : Math.max(38 * fs(), cs + 12)), d = rd(), sg = s.sel && data().inv.includes(s.sel) ? s.sel : null; U.box(x, y, w, h);
    T('身上裝備的孔', x + 14, y + 16, 13, GOLD, 'left', G.FONT_S, 900); TF((sg ? '發光＝可以鑲　' : '') + '穿玉錐 ' + (m.it.awl || 0), x + w - 14, y + 16, w * 0.55, 10, sg ? '#ffd65a' : C.sub, 'right', 600);
    const t0 = y + 30, ch = h - 34, off = SA('mgB', x, t0, w, ch, R.SLOT.length * RH + 6); U.clip(x, t0, w - 8, ch);
    const nameW = two ? w - 120 : w - 6 * (cs + 6) - 62;
    R.SLOT.forEach((sl, r) => { const it = d.eq[sl], yy = t0 + 3 + r * RH + off; if (yy > t0 + ch || yy + RH < t0) return;
      ctx.fillStyle = 'rgba(255,255,255,.035)'; G.rr(x + 8, yy, w - 20, RH - 5, 6); ctx.fill();
      T(R.GLYPH[sl], x + 22, yy + (RH - 5) / 2, 14, it ? R.QUAL[it.q].c : C.dim, 'center', G.FONT_S, 900);
      if (!it) { T('（未裝備）', x + 38, yy + (RH - 5) / 2, 11, C.dim); return; }
      const hol = F.holes(it), n = (it.sock || []).length;
      if (two) { TF(R.name(it), x + 38, yy + 10 * fs(), nameW - 40, 11, R.QUAL[it.q].c, 'left', 800); T('孔 ' + n + '／' + hol, x + w - (hol < 6 && m.it.awl > 0 ? 74 : 22), yy + 10 * fs(), 9, C.dim, 'right'); }
      else { TF(R.name(it), x + 38, yy + (RH - 5) * 0.32, nameW - 40, 11, R.QUAL[it.q].c, 'left', 800); T('孔 ' + n + '／' + hol, x + 38, yy + (RH - 5) * 0.76, 9, C.dim); }
      for (let i = 0; i < Math.max(n, hol) && i < 6; i++) { const cx = two ? x + 38 + i * (cs + 6) : x + nameW + i * (cs + 6), cy = two ? yy + 18 * fs() + 2 : yy + (RH - 5 - cs) / 2;
        if (i < n) { const g = it.sock[i], ok = sg && !canItem(it, i, sg), on = s.sk && s.sk.w === 'eq' && s.sk.it === it && s.sk.i === i;
          icon(cx, cy, cs, g, on || (g && g === s.sel), ok && !g);
          if (ok && !g) { ctx.fillStyle = 'rgba(255,214,90,' + (0.18 + 0.12 * Math.sin(G.t / 8)) + ')'; G.rr(cx, cy, cs, cs, 8); ctx.fill(); }
          U.hit(cx, Math.max(cy, t0), cs, cs, () => { if (sg) { if (!g) { sockIn(it, i, sg); s.sel = null; } else s.sk = { w: 'eq', it, i }; } else if (g) { s.sel = g; s.sk = null; } else G.UI.toast('先從左邊選一顆勾玉'); }); }
        else { ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(227,194,122,.45)'; ctx.lineWidth = 1; G.rr(cx + .5, cy + .5, cs - 1, cs - 1, 8); ctx.stroke(); ctx.setLineDash([]);
          T('打', cx + cs / 2, cy + cs / 2, 10, C.sub, 'center', G.FONT_S, 900); U.hit(cx, Math.max(cy, t0), cs, cs, () => F.drill(it)); } }
      if (hol < 6 && m.it.awl > 0) U.button(x + w - 66, two ? yy + 2 : yy + (RH - 5 - 24) / 2, 50, 22, '+錐', () => useAwl(it)); });
    ctx.restore(); }
  /* 玉匣 */
  function boxTab(x, y, w, h) { const s = S(), m = data(), lw = Math.round(Math.max(240, Math.min(w * 0.42, 430))), rx = x + lw + 8, rw = w - lw - 8;
    U.box(x, y, lw, h); const fw = (lw - 20 - 16) / 5; FL.forEach((t, i) => U.button(x + 10 + i * (fw + 4), y + 8, fw, 26, t, () => { s.f = i; M.scroll.mgL = 0; }, s.f === i ? 'main' : ''));
    const list = sorted(filt(m.inv, s.f), s.so); T('玉匣 ' + m.inv.length + '／' + CAP + (s.f ? '・顯示 ' + list.length : ''), x + 12, y + 48, 11, C.sub);
    U.button(x + lw - 92, y + 38, 82, 22, '排序：' + SO[s.so], () => { s.so = (s.so + 1) % 3; });
    if (!list.length) T(m.inv.length ? '這個分類沒有勾玉' : '玉匣是空的（打怪掉落，精英、頭目機率高）', x + lw / 2, y + 100, 11, C.dim, 'center');
    grid('mgL', x, y + 64, lw, h - 70, list, g => g === s.sel, g => { s.sel = s.sel === g ? null : g; s.sk = null; M.scroll.mgD = 0; });
    const dh = Math.round(s.sel ? Math.max(180, Math.min(h * 0.62, 270 * fs())) : Math.max(150, Math.min(h * 0.5, 230 * fs()))); detail(rx, y, rw, dh); board(rx, y + dh + 8, rw, h - dh - 8); }

  /* 精煉 */
  function refineTab(x, y, w, h) { const s = S(), m = data(), lw = Math.round(Math.max(240, Math.min(w * 0.42, 430))), rx = x + lw + 8, rw = w - lw - 8;
    U.box(x, y, lw, h); U.button(x + 10, y + 8, 120, 26, s.inc ? '含身上的 ✓' : '只看玉匣', () => { s.inc = s.inc ? 0 : 1; M.scroll.mgR = 0; }, s.inc ? 'main' : '');
    const eqG = []; heroItems().forEach(it => (it.sock || []).forEach(g => g && eqG.push(g))); if (PY) pIds().forEach(id => pGems(id).forEach(g => g && eqG.push(g)));
    const list = (s.inc ? sorted(eqG, 0) : []).concat(sorted(m.inv, s.so)); T('身上 ' + eqG.length + '・玉匣 ' + m.inv.length, x + lw - 12, y + 21, 10, C.sub, 'right');
    grid('mgR', x, y + 40, lw, h - 46, list, g => g === s.sel, g => { s.sel = g; s.src = null; M.scroll.mgO = 0; });
    U.box(rx, y, rw, h); const g = s.sel && locate(s.sel) ? s.sel : null;
    TF('道具：' + ['whet', 'marrow', 'fuse', 'wash', 'guard', 'incense', 'seal'].map(k => ITEMS[k][0] + ' ' + have(k)).join('・'), rx + 14, y + 16, rw - 28, 10, C.sub);
    if (!g) { T('從左邊選一顆勾玉（身上的也可以直接精煉）', rx + rw / 2, y + h / 2, 13, C.dim, 'center'); return; }
    header(rx + 12, y + 28, rw - 24, g); const t0 = y + 28 + HDH() + 4, ch = h - (t0 - y) - 6, RH = Math.round(66 * fs()), ids = Object.keys(OPS);
    const srcs = m.inv.filter(x => x.m && x !== g); if (s.src && !srcs.includes(s.src)) s.src = null;
    const off = SA('mgO', rx, t0, rw, ch, ids.length * RH + 10); U.clip(rx, t0, rw - 8, ch);
    ids.forEach((id, i) => { const o = OPS[id], yy = t0 + 4 + i * RH + off; if (yy > t0 + ch || yy + RH < t0) return; const ok = o.ok(g), c = o.c(g), bw = Math.min(110, rw * 0.26);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; G.rr(rx + 8, yy, rw - 20, RH - 6, 6); ctx.fill();
      T(o.n, rx + 18, yy + 14 * fs(), 13, ok ? GOLD : C.dim, 'left', G.FONT_S, 900); if (o.rate) TF('成功率 ' + Math.round(o.rate(g) * 100) + '%' + ((g.lv || 0) >= 3 ? '・失敗掉 1 級（有護玉符不掉）' : ''), rx + 70, yy + 14 * fs(), rw - bw - 100, 10, C.sub, 'left', 600);
      TF(o.d(g), rx + 18, yy + 32 * fs(), rw - bw - 44, 11, C.ink, 'left', 600); TF(opCost(c), rx + 18, yy + 49 * fs(), rw - bw - 44, 10, C.dim, 'left', 500);
      if (id === 'seal' && srcs.length) U.button(rx + rw - bw - 22 - 70, yy + (RH - 6 - 26) / 2, 64, 26, '換來源', () => { const k = srcs.indexOf(s.src); s.src = srcs[(k + 1) % srcs.length]; });
      U.button(rx + rw - bw - 18, yy + (RH - 6 - 32) / 2, bw, 32, o.n, ok ? () => runOp(id, g) : null, ok ? 'main' : 'off'); });
    ctx.restore(); }

  /* 製作 */
  function craftTab(x, y, w, h) { const m = data(), d = rd(), lw = Math.round(Math.max(240, Math.min(w * 0.38, 380))), rx = x + lw + 8, rw = w - lw - 8;
    U.box(x, y, lw, h); const lt = (m._lh || 300), lo = SA('mgCL', x, y + 4, lw, h - 8, lt); U.clip(x, y + 4, lw - 8, h - 8); y += lo; const yA = y;
    T('材料', x + 14, y + 18, 13, GOLD, 'left', G.FONT_S, 900);
    const own = [['玉屑', m.dust], ['妖玉', d.yg || 0], ['錢', d.gold]].concat(Object.keys(R.MATS).map(k => [R.MATS[k].n, d.mats[k] || 0])), cw2 = (lw - 28) / 2;
    own.forEach(([n, v], i) => { const xx = x + 14 + (i % 2) * cw2, yy = y + 42 + Math.floor(i / 2) * 20 * fs(); T(n, xx, yy, 11, C.sub); T(String(v), xx + cw2 - 10, yy, 12, C.ink, 'right', G.FONT_S, 800); });
    const by0 = y + 42 + Math.ceil(own.length / 2) * 20 * fs() + 6; T('一鍵分解（未鎖、沒有玉銘、不含秘法）', x + 14, by0 + 6, 11, GOLD, 'left', G.FONT_S, 800);
    [[0, '凡品'], [1, '良品以下'], [2, '精品以下']].forEach(([q, t], i) => { const n = m.inv.filter(g => g.q <= q && !g.lk && !g.m && K[g.k][0] !== 'h').length;
      U.button(x + 12, by0 + 20 + i * 36, lw - 24, 30, t + '（' + n + ' 顆）', n ? () => smashQ(q) : null, n ? '' : 'off'); });
    T('分解單顆：玉匣選勾玉 › 分解', x + 14, by0 + 20 + 3 * 36 + 8, 10, C.dim); m._lh = by0 + 20 + 3 * 36 + 24 - yA; ctx.restore(); y -= lo;
    U.box(rx, y, rw, h); T('製作勾玉道具', rx + 14, y + 18, 13, GOLD, 'left', G.FONT_S, 900); const ks = Object.keys(RECIPE), RH = Math.round(60 * fs()), t0 = y + 32, ch = h - 36;
    const off = SA('mgC', rx, t0, rw, ch, ks.length * RH + 54); U.clip(rx, t0, rw - 8, ch);
    ks.forEach((k, i) => { const r = RECIPE[k], yy = t0 + 4 + i * RH + off; if (yy > t0 + ch || yy + RH < t0) return; const ok1 = rcOk(r, 1), ok5 = rcOk(r, 5), bw = Math.min(70, rw * 0.15);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; G.rr(rx + 8, yy, rw - 20, RH - 6, 6); ctx.fill();
      const iw = G.ICO && G.ICO.drawC(G.ICO.item(k), rx + 14 + (RH - 12) / 2, yy + (RH - 6) / 2, RH - 12) ? RH - 6 : 0;
      T(ITEMS[k][0], rx + 18 + iw, yy + 14 * fs(), 13, C.ink, 'left', G.FONT_S, 900); TF('持有 ' + have(k) + '・' + ITEMS[k][1], rx + 90 + iw, yy + 14 * fs(), rw - 2 * bw - 120 - iw, 10, C.sub);
      TF(rcTxt(r), rx + 18 + iw, yy + 36 * fs(), rw - 2 * bw - 50 - iw, 10, ok1 ? C.ink : RED);
      U.button(rx + rw - 2 * bw - 26, yy + (RH - 6 - 30) / 2, bw, 30, '×1', ok1 ? () => make(k, 1) : null, ok1 ? 'main' : 'off');
      U.button(rx + rw - bw - 20, yy + (RH - 6 - 30) / 2, bw, 30, '×5', ok5 ? () => make(k, 5) : null, ok5 ? '' : 'off'); });
    const yy = t0 + 4 + ks.length * RH + off + 8; TF('穿玉錐 ' + have('awl') + '：隱藏頭目會掉（' + AWLRATE.map(v => Math.round(v * 100) + '%').join('／') + '，15 次保底），也能用無間之核製作；在玉匣的孔列表按「+錐」使用', rx + 16, yy, rw - 30, 10, C.sub); ctx.restore(); }

  /* 共鳴（也給角色頁用） */
  function resoTab(x, y, w, h) { const s = S(), m = data(), fL = fateL('resonance'); U.box(x, y, w, h);
    TF('共鳴：身上同種勾玉 2／4／6 顆生效（夥伴的不算）' + (fL ? '・專精 ' + (m.spec ? K[m.spec][1] : '未選') + '（+' + 3 * fL + '%' + (fL >= 10 ? '、計數 +1' : '') + '）' : '・天命「共鳴專精」可強化一種'), x + 14, y + 16, w - 28, 11, C.sub);
    const ks = ofS('b').concat(ofS('e')), RH = Math.round(70 * fs()), hiK = Object.keys(AG.hi), t0 = y + 30, ch = h - 34, tot = ks.length * RH + 40 + Math.max(1, hiK.length) * 22 * fs() + 40 + Object.keys(AG.E).length * 0;
    const off = SA('mgS', x, t0, w, ch, tot); U.clip(x, t0, w - 8, ch); const tw = w - 150;
    ks.forEach((k, i) => { const yy = t0 + 4 + i * RH + off; if (yy > t0 + ch || yy + RH < t0) return; const n = AG.cnt[k] || 0, sp = m.spec === k, mul = sp ? 1 + 0.03 * fL : 1;
      ctx.fillStyle = n >= 2 ? 'rgba(120,80,30,.28)' : 'rgba(255,255,255,.03)'; G.rr(x + 8, yy, w - 22, RH - 6, 6); ctx.fill(); if (sp) { ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 1.4; G.rr(x + 8.5, yy + .5, w - 23, RH - 7, 6); ctx.stroke(); }
      if (!(G.ICO && G.ICO.drawC(G.ICO.gem(k), x + 30, yy + (RH - 6) / 2 - 6, 38 * fs(), n ? 1 : 0.45))) mag(x + 30, yy + (RH - 6) / 2 - 6, 15 * fs(), K[k][2], false, !n); T(K[k][1] + (sp ? '★' : ''), x + 30, yy + RH - 16, 11, n ? C.ink : C.dim, 'center', G.FONT_S, 900);
      T(SN[K[k][3]] === '屬性傷害' ? K[k][1] + '屬性' : SN[K[k][3]], x + 56, yy + 14 * fs(), 11, C.sub); T(n + ' 顆', x + 56, yy + 34 * fs(), 14, n >= 2 ? GOLD : C.dim, 'left', G.FONT_S, 900);
      for (let p = 0; p < 6; p++) { ctx.fillStyle = p < n ? K[k][2] : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(x + 60 + p * 9, yy + 50 * fs(), 3, 0, 6.283); ctx.fill(); }
      RS[k].forEach((o, j) => { const on = n >= (j + 1) * 2, t = Object.keys(o).map(q => SN[q] ? SN[q] + ' +' + fmt(o[q] * mul) + unit(q) : PN[q].replace('{v}', fmt(o[q] * mul))).join('、');
        TF(['②', '④', '⑥'][j] + ' ' + t, x + 130, yy + (12 + j * 18) * fs(), tw - (fL ? 90 : 10), 11, on ? GREEN : C.dim, 'left', on ? 800 : 500); });
      if (fL && !s.ro) U.button(x + w - 96, yy + (RH - 6 - 26) / 2, 76, 26, sp ? '專精中' : '設為專精', sp ? null : () => { m.spec = k; R.recalc(); dirty(); }, sp ? 'main' : ''); });
    let yy = t0 + 4 + ks.length * RH + off + 14; T('秘法（同名只取最高；每件裝備限 1 顆）', x + 14, yy, 13, GOLD, 'left', G.FONT_S, 900); yy += 24 * fs();
    if (!hiK.length) { T('身上沒有秘法勾玉', x + 20, yy, 11, C.dim); yy += 22 * fs(); }
    for (const k of hiK) { TF(K[k][1] + '：' + HI[k][2](fmt(AG.hi[k])), x + 20, yy, w - 40, 12, GREEN, 'left', 700); yy += 22 * fs(); }
    ctx.restore(); }
  /* 玉銘（也給角色頁用） */
  function insTab(x, y, w, h) { const m = data(); U.box(x, y, w, h); const own = {};
    m.inv.forEach(g => { if (g.m) own[g.m] = Math.max(own[g.m] || 0, g.t); }); heroItems().forEach(it => (it.sock || []).forEach(g => { if (g && g.m) own[g.m] = Math.max(own[g.m] || 0, g.t); }));
    TF('玉銘：擊敗頭目時掉落的勾玉附帶（輕鬆 3%・普通 5%・困難 8%・修羅 12%・無間 18%，隱藏頭目 ×1.5）', x + 14, y + 16, w - 28, 11, C.sub);
    TF('同名玉銘只取最高 1 條；可用「轉銘印」轉到別顆勾玉（精煉）', x + 14, y + 34, w - 28, 11, C.dim);
    const cols = w > 720 ? 2 : 1, cw = (w - 24 - (cols - 1) * 8) / cols, RH = Math.round(50 * fs()), t0 = y + 46, ch = h - 50, rows = Math.ceil(INS.length / cols);
    const off = SA('mgI', x, t0, w, ch, rows * RH + 8); U.clip(x, t0, w - 8, ch);
    INS.forEach((q, i) => { const xx = x + 10 + (i % cols) * (cw + 8), yy = t0 + 4 + Math.floor(i / cols) * RH + off; if (yy > t0 + ch || yy + RH < t0) return; const L = AG.ins[q[0]], o = own[q[0]];
      ctx.fillStyle = L ? 'rgba(120,80,30,.3)' : 'rgba(255,255,255,.03)'; G.rr(xx, yy, cw - 6, RH - 6, 6); ctx.fill();
      T('玉銘・' + q[2], xx + 10, yy + 14 * fs(), 13, L ? '#f3c44a' : o ? C.ink : C.dim, 'left', G.FONT_S, 900); TF(q[1], xx + cw - 16, yy + 14 * fs(), cw * 0.4, 10, C.dim, 'right');
      TF(L ? '生效 ' + TN[L] + '階：' + SN[q[3]] + ' +' + fmt(q[4] + q[5] * L) + unit(q[3]) : o ? '持有（' + TN[o] + '階）未鑲：' + SN[q[3]] + ' +' + fmt(q[4] + q[5] * o) + unit(q[3]) : '未取得・' + SN[q[3]] + ' +(' + q[4] + '＋' + q[5] + '×階)' + unit(q[3]),
        xx + 10, yy + 32 * fs(), cw - 26, 11, L ? GREEN : o ? C.sub : C.dim, 'left', 600); });
    ctx.restore(); }
  /* 夥伴 */
  function partyTab(x, y, w, h) { const s = S(), ids = pIds(), lw = Math.round(Math.max(150, Math.min(w * 0.22, 220))); U.box(x, y, lw, h);
    if (!ids.length) { T('還沒有夥伴', x + lw / 2, y + 40, 12, C.dim, 'center'); return; } if (!ids.includes(s.pt)) { s.pt = ids[0]; s.ps = null; }
    const RH = Math.round(44 * fs()), off = SA('mgP', x, y + 6, lw, h - 12, ids.length * RH + 4); U.clip(x, y + 6, lw - 8, h - 12);
    ids.forEach((id, i) => { const yy = y + 8 + i * RH + off, on = id === s.pt; if (yy > y + h || yy + RH < y) return; ctx.fillStyle = on ? 'rgba(120,80,30,.5)' : 'rgba(255,255,255,.04)'; G.rr(x + 6, yy, lw - 18, RH - 4, 6); ctx.fill();
      T(PY.DEF[id].name, x + 14, yy + RH * 0.34, 13, C.ink, 'left', G.FONT_S, 900); const n = pGems(id).slice(0, pSlots(id)).filter(Boolean).length; T('Lv ' + PY.data(id).lv + '・勾玉 ' + n + '／' + pSlots(id), x + 14, yy + RH * 0.7, 10, C.sub);
      U.hit(x + 6, Math.max(yy, y + 6), lw - 18, RH - 4, () => { s.pt = id; s.ps = null; }); }); ctx.restore();
    const id = s.pt, rx = x + lw + 8, rw = w - lw - 8, L = pGems(id), ns = pSlots(id), P = pStats(id); U.box(rx, y, rw, h);
    T(PY.DEF[id].name + ' 的勾玉孔', rx + 14, y + 18, 14, GOLD, 'left', G.FONT_S, 900); TF('只能鑲：剛、堅、命、銳、烈與元素', rx + rw - 14, y + 18, rw * 0.5, 10, C.sub, 'right');
    const cs = Math.round(Math.min(48 * fs(), (rw - 70) / 4)), sw = rw - 30 - 4 * (cs + 10), side = sw >= 200; for (let i = 0; i < 4; i++) { const cx = rx + 16 + i * (cs + 10), cy = y + 34, g = L[i], open = i < ns, on = s.ps === i;
      if (!open) { ctx.fillStyle = 'rgba(0,0,0,.35)'; G.rr(cx, cy, cs, cs, 8); ctx.fill(); T('Lv' + (i === 2 ? 30 : 60), cx + cs / 2, cy + cs / 2, 11, C.dim, 'center', G.FONT_S, 900); continue; }
      icon(cx, cy, cs, g, on, !g && s.ps === null); U.hit(cx, cy, cs, cs, () => { s.ps = s.ps === i ? null : i; }); }
    const cntTxt = Object.keys(P.cnt).filter(k => P.cnt[k] >= 3).map(k => K[k][1] + '×' + P.cnt[k] + '：' + Object.keys(RS[k][0]).map(q => SN[q] + ' +' + RS[k][0][q] + unit(q)).join('、'));
    const sx = side ? rx + 16 + 4 * (cs + 10) + 6 : rx + 16, sy = side ? y + 44 : y + 34 + cs + 16, tw = rw - (sx - rx) - 14, LH = 18 * fs();
    TF('小共鳴（同種 3 顆）：' + (cntTxt.length ? cntTxt.join('；') : '目前沒有'), sx, sy, tw, 11, cntTxt.length ? GREEN : C.sub, 'left', 700);
    const st = Object.keys(P.st).filter(k => ['atkP', 'defP', 'hpP', 'crit', 'critD', 'el', 'res'].includes(k)).map(k => SN[k] + ' +' + fmt(P.st[k]) + unit(k)).join('・');
    TF('合計：' + (st || '無'), sx, sy + LH, tw, 10, C.sub, 'left', 600);
    const t0 = side ? y + 34 + cs + 16 : sy + 2 * LH + 6, sel = s.ps !== null && s.ps < ns ? L[s.ps] : null;
    if (s.ps === null) { T('點上面一個孔，再從下面選勾玉', rx + 16, t0 + 8, 12, C.sub); return; }
    if (sel) { TF('第 ' + (s.ps + 1) + ' 孔：' + gName(sel) + '　' + gMain(sel), rx + 16, t0 + 8, rw - 160, 12, C.ink, 'left', 700); U.button(rx + rw - 136, t0 - 6, 120, 28, '拆下（錢 ' + unCost(sel) + '）', () => sockOut({ w: 'pt', id, i: s.ps }), 'main'); }
    else T('第 ' + (s.ps + 1) + ' 孔：空的 — 點下面的勾玉鑲進去', rx + 16, t0 + 8, 12, '#ffd65a', 'left', G.FONT, 700);
    const list = sorted(data().inv.filter(g => PALLOW.includes(g.k)), 0);
    if (!list.length) T('玉匣沒有夥伴可用的勾玉', rx + rw / 2, t0 + 50, 11, C.dim, 'center');
    grid('mgPG', rx, t0 + 24, rw, h - (t0 + 24 - y) - 6, list, () => false, g => { pIn(id, s.ps, g); }); }
  /* 未解封 */
  function lockedPage(x, y, w, h) { const m = data(); U.box(x, y, w, h); if (!(G.ICO && G.ICO.drawC('gem_unpurified', x + w / 2, y + h * 0.3, 104 * fs()))) mag(x + w / 2, y + h * 0.3, 40 * fs(), '#5a5560', false, true);
    T('勾玉尚未解封', x + w / 2, y + h * 0.3 + 60 * fs(), 18, GOLD, 'center', G.FONT_S, 900);
    const L = ['未淨化勾玉 ' + m.un.length + ' 顆（打怪掉落，精英、頭目機率高）', '解封：第一輪完成第 8 章後，到環谷神社找小雪（第二輪起直接開放）', '目前：第 8 章 ' + (canOpen() ? '已完成 — 可以去找小雪了' : '未完成')];
    L.forEach((t, i) => TF(t, x + w / 2, y + h * 0.3 + (92 + i * 24) * fs(), w - 40, 12, i === 2 && canOpen() ? GREEN : C.sub, 'center', 600)); }
  /* 頁面 */
  const TABS = ['玉匣', '精煉', '製作', '共鳴', '玉銘', '夥伴'], PAGES = [boxTab, refineTab, craftTab, resoTab, insTab, partyTab];
  M.PAGE['勾玉'] = function (x, y, w, h) { data(); const s = S(); s.ro = 0; if (!data().on) return lockedPage(x, y, w, h);
    const n = TABS.length, cw = Math.min(86, (w - 140 - 6 * (n - 1)) / n); TABS.forEach((t, i) => U.button(x + i * (cw + 6), y, cw, 28, t, () => { s.tab = i; }, i === s.tab ? 'main' : ''));
    TF('玉屑 ' + data().dust + (data().un.length ? '・未淨化 ' + data().un.length : ''), x + w - 4, y + 14, 130, 11, C.sub, 'right', 700);
    PAGES[s.tab](x, y + 36, w, h - 36); };
  if (M.GROUPS) { const g = M.GROUPS.find(q => q[0] === '裝備'); if (g && !g[1].some(q => q[1] === '勾玉')) g[1].push(['勾玉', '勾玉']); }
  /* 角色 › 狀態：共鳴、玉銘分頁（124_statui） */
  (M.CTABX = M.CTABX || []).push(['共鳴', (x, y, w, h) => { S().ro = 1; resoTab(x, y, w, h); }], ['玉銘', (x, y, w, h) => insTab(x, y, w, h)]);
  /* 鍛冶舖：鑲嵌勾玉彈窗 */
  function pickPop(it, close) { const m = data(), W2 = Math.min(560, G.LW - 60), H2 = Math.min(G.LH - 40, 340 * fs()), x = (G.LW - W2) / 2, y = (G.LH - H2) / 2, i = (it.sock || []).indexOf(null);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, G.LW, G.LH); M.hits.length = 0; M.area.length = 0; U.hit(0, 0, G.LW, G.LH, close); U.box(x, y, W2, H2); U.hit(x, y, W2, H2, () => {});
    T('選擇要鑲嵌的勾玉', x + 16, y + 22, 14, GOLD, 'left', G.FONT_S, 900); U.button(x + W2 - 70, y + 8, 58, 26, '關閉', close);
    if (!m.on) { TF('勾玉尚未解封（第 8 章後找神社小雪）', x + 16, y + 60, W2 - 32, 12, C.sub); return; }
    const list = sorted(m.inv.filter(g => !canItem(it, i, g)), 0); if (!list.length) T('玉匣沒有可鑲的勾玉', x + W2 / 2, y + 80, 12, C.dim, 'center');
    TF('詳細比較、拆下、共鳴：選單 › 裝備 › 勾玉', x + 16, y + 44, W2 - 32, 10, C.dim);
    const cols = W2 > 480 ? 2 : 1, cw = (W2 - 28 - (cols - 1) * 8) / cols, RH = Math.round(46 * fs()), t0 = y + 56, ch = H2 - 62, off = SA('mgPop', x, t0, W2, ch, Math.ceil(list.length / cols) * RH + 6); U.clip(x, t0, W2 - 8, ch);
    list.forEach((g, k) => { const xx = x + 12 + (k % cols) * (cw + 8), yy = t0 + 2 + Math.floor(k / cols) * RH + off; if (yy > t0 + ch || yy + RH < t0) return;
      ctx.fillStyle = 'rgba(255,255,255,.04)'; G.rr(xx, yy, cw, RH - 4, 6); ctx.fill(); icon(xx + 3, yy + 3, RH - 10, g, false);
      TF(gName(g) + '　' + TN[g.t] + '階・' + R.QUAL[g.q].n, xx + RH, yy + (RH - 4) * 0.32, cw - RH - 8, 11, R.QUAL[g.q].c, 'left', 800);
      TF(gMain(g) + ((g.a || []).length ? '・詞綴 ' + g.a.length : '') + (g.m ? '・玉銘' : ''), xx + RH, yy + (RH - 4) * 0.72, cw - RH - 8, 10, C.sub, 'left', 600);
      U.hit(xx, Math.max(yy, t0), cw, RH - 4, () => { sockIn(it, i, g); close(); }); }); ctx.restore(); }
  Object.assign(MG(), { data, compute, give, rollGem, gStats, gName, gMain, locate, sockIn, sockOut, pIn, pStats, purify, canOpen, pickPop, AG: () => AG, K, INS, RS,
    glyph: g => (g && K[g.k] ? K[g.k][1][0] : '玉'),
    sumGem() { const o = {}; for (const k in AG.st) o[k] = { nm: SN[k] + (unit(k) && SN[k].indexOf('%') < 0 ? '（%）' : ''), v: AG.st[k], n: '' }; return o; } });
  function MG() { return G.MAGA || (G.MAGA = {}); }
  /* 裝備被賣出／分解／移轉消耗時，鑲在上面的勾玉退回玉匣（存檔前、選單畫面、每格檢查；只有存檔標記變動後才做） */
  let HOLD = [], pend = 1;
  function rescue() { pend = 0; const D = G.SAVE.data; if (!D || !D.rpg || !D.rpg.mg) return; const d = D.rpg, S2 = new Set(); R.SLOT.forEach(s => d.eq[s] && S2.add(d.eq[s])); (d.bag || []).forEach(i => S2.add(i));
    for (const id in d.comp || {}) for (const s in (d.comp[id].eq || {})) if (d.comp[id].eq[s]) S2.add(d.comp[id].eq[s]);
    let n = 0; for (const it of HOLD) if (!S2.has(it)) { (it.sock || []).forEach((g, i) => { if (g && typeof g === 'object') { putBack(g); it.sock[i] = null; n++; } }); }
    HOLD = []; for (const it of S2) if (it.sock && it.sock.some(Boolean)) HOLD.push(it);
    if (n) { G.UI.toast('裝備離開了，' + n + ' 顆勾玉已退回玉匣'); G.SAVE.dirty = true; } }
  const md0 = G.SAVE.markDirty; G.SAVE.markDirty = function () { pend = 1; return md0.apply(this, arguments); };
  const fl0 = G.SAVE.flush; G.SAVE.flush = function () { if (pend) try { rescue(); } catch (x) {} return fl0.apply(this, arguments); };
  for (const f of ['load', 'newGame']) { const o = G.SAVE[f]; G.SAVE[f] = function () { HOLD = []; pend = 1; return o.apply(this, arguments); }; }
  const hs1 = G.heroStep; G.heroStep = function () { if (pend) try { rescue(); } catch (x) {} return hs1.apply(this, arguments); };
  const dr0 = M.draw; M.draw = function () { if (pend) try { rescue(); } catch (x) {} return dr0.apply(this, arguments); };
  /* 讀檔後轉換一次 */
  const in0 = R.init.bind(R); R.init = function () { const r = in0.apply(this, arguments); try { data(); R.recalc(); } catch (x) { console.warn('maga init', x); } return r; };
})();
