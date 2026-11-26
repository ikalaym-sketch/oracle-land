/* ==========================================================================
 * 神諭之地 重製版 — 95_board.js
 * Version : r3.104.2  (2026-11-26)　r3.104.2：公告板貼地（補回圖下緣透明邊）、影子改柔邊、不畫互動光暈；發光標記改柔邊
 * 舊版    : r3.56.0  (2026-11-24)　r3.56.0：聚落公告板移到路邊
 * 舊版    : r3.55.0  (2026-11-23)
 * 變更    : r3.55.0 新增。委託公告板（藥路聚落 W_R01_01、兩岸城 hub_city）：隨機委託，補第一章起的練功與收入。
 *           ・板上同時 3 張；30 分鐘或章節進度改變時換新；最多同時接 3 張。
 *           ・種類：討伐（某圖打倒 N 隻妖怪）、採集（某圖發光採集點 N 處）、精英（某圖出現的精英 1 隻）、送信（交給某位居民）。
 *           ・地圖只從已到訪、可戰鬥的章節地圖挑（第一章：杉影溪橋古道、水車河畔），等級＝地圖等級。
 *           ・完成即結算（不用回板子）：經驗＝同級擊殺 ×10～16、錢、素材；精英／採集有機率給精品以上裝備。
 *           ・進行中的委託：目標地圖會有標記（採集點、精英、收信人），HUD 目標列顯示進度。
 * 存檔    : save.board { gen, P, offer[], act[] }。
 * 依賴    : 52_hub（marks、cur）、53_quest（Q.guide 外掛）、07_rpg（gainExp／roll／addItem／onKill）、03_actors（spawnOni）、20_npc（AMB）、22_event（seen）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, HUB = G.HUB, Q = G.QST, R = G.RPG; if (!HUB || !Q) return;
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn });
  const BD = () => { const s = G.SAVE.data; return s.board || (s.board = { gen: 0, P: 0, offer: [], act: [] }); };
  const POS = { W_R01_01: [560, 630], hub_city: [600, 470] };   // r3.56.0：聚落公告板移到勘婆攤位旁的路邊   // 聚落：勘婆與阿松之間的路邊；兩岸城：城中央左側店前
  const nm = id => (G.D.scenes[id] || {}).name || id, rnd = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const TOWNSFOLK = { hub_city: ['花澄', '文也', '阿絹', '柚吉', '鈴緒', '小百合', '晴久', '阿德婆婆'], W_R01_01: ['阿松', '勘婆', '鐵心'] };
  const MAX = 3, LIFE = 30 * 60000;
  /* ---------- 可用地圖 ---------- */
  function pool() { const P = Math.min(12, HUB.cur()), seen = G.SAVE.data.seen || {}, out = [];
    for (const id of ['W_R01_03', 'W_R01_04']) if (seen[id] || P > 1) out.push(id);
    for (let c = 2; c <= Math.min(12, P); c++) for (const id of (G.WORLD.chapters[c] || [])) { const d = G.D.scenes[id]; if (d && !d.boss && !d.safe && !d.dungeon && (seen[id])) out.push(id); }
    return out.filter(id => G.D.scenes[id]); }
  const lvOf = id => Math.max(1, (G.D.scenes[id] || {}).lv || 1);
  /* ---------- 產生委託 ---------- */
  function make() { const L = pool(); if (!L.length) return null; const map = rnd(L), lv = lvOf(map), t = rnd(['kill', 'kill', 'gather', 'elite', 'deliver']);
    const o = { id: 'b' + Date.now().toString(36) + ri(100, 999), t, map, lv, k: 0 };
    if (t === 'kill') { o.n = ri(6, 10); o.title = '討伐：' + nm(map); o.desc = '在「' + nm(map) + '」打倒妖怪 ' + o.n + ' 隻'; o.who = rnd(['巡檢孫六', '村長', '樵夫', '藥商']); }
    if (t === 'gather') { o.n = ri(3, 5); o.kind = rnd([['草藥', '藥舖要的山草藥'], ['妖氣結晶', '鍛冶要的妖氣結晶'], ['遺失的貨物', '商隊掉落的貨物']]); o.title = '採集：' + o.kind[0]; o.desc = '在「' + nm(map) + '」找到' + o.kind[1] + ' ' + o.n + ' 處'; }
    if (t === 'elite') { o.n = 1; o.title = '精英討伐：' + nm(map); o.desc = '「' + nm(map) + '」出現了凶暴的精英妖怪'; }
    if (t === 'deliver') { const town = HUB.cur() >= 2 ? 'hub_city' : 'W_R01_01', L2 = TOWNSFOLK[town].length ? TOWNSFOLK[town] : null; o.map = town; o.lv = Math.max(1, G.RPG.d().lv);
      o.to = L2 ? rnd(L2) : null; o.n = 1; o.item = rnd(['藥包', '信', '修好的茶碗', '一束草藥', '護符']); o.title = '送信：' + o.item; o.desc = '把「' + o.item + '」交給' + (o.to ? o.to : nm(town) + '的居民'); }
    return o; }
  function refresh(force) { const b = BD(), P = HUB.cur(); if (!force && b.offer.length && Date.now() - b.gen < LIFE && b.P === P) return; b.gen = Date.now(); b.P = P; b.offer = [];
    for (let i = 0; i < 8 && b.offer.length < 3; i++) { const o = make(); if (o && !b.offer.some(x => x.map === o.map && x.t === o.t)) b.offer.push(o); } G.SAVE.markDirty(); }
  /* ---------- 結算 ---------- */
  function reward(o) { const lv = Math.max(o.lv, Math.min(G.RPG.d().lv, o.lv + 6)), k = o.t === 'elite' ? 16 : o.t === 'gather' ? 12 : o.t === 'deliver' ? 8 : 10 + o.n * 0.4, d = G.RPG.d();
    const exp = Math.round((10 + lv * 6) * k), gold = Math.round((20 + lv * 8) * (k / 3)); R.gainExp(exp); d.gold += gold; const mk = Object.keys(R.MATS), m = rnd(mk); d.mats[m] = (d.mats[m] || 0) + 2 + Math.floor(lv / 10);
    let tx = '經驗 +' + exp + '　錢 +' + gold + '　' + R.MATS[m].n;
    if (o.t === 'elite' || (o.t === 'gather' && Math.random() < 0.5) || Math.random() < 0.2) { let it = null; for (let i = 0; i < 120; i++) { it = R.roll(lv, (G.D.scenes[o.map] || {}).region || 'wind'); if (it.q >= 2) break; } if (it.q < 2) it.q = 2; if (o.t === 'elite' && it.q < 3) it.q = 3; if (R.addItem(it)) tx += '　' + R.QUAL[it.q].n + '・' + R.name(it); }
    G.SAVE.markDirty(); return tx; }
  function done(o) { const b = BD(); b.act = b.act.filter(x => x.id !== o.id); HUB.marks = HUB.marks.filter(m => !m.bq || m.bq !== o.id); G.UI.banner('委託完成　' + o.title, reward(o)); }
  function prog(o) { o.k++; G.SAVE.markDirty(); if (o.k >= o.n) done(o); else G.UI.toast(o.title + '　' + o.k + '／' + o.n); }
  /* 擊殺計數 */
  const k0 = R.onKill.bind(R); R.onKill = function (e) { k0(e); if (!e || e.qid || e.train) return; for (const o of BD().act.slice()) {
      if (o.t === 'kill' && SC.id === o.map) prog(o); else if (o.t === 'elite' && e.bq === o.id) prog(o); } };
  /* ---------- 目標地圖：標記、精英 ---------- */
  function setup() { const id = SC.id; if (!HUB.marks) return; for (const o of BD().act) { if (o.map !== id) continue;
      if (o.t === 'gather') { const got = o.got || 0; for (let i = 0; i < o.n; i++) { if (got & (1 << i)) continue; const key = 'bq:' + o.id + ':' + i; if (HUB.marks.some(m => m.id === key)) continue;
          const c = (SC.def.nodes && SC.def.nodes.center) || [SC.def.w / 2, SC.def.h * 0.6], a = (i + 0.5) / o.n, p = (SC.snap && SC.snap(c[0] + (a - 0.5) * SC.def.w * 0.8, c[1] + Math.sin(i * 2.3) * 60, 'open', 220)) || c;
          HUB.marks.push({ id: key, bq: o.id, glow: 1, x: p[0], y: p[1], label: o.kind[0], kind: 'look', main: false, run: () => { o.got = (o.got || 0) | (1 << i); HUB.marks = HUB.marks.filter(m => m.id !== key); prog(o); } }); } }
      if (o.t === 'elite' && !o._sp && !G.E.some(e => e.bq === o.id && e.st !== 'dead')) { o._sp = id; const foes = (SC.def.foes || []).filter(Boolean); if (!foes.length) continue; const t = rnd(foes);
        Q.load([t]).then(() => { if (SC.id !== id) return; const c = (SC.def.nodes && SC.def.nodes.center) || [H.x + 300, H.y], p = (SC.snap && SC.snap(c[0] + (H.x < c[0] ? 260 : -260), c[1], 'open', 300)) || c;
          const e = G.spawnOni(p[0], p[1], 30, o.lv + 2, t); if (!e) { o._sp = 0; return; } e.bq = o.id; e.elite = '凶暴的精英'; e.hp = e.hpMax = Math.round(e.hpMax * 5); e.atk = Math.round(e.atk * 1.5); e.ratio *= 1.2; G.UI.banner('精英討伐', '凶暴的精英出現了'); }); }
      if (o.t === 'deliver') { const key = 'bq:' + o.id; if (HUB.marks.some(m => m.id === key)) continue; const n = o.to && ((G.AMB && G.AMB.list.find(x => x.name === o.to)) || G.NPC.find(x => x.name === o.to));
        const c = n ? [n.x, n.y] : ((SC.def.nodes && (SC.def.nodes.center || SC.def.nodes.road_center)) || [H.x, H.y]);
        HUB.marks.push({ id: key, bq: o.id, n, x: c[0], y: c[1], label: (o.to || '居民') + '・送' + o.item, kind: 'talk', main: false, run: () => G.DLG.start([say(o.to || '居民', '這是給我的' + o.item + '？謝謝你特地跑一趟！')], () => prog(o)) }); } } }
  /* ---------- 公告板 ---------- */
  let BU = null; G.ANIM.load('pr_village').then(u => { BU = u; }, () => 0);
  function spot() { const o = POS[SC.id]; if (!o) return null; return (SC.snap && SC.snap(o[0], o[1], 'open', 160)) || o; }
  function openBoard() { refresh(); const b = BD(), L = [];
    for (const o of b.offer) L.push({ label: '【接】' + o.title + '　' + o.desc, then: [act(() => { if (b.act.length >= MAX) return G.UI.toast('最多同時接 ' + MAX + ' 張委託'); b.offer = b.offer.filter(x => x !== o); b.act.push(o); G.SAVE.markDirty(); G.UI.banner('接下委託', o.desc); setup(); })] });
    for (const o of b.act) L.push({ label: '【放棄】' + o.title + '（' + o.k + '／' + o.n + '）', then: [act(() => { b.act = b.act.filter(x => x !== o); HUB.marks = HUB.marks.filter(m => m.bq !== o.id); G.SAVE.markDirty(); G.UI.toast('已放棄：' + o.title); })] });
    const left = Math.max(0, Math.ceil((LIFE - (Date.now() - b.gen)) / 60000));
    G.DLG.start([say('', '（委託公告板。進行中 ' + b.act.length + '／' + MAX + '　約 ' + left + ' 分鐘後換新。）'), { choice: L.slice(0, 6).concat([{ label: '離開', then: [] }]) }]); }
  function place() { const id = SC.id; if (!POS[id]) return; if (!G.SAVE.data.flags.prologue) return; const p = spot(); if (!p || !HUB.marks) return;
    HUB.marks = HUB.marks.filter(m => m.id !== 'board'); HUB.marks.push({ id: 'board', x: p[0], y: p[1] + 6, label: '委託公告板', kind: 'look', main: false, _obj: 1, run: openBoard }); }   // r3.104.2：_obj＝不畫地上光暈（公告板本身就是物件）
  /* r3.104.2：圖格下緣到最低不透明像素的距離（只算一次，存在格資料上） */
  function padOf(U, f) { if (f._pad !== undefined) return f._pad; f._pad = 0; try { const im = U.imgs[f[7] || 0], c = document.createElement('canvas'); c.width = f[2]; c.height = f[3]; const g = c.getContext('2d'); g.drawImage(im, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
      const d = g.getImageData(0, 0, f[2], f[3]).data; let bot = f[3] - 1; outer: for (; bot > 0; bot--) for (let x = 0; x < f[2]; x++) if (d[(bot * f[2] + x) * 4 + 3] > 40) break outer; f._pad = Math.max(0, f[5] - bot - 1); } catch (x) { f._pad = 0; } return f._pad; }
  const dm0 = G.STORY.drawMarks.bind(G.STORY); G.STORY.drawMarks = function () { const m = HUB.marks && HUB.marks.find(k => k.id === 'board'), ctx = G.ctx;
    if (m && BU && BU.act.sign_village_idle) { const f = BU.act.sign_village_idle.f[0], sc = 70 * SC.depth(m.y) / f[3], pad = padOf(BU, f) * sc;   // r3.104.2：圖下緣的透明邊補回來（不再懸空）；影子改柔邊、貼住柱腳
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.26); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, f[2] * sc * 0.42); sg.addColorStop(0, 'rgba(25,16,8,.55)'); sg.addColorStop(0.6, 'rgba(25,16,8,.3)'); sg.addColorStop(1, 'rgba(25,16,8,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, f[2] * sc * 0.42, 0, 6.283); ctx.fill(); ctx.restore();
      G.ANIM.draw(BU, f, m.x, m.y + pad, sc, false, 1);
      if (BD().offer.length) { const a = 0.6 + 0.4 * Math.sin(G.t * 0.12); G.txt('！', m.x, m.y - 80 * SC.depth(m.y), 18, `rgba(255,214,110,${a})`, 'center', G.FONT_S, 900); } }
    if (HUB.marks) for (const k of HUB.marks) if (k.glow) { const a = 0.45 + 0.3 * Math.sin(G.t * 0.1 + k.x), s = SC.depth(k.y), rx = 26 * s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(k.x, k.y); ctx.scale(1, 0.3);   // r3.104.2：柔邊光暈，拿掉硬邊圓點
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gg.addColorStop(0, `rgba(150,255,170,${a * 0.4})`); gg.addColorStop(1, 'rgba(150,255,170,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore(); }
    return dm0.apply(this, arguments); };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); for (const o of BD().act) o._sp = 0; G.STORY.later(45, () => { if (SC.id !== id) return; place(); setup(); }); };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 60) return; if (POS[SC.id] && HUB.marks && !HUB.marks.some(m => m.id === 'board')) place(); setup();   // 52_hub 重建標記時會清掉：每秒補回
    for (const m of HUB.marks || []) if (m.bq && m.n && m.n.x > -999) { m.x = m.n.x; m.y = m.n.y; } };
  /* 指引：沒有主線指引時，指向進行中的委託 */
  const gd0 = Q.guide.bind(Q); Q.guide = function () { const g = gd0(); if (g && g.text) return g; const o = BD().act[0]; if (!o) return g;
    const t = '【委託】' + o.desc + '（' + o.k + '／' + o.n + '）'; if (o.map !== SC.id) return { text: t };
    const m = HUB.marks.find(k => k.bq === o.id), e = G.E.find(x => x.bq === o.id && x.st !== 'dead'); return m ? { text: t, x: m.x, y: m.y, label: m.label } : e ? { text: t, x: e.x, y: e.y, label: '精英' } : { text: t }; };
  G.BOARD = { BD, refresh, make, openBoard, setup };
})();
