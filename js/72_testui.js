/* ==========================================================================
 * 神諭之地 重製版 — 72_testui.js
 * Version : r3.129.0  (2026-11-27)　r3.129.0：地圖分頁加「兩岸城外觀」切換
 * 舊版    : r3.124.0  (2026-11-26)　r3.124.0：里歐：提示改到 職業 › 最下面；招式全 Lv5 時外觀 Lv 至少 95；加「TP／氣 全滿」
 * 舊版    : r3.122.0  (2026-11-26)　r3.122.0：道具頁：錢改 +100 萬，新增妖玉、難度素材、藥品、巔峰、夥伴技能點、鎌鼬之羽、勾玉／玉屑／精煉材料、名物、妖怪村禮物；新「系統」頁：難度、轉生輪次、里歐、妖怪村（入住、好感、觸發四種事件）、世界事件類型、世界頭目；開關「奧義免 Lv40」改名「全部解鎖」
 * 舊版    : r3.83.0  (2026-11-25)　r3.83.0：跳章按鈕改走 T.jump（118 補跑任務完成處理）　r3.49.0  (2026-11-18)　r3.49.0：移除「招式試做」開關（新版招式正式開放）
 * 舊版    : r3.44.0  (2026-11-18)　r3.44.0：開關加「招式試做」（92_lab）
 * 舊版    : r3.34.0  (2026-11-17)　r3.34.0：武器頁加「判定框」開關、招式分類、秘傳直接施放
 * 舊版    : r3.32.0  (2026-11-17)　r3.32.0：等主迴圈載入完成才掛勾
 * 舊版    : r3.31.0  (2026-11-17)
 * 變更    : r3.31.0 新增。選單「測試」分頁重新設計（取代 14_cheat 的單頁長清單；開關沿用 G.CHEAT.on）。
 *           ・左側直排子分頁：開關／劇情／數值／武器／夥伴／地圖／生成／道具。
 *           ・按鈕高 ≥44px、字 14px；手機 2 欄、平板 3 欄。測試功能藍色；會改存檔的橘色，按一次變「再按一次確認」（2 秒內再按才執行）。
 *           ・劇情：選章 → 選任務 → 選步驟，直接跳到該步（前面章節的任務、頭目、夥伴加入自動補齊）並傳送到該步地圖；抉擇值可直接設定。
 *           ・數值：小雪好感 ±1、人妖羈絆（由抉擇決定）、心結，即時顯示結局走向。
 *           ・武器：6 種切換（沒有該類武器就直接給一把）；招式依中文名列出，點了關選單並施放；速度 1／0.5／0.25／暫停＋逐格；錨點顯示（刀刃點、槍口）。
 *           ・夥伴：加入／退出、設出戰位、單獨施放普攻／指令／大招。
 *           ・地圖：依章節分組傳送（城鎮、第 1～12 章、副本、任務地圖）。
 *           ・生成：一般怪、精英、本圖頭目重生、世界事件；清除敵人。
 *           ・道具：等級、技能點、錢、素材、生成裝備（品質＋武器種類）、三神器。
 * 依賴    : 08_menu（M.ui、M.PAGE）、14_cheat（G.CHEAT）、53_quest、52_hub、13_weapons、49_party、69_items、22_event。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU, CH = G.CHEAT; if (!M || !CH) return;
  const R = () => G.RPG, W = () => G.WPN, Q = () => G.QST, F = () => G.SAVE.data.flags, HUB = () => G.HUB;
  const T = G.TESTUI = { tab: 0, ch: 1, q: null, mg: 0, conf: null, confT: 0, wk: null, ts: 1, step1: 0, anchor: false };
  const TABS = ['開關', '劇情', '數值', '武器', '夥伴', '地圖', '生成', '道具', '系統'];
  const done = t => { G.SAVE.markDirty(); G.UI.toast(t); };
  /* ---------- 按鈕：藍＝測試、橘＝改存檔（要確認）、金＝選中 ---------- */
  let VIS = null;
  function btn(x, y, w, h, label, f, kind, key) { const fs = G.FS(), conf = kind === 'save' && T.conf === key && G.t - T.confT < 120;
    const P = { test: ['rgba(30,62,96,.95)', '#6fb0f0'], save: [conf ? 'rgba(160,80,24,.98)' : 'rgba(110,58,24,.95)', '#f0a052'], on: ['rgba(150,92,36,.95)', '#f3d98a'], off: ['rgba(40,32,36,.7)', 'rgba(227,194,122,.2)'] }[kind || 'test'];
    ctx.fillStyle = P[0]; G.rr(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = P[1]; ctx.lineWidth = 1.2; G.rr(x + .5, y + .5, w - 1, h - 1, 8); ctx.stroke();
    G.txt(conf ? '再按一次確認' : label, x + w / 2, y + h / 2 + 1, 14, kind === 'off' ? C.dim : '#f3ecd8', 'center', G.FONT, 700);
    if (kind === 'off' || !f) return; if (VIS && (y + h < VIS[0] || y > VIS[1])) return;
    M.ui.hit(x, y, w, h, kind === 'save' ? () => { if (T.conf === key && G.t - T.confT < 120) { T.conf = null; f(); } else { T.conf = key; T.confT = G.t; } } : f); }
  /* ---------- 劇情：跳到某任務某步 ---------- */
  const JOIN = [['shiroJoin', 2, null], ['join_shion', 3, 'shion'], ['join_kuzuha', 4, 'kuzuha'], ['join_hayate', 5, 'hayate'], ['join_ibaraki', 9, 'ibaraki']];   // 到這章（含）以後已加入
  function jump(q, si) { const Qs = Q(), f = F(), qs = G.SAVE.data.qs = {}; let before = true;
    for (const o of Qs.L) { if (o === q) before = false; if (o.ch < q.ch || (o.ch === q.ch && before && o.main)) qs[o.id] = { s: 0, done: 1 }; }
    if (si >= 0) qs[q.id] = { s: si, k: 0 };
    f.prologue = f.matsu = 1; for (let c = 1; c <= 12; c++) { if (c <= q.ch) { f['ch' + c] = 1; f['op' + c] = 1; } else { delete f['ch' + c]; delete f['clear' + c]; } }
    for (let c = 1; c < q.ch; c++) { f['clear' + c] = 1; const b = HUB().bossOf(c); if (b) f['boss_' + b] = 1; } if (q.ch > 1) f.nest = 1;
    for (const [k, c, id] of JOIN) { if (q.ch >= c) { if (!f[k]) { f[k] = 1; if (id && G.PARTY && G.PARTY.onJoin) G.PARTY.onJoin(id); } } }
    const st = si >= 0 ? q.steps[si] : q.giver, map = (st && st.map) || HUB().firstOf(q.ch);
    G.SAVE.markDirty(); M.close(); G.DLG.list = null; G.SC.trans = { t: 0, to: map === G.SC.id ? (map === 'hub_city' ? 'hub_shrine' : 'hub_city') : map, at: null };
    if (map === G.SC.id) G.STORY.later(90, () => { G.SC.trans = { t: 0, to: map, at: null }; });
    G.UI.toast('跳到：' + q.title + (si >= 0 ? '・步驟 ' + (si + 1) : '・委託')); }
  T.jump = jump;
  const CHOICES = () => { const o = []; for (const q of Q().L) for (const s of q.steps || []) if (s.t === 'choice' && s.key && !o.some(c => c.key === s.key)) o.push({ key: s.key, ch: q.ch, text: s.text || s.key, opts: s.opts.map(x => [x.v, x.label]) }); return o; };
  function endingNow() { const Qs = Q(), D = id => Qs.isDone(id), bond = Qs.bond(), xue = Qs.xue(), heart = ['c9_s_hayate', 'c10_s_shion'].filter(D).length + (Qs.choice('c6_confess') === 'confess' ? 1 : 0);
    return { bond, xue, heart, end: xue >= 6 && bond >= 2 && heart >= 2 ? 'true' : bond <= -2 ? 'storm' : 'nameless' }; }
  /* ---------- 速度控制 ---------- */
  function install() { const st0 = G.step; let acc = 0; G.step = function () { if (G.mode !== 'play' || T.ts === 1) return st0(); if (T.ts === 0) { if (T.step1 > 0) { T.step1--; st0(); } else G.UI.step(); return; } acc += T.ts; if (acc >= 1) { acc -= 1; st0(); } else G.UI.step(); };
    const ud0 = G.UI.draw; G.UI.draw = function () { ud0(); if (T.ts !== 1 && G.mode === 'play') G.txt(T.ts === 0 ? '⏸ 暫停（測試）' : '速度 ×' + T.ts, G.LW / 2, 86 + G.SAFE.t, 12, '#6fb0f0', 'center', G.FONT_S, 900);
      if (!T.anchor || G.mode !== 'play') return; const Wp = W(); for (const [fn, col] of [['bladePt', '#ffe066'], ['muzzle', '#ff6a6a']]) { let p = null; try { p = Wp[fn] && Wp[fn](); } catch (e) {} if (!p) continue; const x = p.x !== undefined ? p.x : p[0], y = p.y !== undefined ? p.y : p[1], s = G.SC.toScreen(x, y);
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, 6.283); ctx.moveTo(s.x - 10, s.y); ctx.lineTo(s.x + 10, s.y); ctx.moveTo(s.x, s.y - 10); ctx.lineTo(s.x, s.y + 10); ctx.stroke(); }
      const hs = G.SC.toScreen(G.H.x, G.H.y); ctx.strokeStyle = '#7fd6e6'; ctx.beginPath(); ctx.arc(hs.x, hs.y, 5, 0, 6.283); ctx.stroke(); }; }
  (function wait() { if (G.step && G.UI && G.UI.draw) install(); else setTimeout(wait, 20); })();
  /* ---------- 頁面 ---------- */
  M.PAGE['測試'] = function (x, y, w, h) { const fs = G.FS(), RH = Math.max(44, 44 * fs), gap = 8, lw = Math.min(124, w * 0.22), cx = x + lw + 10, cw = w - lw - 10, cols = cw > 520 ? 3 : 2;
    const two = TABS.length * (RH + 6) > h, tcol = two ? 2 : 1, tw = (lw - (tcol - 1) * 6) / tcol;   // 手機高度不夠：子分頁排成 2 欄
    TABS.forEach((t, i) => btn(x + (i % tcol) * (tw + 6), y + Math.floor(i / tcol) * (RH + 6), tw, RH, t, () => { T.tab = i; M.scroll.tui = 0; }, T.tab === i ? 'on' : 'test'));
    T.hh = T.hh || {}; const body = PAGES[T.tab], H0 = T.hh[T.tab] || 900, off = M.ui.scrollArea('tui', cx, y, cw, h, H0); M.ui.clip(cx, y, cw, h); VIS = [y, y + h];
    let yy = y + off; const head = t => { G.txt(t, cx + 2, yy + 13, 14, C.gold, 'left', G.FONT_S, 900); yy += 30; };
    const grid = (list, n, f) => { const bw = (cw - (n - 1) * gap) / n; list.forEach((it, i) => f(it, cx + (i % n) * (bw + gap), yy + Math.floor(i / n) * (RH + gap), bw)); yy += Math.ceil(list.length / n) * (RH + gap) + 6; };
    const text = (t, col) => { G.txt(t, cx + 4, yy + 12, 13, col || C.ink, 'left', G.FONT, 600); yy += 24; };
    body.draw({ cx, cw, cols, RH, gap, head, grid, text, get y() { return yy; }, set y(v) { yy = v; } }); T.hh[T.tab] = yy - (y + off) + 24; ctx.restore(); VIS = null; };   // 內容高度留到下一格用
  const PAGES = [
    { draw(u) { u.head('開關（只在這次遊玩有效）'); const TOG = [['god', '無敵'], ['kill', '秒殺'], ['nocd', '技能無冷卻'], ['qi', '氣永遠滿'], ['free', '免費學技能'], ['unlock', '全部解鎖'], ['fps', '顯示 FPS'], ['walk', '顯示可走範圍']];
        u.grid(TOG, u.cols, ([k, n], bx, by, bw) => btn(bx, by, bw, u.RH, n + '：' + (CH.on[k] ? '開' : '關'), () => { CH.on[k] = !CH.on[k]; }, CH.on[k] ? 'on' : 'test'));
        u.grid([['回復全滿', () => { G.H.hp = G.H.hpMax; R().d().qi = 100; G.UI.toast('生命・氣 全滿'); }]], u.cols, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f)); } },
    { draw(u) { u.head('章節'); u.grid(Array.from({ length: 12 }, (_, i) => i + 1), 6, (c, bx, by, bw) => btn(bx, by, bw, u.RH, '' + c, () => { T.ch = c; T.q = null; M.scroll.tui = 0; }, T.ch === c ? 'on' : 'test'));
        const L = Q().L.filter(q => q.ch === T.ch).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0)), qs = G.SAVE.data.qs || {};
        u.head('任務（點任務展開步驟；橘色＝跳過去，會改存檔）');
        for (const q of L) { const s = qs[q.id], st = s ? (s.done ? '完成' : '步驟 ' + (s.s + 1)) : '未接';
          u.grid([q], 1, (q2, bx, by, bw) => btn(bx, by, bw, u.RH, (q.main ? '【主線】' : q.boss ? '【頭目委託】' : '【支線】') + q.title + '　（' + st + '）', () => { T.q = T.q === q.id ? null : q.id; }, T.q === q.id ? 'on' : 'test'));
          if (T.q === q.id) { const S = (q.giver ? [[-1, '委託：' + (q.giver.name || '')]] : []).concat(q.steps.map((p, i) => [i, (i + 1) + '．' + (p.text || p.label || p.t)]));
            u.grid(S, 1, ([i, n], bx, by, bw) => btn(bx + 16, by, bw - 16, u.RH, n, () => T.jump(q, i), 'save', 'j' + q.id + i)); } }
        u.head('抉擇（直接設定結果）'); for (const c of CHOICES().filter(c => c.ch === T.ch)) { u.text(c.text + '　目前：' + (Q().choice(c.key) || '未選'));
          u.grid(c.opts, Math.min(u.cols, c.opts.length), ([v, l], bx, by, bw) => btn(bx, by, bw, u.RH, l, () => { (G.SAVE.data.qc = G.SAVE.data.qc || {})[c.key] = v; done('抉擇：' + l); }, Q().choice(c.key) === v ? 'on' : 'save', 'c' + c.key + v)); } } },
    { draw(u) { const e = endingNow(), NM = { true: '真結局（晴）', storm: '暴雨結局（雨）', nameless: '無名結局（霧）' };
        u.head('目前結局走向：' + NM[e.end]); u.text('小雪好感 ' + e.xue + '／6　人妖羈絆 ' + e.bond + '（真 ≥2、暴雨 ≤−2）　心結 ' + e.heart + '／2');
        u.grid([['小雪好感 +1', 1], ['小雪好感 −1', -1]], 2, ([n, v], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { const g = G.SAVE.data; g.xueLove = (g.xueLove || 0) + v; done('小雪好感 ' + Q().xue()); }, 'save', 'x' + v));
        u.head('人妖羈絆的五個抉擇（偏妖怪 +1、偏人類 −1）'); const BK = ['c2_stone', 'c5_truth', 'c8_feast', 'c9_spider', 'c10_tide'];
        for (const c of CHOICES().filter(c => BK.includes(c.key))) { u.text('第 ' + c.ch + ' 章：' + c.text + '　目前：' + (Q().choice(c.key) || '未選'));
          u.grid(c.opts, Math.min(u.cols, c.opts.length), ([v, l], bx, by, bw) => btn(bx, by, bw, u.RH, l, () => { (G.SAVE.data.qc = G.SAVE.data.qc || {})[c.key] = v; done(l); }, Q().choice(c.key) === v ? 'on' : 'save', 'b' + c.key + v)); }
        u.head('心結'); u.grid([['颯的支線完成', 'c9_s_hayate'], ['汐音的支線完成', 'c10_s_shion']], 2, ([n, id], bx, by, bw) => btn(bx, by, bw, u.RH, n + (Q().isDone(id) ? ' ✓' : ''), () => { const qs = G.SAVE.data.qs = G.SAVE.data.qs || {}; if (qs[id] && qs[id].done) delete qs[id]; else qs[id] = { s: 0, done: 1 }; done(n); }, Q().isDone(id) ? 'on' : 'save', 'h' + id)); } },
    { draw(u) { const Wp = W(), cur = Wp.cur(); u.head('武器（目前：' + cur.n + '）');
        u.grid(Wp.LIST, u.cols, (wp, bx, by, bw) => btn(bx, by, bw, u.RH, wp.n, () => { const d = R().d(); if (!d.bag.some(it => R().TPL[it.t].slot === 'weapon' && (it.wk || 'katana') === wp.id) && (d.eq.weapon.wk || 'katana') !== wp.id) { const it = R().make(0, 0, 1, [], null); it.wk = wp.id; d.bag.push(it); } Wp.equip(wp.id); }, wp.id === cur.id ? 'on' : Wp.loading ? 'off' : 'test'));
        u.head('速度'); u.grid([[1, '×1'], [0.5, '×0.5'], [0.25, '×0.25'], [0, '暫停']], 4, ([v, n], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { T.ts = v; }, T.ts === v ? 'on' : 'test'));
        u.grid([['逐格（暫停時前進 1 格）', () => { T.ts = 0; T.step1 = 1; }], ['錨點：' + (T.anchor ? '開' : '關'), () => { T.anchor = !T.anchor; }], ['判定框：' + (G.VX && G.VX.showHit ? '開' : '關'), () => { G.VX.showHit = !G.VX.showHit; }]], 3, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f));
        u.text('錨點：黃＝刀刃點、紅＝槍口、青＝主角腳下。判定框（綠）＝招式實際打得到的範圍。', C.sub);
        const cast = (k, id) => { M.close(); const sl = Wp.slots(), d = R().d(); d.wsk = d.wsk || {}; if (k === 'sk') { if (!Wp.lv(id)) d.wsk[Wp.key(id)] = 1; sl.A = id; G.STORY.later(6, () => { G.IN.skA = true; }); } else if (k === 'mv') { Wp.setC(0, id); G.STORY.later(6, () => { G.IN.c1 = true; }); } else if (k === 'ult') G.STORY.later(6, () => { R().d().qi = 100; G.IN.ult = true; }); else G.STORY.later(6, () => { G.IN.atk = true; }); };
        u.head('招式（點了關選單並施放）'); u.grid([['普攻', 'atk', 0], ['奧義', 'ult', 0]].concat(cur.sk.filter(s => s.t !== '奧義').map(s => [s.n + '（' + s.t + '）', 'sk', s.id]), (cur.mv || []).map(m => [m.n + '（' + ((G.MV2 && G.MV2.CATN[m.cat]) || '招式') + '）', 'mv', m.id])), u.cols, ([n, k, id], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => cast(k, id)));
        const HD = (G.MV2 && G.MV2.HD[cur.id]) || []; if (HD.length) { u.head('秘傳（直接施放，不算參悟）'); u.grid(HD.map(q => [q.n, q.id]), u.cols, ([n, id], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { M.close(); G.STORY.later(6, () => G.MV2.play(id)); })); } } },
    { draw(u) { const PY = G.PARTY, ids = Object.keys(PY.DEF), s = PY.slots(), f = F(); u.head('夥伴（加入會改存檔）');
        for (const id of ids) { const D = PY.DEF[id], jk = id === 'shiro' ? 'shiroJoin' : 'join_' + id, on = !!f[jk]; u.text(D.name + (on ? '　已加入' : '　未加入') + (s.includes(id) ? '・出戰 ' + (s.indexOf(id) + 1) : ''));
          const P = PY.list.find(p => p.id === id), act = n => () => { if (!P) return G.UI.toast('先設出戰並關選單'); M.close(); G.STORY.later(6, () => PY.cast(P, n, 'tap')); };
          u.grid([[on ? '退出' : '加入', () => { if (on) { delete f[jk]; const i = s.indexOf(id); if (i >= 0) PY.setSlot(i, null); } else { f[jk] = 1; PY.onJoin(id); } done(D.name + (on ? ' 退出' : ' 加入')); }, 'save'], ['出戰 1', () => PY.setSlot(0, id), on ? 'test' : 'off'], ['出戰 2', () => PY.setSlot(1, id), on ? 'test' : 'off'], ['普攻', act('ordinary'), P ? 'test' : 'off'], ['指令', act('command'), P ? 'test' : 'off'], ['大招', act('grandCombo'), P ? 'test' : 'off']], u.cols === 3 ? 6 : 3,
            ([n, fn, k], bx, by, bw) => btn(bx, by, bw, u.RH, n, fn, k, 'p' + id + n)); } } },
    { draw(u) { const S = G.D.scenes, WD = G.WORLD, grp = [['城鎮', Object.keys(S).filter(i => /^(hub_|T_)/.test(i))]];
        for (let c = 1; c <= 12; c++) grp.push(['第 ' + c + ' 章', HUB().ids(c).filter(i => S[i])]); grp.push(['副本', Object.keys(S).filter(i => /^D_/.test(i))], ['任務地圖', Object.keys(S).filter(i => S[i].quest && !/^(hub_|T_|D_)/.test(i))]);
        u.head('分組'); u.grid(grp.map((g, i) => [g[0], i]), u.cols === 3 ? 5 : 4, ([n, i], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { T.mg = i; }, T.mg === i ? 'on' : 'test'));
        u.head('傳送：' + grp[T.mg][0]); u.grid(grp[T.mg][1], u.cols, (id, bx, by, bw) => btn(bx, by, bw, u.RH, S[id].name || id, () => { M.close(); G.DLG.list = null; G.SC.trans = { t: 0, to: id, at: null }; }, id === G.SC.id ? 'off' : 'test'));
        if (G.HUBV) { u.head('兩岸城外觀（目前：' + (G.HUBV.cur || '白天') + '）'); u.grid(G.HUBV.opts, u.cols === 3 ? 5 : 4, ([n, v], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { M.close(); G.HUBV.set(v); if (G.SC.id !== 'hub_city') G.SC.trans = { t: 0, to: 'hub_city', at: null }; }, G.HUBV.force === v ? 'on' : 'test')); } } },   // r3.129.0
    { draw(u) { const spawn = (n, el) => { const foes = (G.WORLD.meta[G.SC.id] || {}).foes || G.SC.def.foes || ['akaoni']; Promise.resolve(G.ASSET.enemies(foes)).then(() => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, x = G.H.x + Math.cos(a) * 220, y = G.H.y + Math.sin(a) * 70; if (!G.SC.walkable(x, y)) continue; const e = G.spawnOni(x, y, i * 15, null, foes[i % foes.length]); if (e && el) { e.elite = '精英'; e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio *= 1.15; } } G.UI.toast('生成 ' + n + (el ? ' 精英' : ' 隻')); }); M.close(); };
        u.head('生成'); u.grid([['一般怪 ×5', () => spawn(5)], ['精英 ×1', () => spawn(1, 1)], ['本圖頭目重生', () => { const id = G.SC.id; delete F()['boss_' + id]; if (G.SAVE.data.bossT) delete G.SAVE.data.bossT[id]; M.close(); G.SC.trans = { t: 0, to: id, at: null }; }, 'save'],
          ['世界事件（本圖）', () => { G.SAVE.data.wev = { k: 'invade', map: G.SC.id, until: Date.now() + 20 * 60000, done: 0 }; M.close(); G.SC.trans = { t: 0, to: G.SC.id, at: null }; }, 'save'], ['清除敵人', () => { for (const e of G.E) if (e.st !== 'dead') { e.st = 'dead'; e.t = 0; } G.UI.toast('已清除'); }]], u.cols,
          ([n, f, k], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, k, 'g' + n)); } },
    { draw(u) { const d = R().d(); u.head('角色（會改存檔）');
        const L = [['等級 +10', () => { for (let i = 0; i < 10 && d.lv < 100; i++) { d.lv++; d.sp += 2; } d.exp = 0; R().recalc(); G.H.hp = G.H.hpMax; done('Lv ' + d.lv); }], ['等級 100', () => { d.sp += (100 - d.lv) * 2; d.lv = 100; d.exp = 0; R().recalc(); done('Lv 100'); }], ['技能點 +20', () => { d.sp += 20; done('技能點 ' + d.sp); }],
          ['錢 +100 萬', () => { d.gold += 1000000; done('錢 ' + G.fmtN(d.gold)); }], ['素材各 +50', () => { for (const k in R().MATS) d.mats[k] = (d.mats[k] || 0) + 50; done('素材各 +50'); }], ['此武器熟練滿', () => { const p = W().prof(); p.lv = W().PROF_MAX; p.exp = 0; done('熟練度滿'); }]];
        u.grid(L, u.cols, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, 'save', 'i' + n));
        /* r3.122.0：新系統的道具 */
        const MG = G.MAGA, Y = G.YAFF, ME = G.MEIBUTSU, L2 = [['妖玉 +1000', () => { d.yg = (d.yg || 0) + 1000; done('妖玉 ' + d.yg); }],
          ['難度素材各 +50', () => { const m = d.dm || (d.dm = { reisa: 0, yosho: 0, shura: 0, mugen: 0 }); for (const k of ['reisa', 'yosho', 'shura', 'mugen']) m[k] = (m[k] || 0) + 50; done('靈砂／妖晶／修羅之魂／無間之核 各 +50'); }],
          ['藥品各 +20', () => { const c = d.cons || (d.cons = { herb: 0, herb2: 0 }); for (const k in c) c[k] = (c[k] || 0) + 20; done('藥品各 +20'); }],
          ['巔峰 +50', () => { d.pk = (d.pk || 0) + 50; d.pp = (d.pp || 0) + 50; R().recalc(); done('巔峰 ' + d.pk); }],
          ['夥伴技能點 +20', () => { const s = G.SAVE.data, rb = s.rb || (s.rb = { n: 0, pb: 0, hist: [] }); rb.pb = (rb.pb || 0) + 20; done('每位夥伴技能點 +20'); }],
          ['鎌鼬之羽', () => { F().kamaFeather = 1; done('獲得 鎌鼬之羽'); }]];
        if (MG && MG.data) L2.push(['勾玉隨機 ×10', () => { const m = MG.data(); m.on = 1; for (let i = 0; i < 10; i++) MG.give(MG.rollGem(Math.max(1, d.lv)), true); done('勾玉 +10（玉匣）'); }],
          ['玉屑 +500・精煉材料各 +50', () => { const m = MG.data(); m.on = 1; m.dust = (m.dust || 0) + 500; for (const k of ['whet', 'marrow', 'fuse', 'wash', 'guard', 'incense', 'seal']) m.it[k] = (m.it[k] || 0) + 50; done('玉屑 +500、精煉材料各 +50'); }]);
        if (ME && ME.make) L2.push(['名物 1 件（隨機）', () => { const ks = Object.keys(ME.UQ), it = ME.make(ks[Math.floor(Math.random() * ks.length)], d.lv); if (it && R().addItem(it)) done('獲得名物【' + R().name(it) + '】'); }]);
        if (Y && Y.gifts) L2.push(['妖怪村禮物各 +5', () => { const g = Y.gifts(); for (const k in Y.GIFT) g[k] = (g[k] || 0) + 5; done('每位頭目的禮物 +5'); }]);
        u.head('新系統道具'); u.grid(L2, u.cols, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, 'save', 'n' + n));
        u.head('生成裝備：品質'); u.grid(R().QUAL, 6, (q, bx, by, bw) => btn(bx, by, bw, u.RH, q.n, () => { CH.q = R().QUAL.indexOf(q); }, CH.q === R().QUAL.indexOf(q) ? 'on' : 'test'));
        u.head('生成裝備：武器種類（不選＝隨機部位）'); u.grid([[null, '隨機部位']].concat(W().LIST.map(w => [w.id, w.n])), u.cols === 3 ? 7 : 4, ([k, n], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { T.wk = k; }, T.wk === k ? 'on' : 'test'));
        u.grid([['生成 1 件', () => { let it; for (let i = 0; i < 200; i++) { it = R().roll(Math.max(1, d.lv), null); if (!T.wk || R().TPL[it.t].slot === 'weapon') break; } if (T.wk) it.wk = T.wk; it.q = CH.q; const Qd = R().QUAL[CH.q], keys = Object.keys(R().AFF); it.aff = [];
          for (let i = 0; i < Qd.aff; i++) { const k = keys[Math.floor(Math.random() * keys.length)]; it.aff.push([k, Math.round(R().AFF[k][1] * (1 + d.lv * 0.18) * 10) / 10]); } if (R().addItem(it)) done('獲得【' + Qd.n + '】' + R().name(it)); }],
          ['三神器各 1 件', () => { for (const k of ['t_akaorochi', 't_komakin', 't_kinhannya']) { delete F()['jingi_' + R().TPL[G.ITEMS.JG[k]].jingi]; G.BOSS.onEnd({ id: k }); } }]], 2, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, 'save', 'k' + n)); } },
    /* r3.122.0：系統（難度、轉生、里歐、妖怪村、世界） */
    { draw(u) { const S0 = G.SAVE.data, d = R().d(), DF = G.GDIFF || [];
        u.head('難度（目前：' + ((DF[S0.gdiff === undefined ? 1 : S0.gdiff] || {}).n || '?') + '）'); u.grid(DF.map((q, i) => [q.n, i]), Math.min(5, u.cols + 2), ([n, i], bx, by, bw) => btn(bx, by, bw, u.RH, n, () => { S0.gdiff = i; done('難度：' + n); }, (S0.gdiff === undefined ? 1 : S0.gdiff) === i ? 'on' : 'save', 'df' + i));
        const rb = S0.rb || { n: 0 }; u.head('轉生輪次（目前第 ' + ((rb.n || 0) + 1) + ' 輪；敵人等級 +' + (G.REBIRTH ? G.REBIRTH.bonus() : 0) + '）');
        u.grid([0, 1, 2, 3, 4], 5, (n, bx, by, bw) => btn(bx, by, bw, u.RH, '第 ' + (n + 1) + ' 輪', () => { const r = S0.rb || (S0.rb = { n: 0, pb: 0, hist: [] }); r.n = n; done('轉生輪次：第 ' + (n + 1) + ' 輪'); }, (rb.n || 0) === n ? 'on' : 'save', 'rb' + n));
        const LE = G.LEON; if (LE) { const ld = LE.SAV(); u.head('里歐（外觀 Lv ' + ld.lv + '・技能點 ' + ld.pt + (F().leonOpen ? '・已解鎖' : '') + '）');
          u.grid([['解鎖里歐', () => { F().leonOpen = 1; LE.boot(); done('里歐外觀已解鎖（選單 › 角色 › 職業 › 最下面）'); }], ['外觀 Lv +10', () => { ld.lv = Math.min(100, ld.lv + 10); ld.pt += 20; done('里歐外觀 Lv ' + ld.lv); }],
            ['技能點 +20', () => { ld.pt += 20; done('里歐技能點 ' + ld.pt); }], ['已開放招式全部 Lv5', () => { const m = LE.META; if (!m) return G.UI.toast('里歐素材載入中，稍後再按'); let n = 0; for (const c in m) if (LE.open(c)) { ld.sk[c] = 5; n++; } ld.lv = Math.max(ld.lv, 95); done(n + ' 招 → Lv5'); }], ['TP／氣 全滿', () => { ld.tp = 100; G.RPG.d().qi = 100; done('TP 100・氣 100'); }]],
            u.cols, ([n, f], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, 'save', 'le' + n)); }
        const YV = G.YVENT, Y = G.YAFF; if (YV && YV.R) { u.head('妖怪村（入住 ' + YV.residents().length + '／' + YV.R.length + '）');
          const goV = fn => () => { const sv = S0.yev || (S0.yev = { cd: {} }); sv.cd = {}; sv.find = null; sv.hunt = null; M.close(); G.DLG.list = null; const run = () => { const ok = fn(); if (ok === false) G.UI.toast('條件不足（入住頭目不夠或事件進行中）'); };
            if (G.SC.id === 'T_yokai') G.STORY.later(10, run); else { G.SC.trans = { t: 0, to: 'T_yokai', at: null }; G.STORY.later(150, run); } };
          u.grid([['頭目全部入住', () => { for (const r of YV.R) F()['yv_' + r[1]] = 1; done('妖怪村頭目全部入住（進村生效）'); }, 'save'],
            ['好感 +1 級（全部）', () => { if (!Y) return; for (const r of YV.R) { const v = Y.aff(r[0]), nx = v < 5 ? 5 : v < 15 ? 15 : v < 30 ? 30 : v; if (nx > v) Y.addAff(r[0], nx - v); } done('全部頭目好感 +1 級'); }, 'save'],
            ['觸發：外敵來襲', goV(YV.raid)], ['觸發：頭目失控', goV(YV.ramp)], ['觸發：頭目尋物', goV(YV.find)], ['觸發：追世界頭目', goV(YV.hunt)]],
            u.cols, ([n, f, k], bx, by, bw) => btn(bx, by, bw, u.RH, n, f, k || 'test', 'yv' + n)); }
        const EVX = G.EVX; if (EVX && EVX.WEV) { u.head('世界事件（在目前地圖觸發）');
          u.grid(Object.keys(EVX.WEV).filter(k => EVX.WEV[k] && EVX.WEV[k].n && EVX.WEV[k].T), u.cols, (k, bx, by, bw) => btn(bx, by, bw, u.RH, (EVX.WEV[k].T ? '【' + EVX.WEV[k].T + '】' : '') + EVX.WEV[k].n, () => { S0.wev = { k, map: G.SC.id, until: Date.now() + 10 * 60000, done: 0 }; M.close(); G.DLG.list = null; G.SC.trans = { t: 0, to: G.SC.id, at: null }; }, 'test')); }
        const WB = G.WB2, BD = G.BOSS && G.BOSS.DEF; if (WB && BD) { const L = WB.pool(); u.head('世界頭目（目前可出現 ' + L.length + ' 隻；點了直接前往）'); if (!L.length) u.text('第 3 章以後、打過該章頭目才會進入名單', C.sub);
          u.grid(L, u.cols, (q, bx, by, bw) => btn(bx, by, bw, u.RH, (q.ph ? '幻影・' : '') + (BD[q.id] ? BD[q.id].name : q.id), () => { const t = Date.now(); S0.wb2 = { id: q.id, map: q.maps[0], n: (q.ph ? '幻影・' : '') + BD[q.id].name, ph: q.ph, until: t + 15 * 60000, next: t + 30 * 60000, done: 0 }; M.close(); G.DLG.list = null; WB.goBoss(); }, 'test')); } } }
  ];
})();
