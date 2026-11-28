/* ==========================================================================
 * 神諭之地 重製版 — 99_partner6.js
 * Version : r3.213.0  (2026-11-28)　r3.213.0：役小角的前鬼後鬼換地圖時直接出現在身邊
 * 舊版    : r3.59.0  (2026-11-24)
 * 變更    : r3.59.0 新增。夥伴第二批強化：
 *           1. 裝備詞條：冷卻縮減（招式冷卻，上限 40%）、吸血（傷害量回自己）、移動速度 對夥伴生效（原本只有攻防血暴擊）。
 *           2. 夥伴版靈紋：夥伴裝備上的靈紋，命中類效果減半——落雷、燃燒、冰凍、感電、破甲；風刃／斬月／震地改成重擊時在目標處追加一擊。
 *              紙鶴／紙狐／紙人替身／護法童子／怒氣／鬥氣、套裝、三神器維持只給主角。
 *           3. 隱藏夥伴動作補完：役小角＝前鬼（赤）／後鬼（青）常駐跟隨，出招時現身出手；建御雷＝大連攜召喚雷神分身、指令時神影出劍；
 *              源賴光＝鎮惡門改用完整架勢（先斬 → 架勢 → 反擊 → 收刀），事件不再壓縮。
 *           4. 補血看得清楚：被補的人頭上大號綠字「＋N 汐音」、夥伴到目標的光帶、腳下綠環；持續回血時頭上出現回血圖示。
 *           5. 招式說明改由招式資料算出（傷害、補血、護擋、減傷、控制秒數、冷卻），隨招式等級變；技能樹分兩行顯示「目前」與「滿級」。
 *           6. 茨木童子的灼燒畫身上火苗（共用 88_rune 的 G.FLAMES）。
 *           ・效能：裝備詞條每 30 幀合計一次（快取），不在每次出傷時讀裝備。
 * 依賴    : 49_party、50_party_kit、51_party_grow、60_pkit2、75_partyup、88_rune（G.RUNE、G.FLAMES）、97_partner5、76_vfx。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, K = G.PKIT, H = G.H, SC = G.SC, A = G.ANIM, R = G.RPG; if (!PY || !K || !G.PEV) return;
  const ctx = G.ctx, TK = 1000 / 60, HH = () => G.HERO_H, S = y => SC.depth(y), alive = e => e && e.st !== 'dead' && e.hp > 0;
  const RU = G.RUNE || {};
  /* ======================= 1. 裝備詞條＋靈紋（每 30 幀合計） ======================= */
  const EQ = {};   // id → { cdr, ls, spd, rn: {id: lv} }
  function scanEq() { for (const id in PY.DEF) { const c = PY.data(id), o = { cdr: 0, ls: 0, spd: 0, rn: {} };
      for (const k in (c && c.eq) || {}) { const it = c.eq[k]; if (!it) continue; const st = R.itemStats(it); o.cdr += st.cdr || 0; o.ls += st.ls || 0; o.spd += st.spd || 0;
        if (RU.ensure) RU.ensure(it); if (it.rn) for (const [r, l] of it.rn) o.rn[r] = Math.max(o.rn[r] || 0, l); }
      EQ[id] = o; } }
  const eq = id => EQ[id] || { cdr: 0, ls: 0, spd: 0, rn: {} };
  const cd0 = PY.cdOf; PY.cdOf = (P, ch) => { const v = cd0(P, ch), r = Math.min(40, eq(P.id).cdr); return r > 0 ? Math.round(v * (1 - r / 100)) : v; };
  const SPD0 = {}; for (const id in PY.DEF) SPD0[id] = PY.DEF[id].spd;
  const LVM = [0, 1.0, 1.3, 1.7], rcd = {};
  const ready = (P, k, s) => { const key = P.id + k; if ((rcd[key] || 0) > G.t) return false; rcd[key] = G.t + Math.round(s * 60); return true; };
  const chest = e => e.y - HH() * (e.ratio || 1) * S(e.y) * 0.55;
  function rdmg(e, coef, P) { if (!alive(e)) return; G.damageOni(e, coef, false, false, { rune: 1, party: P, atk: PY.stats(P.id).atk, crit: 0, critD: 150 }); }
  function nearest(x, y, r, skip) { let b = null, bd = r; for (const e of G.E) { if (!alive(e) || e === skip) continue; const d = Math.hypot(e.x - x, (e.y - y) * 1.6); if (d < bd) { bd = d; b = e; } } return b; }
  function partnerRunes(P, e, big) { const rn = eq(P.id).rn, VX = G.VX || {}; if (!Object.keys(rn).length) return;
    const L = k => LVM[rn[k] || 1] * 0.5;
    if (rn.rai && Math.random() < 0.12 && ready(P, 'rai', 1)) { VX.bolt && VX.bolt({ x0: e.x, y0: chest(e) - HH() * 2.2, x1: e.x, y1: chest(e), col: '207,224,255', life: 12 }); rdmg(e, 1.5 * L('rai'), P);
      const n = nearest(e.x, e.y, HH() * 2.5, e); if (n) { VX.bolt && VX.bolt({ x0: e.x, y0: chest(e), x1: n.x, y1: chest(n), col: '207,224,255', life: 10 }); rdmg(n, 0.6 * L('rai'), P); } }
    if (rn.en && Math.random() < 0.1 && RU.burn) RU.burn(e);
    if (rn.hyo && Math.random() < 0.5 && RU.frost) RU.frost(e);
    if (rn.den && Math.random() < 0.08 && RU.shock) RU.shock(e);
    if (rn.ha && big && RU.armor) RU.armor(e);
    const fin = big && ['kaze', 'zan', 'shin'].find(k => rn[k]); if (fin && ready(P, fin, 3)) { const col = { kaze: '170,255,225', zan: '255,240,192', shin: '235,200,140' }[fin];
      VX.ring && VX.ring({ x: e.x, y: e.y, r1: 1.4, life: 16, col, lw: 0.1 }); if (fin === 'shin') { VX.crack && VX.crack({ x: e.x, y: e.y, r: 0.9 }); for (const q of G.E) if (alive(q) && Math.hypot(q.x - e.x, (q.y - e.y) * 1.6) < HH() * 1.2) rdmg(q, 0.7 * L('shin') * 2, P); }
      else rdmg(e, (fin === 'zan' ? 0.8 : 0.6) * L(fin) * 2, P); } }
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const P = opt && opt.party && !opt.rune ? opt.party : null, h0 = e && e.hp;
    const r = do0.apply(this, arguments);
    if (P && P.id && e && e.hp < h0) { const ls = eq(P.id).ls; if (ls > 0 && P.hp > 0) P.hp = Math.min(P.hpMax, P.hp + (h0 - Math.max(0, e.hp)) * ls / 100);
      try { partnerRunes(P, e, big); } catch (x) { console.warn('p rune', x); } }
    return r; };
  if (G.RUNE && !RU.burn) console.warn('99_partner6：88_rune 沒有匯出 burn／frost（靈紋夥伴版的狀態類會略過）');
  /* ======================= 2. 隱藏夥伴動作 ======================= */
  const SUM = [];   // { P, u, k, x, y, t, dur, a, face, after }
  const unitOf = P => A.get(PY.DEF[P.id].unit(P));
  const scaleOf = P => HH() * PY.DEF[P.id].ratio * S(P.y) / PY.DEF[P.id].refH(P);
  function sumPlay(P, clip, o) { const u = unitOf(P), r = u && u.act[clip]; if (!r) return null; const s = Object.assign({ P, u, clip, r, t: 0, dur: A.dur(r), face: P.face, a: 1 }, o || {}); SUM.push(s); return s; }
  /* 役小角：前鬼／後鬼常駐 */
  const SK = {};   // enno 的式神狀態
  function shiki(P) { let o = SK[P.id]; if (!o) o = SK[P.id] = { aka: { x: P.x, y: P.y, st: 'manifest', t: 0 }, ao: { x: P.x, y: P.y, st: 'manifest', t: 0 } }; return o; }
  function shikiStep(P) { const o = shiki(P), f = P.face || 1, hh = HH() * S(P.y);
    const goal = { aka: [P.x - f * hh * 0.55, P.y + 8], ao: [P.x - f * hh * 0.2, P.y - 4] };
    /* r3.213.0：換地圖（或被傳送拉開很遠）時，前鬼後鬼直接出現在役小角身邊，跟夥伴一樣；原本留在舊座標再慢慢滑過來，看起來像從遠處跑來 */
    const far = o.sid !== G.SC.id; o.sid = G.SC.id;
    for (const k of ['aka', 'ao']) { const s = o[k]; s.t += TK; if (far || Math.hypot(goal[k][0] - s.x, goal[k][1] - s.y) > hh * 3.5) { s.x = goal[k][0]; s.y = goal[k][1]; if (s.st !== 'idle') { s.st = 'idle'; s.t = 0; } }
      if (s.st === 'strike' || s.st === 'away') { if (s.t > 720) { s.st = 'manifest'; s.t = 0; s.x = goal[k][0]; s.y = goal[k][1]; } continue; }
      if (s.st === 'manifest' && s.t > 720) { s.st = 'idle'; s.t = 0; }
      s.x += (goal[k][0] - s.x) * 0.12; s.y += (goal[k][1] - s.y) * 0.12; s.face = f; } }
  function shikiDraw(P) { const u = unitOf(P); if (!u) return; const o = shiki(P), sc = scaleOf(P);
    for (const k of ['ao', 'aka']) { const s = o[k]; if (s.st === 'away') continue;
      const clip = s.st === 'strike' ? (k === 'aka' ? 'enno_aka_strike' : 'enno_ao_wing_guard') : s.st === 'manifest' ? 'enno_' + k + '_manifest' : (k === 'aka' ? 'enno_aka_bound' : 'enno_ao_glide');
      const r = u.act[clip]; if (!r) continue; const loop = s.st === 'idle', fr = A.frameAt(Object.assign({}, r, { loop }), s.st === 'idle' ? (G.t * TK + (k === 'ao' ? 300 : 0)) : s.t);
      const fly = k === 'ao' ? -HH() * S(s.y) * (0.55 + 0.06 * Math.sin(G.t * 0.06)) : 0;
      ctx.save(); ctx.fillStyle = 'rgba(20,10,20,.22)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 14 * sc * 1.2, 4 * sc * 1.2, 0, 0, 6.283); ctx.fill(); ctx.restore();
      A.draw(u, fr, s.x, s.y + fly, sc * (k === 'ao' ? 0.95 : 1.05) * (fr[8] || 1), (s.face || 1) < 0, 1); } }
  function shikiAct(P, ev, c) { const o = shiki(P), e = alive(c && c.tg) ? c.tg : P.tg;
    if (ev.k === 'proj') { o.ao.st = 'away'; o.ao.t = 0; return; }   // 後鬼化成投射物飛出去（投射圖就是後鬼滑翔）
    if (ev.k === 'hit' && e) { const s = o.aka; s.st = 'strike'; s.t = 0; s.x = e.x - Math.sign(e.x - P.x || 1) * HH() * 0.4; s.y = e.y + 2; s.face = Math.sign(e.x - s.x) || 1;
      G.VX && G.VX.ring && G.VX.ring({ x: s.x, y: s.y, r1: 0.9, life: 14, col: '255,120,90', lw: 0.08 }); }
    if ((ev.k === 'armor' || ev.k === 'zone') && o.ao.st !== 'away') { o.ao.st = 'strike'; o.ao.t = 0; } }
  /* 建御雷：神影 */
  function godAct(P, c) { if (!c || c.ch === 'ordinary' || c._god) return; c._god = 1; const big = c.ch === 'grandCombo';
    const s = sumPlay(P, big ? 'takemikazuchi_god_ultimate' : c.ch === 'command' ? 'takemikazuchi_god_attack' : null, { god: 1, a: 0.88 }); if (!s) return;
    if (big) G.VX && G.VX.flash && G.VX.flash(2);
    s.after = () => sumPlay(P, 'takemikazuchi_god_dismiss', { god: 1, a: 0.8 }); }
  /* 源賴光：鎮惡門＝先斬 → 架勢 → 反擊 → 收刀 */
  const YB6 = K.yorimitsu && K.yorimitsu.B6;
  if (YB6) { YB6.noFit = 1; YB6.ev.push({ k: 'pose', t: 3000 }); YB6.ev.sort((a, b) => a.t - b.t); }
  function yoriStep(P) { const c = P.cur; if (!c || c.sid !== 'B6') return; const u = unitOf(P); if (!u) return; const X = u.act;
    const main = X.yorimitsu_R13, hold = X.yorimitsu_R13_hold, ctr = X.yorimitsu_R13_counter, ex = X.yorimitsu_R13_exit; if (!main || !hold || !ctr) return;
    const d1 = A.dur(main);
    if (c.t < d1) return;
    if (c.t < 2000) { if (P.r !== hold) { P.r = hold; P.ms = 0; P.loop = true; } return; }
    if (c.t < 2000 + A.dur(ctr)) { if (P.r !== ctr) { P.r = ctr; P.ms = 0; P.loop = false; } return; }
    if (ex && P.r !== ex) { P.r = ex; P.ms = 0; P.loop = false; } }
  /* ======================= 3. 補血看得清楚 ======================= */
  const FL = [];   // 浮字
  function healFx(P, o, amt) { const VX = G.VX || {}, y = o.y - HH() * S(o.y) * ((o === H ? 1 : PY.DEF[o.id] ? PY.DEF[o.id].ratio : 1)) - 14;
    FL.push({ x: o.x, y, v: '+' + Math.round(amt), who: PY.DEF[P.id] ? PY.DEF[P.id].name : '', t: 0 });
    VX.ring && VX.ring({ x: o.x, y: o.y, r1: 1.2, life: 22, col: '120,255,150', lw: 0.1 });
    if (o !== P) { const x0 = P.x, y0 = P.y - HH() * S(P.y) * 0.6, x1 = o.x, y1 = o.y - HH() * S(o.y) * 0.6;
      VX.custom && VX.custom((q, g) => { const a = 1 - q.t / q.life; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(140,255,170,' + a * 0.7 + ')'; g.lineWidth = 4 * a + 1;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 40, x1, y1); g.stroke(); g.restore(); }, 20, 'o'); }
    o.healGlow = 24; }
  function drawFloat() { for (let i = FL.length - 1; i >= 0; i--) { const f = FL[i]; f.t++; if (f.t > 70) { FL.splice(i, 1); continue; }
      const a = Math.min(1, (70 - f.t) / 20), y = f.y - f.t * 0.5, sc = f.t < 8 ? 1 + (8 - f.t) * 0.06 : 1; ctx.save(); ctx.globalAlpha = a; ctx.translate(f.x, y); ctx.scale(sc, sc);
      ctx.font = `900 ${20 * G.FS()}px ${G.FONT_S}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,40,20,.9)'; ctx.strokeText(f.v, 0, 0); ctx.fillStyle = '#8dff9a'; ctx.fillText(f.v, 0, 0);
      if (f.who) { ctx.font = `700 ${10 * G.FS()}px ${G.FONT}`; ctx.lineWidth = 3; ctx.strokeText(f.who, 0, 15); ctx.fillStyle = '#d8ffd8'; ctx.fillText(f.who, 0, 15); } ctx.restore(); } }
  function drawRegen() { const L = new Set(); for (const r of PY.regen || []) for (const o of r.L) L.add(o);
    for (const o of L) { const y = o.y - HH() * S(o.y) * (o === H ? 1.18 : (PY.DEF[o.id] ? PY.DEF[o.id].ratio * 1.18 : 1.18)) - 12, a = 0.6 + 0.3 * Math.sin(G.t * 0.12);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#3fbf5a'; ctx.beginPath(); ctx.arc(o.x, y, 7, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(o.x - 4, y - 1.2, 8, 2.4); ctx.fillRect(o.x - 1.2, y - 4, 2.4, 8); ctx.restore(); }
    for (const o of [H].concat(PY.list)) if (o.healGlow > 0) { o.healGlow--; const a = o.healGlow / 24, hh = HH() * S(o.y) * (o === H ? 1 : (PY.DEF[o.id] || { ratio: 1 }).ratio);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, o.y, 0, o.y - hh * 1.2); g.addColorStop(0, 'rgba(120,255,150,' + 0.35 * a + ')'); g.addColorStop(1, 'rgba(120,255,150,0)');
      ctx.fillStyle = g; ctx.fillRect(o.x - hh * 0.3, o.y - hh * 1.2, hh * 0.6, hh * 1.2); ctx.restore(); } }
  /* ======================= 4. 事件外層（放在 97_partner5 之後） ======================= */
  const run2 = G.PEV.run.bind(G.PEV);
  G.PEV.run = function (P, ev, c) {
    if (ev.k === 'pose') return;
    if (ev.k === 'heal') { const T = [H].concat(PY.list), h0 = T.map(o => o.hp), n0 = G.NUMS.length; const r = run2(P, ev, c);
      let any = 0; T.forEach((o, i) => { const d = o.hp - h0[i]; if (d > 0) { any = 1; healFx(P, o, d); } }); if (any) G.NUMS.splice(n0, G.NUMS.length - n0);   // 用大字取代小字
      return r; }
    const r = run2(P, ev, c);
    try { if (P.id === 'enno') shikiAct(P, ev, c); } catch (x) { console.warn('hid', x); }
    return r; };
  /* 持續回血的跳字也改大字（每秒一次） */
  const cast0 = PY.cast; PY.cast = function (P, ch) { const ok = cast0.apply(this, arguments); if (ok && P.id === 'takemikazuchi' && P.cur) try { godAct(P, P.cur); } catch (x) {} return ok; };   // 出招當下就現神影
  /* ======================= 5. 招式說明（由資料算出） ======================= */
  const CHN = { autonomous: '自主', command: '指令', smallCombo: '小連攜', grandCombo: '大連攜', ordinary: '普攻' };
  const f1 = v => (Math.round(v * 10) / 10).toString();
  PY.descOf = function (id, sid, L) { const kit = K[id], sk = kit && kit[sid]; if (!sk) return ''; L = Math.max(1, Math.min(5, L || 1));
    const on5 = L >= 5, out = [], dm = 1 + 0.15 * (L - 1), hm = 1 + 0.2 * (L - 1), dl = 1 + 0.15 * (L - 1), du = 1 + 0.1 * (L - 1); let m = 0, n = 0; const heals = [];
    let rUp = 0, kbUp = 0, gp = 0, ctr = 0, mx = 0, guard = 0, dr = 0, dur = 0, stun = 0, root = 0, slowT = 0, burn = 0, kb = 0, pierce = 0, ign = 0, fc = 0, armor = 0, spd = 0, extra = 0, all = 0, cleanse = 0, taunt = 0;
    for (let e of sk.ev) { if (e.l5only && !on5) continue; if (e.l5only) extra++; if (on5 && (e.l5 || e.l5k || e.lv5n)) { const o = Object.assign({}, e, e.l5 || {}); if (e.lv5n) o.n = e.lv5n; if (e.l5 && e.l5.r && e.r) rUp = Math.max(rUp, e.l5.r / e.r - 1); if (e.l5 && e.l5.kb && e.kb) kbUp = 1; if (e.l5k) for (const k in e.l5k) o[k] = (e[k] || 0) * e.l5k[k]; e = o; }
      if (e.k === 'hit' || e.k === 'proj') { const t = e.lv5x && on5 ? 2 : 1; m += e.m * t; n += t; }
      else if (e.k === 'zone' && e.m) { m += e.m; n++; }
      if (e.k === 'heal') { heals.push(e.pct * hm); if (e.all) all = 1; }
      if (e.k === 'guard') { guard += (e.n || 1) + (L >= 4 ? 1 : 0); if (e.proj) gp = 1; if (e.ctr) ctr = 1; }
      if (e.k === 'self' || (e.k === 'zone' && e.dr)) { dr = Math.max(dr, Math.min(0.7, e.dr * dl)); dur = Math.max(dur, e.dur * du); }
      if (e.k === 'zone' && !e.dr && e.dur > 1) dur = Math.max(dur, e.dur);
      if (e.stun) stun = Math.max(stun, e.stun); if (e.root) root = Math.max(root, e.root); if (e.slowT || e.slow) slowT = Math.max(slowT, e.slowT || (e.k === 'zone' ? e.dur : 2));
      if ((e.k === 'zone' && e.max) || ((e.k === 'hit' || e.k === 'proj') && (e.n || 0) > 1)) mx = Math.max(mx, e.max || e.n); if (e.pierce) mx = Math.max(mx, e.pierce + 1);
      if (e.burn) burn = Math.max(burn, e.burn); if (e.kb) kb = Math.max(kb, e.kb); if (e.pierce) pierce = Math.max(pierce, e.pierce); if (e.ign) ign = Math.max(ign, e.ign); if (e.fc) fc = 1;
      if (e.k === 'armor') armor = Math.max(armor, e.dur); if (e.spd || e.z === 'haste') spd = Math.max(spd, e.spd || 10); if (e.k === 'cleanse') cleanse = 1; if (e.k === 'taunt') taunt = e.max || 3; }
    if (m) out.push('傷害 ' + Math.round(m * dm * 100) + '%' + (n > 1 ? '（' + n + ' 段）' : ''));
    if (heals.length) out.push((all ? '全隊' : '最傷者') + '回復 ' + heals.map(v => f1(v) + '%').join('＋'));
    if (guard) out.push((gp ? '投射' : '') + '護擋 ' + guard + ' 次' + (ctr ? '・擋下後反撞 120%' : '')); if (dr) out.push('減傷 ' + Math.round(dr * 100) + '%' + (dur ? ' ' + f1(dur) + ' 秒' : '')); else if (dur) out.push('持續 ' + f1(dur) + ' 秒');
    if (stun) out.push('失衡 ' + f1(stun / 60) + ' 秒'); if (root) out.push('束縛 ' + f1(root / 60) + ' 秒'); if (slowT) out.push('緩速 ' + f1(slowT) + ' 秒');
    if (burn) out.push('灼燒 ' + burn + ' 次'); if (kb) out.push(kbUp ? '推退加倍' : '推退'); if (rUp) out.push('範圍 +' + Math.round(rUp * 100) + '%'); if (pierce) out.push('穿透 ' + pierce); if (ign) out.push('無視防禦 ' + ign + '%'); if (fc) out.push('必暴擊');
    if (armor) out.push('主角抗硬直 ' + f1(armor) + ' 秒'); if (spd) out.push('移速 +' + spd + '%'); if (cleanse) out.push('淨化'); if (taunt) out.push('嘲諷 ' + taunt + ' 隻');
    if (mx > 1) out.push('最多 ' + mx + ' 隻'); if (extra) out.push('追加 ' + extra + ' 段');
    const ch = PY.TREE[id] && PY.TREE[id].n[sid] ? PY.TREE[id].n[sid].ch : sid;   // 實際冷卻：招式秒數 × 75_partyup（自主／指令 ×0.5、小連攜 ×0.75）× 滿級 × 裝備冷卻縮減
    if (sk.cd || ch === 'autonomous' || ch === 'command' || ch === 'smallCombo') { let cd = (sk.cd || { autonomous: 12, command: 21, smallCombo: 8 }[ch]) * (ch === 'smallCombo' ? 0.75 : ch === 'grandCombo' ? 1 : 0.5);
      if (G.P5 && G.P5.CDK && G.P5.CDK[id] && G.P5.CDK[id][sid] && on5) cd *= G.P5.CDK[id][sid]; cd *= 1 - Math.min(40, eq(id).cdr) / 100; if (ch !== 'grandCombo') out.push('冷卻 ' + f1(cd) + ' 秒'); }
    return out.join('・'); };
  const mt0 = PY.moveText; PY.moveText = (id, ch) => { const k = PY.variant ? PY.variant(id, ch) : ch, sk = K[id] && (K[id][k] || K[id][ch]); if (!sk) return mt0 ? mt0(id, ch) : '';
    const P = PY.list.find(q => q.id === id) || { id }, L = PY.skLv ? PY.skLv(P, ch) : 1; return sk.name + '（' + (CHN[ch] || '') + ' Lv' + L + '）：' + PY.descOf(id, K[id][k] ? k : ch, L); };
  PY.nodeText = (id, k) => { const nd = PY.TREE[id].n[k], L = PY.nodeLv(id, k); if (nd.ch === 'p') return [nd.d + (L ? '　目前 Lv' + L : ''), ''];
    return ['Lv' + Math.max(1, L) + '：' + PY.descOf(id, k, Math.max(1, L)), '滿級（' + (nd.d5 || '').replace(/^滿級：/, '') + '）：' + PY.descOf(id, k, 5)]; };
  /* ======================= 6. 掛勾 ======================= */
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++;
    if (tk % 30 === 1) { try { scanEq(); } catch (x) { console.warn('eq', x); } for (const id in PY.DEF) PY.DEF[id].spd = SPD0[id] * (1 + Math.min(30, eq(id).spd) / 100); }
    for (const P of PY.list) { if (P.id === 'enno') shikiStep(P); if (P.id === 'yorimitsu') yoriStep(P); }
    for (let i = SUM.length - 1; i >= 0; i--) { const s = SUM[i]; s.t += TK; if (s.t >= s.dur) { SUM.splice(i, 1); if (s.after) s.after(); } } };
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments);
    try { for (const P of PY.list) { if (P.id === 'enno' && P.st !== 'down') shikiDraw(P); }
      for (const s of SUM) { const P = s.P, sc = scaleOf(P), fr = A.frameAt(s.r, s.t); const y = s.god ? P.y - HH() * S(P.y) * PY.DEF[P.id].ratio * 0.72 : P.y;
        ctx.save(); ctx.shadowColor = 'rgba(255,230,140,.9)'; ctx.shadowBlur = 14; A.draw(s.u, fr, P.x - (P.face || 1) * HH() * 0.55, y - HH() * 0.15, sc * 1.3 * (fr[8] || 1), (P.face || 1) < 0, s.a * 0.82); ctx.restore(); }
      for (const e of G.E) if (e.burn && alive(e) && !(e.st2 && e.st2.bnT > 0) && G.FLAMES) G.FLAMES(e, e.burn.n > 2 ? 3 : 2);
      drawRegen(); drawFloat(); } catch (x) { console.warn('p6 draw', x); }
    return r; };
  G.P6 = { EQ, scanEq, SUM, SK, FL };
})();
