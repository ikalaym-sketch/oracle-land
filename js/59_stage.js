/* ==========================================================================
 * 神諭之地 重製版 — 59_stage.js
 * Version : r3.58.0  (2026-11-24)　r3.58.0：修正 r3.56.0 註解吞掉 idle／mv 宣告（劇情登場角色報錯）
 * 舊版    : r3.56.0  (2026-11-24)　r3.56.0：夥伴登場大小與戰鬥一致　r3.41.0：對話中路人不會走（AM.step 停）→ 畫面外的同名路人與新生成的路人直接站到說話位置（不透明）；
 *           只有「本圖的頭目」說完話才留在原地，其他頭目圖（如第 2 章的道摩）對話後照常退場；走位不再用 tryMove（擠住時來回抖），最多 1.5 秒到位
 * 舊版    : r3.30.0  (2026-11-16)　r3.30.0：說話者以別名比對（五平＝東村・五平）；同圖已有此人就不另生，路人在畫面外改成走過來
 * 舊版    : r3.27.0  (2026-11-14)
 * 變更    : r3.27.0 夥伴用自身身高比例；已加入／白丸不另外生成；頭目說話後留在原地直到真正開打。
 * 變更    : r3.21.0 新增。對話登場：任何對話開始時，說話者若不在畫面上，就讓他從畫面邊走／跑到主角身旁再說話；
 *           對話結束後退場（接續對話若同一人還在說話則保留）。頭目：站在頭目出場位置；頭目倒下後的台詞站在倒下處。
 *           名稱→圖集：夥伴（PARTY.DEF）、任務 NPC（任務步驟的 u）、委託人立繪（Q.STAT）、頭目（BOSS.DEF 與其 actors）。
 * 依賴    : 05_dialog、20_npc（AMB）、26_boss、49/50_party、53_quest。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, A = G.ANIM, ST = G.STAGE = { on: [], miss: {} };
  const SKIP = new Set(['蒼真', '', '旁白', '？？？', '眾人', '村人們']);
  let IDX = null;
  function build() { IDX = {};
    const put = (n, v) => { if (n && !IDX[n]) IDX[n] = v; };
    for (const [n, id] of [['小雪', 'xue'], ['阿松', 'matsu'], ['權爺', 'gen'], ['小太', 'kota'], ['鐵心', 'smith']]) if (G.D.npc && G.D.npc[id]) put(n, { k: 'npc', npc: id });
    const PD = G.PARTY && G.PARTY.DEF || {}; for (const id in PD) { const D = PD[id]; if (D && D.name && D.unit) put(D.name, { k: 'pa', id, hk: D.ratio || 1, key: () => D.unit({ id }) }); }
    const S = G.QST && G.QST.STAT || {}; for (const n in S) { const [k, hk, cn, nat] = S[n]; put(n, { k: 'an', key: typeof k === 'function' ? k : () => k, hk, cn, nat }); }
    for (const q of (G.QST && G.QST.L) || []) for (const s of [q.giver, q.after2, ...(q.steps || [])]) if (s && s.u && s.name) put(s.name, { k: 'amb', u: s.u });
    const BD = G.BOSS && G.BOSS.DEF || {}; for (const id in BD) { const d = BD[id]; for (const a of d.actors || []) if (a.name && a.unit) put(a.name, { k: 'an', key: () => a.unit, hk: Math.min(1.3, a.size || 1.15), boss: id });
      if (d.name && d.unit) for (const n of String(d.name).split(/[・（(]/)) put(n.trim(), { k: 'an', key: () => d.unit, hk: Math.min(1.3, d.size || 1.2), boss: id }); }
    for (const n of Object.keys(IDX)) { const m = n.match(/^(.+?)(童子|大將|長兄|王)$/); if (m && m[1].length >= 2) put(m[1], IDX[n]); } }
  const find = n => { if (!IDX) build(); if (IDX[n]) return IDX[n]; for (const k in IDX) if (k.length >= 2 && n.length >= 2 && (k.startsWith(n) || n.startsWith(k) || k.endsWith(n) || n.endsWith(k))) return IDX[k]; return null; };
  /* 本圖的頭目：說話者名稱對上頭目（或其 actors）就用頭目圖集站在出場點 */
  function bossHere(n) { const B = G.BOSS, id = B && B.MAP && B.MAP[SC.id], d = id && B.DEF[id]; if (!d) return null; const hit = s => s && (s === n || s.startsWith(n) || n.startsWith(s));
    for (const a of d.actors || []) if (hit(a.name) && a.unit) return { k: 'an', key: () => a.unit, hk: Math.min(1.3, a.size || 1.15), boss: id };
    if (String(d.name || '').split(/[・（(]/).some(x => hit(x.trim())) && d.unit) return { k: 'an', key: () => d.unit, hk: Math.min(1.3, d.size || 1.2), boss: id }; return null; }
  const nm = o => o && (o.name || o.label || '');
  const same = (a, b) => G.CAST ? G.CAST.same(a, b) : a === b;   /* r3.30.0：別名視為同一人（五平＝東村・五平） */
  function visible(n) { const { vw } = SC.view ? SC.view() : { vw: 900 }, H = G.H, inV = o => o && Math.abs(o.x - H.x) < vw * 0.6;
    const here = G.NPC.find(o => same(nm(o), n) && o.x > -999); if (here) { if (!inV(here) && here.amb && !here.shop) { const t = spot(n, {}, ST.on.length); here.x = t[0]; here.y = t[1]; here.alpha = 1; here.st = 'idle'; here.hold = true; here.face = G.H.x < here.x ? -1 : 1; } return true; }   /* r3.30.0：同圖已有此人 → 不另生；路人在畫面外就走過來 */
    const PY = G.PARTY; if (PY && PY.list && PY.list.some(m => { const D = PY.DEF && PY.DEF[m.id]; return D && same(D.name, n) && inV(m); })) return true;
    if (G.E.some(e => e.st !== 'dead' && (e.name === n || e.elite === n || (e.name && e.name.indexOf(n) >= 0)) && inV(e))) return true;
    return false; }
  const clipOf = (u, re) => { const ks = Object.keys(u.act || {}).filter(k => re.test(k)), ok = ks.filter(k => !/arm|baba|missing|shadow|tail|fx|_to_/.test(k)); return (ok.length ? ok : ks).sort((a, b) => a.length - b.length)[0]; };
  /* 目標位置：頭目→頭目出場點／倒下處；其他→主角兩側錯開 */
  function spot(n, f, i) { const H = G.H;
    if (f.boss) { const dead = G.E.find(e => e.bb && (e.name === n || (e.name || '').indexOf(n) >= 0)); if (dead) return [dead.x, dead.y];
      const c = SC.def.nodes && SC.def.nodes.center; if (G.BOSS.MAP && G.BOSS.MAP[SC.id] === f.boss && c) { const vw = SC.view ? SC.view().vw : 900, x = Math.max(H.x - vw * 0.38, Math.min(H.x + vw * 0.38, c[0] + 160)); return (SC.snap && SC.snap(x, H.y, 'walk', 160)) || [x, H.y]; } }   /* 拉進畫面內 */
    const s0 = H.x < SC.def.w / 2 ? 1 : -1, side = i % 2 ? -s0 : s0, x0 = H.x + side * (120 + Math.floor(i / 2) * 70); let x = x0 < 60 || x0 > SC.def.w - 60 ? 2 * H.x - x0 : x0; const y = H.y + (i % 2 ? 16 : -12);
    for (let k = 0; k < 4 && G.NPC.some(o => o.name && o.x > -999 && Math.abs(o.x - x) < 44 && Math.abs(o.y - y) < 40); k++) x += (x >= H.x ? 1 : -1) * 64;   // r3.41.0：不和已站著的人疊在一起
    return (SC.snap && SC.snap(x, y, 'walk', 160)) || [x, y]; }
  function from(t) { const { vw } = SC.view ? SC.view() : { vw: 900 }, side = t[0] >= G.H.x ? 1 : -1, x = Math.max(30, Math.min(SC.def.w - 30, G.H.x + side * vw * 0.55));
    return (SC.snap && SC.snap(x, t[1], 'walk', 260)) || t; }
  const mapBoss = f => !!(f.boss && G.BOSS && G.BOSS.MAP && G.BOSS.MAP[SC.id] === f.boss);
  function enter(n, f, i) { const fb = mapBoss(f), t = spot(n, fb ? f : {}, i), p0 = fb ? t : from(t), sid = SC.id;
    const o = { name: n, stg: 1, sid, boss: fb };
    if (f.k === 'amb') { if (!G.AMB) return; G.AMB.add(f.u, t[0], t[1], { name: n, hold: true }).then(a => { if (!a) return; o.a = a; if (!ST.on.includes(o)) { G.AMB.remove(a); return; } a.alpha = 1; a.st = 'idle'; a.face = G.H.x < a.x ? -1 : 1; }); ST.on.push(o); return; }
    if (f.k === 'npc') { const a = o.a = { npc: f.npc, name: n, x: p0[0], y: p0[1], face: 1, walking: true, stg: 1 }; G.NPC.push(a); ST.on.push(o); let k = 0;
      const go = () => { if (!ST.on.includes(o) || SC.id !== sid) return; const dx = t[0] - a.x, dy = t[1] - a.y, d = Math.hypot(dx, dy); if (d < 6 || ++k > 220) { a.walking = false; return; } const s = Math.min(d, 4.2); if (k > 90) { a.x = t[0]; a.y = t[1]; } else { a.x += dx / d * s; a.y += dy / d * s; } a.face = Math.sign(dx) || a.face; requestAnimationFrame(go); }; go(); return; }
    const key = f.key && f.key(); if (!key) { ST.miss[n] = 1; return; }
    const a = o.a = { anim: key, hk: f.hk || 1, nat: f.nat || 1, name: n, x: p0[0], y: p0[1], face: -1 }; G.NPC.push(a); ST.on.push(o);
    Promise.resolve(A.load(key)).then(u => { if (!u || !u.act) return; a.u = u; if (f.k === 'pa' && G.PARTY && G.PARTY.DEF[f.id]) { const D = G.PARTY.DEF[f.id]; a.hk = D.ratio * (u.refH || 130) / (D.refH({ id: f.id }) || 130); }
      const idle = (f.cn && u.act[f.cn]) || u.act.idle || u.act[clipOf(u, /idle|stand|wait/)] || u.act[Object.keys(u.act)[0]], mv = u.act.run || u.act.walk || u.act[clipOf(u, /run|walk|step/)] || idle;   // r3.56.0：夥伴登場用和戰鬥相同的身高基準（原本用圖集 refH → 變大）
      if (fb) { a.clip = idle; return; } a.clip = mv; let k = 0; const go = () => { if (!ST.on.includes(o) || SC.id !== sid) return; const dx = t[0] - a.x, dy = t[1] - a.y, d = Math.hypot(dx, dy);
        if (d < 6 || ++k > 90) { a.x = t[0]; a.y = t[1]; a.clip = idle; return; } const s = Math.min(d, 5); a.x += dx / d * s; a.y += dy / d * s; requestAnimationFrame(go); }; go(); }, () => 0); }
  function leave(o) { ST.on = ST.on.filter(x => x !== o); if (!o.a) return; if (o.a.anim || o.a.npc) G.NPC = G.NPC.filter(x => x !== o.a); else if (G.AMB) G.AMB.remove(o.a); }   /* 借用的路人不會被移除（67_cast） */
  function speakers(list) { const s = []; for (const L of list || []) { if (L && L.choice) for (const c of L.choice) s.push(...speakers(c.then)); else if (L && L.who && !SKIP.has(L.who) && !s.includes(L.who)) s.push(L.who); } return s; }
  const st0 = G.DLG.start; G.DLG.start = function (list, done) {
    try { const ws = speakers(list); for (const o of ST.on.slice()) if (!ws.some(w => same(w, o.name)) || o.sid !== SC.id) leave(o);
      let i = ST.on.length; for (const n of ws) { if (ST.on.some(o => same(o.name, n)) || visible(n)) continue; const f = bossHere(n) || (G.CAST && G.CAST.unit(n)) || find(n); if (!f) { ST.miss[n] = 1; continue; } if (f.k === 'pa' && (f.id === 'shiro' || G.PARTY.list.some(m => m.id === f.id) || (G.PARTY.joined && G.PARTY.joined(f.id)))) continue; enter(n, f, i++); } }
    catch (e) { console.warn('stage', e); }
    return st0.call(this, list, function () { const r = done && done.apply(this, arguments); G.STORY.later(24, () => { if (!G.DLG.list) for (const o of ST.on.slice()) if (!o.boss) leave(o); }); return r; }); };
  const en0 = SC.enter; SC.enter = function () { for (const o of ST.on.slice()) leave(o); return en0.apply(this, arguments); };
  /* r3.27.0：頭目說完話留在原地，等真正的頭目出現才退場（避免「出現兩次」） */
  const ls0 = G.NPCLIFE.step; let tk = 0; G.NPCLIFE.step = function () { ls0(); if (++tk % 15 || !ST.on.length) return; const up = (G.BOSS && G.BOSS.enc) || G.E.some(e => e.boss && e.st !== 'dead' && e.hp > 0);
    for (const o of ST.on.slice()) if (o.boss && (up || o.sid !== SC.id)) leave(o); };
  ST.build = build; ST.find = n => (G.CAST && G.CAST.unit(n)) || find(n);
})();
