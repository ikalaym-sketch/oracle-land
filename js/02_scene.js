/* ==========================================================================
 * 神諭之地 重製版 — 02_scene.js
 * Version : r3.19.1  （r3.19.1：清怪後 25 秒才再生）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 出口加頭目戰鎖（G.EV.bossLock）。
 * 變更    : r3.5.1 修正：地圖圖還沒載入時不呼叫 drawImage（原本讀舊檔進世界地圖時每格報錯、畫面全黑）。
 * 變更    : r3.0.0 各戰鬥場景加妖怪名單 foes（開機預載，生怪時隨機挑選，赤鬼保底）；出口提示之外不變。
 * 變更    : r2.2.0 生怪量加大（每波 4～7 隻），清空後 6 秒再生下一波；各場景素材掉落表 mats。
 * 變更    : r2.1.0 進場後排程夥伴閒聊（10_banter）。
 * 變更    : r2.0.0 場景等級／掉落區域／自動生怪表（META）；清過劇情的戰鬥地圖重新進入時隨機生怪，安全區不刷；toScreen() 供指引箭頭。
 * 變更    : r1.1.0 出口支援矩形觸發（rect，神社鳥居石階）；景深可由場景 depth:[近,遠] 指定（斜俯視神社）。
 * 說明    : 厚塗場景系統——碰撞（外框多邊形＋障礙）、景深縮放（依各場景可走範圍上下緣）、
 *           東西出口（portal）→ 淡出 → 目標場景 arrival 點、鏡頭跟隨與邊界夾住。
 *           依賴：00_core（G.inPoly / G.ZOOMS / G.SAVE）。被 03_actors、06_story 使用。
 * ========================================================================== */
'use strict';
const META = {   // lv＝敵人基準等級；region＝稀品以上掉落的套裝；spawn＝[最少,最多] 隻（重新進入時）；safe＝不生怪
  hub_shrine: { safe: true, region: 'wind' }, W_R01_01: { safe: true, region: 'wind' },
  W_R01_03: { lv: 1, region: 'wind', spawn: [4, 6], mats: ['iron', 'bone', 'cloth'], foes: ['karakasa', 'chochin', 'kodama', 'gaki'] },
  W_R01_04: { lv: 2, region: 'wind', spawn: [4, 7], mats: ['bone', 'cloth', 'jade'], foes: ['akakappa', 'baketanuki', 'kogumo', 'onihei'] },
  W_R01_07: { lv: 3, region: 'wind', spawn: [5, 7], mats: ['bone', 'jade', 'iron'], foes: ['kurooni', 'midorioni', 'kioni', 'onihei'] } };
G.FOES_BOOT = [...new Set(Object.values(META).flatMap(m => m.foes || []))];   // 開機預載本章妖怪
const RESPAWN_T = 1500;   // r3.19.1：清空後 25 秒再生下一波（原 6 秒）
G.SC = {
  id: null, def: null, img: null, y0: 0, y1: 1, cam: { x: 0, y: 0 }, shake: 0, trans: null, lock: {},
  enter(id, at) {
    const d = G.D.scenes[id]; if (!d) return false; Object.assign(d, META[id] || {});
    this.id = id; this.def = d; this.img = G.IMG[id];
    const ys = d.outer.map(p => p[1]); this.y0 = Math.min(...ys); this.y1 = Math.max(...ys);
    const p = at || d.start; Object.assign(G.H, { x: p[0], y: p[1], st: 'idle', t: 0, vx: 0 });
    G.E = []; G.FX = []; G.NUMS = []; G.PROJ = []; G.FIELDS = []; G.ZONES = []; G.BUFF && G.BUFF.clear(); G.H.act = null; this.lock = {}; this.auto = false; this.respawnT = 0;
    this.snapCam();
    const S = G.SAVE.data; S.scene = id; S.x = p[0]; S.y = p[1]; S.hp = G.H.hp; G.SAVE.markDirty(); G.SAVE.flush();   // 換場景＝一次寫入
    G.LOOT = []; G.UI.place = { text: d.name, t: 150 }; G.NPCLIFE && G.NPCLIFE.reset(); G.STORY.onEnter(id);
    if (G.STORY.autoSpawnOk(id)) this.autoSpawn();
    if (G.BANTER) G.BANTER.pendingEnter = 100;   // 進場約 1.7 秒後夥伴說話（有劇情對話時順延）
    return true;
  },
  /* 自動生怪：在距主角 260px 以上的可走點，分批出現；等級＝場景等級＋0～2 */
  autoSpawn() {
    const d = this.def; if (d.safe || !d.spawn) return; this.auto = true; this.respawnT = 0; const n = d.spawn[0] + Math.floor(Math.random() * (d.spawn[1] - d.spawn[0] + 1));
    for (let i = 0, tries = 0; i < n && tries < 200; tries++) { const x = 120 + Math.random() * (d.w - 240), y = this.y0 + Math.random() * (this.y1 - this.y0);
      if (!this.walkable(x, y) || Math.hypot(x - G.H.x, y - G.H.y) < 260) continue; G.spawnOni(x, y, 30 + i * 50, (d.lv || 1) + Math.floor(Math.random() * 3)); i++; }
  },
  toScreen(x, y) { const { Z, vw, vh } = this.view(); return { x: (x - (this.cam.x - vw / 2)) * Z, y: (y - (this.cam.y - vh / 2)) * Z }; },
  walkable(x, y) { const d = this.def; return G.inPoly(x, y, d.outer) && !d.obstacles.some(o => G.inPoly(x, y, o)); },
  depth(y) { const [a, b] = this.def.depth || [0.9, 1.12]; return a + (b - a) * Math.max(0, Math.min(1, (y - this.y0) / Math.max(1, this.y1 - this.y0))); },
  zoom() { return G.LH / G.ZOOMS[G.SAVE.data.zoom].vis; },
  view() { const Z = this.zoom(); return { Z, vw: G.LW / Z, vh: G.LH / Z }; },
  camTarget() { const { vw, vh } = this.view(), d = this.def, H = G.H;
    return { x: vw >= d.w ? d.w / 2 : Math.max(vw / 2, Math.min(d.w - vw / 2, H.x)), y: vh >= d.h ? d.h / 2 : Math.max(vh / 2, Math.min(d.h - vh / 2, H.y - 40)) }; },
  snapCam() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; },
  /* 出口：主角越過出口線（x 方向 18px 內、y 在線段範圍）→ 換場；鎖住的出口顯示提示 */
  checkPortals() {
    if (this.trans) return; const H = G.H;
    for (const p of this.def.portals) {
      let inside;
      if (p.rect) { const [x0, y0, x1, y1] = p.rect; inside = H.x >= x0 && H.x <= x1 && H.y >= y0 && H.y <= y1; }
      else { const [[lx, ya], [, yb]] = p.line, inY = H.y >= Math.min(ya, yb) - 12 && H.y <= Math.max(ya, yb) + 12;
        inside = inY && (p.id === 'west' ? H.x < lx + 22 : H.x > lx - 22); }
      if (!inside) continue;
      const why = this.lock[p.id] || (G.EV && G.EV.bossLock && G.EV.bossLock()) || (!G.D.scenes[p.to] ? '前方的路尚未開放（之後的批次會接上）' : null);
      if (why) { G.UI.toast(why); if (p.rect) H.y -= 8; else H.x += p.id === 'west' ? 6 : -6; return; }
      const back = G.D.scenes[p.to].portals.find(q => q.to === this.id);
      this.trans = { t: 0, to: p.to, at: back ? back.arrival : null };
      return;
    }
  },
  step() {
    if (this.trans) { const T = this.trans; T.t++; if (T.t === 24) this.enter(T.to, T.at); if (T.t >= 48) this.trans = null; }
    if (this.shake > 0) this.shake *= 0.86;
    if (this.auto && !this.trans && !G.DLG.active() && !G.E.some(e => e.st !== 'dead')) { if (++this.respawnT === RESPAWN_T) { this.autoSpawn(); G.UI.toast('妖氣又聚集起來了'); } }
    const t = this.camTarget(); this.cam.x += (t.x - this.cam.x) * 0.12; this.cam.y += (t.y - this.cam.y) * 0.12;
  },
  /* 繪製：背景只畫鏡頭內那一塊（一次 drawImage），世界座標再疊角色 */
  begin() {
    const ctx = G.ctx, { Z, vw, vh } = this.view(), k = this.shake > 0.3 ? this.shake : 0;
    const sx = k ? (Math.random() - 0.5) * k : 0, sy = k ? (Math.random() - 0.5) * k : 0;
    const cx = this.cam.x - vw / 2, cy = this.cam.y - vh / 2;
    ctx.fillStyle = '#0d0b10'; ctx.fillRect(0, 0, G.LW, G.LH);
    const ix = Math.max(0, cx), iy = Math.max(0, cy), iw = Math.min(this.def.w, cx + vw) - ix, ih = Math.min(this.def.h, cy + vh) - iy;
    if (this.img && iw > 0 && ih > 0) ctx.drawImage(this.img, ix, iy, iw, ih, (ix - cx) * Z + sx, (iy - cy) * Z + sy, iw * Z, ih * Z);
    ctx.save(); ctx.translate(sx, sy); ctx.scale(Z, Z); ctx.translate(-cx, -cy);
    return Z;
  },
  end() { G.ctx.restore(); if (this.trans) G.veil(1 - Math.abs(this.trans.t - 24) / 24); },
  /* 出口方向提示箭頭（世界座標） */
  drawExits() {
    const ctx = G.ctx;
    for (const p of this.def.portals) { if (this.lock[p.id] || !G.D.scenes[p.to]) continue;
      if (p.arrow) { const [x, y0] = p.arrow, y = y0 - 26 + Math.sin(G.t * 0.1) * 4;   // 往下的箭頭
        ctx.fillStyle = 'rgba(243,232,210,.6)'; ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x - 8, y - 5); ctx.lineTo(x + 8, y - 5); ctx.fill(); continue; }
      const [[lx, ya], [, yb]] = p.line, y = (ya + yb) / 2, dir = p.id === 'west' ? -1 : 1, x = lx - dir * 34 + Math.sin(G.t * 0.1) * 4 * dir;
      ctx.fillStyle = 'rgba(243,232,210,.55)'; ctx.beginPath(); ctx.moveTo(x + dir * 9, y); ctx.lineTo(x - dir * 5, y - 8); ctx.lineTo(x - dir * 5, y + 8); ctx.fill(); }
  }
};
