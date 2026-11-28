/* ==========================================================================
 * 神諭之地 重製版 — 164_heart2.js
 * Version : r3.216.0  (2026-11-28)　r3.216.0：新增。颯、汐音的心事重寫（多站、抉擇、對決／退潮／合唱）與解開後的回響
 * 內容    : 1. 颯「天狗族的叛徒」：天狗長者 → 斷羽崖三處遺物 → 嵐丸的殘影（順風時颯的箭加強，打到三成收手）→ 崖頂的抉擇（qc.hayate_end = live｜lend）。
 *           2. 汐音「汐音的母親」：汀江 → 阿德婆婆（河歌下半段）→ 退潮的礁灣（40 秒內走到灣底，漲潮會被推回起點）→
 *              珊庭合唱（四句，光最亮時點畫面；不會失敗，四次都準多一句話）→ 抉擇（qc.shion_end = angry｜shore）。
 *           3. 回響：心事解開後，之後回神社／城鎮或走到指定地圖時，夥伴會再多說幾句（每個回響一次，每次進圖最多一個）。
 * 依賴    : 163_heart、53_quest、49_party、05_dialog、88_rune（G.AFX）。
 * 存檔    : qc.hayate_a／hayate_end／shion_a／shion_b／shion_end；flags.he_<回響編號>。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, PY = G.PARTY, SC = G.SC, H = G.H, HT = G.HEART; if (!Q || !PY || !HT) return;
  const F = () => G.SAVE.data.flags, say = Q.say, nar = t => say('', t), act = fn => ({ do: fn }), ctx = G.ctx;
  const qc = () => (G.SAVE.data.qc = G.SAVE.data.qc || {}), setC = (k, v) => act(() => { qc()[k] = v; G.SAVE.markDirty(); });
  const inP = id => !!(PY.list && PY.list.some(p => p && p.id === id)), later = (n, f) => G.STORY.later(n, f), D = id => Q.isDone(id);
  const pick = (label, k, v, lines) => ({ label, then: [setC(k, v)].concat(lines) });

  /* ============================ 颯 ============================ */
  const CLIFF = 'Q_mountain_redcliff'; let RF = null;
  const elder = () => [say('天狗長者', '來了啊。還帶著人類。……跟你師父一個樣。'), say('颯', '少廢話。你說師父是叛徒，憑什麼。'),
    say('天狗長者', '三百年前，嵐丸把族裡的「風切羽」偷出去，交給了一個人類女子。'), say('天狗長者', '那是天狗一族渡過雷雲的命。少了它，那年冬天，高原摔死了七個孩子。'), say('颯', '…………'),
    say('天狗長者', '那個女子，叫雪。就是你們說的，初代的器。')]
    .concat(inP('shiro') ? [say('白丸', '……雪。'), say('颯', '你認識？'), say('白丸', '我在門前，等了她三百年。')] : [])
    .concat([{ choice: [pick('你師父一定有理由。', 'hayate_a', 'trust', [say('颯', '……你倒是比我還相信他。')]),
      pick('七個孩子，是真的嗎？', 'hayate_a', 'ask', [say('颯', '……是真的。墳就在崖邊。我小時候，每年都被師父帶去掃。')]),
      pick('（不說話，把手放在他肩上。）', 'hayate_a', 'hand', [say('颯', '……別碰。'), say('颯', '……算了，放著吧。')])] },
    say('天狗長者', '他最後待的地方，是赤壁雲棧的斷羽崖。東西應該還在。你自己去看。')]);
  function ranFight(q, done) { G.DLG.start([nar('（崖上起風。一個戴著舊面具的天狗身影，落在崖頂。）'), say('嵐丸的殘影', '——風太亂了。你的。'), say('颯', '師父……！'),
      say('嵐丸的殘影', '不用叫。我只是留在羽毛裡的一口氣。打完就散。'), say('嵐丸的殘影', '來。讓我看看，我走了以後，你有沒有偷懶。')], () => {
    G.ASSET.enemies(['kintengu']).then(() => { if (SC.id !== CLIFF || RF) return; if (G.AFX) G.AFX.pre(['fx_common']);
      if (!inP('hayate') && PY.joined('hayate')) { const s = PY.slots(); PY.setSlot(s[0] ? 1 : 0, 'hayate'); G.UI.toast('颯自己站了出來'); }
      const p = (SC.snap && SC.snap(H.x + 260, H.y, 'open', 300)) || [H.x + 220, H.y], e = G.spawnOni(p[0], p[1], 20, (SC.def.lv || 1) + 2, 'kintengu');
      e.elite = 1; e.boss = true; e.name = '嵐丸的殘影'; e.hp = e.hpMax = Math.round(e.hpMax * 14); e.atk = Math.round(e.atk * 1.25); e.ratio *= 1.3; e.qh = 1;
      RF = { e, done, wind: 1, t: 0, said: {} }; G.UI.banner('嵐丸的殘影', '站到上風處，颯的箭會順著風貫穿'); }); }); }
  const upwind = () => RF && (H.x - RF.e.x) * RF.wind < 0;
  function ranStep() { const f = RF, e = f.e; if (SC.id !== CLIFF) { RF = null; return; } f.t++;
    if (f.t % 540 === 0) { f.wind = -f.wind; G.UI.toast('風向變了——往' + (f.wind > 0 ? '東' : '西') + '吹'); }
    if (f.t % 26 === 0 && G.AFX) { const x0 = G.H.x - f.wind * 420, y0 = H.y - 60 - Math.random() * 160, t0 = G.t, w = f.wind;
      G.AFX.play('fx_common', 'skill_wind_vortex_a', { at: () => [x0 + w * (G.t - t0) * 9, y0, 0], size: 70, by: 'h', flip: w < 0, tpf: 4, fb: () => { } }); }
    const r = e.hp / e.hpMax, sh = (k, t) => { if (!f.said[k]) { f.said[k] = 1; G.UI.toast('嵐丸的殘影：「' + t + '」'); } };
    if (r <= 0.7) sh(7, '太直了！風是用繞的！'); if (r <= 0.5) sh(5, '……嗯。這一箭，像樣。');
    if (r <= 0.3 || e.st === 'dead' || G.E.indexOf(e) < 0) { const i = G.E.indexOf(e); if (i >= 0) G.E.splice(i, 1);
      if (G.AFX) G.AFX.play('fx_common', 'skill_wind_vortex_a', { x: e.x, y: e.y - 40, size: 150, by: 'h', tpf: 4, fb: () => { } });
      G.UI.banner('嵐丸收手了', '「夠了。」'); RF = null; later(50, () => ranEnd(f.done)); } }
  function ranEnd(done) { G.DLG.start([say('嵐丸的殘影', '七個孩子的事，是我的錯。這個，不用替我洗。'), say('嵐丸的殘影', '但我不後悔。那個女孩一個人走進黃泉的時候，回頭對我笑了一下。'),
      say('嵐丸的殘影', '颯。你身邊那個人，會不會也有那一天？'), say('颯', '……會。'), say('嵐丸的殘影', '那你，借不借？'),
      { choice: [pick('不要借。我要他活著。', 'hayate_end', 'live', [say('颯', '……哈。你這傢伙。'), say('颯', '師父。我跟你不一樣。我不借命。我要兩個都活著回來。'), say('嵐丸的殘影', '……貪心。'), say('嵐丸的殘影', '……好。比我強。')]),
        pick('那是颯自己的事。我不替他答。', 'hayate_end', 'lend', [say('颯', '……借。'), say('颯', '但是師父，我會自己回來拿。不會讓誰替我刻三百年的名字。'), say('嵐丸的殘影', '……嘴硬。'), say('嵐丸的殘影', '……好。像我。')])] },
      say('嵐丸的殘影', '回去告訴那個老頭。叛徒兩個字，留著。我擔得起。'), say('嵐丸的殘影', '但是，替我多掃一次墳。'),
      nar('（殘影散成一片白羽。其中一根，落在颯的手裡。）'), say('颯', '…………'), say('颯', '蒼真。回去的路上，別跟我講話。'), say('颯', '……走慢一點就好。')], done); }
  { const q = Q.by.c9_s_hayate; if (q) { q.desc = '颯的師父，被族裡說成叛徒。颯想自己去問清楚。';
    q.steps = [{ t: 'talk', map: 'W_R04_04', at: 'center', dx: 100, u: 'n_t_tengu_elder', name: '天狗長者', text: '到雷原井場找天狗長者', lines: elder },
      { t: 'look', map: CLIFF, at: 'center', dx: -300, label: '折斷的木屐', text: '在斷羽崖找師父留下的東西（1／3）', lines: [nar('（崖邊的草叢裡，有一隻斷了齒的高木屐。）'), say('颯', '師父的。左腳那隻，帶子是我綁壞的。'), say('颯', '……他一直沒換。')] },
      { t: 'look', map: CLIFF, at: 'center', dx: -60, label: '崖壁上的刻痕', text: '在斷羽崖找師父留下的東西（2／3）', lines: [nar('（崖壁上有七道很深的刻痕。每一道底下，各刻著一個名字。）'), say('颯', '是那七個孩子。'), say('颯', '……他每年來刻一次。刻了幾百年。'), say('小雪', '刻痕旁邊，有放過花的痕跡……')] },
      { t: 'look', map: CLIFF, at: 'center', dx: 200, label: '石縫裡的白羽', text: '在斷羽崖找師父留下的東西（3／3）', lines: [nar('（石縫裡夾著一根白色的羽毛。羽根上，纏著一條褪色的紅線。）'), say('小雪', '這條線……跟我頭髮上的，是同一種結。'),
        say('颯', '所以他不是把風切羽「給」了她。'), say('颯', '她要下黃泉。沒有翅膀的人，過不了那道風。'), say('颯', '……他是把自己的命，借給她了。')] },
      { t: 'fn', map: CLIFF, text: '在斷羽崖面對崖頂的身影', run: ranFight }]; } }

  /* ============================ 汐音 ============================ */
  const BAY = 'W_R10_02', REEF = 'W_R10_05'; let TD = null, CH = null;
  const migiwa = () => [say('汀江', '妳就是澪的女兒。……眉毛像她。哭之前先皺眉，也像她。'), say('汐音', '我、我沒有要哭。'),
    say('汀江', '那年潮亂，海神發怒，共岸要沉。她自己走進海裡，說要跟海神談。'), say('汐音', '……大家都說，她是被帶走的。'), say('汀江', '是我們這樣說的。對一個六歲的孩子，說不出口「妳娘是自己選的」。'),
    { choice: [pick('妳想繼續聽嗎？', 'shion_a', 'ask', [say('汐音', '……想。蒼真，你站我旁邊。近一點。')]), pick('今天先到這裡也可以。', 'shion_a', 'rest', [say('汐音', '不行。今天不問，我就再也不敢問了。')])] },
    say('汀江', '她走之前，留了三樣東西。一樣在共岸，一樣在破船礁灣的灣底，一樣……她帶進海裡了。')];
  function tideRun(q, done) { G.DLG.start([say('汐音', '潮退了……娘的東西，在灣底。'), say('汐音', '可是這裡的潮很快就會回來。蒼真，我們用跑的。')], () => { if (SC.id !== BAY) return;
    const d = SC.def, st = d.start || [150, 690], foes = (d.foes || []).slice(0, 3);
    G.ASSET.enemies(foes).then(() => { if (SC.id !== BAY) return; for (let i = 0; i < 5; i++) { const p = (SC.snap && SC.snap(480 + i * 190, st[1] + (i % 2 ? 40 : -30), 'open', 200)) || [480 + i * 190, st[1]]; G.spawnOni(p[0], p[1], 20 + i * 10, null, foes[i % Math.max(1, foes.length)]); }
      TD = { done, t: 40 * 60, st, goal: (d.w || 1672) - 240, n: 0 }; G.UI.banner('退潮', '40 秒內走到灣底，漲潮會被推回來'); }); }); }
  function tideStep() { const f = TD; if (SC.id !== BAY) { TD = null; return; } if (G.DLG.active()) return;
    if (H.x >= f.goal) { TD = null; G.DLG.start(tideEnd(), f.done); return; }
    if (--f.t <= 0) { f.t = 40 * 60; f.n++; H.x = f.st[0]; H.y = f.st[1]; for (const P of PY.list || []) { P.x = H.x - 30; P.y = H.y + 6; } SC.shake = 8;
      G.UI.banner('漲潮了', '海水把你們推回了灣口'); if (f.n === 1) G.UI.toast('汐音：「再一次……！這次我跑前面！」'); } }
  const tideEnd = () => [nar('（灣底的石縫裡，有一個小木盒。裡面是一件沒做完的小巫女服——袖子，只縫了一邊。）'), say('汐音', '……這是六歲的尺寸。'), say('汐音', '她做到一半，就去了。'),
    { choice: [pick('她是想回來把它做完的。', 'shion_b', 'back', [say('汐音', '……嗯。針還插在上面。'), say('汐音', '沒有人會把針留在不打算回來的地方。')]),
      pick('另一邊袖子，妳自己縫吧。', 'shion_b', 'sew', [say('汐音', '……我手很笨的。會縫歪。'), say('汐音', '…………'), say('汐音', '……歪了，她也會說好看吧。')])] },
    say('汐音', '第三樣，在海裡。……蒼真，陪我去珊庭。')];
  const SONG = [['汐音', '河啊河，你從山上來——'], ['海裡的聲音', '海啊海，你把河收下——'], ['汐音', '……河不見了……'], ['海裡的聲音', '——水還在啊。']];
  function chorRun(q, done) { G.DLG.start([say('汐音', '第三樣，她帶進海裡了。我想……是她的聲音。'), say('汐音', '蒼真。我唱上半段。如果海裡有人接……你不要出聲。'), nar('（海面的光最亮的時候，點一下畫面，陪她把這一句唱完。）')],
    () => { if (SC.id !== REEF) return; if (G.AFX) G.AFX.pre(['p_shion_fx']); G.E.length = 0; CH = { done, i: 0, t: 0, hits: 0, got: 0, fl: 0 }; }); }
  const LEN = 170, PEAK = 120;
  function chorStep() { const f = CH; if (SC.id !== REEF) { CH = null; return; } if (G.E.length) G.E.length = 0; f.t++;   /* 合唱時不出怪 */ if (f.fl > 0) f.fl--;
    if (f.t >= LEN) { f.t = 0; f.got = 0; if (++f.i >= SONG.length) { CH = null; later(20, () => G.DLG.start(chorEnd(f.hits >= 4), f.done)); } } }
  function chorTap() { const f = CH; if (!f || f.got) return; f.got = 1; if (Math.abs(f.t - PEAK) <= 26) { f.hits++; f.fl = 30; } }
  function chorDraw() { const f = CH, W = G.LW, Hh = G.LH, fs = G.FS(), cx = W / 2, cy = Hh * 0.42, k = Math.min(1, f.t / PEAK), s = SONG[f.i]; if (!s) return;
    ctx.save(); const g = ctx.createLinearGradient(0, Hh * 0.55, 0, Hh); g.addColorStop(0, 'rgba(6,14,30,0)'); g.addColorStop(1, 'rgba(6,14,30,.78)'); ctx.fillStyle = g; ctx.fillRect(0, Hh * 0.55, W, Hh * 0.45);
    if (G.AFX && G.AFX.ok('p_shion_fx', 'heal_main')) { G.AFX.fr('p_shion_fx', 'heal_main', Math.floor(G.t / 5), cx, cy, { size: (150 + 260 * k) * (f.fl ? 1.25 : 1), by: 'h', anc: 'c', a: 0.35 + 0.6 * k, add: true }); }
    else { ctx.globalAlpha = 0.3 + 0.6 * k; ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.arc(cx, cy, 20 + 50 * k, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
    for (let i = 0; i < 4; i++) { const on = i < f.i || (i === f.i && f.got && f.fl), x = cx + (i - 1.5) * 26; ctx.fillStyle = i < f.i ? '#bfe8ff' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x, Hh * 0.72, on ? 6 : 4, 0, 6.283); ctx.fill(); }
    G.txt(s[0], cx, Hh * 0.79, 12, '#9fd0f0', 'center', G.FONT_S, 800); G.txt(s[1], cx, Hh * 0.86, 20, '#fff3d6', 'center', G.FONT_S, 900);
    G.txt(f.got ? (f.fl || Math.abs(f.t - PEAK) <= 40 ? '……' : '') : (Math.abs(f.t - PEAK) <= 26 ? '就是現在' : '等光最亮的時候，點一下畫面'), cx, Hh * 0.94, 11, 'rgba(255,255,255,.7)', 'center', G.FONT, 600); ctx.restore(); }
  const chorEnd = all => (all ? [say('海裡的聲音', '……汐音。長高了。')] : [nar('（歌聲停了。海面上，有一圈光慢慢靠過來。）')]).concat([say('澪的回聲', '對不起。娘選了海。'), say('汐音', '我一直以為，是我不夠乖，妳才不要我。'), say('澪的回聲', '不是。是因為有妳，娘才捨不得讓共岸沉下去。'),
    { choice: [pick('汐音，把妳想說的說出來。', 'shion_end', 'angry', [say('汐音', '娘。我很生氣。氣了十年。'), say('汐音', '可是我現在也有想守的人了。所以……我懂了。'), say('汐音', '但我還是氣。'), say('澪的回聲', '嗯。可以氣。'), say('澪的回聲', '氣到妳自己也當了娘，再來原諒我。')]),
      pick('（什麼都不說，站在她身後。）', 'shion_end', 'shore', [say('汐音', '娘。我也要自己選。'), say('汐音', '我選留在岸上。跟大家一起。妳在海裡，看著就好。'), say('澪的回聲', '好。娘在海裡，哪裡都看得到。')])] },
    nar('（海面的光，慢慢散開了。）'), say('汐音', '……蒼真。'), say('汐音', '我可以哭了嗎。'), say('蒼真', '可以。'), say('汐音', '那你轉過去。')]);
  { const q = Q.by.c10_s_shion; if (q) { q.desc = '汐音想知道，母親走進海裡那天的事。';
    q.steps = [{ t: 'talk', map: 'W_R10_01', at: 'west_arrival', dx: 160, u: 'n_migiwae', name: '汀江', text: '到泊岸漁港找汀江', lines: migiwa },
      { t: 'talk', map: 'T_ashihomura', at: 'center', dx: 120, u: 'n_p_otoku', name: '阿德婆婆', text: '回葦穗村問阿德婆婆', lines: [say('阿德婆婆', '這首歌，妳會唱上半段吧？「河啊河，你從山上來」。'), say('汐音', '會。娘只教到這裡。'),
        say('阿德婆婆', '下半段，她教給我了。她說：「等汐音自己來問，再教她。」'), say('阿德婆婆', '「海啊海，你把河收下。河不見了，水還在啊。」'), say('汐音', '…………'), say('汐音', '她早就知道，我會來問。'),
        say('小雪', '汐音，妳的手在抖。'), say('汐音', '嗯。……小雪，借我握一下。')] },
      { t: 'fn', map: BAY, text: '趁退潮走到破船礁灣的灣底', run: tideRun },
      { t: 'fn', map: REEF, text: '在三潮珊庭，陪汐音唱那首河歌', run: chorRun }]; } }

  /* ============================ 回響 ============================ */
  const C = k => qc()[k], shrine = () => SC.id === 'hub_shrine', safe = () => HT.safe();
  const EC = [
    { id: 'h1', q: 'c9_s_hayate', ok: shrine, L: () => [nar('（颯坐在鳥居上，手裡轉著那根白羽。）'), C('hayate_end') === 'lend' ? say('颯', '欠著的東西，才會記得回家。……師父大概是這個意思。') : say('颯', '兩個都活著。我說的。你也給我記住。'), say('颯', '……看什麼。我沒有在哭。是風。')] },
    { id: 'h2', q: 'c9_s_hayate', ok: () => safe() && D('c6_s_shiro') && inP('shiro') && inP('hayate'), L: () => [say('白丸', '你師父，替她擋過風。'), say('颯', '你，替她守過門。'), say('白丸', '……都沒等到。'), say('颯', '所以這次，換我們不等了。直接跟去。'), say('白丸', '……嗯。')] },
    { id: 'h3', q: 'c9_s_hayate', ok: () => safe() && !!F().ch10, L: () => [say('颯', '喂。我去掃過墳了。七個，都掃了。'), say('颯', '那個老頭也在。拿著掃把，裝作只是路過。'), say('颯', '……天狗啊，嘴都很硬。')] },
    { id: 'h4', q: 'c9_s_hayate', ok: () => SC.id === 'W_R11_01', L: () => [say('颯', '這道風……'), say('颯', '師父。你當年，就是在這裡轉身的吧。'), C('hayate_end') === 'lend' ? say('颯', '我比你多走一步。看著。') : say('颯', '我不轉身。也不借命。我帶人回去。')] },
    { id: 'h5', q: 'c9_s_hayate', ok: () => safe() && !!F().ch12, L: () => [say('颯', '蒼真。出陣前，把這個帶著。'), nar('（颯把那根白羽，塞進你的衣襟裡。）'), say('颯', '不是送你。是借你。'), say('颯', '……打完，自己拿來還。')] },
    { id: 's1', q: 'c10_s_shion', ok: shrine, L: () => [nar('（汐音坐在拜殿的台階上縫東西，指頭貼了兩塊布。）'), say('汐音', '不准看。……還沒好。'), say('汐音', '……是給小雪的。跟我那件一樣，袖子會歪。'), say('小雪', '歪的也喜歡。')] },
    { id: 's2', q: 'c10_s_shion', ok: () => SC.id === 'T_ashihomura', L: () => [nar('（河邊的孩子們在唱歌。這次，他們唱完了整首。）'), say('汐音', '下半段，是我教的喔。'), say('汐音', '……娘教阿德婆婆，阿德婆婆教我，我教他們。'), say('汐音', '這樣，河就不會不見了。')] },
    { id: 's3', q: 'c10_s_shion', ok: () => safe() && D('c6_s_shiro') && inP('shiro') && inP('shion'), L: () => [say('白丸', '等的人，沒有回來。'), say('汐音', '我的也是。'), say('汐音', '可是白丸，我們等到了別的。'), say('白丸', '……嗯。')] },
    { id: 's4', q: 'c10_s_shion', ok: () => SC.id === 'W_R11_01', L: () => [nar('（汐音走到小雪前面，站定。）'), say('汐音', '這次，我不躲後面。'), C('shion_end') === 'angry' ? say('汐音', '娘，妳看著。我還在氣，可是我會做得比妳好。') : say('汐音', '娘，妳在海裡看著。岸上的事，交給我。')] },
    { id: 's5', q: 'c10_s_shion', ok: () => safe() && !!F().ch12, L: () => [say('汐音', '蒼真。巫女服，我縫好了。'), say('汐音', '袖子……真的歪了。'), say('汐音', '可是穿起來，很暖。'), say('汐音', '打完以後，我想穿著它，去海邊給娘看。……你也來。')] }];
  let enT = 0, fired = 0, doneAt = 0; const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { enT = G.t; fired = 0; return en0(id); };
  function echo() { if (fired || G.t - enT < 160 || G.t - doneAt < 600 || G.DLG.active() || SC.trans || (G.MENU && G.MENU.open) || G.E.some(e => e.st !== 'dead')) return;
    for (const e of EC) { if (F()['he_' + e.id] || !D(e.q) || !e.ok()) continue; F()['he_' + e.id] = true; fired = 1; G.DLG.start(e.L(), () => G.SAVE.markDirty()); return; } }
  for (const id of ['c9_s_hayate', 'c10_s_shion']) { const q = Q.by[id], d0 = q && q.done; if (q) q.done = function () { doneAt = G.t; fired = 1; d0 && d0.apply(this, arguments); }; }

  /* ============================ 接線 ============================ */
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); if (G.mode !== 'play') return; try { if (RF) ranStep(); if (TD) tideStep(); if (CH) chorStep(); else if (G.t % 30 === 0) echo(); } catch (e) { console.warn('heart2', e); RF = TD = CH = null; } };
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (RF && e === RF.e && opt && opt.party && opt.party.id === 'hayate' && upwind()) mult *= 1.8; return dm0.call(this, e, mult, big, fc, opt); };
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); if (G.mode !== 'play' || G.DLG.active()) return;
    if (CH) chorDraw();
    if (RF) { const up = upwind(); G.txt('風向 ' + (RF.wind > 0 ? '→→→' : '←←←') + (up ? '　順風！颯的箭貫穿中' : '　站到上風處'), G.LW / 2, 64 * G.FS(), 13, up ? '#9ff0c0' : '#fff3d6', 'center', G.FONT_S, 900); }
    if (TD) { const s = Math.ceil(TD.t / 60); G.txt('走到灣底　剩 ' + s + ' 秒', G.LW / 2, 96 * G.FS(), 15, s <= 10 ? '#ff9a7a' : '#bfe8ff', 'center', G.FONT_S, 900); } };
  const chOn = () => CH && G.mode === 'play' && !G.DLG.active() && !(G.MENU && G.MENU.open);
  window.addEventListener('pointerdown', e => { if (chOn()) { chorTap(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  window.addEventListener('keydown', e => { if (chOn() && !e.repeat) { chorTap(); e.stopImmediatePropagation(); } }, true);
  HT.T = { rf: () => RF, td: () => TD, ch: () => CH, echo: EC };
})();
