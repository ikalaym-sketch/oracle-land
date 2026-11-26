/* ==========================================================================
 * 神諭之地 重製版 — 52_hub.js
 * Version : r3.125.0  (2026-11-26)　r3.125.0：第 1 章插入新圖（停輪匠院、風折觀護台兩段、誓紙回舟灘），一本道 4→8 張
 * 舊版    : r3.104.2  (2026-11-26)　r3.104.2：互動點地上光暈改柔邊漸層
 * 舊版    : r3.100.0  (2026-11-26)　r3.100.0：妖怪村、訓練場等城鎮的目標改成回兩岸城（不再顯示「回到第七章的第一站」）
 * 舊版    : r3.91.0  （r3.91.0：互動點有物件時不畫地上黃圈；探索入口標籤改米白）
 * 舊版    : r3.83.0  (2026-11-25)　r3.83.0：妖怪村入口移到中間道路右側出口
 * 舊版    : r3.55.0  (2026-11-23)　r3.55.0：時雨移到河岸渡口　r3.51.1：時雨選單另存一份（ferTalk），被任務借用後可恢復
 * 舊版    : r3.43.0  (2026-11-18)　r3.43.0：妖怪村入口移到兩岸城東邊路口（橋東側小路）
 * 舊版    : r3.41.0  (2026-11-18)  r3.41.0：時雨人物圖重試延長到 40 次（城裡路人圖較晚載入時不會漏掉）
 * 舊版    : r3.21.0  （r3.21.0：渡口時雨只認傳送役本人）
 * 舊版    : r3.20.0  (2026-11-14)
 * 變更    : r3.20.0 兩岸城加「往妖怪村」；r3.18.x 時雨整合（渡船／任務地點／副本合戰）、驛馬標記隱藏。
 * 變更    : r3.12.0 下一章開場要等上一章主線後日談（如回神社向小雪報告）結束才開演。
 * 變更    : r3.12.0 互動目標優先序修正：任務／章節點優先於路人閒聊與一般劇情點（原本路人先搶走，任務對話觸發不了）。
 * 變更    : r3.11.1 歸城石改由祈願石兼任（24_nav），不再自畫藍色橢圓；導引指向祈願石。章節開場：主角先走到 NPC 面前，就位後才開始對話。
 * 變更    : r3.11.0 新增。以兩岸城為中心的世界結構＋章節開場＋下一步導引：
 *           ・地圖拓撲：神社⇄兩岸城為唯一固定連接；兩岸城不接章節地圖；各章地區內部互通、章與章不相連（第七章兩張圖改為彼此直連）。
 *           ・歸城（祈願石）：各章第一張圖（頭目擊敗後的頭目圖也有）→ 一鍵回兩岸城。
 *           ・渡口（兩岸城）：已開放章節的回訪傳送；主線不靠它，主線由「章節開場」帶路。
 *           ・章節開場：上一章完成後回城／神社自動觸發 → 劇情（NPC 走位）→ 旅途過場卡 → 抵達該章第一張圖。
 *           ・下一步導引：左上目標文字＋畫面目標點；跨圖時指向正確出口，跨章時指向歸城石／渡口。
 * 依賴    : 02_scene、05_dialog、06_story、18_world、20_npc（G.AMB）、24_nav。
 * 存檔    : flags.op<c>（第 c 章開場已演）、flags.clear<c>（第 c 章完成）、flags.ch<c>（沿用：到過第 c 章）。
 * ========================================================================== */
'use strict';
(function () {
  const F = () => G.SAVE.data.flags, SC = G.SC, WD = G.WORLD;
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn });
  const HUB = G.HUB = { card: null, marks: [], ready: false };
  const CH1 = ['W_R01_01', 'W_R01_02', 'W_R01_03', 'W_R01_04', 'W_R01_05', 'W_R01_05B', 'W_R01_06', 'W_R01_07'];
  const NAMES = ['', '杉影之風', '共岸之水', '狐嫁之路', '雷原井場', '共灶熄火', '八岐試煉', '千扇紙閣', '宴盟山路', '八絃蛛窟', '三潮珊庭', '黃泉', '立約'];
  const ids = c => c === 1 ? CH1 : (WD.chapters[c] || []);
  const chOf = id => { if (CH1.includes(id)) return 1; const d = G.D.scenes[id]; return d && !d.hub && !d.dungeon && d.ch ? d.ch : 0; };
  const firstOf = c => ids(c)[0];
  const bossOf = c => { if (c === 1) return 'W_R01_07'; const L = ids(c).filter(i => (G.D.scenes[i] || {}).boss); return L[L.length - 1] || null; };
  HUB.done = c => c === 1 ? !!F().nest : !!(F()['clear' + c] || (bossOf(c) && F()['boss_' + bossOf(c)]));
  HUB.open = c => c === 1 ? !!F().prologue : !!(F()['ch' + c] || F()['op' + c]);
  HUB.cur = () => { for (let c = 1; c <= 12; c++) if (!HUB.done(c)) return c; return 13; };   // 目前主線章節
  HUB.pending = c => c <= 12 && !!OP[c] && !F()['op' + c] && !F()['ch' + c] && (c === 1 ? !F().matsu : HUB.done(c - 1) && (!G.QST || G.QST.mainDone(c - 1)));   // 這一章的開場還沒演；上一章後日談（回報等）都結束才開演
  HUB.chName = c => (WD.CH ? WD.CH[c] : '第' + c + '章') + '　' + NAMES[c];

  /* ---------- 1. 地圖拓撲（開機一次，資料合併完成後） ---------- */
  function relink() {
    const S = G.D.scenes; if (!S.hub_city || !S.hub_shrine || HUB.ready) return; HUB.ready = true;
    S.hub_city.hub = 1;
    const sh = S.hub_shrine.portals.find(p => p.id === 'village'); if (sh) sh.to = 'hub_city';
    S.hub_city.portals = S.hub_city.portals.filter(p => p.id === 'west'); S.hub_city.portals[0].to = 'hub_shrine';
    if (WD.chapters[7]) WD.chapters[7] = WD.chapters[7].filter(i => i !== 'hub_city');
    const a = S.W_R07_01, b = S.W_R07_03;   // 第七章：米埠倉道 ⇄ 雨廊布街 直連
    if (a && b) { const pa = a.portals.find(p => p.to === 'hub_city'), pb = b.portals.find(p => p.to === 'hub_city'); if (pa) pa.to = 'W_R07_03'; if (pb) pb.to = 'W_R07_01'; }
    for (let c = 1; c <= 12; c++) for (const id of ids(c)) { const d = S[id]; if (!d || !d.portals) continue;   // 章與章、章與城之間的出口拿掉
      d.portals = d.portals.filter(p => p.to === 'END' || chOf(p.to) === c); }
  }
  HUB.relink = relink;
  const wl0 = WD.load.bind(WD); WD.load = function () { return wl0().then(r => { relink(); return r; }); };

  /* ---------- 2. 章節開場 ---------- */
  // who 用既有頭像名；npc：[單位, 起點 node 或 [x,y], 終點, 名字]；travel：旅途過場文字
  const OP = {
    1: { at: 'hub_city', npc: [['n_kagetsuna', 'gate', 'center', '景綱'], ['n_t_human_townswoman', 'east_arrival', 'center', '阿松']], travel: '跟著阿松走出城門，沿著藥路往山裡去……', lines: [
      say('景綱', '你就是神社來的蒼真？小雪姑娘的信，我讀過了。'),
      say('景綱', '來得正好。藥路聚落有個孩子，昨晚進山之後就沒回來。'),
      say('阿松', '大人……小太他、他是替我去拿藥的……'),
      say('景綱', '城裡的巡檢只顧得到大路。山裡的事，向來是神社的事。'),
      say('白丸', '（白丸豎起耳朵，望向城門外的山。）……風的味道不對。'),
      say('蒼真', '阿松，帶我去妳家。路上把小太出門前的事，一件一件告訴我。'),
      say('阿松', '好……好！這邊走！')] },
    2: { at: 'hub_city', npc: [['n_sohachi', 'east_arrival', 'center', '渡船夫']], travel: '渡船逆流而上。船夫一路沉默，只在經過斷橋時低聲唸了一句佛號……', lines: [
      say('渡船夫', '（一個渾身濕透的男人撞開人群，跌坐在橋中央。）'),
      say('渡船夫', '橋……共岸的木橋，昨晚被拆了！是河童！我親眼看見的！'),
      say('文也', '河童拆橋？牠們向來只偷黃瓜，從沒傷過人。'),
      say('渡船夫', '兩邊村子已經吵起來了，東村說是西村請的妖怪，西村說是東村……再這樣下去要出人命！'),
      say('小雪', '（小雪按著胸口。）上游的封印……我感覺到「水」在哭。'),
      say('蒼真', '帶我去共岸。我想先聽聽河童怎麼說。'),
      say('渡船夫', '你要跟妖怪講道理？……好，上我的船。')] },
    3: { at: 'hub_city', npc: [['n_t_fox_elder', 'east_arrival', 'center', '狐族長者']], travel: '加入狐族的迎親隊。燈籠一盞盞亮起，隊伍沿著紅葉小徑緩緩前進……', lines: [
      say('文也', '昨夜城裡飄了一整夜的七彩狐火，巡檢們說是吉兆，百姓說是凶兆。'),
      say('狐族長者', '（一位白髮老狐，拄著杖從人群中走出。）兩邊都說對了一半。'),
      say('狐族長者', '三日後是我族狐嫁之期。可這幾天，隊伍裡多了不該在的「東西」。'),
      say('狐族長者', '神社的孩子，老身想請你護送迎親隊，走完狐路。'),
      say('白丸', '狐狸找狗幫忙？……哼，世道真的變了。'),
      say('狐族長者', '呵呵。老身不找狗，找的是懂得聞「假」味道的鼻子。'),
      say('蒼真', '我去。只要隊伍裡有人說謊，白丸會知道。')] },
    4: { at: 'hub_shrine', npc: [], travel: '颯振翅而起，帶著你們越過雲層。腳下的高原，雷光一陣一陣閃爍……', lines: [
      say('小雪', '（清晨，神社的銅鏡碎成三片。小雪臉色蒼白。）'),
      say('小雪', '我夢見一片燒焦的高原……有東西在地底下吼，像是被釘住的野獸。'),
      say('岩藏', '（鍛冶岩藏氣喘吁吁跑上石階。）蒼真！城裡的鐵料斷了！雷原的礦場出事，運鐵的人一個都沒回來！'),
      say('？？？', '（一陣疾風，一個背著信袋的少年落在鳥居上。）喂，誰是蒼真？天狗長者有信給你。'),
      say('颯', '信上寫「雷脈已破，速來」。……我只負責送信，可那邊的路，現在只有飛得過去。'),
      say('蒼真', '那就麻煩你帶路了。'),
      say('颯', '跟緊點。掉下去我可不撿。')] },
    5: { at: 'hub_city', npc: [['n_t_human_guard', 'east_arrival', 'west_arrival', '巡檢孫六'], ['n_t_oni_veteran', 'east_arrival', 'west_arrival', '鬼族守爐人']], travel: '你跟在押送隊伍後面出城。鬼族的守爐人一路回頭，像是在找什麼人……', lines: [
      say('巡檢孫六', '讓開讓開！押送犯人！'),
      say('鬼族守爐人', '（被繩子綁著的鬼族大漢，腳步沉重。）我沒偷。火種是共灶的命，我守了它三十年。'),
      say('巡檢孫六', '榧守炭里的共灶熄了，全村沒火。火種最後一個碰過的人就是你！'),
      say('小雪', '……他身上沒有說謊的氣味。'),
      say('景綱', '蒼真。孫六辦案向來急。這件事，你替我查清楚。'),
      say('鬼族守爐人', '神社的人……求你，去看看炭里的孩子們。沒有火，這個冬天他們撐不過去。')] },
    6: { at: 'hub_shrine', npc: [], travel: '須佐之男的使者垂下一道雲梯。你們一階一階往上爬，城下的燈火越來越小……', lines: [
      say('小雪', '（夜襲過後，神社一片狼藉。小雪抱著一本燒焦的古冊。）'),
      say('小雪', '這是神社最古老的古約……被撕走了三卷。剩下的這一頁，寫著我的名字。'),
      say('蒼真', '妳的名字？那是幾百年前的書。'),
      say('小雪', '不是我……是「器」。歷代的巫女，都叫這個名字。'),
      say('使者', '（一隻白鶴落在拜殿前，化成人形。）須佐之男大人有請。古約的事，雲上的書庫會給你們答案。'),
      say('白丸', '又是神又是約……我只想知道，是誰把小雪的家弄成這樣。')] },
    7: { at: 'hub_city', npc: [['n_fumiya', 'center', 'gate', '文也']], travel: '入夜。你們從城牆的排水口偷偷出城，沿著米埠倉道摸黑前進……', lines: [
      say('景綱', '即日起封城。沒有我的手令，任何人不得出入。'),
      say('文也', '（散會後，文也拉住你，聲音壓得很低。）蒼真大人……你有沒有發現，景綱大人站在燈下，沒有影子。'),
      say('文也', '這幾天，奉行所、私塾、米行，好幾位大人都變得怪怪的。他們說話很客氣，客氣得……像紙一樣。'),
      say('小雪', '紙……我聞到墨的味道。很新的墨。'),
      say('文也', '紙人是從千扇紙閣送來的。可是城門封了，我們出不去。'),
      say('蒼真', '門出不去，就走水路。今晚出發。')] },
    8: { at: 'hub_city', npc: [['n_t_oni_veteran', 'east_arrival', 'center', '鬼族使者']], travel: '你護送人類代表的轎子上山。山路兩旁的楓葉紅得像火，林子裡始終有視線跟著……', lines: [
      say('巡檢孫六', '全員戒備！鬼族！鬼族進城了！'),
      say('鬼族使者', '（高大的鬼族扛著一個酒桶，慢慢走到橋中央，放下。）……酒吞大人有請。'),
      say('鬼族使者', '山裡的仗打了一百年，大人說，夠了。七日後，宴盟山上設宴和談。'),
      say('景綱', '和鬼喝酒？哼……若是陷阱呢？'),
      say('鬼鍛冶權六', '（鬼鍛冶權六走出來。）若是陷阱，我權六第一個砍了他。'),
      say('鬼鍛冶權六', '蒼真，你去。人類裡，只有你會在拔刀之前先聽人說話。')] },
    9: { at: 'hub_city', npc: [['n_hanasumi', 'east_arrival', 'center', '織娘之女']], travel: '絲線在你手中輕輕顫動，一路往北方指去。你們順著它，走向織殿……', lines: [
      say('織娘之女', '（一個小女孩抱著一團會自己蠕動的絲線，哭著跑過橋。）救救我娘！'),
      say('織娘之女', '娘是八絃織殿的織娘……三天前，她織到一半，就被絲線拖走了。'),
      say('葛葉', '這絲……是土蜘蛛的。可是上面有封印的紋路。'),
      say('小雪', '全國的封印……像是被人用線串在一起。這條線的另一端，在拉。'),
      say('蒼真', '別哭了。這團線會帶我們找到妳娘。'),
      say('織娘之女', '（絲線忽然繃直，指向北方。）它……它在動！')] },
    10: { at: 'hub_city', npc: [['n_migiwae', 'east_arrival', 'center', '漁婦']], travel: '水軍的船駛出河口。海面平靜得可怕，船頭的水卻一直往回流……', lines: [
      say('文也', '（城裡的河水忽然倒流，船隻全都擱淺。）河……在往山上流？'),
      say('漁婦', '（一位漁港來的婦人跪在橋頭。）海神大人發怒了！漁港的三種潮汐全亂了，祭司說……要獻上祭品。'),
      say('汐音', '（汐音臉色一變。）祭品……我娘那一代，也有人這樣說過。'),
      say('小雪', '海神要的不是人。祂要的是「能鎮住潮水的東西」。'),
      say('蒼真', '水軍的船還能出海嗎？'),
      say('漁婦', '只有水軍的船能逆著潮走。我帶你們去棧橋。')] },
    11: { at: 'hub_shrine', npc: [], travel: '小雪領著你們走進後山。封印石的裂縫裡吹出冰冷的風，路，一直往下……', lines: [
      say('小雪', '（天，整個暗了。城裡的燈一盞一盞熄滅。）'),
      say('白丸', '這味道……是死人的味道。整座城都是。'),
      say('小雪', '黃泉之氣漫出來了。後山的封印石……已經撐不住了。'),
      say('小雪', '蒼真，這一次，我必須跟你一起下去。'),
      say('蒼真', '太危險了。'),
      say('小雪', '黃泉的門，只有「器」打得開。……也只有「器」關得上。')] },
    12: { at: 'hub_shrine', npc: [], travel: '全員出陣。神社的鐘響了十二聲，你們踏上通往立約殿的最後一段路……', lines: [
      say('小雪', '（神社前，站滿了人和妖怪。）……大家，都來了。'),
      say('狐族長者', '狐族的燈，借你們照路。'),
      say('河童長者', '河裡的事，交給我們。'),
      say('天狗長者', '天上的風，會替你們開道。'),
      say('鬼鍛冶權六', '鬼族的刀，已經磨好了。'),
      say('蒼真', '……謝謝。這一次，人和妖，一起立約。')] }
  };
  HUB.OP = OP;
  function pt(v) { if (Array.isArray(v)) return v; const n = SC.def.nodes || {}; return n[v] || n.center || SC.def.start; }
  function runOpening(c) {
    const o = OP[c]; F()['op' + c] = 1; G.SAVE.markDirty();
    const ns = []; let k = 0;
    const go = () => G.DLG.start([act(() => G.UI.banner(HUB.chName(c), '序幕'))].concat(o.lines), () => travel(c, o.travel, ns));
    if (!o.npc.length || !G.AMB) { go(); return; }
    // 會合點：主角前方約 200px（往地圖中央方向），NPC 走過來會合，不讓主角橫越整張地圖
    const H = G.H, dir = H.x < SC.def.w / 2 ? 1 : -1, sn = (x, y) => (SC.snap && SC.snap(x, y, 'open', 120)) || [x, y], meet = sn(H.x + dir * 200, H.y);
    for (const [u, a, b, name] of o.npc) { const dx = (k++) * 46, p0 = pt(a), p = Math.hypot(p0[0] - meet[0], p0[1] - meet[1]) < 420 ? p0 : sn(meet[0] + dir * (260 + dx), meet[1] + 10),   // 起點太遠：改從前方畫面外走進來
      q = sn(meet[0] + dir * dx, meet[1] + (k % 2 ? 0 : 14));
      G.AMB.add(u, p[0], p[1], { name, hold: true }).then(n => { if (!n) return; ns.push(n); n.st = 'walk'; n.tx = q[0]; n.ty = q[1]; n.spd0 = n.spd; n.spd = 2.0; n.march = 1;   // 開場走位：加快、靠近主角不停下
        n.onArrive = m => { m.hold = true; m.arrived = 1; m.march = 0; m.spd = m.spd0; m.face = G.H.x < m.x ? -1 : 1; }; }); }
    // 走位：主角也走到 NPC 面前；NPC 走進畫面（約 1.8 秒）且主角就位後才開口
    // 主角就位＋所有 NPC 走到會合點（最多等 6 秒）才開口；開口時主角轉向 NPC
    let hOk = false, said = false, w = 0; const ready = () => ns.length === o.npc.length && ns.every(n => n.arrived);
    const poll = () => { if (said) return; w++; if (hOk && (ready() || w > 180)) { said = true; if (ns[0]) G.H.face = ns[0].x < G.H.x ? -1 : 1; go(); } else G.STORY.later(2, poll); };   // 2：避免在同一輪 timers 迴圈內立即再觸發
    const tryGo = () => { hOk = true; };
    const hq = sn(H.x + dir * 90, H.y); G.STORY.later(30, poll);
    if (G.STORY.walk) G.STORY.walk([{ ent: 'hero', x: hq[0], y: hq[1], face: dir }], tryGo); else tryGo();
  }
  function travel(c, text, ns, to) { const T = G.D.scenes[to]; if (T && T.quest) G.SAVE.data.qret = SC.id; HUB.card = { t: 0, text, title: c ? HUB.chName(c) : ((G.D.scenes[to] || {}).name || ''), to: to || firstOf(c), ns }; }
  HUB.travel = travel;
  /* 過場卡：淡入 → 文字 → 進入該章第一張圖 → 淡出 */
  function cardStep() { const K = HUB.card; if (!K) return; K.t++; G.IN.stick = null; G.IN.mx = G.IN.my = 0;
    if (K.t === 60) { for (const n of K.ns || []) G.AMB && G.AMB.remove(n); if (K.to && G.D.scenes[K.to]) SC.trans = { t: 0, to: K.to, at: null }; }   // 走一般換圖流程（含素材載入等待）
    if (K.t > 60 && SC.trans) K.t = Math.min(K.t, 100);   // 地圖還在載入：卡片停在全黑
    if (K.t > 170 || (K.t > 110 && K.skip)) HUB.card = null; }
  HUB.skipCard = () => { if (HUB.card) HUB.card.skip = true; };
  function cardDraw() { const K = HUB.card; if (!K) return; const ctx = G.ctx, a = K.t < 40 ? K.t / 40 : K.t > 140 ? Math.max(0, (170 - K.t) / 30) : 1;
    ctx.save(); ctx.fillStyle = `rgba(8,6,10,${Math.min(1, a * 1.1)})`; ctx.fillRect(0, 0, G.LW, G.LH); ctx.globalAlpha = Math.min(1, a);
    G.txt(K.title, G.LW / 2, G.LH * 0.4, 18, G.C.gold, 'center', G.FONT, 900);
    G.txt(K.text, G.LW / 2, G.LH * 0.52, 12, G.C.ink, 'center', G.FONT_S, 700); ctx.restore(); }

  /* ---------- 3. 章節完成 ---------- */
  HUB.chapterClear = function (c) { F()['clear' + c] = 1; G.SAVE.markDirty(); G.SAVE.flush();
    G.UI.banner(HUB.chName(c) + '　完', '到祈願石回兩岸城，下一段旅程在城裡等你'); };

  /* ---------- 4. 互動點：歸城石、渡口 ---------- */
  HUB.stoneHere = id => { const c = chOf(id); return !!(c && F().prologue && (id === firstOf(c) || (id === bossOf(c) && HUB.done(c)))); };
  HUB.goCity = () => { SC.trans = { t: 0, to: 'hub_city', at: null }; };
  function buildMarks(id, fresh) { const d = SC.def, L = []; const c = chOf(id);
    if (HUB.stoneHere(id) && G.NAV && G.NAV.ensureStone) G.NAV.ensureStone();   // 歸城＝祈願石（24_nav 擺放與互動）
    if (d.quest) { const s = d.start || pt('center'), back = G.SAVE.data.qret && G.D.scenes[G.SAVE.data.qret] ? G.SAVE.data.qret : 'hub_city';   // 任務地圖：返回原處
      L.push({ id: 'back', x: s[0] + 80, y: s[1], label: '返回・' + ((G.D.scenes[back] || {}).name || '兩岸城'), kind: 'look', run: () => G.DLG.start([{ choice: [
        { label: '回去', then: [act(() => travel(0, '你們沿著來時的路回去……', [], back))] }, { label: '留下', then: [] }] }]) }); }
    if (false && id === 'hub_mountain' && F().prologue) {   // r3.18.4：後山與封印禁林合併，不再需要「往封印禁林」
      const n = (d.nodes || {}).stone_stand || pt('center'); L.push({ id: 'seal', x: n[0] - 260, y: n[1] + 120, label: '往封印禁林', kind: 'look', run: () => travel(0, '小雪提著燈，帶你們走進後山深處……', [], 'Q_field_seal_forest') }); }
    if (id === 'hub_city') { const g = pt('center'), FP = (SC.snap && SC.snap(1205, 790, 'open', 160)) || [1205, 790];   // r3.55.0：時雨移到河岸渡口（原本擠在中央路口）
      L.push({ id: 'ferry', hide: 1, x: FP[0], y: FP[1], label: '渡口・時雨', kind: 'talk', main: false, run: ferry });
      if (G.D.scenes.T_yokai) { const ea = (d.nodes || {}).east_arrival || [1560, 640], w = (SC.snap && SC.snap(ea[0] + 50, ea[1] - 15, 'open', 120)) || [ea[0] + 40, ea[1] - 15]; L.push({ id: 'yokai_path', x: w[0], y: w[1], label: '往妖怪村・東邊出口',   /* r3.83.0：入口移到中間道路右側出口（立牌處），不放橋邊 */ kind: 'look', main: false, run: () => G.DLG.start([say('', '林間小路通往妖怪們聚居的木靈谷。'), { choice: [{ label: '前往妖怪村', then: [act(() => { G.SC.trans = { t: 0, to: 'T_yokai', at: null }; })] }, { label: '不了', then: [] }] }]) }); }   // r3.20.0
      const mvSg = k => { const sg = G.AMB && G.AMB.list.find(n => /時雨/.test(n.name || '') && !n.qk && n.shop);   /* r3.21.0：只認城裡的傳送役時雨，不抓任務生成的同名 NPC */ if (sg) { if (!sg.fer) { sg.fer = 1; sg.x = FP[0]; sg.y = FP[1]; sg.hold = true; sg.st = 'idle'; sg.face = -1; sg.onTalk = sg.ferTalk = n => G.DLG.start([say('時雨', '渡船、任務地點、副本合戰，都可以找我。'), { choice: [{ label: '渡船（章節地圖）', then: [act(ferry)] }, { label: '任務地點', then: [act(tripMenu)] }, { label: '前往副本／合戰', then: [act(() => G.WARP && G.WARP.open(n))] }, { label: '離開', then: [] }] }]); } } else if (k < 40 && G.SC.id === 'hub_city') G.STORY.later(60, () => mvSg(k + 1)); }; mvSg(0); }   // r3.18.0：時雨人物圖
    HUB.marks = fresh ? L : L.concat(HUB.marks.filter(m => m.q || m.id === 'gate' || /^trip:/.test(m.id))); }
  HUB.travelTo = (to, text) => travel(0, text, [], to);
  function tripMenu() { const L = (HUB.marks || []).filter(m => m.trip).map(m => ({ label: m.label.replace(/^驛馬・/, ''), then: [act(() => m.trip())] }));
    if (!L.length) { G.DLG.start([say('時雨', '目前沒有接到需要前往特殊地點的任務。')]); return; }
    G.DLG.start([say('時雨', '任務要去的地方，我送你過去。'), { choice: L.slice(0, 6).concat([{ label: '不了', then: [] }]) }]); }
  function ferry() { const L = []; for (let c = 1; c <= 12; c++) if (HUB.open(c) && G.D.scenes[firstOf(c)]) L.push({ label: HUB.chName(c) + (HUB.done(c) ? '（已完成）' : ''), then: [act(() => travel(c, '渡船載著你們離開兩岸城……', []))] });
    if (!L.length) { G.DLG.start([say('時雨', '現在還沒有能送你去的地方。等你踏上旅途，我就能替你記下路。')]); return; }
    L.push({ label: '不了', then: [] });
    G.DLG.start([say('時雨', '要去哪一章？我送你到那一章的第一站。'), { choice: L.slice(-7) }]); }
  HUB.ferry = ferry;

  /* ---------- 5. 下一步導引 ---------- */
  // 回傳 { text, x, y, label } 或 null；只在「劇情沒有給目標」時接手
  let gCache = null, gKey = '';
  function exitTo(goalMap) {   // 同一章：BFS 找下一個出口（快取到換圖或進度改變為止）
    const S = G.D.scenes, seen = { [SC.id]: null }, Q = [SC.id];
    while (Q.length) { const id = Q.shift(); if (id === goalMap) break; for (const p of (S[id] || {}).portals || []) if (S[p.to] && !(p.to in seen)) { seen[p.to] = id; Q.push(p.to); } }
    if (!(goalMap in seen)) return null; let id = goalMap, steps = 0; while (seen[id] !== SC.id && seen[id] !== null) { id = seen[id]; steps++; }
    const p = SC.def.portals.find(q => q.to === id); return p ? { p, steps: steps + 1 } : null; }
  function portalXY(p) { if (p.rect) return [(p.rect[0] + p.rect[2]) / 2, p.rect[1] - 16]; const x = p.line[0][0] + (p.id === 'west' ? 60 : -60), y = (p.line[0][1] + p.line[1][1]) / 2; return [x, y]; }
  function goal() {
    const id = SC.id, c = HUB.cur(), key = id + '|' + c + '|' + (F()['op' + c] ? 1 : 0) + '|' + HUB.marks.length + '|' + (G.NAV ? G.NAV.list.length : 0);
    if (key === gKey) return gCache; gKey = key; gCache = null;
    if (c > 12 || !F().prologue) return null;
    const here = chOf(id), stone = HUB.stoneHere(id) && G.NAV && G.NAV.list.find(o => o.save);
    const toCity = () => stone ? { text: '到祈願石回兩岸城', x: stone.x, y: stone.y, label: '祈願石' } : null;
    if (id === 'hub_shrine') { const p = SC.def.portals.find(q => q.to === 'hub_city'); const [x, y] = p ? portalXY(p) : [0, 0];
      return (gCache = p ? { text: HUB.pending(c) && OP[c].at === 'hub_shrine' ? '在神社休息一下（劇情即將開始）' : '穿過鳥居，前往兩岸城', x, y, label: '兩岸城' } : null); }
    if (id === 'hub_city') { const f = HUB.marks.find(m => m.id === 'ferry');
      if (HUB.pending(c) && OP[c].at === 'hub_shrine') { const p = SC.def.portals.find(q => q.to === 'hub_shrine'); if (p) { const [x, y] = portalXY(p); return (gCache = { text: '回神社看看小雪', x, y, label: '神社' }); } }
      return (gCache = f ? { text: '到渡口找時雨，前往' + HUB.chName(c), x: f.x, y: f.y, label: '渡口' } : null); }
    const sd = SC.def || {}; if (sd.safe || id === 'T_yokai' || id === 'D_TRAIN') {   // r3.100.0：妖怪村等城鎮不屬於章節路線，一律指回兩岸城
      const p = (sd.portals || []).find(q => q.to === 'hub_city') || (sd.portals || []).find(q => q.to === 'T_yokai'); if (p) { const [x, y] = portalXY(p); return (gCache = { text: '回兩岸城，前往' + HUB.chName(c), x, y, label: (G.D.scenes[p.to] || {}).name || p.to }); } }
    if (!here) return null;
    if (here !== c || HUB.done(here)) return (gCache = toCity() ? Object.assign(toCity(), { text: here !== c ? '這一章已告一段落：到祈願石回兩岸城' : '到祈願石回兩岸城' }) : { text: '回到' + HUB.chName(here) + '的第一站，在祈願石回城' });
    return null;   // 本章進行中：交給劇情／既有「往東前進」
  }
  HUB.goal = goal; HUB.chOf = chOf; HUB.bossOf = bossOf; HUB.firstOf = firstOf; HUB.exitTo = exitTo; HUB.portalXY = portalXY; HUB.ids = ids;
  const ob0 = G.STORY.objective.bind(G.STORY), tg0 = G.STORY.target.bind(G.STORY);
  // 劇情腳本（06 的各圖 obj）有自己的目標時優先；其次 HUB／任務導引；最後才是「往東前進」
  const own = () => { const s = G.STORY.scnObj && G.STORY.scnObj(); return s || ''; };
  G.STORY.objective = function () { const o = own(); if (o) return o; const g = HUB.goal(); if (g) return g.text; return ob0(); };
  G.STORY.target = function () { if (own()) return tg0(); const g = HUB.goal(); if (g && g.x !== undefined) return { x: g.x, y: g.y, label: g.label }; return g ? null : tg0(); };

  /* ---------- 6. 接上遊戲迴圈 ---------- */
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { relink(); en0(id); buildMarks(id, true); gKey = ''; lastDone = null;
    const c = HUB.cur();
    if ((id === 'hub_city' || id === 'hub_shrine') && F().prologue && HUB.pending(c) && OP[c].at === id)
      G.STORY.later(c === 1 ? 50 : 40, () => { if (SC.id === id && !G.DLG.active()) runOpening(c); }); };
  const st0 = G.STORY.step.bind(G.STORY);
  let lastDone = null;
  G.STORY.step = function () { st0();
    const ch = chOf(SC.id); if (ch) { const dn = HUB.done(ch); if (dn !== lastDone) { lastDone = dn; buildMarks(SC.id); gKey = ''; } }   // 頭目剛擊敗：補上歸城石
    if (G.DLG.active() || HUB.card) return; const cur = G.UI.near; if (cur && HUB.marks.includes(cur)) return; let best = 70, pick = null;
    const Q = G.QST; for (const m of HUB.marks) { if (m.hide || (Q && m.q && Q.shadowed && Q.shadowed(m))) continue; const d = Math.hypot(G.H.x - m.x, (G.H.y - m.y) * 1.6); if (d >= 70) continue;
      const sc = d - (m.q && Q.pri ? Q.pri(m) * 10 + 15 : 0); if (sc < best) { best = sc; pick = m; } }   // 範圍內：任務點（主線＞對話目標＞委託）優先，其次距離
    if (pick && (!cur || cur.amb || pick.q || pick.main)) G.UI.near = pick; };   // 任務點一律優先；其他 HUB 點只蓋過路人
  const it0 = G.STORY.interact.bind(G.STORY);
  G.STORY.interact = function (m) { if (HUB.marks.includes(m)) { G.UI.near = null; m.run(); return; } it0(m); };
  /* 互動點外觀：沿用劇情標記畫法（暫時把 HUB 的點餵給它） */
  const dm0 = G.STORY.drawMarks.bind(G.STORY);
  G.STORY.drawMarks = function () { dm0(); const ctx = G.ctx, Z = SC.zoom();
    for (const m of HUB.marks) { if (m.hide) continue; const a = 0.55 + 0.45 * Math.sin(G.t * 0.1), ex = /^ex[:_]/.test(m.id), col = ex ? '236,226,206' : '255,214,120';
      if (!m._obj) { const rx = 24 + a * 5, ry = 7.5 + a * 2; ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, ry / rx); const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gg.addColorStop(0, `rgba(${col},${0.22 + 0.2 * a})`); gg.addColorStop(0.6, `rgba(${col},${0.12 + 0.12 * a})`); gg.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore(); }   // r3.104.2：柔邊（不畫硬邊橢圓）   // r3.91.0：有物件（路標、調查物）就不畫地上黃圈；探索入口文字改米白
      const ly = m.y - G.HERO_H * 1.0; ctx.save(); ctx.translate(m.x, ly); ctx.scale(1 / Z, 1 / Z); const fs = 12 * G.FS(), lab = '◇ ' + m.label;
      ctx.font = `900 ${fs}px ${G.FONT_S}`; const w = ctx.measureText(lab).width + 16; ctx.fillStyle = G.UI.near === m ? 'rgba(150,92,36,.95)' : 'rgba(12,8,10,.78)';
      G.rr(-w / 2, -fs, w, fs * 2, fs); ctx.fill(); ctx.fillStyle = `rgb(${col})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1); ctx.restore(); } };
  let cT = -1; const card = () => { if (cT !== G.t) { cT = G.t; cardStep(); } cardDraw(); };   // 過場卡每幀推進一次（UI／對話／選單任一繪製路徑都會呼叫）
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); card(); };
  const dd0 = G.DLG.draw.bind(G.DLG); G.DLG.draw = function () { dd0(); card(); };
  // 過場卡期間：點擊＝加速；不把點擊傳給遊戲（捕獲階段攔下）
  window.addEventListener('pointerdown', e => { if (HUB.card) { HUB.skipCard(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
})();
