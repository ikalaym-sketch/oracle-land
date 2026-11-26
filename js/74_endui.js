/* ==========================================================================
 * 神諭之地 重製版 — 74_endui.js
 * Version : r3.32.0  (2026-11-17)
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
  M.PAGE['結局走向'] = function (x, y, w, h) { const { box, scrollArea, clip } = M.ui, s = state(), S = src(), fs = G.FS(), c = cur();
    const off = scrollArea('endui', x, y, w, h, M._endH || 900); clip(x, y, w, h); let yy = y + off;
    box(x, yy, w, 88 * fs); weather(x + 50 * fs, yy + 44 * fs, 34 * fs, s.end);
    G.txt('目前走向：' + WN[s.end], x + 100 * fs, yy + 30 * fs, 20, C.gold, 'left', G.FONT_S, 900);
    G.txt(s.end === 'true' ? '三個條件都達成了。' : s.end === 'storm' ? '人與妖怪越走越遠……' : '還差一點。看看下面哪一條還沒滿。', x + 100 * fs, yy + 60 * fs, 13, C.sub, 'left', G.FONT, 600); yy += 88 * fs + 12;
    const bar = (title, v, lo, hi, marks, list) => { const bh = 30 * fs + list.length * 24 * fs + 30 * fs; box(x, yy, w, bh); G.txt(title + '　' + v, x + 14, yy + 18 * fs, 15, C.ink, 'left', G.FONT_S, 900);
      const bx = x + 14, bw = w - 28, by = yy + 34 * fs, t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); ctx.fillStyle = 'rgba(255,255,255,.08)'; G.rr(bx, by, bw, 8, 4); ctx.fill(); ctx.fillStyle = C.gold; G.rr(bx, by, Math.max(8, bw * t), 8, 4); ctx.fill();
      for (const [mv, col] of marks) { const mx = bx + bw * (mv - lo) / (hi - lo); ctx.fillStyle = col; ctx.fillRect(mx - 1, by - 4, 2, 16); G.txt('' + mv, mx, by + 22, 10, col, 'center', G.FONT, 700); }
      let ly = by + 40 * fs; for (const [cc, n, st, add] of list) { const hide = cc > c && st === 'wait', mark = { ok: '✓', no: '✗', half: '◐', wait: '・' }[st], col = { ok: '#8fd38f', no: '#e07a6a', half: '#f3d98a', wait: C.dim }[st];
        G.txt(mark, x + 18, ly, 14, col, 'left', G.FONT, 900); G.txt(hide ? '？　第 ' + cc + ' 章' : '第 ' + cc + ' 章　' + n, x + 40, ly, 13, hide ? C.dim : C.ink, 'left', G.FONT, 600); if (!hide) G.txt(add, x + w - 16, ly, 12, col, 'right', G.FONT, 700); ly += 24 * fs; }
      yy += bh + 10; };
    bar('小雪好感', s.xue, 0, 10, [[6, C.gold]], S.xue);
    bar('人妖羈絆', s.bond, -7, 7, [[-2, '#7d8796'], [2, C.gold]], S.bond);
    bar('心結', s.heart, 0, 3, [[2, C.gold]], S.heart);
    const vh = 34 * fs + Math.ceil(VIL.length / 2) * 26 * fs; box(x, yy, w, vh); G.txt('善良妖怪（收集用，不影響結局）', x + 14, yy + 18 * fs, 14, C.gold, 'left', G.FONT_S, 900);
    VIL.forEach(([q, n], i) => { const cx = x + 14 + (i % 2) * (w / 2), cy = yy + 44 * fs + Math.floor(i / 2) * 26 * fs, ok = D(q), t = F()['yt_' + q] || 0;
      G.txt((ok ? '✓ ' : '・ ') + (ok || q.slice(1, q.indexOf('_')) <= c ? n : '？？？') + (ok ? '　交談 ' + t + ' 次' : ''), cx, cy, 13, ok ? C.ink : C.dim, 'left', G.FONT, 600); });
    yy += vh + 10; M._endH = yy - (y + off); ctx.restore(); };
  /* 第 12 章第一次進立約殿：提醒一次 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); if (id === 'W_R12_04' && !F().endHint) { F().endHint = 1; G.SAVE.markDirty(); const s = state(); G.STORY.later(140, () => G.UI.banner('目前走向：' + WN[s.end], '可以在「選單 › 地圖 › 結局走向」查看')); } };
})();
