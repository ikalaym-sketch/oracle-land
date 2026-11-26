/* ==========================================================================
 * 神諭之地 重製版 — 46_boss_hidden.js
 * Version : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。試煉石的 3 隻試煉小頭目＋6 隻隱藏王（在神社後山開打），沿用 45_boss_mini 招式模板。
 *           ‧ 試煉小頭目（三神器守門，血量 66%／33% 分階、無間 15%）：
 *             金狛犬・鏡守：兩面神鏡會把光束折射向主角，兩面都打碎＝破綻 3 秒；二階召喚狐火（最多 2）、三階加日輪扇。
 *             金般若・玉守：二階起「百鬼咒」——立起 3 顆勾玉、5 秒後全場咒爆，3 顆都打碎＝中斷並破綻 3 秒。
 *             赤大蛇・劍守：三階插下草薙劍，打 5 下斷劍＝破綻 3 秒、之後攻擊 −20%。
 *           ‧ 隱藏王（依交接 13 招，各招分組冷卻；開場 12 秒內不出大招；大招後有長破綻）：
 *             源賴光（見切、架勢反擊）／梟神（低空掠獵、單一階段）／建御雷（雷劍、神影）／役小角（役靈光路）。
 *           ‧ 終局隱藏王（三形態）：形代御前（封紙→展袖→木面；展袖時「畳紙護身」只能斬外露的結破解）／
 *             道反之大神・荒魂（石戶→道反→千引；石戶掌落掌後外露臂弱點，打中＝破勢；無間：3 根封柱 6 秒內打斷 2 根）。
 *           ‧ 架勢類招式：架勢中打牠會被反擊，等架勢結束才有破綻。
 * 依賴    : 26_boss、45_boss_mini（G.BOSS.MINI）、03_actors（spawnOni、hurtHero）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B || !B.MINI) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM, MI = B.MINI;
  const { play, fx, lane, circle, inLane, hit, S, rnd, sgn, begin, end, TK, HH } = B.api;
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  /* ---------- 隱藏王：13 招表（c＝動作、tf＝預兆特效） ---------- */
  const T13 = (p, L) => L.map((s, i) => Object.assign({ id: i + 1, c: p + String(i + 1).padStart(2, '0'), tf: 'boss_' + p + String(i + 1).padStart(2, '0') }, s));
  const GRP = { 1: 'basic', 2: 'mob', 6: 'mob', 10: 'mob', 3: 'cmd', 7: 'cmd', 11: 'cmd', 4: 'link', 8: 'link', 12: 'link', 5: 'ult', 9: 'ult', 13: 'ult' };
  const GCD = { basic: 0, mob: 12, cmd: 16, link: 16, ult: 32 };
  const OWLG = { 1: 'basic', 2: 'mob', 3: 'mob', 6: 'mob', 4: 'cmd', 7: 'cmd', 8: 'cmd', 10: 'link', 11: 'link', 12: 'link', 5: 'ult', 9: 'ult', 13: 'ult' };
  const HID = {
    yorimitsu: { name: '源賴光', sub: '斬鬼之名將', size: 1.2, range: 1.6, walk: 'walk', spd: 2.2, moves: T13('R', [
      { t: 'arc', n: 3, gap: 0.3, r: 1.3, at: 0.45, m: 0.7 }, { t: 'lane', len: 2.4, w: 0.9, at: 0.6, m: 1.0, dash: 1 }, { t: 'counter', at: 0.9, r: 1.6, m: 1.3, c2: 'R13_counter' },
      { t: 'arc', n: 2, gap: 0.4, r: 1.5, at: 0.8, m: 1.0 }, { t: 'lane', len: 6, w: 1.4, at: 1.4, m: 1.8, post: 1.4 }, { t: 'lane', len: 3, w: 0.9, at: 0.7, m: 1.1, dash: 1 },
      { t: 'lane', len: 6, w: 0.8, at: 1.0, m: 1.4 }, { t: 'arc', n: 2, gap: 0.45, r: 1.4, at: 0.5, m: 0.9 }, { t: 'lane', n: 3, gap: 0.5, len: 5, w: 0.9, at: 0.55, m: 0.9, post: 1.0 },
      { t: 'arc', r: 1.0, at: 0.6, m: 1.0 }, { t: 'counter', at: 0.8, r: 1.5, m: 1.2, c2: 'R13_counter' }, { t: 'arc', r: 1.3, at: 0.5, m: 0.9 }, { t: 'counter', at: 2.0, r: 1.8, m: 1.6, c2: 'R13_counter', post: 1.4 }]) },
    owl: { name: '梟神・夜天梟王', sub: '雪原之夜的守望者', size: 1.5, range: 2.2, walk: 'walk', spd: 2.0, grp: OWLG, moves: T13('O', [
      { t: 'arc', n: 3, gap: 0.3, r: 1.3, at: 0.5, m: 0.7 }, { t: 'arc', r: 2.2, at: 0.75, m: 1.0 }, { t: 'lane', len: 2.8, w: 1.0, at: 0.8, m: 1.1, dash: 1 },
      { t: 'fan', len: 6, w: 0.6, at: 0.9, m: 0.9 }, { t: 'lane', n: 2, gap: 0.45, len: 5, w: 1.8, at: 1.2, m: 1.0, same: 1, post: 1.4 }, { t: 'drop', jump: 1, r: 1.2, at: 1.1, m: 1.2 },
      { t: 'lane', n: 2, gap: 0.65, len: 6, w: 0.7, at: 1.0, m: 0.8, same: 1 }, { t: 'drop', n: 3, spread: 1.6, gap: 0.35, r: 0.9, at: 1.0, m: 0.8 }, { t: 'cross', len: 5, w: 1.0, at: 1.6, m: 1.6, post: 1.4 },
      { t: 'counter', at: 1.2, r: 1.5, m: 1.2, c2: 'O10_counter' }, { t: 'lane', n: 3, gap: 0.4, len: 4, w: 0.8, at: 0.95, m: 0.7 }, { t: 'drop', jump: 1, r: 1.1, at: 0.8, m: 1.1 },
      { t: 'lane', n: 3, gap: 0.65, len: 7, w: 1.2, at: 1.8, m: 1.0, dash: 1, post: 1.4 }]) },
    takemikazuchi: { name: '建御雷', sub: '雷與劍之神', size: 1.25, range: 1.8, walk: 'walk', spd: 2.1, god: 1, moves: T13('T', [
      { t: 'arc', n: 3, gap: 0.3, r: 1.3, at: 0.5, m: 0.8 }, { t: 'lane', len: 2.6, w: 0.9, at: 0.7, m: 1.0, dash: 1 }, { t: 'lane', len: 6, w: 0.8, at: 1.0, m: 1.4 },
      { t: 'drop', r: 1.1, at: 0.9, m: 1.1 }, { t: 'drop', n: 4, gap: 0.35, r: 1.0, at: 1.0, m: 0.9, post: 1.4 }, { t: 'lane', len: 3, w: 0.9, at: 0.7, m: 1.1, dash: 1 },
      { t: 'lane', n: 2, gap: 0.5, len: 6, w: 0.9, at: 1.1, m: 0.9, same: 1 }, { t: 'drop', n: 2, gap: 0.65, r: 1.0, at: 0.65, m: 1.0 }, { t: 'arc', r: 3.0, at: 1.8, m: 1.8, post: 1.4 },
      { t: 'arc', r: 1.8, at: 0.7, m: 1.0 }, { t: 'lane', n: 3, gap: 0.4, len: 4, w: 0.8, at: 0.9, m: 0.7 }, { t: 'drop', n: 3, gap: 0.4, r: 1.1, at: 0.7, m: 0.8 },
      { t: 'drop', n: 3, spread: 1.8, gap: 0.6, r: 1.4, at: 1.8, m: 1.0, post: 1.4 }]) },
    enno: { name: '役小角', sub: '驅使役靈的修驗者', size: 1.1, range: 2.6, walk: 'walk', spd: 2.0, moves: T13('E', [
      { t: 'arc', n: 3, gap: 0.3, r: 1.2, at: 0.5, m: 0.7 }, { t: 'ring', r: 1.5, at: 0.7, m: 0.8 }, { t: 'drop', n: 2, gap: 0.5, r: 1.0, at: 0.9, m: 0.9 },
      { t: 'drop', n: 2, gap: 0.45, r: 1.0, at: 0.9, m: 0.9 }, { t: 'lane', n: 2, gap: 0.6, len: 7, w: 1.0, at: 1.5, m: 1.2, post: 1.4 }, { t: 'lane', len: 5, w: 0.7, at: 0.7, m: 1.0, f: 'enno_aka_strike' },
      { t: 'lane', n: 2, gap: 0.5, len: 5, w: 0.9, at: 1.0, m: 0.9, same: 1 }, { t: 'drop', n: 2, gap: 0.5, r: 1.0, at: 0.7, m: 0.9 }, { t: 'cross', len: 6, w: 1.0, at: 1.7, m: 1.4, post: 1.4 },
      { t: 'shift' }, { t: 'shift' }, { t: 'arc', n: 3, gap: 0.25, r: 1.2, at: 0.9, m: 0.6 }, { t: 'lane', n: 3, gap: 0.6, len: 6, w: 1.0, at: 1.8, m: 1.0, post: 1.4 }]) }
  };
  /* 隱藏王：選招（分組冷卻、開場 12 秒不出大招） */
  function hidPick(e) { const v = e.enc.v, g = e.md.grp || GRP; return e.md.moves.filter(s => { const k = g[s.id]; return !(v.gcd[k] > 0) && !(k === 'ult' && v.t < S(12)); }); }
  function hidOnPick(e, s) { const v = e.enc.v, k = (e.md.grp || GRP)[s.id]; if (GCD[k]) v.gcd[k] = S(GCD[k]); }

  /* ---------- 終局隱藏王（三形態） ---------- */
  const FORM = {
    katashiro: { name: '形代御前', sub: '祓殿禁藏', size: 1.2, range: 2.2, walk: 'walk', spd: 1.8, dir: 'right3q', brk: 'recover', mugen: null,
      forms: [{ idle: 'idle', walk: 'walk', hurt: 'hurt_sealed', moves: [{ t: 'fan', c: 'paper_scatter', len: 5, w: 0.6, at: 0.8, m: 0.9, f: 'katashiro_paper_volley' }, { t: 'arc', c: 'staff_sweep', r: 1.6, at: 0.7, m: 1.1, f: 'katashiro_sweep_wind' }] },
        { idle: 'unfold_idle', walk: 'unfold_walk', hurt: 'hurt_unfold', tr: 'unfold_transition', moves: [{ t: 'drop', c: 'knot_bind', r: 1.1, at: 0.9, m: 0.8, bind: 1.0, f: 'katashiro_tether_trace' }, { t: 'arc', c: 'staff_sweep', r: 1.6, at: 0.7, m: 1.1, f: 'katashiro_sweep_wind' }, { sp: 'pguard' }] },
        { idle: 'exposed_idle', walk: 'exposed_walk', hurt: 'hurt_exposed', tr: 'expose_transition', moves: [{ t: 'lane', c: 'reverse_purify', n: 2, gap: 0.5, len: 5, w: 1.2, at: 0.9, m: 1.1, f: 'katashiro_return_wave' }, { t: 'arc', c: 'final_disaster', n: 3, gap: 0.45, r: 1.8, at: 0.8, m: 1.0, f: 'katashiro_disaster_sweep', post: 1.4 }, { t: 'drop', c: 'knot_bind', r: 1.1, at: 0.9, m: 0.8, bind: 1.0, f: 'katashiro_tether_trace' }] }] },
    chigaeshi: { name: '道反之大神・荒魂', sub: '比良舊關・千引封關', size: 1.45, range: 1.9, walk: 'walk', spd: 1.6, dir: 'right3q', brk: 'recover',
      forms: [{ idle: 'idle', walk: 'walk', hurt: 'hurt_sealed', moves: [{ t: 'arc', c: 'stone_palm', r: 1.5, at: 0.7, m: 1.2, f: 'chigaeshi_palm_shock', weak: 1 }, { t: 'ring', c: 'stamp_seal', r: 1.8, at: 0.8, m: 1.0, f: 'chigaeshi_seal_crack' }] },
        { idle: 'unfold_idle', walk: 'unfold_walk', hurt: 'hurt_unfold', tr: 'unfold_transition', moves: [{ t: 'lane', c: 'reverse_rush', len: 4, w: 1.1, at: 0.7, m: 1.2, dash: 1, f: 'chigaeshi_rush_front' }, { t: 'drop', c: 'stone_array', n: 4, spread: 1.4, gap: 0.3, r: 0.9, at: 1.0, m: 0.9, f: 'chigaeshi_stone_array_sign' }, { t: 'arc', c: 'stone_palm', r: 1.5, at: 0.7, m: 1.2, f: 'chigaeshi_palm_shock', weak: 1 }] },
        { idle: 'ridge_idle', walk: 'ridge_walk', hurt: 'hurt_ridge', tr: 'ridge_transition', moves: [{ t: 'ring', c: 'yomi_seal', r: 2.6, at: 1.0, m: 1.3, f: 'chigaeshi_boundary_press' }, { t: 'lane', c: 'final_gate', len: 7, w: 2.4, at: 1.6, m: 1.8, post: 1.6, f: 'chigaeshi_gate_collapse', ult: 1 }, { t: 'lane', c: 'reverse_rush', len: 4, w: 1.1, at: 0.7, m: 1.2, dash: 1, f: 'chigaeshi_rush_front' }] }] }
  };
  /* ---------- 試煉小頭目 ---------- */
  const TRI = {
    komakin: { name: '金狛犬・鏡守', sub: '八咫映照庭', size: 1.35, range: 2.2, walk: 'run', spd: 2.2, dir: 'right3q', brk: 'stagger',
      ph: [[{ t: 'arc', c: 'claw', r: 1.3, at: 0.55, m: 1.0, f: 'komakin_claw_slash' }, { t: 'lane', c: 'beam', len: 6, w: 0.8, at: 0.9, m: 1.1, f: 'komakin_mirror_ray', mirror: 1 }, { t: 'drop', c: 'leap', jump: 1, r: 1.2, at: 0.9, m: 1.2, f: 'komakin_ground_impact' }],
        [{ sp: 'wisps' }], [{ t: 'fan', c: 'solar', len: 5, w: 0.8, at: 1.0, m: 1.0, f: 'komakin_solar_fan' }]] },
    kinhannya: { name: '金般若・玉守', sub: '結玉齋庭', size: 1.15, range: 1.8, walk: 'walk', spd: 2.0, dir: 'right3q', brk: 'hurt',
      ph: [[{ t: 'arc', c: 'claw', r: 1.3, at: 0.55, m: 1.0, f: 'kinhannya_claw_slash' }, { t: 'drop', c: 'blink', jump: 1, r: 1.1, at: 0.6, m: 1.0, f: 'kinhannya_blink_trail' }, { t: 'drop', c: 'curse', n: 3, spread: 1.4, gap: 0.3, r: 1.0, at: 1.0, m: 0.8, f: 'kinhannya_curse_mark' }],
        [{ sp: 'jade' }], []] },
    akaorochi: { name: '赤大蛇・劍守', sub: '鎮劍磐庭', size: 1.5, range: 2.0, walk: 'slither', spd: 1.9, dir: 'right3q', brk: 'hurt',
      ph: [[{ t: 'lane', c: 'bite', len: 3, w: 1.0, at: 0.6, m: 1.2, dash: 1, f: 'akaorochi_bite_trace' }, { t: 'fan', c: 'breath', len: 5, w: 0.8, at: 0.9, m: 1.0, f: 'akaorochi_fire_breath' }, { t: 'arc', c: 'sweep', r: 1.8, at: 0.7, m: 1.0, f: 'akaorochi_tail_slash' }],
        [{ t: 'ring', c: 'roar', r: 2.2, at: 0.7, m: 0.8, f: 'akaorochi_blood_tide' }, { t: 'drop', c: 'roar', n: 3, gap: 0.35, r: 0.9, at: 0.9, m: 0.8, f: 'akaorochi_geyser' }], [{ t: 'lane', c: 'breath', len: 6, w: 1.2, at: 1.0, m: 1.1, f: 'akaorochi_sword_wave' }]] }
  };

  /* ---------- 特殊招 ---------- */
  const SP = {
    /* 畳紙護身：本體 90% 減傷，外露的結被斬斷＝破綻 2.5 秒 */
    pguard: { go(e, m) { play(e, 'paper_guard'); const v = e.enc.v; e.shield = 0.9; const p = SC.snap(e.x - e.face * HH() * 1.2, e.y + 24, 'walk', 100) || [e.x, e.y]; v.objs.push({ k: 'knot', x: p[0], y: p[1], hp: 1, img: 'katashiro_knot_intact', bimg: 'katashiro_knot_cut', s: HH() * 0.8 / 256, onBreak: () => { e.shield = 0; e.open = S(2.5); play(e, 'hurt_unfold'); fx(e, 'katashiro_knot_break', p[0], p[1] - HH() * 0.3, { s: HH() * 2 / 204 }); G.UI.toast('斬斷了外露的結！'); } }); G.UI.toast('畳紙護身——斬外露的結！'); },
      step(e, m) { return m.t > S(6) || e.shield === 0; }, stop(e) { e.shield = 0; e.enc.v.objs = e.enc.v.objs.filter(o => o.k !== 'knot' || o.br); } },
    /* 狐火召喚（最多 2） */
    wisps: { go(e, m) { play(e, 'roar'); }, step(e, m) { const v = e.enc.v; if (m.t === S(0.5)) { v.kids = v.kids.filter(k => k.st !== 'dead'); for (let i = 0; i < 2 - v.kids.length; i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y, 'open', 200) || [e.x, e.y]; fx(e, 'komakin_summon_wisp', p[0], p[1], { s: HH() * 1.6 / 197 }); const k = G.spawnOni(p[0], p[1], 20, Math.max(1, e.lv - 4), 'kitsunebi'); if (k) v.kids.push(k); } } return m.t > S(1.0); } },
    /* 百鬼咒：3 顆勾玉，5 秒內全打碎＝中斷 */
    jade: { go(e, m) { play(e, 'channel'); const v = e.enc.v; G.UI.banner('百鬼咒', '5 秒內打碎 3 顆勾玉！'); m.js = [];
        for (let i = 0; i < 3; i++) { const a = i * 2.094, p = SC.snap(e.x + Math.cos(a) * HH() * 2.6, e.y + Math.sin(a) * HH() * 1.2, 'walk', 120) || [e.x, e.y]; const o = { k: 'jade', x: p[0], y: p[1], hp: 2, img: 'kinhannya_jade' + (i + 1), bimg: 'kinhannya_jade' + (i + 1) + '_broken', s: HH() * 0.7 / 256 }; m.js.push(o); v.objs.push(o); }
        circle(e.x, e.y, HH() * 4, S(5), '170,120,230'); },
      step(e, m) { if (m.js.every(o => o.br)) { e.open = S(3); play(e, 'hurt'); G.UI.banner('百鬼咒中斷', '金般若露出破綻'); return true; }
        if (m.t === S(5)) { fx(e, 'kinhannya_hyakki_wisp', e.x, e.y - HH() * 0.5, { s: HH() * 6 / 184 }); if (near(e.x, e.y, HH() * 4)) hit(e, 2.0); } return m.t > S(5.4); },
      stop(e) { e.enc.v.objs = e.enc.v.objs.filter(o => o.k !== 'jade'); } },
    /* 無間・千引封柱（道反）：3 根封柱，6 秒內打斷 2 根＝破勢 3 秒 */
    pillars: { go(e, m) { play(e, 'mugen_gate'); const v = e.enc.v; G.UI.banner('千引封關', '6 秒內打斷 2 根封柱！'); m.ps = [];
        for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, p = SC.snap(e.x + Math.cos(a) * HH() * 3, e.y + Math.sin(a) * HH() * 1.4, 'walk', 120) || [e.x, e.y]; const o = { k: 'pillar', x: p[0], y: p[1], hp: 3, img: 'chigaeshi_pillar_intact', bimg: 'chigaeshi_pillar_relieved', s: HH() * 1.4 / 256 }; m.ps.push(o); v.objs.push(o); }
        circle(e.x, e.y, HH() * 4.5, S(6), '200,170,120'); },
      step(e, m) { if (m.ps.filter(o => o.br).length >= 2) { e.open = S(3); play(e, 'hurt_ridge'); G.UI.banner('封柱斷了', '荒魂破勢'); return true; }
        if (m.t === S(6)) { fx(e, 'chigaeshi_gate_collapse', e.x, e.y - HH() * 0.4, { s: HH() * 6 / 226 }); if (near(e.x, e.y, HH() * 4.5)) hit(e, 2.0); } return m.t > S(6.4); },
      stop(e) { e.enc.v.objs = e.enc.v.objs.filter(o => o.k !== 'pillar'); } },
    /* 無間・綴結返祓（形代）：外露的結＋三波返祓；斬結即停 */
    knots: { go(e, m) { play(e, 'mugen_knot'); const v = e.enc.v; G.UI.banner('綴結返祓', '斬斷外露的結就能停下'); const p = SC.snap(e.x + e.face * HH() * 1.4, e.y + 20, 'walk', 100) || [e.x, e.y];
        m.o = { k: 'knot', x: p[0], y: p[1], hp: 1, img: 'katashiro_knot_intact', bimg: 'katashiro_knot_cut', s: HH() * 0.8 / 256 }; v.objs.push(m.o); m.w = 0; },
      step(e, m) { if (m.o.br) { e.open = S(3); play(e, 'hurt_exposed'); G.UI.toast('結斷了——返祓停止'); return true; }
        for (let i = 0; i < 3; i++) { const t0 = S(0.6 + i * 1.2); if (m.t === t0) circle(e.x, e.y, HH() * (2 + i * 0.8), S(0.9), '230,200,240'); if (m.t === t0 + S(0.9)) { fx(e, 'katashiro_return_wave', e.x, e.y - HH() * 0.3, { s: HH() * (4 + i * 1.6) / 118 }); if (near(e.x, e.y, HH() * (2 + i * 0.8))) hit(e, 1.0); } }
        return m.t > S(4.4); },
      stop(e) { e.enc.v.objs = e.enc.v.objs.filter(o => o.k !== 'knot' || o.br); } }
  };
  const MV = Object.assign({}, MI.MV, SP);

  /* ---------- 共用遭遇邏輯 ---------- */
  function director(enc) { const v = enc.v, e = enc.units[0]; MI.director(enc); if (!e || e.st === 'dead') return;
    v.t2 = (v.t2 || 0) + 1; for (const k in v.gcd) if (v.gcd[k] > 0) v.gcd[k]--; if (e.weak > 0) e.weak--;
    if (e.an === 'hurt') { const hn = e.md.hurtN ? e.md.hurtN(e) : 'hit_light'; if (hn !== 'hurt') play(e, hn); }
    // 可破壞物件：主角出手打中
    if (H.act && H.act !== v.lastAct && /atk|skill|ult/.test(H.act.kind)) { v.lastAct = H.act; const hx = H.x + H.face * HH() * 0.4;
      for (const o of v.objs) if (!o.br && Math.hypot(hx - o.x, (H.y - o.y) * 1.6) < HH() * 0.95) { o.hp--; o.fl = 8; if (o.hp <= 0) { o.br = 1; o.t = 0; if (o.onBreak) o.onBreak(); } } }
    if (!H.act) v.lastAct = null;
    for (const o of v.objs) { if (o.fl > 0) o.fl--; if (o.br) o.t = (o.t || 0) + 1; } v.objs = v.objs.filter(o => !o.br || o.t < 120 || o.keep);
    if (v.kids) v.kids = v.kids.filter(k => k.st !== 'dead');
    if (e.md.phase) e.md.phase(e); }
  function drawUnder(enc) { const v = enc.v, e = enc.units[0], u = e && A.get(e.unit); if (!u) return;
    for (const o of v.objs) { const r = u.act[o.br && o.bimg ? o.bimg : o.img]; if (!r) continue; A.draw(u, r.f[0], o.x, o.y, o.s, false, o.br ? Math.max(0.3, 1 - o.t / 120) : 1);
      if (!o.br) { if (o.fl > 0) { ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(o.x, o.y - HH() * 0.4, HH() * 0.4, HH() * 0.4, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        ctx.save(); ctx.strokeStyle = `rgba(255,215,120,${0.5 + 0.3 * Math.sin(v.t * 0.3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(o.x, o.y, HH() * 0.5, HH() * 0.2, 0, 0, 6.283); ctx.stroke(); ctx.restore(); } }
    if (e.md.god && e.st !== 'dead') { const r = u.act[e.actor + '_god_idle']; if (r) A.draw(u, A.frameAt(Object.assign({}, r, { loop: true }), v.t * TK), e.x - e.face * HH() * 0.2, e.y - HH() * 0.9, HH() * 2.2 / 224, B.api.flip(e.face, 1), e.mv ? 0.55 : 0.3); } }
  function drawOver(enc) { MI.drawOver(enc); const e = enc.units[0]; if (e && e.weak > 0 && e.st !== 'dead') G.txt('弱點！', e.x, e.y - HH() * e.size * 1.3, 12, '#ff9a6a', 'center'); }
  const common = (unit, md, extra) => Object.assign({ unit, nat: 1, mv: MV, director, drawUnder, drawOver, underBody: MI.underBody, map: [],
    idle: e => MI.idle(e), finish(enc) { const v = enc.v; v.objs = []; v.bindT = 0; v.mshots = []; for (const k of v.kids || []) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } },
    preDamage(e) { return MI.preGuard(e); },
    onDamage(e, d) { if (e.weak > 0) { e.weak = 0; e.open = S(2); if (e.mv) end(e); play(e, e.md.hurtN ? e.md.hurtN(e) : 'hurt'); G.UI.toast('打中外露的臂——破勢！'); return true; }
      if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } }, extra);
  const init = (md, more) => enc => { enc.v = Object.assign({ objs: [], kids: [], gcd: {}, mshots: [], t: 0 }, more || {}); const e = enc.units[0]; e.md = md; e.mcd = S(1.5); e.mgc = 0; e.f = 0; };

  /* 隱藏王 4 隻 */
  for (const id in HID) { const md = Object.assign({ pick: hidPick, onPick: hidOnPick, mugen: [0, 6, 8], brk: 'hit_heavy', hurtN: () => 'hit_light' }, HID[id]);
    B.reg('h_' + id, common('b_' + id, md, { name: md.name, sub: md.sub, hpK: 15, atkK: 1.8, dir: 'x', actors: [{ id, name: md.name, size: md.size, moves: [] }], init: init(md) })); }
  /* 終局隱藏王 2 隻（三形態） */
  for (const id in FORM) { const D0 = FORM[id];
    const md = Object.assign({}, D0, { noMugen: 1, idleN: e => D0.forms[e.f].idle, walkN: e => D0.forms[e.f].walk, hurtN: e => D0.forms[e.f].hurt,
      pick: e => { const L = D0.forms[e.f].moves.filter(s => !s.sp || !(e.enc.v.gcd[s.sp] > 0)); return L; },
      onPick(e, s) { if (s.sp) e.enc.v.gcd[s.sp] = S(14); if (s.weak) e.wk = 1; },
      phase(e) { const hp = e.hp / e.hpMax, f = hp < 0.33 ? 2 : hp < 0.66 ? 1 : 0;
        if (f > e.f && !e.mv) { e.f = f; e.inv = S(1.2); e.mcd = S(1.6); play(e, D0.forms[f].tr); G.UI.toast(D0.name + '　' + ['', '展開', '最終形態'][f]); }
        if (e.enc.diff >= 3 && hp < 0.15 && !e.mv && !(e.mgc > 0)) { e.mgc = S(22); begin(e, id === 'katashiro' ? 'knots' : 'pillars'); }
        if (e.wk && e.mv && e.mv.k === 'mini' && e.mv.t === e.mv.at + 1) { e.wk = 0; e.weak = S(1.0); } } });
    for (const f of D0.forms) for (const s of f.moves) if (s.sp) Object.assign(s, { t: 'sp' });
    B.reg('h_' + id, common('b_' + id, md, { name: md.name, sub: md.sub, hpK: 15, atkK: 1.8, dir: 'right3q', actors: [{ id, name: md.name, size: md.size, moves: [] }], init: init(md), mugenOff: 1 })); }
  /* 試煉小頭目 3 隻（三階＋無間） */
  for (const id in TRI) { const D0 = TRI[id];
    const md = Object.assign({}, D0, { noMugen: 1, moves: D0.ph[0], pick: e => [].concat(...D0.ph.slice(0, e.f + 1)).filter(s => !s.sp || !(e.enc.v.gcd[s.sp] > 0)), onPick(e, s) { if (s.sp) e.enc.v.gcd[s.sp] = S(16); },
      hurtN: () => 'hurt',
      phase(e) { const v = e.enc.v, hp = e.hp / e.hpMax, f = hp < 0.33 ? 2 : hp < 0.66 ? 1 : 0; if (f > e.f && !e.mv) { e.f = f; e.inv = S(1.0); e.mcd = S(1.2); G.UI.toast(D0.name + '　' + ['', '二階', '三階'][f]);
          if (id === 'akaorochi' && f === 2 && !v.sword) { const p = SC.snap(e.x - e.face * HH() * 2, e.y + 20, 'walk', 120) || [e.x, e.y]; v.sword = { k: 'sword', x: p[0], y: p[1], hp: 5, img: 'akaorochi_sword_intact', bimg: 'akaorochi_sword_broken', s: HH() * 1.4 / 256, keep: 1, onBreak: () => { e.open = S(3); e.atk = Math.round(e.atk * 0.8); play(e, 'hurt'); G.UI.banner('斷劍', '劍守失去草薙之力'); } }; v.objs.push(v.sword); G.UI.toast('草薙劍插在地上——打斷它！'); } }
        if (e.enc.diff >= 3 && hp < 0.15 && !e.mv && !(e.mgc > 0)) { e.mgc = S(20); begin(e, 'mugen'); } } });
    for (const L of D0.ph) for (const s of L) if (s.sp) Object.assign(s, { t: 'sp' });
    B.reg('t_' + id, common('b_mb_' + id, md, { name: D0.name, sub: D0.sub, hpK: 9, atkK: 1.5, dir: 'right3q', foes: id === 'komakin' ? ['kitsunebi'] : [], actors: [{ id, name: D0.name, size: D0.size, moves: [] }],
      init: init(md, id === 'komakin' ? { mirrors: 1 } : {}) })); }
  /* 特殊招經由 MINI.idle 選到時：t:'sp' → 改走對應招式 */
  const mini0 = MV.mini; MV.mini = { go(e, m) { if (m.s.t === 'sp') { m.sp = m.s.sp; SP[m.sp].go(e, m); return; } mini0.go(e, m); if (m.s.mirror) mirrorBeam(e, m); },
    step(e, m) { if (m.sp) return SP[m.sp].step(e, m); return mini0.step(e, m); }, stop(e) { const m = e.mv; if (m && m.sp && SP[m.sp].stop) SP[m.sp].stop(e); else mini0.stop(e); } };
  /* 鏡守：光束經神鏡折射 */
  function mirrorBeam(e, m) { const v = e.enc.v, M = v.objs.filter(o => o.k === 'mirror' && !o.br); if (!M.length) return; const o = M[Math.floor(Math.random() * M.length)]; m.ref = [o.x, o.y - 10, H.x + (H.x - o.x) * 0.6, H.y + (H.y - o.y) * 0.6]; lane(...m.ref, HH() * 0.8, m.at, '250,230,150');
  }
  const step1 = MV.mini.step; MV.mini.step = function (e, m) { if (m.ref && m.t - m.t0 === m.at) { fx(e, 'komakin_reflect_glint', m.ref[0], m.ref[1] - HH() * 0.5, { s: HH() * 1.4 / 118 }); if (inLane(...m.ref, HH() * 0.5)) hit(e, 0.9); } return step1(e, m); };
  /* 鏡守開場放兩面鏡 */
  const kinit = B.DEF.t_komakin.init; B.DEF.t_komakin.init = function (enc) { kinit(enc); const e = enc.units[0], v = enc.v;
    for (const [s, img] of [[-1, 'komakin_mirror_a'], [1, 'komakin_mirror_b']]) { const p = SC.snap(e.x + s * HH() * 3.2, e.y - 30, 'walk', 140) || [e.x + s * 120, e.y];
      v.objs.push({ k: 'mirror', x: p[0], y: p[1], hp: 3, img, s: HH() * 1.3 / 256, keep: 1, onBreak: () => { if (v.objs.filter(o => o.k === 'mirror' && !o.br).length === 0) { e.open = S(3); play(e, 'stagger'); G.UI.banner('神鏡全碎', '鏡守露出破綻'); } } }); } };
  B.HIDDEN = { HID, FORM, TRI };
})();
