/* ==========================================================================
 * 神諭之地 重製版 — 161_hud2.js
 * Version : r3.168.0  (2026-11-27)
 * 變更    : r3.168.0 新增。右上整合面板（取代右上「視角／選單」鈕、上方主線橫幅、世界事件長條、畫面邊緣出口箭頭）。
 *           ・標題列四個分頁：地圖／事件／主線／任務（有內容就亮燈，事件新出現時閃）＋右端鏡頭鍵（近／中／遠）。
 *           ・地圖：小地圖（點一下開行旅繪圖）。
 *           ・事件／主線／任務：一次 3 條（標題＋「- 進度 目標」），超過顯示「1／2 ▸」翻頁；點一條＝設為追蹤（再點取消）。
 *             任務＝支線＋妖怪委託＋公告板委託。追蹤中的那條加 ◆ 與距離。
 *           ・面板下方固定一列：左右出口名稱＋距離。
 *           ・進城鎮／安全區自動切到地圖；回野外切回上次看的分頁。
 *           ・選單改成點主角頭像（04_ui）。
 * 存檔    : save.hudTab（野外上次的分頁）。
 * 依賴    : 04_ui（UI.B、HUD2.tap 掛點）、108_route（MMAP.draw／show）、53_quest（Q.L／active／pinned／guide）、
 *           22_event＋140_events（EV.world／worldText／goWorld）、95_board（G.BOARD.act）、52_hub（portalXY）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, SC = G.SC, Q = G.QST, HUB = G.HUB, MM = G.MMAP; if (!MM || !MM.draw) return;
  const S = () => G.SAVE.data, nm = id => (G.D.scenes[id] || {}).name || id;
  const TABS = [['map', '地圖'], ['ev', '事件'], ['main', '主線'], ['task', '任務']];
  const COL = { ev: '#f0a24a', main: '#f3d98a', side: '#f3ede0', boss: '#9fe0c8', board: '#e2cfa4' };
  const st = { tab: null, sid: null, page: {}, hits: [], evKey: '', blink: 0 };
  const town = () => { const d = SC.def || {}; return /^(hub_|T_)/.test(SC.id || '') || !!(d.safe || d.town); };
  const HD = G.HUD2 = { st };
  /* ---------- 資料 ---------- */
  const lvOf = map => { const m = (G.WORLD && G.WORLD.meta || {})[map] || {}, d = G.D.scenes[map] || {}; return m.lv || d.lv || 0; };
  function stepOf(q) { const s = (S().qs || {})[q.id], step = s && q.steps[s.s]; if (!step) return { t: '', map: null };
    let t = step.text || (step.t === 'cut' || step.t === 'goto' ? '前往' + nm(step.map) : q.title);
    if (step.t === 'kill') t = (s.k || 0) + '／' + (step.n || 3) + '　' + t; else if (step.t === 'gather' && step.spots) t = (s.k || 0) + '／' + step.spots.length + '　' + t;
    return { t, map: step.map }; }
  function qEntry(q, c) { const o = stepOf(q); return { c, q, lv: lvOf(o.map), title: q.title, sub: o.t, map: o.map }; }
  function lists() { const L = { ev: [], main: [], task: [] }, EV = G.EV;
    if (EV && EV.world) { const w = EV.world(); if (w && w.k && !w.done && EV.worldText) for (const part of EV.worldText().split('　｜　')) { const m = /^(.*?)\s*(剩 \d+ 分)/.exec(part);
        L.ev.push({ c: 'ev', title: m ? m[1] : part, sub: (m ? m[2] + '・' : '') + '點一下前往', go: () => EV.goWorld && EV.goWorld() }); } }
    if (Q) for (const q of Q.L) { if (!Q.active(q.id)) continue; if (q.main) L.main.push(qEntry(q, 'main')); else L.task.push(qEntry(q, q.boss ? 'boss' : 'side')); }
    if (!L.main.length && G.STORY.objective) { const o = G.STORY.objective(); if (o) L.main.push({ c: 'main', title: '主線', sub: o.replace(/^【主線】/, '') }); }
    if (G.BOARD) for (const o of G.BOARD.act()) L.task.push({ c: 'board', lv: o.lv, title: o.title, sub: o.k + '／' + o.n + '　' + nm(o.map) });
    /* 追蹤中的排第一 */
    const pin = Q && Q.pinned && Q.pinned(); if (pin) for (const k of ['main', 'task']) { const i = L[k].findIndex(e => e.q === pin); if (i > 0) L[k].unshift(L[k].splice(i, 1)[0]); }
    return L; }
  /* ---------- 小工具 ---------- */
  function fit(t, w, f, wt) { ctx.font = `${wt || 700} ${f * G.FS()}px ${G.FONT}`; if (ctx.measureText(t).width <= w) return t; while (t.length > 1 && ctx.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
  function otxt(t, x, y, f, col, al, font, wt) { ctx.font = `${wt || 700} ${f * G.FS()}px ${font || G.FONT}`; ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,5,6,.85)'; ctx.lineWidth = 3; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); }
  const hit = (x, y, w, h, f) => st.hits.push({ x, y, w, h, f });
  function exits() { const d = SC.def; if (!d || !d.portals || !HUB.portalXY) return []; const out = {};
    for (const p of d.portals) { if (!p.to || !G.D.scenes[p.to] || SC.lock[p.id] || p.hide || p.hidden) continue; let xy; try { xy = HUB.portalXY(p); } catch (e) { continue; }
      const side = xy[0] < d.w / 2 ? 'L' : 'R', dist = Math.round(Math.hypot(xy[0] - G.H.x, xy[1] - G.H.y) / 10), cur = out[side];
      if (!cur || (side === 'L' ? xy[0] < cur.x : xy[0] > cur.x)) out[side] = { x: xy[0], n: nm(p.to), dist }; }
    return out; }
  /* ---------- 分頁切換 ---------- */
  function syncTab() { if (st.sid === SC.id && st.tab) return; st.sid = SC.id; st.tab = town() ? 'map' : (S().hudTab || 'main'); }
  function setTab(k) { st.tab = k; if (!town()) { S().hudTab = k; G.SAVE.markDirty(); } }
  /* ---------- 畫 ---------- */
  function draw() { st.hits = []; G.UI.B.zoom = { x: -999, y: -999, w: 0, h: 0 }; MM.box = null; if (!MM.show()) return; syncTab();
    const L = lists(), fs = G.FS(), W = Math.min(236, G.LW * 0.27), R = G.LW - 10 - G.SAFE.r, X = R - W, T = 10 + G.SAFE.t, TH = 24, cur = st.tab === 'map' ? null : L[st.tab],
      BH = !cur ? (MM.cv ? 18 + Math.min(80, (W - 8) * MM.cv.height / MM.cv.width) : 90) : Math.max(26, Math.min(3, cur.length) * 27 + (cur.length > 3 ? 16 : 4));   // 任務分頁高度跟著條數（最多 3 條）
    const evKey = L.ev.map(e => e.title).join('|'); if (evKey && evKey !== st.evKey && st.tab !== 'ev') st.blink = 240; st.evKey = evKey; if (st.blink > 0) st.blink--;
    const ex = exits(), EH = ex.L || ex.R ? 18 : 0;
    ctx.fillStyle = 'rgba(12,8,10,.62)'; G.rr(X, T, W, TH + BH + 4 + EH, 7); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.45)'; ctx.lineWidth = 1; G.rr(X + .5, T + .5, W - 1, TH + BH + 3 + EH, 7); ctx.stroke();
    /* 標題列 */
    const cw = 26, tw = (W - cw - 4) / 4;
    TABS.forEach(([k, n], i) => { const x = X + 2 + i * tw, on = st.tab === k, cnt = k === 'map' ? 1 : L[k].length, lit = k === 'map' || cnt > 0;
      if (on) { ctx.fillStyle = 'rgba(227,194,122,.2)'; G.rr(x + 1, T + 2, tw - 2, TH - 3, 5); ctx.fill(); ctx.fillStyle = C.gold; ctx.fillRect(x + 6, T + TH - 3, tw - 12, 2); }
      const bl = k === 'ev' && st.blink > 0 && (st.blink >> 4) % 2;
      G.txt(n, x + tw / 2 - (k === 'map' ? 0 : 3), T + TH / 2 + 1, 11, on ? C.ink : lit ? C.sub : 'rgba(200,190,175,.45)', 'center', G.FONT_S, 900);
      if (k !== 'map') { ctx.fillStyle = cnt ? (bl ? '#fff2c0' : COL[k === 'task' ? 'side' : k]) : 'rgba(120,110,100,.4)'; ctx.beginPath(); ctx.arc(x + tw - 7, T + 8, cnt ? 3 : 2.2, 0, 6.283); ctx.fill(); }
      hit(x, T, tw, TH, () => { setTab(k); if (k === 'ev') st.blink = 0; }); });
    const zx = X + W - cw - 1, zb = { x: zx, y: T + 2, w: cw - 2, h: TH - 4 }; ctx.fillStyle = 'rgba(227,194,122,.16)'; G.rr(zb.x, zb.y, zb.w, zb.h, 5); ctx.fill();
    G.txt(G.ZOOMS[S().zoom].n, zx + (cw - 2) / 2, T + TH / 2 + 1, 11, C.gold, 'center', G.FONT_S, 900); G.UI.B.zoom = zb; hit(zb.x, zb.y, zb.w, zb.h, () => { S().zoom = (S().zoom + 1) % 3; G.SAVE.markDirty(); });
    /* 內容 */
    const by = T + TH + 2, px = X + 8, pw = W - 16;
    if (st.tab === 'map') { const mh = MM.draw(X + 4, by + 14, W - 8, BH - 14); otxt(fit(nm(SC.id), W - 16, 10, 900), X + 8, by + 7, 10, C.gold, 'left', G.FONT_S, 900); }
    else { const list = L[st.tab], per = 3, pages = Math.max(1, Math.ceil(list.length / per)), pg = st.page[st.tab] = Math.min(st.page[st.tab] || 0, pages - 1), pin = Q && Q.pinned && Q.pinned();
      if (!list.length) otxt(st.tab === 'ev' ? '目前沒有世界事件' : st.tab === 'main' ? '沒有進行中的主線' : '沒有進行中的任務', X + W / 2, by + BH / 2, 10, 'rgba(220,210,195,.6)', 'center');
      list.slice(pg * per, pg * per + per).forEach((e, i) => { const y = by + 4 + i * 27, tr = e.q && e.q === pin, g = tr && G.QST.guide ? G.QST.guide() : null, dist = g && g.x !== undefined ? '　' + Math.round(Math.hypot(g.x - G.H.x, g.y - G.H.y) / 10) + 'm' : '';
        const head = (tr ? '◆ ' : '') + (e.lv ? '[' + e.lv + '] ' : '') + e.title; otxt(fit(head, pw, 11, 900), px, y + 6, 11, COL[e.c] || C.ink, 'left', G.FONT_S, 900);
        otxt(fit('- ' + e.sub + dist, pw - 6, 10, 600), px + 6, y + 19, 10, '#d9d0c2', 'left', G.FONT, 600);
        hit(X, y - 2, W, 27, () => { if (e.go) return e.go(); if (e.q) { const d = G.RPG.d(); d.track = d.track === e.q.id ? '' : e.q.id; G.SAVE.markDirty(); G.UI.toast(d.track ? '追蹤：' + e.q.title : '改回自動追蹤'); } else if (e.c === 'board') G.UI.toast(e.title + '　' + e.sub); }); });
      if (pages > 1) { const t = (pg + 1) + '／' + pages + ' ▸'; otxt(t, X + W - 8, by + BH - 6, 10, C.gold, 'right', G.FONT, 800); hit(X + W - 60, by + BH - 16, 60, 18, () => { st.page[st.tab] = (pg + 1) % pages; }); } }
    /* 出口列 */
    if (EH) { const y = by + BH + 2 + EH / 2, half = (W - 16) / 2; ctx.strokeStyle = 'rgba(227,194,122,.2)'; ctx.beginPath(); ctx.moveTo(X + 6, y - EH / 2); ctx.lineTo(X + W - 6, y - EH / 2); ctx.stroke();
      if (ex.L) otxt(fit('◀ ' + ex.L.n + ' ' + ex.L.dist + 'm', ex.R ? half : W - 16, 10, 700), X + 8, y, 10, '#f3d98a', 'left');
      if (ex.R) otxt(fit(ex.R.n + ' ' + ex.R.dist + 'm ▶', ex.L ? half : W - 16, 10, 700), X + W - 8, y, 10, '#f3d98a', 'right'); }
    st.box = { x: X, y: T, w: W, h: TH + BH + 4 + EH }; }
  HD.tap = function (p) { if (!st.box || !MM.show()) return false; for (const h of st.hits) if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) { h.f(); return true; }
    if (MM.box && p.x >= MM.box.x && p.x <= MM.box.x + MM.box.w && p.y >= MM.box.y && p.y <= MM.box.y + MM.box.h) return false;   // 小地圖：交給 04_ui 開行旅繪圖
    const b = st.box; return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; };
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); try { draw(); } catch (e) { console.warn('hud2', e); } };
})();
