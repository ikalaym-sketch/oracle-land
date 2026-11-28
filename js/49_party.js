/* ==========================================================================
 * 神諭之地 重製版 — 49_party.js
 * Version : r3.223.0  (2026-11-28)　r3.223.0：汐音移動改用滑行／衝刺動作
 * 舊版    : r3.222.0  (2026-11-28)　r3.222.0：夥伴跟隨主角裝備 60%、升階改 Lv25／50 並加能力
 * 舊版    : r3.144.0  (2026-11-27)　r3.144.0：夥伴放招的名字改成左邊頭像血條旁的泡泡（統一字色、無符號；大連攜外框閃一下），頭上的字拿掉
 * 舊版    : r3.59.0  （r3.59.0：招式 noFit 不壓縮事件時點）　r3.58.0：出招名字依定位上色、大連攜字級 18
 * 舊版    : r3.21.0  （r3.21.0：夥伴沿牆滑開，卡住 0.75 秒跟到主角旁）
 * 舊版    : r3.19.2  （r3.19.2：滿版時夥伴頭像貼齊左側）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 跟隨改遲滯＋配速、走跑分開、換邊延遲繞外側；升階先沿用舊外觀背景下載新階（修夥伴消失）。
 * 變更    : r3.10.0 新增。夥伴出戰系統：
 *           ・出戰 2 位（含白丸，可替換）；夥伴實體跟隨、索敵、出招、受傷、倒地與救起。
 *           ・敵人選目標改仇恨值：傷害累積＋距離＋嘲諷，換目標至少隔 3 秒（一般妖怪／頭目共用）。
 *           ・五通道：普攻、自主（自動）、指令（點頭像）、小連攜（主角重擊命中後自動接）、大連攜（連攜條滿後點頭像）。
 *           ・招式資料與事件時點來自素材包（G.PKIT，50_party_kit.js）；圖集第 9 欄已做逐動作比例校正。
 * 依賴    : 03_actors（drawWorld 排序、damageOni、hurtHero）、12_anim、26_boss（頭目目標代理）、07_rpg（夥伴存檔 comp）。
 * 效能    : 索敵每 10 格一次、仇恨每 30 格重算；不在每格建立新陣列（重用 near 暫存）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, H = G.H, SC = G.SC, A = G.ANIM, TK = 1000 / 60, HH = () => G.HERO_H;
  const R = () => G.RPG, D = () => G.RPG.d(), F = () => G.SAVE.data.flags;
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6);
  const alive = e => e && e.st !== 'dead' && !(e.delay > 0) && !(e.alpha <= 0);
  const PY = G.PARTY = { list: [], proj: [], zones: [], pend: [], heal: 0, err: 0, lastErr: '', kpi: {} };
  const err = (w, e) => { PY.err++; PY.lastErr = w + ': ' + String(e && e.stack || e).slice(0, 240); };

  /* ---------- 存檔：出戰位與夥伴資料（存在 rpg.comp[id]） ---------- */
  PY.slots = () => { const d = D(); if (!d.party) d.party = F().shiroJoin ? ['shiro', null] : [null, null]; return d.party; };
  PY.joined = id => id === 'shiro' ? !!F().shiroJoin : !!F()['join_' + id] || !!F()['test_' + id];
  PY.data = id => { const d = D(); const c = d.comp[id] || (d.comp[id] = { lv: Math.max(1, d.lv - 3), exp: 0 });
    c.nodes = c.nodes || {}; c.sel = c.sel || {}; c.eq = c.eq || {}; if (c.pts0 === undefined) c.pts0 = 2; return c; };
  PY.setSlot = (i, id) => { const s = PY.slots(); const j = s.indexOf(id); if (id && j >= 0) s[j] = s[i]; s[i] = id; G.SAVE.markDirty(); PY.sync(); };

  /* ---------- 能力值：等級底值×定位倍率＋主角裝備攻擊 30%＋夥伴自己的裝備 ---------- */
  PY.stats = id => { const def = PY.DEF[id], c = PY.data(id), lv = c.lv, S = R().S, hb = 14 + 3 * (D().lv - 1);
    const s = { atk: (14 + 3 * (lv - 1)) * def.atkK, def: (4 + 1.5 * (lv - 1)) * def.defK, hp: (120 + 18 * (lv - 1)) * def.hpK, crit: 5, critD: 150 };
    s.atk += Math.max(0, (S ? S.atk : hb) - hb) * 0.6;   /* r3.222.0：跟著主角裝備成長的比例 30% → 60%（沒幫夥伴穿裝備時太弱） */
    for (const k in c.eq) { const it = c.eq[k]; if (!it) continue; const st = R().itemStats(it); for (const a in st) if (s[a] !== undefined) s[a] += st[a]; }
    { const g = PY.stage(id), k = g >= 3 ? 1.35 : g === 2 ? 1.15 : 1; if (k > 1) { s.atk *= k; s.hp *= k; s.def *= k; } }   /* r3.222.0：外觀升階同時變強（第 2 階 +15%、第 3 階 +35%） */
    if (PY.passive) PY.passive(id, s); return s; };

  /* ---------- 實體 ---------- */
  function unitOf(P) { const def = PY.DEF[P.id]; return A.get(def.unit(P)); }
  const ALT = { walk: ['glide'], run: ['dash', 'glide', 'walk'] };   /* r3.223.0：沒有走／跑動作的夥伴（汐音）改用滑行、衝刺，不再用站姿平移 */
  function rec(P, n) { const u = unitOf(P), def = PY.DEF[P.id]; if (!u) return null; const X = u.act; if (X[def.pre + n]) return X[def.pre + n]; for (const a of ALT[n] || []) if (X[def.pre + a]) return X[def.pre + a]; return null; }
  function play(P, n, loop) { const r = rec(P, n) || rec(P, 'idle'); P.clip = n; P.r = r; P.ms = 0; P.loop = !!loop; }
  function make(id, x, y) { const s = PY.stats(id); return { id, x, y, face: H.face, hp: s.hp, hpMax: s.hp, st: 'follow', cd: {}, ms: 0, t: 0, tg: null, link: 0, down: 0, dmgT: 0, hurtT: 0, wr: 0, stg: PY.stage(id) }; }
  PY.sync = function () {   // 依出戰位建立／移除實體（換場、換位時呼叫）
    const s = PY.slots(), keep = [];
    for (let i = 0; i < 2; i++) { const id = s[i]; if (!id || !PY.joined(id) || !PY.DEF[id]) continue;
      let P = PY.list.find(q => q.id === id); if (!P) { P = make(id, H.x - H.face * (40 + i * 30), H.y + 6 + i * 10); PY.load(id); }
      P.slot = i; keep.push(P); }
    PY.list = keep; for (const P of PY.list) if (!P.r) play(P, 'idle', true);
  };
  PY.load = id => { const def = PY.DEF[id]; if (!def) return Promise.resolve(); const P = PY.list.find(q => q.id === id);
    return Promise.all([A.load(def.unit(P || { id })), def.fx ? A.load(def.fx).catch(() => {}) : 0]).catch(e => err('load ' + id, e)); };
  PY.stage = id => { const lv = PY.data(id).lv; return lv >= 50 ? 3 : lv >= 25 ? 2 : 1; };   /* r3.222.0：升階改看等級（Lv25／Lv50）；原本看技能點，Lv3 就會換外觀 */

  /* ---------- 仇恨：敵人選目標 ---------- */
  const TH = e => e.th || (e.th = { hero: 0 });
  PY.threat = (e, who, v) => { const t = TH(e); t[who] = (t[who] || 0) + v; };
  PY.targetOf = function (e) {   // 回傳 G.H 或夥伴實體
    if (!PY.list.length) return H;
    if (e.tgT > 0 && e.tgO && (e.tgO === H || (e.tgO.st !== 'down' && PY.list.includes(e.tgO)))) { e.tgT--; return e.tgO; }
    const t = TH(e); let best = H, bs = (t.hero || 0) + 400 / (dist(e, H) + 60) * 10;
    for (const P of PY.list) { if (P.st === 'down') continue; const s = (t[P.id] || 0) + 400 / (dist(e, P) + 60) * 10 + (P.taunt > 0 && dist(e, P) < 260 ? 1e4 : 0);
      if (s > bs * 1.2) { bs = s; best = P; } }
    for (const k in t) t[k] *= 0.97;   // 每 3 秒衰減（本函式約每 0.5 秒～3 秒呼叫一次）
    e.tgO = best; e.tgT = 180; return best; };

  /* ---------- 夥伴受傷／倒地／救起 ---------- */
  PY.hurt = function (P, atk, srcX, src) { if (!P || P.st === 'down' || P.inv > 0) return false;
    const s = PY.stats(P.id), d = Math.max(1, Math.round(atk * (1 - s.def / (s.def + 60)) * (1 - (P.dr || 0)) * (0.9 + Math.random() * 0.2)));
    P.hp -= d; P.inv = 20; P.hurtT = 18; G.NUMS.push({ x: P.x, y: P.y - HH() * PY.DEF[P.id].ratio - 6, v: d, hurt: true, t: 0 }); kpi(P.id, 'taken', d);
    if (P.hp <= 0) { P.hp = 0; P.st = 'down'; P.down = 0; P.rev = 0; play(P, PY.DEF[P.id].downClip, false); P.cur = null; G.UI.toast(PY.DEF[P.id].name + ' 倒下了──靠近 2 秒可扶起'); }
    else if (!P.cur) play(P, 'hurt'); return true; };
  function downStep(P) { P.down++; const near = Math.hypot(H.x - P.x, H.y - P.y) < 56, calm = !G.E.some(e => alive(e) && dist(e, P) < 420);
    P.rev = near ? P.rev + 1 : Math.max(0, P.rev - 2);
    if (P.rev >= 120 || (calm && P.down >= 600)) { P.st = 'follow'; P.hp = Math.round(P.hpMax * 0.3); P.inv = 90; play(P, PY.DEF[P.id].riseClip); P.after = 'idle'; G.UI.toast(PY.DEF[P.id].name + ' 站起來了'); } }

  /* ---------- 傷害：夥伴打妖怪（不吃主角吸血、不產主角氣） ---------- */
  PY.dmg = function (P, e, mult, o) { if (!alive(e)) return; o = o || {}; const s = PY.stats(P.id);
    const nl = PY.nodeMul ? PY.nodeMul(P, o.ch) : 1, m = mult * nl;
    G.damageOni(e, m, !!o.big, false, Object.assign({ party: P, atk: s.atk, crit: s.crit, critD: s.critD }, o.opt || {}));
    PY.threat(e, P.id, s.atk * m * (PY.DEF[P.id].thK || 1)); P.link = Math.min(100, P.link + (o.big ? 8 : 3)); kpi(P.id, 'dmg', s.atk * m); };
  const kpi = (id, k, v) => { const o = PY.kpi[id] || (PY.kpi[id] = {}); o[k] = (o[k] || 0) + v; };
  PY.kpiAdd = kpi;

  /* ---------- 出招：播放片段＋依事件時點結算 ---------- */
  PY.cast = function (P, ch, why) { const kit = G.PKIT && G.PKIT[P.id]; if (!kit) return false;
    const sid = PY.variant ? PY.variant(P.id, ch) : ch, sk = kit[sid] || kit[ch]; if (!sk) return false;
    if (sk.can && !sk.can(P)) return false;
    const r = rec(P, sk.clip); if (!r) return false;
    // 事件時點：頭目圖集的夥伴版動作若比事件短，等比壓進動作 85% 內；延後段（after）不卡住動作，另排程
    const dur = A.dur(r), main = sk.ev.filter(e => !e.after), last = main.length ? main[main.length - 1].t : 0, k = PY.DEF[P.id].pre && !sk.noFit && last > dur * 0.85 ? dur * 0.85 / last : 1;   // r3.59.0：noFit＝事件照原時點（賴光鎮惡門架勢）
    const ev = main.map(e => k === 1 ? e : Object.assign({}, e, { t: Math.round(e.t * k) }));
    for (const e of sk.ev) if (e.after) PY.pend.push({ P, ev: e, n: Math.round(e.t / TK), c: { sid, ch, sk, tg: P.tg } });
    P.cur = { sid, ch, sk, ev, t: 0, fired: 0, tg: P.tg, why }; P.r = r; P.clip = sk.clip; P.ms = 0; P.loop = false; P.st = 'cast';
    if (P.tg && Math.abs(P.tg.x - P.x) > 4) P.face = Math.sign(P.tg.x - P.x);
    if (ch !== 'ordinary') { P.say = { t: 70, n: sk.name, sp: ch === 'grandCombo' }; kpi(P.id, 'n_' + sid, 1); } else kpi(P.id, 'n_ordinary', 1);
    return true; };
  function castStep(P) { const c = P.cur, sk = c.sk; c.t += TK; P.ms += TK;
    const ev = c.ev; while (c.fired < ev.length && ev[c.fired].t <= c.t) { try { G.PEV.run(P, ev[c.fired], c); } catch (x) { err('ev ' + P.id + ' ' + c.sid, x); } c.fired++; }
    const dur = Math.max(A.dur(P.r), (ev.length ? ev[ev.length - 1].t : 0) + 60);
    if (c.t >= dur) { P.cur = null; P.st = 'follow'; play(P, 'idle', true); } }

  /* ---------- 主角重擊命中 → 小連攜；連攜條滿 → 大連攜 ---------- */
  PY.onHeroBig = function (e) { for (const P of PY.list) { if (P.st === 'down' || P.cur || (P.cd.small || 0) > 0) continue;
    P.tg = e; if (PY.cast(P, 'smallCombo', 'hero')) { P.cd.small = PY.cdOf(P, 'smallCombo'); break; } } };
  PY.cdOf = (P, ch) => { const base = { autonomous: 720, command: 1260, smallCombo: 480, grandCombo: 0 }[ch] || 600;
    const kit = G.PKIT[P.id], sid = PY.variant ? PY.variant(P.id, ch) : ch, sk = kit && (kit[sid] || kit[ch]); return Math.round((sk && sk.cd ? sk.cd * 60 : base) * (PY.cdMul ? PY.cdMul(P, ch) : 1)); };

  /* ---------- AI ---------- */
  let tick = 0;
  function pickTarget(P) { const def = PY.DEF[P.id], range = def.ranged ? 460 : 380; let best = null, bs = 1e9;
    const ht = H.lastHit && alive(H.lastHit) ? H.lastHit : null;
    for (const e of G.E) { if (!alive(e)) continue; const d = dist(e, P), dh = dist(e, H); if (dh > range + 120 && d > range) continue;
      let s = d * 0.6 + dh * 0.4; if (e === ht) s -= 80; if (e.tgO === H) s -= def.guard ? 140 : 40; if (e.boss) s += def.guard ? -60 : 30; if (s < bs) { bs = s; best = e; } }
    return best; }
  function moveTo(P, tx, ty, sp) { const dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy); if (d < 3) return true;
    const k = Math.min(sp, d) / d, nx = P.x + dx * k, ny = P.y + dy * k * 0.8;
    if (G.tryMove(P, nx - P.x, ny - P.y)) P.stk = 0; else if ((P.stk = (P.stk || 0) + 1) > 45 || d > 200) { const q = SC.snap ? SC.snap(tx, ty, 'walk', 80) : null; if (q) { P.x = q[0]; P.y = q[1]; } P.stk = 0; }   /* r3.21.0：沿牆滑開；卡住 0.75 秒就跟到主角旁 */
    if (Math.abs(dx) > 2) P.face = Math.sign(dx); return false; }
  // 升階：先沿用舊外觀並背景下載新階，載完才換圖（保留目前動作與進度）；沒有分階的夥伴不受影響
  function stageWatch(P) { const def = PY.DEF[P.id]; if (def.pre) return; const ns = PY.stage(P.id); if (P.stg === ns) return;
    const nu = 'p_' + P.id + '_' + ns; if (A.get(nu)) { P.stg = ns; const r = rec(P, P.clip) || rec(P, 'idle'); if (r) P.r = r; if (P.cur) P.r = rec(P, P.cur.sk.clip) || P.r; return; }
    if (P.ldg !== nu) { P.ldg = nu; A.load(nu).catch(e => { err('stage ' + P.id, e); P.ldg = null; }); } }
  function step(P) {
    P.t++; if (P.inv > 0) P.inv--; if (P.taunt > 0) P.taunt--; if (P.hurtT > 0) P.hurtT--; for (const k in P.cd) if (P.cd[k] > 0) P.cd[k]--;
    if (P.dr && --P.drT <= 0) P.dr = 0;
    const s = PY.stats(P.id); if (P.hpMax !== Math.round(s.hp)) { const r = P.hp / P.hpMax; P.hpMax = Math.round(s.hp); P.hp = Math.round(P.hpMax * r); }
    stageWatch(P);
    if (P.st === 'down') { P.ms += TK; downStep(P); return; }
    if (P.cur) { castStep(P); return; }
    if (P.after && P.ms < A.dur(P.r || {}) ) { P.ms += TK; return; } P.after = null;
    const def = PY.DEF[P.id], fdx = H.x - P.x, fd = Math.hypot(fdx, H.y - P.y);
    if (fd > 520) { P.x = H.x - H.face * 50; P.y = H.y + 8; P.tg = null; }   // 走散太遠：直接回到主角身邊
    if ((P.t + P.slot * 5) % 10 === 0) { if (!alive(P.tg) || dist(P.tg, H) > 620) P.tg = pickTarget(P); }
    const e = alive(P.tg) ? P.tg : null; let moving = false, sp = def.spd;
    if (e) {
      // 自主技：情境符合就放
      if (!(P.cd.auto > 0) && PY.cast(P, 'autonomous', 'auto')) { P.cd.auto = PY.cdOf(P, 'autonomous'); return; }
      const want = def.ranged ? def.keep : def.reach * 0.8, dx = e.x - P.x, d = dist(e, P);
      if (d > want + 30 || Math.abs(e.y - P.y) > 26) { const side = Math.sign(P.x - e.x) || -H.face; moving = !moveTo(P, e.x + side * want * 0.95, e.y + (P.slot ? 10 : -6), def.spd); }
      else if (def.ranged && d < def.keep * 0.55) { sp = def.spd * 0.8; moving = !moveTo(P, P.x + Math.sign(P.x - e.x) * 40, P.y, sp); }
      else { P.face = Math.sign(dx) || P.face; if (!(P.cd.atk > 0)) { if (PY.cast(P, 'ordinary', 'atk')) P.cd.atk = def.atkCd; return; } }
    } else {
      if (!(P.cd.auto > 0) && def.autoIdle && PY.cast(P, 'autonomous', 'auto')) { P.cd.auto = PY.cdOf(P, 'autonomous'); return; }
      // 換邊延遲：主角持續朝新方向 24 格（0.4 秒）才換到另一側，避免急轉時穿身亂竄
      if (P.side === undefined) P.side = -H.face;
      if (-H.face !== P.side) { if ((P.sideT = (P.sideT || 0) + 1) > 24) { P.side = -H.face; P.sideT = 0; } } else P.sideT = 0;
      const crossing = Math.sign(P.x - H.x) !== P.side && Math.abs(P.x - H.x) < def.follow + 20;
      const dip = crossing && P.y - H.y < 26, tx = dip ? P.x - P.side * 6 : H.x + P.side * (def.follow + P.slot * 34), ty = H.y + 6 + P.slot * 12 + (crossing ? 34 : 0);   // 換邊：先往外側（下方）讓開再繞過去
      const fd2 = Math.hypot(tx - P.x, ty - P.y);
      // 遲滯：超過 28 才起步、進 6 以內才停，主角連續移動時不再走停走停
      if ((P.fm && PY.hv > 0.6) || (P.fm ? fd2 > 6 : fd2 > 28)) { P.fm = true;
        sp = Math.max(def.spd * 0.6, Math.min(PY.hv * 1.05 + fd2 * 0.04, def.spd * 1.6));
        moving = !moveTo(P, tx, ty, sp) || PY.hv > 0.6; if (!moving) P.fm = false; }   // 主角還在動：到位也持續跟走，不停下
      else { P.fm = false; if (Math.abs(fdx) > 6) P.face = Math.sign(fdx); }
    }
    loco(P, moving, sp);
  }
  // 移動動作：跑／走依實際速度（含遲滯），走↔跑切換保留相位；停下至少走滿 10 格才切回待機
  function loco(P, moving, sp) { P.clipT = (P.clipT || 0) + 1;
    if (moving) { P.mvT = 10; const run = P.clip === 'run' ? sp > 1.6 : sp > 2.0, n = run && rec(P, 'run') ? 'run' : 'walk';
      if (P.clip !== n) { const ms = P.ms, was = P.clip === 'walk' || P.clip === 'run'; play(P, n, true); if (was) P.ms = ms; P.clipT = 0; }
      P.ms += TK * Math.max(0.7, Math.min(1.4, sp / (n === 'run' ? 2.1 : 1.2))); return; }
    if ((P.clip === 'walk' || P.clip === 'run') && P.mvT > 0) { P.mvT--; P.ms += TK * 0.7; return; }
    if (P.clip !== 'idle') { play(P, 'idle', true); P.clipT = 0; } P.ms += TK; }
  let hx0 = null, hy0 = 0; PY.hv = 0;
  PY.step = function () { if (!PY.list.length) return; tick++;
    const hv = hx0 === null ? 0 : Math.hypot(H.x - hx0, H.y - hy0); hx0 = H.x; hy0 = H.y; PY.hv = hv > 40 ? 0 : PY.hv * 0.7 + hv * 0.3;   // 主角實際移速（平滑；換場瞬移不算）
    for (const P of PY.list) { try { step(P); } catch (x) { err('step ' + P.id, x); } }
    for (let i = PY.pend.length - 1; i >= 0; i--) { const q = PY.pend[i]; if (--q.n > 0) continue; PY.pend.splice(i, 1); if (q.P.st !== 'down' && PY.list.includes(q.P)) try { G.PEV.run(q.P, q.ev, q.c); } catch (x) { err('pend', x); } }
    try { G.PEV.stepWorld(); } catch (x) { err('world', x); } };

  /* ---------- 繪製：與角色一起依 y 排序 ---------- */
  PY.add = L => { for (const P of PY.list) L.push({ y: P.y, pa: P }); };
  PY.draw = function (P) { const u = unitOf(P), def = PY.DEF[P.id]; if (!u || !P.r) return; const s = SC.depth(P.y);
    const sc = HH() * def.ratio * s / def.refH(P), fr = A.frameAt(P.r, P.loop ? P.ms : Math.min(P.ms, A.dur(P.r) - 1));
    { const w = 14 * s * Math.min(1.3, def.ratio + 0.25); ctx.fillStyle = 'rgba(30,20,10,.32)'; ctx.beginPath(); ctx.ellipse(P.x, P.y, w, w * 0.32, 0, 0, 6.283); ctx.fill(); }
    const a = P.st === 'down' ? 0.85 : P.inv > 0 && P.hurtT > 0 && (G.t >> 2) % 2 ? 0.5 : 1;
    A.draw(u, fr, P.x, P.y, sc, (P.face < 0) !== !!def.flip, a);
    /* r3.144.0：招式名改在左上頭像旁的泡泡顯示（PY.hud） */
    if (P.st === 'down') { const q = P.rev / 120; G.txt('扶起 ' + Math.round(q * 100) + '%', P.x, P.y - HH() * def.ratio * s - 14, 11, q > 0 ? '#ffe7a8' : '#d8c9b0', 'center'); }
    else if (P.hp < P.hpMax) { const w = 34, y = P.y - HH() * def.ratio * s * 1.05 - 8; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(P.x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = '#7fd36b'; ctx.fillRect(P.x - w / 2, y, w * P.hp / P.hpMax, 3); } };

  /* ---------- 戰鬥畫面頭像：點＝指令；連攜條滿＝大連攜 ---------- */
  const BTN = [], FREQ = {};
  PY.hud = function () { BTN.length = 0; const x0 = Math.min(G.SAFE.l, 6) + 8, y0 = G.SAFE.t + 84;
    PY.list.forEach((P, i) => { const def = PY.DEF[P.id], x = x0, y = y0 + i * 58, r = 22, cx = x + r, cy = y + r, ready = P.link >= 100, cd = P.cd.cmd || 0, cdm = PY.cdOf(P, 'command') || 1;
      BTN.push({ x, y, w: r * 2 + 40, h: r * 2, P });
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fillStyle = 'rgba(16,10,14,.8)'; ctx.fill(); ctx.clip();
      const im = G.IMG[def.face]; if (!im && !FREQ[def.face]) { FREQ[def.face] = 1; G.ASSET.img(def.face, 'a/' + def.face + '.webp').catch(() => {}); } if (im) ctx.drawImage(im, cx - r, cy - r, r * 2, r * 2); else G.txt(def.name[0], cx, cy + 1, 18, '#f3e8d2', 'center', G.FONT_S, 900);
      if (P.st === 'down') { ctx.fillStyle = 'rgba(40,0,0,.6)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
      if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -1.571, -1.571 + 6.283 * cd / cdm); ctx.fill(); }
      ctx.restore();
      ctx.lineWidth = ready ? 3 : 1.5; ctx.strokeStyle = ready ? `rgba(255,214,90,${0.6 + 0.4 * Math.sin(G.t * 0.2)})` : 'rgba(227,194,122,.7)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + r * 2 + 6, y + 8, 40, 5); ctx.fillStyle = '#7fd36b'; ctx.fillRect(x + r * 2 + 6, y + 8, 40 * P.hp / P.hpMax, 5);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + r * 2 + 6, y + 17, 40, 4); ctx.fillStyle = ready ? '#ffd65a' : '#6fb7ff'; ctx.fillRect(x + r * 2 + 6, y + 17, 40 * P.link / 100, 4);
      G.txt(ready ? '大連攜' : cd > 0 ? Math.ceil(cd / 60) + '秒' : '指令', x + r * 2 + 6, y + 33, 10, ready ? '#ffd65a' : '#d8c9b0', 'left');
      bubble(P, x + r * 2 + 6 + 40 + 10, y + 14); }); };
  /* r3.144.0：放招泡泡——血條右邊，尖角指向頭像；彈出 0.15 秒、停約 1 秒、淡出 0.3 秒；大連攜外框閃一下 */
  function bubble(P, bx, by) { const S = P.say; if (!S || !(S.t > 0)) return; S.t--; const age = 70 - S.t, k = Math.min(1, age / 9), a = Math.min(1, S.t / 18), fs = G.FS ? G.FS() : 1;
    ctx.save(); ctx.font = `900 ${12 * fs}px ${G.FONT_S}`; const tw = ctx.measureText(S.n).width, w = tw + 18, h = 22 * Math.max(1, fs * 0.9), sc = 0.7 + 0.3 * (1 - Math.pow(1 - k, 3));
    ctx.globalAlpha = a; ctx.translate(bx, by); ctx.scale(sc, sc);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -5); ctx.lineTo(7, 5); ctx.closePath(); ctx.fillStyle = 'rgba(16,10,14,.85)'; ctx.fill();
    G.rr(6, -h / 2, w, h, 7); ctx.fillStyle = 'rgba(16,10,14,.85)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(227,194,122,.75)'; ctx.stroke();
    if (S.sp && age < 24) { const f = 1 - age / 24; ctx.lineWidth = 2 + 3 * f; ctx.strokeStyle = `rgba(255,236,170,${0.9 * f})`; G.rr(6 - 2 * f, -h / 2 - 2 * f, w + 4 * f, h + 4 * f, 8); ctx.stroke(); }
    G.txt(S.n, 6 + w / 2, 1, 12, '#f3e8d2', 'center', G.FONT_S, 900); ctx.restore(); }
  PY.tap = function (p) { for (const b of BTN) { if (p.x < b.x || p.x > b.x + b.w || p.y < b.y || p.y > b.y + b.h) continue; const P = b.P;
      if (P.st === 'down' || P.cur) return true; if (!P.tg || !alive(P.tg)) P.tg = pickTarget(P);
      if (P.link >= 100) { if (PY.cast(P, 'grandCombo', 'tap')) P.link = 0; return true; }
      if ((P.cd.cmd || 0) > 0) { G.UI.toast(PY.DEF[P.id].name + '：指令冷卻中'); return true; }
      if (PY.cast(P, 'command', 'tap')) P.cd.cmd = PY.cdOf(P, 'command'); return true; }
    return false; };

  /* ---------- 換場：重新就位 ---------- */
  PY.enter = function () { PY.proj.length = 0; PY.zones.length = 0; PY.pend.length = 0; PY.sync();
    PY.list.forEach((P, i) => { P.x = H.x - H.face * (40 + i * 34); P.y = H.y + 6 + i * 12; P.cur = null; P.tg = null; if (!unitOf(P)) A.load(PY.DEF[P.id].unit(P)).catch(e => err('enter ' + P.id, e)); if (P.st !== 'down') { P.st = 'follow'; play(P, 'idle', true); } }); };
})();
