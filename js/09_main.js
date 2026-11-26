/* ==========================================================================
 * 神諭之地 重製版 — 09_main.js
 * Version : r3.19.1  （r3.19.1：開始畫面按鈕同字級、副標改故事大綱）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主迴圈加入夥伴出戰（G.PARTY.step）。
 * 變更    : r3.9.1 主迴圈加入劇情過場（G.STORY.cutStep）：過場中不處理玩家輸入、妖怪與出口。
 * 變更    : r3.5.1 修正：開局／讀檔先等目前武器圖集載入才進場（原本存檔武器≠打刀時，從頭開始主角不見且不能動）。
 * 變更    : r3.0.0 開局重置技能冷卻表；FPS 顯示（測試選單）；載入畫面顯示素材進度。
 * 變更    : r2.2.0 主迴圈加入 NPC 生活（11_npclife）。
 * 變更    : r2.1.0 主迴圈加入夥伴閒聊。
 * 變更    : r2.0.0 開局初始化成長系統（07_rpg）；新選單（08_menu）開啟時暫停；掉落物拾取；提示可疊在選單上。
 *           r1.1.0 新遊戲由環谷神社開始；標題背景改神社。
 * 說明    : 開機與流程——載入 → 標題（繼續／新的旅程）→ 遊玩 → 章末畫面。
 *           G.step（60Hz）與 G.render 分派；對話或選單開啟時世界暫停。
 *           載入順序：00_core → 01_assets → 02_scene → 03_actors → 04_ui → 05_dialog → 06_story_ch1 → 09_main
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx; let hasSave = false, titleB = [], err = '';
  G.MAIN = {
    tap(p) {
      if (G.mode === 'end') { G.toTitle(); return; }
      if (G.mode !== 'title') return;
      if (!p) return hasSave ? cont() : fresh();
      for (const b of titleB) if (G.UI.hit(p, b)) return b.f();
    },
    end() { G.mode = 'end'; G.endT = 0; G.SAVE.flush(); }
  };
  function layoutTitle() { const w = 220, x = (G.LW - w) / 2, y = G.LH * 0.66;
    titleB = hasSave ? [{ x, y, w, h: 40, n: '繼續旅程', f: cont }, { x, y: y + 50, w, h: 40, n: '從頭開始', f: fresh }] : [{ x, y, w, h: 44, n: '開始旅程', f: fresh }];
    titleB.push({ x: G.LW - 16 - G.SAFE.r - 70, y: 12 + G.SAFE.t, w: 70, h: 30, n: '全螢幕', f: G.UI.fullscreen, pill: true }); }
  G.toTitle = function () { G.mode = 'title'; hasSave = G.SAVE.has(); G.MENU.open = false; G.DLG.list = null; layoutTitle(); };
  function begin(id, at) { const H = G.H; G.RPG.init(); H.hp = Math.min(H.hpMax, G.SAVE.data.hp || H.hpMax); H.dashCd = 0; H.cd = {}; H.act = null; H.inv = 0;
    const run = () => { G.mode = 'play'; G.playT = 0; G.SC.enter(id, at); }, wid = G.RPG.d().weapon || 'katana';
    if (G.ANIM.get('w_' + wid)) run(); else { G.mode = 'load'; G.ANIM.useWeapon(wid).then(run, e => { console.warn(e); run(); }); } }
  function fresh() { G.SAVE.newGame(); begin('hub_shrine', null); }
  function cont() { const d = G.SAVE.data; let at = [d.x, d.y]; const sc = G.D.scenes[d.scene] ? d.scene : 'hub_shrine';
    G.SC.def = G.D.scenes[sc]; if (!G.SC.walkable(at[0], at[1])) at = null; begin(sc, at); }

  G.step = function () {
    G.UI.step();
    if (G.mode === 'end') { G.endT++; return; }
    if (G.mode !== 'play') return;
    G.playT++;
    if (G.DLG.active()) { G.DLG.step(); G.SC.step(); return; }
    if (G.MENU.open) return;
    if (G.SC.trans) { G.SC.step(); return; }
    if (G.STORY.cut) { G.STORY.cutStep(); G.NPCLIFE.step(); G.SC.step(); G.fxStep(); return; }   // 過場：暫停玩家輸入
    if (G.hitstop > 0) { G.hitstop--; return; }
    if (G.flash > 0) G.flash--;
    G.heroStep();
    for (const e of G.E) G.oniStep(e);
    G.E = G.E.filter(e => e.alpha > 0);
    if (G.PARTY) G.PARTY.step();
    G.STORY.step(); G.BANTER.step(); G.NPCLIFE.step(); G.lootStep(); G.SC.checkPortals(); G.SC.step(); G.fxStep();
    if (G.playT % 600 === 0) { G.SAVE.data.hp = G.H.hp; }   // 只改記憶體，不寫入
  };
  G.render = function () {
    ctx.fillStyle = '#0d0b10'; ctx.fillRect(0, 0, G.LW, G.LH);
    if (G.mode === 'load') { const p = G.ASSET.total ? G.ASSET.done / G.ASSET.total : 0;
      G.txt(err || '載入中…', G.LW / 2, G.LH / 2 - 14, 15, err ? G.C.red : G.C.sub, 'center');
      if (!err) { ctx.fillStyle = 'rgba(243,232,210,.15)'; G.rr(G.LW / 2 - 100, G.LH / 2 + 8, 200, 4, 2); ctx.fill(); ctx.fillStyle = G.C.gold; G.rr(G.LW / 2 - 100, G.LH / 2 + 8, 200 * p, 4, 2); ctx.fill(); }
      return; }
    if (G.mode === 'title') return drawTitle();
    G.drawWorld();
    if (G.mode === 'play') { if (G.MENU.open) { G.MENU.draw(); G.UI.drawToast(); } else if (!G.DLG.active()) G.UI.draw(); else G.DLG.draw(); }
    if (G.mode === 'end') drawEnd();
    if (G.mode === 'play' && G.playT < 30) G.veil(1 - G.playT / 30);
    G.CHEAT && G.CHEAT.drawFps();
  };
  function drawTitle() {
    G.backdrop(G.IMG.W_R01_04, 0.35);
    const g = ctx.createLinearGradient(0, G.LH * 0.4, 0, G.LH); g.addColorStop(0, 'rgba(8,5,8,0)'); g.addColorStop(1, 'rgba(8,5,8,.82)'); ctx.fillStyle = g; ctx.fillRect(0, 0, G.LW, G.LH);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18; G.txt('神諭之地', G.LW / 2, G.LH * 0.36, 56, G.C.ink, 'center', G.FONT_S, 900); ctx.restore();
    G.txt('妖異四起、神玉失落——一段守護人與妖共存之地的旅程，等你開創。', G.LW / 2, G.LH * 0.36 + 46, 14, G.C.gold, 'center', G.FONT_S, 600);   // r3.19.1：改為故事大綱
    for (const b of titleB) { if (b.pill) { G.UI.pill(b, b.n); continue; }
      const main = b === titleB[0]; ctx.fillStyle = main ? 'rgba(120,70,30,.78)' : 'rgba(16,10,14,.78)'; G.rr(b.x, b.y, b.w, b.h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(227,194,122,.75)'; ctx.lineWidth = 1; G.rr(b.x + .5, b.y + .5, b.w - 1, b.h - 1, 8); ctx.stroke();
      G.txt(b.n, b.x + b.w / 2, b.y + b.h / 2 + 1, 16, G.C.ink, 'center', G.FONT_S, 900); }   // r3.19.1：兩顆按鈕同字級
    G.txt('重製版 ' + G.VER, G.LW / 2, G.LH - 16 - G.SAFE.b, 10, G.C.dim, 'center', G.FONT, 500);
  }
  function drawEnd() {
    const a = Math.min(1, G.endT / 60); G.veil(0.75 * a); ctx.globalAlpha = a;
    G.txt('第一章・序　完', G.LW / 2, G.LH * 0.32, 32, G.C.ink, 'center', G.FONT_S, 900);
    G.txt('旅程仍在繼續……', G.LW / 2, G.LH * 0.32 + 40, 14, G.C.gold, 'center', G.FONT, 700);   // r3.19.1：移除開發用回報文字
    if (G.endT > 60) G.txt('點擊回到標題', G.LW / 2, G.LH - 26 - G.SAFE.b, 12, G.C.dim, 'center', G.FONT, 500);
    ctx.globalAlpha = 1;
  }

  /* ---------- 開機 ---------- */
  G.resize(); G.start();
  G.SAVE.load();
  G.ASSET.boot().then(() => { G.toTitle(); }).catch(e => { err = '素材載入失敗，請重新整理'; console.error(e); });
  window.addEventListener('resize', () => { if (G.mode === 'title') layoutTitle(); });
})();
