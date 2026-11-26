/* ==========================================================================
 * 神諭之地 重製版 — 23_warp.js
 * Version : r3.107.0  (2026-11-26)　r3.107.0：副本、合戰難度改疊等級：困難 +12、地獄 +28、無間 +45（取代血量／攻擊倍率）
 * 舊版    : r3.98.0  (2026-11-26)　r3.98.0：難度選項改成與分頁同色系（難度只用小色點區分）；右側說明依行數排版並可捲動，按鈕固定在下方
 * 舊版    : r3.60.0  (2026-11-24)　r3.60.0：合戰一開始就開放　r3.52.0：r3.52.0：合戰頁加「軍備（升級・商店）」鍵
 * 舊版    : r3.49.0  (2026-11-18)　r3.49.0：合戰改版——守城戰換成「守家」（93_kassen），三種模式都改用兩張合戰專屬地圖（紅葉河原第 4 章後、月夜城第 8 章後）
 * 舊版    : r3.33.0  (2026-11-17)　r3.33.0：傳送頁難度與掉寶改成文字說明（不顯示倍率、百分比）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 傳送：頭目戰中禁止。
 * 變更    : r3.5.0 新增。傳送役（各城鎮＋神社）：副本／合戰入口，難度 普通／困難／地獄／無間（＝主角等級 +0／+10／+20／+30）。
 * 說明    : ・副本：選副本＋難度 → 傳到第 1 張；難度存 G.SAVE.data.diff，離開副本即清除（22_event 套用等級與倍率）。
 *           ・合戰：殲滅戰（5 波）／守城戰（守住陣旗 120 秒）／限時討伐（150 秒內擊敗大將）；戰場＝已到過章節的地圖。
 *             合戰中出口封住；完成或失敗後解除。存 G.SAVE.data.war，換地圖即清除。
 *           ・畫面借用選單框架（M.warp 有值時改畫傳送頁）。
 * 依賴    : 08_menu／17_menu2（M.ui）、18_world（WORLD）、20_npc（AMB.P）、22_event（EV、事件工具）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU, S = () => G.SAVE.data, fs = () => G.FS();
  /* r3.107.0：副本難度改疊等級（敵人等級＝主角＋off）：困難 +12、地獄 +28、無間 +45，換算原本的血／攻倍率；不再另乘血量攻擊 */
  const DIFF = [{ n: '普通', off: 0, hp: 1, atk: 1, drop: 0, q: 0, c: '#cdbf9c', t: '敵人和你差不多強。', dt: '一般' }, { n: '困難', off: 12, hp: 1, atk: 1, drop: 0.5, q: 1, c: '#e3b56a', t: '敵人比你強一截，要用心打。', dt: '比較好' },
    { n: '地獄', off: 28, hp: 1, atk: 1, drop: 1, q: 2, c: '#e08a55', t: '需要好裝備和技巧。', dt: '很好，一定有好東西' }, { n: '無間', off: 45, hp: 1, atk: 1, drop: 2, q: 3, c: '#d0605a', t: '極限挑戰，稍有閃失就會倒下。', dt: '最好，一定有精品' }];
  const DUNG = [['EZO', '雪原', '雪女、白鬼與熊。暖爐小屋裡住著熊童子。'], ['FUJI', '樹海火山', '天狗與山姥的地盤，山頂鳥居有青天狗。'], ['IZUMO', '出雲神域', '陰陽師與式神守著大注連繩殿，鬼女在最深處。'], ['SKY', '天空', '浮島上的雷神眾，天空神殿的伏雷是最強的對手。']];
  const MODE = [['home', '守家', '守住我方據點 8 波（布陣時可切成「無限」：第 9 波起逐波變強，撐越久獎勵越多）。布陣時蓋防禦物，戰中用兵糧出兵、強化、下軍令；第 8 波敵大將出陣。據點被攻破或主角第 2 次倒下就結束。'], ['wipe', '殲滅戰', '連續 5 波敵軍，最後一波由大將率領。全部打倒就獲勝。'], ['timed', '限時討伐', '150 秒內打倒敵方大將（帶著護衛）。時間到就失敗。']];
  const WMAP = [['WAR_MOMIJI', '紅葉河原', 0, '白天・守本陣'], ['WAR_MOON', '月夜城', 0, '夜晚・守城門']];   // r3.60.0：一開始就能打（強度跟主角等級）
  const ARMY = ['ashigun', 'ashiyumi', 'bushi', 'yaribushi', 'onihei', 'sohei', 'akazonae'], LEAD = ['murataisho', 'taisho', 'kengo', 'kagemusha'];
  const W = G.WARP = { tab: 0, sel: 0, diff: 0, ch: 1, wm: 0, npc: null, DIFF,
    open(n) { W.npc = n; W.sel = 0; M.warp = 1; M.show(); },
    go(id, data) { const L = G.EV && G.EV.bossLock(); if (L) { G.UI.toast(L); return; } M.close(); if (data.war) S().war = data.war; else delete S().war; if (data.diff) S().diff = data.diff; else delete S().diff; G.SAVE.markDirty(); G.SC.trans = { t: 0, to: id, at: null }; }
  };
  const close0 = M.close.bind(M); M.close = function () { M.warp = 0; close0(); };
  const lvH = () => G.RPG.d().lv;
  const P = () => (G.AMB ? G.AMB.P() : 1);
  const warMap = c => { const L = (G.WORLD.chapters[c] || []).filter(id => { const d = G.D.scenes[id]; return d && !d.boss && !d.safe; }); return c === 1 ? 'W_R01_04' : L[L.length - 1] || L[0]; };
  /* ---------- 畫面 ---------- */
  const draw0 = M.draw;
  M.draw = function () { if (!M.warp) return draw0(); const { box, button, hit, scrollArea, clip } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.92)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * fs(), lv = lvH(), cheat = G.CHEAT && G.CHEAT.on.map;
    button(Rt - 84, T, 84, SH, '✕ 離開', () => M.close());
    if (G.drawIcon) G.drawIcon('ui_icon_map_dungeon', L, T + 1, SH - 2); G.txt('傳送役', L + SH + 6, T + SH / 2 + 1, 17, C.gold, 'left', G.FONT_S, 900);
    let tx = L + 130 * fs(); ['副本', '合戰'].forEach((n, i) => { const on = i === W.tab; ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(tx, T, 92, SH, SH / 2); ctx.fill(); ctx.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; G.rr(tx + .5, T + .5, 91, SH - 1, SH / 2); ctx.stroke();
      G.txt(n, tx + 46, T + SH / 2 + 1, 13, on ? C.ink : C.sub, 'center', G.FONT_S, 900); hit(tx, T, 92, SH, () => { W.tab = i; W.sel = 0; }); tx += 100; });
    /* 難度：子選項色塊 */
    tx += 14; ctx.fillStyle = 'rgba(227,194,122,.35)'; ctx.fillRect(tx - 8, T + 6, 1, SH - 12);
    DIFF.forEach((df, i) => { const on = i === W.diff, w = 64 * Math.max(1, fs() * 0.9), oy = T + 2, oh = SH - 4; if (tx + w > Rt - 96) return;
      ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.92)'; G.rr(tx, oy, w, oh, oh / 2); ctx.fill(); ctx.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; ctx.lineWidth = 1; G.rr(tx + .5, oy + .5, w - 1, oh - 1, oh / 2); ctx.stroke();   // r3.98.0：與分頁同色系，難度只用小點區分
      ctx.fillStyle = df.c; ctx.beginPath(); ctx.arc(tx + 12, oy + oh / 2, 3.5, 0, 6.283); ctx.fill();
      G.txt(df.n, tx + w / 2 + 5, oy + oh / 2 + 1, 12, on ? C.ink : C.sub, 'center', G.FONT_S, 900); hit(tx, oy, w, oh, () => { W.diff = i; }); tx += w + 6; });
    const top = T + SH + 12, h = B - top, lw = Math.min(330, (Rt - L) * 0.45), cx = L + lw + 10, cw = Rt - cx, RH = 52 * fs(), df = DIFF[W.diff];
    const rows = W.tab === 0 ? DUNG : MODE; box(L, top, lw, h); clip(L, top + 4, lw, h - 8);
    rows.forEach(([k, n], i) => { const yy = top + 6 + i * (RH + 6), on = i === W.sel; ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(L + 6, yy, lw - 12, RH, 6); ctx.fill();
      if (!(G.drawIcon && G.drawIcon(W.tab === 0 ? 'ui_icon_map_dungeon' : 'item_weapon_yari_crosspile', L + 12, yy + 7, RH - 14))) { ctx.strokeStyle = 'rgba(227,194,122,.25)'; G.rr(L + 12, yy + 7, RH - 14, RH - 14, 5); ctx.stroke(); }
      G.txt(n, L + RH + 6, yy + RH * 0.36, 14, C.ink, 'left', G.FONT_S, 900);
      const sub = W.tab === 0 ? '敵人 Lv ' + (lv + df.off) + '（' + df.n + '）' : '敵人 Lv ' + (lv + df.off) + '・' + df.n; G.txt(sub, L + RH + 6, yy + RH * 0.72, 10, C.sub, 'left', G.FONT, 700);
      hit(L + 6, yy, lw - 12, RH, () => { W.sel = i; }); }); ctx.restore();
    box(cx, top, cw, h); const r = rows[W.sel]; G.txt(r[1] + '　' + df.n, cx + 16, top + 26, 17, C.gold, 'left', G.FONT_S, 900);
    /* r3.98.0：說明依實際行數往下排；內容超出時可捲動（下方按鈕列固定） */
    const vh = h - 112, Lw = (ctx.font = `500 ${12 * fs()}px ${G.FONT}`, G.wrap(r[2], cw - 32)), tot = 30 + Lw.length * 20 * fs() + 60 * fs() + (W.tab === 1 ? 70 * fs() : 30);
    const off = M.ui.scrollArea('warpR', cx, top + 40, cw, vh, tot); clip(cx, top + 40, cw, vh);
    let yy = top + 54 + off; Lw.forEach(l => { G.txt(l, cx + 16, yy, 12, C.ink, 'left', G.FONT, 500); yy += 20 * fs(); }); yy += 8;
    G.txt('難度：' + df.t, cx + 16, yy, 11, C.sub, 'left', G.FONT, 500); yy += 20 * fs();
    G.txt('掉寶：' + df.dt, cx + 16, yy, 11, C.sub, 'left', G.FONT, 500); yy += 28 * fs();
    if (W.tab === 0) { const ok = lv >= 40 || cheat; if (!ok) G.txt('角色 Lv 40 才能進入副本', cx + 16, yy, 12, '#e07a6a', 'left', G.FONT, 700); ctx.restore();
      button(cx + 16, top + h - 50, Math.min(220, cw - 32), 36, '出發 → ' + r[1], ok ? () => W.go('D_' + r[0] + '_01', { diff: Object.assign({ off: df.off, i: W.diff }, df) }) : null, ok ? 'main' : 'off'); }
    else { const p = P(), ok = m => p >= m[2] || cheat; G.txt('戰場', cx + 16, yy, 12, C.gold, 'left', G.FONT_S, 900); yy += 12;
      if (!ok(WMAP[W.wm])) W.wm = 0; let bx = cx + 16;
      WMAP.forEach((m, j) => { const on = j === W.wm, o = ok(m), bw = 116 * fs(); ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(bx, yy + 6, bw, 40 * fs(), 6); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.4)'; G.rr(bx + .5, yy + 6.5, bw - 1, 40 * fs() - 1, 6); ctx.stroke();
        G.txt(m[1], bx + bw / 2, yy + 6 + 13 * fs(), 12, o ? (on ? C.ink : C.sub) : '#7a6f66', 'center', G.FONT_S, 900); G.txt(o ? m[3] : '第 ' + m[2] + ' 章後', bx + bw / 2, yy + 6 + 29 * fs(), 9, o ? C.sub : '#7a6f66', 'center', G.FONT, 600);
        if (o) hit(bx, yy + 6, bw, 40 * fs(), () => { W.wm = j; }); bx += bw + 8; });
      const m = WMAP[W.wm], map = ok(m) && G.D.scenes[m[0]] ? m[0] : null; if (!map) G.txt('第 4 章後開放合戰', cx + 16, yy + 66 * fs(), 12, '#e07a6a', 'left', G.FONT, 700); ctx.restore();
      button(cx + 16 + Math.min(220, cw - 32) + 10, top + h - 50, 150, 36, '軍備（升級・商店）', G.KASSEN ? () => { M.close(); G.KASSEN.menu = { k: 'bugyo', tab: 0 }; } : null, G.KASSEN ? null : 'off');
      button(cx + 16, top + h - 50, Math.min(220, cw - 32), 36, '出陣 → ' + r[1], map ? () => W.go(map, { war: { mode: r[0], ch: 0, map, diff: Object.assign({ off: df.off, i: W.diff }, df) } }) : null, map ? 'main' : 'off'); }
  };
  /* ---------- 合戰本體（由 22_event 進場時呼叫） ---------- */
  W.battle = function (w, h) {
    if (w.mode === 'home' || w.mode === 'hold') { if (G.KASSEN) { w.mode = 'home'; const k = G.KASSEN.start(w, h); if (k) return k; } return null; }
    const SC = G.SC, d = SC.def, lv = lvH() + w.diff.off, i = w.diff.i, mode = MODE.find(m => m[0] === w.mode);
    const c = { n: mode[1], k: 'war', lv, t: 0, war: 1 }; G.EV.cur = c;
    SC.lock.east = SC.lock.west = '合戰中，無法離開'; SC.auto = false;
    const army = ARMY.concat(h.foesOf(d)), lead = LEAD.filter(h.has);
    const end = ok => { delete SC.lock.east; delete SC.lock.west; delete S().war; G.SAVE.markDirty();
      if (ok) { h.reward(c, 3 * (1 + i * 0.7), Math.min(4, 1 + i), 1 + i * 2); h.finish(c, mode[1] + '　勝利', DIFF[i].n + '・妖玉 +' + (1 + i * 2)); } else h.fail(c, '出口已解除'); };
    G.UI.banner('合戰　' + mode[1], DIFF[i].n + '・敵人 Lv ' + lv);
    if (w.mode === 'wipe') { h.waves(c, [[army, 6], [army, 7], [army, 8], [army, 9], [army, 5, { elite: lead[0] || army[0], ek: 8 }]], () => end(true)); c.obj = () => '殲滅戰（第 ' + (c.wi + 1) + '／5 波）'; }
    else if (w.mode === 'hold') { const p = h.spot(0, 40, d.w / 2, (SC.y0 + SC.y1) / 2); c.flag = { x: p[0], y: p[1] }; c.T = 7200; c.out = 0;
      G.NPC.push(Object.assign({ prop: 1, k: 'sign_village_idle', x: p[0], y: p[1], face: 1, alpha: 0, glow: 1 })); G.EV.props.push(G.NPC[G.NPC.length - 1]);
      h.load(army).then(() => { c.spawned = 1; });
      c.step = () => { c.T--; const far = Math.hypot(G.H.x - c.flag.x, (G.H.y - c.flag.y) * 1.5) > 170; if (!far || c.T < 7200 - 1500) c.reached = 1; c.out = far && c.reached ? c.out + 1 : 0;   // 先走到陣旗（最多 25 秒寬限）才開始算
        if (c.out > 480) return end(false); if (c.spawned && c.T % 300 === 0 && h.alive() < 10) h.wave(c, army, 3, { cx: c.flag.x, cy: c.flag.y, r0: 260, r1: 380 });
        if (c.T <= 0) end(true); };
      c.obj = () => '守城戰：守住陣旗 ' + Math.ceil(c.T / 60) + ' 秒' + (c.out > 60 ? '（離太遠！' + Math.ceil((480 - c.out) / 60) + '）' : ''); }
    else { c.T = 9000; h.load(army.concat(lead)).then(() => { if (G.EV.cur !== c) return; h.wave(c, army, 6, { elite: lead[0] || army[0], ek: 9 }); c.spawned = 1; });
      c.step = () => { c.T--; if (c.spawned && c.bossE && c.bossE.st === 'dead') return end(true); if (c.T <= 0) end(false); };
      c.obj = () => '限時討伐：打倒大將（剩 ' + Math.ceil(c.T / 60) + ' 秒）'; }
    return c;
  };
})();
