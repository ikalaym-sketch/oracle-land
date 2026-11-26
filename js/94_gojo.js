/* ==========================================================================
 * 神諭之地 重製版 — 94_gojo.js
 * Version : r3.86.0  (2026-11-25)　r3.86.0：弁慶、牛若丸改站兩岸城朱橋上（原本在中央廣場兩側）；五條月夜離開兩岸城再回來／讀檔後，牛若丸會補回橋上（原本只在事件開始那一刻放一次）
 * 舊版    : r3.54.0  (2026-11-23)
 * 變更    : r3.54.0 新增。第 7 章大型支線「五條大橋」重做＋單挑模式＋弁慶再戰＋世界事件「五條月夜」。
 *           ・c7_s_benkei 改 5 段：守橋開場 → 擊敗武藏坊弁慶（b_mb_benkei 真圖集，橫掃／踏震／架勢）→ 牛若丸登場
 *             → 月下決鬥（單挑：夥伴退場、只剩主角；敵＝b_yoshitsune 招式組）→ 收尾（弁慶成為家臣、開放再戰）。
 *           ・c12_s_yoshitsune 第 1 段改成單挑。
 *           ・新步驟型別 duel：{ t:'duel', boss, name, sub, solo, pre:[台詞], lvUp }；地圖上出現「迎戰」標記，對話完開打；
 *             單挑中倒下＝敗北，標記重新出現可再挑戰。
 *           ・再戰：c7_s_benkei 完成後，兩岸城橋上的弁慶可選「已擊敗的章節／副本頭目」在五條大橋再戰（普通／困難／地獄）。
 *           ・世界事件 gojo（第 7 章起、完成五條大橋）：牛若丸在兩岸城等你月下比劍，勝利得妖玉＋高品質裝備。
 * 存檔    : flags.ushiwaka（舊）、flags.gojoDone、flags.gojoWins。
 * 依賴    : 26_boss（B.start／reg）、45_boss_mini（B.MINI）、41_boss_yoshitsune、53_quest（Q.L／STAT／next）、52_hub（travel、marks）、
 *           49_party（slots／sync）、22_event（EV.WEV／world）、07_rpg（roll／addItem／gainExp）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS, Q = G.QST, HUB = G.HUB, SC = G.SC, H = G.H, F = () => G.SAVE.data.flags; if (!B || !Q || !HUB || !B.MINI) return;
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn }), MAP = 'Q_gojo_bridge_duel', M = B.MINI, S = B.api.S;
  /* ---------- 1. 弁慶單體頭目 ---------- */
  B.reg('gojo_benkei', { name: '武藏坊弁慶', sub: '五條大橋', unit: 'b_mb_benkei', hpK: 7, atkK: 1.4, nat: 1, dir: 'right3q', map: [],
    actors: [{ id: 'benkei', name: '武藏坊弁慶', size: M.DEF.benkei.size * 1.1, unit: 'b_mb_benkei', moves: [] }], mv: M.MV, director: M.director, underBody: M.underBody, drawOver: M.drawOver,
    idle: e => M.idle(e), init(enc) { enc.v = { mshots: [], t: 0 }; enc.units.forEach(e => { e.md = M.DEF[e.actor]; e.mcd = S(1.0); e.mgc = 0; }); },
    finish(enc) { enc.v.mshots = []; enc.v.bindT = 0; }, preDamage: e => M.preGuard(e), onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
  /* 對話立繪（任務 NPC 用 STAT 的頭目圖） */
  Object.assign(Q.STAT, { '弁慶': ['b_mb_benkei', 1.3, 'benkei_idle_right3q'], '武藏坊弁慶': ['b_mb_benkei', 1.3, 'benkei_idle_right3q'], '牛若丸': ['b_yoshitsune', 1.0, 'yoshitsune_p1_idle_right3q'] });
  /* ---------- 2. 單挑／頭目戰共用 ---------- */
  const DU = G.DUEL = { on: null };
  const PY = G.PARTY;
  if (PY && PY.slots) { const sl0 = PY.slots; PY.slots = function () { return DU.on && DU.on.solo ? [null, null] : sl0.apply(this, arguments); }; }
  function fight(o) {   // o: { boss, name, sub, solo, lv, onWin, onLose }
    if (B.enc && !B.enc.done) return; const D = B.DEF[o.boss]; if (!D) return G.UI.toast('頭目資料缺少：' + o.boss);
    G.UI.toast('……'); B.load(o.boss).then(() => { if (SC.id !== o.map) return; const c = SC.def.nodes && SC.def.nodes.center || [H.x + 200, H.y];
      if (o.solo && PY) { DU.on = o; PY.sync(); }
      DU.on = o; o.downs0 = F().downs || 0;
      const enc = B.start(o.boss, { x: c[0] + 220, y: c[1], lv: o.lv, sub: o.sub, onWin: () => { end(); o.onWin && o.onWin(); } });
      if (!enc) { end(); return; } if (o.solo && enc.v) enc.v.summoned = 1;   // 單挑：義經不召喚四天王
      if (o.hpK) for (const u of enc.units) { u.hp = u.hpMax = Math.round(u.hpMax * o.hpK); }
      if (o.name) { enc.name = o.name; for (const u of enc.units) if (enc.units.length === 1) u.name = o.name; }
      G.UI.banner(o.solo ? '單挑　' + (o.name || D.name) : (o.name || D.name), o.sub || ''); }, e => { console.warn('duel', e); G.UI.toast('頭目載入失敗'); }); }
  function end() { const o = DU.on; DU.on = null; if (o && o.solo && PY) PY.sync(); }
  function lose() { const o = DU.on, enc = B.enc; if (!o || !enc) return; enc.done = true; G.E = G.E.filter(e => !enc.units.includes(e)); B.enc = null; if (B.fx) B.fx.length = 0; end();
    H.hp = H.hpMax; G.UI.banner('敗北……', o.solo ? '調整好再來挑戰' : '再來一次'); o.onLose && o.onLose(); }
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); const o = DU.on; if (!o) return;
    if (SC.id !== o.map) { end(); return; }
    if ((F().downs || 0) > o.downs0) lose(); };
  /* ---------- 3. 任務：duel 步驟 ---------- */
  const st = id => (G.SAVE.data.qs || {})[id];
  function duelMarks() { if (!HUB.marks) return; HUB.marks = HUB.marks.filter(m => !m.duel || (m.duel.map === SC.id && !DU.on && !(B.enc && !B.enc.done) && Q.active(m.q.id) && m.q.steps[st(m.q.id).s] === m.duel));
    if (DU.on || (B.enc && !B.enc.done)) return;
    for (const q of Q.L) { const s = st(q.id); if (!s || s.done) continue; const step = q.steps[s.s]; if (!step || step.t !== 'duel' || step.map !== SC.id) continue; if (HUB.marks.some(m => m.id === 'duel:' + q.id)) continue;
      const c = SC.def.nodes && SC.def.nodes.center || [H.x, H.y], p = (SC.snap && SC.snap(c[0] + 120, c[1], 'open', 200)) || [c[0] + 120, c[1]];
      HUB.marks.push({ id: 'duel:' + q.id, q, duel: step, x: p[0], y: p[1], label: (step.solo ? '單挑・' : '迎戰・') + step.name, kind: 'look', main: !!q.main,
        run: () => G.DLG.start((step.pre || []).concat([{ choice: [{ label: step.solo ? '接受單挑' : '迎戰', then: [act(() => fight({ boss: step.boss, name: step.name, sub: step.sub, solo: step.solo, map: step.map, hpK: step.hpK,
          lv: Math.max(SC.def.lv || 1, G.RPG.d().lv) + (step.lvUp || 1), onWin: () => G.STORY.later(60, () => Q.next(q.id)) }))] }, { label: '再準備一下', then: [] }] }])) }); } }
  /* 指引：duel 步驟指向標記 */
  const gd0 = Q.guide.bind(Q); Q.guide = function () { const g = gd0(); const q = Q.pinned(), s = q && st(q.id), step = s && q.steps[s.s];
    if (step && step.t === 'duel' && step.map === SC.id) { const m = HUB.marks.find(k => k.id === 'duel:' + q.id); if (m) return { text: '【' + q.title + '】' + step.text, x: m.x, y: m.y, label: m.label }; }
    return g; };
  /* ---------- 4. 任務改寫 ---------- */
  const qb = Q.by.c7_s_benkei;
  if (qb) { qb.desc = '五條大橋上，有個巨漢僧兵每晚攔路搶刀。';
    qb.steps = [
      { t: 'cut', map: MAP, lines: [say('', '（月光鋪在五條大橋上。橋中央，一個比門還高的僧兵拄著長刀站著，背上插滿了刀。）'),
        say('弁慶', '來者止步！我乃武藏坊弁慶。這座橋，九百九十九把刀已經過了。'), say('弁慶', '把你的刀留下——它會是第一千把。'), say('蒼真', '刀是用來守人的，不是拿來給你收藏的。'), say('弁慶', '好！那就用刀說話！')] },
      { t: 'duel', map: MAP, boss: 'gojo_benkei', name: '武藏坊弁慶', sub: '五條大橋・守橋', text: '在橋上擊敗弁慶', lvUp: 1,
        pre: [say('弁慶', '這一千把刀的心願，就賭在你身上了！')] },
      { t: 'cut', map: MAP, lines: [say('弁慶', '……我、我輸了？'), say('', '（笛聲。一個少年從橋欄上輕輕落下，木屐踩在欄杆上，竟沒有一點聲音。）'),
        say('牛若丸', '哈哈！弁慶，你也有今天！'), say('弁慶', '你、你是剛才在欄杆上吹笛的小鬼……'), say('牛若丸', '我是牛若丸。'), say('牛若丸', '神社的劍士，你的劍很直。……直到讓人想試試看。'),
        say('牛若丸', '跟我比一場。只有你和我——不准幫手。'), say('蒼真', '（夥伴們互看一眼，退到了橋頭。）')] },
      { t: 'duel', map: MAP, boss: 'yoshitsune', name: '牛若丸', sub: '月下五條大橋・單挑', text: '月下決鬥：和牛若丸單挑', solo: 1, lvUp: 2, hpK: 0.55,
        pre: [say('牛若丸', '月亮正好。'), say('牛若丸', '來吧——看你接不接得住！')] },
      { t: 'cut', map: MAP, lines: [say('牛若丸', '……呼。好久沒有輸得這麼痛快了。'), say('弁慶', '少主！'), say('牛若丸', '少主？……你剛才叫我什麼？'),
        say('弁慶', '能贏過我的人，弁慶就跟定了。從今天起，我是你的家臣！'), say('牛若丸', '那剛好。這位劍士，我還想再比——弁慶，以後幫我在橋頭顧著。'),
        say('弁慶', '遵命！……劍士，以後想找誰再打一場，就到兩岸城的橋上找我。'), act(() => { F().ushiwaka = 1; F().gojoDone = 1; G.SAVE.markDirty(); })] }];
    const d0 = qb.done; qb.done = function () { if (d0) d0.apply(this, arguments); F().ushiwaka = 1; F().gojoDone = 1; G.STORY.later(200, () => G.UI.banner('五條大橋', '兩岸城橋上的弁慶：可再戰已擊敗的頭目')); }; }
  const qy = Q.by.c12_s_yoshitsune;
  if (qy && qy.steps[0]) { qy.steps[0] = { t: 'duel', map: MAP, boss: 'yoshitsune', name: '源義經', sub: '決戰前的比劍・單挑', text: '和義經單挑', solo: 1, lvUp: 3,
      pre: [say('牛若丸', '——不，今天就用這個名字吧。源九郎義經。'), say('牛若丸', '這次我不會留手。')] };
    if (qy.steps[1]) delete qy.steps[1].u; }
  /* ---------- 5. 兩岸城橋上的弁慶：再戰 ---------- */
  const TIER = [['普通', 0, 1], ['困難', 6, 1.6], ['地獄', 14, 2.6]];
  function beaten() { const out = [], seen = {}; for (const m in B.MAP) { const id = B.MAP[m], D = B.DEF[id]; if (!D || seen[id] || id === 'gojo_benkei') continue; const ch = HUB.chOf && HUB.chOf(m); if (F()['boss_' + m] || (ch && F()['clear' + ch])) { seen[id] = 1; out.push([id, D.name, D.dungeon || /^D_/.test(m) ? '副本' : '章節']); } }
    if (F().gojoDone && !seen.yoshitsune) out.push(['yoshitsune', '牛若丸（單挑）', '五條', 1]); return out; }
  function reward(lv, k, name) { const R = G.RPG, d = R.d(); R.gainExp(Math.round((10 + lv * 6) * 12 * k)); d.gold += Math.round((40 + lv * 9) * 6 * k); d.yg = (d.yg || 0) + Math.round(2 * k);
    let it = null; for (let i = 0; i < 160; i++) { it = R.roll(lv, SC.def.region || 'wind'); if (it.q >= (k >= 2.5 ? 4 : 3)) break; } if (it.q < 3) it.q = 3; R.addItem(it); G.SAVE.markDirty();
    F().gojoWins = (F().gojoWins || 0) + 1; G.UI.banner('再戰勝利　' + name, '錢・妖玉 +' + Math.round(2 * k) + '・' + R.QUAL[it.q].n + '裝備'); }
  function rematch() { const L = beaten(); if (!L.length) return G.DLG.start([say('弁慶', '你還沒打倒過什麼像樣的對手吧？打倒了再來找我。')]);
    const page = (i) => { const P = L.slice(i, i + 5).map(([id, n, tag, solo]) => ({ label: '【' + tag + '】' + n, then: [act(() => G.STORY.later(2, () => G.DLG.start([say('弁慶', '要打到什麼程度？'), { choice: TIER.map(([tn, up, k]) => ({ label: tn + (up ? '（敵 Lv+' + up + '、獎勵 ×' + k + '）' : ''), then: [act(() => go(id, n, up, k, solo))] })).concat([{ label: '算了', then: [] }]) }])))] }));
      if (L.length > i + 5) P.push({ label: '下一頁…', then: [act(() => G.STORY.later(2, () => G.DLG.start([{ choice: page(i + 5) }])))] }); return P.concat([{ label: '不了', then: [] }]); };
    G.DLG.start([say('弁慶', '想跟誰再打一場？我在橋上替你擺好陣勢。'), { choice: page(0) }]); }
  function go(id, name, up, k, solo) { DU.pend = { id, name, up, k, solo }; G.SAVE.data.qret = SC.id; HUB.travel(0, '弁慶領著你們走上月下的五條大橋……', [], MAP); }
  /* 進五條大橋：再戰／世界事件決鬥開打 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); end();
    if (id === MAP && DU.pend) { const p = DU.pend; DU.pend = null; G.STORY.later(70, () => { if (SC.id !== MAP) return; const lv = G.RPG.d().lv + p.up;
        fight({ boss: p.id, name: p.name, sub: p.ev ? '五條月夜' : '五條大橋・再戰', solo: p.solo, map: MAP, lv, hpK: p.id === 'yoshitsune' ? 0.7 : 1, onWin: () => { reward(lv, p.k, p.name); if (p.ev) { const w = G.EV && G.EV.world(); if (w && w.k === 'gojo') { w.done = 1; G.SAVE.markDirty(); } } } }); }); }
    if (id === 'hub_city') G.STORY.later(40, place); };
  /* 弁慶站在兩岸城橋上 */
  let BU = null, npc = null;
  const BRIDGE = [1370, 622];   // r3.86.0：兩岸城東側主道上的朱橋（原本放在中央廣場西側，不在橋上）
  const onBridge = dx => { const x = BRIDGE[0] + dx, y = BRIDGE[1], q = SC.snap && SC.snap(x, y, 'open', 60); return q && Math.hypot(q[0] - x, q[1] - y) < 40 ? q : [x, y]; };
  function place() { if (SC.id !== 'hub_city' || !F().gojoDone) return; const p = onBridge(-90);
    G.ANIM.load('b_mb_benkei').then(u => { if (SC.id !== 'hub_city') return; BU = u; G.NPC = G.NPC.filter(n => n.gojo !== 'b'); npc = { anim: 1, gojo: 'b', u, clip: u.act.benkei_idle_right3q, hk: 1.3, x: p[0], y: p[1], face: 1, name: '弁慶' }; G.NPC.push(npc);
      HUB.marks = HUB.marks.filter(m => m.id !== 'gojo'); HUB.marks.push({ id: 'gojo', x: p[0], y: p[1], label: '弁慶・橋上再戰', kind: 'look', main: false, run: rematch }); }, () => 0); }
  let tk = 0; const ls1 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls1(); if (++tk % 30) return; duelMarks();
    if (SC.id === 'hub_city' && F().gojoDone && HUB.marks && !HUB.marks.some(m => m.id === 'gojo') && G.ANIM.get('b_mb_benkei')) place();
    if (SC.id === 'hub_city' && HUB.marks && !HUB.marks.some(m => m.id === 'gojo_ev')) { const w = G.EV && G.EV.world && G.EV.world(); if (w && w.k === 'gojo' && !w.done && w.map === 'hub_city' && F().gojoDone) yoshi(); } };   // r3.86.0：離開再回來／讀檔後牛若丸補回橋上
  /* ---------- 6. 世界事件：五條月夜 ---------- */
  (function wait() { const EV = G.EV; if (!EV || !EV.WEV) return setTimeout(wait, 50);
    EV.WEV.gojo = { n: '五條月夜', map: 'hub_city', p: 7, need: () => !!F().gojoDone, d: () => '牛若丸在兩岸城的橋上等你月下比劍',
      start(c) { c.quiet = 1; c.obj = () => '五條月夜：到兩岸城橋上找牛若丸'; yoshi(c); } }; })();
  /* 牛若丸站上朱橋（事件開始時，或回到兩岸城時事件還沒完成） */
  let yLoad = 0;
  function yoshi(c) { if (yLoad) return; yLoad = 1;
        G.ANIM.load('b_yoshitsune').then(u => { yLoad = 0; const w = G.EV.world(); if (SC.id !== 'hub_city' || (c && c.done) || !w || w.k !== 'gojo' || w.done) return; const p = onBridge(70);
          G.NPC = G.NPC.filter(n => n.gojo !== 'y'); HUB.marks = HUB.marks.filter(m => m.id !== 'gojo_ev');
          G.NPC.push({ anim: 1, gojo: 'y', u, clip: u.act.yoshitsune_p1_idle_right3q, hk: 1.0, x: p[0], y: p[1], face: -1, name: '牛若丸' });
          HUB.marks.push({ id: 'gojo_ev', x: p[0], y: p[1], label: '牛若丸・月下比劍', kind: 'look', main: true, run: () => G.DLG.start([say('牛若丸', '今晚的月亮，適合比劍。'), say('牛若丸', '到五條大橋來——一對一。'),
            { choice: [{ label: '應戰（單挑）', then: [act(() => { const cc = c || (G.EV.cur && G.EV.cur.n === '五條月夜' ? G.EV.cur : null); if (cc) cc.done = true; DU.pend = { id: 'yoshitsune', name: '牛若丸', up: 4, k: 2, solo: 1, ev: 1 }; G.SAVE.data.qret = 'hub_city'; HUB.travel(0, '你們跟著笛聲走上五條大橋……', [], MAP); })] }, { label: '晚點再說', then: [] }] }]) }); }, () => { yLoad = 0; }); }
})();
