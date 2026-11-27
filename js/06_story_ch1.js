/* ==========================================================================
 * 神諭之地 重製版 — 06_story_ch1.js
 * Version : r3.204.0  (2026-11-28)　r3.204.0：互動標籤高度跟著場景人物比例
 * 舊版    : r3.195.0  (2026-11-28)　互動標記：支線改米白、地面柔邊光暈（不畫實線圈）、光柱柔邊
 * 舊版    : r3.166.0  (2026-11-27)  r3.166.0：鐵心改成先聊天，「鍛冶」放在對話選項
 * 舊版    : r3.39.0  (2026-11-17)  r3.39.0：打完鎌鼬不再直接對話／章節完成；改設 kamaBeat，由 87 的戰後定點（巢邊三兄弟）走近觸發 kamaWin
 * 舊版    : r3.18.2  （r3.18.2：神社升級改找小雪奉納）
 * 舊版    : r3.18.1  （鐵心開放鍛冶：強化／勾玉／打造）
 * 舊版    : r3.12.0  (2026-11-14)
 * 變更    : r3.12.0 劇情固定互動點（如神社小雪）在同位置有任務互動點時讓位（不畫、不選），避免雙記號且觸發到舊台詞。
 * 變更    : r3.11.1 第一章劇情整理：失蹤名冊／刮名字改為「尋人告示」；主線因果＝黑衣人偷走鎌鼬的風玉 → 山風失控、鎌鼬翻人包袱找風玉，
 *           小太餵過受傷的鎌鼬而被藏進風裡躲過赤鬼；燒焦的紙改為黑衣人的「收貨單」（伏筆）。小雪改指引去兩岸城找景綱；
 *           阿松在聚落接續城裡的對話（不再重新見面）；權爺改為目擊黑衣人。走位：主角先走到定位，對話才開始（序幕、聚落）。
 * 變更    : r3.11.0 神社出口改往兩岸城；第一章頭目後改為「章節完成」（不再進結尾畫面），由 52_hub 接續下一章開場。
 * 變更    : r3.10.0 白丸改由夥伴出戰系統（49_party）帶領：入隊後不再用靜態跟隨圖；序幕石像醒來後交給出戰位。
 * 變更    : r3.9.1 序幕走位：蒼真從鳥居走進來 → 告示板前與小雪對話 → 小雪帶到拜殿左側石狛犬 → 石像褪色醒來成白丸入隊；
 *           開場前白丸是石像（灰階、不動）；新增過場 cutStep（暫停玩家輸入，主角／NPC 自動走位，7 秒保險就位）。
 * 變更    : r3.8.0 風口護巢灘：開場對話後與鎌鼬三兄弟（26_boss）交戰，勝利後短對話再結束第一章。
 * 變更    : r3.5.1 修正：第二章以後（沒有劇本的地圖）白丸不見 → 加入後任何地圖都跟隨；神社名冊可重複查看。
 * 變更    : r3.0.3 權爺／阿松／勘婆／鐵心談完後不再消失，可重複對話（輪流閒話）。
 * 變更    : r2.1.0 台詞白話化（原底冊、朱印、壓人的誓等難懂用詞改成一般說法）。
 * 變更    : r2.0.0 劇本全面擴寫（對齊故事聖經 S01「空碗旁的名字」：空碗、阿鈴的船路圖、胸印、藍火與風聲的矛盾證詞、
 *           由內割開的草鞋、摺好的包布、化狸與誓紙、鎌鼬護著孩子）；權爺改回神社名冊見證人、聚落水車改由鐵心；
 *           互動標記分「談／調查」、主線目標 target() 供畫面外箭頭；權爺、鐵心給裝備；清場後地圖可自動生怪。
 *           r1.1.0 序幕改在環谷神社；白丸於神社入隊。
 * 說明    : 第一章「風切之巢」序段劇本與場景事件——
 *           hub_shrine 環谷神社（序幕）→ 鳥居石階 → W_R01_01 藥路水車聚落（打聽）→ 03 杉影溪橋古道（赤鬼、藥籃）
 *           → 04 竹海舊社（赤鬼、草鞋與誓紙）→ 07 風口護巢灘（鎌鼬登場懸念，接第五批 Boss 戰）。
 *           旗標寫在 SAVE.data.flags；只在對話結束／換場景／清場時寫入。
 * ========================================================================== */
'use strict';
/* r3.0.3：NPC 談過一次後不再消失——之後輪流說閒話（買賣／打造下一批開放） */
const AGAIN = {
  '權爺': ['告示上的孩子，一個都不能少。', '年輕人，路上小心，風切之巢的風可不講道理。', '累了就回神社，拜殿的燈一直亮著。'],
  '阿松': ['今天的飯糰多做了幾個，餓了就說。', '水車的聲音沒停，村子就還在。', '白丸那孩子，鼻子比我家的狗還靈。'],
  '勘婆': ['草藥要趁露水沒乾時採，藥性才足。', '受了傷別硬撐，回來我幫你看看。', '妖氣重的地方，草都長得歪歪的。'],
  '鐵心': ['刀要常磨，人也一樣。', '爐子修好了。素材帶來，強化、打洞、打造套裝都找我。', '妖骨硬得很，拿來淬火正好。'] };
const AGAIN_I = {};
function nextAgain(who) { const L = AGAIN[who]; const i = AGAIN_I[who] = ((AGAIN_I[who] === undefined ? -1 : AGAIN_I[who]) + 1) % L.length; return L[i]; }   // r3.166.0：店家對話共用
function again(who) { const L = AGAIN[who]; const i = AGAIN_I[who] = ((AGAIN_I[who] === undefined ? -1 : AGAIN_I[who]) + 1) % L.length; G.DLG.start([{ who, text: L[i] }]); }
(function () {
  const S = () => G.SAVE.data, F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text });
  const N = id => G.SC.def.nodes[id];
  let marks = [], shiro = null;
  const gift = (tid, q, lv, msg) => { const R = G.RPG, it = R.make(tid, q, lv, q ? [['atk', 2]] : [], null); if (R.addItem(it)) G.UI.toast('獲得【' + R.QUAL[q].n + '】' + R.name(it) + (msg || '　（選單 › 裝備）')); };

  /* ======================= 劇本 ======================= */
  const T = {
    prologue0: [
      say('', '雨停在天亮前。環谷神社的晨鐘還沒響，社務所的燈卻亮了一整夜。'),
      say('', '合願庭的告示板上，貼著三張尋人告示。最新的一張墨跡還沒乾：「小太，九歲，藥路聚落人。」')
    ],
    prologue: [
      say('小雪', '蒼真，你來了。……又多了一張。'),
      say('蒼真', '這個月第三個了。是誰家的孩子？'),
      say('小雪', '小太。山腳藥路聚落，阿松家的孩子。昨晚替他娘上山取藥，到現在還沒回來。'),
      say('小雪', '前兩個孩子，也是入夜後在山路上不見的。村裡的人都說——是被風搶走的。'),
      say('蒼真', '風會搶人？'),
      say('小雪', '最近山裡的風很怪。走夜路的人，包袱常被一陣風捲走，翻得亂七八糟丟在路邊——東西一樣沒少。'),
      say('小雪', '就像那陣風……在找什麼東西。'),
      say('', '蒼真從行囊裡取出一本殘冊，攤在告示板旁。冊子裡夾著一張發黃的船路圖，角落有一行歪歪的字：「先畫歸路，再放船。」'),
      say('蒼真', '阿鈴寫的。三年前，我們蹲在渡口畫這條線……她說，不知道怎麼回來的路，就不該出發。'),
      say('小雪', '……你的胸口，最近還會痛嗎？'),
      say('蒼真', '起風的時候會。'),
      say('小雪', '那道印記，跟三年前那場大水有關。三年前的事我還沒查清楚……在弄清楚之前，我不想再亂猜、再替你做一次決定。'),
      say('小雪', '我得留在神社，等著來問消息的家屬，走不開。……你一個人上山不行。跟我來。')
    ],
    prologue2: [
      say('小雪', '白丸，醒醒。有孩子走丟了。')
    ],
    prologue3: [
      say('白丸', '（拜殿前的石狛犬甩了甩頭，石耳上的青苔沾著露水。）……吵死了。我聽見了。'),
      say('白丸', '外頭有那孩子的氣味。還有兩種不是他的腳印。你要找人，我能帶到岔口。'),
      say('小雪', '穿過鳥居就是兩岸城。我寫了信給巡檢的景綱大人，阿松也在城裡等你——跟她回聚落，先把事情問清楚。'),
      say('小雪', '慌亂的人，最容易漏掉要緊的事。'),
      say('蒼真', '我會把知道的，跟猜的，分開說。')
    ],
    xueAgain: [
      say('小雪', '告示這邊我會顧著。你只管把小太帶回來。'),
      say('小雪', '……還有，別讓白丸離你太遠。牠嘴硬，鼻子比我們誰都靈。'),
      say('白丸', '我聽得見。')
    ],
    gen: [
      say('權爺', '是蒼真啊。來看告示？……老頭子守了四十年鐘，一個月貼三張，還是頭一回。'),
      say('權爺', '前兩張貼出去之後，夜裡我在鐘樓上看見過人影——穿黑衣的，不打燈，專挑山路走。'),
      say('蒼真', '權爺，昨晚您有聽見什麼嗎？'),
      say('權爺', '有。藍火一亮，我就聽見那陣風——呼地一聲，從竹林那頭過來。一定是一起來的。'),
      say('權爺', '……黑衣人的事，你先別跟社務所說。沒憑沒據，只會嚇壞那些等孩子的家屬。'),
      say('蒼真', '……我記下了。'),
      say('權爺', '謝什麼。這御守你帶著，我家老太婆縫的，擋不了刀，擋得住心慌。')
    ],
    hall: [
      say('', '拜殿的鈴繩被晨風吹得輕輕搖晃。你搖響了鈴，合掌片刻。'),
      say('', '（生命完全恢復。）')
    ],
    archive: [
      say('', '告示板上貼著三張尋人告示，最舊的一張已經被雨水泡皺了。'),
      say('', '三個孩子，都是在入夜後走山路時不見的。'),
      say('蒼真', '三個人、三條路……可最後都經過杉影古道。')
    ],
    village: [
      say('', '藥路聚落的水車照常轉著。曬藥的竹篩擺了一路，空氣裡有退熱草的苦味。'),
      say('阿松', '蒼真大人，我家就在前面。我先回去，把小太出門前的東西找出來。'),
      say('白丸', '（白丸把鼻子貼著地面走了幾步）……他昨晚往東走。走得很急，又停了好幾次。'),
      say('蒼真', '停下來做什麼？'),
      say('白丸', '不知道。去問人。問清楚了，我再聞給你看。')
    ],
    matsu: [
      say('阿松', '（阿松從屋裡捧出一只空碗，手還在抖。）這是他出門前吃的……他說天亮前一定回來的……'),
      say('蒼真', '阿松，慢慢說。他是走哪條路上山的？'),
      say('阿松', '我叫他走大路，可那孩子嫌遠……八成又抄了杉影古道。'),
      say('阿松', '他出門前還多捏了一個飯糰，用我的包布包著。我問他帶那麼多做什麼，他只是笑。'),
      say('阿松', '最近夜裡風好怪，像有人在屋頂上笑。我不該讓他去的……都是我的錯……'),
      say('蒼真', '不是妳的錯。他是去替妳取藥的——這件事，他會想親口告訴妳。'),
      { choice: [
        { label: '請村民到竹林岔口等', set: 'gather', then: [say('蒼真', '請大家帶著燈籠到竹林岔口等。我找到人，會先把他帶到那裡。'), say('阿松', '好……好！我這就去叫人！'), say('白丸', '人多也好。受了傷的孩子，總得有人揹。')] },
        { label: '不必聲張，我一個人去', set: 'alone', then: [say('蒼真', '人多反而會驚動山裡的東西。妳在家等，把灶火燒旺一點。'), say('阿松', '……嗯。我煮好粥等他。'), say('白丸', '一個人去？……哼，算上我是兩個。')] }
      ] }
    ],
    herb: [
      say('勘婆', '小太？昨晚來過，買了退熱草，說他娘咳了三天。'),
      say('勘婆', '我跟他說古道入夜不能走，那孩子笑著說：「我跑得比風快。」'),
      say('蒼真', '他離開時，有什麼不對勁嗎？'),
      say('勘婆', '……風。他走沒多久，竹林那邊的風就變了調，像三個人在輪流吹口哨。'),
      say('勘婆', '老身活了七十年，只聽過一次那種聲音。那年，山裡也少了好幾個孩子。'),
      say('勘婆', '不過啊——那年的孩子，後來是自己走回來的。說是被「風」藏起來了。沒人信。')
    ],
    smith: [
      say('鐵心', '要上古道？這陣子橋頭常有赤鬼晃蕩，皮厚得跟磨盤一樣。'),
      say('蒼真', '權爺說，昨晚藍火和風聲是一起來的。'),
      say('鐵心', '權爺耳朵好，可他站在神社上頭。昨晚我這水車一直轉到半夜——坡下的聲音，全被水聲蓋過去了。'),
      say('鐵心', '他聽見的是樹梢的風。藍火在坡下，不一定跟風同時。……別把一個人聽到的，當成全部。'),
      say('蒼真', '……我記下了。'),
      say('鐵心', '拿著，這把刀我磨了三天，本來要賣給城下町的武士老爺。你比他更需要。')
    ],
    shiro: [
      say('白丸', '（白丸繞著水車打轉，忽然停住，鼻尖貼上一塊濕石頭。）'),
      say('白丸', '這裡。他在這裡坐過，還分了東西出去——飯的味道，混著……鼬的味道。受傷的鼬。'),
      say('蒼真', '他在餵什麼東西。'),
      say('白丸', '往東，杉影古道。氣味很新，跟我來。')
    ],
    bridge: [
      say('蒼真', '橋板上有小小的腳印……旁邊還有一串大得多的。'),
      say('白丸', '（白丸背上的石紋泛起微光，喉嚨裡滾出低吼。）赤鬼。三隻……不，兩隻。'),
      say('蒼真', '牠們也在找他？'),
      say('白丸', '牠們在找吃的。小太在牠們眼裡，就是吃的。——上了。')
    ],
    basket: [
      say('', '供奉台下，藥籃翻倒在一旁。退熱草撒了一地，還帶著露水。'),
      say('蒼真', '籃子的背帶斷了……切口平整得像被刀削過，可附近沒有半點刀痕。'),
      say('', '藥籃旁擱著阿松的包布。飯糰不見了，布卻摺得整整齊齊，四個角對得好好的。'),
      say('蒼真', '被追的人，不會停下來摺布。他是自己把飯糰拿出去的——給了誰。'),
      say('白丸', '（白丸對著切口嗅了嗅，打了個噴嚏。）……是風。風割斷的。'),
      say('蒼真', '往竹海那邊去了。')
    ],
    shrine: [
      say('蒼真', '竹海舊社……連神社都廢了，赤鬼才敢在這裡築窩。'),
      say('白丸', '（竹葉沙沙作響。白丸壓低身子。）不是風。是腳步——三道。')
    ],
    shoe: [
      say('', '古社旁的泥地裡，躺著一隻小小的草鞋。鞋繩是從內側被割斷的。'),
      say('蒼真', '不是被拖走的……鞋卡住了，有人從裡面替他割開——讓他能跑。'),
      say('', '泥地上還有另一種腳印：短短的，像狸。腳印旁落著半張燒焦的紙——是一張收貨單，上頭列著幾個孩子的名字，蓋著一個沒見過的紅色大印。'),
      say('蒼真', '……上面的名字，跟神社告示上的孩子，是同一批。有人在「收」孩子。'),
      say('白丸', '狸的氣味往山下去了，還混著黑布和硃砂的味道。孩子的氣味——往風口。'),
      say('蒼真', '先救人。紙我收著。'),
      say('白丸', '（白丸叼起草鞋，往竹林深處跑了兩步，回頭看你。）'),
      say('蒼真', '好，帶路。')
    ],
    gatherLine: [say('', '（遠處竹林岔口，隱約有燈籠的光在晃。阿松他們已經到了。）'), say('蒼真', '大家都在等。得在天黑前把他帶回去。')],
    aloneLine: [say('蒼真', '阿松一個人在家等著。……灶火應該已經燒旺了吧。'), say('白丸', '那就快點。粥涼了不好吃。')],
    nest: [
      say('', '風口下的灘地，竹枝被編成一圈一圈的巢。巢裡堆滿了東西——草鞋、髮繩、木雕的小馬、一只缺角的碗。'),
      say('蒼真', '這些……全是孩子的東西。'),
      say('白丸', '（白丸的毛全豎了起來。）……別動。上面。'),
      say('？？？', '大哥，又有人類來搶我們的東西了。'),
      say('？？？', '嘻嘻，搜搜看，他身上有沒有風玉？'),
      say('？？？', '……都安靜。先看看他想做什麼。'),
      say('', '三道風同時落地。竹海在一瞬間全部倒伏，像是向什麼東西低頭。'),
      say('？？？', '人類。你身上……有「那一夜」的味道。'),
      say('蒼真', '我只是來帶一個孩子回家。'),
      say('小太', '不要過來！蒼真哥哥，你不可以傷害他們——他們、他們不是壞——'),
      say('？？？', '穿黑衣的人類偷走了我們的風玉。沒有風玉，我們管不住風……只好一個一個翻人類的包袱找。'),
      say('', '話沒說完，狂風捲起了整片灘地。')
    ],
    kamaWin: [
      say('', '風停了。三隻鎌鼬縮回普通鼬鼠的大小，蜷在巢邊喘著氣。'),
      say('小太', '蒼真哥哥，不要再打了！他們只是在找風玉……那天晚上，是他們把我藏進風裡，赤鬼才沒找到我。'),
      say('小太', '我分飯糰給受傷的小鎌鼬吃……牠哥哥們就一直護著我。'),
      say('？？？', '……風玉……被黑衣人拿走了……沒有它，風停不下來……'),
      say('蒼真', '（蒼真摸了摸懷裡那張燒焦的收貨單。）……黑衣人。風玉，我幫你們找回來。'),
      say('白丸', '先把孩子帶回家。阿松的粥要涼了。')
    ]
  };

  /* ======================= 各場景事件 ======================= */
  const npc = (id, name, node, face, dx) => { const p = N(node); return { npc: id, name, x: p[0] + (dx || 0), y: p[1], face: face || -1 }; };
  const portalPt = id => { const p = G.SC.def.portals.find(q => q.id === id); if (!p) return null;
    if (p.rect) return { x: (p.rect[0] + p.rect[2]) / 2, y: p.rect[1] }; const [[x, a], [, b]] = p.line; return { x, y: (a + b) / 2 }; };
  const SCN = {
    hub_shrine: {
      enter() {
        followShiro();
        if (!shiro && !F().shiroJoin) { shiro = { img: 'shiro', x: STATUE[0], y: STATUE[1], face: 1, ratio: 0.62, follow: false, stone: 1 }; G.NPC = [shiro]; }
        const xue = npc('xue', '小雪', 'xue_stand', -1); G.NPC.push(xue, npc('gen', '權爺', 'archive_stand', 1, 60));
        if (!F().prologue) prologue(xue);
        marks = [
          { id: 'xue', node: 'xue_stand', label: '小雪', when: () => F().prologue, run: () => G.FORGE ? G.DLG.start([{ who: '小雪', text: '神社的事交給我。要奉納嗎？' }, { choice: G.FORGE.shrineCh().concat([{ label: '閒聊', then: [{ do: () => G.DLG.start(T.xueAgain) }] }, { label: '離開', then: [] }]) }]) : G.DLG.start(T.xueAgain) },
          { id: 'gen', node: 'archive_stand', dx: 60, label: '權爺', when: () => F().prologue, run: () => F().gen ? again('權爺') : G.DLG.start(T.gen, () => { F().gen = true; gift(80, 1, 1); }) },
          { id: 'archive', node: 'archive_stand', dx: -40, label: '尋人告示', kind: 'look', when: () => F().prologue, run: () => G.DLG.start(T.archive, () => { F().archive = true; }) },
          { id: 'hall', node: 'hall_stand', label: '拜殿', kind: 'look', when: () => F().prologue, run: () => G.DLG.start(T.hall, () => { G.H.hp = G.H.hpMax; }) }
        ];
      },
      obj() { return F().matsu ? '' : '穿過鳥居，前往兩岸城'; },
      target() { return F().matsu ? null : Object.assign(portalPt('village'), { label: '鳥居石階' }); }
    },
    W_R01_01: {
      enter() {
        followShiro();
        G.NPC.push(npc('matsu', '阿松', 'home_stand', 1), npc('okan', '勘婆', 'herb_stand', 1), npc('smith', '鐵心', 'mill_stand', -1));
        lockEast(!F().shiro, '先在聚落裡打聽小太的下落');
        if (!F().village) { const h = N('home_stand'); walk([{ ent: 'hero', x: h[0] + 150, y: h[1] + 50, face: -1 }], () => G.DLG.start(T.village, () => { F().village = true; })); }
        marks = [
          { id: 'matsu', node: 'home_stand', label: '阿松', get main() { return !F().matsu; }, when: () => true, run: () => F().matsu ? again('阿松') : G.DLG.start(T.matsu, () => { F().matsu = true; }) },
          { id: 'herb', node: 'herb_stand', label: '勘婆', get main() { return !F().herb; }, when: () => true, run: () => F().herb ? again('勘婆') : G.DLG.start(T.herb, () => { F().herb = true; }) },
          { id: 'smith', node: 'mill_stand', label: '鐵心', when: () => true, run: () => F().smith ? (G.SHOPTALK ? G.SHOPTALK({ name: '鐵心' }, { chat: () => [{ who: '鐵心', text: nextAgain('鐵心') }], acts: [{ label: '鍛冶（強化／勾玉／打造）', run: () => G.SHOP.open('smith_village', { name: '鐵心' }) }] }) : G.DLG.start([{ choice: [{ label: '鍛冶（強化／勾玉／打造）', then: [{ do: () => G.SHOP.open('smith_village', { name: '鐵心' }) }] }, { label: '閒聊', then: [{ do: () => again('鐵心') }] }, { label: '離開', then: [] }] }])) : G.DLG.start(T.smith, () => { F().smith = true; gift(1, 1, 1); }) },
          { id: 'shiro', node: 'wheel_stand', label: '水車旁', kind: 'look', main: true, when: () => F().matsu && F().herb && !F().shiro, run: () => G.DLG.start(T.shiro, () => { F().shiro = true; lockEast(false); G.UI.banner('往東・杉影溪橋古道'); }) }
        ];
      },
      obj() { const f = F(); if (!f.matsu || !f.herb) return '向阿松、勘婆打聽　' + ((f.matsu ? 1 : 0) + (f.herb ? 1 : 0)) + '／2'; if (!f.shiro) return '讓白丸在水車旁聞氣味'; return '往東前往杉影溪橋古道'; },
      target() { const m = mainMark(); if (m) return m; return F().shiro ? Object.assign(portalPt('east'), { label: '杉影溪橋古道' }) : null; }
    },
    W_R01_03: {
      enter() { followShiro();
        if (!S().cleared.W_R01_03) { lockEast(true, '赤鬼擋住了去路'); G.DLG.start(T.bridge, () => { G.spawnOni(N('bridge_center')[0], N('bridge_center')[1], 10); G.spawnOni(N('right_bridgehead')[0], N('right_bridgehead')[1], 90); G.UI.banner('擊退赤鬼'); }); }
        else lockEast(!F().basket, '供奉台那邊好像有東西');
        marks = [{ id: 'basket', node: 'offering_terrace', label: '供奉台', kind: 'look', main: true, when: () => S().cleared.W_R01_03 && !F().basket, run: () => G.DLG.start(T.basket, () => { F().basket = true; lockEast(false); G.UI.banner('往東・竹海舊社'); }) }];
      },
      cleared() { lockEast(true, '供奉台那邊好像有東西'); G.UI.banner('古道清空了', '查看供奉台'); },
      obj() { if (!S().cleared.W_R01_03) return '擊退赤鬼　' + kills() + '／2'; if (!F().basket) return '查看供奉台'; return '往東前往竹海舊社'; },
      target() { if (!S().cleared.W_R01_03) return null; return mainMark() || Object.assign(portalPt('east'), { label: '竹海舊社' }); }
    },
    W_R01_04: {
      enter() { followShiro();
        if (!S().cleared.W_R01_04) { lockEast(true, '赤鬼還在附近'); G.DLG.start(T.shrine, () => { const a = N('lookout_stop'), b = N('road_center'); G.spawnOni(a[0], a[1], 0); G.spawnOni(b[0] + 300, b[1] + 40, 60); G.spawnOni(a[0] + 280, a[1] + 30, 150); G.UI.banner('擊退赤鬼'); }); }
        else lockEast(!F().shoe, '古社旁好像有痕跡');
        marks = [{ id: 'shoe', node: 'shrine_stand', label: '古社旁', kind: 'look', main: true, when: () => S().cleared.W_R01_04 && !F().shoe,
          run: () => G.DLG.start(T.shoe.concat(F().gather ? T.gatherLine : T.aloneLine), () => { F().shoe = true; lockEast(false); G.UI.banner('往東・風口護巢灘'); }) }];
      },
      cleared() { lockEast(true, '古社旁好像有痕跡'); G.UI.banner('竹海安靜下來了', '查看古社旁的痕跡'); },
      obj() { if (!S().cleared.W_R01_04) return '擊退赤鬼　' + kills() + '／3'; if (!F().shoe) return '查看古社旁的痕跡'; return '往東前往風口護巢灘'; },
      target() { if (!S().cleared.W_R01_04) return null; return mainMark() || Object.assign(portalPt('east'), { label: '風口護巢灘' }); }
    },
    W_R01_07: {
      enter() { followShiro(); marks = []; lockEast(true, '狂風擋住了去路');
        if (!F().nest && !F().kamaBeat) G.STORY.later(50, () => { for (let i = 0; i < 10; i++) G.FX.push({ k: 'wind', x: G.SC.cam.x - 300 + Math.random() * 300, y: G.SC.cam.y - 120 + Math.random() * 240, vx: 6 + Math.random() * 4, t: 0, life: 70 });
          G.DLG.start(T.nest, () => { G.SC.shake = 10; const go = () => { const c = N('engagement_floor');
            G.BOSS.start('kama', { x: c[0] + 60, y: c[1], onWin: () => { F().kamaBeat = true; G.SAVE.markDirty(); G.QST && G.QST.build && G.QST.build(); } }); };
            G.BOSS.load('kama').then(go, e => { console.warn(e); F().nest = true; G.HUB ? G.HUB.chapterClear(1) : G.MAIN.end(); }); }); });
      },
      obj() { return F().nest ? '' : '前往風口'; },
      target() { return null; }
    }
  };
  /* 序幕走位：蒼真從鳥居走進來 → 告示板前與小雪對話 → 小雪帶到拜殿左側石狛犬 → 白丸醒來入隊 */
  const STATUE = [688, 402];
  function prologue(xue) {
    const H = G.H, a = N('torii_arrival'), xs = N('xue_stand'); H.x = a[0]; H.y = a[1]; H.face = 1; G.SC.cam.x = H.x; G.SC.cam.y = H.y;
    walk([{ ent: 'hero', x: xs[0] - 58, y: xs[1] + 22, face: 1 }], () =>
      G.DLG.start(T.prologue0.concat(T.prologue), () => walk([{ ent: xue, x: STATUE[0] + 52, y: STATUE[1] + 14, face: -1, sp: 1.7 }, { ent: 'hero', x: STATUE[0] + 116, y: STATUE[1] + 30, face: -1 }], () =>
        G.DLG.start(T.prologue2, () => reveal(() =>
          G.DLG.start(T.prologue3, () => { F().prologue = true; F().shiroJoin = true; shiro.face = 1;
            if (G.PARTY) { const sx = shiro.x, sy = shiro.y; G.NPC = G.NPC.filter(n => n !== shiro); shiro = null; G.PARTY.onJoin('shiro'); const P = G.PARTY.list.find(q => q.id === 'shiro'); if (P) { P.x = sx; P.y = sy; } } else shiro.follow = true;
            mover(xue, xs[0], xs[1], -1); G.UI.banner('第一章　風切之巢', '尋找失蹤的小太'); }))))));
  }
  let cut = null; const movers = [];
  function walk(L, done) { cut = { L: L.map(o => Object.assign({}, o)), t: 0, wait: 0, done }; }
  function reveal(done) { const n = shiro, x = n.x, y = n.y;
    cut = { L: [], t: 0, wait: 76, done, tick(t) {
      if (t % 4 === 1 && t < 48) for (let i = 0; i < 2; i++) G.FX.push({ k: 'spark', x: x + (Math.random() - 0.5) * 50, y: y - Math.random() * 40, vx: (Math.random() - 0.5) * 0.6, vy: -1.6 - Math.random() * 1.4, t: 0, life: 26 });
      if (t % 10 === 1 && t < 44) G.FX.push({ k: 'orb', x: x + (Math.random() - 0.5) * 30, y: y - 20 - Math.random() * 30, t: 0, life: 22 });
      n.stone = Math.max(0, 1 - t / 46);
      if (t === 48) { G.SC.shake = 5; G.FX.push({ k: 'dust', x, y, t: 0, life: 20 }); }
      n.hop = t >= 48 && t < 64 ? Math.sin((t - 48) / 16 * Math.PI) * 16 : 0;
      if (t === 56) n.face = 1; } }; }
  function mover(e, x, y, face) { movers.push({ ent: e, x, y, face, sp: 1.7 }); }
  function moveStep(o, e) { const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy);
    if (d < 4) { e.x = o.x; e.y = o.y; e.walking = false; if (o.face) e.face = o.face; return true; }
    const sp = Math.min(d, o.sp || 1.9); e.x += dx / d * sp; e.y += dy / d * sp; e.walking = true; if (Math.abs(dx) > 1) e.face = Math.sign(dx); return false; }
  const ACT = ['atk', 'c1', 'c2', 'c3', 'skA', 'skB', 'm1', 'm2', 'ult'];
  function cutStep() { if (!cut) return false; const IN = G.IN, H = G.H; cut.t++; let all = cut.t >= cut.wait;
    for (const k of ACT) IN[k] = false; IN.mx = 0; IN.my = 0;
    if (cut.tick) cut.tick(cut.t);
    for (const o of cut.L) { if (o.ok) continue;
      if (cut.t > 420) { const e = o.ent === 'hero' ? H : o.ent; e.x = o.x; e.y = o.y; e.walking = false; if (o.face) e.face = o.face; o.ok = true; continue; }   // 卡住保險：7 秒仍未到就直接就位
      if (o.ent !== 'hero') { if (moveStep(o, o.ent)) o.ok = true; else all = false; continue; }
      const dx = o.x - H.x, dy = o.y - H.y, d = Math.hypot(dx, dy);
      if (d < 7) { o.ok = true; if (o.face) H.face = o.face; continue; }
      all = false; const k = d < 24 ? 0.55 : 1; IN.mx = dx / d * k; IN.my = dy / d * k; }
    G.heroStep();
    if (all) { const f = cut.done; cut = null; IN.mx = IN.my = 0; H.st = 'idle'; f && f(); }
    return true; }
  function mainMark() { for (const m of marks) if (m.main && m.when()) { const p = N(m.node); return { x: p[0] + (m.dx || 0), y: p[1], label: m.label }; } return null; }
  function lockEast(on, why) { if (on) G.SC.lock.east = why; else delete G.SC.lock.east; }
  function followShiro() { if (!F().shiroJoin || G.PARTY) { G.NPC = []; shiro = null; return; } shiro = { img: 'shiro', x: G.H.x - 40, y: G.H.y + 4, face: 1, ratio: 0.62, follow: true }; G.NPC = [shiro]; }
  let killCount = 0; const kills = () => killCount;
  let timers = [];

  G.STORY_T1 = T;   // r3.39.0：給 87 戰後對話用
  G.STORY = {
    onEnter(id) { killCount = 0; timers = []; marks = []; G.NPC = []; cut = null; movers.length = 0; const s = SCN[id]; if (s) s.enter(); else followShiro(); },
    later(n, f) { timers.push({ n, f }); },
    cutStep, walk, get cut() { return !!cut; },
    autoSpawnOk(id) { return id === 'W_R01_07' ? !!F().nest : !!S().cleared[id]; },
    onKill() { killCount++; const id = G.SC.id, s = SCN[id];
      if (G.E.every(e => e.st === 'dead') && s && s.cleared && !S().cleared[id]) { S().cleared[id] = true; G.SAVE.markDirty(); G.SAVE.flush(); s.cleared(); } },
    objective() { const s = SCN[G.SC.id]; return s ? s.obj() : ''; },
    scnObj() { const s = SCN[G.SC.id]; return s && F().prologue && !F().nest && !F().kamaBeat ? s.obj() : ''; },   // r3.39.0：鎌鼬打完後交給任務導引（舊的「往東」提示不再蓋過主線）
    target() { const s = SCN[G.SC.id]; return s && s.target ? s.target() : null; },
    interact(m) { m.run(); G.UI.near = null; },
    step() {
      for (const t of timers) if (--t.n === 0) t.f(); timers = timers.filter(t => t.n > 0);
      for (let i = movers.length - 1; i >= 0; i--) if (moveStep(movers[i], movers[i].ent)) movers.splice(i, 1);
      G.UI.near = null; let best = 1e9;
      const busy = m => G.QST && G.QST.busy && (p => G.QST.busy(p[0] + (m.dx || 0), p[1]))(N(m.node));
      for (const m of marks) { if (!m.when() || busy(m)) continue; const p = N(m.node), d = Math.hypot(G.H.x - p[0] - (m.dx || 0), (G.H.y - p[1]) * 1.6); if (d < 70 && d < best) { best = d; G.UI.near = m; } }
      if (shiro && shiro.follow && !G.shiroStep(shiro)) { const H = G.H, tx = H.x - H.face * 42, ty = H.y + 6, dx = tx - shiro.x, dy = ty - shiro.y, d = Math.hypot(dx, dy);
        if (d > 160) { shiro.x = tx; shiro.y = ty; }
        else if (d > 8) { const sp = Math.min(d, d > 60 ? 2.6 : 1.6); G.tryMove(shiro, dx / d * sp, dy / d * sp); if (Math.abs(dx) > 4) shiro.face = Math.sign(dx); } }
    },
    /* 互動標記：地面光圈＋光柱＋名牌（名牌固定螢幕大小）；主線＝金色，支線＝淡青 */
    drawMarks() { const ctx = G.ctx, Z = G.SC.zoom();
      for (const m of marks) { if (!m.when() || (G.QST && G.QST.busy && G.QST.busy(N(m.node)[0] + (m.dx || 0), N(m.node)[1]))) continue; const [nx, y] = N(m.node), x = nx + (m.dx || 0), a = 0.55 + 0.45 * Math.sin(G.t * 0.1), near = G.UI.near === m;
        const col = m.main ? '255,214,120' : '236,226,206', hgt = G.HERO_H * 1.35;   /* r3.195.0：支線由淡青改米白；地面不再畫實線圈，改柔邊光暈；光柱左右淡出 */
        { const rx = 26 + a * 5; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.3); const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gg.addColorStop(0, `rgba(${col},${0.3 + 0.2 * a})`); gg.addColorStop(0.6, `rgba(${col},${0.14 + 0.1 * a})`); gg.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore(); }
        { const al = 0.2 + 0.16 * a; for (let i = 0; i < 4; i++) { const w = 3 + i * 3, g = ctx.createLinearGradient(0, y - hgt, 0, y); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${al * (1 - i * 0.22) * 0.5})`); ctx.fillStyle = g; ctx.fillRect(x - w, y - hgt, w * 2, hgt); } }
        const ly = y - G.HERO_H * (G.SC.depth ? G.SC.depth(y) : 1) * (m.lh || 1.15) - Math.sin(G.t * 0.08) * 3;   /* r3.204.0：標籤高度跟著該場景的人物比例（內殿人物放大後，標籤才不會被身體擋住）；m.lh＝個別指定高度 */ ctx.save(); ctx.translate(x, ly); ctx.scale(1 / Z, 1 / Z);
        const lab = (m.kind === 'look' ? '◇ ' : '◆ ') + m.label, fs = 12 * G.FS(); ctx.font = `900 ${fs}px ${G.FONT_S}`; const w = ctx.measureText(lab).width + 16;
        ctx.fillStyle = near ? 'rgba(150,92,36,.95)' : 'rgba(12,8,10,.78)'; G.rr(-w / 2, -fs, w, fs * 2, fs); ctx.fill(); ctx.strokeStyle = `rgba(${col},.9)`; ctx.lineWidth = 1; G.rr(-w / 2 + .5, -fs + .5, w - 1, fs * 2 - 1, fs); ctx.stroke();
        ctx.fillStyle = `rgb(${col})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1);
        ctx.fillStyle = `rgba(${col},.9)`; ctx.beginPath(); ctx.moveTo(-5, fs + 2); ctx.lineTo(5, fs + 2); ctx.lineTo(0, fs + 8); ctx.fill(); ctx.restore(); }
    }
  };
})();
