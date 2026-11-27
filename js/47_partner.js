/* ==========================================================================
 * 神諭之地 重製版 — 47_partner.js
 * Version : r3.154.0  (2026-11-27)　r3.154.0：建御雷邀請台詞「……」併入下一句
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 加入隊伍時自動放進空的出戰位。
 * 變更    : r3.9.0 新增。隱藏王招募（源賴光／建御雷／役小角）：信物蒐集、招募對話、入隊後的地圖閒聊。
 *           ‧ 招募條件：在試煉石擊敗該隱藏王＋集齊三種信物 → 試煉石「邀請入隊」。
 *           ‧ 信物（掉落都看機率，需要反覆挑戰）：
 *             源賴光：童子切之鍔（酒吞童子 15%）／四天王誓紙×4（富士山小頭目每場 50%）／鬼角×12（鬼類妖怪 4%）。
 *             建御雷：布都御魂劍穗（素戔嗚尊 20%）／四神之羽×4（天空浮島小頭目每場 50%）／雷晶×12（雷類妖怪 4%）。
 *             役小角：錫杖之鈴（安倍晴明 20%）／靈石碎片×6（打碎晴明星陣的靈石，每次 1）／前鬼斧刃＋後鬼水瓶（前鬼後鬼戰各 40%）。
 *           ‧ 閒聊：入隊後依「劇情進度（前／中／後期／通關後）」「所在區域」「頭目戰開打」「低血量／清場／升級」等情況發言，並有與其他夥伴的對話。
 * 依賴    : 07_rpg（COMP、keys、comp）、10_banter（G.BANTER）、26_boss（onEnd、start）、05_dialog（G.DLG）。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, BT = G.BANTER, B = G.BOSS; if (!R || !BT) return;
  const F = () => G.SAVE.data.flags, K = () => { const d = R.d(); d.keys = d.keys || {}; return d.keys; };
  const say = (who, text) => ({ who, text });
  /* ---------- 信物 ---------- */
  const ITEM = { dojigiri: ['童子切之鍔', 1], seishi: ['四天王誓紙', 4], onikaku: ['鬼角', 12], futsu: ['布都御魂劍穗', 1], shijin: ['四神之羽', 4], raisho: ['雷晶', 12],
    shakujo: ['錫杖之鈴', 1], reiseki: ['靈石碎片', 6], zenkiono: ['前鬼斧刃', 1], gokibin: ['後鬼水瓶', 1] };
  const REC = {
    yorimitsu: { n: '源賴光', boss: 'h_yorimitsu', items: ['dojigiri', 'seishi', 'onikaku'], who: '斬鬼的名將', d: '沉著嚴謹的斬妖武者。看準敵人收招的瞬間落刀，擅長見切與反擊。', sk: [['見切', '敵人收招時的反擊必定破勢'], ['童子切・拔斷', '蓄刀單體斷守']] },
    takemikazuchi: { n: '建御雷', boss: 'h_takemikazuchi', items: ['futsu', 'shijin', 'raisho'], who: '雷與劍之神', d: '話少而威嚴的雷神。劍擊末段積蓄雷荷，滿荷時一擊破勢。', sk: [['雷荷', '普攻末擊累積，最多 3 荷'], ['布都雷貫', '單體劍線＋落雷']] },
    enno: { n: '役小角', boss: 'h_enno', items: ['shakujo', 'reiseki', 'zenkiono', 'gokibin'], who: '驅使役靈的修驗者', d: '清雅聰敏的少女修行者。錫杖定步、役靈協擊，替主角補上未完的一擊。', sk: [['法響', '保留三成威力，下一擊時追加'], ['役靈穿霞', '光擊＋回聲']] } };
  const P = G.PARTNER = { ITEM, REC,
    n: id => K()[id] || 0,
    gain(id, n) { if (!ITEM[id]) return; const k = K(), [nm, need] = ITEM[id]; if ((k[id] || 0) >= need) return; k[id] = Math.min(need, (k[id] || 0) + (n || 1)); G.SAVE.markDirty(); G.UI.toast('獲得信物「' + nm + '」（' + k[id] + '／' + need + '）'); },
    ready: cid => REC[cid].items.every(i => P.n(i) >= ITEM[i][1]),
    joined: cid => !!F()['join_' + cid],
    join(cid, done) { if (P.joined(cid)) return; const r = REC[cid]; G.DLG.start(INVITE[cid], () => { for (const i of r.items) delete K()[i]; F()['join_' + cid] = 1; const d = R.d(); d.comp[cid] = d.comp[cid] || { lv: Math.max(1, d.lv - 3), exp: 0 }; if (G.PARTY) G.PARTY.onJoin(cid); G.SAVE.markDirty(); G.UI.banner(r.n + '　加入了', '隱藏夥伴'); BT.say(cid, LINES[cid].join, true); done && done(); }); } };
  /* 名冊：隱藏夥伴三位 */
  for (const cid in REC) { const r = REC[cid]; R.COMP.push({ id: cid, n: r.n, who: r.who, hidden: '在神社後山試煉石擊敗' + r.n + '，並集齊信物：' + r.items.map(i => ITEM[i][0] + (ITEM[i][1] > 1 ? '×' + ITEM[i][1] : '')).join('、'), d: r.d, sk: r.sk }); }
  BT.extra.push('yorimitsu', 'takemikazuchi', 'enno');

  /* ---------- 掉落 ---------- */
  const chance = p => Math.random() < p;
  B.onEnd = (function (o) { return function (enc) { o && o(enc); const id = enc.id;
    if (id === 'shuten' && chance(0.15)) P.gain('dojigiri');
    if ((id === 'mb_fuji2' || id === 'mb_fuji3') && chance(0.5)) P.gain('seishi');
    if (id === 'susanoo' && chance(0.2)) P.gain('futsu');
    if ((id === 'mb_sky2' || id === 'mb_sky3') && chance(0.5)) P.gain('shijin');
    if (id === 'seimei' && chance(0.2)) P.gain('shakujo');
    if (id === 'mb_izumo3') { if (chance(0.4)) P.gain('zenkiono'); if (chance(0.4)) P.gain('gokibin'); } }; })(B.onEnd);
  const kill0 = R.onKill.bind(R); R.onKill = function (e) { kill0(e); if (e.bb) return; const t = e.type || '';
    if (/oni/.test(t) && chance(0.04)) P.gain('onikaku'); if (/ikazuchi|raiju/.test(t) && chance(0.04)) P.gain('raisho'); };
  /* 頭目戰開打：夥伴喊一句 */
  const start0 = B.start; B.start = function (id, o) { const enc = start0(id, o); if (enc) setTimeout(() => BT.trigger('boss', true), 1500); return enc; };

  /* ---------- 招募對話 ---------- */
  const AFTER = {   // 擊敗隱藏王後（還沒集齊信物）
    yorimitsu: [say('源賴光', '……好刀筋。收刀前的那一瞬，你沒有慌。'), say('源賴光', '我在等一個能並肩斬妖的人。但刀，不能隨便交給別人。'), say('源賴光', '帶來童子切的鍔、四天王的誓紙，還有斬下的鬼角。我便知你走過的路。')],
    takemikazuchi: [say('建御雷', '……雷，認得你了。'), say('建御雷', '布都御魂的劍穗、四神之羽、凝結的雷晶。帶來，便與你同行。')],
    enno: [say('役小角', '呼……好久沒有人能跟上我的步子了。'), say('役小角', '我想看看你走的路。但役靈不會跟沒有緣的人走——'), say('役小角', '錫杖的鈴、晴明靈石的碎片，還有前鬼的斧刃與後鬼的水瓶。集齊了，再來找我。')] };
  const INVITE = {
    yorimitsu: [say('源賴光', '……都帶來了。誓紙上的字，是那四人的手筆。'), say('蒼真', '跟我們一起走吧。'), say('源賴光', '斬妖不為名，只為讓人能安穩睡一晚。這點，你我相同。'), say('源賴光', '從今天起，我的刀借你。')],
    takemikazuchi: [say('建御雷', '……劍穗還在。四神也點頭了。'), say('蒼真', '要一起走嗎？'), say('建御雷', '雷，與你同行。')],
    enno: [say('役小角', '前鬼的斧刃、後鬼的水瓶……它們願意把信物給你，代表你待它們不錯。'), say('役小角', '那，我也不囉嗦了。'), say('役小角', '修行的路，兩個人走比較不無聊。請多指教，蒼真。')] };

  /* ---------- 地圖閒聊 ---------- */
  const LINES = {
    yorimitsu: { face: null, name: '源賴光', join: '刀已出鞘。走吧。',
      idle: ['刀不離手，人才能睡得安穩。', '你的步伐亂了半拍。累了就說。', '妖怪最可怕的時候，是你以為牠走了的時候。', '……酒吞那傢伙，總有一天要再見一面。'],
      enter: { hub_shrine: ['神社的空氣很乾淨。這裡守得很好。'], hub_mountain: ['試煉石……當年我也在這裡跪過。'], hub_city: ['人多的地方，妖怪也愛混進來。'] },
      place: { W_R01: ['這一帶的鬼氣很淡，但不代表沒有。'], W_R05: ['火的味道……跟大江山很像。'], W_R08: ['大江……我在這裡留過一刀。'], W_R09: ['蜘蛛的絲最難斬，要順著斬。'], W_R11: ['黃泉的風，別讓它吹進心裡。'], W_R12: ['到最後一段了。刀要更穩。'], D_FUJ: ['富士的雪……四天王還在山上等我嗎？'], D_SKY: ['天上的路，踩實了再走。'], D_IZU: ['出雲的神都很固執。我喜歡。'], D_EZO: ['北方的熊，力氣比鬼還大。'] },
      stage: { early: ['你還很年輕。年輕的刀，最容易收不住。'], mid: ['你開始懂得等了。很好。'], late: ['天上的光變了顏色。大事要來了。', '不管對手是神是鬼，斬的方式都一樣。'], post: ['結束了嗎？……不，人間的妖怪斬不完的。', '有空的話，陪我去試煉石再練一場。'] },
      fight: ['看準收招！', '別急，等牠先動。', '這隻我來。'], boss: ['大傢伙。一刀一刀削，別貪。', '看清楚牠的起手，答案都在那裡。'], low: ['退下！我來擋！', '呼吸，別亂了刀。'], lvup: ['刀筋變了。不錯。'], clear: ['收刀。', '……還有餘力，很好。'], loot: ['好東西。收著。'], home: ['回來了。今晚可以睡個好覺。'] },
    takemikazuchi: { face: null, name: '建御雷', join: '……走。',
      idle: ['……', '雷要落，風先知道。', '你的劍，太輕。……再重一點。', '天上的事，不必問。'],
      enter: { hub_shrine: ['……鈴聲很好。'], hub_mountain: ['磐座。我認得這塊石頭。'] },
      place: { W_R04: ['雷鳴峽。……這裡的雷，是我的遠親。'], W_R06: ['天上的書庫，太吵。'], W_R10: ['海神也在看。'], W_R12: ['天門。……準備好。'], D_SKY: ['素戔嗚那小子，還是一樣衝動。'], D_FUJ: ['山很高。雷落得更準。'] },
      stage: { early: ['……你還不夠快。'], mid: ['雷荷，存好了。'], late: ['禍津的氣息很重。不要離我太遠。'], post: ['天下太平。……雷也想休息。'] },
      fight: ['雷來。', '退後一步。'], boss: ['……有趣。', '劍，借你一道雷。'], low: ['站好。', '……我在。'], lvup: ['……可以。'], clear: ['……結束。'], loot: ['亮的。'], home: ['……熱茶。'] },
    enno: { face: null, name: '役小角', join: '請多指教！役靈們也說你人不錯喔。',
      idle: ['腳步要輕，地脈會聽到的。', '你知道嗎？錫杖的鈴，一次只會為一個人響。', '我師父說，修行就是一直走。……所以我們一直走吧！', '前鬼後鬼最近都很乖。大概吧。'],
      enter: { hub_shrine: ['這座神社的地脈好溫柔。'], hub_mountain: ['後山的風，會把念頭吹乾淨。'], hub_city: ['人好多！糰子店在哪裡？'] },
      place: { W_R02: ['河的聲音在唱歌。'], W_R03: ['狐狸的氣味……葛葉的老家嗎？'], W_R07: ['這裡的牆上，畫著很久以前的修驗路。'], W_R09: ['蜘蛛絲上有人的名字……好難過。'], W_R11: ['別看太久黃泉的霧，會被叫住的。'], D_IZU: ['晴明大人還是老樣子嗎？……我才不想見他呢。'], D_EZO: ['好冷！爐火女神那邊一定很溫暖。'] },
      stage: { early: ['這條路，以後會越走越遠喔。'], mid: ['你的氣息變沉穩了。役靈們也注意到了。'], late: ['地脈在發抖……有很大的東西要醒了。', '不要怕，我會一直在你後面。'], post: ['天地安定了。下一趟修行要去哪裡呢？', '我想去看看大家都還好嗎。'] },
      fight: ['役靈，去吧！', '我來牽制，你上！'], boss: ['好大……不過不可怕。', '看清楚光路，我會提示你的！'], low: ['別硬撐！先退開一步！', '鈴聲聽得到嗎？跟著它走！'], lvup: ['又更強了呢！'], clear: ['呼——大家都沒事。'], loot: ['這個有神氣喔。'], home: ['回到神社了。我想泡個熱水。'] } };
  Object.assign(BT.L, LINES);
  /* 原有夥伴：補頭目戰台詞與劇情進度台詞 */
  const ADD = { shiro: { boss: ['大傢伙。我咬腳，你砍頭。', '別怕。我在。'], stage: { mid: ['你變強了。……一點點。'], late: ['天上的味道不對。小心。'], post: ['結束了？那回神社睡覺。'] } },
    hayate: { boss: ['這隻可不好射！', '我從上面找破綻！'], stage: { late: ['風好亂……我不喜歡。'], post: ['下次比賽跑去試煉石！'] } },
    kuzuha: { boss: ['結界準備好了，放心打。'], stage: { late: ['這些氣息……好悲傷。'], post: ['終於，可以好好睡一覺了。'] } },
    ibaraki: { boss: ['讓我拆了牠！'], stage: { late: ['到這裡，就不能回頭了。'], post: ['……去大江山喝一杯吧。'] } },
    shion: { boss: ['我會一直唱的！撐住！'], stage: { late: ['天上的潮聲好吵。'], post: ['好想帶大家去看海。'] } } };
  for (const id in ADD) if (BT.L[id]) { BT.L[id].boss = ADD[id].boss; BT.L[id].stage = ADD[id].stage; }
  /* 夥伴之間 */
  BT.PAIR.push(
    [['yorimitsu', '茨木童子。'], ['ibaraki', '……幹嘛。'], ['yorimitsu', '沒事。只是確認你的手還在。'], ['ibaraki', '你這傢伙……！']],
    [['enno', '白丸、白丸，你是石頭做的，那你會想被摸頭嗎？'], ['shiro', '……可以。一下下。']],
    [['takemikazuchi', '……颯。'], ['hayate', '咦？雷神大人叫我？'], ['takemikazuchi', '箭，很快。'], ['hayate', '……我、我會更快的！']],
    [['enno', '晴明大人說過，修驗者跟陰陽師是死對頭。'], ['kuzuha', '可是你們看起來交情不錯呀。'], ['enno', '那、那是誤會！']],
    [['yorimitsu', '建御雷大人，請指教一劍。'], ['takemikazuchi', '……雷，不手下留情。'], ['yorimitsu', '求之不得。']]);
  /* 擊敗隱藏王的後續 */
  P.after = function (cid) { if (!REC[cid] || P.joined(cid)) return; if (P.ready(cid)) P.join(cid); else G.DLG.start(AFTER[cid]); };
})();
