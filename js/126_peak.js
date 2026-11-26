/* ==========================================================================
 * 神諭之地 重製版 — 126_peak.js
 * Version : r3.104.0  (2026-11-26)　r3.104.0：抗魔／破陣／斬妖 10 級極效果生效（131_foes）
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：天命頁加圖示（巔峰、8 種天命）
 * 舊版    : r3.102.0  (2026-11-26)　r3.102.0：天命「共鳴專精」改為生效（129_magatama）
 * 舊版    : r3.101.0  (2026-11-26)　r3.101.0：天命加強：每級效果約翻倍；尋寶改掉落品質；疾風改全技能冷卻 −3%／級＋連續發動（技／奧義／秘傳，第一次結束後自動再放一次）
 * 舊版    : r3.99.0  (2026-11-26)
 * 變更    : r3.99.0 新增。巔峰點數（平衡第 6 步）。
 *           ・取得：巔峰每升 1 級＋1 點（07_rpg），舊存檔補發＝目前巔峰等級。
 *           ・用途：
 *             武器技能 6～10 級：費用 3／4／5／6／8 點；每級傷害 +10%（以 Lv5 倍率為底）；Lv10 極：範圍 +20%、多 1 段（15_skill）、冷卻 −15%。
 *             修練 6～10 級：每級 2 點；6～9 級效果為 1～5 級的一半，Lv10 極：效果翻倍（＝Lv5 的 2 倍）。
 *             天命 8 項（角色 › 天命）：每級 3 點、最多 10 級；10 級有極效果（部分等勾玉、精英詞綴系統上線後生效）。
 *           ・洗點：神社找小雪「巔峰點數重置」，退回全部巔峰點數；每週第一次免費，之後 錢 300 × 巔峰等級。
 * 存檔    : rpg.pp（未用點數）、rpg.fate{ id: lv }、rpg.ppWeek（本週已免費重置的週次）。
 * 依賴    : 13_weapons（W.lv／learn／mult／cd）、16_growth（GR.apply／tLearn／tReset）、15_skill、58_forge（shrineCh、同伴強化）、21_shop、49_party、122_bal（heroDown）、26_boss（onEnd）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, W = G.WPN, GR = G.GROW, M = G.MENU, C = G.C, ctx = G.ctx, fs = () => G.FS(); if (!R || !W || !GR) return;
  const d = () => R.d(), dirty = () => G.SAVE.markDirty(), free = () => G.CHEAT && G.CHEAT.on.free;
  const pp = () => d().pp || 0, fate = () => d().fate || (d().fate = {}), fl = id => fate()[id] || 0;
  function migrate() { const r = d(); if (!r) return; if (r.pp === undefined) { r.pp = r.pk || 0; dirty(); } }
  const SKC = [0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 8];
  W.ppCost = lv => SKC[lv] || 0;

  /* ---------- 武器技能 6～10 ---------- */
  const can0 = W.canLearn.bind(W), learn0 = W.learn.bind(W), mult0 = W.mult.bind(W), cd0 = W.cd.bind(W);
  W.canLearn = function (s) { const lv = W.lv(s.id); if (lv < 5) return can0(s); return W.unlocked(s) && lv < 10 && (pp() >= W.ppCost(lv + 1) || free()); };
  W.learn = function (s) { const lv = W.lv(s.id); if (lv < 5) return learn0(s); if (!W.canLearn(s)) { if (lv < 10) G.UI.toast('巔峰點數不足（需要 ' + W.ppCost(lv + 1) + '）'); return false; }
    const r = d(); if (!free()) r.pp -= W.ppCost(lv + 1); r.wsk[W.key(s.id)] = lv + 1; dirty(); return true; };
  W.mult = function (s, lv) { lv = lv || 1; return lv <= 5 ? mult0(s, lv) : mult0(s, 5) * (1 + 0.1 * (Math.min(10, lv) - 5)); };
  W.cd = function (s) { const v = cd0(s); return s && W.lv(s.id) >= 10 ? v * 0.85 : v; };

  /* ---------- 修練 6～10 ---------- */
  GR.tMax = () => ((d().pk || 0) > 0 || Object.values(d().train || {}).some(v => v > 5) ? 10 : 5);
  GR.tEff = lv => lv <= 5 ? lv : lv >= 10 ? 10 : 5 + 0.5 * (lv - 5);
  const tl0 = GR.tLearn.bind(GR);
  GR.tLearn = function (id) { const lv = GR.tLv(id); if (lv < 5) return tl0(id); if (lv >= 10) return; if (GR.tMax() < 10) { G.UI.toast('達到巔峰等級後可用巔峰點數繼續升級'); return; }
    const r = d(); if (pp() < 2 && !free()) { G.UI.toast('巔峰點數不足（需要 2）'); return; } if (!free()) r.pp -= 2; r.train[id] = lv + 1; R.recalc(); dirty();
    if (lv + 1 === 10) G.UI.toast(GR.TB[id].n + ' Lv10 極：效果翻倍'); };
  const tr0 = GR.tReset.bind(GR);
  GR.tReset = function () { const r = d(); let back = 0; for (const k in r.train) if (r.train[k] > 5) { back += 2 * (r.train[k] - 5); r.train[k] = 5; }
    if (back) { r.pp = pp() + back; G.UI.toast('巔峰點數退回 ' + back); } return tr0(); };

  /* ---------- 天命 ---------- */
  /* [id, 名稱, 每級說明, 極說明, 極是否已生效] */
  const FATE = [
    ['antimagic', '抗魔', '全抗 +4%、受到的傷害 −1%', '同屬性妖怪的抗性降低（屬性傷害 ×0.5 → ×0.6）', 1],
    ['resonance', '共鳴專精', '選定一種勾玉（勾玉 › 共鳴），共鳴效果 +3%', '該種共鳴計數 +1', 1],
    ['command', '統御', '夥伴傷害 +6%、夥伴生命 +6%', '夥伴大招冷卻 −15%（之後生效）', 0],
    ['treasure', '尋寶', '掉落品質提升（精品以上機率 +12%）', '擊敗頭目額外掉 1 件裝備', 1],
    ['tenacity', '不撓', '藥水回復 +6%、最大生命 +2%', '復甦每場戰鬥站起次數 +1', 1],
    ['breaker', '破陣', '對精英傷害 +6%', '精英詞綴效果 −30%', 1],
    ['slayer', '斬妖', '對頭目傷害 +5%', '頭目韌性傷害 +20%', 1],
    ['gale', '疾風', '全技能冷卻 −3%、3% 機率連續發動（技／奧義／秘傳）', '連發機率再 +10%（共 40%）', 1]];
  const FB = {}; FATE.forEach(f => FB[f[0]] = f);
  const ap0 = GR.apply.bind(GR);
  GR.apply = function (s) { const r = ap0(s), A = GR.A || (GR.A = {});
    s.res = (s.res || 0) + 4 * fl('antimagic'); s.dr = Math.min(50, (s.dr || 0) + fl('antimagic')); s.hp *= 1 + 0.02 * fl('tenacity');
    A.allyDmg = (A.allyDmg || 0) + 6 * fl('command'); return r; };
  /* 尋寶：掉落品質（精品以上權重 ×(1＋12%×等級)） */
  const rl0 = R.roll.bind(R); R.roll = function () { const L = fl('treasure'); if (!L) return rl0.apply(this, arguments); const Q = R.QUAL, w0 = Q.map(q => q.w);
    for (let i = 2; i < Q.length; i++) Q[i].w = w0[i] * (1 + 0.12 * L); try { return rl0.apply(this, arguments); } finally { Q.forEach((q, i) => { q.w = w0[i]; }); } };
  /* 疾風：全技能冷卻（技、招式） */
  const cdG = W.cd; W.cd = function (s) { return cdG.call(W, s) * (1 - 0.03 * fl('gale')); };
  if (GR.mvCdMul) { const mc0 = GR.mvCdMul.bind(GR); GR.mvCdMul = function () { return mc0() * (1 - 0.03 * fl('gale')); }; }
  /* 疾風：連續發動——第一次出招結束後，同一招（技／奧義／秘傳）再自動放一次，不耗冷卻與氣 */
  let prevA = null, rep = null, repNext = false;
  const hsG = G.heroStep; G.heroStep = function () { const r = hsG.apply(this, arguments), H = G.H, a = H.act, L = fl('gale');
    if (a && a !== prevA) { if (repNext) { a._rep = 1; repNext = false; }
      else if (L && !a._rep && !rep) { const ch = 0.03 * L + (L >= 10 ? 0.1 : 0); let c = null;
        if (a.mvx && a.mvx.hiden && a.mvx.def && a.mvx.def.id) c = { t: 'hd', id: a.mvx.def.id, n: a.mvx.def.n };
        else if (a.sk && (a.kind === 'skill' || a.kind === 'ult')) c = { t: 'sk', s: a.sk };
        if (c && Math.random() < ch) rep = c; } }
    prevA = a;
    if (rep && !H.act && !G.DLG.active()) { const c = rep; rep = null; repNext = true;
      if (c.t === 'hd' && G.MV2 && G.MV2.play) { G.MV2.play(c.id); G.UI.banner('疾風・連發', '秘傳・' + (c.n || '')); }
      else if (c.t === 'sk') { const s = c.s, sl = W.slots(), key = s.t === '奧義' ? 'ult' : sl.A === s.id ? 'skA' : sl.B === s.id ? 'skB' : null;
        if (key) { H.cd[s.id] = 0; if (key === 'ult') R.d().qi = 100; G.IN[key] = true; G.UI.toast('疾風・連發：' + s.n); } else repNext = false; } }
    return r; };
  if (G.PARTY && G.PARTY.stats) { const ps0 = G.PARTY.stats; G.PARTY.stats = function (id) { const s = ps0.apply(this, arguments), L = fl('command'); if (!L || !s) return s; return Object.assign({}, s, { hp: s.hp * (1 + 0.06 * L) }); }; }
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (e && e.st !== 'dead' && !(opt && opt.party)) {
      if (e.elite && fl('breaker')) G.DZ.add(0.06 * fl('breaker')); if ((e.boss || e.bb) && fl('slayer')) G.DZ.add(0.05 * fl('slayer')); }
    return dm0.apply(this, arguments); };
  (function hq() { const S = G.SHOP; if (!S || !S.quick) return setTimeout(hq, 50); const q0 = S.quick; S.quick = function () { const h0 = G.H.hp, r = q0.apply(this, arguments), L = fl('tenacity');
      if (L && G.H.hp > h0) G.H.hp = Math.min(G.H.hpMax, Math.round(h0 + (G.H.hp - h0) * (1 + 0.06 * L))); return r; }; })();
  /* 不撓 10：每場第 2 次站起 */
  (function hd() { if (!G.heroDown || !G.BAL) return setTimeout(hd, 50); const h0 = G.heroDown; G.heroDown = function () { const B = G.BAL;
      if (!B.revUsed) B._r2 = 0; else if (fl('tenacity') >= 10 && !B._r2 && (GR.tLv('revive') || 0) > 0) { B._r2 = 1; B.revUsed = false; } return h0.apply(this, arguments); }; })();
  /* 尋寶 10：頭目額外掉裝備 */
  if (G.BOSS) { const oe0 = G.BOSS.onEnd; G.BOSS.onEnd = function (enc) { oe0 && oe0.apply(this, arguments); try { if (fl('treasure') >= 10 && enc && !(G.KASSEN && G.KASSEN.c)) { const lv = Math.max(d().lv, enc.lv || 1);
        G.LOOT.push({ x: G.H.x + 40, y: G.H.y + 8, t: 0, kind: 'item', it: R.roll(lv, (G.SC.def && G.SC.def.region) || 'wind') }); } } catch (x) { console.warn('fate drop', x); } }; }
  function fLearn(id) { const L = fl(id); if (L >= 10) return; if (pp() < 3 && !free()) { G.UI.toast('巔峰點數不足（需要 3）'); return; }
    if (!free()) d().pp -= 3; fate()[id] = L + 1; R.recalc(); dirty(); G.UI.toast(FB[id][1] + ' Lv' + (L + 1) + (L + 1 === 10 ? '　極：' + FB[id][3] : '')); }

  /* ---------- 洗點（神社小雪） ---------- */
  const week = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  function spentPP() { const r = d(); let n = 0; for (const k in r.fate || {}) n += 3 * r.fate[k]; for (const k in r.train || {}) if (r.train[k] > 5) n += 2 * (r.train[k] - 5);
    for (const k in r.wsk || {}) for (let lv = 6; lv <= r.wsk[k]; lv++) n += W.ppCost(lv); return n; }
  const ppResetCost = () => d().ppWeek === week() ? 300 * (d().pk || 0) : 0;
  function ppReset() { const r = d(), n = spentPP(); if (!n) { G.UI.toast('目前沒有使用中的巔峰點數'); return; } const c = ppResetCost(); if (r.gold < c) { G.UI.toast('錢不足（需要 ' + c + '）'); return; }
    r.gold -= c; if (!c) r.ppWeek = week(); r.fate = {}; for (const k in r.train || {}) if (r.train[k] > 5) r.train[k] = 5; for (const k in r.wsk || {}) if (r.wsk[k] > 5) r.wsk[k] = 5;
    r.pp = pp() + n; R.recalc(); dirty(); G.UI.toast('巔峰點數已重置，退回 ' + n + ' 點' + (c ? '（花費 ' + c + '）' : '（本週免費）')); }
  (function sh() { const F = G.FORGE; if (!F || !F.shrineCh) return setTimeout(sh, 50); const s0 = F.shrineCh.bind(F);
    F.shrineCh = function () { const L = s0.apply(this, arguments) || []; if ((d().pk || 0) > 0) { const c = ppResetCost(); L.push({ label: '巔峰點數重置（' + (c ? c + ' 錢' : '本週免費') + '）', then: [{ do: ppReset }] }); } return L; }; })();
  G.PEAK = { FATE, fl, fLearn, ppReset, spentPP, ppResetCost };

  /* ---------- 天命頁（角色 › 天命） ---------- */
  if (M && M.GROUPS && M.PAGE) { const g = M.GROUPS.find(q => q[0] === '角色'); if (g && !g[1].some(q => q[1] === '天命')) g[1].push(['天命', '天命']);
    M.PAGE['天命'] = function (x, y, w, h) { const U = M.ui, r = d(), RH = 58 * fs(), on = (r.pk || 0) > 0;
      U.box(x, y, w, h); const pk = G.ICO && G.ICO.drawC('ico_peak', x + 24, y + 18, 26) ? 26 : 0; G.txt('巔峰點數 ' + pp() + '　（巔峰 ' + (r.pk || 0) + '・已用 ' + spentPP() + '）', x + 14 + pk, y + 18, 13, pp() ? '#8fd38f' : C.sub, 'left', G.FONT_S, 900);
      G.txt(on ? '每級 3 點・最多 10 級・重置找神社小雪' : '角色 Lv100 後升巔峰等級才會得到巔峰點數', x + w - 14, y + 18, 10, C.dim, 'right', G.FONT, 500);
      const off = U.scrollArea('fate', x, y + 34, w, h - 38, FATE.length * RH + 8); U.clip(x, y + 34, w, h - 38); let yy = y + 38 + off;
      for (const f of FATE) { const L = fl(f[0]), mx = L >= 10;
        ctx.fillStyle = 'rgba(255,255,255,.03)'; G.rr(x + 8, yy, w - 16, RH - 6, 6); ctx.fill();
        const iw = G.ICO && G.ICO.drawC('ico_fate_' + f[0], x + 14 + (RH - 14) / 2, yy + (RH - 6) / 2, RH - 14, L ? 1 : 0.55) ? RH - 8 : 0;
        G.txt(f[1] + '　Lv ' + L + '／10', x + 18 + iw, yy + RH * 0.24, 13, L ? C.ink : C.sub, 'left', G.FONT_S, 900);
        G.txt('每級：' + f[2] + (L ? '（目前 ×' + L + '）' : ''), x + 18 + iw, yy + RH * 0.52, 11, L ? '#7fd36b' : C.sub, 'left', G.FONT, 500);
        G.txt('Lv10 極：' + f[3], x + 18 + iw, yy + RH * 0.76, 10, mx ? '#f3d98a' : C.dim, 'left', G.FONT, 500);
        U.button(x + w - 98, yy + 8, 82, RH - 22, mx ? '滿' : '+1（3 點）', on && !mx ? () => fLearn(f[0]) : null, on && !mx && pp() >= 3 ? 'main' : 'off'); yy += RH; }
      ctx.restore(); }; }

  (function wait() { if (!G.SAVE || !G.SAVE.data || !d()) return setTimeout(wait, 100); migrate(); })();
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); try { migrate(); } catch (x) {} };
})();
