/* =====================================================================
 * 153_side3.js
 * 版本    : r3.141.0  (2026-11-27)　r3.141.0：最後一隻式神改成紙鶴（文字＋任務點畫紙鶴 shiki_crane）
 * 舊版    : r3.135.0  (2026-11-27)
 * 說明    : 劇情補完・支線第 3 批：副本頭目故事 4 線、隱藏夥伴心事 3 條、夥伴同行副本對話。
 *           副本頭目線（通關該副本後開放）：
 *             dg_fuji  弁慶的薙刀（義經）——三段薙刀收齊，抉擇交給弁慶／埋在富士；獎勵「八艘跳」：閃身／瞬步後 1 秒內可免冷卻再用 2 次。
 *             dg_ezo   爐火與熊靈（爐火女神）——說服村民（選錯可重來）；獎勵「爐火加護」：倒下時原地站起一次（每 10 分鐘）。
 *             dg_sky   斬蛇劍的古約（須佐之男）——試劍（70% 血，打掉一半收手）；獎勵「八雲斬」：頭目戰中頭目第一次降到一半血時，八道斬擊打全場。
 *             dg_izumo 道摩的舊式神（安倍晴明）——古都・夜之町，最後一隻式神放走／打散；放走＝道摩被奪碎片 −1。
 *           隱藏夥伴心事（入隊後自動開始）：
 *             pt_yorimitsu 童子切的重量——向酒吞道歉＝「酒吞的葫蘆」（頭目戰每 90 秒酒吞橫掃）；不道歉＝賴光對鬼族／頭目傷害 +25%。
 *             pt_takemi    雷神的誓——守住小雷獸 30 秒＝小雷獸跟隨（每 8 秒落雷）＋建御雷傷害 +30%。
 *             pt_enno      前鬼與後鬼——打贏前鬼後鬼＝役小角傷害 +15%。
 *           同行對話：帶相關夥伴進富士／天空／出雲／蝦夷，入口、頭目開戰、頭目倒下各一段；頭目開戰與半血對夥伴喊話。
 * 依賴    : 53_quest（fn 步驟）、26_boss、150_main2（切磋保護 enc._thr）、47_partner（joined）
 * ===================================================================== */
(function () {
  const Q = G.QST, B = G.BOSS, SC = G.SC, H = G.H; if (!Q || !B) return;
  const F = () => G.SAVE.data.flags, C = k => Q.choice(k), D = id => Q.isDone(id), say = (who, text) => ({ who, text }), nar = t => say('', t), act = fn => ({ do: fn });
  const qc = () => (G.SAVE.data.qc = G.SAVE.data.qc || {}), later = (n, f) => G.STORY.later(n, f);
  const joined = id => !!F()['join_' + id], inParty = id => !!(G.PARTY && G.PARTY.list && G.PARTY.list.some(p => p && p.id === id));

  /* 共用：在目前地圖開一場頭目戰；stop＝打到剩多少比例就收手 */
  let FT = null;
  function fight(id, map, o, done) { const Df = B.DEF[id]; Promise.all([B.load(id), G.ASSET.enemies((Df && Df.foes) || [])]).then(() => { if (SC.id !== map) return;
    const p = SC.snap(H.x + 240, H.y, 'open', 300) || [H.x + 200, H.y];
    const enc = B.start(id, { x: p[0], y: p[1], lv: (SC.def.lv || 1) + (o.lv || 2), sub: o.sub, onWin: () => later(10, done) });
    if (enc) { if (o.name) enc.name = o.name; for (const u of enc.units) u.hp = Math.round(u.hpMax * (o.hp || 1)); if (o.stop) { enc._thr = enc.units[0].hpMax * o.stop; FT = { enc, msg: o.msg }; } } }); }
  function ftStep() { const f = FT, enc = f.enc; if (!enc || B.enc !== enc) { FT = null; return; } if (enc.done) return; const u = enc.units[0];
    if (u && u.hp <= enc._thr) { for (const x of enc.units) x.hp = Math.max(x.hp, 1); enc.done = true; enc.winT = 0; B.tg.length = 0; B.zones.length = 0; B.proj.length = 0; G.UI.banner(f.msg[0], f.msg[1]); FT = null; } }

  /* ================= 副本頭目線 ================= */
  /* --- 富士：弁慶的薙刀 --- */
  Q.add({ id: 'dg_fuji', ch: 7, boss: true, postBoss: true, title: '弁慶的薙刀', desc: '富士山頂，義經的身影還站在鳥居下。', reward: { exp: 600, gold: 500 },
    giver: { map: 'D_FUJI_04', at: 'center', dx: -160, name: '源義經', need: () => !!F().boss_D_FUJI_04,
      lines: [say('源義經', '……你贏了。比橋上那次，還要乾脆。'), say('源義經', '我想拜託你一件事。'), say('源義經', '弁慶最後一戰，是站在衣川的橋上，替我擋下所有的箭。他到死都沒有倒下。'),
        say('源義經', '他的薙刀碎成了三段，被人帶走、賣掉，散在各地的橋邊。'), say('源義經', '我想把它拼回來。……那是他這輩子，唯一沒有交出去的一把刀。')] },
    steps: [{ t: 'look', map: 'W_R02_04', at: 'center', dx: 140, label: '橋墩下的木柄', text: '在水閘木橋找薙刀的柄', lines: [nar('（橋墩下卡著一截很粗的木柄，上面纏著褪色的白布，布上寫著密密麻麻的經文。）'), say('小雪', '這麼粗的柄……要多大的手才握得住呀。')] },
      { t: 'look', map: 'W_R06_02', at: 'center', dx: -140, label: '押運橋的刀身', text: '在雙軌押運橋找薙刀的刀身', lines: [nar('（押運的貨箱底下，壓著一片彎曲的刀身。刃口全是缺口，像是擋過幾百支箭。）'), say('白丸', '……每一個缺口，都是替別人擋下的。')] },
      { t: 'look', map: 'W_R08_04', at: 'center', dx: 160, label: '宿場的石突', text: '在山路宿場找薙刀的石突', lines: [nar('（宿場的老闆拿它來壓醃菜缸。你說明來意，他二話不說就交了出來。）'), say('宿場的老闆', '……原來是弁慶大人的？那我壓了二十年的醃菜，可真是好福氣。')] },
      { t: 'choice', map: 'D_FUJI_04', at: 'center', dx: -160, name: '源義經', key: 'dg_naginata', text: '把薙刀帶回富士山頂', lines: [nar('（三段薙刀拼在一起，竟然嚴絲合縫。）'), say('源義經', '……一模一樣。'),
        say('源義經', '你覺得，這把刀該去哪裡？弁慶現在在五條大橋上，等著跟人比劍。可是這把刀，也是他的墓。')],
        opts: [{ label: '交還給弁慶', v: 'give', lines: [say('源義經', '……也好。他一定會哭的，那個大個子。'), say('源義經', '替我告訴他：這次，換我在橋頭等他。')] },
          { label: '埋在富士山頂，陪著你', v: 'bury', lines: [nar('（你們在鳥居下挖了一個淺坑，把薙刀放進去。）'), say('源義經', '……謝謝。'), say('源義經', '這樣，我每天都能看見它。弁慶那傢伙，就讓他在橋上好好活著吧。')] }] },
      { t: 'talk', map: 'Q_gojo_bridge_duel', at: 'center', name: '武藏坊弁慶', text: '把薙刀交給五條大橋的弁慶', skip: () => C('dg_naginata') === 'bury', lines: [say('弁慶', '這、這是……'),
        nar('（弁慶接過薙刀，那雙比門還寬的手在發抖。）'), say('弁慶', '少主……少主讓你帶來的？'), say('蒼真', '他說，這次換他在橋頭等你。'),
        say('弁慶', '（弁慶跪在橋上，哭得像個孩子。）……嗚、嗚哇——！'), say('小雪', '（小雪悄悄遞上手帕。手帕太小了，弁慶用它擤了一下鼻子。）')] }],
    done() { F().hasso = 1; G.UI.banner('習得：八艘跳', '閃身／瞬步之後 1 秒內，可免冷卻再接 2 次'); } });
  { const qy = Q.by.c12_s_yoshitsune, t = qy && qy.steps.find(s => s.t === 'talk'); if (t) { const L0 = t.lines; t.lines = () => { const L = (typeof L0 === 'function' ? L0() : L0 || []).slice(), v = C('dg_naginata');
      if (v === 'give') L.push(say('弁慶', '少主！薙刀我磨好了！這次換我跟你一起站在橋上！'), say('源義經', '……吵死了。站好。')); else if (v === 'bury') L.push(say('源義經', '富士山頂那把刀，替我守著。……我走了，劍士。'));
      return L; }; } }

  /* --- 蝦夷：爐火與熊靈 --- */
  const EZO = [['熊靈會吃人，村子必須趕走牠。', 'bad'], ['熊靈一直守著爐火的火種。村子的火，本來就是牠給的。', 'ok'], ['女神說沒問題，大家照做就好。', 'bad']];
  function ezoTalk(q, done) { const go = () => G.DLG.start([say('村長', '……你要我們讓那頭熊進村？'), say('村長', '給我一個理由。一個能讓全村的人晚上睡得著的理由。'),
      { choice: EZO.map(([label, v]) => ({ label, then: v === 'ok' ? [act(() => { qc().dg_ezo = 'ok'; })] : [act(() => { qc().dg_ezo = ''; }), say('村長', '……這說服不了任何人。'), say('小雪', '（小雪小聲說。）蒼真，想想熊靈在雪原上做了什麼？')] })) }],
    () => { if (qc().dg_ezo !== 'ok') return later(20, go); G.DLG.start([say('村長', '……火種？'), say('爐火女神', '是真的。一百年前那場大雪，村子的爐全滅了。是熊靈從山裡叼著一塊還在燒的木頭，走了三天三夜送來的。'),
      say('爐火女神', '牠的背上，到現在還有那次燒傷的疤。'), say('村長', '……我爺爺說過，那年冬天有一頭熊救了村子。我一直以為是故事。'),
      nar('（熊靈慢慢走到村口，低下頭。村長猶豫了很久，伸手摸了摸牠的鼻子。）'), say('村長', '……進來吧。爐火旁邊，有你的位置。'), say('爐火女神', '謝謝你，人類。……這份火，我借你一點。')], done); }); go(); }
  Q.add({ id: 'dg_ezo', ch: 9, boss: true, postBoss: true, title: '爐火與熊靈', desc: '雪原的村子不讓爐火女神與熊靈靠近。', reward: { exp: 600, gold: 500 },
    giver: { map: 'D_EZO_04', at: 'center', dx: -140, name: '爐火女神', need: () => !!F().boss_D_EZO_04,
      lines: [say('爐火女神', '……打完了，就別急著走。'), say('爐火女神', '山下的村子，爐火快滅了。我想去點，可是村民一看到我身邊的熊靈，就拿起柴刀。'),
        say('爐火女神', '熊靈不會說人話。我又……不太會說人話。'), say('爐火女神', '你會吧？幫我們說說看。')] },
    steps: [{ t: 'look', map: 'D_EZO_03', at: 'center', dx: 120, label: '雪地裡的熊靈', text: '在寒風雪原找熊靈', lines: [nar('（一頭比房子還大的白熊趴在雪裡，背上有一大片舊的燒傷疤。牠看到你，只是慢慢眨了眨眼。）'),
        say('白丸', '……牠很溫和。比很多人類都溫和。'), say('小雪', '牠的背……是被火燒傷的嗎？')] },
      { t: 'fn', map: 'D_EZO_01', text: '在雪原入口說服村長', run: ezoTalk }],
    done() { F().hearth = 1; G.UI.banner('爐火加護', '倒下時原地站起一次（每 10 分鐘）'); } });
  let hearthT = -1e9; const hh0 = G.hurtHero; G.hurtHero = function () { const r = hh0.apply(this, arguments);
    if (H.hp <= 0 && F().hearth && Date.now() - hearthT > 600000) { hearthT = Date.now(); H.hp = Math.round(H.hpMax * 0.4); H.inv = Math.max(H.inv || 0, 120); G.UI.banner('爐火加護', '胸口一陣溫暖——你又站了起來'); }
    return r; };

  /* --- 天空：斬蛇劍的古約 --- */
  Q.add({ id: 'dg_sky', ch: 10, boss: true, postBoss: true, title: '斬蛇劍的古約', desc: '須佐之男說，第六章的古約還沒有修好。', reward: { exp: 650, gold: 520 },
    giver: { map: 'D_SKY_04', at: 'center', dx: -160, name: '須佐之男', need: () => !!F().boss_D_SKY_04 && D('c6_b_sword'),
      lines: [say('須佐之男', '你手上那把斬蛇劍，是雲海展望台的試煉給的吧。'), say('須佐之男', '劍是真的。可是劍上的古約，還缺最後一句。'), say('須佐之男', '去展望台的古約碑看看。然後回來——讓我試試這把劍。')] },
    steps: [{ t: 'look', map: 'W_R06_07', at: 'center', dx: -160, label: '古約碑', text: '到雲海展望台讀古約碑', lines: [nar('（碑上的字被雷劈掉了一半，只剩：「斬蛇之劍，不斬……」）'), say('小雪', '不斬什麼？……後面不見了。'), say('白丸', '答案，大概要從須佐之男嘴裡問出來。')] },
      { t: 'fn', map: 'D_SKY_04', text: '在天空神殿接受須佐之男的試劍', run: (q, done) => G.DLG.start([say('須佐之男', '讀過了？那就拔劍吧。'), say('須佐之男', '我不留手。你也不准留。')], () =>
        fight('susanoo', 'D_SKY_04', { hp: 0.7, stop: 0.35, sub: '試劍', msg: ['須佐之男收劍了', '「夠了。」'] }, () => G.DLG.start([say('須佐之男', '……夠了。'),
          say('須佐之男', '古約的最後一句是：「斬蛇之劍，不斬伏首之蛇。」'), say('須佐之男', '三百年前，我把八岐鎖起來，而不是殺掉牠。因為牠已經低頭了。'),
          say('須佐之男', '你在八岐面前也停手過吧？……所以這把劍，現在才是完整的。'), nar('（斬蛇劍的刀身上，浮現出八道雲紋。）'), say('須佐之男', '那是八雲。用的時候，記得這句話。')], done))) }],
    done() { F().yakumo = 1; G.UI.banner('習得：八雲斬', '頭目戰中，頭目第一次降到一半血時，八道斬擊打全場'); } });

  /* --- 出雲：道摩的舊式神 --- */
  Q.add({ id: 'dg_izumo', ch: 11, boss: true, postBoss: true, title: '道摩的舊式神', desc: '安倍晴明想說一段關於道摩的往事。', reward: { exp: 650, gold: 520 },
    giver: { map: 'D_IZUMO_04', at: 'center', dx: -160, name: '安倍晴明', need: () => !!F().boss_D_IZUMO_04,
      lines: [say('安倍晴明', '你想知道道摩是什麼樣的人嗎？'), say('安倍晴明', '我們是同一個師父教出來的。他比我聰明，比我用功，也比我……心軟。'),
        say('安倍晴明', '他說封印要犧牲一個人，請師父另想辦法。陰陽寮說他妖言惑眾，把他除了名。……那天，我一句話都沒有替他說。'),
        say('安倍晴明', '古都的夜之町，還留著他年輕時養的式神。它們沒有主人了，在街上遊蕩。'), say('安倍晴明', '替我去看看。……該怎麼處理，你決定。')] },
    steps: [{ t: 'kill', map: 'Q_kyoto_night', at: 'center', n: 2, foes: ['kuroonmyo'], text: '在古都・夜之町平息遊蕩的式神' },
      { t: 'choice', map: 'Q_kyoto_night', at: 'center', dx: 160, name: '最後一隻式神', key: 'dg_shiki', text: '面對最後一隻式神', lines: [nar('（最後一隻式神是一隻白色的紙鶴。它沒有攻擊你，只是叼著一張紙，放在你腳邊。）'),
        nar('（紙上是很工整的字：「今日替河童的孩子治了病。他笑了。術是用來讓大家活下去的。——道滿」）'), say('小雪', '道滿……是道摩以前的名字？'), say('小雪', '這隻式神……一直帶著他的日記。')],
        opts: [{ label: '放它走', v: 'spare', lines: [nar('（紙鶴繞著你飛了一圈，往夜空飛去。方向是立約殿。）'), say('白丸', '……它要去找它的主人。'), say('小雪', '希望道摩先生……還記得自己寫過這句話。')] },
          { label: '打散它', v: 'destroy', lines: [nar('（紙鶴化成灰，日記也跟著燒掉了。）'), say('蒼真', '……留著，只會被道摩拿去用。'), say('小雪', '……嗯。')] }] }],
    done() { if (C('dg_shiki') === 'spare') { F().domaLost = (F().domaLost || 0) - 1; G.UI.banner('道摩的舊式神', '紙鶴飛向立約殿（道摩被奪的碎片 −1）'); } } });

  /* ================= 隱藏夥伴心事 ================= */
  Q.add({ id: 'pt_yorimitsu', ch: 8, title: '童子切的重量', desc: '源賴光說，有一筆舊帳想親自去算。', reward: { exp: 600, gold: 400 },
    need: () => joined('yorimitsu') && !!F().boss_W_R08_07,
    steps: [{ t: 'choice', map: 'W_R08_05', at: 'center', dx: 120, name: '酒吞童子', key: 'pt_yori', text: '帶源賴光到鬼宴會場見酒吞', lines: [say('酒吞童子', '……源賴光。'), say('源賴光', '酒吞童子。'),
        nar('（兩個人隔著篝火對望。周圍的鬼族一下子全安靜了。）'), say('酒吞童子', '三百年前，你帶著四天王上山，在酒裡下了毒，砍了我的頭。'), say('源賴光', '……是。'),
        say('源賴光', '那時候，我相信鬼就是要斬的。童子切砍下去的時候，我一點都沒有猶豫。'), say('源賴光', '（賴光轉向你。）蒼真，這一刀……我該道歉嗎？')],
      opts: [{ label: '道歉吧', v: 'sorry', lines: [say('源賴光', '（賴光把童子切插在地上，低下頭。）……對不起。'), say('酒吞童子', '……哈。'), say('酒吞童子', '我等這句話，等了三百年。'),
          say('酒吞童子', '拿去。（酒吞丟過來一個紅色的葫蘆。）裡面是我的酒。打不過的時候喝一口，我就來幫你砍。'), say('源賴光', '……這個人情，我會還。')] },
        { label: '不必道歉，那是你們各自的戰爭', v: 'pride', lines: [say('源賴光', '……也是。道歉，太輕了。'), say('酒吞童子', '哼。至少你沒說謊。'),
          say('酒吞童子', '那就繼續當斬鬼的刀吧。只不過——這一次，給我砍對的東西。'), nar('（童子切的刀身，發出一聲低低的鳴響。）')] }] }],
    done() { if (C('pt_yori') === 'sorry') { F().gourd = 1; G.UI.banner('酒吞的葫蘆', '頭目戰中每 90 秒，酒吞出手橫掃'); } else { F().doujigiri = 1; G.UI.banner('童子切覺醒', '源賴光對鬼族與頭目傷害 +25%'); } } });
  Q.add({ id: 'pt_takemi', ch: 4, title: '雷神的誓', desc: '建御雷說，雷原上有一隻小雷獸很怕他。', reward: { exp: 600, gold: 400 },
    need: () => joined('takemikazuchi') && !!F().boss_W_R04_07,
    steps: [{ t: 'cut', map: 'W_R04_05', lines: [nar('（一隻只有貓那麼大的小雷獸，躲在岩石後面，全身的毛都豎起來了。）'), say('建御雷', '……就是牠。我一靠近，牠就發抖。'),
        say('建御雷', '雷獸王是我的舊識。我把牠跟雷脈一起封起來的時候，這孩子還在蛋裡。'), say('建御雷', '牠大概記得，是我讓牠的爹再也沒回來。'),
        say('小雪', '建御雷大人……'), say('建御雷', '雷妖們要來搶牠了。牠身上的雷，還很純。……蒼真，幫我守住牠。不用讓牠喜歡我。')] },
      { t: 'hold', map: 'W_R04_05', at: 'center', sec: 30, waves: 3, n: 3, text: '守住小雷獸 30 秒' },
      { t: 'cut', map: 'W_R04_05', lines: [nar('（雷妖散了。小雷獸從岩石後面探出頭，看看你，又看看建御雷。）'), nar('（然後牠慢慢走過去，用頭蹭了蹭建御雷的腳。）'),
        say('建御雷', '……'), say('建御雷', '（建御雷蹲下來，小心翼翼地伸出手。他的手指在發抖。）'), say('建御雷', '……蒼真。我發過誓，雷要用來守人。'), say('建御雷', '這孩子，我也守。')] }],
    done() { F().raiPet = 1; G.UI.banner('小雷獸加入', '每 8 秒對附近敵人落雷；建御雷傷害 +30%'); } });
  Q.add({ id: 'pt_enno', ch: 6, title: '前鬼與後鬼', desc: '役小角的前鬼和後鬼吵架離家出走了。', reward: { exp: 600, gold: 400 },
    need: () => joined('enno') && !!F().ch6,
    steps: [{ t: 'cut', map: 'W_R06_02', lines: [say('役小角', '……真是的，那兩個笨蛋。'), say('役小角', '前鬼說後鬼搶他的飯糰，後鬼說前鬼打呼太大聲。吵到最後，兩個都跑了。'),
        say('役小角', '我收服他們三百年了，還是第一次這樣。'), say('小雪', '他們在那裡！……啊，打起來了。'), say('役小角', '蒼真，幫我把他們打醒。打醒了，他們就會聽話了。……大概。')] },
      { t: 'fn', map: 'W_R06_02', text: '在雙軌押運橋打醒前鬼與後鬼', run: (q, done) => fight('mb_izumo3', 'W_R06_02', { hp: 0.8, sub: '離家出走的式鬼' }, () => G.DLG.start([
        say('前鬼', '……痛痛痛。'), say('後鬼', '都是你害的！'), say('役小角', '（役小角走過去，一人敲了一下頭。）都閉嘴。'),
        say('役小角', '三百年前，你們兩個是山裡的惡鬼，搶村子的糧、拆村子的橋。'), say('役小角', '我把你們打趴的時候，前鬼說「要殺就殺」，後鬼說「殺我就好，放過他」。'),
        say('役小角', '……所以我才沒殺你們。'), say('前鬼', '……那個，飯糰我分你一半。'), say('後鬼', '……我打呼，會小聲一點。'), say('役小角', '這樣才對。回家了。')], done)) }],
    done() { F().ennoHeart = 1; G.UI.banner('前鬼與後鬼', '役小角傷害 +15%'); } });

  /* ================= 效果 ================= */
  /* 傷害：賴光／建御雷／役小角 */
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const P = opt && opt.party; if (P && typeof P === 'object') {
      if (P.id === 'yorimitsu' && F().doujigiri && e && (e.boss || e.bb || /oni|shuten|ibaraki/.test(e.type || e.actor || ''))) mult *= 1.25;
      if (P.id === 'takemikazuchi' && F().raiPet) mult *= 1.3; if (P.id === 'enno' && F().ennoHeart) mult *= 1.15; }
    return dm0.call(this, e, mult, big, fc, opt); };
  /* 八艘跳：閃身／瞬步後 1 秒內免冷卻再接 2 次 */
  let hs = { n: 0, t: 0, last: null };
  function hassoStep() { if (!F().hasso) return; const a = H.act, lb = H.lastBody;
    if (a && (a.kind === 'dodge' || a.kind === 'dash') && a !== hs.last) { hs.last = a; if (G.t - hs.t > 60) hs.n = 0; hs.t = G.t; if (hs.n < 2) { hs.n++; if (lb) H.cd['m:' + lb] = 0; } else if (hs.n === 2) { hs.n = 3; } } }
  /* 八雲斬、酒吞的葫蘆、小雷獸 */
  const HH = () => G.HERO_H || 90, ring = (x, y, col) => { if (G.VX && G.VX.ring) G.VX.ring({ x, y, r1: 1.6, life: 20, col }); };
  function hitAll(k, col) { for (const e of G.E) { if (e.st === 'dead' || e.ally) continue; if (e.boss || e.bb) { const d = Math.round(e.hpMax * k); e.hp = Math.max(1, e.hp - d); e.flash = 8; G.NUMS.push({ x: e.x, y: e.y - HH() * 1.2, v: d, t: 0 }); } else G.damageOni(e, 2, true, false, { rune: 1 }); ring(e.x, e.y, col); } }
  let pet = 0, gd = 0;
  function fxStep() { const enc = B.enc;
    if (F().yakumo && enc && !enc.done && !enc._yk) { const u = enc.units[0]; if (u && u.hp < u.hpMax * 0.5) { enc._yk = 1; G.UI.banner('八雲斬', '八道斬擊劈開了雲'); let i = 0; const go = () => { if (i++ >= 8) return; hitAll(0.01, '200,230,255'); SC.shake = 5; later(8, go); }; go(); } }
    if (F().gourd && inParty('yorimitsu') && enc && !enc.done) { if (++gd >= 5400) { gd = 0; G.UI.toast('酒吞：「喝了我的酒，就得讓我砍一刀！」'); hitAll(0.03, '255,140,90'); SC.shake = 7; } } else gd = Math.min(gd, 4800);
    if (F().raiPet && G.E.length && ++pet >= 480) { let b = null, bd = 400; for (const e of G.E) { if (e.st === 'dead' || e.ally) continue; const d = Math.hypot(e.x - H.x, e.y - H.y); if (d < bd) { bd = d; b = e; } }
      if (b) { pet = 0; G.damageOni(b, 1.2, false, false, { rune: 1 }); ring(b.x, b.y, '170,210,255'); } } }

  /* ================= 夥伴同行副本對話 ================= */
  const TALK = {
    D_FUJI: { who: 'yorimitsu', enter: [say('源賴光', '富士……義經公最後的地方。'), say('源賴光', '同樣是源氏的武士，我一直敬重他。可是他的結局——我不認同。'), say('蒼真', '為什麼？'), say('源賴光', '他太相信自己的兄長了。武士的忠義，不該是一個人背著走到死。')],
      start: [say('源義經', '源氏的刀……賴光公？'), say('源賴光', '九郎。三百年不見，你還是一樣愛逞強。')], half: '源義經：「賴光公，你也覺得我傻吧！」', end: [say('源義經', '……賴光公。忠義，到底是什麼？'), say('源賴光', '是活著回去，告訴主公你做了什麼。'), say('源賴光', '……你沒有做到。所以這一次，換我們替你做到。')] },
    D_SKY: { who: 'takemikazuchi', enter: [say('建御雷', '天空的神殿……那傢伙在上面。'), say('建御雷', '三百年前，我奉命討伐出雲。須佐之男擋在我面前，我們打了七天七夜。'), say('建御雷', '……最後誰贏了，我們兩個都不肯說。')],
      start: [say('須佐之男', '建御雷！你這傢伙也來了？'), say('建御雷', '這次分出勝負吧，須佐之男。')], half: '須佐之男：「建御雷！你的雷變軟了！」', end: [say('須佐之男', '……哈。這次，算你們贏。'), say('建御雷', '算「我們」？……也好。'), say('須佐之男', '下次，我們兩個單挑。不准帶人類。')] },
    D_IZUMO: { who: 'enno', enter: [say('役小角', '出雲……陰陽寮的人最愛的地方。'), say('役小角', '晴明那傢伙，修的是陰陽，我修的是山。他用符，我用腳。'), say('役小角', '我們的道不一樣。可是我一直很想知道，他到底怎麼看我。')],
      start: [say('安倍晴明', '役小角……山裡的修驗者，也下山了。'), say('役小角', '晴明。今天我用腳，你用符。看誰先倒。')], half: '安倍晴明：「役小角，你的腳步還是那麼吵。」', end: [say('安倍晴明', '……我輸了。'), say('役小角', '你的符很漂亮。可是太乾淨了，沒有泥土的味道。'), say('安倍晴明', '……你說得對。我一直都只待在乾淨的地方。')] },
    D_EZO: { who: 'enno', enter: [say('役小角', '北方的雪原……我年輕時在這裡修行過一個冬天。'), say('役小角', '那時候差點凍死，是一頭白熊讓我靠著牠睡了三天。'), say('役小角', '……不知道牠還記不記得我。')],
      start: [say('爐火女神', '你身上……有熊靈的味道。'), say('役小角', '是牠救過我。今天打完，我想去見牠。')], half: '爐火女神：「人類，你們為什麼這麼拚命？」', end: [say('爐火女神', '……熊靈說，牠記得你。說你睡覺會說夢話。'), say('役小角', '……那件事，請不要說出去。')] } };
  const BOSSMAP = { yoshitsune: 'D_FUJI', susanoo: 'D_SKY', seimei: 'D_IZUMO', ezo: 'D_EZO' }, said = {};
  const pairs = { D_IZUMO: 'yorimitsu' };   // 出雲另一位相關夥伴：賴光（當年與晴明一起討伐酒吞）
  const PAIR = [say('源賴光', '晴明……當年討伐酒吞，你在山下替我們佈陣。'), say('安倍晴明', '賴光公。這次，換我被你們討伐了。'), say('役小角', '……原來你們兩個認識？'), say('源賴光', '老戰友了。他的符，救過我三次命。')];
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { en0.apply(this, arguments); const k = /^(D_[A-Z]+)_01$/.exec(id || ''); if (!k) return; const t = TALK[k[1]]; if (!t || !inParty(t.who) || said[id]) return;
    said[id] = 1; later(90, () => { if (G.DLG.active() || SC.id !== id) return; const L = t.enter.slice(); if (pairs[k[1]] && inParty(pairs[k[1]])) L.push(...PAIR); G.DLG.start(L); }); };
  if (B.start) { const bs0 = B.start; B.start = function (id) { const enc = bs0.apply(this, arguments); const k = BOSSMAP[id], t = k && TALK[k];
    if (enc && t && inParty(t.who) && SC.id && SC.id.startsWith(k)) { enc._pt = t; later(60, () => { if (B.enc === enc && !G.DLG.active()) G.DLG.start(t.start.slice()); }); } return enc; }; }
  const oe0 = B.onEnd; B.onEnd = function (enc) { if (oe0) oe0.apply(this, arguments); const t = enc && enc._pt; if (t && !enc._spar) later(200, () => { if (!G.DLG.active()) G.DLG.start(t.end.slice()); }); };
  function ptStep() { const enc = B.enc; if (!enc || enc.done || !enc._pt || enc._ph) return; const u = enc.units[0]; if (u && u.hp < u.hpMax * 0.5) { enc._ph = 1; G.UI.toast(enc._pt.half); } }

  const ls0 = G.lootStep; G.lootStep = function () { ls0.apply(this, arguments); if (FT) ftStep(); hassoStep(); fxStep(); ptStep(); };
  /* r3.141.0：最後一隻式神＝紙鶴，飄在任務點上 */
  { const df0 = G.drawFx; G.drawFx = function () { const r = df0.apply(this, arguments);
      try { const VX = G.VX; if (VX && VX.draw2 && SC.id === 'Q_kyoto_night') for (const m of G.QST.marks) if (m.label === '最後一隻式神' && !m.dead && m.x > -999) VX.draw2(G.ctx, 'shiki_crane', Math.floor(G.t / 6) % 4, m.x, m.y - 70 + Math.sin(G.t / 20) * 6, 1.1, { flip: G.H.x < m.x }); } catch (e) {}
      return r; }; }
})();
