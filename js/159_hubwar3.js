/* ==========================================================================
 * 神諭之地 重製版 — 159_hubwar3.js
 * Version : r3.161.0  (2026-11-27)
 * 變更    : r3.161.0 新增。兩岸城攻防篇 第三批（劇本 2026-11-27_1840_HUB_WAR_SCRIPT_v1 第十一、十二、十六、十七節）：
 *           ・W8 奪回兩岸城：出陣前（本陣，深夜）→ 城門前廣場被妖氣牆圍住（四個路口封住）→ 5 波強妖（每波有援軍喊話；
 *             第 2 波河童大將噴水讓火車熄火）→ 大禍津日神・幻影（半透明、血量為本體一半、只有面具形態、不轉真身、沒有常闇）
 *             → 50% 時屋頂站起黑影，文也念名字一個一個驅散 → 擊敗 → 天亮
 *           ・重建（hw9）：三天後的城（重建版），權六、鎌鼬、河童大將、梅乃婆婆、柚吉、時雨、文也、孫六；城恢復安全區
 *           ・重建後鎌鼬三兄弟、河童大將搬進兩岸城（東面街口、運河東岸），妖怪村不再有他們；
 *             妖怪村的「頭目失控」抽到他們時，會從兩岸城趕過來（142_yvent 呼叫 G.HWR.visitor）
 *           ・支線「河下游的孩子」（鬼女）：水車村山路口 → 共岸河灣 → 葦穗村 → 泊岸漁港 → 護送回水車村
 * 存檔    : flags.hw_reloc（妖怪頭目已搬進城）、kijo_guard（鬼女守山路）
 * 依賴    : 157_hubwar（G.HW：run／startFight2／phase）、158_hubwar2（HW.W7 援軍）、26_boss（BOSS.load／start）、52_hub（travel）、53_quest（Q.add）。
 * ========================================================================== */
'use strict';
(function () {
  const HW = G.HW, Q = G.QST, SC = G.SC, H = G.H, A = G.ANIM, ctx = G.ctx, HUB = G.HUB; if (!HW || !HW.W7 || !Q || !Q.add) return;
  const F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text }), nar = t => say('', t), act = fn => ({ do: fn });
  const DN = id => Q.isDone(id), AC = id => Q.active(id), HH = () => G.HERO_H, S = y => SC.depth(y), ID = 'hub_city';
  const inP = id => !!(G.PARTY && G.PARTY.list && G.PARTY.list.some(m => m.id === id)), P = (id, who, t) => inP(id) ? [say(who, t)] : [];
  const 雪 = t => say('小雪', t), 丸 = t => say('白丸', t), 蒼 = t => say('蒼真', t);
  const W7 = HW.W7, live = e => e && e.st !== 'dead' && e.hp > 0;

  /* ======================= 一、W8 狀態與場地 ======================= */
  const W8 = HW.w8 = { zone: false, fight: false, boss: null, read: 0, shadows: [], shout: null, dawn: 0, lastW: -2 };
  const ZR = [612, 238, 1000, 642];   /* 城門前廣場：四個路口被妖氣牆封住 */
  const wk0 = SC.walkable.bind(SC), rm0 = SC.room.bind(SC), inZ = (x, y) => x >= ZR[0] && x <= ZR[2] && y >= ZR[1] && y <= ZR[3];
  SC.walkable = function (x, y) { if (W8.zone && SC.id === ID && !inZ(x, y)) return false; return wk0(x, y); };
  SC.room = function (x, y) { if (W8.zone && SC.id === ID && !inZ(x, y)) return 0; return rm0(x, y); };
  function safeOff() { const d = SC.def; if (!d._hwS) d._hwS = { safe: d.safe, town: d.town }; d.safe = false; d.town = false; if (W8.lv0 === undefined) { W8.lv0 = d.lv; d.lv = Math.max(d.lv || 1, (G.RPG.d().lv || 1) - 1); } if (G.AMB) { G.AMB.bubs = []; G.AMB.chatT = 99999; } }
  function safeOn() { const d = SC.def; if (d && d._hwS) { d.safe = d._hwS.safe; d.town = d._hwS.town; delete d._hwS; } if (d && W8.lv0 !== undefined) { d.lv = W8.lv0; W8.lv0 = undefined; } if (G.AMB) G.AMB.chatT = 400; }
  function stopAll() { if (W8.shadows.length) G.CAMLOOK = null; W8.zone = false; W8.fight = false; W8.boss = null; W8.shadows = []; W8.shout = null; HW.fight = null; G.E = G.E.filter(e => !e.hwq && !e.hw8); safeOn(); }
  const shout = (who, text) => { W8.shout = { who, text, t: 200 }; };
  const loadAllies = () => Promise.all(['b_kama', 'b_kappa'].map(k => Promise.resolve(A.load && A.load(k)).catch(() => 0)));
  function allies(at) { const W = W7.W, [x, y] = at; if (W.allies.length) { W.allies.forEach((a, i) => { const o = a.amb || a; if (!o) return; o.x = x + (i % 2 ? 1 : -1) * (80 + i * 22); o.y = y + (i % 3 - 1) * 26; }); return; }
    W7.addAlly('kama1', x - 90, y - 30); W7.addAlly('kama2', x - 120, y + 10); W7.addAlly('kama3', x - 60, y + 30); W7.addAlly('kappa', x + 110, y + 10);
    W7.addAmbAlly('n_t_fox_elder', x + 150, y - 30, '狐族長者', 'fox'); W7.addAmbAlly('n_sagitsune', x + 180, y + 20, '砂狐', 'fox'); }

  /* ======================= 二、W8 劇情 ======================= */
  function w8a(q, done) { H.x = 260; H.y = 620; H.face = 1; loadAllies().then(() => { allies([460, 610]);
    G.DLG.start([nar('（深夜。本陣的篝火燒得很旺。孫六、冬馬、景綱、文也，還有東面來的妖怪們，全都圍在火堆旁。）'),
      say('孫六', '所有人聽好。城北的門，是最後一個。'), say('孫六', '……打完這一場，天就亮了。我保證。'), say('冬馬', '隊長，你從來不保證任何事。'), say('孫六', '所以這一次，算數。'),
      say('河童大將', '（把一桶水往火堆旁一放）火車那種東西，交給河童。牠們怕水怕得要命。'), say('鎌鼬', '風會把妖氣吹開一條路。……我們走在最前面。'),
      say('文也', '（把《神諭之地記》放進懷裡）……我也要去。'), 蒼('文也，你不會打——'), say('文也', '我不打。我要看。……三百年後有人問「兩岸城是怎麼回來的」，總要有人寫得出來。'),
      say('景綱', '（拍了拍文也的肩膀）讓他去。這座城的事，該有人記著。'), 雪('（走到蒼真身邊，小聲）……蒼真。門的後面，有一個很大的東西在看著我們。'), 雪('它在等我。'),
      Q.xue && Q.xue() >= 6 ? 雪('可是我不怕。你在旁邊。') : 雪('……我會站在你後面。這一次，我不躲。'), ...P('ibaraki', '茨木', '（把拳頭握得喀喀響）大禍津日神是吧。……三百年前欠的帳，今天先討一點利息。'),
      丸('走吧。天亮之前。')], done); }); }
  const WAVES = [{ t: ['ushioni', 'ushioni', 'shikome', 'shikome', 'shikome'], n: 5 }, { t: ['nue', 'nue', 'kasha', 'kasha', 'kasha'], n: 5 },
    { t: ['hannya', 'hannya', 'hannya', 'yomigun', 'yomigun', 'yomigun'], n: 6 }, { t: ['ushioni', 'ushioni', 'nue', 'nue', 'kasha', 'kasha'], n: 6 },
    { t: ['yomigun'], n: 4, elite: '赤般若', eliteT: 'akahannya', eliteSub: '門前的守衛', lv: 2 }];
  const CRY = [['鎌鼬', '左邊！'], ['河童大將', '火車怕水！讓開——'], ['孫六', '弓組，射般若的面！'], ['景綱', '城門右邊的巷子！它們從井裡出來了！'], ['小雪', '門……在發抖。它怕了！']];
  function w8b(q, done) { const go = () => { stopAll(); H.x = 800; H.y = 560; H.face = -1; W8.zone = true; W8.fight = true; W8.done = done; W8.lastW = -2; safeOff();
      Q.load(['ushioni', 'shikome', 'nue', 'kasha', 'hannya', 'yomigun', 'akahannya']); loadAllies().then(() => allies([800, 600]));
      HW.startFight2({ map: ID, title: '奪回兩岸城', sub: '城門前的五道浪', label: '第', from: [[800, 300], [700, 330], [900, 330]], waves: WAVES.map(w => Object.assign({}, w)),
        onWin: () => G.DLG.start(faceLines(), startBoss) }); };
    G.DLG.start([nar('（城門前的廣場。四個路口同時升起紫黑色的牆，把你們關在裡面。）'), nar('（城門下，北方的妖穴張開了口——裡面爬出來的，不是一隻、兩隻。）'), say('孫六', '退路沒了。……正好。'), 雪('來了！')], go); }
  /* 每波：援軍喊話；第 2 波河童大將噴水；第 5 波多一隻赤般若 */
  function waveTick() { const f = HW.fight; if (!f || !W8.fight || SC.id !== ID) return; if (f.w === W8.lastW || f.w < 0) return; W8.lastW = f.w; const c = CRY[f.w]; if (c) G.STORY.later(100, () => shout(c[0], c[1]));
    if (f.w === 1) G.STORY.later(300, () => { const L = G.E.filter(e => e.hwq && e.type === 'kasha' && live(e)); for (const e of L) { e.stun = Math.max(e.stun || 0, 180); W7.aFx('b_kappa', 'kappataisho_water_jet', e.x, e.y, 1, 40); } if (L.length) G.NUMS.push({ x: H.x, y: H.y - 90, v: '火車熄火', t: 0 }); });
    if (f.w === 4) G.STORY.later(60, () => { const e = G.spawnOni(880, 320, 30, Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 1) + 2, 'akahannya'); if (e) { e.hwq = 1; e.hp = e.hpMax = Math.round(e.hpMax * 4); e.atk = Math.round(e.atk * 1.35); e.ratio *= 1.12; e.elite = '赤般若'; } }); }
  const faceLines = () => [nar('（最後一隻赤般若倒下。廣場安靜了一瞬。）'), nar('（妖穴的裂口張開。從裡面升起來的，不是妖怪，是一張臉。一張比城門還大的、沒有表情的臉。）'),
    say('大禍津日神・幻影', '……器。'), say('大禍津日神・幻影', '三百年。你們人類，換了十一個器。每一個都說「這次不一樣」。'),
    丸('（擋在小雪前面，全身的毛炸開）……我記得你。三百年前，你也是這樣說話的。'), say('大禍津日神・幻影', '狛犬。你又活下來了。……真可憐。'), 蒼('這座城不是你的。'), say('大禍津日神・幻影', '這座城的死人，是我的。')];
  function startBoss() { const B = G.BOSS; if (!B || !B.load) return winBoss(); Promise.resolve(B.load('omagatsuhi')).then(() => { if (SC.id !== ID || !W8.fight) return;
      const enc = B.start('omagatsuhi', { x: 800, y: 380, lv: Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1)) + 2, sub: '三百年前的影子', onWin: winBoss }); if (!enc) return winBoss();
      enc.name = '大禍津日神・幻影'; const e = enc.units[0]; e.hpMax = e.hp = Math.round(e.hpMax * 0.5); e.alpha = 0.72; e.hwPh = 1; e.hwq = 1; enc.v.H2 = -1e12; W8.boss = e; W8.enc = enc;   /* 不轉真身（第二段門檻設到碰不到） */
      G.UI.banner('大禍津日神・幻影', '血量只有本體的一半——但它不會累'); }, () => winBoss()); }
  /* 50%：屋頂上的黑影＝沒救到的人；文也念名字驅散 */
  const SHD = [[652, 372], [688, 430], [650, 492], [948, 372], [912, 430], [950, 492], [748, 318], [872, 318]];   /* 廣場兩側的屋簷下、城門階前 */
  const NAMES = ['茂作', '阿春', '清吉', '小六', '阿鶴', '源三', '彌助', '阿文'];
  function readNames() { W8.shadows = SHD.map(([x, y]) => ({ x, y, a: 0, go: 0 })); G.CAMLOOK = { x: 800, y: 430 };   /* 鏡頭拉遠：看得到兩側的黑影 */ const pop = () => { const s = W8.shadows.find(o => !o.go); if (s) s.go = 1; };
    G.DLG.start([say('大禍津日神・幻影', '（城裡所有的屋頂上，站起一排黑色的人影）……看看。這些都是你沒救到的人。'), 雪('……那件衣服，是城東染坊的……'),
      say('孫六', '（大喊）不要看！那不是他們！他們的名字，文也記著！記著的人，就沒有被奪走！'), say('文也', '（翻開帳冊，手在抖，聲音卻越來越大）……'),
      ...NAMES.flatMap(n => [say('文也', n + '——'), act(pop)]), nar('（每念一個名字，一個黑影就散掉。最後一個黑影散掉時，幻影的臉裂開了一道縫。）'), say('文也', '……一個都沒漏。')], () => { W8.shadows = []; G.CAMLOOK = null; }); }
  function winBoss() { const done = W8.done; W8.done = null; W8.fight = false; W8.boss = null; HW.fight = null;
    G.DLG.start([say('大禍津日神・幻影', '……有趣。人類，用「名字」來對付我。'), say('大禍津日神・幻影', '我在終焉高台等你們。到那時……你們還記得多少名字？'),
      nar('（臉碎裂了。北方的妖穴被白光吞沒。）'), act(() => { W8.zone = false; W8.dawn = 1; for (const n of HW.props) if (n.hwF === 'n' && n.hwimg) n.hwimg = n.hwimg.replace('_on', '_off'); }),
      nar('（紫黑色的碗，從城的上空裂開。第一道陽光照在城門前的石階上。）'), say('冬馬', '……天亮了。隊長，天亮了！'), say('孫六', '（坐倒在石階上，看著天）……哼。我說了，算數。'),
      say('景綱', '（走到城門前，把城代的印舉起來）……兩岸城的各位。'), say('景綱', '城，回來了。'), nar('（西口傳來歡呼。神社和水車村的人，正排著隊走進城。）')],
      () => { stopAll(); W7.reset(); done && done(); G.STORY.later(20, () => HUB.travel(0, '三天後。', [], ID)); }); }
  function w8step() { if (SC.id !== ID) { if (W8.fight || W8.zone) stopAll(); return; } if (!W8.fight) return; waveTick(); if (!HW.sc && !G.DLG.active()) W7.stepAllies();
    if (W8.shout && --W8.shout.t <= 0) W8.shout = null;
    const e = W8.boss; if (e) { if (e.st !== 'dead' && e.hp <= e.hpMax * 0.04 && !G.DLG.active()) { e.hp = 0; e.st = 'dead'; e.t = 0; e.mv = null; }   /* 第一段原本打不死（墊血）：見底就倒下 */
      if (!W8.read && live(e) && e.hp <= e.hpMax * 0.5 && !G.DLG.active()) { W8.read = 1; readNames(); } } }

  /* ======================= 三、重建（hw9）與妖怪頭目搬家 ======================= */
  function w9(q, done) { F().hw_reloc = 1; G.SAVE.markDirty(); spawnRes(); H.x = 812; H.y = 560;
    G.DLG.start([nar('（三天後。鷹架搭在燒掉的屋子上，木材堆在街口。）'),
      say('鬼鍛冶權六', '（扛著木頭）鬼族的力氣，蓋房子正好。'), say('鎌鼬', '（三兄弟在屋頂上綁繩子）風會幫你們把屋頂吹乾。'), say('河童大將', '（在運河裡清淤泥）河乾淨了！……乾淨了一半。剩下一半明天再說。'),
      say('梅乃婆婆', '（牽著柚吉回到家門口）……家還在。門燒了，牆還在。'), say('柚吉', '小黑！'), nar('（一隻黑貓從屋簷上跳下來，蹭了蹭柚吉的腳。）'),
      ...(DN('c9_s_cat') ? [say('貓又', '……喵。我說過，牠會等你。')] : []), say('時雨', '（重新畫傳送陣）傳送陣修好了。行旅繪圖也重畫了——這次，把東面的妖怪町也畫進去。'),
      say('文也', '（坐在私塾的廢墟上寫字）《神諭之地記》第十一章，我想好名字了。'), say('文也', '「名字」。'), say('孫六', '（手臂還吊著，站在城門口）神社的劍士。'),
      say('孫六', '……你下一次要去的地方，叫什麼？'), 蒼('立約殿。'), say('孫六', '……那就去吧。城，我們守。這一次，換你回來的時候，城會比你走的時候更好。'),
      act(() => G.UI.banner('兩岸城　重建', '店家都回來了。鎌鼬三兄弟、河童大將搬進了城裡'))], done); }
  /* 搬進城的妖怪頭目（與 58_forge 妖怪村住民同格式：n.anim／hx） */
  const RES = [['鎌鼬長兄', 'b_kama', 'kama1_idle_left3q', -1, 1.1, [1500, 560], ['屋頂綁好了。風一吹，瓦片就不會掉。', '這座城的風，比山裡亂。……可是不討厭。', '弟弟們又去偷晒的柿子了。']],
    ['鎌鼬次兄', 'b_kama', 'kama2_idle_left3q', -1, 1.0, [1560, 600], ['巡城的路線，我記好了。', '……風玉帶在身上，比較安心。']],
    ['鎌鼬三弟', 'b_kama', 'kama3_idle_left3q', -1, 0.95, [1470, 620], ['受傷的人，來找我塗藥。', '城裡的飯糰，也很好吃。']],
    ['河童大將', 'b_kappa', 'kappataisho_idle_right3q', 1, 1.1, [1395, 760], ['運河的淤泥，今天清到這裡。', '要不要來比一場相撲？碼頭這裡夠寬。', '黃瓜……城裡的黃瓜比較貴。']]];
  const RESN = RES.map(r => r[0]), LIVE = [];
  function spawnRes() { if (SC.id !== ID || LIVE.length) return; for (const [n, key, ci, nat, hk, p, lines] of RES) { let [x, y] = p; const q = SC.snap && SC.snap(x, y, 'open', 160); if (q) [x, y] = q;
      const o = { anim: key, hk, nat, name: n, x, y, hx: x, hy: y, face: nat, t: 0, lines, hwRes: 1 }; G.NPC.push(o); LIVE.push(o);
      Promise.resolve(A.load(key)).then(u => { u = u || A.get(key); if (!u || SC.id !== ID) return; o.u = u; o.clip = u.act[ci]; }, () => 0); } }
  function resStep() { if (SC.id !== ID) return; for (const o of LIVE) { if (!o.u) continue; o.t++; if (o.say && --o.sayT <= 0) o.say = null; if (!o.say && Math.random() < 0.0015) { o.say = o.lines[Math.floor(Math.random() * o.lines.length)]; o.sayT = 220; } } }
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); try { hud(); } catch (x) { console.warn('hw8hud', x); } };
  function hud() { if (SC.id !== ID) return;
    for (const o of LIVE) { if (!o.say || !o.u || G.DLG.active()) continue; const s = S(o.y), p = SC.toScreen(o.x, o.y - HH() * s * o.hk * 1.35); if (p.x < 0 || p.x > G.LW || p.y < 0) continue;
      ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`; const w = Math.min(G.LW * 0.4, ctx.measureText(o.say).width + 18), h = 22 * G.FS(), x = Math.max(6, Math.min(G.LW - w - 6, p.x - w / 2)), y = p.y - h - 6;
      ctx.globalAlpha = Math.min(1, o.sayT / 20); ctx.fillStyle = 'rgba(250,244,230,.94)'; G.rr(x, y, w, h, 9); ctx.fill(); G.txt(o.say, x + w / 2, y + h / 2 + 1, 11, '#3a2a1c', 'center', G.FONT, 700); ctx.globalAlpha = 1; }
    const sh = W8.shout; if (sh && !G.DLG.active()) { const t = sh.who + '：' + sh.text; ctx.font = `800 ${12 * G.FS()}px ${G.FONT}`; const w = ctx.measureText(t).width + 28, x = (G.LW - w) / 2, y = Math.round(G.LH * 0.2);
      ctx.globalAlpha = Math.min(1, sh.t / 20); ctx.fillStyle = 'rgba(16,10,12,.78)'; G.rr(x, y, w, 26, 13); ctx.fill(); G.txt(sh.who + '：', x + 14, y + 13, 12, G.C.gold, 'left', G.FONT, 800);
      ctx.font = `800 ${12 * G.FS()}px ${G.FONT}`; G.txt(sh.text, x + 14 + ctx.measureText(sh.who + '：').width, y + 13, 12, '#f3ead8', 'left', G.FONT, 800); ctx.globalAlpha = 1; } }
  /* 妖怪村：搬走的頭目不在村裡；「頭目失控」抽到他們 → 從兩岸城趕過來 */
  G.HWR = { moved: n => !!F().hw_reloc && RESN.includes(n),
    visitor(r) { if (!this.moved(r[0])) return null; const R = RES.find(x => x[0] === r[0]); if (!R) return null; const [n, key, ci, nat, hk] = R, x = H.x + 140, y = H.y;
      const o = { anim: key, hk, nat, name: n, x, y, hx: x, hy: y, face: -1, t: 0, lines: [], hwVis: 1 }; G.NPC.push(o); Promise.resolve(A.load(key)).then(u => { u = u || A.get(key); if (u) { o.u = u; o.clip = u.act[ci]; } }, () => 0);
      G.NUMS.push({ x, y: y - 90, v: n + '從兩岸城趕來了', t: 0 }); return o; } };

  /* ======================= 四、支線：河下游的孩子（鬼女） ======================= */
  Q.add({ id: 'hw_kijo', ch: 12, title: '河下游的孩子', desc: '鬼女的孩子被黑水捲走了。天亮了，該去找了。', reward: { exp: 900, gold: 800 },
    giver: { map: 'W_R01_01', at: 'east_arrival', dx: -120, u: null, name: '鬼女', need: () => DN('hw9') && !!F().kijo_met, lines: () => [say('鬼女', '（坐在山路口的石頭上，手裡還抓著那件小衣服）……你們說過，等天亮幫我找。'), say('鬼女', '……天亮很久了。'),
      ...P('ibaraki', '茨木', '我說過的話，我會做到。'), 雪('河往下流……我們順著河找。'), 蒼('從共岸的河灣開始。')] },
    steps: [{ t: 'talk', map: 'W_R02_06', at: 'center', u: 'n_t_kappa_mentor', name: '河童長者', text: '在共岸河灣打聽', lines: [nar('（河灘上有一隻小小的木屐。鞋帶是鬼族的結法。）'),
        say('河童長者', '三天前，有個鬼族的小娃被沖到這裡。河童們把他撈起來了……'), say('河童長者', '可是他不肯說話，一直往下游跑。')] },
      { t: 'talk', map: 'T_ashihomura', at: 'center', u: 'n_p_gohei', name: '五平', text: '到葦穗村打聽', lines: [say('五平', '有個長角的小孩，在我家的牛棚裡睡了兩晚。我餵他吃飯糰，他吃完就走了。'),
        say('五平', '說要去「海那邊」找娘。……不對，他說娘在山上，可是山上很黑，他不敢回去。')] },
      { t: 'talk', map: 'W_R10_01', at: 'center', u: 'n_migiwae', name: '汀江', text: '到泊岸漁港找孩子', lines: [say('汀江', '那孩子坐在棧橋上看海，看了一整天。'), say('汀江', '我問他在等誰，他說：「等河把我送回家。」'),
        say('鬼族的孩子', '（抱著膝蓋）……娘說，迷路了就順著河走。可是河一直往下流，越流越遠……'), 雪('河往下流，可是人可以往上走。……我們帶你回去。')] },
      { t: 'kill', map: 'W_R01_01', at: 'east_arrival', n: 6, foes: ['yomigun', 'skel'], text: '護送孩子回水車村（黃泉殘黨）' },
      { t: 'talk', map: 'W_R01_01', at: 'east_arrival', dx: -120, u: null, name: '鬼女', text: '把孩子交還給鬼女', lines: () => [nar('（鬼女抱住孩子，很久沒有說話。）'),
        say('鬼女', '……人類。對不起。那一晚，我想殺你們的孩子。'), say('阿松', '……小太也是被你們救回來的。第一章的時候，鎌鼬把他藏起來，不讓赤鬼抓走。……扯平了。'),
        say('鬼女', '之後村子的山路，我們家來守。'), act(() => { F().kijo_guard = 1; G.SAVE.markDirty(); })] }],
    after2: { map: 'W_R01_01', at: 'east_arrival', dx: -150, u: null, name: '鬼女', lines: () => [say('鬼女', ['山路很安靜。今天沒有東西下來。', '孩子在學磨刀了。……跟你們人類的孩子一起。', '你又要出門了？路上小心。'][Math.floor(Math.random() * 3)])] } });

  /* ======================= 五、任務登錄與掛鉤 ======================= */
  const T = (map, text, run, o) => Object.assign({ t: 'fn', map, text, run }, o || {});
  Q.add({ id: 'hw8', ch: 11, main: true, postBoss: true, after: 'hw7', title: '奪回兩岸城', desc: '城北的門，是最後一個。', reward: { exp: 1200, gold: 900 },
    steps: [T(ID, '深夜，回本陣和大家會合', w8a), T(ID, '打開城門前的妖穴，奪回兩岸城', w8b)] });
  Q.add({ id: 'hw9', ch: 11, main: true, postBoss: true, silent: true, after: 'hw8', title: '重建', desc: '三天後的兩岸城。', reward: { exp: 400 }, steps: [T(ID, '看看重建中的兩岸城', w9)] });
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); try { w8step(); resStep(); } catch (e) { console.warn('hw8', e); } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { stopAll(); W8.read = 0; W8.dawn = 0; LIVE.length = 0; en0(id);
    if (id === ID && F().hw_reloc) spawnRes();
    if (id === 'T_yokai' && F().hw_reloc) G.STORY.later(5, () => { G.NPC = G.NPC.filter(n => !(n.anim && n.hx !== undefined && RESN.includes(n.name))); }); };   /* 妖怪村：搬走的頭目不在 */
  /* 黑影、天亮、妖氣牆（廣場四周） */
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); if (SC.id !== ID) return; try { over(); } catch (x) { console.warn('hw8d', x); } };
  function over() { const c = ctx, Z = SC.view().Z, wm = G.IMG.hw_wall_miasma;
    if (W8.zone && wm) { c.save(); c.globalAlpha = 0.55 + 0.1 * Math.sin(G.t * 0.05);
      const h = (x0, x1, y) => { const p = SC.toScreen(x0, y), q = SC.toScreen(x1, y), hh = 80 * Z; c.drawImage(wm, p.x, p.y - hh, q.x - p.x, hh); };
      const v = (x, y0, y1) => { const p = SC.toScreen(x, y0), q = SC.toScreen(x, y1), w = 46 * Z; c.drawImage(wm, p.x - w / 2, p.y - 70 * Z, w, q.y - p.y + 70 * Z); };
      v(ZR[0] - 10, 520, 660); v(ZR[2] + 10, 300, 660); h(ZR[0] - 10, ZR[2] + 10, ZR[3] + 22); c.restore(); }
    for (const s of W8.shadows) { if (s.go) s.a = Math.max(0, s.a - 0.04); else s.a = Math.min(1, s.a + 0.03); if (s.a <= 0) continue; const p = SC.toScreen(s.x, s.y), k = 52 * Z;
      c.save(); c.globalAlpha = 0.8 * s.a; c.fillStyle = '#0b0610'; c.beginPath(); c.ellipse(p.x, p.y - k * 1.55, k * 0.2, k * 0.24, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(p.x - k * 0.34, p.y); c.quadraticCurveTo(p.x - k * 0.3, p.y - k * 1.3, p.x, p.y - k * 1.35); c.quadraticCurveTo(p.x + k * 0.3, p.y - k * 1.3, p.x + k * 0.34, p.y); c.closePath(); c.fill();
      if (s.go) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,240,200,${0.5 * s.a})`; c.beginPath(); c.arc(p.x, p.y - k * 0.8, k * (1.4 - s.a), 0, 6.283); c.fill(); } c.restore(); }
    if (W8.dawn > 0) { W8.dawn = Math.min(1.6, W8.dawn + 0.004); const a = Math.max(0, Math.min(1, W8.dawn) * (W8.dawn > 1.2 ? (1.6 - W8.dawn) / 0.4 : 1)), g = c.createLinearGradient(0, 0, 0, G.LH);
      g.addColorStop(0, `rgba(255,190,120,${0.35 * a})`); g.addColorStop(1, 'rgba(255,220,170,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, G.LW, G.LH); c.restore(); } }
  /* 幻影：紫色殘影 */
  (function hkD() { if (!G.drawOni) return setTimeout(hkD, 50); const d0 = G.drawOni; G.drawOni = function (e) { if (e && e.hwPh && e.st !== 'dead') { const s = S(e.y), r = HH() * s * 1.3, pu = 0.5 + 0.3 * Math.sin(G.t * 0.06);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(e.x, e.y, r * 0.1, e.x, e.y, r * 1.3); g.addColorStop(0, `rgba(130,40,190,${0.45 * pu})`); g.addColorStop(1, 'rgba(50,10,80,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 1.3, r * 0.45, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
      return d0.apply(this, arguments); }; })();
  setTimeout(() => G.ASSET && G.ASSET.img && G.ASSET.img('hw_wall_miasma', 'a/war/wall_miasma.webp').catch(() => 0), 4500);
  HW.W8 = { w8a, w8b, w9, startBoss, readNames, winBoss, stopAll, spawnRes };
})();
