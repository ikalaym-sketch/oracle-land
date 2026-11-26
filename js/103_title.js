/* ==========================================================================
 * 神諭之地 重製版 — 103_title.js
 * Version : r3.94.0  (2026-11-26)　r3.94.0：稱號攻擊% 改同區相加（R.addAtkP）
 * 舊版    : r3.62.0  (2026-11-24)
 * 變更    : r3.62.0 新增。稱號系統：18 個稱號，達成條件就解鎖；角色頁點稱號可更換，同時只能戴一個，各有小加成。
 *           ・計數：擊殺總數、鬼族擊殺、到過的探索區（rpg.tt）。擊殺時只加數字，不即時檢查；開稱號頁與進場時才檢查解鎖（避免每格判斷）。
 * 存檔    : rpg.title（目前稱號）、rpg.titles（已解鎖）、rpg.tt { k, oni, ex: {} }。
 * 依賴    : 07_rpg（recalc／onKill）、08_menu（角色頁、M.ui）、102_fstory（SHARD）、93_kassen（KS best）、100_meibutsu、28_trial。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, M = G.MENU, ctx = G.ctx, C = G.C, F = () => G.SAVE.data.flags; if (!R || !M) return;
  const d = () => R.d(), tt = () => d().tt || (d().tt = { k: 0, oni: 0, ex: {} }), KS = () => G.SAVE.data.kz || {};
  const ONI = /oni|kijo|shuten|ibaraki|hannya|onryo/;
  const own = () => { const L = Object.values(d().eq || {}).concat(d().bag || []).filter(it => it && it.uq); return new Set(L.map(it => it.uq)).size; };
  const trials = () => ['komakin', 'kinhannya', 'akaorochi', 'yorimitsu', 'owl', 'takemikazuchi', 'enno', 'katashiro', 'chigaeshi'].filter(k => F()['trial_' + k]).length;
  /* [代號, 名稱, 條件說明, 判斷, 加成, 加成說明] */
  const T = [
    ['ronin', '流浪劍客', '一開始就有', () => true, {}, '—'],
    ['kappa', '河童之友', '第 2 章和河童結為朋友', () => !!F().kappaFriend, { hpP: 3 }, '生命 +3%'],
    ['fox', '狐之盟約', '打倒第 3 章頭目', () => !!F().boss_W_R03_07, { crit: 2 }, '會心率 +2%'],
    ['oni100', '斬鬼者', '打倒鬼族 300 隻', () => tt().oni >= 300, { atkP: 3 }, '攻擊 +3%'],
    ['k1000', '千人斬', '打倒敵人 1000 隻', () => tt().k >= 1000, { atkP: 4, critD: 5 }, '攻擊 +4%、會心傷害 +5%'],
    ['k5000', '修羅', '打倒敵人 5000 隻', () => tt().k >= 5000, { atkP: 6, critD: 10 }, '攻擊 +6%、會心傷害 +10%'],
    ['explore', '踏遍山河', '到過 12 個探索區', () => Object.keys(tt().ex).length >= 12, { gf: 10, mf: 10 }, '金錢、寶物發現 +10%'],
    ['kassen', '守家大將', '守家合戰勝利（任一難度）', () => Object.keys(KS().clr || {}).length > 0, { defP: 3 }, '防禦 +3%'],
    ['endless', '無限之壁', '無限守家撐到第 20 波', () => Object.values(KS().best || {}).some(v => v >= 20), { defP: 5, hpP: 5 }, '防禦、生命 +5%'],
    ['meibutsu', '名物收藏家', '同時擁有 5 種名物', () => own() >= 5, { mf: 15 }, '寶物發現 +15%'],
    ['trial', '試煉踏破', '後山 9 場試煉全部達成', () => trials() >= 9, { atkP: 3, defP: 3, hpP: 3 }, '攻擊、防禦、生命 +3%'],
    ['peak', '巔峰之人', '巔峰等級 10', () => (d().pk || 0) >= 10, { cdr: 3 }, '冷卻 −3%'],
    ['guard', '寶珠守護者', '第 12 章時沒有任何碎片被奪', () => !!F().ch12 && G.SHARD && G.SHARD.count().stolen === 0, { atkP: 3, defP: 3, hpP: 3, crit: 2 }, '攻防血 +3%、會心率 +2%'],
    ['majin', '魔化見證者', '走上魔化路線', () => !!F().majinSeen, { atkP: 6, defP: -3 }, '攻擊 +6%、防禦 −3%'],
    ['true', '第三條路', '看到真結局', () => !!F().endSeen_true, { atkP: 5, defP: 5, hpP: 5 }, '攻擊、防禦、生命 +5%'],
    ['storm', '暴雨歸來', '看到暴雨結局', () => !!F().endSeen_storm, { critD: 15 }, '會心傷害 +15%'],
    ['nameless', '無名的守護者', '看到無名結局', () => !!F().endSeen_nameless, { hpP: 8 }, '生命 +8%'],
    ['oracle', '神諭者', '三種結局都看過', () => !!(F().endSeen_true && F().endSeen_storm && F().endSeen_nameless), { atkP: 6, defP: 6, hpP: 6, crit: 3 }, '攻防血 +6%、會心率 +3%'] ];
  const BY = {}; for (const t of T) BY[t[0]] = t;
  function check(silent) { const D = d(); D.titles = D.titles || { ronin: 1 }; let n = 0;
    for (const t of T) if (!D.titles[t[0]] && t[3]()) { D.titles[t[0]] = 1; n++; if (!silent) G.UI.banner('獲得稱號', '「' + t[1] + '」・' + t[5]); }
    if (n) G.SAVE.markDirty(); return n; }
  const cur = () => BY[d().title] && (d().titles || {})[d().title] ? d().title : 'ronin';
  /* 加成：recalc 時套用 */
  const rc0 = R.recalc.bind(R); R.recalc = function () { const r = rc0.apply(this, arguments), S = R.S, b = BY[cur()][4]; if (!S || !b) return r;
    if (b.atkP) R.addAtkP(b.atkP); if (b.defP) S.def = Math.round(S.def * (1 + b.defP / 100)); if (b.hpP) { S.hp = Math.round(S.hp * (1 + b.hpP / 100)); if (G.H) G.H.hpMax = S.hp; }
    for (const k of ['crit', 'critD', 'cdr', 'mf', 'gf']) if (b[k]) S[k] = (S[k] || 0) + b[k]; return r; };
  /* 計數 */
  const ok0 = R.onKill; R.onKill = function (e) { ok0.apply(this, arguments); if (!e || e.kz) return; const c = tt(); c.k++; if (ONI.test(e.type || '')) c.oni++; };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); const sd = G.D.scenes[id]; if (sd && sd.explore) tt().ex[id] = 1; G.STORY.later(120, () => { try { check(); } catch (e) {} }); };
  /* 稱號頁 */
  const TL = G.TITLE = { T, check, name: () => BY[cur()][1], cur, sel: 0,
    open() { check(true); TL.sel = Math.max(0, T.findIndex(t => t[0] === cur())); M.title = 1; } };
  const close0 = M.close.bind(M); M.close = function () { M.title = 0; close0(); };
  const draw0 = M.draw; M.draw = function () { if (!M.title) return draw0.apply(this, arguments); const { box, button, hit, clip, scrollArea } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.94)'; ctx.fillRect(0, 0, G.LW, G.LH); const L = 12 + G.SAFE.l, Tp = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * G.FS(), D = d(), own = D.titles || {};
    button(Rt - 84, Tp, 84, SH, '✕ 返回', () => { M.title = 0; }); G.txt('稱號', L + 6, Tp + SH / 2 + 1, 17, C.gold, 'left', G.FONT_S, 900);
    G.txt('已解鎖 ' + T.filter(t => own[t[0]]).length + '／' + T.length + '　目前：「' + TL.name() + '」', L + 70, Tp + SH / 2 + 1, 11, C.sub, 'left', G.FONT, 600);
    const top = Tp + SH + 10, h = B - top, lw = Math.min(330, (Rt - L) * 0.46), RH = 40 * G.FS(), tot = T.length * (RH + 4) + 8;
    box(L, top, lw, h); const off = scrollArea('title', L, top + 4, lw, h - 8, tot); clip(L, top + 4, lw, h - 8);
    T.forEach((t, i) => { const yy = top + 6 + i * (RH + 4) + off, ok = own[t[0]], on = i === TL.sel; if (yy + RH < top || yy > top + h) return;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(L + 6, yy, lw - 12, RH, 6); ctx.fill();
      G.txt((cur() === t[0] ? '◆ ' : '') + t[1], L + 16, yy + RH * 0.36, 13, ok ? C.ink : '#7a6f68', 'left', G.FONT_S, 900); G.txt(ok ? t[5] : '未解鎖・' + t[2], L + 16, yy + RH * 0.74, 10, ok ? '#86cf8f' : '#7a6f68', 'left', G.FONT, 600);
      hit(L + 6, Math.max(yy, top + 4), lw - 12, Math.min(RH, top + h - yy), () => { TL.sel = i; }); }); ctx.restore();
    const cx = L + lw + 10, cw = Rt - cx, t = T[TL.sel], ok = own[t[0]]; box(cx, top, cw, h);
    G.txt('「' + t[1] + '」', cx + 16, top + 28, 18, ok ? C.gold : '#a89a8f', 'left', G.FONT_S, 900);
    G.txt('條件：' + t[2], cx + 16, top + 62, 12, C.ink, 'left', G.FONT, 500); G.txt('加成：' + t[5], cx + 16, top + 86, 12, ok ? '#86cf8f' : C.sub, 'left', G.FONT, 600);
    if (t[0] === 'oni100' || t[0] === 'k1000' || t[0] === 'k5000') G.txt('目前：擊殺 ' + tt().k + '・鬼族 ' + tt().oni, cx + 16, top + 110, 11, C.sub, 'left', G.FONT, 500);
    if (t[0] === 'explore') G.txt('目前：' + Object.keys(tt().ex).length + '／12', cx + 16, top + 110, 11, C.sub, 'left', G.FONT, 500);
    const isCur = cur() === t[0]; button(cx + 16, top + h - 50, Math.min(200, cw - 32), 36, isCur ? '配戴中' : ok ? '配戴這個稱號' : '尚未解鎖', ok && !isCur ? () => { D.title = t[0]; R.recalc(); G.SAVE.markDirty(); G.UI.toast('稱號：「' + t[1] + '」'); } : null, ok && !isCur ? 'main' : 'off'); };
})();
