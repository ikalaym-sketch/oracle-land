/* ==========================================================================
 * 神諭之地 重製版 — 107_ux2.js
 * Version : r3.65.0  (2026-11-24)
 * 變更    : r3.65.0 新增。試玩回饋第二批：
 *           1. 出怪分散：地圖自動出怪（含探索區波次）改成「分段」放置——地圖橫向切成 n 段，每段 1 隻，
 *              互相至少 140px（找不到就放寬到 100、60），有遮罩的地圖只選寬敞點（不會再被拉到同一塊空地）。
 *              出場時間依序錯開。事件、任務波次的出怪沿用原本的環狀位置。
 *           2. 任務頁分頁：本章（預設）／主線／支線・委託／已完成，各標數量；已完成獨立一頁。
 *           ・效能：出怪只在一批生成時計算；分頁數量只在任務頁開著時算。
 * 存檔    : rpg.qtab（任務頁目前分頁）。
 * 依賴    : 02_scene（autoSpawn、walkable）、25_walk（room／遮罩）、03_actors（spawnOni）、53_quest（任務頁、Q.L、isDone）、52_hub（HUB.cur）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, M = G.MENU, Q = G.QST;
  /* ---------- 1. 出怪分散（開機後包在最外層，所有 autoSpawn／spawnOni 包裝都已就緒） ---------- */
  const SP = G.SPREAD = { on: false, seg: null, k: 0, pts: [] };
  function pick(x0, y0) { const d = SC.def, H = G.H, segs = SP.seg, n = segs.length, k = segs[SP.k++ % n], sw = (d.w - 240) / n, live = G.E.filter(e => e.st !== 'dead').map(e => [e.x, e.y]).concat(SP.pts);
    for (const gap of [140, 100, 60]) for (let t = 0; t < 40; t++) {
      const x = 120 + sw * (k + Math.random()), y = SC.y0 + Math.random() * (SC.y1 - SC.y0);
      if (!SC.walkable(x, y) || Math.hypot(x - H.x, y - H.y) < 260) continue; if (d.mask && SC.room && SC.room(x, y) < 3) continue;
      if (live.some(p => Math.hypot(p[0] - x, (p[1] - y) * 1.4) < gap)) continue; return [x, y]; }
    return [x0, y0]; }
  function install() {
    const as0 = SC.autoSpawn; SC.autoSpawn = function () { const d = this.def; if (!d || d.safe || !d.spawn) return as0.apply(this, arguments);
      const n = Math.max(2, d.spawn[1] || 6), seg = []; for (let i = 0; i < n; i++) seg.push(i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [seg[i], seg[j]] = [seg[j], seg[i]]; }
      SP.on = true; SP.seg = seg; SP.k = 0; SP.pts = []; try { return as0.apply(this, arguments); } finally { SP.on = false; SP.pts = []; } };
    const so0 = G.spawnOni; G.spawnOni = function (x, y, delay) { if (SP.on && SC.def) { const p = pick(x, y); x = p[0]; y = p[1]; SP.pts.push(p); arguments[0] = x; arguments[1] = y; arguments[2] = 20 + (SP.k - 1) * 28; }
      return so0.apply(this, arguments); }; }
  const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { try { install(); } catch (e) { console.warn('spread', e); } return r; });
  /* ---------- 2. 任務頁分頁 ---------- */
  if (!M || !M.PAGE || !M.PAGE['任務'] || !Q) return;
  const started = q => !!((G.SAVE.data.qs || {})[q.id]), done = q => Q.isDone(q.id), cur = () => (G.HUB && G.HUB.cur ? G.HUB.cur() : 1);
  const TABS = [['ch', '本章', q => !done(q) && q.ch === cur()], ['main', '主線', q => q.main && !done(q)], ['side', '支線・委託', q => !q.main && !done(q)], ['done', '已完成', q => done(q)]];
  const pg0 = M.PAGE['任務']; M.PAGE['任務'] = function (x, y, w, h) { const d = G.RPG.d(), tab = TABS.find(t => t[0] === d.qtab) || TABS[0], fs = G.FS(), TH = 30 * fs, c = G.ctx, C = G.C, U = M.ui;
    const all = Q.L.filter(started), L0 = Q.L, fold = d.qfold = d.qfold || {}, f0 = Object.assign({}, fold), tx0 = G.txt;
    Q.L = L0.filter(tab[2]); if (tab[0] === 'ch') for (const k in fold) fold[k] = false;   // 本章：不收合
    const EMP = { ch: '這一章的任務都完成了，看看「主線」或「支線・委託」。', main: '主線都完成了。', side: '目前沒有進行中的支線或委託。', done: '還沒有完成的任務。' };
    G.txt = function (t) { if (typeof t === 'string') { if (t.indexOf('點任務右側') === 0) return; if (t.indexOf('目前沒有任務') === 0 && all.length) { arguments[0] = EMP[tab[0]]; } } return tx0.apply(this, arguments); };   // 原本的說明文字讓位給分頁
    try { pg0.call(this, x, y, w, h); } finally { G.txt = tx0; Q.L = L0; if (tab[0] === 'ch') { for (const k in fold) delete fold[k]; Object.assign(fold, f0); } }
    const bx0 = x + 216, tw = Math.min(118, (w - 228 - 18) / 4), ty = y + 8;   /* 分頁放在「自動追蹤／關閉指引」右邊同一列 */
    TABS.forEach(([k, n, f], i) => { const bx = bx0 + i * (tw + 6), on = tab[0] === k, cnt = all.filter(f).length;
      c.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.92)'; G.rr(bx, ty, tw, TH, TH / 2); c.fill(); c.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; G.rr(bx + .5, ty + .5, tw - 1, TH - 1, TH / 2); c.stroke();
      G.txt(n + ' ' + cnt, bx + tw / 2, ty + TH / 2 + 1, 12, on ? C.ink : C.sub, 'center', G.FONT_S, 900); U.hit(bx, ty, tw, TH, () => { d.qtab = k; M.scroll.qst = 0; G.SAVE.markDirty(); }); }); };
})();
