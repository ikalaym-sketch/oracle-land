/* ==========================================================================
 * 神諭之地 重製版 — 85_normal.js
 * Version : r3.37.0  (2026-11-17)  r3.37.0：鐵砲普攻槍火交給 c.muzzle
 * 變更    : r3.36.0 新增。普攻連打重做（打刀不動）：野太刀、薙刀、槍、和弓、鐵砲。
 *           ・照打刀普攻的做法：刀幕／突刺／箭／彈由程式特效畫出，命中時頓幀＋震動＋斬痕（VX.impact），最後一段最重。
 *           ・判定時間沿用原動作的出手格（ev.at），傷害倍率沿用原表（ev.damage÷16），距離換算為身高單位。
 *           ・箭與子彈從弓弦／槍口的逐格錨點射出（77 c.shoot）。
 *           做法：主角每格結束後，若剛開始的是普攻，就把原本的判定事件清掉、改掛 MV2 時間軸（a.mvx），不進秘傳連段紀錄。
 * 依賴    : 03_actors（heroStep）、77_moves（a.mvx 時間軸、c.slash／thrust／shoot／hit）、76_vfx、84_fxkit（VX.spr／crack）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, W = G.WPN; if (!MV2 || !VX) return;
  const ND = { col: '255,205,130', edge: '255,248,225' }, NG = { col: '150,235,205', edge: '235,255,248' }, YR = { col: '190,215,255', edge: '255,255,255', tip: '255,225,140' };
  const at = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? e.at : 8; }, dm = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e && e.damage ? e.damage / 16 : 1; };
  const rib = (c, P, o) => c.slash(Object.assign({ hf: 1, sw: 4, life: 14, trail: 2.4, shat: 6, col: P.col, edge: P.edge }, o));
  const N = {};
  /* ---------- 野太刀：大弧、慢、重；第 3 段劈地 ---------- */
  N.nodachi = [
    { run(c, t) { const f = at(c); if (t === f - 3) rib(c, ND, { a0: -2.3, a1: 1.0, sq: 0.62, rot: -0.15, r: 1.45, w: 0.5, sw: 5, ew: 1.5, m: dm(c), lv: 'mid', arc: 2.4, hr: 1.5, cutAng: -0.9 }); if (t > f - 4 && t < f) c.move(0.04, 0); } },
    { run(c, t) { const f = at(c); if (t === f - 3) rib(c, ND, { a0: 1.2, a1: -2.2, sq: 0.55, rot: 0.2, r: 1.45, w: 0.5, sw: 5, ew: 1.5, m: dm(c), lv: 'mid', arc: 2.4, hr: 1.5, cutAng: 0.9 }); if (t > f - 4 && t < f) c.move(0.04, 0); } },
    { run(c, t) { const f = at(c); if (t === f - 6) VX.glow({ x: c.x, y: c.y, z: 1.3, r: 0.5, col: '255,215,150', life: 8 });
        if (t === f - 3) rib(c, ND, { a0: -2.0, a1: 0.85, sq: 1, r: 1.55, w: 0.62, sw: 4, ew: 1.8, shat: 10, m: 0 });
        if (t === f) { const x = c.x + c.f * 1.05 * c.hh; VX.crack({ x, y: c.y, r: 1.0 }); VX.ring({ x, y: c.y, r1: 1.4, life: 14, col: '255,225,170', lw: 0.08 }); G.SC.shake = Math.max(G.SC.shake || 0, 6);
          c.hit({ shape: 'circle', x, y: c.y, r: 1.0, m: dm(c), lv: 'heavy', kind: 'blunt', kb: 1.2 }); } } }
  ];
  /* ---------- 薙刀：長柄大掃、帶風；收尾迴旋／挑落 ---------- */
  const sweep = (c, a0, a1, rot, m, lv) => { rib(c, NG, { a0, a1, sq: 0.42, rot, r: 1.6, w: 0.34, sw: 5, ew: 1.4, m, lv, arc: 2.8, hr: 1.65 }); VX.wind({ x: c.x, y: c.y, r: 1.4, n: 3, life: 14, col: '200,255,235', face: c.f, spin: 0.3 }); };
  N.naginata = [
    { run(c, t) { const f = at(c); if (t === f - 3) sweep(c, -2.6, 1.2, -0.1, dm(c), 'mid'); } },
    { run(c, t) { const f = at(c); if (t === f - 3) sweep(c, 1.3, -2.6, 0.12, dm(c), 'mid'); } },
    { run(c, t) { const f = at(c); if (t === f - 4) { rib(c, NG, { a0: -Math.PI, a1: Math.PI * 1.03, sq: 0.4, r: 1.5, w: 0.32, sw: 7, life: 16, trail: 4, shape: 'circle', hr: 1.6, m: dm(c), lv: 'heavy' });
          VX.spr({ n: 'skill_wind_vortex_b', x: c.x, y: c.y, z: 0.55, w: 2.4, sy: 0.55, add: 1, a: 0.6, life: 18 }); MV2.leaves && MV2.leaves(c, 4); } } },
    { run(c, t) { const f0 = at(c, 0), f1 = at(c, 1); if (t === f0 - 3) rib(c, NG, { a0: 1.2, a1: -1.9, sq: 0.9, rot: 0.3, r: 1.5, w: 0.32, m: dm(c, 0), lv: 'mid', launch: 24, arc: 2.2 });
        if (t === f1 - 3) { rib(c, NG, { a0: -2.0, a1: 0.9, sq: 1, r: 1.6, w: 0.42, sw: 4, ew: 1.6, shat: 9, m: 0 }); }
        if (t === f1) { const x = c.x + c.f * 1.1 * c.hh; VX.crack({ x, y: c.y, r: 0.85 }); VX.wind({ x, y: c.y, r: 1.0, n: 5, life: 16, col: '200,255,235', face: c.f, spin: 0.5 }); c.hit({ shape: 'circle', x, y: c.y, r: 1.0, m: dm(c, 1), lv: 'heavy', kind: 'cut', kb: 1 }); } } }
  ];
  /* ---------- 槍：直刺、快；收尾三連刺／長驅貫穿 ---------- */
  const thr = (c, o) => c.thrust(Object.assign({ len: 1.8, w: 0.2, cy: 0.55, ext: 2, life: 10, col: YR.col, edge: YR.edge, tip: YR.tip, hf: 1, lines: 2 }, o));
  N.yari = [
    { run(c, t) { const f = at(c); if (t > f - 4 && t < f) c.move(0.05, 0); if (t === f - 1) thr(c, { m: dm(c), lv: 'mid', ang: 0.02 }); } },
    { run(c, t) { const f = at(c); if (t > f - 4 && t < f) c.move(0.05, 0); if (t === f - 1) thr(c, { m: dm(c), lv: 'mid', ang: -0.08, cy: 0.62 }); } },
    { run(c, t) { const f = at(c); [-6, -3, 0].forEach((d, i) => { if (t === f + d) thr(c, { len: 1.85, w: 0.16, life: 7, ext: 1, ang: [0.06, -0.06, 0][i], m: dm(c) * 0.45, lv: i === 2 ? 'heavy' : 'light', lines: 1 }); }); } },
    { run(c, t) { const f = at(c); if (t > f - 6 && t < f) { c.move(0.12, 0); if (t % 2) c.ghost(8); } if (t === f - 1) { thr(c, { len: 2.4, w: 0.28, life: 14, ext: 3, m: dm(c), lv: 'heavy', kb: 1.4 });
          VX.spr({ n: 'fx_tier_yari_master', x: c.x + c.f * 1.6 * c.hh, y: c.y, z: 0.55, w: 1.9, flip: c.f < 0, add: 1, life: 14 }); VX.streak({ x: c.x, y: c.y, face: c.f, len: 2.2, n: 6, life: 10, cy: 0.55 }); } } }
  ];
  /* ---------- 和弓：從弓弦錨點放箭；收尾重箭貫穿 ---------- */
  const loose = (c, big) => { c.muzzle(false, 0); const mz = W.muzzle && W.muzzle(); if (mz) VX.spr({ n: big ? 'fx_tier_yumi_master' : 'fx_tier_yumi_evolved', x: mz[0] + c.f * 0.3 * c.hh, y: c.y, z: (c.y - mz[1]) / c.hh, w: big ? 1.1 : 0.8, flip: c.f < 0, add: 1, a: 0.7, life: 10 }); };
  N.yumi = [
    { run(c, t) { if (t === at(c)) { loose(c); c.shoot('arrow', { m: dm(c), spd: 0.45, range: 9, lv: 'mid', trail: 5 }); } } },
    { run(c, t) { if (t === at(c)) { loose(c); c.shoot('arrow', { m: dm(c), spd: 0.45, range: 9, lv: 'mid', ang: -0.03, trail: 5 }); } } },
    { run(c, t) { if (t === at(c) - 8) VX.glow({ x: c.x + c.f * 0.4 * c.hh, y: c.y, z: 0.8, r: 0.35, col: '255,235,180', life: 10 });
        if (t === at(c)) { loose(c, 1); const p = c.shoot('bigarrow', { m: dm(c), spd: 0.6, range: 11, pierce: 3, lv: 'heavy', trail: 9, kb: 0.8 });
          VX.custom((o, ctx) => { if (p.dead) { o.t = o.life; return; } if (o.t % 3 === 0) VX.wind({ x: p.x, y: p.y, r: 0.35, n: 1, life: 10, col: '255,245,220', face: Math.sign(p.vx), spin: 0.2 }); }, 40, 'o'); } } }
  ];
  /* ---------- 鐵砲：單發重彈（槍口火焰＋硝煙）；收尾近膛散擊 ---------- */
  const fire = (c, big) => { c.muzzle(big, 0);   // r3.37.0：槍口火焰＋硝煙由 c.muzzle（第二代素材）負責
    VX.shard({ x: c.x + c.f * 0.35 * c.hh, y: c.y, z: 0.62, n: 1, col: '230,190,90', life: 26 }); G.SC.shake = Math.max(G.SC.shake || 0, big ? 5 : 3); };
  N.teppo = [
    { run(c, t) { const f = at(c); if (t === f) { fire(c); c.shoot('bullet', { m: dm(c), spd: 0.75, range: 8, lv: 'mid', kb: 0.3 }); } if (t > f && t < f + 5) c.move(-0.03, 0); } },
    { run(c, t) { const f = at(c); if (t === f) { fire(c, 1); for (let i = 0; i < 5; i++) c.shoot('pellet', { m: dm(c) * 0.32, ang: (i - 2) * 0.2, spd: 0.55, range: 3.4, kb: 0.6, lv: 'heavy' }); VX.smoke({ x: c.x + c.f * 1.2 * c.hh, y: c.y, z: 0.6 * c.hh, n: 4, vx: c.f * 0.8, r: 0.2, life: 50, a: 0.4 }); }
        if (t > f && t < f + 7) c.move(-0.06, 0); } }
  ];
  MV2.N = N;
  /* ---------- 接管：普攻開始的那一格換成時間軸 ---------- */
  (function wait() { if (!G.heroStep || !G.SKB || !MV2.U) return setTimeout(wait, 20);
    const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments); const a = H.act;
      if (a && a.kind === 'atk' && !a.mvx && !a._n) { a._n = 1; const L = N[W.curId()], i = W.cur().combo.indexOf(a.name), d = L && L[i];
        if (d && H.t <= 2) { a.ev0 = a.ev; a.ev = []; a.ei = 0; a.face0 = H.face; a.mvx = { def: d, mul: a.mult || 1, fin: false, hiden: false, hit: 0, rec: 1, lv: 1, norm: 1 }; } }
      return r; }; })();
})();
