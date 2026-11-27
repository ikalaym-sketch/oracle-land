/* ==========================================================================
 * 神諭之地 重製版 — 98_explore.js
 * Version : r3.169.0  (2026-11-27)　r3.169.0：10 張探索區換 ChatGPT 新圖（1672×941，可走 53%～79%）；三座被遺棄的村莊改成三處祕境（A 進、A 右緣進 B，B 等級 +3、每批 8～11 隻、出該章妖怪）；暗圖人物身邊加淡光
 * 舊版    : r3.126.0  (2026-11-27)　r3.126.0：10 張探索專屬圖改回原圖 1376×768（不放大、不銳化）
 * 舊版    : r3.120.0  (2026-11-26)　r3.120.0：第 2 章探索改海崖→水軍礁島、第 5 章改富士路→裂谷盆地（不用村莊類）；兩張串連，只從第 1 張進，第 2 張等級 +3、每批 8～11 隻
 * 舊版    : r3.118.0  (2026-11-26)　r3.118.0：第 1／3／4／6／7／8／9／10／11／12 章第一個探索區改用 Gemini v2.1 專屬新圖（N_EX01～12）
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：無間難度的精緻寶箱改用 obj_chest_mugen
 * 舊版    : r3.91.0  (2026-11-26)　r3.91.0：探索入口改找左／右半邊可走範圍最寬的位置（避開橋面、窄路）　r3.90.0：r3.90.0：出怪放慢（每批 10～14→6～9 隻、清空後 4 秒→10 秒）；探索入口改放路邊（可走範圍上／下緣，不在路中間），村落、城鎮地圖不放入口
 * 舊版    : r3.59.0  (2026-11-24)
 * 變更    : r3.59.0 新增。探索區＋三座廢村＋隱藏王試煉場。
 *           ・每章 2 個探索區（章節第 1、2 張地圖上的「探索・地名」標記進入）；借用沒入口／只用過一次的地圖，可重複使用（同一張圖不同章＝不同等級與敵人）。
 *           ・三座新匯入的村落改成廢村探索區：被遺棄的茅森村／被遺棄的曙野營村／被遺棄的葦穗村——只出人類敵人（山賊→野武士／忍者→道摩軍，依章節）。
 *           ・探索區出怪較多：每批 10～14 隻、清空 4 秒後再來一批；每批 1 隻精英（第 4 批起 2 隻）；每清 3 批出現寶箱；地圖上 3 個調查點（每次進場可調查一次）。
 *           ・4 位隱藏王（源賴光／梟神／建御雷／役小角）的試煉場＝複製副本最深處的地圖（不帶副本波次）。
 *           ・場景資料在開機時複製一次（G.D.scenes＋WORLD.meta），圖檔由 ASSET.img 改指原圖，不另存圖。
 * 依賴    : 18_world（WORLD.meta、進場載圖）、02_scene（autoSpawn）、22_event（EV.props 互動物件）、52_hub（HUB.travel、marks、ids）、28_trial（ARENA）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, WD = G.WORLD, HUB = G.HUB, F = () => G.SAVE.data.flags; if (!WD || !HUB) return;
  const nm = id => (G.D.scenes[id] || {}).name || id, rnd = a => a[Math.floor(Math.random() * a.length)];
  const act = fn => ({ do: fn }), say = (who, text) => ({ who, text });
  /* ---------- 1. 新村落（廢村）可走範圍：照原圖逐張描（1672×941） ---------- */
  /* r3.169.0：ChatGPT 新圖（1672×941）。地面約從 50% 開始；可走範圍只取上半段 53%～79%（下面當前景），進場就看得到背景 */
  const T0 = 499, B0 = 743, band = n => ({ name: n, outer: [[0, T0], [1672, T0], [1672, B0], [0, B0]], start: [70, 560], center: [836, 610] });
  /* 祕境（取代三座被遺棄的村莊）：A 從章節地圖進、B 從 A 的右緣進 */
  const VIL = { X_HIDE1A: band('螢火竹隱谷'), X_HIDE1B: band('竹林深處的古社跡'), X_HIDE2A: band('霧瀑祕谷'), X_HIDE2B: band('瀑布裏的岩屋'), X_HIDE3A: band('千體石佛原'), X_HIDE3B: band('古戰場地下靈廟') };
  const HIDEB = { X_HIDE1A: 'X_HIDE1B', X_HIDE2A: 'X_HIDE2B', X_HIDE3A: 'X_HIDE3B' };
  const NEWX = { N_EX01: band('晨霧杉林獸徑'), N_EX03: band('狐火鐘乳洞'), N_EX04: band('雷擊礦山坑道'), N_EX06: band('赤松斷崖林道'), N_EX07: band('地底水脈洞窟'), N_EX08: band('楓葉山谷'),
    N_EX09: band('蛛絲竹林峽谷'), N_EX10: band('退潮海蝕洞'), N_EX11: band('黃泉岩窟'), N_EX12: band('雲海石庭') };
  const DARK = { N_EX04: 1, N_EX07: 1, N_EX10: 1, N_EX11: 1, X_HIDE1A: 1, X_HIDE1B: 1, X_HIDE3B: 1, N_EX03: 1, X_HIDE2B: 1 };   // 暗圖：人物腳下加淡環境光
  /* ---------- 2. 人類敵人（依章節分三段） ---------- */
  const HUM = [['sanzoku', 'bandit_knife', 'bandit_axe', 'bandit_archer', 'bandit_leader'], ['nobushi', 'yaribushi', 'ninja', 'kunoichi', 'ashigun', 'ashiyumi', 'sohei'],
    ['doma_spear_soldier', 'doma_shield_soldier', 'doma_archer', 'doma_ritualist', 'kagemusha', 'taisho', 'akashinobi']];
  const humOf = c => c <= 4 ? HUM[0] : c <= 8 ? HUM[1].concat(['bandit_leader']) : HUM[2].concat(['kageshinobi']);
  /* ---------- 3. 每章兩個探索區（底圖可重複） ---------- */
  const PLAN = { 1: ['Q_night_rice', 'X_HIDE1A'], 2: ['Q_coast_cliff_muster', 'Q_reef_naval_base'], 3: ['Q_road_rice', 'X_HIDE2A'], 4: ['Q_mountain_cedar', 'Q_road_moss'],
    5: ['Q_road_fuji', 'Q_mountain_valley'], 6: ['Q_mountain_redcliff', 'X_HIDE3A'], 7: ['Q_road_pine', 'X_HIDE1A'], 8: ['Q_mountain_cedar', 'X_HIDE2A'],
    9: ['Q_night_susuki', 'Q_road_willow'], 10: ['W_R10_02', 'Q_coast_supply_camp'], 11: ['Q_road_moss', 'X_HIDE3A'], 12: ['W_R12_05', 'Q_mountain_redcliff'] };   /* r3.169.0：被遺棄的村莊 → 祕境 */
  const ARENA = { A_HID_YORIMITSU: ['D_FUJI_04', '試煉・山頂鳥居'], A_HID_OWL: ['D_EZO_04', '試煉・雪夜暖爐'], A_HID_TAKEMI: ['D_SKY_04', '試煉・天空神殿'], A_HID_ENNO: ['D_IZUMO_04', '試煉・大注連繩殿'] };
  const NEWP = { 1: 'N_EX01', 3: 'N_EX03', 4: 'N_EX04', 6: 'N_EX06', 7: 'N_EX07', 8: 'N_EX08', 9: 'N_EX09', 10: 'N_EX10', 11: 'N_EX11', 12: 'N_EX12' };
  const CHAIN = { 2: ['渡海・海島', '搭小船回海崖'], 5: ['深入・峽谷', '回富士路'] };   /* r3.120.0：第 2／5 章兩張探索圖串成一條（只從第 1 張進） */
  const XN = { E02_1: '探索・海崖', E02_2: '探索・水軍礁島', E05_2: '探索・裂谷盆地' };
  const IMG = {}, EX = {};   // 複製場景 → 原圖；探索場景資料
  const geo = d => ({ w: d.w, h: d.h, outer: JSON.parse(JSON.stringify(d.outer)), obstacles: JSON.parse(JSON.stringify(d.obstacles || [])), depth: d.depth, start: (d.start || [200, 600]).slice(), nodes: JSON.parse(JSON.stringify(d.nodes || {})), portals: [] });
  function chLv(c) { const f = HUB.firstOf(c), d = G.D.scenes[f] || {}; return c === 1 ? 4 : (WD.meta[f] && WD.meta[f].lv) || d.lv || c * 8; }
  const HUMAN = new Set([].concat(...HUM, ['kageshinobi', 'yaribushi', 'nobushi', 'bandit_leader', 'kunoichi', 'ninja', 'sohei', 'ronin', 'samurai', 'ashigaru']));
  const isHum = t => HUMAN.has(t) || /^(doma_|bandit|sanzoku|ashi|ronin|samurai|kage|taisho|akashinobi)/.test(t);
  function yokaiOf(c) { for (const k of [c, c - 1, c + 1, c - 2, c + 2]) { if (k < 1 || k > 12) continue; const set = new Set(); for (const id of (HUB.ids ? HUB.ids(k) : [HUB.firstOf(k)])) for (const t of ((G.D.scenes[id] || {}).foes || [])) if (!isHum(t)) set.add(t);
      if (set.size >= 2) return [...set].slice(0, 6); } return ['akaoni', 'kurooni', 'kioni']; }   /* r3.169.0：祕境只出妖怪 */
  function chFoes(c) { const L = HUB.ids ? HUB.ids(c) : [HUB.firstOf(c)]; for (const id of L) { const d = G.D.scenes[id]; if (d && d.foes && d.foes.length) return d.foes.slice(); } return ['akaoni']; }
  function build() {
    for (const id of Object.keys(VIL).concat(Object.keys(NEWX))) { const v = VIL[id] || NEWX[id]; G.D.scenes[id] = { name: v.name, w: 1672, h: 941, outer: v.outer, obstacles: [], start: v.start, nodes: { west_arrival: v.start, center: v.center }, portals: [] }; IMG[id] = id; }
    for (const c in NEWP) PLAN[c][0] = NEWP[c];   /* r3.118.0：各章第一個探索區換成專屬新圖 */
    for (const id in ARENA) { const [b, n] = ARENA[id], d = G.D.scenes[b]; if (!d) continue; const g = geo(d); g.nodes.stone_stand = (g.nodes.center || [g.w / 2, g.h * 0.65]).slice();
      G.D.scenes[id] = Object.assign(g, { name: n, quest: 1, safe: true, region: 'wind', lv: 1, spawn: null, foes: [] }); WD.meta[id] = { ch: 0, quest: 1, safe: true, lv: 1, spawn: [0, 0], foes: [], mats: [] }; IMG[id] = b; }
    const mk = (c, i, b, id, deep) => { const d = G.D.scenes[b]; if (!d) return; const hid = /^X_HIDE/.test(b);
      const foes = hid ? yokaiOf(c) : chFoes(c), lv = chLv(c) + 3 + ((CHAIN[c] && i) || deep ? 3 : 0), g = geo(d), name = XN[id] || ((hid ? '祕境・' : '探索・') + d.name);   /* r3.169.0：祕境出該章妖怪（原本村莊是人類賊寇） */
      if (!g.nodes.center) g.nodes.center = [g.w / 2, (g.start[1] + g.h * 0.7) / 2];
      G.D.scenes[id] = Object.assign(g, { name, region: d.region || 'wind', lv, spawn: (CHAIN[c] && i) || deep ? [8, 11] : [6, 9], foes, mats: ['iron', 'bone', 'cloth', 'jade'], explore: c, base: b, hidden: hid, dark: !!DARK[b] });
      WD.meta[id] = { region: 'wind', town: false, lv, spawn: [6, 9], mats: ['iron', 'bone', 'cloth', 'jade'], foes };
      IMG[id] = b; EX[id] = { c, i, b, deep }; };
    for (let c = 1; c <= 12; c++) PLAN[c].forEach((b, i) => { const id = 'E' + String(c).padStart(2, '0') + '_' + (i + 1); mk(c, i, b, id); if (HIDEB[b]) mk(c, i, HIDEB[b], id + 'B', 1); }); }
  const img0 = G.ASSET.img.bind(G.ASSET); G.ASSET.img = (k, src) => img0(k, IMG[k] ? 'a/m/' + IMG[k] + '.webp' : src);
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { try { build(); } catch (e) { console.warn('explore build', e); } return r; });
  /* ---------- 4. 入口：章節第 1、2 張地圖上的探索標記 ---------- */
  const isEx = id => !!(G.D.scenes[id] && G.D.scenes[id].explore);
  function goEx(id) { const back = SC.id, d = G.D.scenes[id];
    G.DLG.start([say('', '（' + d.name + '。建議等級 Lv' + d.lv + (d.hidden ? '。很少人知道的祕境，深處還有更強的妖怪。）' : '。這一帶妖氣很重，敵人會一批接一批出現。）')), { choice: [
      { label: '前往', then: [act(() => { G.SAVE.data.eret = { map: back, x: H.x, y: H.y }; HUB.travel(0, '你們離開大路，往「' + d.name + '」走去……', [], id); })] }, { label: '不了', then: [] }] }]); }
  /* r3.90.0：探索入口位置——不放在路中間：從地圖 1/4（或 3/4）寬處，往上或往下找可走範圍的邊緣，退回 40px（路邊、草叢邊） */
  const isTown = m => { const d = G.D.scenes[m] || {}, w = WD.meta[m] || {}; return !!(d.safe || d.town || w.town || d.hub); };
  function edgeSpot(d, k) { const W = (x, y) => SC.walkable(x, y); let best = null;   // r3.91.0：在左（右）半邊找「可走範圍最寬」的直線（空地，不是橋、窄路），放在上緣往內 40px
    for (let fx = k ? 0.55 : 0.12; fx <= (k ? 0.88 : 0.45); fx += 0.03) { const x = d.w * fx; let top = -1, bot = -1, n = 0;
      for (let y = 40; y < d.h - 20; y += 8) if (W(x, y)) { if (top < 0) top = y; bot = y; n++; }
      if (n < 12) continue; const y = top + 40; if (!W(x, y) || !W(x - 30, y) || !W(x + 30, y)) continue; if (!best || n > best.n) best = { n, p: [Math.round(x), Math.round(y)] }; }
    if (best) return best.p; const nd = d.nodes || {}; let p = nd.center ? [nd.center[0] + (k ? -160 : 160), nd.center[1] + 40] : [d.w * 0.5, d.h * 0.72]; return (SC.snap && SC.snap(p[0], p[1], 'open', 220)) || p; }
  function place() { const id = SC.id; if (!G.D.scenes[id] || !F().prologue) return; HUB.marks = HUB.marks.filter(m => !/^ex[:_]/.test(m.id));
    if (isEx(id)) { placeIn(id); return; }
    const c = HUB.chOf(id); if (!c || !HUB.open || !HUB.open(c)) return; const L0 = HUB.ids ? HUB.ids(c) : [], L = L0.filter(m => m !== HUB.bossOf(c) && !isTown(m)), k = L.indexOf(id); if (k < 0 || k > 1 || (CHAIN[c] && k)) return;   // r3.90.0：村落、城鎮不放探索入口，順延到下一張
    const ex = 'E' + String(c).padStart(2, '0') + '_' + (k + 1); if (!G.D.scenes[ex]) return; const d = SC.def;
    const p = edgeSpot(d, k);
    HUB.marks.push({ id: 'ex:' + ex, x: p[0], y: p[1], label: '探索・' + nm(ex).replace(/^探索・/, ''), kind: 'look', main: false, run: () => goEx(ex) }); }
  /* ---------- 5. 探索區內：返回、調查點、出怪、精英、寶箱 ---------- */
  const ST = { wave: 0, cool: 0, looks: [], chest: 0 };
  const LOOK = ['可疑的足跡', '倒塌的貨箱', '燒焦的告示', '遺落的包袱', '斷掉的刀', '被翻過的米缸', '奇怪的符紙', '野營的餘燼'];
  function reward(lv, m, q) { const p = [H.x + 20, H.y]; G.LOOT.push({ x: p[0], y: p[1], t: 0, kind: 'gold', v: Math.round((25 + lv * 7) * m) });
    const mk = Object.keys(G.RPG.MATS); G.LOOT.push({ x: p[0] + 14, y: p[1] + 4, t: 0, kind: 'mat', id: rnd(mk), n: 1 + Math.round(m) });
    if (q >= 0) { let it = null; for (let k = 0; k < 60; k++) { it = G.RPG.roll(lv, 'wind'); if (it.q >= q) break; } if (it.q < q) it.q = q; G.LOOT.push({ x: p[0] - 14, y: p[1] + 2, t: 0, kind: 'item', it }); } }
  /* r3.120.0：串連——第 1 張右緣放「往第 2 張」，第 2 張的返回改回第 1 張右緣 */
  function rEdge(d) { for (let x = d.w - 60; x > d.w * 0.6; x -= 12) { let t = -1, b = -1; for (let y = 40; y < d.h - 20; y += 8) if (SC.walkable(x, y)) { if (t < 0) t = y; b = y; } if (t > 0 && b - t > 60) return [Math.round(x), Math.round((t + b) / 2)]; } return [d.w - 160, d.h * 0.65]; }
  let PEND = null; const snp = (x, y) => (SC.walkable(x, y) ? [x, y] : (SC.snap && SC.snap(x, y, 'open', 160)) || [x, y]);
  function chainGo(to, txt, atR) { PEND = atR ? to : null; HUB.travel(0, txt, [], to); }
  function placeIn(id) { const d = SC.def, er = G.SAVE.data.eret, back = er && G.D.scenes[er.map] ? er.map : HUB.firstOf(d.explore) || 'hub_city', s = d.start || [200, 600], ex = EX[id], ch0 = ex && CHAIN[ex.c];
    const deepB = ex && !ex.deep && G.D.scenes[id + 'B'] ? id + 'B' : null, ch = ex && ex.deep ? ['', '回到「' + nm(id.slice(0, -1)).replace(/^祕境・/, '') + '」'] : deepB ? ['深入・' + nm(deepB).replace(/^祕境・/, ''), ''] : ch0;   /* r3.169.0：祕境 A→B 串連 */
    if (PEND === id) { PEND = null; const p = rEdge(d), q = snp(p[0] - 90, p[1]); H.x = q[0]; H.y = q[1]; }
    if (ch && (deepB || (!ex.deep && ex.i === 0))) { const nx = deepB || 'E' + String(ex.c).padStart(2, '0') + '_2', p = rEdge(d); if (G.D.scenes[nx]) HUB.marks.push({ id: 'ex_next', x: p[0], y: p[1], label: ch[0], kind: 'look', run: () => G.DLG.start([say('', '（' + nm(nx) + '。建議等級 Lv' + G.D.scenes[nx].lv + '，敵人比這裡更多更強。）'), { choice: [{ label: '前往', then: [act(() => chainGo(nx, ex.c === 2 ? '你們解開岸邊的小船，往礁島划去……' : '你們沿著乾河床往峽谷深處走……'))] }, { label: '不了', then: [] }] }]) }); }
    if (ch && (ex.deep || (!deepB && ex.i === 1))) { const pv = ex.deep ? id.slice(0, -1) : 'E' + String(ex.c).padStart(2, '0') + '_1'; const bp = snp(s[0] + 70, s[1]); HUB.marks.push({ id: 'ex_back', x: bp[0], y: bp[1], label: ch[1], kind: 'look', run: () => G.DLG.start([{ choice: [{ label: '回去', then: [act(() => chainGo(pv, '你們往回走……', 1))] }, { label: '留下', then: [] }] }]) }); }
    else
    HUB.marks.push({ id: 'ex_back', x: s[0] + 70, y: s[1], label: '返回・' + nm(back), kind: 'look', run: () => G.DLG.start([{ choice: [
      { label: '回去', then: [act(() => { const r = G.SAVE.data.eret; HUB.travel(0, '你們沿著來時的路回去……', [], back); if (r && r.map === back) G.STORY.later(40, () => { if (SC.id === back && SC.walkable(r.x, r.y)) { H.x = r.x; H.y = r.y; } }); })] }, { label: '留下', then: [] }] }]) });
    ST.looks.forEach((L, i) => { if (L.done) return; HUB.marks.push({ id: 'ex_look' + i, x: L.x, y: L.y, label: L.n, kind: 'look', run: () => { if (L.done) return; L.done = 1; HUB.marks = HUB.marks.filter(m => m.id !== 'ex_look' + i);
        const roll = Math.random(); if (roll < 0.25) { G.UI.toast(L.n + '：裡面躲著一隻妖怪！'); const e = G.spawnOni(L.x + 40, L.y, 10, d.lv + 1, rnd(d.foes)); if (e) elite(e); }
        else { reward(d.lv, 0.8, roll > 0.8 ? 2 : -1); G.UI.toast(L.n + '：找到了一些東西'); } } }); }); }
  function elite(e) { e.elite = '精英'; e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio = (e.ratio || 1) * 1.15; return e; }
  function chest() { const d = SC.def; let p = null; for (let k = 0; k < 40 && !p; k++) { const x = H.x + (Math.random() - 0.5) * 360, y = H.y + (Math.random() - 0.5) * 160; if (SC.walkable(x, y) && Math.hypot(x - H.x, y - H.y) > 80) p = [x, y]; }
    if (!p || !G.EV) return; const rare = ST.wave >= 6, n = { prop: 1, k: rare ? 'chest_village_rare_closed' : 'chest_village_normal_closed', x: p[0], y: p[1], face: 1, alpha: 0, glow: 1, label: rare ? '精緻的寶箱' : '寶箱', mugenChest: rare && (G.SAVE.data.gdiff | 0) === 4 ? 1 : 0 };   // r3.103.0：無間的精緻寶箱用專屬圖（130_icons）
    n.run = () => { if (n.opened) return; n.opened = 1; n.glow = 0; n.k = n.k.replace('closed', 'open'); reward(d.lv, rare ? 3 : 2, rare ? 3 : 2); G.UI.banner(rare ? '精緻的寶箱' : '寶箱', '被妖怪守著的寶物'); };
    G.EV.props.push(n); G.NPC.push(n); G.UI.toast('附近出現了寶箱'); }
  if (G.EV && G.EV.enter) { const ev0 = G.EV.enter; G.EV.enter = function (id) { if (isEx(id)) G.EV.cool = Math.max(G.EV.cool || 0, 1); return ev0.apply(this, arguments); }; }   // 探索區不觸發隨機事件（事件會暫停出怪）
  const so0 = G.spawnOni; G.spawnOni = function (x, y, delay, lv, type) { if (!type && isEx(SC.id)) { const L = (SC.def.foes || []).filter(t => G.enemyUnit(t)); if (L.length) type = rnd(L); } return so0.call(this, x, y, delay, lv, type); };   // 探索區不混入赤鬼（沒有 ch 時原本 3 成機率）
  const as0 = SC.autoSpawn; SC.autoSpawn = function () { const n0 = G.E.length, r = as0.apply(this, arguments);
    if (isEx(this.id)) { const L = G.E.slice(n0).filter(e => e && e.st !== 'dead'); ST.wave++; const k = ST.wave >= 4 ? 2 : 1; for (let i = 0; i < k && L.length; i++) elite(L.splice(Math.floor(Math.random() * L.length), 1)[0]);
      if (ST.wave > 1) G.UI.toast('第 ' + ST.wave + ' 批敵人來了'); }
    return r; };
  function enter(id) { ST.wave = 0; ST.cool = 0; ST.chest = 0; ST.looks = []; if (!isEx(id)) return; const d = SC.def;
    for (let i = 0, tries = 0; i < 3 && tries < 200; tries++) { const x = 160 + Math.random() * (d.w - 320), y = SC.y0 + Math.random() * (SC.y1 - SC.y0);
      if (!SC.walkable(x, y) || Math.hypot(x - d.start[0], y - d.start[1]) < 300 || ST.looks.some(L => Math.hypot(L.x - x, L.y - y) < 260)) continue; ST.looks.push({ x, y, n: rnd(LOOK) }); i++; }
    G.UI.banner(d.name, d.hidden ? (EX[id] && EX[id].deep ? '祕境深處・妖怪更多更強' : '祕境・敵人會一批接一批出現') : '探索區・敵人會一批接一批出現'); }
  /* ---------- 6. 掛勾 ---------- */
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { en0.call(G.STORY, id); try { enter(id); place(); } catch (e) { console.warn('explore', e); } };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++; if (tk % 60 === 0) try { place(); } catch (e) {}
    if (!isEx(SC.id) || SC.trans || G.DLG.active()) return; SC.respawnT = 0;   // 探索區自己管出怪節奏
    if (!G.E.some(e => e.st !== 'dead')) { if (++ST.cool === 1 && ST.wave && ST.wave % 3 === 0 && ST.chest < ST.wave) { ST.chest = ST.wave; chest(); }
      if (ST.cool >= 600) { ST.cool = 0; SC.autoSpawn(); } } else ST.cool = 0; };
  /* r3.169.0：暗的洞窟／夜景祕境——人物身邊加淡淡暖光，敵我看得清楚（不改原圖） */
  (function hkDW() { if (!G.drawWorld) return setTimeout(hkDW, 60); const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); const d = SC.def; if (!d || !d.dark || !SC.toScreen) return; const c = G.ctx, Z = SC.view().Z;
      const L = [H].concat(G.PARTY && G.PARTY.list ? G.PARTY.list.filter(q => q.st !== 'down') : [], G.E.filter(e => e.st !== 'dead').slice(0, 10)); c.save(); c.globalCompositeOperation = 'lighter';
      for (const a of L) { if (!a || a.x === undefined) continue; const k = SC.depth(a.y), p = SC.toScreen(a.x, a.y - G.HERO_H * 0.45 * k), r = G.HERO_H * 1.1 * k * Z, g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, a === H ? 'rgba(255,226,180,.16)' : 'rgba(255,226,180,.1)'); g.addColorStop(1, 'rgba(255,226,180,0)'); c.fillStyle = g; c.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
      c.restore(); }; })();
  G.EXPLORE = { PLAN, VIL, IMG, EX, ST, humOf };
})();
