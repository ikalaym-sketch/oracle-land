/* ==========================================================================
 * 神諭之地 重製版 — 77_moves.js
 * Version : r3.194.0  (2026-11-28)　偏低的招式傷害補到分級標準（野太刀 2、薙刀 2、長槍 4、和弓 2 招）；高的不動
 * 舊版    : r3.193.0  (2026-11-28)　鐵砲凝射傷害補到「連」的標準（1.66 → 1.99）
 * 舊版    : r3.184.0  (2026-11-28)　秘傳另外標記 mvx.hd（技能、特技不算秘傳演出）
 * 舊版    : r3.176.0  (2026-11-28)　r3.176.0：野太刀／薙刀／長槍／和弓／鐵砲的招式傷害分級補正（MV2.BAL）
 * 舊版    : r3.143.0  (2026-11-27)　r3.143.0：槍普攻直刺最多 3 個（由近到遠）；薙刀指定擊退也 ×1.3
 * 舊版    : r3.53.0  (2026-11-23)  r3.53.0：秘傳書一律顯示完整順序＋所在鍵位；取消店舖／神社升級給提示　r3.37.0：鐵砲槍口改用第二代素材；r3.35.0：U 定義可指定 kind；r3.36.0：射擊／槍口火光改從逐格錨點（W.muzzle）出現
 * 變更    : r3.34.0 新增。招式（組合技）新引擎＋秘傳連技（規格 VFX_SPEC v2.1 第二、三節）。
 *           ・招式池：每把武器 12 招（沿用 12 個動作圖），分類 起／連／收／架；熟練度 1–11 逐招解鎖。
 *           ・招式依「招式設計」演出：時間軸（第幾格做什麼）＋程式特效（76_vfx），命中判定與特效同一份路徑，不看人物圖的武器位置。
 *           ・連段加成：起→連 ×1.1；連→收 ×1.3（命中回饋升一級）。前一招收招前 8 格起可以接下一段（取消收招）。
 *           ・秘傳連技：最近 3 招（跨鍵也算）照某組順序、每招都有打中、間隔 1 秒內 → 最後那顆鍵發光 0.6 秒，按第 4 下出秘傳。
 *             未參悟也會發光；第一次發動＝參悟（存 rpg.hiden[id]=1）。秘傳書（選單 武器 › 秘傳書）只顯示「？？？」，提示來自店舖／神社升級。
 *           ・招式資料由 78～80（各武器）與 81（秘傳）註冊：G.MV2.reg(武器, {id:def})、G.MV2.hiden(武器, [def])。
 * 存檔    : rpg.hiden（參悟）、rpg.hhint（取得的提示）；不改舊的招式鍵存檔格式（每鍵 3 段）。
 * 依賴    : 03_actors（heroStep／heroStartAct／IN）、13_weapons（W.chain／MV）、15_skill（G.SKB get／start／tick／counter）、76_vfx、08_menu、58_forge（升級）。
 * ========================================================================== */
'use strict';
(function () {
  const H = G.H, SC = G.SC, VX = G.VX, W = G.WPN, HH = () => G.HERO_H, S = y => SC.depth(y);
  const MV2 = G.MV2 = { D: {}, HD: {}, U: {}, POOL: {}, hist: [] };
  const rd = () => G.RPG.d();
  const CATN = { '起': '起手', '連': '連接', '收': '收尾', '架': '架勢' };
  /* ---------- 註冊 ---------- */
  MV2.reg = function (wid, defs) { MV2.D[wid] = Object.assign(MV2.D[wid] || {}, defs); const w = W.BY[wid]; if (!w) return;
    const U = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; w.mv = Object.keys(MV2.D[wid]).map((id, i) => { const d = MV2.D[wid][id]; return { id, n: d.n, k: d.cat === '架' ? 'guard' : 'attack', u: d.u || U[i] || 11, cd: d.cd || 36, cat: d.cat }; });
    w.MV = {}; for (const m of w.mv) w.MV[m.id] = m; };
  MV2.hiden = function (wid, list) { MV2.HD[wid] = list; };
  MV2.BAL = {"teppo":{"retreat_shot":2.54,"point_shot":2.69,"aim_shift":3.27,"pressure_shot":1.47,"focused_shot":1.99,"denial_fire":2.74,"steady_rifle":1.9,"rifle_retreat":1.63,"shoulder_guard":1.8,"stock_deflect":1.8},"yumi":{"moving_shot":3.45,"quick_shot":2.35,"follow_shot":2.75,"fan_release":1.64,"spread_shot":1.4,"piercing_shot":3.22,"full_aim":2.27,"denial_shot":4,"steady_focus":1.8,"lower_retreat":1.8},"nodachi":{"advancing_weight":3.01,"side_path":3.87,"dawn_draw":2.79,"dragging_line":1.07,"low_ridge":3.79,"back_turn":3.04,"retreat_peak":2.75,"planted_break":3.98,"falling_ridge":3.61,"sinking_charge":3.01,"long_line":3.6,"opening_brace":1.8},"yari":{"long_pierce":1.62,"tip_probe":1.61,"intercept_thrust":2.17,"double_thrust":1.55,"side_gap":1.95,"rising_point":1.99,"ground_sweep":2.52,"shaft_break":2.59,"focused_point":1.6,"pulling_retreat":3.72,"fixed_line":1.8,"shaft_gate":1.8},"naginata":{"gliding_wing":1.58,"side_wave":1.94,"retreat_swallow":1.94,"wide_leaf":2.04,"fan_sweep":1.76,"around_diagonal":2.27,"reverse_leaf":2.27,"low_leaf":2.7,"reverse_whirl":2.04,"sinking_leaf":2.39,"upright_deny":1.8,"wing_brace":1.8}};   /* r3.176.0：各武器招式傷害補正倍率（打刀已在 109 直接改數值，不在表內） */
  const DEF = (wid, id) => MV2.D[wid] && MV2.D[wid][id];
  /* ---------- 執行環境 c ---------- */
  function ctxOf(a) { const m = a.mvx; if (m.c) return m.c;
    const c = m.c = { a, def: m.def, get t() { return H.t; }, get f() { return a.face0; }, get s() { return S(H.y); }, get x() { return H.x; }, get y() { return H.y; }, get hh() { return HH() * S(H.y); }, mul: m.mul, fin: m.fin, hiden: m.hiden,
      move(dx, dy) { const k = HH() * S(H.y); if (!(G.tryMove && G.tryMove(H, dx * k * a.face0, (dy || 0) * k))) { H.x += dx * k * a.face0; } },
      inv(n) { H.inv = Math.max(H.inv, n); },
      later(n, fn) { G.STORY.later(n, () => { try { fn(c); } catch (x) { console.warn('mv2 later', x); } }); },
      at(dx, dz) { const k = HH() * S(H.y); return [H.x + a.face0 * dx * k, H.y, (dz || 0) * k]; },   // 主角相對點（前 dx、高 dz）
      /* 傷害：o={shape,r,arc,ang,len,w,x,y,back,m,lv,kind,kb,stun,launch,def,ign,crit,col,face,skip} */
      hit(o) { let hits = VX.area(Object.assign({ face: a.face0 }, o)); if (!hits.length) return hits;
        if (a.kind === 'atk' && o.shape === 'line' && G.WPN.curId() === 'yari' && hits.length > 3) { hits = hits.sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x)).slice(0, 3); }   /* r3.143.0：槍 貫穿最多 3 個 */ const lv0 = o.lv || 'light', lv = c.fin && lv0 === 'light' ? 'mid' : c.fin && lv0 === 'mid' ? 'heavy' : lv0;
        for (const e of hits) { const big = lv === 'heavy' || lv === 'hiden'; G.damageOni(e, (o.m || 1) * c.mul, big, !!o.crit, o.ign ? { ign: o.ign } : undefined);
          if (o.kb !== undefined) e.kb = (o.kbDir || a.face0) * o.kb * HH() * S(e.y) / 6 / (e.ratio || 1) * (G.WPN.TR ? G.WPN.TR.kb() : 1);
          if (o.stun) e.stun = Math.max(e.stun || 0, o.stun); if (o.launch) { e.stun = Math.max(e.stun || 0, o.launch); e.air = Math.max(e.air || 0, o.launch); }
          if (o.def && e.db !== undefined || o.def) { e.db = e.db || {}; e.db.def = Math.max(e.db.def || 0, o.def); e.db.defT = Math.max(e.db.defT || 0, 180); }
          if (o.slow) { e.db = e.db || {}; e.db.slow = Math.max(e.db.slow || 0, o.slow); e.db.slowT = 120; }
          VX.impact(e, lv, o.kind || 'cut', o.hang, o.col); }
        G.WPN.gainProf(1); m.hit = 1; onHit(a); return hits; },
      /* 刀幕＋判定：o 含 ribbon 參數（a0 a1 r w sq rot cy sw col edge）＋ hit 參數；hf＝判定在第幾格（預設 sw×0.6） */
      slash(o) { const s = S(H.y); VX.ribbon(Object.assign({ x: H.x, y: H.y, face: a.face0 }, o)); const hf = o.hf !== undefined ? o.hf : Math.round((o.sw || 5) * 0.6);
        const H0 = { shape: o.shape || 'sector', r: o.hr || (o.r || 1.2) + 0.2, arc: o.arc || 2.2, ang: o.hang0 || 0, m: o.m, lv: o.lv, kind: o.kind || 'cut', kb: o.kb, stun: o.stun, launch: o.launch, def: o.def, ign: o.ign, crit: o.crit, col: o.hcol, len: o.len, w: o.lw, slow: o.slow, hang: o.cutAng };
        if (o.m) { if (hf <= 0) c.hit(H0); else c.later(hf, () => c.hit(Object.assign(H0, { x: H.x, y: H.y }))); } },
      thrust(o) { VX.thrust(Object.assign({ x: H.x, y: H.y, face: a.face0 }, o)); if (o.m) { const hf = o.hf !== undefined ? o.hf : 2; const H0 = { shape: 'line', len: (o.len || 1.6) + 0.15, w: o.hw || 0.35, ang: o.ang || 0, m: o.m, lv: o.lv, kind: o.kind || 'pierce', kb: o.kb, stun: o.stun, launch: o.launch, def: o.def, ign: o.ign, crit: o.crit, col: o.hcol, slow: o.slow, back: 0.2 };
          if (hf <= 0) c.hit(H0); else c.later(hf, () => c.hit(Object.assign(H0, { x: H.x, y: H.y }))); } },
      ghost(n) { VX.ghost(n || 12); },
      /* 射擊：kind bullet|pellet|arrow|bigarrow|bomb|orb；o={ang(徑度,0=前),spd(HH/格),range(HH),m,lv,pierce,home,from:[dx,dz],col,onHit,trail,grav,vz} */
      shoot(kind, o) { const s = S(H.y), k = HH() * s, mz = !o.from && W.muzzle && W.muzzle(), fr = o.from || (mz ? [(mz[0] - H.x) * a.face0 / k, (H.y - mz[1]) / k] : W.curId() === 'teppo' ? [0.95, 0.62] : [0.45, 0.7]), ang = o.ang || 0, sp = (o.spd || 0.3) * HH() * s;   // r3.36.0：從弓弦／槍口錨點（逐格）射出
        const p = VX.shot({ k: kind, x: H.x + a.face0 * fr[0] * k, y: H.y + Math.sin(ang) * fr[0] * k * 0.3, z: fr[1] * k, vx: Math.cos(ang) * sp * a.face0, vy: Math.sin(ang) * sp * 0.6, range: (o.range || 8) * k, pierce: o.pierce || 1, col: o.col || (kind === 'arrow' || kind === 'bigarrow' ? '255,240,200' : '255,190,100'), trail: o.trail || (kind === 'arrow' ? 4 : kind === 'bigarrow' ? 8 : 0), home: o.home, turn: o.turn, grav: o.grav, vz: o.vz || 0, r: o.r,
          onHit: (e, p) => { if (o.onHit && o.onHit(e, p, c) === false) return; const lv0 = o.lv || 'light', lv = c.fin && lv0 === 'light' ? 'mid' : lv0; G.damageOni(e, (o.m || 1) * c.mul, lv === 'heavy', !!o.crit); if (o.kb) e.kb = a.face0 * o.kb * HH() * S(e.y) / 6 / (e.ratio || 1); if (o.stun) e.stun = Math.max(e.stun || 0, o.stun); if (o.def) { e.db = e.db || {}; e.db.def = Math.max(e.db.def || 0, o.def); e.db.defT = 180; }
            VX.impact(e, lv, kind === 'arrow' || kind === 'bigarrow' ? 'arrow' : 'shot', undefined, o.hcol); G.WPN.gainProf(1); m.hit = 1; onHit(a); }, onLand: o.onLand, onEnd: o.onEnd });
        return p; },
      muzzle(big, ang) { const s = S(H.y), k = HH() * s, mz = W.muzzle && W.muzzle(), fr = mz ? [(mz[0] - H.x) * a.face0 / k, (H.y - mz[1]) / k] : W.curId() === 'teppo' ? [0.95, 0.62] : [0.45, 0.7], x = H.x + a.face0 * fr[0] * k, z = fr[1];
        if (W.curId() === 'teppo') { if (VX.muzzle2 && VX.muzzle2(x, H.y, z, a.face0, big, ang)) { VX.spark({ x, y: H.y, z: z * k, n: big ? 6 : 3, ang: (a.face0 > 0 ? 0 : Math.PI) - (ang || 0) * a.face0, spread: 0.35, spd: 7, g: 0.05, col: '255,210,120', life: 8 }); } else { VX.glow({ x, y: H.y, z, r: big ? 0.55 : 0.32, col: '255,190,90', life: big ? 7 : 5 }); VX.spark({ x, y: H.y, z: z * k, n: big ? 10 : 5, ang: (a.face0 > 0 ? 0 : Math.PI) - (ang || 0) * a.face0, spread: 0.35, spd: 7, g: 0.05, col: '255,210,120', life: 9 }); VX.smoke({ x: x + a.face0 * 6, y: H.y, z: z * k, n: big ? 5 : 3, vx: a.face0 * 0.8, r: big ? 0.16 : 0.11, life: 46, a: 0.45 }); } }   // r3.37.0：第二代槍口火焰＋硝煙
        else { VX.streak({ x: H.x + a.face0 * 0.3 * k, y: H.y, cy: 0.7, face: a.face0, ang: ang || 0, len: 0.5, n: 3, life: 6, spread: 0.25, col: '255,245,220' }); VX.glow({ x, y: H.y, z, r: 0.18, col: '255,240,200', life: 5 }); } },
      fx: VX };
    return c; }
  /* ---------- 連段紀錄、秘傳判定 ---------- */
  function onHit(a) { const m = a.mvx; if (!m || m.hiden || m.rec) return; m.rec = 1; const h = MV2.hist[MV2.hist.length - 1]; if (h && h.a === a) h.hit = 1; checkHiden(a); }
  function checkHiden(a) { const L = MV2.hist.slice(-3); if (L.length < 3 || L.some(h => !h.hit)) return; for (let i = 1; i < 3; i++) if (L[i].t0 - L[i - 1].tEnd > 60) return;
    const wid = W.curId(), ids = L.map(h => h.id), hd = (MV2.HD[wid] || []).find(x => x.seq.join() === ids.join()); if (!hd) return;
    H.hidenRdy = { k: a.chainK, id: hd.id, wid, t: 0, end: a.T - H.t + 36 }; }
  /* ---------- 取代行為引擎（招式鍵出招時 03_actors 會呼叫 SKB.get／start） ---------- */
  (function wait() { const SK = G.SKB; if (!SK || !G.heroStep || !G.heroStartAct) return setTimeout(wait, 20);
    const get0 = SK.get.bind(SK), st0 = SK.start.bind(SK), tk0 = SK.tick.bind(SK), ct0 = SK.counter.bind(SK);
    SK.get = (wid, id) => DEF(wid, id) ? true : get0(wid, id);
    SK.start = function (a, s, lv) { const u = MV2.U[W.curId()] && MV2.U[W.curId()][s.id]; if (u && a.chainK === undefined) { begin(a, u, true); a.mvx.mul = a.mult || 1; a.mvx.lv = lv; return true; }   // 奧義重做（82_ult）
      const d = DEF(W.curId(), s.id); if (!d || a.chainK === undefined) return st0(a, s, lv); begin(a, d, false); return true; };
    SK.tick = function (a, mx, my) { if (a.mvx) return; return tk0(a, mx, my); };
    SK.counter = function (e) { const a = H.act; if (a && a.mvx && a.mvx.def.counter) { const c = ctxOf(a); try { a.mvx.def.counter(c, e); } catch (x) { console.warn(x); } G.hitstop = 8; SC.shake = 6; G.UI.toast('格擋反擊！'); return true; } return ct0(e); };
    /* 主角每格：跑時間軸；秘傳第 4 下 */
    const hs0 = G.heroStep; G.heroStep = function () { const IN = G.IN, R = H.hidenRdy;
      if (R) { R.t++; const key = 'c' + (R.k + 1); if (IN[key] && (!H.act || H.act.mvx && !H.act.mvx.hiden)) { IN[key] = false; startHiden(R); } else if (R.t > R.end) H.hidenRdy = null; }
      const r = hs0.apply(this, arguments); const a = H.act; if (a && a.mvx) tick(a); return r; };
    /* 秘傳鍵發光 */
    const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); const R = H.hidenRdy, B = G.UI.B; if (!R || !B) return; const b = B['c' + (R.k + 1)]; if (!b) return; const ctx = G.ctx, p = 0.5 + 0.5 * Math.sin(G.t * 0.5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.6, b.x, b.y, b.r * 2); g.addColorStop(0, 'rgba(255,90,70,' + (0.55 + 0.35 * p) + ')'); g.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,200,' + (0.6 + 0.4 * p) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 4 + p * 3, 0, 6.283); ctx.stroke(); ctx.restore();
      G.txt('秘', b.x, b.y - b.r - 12, 13, '#ffdcc8', 'center', G.FONT_S, 900); }; })();
  function begin(a, d, hiden) { const prev = MV2.hist[MV2.hist.length - 1], recent = prev && G.playT - prev.tEnd <= 60;
    let mul = (a.mult || 1) / (a.seg === 2 ? 1.2 : 1), fin = false;   /* 03_actors 第 3 段 ×1.2 改由分類加成取代 */ if (!hiden && recent) { if (d.cat === '連' && prev.cat === '起') mul *= 1.1; if (d.cat === '收' && (prev.cat === '連' || prev.cat === '起')) { mul *= prev.cat === '連' ? 1.3 : 1.15; fin = prev.cat === '連'; } }
    if (!hiden && d.cat && MV2.BAL) { const B = MV2.BAL[W.curId()], D0 = MV2.D[W.curId()] || {}, id = B && Object.keys(D0).find(k => D0[k] === d); if (id && B[id]) mul *= B[id]; }   /* r3.176.0：招式傷害分級（起≈普攻 1.25 倍、連 1.45 倍、收 2.2 倍；實測後逐招補正） */
    a.mvx = { def: d, mul, fin, hiden, hit: 0 }; a.face0 = H.face; a.ev = []; a.T = d.T; a.c = { cx: [d.cx || d.T - 8, d.cx || d.T - 8] }; a.kind = d.kind || (hiden ? 'ult' : d.cat === '架' ? 'guard' : 'skill');
    if (!hiden) { if (prev && !prev.tEnd) prev.tEnd = G.playT; MV2.hist.push({ a, id: Object.keys(MV2.D[W.curId()]).find(k => MV2.D[W.curId()][k] === d), cat: d.cat, t0: G.playT, tEnd: G.playT + d.T, hit: 0 }); if (MV2.hist.length > 8) MV2.hist.shift(); }
    if (d.inv) H.inv = Math.max(H.inv, d.inv); }
  function tick(a) { const m = a.mvx, c = ctxOf(a); try { m.def.run(c, H.t); } catch (x) { console.warn('mv2', x); if (a.mvx && a.mvx.def) a.mvx.def.run = () => {}; }
    const h = MV2.hist[MV2.hist.length - 1]; if (h && h.a === a && H.t >= a.T - 1) h.tEnd = G.playT; }
  /* ---------- 秘傳發動 ---------- */
  function startHiden(R) { const hd = (MV2.HD[R.wid] || []).find(x => x.id === R.id); H.hidenRdy = null; if (!hd) return;
    H.act = null; H.st = 'idle'; if (!G.heroStartAct(hd.clip, 'ult', { mult: 1 })) G.heroStartAct(W.cur().combo[0], 'ult', { mult: 1 });
    const a = H.act; a.chainK = R.k; begin(a, hd, true); a.mvx.hd = 1; a.mvx.mul = (G.GROW ? G.GROW.mvMul() : 1);
    H.inv = Math.max(H.inv, hd.T + 6); MV2.hist = [];
    if (R.test) { G.UI.banner('秘傳・' + hd.n, '（測試施放）'); return; }
    const d = rd(); d.hiden = d.hiden || {}; const first = !d.hiden[hd.id]; d.hiden[hd.id] = 1; if (first) { G.SAVE.markDirty(); G.UI.banner('秘傳・' + hd.n, '參悟了新的秘傳連技'); } else G.UI.banner('秘傳・' + hd.n, ''); }
  /* ---------- 秘傳書（選單 武器 › 秘傳書） ---------- */
  const M = G.MENU;
  (function wait3() { if (!M || !M.PAGE || !M.ui) return setTimeout(wait3, 20);
    M.PAGE['秘傳書'] = function (x, y, w, h) { const { box, scrollArea, clip } = M.ui, ctx = G.ctx, C = G.C, fs = G.FS(), wid = W.curId(), L = MV2.HD[wid] || [], d = rd(), hd = d.hiden || {}, hh = d.hhint || {};
      box(x, y, w, h); G.txt('秘傳書　' + W.cur().n, x + 16, y + 24, 16, C.gold, 'left', G.FONT_S, 900); G.txt('參悟 ' + L.filter(q => hd[q.id]).length + '／' + L.length, x + w - 16, y + 24, 12, C.sub, 'right', G.FONT, 700);
      const RH = 54 * fs; const off = scrollArea('hiden', x, y + 40, w, h - 46, L.length * RH + 40); clip(x, y + 40, w, h - 46);
      L.forEach((q, i) => { const yy = y + 44 + i * RH + off, got = hd[q.id], hint = hh[q.id]; ctx.fillStyle = got ? 'rgba(150,40,30,.25)' : 'rgba(255,255,255,.04)'; G.rr(x + 10, yy, w - 20, RH - 6, 6); ctx.fill();
        G.txt((got ? '秘傳・' : '未參悟・') + q.n, x + 22, yy + RH * 0.32, 15, got ? '#ffd2c0' : '#f3d98a', 'left', G.FONT_S, 900);
        const nm = id => (W.cur().MV[id] || {}).n || id, at = id => { for (let k = 0; k < 3; k++) { const c = W.chain(k) || []; const j = c.indexOf(id); if (j >= 0) return '〔鍵' + (k + 1) + '・第' + (j + 1) + '段〕'; } return '〔未裝〕'; };
        G.txt(q.seq.map(id => nm(id) + at(id)).join(' → '), x + 22, yy + RH * 0.68, 12, got ? C.ink : '#efe4cc', 'left', G.FONT, 600); });
      G.txt('照順序打中這三招（可跨鍵，間隔 1 秒內），最後那顆招式鍵會發光——再按一下出秘傳。', x + 16, y + 44 + L.length * RH + off + 14, 11, C.sub, 'left', G.FONT, 500); ctx.restore(); };
    if (M.TABS && Array.isArray(M.TABS) && !M.TABS.includes('秘傳書')) M.TABS.push('秘傳書');
    if (M.GROUPS) for (const g of M.GROUPS) if (g[0] === '武器' && !g[1].some(s => s[1] === '秘傳書')) g[1].push(['秘傳書', '秘傳書']); })();
  /* r3.53.0：取消店舖／神社升級給秘傳提示（秘傳書直接顯示） */
  MV2.CATN = CATN; MV2.onHit = onHit;
  MV2.play = id => { const wid = W.curId(), hd = (MV2.HD[wid] || []).find(x => x.id === id); if (hd) startHiden({ k: 0, id, wid, test: 1 }); };   // 測試頁直接施放秘傳
})();
