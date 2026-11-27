/* ==========================================================================
 * 神諭之地 重製版 — 04_ui.js
 * Version : r3.154.0  (2026-11-27)　r3.154.0：技能鍵冷卻改環狀（補滿閃一下）、按鈕間距加大，文字不變
 * 舊版    : r3.153.0  (2026-11-27)　r3.153.0：小地圖點擊→行旅繪圖；方向提示不壓小地圖
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：提示可帶「前往設定」按鈕；對話中與結束後 2 秒內的橫幅延後；左上改「區域 Lv／難度」
 * 舊版    : r3.145.0  (2026-11-27)　r3.145.0：訊息排隊（橫幅、提示各一次一個，其餘排隊）
 * 舊版    : r3.110.0  (2026-11-26)　r3.110.0：藥鍵左邊加「鎌鼬之羽」召喚鍵（擁有後才出現）；r3.111.0：左上「敵 Lv」顯示實際等級（困難以上含主角等級）；r3.113.0：點世界事件提醒＝直接傳送到該地圖開始
 * 舊版    : r3.100.0  (2026-11-26)　r3.100.0：右上「談／調查」鈕取消：附近有互動對象且沒有敵人時，「斬」鍵變成「談／查」，上方顯示對象名稱
 * 舊版    : r3.64.0  （r3.64.0：血條加粗、血量數字放大、低血量閃爍）
 * 舊版    : r3.54.0  （r3.54.0：巔峰等級顯示　r3.32.0：HUD 顯示全遊戲難度＋副本難度）
 * 舊版    : r3.27.0  （r3.27.0：互動鍵縮小上移；任務指引標籤縮小淡化）
 * 舊版    : r3.24.0  （r3.24.0：藥鍵與閃同大小同高）
 * 舊版    : r3.21.0  （r3.21.0：任務目標過長截斷；指引標籤避開夥伴頭像）
 * 舊版    : r3.19.3  （r3.19.3：藥鍵改圓形放「閃」左邊；指引標籤避開右上提示）
 * 舊版    : r3.19.2  （r3.19.2：滿版左側資訊貼齊；世界事件提醒可點）
 * 舊版    : r3.19.1  （r3.19.1：頭像旁顯示地圖敵人等級與難度）
 * 舊版    : r3.18.2  （r3.18.2：HUD 拿掉「未設／熟N／未學」等開發字樣，未設定的技鍵不顯示）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 點擊先判斷夥伴頭像（49_party）。
 * 變更    : r3.6.0 主線指引箭頭在右側時不低於畫面 36%（避免壓到技能鍵）。
 * 變更    : r3.4.0 右上「選單」下方加「藥」快捷鍵（21_shop）。
 * 變更    : r3.0.4 按鍵 9 顆：斬（普攻）／招式×3（組合技，內圈）／技×2／身法×2／奧義（外圈）；鍵盤 J 斬・1 2 3 招式・U I 技・K L 身法・O 奧義。
 * 變更    : r3.0.0 技A／技B／奧義按鍵改讀目前武器的技能欄與冷卻（13_weapons）；連段顯示依武器段數；選單開關。
 * 變更    : r2.1.0 記錄最後操作時間 G.IN.lastAct（夥伴待機閒聊用）；繪製夥伴對話泡泡。
 * 變更    : r2.0.0 按鍵改環狀排列（斬／閃／突／技A／技B／奧義），技能冷卻與「氣」顯示；
 *           互動指引：大型「談・名字」按鈕、畫面外目標方向箭頭（含距離）；舊暫停選單改由 08_menu 新選單取代；
 *           HUD 加等級、經驗條、氣量表；字體大小由 G.FS() 統一縮放。
 * 說明    : 輸入與介面——浮動搖桿（左半屏）、多點觸控按鍵、鍵盤、HUD、提示（toast／banner）。
 * ========================================================================== */
'use strict';
G.IN = { mx: 0, my: 0, stick: null, keys: new Set(), atk: false, c1: false, c2: false, c3: false, skA: false, skB: false, m1: false, m2: false, ult: false };
(function () {
  const ctx = G.ctx, cv = G.cv, B = {}, ptr = new Map(), IN = G.IN, C = G.C;
  const UI = G.UI = { B, tst: null, ban: null, near: null,
    get menu() { return G.MENU && G.MENU.open; },
    layout() {
      const R = G.LW - 16 - G.SAFE.r, Bt = G.LH - 14 - G.SAFE.b, T = 12 + G.SAFE.t;
      const cx = R - 50, cy = Bt - 50, ring = (an, d) => [cx + Math.cos(an * Math.PI / 180) * d, cy - Math.sin(an * Math.PI / 180) * d];
      B.atk = { x: cx, y: cy, r: 40, label: '斬' };
      [[180, 'c1'], [135, 'c2'], [90, 'c3']].forEach(([an, k], i) => { const [x, y] = ring(an, 80); B[k] = { x, y, r: 22, label: '招' }; });   // 內圈：招式（組合技）
      { const [x, y] = ring(197, 156); B.m1 = { x, y, r: 23, label: '閃' }; }   // 外圈下：身法
      { const [x, y] = ring(168, 160); B.m2 = { x, y, r: 23, label: '身' }; }
      { const [x, y] = ring(133, 160); B.skA = { x, y, r: 24, label: '技' }; }  // 外圈上：技
      { const [x, y] = ring(104, 156); B.skB = { x, y, r: 24, label: '技' }; }
      { const [x, y] = ring(73, 150); B.ult = { x: Math.min(x, R - 24), y, r: 24, label: '奧' }; }
      B.talk = { x: R - 160, y: Bt - 300, w: 150, h: 32 };   // r3.27.0：縮小上移，不壓技能鍵
      B.menu = { x: R - 58, y: T, w: 58, h: 30 };
      B.zoom = { x: R - 136, y: T, w: 70, h: 30 };
      B.potion = { x: B.m1.x - 58, y: B.m1.y, r: B.m1.r };
      B.feather = { x: B.potion.x - 54, y: B.potion.y, r: B.m1.r };   /* r3.110.0：鎌鼬之羽（138_feather） */   // r3.24.0：與「閃」同大小、同高度   // r3.19.3：藥鍵改圓形，放在「閃」左邊
    },
    /* r3.145.0：訊息排隊——同一時間 1 個橫幅＋1 個提示；後來的排隊（同文字不重複），排隊中顯示時間縮短 */
    bq: [], tq: [],
    toast(t, act) { const c = this.tst, T = act ? 200 : 110; if (!c || c.t < 30) { this.tst = { text: t, t: T, act }; return; } if (c.text === t) { c.t = Math.max(c.t, 80); return; }   // r3.146.0：act＝提示上的「前往」
      if (!this.tq.some(q => q.text === t)) { this.tq.push({ text: t, act }); if (this.tq.length > 3) this.tq.shift(); } if (c.t > 70) c.t = 70; },
    banner(t, sub) { const c = this.ban; if (G.DLG && G.DLG.active()) { if (!this.bq.some(b => b.text === t)) this.bq.push({ text: t, sub }); return; }   // r3.146.0：對話中跳的橫幅，等對話結束
      if (!c || c.t < 20) { this.ban = { text: t, sub, t: 170 }; return; } if (c.text === t) return;
      if (!this.bq.some(b => b.text === t)) { this.bq.push({ text: t, sub }); if (this.bq.length > 4) this.bq.shift(); } if (c.t > 110) c.t = 110; },
    step() { if (this.tst && --this.tst.t <= 0) { this.tst = null; const q = this.tq.shift(); if (q) this.tst = { text: q.text, act: q.act, t: q.act ? 200 : this.tq.length ? 80 : 100 }; }
      const hold = G.DLG && G.DLG._endT && G.t - G.DLG._endT < 120;   // r3.146.0：劇情結束後 2 秒才出橫幅
      if (!hold && !this.ban && this.bq.length) { const n = this.bq.shift(); this.ban = { text: n.text, sub: n.sub, t: this.bq.length ? 130 : 170 }; }
      else if (!hold && this.ban && --this.ban.t <= 0) { this.ban = null; const n = this.bq.shift(); if (n) this.ban = { text: n.text, sub: n.sub, t: this.bq.length ? 130 : 170 }; }
      let mx = 0, my = 0; if (IN.stick) { mx = (IN.stick.x - IN.stick.ox) / 46; my = (IN.stick.y - IN.stick.oy) / 46; }
      const K = IN.keys; if (K.has('a') || K.has('arrowleft')) mx -= 1; if (K.has('d') || K.has('arrowright')) mx += 1; if (K.has('w') || K.has('arrowup')) my -= 1; if (K.has('s') || K.has('arrowdown')) my += 1;
      IN.mx = mx; IN.my = my; if (mx || my) IN.lastAct = G.t; }
  };
  const hit = (p, b) => b.r ? (p.x - b.x) ** 2 + (p.y - b.y) ** 2 <= (b.r + 8) ** 2 : p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  UI.hit = hit;
  const toL = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * G.LW, y: (e.clientY - r.top) / r.height * G.LH }; };
  UI.fullscreen = function () { const d = document, el = d.documentElement;
    try { if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const r = el.requestFullscreen || el.webkitRequestFullscreen; if (r) { const q = r.call(el, { navigationUI: 'hide' }); if (q && q.then) q.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (x) {} }).catch(() => {}); } } } catch (x) {} };

  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); const p = toL(e); IN.lastAct = G.t;
    if (G.mode === 'title' || G.mode === 'end') { G.MAIN.tap(p); return; }
    if (G.DLG.active()) { G.DLG.tap(p); return; }
    if (G.mode !== 'play') return;
    if (G.MENU.open) { G.MENU.down(p); return; }
    if (B.toast && UI.tst && UI.tst.act && hit(p, B.toast)) { const a = UI.tst.act; UI.tst = null; IN.stick = null; a(); return; }   // r3.146.0
    if (hit(p, B.menu)) { G.MENU.show(); IN.stick = null; return; }
    if (G.MMAP && G.MMAP.box && hit(p, G.MMAP.box)) { IN.stick = null; G.ROUTE.atlas(); return; }   // r3.153.0：小地圖→行旅繪圖
    if (B.wev && hit(p, B.wev)) { IN.stick = null; if (G.EV && G.EV.goWorld) G.EV.goWorld(); else { G.MENU.show(); G.MENU.goto && G.MENU.goto('地圖'); } return; }   // r3.19.2：世界事件提醒
    if (G.SHOP && hit(p, B.potion)) { G.SHOP.quick(); return; }
    if (G.FEATHER && G.FEATHER.has() && hit(p, B.feather)) { G.FEATHER.use(); return; }
    if (hit(p, B.zoom)) { G.SAVE.data.zoom = (G.SAVE.data.zoom + 1) % 3; G.SAVE.markDirty(); return; }
    if (actNear() && hit(p, B.atk)) { G.STORY.interact(UI.near); return; }   // r3.100.0：斬鍵兼談／查
    if (G.PARTY && G.PARTY.tap(p)) return;   // 夥伴頭像：指令／大連攜
    for (const k of ['atk', 'c1', 'c2', 'c3', 'skA', 'skB', 'm1', 'm2', 'ult']) if (hit(p, B[k])) { IN[k] = true; ptr.set(e.pointerId, k); return; }
    if (p.x < G.LW * 0.55 && !IN.stick) { IN.stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y }; ptr.set(e.pointerId, 'stick'); }
  }, { passive: false });
  window.addEventListener('pointermove', e => { if (G.MENU && G.MENU.open) { G.MENU.move(toL(e)); return; }
    const s = IN.stick; if (!s || s.id !== e.pointerId) return; const p = toL(e), dx = p.x - s.ox, dy = p.y - s.oy, d = Math.hypot(dx, dy), R = 46;
    if (d > R) { s.ox = p.x - dx / d * R; s.oy = p.y - dy / d * R; } s.x = p.x; s.y = p.y; }, { passive: false });
  const up = e => { if (G.MENU && G.MENU.open) G.MENU.up(toL(e)); if (IN.stick && IN.stick.id === e.pointerId) IN.stick = null; ptr.delete(e.pointerId); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { if (G.MENU && G.MENU.open) { e.preventDefault(); G.MENU.wheel(toL(e), e.deltaY * G.LH / innerHeight); } }, { passive: false });
  window.addEventListener('blur', () => { IN.stick = null; IN.keys.clear(); ptr.clear(); });
  window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); IN.lastAct = G.t; if (e.repeat && 'jkluioe 123'.includes(k)) return; IN.keys.add(k);
    const play = G.mode === 'play' && !G.DLG.active();
    if (play && !G.MENU.open) { const map = { j: 'atk', k: 'm1', shift: 'm1', l: 'm2', u: 'skA', i: 'skB', o: 'ult', 1: 'c1', 2: 'c2', 3: 'c3' }; if (k === 'j' && actNear()) { G.STORY.interact(UI.near); return; } if (map[k]) IN[map[k]] = true; if (k === 'e' && UI.near) G.STORY.interact(UI.near); }
    if ((k === 'escape' || k === 'm' || k === 'tab') && play) { e.preventDefault(); if (G.MENU.open) G.MENU.close(); else G.MENU.show(); }
    if (k === ' ' || k === 'enter') { if (G.DLG.active()) G.DLG.advance(); else if (G.mode === 'title' || G.mode === 'end') G.MAIN.tap(null); } });
  window.addEventListener('keyup', e => IN.keys.delete(e.key.toLowerCase()));

  /* ---------- 繪製 ---------- */
  function pill(b, label, on) { ctx.fillStyle = on ? 'rgba(90,60,30,.75)' : 'rgba(12,8,10,.55)'; G.rr(b.x, b.y, b.w, b.h, 15); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.5)'; ctx.lineWidth = 1; G.rr(b.x + .5, b.y + .5, b.w - 1, b.h - 1, 15); ctx.stroke();
    G.txt(label, b.x + b.w / 2, b.y + b.h / 2 + 1, 11, C.ink, 'center', G.FONT, 700); }
  UI.pill = pill;
  /* r3.100.0：附近有可對話／調查的對象、且身邊沒有敵人時，「斬」鍵改成「談／查」 */
  const actNear = () => { const n = UI.near; if (!n) return null; const H = G.H, R = G.HERO_H * 3; for (const e of G.E) if (e.st !== 'dead' && e.hp > 0 && !(e.delay > 0) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.4) < R) return null; return n; };
  UI.actNear = actNear;
  /* r3.154.0：冷卻改成環狀——按鈕淡暗＋外圈金環隨時間補滿；冷卻結束閃一下 */
  const CDP = {}, CDF = {};
  function cdRing(b, k, cd, dim) { const was = CDP[k] || 0; CDP[k] = cd; if (was > 0.02 && cd <= 0 && !dim) CDF[k] = G.t;
    if (cd > 0) { ctx.fillStyle = dim ? 'rgba(8,5,8,.55)' : 'rgba(8,5,8,.38)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3, 0, 6.283); ctx.fill();
      if (!dim) { ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, -1.5708, -1.5708 + 6.283 * (1 - cd)); ctx.stroke(); ctx.lineCap = 'butt'; } }
    const ft = CDF[k] !== undefined ? G.t - CDF[k] : 99; if (ft < 18) { const a = 1 - ft / 18; ctx.strokeStyle = `rgba(255,236,170,${a})`; ctx.lineWidth = 2 + 4 * a; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2 + ft * 0.5, 0, 6.283); ctx.stroke(); } }
  function round(b, k, big, cd, sub, glow, dim, ic) { const on = [...ptr.values()].includes(k); if (dim) cd = Math.max(cd, 0.0001);
    ctx.fillStyle = on ? 'rgba(120,40,30,.75)' : 'rgba(18,12,14,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = glow ? `rgba(255,190,215,${0.6 + 0.4 * Math.sin(G.t * 0.2)})` : 'rgba(227,194,122,.85)'; ctx.lineWidth = big || glow ? 2.2 : 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3, 0, 6.283); ctx.stroke();
    if (ic && G.drawIcon) { ctx.save(); ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 4, 0, 6.283); ctx.clip(); const okI = G.drawIcon(ic, b.x - b.r + 4, b.y - b.r + 4, (b.r - 4) * 2, dim ? 0.35 : 0.95);
      ctx.restore(); cdRing(b, k, cd, dim); if (okI) { if (sub) { ctx.fillStyle = 'rgba(10,7,9,.7)'; G.rr(b.x - 19, b.y + b.r - 9, 38, 12, 4); ctx.fill(); G.txt(sub, b.x, b.y + b.r - 3, 8, cd > 0 ? C.dim : C.gold, 'center', G.FONT, 700); } return; } }   // 有圖示：圖示＋下方名稱
    if (!ic || !G.drawIcon) cdRing(b, k, cd, dim);
    G.txt(b.label, b.x, b.y + (sub ? -4 : 1), big ? 26 : 16, cd > 0 ? C.dim : C.ink, 'center', G.FONT_S, 900);
    if (sub) G.txt(sub, b.x, b.y + 11, 8, cd > 0 ? C.dim : C.gold, 'center', G.FONT, 700); }
  function bar(x, y, w, h, v, c1, c2) { ctx.fillStyle = 'rgba(12,8,10,.72)'; G.rr(x - 1, y - 1, w + 2, h + 2, (h + 2) / 2); ctx.fill();
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; G.rr(x, y, Math.max(0.01, w * Math.max(0, Math.min(1, v))), h, h / 2); ctx.fill(); }
  /* 畫面外目標：邊緣箭頭＋名稱＋距離 */
  function drawGuide() {
    const tg = G.STORY.target(); if (!tg) return;
    const p = G.SC.toScreen(tg.x, tg.y - G.HERO_H * 0.6), m = 34, top = 86 + G.SAFE.t; let bot = G.LH * 0.58;   // 下緣讓給按鍵區，箭頭不壓按鈕
    const inside = p.x > m && p.x < G.LW - m && p.y > top && p.y < bot;
    if (inside) return;
    const cx = G.LW / 2, cy = G.LH / 2, dx = p.x - cx, dy = p.y - cy;
    const k = Math.min((G.LW / 2 - m) / Math.abs(dx || 1e-3), ((dy < 0 ? cy - top : bot - cy)) / Math.abs(dy || 1e-3));
    const MB = G.MMAP && G.MMAP.box, ax = cx + dx * k, ay0 = dx > 0 ? Math.min(cy + dy * k, G.LH * 0.28) : cy + dy * k, ay = MB && ax > MB.x - 40 && ay0 < MB.y + MB.h + 14 ? MB.y + MB.h + 14 : ay0 /* r3.153.0：不壓小地圖 */, an = Math.atan2(dy, dx), pulse = 0.75 + 0.25 * Math.sin(G.t * 0.15);
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(an); ctx.globalAlpha = pulse;
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-6, -11); ctx.lineTo(-1, 0); ctx.lineTo(-6, 11); ctx.closePath(); ctx.fill(); ctx.restore();
    const dist = Math.round(Math.hypot(tg.x - G.H.x, tg.y - G.H.y) / 10), lab = tg.label + '・' + dist + 'm';
    ctx.font = `700 ${10 * G.FS()}px ${G.FONT}`; const w = ctx.measureText(lab).width + 14, lx = Math.max(8, Math.min(G.LW - w - 8, ax - Math.cos(an) * 34 - w / 2)), ly = Math.max(top - 4, Math.min(bot - 10, ay - Math.sin(an) * 30 - 10)), lx2 = ly < 262 + G.SAFE.t ? Math.max(lx, 158 + (G.SAFE.l || 0)) : lx;   /* r3.21.0：避開夥伴頭像 */
    ctx.fillStyle = 'rgba(12,8,10,.5)'; G.rr(lx2, ly + 2, w, 18, 9); ctx.fill(); G.txt(lab, lx2 + w / 2, ly + 11.5, 10, '#f3d98a', 'center', G.FONT, 700);
  }
  UI.draw = function () {
    const H = G.H, rd = G.RPG.d(), x0 = 10 + Math.min(G.SAFE.l, 6), y0 = 12 + G.SAFE.t;
    ctx.save(); ctx.beginPath(); ctx.arc(x0 + 22, y0 + 22, 21, 0, 6.283); ctx.fillStyle = '#1a1418'; ctx.fill(); ctx.clip(); ctx.drawImage(G.IMG.face_soma, x0 + 1, y0 + 1, 42, 42); ctx.restore();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + 22, y0 + 22, 21.5, 0, 6.283); ctx.stroke();
    ctx.fillStyle = 'rgba(12,8,10,.8)'; G.rr(x0 + 4, y0 + 36, 36, 14, 7); ctx.fill(); G.txt(rd.pk ? '巔' + rd.pk : 'Lv' + rd.lv, x0 + 22, y0 + 43.5, 9, rd.pk ? '#ffb27a' : C.gold, 'center', G.FONT, 900);
    G.txt('蒼真', x0 + 52, y0 + 9, 13, C.ink, 'left', G.FONT_S, 900);
    const bw = 150, lowHp = H.hp < H.hpMax * 0.3 && (G.t >> 3) % 2; bar(x0 + 52, y0 + 20, bw, 8, H.hp / H.hpMax, lowHp ? '#ff5a40' : '#b8342a', lowHp ? '#ffb080' : '#e8684a');   /* r3.64.0：血條加粗、低血量閃爍 */
    G.txt(Math.ceil(H.hp) + '／' + H.hpMax, x0 + 58 + bw, y0 + 24, 12, H.hp < H.hpMax * 0.3 ? '#ff8a7a' : C.ink, 'left', G.FONT, 800);
    bar(x0 + 52, y0 + 31, bw, 3, rd.exp / G.RPG.needNow(), '#a88a3a', '#f0d27a');
    bar(x0 + 52, y0 + 38, bw * 0.6, 4, rd.qi / 100, '#c06a8a', '#ffc0d6'); if (rd.qi >= 100) G.txt('氣滿', x0 + 58 + bw * 0.6, y0 + 40, 9, '#ffc0d6', 'left', G.FONT, 900);
    { const d = G.SC.def || {}, df = G.SAVE.data.diff, safe = (d.safe || d.town) && !(G.TRAIN && G.TRAIN.on);   // r3.19.1：地圖等級與難度
      const gd = G.GDIFF ? G.GDIFF.cur() : null, tag = G.TRAIN && G.TRAIN.on ? G.TRAIN.tag() : safe ? '安全區' : '區域 Lv ' + (G.FOEAI ? G.FOEAI.lvOf() : (d.lv || 1)) + '　難度 ' + (gd ? gd.n : '普通') + (df ? '＋' + df.n : '');   /* r3.146.0：原「敵 Lv・普通」看不懂 */   /* r3.32.0：全遊戲難度＋副本難度 */ ctx.font = `700 ${10 * G.FS()}px ${G.FONT}`; const tw2 = ctx.measureText(tag).width + 14;
      ctx.fillStyle = 'rgba(12,8,10,.62)'; G.rr(x0 + 52, y0 + 46, tw2, 16, 8); ctx.fill(); G.txt(tag, x0 + 59, y0 + 54.5, 10, safe ? '#8fd38f' : gd && gd.n !== '普通' ? gd.c : df ? df.c : C.sub, 'left', G.FONT, 700); }
    const obj = G.STORY.objective();
    if (obj) { ctx.font = `700 ${12 * G.FS()}px ${G.FONT}`; const mw = B.zoom.x - 8 - (x0 + 250) - 30; let ob = obj; while (ob.length > 6 && ctx.measureText(ob).width > mw) ob = ob.slice(0, -2) + '…';   /* r3.21.0：太長截斷，不壓血條 */
      const obj2 = ob, ow = ctx.measureText(ob).width + 30, ox = Math.min(B.zoom.x - ow - 8, Math.max((G.LW - ow) / 2, x0 + 250));
      ctx.fillStyle = 'rgba(12,8,10,.6)'; G.rr(ox, y0 + 3, ow, 26, 13); ctx.fill(); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(ox + 12, y0 + 11); ctx.lineTo(ox + 16, y0 + 16); ctx.lineTo(ox + 12, y0 + 21); ctx.lineTo(ox + 8, y0 + 16); ctx.fill();
      G.txt(obj2, ox + 21, y0 + 16, 12, C.ink); }
    pill(B.zoom, '視角：' + G.ZOOMS[G.SAVE.data.zoom].n); pill(B.menu, '☰ 選單'); if (G.SHOP) G.SHOP.hud(B.potion); if (G.FEATHER) G.FEATHER.hud(B.feather);
    drawGuide();
    if (IN.stick) { const s = IN.stick; ctx.strokeStyle = 'rgba(243,232,210,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.ox, s.oy, 46, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(243,232,210,.32)'; ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, 6.283); ctx.fill(); }
    else if (G.playT < 60 * 30) G.txt('左側滑動移動', 18 + G.SAFE.l, G.LH - 20 - G.SAFE.b, 11, C.dim, 'left', G.FONT, 500);
    const W = G.WPN, wp = W.cur(), sl = W.slots(), n2 = t => t ? t.slice(0, 2) : '';
    const cdOf = (k, tot) => tot ? Math.min(1, (H.cd[k] || 0) / tot) : 0;
    { const an = actNear(); B.atk.label = an ? (an.kind === 'look' ? '查' : '談') : '斬'; round(B.atk, 'atk', true, 0, '', !!an);
      if (an) { const lab = (an.kind === 'look' ? '調查・' : '談・') + an.label; ctx.font = `900 ${12 * G.FS()}px ${G.FONT_S}`; const tw = Math.min(220, ctx.measureText(lab).width + 24), bx = (G.LW - tw) / 2, by = G.LH - 40 - G.SAFE.b;   // 畫面下方正中（不壓技能鍵）
        ctx.fillStyle = 'rgba(150,92,36,.92)'; G.rr(bx, by, tw, 24, 12); ctx.fill(); ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 1.5; G.rr(bx + .75, by + .75, tw - 1.5, 22.5, 11); ctx.stroke(); G.txt(lab, bx + tw / 2, by + 12.5, 12, C.ink, 'center', G.FONT_S, 900); } }
    ['c1', 'c2', 'c3'].forEach((k, i) => { const ch = W.chain(i), cs = H.chainSt, seg = cs && cs.k === i && cs.win > 0 && cs.i < 2 && ch[cs.i + 1] ? cs.i + 1 : 0, mv = wp.MV[ch[seg]], ok = mv && W.mvOk(mv);
      round(B[k], k, false, seg ? 0 : cdOf('k:' + i, W.chainCd(i)), ok ? n2(mv.n) : '', seg > 0, !ok, mv && 'mv:' + mv.id);
      const b = B[k]; for (let j = 0; j < 3; j++) { ctx.fillStyle = !ch[j] ? 'rgba(255,255,255,.15)' : j === seg ? '#f3d98a' : 'rgba(243,217,138,.45)'; ctx.beginPath(); ctx.arc(b.x - 8 + j * 8, b.y + b.r + 5, 2.4, 0, 6.283); ctx.fill(); } });   // 3 點＝3 段，亮點＝下一段
    ['m1', 'm2'].forEach((k, i) => { const b = wp.BD[sl.M[i]]; round(B[k], k, false, b ? cdOf('m:' + b.id, b.cd) : 0, b ? b.n : ''); });
    ['skA', 'skB'].forEach(k => { const s = wp.SK[sl[k === 'skA' ? 'A' : 'B']], lv = s ? W.lv(s.id) : 0; if (!s) return; round(B[k], k, false, s ? cdOf(s.id, W.cd(s) * 60) : 0, s ? (lv ? n2(s.n) : n2(s.n)) : '', false, !lv, s && 'mv:' + s.id); });
    const us = W.ult(), ultOk = us && W.lv(us.id) > 0; round(B.ult, 'ult', false, ultOk ? 1 - rd.qi / 100 : 0, ultOk ? n2(us.n) : '', ultOk && rd.qi >= 100, !ultOk, us && 'mv:' + us.id);
    if (false) { const b = B.talk, a = 0.82 + 0.18 * Math.sin(G.t * 0.15), lab = (UI.near.kind === 'look' ? '調查・' : '談・') + UI.near.label;   // r3.100.0：右上互動鈕取消，改用斬鍵
      ctx.font = `900 ${13 * G.FS()}px ${G.FONT_S}`; b.w = Math.min(220, ctx.measureText(lab).width + 30); b.x = G.LW - 16 - G.SAFE.r - b.w;
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(150,92,36,.92)'; G.rr(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = '#f3d98a'; ctx.lineWidth = 2; G.rr(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 15); ctx.stroke(); ctx.globalAlpha = 1;
      G.txt(lab, b.x + b.w / 2, b.y + b.h / 2 + 1, 13, C.ink, 'center', G.FONT_S, 900); }
    if (H.st === 'atk') G.txt(['一', '二', '三', '四', '五', '六'][H.combo] + '段', B.atk.x, B.atk.y - B.atk.r - 10, 12, C.gold, 'center', G.FONT_S, 900);
    if (UI.ban && !(G.DLG._endT && G.t - G.DLG._endT < 120)) { const T = UI.ban.t, a = Math.max(0, Math.min(1, T / 20, (170 - T) / 20)); ctx.globalAlpha = a;
      const y = G.LH * 0.3, gr = ctx.createLinearGradient(0, 0, G.LW, 0); gr.addColorStop(0, 'rgba(10,6,8,0)'); gr.addColorStop(.5, 'rgba(10,6,8,.72)'); gr.addColorStop(1, 'rgba(10,6,8,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, y - 26, G.LW, UI.ban.sub ? 64 : 52); G.txt(UI.ban.text, G.LW / 2, y, 20, C.ink, 'center', G.FONT_S, 900);
      if (UI.ban.sub) G.txt(UI.ban.sub, G.LW / 2, y + 26, 12, C.gold, 'center', G.FONT, 700); ctx.globalAlpha = 1; }
    if (UI.place && UI.place.t > 0) { UI.place.t--; const a = Math.min(1, UI.place.t / 20, (150 - UI.place.t) / 20); ctx.globalAlpha = Math.max(0, a);
      G.txt('― ' + UI.place.text + ' ―', G.LW / 2, y0 + 48 * G.FS(), 13, C.ink, 'center', G.FONT_S, 900); ctx.globalAlpha = 1; }
    G.BANTER.draw(); UI.drawToast();
  };
  /* r3.146.0：帶「前往」的提示（點一下直接打開對應選單頁） */
  function drawActToast() { const T = UI.tst; ctx.globalAlpha = Math.min(1, T.t / 15); ctx.font = `700 ${13 * G.FS()}px ${G.FONT}`; const lab = '前往設定 ›', w1 = ctx.measureText(T.text).width + 24, w2 = ctx.measureText(lab).width + 24, w = w1 + w2, y = G.LH * 0.62, x = (G.LW - w) / 2;
    ctx.fillStyle = 'rgba(12,8,10,.86)'; G.rr(x, y - 16, w, 32, 16); ctx.fill(); G.txt(T.text, x + w1 / 2, y + 1, 13, C.ink, 'center');
    ctx.fillStyle = 'rgba(150,92,36,.95)'; G.rr(x + w1, y - 16, w2, 32, 16); ctx.fill(); G.txt(lab, x + w1 + w2 / 2, y + 1, 13, '#fbeee0', 'center', G.FONT_S, 900); ctx.globalAlpha = 1;
    UI.B.toast = { x: x + w1, y: y - 16, w: w2, h: 32 }; }
  UI.drawToast = function () { UI.B.toast = null; if (!UI.tst) return; if (UI.tst.act) return drawActToast(); ctx.globalAlpha = Math.min(1, UI.tst.t / 15); ctx.font = `700 ${13 * G.FS()}px ${G.FONT}`; const w = ctx.measureText(UI.tst.text).width + 32, y = G.LH * 0.62;
    ctx.fillStyle = 'rgba(12,8,10,.82)'; G.rr((G.LW - w) / 2, y - 15, w, 30, 15); ctx.fill(); G.txt(UI.tst.text, G.LW / 2, y + 1, 13, C.ink, 'center'); ctx.globalAlpha = 1; };
})();
