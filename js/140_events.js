/* ==========================================================================
 * 神諭之地 重製版 — 140_events.js
 * Version : r3.127.2  (2026-11-27)　r3.127.2：救援事件：4 名士兵各自生成（原本同名被合併成 1 個）；士兵圍住精英跟著移動、輪流攻擊（每次精英最大血量 1%）
 * 舊版    : r3.113.0  (2026-11-26)
 * 變更    : r3.113.0 新增。世界事件改版＋2 種新世界事件。
 *           1. 世界事件分類型：防衛（妖怪入侵）／剿滅（山賊據點、浪人團、道摩軍）／討伐（討伐委託）／救援（士兵討伐精英）／奪還（道摩抓捕妖怪）。
 *              輪替時避開上一次的類型（同類型不連續），再從該類型隨機挑；每輪 10 分鐘（原 20 分）。
 *           2. 點畫面右上的世界事件提醒＝直接傳送到該地圖，到了就開始（頭目戰中、已完成時不傳送）。
 *           3. 救援・士兵討伐精英：4 名士兵圍攻 1 隻強化精英（等級 +3、血 ×5）。精英活著時士兵每秒輪流受傷，倒下就退場；
 *              打倒精英＝依存活士兵數給獎勵；士兵全滅＝精英帶傷逃走（失敗）。開始／結束都有對話。
 *           4. 奪還・道摩抓捕妖怪：道摩兵押著被綁的小妖，150 秒內擊退 2 波（第 2 波有道摩術士精英）＝放走小妖（勾玉原石 ×2、妖玉）；
 *              超時＝小妖被帶走（失敗）。開始／結束都有對話。
 * 依賴    : 22_event（EV.WEV／EV.H／EV.world／tryWorld）、20_npc（AMB.add／remove／bubble）、05_dialog、52_hub（travel）。
 * ========================================================================== */
'use strict';
(function () {
  const EV = G.EV, SC = G.SC, AM = G.AMB; if (!EV || !EV.WEV || !EV.H) return;
  const X = EV.H, WEV = EV.WEV, S = () => G.SAVE.data, F = () => G.SAVE.data.flags, nm = id => (G.D.scenes[id] || {}).name || id, rd = () => G.RPG.d();
  const say = (who, text) => ({ who, text });
  /* ---------- 新事件：救援 ---------- */
  WEV.rescue = { n: '士兵討伐精英', T: '救援', d: m => '「' + nm(m) + '」的士兵正在圍攻強大的妖怪', start(c) {
      const p = X.spot(220, 340), f = X.foesOf(SC.def); c.sold = []; c.obj = () => '救援：擊倒精英（士兵 ' + c.sold.filter(s => s.hp > 0).length + '／4）';
      for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4, x = p[0] + Math.cos(a) * 120, y = p[1] + Math.sin(a) * 50; const s = { hp: 100, n: null }; c.sold.push(s);
        /* r3.127.2：不帶 name 建立（避免同名合併成 1 個），建好再補名字；狀態 'ev' 由本事件控制移動與攻擊 */
        AM.add('n_t_human_guard', x, y, { hold: 1 }).then(n => { if (!n) return; s.n = n; n.name = i ? '士兵' : '士兵隊長'; n.qnew = 1; n.noMerge = 1; n.st = 'ev'; n.face = n.x < p[0] ? 1 : -1; s.a = a; s.cd = 40 + i * 18; if (!i) AM.bubble(n, '撐住！別讓牠突破！', 160); }); }
      X.load(f).then(() => { if (EV.cur !== c) return; const e = X.elite(G.spawnOni(p[0], p[1], 30, c.lv + 3, X.rnd(f.length ? f : ['akaoni'])), 5); e.ev = 1; c.e = e; c.spawned = 1;
        G.DLG.start([say('士兵隊長', '是旅人嗎？這隻妖怪砍不倒，弟兄們快撐不住了！'), say('蒼真', '退開一點，我來牽制牠！'), say('士兵隊長', '拜託了！全員，圍住牠的後路！')]); });
      c.step = () => { if (c.done || !c.e) return; const e = c.e, live = c.sold.filter(s => s.hp > 0);
        if (e.st === 'dead' || !(e.hp > 0)) { const n = live.length; X.reward(c, 2 + n * 0.6, n >= 3 ? 2 : 1, n); const cap = c.sold[0].n && c.sold[0].hp > 0 ? '士兵隊長' : '士兵';
          G.DLG.start([say(cap, n ? '倒了……真的倒了！' : '……'), say(cap, n >= 3 ? '弟兄們都還站著，這份恩情我記下了。' : '要不是你，我們全都回不去。'), say('蒼真', '先把傷員送回去吧。')]); X.finish(c, '救援成功', '存活士兵 ' + n + '／4'); return; }
        soldiers(c, e, live);
        if (G.t % 60 === 0 && live.length) { const s = X.rnd(live); s.hp -= 14 + Math.random() * 10; if (s.n) AM.bubble(s.n, s.hp > 0 ? X.rnd(['唔！', '好重的一擊……', '還撐得住！']) : '啊——！', 90);
          if (s.hp <= 0 && s.n) { const n = s.n; setTimeout(() => AM.remove(n), 900); } }
        if (!live.length) { e.hp = 0; e.st = 'dead'; G.UI.toast('精英帶著傷逃走了'); G.DLG.start([say('蒼真', '（士兵們都倒下了……那傢伙趁亂逃了。）')]); X.fail(c, '士兵全滅，精英逃走了'); } }; } };
  /* r3.127.2：士兵圍住精英（跟著移動）、約每 1.2 秒輪流攻擊一次，每次精英最大血量 1%（主角仍是主力） */
  function soldiers(c, e, live) { if (!(e.hp > 0) || e.st === 'dead') return; const k = G.HERO_H * SC.depth(e.y);
    for (const s of live) { const n = s.n; if (!n || n.st !== 'ev') continue; const has = a => !!(n.un && n.un.act[a]);
      const tx = e.x + Math.cos(s.a) * k * 0.95, ty = e.y + Math.sin(s.a) * k * 0.4, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy), sp = (n.spd || 1.2) * 1.6 * SC.depth(n.y);
      if (s.atk > 0) { s.atk--; const q = 1 - Math.abs(s.atk - 10) / 10, ux = e.x - s.ax, uy = e.y - s.ay, L = Math.hypot(ux, uy) || 1;   // 突刺：往精英衝 0.3 人高再收回（士兵素材沒有攻擊動作）
        n.x = s.ax + ux / L * q * k * 0.3; n.y = s.ay + uy / L * q * k * 0.12; if (s.atk === 10 && G.spawnFx) G.spawnFx('feedback_hit_a', 0, e.x - ux / L * k * 0.2, e.y - k * 0.5, 1, SC.depth(e.y)); continue; }
      if (d > sp + 2) { const nx = n.x + dx / d * sp, ny = n.y + dy / d * sp; if (SC.walkable(nx, ny)) { n.x = nx; n.y = ny; } const w = has('walk') ? 'walk' : has('run') ? 'run' : 'idle'; if (n.act !== w) { n.act = w; n.ms = 0; } }
      else { const w = has('idle') ? 'idle' : n.act; if (n.act !== w && !(s.atk > 0)) { n.act = w; n.ms = 0; } }
      if (Math.abs(e.x - n.x) > 4) n.face = Math.sign(e.x - n.x);
      if (--s.cd <= 0 && d < k * 0.6) { s.cd = 66 + Math.floor(Math.random() * 12); const at = ['attack', 'attack_1', 'slash', 'thrust'].find(has);
        if (at) { n.act = at; n.ms = 0; } s.atk = 20; s.ax = n.x; s.ay = n.y;
        const dm = Math.max(1, Math.round(e.hpMax * 0.01)); e.hp = Math.max(1, e.hp - dm);   // 士兵不會搶最後一擊
        G.NUMS.push({ x: e.x, y: e.y - G.HERO_H * (e.ratio || 1) * SC.depth(e.y) - 6, v: dm, t: 0, col: '#cfe3ff' }); } } }
  /* ---------- 新事件：奪還 ---------- */
  WEV.capture = { n: '道摩抓捕妖怪', T: '奪還', p: 2, d: m => '道摩兵在「' + nm(m) + '」抓了小妖', start(c) {
      const p = X.spot(240, 360), u = X.rnd(['n_a_tanuki', 'n_a_fox']); c.T = 150 * 60;
      AM.add(u, p[0], p[1], { hold: 1, name: '被綁住的小妖' }).then(n => { if (n) { c.cap = n; AM.bubble(n, '放開我……！', 180); } });
      G.DLG.start([say('道摩兵', '抓到一隻了，帶回去給大人煉成式神。'), say('蒼真', '……放開牠。'), say('道摩兵', '礙事的人類，一起收拾！')]);
      X.waves(c, [[X.DOMA, 6, { cx: p[0], cy: p[1] }], [X.DOMA, 6, { cx: p[0], cy: p[1], elite: 'doma_ritualist', ek: 5 }]], () => { if (c.done) return;
        rd().mats.jade = (rd().mats.jade || 0) + 2; X.reward(c, 3, 2, 3); if (c.cap) AM.bubble(c.cap, '謝謝……！', 140);
        G.DLG.start([say('被綁住的小妖', '繩子……斷了！'), say('被綁住的小妖', '這個給你。是我藏在樹洞裡的寶貝。'), say('蒼真', '快回山裡去吧，別再被抓到了。')], () => { if (c.cap) setTimeout(() => AM.remove(c.cap), 600); });
        X.finish(c, '小妖得救了', '勾玉原石 ×2、妖玉 +3'); });
      c.obj = () => '奪還：擊退道摩兵（第 ' + (c.wi + 1) + '／2 波）　剩 ' + Math.max(0, Math.ceil(c.T / 60)) + ' 秒';
      c.step = () => { if (c.done) return; if (--c.T > 0) return; if (c.cap) AM.remove(c.cap); for (const e of G.E) if (e.ev && e.st !== 'dead') { e.hp = 0; e.st = 'dead'; }
        G.DLG.start([say('道摩兵', '撤！貨到手了！'), say('蒼真', '（……慢了一步。）')]); X.fail(c, '小妖被帶走了'); }; } };
  /* ---------- 類型、輪替、10 分鐘 ---------- */
  const TY = { invade: '防衛', camp: '剿滅', ronins: '剿滅', doma: '剿滅', hunt: '討伐' }; for (const k in TY) if (WEV[k] && !WEV[k].T) WEV[k].T = TY[k];
  const w0 = EV.world; EV.world = function () { const s = S(), now = Date.now(), had = s.wev; if (had && had.until > now) return had;
    const L = Object.keys(WEV), lastT = had && had.k && WEV[had.k] ? WEV[had.k].T : s.wevT; let w = null;
    /* 用原本的挑選（地圖與條件）最多試 6 次，挑到不同類型為止 */
    const bn = G.UI.banner; G.UI.banner = () => {}; try { for (let i = 0; i < 6; i++) { s.wev = null; w = w0.call(EV); if (!w.k || !lastT || WEV[w.k].T !== lastT) break; } } finally { G.UI.banner = bn; }
    if (w && w.k) { w.until = now + 10 * 60000; s.wevT = WEV[w.k].T; G.SAVE.markDirty(); if (G.mode === 'play') G.UI.banner('世界事件【' + WEV[w.k].T + '】' + WEV[w.k].n, WEV[w.k].d(w.map) + '　點右上提醒可直接前往'); } return w; };
  const wt0 = EV.worldText; EV.worldText = function () { const w = EV.world(), t = wt0.call(EV); return w && w.k && WEV[w.k] ? '【' + WEV[w.k].T + '】' + t + '　（點擊前往）' : t; };
  /* ---------- 點提醒直接前往 ---------- */
  EV.goWorld = function () { const w = EV.world(); if (!w || !w.k) return G.UI.toast('目前沒有世界事件'); if (w.done) return G.UI.toast('這一輪的世界事件已完成');
    const lk = EV.bossLock && EV.bossLock(); if (lk) return G.UI.toast(typeof lk === 'string' ? lk : '頭目戰中，不能離開'); if (EV.cur && !EV.cur.done && !EV.cur.quiet) return G.UI.toast('目前的事件還沒結束');
    if (SC.id === w.map) { if (EV.tryWorld) EV.tryWorld(); return; }
    G.HUB.travel(0, '你們趕往「' + nm(w.map) + '」……（' + WEV[w.k].T + '・' + WEV[w.k].n + '）', [], w.map); };
  G.EVX = { WEV, TY };
})();
