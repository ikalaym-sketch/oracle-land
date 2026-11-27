/* ==========================================================================
 * 神諭之地 重製版 — 65_maps.js
 * Version : r3.169.0  (2026-11-27)　r3.169.0：城南告示牌換新圖、兼委託公告板（點了選委託／街道路程）
 * 舊版    : r3.129.0  (2026-11-27)　r3.129.0：兩岸城換新圖：城南出口、告示牌、妖怪村回城點改新座標
 * 舊版    : r3.100.0  (2026-11-26)　r3.100.0：妖怪村／訓練場的主線指引改成先回兩岸城（修正第一章在妖怪村被叫回第七章）
 * 舊版    : r3.88.0  （r3.88.0：城南告示牌縮小（高 74→52）、往下移 30）
 * 舊版    : r3.53.0  （r3.53.0：任務地圖只顯示同一任務鏈的傳送點）　舊版 r3.43.1  (2026-11-18)　r3.43.1：主線提示只留目標（不再寫「往左回城」等路線）；小雪同行時改「和小雪一起回神社」；城南改成看「告示牌」開啟各章街道選單（不再走進去自動跳出）；從妖怪村回城出現在東邊路口
 * 舊版    : r3.41.0  (2026-11-18)　r3.41.0：兩岸城不再放任務傳送點，改由渡口時雨「任務地點」前往；指引指向時雨
 * 舊版    : r3.39.0  (2026-11-17)　r3.39.0：chapterClear 不再跳「完」橫幅
 * 舊版    : r3.33.0  (2026-11-17)　r3.33.0：城南只留一個標記（不再每 1.5 秒疊一層）；城裡的任務傳送點合併成一個「任務地圖」標記；選章節清單改成「章節・目的地」
 * 舊版    : r3.28.0  (2026-11-16)
 * 變更    : r3.28.0 新增。第 3～12 章換成新地圖（每章 5 張一本道：前 4 張左右相連，第 5 張頭目場只能從左邊進出）。
 *           ・每章第一張往左＝回兩岸城（從城南出口進城）；兩岸城下方「城南出口」＝選章節街道（取代找時雨）。
 *           ・頭目場搬家：第 3 章 契約鳥居坂→狐社前庭；第 7 章 月下船渡→月下渡口戰場；第 9 章 蛛窟崖茶屋→八絃蛛窟；第 11 章 黃泉之門→黃泉淨化之地。
 *             頭目註冊、抉擇加成、封印門跟著搬；擊敗旗標新舊兩個名字互相同步（舊存檔、舊條件都照常成立）。
 *           ・炭里（榧守炭里）不再使用：任務、居民、店舖改到第 5 章「炭里長屋」。寄居地改為楓谷宴里後方的岔路（村子還在第 8 章裡）。
 *           ・任務地圖：兩岸城城南、以及該章地圖上都會出現「任務傳送點」；任務地圖之間直接傳送；做完後的返回點一律回兩岸城。
 *           ・指引文字不再叫你找時雨／祈願石：在城裡指向城南出口或任務傳送點，在別章地圖指向回城的左側出口。
 * 依賴    : 52_hub（HUB）、53_quest（Q）、18_world（WD）、26_boss（G.BOSS.MAP）、25_walk（G.WALK）、02_scene（checkPortals）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, SC = G.SC, WD = G.WORLD, HUB = G.HUB, H = G.H, F = () => G.SAVE.data.flags; if (!Q || !HUB || !WD) return;
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn });
  const SOUTH = { rect: [748, 900, 880, 941], arr: [812, 860], mark: [892, 892], sign: [862, 872], yk: [1600, 624] };   // r3.169.0：sign＝新告示牌放在中央大路右側   // r3.129.0：新圖城南出口＝中央大路底
  const BM = { W_R03_07: 'W_R03_05', W_R07_07: 'R07_OSAKABE_TRIAL', W_R09_07: 'BG_R09_TS01', W_R11_05: 'BG_R11_IZ01' };   // 舊頭目圖 → 新頭目場
  const QMAP = { T_kayamori: 'W_R05_05' };
  const QSTEP = [['c7_m4', 0, 'R07_OSAKABE_TRIAL'], ['c11_m4', 0, 'BG_R11_IZ01'], ['c11_after', 0, 'BG_R11_IZ01']];
  const nm = id => (G.D.scenes[id] || {}).name || id;
  /* ---------- 1. 任務資料改指新地圖 ---------- */
  for (const q of Q.L) { if (q.giver && QMAP[q.giver.map]) q.giver.map = QMAP[q.giver.map]; for (const s of q.steps || []) if (QMAP[s.map]) s.map = QMAP[s.map]; }
  for (const [id, i, m] of QSTEP) { const q = Q.by[id]; if (q && q.steps[i]) q.steps[i].map = m; }
  for (const o in BM) if (Q.bossMod && Q.bossMod[o]) { Q.bossMod[BM[o]] = Q.bossMod[o]; delete Q.bossMod[o]; }
  /* ---------- 2. 頭目註冊搬家＋擊敗旗標同步 ---------- */
  function bossMove() { const B = G.BOSS; if (!B || !B.MAP) return; for (const o in BM) if (B.MAP[o]) { B.MAP[BM[o]] = B.MAP[o]; delete B.MAP[o]; } }
  function flagSync() { const f = F(); if (!f) return; let ch = 0;
    for (const o in BM) { const a = 'boss_' + o, b = 'boss_' + BM[o]; if (f[a] && !f[b]) { f[b] = 1; ch = 1; } if (f[b] && !f[a]) { f[a] = 1; ch = 1; } }
    if (ch) G.SAVE.markDirty(); }
  /* ---------- 3. 出口：每章第一張往左回兩岸城 ---------- */
  function linkFirst(id) { const d = G.D.scenes[id], c = HUB.chOf(id); if (!d || !c || HUB.firstOf(c) !== id) return; d.portals = d.portals || [];
    if (d.portals.some(p => p.to === 'hub_city')) return;
    const wk = G.WALK && G.WALK.M[id] && G.WALK.M[id].portals && G.WALK.M[id].portals.west, w = d.portals.find(p => p.id === 'west');
    if (w) { w.to = 'hub_city'; return; }
    const line = wk && wk.line; if (!line) return; d.portals.push({ id: 'west', to: 'hub_city', line, arrival: wk.arrival || d.start }); }
  const cp0 = SC.checkPortals.bind(SC);
  SC.checkPortals = function () { const was = this.trans, from = this.id; cp0();
    if (!was && this.trans && this.trans.to === 'hub_city' && HUB.chOf(from)) this.trans.at = SOUTH.arr.slice();
    if (!was && this.trans && this.trans.to === 'hub_city' && from === 'T_yokai') this.trans.at = SOUTH.yk.slice(); };   // r3.43.0：妖怪村回城＝東邊路口   // 從各章回城：出現在城南
  HUB.goCity = () => { SC.trans = { t: 0, to: 'hub_city', at: SOUTH.arr.slice() }; };
  /* ---------- 4. 兩岸城城南出口：選章節 ---------- */
  function chooser() { const L = []; for (let c = 1; c <= 12; c++) if (HUB.open(c) && G.D.scenes[HUB.firstOf(c)]) L.push({ label: (c === HUB.cur() ? '◆ ' : '') + (WD.CH ? WD.CH[c] : '第' + c + '章') + '・' + nm(HUB.firstOf(c)) + (HUB.done(c) ? '　✓' : ''), then: [act(() => HUB.travel(c, '你們出了城南，沿著街道往「' + nm(HUB.firstOf(c)) + '」去……', []))] });
    if (!L.length) { G.DLG.start([say('', '（城南的街道通往各地。現在還沒有要去的地方。）')]); return; }
    L.reverse(); const page = (A, i) => { const P = A.slice(i, i + 5); if (A.length > i + 5) P.push({ label: '更早的章節…', then: [act(() => G.STORY.later(2, () => G.DLG.start([{ choice: page(A, i + 5) }])))] }); return P.concat([{ label: '不了', then: [] }]); };
    G.DLG.start([say('', '（告示牌上畫著城南街道通往各地的路線。◆＝主線，✓＝已走完。）'), { choice: page(L, 0) }]); }
  let armed = true;
  function southZone() { if (SC.id !== 'hub_city' || SC.trans || HUB.card || G.DLG.active() || (G.MENU && G.MENU.open)) return; const [x0, y0, x1] = SOUTH.rect;
    const inZ = H.x >= x0 && H.x <= x1 && H.y >= y0 - 14; if (!inZ) { if (H.y < y0 - 30) armed = true; return; } if (!armed) return; armed = false; H.y = y0 - 26; chooser(); }
  /* ---------- 5. 任務地圖傳送點 ---------- */
  const isQ = id => !!(G.D.scenes[id] && G.D.scenes[id].quest);
  const st = id => (G.SAVE.data.qs || {})[id];
  function pendingTrips() { const out = []; for (const q of Q.L) { const s = st(q.id); if (!s || s.done) continue; const step = q.steps[s.s]; if (!step || !isQ(step.map) || step.map === SC.id || step.map === 'Q_field_seal_forest') continue;
      if (Q.trip && Q.trip[step.map] && Q.trip[step.map].need && !Q.trip[step.map].need()) continue; if (!out.some(o => o.to === step.map)) out.push({ to: step.map, q }); } return out; }
  function tripList(L) { G.DLG.start([say('', '（要前往哪一張任務地圖？）'), { choice: L.slice(0, 5).map(t => ({ label: (t.q.main ? '◆ ' : '') + nm(t.to), then: [act(() => { HUB.travel(0, '你們朝「' + nm(t.to) + '」出發……', [], t.to); G.SAVE.data.qret = 'hub_city'; })] })).concat([{ label: '不了', then: [] }]) }]); }
  function tripRun(to) { G.DLG.start([say('', '（要前往「' + nm(to) + '」嗎？）'), { choice: [{ label: '出發', then: [act(() => { HUB.travel(0, '你們朝「' + nm(to) + '」出發……', [], to); G.SAVE.data.qret = 'hub_city'; })] }, { label: '不了', then: [] }] }]); }
  function placeTrips() { const id = SC.id, c = HUB.chOf(id), here = id === 'hub_city' || isQ(id) || c; if (!here) return;
    HUB.marks = HUB.marks.filter(m => !/^qtp:/.test(m.id) && m.id !== 'south' && !(id === 'hub_city' && /^trip:/.test(m.id)));
    const L = pendingTrips().filter(t => id === 'hub_city' || (isQ(id) ? t.q.steps.some(x => x.map === id) : (!t.q.ch || t.q.ch === c))); const d = SC.def;   // r3.53.0：任務地圖只放同一任務（連續任務）的下一張
    if (id === 'hub_city') { for (const t of L) HUB.marks.push({ id: 'qtp:' + t.to, hide: 1, x: -9999, y: -9999, label: (t.q.main ? '◆ ' : '') + nm(t.to), kind: 'look', main: false, trip: () => { HUB.travel(0, '時雨的渡船載著你們，朝「' + nm(t.to) + '」去……', [], t.to); G.SAVE.data.qret = 'hub_city'; }, run() {} }); }   // r3.41.0：城裡不放任務傳送點，找渡口時雨「任務地點」前往
    else L.slice(0, 4).forEach((t, i) => { let p = id === 'hub_city' ? [SOUTH.mark[0] - 200 - i * 130, SOUTH.mark[1] - 50] : (d.nodes && d.nodes.west_arrival) ? [d.nodes.west_arrival[0] + 190, d.nodes.west_arrival[1] - 40 + i * 50] : [d.w / 2, d.h * 0.7];
      if (SC.snap) p = SC.snap(p[0], p[1], 'open', 200) || p;
      HUB.marks.push({ id: 'qtp:' + t.to, trip: () => tripRun(t.to), x: p[0], y: p[1], label: '任務傳送・' + nm(t.to), kind: 'look', main: !!t.q.main, run: () => tripRun(t.to) }); });
    if (id === 'hub_city') HUB.marks.push({ id: 'south', x: SOUTH.sign[0], y: SOUTH.sign[1] - 10, label: '告示牌', kind: 'look', main: false, run: board, _obj: 1 });   // r3.100.0：有立牌，不畫地面黃圈
    if (isQ(id)) { const qr = G.SAVE.data.qret; for (const m of HUB.marks) if (m.id === 'back') m.label = '返回・' + nm(qr && G.D.scenes[qr] ? qr : 'hub_city'); } }   // r3.54.0：顯示實際返回地點（試煉場回後山）
  /* ---------- 6. 指引：不再叫你找時雨／祈願石 ---------- */
  const gd0 = Q.guide.bind(Q);
  Q.guide = function () { const g = gd0(); if (!g || !g.text) return g; const q = Q.pinned(), s = q && st(q.id), step = s && q.steps[s.s]; if (!step || step.map === SC.id) return g;
    const to = step.map, here = HUB.chOf(SC.id), there = HUB.chOf(to), base = g.text.replace(/（找渡口時雨）|：到渡口找時雨|：先到祈願石回城|：回到本章第一站，在祈願石回城|：往[^（）]*$/g, '').replace(/）：.*$/, '）').replace('回神社，向小雪報告', G.XUE && G.XUE.o && SC.id !== 'hub_shrine' ? '和小雪一起回神社' : '回神社，向小雪報告');   // r3.43.0：提示只留目標，路線交給地圖箭頭
    if (isQ(to) && SC.id === 'hub_city') { const f = HUB.marks.find(k => k.id === 'ferry'), sg = G.AMB && G.AMB.list.find(n => n.fer); if (f || sg) return { text: base, x: sg ? sg.x : f.x, y: sg ? sg.y : f.y, label: '渡口・時雨' }; }
    if (isQ(to)) { const m = HUB.marks.find(k => k.id === 'qtp:' + to); if (m) return { text: base, x: m.x, y: m.y, label: m.label }; }
    if (SC.id === 'hub_city' && there) { const m = HUB.marks.find(k => k.id === 'south'); if (m) return { text: base, x: m.x, y: m.y, label: '城南告示牌' }; }
    /* r3.100.0：妖怪村、訓練場等城鎮（安全區）不屬於任何章節路線：一律先指回兩岸城（不再叫你「回到第七章」） */
    const sd = SC.def || {}; if (SC.id !== 'hub_city' && SC.id !== 'hub_shrine' && (sd.safe || SC.id === 'T_yokai' || SC.id === 'D_TRAIN')) {
      const p = (sd.portals || []).find(k => k.to === 'hub_city') || (sd.portals || []).find(k => k.to === 'T_yokai');
      if (p) { const [x, y] = HUB.portalXY(p); return { text: base, x, y, label: nm(p.to) }; } }
    if (here && here !== there) { const f = HUB.firstOf(here);
      if (SC.id === f) { const p = SC.def.portals.find(k => k.to === 'hub_city'); if (p) { const [x, y] = HUB.portalXY(p); return { text: base, x, y, label: '兩岸城' }; } }
      const r = HUB.exitTo(f); if (r) { const [x, y] = HUB.portalXY(r.p); return { text: base, x, y, label: nm(r.p.to) }; } }
    return g.text === base ? g : Object.assign({}, g, { text: base }); };
  HUB.chapterClear = function (c) { F()['clear' + c] = 1; G.SAVE.markDirty(); G.SAVE.flush(); };   // r3.39.0：「第X章 完」改在後日談結束才出（87_story2）
  /* ---------- 7. 掛勾 ---------- */
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { bossMove(); flagSync(); linkFirst(id); en0.call(G.STORY, id); try { placeTrips(); } catch (e) { console.warn('maps', e); } };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++; /* r3.43.0：不再走進城南自動跳選單，改看告示牌 */ if (tk % 90 === 0) { flagSync(); placeTrips(); } };
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { bossMove(); for (let c = 1; c <= 12; c++) linkFirst(HUB.firstOf(c)); return r; });
  /* r3.169.0：城南告示牌兼委託公告板（點了先選） */
  function board() { if (!G.BOARD || !G.BOARD.openBoard) return chooser(); const L = f => [{ do: () => G.STORY.later(2, f) }];
    G.DLG.start([{ who: '', text: '（城南的告示牌。貼著往各地的街道路程，還有城裡大家的委託。）' }, { choice: [{ label: '委託公告板', then: L(() => G.BOARD.openBoard()) }, { label: '街道路程', then: L(chooser) }, { label: '離開', then: [] }] }]); }
  /* r3.43.0：城南告示牌（pr_village 立牌），畫在地面層 */
  let BU = null; G.ANIM.load('pr_village').then(u => { BU = u; }, () => 0);
  const dmB = G.STORY.drawMarks.bind(G.STORY); G.STORY.drawMarks = function () { if (SC.id === 'hub_city' && G.SIGN && G.SIGN(SOUTH.sign[0], SOUTH.sign[1], 1.3)) { const B = G.BOARD && G.BOARD.BD && G.BOARD.BD(); if (B && B.offer && B.offer.length) { const a = 0.6 + 0.4 * Math.sin(G.t * 0.12); G.txt('！', SOUTH.sign[0], SOUTH.sign[1] - G.HERO_H * 1.45 * SC.depth(SOUTH.sign[1]), 18, `rgba(255,214,110,${a})`, 'center', G.FONT_S, 900); } }
    else if (SC.id === 'hub_city' && BU && BU.act.sign_village_idle) { const [x, y] = SOUTH.mark, f = BU.act.sign_village_idle.f[0], sc = 52 * SC.depth(y) / f[3], ctx = G.ctx;
      ctx.fillStyle = 'rgba(30,20,10,.32)'; ctx.beginPath(); ctx.ellipse(x, y - 2 * sc, 30 * sc * 0.9, 5 * sc, 0, 0, 6.283); ctx.fill(); G.ANIM.draw(BU, f, x, y + 1, sc, false, 1); }   // r3.100.0：陰影貼在立牌腳下
    return dmB.apply(this, arguments); };
  G.MAPS = { SOUTH, BM, chooser, linkFirst };
})();
