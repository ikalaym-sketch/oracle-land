/* ==========================================================================
 * 神諭之地 重製版 — 45_boss_mini.js
 * Version : r3.36.1  （r3.36.1：天空四聖獸放大 2.2～2.6 倍、招式範圍 ×1.5；r3.20.3：小頭目／隱藏王預兆延長 35%）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。副本小頭目共用招式模板＋10 隻小頭目（兩兩一組）＋晴明召喚用的頭目分身。
 *           ‧ 模板：前方弧（arc）／周身圈（ring）／直線（lane，可帶突進）／落點（drop，可連落）／扇形多線（fan）／換位（shift）／架盾後震擊（guard）。
 *           ‧ 每隻 2 個專屬招＋無間招（無間難度、血量 50% 以下：專屬招三連發→破勢 2.5 秒），沒有階段變化。
 *           ‧ 兩隻同場時錯開出手（夥伴出招中就先移動）。血量＝同等級小怪 ×5，攻擊 ×1.3。
 *           ‧ 地圖：富士山 D_FUJI_02 弁慶＋伊勢義盛／D_FUJI_03 龜井重清＋常陸坊海尊；天空浮島 D_SKY_02 白虎＋朱雀／D_SKY_03 青龍＋玄武；
 *             出雲大社 D_IZUMO_03 前鬼＋後鬼。
 *           ‧ G.BOSS.MINI.helper()：晴明隨機召喚的頭目分身（鬼王／前鬼＋後鬼／白九尾）也用同一套模板。
 * 依賴    : 26_boss（G.BOSS.reg、actor 各自 unit、api）、03_actors（hurtHero）。圖集 b_mb_*、b_oni、b_kyubi。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, fx, lane, circle, inLane, hit, walkTo, dashEnd, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const toward = e => { e.face = sgn(H.x - e.x) || e.face; };
  function knock(e, px) { for (let i = 0; i < 6; i++) { const nx = H.x + sgn(H.x - e.x) * px / 6; if (SC.walkable(nx, H.y)) H.x = nx; } }
  /* 招式表：t＝類型、c＝動作片段、r＝範圍（身高倍）、at＝預兆秒、m＝倍率、f＝特效、n＝連發、len＝直線長、dash＝突進、kb＝擊退 */
  const DEF = {
    benkei: { u: 'b_mb_benkei', size: 1.4, walk: 'walk', range: 1.6, moves: [{ t: 'arc', c: 'sweep', r: 1.6, at: 0.7, m: 1.2, f: 'benkei_sweep_arc', kb: 0.8 }, { t: 'ring', c: 'stamp', r: 2.0, at: 0.8, m: 1.1, f: 'benkei_stamp_dust' }, { t: 'guard', c: 'vow', r: 2.0, at: 1.6, m: 1.3, f: 'benkei_vow_pressure' }] },
    ise_yoshimori: { u: 'b_mb_ise', size: 1.1, walk: 'walk', range: 4.0, moves: [{ t: 'lane', c: 'aim', c2: 'shot_first', len: 7, w: 0.7, at: 0.8, m: 1.0, f: 'ise_yoshimori_arrow_trail', n: 2, gap: 0.5, proj: 'ise_yoshimori_arrow' }, { t: 'shift', c: 'sidestep', f: 'ise_yoshimori_sidestep_wind' }] },
    kamei_shigekiyo: { u: 'b_mb_kamei', size: 1.15, walk: 'walk', range: 1.5, moves: [{ t: 'lane', c: 'downslash', len: 2.8, w: 0.9, at: 0.6, m: 1.2, f: 'kamei_shigekiyo_downslash_streak', dash: 1 }, { t: 'ring', c: 'returncut', r: 1.6, at: 0.7, m: 1.1, f: 'kamei_shigekiyo_return_arc' }, { t: 'arc', c: 'turncut', r: 1.5, at: 0.6, m: 1.0, f: 'kamei_shigekiyo_turn_arc' }] },
    hitachibo_kaison: { u: 'b_mb_kaison', size: 1.1, walk: 'walk', range: 3.2, moves: [{ t: 'drop', c: 'staff_tap', r: 1.0, at: 0.9, m: 0.9, f: 'hitachibo_kaison_ring_cue', n: 3, gap: 0.45 }, { t: 'lane', c: 'echo', len: 6, w: 0.9, at: 0.9, m: 1.0, f: 'hitachibo_kaison_old_trace' }, { t: 'ring', c: 'seal', r: 1.8, at: 0.8, m: 0.9, f: 'hitachibo_kaison_dream_release' }] },
    byakko: { u: 'b_mb_byakko', size: 1.35, walk: 'walk', range: 1.8, moves: [{ t: 'drop', c: 'pounce', r: 1.2, at: 0.8, m: 1.2, f: 'byakko_landing_dust', jump: 1 }, { t: 'lane', c: 'rush', len: 4.5, w: 1.0, at: 0.6, m: 1.1, f: 'byakko_rush_streak', dash: 1 }, { t: 'arc', c: 'turn_claw', r: 1.5, at: 0.55, m: 1.0, f: 'byakko_claw_arc' }] },
    suzaku: { u: 'b_mb_suzaku', size: 1.3, walk: 'step', range: 3.0, moves: [{ t: 'lane', c: 'skim', len: 5, w: 1.0, at: 0.7, m: 1.1, f: 'suzaku_skim_trail', dash: 1 }, { t: 'fan', c: 'feather_cast', len: 6, w: 0.6, at: 0.8, m: 0.9, f: 'suzaku_feather_fire', n: 3 }, { t: 'ring', c: 'flare', r: 1.8, at: 0.7, m: 1.0, f: 'suzaku_ember_release' }] },
    seiryu: { u: 'b_mb_seiryu', size: 1.4, walk: 'coil_step', range: 2.4, moves: [{ t: 'lane', c: 'dragon_lance', len: 6, w: 1.0, at: 0.8, m: 1.2, f: 'seiryu_lance_wake', dash: 1 }, { t: 'arc', c: 'tail_wave', r: 1.8, at: 0.65, m: 1.0, f: 'seiryu_tail_arc', kb: 0.6 }, { t: 'ring', c: 'coil_release', r: 2.0, at: 0.8, m: 1.0, f: 'seiryu_coil_wave' }] },
    genbu: { u: 'b_mb_genbu', size: 1.45, walk: 'step', range: 1.8, moves: [{ t: 'ring', c: 'stomp', r: 2.1, at: 0.85, m: 1.2, f: 'genbu_stomp_wave' }, { t: 'lane', c: 'serpent_strike', len: 3.4, w: 0.9, at: 0.6, m: 1.0, f: 'genbu_serpent_arc' }, { t: 'guard', c: 'brace', r: 2.2, at: 1.6, m: 1.1, f: 'genbu_ward_wave' }] },
    zenki: { u: 'b_mb_zenki', size: 1.35, walk: 'walk', range: 1.6, moves: [{ t: 'arc', c: 'cleave', r: 1.5, at: 0.75, m: 1.3, f: 'zenki_cleave_slash' }, { t: 'lane', c: 'rush', len: 3.6, w: 1.0, at: 0.6, m: 1.1, f: 'zenki_rush_dust', dash: 1 }, { t: 'guard', c: 'guard', r: 1.8, at: 1.4, m: 1.1, f: 'zenki_stone_release' }] },
    goki: { u: 'b_mb_goki', size: 1.25, walk: 'step', range: 3.0, moves: [{ t: 'lane', c: 'pour', len: 5.5, w: 1.0, at: 0.8, m: 1.0, f: 'goki_water_line' }, { t: 'drop', c: 'flow', r: 1.1, at: 0.9, m: 0.9, f: 'goki_pour_arc', n: 2, gap: 0.5 }, { t: 'ring', c: 'seal', r: 1.7, at: 0.75, m: 0.9, f: 'goki_vessel_cue' }] },
    oniking: { u: 'b_oni', size: 1.5, walk: 'walk', range: 1.9, moves: [{ t: 'arc', c: 'sweep', r: 1.9, at: 0.75, m: 1.3, f: 'oniking_sweep_wake', kb: 0.8 }, { t: 'ring', c: 'slam', r: 2.0, at: 0.85, m: 1.3, f: 'oniking_ground_impact' }, { t: 'ring', c: 'roar', r: 2.4, at: 0.7, m: 0.9, f: 'oniking_roar_wave', kb: 1.2 }] },
    kyubi: { u: 'b_kyubi', size: 1.25, walk: 'run', range: 2.6, tails: 9, moves: [{ t: 'arc', c: 'whip', r: 1.6, at: 0.6, m: 1.1, f: 'kyubi_whip_arc' }, { t: 'drop', c: 'cast', r: 1.0, at: 0.8, m: 0.9, f: 'kyubi_fox_fire', n: 3, gap: 0.35 }, { t: 'lane', c: 'beam', len: 6, w: 0.9, at: 0.8, m: 1.1, f: 'kyubi_whip_arc' }] }
  };
  /* r3.36.1：天空浮島四聖獸放大（主角的 2.2～2.6 倍，才有神獸的份量）；招式範圍、突進距離 ×1.5，線寬 ×1.25，跟體型相稱。血量、傷害不變。 */
  for (const [k, sz] of [['byakko', 2.2], ['suzaku', 2.4], ['seiryu', 2.6], ['genbu', 2.4]]) { const d = DEF[k]; d.size = sz; d.range *= 1.5; for (const mv of d.moves) { if (mv.r) mv.r *= 1.5; if (mv.len) mv.len *= 1.5; if (mv.w) mv.w *= 1.25; } }
  const fxw = (e, n) => { const u = A.get(e.unit), r = u && u.act[n]; return r ? r.f[Math.min(1, r.f.length - 1)][2] : 200; };
  const fxAt = (e, n, x, y, w) => { if (n) fx(e, n, x, y, { s: w / fxw(e, n), nat: 1 }); };
  /* 單一招式（m.s＝招式表項目） */
  const MV = {
    mini: { go(e, m) { const s = m.s; toward(e); m.at = S(s.at * 1.35);   /* r3.20.3：預兆延長 35%，留閃避時間 */ m.n = s.n || 1; m.i = 0; m.t0 = 0; play(e, idleN(e), true); prep(e, m, s); },
      step(e, m) { const s = m.s, k = m.t - m.t0;
        if (s.t === 'counter') { if (m.cnt && !m.fired) { m.fired = m.t; e.guard = 0; toward(e); play(e, s.c2 || s.c); circle(e.x, e.y, HH() * s.r, S(0.25), '250,210,90'); G.UI.toast('被看穿了——反擊！'); }
          if (m.fired) { if (m.t === m.fired + S(0.25)) { fxAt(e, s.f, e.x, e.y - HH() * 0.3, HH() * s.r * 2); if (near(e.x, e.y, HH() * s.r)) hit(e, s.m); } return m.t > m.fired + S(0.8); }
          if (k === 1) play(e, s.c); if (k >= m.at) { e.guard = 0; e.open = S(s.post || 0.8); play(e, idleN(e), true); return true; } return false; }
        if (k === Math.max(1, m.at - S(0.35))) play(e, m.i && s.c2 ? s.c2 : s.c);
        if (m.dash && k > m.at && k <= m.at + S(0.18)) { const q = (k - m.at) / S(0.18); e.x = m.x0 + (m.end[0] - m.x0) * q; e.y = m.y0 + (m.end[1] - m.y0) * q; }
        if (m.jump && k <= m.at) { const q = k / m.at; e.x = m.x0 + (m.tx - m.x0) * q; e.y = m.y0 + (m.ty - m.y0) * q; e.lift = Math.sin(q * Math.PI) * HH() * 0.9; }
        if (k === m.at) { e.lift = 0; resolve(e, m, s); if (s.t === 'guard') e.shield = 0; if (s.post && m.i + 1 >= m.n) e.open = S(s.post); }
        if (m.i + 1 < m.n && k === m.at + S(s.gap || 0.4)) { m.i++; m.t0 = m.t; prep(e, m, s); return false; }
        return m.i + 1 >= m.n && k > m.at + S(0.55); },
      stop(e) { e.lift = 0; e.shield = 0; e.guard = 0; } },
    mugen: { go(e, m) { m.q = (e.md.mugen || [0, 1, 0]).map(i => e.md.moves[i]); m.j = 0; G.UI.toast(e.name + '　無間'); beginSub(e, m); },
      step(e, m) { const sm = m.sub; sm.t++; if (MV.mini.step(e, sm)) { if (++m.j < m.q.length) beginSub(e, m); else if (!m.br) { m.br = m.t; play(e, e.md.brk || 'break'); e.open = S(2.5); } }
        return m.br && m.t - m.br > S(0.6); },
      stop(e) { e.lift = 0; e.shield = 0; } }
  };
  function beginSub(e, m) { m.sub = { k: 'mini', t: 0, s: Object.assign({}, m.q[m.j], { at: m.q[m.j].at * 0.75 }) }; MV.mini.go(e, m.sub); }
  const idleN = e => e.md && e.md.idleN ? e.md.idleN(e) : 'idle', walkN = e => e.md.walkN ? e.md.walkN(e) : e.md.walk;
  function prep(e, m, s) { const a = Math.atan2((H.y - e.y) * 1.6, H.x - e.x), Lr = HH() * (s.len || 0);
    if (s.tf && !m.i) fxAt(e, s.tf, e.x, e.y - HH() * e.size * 0.55, HH() * e.size * 1.8);
    if (s.t === 'counter') { e.guard = 1; m.at = S(s.at * 1.35);   /* r3.20.3：預兆延長 35%，留閃避時間 */ circle(e.x, e.y, HH() * 0.8, m.at, '250,210,90'); return; }
    if (s.t === 'cross') { const h = Lr / 2; m.Ls = [[H.x - h, H.y - h / 1.6, H.x + h, H.y + h / 1.6], [H.x - h, H.y + h / 1.6, H.x + h, H.y - h / 1.6]]; for (const L of m.Ls) lane(...L, HH() * s.w, m.at); return; }
    if (s.t === 'arc') { m.cx = e.x + e.face * HH() * e.size * 0.6; m.cy = e.y; circle(m.cx, m.cy, HH() * s.r, m.at); }
    else if (s.t === 'ring' || s.t === 'guard') { circle(e.x, e.y, HH() * s.r, m.at, s.t === 'guard' ? '230,200,90' : undefined); if (s.t === 'guard') { e.shield = 0.6; G.UI.toast(e.name + '架勢——減傷'); } }
    else if (s.t === 'lane') { if (!(s.same && m.L)) m.L = [e.x, e.y, e.x + Math.cos(a) * Lr, e.y + Math.sin(a) * Lr / 1.6]; lane(...m.L, HH() * s.w, m.at, s.proj ? '230,220,140' : undefined);
      if (s.dash) { m.dash = 1; m.x0 = e.x; m.y0 = e.y; const d = Math.hypot(m.L[2] - e.x, m.L[3] - e.y) || 1; m.end = dashEnd(e.x, e.y, (m.L[2] - e.x) / d, (m.L[3] - e.y) / d, Lr * 0.75); } }
    else if (s.t === 'fan') { m.Ls = [-0.35, 0, 0.35].map(o => [e.x, e.y, e.x + Math.cos(a + o) * Lr, e.y + Math.sin(a + o) * Lr / 1.6]); for (const L of m.Ls) lane(...L, HH() * s.w, m.at); }
    else if (s.t === 'drop') { const ox = s.spread ? (m.i - ((s.n || 1) - 1) / 2) * HH() * s.spread : 0, p = SC.snap((s.spread && m.i ? m.bx : H.x) + ox, s.spread && m.i ? m.by : H.y, 'walk', 100) || [H.x, H.y]; if (!m.i) { m.bx = H.x; m.by = H.y; } m.dx = p[0]; m.dy = p[1]; circle(m.dx, m.dy, HH() * s.r, m.at);
      if (s.jump) { m.jump = 1; m.x0 = e.x; m.y0 = e.y; m.tx = m.dx - sgn(H.x - e.x) * HH() * 0.2; m.ty = m.dy; } }
    else if (s.t === 'shift') { const sd = Math.random() < 0.5 ? 1 : -1, p = SC.snap(e.x + sgn(e.x - H.x) * HH() * 1.5, e.y + sd * HH() * 1.2, 'walk', 120) || [e.x, e.y]; m.dash = 1; m.x0 = e.x; m.y0 = e.y; m.end = p; m.at = S(0.3); } }
  function resolve(e, m, s) { const k = e.unit === 'b_mb_benkei' || e.unit === 'b_mb_genbu' || e.unit === 'b_oni' ? 6 : 0; if (k) SC.shake = Math.max(SC.shake || 0, 4);
    if (s.t === 'arc') { fxAt(e, s.f, m.cx, m.cy - HH() * 0.5, HH() * s.r * 1.8); if (near(m.cx, m.cy, HH() * s.r) && hit(e, s.m) && s.kb) knock(e, HH() * s.kb); }
    else if (s.t === 'ring' || s.t === 'guard') { fxAt(e, s.f, e.x, e.y - HH() * 0.3, HH() * s.r * 2); if (near(e.x, e.y, HH() * s.r) && hit(e, s.m) && s.kb) knock(e, HH() * s.kb); }
    else if (s.t === 'lane') { fxAt(e, s.f, (m.L[0] + m.L[2]) / 2, (m.L[1] + m.L[3]) / 2 - HH() * 0.5, HH() * (s.len || 3) * 0.8); if (s.proj) e.enc.v.mshots = (e.enc.v.mshots || []).concat([{ L: m.L, t: 0, life: 14, u: e.unit, n: s.proj }]); if (inLane(...m.L, HH() * s.w * 0.6)) hit(e, s.m); }
    else if (s.t === 'fan' || s.t === 'cross') { let h = 0; for (const L of m.Ls) { fxAt(e, s.f, (L[0] + L[2]) / 2, (L[1] + L[3]) / 2 - HH() * 0.5, HH() * s.len * 0.7); if (inLane(...L, HH() * s.w * 0.6)) h = 1; } if (h) hit(e, s.m); }
    else if (s.t === 'drop') { fxAt(e, s.f, m.dx, m.dy - HH() * 0.3, HH() * s.r * 2); if (near(m.dx, m.dy, HH() * s.r) && hit(e, s.m) && s.bind) e.enc.v.bindT = S(s.bind); }
    else if (s.t === 'shift') fxAt(e, s.f, m.x0, m.y0, HH() * 1.6); }
  /* 待機：保持距離、輪流出手 */
  function idle(e) { const md = e.md; if (!md) return false; if (e.st === 'hurt') return false;
    if (e.open > 0) { if (!/idle|break|stagger|recover/.test(e.an)) play(e, idleN(e), true); return true; }
    const enc = e.enc, mates = (e.mates || enc.units).filter(u => u !== e && u.st !== 'dead'), d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * md.range;
    if (e.mcd > 0) e.mcd--;
    if (e.mcd <= 0 && !mates.some(u => u.mv) && d < want * 1.6) { const L = (md.pick ? md.pick(e) : md.moves).filter(s => s.t !== 'shift' || d < HH() * 1.5); if (L.length) { const s = L[Math.floor(Math.random() * L.length)]; begin(e, 'mini', { s }); if (md.onPick) md.onPick(e, s); e.mcd = S(rnd(1.4, 2.2) * (md.cdK || 1)); return true; } }
    const side = (e.idx % 2 ? 1 : -1) * 30;
    if (Math.abs(d - want) > HH() * 0.5) { const wn = walkN(e); if (e.an !== wn) play(e, wn, true); walkTo(e, H.x - sgn(H.x - e.x) * want, H.y + side, md.spd || 1.8); } else { const iN = idleN(e); if (e.an !== iN) play(e, iN, true); toward(e); }
    return true; }
  function director(enc) { const v = enc.v; v.t = (v.t || 0) + 1;
    if (v.bindT > 0) { v.bindT--; if (v.px !== undefined) { H.x = v.px; H.y = v.py; } } v.px = H.x; v.py = H.y; for (const s of v.mshots || []) s.t++; v.mshots = (v.mshots || []).filter(s => s.t < s.life);
    for (const e of enc.units) { if (e.st === 'dead') continue; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (e.mgc > 0) e.mgc--;
      if (!(e.md && e.md.noMugen) && enc.diff >= 3 && e.hp < e.hpMax * 0.5 && !e.mv && !(e.mgc > 0) && !enc.units.some(u => u !== e && u.mv)) { e.mgc = S(20); begin(e, 'mugen'); } } }
  /* 尾巴（白九尾分身） */
  function underBody(e, fr, s, fl, a) { const md = e.md; if (!md || !md.tails) return; const u = A.get(e.unit), r = u && u.act.kyubi_tail_sway; if (!r) return;
    const bx = e.x + (fl ? -1 : 1) * (fr[2] * 0.2 - fr[4]) * s, by = e.y - (fr[5] - fr[3] * 0.4) * s;
    for (let i = 0; i < md.tails; i++) { const t = i / (md.tails - 1), ang = (-75 + t * 85) * Math.PI / 180, f2 = A.frameAt(Object.assign({}, r, { loop: true }), G.t * TK + i * 110 + e.ph);
      ctx.save(); ctx.translate(bx, by); if (fl) ctx.scale(-1, 1); ctx.rotate(ang); ctx.globalAlpha = a; const k = s * 0.62; ctx.drawImage(u.imgs[f2[7]], f2[0], f2[1], f2[2], f2[3], -f2[4] * k, -f2[5] * k, f2[2] * k, f2[3] * k); ctx.restore(); } }
  function drawOver(enc) { const v = enc.v; for (const s of v.mshots || []) { const u = A.get(s.u), r = u && u.act[s.n]; if (!r) continue; const q = s.t / s.life, L = s.L, x = L[0] + (L[2] - L[0]) * q, y = L[1] + (L[3] - L[1]) * q, fr = r.f[0], k = HH() * 0.9 / fr[2];
      ctx.save(); ctx.translate(x, y - HH() * 0.7); ctx.rotate(Math.atan2(L[3] - L[1], L[2] - L[0])); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], -fr[2] * k / 2, -fr[3] * k / 2, fr[2] * k, fr[3] * k); ctx.restore(); }
    if (v.bindT > 0) G.txt('縛', H.x, H.y - HH() * 1.45, 13, '#f0d070', 'center');
    for (const e of enc.units) { if (e.guard && e.st !== 'dead') G.txt('架勢', e.x, e.y - HH() * e.size * 1.2, 12, '#ffd76a', 'center'); }
    for (const e of enc.units) if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  /* 晴明召喚：頭目分身（與召喚者同一場遭遇，不另算頭目獎勵） */
  function helper(owner, id, x, y, hp) { const md = DEF[id], u = A.get(md.u); if (!u) return null; const idleR = u.act[id + '_idle_right3q'], vh = idleR.f.map(f => f[5]).sort((p, q) => p - q)[idleR.f.length >> 1];
    const D = Object.assign({}, owner.D, { mv: Object.assign({}, owner.D.mv, MV), dir: 'right3q', nat: 1, brk: null, underBody, idle: e => idle(e) });
    const h = Object.assign({}, owner, { D, actor: id, md, unit: md.u, size: md.size, vh, ratio: md.size, x, y, mv: null, st: 'walk', boss: false, hp, hpMax: hp, nobar: 0, inv: 0, open: 0, shield: 0, flash: 0, kb: 0, idx: 70 + Math.floor(Math.random() * 20), mcd: S(1.5), an: 'idle', aloop: true, at: 0, summoned: 1, name: owner.name + '・' + id });
    G.E.push(h); return h; }
  const preGuard = e => { if (e.guard && e.mv && e.mv.s && e.mv.s.t === 'counter') { e.mv.cnt = 1; return true; } return false; };
  B.MINI = { DEF, MV, helper, idle, director, drawOver, underBody, preGuard };

  /* 副本小頭目（兩兩一組） */
  const reg = (key, map, sub, a, b, na, nb) => B.reg(key, { name: na + '・' + nb, sub, unit: DEF[a].u, hpK: 5, atkK: 1.3, nat: 1, dir: 'right3q', map: [map],
    actors: [{ id: a, name: na, size: DEF[a].size, unit: DEF[a].u, moves: [] }, { id: b, name: nb, size: DEF[b].size, unit: DEF[b].u, moves: [] }], mv: MV, director, underBody, drawOver,
    idle: e => idle(e), init(enc) { enc.v = { mshots: [], t: 0 }; enc.units.forEach((e, i) => { e.md = DEF[e.actor]; e.mcd = S(1.0 + i * 0.9); e.mgc = 0; }); },
    finish(enc) { enc.v.mshots = []; enc.v.bindT = 0; }, preDamage: e => preGuard(e), onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
  reg('mb_fuji2', 'D_FUJI_02', '富士山・小頭目', 'benkei', 'ise_yoshimori', '武藏坊弁慶', '伊勢義盛');
  reg('mb_fuji3', 'D_FUJI_03', '富士山・小頭目', 'kamei_shigekiyo', 'hitachibo_kaison', '龜井重清', '常陸坊海尊');
  reg('mb_sky2', 'D_SKY_02', '天空浮島・小頭目', 'byakko', 'suzaku', '白虎', '朱雀');
  reg('mb_sky3', 'D_SKY_03', '天空浮島・小頭目', 'seiryu', 'genbu', '青龍', '玄武');
  reg('mb_izumo3', 'D_IZUMO_03', '出雲大社・小頭目', 'zenki', 'goki', '前鬼', '後鬼');
})();
