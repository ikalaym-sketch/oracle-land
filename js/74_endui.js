/* ==========================================================================
 * 神諭之地 重製版 — 74_endui.js
 * Version : r3.166.0  (2026-11-27)　r3.166.0：結局走向改成行旅繪圖同款和紙面板：天候卡（只有圖示＋晴／雨／霧）、寶珠碎片 12 章、
 *           羈絆三卡（小雪好感／人妖羈絆／心結，下方只用章數小牌提示）、妖怪之友（8 位頭目好感 Lv＋鬼族）；選單位置改到「角色 › 結局走向」，行旅繪圖也能切過來。
 * 舊版    : r3.32.0  (2026-11-17)
 * 變更    : r3.32.0 新增。選單「地圖 › 結局走向」頁＋頭目委託計入人妖羈絆。
 *           ・頂部天氣圖示＝目前走向：晴（真）／雨（暴雨）／霧（無名），不寫結局名。
 *           ・三條數值：小雪好感（門檻 6）、人妖羈絆（≥2 晴、≤−2 雨）、心結（門檻 2）；每條下面列來源：
 *             做過的打勾、選了反方向的打叉、還沒到的章節只顯示「？　第 N 章」不劇透。
 *           ・善良妖怪：各頭目委託是否完成、在妖怪村交談次數（收集用，不影響結局）。
 *           ・頭目委託：完成 4 件人妖羈絆 +1，最多 +2（妖怪村可重複委託不算）。
 *           ・第 12 章第一次進立約殿時提醒一次目前走向。
 * 依賴    : 54_story_c（Q.bond／Q.xue／Q.choice）、08_menu（M.PAGE、M.ui）、17_menu2（結局走向分組）、52_hub（HUB.cur）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, M = G.MENU, ctx = G.ctx, C = G.C, F = () => G.SAVE.data.flags; if (!Q || !M) return;
  const BOSSQ = () => Q.L.filter(q => q.boss);
  const bossBonus = () => Math.min(2, Math.floor(BOSSQ().filter(q => Q.isDone(q.id)).length / 4));
  const b0 = Q.bond; Q.bond = () => b0() + bossBonus();
  const D = id => Q.isDone(id), CHC = k => Q.choice(k), cur = () => Math.min(12, G.HUB.cur());
  function state() { const bond = Q.bond(), xue = Q.xue(), heart = ['c9_s_hayate', 'c10_s_shion'].filter(D).length + (CHC('c6_confess') === 'confess' ? 1 : 0);
    return { bond, xue, heart, end: xue >= 6 && bond >= 2 && heart >= 2 ? 'true' : bond <= -2 ? 'storm' : 'nameless' }; }
  G.ENDSTATE = state;
  /* 來源清單：[章, 名稱, 狀態 'ok'|'no'|'wait', 加減] */
  const ch = (k, ok, c, name, v) => { const x = CHC(k); return [c, name, x ? (x === ok ? 'ok' : 'no') : 'wait', v]; };
  const qd = (id, c, name, v) => [c, name, D(id) ? 'ok' : 'wait', v];
  function src() { return {
    xue: [ch('c6_confess', 'confess', 6, '試煉中承認過錯', '+2'), qd('c7_s_xue', 7, '陪小雪逛城', '+2'), qd('c9_s_song', 9, '八絃的歌', '+1'), ch('c10_xue', 'refuse', 10, '拒絕海神的條件', '+2'), qd('c11_s_relic', 11, '遺物匣', '+1')],
    bond: [ch('c2_stone', 'kappa', 2, '封印石的去向', '±1'), ch('c5_truth', 'truth', 5, '守爐人的真相', '±1'), ch('c8_feast', 'peace', 8, '鬼宴', '±1'), ch('c9_spider', 'spare', 9, '土蜘蛛的處置', '±1'), ch('c10_tide', 'refuse', 10, '潮汐的代價', '±1'),
      [1, '頭目委託 ' + BOSSQ().filter(q => D(q.id)).length + '／' + BOSSQ().length + '（每 4 件 +1）', bossBonus() >= 2 ? 'ok' : bossBonus() ? 'half' : 'wait', '+' + bossBonus()]],
    heart: [qd('c9_s_hayate', 9, '颯的心事', '+1'), qd('c10_s_shion', 10, '汐音的心事', '+1'), ch('c6_confess', 'confess', 6, '試煉中承認過錯', '+1')] }; }
  /* 天氣圖示 */
  function weather(x, y, r, k) { ctx.save(); ctx.translate(x, y);
    if (k === 'true') { ctx.fillStyle = '#f3c75a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#f3c75a'; ctx.lineWidth = 2.5; for (let i = 0; i < 8; i++) { const a = i * 0.785; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); ctx.stroke(); } }
    else { ctx.fillStyle = k === 'storm' ? '#7d8796' : '#b9b4ac'; for (const [cx, cy, rr] of [[-r * 0.3, 0, r * 0.38], [r * 0.15, -r * 0.18, r * 0.45], [r * 0.45, r * 0.05, r * 0.32]]) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.283); ctx.fill(); }
      if (k === 'storm') { ctx.strokeStyle = '#6fb0f0'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const sx = -r * 0.45 + i * r * 0.3; ctx.beginPath(); ctx.moveTo(sx, r * 0.45); ctx.lineTo(sx - r * 0.1, r * 0.8); ctx.stroke(); } }
      else { ctx.strokeStyle = 'rgba(230,226,218,.8)'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.7, r * (0.45 + i * 0.18)); ctx.lineTo(r * 0.7, r * (0.45 + i * 0.18)); ctx.stroke(); } } }
    ctx.restore(); }
  const WN = { true: '晴', storm: '雨', nameless: '霧' };
  const VIL = [['c1_b_patrol', '鎌鼬長兄'], ['c2_b_mud', '河童大將'], ['c3_b_gift', '九尾'], ['c4_b_guard', '雷獸'], ['c6_b_sword', '須佐之男'], ['c7_b_pages', '長壁姬'], ['c8_b_sake', '酒吞童子'], ['c10_b_fest', '綿津見']];
  /* r3.166.0：改成行旅繪圖同款和紙面板——天候卡＋各好感度＋寶珠碎片＋妖怪之友；提示只寫章數，不寫說明文字 */
  const PAPER = '#e8dcc2', PAPER2 = '#d6c7a6', INK = '#2a1d16', INK2 = '#5b4636', SHU = '#b8322a', WOOD = '#5a3e28';
  const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const ST_COL = { ok: '#3f7a3a', no: SHU, half: '#b8862a', wait: 'rgba(91,70,54,.35)' };
  function chip(x, y, c, st) { const t = NUM[c] || c, w = (t.length > 1 ? 26 : 19) * G.FS(), hh = 19 * G.FS(); ctx.fillStyle = st === 'wait' ? 'rgba(255,250,238,.55)' : ST_COL[st];
    G.rr(x, y, w, hh, 4); ctx.fill(); if (st === 'wait') { ctx.strokeStyle = ST_COL.wait; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, hh - 1, 4); ctx.stroke(); }
    G.txt(t, x + w / 2, y + hh / 2 + 1, 10, st === 'wait' ? INK2 : '#fbf4e6', 'center', G.FONT_S, 900); return w + 5; }
  function sec(x, y, w, t) { G.txt(t, x, y, 14, INK, 'left', G.FONT_S, 900); ctx.font = `900 ${14 * G.FS()}px ${G.FONT_S}`; const tw = ctx.measureText(t).width;
    ctx.strokeStyle = 'rgba(107,74,44,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + tw + 10, y); ctx.lineTo(x + w, y); ctx.stroke(); }
  function card(x, y, w, h) { ctx.fillStyle = 'rgba(255,250,238,.5)'; G.rr(x, y, w, h, 6); ctx.fill(); ctx.strokeStyle = 'rgba(107,74,44,.45)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 6); ctx.stroke(); }
  function bar(x, y, w, v, lo, hi, marks) { const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); ctx.fillStyle = 'rgba(91,70,54,.18)'; G.rr(x, y, w, 7, 3.5); ctx.fill();
    if (lo < 0) { const z = x + w * (-lo) / (hi - lo), vx = x + w * t; ctx.fillStyle = v >= 0 ? '#c99a3a' : '#6d7f96'; G.rr(Math.min(z, vx), y, Math.max(3, Math.abs(vx - z)), 7, 3.5); ctx.fill(); }
    else { ctx.fillStyle = '#c99a3a'; G.rr(x, y, Math.max(7, w * t), 7, 3.5); ctx.fill(); }
    for (const [mv, col] of marks) { const mx = x + w * (mv - lo) / (hi - lo); ctx.fillStyle = col; ctx.fillRect(mx - 1, y - 4, 2, 15); } }
  function fate(x, y, w, h) { const { scrollArea, clip } = M.ui, s = state(), S = src(), fs = G.FS(), c = cur();
    const pg = ctx.createLinearGradient(x, y, x, y + h); pg.addColorStop(0, PAPER); pg.addColorStop(1, PAPER2); ctx.fillStyle = pg; G.rr(x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 3; G.rr(x + 1.5, y + 1.5, w - 3, h - 3, 8); ctx.stroke(); ctx.strokeStyle = 'rgba(107,74,44,.35)'; ctx.lineWidth = 1; G.rr(x + 7.5, y + 7.5, w - 15, h - 15, 5); ctx.stroke();
    const pad = 16, X = x + pad, W = w - pad * 2, off = scrollArea('fate', x, y + 9, w, h - 18, M._fateH || 900); clip(x, y + 9, w, h - 18); let yy = y + 14 + off; const y0 = yy;
    /* 天候卡＋寶珠碎片 */
    const ch = 118 * fs, cw = Math.min(210 * fs, W * 0.34); card(X, yy, cw, ch);
    const sky = ctx.createLinearGradient(X, yy, X, yy + ch); sky.addColorStop(0, s.end === 'true' ? 'rgba(120,170,220,.35)' : s.end === 'storm' ? 'rgba(60,70,90,.35)' : 'rgba(190,190,185,.35)'); sky.addColorStop(1, 'rgba(255,250,238,0)');
    ctx.fillStyle = sky; G.rr(X + 1, yy + 1, cw - 2, ch - 2, 6); ctx.fill(); weather(X + cw * 0.36, yy + ch * 0.48, 34 * fs, s.end);
    G.txt(WN[s.end], X + cw * 0.74, yy + ch * 0.46, 34, INK, 'center', G.FONT_S, 900); G.txt('天　候', X + cw * 0.74, yy + ch * 0.78, 10, INK2, 'center', G.FONT_S, 900);
    ctx.fillStyle = SHU; G.rr(X + cw - 22, yy + 8, 14, 14, 3); ctx.fill();
    if (G.SHARD) { const sx = X + cw + 12, sw = W - cw - 12; card(sx, yy, sw, ch); G.txt('寶珠碎片', sx + 12, yy + 18 * fs, 13, INK, 'left', G.FONT_S, 900);
      const z = G.SHARD.count(); G.txt('守 ' + z.safe + '　獻 ' + z.given + '　奪 ' + z.stolen, sx + sw - 12, yy + 18 * fs, 11, z.majin ? SHU : INK2, 'right', G.FONT, 800);
      const n = 12, gap = 5, pw = Math.min(40 * fs, (sw - 24 - gap * (n - 1)) / n), py = yy + 40 * fs;
      for (let i = 1; i <= n; i++) { const k = G.SHARD.shardOf(i), px = sx + 12 + (i - 1) * (pw + gap), cx = px + pw / 2, cy = py + pw * 0.55, r = pw * 0.36;
        ctx.fillStyle = k === 'safe' ? '#4a86c0' : k === 'given' ? '#c99a3a' : k === 'stolen' ? SHU : 'rgba(91,70,54,.14)'; ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.25); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r * 1.25); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
        if (k) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.05); ctx.lineTo(cx + r * 0.4, cy - r * 0.2); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); }
        G.txt(NUM[i], cx, py + pw * 1.35 + 6, 9, i <= c ? INK2 : 'rgba(91,70,54,.4)', 'center', G.FONT_S, 900); }
      const by2 = yy + ch - 22 * fs, bw2 = sw - 24; bar(sx + 12, by2, bw2, Math.min(G.SHARD.TH, z.stolen), 0, G.SHARD.TH + 1, [[G.SHARD.TH, SHU]]); }
    yy += ch + 18;
    /* 三條好感 */
    sec(X, yy, W, '羈絆'); yy += 16;
    const rows = [['小雪好感', s.xue, 0, 10, [[6, SHU]], S.xue], ['人妖羈絆', s.bond, -7, 7, [[-2, '#6d7f96'], [2, SHU]], S.bond], ['心結', s.heart, 0, 3, [[2, SHU]], S.heart]];
    const n3 = W > 480 ? 3 : 1, gw = (W - (n3 - 1) * 10) / n3, rh = 84 * fs;
    rows.forEach(([t, v, lo, hi, mk, list], i) => { const gx = X + (i % n3) * (gw + 10), gy = yy + Math.floor(i / n3) * (rh + 10); card(gx, gy, gw, rh);
      G.txt(t, gx + 12, gy + 18 * fs, 13, INK, 'left', G.FONT_S, 900); G.txt((v > 0 && lo < 0 ? '+' : '') + v, gx + gw - 12, gy + 18 * fs, 16, INK, 'right', G.FONT_S, 900);
      bar(gx + 12, gy + 34 * fs, gw - 24, v, lo, hi, mk); let cx = gx + 12; const seen = {};
      for (const [cc, , st] of list) { const k = cc + st; if (seen[k]) continue; seen[k] = 1; if (cx > gx + gw - 30) break; cx += chip(cx, gy + rh - 28 * fs, cc, st === 'wait' && cc > c ? 'wait' : st); } });
    yy += Math.ceil(3 / n3) * (rh + 10) + 8;
    /* 妖怪之友 */
    sec(X, yy, W, '妖怪之友'); yy += 16;
    const YA = G.YAFF, list = VIL.map(([q, nm]) => [q, nm, +q.slice(1, q.indexOf('_'))]).concat([['oni', '鬼族', 12]]), cols = W > 480 ? 3 : 2, yw = (W - (cols - 1) * 10) / cols, yh = 54 * fs;
    list.forEach(([q, nm, cc], i) => { const gx = X + (i % cols) * (yw + 10), gy = yy + Math.floor(i / cols) * (yh + 8), oni = q === 'oni', met = oni ? !!F().oniFriend : D(q), known = met || cc <= c;
      card(gx, gy, yw, yh); ctx.fillStyle = met ? WOOD : 'rgba(91,70,54,.25)'; ctx.beginPath(); ctx.arc(gx + 24, gy + yh / 2, 15, 0, 6.283); ctx.fill();
      G.txt(known ? nm[0] : '？', gx + 24, gy + yh / 2 + 1, 13, '#fbeee0', 'center', G.FONT_S, 900);
      G.txt(known ? nm : '？？？', gx + 46, gy + yh * 0.34, 12, met ? INK : INK2, 'left', G.FONT_S, 900);
      if (oni) G.txt(met ? '並肩出陣' : '', gx + 46, gy + yh * 0.72, 10, '#3f7a3a', 'left', G.FONT, 800);
      else if (met && YA) { const a = YA.aff(nm), lv = YA.lvOf(a), nx = [5, 15, 30][lv] || 30, pv = [0, 5, 15, 30][lv];
        for (let k = 0; k < 3; k++) { const hx = gx + 50 + k * 13, hy = gy + yh * 0.7; ctx.fillStyle = k < lv ? SHU : 'rgba(91,70,54,.2)'; ctx.beginPath(); ctx.moveTo(hx, hy - 5); ctx.lineTo(hx + 5, hy); ctx.lineTo(hx, hy + 5); ctx.lineTo(hx - 5, hy); ctx.fill(); }
        if (lv < 3) bar(gx + 92, gy + yh * 0.7 - 3, Math.max(20, yw - 104 - 30), a - pv, 0, nx - pv, []); }
      chip(gx + yw - (NUM[cc].length > 1 ? 31 : 24) * fs, gy + 7, cc, met ? 'ok' : 'wait'); });
    yy += Math.ceil(list.length / cols) * (yh + 8) + 8; M._fateH = yy - y0 + 10; ctx.restore(); }
  G.FATE = { draw: fate, state };
  M.PAGE['結局走向'] = fate;
  /* 第 12 章第一次進立約殿：提醒一次 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); if (id === 'W_R12_04' && !F().endHint) { F().endHint = 1; G.SAVE.markDirty(); const s = state(); G.STORY.later(140, () => G.UI.banner('目前走向：' + WN[s.end], '可以在「選單 › 角色 › 結局走向」查看')); } };
})();
