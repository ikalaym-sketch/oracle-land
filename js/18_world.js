/* ==========================================================================
 * 神諭之地 重製版 — 18_world.js
 * Version : r3.52.0  (2026-11-23)　r3.52.0：進入章節第一張圖設好章節旗標後立刻重建任務（原本第一個任務要換一次圖才出現）
 * 舊版    : r3.39.0  (2026-11-17)  r3.39.0：進到某章第一張圖，只有前一章完成或該章開場已演才記「到過該章」（測試跳圖不再推進主線）；頭目擊敗橫幅改「討伐」
 * 舊版    : r3.9.1  (2026-11-13)
 * 變更    : r3.9.1 進場 3 秒後背景預先下載相鄰地圖與其妖怪所在的素材包；釋放地圖圖時一併釋放 blob 網址。
 * 變更    : r3.8.1 章節頭目地圖若有 P3 頭目（G.BOSS.MAP）改由 26_boss 生成，舊的放大妖怪只當後備。
 * 變更    : r3.5.1 記憶體：世界地圖圖只留最近 3 張、妖怪圖集只留最近 16 種（手機記憶體不足會讓圖閃爍）；載入地圖時顯示「地圖載入中」。
 * 變更    : r3.5.0 章節／副本頭目擊敗後 1 小時復活（不再封路），復活頭目必掉精品以上裝備。
 * 變更    : r3.3.0 第 7～12 章＋潮綾兩岸城＋曙火寄居地＋4 副本；終點（END）東側封住。
 *           r3.2.0 新增。第 2～6 章地圖串接（a/world.json：可走範圍、出入口、等級、妖怪表）＋葦穗村、榧守炭里。
 * 說明    : ・地圖圖檔 a/m/<id>.webp 進場時才載入（換場淡出期間等待，載完才進入），妖怪圖集同時載入。
 *           ・各章最後一張地圖有章節頭目（P3 頭目圖未到 → 以大型妖怪強化版代替），擊敗前東側出口封住。
 *           ・第一章結束（護巢）後，風口護巢灘東側改通往第二章。
 *           ・劇情第 2 章起尚未撰寫：進章時只顯示章節標題與區域名。
 * 依賴    : 01_assets（G.ASSET）、02_scene（G.SC）、03_actors（spawnOni／damageOni）、06_story（G.STORY）、07_rpg（onKill）。
 * ========================================================================== */
'use strict';
(function () {
  const S = () => G.SAVE.data, F = () => G.SAVE.data.flags;
  const WD = G.WORLD = { meta: {}, chapters: {}, ready: null,
    load() { return WD.ready || (WD.ready = fetch('a/world.json?v=' + G.VER).then(r => r.json()).then(j => {
      WD.meta = j.meta; WD.chapters = j.chapters; WD.dungeons = j.dungeons || {};
      for (const id in j.scenes) G.D.scenes[id] = Object.assign(j.scenes[id], j.meta[id]); })); },
    is: id => !!WD.meta[id], RESPAWN: 3600000,   // 頭目復活：1 小時
    CH: ['', '第一章', '第二章', '第三章', '第四章', '第五章', '第六章', '第七章', '第八章', '第九章', '第十章', '第十一章', '終章'],
    RG: { 2: '共岸、水閘與救田', 3: '婚列、契約與狐路', 4: '運鐵路、工棚與雷原', 5: '炭火共灶與雙井爐殿', 6: '檔界、見證與八岐試煉', 7: '米埠、雨廊與千扇紙閣', 8: '宴盟、山路與安置退路',
      9: '織梭、反流與八絃蛛窟', 10: '泊岸、礁灣與三潮珊庭', 11: '活訊、返程與黃泉', 12: '斷權、鎮災與立約' }
  };
  /* 開機：data.json 之後合併 world.json */
  const boot0 = G.ASSET.boot.bind(G.ASSET);
  G.ASSET.boot = function () { return boot0().then(r => WD.load().then(() => r)); };

  /* 進場：圖檔＋妖怪圖集沒載好就先等（換場淡出停在全黑） */
  const enter0 = G.SC.enter;
  G.SC.enter = function (id, at) {
    const d = G.D.scenes[id];
    if (d && WD.is(id) && !d._ready) {
      let T = this.trans; if (!T) T = this.trans = { t: 24, to: id, at: at, hold: true }; T.hold = true;
      const list = (d.foes || []).concat(d.boss ? [d.boss] : []);
      Promise.all([G.ASSET.img(id, 'a/m/' + id + '.webp'), G.ASSET.enemies(list)]).then(() => { d._ready = true; if (enter0.call(G.SC, id, at)) WD.onEnter(id); if (T) { T.hold = false; } })
        .catch(e => { if (T) T.hold = false; G.UI.toast('地圖載入失敗，請重試'); console.warn(e); });
      return true;
    }
    const ok = enter0.call(this, id, at); if (ok) WD.onEnter(id); return ok;
  };
  const step0 = G.SC.step.bind(G.SC);
  G.SC.step = function () { if (this.trans && this.trans.hold) return; return step0(); };

  const spawnOk0 = G.STORY.autoSpawnOk;
  G.STORY.autoSpawnOk = id => WD.is(id) ? !G.D.scenes[id].safe : spawnOk0(id);

  /* 記憶體回收：地圖圖 LRU 3、妖怪圖集 LRU 16（只在換場時做，當下地圖用到的不動） */
  WD.mLRU = []; WD.eLRU = [];
  function trim(id, d) {
    if (WD.is(id)) { WD.mLRU = WD.mLRU.filter(k => k !== id).concat(id);
      while (WD.mLRU.length > 3) { const k = WD.mLRU.shift(), im = G.IMG[k]; if (im) { G.PACK.drop(im); im.src = ''; delete G.IMG[k]; } if (G.D.scenes[k]) G.D.scenes[k]._ready = false; } }
    const use = (d.foes || []).concat(d.boss ? [d.boss] : []); WD.eLRU = WD.eLRU.filter(t => !use.includes(t)).concat(use);
    const keep = new Set((G.FOES_BOOT || []).concat(['akaoni'], use));   // 第一章開機預載的妖怪不釋放
    while (WD.eLRU.length > 16) { const t = WD.eLRU.shift(); if (!keep.has(t) && !G.E.some(e => e.type === t)) { G.ANIM.free('e_' + t); for (const k in WD.meta) { const s = G.D.scenes[k]; if (s && ((s.foes || []).includes(t) || s.boss === t)) s._ready = false; } } }   // 下次進場重新載入
  }
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); const T = G.SC.trans; if (T && T.hold) G.txt('地圖載入中…', G.LW / 2, G.LH / 2, 14, G.C.sub, 'center', G.FONT, 700); };
  /* 背景預先下載：相鄰地圖的圖＋妖怪所在的素材包（進場 3 秒後，不搶目前地圖的頻寬） */
  function warm(d) { setTimeout(() => { for (const p of d.portals || []) { const n = G.D.scenes[p.to]; if (!n) continue; G.PACK.warm('a/m/' + p.to + '.webp');
    for (const t of (n.foes || []).concat(n.boss ? [n.boss] : [])) { const u = G.ENEMY_IDX && G.ENEMY_IDX[t]; if (u && u.pages) for (const pg of u.pages) G.PACK.warm('a/p/' + pg); } } }, 3000); }
  WD.onEnter = function (id) {
    const d = G.D.scenes[id]; trim(id, d); warm(d);
    if (id === 'W_R01_07' && F().nest) { const p = d.portals.find(q => q.id === 'east'); if (p) p.to = 'W_R02_01'; delete G.SC.lock.east; }   // 第一章結束 → 通往第二章
    if (!WD.is(id)) return;
    if (d.portals.some(q => q.to === 'END')) d._end = d.dungeon ? '副本盡頭：從西側返回' : '旅途盡頭（後續劇情製作中）';
    if (d._end) G.SC.lock.east = d._end;
    const c = d.ch, ids = WD.chapters[c] || [];
    if (ids[0] === id && !F()['ch' + c] && (c <= 1 || F()['op' + c] || (G.HUB && G.HUB.done(c - 1)))) { F()['ch' + c] = 1; G.SAVE.markDirty(); G.UI.banner(WD.CH[c] + '　' + (WD.RG[c] || ''), d.name); G.STORY.later(2, () => { if (G.SC.id === id && G.QST && G.QST.build) G.QST.build(); }); }   /* r3.52.0：章節旗標在任務建置之後才設 → 立刻重建，第一個任務不用換圖才出現 */
    const first = !F()['boss_' + id], bt = (S().bossT || {})[id], re = !first && (!bt || Date.now() - bt >= WD.RESPAWN);
    if (d.boss && (first || re)) { if (first) G.SC.lock.east = '強大的妖氣擋住了去路';
      setTimeout(() => { if (G.SC.id !== id) return;
        if (G.BOSS && G.BOSS.mapStart(id, d, { re, sub: re ? '頭目復活・再次擊敗可得精品以上裝備' : d.dungeon ? '副本頭目' : '章節頭目・擊敗牠才能前進' })) return;   // P3 頭目
        const n = d.nodes.center, e = G.spawnOni(n[0] + 160, n[1], 20, d.lv + 3, d.boss);
        e.boss = true; e.re = re; e.ratio *= 1.25; e.hp = e.hpMax = Math.round(e.hpMax * 12); e.atk = Math.round(e.atk * 1.6);
        G.UI.banner(re ? '頭目復活' : d.dungeon ? '副本頭目' : '章節頭目', re ? '再次擊敗可得精品以上裝備' : d.dungeon ? '擊敗牠完成副本' : '擊敗牠才能前進'); }, 900); }
  };
  const kill0 = G.RPG.onKill;
  G.RPG.onKill = function (e) { kill0(e); const d = G.SC.def;
    if (e.boss && d && d.boss) { (S().bossT = S().bossT || {})[G.SC.id] = Date.now(); G.SAVE.markDirty(); }
    if (e.boss && e.re && d && d.boss) { let it = null; for (let k = 0; k < 80; k++) { it = G.RPG.roll(e.lv, d.region || 'wind'); if (it.q >= 2) break; } if (it.q < 2) it.q = 2;
      G.LOOT.push({ x: e.x, y: e.y, t: 0, kind: 'item', it }); G.UI.banner('頭目討伐', '1 小時後復活'); }
    if (e.boss && d && d.boss && !F()['boss_' + G.SC.id]) { F()['boss_' + G.SC.id] = 1; delete G.SC.lock.east; G.SAVE.markDirty();
      if (d._end) { G.SC.lock.east = d._end; G.UI.banner((d.dungeon ? d.name : WD.CH[d.ch]) + '　制霸', d.dungeon ? '副本頭目已擊敗' : '終章頭目已擊敗'); } else if (d.dungeon) G.UI.banner(d.name + '　突破', '東側的路打開了'); else if (!(G.POSTB && G.POSTB.has(G.SC.id))) G.UI.banner((e.name || '頭目') + '　討伐', ''); } };   // r3.39.0：章節頭目有戰後對話的，橫幅等對話後才出
})();
