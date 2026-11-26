/* ==========================================================================
 * 神諭之地 重製版 — 135_bal12.js
 * Version : r3.107.0  (2026-11-26)
 * 變更    : r3.107.0 新增。平衡第 12 步：頭目無視嘲諷。
 *           ・修羅以上：頭目每 9 秒有 3 秒「怒視」——不管夥伴嘲諷、分身誘敵，只打主角（頭上跳「怒視」字樣）。
 *           ・同步完成（在其他檔）：03 暫時攻擊% 併入攻擊區；22／23 副本、合戰難度改疊等級；130 觸發特效同時 24 組。
 * 依賴    : 49_party（PARTY.targetOf）、128_bunshin（分身也走 targetOf）、73_diff（GDIFF.i）。
 * ========================================================================== */
'use strict';
(function () {
  const H = G.H, gi = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1);
  const glare = e => { if (gi() < 3 || !(e && (e.bb || e.boss))) return false; const ph = (G.t + (e.idx || 0) * 97) % 540; if (ph === 0 && e.st !== 'dead') G.NUMS.push({ x: e.x, y: e.y - G.HERO_H * (e.size || e.ratio || 1) * G.SC.depth(e.y) - 16, v: '怒視', t: 0, col: '#ff7a5a' }); return ph < 180; };
  (function hook() { const PY = G.PARTY; if (!PY || !PY.targetOf) return setTimeout(hook, 80); if (PY.targetOf._glare) return;
    const t0 = PY.targetOf; PY.targetOf = function (e) { return glare(e) ? H : t0.apply(this, arguments); }; PY.targetOf._glare = 1; })();
  G.BAL12 = { glare };
})();
