/* ==========================================================================
 * 神諭之地 重製版 — 54_story_c.js
 * Version : r3.154.0  (2026-11-27)　r3.154.0：小雪「……」改成動作描述
 * 舊版    : r3.21.0  （r3.21.0：c9_m2 改找渡口時雨，不再另生重複的時雨）
 * 舊版    : r3.11.1  (2026-11-14)
 * 變更    : r3.11.1 神社「名冊」改稱「舊冊」（與第一章尋人告示區分）。
 * 變更    : r3.11.0 新增。第九～十二章主線、抉擇、支線、委託、結局分歧。
 *           頭目：第九章 土蜘蛛｜第十章 綿津見大神｜第十一章 伊邪那美｜第十二章 道摩（立約殿）→ 大禍津日神（終焉高台）。
 *           結局：依小雪好感、人妖關係（各章抉擇）、夥伴心事判定 → 真結局／無名的守護者／暴雨歸來。
 * 依賴    : 53_quest（G.QST）、54_story_a／b。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, say = Q.say, act = Q.act, F = () => G.SAVE.data.flags, C = k => Q.choice(k), D = id => Q.isDone(id);
  const T = (who, ...ls) => ls.map(l => say(who, l));
  const 蒼 = (...l) => T('蒼真', ...l), 雪 = (...l) => T('小雪', ...l), 丸 = (...l) => T('白丸', ...l);
  /* 人妖關係：偏向妖怪 +1、偏向人類 −1（只算有明確立場的抉擇） */
  Q.bond = () => { let b = 0; const v = { c2_stone: { kappa: 1, east: -1 }, c5_truth: { truth: 1, silence: -1 }, c8_feast: { peace: 1, raid: -1 }, c9_spider: { spare: 1, purge: -1 }, c10_tide: { refuse: 1, offer: -1 } };
    for (const k in v) { const c = C(k); if (c && v[k][c]) b += v[k][c]; } return b; };
  Q.xue = () => (G.SAVE.data.xueLove || 0) + (C('c6_confess') === 'confess' ? 2 : 0) + (C('c10_xue') === 'refuse' ? 2 : 0) + (D('c11_s_relic') ? 1 : 0) + (D('c7_s_xue') ? 1 : 0) + (D('c9_s_song') ? 1 : 0);

  /* ======================= 第九章　八絃蛛窟 ======================= */
  Q.add({ id: 'c9_m1', ch: 9, main: true, title: '三條封印絲', desc: '剪斷連到各地封印的蛛絲。', reward: { exp: 380, gold: 260 }, need: () => F().ch9,
    steps: [{ t: 'talk', map: 'W_R09_01', at: 'center', u: 'n_sasane', name: '笹音', text: '在織梭工房問織工', lines: [say('笹音', '織娘大人被拖走的那天，工房裡的線全都自己動了起來。'), say('笹音', '有三條最粗的，一條往雨廊，一條往狐路，一條……往這裡的染場。'), ...雪('這三條線，連著三個地方的封印。剪斷它，蜘蛛就拉不動了。')] },
      { t: 'hold', map: 'W_R09_03', at: 'center', sec: 35, waves: 3, n: 4, foes: ['kogumo', 'kumohei'], text: '在反流染場剪斷第一條絲', label: '粗蛛絲' },
      { t: 'hold', map: 'W_R07_03', at: 'center', sec: 30, waves: 2, n: 4, foes: ['kogumo', 'jorogumo'], text: '回雨廊布街剪斷第二條絲', label: '粗蛛絲' },
      { t: 'hold', map: 'W_R03_03', at: 'center', sec: 30, waves: 2, n: 4, foes: ['kogumo', 'kumohei'], text: '回狐路的稻架農家剪斷第三條絲', label: '粗蛛絲' }] });
  Q.add({ id: 'c9_m2', ch: 9, main: true, after: 'c9_m1', title: '北方的織娘', desc: '絲線指向北方的雪原。', reward: { exp: 380, gold: 260 },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 150, dy: -4, u: null, name: '時雨', text: '回渡口找時雨，前往雪原', lines: [say('時雨', '雪原？那是副本的地方，平常不開放的。'), say('時雨', '……不過，絲線指著那裡的話，老身就破例一次。')] },
      { t: 'kill', map: 'D_EZO_03', at: 'center', n: 6, foes: ['jorogumo', 'kumohei'], elite: '絡新婦', text: '在寒風雪原救出織娘' },
      { t: 'talk', map: 'D_EZO_03', at: 'center', dx: -100, u: 'n_chikage', name: '織娘・八絃', text: '和織娘說話', lines: [say('八絃', '……你們來了。'), say('八絃', '土蜘蛛要我織一張網，網住全國的封印，把力量全部拉到一個地方。'), say('八絃', '那個地方是深山的谷底盆地。……道摩在那裡等著。')] }] });
  Q.add({ id: 'c9_m3', ch: 9, main: true, after: 'c9_m2', title: '谷底的道摩', desc: '第一次正面面對道摩。', reward: { exp: 420, gold: 300 },
    steps: [{ t: 'cut', map: 'Q_mountain_valley', lines: [say('道摩', '（谷底盆地的中央，一個穿黑衣的陰陽師靜靜站著。）……終於見面了，器的守護者。'), say('道摩', '我叫道摩。三百年前，我也是神社的人。'), say('道摩', '我親眼看著初代的器走進寶珠，消失。……那時候，誰也沒有救她。'), say('道摩', '所以這一次，我要自己成為器。讓那個孩子……活下去。'), ...雪('……什麼？'), say('道摩', '可惜，你們不會相信我。')] },
      { t: 'kill', map: 'Q_mountain_valley', at: 'center', n: 1, foes: ['kuroonmyo'], elite: '道摩（分身）', eliteSub: '打倒分身，救回小雪', text: '擊退道摩的分身' },
      { t: 'cut', map: 'Q_mountain_valley', lines: [say('道摩', '……不錯。'), say('道摩', '我們會在立約殿再見。到時候，你得選——讓她消失，還是讓我取代她。'), ...雪('（小雪跪在地上，手指透明得能看見地板。）……蒼真，他說的……是真的嗎？')] }] });
  Q.add({ id: 'c9_m4', ch: 9, main: true, after: 'c9_m3', title: '蛛窟的抉擇', desc: '土蜘蛛的巢裡，還有許多幼蛛。', reward: { exp: 200 },
    steps: [{ t: 'choice', map: 'W_R09_07', at: 'west_arrival', dx: 160, u: 'n_chikage', name: '織娘・八絃', key: 'c9_spider', text: '要怎麼處理蛛窟裡的幼蛛？', lines: [say('八絃', '土蜘蛛被道摩利用了。巢裡的幼蛛……什麼都不知道。'), say('巡檢孫六', '全燒了！留著遲早是禍害！')],
      opts: [{ label: '放過幼蛛，讓八絃照顧', v: 'spare', lines: [say('八絃', '……我會教牠們織布，而不是織網。')] }, { label: '全部清除', v: 'purge', lines: [say('巡檢孫六', '這才對。'), say('八絃', '（八絃別過頭去。）')] }] }] });
  Q.add({ id: 'c9_s_hayate', ch: 9, title: '天狗族的叛徒', desc: '颯的師父被說成是天狗族的叛徒。', reward: { exp: 360, item: [11, 3] },
    giver: { map: 'W_R04_04', at: 'center', dx: 100, u: 'n_t_tengu_elder', name: '天狗長者', need: () => F().ch9, lines: [say('天狗長者', '颯的師父……三百年前，被族裡當成叛徒趕出去。'), say('天狗長者', '因為他幫了一個人類女子。……那個女子，就是初代的器。')] },
    steps: [{ t: 'talk', map: 'Q_field_seal_forest', at: 'center', u: null, name: '颯', text: '到神社後山找颯', lines: [say('颯', '……我聽說了。'), say('颯', '師父不是叛徒。他只是想救她。'), say('颯', '跟現在的你一樣。')] }] });
  Q.add({ id: 'c9_s_song', ch: 9, title: '織女的歌', desc: '八絃想把一首歌織進布裡，送給小雪。', reward: { exp: 300, mat: { cloth: 5 } },
    giver: { map: 'W_R09_01', at: 'center', dx: 120, u: 'n_chikage', name: '織娘・八絃', need: () => D('c9_m2'), lines: [say('八絃', '我想織一條披肩給那位巫女。'), say('八絃', '可是要織進「歌」，得有月下芒草的絲。')] },
    steps: [{ t: 'gather', map: 'Q_night_susuki', text: '到月下芒草溪畔收集發光的芒草絲', spots: [{ at: 'west_arrival', dx: 140, label: '芒草絲' }, { at: 'east_arrival', dx: -140, label: '芒草絲' }] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', u: null, name: '小雪', text: '把披肩送給小雪', lines: [...雪('（小雪把披肩披在肩上。披肩發出淡淡的歌聲。）', '……好溫暖。', '蒼真，你聽，這是……「河啊河，你從山上來」。')] }] });
  Q.add({ id: 'c9_s_bounty', ch: 9, title: '賞金首・黑符陰陽師之首', desc: '奉行所懸賞道摩的副手。', reward: { gold: 500, exp: 400 },
    giver: { map: 'hub_city', at: 'gate', dx: 60, u: 'n_t_human_guard', name: '巡檢孫六', need: () => D('c9_m3'), lines: [say('孫六', '道摩的副手，綽號「黑符」，出現在共岸的河灣。'), say('孫六', '賞金五百。……拜託了，城裡的人都怕了。')] },
    steps: [{ t: 'kill', map: 'W_R02_06', at: 'center', n: 4, foes: ['kuroonmyo', 'kageshinobi'], elite: '黑符', text: '討伐黑符' }] });
  Q.add({ id: 'c9_s_cat', ch: 9, title: '貓又的主人', desc: '城東的貓又，在找三百年前的主人。', reward: { gold: 200, exp: 260 },
    giver: { map: 'hub_city', at: 'east_arrival', dx: -240, u: 'n_a_cat', name: '貓又', need: () => F().karakasaHome, lines: [say('貓又', '喵。……人類，你身上有神社的味道。'), say('貓又', '我的主人是神社的巫女。三百年前，她說「等我回來」。')] },
    steps: [{ t: 'talk', map: 'hub_shrine', at: 'archive_stand', u: 'n_t_human_elder', name: '茂兵衛爺', text: '到神社舊冊查巫女的名字', lines: [say('茂兵衛爺', '三百年前的巫女……舊冊上只寫了一個字：「器」。'), say('茂兵衛爺', '她沒有名字。器，是不需要名字的。')] },
      { t: 'talk', map: 'hub_city', at: 'east_arrival', dx: -240, u: 'n_a_cat', name: '貓又', text: '告訴貓又', lines: [say('貓又', '……沒有名字？'), say('貓又', '不對。她有名字。她叫我「小黑」的時候，我也叫過她的名字。'), say('貓又', '……她叫「雪」。')] }] });
  Q.add({ id: 'c9_after', ch: 9, main: true, postBoss: true, silent: true, title: '後日談・網', need: () => F().boss_W_R09_07, reward: { exp: 300 },
    steps: [{ t: 'talk', map: 'hub_shrine', at: 'xue_stand', u: null, name: '小雪', text: '回神社，和小雪談談', lines: () => [...雪('蒼真。道摩說的話……我想了很久。', '如果他取代我成為器，我就能活下來。', '可是那樣，他會變成什麼？'), D('c9_s_cat') ? say('蒼真', '……貓又說，初代的器，名字也叫「雪」。') : say('蒼真', '……我不知道。'), ...雪('……')] }] });
  Q.add({ id: 'c9_b_thread', ch: 9, boss: true, postBoss: true, title: '絲線修補', desc: '八絃要修補各地被扯壞的封印絲。', reward: { gold: 360, exp: 380 },
    giver: { map: 'W_R09_05', at: 'center', u: 'n_chikage', name: '織娘・八絃', need: () => F().boss_W_R09_07, lines: [say('八絃', '網拆掉了，可是各地的封印絲也斷得一塌糊塗。'), say('八絃', '幫我把斷絲接回去吧。')] },
    steps: [{ t: 'look', map: 'W_R05_04', at: 'center', label: '斷掉的封印絲', text: '接回炭里爐殿的封印絲', lines: [say('蒼真', '（你把絲線繞回柱上，絲線發出一聲輕響。）')] },
      { t: 'look', map: 'W_R06_03', at: 'center', label: '斷掉的封印絲', text: '接回雲上書庫的封印絲', lines: [say('蒼真', '（書庫的書架輕輕一震，回到原位。）')] },
      { t: 'talk', map: 'W_R09_05', at: 'center', u: 'n_chikage', name: '織娘・八絃', text: '回報八絃', lines: [say('八絃', '接好了。……這張網，以後只用來保護人。')] }] });

  Q.trip.D_EZO_03 = { label: '驛馬・寒風雪原', who: '時雨', ask: '絲線指著北方的雪原。要出發嗎？', text: '你們順著絲線，一路往北……', need: () => Q.active('c9_m2') && Q.cur('c9_m2') && Q.cur('c9_m2').map === 'D_EZO_03' };

  /* ======================= 第十章　三潮珊庭 ======================= */
  Q.add({ id: 'c10_m1', ch: 10, main: true, title: '三種潮汐', desc: '漁港的潮汐亂了。', reward: { exp: 420, gold: 300 }, need: () => F().ch10,
    steps: [{ t: 'talk', map: 'W_R10_01', at: 'center', u: 'n_migiwae', name: '汀江', text: '在泊岸漁港聽漁民說明', lines: [say('汀江', '早潮、午潮、夜潮，三種潮汐全都亂了。'), say('汀江', '船出不去，魚也不來。祭司說，海神要祭品。'), say('汐音', '……我娘當年，就是這樣被帶走的。')] },
      { t: 'gather', map: 'W_R10_04', text: '在潮見舞台觀察三種潮', spots: [{ at: 'west_arrival', dx: 160, label: '早潮之柱', lines: [say('蒼真', '（早潮的柱子上，刻著一條斷掉的鎖鏈。）')] }, { at: 'center', label: '午潮之柱', lines: [say('蒼真', '（午潮的柱子上，貼著一張黑符。）')] }, { at: 'east_arrival', dx: -160, label: '夜潮之柱', lines: [say('蒼真', '（夜潮的柱子已經裂開，裡面空空的。）'), ...雪('原本鎮住潮汐的……是寶珠的碎片。被拿走了。')] }] }] });
  Q.add({ id: 'c10_m2', ch: 10, main: true, after: 'c10_m1', title: '礁島水軍', desc: '寶珠碎片落到了水軍手上。', reward: { exp: 420, gold: 320 },
    steps: [{ t: 'kill', map: 'Q_reef_naval_base', at: 'center', n: 7, foes: ['umibozu', 'isoonna'], elite: '水軍大將', text: '登上礁島水軍駐地，擊退水軍' },
      { t: 'look', map: 'Q_reef_naval_base', at: 'center', dx: 120, label: '水軍的寶箱', text: '調查寶箱', lines: [say('蒼真', '（寶箱裡是半顆寶珠碎片，和一封信：「以碎片換千扇紙，道摩」。）'), say('汐音', '……長壁姬的紙，是用這個換的。')] }] });
  Q.add({ id: 'c10_m3', ch: 10, main: true, after: 'c10_m2', title: '海神的要求', desc: '海神出現在三潮珊庭。', reward: { exp: 440, gold: 320 },
    steps: [{ t: 'choice', map: 'W_R10_05', at: 'center', u: 'n_migiwae', name: '汀江', key: 'c10_tide', text: '要把寶珠碎片獻給海神嗎？', lines: [say('綿津見', '（海面上浮出一個巨大的影子。）人類。把碎片還來，潮汐就會回來。'), say('汀江', '獻了吧！漁港的人快撐不下去了！'), ...雪('碎片給了海神，道摩就拿不到。可是封印……就少了一角。')],
      opts: [{ label: '獻給海神', v: 'offer', lines: [say('綿津見', '……善。'), say('汀江', '潮回來了！')] }, { label: '拒絕，與海神談判', v: 'refuse', lines: [say('綿津見', '……人類，竟敢拒絕我？'), say('汐音', '海神大人，請聽我說！')] }] },
      { t: 'choice', map: 'W_R10_05', at: 'center', dx: 120, u: null, name: '綿津見', key: 'c10_xue', text: '海神提出另一個條件', lines: [say('綿津見', '……那孩子。'), say('綿津見', '「器」。讓她留在海裡，代替寶珠鎮住潮汐。這樣，誰都不用打仗。'), ...雪('……我？')],
      opts: [{ label: '拒絕', v: 'refuse', lines: [...蒼('不行。'), ...雪('……蒼真。')] }, { label: '讓小雪自己決定', v: 'ask', lines: [...雪('……我不想留在海裡。', '我想跟大家一起回去。'), say('綿津見', '……哼。')] }] }] });
  Q.add({ id: 'c10_m4', ch: 10, main: true, after: 'c10_m3', title: '夕潮社前', desc: '海神在夕潮社前等著。', reward: { exp: 220 },
    steps: [{ t: 'goto', map: 'W_R10_07', text: '前往夕潮社前', lines: () => C('c10_tide') === 'offer' ? [say('綿津見', '碎片我收下了。可是，那個器的事……我還沒放棄。'), say('綿津見', '證明給我看，人類守得住她。')] : [say('綿津見', '拒絕我的人類……三百年來，你是第一個。'), say('綿津見', '來吧。')] }] });
  Q.bossMod.W_R10_07 = () => C('c10_tide') === 'offer' ? { hp: 0.8, msg: '海神收下碎片，出手留了情' } : { hp: 1.1, msg: '海神的潮水全力湧來' };
  Q.add({ id: 'c10_s_shion', ch: 10, title: '汐音的母親', desc: '汐音想知道母親被帶走那天的事。', reward: { exp: 420, item: [12, 3] },
    giver: { map: 'W_R10_01', at: 'west_arrival', dx: 160, u: 'n_migiwae', name: '汀江', need: () => F().ch10, lines: [say('汀江', '汐音的娘……我記得。她是共岸的巫女。'), say('汀江', '那年潮亂，她自己走進海裡。說是要跟海神談。')] },
    steps: [{ t: 'talk', map: 'T_ashihomura', at: 'center', dx: 120, u: 'n_p_otoku', name: '阿德婆婆', text: '回共岸問阿德婆婆', lines: [say('阿德婆婆', '汐音的娘啊……她走之前，把那首河歌教給了全村的孩子。'), say('阿德婆婆', '她說：「河會流到海裡。我在海裡等你們。」')] },
      { t: 'talk', map: 'W_R10_05', at: 'center', dx: -100, u: null, name: '汐音', text: '在珊庭和汐音說話', lines: [say('汐音', '……她不是被帶走的。是自己去的。'), say('汐音', '我一直以為，她拋下了我。'), say('汐音', '（汐音輕聲唱起那首河歌。海面上，有人和她一起唱。）')] }] });
  Q.add({ id: 'c10_s_salt', ch: 10, title: '運鹽', desc: '漁港的鹽要運到寄居地。', reward: { gold: 300, exp: 300 },
    giver: { map: 'W_R10_01', at: 'east_arrival', dx: -160, u: 'n_handcart_porter', name: '拉車的太助', lines: [say('太助', '寄居地那邊缺鹽缺得緊。'), say('太助', '可是山路上有山賊，我一個人不敢去。')] },
    steps: [{ t: 'kill', map: 'Q_road_rice', at: 'center', n: 5, foes: ['nobushi', 'bandit_leader'], text: '經杉影金稻古道，清除山賊', escort: { u: 'n_handcart_porter', name: '拉車的太助' } },
      { t: 'talk', map: 'T_akebi', at: 'center', u: 'n_t_human_elder', name: '茂兵衛爺', text: '把鹽送到寄居地', lines: [say('茂兵衛爺', '鹽！有鹽就能醃菜過冬了！')] }] });
  Q.add({ id: 'c10_after', ch: 10, main: true, postBoss: true, silent: true, title: '後日談・潮', need: () => F().boss_W_R10_07, reward: { exp: 320 },
    steps: [{ t: 'cut', map: 'W_R10_01', lines: [say('汀江', '潮回來了！船能出海了！'), say('綿津見', '（遠方的海面上，傳來低沉的聲音。）……人類。若你守不住她，我會親自來接。'), ...丸('……海神也喜歡小雪。')] }],
    done() { if (!F().join_ibaraki) Q.join('ibaraki'); } });
  Q.add({ id: 'c10_b_fest', ch: 10, boss: true, postBoss: true, title: '潮汐祭', desc: '海神要漁港重辦潮汐祭。', reward: { gold: 380, exp: 400, mat: { jade: 3 } },
    giver: { map: 'W_R10_04', at: 'center', u: 'n_migiwae', name: '汀江', need: () => F().boss_W_R10_07, lines: [say('汀江', '海神大人說，要重辦潮汐祭。'), say('汀江', '舞者、燈籠、還有供品。能幫忙準備嗎？')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 120, dy: -50, u: 'n_hanasumi', name: '花澄', text: '請花澄來跳舞', lines: [say('花澄', '潮汐祭？我去！')] },
      { t: 'gather', map: 'W_R10_04', text: '點燈籠', spots: [{ at: 'west_arrival', dx: 140, label: '燈籠' }, { at: 'center', label: '燈籠' }, { at: 'east_arrival', dx: -140, label: '燈籠' }] },
      { t: 'cut', map: 'W_R10_04', lines: [say('花澄', '（花澄在舞台上跳起舞。月光灑在海上，潮水一波一波地應和。）'), say('汐音', '……娘，你看到了嗎。')] }] });

  /* ======================= 第十一章　黃泉 ======================= */
  Q.add({ id: 'c11_m1', ch: 11, main: true, title: '黑暗的城', desc: '黃泉之氣漫進了兩岸城。', reward: { exp: 460, gold: 340 }, need: () => F().ch11,
    steps: [{ t: 'gather', map: 'hub_city', text: '安撫躲在屋裡的居民', spots: [{ at: 'west_arrival', dx: 200, label: '梅乃婆婆的家', lines: [say('梅乃婆婆', '外面好黑……柚吉在發燒。'), ...蒼('門窗關好。天會亮的。')] }, { at: 'center', dx: 200, label: '砂狐的攤子', lines: [say('砂狐', '狐族的燈還亮著。我替你守著城東。')] }, { at: 'gate', label: '奉行所', lines: [say('景綱', '城交給我。……你去做你該做的事。')] }] },
      { t: 'talk', map: 'W_R11_01', at: 'center', u: null, name: '小雪', text: '在活訊石室與小雪會合', lines: [...雪('這裡……是亡者留下聲音的地方。'), ...雪('仔細聽。')] }] });
  Q.add({ id: 'c11_m2', ch: 11, main: true, after: 'c11_m1', title: '亡者的聲音', desc: '石室裡，迴盪著許多熟悉的聲音。', reward: { exp: 460, gold: 340 },
    steps: [{ t: 'gather', map: 'W_R11_01', text: '聆聽石室裡的回聲', spots: [
      { at: 'west_arrival', dx: 160, label: '回聲', lines: () => [C('c5_truth') === 'silence' ? say('回聲', '「……我沒偷。」——是權太的聲音。他死在了牢裡。') : say('回聲', '「三十年的火……總算交給下一代了。」——是炭里老爐守的聲音。')] },
      { at: 'center', label: '回聲', lines: [say('回聲', '「師父不是叛徒……」——是颯師父的聲音。'), say('颯', '……師父。')] },
      { at: 'east_arrival', dx: -160, label: '回聲', lines: [say('回聲', '「雪……對不起……」——是一個年輕男人的聲音。'), ...雪('……這個聲音，是道摩。'), ...丸('三百年前的道摩。')] }] }] });
  Q.add({ id: 'c11_m3', ch: 11, main: true, after: 'c11_m2', title: '最後的封印檢查', desc: '回神社後山，封印石完全碎了。', reward: { exp: 480, gold: 360 },
    steps: [{ t: 'look', map: 'Q_field_seal_forest', at: 'center', label: '碎裂的封印石', text: '和小雪做最後一次封印檢查', lines: () => [...雪('（小雪的手放在碎石上，碎石發出微弱的光。）', '……還有最後一點力量。', '蒼真，我要把它帶下去。黃泉的門，要用這個關上。'), Q.xue() >= 4 ? say('小雪', '不管發生什麼，你都會在我旁邊吧？') : say('小雪', '……走吧。')] },
      { t: 'kill', map: 'W_R11_02', at: 'center', n: 8, foes: ['skel', 'skelred', 'skelgun'], text: '沿著返程崖徑突破亡者', elite: '黃泉醜女' }] });
  Q.add({ id: 'c11_m4', ch: 11, main: true, after: 'c11_m3', title: '黃泉之門', desc: '門後，有一位女神在等。', reward: { exp: 260 },
    steps: [{ t: 'goto', map: 'W_R11_05', text: '前往黃泉之門', lines: [say('伊邪那美', '（一位白衣的女神，被黑色的藤蔓纏住半身。）……你來了。新的器。'), say('伊邪那美', '我是上上一代的器。……不，是最初的器。'), say('伊邪那美', '我撐不住了。大禍津日的污穢，已經爬到我的心。'), say('伊邪那美', '來——淨化我。在我變成怪物之前。')] }] });
  Q.add({ id: 'c11_s_relic', ch: 11, title: '上一代巫女的遺物', desc: '神社後山的地底，埋著一個古老的匣子。', reward: { exp: 420 },
    giver: { map: 'hub_shrine', at: 'archive_stand', u: 'n_t_human_elder', name: '茂兵衛爺', need: () => F().ch11, lines: [say('茂兵衛爺', '老夫在舊冊的夾層裡找到一張地圖。'), say('茂兵衛爺', '後山的封印石下，埋著上一代巫女的遺物。')] },
    steps: [{ t: 'look', map: 'Q_field_seal_forest', at: 'center', dx: 120, label: '匣子', text: '在後山挖出匣子', lines: [say('蒼真', '（匣子裡是一支白色的花簪，和一封信。）'), say('蒼真', '「給下一個雪：不要當器。當你自己。」'), ...雪('……')] }] });
  Q.add({ id: 'c11_s_souls', ch: 11, title: '迷途的亡魂', desc: '城裡的亡魂找不到路。', reward: { gold: 400, exp: 420 },
    giver: { map: 'hub_city', at: 'center', dx: -220, dy: 30, u: 'n_hoan', name: '蓬庵', need: () => D('c11_m1'), lines: [say('蓬庵', '黃泉的門開了，城裡多了很多……找不到路的人。'), say('蓬庵', '老夫治得了病，治不了這個。神社的人，拜託了。')] },
    steps: [{ t: 'kill', map: 'hub_city', at: 'center', n: 5, foes: ['onryo', 'aoonryo'], text: '淨化迷途的亡魂' },
      { t: 'talk', map: 'hub_city', at: 'center', dx: -220, dy: 30, u: 'n_hoan', name: '蓬庵', text: '回報蓬庵', lines: [say('蓬庵', '……他們走了。'), say('蓬庵', '老夫看見一個孩子對我揮手。是三十年前沒救回來的那個。')] }] });
  Q.add({ id: 'c11_s_yokai', ch: 11, title: '城東守門', desc: '妖怪們想守住城的入口。', reward: { gold: 360, exp: 400 },
    giver: { map: 'hub_city', at: 'east_arrival', dx: -260, u: 'n_t_fox_elder', name: '狐族長者', need: () => D('c11_m1') && (F().foxFriend || F().kappaFriend || F().oniFriend), lines: [say('狐族長者', '人類守城西，我們妖怪守城東。'), say('狐族長者', '蒼真，陪我們撐過這一波。')] },
    steps: [{ t: 'hold', map: 'hub_city', at: 'east_arrival', dx: -200, sec: 45, waves: 3, n: 4, foes: ['skel', 'onryo'], text: '和妖怪們一起守住城東', label: '城東' }] });
  Q.add({ id: 'c11_after', ch: 11, main: true, postBoss: true, silent: true, title: '後日談・黃泉', need: () => F().boss_W_R11_05, reward: { exp: 360 },
    steps: [{ t: 'cut', map: 'W_R11_05', lines: () => [say('伊邪那美', '（藤蔓散去，女神的身影變得透明。）……謝謝。'), say('伊邪那美', '孩子。我把我剩下的時間給你。'), say('伊邪那美', '「器歸無」……那是我寫的。可是，我寫錯了。'), say('伊邪那美', '器不必歸無。只要有人願意分擔——人也好，妖也好。'),
      Q.bond() >= 2 ? say('伊邪那美', '你身邊有很多妖怪的味道。……很好。') : say('伊邪那美', '……你身邊，妖怪的味道太少了。'), ...雪('（小雪的手，不再透明了。）')] }] });

  /* ======================= 第十二章　立約 ======================= */
  Q.add({ id: 'c12_m1', ch: 12, main: true, title: '斷權鳥居', desc: '最後的路上，和每位夥伴說說話。', reward: { exp: 500, gold: 400 }, need: () => F().ch12,
    steps: [{ t: 'gather', map: 'W_R12_01', text: '和夥伴們說話', spots: [
      { at: 'west_arrival', dx: 140, label: '白丸', lines: [...丸('我一開始就說了，風的味道不對。', '……現在也不對。可是我不怕了。')] },
      { at: 'center', dx: -80, label: '葛葉・颯', lines: () => [say('葛葉', '狐族的燈，借你照路。'), D('c9_s_hayate') ? say('颯', '師父沒救成的人，我替他救。') : say('颯', '……走吧。')] },
      { at: 'east_arrival', dx: -160, label: '汐音・茨木', lines: () => [D('c10_s_shion') ? say('汐音', '娘在海裡等我。我要回去告訴她，我也做到了。') : say('汐音', '……我會守住小雪。'), G.PARTY && G.PARTY.joined && G.PARTY.joined('ibaraki') ? say('茨木', '道摩的帳，今天算清。') : say('蒼真', '（你想起沒有跟來的茨木。）')] }] }] });
  Q.add({ id: 'c12_m2', ch: 12, main: true, after: 'c12_m1', title: '全境動員', desc: '請各地的朋友前來助陣。', reward: { exp: 500, gold: 400 },
    steps: [{ t: 'talk', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', text: '請河童長者助陣', lines: () => [F().kappaFriend ? say('河童長者', '恩人的事，就是河童的事！') : say('河童長者', '……哼。看在河的份上，幫你一次。')] },
      { t: 'talk', map: 'W_R03_05', at: 'center', u: 'n_t_fox_elder', name: '狐族長者', text: '請狐族長者助陣', lines: [say('狐族長者', '九尾大人說，狐族全員出陣。')] },
      { t: 'talk', map: 'W_R04_04', at: 'center', u: 'n_t_tengu_elder', name: '天狗長者', text: '請天狗長者助陣', lines: [say('天狗長者', '天上的風，會替你們開道。')] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 300, u: 'n_t_oni_veteran', name: '鬼鍛冶權六', text: '請鬼鍛冶權六助陣', lines: () => [F().oniFriend ? say('鬼鍛冶權六', '鬼族的刀，磨好了。酒吞大人也在山下等你。') : say('鬼鍛冶權六', '鬼族……還在猶豫。我一個人跟你去。')] }] });
  Q.add({ id: 'c12_m3', ch: 12, main: true, after: 'c12_m2', title: '鎮災社群', desc: '收回散落的寶珠之力。', reward: { exp: 520, gold: 420 },
    steps: [{ t: 'hold', map: 'W_R12_03', at: 'center', sec: 50, waves: 4, n: 5, foes: ['doma_archer', 'doma_ritualist', 'doma_shield_soldier'], text: '守住鎮災社，讓小雪收回寶珠之力', label: '鎮災社', lines: [...雪('給我一點時間……我要把散掉的力量收回來。')] }] });
  Q.add({ id: 'c12_m4', ch: 12, main: true, after: 'c12_m3', title: '立約殿', desc: '道摩在立約殿等著。', reward: { exp: 300 },
    steps: [{ t: 'goto', map: 'W_R12_04', text: '前往立約殿', lines: () => [say('道摩', '來了。'), say('道摩', '把器交給我。我會成為新的封印。她……可以活下去。'), Q.xue() >= 5 ? say('小雪', '道摩。……三百年前的雪，不會希望你這樣做。') : say('小雪', '（小雪沒有說話，只是緊緊握住你的手。）'), say('道摩', '不要叫那個名字！'), ...蒼('一起找第三條路。不需要任何人消失。'), say('道摩', '……天真。那就讓我看看，你的天真有多硬。')] },
      ] });
  Q.add({ id: 'c12_m5', ch: 12, main: true, after: 'c12_m4', title: '終焉高台', desc: '大禍津日醒了。', reward: { exp: 300 }, need: () => F().boss_W_R12_04,
    steps: [{ t: 'goto', map: 'W_R12_06', text: '前往終焉高台', lines: () => [say('道摩', '（被打倒的道摩，看著天空。）……原來，你們真的能做到。'), say('道摩', '大禍津日已經醒了。去吧。……替我，跟雪說聲對不起。'), ...雪('（高台上，黑色的天空裂開一道縫。）……來了。')] }] });
  Q.add({ id: 'c12_end', ch: 12, main: true, postBoss: true, silent: true, title: '結局', need: () => F().boss_W_R12_06, reward: {},
    steps: [{ t: 'cut', map: 'W_R12_06', lines: () => {
      const bond = Q.bond(), xue = Q.xue(), heart = ['c9_s_hayate', 'c10_s_shion'].filter(D).length + (C('c6_confess') === 'confess' ? 1 : 0);
      const end = xue >= 6 && bond >= 2 && heart >= 2 ? 'true' : bond <= -2 ? 'storm' : 'nameless';
      G.SAVE.data.flags.ending = end; G.SAVE.markDirty();
      if (end === 'true') return [say('伊邪那美', '（光中傳來女神的聲音。）……你們找到了。第三條路。'), ...雪('寶珠的力量……分成了好多份。', '人、妖、神……每個人都拿了一點。'), say('狐族長者', '狐族的燈，亮著。'), say('河童長者', '河，流著。'), say('天狗長者', '風，吹著。'), ...雪('蒼真。我還在。……我是小雪。'), say('蒼真', '（她伸出手。那隻手，溫暖而實在。）'), say('', '—— 真結局・第三條路 ——')];
      if (end === 'storm') return [say('蒼真', '（大禍津日倒下了。可是天空沒有放晴，而是下起了暴雨。）'), ...雪('封印……少了妖怪們的那一份。', '我得留下來。'), say('蒼真', '小雪！'), ...雪('……謝謝你。這一路，很開心。'), say('', '—— 結局・暴雨歸來 ——')];
      return [say('蒼真', '（大禍津日倒下了。天亮了。）'), ...雪('封印……修好了。', '可是我，好像有一點點不見了。'), ...雪('沒關係。我會在神社，一直守著大家。'), say('蒼真', '（小雪留在神社，成為新的鎮守。人們漸漸忘了她的名字，只記得神社裡，有一位溫柔的守護者。）'), say('', '—— 結局・無名的守護者 ——')]; } }],
    done() { setTimeout(() => G.MAIN.end(), 1500); } });
  Q.add({ id: 'c12_s_kota', ch: 12, title: '小太的成年禮', desc: '小太長大了。', reward: { exp: 400 },
    giver: { map: 'hub_city', at: 'gate', dx: -120, u: 'n_toma', name: '冬馬', need: () => D('c8_s_kota') && F().ch12, lines: [say('冬馬', '小太說，要在出陣前，讓你看看他的劍。')] },
    steps: [{ t: 'talk', map: 'W_R01_01', at: 'home_stand', dx: 60, u: 'n_renta', name: '小太', text: '回藥路聚落看小太的劍', lines: [say('小太', '蒼真哥哥，看好了！'), say('蒼真', '（小太的劍，又直又穩。）'), say('小太', '……我要守住村子。你們，一定要回來喔。')] }] });
  Q.add({ id: 'c12_s_yoshitsune', ch: 12, title: '義經的道別', desc: '牛若丸想在決戰前和你比一場。', reward: { exp: 500, item: [13, 4] },
    giver: { map: 'W_R07_03', at: 'center', u: 'n_kozueha', name: '牛若丸', need: () => F().ushiwaka && F().ch12, lines: [say('牛若丸', '要去打最後一仗了？'), say('牛若丸', '來，跟我比一場。贏了，我就把我的劍法教給你。')] },
    steps: [{ t: 'kill', map: 'Q_gojo_bridge_duel', at: 'center', n: 1, foes: ['kengo'], elite: '牛若丸', eliteSub: '「讓我看看你的劍！」', text: '和牛若丸比劍' },
      { t: 'talk', map: 'Q_gojo_bridge_duel', at: 'center', u: 'n_kozueha', name: '牛若丸', text: '和牛若丸說話', lines: [say('牛若丸', '哈哈！輸了輸了！'), say('牛若丸', '……回來的時候，再陪我比一場。說好了。')] }] });
})();
