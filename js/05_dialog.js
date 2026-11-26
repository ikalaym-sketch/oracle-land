/* ==========================================================================
 * 神諭之地 重製版 — 05_dialog.js
 * Version : r3.90.0  (2026-11-26)　r3.90.0：選項框加寬（440→560）；選項文字太長先縮字、再分兩行，不再超出框
 * 舊版    : r2.0.0  (2026-11-10)
 * 變更    : r2.0.0 對話框高度、行距、換行寬度隨字體大小縮放；新增鐵心頭像。
 * 變更    : r1.1.0 新增小雪／阿松／勘婆／權爺／小太頭像；G.DLG.who＝目前說話者（NPC 切說話格）。
 * 說明    : 視覺小說式對話——頭像（有素材才顯示，沒有就只顯示名牌）、打字機（三段速度）、
 *           選項（可設旗標）、{do} 動作行、記錄（最近 60 句）、快進。
 *           對話結束時才把旗標／記錄寫入存檔 1 次（不在每句寫）。
 * 行格式  : {who,text} ｜ {choice:[{label,set,then:[...]}]} ｜ {do:fn}
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SPEED = [0.45, 0.8, 1.6];
  const FACE = { '蒼真': 'face_soma', '白丸': 'face_shiro', '小雪': 'face_xue', '阿松': 'face_matsu', '勘婆': 'face_okan', '權爺': 'face_gen', '小太': 'face_kota', '鐵心': 'face_smith' };
  const D = G.DLG = { list: null, i: 0, shown: 0, done: null, choice: null, log: false, skip: false, B: {},
    active() { return !!this.list; },
    get who() { const L = this.list && this.list[this.i]; return L && L.who; },
    start(list, done) { this.list = list.slice(); this.i = 0; this.done = done; this.skip = false; this.log = false; G.IN.stick = null; this.prep(); },
    prep() {
      while (this.list && this.list[this.i] && this.list[this.i].do) { const f = this.list[this.i].do; this.i++; f(); }
      const L = this.list && this.list[this.i]; this.shown = 0; this.choice = L && L.choice ? L.choice : null;
      if (!L) return this.finish();
      if (L.text) { const lg = G.SAVE.data.log; lg.push([L.who || '', L.text]); if (lg.length > 60) lg.splice(0, lg.length - 60); }
    },
    finish() { const d = this.done; this.list = null; this.choice = null; G.SAVE.markDirty(); G.SAVE.flush(); d && d(); },
    advance() { const L = this.list && this.list[this.i]; if (!L || this.choice) return;
      if (this.shown < L.text.length) { this.shown = L.text.length; return; }
      this.i++; if (this.i >= this.list.length) this.finish(); else this.prep(); },
    step() { if (!this.list) return; const L = this.list[this.i]; if (!L || !L.text) return;
      if (this.shown < L.text.length) this.shown = Math.min(L.text.length, this.shown + SPEED[G.SAVE.data.textSpeed]);
      else if (this.skip && !this.choice && G.t % 6 === 0) this.advance(); },
    tap(p) {
      const B = this.B, hit = G.UI.hit;
      if (this.log) { this.log = false; return; }
      if (B.log && hit(p, B.log)) { this.log = true; return; }
      if (B.skip && hit(p, B.skip)) { this.skip = !this.skip; return; }
      if (this.choice) { const ch = this.choice;
        for (let k = 0; k < ch.length; k++) { const c = ch[k]; if (!hit(p, choiceRect(k, ch.length))) continue;
          if (c.set) G.SAVE.data.flags[c.set] = true;
          G.SAVE.data.log.push(['▶', c.label]); this.list.splice(this.i, 1, ...(c.then || [])); if (this.i >= this.list.length) this.finish(); else this.prep(); return; }
        return; }
      this.skip = false; this.advance();
    }
  };
  const box = () => { const w = Math.min(G.LW - 32 - G.SAFE.l - G.SAFE.r, 800), h = Math.round(116 * Math.max(1, G.FS() * 1.06)); return { x: (G.LW - w) / 2, y: G.LH - h - 12 - G.SAFE.b, w, h }; };
  const choiceRect = (k, n) => { const w = Math.min(560, G.LW - 80), h = 44, top = G.LH * 0.5 - (n * 54) / 2; return { x: (G.LW - w) / 2, y: top + k * 54, w, h }; };
  /* r3.90.0：選項文字太長時先縮字（15→12），還放不下就分兩行（不再超出選項框） */
  function choiceLabel(t, b) { const fs = G.FS(), maxW = b.w - 28, cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 1;
    for (let s = 15; s >= 12; s--) { ctx.font = `900 ${s * fs}px ${G.FONT_S}`; if (ctx.measureText(t).width <= maxW) return G.txt(t, cx, cy, s, G.C.ink, 'center', G.FONT_S, 900); }
    ctx.font = `900 ${12 * fs}px ${G.FONT_S}`; const L = G.wrap(t, maxW), s2 = L.length > 2 ? 11 : 12, lh = Math.min(17, (b.h - 6) / Math.min(2, L.length));
    if (L.length > 2) { ctx.font = `900 ${11 * fs}px ${G.FONT_S}`; const L2 = G.wrap(t, maxW); L.length = 0; L.push(...L2.slice(0, 2)); if (L2.length > 2) L[1] = L[1].slice(0, -1) + '…'; }
    L.slice(0, 2).forEach((l, i) => G.txt(l, cx, cy + (i - (Math.min(2, L.length) - 1) / 2) * lh, s2, G.C.ink, 'center', G.FONT_S, 900)); }
  D.draw = function () {
    const L = this.list && this.list[this.i]; if (!L) return;
    if (this.log) return drawLog();
    if (this.choice) { G.veil(0.35);
      G.txt('你要怎麼做？', G.LW / 2, choiceRect(0, this.choice.length).y - 22, 13, G.C.sub, 'center', G.FONT, 500);
      this.choice.forEach((c, k) => { const b = choiceRect(k, this.choice.length); ctx.fillStyle = 'rgba(16,10,14,.9)'; G.rr(b.x, b.y, b.w, b.h, 8); ctx.fill();
        ctx.strokeStyle = G.C.gold; ctx.lineWidth = 1.2; G.rr(b.x + .5, b.y + .5, b.w - 1, b.h - 1, 8); ctx.stroke(); choiceLabel(c.label, b); });
      return; }
    const { x, y, w, h } = box();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(20,14,18,.93)'); g.addColorStop(1, 'rgba(10,7,10,.97)');
    ctx.fillStyle = g; G.rr(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.55)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 10); ctx.stroke();
    let tx = x + 22; const face = FACE[L.who];
    if (face) { ctx.save(); G.rr(x + 12, y + 14, 88, 88, 8); ctx.clip(); ctx.fillStyle = '#231a1e'; ctx.fillRect(x + 12, y + 14, 88, 88); ctx.drawImage(G.IMG[face], x + 12, y + 14, 88, 88); ctx.restore();
      ctx.strokeStyle = 'rgba(227,194,122,.7)'; G.rr(x + 12.5, y + 14.5, 87, 87, 8); ctx.stroke(); tx = x + 114; }
    if (L.who) { ctx.font = `900 15px ${G.FONT_S}`; const nw = ctx.measureText(L.who).width + 22; ctx.fillStyle = G.C.gold; G.rr(tx - 4, y - 13, nw, 26, 13); ctx.fill(); G.txt(L.who, tx - 4 + nw / 2, y, 15, '#1a1014', 'center', G.FONT_S, 900); }
    const narr = !L.who || L.text[0] === '（';
    const fs = G.FS(); ctx.font = `${narr ? 500 : 700} ${16 * fs}px ${G.FONT}`; const lines = G.wrap(L.text.slice(0, Math.floor(this.shown)), x + w - tx - 26);
    lines.slice(0, 3).forEach((ln, i) => G.txt(ln, tx, y + 34 + i * 25 * fs, 16, narr ? '#d6c9b2' : '#f6eddb', 'left', G.FONT, narr ? 500 : 700));
    if (this.shown >= L.text.length && (G.t >> 4) % 2) G.txt('▼', x + w - 20, y + h - 16, 11, G.C.gold, 'center');
    const B = this.B; B.log = { x: x + w - 128, y: y - 30, w: 56, h: 24 }; B.skip = { x: x + w - 64, y: y - 30, w: 56, h: 24 };
    G.UI.pill(B.log, '記錄'); G.UI.pill(B.skip, this.skip ? '快進中' : '快進', this.skip);
  };
  function drawLog() {
    G.veil(0.86); const x = Math.max(40, (G.LW - 700) / 2), top = 60 + G.SAFE.t, bot = G.LH - 34 - G.SAFE.b;
    G.txt('對話記錄', G.LW / 2, 28 + G.SAFE.t, 16, G.C.gold, 'center', G.FONT_S, 900);
    ctx.font = `500 ${13 * G.FS()}px ${G.FONT}`;
    const rows = []; let hgt = 0;   // 由最新往回塞，塞滿為止，再由上往下畫
    for (const [who, t] of G.SAVE.data.log.slice().reverse()) { const ln = G.wrap(t, G.LW - x * 2 - 90), hh = ln.length * 20 + 8; if (hgt + hh > bot - top) break; rows.unshift([who, ln]); hgt += hh; }
    let y = top;
    for (const [who, ln] of rows) { G.txt(who, x, y, 13, G.C.gold, 'left', G.FONT_S, 900); ln.forEach((s, i) => G.txt(s, x + 84, y + i * 20, 13, G.C.ink, 'left', G.FONT, 500)); y += ln.length * 20 + 8; }
    G.txt('點擊任意處返回', G.LW / 2, G.LH - 16 - G.SAFE.b, 11, G.C.dim, 'center', G.FONT, 500);
  }
})();
