/* =====================================================================
 * 150_main2.js
 * 版本    : r3.143.0  (2026-11-27)　r3.143.0：水軍砲擊看得到砲彈從海上飛來（落地才扣血）
 * 舊版    : r3.132.0  (2026-11-27)
 * 說明    : 劇情補完・主線第 2 批（第 5、9、10、11 章）。
 *           ‧ 第 5 章「誰在說謊」：長屋多問一戶（收炭灰的行商），問完後從 5 句證詞挑矛盾；挑錯小雪好感 −1、再挑一次。
 *           ‧ 第 9 章「道摩本尊」：打倒分身後本尊現身（50% 血），打掉一半就收手撤退，接原本的對話。
 *           ‧ 第 7 章支線「水軍的密使」（新增）→ 第 10 章礁島水軍可和談：說服頭領（2 題都答對）就不用打，終章水軍船砲支援。
 *           ‧ 第 11 章「不能回頭」：返程崖徑左側黃泉黑霧逼近，被追上每秒扣 5%，只能往右，路上 3 波亡者。
 *           ‧ 只在對應地圖、對應步驟運作（53_quest 的 fn 步驟）。
 * 依賴    : 53_quest、54_story_b/c、26_boss、149_main1（同一套寫法）
 * ===================================================================== */
(function () {
  const Q = G.QST, B = G.BOSS, SC = G.SC, H = G.H, ctx = G.ctx; if (!Q || !Q.by.c5_m1 || !Q.by.c9_m3) return;
  const F = () => G.SAVE.data.flags, C = k => Q.choice(k), qc = () => (G.SAVE.data.qc = G.SAVE.data.qc || {});
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn }), nar = t => say('', t), later = (n, f) => G.STORY.later(n, f);
  const set = (k, v) => { qc()[k] = v; G.SAVE.markDirty(); };

  /* ================= 第 5 章：誰在說謊 ================= */
  { const q = Q.by.c5_m1, g = q.steps.find(s => s.t === 'gather');   // 地圖會被 65_maps 改名（T_kayamori → W_R05_05），只認步驟類型
    g.spots.push({ at: 'east_arrival', dx: -150, dy: 70, label: '行商・半兵衛', lines: [say('半兵衛', '我？我是做墨的，來收炭灰。這村子的灰細，磨出來的墨特別黑。'),
      say('半兵衛', '那天晚上？我天還沒黑就出村了，什麼都沒看到。真是倒楣，一回來就聽說出了這種事。'),
      nar('（他說話的時候一直搓著手。你注意到他的草鞋邊上，沾著一層新鮮的、還帶點溫度的炭灰。）')] });
    g.text = '向長屋的居民問話（5 戶）';
    const T = [['甚藏', '「我看到黑衣人從灶房出來，子時……不對，是丑時。」', 'drunk'], ['千景', '「子時有人敲我家的門，說要借火。」', 'ok'],
      ['蓮太', '「黑衣人手上的燈，是黑色的火。」', 'ok'], ['鈴緒', '「這幾天有人在村外收購炭灰，說是要做墨。」', 'ok'], ['半兵衛', '「我天還沒黑就出村了，什麼都沒看到。」', 'liar']];
    const WR = { drunk: [say('小雪', '甚藏爺爺那晚喝醉了，時間記錯……我覺得那不算說謊。'), say('小雪', '他是真的看到了，只是記不清楚。')],
      ok: [say('小雪', '嗯……這句話，跟其他人說的都對得上耶。'), say('小雪', '我們再想想看？')] };
    const ask = () => [say('小雪', '五個人的話都問完了。蒼真，你覺得……誰的話對不上？'),
      { choice: T.map(([who, line, k]) => ({ label: who + '：' + line, then: k === 'liar' ? [act(() => set('c5_deduce', 'ok'))] : [...WR[k], act(() => { const g2 = G.SAVE.data; g2.xueLove = Math.max(0, (g2.xueLove || 0) - 1); set('c5_deduce', 'miss'); }), nar('（小雪偷偷看了你一眼，有點失望，又很快打起精神。）')] })) }];
    function deduce(q2, done) { set('c5_deduce', ''); G.DLG.start(ask(), () => C('c5_deduce') !== 'ok' ? later(20, () => deduce(q2, done)) : G.DLG.start([say('蒼真', '半兵衛。你說天沒黑就出村了，那你草鞋上的灰是哪來的？'),
      say('蒼真', '共灶是昨晚子時才熄的。剛熄的灰，還帶著溫度。'), say('半兵衛', '……這、這是……'), say('千景', '……是他！敲我家門借火的，就是這個聲音！'),
      say('半兵衛', '（半兵衛腿一軟，跪了下來。）我、我只是收錢辦事！有個穿黑衣的人，給了我一袋銀子……叫我把共灶的灰收乾淨，一點都不能留。'),
      say('半兵衛', '他說，灰裡有火的記憶，留著，就有人能追到火種去了哪裡。'), say('鈴緒', '……所以那些灰，是被拿去「做墨」了。冥火的墨。'),
      say('小雪', '蒼真好厲害！……權太先生，真的是被冤枉的。'), say('巡檢孫六', '……哼。被這種小角色耍了，傳出去還得了。')], done)); }
    const ci = q.steps.findIndex(s => s.t === 'choice' && s.key === 'c5_truth');
    q.steps.splice(ci, 0, { t: 'fn', map: g.map, text: '對照證詞，找出說謊的人', run: deduce }); }

  /* ================= 共用：切磋到一半收手 ================= */
  let DU = null;
  function duel(id, map, o) { const D = B.DEF[id]; return Promise.all([B.load(id), G.ASSET.enemies((D && D.foes) || [])]).then(() => { if (SC.id !== map) return;
    const p = SC.snap(H.x + 240, H.y, 'open', 300) || [H.x + 200, H.y];
    const enc = B.start(id, { x: p[0], y: p[1], lv: (SC.def.lv || 1) + (o.lv || 2), sub: o.sub, onWin: () => later(10, o.end) });
    if (enc) { if (o.name) enc.name = o.name; for (const u of enc.units) { u.hp = Math.round(u.hpMax * o.hp); if (o.scale) u.hpMax = u.hp; } DU = { enc, thr: o.scale ? enc.units[0].hpMax * o.stop / o.hp : enc.units[0].hpMax * o.stop, msg: o.msg }; enc._thr = DU.thr; } }); }
  function duStep() { const s = DU, enc = s.enc; if (!enc || B.enc !== enc) { DU = null; return; } if (enc.done) return;
    const u = enc.units[0]; if (u && u.hp <= s.thr) { for (const x of enc.units) x.hp = Math.max(x.hp, 1); enc.done = true; enc.winT = 0; B.tg.length = 0; B.zones.length = 0; B.proj.length = 0; G.UI.banner(s.msg[0], s.msg[1]); DU = null; } }

  /* 切磋保護：一刀打穿門檻也不會打死（收手由 duStep／149 spStep 處理） */
  const dm0 = G.damageOni; G.damageOni = function (e) { const enc = B.enc, g = enc && !enc.done && enc._thr && enc.units.includes(e) ? { hp: e.hp, st: e.st } : null; const r = dm0.apply(this, arguments);
    if (g && (e.hp <= 0 || e.st === 'dead')) { e.hp = Math.max(1, Math.round(enc._thr * 0.9)); e.st = g.st === 'dead' ? 'idle' : g.st; e.alpha = 1; } return r; };
  /* ================= 第 9 章：道摩本尊 ================= */
  function doma(q, done) { G.DLG.start([nar('（分身化成一張黑符，輕飄飄地落在地上。谷底的霧裡，傳來第二個腳步聲。）'),
      say('道摩', '分身，只是試探。'), say('道摩', '我想親眼看看——三百年後，站在她身邊的，是什麼樣的人。'),
      say('小雪', '蒼真，不要……他是真的道摩！'), say('蒼真', '小雪，退到後面。'), say('道摩', '……連這句話都一樣。來吧。')], () =>
      duel('doma', 'Q_mountain_valley', { hp: 0.5, stop: 0.27, scale: 1, sub: '本尊・試探', msg: ['道摩收手了', '他往後退進霧裡'], end: () => G.DLG.start([
        nar('（道摩抬手擋下你的刀，退了三步，袖口被劃開一道口子。）'), say('道摩', '……夠了。'),
        say('道摩', '你的刀，跟三百年前那個人很像。他也是這樣，什麼都不想，就衝到最前面。'), say('道摩', '然後……什麼都沒趕上。'),
        say('蒼真', '那個人是誰？'), say('道摩', '等你走到立約殿，自己去問那把刀吧。')], done) })); }
  { const q = Q.by.c9_m3, i = q.steps.findIndex(s => s.t === 'kill'); q.steps.splice(i + 1, 0, { t: 'fn', map: 'Q_mountain_valley', text: '面對道摩的本尊', run: doma }); }

  /* ================= 第 7 章支線：水軍的密使（新增） ================= */
  Q.add({ id: 'c7_s_envoy', ch: 7, title: '水軍的密使', desc: '奉行所的牢裡，關著一個不肯說話的水軍少年。', reward: { exp: 320, gold: 220 },
    giver: { map: 'hub_city', at: 'gate', dx: 70, u: 'n_kagetsuna', name: '景綱', need: () => Q.isDone('c7_m2'),
      lines: [say('景綱', '蒼真，有件事想拜託你。'), say('景綱', '海崖那一戰，我們抓到一個水軍的少年。叫潮丸，才十五歲。'),
        say('景綱', '他什麼都不肯說，只說要見「打贏的那個人」。……我想，他指的是你。')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'gate', dx: -80, u: 'n_renta', name: '潮丸', text: '到奉行所見潮丸', lines: [
      say('潮丸', '……你就是在海崖上打贏的人？'), say('潮丸', '我不是來求饒的。我是來告訴你——水軍裡，不是每個人都想跟道摩做生意。'),
      say('潮丸', '頭領鬼灘大人，是被逼的。道摩扣著我們的漁場，不換紙，大家就沒魚可抓。'), say('小雪', '所以你們才幫他運那些黑紙……'),
      say('潮丸', '我娘在海岸營地。求你，把這封信交給她。信上寫著，城裡有人願意聽水軍說話。'), say('潮丸', '……頭領要是知道這件事，也許，就不用打了。')] },
      { t: 'talk', map: 'Q_coast_supply_camp', at: 'center', dx: -180, u: 'n_migiwae', name: '潮丸的娘', text: '把信交給潮丸的娘', lines: [
        say('潮丸的娘', '……這是潮丸的字。那孩子，還活著？'), nar('（她把信貼在胸口，好一會兒說不出話。）'),
        say('潮丸的娘', '謝謝你。我會把信送到頭領手上。'), say('潮丸的娘', '鬼灘大人不是壞人。他只是……太久沒聽到有人跟水軍好好說話了。'),
        say('蒼真', '景綱說，等事情結束，潮丸就能回家。'), say('潮丸的娘', '……那我就等。水軍的女人，最會等了。')] }],
    done() { F().envoy7 = 1; } });

  /* ================= 第 10 章：礁島水軍和談 ================= */
  function navy(q, done) { if (!Q.isDone('c7_s_envoy')) return done();
    const fail = [say('鬼灘', '……說得好聽。可是道摩的刀，還架在漁場上。'), say('鬼灘', '空話換不來魚。要碎片，就自己來拿！'), act(() => set('c10_navy', 'fight'))];
    const q2 = [say('鬼灘', '第二件事。就算我們不跟道摩換紙，漁場被他封著，大家拿什麼過冬？'),
      { choice: [{ label: '漁場的封印，我們來解。小雪跟汐音都在。', then: [say('汐音', '海裡的封印，是海神的領域。……我去求她，她會聽的。'), say('鬼灘', '……海神的巫女，親自開口？'), act(() => set('c10_navy', 'peace'))] },
        { label: '城裡可以先借糧給你們。', then: fail }, { label: '這是你們自己的事。', then: fail }] }];
    G.DLG.start([nar('（駐地的木柵後面，站滿了拿著魚叉的水軍。一個滿臉鬍子的大漢走了出來，手上拿著一封被海水泡皺的信。）'),
      say('鬼灘', '……潮丸的信，我讀了。你就是那個在海崖上打贏的神社劍士。'), say('鬼灘', '說吧。你想怎麼樣？'),
      { choice: [{ label: '我來談。', then: [say('鬼灘', '好。我只問兩件事。'), say('鬼灘', '第一件——你們陸上的人，憑什麼要我們相信？一百年來，你們只會在水軍餓肚子的時候關城門。'),
          { choice: [{ label: '潮丸在城裡，景綱親口說，事情結束就放他回家。', then: [say('鬼灘', '……景綱？那個死腦筋的奉行，說話倒是算數的。'), ...q2] },
            { label: '因為我比道摩強。', then: fail }, { label: '你們沒有選擇。', then: fail }] }] },
        { label: '不用談了，交出碎片。', then: [act(() => set('c10_navy', 'fight')), say('鬼灘', '……我就知道。陸上的人都一樣。')] }] }], () => {
      if (C('c10_navy') === 'peace') G.DLG.start([nar('（鬼灘看了你很久，然後轉身對手下揮了揮手。魚叉一支一支放下了。）'),
        say('鬼灘', '……碎片在寶箱裡。拿去吧。'), say('鬼灘', '道摩那邊，水軍不會再幫他運一張紙。'),
        say('鬼灘', '還有——等你們跟那個什麼大禍津日打起來的時候，看看海上。水軍的船，欠你一次。'), say('潮丸的娘', '（人群後面，一個女人朝你深深鞠了一躬。）')], done);
      else done(); }); }
  { const q = Q.by.c10_m2, k = q.steps.find(s => s.t === 'kill'), lk = q.steps.find(s => s.t === 'look');
    k.skip = () => C('c10_navy') === 'peace'; q.steps.unshift({ t: 'fn', map: 'Q_reef_naval_base', text: '登上礁島水軍駐地', run: navy });
    if (lk) { const L0 = lk.lines; lk.lines = () => C('c10_navy') === 'peace' ? [say('蒼真', '（鬼灘親手打開寶箱。裡面是半顆寶珠碎片，和一封信：「以碎片換千扇紙，道摩」。）'), say('汐音', '……長壁姬的紙，是用這個換的。'), say('鬼灘', '這封信你也拿走。我不想再看到那個名字。')] : (typeof L0 === 'function' ? L0() : L0); } }
  /* 終章：水軍船砲支援 */
  if (B && B.start) { const bs0 = B.start; B.start = function (id) { const enc = bs0.apply(this, arguments);
    if (enc && id === 'omagatsuhi' && C('c10_navy') === 'peace') { enc._navy = { n: 6, t: 360 }; later(120, () => G.UI.banner('礁島水軍', '「神社的劍士！看海上——水軍的船，來還人情了！」')); } return enc; }; }
  function navyStep() { const enc = B.enc; if (!enc || enc.done || !enc._navy || G.DLG.active()) return; const a = enc._navy; if (a.n <= 0 || --a.t > 0) return; a.t = 600; a.n--;
    const hit = u => { if (u.st === 'dead' || u.hp <= 1) return; const d = Math.round(u.hpMax * 0.02); u.hp = Math.max(1, u.hp - d); u.flash = 10; G.NUMS.push({ x: u.x, y: u.y - (G.HERO_H || 90) * 1.2, v: d, t: 0 });
      if (G.VX && G.VX.ring) G.VX.ring({ x: u.x, y: u.y, r1: 1.6, life: 20, col: '255,190,110' }); SC.shake = Math.max(SC.shake || 0, 5); };
    for (const u of enc.units) { if (u.st === 'dead' || u.hp <= 1) continue; if (G.ALLY && G.ALLY.rain) { for (let i = 0; i < 3; i++) G.ALLY.rain(u, 'shell', i === 2 ? hit : null, i * 6); } else hit(u); }   /* r3.143.0：砲彈從海上飛來 */
    G.UI.toast('水軍砲擊！（剩 ' + a.n + ' 輪）'); }

  /* ================= 第 11 章：不能回頭 ================= */
  const XMAP = 'W_R11_02'; let XF = null;
  function escape(q, done) { G.DLG.start([nar('（崖徑的左邊，黑色的霧像潮水一樣湧了上來。霧經過的地方，草葉一瞬間就枯成了灰。）'),
      say('白丸', '是黃泉的氣！碰到就會被拖下去——蒼真，往右跑，不要回頭！'), say('小雪', '（小雪抱緊懷裡發光的封印碎石。）我、我跟得上！'),
      say('蒼真', '抓緊我。一口氣衝到崖徑的盡頭！')], () => { const d = SC.def, a = (d.nodes || {}).west_arrival || [150, d.h * 0.75], b = (d.nodes || {}).east_arrival || [d.w - 150, a[1]];
      XF = { x: Math.min(H.x - 260, a[0] - 120), v: 1.15, end: b[0] - 30, wave: 0, done, t: 0, dmgT: 0 }; G.UI.banner('不能回頭', '黃泉的黑霧從後面追來了——往右邊跑！'); }); }
  function xfStep() { const f = XF; if (SC.id !== XMAP) { XF = null; return; } if (G.DLG.active()) return; f.t++;
    f.x += f.v * (H.x - f.x > 520 ? 1.6 : 1);
    if (H.x < f.x + 20 && H.hp > 0 && ++f.dmgT >= 12) { f.dmgT = 0; const d = Math.max(1, Math.round(H.hpMax * 0.01)); H.hp = Math.max(1, H.hp - d); G.NUMS.push({ x: H.x, y: H.y - (G.HERO_H || 90), v: d, t: 0, c: '#b58cff' }); if (f.t % 60 < 12) G.UI.toast('被黑霧追上了！快往右跑！'); }
    if (H.x < f.x - 60) H.x = f.x - 60;   // 不能回頭
    const prog = (H.x - 150) / (f.end - 150);
    if (f.wave < 3 && prog >= [0.15, 0.45, 0.72][f.wave]) { f.wave++; const types = ['skel', 'skelred', 'skelgun'], lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 1);
      Q.load(types).then(() => { for (let i = 0; i < 3 + f.wave; i++) { const p = SC.snap(H.x + 300 + i * 45, H.y + (i % 3 - 1) * 50, 'open', 220); if (!p) continue; const o = G.spawnOni(p[0], p[1], 8 + i * 10, lv, types[i % 3]); if (o) { o.xf = 1; if (f.wave === 3 && i === 0) { o.hp = o.hpMax = Math.round(o.hpMax * 4); G.UI.banner('黃泉醜女', '擋在崖徑的盡頭'); } } } });
      G.UI.toast('亡者從崖下爬上來了！（第 ' + f.wave + ' 波）'); }
    if (H.x >= f.end && f.wave >= 3) { XF = null; for (const o of G.E) if (o.xf && o.st !== 'dead') { o.hp = 0; o.st = 'dead'; }
      G.DLG.start([nar('（你們衝出崖徑的瞬間，黑霧撞上了崖口的岩壁，像浪一樣碎開，慢慢退回了深谷。）'), say('小雪', '……哈、哈……我們……跑出來了……'),
        say('白丸', '黃泉的氣不會追出它的地界。……暫時，安全了。'), say('小雪', '蒼真，你剛剛一次都沒有回頭耶。'), say('蒼真', '妳說要跟上，我就相信妳跟得上。'),
        say('小雪', '……嗯。下次，也要這樣相信我喔。')], f.done); } }
  { const q = Q.by.c11_m3, i = q.steps.findIndex(s => s.t === 'kill' && s.map === XMAP); if (i >= 0) q.steps[i] = { t: 'fn', map: XMAP, text: '沿著返程崖徑逃離黃泉的黑霧', run: escape }; }
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); const f = XF; if (!f || SC.id !== XMAP) return;
    const sx = SC.toScreen(f.x, 0).x; if (sx <= -40) return; ctx.save(); const g = ctx.createLinearGradient(sx - 220, 0, sx + 60, 0);
    g.addColorStop(0, 'rgba(10,0,20,.92)'); g.addColorStop(0.75, 'rgba(40,10,60,.65)'); g.addColorStop(1, 'rgba(40,10,60,0)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx, 0); for (let y = 0; y <= G.LH; y += 24) ctx.lineTo(sx + 40 + Math.sin(y * 0.05 + f.t * 0.08) * 22, y); ctx.lineTo(0, G.LH); ctx.closePath(); ctx.fill(); ctx.restore(); };

  /* ================= 每幀（只在有事時） ================= */
  const ls0 = G.lootStep; G.lootStep = function () { ls0.apply(this, arguments); if (DU) duStep(); if (XF) xfStep(); if (B.enc && B.enc._navy) navyStep(); };
})();
