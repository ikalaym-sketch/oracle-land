/* ==========================================================================
 * 神諭之地 重製版 — 60_pkit2.js
 * Version : r3.22.0  (2026-11-14)
 * 變更    : r3.22.0 新增。夥伴招式觸發與功能重整（含隱藏夥伴）：
 *           ・招式等級 skLv：選用的分支招式＝該節點等級（1～5）；基本招式＝1＋夥伴等級每 20 級 +1（上限 5）。
 *           ・隨招式等級成長：攻擊 +15%／級；補血 +20%／級；減傷 +15%／級（上限 70%）、持續 +10%／級；護衛次數 4 級起 +1。
 *           ・汐音：補血對象改為全隊血量比例最低者（含自己與其他夥伴）；全隊招式補所有人；補血量提高；指令補血附 5 秒回復；
 *             隊上有人 <70% 就自動補（自動 12%、冷卻 6 秒）；有人 <35% 緊急補（無視冷卻，20 秒一次）；補血間隔 12 秒 → 4 秒。
 *           ・白丸：主角 <40% 或身邊 ≥2 敵 → 自動護衛＋嘲諷。葛葉：主角身邊 ≥3 敵 → 自動結界。役小角：身邊 ≥3 敵 → 自動行法。
 *           ・目標優先：颯／茨木／建御雷 優先打主角正在打的目標與頭目、架盾敵；源賴光 優先打正在攻擊主角的敵人。
 *           自動指令共用指令冷卻（頭像上的倒數照常顯示）；判斷每 10 幀一次，不逐幀掃描。
 * 依賴    : 49_party、50_party_kit（G.PKIT／G.PEV）、51_party_grow（nodeLv／variant／data）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, K = G.PKIT, H = G.H; if (!PY || !K || !G.PEV) return;
  const alive = e => e && e.st !== 'dead' && e.hp > 0, HH = () => G.HERO_H || 64;
  /* ---------- 招式等級 ---------- */
  PY.skLv = (P, ch) => { const k = PY.variant ? PY.variant(P.id, ch) : ch; if (k && k !== ch) return Math.max(1, Math.min(5, PY.nodeLv(P.id, k)));
    const lv = (PY.data(P.id) || {}).lv || 1; return Math.min(5, 1 + Math.floor(lv / 20)); };
  PY.nodeMul = (P, ch) => (!ch || ch === 'burn') ? 1 : 1 + 0.15 * (PY.skLv(P, ch) - 1);   // 攻擊
  const healMul = (P, ch) => 1 + 0.2 * (PY.skLv(P, ch || 'autonomous') - 1);
  const defLv = (P, c) => PY.skLv(P, (c && c.ch) || 'command');
  /* ---------- 補血：對象＝全隊 ---------- */
  const team = () => [H].concat(PY.list.filter(P => P.st !== 'down'));
  const ratio = o => o.hp / Math.max(1, o.hpMax);
  const lowest = () => team().reduce((a, b) => ratio(b) < ratio(a) ? b : a, H);
  PY.lowRatio = () => ratio(lowest());
  PY.canHeal = () => !(PY.healWin > 0) && PY.lowRatio() < 1;
  PY.regen = PY.regen || [];
  function give(P, o, amt, fx) { const h0 = o.hp; o.hp = Math.min(o.hpMax, Math.round(o.hp + amt)); const d = Math.round(o.hp - h0); if (d <= 0) return 0;
    G.NUMS.push({ x: o.x, y: o.y - HH() - 10, v: '+' + d, t: 0, heal: true });
    if (fx && PY.fxSpawn) try { PY.fxSpawn(P, fx, o.x, o.y - HH() * 0.55 * (G.SC.depth ? G.SC.depth(o.y) : 1), 1); } catch (e) {} return d; }
  function heal(P, ev, c) { if (P.st === 'down' || (ev.echo && P.hurtT > 0)) return; if (ev.win) PY.healWin = 240;
    const m = healMul(P, c.ch), L = ev.all ? team() : [lowest()]; let tot = 0;
    for (const o of L) tot += give(P, o, o.hpMax * ev.pct / 100 * m, ev.fx);
    if (ev.regen) PY.regen.push({ P, L, t: ev.regen * 60, per: ev.rpct / 100 * m });
    if (tot && PY.kpiAdd) PY.kpiAdd(P.id, 'heal', tot); }
  /* ---------- 減傷：依招式等級 ---------- */
  function scaleDef(P, ev, c) { const L = defLv(P, c), o = Object.assign({}, ev);
    if (o.dr) o.dr = Math.min(0.7, o.dr * (1 + 0.15 * (L - 1)));
    if (o.dur) o.dur = o.dur * (1 + 0.1 * (L - 1));
    if (o.k === 'guard' && o.n && L >= 4) o.n += 1; return o; }
  const run0 = G.PEV.run.bind(G.PEV);
  G.PEV.run = function (P, ev, c) { if (ev.k === 'heal') return heal(P, ev, c || {});
    if (ev.k === 'guard' || ev.k === 'self' || (ev.k === 'zone' && ev.dr)) return run0(P, scaleDef(P, ev, c), c);
    return run0(P, ev, c); };
  /* ---------- 汐音：補血量與觸發 ---------- */
  const S = K.shion;
  if (S) { const set = (k, L) => { if (!S[k]) return; let i = 0; for (const e of S[k].ev) if (e.k === 'heal') Object.assign(e, L[Math.min(i++, L.length - 1)]); };
    set('autonomous', [{ pct: 12 }, { pct: 4 }]);
    set('command', [{ pct: 15, regen: 5, rpct: 1.2 }, { pct: 4 }]);
    set('grandCombo', [{ pct: 20, all: 1 }, { pct: 6, all: 1 }]);
    set('A2', [{ pct: 12 }, { pct: 5 }]); set('A3', [{ pct: 10, all: 1 }, { pct: 5, all: 1 }]);
    set('A4', [{ pct: 4, all: 1 }, { pct: 2, all: 1 }]); set('A6', [{ pct: 8, all: 1 }, { pct: 6, all: 1 }]);
    S.autonomous.can = () => PY.lowRatio() < 0.7 && PY.canHeal(); S.autonomous.cd = 6;
    if (S.A2) S.A2.can = () => PY.lowRatio() < 0.55 && PY.canHeal();
    S.command.can = () => PY.lowRatio() < 1; }
  /* ---------- 情境規則（每 10 幀） ---------- */
  const near = (x, y, r) => G.E.filter(e => alive(e) && Math.hypot(e.x - x, (e.y - y) * 1.6) < r).length;
  const autoCmd = P => { if (P.cur || P.st === 'down' || (P.cd.cmd || 0) > 0) return false; if (PY.cast(P, 'command', 'auto')) { P.cd.cmd = PY.cdOf(P, 'command'); return true; } return false; };
  const prio = (P, f) => { let best = null, bs = 1e9; for (const e of G.E) { if (!alive(e)) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d > 560) continue; const s = d - f(e); if (s < bs) { bs = s; best = e; } } if (best) P.tg = best; };
  const hit = () => alive(H.lastHit) ? H.lastHit : null;
  const RULE = {
    shion(P) { if (PY.lowRatio() < 0.35 && !(P.emT > 0) && !P.cur) { P.cd.auto = 0; PY.healWin = 0; if (PY.cast(P, 'autonomous', 'auto')) { P.cd.auto = PY.cdOf(P, 'autonomous'); P.emT = 1200; } } },
    shiro(P) { if (ratio(H) < 0.4 || near(H.x, H.y, 140) >= 2) autoCmd(P); },
    kuzuha(P) { if (near(H.x, H.y, 160) >= 3) autoCmd(P); },
    enno(P) { if (near(H.x, H.y, 180) >= 3) autoCmd(P); },
    hayate(P) { prio(P, e => (e === hit() ? 260 : 0) + (e.boss || e.bb ? 200 : 0)); },
    ibaraki(P) { prio(P, e => (e.boss || e.bb ? 260 : 0) + (e.guard || e.shield ? 200 : 0) + (e === hit() ? 120 : 0)); },
    takemikazuchi(P) { prio(P, e => (e.boss || e.bb ? 260 : 0) + (e.guard || e.shield ? 200 : 0) + (e === hit() ? 120 : 0)); },
    yorimitsu(P) { prio(P, e => (e.st === 'atk' && Math.hypot(e.x - H.x, e.y - H.y) < 170 ? 300 : 0) + (e === hit() ? 100 : 0)); }
  };
  let tk = 0; const st0 = PY.step.bind(PY);
  PY.step = function () {
    if (PY.list.length) { for (let i = PY.regen.length - 1; i >= 0; i--) { const r = PY.regen[i]; if (r.t-- % 60 === 0) for (const o of r.L) if (o === H || o.st !== 'down') give(r.P, o, o.hpMax * r.per, null); if (r.t <= 0) PY.regen.splice(i, 1); }
      for (const P of PY.list) if (P.emT > 0) P.emT--;
      if (++tk % 10 === 0) for (const P of PY.list) { const f = RULE[P.id]; if (f && P.st !== 'down') try { f(P); } catch (e) { console.warn('pkit2', P.id, e); } } }
    return st0(); };
})();
