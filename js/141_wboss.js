/* ==========================================================================
 * 神諭之地 重製版 — 141_wboss.js
 * Version : r3.115.0  (2026-11-26)　r3.115.0：鎌鼬幻影可出現在第 1 章地圖（第 1 章地圖不檢查自動生怪）
 * 舊版    : r3.114.0  (2026-11-26)
 * 變更    : r3.114.0 新增。世界頭目重做（舊版 22_event 是放大的一般妖怪、開放旗標從未打開，整套停用）。
 *           ・改用頭目引擎的真頭目（有專屬招式／預警）：
 *             1. 副本小頭目：富士（弁慶組、龜井組）、天空（白虎朱雀、青龍玄武）、出雲（前鬼後鬼）——到訪過該副本才會出現。
 *             2. 章節頭目幻影：已擊敗的章節頭目，名稱加「幻影・」，出現在該章野外地圖。
 *             3. 終局：主線通關後加入形代御前（第 7 章地圖）、道反之大神・荒魂（第 11／12 章地圖）。
 *           ・開放：第 2 章通關（舊存檔自動開放）。每 30 分鐘宣告一次，15 分鐘內有效；地點只挑到訪過的野外地圖。
 *           ・點右上提醒：只有世界頭目＝直接傳送；同時有世界事件＝先選要去哪一個。到了 2.5 秒後開打。
 *           ・強度：等級＝地圖等級 +3（困難以上再套 139 的公式）、血量 ×1.5。獎勵：錢、裝備、妖玉 +5、難度素材（134 頭目掉落照常）。
 *           ・頭目戰進行中不換圖（沿用 EV.bossLock）。
 * 存檔    : save.wb2 = { id, map, n, until, next, done }。
 * 依賴    : 26_boss（DEF／load／start／enc）、22_event（EV.H.reward）、140_events（EV.goWorld）、139_foeai（等級）、52_hub（travel）。
 * ========================================================================== */
'use strict';
(function () {
  const EV = G.EV, B = G.BOSS, SC = G.SC, H = G.H; if (!EV || !B || !EV.H) return;
  const S = () => G.SAVE.data, F = () => G.SAVE.data.flags, nm = id => (G.D.scenes[id] || {}).name || id, rnd = a => a[Math.floor(Math.random() * a.length)];
  const GAP = 30 * 60000, LIFE = 15 * 60000, MINI = [['mb_fuji2', 'D_FUJI_02'], ['mb_fuji3', 'D_FUJI_03'], ['mb_sky2', 'D_SKY_02'], ['mb_sky3', 'D_SKY_03'], ['mb_izumo3', 'D_IZUMO_03']];
  const CHB = { kama: 1 }, END = [['h_katashiro', [7]], ['h_chigaeshi', [11, 12]]], P = () => (G.AMB && G.AMB.P ? G.AMB.P() : 1), done = () => !!F().boss_W_R12_06;
  /* 舊世界頭目停用 */
  EV.wbWorld = () => null; EV.wbNow = () => null;
  const fieldMaps = chs => { const s = S().seen || {}, out = []; for (const c of chs) for (const id of (G.WORLD.chapters[c] || (c === 1 ? ['W_R01_03', 'W_R01_04'] : []))) { const d = G.D.scenes[id]; if (d && !d.boss && !d.safe && !d.town && s[id] && (c === 1 || G.STORY.autoSpawnOk(id))) out.push(id); } return out; };
  function chOf(id, D) { if (CHB[id]) return CHB[id]; const m = D && D.map && /^W_R(\d\d)_/.exec(D.map[0] || ''); return m ? +m[1] : 0; }
  function pool() { const L = [], seen = S().seen || {}, all = []; for (let c = 2; c <= Math.min(12, P()); c++) all.push(c);
    for (const [id, dm] of MINI) if (B.DEF[id] && seen[dm]) { const maps = fieldMaps(all); if (maps.length) L.push({ id, maps, ph: 0 }); }
    for (const id in B.DEF) { if (/^(h_|t_|mb_)/.test(id)) continue; const D = B.DEF[id], c = chOf(id, D); if (!c) continue; const bm = id === 'kama' ? 'W_R01_07' : D.map[0]; if (!F()['boss_' + bm] && !(id === 'kama' && F().kamaBeat)) continue;
      const maps = fieldMaps([c]); if (maps.length) L.push({ id, maps, ph: 1 }); }
    if (done()) for (const [id, chs] of END) if (B.DEF[id]) { const maps = fieldMaps(chs); if (maps.length) L.push({ id, maps, ph: 0, end: 1 }); }
    return L; }
  const open = () => P() >= 3;
  const nameOf = q => (q.ph ? '幻影・' : '') + (B.DEF[q.id] ? B.DEF[q.id].name : q.id);
  function now() { const b = S().wb2; return b && !b.done && b.until > Date.now() ? b : null; }
  function announce(force) { if (!open()) return null; const s = S(), t = Date.now(); let b = s.wb2; if (b && t < b.next && !force) return now();
    const L = pool(); if (!L.length) { s.wb2 = { next: t + 5 * 60000, until: 0, done: 1 }; return null; } const last = b && b.id; let q = rnd(L); if (L.length > 1 && q.id === last) q = rnd(L.filter(x => x.id !== last));
    b = s.wb2 = { id: q.id, map: rnd(q.maps), n: nameOf(q), ph: q.ph, until: t + LIFE, next: t + GAP, done: 0 }; G.SAVE.markDirty();
    if (G.mode === 'play') G.UI.banner('世界頭目現身：' + b.n, '出現在「' + nm(b.map) + '」・15 分鐘內有效（點右上提醒前往）');
    if (SC.id === b.map) arm(b.map); return b; }
  /* ---------- 開打 ---------- */
  let armT = 0;
  function arm(id) { const b = now(); if (!b || b.map !== id || armT) return; armT = 1; G.STORY.later(150, () => { armT = 0; fight(id); }); }
  function fight(id) { const b = now(); if (!b || b.map !== id || SC.id !== id || (B.enc && !B.enc.done)) return; const D = B.DEF[b.id]; if (!D) return;
    G.UI.toast('強大的氣息逼近了……'); const want = SC.id;
    Promise.resolve(B.load(b.id)).then(() => G.ASSET.enemies(D.foes || [])).then(() => { if (SC.id !== want || !now()) return; const p = (SC.snap && SC.snap(H.x + 260, H.y, 'open', 320)) || [H.x + 260, H.y];
      const lv = (SC.def.lv || 1) + 3, enc = B.start(b.id, { x: p[0], y: p[1], lv, sub: '世界頭目', onWin: () => win(b) }); if (!enc) return;
      enc.name = b.n; enc.wb2 = 1; for (const u of enc.units) { u.hp = u.hpMax = Math.round(u.hpMax * 1.5); }
      G.UI.banner('世界頭目　' + b.n, b.ph ? '敗者的執念化成了幻影' : '「來吧，讓我看看你的本事。」'); }).catch(e => { console.warn('wboss', e); G.UI.toast('世界頭目載入失敗'); }); }
  function win(b) { const s = S(); if (s.wb2 === b) b.done = 1; G.SAVE.markDirty(); const lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1));
    try { EV.H.reward({ lv }, 4, 3, 5); } catch (e) {} G.UI.banner('擊敗世界頭目', b.n + '　妖玉 +5'); }
  /* ---------- 進圖、計時 ---------- */
  (function hk() { if (!G.STORY || !G.STORY.onEnter) return setTimeout(hk, 60); const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { armT = 0; const r = en0(id); arm(id); return r; };
    const st0 = G.STORY.step.bind(G.STORY); let tk = 0; G.STORY.step = function () { st0(); if (++tk % 600 === 0 && G.mode === 'play' && F().prologue) announce(); }; })();
  /* ---------- 提醒文字、點擊前往 ---------- */
  const wt0 = EV.worldText; EV.worldText = function () { const t = wt0.call(EV), b = now(); return b ? t + '　｜　世界頭目：' + b.n + '・' + nm(b.map) + '　剩 ' + Math.max(0, Math.ceil((b.until - Date.now()) / 60000)) + ' 分' : t; };
  function goBoss() { const b = now(); if (!b) return G.UI.toast('目前沒有世界頭目'); const lk = EV.bossLock && EV.bossLock(); if (lk) return G.UI.toast(typeof lk === 'string' ? lk : '頭目戰中，不能離開');
    if (SC.id === b.map) return arm(b.map); G.HUB.travel(0, '你們趕往「' + nm(b.map) + '」……（世界頭目・' + b.n + '）', [], b.map); }
  const go0 = EV.goWorld; EV.goWorld = function () { const b = now(), w = EV.world && EV.world(), we = w && w.k && !w.done; if (!b) return go0 && go0.call(EV); if (!we) return goBoss();
    G.DLG.start([{ who: '', text: '要前往哪一個？' }, { choice: [{ label: '世界事件', then: [{ do: () => go0.call(EV) }] }, { label: '世界頭目・' + b.n, then: [{ do: goBoss }] }, { label: '取消', then: [] }] }]); };
  /* 世界事件已完成／沒有時，右上改顯示世界頭目提醒（同位置、紅色） */
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); const Bt = G.UI.B, b = now(); if (Bt.wev || !b || G.mode !== 'play' || !Bt.menu) return; const ctx = G.ctx;
    const t = '世界頭目：' + b.n + '・' + nm(b.map) + '　剩 ' + Math.max(0, Math.ceil((b.until - Date.now()) / 60000)) + ' 分（點擊前往）'; ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`;
    const tw = Math.min(G.LW * 0.46, ctx.measureText(t).width + 22), x = Bt.menu.x + Bt.menu.w - tw, y = Bt.menu.y + Bt.menu.h + 8, h = 24;
    ctx.fillStyle = 'rgba(110,24,20,.8)'; G.rr(x, y, tw, h, 12); ctx.fill(); G.txt(t, x + tw / 2, y + h / 2 + 1, 11, '#ffd2b0', 'center', G.FONT, 700); Bt.wev = { x, y, w: tw, h }; };
  G.WB2 = { pool, announce, now, fight, goBoss };
})();
