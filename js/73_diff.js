/* ==========================================================================
 * 神諭之地 重製版 — 73_diff.js
 * Version : r3.225.0  (2026-11-28)　r3.225.0：隨機精英 5／15／30／50% → 2／8／15／25%，第 1 章不出
 * 舊版    : r3.222.0  (2026-11-28)　r3.222.0：困難／修羅／無間 敵人血量 1.6／2.5／4 → 1.3／1.8／2.6、防禦 1.2／1.4／1.6 → 1.1／1.2／1.3
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：設定頁難度格加家紋圖示
 * 舊版    : r3.96.0  (2026-11-26)　r3.96.0：難度數值改企劃 9-4（血／攻／防、精英比例、經驗與錢、掉落等級）；修羅頭目 30% 狂暴、無間 50% 第二型態＋狂暴（取代「怒氣爆發回滿」）；本輪最低難度判定通關；無間回復 −15%
 * 舊版    : r3.89.0  (2026-11-25)　r3.89.0：設定頁 5 個難度都會輪到（未開放的顯示「未開放」與條件、不套用）；修羅改為以困難通關開放、無間以修羅通關開放；新增各難度通關旗標 clear_d0～4；測試模式解鎖全開
 * 舊版    : r3.53.0  (2026-11-23)　r3.53.0：困難／修羅／無間加強（配合 03 防禦常數隨等級成長）　r3.33.0：切換難度的提示改成一句說明（不顯示倍率）
 * 舊版    : r3.32.0  (2026-11-17)
 * 變更    : r3.32.0 新增。全遊戲難度（主線／野外／頭目都套用；副本、合戰的難度疊在上面）。
 *           ┌──────┬──────┬──────┬──────┬──────────┬──────────┬──────┬────────────┬──────────────┐
 *           │ 難度 │ 生命 │ 攻擊 │ 防禦 │ 敵人動作 │ 精英     │ 經驗 │ 稀品以上   │ 頭目         │
 *           │ 輕鬆 │ ×0.7 │ ×0.6 │ ×0.7 │ 慢 30%   │ 少（半數變一般） │ ×1 │ —     │ —            │
 *           │ 普通 │ ×1   │ ×1   │ ×1   │ 照舊     │ 照舊     │ ×1   │ —          │ —            │
 *           │ 困難 │ ×1.4 │ ×1.3 │ ×1.3 │ 快 15%   │ 8% 變精英│ ×1.3 │ +10%       │ —            │
 *           │ 修羅 │ ×3   │ ×2   │ ×2   │ 快 25%   │ 15% 變精英│ ×1.6 │ +15%      │ 血量首次 <25% 回滿一次 │
 *           │ 無間 │ ×8   │ ×4   │ ×4   │ 快 35%   │ 全部精英 │ ×2   │ +20%       │ 回滿一次＋無間招式 │
 *           └──────┴──────┴──────┴──────┴──────────┴──────────┴──────┴────────────┴──────────────┘
 *           ・修羅：以困難通關後開放；無間：以修羅通關後開放（r3.89.0）。設定頁切換，頭目戰中不能切。
 *           ・敵人動作快慢＝每隻敵人（含頭目）每幀的行動次數累加（0.7／1.15／1.25／1.35），移動與出招一起變。
 *           ・HUD 左上顯示「敵 Lv・難度」，副本另有難度時顯示「＋副本難度」。
 * 存檔    : save.gdiff（0～4，預設 1＝普通）、flags.clear_shura（修羅通關）、flags.clear_d0～clear_d4（各難度通關，r3.89.0）。
 * 依賴    : 03_actors（spawnOni、oniStep）、26_boss（start、單位）、07_rpg（roll、onKill、QUAL）、16_growth（設定頁 G.SET_EXTRA）、04_ui（HUD）、70_ending。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, F = () => G.SAVE.data.flags;
  const DF = G.GDIFF = [
    /* r3.96.0：依企劃 v2.6 9-4。gold＝錢倍率、dlv＝掉落等級加成、rage＝頭目 30% 狂暴、form2＝頭目 50% 第二型態、healK＝回復倍率 */
    { n: '輕鬆', c: '#8fd38f', hp: 0.7, atk: 0.6, def: 0.8, sp: 0.7, el: -1, exp: 0.8, gold: 0.8, dlv: -3, rare: 0, rage: 0, form2: 0, healK: 1, inf: 0, t: '敵人較弱、沒有精英，適合專心看劇情' },
    { n: '普通', c: '#e8e0cc', hp: 1, atk: 1, def: 1, sp: 1, el: 0.02, exp: 1, gold: 1, dlv: 0, rare: 0, rage: 0, form2: 0, healK: 1, inf: 0, t: '標準的冒險' },
    { n: '困難', c: '#6fb0f0', hp: 1.3, atk: 1.3, def: 1.1, sp: 1.15, el: 0.08, exp: 1.4, gold: 1.4, dlv: 5, rare: 0.10, rage: 0, form2: 0, healK: 1, inf: 0, t: '敵人更強更快，經驗、錢與裝備等級都提高' },
    { n: '修羅', c: '#f0624f', hp: 1.8, atk: 1.7, def: 1.2, sp: 1.25, el: 0.15, exp: 2, gold: 2, dlv: 12, rare: 0.15, rage: 1, form2: 0, healK: 1, inf: 0, t: '頭目 30% 血量狂暴、久未受擊會回血' },
    { n: '無間', c: '#c095f0', hp: 2.6, atk: 2.2, def: 1.3, sp: 1.35, el: 0.25, exp: 3, gold: 3, dlv: 20, rare: 0.20, rage: 1, form2: 1, healK: 0.85, inf: 1, t: '頭目第二型態＋狂暴、回復 −15%' }];
  const gi = () => { const v = G.SAVE.data.gdiff; return v === undefined ? 1 : v; }, cur = () => DF[gi()];
  /* r3.89.0：各難度通關旗標 clear_d0～clear_d4（通關某難度＝該難度與以下都算通關）；修羅＝以困難通關、無間＝以修羅通關。
     舊存檔：gameClear 視為普通通關；clear_shura 視為修羅通關；已經選在修羅以上的存檔保持可選。測試模式（解鎖）全部開放。 */
  const cleared = i => !!F()['clear_d' + i] || (i <= 1 && !!F().gameClear) || (i <= 3 && !!F().clear_shura);
  const open = i => i <= 2 || (G.CHEAT && G.CHEAT.on.unlock) || gi() >= i || cleared(i - 1);
  const NEED = ['', '', '', '以困難難度通關後開放', '以修羅難度通關後開放'];
  G.GDIFF.cur = cur; G.GDIFF.i = gi;
  function elite(e) { if (e.elite || e.bb || e.boss) return; e.elite = '精英'; e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio = (e.ratio || 1) * 1.15; }
  function scale(e, d) { if (!e || e._gd) return; e._gd = 1; e.hp = e.hpMax = Math.max(1, Math.round(e.hpMax * d.hp)); e.atk = Math.max(1, Math.round(e.atk * d.atk)); e.def = (e.def || 0) * d.def; }
  /* ---------- 一般敵人 ---------- */
  const sp0 = G.spawnOni; G.spawnOni = function () { const e = sp0.apply(this, arguments); if (!e || e.train) return e; const d = cur();
    G.STORY.later(1, () => { if (e._gd) return; if (d.el >= 1) elite(e); else if (d.el > 0 && ((G.SC.def && G.SC.def.lv) || 1) >= 10 && Math.random() < d.el) elite(e);   /* r3.225.0：隨機精英機率減半以上；第 1 章（地圖 Lv10 以下）不出隨機精英 */ else if (d.el < 0 && e.elite && !e.boss && Math.random() < -d.el) { e.hp = e.hpMax = Math.round(e.hpMax / 3); e.atk = Math.round(e.atk / 1.3); e.elite = null; } scale(e, d); });   // 等其他模組把精英設定好再套
    return e; };
  /* ---------- 頭目 ---------- */
  const B = G.BOSS;
  if (B && B.start) { const bs0 = B.start; B.start = function (id, o) { const d = cur(); o = Object.assign({}, o || {}); if (d.inf) o.diff = Math.max(o.diff || 0, 3);
      const enc = bs0.call(this, id, o); if (enc && enc.units) for (const u of enc.units) scale(u, d); return enc; }; }
  /* ---------- 動作快慢、頭目回滿 ---------- */
  /* r3.96.0：修羅／無間頭目 30% 狂暴（攻擊 ×1.25、動作 +15%、出招間隔 ×0.7）；無間頭目 50% 第二型態（出招間隔 ×0.85，並已使出全部招式）。
     前搖不受影響（123_btempo 以 G.BT.sp(e) 補償）。 */
  const isB = e => e.bb || e.boss;
  function phase(e, d) { if (!isB(e) || e.st === 'dead' || !(e.hp > 0) || e.doll) return; const nm = e.name || '頭目';
    if (d.form2 && !e._f2 && e.hp < e.hpMax * 0.5) { e._f2 = 1; if (e.enc) e.enc._f2 = 1; G.UI.banner(nm + '　第二型態', '出招更頻繁'); G.SC.shake = 7; }
    if (d.rage && !e._rage && e.hp < e.hpMax * 0.3) { e._rage = 1; e.atk = Math.round(e.atk * 1.25); if (e.enc) e.enc._rage = 1; G.UI.banner(nm + '　狂暴', '攻擊提高、動作加快'); G.SC.shake = 8; }
    const enc = e.enc; if (enc && enc.tk !== undefined) { if (enc.ck0 === undefined) enc.ck0 = enc.ck; enc.ck = enc.ck0 * (enc._rage ? 0.7 : 1) * (enc._f2 ? 0.85 : 1); } }
  G.GDIFF.spOf = e => cur().sp * (e && e._rage ? 1.15 : 1);
  const st0 = G.oniStep; G.oniStep = function (e) { const d = cur(); if (d.rage) phase(e, d); const sp = G.GDIFF.spOf(e); if (sp === 1) return st0(e);
    e._sp = (e._sp || 0) + sp; let n = 0; while (e._sp >= 1 && n < 2) { e._sp -= 1; n++; st0(e); } };
  /* ---------- 經驗、稀品以上掉率 ---------- */
  const k0 = R.onKill.bind(R); R.onKill = function (e) { const n0 = G.LOOT.length; k0(e); const d = cur();
    if (e && d.exp !== 1) R.gainExp(Math.round((10 + (e.lv || 1) * 6) * (d.exp - 1)));
    if (d.gold !== 1) for (let i = n0; i < G.LOOT.length; i++) { const L = G.LOOT[i]; if (L && L.kind === 'gold') L.v = Math.max(1, Math.round(L.v * d.gold)); } };   // r3.96.0：錢倍率
  const rl0 = R.roll.bind(R); R.roll = function (lv, region) { const d = cur(); lv = Math.max(1, (lv || 1) + (d.dlv || 0));   // r3.96.0：掉落等級加成
    if (!d.rare) return rl0(lv, region); const Q = R.QUAL, w0 = Q.map(q => q.w);
    for (let i = 3; i < Q.length; i++) Q[i].w = w0[i] * (1 + d.rare); try { return rl0(lv, region); } finally { Q.forEach((q, i) => { q.w = w0[i]; }); } };
  /* ---------- 通關記錄：修羅通關開放無間 ---------- */
  /* r3.96.0：本輪最低難度（flags.runMin）：本輪曾經切到的最低難度；通關以它為準 */
  const runMin = () => { const f = F(); if (f.runMin === undefined) f.runMin = gi(); return f.runMin; };
  const end0 = () => { const i = Math.min(gi(), runMin()); for (let k = 0; k <= i; k++) F()['clear_d' + k] = 1; if (i >= 3) F().clear_shura = 1; G.SAVE.markDirty(); };
  (function wait() { if (G.MAIN && G.MAIN.end) { const e0 = G.MAIN.end; G.MAIN.end = function () { end0(); return e0.apply(this, arguments); }; } else setTimeout(wait, 20); })();   // 結局開始時記錄
  /* ---------- 設定頁 ---------- */
  /* r3.89.0：5 個難度輪流顯示（含未開放）；未開放的只顯示條件、不套用，再按一次往下一個 */
  let vi = -1, viT = 0;
  G.SET_EXTRA = (G.SET_EXTRA || []).concat([() => { if (vi >= 0 && G.t - viT > 240) vi = -1; const v = vi >= 0 ? vi : gi(), lk = !open(v);   // 停在未開放的選項 4 秒後自動回到目前難度
    const rm = runMin(); return ['難度', DF[v].n + (lk ? '（未開放）' : rm < v ? '（本輪最低：' + DF[rm].n + '）' : ''), () => { if (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) { G.UI.toast('頭目戰中不能切換難度'); return; }
      const i = ((vi >= 0 ? vi : gi()) + 1) % 5, d = DF[i]; vi = i; viT = G.t;
      if (!open(i)) { G.UI.toast(d.n + '：' + NEED[i]); return; }
      vi = -1; const rm = runMin(); G.SAVE.data.gdiff = i; if (i < rm) F().runMin = i; G.SAVE.markDirty();
      G.UI.toast('難度：' + d.n + '　' + d.t + (i < rm ? '（本輪通關會以「' + d.n + '」計算）' : '')); }, 'ico_diff_' + ['easy', 'normal', 'hard', 'shura', 'mugen'][v]]; }]);
  /* r3.96.0：無間回復 −15%（藥水；吸血上限在 122_bal） */
  (function hq() { const S = G.SHOP; if (!S || !S.quick) return setTimeout(hq, 50); const q0 = S.quick; S.quick = function () { const h0 = G.H.hp, r = q0.apply(this, arguments), k = cur().healK || 1;
      if (k < 1 && G.H.hp > h0) G.H.hp = Math.round(h0 + (G.H.hp - h0) * k); return r; }; })();
  G.GDIFF.runMin = runMin;
  G.GDIFF.open = open; G.GDIFF.cleared = cleared;
})();
