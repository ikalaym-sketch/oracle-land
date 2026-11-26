/* ==========================================================================
 * 神諭之地 重製版 — 14_cheat.js
 * Version : r3.7.0  (2026-11-13)
 * 變更    : r3.7.0 測試頁加「顯示可走範圍」開關。
 * 變更    : r3.0.2 新增「動作檢視」：列出目前武器全部動作，點選即播放（檢查錨點／特效位置用）。
 * 變更    : r3.0.0 新增。選單「測試」分頁（舊版測試模式擴充版）：開關類＋一鍵指令。
 * 說明    : 開關（只存在記憶體，重新整理即關閉，不寫入存檔）：
 *             無敵 god／秒殺 kill／技能無冷卻 nocd／氣永遠滿 qi／免費學習 free／奧義免 Lv40 unlock／顯示 FPS fps
 *           指令（會改存檔，關選單時一次寫入）：等級 +10／滿級、技能點 +20、目前武器熟練度滿、全武器熟練度滿、
 *             目前武器技能全 Lv5、錢 +10000、素材 +50、生成裝備（選品質）、清除敵人、生成妖怪 ×5、傳送場景、快速換武器。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU;
  const CH = G.CHEAT = { on: { god: false, kill: false, nocd: false, qi: false, free: false, unlock: false, fps: false }, q: 3,
    fpsV: 0, _fc: 0, _ft: 0,
    drawFps() { if (!CH.on.fps) return; const t = performance.now(); CH._fc++; if (t - CH._ft >= 500) { CH.fpsV = Math.round(CH._fc * 1000 / (t - CH._ft)); CH._fc = 0; CH._ft = t; }
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(G.LW / 2 - 70, 2 + G.SAFE.t, 140, 18);
      G.txt('FPS ' + CH.fpsV + '　敵 ' + G.E.length + '　效 ' + G.FX.length, G.LW / 2, 11 + G.SAFE.t, 10, CH.fpsV >= 55 ? '#8fd38f' : CH.fpsV >= 40 ? '#f3d98a' : '#e07a6a', 'center', G.FONT, 700); } };
  const R = () => G.RPG, W = () => G.WPN, done = t => { G.SAVE.markDirty(); G.UI.toast(t); };
  const TOG = [['god', '無敵'], ['kill', '秒殺'], ['nocd', '技能無冷卻'], ['qi', '氣永遠滿'], ['free', '免費學技能'], ['unlock', '奧義免 Lv40'], ['fps', '顯示 FPS'], ['walk', '顯示可走範圍']];
  const CMD = [
    ['等級 +10', () => { const d = R().d(); for (let i = 0; i < 10 && d.lv < 100; i++) { d.lv++; d.sp += 2; } d.exp = 0; R().recalc(); G.H.hp = G.H.hpMax; done('Lv ' + d.lv); }],
    ['等級 100', () => { const d = R().d(); d.sp += (100 - d.lv) * 2; d.lv = 100; d.exp = 0; R().recalc(); G.H.hp = G.H.hpMax; done('Lv 100'); }],
    ['技能點 +20', () => { R().d().sp += 20; done('技能點 ' + R().d().sp); }],
    ['此武器熟練滿', () => { const p = W().prof(); p.lv = W().PROF_MAX; p.exp = 0; done(W().cur().n + ' 熟練度 Lv12'); }],
    ['全武器熟練滿', () => { for (const w of W().LIST) { const p = W().prof(w.id); p.lv = W().PROF_MAX; p.exp = 0; } done('10 種武器熟練度 Lv12'); }],
    ['此武器技能全滿', () => { const d = R().d(), w = W().cur(); d.wsk = d.wsk || {}; for (const s of w.sk) d.wsk[W().key(s.id)] = 5; const sl = W().slots(); sl.A = sl.A || w.sk[0].id; sl.B = sl.B || w.sk[1].id; W().prof().lv = W().PROF_MAX; done(w.n + ' 技能全 Lv5'); }],
    ['錢 +10000', () => { R().d().gold += 10000; done('錢 ' + R().d().gold); }],
    ['素材 +50', () => { const d = R().d(); for (const k in R().MATS) d.mats[k] = (d.mats[k] || 0) + 50; done('素材各 +50'); }],
    ['生成裝備', () => { const d = R().d(), it = R().roll(Math.max(1, d.lv), G.SC.def.region || 'wind'); it.q = CH.q; const Q = R().QUAL[CH.q];
      const keys = Object.keys(R().AFF); it.aff = []; for (let i = 0; i < Q.aff; i++) { const k = keys[Math.floor(Math.random() * keys.length)]; it.aff.push([k, Math.round(R().AFF[k][1] * (1 + d.lv * 0.18) * 10) / 10]); }
      if (R().addItem(it)) done('獲得【' + Q.n + '】' + R().name(it)); }],
    ['清除敵人', () => { for (const e of G.E) if (e.st !== 'dead') { e.st = 'dead'; e.t = 0; } G.UI.toast('已清除'); }],
    ['生成妖怪 ×5', () => { const H = G.H; for (let i = 0; i < 5; i++) { const a = Math.random() * 6.283, x = H.x + Math.cos(a) * 200, y = H.y + Math.sin(a) * 60; if (G.SC.walkable(x, y)) G.spawnOni(x, y, i * 20); } G.UI.toast('妖怪出現（' + G.E.length + '）'); }],
    ['回復全滿', () => { G.H.hp = G.H.hpMax; R().d().qi = 100; G.UI.toast('生命・氣 全滿'); }]
  ];
  M.TABS.push('測試');
  M.PAGE['測試'] = function (x, y, w, h) {
    const { box, button, scrollArea, clip } = M.ui, fs = G.FS(), RH = 34 * fs, gap = 6, cols = w > 560 ? 3 : 2, cw = (w - (cols - 1) * gap) / cols;
    const scenes = Object.keys(G.D.scenes), wl = W().LIST;
    const rows = Math.ceil(TOG.length / cols) + 1 + Math.ceil(CMD.length / cols) + 1 + 1 + Math.ceil(scenes.length / cols) + 1 + Math.ceil(wl.length / (cols + 2));
    const off = scrollArea('cheat', x, y, w, h, rows * (RH + gap) + 120 + Math.ceil(((W().unit() && Object.keys(W().unit().act).length) || 0) / (cols + 1)) * (RH + gap) + 40); clip(x, y, w, h);
    let yy = y + off; const head = t => { G.txt(t, x + 4, yy + 12, 13, C.gold, 'left', G.FONT_S, 900); yy += 26; };
    const grid = (list, n, f) => { list.forEach((it, i) => { const c = i % n, r = Math.floor(i / n), ww = (w - (n - 1) * gap) / n; f(it, x + c * (ww + gap), yy + r * (RH + gap), ww); }); yy += Math.ceil(list.length / n) * (RH + gap) + 6; };
    head('開關（重新整理後自動關閉）');
    grid(TOG, cols, ([k, n], bx, by, bw) => button(bx, by, bw, RH, n + '：' + (CH.on[k] ? '開' : '關'), () => { CH.on[k] = !CH.on[k]; }, CH.on[k] ? 'main' : ''));
    head('指令');
    grid(CMD, cols, ([n, f], bx, by, bw) => button(bx, by, bw, RH, n, f));
    head('生成裝備品質');
    grid(R().QUAL, 6, (q, bx, by, bw) => button(bx, by, bw, RH, q.n, () => { CH.q = R().QUAL.indexOf(q); }, CH.q === R().QUAL.indexOf(q) ? 'main' : ''));
    head('傳送');
    grid(scenes, cols, (id, bx, by, bw) => button(bx, by, bw, RH, G.D.scenes[id].name, () => { M.close(); G.SC.trans = { t: 0, to: id, at: null }; }, id === G.SC.id ? 'off' : ''));
    head('快速換武器（目前：' + W().cur().n + '）');
    grid(wl, cols + 2, (wp, bx, by, bw) => button(bx, by, bw, RH, wp.n, () => W().equip(wp.id), wp.id === W().curId() ? 'main' : W().loading ? 'off' : ''));
    head('動作檢視（點了關選單並播放 1 次，不造成傷害）');
    const u = W().unit(), acts = u ? Object.keys(u.act).sort() : [];
    grid(acts, cols + 1, (n, bx, by, bw) => button(bx, by, bw, RH, n, () => { M.close(); G.H.face = G.H.face || 1; G.heroStartAct(n, 'skill', { ev: [] }); G.UI.toast(n + '（' + (u.act[n].c && u.act[n].c.n || '') + '）'); }));
    ctx.restore();
  };
})();
