/* ==========================================================================
 * 神諭之地 重製版 — 56_camera.js
 * Version : r3.184.0  (2026-11-28)　秘傳鏡頭（拉遠、對焦）只套用在秘傳，一般技能與特技不套用
 * 舊版    : r3.177.0  (2026-11-28)　r3.177.0：秘傳時鏡頭拉遠 22%
 * 舊版    : r3.176.0  (2026-11-28)　r3.176.0：秘傳通用演出鏡頭（主角與敵人群中間、挑飛時上移）
 * 舊版    : r3.173.0  (2026-11-28)　r3.173.0：G.CAMFOCUS 演出鏡頭（期間內鏡頭對準指定點）
 * 舊版    : r3.56.0  (2026-11-24)　r3.56.0：G.CAMLOOK 時拉遠
 * 舊版    : r3.17.0  (2026-11-14)
 * 變更    : r3.17.0 新增。鏡頭三項優化：
 *           A. 依地圖調預設距離：城鎮／神社（hub_、T_）自動拉近 18%；「遠／中／近」仍可手動切換（在各地圖基準上再調）。
 *           B. 情境自動鏡頭：對話時拉近成特寫（−20%）；戰鬥時依附近敵人分布自動拉遠把敵人框進畫面（最多 +30%），
 *              戰鬥結束後慢慢拉回；過場不自動變焦。
 *           C. 鏡頭前導：移動時鏡頭往前看（走 10%／跑 18% 畫面寬），平順跟隨；對話時鏡頭略下移，主角落在對話框上方。
 * 說明    : 只改 SC.zoom／SC.camTarget／SC.snapCam，並在 SC.step 每格平滑一次（不在 zoom() 內計算，避免每格重算多次）。
 * 依賴    : 02_scene（G.SC）、00_core（G.ZOOMS、G.LW、G.LH）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, TOWN = 0.82, TALK = 0.8, FIGHT_MAX = 1.3;
  const st = { vis: 0, lead: 0, leadY: 0 };
  const mapK = () => /^(hub_|T_)/.test(SC.id || '') ? TOWN : 1;
  const baseVis = () => G.ZOOMS[G.SAVE.data.zoom].vis * mapK();
  /* 目標可視高度：基準 × 情境係數 */
  function targetVis() { const b = baseVis();
    if (G.CAMZOOM && G.t < G.CAMZOOM.until && H.act && H.act.mvx && H.act.mvx.hiden) return b * G.CAMZOOM.k;   /* r3.179.0：個別秘傳指定鏡頭距離 */
    if (H.act && H.act.mvx && H.act.mvx.hd) return b * 1.22;   /* r3.177.0：秘傳時鏡頭拉遠，演出放得下 */
    if (G.CAMLOOK) return b * 1.3;   // r3.56.0：看向指定點（封印石）時拉遠，人和石頭都入鏡
    if (G.STORY && G.STORY.cut) return b;
    if (G.DLG && G.DLG.active()) return b * TALK;
    const s = SC.depth(H.y), R = G.HERO_H * s * 6, L = (G.E || []).filter(e => e.st !== 'dead' && !(e.delay > 0) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.4) < R);
    if (!L.length) return b;
    let x0 = H.x, x1 = H.x, y0 = H.y - G.HERO_H * s, y1 = H.y; for (const e of L) { x0 = Math.min(x0, e.x); x1 = Math.max(x1, e.x); y0 = Math.min(y0, e.y - G.HERO_H * s); y1 = Math.max(y1, e.y); }
    const need = Math.max((y1 - y0) * 1.35, (x1 - x0) * 1.25 * G.LH / G.LW);
    return Math.min(b * FIGHT_MAX, Math.max(b, need)); }
  SC.zoom = function () { return G.LH / (st.vis || baseVis()); };
  const ct0 = SC.camTarget.bind(SC);
  SC.camTarget = function () { const { vw, vh } = SC.view(), d = SC.def; if (!d) return ct0();
    let F = G.CAMFOCUS && G.t < G.CAMFOCUS.until && G.mode === 'play' ? G.CAMFOCUS : null;   /* r3.173.0：演出鏡頭（秘傳） */
    if (!F && G.mode === 'play' && H.act && H.act.mvx && H.act.mvx.hd) {   /* r3.176.0：各武器秘傳通用演出鏡頭——對準主角與附近敵人群的中間，有人被挑飛就往上帶 */
      const k = G.HERO_H * SC.depth(H.y); let n = 0, sx = 0, sy = 0, up = 0; for (const e of G.E || []) { if (e.st === 'dead' || e.delay > 0 || Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) > 6 * k) continue; n++; sx += e.x; sy += e.y; up = Math.max(up, e.lz || 0); }
      if (n) { const fx = H.x * 0.4 + sx / n * 0.6, fy = H.y * 0.4 + sy / n * 0.6 - 0.45 * k - Math.min(1.2 * k, up * 0.6); st.fx = st.fx === undefined ? fx : st.fx + (fx - st.fx) * 0.08; st.fy = st.fy === undefined ? fy : st.fy + (fy - st.fy) * 0.08; F = { x: st.fx, y: st.fy }; } } else if (!F) { st.fx = st.fy = undefined; }
    const x = F ? F.x : H.x + st.lead * vw, y = F ? F.y : H.y - 40 + st.leadY * vh;
    return { x: vw >= d.w ? d.w / 2 : Math.max(vw / 2, Math.min(d.w - vw / 2, x)), y: vh >= d.h ? d.h / 2 : Math.max(vh / 2, Math.min(d.h - vh / 2, y)) }; };
  const sn0 = SC.snapCam.bind(SC);
  SC.snapCam = function () { st.vis = targetVis(); st.lead = 0; st.leadY = 0; sn0(); };
  const sp0 = SC.step.bind(SC);
  SC.step = function () { if (SC.def) {
      const tv = targetVis(); st.vis = st.vis ? st.vis + (tv - st.vis) * (G.CAMZOOM && G.t < G.CAMZOOM.until ? 0.13 : tv > st.vis ? 0.04 : 0.025) : tv;   // 拉遠快一點、拉回慢一點
      const moving = H.st === 'walk' && !(G.DLG && G.DLG.active()) && !(G.STORY && G.STORY.cut), ux = moving ? (H.ux !== undefined ? H.ux : H.face) : 0, uy = moving ? (H.uy || 0) : 0, k = H.run ? 0.18 : 0.1;
      const talk = G.DLG && G.DLG.active() ? 0.14 : 0;   // 對話時鏡頭下移，讓主角落在對話框上方
      st.lead += (ux * k - st.lead) * 0.035; st.leadY += (uy * k * 0.5 + talk - st.leadY) * 0.035; }
    sp0(); };
  G.CAM = st;
})();
