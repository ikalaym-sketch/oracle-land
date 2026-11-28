/* ==========================================================================
 * 神諭之地 重製版 — 166_heart4.js
 * Version : r3.219.0  (2026-11-28)　r3.219.0：新增。源賴光、建御雷、役小角的心事重寫（操作段、抉擇）與解開後的回響
 * 內容    : 1. 源賴光「童子切的重量」：山路宿場的石塔與酒甕 → 鬼宴會場對飲（三句限時問答，不答＝沉默）→ 原本的抉擇 pt_yori（獎勵不變）。
 *           2. 建御雷「雷神的誓」：雷原 → 慢慢靠近小雷獸（衝刺、出招或沒停就往前會嚇到牠，重來）→ 取名（qc.rai_name）→ 守 30 秒 → 結尾抉擇。
 *           3. 役小角「前鬼與後鬼」：橋頭的便當 → 打醒兩人（依血量喊話）→ 撕符，兩人選擇留下（qc.enno_end = choose｜meal）。
 *           4. 回響：接在 164 的回響清單後面；結局片段。
 * 依賴    : 163_heart、164_heart2、153_side3（G.SIDE3.fight）、53_quest、05_dialog、88_rune（G.AFX）。
 * 存檔    : qc.yori_a／yori_q1～3／pt_yori；qc.takemi_a／rai_name／takemi_end；qc.enno_a／enno_end；flags.he_<回響編號>。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, PY = G.PARTY, SC = G.SC, H = G.H, HT = G.HEART; if (!Q || !PY || !HT) return;
  const F = () => G.SAVE.data.flags, say = Q.say, nar = t => say('', t), act = fn => ({ do: fn });
  const qc = () => (G.SAVE.data.qc = G.SAVE.data.qc || {}), setC = (k, v) => act(() => { qc()[k] = v; G.SAVE.markDirty(); }), C = k => qc()[k];
  const inP = id => !!(PY.list && PY.list.some(p => p && p.id === id)), later = (n, f) => G.STORY.later(n, f), D = id => Q.isDone(id);
  const pick = (label, k, v, lines) => ({ label, then: [setC(k, v)].concat(lines) });
  /* 限時選項：tl 格內沒選＝走 silent */
  const TM = {}, timed = (opts, silent) => { TM[opts[0].label] = silent; return { choice: opts }; };   /* 以第一個選項的字認（對話清單會被其他模組複製，不能掛屬性） */
  let TL = null; const tmOf = () => { const ch = G.DLG.choice, k = ch && ch[0] && ch[0].label; return k && TM[k] ? k : null; };

  /* ============================ 源賴光 ============================ */
  const ROAD = 'W_R08_04'; let quiet = 0;
  { const q = Q.by.pt_yorimitsu, s0 = q && q.steps[0]; if (q && s0) { q.desc = '源賴光說，有一筆舊帳想親自去算。';
    const L0 = s0.lines, askQ = (k, t, a, b) => [say('酒吞童子', t), timed([pick(a, k, 'a', []), pick(b, k, 'b', [])], [setC(k, 'none'), act(() => { quiet++; }), nar('（賴光沒有回答。杯子裡的酒，晃了一下。）')])];
    s0.lines = () => [say('酒吞童子', '……源賴光。'), say('源賴光', '酒吞童子。'), nar('（兩個人隔著篝火對望。周圍的鬼族，一下子全安靜了。）'), say('酒吞童子', '三百年前，你帶著四天王上山，在酒裡下了毒，砍了我的頭。'), say('源賴光', '……是。'),
      say('酒吞童子', '我不氣你砍我。打輸了，頭給你，天經地義。'), say('酒吞童子', '我氣的是那杯酒。你坐在我的席上，喝我的酒，叫我一聲「主人家」——然後下毒。'),
      nar('（酒吞倒了一杯酒，推過去。）'), say('酒吞童子', '這杯，跟那晚一樣。我沒下毒。你敢不敢喝？'), nar('（賴光端起了杯子。酒吞開口問，她只有一口酒的時間可以回答。）'), act(() => { quiet = 0; })]
      .concat(askQ('yori_q1', '那一晚，你有沒有猶豫？', '「沒有。」', '「有。」'), askQ('yori_q2', '再來一次，你還砍不砍？', '「砍。」', '「不知道。」'), askQ('yori_q3', '你恨不恨鬼？', '「恨過。」', '「不恨。」'))
      .concat([{ do: () => { const D2 = G.DLG; D2.list.splice(D2.i, 0, ...(quiet ? [say('酒吞童子', '答不出來？'), say('酒吞童子', '……也好。比說謊強。')] : [say('酒吞童子', '……哈。'), say('酒吞童子', '至少這次，你是看著我的眼睛喝的。')])); } },
        say('源賴光', '那時候，我相信鬼就是要斬的。童子切砍下去的時候，我一點都沒有猶豫。'), say('源賴光', '（賴光轉向你。）蒼真，這一刀……我該道歉嗎？')]);
    const tail = [nar('（回程的山路上，賴光在第五座石塔前停了下來。）'), say('源賴光', '蒼真殿。這座塔，我不刻了。'), say('源賴光', '刀還有要砍的東西。等砍完，再說。')];
    for (const o of s0.opts || []) { const l0 = o.lines || []; o.lines = l0.concat(o.v === 'sorry' ? [say('源賴光', '不是為那一刀。是為那杯酒。'), say('酒吞童子', '……這句，才對。')] : [say('源賴光', '但是酒吞。下次我上山，走正門，報本名。'), say('酒吞童子', '哼。那我就開門，擺兩個杯子。')]).concat(tail); }
    q.steps = [{ t: 'look', map: ROAD, at: 'center', dx: -220, label: '路邊的石塔', text: '陪賴光走大江山的舊山道（1／2）', lines: [nar('（路邊有五座小石塔。四座刻了名字，一座沒有。）'), say('源賴光', '綱、金時、貞光、季武。我的四天王。'), say('源賴光', '第五座是我的。我自己立的。還沒刻字。'),
        { choice: [pick('為什麼給自己立塔？', 'yori_a', 'why', [say('源賴光', '砍下酒吞的頭那晚，我就該死在山上。'), say('源賴光', '……只是沒死成。')]), pick('他們，是怎麼走的？', 'yori_a', 'how', [say('源賴光', '老死的。在榻上。'), say('源賴光', '……只有我，被神留了下來，繼續當刀。')])] }] },
      { t: 'look', map: ROAD, at: 'center', dx: 240, label: '草裡的酒甕', text: '陪賴光走大江山的舊山道（2／2）', lines: [nar('（草叢裡倒著一只酒甕。甕口的封泥，早就裂了。）'), say('源賴光', '神便鬼毒酒。人喝了長力氣，鬼喝了動不了。'), say('源賴光', '那一晚，我們扮成迷路的山伏。酒吞開了門，給我們肉，給我們位子。'),
        say('源賴光', '他把我們當客人。'), say('源賴光', '我把他當獵物。'), say('小雪', '……賴光大人，妳的手握得好緊。')] }, s0]; } }

  /* ============================ 建御雷 ============================ */
  const RAI = 'W_R04_05', NAMES = ['小鳴', '豆雷', '閃閃'], RN = () => C('rai_name') || '小雷獸'; let AP = null;
  function apRun(q, done) { G.DLG.start([nar('（建御雷往前走了一步。小雷獸「嗶」地一聲，縮得更裡面了。）'), say('建御雷', '…………'), say('建御雷', '蒼真。我不能過去。你去。'),
      { choice: [pick('你想讓我跟牠說什麼？', 'takemi_a', 'say', [say('建御雷', '說……那個很大的、很吵的，不會打牠。')]), pick('你自己說啊。', 'takemi_a', 'self', [say('建御雷', '我一開口就打雷。'), say('小雪', '……建御雷大人，你剛剛已經很小聲了。'), say('建御雷', '……是嗎。')])] },
      nar('（慢慢走過去。每靠近一段，就停下來等牠。衝刺、出招，或是沒停就往前，都會嚇到牠。）')], () => { if (SC.id !== RAI) return; if (G.AFX) G.AFX.pre(['b_raiju']); G.E.length = 0;
    const c = (SC.def.nodes && SC.def.nodes.center) || [836, H.y], tx = Math.max(H.x + 520, c[0] + 200), ty = c[1];
    AP = { done, x: tx, y: ty, st: [H.x, H.y], k: 0, still: 0, lx: H.x, ly: H.y, jit: 0, fx: 0 }; G.UI.banner('靠近小雷獸', '用走的，每一段都停下來等牠'); }); }
  const RING = [380, 250, 120];
  function apFx() { if (!G.AFX || !G.AFX.ok('b_raiju', 'raijuo_idle_right3q')) return; const a = AP; a.fx = 1;
    G.AFX.play('b_raiju', 'raijuo_idle_right3q', { at: () => AP === a ? [a.x + (a.jit > 0 ? Math.sin(G.t * 1.7) * 3 : 0), a.y, 0] : null, size: () => G.HERO_H * 0.5 * SC.depth(a.y), by: 'h', anc: 'b', flip: true, loop: 600, tpf: 7, fb: () => { } }); }
  function apStep() { const a = AP; if (SC.id !== RAI) { AP = null; return; } if (G.DLG.active() || SC.trans) return; if (G.E.length) G.E.length = 0; if (!a.fx) apFx(); if (a.jit > 0) a.jit--;
    const d = Math.hypot(H.x - a.x, H.y - a.y), sp = Math.hypot(H.x - a.lx, H.y - a.ly); a.lx = H.x; a.ly = H.y; a.still = sp < 0.3 ? a.still + 1 : 0;
    const busy = H.st !== 'idle' && H.st !== 'walk', scare = busy || sp > 7 || d < RING[a.k] - 70;
    if (scare && d < 520) { a.k = 0; a.still = 0; a.jit = 60; H.x = a.st[0]; H.y = a.st[1]; a.lx = H.x; a.ly = H.y; for (const P of PY.list || []) { P.x = H.x - 30; P.y = H.y + 6; } G.UI.toast('小雷獸嚇得縮了回去。……慢慢來'); return; }
    if (d <= RING[a.k] && a.still >= 55) { a.still = 0; a.k++;
      if (a.k === 1) G.UI.toast('小雪：「慢一點……牠在看你的手。」'); else if (a.k === 2) G.UI.toast('建御雷（遠遠地）：「……牠的耳朵，跟牠爹一樣，尖的。」');
      else { AP = null; G.DLG.start([nar('（你伸出手。小雷獸聞了聞，舔了一下。）'), say('蒼真', '牠不怕人。牠只是怕雷聲。'), say('建御雷', '…………'), say('建御雷', '那我，一輩子都靠近不了。'), say('小雪', '先幫牠取個名字吧。有名字，就不是「那隻雷獸」了。'),
          { choice: NAMES.map(n => pick(n, 'rai_name', n, [])) }, { do: () => { const D2 = G.DLG; D2.list.splice(D2.i, 0, say('建御雷', '……' + RN() + '。'), nar('（建御雷很小聲、很小聲地，唸了一次。）')); } }, say('小雪', '啊——雷妖！牠們聞到' + '牠身上的雷了！')], a.done); } } }
  { const q = Q.by.pt_takemi; if (q) { const c0 = q.steps[0], h0 = q.steps[1];
    h0.text = '守住小雷獸 30 秒'; h0.lines = () => [say('建御雷', '雷妖們要來搶牠了。牠身上的雷，還很純。'), say('建御雷', '蒼真，幫我守住牠。不用讓牠喜歡我。'),
      act(() => { later(90, () => { if (SC.id === RAI) G.UI.toast('建御雷：「' + RN() + '！不要看我！看蒼真！」'); }); later(60 * 21, () => { if (SC.id === RAI && Q.hold && Q.hold.q === q) { G.UI.toast('建御雷用背擋下了劈向' + RN() + '的雷：「——這種雷，不痛。」'); SC.shake = 6; } }); })];
    q.steps = [{ t: 'cut', map: RAI, lines: [nar('（一隻只有貓那麼大的小雷獸，躲在岩石後面，全身的毛都豎起來了。）'), say('建御雷', '……就是牠。我一靠近，牠就發抖。'), say('建御雷', '雷獸王是我的舊識。我把牠跟雷脈一起封起來的時候，這孩子還在蛋裡。'), say('建御雷', '牠大概記得，是我讓牠的爹再也沒回來。'), say('小雪', '建御雷大人……')] },
      { t: 'fn', map: RAI, text: '慢慢靠近岩石後的小雷獸', run: apRun }, h0,
      { t: 'cut', map: RAI, lines: () => [nar('（雷妖散了。' + RN() + '從岩石後面探出頭，看看你，又看看建御雷。）'), nar('（然後牠慢慢走過去，用頭蹭了蹭建御雷的腳。）'), say('建御雷', '（建御雷蹲下來，小心翼翼地伸出手。他的手指在發抖。）'), say('建御雷', '牠……不怕了？'),
        { choice: [pick('因為你剛才替牠擋雷，沒有出聲。', 'takemi_end', 'quiet', [say('建御雷', '……原來，不出聲也可以。'), say('建御雷', '我當了幾千年的雷。第一次知道。')]),
          pick('牠只是發現，你比牠還緊張。', 'takemi_end', 'nervous', [say('建御雷', '我沒有緊——'), nar('（' + RN() + '打了個噴嚏，冒出一點電。建御雷整個人彈了一下。）'), say('小雪', '（小雪笑出了聲。）'), say('建御雷', '……有一點。')])] },
        say('建御雷', '……蒼真。我發過誓，雷要用來守人。'), say('建御雷', '這孩子，我也守。')] }];
    q.done = function () { F().raiPet = 1; G.UI.banner(RN() + '加入', '每 8 秒對附近敵人落雷；建御雷傷害 +30%'); }; } }

  /* ============================ 役小角 ============================ */
  const BRIDGE = 'W_R06_02'; let EN = null;
  function ennoRun(q, done) { const FT = G.SIDE3 && G.SIDE3.fight; G.DLG.start([say('小雪', '他們在那裡！……啊，打起來了。'), say('前鬼', '誰要自由啊！役小鬼，妳是不是睡糊塗了！'), say('後鬼', '三百年了！現在才說可以走！那這三百年算什麼！'), say('役小角', '……誰是小鬼。'), say('役小角', '蒼真，幫我把他們打醒。')], () => {
    const fin = () => { EN = null; G.DLG.start(ennoEnd(), done); }; if (!FT) return fin(); EN = { said: {} }; FT('mb_izumo3', BRIDGE, { hp: 0.8, sub: '離家出走的式鬼' }, fin); }); }
  function ennoStep() { if (SC.id !== BRIDGE) { EN = null; return; } const enc = G.BOSS && G.BOSS.enc, u = enc && enc.units && enc.units[0]; if (!u || !u.hpMax) return; const r = u.hp / u.hpMax;
    if (r <= 0.56 && !EN.said.a) { EN.said.a = 1; G.UI.toast('前鬼：「妳的飯糰太鹹了！……可是只有妳會捏給我們！」'); } if (r <= 0.32 && !EN.said.b) { EN.said.b = 1; G.UI.toast('後鬼：「打呼是因為在妳旁邊才睡得著啦！」'); } }
  const ennoEnd = () => [say('前鬼', '……痛痛痛。'), say('後鬼', '都是你害的！'), say('役小角', '（役小角走過去，一人敲了一下頭。）都閉嘴。'), say('役小角', '三百年前，你們兩個是山裡的惡鬼，搶村子的糧、拆村子的橋。'),
    say('役小角', '我把你們打趴的時候，前鬼說「要殺就殺」，後鬼說「殺我就好，放過他」。'), say('役小角', '……所以我才沒殺你們。'), say('役小角', '前鬼。後鬼。契約，我現在就解。'), nar('（役小角撕掉了兩張符。）'), say('役小角', '你們自由了。想去哪裡，就去哪裡。'), say('前鬼', '…………'), say('後鬼', '…………'),
    { choice: [pick('你們自己選。', 'enno_end', 'choose', [say('前鬼', '……那我選，回去吃飯糰。'), say('後鬼', '我選，睡她旁邊。'), say('役小角', '……那是契約的內容。'), say('前鬼', '不是契約。是我要的。')]),
      pick('（把便當盒遞給他們。）', 'enno_end', 'meal', [nar('（前鬼拿了一個。後鬼拿了一個。剩下的那個，兩人一起推回給役小角。）'), say('後鬼', '妳的。'), say('前鬼', '三個人吃，才叫一餐。'), say('役小角', '（役小角咬了一口，別過頭去。）……太鹹了。')])] },
    say('役小角', '蒼真。我活了很久。收過很多式神，都是用符綁的。'), say('役小角', '不用符還留下來的，就這兩個笨蛋。')];
  { const q = Q.by.pt_enno; if (q) { q.steps = [{ t: 'cut', map: BRIDGE, lines: [say('役小角', '……真是的，那兩個笨蛋。'), say('役小角', '前鬼說後鬼搶他的飯糰，後鬼說前鬼打呼太大聲。吵到最後，兩個都跑了。'), say('役小角', '我收服他們三百年了，還是第一次這樣。'),
        nar('（橋頭掉著一個便當盒。裡面三個飯糰，一個都沒動。）'), say('役小角', '……我早上捏的。三個。一人一個。'), say('役小角', '他們吵的，不是飯糰。'),
        { choice: [pick('那是吵什麼？', 'enno_a', 'ask', [say('役小角', '……昨晚我說，這趟旅程很危險。要是我回不來，他們的契約就自己解開。'), say('役小角', '我以為他們會高興。')]), pick('妳其實知道吧。', 'enno_a', 'know', [say('役小角', '……知道。'), say('役小角', '只是不想承認，是我先說了蠢話。')])] }] },
      { t: 'fn', map: BRIDGE, text: '在雙軌押運橋打醒前鬼與後鬼', run: ennoRun }]; } }

  /* ============================ 回響 ============================ */
  const shrine = () => SC.id === 'hub_shrine', safe = () => HT.safe(), EC = HT.T && HT.T.echo;
  if (EC) EC.push(
    { id: 'y1', q: 'pt_yorimitsu', ok: shrine, L: () => C('pt_yori') === 'sorry' ? [nar('（賴光在擦刀。酒吞的葫蘆，掛在她的腰上。）'), say('源賴光', '這酒，我還沒捨得開。'), say('源賴光', '……等一個配得上的日子。')] : [nar('（賴光在擦刀。旁邊放著兩個杯子。）'), say('源賴光', '一個是我的。'), say('源賴光', '另一個……等一個走正門的客人。')] },
    { id: 'y2', q: 'pt_yorimitsu', ok: () => safe() && inP('yorimitsu') && inP('ibaraki') && D('c11_s_ibaraki'), L: () => [say('源賴光', '茨木。綱的塔，我帶妳去看。'), say('源賴光', '要吐口水，隨妳。'), say('茨木', '……無聊。'), say('茨木', '……哪一座？')] },
    { id: 'y3', q: 'pt_yorimitsu', ok: () => SC.id === 'W_R08_05', L: () => [say('酒吞童子', '又來？'), say('酒吞童子', '這次帶下酒菜沒有。'), say('源賴光', '……下次。')] },
    { id: 'y4', q: 'pt_yorimitsu', ok: () => safe() && !!F().ch12, L: () => [say('源賴光', '童子切今天只砍一樣東西。'), say('源賴光', '砍完，我請大家喝酒。'), say('源賴光', '……沒下毒的。')] },
    { id: 't1', q: 'pt_takemi', ok: shrine, L: () => [nar('（建御雷盤腿坐著。' + RN() + '睡在他的頭上。）'), say('建御雷', '（極小聲）……不要叫我。'), say('建御雷', '（極小聲）牠剛睡。')] },
    { id: 't2', q: 'pt_takemi', ok: () => safe() && inP('takemikazuchi'), L: () => [say('小雪', '建御雷大人，最近講話好小聲。'), say('建御雷', '在練。'), say('小雪', '練什麼？'), say('建御雷', '……不打雷地講話。')] },
    { id: 't3', q: 'pt_takemi', ok: () => SC.id === RAI, L: () => [nar('（' + RN() + '對著封印雷脈的方向，叫了一聲。）'), say('建御雷', '……你爹在那裡。'), say('建御雷', '等事情結束，我帶你去看他。'), say('建御雷', '我跟他，也有話要說。')] },
    { id: 't4', q: 'pt_takemi', ok: () => safe() && !!F().ch12, L: () => [nar('（建御雷把' + RN() + '塞進小雪懷裡。）'), say('建御雷', '這一仗，雷會很大聲。'), say('建御雷', '幫我捂住牠的耳朵。')] },
    { id: 'e1', q: 'pt_enno', ok: shrine, L: () => [nar('（役小角在捏飯糰。四個。）'), say('役小角', '一個是你的。'), say('役小角', '……別告訴他們我多捏了。')] },
    { id: 'e2', q: 'pt_enno', ok: () => safe() && inP('enno'), L: () => [say('前鬼', '喂，沒有契約了，妳還叫我前鬼？'), say('役小角', '不然叫什麼。'), say('後鬼', '……叫名字就好。'), say('役小角', '你們的名字，就是我取的。'), say('前鬼', '……也是。')] },
    { id: 'e3', q: 'pt_enno', ok: () => shrine() && !!F().ch7, L: () => [say('小雪', '役小角大人。「自己選留下來」，是什麼感覺？'), say('役小角', '妳以後會知道。'), say('役小角', '……妳身邊那個，也是自己選的。')] },
    { id: 'e4', q: 'pt_enno', ok: () => safe() && !!F().ch12, L: () => [say('前鬼', '役小鬼，這次妳要是敢說「回不來」——'), say('後鬼', '我們就先把妳扛回來。'), say('役小角', '……誰是小鬼。')] });
  const endWrap = () => { const q = Q.by.c12_end, s = q && q.steps[0]; if (s && !s._h4) { s._h4 = 1; const L0 = s.lines; s.lines = () => { const L = (typeof L0 === 'function' ? L0() : L0).slice(), X = [];
      if (D('pt_yorimitsu')) X.push(nar('（山道上的第五座石塔，還是沒有刻字。旁邊，多了一只空酒杯。）'));
      if (D('pt_takemi')) X.push(nar('（雷原上，一大一小兩個影子，坐在封印石前面。很久，都沒有打雷。）'));
      if (D('pt_enno')) X.push(nar('（山道上，一個小小的身影走在中間。一左一右兩個大個子，手上各拿著半個飯糰。）'));
      L.splice(Math.max(0, L.length - 1), 0, ...X); return L; }; } };
  { const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { try { endWrap(); } catch (e) { } return r; }); }

  /* ============================ 接線 ============================ */
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); if (G.mode !== 'play') return; try { if (AP) apStep(); if (EN) ennoStep();
    } catch (e) { console.warn('heart4', e); AP = EN = null; } };
  /* 限時選項的倒數掛在對話的繪製上（對話中劇情步進會停） */
  const dd0 = G.DLG.draw; G.DLG.draw = function () { const r = dd0.apply(this, arguments); try {
      const D2 = G.DLG, k = D2.active() ? tmOf() : null; if (!k) TL = null; else { if (!TL || TL.k !== k) TL = { k, t0: performance.now() }; if (performance.now() - TL.t0 >= 5000) { TL = null; D2.list.splice(D2.i, 1, ...TM[k]); if (D2.i >= D2.list.length) D2.finish(); else D2.prep(); } }
    } catch (e) { } return r; };
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); if (G.mode !== 'play') return; const ch = G.DLG.choice;
    if (ch && TL && tmOf()) { const s = Math.max(0, 1 - (performance.now() - TL.t0) / 5000), w = 220, x = (G.LW - w) / 2, y = G.LH * 0.16, c = G.ctx; c.fillStyle = 'rgba(0,0,0,.55)'; G.rr(x - 6, y - 16, w + 12, 34, 8); c.fill(); G.txt('一口酒的時間', G.LW / 2, y - 4, 11, '#ffd6a0', 'center', G.FONT_S, 800); c.fillStyle = 'rgba(255,255,255,.18)'; G.rr(x, y + 6, w, 6, 3); c.fill(); c.fillStyle = s < 0.3 ? '#ff9a7a' : '#e3c27a'; G.rr(x, y + 6, Math.max(4, w * s), 6, 3); c.fill(); }
    if (AP && !G.DLG.active()) { const d = Math.hypot(H.x - AP.x, H.y - AP.y), near = d <= RING[AP.k]; G.txt('靠近 ' + AP.k + '／3　' + (near ? (AP.still > 5 ? '停著，等牠……' : '停下來等牠') : '用走的，慢慢靠近'), G.LW / 2, 96 * G.FS(), 14, near ? '#9ff0c0' : '#fff3d6', 'center', G.FONT_S, 900); } };
  HT.T4 = { ap: () => AP, en: () => EN };
})();
