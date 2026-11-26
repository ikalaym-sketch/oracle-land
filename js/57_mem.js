/* ==========================================================================
 * 神諭之地 重製版 — 57_mem.js
 * Version : r3.17.1  (2026-11-14)
 * 變更    : r3.17.1 新增。記憶體回收：手機上長時間換圖後，敵人／路人／頭目的圖集一直累積（實測 14 次換圖約 52 百萬像素、解碼後約 200MB），
 *           手機瀏覽器會直接把頁面收掉（黑屏後回到首頁、沒有錯誤畫面）。改為每次換場後，把進入新場景後沒畫過（或 60 秒內沒畫過）的
 *           敵人（e_）、路人（n_）、頭目（b_）與非目前武器（w_）圖集釋放；總量低於 16 百萬像素時不動。
 *           保留：目前武器、共用特效、道具／佈景（pr_）、夥伴（p_）、介面；之後需要時會自動重新載入。
 * 依賴    : 12_anim（G.ANIM.load／draw／free）、06_story_ch1（G.STORY.onEnter／later）。
 * ========================================================================== */
'use strict';
(function () {
  const A = G.ANIM, KEEP_MS = 60000, BUDGET = 16e6; let enterT = 0;
  const now = () => performance.now();
  const d0 = A.draw; A.draw = function (u, ...r) { if (u) u.lu = now(); return d0.call(A, u, ...r); };
  const l0 = A.load; A.load = function (key, ...r) { const p = l0.call(A, key, ...r); Promise.resolve(p).then(u => { if (u) u.lu = now(); }, () => 0); return p; };
  const px = u => (u.imgs || []).reduce((s, im) => s + (im ? (im.naturalWidth || im.width || 0) * (im.naturalHeight || im.height || 0) : 0), 0);
  function trim() { const U = A.U, cur = 'w_' + G.WPN.curId(), t = now(); let tot = 0; for (const k in U) tot += px(U[k]); if (tot < BUDGET) return 0;
    const foes = new Set(((G.SC.def && G.SC.def.foes) || []).map(f => 'e_' + f).concat(['e_akaoni']));
    const L = Object.keys(U).filter(k => /^(e_|n_|b_|w_)/.test(k) && k !== cur && !foes.has(k) && U[k].ready && ((U[k].lu || 0) < enterT || t - (U[k].lu || 0) > KEEP_MS)).sort((a, b) => (U[a].lu || 0) - (U[b].lu || 0));
    let n = 0; for (const k of L) { if (tot < BUDGET) break; tot -= px(U[k]); A.free(k); if (k.startsWith('w_')) A.wpnLRU = A.wpnLRU.filter(x => x !== k); n++; }
    return n; }
  G.MEM = { trim, total: () => { let s = 0; for (const k in A.U) s += px(A.U[k]); return s; } };
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { enterT = now(); en0(id); G.STORY.later(90, trim); };   // 換場 1.5 秒後（新圖已開始載入）再回收
})();
