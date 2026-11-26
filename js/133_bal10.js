/* ==========================================================================
 * 神諭之地 重製版 — 133_bal10.js
 * Version : r3.105.0  (2026-11-26)
 * 變更    : r3.105.0 新增。平衡第 10 步：經驗依等級差、自動分解。
 *           ・經驗等級差（擊殺經驗，含難度加成）：
 *             敵人比主角高 → 每高 1 級 +3%，最多 +30%。
 *             敵人比主角低 10 級以上 → 第 10 級起每低 1 級 −10%，最低 10%（低 9 級以內不扣）。
 *           ・自動分解（選單 › 系統 › 設定「自動分解」：關／凡品／良品以下／精品以下）：
 *             撿到符合品質、沒有套裝的裝備直接換成錢（精品另給精煉石 1）；3 秒內合併成一則提示。
 *           ・另見：07_rpg 裝備 100 級以後每級 +1.2%；03_actors 傷害數字「萬」。
 * 存檔    : save.autoSalv（0～3）。
 * 依賴    : 07_rpg（onKill／gainExp／addItem／value／QUAL）、16_growth（設定頁 G.SET_EXTRA）、105_forge2（精煉石 rpg.fm.stone）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG; if (!R) return;
  /* ---------- 經驗等級差 ---------- */
  function expK(elv) { const lv = (R.d() && R.d().lv) || 1, d = (elv || 1) - lv; if (d > 0) return 1 + Math.min(0.3, d * 0.03); if (d <= -10) return Math.max(0.1, 1 - (-d - 9) * 0.1); return 1; }
  const k0 = R.onKill; R.onKill = function (e) { const k = e && !e.train ? expK(e.lv) : 1; if (k === 1) return k0.apply(this, arguments);
    const g0 = R.gainExp; R.gainExp = function (n) { return g0.call(R, Math.max(1, Math.round(n * k))); }; try { return k0.apply(this, arguments); } finally { R.gainExp = g0; } };
  /* ---------- 自動分解 ---------- */
  const AS = ['關', '凡品', '良品以下', '精品以下'], lvA = () => G.SAVE.data.autoSalv | 0;
  let acc = null;
  const ad0 = R.addItem; R.addItem = function (it) { const m = lvA(); if (!it || !m || it.set || it.lk || it.uq || it.q > m - 1) return ad0.apply(this, arguments);
    const g = R.value(it), d = R.d(); d.gold += g; let st = 0; if (it.q >= 2) { const f = d.fm || (d.fm = { stone: 0, guard: 0, luck: 0 }); f.stone = (f.stone || 0) + 1; st = 1; } G.SAVE.markDirty();
    if (!acc) { acc = { n: 0, g: 0, st: 0 }; setTimeout(() => { const a = acc; acc = null; if (a && a.n) G.UI.toast('自動分解 ' + a.n + ' 件　錢 +' + a.g + (a.st ? '　精煉石 +' + a.st : '')); }, 3000); }
    acc.n++; acc.g += g; acc.st += st; return true; };
  G.SET_EXTRA = (G.SET_EXTRA || []).concat([() => ['自動分解', AS[lvA()], () => { G.SAVE.data.autoSalv = (lvA() + 1) % 4; G.SAVE.markDirty(); G.UI.toast(lvA() ? '撿到' + AS[lvA()] + '的裝備會直接換成錢（套裝不會）' : '自動分解：關'); }]]);
  G.BAL10 = { expK };
})();
