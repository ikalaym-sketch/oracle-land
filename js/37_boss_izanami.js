/* ==========================================================================
 * 神諭之地 重製版 — 37_boss_izanami.js
 * Version : r3.205.0  (2026-11-28)　r3.205.0：修正伊邪那美身體動畫每格的左右對位（不再抖）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 主角參照改為 G.BTGT（頭目依仇恨鎖定主角或夥伴；範圍招兩者都會判定）。
 * 變更    : r3.9.0 新增。第十一章頭目「伊邪那美」（第十一章頭目地圖 W_R11_05），P3 原圖（白衣女神，面向右）。
 *           ‧ 場上三棵桃樹：必殺時桃樹發光，站進桃光就不受千人之詛。身邊常駐三團鬼火。
 *           ‧ 招式：八雷神（由女神往主角方向連落 8 道雷）／鬼火（三團鬼火慢速追人，3 秒後重生）／黃泉之霧（主角附近 3 團霧 6 秒：減速＋持續傷害）／
 *                   醜女召喚（二階，同時最多 3 隻）／黃泉的悲嘆（二階：1.2 秒預告後檢查 3 次，面向女神＝受傷，背向就沒事）／
 *                   黃泉軍（二階、地獄以上：一列 3 隻黃泉兵）／必殺・千人之詛（三階：3.5 秒後詛咒全場，站在桃光內安全；之後破綻 2.5 秒）／
 *                   無間・黃泉比良坂・三段回眸（四階：①避開雷路 ②背向女神 ③進桃光；三段全過＝破綻 6 秒，否則 3 秒）。
 *           ‧ 頭頂提示：悲嘆時主角頭上顯示「背」（安全）／「目」（正看著女神）。
 * 依賴    : 26_boss（G.BOSS.reg／api 與掛勾）、03_actors（spawnOni、hurtHero）、敵人 shikome（醜女）、yomigun（黃泉兵）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BOSS; if (!B) return;
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM;
  const { play, fx, circle, hit, walkTo, S, rnd, sgn, begin, TK, HH } = B.api;
  const N = 'izanami', U = () => A.get('b_izanami'), R = enc => enc.units[0];
  const near = (x, y, r) => Math.hypot(H.x - x, (H.y - y) * 1.6) < r;
  const looking = e => H.face === (sgn(e.x - H.x) || H.face);             // 主角正面向女神
  const inPeach = v => v.peaches.some(p => near(p.lx, p.ly, p.r));
  const bolt = (e, x, y) => fx(e, N + '_thunder', x, y - HH() * 1.1, { s: HH() * 2.4 / 256 });
  const MV = {
    /* 八雷神：預兆 0.8s（8 個落點圈，往主角方向排）→ 每 0.12s 落一道雷；整招最多中一次 */
    thunder: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'thunder'); const dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy) || 1; m.p = [];
        for (let i = 0; i < 8; i++) { const k = HH() * (1.2 + i * 0.85), x = e.x + dx / d * k, y = e.y + dy / d * k * 0.75; m.p.push([x, y]); circle(x, y, HH() * 0.7, S(0.8) + i * 7, '200,170,255'); } },
      step(e, m) { for (let i = 0; i < 8; i++) if (m.t === S(0.8) + i * 7) { const [x, y] = m.p[i]; bolt(e, x, y); if (!m.hit && near(x, y, HH() * 0.7) && hit(e, 1.0)) m.hit = 1; }
        return m.t > S(0.8) + 56 + S(0.5); } },
    /* 鬼火：三團鬼火射出，慢速追人 3s（碰到＝傷害）；3s 後回到女神身邊 */
    wisps: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'wisps'); },
      step(e, m) { const v = e.enc.v; if (m.t === S(0.45) && !v.wOut) { v.wOut = S(3); for (let i = 0; i < 3; i++) { const a = v.t * 0.05 + i * 2.094; v.shots.push({ x: e.x + Math.cos(a) * HH() * 0.8, y: e.y - HH() * 0.9 + Math.sin(a) * HH() * 0.3, t: -i * 12, life: S(3) }); } }
        return m.t > S(1.0); } },
    /* 黃泉之霧：主角附近 3 團霧（預兆 0.8s）→ 6s：減速 30%＋每 0.5s 傷害 */
    mist: { go(e, m) { e.face = sgn(H.x - e.x) || e.face; play(e, 'mist'); m.p = [[H.x, H.y], [H.x + HH() * 1.8, H.y + 30], [H.x - HH() * 1.8, H.y - 30]]; for (const [x, y] of m.p) circle(x, y, HH() * 1.2, S(0.8), '150,170,140'); },
      step(e, m) { if (m.t === S(0.8)) for (const [x, y] of m.p) e.enc.v.mists.push({ x, y, r: HH() * 1.2, t: 0, life: S(6) }); return m.t > S(1.2); } },
    /* 醜女召喚（二階，同時最多 3 隻） */
    summon: { go(e, m) { play(e, 'summon'); },
      step(e, m) { if (m.t === S(0.5)) { const v = e.enc.v; v.kids = v.kids.filter(k => k.st !== 'dead'); v.waves++;
          for (let i = 0; i < Math.min(2, 3 - v.kids.length); i++) { const p = SC.snap(e.x + (i ? 1 : -1) * HH() * 1.8, e.y + (i ? 30 : -30), 'open', 200) || [e.x, e.y]; fx(e, N + '_summon_gate', p[0], p[1] - HH() * 0.6, { s: HH() * 1.8 / 256 }); const k = G.spawnOni(p[0], p[1], 30, Math.max(1, e.lv - 4), 'shikome'); if (k) v.kids.push(k); } }
        return m.t > S(1.0); } },
    /* 黃泉的悲嘆（二階）：預告 1.2s → 1.2／1.7／2.2s 各檢查一次：面向女神＝受傷 */
    lament: { go(e, m) { play(e, 'lament'); G.UI.toast('黃泉的悲嘆——背向伊邪那美！'); e.enc.v.gaze = 1; },
      step(e, m) { for (const t of [1.2, 1.7, 2.2]) if (m.t === S(t)) { fx(e, N + '_lament_echo', e.x, e.y - HH() * 0.8, { s: HH() * 3.2 / 256 }); if (looking(e)) hit(e, 0.6); }
        if (m.t === S(2.3)) e.enc.v.gaze = 0; return m.t > S(2.6); },
      stop(e) { e.enc.v.gaze = 0; } },
    /* 黃泉軍（二階、地獄以上）：一列 3 隻黃泉兵（同時最多 3 隻） */
    army: { go(e, m) { play(e, 'summon'); fx(e, N + '_decree', e.x, e.y, { s: HH() * 2.4 / 256 }); },
      step(e, m) { if (m.t === S(0.6)) { const v = e.enc.v; v.army = v.army.filter(k => k.st !== 'dead');
          for (let i = 0; i < 3 - v.army.length; i++) { const p = SC.snap(H.x + sgn(e.x - H.x) * HH() * 2.6, H.y + (i - 1) * 45, 'open', 160) || [e.x, e.y]; fx(e, N + '_summon_gate', p[0], p[1] - HH() * 0.6, { s: HH() * 1.6 / 256 }); const k = G.spawnOni(p[0], p[1], 30, Math.max(1, e.lv - 5), 'yomigun'); if (k) v.army.push(k); } }
        return m.t > S(1.1); } },
    /* 必殺・千人之詛（三階）：桃樹發光 → 3.5s 後詛咒全場（不在桃光＝重擊＋詛咒減速 4s）→ 回氣破綻 2.5s */
    ult: { go(e, m) { play(e, 'ultimate'); G.UI.banner('必殺・千人之詛', '站進桃光！'); e.enc.v.light = S(3.5); },
      step(e, m) { const v = e.enc.v;
        if (m.t === S(3.5)) { fx(e, N + '_curse', H.x, H.y - HH() * 0.6, { s: HH() * 2.4 / 256 }); if (!inPeach(v)) { if (hit(e, 2.2)) { v.cursed = S(4); G.UI.toast('被詛咒了——行動變慢'); } } else G.UI.toast('桃光擋下了詛咒'); v.light = 0; play(e, 'recover'); e.open = S(2.5); }
        return m.t > S(3.7); },
      stop(e) { e.enc.v.light = 0; } },
    /* 無間・黃泉比良坂・三段回眸（四階） */
    hirasaka: { go(e, m) { play(e, 'hirasaka'); G.UI.banner('黃泉比良坂', '避雷 → 背向 → 入桃光'); m.ok = 0; m.seg = 0; m.t0 = 0; seg(e, m); },
      step(e, m) { const v = e.enc.v, k = m.t - m.t0;
        if (m.seg === 1 && k === S(1.6)) { for (const L of m.rows) for (let i = -4; i <= 4; i++) bolt(e, H.x + i * HH() * 1.1 + (L.y % 37), L.y); const bad = m.rows.some(L => Math.abs(H.y - L.y) < HH() * 0.35); if (bad) hit(e, 1.1); else m.ok++; nextSeg(e, m); }
        else if (m.seg === 2 && k === S(2.0)) { fx(e, N + '_lament_echo', e.x, e.y - HH() * 0.8, { s: HH() * 3.2 / 256 }); if (looking(e)) hit(e, 0.9); else m.ok++; v.gaze = 0; nextSeg(e, m); }
        else if (m.seg === 3 && k === S(2.5)) { fx(e, N + '_curse', H.x, H.y - HH() * 0.6, { s: HH() * 2.4 / 256 }); if (inPeach(v)) m.ok++; else hit(e, 1.6); v.light = 0; m.seg = 4; m.t0 = m.t;
          play(e, 'recover'); e.open = S(m.ok >= 3 ? 6 : 3); if (m.ok >= 3) { v.wPause = S(6); G.UI.toast('三段回眸全數應對——女神長回氣！'); } }
        return m.seg === 4 && k > S(0.6); },
      stop(e) { const v = e.enc.v; v.gaze = 0; v.light = 0; v.rows = null; } }
  };
  function nextSeg(e, m) { m.seg++; m.t0 = m.t; seg(e, m); }
  function seg(e, m) { const v = e.enc.v; if (m.seg === 0) m.seg = 1;
    if (m.seg === 1) { const y0 = H.y; m.rows = [{ y: y0 }, { y: y0 + (Math.random() < 0.5 ? 1 : -1) * HH() * 1.5 }]; v.rows = m.rows; play(e, 'thunder'); G.UI.toast('① 雷路——離開紫線！'); }
    if (m.seg === 2) { v.rows = null; v.gaze = 1; play(e, 'lament'); G.UI.toast('② 悲嘆——背向女神！'); }
    if (m.seg === 3) { v.light = S(2.5); play(e, 'ultimate'); G.UI.toast('③ 詛咒——進桃光！'); } }

  function director(enc) {
    const e = R(enc), v = enc.v; if (!e || e.st === 'dead') return;
    v.t++; if (e.inv > 0) e.inv--; if (e.open > 0) e.open--; if (v.light > 0) v.light--; if (v.wPause > 0) v.wPause--; for (const k in v.cd) if (v.cd[k] > 0) v.cd[k]--;
    if (v.wOut > 0) v.wOut--;
    for (const s of v.shots) { s.t++; if (s.t < 0) continue; const dx = H.x - s.x, dy = H.y - HH() * 0.5 - s.y, d = Math.hypot(dx, dy) || 1; s.x += dx / d * 2.6; s.y += dy / d * 2.0;
      if (d < HH() * 0.45) { s.t = s.life; hit(e, 0.8); } }
    v.shots = v.shots.filter(s => s.t < s.life);
    let slow = v.cursed > 0 ? 0.6 : 1; if (v.cursed > 0) v.cursed--;
    for (const z of v.mists) { z.t++; if (near(z.x, z.y, z.r)) { slow = Math.min(slow, 0.7); if (z.t % 30 === 0) hit(e, 0.25); } } v.mists = v.mists.filter(z => z.t < z.life);
    if (slow < 1 && v.px !== undefined && !(H.act && H.act.kind === 'dodge')) { H.x = v.px + (H.x - v.px) * slow; H.y = v.py + (H.y - v.py) * slow; }
    v.px = H.x; v.py = H.y;
    const hp = e.hp / e.hpMax, ph = enc.diff >= 3 && hp < 0.15 ? 4 : hp < 0.33 ? 3 : hp < 0.66 ? 2 : 1;
    if (ph > v.ph && !e.mv) { v.ph = ph; e.inv = S(1.5); play(e, 'lament'); fx(e, N + '_lament_echo', e.x, e.y - HH() * 0.8, { s: HH() * 3.2 / 256 }); G.UI.toast(['', '', '伊邪那美　黃泉的悲嘆', '伊邪那美　千人之詛', '黃泉比良坂'][ph]);
      if (ph === 3) v.cd.ult = S(2.4); if (ph === 4) v.cd.hirasaka = S(2.0); enc.cd = S(2.0); return; }
    if (e.mv || e.st === 'hurt') return;
    if (e.open > 0) { if (e.an !== 'recover' && e.an !== 'idle') play(e, 'idle', true); return; }
    if (enc.cd > 0) { enc.cd--; keep(e); return; }
    let k;
    if (v.ph >= 4 && !(v.cd.hirasaka > 0)) { k = 'hirasaka'; v.cd.hirasaka = S(24); }
    else if (v.ph >= 3 && !(v.cd.ult > 0)) { k = 'ult'; v.cd.ult = S(22); }
    else { const L = ['thunder', 'thunder', 'mist'];
      if (!(v.wOut > 0) && !(v.wPause > 0)) L.push('wisps', 'wisps'); if (v.mists.length) L.splice(L.indexOf('mist'), 1);
      if (v.ph >= 2) { if (!(v.cd.lament > 0)) L.push('lament', 'lament'); if (v.waves < 3 && v.kids.filter(x => x.st !== 'dead').length < 3 && !(v.cd.summon > 0)) L.push('summon');
        if (enc.diff >= 2 && !(v.cd.army > 0) && v.army.filter(x => x.st !== 'dead').length < 3) L.push('army'); }
      k = L[Math.floor(Math.random() * L.length)]; if (k === 'lament') v.cd.lament = S(10); if (k === 'summon') v.cd.summon = S(18); if (k === 'army') v.cd.army = S(20); }
    begin(e, k); enc.cd = S(v.ph === 1 ? rnd(1.0, 1.5) : rnd(0.7, 1.1));
  }
  function keep(e) { const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.5), want = HH() * 3.2;   // 術士：保持距離
    if (d > want * 1.25 || d < want * 0.6) { if (e.an !== 'glide') play(e, 'glide', true); const s = d < want * 0.6 ? -1 : 1; walkTo(e, H.x - sgn(H.x - e.x) * want * (s > 0 ? 0.9 : 1.2), H.y + (s > 0 ? 0 : 20), 1.6); }
    else if (e.an !== 'idle') play(e, 'idle', true); if (e.an === 'idle') e.face = sgn(H.x - e.x) || e.face; }

  /* ---------- 繪製 ---------- */
  function drawUnder(enc) { const v = enc.v, u = U(); if (!u) return;
    const mf = u.act[N + '_mist'];
    for (const z of v.mists) { const a = Math.min(1, z.t / 10, (z.life - z.t) / 15); ctx.save(); ctx.fillStyle = `rgba(120,140,110,${0.28 * a})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.45, 0, 0, 6.283); ctx.fill(); ctx.restore();
      A.draw(u, A.frameAt(Object.assign({}, mf, { loop: true }), z.t * TK), z.x, z.y, z.r * 2.2 / 256, false, a * 0.85); }
    if (v.rows) { ctx.save(); ctx.fillStyle = `rgba(190,150,255,${0.18 + 0.12 * Math.sin(v.t * 0.4)})`; ctx.strokeStyle = 'rgba(200,160,255,.8)'; ctx.lineWidth = 2;
      for (const L of v.rows) { ctx.fillRect(H.x - 900, L.y - HH() * 0.22, 1800, HH() * 0.44); ctx.strokeRect(H.x - 900, L.y - HH() * 0.22, 1800, HH() * 0.44); } ctx.restore(); }
    const pl = u.act[N + '_peach_light'];
    for (const p of v.peaches) { if (v.light > 0) { A.draw(u, A.frameAt(Object.assign({}, pl, { loop: true }), v.t * TK), p.lx, p.ly, p.r * 2.4 / 256, false, 0.9);
        ctx.save(); ctx.strokeStyle = `rgba(255,190,200,${0.6 + 0.3 * Math.sin(v.t * 0.3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.lx, p.ly, p.r, p.r * 0.42, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
      A.draw(u, u.act[N + '_peach'].f[0], p.x, p.y, HH() * 2.0 / 218, false, 1); } }
  function drawOver(enc) { const v = enc.v, u = U(), e = R(enc); if (!u || !e) return;
    const wf = u.act[N + '_wisp'], fr = A.frameAt(Object.assign({}, wf, { loop: true }), v.t * TK);
    if (e.st !== 'dead' && !(v.wOut > 0)) for (let i = 0; i < 3; i++) { const a = v.t * 0.05 + i * 2.094; A.draw(u, fr, e.x + Math.cos(a) * HH() * 0.8, e.y - HH() * 0.9 + Math.sin(a) * HH() * 0.3, HH() * 0.5 / 256, false, v.wPause > 0 ? 0.35 : 0.9); }
    for (const s of v.shots) if (s.t >= 0) A.draw(u, fr, s.x, s.y, HH() * 0.7 / 256, false, Math.min(1, (s.life - s.t) / 10));
    if (v.gaze) { const lk = looking(e); G.txt(lk ? '目' : '背', H.x, H.y - HH() * 1.45, 14, lk ? '#ff6a6a' : '#9cf0a0', 'center'); }
    if (v.cursed > 0 && G.t % 30 < 18) G.txt('詛', H.x + 14, H.y - HH() * 1.3, 11, '#d070e0', 'center');
    if (e.open > 0 && e.st !== 'dead') G.txt('破綻！', e.x, e.y - HH() * e.size * 1.15, 12, '#ffd76a', 'center'); }

  B.reg('izanami', { name: '伊邪那美', sub: '黃泉津大神', unit: 'b_izanami', foes: ['shikome', 'yomigun'], hpK: 12, atkK: 1.6, nat: 1, dir: 'right3q', map: ['W_R11_05'],
    actors: [{ id: N, name: '伊邪那美', size: 1.3, moves: [] }], mv: MV, director, drawUnder, drawOver,
    init(enc) { const e = R(enc); const v = enc.v = { ph: 1, cd: { lament: S(4) }, peaches: [], mists: [], shots: [], kids: [], army: [], rows: null, gaze: 0, light: 0, cursed: 0, wOut: 0, wPause: 0, waves: 0, t: 0 };
      const cx = e.x - HH() * 1.6, cy = e.y;
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 1.0, p = SC.snap(cx + Math.cos(a) * HH() * 3.6, cy + Math.sin(a) * HH() * 1.7, 'open', 160) || SC.randSpot('open', null, v.peaches.map(q => [q.x, q.y]), HH() * 2.4);
        if (p) { const l = SC.snap(p[0], p[1] + HH() * 0.5, 'walk', 80) || p; v.peaches.push({ x: p[0], y: p[1], lx: l[0], ly: l[1], r: HH() * 1.0 }); } }
      enc.cd = S(1.2); },
    finish(enc) { const v = enc.v; for (const k of v.kids.concat(v.army)) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } v.mists = []; v.shots = []; v.rows = null; v.gaze = 0; v.light = 0; v.cursed = 0; },
    onDamage(e) { if (e.open > 0) { e.st = e.mv ? 'atk' : 'walk'; return true; } return false; } });
  /* r3.205.0：伊邪那美的身體動畫每一格的左右對位點有誤（圖集每往右一欄就多偏 8.6 像素，三欄一輪）→ 看起來一直左右抖。
   * 圖集載入後修正一次（只修 6 格的身體動畫 *_right3q；特效圖不動），頭目戰、內殿、對話登場都一起變穩。 */
  (function fixOx() { const A = G.ANIM; if (!A || !A.load) return setTimeout(fixOx, 50); const ld0 = A.load.bind(A); const fix = u => { if (!u || u._oxFix || !u.act) return u; u._oxFix = 1; for (const k in u.act) { const r = u.act[k]; if (!/_right3q$/.test(k) || !r || !r.f || r.f.length !== 6) continue; r.f.forEach((f, i) => { f[4] -= (i % 3) * 8.6; }); } return u; };
    A.load = function (key, json) { const p = ld0(key, json); return key === 'b_izanami' && p && p.then ? p.then(fix) : p; }; const u0 = A.get && A.get('b_izanami'); if (u0) fix(u0); })();
})();
