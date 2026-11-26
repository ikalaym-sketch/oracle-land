/* ==========================================================================
 * 神諭之地 重製版 — 128_bunshin.js
 * Version : r3.101.0  (2026-11-26)
 * 變更    : r3.101.0 新增。身法「分身」（所有武器）。
 *           ・後跳：每次距離 1.0～1.6 倍、往後上或後下隨機偏移（不會每次落在同一點）。
 *           ・落地時留下 2 個分身：一個在落點上方約一個人高、一個在下方約一個人高，左右也錯開（不排成直線）。
 *           ・分身存在 3 秒，敵人會優先攻擊分身；分身被打 1 下或時間到就爆開（80% 範圍傷害）。冷卻 8 秒。
 *           ・效能：分身只存在 G.NPC 排序清單（跟角色一起依 y 排序繪製），沒有額外迴圈；敵人選目標沿用夥伴 targetOf。
 * 依賴    : 03_actors（身法：wp.BD／startAct／H.lastBody）、13_weapons（body 清單）、16_growth（onDodge）、49_party（targetOf／hurt）、58_forge（G.DECOY）。
 * ========================================================================== */
'use strict';
(function () {
  const W = G.WPN, H = G.H, SC = G.SC, GR = G.GROW, PY = G.PARTY, A = G.ANIM, HH = () => G.HERO_H, S = y => SC.depth(y); if (!W || !GR) return;
  const DEF = { id: 'bunshin', n: '分身', a: 'backstep', cd: 480, u: 4 };
  for (const w of W.LIST) if (w.BD && !w.BD.bunshin) { const b = Object.assign({}, DEF); w.body.push(b); w.BD.bunshin = b; }
  const CL = []; let pend = null;   // CL：場上的分身；pend：本次後跳結束時要放的分身
  const rnd = (a, b) => a + Math.random() * (b - a);
  function boom(c) { const s = S(c.y); for (const e of G.E) if (e.st !== 'dead' && e.hp > 0 && Math.hypot(e.x - c.x, (e.y - c.y) * 1.4) < HH() * s * 2.2) G.damageOni(e, 0.8, true);
    G.FX.push({ k: 'dust', x: c.x, y: c.y, t: 0, life: 20 }); if (G.spawnFx) G.spawnFx('feedback_guard_a', 0, c.x, c.y - HH() * s * 0.5, 1, s * 1.6); SC.shake = Math.max(SC.shake || 0, 4); }
  function kill(c) { const i = CL.indexOf(c); if (i < 0) return; CL.splice(i, 1); G.NPC = G.NPC.filter(n => n !== c); boom(c); }
  /* 後跳開始：隨機距離＋上下偏移；記住要放分身 */
  const od0 = GR.onDodge.bind(GR); GR.onDodge = function () { const r = od0.apply(this, arguments);
    if (H.lastBody === 'bunshin' && H.act) { const a = H.act; a.dm = (a.dm || 1) * rnd(1.0, 1.6); a._bs = 1; a._vy = (Math.random() < 0.5 ? -1 : 1) * rnd(0.35, 0.9) * HH() * S(H.y) / Math.max(8, a.T || 20);
      pend = { a, fr: G.heroFrame && G.heroFrame(), u: W.unit && W.unit() && W.unit().key, face: H.face }; }
    return r; };
  function place() { const s = S(H.y), up = (Math.random() < 0.5 ? 1 : -1);
    const pts = [[H.x + up * rnd(0.35, 0.75) * HH() * s, H.y - rnd(0.85, 1.15) * HH() * s], [H.x - up * rnd(0.35, 0.75) * HH() * s, H.y + rnd(0.85, 1.15) * HH() * s]];
    for (const c of CL.slice()) kill(c);
    for (const [x0, y0] of pts) { const q = (SC.snap && SC.snap(x0, y0, 'walk', 60)) || [x0, y0];
      const c = { bunshin: 1, st: 'decoy', x: q[0], y: q[1], face: H.face, t: 0, life: 180, u: pend && pend.u, fr: (G.heroFrame && G.heroFrame()) || (pend && pend.fr), hp: 1, hpMax: 1 };
      CL.push(c); G.NPC.push(c); } }
  /* 每格：後跳中的上下位移、落地放分身、分身計時 */
  const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments);
    if (pend) { const a = pend.a; if (H.act === a && a._vy) { const ny = H.y + a._vy; if (SC.walkable(H.x, ny)) H.y = ny; }
      if (H.act !== a) { place(); pend = null; } }
    for (const c of CL.slice()) if (++c.t >= c.life) kill(c);
    return r; };
  /* 敵人優先打分身 */
  if (G.DECOY) { const dc0 = G.DECOY; G.DECOY = () => dc0() || CL[0] || null; } else G.DECOY = () => CL[0] || null;
  if (PY && PY.targetOf) { const tg0 = PY.targetOf.bind(PY); PY.targetOf = e => { let b = null, bd = 300; for (const c of CL) { const d = Math.hypot(e.x - c.x, e.y - c.y); if (d < bd) { bd = d; b = c; } } return b || tg0(e); };
    const hu0 = PY.hurt.bind(PY); PY.hurt = function (P, ...r) { if (P && P.bunshin) { kill(P); return true; } return hu0(P, ...r); }; }
  /* 畫分身：主角落地姿勢的半透明殘影（淡青） */
  const dN = G.drawNpc; G.drawNpc = function (n) { if (!n.bunshin) return dN.apply(this, arguments); const u = n.u && A.get(n.u); if (!u || !n.fr) return;
    const s = S(n.y), k = Math.min(1, n.t / 8) * (n.life - n.t < 30 ? (n.life - n.t) / 30 : 1), ctx = G.ctx;
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.18)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, HH() * s * 0.22, HH() * s * 0.06, 0, 0, 6.283); ctx.fill(); ctx.restore();
    A.draw(u, n.fr, n.x, n.y, HH() * s * W.actK(H.act && H.act.name) / (u.refH || 130), n.face < 0, 0.55 * k); };
  /* 換地圖清空 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { CL.length = 0; pend = null; return en0(id); };
  G.BUNSHIN = { CL };
})();
