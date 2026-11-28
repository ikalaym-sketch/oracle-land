/* ==========================================================================
 * 神諭之地 重製版 — 53_quest.js
 * Version : r3.225.0  (2026-11-28)　r3.225.0：任務經驗改成升級所需的 70%／30%
 * 舊版    : r3.215.0  (2026-11-28)　r3.215.0：匯出 Q.avail
 * 舊版    : r3.131.0  (2026-11-27)　r3.131.0：新增 fn 自訂步驟（進圖執行一次）
 * 舊版    : r3.130.0  (2026-11-27)　r3.130.0：任務步驟支援 skip()（跨章抉擇可省略步驟）
 * 舊版    : r3.91.0  （r3.91.0：「受傷的鼬」委託人「草叢」原本被補成村民，改成站一隻小鼬）
 * 舊版    : r3.56.0  （r3.56.0：夥伴委託人大小校正）　r3.55.0：任務獎勵依主角等級補正）　r3.52.0  (2026-11-23)  r3.52.0：每秒檢查新成立的任務並重建標記（不用換圖才出現）；小鼬用鎌鼬圖（縮小）站在任務點
 * 舊版    : r3.41.0  (2026-11-18)  r3.41.0：任務 NPC 在定點附近小走動（pace）
 * 舊版    : r3.39.0  (2026-11-17)  r3.39.0：進圖劇情（cut）可改成「走近人物觸發」（Q.nearCut，87_story2）；標記可帶多個站位人物（m.sts／m.ns）
 * 舊版    : r3.21.0  （r3.21.0：守點進圖自動開始、同圖重建不中斷；匯出 STAT 給對話登場）
 * 舊版    : r3.19.5  （r3.19.5：夥伴加入過場改成夥伴先跑到主角身邊再對話）
 * 舊版    : r3.19.1  （r3.19.1：任務頁依章節收合；可指定追蹤任務或關閉指引）
 * 舊版    : r3.18.3  （r3.18.3：頭目／夥伴委託人用自身圖集站在任務標記處）
 * 舊版    : r3.18.1  （r3.18.1：任務地點改由渡口時雨傳送，城鎮地面不再放驛馬標記）
 * 舊版    : r3.12.0  (2026-11-14)
 * 變更    : r3.12.0 任務互動修正：任務 NPC（路人單位）被點到時直接執行任務對話（原本會變成路人閒聊）；
 *           頭上記號＝委託「！」／對話目標「？」，主線金、支線藍；同一位置多個任務只顯示並觸發最優先的一個（主線＞支線）；
 *           Q.busy(x,y)：該處有任務互動點（給劇情腳本讓位用）。互動點自動錯開（與其他互動點／設施距離 ≥ 64px），記號跟著 NPC 移動。
 * 變更    : r3.11.1 跨章導引改指向祈願石（兼歸城）。
 * 變更    : r3.11.0 新增。任務引擎（主線／支線／頭目委託）：
 *           ・步驟：talk 找人｜look 調查｜goto 抵達｜kill 討伐｜hold 守點｜gather 收集｜escort 護送｜choice 抉擇｜cut 進圖劇情
 *           ・任務 NPC 依步驟自動出現在指定地圖（沿用路人單位 G.AMB），頭上「！」＝可接、「…」＝進行中
 *           ・下一步導引：同圖指向目標；同章跨圖指向出口；跨章指向歸城石／渡口（由 52_hub 的 goal 接手）
 *           ・封印門：章節頭目圖在主線完成前不出頭目，點門顯示還缺什麼
 *           ・選單「任務」頁：主線／支線／委託、步驟、地點、獎勵
 * 依賴    : 52_hub（章節、歸城石）、18_world、20_npc（G.AMB）、05_dialog、07_rpg。
 * 存檔    : save.qs[id] = { s: 步驟, k: 計數, done }；save.qc[key] = 抉擇結果。
 * ========================================================================== */
'use strict';
(function () {
  const F = () => G.SAVE.data.flags, SV = () => G.SAVE.data, SC = G.SC, HUB = G.HUB, WD = G.WORLD;
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn });
  const Q = G.QST = { L: [], by: {}, marks: [], spawned: {}, bossMod: {} };
  const st = id => (SV().qs = SV().qs || {})[id];
  const qc = () => (SV().qc = SV().qc || {});
  Q.choice = k => qc()[k];
  Q.say = say; Q.act = act;
  const nm = id => (G.D.scenes[id] || {}).name || id;
  Q.add = function (q) { q.steps = q.steps || []; Q.L.push(q); Q.by[q.id] = q; return q; };
  Q.state = id => st(id);
  Q.isDone = id => !!(st(id) && st(id).done);
  Q.active = id => { const s = st(id); return !!(s && !s.done); };
  const avail = q => !st(q.id) && (!q.ch || HUB.open(q.ch) || q.ch <= HUB.cur()) && (!q.after || [].concat(q.after).every(Q.isDone)) && (!q.need || q.need());
  Q.avail = avail;   /* r3.215.0：給任務頁「可接」用 */
  function start(q) { SV().qs[q.id] = { s: 0, k: 0 }; G.SAVE.markDirty(); if (!q.silent) G.UI.banner((q.main ? '主線　' : q.boss ? '委託　' : '支線　') + q.title, q.desc || ''); enterStep(q); }
  Q.start = id => { const q = Q.by[id]; if (q && !st(id)) { st(id) || (SV().qs = SV().qs || {}); start(q); } };
  function reward(q) { const r = q.reward || {}, R = G.RPG, d = R.d(); const out = [];
    /* r3.55.0：獎勵依主角等級補正——錢／經驗設下限；裝備的階級跟主角等級、品質主線≥稀品／支線≥精品、附詞綴與本區套裝 */
    const lv = Math.max(1, d.lv), gold = Math.max(r.gold || 0, r.gold || r.exp || r.item ? Math.round((20 + lv * 8) * (q.main ? 8 : 5)) : 0), exp = Math.max(r.exp || 0, r.exp || r.gold || r.item ? Math.round(R.need(lv) * (q.main ? 0.7 : 0.3)) : 0);   /* r3.225.0：任務經驗改成「升一級所需」的 70%（主線）／30%（支線），照主線走就跟得上地圖等級 */
    if (gold) { d.gold += gold; out.push('錢 +' + gold); } if (exp) { R.gainExp(exp); out.push('經驗 +' + exp); }
    if (r.item) { const slot = Math.floor(r.item[0] / 16), tier = Math.max(0, Math.min(7, Math.floor((lv - 1) / 5))), tid = slot * 16 + tier * 2 + (r.item[0] % 2);
      const qq = Math.min(5, Math.max(r.item[1] || 1, q.main ? 3 : 2) + (q.main && Math.random() < 0.25 ? 1 : 0)), keys = Object.keys(R.AFF), aff = [];
      for (let i = 0; i < R.QUAL[qq].aff; i++) { const k = keys[Math.floor(Math.random() * keys.length)]; aff.push([k, Math.round(R.AFF[k][1] * (0.9 + Math.random() * 0.4) * (1 + lv * 0.18) * 10) / 10]); }
      const set = qq >= 3 && R.setHere ? R.setHere() : null, it = R.make(tid, qq, lv, aff, set); if (R.addItem(it)) out.push(R.QUAL[it.q].n + '・' + R.name(it)); }
    if (r.mat) for (const k in r.mat) { d.mats[k] = (d.mats[k] || 0) + r.mat[k]; }
    if (r.mat) out.push('素材'); return out.join('　'); }
  function finish(q) { const s = st(q.id); s.done = 1; s.t = Date.now(); G.SAVE.markDirty(); G.SAVE.flush();
    const rw = reward(q); G.UI.banner((q.main ? '主線完成　' : '任務完成　') + q.title, rw); q.done && q.done(); refresh(); }
  function next(q) { const s = st(q.id); s.s++; while (s.s < q.steps.length && q.steps[s.s].skip && q.steps[s.s].skip()) s.s++; s.k = 0;   // r3.130.0：步驟可設 skip()（跨章抉擇省略）
    G.SAVE.markDirty(); if (s.s >= q.steps.length) finish(q); else { enterStep(q); refresh(); } }
  Q.next = id => { const q = Q.by[id]; if (q && Q.active(id)) next(q); };
  const cur = q => { const s = st(q.id); return s && !s.done ? q.steps[s.s] : null; };
  Q.cur = id => cur(Q.by[id]);
  /* 劇情夥伴加入：旗標＋名冊資料＋上場欄（招募點數由 51_party_grow 的 earned 計算） */
  const PN = { hayate: '颯', kuzuha: '葛葉', ibaraki: '茨木童子', shion: '汐音' };
  Q.join = function (id) { const f = F(); if (f['join_' + id]) return; f['join_' + id] = 1; const d = G.RPG.d(); d.comp = d.comp || {}; d.comp[id] = d.comp[id] || { lv: Math.max(1, d.lv - 2), exp: 0 };
    if (G.PARTY && G.PARTY.onJoin) G.PARTY.onJoin(id); G.SAVE.markDirty(); G.UI.banner((PN[id] || id) + '　加入了隊伍', '選單 › 夥伴：可調整上場夥伴與技能樹'); };
  function refresh() { if (SC.id) { build(); if (HUB.marks) HUB.marks = HUB.marks.filter(m => !/^trip:/.test(m.id)); tripMarks(); } gk = ''; }

  /* ---------- 地圖上的任務物件 ---------- */
  function P(step, def) { const d = SC.def, n = d.nodes || {}; let p = step.at ? (Array.isArray(step.at) ? step.at : n[step.at]) : null; p = p || n.center || d.start || [d.w / 2, d.h * 0.66];
    const x = p[0] + (step.dx || 0), y = p[1] + (step.dy || 0), q = SC.snap ? SC.snap(x, y, 'open', 160) : null; return q || [x, y]; }
  /* 錯開：新互動點與既有互動點／設施（任務點、HUB 點、祈願石等）至少相距 64px；沿水平方向找空位 */
  function free(p) { const others = Q.marks.concat(HUB.marks ? HUB.marks.filter(m => !m.q) : [], G.NAV ? G.NAV.list : []), ok = q => others.every(o => !(o.x > -999) || Math.hypot(o.x - q[0], (o.y - q[1]) * 1.4) >= 64);
    if (ok(p)) return p; for (const d of [72, -72, 144, -144, 216, -216]) for (const dy of [0, 36, -36]) { const q = SC.snap ? SC.snap(p[0] + d, p[1] + dy, 'open', 40) : [p[0] + d, p[1] + dy]; if (q && ok(q)) return q; } return p; }
  const run = (lines, cb) => G.DLG.start(typeof lines === 'function' ? lines() : lines, cb);
  /* r3.18.3：沒有路人圖的委託人（頭目／夥伴）→ 用頭目／夥伴圖集的待機動作站在標記處 */
  const PU = id => () => { const D = G.PARTY && G.PARTY.DEF && G.PARTY.DEF[id]; return D ? D.unit({ id }) : null; };
  const STAT = { '鎌鼬長兄': ['b_kama', 1.15, 'kama1_idle_left3q', -1], '小鼬': ['b_kama', 0.55, 'kama1_idle_left3q', -1], '草叢': ['b_kama', 0.45, 'kama1_idle_left3q', -1], '長壁姬': ['b_osakabe', 1.1, 'osakabe_idle_right3q'], '雷獸': ['b_raiju', 1.0], '須佐之男': ['b_susanoo', 1.2], '綿津見': ['b_watatsumi', 1.2], '汐音': [PU('shion'), 1], '颯': [PU('hayate'), 1] };
  /* r3.19.5：夥伴加入過場——夥伴先從畫面邊緣跑到主角身邊，到了才開始對話 */
  Q.STAT = STAT;   // r3.21.0：給 59_stage 對話登場用
  const RUNIN = { '汐音': 'shion', '颯': 'hayate', '葛葉': 'kuzuha', '茨木童子': 'ibaraki' };
  let runner = null;
  function runOut() { if (runner) { G.NPC = G.NPC.filter(x => x !== runner); runner = null; } }
  function runIn(id, done) { const D = G.PARTY && G.PARTY.DEF && G.PARTY.DEF[id], key = D && D.unit({ id }); if (!key) { G.STORY.later(30, done); return; }
    const H = G.H, side = H.x > SC.def.w / 2 ? -1 : 1, { vw } = SC.view(), sx = Math.max(40, Math.min(SC.def.w - 40, H.x + side * vw * 0.55)), p0 = SC.snap ? (SC.snap(sx, H.y, 'walk', 300) || [sx, H.y]) : [sx, H.y];
    const o = runner = { anim: key, hk: 1, nat: 1, name: D.name, x: p0[0], y: p0[1], face: -side }; G.NPC.push(o);
    Promise.resolve(G.ANIM.load(key)).then(u => { if (!u) { done(); return; } const c = ['run', 'walk', 'idle'].find(n => u.act[n]) || Object.keys(u.act)[0]; o.u = u; o.clip = u.act[c]; const idle = u.act.idle || o.clip;
      const tx = H.x + side * 56, ty = H.y + 4; let n = 0; const step = () => { const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 6 || ++n > 240) { o.clip = idle; o.face = -side; done(); return; }
        o.x += dx / d * Math.min(d, 4.2); o.y += dy / d * Math.min(d, 4.2); o.face = Math.sign(dx) || o.face; G.STORY.later(1, step); }; step(); }, () => done()); }
  function statue(m, [k, hk, cn, nat], name) { const key = typeof k === 'function' ? k() : k; if (!key) return; const o = { anim: key, hk, nat: nat || 1, name, x: m.x, y: m.y, face: G.H.x < m.x ? -1 : 1 }; m.st = o; G.NPC.push(o);
    Promise.resolve(G.ANIM.load(key)).then(u => { if (!u || !u.act) return; const c = (cn && u.act[cn] && cn) || Object.keys(u.act).find(n => /idle|stand|wait/.test(n)) || Object.keys(u.act)[0]; o.clip = u.act[c]; o.u = u;
      const pid = G.PARTY && Object.keys(G.PARTY.DEF).find(i => G.PARTY.DEF[i].name === name); if (pid) { const D = G.PARTY.DEF[pid]; o.hk = D.ratio * (u.refH || 130) / (D.refH({ id: pid }) || 130); } }, () => 0); }   // r3.56.0：夥伴當委託人時大小與戰鬥一致
  function addNpc(q, step, key, u, name, onTalk, label) {
    const p = u ? free(P(step)) : P(step); const m = { id: key, q, x: p[0], y: p[1], label: label || name, kind: 'talk', run: onTalk, qmark: /:giver$/.test(key) ? '!' : '?', main: !!q.main };
    Q.marks.push(m); if (!u && STAT[name]) statue(m, STAT[name], name);
    if (u && G.AMB) G.AMB.add(u, p[0], p[1], { name, hold: true, pace: 1, px: p[0], py: p[1], onTalk: () => { if (Q.marks.includes(m)) { G.UI.near = null; m.run(); } } }).then(n => { if (!n) return; m.n = n; n.face = G.H.x < n.x ? -1 : 1; if (step.walkTo) { const t = P({ at: step.walkTo }); n.st = 'walk'; n.tx = t[0]; n.ty = t[1]; n.onArrive = k => { k.hold = true; k.px = k.x; k.py = k.y; m.x = k.x; m.y = k.y; }; } });
    return m; }
  let building = false, again = false;
  function enterStep(q) { if (!SC.id) return; if (building) { again = true; return; } build(); }
  function spawnFoes(q, step) { const key = q.id + ':' + st(q.id).s; if (Q.spawned[key] === SC.id) return; Q.spawned[key] = SC.id;
    const p = P(step), n = Math.max(0, (step.n || 3) - (st(q.id).k || 0)), lv = (step.lv || 0) + Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 2);
    const types = step.foes || SC.def.foes || ['akaoni'];
    const go = () => { if (SC.id !== step.map) return; for (let i = 0; i < n; i++) { const a = i / Math.max(1, n) * 6.283, e = G.spawnOni(p[0] + Math.cos(a) * 140, p[1] + Math.sin(a) * 50, 20 + i * 12, lv, types[i % types.length]); if (e) { e.qid = q.id; if (step.elite && i === 0) { e.hp = e.hpMax = Math.round(e.hpMax * 4); e.atk = Math.round(e.atk * 1.4); e.ratio *= 1.15; e.elite = step.elite; } } }
      if (step.elite) G.UI.banner(step.elite, step.eliteSub || '強敵出現'); };
    Q.load(types).then(go, go); }
  Q.load = types => { const ok = (G.ENEMY_IDX ? types.filter(t => G.ENEMY_IDX[t]) : types); return ok.length && G.ASSET && G.ASSET.enemies ? G.ASSET.enemies(ok) : Promise.resolve(); };
  function build() { building = true; again = false; try { build0(); } finally { building = false; } if (again) build(); }
  function build0() {
    for (const m of Q.marks) { if (m.n && G.AMB) G.AMB.remove(m.n); if (m.st) G.NPC = G.NPC.filter(x => x !== m.st); if (m.sts) G.NPC = G.NPC.filter(x => !m.sts.includes(x)); if (m.ns && G.AMB) m.ns.forEach(n => G.AMB.remove(n)); m.dead = 1; } Q.marks = []; if (Q.hold && Q.hold.step.map !== SC.id) Q.hold = null;   /* r3.21.0：同圖重建不中斷守點 */
    const id = SC.id;
    for (const q of Q.L) {
      const s = st(q.id);
      if (!s && !q.giver && avail(q)) { start(q); continue; }   // 沒有委託人的（主線）：條件達成就自動開始
      if (!s) { const g = q.giver; if (g && g.map === id && avail(q) && (!g.need || g.need())) addNpc(q, g, q.id + ':giver', g.u, g.name, () => run(g.lines || [say(g.name, q.desc || q.title)], () => { if (!st(q.id)) start(q); }), g.name); continue; }
      if (s.done) { const a = q.after2; if (a && a.map === id) addNpc(q, a, q.id + ':after', a.u, a.name, () => run(a.lines)).qmark = ''; continue; }
      const step = q.steps[s.s]; if (!step || step.map !== id) continue;
      if (step.t === 'goto') { if (step.lines) G.STORY.later(30, () => run(step.lines, () => next(q))); else next(q); continue; }
      if (step.t === 'fn') { const k = q.id + ':' + s.s; if (Q.spawned[k] !== id) { Q.spawned[k] = id; G.STORY.later(30, () => { if (SC.id === step.map && cur(q) === step) step.run(q, () => { if (cur(q) === step) next(q); }); }); } continue; }   // r3.131.0：自訂步驟（進圖執行一次，完成呼叫 done）
      if (step.t === 'cut' && Q.nearCut && Q.nearCut(q, step, s)) continue;   // r3.39.0：走近觸發
      if (step.t === 'cut') { const who = step.lines && step.lines[0] && step.lines[0].who; if (RUNIN[who] && !G.SAVE.data.flags['join_' + RUNIN[who]]) { runIn(RUNIN[who], () => run(step.lines, () => { runOut(); next(q); })); continue; } G.STORY.later(30, () => run(step.lines, () => next(q))); continue; }
      if (step.t === 'talk' || step.t === 'choice') addNpc(q, step, q.id + ':s', step.u, step.name, () => talk(q, step), step.name);
      else if (step.t === 'look') { const p = free(P(step)); Q.marks.push({ id: q.id + ':look', q, x: p[0], y: p[1], label: step.label || '調查', kind: 'look', run: () => run(step.lines, () => next(q)) }); }
      else if (step.t === 'gather') { (step.spots || []).forEach((sp, i) => { if ((s.got || 0) & (1 << i)) return; const p = free(P(sp));
        Q.marks.push({ id: q.id + ':g' + i, q, x: p[0], y: p[1], label: sp.label || step.label || '調查', kind: 'look', run: () => run(sp.lines || [say('蒼真', '找到了。')], () => { s.got = (s.got || 0) | (1 << i); s.k = (s.k || 0) + 1; G.SAVE.markDirty(); if (s.k >= step.spots.length) next(q); else { G.UI.toast(step.text + '　' + s.k + '／' + step.spots.length); build(); } }) }); }); }
      else if (step.t === 'kill') spawnFoes(q, step);
      else if (step.t === 'hold') { if (!(Q.hold && Q.hold.q === q) && Q.arm !== q.id) { Q.arm = q.id; G.STORY.later(40, () => { Q.arm = null; if (SC.id === step.map && cur(q) === step && !(Q.hold && Q.hold.q === q)) run(step.lines || [], () => holdStart(q, step)); }); } }   /* r3.21.0：進圖自動開始守點（原本要找「拜殿前」標記，玩家找不到→卡關） */
      if (step.escort) escortNpc(q, step);
    }
    if (G.HUB && HUB.marks) HUB.marks = HUB.marks.filter(m => !m.q).concat(Q.marks);
  }
  Q.build = build;
  function talk(q, step) { const lines = typeof step.lines === 'function' ? step.lines() : (step.lines || []);
    if (step.t === 'choice') { const ch = step.opts.map(o => ({ label: o.label, then: (typeof o.lines === 'function' ? o.lines() : (o.lines || [])).concat([act(() => { qc()[step.key] = o.v; G.SAVE.markDirty(); o.on && o.on(); })]) }));
      G.DLG.start(lines.concat([{ choice: ch }]), () => next(q)); return; }
    G.DLG.start(lines, () => next(q)); }
  /* 護送：跟隨 NPC 在步驟所在地圖之間持續出現 */
  function escortNpc(q, step) { const e = step.escort; if (!G.AMB) return; const p = [G.H.x - 50, G.H.y + 6];
    G.AMB.add(e.u, p[0], p[1], { name: e.name, follow: true }).then(n => { if (n) Q.marks.push({ id: q.id + ':esc', q, n, x: -9999, y: -9999, label: e.name, run() {} }); }); }
  /* 守點：倒數＋分波出怪 */
  function holdStart(q, step) { const p = P(step); Q.hold = { q, step, t: (step.sec || 45) * 60, wave: 0, p }; G.UI.banner(step.text, '守住 ' + (step.sec || 45) + ' 秒');
    Q.marks = Q.marks.filter(m => m.id !== q.id + ':hold'); if (HUB.marks) HUB.marks = HUB.marks.filter(m => m.id !== q.id + ':hold'); }
  function holdStep() { const h = Q.hold; if (!h || SC.id !== h.step.map) return; h.t--;
    const per = Math.max(1, Math.floor(((h.step.sec || 45) * 60) / (h.step.waves || 3)));
    if (h.t > 0 && h.t % per === per - 1 && h.wave < (h.step.waves || 3)) { h.wave++; const types = h.step.foes || SC.def.foes || ['akaoni']; Q.load(types); const n = h.step.n || 3, lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 2);
      for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, e = G.spawnOni(h.p[0] + side * (260 + i * 30), h.p[1] + (i % 3 - 1) * 40, 10 + i * 10, lv, types[i % types.length]); if (e) e.qid = h.q.id; }
      G.UI.toast('第 ' + h.wave + ' 波'); }
    if (h.t <= 0) { Q.hold = null; for (const e of G.E) if (e.qid === h.q.id && e.st !== 'dead') e.hp = 0; next(h.q); } }

  /* ---------- 擊殺計數 ---------- */
  const k0 = G.RPG.onKill; G.RPG.onKill = function (e) { k0(e); if (!e || !e.qid) return; const q = Q.by[e.qid], s = st(e.qid), step = q && cur(q);
    if (!step || step.t !== 'kill') return; s.k = (s.k || 0) + 1; G.SAVE.markDirty();
    if (s.k >= (step.n || 3)) next(q); else G.UI.toast(step.text + '　' + s.k + '／' + (step.n || 3)); };

  /* ---------- 導引 ---------- */
  const TR = () => G.RPG.d().track;   // r3.19.1：玩家選擇的追蹤（任務 id／'off'＝關閉指引／空＝自動）
  Q.pinned = function () { const t = TR(); if (t === 'off') return null; if (t && Q.active(t) && Q.by[t]) return Q.by[t]; const c = HUB.cur(); let best = null;
    for (const q of Q.L) { if (!Q.active(q.id)) continue; if (q.main && q.ch === c) return q; if (!best || (q.main && !best.main)) best = q; }
    return best; };
  function stepText(q, step, s) { let t = step.text || (step.t === 'cut' || step.t === 'goto' ? '前往' + nm(step.map) : q.title); if (step.t === 'kill') t += '　' + (s.k || 0) + '／' + (step.n || 3); if (step.t === 'gather') t += '　' + (s.k || 0) + '／' + step.spots.length; return t; }
  let gk = '', gv = null;   // 導引快取：任務／步驟／計數／地圖／標記數不變就不重算（避免每格 BFS）
  Q.guide = function () { const q = Q.pinned(); if (!q) return null; const s = st(q.id), step = q.steps[s.s]; if (!step) return null;
    if (Q.hold && Q.hold.q === q) return { text: (q.main ? '【主線】' : '【支線】') + step.text + '　剩 ' + Math.ceil(Q.hold.t / 60) + ' 秒' };
    const key = q.id + s.s + '|' + s.k + '|' + SC.id + '|' + Q.marks.length + '|' + HUB.marks.length + '|' + (G.NAV ? G.NAV.list.length : 0) + '|' + G.E.length;
    if (key === gk) { if (gv && gv.follow) { const m = gv.follow; if (m.n) { gv.x = m.n.x; gv.y = m.n.y; } } return gv; } gk = key; gv = guide0(q, s, step); return gv; };
  function guide0(q, s, step) {
    const tag = q.main ? '【主線】' : q.boss ? '【委託】' : '【支線】', text = tag + stepText(q, step, s);
    if (step.map === SC.id) { const m = Q.marks.find(k => k.q === q && k.x > -999); if (m) return { text, x: m.n ? m.n.x : m.x, y: m.n ? m.n.y : m.y, label: m.label, follow: m };
      if (step.t === 'kill') { const e = G.E.find(k => k.qid === q.id && k.st !== 'dead'); if (e) return { text, x: e.x, y: e.y, label: '目標' }; }
      return { text }; }
    const to = step.map, here = HUB.chOf(SC.id), there = HUB.chOf(to), where = text.includes(nm(to)) ? '' : '（' + nm(to) + '）';
    if (here && here === there) { const r = HUB.exitTo(to); if (r) { const [x, y] = HUB.portalXY(r.p); return { text: text + where, x, y, label: nm(r.p.to) + (r.steps > 1 ? '（還有 ' + r.steps + ' 張）' : '') }; } }
    if (to === 'Q_field_seal_forest') { const hop = { hub_city: 'hub_shrine', hub_shrine: 'hub_mountain' }[SC.id];
      if (hop) { const p = SC.def.portals.find(k => k.to === hop); if (p) { const [x, y] = HUB.portalXY(p); return { text: text + '（神社後山的封印禁林）', x, y, label: nm(hop) }; } }
      if (SC.id === 'hub_mountain') { const m = HUB.marks.find(k => k.id === 'seal'); if (m) return { text, x: m.x, y: m.y, label: m.label }; } }
    if (SC.id === 'hub_city' && G.D.scenes[to] && G.D.scenes[to].quest) { const m = HUB.marks.find(k => k.id === 'trip:' + to); if (m) return { text: text + '（找渡口時雨）', x: m.x, y: m.y, label: '渡口・時雨（任務地點）' }; }
    if (SC.id === 'hub_city' && to === 'hub_shrine' || SC.id === 'hub_shrine' && to === 'hub_city') { const p = SC.def.portals.find(k => k.to === to); if (p) { const [x, y] = HUB.portalXY(p); return { text: text + where, x, y, label: nm(to) }; } }
    if (SC.id === 'hub_shrine') { const p = SC.def.portals.find(k => k.to === 'hub_city'); if (p) { const [x, y] = HUB.portalXY(p); return { text: text + where, x, y, label: '兩岸城' }; } }
    if (SC.id === 'hub_city') { const f = HUB.marks.find(m => m.id === 'ferry'); if (there && f) return { text: text + where + '：到渡口找時雨', x: f.x, y: f.y, label: '渡口' };
      if (Q.trip && Q.trip[to]) { const m = HUB.marks.find(k => k.id === 'trip:' + to); if (m) return { text: text + '（找渡口時雨）', x: m.x, y: m.y, label: '渡口・時雨（任務地點）' }; } }
    const stone = HUB.stoneHere(SC.id) && G.NAV && G.NAV.list.find(o => o.save); if (stone) return { text: text + where + '：先到祈願石回城', x: stone.x, y: stone.y, label: '祈願石' };
    const bk = HUB.marks.find(m => m.id === 'back'); if (bk) return { text: text + where + '：先返回', x: bk.x, y: bk.y, label: bk.label };
    if (here) { const r = HUB.exitTo(HUB.firstOf(here)); if (r) { const [x, y] = HUB.portalXY(r.p); return { text: text + where + '：回到本章第一站，在祈願石回城', x, y, label: nm(r.p.to) }; } }
    return { text: text + where }; };

  /* ---------- 封印門 ---------- */
  Q.gateNeed = function (c) { const L = Q.L.filter(q => q.main && q.ch === c && !q.postBoss); const left = L.filter(q => !Q.isDone(q.id)); return { all: L.length, left }; };
  const on0 = WD.onEnter; WD.onEnter = function (id) { const d = G.D.scenes[id], c = HUB.chOf(id);
    if (d && d.boss && c && id === HUB.bossOf(c) && !F()['boss_' + id]) { const g = Q.gateNeed(c);
      if (g.all && g.left.length) { const b = d.boss; d.boss = null; try { on0.call(this, id); } finally { d.boss = b; }
        G.SC.lock.east = '封印門還關著'; Q.gate = { id, c }; gateMark(); return; } }
    Q.gate = null; const r = on0.call(this, id); const mod = Q.bossMod[id];
    if (mod && d && d.boss && !F()['boss_' + id]) setTimeout(() => { if (SC.id !== id) return; const m = mod(); if (!m) return;
      for (const e of G.E) if (e.boss && !e._mod) { e._mod = 1; if (m.hp) e.hp = e.hpMax = Math.round(e.hpMax * m.hp); if (m.atk) e.atk = Math.round(e.atk * m.atk); }
      if (m.msg) G.UI.toast(m.msg); }, 2600);
    return r; };
  function gateMark() { const g = Q.gate; if (!g || g.id !== SC.id) return; const d = SC.def, n = (d.nodes || {}).center || d.start, p = SC.snap ? SC.snap(n[0] + 200, n[1], 'open', 160) || n : n;
    const m = { id: 'gate', x: p[0], y: p[1], label: '封印門', kind: 'look', run() { const need = Q.gateNeed(g.c);
      if (need.left.length) G.DLG.start([say('小雪', '（封印的紋路還很亮……）這扇門，現在還打不開。'), say('蒼真', '還缺：' + need.left.map(q => q.title).join('、'))]);
      else G.DLG.start([say('白丸', '紋路暗下去了……裡面的東西，在等我們。'), act(() => { Q.gate = null; HUB.marks = HUB.marks.filter(k => k !== m); delete G.SC.lock.east; on0.call(WD, SC.id); })]); } };
    HUB.marks = HUB.marks.filter(k => k.id !== 'gate').concat([m]); }

  /* ---------- 城內任務傳送點（回訪舊地圖、任務地圖） ---------- */
  Q.trip = {};   // { mapId: { label, need() } }：在兩岸城驛馬所旁出現「前往 ○○」
  const QTXT = { Q_post_seki: '驛馬沿著東海道一路疾行……', Q_road_pine: '驛馬沿著松並木古道前進……', Q_road_willow: '你們沿著河堤往東走……', Q_post_nikko: '驛馬往北，穿過杉林……', Q_road_cedar: '你們走進晨霧中的杉林……', Q_road_rice: '金色的稻浪在風裡起伏……',
    Q_post_hakone: '驛馬往西，石坂越來越陡……', Q_road_moss: '苔石小路在林間蜿蜒……', Q_road_fuji: '翻過峠道，富士就在眼前……', Q_mountain_cedar: '修驗者的山路，越走越深……', Q_mountain_redcliff: '赤色的岩壁下，雲海翻湧……', Q_mountain_valley: '你們走進深山的谷底……',
    Q_coast_supply_camp: '水軍的船駛出河口……', Q_coast_cliff_muster: '船靠上海崖……', Q_reef_naval_base: '船朝著礁島駛去……', Q_gojo_bridge_duel: '月光下，你們走向五條大橋……', Q_night_rice: '入夜。你們走進月下的稻田……', Q_night_susuki: '入夜。芒草在月光下發亮……' };
  function tripMarks() { if (SC.id !== 'hub_city') return; const g = (SC.def.nodes || {}).center || SC.def.start; let i = 0;
    const auto = {}; for (const q of Q.L) { const s = st(q.id); if (!s || s.done) continue; const step = q.steps[s.s], d = step && G.D.scenes[step.map]; if (d && d.quest && step.map !== 'Q_field_seal_forest' && !Q.trip[step.map]) auto[step.map] = { label: '驛馬・' + d.name, text: QTXT[step.map] }; }
    for (const to of Object.keys(Q.trip).concat(Object.keys(auto))) { const t = Q.trip[to] || auto[to]; if (!G.D.scenes[to] || (t.need && !t.need())) continue; const k = i++;
      const go = () => HUB.travel(0, t.text || '渡船載著你們出發……', [], to);   // r3.18.1：任務傳送一律找渡口時雨，地面不再放標記
      HUB.marks.push({ id: 'trip:' + to, hide: 1, trip: go, x: g[0] + 120, y: g[1] + 10, label: t.label || ('驛馬・' + nm(to)), kind: 'talk', run: () => G.DLG.start([say(t.who || '驛馬所', t.ask || ('要去「' + nm(to) + '」嗎？')), { choice: [
        { label: '出發', then: [act(() => HUB.travel(0, t.text || '驛馬沿著街道一路疾行……', [], to))] }, { label: '不了', then: [] }] }]) }); } }

  /* ---------- 接上迴圈 ---------- */
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { en0.call(G.STORY, id); Q.spawned = {}; build(); gateMark(); tripMarks(); };
  const s0 = G.STORY.step; G.STORY.step = function () { for (const m of Q.marks) if (m.n && m.x > -999) { m.x = m.n.x; m.y = m.n.y; } s0.call(G.STORY); holdStep();
    /* r3.52.0：每秒檢查一次——條件剛成立的任務（章節旗標、擊敗頭目、抉擇等在進圖之後才成立）立刻出現，不用換圖 */
    if (G.t % 60 === 0 && !building && !SC.trans && !G.DLG.active() && Q.L.some(q => !st(q.id) && avail(q) && (!q.giver || (q.giver.map === SC.id && (!q.giver.need || q.giver.need()) && !Q.marks.some(m => m.id === q.id + ':giver'))))) build(); };   // 記號／互動點跟著 NPC
  // 任務 NPC 的頭上記號
  const dm0 = G.STORY.drawMarks; G.STORY.drawMarks = function () { dm0.call(G.STORY); const ctx = G.ctx, Z = SC.zoom();
    for (const m of Q.marks) { if (!m.qmark || m.x < -999 || Q.shadowed(m)) continue; const x = m.n ? m.n.x : m.x, y = (m.n ? m.n.y : m.y) - G.HERO_H * 1.45 - Math.sin(G.t * 0.1) * 3;
      ctx.save(); ctx.translate(x, y); ctx.scale(1 / Z, 1 / Z); ctx.fillStyle = m.main ? '#ffd65a' : '#9fe0ff'; ctx.strokeStyle = 'rgba(20,10,6,.9)'; ctx.lineWidth = 3;
      ctx.font = `900 ${22 * G.FS()}px ${G.FONT}`; ctx.textAlign = 'center'; ctx.strokeText(m.qmark === '!' ? '！' : '？', 0, 0); ctx.fillText(m.qmark === '!' ? '！' : '？', 0, 0); ctx.restore(); } };
  /* 同一位置（30px 內）多個任務：主線＞對話目標＞委託；被蓋過的不畫也不選 */
  const pri = m => (m.main ? 4 : 0) + (m.qmark === '?' ? 2 : m.qmark === '!' ? 1 : 0);
  Q.shadowed = m => Q.marks.some(o => o !== m && o.q && o.x > -999 && Math.hypot(o.x - m.x, o.y - m.y) < 30 && (pri(o) > pri(m) || (pri(o) === pri(m) && Q.marks.indexOf(o) < Q.marks.indexOf(m))));
  Q.busy = (x, y) => Q.marks.some(m => m.q && Math.hypot(m.x - x, m.y - y) < 80);
  Q.pri = pri;
  /* 某章主線（含打完頭目後的後日談）是否都結束：已完成，或條件永遠不成立（未開始且 need 不成立）者不擋 */
  Q.mainDone = c => Q.L.filter(q => q.ch === c && q.main).every(q => { const s = st(q.id); return s ? !!s.done : !(!q.need || q.need()); });
  // HUB 的目標：任務優先（劇情腳本自己的目標仍最優先，見 52_hub）
  const g0 = HUB.goal; HUB.goal = function () { if (TR() === 'off') return null; const r = g0(); if (TR() && Q.active(TR())) return Q.guide() || r; if (r && /祈願石|渡口|神社|兩岸城/.test(r.text) && !Q.pinned()) return r; return Q.guide() || r; };

  /* ---------- 選單「任務」頁 ---------- */
  const M = G.MENU; if (M && M.TABS) { if (!M.TABS.includes('任務')) M.TABS.push('任務'); const C = G.C;
    M.PAGE['任務'] = function (x, y, w, h) { const U = M.ui, fs = G.FS(), RH = 22 * fs, d = G.RPG.d(), fold = d.qfold = d.qfold || {}, c = G.ctx;
      const L = Q.L.filter(q => st(q.id)).sort((a, b) => (a.ch || 99) - (b.ch || 99) || (Q.isDone(a.id) - Q.isDone(b.id)) || (b.main - a.main));
      U.box(x, y, w, h); const TH = 30 * fs, ty = y + 8;   // 上方：追蹤模式
      [['自動追蹤', null], ['關閉指引', 'off']].forEach(([n, v], i) => { const bx = x + 12 + i * 100, on = (d.track || null) === v || (v === null && d.track && d.track !== 'off' && !Q.active(d.track));
        c.fillStyle = on ? 'rgba(120,80,30,.55)' : 'rgba(30,22,26,.92)'; G.rr(bx, ty, 92, TH, 4); c.fill(); c.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; G.rr(bx + .5, ty + .5, 91, TH - 1, 4); c.stroke();
        G.txt(n, bx + 46, ty + TH / 2 + 1, 12, on ? C.ink : C.sub, 'center', G.FONT_S, 900); U.hit(bx, ty, 92, TH, () => { d.track = v; G.SAVE.markDirty(); }); });
      G.txt('點任務右側「追蹤」可指定畫面上的指引', x + 220, ty + TH / 2 + 1, 11, C.dim, 'left', G.FONT, 700);
      const groups = []; for (const q of L) { const k = q.ch || 0; let g = groups.find(o => o.k === k); if (!g) groups.push(g = { k, L: [] }); g.L.push(q); }
      let hh = 0; for (const g of groups) { hh += RH * 2.1; if (!fold[g.k]) hh += g.L.length * RH * 2.2; }
      const top = ty + TH + 8, off = U.scrollArea('qst', x, top, w, y + h - top - 6, hh + 20); U.clip(x, top, w, y + h - top - 6); let yy = top + 6 + off;
      if (!L.length) G.txt('目前沒有任務。到兩岸城和神社走走，和大家說說話吧。', x + w / 2, top + 40, 13, C.sub, 'center', G.FONT_S, 700);
      for (const g of groups) { const nOpen = g.L.filter(q => !Q.isDone(q.id)).length, hy = yy;
        c.fillStyle = 'rgba(255,255,255,.05)'; G.rr(x + 8, hy, w - 16, RH * 1.3, 4); c.fill();
        G.txt((fold[g.k] ? '▸ ' : '▾ ') + (g.k ? HUB.chName(g.k) : '其他') + '　進行中 ' + nOpen + '／' + g.L.length, x + 16, hy + RH * 0.65, 13, C.gold, 'left', G.FONT_S, 900);
        U.hit(x + 8, Math.max(hy, top), w - 16, RH * 1.3, () => { fold[g.k] = !fold[g.k]; G.SAVE.markDirty(); }); yy += RH * 2.1; if (fold[g.k]) continue;
        for (const q of g.L) { const s = st(q.id), dn = s.done, step = q.steps[s.s], tr = d.track === q.id;
          G.txt((q.main ? '主線　' : q.boss ? '委託　' : '支線　') + q.title + (dn ? '　（完成）' : ''), x + 22, yy, 13, dn ? C.dim : q.main ? C.gold : C.ink, 'left', G.FONT_S, 900);
          G.txt(dn ? (q.desc || '') : '▶ ' + stepText(q, step, s) + '　｜' + nm(step.map), x + 36, yy + RH, 11, dn ? C.dim : C.sub, 'left', G.FONT_S, 700);
          if (!dn) { const bx = x + w - 84; c.fillStyle = tr ? 'rgba(120,80,30,.6)' : 'rgba(30,22,26,.92)'; G.rr(bx, yy - 10, 70, 24, 4); c.fill(); c.strokeStyle = tr ? C.gold : 'rgba(227,194,122,.3)'; G.rr(bx + .5, yy - 9.5, 69, 23, 4); c.stroke();
            G.txt(tr ? '追蹤中' : '追蹤', bx + 35, yy + 2, 11, tr ? C.ink : C.sub, 'center', G.FONT_S, 900); U.hit(bx, Math.max(yy - 10, top), 70, 24, () => { d.track = tr ? null : q.id; G.SAVE.markDirty(); }); }
          yy += RH * 2.2; } }
      c.restore(); };
    const ctx = () => G.ctx; }
})();
