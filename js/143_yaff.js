/* ==========================================================================
 * 神諭之地 重製版 — 143_yaff.js
 * Version : r3.117.0  (2026-11-26)　r3.117.0：助戰頭目改用原本招式（先載入整組頭目圖）
 * 舊版    : r3.116.0  (2026-11-26)
 * 變更    : r3.116.0 新增。妖怪村頭目好感。
 *           ・好感來源：村內事件完成 +1（142）、送禮 +3。等級：Lv1＝5、Lv2＝15、Lv3＝30。
 *           ・禮物：每位頭目一種（飯糰、黃瓜、油豆腐、雷紋糖、出雲神酒、上等和紙、大吟釀、珊瑚枝）。
 *             取得① 在該頭目章節的地圖打怪隨機掉落（一般 2%、精英 12%、頭目 50%；頭目已入住才掉）。
 *             取得② 妖怪村「村長・天狗長者」用物資兌換：同一種素材 ×5＋錢（主角等級 ×20）。
 *             送禮：同樣找村長「送禮」，選頭目。
 *           ・戰鬥助戰：好感 Lv1／2／3 的頭目，在頭目戰開始或野外附近有 4 隻以上敵人時，8%／15%／25% 機率現身幫打 30 秒（共用冷卻 3 分鐘，一次一位）。
 *           ・專屬勾玉：好感 Lv2 時送一顆（每位一次）——該頭目主題的秘法勾玉（例：九尾＝狐火、雷獸＝雷鳴、鎌鼬＝回春），階級＝目前上限、品質精品以上。
 * 存檔    : save.yaff{名:值}、save.ygift{名:數量}、save.ygem{名:1}。
 * 依賴    : 142_yvent（YVENT.R／spawnAlly）、129_magatama（MAGA.rollGem／give）、07_rpg（onKill、mats）、26_boss（start）、52_hub（marks）。
 * ========================================================================== */
'use strict';
(function () {
  const Y = G.YVENT, SC = G.SC, H = G.H; if (!Y) return;
  const S = () => G.SAVE.data, F = () => G.SAVE.data.flags, rd = () => G.RPG.d(), rnd = a => a[Math.floor(Math.random() * a.length)], say = (who, text) => ({ who, text }), VIL = 'T_yokai';
  const GIFT = { '鎌鼬長兄': '飯糰', '河童大將': '黃瓜', '九尾': '油豆腐', '雷獸': '雷紋糖', '須佐之男': '出雲神酒', '長壁姬': '上等和紙', '酒吞童子': '大吟釀', '綿津見': '珊瑚枝' };
  const GEM = { '鎌鼬長兄': 'kaishun', '河童大將': 'kenrei', '九尾': 'kitsunebi', '雷獸': 'raimei', '須佐之男': 'zanyo', '長壁姬': 'kagami', '酒吞童子': 'kikoku', '綿津見': 'ryumyaku' };
  const THX = { '鎌鼬長兄': '三弟一定會很高興。……我也是。', '河童大將': '黃瓜！你果然懂我！', '九尾': '油豆腐……呵，你從哪裡聽說的？', '雷獸': '（雷獸開心地在地上打滾）',
    '須佐之男': '好酒。下次比劍，我讓你三招。', '長壁姬': '這紙……能做出很好的紙人。謝謝。', '酒吞童子': '哈哈！今晚陪我喝到天亮！', '綿津見': '珊瑚……海的心意，我收下了。' };
  const aff = n => ((S().yaff || {})[n]) || 0, lvOf = v => v >= 30 ? 3 : v >= 15 ? 2 : v >= 5 ? 1 : 0, gifts = () => (S().ygift = S().ygift || {});
  const res = () => Y.residents();
  function addAff(n, v) { const a = S().yaff = S().yaff || {}, l0 = lvOf(a[n] || 0); a[n] = (a[n] || 0) + v; G.SAVE.markDirty(); const l1 = lvOf(a[n]);
    if (l1 > l0) { G.UI.banner(n + '　好感 Lv' + l1, l1 === 1 ? '戰鬥中有機會出手相助' : l1 === 2 ? '收到專屬勾玉，助戰機率提高' : '助戰機率再提高'); if (l1 >= 2) gem(n); } }
  /* 專屬勾玉 */
  function gem(n) { const M = G.MAGA, own = S().ygem = S().ygem || {}; if (own[n] || !M || !M.rollGem || !M.give) return; let g = null;
    try { g = M.rollGem(Math.max(30, rd().lv || 1), { boss: 1 }); g.k = GEM[n]; g.q = Math.max(4, g.q); g.own = n; } catch (e) { return; }
    own[n] = 1; G.SAVE.markDirty(); M.give(g); G.UI.toast(n + '的專屬勾玉：' + ((M.K && M.K[g.k] && M.K[g.k][1]) || '') + '之玉'); }
  /* ---------- 禮物掉落 ---------- */
  (function hk() { const R = G.RPG; if (!R || !R.onKill) return setTimeout(hk, 80); const k0 = R.onKill; R.onKill = function (e) { const r = k0.apply(this, arguments); try { drop(e); } catch (x) {} return r; }; })();
  function chOf(id) { const d = G.D.scenes[id] || {}; if (d.ch) return d.ch; const m = /^W_R(\d\d)_/.exec(id); return m ? +m[1] : 0; }
  function drop(e) { if (!e || e.train) return; const c = chOf(SC.id); if (!c) return; const r = res().find(q => q[3] === c); if (!r) return;
    const p = e.bb || e.boss ? 0.5 : e.elite ? 0.12 : 0.02; if (Math.random() >= p) return; const g = gifts(); g[r[0]] = (g[r[0]] || 0) + 1; G.SAVE.markDirty(); G.UI.toast('獲得禮物：' + GIFT[r[0]] + '（' + r[0] + '喜歡的東西）'); }
  /* ---------- 村長 ---------- */
  const MN = { iron: '鐵砂', bone: '妖骨', cloth: '靈布', jade: '勾玉原石', ember: '鬼火炭' };
  function chief() { const rs = res(); if (!rs.length) return G.DLG.start([say('天狗長者', '村子還沒什麼住民呢。')]);
    const g = gifts(), held = rs.filter(r => g[r[0]] > 0), info = rs.map(r => r[0] + ' Lv' + lvOf(aff(r[0])) + '（' + aff(r[0]) + '）').join('、');
    G.DLG.start([say('天狗長者', '想跟住民們打好關係？送點他們喜歡的東西吧。'), say('', '好感：' + info), { choice: [
      { label: '送禮', then: held.length ? [{ choice: held.slice(0, 4).map(r => ({ label: r[0] + '・' + GIFT[r[0]] + ' ×' + g[r[0]], then: [{ do: () => give(r) }] })).concat([{ label: '取消', then: [] }]) }] : [say('天狗長者', '你身上沒有適合的禮物。打怪會掉，也可以在我這裡換。')] },
      { label: '兌換禮物', then: [{ choice: rs.slice(0, 4).map(r => ({ label: GIFT[r[0]] + '（' + r[0] + '）', then: [{ do: () => trade(r) }] })).concat(rs.length > 4 ? [{ label: '下一頁', then: [{ choice: rs.slice(4).map(r => ({ label: GIFT[r[0]] + '（' + r[0] + '）', then: [{ do: () => trade(r) }] })).concat([{ label: '取消', then: [] }]) }] }] : [{ label: '取消', then: [] }]) }] },
      { label: '離開', then: [] }] }]); }
  function give(r) { const g = gifts(); if (!(g[r[0]] > 0)) return; g[r[0]]--; addAff(r[0], 3); G.DLG.start([say('蒼真', '這是給你的，' + GIFT[r[0]] + '。'), say(r[0], THX[r[0]])]); }
  function trade(r) { const d = rd(), cost = (d.lv || 1) * 20, k = Object.keys(MN).find(q => (d.mats[q] || 0) >= 5);
    if (!k) return G.UI.toast('需要同一種素材 ×5（鐵砂／妖骨／靈布／勾玉原石／鬼火炭）'); if ((d.gold || 0) < cost) return G.UI.toast('錢不夠（需要 ' + cost + '）');
    d.mats[k] -= 5; d.gold -= cost; const g = gifts(); g[r[0]] = (g[r[0]] || 0) + 1; G.SAVE.markDirty(); G.UI.toast('用 ' + MN[k] + ' ×5＋錢 ' + cost + ' 換到 ' + GIFT[r[0]]); }
  function chiefMark() { if (SC.id !== VIL || !G.HUB || !res().length || G.HUB.marks.some(m => m.id === 'ychief')) return; const d = SC.def, c = (d.nodes || {}).center || d.start || [836, 600];
    const p = (SC.snap && SC.snap(c[0] - 160, c[1] + 40, 'open', 300)) || c; G.HUB.marks.push({ id: 'ychief', q: 1, x: p[0], y: p[1], label: '村長・禮物與好感', kind: 'look', main: false, run: chief }); }
  /* ---------- 戰鬥助戰 ---------- */
  let cdT = 0;
  const CH = [0, 0.08, 0.15, 0.25];
  function tryAssist(boss) { if (G.t < cdT || SC.id === VIL || !Y.spawnAlly || (Y.ally && Y.ally())) return; const L = res().filter(r => lvOf(aff(r[0])) >= 1).sort((a, b) => aff(b[0]) - aff(a[0])); if (!L.length) return;
    const r = L.find(q => Math.random() < CH[lvOf(aff(q[0]))]); cdT = G.t + (boss ? 3600 : 1800); if (!r) return; cdT = G.t + 10800;
    Promise.resolve(G.BOSS.load(r[2])).then(() => { if (Y.spawnAlly(r, H.x - (H.face || 1) * 90, H.y + 10, 1, 1800)) G.UI.banner(r[0] + '趕來助陣！', '好感 Lv' + lvOf(aff(r[0])) + '・30 秒'); }, () => 0); }
  (function hkB() { const B = G.BOSS; if (!B || !B.start) return setTimeout(hkB, 80); const bs0 = B.start; B.start = function () { const enc = bs0.apply(this, arguments); if (enc && !enc.wb2 && !(enc.name || '').includes('失控')) G.STORY.later(120, () => { if (B.enc === enc && !(enc.name || '').includes('失控')) tryAssist(1); }); return enc; }; })();
  (function hkS() { if (!G.STORY || !G.STORY.step) return setTimeout(hkS, 80); const st0 = G.STORY.step.bind(G.STORY); let tk = 0; G.STORY.step = function () { st0(); if (++tk % 60) return;
      chiefMark(); if (G.mode !== 'play' || (SC.def && SC.def.safe)) return; const n = G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.train && Math.hypot(e.x - H.x, e.y - H.y) < 420).length; if (n >= 4) tryAssist(0); }; })();
  G.YAFF = { aff, lvOf, addAff, GIFT, gem, chief, tryAssist, gifts };
})();
