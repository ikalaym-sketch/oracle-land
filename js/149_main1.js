/* =====================================================================
 * 149_main1.js
 * 版本    : r3.131.0  (2026-11-27)　（護送沿可走遮罩尋路；宗八 keep 避免對話收場被收掉）
 * 說明    : 劇情補完・主線第 1 批（第 4、6、7、8 章）。
 *           ‧ 第 4 章「夢中的後山」（c4_dream）：小雪的夢，白衣的巫女問 3 題，答案決定小雪醒來的話；伏筆第 11 章遺物。
 *           ‧ 第 6 章「古約的幻影」：卸扣回身坡（W_R06_06）隨機 3 隻前章頭目幻影（60% 血），各留一句古約。
 *           ‧ 第 7 章「城裡的紙人」：兩岸城 5 處（米埠、雨廊、布街、倉道、渡口）燒掉紙人，才去紙閣。
 *           ‧ 第 7 章「護送渡船夫」：雙庫分存巷・高倉（W_R07_06B）護送宗八到東口，3 波敵人，宗八有血條，倒下重來。
 *           ‧ 第 8 章「茨木的試刀」：楓谷宴里（W_R08_01）茨木切磋（60% 血，打掉一半就收手），結果影響赴宴台詞。
 *           ‧ 用 53_quest 的 fn 步驟；只在對應地圖、對應步驟時運作。
 * 依賴    : 53_quest、54_story_a/b、26_boss（B.start）、20_npc（G.AMB）、52_hub（HUB.travel）
 * ===================================================================== */
(function () {
  const Q = G.QST, B = G.BOSS, SC = G.SC, H = G.H, ctx = G.ctx; if (!Q || !Q.by.c6_m3) return;
  const F = () => G.SAVE.data.flags, C = k => Q.choice(k), qc = () => (G.SAVE.data.qc = G.SAVE.data.qc || {});
  const say = (who, text) => ({ who, text }), act = fn => ({ do: fn }), nar = t => say('', t);
  const later = (n, f) => G.STORY.later(n, f), HUB = () => G.HUB;
  const pick = (k, v) => act(() => { qc()[k] = v; G.SAVE.markDirty(); });

  /* ================= 第 4 章：夢中的後山 ================= */
  const Qs = (key, q, opts, tail) => ({ choice: opts.map(([label, v, resp]) => ({ label, then: [pick(key, v), ...resp].concat(tail || []) })) });
  function dreamTalk() {
    const end = [say('白衣的巫女', '我在黃泉的入口，留了一樣東西給她。'), say('白衣的巫女', '等她真的撐不下去的那一天，帶她去拿。'),
      say('小雪', '等一下！妳到底是誰？為什麼妳跟我長得——'), nar('（她終於微微側過頭。你只看見一縷頭髮，和小雪的一模一樣。）'),
      say('白衣的巫女', '……雪。我的名字，也叫雪。'), nar('（四周的顏色像被水沖淡一樣，一點一點褪去——）')];
    const q3 = [say('白衣的巫女', '最後一個問題。'), say('白衣的巫女', '你會一直陪著她嗎？'),
      Qs('c4_dream3', 3, [['會。', 'yes', [say('白衣的巫女', '……那就好。這句話，要記得比她還久喔。')]],
        ['我不知道。但現在，我會。', 'now', [say('白衣的巫女', '誠實的孩子。「現在」也很好——很多人，連現在都給不了。')]],
        ['這要問她自己想不想。', 'ask', [nar('（小雪抓著你袖子的手，握得更緊了。）'), say('白衣的巫女', '……你看，她已經回答你了。')]]], end)];
    const q2 = [say('白衣的巫女', '第二個問題。'), say('白衣的巫女', '如果有一天，要守住所有人，就必須有一個人走進寶珠裡，再也回不來。你會怎麼做？'),
      Qs('c4_dream2', 2, [['找別的方法。一定有別的方法。', 'other', [say('白衣的巫女', '……當年，也有人這樣說過。'), say('白衣的巫女', '他找了很久、很久。找到頭髮都白了。')]],
        ['如果那是她自己的決定，我會陪她走到最後。', 'respect', [say('白衣的巫女', '……謝謝你。'), say('白衣的巫女', '那一晚，沒有人陪我走到最後。')]],
        ['讓我代替她。', 'replace', [say('白衣的巫女', '不行喔。'), say('白衣的巫女', '被留下來的人，會比走進去的人，痛上更久更久。')]]], q3)];
    return [nar('（後山的天空是暗紫色的。沒有風，沒有蟲鳴，連你自己的腳步聲都聽不見。）'),
      say('小雪', '蒼真？……你真的來了。'), say('小雪', '這裡是我的夢。每次都是這裡，每次她都站在那裡。'),
      nar('（試煉石前，站著一個穿白衣的女人。她背對著你們，一動也不動。）'),
      say('白衣的巫女', '神社來了新的守護者啊。'), say('白衣的巫女', '我有三件事想問你。不用想太久，照你心裡的話說就好。'),
      say('白衣的巫女', '第一個問題——你為什麼，會留在神社？'),
      Qs('c4_dream1', 1, [['因為小雪需要有人守著。', 'guard', [say('白衣的巫女', '……你說話的樣子，跟他好像。')]],
        ['一開始，只是剛好路過。', 'pass', [say('白衣的巫女', '路過的人，很少會留下來。'), say('白衣的巫女', '可是你留下來了。')]],
        ['我想知道，神社到底在守什麼。', 'know', [say('白衣的巫女', '那就看清楚吧。'), say('白衣的巫女', '看清楚以後，也許你會想逃。逃也沒關係，只是……別一聲不響地走。')]]], q2)];
  }
  function wake() { const a2 = C('c4_dream2'), a3 = C('c4_dream3');
    return [nar('（天亮了。你在門口醒來，脖子痠得抬不起頭。小雪蹲在你面前，手裡捧著一碗熱茶。）'),
      say('小雪', '……你真的在門口守了一整晚。'),
      a2 === 'respect' ? say('小雪', '夢裡你說，會陪我走到最後。……我其實很怕那個「最後」。可是聽你那樣說，好像就沒有那麼怕了。')
        : a2 === 'replace' ? say('小雪', '夢裡你說要代替我。……不可以喔。你要是不見了，我會很生氣，比生氣還要生氣。')
          : say('小雪', '夢裡你說「一定有別的方法」。我醒來的時候，第一次覺得，那句話好像是真的。'),
      a3 === 'now' ? say('小雪', '還有，你說「現在會」。……那我們就先把現在過好吧。') : a3 === 'ask' ? say('小雪', '你說要問我自己……我想。我想要有人陪。') : say('小雪', '還有……謝謝你說「會」。我會記住的。'),
      say('小雪', '她說她也叫「雪」。還說在黃泉的入口，留了東西給我。'), say('小雪', '蒼真，黃泉的入口……是真的存在的地方嗎？'),
      say('白丸', '（白丸趴在門邊，一隻耳朵動了動。）……那種地方，等到不得不去的時候再想。'),
      say('小雪', '……嗯。'), say('小雪', '那、那先吃早飯吧！我去煮粥。這次不會再煮焦了……大概。'),
      act(() => { G.SAVE.data.xueLove = (G.SAVE.data.xueLove || 0) + 1; G.SAVE.markDirty(); })]; }
  let dream = false;
  Q.add({ id: 'c4_dream', ch: 4, main: true, postBoss: true, title: '夢中的後山', desc: '小雪說，她又要做那個夢了。', reward: { exp: 220 },
    need: () => Q.isDone('c4_after') && !F().ch6,
    steps: [{ t: 'talk', map: 'hub_shrine', at: 'xue_stand', name: '小雪', text: '入夜後，去看看小雪', lines: [
      say('小雪', '蒼真，你還沒睡啊。'), say('小雪', '……老實說，我有點不敢睡。一閉上眼睛，就會回到那片雷原，那個白衣的女人一直站在那裡。'),
      say('小雪', '她從來不回頭。我叫她，她也不理我。'), say('蒼真', '那今晚我守在門口。妳做夢的時候，我就在外面。'),
      nar('（小雪抱著膝蓋靠在柱子上，過了好一會兒，才小聲開口。）'), say('小雪', '蒼真……如果我在夢裡走丟了，你會來找我嗎？'),
      say('蒼真', '會。'), say('小雪', '……嗯。晚安。'), nar('（夜風吹過鳥居。你靠著門柱坐下，眼皮越來越重——）')] },
      { t: 'fn', map: 'hub_shrine', text: '（睡著了）', run: (q, done) => { dream = true; F().dream4 = 1; G.SAVE.markDirty(); done(); HUB().travel(0, '……醒過來的時候，你站在後山。', [], 'hub_mountain'); } },
      { t: 'talk', map: 'hub_mountain', at: 'stone_stand', dx: -220, dy: 60, u: 'n_xue', name: '白衣的巫女', text: '走近白衣的背影', lines: dreamTalk },
      { t: 'fn', map: 'hub_mountain', text: '（夢醒）', run: (q, done) => { F().dream4 = 0; dream = false; G.SAVE.markDirty(); done(); HUB().travel(0, '……', [], 'hub_shrine'); } },
      { t: 'cut', map: 'hub_shrine', lines: wake }] });
  /* 夢境濾鏡（只在夢裡的後山） */
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments);
    if (SC.id !== 'hub_mountain' || !F().dream4) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height;
    ctx.fillStyle = 'rgba(30,14,60,.42)'; ctx.fillRect(0, 0, W, Hh);
    const g = ctx.createRadialGradient(W / 2, Hh / 2, Hh * 0.25, W / 2, Hh / 2, Hh * 0.85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,4,20,.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh); ctx.restore(); };
  /* 夢裡的巫女：背對、半透明 */
  const ls0 = G.lootStep; let tk = 0;
  G.lootStep = function () { ls0.apply(this, arguments); tk++;
    if (SC.id === 'hub_mountain' && F().dream4 && tk % 10 === 0) { const m = Q.marks.find(k => k.id === 'c4_dream:s'); if (m && m.n) { m.n.face = 1; m.n.alpha = 0.8; m.n.pace = 0; } }
    if (SP) spStep(); if (ES) esStep(); };

  /* ================= 第 6 章：古約的幻影 ================= */
  const PH = [['kama', '鎌鼬長兄的幻影', '風不屬於任何人。借了山路的人，要記得把路讓回來。', () => say('蒼真', '竹林那條路，村裡的人現在都會繞開鼬窩走。')],
    ['kappa', '河童大將的幻影', '河的兩岸，原本就是同一條水。', () => say('蒼真', '共岸的橋，已經重新搭起來了。兩邊的孩子會在橋上一起釣魚。')],
    ['kyubi', '白九尾的幻影', '人有人的夜，狐有狐的夜。互不驚擾，各自安睡。', () => say('葛葉', '……母親大人以前，也常常這樣說。')],
    ['raiju', '雷獸王的幻影', '雷是天借給地的。借了，就要還。', () => C('c4_well') === 'divert' ? say('蒼真', '我們還在還。礦場只取多出來的那一份。') : say('蒼真', '井封了。雷，已經回到天上去了。')],
    ['oni', '鬼王的幻影', '火是大家一起點的。所以灶前，要留一個位置。', () => say('蒼真', '炭里的共灶，現在留了。')]];
  function phantoms(q, done) {
    const list = PH.slice().sort(() => Math.random() - 0.5).slice(0, 3); let i = 0;
    const one = () => { if (SC.id !== 'W_R06_06') return; if (i >= list.length) { G.DLG.start([nar('（最後一道幻影散去。坡道的盡頭，雲海翻湧。）'), say('小雪', '牠們……好像不是來阻止我們的。'),
        say('白丸', '是來確認的。確認這世上，還有人記得當初說好的事。'), say('蒼真', '那就帶著這些話，去見八岐。')], done); return; }
      const [id, nm, line, reply] = list[i++], D = B.DEF[id]; if (!D) return one();
      Promise.all([B.load(id), G.ASSET.enemies(D.foes || [])]).then(() => { if (SC.id !== 'W_R06_06') return; const p = SC.snap(H.x + 240 * (H.x < SC.def.w / 2 ? 1 : -1), H.y, 'open', 300) || [H.x + 200, H.y];
        const enc = B.start(id, { x: p[0], y: p[1], lv: (SC.def.lv || 1) + 1, sub: '幻影・古約的記憶', onWin: () => later(20, () => G.DLG.start([say(nm, '「' + line + '」'), reply(), nar('（幻影化成一縷霧，被風吹散。）')], () => later(40, one))) });
        if (enc) { enc.name = nm; for (const u of enc.units) { u.hp = Math.round(u.hpMax * 0.6); u.alpha = 0.85; } } }, () => one()); };
    G.DLG.start([nar('（坡道上起了霧。霧裡浮出幾個熟悉的身影——都是你們一路上打倒過的對手。）'), say('小雪', '那是……鎌鼬？還有河童大將……可是牠們不是都已經……'),
      say('白丸', '是幻影。古約被撕散的時候，當年立約者的記憶，也跟著散了出來。'), say('葛葉', '八岐吞的是「過錯」，這些幻影是「約定」。牠們想知道，我們記不記得當初是怎麼了結的。'),
      say('蒼真', '那就一個一個回答。')], () => later(30, one)); }
  { const q = Q.by.c6_m3; q.steps.push({ t: 'fn', map: 'W_R06_06', text: '在卸扣回身坡，面對古約的幻影', run: phantoms }); }

  /* ================= 第 7 章：城裡的紙人 ================= */
  { const q = Q.by.c7_m2, i = q.steps.findIndex(s => s.map === 'W_R07_05');
    q.steps.splice(i < 0 ? q.steps.length : i, 0,
      { t: 'cut', map: 'Q_coast_cliff_muster', lines: [say('文也', '走私的船上，除了黑紙，還有一份名單。'), say('文也', '米埠、雨廊、布街、倉道、渡口……五個地方，每個地方後面都畫了一個小小的人形。'),
        say('小雪', '是紙人放在城裡的位置……蒼真，我們先回城裡。紙閣不會跑，可是城裡的人會被換掉。')] },
      { t: 'gather', map: 'hub_city', text: '燒掉城裡的 5 張紙人', spots: [
        { at: [1430, 812], label: '米埠的米袋', lines: [nar('（米袋堆裡夾著一張人形的紙，紙上用細筆寫著「搬運工・阿吉」。）'), nar('（你點火燒了它。紙人扭了一下，化成灰。）'),
          say('阿吉', '……我、我剛剛在幹嘛？我記得我在扛米，然後……就什麼都想不起來了。'), say('小雪', '沒事了。你只是做了一個很長的夢。回家喝碗熱湯吧。')] },
        { at: [1078, 470], label: '雨廊的屋簷', lines: [nar('（屋簷下貼著一張紙人。外面在下雨，它卻一點都沒濕。）'), say('文也', '雨淋不濕的紙……這種紙，我只在紙閣的禁書目錄上看過。'),
          nar('（紙人燒起來的時候，發出很細很細的哭聲。）'), say('小雪', '……它們也會痛嗎？'), say('文也', '我不知道。但寫它的人，一定從來沒想過這個問題。')] },
        { at: [300, 612], label: '布街的黑布', lines: [say('阿紺', '你們在找紙人？……我店裡那捆黑布底下，好像有東西在動。'), nar('（布底下壓著一張紙人，紙做的手裡，還拿著一根針。）'),
          say('阿紺', '它……在幫我縫衣服？'), say('蒼真', '它在學妳。學得越像，就越能取代妳。'), nar('（阿紺把針拿了回來，握得很緊。）'), say('阿紺', '……我自己的衣服，我自己縫。謝謝你們。')] },
        { at: [1500, 322], label: '倉道的門縫', lines: [nar('（倉庫的門縫裡塞滿了紙人，一張疊著一張，像在排隊。）'), say('白丸', '……好多。牠們在等。等城裡的人睡著。'),
          nar('（你把整疊紙點燃。火光一下子照亮了整條倉道。）'), say('白丸', '這下，今晚大家可以安心睡了。')] },
        { at: [1236, 640], label: '渡口的船頭', lines: [say('時雨', '船頭那張紙，是今天早上才出現的。我本來想撕掉，可是手一碰到，就忘了自己要做什麼。'),
          nar('（你燒掉紙人。時雨眨了眨眼，眼神清楚了一點。）'), say('時雨', '……謝了。撐了十幾年的船，這是第一次差點忘記怎麼划槳。'), say('時雨', '要去紙閣的話，路上小心。那裡的紙，比這張多上一萬倍。')] }] },
      { t: 'cut', map: 'hub_city', lines: [say('文也', '五張都燒掉了。紙閣那邊……應該已經感覺到了。'), say('景綱', '城裡的人，我會一戶一戶去看。你們去吧——把源頭處理掉。')] }); }

  /* ================= 第 7 章：護送渡船夫 ================= */
  const EMAP = 'W_R07_06B'; let ES = null;
  function escort(q, done) { G.DLG.start([nar('（巷子的盡頭傳來喊聲。一個中年船夫抱著船槳，被幾個紙兵逼到牆角。）'), say('宗八', '別、別過來！我只是個撐船的！'),
      say('蒼真', '宗八？你怎麼在這裡？'), say('宗八', '是你們！……長壁姬把渡口所有的船都燒了，只剩我藏起來的那一艘。'),
      say('宗八', '要去月下船渡，只能搭我的船。可是那些紙兵一直跟著我……'), say('小雪', '我們陪你過去。你跟緊蒼真，不要停下來。'),
      say('宗八', '……好。我這條老命，就交給你們了。')], () => esStart(done)); }
  function esStart(done) { const d = SC.def, n0 = d.nodes || {}, a = n0.west_arrival || [124, 545], b = n0.east_arrival || [d.w - 124, 545];
    const s0 = SC.snap(a[0] + 80, a[1], 'open', 120) || a;
    G.AMB.add('n_sohachi', s0[0], s0[1], { name: '宗八', hold: true }).then(n => { if (!n) return; n.keep = 1; n.x = s0[0]; n.y = s0[1]; const bb = SC.snap(b[0] - 60, b[1], 'open', 160) || b; ES = { n, a: s0, b: bb, hp: 100, wave: 0, done, t: 0, P: path(s0, bb), pi: 0 }; G.UI.banner('護送宗八', '帶他走到巷子東口（倒下就重來）'); }); }
  /* 沿可走遮罩找路（BFS，開始時算一次） */
  function path(a, b) { const k = SC.def.mask; if (!k) return [b]; const W = k.w, Hh = k.h, s = k.s, c = p => [Math.min(W - 1, Math.max(0, p[0] / s | 0)), Math.min(Hh - 1, Math.max(0, p[1] / s | 0))];
    const [sx, sy] = c(a), [tx, ty] = c(b), prev = new Int32Array(W * Hh).fill(-1), q = [sy * W + sx]; prev[q[0]] = q[0];
    const ok = i => k.m[i] && k.d[i] >= 2;
    for (let h = 0; h < q.length; h++) { const i = q[h]; if (i === ty * W + tx) break; const x = i % W, y = i / W | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue; const j = ny * W + nx; if (prev[j] >= 0 || !ok(j)) continue; prev[j] = i; q.push(j); } }
    let i = ty * W + tx; if (prev[i] < 0) return [b]; const out = []; while (i !== prev[i]) { out.push([(i % W) * s + s / 2, (i / W | 0) * s + s / 2]); i = prev[i]; } out.reverse();
    return out.filter((p, j) => j % 6 === 5 || j === out.length - 1); }
  function esReset() { const e = ES; for (const o of G.E) if (o.esc && o.st !== 'dead') { o.hp = 0; o.st = 'dead'; } e.n.x = e.a[0]; e.n.y = e.a[1]; e.hp = 100; e.wave = 0; e.pi = 0; G.UI.toast('宗八倒下了……重新來過'); }
  function esStep() { const e = ES, n = e.n; if (SC.id !== EMAP || !G.AMB.list.includes(n)) { ES = null; return; } if (G.DLG.active()) return; e.t++;
    const foes = G.E.filter(o => o.esc && o.st !== 'dead'), near = foes.filter(o => Math.hypot(o.x - n.x, (o.y - n.y) * 1.4) < 260);
    for (const o of foes) if (Math.hypot(o.x - n.x, (o.y - n.y) * 1.4) < 80) e.hp -= 0.09;
    if (e.hp <= 0) return esReset();
    const prog = e.pi / Math.max(1, e.P.length);
    if (e.wave < 3 && prog >= [0.12, 0.45, 0.75][e.wave]) { e.wave++; const types = (SC.def.foes && SC.def.foes.length ? SC.def.foes : ['kunoichi', 'kinkasa']).slice(0, 2), lv = Math.max(SC.def.lv || 1, (G.RPG.d().lv || 1) - 2);
      Q.load(types).then(() => { for (let i = 0; i < 3 + e.wave; i++) { const p = SC.snap(n.x + 260 + i * 40, n.y + (i % 3 - 1) * 50, 'open', 200); if (!p) continue; const o = G.spawnOni(p[0], p[1], 10 + i * 12, lv, types[i % types.length]); if (o) o.esc = 1; } });
      G.UI.toast('紙兵追上來了！（第 ' + e.wave + ' 波）'); }
    const go = !near.length && Math.hypot(H.x - n.x, H.y - n.y) < 420;
    if (go) { const t = e.P[e.pi] || e.b, dx = t[0] - n.x, dy = t[1] - n.y, d = Math.hypot(dx, dy); if (d < 3) e.pi++; else { const v = Math.min(d, 1.4); n.x += dx / d * v; n.y += dy / d * v; n.face = Math.sign(dx) || n.face; } n.walking = true; }
    else n.walking = false;
    if (e.pi >= e.P.length || Math.hypot(n.x - e.b[0], n.y - e.b[1]) < 20) { ES = null; n.walking = false; for (const o of G.E) if (o.esc && o.st !== 'dead') { o.hp = 0; o.st = 'dead'; }
      G.DLG.start([say('宗八', '……到了。到了！'), say('宗八', '（宗八扶著牆喘了好一會兒，才把船槳扛回肩上。）'), say('宗八', '船就藏在前面的蘆葦裡。今晚月亮很亮，看得見水路。'),
        say('宗八', '……我撐了一輩子的船，第一次有人為了我這種小人物拚命。'), say('小雪', '宗八先生的船，是我們唯一的路呀。'), say('宗八', '哈……說得也是。上船吧。這一趟，不收錢。')], () => { n.keep = 0; G.AMB.remove(n); e.done(); }); } }
  { const q = Q.by.c7_m4; q.steps.unshift({ t: 'fn', map: EMAP, text: '在高倉巷護送渡船夫宗八', run: escort }); }
  const dl0 = G.drawLoot; G.drawLoot = function (Z) { dl0.apply(this, arguments); const e = ES; if (!e || SC.id !== EMAP) return; const n = e.n, w = 64, y = n.y - (G.HERO_H || 90) * 1.35;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(n.x - w / 2 - 1, y - 1, w + 2, 7); ctx.fillStyle = e.hp > 40 ? '#7fd38a' : '#e0664f'; ctx.fillRect(n.x - w / 2, y, w * Math.max(0, e.hp) / 100, 5); ctx.restore(); };

  /* ================= 第 8 章：茨木的試刀 ================= */
  let SP = null;
  function spar(q, done) { const tr = C('c5_truth') === 'truth';
    G.DLG.start([nar('（林道上，一道人影從樹梢落下，擋在路中間。是茨木。）'), say('茨木', '站住。……宴席還沒開。我先替酒吞大人看看，來赴宴的人類，值不值得信。'),
      tr ? say('茨木', '權太的事，我記著。所以我更要親手試試——一個肯替鬼說真話的人，手裡的刀是不是也一樣直。') : say('茨木', '上次，你讓權太背了罪。這次你說要和談……我憑什麼信你？用刀說吧。'),
      say('小雪', '茨木小姐，我們不是來打架的——'), say('蒼真', '沒關係，小雪。……好，點到為止。'), say('茨木', '點到為止？哈。你先站得住再說。')], () => {
      const D = B.DEF.ibaraki; Promise.all([B.load('ibaraki'), G.ASSET.enemies((D && D.foes) || [])]).then(() => { if (SC.id !== 'W_R08_01') return;
        const p = SC.snap(H.x + 220, H.y, 'open', 300) || [H.x + 200, H.y];
        const enc = B.start('ibaraki', { x: p[0], y: p[1], lv: (SC.def.lv || 1) + 2, sub: '鬼族前哨・試刀', onWin: () => later(10, () => sparEnd(done)) });
        if (enc) { enc._spar = 1; const u = enc.units[0]; u.hp = Math.round(u.hpMax * 0.6); SP = { enc, thr: u.hpMax * 0.3 }; } }); }); }
  function spStep() { const s = SP, enc = s.enc; if (!enc || enc.done || B.enc !== enc) { if (!enc || B.enc !== enc) SP = null; return; }
    const u = enc.units[0]; if (u && u.hp <= s.thr) { qc().c8_spar = H.hp >= H.hpMax * 0.5 ? 'win' : 'close'; G.SAVE.markDirty();
      for (const x of enc.units) x.hp = Math.max(x.hp, 1); enc.done = true; enc.winT = 0; B.tg.length = 0; B.zones.length = 0; B.proj.length = 0; G.UI.banner('茨木收手了', '點到為止'); SP = null; } }
  function sparEnd(done) { const w = C('c8_spar') !== 'close';
    G.DLG.start(w ? [nar('（茨木收回手臂，往後退了兩步，甩掉刀上的木屑。）'), say('茨木', '……夠了。你的刀沒有猶豫。'), say('茨木', '上宴吧。我會站在你看得見的地方。'),
      say('小雪', '茨木小姐……謝謝妳。'), say('茨木', '別謝。我只是不想看酒吞大人被騙第二次。')]
      : [nar('（茨木收回手臂。你撐著膝蓋，喘得說不出話。）'), say('茨木', '……夠了。喘成這樣，還不肯退。'), say('茨木', '刀不夠快，但是夠倔。人類裡，倔的人比較少說謊。'),
        say('茨木', '上宴吧。……別讓我後悔。')], done); }
  { const q = Q.by.c8_m3, s0 = q.steps[0]; q.steps.unshift({ t: 'fn', map: 'W_R08_01', text: '在楓谷宴里接受茨木的試刀', run: spar });
    const L0 = s0.lines; s0.lines = () => { const L = (typeof L0 === 'function' ? L0() : L0).slice(), i = L.findIndex(x => x.who === '茨木'), sp = C('c8_spar');
      if (i >= 0 && sp) { const tr = C('c5_truth') === 'truth', w = sp === 'win';
        const t = tr ? (w ? '剛剛那一架，我記住了。今晚誰敢在宴上動手，先過我這關。' : '你的手還在抖。……放心，宴上不用你拔刀，有我。')
          : (w ? '（茨木靠在樹上，看著你。）……權太的事，我還沒原諒你。可是剛剛那一架，我記住了。今晚誰敢在宴上動手，先過我這關。' : '（茨木靠在樹上。）……你的手還在抖。權太的帳，等宴後再跟你算。今晚，我站你這邊。');
        if (tr) L.splice(i + 1, 0, say('茨木', t)); else L[i] = say('茨木', t); }
      return L; }; }
})();
