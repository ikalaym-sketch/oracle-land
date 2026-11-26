/* ==========================================================================
 * 神諭之地 重製版 — 75_partyup.js
 * Version : r3.33.0  (2026-11-17)
 * 變更    : r3.33.0 新增。夥伴強化（招式更常出現、玩家看得懂怎麼觸發）：
 *           ・冷卻：自主、指令減半；小連攜 ×0.75。
 *           ・指令自動：戰鬥中冷卻好、目標在射程內就自己放（設定頁可關，關掉時只能點頭像）。白丸／葛葉／役小角原本的情境觸發照舊。
 *           ・小連攜：除了主角重擊，主角每打中 6 下也會觸發一次（各自冷卻照舊）。
 *           ・連攜條：夥伴命中累積加倍，主角每次命中也替出戰夥伴各 +1。
 *           ・大連攜自動（設定頁，預設關）：連攜條滿、場上有頭目或主角身邊 ≥3 隻敵人時自己放。
 *           ・汐音：指令一定能放（沒人受傷時當預防：回復＋持續回血）；自主 85% 以下就補；A2 80% 以下。
 *           ・技能樹：夥伴 Lv5 免費學會 A2、Lv10 免費學會 B2（不花技能點；沒裝其他自主招時自動裝上）。重置後再次贈送。
 *           ・PY.moveInfo(id, 招式鍵)：從招式實際事件算出傷害段數、總倍率、效果，給夥伴頁與招式表使用。
 * 存檔    : save.pauto = { cmd: 1|0（預設 1）, grand: 1|0（預設 0） }；rpg.comp[id].gift = { A2:1, B2:1 }。
 * 依賴    : 49_party（cast／cdOf／dmg／onHeroBig／step）、50_party_kit（G.PKIT）、51_party_grow（data／nodes／spent）、60_pkit2（RULE、汐音補血）、16_growth（G.SET_EXTRA）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, K = G.PKIT, H = G.H; if (!PY || !K) return;
  const alive = e => e && e.st !== 'dead' && e.hp > 0;
  const OP = () => { const s = G.SAVE.data; if (!s.pauto) s.pauto = { cmd: 1, grand: 0 }; return s.pauto; };
  const SELF_RULE = { shiro: 1, kuzuha: 1, enno: 1 };   // 60_pkit2 已有情境指令（汐音走一般自動）

  /* ---------- 1. 冷卻 ---------- */
  const cd0 = PY.cdOf; PY.cdOf = (P, ch) => { const v = cd0(P, ch); return ch === 'autonomous' || ch === 'command' ? Math.round(v * 0.5) : ch === 'smallCombo' ? Math.round(v * 0.75) : v; };

  /* ---------- 2. 汐音條件 ---------- */
  const S = K.shion; if (S) { if (S.autonomous) S.autonomous.can = () => PY.lowRatio() < 0.85 && PY.canHeal(); if (S.A2) S.A2.can = () => PY.lowRatio() < 0.8 && PY.canHeal(); if (S.command) S.command.can = () => true; }

  /* ---------- 3. 連攜條加倍 ---------- */
  const dmg0 = PY.dmg; PY.dmg = function (P, e, mult, o) { const ok = alive(e); dmg0.apply(this, arguments); if (ok && P) P.link = Math.min(100, P.link + (o && o.big ? 8 : 3)); };

  /* ---------- 4. 主角命中：每 6 下小連攜、連攜條 +1 ---------- */
  let hits = 0;
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const hero = !(opt && opt.party) && !G._bleedTick && e && e.st !== 'dead'; const r = do0.apply(this, arguments);
    if (hero && PY.list.length) { for (const P of PY.list) if (P.st !== 'down') P.link = Math.min(100, P.link + 1); if (!big && ++hits % 6 === 0 && alive(e)) PY.onHeroBig(e); }
    return r; };

  /* ---------- 5. 自動指令、自動大連攜 ---------- */
  const near = (x, y, r) => G.E.filter(e => alive(e) && Math.hypot(e.x - x, (e.y - y) * 1.6) < r).length;
  const bossOn = () => (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.E.some(e => alive(e) && (e.boss || e.bb));
  function auto(P) { if (P.cur || P.st === 'down') return; const o = OP(), e = alive(P.tg) ? P.tg : null; if (!e) return; const def = PY.DEF[P.id], d = Math.hypot(e.x - P.x, e.y - P.y);
    if (o.grand && P.link >= 100 && (bossOn() || near(H.x, H.y, 220) >= 3)) { if (PY.cast(P, 'grandCombo', 'auto')) { P.link = 0; return; } }
    if (o.cmd && !SELF_RULE[P.id] && !((P.cd.cmd || 0) > 0) && d < (def.ranged ? 480 : (def.reach || 70) + 120)) { if (PY.cast(P, 'command', 'auto')) P.cd.cmd = PY.cdOf(P, 'command'); return; }
    if (o.cmd && SELF_RULE[P.id] && !((P.cd.cmd || 0) > 0) && (P.cbt || 0) > 360) { if (PY.cast(P, 'command', 'auto')) { P.cd.cmd = PY.cdOf(P, 'command'); P.cbt = 0; } } }   // 情境沒成立，戰鬥 6 秒也放一次
  /* ---------- 6. 技能樹贈送 ---------- */
  const GIFT = [[5, 'A2'], [10, 'B2']];
  function grant(id) { const c = PY.data(id), tr = PY.TREE && PY.TREE[id]; if (!c || !tr) return; c.gift = c.gift || {}; let ch = 0;
    for (const [lv, k] of GIFT) { if (c.lv < lv || !tr.n[k] || (c.nodes[k] || 0) > 0) continue; c.nodes[k] = 1; c.gift[k] = 1; const sl = tr.n[k].ch; if (sl !== 'p' && !(c.sel[sl] && (c.nodes[c.sel[sl]] || 0) > 0)) c.sel[sl] = k; ch = 1;
      if (PY.slots().includes(id)) G.UI.toast(PY.DEF[id].name + ' 學會「' + tr.n[k].n + '」'); }
    if (ch) G.SAVE.markDirty(); }
  const sp0 = PY.spent; PY.spent = id => { const c = PY.data(id); let s = sp0(id); for (const k in c.gift || {}) if ((c.nodes[k] || 0) > 0) s--; return Math.max(0, s); };
  const cl0 = PY.canLearn; PY.canLearn = (id, k) => { const c = PY.data(id); if ((c.gift || {})[k] && !(c.nodes[k] > 0)) return ''; return cl0(id, k); };
  /* ---------- 主迴圈：每 10 幀 ---------- */
  let tk = 0; const st0 = PY.step.bind(PY);
  PY.step = function () { const r = st0(); if (PY.list.length) { tk++; for (const P of PY.list) P.cbt = alive(P.tg) ? (P.cbt || 0) + 1 : 0;
      if (tk % 10 === 0) for (const P of PY.list) try { auto(P); } catch (x) { console.warn('partyup', P.id, x); }
      if (tk % 300 === 0) for (const id of PY.roster()) grant(id); } return r; };
  const en0 = PY.enter; if (en0) PY.enter = function () { const r = en0.apply(this, arguments); try { for (const id of PY.roster()) grant(id); } catch (x) {} return r; };

  /* ---------- 7. 招式資訊（從實際事件算） ---------- */
  const TAG = { guard: '護擋', taunt: '嘲諷', cleanse: '淨化', heal: '治療', mark: '標記弱點', armor: '霸體', self: '自身強化', spr: '連射' };
  const ZTAG = { ward: '減傷結界', bind: '束縛', lane: '緩速', tether: '牽引' };
  PY.moveInfo = function (id, k) { const kit = K[id], sk = kit && kit[k]; if (!sk) return null; let m = 0, n = 0; const fx = new Set();
    for (const e of sk.ev) { if ((e.k === 'hit' || e.k === 'proj') && e.m) { m += e.m * (e.n || 1); n += e.n || 1; } else if (e.m) { m += e.m; n++; }
      if (e.kb) fx.add('推退'); if (e.slow) fx.add('緩速'); if (e.stun || e.stg) fx.add('失衡'); if (e.burn) fx.add('灼燒'); if (e.root) fx.add('束縛');
      if (e.k === 'zone') { if (e.dr) fx.add('減傷結界'); else if (ZTAG[e.z]) fx.add(ZTAG[e.z]); } else if (TAG[e.k]) fx.add(TAG[e.k]); }
    return { name: sk.name, dmg: Math.round(m * 100), hits: n, fx: [...fx], can: !!sk.can }; };
  const HOW = { ordinary: '靠近敵人就打', autonomous: '戰鬥中自己放', command: '', smallCombo: '主角重擊或每打中 6 下', grandCombo: '連攜條滿後點頭像' };
  PY.moveText = (id, ch) => { const k = PY.variant ? PY.variant(id, ch) : ch, i = PY.moveInfo(id, k) || PY.moveInfo(id, ch); if (!i) return '';
    const how = ch === 'command' ? (OP().cmd ? '自動放，也可點頭像' : '點頭像') : ch === 'grandCombo' ? (OP().grand ? '連攜條滿自動放' : '連攜條滿後點頭像') : HOW[ch];
    return i.name + '：' + how + (i.dmg ? '・傷害 ' + i.dmg + '%' + (i.hits > 1 ? '（' + i.hits + ' 段）' : '') : '') + (i.fx.length ? '・' + i.fx.join('、') : ''); };

  /* ---------- 8. 設定頁 ---------- */
  G.SET_EXTRA = (G.SET_EXTRA || []).concat([
    () => ['夥伴指令', OP().cmd ? '自動' : '手動', () => { const o = OP(); o.cmd = o.cmd ? 0 : 1; G.SAVE.markDirty(); G.UI.toast(o.cmd ? '夥伴指令：冷卻好就自己放' : '夥伴指令：點頭像才放'); }],
    () => ['大連攜', OP().grand ? '自動' : '手動', () => { const o = OP(); o.grand = o.grand ? 0 : 1; G.SAVE.markDirty(); G.UI.toast(o.grand ? '大連攜：遇到頭目或被包圍時自己放' : '大連攜：連攜條滿後點頭像'); }]]);
})();
