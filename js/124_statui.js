/* ==========================================================================
 * 神諭之地 重製版 — 124_statui.js
 * Version : r3.203.0  (2026-11-28)　r3.203.0：夥伴屬性頁改成有欄名的表格
 * 舊版    : r3.102.0  (2026-11-26)　r3.102.0：角色頁可由其他模組加分頁（M.CTABX：共鳴、玉銘）；詞條頁勾玉改顯示新勾玉合計
 * 舊版    : r3.97.0  (2026-11-26)
 * 變更    : r3.97.0 新增。屬性介面（平衡第 5 步，分頁版）。
 *           ・角色 › 狀態：上方分頁「總覽／屬性／輸出與防護／詞條／套裝」。
 *             屬性：基礎（等級、巔峰、武器熟練、神社、職業、修練、稱號）＋綠字裝備加成（裝備基礎、強化、詞條、勾玉、套裝、名物）＝合計。
 *             輸出與防護：攻擊%、常駐增傷、會心期望、防禦減免、受傷減免、全抗、吸血、冷卻，附上限。
 *             詞條：身上裝備的詞條（含強化加成、+15 追加）依種類加總；勾玉另列。
 *             套裝：8 套的件數、2／4 件效果（生效亮色）。
 *           ・夥伴：分頁加「屬性」（基礎＋綠字裝備加成，基礎隨主角成長）。
 *           ・效能：裝備加成用「拿掉裝備重算一次」求得，只在 R.S 換新（裝備／升級變動）後算一次並快取，主角生命不受影響。
 * 依賴    : 08_menu（M.PAGE、M.ui）、07_rpg（recalc、itemStats、AFF、SETS）、105_forge2（強化百分比）、58_forge（GEMS）、49_party／51_party_grow（夥伴頁）。
 * ========================================================================== */
'use strict';
(function () {
  const M = G.MENU, R = G.RPG, C = G.C, ctx = G.ctx, fs = () => G.FS(); if (!M || !R || !M.PAGE) return;
  const U = M.ui, GREEN = '#7fd36b';
  const KEYS = ['hp', 'atk', 'def', 'crit', 'critD', 'spd', 'cdr', 'ls', 'mf', 'gf'];
  const PCT = { crit: 1, critD: 1, spd: 1, cdr: 1, ls: 1, mf: 1, gf: 1 };
  const num = (k, v) => { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? r : r.toFixed(1)) + (PCT[k] ? '%' : ''); };

  /* ---------- 主角：基礎／裝備拆分（R.S 換新才重算） ---------- */
  let SP = null;
  function split() { const S = R.S; if (SP && SP.S === S) return SP;
    const d = R.d(), H = G.H, hp = H.hp, eq = d.eq; let base = {};
    try { d.eq = {}; R.recalc(); base = Object.assign({}, R.S); } catch (x) { console.warn('statui split', x); }
    finally { d.eq = eq; R.recalc(); H.hp = Math.min(H.hpMax, hp); }
    const tot = R.S, gear = {}; for (const k of KEYS) gear[k] = (tot[k] || 0) - (base[k] || 0);
    SP = { S: R.S, base, tot, gear }; return SP; }

  /* ---------- 共用畫法 ---------- */
  const T = (t, x, y, s, c, a, f, w) => G.txt(t, x, y, s, c || C.ink, a || 'left', f || G.FONT, w || 600);
  function row3(x, y, w, k, b, g, t) {   // 名稱｜基礎 +綠字｜合計
    T(R.STATN[k] || k, x, y, 12, C.sub, 'left', G.FONT, 500);
    T(num(k, b), x + w * 0.5, y, 13, C.ink, 'right', G.FONT, 700);
    if (Math.abs(g) >= 0.05) T((g > 0 ? '+' : '') + num(k, g), x + w * 0.54, y, 13, g > 0 ? GREEN : '#e07a6a', 'left', G.FONT, 800);
    T(num(k, t), x + w - 4, y, 14, C.gold, 'right', G.FONT_S, 900); }
  function chips(x, y, w, list, cur, set) { const n = list.length, cw = Math.min(110, (w - 6 * (n - 1)) / n);
    list.forEach((t, i) => U.button(x + i * (cw + 6), y, cw, 28, t, () => set(i), i === cur ? 'main' : '')); }

  /* ---------- 角色頁分頁 ---------- */
  const TABS = ['總覽', '屬性', '輸出與防護', '詞條', '套裝'];
  const page0 = M.PAGE['角色'];
  M.PAGE['角色'] = function (x, y, w, h) { const tab = M.sel.ctab || 0;
    const TB = TABS.concat((M.CTABX || []).map(t => t[0])); chips(x, y, w, TB, tab, i => { M.sel.ctab = i; M.scroll.ctab = 0; });   // r3.102.0：其他模組加分頁（129 共鳴／玉銘）
    const y1 = y + 36, h1 = h - 36;
    if (tab === 0) return page0.call(this, x, y1, w, h1);
    if (tab >= TABS.length) { const X = (M.CTABX || [])[tab - TABS.length]; if (X) return X[1](x, y1, w, h1); M.sel.ctab = 0; return; }
    U.box(x, y1, w, h1); [null, attr, output, affix, sets][tab](x, y1, w, h1); };

  function attr(x, y, w, h) { const P = split(), half = (w - 48) / 2, L = 24 * fs();
    T('基礎＝等級、巔峰、武器熟練、神社、職業、修練、稱號；綠字＝裝備（含強化、詞條、勾玉、套裝、名物）', x + 16, y + 18, 10, C.dim, 'left', G.FONT, 500);
    [0, 1].forEach(c => { const xx = x + 16 + c * (half + 16); T('項目', xx, y + 42, 10, C.dim); T('基礎', xx + half * 0.5, y + 42, 10, C.dim, 'right'); T('裝備', xx + half * 0.54, y + 42, 10, GREEN); T('合計', xx + half - 4, y + 42, 10, C.gold, 'right'); });
    KEYS.forEach((k, i) => { const c = i % 2, r = i >> 1, xx = x + 16 + c * (half + 16), yy = y + 66 + r * L; row3(xx, yy, half, k, P.base[k] || 0, P.gear[k], P.tot[k] || 0); });
    const yy = y + 66 + 5 * L + 6; ctx.fillStyle = 'rgba(227,194,122,.18)'; ctx.fillRect(x + 16, yy, w - 32, 1);
    T('攻擊% 合計 +' + Math.round(P.tot._atkP || 0) + '%（修練、職業、武器熟練、神社、稱號、名物，同區相加）', x + 16, yy + 18, 11, C.sub, 'left', G.FONT, 500); }

  function output(x, y, w, h) { const S = R.S, A = (G.GROW && G.GROW.A) || {}, df = S.def || 0, K = G.DEFK ? G.DEFK() : 60, red = df / (df + K) * 100;
    const di = G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1, lsCap = di >= 4 ? 2.5 : 4, ex = (S.crit / 100) * (S.critD / 100 - 1);
    const L = [['輸出', [
        ['攻擊', Math.round(S.atk), '攻擊% +' + Math.round(S._atkP || 0) + '%'],
        ['常駐增傷', '+' + Math.round(A.dmgP || 0) + '%', '增傷區上限 +300%（狀態、名物、破綻追擊等同區相加）'],
        ['會心', S.crit + '%／' + S.critD + '%', '會心率上限 75%；期望傷害 ×' + (1 + Math.max(0, ex)).toFixed(2)],
        ['冷卻縮減', S.cdr + '%', '上限 40%'],
        ['易傷／破甲', '—', '上限 +60%（技能易傷、標記、頭目破綻）']]],
      ['防護', [
        ['防禦', Math.round(df), '對同級敵人減傷 ' + red.toFixed(1) + '%（防禦常數 ' + Math.round(K) + '）'],
        ['受傷減免', (S.dr || 0) + '%', '上限 50%'],
        ['全抗', (S.res || 0) + '%', '異常狀態抗性'],
        ['生命', Math.round(S.hp), '最大生命'],
        ['吸血', S.ls + '%', '詞條上限 15%；每秒回復上限 ' + lsCap + '% 生命，打頭目減半']]]];
    const off = U.scrollArea('ctab', x, y + 6, w, h - 12, 12 * 21 * fs() + 80); U.clip(x, y + 6, w, h - 12);
    let yy = y + 22 + off; const c1 = x + 16, c2 = x + 16 + Math.min(130, w * 0.22), c3 = c2 + Math.min(140, w * 0.22);
    for (const [t, rows] of L) { T(t, c1, yy, 14, C.gold, 'left', G.FONT_S, 900); yy += 24 * fs();
      for (const [k, v, n] of rows) { T(k, c1, yy, 12, C.sub, 'left', G.FONT, 500); T(String(v), c2, yy, 13, C.ink, 'left', G.FONT_S, 900); T(n, c3, yy, 10, C.dim, 'left', G.FONT, 500); yy += 21 * fs(); }
      yy += 6; }
    ctx.restore(); }

  function affix(x, y, w, h) { const d = R.d(), F2 = G.FORGE2, F = G.FORGE, sum = {}, gem = {};
    for (const s of R.SLOT) { const it = d.eq[s]; if (!it) continue; const p = F2 && F2.pct ? F2.pct(it.en || 0) : 1;
      for (const [k, v] of (it.aff || []).concat(it.affX ? [it.affX] : [])) { const o = sum[k] || (sum[k] = { v: 0, n: 0 }); o.v += v * p; o.n++; }
      if (!G.MAGA) for (const g of it.sock || []) if (g && F && F.GEMS) { const [ty, t] = String(g).split(':'); const G0 = F.GEMS[ty]; if (!G0) continue; const o = gem[ty] || (gem[ty] = { v: 0, n: 0, nm: G0[0] }); o.v += G0[1] * +t; o.n++; } }
    if (G.MAGA && G.MAGA.sumGem) Object.assign(gem, G.MAGA.sumGem());   // r3.102.0：勾玉合計（含共鳴、秘法、玉銘）
    const ks = Object.keys(sum).sort((a, b) => sum[b].v - sum[a].v), RH = 22 * fs(), tot = (ks.length + Object.keys(gem).length + 4) * RH;
    const off = U.scrollArea('ctab', x, y + 6, w, h - 12, tot); U.clip(x, y + 6, w, h - 12); let yy = y + 22 + off;
    T('詞條彙整（身上 ' + R.SLOT.filter(s => d.eq[s]).length + ' 件，含強化加成與 +15 追加詞條）', x + 16, yy, 13, C.gold, 'left', G.FONT_S, 900); yy += RH;
    if (!ks.length) { T('目前沒有詞條（良品以上的裝備才有）', x + 16, yy, 11, C.dim); yy += RH; }
    for (const k of ks) { T((R.STATN[k] || k), x + 16, yy, 12, C.sub, 'left', G.FONT, 500); T('+' + num(k, sum[k].v), x + 16 + Math.min(200, w * 0.4), yy, 13, GREEN, 'right', G.FONT_S, 900); T(sum[k].n + ' 條', x + 26 + Math.min(200, w * 0.4), yy, 10, C.dim); yy += RH; }
    const gk = Object.keys(gem); yy += 6; T('勾玉', x + 16, yy, 13, C.gold, 'left', G.FONT_S, 900); yy += RH;
    if (!gk.length) { T('沒有鑲嵌勾玉', x + 16, yy, 11, C.dim); yy += RH; }
    for (const k of gk) { T(gem[k].nm || k, x + 16, yy, 12, C.sub, 'left', G.FONT, 500); T('+' + Math.round(gem[k].v * 10) / 10, x + 16 + Math.min(200, w * 0.4), yy, 13, GREEN, 'right', G.FONT_S, 900); if (gem[k].n !== '') T(gem[k].n + ' 顆', x + 26 + Math.min(200, w * 0.4), yy, 10, C.dim); yy += RH; }
    ctx.restore(); }

  function sets(x, y, w, h) { const S = R.S, cnt = S.setCount || {}, ks = Object.keys(R.SETS).sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0)), RH = 44 * fs();
    const off = U.scrollArea('ctab', x, y + 6, w, h - 12, ks.length * RH + 30); U.clip(x, y + 6, w, h - 12); let yy = y + 22 + off;
    T('套裝（稀品以上可能帶套裝；件數算身上裝備）', x + 16, yy, 13, C.gold, 'left', G.FONT_S, 900); yy += 18;
    for (const k of ks) { const s = R.SETS[k], n = cnt[k] || 0, on2 = n >= 2, on4 = n >= 4;
      ctx.fillStyle = n ? 'rgba(120,80,30,.25)' : 'rgba(255,255,255,.03)'; G.rr(x + 10, yy, w - 20, RH - 6, 6); ctx.fill();
      T(s.n + '　' + n + '／6', x + 20, yy + RH * 0.3, 13, n ? C.ink : C.dim, 'left', G.FONT_S, 900); T(s.region || '', x + w - 20, yy + RH * 0.3, 10, C.dim, 'right');
      T('2 件：' + s.d2, x + 20, yy + RH * 0.64, 11, on2 ? GREEN : C.dim, 'left', G.FONT, on2 ? 700 : 500);
      T('4 件：' + s.d4, x + 20 + (w - 40) / 2, yy + RH * 0.64, 11, on4 ? GREEN : C.dim, 'left', G.FONT, on4 ? 700 : 500); yy += RH; }
    ctx.restore(); }

  /* ---------- 夥伴：屬性分頁（51_party_grow 呼叫） ---------- */
  const PY = G.PARTY;
  if (PY) PY.attrTab = function (id, x, y, w, h) { const s = PY.stats(id), c = PY.data(id) || {}, g = {};
    for (const k in c.eq || {}) { const it = c.eq[k]; if (!it) continue; const st = R.itemStats(it); for (const a of ['hp', 'atk', 'def', 'crit', 'critD']) g[a] = (g[a] || 0) + (st[a] || 0); }
    const half = (w - 44) / 2, L = 24 * fs(), ks = ['hp', 'atk', 'def', 'crit', 'critD'];
    /* r3.203.0：屬性頁改成表格——每列一項：本身／裝備加成／合計，上面有欄位名稱（原本只有一行說明文字，數字沒有欄名） */
    const RHh = Math.min(30 * fs(), (h - 70) / 6), x0 = x + 14, wAll = w - 28, cA = x0 + wAll * 0.46, cB = x0 + wAll * 0.70, cC = x0 + wAll - 10;
    T('項目', x0 + 10, y + 12, 10, C.sub, 'left', G.FONT, 600); T('本身', cA, y + 12, 10, C.sub, 'right', G.FONT, 600); T('裝備加成', cB, y + 12, 10, C.sub, 'right', G.FONT, 600); T('合計', cC, y + 12, 10, C.sub, 'right', G.FONT, 600);
    ks.forEach((k, i) => { const yy = y + 24 + i * RHh, t = s[k] || 0, gg = Math.min(g[k] || 0, t); G.ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)'; G.rr(x0, yy, wAll, RHh - 3, 5); G.ctx.fill(); const my = yy + (RHh - 3) / 2 + 1;
      T(R.STATN[k] || k, x0 + 10, my, 12, C.ink, 'left', G.FONT, 600); T(num(k, t - gg), cA, my, 13, C.ink, 'right', G.FONT, 700); T(Math.abs(gg) >= 0.05 ? '+' + num(k, gg) : '—', cB, my, 13, Math.abs(gg) >= 0.05 ? GREEN : C.dim, 'right', G.FONT, 800); T(num(k, t), cC, my, 14, C.gold, 'right', G.FONT_S, 900); });
    const yy = y + 24 + ks.length * RHh + 12; const red = (s.def || 0) / ((s.def || 0) + 60) * 100; T('受到的傷害減少 ' + red.toFixed(1) + '%（來自防禦）', x0 + 10, yy, 11, C.sub, 'left', G.FONT, 500);
    T('本身的數值會隨夥伴等級與主角成長提高', x0 + 10, yy + 18, 10, C.dim, 'left', G.FONT, 500); };
})();
