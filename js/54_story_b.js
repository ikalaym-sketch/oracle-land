/* ==========================================================================
 * 神諭之地 重製版 — 54_story_b.js
 * Version : r3.130.0  (2026-11-27)　r3.130.0：第 3 章「將計就計」→ 第 5 章葛葉認出符紙筆跡、省略苔石林間坂
 * 舊版    : r3.21.0  （r3.21.0：c8_s_legend 改找渡口時雨；砂狐鹽攤移開渡口）
 * 舊版    : r3.11.0  (2026-11-14)
 * 變更    : r3.11.0 新增。第三～四章後日談；第五～八章主線、抉擇、支線、頭目委託、回訪。
 *           頭目對應：第五章 茨木童子（中途，W_R05_03）→ 鬼王（W_R05_07）；第六章 八岐大蛇；第七章 長壁姬；第八章 酒吞童子。
 * 依賴    : 53_quest（G.QST）、54_story_a。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, say = Q.say, act = Q.act, F = () => G.SAVE.data.flags, C = k => Q.choice(k), D = id => Q.isDone(id);
  const T = (who, ...ls) => ls.map(l => say(who, l));
  const 蒼 = (...l) => T('蒼真', ...l), 雪 = (...l) => T('小雪', ...l), 丸 = (...l) => T('白丸', ...l);

  /* ---------- 第三、四章後日談 ---------- */
  Q.add({ id: 'c3_after', ch: 3, main: true, postBoss: true, silent: true, title: '後日談・狐嫁', need: () => F().boss_W_R03_07, reward: { exp: 150 },
    steps: [{ t: 'cut', map: 'W_R03_04', lines: () => [say('狐族長者', '（真正的新娘換上白無垢，隊伍重新出發。）'), say('花澄', '（花澄在隊伍前跳起狐舞。最後一段，她回頭看了一眼。）'),
      C('c3_bride') === 'follow' ? say('葛葉', '那張符上寫的「器在神社」……蒼真，道摩的目標，是小雪。') : say('葛葉', '式神逃掉了。可是牠的墨味，我記住了。'), ...丸('……')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '回神社，向小雪報告', lines: () => [...雪('九尾大人看著我的時候……說了一句話。', '「可憐的器。」'), C('c3_bride') === 'follow' ? say('蒼真', '（你想起那張符。要告訴她嗎？……你決定先不說。）') : say('蒼真', '別想太多。'), ...雪('……嗯。我沒事。')] }] });
  Q.add({ id: 'c4_after', ch: 4, main: true, postBoss: true, silent: true, title: '後日談・雷原', need: () => F().boss_W_R04_07, reward: { exp: 160 },
    steps: [{ t: 'cut', map: 'W_R04_03', lines: () => C('c4_well') === 'seal' ? [say('平八', '井封了。大家明天就要下山找工作了。'), say('平八', '……可是命保住了。這比什麼都重要。')] : [say('平八', '礦場又能開工了！'), say('天狗長者', '雷往南邊的海崖去了。……人類，你要記得，這份雷，是借來的。')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '回神社，向小雪報告', lines: [...雪('我又做夢了。', '夢裡有很多人站在雷原上，和一個穿白衣的女人立約。', '那個女人……長得跟我一模一樣。'), say('颯', '（颯落在鳥居上。）那是幾百年前的事。天狗長者說，那個女人叫「初代的器」。')] }] });

  /* ======================= 第五章　共灶熄火 ======================= */
  Q.add({ id: 'c5_m1', ch: 5, main: true, title: '熄滅的共灶', desc: '查清楚火種是誰偷的。', reward: { exp: 280, gold: 180 }, need: () => F().ch5,
    steps: [{ t: 'talk', map: 'W_R05_01', at: 'center', u: 'n_fuyuno', name: '冬乃', text: '在共灶街聽村人說明', lines: [say('冬乃', '共灶是我們炭里的命。三十年沒熄過。'), say('冬乃', '那晚守爐的是鬼族的權太，可是……他整晚都在跟我們喝酒。'), say('冬乃', '火熄的時候，他就坐在我旁邊。')] },
      { t: 'gather', map: 'T_kayamori', text: '向長屋的居民問話', spots: [
        { at: 'west_arrival', dx: 160, label: '甚藏', lines: [say('甚藏', '我看到一個穿黑衣的人，子時從灶房出來。'), say('甚藏', '……不對，是丑時。我那時已經喝醉了。')] },
        { at: 'center', dx: -120, label: '千景', lines: [say('千景', '丑時？不可能。丑時我在灶房外收衣服，誰也沒看到。'), say('千景', '子時倒是有人敲過我家的門，說要借火。')] },
        { at: 'center', dx: 140, label: '蓮太', lines: [say('蓮太', '我看到了！黑衣人手上的燈是黑色的火！'), say('蓮太', '他往山門的方向走了。')] },
        { at: 'east_arrival', dx: -150, label: '鈴緒', lines: [say('鈴緒', '黑火？……那是「冥火」。只有陰陽師點得出來。'), say('鈴緒', '這幾天，有人在村外收購炭灰。說是要做墨。')] }] },
      { t: 'choice', map: 'T_kayamori', at: 'center', u: 'n_t_human_guard', name: '巡檢孫六', key: 'c5_truth', text: '要公開真相嗎？', lines: [say('巡檢孫六', '查到什麼了？我這邊可是已經寫好了「鬼族盜火」的文書。'), ...雪('證詞拼起來了——子時有人借火，冥火的燈，往山門走。偷火的是道摩的人。'), say('巡檢孫六', '……可是村子現在需要一個交代。抓錯了人，奉行所的面子往哪擺？'), say('冬乃', '只要火能回來，誰的罪……我們不在乎。')],
        opts: [{ label: '公開真相，放了守爐人', v: 'truth', lines: [say('巡檢孫六', '……哼。好吧，算我錯了。'), say('冬乃', '權太……對不起。'), say('鬼族守爐人', '（被鬆綁的鬼族大漢，對你深深一鞠躬。）')] },
          { label: '先讓守爐人擔下，換村子安寧', v: 'silence', lines: [say('巡檢孫六', '識相。'), say('鬼族守爐人', '（他看著你，什麼都沒說，被帶走了。）'), ...丸('……我不喜歡這樣。')] }] }] });
  Q.add({ id: 'c5_m2', ch: 5, main: true, after: 'c5_m1', title: '雙井的鬼', desc: '偷火的人往山門去了，雙井水橋上有鬼族擋路。', reward: { exp: 260, gold: 160 },
    steps: [{ t: 'goto', map: 'W_R05_03', text: '前往雙井水橋', lines: [...丸('前面有一個很強的鬼。……比我們之前遇到的都強。'), say('茨木', '（橋上站著一個斷了一隻手臂的鬼族女子。）人類。你來得不是時候。'), say('茨木', '我在等偷火的人。你若是他的同夥，就先過我這關。')] }] });
  Q.add({ id: 'c5_m3', ch: 5, main: true, after: 'c5_m2', title: '火種的去向', desc: '茨木說，火種被帶進了爐殿。', reward: { exp: 280, gold: 180 }, need: () => F().boss_W_R05_03,
    steps: [{ t: 'cut', map: 'W_R05_03', lines: () => [say('茨木', '……你不是他的同夥。'), say('茨木', '那個黑衣人，用冥火包著火種，進了爐殿。'), C('c5_truth') === 'truth' ? say('茨木', '你放了權太？……鬼族欠你一次。') : say('茨木', '權太被抓了？……人類，果然還是人類。'), say('茨木', '我們會再見的。')] },
      { t: 'talk', map: 'Q_post_hakone', at: 'center', dx: -160, u: 'n_p_otoku', name: '茶屋婆婆', text: '到箱根甘酒茶屋打聽運火種的人', lines: () => [say('茶屋婆婆', '提著黑燈籠的客人？昨晚來喝過甘酒。'), say('茶屋婆婆', '他說要翻過峠道，往山門去。……那盞燈，一點熱氣都沒有。'),
        ...(C('c3_bride') === 'follow' ? [say('葛葉', '婆婆，那位客人付錢的時候，有沒有留下什麼東西？'), say('茶屋婆婆', '有啊，他拿一張摺起來的紙壓著銅錢。我嫌晦氣，丟進灶裡，結果怎麼燒都燒不起來。'), say('茶屋婆婆', '喏，還在灶邊，你們要就拿去。'),
          say('蒼真', '（紙上的墨跡細細長長，每一筆收尾都往上勾。）'), say('葛葉', '……這個勾法，我看過。'), say('葛葉', '迎親那晚，狐社鳥居後面燒剩的那張符，也是這樣勾的。同一支筆，同一個人。'),
          say('葛葉', '那時候你說先別揭穿，跟著看牠去哪裡。老實說，我心裡有點不服氣，覺得你太慢了。'), say('葛葉', '可是現在想想，要是那晚就把式神打散，我們根本不會認得這個筆跡。'),
          say('蒼真', '偷火種的，跟在狐社動手腳的，是同一夥人。那他的手下會怎麼走？'), say('葛葉', '這種符一路上都要補墨。林間坂又濕又暗，墨會暈開，寫符的人最討厭那種路。'),
          say('葛葉', '他們一定走峠道的乾路，直接上爐殿。我們不用在林子裡追，去爐殿前面堵他們就好。'), say('茶屋婆婆', '……你們這些年輕人，說的話我一句都聽不懂。路上小心啊，甘酒錢下次再算。')] : [])] },
      { t: 'kill', map: 'Q_road_moss', at: 'center', n: 5, foes: ['kasha', 'onichochin'], text: '在苔石林間坂追上運火種的手下', skip: () => C('c3_bride') === 'follow' },
      { t: 'kill', map: 'W_R05_04', at: 'center', n: 6, foes: ['kasha', 'onichochin'], elite: '黑符陰陽師', text: '突破爐殿前庭' },
      { t: 'look', map: 'W_R05_04', at: 'center', dx: 100, label: '冥火的灰', text: '調查冥火的灰', lines: [say('蒼真', '（地上有一圈黑色的灰，灰裡寫著字：「火已送山門，器之爐將成。」）'), ...雪('「器之爐」……'), ...蒼('他們要用炭里的火，煉什麼東西。')] }] });
  Q.add({ id: 'c5_m4', ch: 5, main: true, after: 'c5_m3', title: '山門古鳥居', desc: '火種被帶到了山門。', reward: { exp: 120 },
    steps: [{ t: 'goto', map: 'W_R05_07', text: '前往山門古鳥居', lines: [say('蒼真', '（鳥居下，火種在一座黑色的爐裡燃燒。爐的旁邊，坐著一個巨大的鬼。）'), say('鬼王', '……神社的人。'), say('鬼王', '這把火，是我族的祖先點的。人類拿了三百年，現在，該還了。')] }] });
  Q.bossMod.W_R05_07 = () => C('c5_truth') === 'truth' ? { hp: 0.9, msg: '鬼王知道你放了守爐人，出手猶豫' } : { atk: 1.1, msg: '鬼王怒道：「人類只會找替罪的鬼！」' };   // 第 3 章將計就計的 −10% 在 148_link（直接減血，不算助陣）
  Q.add({ id: 'c5_s_longhouse', ch: 5, title: '長屋的冬天', desc: '沒有火，長屋的老人撐不過冬天。', reward: { gold: 160, exp: 150, mat: { cloth: 2 } },
    giver: { map: 'W_R05_05', at: 'center', u: 'n_p_otoku', name: '阿德婆婆', lines: [say('阿德婆婆', '火還沒回來，長屋裡的老人們冷得睡不著。'), say('阿德婆婆', '能不能幫忙從城裡帶幾床棉被來？')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 200, dy: 40, u: 'n_t_human_townswoman', name: '染布的阿紺', text: '到城裡找阿紺買棉被', lines: [say('阿紺', '炭里要棉被？我這裡剛好有一批。'), say('阿紺', '錢不用給了。我小時候，也是喝共灶的湯長大的。')] },
      { t: 'talk', map: 'W_R05_05', at: 'center', u: 'n_p_otoku', name: '阿德婆婆', text: '把棉被送回長屋', lines: [say('阿德婆婆', '這麼多……'), say('阿德婆婆', '城裡的人，還記得我們啊。')] }] });
  Q.add({ id: 'c5_s_impostor', ch: 5, title: '城裡的假商人', desc: '有人在城裡收購炭灰做墨。', reward: { gold: 200, exp: 180 },
    giver: { map: 'hub_city', at: 'center', dx: 200, u: 'n_sagitsune', name: '砂狐', need: () => D('c5_m1'), lines: [say('砂狐', '收炭灰的那個商人，我盯了他三天。'), say('砂狐', '他每天傍晚都在城東的茶食攤附近晃。你去看看。')] },
    steps: [{ t: 'kill', map: 'hub_city', at: 'east_arrival', dx: -200, n: 3, foes: ['kunoichi', 'kageshinobi'], elite: '假商人（黑符陰陽師）', text: '揭穿假商人' },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 200, u: 'n_sagitsune', name: '砂狐', text: '回報砂狐', lines: [say('砂狐', '果然是道摩的人。'), say('砂狐', '……蒼真，我跟你說實話。我不只是商人，我是狐族派在城裡的耳目。'), say('砂狐', '以後有什麼想打聽的，就來找我。')] }] });
  Q.add({ id: 'c5_s_thunder', ch: 5, title: '雷獸的火', desc: '共灶需要新的火引，雷獸或許能幫忙。', reward: { exp: 160, mat: { jade: 1 } },
    giver: { map: 'W_R05_01', at: 'west_arrival', dx: 160, u: 'n_fuyuno', name: '冬乃', need: () => F().boss_W_R04_07, lines: [say('冬乃', '火種就算拿回來，也燒得很弱。'), say('冬乃', '聽說雷原的雷獸，能點燃任何東西……')] },
    steps: [{ t: 'talk', map: 'W_R04_07', at: 'west_arrival', dx: 160, name: '雷獸', text: '回雷原向雷獸求火', lines: [say('雷獸', '火？……人類真會使喚。'), say('雷獸', '（雷獸輕輕吐出一道雷，落在你手中的炭上。炭，亮了。）'), say('雷獸', '拿去吧。替我向那些孩子問好。')] },
      { t: 'talk', map: 'W_R05_01', at: 'west_arrival', dx: 160, u: 'n_fuyuno', name: '冬乃', text: '把雷火帶回共灶', lines: [say('冬乃', '好亮的火……'), say('冬乃', '這把火，我們會好好守著。')] }] });
  Q.add({ id: 'c5_s_kappacoal', ch: 5, title: '河童要炭', desc: '河童長者說，冬天的河太冷了。', reward: { gold: 120, exp: 120 },
    giver: { map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', need: () => F().ch5 && F().kappaFriend, lines: [say('河童長者', '恩人，今年冬天特別冷。'), say('河童長者', '炭里的炭最好。能幫我們換一些嗎？我們用河裡的寶石換。')] },
    steps: [{ t: 'talk', map: 'W_R05_01', at: 'center', dx: 120, u: 'n_jinzo', name: '甚藏', text: '到炭里換炭', lines: [say('甚藏', '河童要炭？哈哈，河童也會冷啊。'), say('甚藏', '拿去吧。替我跟河童說，下次炭里的孩子去河邊玩，別拉他們的腳。')] },
      { t: 'talk', map: 'W_R02_05', at: 'west_arrival', dx: 120, u: 'n_t_kappa_mentor', name: '河童長者', text: '把炭交給河童長者', lines: [say('河童長者', '暖和！'), say('河童長者', '告訴炭里的人，河童從來不拉孩子的腳。……只拉大人的。')] }] });
  Q.add({ id: 'c5_after', ch: 5, main: true, postBoss: true, silent: true, title: '後日談・火祭', need: () => F().boss_W_R05_07, reward: { exp: 200 },
    steps: [{ t: 'cut', map: 'W_R05_01', lines: () => [say('冬乃', '共灶的火回來了！今晚是火祭！'), C('c5_truth') === 'truth' ? say('鬼族守爐人', '（權太站在灶前，和村人一起添柴。）') : say('冬乃', '……權太沒有回來。灶前，空了一個位置。'), ...丸('火的味道……很暖。')] },
      { t: 'cut', map: 'hub_shrine', lines: [...雪('（深夜，神社外傳來腳步聲。）', '……蒼真，有人來了。很多人。'), say('黑符陰陽師', '把「器」交出來。'), ...蒼('……休想。')] },
      { t: 'hold', map: 'hub_shrine', at: 'center', sec: 40, waves: 3, n: 4, foes: ['kuroonmyo', 'kageshinobi'], text: '守住神社', label: '拜殿前', lines: [...雪('他們的目標是我……蒼真！')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '確認小雪平安', lines: [...雪('……謝謝你。', '他們說的「器之爐」……是要把我放進去煉。', '蒼真，我是不是……很危險的東西？'), ...蒼('妳是小雪。就這樣。')] }] });
  Q.add({ id: 'c5_b_forge', ch: 5, boss: true, postBoss: true, title: '鬼王的爐', desc: '鬼王想用祖先的火，替鬼族重新打一把刀。', reward: { gold: 260, exp: 260, item: [5, 3] },
    giver: { map: 'W_R05_07', at: 'center', u: 'n_t_oni_veteran', name: '鬼鍛冶權六', need: () => F().boss_W_R05_07, lines: [say('鬼鍛冶權六', '我是城裡的鬼鍛冶權六。鬼王大人要我替他打一把刀。'), say('鬼鍛冶權六', '材料在爐殿和山門附近。人類，你肯幫鬼打刀嗎？')] },
    steps: [{ t: 'gather', map: 'W_R05_04', text: '收集打刀材料', spots: [{ at: 'west_arrival', dx: 140, label: '鬼鐵' }, { at: 'center', dx: -100, label: '爐灰' }, { at: 'east_arrival', dx: -140, label: '鬼鐵' }] },
      { t: 'talk', map: 'W_R05_07', at: 'center', u: 'n_t_oni_veteran', name: '鬼鍛冶權六', text: '把材料交給權六', lines: [say('鬼鍛冶權六', '好材料。'), say('鬼鍛冶權六', '刀打好了，鬼王大人說，第一把給你。'), say('鬼鍛冶權六', '以後到兩岸城東邊找我。傳說中的兵器，我也打得出來。')] }],
    done() { F().oniSmith = 1; } });

  /* ======================= 第六章　八岐試煉 ======================= */
  Q.add({ id: 'c6_m1', ch: 6, main: true, title: '散落的古約', desc: '找回被撕散的三卷古約。', reward: { exp: 300, gold: 200 }, need: () => F().ch6,
    steps: [{ t: 'talk', map: 'W_R06_01', at: 'center', u: 'n_chogaku', name: '澄岳', text: '在雲上參道與澄岳會合', lines: [say('澄岳', '須佐之男大人在試煉場等你們。'), say('澄岳', '可是古約少了三卷，試煉場的門開不了。'), say('澄岳', '一卷在書庫。另外兩卷……據說被風吹到了人間。')] },
      { t: 'gather', map: 'W_R06_03', text: '在檔界書庫解開書架機關', spots: [{ at: 'west_arrival', dx: 160, label: '「天」之架' }, { at: 'center', label: '「地」之架' }, { at: 'east_arrival', dx: -160, label: '「人」之架', lines: [say('蒼真', '（書架滑開，露出第一卷古約。）'), say('蒼真', '「八岐者，食立約者之過，以為封。」')] }] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: -60, dy: -60, u: 'n_fumiya', name: '文也', text: '回城找文也（第二卷）', lines: () => [say('文也', '共岸水閘下的那卷，我研究完了！'), say('文也', '那正是古約的第二卷：「器者，承珠之重，以身為鎖。」'), D('c2_s_box') ? say('文也', '還好你當時把它帶回來了。') : say('文也', '……幸好我自己去撈了一趟。差點淹死。')] },
      { t: 'talk', map: 'W_R03_07', at: 'center', dx: -80, u: 'n_t_fox_elder', name: '狐族長者', text: '到狐路的鳥居坂（第三卷）', lines: [say('狐族長者', '第三卷，狐族替神社保管了三百年。'), say('狐族長者', '九尾大人說，該交給「器」的守護者了。'), say('蒼真', '（卷末寫著：「器滿之日，珠成神，器歸無。」）'), ...雪('……器歸無。')] }] });
  Q.add({ id: 'c6_m2', ch: 6, main: true, after: 'c6_m1', title: '關宿的避難者', desc: '道摩引發山崩，旅人被困在山路上。', reward: { exp: 280, gold: 180 },
    steps: [{ t: 'talk', map: 'Q_post_seki', at: 'center', dx: 140, u: 'n_t_human_carrier', name: '挑夫太吉', text: '到關宿本陣找到受困的旅人', lines: [say('太吉', '山崩了！路全斷了，後面還有十幾個人！'), say('太吉', '黑衣人在山上放火符……他們說，是要「斷了器的退路」。')] },
      { t: 'kill', map: 'Q_road_pine', at: 'center', n: 6, foes: ['sohei', 'komaishi'], elite: '黑符的僧兵', text: '護送旅人走松並木古道，擊退放火符的人', escort: { u: 'n_t_human_carrier', name: '挑夫太吉' } },
      { t: 'talk', map: 'hub_city', at: 'west_arrival', dx: 200, u: 'n_t_human_carrier', name: '挑夫太吉', text: '把旅人平安帶回城', lines: [say('太吉', '到了……真的到了。'), say('太吉', '這份恩情，我挑一輩子的擔子也還不完。')] }] });
  Q.add({ id: 'c6_m3', ch: 6, main: true, after: 'c6_m2', title: '承認之心', desc: '八岐吞食立約者的過錯。試煉前，要先面對自己。', reward: { exp: 300, gold: 200 },
    steps: [{ t: 'choice', map: 'W_R06_05', at: 'center', u: 'n_chogaku', name: '澄岳', key: 'c6_confess', text: '在試煉場前，承認一個過錯嗎？', lines: () => [say('澄岳', '試煉場的規矩：進門前，說出你這一路上做錯的一件事。'), say('澄岳', '說了，八岐吞下的「過」就少一分。不說……'),
      C('c5_truth') === 'silence' ? say('蒼真', '（你想起被帶走的權太。）') : C('c2_stone') === 'east' ? say('蒼真', '（你想起搬走的河童。）') : say('蒼真', '（你想起那張沒有告訴小雪的符。）')],
      opts: [{ label: '承認', v: 'confess', lines: () => [C('c5_truth') === 'silence' ? say('蒼真', '我讓一個無辜的鬼，替別人頂了罪。') : say('蒼真', '我有事瞞著小雪。'), ...雪('……蒼真。'), say('澄岳', '好。門開了。')] },
        { label: '不承認，我沒有做錯', v: 'deny', lines: [say('澄岳', '……也罷。門會開，但八岐會更強。'), ...丸('……')] }] }] });
  Q.add({ id: 'c6_m4', ch: 6, main: true, after: 'c6_m3', title: '八岐大蛇', desc: '雲海展望台，八岐的封印正在崩解。', reward: { exp: 150 },
    steps: [{ t: 'goto', map: 'W_R06_07', text: '前往雲海展望台', lines: [say('須佐之男', '（雲海裡浮出八個蛇頭。一個高大的男人，擋在你們面前。）'), say('須佐之男', '我是須佐之男。三百年前，是我把牠鎖在這裡的。'), say('須佐之男', '道摩撕了古約，鎖鬆了。……這一次，跟我一起打。')] }] });
  Q.bossMod.W_R06_07 = () => C('c6_confess') === 'confess' ? { hp: 0.85, msg: '八岐吞下的「過」少了，頭變小了' } : C('c6_confess') === 'deny' ? { hp: 1.15, atk: 1.1, msg: '八岐吞下了你的謊言' } : null;
  Q.add({ id: 'c6_s_crane', ch: 6, title: '迷路的仙鶴', desc: '雲海展望台附近，有一隻找不到路的仙鶴。', reward: { gold: 180, exp: 200 },
    giver: { map: 'W_R06_01', at: 'east_arrival', dx: -140, u: null, name: '仙鶴', lines: [say('仙鶴', '（一隻白鶴拖著受傷的翅膀，在參道邊打轉。）'), ...丸('牠說牠的窩在書庫的屋頂上。')] },
    steps: [{ t: 'look', map: 'W_R06_03', at: 'center', dx: 120, label: '書庫屋簷', text: '把仙鶴送回書庫屋頂', lines: [say('蒼真', '（仙鶴回到窩裡，叼出一枚發光的鶴羽送給你。）')] }] });
  Q.add({ id: 'c6_s_warrior', ch: 6, title: '無名武士', desc: '見證回廊有一具不肯倒下的武士骸骨。', reward: { exp: 240, item: [6, 3] },
    giver: { map: 'W_R06_04', at: 'east_arrival', dx: -160, u: null, name: '無名武士', lines: [say('無名武士', '（盔甲裡傳來低語。）……我在等一個人。'), say('無名武士', '三百年前，他說會回來。……他叫須佐之男。')] },
    need: () => D('c6_m2'),
    steps: [{ t: 'talk', map: 'W_R06_07', at: 'west_arrival', dx: 160, u: null, name: '須佐之男', text: '把武士的話帶給須佐之男', lines: [say('須佐之男', '……他還在等？'), say('須佐之男', '那是我的部下。我答應過他，打完八岐就回去。'), say('須佐之男', '……我食言了。三百年。')] },
      { t: 'talk', map: 'W_R06_04', at: 'east_arrival', dx: -160, name: '無名武士', text: '回報無名武士', lines: [say('無名武士', '大人……他記得我？'), say('無名武士', '（盔甲慢慢倒下。裡面，留下一張刀譜殘頁。）')] }] });
  Q.add({ id: 'c6_s_umbrella', ch: 6, title: '傘妖搬家', desc: '城裡的傘妖想住到神社的屋簷下。', reward: { gold: 150, exp: 160 },
    giver: { map: 'hub_city', at: 'east_arrival', dx: -260, u: null, name: '傘妖', need: () => F().foxFriend || F().kappaFriend, lines: [say('傘妖', '（一把破傘跳到你面前。）聽說神社願意收留妖怪？'), say('傘妖', '我也想去。可是我的骨頭斷了一根……')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 200, dy: 40, u: 'n_t_human_townswoman', name: '染布的阿紺', text: '請阿紺修傘', lines: [say('阿紺', '傘妖？……修傘我會。'), say('阿紺', '（阿紺換了一根竹骨，又糊了一層新紙。）好了。很漂亮。')] },
      { t: 'talk', map: 'hub_city', at: 'east_arrival', dx: -260, name: '傘妖', text: '告訴傘妖可以搬家了', lines: [say('傘妖', '新衣服！'), say('傘妖', '我要去神社！謝謝你，人類！')] }],
    done() { F().karakasaHome = 1; } });
  Q.add({ id: 'c6_after', ch: 6, main: true, postBoss: true, silent: true, title: '後日談・古約', need: () => F().boss_W_R06_07, reward: { exp: 220 },
    steps: [{ t: 'cut', map: 'W_R06_07', lines: [say('須佐之男', '八岐睡了。……這一次，大概能睡一百年。'), say('須佐之男', '道摩要的不是八岐。他撕古約，是為了讀「器」的那一段。'), say('須佐之男', '他想成為新的器。不，他想成為「珠成神」的那個神。'), ...雪('……那原本的器呢？'), say('須佐之男', '「器歸無」。')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '回神社，和小雪談談', lines: () => [...雪('蒼真。古約的事……請你先不要告訴大家。'), C('c6_confess') === 'confess' ? say('蒼真', '（你想起在試煉場說過的話。）……我不會再瞞妳任何事。') : say('蒼真', '……好。'), ...雪('謝謝。')] }] });
  Q.add({ id: 'c6_b_sword', ch: 6, boss: true, postBoss: true, title: '斬蛇劍的試煉', desc: '須佐之男想看看你能不能承受他的劍。', reward: { gold: 300, exp: 320, item: [7, 3] },
    giver: { map: 'W_R06_07', at: 'west_arrival', dx: 160, u: null, name: '須佐之男', need: () => F().boss_W_R06_07, lines: [say('須佐之男', '你們很強。可是道摩，比八岐更強。'), say('須佐之男', '來，讓我看看你的劍。')] },
    steps: [{ t: 'kill', map: 'W_R06_05', at: 'center', n: 6, foes: ['sohei', 'nurikabe', 'komaishi'], elite: '須佐之男的影武者', text: '通過斬蛇劍的試煉' },
      { t: 'talk', map: 'W_R06_07', at: 'west_arrival', dx: 160, name: '須佐之男', text: '回報須佐之男', lines: [say('須佐之男', '……還不錯。'), say('須佐之男', '天上的雲裡，有我留下的神殿。哪天你準備好了，就上來找我。'), say('須佐之男', '還有——出雲有一個陰陽師，你遲早要見他。他叫晴明。')] }] });

  /* ======================= 第七章　千扇紙閣 ======================= */
  Q.add({ id: 'c7_m1', ch: 7, main: true, title: '沒有影子的人', desc: '找出城裡被紙人取代的人。', reward: { exp: 320, gold: 220 }, need: () => F().ch7,
    steps: [{ t: 'talk', map: 'W_R07_01', at: 'center', u: 'n_fumiya', name: '文也', text: '在米埠倉道與文也會合', lines: [say('文也', '出來了！……我們得先查清楚，城裡有多少人是紙人。'), say('文也', '紙人怕水。下雨的時候，會躲進屋簷下。'), say('文也', '今晚會下雨。我們回城裡看看。')] },
      { t: 'gather', map: 'hub_city', text: '雨夜裡觀察可疑的人', spots: [{ at: 'gate', dx: 60, label: '奉行所門口', lines: [say('蒼真', '（門口的衛兵站在雨裡，衣服卻是乾的。）')] }, { at: 'center', dx: -260, label: '私塾', lines: [say('蒼真', '（私塾先生的影子，比本人慢了半拍。）')] }, { at: 'east_arrival', dx: -180, label: '米行', lines: [say('蒼真', '（米行老闆數錢的時候，手指發出紙張的沙沙聲。）')] }] },
      { t: 'kill', map: 'hub_city', at: 'gate', n: 4, foes: ['kinkasa', 'ittan'], elite: '紙人・景綱', text: '揭穿假景綱' },
      { t: 'cut', map: 'hub_city', lines: [say('景綱', '（真正的景綱被人從奉行所的地窖裡救了出來。）……咳、咳……'), say('景綱', '我被關了七天。那個紙人……說要把整座城，變成紙做的。'), say('景綱', '蒼真，去千扇紙閣。把源頭燒了——或是封了。')] }] });
  Q.add({ id: 'c7_m2', ch: 7, main: true, after: 'c7_m1', title: '雨廊的紙', desc: '查出紙人用的紙從哪裡來。', reward: { exp: 300, gold: 200 },
    steps: [{ t: 'talk', map: 'W_R07_03', at: 'center', u: 'n_t_human_townswoman', name: '染布的阿紺', text: '在雨廊布街找阿紺', lines: [say('阿紺', '紙？布街這陣子確實進了一大批紙，說是要染成黑色。'), say('阿紺', '送貨的是水軍的船。……水軍什麼時候也做紙生意了？')] },
      { t: 'look', map: 'W_R07_03', at: 'east_arrival', dx: -160, label: '黑紙堆', text: '調查黑紙', lines: [say('蒼真', '（黑紙上印著海浪的紋章。）'), ...雪('這是礁島水軍的旗紋……'), ...蒼('紙是從海上來的。')] },
      { t: 'look', map: 'Q_coast_supply_camp', at: 'center', dx: 200, label: '補給棚的貨', text: '到海岸補給營地查貨', lines: [say('蒼真', '（補給棚裡堆滿了黑紙，旁邊是寫著「千扇紙閣」的貨單。）'), ...雪('貨單上蓋的是道摩的印。')] },
      { t: 'kill', map: 'Q_coast_cliff_muster', at: 'center', n: 6, foes: ['kunoichi', 'umibozu'], elite: '水軍的走私頭', text: '在海崖集結台地擊退走私的水軍' },
      { t: 'kill', map: 'W_R07_05', at: 'center', n: 6, foes: ['kunoichi', 'kinkasa'], text: '突破千扇紙閣前的守衛' }] });
  Q.add({ id: 'c7_m3', ch: 7, main: true, after: 'c7_m2', title: '紙閣的抉擇', desc: '紙閣裡藏著幾百年的古籍。', reward: { exp: 320, gold: 220 },
    steps: [{ t: 'choice', map: 'W_R07_05', at: 'center', dx: -100, u: 'n_fumiya', name: '文也', key: 'c7_paper', text: '要燒掉紙閣，還是封印？', lines: [say('文也', '這裡的書……是全國最古老的。有些，連神社都沒有。'), say('景綱', '可紙人也是從這裡出來的。不燒，牠們還會回來。'), ...雪('燒掉，書就沒了。封住，紙人可能還會再出來……')],
      opts: [{ label: '燒掉紙閣', v: 'burn', lines: [say('蒼真', '（火舌吞沒了千扇紙閣。紙人們發出尖叫，化成灰。）'), say('文也', '……書……'), say('景綱', '城安全了。')] },
        { label: '封印紙閣，保留古籍', v: 'seal', lines: [...雪('（小雪在門上畫下封印。）', '……封好了。但封印不是永遠的。'), say('文也', '謝謝你們！我會好好研究這些書的！')] }] }] });
  Q.add({ id: 'c7_m4', ch: 7, main: true, after: 'c7_m3', title: '月下船渡', desc: '紙閣的主人逃往船渡。', reward: { exp: 160 },
    steps: [{ t: 'goto', map: 'W_R07_07', text: '前往月下船渡', lines: [say('蒼真', '（月光下的渡口，一個披著十二單衣的女人站在船頭。）'), say('長壁姬', '我只是想讓人們安靜下來。紙做的人，不會吵，不會哭，不會死。'), say('長壁姬', '道摩大人說，這就是太平。')] }] });
  Q.bossMod.W_R07_07 = () => C('c7_paper') === 'burn' ? { hp: 0.85, msg: '紙閣燒了，長壁姬的紙兵少了一半' } : null;
  Q.add({ id: 'c7_s_tanabata', ch: 7, title: '七夕的短籤', desc: '城裡在辦七夕祭。', reward: { gold: 200, exp: 200 },
    giver: { map: 'hub_city', at: 'center', dx: 120, dy: -50, u: 'n_hanasumi', name: '花澄', need: () => D('c7_m1'), lines: [say('花澄', '城總算恢復了！今晚辦七夕祭！'), say('花澄', '幫我把短籤掛到竹子上好嗎？大家寫了好多願望。')] },
    steps: [{ t: 'gather', map: 'hub_city', text: '掛短籤', spots: [
      { at: 'center', dx: -100, dy: -40, label: '短籤', lines: () => [say('蒼真', '（「希望小太的娘身體健康。」——阿松）')] },
      { at: 'center', dx: 40, dy: 60, label: '短籤', lines: () => [C('c4_well') === 'seal' ? say('蒼真', '（「希望能在城裡找到工作。」——平八）') : say('蒼真', '（「希望礦場平安。」——平八）')] },
      { at: 'gate', dx: -80, label: '短籤', lines: () => [say('蒼真', '（「希望大家都能回家。」——沒有署名。字跡……很像小雪。）')] }] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 120, dy: -50, u: 'n_hanasumi', name: '花澄', text: '回報花澄', lines: [say('花澄', '你也寫一張吧？'), say('蒼真', '（你想了很久，最後寫下：「希望小雪能一直是小雪。」）')] }] });
  Q.add({ id: 'c7_s_xue', ch: 7, title: '小雪的城中一日', desc: '這次不查案，小雪想陪蒼真慢慢逛城。', reward: { exp: 220 },
    giver: { map: 'hub_shrine', at: 'xue_stand', u: null, name: '小雪', need: () => D('c7_m1'), lines: [...雪('蒼真……我、我想去城裡看看。', '我從小到大，一次都沒離開過神社。')] },
    steps: [{ t: 'choice', map: 'hub_city', at: 'center', u: null, name: '小雪', key: 'c7_date', text: '帶小雪去哪裡逛？', lines: [...雪('好多人……好熱鬧。'), ...雪('蒼真，你最喜歡城裡的哪裡？')],
      opts: [{ label: '茶食攤吃糰子', v: 'food', lines: [...雪('（小雪吃了三串糰子，嘴角沾著醬。）……好吃。', '下次，我也想做給你吃。')] },
        { label: '河邊看渡船', v: 'river', lines: [...雪('河會一直流到海裡……', '如果我是水就好了。流到哪裡，都是自己。')] },
        { label: '布街挑髮飾', v: 'cloth', lines: [...雪('（小雪拿起一支白色的花簪，又放下。）', '……我戴不適合吧。'), ...蒼('適合。'), ...雪('……那、那我收下了。')] }] }],
    done() { const g = G.SAVE.data; g.xueLove = (g.xueLove || 0) + 1; } });
  Q.add({ id: 'c7_s_benkei', ch: 7, title: '五條大橋的弁慶', desc: '有個巨漢在橋上搶刀。', reward: { gold: 260, exp: 260, item: [8, 3] },
    giver: { map: 'W_R07_01', at: 'east_arrival', dx: -160, u: 'n_t_human_guard', name: '巡檢孫六', need: () => D('c7_m2'), lines: [say('孫六', '最近夜裡，有個和尚在橋上攔路，搶了九百九十九把刀。'), say('孫六', '他說要湊滿一千把。……你的刀，看起來他會喜歡。')] },
    steps: [{ t: 'kill', map: 'Q_gojo_bridge_duel', at: 'center', n: 1, foes: ['sohei'], elite: '武藏坊弁慶', eliteSub: '「第一千把刀，就是你的！」', text: '在橋上擊退弁慶' },
      { t: 'cut', map: 'Q_gojo_bridge_duel', lines: [say('弁慶', '……我輸了？'), say('牛若丸', '（一個少年從橋欄上跳下來，笑著拍手。）哈哈！弁慶，你也有今天！'), say('牛若丸', '我是牛若丸。這個和尚是我的家臣——剛剛才決定的。'), say('牛若丸', '神社的劍士，以後有機會，跟我比一場吧。')] }],
    done() { F().ushiwaka = 1; } });
  Q.add({ id: 'c7_s_workers', ch: 7, title: '雷原工人的新工作', desc: '從雷原下山的工人們，在城裡找不到工作。', reward: { gold: 220, exp: 200 },
    giver: { map: 'hub_city', at: 'east_arrival', dx: -160, u: 'n_p_heihachi', name: '平八', need: () => C('c4_well') === 'seal' && D('c7_m1'), lines: [say('平八', '蒼真……城裡沒人要我們這些挖礦的。'), say('平八', '我們除了力氣，什麼都沒有。')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 300, u: 'n_p_iwakura', name: '岩藏', text: '問問岩藏需不需要人手', lines: [say('岩藏', '要！我這裡缺人缺到快死了！'), say('岩藏', '挖礦的手，打鐵最合適。叫他們明天來。')] },
      { t: 'talk', map: 'hub_city', at: 'east_arrival', dx: -160, u: 'n_p_heihachi', name: '平八', text: '告訴平八好消息', lines: [say('平八', '真的？……謝謝、謝謝你！'), say('平八', '等我打出第一把刀，一定送給你。')] }] });
  Q.add({ id: 'c7_after', ch: 7, main: true, postBoss: true, silent: true, title: '後日談・紙與海', need: () => F().boss_W_R07_07, reward: { exp: 240 },
    steps: [{ t: 'cut', map: 'hub_city', lines: () => [say('景綱', '城恢復了。……這次，我欠你一條命。'), C('c7_paper') === 'seal' ? say('文也', '紙閣的古籍裡，我找到一段記載：「器者，非一人之名，乃代代相承之職。」') : say('文也', '……紙閣燒了。不過我記得一句：「器者，代代相承。」'),
      say('景綱', '紙是從海上來的。水軍……我會派人盯著。'), ...雪('蒼真，你看，月亮。……七夕的時候，牛郎和織女也只能見一次面呢。')] }] });
  Q.add({ id: 'c7_b_pages', ch: 7, boss: true, postBoss: true, title: '失落的書頁', desc: '被淨化的長壁姬，想把散落的書頁找回來。', reward: { gold: 280, exp: 300, mat: { cloth: 4 } },
    giver: { map: 'W_R07_05', at: 'center', u: null, name: '長壁姬', need: () => F().boss_W_R07_07 && C('c7_paper') === 'seal', lines: [say('長壁姬', '（長壁姬的身影變得透明，像一張被水浸過的紙。）'), say('長壁姬', '我被道摩騙了……他說紙做的世界，就不會有人難過。'), say('長壁姬', '紙閣裡有幾頁書被風吹走了。能幫我找回來嗎？')] },
    steps: [{ t: 'gather', map: 'W_R07_01', text: '找回書頁', spots: [{ at: 'west_arrival', dx: 140, label: '書頁' }, { at: 'center', label: '書頁' }] },
      { t: 'look', map: 'W_R03_03', at: 'center', dx: -60, label: '稻草人懷裡的書頁', text: '在狐路的稻架農家找最後一頁', lines: [say('蒼真', '（稻草人的懷裡，夾著一頁古書。上面畫著一個穿白衣的女人。）')] },
      { t: 'talk', map: 'W_R07_05', at: 'center', name: '長壁姬', text: '把書頁還給長壁姬', lines: [say('長壁姬', '……這一頁，畫的是初代的器。'), say('長壁姬', '她最後，自己走進了寶珠裡。……她說，這樣大家就能回家。')] }] });

  /* ======================= 第八章　宴盟山路 ======================= */
  Q.add({ id: 'c8_m1', ch: 8, main: true, title: '宴前的條件', desc: '收集人類與鬼族雙方的和談條件。', reward: { exp: 340, gold: 240 }, need: () => F().ch8,
    steps: [{ t: 'talk', map: 'W_R08_01', at: 'center', u: 'n_kagetsuna', name: '景綱', text: '在楓谷宴里聽景綱的條件', lines: [say('景綱', '人類的條件：鬼族不得下山，山路歸人類管。'), say('景綱', '……我知道很難。可城裡的人，怕了一百年。')] },
      { t: 'talk', map: 'W_R08_03', at: 'center', u: 'n_t_oni_veteran', name: '鬼族使者', text: '在紅葉茶屋聽鬼族的條件', lines: [say('鬼族使者', '鬼族的條件：山是我們的家，人類不得再砍山裡的神木。'), say('鬼族使者', '還有——鬼族要能進城買鹽。我們也要吃飯。')] },
      { t: 'gather', map: 'W_R08_04', text: '在山路宿場說服雙方各讓一步', spots: [{ at: 'west_arrival', dx: 160, label: '人類代表', lines: [say('人類代表', '……鹽，可以讓他們買。山路，可以共用。')] }, { at: 'east_arrival', dx: -160, label: '鬼族代表', lines: [say('鬼族代表', '……神木以外的樹，人類可以砍。鬼族不下山搶東西。')] }] }] });
  Q.add({ id: 'c8_m2', ch: 8, main: true, after: 'c8_m1', title: '暗中的刺客', desc: '有人在宴前埋伏。', reward: { exp: 340, gold: 220 },
    steps: [{ t: 'kill', map: 'Q_post_nikko', at: 'center', n: 6, foes: ['nobushi', 'bandit_archer'], elite: '道摩的刺客', text: '護送景綱經杉並木驛站，擊退刺客', escort: { u: 'n_kagetsuna', name: '景綱' } },
      { t: 'look', map: 'Q_post_nikko', at: 'center', dx: 100, label: '刺客的密信', text: '讀刺客的密信', lines: [say('蒼真', '（密信：「宴中下毒於酒吞之杯，嫁禍人類，令兩族永戰。」）'), say('景綱', '……道摩想讓我們打起來。'), ...丸('酒裡的毒……我聞得出來。')] }] });
  Q.add({ id: 'c8_m3', ch: 8, main: true, after: 'c8_m2', title: '赴宴', desc: '宴盟山上的和談。', reward: { exp: 360, gold: 260 },
    steps: [{ t: 'choice', map: 'T_akebi', at: 'center', u: 'n_t_oni_veteran', name: '鬼鍛冶權六', key: 'c8_feast', text: '要赴宴和談，還是突襲鬼宴？', lines: () => [say('鬼鍛冶權六', '宴席就在山上。酒吞大人已經在等了。'), say('巡檢孫六', '這是天大的機會！趁他們喝酒，一口氣打上去，山就是我們的了！'),
      C('c5_truth') === 'truth' ? say('茨木', '（茨木從樹上躍下。）蒼真，權太的事，鬼族記得。這一次，我替你擋刀。') : say('茨木', '（茨木從樹上看著你。）……人類。你這次，又要找誰替罪？'), ...雪('蒼真……')],
      opts: [{ label: '赴宴和談，當場揭穿毒酒', v: 'peace', lines: () => [say('蒼真', '（你在宴席上打翻了酒吞的酒杯。酒灑在地上，冒出黑煙。）'), say('酒吞童子', '……毒？'), C('c5_truth') === 'truth' ? say('茨木', '是道摩。我看見他的人了。') : say('酒吞童子', '人類，你救了我？……為什麼？')] },
        { label: '突襲鬼宴', v: 'raid', lines: [say('酒吞童子', '人類……果然。'), say('茨木', '我就知道！'), ...丸('……這是道摩想要的。')] }] }] });
  Q.add({ id: 'c8_m4', ch: 8, main: true, after: 'c8_m3', title: '安置退路', desc: '戰火波及山路，村民需要撤離。', reward: { exp: 180 },
    steps: [{ t: 'goto', map: 'W_R08_07', text: '前往安置退路', lines: () => C('c8_feast') === 'peace' ? [say('酒吞童子', '（酒吞捂著頭，身上冒出黑氣。）……毒進了我的身體……道摩的符……'), say('酒吞童子', '人類……快、打倒我……在我還是我的時候！')] : [say('酒吞童子', '既然要打，就打到底！'), say('茨木', '酒吞大人，我來！')] }] });
  Q.bossMod.W_R08_07 = () => C('c8_feast') === 'peace' ? { hp: 0.85, msg: '酒吞在用意志抵抗道摩的符' } : C('c8_feast') === 'raid' ? { hp: 1.2, atk: 1.15, msg: '鬼族全軍激怒' } : null;
  Q.add({ id: 'c8_s_akebi', ch: 8, title: '曙火寄居地', desc: '撤離的村民需要新家。', reward: { gold: 260, exp: 260, mat: { wood: 4 } },
    giver: { map: 'T_akebi', at: 'west_arrival', dx: 160, u: 'n_t_human_elder', name: '茂兵衛爺', lines: [say('茂兵衛爺', '老夫帶著村民逃到這裡。可這裡只有幾間破屋。'), say('茂兵衛爺', '需要木材、需要稻草、還需要人手。')] },
    steps: [{ t: 'gather', map: 'W_R08_03', text: '收集木材與稻草', spots: [{ at: 'west_arrival', dx: 160, label: '木材' }, { at: 'center', label: '稻草' }, { at: 'east_arrival', dx: -160, label: '木材' }] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 300, u: 'n_p_iwakura', name: '岩藏', text: '到城裡請工匠幫忙', lines: () => [say('岩藏', '蓋房子？交給我！'), C('c4_well') === 'seal' && D('c7_s_workers') ? say('平八', '我們也去！挖礦的手，蓋房子也行！') : say('岩藏', '我叫幾個徒弟跟你上山。')] },
      { t: 'talk', map: 'T_akebi', at: 'west_arrival', dx: 160, u: 'n_t_human_elder', name: '茂兵衛爺', text: '回報茂兵衛爺', lines: [say('茂兵衛爺', '房子蓋起來了……'), say('茂兵衛爺', '老夫活了七十年，第一次覺得，逃難也能逃出一個家。')] }] });
  Q.add({ id: 'c8_s_kota', ch: 8, title: '小太想學劍', desc: '小太長大了，想跟蒼真學劍。', reward: { exp: 240 },
    giver: { map: 'W_R01_01', at: 'home_stand', dx: 60, u: 'n_renta', name: '小太', need: () => F().ch8, lines: [say('小太', '蒼真哥哥！我想學劍！'), say('小太', '我也想像你一樣，保護娘，保護村子。')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'gate', dx: -120, u: 'n_toma', name: '冬馬', text: '帶小太到城裡的道場', lines: [say('冬馬', '這孩子？……眼神不錯。'), say('冬馬', '好，我收了。'), say('小太', '謝謝師父！……蒼真哥哥，等我長大，換我保護你！')] }] });
  Q.add({ id: 'c8_s_legend', ch: 8, title: '源賴光的傳說', desc: '山路宿場的老人說起斬鬼武士的故事。', reward: { exp: 260, item: [9, 3] },
    giver: { map: 'W_R08_04', at: 'center', dx: 120, u: 'n_t_human_elder', name: '宿場的老人', lines: [say('老人', '很久以前，有個叫源賴光的武士，帶著四天王上山斬鬼。'), say('老人', '他的刀還留在山上的某個地方。……聽說，在火山那邊的樹海裡。')] },
    steps: [{ t: 'talk', map: 'hub_city', at: 'center', dx: 150, dy: -4, u: null, name: '時雨', text: '回渡口向時雨打聽樹海', lines: [say('時雨', '樹海？那是副本的地方。'), say('時雨', '源賴光的刀……老身聽過。他把刀插在山頂的鳥居下，說「等一個不殺鬼的人來拔」。')] }],
    done() { F().clueYorimitsu = 1; } });
  Q.add({ id: 'c8_after', ch: 8, main: true, postBoss: true, silent: true, title: '後日談・宴盟', need: () => F().boss_W_R08_07, reward: { exp: 260 },
    steps: [{ t: 'cut', map: 'T_akebi', lines: () => C('c8_feast') === 'peace' ? [say('酒吞童子', '（黑氣散去的酒吞，坐在寄居地的篝火旁。）……頭痛死了。'), say('酒吞童子', '人類，這杯敬你。'), C('c5_truth') === 'truth' ? say('茨木', '……我跟你走。道摩的帳，我要親手算。') : say('茨木', '……我還沒原諒人類。但道摩，我會殺。')] : [say('茂兵衛爺', '鬼族退回山裡了……可是山路上，到處都是傷兵。'), say('景綱', '這場仗，誰都沒贏。'), ...丸('道摩贏了。')] },
      { t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '回神社，和小雪談談', lines: [...雪('鬼族的人……看到我就退開了。', '酒吞說，我身上有「珠」的味道。越來越濃。', '蒼真……我的手，有時候會變得透明。')] }],
    done() { if (C('c8_feast') === 'peace' && C('c5_truth') === 'truth') Q.join('ibaraki'); } });
  Q.add({ id: 'c8_b_sake', ch: 8, boss: true, postBoss: true, title: '鬼宴的酒', desc: '酒吞想重辦一次宴會，請人類和鬼一起喝。', reward: { gold: 320, exp: 340, item: [10, 3] },
    giver: { map: 'T_akebi', at: 'center', dx: 120, u: 'n_t_oni_veteran', name: '鬼族使者', need: () => F().boss_W_R08_07 && C('c8_feast') === 'peace', lines: [say('鬼族使者', '酒吞大人說，上次的宴被毀了。這次要重辦。'), say('鬼族使者', '需要人類的米、鬼族的酒麴，還有……城裡的鹽。')] },
    steps: [{ t: 'talk', map: 'W_R02_01', at: 'center', dx: -80, u: 'n_p_gohei', name: '五平', text: '向共岸的五平要米', lines: [say('五平', '鬼要米釀酒？……哈。'), say('五平', '拿去吧。替我跟鬼說，喝醉了別下山。')] },
      { t: 'talk', map: 'hub_city', at: 'center', dx: 300, u: 'n_sagitsune', name: '砂狐', text: '向砂狐買鹽', lines: [say('砂狐', '鹽？給鬼族的？'), say('砂狐', '……這次，算我請客。人和鬼能坐下來喝酒，比什麼生意都值錢。')] },
      { t: 'talk', map: 'T_akebi', at: 'center', dx: 120, u: 'n_t_oni_veteran', name: '鬼族使者', text: '把米和鹽交給鬼族', lines: [say('鬼族使者', '齊了！'), say('酒吞童子', '（遠處傳來酒吞的大笑。）今晚，不醉不歸！')] }],
    done() { F().oniFriend = 1; } });
})();
