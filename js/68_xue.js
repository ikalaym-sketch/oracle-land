/* ==========================================================================
 * 神諭之地 重製版 — 68_xue.js
 * Version : r3.60.0  (2026-11-24)　r3.60.0：合戰地圖不跟隨　r3.56.0：r3.56.0：小雪縮小到主角的 0.88；封印石旁小雪也套劇情動作
 * 舊版    : r3.53.0  (2026-11-23)　r3.53.0：小雪改用動作包（待機／走／跑／轉身／施法／提燈／坐下）
 * 舊版    : r3.31.2  (2026-11-17)　r3.31.2：神社小雪的奉納開場對話只在第一次完整播放
 * 舊版    : r3.31.1  (2026-11-17)　r3.31.1：進神社的位置改到鳥居後方空地（800,575）
 * 舊版    : r3.30.2  (2026-11-16)　r3.30.2：第 1 章後日談完成後才開始跟隨
 * 舊版    : r3.30.1  (2026-11-16)　r3.30.1：跟隨時與主角保持距離，不重疊
 * 舊版    : r3.30.0  (2026-11-16)
 * 變更    : r3.30.0 新增。小雪跟隨隊伍。
 *           ・第 1 章後日談完成後：章節地圖、任務地圖、兩岸城、副本都跟在隊伍最後面（沒有走路圖，用待機圖上下踏步）。不擋路、不被攻擊、不參戰。
 *           ・附近有敵人（或頭目戰）→ 退到主角身後離戰場遠的地方站著，頭上顯示小盾牌；打完再跟上。
 *           ・神社：不跟隨，站回固定位置（往上移，避開鳥居路線）；神社的劇情委託標記黏在小雪身上，找她說話就觸發。
 *           ・不跟隨的情況：第 1 章、結局是暴雨／無名之後、地圖上已有劇情安排的小雪（任務 NPC）。
 *           ・只在記憶體，不寫存檔；換地圖重建。
 * 依賴    : 06_story_ch1（神社小雪 npc:'xue'）、53_quest（Q.marks）、67_cast（G.CAST.same）、52_hub（HUB.cur）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, Q = G.QST, F = () => G.SAVE.data.flags; if (!Q || !G.HUB) return;
  const STAND = [880, 470];   // 神社：小雪新站位（原 880,560，往上移）
  const X = G.XUE = { o: null, trail: [] };
  const same = (a, b) => G.CAST ? G.CAST.same(a, b) : a === b;
  const want = () => { const id = SC.id, d = SC.def; if (!id || id === 'hub_shrine' || !d || G.mode !== 'play') return false; if (G.KASSEN && G.KASSEN.MAP[id]) return false;   // r3.60.0：合戰不跟 if (!(Q.isDone && Q.isDone('c1_after'))) return false;   // 第一章結束（後日談完成）後才跟
    const e = F().ending; if (e === 'storm' || e === 'nameless') return false;
    if (G.NPC.some(n => n !== X.o && n.name === '小雪' && n.x > -999)) return false;   // 劇情已經安排了小雪
    return true; };
  function make() { const o = X.o = { npc: 'xue', name: '小雪', x: H.x - 60 * H.face, y: H.y + 6, face: H.face, walking: false, xf: 1, keep: 1 }; const p = SC.snap ? SC.snap(o.x, o.y, 'walk', 200) : null; if (p) { o.x = p[0]; o.y = p[1]; } G.NPC.push(o); X.trail = []; }
  function kill() { if (X.o) G.NPC = G.NPC.filter(n => n !== X.o); X.o = null; }
  const foeNear = () => (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.E.some(e => e.st !== 'dead' && e.hp > 0 && e.delay <= 0 && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < 520);
  function target() { const o = X.o;
    if (foeNear()) { let ex = 0, n = 0; for (const e of G.E) if (e.st !== 'dead' && e.hp > 0) { ex += e.x; n++; } const side = n ? (ex / n > H.x ? -1 : 1) : -H.face; o.safe = 1;
      const x = Math.max(60, Math.min(SC.def.w - 60, H.x + side * 230)); const p = SC.snap ? SC.snap(x, H.y - 20, 'walk', 220) : null; return p || [x, H.y]; }
    o.safe = 0; let t = null; for (let i = X.trail.length - 1; i >= 0; i--) if (Math.hypot(X.trail[i][0] - H.x, X.trail[i][1] - H.y) > 95) { t = X.trail[i]; break; }
    if (!t) { const x = H.x - (H.face || 1) * 90; t = (SC.snap && SC.snap(x, H.y + 10, 'walk', 120)) || [x, H.y]; } return [t[0], t[1] + 4]; }   // 隊伍最後：沿主角走過的路，約 95px 後
  function step() { if (!want()) { kill(); return; } if (!X.o || !G.NPC.includes(X.o)) make(); const o = X.o;
    const last = X.trail[X.trail.length - 1]; if (!last || Math.hypot(last[0] - H.x, last[1] - H.y) > 3) { X.trail.push([H.x, H.y]); if (X.trail.length > 90) X.trail.shift(); }
    if (G.DLG.active() || SC.trans) { o.walking = false; return; }
    const [tx, ty] = target(), dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
    if (d > 700) { o.x = tx; o.y = ty; o.walking = false; return; }   // 跟丟（傳送、跳躍）直接到位
    const stop = o.safe ? 8 : 18; if (d < stop) { o.walking = false; return; }
    if (!o.safe && Math.hypot(o.x - H.x, (o.y - H.y) * 1.5) < 64 && d < 120) { o.walking = false; return; }   // r3.30.1：別貼在主角身上
    const sp = Math.min(d - stop + 1, o.safe ? 4.2 : Math.max(2.2, Math.min(5.2, d / 22))); o.walking = true; o.face = Math.sign(dx) || o.face;
    if (!(G.tryMove && G.tryMove(o, dx / d * sp, dy / d * sp))) { o.x += dx / d * sp; o.y += dy / d * sp; } }
  /* 神社：站位上移；劇情委託黏在小雪身上 */
  function shrine() { if (SC.id !== 'hub_shrine') return; const xs = G.NPC.find(n => n.npc === 'xue' && n !== X.o); if (!xs) return; xs.keep = 1;
    for (const m of Q.marks) if (m.q && same(m.label, '小雪') && m.n !== xs) { m.n = xs; m.x = xs.x; m.y = xs.y; }
    if (G.AMB) for (const n of G.AMB.list) if (!n.an && n.st !== 'walk' && Math.hypot(n.x - xs.x, (n.y - xs.y) * 1.5) < 70) { n.st = 'walk'; n.tx = xs.x + (n.x < xs.x ? -130 : 130); n.ty = n.y + 20; } }   // 路人別擋在小雪身上
  /* r3.31.1：進神社的位置移到鳥居後方空地（原本 800,760／800,870 站在鳥居柱與注連繩下面，主角被擋住） */
  const SH_IN = [800, 575];
  const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { const d = G.D.scenes.hub_shrine; if (d) { d.start = SH_IN.slice(); if (d.nodes) d.nodes.torii_arrival = SH_IN.slice(); for (const p of d.portals || []) if (p.id === 'village') p.arrival = SH_IN.slice(); } return r; });
  /* r3.31.2：神社找小雪的「奉納」開場對話（匯入後 10 句）只在第一次完整播放，之後一句帶過直接出選單 */
  const XK = '神社的事交給我。要奉納嗎？', XS = ['要奉納，還是聊聊？', '這次要做什麼？', '材料帶來了嗎？還是先歇一會兒？'];
  const ds0 = G.DLG.start; G.DLG.start = function (list, done) { if (Array.isArray(list) && list[0] && list[0].text === XK && list.some(e => e && e.choice)) {
      if (F().xueShrineSeen) list = [{ who: '小雪', text: XS[Math.floor(Math.random() * XS.length)] }].concat(list.slice(1)); else { F().xueShrineSeen = 1; G.SAVE.markDirty(); } }
    return ds0.call(this, list, done); };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { X.o = null; X.trail = [];
    const sd = G.D.scenes.hub_shrine; if (id === 'hub_shrine' && sd && sd.nodes && F().prologue) sd.nodes.xue_stand = STAND.slice();
    en0(id); };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); try { step(); if (++tk % 20 === 0) shrine(); } catch (e) { console.warn('xue', e); } };
  /* 戰鬥中頭上小盾牌 */
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0(); const o = X.o; if (!o || !o.safe || G.mode !== 'play') return; const s = SC.depth(o.y), p = SC.toScreen(o.x, o.y - G.HERO_H * s * 1.12), c = G.ctx;
    if (p.x < 0 || p.x > G.LW || p.y < 0) return; const r = 8 * G.FS(); c.save(); c.globalAlpha = 0.85 + 0.15 * Math.sin(G.t * 0.12); c.fillStyle = '#6fb0f0'; c.strokeStyle = '#e8f4ff'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(p.x, p.y - r); c.lineTo(p.x + r * 0.85, p.y - r * 0.55); c.lineTo(p.x + r * 0.7, p.y + r * 0.3); c.lineTo(p.x, p.y + r); c.lineTo(p.x - r * 0.7, p.y + r * 0.3); c.lineTo(p.x - r * 0.85, p.y - r * 0.55); c.closePath(); c.fill(); c.stroke(); c.restore(); };
})();
/* ---------- r3.53.0：小雪動作包（a/p/n_xue：idle walk run turn cast lantern record sit mirror_* gate_*） ----------
 * 跟隨：停＝idle（聆聽）、慢＝walk、快＝run、換方向＝turn；主角站著不動 10 秒且附近無敵人＝sit。
 * 夜間地圖（Q_night_*／黃泉）停下時偶爾提燈 lantern。劇情：G.XUE.act(k, 秒) 指定動作（例：封印檢查 cast）。
 * 神社定點小雪同樣套用（待機／說話）。圖未載入前退回舊立繪。 */
(function () {
  const A = G.ANIM, SC = G.SC, H = G.H, X = G.XUE; if (!X) return; let U = null;
  const ld = () => A.load('n_xue').then(u => { U = u; }, e => console.warn('xue anim', e));
  const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { ld(); return r; });
  X.act = (k, sec) => { X.pose = { k, end: G.t + Math.round((sec || 3) * 60) }; };
  const night = () => /^Q_night|R11/.test(SC.id || '');
  let still = 0, hx = 0, hy = 0;
  const foe = () => G.E.some(e => e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - H.x, e.y - H.y) < 600) || (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done);
  function motion(n) { const dx = n.x - (n._px ?? n.x), mv = Math.hypot(dx, n.y - (n._py ?? n.y)); n._px = n.x; n._py = n.y; n._v = (n._v || 0) * 0.7 + mv * 0.3; n._vx = (n._vx || 0) * 0.8 + dx * 0.2; }
  function pick(n) {
    if (X.pose && X.pose.end > G.t && (n === X.o || n.xe)) return X.pose.k;
    if (n._turn && G.t - n._turn < 22) return 'turn';
    if (n._v > 0.6) return n._v > 3.4 ? 'run' : 'walk';
    if (n === X.o && still > 600 && !foe()) return 'sit';
    if (night() && (G.t >> 8) % 3 === 1) return 'lantern';
    return 'idle'; }
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n.npc !== 'xue' || n.evOff) return dn0(n); U = A.get('n_xue'); if (!U) { if (!A.wait.n_xue) ld(); return dn0(n); }   // 57_mem 可能釋放：每次取，沒有就重載、先畫舊立繪
    motion(n); if (n === X.o) { if (n._v > 0.6) { if (Math.abs(n._vx) > 0.8) n.face = Math.sign(n._vx); } else if (Math.abs(H.x - n.x) > 40) n.face = Math.sign(H.x - n.x); }   // 平滑方向，避免來回翻面
    else if (!n.walking && Math.abs(H.x - n.x) > 6 && Math.hypot(H.x - n.x, H.y - n.y) < 160) n.face = Math.sign(H.x - n.x);
    if (n._f !== undefined && n._f !== n.face && (n._v || 0) < 1.2 && !(n._turn && G.t - n._turn < 40)) n._turn = G.t; n._f = n.face;
    const k = pick(n); if (k !== n._k) { n._k = k; n._t0 = G.t; } const rec = U.act[k] || U.act.idle;
    const s = SC.depth(n.y), sc = G.HERO_H * 0.84 * s / U.refH, c = G.ctx;   // r3.56.0：0.96→0.84（身體高約主角 0.88，原本比主角高）
    c.save(); c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(n.x, n.y, 15 * s, 4.5 * s, 0, 0, Math.PI * 2); c.fill(); c.restore();
    const fr = A.frameAt(rec, (G.t - n._t0) * 16.7), flip = k === 'turn' ? n.face > 0 : n.face < 0;   // turn 母稿＝右→左；轉向右時鏡像
    A.draw(U, fr, n.x, n.y, sc, flip, 1); };
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); if (Math.hypot(H.x - hx, H.y - hy) > 1 || G.DLG.active()) { still = 0; hx = H.x; hy = H.y; } else still++; };
})();
