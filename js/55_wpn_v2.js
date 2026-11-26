/* ==========================================================================
 * 神諭之地 重製版 — 55_wpn_v2.js
 * Version : r3.19.5  （r3.19.5：走／跑恢復逐動作校正，跑步不再變大；整體仍 ×0.9）
 * 舊版    : r3.18.2
 * 舊版    : r3.16.0  (2026-11-14)
 * 變更    : r3.12.0 新增。主角武器重做（依「武器招式重設計規格」，一次一種武器；本版：打刀）。
 *           ・身法全武器共用 3 種：閃身／瞬步／後跳（滑行、空蟬移除；舊存檔自動替換）。
 *           ・打刀招式 12→4：踏步引刃（突進）、回身分月（環身清場）、挑刃散勢（控制）、交鋒返脈（防守反擊）；舊存檔的招式鍵依類型換成新招。
 *           ・每招尺寸校正 ACTK（以待機為 1；離線依身體面積量測），解決出招時人物忽大忽小。
 *           ・刃線錨點 BLADE（離線偵測每格刀身位置）：刀光從刀身出現並跟著動作逐格移動。
 *           ・普攻判定改以身高 H 為單位；技／特技／奧義／招式三階數值照規格表；新增向量特效（刀光線、環形刀光、半月光、白氣、劍痕、花瓣）。
 * 變更    : r3.13.0 鐵砲／和弓：槍口／弓弦錨點（MUZ，離線偵測每格槍口）；飛行物分類（鉛彈、散彈、炮彈、細箭、紅光箭、藍光追蹤箭、天降光矢）以向量繪製，
 *           大小依身高比例；鐵砲每發槍口火光＋硝煙；招式各 12→4（鐵砲：退步側射／近膛散擊／火花斷進／肩架護膛；和弓：移步側射／穿點離弦／壓弦拒進／換步藏弓）。
 * 變更    : r3.14.0 長槍／斧：槍尖／斧刃錨點；長槍直線判定與刺光、地面光槍、龍形光帶、命中標記 3 秒後爆炸；斧流血（紅色滴落＋持續傷害）、迴旋飛斧（向量）、
 *           劈地裂口、山崩三次巨劈前移；招式各 12→4（長槍：穿陣長突／掃地封步／鐵桿破守／桿架橫門；斧：踏劈開門／橫岳重掃／楔刃破甲／架斧候隙）。
 * 變更    : r3.15.0 錫杖：普攻改施法動作（光彈／雙光彈／貫光／光柱），借用葛葉（符陣、封印）與汐音（回復）的特效圖；神雷鎖定最近 3 敵＋連鎖、
 *           日輪每 0.5 秒照射全場、結界地面光紋、印位共鳴光線相連、全隊回復。金棒：重擊感（頓幀加長、震動、衝擊環、土塊），借用白丸震地特效；
 *           鬼神降期間普攻變砸地＋體型 1→1.15 漸變。招式各 12→4。
 * 變更    : r3.16.0 野太刀／薙刀／鎖鎌：刃線錨點、判定以 H 為單位；大車輪環形刀光＋極意衝擊波、天地一刀天降巨刃＋地面劍陣、千鳥電光拖尾、大颶風向量旋風、
 *           鎖鎌鎖鏈線（手到鎖頭，拉近時敵人沿鎖鏈逐格拖回）、旋鎖鎖鏈繞圈、百鬼封陣極意鬼火追蹤；招式各 12→4。
 * 依賴    : 13_weapons（G.WPN）、15_skill（G.SKB）、03_actors（G.spawnFx／heroFrame）。
 * ========================================================================== */
'use strict';
(function () {
  const ACTK = {"katana":{"arc_step":0.77,"blade_receive":0.8,"cast_fuda":0.75,"cast_gogyo":0.75,"cast_tama":0.75,"combo_finish_1":0.93,"combo_finish_2":0.92,"counter":0.93,"dead_hold":1.14,"diagonal_lane":0.79,"downward_finish":0.78,"draw":1.17,"fall":1.06,"getup":1.1,"iai_basic":1.07,"iai_evolved":1.15,"iai_master":1.16,"issen":1.13,"issen_evolved":1.13,"issen_master":1.13,"leaving_cut":0.83,"low_probe":0.81,"normal_1":0.93,"open_guard":0.78,"return_weave":0.77,"rising_disrupt":0.77,"sheathe":1.12,"sheathed_retreat":0.8,"shunpo":1.17,"slide":1.1,"special_breath":0.83,"special_home":0.77,"special_return":0.78,"special_tide":0.8,"step_cut":0.85,"turning_sweep":0.84,"utsu_followup":0.93,"walk":1.08,"run":0.93,"jump_dash":0.91}};
  const BLADE = {"katana":{"normal_1":[[44,-64],null,[65,-66],[52,-34]],"normal_2":[null,null,[53,-105],[52,-119]],"normal_3":[[44,-111],[30,-112],[52,-29],null],"combo_finish_1":[[32,-94],[49,-92],[58,-33]],"iai_basic":[null,null,null,[37,-59],[74,-66],[58,-25],[44,-41],null,null],"iai_evolved":[null,null,null,null,[67,-56],[48,-22],[39,-30],null,null],"iai_master":[null,null,null,null,null,null,null,null,null],"issen":[null,null,null,null,null,null,null,null,null],"issen_evolved":[null,null,null,null,null,null,null,null,null],"issen_master":[null,null,null,null,null,null,null,null,null],"sakura_basic":[[44,-74],[-38,-85],null,[44,-90],[-21,-106],[64,-57],[18,-101],[57,-22],[54,-52]],"sakura_evolved":[[41,-79],[-48,-84],[70,-17],[52,-102],[-40,-102],[80,-56],[40,-108],null,[54,-32]],"sakura_master":[[47,-81],[-59,-82],null,[52,-101],[32,-104],[74,-58],[-37,-109],null,[59,-68]],"tsubame":[null,null,null,null,[44,-80],[56,-38],[52,-36],null,null],"tsubame_evolved":[null,null,null,null,[44,-80],[56,-38],[52,-36],null,null],"tsubame_master":[null,null,null,null,[44,-80],[54,-39],[52,-36],null,null],"special_breath":[[54,-45],[46,-129],[54,-82],[78,-88],[48,-82],[54,-45]],"special_home":[[59,-48],[56,-100],[74,-39],[-22,-74],null,null],"special_return":[[59,-48],[52,-108],[54,-96],[64,-30],null,[59,-48]],"special_tide":[[58,-46],null,[56,-131],[76,-73],[73,-40],[58,-46]],"sakuramai":[null,[50,-28],[47,-102],null,[72,-76],[60,-26],[22,-104],null,null],"sakuramai_evolved":[null,[50,-28],[47,-102],null,[74,-76],null,[25,-102],[46,-34],null],"sakuramai_master":[null,[50,-28],[47,-102],null,[72,-76],null,[24,-103],null,null],"step_cut":[[54,-44],[-30,-64],[-32,-68],[76,-75],[58,-46],[54,-44]],"turning_sweep":[[56,-44],[-54,-70],null,[82,-80],null,[56,-44]],"rising_disrupt":[[59,-48],[-43,-66],[44,-88],[58,-130],[60,-148],[59,-48]],"blade_receive":[[55,-47],[55,-122],[48,-129],[68,-89],[-38,-59],[56,-46]]}};
  const W = G.WPN, H = G.H, SC = G.SC, HH = () => G.HERO_H, TK = 1000 / 60, s0 = () => SC.depth(H.y);

  /* ---------- 1. 身法共用 3 種、打刀招式 4 招 ---------- */
  const BODY = ['dodge', 'shunpo', 'backstep'];
  const KEEP_MV = { teppo: [['retreat_shot', '退步側射', 'attack', 1, 30], ['close_scatter', '近膛散擊', 'attack', 3, 36], ['denial_fire', '火花斷進', 'attack', 6, 48], ['shoulder_guard', '肩架護膛', 'guard', 9, 30]],
    yumi: [['moving_shot', '移步側射', 'attack', 1, 30], ['piercing_shot', '穿點離弦', 'attack', 3, 36], ['denial_shot', '壓弦拒進', 'attack', 6, 36], ['covered_step', '換步藏弓', 'attack', 9, 30]], katana: [['step_cut', '踏步引刃', 'attack', 1, 30], ['turning_sweep', '回身分月', 'attack', 3, 48], ['rising_disrupt', '挑刃散勢', 'attack', 6, 30], ['blade_receive', '交鋒返脈', 'guard', 9, 30]] };
  const MAPMV = { teppo: { aim_shift: 'shoulder_guard', focused_shot: 'retreat_shot', point_shot: 'retreat_shot', pressure_shot: 'denial_fire', ramrod_load: 'close_scatter', rifle_retreat: 'retreat_shot', steady_rifle: 'shoulder_guard', stock_deflect: 'shoulder_guard' },
    yumi: { fan_release: 'denial_shot', follow_shot: 'piercing_shot', full_aim: 'piercing_shot', lower_retreat: 'covered_step', mark_aim: 'piercing_shot', quick_shot: 'moving_shot', spread_shot: 'denial_shot', steady_focus: 'covered_step' }, katana: { arc_step: 'turning_sweep', diagonal_lane: 'step_cut', downward_finish: 'rising_disrupt', leaving_cut: 'step_cut', low_probe: 'rising_disrupt', open_guard: 'blade_receive', return_weave: 'turning_sweep', sheathed_retreat: 'step_cut' } };
  for (const w of W.LIST) {
    w.body = w.body.filter(b => BODY.includes(b.id)); w.BD = {}; for (const b of w.body) w.BD[b.id] = b;
    const km = KEEP_MV[w.id]; if (km) { w.mv = km.map(([id, n, k, u, cd]) => ({ id, n, k, u, cd })); w.MV = {}; for (const m of w.mv) w.MV[m.id] = m; } }
  const slots0 = W.slots;
  W.slots = function (wid) { const id = wid || W.curId(), s = slots0.call(W, id), w = W.BY[id];
    if (s._v2 !== 2) { s._v2 = 2; const mp = MAPMV[id] || {}, fix = m => m && (w.MV[m] ? m : mp[m] || null);
      s.M = (s.M || []).filter(m => w.BD[m]); for (const b of BODY) if (s.M.length < 2 && !s.M.includes(b) && w.BD[b]) s.M.push(b);
      if (KEEP_MV[id]) { if (s.C) s.C = s.C.map(fix); if (s.K) s.K = s.K.map(c => c.map(fix)); }
      G.SAVE.markDirty(); }
    return s; };
  /* 招式等級：職業系統上線前固定 Lv1；測試可用 G.WPN.mvLvSet 指定 */
  W.mvLv = () => W._mvLv || 1; W.mvLvSet = n => { W._mvLv = n; };

  /* ---------- 2. 每招尺寸校正 ---------- */
  W.HERO_K = 0.9;   // r3.18.2：主角整體縮到與成年 NPC 同高（原本比 NPC 高 6～17%）
  W.actK = name => W.HERO_K * ((name && (ACTK[W.curId()] || {})[name]) || 1);   // r3.19.5：走／跑恢復原校正（跑步不再變大）

  /* ---------- 3. 刃線錨點（刀身中段～刀尖） ---------- */
  W.bladePt = function () { const a = H.act; if (!a) return null; const L = (BLADE[W.curId()] || {})[a.name]; if (!L) return null;
    const fr = G.heroFrame(), i = a.r.f.indexOf(fr); if (i < 0) return null; let p = L[i];
    for (let d = 1; !p && d < L.length; d++) p = L[i - d] || L[i + d];
    if (!p) return null; const u = W.unit(), sc = HH() * s0() / ((u && u.refH) || 130) * W.actK(a.name);
    return [H.x + H.face * p[0] * sc, H.y - (H.hop || 0) + p[1] * sc]; };
  /* 刀身特效：在主角附近出現的刀光改從刀身出，並跟著動作移動 */
  const BLADE_FX = /^(fx_tier_katana_|hero_katana_iai_fx_)/;
  const sp0 = G.spawnFx;
  G.spawnFx = function (name, tier, x, y, face, s) {
    if (name === 'hero_katana_sakura_fx_a') return VF('petalburst', { x, y, r: HH() * 1.2 * s0(), life: 22 }) && null;   // 千本櫻／櫻花亂舞：改用程式繪製的櫻花特效
    if (name === 'hero_katana_sakura_fx_b') { VF('slashline', { x0: x - HH() * 0.5 * s0(), y0: y - HH() * 0.3 * s0(), x1: x + HH() * 0.5 * s0(), y1: y + HH() * 0.3 * s0(), w: 4, life: 12, col: '255,190,215' }); VF('slashline', { x0: x - HH() * 0.5 * s0(), y0: y + HH() * 0.25 * s0(), x1: x + HH() * 0.5 * s0(), y1: y - HH() * 0.25 * s0(), w: 3, life: 12, col: '255,235,245' }); return VF('petalburst', { x, y, r: HH() * 0.6 * s0(), life: 18 }) && null; }
    if (name === 'hero_katana_sakura_fall') return VF('petalfall', { x, y: y + HH() * 0.6 * s0(), r: HH() * 1.2 * s0(), life: 60 }) && null;
    if (name === 'skyarrow') return VF('skyarrow', { x, y: y + HH() * 0.5 * s0(), h: HH() * s0(), life: 12 }) && null;
    const bp = H.act && BLADE_FX.test(name || '') && Math.abs(x - H.x) < HH() * 2 * s0() ? W.bladePt() : null;
    const f = sp0(name, tier, bp ? bp[0] : x, bp ? bp[1] : y, face, s); if (f && bp) { f.act = H.act; f.fol = 1; } return f; };

  /* ---------- 4. 普攻判定（身高 H 為單位；reach 換回合約單位 ÷1.4） ---------- */
  const EVP = { teppo: { normal_1: { pk: 'lead', d: 7 }, combo_finisher_1: { pk: 'pellet', d: 3, arc: 60, pellets: 5, kb: 0.5 } },
    yumi: { normal_1: { pk: 'arrow', d: 9 }, normal_2: { pk: 'arrow', d: 9 }, combo_finisher_1: { pk: 'arrow', d: 10, pierce: 3, trail: 1 } }, katana: { normal_1: { d: 1.0, arc: 90 }, normal_2: { d: 1.0, arc: 90 }, normal_3: { d: 1.0, arc: 90 }, combo_finish_1: { d: 1.3, arc: 120, kb: 0.5 } } };
  W.patchAct = function (name, r) { r._p = 1; const P = (EVP[W.curId()] || {})[name]; if (!P || P.pk || !r.c || !r.c.ev) return;
    r.c = Object.assign({}, r.c, { ev: r.c.ev.map(e => Object.assign({}, e, { reach: P.d * HH() / 1.4, arc: P.arc * Math.PI / 180 }, P.kb ? { kb: P.kb } : {})) }); };

  /* ---------- 5. 打刀行為表（技／特技／奧義／招式；m3＝進化、m5＝極意） ---------- */
  const SKB = G.SKB;
  Object.assign(SKB.BEH.katana, {
    iai: { t: 'dash', d: 3, m: 2, fx: 'hero_katana_iai_fx_a', trail: 1, m3: { dist: 1.5, pierce: 1 }, m5: { rePath: 1 } },
    issen: { t: 'behind', d: 4, m: 2.4, charge: 18, fx: 'hero_katana_iai_fx_b', m3: { resetDodge: 1 }, m5: { crit: 1 } },
    sakura: { t: 'spin', n: 4, r: 1.2, m: 0.7, fx: 'hero_katana_sakura_fx_a', fx2: 'hero_katana_sakura_fall', compress: 7, mobile: 1, storm: 1, m3: { dot: { t: 180, m: 0.25, fx: 'hero_katana_sakura_fall' } }, m5: { petals: 5 } },
    tsubame: { t: 'multi', n: 2, m: 1.1, r: 1.2, alt: 1, fx: 'fx_tier_katana_basic', fx5: 'skill_wind_blade_a', m3: { n: 1 }, m5: { wave: 1 } },
    special_breath: { t: 'qi', v: 30, fx: 'skill_light_glyph_a', aura: 1, m3: { qiX: 1.5 }, m5: { buff: { aspd: 15, t: 300 } } },
    special_home: { t: 'stance', dur: 48, m: 2.2, cr: 1.3, fx: 'feedback_guard_a', moon: 1, m3: { dur: 30 }, m5: { crit: 1 } },
    special_return: { t: 'back', d: 1.0, m: 1.4, fx: 'fx_tier_katana_basic', m3: { dist: 1.5 }, m5: { scar: 1 } },
    special_tide: { t: 'multi', n: 3, m: 0.8, r: 1.07, line: 1, adv: 1.25, thrust: 1, fx: 'skill_water_break_a', m3: { knock: 1.5 }, m5: { pull: 1 } },
    sakuramai: { t: 'blink', n: 8, m: 1.1, fx: 'hero_katana_sakura_fx_b', fx2: 'hero_katana_sakura_fall', storm: 1, m3: { n: 3 }, m5: { rain: { t: 180, m: 2, r: 2, fx: 'hero_katana_sakura_fall' } } },
    step_cut: { t: 'dash', d: 1.5, m: 1.2, fx: 'fx_tier_katana_basic', trail: 1, m3: { dist: 1.3 }, m5: { inv: 1 } },
    turning_sweep: { t: 'nova', r: 1.0, m: 1.3, fx: 'fx_tier_katana_basic', ringFx: 1, m3: { r: 1.3 }, m5: { twice: 1 } },
    rising_disrupt: { t: 'multi', n: 1, m: 1.2, r: 1.0, up: 1, stun: 36, fx: 'fx_tier_katana_basic', m3: { stun: 54 }, m5: { vuln: 20 } },
    blade_receive: { t: 'stance', dur: 36, m: 1.6, cr: 1.2, fx: 'feedback_guard_a', spark: 1, m3: { dur: 18 }, m5: { toFinish: 1 } } });

  const alive = e => e.st !== 'dead' && e.delay <= 0;
  const inFront = (e, reach, half) => { const dx = (e.x - H.x) * H.face; return dx > -14 && dx < reach + 20 && Math.abs(e.y - H.y) < half; };
  const VF = (k, o) => G.FX.push(Object.assign({ k, t: 0 }, o));
  const chestY = () => H.y - HH() * 0.52 * s0();

  /* 一閃：蓄力 → 瞬移到最近敵人（≤4H）身後一斬，畫一道橫向白光 */
  function behind(a, s, lv, b) { const B = a.B = Object.assign({}, b, lv >= 3 ? b.m3 : {}, lv >= 5 ? b.m5 : {}); a.beh = 'behind'; a.ev = []; a.noMv = true; a.sched = [];
    const c = a.c, t0 = Math.max(2, (c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.35))) + B.charge; a.T += B.charge;
    G.spawnFx('skill_light_glyph_a', 0, H.x, chestY(), H.face, s0() * 1.4);
    a.sched.push({ t: t0, f: () => { const R = HH() * B.d * s0(), L = G.E.filter(e => alive(e) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < R).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x)), e = L[0];
      const x0 = H.x, y0 = chestY();
      if (e) { H.face = e.x > H.x ? 1 : -1; const tx = e.x + H.face * HH() * 0.6 * s0(); if (SC.walkable(tx, e.y)) { H.x = tx; H.y = e.y; } H.face = -H.face; }
      else G.tryMove(H, H.face * HH() * 2 * s0(), 0);
      VF('slashline', { x0, y0, x1: H.x, y1: chestY(), w: 5, life: 20, col: '255,255,255' });
      G.spawnFx(b.fx, 0, (x0 + H.x) / 2, chestY(), H.face, s0() * 2.2);
      if (e) { SKB.hitE(e, a, B.m, { last: true, big: true, crit: !!B.crit }); G.hitstop = 8; SC.shake = 7; }
      if (B.resetDodge && e) for (const k in H.cd) if (k.startsWith('m:')) H.cd[k] = 0; } });
    return true; }

  /* 原引擎出招後，加上打刀專屬的特效與極意機制 */
  function extras(a, s, lv, b) { const B = a.B; if (!B) return;
    const wrap = g => { for (const x of a.sched) { const f = x.f, t = x.t; x.f = () => { f(); g(t); }; } };
    if (B.trail || B.rePath) { const x0 = H.x, y0 = H.y, mv = a.mv2;   // 突進：路徑刀光；極意：1 秒後原路徑再爆
      a.sched.push({ t: (mv ? mv.f1 : 12) + 1, f: () => { VF('slashline', { x0, y0: y0 - HH() * 0.5 * s0(), x1: H.x, y1: chestY(), w: 4, life: 22, col: '230,245,255' });
        if (B.rePath) G.ZONES.push({ k: 'trap', x: x0, y: y0, len: Math.abs(H.x - x0), r: HH() * 0.6 * s0(), t: 0, life: 62, at: 60, m: B.m * 0.8, a, fx: b.fx, face: H.face }); } }); }
    if (B.alt) { let i = 0; wrap(() => { const up = i++ % 2 === 0, cy = chestY(), L = HH() * 1.0 * s0();   // 燕返：上下交錯刀光
      VF('slashline', { x0: H.x + H.face * L * 0.1, y0: cy + (up ? 1 : -1) * L * 0.45, x1: H.x + H.face * L, y1: cy + (up ? -1 : 1) * L * 0.45, w: 4, life: 14, col: '220,240,255' }); }); }
    if (B.thrust) wrap(() => VF('slashline', { x0: H.x + H.face * HH() * 0.3 * s0(), y0: chestY(), x1: H.x + H.face * HH() * 1.6 * s0(), y1: chestY(), w: 3, life: 10, col: '200,235,255' }));
    if (B.up) wrap(() => VF('slashline', { x0: H.x + H.face * HH() * 0.2 * s0(), y0: H.y - HH() * 0.1 * s0(), x1: H.x + H.face * HH() * 0.9 * s0(), y1: H.y - HH() * 1.1 * s0(), w: 5, life: 14, col: '255,240,210' }));
    if (B.ringFx) wrap(() => VF('ring', { x: H.x, y: H.y, r: HH() * (B.r || 1) * s0(), life: 18 }));
    if (B.compress) { const ts = [...new Set(a.sched.map(x => x.t))].sort((p, q) => p - q), t0 = ts[0]; for (const x of a.sched) x.t = t0 + ts.indexOf(x.t) * B.compress; a.T = t0 + (ts.length - 1) * B.compress + 8; }   // 千本櫻：四段迴旋加快，打完立刻收招
    if (B.storm) a.sched.push({ t: 2, f: () => VF('petalstorm', { x: H.x, y: H.y, r: HH() * (B.r || 1.2) * s0(), life: Math.max(30, a.T + 10), n: b.t === 'blink' ? 30 : 24 }) });
    if (B.aura) a.sched.push({ t: 2, f: () => VF('aura', { x: H.x, y: H.y, life: 50 }) });
    if (B.moon) a.sched.push({ t: Math.max(3, a.T - 6), f: () => VF('moon', { x: H.x, y: chestY(), r: HH() * 0.9 * s0(), face: H.face, life: 18 }) });
    if (B.scar) { const x0 = H.x, y0 = H.y; a.sched.push({ t: 2, f: () => { VF('scar', { x: x0, y: y0, len: HH() * 1.0 * s0(), face: H.face, life: 62 });
      G.ZONES.push({ k: 'burst', x: x0 + H.face * HH() * 0.4 * s0(), y: y0, r: HH() * 0.8 * s0(), t: 0, life: 60, m: B.m * 1.2, a, fx: 'weapon_cut_b' }); } }); }
    const lastT = a.sched.length ? a.sched[a.sched.length - 1].t : 0;
    if (B.petals) wrap(t => { if (t !== lastT) return; for (let k = 0; k < B.petals; k++) { const an = k * 6.283 / B.petals;   // 花瓣 5 片追蹤
      G.PROJ.push({ x: H.x + Math.cos(an) * 20, y: H.y, h: HH() * 0.6 * s0(), vx: Math.cos(an) * 4, vy: Math.sin(an) * 2, left: HH() * 6, d0: HH() * 6, mult: B.m * 0.6 * (a.mult || 1), raw: B.m * 0.6, a, pierce: 1, hits: [], face: H.face, home: 1, petal: 1, img: 'petal' }); } });
    if (B.rain && B.rain.r) wrap(() => { for (const z of G.ZONES) if (z.a === a && z.k === 'rain') z.r = HH() * B.rain.r * s0(); }); }
  const st0 = SKB.start;
  SKB.start = function (a, s, lv) { const b = SKB.get(W.curId(), s.id); if (!b) return false;
    if (b.t === 'behind') return behind(a, s, lv, b);
    if (b.t === 'fire' || b.t === 'evade') return custom(a, s, lv, b);
    const ok = st0.call(SKB, a, s, lv); if (ok) { extras(a, s, lv, b); a.sched.sort((p, q) => p.t - q.t); const tl = a.sched.length ? a.sched[a.sched.length - 1].t : 0, pad = b.t === 'line' ? 26 : 4; if (tl + pad > a.T) a.T = tl + pad; } return ok; };   // 動作長度至少涵蓋最後一個排程（連射第 3～5 發不會被截掉）
  /* 架勢反擊：前扇範圍內全部反擊（cr＝半徑 H）；接刃火花；交鋒返脈極意：反擊後可立刻接普攻第 4 段 */
  const ct0 = SKB.counter;
  SKB.counter = function (e) { const a = H.act, B = a && a.B, ok = ct0.call(SKB, e); if (!ok || !B) return ok;
    if (B.cr) for (const o of G.E) if (o !== e && alive(o) && inFront(o, HH() * B.cr * s0(), HH() * 0.5 * s0())) SKB.hitE(o, a, B.m, { last: true, big: true, crit: B.crit });
    if (B.spark) for (let k = 0; k < 10; k++) G.FX.push({ k: 'spark', x: H.x + H.face * 14, y: chestY(), vx: H.face * (1 + Math.random() * 3), vy: -1 - Math.random() * 3, t: 0, life: 22 });
    if (B.moon) VF('moon', { x: H.x, y: chestY(), r: HH() * 1.1 * s0(), face: H.face, life: 20 });
    if (B.toFinish) { H.toFinish = 1; a.T = Math.min(a.T, H.t + 4); G.UI.toast('反擊！接普攻第 4 段'); }
    return ok; };

  /* ---------- 6. 向量特效 ---------- */
  const petal = (c, x, y, sz, rot, al) => { c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = al; c.fillStyle = '#ffb7cd'; c.beginPath(); c.moveTo(0, -sz); c.quadraticCurveTo(sz * 0.9, -sz * 0.2, 0, sz); c.quadraticCurveTo(-sz * 0.9, -sz * 0.2, 0, -sz); c.fill();
    c.fillStyle = '#ffe9f1'; c.beginPath(); c.ellipse(0, -sz * 0.2, sz * 0.25, sz * 0.5, 0, 0, 6.283); c.fill(); c.restore(); };
  G.FXV = {
    petalstorm(f, a, c) { f.x = H.x; f.y = H.y; const sz = HH() * s0() * 0.1;   // 櫻花風暴：花瓣繞身旋轉、半徑隨時間擴張
      for (let i = 0; i < f.n; i++) { const an = f.t * 0.16 + i * 6.283 / f.n, rr = f.r * (0.55 + 0.45 * ((i * 7) % 5) / 4) * (0.7 + 0.3 * Math.min(1, f.t / 12)), x = f.x + Math.cos(an) * rr, y = f.y - HH() * s0() * (0.25 + 0.5 * ((i * 3) % 4) / 3) + Math.sin(an) * rr * 0.35;
        petal(c, x, y, sz, an * 2 + i, Math.min(1, a * 2)); } },
    petalburst(f, a, c) { const k = 1 - a, sz = HH() * s0() * 0.09; c.save(); c.strokeStyle = 'rgba(240,120,165,' + a * 0.9 + ')'; c.lineWidth = 3 + 4 * a; c.beginPath(); c.ellipse(f.x, f.y + HH() * s0() * 0.45, f.r * (0.5 + k * 0.6), f.r * (0.5 + k * 0.6) * 0.4, 0, 0, 6.283); c.stroke(); c.restore();
      for (let i = 0; i < 16; i++) { const an = i * 0.3927 + f.x * 0.01, rr = f.r * (0.2 + k * 0.9); petal(c, f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr * 0.45, sz, an + f.t * 0.3, a); } },
    petalfall(f, a, c) { const sz = HH() * s0() * 0.08; for (let i = 0; i < 18; i++) { const ph = (f.t * 1.2 + i * 29) % 70, x = f.x + (((i * 53) % 100) / 50 - 1) * f.r + Math.sin(ph * 0.1 + i) * 6, y = f.y - HH() * s0() * 1.6 + ph * HH() * s0() * 1.6 / 70;
        petal(c, x, y, sz, ph * 0.12 + i, Math.min(1, a * 2) * (1 - ph / 90)); } },
    slashline(f, a, c) { const g = c.createLinearGradient(f.x0, f.y0, f.x1, f.y1); g.addColorStop(0, 'rgba(' + f.col + ',0)'); g.addColorStop(0.7, 'rgba(' + f.col + ',' + a + ')'); g.addColorStop(1, 'rgba(255,255,255,' + a + ')');
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = g; c.lineCap = 'round';
      for (const [w, k] of [[f.w * 3, 0.25], [f.w, 1]]) { c.globalAlpha = k; c.lineWidth = w * (0.4 + a * 0.6); c.beginPath(); c.moveTo(f.x0, f.y0); c.lineTo(f.x1, f.y1); c.stroke(); } c.restore(); },
    ring(f, a, c) { const p = Math.min(1, f.t / (f.life * 0.6)); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(225,240,255,' + a + ')'; c.lineWidth = 2 + 4 * a;
      c.beginPath(); c.ellipse(f.x, f.y - 4, f.r, f.r * 0.42, 0, -Math.PI / 2, -Math.PI / 2 + p * 6.283); c.stroke(); c.restore(); },
    moon(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,236,170,' + a + ')'; c.lineWidth = 3 + 5 * a; c.lineCap = 'round';
      const r = f.r * (0.8 + 0.2 * (1 - a)); c.beginPath();
      if (f.face > 0) c.arc(f.x, f.y, r, -1.4, 1.4); else c.arc(f.x, f.y, r, Math.PI - 1.4, Math.PI + 1.4); c.stroke(); c.restore(); },
    aura(f, a, c) { f.x = H.x; f.y = H.y; c.save(); c.globalCompositeOperation = 'lighter'; const col = f.col || '235,245,255';
      const h = HH() * s0(), g = c.createRadialGradient(f.x, f.y - h * 0.5, 0, f.x, f.y - h * 0.5, h * 0.7); g.addColorStop(0, 'rgba(' + col + ',' + a * 0.35 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(f.x, f.y - h * 0.5, h * 0.45, h * 0.7, 0, 0, 6.283); c.fill();   // 身上白氣：柔光＋上升氣流
      for (let i = 0; i < 10; i++) { const ph = (f.t * 1.8 + i * 17) % 60, x = f.x + Math.sin(i * 2.1 + f.t * 0.06) * h * 0.28, y = f.y - h * 0.1 - ph * h / 55; c.fillStyle = 'rgba(245,250,255,' + (a * 0.7 * (1 - ph / 60)) + ')';
        c.beginPath(); c.ellipse(x, y, h * 0.04, h * 0.1, 0, 0, 6.283); c.fill(); } c.restore(); },
    scar(f, a, c) { const fl = f.t > f.life - 10 ? 1 : 0.5 + 0.3 * Math.sin(f.t * 0.6); c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,' + (120 + 100 * (1 - fl)) + ',120,' + fl + ')'; c.lineWidth = 2 + 3 * fl; c.beginPath(); c.moveTo(f.x, f.y - 2); c.lineTo(f.x + f.face * f.len, f.y - 8); c.stroke(); c.restore(); },
    petal(p, c) { const py = p.y - p.h, an = (G.t || 0) * 0.2 + p.x * 0.05; c.save(); c.translate(p.x, py); c.rotate(an); c.fillStyle = 'rgba(255,183,205,.95)';
      c.beginPath(); c.ellipse(0, 0, 6, 3.2, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,240,245,.8)'; c.beginPath(); c.ellipse(1.5, 0, 2.5, 1.3, 0, 0, 6.283); c.fill(); c.restore(); }
  };

  /* ======== 7. 鐵砲／和弓 ======== */
  Object.assign(ACTK, {"teppo":{"walk":1.14,"aim_shift":1.08,"close_scatter":1.08,"denial_fire":1.09,"focused_shot":1.08,"point_shot":1.08,"pressure_shot":1.08,"ramrod_load":1.08,"retreat_shot":1.09,"rifle_retreat":1.12,"shoulder_guard":1.07,"skill_sandan_basic":1.06,"skill_sandan_evolved":1.06,"skill_sandan_master":1.06,"skill_sogeki_basic":1.2,"skill_sogeki_evolved":1.2,"skill_sogeki_master":1.2,"special_guardshot":1.08,"special_precision":1.07,"special_reloadshot":1.08,"special_scatterback":1.09,"steady_rifle":1.09,"stock_deflect":1.08,"ultimate_hyakuren_basic":1.09,"ultimate_hyakuren_evolved":1.09,"ultimate_hyakuren_master":1.09,"run":1.15,"jump_dash":1.1},"yumi":{"combo_finisher_4":0.92,"guard":0.93,"lower_retreat":1.13,"skill_bakuretsu_basic":0.9,"skill_bakuretsu_evolved":0.9,"skill_bakuretsu_master":0.9,"skill_sanrenya_basic":0.93,"skill_sanrenya_evolved":0.93,"skill_sanrenya_master":0.93,"skill_tenkyu_basic":0.9,"skill_tenkyu_evolved":0.9,"skill_tenkyu_master":0.9,"skill_tsuikon_basic":0.91,"skill_tsuikon_evolved":0.91,"skill_tsuikon_master":0.91}});
  const MUZ = {"teppo":{"close_scatter":[[62,-55],[69,-76],[71,-74],[71,-78],[70,-61],[62,-55]],"combo_finisher_1":[[88,-93],[88,-108],[86,-112],[92,-93]],"denial_fire":[[62,-55],[46,-52],[35,-52],[56,-51],[35,-51],[62,-55]],"normal_1":[[66,-53],[76,-103],[76,-95],[78,-91],[71,-106],[57,-106],[75,-94],[65,-47]],"retreat_shot":[[62,-55],[65,-109],[72,-105],[71,-100],[67,-92],[62,-55]],"shoulder_guard":[[62,-55],[54,-109],[53,-97],[51,-94],[62,-97],[62,-55]],"skill_horoku_basic":[[38,-50],[42,-50],[49,-49],[63,-100],[56,-78],[46,-48]],"skill_horoku_evolved":[[38,-50],[42,-50],[49,-49],[63,-100],[56,-78],[46,-48]],"skill_horoku_master":[[38,-50],[42,-50],[49,-49],[63,-100],[56,-78],[46,-48]],"skill_rensha_basic":[[67,-79],[72,-102],[67,-104],[74,-104],[70,-102],[69,-103]],"skill_rensha_evolved":[[67,-79],[72,-102],[67,-104],[74,-104],[70,-102],[69,-103]],"skill_rensha_master":[[67,-79],[72,-102],[67,-104],[74,-104],[70,-102],[69,-103]],"skill_sandan_basic":[[66,-53],[66,-112],[77,-99],[56,-48],[78,-93],[49,-47]],"skill_sandan_evolved":[[66,-53],[66,-112],[77,-99],[56,-48],[78,-93],[49,-47]],"skill_sandan_master":[[66,-53],[66,-112],[77,-99],[56,-48],[78,-93],[49,-47]],"skill_sogeki_basic":[[64,-51],[76,-107],[81,-102],[79,-100],[73,-108],[76,-57]],"skill_sogeki_evolved":[[64,-51],[76,-107],[81,-102],[79,-100],[73,-108],[76,-57]],"skill_sogeki_master":[[64,-51],[76,-107],[81,-102],[79,-100],[73,-108],[76,-57]],"special_guardshot":[[62,-55],[48,-108],[78,-98],[72,-95],[62,-91],[62,-55]],"special_precision":[[62,-55],[69,-73],[72,-87],[77,-91],[72,-76],[62,-55]],"special_reloadshot":[[62,-55],[69,-88],[73,-89],[71,-90],[73,-81],[62,-55]],"special_scatterback":[[62,-55],[51,-87],[76,-94],[70,-89],[52,-73],[62,-55]],"ultimate_hyakuren_basic":[[70,-81],[70,-81],[72,-92],[75,-97],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[69,-89],[69,-89]],"ultimate_hyakuren_evolved":[[70,-81],[70,-81],[72,-92],[72,-72],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[62,-101],[71,-84],[69,-89]],"ultimate_hyakuren_master":[[70,-81],[70,-81],[72,-92],[72,-72],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[69,-104],[76,-94],[67,-107],[76,-94],[62,-101],[71,-84],[69,-89]]},"yumi":{"combo_finisher_1":[[65,-94],[47,-93],[55,-97],[46,-107]],"covered_step":[[39,-97],[39,-90],[37,-94],[39,-98],[37,-92],[39,-97]],"denial_shot":[[39,-97],[44,-78],[59,-92],[65,-77],[45,-87],[39,-97]],"moving_shot":[[39,-97],[51,-86],[60,-91],[58,-77],[43,-87],[39,-97]],"normal_1":[[54,-78],[57,-94],[52,-98],[50,-104]],"normal_2":[[53,-66],[60,-84],[61,-65],[54,-80]],"piercing_shot":[[39,-97],[40,-95],[54,-88],[56,-83],[42,-91],[39,-97]],"skill_bakuretsu_basic":[[58,-77],[64,-77],[74,-70],[64,-73],[55,-83],[47,-95]],"skill_bakuretsu_evolved":[[58,-77],[64,-77],[74,-70],[64,-73],[55,-83],[47,-95]],"skill_bakuretsu_master":[[58,-77],[64,-77],[74,-70],[64,-73],[55,-83],[47,-95]],"skill_sanrenya_basic":[[41,-107],[54,-75],[65,-90],[60,-91],[48,-97],[42,-90]],"skill_sanrenya_evolved":[[41,-107],[54,-75],[65,-90],[60,-91],[48,-97],[42,-90]],"skill_sanrenya_master":[[41,-107],[54,-75],[65,-90],[60,-91],[48,-97],[42,-90]],"skill_tenkyu_basic":[[58,-45],[96,-65],[62,-138],[58,-138],[60,-131],[50,-103]],"skill_tenkyu_evolved":[[58,-45],[96,-65],[62,-138],[58,-138],[60,-131],[50,-103]],"skill_tenkyu_master":[[58,-45],[96,-65],[62,-138],[58,-138],[60,-131],[50,-103]],"skill_tsuikon_basic":[[46,-95],[58,-83],[62,-88],[70,-91],[62,-75],[57,-83]],"skill_tsuikon_evolved":[[46,-95],[58,-83],[62,-88],[70,-91],[62,-75],[57,-83]],"skill_tsuikon_master":[[46,-95],[58,-83],[62,-88],[70,-91],[62,-75],[57,-83]],"special_backshot":[[39,-97],[45,-73],[52,-86],[57,-81],[51,-95],[39,-97]],"special_fan":[[39,-97],[50,-81],[57,-78],[55,-84],[42,-74],[39,-97]],"special_marked":[[39,-97],[47,-74],[53,-90],[54,-82],[47,-98],[39,-97]],"special_tracking":[[39,-97],[43,-76],[51,-94],[50,-82],[43,-84],[39,-97]],"ultimate_tenkyu_basic":[[47,-111],[55,-112],[67,-124],[50,-114],[66,-120],[67,-99],[61,-119],[59,-118],[50,-110]],"ultimate_tenkyu_evolved":[[47,-111],[55,-112],[67,-124],[50,-114],[63,-92],[64,-78],[41,-91],[59,-118],[50,-110]],"ultimate_tenkyu_master":[[47,-111],[55,-112],[67,-124],[50,-114],[63,-92],[64,-78],[41,-91],[59,-118],[50,-110]]}};
  W.muzzle = function () { const a = H.act, L = a && (MUZ[W.curId()] || {})[a.name]; if (!L) return null; const fr = G.heroFrame(), i = a.r.f.indexOf(fr); let p = i >= 0 ? L[i] : null;
    for (let d = 1; !p && d < L.length; d++) p = L[i - d] || L[i + d]; if (!p) return null;
    const u = W.unit(), sc = HH() * s0() / ((u && u.refH) || 130) * W.actK(a.name); return [H.x + H.face * p[0] * sc, H.y - (H.hop || 0) + p[1] * sc]; };
  const PK = { teppo: { projectile_bullet_a: 'lead', projectile_bullet_b: 'lead', skill_fire_ball_a: 'bomb' }, yumi: { projectile_arrow_a: 'arrow', projectile_arrow_b: 'barrow' } };
  function muzzleFx(big) { const m = W.muzzle(); if (!m) return; const h = HH() * s0();
    if (W.curId() === 'teppo') { VF('flash', { x: m[0], y: m[1], r: h * (big ? 0.36 : 0.2), face: H.face, life: 6 }); VF('smoke', { x: m[0], y: m[1], face: H.face, life: 42, n: big ? 6 : 3, h }); }
    else if (W.curId() === 'yumi') VF('twang', { x: m[0] - H.face * h * 0.06, y: m[1], h: h * 0.55, life: 8 }); }
  const aimFrom = p => { const m = W.muzzle(); if (m) { p.x = m[0]; p.h = Math.max(4, H.y - m[1]); } };
  const BF = G.BUFF, take = k => { const v = BF.get(k); if (v > 0) { BF.v[k]--; if (BF.v[k] <= 0) BF.t[k] = 0; } return v; };
  const nextShotMul = () => { const v = BF.get('nextShot'); if (v) BF.t.nextShot = 0; return 1 + v / 100; };
  /* 普攻（合約 projectile）→ 依招式分類的飛行物，從槍口／弓弦發出 */
  W.shoot = function (ev, a, mult, big) { const P = (EVP[W.curId()] || {})[a.name]; if (!P || !P.pk) return false;
    const N = P.pellets || 1, sp = (P.arc || 0) * Math.PI / 180, s = s0(), pr = take('pierceShots') > 0, mul = nextShotMul();
    for (let k = 0; k < N; k++) { const an = N > 1 ? -sp / 2 + sp * k / (N - 1) : 0, spd = P.pk === 'pellet' ? 10 : 11;
      const p = { x: H.x + H.face * 20 * s, y: H.y, h: HH() * 0.52 * s, vx: H.face * Math.cos(an) * spd, vy: Math.sin(an) * spd * 0.5, left: P.d * HH() * s, mult: mult * mul * (N > 1 ? 1.6 / N : 1), big,
        pierce: pr ? 9 : P.pierce || 1, hits: [], face: H.face, pk: P.pk, trail: P.trail, kb: P.kb ? P.kb * HH() * s / 5 : 0 };
      aimFrom(p); G.PROJ.push(p); }
    muzzleFx(big); return true; };
  /* 技能飛行物：散彈展開、最近目標、射程覆寫、分類外觀、槍口出手 */
  const pj0 = SKB.proj;
  SKB.proj = function (a, o) { const B = (a && a.B) || {}, wid = W.curId(), s = s0(), mul = nextShotMul();
    if (B.near) { const e = G.E.filter(e => alive(e) && (e.x - H.x) * H.face > 0 && Math.abs(e.x - H.x) < HH() * 6 * s).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x))[0]; if (e) o = Object.assign({}, o, { d: Math.max(HH() * s, Math.abs(e.x - H.x)) }); }
    if (B.pd) o = Object.assign({}, o, { d: HH() * B.pd * s });
    if (B.sway) o = Object.assign({}, o, { an: Math.sin(H.t * 0.12) * 0.35 });
    const one = (oo, an, pk) => { const n0 = G.PROJ.length; pj0.call(SKB, a, Object.assign({}, oo, { an, m: oo.m * mul })); const p = G.PROJ[n0]; if (!p) return; aimFrom(p);
      p.pk = pk || B.pk || (PK[wid] || {})[oo.img]; if (B.fast) { p.vx *= 2; p.vy *= 2; } if (B.trailP) p.trail = 1;
      if (pk === 'pellet') { p.left = Math.min(p.left, oo.d); const kb = (o.last && B.knockLast ? 1 : 0) || B.kbP || 0; if (kb) p.kb = kb * HH() * s / 5; if (B.stunP) p.stun = B.stunP; }
      else if (B.kbP) p.kb = B.kbP * HH() * s / 5;
      if (a.stance && B.knockC) p.kb = HH() * s / 5; if (B.dot && p.bomb) p.dotZ = B.dot; };
    if (B.pellets) { const N = o.last && B.lastPellets ? B.lastPellets : B.pellets, sp = o.last && B.lastSpread ? B.lastSpread : B.spreadP || 0.8;
      for (let k = 0; k < N; k++) one(Object.assign({}, o, { m: o.m * 1.6 / N }), (o.an || 0) - sp / 2 + sp * k / (N - 1), 'pellet'); }
    else one(o, o.an || 0);
    muzzleFx(o.last && (B.bigFlash || B.downLast)); };
  /* 自訂型別：火花斷進（地面火線）、換步藏弓（閃避＋下一箭強化） */
  let custom = function (a, s, lv, b) { const B = a.B = Object.assign({}, b, lv >= 3 ? b.m3 : {}, lv >= 5 ? b.m5 : {}); a.beh = b.t; a.ev = []; a.noMv = true; a.sched = [];
    const c = a.c, t0 = Math.max(2, c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.35)), hs = HH() * s0();
    if (b.t === 'fire') a.sched.push({ t: t0, f: () => { const x = H.x + H.face * hs * 3; muzzleFx(true); for (let k = 0; k < 14; k++) G.FX.push({ k: 'spark', x: H.x + H.face * hs * (0.5 + k * 0.18), y: H.y - hs * 0.3, vx: H.face * 2, vy: -1 - Math.random() * 2, t: 0, life: 26 });
      G.ZONES.push({ k: B.burn ? 'field' : 'slowz', x, y: H.y, r: hs * 0.9, t: 0, life: B.dur, m: B.burn || 0, a, fx: 'skill_fire_ground_a', slow: 30 }); } });   // 無灼燒時只緩速（不造成傷害）
    else { a.mv2 = { d: -hs * B.d, f0: 1, f1: 12 }; H.inv = Math.max(H.inv, B.inv); a.sched.push({ t: 2, f: () => { G.FX.push({ k: 'ghost', u: W.unit().key, fr: G.heroFrame(), x: H.x, y: H.y, face: H.face, s: s0() * W.actK(a.name), t: 0, life: 20 });
      BF.add('nextShot', 50, 300); if (B.nextCrit) BF.add('nextCrit', 100, 300); G.UI.toast('下一箭傷害 +50%' + (B.nextCrit ? '・必暴擊' : '')); } }); }
    return true; }
  /* 火線緩速、炮彈落點燃燒區 */
  const zs0 = SKB.step; SKB.step = function () { zs0.call(SKB); for (const z of G.ZONES) if (z.k === 'slowz' && z.t % 40 === 1) G.spawnFx(z.fx, 0, z.x, z.y - 14, 1, SC.depth(z.y) * 1.6);
    for (const z of G.ZONES) if (z.slow) for (const e of G.E) if (alive(e) && Math.hypot(e.x - z.x, (e.y - z.y) * 1.8) < z.r + 16) { e.db = e.db || {}; e.db.slow = Math.max(e.db.slow || 0, z.slow); e.db.slowT = Math.max(e.db.slowT || 0, 10); } };
  const ps0 = G.projStep; G.projStep = function () { const L = G.PROJ.slice(), nh = L.map(p => p.hits.length); ps0();
    L.forEach((p, i) => { const B = p.a && p.a.B; if (!B || !B.slowArrow || p.hits.length === nh[i]) return; const e = p.hits[p.hits.length - 1], sl = o => { o.db = o.db || {}; o.db.slow = Math.max(o.db.slow || 0, 50); o.db.slowT = Math.max(o.db.slowT || 0, B.slowT ? 180 : 120); };   // 壓弦拒進：緩速 2 秒（進化 3 秒）；極意：擊退撞到的敵人也緩速
      sl(e); if (B.slowChain) for (const o of G.E) if (o !== e && alive(o) && Math.hypot(o.x - e.x, o.y - e.y) < HH() * 1.2) sl(o); }); for (const p of L) if (p.done && p.dotZ && !p.dz) { p.dz = 1; G.ZONES.push({ k: 'field', x: p.x, y: p.y, r: HH() * s0(), t: 0, life: p.dotZ.t, m: p.dotZ.m, a: p.a, fx: p.dotZ.fx }); } };

  Object.assign(SKB.BEH.teppo, {
    skill_horoku: { t: 'bomb', n: 1, m: 2, r: 1.0, d: 6, img: 'skill_fire_ball_a', fx: 'skill_fire_rim_a', lob: 1, near: 1, m3: { n: 1, spread: 0.5 }, m5: { dot: { t: 180, m: 0.3, fx: 'skill_fire_ground_a' } } },
    skill_rensha: { t: 'shot', n: 3, m: 0.9, d: 8, img: 'projectile_bullet_a', seq: 9, m3: { n: 2 }, m5: { downLast: 1 } },
    skill_sandan: { t: 'shot', n: 3, m: 1, d: 4, img: 'projectile_bullet_a', seq: 14, pellets: 5, spreadP: 0.87, pd: 4, m3: { seq: 8 }, m5: { lastPellets: 9, lastSpread: 1.22, knockLast: 1 } },
    skill_sogeki: { t: 'shot', n: 1, m: 3.4, d: 12, img: 'projectile_bullet_b', charge: 36, ignoreDef: 30, fast: 1, aim: 1, bigFlash: 1, m3: { ignoreDef: 50 }, m5: { crit: 1, pierce: 1 } },
    special_guardshot: { t: 'stance', dur: 48, m: 1.5, shot: 1, fx: 'feedback_guard_b', m3: { qi: 10 }, m5: { m: 2, knockC: 1 } },
    special_precision: { t: 'buff', buff: { nextCrit: 50, t: 360 }, fx: 'skill_light_glyph_a', glow: 'gold', m3: { nextCrit: 80 }, m5: { critD: 50 } },
    special_reloadshot: { t: 'shot', n: 2, m: 0.8, d: 7, img: 'projectile_bullet_a', seq: 10, after: { aspd: 25, t: 180 }, m3: { fastAct: 0.7 }, m5: { pierceShots: 3 } },
    special_scatterback: { t: 'back', d: 1.5, m: 0.6, shoot: 1, pellets: 5, spreadP: 1.05, pd: 3, img: 'projectile_bullet_a', m3: { pellets: 7 }, m5: { inv: 1 } },
    ultimate_hyakuren: { t: 'barrage', n: 50, m: 0.35, d: 8, dur: 180, img: 'projectile_bullet_a', fx: 'hero_teppo_ultimate_fx', sway: 1, m3: { dur: 120, n: 33 }, m5: { finalBomb: 1 } },
    retreat_shot: { t: 'back', d: 1.0, m: 1.1, shoot: 1, img: 'projectile_bullet_a', pd: 7, m3: { cdr: 0.8 }, m5: { inv: 1 } },
    close_scatter: { t: 'shot', n: 1, m: 1.4, d: 2, img: 'projectile_bullet_a', pellets: 7, spreadP: 1.57, pd: 2, kbP: 1, m3: { pd: 2.6 }, m5: { stunP: 30 } },
    denial_fire: { t: 'fire', dur: 120, m3: { dur: 180 }, m5: { burn: 0.25 } },
    shoulder_guard: { t: 'stance', dur: 36, m: 1.2, fx: 'feedback_guard_b', blockCrit: 1, m3: { dur: 18 }, m5: { shot: 1 } } });
  Object.assign(SKB.BEH.yumi, {
    skill_bakuretsu: { t: 'bomb', n: 1, m: 1.8, r: 0.9, d: 9, img: 'projectile_arrow_a', pk: 'rarrow', fx: 'skill_fire_ball_a', m3: { r: 1.3 }, m5: { split: 1 } },
    skill_sanrenya: { t: 'shot', n: 3, m: 0.8, d: 9, img: 'projectile_arrow_a', seq: 7, m3: { n: 2 }, m5: { pierceLast: 1 } },
    skill_tenkyu: { t: 'rain', n: 8, r: 1.3, m: 0.6, dur: 120, far: 3, nearZ: 1, fx: 'skyarrow', m3: { dur: 60 }, m5: { followHero: 1 } },
    skill_tsuikon: { t: 'shot', n: 1, m: 1.6, d: 10, img: 'projectile_arrow_b', home: 1, m3: { n: 1 }, m5: { mark: 20 } },
    special_backshot: { t: 'back', d: 1.5, m: 1.0, shoot: 2, img: 'projectile_arrow_a', pd: 9, m3: { dist: 1.5 }, m5: { inv: 1 } },
    special_fan: { t: 'shot', n: 5, m: 0.7, d: 7, spread: 1.05, img: 'projectile_arrow_a', m3: { n: 2 }, m5: { kbP: 0.8 } },
    special_marked: { t: 'mark', mark: 15, dur: 300, d: 10, fx: 'skill_light_glyph_b', shootMark: 1, m3: { mark: 25 }, m5: { transfer: 1 } },
    special_tracking: { t: 'buff', buff: { home: 3, t: 600 }, fx: 'skill_light_glyph_a', glow: 'blue', m3: { homeN: 5 }, m5: { homeCrit: 1 } },
    ultimate_tenkyu: { t: 'rain', n: 24, r: 5, m: 0.8, dur: 240, fx: 'hero_yumi_ultimate_fx', fx2: 'skyarrow', glow: 'gold', m3: { n: 12 }, m5: { pillar: 1 } },
    moving_shot: { t: 'back', d: 0.01, m: 1.1, shoot: 1, img: 'projectile_arrow_a', pd: 9, sideStep: 1, m3: { cdr: 0.8 }, m5: { inv: 1 } },
    piercing_shot: { t: 'shot', n: 1, m: 1.6, d: 11, img: 'projectile_arrow_a', pierce: 1, defdown: 10, debuffT: 0.8, impact: 1, trailP: 1, m3: { defdown: 15 }, m5: { defdown: 20 } },
    denial_shot: { t: 'shot', n: 1, m: 1.0, d: 7, img: 'projectile_arrow_a', knock: 1.8, slowArrow: 1, m3: { slowT: 1 }, m5: { slowChain: 1 } },
    covered_step: { t: 'evade', d: 1.0, inv: 18, m3: { inv: 27 }, m5: { nextCrit: 1 } } });
  /* 遠程專屬的追加：瞄準線、增益光、裝填後增益、終幕炮彈、側移、冷卻縮短、標記箭、箭雨對準最近敵人 */
  const ex0 = extras; extras = function (a, s, lv, b) { ex0(a, s, lv, b); const B = a.B; if (!B) return; const hs = HH() * s0();
    if (B.aim) VF('aim', { life: B.charge || 30, len: hs * (B.d || 10) });
    if (B.glow) a.sched.push({ t: 2, f: () => VF('aura', { x: H.x, y: H.y, life: 60, col: B.glow === 'gold' ? '255,225,150' : '170,215,255' }) });
    if (B.after || B.pierceShots) a.sched.push({ t: a.T - 1, f: () => { if (B.after) BF.add('aspd', B.after.aspd, B.after.t); if (B.pierceShots) { BF.add('pierceShots', B.pierceShots, 600); G.UI.toast('之後 3 發普攻穿透'); } } });
    if (B.fastAct) { a.T = Math.round(a.T * B.fastAct); for (const x of a.sched) x.t = Math.min(a.T - 1, Math.round(x.t * B.fastAct)); }
    if (B.finalBomb) a.sched.push({ t: a.T - 2, f: () => { pj0.call(SKB, a, { img: 'skill_fire_ball_a', d: hs * 5, m: 3, pierce: 1, bomb: hs * 2, lob: 1, last: true }); const p = G.PROJ[G.PROJ.length - 1]; if (p) { aimFrom(p); p.pk = 'bomb'; } muzzleFx(true); } });
    if (B.sideStep) a.mv2 = { d: 0, dy: (Math.random() < 0.5 ? -1 : 1) * hs, f0: 1, f1: 12 };
    if (B.inv && (b.t === 'back' || B.sideStep)) a.invAll = true;
    if (B.cdr && a.chainK !== undefined) a.sched.push({ t: 1, f: () => { const k = 'k:' + a.chainK; if (H.cd[k]) H.cd[k] = Math.round(H.cd[k] * B.cdr); } });
    if (B.shootMark) a.sched.push({ t: Math.max(2, Math.round(a.T * 0.4)), f: () => SKB.proj(a, { img: 'projectile_arrow_a', d: hs * 10, m: 1, pierce: 1, last: true }) });
    if (B.impact) a.sched.push({ t: Math.max(2, Math.round(a.T * 0.4)), f: () => { const m = W.muzzle() || [H.x, H.y - hs * 0.55]; VF('slashline', { x0: m[0], y0: m[1], x1: m[0] + H.face * hs * 4, y1: m[1], w: 3, life: 12, col: '255,255,255' }); } });
    if (B.nearZ) a.sched.push({ t: 1, f: () => { const z = G.ZONES.find(z => z.a === a), e = G.E.filter(e => alive(e) && Math.abs(e.x - H.x) < hs * 6).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x))[0]; if (z && e && !z.follow) { z.x = e.x; z.y = e.y; } } }); };
  const ct1 = SKB.counter; SKB.counter = function (e) { const a = H.act, B = a && a.B, ok = ct1.call(SKB, e); if (ok && B && B.blockCrit) { BF.add('nextCrit', 100, 300); G.UI.toast('下一發必暴擊'); } return ok; };

  /* 向量飛行物與特效（大小以身高 H 為單位） */
  Object.assign(G.FXV, {
    proj(p, c) { const s = SC.depth(p.y), h = HH() * s, y = p.y - p.h - (p.arc || 0), dir = Math.sign(p.vx) || p.face, an = Math.atan2(p.vy * 0.5, Math.abs(p.vx)) * dir; c.save(); c.translate(p.x, y);
      if (p.pk === 'lead' || p.pk === 'pellet') { const L = Math.min(h * (p.pk === 'lead' ? 1.1 : 0.5), Math.abs(p.vx) * 5), g = c.createLinearGradient(-dir * L, 0, 0, 0); g.addColorStop(0, 'rgba(255,220,140,0)'); g.addColorStop(1, 'rgba(255,236,180,.9)');
        c.rotate(an * dir); c.strokeStyle = g; c.lineWidth = Math.max(1, h * 0.03); c.beginPath(); c.moveTo(-dir * L, 0); c.lineTo(0, 0); c.stroke(); c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(0, 0, h * (p.pk === 'lead' ? 0.04 : 0.03), 0, 6.283); c.fill(); }
      else if (p.pk === 'bomb') { c.fillStyle = '#1d1a18'; c.beginPath(); c.arc(0, 0, h * 0.125, 0, 6.283); c.fill(); c.strokeStyle = '#6b5a48'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = 'rgba(255,' + (150 + Math.random() * 100 | 0) + ',60,.95)'; c.beginPath(); c.arc(h * 0.08, -h * 0.13, h * 0.035 + Math.random() * 1.5, 0, 6.283); c.fill(); }
      else { const L = h * 0.45, w = L / 8; c.rotate(Math.atan2(p.vy * 0.5, p.vx)); const col = p.pk === 'rarrow' ? '255,120,90' : p.pk === 'barrow' ? '140,200,255' : '255,250,235';
        if (p.pk === 'barrow' || p.trail) { const g = c.createLinearGradient(-L * 2.2, 0, 0, 0); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',.55)'); c.strokeStyle = g; c.lineWidth = w * 1.4; c.beginPath(); c.moveTo(-L * 2.2, 0); c.lineTo(0, 0); c.stroke(); }
        c.strokeStyle = '#6b4a2e'; c.lineWidth = Math.max(1, w * 0.45); c.beginPath(); c.moveTo(-L, 0); c.lineTo(-w, 0); c.stroke();   // 箭桿
        c.fillStyle = p.pk === 'rarrow' ? '#ff6a4a' : '#dfe6ee'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-w * 2.2, -w * 0.7); c.lineTo(-w * 2.2, w * 0.7); c.fill();   // 箭頭
        c.fillStyle = '#f2efe6'; c.beginPath(); c.moveTo(-L, 0); c.lineTo(-L + w * 2, -w * 0.9); c.lineTo(-L + w * 2.4, 0); c.lineTo(-L + w * 2, w * 0.9); c.fill(); }   // 箭羽
      c.restore(); },
    flash(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; const r = f.r * (0.6 + 0.4 * a), g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); g.addColorStop(0, 'rgba(255,250,220,' + a + ')'); g.addColorStop(0.4, 'rgba(255,190,90,' + a * 0.8 + ')'); g.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(f.x + f.face * r * 0.5, f.y, r * 1.3, r * 0.6, 0, 0, 6.283); c.fill(); c.restore(); },
    smoke(f, a, c) { for (let i = 0; i < f.n; i++) { const k = f.t / f.life, x = f.x + f.face * (f.h * 0.1 + i * f.h * 0.06) * (1 + k * 2), y = f.y - k * f.h * 0.35 - i * 2, r = f.h * (0.06 + k * 0.12);
        c.fillStyle = 'rgba(200,200,195,' + a * 0.35 + ')'; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); } },
    twang(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(230,245,255,' + a * 0.8 + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(f.x, f.y - f.h / 2); c.quadraticCurveTo(f.x + Math.sin(f.t * 2) * 4, f.y, f.x, f.y + f.h / 2); c.stroke(); c.restore(); },
    skyarrow(f, a, c) { const k = Math.min(1, f.t / 5), y0 = f.y - f.h * 2.2, y1 = y0 + (f.y - y0) * k; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(f.x, y1 - f.h * 0.5, f.x, y1); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(1, 'rgba(255,248,210,' + a + ')');
      c.strokeStyle = g; c.lineWidth = Math.max(1.6, f.h * 0.04); c.beginPath(); c.moveTo(f.x, y1 - f.h * 0.7); c.lineTo(f.x, y1); c.stroke(); c.fillStyle = 'rgba(255,252,230,' + a + ')'; c.beginPath(); c.arc(f.x, y1, f.h * 0.03, 0, 6.283); c.fill(); if (k >= 1) { c.fillStyle = 'rgba(255,240,190,' + a * 0.5 + ')'; c.beginPath(); c.ellipse(f.x, f.y, f.h * 0.18 * a, f.h * 0.05, 0, 0, 6.283); c.fill(); } c.restore(); },
    aim(f, a, c) { const m = W.muzzle(); if (!m || !H.act) return; c.save(); c.strokeStyle = 'rgba(255,60,60,' + (0.35 + 0.4 * Math.abs(Math.sin(f.t * 0.4))) + ')'; c.lineWidth = 1.2; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0] + H.face * f.len, m[1]); c.stroke(); c.restore(); } });

  /* ======== 8. 長槍／斧 ======== */
  Object.assign(ACTK, {"yari":{"backstep":1.06,"combo_finisher_1":1.14,"combo_finisher_2":1.07,"combo_finisher_3":1.15,"double_thrust":1.24,"fixed_line":1.12,"focused_point":1.11,"ground_sweep":1.16,"intercept_thrust":1.06,"long_pierce":1.17,"pulling_retreat":1.15,"rising_point":1.13,"shaft_break":1.11,"shaft_gate":1.07,"side_gap":1.08,"skill_sorin_basic":1.1,"skill_sorin_evolved":1.1,"skill_sorin_master":1.1,"special_backpierce":1.16,"special_deny":1.17,"special_lane":1.16,"special_return":1.21,"tip_probe":1.18,"ultimate_ryuga_basic":1.11,"ultimate_ryuga_evolved":1.1,"ultimate_ryuga_master":1.11,"run":1.12,"jump_dash":1.09},"ono":{"walk":1.09,"backstep":0.93,"combo_finisher_1":0.87,"combo_finisher_2":0.83,"combo_finisher_4":0.78,"counter":0.92,"dodge":0.92,"guard_break":0.92,"hook_probe":1.07,"hurt":0.91,"skill_kabutowari_basic":0.86,"skill_kabutowari_evolved":0.86,"skill_kabutowari_master":0.86,"skill_senpuono_basic":0.88,"skill_senpuono_evolved":0.88,"skill_senpuono_master":0.88,"special_reverse":1.07,"ultimate_yamakuzushi_basic":0.8,"ultimate_yamakuzushi_evolved":0.91,"ultimate_yamakuzushi_master":0.91,"run":1.07}});
  Object.assign(BLADE, {"yari":{"combo_finisher_1":[[90,-52],[91,-33],[101,-62],[91,-51]],"combo_finisher_2":[[102,-31],[105,-106],[98,-135],[106,-49]],"ground_sweep":[[69,-63],[25,-36],[31,-34],[31,-34],[25,-36],[69,-63]],"long_pierce":[[67,-62],[78,-62],[79,-51],[91,-62],[77,-52],[67,-62]],"normal_1":[[94,-69],[96,-72],[96,-73],[96,-71]],"normal_2":[[98,-30],[93,-102],[108,-123],[103,-76]],"shaft_break":[[71,-64],[64,-67],[63,-94],[76,-113],[89,-65],[71,-64]],"shaft_gate":[[73,-67],[58,-86],[58,-113],[66,-110],[62,-83],[73,-67]],"skill_ryusei_basic":[[92,-80],[93,-72],[111,-72],[87,-76],[104,-75],[90,-88]],"skill_ryusei_evolved":[[92,-80],[93,-72],[111,-72],[88,-76],[104,-75],[90,-88]],"skill_ryusei_master":[[92,-80],[93,-72],[111,-72],[87,-76],[104,-75],[90,-88]],"skill_senso_basic":[[63,-152],[86,-142],[105,-73],[98,-83],[97,-81],[101,-79]],"skill_senso_evolved":[[63,-152],[86,-142],[105,-73],[98,-83],[97,-81],[101,-79]],"skill_senso_master":[[63,-152],[86,-142],[104,-73],[98,-83],[97,-81],[101,-79]],"skill_shoryu_basic":[[-42,-60],[100,-108],[99,-142],[98,-128],[41,-39],[-47,-64]],"skill_shoryu_evolved":[[11,-115],[100,-108],[99,-142],[98,-128],[41,-39],[-47,-64]],"skill_shoryu_master":[[-42,-60],[100,-108],[99,-142],[98,-128],[41,-39],[-47,-64]],"skill_sorin_basic":[[73,-71],[89,-35],[100,-67],[102,-63],[84,-46],[83,-29]],"skill_sorin_evolved":[[73,-71],[89,-35],[100,-67],[102,-63],[84,-46],[83,-29]],"skill_sorin_master":[[73,-71],[89,-35],[100,-67],[102,-63],[84,-46],[83,-29]],"special_backpierce":[[72,-64],[86,-79],[98,-85],[102,-83],[82,-75],[71,-64]],"special_deny":[[67,-62],[68,-108],[26,-36],[80,-40],[75,-48],[67,-62]],"special_lane":[[67,-62],[72,-39],[71,-42],[85,-47],[80,-48],[67,-62]],"special_return":[[64,-59],[29,-39],[9,-31],[82,-64],[68,-53],[64,-59]],"ultimate_ryuga_basic":[[93,-59],[92,-53],[94,-49],[92,-54],[96,-58],[93,-58],[87,-56],[93,-55],[93,-54]],"ultimate_ryuga_evolved":[[93,-59],[92,-53],[94,-49],[92,-54],[96,-58],[93,-58],[-104,-59],[97,-63],[94,-55],[93,-53]],"ultimate_ryuga_master":[[93,-59],[92,-53],[94,-49],[92,-54],[96,-58],[93,-58],[-104,-59],[97,-63],[96,-44],[94,-55],[93,-53]]},"ono":{"axe_brace":[[66,-43],[65,-93],[68,-80],[61,-49],[69,-48],[66,-43]],"combo_finisher_1":[[65,-56],[73,-142],[-17,-157],[69,-36]],"heavy_sweep":[[67,-43],[58,-39],[71,-47],[84,-71],[56,-127],[67,-43]],"normal_1":[[-57,-110],null,null,[62,-57]],"normal_2":[null,[76,-121],[65,-131],[62,-72]],"skill_daichiwari_basic":[null,[45,-149],[45,-35],[59,-29],[68,-31],[69,-35]],"skill_daichiwari_evolved":[null,[45,-149],[44,-36],[59,-29],[68,-31],[69,-35]],"skill_daichiwari_master":[null,[45,-149],[44,-36],[59,-29],[68,-31],[69,-35]],"skill_kabutowari_basic":[[79,-35],[71,-73],[47,-166],[70,-49],[79,-33],[84,-95]],"skill_kabutowari_evolved":[[79,-35],[71,-73],[47,-166],[70,-49],[79,-33],[84,-95]],"skill_kabutowari_master":[[79,-35],[71,-73],[47,-166],[70,-49],[79,-33],[84,-95]],"skill_onosenpu_basic":[[64,-39],[69,-37],[80,-88],[72,-79],[88,-66],[77,-31]],"skill_onosenpu_evolved":[[64,-39],[69,-37],[80,-88],[72,-79],[88,-66],[79,-31]],"skill_onosenpu_master":[[64,-39],[69,-37],[80,-88],[72,-79],[88,-66],[77,-31]],"skill_senpuono_basic":[[-69,-120],[106,-90],null,null,[79,-78],[77,-46]],"skill_senpuono_evolved":[[-69,-120],[105,-91],null,null,[79,-78],[77,-46]],"skill_senpuono_master":[[-69,-120],[106,-90],null,null,[78,-77],[77,-46]],"special_drop":[[64,-40],[60,-120],[-46,-138],null,null,[64,-41]],"special_pursuit":[[66,-43],null,null,null,null,[66,-43]],"special_reverse":[[61,-39],null,[-73,-61],[86,-81],[61,-43],[61,-39]],"special_wedge":[[64,-40],null,[-54,-108],null,null,[64,-41]],"stepping_cleave":[[65,-41],null,[-40,-147],null,null,[65,-41]],"ultimate_yamakuzushi_basic":[[69,-47],[72,-90],[64,-105],[70,-40],[65,-32],[69,-48],[73,-86],[64,-106],[70,-40],[75,-37],[71,-49],[73,-87],[64,-105],[70,-40],[-55,-31],[94,-43]],"ultimate_yamakuzushi_evolved":[[61,-42],[64,-79],[57,-93],[61,-35],[56,-28],[62,-42],[64,-79],[57,-93],[61,-35],[68,-33],[62,-42],[64,-79],[57,-93],[61,-35],[68,-33],[62,-42],[64,-79],[44,-157],[61,-35],[68,-33],[62,-42],[64,-79],[44,-157],[61,-35],[75,-31],[68,-42],[83,-37]],"ultimate_yamakuzushi_master":[[61,-42],[64,-79],[57,-93],[61,-35],[56,-28],[62,-42],[64,-79],[57,-93],[61,-35],[69,-33],[62,-42],[64,-79],[57,-93],[61,-35],[68,-33],[62,-42],[64,-79],[44,-157],[61,-35],[69,-33],[62,-42],[64,-79],[47,-155],[61,-35],[75,-31],[68,-42],[84,-38]],"wedge_break":[[66,-41],[70,-111],null,null,[67,-37],[65,-41]]}});
  Object.assign(KEEP_MV, { yari: [['long_pierce', '穿陣長突', 'attack', 1, 30], ['ground_sweep', '掃地封步', 'attack', 3, 40], ['shaft_break', '鐵桿破守', 'attack', 6, 36], ['shaft_gate', '桿架橫門', 'guard', 9, 30]],
    ono: [['stepping_cleave', '踏劈開門', 'attack', 1, 30], ['heavy_sweep', '橫岳重掃', 'attack', 3, 48], ['wedge_break', '楔刃破甲', 'attack', 6, 36], ['axe_brace', '架斧候隙', 'guard', 9, 30]] });
  Object.assign(MAPMV, { yari: { double_thrust: 'long_pierce', fixed_line: 'shaft_gate', focused_point: 'shaft_break', intercept_thrust: 'shaft_gate', pulling_retreat: 'long_pierce', rising_point: 'shaft_break', side_gap: 'long_pierce', tip_probe: 'long_pierce' },
    ono: { falling_ground: 'heavy_sweep', hook_probe: 'wedge_break', lifting_weight: 'heavy_sweep', low_pivot: 'heavy_sweep', peeling_drag: 'stepping_cleave', pivot_face: 'axe_brace', retreat_axe: 'axe_brace', shoulder_advance: 'stepping_cleave' } });
  for (const id of ['yari', 'ono']) { const w = W.BY[id]; w.mv = KEEP_MV[id].map(([i, n, k, u, cd]) => ({ id: i, n, k, u, cd })); w.MV = {}; for (const m of w.mv) w.MV[m.id] = m; }
  Object.assign(EVP, { yari: { normal_1: { shape: 'line', d: 1.8, tfx: 1 }, normal_2: { shape: 'line', d: 1.8, tfx: 1 }, combo_finisher_1: { shape: 'line', d: 1.8, tfx: 1 }, combo_finisher_2: { shape: 'line', d: 2.2, kb: 1, tfx: 2 } },
    ono: { normal_1: { d: 1.2, arc: 100, bleed: 1 }, normal_2: { d: 1.2, arc: 100, bleed: 1 }, combo_finisher_1: { shape: 'circle', d: 0.9, cx: 0.8, crack: 1 } } });
  const pa0 = W.patchAct; W.patchAct = function (name, r) { pa0(name, r); const P = (EVP[W.curId()] || {})[name]; if (!P || P.pk || !r.c || !r.c.ev || !P.shape) return; r.c = Object.assign({}, r.c, { ev: r.c.ev.map(e => Object.assign({}, e, { shape: P.shape }, P.cx ? { cx: P.cx } : {})) }); };
  /* 普攻追加：槍尖刺光（從槍尖往前）、下劈裂口 */
  W.onFire = function (ev, a, bp) { const P = (EVP[W.curId()] || {})[a.name]; if (!P) return; const hs = HH() * s0();
    if (P.tfx) { const p = bp || [H.x + H.face * hs * 0.8, H.y - hs * 0.5]; VF('slashline', { x0: p[0] - H.face * hs * 0.2, y0: p[1], x1: p[0] + H.face * hs * (P.tfx > 1 ? 1.0 : 0.6), y1: p[1], w: P.tfx > 1 ? 5 : 3, life: 10, col: '210,235,255' }); }
    if (P.crack) VF('crack', { x: H.x + H.face * hs * P.cx, y: H.y, r: hs * P.d, life: 30 }); };
  /* 命中記錄（同一招打到誰）＋流血：斧普攻、帶 bleed 的招式；流血＝每 0.5 秒小傷害＋紅色滴落 */
  const dmg0 = G.damageOni; G.damageOni = function (e, ...r) { const a = H.act; if (a && e && !G._bleedTick) { (a.hs = a.hs || new Set()).add(e); const P = (EVP[W.curId()] || {})[a.name];
      if ((P && P.bleed) || (a.B && a.B.bleed) || a.bleedNext) e.bleed = Math.max(e.bleed || 0, 180); }
    return dmg0.call(this, e, ...r); };
  const zs1 = SKB.step; SKB.step = function () { zs1.call(SKB);
    for (const e of G.E) if (e.bleed > 0 && alive(e)) { e.bleed--; if (e.bleed % 30 === 0) { G._bleedTick = 1; dmg0(e, 0.12, false); G._bleedTick = 0; }
      if (e.bleed % 8 === 0) VF('drip', { x: e.x + (Math.random() - 0.5) * 16, y: e.y - HH() * 0.6 * SC.depth(e.y) * (e.ratio || 1), vy: 0, g: e.y, life: 26 }); }
    for (const z of G.ZONES) if (z.k === 'ebomb') { if (alive(z.e)) { z.x = z.e.x; z.y = z.e.y; } if (z.t % 20 === 1) VF('ring', { x: z.x, y: z.y, r: HH() * 0.5 * s0(), life: 14 });
      if (z.t === z.life - 1) { G.spawnFx('skill_light_pillar_a', 0, z.x, z.y - 20, 1, SC.depth(z.y) * 2.2); SC.shake = 6; if (alive(z.e)) SKB.hitE(z.e, z.a, z.m, { last: true, big: true }); } } };
  /* 斧旋風：進化後旋轉中可移動 */
  const tk0 = SKB.tick; SKB.tick = function (a, mx, my) { tk0.call(SKB, a, mx, my); if (a.B && a.B.mobile) { const m = Math.hypot(mx, my); if (m > 0.2) G.tryMove(H, mx / m * 1.4, my / m * 1.0); } };
  /* 斧刃錨點：斧頭的刀光也跟著斧頭 */
  const BF2 = /^fx_tier_(yari|ono)_/; const sp1 = G.spawnFx;
  G.spawnFx = function (name, tier, x, y, face, s) { if (name === 'quakeseg') { const hs = HH() * s0(); VF('crack', { x, y: y + 14, r: hs * 0.45, life: 26 }); G.FX.push({ k: 'dust', x, y: y + 14, t: 0, life: 16 }); for (let k = 0; k < 3; k++) G.FX.push({ k: 'spark', x, y: y + 8, vx: (Math.random() - .5) * 3, vy: -1 - Math.random() * 3, t: 0, life: 16 }); SC.shake = Math.max(SC.shake || 0, 4); return null; }
    if (name === 'spike') return VF('spike', { x, y: y + 14, h: HH() * s0(), life: 20 }) && null;
    const bp = H.act && BF2.test(name || '') && Math.abs(x - H.x) < HH() * 2 * s0() ? W.bladePt() : null; const f = sp1(name, tier, bp ? bp[0] : x, bp ? bp[1] : y, face, s); if (f && bp) { f.act = H.act; f.fol = 1; } return f; };
  PK.ono = { hero_ono_projectile_flight: 'axe' };
  /* 山崩：三次巨劈，落點逐次前移、半徑遞增；極意最後一劈全畫面震地 */
  const cu0 = custom; custom = function (a, s, lv, b) { if (b.t !== 'quake3') return cu0(a, s, lv, b);
    const B = a.B = Object.assign({}, b, lv >= 3 ? b.m3 : {}, lv >= 5 ? b.m5 : {}); a.beh = b.t; a.ev = []; a.noMv = true; a.sched = []; const c = a.c, hs = HH() * s0();
    const t0 = Math.max(4, c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.35)); a.T = Math.max(a.T, t0 + 34); a.invAll = true;
    for (let i = 0; i < 3; i++) a.sched.push({ t: t0 + i * 14, f: () => { const x = H.x + H.face * hs * (1.5 + i), r = hs * (B.grow ? 1.2 + 0.4 * i : 1.2), last = i === 2;
      G.spawnFx(b.fx, 0, x, H.y - hs * 0.4, H.face, s0() * 2.2 * r / (hs * 1.2)); VF('crack', { x, y: H.y, r, life: 34 }); SC.shake = last && B.screen ? 14 : 8; G.hitstop = 4;
      for (const e of G.E) if (alive(e) && (last && B.screen ? Math.abs(e.x - H.x) < hs * 8 : Math.hypot(e.x - x, (e.y - H.y) * 1.8) < r + 16)) SKB.hitE(e, a, B.m, { last, big: true }); } });
    return true; };
  const sk1 = SKB.start; SKB.start = function (a, s, lv) { const b = SKB.get(W.curId(), s.id); if (b && b.t === 'quake3') return custom(a, s, lv, b); return sk1.call(SKB, a, s, lv); };
  /* 長槍／斧專屬追加 */
  const ex1 = extras; extras = function (a, s, lv, b) { ex1(a, s, lv, b); const B = a.B; if (!B) return; const hs = HH() * s0(), lastT = a.sched.length ? a.sched[a.sched.length - 1].t : 0;
    const wrapLast = g => { for (const x of a.sched) if (x.t === lastT) { const f = x.f; x.f = () => { f(); g(); }; break; } };
    if (B.lastLong) wrapLast(() => { VF('slashline', { x0: H.x, y0: chestY(), x1: H.x + H.face * hs * B.lastLong, y1: chestY(), w: 5, life: 14, col: '220,240,255' }); for (const e of G.E) if (alive(e) && inFront(e, hs * B.lastLong, hs * 0.35)) SKB.hitE(e, a, B.m * 1.5, { last: true, big: true }); });
    if (B.followUp) a.sched.push({ t: lastT + 14, f: () => { VF('slashline', { x0: H.x + H.face * hs * 0.2, y0: H.y - hs * 1.2, x1: H.x + H.face * hs * 1.2, y1: H.y - hs * 1.6, w: 4, life: 12, col: '220,240,255' }); for (const e of a.hs || []) if (alive(e)) SKB.hitE(e, a, B.m * 0.8, { last: true, big: true }); } });
    if (B.dragonUp) wrapLast(() => { VF('dragon', { x0: H.x + H.face * hs * 0.6, y0: H.y, x1: H.x + H.face * hs * 0.6, y1: H.y - hs * 3, w: hs * 0.5, life: 30 }); for (const e of G.E) if (alive(e) && inFront(e, hs * 1.3, hs * 0.6)) SKB.hitE(e, a, B.m * 0.8, { last: true, big: true }); });
    if (B.dragon) { const x0 = H.x, y0 = chestY(); a.sched.push({ t: (a.mv2 ? a.mv2.f1 : 12) + 1, f: () => VF('dragon', { x0, y0, x1: H.x, y1: chestY(), w: hs, life: 30 }) }); }
    if (B.markLater) a.sched.push({ t: a.T - 1, f: () => { for (const e of a.hs || []) if (alive(e)) G.ZONES.push({ k: 'ebomb', e, x: e.x, y: e.y, t: 0, life: 180, m: B.m, a }); } });
    if (B.qiEnd) a.sched.push({ t: a.T - 1, f: () => { const d = G.RPG.d(); d.qi = Math.min(100, d.qi + B.qiEnd); G.UI.toast('氣 +' + B.qiEnd); } });
    if (B.shards) wrap2(a, () => { for (const e of a.hs || []) for (let k = 0; k < 6; k++) G.FX.push({ k: 'spark', x: e.x, y: e.y - hs * 0.5, vx: H.face * (0.5 + Math.random() * 2.5), vy: -1 - Math.random() * 2.5, t: 0, life: 20 }); });
    if (B.crack) a.sched.push({ t: (a.mv2 ? a.mv2.f1 : lastT) + 1, f: () => VF('crack', { x: H.x, y: H.y, r: hs * (B.r || 1), life: 34 }) });
    if (B.armorAct) BF.add('armor', 1, a.T);
    if (B.deny) for (let t = 4; t < (B.dur || 120); t += 6) a.sched.push({ t, f: () => { const bp = W.bladePt(); if (bp && t % 24 === 4) VF('glint', { x: bp[0], y: bp[1], life: 14 });   // 架勢拒進：前方 1.5H 內的敵人被刺停
      for (const e of G.E) if (alive(e) && inFront(e, hs * 1.5, hs * 0.5) && !(e.dnT > H.t)) { e.dnT = H.t + 30; e.kb = H.face * 6; e.stun = Math.max(e.stun || 0, 24); if (B.denyHit) SKB.hitE(e, a, B.denyHit, { last: true }); } } }); };
  const wrap2 = (a, g) => { for (const x of a.sched) { const f = x.f; x.f = () => { f(); g(); }; } };
  const ct2 = SKB.counter; SKB.counter = function (e) { const a = H.act, B = a && a.B, ok = ct2.call(SKB, e); if (ok && B && B.bleedC) { e.bleed = 360; for (const o of a.hs || []) o.bleed = 360; } return ok; };
  Object.assign(SKB.BEH.yari, {
    skill_ryusei: { t: 'leap', d: 2.5, r: 1.0, m: 2, fx: 'skill_light_beam_a', crack: 1, m3: { r: 1.3 }, m5: { dot: { t: 180, m: 0.3, fx: 'skill_light_glyph_a' } } },
    skill_senso: { t: 'multi', n: 8, m: 0.35, r: 1.43, line: 1, thrust: 1, fx: 'fx_tier_yari_basic', m3: { n: 4 }, m5: { lastLong: 4 } },
    skill_shoryu: { t: 'multi', n: 1, m: 1.8, r: 1.3, up: 1, stun: 50, fx: 'fx_tier_yari_basic', m3: { followUp: 1 }, m5: { followUp: 1, dragonUp: 1 } },
    skill_sorin: { t: 'line', d: 4, m: 1.2, fx: 'spike', m3: { rows: 2 }, m5: { dot: { t: 120, m: 0.3, fx: 'spike' } } },
    special_backpierce: { t: 'turn', m: 1.6, r: 1.29, line: 1, thrust: 1, fx: 'fx_tier_yari_basic', m3: { m: 1.3 }, m5: { crit: 1 } },
    special_deny: { t: 'stance', dur: 120, m: 1.5, fx: 'feedback_guard_b', deny: 1, m3: { dur: 60 }, m5: { denyHit: 1.5 } },
    special_lane: { t: 'dash', d: 4, m: 1.2, fx: 'fx_tier_yari_basic', trail: 1, m3: { dist: 1.5 }, m5: { slow: 1 } },
    special_return: { t: 'nova', r: 1.4, m: 1.2, fx: 'fx_tier_yari_basic', ringFx: 1, m3: { r: 1.3 }, m5: { qiEnd: 10 } },
    ultimate_ryuga: { t: 'charge', d: 10, m: 2.4, fx: 'hero_yari_ultimate_fx', dragon: 1, inv: 1, m3: { back: 1 }, m5: { markLater: 1 } },
    long_pierce: { t: 'dash', d: 2, m: 1.3, fx: 'fx_tier_yari_basic', trail: 1, m3: { dist: 1.3 }, m5: { inv: 1 } },
    ground_sweep: { t: 'nova', r: 1.3, m: 1.1, fx: 'fx_tier_yari_basic', ringFx: 1, m3: { r: 1.3 }, m5: { slow: 1 } },
    shaft_break: { t: 'multi', n: 1, m: 1.3, r: 1.14, line: 1, thrust: 1, defdown: 15, debuffT: 1, shards: 1, fx: 'fx_tier_yari_basic', m3: { defdown: 25 }, m5: { defdown: 30 } },
    shaft_gate: { t: 'stance', dur: 36, m: 1.4, fx: 'feedback_guard_b', m3: { dur: 18 }, m5: { cr: 2 } } });
  Object.assign(SKB.BEH.ono, {
    skill_daichiwari: { t: 'leap', d: 2, r: 1.3, m: 2.2, fx: 'weapon_blunt_b', crack: 1, m3: { r: 1.3 }, m5: { dot: { t: 180, m: 0.3, fx: 'skill_fire_ground_a' } } },
    skill_kabutowari: { t: 'multi', n: 1, m: 2.2, r: 1.3, defdown: 25, debuffT: 1.2, shards: 1, fx: 'fx_tier_ono_basic', m3: { defdown: 35 }, m5: { critBroken: 1 } },
    skill_onosenpu: { t: 'frenzy', n: 8, dur: 120, r: 1.3, m: 0.45, ringFx: 1, fx: 'fx_tier_ono_basic', m3: { mobile: 1 }, m5: { gather: 1 } },
    skill_senpuono: { t: 'throw', n: 1, d: 5, m: 1.3, pierce: 1, spread: 0.3, fx: 'hero_ono_projectile_flight', m3: { n: 1 }, m5: { ret: 1 } },
    special_drop: { t: 'leap', d: 1, r: 1.0, m: 1.8, fx: 'weapon_blunt_a', crack: 1, m3: { r: 1.3 }, m5: { stun: 50 } },
    special_pursuit: { t: 'dash', d: 3, m: 1.4, fx: 'fx_tier_ono_basic', trail: 1, m3: { dist: 1.5 }, m5: { dot: { t: 120, m: 0.25, fx: 'weapon_claw_b' }, bleed: 1 } },
    special_reverse: { t: 'multi', n: 1, m: 1.6, r: 1.2, up: 1, stun: 40, fx: 'fx_tier_ono_basic', m3: { stun: 60 }, m5: { vuln: 30 } },
    special_wedge: { t: 'trap', d: 1.2, m: 1, delay: 10, root: 60, fx: 'skill_dark_core_b', m3: { root: 90 }, m5: { burst: 1 } },
    ultimate_yamakuzushi: { t: 'quake3', m: 2, r: 1.2, fx: 'hero_ono_ultimate_fx', m3: { grow: 1 }, m5: { grow: 1, screen: 1 } },
    stepping_cleave: { t: 'dash', d: 1.5, m: 1.4, fx: 'fx_tier_ono_basic', trail: 1, m3: { dist: 1.3 }, m5: { armorAct: 1 } },
    heavy_sweep: { t: 'sweep', r: 1.23, m: 1.3, fx: 'fx_tier_ono_basic', m3: { r: 1.3 }, m5: { bleed: 1 } },
    wedge_break: { t: 'multi', n: 1, m: 1.3, r: 1.2, defdown: 15, debuffT: 0.85, shards: 1, fx: 'fx_tier_ono_basic', m3: { defdown: 25 }, m5: { defdown: 30 } },
    axe_brace: { t: 'stance', dur: 36, m: 1.6, cr: 1.3, spark: 1, fx: 'feedback_guard_a', m3: { dur: 18 }, m5: { bleedC: 1 } } });
  Object.assign(G.FXV, {
    crack(f, a, c) { c.save(); c.strokeStyle = 'rgba(60,40,25,' + a * 0.8 + ')'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const an = i * 0.9 + f.x * 0.01; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(an) * f.r * 0.9, f.y + Math.sin(an) * f.r * 0.35); c.stroke(); }
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,190,110,' + a * 0.6 + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(f.x, f.y, f.r * (1.2 - a * 0.2), f.r * 0.4, 0, 0, 6.283); c.stroke(); c.restore(); },
    drip(f, a, c) { f.vy += 0.25; f.y = Math.min(f.g, f.y + f.vy); c.fillStyle = 'rgba(200,20,30,' + Math.min(1, a * 1.6) + ')'; c.beginPath(); c.ellipse(f.x, f.y, 1.8, f.y >= f.g ? 1.2 : 3, 0, 0, 6.283); c.fill(); },
    spike(f, a, c) { const k = Math.min(1, f.t / 4), top = f.y - f.h * 0.75 * k; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(f.x, f.y, f.x, top); g.addColorStop(0, 'rgba(160,210,255,0)'); g.addColorStop(1, 'rgba(235,248,255,' + a + ')');
      c.fillStyle = g; c.beginPath(); c.moveTo(f.x - f.h * 0.05, f.y); c.lineTo(f.x, top); c.lineTo(f.x + f.h * 0.05, f.y); c.fill(); c.restore(); },
    dragon(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; const L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0) || 1, nx = -(f.y1 - f.y0) / L, ny = (f.x1 - f.x0) / L;
      for (let k = 0; k < 3; k++) { c.strokeStyle = k === 0 ? 'rgba(120,200,255,' + a * 0.35 + ')' : k === 1 ? 'rgba(255,215,120,' + a * 0.6 + ')' : 'rgba(255,255,240,' + a + ')'; c.lineWidth = f.w * (k === 0 ? 1 : k === 1 ? 0.45 : 0.15); c.lineCap = 'round'; c.beginPath();
        for (let i = 0; i <= 24; i++) { const u = i / 24, w = Math.sin(u * 9 + f.t * 0.5) * f.w * 0.25 * (1 - u * 0.5); const x = f.x0 + (f.x1 - f.x0) * u + nx * w, y = f.y0 + (f.y1 - f.y0) * u + ny * w; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      c.fillStyle = 'rgba(255,240,190,' + a + ')'; c.beginPath(); c.arc(f.x1, f.y1, f.w * 0.35, 0, 6.283); c.fill(); c.restore(); },
    glint(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(220,240,255,' + a + ')'; c.lineWidth = 1.5; const r = 8 * a + 3; c.beginPath(); c.moveTo(f.x - r, f.y); c.lineTo(f.x + r, f.y); c.moveTo(f.x, f.y - r); c.lineTo(f.x, f.y + r); c.stroke(); c.restore(); } });
  const fp0 = G.FXV.proj; G.FXV.proj = function (p, c) { if (p.pk !== 'axe') return fp0(p, c); const h = HH() * SC.depth(p.y), y = p.y - p.h; c.save(); c.translate(p.x, y); c.rotate((G.t || 0) * 0.5 * (p.face || 1));
    c.strokeStyle = '#5a3d24'; c.lineWidth = Math.max(2, h * 0.04); c.beginPath(); c.moveTo(-h * 0.17, 0); c.lineTo(h * 0.17, 0); c.stroke();
    c.fillStyle = '#c9ced4'; c.strokeStyle = '#3a3f46'; c.lineWidth = 1; c.beginPath(); c.moveTo(h * 0.08, -h * 0.02); c.quadraticCurveTo(h * 0.26, -h * 0.16, h * 0.2, h * 0.02); c.quadraticCurveTo(h * 0.26, h * 0.16, h * 0.08, h * 0.02); c.fill(); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, h * 0.24, 0, 6.283); c.stroke(); c.restore(); };

  /* ======== 9. 錫杖（法術）／金棒（重擊） ======== */
  Object.assign(ACTK, {"staff":{"walk":1.13,"cast_fuda":0.8,"cast_gogyo":0.8,"cast_tama":0.8,"combo_finisher_1":1.13,"combo_finisher_4":0.94,"skill_haja_basic":1.15,"skill_haja_evolved":1.15,"skill_haja_master":1.15,"skill_kekkai_basic":1.14,"skill_kekkai_evolved":1.14,"skill_kekkai_master":1.14,"skill_yuko_master":1.06,"special_reflect":1.06,"support_palm":1.06,"unseal_point":1.06,"run":1.11,"jump_dash":1.09},"kanabo":{"armor_bell":1.19,"backstep":1.08,"barrier_sweep":1.21,"cast_fuda":0.82,"cast_gogyo":0.82,"cast_tama":0.82,"dodge":1.06,"retreat_mountain":1.15,"short_quake":1.13,"skill_ganseki_basic":0.9,"skill_ganseki_evolved":0.9,"skill_ganseki_master":0.9,"skill_meido_basic":0.93,"skill_meido_evolved":0.92,"skill_meido_master":0.93,"ultimate_kishin_basic":1.1,"ultimate_kishin_evolved":1.09,"ultimate_kishin_master":1.08,"walk":1.08,"run":1.08}});
  Object.assign(BLADE, {"staff":{"cast_fuda":[[74,-134],[73,-135],[71,-134],null,[67,-125],[74,-134]],"cast_gogyo":[[73,-128],[73,-134],[71,-134],[69,-127],[70,-132],[73,-128]],"cast_tama":[[69,-126],[70,-132],[74,-134]],"ring_step":[null,null,[-46,-37],null,null,null],"skill_kekkai_basic":[null,[51,-118],null,null,null,[37,-118]],"skill_kekkai_evolved":[null,null,null,null,null,[37,-118]],"skill_kekkai_master":[null,[50,-116],null,null,null,[38,-119]],"skill_shinrai_basic":[[45,-129],[50,-128],null,null,null,null],"skill_shinrai_evolved":[null,null,null,[59,-74],null,null],"skill_shinrai_master":[null,[48,-125],null,null,null,[40,-105]],"special_reflect":[null,null,null,[68,-89],null,null],"special_support":[null,null,null,[67,-81],null,null],"staff_point":[null,null,null,[71,-89],null,null],"ultimate_nichirin_basic":[[49,-120],[43,-141],[49,-140],[14,-154],null,null,null,[55,-143],[66,-126]],"ultimate_nichirin_evolved":[null,[39,-152],[49,-140],[14,-154],null,null,[46,-146],[-30,-149],[54,-153],[65,-124]],"ultimate_nichirin_master":[[53,-118],[43,-141],[49,-140],null,[8,-153],null,null,[-29,-151],[-10,-152],[61,-149],[63,-121]],"unseal_point":[null,null,[67,-89],[69,-89],[-1,-128],null]},"kanabo":{"armor_bell":[[56,-52],null,null,null,null,[56,-52]],"barrier_sweep":[[53,-50],[-48,-40],[-56,-54],[69,-68],[46,-40],[53,-50]],"club_brace":[[62,-59],null,[47,-129],[47,-110],null,[62,-59]],"combo_finisher_1":[[-60,-120],[-77,-118],[84,-72],[44,-32]],"combo_finisher_2":[null,[8,-126],[62,-145],[65,-102]],"descending_press":[[62,-59],null,[-38,-135],null,null,[62,-59]],"normal_1":[[55,-58],[63,-48],[-51,-107],[-38,-132],[62,-37],null,null,[64,-52]],"skill_ganseki_basic":[[44,-35],null,null,[69,-93],[39,-33],null],"skill_ganseki_evolved":[[44,-35],null,null,[69,-93],[39,-33],null],"skill_ganseki_master":[null,null,[54,-96],[67,-99],[39,-33],[42,-34]],"skill_jiretsu_basic":[[73,-40],[-62,-40],[44,-29],[40,-29],[75,-46],[72,-70]],"skill_jiretsu_evolved":[[73,-40],[-62,-40],[44,-29],null,[75,-46],[72,-70]],"skill_jiretsu_master":[[74,-40],[-62,-40],[44,-29],[40,-29],[75,-46],[72,-70]],"skill_meido_basic":[[89,-55],[93,-77],[89,-116],null,[89,-94],[88,-56]],"skill_meido_evolved":[[89,-55],[92,-77],[90,-116],null,[87,-92],[88,-56]],"skill_meido_master":[[88,-56],[92,-77],[89,-116],null,[87,-92],[88,-56]],"skill_onikudaki_basic":[[70,-74],[54,-48],[-32,-157],[56,-30],[72,-74],[69,-73]],"skill_onikudaki_evolved":[[70,-74],[54,-48],[-32,-157],[56,-30],[72,-74],[69,-73]],"skill_onikudaki_master":[[70,-74],[54,-48],[-32,-157],[56,-30],[72,-74],[69,-73]],"special_bell":[[62,-59],null,[-46,-147],null,null,[62,-59]],"special_quake":[[62,-59],null,null,null,null,[62,-59]],"special_rebound":[[60,-57],[45,-118],null,[88,-87],null,[60,-57]],"special_retreat":[[62,-59],null,[47,-36],null,null,[62,-59]],"ultimate_kishin_basic":[[61,-36],[59,-38],[49,-141],[30,-141],[62,-34],null,null,[61,-55],[55,-59]],"ultimate_kishin_evolved":[[61,-36],[58,-37],[50,-139],[25,-142],[60,-37],null,[36,-142],null,[61,-55],[55,-60]],"ultimate_kishin_master":[[61,-36],[58,-38],[50,-139],[25,-142],[60,-36],null,[36,-142],null,[55,-62],[61,-55],[55,-60]]}});
  Object.assign(KEEP_MV, { staff: [['staff_point', '點杖探邪', 'attack', 1, 24], ['ring_step', '震環開步', 'attack', 3, 40], ['unseal_point', '解印破封', 'attack', 6, 40], ['staff_mudra', '架符候勢', 'guard', 9, 30]],
    kanabo: [['descending_press', '墜棒壓勢', 'attack', 1, 36], ['barrier_sweep', '橫關重掃', 'attack', 3, 48], ['armor_bell', '破甲沉鐘', 'attack', 6, 40], ['club_brace', '架棒待震', 'guard', 9, 30]] });
  Object.assign(MAPMV, { staff: { butt_break: 'ring_step', guided_flow: 'staff_point', plant_seal: 'unseal_point', purifying_mudra: 'staff_mudra', seal_shift: 'ring_step', staff_support: 'staff_mudra', support_palm: 'staff_mudra', withdraw_seal: 'unseal_point' },
    kanabo: { earth_lift: 'barrier_sweep', low_knock: 'armor_bell', planted_hammer: 'descending_press', point_drop: 'descending_press', retreat_mountain: 'club_brace', short_quake: 'barrier_sweep', shoulder_press: 'armor_bell', turning_unload: 'club_brace' } });
  for (const id of ['staff', 'kanabo']) { const w = W.BY[id]; w.mv = KEEP_MV[id].map(([i, n, k, u, cd]) => ({ id: i, n, k, u, cd })); w.MV = {}; for (const m of w.mv) w.MV[m.id] = m; }
  W.BY.staff.combo = ['cast_tama', 'cast_tama', 'cast_fuda', 'cast_gogyo'];   // 錫杖普攻改用施法動作
  /* 借用夥伴特效圖（葛葉：符陣／封印、汐音：回復、白丸：震地）：第一次用到時背景載入 */
  const BORROW = { staff: ['p_kuzuha_fx', 'p_shion_fx'], kanabo: ['p_shiro_fx'] }, A = G.ANIM, bl = {};
  const pre = () => { for (const k of BORROW[W.curId()] || []) if (!bl[k]) { bl[k] = 1; Promise.resolve(A.load(k)).catch(() => { bl[k] = 0; }); } };
  const bfx = (pack, name, x, y, face, sc) => { pre(); const u = A.get(pack), r = u && u.fx && u.fx[name]; if (!r) return null; const f = { k: 'spr', u: u.key || pack, r, x, y, face, s: sc, t: 0, life: Math.max(6, Math.round(A.dur(r) / TK)) }; G.FX.push(f); return f; };
  W.bfx = bfx;
  /* 施法普攻：給施法動作補上合約（出手時間、可接下一段的時間） */
  const pa1 = W.patchAct; W.patchAct = function (name, r) { pa1(name, r); if (W.curId() !== 'staff' || !/^cast_/.test(name)) return;
    const T = Math.max(22, Math.round(A.dur(r) / TK)); r.c = { n: name, k: 'attack', dur: T, ev: [{ at: Math.round(T * 0.45), damage: 16, shape: 'projectile', reach: 50, width: 6, arc: 0, active: 2 }], cx: [Math.round(T * 0.62), Math.round(T * 0.62), Math.round(T * 0.62)] }; };
  const near = (R, n) => G.E.filter(e => alive(e) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < R).sort((p, q) => Math.hypot(p.x - H.x, p.y - H.y) - Math.hypot(q.x - H.x, q.y - H.y)).slice(0, n || 99);
  const head = () => W.bladePt() || [H.x + H.face * HH() * 0.5 * s0(), H.y - HH() * 0.9 * s0()];
  const sh0 = W.shoot; W.shoot = function (ev, a, mult, big) { if (W.curId() !== 'staff') return sh0(ev, a, mult, big); pre();
    const i = H.combo, s = s0(), hs = HH() * s, hp = head(); VF('halo', { x: hp[0], y: hp[1], r: hs * 0.22, life: 12 });
    if (i === 3) { const e = near(hs * 6, 1)[0], x = e ? e.x : H.x + H.face * hs * 2.5, y = e ? e.y : H.y;   // 普攻 4：光柱自地面升起（最近敵人 ≤6H）
      G.spawnFx('skill_light_pillar_a', 0, x, y - hs * 0.5, 1, s * 2); for (const o of G.E) if (alive(o) && Math.hypot(o.x - x, (o.y - y) * 1.8) < hs * 0.8 + 16) { G.damageOni(o, mult * 1.4, true); hitFx(o); } SC.shake = 4; return true; }
    const N = i === 1 ? 2 : 1; for (let k = 0; k < N; k++) { const an = N > 1 ? (k ? 0.13 : -0.13) : 0, sp = 8;
      const p = { x: hp[0], y: H.y, h: Math.max(4, H.y - hp[1]), vx: H.face * Math.cos(an) * sp, vy: Math.sin(an) * sp * 0.5, left: hs * (i === 2 ? 9 : 8), mult: mult * (i === 2 ? 1.5 : N > 1 ? 0.7 : 1), big: i === 2, pierce: i === 2 ? 2 : 1, hits: [], face: H.face, pk: i === 2 ? 'borb' : 'lorb' };
      G.PROJ.push(p); }
    return true; };
  const hitFx = e => G.spawnFx('feedback_hit_a', 0, e.x, e.y - HH() * 0.5 * SC.depth(e.y), H.face, SC.depth(e.y) * 1.4);
  Object.assign(PK, { staff: { skill_light_beam_a: 'borb', needle: 'needle' }, kanabo: { projectile_stone_a: 'rock' } });
  /* 自訂型別：神雷（最近 3 敵落雷＋連鎖）、日輪（每 0.5 秒照射全部）、封印（後撤＋地面符印） */
  const cu1 = custom; custom = function (a, s, lv, b) { if (!['thunder', 'sun', 'seal'].includes(b.t)) return cu1(a, s, lv, b); pre();
    const B = a.B = Object.assign({}, b, lv >= 3 ? b.m3 : {}, lv >= 5 ? b.m5 : {}); a.beh = b.t; a.ev = []; a.noMv = true; a.sched = []; const c = a.c, hs = HH() * s0();
    const t0 = Math.max(4, c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.4));
    if (b.t === 'thunder') { a.sched.push({ t: Math.max(2, t0 - 8), f: () => { const p = head(); VF('halo', { x: p[0], y: p[1], r: hs * 0.3, life: 14, col: '200,220,255' }); for (let k = 0; k < 6; k++) G.FX.push({ k: 'spark', x: p[0], y: p[1], vx: (Math.random() - .5) * 4, vy: -Math.random() * 3, t: 0, life: 12 }); } });
      a.sched.push({ t: t0, f: () => { const L = near(hs * 7, B.n); if (!L.length) G.UI.toast('附近沒有目標');
        for (const e of L) { if (B.sealFx) bfx('p_kuzuha_fx', 'seal_hit', e.x, e.y - hs * 0.5, H.face, SC.depth(e.y) * 2); else G.spawnFx('skill_lightning_strike_a', 0, e.x, e.y - hs * 0.6, 1, SC.depth(e.y) * 2.2); for (const o of G.E) if (alive(o) && Math.hypot(o.x - e.x, (o.y - e.y) * 1.8) < hs * 0.6 + 16) SKB.hitE(o, a, B.m, { last: true, big: true });
          if (B.chain) { let from = e; for (let k = 0; k < 2; k++) { const nx = G.E.filter(o => alive(o) && o !== from && o !== e && Math.hypot(o.x - from.x, o.y - from.y) < hs * 3).sort((p, q) => Math.hypot(p.x - from.x, p.y - from.y) - Math.hypot(q.x - from.x, q.y - from.y))[0]; if (!nx) break;
              VF('bolt', { x0: from.x, y0: from.y - hs * 0.6, x1: nx.x, y1: nx.y - hs * 0.6, life: 12 }); SKB.hitE(nx, a, B.m * 0.6, {}); from = nx; } } }
        SC.shake = 6; } }); a.T = Math.max(a.T, t0 + 8); }
    else if (b.t === 'sun') { a.invAll = true; const T2 = B.dur; a.T = Math.max(a.T, t0 + 20); const z = { k: 'sunz', x: H.x, y: H.y, t: 0, life: T2, a, m: B.m, heal: B.healEnd }; G.ZONES.push(z); VF('sun', { life: T2 }); bfx('p_kuzuha_fx', 'sixfold', H.x, H.y - hs * 0.4, H.face, s0() * 2); }
    else { const x0 = H.x, y0 = H.y; a.mv2 = { d: -hs * 1.5, f0: t0, f1: t0 + 12 }; a.invAll = true;
      a.sched.push({ t: t0, f: () => { G.ZONES.push({ k: 'sealz', x: x0, y: y0, r: hs * 0.9, t: 0, life: B.net ? 120 : 180, slow: 40, root: B.root, burst: B.burst, net: B.net, a, m: 1.5 }); if (!B.net) bfx('p_kuzuha_fx', 'bind_ring', x0, y0 - 6, H.face, s0() * 1.8); } }); }
    return true; };
  const sk2 = SKB.start; SKB.start = function (a, s, lv) { const b = SKB.get(W.curId(), s.id); pre(); if (b && ['thunder', 'sun', 'seal'].includes(b.t)) return custom(a, s, lv, b); return sk2.call(SKB, a, s, lv); };
  const zs2 = SKB.step; SKB.step = function () { zs2.call(SKB); const hs = HH() * s0();
    for (const z of G.ZONES) {
      if (z.k === 'sunz') { if (z.t % 30 === 15) { for (const e of G.E) if (alive(e) && Math.abs(e.x - H.x) < hs * 8) { G.spawnFx('skill_light_pillar_b', 0, e.x, e.y - hs * 0.5, 1, SC.depth(e.y) * 1.8); SKB.hitE(e, z.a, z.m, { big: true }); } SC.shake = 3; }
        if (z.t === z.life - 1 && z.heal) { H.hp = H.hpMax; for (const P of (G.PARTY && G.PARTY.list) || []) if (P.hpMax) P.hp = P.hpMax; G.UI.toast('日輪：全隊回滿'); } }
      else if (z.k === 'sealz') { if (z.t % 6 === 0) VF(z.net ? 'chainring' : 'sigil', { x: z.x, y: z.y + (z.net ? HH() * s0() * 0.35 : 0), r: z.r, life: 8, col: '255,214,120' });
        for (const e of G.E) if (alive(e) && Math.hypot(e.x - z.x, (e.y - z.y) * 1.8) < z.r + 16) { e.db = e.db || {}; e.db.slow = Math.max(e.db.slow || 0, z.slow); e.db.slowT = Math.max(e.db.slowT || 0, 10); if (z.root && !e.sealed) { e.sealed = 1; e.stun = Math.max(e.stun || 0, z.root); } }
        if (z.t === z.life - 1 && z.burst) { G.spawnFx('skill_light_pillar_a', 0, z.x, z.y - 20, 1, SC.depth(z.y) * 2.2); for (const e of G.E) if (alive(e) && Math.hypot(e.x - z.x, (e.y - z.y) * 1.8) < z.r * 1.3) SKB.hitE(e, z.a, z.m, { big: true, last: true }); SC.shake = 6; } }
      else if (z.k === 'zone' && z.ward && z.t % 6 === 0) VF('sigil', { x: z.x, y: z.y, r: z.r, life: 8, col: '170,215,255' }); } };
  /* 錫杖／金棒追加 */
  const ex2 = extras; extras = function (a, s, lv, b) { ex2(a, s, lv, b); const B = a.B; if (!B) return; const hs = HH() * s0();
    if (B.ward) a.sched.push({ t: 2, f: () => { const z = G.ZONES.find(z => z.a === a && z.k === 'zone'); if (z) { z.ward = 1; z.r = hs * B.r; } bfx('p_kuzuha_fx', 'guard_ward', H.x, H.y - hs * 0.3, H.face, s0() * 2); } });
    if (B.lightWall) a.sched.push({ t: 2, f: () => VF('wallv', { x: H.x + H.face * hs * 0.6, y: H.y, h: hs * 1.3, life: (B.dur || 120) - 4, face: H.face }) });
    if (B.link) a.sched.push({ t: 3, f: () => { for (const P of (G.PARTY && G.PARTY.list) || []) VF('linkv', { p: P, life: 90 }); bfx('p_kuzuha_fx', 'cleanse', H.x, H.y - hs * 0.5, H.face, s0() * 1.8); } });
    if (B.party) a.sched.push({ t: Math.max(2, Math.round(a.T * 0.4)), f: () => { const v = (B.v || 10) / 100; for (const P of (G.PARTY && G.PARTY.list) || []) if (P.hpMax && P.hp > 0) { P.hp = Math.min(P.hpMax, P.hp + P.hpMax * v); bfx('p_shion_fx', 'heal_echo', P.x, P.y - hs * 0.4, 1, SC.depth(P.y) * 1.6); }
      bfx('p_shion_fx', 'heal_main', H.x, H.y - hs * 0.4, H.face, s0() * 2); if (B.drAfter) BF.add('dr', 15, 300); } });
    if (B.bell) wrap2(a, () => VF('bell', { x: H.x, y: H.y, r: hs * (B.r || 1.2), life: 26 }));
    if (B.quakeFx) wrap2(a, () => { bfx('p_shiro_fx', 'heavy_quake', H.x + H.face * hs * (B.qx || 0.5), H.y - 4, H.face, s0() * 2); VF('crack', { x: H.x + H.face * hs * (B.qx || 0.5), y: H.y, r: hs * (B.qr || B.r || 1), life: 30 }); });
    if (B.suck) a.sched.unshift({ t: 1, f: () => VF('suck', { x: H.x, y: H.y, r: hs * (B.r || 2.5), life: 22 }) });
    if (B.mudra) a.sched.push({ t: 2, f: () => VF('wallv', { x: H.x + H.face * hs * 0.45, y: H.y, h: hs * 1.0, life: (B.dur || 36), face: H.face, col: '255,236,170' }) });
    if (B.needle) a.sched.push({ t: 1, f: () => {} });
    if (B.kishin) a.sched.push({ t: 2, f: () => { const t = B.buff.t; BF.add('kishin', 1, t); W._kishin = { t0: G.t, t }; VF('aura', { x: H.x, y: H.y, life: t, col: '255,200,80' }); if (B.buff.armor) BF.add('armor', 1, t); if (B.buff.ls) BF.add('ls', B.buff.ls, t); G.UI.toast('鬼神降：普攻變成砸地'); } }); };
  /* 架符候勢：擋下時對攻擊者落雷（極意 3 道）；架棒待震：環身反擊（極意暈眩） */
  const ct3 = SKB.counter; SKB.counter = function (e) { const a = H.act, B = a && a.B, ok = ct3.call(SKB, e); if (!ok || !B) return ok; const hs = HH() * s0();
    if (B.boltC) { const L = [e].concat(near(hs * 5, 3).filter(o => o !== e)).slice(0, B.boltC); for (const o of L) { G.spawnFx('skill_lightning_strike_a', 0, o.x, o.y - hs * 0.6, 1, SC.depth(o.y) * 2); SKB.hitE(o, a, B.m, { last: true, big: true }); } }
    if (B.ringC) { VF('bell', { x: H.x, y: H.y, r: hs * B.ringC, life: 22 }); for (const o of G.E) if (alive(o) && Math.hypot(o.x - H.x, (o.y - H.y) * 1.8) < hs * B.ringC + 16) { SKB.hitE(o, a, B.m, { last: true, big: true }); if (B.stunC) o.stun = Math.max(o.stun || 0, B.stunC); } }
    return ok; };
  /* 金棒：重擊感（命中頓幀加長、畫面震動、腳下衝擊環與土塊）；鬼神降期間普攻改砸地、體型 1→1.15 漸變 */
  let shockT = -9;
  const dmg1 = G.damageOni; G.damageOni = function (e, m, big, ...r) { const out = dmg1.call(this, e, m, big, ...r);
    if (W.curId() === 'kanabo' && H.act && e && !G._bleedTick) { if (H.act.name === 'combo_finisher_2' && Math.random() < 0.2) e.stun = Math.max(e.stun || 0, 40); G.hitstop = Math.max(G.hitstop, big ? 9 : 6); SC.shake = Math.max(SC.shake || 0, big ? 9 : 5);
      if (G.t !== shockT) { shockT = G.t; const s = SC.depth(e.y); VF('shock', { x: e.x, y: e.y, r: HH() * s * 0.6, life: 14 }); for (let k = 0; k < 5; k++) G.FX.push({ k: 'spark', x: e.x, y: e.y - 6, vx: (Math.random() - .5) * 5, vy: -1 - Math.random() * 3, t: 0, life: 18, col: 'dirt' }); } }
    return out; };
  const of0 = W.onFire; W.onFire = function (ev, a, bp) { of0(ev, a, bp); if (W.curId() !== 'kanabo') return; const P = (EVP.kanabo || {})[a.name] || {}, hs = HH() * s0();
    if (P.dust || BF.get('kishin') > 0) { const x = H.x + H.face * hs * 0.8; G.FX.push({ k: 'dust', x, y: H.y, t: 0, life: 18 }); VF('crack', { x, y: H.y, r: hs, life: 26 }); bfx('p_shiro_fx', 'heavy_quake', x, H.y - 4, H.face, s0() * 1.8); }
    if (BF.get('kishin') > 0) { const x = H.x + H.face * hs * 0.8; for (const e of G.E) if (alive(e) && Math.hypot(e.x - x, (e.y - H.y) * 1.8) < hs * 1.2 + 16) G.damageOni(e, 1.2 * (a.mult || 1), true); } };
  const ak0 = W.actK; W.actK = name => { let k = ak0(name); const kk = W._kishin; if (kk && W.curId() === 'kanabo' && BF.get('kishin') > 0) { const t = G.t - kk.t0, up = Math.min(1, t / 18), dn = Math.min(1, (kk.t - t) / 18); k *= 1 + 0.15 * Math.max(0, Math.min(up, dn)); } return k; };
  Object.assign(EVP, { kanabo: { normal_1: { d: 1.25, arc: 90 }, combo_finisher_1: { d: 1.3, arc: 90 }, combo_finisher_2: { shape: 'circle', d: 1.0, cx: 0.8, dust: 1, stun20: 1 } } });
  Object.assign(SKB.BEH.staff, {
    skill_haja: { t: 'bomb', n: 1, m: 1.6, d: 10, img: 'skill_light_beam_a', r: 0.6, m3: { n: 2, spread: 0.5 }, m5: { yokai: 50 } },
    skill_kekkai: { t: 'zone', r: 1.5, dur: 360, dr: 30, fx: 'skill_light_glyph_a', ward: 1, m3: { r: 1.3 }, m5: { slow: 1 } },
    skill_shinrai: { t: 'thunder', n: 3, m: 1.4, m3: { n: 5 }, m5: { n: 5, chain: 1 } },
    skill_yuko: { t: 'orbit', n: 3, r: 1.0, m: 0.5, dur: 300, fx: 'skill_light_glyph_b', m3: { n: 2 }, m5: { healHit: 1 } },
    special_reflect: { t: 'stance', dur: 120, m: 1.2, fx: 'skill_light_glyph_a', lightWall: 1, m3: { dur: 60 }, m5: { m: 2 } },
    special_resonance: { t: 'buff', buff: { atk: 15, t: 480 }, fx: 'skill_light_pillar_b', link: 1, m3: { atkX: 25 }, m5: { buffCdr: 20 } },
    special_sealretreat: { t: 'seal', m3: { root: 60 }, m5: { root: 60, burst: 1 } },
    special_support: { t: 'heal', v: 10, fx: 'skill_water_column_a', party: 1, m3: { v: 15 }, m5: { v: 15, drAfter: 1 } },
    ultimate_nichirin: { t: 'sun', dur: 240, m: 0.9, m3: { dur: 360 }, m5: { dur: 360, healEnd: 1 } },
    staff_point: { t: 'shot', n: 1, m: 1.1, d: 9, img: 'needle', fast: 1, m3: { cdr: 0.8 }, m5: { n: 1, cdr: 0.8 } },
    ring_step: { t: 'nova', r: 1.0, m: 1.0, knock: 1.8, fx: 'skill_light_glyph_b', bell: 1, m3: { r: 1.3 }, m5: { stun: 30 } },
    unseal_point: { t: 'thunder', n: 1, m: 1.2, sealFx: 1, defdown: 15, debuffT: 0.8, m3: { defdown: 25 }, m5: { defdown: 25, chain: 1 } },
    staff_mudra: { t: 'stance', dur: 36, m: 1.2, fx: 'skill_light_glyph_a', mudra: 1, boltC: 1, m3: { dur: 18 }, m5: { boltC: 3 } } });
  Object.assign(SKB.BEH.kanabo, {
    skill_ganseki: { t: 'shard', n: 5, m: 0.9, d: 4, spread: 0.9, img: 'projectile_stone_a', quakeFx: 1, qx: 0.6, r: 0.8, m3: { n: 2 }, m5: { stun: 36 } },
    skill_jiretsu: { t: 'line', d: 5, m: 1.5, fx: 'quakeseg', m3: { dist: 1.5 }, m5: { side: 1 } },
    skill_meido: { t: 'pull', r: 2.5, m: 2.2, fx: 'skill_dark_core_a', suck: 1, quakeFx: 1, qx: 0.4, qr: 1.3, m3: { r: 1.3 }, m5: { dot: { t: 180, m: 0.3, fx: 'skill_dark_strike_a' } } },
    skill_onikudaki: { t: 'multi', n: 3, m: 1, r: 1.3, last: 1.5, fx: 'fx_tier_kanabo_basic', m3: { last: 2.25 }, m5: { last: 2.25, down: 1 } },
    special_bell: { t: 'nova', r: 1.2, m: 0.8, stun: 60, fx: 'skill_light_glyph_b', bell: 1, m3: { stun: 90 }, m5: { stun: 90, vuln: 20 } },
    special_quake: { t: 'nova', r: 1.0, m: 1.3, fx: 'weapon_blunt_b', quakeFx: 1, qx: 0.5, m3: { r: 1.3 }, m5: { twice: 1 } },
    special_rebound: { t: 'stance', dur: 48, m: 1.6, fx: 'feedback_guard_b', bell: 1, m3: { qi: 10 }, m5: { reflect: 1 } },
    special_retreat: { t: 'back', d: 1.2, m: 1.3, fx: 'fx_tier_kanabo_basic', m3: { inv: 1 }, m5: { wall: 1 } },
    ultimate_kishin: { t: 'buff', buff: { t: 360 }, fx: 'skill_fire_rim_a', kishin: 1, m3: { buff: { t: 480 } }, m5: { buff: { t: 480, armor: 1, ls: 10 } } },
    descending_press: { t: 'leap', d: 1.5, r: 1.0, m: 1.6, fx: 'weapon_blunt_b', quakeFx: 1, qx: 0, m3: { dist: 1.3 }, m5: { stun: 30 } },
    barrier_sweep: { t: 'sweep', r: 1.15, m: 1.3, knock: 1.8, fx: 'fx_tier_kanabo_basic', m3: { r: 1.3 }, m5: { r: 1.3, stun: 20 } },
    armor_bell: { t: 'multi', n: 1, m: 1.3, r: 1.2, defdown: 15, debuffT: 0.85, bell: 1, fx: 'fx_tier_kanabo_basic', m3: { defdown: 25 }, m5: { defdown: 30 } },
    club_brace: { t: 'stance', dur: 36, m: 1.4, ringC: 1.0, fx: 'feedback_guard_b', m3: { dur: 18 }, m5: { stunC: 48 } } });
  Object.assign(G.FXV, {
    halo(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, 'rgba(' + (f.col || '255,245,200') + ',' + a + ')'); g.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.283); c.fill(); c.restore(); },
    bolt(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(200,225,255,' + a + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(f.x0, f.y0); for (let i = 1; i < 6; i++) { const u = i / 6; c.lineTo(f.x0 + (f.x1 - f.x0) * u + (Math.random() - .5) * 14, f.y0 + (f.y1 - f.y0) * u + (Math.random() - .5) * 14); } c.lineTo(f.x1, f.y1); c.stroke(); c.restore(); },
    sun(f, a, c) { const hs = HH() * s0(), x = H.x, y = H.y - hs * 2.4, r = hs * 0.55; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, 'rgba(255,250,215,' + Math.min(1, a * 3) + ')'); g.addColorStop(0.35, 'rgba(255,215,120,' + Math.min(1, a * 3) * 0.7 + ')'); g.addColorStop(1, 'rgba(255,180,60,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.2, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,235,170,' + Math.min(1, a * 3) * 0.8 + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * (1.1 + 0.08 * Math.sin(f.t * 0.2)), 0, 6.283); c.stroke(); c.restore(); },
    sigil(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(' + f.col + ',.55)'; c.lineWidth = 2; const ry = f.r * 0.42, rot = (G.t || 0) * 0.02;
      c.beginPath(); c.ellipse(f.x, f.y, f.r, ry, 0, 0, 6.283); c.stroke(); c.beginPath(); c.ellipse(f.x, f.y, f.r * 0.72, ry * 0.72, 0, 0, 6.283); c.stroke();
      c.beginPath(); for (let i = 0; i <= 5; i++) { const an = rot + i * 6.283 * 2 / 5; const x = f.x + Math.cos(an) * f.r * 0.72, y = f.y + Math.sin(an) * ry * 0.72; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore(); },
    wallv(f, a, c) { if (!H.act) return; c.save(); c.globalCompositeOperation = 'lighter'; const x = H.x + H.face * Math.abs(f.x - H.x), g = c.createLinearGradient(x - 6, 0, x + 6, 0), col = f.col || '200,230,255'; g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.5, 'rgba(' + col + ',.45)'); g.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = g; c.fillRect(x - 8, H.y - f.h, 16, f.h); c.strokeStyle = 'rgba(' + col + ',.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, H.y - f.h); c.lineTo(x, H.y); c.stroke(); c.restore(); },
    linkv(f, a, c) { const P = f.p; if (!P) return; const hs = HH() * s0(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,230,150,' + a * 0.7 + ')'; c.lineWidth = 2; c.setLineDash([6, 5]); c.lineDashOffset = -f.t;
      c.beginPath(); c.moveTo(H.x, H.y - hs * 0.55); c.lineTo(P.x, P.y - hs * 0.5); c.stroke(); c.restore(); },
    bell(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const u = Math.min(1, f.t / f.life + k * 0.18), r = f.r * u; c.strokeStyle = 'rgba(255,225,160,' + (1 - u) * 0.8 + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(f.x, f.y - 4, r, r * 0.42, 0, 0, 6.283); c.stroke(); } c.restore(); },
    suck(f, a, c) { c.save(); c.strokeStyle = 'rgba(160,120,200,' + a * 0.6 + ')'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const an = i * 0.785 + f.t * 0.15, r = f.r * (1 - f.t / f.life); c.beginPath(); c.arc(f.x, f.y - 10, Math.max(4, r), an, an + 0.5); c.stroke(); } c.restore(); },
    shock(f, a, c) { c.save(); const u = 1 - a; c.strokeStyle = 'rgba(255,240,210,' + a + ')'; c.lineWidth = 3 * a + 1; c.beginPath(); c.ellipse(f.x, f.y - 3, f.r * (0.4 + u), f.r * (0.4 + u) * 0.38, 0, 0, 6.283); c.stroke(); c.restore(); } });
  const fp1 = G.FXV.proj; G.FXV.proj = function (p, c) { if (!['lorb', 'borb', 'needle', 'rock'].includes(p.pk)) return fp1(p, c); const h = HH() * SC.depth(p.y), y = p.y - p.h - (p.arc || 0), dir = Math.sign(p.vx) || p.face; c.save();
    if (p.pk === 'rock') { c.translate(p.x, y); c.rotate((G.t || 0) * 0.3); c.fillStyle = '#6d6258'; c.strokeStyle = '#3b332c'; c.lineWidth = 1.2; const r = h * 0.11; c.beginPath(); for (let i = 0; i < 7; i++) { const an = i * 0.9, rr = r * (0.75 + 0.25 * ((i * 37) % 5) / 4); i ? c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.moveTo(rr, 0); } c.closePath(); c.fill(); c.stroke(); c.restore(); return; }
    c.globalCompositeOperation = 'lighter';
    if (p.pk === 'needle') { const L = h * 0.6, g = c.createLinearGradient(p.x - dir * L, y, p.x, y); g.addColorStop(0, 'rgba(200,235,255,0)'); g.addColorStop(1, 'rgba(240,250,255,1)'); c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - dir * L, y); c.lineTo(p.x, y); c.stroke(); c.restore(); return; }
    const r = h * (p.pk === 'borb' ? 0.15 : 0.09), L = h * 0.5, tg = c.createLinearGradient(p.x - dir * L, y, p.x, y); tg.addColorStop(0, 'rgba(255,230,150,0)'); tg.addColorStop(1, 'rgba(255,240,190,.6)');
    c.strokeStyle = tg; c.lineWidth = r * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x - dir * L, y); c.lineTo(p.x, y); c.stroke();
    const g = c.createRadialGradient(p.x, y, 0, p.x, y, r * 1.8); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.45, 'rgba(255,225,130,.85)'); g.addColorStop(1, 'rgba(255,190,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.x, y, r * 1.8, 0, 6.283); c.fill(); c.restore(); };

  /* ======== 10. 野太刀／薙刀／鎖鎌 ======== */
  Object.assign(ACTK, {"nodachi":{"walk":1.11,"advancing_weight":1.14,"back_turn":1.07,"combo_finisher_1":1.12,"combo_finisher_2":1.25,"combo_finisher_4":1.24,"dawn_draw":1.14,"dragging_line":1.07,"guard_break":1.07,"normal_1":1.07,"normal_2":1.09,"normal_3":1.07,"shunpo":0.93,"side_path":1.07,"special_backline":1.12,"special_break":1.07,"special_leave":1.06,"ultimate_tenchi_basic":0.93,"ultimate_tenchi_evolved":0.92,"ultimate_tenchi_master":0.92,"run":1.17,"jump_dash":1.15},"naginata":{"walk":1.11,"around_diagonal":1.14,"backstep":1.1,"combo_finisher_1":1.15,"combo_finisher_2":1.09,"combo_finisher_3":1.17,"combo_finisher_4":1.1,"fan_sweep":1.25,"gliding_wing":1.15,"low_leaf":1.17,"normal_1":1.12,"retreat_swallow":1.25,"reverse_leaf":1.22,"reverse_whirl":1.18,"shunpo":1.06,"side_wave":1.25,"sinking_leaf":1.25,"skill_chidori_basic":1.13,"skill_chidori_evolved":1.13,"skill_chidori_master":1.13,"special_current":1.15,"special_double":1.25,"special_openpath":1.25,"special_upright":1.19,"upright_deny":1.25,"wide_leaf":1.17,"wing_brace":1.11,"run":1.16,"jump_dash":1.2},"kusarigama":{"backstep":1.1,"combo_finisher_2":1.07,"normal_3":1.08,"shunpo":1.07,"skill_kamaitachi_basic":0.94,"skill_kamaitachi_evolved":0.94,"skill_kamaitachi_master":0.94,"skill_kusabiki_basic":1.1,"skill_kusabiki_evolved":1.1,"skill_kusabiki_master":1.1,"skill_sabaku_basic":1.16,"skill_sabaku_evolved":1.16,"skill_sabaku_master":1.16,"skill_sensa_basic":1.15,"skill_sensa_evolved":1.15,"skill_sensa_master":1.15,"ultimate_hyakki_basic":0.94,"ultimate_hyakki_evolved":0.93,"ultimate_hyakki_master":0.93}});
  Object.assign(BLADE, {"nodachi":{"advancing_weight":[[58,-15],[-51,-54],[-42,-118],null,null,[58,-15]],"combo_finisher_1":[null,[-91,-20],[58,-113],[70,-108]],"combo_finisher_2":[[-81,-64],[-68,-102],[-68,-90],null],"combo_finisher_3":[[86,-23],[-88,-46],[-92,-121],[-92,-92]],"combo_finisher_4":[[-66,-98],[-66,-66],null,null],"long_line":[[62,-16],[70,-18],[66,-90],[77,-112],null,[62,-16]],"normal_1":[[-70,-118],[75,-20],null,[80,-98]],"normal_2":[[78,-20],[70,-114],[92,-120],[76,-28]],"normal_3":[[-66,-136],null,null,[74,-96]],"opening_brace":[[60,-16],[52,-129],[68,-130],[86,-33],[74,-22],[60,-16]],"planted_break":[[62,-16],[56,-70],[2,-138],null,null,[62,-16]],"skill_daisharin_basic":[[92,-22],[90,-73],[-66,-138],[90,-54],null,[87,-28]],"skill_daisharin_evolved":[[91,-22],[90,-73],[-67,-138],[90,-54],null,[87,-27]],"skill_daisharin_master":[[91,-22],[90,-73],[-66,-138],[90,-54],null,[88,-27]],"skill_getsurin_basic":[[-58,-116],[80,-128],[89,-141],[98,-90],null,[84,-16]],"skill_getsurin_evolved":[[-58,-116],[79,-128],[88,-140],[98,-90],null,[84,-16]],"skill_getsurin_master":[[-58,-116],[80,-128],[89,-141],[98,-90],null,[84,-16]],"skill_haousan_basic":[[-52,-144],null,null,[-53,-118],[98,-65],[70,-20]],"skill_haousan_evolved":[[-52,-144],null,null,[-53,-119],[98,-64],[70,-20]],"skill_haousan_master":[[-52,-143],null,null,[-53,-118],[98,-65],[70,-20]],"skill_zantetsu_basic":[[89,-16],[-52,-113],[-59,-140],[-50,-122],[90,-14],[74,-22]],"skill_zantetsu_evolved":[[89,-16],[-52,-113],[-59,-140],[-50,-122],[88,-14],[74,-22]],"skill_zantetsu_master":[[89,-16],[-53,-113],[-59,-140],[-50,-122],[88,-14],[74,-22]],"special_backline":[[54,-15],[-59,-52],[-53,-118],[78,-85],null,[54,-15]],"special_break":[[56,-16],[-56,-76],[-52,-134],null,null,[56,-16]],"special_drawline":[[60,-17],null,[73,-103],[79,-136],[69,-130],[60,-17]],"special_leave":[[60,-16],[-36,-59],[74,-18],[90,-14],[74,-32],[60,-16]],"ultimate_tenchi_basic":[null,[-86,-126],[-82,-128],[-71,-146],[-62,-136],null,null,[72,-27],[-91,-17]],"ultimate_tenchi_evolved":[null,[-86,-126],[-81,-128],[-71,-146],[-62,-136],null,[-89,-18],[74,-132],[72,-27],[-91,-17]],"ultimate_tenchi_master":[null,[-86,-126],[-82,-128],[-70,-146],[-62,-136],null,[-89,-18],[74,-132],[-84,-30],[72,-27],[-92,-17]]},"naginata":{"combo_finisher_1":[[86,-95],null,[88,-26],[96,-48]],"combo_finisher_2":[[97,-24],[97,-114],[101,-132],[104,-116]],"combo_finisher_3":[[84,-86],[82,-91],[95,-60],null],"combo_finisher_4":[[-65,-43],[100,-87],[92,-112],[100,-121]],"gliding_wing":[[-63,-32],[64,-86],[72,-107],[63,-130],[61,-37],null],"low_leaf":[null,[-26,-59],null,null,[66,-64],null],"normal_1":[[-71,-32],[90,-70],[89,-54],[82,-36]],"normal_2":[[-62,-134],[93,-121],[90,-146],[93,-40]],"skill_arashi_basic":[[-76,-22],[84,-90],[78,-140],[83,-144],[93,-72],[83,-66]],"skill_arashi_evolved":[[-76,-22],[84,-90],[78,-140],[83,-144],[93,-72],[83,-66]],"skill_arashi_master":[[-76,-22],[84,-90],[78,-140],[83,-144],[93,-72],[83,-66]],"skill_chidori_basic":[[83,-20],[76,-67],null,[80,-59],[80,-40],[86,-28]],"skill_chidori_evolved":[[83,-20],[76,-67],[94,-83],[80,-59],[80,-40],[86,-28]],"skill_chidori_master":[[83,-20],[76,-67],null,[80,-59],[80,-40],[86,-28]],"skill_enbu_basic":[[72,-62],null,[76,-92],[89,-118],null,[86,-64]],"skill_enbu_evolved":[[76,-61],null,[76,-92],[89,-118],null,[86,-64]],"skill_enbu_master":[[76,-61],null,[76,-92],[89,-118],null,[86,-64]],"skill_senpu_basic":[null,[-82,-16],[94,-80],[90,-104],[90,-43],[98,-29]],"skill_senpu_evolved":[null,[-82,-16],[94,-80],[90,-104],[90,-43],[98,-29]],"skill_senpu_master":[null,[-82,-16],[94,-80],[90,-104],[90,-43],[98,-28]],"special_current":[null,[41,-90],[59,-126],[85,-79],[78,-38],null],"special_double":[null,null,null,[30,-62],null,null],"special_upright":[null,[40,-44],[24,-126],[70,-105],[46,-39],null],"ultimate_daikufu_basic":[[90,-34],[88,-34],[93,-30],[40,-62],[84,-142],[96,-136],[96,-20],[86,-88],[90,-80]],"ultimate_daikufu_evolved":[[90,-34],[89,-34],[93,-30],[84,-64],[84,-142],[96,-136],[72,-27],[80,-151],[87,-88],[90,-80]],"ultimate_daikufu_master":[[88,-32],[-22,-77],[92,-30],[82,-62],[82,-139],[93,-132],[70,-26],[78,-148],[95,-73],[85,-86],[88,-78]],"wide_leaf":[null,[-26,-64],[74,-70],[84,-36],[63,-30],null],"wing_brace":[[-65,-32],[56,-116],[63,-124],[66,-120],[60,-74],[-65,-33]]},"kusarigama":{"chain_arc":[null,[-60,-59],[-84,-57],[79,-59],[66,-51],null],"chain_probe":[null,[-52,-34],[69,-99],[93,-92],[-49,-33],null],"combo_finisher_1":[null,[57,-29],[50,-29],null],"combo_finisher_2":[[-33,-117],[89,-83],[86,-32],null],"combo_finisher_3":[null,null,[63,-51],null],"combo_finisher_4":[[-42,-123],[-70,-103],[-74,-70],null],"low_reap":[null,[-52,-39],[-85,-38],null,[-45,-37],null],"normal_1":[null,[86,-74],[89,-86],null],"normal_2":[null,[62,-113],[76,-120],[51,-44]],"normal_3":[[54,-54],[115,-73],[93,-63],[52,-60]],"normal_4":[null,[78,-42],[79,-29],null],"retreat_tether":[null,[66,-38],[82,-37],null,null,null],"skill_kamaitachi_basic":[null,[69,-48],[64,-57],[51,-96],[99,-68],null],"skill_kamaitachi_evolved":[null,[69,-48],[62,-53],[51,-96],[100,-66],null],"skill_kamaitachi_master":[null,[69,-48],[64,-57],[51,-96],[99,-67],null],"skill_kusabiki_basic":[null,[45,-41],[99,-44],[104,-46],[89,-43],null],"skill_kusabiki_evolved":[null,[45,-40],[99,-44],[104,-46],[89,-43],null],"skill_kusabiki_master":[null,[45,-41],[99,-44],[104,-46],[90,-43],null],"skill_sabaku_basic":[null,[51,-34],[95,-35],[72,-45],null,null],"skill_sabaku_evolved":[null,[52,-33],[93,-36],[72,-45],null,null],"skill_sabaku_master":[null,[52,-33],[93,-35],[72,-45],null,null],"skill_sensa_basic":[[56,-25],[115,-52],[87,-48],[77,-26],null,null],"skill_sensa_evolved":[[56,-25],[115,-52],[87,-48],[77,-25],null,null],"skill_sensa_master":[[56,-25],[114,-54],[87,-47],[77,-25],null,null],"special_cross":[null,null,null,[85,-50],[59,-40],null],"special_escape":[null,null,[63,-86],[70,-89],null,null],"special_pullcut":[null,null,null,null,[52,-40],null],"special_return":[null,[54,-48],[78,-98],[81,-76],null,null],"ultimate_hyakki_basic":[[47,-37],null,null,[85,-89],null,[70,-94],[48,-43],null,null],"ultimate_hyakki_evolved":[[47,-37],null,null,[85,-89],null,[70,-94],[79,-113],null,null,null],"ultimate_hyakki_master":[[47,-37],null,null,[85,-89],null,[70,-94],[78,-115],null,[54,-40],null,null]}});
  Object.assign(KEEP_MV, { nodachi: [['advancing_weight', '踏進沉鋒', 'attack', 1, 36], ['long_line', '長線斷空', 'attack', 3, 40], ['planted_break', '定鋒破守', 'attack', 6, 36], ['opening_brace', '架開收勢', 'guard', 9, 30]],
    naginata: [['gliding_wing', '掠步入翼', 'attack', 1, 30], ['wide_leaf', '寬葉橫薙', 'attack', 3, 44], ['low_leaf', '低刃掃根', 'attack', 6, 36], ['wing_brace', '架翼卸勢', 'guard', 9, 30]],
    kusarigama: [['chain_probe', '投鎖探路', 'attack', 1, 30], ['chain_arc', '旋鎖封群', 'attack', 3, 44], ['low_reap', '低鐮收割', 'attack', 6, 36], ['retreat_tether', '退引垂鎖', 'attack', 9, 40]] });
  Object.assign(MAPMV, { nodachi: { back_turn: 'opening_brace', dawn_draw: 'long_line', dragging_line: 'advancing_weight', falling_ridge: 'planted_break', low_ridge: 'opening_brace', retreat_peak: 'long_line', side_path: 'advancing_weight', sinking_charge: 'planted_break' },
    naginata: { around_diagonal: 'wide_leaf', fan_sweep: 'wide_leaf', retreat_swallow: 'gliding_wing', reverse_leaf: 'low_leaf', reverse_whirl: 'wide_leaf', side_wave: 'gliding_wing', sinking_leaf: 'low_leaf', upright_deny: 'wing_brace' },
    kusarigama: { chain_recall: 'chain_probe', close_sickle: 'low_reap', diagonal_cast: 'chain_probe', diagonal_loop: 'chain_arc', hand_exchange: 'low_reap', line_sickle: 'chain_arc', pull_retreat: 'retreat_tether', pulling_wrist: 'chain_probe' } });
  for (const id of ['nodachi', 'naginata', 'kusarigama']) { const w = W.BY[id]; w.mv = KEEP_MV[id].map(([i, n, k, u, cd]) => ({ id: i, n, k, u, cd })); w.MV = {}; for (const m of w.mv) w.MV[m.id] = m; }
  Object.assign(EVP, { nodachi: { normal_1: { d: 1.3, arc: 100 }, normal_2: { d: 1.3, arc: 100 }, normal_3: { d: 1.6, arc: 140, kb: 1 } },
    naginata: { normal_1: { d: 1.5, arc: 120 }, normal_2: { d: 1.5, arc: 120 }, combo_finisher_1: { shape: 'circle', d: 1.3, ring: 1 }, combo_finisher_2: { d: 1.7, arc: 160, kb: 1 } },
    kusarigama: { normal_1: { d: 1.2, arc: 90 }, normal_2: { d: 1.2, arc: 90 }, normal_3: { d: 1.2, arc: 90 }, combo_finisher_1: { shape: 'line', d: 3, chain: 1, slow: 20 }, combo_finisher_2: { shape: 'line', d: 3, chain: 1, drag: 1.5 } } });
  const BF3 = /^fx_tier_(nodachi|naginata|kusarigama)_/; const sp2 = G.spawnFx;
  G.spawnFx = function (name, tier, x, y, face, s) { if (name === 'swordarr') return VF('swordarr', { x, y: y + 14, r: HH() * 2 * s0(), life: 42 }) && null;
    const bp = H.act && BF3.test(name || '') && Math.abs(x - H.x) < HH() * 2 * s0() ? W.bladePt() : null; const f = sp2(name, tier, bp ? bp[0] : x, bp ? bp[1] : y, face, s); if (f && bp) { f.act = H.act; f.fol = 1; } return f; };
  const hand = () => [H.x + H.face * HH() * 0.3 * s0(), H.y - HH() * 0.55 * s0()];
  /* 鎖鏈拖回：敵人沿鎖鏈被拉到身前（逐格移動，不瞬移） */
  const drag = (e, d) => { const tx = H.x + H.face * HH() * (d || 0.6) * s0(); e.drag = { tx, ty: H.y + (e.y - H.y) * 0.4, t: 10 }; VF('chain', { e, life: 14 }); };
  const of1 = W.onFire; W.onFire = function (ev, a, bp) { of1(ev, a, bp); const P = (EVP[W.curId()] || {})[a.name]; if (!P) return; const hs = HH() * s0();
    if (P.ring) VF('ring', { x: H.x, y: H.y, r: hs * P.d, life: 16 });
    if (P.chain) { const L = G.E.filter(e => alive(e) && inFront(e, hs * P.d, hs * 0.3)).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x)), e = L[0];
      VF('chain', { x1: e ? e.x : H.x + H.face * hs * P.d, y1: e ? e.y - hs * 0.5 : H.y - hs * 0.5, life: 12 });
      for (const o of L) { if (P.slow) { o.db = o.db || {}; o.db.slow = Math.max(o.db.slow || 0, P.slow); o.db.slowT = 120; } } if (P.drag && e) drag(e, 0.6); } };
  /* 共用：環身衝擊波、招式後增益、鎖鏈視覺、大型劍陣、颶風視覺 */
  const shockAt = (a, x, y, R, m) => { VF('bell', { x, y, r: R, life: 24 }); SC.shake = 7; for (const e of G.E) if (alive(e) && Math.hypot(e.x - x, (e.y - y) * 1.8) < R + 16) SKB.hitE(e, a, m, { big: true, last: true }); };
  const cu2 = custom; custom = function (a, s, lv, b) { if (b.t !== 'tenchi') return cu2(a, s, lv, b);
    const B = a.B = Object.assign({}, b, lv >= 3 ? b.m3 : {}, lv >= 5 ? b.m5 : {}); a.beh = b.t; a.ev = []; a.noMv = true; a.sched = []; const c = a.c, hs = HH() * s0();
    const t0 = Math.max(6, c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.45)); a.invAll = true;
    a.sched.push({ t: Math.max(2, t0 - 10), f: () => VF('giant', { x: H.x + H.face * hs * 3, y: H.y, h: hs * 3.2, life: 14 }) });
    a.sched.push({ t: t0, f: () => { const x = H.x + H.face * hs * 3, R = hs * 2 * (B.rk || 1); G.spawnFx(b.fx, 0, x, H.y - hs * 0.5, H.face, s0() * 2.6); VF('crack', { x, y: H.y, r: R, life: 40 }); SC.shake = 12; G.hitstop = 8;
      for (const e of G.E) if (alive(e) && Math.hypot(e.x - x, (e.y - H.y) * 1.8) < R + 16) SKB.hitE(e, a, B.m, { big: true, last: true });
      G.ZONES.push({ k: 'field', x, y: H.y, r: R, t: 0, life: B.ft, m: 0.3, a, fx: 'swordarr' }); if (B.critBuf) BF.add('crit', 20, B.ft); } });
    a.T = Math.max(a.T, t0 + 10); return true; };
  const sk3 = SKB.start; SKB.start = function (a, s, lv) { const b = SKB.get(W.curId(), s.id); if (b && b.t === 'tenchi') return custom(a, s, lv, b); return sk3.call(SKB, a, s, lv); };
  const ex3 = extras; extras = function (a, s, lv, b) { ex3(a, s, lv, b); const B = a.B; if (!B) return; const hs = HH() * s0(), lastT = a.sched.length ? a.sched[a.sched.length - 1].t : 0;
    if (B.shock) a.sched.push({ t: Math.max(lastT, a.mv2 ? a.mv2.f1 : 0) + 2, f: () => shockAt(a, H.x, H.y, hs * B.shock, B.m * 0.8) });
    if (B.afterBuf) a.sched.push({ t: a.T - 1, f: () => { for (const k in B.afterBuf) if (k !== 't') BF.add(k, B.afterBuf[k], B.afterBuf.t); G.UI.toast(s.n + '：效果發動'); } });
    if (B.lineFx) wrap2(a, () => VF('slashline', { x0: H.x, y0: chestY(), x1: H.x + H.face * hs * B.lineFx, y1: chestY(), w: 3, life: 12, col: '255,255,255' }));
    if (B.bolt) { const x0 = H.x; a.sched.push({ t: (a.mv2 ? a.mv2.f1 : 12) + 1, f: () => { VF('bolt', { x0, y0: chestY(), x1: H.x, y1: chestY(), life: 14 }); VF('bolt', { x0, y0: chestY() + 6, x1: H.x, y1: chestY() - 4, life: 10 }); } }); }
    if (B.halfMoon) wrap2(a, () => VF('moon', { x: H.x, y: chestY(), r: hs * (B.r || 1.5) * 1.1, face: H.face, life: 16 }));
    if (B.chainFx) wrap2(a, () => { const e = [...(a.hs || [])].filter(alive).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x))[0]; VF('chain', { x1: e ? e.x : H.x + H.face * hs * (B.chainFx || 3), y1: e ? e.y - hs * 0.5 : chestY(), life: 12 }); });
    if (B.chainRing) wrap2(a, () => VF('chainring', { x: H.x, y: H.y, r: hs * (B.r || 1.5), life: 14 }));
    if (B.dragPull) wrap2(a, () => { for (const e of a.hs || []) if (alive(e) && !e.drag && Math.abs(e.x - H.x) > hs * 0.8) drag(e, 0.6); });
    if (B.xChain) wrap2(a, () => { const L = hs * (B.r || 2) * 1.4; VF('chain', { x0: H.x, y0: H.y - hs * 0.9, x1: H.x + H.face * L, y1: H.y, life: 16 }); VF('chain', { x0: H.x, y0: H.y, x1: H.x + H.face * L, y1: H.y - hs * 0.9, life: 16 }); });
    if (B.nextCritAfter) a.sched.push({ t: a.T - 1, f: () => { BF.add('nextCrit', 100, 300); G.UI.toast('下一擊必暴擊'); } });
    if (B.wisps) a.sched.push({ t: a.T - 1, f: () => { for (let k = 0; k < B.wisps; k++) { const an = k * 6.283 / B.wisps; G.PROJ.push({ x: H.x + Math.cos(an) * 24, y: H.y, h: hs * 0.6, vx: Math.cos(an) * 3, vy: Math.sin(an) * 2, left: hs * 8, d0: hs * 8, mult: B.m * 0.8 * (a.mult || 1), raw: B.m * 0.8, a, pierce: 1, hits: [], face: H.face, home: 1, pk: 'wisp', ttl: 150 }); } } }); };
  const zs3 = SKB.step; SKB.step = function () { zs3.call(SKB);
    for (const e of G.E) if (e.drag && alive(e)) { const d = e.drag; e.x += (d.tx - e.x) * 0.3; e.y += (d.ty - e.y) * 0.3; if (--d.t <= 0) e.drag = null; }
    for (const z of G.ZONES) if (z.k === 'storm' && z.t % 5 === 0) VF('tornado', { x: z.x, y: z.y, r: z.r, life: 6 });
    for (const p of G.PROJ) if (p.ttl !== undefined) { const sp = Math.hypot(p.vx, p.vy) || 1; p.vx *= 5 / sp; p.vy *= 5 / sp; if (--p.ttl <= 0) p.left = 0; } };   // 鬼火：固定速度追蹤，2.5 秒後消失
  const ct4 = SKB.counter; SKB.counter = function (e) { const a = H.act, B = a && a.B, ok = ct4.call(SKB, e); if (ok && B && B.kbC) for (const o of G.E) if (alive(o) && Math.hypot(o.x - H.x, (o.y - H.y) * 1.8) < HH() * s0() * 1.4) o.kb = Math.sign(o.x - H.x || 1) * HH() * s0() * B.kbC / 5; return ok; };
  Object.assign(SKB.BEH.nodachi, {
    skill_daisharin: { t: 'spin', n: 4, r: 1.4, m: 0.9, ringFx: 1, fx: 'fx_tier_nodachi_basic', m3: { n: 2 }, m5: { shock: 2.4 } },
    skill_getsurin: { t: 'wave', n: 1, d: 7, m: 1.6, pierce: 1, fx: 'skill_wind_blade_a', m3: { n: 1 }, m5: { ret: 1 } },
    skill_haousan: { t: 'leap', d: 1.5, r: 1.0, m: 2.4, charge: 30, fx: 'weapon_blunt_b', crack: 1, quakeFx: 1, qx: 0, m3: { armor: 1 }, m5: { armor: 1, dot: { t: 120, m: 0.3, fx: 'skill_fire_ground_a' } } },
    skill_zantetsu: { t: 'multi', n: 1, m: 2.6, r: 1.4, ignoreDef: 50, lineFx: 2, fx: 'fx_tier_nodachi_basic', m3: { ignoreDef: 80 }, m5: { ignoreDef: 80, boss: 50 } },
    special_backline: { t: 'turn', m: 1.6, r: 1.3, fx: 'fx_tier_nodachi_basic', m3: { afterBuf: { dr: 20, t: 120 } }, m5: { afterBuf: { dr: 20, t: 120 }, stun: 60 } },
    special_break: { t: 'multi', n: 1, m: 1.8, r: 1.3, defdown: 20, shards: 1, fx: 'fx_tier_nodachi_basic', m3: { defdown: 30 }, m5: { defdown: 30, debuffT: 2 } },
    special_drawline: { t: 'trap', d: 3, m: 1.6, delay: 30, fx: 'skill_wind_blade_b', m3: { dist: 1.5 }, m5: { twice: 1 } },
    special_leave: { t: 'back', d: 1.5, m: 1.4, fx: 'fx_tier_nodachi_basic', m3: { dist: 1.5 }, m5: { shock: 1.2 } },
    ultimate_tenchi: { t: 'tenchi', m: 2.6, ft: 180, fx: 'hero_nodachi_ultimate_fx', m3: { rk: 1.3 }, m5: { rk: 1.3, ft: 300, critBuf: 1 } },
    advancing_weight: { t: 'dash', d: 1.5, m: 1.5, fx: 'fx_tier_nodachi_basic', trail: 1, m3: { dist: 1.3 }, m5: { armorAct: 1 } },
    long_line: { t: 'multi', n: 1, m: 1.4, r: 2.86, line: 1, lineFx: 4, fx: 'fx_tier_nodachi_basic', m3: { r: 1.3, lineFx: 5.2 }, m5: { r: 1.3, lineFx: 5.2, dot: { t: 60, m: 0.3, fx: 'skill_wind_blade_b' } } },
    planted_break: { t: 'multi', n: 1, m: 1.4, r: 1.3, defdown: 10, shards: 1, fx: 'fx_tier_nodachi_basic', m3: { defdown: 15 }, m5: { defdown: 15, stun: 48 } },
    opening_brace: { t: 'stance', dur: 36, m: 1.6, cr: 1.4, spark: 1, fx: 'feedback_guard_a', m3: { dur: 18 }, m5: { crit: 1 } } });
  Object.assign(SKB.BEH.naginata, {
    skill_arashi: { t: 'frenzy', n: 10, dur: 120, r: 1.5, m: 0.45, ringFx: 1, fx: 'skill_wind_vortex_a', m3: { dur: 60, n: 5 }, m5: { dot: { t: 120, m: 0.25, fx: 'skill_wind_vortex_b' } } },
    skill_chidori: { t: 'dash', d: 3, m: 1.6, bolt: 1, fx: 'skill_lightning_strike_a', m3: { twice: 1 }, m5: { twice: 1, dot: { t: 120, m: 0.3, fx: 'skill_lightning_strike_b' } } },
    skill_enbu: { t: 'multi', n: 5, m: 0.6, r: 1.4, alt: 1, fx: 'fx_tier_naginata_basic', m3: { n: 2 }, m5: { qiHit: 1 } },
    skill_senpu: { t: 'sweep', m: 1.4, r: 1.54, halfMoon: 1, fx: 'skill_wind_vortex_a', m3: { r: 1.3 }, m5: { r: 1.3, pull: 1 } },
    special_current: { t: 'side', d: 1.2, m: 1.2, r: 1.2, ringFx: 1, fx: 'fx_tier_naginata_basic', m3: { dist: 1.5 }, m5: { dist: 1.5, inv: 1 } },
    special_double: { t: 'cross', n: 2, m: 1, r: 1.2, fx: 'weapon_cut_b', m3: { n: 1 }, m5: { burst: 1 } },
    special_openpath: { t: 'sweep', m: 1.1, r: 1.38, knock: 2.7, halfMoon: 1, fx: 'skill_wind_blade_a', m3: { knock: 1.5 }, m5: { knock: 1.5, afterBuf: { spd: 30, t: 180 } } },
    special_upright: { t: 'stance', dur: 120, m: 1.3, lightWall: 1, fx: 'feedback_guard_a', m3: { dur: 60 }, m5: { reflect: 1 } },
    ultimate_daikufu: { t: 'storm', dur: 240, r: 1.8, m: 0.7, fx: 'hero_naginata_ultimate_fx', fx2: 'skill_wind_vortex_b', m3: { followHero: 0, follow: 1 }, m5: { follow: 1, burst: 1 } },
    gliding_wing: { t: 'dash', d: 1.5, m: 1.3, trail: 1, fx: 'fx_tier_naginata_basic', m3: { dist: 1.3 }, m5: { dist: 1.3, inv: 1 } },
    wide_leaf: { t: 'sweep', m: 1.2, r: 1.38, halfMoon: 1, fx: 'fx_tier_naginata_basic', m3: { r: 1.3 }, m5: { r: 1.3, twice: 1 } },
    low_leaf: { t: 'multi', n: 1, m: 1.1, r: 1.5, slow: 1, fx: 'fx_tier_naginata_basic', m3: {}, m5: { stun: 30 } },
    wing_brace: { t: 'stance', dur: 36, m: 1.4, ringC: 1.2, fx: 'feedback_guard_a', m3: { dur: 18 }, m5: { kbC: 1.5 } } });
  Object.assign(SKB.BEH.kusarigama, {
    skill_kamaitachi: { t: 'wave', n: 1, d: 6, m: 1.2, fx: 'skill_wind_blade_a', m3: { n: 2 }, m5: { dot: { t: 120, m: 0.25, fx: 'skill_wind_vortex_a' } } },
    skill_kusabiki: { t: 'pull', r: 4, m: 1.3, one: 1, chainFx: 4, fx: 'weapon_claw_a', m3: { two: 1 }, m5: { two: 1, nextCritAfter: 1 } },
    skill_sabaku: { t: 'dash', d: 1.5, m: 1.3, trail: 1, fx: 'weapon_cut_a', m3: { inv: 1 }, m5: { inv: 1, echo: 1 } },
    skill_sensa: { t: 'frenzy', n: 8, dur: 90, r: 1.8, m: 0.5, chainRing: 1, fx: 'weapon_claw_b', m3: { r: 1.3 }, m5: { r: 1.3, stun: 60 } },
    special_cross: { t: 'cross', n: 2, m: 1, r: 2.1, xChain: 1, fx: 'weapon_claw_a', m3: { r: 1.5 }, m5: { r: 1.5, stun: 60 } },
    special_escape: { t: 'back', d: 2, m: 0.8, chainFx: 1, fx: 'weapon_claw_b', m3: { dist: 1.5 }, m5: { dist: 1.5, nextUp: 50 } },
    special_pullcut: { t: 'pull', r: 3, m: 1.4, chainFx: 3, fx: 'weapon_cut_b', m3: { m: 1.3 }, m5: { m: 1.3, twice: 1 } },
    special_return: { t: 'throw', n: 1, d: 3, m: 1, ret: 1, fx: 'projectile_knife_a', m3: { m: 1.3 }, m5: { m: 1.3, slow: 1 } },
    ultimate_hyakki: { t: 'frenzy', n: 12, r: 2.5, m: 0.8, dur: 240, chainRing: 1, fx: 'hero_kusarigama_ultimate_fx', fx2: 'skill_dark_strike_a', m3: { dur: 120, n: 6 }, m5: { wisps: 5 } },
    chain_probe: { t: 'multi', n: 1, m: 1.2, r: 2.86, line: 1, chainFx: 4, fx: 'fx_tier_kusarigama_basic', m3: { r: 1.3, chainFx: 5.2 }, m5: { r: 1.3, chainFx: 5.2, slow: 1 } },
    chain_arc: { t: 'nova', r: 1.5, m: 1.1, chainRing: 1, fx: 'fx_tier_kusarigama_basic', m3: { r: 1.3 }, m5: { r: 1.3, twice: 1 } },
    low_reap: { t: 'multi', n: 1, m: 1.1, r: 1.3, slow: 1, fx: 'fx_tier_kusarigama_basic', m3: {}, m5: { stun: 30 } },
    retreat_tether: { t: 'seal', net: 1, m3: { root: 0 }, m5: { root: 60 } } });
  // 返鏈截進：投出的鎌刀與手之間畫鎖鏈
  const pj1 = SKB.proj; SKB.proj = function (a, o) { pj1.call(SKB, a, o); if (W.curId() === 'kusarigama') { const p = G.PROJ[G.PROJ.length - 1]; if (p) VF('chain', { p, life: 90 }); } };
  Object.assign(G.FXV, {
    chain(f, a, c) { const h = hand(), x0 = f.x0 !== undefined ? f.x0 : h[0], y0 = f.y0 !== undefined ? f.y0 : h[1]; let x1 = f.x1, y1 = f.y1;
      if (f.e) { if (!alive(f.e)) return; x1 = f.e.x; y1 = f.e.y - HH() * SC.depth(f.e.y) * 0.5; } if (f.p) { if (!G.PROJ.includes(f.p)) { f.t = f.life; return; } x1 = f.p.x; y1 = f.p.y - f.p.h; }
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / 7)); c.save(); c.strokeStyle = 'rgba(70,70,78,' + Math.min(1, a * 2) + ')'; c.lineWidth = 1.6;
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * 3.14) * Math.min(10, L * 0.04); c.beginPath(); c.ellipse(x, y, 3, 1.8, Math.atan2(y1 - y0, x1 - x0) + (i % 2) * 1.2, 0, 6.283); c.stroke(); }
      c.fillStyle = '#9aa0a8'; c.beginPath(); c.arc(x1, y1, 3, 0, 6.283); c.fill(); c.restore(); },
    chainring(f, a, c) { const n = Math.max(26, Math.round(f.r / 4)), rot = f.t * 0.35; c.save(); c.strokeStyle = 'rgba(55,55,62,' + Math.min(1, a * 1.5) + ')'; c.lineWidth = 2.2; for (let i = 0; i < n; i++) { const an = rot + i * 6.283 / n, x = f.x + Math.cos(an) * f.r, y = f.y - HH() * s0() * 0.35 + Math.sin(an) * f.r * 0.4;
      c.beginPath(); c.ellipse(x, y, 3, 1.8, an + (i % 2) * 1.2, 0, 6.283); c.stroke(); } c.restore(); },
    giant(f, a, c) { const k = Math.min(1, f.t / f.life), y1 = f.y - f.h * (1 - k), w = f.h * 0.08; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(f.x, y1 - f.h, f.x, y1); g.addColorStop(0, 'rgba(200,230,255,0)'); g.addColorStop(1, 'rgba(240,250,255,.9)');
      c.fillStyle = g; c.beginPath(); c.moveTo(f.x - w, y1 - f.h); c.lineTo(f.x + w, y1 - f.h); c.lineTo(f.x, y1); c.fill(); c.restore(); },
    swordarr(f, a, c) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(190,225,255,' + a * 0.6 + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, f.r, f.r * 0.42, 0, 0, 6.283); c.stroke();
      for (let i = 0; i < 8; i++) { const an = i * 0.785 + (G.t || 0) * 0.01, x = f.x + Math.cos(an) * f.r * 0.85, y = f.y + Math.sin(an) * f.r * 0.36, h = HH() * s0() * 0.5; c.strokeStyle = 'rgba(230,245,255,' + a * 0.8 + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke(); } c.restore(); },
    tornado(f, a, c) { c.save(); c.strokeStyle = 'rgba(230,245,240,.45)'; c.lineWidth = 2; const hgt = HH() * SC.depth(f.y) * 2.2, tt = G.t || 0; for (let i = 0; i < 9; i++) { const u = i / 8, rr = f.r * (0.25 + 0.75 * u), y = f.y - hgt * u, an = tt * 0.3 + i;
      c.beginPath(); c.ellipse(f.x + Math.sin(tt * 0.05 + u * 3) * 6, y, rr, rr * 0.3, 0, an % 6.283, an % 6.283 + 4); c.stroke(); } c.restore(); } });
  const fp2 = G.FXV.proj; G.FXV.proj = function (p, c) { if (p.pk !== 'wisp') return fp2(p, c); const y = p.y - p.h, r = HH() * SC.depth(p.y) * 0.1; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p.x, y, 0, p.x, y, r * 2); g.addColorStop(0, 'rgba(200,240,255,1)'); g.addColorStop(0.5, 'rgba(110,170,255,.7)'); g.addColorStop(1, 'rgba(80,120,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.x, y, r * 2, 0, 6.283); c.fill(); c.restore(); };
})();
