/* ==========================================================================
 * 神諭之地 重製版 — 157_hubwar.js
 * Version : r3.159.0  (2026-11-27)
 * 變更    : r3.159.0 新增。兩岸城攻防篇 第一批（劇本 2026-11-27_1840_HUB_WAR_SCRIPT_v1）：
 *           ・W1 兩岸城淪陷（過場：河水倒灌、亡者上岸、孫六死守、居民西撤、橋斷、城被罩住）
 *           ・W2 神社的燈火（守住避難所 3 波＋精英，避難所有耐久）
 *           ・W3 水車村的求救（救 4 處、每處一波；小妖抉擇；鬼女精英）
 *           ・W4 妖氣壁（城被封：只能到城南牆前）　・W5 晴明的破邪符（出雲）
 *           ・W6 反擊開始（破壁→戰場版西口 3 波＋般若→建立本陣）
 *           ・兩岸城外觀／可走範圍依進度：淪陷前＝原本、封鎖＝戰火（只剩城南牆前）、反擊後＝戰場（只剩西口一帶）、奪回後＝重建
 *           ・避難搬遷：封鎖期間城裡沒有居民；店家、景綱、孫六、冬馬、文也搬到神社；水車村多了甚藏
 *           ・第 11 章開場、黑暗的城、迷途的亡魂改寫成災後；城東守門併入之後的城內爭奪（不再單獨出現）
 *           ・舊存檔：已進第 11 章＝W1～W6 視為完成；已進第 12 章＝全部完成（城＝重建版）
 * 依賴    : 53_quest（Q.add／isDone／active／next）、52_hub（HUB.OP／travel／marks）、147_hubview（HUBV.state）、25_walk（WALK.M）、
 *           20_npc（AMB／NPCD.CAST）、59_stage（講話者登場）、22_event（wp 道具繪製）、03_actors（spawnOni）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, HUB = G.HUB, SC = G.SC, H = G.H; if (!Q || !HUB || !Q.add) return;
  const F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text }), act = fn => ({ do: fn }), nar = t => say('', t);
  const DN = id => Q.isDone(id), AC = id => Q.active(id);
  const inP = id => !!(G.PARTY && G.PARTY.list && G.PARTY.list.some(m => m.id === id));
  const P = (id, who, text) => inP(id) ? [say(who, text)] : [];
  const 雪 = t => say('小雪', t), 丸 = t => say('白丸', t), 蒼 = t => say('蒼真', t);
  const TK = 16.7, ID = 'hub_city';
  const HW = G.HW = { actors: [], props: [], fire: 0, ink: 0, dome: 0, fight: null, sc: null };

  /* ======================= 一、進度與城的狀態 ======================= */
  HW.phase = () => { if (DN('hw8')) return 'retaken'; if (AC('hw7') || DN('hw7') || AC('hw8')) return 'battle'; if (DN('hw6')) return 'base';
    if (F().hw_break) return 'w6'; if (DN('hw1')) return 'sealed'; return ''; };
  const V = G.HUBV;
  if (V) { const st0 = V.state.bind(V); V.state = function () { if (V.force != null) return V.force; const p = HW.phase();
    if (p === 'retaken') return 'rebuild'; if (p === 'battle' || p === 'base' || p === 'w6') return 'war'; if (p === 'sealed') return 'ruin';
    const s = st0(); return s === 'ruin' ? '' : s; }; }   /* 原本「第 11 章＝戰火」改由攻防進度決定 */
  /* 可走範圍限制：封鎖＝只剩城南牆前；反擊～本陣＝只剩西口一帶 */
  const ZONE = { sealed: { r: [745, 812, 880, 941], at: [812, 890] }, w6: { r: [0, 0, 640, 941], at: [180, 612] }, base: { r: [0, 0, 640, 941], at: [180, 612] } };
  function zone() { if (SC.id !== ID) return null; const z = ZONE[HW.phase()]; return z && !(V && V.force != null) ? z : null; }
  const wk0 = SC.walkable.bind(SC), rm0 = SC.room.bind(SC);
  SC.walkable = function (x, y) { const z = zone(); if (z && (x < z.r[0] || x > z.r[2] || y < z.r[1] || y > z.r[3])) return false; return wk0(x, y); };
  SC.room = function (x, y) { const z = zone(); if (z && (x < z.r[0] || x > z.r[2] || y < z.r[1] || y > z.r[3])) return 0; return rm0(x, y); };
  function limit() { const z = zone(); if (!z) return; if (!SC.walkable(H.x, H.y)) { H.x = z.at[0]; H.y = z.at[1]; } }
  HW.limit = limit;

  /* ======================= 二、避難搬遷（居民名單） ======================= */
  const AMB = G.AMB, CASTX = {
    shrine: { h: ['n_kagetsuna', 'n_t_human_guard', 'n_toma', 'n_fumiya'], s: [['n_hoan', 'med_city'], ['n_t_oni_veteran', 'smith_city'], ['n_suzuo', 'goods_city'], ['n_stall_vendor', 'tea_city'], ['n_t_human_clerk', 'warp_city']] },
    shrineShops: { h: [], s: [['n_hoan', 'med_city'], ['n_t_oni_veteran', 'smith_city'], ['n_suzuo', 'goods_city'], ['n_stall_vendor', 'tea_city'], ['n_t_human_clerk', 'warp_city']] },
    base: { h: ['n_kagetsuna', 'n_t_human_guard', 'n_toma', 'n_fumiya'], s: [], a: [] } };
  if (AMB && G.NPCD) { const ae0 = AMB.enter; AMB.enter = function (id) { const C = G.NPCD.CAST, p = HW.phase(), keep = C[id]; let tmp = null;
      if (id === ID && (p === 'sealed' || p === 'w6')) tmp = { h: [], s: [], a: [] };
      else if (id === ID && (p === 'base' || p === 'battle')) tmp = CASTX.base;
      else if (id === 'hub_shrine' && keep && (p === 'sealed' || p === 'w6' || p === 'base' || p === 'battle')) { const x = p === 'sealed' || p === 'w6' ? CASTX.shrine : CASTX.shrineShops;
        tmp = { h: (keep.h || []).concat(x.h), s: (keep.s || []).concat(x.s), a: keep.a || [] }; }
      else if (id === 'W_R01_01' && keep && AC('hw3')) tmp = { h: [], s: [], a: [] };
      else if (id === 'W_R01_01' && keep && (p === 'sealed' || p === 'w6' || p === 'base' || p === 'battle')) tmp = { h: (keep.h || []).concat(['n_jinzo']), s: keep.s || [], a: keep.a || [] };
      if (tmp) C[id] = tmp; try { return ae0.apply(this, arguments); } finally { if (tmp) C[id] = keep; } }; }

  /* ======================= 三、素材與道具 ======================= */
  const IMG = k => G.IMG['hw_' + k], load = k => G.ASSET.img('hw_' + k, 'a/war/' + k + '.webp').catch(() => null);
  HW.prop = (k, x, y, w, o) => { const n = Object.assign({ hwimg: k, x, y, w, name: '' }, o || {}); load(k); G.NPC.push(n); HW.props.push(n); return n; };
  HW.wp = (s, x, y, k, face) => { const n = { wp: 1, s, x, y, k: k || 0.9, face: face || 1, hw: 1 }; G.NPC.push(n); HW.props.push(n); return n; };
  function clearProps() { G.NPC = G.NPC.filter(n => !HW.props.includes(n)); HW.props = []; }
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n.hwimg) return dn0.apply(this, arguments); const im = IMG(n.hwimg); if (!im) return; const s = SC.depth(n.y), w = n.w * s, h = w * im.height / im.width;
    G.ctx.drawImage(im, n.x - w / 2, n.y - h * (n.base || 0.92), w, h); };
  /* 畫面覆蓋：河水變黑、屋頂火焰、城外的紫黑罩、妖氣牆（世界座標轉畫面） */
  const ROOF = [[420, 470], [600, 380], [980, 330], [1440, 380], [330, 700], [1010, 760], [1560, 720], [250, 330]];
  const CANAL = [[1105, 300, 1270, 560], [1110, 680, 1350, 941], [1200, 120, 1330, 300]];
  const WALLS = { sealed: [[742, 812, 884, 'h']], w6: [[652, 540, 680, 'v']], base: [[652, 540, 680, 'v']] };
  ['wall_miasma', 'fx_roof_fire_4f', 'fort_ours', 'camp_shelter', 'camp_bundles', 'camp_pot', 'camp_wounded'].forEach(k => G.ASSET && G.ASSET.img && setTimeout(() => load(k), 4000));
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); try { overlay(); } catch (e) { console.warn('hw', e); } };
  function overlay() { const c = G.ctx, Z = SC.view().Z;
    if (SC.id === ID && HW.ink > 0) { c.save(); c.globalAlpha = HW.ink; c.fillStyle = '#120a1c'; for (const [x0, y0, x1, y1] of CANAL) { const a = SC.toScreen(x0, y0), b = SC.toScreen(x1, y1); c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); } c.restore(); }
    const fi = IMG('fx_roof_fire_4f'); if (SC.id === ID && HW.fire > 0 && fi) { const fr = Math.floor(G.t / 7) % 4, fw = fi.width / 4;
      c.save(); c.globalAlpha = Math.min(1, HW.fire); for (const [x, y] of ROOF) { const p = SC.toScreen(x, y), s = 120 * Z; c.drawImage(fi, fr * fw, 0, fw, fi.height, p.x - s / 2, p.y - s * 0.85, s, s); } c.restore(); }
    const wm = IMG('wall_miasma'), wl = SC.id === ID && WALLS[HW.phase()]; if (wm && wl && !HW.sc) for (const [a, b, d, o] of wl) { c.save(); c.globalAlpha = 0.85 + 0.1 * Math.sin(G.t * 0.05);
      if (o === 'h') { const p = SC.toScreen(a, b), q = SC.toScreen(d, b), h = 170 * Z; c.drawImage(wm, p.x, p.y - h, q.x - p.x, h); }
      else { const p = SC.toScreen(a, b), q = SC.toScreen(a, d), w = 90 * Z; c.drawImage(wm, p.x - w / 2, p.y - 120 * Z, w, q.y - p.y + 120 * Z); }
      c.restore(); }
    if (HW.dome > 0) { const g = c.createRadialGradient(G.LW / 2, G.LH * 0.7, G.LH * 0.2, G.LW / 2, G.LH * 0.5, G.LW * 0.7); g.addColorStop(0, 'rgba(60,20,80,0)'); g.addColorStop(1, `rgba(40,10,60,${0.55 * HW.dome})`); c.fillStyle = g; c.fillRect(0, 0, G.LW, G.LH); } }

  /* ======================= 四、過場導演（可移動的演員、無法操作） ======================= */
  /* beat：{ say:[...] }＝對話（世界暫停）；{ wait:n, fn, tick(t) }＝動作（演員移動、倒下、敵人行走）。 */
  HW.run = (list, done) => { HW.sc = { q: list.slice(), done, b: null, t: 0 }; nextBeat(); };
  function nextBeat() { const S = HW.sc; if (!S) return; const b = S.q.shift(); if (!b) { HW.sc = null; S.done && S.done(); return; } S.b = b; S.t = 0;
    try { b.fn && b.fn(); } catch (e) { console.warn('hw beat', e); }
    if (b.say) { S.b = null; G.DLG.start(typeof b.say === 'function' ? b.say() : b.say, nextBeat); return; }
    if (!b.wait) nextBeat(); }
  HW.foe = (type, x, y, o) => { const e = G.spawnOni(x, y, 0, Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 2), type); if (!e) return null; e.delay = 0; e.stun = 1e9; e.hwa = 1; e.st = 'walk'; e.face = (o && o.face) || -1;
    if (o) Object.assign(e, o); HW.actors.push(e); return e; };
  HW.go = (e, x, y, sp) => { if (e) { e._tx = x; e._ty = y; e._sp = sp || 1.6; } };
  HW.kill = e => { if (e && e.st !== 'dead') { e.st = 'dead'; e.t = 0; e.hold = undefined; e.hp = 0; } };
  HW.hit = e => { if (e && e.st !== 'dead') { e.st = 'atk'; e.t = 0; e.atkMs = 900; e.atkHit = true; } };
  function actorTick() { for (const e of HW.actors) { if (!e) continue;
      if (e.st === 'dead') { e.t++; if (e.t > 34) e.alpha = Math.max(0, 1 - (e.t - 34) / 30); continue; }
      if (e.st === 'atk') { e.t++; if (e.t * TK > e.atkMs) { e.st = 'walk'; e.t = 0; } }
      if (e._tx !== undefined) { const dx = e._tx - e.x, dy = e._ty - e.y, d = Math.hypot(dx, dy); if (d < 3) { e._tx = undefined; } else { const s = Math.min(d, e._sp); e.x += dx / d * s; e.y += dy / d * s; if (Math.abs(dx) > 1) e.face = Math.sign(dx); } } }
    HW.actors = HW.actors.filter(e => e.alpha > 0); }
  HW.clear = () => { G.E = G.E.filter(e => !e.hwa); HW.actors = []; };
  /* 主迴圈：過場的動作 beat 期間接管（鎖輸入、演員照常動） */
  (function hkStep() { if (!G.step || !G.mode) return setTimeout(hkStep, 30); const step0 = G.step; G.step = function () { const S = HW.sc;
    if (S && S.b && S.b.wait && G.mode === 'play' && !G.DLG.active() && !G.MENU.open && !G.SC.trans) { G.UI.step(); G.playT++; S.t++;
      const IN = G.IN; IN.stick = null; IN.mx = IN.my = 0; for (const k of ['atk', 'c1', 'c2', 'c3', 'skA', 'skB', 'm1', 'm2', 'ult']) IN[k] = false;
      actorTick(); if (AMB) AMB.bubs = []; try { S.b.tick && S.b.tick(S.t); } catch (e) { console.warn('hw tick', e); }
      G.NPCLIFE.step(); G.SC.step(); G.fxStep(); if (S.t >= S.b.wait) nextBeat(); return; }
    return step0.apply(this, arguments); }; })();   /* 09_main 在本檔之後才定義 G.step */
  /* 居民演員：走到某處 */
  HW.npcGo = (n, x, y, sp, gone) => { if (!n) return; n.st = 'walk'; n.tx = x; n.ty = y; n.march = 1; n.hold = false; n.spd = sp || 2.2; n.onArrive = gone ? (m => AMB && AMB.remove(m)) : (m => { m.hold = true; m.march = 0; }); };
  HW.add = (u, x, y, name, o) => AMB ? AMB.add(u, x, y, Object.assign({ name, hold: true }, o || {})) : Promise.resolve(null);
  const byName = n => G.NPC.find(o => o.amb && (o.name === n || (o.name || '').endsWith(n)));

  /* ======================= 五、戰鬥導演（波次、守護目標、精英） ======================= */
  /* o：{ title, waves:[{ t:[types], n, elite, eliteT, eliteK }], from:[[x,y]...], guard:{x,y,r,name}, onWin, onFail } */
  HW.startFight = o => { HW.fight = Object.assign({ w: -1, gap: 60, dur: 100, alive: 0 }, o); const d = SC.def; if (!d._hwS) d._hwS = { safe: d.safe, town: d.town }; d.safe = false; d.town = false; G.UI.banner(o.title, o.sub || ''); };
  HW.startFight2 = o => { HW.fight = Object.assign({ w: -1, gap: 60, dur: 100, alive: 0 }, o); G.UI.banner(o.title, o.sub || ''); };
  function fightEnd() { const d = SC.def; if (d && d._hwS) { d.safe = d._hwS.safe; d.town = d._hwS.town; delete d._hwS; } }
  function spawnWave(f) { const W = f.waves[f.w], lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 1) + (W.lv || 0), list = [].concat(W.t), ty = [...list, W.eliteT].filter(Boolean);
    Q.load(ty).then(() => { if (HW.fight !== f) return; for (let i = 0; i < W.n; i++) { const p = f.from[i % f.from.length], e = G.spawnOni(p[0] + (Math.random() - 0.5) * 80, p[1] + (Math.random() - 0.5) * 40, 10 + i * 14, lv, list[i % list.length]); if (e) e.hwq = 1; }
      if (W.elite) { const p = f.from[0], e = G.spawnOni(p[0], p[1], 30, lv + 2, W.eliteT); if (e) { e.hwq = 1; e.hp = e.hpMax = Math.round(e.hpMax * (W.eliteK || 4)); e.atk = Math.round(e.atk * 1.35); e.ratio *= 1.12; e.elite = W.elite; G.UI.banner(W.elite, W.eliteSub || '強敵出現'); if (W.onElite) W.onElite(e); } }
      f.spawned = 1; }); f.spawned = 0; G.UI.toast((f.label || '第') + ' ' + (f.w + 1) + '／' + f.waves.length + ' 波'); }
  function fightStep() { const f = HW.fight; if (!f) return; if (SC.id !== f.map) { HW.fight = null; return; }
    const live = G.E.filter(e => e.hwq && e.st !== 'dead' && e.hp > 0); f.alive = live.length;
    if (f.guard) { const g = f.guard; for (const e of live) if (Math.hypot(e.x - g.x, (e.y - g.y) * 1.5) < g.r) f.dur -= 0.045; if (f.dur <= 0) { const cb = f.onFail; HW.fight = null; for (const e of live) { e.st = 'dead'; e.t = 0; e.hp = 0; } cb && cb(); return; } }
    if (f.w < 0 || (f.spawned && !live.length)) { if (--f.gap > 0) return; f.gap = 90; f.w++; if (f.w >= f.waves.length) { HW.fight = null; const cb = f.onWin; G.STORY.later(30, () => cb && cb()); return; } spawnWave(f); } }
  const ss0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { ss0(); try { fightStep(); } catch (e) { console.warn('hw fight', e); }
    if (G.t % 30 === 0) marksTick(); };
  const ob0 = G.STORY.objective.bind(G.STORY); G.STORY.objective = function () { const f = HW.fight; if (f && SC.id === f.map) return f.title + '　第 ' + Math.max(1, Math.min(f.waves.length, f.w + 1)) + '／' + f.waves.length + ' 波'; return ob0(); };
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); const f = HW.fight; if (!f || !f.guard || SC.id !== f.map) return; const c = G.ctx, w = 180, x = (G.LW - w) / 2, y = 44 + G.SAFE.t;
    c.fillStyle = 'rgba(12,8,10,.7)'; G.rr(x - 6, y - 4, w + 12, 26, 8); c.fill(); G.txt(f.guard.name + '　耐久', x, y + 5, 10, G.C.gold, 'left', G.FONT, 700);
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(x, y + 13, w, 5); c.fillStyle = f.dur > 35 ? '#7ccf7a' : '#e0705a'; c.fillRect(x, y + 13, w * Math.max(0, f.dur) / 100, 5); };

  /* ======================= 六、W1　兩岸城淪陷 ======================= */
  const RUIN = { img: null };
  /* 過場前清場：任務標記、委託人、泡泡、夥伴閒聊都先收起來（只留劇情要用的人） */
  function quiet() { for (const m of Q.marks || []) if (m.n && AMB) AMB.remove(m.n); if (Q.marks) Q.marks.length = 0; if (HUB.marks) HUB.marks = HUB.marks.filter(m => !m.q && m.id !== 'south' ? false : m.id === 'south');
    if (AMB) { AMB.bubs = []; AMB.chatT = 99999; } if (G.BANTER) { G.BANTER.cur = null; G.BANTER.cd = 99999; } }
  function w1(q, done) { if (HW.sc) return; H.x = 760; H.y = 622; H.face = 1; quiet(); G.ASSET.img('hw_ruin', 'a/m/hub_city_ruin.webp').then(i => { RUIN.img = i; }, () => 0);
    Q.load(['yomigun', 'skel', 'shikome', 'yaribushi', 'ashiyumi', 'ashigun']); load('fx_roof_fire_4f');
    const sol = [], foes = [], run = [];
    HW.run([
      { wait: 40 },
      { say: () => [say('文也', '蒼真！潮回來了，漁港的船今天全出海了。'), say('文也', '我把這件事寫進《神諭之地記》了——第十章，「三潮」。'), 雪('……文也，你聽。'),
          nar('（鐘聲。不是報時的鐘，是一聲接一聲、越敲越急。）'), say('文也', '這不是報時……是警鐘。'), 丸('（毛全豎起來）河。河的味道變了。跟後山封印石底下的味道一樣。')] },
      { wait: 90, tick: t => { HW.ink = Math.min(0.75, t / 110); SC.shake = t % 30 === 0 ? 2 : SC.shake; } },
      { say: () => [nar('（運河的水停了。接著，水面像墨汁一樣一層層變黑，往上游——往後山的方向——倒灌。）'),
          雪('第十章的時候，這條河往山上流……原來不是海神在拉它。是後山。是封印石在吸。'), 雪('（臉色發白）它吸不住了。現在……要吐出來了。'), nar('（黑水翻起。第一隻手從水裡伸出來，抓住了石岸。）')] },
      { wait: 70, fn: () => { if (RUIN.img) { SC.img = RUIN.img; if (G.MMAP) G.MMAP.id = null; } SC.shake = 8;
          for (const [t, x, y] of [['yomigun', 1090, 600], ['yomigun', 1085, 640], ['skel', 1095, 560], ['yomigun', 1300, 600], ['skel', 1290, 640], ['yomigun', 1080, 470]]) { const e = HW.foe(t, x, y, { face: -1 }); if (e) { foes.push(e); HW.go(e, x - 120 - Math.random() * 60, y, 0.9); } }
          for (const [t, x, y] of [['shikome', 790, 300], ['shikome', 840, 310], ['akaoni', 812, 280]]) { const e = HW.foe(t, x, y, { face: 1 }); if (e) { foes.push(e); HW.go(e, x, y + 150, 1.1); } } },
        tick: t => { HW.fire = Math.min(1, t / 50); } },
      { wait: 50, fn: () => { [[880, 590, 'yaribushi'], [890, 625, 'yaribushi'], [880, 660, 'yaribushi'], [850, 575, 'ashiyumi'], [845, 650, 'ashiyumi'], [840, 612, 'ashigun']].forEach(([x, y, t], i) => { const e = HW.foe(t, 700 + i * 8, y, { face: 1, ratio: 1.05 }); if (e) { sol.push(e); HW.go(e, x, y, 2.4); } }); } },
      { say: () => [say('孫六', '全員戒備！不是鬼族——是死人！死人從河裡爬上來了！'), say('孫六', '冬馬！帶槍組封住大街！弓組上屋頂！鐵砲……鐵砲在哪？！'),
          say('冬馬', '隊長，鐵砲組還在奉行所——'), say('孫六', '那就用槍頂住！一步都不准退！後面全是城裡的人！'),
          蒼('孫六，我們頂前面——'), say('孫六', '你是神社的人，給我先把巫女帶走！她要是在這裡出事，整座城都完了！'), 雪('我不走。城裡的人——'),
          say('景綱', '（從城門那邊跑來，袖子被燒掉一截）小雪姑娘，聽孫六的。'), say('景綱', '城裡的人，我一個一個帶出去。西口通神社，往西撤！')] },
      { wait: 150, fn: () => { /* 居民往西撤 */ if (AMB) for (const n of AMB.list.slice()) { if (n.shop) { AMB.remove(n); continue; } if (n.an || /孫六|冬馬|景綱|文也|梅乃|柚吉|時雨/.test(n.name || '')) continue; HW.npcGo(n, 30 + Math.random() * 30, 600 + Math.random() * 40, 2.4 + Math.random() * 0.8, true); run.push(n); }
          [['n_t_human_townswoman', 640, 470], ['n_handcart_porter', 760, 820], ['n_p_kinu', 520, 600], ['n_jinpei', 980, 600]].forEach(([u, x, y]) => HW.add(u, x, y, '', { hold: false }).then(n => n && HW.npcGo(n, 20, 615, 2.6, true)));
          for (const e of foes) HW.go(e, e.x - 90, e.y + (e.y < 400 ? 160 : 0), 1.0); },
        tick: t => { if (t === 60) { const a = sol[0]; if (a) HW.hit(a); } if (t === 90 && foes[0]) HW.kill(foes[0]); if (t === 120 && sol[3]) HW.hit(sol[3]); if (t === 130 && foes[1]) HW.kill(foes[1]); } },
      { say: () => [say('柚吉', '婆婆！我的鞋——'), say('梅乃婆婆', '鞋不要了！拉著我的手！'), nar('（一隻骸骨兵跳上岸，擋在柚吉面前。弓組的一箭把它射翻。）'), say('冬馬', '小孩快走！往西！'),
          say('時雨', '（推著一車帳冊和傳送符跑過）驛馬全跑了！傳送陣……傳送陣被黑水淹了！'), say('文也', '（抱著帳冊跑在最後）《神諭之地記》不能燒……不能燒……')] },
      { wait: 130, fn: () => { for (const n of G.NPC.filter(o => o.amb && /梅乃|柚吉|時雨|文也/.test(o.name || ''))) HW.npcGo(n, 25, 615, 2.6, true); const ak = foes.find(e => e.type === 'akaoni'); if (ak) HW.go(ak, 900, 610, 2.4); },
        tick: t => { const ak = foes.find(e => e.type === 'akaoni'); if (t === 45 && ak) HW.hit(ak); if (t === 50) { HW.kill(sol[0]); HW.kill(sol[1]); SC.shake = 6; } if (t === 95) { HW.kill(sol[3]); HW.kill(sol[4]); } } },
      { say: () => [nar('（赤鬼撞進槍陣。兩名槍足輕被掀翻，倒地不起。醜女從屋頂撲下，弓組的人一個接一個倒下。）'), say('冬馬', '隊長！右邊撐不住了！'), say('孫六', '撐不住也要撐！再一刻鐘！等城裡的人走光！')] },
      { wait: 50, tick: t => { const ak = foes.find(e => e.type === 'akaoni'); if (t === 20 && ak) { HW.kill(ak); SC.shake = 7; G.FX.push({ k: 'dust', x: ak.x, y: ak.y, t: 0, life: 20 }); } } },
      { say: () => [蒼('（衝進去砍倒赤鬼，回頭）孫六！夠了，撤！'), say('孫六', '……（看了一眼倒在地上的部下）……哼。被死人逼退，傳出去要被笑一輩子。'), say('孫六', '——全員，往西口撤！把傷兵扛走！一個都不准留！'),
          nar('（孫六最後一個退。轉身時，一隻黃泉軍的矛刺進了他的肩膀。冬馬把他拖走。）')] },
      { wait: 110, fn: () => { for (const e of sol) if (e.st !== 'dead') HW.go(e, 40, e.y, 2.6); for (const n of G.NPC.filter(o => o.amb && /孫六|冬馬|景綱/.test(o.name || ''))) HW.npcGo(n, 25, 615, 2.4, true); },
        tick: t => { if (t === 60) { SC.shake = 12; HW.broke = 1; } HW.dome = Math.min(1, t / 100); } },
      { say: () => [nar('（下方的木橋被黑水裡伸出的巨大手臂抓住，從中間折斷。）'), nar('（城的上空，紫黑色的霧慢慢合起來，像一隻倒扣的碗。）'), 雪('（在西口回頭）……城，被關起來了。'), 丸('小雪，走。現在回頭，什麼都救不了。'),
          ...P('shion', '汐音', '……河是城的血脈。現在流的，是毒。'), ...P('ibaraki', '茨木', '這不是鬼族會做的事。這股味道……是陰陽師的術。')] }
    ], () => { HW.clear(); HW.ink = 0; HW.fire = 0; HW.dome = 0; if (AMB) AMB.chatT = 400; if (G.BANTER) G.BANTER.cd = 600; F().hw1_seen = 1; G.SAVE.markDirty(); done();
      HUB.travel(0, '那一夜，兩岸城淪陷了。', [], 'hub_shrine'); }); }

  /* ======================= 七、W2　神社的燈火 ======================= */
  const CAMP = () => { if (HW.props.some(n => n.hwimg === 'camp_shelter')) return; HW.prop('camp_shelter', 640, 545, 300); HW.prop('camp_bundles', 740, 585, 170); HW.prop('camp_pot', 1000, 565, 200); HW.prop('camp_wounded', 1090, 545, 230); HW.prop('camp_wounded', 560, 600, 230); };
  function w2(q, done) { const intro = [
      say('蓬庵', '（替孫六換布）別動。肩膀再動一次，這隻手就拿不了刀了。'), say('孫六', '……我帶出來的人，剩幾個？'), say('冬馬', '……二十四個出去，回來十一個。'),
      say('孫六', '（沉默很久）……名字，記下來。一個都不准漏。'), say('文也', '（翻開帳冊）……我來記。'),
      say('梅乃婆婆', '（抱著柚吉）神明保佑……蒼真大人，謝謝你。要不是你們，這孩子……'), say('柚吉', '（燒得滿臉通紅）婆婆……城裡的貓……小黑還在城裡……'),
      雪('（蹲下來摸摸柚吉的頭）小黑很聰明的。牠會等你回去。'), say('茂兵衛爺', '（看著後山）……三百年前的舊冊上寫過。封印撐不住的那一夜，亡者會「順水而下」。老夫以為那是比喻。'),
      say('澄岳', '不是比喻。……來了。'), nar('（鳥居外的參道上，黑霧沿著石階往上爬。亡者跟著霧來了。）'),
      say('孫六', '（硬撐著站起來）冬馬，帶還能拿槍的人守鳥居左邊。'), say('蓬庵', '你給我坐下！'), say('孫六', '大夫，我坐著，他們就死了。')];
    const fight = () => HW.startFight({ map: 'hub_shrine', title: '守住避難所', sub: '別讓亡者衝進帳篷', guard: { x: 780, y: 575, r: 130, name: '避難所' }, from: [[800, 880], [420, 820], [1180, 820]],
      waves: [{ t: ['yomigun'], n: 4 }, { t: ['skel', 'skel', 'gaki'], n: 5, onElite: null }, { t: ['skel'], n: 3, elite: '赤骨武者', eliteT: 'skelred', eliteSub: '三百年前死在這裡的武士' }],
      onFail: () => G.DLG.start([nar('（亡者衝進了帳篷。孩子的哭聲響起來。）'), 雪('蒼真！先把它們擋在鳥居外——再一次！')], fight),
      onWin: () => { fightEnd(); G.DLG.start([say('澄岳', '（念完最後一句經）……退了。黑霧在鳥居前停下了。神社的結界還撐得住。'), 雪('……撐得住。可是後山的封印石，在哭。我聽得到。'),
        say('冬馬', '（從參道跑上來，滿身泥）隊長！西邊……水車村的方向，有火光！'), say('孫六', '水車村？阿松她們不是前天才回村子——'), say('景綱', '（站起來）我去。'),
        say('孫六', '大人，你是城代。城代要是死在路上——'), say('景綱', '城都沒了，還要城代做什麼。'), 蒼('景綱，你留下。神社需要一個能讓大家安心的人。……水車村我去。'),
        say('景綱', '……（看著蒼真很久）……蒼真。拜託了。')], done); } });
    CAMP(); if (F().hw2_intro) { fight(); return; } G.DLG.start(intro, () => { F().hw2_intro = 1; G.SAVE.markDirty(); fight(); }); }

  /* ======================= 八、W3　水車村的求救 ======================= */
  function w3(q, done) { const d0 = SC.def; if (!d0._hwS) d0._hwS = { safe: d0.safe, town: d0.town }; d0.safe = false; d0.town = false; const f = F(), s3 = f.hw3 = f.hw3 || {};
    const wave = (t, n, cb) => HW.startFight2({ map: 'W_R01_01', title: '驅逐村裡的鬼', label: '第', from: [[H.x + 260, H.y], [H.x - 260, H.y + 10]], waves: [{ t, n }], onWin: cb });
    const spots = [
      ['home', 'home_stand', 0, '阿松的家', () => [nar('（門口堆滿了木頭和碎瓦。你把木頭搬開。）'), say('阿松', '（衝出來抱住小太）你數到幾了？'), say('小太', '……七十三。我有在數。')], ['onihei', 'akaoni'], 4],
      ['mill', 'mill_stand', 0, '水車小屋', () => [say('老爺爺', '（從水車下面爬出來）水車還在轉……還在轉就好，還在轉，村子就還活著。')], ['kurooni', 'onihei'], 4],
      ['shed', 'herb_stand', 0, '倉庫', () => [nar('（倉庫裡沒有村民。柱子上綁著一隻小小的鬼，嘴被布塞住。）'), say('被綁住的小妖', '（發抖）我、我沒有咬人……我只是……只是好怕……'),
        { choice: [{ label: '鬆綁，放牠走', then: [act(() => { F().hw_imp = 'free'; G.SAVE.markDirty(); }), nar('（小妖往山上跑了兩步，回頭鞠了一個躬。）')] },
          { label: '交給村民處置', then: [act(() => { F().hw_imp = 'keep'; G.SAVE.markDirty(); }), say('真穗', '……謝謝你。我們會關好牠，等天亮再說。')] }] }], ['akaoni', 'onihei'], 3],
      ['chief', 'east_arrival', -120, '山路口', () => [say('村長', '（被人扶著）……不是鬼。最後那一個……不是鬼。是個穿紅衣的女人，頭上有角，她在哭。')], null, 0]];
    const left = () => spots.filter(x => !s3[x[0]]);
    function marks() { if (!HUB.marks || SC.id !== 'W_R01_01') return; HUB.marks = HUB.marks.filter(m => !m.hw3); if (HW.fight || HW.sc) return;
      for (const [k, node, dx, label, lines, foes, n] of left()) { if (k === 'chief' && left().length > 1) continue; const p0 = (SC.def.nodes || {})[node] || SC.def.start, p = [p0[0] + dx, p0[1]];
        HUB.marks.push({ id: 'hw3:' + k, hw3: 1, x: p[0], y: p[1], label: '救人・' + label, kind: 'look', main: true, run: () => G.DLG.start(lines(), () => { s3[k] = 1; G.SAVE.markDirty();
          if (k === 'chief') return boss(); if (foes) wave(foes, n, marks); else marks(); }) }); } }
    HW.w3marks = marks;
    function boss() { const p = (SC.def.nodes || {}).east_arrival || [1510, 665]; Q.load(['kijo']).then(() => {
      const e = HW.foe('kijo', p[0] - 40, p[1], { face: -1 }); if (e) { e.elite = '鬼女'; e.stun = 1e9; }
      G.DLG.start([nar('（鬼女從山路走下來，披頭散髮，手裡抓著一件小孩的衣服。）'), say('鬼女', '……還給我。我的孩子……被黑水捲走了。你們人類的河，把我的孩子捲走了……'),
        ...P('ibaraki', '茨木', '（擋在前面）……我認得妳。妳是住在杉影古道的那一家。'), ...P('ibaraki', '茨木', '妳的孩子要是被河捲走，那不是人類幹的。是黃泉。……可是妳現在要殺的，是人類的孩子。'),
        say('鬼女', '我不管！！')], () => { HW.actors = HW.actors.filter(x => x !== e); if (e) { e.stun = 0; e.hwa = 0; e.hwq = 1; e.hp = e.hpMax = Math.round(e.hpMax * 4); e.atk = Math.round(e.atk * 1.35); e.ratio *= 1.12; G.UI.banner('鬼女', '失去孩子的母親'); }
        HW.fight = { map: 'W_R01_01', title: '平息鬼女', waves: [{ t: [], n: 0 }], w: 0, spawned: 1, gap: 30, from: [p], onWin: end }; }); }); }
    function end() { G.DLG.start([nar('（鬼女跪在地上，抓著那件小衣服。）'),
        ...(inP('ibaraki') ? [say('茨木', '……走吧。回山裡去。等這一切結束，我陪妳去河下游找。')] : [雪('……等天亮，我們幫妳找。我答應妳。')]),
        nar('（鬼女看了你們很久，轉身往山裡走去。）'), say('村長', '蒼真大人……城裡那邊，你們回不去了吧。'), 蒼('什麼意思？'),
        say('村長', '傍晚有個從城裡逃出來的挑夫經過，說城的外面，罩著一層紫黑色的牆。人走進去，就再也沒出來。'),
        say('甚藏', '（從屋後走出來，渾身是灰）……是我說的。我親眼看到的。那牆……會說話。它在念經。'), 雪('……念經？不是黃泉之氣。是陰陽術。'), 丸('有人在利用這場災。')],
      () => { F().kijo_met = 1; fightEnd(); if (HUB.marks) HUB.marks = HUB.marks.filter(m => !m.hw3); HW.w3marks = null; G.SAVE.markDirty(); done(); }); }
    const intro = [say('真穗', '（回頭）……蒼真大人？！你們來了！'), say('真穗', '鬼……好多鬼，從山上下來的！村長帶著男人們去堵山路，到現在都沒回來！'),
      say('小太', '（從水車後面探頭）蒼真哥！阿松姐在屋裡，門被鬼堵住了，她出不來！'), 蒼('小太，回水車後面。數到一百之前不准出來。'), say('小太', '……一、二、三……'),
      丸('這些鬼不是黃泉來的。它們身上沒有死人的味道。……是被趕下山的。'), 雪('黃泉之氣漫上山，山裡的鬼族待不住，往下逃——撞進了村子。'),
      ...P('ibaraki', '茨木', '（握緊拳頭）……鬼族的小崽子，被嚇得亂竄。這不是牠們的錯，可是傷了人，就是牠們的錯。')];
    if (s3.chief) return boss(); if (f.hw3_intro) return marks(); G.DLG.start(intro, () => { f.hw3_intro = 1; G.SAVE.markDirty(); marks(); }); }

  /* ======================= 九、W4　妖氣壁 ======================= */
  function w4(q, done) { H.x = 812; H.y = 890; H.face = -1; G.DLG.start([
      nar('（城南的街道盡頭，一道紫黑色的牆從地面升到天上，牆裡飄著黑色的符紙。）'), nar('（牆的另一邊，看得到城的屋頂在燒。聽得到聲音——有人在喊，有東西在笑。）'),
      蒼('（伸手碰牆，手被彈開，掌心燒出一道黑痕）……'), 丸('別碰！這東西吃人的力氣。'),
      雪('（閉上眼睛）牆上的符……是九字。臨、兵、鬥、者、皆、陣、列、在、前——每一個字，都是倒著寫的。'), 雪('倒著寫的九字，不是用來護身的。是用來「關門」的。把門關上，讓裡面的東西長大。'),
      ...P('kuzuha', '葛葉', '狐族的燈照不穿。……這種術，我只在一個人身上見過。'), ...(inP('kuzuha') ? [蒼('道摩。'), say('葛葉', '不。比道摩粗暴。道摩的術是一張紙，這是一面牆。……用的人，力氣很大，心很急。')] : []),
      nar('（牆裡傳出一個男人的聲音，懶洋洋的：「神社的劍士？聽說你很能打。可惜，這座城現在不歡迎你。」）'),
      nar('（「慢慢在外面等吧。等裡面的門開好了，我會請你進來——當祭品。」）'),
      ...P('ibaraki', '茨木', '（一拳砸在牆上，被彈飛）……混帳！滾出來！'), 雪('沒用的。……蒼真，倒著的九字，只有一個人解得開。'), 雪('寫正九字的人。……陰陽寮的安倍晴明。他在出雲。'),
      雪('時雨大人在神社搭了臨時的傳送陣。回神社吧。')], done); }

  /* ======================= 十、W5　晴明的破邪符 ======================= */
  const IZ = () => !!F().boss_D_IZUMO_04;
  function w5a(q, done) { HW.w5mark = () => { if (SC.id !== 'hub_shrine' || !HUB.marks || HUB.marks.some(m => m.id === 'hw5')) return;
      HUB.marks.push({ id: 'hw5', x: 1110, y: 640, label: '臨時傳送陣・出雲', kind: 'look', main: true, run: () => G.DLG.start([
        say('時雨', '傳送陣只剩這一座能用了。城裡的那些……全被黑水淹了。'), say('時雨', IZ() ? '出雲大社的入口，晴明大人說他會在那裡等你們。' : '出雲大社……裡面還有很多妖怪。晴明大人在最深處。'),
        { choice: [{ label: '出發', then: [act(() => { HUB.marks = HUB.marks.filter(m => m.id !== 'hw5'); done(); HUB.travel(0, '傳送陣的光把你們包住——再睜眼時，已經是出雲的山門。', [], 'D_IZUMO_01'); })] }, { label: '再準備一下', then: [] }] }]) }); };
    HW.w5mark(); }
  const seimei = done => G.DLG.start([
      say('安倍晴明', '（背對著你們，看著一盆水）兩岸城的方向，天是紫的。……你們是為那道牆來的。'), say('安倍晴明', '倒九字。陰陽寮兩百年前就禁了。會用的人，我知道的只有一個門派——道摩的門下。'),
      say('安倍晴明', '黑符……不，黑符沒這麼大的力氣。是他的雙胞胎哥哥，「玄符」。兩個人長得一模一樣，連陰陽寮的人都分不清。當年一起被除名的，就是這對兄弟。'),
      DN('c9_s_bounty') ? say('安倍晴明', '你殺了黑符。玄符會恨你一輩子——你殺的，是他在這世上唯一的親人。……他越恨，越容易犯錯。') : say('安倍晴明', '弟弟還在外面躲，哥哥卻自己出手。……玄符急了。他要的東西，就在城裡。'),
      蒼('他要什麼？'), say('安倍晴明', '倒九字是「關門養東西」的術。他在城裡養一道門——第二道黃泉口。'),
      say('安倍晴明', '後山的封印石碎了，黃泉的門只會開在後山。可是如果城裡也有一道，大禍津日就能從兩邊出來。'), 雪('……兩邊。後山一邊，城裡一邊。'),
      say('安倍晴明', '（遞出一張符）正九字。貼在牆的正中央，我寫的字會把他的字一個一個翻回來。'), say('安倍晴明', '……巫女，你的手。'), 雪('（把手藏到身後）……沒事。'),
      say('安倍晴明', '你撐不了多久。快去。'), act(() => { F().hw_ofuda = 1; G.SAVE.markDirty(); G.UI.banner('獲得　晴明的破邪符', '貼在兩岸城的妖氣牆上'); })], done);
  function w5b(q, done) { seimei(done); }
  function w5c(q, done) { const go = () => { if (SC.id !== 'D_IZUMO_04') return; if (!IZ() || G.E.some(e => e.bb && e.hp > 0) || G.DLG.active()) return G.STORY.later(60, go); seimei(done); }; go(); }

  /* ======================= 十一、W6　反擊開始 ======================= */
  function w6a(q, done) { H.x = 812; H.y = 890; H.face = -1; G.DLG.start([
      say('孫六', '（在牆前等著，手臂吊著）神社的劍士。我們等你很久了。'), 蒼('你的手——'), say('孫六', '還有一隻。夠了。……城裡還有人。躲在倉庫、躲在井裡。我數過，至少三十個沒逃出來。'),
      say('孫六', '牆一破，我們就進去。'), nar('（你把晴明的符貼上牆。）'), nar('（符上的字一個一個亮起來。牆上倒著的九字開始轉，一個、兩個……轉正的字，像玻璃一樣碎掉。）'),
      nar('（牆破了一個洞。洞後面，是燒成焦土的城。）'), say('文也', '（站在隊伍最後，聲音發抖）……私塾。私塾不見了。')], () => {
      F().hw_break = 1; G.SAVE.markDirty(); SC.shake = 10; HW.pendNext = done; SC.trans = { t: 0, to: ID, at: [180, 612] }; }); }
  function w6b(q, done) { if (HW.fight) return; Q.load(['yomigun', 'shikome', 'skelgun', 'hannya']);
    const go = () => HW.startFight({ map: ID, title: '奪回西口', sub: '把亡者趕出西口', from: [[560, 600], [600, 640], [520, 570]],
      waves: [{ t: ['yomigun'], n: 5 }, { t: ['shikome', 'shikome', 'skelgun'], n: 5 }, { t: ['yomigun'], n: 4, elite: '般若', eliteT: 'hannya', eliteSub: '戴著祭典面具的影子',
        onElite: () => G.STORY.later(20, () => G.DLG.start([nar('（一個戴著般若面的影子從十字路口走來，面具底下流著黑水。）'), 雪('那個面……是城裡祭典用的面具。它戴著祭典的面具……它是城裡的人。'), 丸('……曾經是。')])) }],
      onWin: () => { HW.prop('fort_ours', 150, 600, 330); HW.wp('war_abatis', 340, 588, 0.9); HW.wp('war_abatis', 340, 644, 0.9); HW.wp('war_brazier', 250, 662, 0.9); HW.wp('war_banner_ours', 90, 566, 0.8);
        G.DLG.start([say('孫六', '（把一面破旗插在西口）——這裡，從今天起是我們的。'), say('孫六', '冬馬，拒馬兩座，擺在東邊。篝火生起來，傷兵輪流烤。'), say('冬馬', '是！'),
          say('景綱', '（從神社趕來，帶著兩車兵糧）兵糧我帶來了。神社的人省下來的。'), say('景綱', '孫六，這座本陣交給你。'), say('孫六', '大人呢？'),
          say('景綱', '我在城裡出生，在城裡長大。……城裡哪條巷子通哪裡，我比誰都清楚。我留下來畫地圖。'),
          雪('（看著城北的方向，臉色蒼白）……蒼真。那邊，城門前面。'), 雪('有一道門。不是城門。是在地底下開的門……跟後山一樣的味道，可是更新、更餓。'), 雪('玄符在餵它。用城裡的死人。'),
          蒼('那我們現在就去——'), 雪('（抓住他的袖子）不行。現在打進去，門會「吃」掉打進去的人。'), 雪('要先把後山那一道關上。兩道門是連著的。後山那道關上，這道就餓了。……那時候才打得贏。'),
          say('孫六', '……所以，你們要下黃泉。'), say('孫六', '去吧。這裡我守。……神社的劍士，回來的時候，記得從西口進城。我會在這裡。')], () => { fightEnd(); done(); }); } });
    const intro = () => G.DLG.start([say('冬馬', '（從倒塌的倉庫裡拖出一個人）隊長！有人！還活著！'), say('孫六', '好！先扛去後面。——弓組！上屋頂，還站著的屋頂！')], go);
    G.STORY.later(30, intro); }

  /* ======================= 十二、任務登錄 ======================= */
  const T = (map, text, run, o) => Object.assign({ t: 'fn', map, text, run }, o || {});
  Q.add({ id: 'hw1', ch: 10, main: true, postBoss: true, after: 'c10_after', title: '兩岸城淪陷', desc: '城裡的警鐘響了。', reward: { exp: 300 },
    steps: [T(ID, '回兩岸城', w1)] });
  Q.add({ id: 'hw2', ch: 10, main: true, postBoss: true, after: 'hw1', title: '神社的燈火', desc: '亡者追到了神社。', reward: { exp: 420, gold: 300 },
    steps: [T('hub_shrine', '守住神社的避難所', w2)] });
  Q.add({ id: 'hw3', ch: 10, main: true, postBoss: true, after: 'hw2', title: '水車村的求救', desc: '西邊的水車村燃起火光。', reward: { exp: 440, gold: 320 },
    steps: [T('W_R01_01', '到藥路水車聚落救人', w3)] });
  Q.add({ id: 'hw4', ch: 10, main: true, postBoss: true, after: 'hw3', title: '妖氣壁', desc: '兩岸城被一道紫黑色的牆罩住了。', reward: { exp: 200 },
    steps: [T(ID, '到兩岸城城南查看', w4)] });
  Q.add({ id: 'hw5', ch: 10, main: true, postBoss: true, after: 'hw4', title: '晴明的破邪符', desc: '只有寫正九字的人，解得開倒九字。', reward: { exp: 420, gold: 300 },
    steps: [T('hub_shrine', '用神社的臨時傳送陣前往出雲', w5a), T('D_IZUMO_01', '在出雲山門見安倍晴明', w5b, { skip: () => !IZ() }), T('D_IZUMO_04', '突破出雲大社，到最深處見安倍晴明', w5c, { skip: () => !!F().hw_ofuda })] });
  Q.add({ id: 'hw6', ch: 10, main: true, postBoss: true, after: 'hw5', title: '反擊開始', desc: '帶著破邪符回到兩岸城。', reward: { exp: 480, gold: 360 },
    steps: [T(ID, '到兩岸城城南，用破邪符打開妖氣牆', w6a), T(ID, '奪回西口', w6b)] });
  HW.QIDS = ['hw1', 'hw2', 'hw3', 'hw4', 'hw5', 'hw6'];

  /* ======================= 十三、既有劇情改寫（第 11 章） ======================= */
  if (HUB.OP && HUB.OP[11]) HUB.OP[11].lines = [
    雪('（神社的避難所。帳篷之間，人們輪流守夜。）'), 丸('風裡有死人的味道。……從城的方向，也從後山。'),
    雪('黃泉之氣不只灌進城裡。後山的封印石……已經撐不住了。'), say('孫六', '（從城裡回來報信，滿身是灰）本陣守得住。可是城北那道門，每天都在變大。'),
    雪('所以，要先關上後山那一道。'), 雪('蒼真，這一次，我必須跟你一起下去。'), 蒼('太危險了。'), 雪('黃泉的門，只有「器」打得開。……也只有「器」關得上。')];
  { const q = Q.by.c11_m1; if (q) { q.desc = '在本陣與避難所，看看大家。'; q.steps[0] = { t: 'gather', map: 'hub_shrine', text: '巡視神社的避難所', spots: [
      { at: [620, 600], label: '梅乃婆婆的帳篷', lines: [say('梅乃婆婆', '外面好黑……柚吉在發燒。'), 蒼('蓋好被子。天會亮的。')] },
      { at: [990, 600], label: '文也的帳冊', lines: [say('文也', '名字我都記下了。二十四個人，十三個名字。……剩下的，我會一個一個問回來。')] },
      { at: [840, 520], label: '景綱', lines: [say('景綱', '城交給孫六，避難所交給我。……你去做你該做的事。')] }] }; } }
  { const q = Q.by.c11_s_souls; if (q) { q.desc = '亡魂跟著避難民來到了神社。'; q.giver = Object.assign({}, q.giver, { map: 'hub_shrine', at: [1060, 600], dy: 0, dx: 0, lines: [say('蓬庵', '黃泉的門開了，跟著避難民來的……還有很多找不到路的人。'), say('蓬庵', '老夫治得了病，治不了這個。神社的人，拜託了。')] });
      q.steps = [{ t: 'kill', map: 'hub_shrine', at: [800, 820], n: 5, foes: ['onryo', 'aoonryo'], text: '淨化參道上迷途的亡魂' },
        { t: 'talk', map: 'hub_shrine', at: [1060, 600], u: 'n_hoan', name: '蓬庵', text: '回報蓬庵', lines: [say('蓬庵', '……他們走了。'), say('蓬庵', '老夫看見一個孩子對我揮手。是三十年前沒救回來的那個。')] }]; } }
  { const q = Q.by.c11_s_yokai; if (q) { const n0 = q.need; q.need = () => false; q.giver && (q.giver.need = () => false); } }   /* 併入城內爭奪的東方援軍 */

  /* ======================= 十四、舊存檔與進場處理 ======================= */
  function legacy() { const f = F(), qs = G.SAVE.data.qs = G.SAVE.data.qs || {}; if (f.hw_legacy) return;
    const mark = L => L.forEach(id => { if (!qs[id] || !qs[id].done) qs[id] = { s: 0, k: 0, done: 1, t: Date.now() }; });
    if (f.ch12 || f.op12 || f.end) { mark(HW.QIDS.concat(['hw7', 'hw8'])); f.hw_break = 1; f.hw_legacy = 2; }
    else if (f.ch11 || f.op11) { mark(HW.QIDS); f.hw_break = 1; f.hw_legacy = 1; }
    else f.hw_legacy = 0.5;
    G.SAVE.markDirty(); }
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { try { if (G.SAVE.data && !F().hw_legacy) legacy(); } catch (e) {}
    clearProps(); HW.fight = null; en0(id); limit(); if (SC.def && SC.def._hwS) fightEnd();
    if (id === 'hub_shrine' && (HW.phase() === 'sealed' || HW.phase() === 'w6' || HW.phase() === 'base' || HW.phase() === 'battle') && DN('hw1')) CAMP();
    if (id === ID && (HW.phase() === 'base' || HW.phase() === 'battle')) { HW.prop('fort_ours', 150, 600, 330); HW.wp('war_abatis', 340, 588, 0.9); HW.wp('war_abatis', 340, 644, 0.9); HW.wp('war_brazier', 250, 662, 0.9); HW.wp('war_banner_ours', 90, 566, 0.8); }
    HW.prune && HW.prune();
    if (HW.pendNext && id === ID) { const d = HW.pendNext; HW.pendNext = null; G.STORY.later(10, d); } };
  function marksTick() { HW.prune && HW.prune(); if (HW.w5mark && AC('hw5') && Q.state('hw5') && Q.state('hw5').s === 0) HW.w5mark();
    if (HW.w3marks && AC('hw3') && SC.id === 'W_R01_01' && HUB.marks && !HUB.marks.some(m => m.hw3) && !HW.fight && !HW.sc && !G.DLG.active()) HW.w3marks(); }
  /* 封鎖～奪回前：城裡只留攻防篇的標記（其他委託人跟居民一起避難去了），城南告示牌保留 */
  const WAR = () => { const p = HW.phase(); return p === 'sealed' || p === 'w6' || p === 'base' || p === 'battle'; };
  HW.prune = function () { try { if (SC.id === ID && WAR()) {
      for (const m of Q.marks) if (m.q && !/^hw|^c11_m/.test(m.q.id)) { if (m.n && AMB) AMB.remove(m.n); m.dead = 1; }
      Q.marks = Q.marks.filter(m => !m.dead); if (HUB.marks) HUB.marks = HUB.marks.filter(m => !m.dead && (m.q ? /^hw|^c11_m/.test(m.q.id) : m.id === 'south' || m.hw)); } } catch (e) { console.warn('hw prune', e); } };
})();
