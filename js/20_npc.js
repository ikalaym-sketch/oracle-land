/* ==========================================================================
 * 神諭之地 重製版 — 20_npc.js
 * Version : r3.153.1  (2026-11-27)　r3.153.1：店家身上有任務時只顯示任務名牌，不再兩個名牌疊在一起
 * 舊版    : r3.151.2  (2026-11-27)　r3.151.2：說話動作當待機時放慢到每格約 0.6 秒
 * 舊版    : r3.151.1  (2026-11-27)　r3.151.1：沒有待機圖的路人（只有走路／說話兩組動作）停下時改播說話動作（取代比手勢）
 * 舊版    : r3.151.0  (2026-11-27)　r3.151.0：沒有待機圖的路人站著時呼吸加大並輕微晃動
 * 舊版    : r3.129.0  (2026-11-27)　r3.129.0：新兩岸城圖：時雨站位改到西口下方
 * 舊版    : r3.128.3  (2026-11-27)　r3.128.3：時雨初始位置改到西邊神社傳點下方
 * 舊版    : r3.127.2  (2026-11-27)　r3.127.2：事件控制中的 NPC（st＝ev，救援士兵）不會被拉去閒聊
 * 舊版    : r3.51.0  (2026-11-18)　r3.51.0：動物比例改成真實大小（牛、鹿、馬放大；狗、狸、狐、猴、雞縮小，a/p/npcs.json 的 r）；動物影子縮小
 * 舊版    : r3.41.1  (2026-11-18)  r3.41.1：兩岸城時雨直接生成在渡口　r3.41.0：任務 NPC（hold＋pace）在定點附近小走動；沒有待機圖的 NPC 改成呼吸起伏，不再像靜止圖片
 * 舊版    : r3.30.0  (2026-11-16)　r3.30.0：路人生成時，先加進來的任務 NPC 不再重複放進畫面清單
 * 舊版    : r3.7.0  (2026-11-13)
 * 變更    : r3.7.0 生成位置改用可走遮罩：只在「寬敞區」（離邊 ≥3 格）；城鎮依 a/place.json 的商店定點／活動區／動物區；走動目標也要寬敞。
 * 變更    : r3.5.1 修正：泡泡繪製會重畫背景，導致所有人物（含主角、妖怪）閃一下消失；NPC 圖集保留上限 24→14（省記憶體）。
 * 變更    : r3.5.0 AM.add／remove（事件臨時 NPC）、onTalk／follow（護送）／hold／onArrive；傳送役選項。
 * 變更    : r3.4.0 新增。P6 路人／動物：進場依 20_npcdata 配置生成，會自己走動、停下、做動作；商店 NPC 站定。
 * 說明    : ・圖集 a/p/n_<id>.json＋webp，進場時才載入（只載這張地圖用到的），超過 24 個單位釋放最久沒用的。
 *           ・行為：待機 → 走到附近可走點 → 做動作（工作／理毛…）；主角靠近（70px）時停下轉頭，偶爾打招呼泡泡。
 *           ・NPC 之間：每 7～14 秒挑兩個人走近聊天（頭上泡泡輪流說），台詞依劇情進度 P 篩選。
 *           ・點擊（談）：開對話框，台詞依職業＋地點＋進度輪流出（不重複到用完）；商店 NPC 有「看看商品」。
 *           ・動物：點擊叫一聲並做動作。戰鬥中照常活動，不逃跑、不消失。泡泡同時最多 2 個。
 *           ・只讀旗標，不寫存檔。
 * 依賴    : 12_anim（G.ANIM）、02_scene（walkable／depth）、06_story（onEnter／step／UI.near）、05_dialog、21_shop（G.SHOP）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, A = G.ANIM, D = G.NPCD, F = () => G.SAVE.data.flags, SC = G.SC;
  const AM = G.AMB = { idx: null, list: [], bubs: [], used: [], chatT: 400, conv: null, sid: null };
  fetch('a/p/npcs.json?v=' + G.VER).then(r => r.json()).then(j => { AM.idx = j; if (G.SC.id) AM.enter(G.SC.id); }).catch(e => console.warn('npcs', e));
  /* 劇情進度：已進入的最高章；終章頭目擊敗＝13 */
  AM.P = function () { const f = F(); let c = 1; for (let i = 2; i <= 12; i++) if (f['ch' + i]) c = i; if (f.boss_W_R12_06) c = 13; return c; };
  const ok = (a, b) => { const p = AM.P(); return p >= a && p <= b; };
  /* 種子亂數：同一張地圖每次進來，商店位置一樣 */
  const seeded = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909), (h >>> 0) / 4294967296)); };
  const SPD = { n_a_cat: 0.55, n_a_dog: 0.8, n_a_hen: 0.32, n_a_chick: 0.38, n_a_rooster: 0.34, n_a_sparrow: 0.5, n_a_crow: 0.42, n_a_deer: 0.6, n_a_rabbit: 0.85, n_a_fox: 0.8,
    n_a_tanuki: 0.5, n_a_macaque: 0.7, n_a_pheasant: 0.45, n_a_cow: 0.28, n_a_packhorse: 0.42, n_a_butterfly: 0.55, n_a_dragonfly: 0.9 };
  const MOVE = ['walk', 'trot', 'hop', 'scurry', 'fly'], NOEXTRA = ['walk', 'idle', 'dialogue', 'trot', 'hop', 'scurry', 'fly', 'takeoff', 'land', 'alight', 'hover', 'glide', 'perch'];
  const FLY = { n_a_butterfly: 1, n_a_dragonfly: 1 };

  /* ---------- 進場：配置 ---------- */
  AM.enter = function (id) {
    AM.list = []; AM.bubs = []; AM.conv = null; AM.chatT = 300; AM.sid = id; if (!AM.idx) return;
    const d = G.D.scenes[id]; if (!d || d.boss || d.dungeon) return;
    const cast = D.CAST[id], want = [];   // [unit, shopId|null, isAnimal]
    if (cast) { (cast.h || []).forEach(u => want.push([u, null])); (cast.s || []).forEach(([u, s]) => want.push([u, s])); (cast.a || []).forEach(u => want.push([u, null])); }
    else if (!d.safe && (d.ch || /^W_R01/.test(id))) { const ch = d.ch || 1, pool = D.FIELD[ch] || [], n = Math.floor(Math.random() * 4);   // 野外：0～3 隻動物＋偶爾一位旅人
      for (let i = 0; i < n && pool.length; i++) want.push([pool[Math.floor(Math.random() * pool.length)], null]);
      if (ch <= 9 && Math.random() < 0.3) want.push([D.TRAVELER[Math.floor(Math.random() * D.TRAVELER.length)], null]); }
    const units = [...new Set(want.map(w => w[0]).filter(u => AM.idx[u]))]; if (!units.length) return;
    AM.used = AM.used.filter(u => !units.includes(u)).concat(units);
    while (AM.used.length > 14) { const u = AM.used.shift(); if (A.U[u] && !units.includes(u)) A.free(u); }
    Promise.all(units.map(u => A.load(u).catch(e => console.warn(e)))).then(() => { if (G.SC.id !== id) return; spawnAll(id, want); });
  };
  function spot(rnd, avoid, minGap) {
    const d = SC.def, P = d.portals || [];
    for (let k = 0; k < 120; k++) { const x = 90 + rnd() * (d.w - 180), y = SC.y0 + rnd() * (SC.y1 - SC.y0);
      if ((SC.room ? SC.room(x, y) : SC.walkable(x, y) ? 3 : 0) < 3) continue; if (P.some(p => { const px = p.line ? p.line[0][0] : p.x !== undefined ? p.x : (p.rect ? p.rect[0] : -999); return Math.abs(px - x) < 150; })) continue;
      if (avoid.some(o => Math.hypot(o[0] - x, (o[1] - y) * 1.5) < minGap)) continue; return [x, y]; }
    return null;
  }
  /* 活動區內的寬敞點 */
  function inZone(z, taken) { for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * z[2], x = z[0] + Math.cos(a) * r, y = z[1] + Math.sin(a) * r * 0.6;
      if (SC.room(x, y) >= 3 && !taken.some(o => Math.hypot(o[0] - x, (o[1] - y) * 1.5) < 50)) return [x, y]; } return null; }
  function spawnAll(id, want) {
    const rs = seeded(id), rr = Math.random, taken = [[G.H.x, G.H.y]], PL = G.PLACE && G.PLACE[id]; let zi = 0;
    for (const [u, shop] of want) { const I = AM.idx[u], un = A.get(u); if (!I || !un) continue;
      let p = null, zone = null;
      if (PL && shop && PL.shops && PL.shops[shop]) p = SC.snap(PL.shops[shop][0], PL.shops[shop][1], 'open', 90);
      else if (PL && !shop) { const ak = u.replace('n_a_', ''), Z = I.an ? (PL.azones && (PL.azones[ak] || PL.azones.default)) || PL.zones : PL.zones; if (Z && Z.length) { zone = Z[(zi++) % Z.length]; p = inZone(zone, taken); } }
      if (u === 'n_t_human_clerk' && id === 'hub_city') { const c = (SC.def.nodes || {}).center; if (c) p = [100, 652]; }   // r3.128.3：時雨站在西邊神社傳點下方   // r3.41.1：時雨直接站在渡口（原本先出現在店位、再被搬到渡口，看起來像閃一下就不見）
      if (!p) p = spot(shop ? rs : rr, taken, shop ? 170 : 60); if (!p) continue; taken.push(p);
      const n = mk(u, p, shop); if (zone) n.R = Math.min(n.R, zone[2]); AM.list.push(n); }
    for (const n of AM.list) if (!G.NPC.includes(n)) G.NPC.push(n);   /* r3.30.0：先加進來的任務 NPC 不再重複放進 G.NPC（同一人畫兩次） */
  }
  function mk(u, p, shop) { const I = AM.idx[u], un = A.get(u);
      const meta = D.UNIT[u] || [I.n], role = meta[1] || null;
      const n = { amb: 1, u, un, name: meta[0], role, an: I.an, r: I.r, shop, x: p[0], y: p[1], hx: p[0], hy: p[1], face: Math.random() < 0.5 ? -1 : 1, st: 'idle', t: 30 + Math.random() * 200,
        act: 'idle', ms: Math.random() * 2000, spd: (SPD[u] || (role === 'child' ? 0.68 : role === 'porter' ? 0.42 : 0.52)), R: shop ? 0 : I.an ? 150 : 280, gcd: 0, li: 0, alpha: 0, fly: FLY[u] ? 40 + Math.random() * 30 : 0 };
    if (shop) n.face = p[0] < SC.def.w / 2 ? 1 : -1; return n; }
  /* 事件用：臨時加一個路人／動物（o 可帶 name、shop、onTalk、hold、follow、onArrive…） */
  AM.add = function (u, x, y, o) { const id = G.SC.id; return A.load(u).then(() => { if (G.SC.id !== id || !AM.idx[u]) return null; const n = Object.assign(mk(u, [x, y], o && o.shop), o || {}); AM.list.push(n); G.NPC.push(n); return n; }); };
  AM.remove = function (n) { AM.list = AM.list.filter(q => q !== n); const i = G.NPC.indexOf(n); if (i >= 0) G.NPC.splice(i, 1); AM.bubs = AM.bubs.filter(b => b.n !== n); };
  /* ---------- 動作取格 ---------- */
  const has = (n, a) => !!n.un.act[a];
  const moveAct = n => MOVE.find(a => has(n, a)) || 'walk';
  const idleAct = n => FLY[n.u] ? 'hover' : has(n, 'idle') ? 'idle' : has(n, 'dialogue') ? 'dialogue' : null;   // r3.151.1：沒有待機圖的人，停下時用說話動作
  const extras = n => Object.keys(n.un.act).filter(a => !NOEXTRA.includes(a));
  function play(n, a) { if (n.act !== a) { n.act = a; n.ms = 0; } }
  function frame(n) {
    let rec = n.un.act[n.act];
    if (!rec) { const w = n.un.act[moveAct(n)] || n.un.act[Object.keys(n.un.act)[0]]; return w.f[0]; }   // 沒有 idle 的：站姿＝走路第 1 格
    return A.frameAt(rec, n.act === 'dialogue' && n.st === 'idle' && !has(n, 'idle') ? n.ms * 0.7 : n.ms);   // r3.151.2：說話動作當待機時放慢（每格約 0.6 秒）
  }
  const busy = n => n.st === 'talk' || n.st === 'meet' || n.chat;
  function pathOk(x0, y0, x1, y1) { const L = Math.hypot(x1 - x0, y1 - y0), k = Math.ceil(L / 24); for (let i = 1; i <= k; i++) if (!SC.walkable(x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k)) return false; return true; }
  function pickTarget(n) {
    for (let k = 0; k < 6; k++) { const a = Math.random() * 6.283, r = 50 + Math.random() * n.R, x = n.hx + Math.cos(a) * r, y = n.hy + Math.sin(a) * r * 0.45;
      if ((SC.room ? SC.room(x, y) >= 2 : SC.walkable(x, y)) && pathOk(n.x, n.y, x, y)) return [x, y]; }
    return null;
  }
  /* ---------- 每格更新 ---------- */
  AM.step = function () {
    if (!AM.list.length || G.mode !== 'play') return;
    if (!G.NPC.includes(AM.list[0])) G.NPC.push(...AM.list.filter(n => !G.NPC.includes(n)));   // 劇情重設 G.NPC 時補回
    const H = G.H, dt = 16.7;
    for (const n of AM.list) { n.ms += dt; if (n.alpha < 1) n.alpha = Math.min(1, n.alpha + 0.04); if (n.gcd > 0) n.gcd--;
      const dh = Math.hypot(H.x - n.x, (H.y - n.y) * 1.5);
      if (n.follow) { const tx = H.x - H.face * 38, ty = H.y + 6, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);   // 護送：跟在主角身後
        if (d > 260) { n.x = tx; n.y = ty; } else if (d > 26) { const sp = Math.min(d, n.spd * 2.6); n.x += dx / d * sp; n.y += dy / d * sp; play(n, moveAct(n)); if (Math.abs(dx) > 3) n.face = Math.sign(dx); } else play(n, idleAct(n) || 'idle'); continue; }
      if (n.chat) { if (Math.abs(H.x - n.x) > 4) n.face = Math.sign(H.x - n.x); play(n, has(n, 'dialogue') ? 'dialogue' : idleAct(n) || 'walk'); continue; }
      if (n.st === 'talk') { const o = n.mate; if (o && Math.abs(o.x - n.x) > 4) n.face = Math.sign(o.x - n.x); play(n, n.speaking && has(n, 'dialogue') ? 'dialogue' : idleAct(n) || 'idle'); continue; }
      if (!n.an && !n.shop && !n.march && dh < 70 && n.st !== 'meet') {   // 主角靠近：停下、轉頭、偶爾打招呼
        if (n.st === 'walk') { n.st = 'idle'; n.t = 90; } if (Math.abs(H.x - n.x) > 6) n.face = Math.sign(H.x - n.x);
        if (n.gcd <= 0 && Math.random() < 0.02) { const g = D.GREET[n.role]; if (g) bubble(n, g[Math.floor(Math.random() * g.length)], 110); n.gcd = 1200; } }
      if (n.shop) { if (n.st === 'act') { if (n.ms > A.dur(n.un.act[n.act])) { n.st = 'idle'; n.t = 300 + Math.random() * 400; } }
        else { play(n, idleAct(n) || 'idle'); if (--n.t <= 0) { const ex = extras(n); if (ex.length) { n.st = 'act'; play(n, ex[Math.floor(Math.random() * ex.length)]); } else n.t = 300; } }
        if (dh < 120 && Math.abs(H.x - n.x) > 6) n.face = Math.sign(H.x - n.x); continue; }
      if (n.st === 'idle') { play(n, idleAct(n) || 'idle'); if (n.hold && n.pace && !n.chat && dh > 60 && --n.t <= 0) { const a = Math.random() * 6.283, r = 18 + Math.random() * 30, x = n.px + Math.cos(a) * r, y = n.py + Math.sin(a) * r * 0.4;   // r3.41.0：任務 NPC 在原地附近小走動
          if (SC.walkable(x, y)) { n.st = 'walk'; n.tx = x; n.ty = y; } n.t = 180 + Math.random() * 240; continue; }
        if ((dh < 70 && !n.an) || n.hold) continue;
        if (--n.t <= 0) { const ex = extras(n), r = Math.random();
          if (ex.length && r < 0.3) { n.st = 'act'; play(n, ex[Math.floor(Math.random() * ex.length)]); }
          else { const t = pickTarget(n); if (t) { n.st = 'walk'; n.tx = t[0]; n.ty = t[1]; } else n.t = 60; } } }
      else if (n.st === 'act') { const rec = n.un.act[n.act]; if (!rec || (!rec.loop && n.ms >= A.dur(rec)) || (rec.loop && n.ms > 2600)) { n.st = 'idle'; n.t = 80 + Math.random() * 240; } }
      else if (n.st === 'walk' || n.st === 'meet') { const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy), sp = n.spd * SC.depth(n.y);
        play(n, moveAct(n)); if (Math.abs(dx) > 2) n.face = Math.sign(dx);
        if (d <= sp) { n.x = n.tx; n.y = n.ty; if (n.st === 'meet') { n.st = 'talk'; } else { n.st = 'idle'; n.t = 90 + Math.random() * 300; if (n.onArrive) n.onArrive(n); } }
        else { const nx = n.x + dx / d * sp, ny = n.y + dy / d * sp; if (SC.walkable(nx, ny)) { n.x = nx; n.y = ny; } else { n.st = n.st === 'meet' ? 'talk' : 'idle'; n.t = 60; } }
        if (n.st === 'meet' && --n.mt <= 0) { n.st = 'talk'; } } }
    convStep();
    for (const b of AM.bubs) b.t++; AM.bubs = AM.bubs.filter(b => b.t < b.life);
  };
  /* ---------- 泡泡 ---------- */
  function bubble(n, text, life) { if (AM.bubs.some(b => b.n === n)) return; const cap = 2 - (G.NPCLIFE && G.NPCLIFE.bub ? 1 : 0); if (AM.bubs.length >= cap) return false; AM.bubs.push({ n, text, t: 0, life: life || 100 + text.length * 7 }); return true; }
  AM.bubble = bubble;
  /* ---------- NPC 之間的對話 ---------- */
  function convStep() {
    const c = AM.conv;
    if (c) { c.t++;
      if (c.ph === 'meet') { if (c.a.st === 'talk' && c.b.st === 'talk') { c.ph = 'say'; c.i = 0; c.t = 0; say(c); } else if (c.t > 420) endConv(); return; }
      if (G.DLG.active()) return;
      if (c.t >= c.life) { c.who.speaking = false; c.i++; if (c.i >= c.lines.length) return endConv(); say(c); }
      return; }
    if (--AM.chatT > 0) return; AM.chatT = 420 + Math.random() * 420;
    const P = AM.P(), pools = (D.CONV[AM.sid] || []).concat(D.CONV._).filter(v => P >= v.p[0] && P <= v.p[1]);
    const free = AM.list.filter(n => !n.an && !n.shop && !busy(n) && n.st !== 'ev' && Math.hypot(G.H.x - n.x, G.H.y - n.y) > 90);
    if (free.length < 2 || !pools.length) return;
    for (let k = 0; k < 8; k++) { const v = pools[Math.floor(Math.random() * pools.length)], r = v.r || [null, null];
      const A1 = free.filter(n => !r[0] || n.role === r[0]); if (!A1.length) continue; const a = A1[Math.floor(Math.random() * A1.length)];
      const B1 = free.filter(n => n !== a && (!r[1] || n.role === r[1]) && Math.hypot(n.x - a.x, n.y - a.y) < 340); if (!B1.length) continue; const b = B1[Math.floor(Math.random() * B1.length)];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, sx = a.x < b.x ? -1 : 1;
      const ta = [mx + sx * 26, my], tb = [mx - sx * 26, my]; if (!SC.walkable(ta[0], ta[1]) || !SC.walkable(tb[0], tb[1])) continue;
      for (const [n, t, m] of [[a, ta, b], [b, tb, a]]) { n.st = 'meet'; n.tx = t[0]; n.ty = t[1]; n.mate = m; n.mt = 360; }
      AM.conv = { a, b, lines: v.l, ph: 'meet', t: 0, i: 0 }; return; }
  }
  function say(c) { const [k, text] = c.lines[c.i], n = k ? c.b : c.a; c.who = n; n.speaking = true; c.t = 0; c.life = 100 + text.length * 8; AM.bubs = AM.bubs.filter(b => b.n !== c.a && b.n !== c.b); AM.bubs.push({ n, text, t: 0, life: c.life }); }
  function endConv() { const c = AM.conv; if (!c) return; for (const n of [c.a, c.b]) { n.speaking = false; n.mate = null; if (n.st === 'talk' || n.st === 'meet') { n.st = 'idle'; n.t = 60 + Math.random() * 120; } } AM.conv = null; }
  /* ---------- 點擊對話 ---------- */
  function talkLines(n) {
    const pool = (D.ROLE[n.role] || []).concat(D.PLACE[AM.sid] || []).filter(l => ok(l[0], l[1])).map(l => l[2]);
    if (!pool.length) return [{ who: n.name, text: '……（點點頭）' }];
    if (!n.li) n.li = 1 + Math.floor(Math.random() * pool.length); const t = pool[n.li++ % pool.length];   // 輪流出，不連續重複
    return t.split('｜').map(s => s[0] === '>' ? { who: '蒼真', text: s.slice(1) } : { who: n.name, text: s });
  }
  function interact(n) {
    if (n.onTalk) return n.onTalk(n);
    if (n.an) { const s = D.ANIMAL[n.u] || ['……']; AM.bubs = AM.bubs.filter(b => b.n !== n); bubble(n, s[Math.floor(Math.random() * s.length)], 90);
      const ex = extras(n); if (ex.length && !FLY[n.u]) { n.st = 'act'; play(n, ex[Math.floor(Math.random() * ex.length)]); } return; }
    if (AM.conv && (AM.conv.a === n || AM.conv.b === n)) endConv();
    n.chat = true; n.st = 'idle'; AM.bubs = AM.bubs.filter(b => b.n !== n);
    const done = () => { n.chat = false; n.st = 'idle'; n.t = 120; };
    if (n.shop && G.SHOP) { const ty = G.SHOP.type(n.shop), hi = D.SHOPHI[ty] || ['歡迎。'];
      G.DLG.start([{ who: n.name, text: hi[Math.floor(Math.random() * hi.length)] },
        { choice: [{ label: ty === 'warp' ? '前往副本／合戰' : '看看商品', then: [{ do: () => ty === 'warp' && G.WARP ? G.WARP.open(n) : G.SHOP.open(n.shop, n) }] }, { label: '隨便聊聊', then: talkLines(n) }, { label: '離開', then: [] }] }], done);
      return; }
    G.DLG.start(talkLines(n), done);
  }
  /* 主角附近可互動的路人：接在劇情互動點之後（劇情優先） */
  const st0 = G.STORY.step.bind(G.STORY);
  G.STORY.step = function () { st0(); if (G.UI.near || !AM.list.length) return; let best = 64, pick = null;
    for (const n of AM.list) { if (n.alpha < 0.5) continue; const d = Math.hypot(G.H.x - n.x, (G.H.y - n.y) * 1.6); if (d < best) { best = d; pick = n; } }
    if (pick) G.UI.near = { label: pick.shop && G.SHOP ? pick.name + '（' + D.SHOPN[G.SHOP.type(pick.shop)] + '）' : pick.name, kind: pick.an ? 'look' : 'talk', run: () => interact(pick), amb: pick }; };
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (!G.MENU.open) AM.step(); };
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { en0(id); AM.enter(id); };
  /* ---------- 繪製 ---------- */
  const drawNpc0 = G.drawNpc;
  G.drawNpc = function (n) { if (!n.amb) return drawNpc0(n);
    const s = SC.depth(n.y), sc = G.HERO_H * n.r * s / n.un.refH, fr = frame(n), lift = n.fly ? n.fly * s + Math.sin((G.t + n.hx) * 0.05) * 6 : 0;
    ctx.fillStyle = 'rgba(30,20,10,.28)'; const sw = Math.max(5, (n.an ? 0.36 : 0.24) * n.un.refH * sc * (n.fly ? 0.3 : 1)); ctx.beginPath(); ctx.ellipse(n.x, n.y, sw, sw * 0.32, 0, 0, 6.283); ctx.fill();
    if (!n.un.act[n.act] && !n.an) { const b = 1 + Math.sin((G.t + n.hx) * 0.06) * 0.028, sw = Math.sin((G.t + n.hx) * 0.031) * 0.025; ctx.save(); ctx.translate(n.x, n.y - lift); ctx.rotate(sw * 0.4); ctx.scale(1 + (b - 1) * 0.4, b);   /* r3.151.0：呼吸加大＋輕微左右晃（原本 1.2% 看起來像定格） */ A.draw(n.un, fr, 0, 0, sc, n.face < 0, n.alpha); ctx.restore(); }   // r3.41.0：沒有待機圖的 NPC 輕微呼吸
    else A.draw(n.un, fr, n.x, n.y - lift, sc, n.face < 0, n.alpha);
    const qOn = n.shop && G.QST && G.QST.marks && G.QST.marks.some(m => m.q && m.x > -999 && Math.abs(m.x - n.x) < 24 && Math.abs(m.y - n.y) < 24);   /* r3.153.1：店家身上有任務標記時，只留任務名牌（不疊兩個） */
    if ((n.shop && !qOn) || (G.UI.near && G.UI.near.amb === n && !qOn)) { const top = n.y - lift - n.un.refH * sc - 6, Z = SC.view().Z;   // 名牌（固定螢幕大小）
      ctx.save(); ctx.translate(n.x, top); ctx.scale(1 / Z, 1 / Z); const lab = n.shop && G.SHOP ? D.SHOPN[G.SHOP.type(n.shop)] : n.name, f = 10 * G.FS();
      ctx.font = `700 ${f}px ${G.FONT}`; const w = ctx.measureText(lab).width + (n.shop ? 26 : 12);
      ctx.fillStyle = n.shop ? 'rgba(120,70,20,.88)' : 'rgba(12,8,10,.7)'; G.rr(-w / 2, -f - 8, w, f + 8, 6); ctx.fill();
      if (n.shop && G.drawIcon) G.drawIcon('ui_icon_map_shop', -w / 2 + 3, -f - 7, f + 6);
      G.txt(lab, n.shop ? 7 : 0, -f / 2 - 3.5, 10, '#fff3cf', 'center', G.FONT, 700); ctx.restore(); }
  };
  /* 泡泡：接在 NPCLIFE.draw（世界座標、SC.end 之前）；不可再呼叫 SC.begin（會重畫背景蓋掉所有角色） */
  const ld0 = G.NPCLIFE.draw; G.NPCLIFE.draw = function (Z) { ld0(Z); for (const b of AM.bubs) drawBub(b, Z); };
  function drawBub(b, Z) { const n = b.n, s = SC.depth(n.y), sc = G.HERO_H * n.r * s / n.un.refH, top = n.y - (n.fly ? n.fly * s : 0) - n.un.refH * sc - (n.shop ? 22 : 8);
    const a = Math.min(1, b.t / 8, (b.life - b.t) / 10);
    ctx.save(); ctx.translate(n.x, top); ctx.scale(1 / Z, 1 / Z); ctx.globalAlpha = Math.max(0, a);
    const fs = 11 * G.FS(); ctx.font = `700 ${fs}px ${G.FONT}`; const lines = G.wrap(b.text, 180), w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * fs * 1.4 + 10;
    ctx.fillStyle = n.an ? 'rgba(236,244,236,.94)' : 'rgba(250,244,230,.94)'; G.rr(-w / 2, -h - 7, w, h, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, -7.5); ctx.lineTo(5, -7.5); ctx.lineTo(0, 0); ctx.fill();
    ctx.fillStyle = '#2a1c20'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((l, i) => ctx.fillText(l, 0, -h - 7 + 5 + fs * 0.7 + i * fs * 1.4)); ctx.restore(); }
})();
