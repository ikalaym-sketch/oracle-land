/* ==========================================================================
 * 神諭之地 重製版 — 109_katana.js
 * Version : r3.74.0  (2026-11-24)
 * 變更    : r3.74.0 普攻換成殘月藍（新增 MV2.N.katana：出手時間與倍率照動作圖事件，刀光改實心藍月牙、命中改藍色）。
 *           r3.73.0 全部招式／技／特技的特效改由 111_katana_fx 繪製：實心漸細刀光（刀幕不再畫，判定照舊）、突刺光、聚氣、刀鍔閃、架勢刀身光、緩速冰霧、地面揚霧＋局部光取代所有地面圈；斷風改實心月牙。
 *           r3.72.0 特效改藍系（深藍／中藍為主、白只留細刃芯），移除白色半橢圓架勢框、地面白線、全部 lighter 疊加；居合畫面縮為 1.3 身高（判定 1.8）；匯出 G.KT 給 110。
 *           r3.71.0 新增。打刀招式／技／特技重新設計（千本櫻、櫻花亂舞、普攻不動），身法分化＋完美閃避（全武器共用）。
 *           原則：①判定一律在動作圖「出手幀」（依動作圖事件換算到該招總格數）②只有動作本身在移動的招才位移 ③一招一個用途，畫面看得到。
 *           主題「殘月」：藍白新月光刃、月牙碎光、刀痕停留；收招／技加地痕與停頓。
 *           招式 12：
 *             起 踏步引刃（突進斬）、斜線截路（斜向穿越敵人）、低探（下段刺＋緩速 40%，敵人腳下冰藍圈）
 *             連 挑刃散勢（挑空）、回身分月（前後兩面）、弧步（繞到敵人背後斬，背擊 ×1.3）、返織（往返兩斬，第二斬破防 15%）
 *             收 落斬收勢（跳劈擊倒＋地痕）、離刃（斬後退，0.4 秒後原地月牙爆裂）、納刀退（退步收刀：下一擊必暴＋氣 10）
 *             架 交鋒返脈（被打→反擊斬＋暈）、開架（被打→下一擊必暴＋反擊）；兩招沒被打，收架時自動補斬
 *             完整「起→連→收」：收招必暴＋破防 15%。
 *           技：居合斬＝原地拔刀巨型月牙（不再前衝）；一閃＝蓄力後穿過敵人、0.3 秒後路徑上敵人一起爆開；燕返＝上挑＋下斬。
 *           特技：一息截隙＝快斬打斷（敵人出手中命中→必暴＋氣 30，否則氣 15）；半月歸鞘＝收刀架勢（被打→迴旋拔刀，沒被打→收架居合）；
 *                 返脈斷風＝後撤斬＋放出飛行月牙；翻潮織刃＝三段推進斬，最後把敵人聚攏。
 *           身法：閃身不推搖桿＝原地側閃（不再和後跳一樣）；後跳距離 ×1.8，落地後下一擊 +20%；
 *                 完美閃避＝敵人出手瞬間（閃身開始 10 格內）閃開 → 周圍敵人停頓 0.4 秒、藍色殘影、「見切」、氣 +10、1 秒內攻擊 +30%。
 *           秘傳可按時間 0.6→1 秒，發光鍵外圈加倒數圈。
 *           秘傳判定修正（全武器）：架招／無傷害招使出滿 10 格就算成立（原本要被打中或補斬，接其他按鍵的招會把架勢取消掉 → 秘傳湊不出來）。
 * 依賴    : 77_moves（MV2.reg／U／ctx：slash／hit／move／later）、76_vfx、83_skills（覆蓋 U.katana 同名技）、03_actors（heroStep／heroStartAct）。
 * ========================================================================== */
'use strict';
(function () {
  const MV2 = G.MV2, VX = G.VX, H = G.H, SC = G.SC, A = G.ANIM, HH = () => G.HERO_H, S = y => SC.depth(y), TK = 1000 / 60, TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a);
  if (!MV2 || !VX) return;
  const K = { col: '70,130,255', edge: '170,205,255' }, MC = '110,165,255';
  /* 動作圖出手幀 → 本招第幾格 */
  const ST = (c, i) => { const a = c.a, r = a.r, ev = r && r.c && r.c.ev; if (!ev || !ev.length) return Math.max(2, Math.round(a.T * 0.45));
    const e = ev[Math.min(i || 0, ev.length - 1)], dur = (r.c && r.c.dur) || Math.max(6, Math.round(A.dur(r) / TK)); return Math.max(2, Math.min(a.T - 3, Math.round(e.at / dur * a.T))); };
  const stop = n => { G.hitstop = Math.max(G.hitstop || 0, n); };
  const ok = (x, y) => SC.walkable(x, y);
  /* ---------- 殘月主題特效 ---------- */
  /* r3.73.0：特效改由 111_katana_fx（G.KF）繪製——實心漸細刀光、柔光貼圖、局部光；不再有描邊線與地面圈 */
  const BL = { deep: '40,95,230', mid: '95,155,255', lite: '170,205,255', core: '235,244,255' }, KF = () => G.KF;
  /* 舊介面保留（110 共用）：arcBlade＝定點刀光，w 為刃厚；life 依舊格數換成掃過時間 */
  function arcBlade(x, y, z, f, r, a0, a1, life, w, rot) { KF().smear({ x, y, cy: z, f, r, sq: 1, rot: rot || 0, a0, a1, w: Math.max(0.2, (w || 0.16) * 1.7), dur: Math.max(3, Math.round((life || 16) * 0.28)), life: life || 16, tier: 1, motes: 6 }); }
  function crescent(x, y, z, f, r, ang, life) { KF().motes(x, y, z, 3 + Math.round(r * 2), { sp: 0.9, life: (life || 14) + 10, rx: 0.2, rz: 0.2 }); }   // 刀光已由 sl 畫出，這裡只補碎光（避免兩道弧疊在一起）
  function dust(x, y, z, n, sp, life) { KF().motes(x, y, z, n, { sp: sp || 1, life: life || 30 }); }
  /* 刀痕：地上一排依序閃過的小光點（不是線） */
  function scar(x, y, z, ang, len) { const n = Math.max(3, Math.round(len * 3)); for (let i = 0; i < n; i++) { const u = i / (n - 1) - 0.5; KF().motes(x + Math.cos(ang) * u * len * HH() * S(y), y + Math.sin(ang) * u * len * HH() * S(y), Math.max(0.05, z * 0.3), 1, { sp: 0.3, up: 0.25, life: 26, stag: i * 1.2 }); } }
  function stance(life) { KF().aura(life); }
  const tag = (e, t, col) => G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) * 1.25, v: t, t: 0, col });
  /* 刀幕（立即判定）＋主題 */
  const sl = (c, o) => { const O = Object.assign({ r: 1.25, w: 0.32, sq: 0.5, sw: 4, life: 13, a0: -2.2, a1: 0.9, trail: 2.3, hf: 0, lv: 'mid' }, o), tier = Math.min(2, (c.a.mvx && c.a.mvx.lv ? 1 : 0) + (O.lv === 'heavy' ? 1 : 0));   // 技／特技＋1、重擊＋1
    KF().smear({ x: H.x, y: H.y, cy: 0.55, f: c.f, r: O.r, sq: O.sq, rot: O.rot || 0, a0: O.a0, a1: O.a1, w: O.w * (1.15 + tier * 0.12), dur: Math.max(3, O.sw), life: O.life + 4, trail: O.trail, tier, lit: 1 });
    c.slash(Object.assign({}, O, { life: 0, shat: 0 })); };   // 判定沿用 c.slash（刀幕本身不畫）
  const slH = (c, o) => { sl(c, Object.assign({}, o, { m: 0 })); return c.hit({ shape: o.shape || 'sector', r: o.hr || (o.r || 1.2) + 0.2, arc: o.arc || 2.2, m: o.m, lv: o.lv || 'mid', kind: 'cut', stun: o.stun, crit: o.crit }) || []; };   // 刀幕＋判定，回傳命中
  const fx = (c, dx, r, ang, tier) => { const x = c.x + c.f * dx * c.hh; crescent(x, c.y, 0.55, c.f, r, ang, tier > 1 ? 22 : 15, tier > 1 ? 0.5 : 0.25); dust(x, c.y, 0.55, tier > 1 ? 10 : 5, tier > 1 ? 1.4 : 0.9); };
  const fin = (c, o) => (c.fin ? Object.assign(o, { crit: true, def: Math.max(o.def || 0, 15) }) : o);   // 起→連→收：收招必暴＋破防
  const near = (c, R) => { let b = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue; const dx = (e.x - c.x) * c.f, d = Math.hypot(e.x - c.x, (e.y - c.y) * 1.5); if (dx > -0.3 * c.hh && d < R * c.hh && d < bd) { bd = d; b = e; } } return b; };
  function pass(c, x1, y1) { const s = 8; for (let i = 1; i <= s; i++) { const x = H.x + (x1 - H.x) / (s - i + 1), y = H.y + (y1 - H.y) / (s - i + 1); if (ok(x, y)) { H.x = x; H.y = y; } else break; } }   // 穿越（不受敵人阻擋）
  /* 架：期間被打→counter；沒被打→收架補斬 */
  const guardRun = (o) => function (c, t) { if (t === 1) stance(c.a.T - 6); if (t === c.a.T - 6 && !c.a.mvx.ctr) { sl(c, { a0: -2.0, a1: 0.8, r: 1.15, m: 0.6 }); fx(c, 0.6, 0.9, 0, 1); } };
  const D = {
    step_cut: { n: '踏步引刃', cat: '起', cd: 24, T: 26, d: '踏步突進斬，拉近距離', run(c, t) { const s = ST(c); if (t >= 1 && t < s) { c.move(1.2 / (s - 1), 0); if (t % 2) c.ghost(10); }
        if (t === s) { sl(c, { a0: -2.0, a1: 0.8, sq: 0.7, rot: -0.35, m: 1.0, kb: 1.0 }); fx(c, 0.7, 1.0, -0.35, 1); } } },
    diagonal_lane: { n: '斜線截路', cat: '起', cd: 30, T: 30, d: '斜向穿過敵人到另一側，路徑上全部斬中（推搖桿上下決定方向）', run(c, t) { const s = ST(c), m = c.a.mvx;
        if (t === 1) { m.p0 = [c.x, c.y]; m.dy = (G.IN.my || 0) > 0.2 ? 1 : (G.IN.my || 0) < -0.2 ? -1 : (c.y > (SC.y0 + SC.y1) / 2 ? -1 : 1); m.sk = []; }
        if (t >= 2 && t <= s) { const k = c.hh; pass(c, H.x + c.f * 2.2 * k / (s - 1), H.y + m.dy * 0.45 * k / (s - 1)); c.ghost(8); for (const e of G.E) if (e.st !== 'dead' && e.delay <= 0 && !m.sk.includes(e) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < 0.85 * k) m.sk.push(e); }
        if (t === s) { for (const e of m.sk) if (e.st !== 'dead') { G.damageOni(e, 1.1 * c.mul, false); VX.impact && VX.impact(e, 'mid', 'cut'); c.a.mvx.hit = 1; } if (m.sk.length) MV2.onHit && MV2.onHit(c.a); const [x0, y0] = m.p0, L = Math.hypot(H.x - x0, (H.y - y0)), an = Math.atan2(H.y - y0, H.x - x0); scar((x0 + H.x) / 2, (y0 + H.y) / 2, 0.5, an, L / c.hh, 30); dust(H.x, H.y, 0.5, 6, 1); } } },
    low_probe: { n: '低探', cat: '起', cd: 24, T: 24, d: '下段刺，命中敵人緩速 40%（腳下冰藍圈）', run(c, t) { const s = ST(c);
        if (t === s) { KF().stab({ x: c.x, y: c.y, f: c.f, len: 1.6, w: 0.11, cy: 0.3, dur: 2, life: 12 });
          const hs = c.hit({ shape: 'line', len: 1.75, w: 0.4, m: 0.8, slow: 40, lv: 'light', kind: 'pierce' }); for (const e of hs) { KF().frost(e, 120); tag(e, '緩速', '#9fd0ff'); } dust(c.x + c.f * 1.2 * c.hh, c.y, 0.25, 4, 0.7); } } },
    rising_disrupt: { n: '挑刃散勢', cat: '連', cd: 30, T: 28, d: '由下往上挑，把敵人挑上空中', run(c, t) { const s = ST(c);
        if (t === s) { sl(c, { a0: 1.2, a1: -1.35, sq: 1, r: 1.1, m: 1.0, launch: 50 }); dust(c.x + c.f * 0.6 * c.hh, c.y, 0.9, 8, 1.2); } } },
    turning_sweep: { n: '回身分月', cat: '連', cd: 30, T: 32, d: '原地迴身一圈，前後敵人同時斬中', run(c, t) { const s = ST(c);
        if (t === s) { sl(c, { a0: Math.PI, a1: -Math.PI * 1.02, shape: 'circle', hr: 1.45, sw: 7, life: 16, trail: 3.6, m: 1.0 }); crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.5, c.f, 1.1, 0, 16); crescent(c.x - c.f * 0.6 * c.hh, c.y, 0.5, -c.f, 1.1, 0, 16); dust(c.x, c.y, 0.5, 8, 1.3); } } },
    arc_step: { n: '弧步', cat: '連', cd: 30, T: 30, d: '弧線繞到敵人背後再斬，背擊傷害 ×1.3', run(c, t) { const s = ST(c), m = c.a.mvx;
        if (t === 1) { const e = near(c, 2.8); m.e = e; m.p0 = [c.x, c.y]; m.p1 = e ? [e.x + c.f * 0.75 * c.hh, e.y] : [c.x + c.f * 1.5 * c.hh, c.y]; m.side = (G.IN.my || 0) > 0 ? 1 : -1; }
        if (t >= 1 && t < s) { const u = t / (s - 1), [x0, y0] = m.p0, [x1, y1] = m.p1, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + m.side * Math.sin(u * Math.PI) * 0.55 * c.hh; if (ok(x, y)) { H.x = x; H.y = y; } if (t % 2) c.ghost(10); }
        if (t === s) { if (m.e) { H.face = -c.a.face0; c.a.face0 = H.face; } sl(c, { a0: -1.8, a1: 1.0, sq: 0.55, r: 1.2, m: m.e ? 1.3 : 1.0, crit: !!m.e }); fx(c, 0.6, 1.0, 0.2, 1); if (m.e) tag(m.e, '背擊', '#ffd76a'); } } },
    return_weave: { n: '返織', cat: '連', cd: 30, T: 30, d: '往返兩斬，第二斬破防 15%', run(c, t) { const s = ST(c);
        if (t === s - 4) { sl(c, { a0: -2.0, a1: 0.9, sq: 0.8, rot: -0.45, m: 0.6 }); crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.6, c.f, 0.9, -0.45, 14); }
        if (t === s + 3) { sl(c, { a0: 2.0, a1: -0.9, sq: 0.8, rot: 0.45, m: 0.7, def: 15, cutAng: 0.6 }); crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.5, c.f, 0.9, 0.45, 14); dust(c.x + c.f * 0.6 * c.hh, c.y, 0.5, 5, 0.9); } } },
    downward_finish: { n: '落斬收勢', cat: '收', cd: 48, T: 38, d: '躍起下劈，擊倒敵人並留下刀痕', run(c, t) { const s = ST(c);
        if (t >= 2 && t < s - 2) c.move(0.5 / (s - 4), 0); if (t === 3) c.ghost(14);
        if (t === s) { sl(c, fin(c, { a0: -2.1, a1: 0.95, sq: 1, r: 1.3, w: 0.42, m: 1.6, lv: 'heavy', stun: 60, kb: 0.6, sw: 4 })); const x = c.x + c.f * 0.75 * c.hh;
          crescent(x, c.y, 0.7, c.f, 1.3, 1.25, 22, 0); scar(x, c.y, 0.02, 0.15 * c.f, 1.4, 40); dust(x, c.y, 0.2, 12, 1.4); KF().puff(x, c.y, 1.2); SC.shake = Math.max(SC.shake || 0, 4); stop(5); } } },
    leaving_cut: { n: '離刃', cat: '收', cd: 48, T: 38, d: '斬完立刻後退，0.4 秒後原地月牙爆裂', run(c, t) { const s = ST(c), m = c.a.mvx;
        if (t === s) { sl(c, fin(c, { a0: -2.5, a1: 1.2, r: 1.35, w: 0.36, m: 0.8, sw: 5, arc: 2.8 })); m.p = [c.x + c.f * 0.85 * c.hh, c.y]; crescent(m.p[0], c.y, 0.55, c.f, 0.6, 0, 26, 0); }
        if (t > s && t <= s + 9) c.move(-0.12, 0); if (t === s + 2) c.ghost(12);
        if (t === s + 24) { const [x, y] = m.p; crescent(x, y, 0.5, c.f, 1.4, 0, 20, 0); crescent(x, y, 0.5, -c.f, 1.4, 0, 20, 0); dust(x, y, 0.5, 14, 1.6); KF().puff(x, y, 1); KF().light(x, y, 1.2, 16, 0.5, 0.5);
          c.hit(fin(c, { shape: 'circle', x, y, r: 1.0, m: 1.2, lv: 'heavy', kind: 'cut' })); stop(4); } } },
    sheathed_retreat: { n: '納刀退', cat: '收', cd: 48, T: 40, d: '一刀後退步收刀：下一擊必暴、氣 +10', run(c, t) { const s = ST(c);
        if (t < s && t <= 10) c.move(-0.07, 0);
        if (t === s) { sl(c, fin(c, { a0: -0.4, a1: 0.3, sq: 0.25, r: 1.6, w: 0.18, m: 0.7, sw: 2 })); scar(c.x + c.f * 0.9 * c.hh, c.y, 0.5, 0, 1.5, 22); }
        if (t === c.a.T - 6) { G.BUFF.add('nextCrit', 100, 300); const d = G.RPG.d(); d.qi = Math.min(100, (d.qi || 0) + 10); KF().glint(c.x + c.f * 0.15 * c.hh, c.y, 0.45, 0.3, 12); dust(c.x + c.f * 0.15 * c.hh, c.y, 0.45, 6, 0.6); G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 10, v: '下一擊必暴', t: 0, col: '#ffd76a' }); } } },
    blade_receive: { n: '交鋒返脈', cat: '架', cd: 36, T: 34, d: '架刀：被打→反擊斬並擊暈；沒被打→收架補斬', run: guardRun({}),
      counter(c, e) { c.a.mvx.ctr = 1; sl(c, { a0: -2.4, a1: 1.1, r: 1.4, w: 0.45, m: 1.6, lv: 'heavy', stun: 40, sw: 3 }); fx(c, 0.6, 1.3, 0, 2); tag(e, '返', '#bfe0ff'); stop(8); } },
    open_guard: { n: '開架', cat: '架', cd: 36, T: 36, d: '開架：被打→反擊並讓下一擊必暴；沒被打→收架補斬', run: guardRun({ col: '190,215,255' }),
      counter(c, e) { c.a.mvx.ctr = 1; G.BUFF.add('nextCrit', 100, 300); sl(c, { a0: -2.0, a1: 0.9, r: 1.25, m: 1.0 }); fx(c, 0.6, 1.0, 0, 1); tag(e, '見破', '#bfe0ff'); stop(10); } }
  };
  /* 普攻（r3.74.0）：動作、出手時間、倍率照原本（動作圖事件），只把白色素材刀光換成殘月藍實心刀光＋藍色命中（原本走 03 的素材特效） */
  const NAT = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? e.at : 8; }, NDM = (c, j) => { const e = c.a.ev0 && c.a.ev0[j || 0]; return e ? (e.m || 1) : 1; };
  const nsl = (c, o) => c.slash(Object.assign({ hf: 1, sw: 3, life: 12, trail: 2.2, r: 1.2, w: 0.28, sq: 0.55, lv: 'mid', arc: 2.2, hr: 1.35 }, o));
  const NK = [
    { run(c, t) { const f = NAT(c); if (t === f - 2) nsl(c, { a0: -2.2, a1: 0.9, rot: -0.2, m: NDM(c), cutAng: -0.8 }); } },
    { run(c, t) { const f = NAT(c); if (t === f - 2) nsl(c, { a0: 1.1, a1: -2.0, rot: 0.25, sq: 0.5, m: NDM(c), cutAng: 0.8 }); } },
    { run(c, t) { const f = NAT(c); if (t === f - 2) nsl(c, { a0: -2.3, a1: 1.0, sq: 0.75, r: 1.35, w: 0.34, m: NDM(c), lv: 'heavy', kb: 0.6 }); if (t > f - 4 && t < f) c.move(0.03, 0); } }];
  const regN = () => { if (MV2.N && MV2.N.katana !== NK) MV2.N.katana = NK; };
  function regMv() { MV2.reg('katana', D); const w = G.WPN.BY.katana; if (w) for (const m of w.mv) if (D[m.id]) m.d = D[m.id].d; }
  G.KT = { arcBlade, dust, BL, ST, stop, tag, stance };   // 110_katana_hiden 共用
  /* ---------- 技・特技 ---------- */
  const LV = c => c.a.mvx.lv || 1, U = {
    iai: { n: '居合斬', kind: 'skill', T: 40, run(c, t) { const lv = LV(c), s = ST(c), R = lv >= 3 ? 2.2 : 1.8, RV = lv >= 3 ? 1.5 : 1.3;   // R＝判定、RV＝刀光大小
        if (t === 1) KF().charge(c.x + c.f * 0.12 * c.hh, c.y, 0.45, Math.max(4, s - 1), 10);
        if (t === s) { c.slash({ life: 0, shat: 0, a0: -0.55, a1: 0.45, sq: 0.35, r: RV, w: 0.2, sw: 2, hf: 0, shape: 'sector', hr: R, arc: 2.0, m: 2.4, lv: 'heavy', crit: Math.random() < 0.3 + (lv >= 5 ? 0.3 : 0) });
          KF().smear({ x: c.x, y: c.y, cy: 0.5, f: c.f, r: RV, sq: 0.32, rot: -0.08, a0: -1.7, a1: 1.15, w: 0.42, dur: 3, life: 18, tier: 2, trail: 2.4 }); KF().glint(c.x + c.f * 0.15 * c.hh, c.y, 0.5, 0.4, 10);   // 居合：原地水平一閃（壓扁的橫向月牙），拔刀點一閃 dust(c.x + c.f * RV * 0.7 * c.hh, c.y, 0.5, 14, 1.4); SC.shake = Math.max(SC.shake || 0, 4); stop(6);
          if (lv >= 5) c.later(20, () => { KF().smear({ x: H.x, y: c.y, cy: 0.5, f: c.f, r: RV, sq: 0.32, rot: 0.08, a0: 1.15, a1: -1.7, w: 0.36, dur: 3, life: 16, tier: 1 }); c.hit({ shape: 'sector', r: R, arc: 2.0, m: 1.0, lv: 'mid', kind: 'cut' }); }); }
        if (t === c.a.T - 5) KF().glint(c.x + c.f * 0.12 * c.hh, c.y, 0.45, 0.28, 10); } },
    issen: { n: '一閃', kind: 'skill', T: 52, run(c, t) { const lv = LV(c), s = ST(c), m = c.a.mvx;
        if (t === 1) { VX.dim && VX.dim(40, 0.45); KF().charge(c.x + c.f * 0.12 * c.hh, c.y, 0.5, Math.max(6, s - 6), 16); KF().mist(c.x + c.f * 1.2 * c.hh, c.y, 1.4, 50, 0.9); }
        if (t === s - 5) { m.p0 = [c.x, c.y]; m.sk = []; }
        if (t > s - 5 && t <= s) { pass(c, H.x + c.f * 3.2 * c.hh / 5, H.y); c.ghost(12); c.inv(12); for (const e of G.E) if (e.st !== 'dead' && !m.sk.includes(e) && Math.abs(e.x - H.x) < 0.5 * c.hh && Math.abs(e.y - H.y) < 0.45 * c.hh) m.sk.push(e); }
        if (t === s + 1) { const [x0, y0] = m.p0, L = Math.abs(H.x - x0) / c.hh; scar((x0 + H.x) / 2, y0, 0.5, 0, L, 40); }
        if (t === s + 18) { const [x0, y0] = m.p0; KF().light((x0 + H.x) / 2, y0, Math.abs(H.x - x0) / c.hh * 0.6 + 0.8, 24, 0.6, 0.5); stop(10); SC.shake = Math.max(SC.shake || 0, 6);
          for (const e of m.sk) { if (e.st === 'dead') continue; G.damageOni(e, 2.6 * c.mul, true, lv >= 5); VX.impact && VX.impact(e, 'heavy', 'cut'); crescent(e.x, e.y, 0.6, c.f, 0.9, rnd(-0.5, 0.5), 18); dust(e.x, e.y, 0.6, 8, 1.4); c.a.mvx.hit = 1; }
          if (m.sk.length) MV2.onHit && MV2.onHit(c.a); if (lv >= 3 && H.cd) for (const kk in H.cd) if (/^m:/.test(kk)) H.cd[kk] = 0; } } },
    tsubame: { n: '燕返', kind: 'skill', T: 40, run(c, t) { const lv = LV(c), s = ST(c);
        if (t === s) { sl(c, { a0: 1.2, a1: -1.4, sq: 1, r: 1.15, w: 0.38, m: 1.1, launch: 30, cutAng: -1.2 }); }
        if (t === s + 6) { sl(c, { a0: -2.1, a1: 0.95, sq: 1, r: 1.25, w: 0.38, m: 1.2, stun: 40, kb: 0.4, cutAng: 1.2 }); crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.5, c.f, 1.0, 1.2, 16); dust(c.x + c.f * 0.6 * c.hh, c.y, 0.4, 8, 1.2); stop(4); }
        if (lv >= 3 && t === s + 12) sl(c, { a0: -2.4, a1: 1.1, sq: 0.45, r: 1.3, w: 0.32, m: 1.1 });
        if (lv >= 5 && t === s + 14) { const x0 = c.x, f = c.f, sk = []; VX.custom((o, ctx) => { const s2 = S(H.y), k = HH() * s2, px = x0 + f * (0.6 + o.t * 0.28) * k, y = c.y - 0.6 * k; ctx.save(); ctx.translate(px, y); ctx.scale(f, 1);  ctx.fillStyle = 'rgba(70,130,255,' + 0.9 * (1 - o.t / o.life) + ')';
            ctx.beginPath(); ctx.moveTo(14 * s2, 0); ctx.quadraticCurveTo(-3 * s2, -4 * s2, -14 * s2, -13 * s2); ctx.quadraticCurveTo(-6 * s2, -1 * s2, -8 * s2, 0); ctx.quadraticCurveTo(-6 * s2, 1 * s2, -14 * s2, 13 * s2); ctx.quadraticCurveTo(-3 * s2, 4 * s2, 14 * s2, 0); ctx.fill(); ctx.restore(); }, 20, 'o',
            { step: (o, tt) => { const px = x0 + f * (0.6 + tt * 0.28) * c.hh; c.hit({ shape: 'circle', x: px, y: c.y, r: 0.6, m: 0.4, lv: 'light', kind: 'cut', skip: sk }).forEach(e => sk.push(e)); } }); } } },
    special_breath: { n: '一息截隙', kind: 'skill', T: 34, run(c, t) { const lv = LV(c), s = ST(c);
        if (t === s) { const busy = G.E.filter(e => e.st === 'atk' && !e.atkHit), hs = slH(c, { a0: -0.6, a1: 0.5, sq: 0.35, r: 1.4, w: 0.22, sw: 2, m: 1.0, stun: 40 }), cut = hs.some(e => busy.includes(e));
          const d = G.RPG.d(), q = cut ? 30 : 15; d.qi = Math.min(100, (d.qi || 0) + q * (lv >= 3 ? 1.5 : 1)); scar(c.x + c.f * 0.8 * c.hh, c.y, 0.5, 0, 1.4, 20);
          if (cut) { for (const e of hs) if (busy.includes(e)) { G.damageOni(e, 0.6 * c.mul, true, true); tag(e, '截', '#ffd76a'); } stop(8); dust(c.x + c.f * 0.8 * c.hh, c.y, 0.5, 10, 1.2); }
          G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 10, v: '氣 +' + Math.round(q * (lv >= 3 ? 1.5 : 1)), t: 0, col: '#ffc0d6' }); if (lv >= 5) G.BUFF.add('aspd', 15, 300); } } },
    special_home: { n: '半月歸鞘', kind: 'guard', cat: '架', T: 52, run(c, t) { if (t === 1) stance(c.a.T - 6);
        if (t === c.a.T - 6 && !c.a.mvx.ctr) { sl(c, { a0: -0.5, a1: 0.4, sq: 0.3, r: 1.8, w: 0.2, sw: 2, m: 0.8 }); scar(c.x + c.f * 1.0 * c.hh, c.y, 0.5, 0, 1.6, 22); } },
      counter(c, e) { c.a.mvx.ctr = 1; sl(c, { a0: Math.PI, a1: -Math.PI * 1.02, shape: 'circle', hr: 1.6, sw: 6, life: 16, trail: 4, r: 1.5, w: 0.5, m: 2.2, lv: 'heavy', crit: LV(c) >= 5 });
        crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.5, c.f, 1.4, 0, 22); crescent(c.x - c.f * 0.6 * c.hh, c.y, 0.5, -c.f, 1.4, 0, 22); dust(c.x, c.y, 0.5, 14, 1.6); tag(e, '返', '#bfe0ff'); stop(10); } },
    special_return: { n: '返脈斷風', kind: 'skill', T: 36, run(c, t) { const lv = LV(c), s = ST(c), m = c.a.mvx;
        if (t === s) { sl(c, { a0: -2.3, a1: 1.1, r: 1.3, w: 0.36, m: 1.0 }); crescent(c.x + c.f * 0.6 * c.hh, c.y, 0.55, c.f, 1.0, 0, 14); }
        if (t > s && t <= s + 8) c.move(-0.11 * (lv >= 3 ? 1.4 : 1), 0); if (t === s + 2) c.ghost(12);
        if (t === s + 9) { const x0 = c.x + c.f * 0.6 * c.hh, y = c.y, f = c.f, sk = [], R = 4 + (lv >= 5 ? 2 : 0);   // 斷風：飛行月牙
          VX.custom((o, ctx) => { const s2 = S(y), k = HH() * s2, px = x0 + f * o.t * 0.22 * k, a = Math.min(1, (o.life - o.t) / 6) * Math.min(1, (o.t + 1) / 3); KF().moonShape(ctx, px, y - 0.55 * k, 0.6 * k * (0.7 + 0.3 * Math.min(1, o.t / 4)), f, a, k); }, Math.round(R / 0.22), 'o',
            { step: (o, tt) => { const px = x0 + f * tt * 0.22 * c.hh; if (tt % 3 === 0) dust(px, y, 0.55, 2, 0.6, 18); c.hit({ shape: 'circle', x: px, y, r: 0.6, m: 1.2, lv: 'mid', kind: 'cut', skip: sk }).forEach(e => sk.push(e)); } }); } } },
    special_tide: { n: '翻潮織刃', kind: 'skill', T: 46, run(c, t) { const lv = LV(c), s = ST(c), F = [s, Math.min(c.a.T - 12, s + 9), Math.min(c.a.T - 4, s + 18)];
        F.forEach((f, i) => { if (t > f - 5 && t <= f) c.move(0.09, 0);
          if (t === f) { sl(c, { a0: i % 2 ? 2.0 : -2.0, a1: i % 2 ? -0.9 : 0.9, sq: 0.7, r: 1.2 + i * 0.12, w: 0.34, m: 0.8, lv: i === 2 ? 'heavy' : 'mid', kb: i === 2 ? 0 : 0.3 }); crescent(c.x + c.f * 0.65 * c.hh, c.y, 0.55, c.f, 0.9 + i * 0.15, i % 2 ? 0.4 : -0.4, 14);
            if (i === 2) { const px = c.x + c.f * 1.0 * c.hh; for (const e of G.E) if (e.st !== 'dead' && !e.boss && Math.hypot(e.x - c.x, (e.y - c.y) * 1.6) < 2.4 * c.hh) { e.x += (px - e.x) * 0.45; e.y += (c.y - e.y) * 0.45; } KF().puff(px, c.y, 1); dust(px, c.y, 0.4, 10, 1.2); stop(4); } } }); } }
  };
  function regU() { MV2.U.katana = Object.assign(MV2.U.katana || {}, U);
    const w = G.WPN.BY.katana; for (const s of w.sk) { const N = { iai: '原地瞬間拔刀，前方巨型月牙斬（暴擊率 +30%）', issen: '蓄力後穿過敵人，0.3 秒後路徑上的敵人一起爆開', tsubame: '上挑把敵人挑起，再返刀下斬', special_breath: '快斬打斷：敵人出手中命中→必暴＋氣 30，否則氣 15', special_home: '收刀架勢：被打→迴旋拔刀反擊；沒被打→收架居合', special_return: '後撤斬，並放出往前飛的月牙', special_tide: '三段推進斬，最後把周圍敵人聚攏' }[s.id]; if (N) s.d = N; } }
  /* 其他模組（80／83）在開機前後才註冊打刀 → 開機完成後再覆蓋一次 */
  /* 92_lab 換武器時會把招式還原成它記下的舊版 → 每格檢查，被換掉就放回新版（只比對參照，不重建） */
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); const MD = MV2.D.katana, MU = MV2.U.katana; if (MD) for (const k in D) if (MD[k] !== D[k]) MD[k] = D[k]; if (MU) for (const k in U) if (MU[k] !== U[k]) MU[k] = U[k]; };
  regMv(); regN(); const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { try { regMv(); regU(); regN(); } catch (e) { console.warn('katana', e); } return r; });
  /* ---------- 身法：閃身／後跳分化＋完美閃避（全武器） ---------- */
  const BOD = G.BODY = { pf: 0 };
  (function hook() { if (!G.heroStep || !G.heroStartAct) return setTimeout(hook, 30);
    const hs0 = G.heroStep; G.heroStep = function () { const a0 = H.act, cd0 = H.cd['m:dodge'] || 0, cb0 = H.cd['m:backstep'] || 0; const r = hs0.apply(this, arguments); const a = H.act;
      if (a && a !== a0 && (a.kind === 'dodge')) { const by = (H.cd['m:backstep'] || 0) > cb0 ? 'backstep' : (H.cd['m:dodge'] || 0) > cd0 ? 'dodge' : 'other'; a.bd = by; a.t0 = G.t;
        if (by === 'dodge' && a.name === 'backstep' && Math.hypot(G.IN.mx || 0, G.IN.my || 0) < 0.2) { a.dm = 0; a.side = (H.y > (SC.y0 + SC.y1) / 2 ? -1 : 1); H.inv = Math.max(H.inv, 18); }   // 不推搖桿：原地側閃
        else if (by === 'backstep') { a.back = 1; a.land = 1; } }
      if (a && a.back && H.t <= 10) { const x = H.x - H.face * 0.075 * HH() * S(H.y); if (SC.walkable(x, H.y)) H.x = x; }   // 後跳：多退約 0.8 身
      if (a && a.side && H.t <= 9) { const y = H.y + a.side * 0.09 * HH() * S(H.y); if (SC.walkable(H.x, y)) H.y = y; if (H.t === 2) VX.ghost && VX.ghost(12); }
      if (H.hidenRdy && !H.hidenRdy.ext) { H.hidenRdy.ext = 1; H.hidenRdy.end += 24; H.hidenRdy.max = H.hidenRdy.end; }   // 秘傳可按時間：收招後 0.6 秒 → 1 秒
      /* 秘傳判定：架招架滿 10 格、或無傷害輔助招使出 10 格，就算這一招「成立」（不用等被打或補斬；被下一招取消也算） */
      if (a && a.mvx && !a.mvx.hiden && H.t === 10 && !a.mvx.rec && (a.mvx.def.cat === '架' || a.mvx.def.noHit)) { a.mvx.hit = 1; MV2.onHit && MV2.onHit(a); }
      if (a0 && a0.land && a0 !== a) { G.BUFF.add('atk', 20, 60); G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 10, v: '攻 +20%', t: 0, col: '#ffd76a' }); }
      /* 完美閃避：閃身／後跳開始 10 格內，有近戰敵人正好出手 */
      if (a && a.kind === 'dodge' && H.t <= 10 && !a.pf) { for (const e of G.E) { if (e.st === 'dead') continue; const was = e.__ah; e.__ah = !!e.atkHit; if (!was && e.atkHit && e.st === 'atk' && Math.abs(e.x - H.x) < 140 * S(H.y) && Math.abs(e.y - H.y) < 40) { a.pf = 1; perfect(); break; } } }
      else for (const e of G.E) e.__ah = !!e.atkHit;
      return r; };
    /* 秘傳鍵外圈倒數 */
    const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); const R = H.hidenRdy, B = G.UI.B; if (!R || !B || !R.max) return; const b = B['c' + (R.k + 1)]; if (!b) return; const ctx = G.ctx, q = Math.max(0, 1 - R.t / R.max);
      ctx.save(); ctx.strokeStyle = 'rgba(255,215,120,.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 9, -Math.PI / 2, -Math.PI / 2 + 6.283 * q); ctx.stroke(); ctx.restore(); };
    function perfect() { BOD.pf++; const k = HH() * S(H.y); for (const e of G.E) if (e.st !== 'dead' && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < 3.5 * k) { e.stun = Math.max(e.stun || 0, 24); e.flash = 4; }
      VX.dim && VX.dim(24, 0.4); VX.ghost && VX.ghost(18); KF().light(H.x, H.y, 1.4, 20, 0.55, 0.6); dust(H.x, H.y, 0.6, 10, 1.2, 30);
      G.NUMS.push({ x: H.x, y: H.y - k - 14, v: '見切', t: 0, col: '#9fd0ff' }); const d = G.RPG.d(); d.qi = Math.min(100, (d.qi || 0) + 10); G.BUFF.add('atk', 30, 60); G.hitstop = Math.max(G.hitstop || 0, 6); } })();
})();
