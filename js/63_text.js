/* ==========================================================================
 * 神諭之地 重製版 — 63_text.js
 * Version : r3.56.0  (2026-11-24)　r3.56.0：封印檢查改成找封印石旁的小雪說話、對話時鏡頭移到封印石　r3.53.0：章末封印檢查改在後山封印石前觸發（回神社只提示、加指引）　r3.27.7：party 條件改為「在出戰位上」；還沒加入的角色才看畫面上有沒有同名 NPC（劇情登場）　r3.27.6：條件新增 joined／notjoined（夥伴已／未加入）、ending（true／storm／nameless）；原台詞函式先執行（結局計算與旗標寫入在前）再挑新台詞　r3.27.4：條件新增 gte／lt（數值：xue 小雪好感、bond 人妖羈絆）　r3.27.2：條件新增 notchoice、done、notdone　r3.27.0：保留原台詞裡的指令（夥伴加入等）　r3.26.1：選項結果台詞忽略自身抉擇條件；記錄未套用的 slot
 * 變更    : r3.26.0 新增。對話擴寫匯入（a/text/chNN.json，格式見交接包 00 說明）。
 *           ・任務 slot（qid:giver／:sN／:sN:optM／:sN:spotM／:after、doma:qid）→ 開機時直接換掉任務資料的台詞（函式，播放當下才判斷條件）。
 *           ・寫死在流程裡的台詞（06_story_ch1／52_hub／11_npclife）→ 對話開始時，以「第一句原文」比對，整段連續台詞換掉；選項與動作保留。
 *           ・新空位：xue_end（章末回神社自動播放一次）、xue_idle（小雪「閒聊」依目前章節輪播）、
 *             town_npc（兩岸城具名 NPC 單句輪播）、party_talk（夥伴閒聊泡泡，依章節加入）。
 *           ・條件 cond：party（夥伴在隊上，或同名角色就在畫面上）、choice、flag、noflag；全部成立才出現。
 * 依賴    : 05_dialog、53_quest、52_hub、10_banter、20_npc、62_doma。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, T = G.TEXT = { slots: {}, keys: {}, loaded: [] }, F = () => G.SAVE.data.flags;
  const PN = { shiro: '白丸', hayate: '颯', kuzuha: '葛葉', ibaraki: '茨木童子', shion: '汐音', yorimitsu: '源賴光', takemikazuchi: '建御雷', enno: '役小角' };
  const joined = id => id === 'shiro' ? !!F().shiroJoin : !!F()['join_' + id];
  const inParty = id => { const on = (G.PARTY && G.PARTY.slots ? G.PARTY.slots() : []).filter(Boolean); if (on.includes(id)) return true; if (joined(id)) return false;   /* r3.27.7：已加入但沒帶出門 → 不說話 */
    return G.NPC.some(n => n.name === PN[id]) || (id === 'shiro' && G.SC.id === 'hub_shrine'); };   /* 還沒加入：劇情 NPC 在場才說 */
  function ok(c) { if (!c) return true;
    if (c.party && !inParty(c.party)) return false;
    if (c.flag && !F()[c.flag]) return false; if (c.noflag && F()[c.noflag]) return false;
    if (c.choice) for (const k in c.choice) if ((Q.choice ? Q.choice(k) : null) !== c.choice[k]) return false;
    if (c.notchoice) for (const k in c.notchoice) if ((Q.choice ? Q.choice(k) : null) === c.notchoice[k]) return false;   /* r3.27.2：抉擇不是某值 */
    if (c.done && !Q.isDone(c.done)) return false; if (c.notdone && Q.isDone(c.notdone)) return false;   /* r3.27.2：任務完成／未完成 */
    if (c.joined && !F()['join_' + c.joined]) return false; if (c.notjoined && F()['join_' + c.notjoined]) return false;   /* r3.27.6 */
    if (c.ending && F().ending !== c.ending) return false;   /* r3.27.6：結局 */
    if (c.gte) for (const k in c.gte) if (!((Q[k] ? Q[k]() : 0) >= c.gte[k])) return false;   /* r3.27.4：數值 ≥ */
    if (c.lt) for (const k in c.lt) if (!((Q[k] ? Q[k]() : 0) < c.lt[k])) return false;   /* r3.27.4：數值 < */
    return true; }
  const pick = L => L.filter(l => ok(l.cond)).map(l => ({ who: l.who || '', text: l.text }));
  T.ok = ok; T.pick = pick;
  /* ---------- 任務 slot 套用 ---------- */
  /* r3.27.0：保留原本台詞裡的指令（加入夥伴、設定旗標等），接在新台詞後面 */
  const keepDo = o => { const v = typeof o === 'function' ? o() : o; return (v || []).filter(e => e && e.do); };
  function applyQuest(slot, L) { const p = slot.split(':'); let fn;
    if (p[0] === 'doma') { const q = Q.by[p[1]]; const st = q && q.steps.find(s => s.slot === slot); if (st) { const o0 = st.lines; st.lines = () => { const k = keepDo(o0); return pick(L).concat(k); }; return true; } return false; }
    const q = Q.by[p[0]]; if (!q) return false;
    if (p[1] === 'giver' && q.giver) { const o0 = q.giver.lines; q.giver.lines = () => { const k = keepDo(o0); return pick(L).concat(k); }; return true; }
    if (p[1] === 'after' && q.after2) { const o0 = q.after2.lines; q.after2.lines = () => { const k = keepDo(o0); return pick(L).concat(k); }; return true; }
    const m = /^s(\d+)$/.exec(p[1] || ''), st = m && q.steps[+m[1]]; if (!st) return false;
    if (!p[2]) { const o0 = st.lines; st.lines = () => { const k = keepDo(o0); return pick(L).concat(k); }; return true; }
    const o = /^opt(\d+)$/.exec(p[2]), sp = /^spot(\d+)$/.exec(p[2]);
    if (o && st.opts && st.opts[+o[1]]) { const k = st.key, v = st.opts[+o[1]].v;   /* 選項結果：抉擇值在台詞播完才寫入，所以本身這個抉擇的條件視為成立 */
      const L2 = L.map(l => { const c = l.cond && l.cond.choice; if (!c || !(k in c)) return l; if (c[k] !== v) return null; const cc = Object.assign({}, l.cond, { choice: Object.assign({}, c) }); delete cc.choice[k]; if (!Object.keys(cc.choice).length) delete cc.choice; return Object.assign({}, l, { cond: cc }); }).filter(Boolean);
      const o0 = st.opts[+o[1]].lines; st.opts[+o[1]].lines = () => { const k = keepDo(o0); return pick(L2).concat(k); }; return true; }
    if (sp && st.spots && st.spots[+sp[1]]) { const o0 = st.spots[+sp[1]].lines; st.spots[+sp[1]].lines = () => { const k = keepDo(o0); return pick(L).concat(k); }; return true; }
    return false; }
  function load(d) { let a = 0, k = 0; T.miss = T.miss || []; for (const s of d.slots || []) { if (!s || !s.slot || !Array.isArray(s.lines) || !s.lines.length) continue; T.slots[s.slot] = s;
      if (/^(c\d+_|doma:)/.test(s.slot)) { if (applyQuest(s.slot, s.lines)) a++; else T.miss.push(s.slot); }
      else if (/^(06_|52_|11_)/.test(s.slot) && s.key) { T.keys[s.key] = s.lines; k++; } }
    T.loaded.push(d.ch); return a + '/' + k; }
  /* ---------- 寫死台詞：第一句比對、整段替換 ---------- */
  const xueKey = '告示這邊我會顧著。你只管把小太帶回來。';
  let idleI = 0;
  function idleSeg() { const s = T.slots['xue_idle:ch' + String(Math.min(12, G.HUB.cur())).padStart(2, '0')]; if (!s) return null; const L = pick(s.lines), segs = [];
    for (const l of L) { const cur = segs[segs.length - 1]; if (!cur || (l.who === '小雪' && cur.length >= 2) || cur.length >= 4) segs.push([l]); else cur.push(l); }
    return segs.length ? segs[idleI++ % segs.length] : null; }
  function rewrite(list) { const out = []; let i = 0;
    while (i < list.length) { const e = list[i];
      if (e && e.text && !e.choice && !e.do) { const rep = e.text === xueKey ? idleSeg() : null, L = rep || (T.keys[e.text] ? pick(T.keys[e.text]) : null);
        if (L) { (T.hits = T.hits || {})[e.text] = 1; let j = i; while (j < list.length && list[j] && list[j].text && !list[j].choice && !list[j].do) j++; out.push(...L); i = j; continue; } }
      if (e && e.choice) out.push(Object.assign({}, e, { choice: e.choice.map(c => c.then ? Object.assign({}, c, { then: rewrite(c.then) }) : c) })); else out.push(e);
      i++; }
    return out; }
  /* ---------- 城鎮 NPC 單句輪播 ---------- */
  const tnI = {};
  function townLine(name) { const s = T.slots['town_npc:ch' + String(Math.min(12, G.HUB.cur())).padStart(2, '0')]; if (!s) return null; const L = pick(s.lines).filter(l => l.who === name); if (!L.length) return null;
    tnI[name] = (tnI[name] || 0) + 1; return [L[tnI[name] % L.length]]; }
  const st0 = G.DLG.start.bind(G.DLG);
  G.DLG.start = function (list, done) { try { if (Array.isArray(list) && (Object.keys(T.keys).length || T.slots)) {
        const nr = G.UI.near && G.UI.near.amb; if (nr && G.SC.id === 'hub_city' && !list.some(e => e && e.choice)) { const t = townLine(nr.name); if (t) list = t; }
        else list = rewrite(list); } } catch (e) { console.warn('text', e); }
    return st0(list, done); };
  /* ---------- 章末封印檢查（r3.53.0：改在後山封印石前觸發；回神社只提示） ---------- */
  const busyQ = map => { const qs = G.SAVE.data.qs || {}; return Q.L.some(q => { const s = qs[q.id]; return s && !s.done && q.steps[s.s] && q.steps[s.s].map === map; }); };
  const xePend = () => { for (let c = 1; c <= 12; c++) { const s = T.slots['xue_end:ch' + String(c).padStart(2, '0')];
      if (s && G.HUB.done(c) && !F()['xe_' + c] && Q.L.filter(q => q.ch === c && q.main).every(q => Q.isDone(q.id))) return { c, s }; } return null; };
  const xeStand = () => { const n = G.SC.def && G.SC.def.nodes; return n && n.stone_stand; };
  /* r3.56.0：後山封印石旁固定站一個小雪（不靠跟隨），找她說話才開始；對話時鏡頭移到封印石 */
  let xeN = null;
  const xeSpot = () => { const n = xeStand(); if (!n) return null; return (G.SC.snap && G.SC.snap(n[0] - 110, n[1] - 30, 'open', 120)) || [n[0] - 110, n[1] - 30]; };
  function xePlace() { if (G.SC.id !== 'hub_mountain' || !xePend() || busyQ('hub_mountain')) return; const p = xeSpot(); if (!p) return;
    if (!xeN || !G.NPC.includes(xeN)) { xeN = { npc: 'xue', xe: 1, name: '小雪', x: p[0], y: p[1], face: 1, keep: 1 }; G.NPC.push(xeN); }
    if (!G.HUB.marks.some(m => m.id === 'xue_end')) G.HUB.marks.push({ id: 'xue_end', n: xeN, x: xeN.x, y: xeN.y, label: '小雪・封印檢查', kind: 'talk', main: true, run: xeRun }); }
  function xeRun() { const p = xePend(); if (!p || G.DLG.list) return; F()['xe_' + p.c] = 1; G.SAVE.markDirty(); const X = G.XUE, sn = xeStand();
    if (sn) G.CAMLOOK = { x: sn[0], y: sn[1] - 160 }; if (xeN) { G.H.x = xeN.x + 90; G.H.y = xeN.y + 6; G.H.face = -1; }   // 主角站到小雪旁
    if (xeN) xeN.face = 1; if (X && X.act) { X.act('lantern', 2.5); G.STORY.later(150, () => X.act('cast', 8)); }
    G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'xue_end'); G.UI.banner('封印石', '裂痕又變深了……');
    G.STORY.later(140, () => { if (xeN) G.CAMLOOK = { x: xeN.x + 45, y: xeN.y - 40 };   // 先看封印石 2.3 秒，再拉回兩人開始對話
    G.DLG.start(pick(p.s.lines), () => { G.CAMLOOK = null; if (X) X.pose = null; G.STORY.later(120, () => { if (xeN) { G.NPC = G.NPC.filter(n => n !== xeN); xeN = null; } }); }); }); }
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { en0(id); G.CAMLOOK = null; xeN = null; if (id !== 'hub_shrine' && id !== 'hub_mountain') return;
    G.STORY.later(80, () => { if (G.SC.id !== id || !xePend()) return;
      if (id === 'hub_shrine') { if (!busyQ('hub_shrine')) G.UI.banner('封印檢查', '小雪在後山的封印石前等你'); return; } xePlace(); }); };
  const sp0 = G.STORY.step.bind(G.STORY); let xeT = 0;
  G.STORY.step = function () { sp0(); if (G.SC.id === 'hub_mountain' && ++xeT % 30 === 0 && !G.DLG.list) xePlace(); };
  /* 鏡頭看向指定點（封印石） */
  const ct0 = G.SC.camTarget.bind(G.SC); G.SC.camTarget = function () { const L = G.CAMLOOK, d = this.def; if (!L || !d) return ct0(); const { vw, vh } = this.view();
    return { x: Math.max(vw / 2, Math.min(d.w - vw / 2, L.x)), y: Math.max(vh / 2, Math.min(d.h - vh / 2, L.y)) }; };
  const gd0 = Q.guide.bind(Q); Q.guide = function () { const g = gd0(); if (g && g.text) return g; if (!xePend()) return g;   // 主線做完、還沒封印檢查：指引去後山
    const n = G.SC.id === 'hub_mountain' && xeN; return n ? { text: '封印檢查：和封印石前的小雪說話', x: n.x, y: n.y, label: '小雪' } : { text: '封印檢查：回神社後山，和小雪一起看封印石' }; };
  /* ---------- 夥伴閒聊泡泡 ---------- */
  let bch = 0; const base = {};
  function banterSync() { const c = Math.min(12, G.HUB.cur()), B = G.BANTER; if (!B || !B.LINES || c === bch) return; bch = c;
    for (const id in PN) { const Ls = B.LINES[id]; if (!Ls) continue; if (!base[id]) base[id] = (Ls.idle || []).slice(); const extra = [];
      for (let k = 1; k <= c; k++) { const s = T.slots['party_talk:' + id + ':ch' + String(k).padStart(2, '0')]; if (s) for (const l of s.lines) if (l.who === PN[id] && l.text.length <= 30) extra.push(l.text); }
      Ls.idle = base[id].concat(extra.slice(-24)); } }
  const be0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { be0(id); try { banterSync(); } catch (e) {} };
  /* ---------- 開機載入 ---------- */
  const boot0 = G.ASSET.boot.bind(G.ASSET);
  G.ASSET.boot = () => boot0().then(r => fetch('a/text/index.json?v=' + G.VER).then(x => x.ok ? x.json() : []).catch(() => [])
    .then(list => Promise.all(list.map(f => fetch('a/text/' + f + '?v=' + G.VER).then(x => x.ok ? x.json() : null).catch(() => null))))
    .then(ds => { for (const d of ds) if (d) T.report = (T.report || []).concat(load(d)); return r; }));
})();
