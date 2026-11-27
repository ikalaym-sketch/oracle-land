/* ==========================================================================
 * 神諭之地 重製版 — 142_yvent.js
 * Version : r3.161.0  (2026-11-27)　r3.161.0：頭目失控抽到已搬進兩岸城的頭目（鎌鼬、河童大將）時，從城裡趕過來
 * 舊版    : r3.117.0  (2026-11-26)　r3.117.0：友軍頭目改用頭目引擎原本招式（26 B.allyStart）；友軍不畫預警；血條移到左側夥伴下方（頭像＝頭目待機圖頭部）
 * 舊版    : r3.116.0  (2026-11-26)　r3.116.0：匯出 spawnAlly（143 好感助戰用，可設停留時間）
 * 舊版    : r3.115.0  (2026-11-26)
 * 變更    : r3.115.0 新增。妖怪村頭目事件（每次進村 35% 觸發；同時只一件；每件各自隱藏冷卻、可重複；全部有對話）。
 *           1. 外敵來襲（冷卻 40 分）：隨機一位入住頭目當友軍，其餘頭目先離開村子。3 波（道摩兵＋赤鬼，等級 主角+3、血 ×1.5，第 3 波道摩術士精英）。
 *              友軍血量 <50% → 被妖氣控制：真頭目戰（滿血、攻擊 ×1.3），打到 30% 恢復清醒，回到友軍（血 50%），之後不會再被控制。
 *           2. 頭目失控（每位 30 分）：各自原因（醉酒、雷脈暴走、狐火失控……），真頭目戰打到 30% 平息，道歉＋謝禮。
 *           3. 尋找物品（每位 30 分）：頭目託付一件東西（風玉、寶皿、狐珠……），散落在該頭目章節到訪過的野外地圖；調查撿到 → 回村交還＝謝禮。
 *           4. 追世界頭目（每位 40 分，需世界頭目已開放）：頭目先出發，村裡出現「追蹤」傳點（10 分鐘）；點了＝指定世界頭目並傳送，該頭目以友軍參戰；打贏回村有道謝。
 *           ・友軍頭目：用該頭目圖集的待機／移動／攻擊動作，自動追最近的敵人，兩招輪流（單體重擊、範圍橫掃），傷害以主角攻擊計；畫面下方綠色血條。
 *           ・好感：每完成一件 save.yaff[頭目] +1（r3.116 助戰／專屬勾玉用）。
 * 存檔    : save.yev = { cd:{key:時間}, last, find:{n,item,map,got}, hunt:{n,until}, hwin }、save.yaff。
 * 依賴    : 58_forge（妖怪村住民 NPC：n.anim／hx）、22_event（EV.cur／EV.H）、26_boss（load／start／enc）、141_wboss（WB2）、52_hub（HUB.marks／travel）。
 * ========================================================================== */
'use strict';
(function () {
  const EV = G.EV, B = G.BOSS, SC = G.SC, H = G.H; if (!EV || !EV.H || !B) return;
  const X = EV.H, S = () => G.SAVE.data, F = () => G.SAVE.data.flags, HH = () => G.HERO_H, Dp = y => SC.depth(y), rnd = a => a[Math.floor(Math.random() * a.length)], say = (who, text) => ({ who, text });
  const YV = () => (S().yev = S().yev || { cd: {} }), MIN = 60000, VIL = 'T_yokai';
  /* 頭目資料：[住民名, 旗標任務, 頭目代號, 章, 圖集, 待機, 自然朝向, 大小, 物品] */
  const R = [['鎌鼬長兄', 'c1_b_patrol', 'kama', 1, 'b_kama', 'kama1_idle_left3q', -1, 1.1, '風玉'], ['河童大將', 'c2_b_mud', 'kappa', 2, 'b_kappa', 'kappataisho_idle_right3q', 1, 1.1, '寶皿'],
    ['九尾', 'c3_b_gift', 'kyubi', 3, 'b_kyubi', 'kyubi_idle_right3q', 1, 1.1, '狐珠'], ['雷獸', 'c4_b_guard', 'raiju', 4, 'b_raiju', 'raijuo_idle_right3q', 1, 1.0, '雷核'],
    ['須佐之男', 'c6_b_sword', 'susanoo', 6, 'b_susanoo', 'susanoo_p1_idle', 1, 1.15, '劍鍔'], ['長壁姬', 'c7_b_pages', 'osakabe', 7, 'b_osakabe', 'osakabe_idle_right3q', 1, 1.05, '古書頁'],
    ['酒吞童子', 'c8_b_sake', 'shuten', 8, 'b_shuten', 'shuten_idle_right3q', 1, 1.15, '酒瓢'], ['綿津見', 'c10_b_fest', 'watatsumi', 10, 'b_watatsumi', 'watatsumi_idle_right3q', 1, 1.15, '潮珠']];
  const byN = n => R.find(r => r[0] === n);
  /* ---------- 台詞 ---------- */
  const L = {
    '鎌鼬長兄': { raid: ['這陣風帶著血腥味……弟弟們，退後。我陪你出去。'], ctl: ['風……風往反方向吹了……離我遠一點！'], rec: ['……我剛剛，砍向你了？', '那股妖氣是衝著村子來的。謝了。'],
      ramp: ['三弟的藥被偷了，大哥的鐮刀停不下來！', '（長兄雙眼泛紅，旋風在村口打轉）'], sorry: ['……失態了。以為是赤鬼又回來了。'], ask: ['二弟的風玉不見了，好像是巡山時掉在杉林。'], thx: ['就是這顆。風玉在手，風路就穩了。'],
      hunt: ['山的另一頭有很重的氣息。我先過去看看，你跟上。'], hwin: ['一個人去，大概回不來吧。……多謝。'] },
    '河童大將': { raid: ['敢在我的河邊撒野？小兄弟，我們一起把他們摔出去！'], ctl: ['頭上的皿……發燙……身體不聽使喚！'], rec: ['咕……皿還在吧？還好、還好。', '剛才那是道摩的妖氣，噁心。'],
      ramp: ['黃瓜！誰偷了我的黃瓜！', '（河童大將氣得水花四濺）'], sorry: ['原來是被貓叼走的……抱歉抱歉，相撲留到下次！'], ask: ['我的寶皿被沖走了，應該在下游的河灣。'], thx: ['就是這個！沒有它我連水都喝不下。'],
      hunt: ['上游有怪東西在攪水，我去會會它！'], hwin: ['哈！兩個打一個，贏得光明正大！'] },
    '九尾': { raid: ['人與妖的村子，輪不到外人踏進來。……一起吧。'], ctl: ['狐火……不是我點的……快躲開！'], rec: ['被人操弄的感覺，真教人不快。', '你沒事吧？……那就好。'],
      ramp: ['狐火今晚……燒得太旺了……', '（九條尾巴同時燃起蒼白的火）'], sorry: ['讓你見笑了。祭典前的妖力總是不穩。'], ask: ['我託葛葉保管的狐珠，在送嫁的路上弄丟了。'], thx: ['狐珠的光……還是那麼溫柔。謝謝你。'],
      hunt: ['有一股熟悉的妖氣在呼喚我。我去去就回。'], hwin: ['替我擋下那一擊的，是你吧。我記住了。'] },
    '雷獸': { raid: ['……（尾巴劈啪作響，擋在你前面）'], ctl: ['（雷光變成黑紫色，雷獸發出痛苦的低吼）'], rec: ['……（雷光恢復成金色，低頭蹭了蹭你）'],
      ramp: ['（雷脈又開始騷動，雷獸全身炸毛）'], sorry: ['……（趴在地上，一臉抱歉）'], ask: ['（雷獸叼著你的袖子，指向雷鳴高原的方向——牠的雷核掉了）'], thx: ['（雷獸把雷核含進嘴裡，滿足地打了個呵欠）'],
      hunt: ['（雷獸朝遠方嘶吼一聲，化成雷光跑了）'], hwin: ['（雷獸把獵物分了一半給你）'] },
    '須佐之男': { raid: ['劍要常試。正好，讓我看看你又長進了多少。'], ctl: ['八岐的……怨念……不，這是別人的……！'], rec: ['我竟然被這種東西操控……', '欠你一次。'],
      ramp: ['（須佐之男在河邊試劍，劍氣失控劈向村子）'], sorry: ['太久沒認真揮劍，收不住了。抱歉。'], ask: ['我的劍鍔落在出雲的林子裡了。替我找回來吧。'], thx: ['好劍要配好鍔。謝了。'],
      hunt: ['有個不錯的對手出現了。我先去，你別太慢。'], hwin: ['痛快！下次換你跟我比一場。'] },
    '長壁姬': { raid: ['紙閣的書不能燒……村子也一樣。我來布紙結界。'], ctl: ['紙人……在笑……那不是我的紙人……'], rec: ['……我的紙，弄傷你了嗎？', '有人在紙上動了手腳。'],
      ramp: ['（長壁姬的紙人全部站起來，在村子裡亂跑）'], sorry: ['……風太大，紙人們受驚了。對不起。'], ask: ['一頁古書被風吹走了，往紙閣那邊飄。'], thx: ['就是這頁。少了它，整本書都不完整。'],
      hunt: ['書上記載的妖物出現了。我去確認一下。'], hwin: ['這一頁，就記你的名字吧。'] },
    '酒吞童子': { raid: ['好！打完這場再喝！人類，別落後啊！'], ctl: ['這酒……被下了東西……快跑……！'], rec: ['呸！誰在我的酒裡摻了道摩的符！', '……沒打傷你吧？'],
      ramp: ['再來一杯！誰攔我我就揍誰——！', '（酒吞童子醉得東倒西歪，拳頭到處亂揮）'], sorry: ['……頭好痛。我剛剛做了什麼？'], ask: ['我的酒瓢！上次赴宴落在山路上了！'], thx: ['哈哈！有了它，今晚不醉不歸！'],
      hunt: ['遠處有強者的味道。打完回來喝一杯！'], hwin: ['好拳！這一杯，敬你！'] },
    '綿津見': { raid: ['潮水退了……有東西要來了。我與你同行。'], ctl: ['海……變黑了……汐音……'], rec: ['潮已平。是你把我拉回來的。', '那股妖氣，來自黃泉的方向。'],
      ramp: ['（村口的河水突然倒灌，綿津見的眼神失去焦點）'], sorry: ['潮汐亂了一瞬。抱歉驚擾了村子。'], ask: ['一顆潮珠滾進了海邊的礁石間。'], thx: ['潮珠回來了。海會記得你。'],
      hunt: ['海那邊有東西在攪動潮汐。我先過去。'], hwin: ['河流進海，恩情也會流回來。'] } };
  const T = (n, k) => (L[n] && L[n][k]) || ['……'];
  const lines = (n, k, me) => T(n, k).map(t => /^（/.test(t) ? say(me ? '蒼真' : n, t) : say(n, t));
  /* ---------- 住民 ---------- */
  const residents = () => R.filter(r => F()['yv_' + r[1]]);
  let hidden = [];
  /* 暫離＝標記 _yh（不畫、不能交談、不走動），不從 G.NPC 拿掉（頭目戰等模組會重整 G.NPC） */
  const resAll = () => G.NPC.filter(n => n.anim && n.hx !== undefined);
  function hideOne(n) { if (n) { n._yh = 1; n.say = null; } }
  function hideAll() { resAll().forEach(hideOne); }
  function showAll() { resAll().forEach(n => { n._yh = 0; }); hidden = []; }
  const resNpc = n => resAll().find(o => o.name === n);
  const cdOk = k => (YV().cd[k] || 0) <= Date.now(), setCd = (k, m) => { YV().cd[k] = Date.now() + m * MIN; G.SAVE.markDirty(); };
  const aff = n => { if (G.YAFF) return G.YAFF.addAff(n, 1); const a = S().yaff = S().yaff || {}; a[n] = (a[n] || 0) + 1; G.SAVE.markDirty(); };
  const lvNow = () => Math.max((G.RPG.d().lv || 1), SC.def.lv || 1);
  /* ======================= 友軍頭目（r3.117.0：改用頭目引擎原本招式，B.allyStart） ======================= */
  let A = null;
  const encHp = enc => enc.units.reduce((s, u) => s + Math.max(0, u.hp), 0), encMax = enc => enc.units.reduce((s, u) => s + u.hpMax, 0);
  const liveU = enc => enc.units.find(u => u.st !== 'dead') || enc.units[0];
  function ally(r, x, y, hpk) { if (!B.allyStart) return null; const enc = B.allyStart(r[2], { x, y, hpk: hpk || 1, name: r[0] }); if (!enc) return null;
    A = { r, n: r[0], enc, get hp() { return encHp(enc); }, get hpMax() { return encMax(enc); }, get x() { const u = liveU(enc); return u ? u.x : H.x; }, get y() { const u = liveU(enc); return u ? u.y : H.y; } }; return A; }
  function dropAlly() { if (A && B.allyEnd && B.allies.includes(A.enc)) B.allyEnd(A.enc); A = null; }
  function allyStep() { if (!A) return; if (!B.allies.includes(A.enc)) { if (A.hp <= 0) G.UI.toast(A.n + '撐不住，先退下了'); A = null; return; }
    if (A.life && --A.life <= 0) { G.UI.toast(A.n + '：「後面交給你了。」'); dropAlly(); } }
  function allyDraw() {}
  /* 友軍血條：左側夥伴頭像下方，頭像＝頭目待機圖頭部 */
  function allyHud() { if (!A || G.mode !== 'play') return; const ctx = G.ctx, PY = G.PARTY, n = (PY && PY.list ? PY.list.length : 0), x = Math.min(G.SAFE.l, 6) + 8, y = G.SAFE.t + 84 + n * 58, r = 22, cx = x + r, cy = y + r;
    const D = B.DEF[A.r[2]], u = D && G.ANIM.get(D.unit), cl = u && u.act[D.actors[0].id + '_idle_' + D.dir], f = cl && cl.f[0], im = f && u.imgs[f[7] || 0];
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fillStyle = 'rgba(14,22,14,.85)'; ctx.fill(); ctx.clip();
    if (im) { const sw = f[2] * 0.62; ctx.drawImage(im, f[0] + f[2] * 0.19, f[1] + f[3] * 0.03, sw, sw, cx - r, cy - r, r * 2, r * 2); } else G.txt(A.n[0], cx, cy + 1, 18, '#e8f5e0', 'center', G.FONT_S, 900);
    ctx.restore(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(127,211,106,.85)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
    G.txt(A.n, x + r * 2 + 6, y + 6, 10, '#bfe8b0', 'left', G.FONT_S, 900);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + r * 2 + 6, y + 14, 56, 5); ctx.fillStyle = '#7fd36b'; ctx.fillRect(x + r * 2 + 6, y + 14, 56 * Math.max(0, A.hp) / Math.max(1, A.hpMax), 5);
    if (A.life) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + r * 2 + 6, y + 23, 56, 3); ctx.fillStyle = '#e3c27a'; ctx.fillRect(x + r * 2 + 6, y + 23, 56 * A.life / (A.life0 || A.life), 3); } }
  /* ======================= 真頭目戰（控制／失控）：打到 30% 結束 ======================= */
  let CF = null;   // { r, onEnd }
  function bossFight(r, x, y, k, onEnd) { const D = B.DEF[r[2]]; if (!D) { onEnd && onEnd(); return; }
    Promise.resolve(B.load(r[2])).then(() => G.ASSET.enemies(D.foes || [])).then(() => { const enc = B.start(r[2], { x, y, lv: lvNow() + 2, sub: k.sub, onWin: () => {} }); if (!enc) { onEnd && onEnd(); return; }
      enc.name = r[0] + (k.tag || ''); for (const u of enc.units) { u.hp = u.hpMax = Math.round(u.hpMax * (k.hp || 1)); u.atk = Math.round(u.atk * (k.atk || 1)); } CF = { r, enc, onEnd }; G.UI.banner(enc.name, k.sub); })
      .catch(e => { console.warn('yvent boss', e); onEnd && onEnd(); }); }
  function cfStep() { if (!CF) return; const enc = CF.enc; if (B.enc !== enc) { const f = CF.onEnd; CF = null; f && f(); return; }
    const hp = enc.units.reduce((s, u) => s + Math.max(0, u.hp), 0), mx = enc.units.reduce((s, u) => s + u.hpMax, 0); if (hp > mx * 0.3) return;
    enc.done = true; try { enc.D.finish && enc.D.finish(enc); } catch (e) {} G.E = G.E.filter(e => !enc.units.includes(e)); B.enc = null; B.tg.length = 0; B.zones.length = 0; B.proj.length = 0; B.fx.length = 0;
    const f = CF.onEnd; CF = null; f && f(); }
  /* ======================= 事件 ======================= */
  let CUR = null;
  /* 1. 外敵來襲 */
  function raid() { const rs = residents(); if (!rs.length) return false; const r = rnd(rs), np = resNpc(r[0]), p0 = np ? [np.x, np.y] : [H.x + 80, H.y];
    const c = CUR = { k: 'raid', n: '外敵來襲', lv: lvNow() + 3, t: 0, r }; hideAll(); setCd('raid', 40); YV().last = Date.now();
    Promise.resolve(G.ANIM.load(r[4])).then(() => B.load(r[2])).then(() => { if (CUR !== c || SC.id !== VIL) return; ally(r, p0[0], p0[1]);
      G.DLG.start([say('天狗長者', '不好了！道摩的兵和赤鬼從谷口殺進來了！'), ...lines(r[0], 'raid')], () => { if (CUR !== c) return; EV.cur = c; const f = X.DOMA.concat(['akaoni']);
        c.obj = () => '外敵來襲：守住妖怪村（第 ' + (c.wi + 1) + '／3 波）' + (c.ctl ? '　友軍被控制了！' : '');
        X.waves(c, [[f, 6], [f, 8], [f, 6, { elite: 'doma_ritualist', ek: 6 }]], () => endRaid(c)); }); }).catch(() => { showAll(); CUR = null; });
    c.step = () => { for (const e of G.E) if (e.ev && !e._y15 && e.st !== 'dead') { e._y15 = 1; e.hp = e.hpMax = Math.round(e.hpMax * 1.5); }
      if (A && !c.ctlDone && A.hp < A.hpMax * 0.5) control(c); };
    return true; }
  function control(c) { const a = { r: A.r, n: A.n, x: A.x, y: A.y }; c.ctlDone = 1; c.ctl = 1; dropAlly(); G.SC.shake = 8; if (G.ICO && G.ICO.burst) G.ICO.burst({ x: a.x, y: a.y }, 'fxp_petal_spider', 10, { z: 0.6 });
    G.DLG.start(lines(a.n, 'ctl'), () => bossFight(a.r, a.x, a.y, { sub: '被妖氣控制', tag: '（失控）', hp: 1, atk: 1.3 }, () => { c.ctl = 0;
      G.DLG.start(lines(a.n, 'rec')); ally(a.r, a.x, a.y, 0.5); })); }
  function endRaid(c) { if (c.done) return; X.reward({ lv: c.lv }, 3.5, 2, 4); aff(c.r[0]); const n = A ? A.n : c.r[0];
    G.DLG.start([say('天狗長者', '退了……全退了！'), say(n, A ? '村子還在。這就夠了。' : '……我也該好好鍛鍊了。')], () => { dropAlly(); showAll(); });
    X.finish(c, '守住了妖怪村', '妖玉 +4'); CUR = null; }
  /* 2. 頭目失控 */
  function ramp() { const rs = residents().filter(r => cdOk('ramp_' + r[0])); if (!rs.length) return false; const r = rnd(rs), np = resNpc(r[0]) || (G.HWR && G.HWR.visitor(r)); if (!np) return false;   // r3.161.0：搬進兩岸城的頭目從城裡趕來
    setCd('ramp_' + r[0], 30); YV().last = Date.now(); const c = CUR = { k: 'ramp', r };
    G.DLG.start(lines(r[0], 'ramp'), () => { hideOne(np);
      bossFight(r, np.x, np.y, { sub: '失控・打到 30% 讓牠清醒', tag: '（失控）', hp: 0.8 }, () => { showAll(); X.reward({ lv: lvNow() }, 2.5, 2, 2); aff(r[0]); G.DLG.start(lines(r[0], 'sorry').concat([say('', '（收到謝禮）')])); CUR = null; }); });
    return true; }
  /* 3. 尋找物品 */
  function fieldMaps(ch) { const s = S().seen || {}, ids = (G.WORLD.chapters[ch] || (ch === 1 ? ['W_R01_03', 'W_R01_04'] : [])); return ids.filter(id => { const d = G.D.scenes[id]; return d && !d.boss && !d.safe && s[id]; }); }
  function find() { const y = YV(); if (y.find) return false; const rs = residents().filter(r => cdOk('find_' + r[0]) && fieldMaps(r[3]).length); if (!rs.length) return false; const r = rnd(rs), map = rnd(fieldMaps(r[3]));
    setCd('find_' + r[0], 30); y.last = Date.now(); y.find = { n: r[0], item: r[8], map, got: 0 }; G.SAVE.markDirty();
    G.DLG.start(lines(r[0], 'ask').concat([say('蒼真', '我去找找看。'), say('', '（' + r[8] + '在「' + ((G.D.scenes[map] || {}).name || map) + '」）')]));
    return true; }
  function findMark() { const f = YV().find; if (!f || f.got || SC.id !== f.map || !G.HUB) return; if (G.HUB.marks.some(m => m.id === 'yfind')) return;
    const d = SC.def, c = (d.nodes || {}).center || d.start || [d.w / 2, d.h * 0.6], p = (SC.snap && SC.snap(c[0] + 220, c[1] + 40, 'open', 300)) || c;
    G.HUB.marks.push({ id: 'yfind', q: 1, x: p[0], y: p[1], label: f.item, kind: 'look', main: false, run: () => { f.got = 1; G.SAVE.markDirty(); G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'yfind'); G.UI.banner('找到了　' + f.item, '帶回妖怪村交給' + f.n); } }); }
  /* 4. 追世界頭目 */
  function hunt() { if (!G.WB2 || !G.WB2.pool) return false; const y = YV(); if (y.hunt) return false; const rs = residents().filter(r => cdOk('hunt_' + r[0])); if (!rs.length || !G.WB2.pool().length) return false;
    const r = rnd(rs); setCd('hunt_' + r[0], 40); y.last = Date.now(); y.hunt = { n: r[0], until: Date.now() + 10 * MIN }; G.SAVE.markDirty();
    hideOne(resNpc(r[0]));
    G.DLG.start(lines(r[0], 'hunt').concat([say('', '（村子中央出現了追蹤用的妖氣傳點，10 分鐘內有效）')])); return true; }
  function huntMark() { const h = YV().hunt; if (!h || SC.id !== VIL || !G.HUB) return; if (h.until < Date.now()) { YV().hunt = null; G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'yhunt'); return; }
    if (G.HUB.marks.some(m => m.id === 'yhunt')) return; const d = SC.def, c = (d.nodes || {}).center || d.start || [836, 600], p = (SC.snap && SC.snap(c[0], c[1] + 60, 'open', 300)) || c;
    G.HUB.marks.push({ id: 'yhunt', q: 1, x: p[0], y: p[1], label: '追蹤・' + h.n, kind: 'look', main: false, run: () => { const L2 = G.WB2.pool(); if (!L2.length) return G.UI.toast('感應不到了……'); const q = rnd(L2), t = Date.now();
      S().wb2 = { id: q.id, map: rnd(q.maps), n: (q.ph ? '幻影・' : '') + B.DEF[q.id].name, ph: q.ph, until: t + 10 * MIN, next: t + 30 * MIN, done: 0, ally: h.n }; YV().hunt = null; G.SAVE.markDirty();
      G.HUB.marks = G.HUB.marks.filter(m => m.id !== 'yhunt'); G.WB2.goBoss(); } }); }
  /* ---------- 進圖 ---------- */
  function onVillage() { const y = YV();
    const f = y.find; if (f && f.got) { const r = byN(f.n); y.find = null; X.reward({ lv: lvNow() }, 2, 2, 2); aff(f.n); G.DLG.start([say('蒼真', '這是你要的' + f.item + '。')].concat(lines(f.n, 'thx'))); return; }
    if (y.hwin) { const n = y.hwin; y.hwin = null; aff(n); G.DLG.start(lines(n, 'hwin')); return; }
    if (y.hunt && y.hunt.until > Date.now()) { G.STORY.later(30, () => hideOne(resNpc(y.hunt.n))); return; }
    if (CUR || !residents().length || (y.last || 0) > Date.now() - 5 * MIN || Math.random() >= 0.35) return;
    const L2 = [cdOk('raid') && raid, ramp, find, hunt].filter(Boolean); for (let i = L2.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L2[i], L2[j]] = [L2[j], L2[i]]; }
    for (const fn of L2) if (fn()) break; }
  (function hk() { if (!G.STORY || !G.STORY.onEnter || !G.drawLoot || !G.heroStep) return setTimeout(hk, 60);
    const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { const r = en0(id); if (CUR && CUR.k === 'raid' && id !== VIL) { CUR = null; } A = null; CF = null; hidden = [];
      const w = S().wb2; if (w && w.ally && w.map === id && !w.done) G.STORY.later(160, () => { const r2 = byN(w.ally); if (r2 && SC.id === id) Promise.resolve(B.load(r2[2])).then(() => { if (SC.id === id) ally(r2, H.x - 80, H.y + 10); }); });
      if (id === VIL) G.STORY.later(90, () => { if (SC.id === VIL && !G.DLG.active()) onVillage(); }); return r; };
    const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments); try { allyStep(); cfStep(); const w = S().wb2; if (w && w.ally && w.done && !w._th) { w._th = 1; YV().hwin = w.ally; G.SAVE.markDirty(); dropAlly(); }
        if (G.t % 30 === 0) { findMark(); huntMark(); } } catch (e) { console.warn('yvent', e); } return r; };
    const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n && n._yh) return; return dn0.apply(this, arguments); };
    const st1 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { for (const n of G.NPC) if (n._yh) { n.tx = null; n.walking = false; n.say = null; } st1(); for (const n of G.NPC) if (n._yh) n.say = null; if (G.UI.near && G.NPC.some(n => n._yh && G.UI.near.label && G.UI.near.label.indexOf(n.name) === 0)) G.UI.near = null; };
    const dl0 = G.drawLoot; G.drawLoot = function () { dl0.apply(this, arguments); try { allyDraw(); } catch (e) {} };
    const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); try { allyHud(); } catch (e) {} }; })();
  G.YVENT = { spawnAlly: (r, x, y, hpk, life) => { if (A) return null; const a = ally(r, x, y, hpk); if (a && life) { a.life = life; a.life0 = life; } return a; }, hid: () => hidden, R, L, raid, ramp, find, hunt, onVillage, ally: () => A, cur: () => CUR, residents };
})();
