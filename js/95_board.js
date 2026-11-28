/* ==========================================================================
 * 神諭之地 重製版 — 95_board.js
 * Version : r3.220.0  (2026-11-28)　r3.220.0：送東西的委託改成「到店舖買，帶回告示牌」
 * 舊版    : r3.169.0  (2026-11-27)　r3.169.0：告示牌換新圖（去背手繪）；兩岸城的委託合併到城南告示牌
 * 舊版    : r3.168.0  (2026-11-27)　r3.168.0：G.BOARD.act 給右上任務面板
 * 舊版    : r3.167.0  (2026-11-27)　r3.167.0：公告板改成全畫面木板＋和紙委託籤（種類朱印、地點、目標、預估報酬、接下）；進行中列在下方（進度條、放棄要按兩次）；指名委託要走進過該章地圖才貼
 * 舊版    : r3.133.0  (2026-11-27)　r3.133.0：各章「探索區討伐」支線改成公告板的指名委託（完成前常駐，最多 2 張）
 * 舊版    : r3.104.2  (2026-11-26)　r3.104.2：公告板貼地（補回圖下緣透明邊）、影子改柔邊、不畫互動光暈；發光標記改柔邊
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
      o.to = null; o.buy = 1; o.n = 2; o.cost = 10 + o.lv * 2; o.item = rnd(['藥包', '針線', '茶碗', '一束草藥', '護符', '鹽', '燈油']); o.title = '採買：' + o.item; o.desc = '到' + nm(town) + '的店舖買「' + o.item + '」（' + o.cost + ' 文），帶回告示牌'; }   /* r3.220.0：送東西改成「買了帶回告示牌」（原本交給居民，常和居民自己的對話搶位置而交不了） */
    return o; }
  function refresh(force) { const b = BD(), P = HUB.cur(); if (!force && b.offer.length && Date.now() - b.gen < LIFE && b.P === P) return; b.gen = Date.now(); b.P = P; b.offer = [];
    for (let i = 0; i < 8 && b.offer.length < 3; i++) { const o = make(); if (o && !b.offer.some(x => x.map === o.map && x.t === o.t)) b.offer.push(o); } named(b); G.SAVE.markDirty(); }
  /* r3.133.0：指名委託——原本各章的「探索區討伐」支線（104_side s2_a）改貼在公告板上，完成前一直都在（最多 2 張） */
  function named(b) { const S = G.SIDE2 && G.SIDE2.SIDE, F = G.SAVE.data.flags, P = Math.min(12, HUB.cur()); if (!S) return; let n = 0;
    const seen = G.SAVE.data.seen || {}, reached = c => c <= 1 || (G.WORLD.chapters[c] || []).some(id => seen[id]); b.offer = b.offer.filter(x => !x.s2a || reached(x.s2a));   // r3.167.0：走進過該章地圖才貼（原本打完上一章頭目就提早出現）
    for (const [c, ua, na, ta, la, ra] of S) { if (c > P || n >= 2 || !reached(c)) continue; const ex = 'E' + String(c).padStart(2, '0') + '_' + (c % 2 ? 1 : 2), d = G.D.scenes[ex], key = 's2a' + c;
      if (!d || F['s2a_' + c] || (Q.state && Q.state('c' + c + '_s2_a')) || b.act.some(x => x.s2a === c)) continue; n++; if (b.offer.some(x => x.s2a === c)) continue;
      const xn = d.name.replace(/^探索・/, ''); b.offer.unshift({ id: key, t: 'kill', map: ex, lv: Math.max(1, d.lv || 1), k: 0, n: 8, s2a: c, who: na, reply: ra, ask: la, title: '指名：' + ta, desc: na + '：「' + la + '」（探索區「' + xn + '」打倒 8 隻）' }); } }
  /* ---------- 結算 ---------- */
  function est(o) { const lv = Math.max(o.lv, Math.min(G.RPG.d().lv, o.lv + 6)), k = o.t === 'elite' ? 16 : o.t === 'gather' ? 12 : o.t === 'deliver' ? 8 : 10 + o.n * 0.4;
    return { exp: Math.round((10 + lv * 6) * k), gold: Math.round((20 + lv * 8) * (k / 3)), gear: o.t === 'elite' ? '必得精品裝備' : o.t === 'gather' ? '可能有裝備' : '' }; }
  function reward(o) { const lv = Math.max(o.lv, Math.min(G.RPG.d().lv, o.lv + 6)), k = o.t === 'elite' ? 16 : o.t === 'gather' ? 12 : o.t === 'deliver' ? 8 : 10 + o.n * 0.4, d = G.RPG.d();
    const exp = Math.round((10 + lv * 6) * k), gold = Math.round((20 + lv * 8) * (k / 3)); R.gainExp(exp); d.gold += gold; const mk = Object.keys(R.MATS), m = rnd(mk); d.mats[m] = (d.mats[m] || 0) + 2 + Math.floor(lv / 10);
    let tx = '經驗 +' + exp + '　錢 +' + gold + '　' + R.MATS[m].n;
    if (o.t === 'elite' || (o.t === 'gather' && Math.random() < 0.5) || Math.random() < 0.2) { let it = null; for (let i = 0; i < 120; i++) { it = R.roll(lv, (G.D.scenes[o.map] || {}).region || 'wind'); if (it.q >= 2) break; } if (it.q < 2) it.q = 2; if (o.t === 'elite' && it.q < 3) it.q = 3; if (R.addItem(it)) tx += '　' + R.QUAL[it.q].n + '・' + R.name(it); }
    G.SAVE.markDirty(); return tx; }
  function done(o) { const b = BD(); b.act = b.act.filter(x => x.id !== o.id); HUB.marks = HUB.marks.filter(m => !m.bq || m.bq !== o.id); G.UI.banner('委託完成　' + o.title, reward(o));
    if (o.s2a) { G.SAVE.data.flags['s2a_' + o.s2a] = 1; G.SAVE.markDirty(); G.STORY.later(90, () => { if (!G.DLG.active()) G.DLG.start([say(o.who, o.reply), say(o.who, '（' + o.who + '託人送來了謝禮。）')]); }); } }
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
      if (o.t === 'deliver') { const key = 'bq:' + o.id; if (HUB.marks.some(m => m.id === key)) continue; if (!o.buy) { o.buy = 1; o.n = 2; o.k = 0; o.cost = 10 + (o.lv || 1) * 2; o.to = null; o.title = '採買：' + o.item; o.desc = '到' + nm(id) + '的店舖買「' + o.item + '」（' + o.cost + ' 文），帶回告示牌'; }   // 舊的送信委託改成新流程
        const ctr = (SC.def.nodes && (SC.def.nodes.center || SC.def.nodes.road_center)) || [H.x, H.y], snap = (x, y) => (SC.snap && SC.snap(x, y, 'open', 120)) || [x, y];
        if (!o.got) { const n = G.AMB && G.AMB.list.find(x => x.shop), c = n ? snap(n.x + 52, n.y + 12) : ctr;
          HUB.marks.push({ id: key, bq: o.id, x: c[0], y: c[1], label: '買・' + o.item + '（' + o.cost + ' 文）', kind: 'look', main: false, run: () => { const d = G.RPG.d(); if ((d.gold || 0) < o.cost) { G.UI.toast('錢不夠（需要 ' + o.cost + ' 文）'); return; }
            d.gold -= o.cost; o.got = 1; HUB.marks = HUB.marks.filter(m => m.id !== key); G.UI.toast('買到「' + o.item + '」了，帶回告示牌'); prog(o); setup(); } }); }
        else { const b = id === 'hub_city' ? snap(862 + 66, 884) : (() => { const q = spot() || ctr; return snap(q[0] + 58, q[1] + 8); })();
          HUB.marks.push({ id: key, bq: o.id, x: b[0], y: b[1], label: '告示牌・交付' + o.item, kind: 'look', main: false, run: () => { HUB.marks = HUB.marks.filter(m => m.id !== key); G.UI.toast('把「' + o.item + '」交到告示牌了'); prog(o); } }); } } } }
  /* ---------- 公告板 ---------- */
  let BU = null; G.ANIM.load('pr_village').then(u => { BU = u; }, () => 0);
  /* r3.169.0：新告示牌圖（ChatGPT 手繪，去背）；兩岸城跟城南告示牌合併（65_maps 共用 G.SIGN） */
  const SIGN = new Image(); SIGN.src = 'a/board_notice.webp?v=' + G.VER;
  G.SIGN = function (x, y, hk) { if (!SIGN.complete || !SIGN.naturalWidth) return false; const c = G.ctx, h = G.HERO_H * (hk || 1.6) * SC.depth(y), w = h * SIGN.naturalWidth / SIGN.naturalHeight;
    c.save(); c.translate(x + w * 0.1, y); c.scale(1, 0.22); const g = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.6); g.addColorStop(0, 'rgba(25,16,8,.5)'); g.addColorStop(0.6, 'rgba(25,16,8,.25)'); g.addColorStop(1, 'rgba(25,16,8,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, w * 0.6, 0, 6.283); c.fill(); c.restore();
    c.drawImage(SIGN, x - w / 2, y - h * 0.985, w, h); return true; };
  function spot() { const o = POS[SC.id]; if (!o) return null; return (SC.snap && SC.snap(o[0], o[1], 'open', 160)) || o; }
  /* r3.167.0：公告板改成全畫面木板＋和紙委託籤（行旅繪圖同款），取代原本一長串對話選項 */
  const M = G.MENU, ctx = G.ctx, C = G.C, PAPER = '#efe4cb', PAPER2 = '#dccdab', INK = '#2a1d16', INK2 = '#5b4636', SHU = '#b8322a', GOLD = C.gold;
  const SEAL = { kill: '討', gather: '採', elite: '精', deliver: '買' }, GOAL = o => o.t === 'kill' ? '打倒妖怪 ' + o.n + ' 隻' : o.t === 'gather' ? '找到 ' + o.n + ' 處' + o.kind[0] : o.t === 'elite' ? '打倒精英 1 隻' : o.buy ? '買來交到告示牌' : '交給' + (o.to || '居民');
  let BV = { pick: null };
  function openBoard() { refresh(); named(BD()); BV.pick = null; M.board = 1; M.show(); }
  const cl0 = M.close.bind(M); M.close = function () { M.board = 0; cl0(); };
  function take(o) { const b = BD(); if (b.act.length >= MAX) return G.UI.toast('最多同時接 ' + MAX + ' 張委託'); b.offer = b.offer.filter(x => x !== o); b.act.push(o); G.SAVE.markDirty(); G.UI.toast('接下委託：' + o.title); setup(); }
  function drop(o) { const b = BD(); b.act = b.act.filter(x => x !== o); HUB.marks = HUB.marks.filter(m => m.bq !== o.id); G.SAVE.markDirty(); G.UI.toast('已放棄：' + o.title); BV.pick = null; }
  function lines(t, w, f, max) { ctx.font = `800 ${f * G.FS()}px ${G.FONT}`; const L = G.wrap(t, w); if (L.length > max) { L.length = max; L[max - 1] = L[max - 1].slice(0, -1) + '…'; } return L; }
  function slip(o, x, y, w, h, i) { const { button, hit } = M.ui, nm2 = !!o.s2a, full = BD().act.length >= MAX, r = est(o), tilt = ((i * 37) % 5 - 2) * 0.006;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; G.rr(3, 4, w, h, 3); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, PAPER); g.addColorStop(1, PAPER2); ctx.fillStyle = g; G.rr(0, 0, w, h, 3); ctx.fill();
    ctx.strokeStyle = nm2 ? SHU : 'rgba(107,74,44,.5)'; ctx.lineWidth = nm2 ? 2 : 1; G.rr(.5, .5, w - 1, h - 1, 3); ctx.stroke();
    ctx.fillStyle = '#7a1e18'; ctx.beginPath(); ctx.arc(w / 2, 7, 4, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(w / 2 - 1.2, 5.8, 1.3, 0, 6.283); ctx.fill();
    const p = 10; ctx.fillStyle = SHU; G.rr(p, 16, 24, 24, 4); ctx.fill(); G.txt(nm2 ? '指' : SEAL[o.t], p + 12, 29, 14, '#fbf0dc', 'center', G.FONT_S, 900);
    G.txt('Lv ' + o.lv, w - p, 28, 10, INK2, 'right', G.FONT, 800);
    let yy = 52; for (const l of lines(o.title.replace(/^[^：]*：/, ''), w - p * 2, 13, 2)) { G.txt(l, p, yy, 13, INK, 'left', G.FONT_S, 900); yy += 17; }
    if (nm2) { G.txt('委託人　' + o.who, p, yy + 2, 10, SHU, 'left', G.FONT, 800); yy += 16; }
    ctx.strokeStyle = 'rgba(107,74,44,.3)'; ctx.beginPath(); ctx.moveTo(p, yy); ctx.lineTo(w - p, yy); ctx.stroke(); yy += 14;
    G.txt('◇ ' + nm(o.map), p, yy, 11, INK, 'left', G.FONT, 800); yy += 17; G.txt('◇ ' + GOAL(o), p, yy, 11, INK, 'left', G.FONT, 800); yy += 20;
    G.txt('經驗 ' + r.exp + '　錢 ' + r.gold, p, yy, 10, '#6b4a1c', 'left', G.FONT, 800); yy += 15; if (r.gear) G.txt(r.gear, p, yy, 10, '#3f6a9a', 'left', G.FONT, 800);
    ctx.restore();
    const bh = 30, bx = x + p, by = y + h - bh - 8, bw = w - p * 2; ctx.fillStyle = full ? 'rgba(107,90,70,.5)' : SHU; G.rr(bx, by, bw, bh, 5); ctx.fill();
    G.txt(full ? '已接滿' : '接下', bx + bw / 2, by + bh / 2 + 1, 13, '#fbeee0', 'center', G.FONT_S, 900); if (!full) hit(bx, by, bw, bh, () => take(o)); }
  const dr0 = M.draw; M.draw = function () { if (!M.board) return dr0.apply(this, arguments); const { button, hit } = M.ui; M.hits = []; M.area = []; const b = BD();
    ctx.fillStyle = 'rgba(10,7,9,.95)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * G.FS(), left = Math.max(0, Math.ceil((LIFE - (Date.now() - b.gen)) / 60000));
    G.txt('委託公告板', L + 6, T + SH / 2 + 1, 18, GOLD, 'left', G.FONT_S, 900); ctx.font = `900 ${18 * G.FS()}px ${G.FONT_S}`; G.txt('約 ' + left + ' 分鐘後換新', L + 20 + ctx.measureText('委託公告板').width, T + SH / 2 + 2, 11, C.sub, 'left', G.FONT, 600);
    button(Rt - 84, T, 84, SH, '✕ 離開', () => M.close());
    const ah = b.act.length ? 58 : 0, top = T + SH + 10, bot = B - (ah ? ah + 10 : 0), w = Rt - L, h = bot - top;
    /* 木板 */
    const wg = ctx.createLinearGradient(L, top, L, bot); wg.addColorStop(0, '#5a3d26'); wg.addColorStop(1, '#3a2716'); ctx.fillStyle = wg; G.rr(L, top, w, h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const yy = top + h * k / 4; ctx.beginPath(); ctx.moveTo(L + 6, yy); ctx.lineTo(L + w - 6, yy); ctx.stroke(); }
    ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 3; G.rr(L + 1.5, top + 1.5, w - 3, h - 3, 8); ctx.stroke();
    const of = b.offer.slice(0, 5), n = Math.max(3, of.length), gap = 12, sw = Math.min(200, (w - 24 - gap * (n - 1)) / n), tot = of.length * sw + (of.length - 1) * gap, x0 = L + (w - tot) / 2;
    if (!of.length) G.txt('目前沒有新的委託', L + w / 2, top + h / 2, 14, 'rgba(240,225,200,.7)', 'center', G.FONT_S, 900);
    of.forEach((o, i) => slip(o, x0 + i * (sw + gap), top + 14, sw, h - 28, i));
    /* 進行中 */
    if (ah) { const y = B - ah; G.txt('進行中 ' + b.act.length + '／' + MAX, L + 4, y + ah / 2, 12, GOLD, 'left', G.FONT_S, 900); const cx0 = L + 84, cw = (Rt - cx0 - 8 * (MAX - 1)) / MAX;
      b.act.forEach((o, i) => { const x = cx0 + i * (cw + 8); ctx.fillStyle = 'rgba(40,28,22,.95)'; G.rr(x, y, cw, ah, 6); ctx.fill(); ctx.strokeStyle = o.s2a ? SHU : 'rgba(227,194,122,.35)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, cw - 1, ah - 1, 6); ctx.stroke();
        ctx.fillStyle = SHU; G.rr(x + 8, y + 8, 18, 18, 3); ctx.fill(); G.txt(o.s2a ? '指' : SEAL[o.t], x + 17, y + 17.5, 11, '#fbf0dc', 'center', G.FONT_S, 900);
        const tl = lines(o.title.replace(/^[^：]*：/, ''), cw - 100, 12, 1)[0]; G.txt(tl, x + 32, y + 17, 12, C.ink, 'left', G.FONT_S, 900);
        const pw = cw - 100, py = y + 38; ctx.fillStyle = 'rgba(255,255,255,.1)'; G.rr(x + 10, py, pw, 6, 3); ctx.fill(); ctx.fillStyle = GOLD; G.rr(x + 10, py, Math.max(6, pw * o.k / o.n), 6, 3); ctx.fill();
        G.txt(o.k + '／' + o.n + '　' + nm(o.map), x + 10, py + 14, 9, C.sub, 'left', G.FONT, 700);
        const conf = BV.pick === o.id; button(x + cw - 82, y + 12, 74, ah - 24, conf ? '確定放棄' : '放棄', () => { if (conf) drop(o); else BV.pick = o.id; }); }); } };
  function place() { const id = SC.id; if (!POS[id] || id === 'hub_city') return; /* r3.169.0：兩岸城改用城南告示牌（65_maps） */ if (!G.SAVE.data.flags.prologue) return; const p = spot(); if (!p || !HUB.marks) return;
    HUB.marks = HUB.marks.filter(m => m.id !== 'board'); HUB.marks.push({ id: 'board', x: p[0], y: p[1] + 6, label: '委託公告板', kind: 'look', main: false, _obj: 1, run: openBoard }); }   // r3.104.2：_obj＝不畫地上光暈（公告板本身就是物件）
  /* r3.104.2：圖格下緣到最低不透明像素的距離（只算一次，存在格資料上） */
  function padOf(U, f) { if (f._pad !== undefined) return f._pad; f._pad = 0; try { const im = U.imgs[f[7] || 0], c = document.createElement('canvas'); c.width = f[2]; c.height = f[3]; const g = c.getContext('2d'); g.drawImage(im, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
      const d = g.getImageData(0, 0, f[2], f[3]).data; let bot = f[3] - 1; outer: for (; bot > 0; bot--) for (let x = 0; x < f[2]; x++) if (d[(bot * f[2] + x) * 4 + 3] > 40) break outer; f._pad = Math.max(0, f[5] - bot - 1); } catch (x) { f._pad = 0; } return f._pad; }
  const dm0 = G.STORY.drawMarks.bind(G.STORY); G.STORY.drawMarks = function () { const m = HUB.marks && HUB.marks.find(k => k.id === 'board'), ctx = G.ctx;
    if (m && G.SIGN(m.x, m.y, 1.6)) { if (BD().offer.length) { const a = 0.6 + 0.4 * Math.sin(G.t * 0.12); G.txt('！', m.x, m.y - G.HERO_H * 1.75 * SC.depth(m.y), 18, `rgba(255,214,110,${a})`, 'center', G.FONT_S, 900); } }
    else if (m && BU && BU.act.sign_village_idle) { const f = BU.act.sign_village_idle.f[0], sc = 70 * SC.depth(m.y) / f[3], pad = padOf(BU, f) * sc;   // r3.104.2：圖下緣的透明邊補回來（不再懸空）；影子改柔邊、貼住柱腳
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.26); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, f[2] * sc * 0.42); sg.addColorStop(0, 'rgba(25,16,8,.55)'); sg.addColorStop(0.6, 'rgba(25,16,8,.3)'); sg.addColorStop(1, 'rgba(25,16,8,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, f[2] * sc * 0.42, 0, 6.283); ctx.fill(); ctx.restore();
      G.ANIM.draw(BU, f, m.x, m.y + pad, sc, false, 1);
      if (BD().offer.length) { const a = 0.6 + 0.4 * Math.sin(G.t * 0.12); G.txt('！', m.x, m.y - 80 * SC.depth(m.y), 18, `rgba(255,214,110,${a})`, 'center', G.FONT_S, 900); } }
    if (HUB.marks) for (const k of HUB.marks) if (k.glow) { const a = 0.45 + 0.3 * Math.sin(G.t * 0.1 + k.x), s = SC.depth(k.y), rx = 26 * s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(k.x, k.y); ctx.scale(1, 0.3);   // r3.104.2：柔邊光暈，拿掉硬邊圓點
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gg.addColorStop(0, `rgba(150,255,170,${a * 0.4})`); gg.addColorStop(1, 'rgba(150,255,170,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore(); }
    return dm0.apply(this, arguments); };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); for (const o of BD().act) o._sp = 0; G.STORY.later(45, () => { if (SC.id !== id) return; place(); setup(); }); };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 60) return; if (POS[SC.id] && SC.id !== 'hub_city' && HUB.marks && !HUB.marks.some(m => m.id === 'board')) place(); setup();   // 52_hub 重建標記時會清掉：每秒補回
    for (const m of HUB.marks || []) if (m.bq && m.n && m.n.x > -999) { m.x = m.n.x; m.y = m.n.y; } };
  /* 指引：沒有主線指引時，指向進行中的委託 */
  const gd0 = Q.guide.bind(Q); Q.guide = function () { const g = gd0(); if (g && g.text) return g; const o = BD().act[0]; if (!o) return g;
    const t = '【委託】' + o.desc + '（' + o.k + '／' + o.n + '）'; if (o.map !== SC.id) return { text: t };
    const m = HUB.marks.find(k => k.bq === o.id), e = G.E.find(x => x.bq === o.id && x.st !== 'dead'); return m ? { text: t, x: m.x, y: m.y, label: m.label } : e ? { text: t, x: e.x, y: e.y, label: '精英' } : { text: t }; };
  G.BOARD = { BD, refresh, make, openBoard, setup, act: () => BD().act };   // r3.168.0：act 給右上任務面板
})();
