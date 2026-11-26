/* ==========================================================================
 * 神諭之地 重製版 — 61_qwave.js
 * Version : r3.52.1  (2026-11-23)　r3.52.1：一般對話標記沒有人也補人（傘妖、無名武士用妖怪圖，仙鶴這類非人用靈光）
 * 舊版    : r3.52.0  (2026-11-23)　r3.52.0：調查點站位的人標記 qp（事件期間不退場）；站位的人被合併掉時重新找人
 * 舊版    : r3.30.0  (2026-11-16)　r3.30.0：調查點借用村民改走委託選單，不再藏起同一人的其他委託；名字以別名比對
 * 舊版    : r3.27.4  (2026-11-16)　r3.27.4：調查點借用的村民若同時是別的委託人，先藏起那個委託標記（第 11 章梅乃婆婆對話被第 1 章委託搶走）
 * 變更    : r3.27.0 主線也套用；只看目前這一步（同圖後面有討伐也照樣先打波次）。
 * 變更    : r3.23.0 新增。
 *           ・調查點有人說話（不是蒼真）→ 該點站一個人（專屬圖優先，否則依名字用通用村民圖；「回聲」用靈光），標記改為「對話」。
 *           ・支線任務在任務／副本地圖（Q_／D_）只有對話／調查 → 進圖先擊退 3 波怪（每波 3～4 隻，第 3 波帶精英，不重生），
 *             清完目標 NPC 才從畫面邊走進來。進度存在任務狀態（wv），中途離開下次從第 1 波重來；清完不再重複。
 *           ・同步每 20 幀一次，不逐幀掃描。
 * 依賴    : 53_quest（Q.marks、Q.L、Q.build、Q.load）、20_npc（AMB）、59_stage（STAGE.find）、02_scene。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, SC = G.SC, H = G.H; if (!Q) return;
  const qs = () => G.SAVE.data.qs || (G.SAVE.data.qs = {});
  const cur = q => { const s = qs()[q.id]; return s && !s.done ? q.steps[s.s] : null; };
  const lines = L => { try { return typeof L === 'function' ? L() : L; } catch (e) { return null; } };
  const alive = e => e && e.st !== 'dead' && e.hp > 0;
  /* ---------- 調查點上的人 ---------- */
  function genU(n) { if (/鬼/.test(n)) return 'n_t_oni_veteran'; if (/巡檢|武士|守|兵/.test(n)) return 'n_t_human_guard'; if (/代表|老|爺|長/.test(n)) return 'n_t_human_elder';
    if (/婆|娘|姬|姐|妹|女|阿[絹松紺]|[景緒雪音葉花子]$/.test(n)) return 'n_t_human_townswoman'; return 'n_t_human_carrier'; }
  const PEO = {};   // markId → { a, kind }
  const NONHUMAN = /鶴|鳥|鼬|靈|魂/;
  function speaker(m) { if (m.q && m.kind === 'talk' && !/:g\d+$/.test(m.id) && !m.near && m.x > -999 && !(W.on && W.on.q === m.q)) {   /* r3.52.0：對話標記上沒有人（沒指定人物圖、或人物載入失敗）→ 等 3 秒後補一個人站上去 */
      if (m.n || m.st || (m.sts && m.sts.length) || (m.ns && m.ns.length)) return null; m.t0 = m.t0 || G.t; if (G.t - m.t0 < 180) return null; const w = m.label; return w && w !== '蒼真' ? w : null; }
    if (!m.q || !/:g\d+$/.test(m.id)) return null; const step = cur(m.q); if (!step || step.t !== 'gather') return null;
    const sp = (step.spots || [])[+m.id.split(':g')[1]], L = sp && lines(sp.lines); const w = L && L[0] && L[0].who; return w && w !== '蒼真' && w === (sp.label || w) ? w : (w && w !== '蒼真' ? w : null); }
  function placePeople() { const sid = SC.id;
    for (const m of Q.marks) { const who = speaker(m); if (!who) continue; m.kind = 'talk'; m.label = who; if (PEO[m.id]) { const o = PEO[m.id];
        if (o.a && o.a.amb && !o.a.wisp && !(G.AMB && G.AMB.list.includes(o.a))) { delete PEO[m.id]; }   /* r3.52.0：站位的人被合併／移除了 → 重新找人站上去（原本標記跟著已移除的人，只剩地上的框） */
        else { if (o.a && o.a.x !== undefined) { m.x = o.a.x; m.y = o.a.y; if (o.a.amb) { o.a.qp = 1; o.a.evOff = 0; } } continue; } }
      const o = PEO[m.id] = { sid }; if (who === '回聲' || (NONHUMAN.test(who) && !(G.STAGE && G.STAGE.find(who)))) { o.a = { name: who, x: m.x, y: m.y, wisp: 1 }; G.NPC.push(o.a); continue; }
      const ex = G.AMB && G.AMB.list.find(n => (G.CAST ? G.CAST.same(n.name, who) : n.name === who) && !Object.values(PEO).some(x => x.a === n));   // 村裡本來就有這個人：叫他站到調查點
      if (ex) { o.a = ex; o.reuse = 1; Object.assign(ex, { x: m.x, y: m.y, hold: true, st: 'idle', qp: 1, evOff: 0, onTalk: () => G.CAST ? G.CAST.talk(ex) : (Q.marks.includes(m) && (G.UI.near = null, m.run())) }); continue; }   /* r3.30.0：同一人有多件委託 → 選單（不再藏起其他委託） */
      const f = G.STAGE && G.STAGE.find(who);
      if (f && (f.k === 'an' || f.k === 'npc')) { const key = f.k === 'an' && f.key(); const a = o.a = f.k === 'npc' ? { npc: f.npc, name: who, x: m.x, y: m.y, face: 1 } : { anim: key, hk: f.hk || 1, nat: f.nat || 1, name: who, x: m.x, y: m.y, face: -1 }; G.NPC.push(a);
        if (a.anim) Promise.resolve(G.ANIM.load(key)).then(u => { if (!u || !u.act) return; a.u = u; const k = Object.keys(u.act).filter(n => /idle|stand/.test(n) && !/arm|fx|shadow/.test(n)).sort((x, y) => x.length - y.length)[0] || Object.keys(u.act)[0]; a.clip = u.act[k]; }, () => 0); continue; }
      if (G.AMB) G.AMB.add(f && f.k === 'amb' ? f.u : genU(who), m.x, m.y, { name: who, hold: true, onTalk: () => { if (Q.marks.includes(m)) { G.UI.near = null; m.run(); } } }).then(a => { if (!a) return; if (SC.id !== sid || PEO[m.id] !== o) { G.AMB.remove(a); return; } o.a = a; a.face = H.x < a.x ? -1 : 1; }); } }
  function clearPeople() { for (const k in PEO) { const o = PEO[k]; if (o.a && !o.reuse) { if (o.a.amb && G.AMB) G.AMB.remove(o.a); else G.NPC = G.NPC.filter(x => x !== o.a); } delete PEO[k]; } }
  /* 回聲：淡藍靈光 */
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n.wisp) return dn0(n); const c = G.ctx, s = SC.depth(n.y), a = 0.45 + 0.25 * Math.sin(G.t * 0.09), y = n.y - 40 * s + Math.sin(G.t * 0.05) * 4;
    const g = c.createRadialGradient(n.x, y, 2, n.x, y, 26 * s); g.addColorStop(0, `rgba(220,240,255,${a})`); g.addColorStop(1, 'rgba(120,170,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(n.x, y, 26 * s, 0, 6.283); c.fill(); };
  /* ---------- 支線波次 ---------- */
  const W = G.QWAVE = { on: null, N: 3 };
  const needWave = q => { const step = cur(q); if (!step || step.map !== SC.id || !/^(Q_|D_)/.test(SC.id) || !/talk|look|gather|choice/.test(step.t)) return false;
    const s = qs()[q.id]; return s.wv !== s.s; };
  function hideQ(q) { if (G.HUB && G.HUB.marks) G.HUB.marks = G.HUB.marks.filter(m => m.q !== q); for (const m of Q.marks) if (m.q === q && m.n) { m.n.x = -9999; m.n.wvHide = 1; } }
  function wave() { const w = W.on, types = SC.def.foes && SC.def.foes.length ? SC.def.foes : ['akaoni'], lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 2), n = 3 + (w.i % 2);
    const go = () => { if (W.on !== w || SC.id !== w.sid) return; for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, e = G.spawnOni(H.x + side * (240 + i * 30), H.y + (i % 3 - 1) * 40, 10 + i * 12, lv, types[i % types.length]);
      if (e) { e.wv = 1; if (w.i === W.N - 1 && i === 0) { e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio *= 1.12; e.elite = '精英'; } } }
      w.spawned = 1; G.UI.toast('第 ' + (w.i + 1) + '／' + W.N + ' 波'); if (w.i === W.N - 1) G.UI.banner('精英出現', '擊退後委託對象才會現身'); };
    w.spawned = 0; Q.load(types).then(go, go); }
  function startWave(q) { SC.auto = false; for (const e of G.E) if (!e.qid && !e.bb) e.hp = 0; G.E = G.E.filter(e => e.qid || e.bb);
    W.on = { q, i: 0, sid: SC.id, t: 0 }; hideQ(q); G.UI.banner('有妖怪擋路', '擊退 ' + W.N + ' 波，委託對象才會現身'); G.STORY.later(60, wave); }
  function endWave() { const w = W.on; W.on = null; const s = qs()[w.q.id]; if (s) { s.wv = s.s; G.SAVE.markDirty(); }
    Q.build(); for (const m of Q.marks) if (m.q === w.q) { const n = m.n; if (n) { const tx = m.x, ty = m.y, side = tx > H.x ? 1 : -1, { vw } = SC.view(); n.wvHide = 0; n.x = Math.max(30, Math.min(SC.def.w - 30, H.x + side * vw * 0.55)); n.y = ty; n.st = 'walk'; n.tx = tx; n.ty = ty; n.hold = false; n.onArrive = k => { k.hold = true; k.st = 'idle'; }; } }
    G.UI.banner('妖怪退散了', '委託對象出現了'); }
  function waveStep() { const w = W.on; if (!w) return; if (SC.id !== w.sid) { W.on = null; return; } hideQ(w.q);
    if (!w.spawned || G.DLG.active()) return; if (G.E.some(e => e.wv && alive(e))) return; if (++w.i >= W.N) endWave(); else wave(); }
  const ob0 = G.STORY.objective.bind(G.STORY);
  G.STORY.objective = function () { const w = W.on; if (w && SC.id === w.sid) return (w.q.main ? '【主線】' : '【支線】') + '擊退妖怪　第 ' + Math.min(W.N, w.i + 1) + '／' + W.N + ' 波'; return ob0(); };
  /* ---------- 掛勾 ---------- */
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { clearPeople(); W.on = null; en0(id); G.STORY.later(50, () => { if (SC.id !== id || W.on) return; const q = Q.L.find(needWave); if (q) startWave(q); }); };
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 20) return; try { placePeople(); waveStep(); } catch (e) { console.warn('qwave', e); } };
})();
