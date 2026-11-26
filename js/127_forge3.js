/* ==========================================================================
 * 神諭之地 重製版 — 127_forge3.js
 * Version : r3.101.0  (2026-11-26)
 * 變更    : r3.101.0 新增。裝備詞條鍛鍊（平衡第 7 步後半）＋新詞條。
 *           ・新詞條（會出現在掉落、打造）：減傷（全身合計上限 25%）、招式減傷（頭目招式，上限 30%）、增傷、對頭目、對精英（各上限 40%）。
 *           ・鍛冶舖新分頁「鍛鍊」：
 *             淬鍊：單條詞條 0～5 級，每級該詞條 +10%；升到 3 級以上會失敗，Lv3 以上失敗掉 1 級。費用：錢＋精煉石。
 *             重鑄：單條詞條換成另一種（數值重抽、淬鍊歸零）。費用：妖玉 2。
 *             洗鍊：整件的詞條數值重抽（種類、淬鍊等級不變）。費用：錢＋精煉石 2。
 *             覺醒：稀品以上，每件一次，多一條詞條。費用：錢＋妖玉 5。
 *             （移轉、銘刻、鎖定仍在「強化」頁。）
 *           ・強化不再加詞條（105_forge2）；淬鍊加成在 itemStats 內計算（沿用原本呼叫時機，不每格重算）。
 * 存檔    : 物品 it.aq（各詞條淬鍊等級）、it.aw（已覺醒）；rpg.fm.stone（精煉石）。
 * 依賴    : 07_rpg（AFF／STATN／itemStats／recalc）、21_shop（xtabs／xpage）、58_forge／105_forge2、16_growth（apply）、03_actors（damageOni／hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, S = G.SHOP, M = G.MENU, C = G.C, ctx = G.ctx, GR = G.GROW; if (!R || !S || !M) return;
  const rd = () => R.d(), dirty = () => G.SAVE.markDirty(), fm = () => rd().fm || (rd().fm = { stone: 0, guard: 0, luck: 0 });
  /* ---------- 新詞條 ---------- */
  const NEW = { gdr: ['減傷', 0.15, '%'], gsdr: ['招式減傷', 0.25, '%'], gdmg: ['增傷', 0.35, '%'], gboss: ['對頭目', 0.45, '%'], gelite: ['對精英', 0.45, '%'] };
  for (const k in NEW) { R.AFF[k] = NEW[k]; R.STATN[k] = NEW[k][0]; }
  const CAP = { gdr: 25, gsdr: 30, gdmg: 40, gboss: 40, gelite: 40 };
  const cap = k => Math.min(CAP[k], (R.S && R.S[k]) || 0);
  /* 淬鍊加成：在 itemStats 加上（詞條值 × 10% × 等級） */
  const is0 = R.itemStats; R.itemStats = function (it) { const o = is0.apply(this, arguments); if (!it || !it.aq) return o;
    (it.aff || []).forEach(([k, v], i) => { const L = it.aq[i] || 0; if (L) o[k] = Math.round(((o[k] || 0) + v * 0.1 * L) * 10) / 10; }); return o; };
  /* 屬性：減傷併入 S.dr（全身上限 25%，總上限 50%） */
  const ap0 = GR.apply.bind(GR); GR.apply = function (s) { const r = ap0(s); s.dr = Math.min(50, (s.dr || 0) + Math.min(CAP.gdr, s.gdr || 0)); return r; };
  /* 傷害：增傷／對頭目／對精英（增傷區） */
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (e && e.st !== 'dead' && !(opt && opt.party) && R.S) {
      G.DZ.add(cap('gdmg') / 100); if (e.boss || e.bb) G.DZ.add(cap('gboss') / 100); if (e.elite) G.DZ.add(cap('gelite') / 100); }
    return dm0.apply(this, arguments); };
  /* 受傷：頭目招式減傷 */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { const B = G.BOSS, v = cap('gsdr');
    if (v && B && B.enc && !B.enc.done && B.enc.units.some(u => Math.abs(u.x - srcX) < 0.01)) atk *= 1 - v / 100; return hh0.call(this, atk, srcX); };

  /* ---------- 鍛鍊動作 ---------- */
  const affRoll = (k, lv) => Math.round(R.AFF[k][1] * (0.6 + Math.random() * 0.6) * (1 + lv * 0.18) * 10) / 10;
  const QRATE = [1, 1, 0.9, 0.7, 0.5, 0.35];   // 升到 L 的成功率
  const F3 = G.FORGE3 = { sel: null, ai: 0,
    tCost(it, i) { const L = ((it.aq || [])[i] || 0) + 1; return { g: Math.round(150 * L * (1 + it.lv / 10)), st: L }; },
    temper(it, i) { it.aq = it.aq || []; const L = it.aq[i] || 0; if (L >= 5) return G.UI.toast('已淬鍊到最高 5 級'); const c = F3.tCost(it, i), d = rd(), f = fm();
      if (d.gold < c.g) return G.UI.toast('錢不夠（需要 ' + c.g + '）'); if ((f.stone || 0) < c.st) return G.UI.toast('精煉石不夠（需要 ' + c.st + '，分解裝備或在鍛冶舖購買）');
      d.gold -= c.g; f.stone -= c.st; const ok = Math.random() < QRATE[L + 1];
      if (ok) { it.aq[i] = L + 1; G.UI.toast('淬鍊成功　' + R.AFF[it.aff[i][0]][0] + ' Lv' + (L + 1)); }
      else if (L >= 3) { it.aq[i] = L - 1; G.UI.toast('淬鍊失敗，掉到 Lv' + (L - 1)); } else G.UI.toast('淬鍊失敗'); R.recalc(); dirty(); },
    recast(it, i) { const d = rd(); if ((d.yg || 0) < 2) return G.UI.toast('妖玉不夠（需要 2）'); const have = it.aff.map(a => a[0]), ks = Object.keys(R.AFF).filter(k => !have.includes(k));
      if (!ks.length) return; d.yg -= 2; const k = ks[Math.floor(Math.random() * ks.length)]; it.aff[i] = [k, affRoll(k, it.lv)]; it.aq = it.aq || []; it.aq[i] = 0;
      G.UI.toast('重鑄：' + R.AFF[k][0] + ' +' + it.aff[i][1]); R.recalc(); dirty(); },
    wCost: it => ({ g: Math.round(300 * (1 + it.lv / 10)), st: 2 }),
    wash(it) { const c = F3.wCost(it), d = rd(), f = fm(); if (d.gold < c.g) return G.UI.toast('錢不夠（需要 ' + c.g + '）'); if ((f.stone || 0) < c.st) return G.UI.toast('精煉石不夠（需要 2）');
      d.gold -= c.g; f.stone -= c.st; it.aff = it.aff.map(([k]) => [k, affRoll(k, it.lv)]); G.UI.toast('洗鍊完成：詞條數值重抽'); R.recalc(); dirty(); },
    aCost: it => ({ g: Math.round(1000 * (1 + it.lv / 10)), y: 5 }),
    awaken(it) { if (it.aw) return G.UI.toast('這件已經覺醒過了'); if (it.q < 3) return G.UI.toast('稀品以上才能覺醒'); const c = F3.aCost(it), d = rd();
      if (d.gold < c.g || (d.yg || 0) < c.y) return G.UI.toast('需要 錢 ' + c.g + '・妖玉 ' + c.y); const have = it.aff.map(a => a[0]), ks = Object.keys(R.AFF).filter(k => !have.includes(k)); if (!ks.length) return;
      d.gold -= c.g; d.yg -= c.y; const k = ks[Math.floor(Math.random() * ks.length)]; it.aff.push([k, Math.round(affRoll(k, it.lv) * 1.2 * 10) / 10]); it.aw = 1;
      G.UI.banner('覺醒', R.name(it) + '：' + R.AFF[k][0] + ' +' + it.aff[it.aff.length - 1][1]); R.recalc(); dirty(); } };

  /* ---------- 鍛冶舖分頁「鍛鍊」 ---------- */
  const xt0 = S.xtabs; S.xtabs = ty => { const L = xt0 ? xt0(ty).slice() : []; if (ty === 'smith' && !L.includes('鍛鍊')) L.splice(1, 0, '鍛鍊'); return L; };
  const xp0 = S.xpage; S.xpage = function (ty, tab, L, top, lw, h, cx, cw) { if (S.xtabs(ty)[tab - 2] !== '鍛鍊') return xp0.apply(this, arguments); page(L, top, lw, h, cx, cw); };
  const T = (t, x, y, s, c, a, f, w) => G.txt(t, x, y, s, c || C.ink, a || 'left', f || G.FONT, w || 600);
  function items() { const d = rd(), eq = R.SLOT.map(s => d.eq[s]).filter(Boolean); return eq.concat(d.bag).filter(it => it.aff && it.aff.length); }
  function page(L, top, lw, h, cx, cw) { const U = M.ui, d = rd(), list = items(), RH = 40 * G.FS();
    if (!list.includes(F3.sel)) { F3.sel = list[0] || null; F3.ai = 0; }
    U.box(L, top, lw, h); const off = U.scrollArea('forge3', L, top + 4, lw, h - 8, list.length * (RH + 4) + 8); U.clip(L, top + 4, lw, h - 8);
    list.forEach((it, i) => { const y = top + 8 + i * (RH + 4) + off, on = it === F3.sel; if (y > top + h || y + RH < top) return;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(L + 6, y, lw - 12, RH, 6); ctx.fill();
      T(R.name(it), L + 14, y + RH * 0.36, 12, R.QUAL[it.q].c, 'left', G.FONT_S, 900); T((Object.values(d.eq).includes(it) ? '裝備中・' : '') + R.SLOTN[R.TPL[it.t].slot] + '・詞條 ' + it.aff.length + (it.aw ? '・已覺醒' : ''), L + 14, y + RH * 0.74, 10, C.sub);
      U.hit(L + 6, Math.max(y, top + 4), lw - 12, RH, () => { F3.sel = it; F3.ai = 0; }); }); ctx.restore();
    U.box(cx, top, cw, h); const it = F3.sel; if (!it) { T('沒有帶詞條的裝備（良品以上才有）', cx + cw / 2, top + h / 2, 13, C.dim, 'center'); return; }
    T(R.name(it), cx + 14, top + 22, 15, R.QUAL[it.q].c, 'left', G.FONT_S, 900); T('精煉石 ' + (fm().stone || 0) + '・妖玉 ' + (d.yg || 0) + '・錢 ' + d.gold, cx + cw - 14, top + 22, 11, C.sub, 'right');
    const ah = Math.min(34, (h - 140) / Math.max(4, it.aff.length)); let y = top + 44;
    it.aff.forEach(([k, v], i) => { const L2 = (it.aq || [])[i] || 0, on = i === F3.ai, A = R.AFF[k] || [k, 1, ''];
      ctx.fillStyle = on ? 'rgba(120,80,30,.4)' : 'rgba(255,255,255,.04)'; G.rr(cx + 10, y, cw - 20, ah - 4, 6); ctx.fill();
      T(A[0] + ' +' + Math.round(v * (1 + 0.1 * L2) * 10) / 10 + A[2], cx + 20, y + (ah - 4) / 2, 12, C.ink, 'left', G.FONT_S, 800);
      T('淬鍊 ' + '◆'.repeat(L2) + '◇'.repeat(5 - L2), cx + cw - 20, y + (ah - 4) / 2, 11, L2 ? '#f3d98a' : C.dim, 'right', G.FONT, 700);
      U.hit(cx + 10, y, cw - 20, ah - 4, () => { F3.ai = i; }); y += ah; });
    const i = Math.min(F3.ai, it.aff.length - 1), L2 = (it.aq || [])[i] || 0, tc = F3.tCost(it, i), wc = F3.wCost(it), ac = F3.aCost(it), bw = (cw - 34) / 2, by = top + h - 96;
    T('選中：' + (R.AFF[it.aff[i][0]] || [''])[0] + (L2 < 5 ? '　淬鍊 Lv' + (L2 + 1) + ' 成功率 ' + Math.round(QRATE[L2 + 1] * 100) + '%' + (L2 >= 3 ? '（失敗掉 1 級）' : '') : '　已淬鍊到最高'), cx + 14, by - 12, 11, C.sub);
    U.button(cx + 10, by, bw, 38, L2 >= 5 ? '淬鍊已滿' : '淬鍊（錢 ' + tc.g + '・石 ' + tc.st + '）', L2 < 5 ? () => F3.temper(it, i) : null, L2 < 5 ? 'main' : 'off');
    U.button(cx + 24 + bw, by, bw, 38, '重鑄這條（妖玉 2）', () => F3.recast(it, i), (d.yg || 0) >= 2 ? '' : 'off');
    U.button(cx + 10, by + 46, bw, 38, '洗鍊數值（錢 ' + wc.g + '・石 2）', () => F3.wash(it), '');
    U.button(cx + 24 + bw, by + 46, bw, 38, it.aw ? '已覺醒' : it.q < 3 ? '覺醒（稀品以上）' : '覺醒 +1 詞條（妖玉 5）', !it.aw && it.q >= 3 ? () => F3.awaken(it) : null, !it.aw && it.q >= 3 ? 'main' : 'off'); }
})();
