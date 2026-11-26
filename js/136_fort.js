/* ==========================================================================
 * 神諭之地 重製版 — 136_fort.js
 * Version : r3.108.0  (2026-11-26)
 * 變更    : r3.108.0 新增。事件陣地重做、封印石、雜物特殊效果。
 *           一、事件陣地（取代 22_event 的 EV.fort；山賊據點／浪人團／道摩軍；妖怪入侵不再擺）：
 *             ・以出怪中心為圓心「布陣」：前排路障（拒馬／逆茂木／竹束）呈弧形面向主角來的方向，後排敵旗，中央篝火；種類與數量隨機但有上限（篝火最多 1、敵旗最多 2）。
 *             ・效果只對敵人：敵旗＝半徑內敵人受到傷害 −25%；篝火＝半徑內敵人每秒回 2% 生命；路障＝主角過不去，要打破；大筒（道摩）照舊砲擊。
 *             ・血量很低：路障 4 下、敵旗 3 下、篝火 2 下（走到旁邊按攻擊鍵＝敲一下）。第一次靠近會說明作用。
 *             ・事件結束（完成、失敗、時間到）：還沒打破的陣地物件淡出消失，並提示「陣地撤走了」。
 *           二、封印石（obj_hidden_boss_seal）：野外地圖 30% 機率出現 1 座（村莊、城鎮、神社、頭目地圖不出現）；敲 3 下解開，
 *             放出「封印精英」（血 ×6、攻 ×1.5、比難度多 1 條詞綴、體型 ×1.3）；打倒必掉稀品以上裝備＋難度素材。本次遊玩同一地點只出現一次。
 *           三、雜物特殊效果（24_nav 打破時呼叫 G.BRKFX）：陶甕 15% 跳出小妖、竹籬 50% 掉精品以上裝備、石燈籠回 10% 生命、
 *             注連繩柱削掉附近精英 1 條詞綴、冰柱凍住周圍敵人 1 秒、雪堆加倍素材（20% 靈砂）、熔岩石爆炸（太近也會炸到自己）、
 *             枯木燃燒周圍敵人、雲石落下錢雨、破損石像喚醒守護精英。每種第一次打破時說明。
 * 存檔    : flags.fortSeen{}、flags.brkSeen{}（說明只出現一次）。
 * 依賴    : 22_event（EV.cur／wprops、drawNpc 的 wp 繪製、大筒邏輯）、24_nav（breakable／BRKFX）、131_foes（initAff）、134_econ（ECON）、
 *           86_fx2（VX）、130_icons（ICO.burst）、03_actors（damageOni／spawnOni／heroStep）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, HH = () => G.HERO_H, S = y => SC.depth(y), ctx = G.ctx, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const F = () => G.SAVE.data.flags, gi = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1), seen = (box, k, msg) => { const f = F(), b = f[box] || (f[box] = {}); if (b[k]) return; b[k] = 1; G.SAVE.markDirty(); G.UI.toast(msg); };
  /* ======================= 一、事件陣地 ======================= */
  const T = { fence: ['war_fence', '拒馬', 'bar', 4, 0.95], abatis: ['war_abatis', '逆茂木', 'bar', 4, 1], bamboo: ['war_bamboo', '竹束', 'bar', 4, 1], banner: ['war_banner_enemy', '敵旗', 'ban', 3, 0.75], brazier: ['war_brazier', '篝火', 'fire', 2, 0.9] };
  const INFO = { bar: '路障：擋住去路，打破才能通過（靠近按攻擊鍵）', ban: '敵旗：附近的敵人受到的傷害 −25%，先打破它', fire: '篝火：附近的敵人每秒回復生命，先打破它' };
  let FT = [];
  function put(t, x, y, o) { const D = T[t]; let q = [x, y]; if (SC.snap) q = SC.snap(x, y, 'open', 120) || q; const n = Object.assign({ wp: 1, ft: 1, t, s: D[0], name: D[1], role: D[2], hp: D[3], hpM: D[3], k: D[4], x: q[0], y: q[1], face: 1, t0: G.t }, o || {});
    G.NPC.push(n); if (G.EV.wprops) G.EV.wprops.push(n); FT.push(n); return n; }
  /* 布陣：f＝朝主角的方向（前排面向主角） */
  function layout(kind, x, y, c) { const f = Math.sign(H.x - x) || 1, L = [], arc = (n, R) => { const sp = n === 1 ? [0] : n === 2 ? [-0.5, 0.5] : [-0.75, 0, 0.75]; return sp.map(a => [x + f * R * Math.cos(a), y + R * 0.5 * Math.sin(a)]); };
    if (kind === 'camp') { arc(2 + (Math.random() < 0.5 ? 1 : 0), 170).forEach(p => L.push(put(pick(['fence', 'abatis', 'bamboo']), p[0], p[1]))); const nb = 1 + (Math.random() < 0.5 ? 1 : 0);
      (nb === 1 ? [[x - f * 70, y - 40]] : [[x - f * 70, y - 70], [x - f * 70, y + 30]]).forEach(p => L.push(put('banner', p[0], p[1]))); if (Math.random() < 0.6) L.push(put('brazier', x, y)); }
    else if (kind === 'ronin') { arc(1 + (Math.random() < 0.5 ? 1 : 0), 150).forEach(p => L.push(put(pick(['fence', 'bamboo']), p[0], p[1]))); L.push(put('banner', x - f * 60, y - 50)); if (Math.random() < 0.5) L.push(put('brazier', x, y + 10)); }
    else if (kind === 'doma') { arc(2, 180).forEach(p => L.push(put(pick(['fence', 'abatis']), p[0], p[1]))); L.push(put('banner', x - f * 40, y - 80), put('banner', x - f * 40, y + 50));
      let q = [x - f * 90, y]; if (SC.snap) q = SC.snap(q[0], q[1], 'open', 120) || q; const cn = { wp: 1, s: 'war_cannon', x: q[0], y: q[1], k: 1, face: -f < 0 ? -1 : 1, cannon: 1, cd: 300, t0: G.t }; G.NPC.push(cn); G.EV.wprops.push(cn); if (c) c.cannon = cn; }
    return L; }
  (function hookFort() { const EV = G.EV; if (!EV || !EV.fort || !G.VX) return setTimeout(hookFort, 60); if (EV._ft) return; EV._ft = 1;
    EV.fort = function (p, kind, c) { if (kind === 'invade') return []; return layout(kind, p[0], p[1], c); }; })();
  const alive = o => o && !o.dead && FT.includes(o);
  function hitObj(o) { if (!alive(o)) return; o.hp--; o.fl = 8; SC.shake = Math.max(SC.shake || 0, 3); G.AU && G.AU.sfx && G.AU.sfx('hit'); if (G.VX && G.VX.debris2) G.VX.debris2({ x: o.x, y: o.y, n: 3, spd: 0.6, k: 0.7 });
    if (o.hp > 0) return; o.dead = 1; o.deadT = G.t; G.FX.push({ k: 'dust', x: o.x, y: o.y, t: 0, life: 20 }); G.UI.toast('打破了' + o.name); }
  /* 互動：靠近陣地物件＝攻擊鍵敲一下 */
  (function hookStep() { if (!G.STORY || !G.STORY.step) return setTimeout(hookStep, 60); const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
      if (G.UI.near && !G.UI.near.amb) return; let best = 62, pk = null;
      for (const o of FT) { if (!alive(o)) continue; const d = Math.hypot(H.x - o.x, (H.y - o.y) * 1.6); if (d < best) { best = d; pk = o; } }
      if (SEAL && !SEAL.dead) { const d = Math.hypot(H.x - SEAL.x, (H.y - SEAL.y) * 1.6); if (d < Math.max(best, 70)) { pk = SEAL; } }
      if (!pk) return; if (pk.ft) seen('fortSeen', pk.role, INFO[pk.role]); else seen('fortSeen', 'seal', '封印石：敲 3 下會解開封印，放出強大的精英');
      G.UI.near = { label: '破壞・' + pk.name + '（' + pk.hp + '）', kind: 'look', run: () => pk.ft ? hitObj(pk) : hitSeal() }; }; })();
  /* 效果：只對敵人 */
  const inR = (e, o, r) => Math.hypot(e.x - o.x, (e.y - o.y) * 1.6) < r * S(o.y);
  const dm0 = G.damageOni; G.damageOni = function (e, mult) { if (e && FT.length && !e.bb) for (const o of FT) if (o.role === 'ban' && alive(o) && inR(e, o, 230)) { arguments[1] = mult * 0.75; break; } return dm0.apply(this, arguments); };
  (function hookHero() { if (!G.heroStep) return setTimeout(hookHero, 60); const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments); if (!FT.length) return r;
      for (const o of FT) { if (!alive(o)) continue;
        if (o.role === 'bar') { const rr = 34 * S(o.y) * o.k, dx = H.x - o.x, dy = (H.y - o.y) * 2.2, d = Math.hypot(dx, dy); if (d < rr && d > 0.01) { const nx = o.x + dx / d * rr, ny = o.y + dy / d * rr / 2.2; if (SC.walkable(nx, ny)) { H.x = nx; H.y = ny; } } }
        if (o.role === 'fire' && G.t % 60 === 0) for (const e of G.E) if (e.st !== 'dead' && e.hp > 0 && e.hp < e.hpMax && !e.bb && inR(e, o, 190)) { const v = Math.round(e.hpMax * 0.02); e.hp = Math.min(e.hpMax, e.hp + v); G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) * (e.ratio || 1) - 6, v: '+' + v, heal: true, t: 0 }); } }
      /* 事件結束：還沒打破的淡出消失 */
      const c = G.EV && G.EV.cur; if (G.t % 20 === 0 && (!c || c.done)) { let any = 0; for (const o of FT) if (!o.dead) { o.dead = 1; o.deadT = G.t; o.gone = 1; any = 1; } if (any) G.UI.toast('事件結束，陣地撤走了'); if (G.NPC.some(n => n.cannon)) { G.NPC = G.NPC.filter(n => !n.cannon); if (G.EV.wprops) G.EV.wprops = G.EV.wprops.filter(n => !n.cannon); } }
      for (const o of FT.slice()) if (o.dead && G.t - o.deadT > 40) { FT.splice(FT.indexOf(o), 1); G.NPC = G.NPC.filter(n => n !== o); if (G.EV.wprops) G.EV.wprops = G.EV.wprops.filter(n => n !== o); }
      return r; }; })();
  /* 繪製：效果範圍柔光（無外框線）＋受擊閃白＋淡出 */
  function aura(o, r, col) { const s = S(o.y), R = r * s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y); ctx.scale(1, 0.34); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    const a = 0.16 + 0.06 * Math.sin(G.t * 0.06 + o.x); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(0.7, 'rgba(' + col + ',' + a * 0.5 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill(); ctx.restore(); }
  (function hookDraw() { if (!G.drawNpc || !G.EV || !G.EV._ft) return setTimeout(hookDraw, 60); const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n || !n.ft) return dn0.apply(this, arguments);
      if (!n.dead) { if (n.role === 'ban') aura(n, 230, '230,80,60'); else if (n.role === 'fire') aura(n, 190, '255,150,70'); }
      const a = n.dead ? Math.max(0, 1 - (G.t - n.deadT) / 40) : 1; ctx.save(); ctx.globalAlpha *= a; const r = dn0.apply(this, arguments); ctx.restore();
      if (n.fl > 0) { n.fl--; } if (!n.dead && Math.hypot(H.x - n.x, H.y - n.y) < 160) { const s = S(n.y); for (let i = 0; i < n.hpM; i++) { ctx.fillStyle = i < n.hp ? 'rgba(240,200,120,.95)' : 'rgba(60,40,30,.7)'; G.rr(n.x + (i - (n.hpM - 1) / 2) * 9 * s - 3 * s, n.y - HH() * s * 1.1 * n.k, 6 * s, 4 * s, 1.5); ctx.fill(); } }
      return r; }; })();
  /* ======================= 二、封印石 ======================= */
  let SEAL = null; const GONE = {}, IMG = new Image(); IMG.src = 'a/p/objs/obj_hidden_boss_seal.webp?v=' + G.VER;
  const meta = id => (G.WORLD && G.WORLD.meta && G.WORLD.meta[id]) || {};
  const okMap = (id, d) => d && !d.safe && !d.town && !meta(id).town && !meta(id).safe && !d.hub && !d.boss && !d.quest && (d.spawn || meta(id).spawn || (G.STORY.autoSpawnOk && G.STORY.autoSpawnOk(id))) && !/^(hub_|T_|X_|A_|WAR_)/.test(id) && !(G.HUB && G.HUB.bossOf && G.HUB.bossOf(G.HUB.chOf ? G.HUB.chOf(id) : 0) === id);
  function placeSeal(id, force) { SEAL = null; const d = G.D.scenes[id]; if (!okMap(id, d) || GONE[id] || (!force && Math.random() >= 0.3)) return;
    G.STORY.later(50, () => { if (SC.id !== id) return; const avoid = [[H.x, H.y]].concat((d.portals || []).map(p => p.line ? [p.line[0][0], p.line[0][1]] : [0, 0])); const q = SC.randSpot && SC.randSpot('edge', null, avoid, 220); if (!q) return;
      SEAL = { seal: 1, name: '封印石', x: q[0], y: q[1], hp: 3, hpM: 3, t: 0, map: id }; G.NPC.push(SEAL); }); }
  function hitSeal() { const o = SEAL; if (!o || o.dead) return; o.hp--; o.fl = 10; SC.shake = Math.max(SC.shake || 0, 4); if (G.ICO) G.ICO.burst({ x: o.x, y: o.y }, 'fxp_talisman', 3, { z: 0.8 });
    if (o.hp > 0) return; o.dead = 1; o.deadT = G.t; GONE[o.map] = 1; if (G.ICO) G.ICO.burst({ x: o.x, y: o.y }, 'fxp_rock_chip', 8, { z: 0.6, k: 1.3 }); SC.shake = 8; spawnSeal(o); }
  function spawnSeal(o) { const d = SC.def, L = (d.foes || []).filter(t => G.enemyUnit(t)), pref = L.filter(t => G.FOES && /giant|armor|assault/.test(G.FOES.classOf(t))), ty = pick(pref.length ? pref : L.length ? L : ['akaoni']);
    const e = G.spawnOni(o.x + 30, o.y + 10, 30, (d.lv || 1) + 3, ty); if (!e) return; e.elite = '封印精英'; e._seal = 1; e.hp = e.hpMax = Math.round(e.hpMax * 6); e.atk = Math.round(e.atk * 1.5); e.ratio = (e.ratio || 1) * 1.3;
    if (G.FOES && G.FOES.initAff) G.FOES.initAff(e, 1); G.UI.banner('封印解開', '被封住的妖怪醒了——' + (e._af && G.FOES ? e._af.map(k => G.FOES.AFX[k]).join('・') : '')); }
  const R = G.RPG, k0 = R.onKill; R.onKill = function (e) { const r = k0.apply(this, arguments); try { if (e && e._seal && !e._sealDone) { e._sealDone = 1; let it = null; for (let i = 0; i < 80; i++) { it = R.roll((e.lv || 1) + 2, SC.def.region || 'wind'); if (it.q >= 3) break; } if (it.q < 3) it.q = 3;
        G.LOOT.push({ x: e.x, y: e.y, t: 0, kind: 'item', it }); const g = gi(); const dm = g >= 3 ? 'shura' : g >= 2 ? 'yosho' : g >= 1 ? 'reisa' : null; if (dm) G.LOOT.push({ x: e.x + 20, y: e.y + 6, t: 0, kind: 'dm', id: dm, n: 1 + (dm === 'reisa' ? 1 : 0) });
        G.UI.banner('封印精英　討伐', '得到了稀品以上的裝備'); } } catch (x) { console.warn('seal', x); } return r; };
  (function hookSealDraw() { if (!G.drawNpc) return setTimeout(hookSealDraw, 60); const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n || !n.seal) return dn0.apply(this, arguments); if (!IMG.complete || !IMG.naturalWidth) return;
      const s = S(n.y), sc = HH() * s / 256, w = IMG.naturalWidth * sc, h = IMG.naturalHeight * sc, a = n.dead ? Math.max(0, 1 - (G.t - n.deadT) / 30) : Math.min(1, ++n.t / 20); if (n.dead && a <= 0) { G.NPC = G.NPC.filter(q => q !== n); return; }
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(1, 0.28); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); sg.addColorStop(0, 'rgba(25,16,8,.5)'); sg.addColorStop(1, 'rgba(25,16,8,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, w * 0.5, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a; if (n.fl > 0) { n.fl--; ctx.translate((Math.random() - 0.5) * 3, 0); } ctx.drawImage(IMG, n.x - w / 2, n.y - h, w, h); ctx.restore();
      if (!n.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gy = n.y - h * 0.55, R2 = w * 0.6, g = ctx.createRadialGradient(n.x, gy, 0, n.x, gy, R2), p = 0.12 + 0.08 * Math.sin(G.t * 0.05); g.addColorStop(0, 'rgba(200,60,50,' + p + ')'); g.addColorStop(1, 'rgba(200,60,50,0)'); ctx.fillStyle = g; ctx.fillRect(n.x - R2, gy - R2, R2 * 2, R2 * 2); ctx.restore(); } }; })();
  /* 換圖：清陣地、放封印石 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { FT = []; SEAL = null; const r = en0(id); try { placeSeal(id); } catch (x) { console.warn('seal place', x); } return r; };
  /* ======================= 三、雜物特殊效果 ======================= */
  const BI = { jar: '陶甕：有時候裡面躲著小妖', bamboo_fence: '竹籬：後面常藏著好東西', stone_lantern: '石燈籠：打破會放出狐火，回復生命', shimenawa_post: '注連繩柱：打破會削弱附近精英（少 1 條詞綴）',
    ice_pillar: '冰柱：碎裂時凍住周圍的敵人', snow_pile: '雪堆：常挖出加倍的素材', lava_rock: '熔岩石：會爆炸——離太近也會被炸到', dead_wood: '枯木：燒起來，燒傷周圍的敵人', cloud_stone: '雲石：打破會落下錢雨', damaged_statue: '破損石像：會喚醒守護精英' };
  const near = (o, r) => G.E.filter(e => e.st !== 'dead' && e.hp > 0 && !e.bb && Math.hypot(e.x - o.x, (e.y - o.y) * 1.6) < r * S(o.y));
  G.BRKFX = function (o) { const ty = o.base.replace(/^break_[a-z]+_/, ''), d = SC.def, lv = d.lv || 1; if (BI[ty]) seen('brkSeen', ty, BI[ty]);
    try {
      if (ty === 'jar' && Math.random() < 0.15) { const L = (d.foes || []).filter(t => G.enemyUnit(t) && G.FOES && /swarm|grunt/.test(G.FOES.classOf(t))); const e = G.spawnOni(o.x + 20, o.y, 6, lv, pick(L.length ? L : ['akaoni'])); if (e) G.UI.toast('陶甕裡跳出了妖怪！'); }
      else if (ty === 'bamboo_fence' && Math.random() < 0.5) { let it = null; for (let i = 0; i < 60; i++) { it = R.roll(lv, d.region || 'wind'); if (it.q >= 2) break; } if (it.q < 2) it.q = 2; G.LOOT.push({ x: o.x + 18, y: o.y + 6, t: 0, kind: 'item', it }); }
      else if (ty === 'stone_lantern') { const v = Math.round(H.hpMax * 0.1); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 8, v: '+' + v, heal: true, t: 0 }); if (G.RUNE && G.RUNE.E) G.RUNE.E.push({ k: 'soul', x: o.x, y: o.y - HH() * S(o.y) * 0.5, t: 0, life: 40, sd: Math.random() * 6 }); }
      else if (ty === 'shimenawa_post') { const e = G.FOES && G.FOES.AF.filter(q => q.st !== 'dead' && q._af && q._af.length && Math.hypot(q.x - o.x, q.y - o.y) < 420)[0]; if (e) { const k = e._af.pop(); if (k === 'iron') { e._dr = 0; e._kbk = 1; } if (k === 'swift') e._csp = (e._csp || 1) / 1.35; if (k === 'shield') e._sh = 0; G.UI.toast('注連繩斷了——精英失去「' + G.FOES.AFX[k] + '」'); } }
      else if (ty === 'ice_pillar') { for (const e of near(o, 170)) e.stun = Math.max(e.stun || 0, 60); if (G.ICO) G.ICO.burst({ x: o.x, y: o.y }, 'fxp_ice_shard', 8, { z: 0.5 }); }
      else if (ty === 'snow_pile') { const ks = Object.keys(R.MATS); G.LOOT.push({ x: o.x - 14, y: o.y + 4, t: 0, kind: 'mat', id: pick(ks), n: 2 }); if (gi() >= 1 && Math.random() < 0.2) G.LOOT.push({ x: o.x + 14, y: o.y + 4, t: 0, kind: 'dm', id: 'reisa', n: 1 }); }
      else if (ty === 'lava_rock') { if (G.VX && G.VX.blast) G.VX.blast({ x: o.x, y: o.y, r: 1.2 }); for (const e of near(o, 150)) G.damageOni(e, 2.5, true); if (Math.hypot(H.x - o.x, (H.y - o.y) * 1.6) < 75 * S(o.y)) G.hurtHero(Math.round(H.hpMax * 0.1 / Math.max(0.2, 1 - G.RPG.S.def / (G.RPG.S.def + G.DEFK()))), o.x); }
      else if (ty === 'dead_wood') { if (G.VX && G.VX.burn2) G.VX.burn2({ x: o.x, y: o.y, r: 1, life: 240 }); for (const e of near(o, 130)) e.bleed = Math.max(e.bleed || 0, 240); }
      else if (ty === 'cloud_stone') { for (let i = 0; i < 6; i++) G.LOOT.push({ x: o.x + rnd(-50, 50), y: o.y + rnd(-14, 14), t: -i * 4, kind: 'gold', v: Math.round(4 + lv * 2) }); }
      else if (ty === 'damaged_statue') { const L = (d.foes || []).filter(t => G.enemyUnit(t)); const e = G.spawnOni(o.x + 24, o.y, 20, lv + 2, pick(L.length ? L : ['akaoni'])); if (e) { e.elite = '守護精英'; e.hp = e.hpMax = Math.round(e.hpMax * 3); e.atk = Math.round(e.atk * 1.3); e.ratio = (e.ratio || 1) * 1.15; e._guard = 1; G.UI.toast('石像裡的守護者醒了！'); } }
    } catch (x) { console.warn('brkfx', x); } };
  const k1 = R.onKill; R.onKill = function (e) { const r = k1.apply(this, arguments); try { if (e && e._guard && !e._gd2) { e._gd2 = 1; let it = null; for (let i = 0; i < 60; i++) { it = R.roll(e.lv || 1, SC.def.region || 'wind'); if (it.q >= 2) break; } if (it.q < 2) it.q = 2; G.LOOT.push({ x: e.x, y: e.y, t: 0, kind: 'item', it }); } } catch (x) {} return r; };
  G.FORT = { FT: () => FT, seal: () => SEAL, layout, hitObj, hitSeal, placeSeal, okMap };
})();
