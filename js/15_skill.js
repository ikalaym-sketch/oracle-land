/* ==========================================================================
 * 神諭之地 重製版 — 15_skill.js
 * Version : r3.99.0  (2026-11-26)　r3.99.0：技能 Lv10「極」：範圍 +20%、多 1 段
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：對頭目／對妖怪加成改增傷區（G.DZ）
 * 舊版    : r3.12.0  (2026-11-14)
 * 變更    : r3.12.0 殘影尺寸套用每招尺寸校正（G.WPN.actK）。
 * 變更    : r3.1.0 新增。技／特技／奧義「行為引擎」：每招依說明指定行為（不再全部套同一種判定）。
 * 說明    : 行為表 BEH[武器][招]＝{t 型別, m 每擊倍率, n 次數, r 半徑(H), d 距離(H), dur 持續(格), fx 特效, m3 進化, m5 極意}
 *           型別：突進 dash/charge/side、連斬 multi/cross/turn/launch、範圍 spin/nova/sweep/quake/frenzy、
 *                 遠程 wave/shot/throw/shard/bomb/barrage、落下 rain/storm、設置 trap/zone/orbit、
 *                 位移 back/leap、瞬移 blink、拉近 pull、地裂 line、架勢 stance（被打才反擊）、增益 buff/qi/heal/mark。
 *           進化（Lv3–4）＝m3、極意（Lv5）＝m3＋m5；數值鍵（dist r m knock）相乘、次數鍵（n dur）相加、其他覆寫。
 *           時機：以動作合約第 1 個命中格為起點；多段平均分布到動作 85% 處。依賴 03_actors（G.damageOni / G.spawnFx / G.tryMove）。
 * ========================================================================== */
'use strict';
(function () {
  const BEH = {"katana":{"iai":{"t":"dash","d":3,"m":2.0,"fx":"hero_katana_iai_fx_a","m3":{"dist":1.5,"pierce":1},"m5":{"burst":1}},"issen":{"t":"dash","d":2.2,"m":2.4,"charge":12,"fx":"hero_katana_iai_fx_b","m3":{"resetDodge":1},"m5":{"crit":1}},"sakura":{"t":"spin","n":4,"r":1.6,"m":0.7,"fx":"hero_katana_sakura_fx_a","fx2":"hero_katana_sakura_fall","m3":{"dot":{"t":180,"m":0.25}},"m5":{"home":1}},"tsubame":{"t":"multi","n":2,"m":1.1,"r":1.4,"fx":"fx_tier_katana_basic","m3":{"n":1},"m5":{"wave":1}},"special_breath":{"t":"qi","v":30,"fx":"skill_light_glyph_a","m3":{"qiX":1.5},"m5":{"buff":{"aspd":15,"t":300}}},"special_home":{"t":"stance","dur":60,"m":2.2,"fx":"feedback_guard_a","m3":{"dur":30},"m5":{"crit":1}},"special_return":{"t":"back","d":1.2,"m":1.4,"fx":"fx_tier_katana_basic","m3":{"dist":1.5},"m5":{"burst":1}},"special_tide":{"t":"multi","n":3,"m":0.8,"r":1.6,"adv":0.6,"fx":"skill_water_break_a","m3":{"knock":1.5},"m5":{"pull":1}},"sakuramai":{"t":"blink","n":6,"m":1.1,"fx":"hero_katana_sakura_fx_b","fx2":"hero_katana_sakura_fall","m3":{"n":3},"m5":{"rain":{"t":180,"m":2.0,"fx":"hero_katana_sakura_fall"}}}},"nodachi":{"skill_daisharin":{"t":"spin","n":3,"r":1.8,"m":0.9,"fx":"fx_tier_nodachi_basic","m3":{"n":1},"m5":{"wave":1,"ring":1}},"skill_getsurin":{"t":"wave","n":1,"d":5,"m":1.6,"fx":"skill_wind_blade_a","m3":{"n":1},"m5":{"pierce":1,"ret":1}},"skill_haousan":{"t":"leap","d":0.6,"r":1.6,"m":2.4,"charge":18,"fx":"weapon_blunt_b","m3":{"armor":1},"m5":{"dot":{"t":120,"m":0.3,"fx":"skill_fire_ground_a"}}},"skill_zantetsu":{"t":"multi","n":1,"m":2.6,"r":1.8,"ignoreDef":50,"fx":"fx_tier_nodachi_basic","m3":{"ignoreDef":80},"m5":{"boss":50}},"special_backline":{"t":"turn","m":1.6,"r":1.6,"fx":"fx_tier_nodachi_basic","m3":{"buff":{"dr":20,"t":120}},"m5":{"stun":60}},"special_break":{"t":"multi","n":1,"m":1.8,"r":1.6,"defdown":20,"fx":"weapon_blunt_a","m3":{"defdown":30},"m5":{"debuffT":2}},"special_drawline":{"t":"trap","d":3,"m":1.6,"delay":40,"fx":"skill_wind_blade_b","m3":{"dist":1.5},"m5":{"twice":1}},"special_leave":{"t":"back","d":1.5,"m":1.4,"fx":"fx_tier_nodachi_basic","m3":{"dist":1.5},"m5":{"ring":1}},"ultimate_tenchi":{"t":"rain","n":8,"r":3.5,"m":1.4,"fx":"hero_nodachi_ultimate_fx","fx2":"skill_light_pillar_a","m3":{"r":1.3},"m5":{"field":{"t":300,"m":0.3,"buff":{"crit":20,"t":300}}}}},"kanabo":{"skill_ganseki":{"t":"shard","n":5,"m":0.9,"d":2.5,"fx":"projectile_stone_a","m3":{"n":2},"m5":{"stun":50}},"skill_jiretsu":{"t":"line","d":4,"m":1.5,"fx":"weapon_blunt_b","m3":{"dist":1.5},"m5":{"side":1}},"skill_meido":{"t":"pull","r":2.5,"m":2.2,"fx":"skill_dark_core_a","m3":{"r":1.3},"m5":{"dot":{"t":180,"m":0.3,"fx":"skill_dark_strike_a"}}},"skill_onikudaki":{"t":"multi","n":3,"m":1.0,"r":1.4,"last":1.5,"fx":"weapon_blunt_a","m3":{"last":1.5},"m5":{"down":1}},"special_bell":{"t":"nova","r":2.0,"m":0.8,"stun":60,"fx":"skill_light_glyph_b","m3":{"stun":90},"m5":{"vuln":20}},"special_quake":{"t":"nova","r":1.6,"m":1.3,"fx":"weapon_blunt_b","m3":{"r":1.3},"m5":{"twice":1}},"special_rebound":{"t":"stance","dur":50,"m":1.6,"fx":"feedback_guard_b","m3":{"qi":10},"m5":{"reflect":1}},"special_retreat":{"t":"back","d":1.3,"m":1.3,"fx":"weapon_blunt_a","m3":{"inv":1},"m5":{"wall":1}},"ultimate_kishin":{"t":"frenzy","n":6,"r":1.8,"m":1.3,"dur":150,"fx":"hero_kanabo_ultimate_fx","m3":{"dur":120},"m5":{"armor":1,"ls":10}}},"ono":{"skill_daichiwari":{"t":"leap","d":1.5,"r":1.6,"m":2.2,"fx":"weapon_blunt_b","m3":{"r":1.3},"m5":{"dot":{"t":180,"m":0.3,"fx":"skill_fire_ground_a"}}},"skill_kabutowari":{"t":"multi","n":1,"m":2.2,"r":1.5,"defdown":25,"fx":"weapon_cut_b","m3":{"defdown":35},"m5":{"critBroken":1}},"skill_onosenpu":{"t":"spin","n":5,"r":1.5,"m":0.6,"move":1,"fx":"fx_tier_ono_basic","m3":{"move":2},"m5":{"gather":1}},"skill_senpuono":{"t":"throw","n":1,"d":4,"m":1.3,"fx":"hero_ono_projectile_flight","m3":{"n":1},"m5":{"ret":1}},"special_drop":{"t":"leap","d":0.8,"r":1.3,"m":1.8,"fx":"weapon_blunt_a","m3":{"r":1.3},"m5":{"stun":50}},"special_pursuit":{"t":"dash","d":2.5,"m":1.4,"fx":"fx_tier_ono_basic","m3":{"dist":1.5},"m5":{"dot":{"t":120,"m":0.25,"fx":"weapon_claw_b"}}},"special_reverse":{"t":"launch","m":1.6,"r":1.4,"fx":"weapon_cut_a","m3":{"m":1.2},"m5":{"vuln":30}},"special_wedge":{"t":"trap","d":1.5,"m":1.0,"delay":10,"root":60,"fx":"skill_dark_core_b","m3":{"root":90},"m5":{"burst":1}},"ultimate_yamakuzushi":{"t":"quake","n":3,"r":1.6,"m":2.0,"fx":"hero_ono_ultimate_fx","m3":{"grow":1},"m5":{"screen":1}}},"naginata":{"skill_arashi":{"t":"spin","n":5,"r":1.6,"m":0.6,"fx":"skill_wind_vortex_a","m3":{"n":2},"m5":{"dot":{"t":120,"m":0.25,"fx":"skill_wind_vortex_b"}}},"skill_chidori":{"t":"dash","d":3,"m":1.6,"fx":"skill_lightning_strike_a","m3":{"twice":1},"m5":{"dot":{"t":120,"m":0.3,"fx":"skill_lightning_strike_b"}}},"skill_enbu":{"t":"multi","n":4,"m":0.7,"r":1.6,"fx":"fx_tier_naginata_basic","m3":{"n":2},"m5":{"qiHit":1}},"skill_senpu":{"t":"sweep","m":1.4,"r":2.4,"fx":"skill_wind_vortex_a","m3":{"r":1.3},"m5":{"pull":1}},"special_current":{"t":"side","d":1.5,"m":1.2,"r":1.6,"fx":"fx_tier_naginata_basic","m3":{"dist":1.5},"m5":{"inv":1}},"special_double":{"t":"cross","n":2,"m":1.0,"r":1.6,"fx":"weapon_cut_b","m3":{"n":1},"m5":{"burst":1}},"special_openpath":{"t":"sweep","m":1.1,"r":2.0,"knock":2,"fx":"skill_wind_blade_a","m3":{"knock":1.5},"m5":{"buff":{"spd":30,"t":180}}},"special_upright":{"t":"stance","dur":70,"m":1.3,"fx":"feedback_guard_a","m3":{"dur":60},"m5":{"reflect":1}},"ultimate_daikufu":{"t":"storm","dur":240,"r":1.8,"m":0.7,"fx":"hero_naginata_ultimate_fx","fx2":"skill_wind_vortex_b","m3":{"follow":1},"m5":{"burst":1}}},"yari":{"skill_ryusei":{"t":"leap","d":2,"r":1.3,"m":2.0,"fx":"skill_light_beam_a","m3":{"r":1.3},"m5":{"dot":{"t":150,"m":0.3,"fx":"skill_light_glyph_a"}}},"skill_senso":{"t":"multi","n":6,"m":0.45,"r":2.2,"line":1,"fx":"weapon_thrust_a","m3":{"n":4},"m5":{"pierce":1}},"skill_shoryu":{"t":"launch","m":1.8,"r":1.5,"fx":"weapon_thrust_b","m3":{"m":1.2},"m5":{"wave":1,"fx5":"skill_light_pillar_a"}},"skill_sorin":{"t":"line","d":3.5,"m":1.2,"spikes":1,"fx":"weapon_thrust_b","m3":{"rows":2},"m5":{"dot":{"t":120,"m":0.3,"fx":"weapon_thrust_a"}}},"special_backpierce":{"t":"turn","m":1.6,"r":2.0,"line":1,"fx":"weapon_thrust_a","m3":{"m":1.3},"m5":{"crit":1}},"special_deny":{"t":"stance","dur":60,"m":1.5,"fx":"feedback_guard_b","m3":{"dur":60},"m5":{"m":1.5}},"special_lane":{"t":"dash","d":3,"m":1.2,"fx":"weapon_thrust_a","m3":{"dist":1.5},"m5":{"slow":1}},"special_return":{"t":"nova","r":1.8,"m":1.2,"fx":"fx_tier_yari_basic","m3":{"r":1.3},"m5":{"qi":10}},"ultimate_ryuga":{"t":"charge","d":8,"m":2.4,"fx":"hero_yari_ultimate_fx","m3":{"back":1},"m5":{"markBurst":1}}},"kusarigama":{"skill_kamaitachi":{"t":"wave","n":1,"d":4,"m":1.2,"fx":"skill_wind_blade_a","m3":{"n":2},"m5":{"dot":{"t":120,"m":0.25,"fx":"skill_wind_vortex_a"}}},"skill_kusabiki":{"t":"pull","r":3.5,"m":1.3,"one":1,"fx":"weapon_claw_a","m3":{"two":1},"m5":{"crit":1}},"skill_sabaku":{"t":"dash","d":1.8,"m":1.3,"inv":1,"fx":"weapon_cut_a","m3":{"inv":1},"m5":{"echo":1}},"skill_sensa":{"t":"spin","n":4,"r":1.8,"m":0.6,"fx":"weapon_claw_b","m3":{"r":1.3},"m5":{"stun":60}},"special_cross":{"t":"cross","n":2,"m":1.0,"r":2.0,"fx":"weapon_claw_a","m3":{"dist":1.5},"m5":{"stun":60}},"special_escape":{"t":"back","d":2.0,"m":0.8,"fx":"weapon_claw_b","m3":{"dist":1.5},"m5":{"nextUp":50}},"special_pullcut":{"t":"pull","r":3.0,"m":1.4,"fx":"weapon_cut_b","m3":{"m":1.3},"m5":{"twice":1}},"special_return":{"t":"throw","n":1,"d":3,"m":1.0,"fx":"projectile_knife_a","m3":{"m":1.3},"m5":{"slow":1,"ret":1}},"ultimate_hyakki":{"t":"frenzy","n":8,"r":2.6,"m":0.9,"dur":150,"fx":"hero_kusarigama_ultimate_fx","fx2":"skill_dark_strike_a","m3":{"dur":120},"m5":{"field":{"t":180,"m":0.3}}}},"staff":{"skill_haja":{"t":"shot","n":1,"m":1.4,"d":5,"img":"skill_light_beam_a","m3":{"n":2},"m5":{"yokai":50}},"skill_kekkai":{"t":"zone","r":2.2,"dur":300,"dr":30,"fx":"skill_light_glyph_a","m3":{"r":1.3},"m5":{"slow":1}},"skill_shinrai":{"t":"rain","n":3,"r":2.5,"m":1.4,"fx":"skill_lightning_strike_a","m3":{"n":2},"m5":{"chain":1}},"skill_yuko":{"t":"orbit","n":2,"r":1.3,"m":0.5,"dur":300,"fx":"skill_light_glyph_b","m3":{"n":2},"m5":{"healHit":1}},"special_reflect":{"t":"stance","dur":60,"m":1.2,"fx":"skill_light_glyph_a","m3":{"dur":60},"m5":{"m":2}},"special_resonance":{"t":"buff","buff":{"atk":15,"t":480},"fx":"skill_light_pillar_b","m3":{"atkX":25},"m5":{"buffCdr":20}},"special_sealretreat":{"t":"trap","d":1.5,"m":1.0,"delay":5,"root":0,"back":1.5,"fx":"skill_light_glyph_b","m3":{"root":60},"m5":{"burst":1}},"special_support":{"t":"heal","v":10,"fx":"skill_water_column_a","m3":{"v":15},"m5":{"buff":{"dr":15,"t":300}}},"ultimate_nichirin":{"t":"rain","n":10,"r":4,"m":1.2,"dur":200,"fx":"hero_staff_ultimate_fx","fx2":"skill_light_pillar_a","m3":{"dur":120},"m5":{"healFull":1}}},"yumi":{"skill_bakuretsu":{"t":"bomb","n":1,"m":1.8,"r":1.2,"d":5,"img":"projectile_arrow_a","fx":"skill_fire_ball_a","m3":{"r":1.3},"m5":{"split":1}},"skill_sanrenya":{"t":"shot","n":3,"m":0.8,"d":6,"img":"projectile_arrow_a","seq":6,"m3":{"n":2},"m5":{"pierceLast":1}},"skill_tenkyu":{"t":"rain","n":8,"r":2.2,"m":0.6,"dur":120,"far":3,"fx":"projectile_arrow_b","m3":{"dur":60},"m5":{"followHero":1}},"skill_tsuikon":{"t":"shot","n":1,"m":1.6,"d":7,"img":"projectile_arrow_b","home":1,"m3":{"n":1},"m5":{"mark":20}},"special_backshot":{"t":"back","d":1.5,"m":1.2,"shoot":1,"img":"projectile_arrow_a","m3":{"dist":1.5},"m5":{"inv":1}},"special_fan":{"t":"shot","n":5,"m":0.7,"d":5,"spread":0.5,"img":"projectile_arrow_a","m3":{"n":2},"m5":{"knock":1.5}},"special_marked":{"t":"mark","mark":15,"dur":300,"d":6,"fx":"skill_light_glyph_b","m3":{"mark":25},"m5":{"transfer":1}},"special_tracking":{"t":"buff","buff":{"home":3,"t":600},"fx":"skill_light_glyph_a","m3":{"homeN":5},"m5":{"homeCrit":1}},"ultimate_tenkyu":{"t":"rain","n":16,"r":4,"m":0.8,"dur":150,"fx":"hero_yumi_ultimate_fx","fx2":"projectile_arrow_b","m3":{"n":8},"m5":{"pillar":1}}},"teppo":{"skill_horoku":{"t":"bomb","n":1,"m":2.0,"r":1.4,"d":4,"img":"skill_fire_ball_a","fx":"skill_fire_rim_a","lob":1,"m3":{"n":1},"m5":{"dot":{"t":180,"m":0.3,"fx":"skill_fire_ground_a"}}},"skill_rensha":{"t":"shot","n":3,"m":0.9,"d":8,"img":"projectile_bullet_a","seq":8,"m3":{"n":2},"m5":{"downLast":1}},"skill_sandan":{"t":"shot","n":3,"m":1.0,"d":7,"img":"projectile_bullet_a","seq":14,"m3":{"fast":1},"m5":{"scatterLast":1}},"skill_sogeki":{"t":"shot","n":1,"m":3.4,"d":10,"img":"projectile_bullet_b","charge":24,"ignoreDef":0,"m3":{"ignoreDef":50},"m5":{"crit":1,"pierce":1}},"special_guardshot":{"t":"stance","dur":50,"m":1.6,"shot":1,"fx":"feedback_guard_b","m3":{"qi":10},"m5":{"m":2}},"special_precision":{"t":"buff","buff":{"nextCrit":50,"t":600},"fx":"skill_light_glyph_a","m3":{"nextCrit":80},"m5":{"critD":50}},"special_reloadshot":{"t":"shot","n":2,"m":0.8,"d":6,"img":"projectile_bullet_a","seq":10,"m3":{"n":1},"m5":{"buff":{"freeShots":3,"t":600}}},"special_scatterback":{"t":"back","d":1.2,"m":0.6,"shoot":5,"spread":0.6,"img":"projectile_bullet_a","m3":{"n":2},"m5":{"inv":1}},"ultimate_hyakuren":{"t":"barrage","n":20,"m":0.4,"d":8,"dur":110,"img":"projectile_bullet_a","fx":"hero_teppo_ultimate_fx","m3":{"dur":120},"m5":{"bigLast":1}}}};
  const H = G.H, SC = G.SC, HH = () => G.HERO_H, TK = 1000 / 60;
  const MUL = ['dist', 'r', 'm', 'knock', 'qiX', 'grow'], ADD = ['n', 'dur'];
  function merge(b, lv) { const o = Object.assign({}, b); const ap = M => { if (!M) return; for (const k in M) { if (MUL.includes(k) && k !== 'm' && k !== 'r') o[k] = (o[k] || 1) * M[k];
        else if (k === 'r') o.r = (o.r || 1.5) * M.r; else if (k === 'm') o.m = (o.m || 1) * M.m; else if (ADD.includes(k)) o[k] = (o[k] || 0) + M[k]; else o[k] = M[k]; } };
    if (lv >= 3) ap(b.m3); if (lv >= 5) ap(b.m5); if (lv >= 10) { o.r = (o.r || 1.5) * 1.2; if (o.n) o.n += 1; }   // r3.99.0：Lv10 極：範圍 +20%、多 1 段
    o.dist = (o.d || 0) * (o.dist || 1); return o; }
  /* ---------- 增益與敵人狀態 ---------- */
  const BUF = G.BUFF = { v: {}, t: {},
    add(k, v, t) { BUF.v[k] = Math.max(BUF.v[k] || 0, v); BUF.t[k] = Math.max(BUF.t[k] || 0, t); },
    get: k => BUF.t[k] > 0 ? BUF.v[k] || 0 : 0,
    step() { for (const k in BUF.t) if (BUF.t[k] > 0 && --BUF.t[k] <= 0) BUF.v[k] = 0; },
    clear() { BUF.v = {}; BUF.t = {}; } };
  function deb(e, k, v, t) { e.db = e.db || {}; e.db[k] = Math.max(e.db[k] || 0, v); e.db[k + 'T'] = Math.max(e.db[k + 'T'] || 0, t); }
  G.enemyDebStep = e => { if (!e.db) return; for (const k in e.db) if (k.endsWith('T') && e.db[k] > 0 && --e.db[k] <= 0) e.db[k.slice(0, -1)] = 0; };
  /* 傷害包裝：倍率×技能倍率，處理暴擊／暈眩／擊退／降防／無視防禦／易傷 */
  function hit(e, a, mult, o) { o = o || {}; const B = a.B || {};
    if (B.boss && (e.boss || e.bb)) G.DZ.add(B.boss / 100); if (B.yokai) G.DZ.add(B.yokai / 100);   // r3.94.0：增傷區
    G.damageOni(e, mult * (a.mult || 1), !!o.big, o.crit || B.crit && o.last || B.critBroken && e.db && e.db.def > 0, { ign: B.ignoreDef || 0 });
    if (B.defdown) deb(e, 'def', B.defdown, 300 * (B.debuffT || 1)); if (B.vuln && o.last) deb(e, 'vuln', B.vuln, 240); if (B.mark && o.last) deb(e, 'mark', B.mark, 300);
    const st = o.stun || (o.last && B.stun) || (B.down && o.last ? 70 : 0); if (st) e.stun = Math.max(e.stun || 0, st);
    if (B.root && o.root) e.stun = Math.max(e.stun || 0, B.root);
    if (B.slow) deb(e, 'slow', 50, 180);
    if (o.kb !== undefined) e.kb = o.kb; else if (B.knock) e.kb = H.face * 7 * B.knock;
    if (B.qiHit) G.RPG.d().qi = Math.min(100, G.RPG.d().qi + 1);
    if (B.healHit) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.01);
    G.SKB.fxHit(e); }
  const alive = e => e.st !== 'dead' && e.delay <= 0;
  const s0 = () => SC.depth(H.y);
  /* 幾何判定 */
  function inFront(e, reach, half) { const dx = (e.x - H.x) * H.face, dy = Math.abs(e.y - H.y); return dx > -14 && dx < reach + 20 && dy < half; }
  function inCircle(e, x, y, r) { return Math.hypot(e.x - x, (e.y - y) * 1.8) < r + 16; }
  function each(f) { for (const e of G.E) if (alive(e)) f(e); }
  function fx(name, x, y, k) { G.spawnFx(name, 0, x, y, H.face, s0() * (k || 1.8)); }
  const chest = () => H.y - HH() * 0.52 * s0(), front = k => H.x + H.face * HH() * (k || 0.45) * s0();
  function shake(big) { G.hitstop = big ? 6 : 3; SC.shake = big ? 7 : 3; }

  const SKB = G.SKB = { BEH, hitE: (e, a, m, o) => hit(e, a, m, o),
    get(wid, sid) { return (BEH[wid] || {})[sid]; },
    fxHit(e) { const wp = G.WPN.cur(), s = SC.depth(e.y); G.spawnFx({ cut: 'weapon_cut_a', thrust: 'weapon_thrust_a', blunt: 'weapon_blunt_a' }[wp.hitfx], 0, e.x - H.face * 6, e.y - HH() * 0.5 * e.ratio * s, H.face, s * 1.4); },
    /* 出招：建立時間表 */
    start(a, s, lv) { const b = SKB.get(G.WPN.curId(), s.id); if (!b) return false; const B = a.B = merge(b, lv); a.beh = B.t; a.ev = []; a.noMv = true; a.sched = [];
      const c = a.c, first = c && c.ev && c.ev.length ? c.ev[0].at : Math.round(a.T * 0.35), t0 = Math.max(2, first + (B.charge || 0)), t1 = Math.max(t0 + 1, Math.round(a.T * 0.85));
      if (B.charge) { a.T += B.charge; fx('skill_light_glyph_a', H.x, chest(), 1.4); }
      const at = (i, n) => n <= 1 ? t0 : Math.round(t0 + (t1 - t0) * i / (n - 1)), push = (t, f) => a.sched.push({ t, f });
      const R = HH() * (B.r || 1.5) * s0(), D = HH() * (B.dist || 0) * s0(), n = Math.max(1, Math.round(B.n || 1)), m = B.m || 1;
      switch (B.t) {
        case 'dash': case 'charge': case 'side': {   // 突進：沿路徑每隻敵人打一次
          a.mv2 = { d: D * (B.t === 'side' ? 0 : 1), dy: B.t === 'side' ? (Math.random() < .5 ? -1 : 1) * HH() * 0.8 : 0, f0: t0 - 2, f1: t0 + 10 }; a.pathHit = { m, r: HH() * 0.55 * s0() }; if (B.inv) a.invAll = true;
          push(t0, () => { fx(b.fx, front(), chest(), 2.2); if (B.t === 'side') each(e => { if (inFront(e, R * 1.2, R * 0.7)) hit(e, a, m, { last: true, big: true }); }); });   // 側移：出招時橫掃前方
          if (B.twice) { a.T += 16; push(t0 + 16, () => { a.mv2 = { d: D, f0: H.t, f1: H.t + 10 }; a.pathHits = []; fx(b.fx, front(), chest(), 2.2); }); }
          if (B.back) { a.T += 18; push(t0 + 16, () => { H.face = -H.face; a.mv2 = { d: D, f0: H.t, f1: H.t + 12 }; a.pathHits = []; }); }
          push(t0 + 12, () => { if (B.burst) G.ZONES.push({ k: 'burst', x: H.x, y: H.y, r: HH() * 1.4 * s0(), t: 0, life: 60, m: m * 1.2, a, fx: 'skill_light_pillar_a' });
            if (B.dot) G.ZONES.push({ k: 'field', x: H.x - H.face * D / 2, y: H.y, r: Math.max(D / 2, HH()), t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx || 'skill_fire_ground_a' });
            if (B.markBurst) each(e => { if (e.mk) G.ZONES.push({ k: 'burst', x: e.x, y: e.y, r: HH() * 0.8, t: 0, life: 180, m: 1.5, a, fx: 'skill_fire_rim_a' }); });
            if (B.resetDodge) for (const k in H.cd) if (k.startsWith('m:')) H.cd[k] = 0;
            if (B.echo) G.ZONES.push({ k: 'burst', x: H.x, y: H.y, r: HH() * 1.2, t: 0, life: 40, m: m * 0.6, a, fx: 'weapon_cut_b' }); });
          break; }
        case 'multi': case 'cross': case 'turn': case 'launch': {   // 連斬：前方多段
          for (let i = 0; i < n; i++) push(at(i, n), () => { const last = i === n - 1; if (B.t === 'turn' && i === 0) H.face = -H.face;
            const reach = R * (B.line ? 1.4 : 1), half = B.line ? HH() * 0.4 * s0() : Math.max(30, R * 0.55);
            fx(b.fx, front(B.line ? 0.8 : 0.5), chest() - (B.t === 'launch' ? HH() * 0.2 : 0), B.t === 'cross' ? 2.4 : 2);
            let any = 0; each(e => { if (inFront(e, reach, half)) { any++; hit(e, a, m * (last && B.last ? B.last : 1), { last, big: last, kb: B.t === 'launch' ? H.face * 2 : undefined, stun: B.t === 'launch' && last ? 40 : 0 }); } });
            if (B.adv) G.tryMove(H, H.face * HH() * B.adv * 0.4, 0);
            if (last) { if (B.wave) SKB.wave(a, 1, HH() * 6, m, b.fx5 || 'skill_wind_blade_a'); if (B.pull) each(e => { if (inFront(e, R * 2, R)) e.x = H.x + H.face * HH() * 0.6; });
              if (B.burst) G.ZONES.push({ k: 'burst', x: front(1.2), y: H.y, r: HH() * 1.2 * s0(), t: 0, life: 40, m: m * 1.5, a, fx: 'skill_fire_rim_a' }); }
            if (any) shake(last); }); break; }
        case 'spin': case 'nova': case 'sweep': case 'quake': case 'frenzy': {   // 範圍：以自身為中心
          const N = B.t === 'nova' || B.t === 'sweep' ? 1 : n, T2 = B.t === 'frenzy' ? (B.dur || 150) : 0; if (T2) { a.T = Math.max(a.T, t0 + T2); a.loop = true; }
          const tAt = i => T2 ? t0 + Math.round(T2 * i / N) : at(i, N);
          for (let i = 0; i < N; i++) push(tAt(i), () => { const last = i === N - 1, rr = R * (B.t === 'quake' && B.grow ? 1 + 0.35 * i : 1) * (B.t === 'quake' && last && B.screen ? 3 : 1);
            fx(b.fx, B.t === 'sweep' ? front(0.8) : H.x, chest(), 2.2 * Math.sqrt(rr / (HH() * 1.5)));
            if (B.t === 'quake' || B.t === 'frenzy') SC.shake = 8;
            each(e => { const ok = B.t === 'sweep' ? inFront(e, rr * 1.3, rr * 0.7) : inCircle(e, H.x, H.y, rr); if (ok) hit(e, a, m, { last, big: last, kb: B.knock ? H.face * 8 * B.knock : undefined }); });
            if (B.move && !last) G.tryMove(H, H.face * HH() * 0.25 * B.move, 0);
            if (last) { if (B.gather || B.pull) each(e => { if (inCircle(e, H.x, H.y, rr * 2)) { e.x += (H.x + H.face * 20 - e.x) * 0.7; e.y += (H.y - e.y) * 0.5; } });
              if (B.ring || B.wave) { SKB.wave(a, 1, HH() * 5, m, 'skill_wind_blade_a'); H.face = -H.face; SKB.wave(a, 1, HH() * 5, m, 'skill_wind_blade_a'); H.face = -H.face; }
              if (B.dot) G.ZONES.push({ k: 'field', x: H.x, y: H.y, r: rr, t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx || b.fx2 || 'skill_wind_vortex_b', home: B.home });
              if (B.twice) push(H.t + 14 - 0, () => {});
              if (B.armor) BUF.add('armor', 1, 150); if (B.ls) BUF.add('ls', B.ls, 150);
              if (b.fx2) fx(b.fx2, H.x, H.y - HH() * 0.9 * s0(), 2.4); } });
          if (B.t === 'quake' && B.twice) push(t1, () => each(e => { if (inCircle(e, H.x, H.y, R)) hit(e, a, m * 0.8, { last: true }); }));
          if (B.t !== 'quake' && B.twice) push(t1, () => { fx(b.fx, H.x, chest(), 2.2); each(e => { if (inCircle(e, H.x, H.y, R)) hit(e, a, m * 0.8, { last: true }); }); });
          if (B.stun && B.t === 'nova') ;   // 由 hit 的 last 處理
          if (B.armor) BUF.add('armor', 1, a.T); break; }
        case 'wave': push(t0, () => { SKB.wave(a, n, HH() * (B.dist || 5) * s0(), m, b.fx, B.pierce ? 9 : 3, B.ret); if (B.dot) G.ZONES.push({ k: 'field', x: front(2.5), y: H.y, r: HH() * 1.2, t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx }); }); break;
        case 'shot': case 'throw': case 'shard': case 'bomb': case 'barrage': {   // 遠程
          const N = B.t === 'barrage' ? n : n, gap = B.seq || 0, T2 = B.t === 'barrage' ? (B.dur || 110) : 0; if (T2) a.T = Math.max(a.T, t0 + T2);
          for (let i = 0; i < N; i++) push(t0 + (T2 ? Math.round(T2 * i / N) : gap * i), () => { const last = i === N - 1, sp = B.spread || (B.t === 'shard' ? 0.7 : 0), an = N > 1 && !gap && !T2 ? -sp / 2 + sp * i / (N - 1) : (T2 ? (Math.random() - 0.5) * 0.25 : 0);
            const homing = B.home || (BUF.get('home') > 0 && (BUF.v.home--, BUF.v.home >= 0));
            SKB.proj(a, { img: B.img || b.fx || 'projectile_release_a', an, d: HH() * (B.dist || 5) * s0(), m: m * (last && B.bigLast ? 4 : 1), pierce: B.pierce || (last && B.pierceLast) ? 9 : 1, home: homing,
              bomb: B.t === 'bomb' ? R : (last && B.bigLast ? HH() * 2 : 0), lob: B.lob, ret: B.t === 'throw' && B.ret, boom: B.t === 'throw', fx: b.fx, stun: last && (B.stun || B.downLast) ? 50 : 0, crit: B.crit || (homing && B.homeCrit), last,
              split: B.split, scatter: last && B.scatterLast, ign: B.ignoreDef }); });
          break; }
        case 'rain': case 'storm': {   // 前方區域落下
          const T2 = B.dur || Math.max(40, (t1 - t0) * 2), N = n; a.T = Math.max(a.T, t0 + Math.min(T2, 90));
          G.ZONES.push({ k: B.t, x: B.t === 'storm' ? front(1.5) : (B.far ? front(B.far * 1.2) : H.x + H.face * R * 0.4), y: H.y, r: R, t: 0, life: T2, n: N, m, a, fx: b.fx2 || b.fx, fx0: b.fx, follow: B.followHero || B.follow, chain: B.chain, burst: B.burst, end: B.healFull ? 'heal' : B.pillar ? 'pillar' : null });
          push(t0, () => fx(b.fx, H.x, chest(), 2.6));
          if (B.rain) push(t1, () => G.ZONES.push({ k: 'rain', x: H.x, y: H.y, r: HH() * 4 * s0(), t: 0, life: B.rain.t, n: 9, m: B.rain.m * 0.5, a, fx: B.rain.fx }));
          if (B.field) push(t1, () => { G.ZONES.push({ k: 'field', x: H.x, y: H.y, r: R, t: 0, life: B.field.t, m: B.field.m, a, fx: 'skill_light_glyph_b' }); if (B.field.buff) BUF.add('crit', B.field.buff.crit, B.field.buff.t); });
          break; }
        case 'trap': push(t0, () => { const x = H.x + H.face * HH() * (B.d < 0 ? B.d : 0.3) * s0(); if (B.back) a.mv2 = { d: -HH() * B.back * s0(), f0: H.t, f1: H.t + 10 };
            G.ZONES.push({ k: 'trap', x, y: H.y, len: HH() * Math.abs(B.dist || B.d || 1.5) * s0(), r: HH() * 0.8 * s0(), t: 0, life: (B.delay || 30) + (B.twice ? 40 : 0) + 2, at: B.delay || 30, twice: B.twice, m, a, fx: b.fx, burst: B.burst, face: H.face }); fx(b.fx, x, H.y - 10, 1.6); }); break;
        case 'zone': push(t0, () => { G.ZONES.push({ k: 'zone', x: H.x, y: H.y, r: R, t: 0, life: B.dur || 300, a, fx: b.fx, dr: B.dr || 30, slow: B.slow }); fx(b.fx, H.x, H.y - 10, 2.6); }); break;
        case 'orbit': push(t0, () => G.ZONES.push({ k: 'orbit', x: H.x, y: H.y, r: R, t: 0, life: B.dur || 300, n, m, a, fx: b.fx, heal: B.healHit })); break;
        case 'back': case 'leap': {   // 位移後出手
          const back = B.t === 'back'; a.mv2 = back ? { d: -D, f0: t0 + 1, f1: t0 + 12 } : { d: D, f0: t0 - 6, f1: t0 + 6, hop: true };   // 後撤：先斬再退；跳劈：先跳再落 if (B.inv || back) a.invAll = true;
          push(back && !B.shoot ? t0 : t0 + 6, () => { const last = true;
            if (B.shoot) { const N = Math.max(1, B.shoot) + (B.n || 0); for (let i = 0; i < N; i++) SKB.proj(a, { img: B.img, an: N > 1 ? -0.3 + 0.6 * i / (N - 1) : 0, d: HH() * 5 * s0(), m, pierce: 1, last: i === N - 1 }); }
            else { fx(b.fx, back ? front(0.5) : H.x, back ? chest() : H.y - HH() * 0.3 * s0(), 2.4); each(e => { if (back ? inFront(e, HH() * 1.4 * s0(), 40) : inCircle(e, H.x, H.y, R)) hit(e, a, m, { last, big: true }); }); if (!back) SC.shake = 8; }
            if (B.burst) G.ZONES.push({ k: 'burst', x: H.x + H.face * D, y: H.y, r: HH() * 1.2 * s0(), t: 0, life: 60, m: m * 1.5, a, fx: 'skill_fire_rim_a' });
            if (B.ring) { SKB.wave(a, 1, HH() * 4, m * 0.8, 'skill_wind_blade_a'); }
            if (B.wall) G.ZONES.push({ k: 'wall', x: H.x + H.face * D, y: H.y, r: HH() * 0.7, t: 0, life: 240, fx: 'projectile_stone_b' });
            if (B.dot) G.ZONES.push({ k: 'field', x: H.x, y: H.y, r: R, t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx || 'skill_fire_ground_a' });
            if (B.nextUp) BUF.add('atk', B.nextUp, 120); if (B.stun && !back) each(e => { if (inCircle(e, H.x, H.y, R)) e.stun = Math.max(e.stun || 0, B.stun); }); });
          break; }
        case 'blink': {   // 瞬移斬：依序閃到畫面內敵人身邊
          a.invAll = true; const N = n; a.T = Math.max(a.T, t0 + N * 7 + 10);
          for (let i = 0; i < N; i++) push(t0 + i * 7, () => { const L = G.E.filter(alive); if (!L.length) return; const e = L[i % L.length]; G.FX.push({ k: 'ghost', u: G.WPN.unit().key, fr: G.heroFrame(), x: H.x, y: H.y, face: H.face, s: s0() * G.WPN.actK(H.act && H.act.name), t: 0, life: 14 });
            H.face = e.x > H.x ? 1 : -1; H.x = e.x - H.face * HH() * 0.5; H.y = e.y; fx(b.fx, e.x, e.y - HH() * 0.5 * s0(), 2.2); hit(e, a, m, { last: i === N - 1, big: true }); });
          push(t0 + N * 7 + 2, () => { if (b.fx2) fx(b.fx2, H.x, H.y - HH() * s0(), 3); if (B.rain) G.ZONES.push({ k: 'rain', x: H.x, y: H.y, r: HH() * 4 * s0(), t: 0, life: B.rain.t, n: 9, m: B.rain.m * 0.5, a, fx: B.rain.fx }); });
          break; }
        case 'pull': push(t0, () => { const L = G.E.filter(e => alive(e) && Math.hypot(e.x - H.x, (e.y - H.y) * 1.5) < R).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x)).slice(0, B.one ? (B.two ? 2 : 1) : 99);
            for (const e of L) { e.x = H.x + H.face * HH() * 0.55; e.y += (H.y - e.y) * 0.6; e.stun = Math.max(e.stun || 0, 20); }
            fx(b.fx, front(0.6), chest(), 2.4); for (const e of L) hit(e, a, m, { last: true, big: true });
            if (B.twice) a.sched.push({ t: H.t + 14, f: () => { for (const e of L) if (alive(e)) { e.x = H.x + H.face * HH() * 0.55; hit(e, a, m * 0.8, { last: true }); } } });
            if (B.dot) G.ZONES.push({ k: 'field', x: H.x + H.face * HH() * 0.6, y: H.y, r: HH() * 1.4, t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx }); shake(true); }); break;
        case 'line': push(t0, () => { const L = HH() * (B.dist || 3) * s0(), rows = B.rows || 1;
            for (let k = 0; k < 5; k++) a.sched.push({ t: H.t + k * 4, f: () => { for (let rI = 0; rI < rows; rI++) { const x = H.x + H.face * L * (k + 1) / 5, y = H.y + (rows > 1 ? (rI - 0.5) * 24 : 0); fx(b.fx, x, y - 14, 1.6);
                  each(e => { if (Math.abs(e.x - x) < L / 5 + 10 && Math.abs(e.y - y) < 26 && !(e.lh === a && e.lk === k)) { e.lh = a; e.lk = k; hit(e, a, m, { last: k === 4, big: k === 4 }); } }); }
                if (B.side && k === 4) for (const sgn of [-1, 1]) { const x = H.x + H.face * L; fx(b.fx, x, H.y + sgn * 34, 1.4); each(e => { if (Math.abs(e.x - x) < 40 && Math.abs(e.y - (H.y + sgn * 34)) < 24) hit(e, a, m * 0.7, {}); }); } } });
            if (B.dot) G.ZONES.push({ k: 'field', x: H.x + H.face * L / 2, y: H.y, r: L / 2, t: 0, life: B.dot.t, m: B.dot.m, a, fx: B.dot.fx }); SC.shake = 6; }); break;
        case 'stance': {   // 架勢：不主動攻擊；期間被打 → 格擋反擊
          const dur = B.dur || 60; a.T = Math.max(a.T, t0 + dur); a.stance = { from: 2, to: t0 + dur, m, crit: B.crit, reflect: B.reflect, qi: B.qi, shot: B.shot, fx: b.fx };
          push(2, () => fx(b.fx, H.x + H.face * 10, chest(), 1.6)); break; }
        case 'buff': push(t0, () => { const bb = B.buff || {}; for (const k in bb) if (k !== 't') BUF.add(k, B.atkX && k === 'atk' ? B.atkX : B.homeN && k === 'home' ? B.homeN : B.nextCrit && k === 'nextCrit' ? B.nextCrit : bb[k], bb.t);
            if (B.buffCdr) BUF.add('cdr', B.buffCdr, bb.t); if (B.critD) BUF.add('critD', B.critD, bb.t); if (B.homeCrit) BUF.add('homeCrit', 1, bb.t); fx(b.fx, H.x, chest(), 2.2); G.UI.toast(s.n + '：效果發動'); }); break;
        case 'qi': push(t0, () => { const d = G.RPG.d(); d.qi = Math.min(100, d.qi + (B.v || 30) * (B.qiX || 1)); if (B.buff) BUF.add('aspd', B.buff.aspd, B.buff.t); fx(b.fx, H.x, chest(), 2.2); G.UI.toast('氣 +' + Math.round((B.v || 30) * (B.qiX || 1))); }); break;
        case 'heal': push(t0, () => { H.hp = Math.min(H.hpMax, H.hp + H.hpMax * (B.v || 10) / 100); if (B.buff) BUF.add('dr', B.buff.dr, B.buff.t); fx(b.fx, H.x, H.y - HH() * 0.3, 2.4); G.NUMS.push({ x: H.x, y: H.y - HH() - 6, v: '+' + Math.round(H.hpMax * (B.v || 10) / 100), gold: true, t: 0 }); }); break;
        case 'mark': push(t0, () => { const L = G.E.filter(e => alive(e) && inFront(e, HH() * (B.d || 6) * s0(), 60)).sort((p, q) => Math.abs(p.x - H.x) - Math.abs(q.x - H.x));
            const e = L[0]; if (!e) { G.UI.toast('前方沒有目標'); return; } deb(e, 'mark', B.mark || 15, B.dur || 300); e.mk = B.transfer ? 2 : 1; fx(b.fx, e.x, e.y - HH() * 0.9, 1.6); G.UI.toast('標記：受傷 +' + (B.mark || 15) + '%'); }); break;
        default: return false;
      }
      a.sched.sort((p, q) => p.t - q.t); return true; },
    /* 每格：時間表、自帶位移、路徑判定 */
    tick(a, mx, my) { const t = H.t;
      while (a.sched.length && a.sched[0].t <= t) { const x = a.sched.shift(); x.f(); }
      const v = a.mv2; if (v && t >= v.f0 && t < v.f1) { const k = 1 / (v.f1 - v.f0); G.tryMove(H, H.face * v.d * k, (v.dy || 0) * k + my * 0.5); if (v.hop) H.hop = Math.sin((t - v.f0) / (v.f1 - v.f0) * Math.PI) * 18; }
      else if (H.hop) H.hop = 0;
      if (a.pathHit && v && t >= v.f0 && t < v.f1 + 2) { a.pathHits = a.pathHits || []; each(e => { if (!a.pathHits.includes(e) && Math.abs(e.x - H.x) < a.pathHit.r + 14 && Math.abs(e.y - H.y) < 30) { a.pathHits.push(e); hit(e, a, a.pathHit.m, { last: true, big: true }); shake(true); } });
        if (t % 2 === 0) G.FX.push({ k: 'ghost', u: G.WPN.unit().key, fr: G.heroFrame(), x: H.x, y: H.y, face: H.face, s: s0() * G.WPN.actK(H.act && H.act.name), t: 0, life: 14 }); }
      if (a.invAll) H.inv = Math.max(H.inv, 2);
      H.guard = !!(a.stance && t >= a.stance.from && t < a.stance.to); },
    /* 架勢被打：反擊 */
    counter(e) { const a = H.act, st = a && a.stance; if (!st) return false;
      G.spawnFx('feedback_guard_a', 0, H.x + H.face * 12, chest(), H.face, s0() * 1.6);
      if (st.shot) SKB.proj(a, { img: 'projectile_bullet_a', an: 0, d: HH() * 6, m: st.m, pierce: 1, last: true });
      else { fx(st.fx === 'feedback_guard_b' ? 'weapon_blunt_b' : 'weapon_cut_b', e.x, e.y - HH() * 0.5, 2); hit(e, a, st.m * (st.reflect ? 1.6 : 1), { last: true, big: true, crit: st.crit, stun: 40 }); }
      if (st.qi) G.RPG.d().qi = Math.min(100, G.RPG.d().qi + st.qi); G.hitstop = 8; SC.shake = 6; G.UI.toast('格擋反擊！'); return true; },
    wave(a, n, dist, m, img, pierce, ret) { for (let i = 0; i < n; i++) G.PROJ.push({ x: H.x + H.face * 24 * s0(), y: H.y + (n > 1 ? (i - (n - 1) / 2) * 18 : 0), h: HH() * 0.5 * s0(), vx: H.face * 8, vy: 0, left: dist, d0: dist, mult: m * (a.mult || 1), raw: m, a, big: true, pierce: pierce || 9, hits: [], face: H.face, img: img || 'skill_wind_blade_a', sc: 2.4, ret }); },
    proj(a, o) { const sp = o.lob ? 5 : 8, an = o.an || 0;
      G.PROJ.push({ x: H.x + H.face * 22 * s0(), y: H.y, h: HH() * 0.52 * s0(), vx: H.face * Math.cos(an) * sp, vy: Math.sin(an) * sp * 0.6, left: o.d, mult: o.m * (a.mult || 1), raw: o.m, ign: o.ign, big: o.last, pierce: o.pierce || 1, hits: [], face: H.face, img: o.img, sc: o.boom ? 2.4 : 2.2,
        home: o.home, bomb: o.bomb, lob: o.lob, d0: o.d, ret: o.ret, boom: o.boom, stun: o.stun, crit: o.crit, split: o.split, scatter: o.scatter, a }); },
    /* 設置物：陷阱／領域／光球／落雨／颶風／持續區／延遲爆發 */
    step() { BUF.step(); if (!G.ZONES.length) return;
      for (const z of G.ZONES) { z.t++; const a = z.a || {};
        if (z.follow && z.k !== 'storm') { z.x = H.x + H.face * z.r * 0.4; z.y = H.y; }
        if (z.k === 'field') { if (z.home) { const e = G.E.find(alive); if (e) { z.x += (e.x - z.x) * 0.03; z.y += (e.y - z.y) * 0.03; } }
          if (z.t % 30 === 0) each(e => { if (inCircle(e, z.x, z.y, z.r)) G.damageOni(e, z.m, false); }); if (z.t % 40 === 1) G.spawnFx(z.fx, 0, z.x, z.y - 14, 1, SC.depth(z.y) * 1.6); }
        else if (z.k === 'burst') { if (z.t === z.life - 1) { G.spawnFx(z.fx, 0, z.x, z.y - 20, 1, SC.depth(z.y) * 2.4); SC.shake = 7; each(e => { if (inCircle(e, z.x, z.y, z.r)) hit(e, a, z.m, { last: true, big: true }); }); } }
        else if (z.k === 'trap') { if (z.t === z.at || (z.twice && z.t === z.at + 40)) { const x0 = Math.min(z.x, z.x + z.face * z.len), x1 = Math.max(z.x, z.x + z.face * z.len);
            for (let k = 0; k < 4; k++) G.spawnFx(z.fx, 0, x0 + (x1 - x0) * k / 3, z.y - 14, z.face, SC.depth(z.y) * 1.5);
            each(e => { if (e.x > x0 - 20 && e.x < x1 + 20 && Math.abs(e.y - z.y) < 30) hit(e, a, z.m, { last: true, big: true, root: true }); });
            if (z.burst) G.ZONES.push({ k: 'burst', x: (x0 + x1) / 2, y: z.y, r: HH() * 1.3, t: 0, life: 30, m: 1.5, a, fx: 'skill_fire_rim_a' }); } }
        else if (z.k === 'zone') { if (z.t % 45 === 1) G.spawnFx(z.fx, 0, z.x, z.y - 10, 1, SC.depth(z.y) * 2.2 * z.r / (HH() * 2)); if (Math.hypot(H.x - z.x, (H.y - z.y) * 1.8) < z.r) BUF.add('dr', z.dr, 3);
          if (z.slow) each(e => { if (inCircle(e, z.x, z.y, z.r)) deb(e, 'slow', 50, 10); }); }
        else if (z.k === 'orbit') { z.x = H.x; z.y = H.y; for (let i = 0; i < z.n; i++) { const an = z.t * 0.09 + i * 6.283 / z.n, ox = z.x + Math.cos(an) * z.r, oy = z.y - HH() * 0.4 + Math.sin(an) * z.r * 0.4;
            if (z.t % 4 === 0) G.FX.push({ k: 'orb', x: ox, y: oy, t: 0, life: 6 });
            if (z.t % 20 === i) each(e => { if (Math.hypot(e.x - ox, (e.y - HH() * 0.4 - oy) * 1.2) < 28) { hit(e, a, z.m, {}); if (z.heal) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.01); } }); } }
        else if (z.k === 'rain' || z.k === 'storm') { const every = Math.max(4, Math.floor(z.life / Math.max(1, z.n)));
          if (z.k === 'storm') { const e = z.follow ? G.E.filter(alive).sort((p, q) => Math.abs(p.x - z.x) - Math.abs(q.x - z.x))[0] : null; z.x += e ? Math.sign(e.x - z.x) * 1.6 : H.face * 0.8;
            if (z.t % 24 === 1) G.spawnFx(z.fx, 0, z.x, z.y - HH() * 0.6, 1, SC.depth(z.y) * 2.6);
            if (z.t % 15 === 0) each(e => { if (inCircle(e, z.x, z.y, z.r)) { hit(e, a, z.m, {}); e.x += (z.x - e.x) * 0.3; } });
            if (z.t === z.life - 1 && z.burst) G.ZONES.push({ k: 'burst', x: z.x, y: z.y, r: z.r * 1.4, t: 0, life: 2, m: 2.5, a, fx: 'skill_wind_vortex_b' }); }
          else if (z.t % every === 0) { const tg = Math.random() < 0.6 ? G.E.filter(e => alive(e) && inCircle(e, z.x, z.y, z.r)) : [], te = tg.length ? tg[Math.floor(Math.random() * tg.length)] : null;   // 六成落在區域內的敵人身上
            const x = te ? te.x + (Math.random() - 0.5) * 16 : z.x + (Math.random() - 0.5) * z.r * 2, y = te ? te.y : z.y + (Math.random() - 0.5) * z.r * 0.6; G.spawnFx(z.fx, 0, x, y - HH() * 0.5, 1, SC.depth(y) * 2);
            let tgt = null; each(e => { if (Math.hypot(e.x - x, (e.y - y) * 1.6) < HH() * 1.1) { hit(e, a, z.m, {}); tgt = e; } });
            if (z.chain && tgt) { const e2 = G.E.find(e => alive(e) && e !== tgt && Math.hypot(e.x - tgt.x, e.y - tgt.y) < HH() * 3); if (e2) { G.spawnFx(z.fx, 0, e2.x, e2.y - HH() * 0.5, 1, SC.depth(e2.y) * 1.6); hit(e2, a, z.m * 0.7, {}); } } }
          if (z.t === z.life - 1 && z.end === 'heal') { H.hp = H.hpMax; G.UI.toast('日輪：生命全滿'); }
          if (z.end === 'pillar' && z.t % every === 0) G.spawnFx('skill_light_pillar_a', 0, z.x + (Math.random() - 0.5) * z.r * 2, z.y - HH() * 0.6, 1, SC.depth(z.y) * 1.8); }
        else if (z.k === 'wall') { each(e => { if (Math.abs(e.x - z.x) < z.r && Math.abs(e.y - z.y) < 30) e.x = z.x + Math.sign(e.x - z.x || 1) * z.r; }); if (z.t % 40 === 1) G.spawnFx(z.fx, 0, z.x, z.y - 20, 1, SC.depth(z.y) * 2); } }
      G.ZONES = G.ZONES.filter(z => z.t < z.life); }
  };
  G.ZONES = [];
})();
