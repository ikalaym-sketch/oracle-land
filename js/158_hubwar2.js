/* ==========================================================================
 * 神諭之地 重製版 — 158_hubwar2.js
 * Version : r3.160.0  (2026-11-27)
 * 變更    : r3.160.0 新增。兩岸城攻防篇 第二批：W7 城內爭奪（劇本 2026-11-27_1840_HUB_WAR_SCRIPT_v1 第十節）
 *           ・據點戰：我方本陣（西口，耐久）、南方道摩軍本陣（拒馬 3 座＋核心）、東方妖穴（核心）；北方妖穴只當背景（W8 才打）
 *           ・敵方據點每 20 秒沿街道派一隊（同時最多 16 隻），走節點路線（下方木橋斷了，東邊只能繞上橋）
 *           ・本陣 6 名守兵（槍 3、弓 2、鐵砲 1）自動攔截，倒下 30 秒補兵；篝火旁每秒回 2%
 *           ・兵糧：每秒 +1、擊倒 +2、攻下據點 +100；出兵面板（左側）：槍 60／弓 70／鐵砲 100，一隊 3 人，最多 12 名；指令 守／攻南／攻東
 *           ・南方核心歸零 → 玄符現身（黑符的雙胞胎哥哥：kuroonmyo 放大＋紫黑氣場；召鬼、符咒、黑火柱），台詞依黑符討伐與碎片抉擇分歧
 *           ・東面援軍過場：鎌鼬三兄弟、河童大將、狐族長者、砂狐（鬼族友好＋權六）→ 援軍自動攻打東方妖穴 → 小雪淨化
 *           ・本陣耐久歸零＝這一段重來（已攻下的據點保留）；離開城再回來也從這一段開頭
 *           ・戰火～奪回前，軍奉行不在城裡（與孫六同圖，避免重複）
 * 存檔    : flags.hw7s = { south:1, east:1 }、hw7b_intro、hw7c_intro
 * 依賴    : 157_hubwar（G.HW：run／prop／wp／add／phase）、93_kassen（KASSEN.UNIT 兵種資料）、03_actors（spawnOni／damageOni／oniStep／hurtHero）、
 *           76_vfx（VX.draw2／custom／s2）、48_occlude（OCC 排序）、49_party（PARTY.tap）。
 * ========================================================================== */
'use strict';
(function () {
  const HW = G.HW, Q = G.QST, SC = G.SC, H = G.H, A = G.ANIM, ctx = G.ctx; if (!HW || !Q || !Q.add) return;
  const F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text }), nar = t => say('', t), act = fn => ({ do: fn });
  const DN = id => Q.isDone(id), AC = id => Q.active(id), TK = 1000 / 60, HH = () => G.HERO_H, S = y => SC.depth(y), ID = 'hub_city';
  const inP = id => !!(G.PARTY && G.PARTY.list && G.PARTY.list.some(m => m.id === id)), P = (id, who, t) => inP(id) ? [say(who, t)] : [];
  const 雪 = t => say('小雪', t), 丸 = t => say('白丸', t), 蒼 = t => say('蒼真', t);
  const S7 = () => (F().hw7s = F().hw7s || {});
  const VX = () => G.VX;

  /* ======================= 一、地圖配置 ======================= */
  const BASE = { x: 200, y: 612 }, BRZ = { x: 250, y: 662 };
  const ROUTE = { s: [[800, 845], [800, 720], [800, 612], [560, 612], [330, 612]], e: [[1450, 520], [1330, 330], [1090, 330], [960, 450], [800, 612], [560, 612], [330, 612]] };
  const FORT = { s: { x: 800, y: 905, img: 'fort_doma', w: 300, core: [800, 880], ab: [[738, 812], [800, 806], [862, 812]], ban: [[712, 858], [888, 858]], spawn: [800, 850] },
    e: { x: 1470, y: 500, img: 'fort_yokai', w: 470, core: [1470, 478], ban: [[1385, 440], [1560, 440]], spawn: [1450, 520] },
    n: { x: 800, y: 292, img: 'fort_yokai', w: 470 } };
  const FOES = { s: ['doma_spear_soldier', 'doma_shield_soldier', 'doma_archer', 'yaribushi'], e: ['yomigun', 'shikome', 'skelgun', 'gaki'], oni: ['akaoni', 'kurooni', 'onihei'] };
  const RANGED = new Set(['doma_archer', 'skelgun', 'ashiyumi', 'ashigun']);
  const lv = () => Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 1);
  const gd = () => (G.GDIFF && G.GDIFF.cur ? G.GDIFF.cur() : { hp: 1, atk: 1 });
  const refHp = () => (70 + 30 * (lv() - 1)) * (G.EHP || 1) * gd().hp, refAtk = () => (10 + 4 * (lv() - 1)) * gd().atk;
  const opt = (e, frac, face) => ({ party: { face }, atk: refHp() * frac / Math.max(0.05, 1 - (e.def || 0) / ((e.def || 0) + 80)), crit: 5, critD: 150 });
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.4);
  const live = e => e && e.st !== 'dead' && e.hp > 0;

  /* ======================= 二、戰況 ======================= */
  const W = HW.w7 = { on: false, ph: 0, rice: 0, dur: 100, units: [], objs: [], allies: [], fx: [], bolts: [], warns: [], boss: null, sp: { s: 300, e: 600 }, ord: 'hold', t: 0, done: null, bt: [], bossDone: 0 };
  const foes = () => G.E.filter(e => e.hw7 && !e.hwObj && live(e));
  function safeOff() { const d = SC.def; if (!d._hwS) d._hwS = { safe: d.safe, town: d.town }; d.safe = false; d.town = false; if (W.lv0 === undefined) { W.lv0 = d.lv; d.lv = lv(); } if (G.AMB) { G.AMB.bubs = []; G.AMB.chatT = 99999; } }
  function safeOn() { const d = SC.def; if (d && d._hwS) { d.safe = d._hwS.safe; d.town = d._hwS.town; delete d._hwS; } if (d && W.lv0 !== undefined) { d.lv = W.lv0; W.lv0 = undefined; } if (G.AMB) G.AMB.chatT = 400; }
  function reset(keepA) { G.E = G.E.filter(e => !e.hw7); W.units = []; if (!keepA) { for (const a of W.allies) { if (a.amb && G.AMB) G.AMB.remove(a.amb); } G.NPC = G.NPC.filter(n => !n.hwA); W.allies = []; } W.objs = []; W.fx = []; W.bolts = []; W.warns = [];
    W.boss = null; W.on = false; W.bt = []; G.CAMLOOK = null; }

  /* ---------- 據點物件（打得到的拒馬、核心）---------- */
  function obj(kind, fort, x, y, hpK, o) { const e = G.spawnOni(x, y, 0, lv(), 'yomigun'); if (!e) return null;
    Object.assign(e, { hwObj: kind, fort, wo: 'hw', kz: 1, hw7: 1, hp: refHp() * hpK, hpMax: refHp() * hpK, atk: 0, st: 'walk', stun: 1e9, face: -1, ratio: kind === 'core' ? 1.3 : 1, delay: 0, alpha: 1 }, o || {}); W.objs.push(e); return e; }
  const abLeft = f => W.objs.some(o => o.hwObj === 'abatis' && o.fort === f && live(o));
  function forts() { const s = S7();
    if (!s.south) { for (const [x, y] of FORT.s.ab) obj('abatis', 's', x, y, 7); obj('core', 's', FORT.s.core[0], FORT.s.core[1], 30, { inv: () => abLeft('s') ? '先打壞前面的拒馬' : W.boss ? '玄符的結界' : null }); }
    if (!s.east) obj('core', 'e', FORT.e.core[0], FORT.e.core[1], 60, { inv: () => W.ph < 2 ? '妖氣太濃，打不進去' : null }); }
  /* 城的布景：三座敵據點（攻下＝被攻破版＋我方旗） */
  HW.forts7 = function () { const s = S7(), ph = HW.phase(); if (SC.id !== ID || (ph !== 'battle')) return;
    HW.prop(FORT.s.img + (s.south ? '_off' : '_on'), FORT.s.x, FORT.s.y, FORT.s.w, { hwF: 's' }); for (const [x, y] of FORT.s.ban) HW.wp(s.south ? 'war_banner_ours' : 'war_banner_enemy', x, y, 0.75).hwF = 's';
    HW.prop(FORT.e.img + (s.east ? '_off' : '_on'), FORT.e.x, FORT.e.y, FORT.e.w, { hwF: 'e' }); for (const [x, y] of FORT.e.ban) HW.wp(s.east ? 'war_banner_ours' : 'war_banner_enemy', x, y, 0.75).hwF = 'e';
    if (!DN('hw8')) HW.prop(FORT.n.img + '_on', FORT.n.x, FORT.n.y, FORT.n.w, { hwF: 'n' }); };
  function capture(f) { const s = S7(); s[f === 's' ? 'south' : 'east'] = 1; G.SAVE.markDirty();
    for (const n of HW.props) if (n.hwF === f) { if (n.hwimg) n.hwimg = n.hwimg.replace('_on', '_off'); if (n.wp) n.s = 'war_banner_ours'; }
    G.E = G.E.filter(e => !(e.hwObj && e.fort === f)); W.objs = W.objs.filter(o => o.fort !== f); W.rice += 100; G.NUMS.push({ x: H.x, y: H.y - 90, v: '兵糧 +100', t: 0 });
    for (const u of W.units) if (u.ord === f) u.ord = 'hold'; if (W.ord === f) W.ord = 'hold';
    G.UI.banner(f === 's' ? '攻下　南方道摩軍本陣' : '攻下　東方妖穴', f === 's' ? '旗子換成了我們的' : '只剩北面'); }

  /* ======================= 三、敵兵：沿街道進攻 ======================= */
  function spawnSquad(f) { if (foes().length >= 16) return; const L = FOES[f], p = FORT[f].spawn, n = 3 + (Math.random() < 0.5 ? 1 : 0);
    Q.load(L).then(() => { if (!W.on) return; for (let i = 0; i < n; i++) { const e = G.spawnOni(p[0] + (Math.random() - 0.5) * 70, p[1] + (Math.random() - 0.5) * 30, 10 + i * 18, lv(), L[Math.floor(Math.random() * L.length)]); if (e) Object.assign(e, { hw7: 1, kz: 1, route: f, ri: 0 }); } }); }
  function heroT(e) { return { x: H.x, y: H.y, hero: 1, hurt: d => G.hurtHero(d, e.x), alive: () => H.hp > 0 }; }
  function unitT(u) { return { x: u.x, y: u.y, r: 6, hurt: d => hurtUnit(u, d), alive: () => u.hp > 0 }; }
  const baseT = { x: BASE.x + 40, y: BASE.y, r: 40, base: 1, hurt: d => { W.dur -= d; W.bflash = 12; }, alive: () => W.dur > 0 };
  function pick(e) { const rg = RANGED.has(e.type), dh = dist(H, e);
    if (H.hp > 0 && dh < (rg ? 250 : 200)) return rg ? heroT(e) : null;
    if (G.PARTY && G.PARTY.list.some(p => p.hp > 0 && p.st !== 'down' && dist(p, e) < 150)) return null;
    let best = null, bd = 170; for (const u of W.units) { if (u.hp <= 0) continue; const d = dist(u, e); if (d < bd) { bd = d; best = u; } } if (best) return unitT(best);
    if (dist(e, BASE) < 130) return baseT; return { march: 1 }; }
  const os0 = G.oniStep;
  function foeAI(e) {
    if (e.delay > 0 || e.st === 'dead' || e.st === 'hurt' || e.stun > 0) return os0(e);
    if (e.st === 'walk' && (e.kt === undefined || G.t % 15 === (e.ph | 0) % 15)) e.kt = pick(e);
    const T = e.kt; if (!T) return os0(e);
    e.t++; if (e.flash > 0) e.flash--; if (e.kb) { const nx = e.x + e.kb; if (SC.walkable(nx, e.y)) e.x = nx; e.kb *= 0.8; if (Math.abs(e.kb) < 0.2) e.kb = 0; }
    G.enemyDebStep && G.enemyDebStep(e);
    const sp = (e.sm ? 1.25 : 1.05) * (e.db && e.db.slow ? 0.5 : 1);
    if (T.march) { const R = ROUTE[e.route] || ROUTE.s, q = R[Math.min(e.ri, R.length - 1)], dx = q[0] - e.x, dy = q[1] - e.y;
      if (Math.hypot(dx, dy) < 26) { if (e.ri < R.length - 1) e.ri++; else e.kt = baseT; return; }
      if (Math.abs(dx) > 3) e.face = Math.sign(dx); const ox = e.x, oy = e.y; G.tryMove(e, Math.abs(dx) > 4 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 4 ? Math.sign(dy) * sp * 0.7 : 0);
      if (ox === e.x && oy === e.y && G.t % 40 === 0) e.ri = Math.min(R.length - 1, e.ri + 1); return; }   /* 卡住就跳下一個節點 */
    const rg = RANGED.has(e.type), reach = rg ? 230 : (T.r || 20) + 34 + G.bodyX(e), dx = T.x - e.x, dy = T.y - e.y, dd = Math.hypot(dx, dy * 1.4);
    if (e.st === 'walk') { if (Math.abs(dx) > 4) e.face = Math.sign(dx); e.cd--;
      if (dd <= reach) { if (e.cd <= 0) { e.st = 'atk'; e.t = 0; e.atkHit = false; const r = G.enemyUnit(e.type), rec = r && (r.act.attack || r.act.atk); e.atkMs = (rec ? Math.max(600, A.dur(rec)) : 966) * 1.6; } }
      else G.tryMove(e, Math.abs(dx) > 4 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 6 ? Math.sign(dy) * sp * 0.6 : 0); }
    else if (e.st === 'atk') { const ms = e.t * TK;
      if (!e.atkHit && ms >= e.atkMs * 0.48) { e.atkHit = true; if (T.alive() && dd <= reach * 1.3) { if (rg) tracer(e.x, e.y - HH() * 0.55 * S(e.y), T.x, T.y - 18, e.type === 'skelgun' ? 'gun' : 'arrow', 0);
          T.hurt(T.base ? (e.elite ? 4 : 1.6) : e.atk * (T.hero ? 1 : 1.2)); if (!rg) G.FX.push({ k: 'dust', x: T.x, y: T.y, t: 0, life: 16 }); } }
      if (ms >= e.atkMs) { e.st = 'walk'; e.t = 0; e.cd = 60 + Math.random() * 60; } } }
  G.oniStep = function (e) { if (e && e.hwObj) { e.kb = 0; if (e.flash > 0) e.flash--; e.t++; if (e.st === 'hurt') e.st = 'walk'; return; }
    if (e && e.hw7 && W.on && SC.id === ID && !e.hwBoss) return foeAI(e); return os0.apply(this, arguments); };
  /* 打不動的據點：不扣血，只跳提示 */
  const dm0 = G.damageOni; G.damageOni = function (e) { if (e && e.hwObj && e.inv) { const why = e.inv(); if (why) { if (!e._ivT || G.t - e._ivT > 45) { e._ivT = G.t; G.NUMS.push({ x: e.x, y: e.y - 70, v: why, t: 0 }); } return; } } return dm0.apply(this, arguments); };

  /* ======================= 四、我方士兵 ======================= */
  const UN = () => (G.KASSEN && G.KASSEN.UNIT) || {};
  const DEFS = [['spear', 372, 582], ['spear', 384, 614], ['spear', 372, 646], ['bow', 292, 590], ['bow', 292, 640], ['gun', 262, 615]];
  function mkUnit(k, x, y, o) { const U = UN()[k]; if (!U) return null; const hp = refAtk() * U.hp * 1.6; const u = Object.assign({ k, U, x, y, hx: x, hy: y, hp, hpMax: hp, st: 'walk', t: 0, cd: 30, face: 1, alpha: 0, ph: Math.random() * 999, fl: 0, ord: 'hold', ri: 0 }, o || {}); W.units.push(u); return u; }
  function defenders() { DEFS.forEach(([k, x, y], i) => mkUnit(k, x, y, { def: i })); }
  function hurtUnit(u, d) { if (u.hp <= 0) return; u.hp -= d; u.fl = 8; if (u.st !== 'atk') { u.st = 'hurt'; u.t = 0; } if (u.hp <= 0) { u.hp = 0; u.st = 'dead'; u.t = 0; if (u.def !== undefined) W.resp = (W.resp || []).concat([{ i: u.def, t: W.t + 1800 }]); } }
  const COST = { spear: 60, bow: 70, gun: 100 };
  function deploy(k) { if (!W.on) return; const n = W.units.filter(u => u.def === undefined && u.hp > 0).length; if (n >= 12) return G.UI.toast('出擊的兵已經滿了（最多 12 名）');
    if (W.rice < COST[k]) return G.UI.toast('兵糧不夠'); W.rice -= COST[k]; for (let j = 0; j < 3 && n + j < 12; j++) mkUnit(k, BASE.x + 60 + j * 20, BASE.y - 20 + j * 22, { ord: W.ord, cd: 20 + j * 20 });
    G.UI.toast('出兵：' + UN()[k].n + '一隊'); }
  function setOrd(o) { if (o === 's' && S7().south) return G.UI.toast('南方本陣已經攻下了'); if (o === 'e' && S7().east) return G.UI.toast('東方妖穴已經攻下了');
    W.ord = o; for (const u of W.units) if (u.def === undefined) { u.ord = o; u.ri = 0; } G.UI.toast(o === 'hold' ? '出擊的兵：守本陣' : o === 's' ? '出擊的兵：進攻南方本陣' : '出擊的兵：進攻東方妖穴'); }
  function targetFor(u) { const home = u.ord === 'hold' || u.def !== undefined, cx = home ? u.hx : u.x, cy = home ? u.hy : u.y, R = home ? 280 : 230; let best = null, bd = 1e9;
    for (const e of G.E) { if (!e.hw7 || e.hwObj || !live(e) || e.delay > 0) continue; const d = Math.hypot(e.x - cx, (e.y - cy) * 1.4); if (d < R && d < bd) { bd = d; best = e; } }
    if (best || home) return best; const f = u.ord, near = Math.hypot(u.x - FORT[f].core[0], u.y - FORT[f].core[1]) < 170;
    if (near) for (const o of W.objs) if (o.fort === f && live(o) && !(o.inv && o.inv())) { const d = dist(o, u); if (d < bd) { bd = d; best = o; } } return best; }
  function stepUnits() {
    for (const u of W.units) { u.t++; if (u.fl > 0) u.fl--; if (u.alpha < 1 && u.hp > 0) u.alpha = Math.min(1, u.alpha + 0.06);
      if (u.st === 'dead') { u.alpha = Math.max(0, 1 - u.t / 50); continue; } if (u.st === 'hurt') { if (u.t > 14) { u.st = 'walk'; u.t = 0; } continue; }
      const U = u.U; if (!u.tg || !live(u.tg) || G.t % 20 === (u.ph | 0) % 20) u.tg = targetFor(u);
      const e = u.tg, rg = U.rg, reach = e ? (rg ? U.reach : U.reach + G.bodyX(e) + (e.hwObj ? 20 : 0)) : 0;
      if (u.st === 'walk') { u.cd--;
        if (!e) { let hx = u.hx, hy = u.hy; if (u.def === undefined && u.ord === 'hold') { const i = W.units.indexOf(u) % 12; hx = 440 + (i % 4) * 26; hy = 575 + Math.floor(i / 4) * 34; }
          else if (u.def === undefined) { const R = ROUTE[u.ord].slice().reverse(); if (!u.ri) { let bi = 0, bd = 1e9; R.forEach((q, i) => { const d = Math.hypot(q[0] - u.x, q[1] - u.y); if (d < bd) { bd = d; bi = i; } }); u.ri = bi + 1; }
            const q = R[Math.min(u.ri - 1, R.length - 1)]; hx = q[0] + ((u.ph | 0) % 3 - 1) * 22; hy = q[1] + ((u.ph | 0) % 2 ? 14 : -10); if (Math.hypot(hx - u.x, hy - u.y) < 24 && u.ri < R.length) u.ri++; }
          const dx = hx - u.x, dy = hy - u.y; if (Math.hypot(dx, dy) > 8) { G.tryMove(u, Math.sign(dx) * Math.min(Math.abs(dx), U.sp), Math.sign(dy) * Math.min(Math.abs(dy), U.sp * 0.6)); u.face = Math.sign(dx) || u.face; u.mv = 1; } else { u.mv = 0; u.face = u.def !== undefined ? 1 : u.face; } continue; }
        const dx = e.x - u.x, dy = e.y - u.y, dd = Math.hypot(dx, dy * 1.4); if (Math.abs(dx) > 3) u.face = Math.sign(dx);
        if (dd <= reach && Math.abs(dy) < (rg ? 400 : 30 + G.bodyX(e) * 0.3)) { u.mv = 0; if (u.cd <= 0) { u.st = 'atk'; u.t = 0; u.hit = false; const r = rec(u, 'attack'); u.atkMs = (r ? Math.max(500, A.dur(r)) : 800) * 1.25; } }
        else { u.mv = 1; G.tryMove(u, Math.abs(dx) > reach * 0.7 ? Math.sign(dx) * U.sp : 0, Math.abs(dy) > 5 ? Math.sign(dy) * U.sp * 0.6 : 0); } }
      else if (u.st === 'atk') { const ms = u.t * TK;
        if (!u.hit && ms >= u.atkMs * 0.45) { u.hit = true; if (e && live(e)) { if (rg) tracer(u.x, u.y - HH() * 0.55 * S(u.y), e.x, e.y - HH() * 0.5 * S(e.y), u.k === 'gun' ? 'gun' : 'arrow', 0); else G.FX.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 10 });
            G.damageOni(e, 1, false, false, opt(e, U.atk * 1.15, u.face)); } }
        if (ms >= u.atkMs) { u.st = 'walk'; u.t = 0; u.cd = u.k === 'gun' ? 120 : u.k === 'bow' ? 70 : 46; } } }
    if (G.t % 120 === 0) W.units = W.units.filter(u => u.hp > 0 || u.alpha > 0);
    if (W.resp) W.resp = W.resp.filter(r => { if (W.t < r.t) return true; const [k, x, y] = DEFS[r.i]; mkUnit(k, BASE.x - 60, y, { def: r.i, hx: x, hy: y }); return false; }); }
  function rec(u, n) { const un = G.enemyUnit(u.U.u); if (!un) return null; const X = un.act; return n === 'attack' ? X.attack || X.atk : n === 'hurt' ? X.hit || X.hurt : n === 'dead' ? X.death || X.fall || X.hit : X.walk || X.idle; }
  function drawUnit(u) { const un = G.enemyUnit(u.U.u); if (!un) return; const s = S(u.y), base = HH() * s / (un.vm || un.refE || 140); let r = rec(u, 'walk'), fr; if (!r) return;
    if (u.st === 'atk') { const q = rec(u, 'attack'); if (q) { r = q; fr = A.frameAt(q, u.t * TK, u.atkMs); } } else if (u.st === 'hurt') { const q = rec(u, 'hurt'); if (q) { r = q; fr = A.frameAt(q, u.t * TK); } } else if (u.st === 'dead') { const q = rec(u, 'dead'); if (q) { r = q; fr = A.frameAt(q, u.t * TK); } }
    if (!fr) fr = u.mv ? A.frameAt(r, G.t * TK + u.ph) : r.f[0];
    if (u.hp > 0 && VX()) VX().draw2(ctx, 'fx_ally_circle', 0, u.x, u.y, 0.3, { sy: 0.32, a: 0.55 * u.alpha });
    A.draw(un, fr, u.x, u.y, base * (r.k || 1), u.face < 0, u.alpha);
    if (u.hp > 0 && u.hp < u.hpMax) { const w = 26 * s, y = u.y - HH() * s - 4; ctx.fillStyle = 'rgba(10,8,12,.7)'; ctx.fillRect(u.x - w / 2 - 1, y - 1, w + 2, 4); ctx.fillStyle = '#5aa0e8'; ctx.fillRect(u.x - w / 2, y, w * u.hp / u.hpMax, 2); } }
  function tracer(x0, y0, x1, y1, k, col) { if (!VX() || !VX().custom) return; const life = k === 'gun' ? 7 : k === 'orb' ? 22 : 12;
    VX().custom((o, g) => { const a = 1 - o.t / o.life, p = Math.min(1, o.t / (life * 0.7)), x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p - (k === 'arrow' ? Math.sin(p * Math.PI) * 22 : 0); g.save();
      if (k === 'gun') { g.strokeStyle = 'rgba(255,200,120,' + 0.8 * a + ')'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke(); }
      else if (k === 'orb') { g.globalCompositeOperation = 'lighter'; const c = col || '120,200,255'; g.fillStyle = 'rgba(' + c + ',' + 0.35 * a + ')'; g.beginPath(); g.arc(x, y, 11, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,' + 0.8 * a + ')'; g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); }
      else { g.strokeStyle = 'rgba(250,240,220,' + a + ')'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - Math.sign(x1 - x0) * 14, y); g.lineTo(x, y); g.stroke(); }
      g.restore(); }, life, 'o'); }

  /* ======================= 五、玄符（南方頭目） ======================= */
  function bossLines() { const k = DN('c9_s_bounty'), tide = Q.choice ? Q.choice('c10_tide') : null;
    return [nar('（核心的帷幕被撕開。一個男人踩著碎掉的本陣幕走出來，臉——跟黑符一模一樣。）'), say('玄符', '……進來了啊。晴明那個老頭，還活著。'),
      ...(k ? [蒼('（愣住）……黑符？你不是——'), say('玄符', '死了？對，我弟弟死了。死在共岸的河灣，被一個神社的小鬼砍死。'), say('玄符', '我們同一天出生，同一天被逐出陰陽寮。他的字寫得比我好……從小，就是我替他打架。'), say('玄符', '今天，我也替他打這一場。')]
        : [蒼('……黑符？'), say('玄符', '認錯人了。我是他哥哥。那傢伙膽子小，到現在還在外面躲。……也好，這座城的功勞，我一個人拿。')]),
      ...(tide === 'refuse' ? [say('玄符', '（舉起半顆發光的碎片）你們藏在奉行所的東西，我拿到了。這就是門的「鑰匙」。'), say('景綱', '（從後面追上來，臉色發白）……那是我收著的。對不起。')]
        : [say('玄符', '碎片給了海神？……沒關係。死人夠多，門自己也長得出來。')]),
      蒼('城裡的人，是你殺的。'), say('玄符', '是黃泉殺的。我只是……沒攔著。'), say('玄符', '（撒出一把黑符）起來吧，鬼族的孩子們。這座城，從今天起是你們的了。')]; }
  function spawnBoss() { const c = FORT.s.core; Q.load(['kuroonmyo'].concat(FOES.oni)).then(() => { if (!W.on) return; const e = G.spawnOni(c[0], c[1] - 50, 0, lv() + 3, 'kuroonmyo'); if (!e) return;
      Object.assign(e, { hw7: 1, hwBoss: 1, boss: true, elite: '玄符', kz: 1 }); e.hp = e.hpMax = Math.round(e.hpMax * 16); e.atk = Math.round(e.atk * 1.4); e.ratio *= 1.2; e.sumT = 600; e.boltT = 240; e.pilT = 420; W.boss = e;
      G.UI.banner('玄符', '黑符的雙胞胎哥哥'); }); }
  function bossStep(e) { if (!live(e)) return; const half = e.hp < e.hpMax * 0.5;
    if (--e.sumT <= 0) { e.sumT = half ? 900 : 1500; for (let i = 0; i < 2; i++) { const t = FOES.oni[(W.t / 60 + i) % 3 | 0], q = G.spawnOni(e.x + (i ? 70 : -70), e.y + 20, 20, lv(), t); if (q) Object.assign(q, { hw7: 1, kz: 1, route: 's', ri: 1 }); }
      G.FX.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 24 }); G.NUMS.push({ x: e.x, y: e.y - 110, v: '召鬼', t: 0 }); }
    if (--e.boltT <= 0 && H.hp > 0) { e.boltT = half ? 200 : 280; const a0 = Math.atan2((H.y - e.y) * 1.4, H.x - e.x); for (const da of [-0.25, 0, 0.25]) W.bolts.push({ x: e.x, y: e.y - 40, vx: Math.cos(a0 + da) * 4.2, vy: Math.sin(a0 + da) * 4.2 / 1.4, life: 120, atk: e.atk * 0.7 }); }
    if (--e.pilT <= 0 && H.hp > 0) { e.pilT = half ? 360 : 520; W.warns.push({ x: H.x, y: H.y, t: 0, fire: 60, r: 58, atk: e.atk * 1.15 }); } }
  function hazards() { for (const b of W.bolts) { b.x += b.vx; b.y += b.vy; b.life--; if (H.hp > 0 && Math.hypot(b.x - H.x, (b.y + 40 - H.y) * 1.4) < 26) { G.hurtHero(b.atk, b.x); b.life = 0; } } W.bolts = W.bolts.filter(b => b.life > 0 && SC.walkable(b.x, b.y + 40));
    for (const w of W.warns) { w.t++; if (w.t === w.fire) { SC.shake = 5; if (H.hp > 0 && Math.hypot(H.x - w.x, (H.y - w.y) * 1.4) < w.r) G.hurtHero(w.atk, w.x); } } W.warns = W.warns.filter(w => w.t < w.fire + 24); }

  /* ======================= 六、東面援軍 ======================= */
  const ALLY = { kama1: { key: 'b_kama', pre: 'kama1_', suf: '_left3q', nat: -1, sz: 1.0, run: 'run', atk: 'spin', fx: 'kama_spin_wake', cd: 170, m: 0.55, r: 1.2 },
    kama2: { key: 'b_kama', pre: 'kama2_', suf: '_left3q', nat: -1, sz: 0.95, run: 'run', atk: 'storm', fx: 'kama_storm_cuts', cd: 150, m: 0.3, r: 1.2, hits: 3 },
    kama3: { key: 'b_kama', pre: 'kama3_', suf: '_left3q', nat: -1, sz: 0.85, run: 'run', atk: 'heal', fx: 'kama_medicine_fog', cd: 420, heal: 1 },
    kappa: { key: 'b_kappa', pre: 'kappataisho_', suf: '_right3q', nat: 1, sz: 1.15, run: 'walk', atk: 'push', fx: 'kappataisho_water_splash', cd: 200, m: 0.7, r: 1.3 } };
  const VH = {};
  function vh(u, D) { const k = D.pre; if (VH[k]) return VH[k]; const r = u.act[D.pre + 'idle' + D.suf]; if (!r) return 200; const L = r.f.map(f => f[5]).sort((p, q) => p - q); return (VH[k] = L[L.length >> 1]); }
  function addAlly(id, x, y) { const D = ALLY[id]; A.load && Promise.resolve(A.load(D.key)).catch(() => 0); const a = { hwA: 1, id, D, x, y, face: -1, clip: 'idle', ft: 0, cd: 60 + Math.random() * 60, name: '' }; G.NPC.push(a); W.allies.push(a); return a; }
  function addAmbAlly(u, x, y, name, kind) { const a = { amb: null, kind, x, y, cd: 90 + Math.random() * 90 }; W.allies.push(a); HW.add(u, x, y, name).then(n => { if (!n) return; a.amb = n; n.hwAlly = 1; n.face = -1; }); return a; }
  function aFx(key, name, x, y, s, life) { const u = A.get(key), r = u && u.act[name]; if (!r) return; W.fx.push({ key, r, x, y, s, t: 0, life: life || r.f.length * 4 }); }
  function nearFoe(x, y, R) { let best = null, bd = R; for (const e of G.E) { if (!e.hw7 || !live(e) || e.delay > 0 || (e.hwObj && e.inv && e.inv())) continue; const d = Math.hypot(e.x - x, (e.y - y) * 1.4) - (e.hwObj ? 120 : 0); if (d < bd) { bd = d; best = e; } } return best; }
  function stepAllies() { const k = HH();
    for (const a of W.allies) { if (a.cd > 0) a.cd--;
      if (a.kind) { const n = a.amb; if (!n || a.cd > 0) continue; const e = nearFoe(n.x, n.y, 420); if (!e) continue; a.cd = 180;   /* 狐火／鬼族的刀 */
        if (a.kind === 'fox') { tracer(n.x, n.y - k * S(n.y) * 0.8, e.x, e.y - k * S(e.y) * 0.5, 'orb', '140,210,255'); G.STORY.later(14, () => { if (live(e)) G.damageOni(e, 1, false, false, opt(e, e.hwObj ? 0.15 : 0.4, Math.sign(e.x - n.x) || 1)); }); }
        else if (Math.hypot(e.x - n.x, e.y - n.y) < 90) { G.damageOni(e, 1, true, false, opt(e, 0.6, Math.sign(e.x - n.x) || 1)); G.FX.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 14 }); } else { a.cd = 10; n.x += Math.sign(e.x - n.x) * 1.6; n.y += Math.sign(e.y - n.y) * 0.8; n.walking = true; } continue; }
      const D = a.D, u = A.get(D.key); a.ft++; if (!u) continue; if (a.busy > 0 && --a.busy === 0) { a.clip = 'idle'; a.ft = 0; }
      if (D.heal) { const L = [H].concat((G.PARTY && G.PARTY.list || []).filter(p => p.hp > 0 && p.st !== 'down')); if (!(a.busy > 0)) { const tx = H.x + 70, ty = H.y + 16, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
          if (d > 30) { a.x += dx / d * 2.4; a.y += dy / d * 2.4; a.face = dx > 0 ? 1 : -1; a.clip = D.run; } else a.clip = 'idle'; }
        if (a.cd <= 0 && L.some(q => q.hp < q.hpMax) && Math.hypot(a.x - H.x, a.y - H.y) < 120) { a.cd = D.cd; a.busy = 40; a.clip = 'heal'; a.ft = 0; aFx(D.key, D.fx, H.x, H.y, 1, 40);
          for (const q of L) { const v = Math.round(q.hpMax * 0.06); q.hp = Math.min(q.hpMax, q.hp + v); } for (const q of W.units) if (q.hp > 0 && Math.hypot(q.x - H.x, q.y - H.y) < 160) q.hp = Math.min(q.hpMax, q.hp + q.hpMax * 0.2); } continue; }
      if (a.busy > 0) continue; const e = nearFoe(a.x, a.y, 520); if (!e) { a.clip = 'idle'; continue; }
      const side = a.x < e.x ? -1 : 1, tx = e.x + side * k * S(e.y) * (e.hwObj ? 1.0 : 0.6), ty = e.y + 8, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
      if (d > 6) { const sp = k * S(a.y) * 0.06; a.x += dx / d * Math.min(d, sp); a.y += dy / d * Math.min(d, sp); a.face = dx > 0 ? 1 : -1; if (a.clip !== D.run) { a.clip = D.run; a.ft = 0; } continue; }
      a.face = -side; if (a.cd > 0) { if (a.clip !== 'idle') { a.clip = 'idle'; a.ft = 0; } continue; }
      a.cd = D.cd; a.busy = 32; a.clip = D.atk; a.ft = 0; aFx(D.key, D.fx, e.x, e.y, 1.05, 32); const R = k * S(e.y) * D.r, ex = e.x, ey = e.y;
      const hit = () => { for (const q of G.E) if (q.hw7 && live(q) && Math.hypot(q.x - ex, (q.y - ey) * 1.6) < R + (q.hwObj ? 60 : 0)) G.damageOni(q, 1, true, false, opt(q, q.hwObj ? D.m * 0.5 : D.m, -side)); };
      if (D.hits) for (let i = 0; i < D.hits; i++) G.STORY.later(4 + i * 9, hit); else hit(); SC.shake = Math.max(SC.shake || 0, 3); } }
  function clipOf(u, a) { const D = a.D; return u.act[D.pre + a.clip + D.suf] || u.act[D.pre + D.run + D.suf] || u.act[D.pre + 'idle' + D.suf]; }
  function drawAlly(a) { const u = A.get(a.D.key); if (!u) return; const r = clipOf(u, a); if (!r) return; const f = r.f[Math.floor(a.ft / 4) % r.f.length], s = S(a.y), sc = HH() * s * a.D.sz / vh(u, a.D);
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#140e08'; ctx.beginPath(); ctx.ellipse(a.x, a.y, HH() * s * 0.22, HH() * s * 0.06, 0, 0, 6.283); ctx.fill(); ctx.restore();
    A.draw(u, f, a.x, a.y, sc, a.face * a.D.nat < 0, 1); }

  /* ======================= 七、每格 ======================= */
  function step() { if (!W.on) return; if (SC.id !== ID) { reset(); safeOn(); return; } if (HW.sc || G.DLG.active()) return; W.t++;
    if (W.t % 60 === 0) { W.rice += 1; for (const q of [H].concat((G.PARTY && G.PARTY.list) || []).concat(W.units)) if (q && q.hp > 0 && Math.hypot(q.x - BRZ.x, (q.y - BRZ.y) * 1.4) < 110) { q.hp = Math.min(q.hpMax, q.hp + q.hpMax * 0.02); if (q === H && G.t % 120 === 0) G.NUMS.push({ x: H.x, y: H.y - 80, v: '篝火', t: 0, col: '#ffb070' }); } }
    for (const e of G.E) if (e.hw7 && !e.hwObj && e.st === 'dead' && !e._rc) { e._rc = 1; W.rice += 2; }
    const s = S7(); if (!s.south && !W.sOff && --W.sp.s <= 0) { W.sp.s = 1200; spawnSquad('s'); } if (!s.east && --W.sp.e <= 0) { W.sp.e = W.ph < 2 ? 1800 : 1200; spawnSquad('e'); }
    stepUnits(); stepAllies(); hazards(); if (W.boss) bossStep(W.boss); if (W.bflash > 0) W.bflash--;
    /* 南方核心倒下 → 玄符 */
    const cs = W.objs.find(o => o.hwObj === 'core' && o.fort === 's'); if (cs && cs.st === 'dead' && !W.boss && !W.bossDone && !W.bossT) { W.bossT = 1; W.sOff = 1; G.DLG.start(bossLines(), spawnBoss); }
    if (W.boss && !live(W.boss)) { W.boss = null; W.bossDone = 1; W.bolts = []; W.warns = []; G.STORY.later(50, () => G.DLG.start(bossEnd(), () => { capture('s'); const d = W.done; W.done = null; end(false); d && d(); })); }
    const ce = W.objs.find(o => o.hwObj === 'core' && o.fort === 'e'); if (ce && ce.st === 'dead' && !W.eT) { W.eT = 1; G.STORY.later(40, () => G.DLG.start(eastEnd(), () => { capture('e'); const d = W.done; W.done = null; end(true); d && d(); })); }
    if (W.dur <= 0 && !W.fail) { W.fail = 1; const again = W.again; end(true); G.DLG.start([nar('（本陣的旗倒了。拒馬被衝開，傷兵往神社的方向退。）'), say('孫六', '……退！全員退到西口外面！'), say('孫六', '（喘著氣）神社的劍士，再來一次。這一次，本陣我親自守。')], () => { H.x = 180; H.y = 612; H.face = 1; again && G.STORY.later(30, again); }); } }
  function end(keepAllies) { W.on = false; G.E = G.E.filter(e => !e.hw7); W.units = []; W.objs = []; W.bolts = []; W.warns = []; W.boss = null; if (!keepAllies) { for (const a of W.allies) if (a.amb && G.AMB) G.AMB.remove(a.amb); G.NPC = G.NPC.filter(n => !n.hwA); W.allies = []; } safeOn(); }
  function start(ph, done, again, keepA) { reset(keepA); W.on = true; W.ph = ph; W.done = done; W.again = again; W.rice = ph === 2 ? 260 : 200; W.dur = 100; W.t = 0; W.sp = { s: 360, e: ph === 2 ? 240 : 900 }; W.sOff = 0; W.bossT = 0; W.bossDone = 0; W.eT = 0; W.fail = 0; W.resp = []; W.ord = 'hold';
    safeOff(); Q.load(['yaribushi', 'ashiyumi', 'ashigun', 'yomigun'].concat(ph === 1 ? FOES.s : FOES.e)).then(() => { if (!W.on) return; defenders(); forts(); }); }

  /* ======================= 八、畫面 ======================= */
  (function hook() { if (!(G.OCC && G.OCC.add && G.drawFx && G.PARTY && G.PARTY.tap && G.drawNpc && G.drawOni)) return setTimeout(hook, 40);
    const oa0 = G.OCC.add; G.OCC.add = function (L) { oa0.call(this, L); if (W.on && SC.id === ID) for (const u of W.units) if (u.alpha > 0) L.push({ y: u.y, oc: { hwU: u } }); };
    const od0 = G.OCC.draw; G.OCC.draw = function (o) { if (o && o.hwU) { try { drawUnit(o.hwU); } catch (x) { console.warn('hw7u', x); } return; } return od0.call(this, o); };
    const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n && n.hwA) { try { drawAlly(n); } catch (x) { console.warn('hw7a', x); } return; } return dn0.apply(this, arguments); };
    const do0 = G.drawOni; G.drawOni = function (e) { if (e && e.hwObj) return drawObj(e); if (e && e.hwBoss && e.st !== 'dead') { const s = S(e.y), r = HH() * s * 0.9, pu = 0.5 + 0.25 * Math.sin(G.t * 0.09);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(e.x, e.y, r * 0.1, e.x, e.y, r * 1.2); g.addColorStop(0, `rgba(140,50,200,${0.5 * pu})`); g.addColorStop(1, 'rgba(60,10,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 1.2, r * 0.42, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgba(190,110,255,${0.55 * pu})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, r * (0.8 + 0.1 * Math.sin(G.t * 0.07)), r * 0.28, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
      return do0.apply(this, arguments); };
    const fx0 = G.drawFx; G.drawFx = function () { const r = fx0.apply(this, arguments); try { if (SC.id === ID) drawFx(); } catch (x) { console.warn('hw7fx', x); } return r; };
    const tp0 = G.PARTY.tap; G.PARTY.tap = function (p) { if (W.on && SC.id === ID && !G.DLG.active()) for (let i = W.bt.length - 1; i >= 0; i--) { const b = W.bt[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.f(); return true; } } return tp0.call(this, p); }; })();
  function drawObj(e) { if (e.st === 'dead' && e.hwObj === 'abatis') { VX() && VX().draw2(ctx, 'war_abatis', 2, e.x, e.y, 1.0, { a: 0.6 }); return; } if (e.st === 'dead') return;
    if (e.hwObj === 'abatis') { VX() && VX().draw2(ctx, 'war_abatis', e.hp < e.hpMax * 0.5 ? 1 : 0, e.x, e.y, 1.0); if (e.flash > 0 && VX()) { ctx.save(); ctx.globalAlpha = 0.3; VX().draw2(ctx, 'war_abatis', 0, e.x, e.y, 1.0, { add: 1 }); ctx.restore(); } }
    const w = e.hwObj === 'core' ? 70 : 40, y = e.y + (e.hwObj === 'core' ? -HH() * S(e.y) * 1.25 : 10), inv = e.inv && e.inv();
    if (e.hwObj === 'core' || e.hp < e.hpMax) { ctx.fillStyle = 'rgba(10,8,12,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 6); ctx.fillStyle = inv ? '#7a6a8a' : '#e0705a'; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 4); } }
  function drawFx() { for (let i = W.fx.length - 1; i >= 0; i--) { const q = W.fx[i]; q.t++; if (q.t > q.life) { W.fx.splice(i, 1); continue; } const u = A.get(q.key); if (!u) continue;
      const f = q.r.f[Math.min(q.r.f.length - 1, Math.floor(q.t / q.life * q.r.f.length))], s = S(q.y), sz = HH() * s * q.s * 1.25 / vh(u, q.key === 'b_kappa' ? ALLY.kappa : ALLY.kama1), al = Math.min(1, (q.life - q.t) / 8);
      A.draw(u, f, q.x, q.y, sz, false, al); ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.draw(u, f, q.x, q.y, sz, false, al * 0.5); ctx.restore(); }
    for (const b of W.bolts) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,70,220,.45)'; ctx.fillRect(-12, -7, 24, 14); ctx.restore();
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.fillStyle = '#2a1a30'; ctx.fillRect(-8, -4, 16, 8); ctx.fillStyle = '#c8a0ff'; ctx.fillRect(-5, -1, 10, 2); ctx.restore(); }
    for (const w of W.warns) { const s = S(w.y), p = Math.min(1, w.t / w.fire); ctx.save();
      if (w.t < w.fire) { ctx.strokeStyle = `rgba(190,90,255,${0.5 + 0.4 * p})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r, w.r * 0.36, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = `rgba(120,40,170,${0.25 * p})`; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r * p, w.r * 0.36 * p, 0, 0, 6.283); ctx.fill(); }
      else { const a = 1 - (w.t - w.fire) / 24, h = HH() * s * 2.2; const g = ctx.createLinearGradient(0, w.y - h, 0, w.y); g.addColorStop(0, 'rgba(60,10,90,0)'); g.addColorStop(1, `rgba(170,80,255,${0.75 * a})`); ctx.fillStyle = g; ctx.globalCompositeOperation = 'lighter'; ctx.fillRect(w.x - w.r * 0.55, w.y - h, w.r * 1.1, h); }
      ctx.restore(); } }
  /* HUD：上方本陣耐久＋兵糧；左側出兵／指令 */
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); if (!W.on || SC.id !== ID || HW.sc) return; try { hud(); } catch (x) { console.warn('hw7hud', x); } };
  function btn(x, y, w, h, label, sub, f, on, off) { ctx.fillStyle = off ? 'rgba(40,34,36,.82)' : on ? 'rgba(150,92,36,.95)' : 'rgba(30,22,20,.88)'; G.rr(x, y, w, h, 6); ctx.fill(); ctx.strokeStyle = off ? 'rgba(227,194,122,.2)' : 'rgba(227,194,122,.6)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 6); ctx.stroke();
    G.txt(label, x + (sub ? 8 : w / 2), y + h / 2 + 1, 11, off ? 'rgba(240,230,210,.4)' : G.C.ink || '#f3ead8', sub ? 'left' : 'center', G.FONT, 800); if (sub) G.txt(sub, x + w - 8, y + h / 2 + 1, 10, off ? 'rgba(227,194,122,.35)' : G.C.gold, 'right', G.FONT, 700); W.bt.push({ x, y, w, h, f }); }
  function hud() { W.bt = []; const top = 44 + (G.SAFE ? G.SAFE.t : 0) + (G.E.some(e => e.boss && live(e)) ? 30 : 0), bw = 190, bx = (G.LW - bw) / 2;   /* 頭目在場時讓出上方的頭目血條 */
    ctx.fillStyle = 'rgba(12,8,10,.72)'; G.rr(bx - 8, top - 4, bw + 16, 30, 8); ctx.fill(); G.txt('本陣', bx, top + 6, 10, G.C.gold, 'left', G.FONT, 800); G.txt('兵糧 ' + Math.floor(W.rice), bx + bw, top + 6, 10, '#f0d9a0', 'right', G.FONT, 800);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(bx, top + 15, bw, 5); ctx.fillStyle = W.bflash > 0 ? '#ff8060' : W.dur > 35 ? '#7ccf7a' : '#e0705a'; ctx.fillRect(bx, top + 15, bw * Math.max(0, W.dur) / 100, 5);
    const sl = (G.SAFE && G.SAFE.l) || 0, x = 10 + sl, w = 96, h = 30; let y = Math.round(G.LH * 0.3);
    ctx.fillStyle = 'rgba(12,8,10,.6)'; G.rr(x - 4, y - 22, w + 8, 22 + (h + 5) * 5 + 30, 8); ctx.fill(); G.txt('出兵（3 人一隊）', x + w / 2, y - 11, 10, G.C.gold, 'center', G.FONT, 800);
    for (const k of ['spear', 'bow', 'gun']) { const U = UN()[k]; if (!U) continue; btn(x, y, w, h, U.n.replace('足輕', ''), String(COST[k]), () => deploy(k), false, W.rice < COST[k]); y += h + 5; }
    G.txt('指令', x + w / 2, y + 7, 10, G.C.gold, 'center', G.FONT, 800); y += 16; const s = S7(), ow = (w - 6) / 3;
    btn(x, y, ow, h, '守', null, () => setOrd('hold'), W.ord === 'hold'); btn(x + ow + 3, y, ow, h, '攻南', null, () => setOrd('s'), W.ord === 's', s.south); btn(x + (ow + 3) * 2, y, ow, h, '攻東', null, () => setOrd('e'), W.ord === 'e', s.east); }

  /* ======================= 九、劇情 ======================= */
  const bossEnd = () => { const k = DN('c9_s_bounty'), tide = Q.choice ? Q.choice('c10_tide') : null;
    return [nar('（玄符跪在地上。身上的符紙一張一張燒起來。）'), say('玄符', '……門……還沒開好……道摩大人……'),
      k ? say('玄符', '……弟弟。哥哥……還是沒替你打贏。') : say('玄符', '……黑符，別回來。這座城……不是我們的。'),
      say('玄符', '你們以為打倒我就結束了？……北邊的門，現在不靠我也活得下去。它餓了，它會自己找吃的。'), nar('（玄符化成一堆黑符，被風吹散。）'),
      ...(tide === 'refuse' ? [nar('（碎片滾到景綱腳邊。景綱彎腰撿起來，握得很緊。）'), say('景綱', '這次，我親手交給神社。')] : []),
      say('冬馬', '（從南大街跑上來，揮著槍）隊長！南邊……南邊的旗子倒了！'), say('孫六', '（遠遠地）把我們的旗插上去！快！')]; };
  const eastEnd = () => [nar('（妖穴的核心碎了。裂口還在冒黑霧。）'), 雪('（走到裂口前，把手按在地上）……這裡不是門。是門的「根」。'),
    nar('（白光從小雪的掌心往外擴散，黑霧一層層退開。妖穴變成了一片焦土。）'), 雪('（站起來，看向北方）……還有一條根，在北邊。'),
    say('河童大將', '（從運河裡探出頭）哈！東邊乾淨了！人類，下一個在哪？'), say('孫六', '……北面。城門前。'), say('孫六', '今晚先休息。天亮之前，我們打最後一場。')];
  function w7a(q, done) { G.DLG.start([
      say('冬馬', '（看見你們從西口走來，愣住，然後大喊）隊長！神社的劍士回來了！他們回來了！'), say('孫六', '（從拒馬後面站起來，手臂的布換過三次了）……慢。'), say('孫六', '你們走了七天。七天，這座本陣被打了二十一次。'),
      蒼('守住了。'), say('孫六', '（哼了一聲，嘴角卻在笑）廢話。'), 雪('後山的門關上了。……城北那一道，現在餓了。'),
      say('景綱', '（攤開一張手畫的地圖）城北的門，玄符的人守著兩條路：南大街，還有東邊的焦土。'), say('景綱', '南大街上是道摩軍的本陣。東邊……是妖穴。黃泉之氣從地底噴出來的地方，一直有東西爬出來。'),
      say('景綱', '先打南。玄符在南邊。打下南邊，城北的門就沒人餵了。'), ...P('ibaraki', '茨木', '（看著東邊的黑霧）……東邊那個洞，連鬼族都不想靠近。'),
      say('文也', '（抱著帳冊，眼睛很紅）……蒼真。我把名字都問回來了。二十四個人，二十四個名字。'), say('文也', '等城回來，我要把它們刻在私塾的門柱上。')], done); }
  function w7b(q, done) { if (S7().south) return done(); const go = () => start(1, done, () => w7b(q, done));
    if (F().hw7b_intro) return go(); G.DLG.start([
      say('孫六', '本陣的兵，分你一半指揮。'), say('孫六', '兵糧在這裡。看到左邊的令牌了嗎——槍、弓、鐵砲。有兵糧，就能叫出一隊。'), say('孫六', '下令「攻南」，他們就沿著大街打過去；「守」，就守在拒馬後面。'),
      say('冬馬', '篝火旁邊站一會兒，傷會好得快。……隊長說的。'), say('孫六', '我沒說過。'), say('孫六', '南方的本陣前面有三座拒馬。不先打壞，碰不到他們的幕。'),
      say('孫六', '還有——本陣要是被衝破，就全部退回西口外面。別逞強。'), 蒼('知道了。'), act(() => { F().hw7b_intro = 1; G.SAVE.markDirty(); })], go); }
  function w7c(q, done) { if (S7().east) return done(); const go = () => { start(2, done, () => w7c(q, done)); placeAllies(); };
    if (F().hw7c_intro) return go(); reset(); W.on = false; H.x = 1000; H.y = 430; H.face = 1; G.CAMLOOK = { x: 1400, y: 540 };
    const ld = ['b_kama', 'b_kappa'].map(k => Promise.resolve(A.load && A.load(k)).catch(() => 0)); let k1, k2, k3, kp;
    Promise.all(ld).then(() => { k1 = addAlly('kama1', 1650, 540); k2 = addAlly('kama2', 1660, 590); k3 = addAlly('kama3', 1650, 640); for (const a of [k1, k2, k3]) a.clip = 'run';
      HW.run([{ wait: 30 }, { say: [nar('（東邊的焦土上，妖穴噴出的黑霧，突然被一陣風吹散。）'), nar('（風裡，三道翠綠的影子。）')] },
        { wait: 90, tick: t => { for (const [a, x, y] of [[k1, 1430, 560], [k2, 1480, 610], [k3, 1530, 650]]) { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy); if (d > 3) { a.x += dx / d * 3.2; a.y += dy / d * 3.2; a.face = -1; a.ft++; } else a.clip = 'idle'; } } },
        { say: [say('鎌鼬', '（長兄落在東面街口，背上的藥袋晃了晃）風乾淨了。……還差一點。'), nar('（次兄沒有說話。刀光一閃，撲上來的醜女被切成兩半。）')], fn: () => { k2.clip = 'storm'; k2.ft = 0; aFx('b_kama', 'kama_storm_cuts', 1420, 600, 1.1, 34); } },
        { wait: 40, fn: () => { kp = addAlly('kappa', 1300, 700); kp.clip = 'idle'; aFx('b_kappa', 'kappataisho_water_splash', 1300, 700, 1.2, 36); }, tick: t => { if (kp) { kp.y = 700 - Math.min(40, t) * 1.2; } } },
        { say: () => [nar('（運河裡冒出一排綠色的頭。）'), say('河童大將', '喂——！人類！河是我們的地盤！誰准你們把河弄髒的！')] },
        { wait: 60, fn: () => { addAmbAlly('n_t_fox_elder', 1600, 600, '狐族長者', 'fox'); addAmbAlly('n_sagitsune', 1630, 650, '砂狐', 'fox'); if (F().oniFriend) addAmbAlly('n_t_oni_veteran', 1560, 700, '鬼鍛冶權六', 'oni'); } },
        { say: () => [say('狐族長者', '（砂狐扶著狐族長者，從東面入口走進來）人類守城西，我們妖怪守城東。……當年說好的。'), say('砂狐', '（對蒼真眨眼）珍品攤我暫時收了。現在賣的是狐火，一盞不收錢。'),
          ...(F().foxFriend ? [say('狐族長者', '九尾大人說，那個巫女的城，就是狐族的城。')] : []), ...(F().kappaFriend ? [say('河童大將', '恩人的城！河童一族，一步都不退！')] : []),
          ...(F().oniFriend ? [nar('（北面的巷子裡傳來一聲大吼：「鬼族的刀，借你們用！」權六扛著大槌殺了出來。）')] : []),
          ...(!F().foxFriend && !F().kappaFriend && !F().oniFriend ? [say('狐族長者', '……我們跟人類不熟。可是黃泉，是所有活著的東西的敵人。')] : []),
          ...P('ibaraki', '茨木', '（看著妖怪們擺開陣勢）……人和妖，站在同一條街上。三百年了，我第一次看到。'), 雪('伊邪那美大人說的……「只要有人願意分擔」。'),
          say('鎌鼬', '妖穴交給我們。你們顧好自己的本陣。'), act(() => { F().hw7c_intro = 1; G.SAVE.markDirty(); })] }
      ], () => { G.CAMLOOK = null; start(2, done, () => w7c(q, done), true); }); }); }
  function placeAllies() { if (W.allies.length) return; Promise.all(['b_kama', 'b_kappa'].map(k => Promise.resolve(A.load && A.load(k)).catch(() => 0))).then(() => { if (!W.on || W.allies.length) return;
      addAlly('kama1', 1430, 560); addAlly('kama2', 1480, 610); addAlly('kama3', 1530, 650); addAlly('kappa', 1300, 660); addAmbAlly('n_t_fox_elder', 1600, 600, '狐族長者', 'fox'); addAmbAlly('n_sagitsune', 1630, 650, '砂狐', 'fox'); if (F().oniFriend) addAmbAlly('n_t_oni_veteran', 1560, 700, '鬼鍛冶權六', 'oni'); }); }

  /* ======================= 十、任務登錄與掛鉤 ======================= */
  const T = (map, text, run, o) => Object.assign({ t: 'fn', map, text, run }, o || {});
  Q.add({ id: 'hw7', ch: 11, main: true, postBoss: true, after: 'c11_after', title: '城內爭奪', desc: '後山的門關上了。城北那一道，現在餓了。', reward: { exp: 900, gold: 700 },
    steps: [T(ID, '回兩岸城西口的本陣', w7a), T(ID, '攻下南方道摩軍本陣', w7b, { skip: () => !!S7().south }), T(ID, '和援軍一起攻下東方妖穴', w7c, { skip: () => !!S7().east })] });
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); try { step(); } catch (e) { console.warn('hw7', e); } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { if (W.on || W.allies.length) { reset(); } en0(id); if (id === ID) HW.forts7(); };
  /* 戰火～奪回前：軍奉行不進城（他和孫六用同一張圖） */
  if (G.AMB) { const aa0 = G.AMB.add; G.AMB.add = function (u, x, y, o) { if (o && o.kzb && SC.id === ID) { const p = HW.phase(); if (p === 'sealed' || p === 'w6' || p === 'base' || p === 'battle') return Promise.resolve(null); } return aa0.apply(this, arguments); }; }
  /* 世界事件：戰火～奪回前不在兩岸城發生（城裡已是戰場） */
  (function hkEV() { if (!G.EV || !G.EV.world) return setTimeout(hkEV, 60); const w0 = G.EV.world; G.EV.world = function () { const w = w0.apply(this, arguments), p = HW.phase();
      if (w && w.map === ID && !w.done && (p === 'sealed' || p === 'w6' || p === 'base' || p === 'battle')) { w.done = 1; w.until = Math.min(w.until || 0, Date.now() + 120000); } return w; }; })();
  HW.W7 = { start, deploy, setOrd, capture, w7a, w7b, w7c, reset };
})();
