/* ==========================================================================
 * 神諭之地 重製版 — 51_party_grow.js
 * Version : r3.203.0  (2026-11-28)　r3.203.0：夥伴資料／技能樹／裝備三頁改版
 * 舊版    : r3.97.0  (2026-11-26)　r3.97.0：夥伴頁加「屬性」分頁（124_statui）
 * 舊版    : r3.59.0  （r3.59.0：技能樹說明改由招式資料算出（目前＋滿級兩行））　r3.33.0：（r3.33.0：夥伴頁招式不顯示節點代號，點招式顯示觸發方式與效果　r3.19.2：夥伴資料列避開頭像、大字級不重疊）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 新增。夥伴成長：
 *           ・等級：出戰拿全額經驗、未出戰 50%；上限＝主角等級。
 *           ・技能點：招募 2＋首次切磋 1＋每 3 級 1＋巔峰每 10 級 1。
 *           ・技能樹：A／B 兩路各 6 節點；主動節點 5 級（每級效果 +12%、冷卻 −4%，滿 5 級質變）、被動 3 級；前置 1→2→(3,4)→5→6。
 *           ・三階外觀：累積獲得 3 點→第二階、15 點→第三階（看累積，不看花費）。
 *           ・基礎五招：夥伴 20／40／60／80 級各 +10%。
 *           ・裝備 6 格（同主角欄位），隨等級開放：Lv1 武器＋御守、10 胴、20 頭、30 手、40 足；只加數值，外觀不變。
 *           ・夥伴頁：出戰位、資料／技能樹／裝備三分頁、切磋、重置（神社／城鎮免費）。
 * 依賴    : 49_party、50_party_kit、07_rpg、08_menu（M.PAGE／M.ui）。
 * 存檔    : rpg.comp[id] = { lv, exp, nodes:{A1:lv…}, sel:{通道:節點}, eq:{部位:裝備}, prac }；rpg.party = [id, id]。只在變更時 markDirty。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, D = () => G.RPG.d(), F = () => G.SAVE.data.flags, ctx = G.ctx;
  PY.K5 = { shiro: 185.6, hayate: 195.0, kuzuha: 197.8, ibaraki: 193.6, shion: 179.8 };
  for (const id in PY.K5) PY.DEF[id].refH = () => PY.K5[id];   // 三階已在圖集內對齊第二階：用同一身高基準

  /* ---------- 技能樹（p＝被動；其餘＝取代的通道） ---------- */
  const N = (n, ch, d, d5, st) => ({ n, ch, d, d5, st });
  const T = PY.TREE = {
    shiro: { A: '守門・坦克', B: '鎮地・控場', n: {
      A1: N('定足護身', 'p', '防禦 +6%／級', '', { def: 6 }), A2: N('迎矢護肩', 'autonomous', '取代自主：替主角擋 1 發投射', '滿級：擋投射後反撞'),
      A3: N('仁王留門', 'command', '取代指令：3 秒內擋 2 次攻擊＋嘲諷 3 隻小怪', '滿級：可擋 3 次'), A4: N('退路相承', 'smallCombo', '取代小連攜：收尾傷害 85%，附 1 次投射護擋', '滿級：護擋 2 次'),
      A5: N('守門展肩', 'p', '生命 +6%／級', '', { hp: 6 }), A6: N('一夫當關', 'grandCombo', '取代大連攜：重震＋1 次近擊護擋', '滿級：護擋 2 次'),
      B1: N('石爪借勢', 'p', '攻擊 +4%／級', '', { atk: 4 }), B2: N('偏門雙拒', 'autonomous', '取代自主：短撞 2 隻小怪並推退', '滿級：推退距離加倍'),
      B3: N('石爪鎮步', 'command', '取代指令：地裂讓 3 隻小怪失衡 0.6 秒（頭目改加破勢）', '滿級：範圍 +30%'), B4: N('裂隙合擊', 'smallCombo', '取代小連攜：窄地裂最多 3 目標', '滿級：附失衡'),
      B5: N('礎石餘壓', 'p', '控場後小怪緩速；攻擊 +4%／級', '', { atk: 4 }), B6: N('石門崩陣', 'grandCombo', '取代大連攜：推退 3 隻小怪並失衡', '滿級：最多 5 隻') } },
    hayate: { A: '穿雲・狙擊', B: '回嵐・控場', n: {
      A1: N('凝目風讀', 'p', '暴擊 +2／級', '', { crit: 2 }), A2: N('追隙一矢', 'autonomous', '取代自主：追射輕風箭', '滿級：連射 2 箭'),
      A3: N('穿雲定矢', 'command', '取代指令：蓄弓重箭，耗滿風讀強化', '滿級：穿透 +1'), A4: N('破雲追射', 'smallCombo', '取代小連攜：同目標兩箭', '滿級：第二箭必暴擊'),
      A5: N('風眼穿甲', 'p', '攻擊 +5%／級', '', { atk: 5 }), A6: N('一線天穿', 'grandCombo', '取代大連攜：三箭 20／20／60', '滿級：多一支重箭'),
      B1: N('聽風側移', 'p', '生命 +6%／級', '', { hp: 6 }), B2: N('截羽緩行', 'autonomous', '取代自主：低傷箭緩速 20%', '滿級：緩速 30%'),
      B3: N('回風牽線', 'command', '取代指令：牽引 2 隻小怪', '滿級：牽引 3 隻'), B4: N('弦返護路', 'smallCombo', '取代小連攜：分叉兩箭推離', '滿級：推離加倍'),
      B5: N('風讀示隙', 'p', '暴擊傷害 +6／級', '', { critD: 6 }), B6: N('四羽封徑', 'grandCombo', '取代大連攜：四箭建 4 秒緩速風路', '滿級：風路 6 秒') } },
    kuzuha: { A: '祓護・輔助', B: '縛印・控場', n: {
      A1: N('澄心紙衣', 'p', '防禦 +6%／級', '', { def: 6 }), A2: N('清祓一葉', 'autonomous', '取代自主：淨化主角 1 層異常', '滿級：冷卻 −30%'),
      A3: N('兩儀護印', 'command', '取代指令：護印讓主角下一擊減傷 20%', '滿級：減傷 30%'), A4: N('祓印照刃', 'smallCombo', '取代小連攜：收尾＋淨化', '滿級：附護印'),
      A5: N('護印延綿', 'p', '生命 +6%／級', '', { hp: 6 }), A6: N('神樂守界', 'grandCombo', '取代大連攜：淨化＋25% 減傷護印', '滿級：護印 6 秒'),
      B1: N('紙刃照隙', 'p', '攻擊 +4%／級', '', { atk: 4 }), B2: N('縛足紙環', 'autonomous', '取代自主：束縛 1 隻小怪 0.8 秒', '滿級：束縛 2 隻'),
      B3: N('封步印位', 'command', '取代指令：印位內 3 隻小怪首次踏入束縛', '滿級：印位 6 秒'), B4: N('封術合刃', 'smallCombo', '取代小連攜：打斷普通施法', '滿級：附束縛'),
      B5: N('印位回響', 'p', '暴擊 +2／級', '', { crit: 2 }), B6: N('六方封界', 'grandCombo', '取代大連攜：六符封界定身 3 隻小怪', '滿級：範圍 +30%') } },
    ibaraki: { A: '炎鬼・破城', B: '鎮陣・護撤', n: {
      A1: N('鬼勢鍛骨', 'p', '攻擊 +4%／級', '', { atk: 4 }), A2: N('炎腕進擊', 'autonomous', '取代自主：肩擊留炎印灼燒 3 次', '滿級：灼燒 5 次'),
      A3: N('灼腕破城', 'command', '取代指令：耗 3 鬼勢的灼腕重拳（無視 20% 防禦）', '滿級：無視 35% 防禦'), A4: N('烙印合拳', 'smallCombo', '取代小連攜：主擊＋短灼燒', '滿級：灼燒加倍'),
      A5: N('淬鋒回勢', 'p', '暴擊傷害 +6／級', '', { critD: 6 }), A6: N('羅生炎崩', 'grandCombo', '取代大連攜：上勾、短肘、重落三擊', '滿級：重落範圍 +30%'),
      B1: N('護撤筋骨', 'p', '防禦 +6%／級', '', { def: 6 }), B2: N('截身重踏', 'autonomous', '取代自主：重踏讓 2 隻小怪失衡', '滿級：失衡加倍'),
      B3: N('鬼腕截陣', 'command', '取代指令：架守 0.8 秒後反擊', '滿級：架守減傷 70%'), B4: N('攔肩護撤', 'smallCombo', '取代小連攜：推離 1 隻小怪', '滿級：推離 2 隻'),
      B5: N('不動鬼胄', 'p', '生命 +6%／級', '', { hp: 6 }), B6: N('羅門護撤', 'grandCombo', '取代大連攜：橫掃推離＋自身減傷', '滿級：減傷 35%') } },
    shion: { A: '潮生・治療', B: '霜潮・控場', n: {
      A1: N('調息定弦', 'p', '生命 +6%／級', '', { hp: 6 }), A2: N('潮息小曲', 'autonomous', '取代自主：主角 HP≤60% 時回 6%', '滿級：回 8%'),
      A3: N('還潮清歌', 'command', '取代指令：回主角 10%（先 6 後 4）', '滿級：回 13%'), A4: N('暖潮合拍', 'smallCombo', '取代小連攜：收尾 80%＋回 3%', '滿級：回 5%'),
      A5: N('殘響續歌', 'p', '防禦 +6%／級', '', { def: 6 }), A6: N('海月返潮', 'grandCombo', '取代大連攜：回主角 8%', '滿級：餘音再回 4%'),
      B1: N('凝音薄霜', 'p', '攻擊 +4%／級', '', { atk: 4 }), B2: N('霜音短波', 'autonomous', '取代自主治療：冰音緩速 25%', '滿級：緩速 35%'),
      B3: N('潮環凍步', 'command', '取代指令：潮環緩速，已緩速者短凍', '滿級：最多 3 隻'), B4: N('逆潮合拍', 'smallCombo', '取代小連攜：窄波推離 2 隻', '滿級：推離加倍'),
      B5: N('餘音留霜', 'p', '暴擊 +2／級', '', { crit: 2 }), B6: N('冰潮鳴奏', 'grandCombo', '取代大連攜：冰潮緩速 3 隻並短凍', '滿級：範圍 +30%') } },
    yorimitsu: { A: '童子切・攻', B: '鎮惡・守', n: {
      A1: N('見切之眼', 'p', '暴擊 +2／級', '', { crit: 2 }), A2: N('影步追斬', 'autonomous', '取代自主：短進挑斬單體', '滿級：附失衡'), A3: N('童子切・拔斷', 'command', '取代指令：蓄刀斷守（無視 20% 防禦）', '滿級：消耗見切再 +40%'),
      A4: N('雙刃斷惡', 'smallCombo', '取代小連攜：兩斬 40／60', '滿級：第二斬必暴擊'), A5: N('名刀研磨', 'p', '攻擊 +5%／級', '', { atk: 5 }), A6: N('童子切・百鬼斷', 'grandCombo', '取代大連攜：三斬 20／30／50', '滿級：末斬範圍 +30%'),
      B1: N('四天王之誓', 'p', '防禦 +6%／級', '', { def: 6 }), B2: N('鞘打截進', 'autonomous', '取代自主：鞘打打斷追擊', '滿級：打斷 2 隻'), B3: N('守勢返太刀', 'command', '取代指令：架守後返斬', '滿級：架守減傷 70%'),
      B4: N('斷追護撤', 'smallCombo', '取代小連攜：推退 1 隻小怪', '滿級：推退 2 隻'), B5: N('不退之心', 'p', '生命 +6%／級', '', { hp: 6 }), B6: N('童子切・鎮惡門', 'grandCombo', '取代大連攜：先斬後留 2 秒反擊', '滿級：反擊 2 次') } },
    takemikazuchi: { A: '布都・雷劍', B: '雷鼓・控場', n: {
      A1: N('雷荷蓄身', 'p', '攻擊 +4%／級', '', { atk: 4 }), A2: N('霹靂追刃', 'autonomous', '取代自主：單體追斬', '滿級：附麻痺'), A3: N('布都雷貫', 'command', '取代指令：劍線＋雷擊各半', '滿級：消耗雷荷再 +40%'),
      A4: N('斷空雙雷', 'smallCombo', '取代小連攜：兩雷 40／60', '滿級：多一雷'), A5: N('神劍淬雷', 'p', '暴擊傷害 +6／級', '', { critD: 6 }), A6: N('雷神・一劍天斷', 'grandCombo', '取代大連攜：神劍終斬', '滿級：範圍 +30%'),
      B1: N('震足', 'p', '生命 +6%／級', '', { hp: 6 }), B2: N('震足回雷', 'autonomous', '取代自主：低扇讓 2 隻小怪失衡', '滿級：失衡加倍'), B3: N('雷鼓定界', 'command', '取代指令：3 次雷鼓脈衝短控', '滿級：4 次脈衝'),
      B4: N('震雷合圍', 'smallCombo', '取代小連攜：窄弧拆群 3 目標', '滿級：附失衡'), B5: N('鼓聲綿延', 'p', '防禦 +6%／級', '', { def: 6 }), B6: N('神降・鳴雷天網', 'grandCombo', '取代大連攜：2.4 秒雷域 3 脈衝', '滿級：4 脈衝') } },
    enno: { A: '役靈・攻', B: '山行・護', n: {
      A1: N('役靈同心', 'p', '攻擊 +4%／級', '', { atk: 4 }), A2: N('朱行逐影', 'autonomous', '取代自主：役靈單點追擊', '滿級：追擊 2 次'), A3: N('役靈穿霞', 'command', '取代指令：光擊 70%＋法響 30%', '滿級：法響加倍'),
      A4: N('雙響合杖', 'smallCombo', '取代小連攜：杖點＋役靈兩擊', '滿級：多一擊'), A5: N('修驗之道', 'p', '暴擊 +2／級', '', { crit: 2 }), A6: N('神通・兩界渡', 'grandCombo', '取代大連攜：役靈兩次接力', '滿級：三次接力'),
      B1: N('山伏之身', 'p', '生命 +6%／級', '', { hp: 6 }), B2: N('風鈴退步', 'autonomous', '取代自主：側退後截停 1 個追擊', '滿級：截停 2 隻'), B3: N('行法・回風路', 'command', '取代指令：主角前方 3 秒風路（踏入移速 +10%）', '滿級：移速 +20%'),
      B4: N('留步合杖', 'smallCombo', '取代小連攜：主角 2 秒內抗 1 次小硬直', '滿級：3 秒'), B5: N('錫杖結界', 'p', '防禦 +6%／級', '', { def: 6 }), B6: N('神通・山行護陣', 'grandCombo', '取代大連攜：主角 3 秒抗小硬直', '滿級：5 秒') } }
  };
  const PRE = { 1: [], 2: [1], 3: [2], 4: [2], 5: [3, 4], 6: [5] };
  const maxOf = (id, k) => T[id].n[k].ch === 'p' ? 3 : 5;

  /* ---------- 點數 ---------- */
  PY.earned = id => { const c = PY.data(id); return 2 + (c.prac ? 1 : 0) + Math.floor(c.lv / 3) + Math.floor((D().peak || 0) / 10); };
  PY.spent = id => { const c = PY.data(id); let s = 0; for (const k in c.nodes) s += c.nodes[k]; return s; };
  PY.free = id => PY.earned(id) - PY.spent(id);
  PY.nodeLv = (id, k) => (PY.data(id).nodes[k] || 0);
  PY.canLearn = (id, k) => { const c = PY.data(id), L = c.nodes[k] || 0; if (L >= maxOf(id, k)) return '已滿級'; if (PY.free(id) <= 0) return '技能點不足';
    if (!L) { const path = k[0], miss = PRE[+k[1]].filter(i => !(c.nodes[path + i] > 0)); if (miss.length) return '需先學：' + miss.map(i => T[id].n[path + i].n).join('、'); } return ''; };
  let busy = 0;
  PY.learn = (id, k) => { if (busy > G.t) return false; busy = G.t + 8; const why = PY.canLearn(id, k); if (why) { G.UI.toast(why); return false; }
    const c = PY.data(id), st0 = PY.stage(id); c.nodes[k] = (c.nodes[k] || 0) + 1; const ch = T[id].n[k].ch; if (ch !== 'p' && c.nodes[k] === 1) c.sel[ch] = k;
    G.SAVE.markDirty(); G.UI.toast(T[id].n[k].n + ' → Lv' + c.nodes[k]); if (PY.stage(id) !== st0) { PY.load(id); G.UI.banner(PY.DEF[id].name + ' 外觀提升', '第 ' + PY.stage(id) + ' 階'); } return true; };
  PY.reset = id => { const c = PY.data(id); if (!(G.SC.def && (G.SC.def.safe || /^hub_|^T_/.test(G.SC.id)))) { G.UI.toast('只能在神社或城鎮重置'); return; } c.nodes = {}; c.sel = {}; G.SAVE.markDirty(); G.UI.toast('技能樹已重置，點數全數返還'); };
  PY.variant = (id, ch) => { const k = PY.data(id).sel[ch]; return k && PY.nodeLv(id, k) > 0 ? k : ch; };
  PY.nodeMul = (P, ch) => { if (!ch || ch === 'burn') return 1; const k = PY.variant(P.id, ch); if (k !== ch) return 1 + 0.12 * (PY.nodeLv(P.id, k) - 1);
    const lv = PY.data(P.id).lv; return 1 + 0.1 * ((lv >= 20) + (lv >= 40) + (lv >= 60) + (lv >= 80)); };
  PY.cdMul = (P, ch) => { const k = PY.variant(P.id, ch); return k !== ch ? 1 - 0.04 * (PY.nodeLv(P.id, k) - 1) : 1; };
  PY.passive = (id, s) => { const tr = T[id]; if (!tr) return; for (const k in tr.n) { const nd = tr.n[k], L = PY.nodeLv(id, k); if (!L || !nd.st) continue;
    for (const a in nd.st) { if (a === 'crit' || a === 'critD') s[a] += nd.st[a] * L; else s[a] *= 1 + nd.st[a] * L / 100; } } };

  /* ---------- 經驗 ---------- */
  const kill0 = G.RPG.onKill; G.RPG.onKill = function (e) { kill0.apply(this, arguments); const xp = Math.round(10 + (e.lv || 1) * 6), hl = D().lv;
    for (const id of PY.roster()) { const c = PY.data(id), on = PY.slots().includes(id); if (c.lv >= hl) { c.exp = 0; continue; }
      c.exp += on ? xp : Math.round(xp / 2); let up = false; while (c.exp >= G.RPG.need(c.lv) && c.lv < hl) { c.exp -= G.RPG.need(c.lv); c.lv++; up = true; }
      if (up && on) { G.UI.toast(PY.DEF[id].name + ' 升到 Lv' + c.lv + (c.lv % 3 === 0 ? '（技能點 +1）' : '')); const P = PY.list.find(q => q.id === id); if (P) P.hp = P.hpMax = Math.round(PY.stats(id).hp); } } };
  PY.roster = () => Object.keys(PY.DEF).filter(PY.joined);

  /* ---------- 裝備 ---------- */
  const SLOTLV = { weapon: 1, charm: 1, body: 10, head: 20, hands: 30, feet: 40 };
  PY.slotOpen = (id, sl) => PY.data(id).lv >= SLOTLV[sl];
  PY.equip = (id, sl) => { const d = D(), c = PY.data(id); if (!PY.slotOpen(id, sl)) { G.UI.toast(G.RPG.SLOTN[sl] + '欄：夥伴 Lv' + SLOTLV[sl] + ' 開放'); return; }
    const cand = d.bag.filter(it => G.RPG.TPL[it.t] && G.RPG.TPL[it.t].slot === sl).sort((a, b) => G.RPG.power(b) - G.RPG.power(a));
    if (!cand.length) { if (c.eq[sl]) { if (d.bag.length >= d.bagMax) { G.UI.toast('背包已滿'); return; } d.bag.push(c.eq[sl]); c.eq[sl] = null; G.SAVE.markDirty(); G.UI.toast('已卸下'); } else G.UI.toast('背包裡沒有可用的' + G.RPG.SLOTN[sl]); return; }
    const it = cand[0]; d.bag.splice(d.bag.indexOf(it), 1); if (c.eq[sl]) d.bag.push(c.eq[sl]); c.eq[sl] = it; G.SAVE.markDirty(); G.UI.toast(PY.DEF[id].name + ' 裝備 ' + G.RPG.name(it)); };

  /* ---------- 加入／換場 ---------- */
  PY.onJoin = id => { const s = PY.slots(); if (!s.includes(id)) { const i = s.indexOf(null); if (i >= 0) s[i] = id; } PY.sync(); };
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { en0.apply(this, arguments); PY.enter(); };
  PY.testUnlock = () => { for (const id in PY.DEF) { if (id !== 'shiro') F()['test_' + id] = 1; PY.data(id); } F().shiroJoin = 1; G.SAVE.markDirty(); G.UI.toast('測試：8 位夥伴全部可出戰'); };

  /* ---------- 戰鬥畫面：夥伴頭像 ---------- */
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); try { PY.hud(); } catch (x) { PY.err++; PY.lastErr = 'hud ' + x; } };

  /* ---------- 夥伴頁 ---------- */
  const M = G.MENU, U = M.ui, C = G.C, fs = () => G.FS();
  const ROLE = { 坦: '#6a7a9a', 遠: '#4a8c5c', 控: '#9a5a8a', 破: '#a5623a', 癒: '#3f8c8c', 近: '#9a6a3a' };
  M.PAGE['夥伴'] = function (x, y, w, h) {
    const ids = Object.keys(PY.DEF), lw = Math.min(200, w * 0.32), RH = 44 * fs(), sel = Math.min(ids.length - 1, M.sel.pt || 0), slots = PY.slots();
    U.box(x, y, lw, h); const off = U.scrollArea('pt', x, y + 6, lw, h - 12, ids.length * RH); U.clip(x, y + 6, lw, h - 12);
    ids.forEach((id, i) => { const yy = y + 6 + i * RH + off, def = PY.DEF[id], j = PY.joined(id), on = i === sel, si = slots.indexOf(id);
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'transparent'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4);
      G.txt(j ? def.name : '？？？', x + 14, yy + RH * 0.38, 14, j ? C.ink : C.dim, 'left', G.FONT_S, 900);
      G.txt(j ? 'Lv ' + PY.data(id).lv + (PY.free(id) > 0 ? '　點數 ' + PY.free(id) : '') : '尚未加入', x + 14, yy + RH * 0.74, 10, PY.free(id) > 0 && j ? '#ffd65a' : C.sub, 'left', G.FONT, 500);
      if (si >= 0) G.txt('出戰' + (si + 1), x + lw - 14, yy + RH * 0.38, 10, '#7fd36b', 'right', G.FONT_S, 900);
      G.txt(def.role, x + lw - 14, yy + RH * 0.74, 10, ROLE[def.role] || C.sub, 'right', G.FONT_S, 900);
      U.hit(x + 6, Math.max(yy, y + 6), lw - 12, RH - 4, () => { M.sel.pt = i; }); });
    ctx.restore();
    const id = ids[sel], def = PY.DEF[id], cx = x + lw + 8, cw = w - lw - 8; U.box(cx, y, cw, h);
    if (!PY.joined(id)) { G.txt('尚未加入', cx + cw / 2, y + 60, 16, C.dim, 'center', G.FONT_S, 900); const c = G.RPG.COMP.find(q => q.id === id);
      if (c && c.hidden) { ctx.font = `500 ${12 * fs()}px ${G.FONT}`; G.wrap('加入方式：' + c.hidden, cw - 40).forEach((l, i) => G.txt(l, cx + cw / 2, y + 92 + i * 20 * fs(), 12, C.sub, 'center', G.FONT, 500)); }
      else G.txt('劇情中加入', cx + cw / 2, y + 90, 12, C.sub, 'center'); return; }
    const c = PY.data(id), s = PY.stats(id), tabs = ['資料', '技能樹', '裝備', '屬性'], tab = M.sel.ptab || 0, tw = Math.max(44, Math.min(64, (cw - 172) / 4 - 6));
    tabs.forEach((t, i) => U.button(cx + 10 + i * (tw + 6), y + 8, tw, 28, t, () => { M.sel.ptab = i; }, i === tab ? 'main' : ''));
    [0, 1].forEach(i => { const on = slots[i] === id; U.button(cx + cw - 10 - (2 - i) * 74, y + 8, 68, 28, on ? '出戰' + (i + 1) + '✓' : '設出戰' + (i + 1), () => { PY.setSlot(i, on ? null : id); }, on ? 'main' : ''); });
    const y0 = y + 46;
    /* r3.203.0：夥伴各分頁改版——資料＝名牌＋數值小卡＋招式卡（點招式，下方直接顯示說明，不再跳提示）；技能樹＝被動／招式色標＋等級圓點；裝備＝部位卡＋「全部裝最強」；說明用語改成玩家看得懂的話。 */
    const chip = (t, bx, my, col, fill) => { ctx.font = `800 ${10 * fs()}px ${G.FONT}`; const tw = ctx.measureText(t).width + 12, bh = 16 * fs(); ctx.fillStyle = fill ? col : 'rgba(0,0,0,.35)'; G.rr(bx, my - bh / 2, tw, bh, 4); ctx.fill(); if (!fill) { ctx.strokeStyle = col; ctx.lineWidth = 1; G.rr(bx + .5, my - bh / 2 + .5, tw - 1, bh - 1, 4); ctx.stroke(); } G.txt(t, bx + tw / 2, my + 1, 10, fill ? '#1c1410' : col, 'center', G.FONT, 800); return tw; };
    const CHN = { ordinary: '普攻', autonomous: '自主', command: '指令', smallCombo: '小連攜', grandCombo: '大連攜' }, CHC = { ordinary: '#cfc8bb', autonomous: '#86cf8f', command: '#6fb0f0', smallCombo: '#e0c068', grandCombo: '#f0ad52' };
    if (tab === 0) {
      const fim = G.IMG[def.face]; if (!fim && !G.IMG['_req_' + def.face]) { G.IMG['_req_' + def.face] = 1; G.ASSET.img(def.face, 'a/' + def.face + '.webp').catch(() => {}); }
      const PW = 64; if (fim) { ctx.save(); G.rr(cx + cw - PW - 14, y0 + 2, PW, PW, 8); ctx.clip(); ctx.drawImage(fim, cx + cw - PW - 14, y0 + 2, PW, PW); ctx.restore(); ctx.strokeStyle = 'rgba(227,194,122,.5)'; ctx.lineWidth = 1; G.rr(cx + cw - PW - 13.5, y0 + 2.5, PW - 1, PW - 1, 8); ctx.stroke(); }
      const lw2 = cw - PW - 40; G.txt(def.name, cx + 14, y0 + 12, 17, '#fff3d6', 'left', G.FONT_S, 900); ctx.font = `900 ${17 * fs()}px ${G.FONT_S}`; let hx = cx + 24 + ctx.measureText(def.name).width;
      hx += chip('Lv ' + c.lv, hx, y0 + 12, '#f3d98a', 1) + 5; hx += chip('第 ' + PY.stage(id) + ' 階', hx, y0 + 12, '#e3c27a') + 5; chip(def.role, hx, y0 + 12, ROLE[def.role] || '#e3c27a', 1);
      { const need = G.RPG.need(c.lv); ctx.fillStyle = 'rgba(255,255,255,.1)'; G.rr(cx + 14, y0 + 27, lw2 - 90 * fs(), 5, 3); ctx.fill(); ctx.fillStyle = C.gold; G.rr(cx + 14, y0 + 27, Math.max(3, (lw2 - 90 * fs()) * Math.min(1, c.exp / need)), 5, 3); ctx.fill(); G.txt('經驗 ' + Math.floor(c.exp) + '／' + need, cx + 14 + lw2 - 82 * fs(), y0 + 30, 10, C.sub, 'left', G.FONT, 600); }
      const fr = PY.free(id), tiles = [['生命', Math.round(s.hp)], ['攻擊', Math.round(s.atk)], ['防禦', Math.round(s.def)], ['暴擊', s.crit.toFixed(0) + '%'], ['技能點', fr + '／' + PY.earned(id)]], ty = y0 + 40, th = 34 * fs(), tw3 = (lw2 - 4 * 5) / 5;
      tiles.forEach(([k, v], q) => { const tx = cx + 14 + q * (tw3 + 5), hot = q === 4 && fr > 0; ctx.fillStyle = hot ? 'rgba(150,92,36,.4)' : 'rgba(255,255,255,.05)'; G.rr(tx, ty, tw3, th, 6); ctx.fill(); G.txt(k, tx + 8, ty + th * 0.28, 10, C.sub, 'left', G.FONT, 600); G.txt(String(v), tx + 8, ty + th * 0.7, 14, hot ? '#ffd65a' : '#fff3d6', 'left', G.FONT_S, 900); });
      const my0 = Math.max(ty + th + 8, y0 + PW + 10); G.txt('招式（點一下看說明）', cx + 14, my0 + 6, 11, C.gold, 'left', G.FONT_S, 900);
      const chs = ['ordinary', 'autonomous', 'command', 'smallCombo', 'grandCombo'], selM = chs.includes(M.sel.pmove) ? M.sel.pmove : 'ordinary', half = (cw - 28 - 6) / 2, botY = y + h - 40, dH = Math.min(38 * fs(), 42), mh = Math.max(20, Math.min(30 * fs(), (botY - dH - 8 - (my0 + 16)) / 3 - 4));
      chs.forEach((ch, q) => { const k = PY.variant(id, ch), sk = G.PKIT[id][k], xx = cx + 14 + (q % 2) * (half + 6), yy = my0 + 16 + Math.floor(q / 2) * (mh + 4), on = ch === selM;
        ctx.fillStyle = on ? 'rgba(150,92,36,.5)' : 'rgba(255,255,255,.05)'; G.rr(xx, yy, half, mh, 6); ctx.fill(); if (on) { ctx.strokeStyle = 'rgba(255,238,200,.7)'; ctx.lineWidth = 1; G.rr(xx + .5, yy + .5, half - 1, mh - 1, 6); ctx.stroke(); }
        const cwid = chip(CHN[ch], xx + 6, yy + mh / 2, CHC[ch], 1); G.txt(sk.name, xx + 12 + cwid, yy + mh / 2 + 1, 12, '#fff3d6', 'left', G.FONT_S, 800); if (k !== ch) G.txt('已強化 Lv' + PY.nodeLv(id, k), xx + half - 8, yy + mh / 2 + 1, 10, '#ffd65a', 'right', G.FONT, 700);
        U.hit(xx, yy, half, mh, () => { M.sel.pmove = ch; }); });
      { const dy = botY - dH - 2, txt = (PY.moveText && PY.moveText(id, selM)) || ''; ctx.fillStyle = 'rgba(0,0,0,.35)'; G.rr(cx + 14, dy, cw - 28, dH, 6); ctx.fill(); ctx.font = `500 ${10.5 * fs()}px ${G.FONT}`; const ls = G.wrap(String(txt).replace(/\n/g, '　'), cw - 48).slice(0, Math.max(1, Math.floor((dH - 8) / (14 * fs())))); ls.forEach((l, q) => G.txt(l, cx + 24, dy + 6 + 7 * fs() + q * 14 * fs(), 10.5, C.ink, 'left', G.FONT, 500)); }
      const safe = G.SC.def && (G.SC.def.safe || /^hub_|^T_/.test(G.SC.id));
      U.button(cx + 14, y + h - 36, 176, 28, c.prac ? '切磋（任一素材 ×10）' : '首次切磋（技能點 +1）', () => { if (!safe) { G.UI.toast('在神社或城鎮才能切磋'); return; }
        if (!c.prac) { c.prac = 1; G.SAVE.markDirty(); G.UI.toast(def.name + '：切磋完成，技能點 +1'); return; }
        const m = D().mats, k = Object.keys(m).find(q => m[q] >= 10); if (!k) { G.UI.toast('需要任一素材 ×10'); return; } m[k] -= 10; c.exp += G.RPG.need(c.lv) * 0.5; G.SAVE.markDirty(); G.UI.toast('切磋：獲得經驗'); });
      U.button(cx + 198, y + h - 36, 104, 28, '重置技能樹', () => PY.reset(id));
    } else if (tab === 1) {
      const tr = T[id], colW = (cw - 30) / 2, seln = M.sel.pnode, nh = Math.max(22, Math.min(40, (y + h - 58 - (y0 + 16)) / 6 - 3));
      G.txt('可用技能點 ' + PY.free(id), cx + cw - 14, y0 + 6, 12, PY.free(id) > 0 ? '#ffd65a' : C.sub, 'right', G.FONT_S, 900);
      ['A', 'B'].forEach((p, pi) => { const bx = cx + 10 + pi * (colW + 10); G.txt(String(tr[p]).replace(/・/g, '　'), bx + 4, y0 + 6, 12, C.gold, 'left', G.FONT_S, 900);
        for (let i = 1; i <= 6; i++) { const k = p + i, nd = tr.n[k], L = PY.nodeLv(id, k), mx = maxOf(id, k), by = y0 + 14 + (i - 1) * (nh + 3), ok = !PY.canLearn(id, k) || L > 0, eq = nd.ch !== 'p' && c.sel[nd.ch] === k;
          U.box(bx, by, colW, nh, k === seln ? 'rgba(120,80,30,.55)' : L ? 'rgba(40,60,40,.8)' : 'rgba(22,15,19,.9)', eq ? '#ffd65a' : ok ? 'rgba(227,194,122,.5)' : 'rgba(120,120,120,.3)');
          { const cwid = chip(nd.ch === 'p' ? '被動' : CHN[nd.ch] || '招式', bx + 6, by + nh / 2, nd.ch === 'p' ? '#b9ad98' : CHC[nd.ch] || '#6fb0f0', L > 0); G.txt(nd.n, bx + 12 + cwid, by + nh / 2 + 1, 12, L ? '#fff3d6' : ok ? C.sub : C.dim, 'left', G.FONT_S, 900);
            const pr = 3 * fs(), px0 = bx + colW - 8 - mx * (pr * 2 + 3); for (let q = 0; q < mx; q++) { ctx.beginPath(); ctx.arc(px0 + q * (pr * 2 + 3) + pr, by + nh / 2, pr, 0, 6.283); ctx.fillStyle = q < L ? '#7fd36b' : 'rgba(255,255,255,.16)'; ctx.fill(); }
            if (eq) G.txt('使用中', px0 - 6, by + nh / 2 + 1, 10, '#ffd65a', 'right', G.FONT, 800); }
          U.hit(bx, by, colW, nh, () => { M.sel.pnode = k; }); } });
      if (seln && tr.n[seln]) { const nd = tr.n[seln], L = PY.nodeLv(id, seln), why = PY.canLearn(id, seln), by = y + h - 54;
        U.box(cx + 8, by - 4, cw - 16, 54, 'rgba(10,8,10,.96)'); G.txt(nd.n + '（' + (nd.ch === 'p' ? '被動' : { autonomous: '自主', command: '指令', smallCombo: '小連攜', grandCombo: '大連攜' }[nd.ch]) + '）', cx + 16, by + 10, 12, C.gold, 'left', G.FONT_S, 900);
        const tw = cw - 216, dt = PY.nodeText ? PY.nodeText(id, seln) : [nd.d, nd.d5 || ''], fit = t => { ctx.font = `500 ${10 * G.FS()}px ${G.FONT}`; if (ctx.measureText(t).width <= tw) return t; while (t.length > 4 && ctx.measureText(t + '…').width > tw) t = t.slice(0, -1); return t + '…'; };   // r3.59.0：說明由招式資料算出（目前／滿級兩行）
        G.txt(fit(dt[0]), cx + 16, by + 26, 10, C.ink, 'left', G.FONT, 500); if (dt[1]) G.txt(fit(dt[1]), cx + 16, by + 40, 10, L >= 5 ? '#f3d98a' : C.sub, 'left', G.FONT, 500);
        if (why && why !== '已滿級') { const nw = ctx.measureText(nd.n).width; G.txt(why, cx + 120 + nw, by + 10, 10, '#e88', 'left'); }
        U.button(cx + cw - 186, by + 6, 80, 36, why ? (why === '已滿級' ? '已滿級' : '無法學習') : '學習 +1', () => PY.learn(id, seln), why ? '' : 'main');
        if (nd.ch !== 'p' && L > 0) U.button(cx + cw - 100, by + 6, 86, 36, c.sel[nd.ch] === seln ? '改回基礎' : '裝配', () => { c.sel[nd.ch] = c.sel[nd.ch] === seln ? null : seln; G.SAVE.markDirty(); }); }
    } else if (tab === 3) { if (PY.attrTab) PY.attrTab(id, cx, y0, cw, y + h - y0);   // r3.97.0：屬性分頁（124_statui）
    } else {
      const Rg = G.RPG, bestBtn = 112, rh = Math.min(40, (y + h - 12 - (y0 + 34)) / 6 - 4), openEmpty = Rg.SLOT.filter(sl => PY.slotOpen(id, sl) && !c.eq[sl] && D().bag.some(it => Rg.TPL[it.t] && Rg.TPL[it.t].slot === sl));
      G.txt('點部位＝換上背包裡最強的那件；只加數值，外觀不變', cx + 14, y0 + 14, 10, C.sub, 'left', G.FONT, 500);
      U.button(cx + cw - bestBtn - 10, y0, bestBtn, 28, '空位全部裝上', openEmpty.length ? () => { for (const sl of openEmpty) PY.equip(id, sl); } : null, openEmpty.length ? 'main' : 'off');
      Rg.SLOT.forEach((sl, i) => { const by = y0 + 34 + i * (rh + 4), it = c.eq[sl], open = PY.slotOpen(id, sl), qc = it && Rg.QUAL && Rg.QUAL[it.q] ? Rg.QUAL[it.q].c : '#fff3d6';
        ctx.fillStyle = open ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.3)'; G.rr(cx + 10, by, cw - 20, rh, 6); ctx.fill(); if (it) { ctx.fillStyle = qc; ctx.fillRect(cx + 10, by + 5, 3, rh - 10); }
        ctx.globalAlpha = open ? 1 : 0.5; chip(Rg.SLOTN[sl], cx + 20, by + rh / 2, '#e3c27a', open && !!it); ctx.globalAlpha = 1;
        if (!open) G.txt('夥伴 Lv' + SLOTLV[sl] + ' 開放', cx + 74, by + rh / 2 + 1, 12, '#8f8576', 'left', G.FONT, 600);
        else if (it) { G.txt(Rg.name(it), cx + 74, by + rh / 2 + 1, 13, qc, 'left', G.FONT_S, 800); G.txt('戰力 ' + Rg.power(it), cx + cw - 22, by + rh / 2 + 1, 12, C.gold, 'right', G.FONT, 700); }
        else { G.txt('未裝備', cx + 74, by + rh / 2 + 1, 12, C.dim, 'left', G.FONT, 600); G.txt('裝上最強　›', cx + cw - 22, by + rh / 2 + 1, 11, '#86cf8f', 'right', G.FONT, 700); }
        U.hit(cx + 10, by, cw - 20, rh, () => PY.equip(id, sl)); });
    }
  };
})();
