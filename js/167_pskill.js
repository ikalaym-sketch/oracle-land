/* ==========================================================================
 * 神諭之地 重製版 — 167_pskill.js
 * Version : r3.231.0  (2026-11-28)　r3.231.0：專長特效換成新補的手繪圖（石獅護盾、反震、嘲諷鈴、羽箭標記、遠射軌跡、狐火縛印、淨化紙符、破甲裂痕、鬼氣爆發、連鎖落雷、潮音護盾、治療水環、補刀斬光、前鬼後鬼爪）；茨木普攻第三段用新動作
 * 舊版    : r3.226.0  (2026-11-28)　r3.226.0：新增。夥伴專長（Lv20 第一個、Lv50 第二個）與「出招看得懂」
 * 內容    : 1. 專長（每位兩個，看夥伴等級開放；夥伴頁「屬性」分頁下方列出）：
 *              白丸　鎮守：自己受傷 −30%，主角在他身邊受傷 −10%｜反震：替主角擋下攻擊時，震回去一次
 *              颯　　遠射：離目標越遠越痛（最多 +30%）｜看破：每 12 秒標記目標，主角下一擊必定會心
 *              葛葉　弱印：被她打中的敵人 5 秒內受到所有傷害 +15%｜狐火結界：每 15 秒讓主角身邊的敵人緩速 4 秒
 *              茨木　破守：打中後敵人防禦 −30%（6 秒）｜逆境：自己血越少打越痛（最多 +40%）
 *              汐音　急救：主角血量低於四成時立刻補 15%（20 秒一次）｜潮音護：每 18 秒讓主角接下來 2 次受傷減半
 *              賴光　會心：會心率 +15%｜護主：主角被打時，立刻對出手的敵人補一刀（4 秒一次）
 *              建御雷 破守：同茨木｜連雷：每第 3 次普攻落雷，連到附近最多 3 隻
 *              役小角 牽步：打中的敵人緩速 3 秒｜式鬼：每 8 秒前鬼、後鬼各追打一隻
 *           2. 看得懂：近戰普攻先往前踏一步；白丸、茨木普攻帶爪痕／震波；茨木普攻改成上勾拳→重拳→下砸輪流；
 *              白丸的護衛加長到 6 秒、可擋 2 次，擋下時主角身前有護盾並跳「擋」。
 * 依賴    : 49_party、50_party_kit（PY.hg／heroTaken／dmg）、03_actors、88_rune（G.AFX）、51_party_grow（夥伴頁）。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, H = G.H, SC = G.SC; if (!PY || !PY.DEF) return;
  const lvOf = id => { try { return PY.data(id).lv || 1; } catch (e) { return 1; } }, has = (id, n) => lvOf(id) >= (n === 1 ? 20 : 50);
  const find = id => (PY.list || []).find(P => P && P.id === id && P.st !== 'down'), alive = e => e && e.st !== 'dead' && G.E.indexOf(e) >= 0 && !(e.delay > 0);
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6), HH = y => G.HERO_H * SC.depth(y), AX = () => G.AFX;
  const say = (x, y, t, col) => G.NUMS.push({ x, y, v: t, t: 0, pop: G.t, col: col || '#ffe9a8', txt: 1 });
  const fx = (u, c, o) => { const A = AX(); if (A) A.play(u, c, Object.assign({ fb: () => { } }, o)); };
  const nfx = (n, o, old) => { if (G.ART2 && G.ART2.fx(n, o)) return true; if (old) old(); return false; };   /* r3.231.0：新補的專長特效（x2_pt）；圖還沒載好就用原本的頂著 */
  const SK = PY.SPEC = {
    shiro: [['鎮守', '自己受傷 −30%，主角在他身邊受傷 −10%'], ['反震', '替主角擋下攻擊時，把力道震回去']],
    hayate: [['遠射', '離目標越遠越痛（最多 +30%）'], ['看破', '每 12 秒標記目標，主角下一擊必定會心']],
    kuzuha: [['弱印', '被她打中的敵人 5 秒內受到所有傷害 +15%'], ['狐火結界', '每 15 秒讓主角身邊的敵人緩速 4 秒']],
    ibaraki: [['破守', '打中後敵人防禦 −30%（6 秒）'], ['逆境', '自己血越少打越痛（最多 +40%）']],
    shion: [['急救', '主角血量低於四成時立刻補 15%（20 秒一次）'], ['潮音護', '每 18 秒讓主角接下來 2 次受傷減半']],
    yorimitsu: [['會心', '會心率 +15%'], ['護主', '主角被打時，立刻對出手的敵人補一刀']],
    takemikazuchi: [['破守', '打中後敵人防禦 −30%（6 秒）'], ['連雷', '每第 3 次普攻落雷，連到附近最多 3 隻']],
    enno: [['牽步', '打中的敵人緩速 3 秒'], ['式鬼', '每 8 秒前鬼、後鬼各追打一隻']] };
  PY.specOn = has;
  const CD = {}; const ready = (k, n) => { if ((CD[k] || 0) > G.t) return false; CD[k] = G.t + n; return true; };
  let veil = 0, inFx = 0;

  /* ---------- 傷害：夥伴打人／主角打被標記的敵人 ---------- */
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const P = opt && opt.party, id = P && typeof P === 'object' ? P.id : null, h0 = e ? e.hp : 0;
    try { if (id === 'hayate' && has(id, 1) && P.x !== undefined) mult *= 1 + Math.min(0.3, Math.hypot(e.x - P.x, e.y - P.y) / 1000);
      if (id === 'ibaraki' && has(id, 2) && P.hpMax) mult *= 1 + 0.4 * (1 - Math.max(0, P.hp) / P.hpMax);
      if (!P && e && e._hmk > 0) { fc = true; e._hmk = 0; say(e.x, e.y - HH(e.y) * (e.ratio || 1) - 10, '看破', '#bfe8ff'); } } catch (x) { }
    const r = dm0.call(this, e, mult, big, fc, opt);
    try { if (id && e && e.hp < h0 && !inFx) { e.db = e.db || {};
        if (id === 'kuzuha' && has(id, 1) && !(e._pvT > 0)) { e.db.vuln = (e.db.vuln || 0) + 15; e._pvT = 300; }
        else if (id === 'kuzuha' && e._pvT > 0) e._pvT = 300;
        if (id === 'enno' && has(id, 1)) { e.db.slow = Math.max(e.db.slow || 0, 1); e.slowT = Math.max(e.slowT || 0, 180); }
        if ((id === 'ibaraki' || id === 'takemikazuchi') && has(id, 1)) { if (!(e.db.defT > 60)) { const k = HH(e.y) * (e.ratio || 1); nfx('fx_armor_crack', { tpf: 4, hold: 10, size: k * 1.1, at: () => alive(e) ? [e.x, e.y - k * 0.55, 0] : null }); } e.db.def = Math.max(e.db.def || 0, 30); e.db.defT = Math.max(e.db.defT || 0, 360); (e.st2 = e.st2 || {}).ha = 360; }
        if (id === 'hayate' && has(id, 1) && P.x !== undefined && Math.hypot(e.x - P.x, e.y - P.y) > 300 && ready('long', 40)) { const k = HH(e.y), dx = e.x - P.x, dy = (e.y - P.y) * 0.6; nfx('fx_hayate_longshot', { x: e.x - dx * 0.25, y: e.y - k * 0.55 - dy * 0.25, size: k * 2.6, by: 'w', tpf: 3, flip: dx < 0, ang: Math.atan2(dy, Math.abs(dx)) * (dx < 0 ? -1 : 1) }); }
        if (P.cur && P.cur.ch === 'ordinary' && !opt.rune) { const k = HH(e.y) * (e.ratio || 1);   // 普攻命中：看得見的一擊
          if (id === 'shiro') fx('fx_common', 'weapon_claw_a', { x: e.x, y: e.y - k * 0.5, size: k * 1.1, by: 'h', flip: P.face < 0, tpf: 3, tint: '236,206,150' });
          if (id === 'ibaraki') fx('b_ibaraki', 'ibaraki_shock_wave', { x: e.x, y: e.y - k * 0.2, size: k * 1.2, by: 'h', tpf: 3 }); } } } catch (x) { }
    return r; };

  /* ---------- 出招：茨木三段、建御雷連雷、近戰踏步 ---------- */
  const IB = [['uppercut', 440], ['heavy_punch', 700], ['overhead_drop', 650]]; let ibN = 0, tkN = 0, rageT = 0;
  const c0 = PY.cast; PY.cast = function (P, ch, why) { let back = null;
    try { if (P.id === 'ibaraki' && ch === 'ordinary') { const k = G.PKIT.ibaraki.ordinary, def = PY.DEF.ibaraki, un = G.ANIM.get(def.unit(P)); let u = IB[ibN % 3]; if (ibN % 3 === 2 && G.ART2) { const nm = G.ART2.clip(P, 'sweep', 'ordinary', [250]); if (nm) u = [nm, 250]; }   /* r3.231.0：第三段＝新補的鬼臂橫掃 */
        if (k && k.ev && k.ev[0] && un && un.act[(def.pre || '') + u[0]]) { back = [k, k.clip, k.ev[0].t]; k.clip = u[0]; k.ev[0].t = u[1]; } } } catch (x) { }
    const r = c0.apply(this, arguments); if (back) { back[0].clip = back[1]; back[0].ev[0].t = back[2]; }
    try { if (r) { const def = PY.DEF[P.id]; if (P.id === 'ibaraki' && ch === 'ordinary') ibN++;
        if (ch === 'ordinary' && !def.ranged && alive(P.tg)) P.lg = 9;   // 往前踏一步再打
        if (P.id === 'takemikazuchi' && ch === 'ordinary' && has('takemikazuchi', 2) && ++tkN % 3 === 0) { const t = P.tg; G.STORY.later(26, () => chain(P, t)); } } } catch (x) { }
    return r; };
  function chain(P, t) { if (!alive(t) || !find(P.id)) return; const L = G.E.filter(e => alive(e) && dist(e, t) < 240).sort((a, b) => dist(a, t) - dist(b, t)).slice(0, 3); inFx++;
    try { L.forEach((e, i) => { const k = HH(e.y); nfx('fx_takemi_chain', { x: e.x, y: e.y + k * 0.1, size: k * 3.0, by: 'h', anc: 'b', tpf: 3, delay: i * 5, flip: i % 2 === 1 }, () => fx('b_izanami', 'izanami_thunder', { x: e.x, y: e.y, size: k * 2.6, by: 'h', anc: 'b', tpf: 3, delay: i * 5 })); PY.dmg(P, e, i ? 0.6 : 0.9, { ch: 'autonomous' }); }); } finally { inFx--; } if (L.length) say(P.x, P.y - HH(P.y) * 1.3, '連雷', '#c9b8ff'); }

  /* ---------- 主角受傷：白丸鎮守／反震、潮音護、賴光護主 ---------- */
  const ht0 = PY.heroTaken; PY.heroTaken = G.PEV.heroTaken = function (d, src, isProj) { const g = PY.hg, n0 = g ? g.n : 0; let r = ht0.apply(this, arguments);
    try { const sh = find('shiro'); if (!alive(src)) { src = null; let bd = 260; for (const e of G.E) { if (!alive(e)) continue; const q = dist(e, H) - (e.st === 'atk' ? 120 : 0); if (q < bd) { bd = q; src = e; } } }   // 招式打到主角時沒有帶來源：找最近、正在出手的那隻
      if (g && g.P && g.P.id === 'shiro' && (PY.hg ? PY.hg.n : 0) < n0) { say(H.x, H.y - HH(H.y) * 1.25, '擋', '#f3d98a'); ward(22);
        if (has('shiro', 2) && alive(src) && sh) { inFx++; try { PY.dmg(sh, src, 1.5, { ch: 'autonomous', big: 1 }); } finally { inFx--; } if (!src.boss && !src.bb) src.kb = (src.kb || 0) + Math.sign(src.x - H.x || 1) * 8; nfx('fx_shiro_rebound', { x: src.x - Math.sign(src.x - H.x || 1) * HH(src.y) * 0.3, y: src.y - HH(src.y) * 0.5, size: HH(src.y) * 1.8, by: 'w', tpf: 3, flip: src.x < H.x }, () => fx('b_ibaraki', 'ibaraki_shock_wave', { x: src.x, y: src.y - HH(src.y) * 0.2, size: HH(src.y) * 1.4, by: 'h', tpf: 3, tint: '236,206,150' })); say(src.x, src.y - HH(src.y) * (src.ratio || 1) - 8, '反震', '#f3d98a'); } }
      if (r > 0 && sh && has('shiro', 1) && dist(sh, H) < 170) r = Math.max(1, Math.round(r * 0.9));
      if (r > 0 && veil > 0) { veil--; r = Math.max(1, Math.round(r * 0.5)); say(H.x, H.y - HH(H.y) * 1.25, '潮音護', '#9fe8e0'); nfx('fx_shion_veil', { x: H.x, y: H.y + HH(H.y) * 0.08, size: HH(H.y) * 1.5, by: 'h', anc: 'b', tpf: 4, fr: [3, 5] }, () => fx('p_shion_fx', 'freeze_snap', { x: H.x, y: H.y - HH(H.y) * 0.5, size: HH(H.y) * 1.3, by: 'h', tpf: 3, tint: '150,230,225' })); }
      const yo = find('yorimitsu'); if (r > 0 && yo && has('yorimitsu', 2) && alive(src) && dist(src, yo) < 420 && ready('yori', 240)) { const k = HH(src.y) * (src.ratio || 1);
        nfx('fx_yorimitsu_follow', { x: src.x, y: src.y - k * 0.5, size: k * 1.7, by: 'h', flip: yo.x > src.x, tpf: 3 }, () => fx('b_mb_zenki', 'zenki_cleave_slash', { x: src.x, y: src.y - k * 0.5, size: k * 1.5, by: 'h', flip: yo.x > src.x, tpf: 3, tint: '236,236,246' })); inFx++; try { PY.dmg(yo, src, 1.5, { ch: 'autonomous', big: 1 }); } finally { inFx--; } say(yo.x, yo.y - HH(yo.y) * 1.3, '護主', '#fff3d6'); }
    } catch (x) { }
    return r; };
  if (PY.hurt) { const ph0 = PY.hurt; PY.hurt = function (P, atk) { if (P && P.id === 'shiro' && has('shiro', 1)) arguments[1] = atk * 0.7; return ph0.apply(this, arguments); }; }
  { const ps0 = PY.stats; PY.stats = function (id) { const s = ps0.apply(this, arguments); if (id === 'yorimitsu' && has(id, 1) && s && !s._sp) { s.crit += 15; s._sp = 1; } return s; }; }

  /* ---------- 白丸的護盾（先用現有手繪圖頂著） ---------- */
  let wardT = 0; function ward(n) { const first = wardT <= 0; wardT = Math.max(wardT, n); if (!first || !AX()) return; const A = AX();
    if (G.ART2 && G.ART2.ok('fx_shiro_ward')) { const sz = () => HH(H.y) * 1.25, at = () => wardT > 0 ? [H.x + H.face * HH(H.y) * 0.5, H.y + HH(H.y) * 0.06, 0] : null;   /* r3.231.0：石獅護盾（先成形，再停在身前） */
      G.ART2.fx('fx_shiro_ward', { at, size: sz, by: 'h', anc: 'b', tpf: 4, fr: [0, 2], fade: 0 }); G.ART2.fx('fx_shiro_ward', { at, size: sz, by: 'h', anc: 'b', tpf: 9, fr: [3, 4], loop: 40, delay: 12 }); return; }
    A.play('b_mb_komakin', 'komakin_mirror_a', { at: () => wardT > 0 ? [H.x + H.face * HH(H.y) * 0.45, H.y - HH(H.y) * 0.5, 0] : null, size: () => HH(H.y) * 1.15, by: 'h', loop: 40, tpf: 5, tint: '236,206,150', a: 0.85, fb: () => { } }); }

  /* ---------- 每格 ---------- */
  let seenHg = null;
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); if (G.mode !== 'play' || SC.trans) return; try {
      if (wardT > 0) wardT--;
      const g = PY.hg; if (g && g !== seenHg && g.P && g.P.id === 'shiro') { seenHg = g; g.t = Math.max(g.t, 360); g.n = Math.max(g.n, 2); ward(360); say(g.P.x, g.P.y - HH(g.P.y) * 1.2, '護衛', '#f3d98a'); } if (!g) { seenHg = null; if (wardT > 30) wardT = 0; }
      for (const P of PY.list || []) if (P.lg > 0) { P.lg--; const t = P.tg; if (alive(t) && Math.abs(t.x - P.x) > 26) { const nx = P.x + Math.sign(t.x - P.x) * 2.4; if (SC.walkable(nx, P.y)) P.x = nx; } }
      if (G.t % 15) return; const foes = G.E.filter(alive); for (const e of G.E) if (e._pvT > 0 && (e._pvT -= 15) <= 0 && e.db) e.db.vuln = Math.max(0, (e.db.vuln || 0) - 15);
      for (const e of G.E) if (e._hmk > 0) e._hmk -= 15;
      { const ib = find('ibaraki'); if (rageT > 0) rageT -= 15; if (ib && has('ibaraki', 2) && ib.hpMax && ib.hp > 0 && ib.hp < ib.hpMax * 0.5 && foes.length && rageT <= 0) { rageT = 900; nfx('fx_ibaraki_rage', { size: HH(ib.y) * 1.6, by: 'h', anc: 'b', tpf: 4, at: () => [ib.x, ib.y + HH(ib.y) * 0.08, 0] }); say(ib.x, ib.y - HH(ib.y) * 1.3, '逆境', '#ff8a7a'); }   /* r3.231.0：茨木血量過半以下，鬼氣爆發 */
        const sh = find('shiro'); if (sh && sh.taunt > 0 && G.t % 60 === 0) for (const e of foes) if (dist(e, sh) < 230) { const k = HH(e.y) * (e.ratio || 1); nfx('mark_taunt', { tpf: 58, size: HH(e.y) * 0.32, by: 'h', at: () => alive(e) ? [e.x, e.y - k * 1.12, 0] : null }); } }   /* 被白丸引走的敵人頭上掛鈴 */
      if (!foes.length) return;
      const hy = find('hayate'); if (hy && has('hayate', 2) && alive(hy.tg) && ready('mark', 720)) { const e = hy.tg, k = HH(e.y); e._hmk = 600; nfx('fx_hayate_mark', { tpf: 8, loop: 18, size: k * 0.55, by: 'h', anc: 'b', at: () => alive(e) && e._hmk > 0 ? [e.x, e.y - k * (e.ratio || 1) * 1.05, 0] : null }, () => fx('p_hayate_fx', 'read_mark', { tpf: 3, size: k * (e.ratio || 1) * 1.7, at: () => alive(e) ? [e.x, e.y - k * (e.ratio || 1) * 0.5, 0] : null, hold: 30 })); say(hy.x, hy.y - HH(hy.y) * 1.3, '看破', '#bfe8ff'); }
      const kz = find('kuzuha'); if (kz && has('kuzuha', 2) && foes.some(e => dist(e, H) < 190) && ready('kzfield', 900)) { for (const e of foes) if (dist(e, H) < 190) { e.db = e.db || {}; e.db.slow = Math.max(e.db.slow || 0, 1); e.slowT = Math.max(e.slowT || 0, 240); nfx('fx_kuzuha_bind', { size: HH(e.y) * 1.5, by: 'w', tpf: 6, loop: 6, layer: 'g', fin: 6, fade: 12, at: () => alive(e) ? [e.x, e.y, 0] : null }, () => fx('b_kyubi', 'kyubi_fox_fire', { x: e.x, y: e.y - HH(e.y) * 0.3, size: HH(e.y) * 0.9, by: 'h', tpf: 4, loop: 2 })); } nfx('fx_kuzuha_cleanse', { size: HH(H.y) * 1.5, by: 'h', tpf: 4, at: () => [H.x, H.y - HH(H.y) * 0.55, 0] }); say(kz.x, kz.y - HH(kz.y) * 1.3, '狐火結界', '#9fd8ff'); }
      const en = find('enno'); if (en && has('enno', 2) && ready('shiki', 480)) { const L = foes.filter(e => dist(e, en) < 420).sort((a, b) => dist(a, en) - dist(b, en)).slice(0, 2);
        L.forEach((e, i) => { const k = HH(e.y) * (e.ratio || 1); G.STORY.later(i * 14 + 2, () => { if (!alive(e) || !find('enno')) return; nfx(i ? 'fx_goki_claw' : 'fx_zenki_claw', { x: e.x, y: e.y - k * 0.5, size: k * 1.6, by: 'h', flip: i === 1, tpf: 3 }, () => fx('fx_common', 'weapon_claw_a', { x: e.x, y: e.y - k * 0.5, size: k * 1.5, by: 'h', flip: i === 1, tpf: 3, tint: i ? '110,160,255' : '255,110,90' })); inFx++; try { PY.dmg(en, e, 1.2, { ch: 'autonomous', big: 1 }); } finally { inFx--; } say(e.x, e.y - k - 8, i ? '後鬼' : '前鬼', i ? '#9fc0ff' : '#ff9a86'); }); }); }
      const so = find('shion'); if (so) { const hm = H.hpMax || 1;
        if (has('shion', 1) && H.hp > 0 && H.hp < hm * 0.4 && ready('aid', 1200)) { const v = Math.round(hm * 0.15); H.hp = Math.min(hm, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH(H.y) - 10, v: '+' + v, t: 0, pop: G.t, col: '#8fe89a', txt: 1 }); nfx('fx_shion_heal', { size: HH(H.y) * 1.5, by: 'h', tpf: 5, at: () => [H.x, H.y - HH(H.y) * 0.5, 0] }, () => fx('p_shion_fx', 'heal_main', { x: H.x, y: H.y - HH(H.y) * 0.5, size: HH(H.y) * 1.6, by: 'h', tpf: 4 })); say(so.x, so.y - HH(so.y) * 1.3, '急救', '#8fe89a'); }
        if (has('shion', 2) && veil <= 0 && ready('veil', 1080)) { veil = 2; nfx('fx_shion_veil', { size: HH(H.y) * 1.5, by: 'h', anc: 'b', tpf: 6, fr: [0, 3], hold: 20, at: () => [H.x, H.y + HH(H.y) * 0.08, 0] }, () => fx('p_shion_fx', 'heal_main', { x: H.x, y: H.y - HH(H.y) * 0.5, size: HH(H.y) * 1.3, by: 'h', tpf: 4, tint: '150,230,225' })); say(so.x, so.y - HH(so.y) * 1.3, '潮音護', '#9fe8e0'); } }
    } catch (x) { console.warn('pskill', x); } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { veil = 0; wardT = 0; if (AX()) AX().pre(['fx_common', 'b_ibaraki', 'b_izanami', 'b_mb_zenki', 'p_shion_fx', 'p_hayate_fx', 'b_kyubi', 'b_mb_komakin'].filter((u, i) => i < 2 || true)); return en0(id); };

  /* ---------- 夥伴頁「屬性」分頁下方：專長 ---------- */
  const M = G.MENU; if (M && M.PAGE && M.PAGE['夥伴']) { const pg0 = M.PAGE['夥伴']; M.PAGE['夥伴'] = function (x, y, w, h) { pg0.call(this, x, y, w, h);
      try { if ((M.sel.ptab || 0) !== 3) return; const ids = Object.keys(PY.DEF), id = ids[Math.min(ids.length - 1, M.sel.pt || 0)]; if (!PY.joined(id) || !SK[id]) return;
        const lw = Math.min(200, w * 0.32), cx = x + lw + 8, fs = G.FS(), C = G.C; SK[id].forEach((s, i) => { const on = has(id, i + 1), yy = y + h - (27 - i * 16);
          G.txt('專長' + (i ? '二' : '一') + '（Lv' + (i ? 50 : 20) + '）　' + s[0] + '：' + s[1] + (on ? '' : '　〔未開放〕'), cx + 14, yy, 10.5, on ? '#ffd65a' : C.dim, 'left', G.FONT, on ? 700 : 500); }); } catch (e) { } }; }
})();
