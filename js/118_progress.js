/* ==========================================================================
 * 神諭之地 重製版 — 118_progress.js
 * Version : r3.83.0  (2026-11-25)
 * 變更    : r3.83.0 新增。掉落與進度（待辦 D1～D3）：
 *           D2 掉落等級：敵人／頭目掉的裝備等級＝max（地圖等級，主角等級＋巔峰等級）＋全遊戲難度加成（困難 +5、修羅 +12、無間 +20）。
 *              副本、合戰、名物原本的加成不動（它們自己傳入較高的等級時取較高者）。
 *           D3 裝備階級：每部位加 4 階（共 12 階），需求等級 52／68／84／100；圖示沿用同部位圖示換色（每階一色）。
 *           D1 跳章：選單測試跳章時，前面章節已標完成的任務會補跑「完成處理」（例：五條大橋 → flags.gojoDone，弁慶再戰、五條月夜才會出現）；補跑期間不跳橫幅。
 * 依賴    : 07_rpg（R.roll／onKill／TPL／make）、69_items（R.roll 包裝、R.icon、BOSS.onEnd）、73_diff（GDIFF）、72_testui（G.TEST.jump）、53_quest（G.QST）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG; if (!R || !R.TPL) return;
  const T = R.TPL, rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  /* ---------- D3：新增 4 階（每階 2 款，換色） ---------- */
  const NEW = {
    weapon: ['天羽羽斬', '布都御魂', '十拳劍', '天之尾羽張', '大典太', '數珠丸', '三日月宗近', '童子切安綱'],
    head: ['天狗兜', '雷神冠', '月讀面', '八幡兜', '金剛冠', '鬼神兜', '天照冠', '須佐兜'],
    body: ['天狗羽織', '雷神鎧', '月讀衣', '八幡大鎧', '金剛具足', '鬼神鎧', '天照衣', '須佐具足'],
    hands: ['天狗手甲', '雷神籠手', '月讀籠手', '八幡籠手', '金剛籠手', '鬼神腕', '天照籠手', '須佐籠手'],
    feet: ['天狗下駄', '雷神脛當', '月讀履', '八幡脛當', '金剛履', '鬼神足', '天照履', '須佐脛當'],
    charm: ['天狗之扇', '雷神之鼓', '月讀之鏡', '八幡之矢', '金剛杵', '鬼神之角', '天照之玉', '須佐之勾玉'] };
  const REQ = [1, 6, 11, 16, 21, 26, 31, 36, 52, 68, 84, 100], TINT = { 8: '70,190,200', 9: '160,110,230', 10: '220,70,70', 11: '235,190,80' };
  const HI = {};   // HI[slot][tier] = [id, id]
  for (const s of Object.keys(NEW)) { HI[s] = {}; NEW[s].forEach((n, i) => { const tier = 8 + (i >> 1), id = T.length; T.push({ id, slot: s, n, tier, req: REQ[tier] }); (HI[s][tier] = HI[s][tier] || []).push(id); }); }
  const tierOf = lv => { let t = 0; for (let i = 0; i < REQ.length; i++) if (lv >= REQ[i]) t = i; return t; };
  /* 掉落：等級夠高時換成高階款式（同部位；35% 機率低一階，與原本規則相同） */
  const rl0 = R.roll.bind(R); R.roll = function (lv, region) { let L = lv; if (inDrop > 0) L = dropLv(lv); const it = rl0(L, region); try { const t = T[it.t]; if (t && t.tier <= 7 && !t.jingi) { let tier = tierOf(L) - (Math.random() < 0.35 ? 1 : 0); if (tier >= 8 && HI[t.slot] && HI[t.slot][tier]) { const ids = HI[t.slot][tier]; it.t = ids[rnd(0, ids.length - 1)]; } } } catch (x) {} return it; };
  /* 圖示：高階沿用同部位圖示，疊一層該階顏色（只染在圖示本身） */
  const ic0 = R.icon; if (ic0) R.icon = it => { const n = ic0(it), t = it && T[it.t]; return t && t.tier >= 8 && TINT[t.tier] && n ? n + '#' + t.tier : n; };
  (function di() { if (!G.drawIcon || !G.UI8) return setTimeout(di, 50); const d0 = G.drawIcon, U = G.UI8, cache = {};
    G.drawIcon = function (name, x, y, s, alpha) { if (typeof name !== 'string' || name.indexOf('#') < 0) return d0.apply(this, arguments); const [base, tr] = name.split('#');
      if (!U.ready || !U.img.icons) return d0.call(this, base, x, y, s, alpha); const k = U.resolve(base), I = U.J.icons, p = I.i[k]; if (!p) return d0.call(this, base, x, y, s, alpha);
      const key = k + '#' + tr; let c = cache[key]; if (!c) { c = document.createElement('canvas'); c.width = c.height = I.s; const g = c.getContext('2d'); g.drawImage(U.img.icons, p[0], p[1], I.s, I.s, 0, 0, I.s, I.s);
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(' + TINT[tr] + ',.45)'; g.fillRect(0, 0, I.s, I.s); cache[key] = c; }   // 換色：只染圖示本身
      const ctx = G.ctx; if (alpha !== undefined) { ctx.save(); ctx.globalAlpha *= alpha; } ctx.drawImage(c, x, y, s, s); if (alpha !== undefined) ctx.restore(); return true; }; })();
  /* ---------- D2：掉落等級 ---------- */
  const DB = [0, 0, 5, 12, 20];   // 輕鬆／普通／困難／修羅／無間
  let inDrop = 0;
  function dropLv(lv) { const d = R.d(), hero = (d.lv || 1) + (d.pk || 0), gi = G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1; return Math.max(lv, hero) + (DB[gi] || 0); }
  const ok0 = R.onKill.bind(R); R.onKill = function () { inDrop++; try { return ok0.apply(this, arguments); } finally { inDrop--; } };
  (function be() { if (!G.BOSS || !G.BOSS.onEnd) return setTimeout(be, 100); const oe = G.BOSS.onEnd; G.BOSS.onEnd = function () { inDrop++; try { return oe.apply(this, arguments); } finally { inDrop--; } }; })();
  R.dropLv = dropLv;
  /* ---------- D1：跳章補跑任務完成處理 ---------- */
  let quietT = -1;
  (function bn() { if (!G.UI || !G.UI.banner) return setTimeout(bn, 50); const b0 = G.UI.banner; G.UI.banner = function () { if (G.t < quietT) return; return b0.apply(this, arguments); }; })();
  (function jw() { const TU = G.TEST || G.TESTUI; const T0 = TU && TU.jump; if (!T0) return setTimeout(jw, 100);
    TU.jump = function (q) { const r = T0.apply(this, arguments); const Q = G.QST, qs = G.SAVE.data.qs || {}; quietT = G.t + 400;
      for (const o of Q.L) { if (o === q || !(qs[o.id] && qs[o.id].done) || typeof o.done !== 'function') continue; try { o.done(); } catch (x) { console.warn('jump done', o.id, x); } }
      if (G.DLG) G.DLG.list = null; G.SAVE.markDirty(); return r; }; })();
})();
