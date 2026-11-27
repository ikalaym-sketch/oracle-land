/* ==========================================================================
 * 神諭之地 重製版 — 22_event.js
 * Version : r3.153.0  (2026-11-27)　r3.153.0：世界事件提醒移到小地圖下方
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：菁英／章節頭目血條移到上方中央，菁英在畫面外不顯示
 * 舊版    : r3.113.0  (2026-11-26)　r3.113.0：匯出事件工具 EV.H（140_events 新世界事件用）
 * 舊版    : r3.107.0  (2026-11-26)　r3.107.0：副本、合戰難度改只疊等級（不乘血量／攻擊）
 * 舊版    : r3.56.0  （r3.56.0：寶箱打開後淡出移除；道摩軍人數加倍＋援軍　r3.54.0：世界事件——人已在該圖也會開始、任務波次結束後補發、被任務打斷可重來；山賊營／入侵／道摩軍加合戰防禦物與更多守軍；道摩大筒會砲擊　r3.28.0：炭里改為第五章「炭里長屋」　r3.19.3：世界事件提醒移到選單鍵下方）
 * 舊版    : r3.19.2  （r3.19.2：世界事件提醒移到遊戲畫面右上角，地圖頁不再壓一條）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 世界頭目改「宣告制」：劇情旗標 flags.wbOpen 開啟後每 60 分鐘宣告一次地點（已到訪＋該章已通關），
 *           30 分鐘內進該圖才出現，逾時未交戰自動消失；取消「進圖必出、1 小時復活」。世界事件只挑已到訪的地圖／城鎮；
 *           進場即記錄到訪（seen）。新增 EV.bossLock()：頭目戰中禁止換圖（02_scene 出口、選單傳送）。
 * 變更    : r3.9.1 序幕結束前（flags.prologue）不觸發隨機／世界事件（原本開場走位時跳出「世界事件：討伐委託」）。
 * 變更    : r3.9.0 世界頭目可出現在章節頭目地圖：頭目戰進行中先等，打完才出現。
 * 變更    : r3.8.0 單隻頭目血條略過 P3 頭目（26_boss 自畫群組血條）。
 * 變更    : r3.7.0 事件生成點改用可走遮罩的寬敞區（不再生在水面／牆上）。
 * 變更    : r3.5.0 新增。隨機事件（野外 13 種＋各章專屬）、世界事件（每 20 分鐘輪替）、世界頭目（1 小時復活）、
 *           事件寶箱／地藏（P7 道具圖）、妖玉（新貨幣）、難度倍率（副本／合戰用，23_warp 設定）。
 * 說明    : ・隨機事件：進野外地圖 25%（連續兩張圖不會都有），頭目圖、副本、劇情首次通過時不觸發。
 *           ・事件期間一般妖怪暫停（只出事件怪）；完成後恢復。目標顯示在 HUD 上方。
 *           ・世界事件存 G.SAVE.data.wev {k,map,until,done}；世界頭目擊殺時間存 wbT。
 *           ・敵人等級＝max(地圖等級, 主角等級)（世界事件／世界頭目）；一般隨機事件用地圖等級。
 *           ・道具（寶箱、地藏、營寨）用 G.NPC 排序繪製（n.prop），點擊走 G.UI.near。
 * 依賴    : 20_npc（G.AMB.add／remove／bubble）、02_scene、03_actors（spawnOni）、07_rpg、18_world、21_shop。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC, AM = G.AMB, S = () => G.SAVE.data, F = () => G.SAVE.data.flags, rd = () => G.RPG.d();
  const rnd = a => a[Math.floor(Math.random() * a.length)], has = t => G.ENEMY_IDX && G.ENEMY_IDX[t];
  const EV = G.EV = { cur: null, cool: 0, mul: null, props: [] };
  const PSC = { chest_village_normal_closed: 22, chest_village_normal_open: 22, chest_village_rare_closed: 24, chest_village_rare_open: 30, chest_village_legend_closed: 28, chest_village_legend_open: 27,
    save_shrine_village_idle: 50, warp_village_disabled: 26, lost_parcel_static: 34, rice_cargo_static: 36, broken_wheel_static: 34, break_village_crate_intact: 24, break_village_barrel_intact: 24, wood_barrier_close: 58, sign_village_idle: 40 };
  let PR = null; G.ANIM.load('pr_ev').then(u => { PR = u; }).catch(e => console.warn(e));

  /* ---------- 共用 ---------- */
  const heroLv = () => rd().lv;
  function spot(minD, maxD, cx, cy) { cx = cx === undefined ? G.H.x : cx; cy = cy === undefined ? G.H.y : cy;
    for (let k = 0; k < 80; k++) { const a = Math.random() * 6.283, r = minD + Math.random() * (maxD - minD), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.5;
      if (x > 60 && x < SC.def.w - 60 && SC.room(x, y) >= 3) return [x, y]; }
    for (let k = 0; k < 200; k++) { const x = 100 + Math.random() * (SC.def.w - 200), y = SC.y0 + Math.random() * (SC.y1 - SC.y0); if (SC.room(x, y) >= 3) return [x, y]; }
    return [G.H.x, G.H.y]; }
  function elite(e, k) { e.elite = 1; e.hp = e.hpMax = Math.round(e.hpMax * (k || 3)); e.atk = Math.round(e.atk * 1.3); e.ratio *= 1.15; return e; }
  function foesOf(d) { return (d.foes || []).filter(has); }
  /* 一波：types 隨機，count 隻，圍在 (cx,cy) */
  function wave(c, types, count, o) { o = o || {}; types = types.filter(has); if (!types.length) types = foesOf(SC.def); if (!types.length) types = ['akaoni'];
    const out = []; for (let i = 0; i < count; i++) { const p = spot(o.r0 || 170, o.r1 || 320, o.cx, o.cy), e = G.spawnOni(p[0], p[1], 20 + i * 22, c.lv + (o.lvUp || 0), rnd(types)); e.ev = 1; out.push(e); }
    if (o.elite) { const p = spot(150, 260, o.cx, o.cy), e = elite(G.spawnOni(p[0], p[1], 40, c.lv + 2, o.elite), o.ek || 4); e.ev = 1; e.boss = !!o.boss; out.push(e); c.bossE = e; }
    return out; }
  const alive = () => G.E.filter(e => e.ev && e.st !== 'dead').length;
  function load(types) { return G.ASSET.enemies(types.filter(has)); }
  function loot(kind, o) { const p = spot(20, 60); G.LOOT.push(Object.assign({ x: p[0], y: p[1], t: 0, kind }, o)); }
  function itemQ(lv, q0) { let it = null; for (let k = 0; k < 120; k++) { it = G.RPG.roll(lv, SC.def.region || 'wind'); if (it.q >= q0) break; } if (it.q < q0) it.q = q0; return it; }
  /* 獎勵：m＝倍率，q＝保底品質，yg＝妖玉 */
  function reward(c, m, q, yg) { const lv = c.lv; loot('gold', { v: Math.round((25 + lv * 7) * m) });
    const mk = Object.keys(G.RPG.MATS); loot('mat', { id: rnd(mk), n: 2 + Math.floor(m) });
    if (q !== undefined && q >= 0) loot('item', { it: itemQ(lv, q) });
    if (yg) { rd().yg = (rd().yg || 0) + yg; G.SAVE.markDirty(); G.UI.toast('妖玉 +' + yg); } }
  function finish(c, title, sub) { if (c.done) return; c.done = true; if (c.world && S().wev) S().wev.done = 1; G.UI.banner(title || (c.n + '　完成'), sub || ''); G.SAVE.markDirty(); resume(); }
  function fail(c, why) { if (c.done) return; c.done = true; c.failed = true; G.UI.banner(c.n + '　失敗', why || ''); resume(); }
  function resume() { const d = SC.def; if (!d.safe && d.spawn) { SC.auto = true; SC.respawnT = 0; } }
  /* ---------- 道具（寶箱、地藏…） ---------- */
  function prop(k, x, y, o) { const n = Object.assign({ prop: 1, k, x, y, face: 1, alpha: 0 }, o || {}); EV.props.push(n); G.NPC.push(n); return n; }
  function unprop(n) { EV.props = EV.props.filter(q => q !== n); const i = G.NPC.indexOf(n); if (i >= 0) G.NPC.splice(i, 1); }
  const dn0 = G.drawNpc;
  G.drawNpc = function (n) { if (!n.prop) return dn0(n); if (!PR) return; const rec = PR.act[n.k]; if (!rec) return; const f = rec.f[rec.f.length - 1], s = SC.depth(n.y), sc = (PSC[n.k] || 30) * s / f[3];
    if (n.opened) { n.label = null; n.glow = 0; n.op = (n.op || 0) + 1; n.alpha = Math.max(0, 1 - Math.max(0, n.op - 40) / 50);   // r3.56.0：打開後 0.7 秒開始淡出、1.5 秒移除
      if (n.op > 90) { G.NPC = G.NPC.filter(q => q !== n); EV.props = EV.props.filter(q => q !== n); return; } }
    else if (n.alpha < 1) n.alpha = Math.min(1, n.alpha + 0.05);
    ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, f[2] * sc * 0.42, f[2] * sc * 0.12, 0, 0, 6.283); ctx.fill();
    if (n.glow) { const a = 0.35 + 0.25 * Math.sin(G.t * 0.12); ctx.fillStyle = `rgba(255,220,120,${a})`; ctx.beginPath(); ctx.ellipse(n.x, n.y, f[2] * sc * 0.7, f[2] * sc * 0.22, 0, 0, 6.283); ctx.fill(); }
    G.ANIM.draw(PR, f, n.x, n.y, sc, false, n.alpha); };
  /* ---------- 事件定義（野外隨機） ---------- */
  const SPEC = { 1: ['竹林騷動', ['bamboo', 'kodama'], 'yamawaro'], 2: ['河童鬧水', ['aokappa', 'akakappa'], 'mizuchi'], 3: ['狐火夜行', ['kitsunebi', 'chadanuki', 'baketanuki'], 'nekomata'],
    4: ['雷獸出沒', ['muraiju', 'enemy_raiju'], 'naruikazuchi'], 5: ['爐火妖', ['onichochin', 'chochin', 'akachochin'], 'kasha'], 6: ['八岐的眷屬', ['nozuchi', 'mizuchi'], 'wani'],
    7: ['紙妖亂舞', ['karakasa', 'ittan', 'kinkasa'], 'nurikabe'], 8: ['山中鬼宴', ['kurooni', 'midorioni', 'yoioni'], 'ushioni'], 9: ['蛛網蔓延', ['kogumo', 'kumohei'], 'jorogumo'],
    10: ['海坊主浮現', ['isoonna', 'umibozu'], 'oumibozu'], 11: ['黃泉軍', ['yomigun', 'skel', 'skelgun', 'gaki'], 'skelred'], 12: ['道摩親衛', ['doma_spear_soldier', 'doma_shield_soldier', 'doma_archer'], 'doma_ritualist'] };
  const BANDIT = ['bandit_knife', 'bandit_axe', 'bandit_archer', 'sanzoku'], RONIN = ['nobushi', 'yariron', 'kengo'], DOMA = ['doma_spear_soldier', 'doma_shield_soldier', 'doma_archer'];
  /* 多波推進：W＝[[types,count,opt]...] */
  function waves(c, W, onDone) { c.W = W; c.wi = -1; c.next = () => { c.wi++; if (c.wi >= W.length) return onDone(); const [t, n, o] = W[c.wi]; wave(c, t, n, o); if (c.wi > 0) G.UI.toast('第 ' + (c.wi + 1) + '／' + W.length + ' 波'); };
    c.wstep = () => { if (c.wi >= 0 && c.wi < W.length && c.spawned && alive() === 0) c.next(); };
    load([].concat(...W.map(w => w[0].concat(w[2] && w[2].elite ? [w[2].elite] : [])))).then(() => { if (EV.cur !== c) return; c.spawned = true; c.next(); }); }
  const RAND = [
    { k: 'peddler', n: '行商路過', w: 10, quiet: 1, start(c) { const p = spot(120, 260); AM.add(rnd(['n_suzuo', 'n_sagitsune', 'n_hoan']), p[0], p[1], { name: '行商・' + rnd(['阿與', '吉次', '小鈴']), shop: 'peddler_' + Date.now(), hold: 1 })
      .then(n => { if (n) { c.npc = n; AM.bubble(n, '走過路過別錯過！', 140); } }); c.obj = () => '行商人在附近：可以買特殊貨品'; G.UI.banner('行商路過', '附近有走商人，貨品城裡買不到'); } },
    { k: 'child', n: '迷路小孩', w: 7, quiet: 1, start(c) { const p = spot(150, 300); AM.add(rnd(['n_renta', 'n_yuzukichi']), p[0], p[1], { hold: 1, onTalk: n => {
        G.DLG.start([{ who: n.name, text: '嗚……我找不到回村子的路了……' }, { who: '蒼真', text: '別哭。我帶妳去最近的村子。' }, { who: n.name, text: '真的嗎？你不會丟下我吧？' }], () => {
          n.follow = true; n.onTalk = m => AM.bubble(m, '要到村子了嗎？', 90); EV.escort = { u: n.u, name: n.name, lv: c.lv }; finish(c, '迷路小孩', '帶他到任何一個城鎮或村莊'); }); } })
      .then(n => { if (n) AM.bubble(n, '嗚嗚……', 160); }); c.obj = () => '有個孩子在哭……'; } },
    { k: 'ronin', n: '浪人挑戰', w: 8, start(c) { const t = RONIN.filter(has); if (!t.length) return c.skip = 1; load(t).then(() => { if (EV.cur !== c) return;
      const p = spot(160, 240), e = elite(G.spawnOni(p[0], p[1], 90, c.lv + 3, rnd(t)), 4.5); e.ev = 1; c.spawned = true; G.UI.banner('浪人挑戰', '「聽說你很強。拔刀吧。」'); });
      c.obj = () => '浪人挑戰：擊敗浪人'; c.step = () => { if (c.spawned && !alive()) { reward(c, 2.2, 1); finish(c); } }; } },
    { k: 'bandit', n: '山賊攔路', w: 8, start(c) { const p = spot(100, 200); AM.add(rnd(['n_handcart_porter', 'n_sohachi']), p[0], p[1], { hold: 1, onTalk: n => AM.bubble(n, c.done ? '謝謝你！這是一點心意。' : '救命啊！山賊要搶貨！', 120) })
      .then(n => { if (n) { c.npc = n; AM.bubble(n, '救命啊——！', 160); } });
      waves(c, [[BANDIT, 3, { cx: p[0], cy: p[1] }], [BANDIT, 4, { cx: p[0], cy: p[1] }], [BANDIT, 2, { cx: p[0], cy: p[1], elite: 'bandit_leader', ek: 4 }]], () => { reward(c, 2.5, 1); if (c.npc) AM.bubble(c.npc, '謝謝你！這些拿去吧！', 160); finish(c, '山賊攔路　擊退', '挑夫送了謝禮'); });
      c.obj = () => '山賊攔路：保護挑夫（第 ' + (c.wi + 1) + '／3 波）'; G.UI.banner('山賊攔路', '有挑夫被山賊包圍了！'); } },
    { k: 'ambush', n: '伏擊', w: 8, start(c) { const f = foesOf(SC.def); waves(c, [[f, 4, { r0: 120, r1: 220 }], [f, 5, { r0: 120, r1: 220 }], [f, 5, { r0: 120, r1: 220, lvUp: 1 }]], () => { reward(c, 2, 0); finish(c, '突破伏擊'); });
      c.obj = () => '伏擊：撐過 3 波（第 ' + (c.wi + 1) + ' 波）'; G.UI.banner('伏擊！', '妖怪從四面八方圍上來了'); } },
    { k: 'chest', n: '路邊寶箱', w: 8, quiet: 1, start(c) { const p = spot(140, 320), mim = Math.random() < 0.3, ch = prop(Math.random() < 0.2 ? 'chest_village_rare_closed' : 'chest_village_normal_closed', p[0], p[1], { glow: 1, label: '寶箱' });
      ch.run = () => { if (ch.opened) return; ch.opened = 1; ch.glow = 0; ch.k = ch.k.replace('closed', 'open');
        if (mim) { const t = ['karakasa', 'onichochin', 'chochin'].filter(has); load(t).then(() => { const e = elite(G.spawnOni(ch.x + 30, ch.y, 10, c.lv + 2, rnd(t.length ? t : ['akaoni'])), 3); e.ev = 1; c.spawned = 1; c.mim = 1; G.UI.banner('寶箱妖！', '寶箱咬人了'); }); SC.auto = false; }
        else { reward(c, 1.5, ch.k.includes('rare') ? 2 : 1); finish(c, '打開寶箱', ''); } };
      c.step = () => { if (c.mim && c.spawned && !alive()) { reward(c, 2.5, 2); finish(c, '寶箱妖　擊敗'); } }; c.obj = () => ch.opened ? (c.mim && !c.done ? '寶箱妖：擊敗牠' : '') : '附近有個寶箱'; } },
    { k: 'injured', n: '受傷旅人', w: 6, quiet: 1, start(c) { const p = spot(140, 280); AM.add(rnd(['n_jinpei', 'n_chogaku', 'n_kozueha']), p[0], p[1], { hold: 1, onTalk: n => {
        const cs = G.SHOP && G.SHOP.cons(); if (c.done) return AM.bubble(n, '多虧了你，我好多了。', 100);
        if (cs && (cs.herb > 0 || cs.herb2 > 0)) { const k = cs.herb > 0 ? 'herb' : 'herb2'; G.DLG.start([{ who: n.name, text: '被妖怪抓傷了……你有藥嗎？' }, { who: '蒼真', text: '拿去，先止血。（交出 1 份藥）' }, { who: n.name, text: '謝謝……這是我身上最值錢的東西，收下吧。' }], () => { cs[k]--; reward(c, 1.8, 2); finish(c, '幫助了受傷的旅人'); }); }
        else G.DLG.start([{ who: n.name, text: '被妖怪抓傷了……你有藥嗎？' }, { who: '蒼真', text: '（身上沒有藥。城鎮的藥舖買得到。）' }]); } })
      .then(n => { if (n) AM.bubble(n, '好痛……', 160); }); c.obj = () => c.done ? '' : '有人倒在路邊'; } },
    { k: 'jizo', n: '地藏祈福', w: 6, quiet: 1, start(c) { const p = spot(140, 300), j = prop('save_shrine_village_idle', p[0], p[1], { glow: 1, label: '路邊地藏' });
      j.run = () => { if (c.done) return G.UI.toast('已經祈福過了'); G.H.hp = G.H.hpMax; G.BUFF.add('atk', 10, 18000); G.BUFF.add('crit', 5, 18000); j.glow = 0; finish(c, '地藏祈福', '生命全滿，5 分鐘內攻擊 +10%、會心 +5%'); };
      c.obj = () => c.done ? '' : '路邊有一尊地藏'; } },
    { k: 'foxwed', n: '狐狸娶親', w: 9, ch: [3, 3], quiet: 1, start(c) { const y = (SC.y0 + SC.y1) / 2, far = G.H.x < SC.def.w / 2, x0 = far ? SC.def.w - 160 : 160, x1 = SC.def.w / 2 + (far ? 120 : -120), dir = far ? 1 : -1, list = ['n_t_fox_elder', 'n_a_fox', 'n_a_fox', 'n_a_fox', 'n_a_fox'];
      G.UI.banner('狐狸娶親', '別靠近隊伍，安靜地讓牠們過去'); c.obj = () => '狐狸娶親：別靠近隊伍（' + Math.max(0, Math.ceil((c.T || 0) / 60)) + ' 秒）'; c.T = 1500; c.q = [];
      list.forEach((u, i) => { let yy = y + (i % 2 ? 14 : -10), xx = x0 + dir * i * 46; if (!SC.walkable(xx, yy)) yy = y; AM.add(u, xx, yy, { march: 1, R: 0, spd: 0.42, st: 'walk', tx: x1, ty: yy, hx: x1, hy: yy, onArrive: n => { n.gone = 1; } }).then(n => n && c.q.push(n)); });
      c.step = () => { if (c.done) return; c.T--; if (c.q.some(n => Math.hypot(n.x - G.H.x, (n.y - G.H.y) * 1.5) < 70)) { c.q.forEach(n => AM.remove(n)); fail(c, '隊伍被驚動，消失在霧裡'); return; }
        if (c.T <= 0 || (c.q.length && c.q.every(n => n.gone))) { c.q.forEach(n => AM.remove(n)); rd().mats.jade = (rd().mats.jade || 0) + 3; reward(c, 2, 2, 1); finish(c, '狐狸娶親', '狐族送來回禮：勾玉原石 ×3'); } }; } },
    { k: 'fog', n: '迷霧', w: 6, start(c) { EV.fog = 1; const f = foesOf(SC.def); load(f).then(() => { if (EV.cur !== c) return; for (let i = 0; i < 2; i++) { const p = spot(220, 420), e = elite(G.spawnOni(p[0], p[1], 60 + i * 40, c.lv + 2, rnd(f)), 3); e.ev = 1; } c.spawned = 1; });
      c.drop = 2; c.keepSpawn = 1; c.obj = () => '迷霧：菁英出沒，掉寶 ×2'; G.UI.banner('迷霧瀰漫', '看不清的地方，藏著更強的妖怪'); } },
    { k: 'herd', n: '動物群', w: 5, quiet: 1, start(c) { const pool = (G.NPCD.FIELD[SC.def.ch || 1] || []).filter(u => !/sparrow|crow|butterfly|dragonfly/.test(u)); if (!pool.length) return c.skip = 1;
      const u = rnd(pool), p = spot(180, 340); for (let i = 0; i < 4; i++) AM.add(u, p[0] + (Math.random() - 0.5) * 90, p[1] + (Math.random() - 0.5) * 30, { R: 70 });
      const ch = prop('chest_village_normal_closed', p[0], p[1] + 6, { glow: 1, label: '動物守著的東西' }); ch.run = () => { if (ch.opened) return; ch.opened = 1; ch.glow = 0; ch.k = 'chest_village_normal_open'; reward(c, 1.6, 1); finish(c, '動物群的寶物'); };
      c.obj = () => ch.opened ? '' : '一群動物圍著什麼東西'; } },
    { k: 'spec', n: '妖氣異變', w: 7, start(c) { const sp = SPEC[SC.def.ch] || SPEC[1]; c.n = sp[0]; const f = sp[1].filter(has).length ? sp[1] : foesOf(SC.def);
      waves(c, [[f, 4], [f, 5], [f, 3, { elite: has(sp[2]) ? sp[2] : f[0], ek: 5 }]], () => { reward(c, 2.6, 2); finish(c, sp[0] + '　平息'); }); c.obj = () => sp[0] + '（第 ' + (c.wi + 1) + '／3 波）'; G.UI.banner(sp[0], '這一帶的妖氣突然變濃了'); } },
    { k: 'doma', n: '道摩斥候', w: 5, p: 4, start(c) { waves(c, [[DOMA, 4], [DOMA, 4, { elite: 'doma_ritualist', ek: 4 }]], () => { reward(c, 2.4, 2); finish(c, '擊退道摩斥候', '他們在找勾玉……'); });
      c.obj = () => '道摩斥候（第 ' + (c.wi + 1) + '／2 波）'; G.UI.banner('道摩斥候', '黑衣人在搜索這一帶'); } }
  ];
  /* ---------- 世界事件 ---------- */
  const TOWNS = [['W_R01_01', 1], ['T_ashihomura', 2], ['W_R05_05', 5], ['hub_city', 7], ['T_akebi', 8]];
  const WEV = {
    invade: { n: '妖怪入侵', d: m => '妖怪攻進了「' + nm(m) + '」！', town: 1, start(c) { const ch = Math.max(1, SC.def.ch || 1), sp = SPEC[ch] || SPEC[1], f = foesOf(G.D.scenes[(G.WORLD.chapters[ch] || [])[1]] || {}).concat(sp[1]);
      AM.list.forEach(n => { if (!n.an && Math.random() < 0.5) AM.bubble(n, rnd(['救命啊！', '妖怪來了！', '快躲起來！']), 140); });
      EV.fort([G.H.x, G.H.y], 'invade');   // r3.54.0：村民架起的拒馬與篝火
      waves(c, [[f, 6], [f, 8], [f, 5, { elite: has(sp[2]) ? sp[2] : f[0], ek: 7, boss: 0 }]], () => { reward(c, 4, 2, 3); finish(c, '守住了' + nm(SC.id), '妖玉 +3'); AM.list.forEach(n => { if (!n.an && Math.random() < 0.5) AM.bubble(n, rnd(['得救了！', '謝謝你！', '好厲害……']), 140); }); });
      c.obj = () => '妖怪入侵（第 ' + (c.wi + 1) + '／3 波）'; } },
    camp: { n: '山賊據點', d: m => '山賊在「' + nm(m) + '」紮營了', start(c) { const p = spot(260, 420); ['wood_barrier_close', 'break_village_crate_intact', 'break_village_barrel_intact', 'rice_cargo_static'].forEach((k, i) => prop(k, p[0] + (i - 1.5) * 60, p[1] + (i % 2 ? 22 : -12)));
      EV.fort(p, 'camp');   // r3.54.0：拒馬、逆茂木、竹束、篝火、敵旗
      waves(c, [[BANDIT, 7, { cx: p[0], cy: p[1] }], [['bandit_archer', 'bandit_axe'], 8, { cx: p[0], cy: p[1] }], [BANDIT, 5, { cx: p[0], cy: p[1], elite: 'bandit_leader', ek: 8 }]], () => { reward(c, 4, 2, 3); finish(c, '剿滅山賊據點', '妖玉 +3'); });
      c.obj = () => '山賊據點（第 ' + (c.wi + 1) + '／3 波）'; } },
    ronins: { n: '浪人團', d: m => '一群浪人盤據在「' + nm(m) + '」', start(c) { EV.fort(spot(240, 360), 'ronin');
      waves(c, [[RONIN, 5], [RONIN, 6], [RONIN, 3, { elite: 'kengo', ek: 8 }]], () => { reward(c, 4, 2, 3); finish(c, '擊敗浪人團', '妖玉 +3'); });
      c.obj = () => '浪人團（第 ' + (c.wi + 1) + '／3 波）'; } },
    doma: { n: '道摩軍', p: 4, d: m => '道摩的軍隊出現在「' + nm(m) + '」', start(c) { const p = spot(300, 440); EV.fort(p, 'doma', c);
      const q = [Math.max(120, Math.min(SC.def.w - 120, SC.def.w - p[0])), p[1]];   // r3.56.0：人數加倍＋第三波援軍從另一側
      waves(c, [[DOMA, 10, { cx: p[0], cy: p[1] }], [DOMA, 14, { cx: p[0], cy: p[1] }], [DOMA, 12, { cx: q[0], cy: q[1] }], [DOMA, 8, { cx: p[0], cy: p[1], elite: 'doma_ritualist', ek: 9 }]], () => { reward(c, 4.5, 3, 4); finish(c, '擊退道摩軍', '妖玉 +4'); });
      c.obj = () => '道摩軍（第 ' + (c.wi + 1) + '／3 波）'; } },
    hunt: { n: '討伐委託', d: m => '「' + nm(m) + '」的村民請求：打倒 15 隻妖怪', start(c) { c.kill = 0; c.keepSpawn = 1; c.obj = () => '討伐委託：' + c.kill + '／15'; c.onKill = () => { if (++c.kill >= 15) { reward(c, 3.5, 2, 2); finish(c, '討伐委託　完成', '妖玉 +2'); } }; } }
  };
  EV.WEV = WEV;
  EV.H = { reward, finish, fail, waves, wave, alive, spot, elite, load, foesOf, has, rnd, prop, unprop, begin: (d, x) => begin(d, x), DOMA, BANDIT, RONIN };   /* r3.113.0：給 140_events 用 */
  const nm = id => (G.D.scenes[id] || {}).name || id;
  /* 世界頭目：章節 → 地圖、妖怪、名字；擊敗後 1 小時復活 */
  const WBOSS = [[2, 'W_R02_04', 'mizuchi', '河之主・蛟'], [3, 'W_R03_04', 'yokyubi', '妖狐・九尾幻影'], [4, 'W_R04_04', 'kuroikazuchi', '黑雷'], [5, 'W_R05_04', 'wanyudo', '輪入道'],
    [6, 'W_R06_04', 'kioni', '鬼王'], [7, 'W_R07_05', 'kagemusha', '影武者'], [8, 'W_R08_05', 'ushioni', '牛鬼'], [9, 'W_R09_05', 'jorogumo', '絡新婦'], [10, 'W_R10_05', 'oumibozu', '綿津見大神'],
    [11, 'W_R11_04', 'skelred', '赤骨將'], [12, 'W_R12_04', 'hoikazuchi', '火雷大神']];
  EV.WBOSS = WBOSS;
  EV.world = function () { const s = S(), now = Date.now(); let w = s.wev; if (w && w.until > now) return w;
    const P = AM.P(), seen = s.seen || {}, maps = []; for (let c = 2; c <= Math.min(12, P); c++) (G.WORLD.chapters[c] || []).forEach(id => { const d = G.D.scenes[id]; if (d && !d.boss && !d.safe && seen[id]) maps.push(id); });
    if (!maps.length) ['W_R01_03', 'W_R01_04'].forEach(id => { if (seen[id]) maps.push(id); });
    const towns = TOWNS.filter(t => t[1] <= P && seen[t[0]]).map(t => t[0]);   // 只挑已到訪的地圖／城鎮
    const ks = Object.keys(WEV).filter(k => (!WEV[k].p || P >= WEV[k].p) && (!WEV[k].need || WEV[k].need()) && (WEV[k].map ? !!seen[WEV[k].map] : WEV[k].town ? towns.length : maps.length));   // r3.54.0：固定地圖／條件
    if (!ks.length) { w = s.wev = { k: null, map: null, until: now + 2 * 60000, done: 1 }; return w; }   // 還沒到過任何可用地圖：2 分鐘後再試
    const k = rnd(ks), map = WEV[k].map || (WEV[k].town ? rnd(towns) : rnd(maps));
    w = s.wev = { k, map, until: now + 20 * 60000, done: 0 }; G.SAVE.markDirty();
    if (G.mode === 'play') G.UI.banner('世界事件：' + WEV[k].n, WEV[k].d(map));
    return w; };
  EV.worldText = () => { const w = EV.world(), m = Math.max(0, Math.ceil((w.until - Date.now()) / 60000)); let t = !w.k ? '暫無' : (w.done ? '（已完成）' : '') + WEV[w.k].n + '・' + nm(w.map) + '　剩 ' + m + ' 分'; const b = EV.wbNow();
    if (b) t += '　｜　世界頭目：' + b.n + '・' + nm(b.map) + '　剩 ' + Math.max(0, Math.ceil((b.until - Date.now()) / 60000)) + ' 分'; return t; };
  /* 世界頭目宣告：flags.wbOpen（後段劇情開啟）→ 每 60 分鐘宣告一次，30 分鐘內有效 */
  const WB_GAP = 60 * 60000, WB_LIFE = 30 * 60000;
  EV.wbNow = () => { const b = S().wbe; return b && !b.done && b.until > Date.now() ? b : null; };
  EV.wbWorld = function (force) { if (!F().wbOpen) return null; const s = S(), now = Date.now(); let b = s.wbe;
    if (b && now < b.next && !force) return EV.wbNow();
    const P = AM.P(), seen = s.seen || {}, L = WBOSS.filter(q => P > q[0] && seen[q[1]] && has(q[2]) && G.D.scenes[q[1]]);   // 該章已通關＋到訪過
    if (!L.length) { s.wbe = { next: now + 5 * 60000, done: 1, until: 0 }; return null; }
    const q = rnd(L); b = s.wbe = { i: WBOSS.indexOf(q), map: q[1], n: q[3], until: now + WB_LIFE, next: now + WB_GAP, done: 0 }; G.SAVE.markDirty();
    if (G.mode === 'play') G.UI.banner('世界頭目現身：' + q[3], '出現在「' + nm(q[1]) + '」・30 分鐘內有效');
    if (SC.id === q[1]) wbSpawn(q[1]); return b; };
  function wbSpawn(id) { const b = EV.wbNow(); if (!b || b.map !== id || G.E.some(e => e.wb && e.st !== 'dead')) return; const wb = WBOSS[b.i], d = G.D.scenes[id], lv = Math.max(d.lv || 1, heroLv()) + 3;
    const go = () => { if (G.SC.id !== id || !EV.wbNow()) return; if (G.BOSS && G.BOSS.enc) { setTimeout(go, 2000); return; }   // 章節頭目戰進行中：打完再出現
      const p = spot(260, 380), e = G.spawnOni(p[0], p[1], 30, lv, wb[2]);
      e.wb = wb[3]; e.boss = true; e.ratio *= 1.5; e.hp = e.hpMax = Math.round(e.hpMax * 25); e.atk = Math.round(e.atk * 1.8); G.UI.banner('世界頭目　' + wb[3], '強大的氣息……'); };
    load([wb[2]]).then(() => setTimeout(go, 2400)); }
  /* 頭目戰中禁止換圖：章節頭目進行中，或頭目已交戰（受過傷） */
  EV.bossLock = () => (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.E.some(e => e.boss && e.st !== 'dead' && e.hp > 0 && e.hp < e.hpMax) ? '頭目戰中，無法離開' : null;
  /* ---------- 進場 ---------- */
  function begin(def, extra) { const d = SC.def; const c = Object.assign({ n: def.n, k: def.k, lv: extra && extra.lv || d.lv || 1, t: 0 }, extra || {}); EV.cur = c; def.start(c); if (c.skip) { EV.cur = null; return null; } return c; }
  EV.enter = function (id) {
    EV.cur = null; EV.fog = 0; EV.props = []; EV.mul = null;
    const d = G.D.scenes[id]; if (d) { const s = S(); (s.seen = s.seen || {})[id] = 1; }   // 進場即記錄到訪
    if (!d || !F().prologue) return; const P = AM.P(), H = heroLv();   // 序幕（神社開場劇情）結束前不觸發任何事件
    /* 護送中的小孩：跟過來；到城鎮完成 */
    if (EV.escort) { const e = EV.escort;
      if (d.safe || /^T_|hub_city|W_R01_01/.test(id)) { AM.add(e.u, G.H.x - 40, G.H.y + 6, { hold: 1 }).then(n => { if (n) AM.bubble(n, '是村子！謝謝你，大哥哥！', 180); });
        const c = { lv: Math.max(e.lv, d.lv || 1) }; setTimeout(() => { reward(c, 2.2, 1); G.UI.banner('護送完成', e.name + '的家人送上謝禮'); }, 600); EV.escort = null; }
      else AM.add(e.u, G.H.x - 40, G.H.y + 6, { follow: true, onTalk: n => AM.bubble(n, '要到村子了嗎？', 90) }); }
    /* 難度（23_warp 設定）：副本／合戰才有效 */
    const df = S().diff; if (df && !(d.dungeon || (S().war && S().war.map === id))) delete S().diff;
    if (d.dungeon) { d._lv0 = d._lv0 || d.lv; const D = S().diff; d.lv = D ? H + D.off : d._lv0; EV.mul = D ? D : null; }
    if (S().war && S().war.map !== id) delete S().war;
    if (S().war && S().war.map === id && G.WARP) { const w = S().war; EV.mul = w.diff; EV.cur = G.WARP.battle(w, { reward, finish, fail, waves, wave, alive, spot, elite, load, foesOf, has, rnd }); return; }
    /* 世界事件 */
    const w = EV.world();
    if (w.map === id && !w.done && (P >= 2 || F().nest) && (d.safe || G.STORY.autoSpawnOk(id))) { const def = WEV[w.k]; const c = begin(def, { n: def.n, lv: Math.max(d.lv || 1, H), world: 1 }); if (c) { G.UI.banner('世界事件：' + def.n, def.d(id)); return; } }
    /* 世界頭目 */
    EV.wbWorld(); wbSpawn(id);   // 只在宣告的地圖、有效時間內出現
    if (EV.force) { const def = RAND.find(e => e.k === EV.force); EV.force = null; if (def) { begin(def); return; } }   // 測試用
    /* 隨機事件（野外） */
    if (d.safe || d.boss || d.dungeon || !d.spawn) return; if (!G.STORY.autoSpawnOk(id)) return;
    if (EV.cool > 0) { EV.cool--; return; } if (Math.random() >= 0.25) return;
    const ch = d.ch || 1, L = RAND.filter(e => (!e.ch || (ch >= e.ch[0] && ch <= e.ch[1])) && (!e.p || P >= e.p)); let tot = 0; L.forEach(e => tot += e.w); let r = Math.random() * tot;
    const def = L.find(e => (r -= e.w) < 0) || L[0]; if (begin(def)) EV.cool = 1;
  };
  /* r3.54.0：世界事件補發——人已在該圖、任務波次／劇情結束後、被任務打斷 → 條件成立時開始（原本只在進圖瞬間判斷） */
  EV.tryWorld = function () { const id = SC.id, d = G.D.scenes[id], w = EV.world(); if (!d || !w.k || w.done || w.map !== id || !F().prologue) return;
    const c0 = EV.cur; if (c0 && !c0.done) { if (c0.world && G.QWAVE && G.QWAVE.on) EV.cur = null; return; }   // 任務波次把事件打斷：放掉，之後重來
    if ((G.QWAVE && G.QWAVE.on) || (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.DLG.active() || SC.trans || (G.MENU && G.MENU.open)) return;
    if (!(AM.P() >= 2 || F().nest) || !(d.safe || G.STORY.autoSpawnOk(id))) return;
    const def = WEV[w.k]; for (const e of G.E) if (!e.qid && !e.bb && !e.boss && !e.ev) { e.hp = 0; e.st = 'dead'; }
    const c = begin(def, { n: def.n, lv: Math.max(d.lv || 1, heroLv()), world: 1 }); if (c) G.UI.banner('世界事件：' + def.n, def.d(id)); };
  /* autoSpawn：事件期間暫停（keepSpawn 例外） */
  const as0 = SC.autoSpawn.bind(SC);
  SC.autoSpawn = function () { const c = EV.cur; if (c && !c.done && !c.keepSpawn && !c.quiet) { this.auto = false; return; } return as0(); };
  for (const r of RAND) if (r.quiet) r.start = (f => function (c) { c.quiet = 1; c.keepSpawn = 1; return f(c); })(r.start);
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { en0(id); EV.enter(id); };
  /* 每格 */
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); const c = EV.cur; if (G.MENU.open) return;
    if (c && !c.done) { c.t++; c.wstep && c.wstep(); c.step && c.step(); }
    if (G.t % 600 === 0) { EV.world(); EV.wbWorld(); }
    if (G.t % 90 === 45) EV.tryWorld();
    if (G.t % 60 === 0) { const b = S().wbe; if (b && !b.done && Date.now() >= b.until) {   // 逾時：未交戰就消失
      const i = G.E.findIndex(e => e.wb && e.st !== 'dead'), e = G.E[i];
      if (!e || e.hp >= e.hpMax) { if (e) G.E.splice(i, 1); b.done = 1; G.SAVE.markDirty(); if (e || SC.id === b.map) G.UI.banner('世界頭目　' + b.n, '氣息遠去了……'); } } }
    if (!G.NPC.includes(EV.props[0]) && EV.props.length) G.NPC.push(...EV.props.filter(n => !G.NPC.includes(n))); };
  /* 擊殺：事件計數、世界頭目、掉寶倍率、難度加掉 */
  const kill0 = G.RPG.onKill;
  G.RPG.onKill = function (e) { kill0(e); const c = EV.cur;
    if (c && !c.done && c.onKill) c.onKill(e);
    if (e.wb) { const b = S().wbe; if (b) b.done = 1; G.SAVE.markDirty(); const cc = { lv: e.lv }; reward(cc, 6, 3, 5); G.UI.banner('世界頭目　' + e.wb + '　討伐', '妖玉 +5・下次宣告請留意'); }
    const k = (c && c.drop ? c.drop - 1 : 0) + (EV.mul ? EV.mul.drop : 0); if (k > 0 && Math.random() < 0.06 * k * (1 + (G.RPG.S.mf || 0) / 100)) G.LOOT.push({ x: e.x, y: e.y, t: 0, kind: 'item', it: itemQ(e.lv, EV.mul ? EV.mul.q : 0) }); };
  /* 難度倍率：生成時套用 */
  const sp0 = G.spawnOni; G.spawnOni = function (x, y, delay, lv, type) { const e = sp0(x, y, delay, lv, type), m = EV.mul; if (m && m.off === undefined) {   // r3.107.0：副本、合戰難度只疊等級（m.off），不再乘血／攻
    e.hp = e.hpMax = Math.round(e.hpMax * m.hp); e.atk = Math.round(e.atk * m.atk); } return e; };
  /* 目標文字 */
  const ob0 = G.STORY.objective.bind(G.STORY);
  G.STORY.objective = function () { const c = EV.cur; if (c && !c.done && c.obj) { const t = c.obj(); if (t) return t; } return ob0(); };
  /* 道具點擊 */
  const st0 = G.STORY.step.bind(G.STORY);
  G.STORY.step = function () { st0(); if (G.UI.near && !G.UI.near.amb) return; let best = 60, pick = null;
    for (const n of EV.props) { if (!n.run || n.opened) continue; const d = Math.hypot(G.H.x - n.x, (G.H.y - n.y) * 1.6); if (d < best) { best = d; pick = n; } }
    if (pick) G.UI.near = { label: pick.label || '調查', kind: 'look', run: () => pick.run() }; };
  /* 地圖頁：最下方顯示目前的世界事件 */
  /* r3.19.2：世界事件提醒改畫在遊戲畫面右上（藥鍵下方），點一下開地圖頁 */
  const udW = G.UI.draw; G.UI.draw = function () { udW(); const w = EV.world(); const B = G.UI.B; B.wev = null; if (!w.k || w.done) return;
    const t = '世界事件：' + EV.worldText(); ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`; const tw = Math.min(G.LW * 0.42, ctx.measureText(t).width + 22), x = B.menu.x + B.menu.w - tw, y = (G.MMAP && G.MMAP.box ? G.MMAP.box.y + G.MMAP.box.h : B.menu.y + B.menu.h) + 8, h = 24;   // r3.19.3：藥鍵移走，提醒上移到選單下方
    ctx.fillStyle = 'rgba(120,70,20,.78)'; G.rr(x, y, tw, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(243,217,138,.7)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, tw - 1, h - 1, 12); ctx.stroke();
    G.txt(t, x + tw / 2, y + h / 2 + 1, 11, '#f3d98a', 'center', G.FONT, 700); B.wev = { x, y, w: tw, h }; };
  /* 迷霧＋頭目血條 */
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0(); if (EV.fog) { const g = ctx.createRadialGradient(G.LW / 2, G.LH / 2, G.LH * 0.25, G.LW / 2, G.LH / 2, G.LW * 0.6); g.addColorStop(0, 'rgba(210,214,222,0.08)'); g.addColorStop(1, 'rgba(200,204,214,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, G.LW, G.LH); } };
  const onScr = e => { const p = SC.toScreen ? SC.toScreen(e.x, e.y) : null; return !p || (p.x > -20 && p.x < G.LW + 20 && p.y > -20 && p.y < G.LH + 20); };
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); const b = G.E.find(e => (e.boss || e.elite) && !e.bb && e.st !== 'dead' && e.delay <= 0 && (e.boss || onScr(e))); if (!b || (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done)) return;   // r3.146.0：菁英只在畫面內才顯示；頭目戰時讓頭目血條
    const w = Math.min(360, G.LW * 0.42), x = (G.LW - w) / 2, y = G.SAFE.t + 56, name = b.wb || (b.boss ? (SC.def.dungeon ? '副本頭目' : '章節頭目') : '菁英') + '　Lv ' + b.lv;
    ctx.fillStyle = 'rgba(12,8,10,.72)'; G.rr(x - 8, y - 18, w + 16, 30, 8); ctx.fill(); G.txt(name, x, y - 8, 11, b.wb ? '#9fe0ef' : b.boss ? '#f0ad52' : '#e3c27a', 'left', G.FONT_S, 900);
    ctx.fillStyle = 'rgba(60,20,20,.9)'; ctx.fillRect(x, y + 1, w, 6); ctx.fillStyle = b.wb ? '#5fb8d8' : '#d84a3a'; ctx.fillRect(x, y + 1, w * Math.max(0, b.hp) / b.hpMax, 6); };
})();
/* ---------- r3.54.0：事件陣地（合戰防禦物素材 x2_war）＋道摩大筒 ----------
 * EV.fort(p, kind, c)：camp＝拒馬×2、逆茂木×2、竹束、篝火×2、敵旗×2；invade＝村民的拒馬／竹束／篝火（擋在主角與敵人之間）；
 * doma＝敵旗×3、篝火、大筒（每 7 秒預告 1 秒後砲擊主角位置；走到大筒旁＝破壞）；ronin＝篝火×2、敵旗。換圖清掉。 */
(function init() {
  if (!G.VX || !G.EV) return setTimeout(init, 30);   // 76_vfx 在後面才載入
  const EV = G.EV, SC = G.SC, H = G.H, VX = G.VX, ctx = G.ctx;
  function wp(s, x, y, k, o) { let q = [x, y]; if (SC.snap) q = SC.snap(x, y, 'open', 140) || q; const n = Object.assign({ wp: 1, s, x: q[0], y: q[1], k: k || 1, face: 1, t0: G.t }, o || {}); G.NPC.push(n); EV.wprops.push(n); return n; }
  EV.wprops = [];
  EV.fort = function (p, kind, c) { const [x, y] = p, L = [];
    if (kind === 'camp') { L.push(wp('war_fence', x - 150, y + 40, 0.95), wp('war_fence', x + 150, y + 40, 0.95), wp('war_abatis', x - 90, y + 70), wp('war_abatis', x + 90, y + 70), wp('war_bamboo', x, y + 80),
        wp('war_brazier', x - 60, y - 40, 0.9), wp('war_brazier', x + 60, y - 40, 0.9), wp('war_banner_enemy', x - 120, y - 60, 0.7), wp('war_banner_enemy', x + 120, y - 60, 0.7)); }
    else if (kind === 'invade') { const sd = H.x < SC.def.w / 2 ? 1 : -1; L.push(wp('war_fence', x + sd * 150, y - 30, 0.95), wp('war_bamboo', x + sd * 150, y + 40), wp('war_brazier', x + sd * 80, y - 60, 0.9), wp('war_banner_ours', x - sd * 40, y - 70, 0.7)); }
    else if (kind === 'doma') { L.push(wp('war_banner_enemy', x - 140, y - 50, 0.75), wp('war_banner_enemy', x + 140, y - 50, 0.75), wp('war_banner_enemy', x, y - 90, 0.75), wp('war_brazier', x - 70, y + 30, 0.9));
      const cn = wp('war_cannon', x + 40, y + 10, 1, { face: H.x < x ? -1 : 1, cannon: 1, cd: 300 }); if (c) c.cannon = cn; }
    else if (kind === 'ronin') { L.push(wp('war_brazier', x - 50, y, 0.9), wp('war_brazier', x + 50, y, 0.9), wp('war_banner_enemy', x, y - 60, 0.7)); }
    return L; };
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n.wp) return dn0(n); const s = SC.depth(n.y);
    ctx.fillStyle = 'rgba(20,14,8,.28)'; ctx.beginPath(); ctx.ellipse(n.x, n.y, 30 * s * n.k, 8 * s * n.k, 0, 0, 6.283); ctx.fill();
    const fi = n.dead ? 2 : n.s === 'war_brazier' ? Math.floor(G.t / 6) % 4 : /banner/.test(n.s) ? Math.floor(G.t / 9 + n.x) % 4 : n.cannon ? (n.fire > 0 ? 1 : 0) : 0;
    VX.draw2(ctx, n.dead && n.s === 'war_brazier' ? 'war_brazier_out' : n.s, fi, n.x, n.y, n.k, { flip: n.face < 0, a: n.dead ? 0.55 : 1 }); };
  /* 大筒：預告圈 → 砲擊；靠近 60px 破壞 */
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); const c = EV.cur, n = c && c.cannon; if (!n || n.dead || c.done || G.DLG.active()) return;
    if (n.fire > 0) n.fire--;
    if (Math.hypot(H.x - n.x, (H.y - n.y) * 1.5) < 70) { n.dead = 1; n.warn = null; G.UI.toast('破壞了大筒！'); VX.spark && VX.spark({ x: n.x, y: n.y, z: 20, n: 10, ang: -1.57, spread: 2.5, spd: 6, g: 0.2, col: '255,190,90', life: 18 }); G.SC.shake = Math.max(G.SC.shake, 4); return; }
    if (n.warn) { if (--n.warn.t <= 0) { const w = n.warn; n.warn = null; n.fire = 14; G.SC.shake = Math.max(G.SC.shake, 5);
        if (VX.ring) VX.ring({ x: w.x, y: w.y, r1: 1.6, life: 16, col: '255,150,80' }); if (Math.hypot(H.x - w.x, (H.y - w.y) * 1.6) < w.r) G.hurtHero(Math.round((10 + 4 * ((c.lv || 1) - 1)) * 2.2), w.x); } return; }
    if (--n.cd <= 0) { n.cd = 420; n.face = H.x < n.x ? -1 : 1; n.warn = { x: H.x, y: H.y, r: 95, t: 60 }; } };
  const md0 = G.STORY.drawMarks.bind(G.STORY); G.STORY.drawMarks = function () { const c = EV.cur, n = c && c.cannon, w = n && n.warn;
    if (w) { const s = SC.depth(w.y), a = 0.35 + 0.3 * Math.sin(G.t * 0.5); ctx.strokeStyle = `rgba(255,90,60,${a + 0.2})`; ctx.fillStyle = `rgba(255,90,60,${a * 0.35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r * s, w.r * s * 0.32, 0, 0, 6.283); ctx.fill(); ctx.stroke(); }
    return md0.apply(this, arguments); };
  const en0 = EV.enter; EV.enter = function (id) { G.NPC = G.NPC.filter(n => !n.wp); EV.wprops = []; return en0.call(EV, id); };
})();
