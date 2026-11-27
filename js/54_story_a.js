/* ==========================================================================
 * 神諭之地 重製版 — 54_story_a.js
 * Version : r3.147.0  (2026-11-27)　r3.147.0：提示文字改成玩家用語
 * 舊版    : r3.11.0  (2026-11-14)
 * 變更    : r3.11.0 新增。第一～四章：主線任務鏈（封印門條件）、抉擇與後果、支線、頭目委託、回訪。
 *           第一章主線沿用 06_story_ch1 的劇本；這裡補支線、委託與後日談。
 * 依賴    : 53_quest（G.QST）、52_hub。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, say = Q.say, act = Q.act, F = () => G.SAVE.data.flags, C = k => Q.choice(k);
  const T = (who, ...ls) => ls.map(l => say(who, l));
  const 蒼 = (...l) => T('蒼真', ...l), 雪 = (...l) => T('小雪', ...l), 丸 = (...l) => T('白丸', ...l);

  /* ======================= 第一章 ======================= */
  Q.add({ id: 'c1_s_porridge', ch: 1, title: '阿松的粥', desc: '替阿松撿回灶邊用的柴火。', reward: { gold: 60, exp: 40 },
    giver: { map: 'W_R01_01', at: 'home_stand', dx: 40, u: 'n_p_kinu', name: '阿絹', need: () => F().matsu, lines: [
      say('阿絹', '阿松姐一直守著灶，柴都燒完了。小太回來的時候，總要有一碗熱粥吧？'), say('阿絹', '竹林那邊有倒下的枯竹，能幫我撿三捆嗎？')] },
    need: () => F().matsu,
    steps: [{ t: 'gather', map: 'W_R01_03', text: '撿枯竹', spots: [{ at: 'left_bridgehead', dx: -40, label: '枯竹' }, { at: 'offering_terrace', dx: 60, label: '枯竹' }, { at: 'right_bridgehead', dx: 30, label: '枯竹' }] },
      { t: 'talk', map: 'W_R01_01', at: 'home_stand', dx: 40, u: 'n_p_kinu', name: '阿絹', text: '把柴火交給阿絹', lines: [say('阿絹', '這麼多！謝謝你。'), say('阿絹', '阿松姐嘴上不說，可她每煮一次粥，就往門口看一次。'), ...蒼('……我會把他帶回來的。')] }] });
  Q.add({ id: 'c1_s_ore', ch: 1, title: '鐵心的磨刀石', desc: '鐵心想要古道邊的青石來磨刀。', reward: { gold: 40, exp: 40, item: [1, 1] },
    giver: { map: 'W_R01_01', at: 'mill_stand', dx: -50, u: 'n_sakubei', name: '朔兵衛', need: () => F().smith, lines: [
      say('朔兵衛', '鐵心那傢伙說，給你那把刀還不夠利。'), say('朔兵衛', '竹海舊社後面的青石最細。拿兩塊來，他會替你再磨一次。')] },
    need: () => F().smith,
    steps: [{ t: 'gather', map: 'W_R01_04', text: '找青石', spots: [{ at: 'old_path_stop', label: '青石' }, { at: 'lookout_stop', dx: -40, label: '青石' }] },
      { t: 'talk', map: 'W_R01_01', at: 'mill_stand', dx: -50, u: 'n_sakubei', name: '朔兵衛', text: '把青石交給朔兵衛', lines: [say('朔兵衛', '好石頭。'), say('朔兵衛', '鐵心說：「刀磨得再利，也比不上回頭看一眼的工夫。」……他就愛說這種話。')] }] });
  Q.add({ id: 'c1_s_weasel', ch: 1, title: '受傷的鼬', desc: '杉影古道的草叢裡，有一隻受傷的小鼬。', reward: { exp: 60 },
    giver: { map: 'W_R01_03', at: 'offering_terrace', dx: -80, u: null, name: '草叢', need: () => F().shiro, lines: [
      ...丸('……等等。這裡有血的味道，很小、很輕。'), say('蒼真', '（草叢裡縮著一隻後腳受傷的小鼬，正對你齜牙。）'), ...雪('牠在發抖……蒼真，你身上還有阿松給的飯糰嗎？')] },
    need: () => F().shiro,
    steps: [{ t: 'choice', map: 'W_R01_03', at: 'offering_terrace', dx: -80, name: '小鼬', key: 'c1_weasel', text: '要怎麼對待小鼬？', lines: [say('蒼真', '（小鼬盯著你手上的飯糰。）')],
      opts: [{ label: '把飯糰分給牠', v: 'feed', lines: [say('蒼真', '（小鼬小心地叼走飯糰，一瘸一拐地鑽進竹林。）'), ...丸('牠往風口的方向去了。……那裡是鼬的巢。')] },
        { label: '不理牠，趕路要緊', v: 'leave', lines: [...丸('……也是。找人要緊。')] }] }],
    done() { if (C('c1_weasel') === 'feed') G.UI.toast('（這個選擇會影響之後的頭目戰）'); } });
  Q.add({ id: 'c1_s_herbbox', ch: 1, title: '蓬庵的藥箱', desc: '城裡的醫師蓬庵，藥箱被風吹散了。', reward: { gold: 80, exp: 50, mat: { herb: 3 } },
    giver: { map: 'hub_city', at: 'center', dx: -220, dy: 30, u: 'n_hoan', name: '蓬庵', lines: [
      say('蓬庵', '哎呀呀……一陣怪風，把我的藥材吹得滿街都是。'), say('蓬庵', '退熱草、止血藤、還有一包安神香。年輕人，幫老夫找回來好嗎？')] },
    steps: [{ t: 'gather', map: 'hub_city', text: '找回藥材', spots: [{ at: 'gate', dx: -60, label: '退熱草' }, { at: 'east_arrival', dx: -120, label: '止血藤' }, { at: 'center', dx: 260, dy: -40, label: '安神香' }] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: -220, dy: 30, u: 'n_hoan', name: '蓬庵', text: '把藥材還給蓬庵', lines: [say('蓬庵', '一樣不少！'), say('蓬庵', '那陣風……說來奇怪，像是從山裡一路吹進城的。風裡有哭聲。'), ...雪('……鎌鼬。'), say('蓬庵', '以後受傷了就來找老夫。神社的人，算你便宜。')] }] });
  Q.add({ id: 'c1_s_lost', ch: 1, title: '迷路的柚吉', desc: '城裡的小孩柚吉，追著螢火蟲跑出城了。', reward: { gold: 50, exp: 60 },
    giver: { map: 'hub_city', at: 'west_arrival', dx: 160, u: 'n_umeno', name: '梅乃婆婆', need: () => F().matsu, lines: [
      say('梅乃婆婆', '柚吉那孩子，說要去山裡看螢火蟲，到現在還沒回來……'), say('梅乃婆婆', '他說要去城外溪邊的芒草原，那裡的螢火蟲最多。神社的大人，拜託了。')] },
    steps: [{ t: 'talk', map: 'Q_night_susuki', at: 'center', u: 'n_yuzukichi', name: '柚吉', text: '到月下芒草溪畔找柚吉', lines: [say('柚吉', '哇！嚇我一跳……'), say('柚吉', '我看到好多螢火蟲往竹林飛，可是竹林好黑，我不敢進去。'), ...蒼('天快黑了，跟我回城。'), say('柚吉', '……那你下次帶我去看，好不好？')] },
      { t: 'talk', map: 'hub_city', at: 'west_arrival', dx: 160, u: 'n_umeno', name: '梅乃婆婆', text: '回報梅乃婆婆', lines: [say('梅乃婆婆', '平安就好、平安就好。'), say('梅乃婆婆', '那孩子說，竹林裡的螢火蟲，是在替迷路的人點燈呢。')] }] });
  Q.add({ id: 'c1_b_patrol', ch: 1, boss: true, postBoss: true, title: '鎌鼬的巡山', desc: '鎌鼬三兄弟請你一起巡山，清掉赤鬼殘黨。', reward: { gold: 120, exp: 120, item: [2, 2] },
    giver: { map: 'W_R01_07', at: 'alcove_forecourt', u: null, name: '鎌鼬長兄', need: () => F().nest, lines: [
      say('鎌鼬', '人類。……不，蒼真。'), say('鎌鼬', '我們藏起那孩子，是因為封印裂了，山裡的赤鬼越來越多。'), say('鎌鼬', '你既然來了，就幫我們把山掃乾淨。這座山，人和鼬都要住。')] },
    need: () => F().nest,
    steps: [{ t: 'kill', map: 'W_R01_03', at: 'bridge_center', n: 4, foes: ['akaoni'], text: '清除溪橋的赤鬼' },
      { t: 'kill', map: 'W_R01_04', at: 'road_center', n: 5, foes: ['akaoni'], text: '清除竹海的赤鬼' },
      { t: 'talk', map: 'W_R01_07', at: 'alcove_forecourt', name: '鎌鼬長兄', text: '回報鎌鼬', lines: () => [say('鎌鼬', '風乾淨了。'), C('c1_weasel') === 'feed' ? say('鎌鼬', '……小弟說，那天有個人類給了牠飯糰。原來是你。') : say('鎌鼬', '山裡的事，以後也拜託了。'), say('鎌鼬', '拿著這根羽毛。有風的地方，我們就會知道你在哪裡。')] }] });
  Q.add({ id: 'c1_after', ch: 1, main: true, postBoss: true, silent: true, title: '後日談・回家', need: () => F().nest, reward: { exp: 80 },
    steps: [{ t: 'cut', map: 'W_R01_01', lines: () => [say('阿松', '（阿松緊緊抱著小太。）……傻孩子、傻孩子……'), say('小太', '娘，藥……我拿到了。'),
      ...(F().gather ? [say('五平', '（提著燈籠的村民們圍了上來。）回來了！小太回來了！'), say('阿德婆婆', '今晚大家都來阿松家喝粥！')] : [say('小太', '是蒼真哥哥一個人來找我的。他好厲害。')]),
      ...蒼('……下次要出門，記得跟娘說一聲。'), say('小太', '嗯！')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', u: null, name: '小雪', text: '回神社，向小雪報告', lines: [...雪('辛苦了。……封印石，又裂了一道。', '鎌鼬說得沒錯，這不是第一次，也不會是最後一次。', '蒼真，接下來的路，可能會越來越遠。'), ...蒼('那就一起走。'), ...雪('……嗯。')] }] });

  /* ======================= 第二章 ======================= */
  Q.add({ id: 'c2_m1', ch: 2, main: true, title: '調停兩岸', desc: '東村與西村為了水閘吵得不可開交。', reward: { exp: 150, gold: 100 },
    need: () => F().ch2,
    steps: [{ t: 'talk', map: 'W_R02_01', at: 'center', dx: -80, u: 'n_p_gohei', name: '東村・五平', text: '聽東村代表怎麼說', lines: [
      say('五平', '西村那群人，半夜把水閘拉開，水全往他們田裡流！'), say('五平', '橋一拆，我們連去城裡賣米都不行。這不是河童，是西村請來的妖怪！'), ...蒼('你親眼看見是西村的人？'), say('五平', '……沒有。可除了他們，還有誰？')] },
      { t: 'talk', map: 'T_ashihomura', at: 'center', u: 'n_maho', name: '西村・真穗', text: '到葦穗村，聽西村代表怎麼說', lines: [
        say('真穗', '我們拉水閘？我們的田也淹了一半！'), say('真穗', '是水自己往西邊流的。河道……像是被人在上游動了手腳。'), ...丸('她沒說謊。……河水的味道，從上游就不對了。')] },
      { t: 'look', map: 'W_R02_01', at: 'east_arrival', dx: -100, label: '斷橋邊', text: '調查斷橋', lines: [say('蒼真', '（斷掉的橋柱上，有一圈圈新的麻繩勒痕。）'), ...蒼('河童用的是爪子，不會用繩子。'), ...雪('是人做的。……故意讓兩邊吵起來。')] }] });
  Q.add({ id: 'c2_m2', ch: 2, main: true, after: 'c2_m1', title: '買繩子的人', desc: '有人大量買了麻繩。去城裡問問砂狐。', reward: { exp: 150, gold: 80 },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 200, u: 'n_sagitsune', name: '砂狐', text: '回兩岸城，向行商砂狐打聽', lines: [
      say('砂狐', '麻繩？嘿嘿，這消息可不便宜。'), say('砂狐', '……算了，看在神社的面子上。前幾天有群穿黑衣的人，把城裡的麻繩全買光了。'), say('砂狐', '他們腰上掛著一種黑色的符。我做了二十年生意，沒見過那種符。'), ...雪('黑符……'), say('砂狐', '他們在東海道的關宿落過腳，之後才往共岸去。小心點，那些人身上有屍臭。')] },
      { t: 'talk', map: 'Q_post_seki', at: 'center', dx: -120, u: 'n_t_human_carrier', name: '旅籠的掌櫃', text: '到關宿本陣打聽黑衣人', lines: [say('掌櫃', '黑衣人？前天住了一晚，付的是古錢。'), say('掌櫃', '他們半夜在院子裡燒符，說什麼「水亂則人亂」。天一亮就往共岸去了。'), ...丸('符灰的味道……和斷橋上的一樣。')] },
      { t: 'kill', map: 'W_R02_04', at: 'center', n: 5, foes: ['sanzoku', 'bandit_knife'], elite: '黑符的山賊頭', text: '擊退水閘木橋的黑衣人' },
      { t: 'look', map: 'W_R02_04', at: 'center', dx: 80, label: '掉落的黑符', text: '調查黑符', lines: [say('蒼真', '（黑色的符紙上，用硃砂寫著一個「道」字。）'), ...雪('這筆跡……和後山封印石上的刮痕，是同一個人。'), ...丸('有人在到處拆封印。')] }] });
  Q.add({ id: 'c2_m3', ch: 2, main: true, after: 'c2_m2', title: '上游的封印石', desc: '上游的封印石被移走了。找回它。', reward: { exp: 180, gold: 120 },
    steps: [{ t: 'talk', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', text: '在救田阡陌找到河童', lines: [
      say('河童長者', '人類！……你也是來趕我們走的嗎？'), ...蒼('我是來問橋的事。'), say('河童長者', '橋是我們拆的。不拆，水就會淹進我們的窩。'), say('河童長者', '上游的石頭被人搬走了，河才會亂流。我們找了三天，只找到三塊碎片。'), say('河童長者', '剩下的……被黑衣人藏在田裡。')] },
      { t: 'gather', map: 'W_R02_05', text: '找出被藏起來的封印碎片', spots: [{ at: 'center', dx: -160, label: '翻過的田土' }, { at: 'center', dx: 120, dy: 30, label: '稻草堆' }, { at: 'east_arrival', dx: -140, label: '水溝' }] },
      { t: 'choice', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', key: 'c2_stone', text: '封印石要交給誰？', lines: [
        say('河童長者', '把石頭給我們，我們能讓河回到原本的路。'), say('五平', '（五平趕了過來。）別信妖怪！石頭交給東村，我們自己修閘！'), ...雪('兩邊都想保護自己的家……')],
        opts: [{ label: '交給東村修水閘', v: 'east', lines: [say('五平', '好！這才像話！'), say('河童長者', '……人類，果然只相信人類。'), ...丸('河童生氣了。')] },
          { label: '交給河童導回河道', v: 'kappa', lines: [say('河童長者', '……謝謝你。河會記得的。'), say('五平', '你、你這是幫妖怪！'), ...蒼('河回到原本的路，東村的田也不會再淹。')] }] }] });
  Q.add({ id: 'c2_m4', ch: 2, main: true, after: 'c2_m3', title: '河灣的河童大將', desc: '河灣深處，河童大將被黑符纏住了。', reward: { exp: 100 },
    steps: [{ t: 'goto', map: 'W_R02_06', text: '前往河灣小徑', lines: () => [...丸('前面……有很重的東西在水裡呼吸。'), say('河童長者', '是大將！他的背上……貼著黑符！'),
      C('c2_stone') === 'kappa' ? say('河童長者', '（河童們跟了過來。）大將被那符逼瘋了！撕掉它，我們幫你纏住他！') : say('蒼真', '（河童們沒有跟來。河面上，只有一雙被黑符燒紅的眼睛。）')] }] });
  Q.bossMod.W_R02_06 = () => C('c2_stone') === 'kappa' ? { hp: 0.85, msg: '河童們纏住了河童大將的腳' } : C('c2_stone') === 'east' ? { hp: 1.15, atk: 1.1, msg: '被背叛的怒氣讓河童大將更強了' } : null;
  Q.add({ id: 'c2_s_cow', ch: 2, title: '五平的牛', desc: '五平家的牛在大水後跑丟了。', reward: { gold: 90, exp: 80 },
    giver: { map: 'T_ashihomura', at: 'east_arrival', dx: -120, u: 'n_p_otoku', name: '阿德婆婆', lines: [say('阿德婆婆', '五平那孩子嘴硬，其實最疼他那頭牛。'), say('阿德婆婆', '大水那晚牛跑了，聽說往河堤去了。')] },
    steps: [{ t: 'talk', map: 'W_R02_01', at: 'west_arrival', dx: 200, u: 'n_a_cow', name: '迷路的牛', text: '在河堤找到牛', lines: [say('蒼真', '（牛在河堤邊悠閒地吃草，看到你，哞了一聲。）'), ...丸('牠說：草比較好吃。')] },
      { t: 'talk', map: 'W_R02_01', at: 'center', dx: -80, u: 'n_p_gohei', name: '五平', text: '告訴五平牛在哪裡', lines: () => [say('五平', '牛！我的牛！'), say('五平', '……謝了。'), C('c2_stone') === 'kappa' ? say('五平', '河童的事……我會再想想。') : say('五平', '水閘修好了，以後牛也不會再被沖走。')] }] });
  Q.add({ id: 'c2_s_box', ch: 2, title: '水閘下的古箱', desc: '水閘退水後，露出一個古老的木箱。', reward: { exp: 100, mat: { jade: 1 } },
    giver: { map: 'W_R02_04', at: 'west_arrival', dx: 140, u: 'n_makinosuke', name: '槇之介', need: () => Q.isDone('c2_m2'), lines: [say('槇之介', '你看，閘底下卡著一個箱子。上面的鎖……刻的是神社的紋。')] },
    steps: [{ t: 'look', map: 'W_R02_04', at: 'center', dx: -120, label: '古箱', text: '打開古箱', lines: [say('蒼真', '（箱子裡是一卷被水泡爛的古約，只剩最後一行字還看得清。）'), say('蒼真', '「器者，承珠之重，以身為鎖。」'), ...雪('……器？'), ...蒼('先帶回去，給文也看看。')] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: -60, dy: -60, u: 'n_fumiya', name: '文也', text: '把古約交給文也', lines: [say('文也', '這是……古約的殘卷！'), say('文也', '「器」是古時候對鎮守巫女的稱呼。可「以身為鎖」……我得再查查。'), say('文也', '這卷我先收著。其他的部分，說不定散在別的地方。')] }] });
  Q.add({ id: 'c2_s_song', ch: 2, title: '渡船夫的歌', desc: '渡船夫說，河上的老歌能讓河水安靜。', reward: { gold: 70, exp: 70 },
    giver: { map: 'W_R02_01', at: 'east_arrival', dx: -60, u: 'n_sohachi', name: '渡船夫・宗八', need: () => Q.isDone('c2_m1'), lines: [say('宗八', '我爺爺說，以前河鬧脾氣的時候，船夫會唱一首歌給它聽。'), say('宗八', '歌詞我忘了一半。村裡的老人，或許還記得。')] },
    steps: [{ t: 'talk', map: 'T_ashihomura', at: 'center', dx: 120, u: 'n_p_otoku', name: '阿德婆婆', text: '向村裡的老人問歌詞', lines: [say('阿德婆婆', '那首歌啊……「河啊河，你從山上來，要往海裡去，路上別帶走孩子」。'), say('阿德婆婆', '以前每個孩子都會唱。現在……沒人唱了。')] },
      { t: 'talk', map: 'W_R02_01', at: 'east_arrival', dx: -60, u: 'n_sohachi', name: '渡船夫・宗八', text: '把歌詞告訴宗八', lines: [say('宗八', '對、對，就是這首！'), say('宗八', '（宗八在船頭低聲唱起來。河面上，忽然泛起一圈一圈的漣漪。）'), ...丸('……河在聽。')] }] });
  Q.add({ id: 'c2_b_mud', ch: 2, boss: true, postBoss: true, title: '河童的清淤', desc: '河童長者請你幫忙清掉堵塞河道的泥妖。', reward: { gold: 150, exp: 150, mat: { jade: 2 } },
    giver: { map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', need: () => F().boss_W_R02_06, lines: () => [C('c2_stone') === 'kappa' ? say('河童長者', '恩人！河道是回來了，可上游沖下來一堆泥妖。') : say('河童長者', '……你還敢來？哼。算了，河道塞住，人類的田也會淹。'), say('河童長者', '幫我把牠們清掉吧。')] },
    steps: [{ t: 'kill', map: 'W_R02_05', at: 'center', n: 6, foes: ['aokappa', 'akakappa'], text: '清除泥妖' },
      { t: 'talk', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', text: '回報河童長者', lines: [say('河童長者', '乾淨了！'), say('河童長者', '以後到城裡的河邊，找河童的親戚。我們會給你好東西。')] }],
    done() { F().kappaFriend = 1; } });
  Q.add({ id: 'c2_after', ch: 2, main: true, postBoss: true, silent: true, title: '後日談・兩岸', need: () => F().boss_W_R02_06, reward: { exp: 100 },
    steps: [{ t: 'cut', map: 'W_R02_01', lines: () => C('c2_stone') === 'kappa' ? [say('五平', '……河童把河道導回去了。我的田，一滴水都沒淹。'), say('真穗', '五平，橋……我們一起修吧。'), say('五平', '哼。……嗯。')] : [say('五平', '水閘修好了！東村的田保住了！'), say('真穗', '（真穗遠遠看著，沒有說話。）'), ...雪('河童搬走了。……西村的田，下一場雨還是會淹。')] },
      { t: 'cut', map: 'W_R02_01', lines: [say('汐音', '（河邊，一個穿著巫女服的少女向你跑來。）你就是修好河的人？'), say('汐音', '我叫汐音，是共岸的見習巫女。我娘……也是。'), say('汐音', '河的哭聲停了。可是我聽到，海那邊還在哭。'), say('汐音', '讓我跟你們一起走吧。我會治傷，也聽得懂水說的話。'), act(() => Q.join('shion'))] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '回神社，向小雪報告', lines: [...雪('黑符上的「道」……我想起來了。', '神社的古冊裡記載過，一位很久以前離開神社的陰陽師——道摩。', '如果真是他……他要的，大概不只是封印。')] }] });

  /* ======================= 第三章 ======================= */
  Q.add({ id: 'c3_m1', ch: 3, main: true, title: '迎親隊', desc: '護送狐族的迎親隊走過狐路。', reward: { exp: 200, gold: 120 }, need: () => F().ch3,
    steps: [{ t: 'talk', map: 'W_R03_01', at: 'center', u: 'n_t_fox_elder', name: '狐族長者', text: '和迎親隊會合', lines: [say('狐族長者', '隊伍裡有十二隻狐，可老身數了三次，都是十三。'), say('狐族長者', '多出來的那個，混在隊伍裡。我分不出來。'), ...丸('交給我。……味道不對的，我聞得出來。')] },
      { t: 'kill', map: 'W_R03_03', at: 'center', n: 5, foes: ['kitsunebi', 'yokyubi'], text: '擊退襲擊隊伍的狐火', escort: { u: 'n_t_fox_elder', name: '狐族長者' } },
      { t: 'talk', map: 'W_R03_04', at: 'center', dx: -100, u: 'n_hanasumi', name: '花澄', text: '在婚列迎賓廳找花澄', lines: [say('花澄', '我是來替狐嫁祭跳舞的。'), say('花澄', '……可是新娘大人，從進門到現在，一次都沒有眨眼。'), ...雪('沒有眨眼……')] }] });
  Q.add({ id: 'c3_m2', ch: 3, main: true, after: 'c3_m1', title: '沒有影子的新娘', desc: '新娘似乎不是狐。', reward: { exp: 200, gold: 100 },
    steps: [{ t: 'gather', map: 'W_R03_04', text: '查證新娘的破綻', spots: [{ at: 'center', dx: 80, label: '燈籠下', lines: [say('蒼真', '（燈籠下，新娘站過的地方……沒有影子。）')] }, { at: 'west_arrival', dx: 120, label: '茶杯', lines: [say('蒼真', '（她的茶杯一滴都沒動過，杯底黏著一點黑色的紙屑。）')] }, { at: 'east_arrival', dx: -100, label: '喜帕', lines: [say('蒼真', '（喜帕上沾著淡淡的墨味。）'), ...雪('是式神。用紙做的。')] }] },
      { t: 'choice', map: 'W_R03_04', at: 'center', dx: -100, u: 'n_t_fox_elder', name: '狐族長者', key: 'c3_bride', text: '要揭穿假新娘嗎？', lines: [say('狐族長者', '……老身猜到了。真正的新娘，大概被藏起來了。'), say('葛葉', '（一個紅衣的狐巫女從屏風後走出。）現在揭穿，真新娘會有危險。可是不揭穿……'), ...蒼('跟著她，就能找到藏人的地方。')],
        opts: [{ label: '當場揭穿', v: 'reveal', lines: [say('蒼真', '（你一刀劃開新娘的袖子。紙片四散，一隻黑色的式神尖叫著逃走。）'), say('葛葉', '……快追！')] },
          { label: '將計就計，跟蹤她', v: 'follow', lines: [say('葛葉', '我用狐火在她身上做了記號。今晚，她會回到主人那裡。'), say('狐族長者', '……老身就信你們一次。')] }] }] });
  Q.add({ id: 'c3_m3', ch: 3, main: true, after: 'c3_m2', title: '契約鳥居', desc: '找出藏著真新娘的鳥居。', reward: { exp: 220, gold: 140 },
    steps: [{ t: 'cut', map: 'W_R03_05', lines: () => C('c3_bride') === 'follow' ? [say('葛葉', '式神進了狐社……她在鳥居後面燒了一張符。'), say('蒼真', '（燒剩的符紙上寫著：「器在神社，珠在十二處，取之。」）'), ...雪('……這是寫給誰的？'), say('葛葉', '給她的主人。道摩。')] : [say('葛葉', '式神逃進狐社就不見了。只留下一股墨味。'), ...丸('往鳥居坂去了。')] },
      { t: 'kill', map: 'Q_night_rice', at: 'center', n: 5, foes: ['kitsunebi', 'yokyubi'], elite: '式神的護衛', text: '夜裡到月下金稻田，截下式神的護衛' },
      { t: 'gather', map: 'W_R03_07', text: '從鳥居中找出真的三座', spots: [{ at: 'west_arrival', dx: 160, label: '鳥居（一）' }, { at: 'center', label: '鳥居（二）' }, { at: 'east_arrival', dx: -160, label: '鳥居（三）' }] }] });
  Q.add({ id: 'c3_m4', ch: 3, main: true, after: 'c3_m3', title: '九尾的考驗', desc: '鳥居深處，九尾在等。', reward: { exp: 100 },
    steps: [{ t: 'talk', map: 'W_R03_07', at: 'center', dx: -80, u: 'n_t_fox_elder', name: '狐族長者', text: '在鳥居前與狐族長者會合', lines: [say('狐族長者', '真新娘就在裡面。可是守門的，是我族的老祖宗——九尾大人。'), say('狐族長者', '九尾大人不相信人類。要過去……就得讓她看看你的本事。'), say('葛葉', '我跟你一起去。這是我族的事。')] }],
    done() { Q.join('kuzuha'); } });
  Q.bossMod.W_R03_07 = () => C('c3_bride') === 'reveal' ? { hp: 0.85, msg: '九尾的分身少了一半' } : C('c3_bride') === 'follow' ? { hp: 1.1, msg: '九尾察覺了你的試探' } : null;
  Q.add({ id: 'c3_s_scarecrow', ch: 3, title: '會走路的稻草人', desc: '稻架農家的稻草人，晚上會自己走動。', reward: { gold: 100, exp: 90 },
    giver: { map: 'W_R03_03', at: 'west_arrival', dx: 140, u: 'n_maho', name: '農婦', lines: [say('農婦', '我家的稻草人，每天早上都換了位置。'), say('農婦', '我先生說是狐狸惡作劇，可我覺得……它在找什麼。')] },
    steps: [{ t: 'gather', map: 'W_R03_03', text: '跟著稻草人的腳印', spots: [{ at: 'center', dx: -80, label: '腳印' }, { at: 'center', dx: 140, label: '腳印' }, { at: 'east_arrival', dx: -120, label: '稻草人' }] },
      { t: 'talk', map: 'W_R03_03', at: 'west_arrival', dx: 140, u: 'n_maho', name: '農婦', text: '告訴農婦真相', lines: [say('蒼真', '稻草人底下埋著一隻小狐的鈴鐺。它每天晚上都在找主人。'), say('農婦', '……是那隻常來偷米的小狐吧。牠被大水沖走了。'), say('農婦', '我替它立個小墳。稻草人……就讓它繼續守著吧。')] }] });
  Q.add({ id: 'c3_s_dance', ch: 3, title: '狐嫁祭的舞', desc: '花澄想在祭典上跳完整的狐舞。', reward: { gold: 120, exp: 100, mat: { cloth: 3 } },
    giver: { map: 'hub_city', at: 'center', dx: 120, dy: -50, u: 'n_hanasumi', name: '花澄', need: () => Q.isDone('c3_m1'), lines: [say('花澄', '狐舞的最後一段，只有狐族的人會跳。'), say('花澄', '你能幫我問問狐族長者，最後一段是什麼樣子嗎？')] },
    steps: [{ t: 'talk', map: 'W_R03_01', at: 'center', u: 'n_t_fox_elder', name: '狐族長者', text: '向狐族長者請教', lines: [say('狐族長者', '最後一段……是新娘回頭看娘家的那一眼。'), say('狐族長者', '舞跳得再好，那一眼沒有不捨，就不是狐舞。')] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 120, dy: -50, u: 'n_hanasumi', name: '花澄', text: '回城告訴花澄', lines: [say('花澄', '……回頭看娘家的那一眼。'), say('花澄', '我懂了。謝謝你。祭典那天，你一定要來看。')] }] });
  Q.add({ id: 'c3_s_kota', ch: 3, title: '小太的賀禮', desc: '小太想送狐族新娘一份賀禮。', reward: { exp: 90 },
    giver: { map: 'W_R01_01', at: 'home_stand', dx: 60, u: 'n_renta', name: '小太', need: () => Q.isDone('c3_m1'), lines: [say('小太', '蒼真哥哥！聽說狐狸要嫁女兒？'), say('小太', '我想送她這個——我自己雕的竹蜻蜓。上次鎌鼬救了我，狐狸也是妖怪的朋友吧？')] },
    steps: [{ t: 'talk', map: 'W_R03_04', at: 'center', dx: 100, u: 'n_t_fox_elder', name: '狐族長者', text: '把竹蜻蜓交給狐族', lines: [say('狐族長者', '人類的孩子……送給狐的賀禮？'), say('狐族長者', '（長者把竹蜻蜓收進懷裡，笑了。）告訴那孩子，狐族記住他了。')] }] });
  Q.add({ id: 'c3_s_medicine', ch: 3, title: '北線送藥', desc: '蓬庵要把藥送到杉並木驛站。', reward: { gold: 140, exp: 160, mat: { herb: 3 } },
    giver: { map: 'hub_city', at: 'center', dx: -220, dy: 30, u: 'n_hoan', name: '蓬庵', need: () => F().ch3, lines: [Q.say('蓬庵', '杉並木驛站有人染了風寒。'), Q.say('蓬庵', '路上的杉林古道最近不太平，年輕人，幫老夫送一趟。')] },
    steps: [{ t: 'kill', map: 'Q_road_cedar', at: 'center', n: 5, foes: ['sanzoku', 'bandit_knife'], text: '清除朝霧杉林古道的山賊' },
      { t: 'talk', map: 'Q_post_nikko', at: 'center', dx: 100, u: 'n_fuyuno', name: '驛站的老闆娘', text: '把藥送到杉並木驛站', lines: [Q.say('老闆娘', '蓬庵大夫的藥！太好了！'), Q.say('老闆娘', '最近往北的客人，都說杉影金稻那邊夜裡有狐火。你們小心。')] }] });
  Q.add({ id: 'c3_b_gift', ch: 3, boss: true, postBoss: true, title: '九尾的回禮', desc: '九尾託你把回禮送到兩岸城與共岸。', reward: { gold: 180, exp: 180, item: [3, 2] },
    giver: { map: 'W_R03_05', at: 'center', u: 'n_t_fox_elder', name: '狐族長者', need: () => F().boss_W_R03_07, lines: [say('狐族長者', '九尾大人說，這次欠了人類一份情。'), say('狐族長者', '這兩盒回禮，一盒給城裡的景綱，一盒給共岸的河童。狐族的禮數，不能少。')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'gate', dx: 40, u: 'n_kagetsuna', name: '景綱', text: '把回禮送到景綱手上', lines: [say('景綱', '狐族的禮？……我當城代十年，第一次收到。'), say('景綱', '替我謝謝他們。……人和妖，也許真的能好好相處。')] },
      { t: 'talk', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', text: '把回禮送給河童長者', lines: [say('河童長者', '狐狸送禮給河童？天要下紅雨了。'), say('河童長者', '……收下了。下次狐狸過河，我們不收過路費。')] }],
    done() { F().foxFriend = 1; } });

  /* ======================= 第四章 ======================= */
  Q.add({ id: 'c4_m1', ch: 4, main: true, title: '受困的工人', desc: '雷原的工棚裡，還有工人沒逃出來。', reward: { exp: 240, gold: 150 }, need: () => F().ch4,
    steps: [{ t: 'talk', map: 'W_R04_01', at: 'center', u: 'n_p_heihachi', name: '平八', text: '在運鐵崖道找到倖存者', lines: [say('平八', '你、你是城裡來的？'), say('平八', '井打穿的那天，地底下噴出雷，工棚整個燒起來。還有四個人困在裡面！'), say('颯', '雷脈亂竄，我飛不進去。只能用走的了。')] },
      { t: 'kill', map: 'W_R04_03', at: 'center', n: 6, foes: ['enemy_raiju', 'muraiju'], text: '清除工棚周圍的雷獸幼獸' },
      { t: 'gather', map: 'W_R04_03', text: '救出困住的工人', spots: [{ at: 'west_arrival', dx: 160, label: '倒塌的棚子' }, { at: 'center', dx: -120, label: '木箱下' }, { at: 'center', dx: 160, label: '燒焦的門' }, { at: 'east_arrival', dx: -140, label: '水桶後' }] }] });
  Q.add({ id: 'c4_m2', ch: 4, main: true, after: 'c4_m1', title: '鎮雷符', desc: '天狗長者說，只有修驗者的鎮雷符能壓住雷脈。', reward: { exp: 240, gold: 120 },
    steps: [{ t: 'talk', map: 'W_R04_04', at: 'center', u: 'n_t_tengu_elder', name: '天狗長者', text: '在雷原井場見天狗長者', lines: [say('天狗長者', '颯，信送到了？很好。'), say('天狗長者', '雷脈是古代立約時釘下的。井打穿了，釘子鬆了。'), say('天狗長者', '要釘回去，得有鎮雷符。神社的僧人澄岳，懂得畫。')] },
      { t: 'talk', map: 'hub_shrine', at: 'hall_stand', dx: 80, u: 'n_chogaku', name: '澄岳', text: '回神社請澄岳畫符', lines: [say('澄岳', '鎮雷符？……三十年沒人求過了。'), say('澄岳', '貧僧可以畫，但需要雷原的「雷紋石」做墨。'), ...雪('雷紋石……我在夢裡見過。在深山的赤壁上，有一座小祠。')] },
      { t: 'kill', map: 'Q_mountain_cedar', at: 'center', n: 5, foes: ['muraiju', 'enemy_raiju'], text: '穿過巨杉霧嶺' },
      { t: 'look', map: 'Q_mountain_redcliff', at: 'center', label: '赤壁的雷紋石', text: '在赤壁雲棧的小祠旁找雷紋石', lines: [say('蒼真', '（石頭表面浮著細細的雷紋，摸上去，指尖發麻。）'), ...丸('這東西……在叫。')] },
      { t: 'talk', map: 'hub_shrine', at: 'hall_stand', dx: 80, u: 'n_chogaku', name: '澄岳', text: '把雷紋石交給澄岳', lines: [say('澄岳', '（澄岳磨墨、落筆，一張符一口氣寫成。）'), say('澄岳', '拿去。記住——符只能壓，不能消。真正的問題，是那口井。')] }] });
  Q.add({ id: 'c4_m3', ch: 4, main: true, after: 'c4_m2', title: '三個雷脈閥', desc: '在雷鳴高原貼符，關掉雷脈閥。', reward: { exp: 260, gold: 160 },
    steps: [{ t: 'hold', map: 'W_R04_05', at: 'center', sec: 45, waves: 3, n: 4, foes: ['enemy_raiju', 'naruikazuchi'], text: '守住鎮雷符', label: '雷脈閥', lines: [say('颯', '符貼上了！可是雷獸全被引過來了！'), ...蒼('撐住，等符燒完。')] },
      { t: 'choice', map: 'W_R04_05', at: 'center', dx: -100, u: 'n_p_heihachi', name: '平八', key: 'c4_well', text: '雷井要怎麼處理？', lines: [say('平八', '符壓住了。可是那口井……'), say('平八', '封了井，礦場就沒了。我們幾百個人，要靠什麼吃飯？'), say('天狗長者', '不封，雷脈遲早再破。下一次，就不只是工棚。')],
        opts: [{ label: '封井', v: 'seal', lines: [say('平八', '……好吧。命比飯碗重要。'), say('天狗長者', '明智的選擇。')] },
          { label: '把雷脈改道，礦場繼續開', v: 'divert', lines: [say('天狗長者', '改道？……可以做，但雷會往別處去。'), say('平八', '只要能開工，我們什麼都願意做！')] }] }] });
  Q.add({ id: 'c4_m4', ch: 4, main: true, after: 'c4_m3', title: '雷獸', desc: '雷脈的源頭，有一頭發狂的雷獸。', reward: { exp: 100 },
    steps: [{ t: 'goto', map: 'W_R04_07', text: '前往海崖神池', lines: [say('颯', '……那不是普通的雷獸。'), say('颯', '牠身上釘著七根鐵釘。是誰把牠釘在這裡的？'), ...雪('古代的人。……為了封住雷。')] }],
    done() { Q.join('hayate'); } });
  Q.bossMod.W_R04_07 = () => C('c4_well') === 'seal' ? { hp: 0.9, msg: '封井後，雷獸的雷弱了' } : C('c4_well') === 'divert' ? { atk: 1.15, msg: '改道的雷脈全灌進了雷獸身上' } : null;
  Q.add({ id: 'c4_s_letter', ch: 4, title: '平八的家書', desc: '平八想把平安的消息帶給城裡的家人。', reward: { gold: 100, exp: 120 },
    giver: { map: 'W_R04_01', at: 'center', u: 'n_p_heihachi', name: '平八', need: () => Q.isDone('c4_m1'), lines: [say('平八', '我娘在城裡等我。她一定以為我死了。'), say('平八', '能不能……幫我把這封信送給她？')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'east_arrival', dx: -160, u: 'n_p_sayuri', name: '小百合', text: '把信送到城裡', lines: [say('小百合', '這是……平八的字！'), say('小百合', '（她把信貼在胸口，哭了出來。）'), say('小百合', '謝謝你……我這就去神社，替他點一盞平安燈。')] }] });
  Q.add({ id: 'c4_s_feather', ch: 4, title: '白色的羽毛', desc: '颯在找一根白色的羽毛。', reward: { exp: 140 },
    giver: { map: 'W_R04_04', at: 'center', dx: 100, u: 'n_t_tengu_elder', name: '天狗長者', need: () => Q.isDone('c4_m2'), lines: [say('天狗長者', '颯在找一根白羽，說是他師父留下的。'), say('天狗長者', '那孩子嘴上不說，其實每天都在找。……聽說，羽毛落在了神社的後山。')] },
    steps: [{ t: 'look', map: 'Q_field_seal_forest', at: 'center', label: '白羽', text: '到神社後山找白羽', lines: [say('蒼真', '（一根比雪還白的長羽，插在封印石旁的土裡。）'), say('颯', '……找到了。'), say('颯', '師父說，羽毛落在哪裡，那裡就是該守的地方。……原來是這裡。')] }] });
  Q.add({ id: 'c4_s_valley', ch: 4, title: '回音試煉', desc: '天狗長者想看看你在谷底能撐多久。', reward: { gold: 160, exp: 200, item: [4, 2] },
    giver: { map: 'W_R04_04', at: 'center', dx: -120, u: 'n_t_tengu_elder', name: '天狗長者', need: () => Q.isDone('c4_m2'), lines: [Q.say('天狗長者', '深山裡有一座谷底盆地，聲音會回來三次。'), Q.say('天狗長者', '天狗的孩子都在那裡修行。你也去試試。')] },
    steps: [{ t: 'hold', map: 'Q_mountain_valley', at: 'center', sec: 40, waves: 3, n: 4, foes: ['muraiju', 'naruikazuchi'], text: '在谷底撐過三波', label: '谷底中央' },
      { t: 'talk', map: 'W_R04_04', at: 'center', dx: -120, u: 'n_t_tengu_elder', name: '天狗長者', text: '回報天狗長者', lines: [Q.say('天狗長者', '撐過了？'), Q.say('天狗長者', '……颯第一次去，哭著跑回來。這話你別告訴他。')] }] });
  Q.add({ id: 'c4_s_tools', ch: 4, title: '岩藏的鐵料', desc: '城裡的鍛冶岩藏等著雷原的鐵。', reward: { gold: 160, exp: 100, item: [4, 2] },
    giver: { map: 'hub_city', at: 'center', dx: 300, u: 'n_p_iwakura', name: '岩藏', need: () => Q.isDone('c4_m3'), lines: () => [say('岩藏', '雷原的事我聽說了。'), C('c4_well') === 'divert' ? say('岩藏', '礦場還開著？太好了！幫我去崖道把那批鐵料扛回來！') : say('岩藏', '礦場封了……不過崖道上還留著最後一批鐵料。幫我扛回來吧。')] },
    steps: [{ t: 'gather', map: 'W_R04_01', text: '收集鐵料', spots: [{ at: 'west_arrival', dx: 160, label: '鐵料' }, { at: 'center', dx: 120, label: '鐵料' }] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 300, u: 'n_p_iwakura', name: '岩藏', text: '把鐵料交給岩藏', lines: () => [say('岩藏', '好鐵！'), C('c4_well') === 'divert' ? say('岩藏', '帶著雷的鐵……這能打出會放電的刀。下次來，我給你看。') : say('岩藏', '最後一批了。以後，得從別的地方找鐵了。')] }],
    done() { if (C('c4_well') === 'divert') F().thunderSmith = 1; } });
  Q.add({ id: 'c4_b_guard', ch: 4, boss: true, postBoss: true, title: '雷原巡守', desc: '雷獸請你一起巡視雷原，收集散落的雷紋石。', reward: { gold: 200, exp: 220, mat: { jade: 2 } },
    giver: { map: 'W_R04_07', at: 'west_arrival', dx: 160, u: null, name: '雷獸', need: () => F().boss_W_R04_07, lines: [say('雷獸', '（拔掉鐵釘的雷獸，安靜地伏在神池邊。）'), say('雷獸', '……人類。你拔了釘子。'), say('雷獸', '雷原上散了幾顆我的雷紋石。撿回來，我替你守這片地。')] },
    steps: [{ t: 'gather', map: 'W_R04_05', text: '撿回雷紋石', spots: [{ at: 'west_arrival', dx: 140, label: '雷紋石' }, { at: 'center', dx: -60, label: '雷紋石' }, { at: 'east_arrival', dx: -160, label: '雷紋石' }] },
      { t: 'talk', map: 'W_R04_07', at: 'west_arrival', dx: 160, name: '雷獸', text: '把雷紋石還給雷獸', lines: [say('雷獸', '……三顆。還差一顆，在天上。'), say('雷獸', '那一顆，被雷神大人帶走了。你若有一天上了天，替我問一聲好。')] }] });
})();
