/* ==========================================================================
 * 神諭之地 重製版 — 87_story2.js
 * Version : r3.41.0  (2026-11-18)  r3.41.0：汐音加入改成站在河岸下游等你過去（不再接在五平對話後直接演）；進圖有劇情對話時，對話結束 30 秒後才生怪
 * 舊版    : r3.39.0  (2026-11-17)
 * 變更    : r3.39.0 新增。劇情觸發與章節流程整理：
 *           1. 走近觸發：進圖劇情（cut）依站位表改成「人物站在定點、頭上『…』，主角走近 1.6 身高自動對話」（點擊也可以）。
 *              例外（打完直接演的頭目消散劇情、任務圖一進場的劇情、同圖接續的劇情）維持原本進圖觸發。
 *           2. 戰後定點：章節頭目打完不再只有橫幅——頭目（或代表人物）站到定點，走近才開始戰後對話，
 *              對話結束才出「○○ 討伐」橫幅，副標＝下一步。第 1 章（鎌鼬三兄弟＋小太）沿用原 kamaWin 台詞，
 *              第 2、3、4、5、7、8、9、10 章新寫；第 6 章（須佐之男）、第 5 章中頭目茨木沿用既有劇情。
 *              戰後對話是獨立的主線小任務（c?_post），該章後日談（c?_after）等它完成才開始；舊存檔已進入後日談者不受影響。
 *           3. 「第X章 完」：該章頭目已擊敗且主線（含後日談）全部完成時才出；舊存檔開機時已完成的章節不補跳。
 *           4. 劇情援軍：第 6 章八岐（須佐之男「這一次，跟我一起打」）、終章大禍津日（全境動員後：河童大將／九尾／酒吞童子）
 *              以頭目圖集出場，自動追打最近的敵人（傷害以主角攻擊力計），不會被打倒，戰鬥結束退場。
 *           5. 鎌鼬三兄弟：戰後三隻都在巢邊；之後次兄、三弟留在風口護巢灘（長兄由委託標記負責），委託完成後一起搬進妖怪村（58_forge）。
 * 依賴    : 53_quest（Q.add／Q.marks／Q.nearCut 掛點）、59_stage（G.STAGE.find：名字→圖）、26_boss（start／onEnd／enc）、
 *           52_hub（done／chName）、03_actors（damageOni、drawNpc）、06_story_ch1（G.STORY_T1.kamaWin）。
 * 存檔    : flags.kamaBeat（鎌鼬已擊敗、戰後對話未完）、flags.chEnd<c>（第 c 章「完」橫幅已出）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, SC = G.SC, A = G.ANIM, H = G.H, HH = () => G.HERO_H, F = () => G.SAVE.data.flags; if (!Q || !SC) return;
  const say = (who, text) => ({ who, text }), C = k => Q.choice(k);

  /* ======================= 1. 站位表：進圖劇情 → 走近觸發 ======================= */
  // key＝任務id:步驟序（0 起算）；at／dx／dy＝定點；who＝主要人物（名字→圖由 59_stage 解析）；with＝旁邊的人；label＝標記文字
  const NEAR = {
    'c1_after:0': { at: 'home_stand', dx: 40, who: '阿松', with: [{ who: '小太', dx: 46, dy: 6 }] },
    'c1_after:2': { at: 'stone_stand', dx: -90, dy: 30, who: '道摩', label: '封印石旁的人影' },
    'c2_after:0': { at: 'center', dy: -10, who: '五平', with: [{ who: '真穗', dx: 60 }] },
    'c2_after:1': { at: 'east_arrival', dx: -260, dy: 10, who: '汐音', label: '河邊的巫女' },
    'c3_m3:0': { at: 'center', dx: 60, dy: -30, who: '葛葉' },
    'c3_after:0': { at: 'center', who: '狐族長者', with: [{ who: '花澄', dx: 64 }] },
    'c4_after:0': { at: 'center', who: '平八', with: [{ who: '天狗長者', dx: 70 }] },
    'c5_m3:0': { at: 'center', dx: 120, who: '茨木' },
    'c5_after:0': { at: 'center', who: '冬乃', with: [{ who: '鬼族守爐人', dx: 70 }] },
    'c5_after:1': { at: 'torii_arrival', dy: -60, who: '道摩', label: '鳥居外的人影' },
    'c6_after:0': { at: 'center', dx: 150, who: '須佐之男' },
    'c6_after:2': { at: 'hall_stand', dy: 70, who: null, label: '拜殿前的符紙' },
    'c7_m1:3': { at: 'gate', dy: 90, who: '景綱' },
    'c7_m3:1': { at: 'east_arrival', dx: -220, who: '道摩', label: '紙閣外的影子' },
    'c7_after:0': { at: 'center', who: '景綱', with: [{ who: '文也', dx: -64 }, { who: '長壁姬', dx: 70 }] },
    'c8_m2:2': { at: 'center', dx: 220, dy: -30, who: '道摩', label: '密信的主人' },
    'c8_after:0': { at: 'center', who: '酒吞童子', with: [{ who: '茨木', dx: -80 }, { who: '茂兵衛爺', dx: 80 }] },
    'c10_after:0': { at: 'center', who: '汀江' },
    'c10_b_fest:2': { at: 'center', who: '花澄', with: [{ who: '汐音', dx: -64 }] }
  };
  /* ---------- 站位人物 ---------- */
  function stand(spec, x, y, m) { const p = (SC.snap && SC.snap(x, y, 'walk', 120)) || [x, y];
    const nm = spec.who || spec.name, same = n => n && n.name && nm && (n.name === nm || (G.CAST && G.CAST.same(n.name, nm)));
    if (nm) { const here = G.NPC.find(n => same(n) && !n.ally && !(m.sts || []).includes(n)); if (here) { m.reuse = 1; return here; } }   // 地圖上本來就站著這個人 → 直接用他
    if (spec.anim) { const o = { anim: spec.anim, hk: spec.hk || 1, nat: spec.nat || 1, name: spec.name, x: p[0], y: p[1], face: -1 }; G.NPC.push(o); (m.sts = m.sts || []).push(o);
      Promise.resolve(A.load(spec.anim)).then(u => { if (!u || !u.act || m.dead) return; o.u = u; o.clip = u.act[spec.clip] || u.act[Object.keys(u.act).find(k => /idle/.test(k))]; }, () => 0); return o; }
    const f = G.STAGE && G.STAGE.find(spec.who); if (!f) return null;
    if (f.k === 'npc') { const o = { npc: f.npc, name: spec.who, x: p[0], y: p[1], face: -1 }; G.NPC.push(o); (m.sts = m.sts || []).push(o); return o; }
    if (f.k === 'amb') { if (!G.AMB) return null; G.AMB.add(f.u, p[0], p[1], { name: spec.who, hold: true }).then(n => { if (!n) return; if (m.dead) { G.AMB.remove(n); return; } (m.ns = m.ns || []).push(n); n.face = H.x < n.x ? -1 : 1; if (m.spec === spec) m.n0 = n; }); return null; }
    const key = f.key && f.key(); if (!key) return null;
    return stand({ anim: key, clip: f.cn, hk: f.hk || 1, nat: f.nat || 1, name: spec.who }, p[0], p[1], m); }
  function point(c) { const d = SC.def, n = d.nodes || {}, b = n[c.at] || n.center || d.start || [d.w / 2, d.h * 0.66]; return [b[0] + (c.dx || 0), b[1] + (c.dy || 0)]; }
  Q.nearCut = function (q, step, s) { const c = NEAR[q.id + ':' + s.s] || step.near; if (!c) return false; if (!step.text) step.text = c.who ? '和' + c.who + '說話' : '查看' + (c.label || '');
    let [x, y] = point(c); for (let k = 0; k < 4 && Q.marks.concat(G.HUB && G.HUB.marks || []).some(o => o.x > -999 && Math.hypot(o.x - x, (o.y - y) * 1.4) < 70); k++) x += 90;   // 與其他互動點錯開
    const m = { id: q.id + ':near', q, x, y, label: c.label || c.who || '……', kind: c.who ? 'talk' : 'look', qmark: '…', main: !!q.main, near: 1, main0: c };
    m.run = () => { if (m.fired) return; m.fired = 1; G.UI.near = null; const L = typeof step.lines === 'function' ? step.lines() : (step.lines || []); G.DLG.start(L, () => Q.next(q.id)); };
    Q.marks.push(m);
    if (c.who) { m.spec = { who: c.who }; const o = stand(m.spec, x, y, m); if (o) { m.st0 = o; if (m.reuse) { x = m.x = o.x; y = m.y = o.y; } } }
    for (const w of c.with || []) stand(w.anim ? Object.assign({}, w) : { who: w.who }, x + (w.dx || 0), y + (w.dy || 0), m);
    return true; };
  /* 走近觸發（對話中、頭目戰中、轉場中不觸發） */
  const busy = () => G.mode !== 'play' || G.DLG.active() || SC.trans || (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || (G.BOSS && G.BOSS.enc && G.BOSS.enc.done);
  let tk = 0;
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
    if (++tk % 4) return; for (const m of Q.marks) if (m.sts && !m.dead) for (const n of m.sts) if (!G.NPC.includes(n)) G.NPC.push(n);
    if (busy()) return; const R = HH() * SC.depth(H.y) * 2.6;
    for (const m of Q.marks) if (m.near && !m.fired && !m.dead) { const n = m.n0 || m.st0, x = n ? n.x : m.x, y = n ? n.y : m.y; const d = Math.hypot(H.x - x, (H.y - y) * 1.4); if (d >= R) m.armed = 1; else if (d < R && m.armed) { m.run(); break; } } };   // 要從外面走進來才觸發（原地站著可點對話鈕）

  /* ======================= 2. 戰後定點：章節頭目 ======================= */
  const T1 = () => (G.STORY_T1 && G.STORY_T1.kamaWin) || [say('白丸', '先把孩子帶回家。')];
  const POST = [
    { ch: 1, map: 'W_R01_07', need: () => F().kamaBeat && !F().nest, name: '鎌鼬三兄弟', next: '帶小太回藥路水車聚落找阿松',
      near: { at: 'alcove_forecourt', who: null, label: '巢邊的鎌鼬', with: [{ anim: 'b_kama', clip: 'kama1_idle_left3q', hk: 0.62, nat: -1, name: '鎌鼬長兄' }, { anim: 'b_kama', clip: 'kama2_idle_left3q', hk: 0.56, nat: -1, name: '鎌鼬次兄', dx: 64, dy: 14 }, { anim: 'b_kama', clip: 'kama3_idle_left3q', hk: 0.5, nat: -1, name: '鎌鼬三弟', dx: 124, dy: -6 }, { who: '小太', dx: -70, dy: 8 }] },
      lines: () => T1(), done() { F().nest = true; G.HUB && G.HUB.chapterClear(1); } },
    { ch: 2, map: 'W_R02_06', boss: 'boss_W_R02_06', name: '河童大將', next: '回共岸河堤，告訴兩村的人', near: { at: 'center', dx: 140, dy: -20, who: '河童大將' },
      lines: () => [say('河童大將', '（大將背上的黑符化成灰，眼裡的紅光一點一點退去。）……咕……頭好痛。'), say('河童大將', '人類？……是你把那張符撕下來的？'), say('蒼真', '是誰貼的？'),
        say('河童大將', '一個穿黑衣的陰陽師。他說河灣的水，要往他指的地方流。……我不肯，他就把符拍在我背上。'), say('河童大將', '之後的事，我只記得河在哭。田淹了嗎？村子……還在嗎？'),
        C('c2_stone') === 'kappa' ? say('河童長者', '（河童們從蘆葦裡冒出頭來。）大將！村子沒事！是這位人類帶著我們找到封印石的！') : say('白丸', '東村的水閘撐住了。再晚一天，就難說了。'),
        say('河童大將', '……河童欠人類一次。這條河，我會親自導回原來的河道。'), say('河童大將', '告訴兩岸的人——水不是誰的，是大家的。吵架的力氣，留著修橋吧。'),
        say('白丸', '黑衣陰陽師……跟上游被移走的封印石，是同一個人。'), say('蒼真', '先回共岸河堤。五平和真穗還在等消息。')] },
    { ch: 3, map: 'W_R03_05', boss: 'boss_W_R03_05', name: '九尾', next: '回婚列迎賓廳，讓迎親隊重新出發', near: { at: 'center', dx: 150, dy: -30, who: '九尾', with: [{ who: '葛葉', dx: -80, dy: 10 }] },
      lines: () => [say('九尾', '（九條尾巴一條一條收起，狐火在她身邊慢慢熄滅。）……夠了。'), say('九尾', '三百年來，走進這座鳥居的人類，不是想要狐族的寶，就是想要狐族的命。'),
        say('九尾', '你是第一個，打完之後還把刀收著的。'), say('葛葉', '老祖宗，真新娘呢？'), say('九尾', '我讓她睡在最後一座鳥居後面。那個沒有影子的……已經被我的狐火趕出去了。'),
        say('九尾', '牠想混進迎親隊，跟著轎子進神社。牠要帶走的，從來就不是新娘。'), say('蒼真', '……是「器」。'),
        say('九尾', '你知道得不少。'), C('c3_bride') === 'follow' ? say('九尾', '你跟在牠後面看了一路，卻沒有揭穿牠。……是想看清楚牠的主人是誰吧。聰明，但很危險。') : say('九尾', '你在迎親隊裡就揭穿了牠。狐族欠你一份人情。'),
        say('九尾', '葛葉。妳就跟著這個人類吧。狐族的眼睛，總要有一雙看著外面。'), say('葛葉', '……是。'), say('九尾', '去吧。迎親隊還在等。別讓新娘等太久。')] },
    { ch: 4, map: 'W_R04_07', boss: 'boss_W_R04_07', name: '雷獸', next: '回工棚驛站，告訴平八和天狗長者', near: { at: 'center', dx: 150, who: '雷獸' },
      lines: () => [say('雷獸', '（雷獸伏在池邊。身上的七根鐵釘一根根鬆脫，掉進水裡，冒出白煙。）'), say('颯', '這些釘子……是陰陽師的鎮釘。上面刻的符，跟井場那邊的一樣。'),
        say('雷獸', '（低沉的雷聲，像是在說話。）……痛。……很久了。'), say('白丸', '牠說，有人把牠釘在這裡，讓雷往地底下流，好讓井場挖得出雷晶。'),
        say('蒼真', '所以雷原的雷脈會亂，是因為牠被釘住，雷走不出去。'), say('颯', '天狗長者說過，雷獸本來是守這片高原的。被當成野獸釘起來……真是笑話。'),
        C('c4_well') === 'seal' ? say('蒼真', '井已經封了。雷不會再被挖走了。') : say('蒼真', '雷脈改道了。以後井場只取多出來的那一份。'),
        say('雷獸', '（雷獸抬起頭，望向南邊的海崖。尾巴上的電光，變得很柔和。）'), say('雷獸', '（牠用鼻子碰了碰蒼真的手，然後慢慢走進雷雲裡。）'),
        say('白丸', '……牠說謝謝。還說，雷原的天空，以後牠會看著。')] },
    { ch: 5, map: 'W_R05_07', boss: 'boss_W_R05_07', name: '鬼王', next: '把火種帶回炭火共灶街', near: { at: 'center', dx: 150, who: '鬼王' },
      lines: () => [say('鬼王', '（鬼王單膝跪在爐前，火種在黑爐裡忽明忽暗。）……哈。打輸了。'), say('鬼王', '這把火，是我族祖先點起來的。三百年前，人類跟鬼族約好，灶火一起看守。'),
        say('鬼王', '後來人類忘了約定，把鬼趕進山裡。火，也就成了人類的火。'), say('蒼真', '所以你讓人偷走火種？'),
        say('鬼王', '偷火的不是我。是那個黑衣人——他把火種送到我面前，說「拿回屬於你們的東西」。'), say('鬼王', '……我信了。因為我也想拿回來。'),
        C('c5_truth') === 'truth' ? say('鬼王', '你放了權太。一個人類，替一個鬼說了真話。……這種事，我活了五百年才第一次看到。') : say('鬼王', '權太被抓了，對吧。……人類，就是這樣。'),
        say('蒼真', '火種讓我帶回共灶。下一次，灶前留一個位置給鬼族。'), say('鬼王', '……說得好聽。（鬼王把黑爐推了過來。）拿去吧。看看人類這次，守不守得住約。'),
        say('白丸', '黑衣人又是道摩。……他到處點火，自己躲在後面。')] },
    { ch: 7, map: 'R07_OSAKABE_TRIAL', boss: 'boss_R07_OSAKABE_TRIAL', name: '長壁姬', next: '回兩岸城', near: { at: 'center', dx: 140, who: '長壁姬' },
      lines: () => [say('長壁姬', '（十二單衣的袖子散開，紙片像雪一樣落在渡口。）……還是吵。人類，總是這麼吵。'), say('長壁姬', '我在紙閣裡待了四百年。看著外面的人打仗、哭、死，再打仗。'),
        say('長壁姬', '道摩大人說，用紙換掉人，世界就會安靜。紙人不會背叛，也不會離開。'), say('蒼真', '被換掉的人，他們的家人在等。'),
        say('長壁姬', '……（長壁姬看著自己的手。紙做的指尖，正一點一點化開。）'), say('長壁姬', '我只是……不想再一個人，看著大家走掉。'),
        C('c7_paper') === 'seal' ? say('文也', '紙閣的古籍我封起來了，一本都沒燒。妳守了四百年的東西，還在。') : say('文也', '紙閣……燒了。可是我記得裡面寫的字。妳守過的東西，不會全部消失。'),
        say('長壁姬', '還有被換掉的人，睡在城下的紙倉裡。紙人散了，他們就會醒。'), say('長壁姬', '道摩要的是紙閣裡那一頁——寫著「器」的那一頁。……他沒拿到。'),
        say('白丸', '回城吧。景綱他們該醒了。')] },
    { ch: 8, map: 'W_R08_07', boss: 'boss_W_R08_07', name: '酒吞童子', next: '前往曙火寄居地', near: { at: 'center', dx: 150, who: '酒吞童子' },
      lines: () => [say('酒吞童子', '（酒吞倒在山路上，身上的黑氣一縷一縷散開。）……咳……頭……要裂開了。'), say('茨木', '酒吞大人！'), say('酒吞童子', '吵死了，茨木。……我還活著。'),
        say('酒吞童子', '人類。宴上那杯酒，是誰倒的，你知道嗎？'), say('蒼真', '道摩的人。符燒在酒裡。'), say('酒吞童子', '哈……鬼的頭子，被一杯酒放倒。傳出去，要被笑三百年。'),
        C('c8_feast') === 'raid' ? say('酒吞童子', '你帶兵上山的事，我不會忘。……可是今天，你把我從符裡拉出來了。這筆帳，先放著。') : say('酒吞童子', '你在宴上替鬼族說話……我聽到了。打我的時候，你也一刀都沒往要害砍。'),
        say('酒吞童子', '山路上的村民跟我的兵，都受了傷。先讓他們退到曙火寄居地去。'), say('茨木', '我去帶路。……人類，你也來。'),
        say('白丸', '走吧，蒼真。仗打完了，要收拾的才剛開始。')] },
    { ch: 9, map: 'BG_R09_TS01', boss: 'boss_BG_R09_TS01', name: '土蜘蛛', next: '回神社找小雪', near: { at: 'center', dx: 120, who: '八絃' },
      lines: () => [say('八絃', '（巨大的土蜘蛛縮成一團，背上的黑符一張張燒成灰。）……結束了。'), say('八絃', '牠不是壞東西。三百年前，是牠替我們織出第一張封印網。'),
        say('八絃', '道摩在牠的絲裡下了咒。各地的封印絲，全都被牠牽著，往這裡收。'), say('蒼真', '所以各地的封印，才會一個一個鬆掉。'),
        say('八絃', '嗯。網的中心就是這裡。拆了這裡，絲就不會再被拉走。'), say('八絃', '（八絃蹲下來，摸了摸土蜘蛛的腳。）你累了吧。睡一下。剩下的，我來織。'),
        say('白丸', '道摩每一次，都在最後一步之前收手。……他在等什麼。'), say('八絃', '等「器」自己走到他面前。……蒼真，回去看看小雪吧。她最近，臉色不太好。')] },
    { ch: 10, map: 'W_R10_07', boss: 'boss_W_R10_07', name: '綿津見', next: '回泊岸漁港', near: { at: 'center', dx: 150, who: '綿津見' },
      lines: () => [say('綿津見', '（海神的身影被浪花托起。眼裡的怒意，褪成平靜的深藍。）……你的劍，很重。'), say('綿津見', '三百年前，初代的器沉進這片海時，我答應過她——下一個器，我來接。'),
        say('蒼真', '小雪不是誰的東西。她要去哪裡，她自己決定。'), say('綿津見', '……她也是這麼說的。三百年前，一模一樣的話。'),
        C('c10_tide') === 'offer' ? say('綿津見', '寶珠的碎片，我會好好收著。海裡的東西，道摩拿不走。') : say('綿津見', '碎片你拿走吧。拒絕海神的人類……我倒想看看，你能走多遠。'),
        say('綿津見', '潮汐我會還給漁港。三種潮，各歸其位。'), say('綿津見', '人類。夕潮退的時候，到社前來看看海。那是她以前，最喜歡的景色。'),
        say('白丸', '……（白丸難得沒有說話，只是看著海。）'), say('蒼真', '回漁港吧。汀江他們在等潮回來。')] }
  ];
  const PM = {}; for (const p of POST) PM[p.map] = p;
  G.POSTB = { has: id => !!PM[id], POST };
  // 每章一個戰後小任務；該章後日談等它完成。舊存檔：後日談已開始／完成 → 戰後任務不出現
  for (const p of POST) { const id = 'c' + p.ch + '_post', A0 = Q.by['c' + p.ch + '_after'];
    Q.add({ id, ch: p.ch, main: true, postBoss: true, silent: true, title: p.name + '　討伐', reward: {},
      need: () => (p.need ? p.need() : !!F()[p.boss]) && !(A0 && Q.state(A0.id)),
      steps: [{ t: 'cut', map: p.map, text: '和' + (p.near.who || p.name) + '說話', near: p.near, lines: p.lines }],
      done() { p.done && p.done(); G.SAVE.markDirty(); G.STORY.later(10, () => G.UI.banner(p.name + '　討伐', p.next)); } });
    const pq = Q.by[id], pend = () => pq.need() && !Q.isDone(id);   // 戰後對話未完：同圖的頭目委託人先不出現（避免同一人站兩個）
    for (const q of Q.L) if (q.giver && q.giver.map === p.map) { const g0 = q.giver.need; q.giver.need = () => !pend() && (!g0 || g0()); }
    if (A0) { const n0 = A0.need, pn = Q.by[id].need; A0.need = () => (!n0 || n0()) && !(pn() && !Q.isDone(id)); } }   // 戰後對話待完成時，後日談先不開始
  // 第 6 章：須佐之男的戰後劇情（c6_after 第 1 段）演完前，斬蛇劍委託先不出現
  { const q = Q.by.c6_b_sword; if (q && q.giver) { const g0 = q.giver.need; q.giver.need = () => (!g0 || g0()) && (Q.isDone('c6_after') || ((Q.state('c6_after') || {}).s || 0) >= 1); } }
  // 擊敗後：等頭目倒下動畫播完（26：156 格）再建標記
  const B = G.BOSS; if (B) { const oe = B.onEnd; B.onEnd = function (enc) { oe && oe(enc); const sid = SC.id; G.STORY.later(175, () => SC.id === sid && Q.build && Q.build()); }; }

  /* ======================= 3. 「第X章 完」 ======================= */
  let init = false, ck = 0;
  const done = c => G.HUB && G.HUB.done(c) && Q.mainDone(c);
  const st1 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st1(); if (++ck % 60 || !G.SAVE.data || !G.HUB) return;
    if (!init) { init = true; for (let c = 1; c <= 11; c++) if (done(c)) F()['chEnd' + c] = 1; return; }
    if (G.mode !== 'play' || G.DLG.active()) return;
    for (let c = 1; c <= 11; c++) if (!F()['chEnd' + c] && done(c)) { F()['chEnd' + c] = 1; G.SAVE.markDirty(); G.STORY.later(150, () => G.UI.banner(G.HUB.chName(c) + '　完', '回兩岸城，下一段旅程在等你')); break; } };

  /* ======================= 4. 劇情援軍 ======================= */
  const AL = {
    orochi: { when: () => true, list: [{ name: '須佐之男', anim: 'b_susanoo', idle: 'susanoo_p1_idle', walk: 'susanoo_p1_walk', atk: ['susanoo_p1_slash1', 'susanoo_p1_slash2', 'susanoo_p1_overhead'], hk: 1.25, nat: 1, k: 2.0, say: '這一次，跟我一起打！' }] },
    omagatsuhi: { when: () => Q.isDone('c12_m2'), list: [
      { name: '河童大將', anim: 'b_kappa', idle: 'kappataisho_idle_right3q', walk: 'kappataisho_walk_right3q', atk: ['kappataisho_push_right3q', 'kappataisho_spit_right3q'], hk: 1.2, nat: 1, k: 1.5, say: '恩人的事，就是河童的事！' },
      { name: '九尾', anim: 'b_kyubi', idle: 'kyubi_idle_right3q', walk: 'kyubi_run_right3q', atk: ['kyubi_whip_right3q', 'kyubi_cast_right3q'], hk: 1.2, nat: 1, k: 1.5, say: '狐族全員，出陣。' },
      { name: '酒吞童子', anim: 'b_shuten', idle: 'shuten_idle_right3q', walk: 'shuten_walk_right3q', atk: ['shuten_combo_right3q', 'shuten_slam_right3q'], hk: 1.25, nat: 1, k: 1.6, say: '鬼族的帳，今天一起算！', need: () => !!F().oniFriend }] }
  };
  const ALLY = G.ALLY = { list: [] };
  function spawnAllies(id) { const d = AL[id]; if (!d || !d.when()) return; const sid = SC.id; let i = 0;
    for (const a of d.list) { if (a.need && !a.need()) continue; const side = i % 2 ? 1 : -1, x = H.x + side * (80 + 40 * i), y = H.y + (i % 3 - 1) * 26, k = i++;
      const o = { ally: 1, anim: a.anim, def: a, name: a.name, x, y, face: 1, hk: a.hk, nat: a.nat, cd: 60 + k * 25, st: 'idle', t: 0, alpha: 0, sid, k };
      ALLY.list.push(o); G.NPC.push(o);
      Promise.resolve(A.load(a.anim)).then(u => { if (!u || !u.act) return; o.u = u; const L = u.act[a.idle].f.map(f => f[5]).sort((p, q) => p - q); o.vh = L[L.length >> 1] || 200; o.clip = u.act[a.idle]; o.t0 = G.t;
        G.STORY.later(30 + k * 40, () => { if (G.BANTER && G.BANTER.bubble) G.BANTER.bubble(o, a.say); else G.UI.toast(a.name + '：' + a.say); }); }, () => 0); }
    if (i) G.UI.banner('援軍', d.list.filter(a => !a.need || a.need()).map(a => a.name).join('・') + ' 加入戰鬥'); }
  function clear() { if (!ALLY.list.length) return; G.NPC = G.NPC.filter(n => !n.ally); ALLY.list.length = 0; }
  if (B && B.start) { const bs = B.start; B.start = function (id) { const r = bs.apply(this, arguments); clear(); if (r !== null && AL[id]) G.STORY.later(50, () => { if (B.enc && B.enc.id === id) spawnAllies(id); }); return r; }; }
  const alive = e => e && e.st !== 'dead' && e.hp > 0 && !(e.alpha === 0);
  function target(o) { let best = null, bd = 1e9; const heads = G.E.some(e => e.head && alive(e) && !/^(sleep|cut|wake)$/.test(e.s));
    for (const e of G.E) { if (!alive(e) || (heads && !e.head) || e.inv > 30 || (e.head && /^(sleep|cut|wake)$/.test(e.s))) continue; const d = Math.hypot(e.x - o.x, (e.y - o.y) * 1.4); if (d < bd) { bd = d; best = e; } } return best; }
  function allyStep(o) { if (!G.NPC.includes(o)) G.NPC.push(o); if (!o.u) return; o.t++; o.alpha = Math.min(1, o.alpha + 0.05); const a = o.def, u = o.u;
    if (o.st === 'atk') { const ms = (G.t - o.t0) * 16.7, dur = A.dur(o.clip) || 700;
      if (!o.hit && ms >= dur * 0.45) { o.hit = 1; const e = o.tg; if (alive(e) && Math.hypot(e.x - o.x, (e.y - o.y) * 1.4) < HH() * 2 * Math.max(1, e.size || 1)) {
          G.damageOni(e, a.k, true, false, { party: o, atk: Math.max(10, (G.RPG.S && G.RPG.S.atk) || 20), crit: 10, critD: 150 });
          if (G.VX && G.VX.impact) G.VX.impact({ x: e.x, y: e.y, z: 0.6, big: 1 }); G.SC.shake = Math.max(G.SC.shake || 0, 3); } }
      if (ms >= dur) { o.st = 'idle'; o.clip = u.act[a.idle]; o.t0 = G.t; o.cd = 70 + Math.random() * 40; } return; }
    const e = o.tg = target(o); if (o.cd > 0) o.cd--;
    if (!e) { const dx = H.x - 70 * o.face - o.x; if (Math.abs(dx) > 60) { o.x += Math.sign(dx) * 2; o.clip = u.act[a.walk] || u.act[a.idle]; } else o.clip = u.act[a.idle]; return; }
    const many = ALLY.list.length > 1, side = many ? (o.k % 2 ? 1 : -1) : (o.x < e.x ? -1 : 1), tx = e.x + side * HH() * (1.15 + 0.35 * (o.k >> 1)) * (e.bb ? Math.max(1, e.size || 1) : 1), ty = e.y + (many ? (o.k - 1) * 30 : (o.y > e.y ? 14 : -14)), dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
    o.face = e.x > o.x ? 1 : -1;
    if (d > 10) { const s = Math.min(d, 2.6), nx = o.x + dx / d * s, ny = o.y + dy / d * s; if (!SC.walkable || SC.walkable(nx, ny)) { o.x = nx; o.y = ny; } else o.x = nx; o.clip = u.act[a.walk] || u.act[a.idle]; }
    if (d <= 10 || Math.hypot(e.x - o.x, (e.y - o.y) * 1.4) < HH() * 1.6 * Math.max(1, e.size || 1)) { if (d <= 10) o.clip = u.act[a.idle]; if (o.cd <= 0) { o.st = 'atk'; o.hit = 0; o.clip = u.act[a.atk[Math.floor(Math.random() * a.atk.length)]] || u.act[a.idle]; o.t0 = G.t; } } }
  const st2 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st2(); if (!ALLY.list.length) return;
    const enc = B && B.enc; if (!enc || enc.done || SC.id !== ALLY.list[0].sid) { for (const o of ALLY.list) o.alpha -= 0.04; if (ALLY.list.every(o => o.alpha <= 0) || SC.id !== ALLY.list[0].sid) clear(); return; }
    if (G.mode !== 'play' || G.DLG.active()) return; for (const o of ALLY.list) allyStep(o); };
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n.ally) return dn0(n); if (!n.u || !n.clip || n.alpha <= 0) return;
    const s = SC.depth(n.y), sc = HH() * n.hk * s / (n.vh || 200), ms = n.st === 'atk' ? Math.min((G.t - n.t0) * 16.7, (A.dur(n.clip) || 700) - 1) : (G.t - (n.t0 || 0)) * 16.7, fr = A.frameAt(n.st === 'atk' ? n.clip : Object.assign({}, n.clip, { loop: true }), ms), c = G.ctx;
    c.save(); c.globalAlpha = 0.3 * n.alpha; c.fillStyle = '#1e140a'; c.beginPath(); c.ellipse(n.x, n.y, HH() * n.hk * 0.42 * s, HH() * n.hk * 0.11 * s, 0, 0, 6.283); c.fill(); c.restore();
    A.draw(n.u, fr, n.x, n.y, sc, n.face * (n.nat || 1) < 0, n.alpha);
    const y = n.y - HH() * n.hk * s * 1.08; G.txt(n.name, n.x, y - 6, 9, '#bfe3ff', 'center'); };

  /* ======================= 5. 鎌鼬三兄弟留在風口護巢灘 ======================= */
  const KM = [['鎌鼬長兄', 'kama1_idle_left3q', 0.62, 0, 0], ['鎌鼬次兄', 'kama2_idle_left3q', 0.56, 64, 14], ['鎌鼬三弟', 'kama3_idle_left3q', 0.5, 124, -6]];
  let km = [], kt = 0;
  const st3 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st3(); if (++kt % 30) return;
    const want = SC.id === 'W_R01_07' && F().nest && !Q.isDone('c1_b_patrol');
    if (!want) { if (km.length) { G.NPC = G.NPC.filter(n => !km.includes(n)); km = []; } return; }
    for (const n of km) if (!G.NPC.includes(n)) G.NPC.push(n);
    const c = (SC.def.nodes || {}).alcove_forecourt || [790, 578];
    for (const [name, clip, hk, dx, dy] of KM) { if (km.some(n => n.name === name)) continue; if (G.NPC.some(n => n.name === name && !km.includes(n))) continue;   // 長兄若已由委託標記站著就不重複
      const o = { anim: 'b_kama', hk, nat: -1, name, x: c[0] + 110 + dx, y: c[1] + dy, face: -1 }; G.NPC.push(o); km.push(o);
      Promise.resolve(A.load('b_kama')).then(u => { if (u && u.act) { o.u = u; o.clip = u.act[clip]; } }, () => 0); }
    // 委託標記站出長兄 → 移除自己放的長兄
    const dup = km.find(n => n.name === '鎌鼬長兄'); if (dup && G.NPC.some(n => n.name === '鎌鼬長兄' && n !== dup)) { G.NPC = G.NPC.filter(n => n !== dup); km = km.filter(n => n !== dup); } };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { km = []; clear(); return en0(id); };
})();
